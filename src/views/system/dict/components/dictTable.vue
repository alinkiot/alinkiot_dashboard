<template>
  <div>
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch">
      <el-form-item label="字典标签" prop="dictLabel">
        <el-input
          v-model="queryParams.dictLabel"
          placeholder="请输入字典标签"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="数据状态" clearable>
          <el-option
            v-for="dict in dict.type.sys_normal_disable"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>
    <el-row :gutter="10" class="mb8">
      <right-toolbar v-if="showToolbar"
        component="system/dict/data"
        :menuQuery="menuQuery"
        :showSearch.sync="showSearch"
        @queryTable="getList"/>
    </el-row>
    <el-table v-loading="loading" :data="dataList">
      <el-table-column label="字典编码" align="center" prop="dictCode" />
      <el-table-column label="字典标签" prop="dictLabel">
        <template slot-scope="scope">
          <span class="dict-label-cell">
            <svg-icon v-if="scope.row.cssClass" :icon-class="scope.row.cssClass"/>
            <el-tag v-if="scope.row.listClass === 'primary' || scope.row.listClass === 'success' || scope.row.listClass === 'info' || scope.row.listClass === 'warning' || scope.row.listClass === 'danger'" :type="scope.row.listClass">{{scope.row.dictLabel}}</el-tag>
            <span v-else>{{scope.row.dictLabel}}</span>
          </span>
        </template>
      </el-table-column>
      <el-table-column label="字典键值" align="center" prop="dictValue">
        <template slot-scope="scope">
          <ImagePreview v-if="scope.row.listClass === 'picture'" :src="scope.row.dictValue"/>
          <el-link v-else-if="scope.row.listClass === 'code'" @click="downloadCode(scope.row)">
            下载<i class="el-icon-document el-icon--right"></i>
          </el-link>
          <el-link v-else-if="scope.row.listClass === 'file'" @click="downloadFile(scope.row)">
            文件<i class="el-icon-download el-icon--right"></i>
          </el-link>
          <span v-else>{{scope.row.dictValue}}</span>
        </template>
      </el-table-column>
      <el-table-column label="字典排序" align="center" prop="dictSort" />
      <el-table-column label="状态" align="center" prop="status">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.sys_normal_disable" :value="scope.row.status"/>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" :show-overflow-tooltip="true" />
      <el-table-column label="创建时间" align="center" prop="createTime" width="180">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" fixed="right">
        <template slot-scope="scope">
          <el-button v-for="button in buttons" :key="button.key"
            size="mini"
            type="text"
            :icon="button.icon"
            @click="handleClick(button, scope.row)"
          >{{button.title}}</el-button>
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
import { listData } from "@/api/system/dict/data";
import ImageInput from "./imageInput.vue";
import ImagePreview from "@/components/ImagePreview/index.vue";
import FileInput from "./fileInput.vue"

export default {
  name: "Data",
  components:{ ImageInput, ImagePreview, FileInput },
  dicts: ['sys_normal_disable'],
  props: {
    dictType:{
      type: String,
      require: true
    },
    refresh: {
      type: Boolean,
      default: false
    },
    buttons: {
      type: Array,
      default: function() { return [] }
    },
    showToolbar: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      // 遮罩层
      loading: false,
      // 显示搜索条件
      showSearch: true,
      menuQuery: {},
      // 总条数
      total: 0,
      // 字典表格数据
      dataList: [],
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        dictName: undefined,
        dictType: undefined,
        status: undefined
      }
    };
  },
  created() {
    this.menuQuery = {
      dictType : this.dictType
    }
    this.getList();
  },
  methods: {
    handleClick(button, row) {
      this.$emit('click', button, row);
    },
    downloadCode(row) {
      let data = '';
      try {
        data = JSON.stringify(JSON.parse(row.dictValue), null, "  ");
      }catch{
        data = row.dictValue;
      }
      const blob = new Blob([data], { type: 'text/plain;charset=utf-8' });
      this.$download.saveAs(blob, row.dictLabel + '.json')
    },
    downloadFile(row) {
      const path = process.env.VUE_APP_BASE_API + row.dictValue;
      window.open(path, '_self');
    },
    /** 查询字典数据列表 */
    getList() {
      this.loading = true;
      this.queryParams.dictType = this.dictType;
      listData(this.queryParams).then(response => {
        this.dataList = response.rows;
        this.total = response.total;
        this.loading = false;
      });
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm");
      this.queryParams.dictType = this.dictType;
      this.handleQuery();
    }
  },
  watch:{
    refresh() {
      this.getList();
    }
  }
};
</script>

<style lang="scss" scoped>
.dict-label-cell {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
</style>
