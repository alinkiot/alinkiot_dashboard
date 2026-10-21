<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" class="search-form">
      <InputTableSelect showColumn="name" label="设备名称" table="device" @selectDone="selectDeviceDone" prop="device"/>
      <DateTimePicker :options="dict.type.echart_aggregate" @change="dateChange" prop="dateRange"/>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>
    <el-row>
      <el-table ref="tables" v-loading="loading" :data="list">
        <el-table-column label="日期" align="center" prop="time">
          <template slot-scope="scope">
            <span>{{ parseTime(scope.row.time) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="来源" align="center" prop="addr"  :formatter="formatRow"/>
        <el-table-column label="事件" align="center" prop="event" :formatter="formatRow"/>
        <el-table-column label="消息" align="center" prop="data"/>
        <el-table-column label="结果" align="center" prop="result" :formatter="formatRow"/>
      </el-table>
      <pagination
          v-show="total>0"
          :total="total"
          :page.sync="queryParams.pageNum"
          :limit.sync="queryParams.pageSize"
          @pagination="getList"
      />
    </el-row>
  </div>
</template>

<script>
import { queryDeviceLog } from "@/api/iot/system";
import InputTableSelect from "@/components/InputTableSelect";
import DateTimePicker from "@/components/DateTimePicker";
import dayjs from "dayjs";
import {getDateRange} from "@/assets/js/iot";

export default {
  name: "Devicelog",
  dicts: ['echart_aggregate'],
  components: {
    InputTableSelect,
    DateTimePicker
  },
  data() {
    return {
      // 遮罩层
      loading: false,
      // 总条数
      total: 0,
      // 表格数据
      list: [],
      // 日期范围
      datetimeRange: {
        dateMod: 30,
        dateRange: []
      },
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        title: undefined,
        addr: undefined
      }
    };
  },
  created() {
    this.getList();
  },
  methods: {
    dateChange(mode, dateRange) {
      this.datetimeRange = {
        dateMode: mode,
        dateRange: dateRange
      }
    },
    /** 查询登录日志 */
    getList() {
      const dateRange = getDateRange(this.datetimeRange);
      this.queryParams["time[begin]"] = dateRange[0];
      this.queryParams["time[end]"] = dateRange[1];
      this.queryParams['orderBy[desc]'] = 'time';
      this.loading = true;
      queryDeviceLog(this.queryParams).then( response => {
          this.loading = false;
          this.list = response.rows;
          this.total = response.total;
        }
      );
    },
    formatRow(row, column) {
      switch (column.property){
        case 'event':
          switch (row[column.property]){
            case 'down_data': return '下行';
            case 'up_data': return '上行';
            case 'auth': return '设备激活';
            case 'logout': return '设备退出';
            default:
              return row[column.property];
          };
        case 'result':
          switch (row[column.property]){
            case "1": return '成功' + row['reason'];
            case "0": return '失败' + row['reason'];
            default:
              return row[column.property];
          };
        default:
          return row[column.property];
      }
    },
    selectDeviceDone(device) {
      if(device){
        this.queryParams.addr = device.addr;
      }else{
        this.queryParams.addr = undefined;
      }
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.datetimeRange = {
        dateMod: 30,
        dateRange: []
      };
      this.resetForm("queryForm");
    }
  }
};
</script>

