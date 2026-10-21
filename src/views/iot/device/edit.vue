<template>
  <div class="app-container">
    <template>
      <div class="title-dev">
        <span v-if="device">{{ device.name }}</span>
      </div>
      <el-tabs v-model="activeName" @tab-click="handleTabClick">
        <el-tab-pane label="设备详情" name="baseInfo">
          <BaseInfo :id="deviceId" :key="deviceId" @onload="onDeviceLoad" />
        </el-tab-pane>
        <el-tab-pane label="子设备" name="childrenPane" v-if="device && product && product.nodeType === 'gateway'">
          <ChildrenBoard :device="device" :product="product" />
        </el-tab-pane>
        <el-tab-pane label="网关" name="gatewayPane" v-if="device && product && product.nodeType === 'children'">
          <GatewayBoard :device="device" />
        </el-tab-pane>
        <el-tab-pane label="设备鉴权" name="topicTab" v-if="device">
          <TopicBoard :device="device" :product="product"/>
        </el-tab-pane>
        <el-tab-pane label="设备地图" name="mapTab" v-if="device">
          <MapBoard ref="mapBoard" :device="device"/>
        </el-tab-pane>
        <el-tab-pane label="实时数据" name="devStatusPane" v-if="product && product.thing && product.thing !== '[]'">
          <DeviceBoard :devId="deviceId" :showImport="true"/>
        </el-tab-pane>
      </el-tabs>
    </template>
  </div>
</template>
<script>

import TopicBoard from "./components/topicBoard.vue";
import DeviceBoard from "./components/deviceBoard";
import InputTableSelect from "@/components/InputTableSelect";
import ExtendEditor from "../product/components/extendEditor";
import GatewayBoard from "./components/gatewayBoard.vue";
import ChildrenBoard from "./components/childrenBoard";
import BaseInfo from "@/views/iot/device/components/baseInfo.vue";
import MapBoard from "@/views/iot/device/components/mapBoard.vue";


export default {
  name: "DeviceInfo",
  dicts: [],
  components: {
    BaseInfo,
    GatewayBoard,
    InputTableSelect,
    DeviceBoard,
    TopicBoard,
    ExtendEditor,
    ChildrenBoard,
    MapBoard
  },
  data() {
    return {
      product: undefined,
      device: undefined,
      activeName: 'baseInfo', // 当前页的名称,查询页面
    };
  },
  computed: {
    // 直接从路由取设备 id。点子设备/网关会跳转到同一个 deviceEdit 路由、
    // 仅 query.id 变化，组件被复用；用计算属性保证 deviceId 始终跟随路由，
    // 无需依赖 created / 路由钩子的触发时机。
    deviceId() {
      return this.$route.query.id;
    }
  },
  watch: {
    // 设备切换时清空上一台设备的 device/product，避免旧数据残留；
    // BaseInfo 以 :key=deviceId 重建并重新加载，再通过 onload 回填。
    // 同时把激活的 tab 复位到始终存在的“设备详情”，否则若当前停留在
    // “子设备”等条件 tab 上、而新设备不满足其显示条件（例如子设备不是
    // 网关），该 tab 会消失，导致页面看起来空白、像没加载。
    deviceId() {
      this.device = undefined;
      this.product = undefined;
      this.activeName = 'baseInfo';
    }
  },
  methods: {
    onDeviceLoad(info) {
      this.device = info.device;
      this.product = info.product;
    },
    handleTabClick(tab) {
      // 切到地图 tab 时让地图按当前可视区重新计算高度
      if (tab && tab.name === 'mapTab') {
        this.$nextTick(() => {
          if (this.$refs.mapBoard && this.$refs.mapBoard.resizeMap) {
            this.$refs.mapBoard.resizeMap();
          }
        });
      }
    }
  }
};
</script>
<style lang="scss" scoped>

.title-dev {
  font-weight: bolder;
  font-size: 21px;
  padding: 5px 0px 5px 0px;
  cursor:default;
}

</style>
