<template>
  <div class="table-select">
    <el-form v-if="showSearch" ref="queryForm" size="small" :inline="true" class="table-select__search">
      <el-form-item v-for="item in column" v-if="item.isSearch" :key="item.key" :label="item.label" :prop="item.key">
        <el-input v-model="item.value" placeholder="请输入" class="table-select__input" clearable @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="small" @click="handleQuery">搜索</el-button>
      </el-form-item>
    </el-form>
    <el-table
        v-loading="loading"
        :data="tableList"
        :row-key="getRowKeys"
        border
        stripe
        size="small"
        max-height="360"
        @selection-change="handleSelectionChange"
    >
      <el-table-column v-if="multiple" type="selection" :reserve-selection="true" width="48" align="center" />
      <el-table-column v-for="item in column" v-if="!item.hidden" :label="item.label" :key="item.key" align="center" :prop="item.key" show-overflow-tooltip />
      <el-table-column label="操作" align="center" width="80" class-name="small-padding fixed-width" v-if="!multiple">
        <template slot-scope="scope">
          <el-button
              size="mini"
              type="text"
              @click="handleSelect(scope.row)"
          >选择</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="table-select__footer">
      <el-button
          v-if="multiple"
          type="primary"
          icon="el-icon-success"
          size="small"
          @click="handleMultipleSelect"
      >确定({{selection.length}})</el-button>
      <pagination
          v-show="total>0"
          :total="total"
          :page-sizes="[8, 10, 20, 30, 40]"
          :limit.sync="queryParams.pageSize"
          :page.sync="queryParams.pageNum"
          @pagination="getList"
      />
    </div>
  </div>
</template>
<script>
import { queryObject } from "@/api/iot/table";
export default {
  props: {
    table: {
      type: String,
      required: true
    },
    column: {
      type: Array,
      required: true
    },
    multiple: {
      type: Boolean,
      default: false
    },
    showSearch: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      loading: false,
      // 总条数
      total: 0,
      // 表格数据
      tableList: [],
      // 查询参数
      queryParams: {},
      selection: []
    };
  },
  created() {
    this.reset();
    this.getList();
  },
  methods: {
    getRowKeys(row) {
      return row.id;
    },
    handleSelectionChange(selection) {
      this.selection = selection;
    },
    reset() {
      this.queryParams.pageNum = 1;
      this.queryParams.pageSize = 8;
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 查询列表 */
    getList() {
      this.loading = true;
      this.column.filter(item => {
        if(item.isSearch){
          const name = item.regx ? item.key + '[like]' : item.key;
          if(item.value && item.value !== ''){
            this.queryParams[name] = item.value;
          }else{
            this.queryParams[name] = undefined;
          }
        } else if(item.default){
          this.queryParams[item.key] = item.default;
        }
      });
      queryObject(this.table, this.queryParams).then(response => {
        this.tableList = response.rows;
        this.total = response.total;
        this.loading = false;
      });
    },
    handleMultipleSelect() {
      this.$emit("selectDone", this.selection);
    },
    handleSelect(row) {
      this.$emit("selectDone", row);
    }
  },
  watch: {
    column(){
      this.reset();
      this.getList();
    }
  }
};
</script>

<style lang="scss" scoped>
.table-select {
  padding: 4px 2px;

  &__search {
    margin-bottom: 12px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;

    ::v-deep .el-form-item {
      margin-bottom: 8px;
      margin-right: 12px;
    }
    // 搜索按钮所在项不换行、紧跟其后
    ::v-deep .el-form-item:last-child {
      margin-right: 0;
    }
  }

  // 搜索输入框统一宽度，排布整齐
  &__input {
    width: 180px;
  }

  &__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 12px;

    // 复用的 pagination 外层容器去掉自带内边距，交由 footer 统一控制
    ::v-deep .pagination-container {
      margin: 0;
      padding: 0;
      background: transparent;
    }
  }
}
</style>
