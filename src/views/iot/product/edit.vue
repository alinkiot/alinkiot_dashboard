<template>
  <div class="app-container">
    <div class="product-title">{{product.name}}</div>
    <el-tabs v-model="activeName" @tab-click="handleTabClick">
      <el-tab-pane label="产品详情" name="baseInfo">
        <BaseInfo :id="productId" @onload="onload"></BaseInfo>
      </el-tab-pane>
      <el-tab-pane label="扩展参数" name="extendTab">
        <ExtendEditor table="product" :id="productId" />
      </el-tab-pane>
      <el-tab-pane label="功能定义" name="thingTab">
        <ThingEditor :product="product" :tabThing="tabThing" @updateThing="updateThing" />
      </el-tab-pane>
      <el-tab-pane label="控制指令" name="controlTab">
        <ControlEditor table="product" :id="productId" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>
<script>
import ImageUpload from "@/components/ImageUpload/index.vue";
import InputTableSelect from "@/components/InputTableSelect";
import ThingEditor from "./components/thingEditor";
import ExtendEditor from "./components/extendEditor";
import ControlEditor from "./components/controlEditor";
import {updateObject} from "@/api/iot/table";
import BaseInfo from "@/views/iot/product/components/baseInfo.vue";

export default {
  name: "ProductEdit",
  dicts: [
    'sys_normal_disable',
    'iot_protocol_id',
    'iot_net_type',
    'iot_auto_register',
    'iot_node_type',
    'iot_product_mgr'
  ],
  components: {
    BaseInfo,
    InputTableSelect,
    ThingEditor,
    ExtendEditor,
    ControlEditor,
    ImageUpload
  },
  data() {
    return {
      table: 'product',
      title: '产品新增',
      loading: true,
      productId: undefined,

      // 选中数组
      ids: [],
      product: { pk : '', ps : '', status : "0"},
      tabThing: [],
      activeName: 'baseInfo', // 当前页的名称,查询页面
      // 表单校验
      rules: {
        name: [
          {required: true, message: "产品名称不能为空", trigger: "blur"}
        ],
        protocol: [
          {required: true, message: "协议标识不能为空", trigger: "blur"}
        ],
        category: [
          {required: true, message: "品类不能为空", trigger: "blur"}
        ],
        nodeType: [
          {required: true, message: "节点类型不能为空", trigger: "blur"}
        ]
      }
    };
  },
  created() {
    this.productId = this.$route.query.id;
    // 支持从其他页面跳转时直接定位到指定 tab，如一型一密未设置时跳转到基本信息页
    if (this.$route.query.tab) {
      this.activeName = this.$route.query.tab;
    }
  },
  methods: {
    onload(product) {
      this.loading = false;
      this.product = product;
      this.tabThing = this.product.thing ? JSON.parse(this.product.thing) : [];
    },
    handleTabClick(tab, event) {
    },
    updateThing: function(tabThing){
      if(this.product.id){
        const thing = JSON.stringify(tabThing);
        const data = {id: this.product.id, thing : thing};
        updateObject(this.table, data).then(response => {
          this.product.thing = thing;
          this.tabThing = tabThing;
          this.$modal.msgSuccess("物模型保存成功");
        })
      }else{
        this.$modal.msgError("请先保存产品！");
      }
    }
  }
};
</script>
<style lang="scss" scoped>

::v-deep {
  .el-button--small.is-circle{
    padding : 4px;
  }
}

.product-title {
  font-weight: bolder;
  font-size: 21px;
  padding: 5px 0px 5px 0px;
}
</style>
