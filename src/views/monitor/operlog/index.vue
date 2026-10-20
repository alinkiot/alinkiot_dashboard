<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" class="search-form">
      <el-form-item label="操作人员" prop="operName">
        <el-input
          v-model="queryParams.operName"
          placeholder="请输入操作人员"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="操作时间">
        <el-date-picker
          v-model="dateRange"
          value-format="yyyy-MM-dd"
          type="daterange"
          range-separator="-"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
        ></el-date-picker>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="danger"

          icon="el-icon-delete"
          size="mini"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['system:oper_log:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"

          icon="el-icon-delete"
          size="mini"
          @click="handleClean"
          v-hasPermi="['system:oper_log:remove']"
        >清空</el-button>
      </el-col>
    </el-row>

    <el-table ref="tables" v-loading="loading" :data="list" @selection-change="handleSelectionChange" :default-sort="defaultSort" @sort-change="handleSortChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="请求方式"  width="80px" align="center" prop="requestMethod" />
      <el-table-column label="请求地址" width="200px" align="left" prop="operUrl"/>
      <el-table-column label="User-Agent" align="left" prop="userAgent" />
      <el-table-column label="操作系统" width="100px" align="center" prop="os"/>
      <el-table-column label="访问IP" align="center" prop="operIp" width="130" :show-overflow-tooltip="true" />
      <el-table-column label="操作人员" align="center" prop="operName" width="100" :show-overflow-tooltip="true" sortable="custom" :sort-orders="['descending', 'ascending']" />
      <el-table-column label="操作日期" align="center" prop="operTime" sortable="custom" :sort-orders="['descending', 'ascending']" width="180">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.operTime) }}</span>
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
  </div>
</template>

<script>
import { list, delOperlog, cleanOperlog } from "@/api/monitor/operlog";

export default {
  name: "Operlog",
  data() {
    return {
      // 遮罩层
      loading: true,
      // 选中数组
      ids: [],
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 表格数据
      list: [],
      // 是否显示弹出层
      open: false,
      // 日期范围
      dateRange: [],
      // 默认排序
      defaultSort: {prop: 'operTime', order: 'descending'},
      // 表单参数
      form: {},
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        title: undefined,
        operName: undefined
      }
    };
  },
  created() {
    this.getList();
  },
  methods: {
    /** 查询登录日志 */
    getList() {
      this.loading = true;
      list(this.addDateRange(this.queryParams, this.dateRange)).then( response => {
          this.list = response.rows;
          this.total = response.total;
          this.loading = false;
        }
      );
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.dateRange = [];
      this.resetForm("queryForm");
      this.$refs.tables.sort(this.defaultSort.prop, this.defaultSort.order)
      this.handleQuery();
    },
    /** 多选框选中数据 */
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.operId)
      this.multiple = !selection.length
    },
    /** 排序触发事件 */
    handleSortChange(column, prop, order) {
      this.queryParams.orderByColumn = column.prop;
      this.queryParams.isAsc = column.order;
      this.getList();
    },
    /** 详细按钮操作 */
    handleView(row) {
      this.open = true;
      this.form = row;
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const operIds = row.operId || this.ids;
      this.$modal.confirm('是否确认删除日志编号为"' + operIds + '"的数据项？').then(function() {
        return delOperlog(operIds);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    /** 清空按钮操作 */
    handleClean() {
      this.$modal.confirm('是否确认清空所有操作日志数据项？').then(function() {
        return cleanOperlog();
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("清空成功");
      }).catch(() => {});
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('monitor/export/operlog', {
        ...this.queryParams
      }, `operlog_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>

