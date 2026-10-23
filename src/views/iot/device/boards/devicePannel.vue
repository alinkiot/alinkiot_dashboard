<template>
  <div v-loading="loading">
    <SceneHtml
      v-if="product && product.category !== 'default' && htmlPanel && device"
      :key="device.id + ':' + htmlPanel"
      :device="device"
      :html-path="htmlPanel"
      :realtime-data="recvData"
    />
    <DefaultBox
      v-else-if="product && product.category === 'default'"
      :device="device"
      :data="devData"
      :env="env"
      :protocol="protocol"
      :showImport="showImport && !!(product && product.supportImport)"
      @sendData="sendData"/>
    <el-empty
      v-else-if="!loading"
      description="当前产品面板未定义，请将产品面板切换为通用面板（default），或在产品面板字典（iot_product_mgr）中上传并选择对应的 HTML 面板。"
    />
  </div>
</template>
<script>

import {getDevHisLast, getObject} from "@/api/iot/table";
import { deviceControl } from "@/api/iot/system";
import DefaultBox from "../boards/defaultBox.vue";
import SceneHtml from "@/views/iot/scene/components/sceneHtml.vue";
import { parseMediaDict } from "@/utils/dict/media";


export default {
  dicts: ['iot_product_mgr'],
  components: {
    SceneHtml,
    DefaultBox
  },
  props: {
    devId: {
      type: [String, Number]
    },
    recvData: {
      type: Object,
      default: function() { return undefined }
    },
    env: {
      type: Object,
      default: function (){ return {} }
    },
    protocol:String,
    showImport: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      loading : false,
      device : undefined,
      product : undefined,
      devData: undefined
    };
  },
  computed: {
    htmlPanel() {
      if (!this.product) return "";
      const panels = this.dict.type.iot_product_mgr.filter(item =>
        item.raw && item.raw.listClass === "file"
      );
      const panel = panels.find(item => item.value === this.product.category);
      try {
        if (panel) {
          const media = parseMediaDict(panel.raw);
          return media.type === "html" ? media.path : "";
        }
        return "";
      } catch (error) {
        console.error("产品面板字典格式无效", error);
        return "";
      }
    }
  },
  created() {
    this.queryDevice();
  },
  methods: {
    // 从 product.control 解析控制指令数组
    parseCmd(product) {
      if (!product.control) return [];
      try {
        const arr = JSON.parse(product.control);
        return Array.isArray(arr) ? arr : [];
      } catch (e) {
        return [];
      }
    },
    // 从 product.config 扩展字段中找 name=supportImport 的元素，取其 value
    parseSupportImport(config) {
      if (!config) return false;
      try {
        const arr = JSON.parse(config);
        if (!Array.isArray(arr)) return false;
        const hit = arr.find(item => item && item.name === 'supportImport');
        return hit ? !!hit.value : false;
      } catch (e) {
        return false;
      }
    },
    queryDevice() {
      this.loading = true;
      getObject('device', this.devId).then(response => {
        const device = response.data;
        const productId = device.product;
        if (productId) {
          device.product = undefined;
          getObject('product', productId).then(response => {
            const product = response.data;
            if (product.thing) {
              product.thing = JSON.parse(product.thing);
            } else {
              product.thing = []
            }
            // 解析控制指令：优先读独立 control 字段，兼容老数据 fallback 到 config
            product.cmd = this.parseCmd(product);
            // 解析 config 中是否支持数据导入
            product.supportImport = this.parseSupportImport(product.config);
            this.product = product;
            device.product = product;
            this.device = device;
            this.loadAfter();
          });
        }else{
          this.device = device;
          this.loadAfter();
        }
      })
    },
    loadAfter() {
      this.loading = false;
      this.$emit("onload", this.device);
      // 获取最后一次数据
      getDevHisLast({ addr : this.device.addr }).then(response => {
        const data = {};
        const items = response.data;
        for(let key in items){
          data[key] = { ts : items.createtime, value : items[key] }
        }
        this.devData = data;
      });
    },
    sendData(name, value, format) {
      this.$emit('send', name, value, format);
    }
  },
  watch: {
    devId() {
      this.queryDevice();
    },
    recvData() {
      this.devData = this.recvData;
    }
  }
};
</script>
<style lang="scss" scoped>


</style>
