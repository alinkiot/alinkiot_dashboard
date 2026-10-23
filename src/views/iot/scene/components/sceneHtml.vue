<template>
  <div v-loading="loading" class="html-root" :class="{ 'device-html-root': device }">
    <MqttBoard
      v-if="!device && mqttSubscriptions.length"
      :subscription="mqttSubscriptions"
      @doMqttMessage="handleMqttMessage"
    />
    <el-row :gutter="10" v-if="edit">
      <el-col class="mb8">
        <el-button
          type="primary"
          icon="el-icon-upload"
          size="mini"
          @click="openSelector = true"
          v-hasPermi="['system:scene:edit']">
          <span v-if="scene_data">编辑页面</span>
          <span v-else>上传页面</span>
        </el-button>
      </el-col>
    </el-row>

    <div class="html-box">
      <el-empty description="暂无内容，请上传HTML页面" v-if="!src" />
      <iframe
        v-else-if="src"
        :src="src"
        :style="device ? { height: frameHeight + 'px' } : null"
        @load="handleFrameLoad"
        sandbox="allow-scripts allow-forms allow-popups"
        allow="fullscreen"
        allowfullscreen
        frameborder="no"
        scrolling="auto"
        class="html-frame"
      />
      <el-empty v-else-if="!loading" description="页面加载失败" />
    </div>

    <el-dialog title="上传页面" :visible.sync="openSelector" append-to-body>
      <el-form ref="form" :model="form" label-width="100px">
        <el-form-item label="HTML文件">
          <FileUpload
            :limit="1"
            :fileType="['html', 'htm']"
            :fileSize="20"
            :value="form.path"
            replaceExisting
            @input="handleFile"
          />
          <div class="sdk-help">
            SDK 不会自动注入。请在 HTML 中手动引入
            <code>&lt;script src="/scene-sdk.js?v=1.1.0"&gt;&lt;/script&gt;</code>。
            如果 HTML 与 Dashboard 不同域，请将脚本地址改为 Dashboard 的完整地址。
            Vue 项目请先构建为静态页面。页面中可使用
            <code>window.SceneSDK</code>：
            <code>getDevices(options)</code>、
            <code>getDeviceStatus(deviceId)</code>、
            <code>getDeviceProduct(deviceId)</code>、
            <code>getDeviceLatestRecord(deviceId)</code>、
            <code>getDeviceHistory(deviceId, options)</code>。
            实时订阅使用 <code>subscribeDeviceStatus(deviceId, callback)</code>。
            方法返回 Promise，设备 ID 必须属于当前场景。
            <pre>&lt;script src="/scene-sdk.js?v=1.1.0"&gt;&lt;/script&gt;
SceneSDK.getDevices().then(({ rows }) =&gt; console.log(rows))
SceneSDK.getDeviceStatus(deviceId).then(console.log)
SceneSDK.getDeviceProduct(deviceId).then(console.log)
SceneSDK.getDeviceLatestRecord(deviceId).then(console.log)
SceneSDK.getDeviceHistory(deviceId, { pageSize: 100 }).then(console.log)
SceneSDK.subscribeDeviceStatus(deviceId, data =&gt; console.log('实时数据', data))
  .then(unsubscribe =&gt; { /* 不再需要时调用 unsubscribe() */ })</pre>
          </div>
        </el-form-item>
        <el-form-item label="标题">
          <el-input v-model="form.caption" placeholder="选填"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button size="mini" v-if="scene_data" icon="el-icon-delete" type="danger" @click="deleteScene">删除</el-button>
        <el-button size="mini" icon="el-icon-success" type="primary" @click="submitForm">保存</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { createObject, queryObject, updateObject, delObject } from "@/api/iot/table";
import FileUpload from "@/components/FileUpload/index.vue";
import MqttBoard from "@/components/MqttBoard/index.vue";
import { isExternal } from "@/utils/validate";
import { getObject, getDevHisLast, queryDevByScene, queryDevStatus, queryObject as queryTable } from "@/api/iot/table";
import { deviceControl } from "@/api/iot/system";

export default {
  dicts: [],
  components: { FileUpload, MqttBoard },
  props: {
    scene: {
      type: Object,
      default: null
    },
    scene_key: {
      type: String,
      default: ""
    },
    device: {
      type: Object,
      default: null
    },
    htmlPath: {
      type: String,
      default: ""
    },
    realtimeData: {
      type: Object,
      default: null
    },
    edit: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      loading: false,
      frameHeight: 360,
      controlPending: false,
      frameGeneration: 0,
      openSelector: false,
      scene_data: undefined,
      form: {},
      mqttSubscriptions: [],
      realtimeSubscribers: {}
    };
  },
  computed: {
    // 将存储的相对路径解析为可嵌入的完整地址
    src() {
      const path = this.device ? this.htmlPath : this.form && this.form.path;
      if (!path) {
        return "";
      }
      // FileUpload 以逗号拼接多个文件，这里只取第一个
      const real = String(path).split(",")[0];
      if (!real) {
        return "";
      }
      if (isExternal(real)) {
        return real;
      }
      let baseUrl = process.env.VUE_APP_BASE_API;
      if (document.location.protocol === "https:") {
        baseUrl = baseUrl.replace("http:", "https:");
      }
      return baseUrl + real;
    }
  },
  created() {
    this.getSceneData();
  },
  mounted() {
    window.addEventListener("message", this.handleSdkMessage);
  },
  beforeDestroy() {
    window.removeEventListener("message", this.handleSdkMessage);
    this.realtimeSubscribers = {};
    this.mqttSubscriptions = [];
  },
  methods: {
    getSceneData() {
      this.realtimeSubscribers = {};
      this.updateMqttSubscriptions();
      if (this.device || !this.scene) return;
      const query = {
        scene: this.scene.id,
        sceneType: this.scene_key
      };
      this.loading = true;
      this.scene_data = undefined;
      this.form = {};
      queryObject("scene_view", query).then(response => {
        const items = response.data;
        if (items.length > 0) {
          this.scene_data = items[0];
          this.form = JSON.parse(this.scene_data.data);
        }
        this.loading = false;
      }).catch(() => {
        this.loading = false;
      });
    },
    async handleSdkMessage(event) {
      if (!this.$el || !this.$el.querySelector("iframe") ||
          event.source !== this.$el.querySelector("iframe").contentWindow) {
        return;
      }
      const message = event.data;
      if (message && message.type === "scene-sdk-resize") {
        if (this.device && typeof message.height === "number" && Number.isFinite(message.height)) {
          this.frameHeight = Math.min(Math.max(Math.ceil(message.height), 360), 30000);
        }
        return;
      }
      if (!message || message.type !== "scene-sdk-request") {
        return;
      }
      let result;
      let error;
      try {
        switch (message.method) {
          case "getDevices":
            result = await this.getSceneDevices(message.args || {});
            break;
          case "getDeviceStatus":
            result = await this.getSceneDeviceStatus(message.args && message.args.deviceId);
            break;
          case "getDeviceProduct":
            result = await this.getSceneDeviceProduct(message.args && message.args.deviceId);
            break;
          case "getDeviceLatestRecord":
            result = await this.getSceneDeviceLatestRecord(message.args && message.args.deviceId);
            break;
          case "getDeviceHistory":
            result = await this.getSceneDeviceHistory(
              message.args && message.args.deviceId,
              (message.args && message.args.options) || {}
            );
            break;
          case "controlDevice":
            result = await this.controlSceneDevice(message.args || {}, event.source);
            break;
          case "subscribeDeviceStatus":
            result = await this.subscribeSceneDevice(message.args && message.args.deviceId, message.args && message.args.subscriptionId);
            break;
          case "unsubscribeDeviceStatus":
            result = this.unsubscribeSceneDevice(message.args && message.args.subscriptionId);
            break;
          default:
            throw new Error("不支持的 SDK 方法");
        }
      } catch (requestError) {
        error = requestError && requestError.message ? requestError.message : "SDK 请求失败";
      }
      event.source.postMessage({
        type: "scene-sdk-response",
        requestId: message.requestId,
        result,
        error
      }, "*");
    },
    async getSceneDevices(options) {
      if (this.device) {
        const pageNum = Math.max(Number(options.pageNum) || 1, 1);
        const status = await this.getSceneDeviceStatus(this.device.id);
        return {
          total: 1,
          rows: pageNum === 1 ? [{
            ...status.device,
            onlineStatus: status.onlineStatus,
            latestData: status.latestData
          }] : []
        };
      }
      const pageNum = Math.max(Number(options.pageNum) || 1, 1);
      const pageSize = Math.min(Math.max(Number(options.pageSize) || 100, 1), 1000);
      const response = await queryDevByScene({
        scene: this.scene.id,
        pageNum,
        pageSize,
        "orderby[desc]": "createTime"
      });
      const devices = response.rows || [];
      if (!devices.length) {
        return { total: response.total || 0, rows: [] };
      }
      const addresses = devices.map(device => device.addr).filter(Boolean);
      if (!addresses.length) {
        return {
          total: response.total || 0,
          rows: devices.map(device => ({ ...device, onlineStatus: null, latestData: null }))
        };
      }
      const [statusResponse, latestResponse] = await Promise.all([
        queryDevStatus(addresses.join(",")),
        getDevHisLast({ addr: addresses.join(","), batch: true })
      ]);
      const statuses = (statusResponse.data || []).reduce((map, item) => {
        map[item.addr] = item;
        return map;
      }, {});
      const latestRows = Array.isArray(latestResponse.data)
        ? latestResponse.data
        : [latestResponse.data];
      const latest = latestRows.reduce((map, item) => {
        if (item && item.addr) map[item.addr] = item;
        return map;
      }, {});
      return {
        total: response.total || 0,
        rows: devices.map(device => ({
          ...device,
          onlineStatus: statuses[device.addr] || null,
          latestData: latest[device.addr] || null
        }))
      };
    },
    async getSceneDeviceStatus(deviceId) {
      const device = await this.getSceneDevice(deviceId);
      const [statusResponse, latestResponse] = await Promise.all([
        queryDevStatus(device.addr),
        getDevHisLast({ addr: device.addr })
      ]);
      return {
        device,
        onlineStatus: (statusResponse.data || [])[0] || null,
        latestData: latestResponse.data || null
      };
    },
    async getSceneDeviceProduct(deviceId) {
      const device = await this.getSceneDevice(deviceId);
      if (!device.product) {
        return { device, product: null };
      }
      const productId = typeof device.product === "object" ? device.product.id : device.product;
      const response = await getObject("product", productId);
      const product = response.data;
      const parseArray = (value, field) => {
        if (!value) return [];
        let parsed = value;
        if (typeof value === "string") {
          try {
            parsed = JSON.parse(value);
          } catch (error) {
            throw new Error("产品 " + field + " 数据格式无效");
          }
        }
        if (!Array.isArray(parsed)) {
          throw new Error("产品 " + field + " 必须是数组");
        }
        return parsed;
      };
      product.thing = parseArray(product.thing, "物模型");
      product.cmd = parseArray(product.control, "控制指令");
      let config = product.config;
      if (typeof config === "string" && config) {
        try {
          config = JSON.parse(config);
        } catch (error) {
          throw new Error("产品扩展配置数据格式无效");
        }
      }
      const supportImport = Array.isArray(config)
        ? config.find(item => item && item.name === "supportImport")
        : null;
      product.supportImport = !!(supportImport && supportImport.value);
      return { device, product };
    },
    async getSceneDeviceLatestRecord(deviceId) {
      const device = await this.getSceneDevice(deviceId);
      const response = await getDevHisLast({ addr: device.addr });
      return response.data || null;
    },
    async controlSceneDevice(args, source) {
      if (this.controlPending) throw new Error("已有控制请求等待处理");
      this.controlPending = true;
      const frame = this.$el.querySelector("iframe");
      const originalSrc = this.src;
      const generation = this.frameGeneration;
      const scopeId = this.device ? this.device.id : this.scene && this.scene.id;
      const assertCurrentFrame = () => {
        const current = this.$el && this.$el.querySelector("iframe");
        const currentScope = this.device ? this.device.id : this.scene && this.scene.id;
        if (this._isDestroyed || current !== frame || !current ||
            current.contentWindow !== source || this.src !== originalSrc || currentScope !== scopeId ||
            this.frameGeneration !== generation) {
          throw new Error("面板已切换，请重新发起控制请求");
        }
      };
      try {
        if (typeof args.name !== "string" || !args.name.trim()) {
          throw new Error("控制字段不能为空");
        }
        const { device, product } = await this.getSceneDeviceProduct(args.deviceId);
        assertCurrentFrame();
        if (!device.addr || !product) throw new Error("设备地址或产品配置缺失");
        const command = product.cmd.find(item => item.name === args.name);
        const property = product.thing.find(item =>
          item.name === args.name && (item.access === "rw" || item.access === "write")
        );
        const definition = command || property;
        if (!definition) throw new Error("该字段不是产品配置的控制指令或可写属性");
        const format = command ? command.format : property.type;
        if (!["integer", "float", "string", "hex"].includes(format)) {
          throw new Error("控制字段的数据类型未配置或不受支持");
        }
        let value = args.value;
        if ((typeof value !== "string" && typeof value !== "number") || value === "") {
          throw new Error("下发值必须是非空字符串或数字");
        }
        if (format === "integer" || format === "float") {
          if (typeof value === "string" && !value.trim()) throw new Error("下发值不能为空");
          value = Number(value);
          if (!Number.isFinite(value) || (format === "integer" && !Number.isSafeInteger(value))) {
            throw new Error("下发值不符合产品配置的数据类型");
          }
          if (definition.min !== undefined && definition.min !== "" && value < Number(definition.min) ||
              definition.max !== undefined && definition.max !== "" && value > Number(definition.max)) {
            throw new Error("下发值超出产品配置范围");
          }
        } else {
          value = String(value);
          if (format === "hex" && !/^(?:[0-9a-fA-F]{2})+$/.test(value)) {
            throw new Error("HEX 下发值必须为完整字节的十六进制字符串");
          }
        }
        if (command && command.ctrlType === "btn" && String(value) !== String(command.value)) {
          throw new Error("按钮指令仅允许下发配置的预设值");
        }
        if (command && command.ctrlType === "enum" &&
            !(command.options || []).some(option => String(option.value) === String(value))) {
          throw new Error("下发值不在控制指令的枚举选项中");
        }
        try {
          await this.$confirm(
            "设备：" + (device.name || device.addr) + "；字段：" +
            (definition.title || args.name) + "；下发值：" + value,
            "确认设备控制",
            { type: "warning", confirmButtonText: "确认下发", cancelButtonText: "取消", closeOnClickModal: false }
          );
        } catch (error) {
          if (error === "cancel" || error === "close") throw new Error("已取消控制请求");
          throw error;
        }
        assertCurrentFrame();
        await this.getSceneDevice(args.deviceId);
        assertCurrentFrame();
        await deviceControl(encodeURIComponent(device.addr), {
          type: "write", name: args.name, value, format
        });
        return { submitted: true, deviceId: device.id, name: args.name, value, format };
      } finally {
        this.controlPending = false;
      }
    },
    async getSceneDeviceHistory(deviceId, options) {
      const device = await this.getSceneDevice(deviceId);
      const pageNum = Math.max(Number(options.pageNum) || 1, 1);
      const pageSize = Math.min(Math.max(Number(options.pageSize) || 10, 1), 500);
      const params = {
        addr: device.addr,
        pageNum,
        pageSize,
        type: "table",
        "orderBy[desc]": "createTime"
      };
      if (options.begin) params["createTime[begin]"] = options.begin;
      if (options.end) params["createTime[end]"] = options.end;
      if (options.step) params.step = options.step;
      const response = await queryTable("history", params);
      return { total: response.total || 0, rows: response.rows || [] };
    },
    async getSceneDevice(deviceId) {
      if (deviceId === undefined || deviceId === null || deviceId === "") {
        throw new Error("设备 ID 不能为空");
      }
      if (this.device) {
        if (String(deviceId) !== String(this.device.id)) {
          throw new Error("仅允许访问当前设备");
        }
        return {
          ...this.device,
          product: this.device.product && typeof this.device.product === "object"
            ? this.device.product.id
            : this.device.product
        };
      }
      const response = await getObject("device", deviceId);
      const device = response.data;
      const sceneDevices = await queryTable("scene_device", {
        scene: this.scene.id,
        device: deviceId,
        pageNum: 1,
        pageSize: 1
      });
      if (!(sceneDevices.rows || []).length) {
        throw new Error("设备不属于当前场景");
      }
      return device;
    },
    async subscribeSceneDevice(deviceId, subscriptionId) {
      const device = await this.getSceneDevice(deviceId);
      if (!subscriptionId) {
        throw new Error("实时订阅 ID 缺失");
      }
      if (!device.addr) {
        throw new Error("设备地址为空，无法订阅实时状态");
      }
      this.$set(this.realtimeSubscribers, subscriptionId, {
        deviceId: device.id,
        addr: device.addr
      });
      this.updateMqttSubscriptions();
      return { subscriptionId };
    },
    unsubscribeSceneDevice(subscriptionId) {
      if (subscriptionId) {
        this.$delete(this.realtimeSubscribers, subscriptionId);
        this.updateMqttSubscriptions();
      }
      return { unsubscribed: true };
    },
    updateMqttSubscriptions() {
      const topics = Array.from(new Set(
        Object.keys(this.realtimeSubscribers).map(id => this.realtimeSubscribers[id].addr)
      ));
      this.mqttSubscriptions = topics.map(addr => ({ topic: "p/out/" + addr, qos: 0 }));
    },
    handleFrameLoad() {
      this.frameGeneration++;
      this.realtimeSubscribers = {};
      this.updateMqttSubscriptions();
    },
    handleMqttMessage(topic, message) {
      let data;
      try {
        data = JSON.parse(message);
      } catch (error) {
        data = message;
      }
      const addr = topic.slice(topic.lastIndexOf("/") + 1);
      Object.keys(this.realtimeSubscribers).forEach(subscriptionId => {
        const subscription = this.realtimeSubscribers[subscriptionId];
        if (subscription.addr !== addr || topic !== "p/out/" + subscription.addr) return;
        const frame = this.$el.querySelector("iframe");
        if (frame && frame.contentWindow) {
          frame.contentWindow.postMessage({
            type: "scene-sdk-event",
            event: "device-status",
            subscriptionId,
            deviceId: subscription.deviceId,
            topic,
            data
          }, "*");
        }
      });
    },
    handleFile(path) {
      this.$set(this.form, "path", path);
    },
    submitForm() {
      if (!this.form.path) {
        this.$modal.msgError("请先上传 HTML 页面");
        return;
      }
      const post = {
        scene: this.scene.id,
        sceneType: this.scene_key,
        data: JSON.stringify(this.form)
      };
      if (this.scene_data) {
        post.id = this.scene_data.id;
        updateObject("scene_view", post).then(() => {
          this.openSelector = false;
          this.getSceneData();
          this.$modal.msgSuccess("修改成功");
        });
      } else {
        createObject("scene_view", post).then(() => {
          this.openSelector = false;
          this.getSceneData();
          this.$modal.msgSuccess("创建成功");
        });
      }
    },
    deleteScene() {
      if (!this.scene_data) {
        return;
      }
      delObject("scene_view", this.scene_data.id).then(() => {
        this.openSelector = false;
        this.$modal.msgSuccess("删除成功");
        this.getSceneData();
      });
    }
  },
  watch: {
    realtimeData(data) {
      if (this.device && data) {
        this.handleMqttMessage("p/out/" + this.device.addr, JSON.stringify(data));
      }
    },
    scene() {
      this.getSceneData();
    },
    scene_key() {
      this.getSceneData();
    }
  }
};
</script>

<style lang="scss" scoped>
.html-root {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.html-box {
  flex: 1;
  width: 100%;
  max-width: 100%;
  min-height: 0;
  overflow: hidden;
}

.html-frame {
  width: 100%;
  height: 100%;
  min-height: 360px;
  border: 0;
}

.device-html-root {
  height: auto;

  .html-box {
    flex: none;
  }

  .html-frame {
    display: block;
  }
}

.sdk-help {
  margin-top: 6px;
  color: #909399;
  font-size: 12px;
  line-height: 1.8;

  code {
    padding: 1px 4px;
    border-radius: 3px;
    background: rgba(127, 127, 127, 0.12);
  }

  pre {
    margin: 6px 0 0;
    padding: 8px;
    border-radius: 4px;
    background: rgba(127, 127, 127, 0.08);
    white-space: pre-wrap;
  }
}
</style>
