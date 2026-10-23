<template>
  <div class="dict-data">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" class="dict-search">
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
    <el-table v-loading="loading" :data="displayRows" row-key="dictCode" class="dict-data-table" empty-text="暂无字典数据">
      <el-table-column label="编码" align="center" prop="dictCode" width="80">
        <template slot-scope="scope"><span class="dict-secondary">{{ scope.row.dictCode }}</span></template>
      </el-table-column>
      <el-table-column label="字典标签" prop="dictLabel" min-width="170" show-overflow-tooltip>
        <template slot-scope="scope">
          <span class="dict-label-cell">
            <svg-icon v-if="scope.row.cssClass" :icon-class="scope.row.cssClass"/>
            <el-tag v-if="scope.row.listClass === 'primary' || scope.row.listClass === 'success' || scope.row.listClass === 'info' || scope.row.listClass === 'warning' || scope.row.listClass === 'danger'" :type="scope.row.listClass">{{scope.row.dictLabel}}</el-tag>
            <span v-else>{{scope.row.dictLabel}}</span>
          </span>
        </template>
      </el-table-column>
      <el-table-column label="键值 / 内容" prop="dictValue" min-width="300">
        <template slot-scope="scope">
          <span v-if="scope.row.mediaError" class="dict-error">{{ scope.row.mediaError }}</span>
          <div v-else-if="scope.row.media" class="dict-media">
            <ImagePreview v-if="scope.row.media.type === 'image'" :src="scope.row.media.path" :width="40" :height="40"/>
            <div class="dict-content">
              <div class="dict-value-line">
                <el-tag size="mini" effect="plain" type="info">{{ scope.row.media.type.toUpperCase() }}</el-tag>
                <span class="dict-key" :title="scope.row.media.value">{{ scope.row.media.value || '未设置键值' }}</span>
              </div>
              <el-link class="dict-file-link" :underline="false" @click="downloadFile(scope.row)">
                <i class="el-icon-document" />
                <span class="dict-ellipsis" :title="scope.row.media.path">{{ fileName(scope.row.media.path) }}</span>
                <i class="el-icon-download" />
              </el-link>
            </div>
          </div>
          <div v-else-if="scope.row.listClass === 'code'" class="dict-content">
            <div class="dict-value-line">
              <el-tag size="mini" effect="plain" type="info">长文本</el-tag>
              <el-button type="text" size="mini" icon="el-icon-download" @click="downloadCode(scope.row)">下载内容</el-button>
            </div>
            <div class="dict-code-preview" :title="String(scope.row.dictValue || '').slice(0, 500)">{{ scope.row.dictValue || '暂无内容' }}</div>
          </div>
          <span v-else class="dict-key dict-text-value" :title="scope.row.dictValue">{{ scope.row.dictValue }}</span>
        </template>
      </el-table-column>
      <el-table-column label="排序" align="center" prop="dictSort" width="70" />
      <el-table-column label="状态" align="center" prop="status" width="90">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.sys_normal_disable" :value="scope.row.status"/>
        </template>
      </el-table-column>
      <el-table-column label="备注" prop="remark" min-width="140" :show-overflow-tooltip="true">
        <template slot-scope="scope"><span class="dict-secondary">{{ scope.row.remark || '—' }}</span></template>
      </el-table-column>
      <el-table-column label="创建时间" prop="createTime" width="165">
        <template slot-scope="scope">
          <span class="dict-secondary">{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column v-if="buttons.length" label="操作" align="center" class-name="small-padding fixed-width" fixed="right" :width="Math.max(150, buttons.length * 75)">
        <template slot-scope="scope">
          <el-button v-for="button in buttons" :key="button.key"
            size="mini"
            type="text"
            :icon="button.icon"
            :class="{ 'dict-remove': button.key === 'remove' }"
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
import ImagePreview from "@/components/ImagePreview/index.vue";
import { isMediaDict, parseMediaDict } from "@/utils/dict/media";
import { isExternal } from "@/utils/validate";

export default {
  name: "Data",
  components:{ ImagePreview },
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
  computed: {
    displayRows() {
      return this.dataList.map(row => {
        if (!isMediaDict(row)) return row;
        try {
          return { ...row, media: parseMediaDict(row) };
        } catch (error) {
          return { ...row, mediaError: error.message };
        }
      });
    }
  },
  created() {
    this.menuQuery = {
      dictType : this.dictType
    }
    this.getList();
  },
  methods: {
    fileName(path) {
      const name = String(path || "").split(/[?#]/)[0].split("/").pop();
      return name || "未上传文件";
    },
    mediaPath(row) {
      try {
        return parseMediaDict(row).path;
      } catch (error) {
        this.$modal.msgError(error.message);
        return "";
      }
    },
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
      const file = this.mediaPath(row);
      if (!file) return;
      const path = isExternal(file) ? file : process.env.VUE_APP_BASE_API + file;
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
  font-weight: 500;
}

.dict-search {
  padding: 16px 16px 0;
  margin-bottom: 12px;
  border: 1px solid rgba(128, 128, 128, 0.16);
  border-radius: 8px;

  ::v-deep .el-input,
  ::v-deep .el-select {
    width: 200px;
  }
}

.dict-secondary {
  color: #909399;
  font-size: 12px;
}

.dict-media, .dict-value-line {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.dict-content {
  min-width: 0;
  flex: 1;
}

.dict-key {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dict-text-value {
  display: block;
}

.dict-file-link {
  max-width: 100%;
  margin-top: 5px;
  font-size: 12px;

  ::v-deep .el-link--inner {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    max-width: 100%;
  }
}

.dict-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dict-code-preview {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  overflow-wrap: anywhere;
  font: 12px/1.7 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  color: #909399;
}

.dict-error, .dict-remove {
  color: #f56c6c;
}

.dict-data-table {
  ::v-deep td {
    padding-top: 14px;
    padding-bottom: 14px;
  }
}
</style>
