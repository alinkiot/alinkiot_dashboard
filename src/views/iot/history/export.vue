<template>
  <div class="app-container">
    <el-form :model="params" :rules="validator" ref="queryForm" size="small" :inline="true" class="search-form">
      <SelectDevice @deviceChange="deviceChange"/>
      <el-form-item label="聚合" prop="step">
        <el-select v-model="params.step" placeholder="聚合时间">
          <el-option
            v-for="dict in dict.type.echart_aggregate"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <DateTimePicker :options="dict.type.echart_aggregate" @change="dateChange" prop="dateRange"/>
      <el-form-item>
        <el-button type="success" icon="el-icon-download" size="mini" @click="handleExport">导出</el-button>
      </el-form-item>
    </el-form>
    <el-divider></el-divider>
    <el-row v-if="deviceList.length === 0" :gutter="32">
      <el-col><el-empty description="没有导出设备"></el-empty></el-col>
    </el-row>
    <el-row v-else>
      <el-table :data="deviceList" stripe>
        <el-table-column label="设备地址" align="center" prop="addr"/>
        <el-table-column label="设备名称" align="center" prop="name"/>
        <el-table-column label="产品名称" align="center" prop="product.name"/>
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="110">
          <template slot-scope="scope">
            <el-button
              size="mini"
              type="text"
              style="color:red;"
              icon="el-icon-delete"
              @click="handleDelete(scope.row)"
            >移除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-row>
  </div>
</template>

<script>
import {getObject, queryObject} from "@/api/iot/table";
import {getDateRange} from "@/assets/js/iot"
import SelectDevice from "./components/selectDevice.vue";
import DateTimePicker from "@/components/DateTimePicker/index.vue";

export default {
  name: "export",
  dicts: ['echart_aggregate'],
  components: {
    DateTimePicker,
    SelectDevice
  },
  data() {
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
      table: 'history',
      showSearch: true,
      desc: '历史数据',
      // 表格数据
      deviceList: [],
      params: { step: '30' },
      dateParams: {},
      validator:{
        dateRange: [
          { self: this, validator: checkRangeDate, required: true, message: "时间范围不能为空", trigger: "blur"}
        ]
      }
    };
  },
  created() {
  },
  methods: {
    handleDelete(row) {
      const devices = [];
      this.deviceList.map(item => {
        if(item.addr !== row.addr){
          devices.push(item);
        }
      });
      this.deviceList = devices;
    },
    deviceChange(product, device) {
      if(device){
        const arr = this.deviceList.filter(item => {
          return item.addr === device.addr;
        });
        if(arr.length === 0){
          device.product = product;
          this.deviceList.push(device);
        }
      }
    },
    dateChange(mode, dateRange) {
      this.dateParams = {
        dateRange: dateRange,
        dateMode : mode
      };
    },
    /** 导出按钮操作 */
    handleExport() {
      const dateRange = getDateRange(this.dateParams);
      this.params["createTime[begin]"] = dateRange[0];
      this.params["createTime[end]"] = dateRange[1];
      this.params["orderBy[desc]"] = 'createTime';
      this.params["type"] = "table";

      const ids = [];
      this.deviceList.map(device => {
        ids.push(device.addr);
      });
      this.params.addr = ids.join(',');
      this.download('system/export/'+ this.table, {
        ...this.params
      }, this.desc+`_${new Date().getTime()}.xlsx`);
    }
  }
}
</script>

<style lang="scss" scoped>
.col-box {
  background-color: #f0f2f5;
  padding: 8px;
  border-radius: 5px;
  margin: 8px;
}
.col-title {
  color:#4460b5;
  background-color: #f0f2f5;
  padding: 5px;
  font-weight: bold;
}
.el-divider--horizontal{
  margin: 0 0 5px 0;
}
</style>
