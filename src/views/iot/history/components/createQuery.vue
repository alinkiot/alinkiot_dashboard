<template>
    <el-form :model="params" :rules="validator" ref="queryForm" size="small" :inline="true" class="search-form">
      <SelectDevice @deviceChange="deviceChange"/>
      <div v-if="showDateRange" class="date-range-group">
        <el-form-item label="聚合" prop="step" v-if="showStep" class="agg-item">
          <el-select v-model="step" placeholder="聚合时间">
            <el-option
              v-for="dict in dict.type.echart_aggregate"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            />
          </el-select>
        </el-form-item>
        <DateTimePicker :options="dict.type.echart_aggregate" @change="dateChange" prop="dateRange"/>
      </div>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">查询</el-button>
      </el-form-item>
    </el-form>
</template>
<script>

import SelectDevice from "./selectDevice.vue";
import InputTableSelect from "@/components/InputTableSelect/index.vue";
import DateTimePicker from "@/components/DateTimePicker/index.vue";

export default {
  components: {
    DateTimePicker,
    InputTableSelect,
    SelectDevice
  },
  dicts: ['echart_aggregate'],
  props: {
    fields: {
      type: Array,
      default: function (){
        return [];
      }
    },
    rules:{
      type: Object,
      default : function (){ return { } }
    }
  },
  data() {
    const validateCheck = (rule, value, callback) => {
      const field = rule.fullField;
      let self = rule.self;
      let check = function() {
        if(field === 'device'){
          return !(self.device && self.device.addr);
        } else if(field === 'product'){
          if(self.device){
            return false;
          }else{
            return !(self.product && typeof self.product.id === 'number');
          }
        } else if(field === 'scene'){
          if(self.device){
            return false;
          }else{
            return !self.scene;
          }
        }
        return false;
      }
      if(check()){
        callback(new Error(field.message));
      }else{
        callback();
      }
    };
    const checkRangeDate = (rule, value, callback) => {
      const field = rule.fullField;
      let self = rule.self;
      if(self.dateMode === 'last' && self.dateRange > 0){
        callback();
      }else if(self.dateMode === 'range' && self.dateRange.length > 0 ){
        callback();
      } else{
        callback(new Error(field.message));
      }
    };
    return {
      type:'product',
      table: 'device',
      queryId: undefined,
      product: undefined,
      scene: undefined,
      device: undefined,
      // 日期范围
      dateRange: [],
      dateMode: undefined,
      step: "0",
      params: {},

      showDateRange: false,
      showStep: false,

      validator:{
        device: [
          { self: this, validator: validateCheck, required: true, message: "设备不能为空", trigger: "blur"}
        ],
        dateRange: [
          { self: this, validator: checkRangeDate, required: true, message: "时间范围不能为空", trigger: "blur"}
        ],
        product: [
          { self: this, validator: validateCheck, message: "产品不能为空", trigger: "blur"}
        ],
        scene: [
          { self: this, validator: validateCheck, message: "场景不能为空", trigger: "blur"}
        ]
      }
    };
  },
  created() {
    this.field_init();
  },
  methods: {
    field_init() {
      this.fields.map(field => {
        if(field === 'dateRange'){
          this.showDateRange = true
        } else if(field === 'step'){
          this.showStep = true;
        }
      })
      for(const key in this.rules) {
        const rules = this.rules[key];
        if(rules.length > 0){
          rules.map(rule => { rule.self = this; });
          this.validator[key] = rules;
        } else{
          delete this.validator[key];
        }
      }
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.$refs["queryForm"].validate(valid => {
        if (valid) {
          this.params = {
            device: this.device,
            product: this.product
          };
          if(this.showStep && this.step !== "0"){
            this.params.step = this.step;
          }
          if(this.showDateRange){
            this.params.dateRange = this.dateRange;
            this.params.dateMode = this.dateMode;
          }
          this.$emit('handleQuery', this.params);
        }
      });
    },
    deviceChange(product, device, scene) {
      this.product = product;
      this.device = device;
      this.scene = scene;
      this.$emit('deviceChange', product, device, scene);
      this.handleQuery();
    },
    dateChange(mode, dateRange) {
      this.dateRange = dateRange;
      this.dateMode = mode;
      this.$emit('dateChange', mode, dateRange);
    }
  }
};
</script>
<style lang="scss" scoped>
/* 让"聚合 + 日期范围"包裹层直接融入 .search-form 的 flex 布局，
   与"选择设备"等搜索项在同一行对齐、正常换行 */
.date-range-group {
  display: contents;
}

/* 聚合下拉收窄，避免走全局 200px 过长 */
.agg-item ::v-deep .el-select,
.agg-item ::v-deep .el-input {
  width: 120px !important;
}
</style>
