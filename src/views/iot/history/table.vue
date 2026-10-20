<template>
  <div class="app-container">
    <CreateQuery
      component="iot/history/table"
      @handleQuery="handleQuery"
      :fields="fields" v-show="showSearch"/>
    <el-row v-if="columns.length === 0" :gutter="32">
      <el-col><el-empty description="暂无历史数据"></el-empty></el-col>
    </el-row>
    <el-row v-else>
      <right-toolbar
        component="iot/history/table"
        :menuQuery='menuQuery'
        :table="table"
        :columns="columns"
        :showSearch.sync="showSearch"
        :showDownload="true"
        @queryTable="getList"
        @download="handleExport"/>
      <el-table v-loading="loading" :data="tableList" stripe>
        <el-table-column label="采集时间" align="center" fixed="left" prop="createtime" width="180">
          <template slot-scope="scope">
            <span>{{ parseTime(scope.row.createtime) }}</span>
          </template>
        </el-table-column>
        <el-table-column
            v-for="item in columns"
            align="center"
            :key="item.thing.name"
            :label="item.thing.title" v-if="item.visible">
          <el-table-column
              align="center"
              :prop="item.thing.name"
              :label="item.thing.unit"
              :formatter="formatRow">
          </el-table-column>
        </el-table-column>
        <el-table-column label="告警状态" align="center" fixed="right" class-name="small-padding fixed-width">
          <template slot-scope="scope">
            <div v-if="scope.row.levels && scope.row.levels.length > 0">
              <dict-tag style="margin:5px;" v-for="item in scope.row.levels" :key="item.level"
                        :options="dict.type.iot_level"
                        :label="item.name"
                        :value="item.level"/>
            </div>
            <el-tag v-else>正常</el-tag>
          </template>
        </el-table-column>
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
import {getObject, queryObject} from "@/api/iot/table";
import {getValue, getDateRange, setAlarms, ting2columns} from "@/assets/js/iot"
// import InputTableSelect from "@/components/InputTableSelect";
// import DateTimePicker from "@/components/DateTimePicker";
import CreateQuery from "./components/createQuery.vue";

export default {
  name: "history",
  dicts: ['iot_product_type', 'iot_level'],
  components: {
    CreateQuery
  },
  data() {
    return {
      table: 'history',
      desc: '历史数据',
      // 遮罩层
      loading: false,
      showSearch: true,
      // 总条数
      total: 0,
      // 表格数据
      tableList: [],
      columns: [],
      // 查询参数
      queryParams: {
        addr: '',
        pageNum: 1,
        pageSize: 10
      },
      menuQuery: {},
      params: undefined,
      fields: ['dateRange', 'step']
    };
  },
  created() {
  },
  methods: {
    /** 查询列表 */
    getList() {
        const dateRange = getDateRange(this.params);
        this.queryParams["createTime[begin]"] = dateRange[0];
        this.queryParams["createTime[end]"] = dateRange[1];
        this.queryParams["orderBy[desc]"] = 'createTime';
        this.queryParams["step"] = this.params.step;
        this.queryParams["type"] = "table";
        this.queryParams.addr = this.params.device.addr;
        queryObject(this.table, this.queryParams).then(response => {
          this.total = response.total;
          const rows = response.rows;
          const alarms = [];
          rows.map(row => {
            if(row.alarmrule){
              alarms.push(row.alarmrule);
            }
          });
          if(alarms.length > 0){
            getObject('rule', alarms.join(',')).then(response => {
              this.loading = false;
              this.tableList = setAlarms(rows, response.data);
            })
          }else{
            this.loading = false;
            this.tableList = rows;
          }
        });
    },
    /** 搜索按钮操作 */
    handleQuery(params) {
      this.loading = true;
      this.params = params;
      this.queryParams.pageNum = 1;
      this.tableList = [];
      this.columns = params.product ? ting2columns(params.product.thing) : [];
      this.menuQuery['deviceId'] = params.device ? params.device.id : undefined;
      this.getList();
    },
    formatRow(row, column) {
      const value = getValue(row, column.property, undefined);
      const arr = this.columns.filter(item => { return item.key === column.property});
      if(arr.length > 0){
        const precision = arr[0].thing.precision;
        if(precision){
          return value !== undefined ? value.toFixed(precision) : '-';
        }
      }
      return value !== undefined ? value : '-';
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('system/export/'+ this.table, {
        ...this.queryParams
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
