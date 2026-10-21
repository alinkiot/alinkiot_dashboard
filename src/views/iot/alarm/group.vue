<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" class="search-form">
      <el-form-item v-for="item in column" v-if="item.isSearch" :key="item.key" :label="item.label" :prop="item.key">
        <el-input v-model="item.value" :placeholder="item.label" clearable/>
      </el-form-item>
      <el-form-item label="启用状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="状态" clearable>
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
      <el-col :span="1.5">
        <el-button
            type="primary"
            icon="el-icon-plus"
            size="mini"
            @click="handleAdd"
            v-hasPermi="['system:group:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
            type="danger"
            icon="el-icon-delete"
            size="mini"
            :disabled="multiple"
            @click="handleDelete"
            v-hasPermi="['system:group:remove']"
        >删除</el-button>
      </el-col>
      <right-toolbar :table="table" :showSearch.sync="showSearch" @queryTable="getList" @download="handleExport"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="tableList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column v-for="item in column" :key="item.key" :label="item.label" :prop="item.key" :width="item.width" :min-width="item.minWidth" show-overflow-tooltip />
      <el-table-column label="成员数" align="center" width="80">
        <template slot-scope="scope">
          <el-tag size="small" type="info">{{ getMemberCount(scope.row) }} 人</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="启用状态" align="center" prop="status" width="90">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.sys_normal_disable" :value="scope.row.status"/>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" prop="createTime" width="160">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="120" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button size="mini" type="text" icon="el-icon-edit" @click="handleUpdate(scope.row)">编辑</el-button>
          <el-button size="mini" type="text" icon="el-icon-delete" @click="handleDelete(scope.row)" v-hasPermi="['system:group:remove']">删除</el-button>
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

    <!-- 新增/编辑对话框（带 Tab） -->
    <el-dialog :title="title" :visible.sync="openDialog" width="560px" @close="cancel">
      <el-tabs v-model="activeTab">
        <!-- 基本信息 -->
        <el-tab-pane label="基本信息" name="info">
          <el-form ref="createForm" :model="form" :rules="rules" label-width="80px" style="margin-top:12px">
            <el-form-item label="群组名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入群组名称" />
            </el-form-item>
            <el-form-item label="启用状态" prop="status">
              <el-radio-group v-model="form.status">
                <el-radio
                    v-for="dict in dict.type.sys_normal_disable"
                    :key="dict.value"
                    :label="dict.value"
                >{{dict.label}}</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="备注" prop="remark">
              <el-input v-model="form.remark" type="textarea" placeholder="备注" />
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 成员管理（编辑时才显示） -->
        <el-tab-pane label="成员管理" name="members" :disabled="!form.id">
          <div style="margin-top:12px">
            <InputTableSelect showColumn="nickName" label="添加成员" table="user" @selectDone="selectDone" />
            <el-divider v-if="users.length > 0" content-position="left">已添加成员（{{ users.length }} 人）</el-divider>
            <el-empty v-if="users.length === 0" description="暂无成员，请从上方搜索添加" :image-size="80" />
            <div v-else class="member-list">
              <div v-for="user in users" :key="user.userId" class="member-item">
                <i class="el-icon-user-solid member-avatar"></i>
                <span class="member-name">{{ user.userName }}</span>
                <el-button type="text" size="mini" icon="el-icon-close" class="member-remove" @click="removeUser(user)">移除</el-button>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>

      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import InputTableSelect from "@/components/InputTableSelect";
import { queryObject, getObject, delObject, createObject, updateObject } from "@/api/iot/table";

export default {
  name: "Group",
  components: { InputTableSelect },
  dicts: ['sys_normal_disable'],
  data() {
    return {
      table: 'group',
      desc: '群组',
      loading: true,
      currentRow: undefined,
      users: [],
      ids: [],
      single: true,
      multiple: true,
      showSearch: true,
      total: 0,
      tableList: [],
      title: "",
      openDialog: false,
      activeTab: 'info',
      column: [],
      queryParams: {
        pageNum: 1,
        pageSize: 10
      },
      form: {},
      rules: {
        name: [{ required: true, message: "群组名称不能为空", trigger: "blur" }]
      }
    };
  },
  created() {
    this.column = [
      { label: 'ID', key: 'id', width: 60 },
      { label: '群组名称', key: 'name', isSearch: true },
      { label: '备注', key: 'remark' }
    ];
    this.getList();
  },
  methods: {
    getMemberCount(row) {
      if (!row.users) return 0;
      try { return JSON.parse(row.users).length; } catch { return 0; }
    },
    getList() {
      this.loading = true;
      queryObject(this.table, this.queryParams).then(response => {
        this.tableList = response.rows;
        this.total = response.total;
        this.loading = false;
      });
    },
    cancel() {
      this.openDialog = false;
      this.activeTab = 'info';
      this.users = [];
      this.form = {};
      this.$nextTick(() => {
        this.$refs.createForm && this.$refs.createForm.clearValidate();
      });
    },
    handleQuery() {
      this.column.filter(item => {
        if (item.isSearch) {
          this.queryParams[item.key] = (item.value && item.value !== '') ? item.value : undefined;
        }
      });
      this.queryParams.pageNum = 1;
      this.getList();
    },
    resetQuery() {
      this.resetForm("queryForm");
      this.handleQuery();
    },
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id);
      this.single = selection.length !== 1;
      this.multiple = !selection.length;
    },
    handleAdd() {
      this.form = {};
      this.users = [];
      this.activeTab = 'info';
      this.openDialog = true;
      this.title = "新增" + this.desc;
    },
    handleUpdate(row) {
      this.form = {};
      this.users = [];
      this.activeTab = 'info';
      getObject(this.table, row.id).then(response => {
        this.form = response.data;
        this.users = response.data.users ? JSON.parse(response.data.users) : [];
        this.openDialog = true;
        this.title = "编辑" + this.desc;
      });
    },
    selectDone(user) {
      const exists = this.users.some(item => item.userId === user.userId);
      if (!exists) {
        this.users.push({ userId: user.userId, userName: user.userName });
      }
    },
    removeUser(user) {
      this.users = this.users.filter(item => item.userId !== user.userId);
    },
    submitForm() {
      this.$refs.createForm.validate(valid => {
        if (!valid) {
          this.activeTab = 'info';
          return;
        }
        const data = { ...this.form, users: JSON.stringify(this.users) };
        if (data.id) {
          updateObject(this.table, data).then(() => {
            this.$modal.msgSuccess("修改成功");
            this.openDialog = false;
            this.cancel();
            this.getList();
          });
        } else {
          createObject(this.table, data).then(() => {
            this.$modal.msgSuccess("新增成功");
            this.openDialog = false;
            this.cancel();
            this.getList();
          });
        }
      });
    },
    handleDelete(row) {
      const ids = row.id || this.ids;
      const name = row.name || '所选群组';
      const table = this.table;
      this.$modal.confirm('是否确认删除群组"' + name + '"？').then(function() {
        return delObject(table, ids);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    handleExport() {
      this.download('system/export/' + this.table, { ...this.queryParams }, this.desc + `_${new Date().getTime()}.xlsx`);
    }
  }
};
</script>

<style lang="scss" scoped>
.member-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 220px;
  overflow-y: auto;
}
.member-item {
  display: flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 6px;
  background: var(--el-fill-color, #f5f7fa);
  &:hover { background: #edf2ff; }
}
.member-avatar {
  font-size: 16px;
  color: #909399;
  margin-right: 8px;
}
.member-name {
  flex: 1;
  font-size: 13px;
}
.member-remove {
  color: #f56c6c !important;
  padding: 0 !important;
}
</style>
