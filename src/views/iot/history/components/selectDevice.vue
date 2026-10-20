<template>
  <span class="select-device">
        <el-form-item class="search-type-item" v-if="view === 'query'">
          <el-select v-model="type" placeholder="请选择" @change="change">
            <el-option key="product" label="按产品搜索" value="product"/>
            <el-option key="scene" label="按场景搜索" value="scene"/>
          </el-select>
        </el-form-item>
        <InputTableSelect v-if="type ==='product'"
          :read="defProductId !== undefined"
          :queryId="defProductId"
          label="产品"
          showColumn="name"
          table="product"
          @selectDone="selectProductDone"
          prop="product"
        />
        <InputTableSelect v-else-if="type === 'scene'"
          label="场景"
          showColumn="title"
          table="scene"
          @selectDone="selectSceneDone"
          prop="scene"
        />
        <InputTableSelect
          :read="defDeviceId!== undefined"
          :queryId="queryId"
          :queryParams="queryParams"
          showColumn="name"
          label="设备"
          :table="table"
          @selectDone="selectDeviceDone"
          prop="device"/>
  </span>
</template>
<script>

import InputTableSelect from "@/components/InputTableSelect/index.vue";
import { getObject } from "@/api/iot/table";

export default {
  components: { InputTableSelect },
  props: {

  },
  data() {
    return {
      type:'product',
      table: 'device',
      queryId: undefined,
      queryParams: undefined,
      product: undefined,
      scene: undefined,
      device: undefined,
      view: 'query', // query: 查询； fix: 固定
      defProductId: undefined,
      defDeviceId: undefined
    };
  },
  created() {
    const deviceId = this.$route.query.deviceId;
    const productId = this.$route.query.productId;
    if(deviceId){
      this.defDeviceId = deviceId;
      this.queryId = deviceId;
      this.view = 'fix';
      this.type = 'device';
    }else if(productId){
      this.view = 'fix';
      this.type = 'product';
      this.defProductId = productId;
    }
  },
  methods: {
    selectDeviceDone(device) {
      if(device){
        this.device = device;
        if(!this.product || device.product !== this.product.id){
          getObject('product', device.product).then(response => {
            const product = response.data;
            product.thing = product.thing ? JSON.parse(product.thing) : [];
            this.product = product;
            this.doEmit();
          })
        }else{
          this.doEmit();
        }
      }else{
        this.product = undefined;
        this.device = undefined;
        this.queryId = undefined;
        this.queryParams = {};
        this.doEmit();
      }
    },
    selectProductDone(product){
      this.queryId = undefined;
      if(product){
        this.device = undefined;
        if(typeof product.thing ==='string'){
          product.thing = JSON.parse(product.thing);
        }
        this.scene = undefined;
        this.product = product;
        this.table = 'device';
        this.queryParams = { product : product.id };
      }else{
        this.product = undefined;
        this.device = undefined;
        this.table = 'device';
        this.queryParams = {}
      }
      this.doEmit();
    },
    selectSceneDone(scene){
      this.queryId = undefined;
      if(scene){
        this.scene = scene;
        this.device = undefined;
        this.product = undefined;
        this.table = 'sceneDevice';
        this.queryParams = { scene : this.scene.id };
      }else{
        this.scene = undefined;
        this.device = undefined;
        this.table = 'device';
        this.queryParams = {}
      }
      this.doEmit();
    },
    change() {
      this.queryParams = {};
      this.queryId = undefined;
    },
    doEmit() {
      this.$emit('deviceChange', this.product, this.device, this.scene);
    }
  }
};
</script>
<style lang="scss" scoped>
/* 修复“类型下拉与右侧选择框边框交叉重叠”：
   原本类型下拉 el-form-item 固定 130px，但全局 .search-form .el-select
   把下拉撑到 200px，溢出 70px 压到右侧输入框，造成边框交叠。
   方案（已在浏览器实测验证）：去掉固定宽让盒子自适应、下拉收窄到 150px、
   各搜索项之间加 12px 间距、输入框统一 190px。 */
.select-device ::v-deep .search-type-item {
  width: auto !important;
}
.select-device ::v-deep .search-type-item .el-select {
  width: 150px !important;
}

/* 各搜索项之间留间距 */
.select-device ::v-deep .el-form-item {
  margin-right: 12px;
}

/* 产品 / 场景 / 设备 输入框统一宽度，避免过长与溢出 */
.select-device ::v-deep .el-input,
.select-device ::v-deep .el-input-group {
  width: 190px !important;
}
</style>
