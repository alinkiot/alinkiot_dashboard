<template>
  <div class="app-container">
    <CreateQuery
      @deviceChange="deviceChange"
      @handleQuery="handleQuery"
      :rules="rules" v-show="showSearch" />
    <el-row v-if="columns.length === 0" :gutter="32">
      <el-col><el-empty description="暂无数据"></el-empty></el-col>
    </el-row>
    <el-row v-else>
      <right-toolbar
        component="iot/history/list"
        :table="table"
        :columns="columns"
        :showSearch.sync="showSearch"
        :menuQuery='menuQuery'
        @queryTable="getList"/>
      <el-table v-loading="loading" :data="tableList" stripe>
        <el-table-column  align="center" fixed="left" label="设备名称" prop="device.name">
          <template slot-scope="scope">
            {{scope.row.device.name}}
          </template>
        </el-table-column>
        <el-table-column  align="center" fixed="left" label="设备地址" prop="addr"/>
        <el-table-column  align="center" fixed="left" label="采集时间" prop="createtime">
          <template slot-scope="scope">
            <span v-if="scope.row.createtime">{{ parseTime(scope.row.createtime) }}</span>
            <span v-else>-</span>
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
        <el-table-column  align="center" label="告警状态" prop="levels" fixed="right" class-name="small-padding fixed-width">
          <template slot-scope="scope">
            <div v-if="scope.row.levels && scope.row.levels.length > 0">
                <dict-tag style="margin:5px;" v-for="item in scope.row.levels" :key="item.level"
                          :options="dict.type.iot_level"
                          :label="item.name"
                          :value="item.level"/>
            </div>
            <div v-else><el-tag>正常</el-tag></div>
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
import { getDevHisLast, queryObject, getObject } from "@/api/iot/table";
import {getValue, setAlarms, ting2columns} from "@/assets/js/iot"
import CreateQuery from "./components/createQuery.vue";

export default {
  name: "history",
  dicts: ['iot_level'],
  components: {
    CreateQuery
  },
  data() {
    const devCheck = (rule, value, callback) => {
      const field = rule.fullField;
      let self = rule.self;
      let check = function() {
        if(self.scene){
          return !(self.device && self.device.addr);
        }else{
          return false;
        }
      }
      if(check()){
        callback(new Error(field.message));
      }else{
        callback();
      }
    };
    return {
      table: 'history',
      desc: '实时数据',
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
      // 表单校验
      rules: {
        device: [
          { validator: devCheck, message: "设备不能为空", trigger: "blur"}
        ]
      }
    };
  },
  created() {
  },
  methods: {
    /** 查询列表 */
    getList() {
      this.loading = true;
      queryObject('device', this.queryParams).then(response => {
        const devices = response.rows;
        const ids = [];
        devices.map(item => { ids.push(item.addr); });
        this.total = response.total;
        if(ids.length === 0){
          this.loading = false;
          this.tableList = [];
        }else{
          getDevHisLast({addr: ids.join(','), batch : true}).then(response =>{
            const rows = [], alarms = [];
            devices.map(device => {
              const row = response.data.filter(item => { return item.addr === device.addr });
              const item = row[0] ? row[0] : {};
              if(item.alarmrule){
                alarms.push(item.alarmrule);
              }
              item.device = device;
              rows.push(item);
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
        }
      })
    },
    deviceChange(product) {
      this.columns = product ? ting2columns(product.thing) : [];
    },
    /** 搜索按钮操作 */
    handleQuery(params) {
      this.queryParams.pageNum = 1;
      this.queryParams['product'] = params.product ? params.product.id : undefined;
      this.menuQuery['productId'] = this.queryParams.product;
      if(params.device){
        this.menuQuery['deviceId'] = params.device.id;
        this.queryParams['addr'] = params.device.addr;
      }else{
        this.menuQuery['deviceId'] = undefined;
        this.queryParams['addr'] = undefined;
      }
      this.tableList = [];
      this.getList();
    },
    formatRow(row, column) {
      return getValue(row, column.property, '-');
    }
  }
};
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
