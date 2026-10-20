<template>
  <div class="app-container">
    <CreateQuery
      @deviceChange="deviceChange"
      component="iot/history/chart"
      @handleQuery="handleQuery"
      :fields="fields" v-show="showSearch"/>
    <div>
      <el-row v-if="columns.length > 0">
        <right-toolbar
          component="iot/history/chart"
          :menuQuery='menuQuery'
          :table="table"
          :showSearch.sync="showSearch"
          :columns="columns"
          @queryTable="getList"
          :showDownload="true"
          @download="handleExport"
        />
      </el-row>
      <div v-loading="loading">
        <el-row v-if="columns.length === 0" :gutter="32">
          <el-col><el-empty description="暂无曲线数据"></el-empty></el-col>
        </el-row>
        <el-row class="chart-box" v-else>
          <el-col class="chart-col"
            :xs="24" :sm="24" :md="12" :lg="12" :xl="8"
            v-for="item in columns"
            :key="item.key"
            v-if="item.visible">
            <ThingChart
              :thing="item.thing"
              :chartData="chartData"/>
          </el-col>
        </el-row>
      </div>
    </div>
  </div>
</template>

<script>

import ThingChart from "./components/ThingChart";
import {queryObject} from "@/api/iot/table";
import {getDateRange, ting2columns} from "@/assets/js/iot";
import CreateQuery from "./components/createQuery.vue";


export default {
  name: "historyEdit",
  components: {
    CreateQuery,
    ThingChart,
  },
  data() {
    return {
      table: 'history',
      desc: '历史曲线',
      // 遮罩层
      loading: false,
      columns: [],
      showSearch: true,
      things: [],
      chartData: [],
      // 查询参数
      queryParams: {
        addr: ''
      },
      menuQuery: {},
      params: undefined,
      fields: ['dateRange', 'step']
    };
  },
  created() {
  },
  methods: {
    deviceChange(product) {
      this.columns = ting2columns(product.thing);
      console.log(this.columns)
    },
    handleQuery(params) {
      this.params = params;
      this.menuQuery['deviceId'] = params.device.id;
      this.getList();
    },
    getList() {
      const dateRange = getDateRange(this.params);
      this.queryParams["step"] = this.params.step;
      this.queryParams["createTime[begin]"] = dateRange[0];
      this.queryParams["createTime[end]"] = dateRange[1];
      this.queryParams["type"] = "chart";
      this.queryParams["orderBy[desc]"] = 'createTime';
      this.queryParams.addr = this.params.device.addr;
      this.loading = true;
      queryObject(this.table, this.queryParams).then(response => {
        this.chartData = response.data;
        this.loading = false;
      });
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('system/export/'+ this.table, {
        ...this.queryParams
      }, this.desc+`_${new Date().getTime()}.xlsx`);
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

.chart-box {
  padding: 10px;
  border-radius: 8px;
}
.chart-col {

}

</style>
