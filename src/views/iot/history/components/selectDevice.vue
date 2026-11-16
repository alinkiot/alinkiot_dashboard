<template>
  <span class="select-device">
        <InputTableSelect v-if="type ==='product'"
          :class="{ 'type-search-group': view === 'query' }"
          :read="defProductId !== undefined"
          :queryId="defProductId"
          :formLabel="view === 'query' ? '搜索' : undefined"
          label="产品"
          showColumn="name"
          table="product"
          @selectDone="selectProductDone"
          prop="product"
        >
          <el-select v-if="view === 'query'" slot="prepend" v-model="type" class="search-type-select" @change="change">
            <el-option key="product" label="产品" value="product"/>
            <el-option key="scene" label="场景" value="scene"/>
          </el-select>
        </InputTableSelect>
        <InputTableSelect v-else-if="type === 'scene'"
          :class="{ 'type-search-group': view === 'query' }"
          :formLabel="view === 'query' ? '搜索' : undefined"
          label="场景"
          showColumn="title"
          table="scene"
          @selectDone="selectSceneDone"
          prop="scene"
        >
          <el-select v-if="view === 'query'" slot="prepend" v-model="type" class="search-type-select" @change="change">
            <el-option key="product" label="产品" value="product"/>
            <el-option key="scene" label="场景" value="scene"/>
          </el-select>
        </InputTableSelect>
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
/* 各搜索项之间留间距 */
.select-device ::v-deep .el-form-item {
  margin-right: 12px;
}

/* 产品 / 场景 / 设备 输入框统一宽度，避免过长与溢出 */
.select-device ::v-deep .el-input,
.select-device ::v-deep .el-input-group {
  width: 190px !important;
}

/* 「产品 / 场景」下拉与右侧选择框合成一个整体：
   悬停、聚焦时整体变色，内部分隔线保持默认颜色 */
$divider-color: rgba(0, 0, 0, 0.1);
$focus-color: var(--current-color-focus, var(--current-color, #0071e3));

.type-search-group ::v-deep {
  .el-input-group {
    width: 270px !important;
    border-radius: 8px;
    transition: box-shadow 0.2s ease;
  }

  // 前置下拉：宽度固定，内部输入框跟随下拉宽度（否则会被上面的 190px 撑出去，
  // 箭头溢出到右侧输入框）
  .el-input-group__prepend .el-select {
    width: 80px;

    .el-input {
      position: relative;
      width: 100% !important;
    }

    .el-input__inner {
      padding-left: 10px;
      padding-right: 24px;
      border-color: transparent !important;
    }
  }

  // 去掉各部分自己的聚焦光晕，改为整体光晕
  .el-input__inner,
  .el-input__inner:focus,
  .el-select .el-input.is-focus .el-input__inner {
    box-shadow: none !important;
  }

  .el-input-group:hover {
    > .el-input-group__prepend,
    > .el-input-group__append,
    > .el-input__inner {
      border-color: #c0c4cc !important;
    }
  }

  .el-input-group:focus-within {
    // 深色主题的边框画在组合框外层
    border-color: $focus-color !important;
    box-shadow: 0 0 0 3px var(--current-color-ring, rgba(0, 113, 227, 0.16));

    // 浅色主题的边框画在各部分上
    > .el-input-group__prepend,
    > .el-input-group__append,
    > .el-input__inner {
      border-color: $focus-color !important;
    }
  }

  // 分隔线 = 中间输入框的左右边框，任何状态下都保持默认颜色
  .el-input-group > .el-input__inner,
  .el-input-group:hover > .el-input__inner,
  .el-input-group:focus-within > .el-input__inner {
    border-left-color: $divider-color !important;
    border-right-color: $divider-color !important;
  }
}

/* 校验失败：整个组合框（前置下拉 + 输入框 + 右侧按钮）外框标红，内部分隔线保持默认。
   Element 默认只把中间输入框标红；前置区自带 border-right:0、按钮区自带 border-left:0，
   所以分隔线就是中间输入框的左右边框。 */
$error-color: #f56c6c;

.select-device ::v-deep .el-form-item.is-error .el-input-group {
  > .el-input-group__prepend,
  > .el-input-group__append {
    border-color: $error-color !important;
  }

  > .el-input__inner {
    border-top-color: $error-color !important;
    border-bottom-color: $error-color !important;
    border-left-color: $error-color !important;
    border-right-color: $error-color !important;
  }

  &.el-input-group--prepend > .el-input__inner {
    border-left-color: $divider-color !important;
  }

  &.el-input-group--append > .el-input__inner {
    border-right-color: $divider-color !important;
  }
}
</style>
