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
      <right-toolbar :table="table"  :showSearch.sync="showSearch" @queryTable="getList" @download="handleExport"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="tableList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column v-for="item in column" :key="item.key" :label="item.label" :prop="item.key" :width="item.width" :min-width="item.minWidth" show-overflow-tooltip />
      <el-table-column label="启用状态" align="center" prop="status">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.sys_normal_disable" :value="scope.row.status"/>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" prop="createTime" width="180">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
              type="text"
              icon="el-icon-plus"
              size="mini"
              @click="addUsers(scope.row)"
          >成员</el-button>
          <el-button
              size="mini"
              type="text"
              icon="el-icon-edit"
              @click="handleUpdate(scope.row)"
          >编辑</el-button>
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

    <!-- 添加或修改对话框 -->
    <el-dialog :title="title" :visible.sync="openDialog" width="500px" >
      <el-form ref="createForm" :model="form" :rules="rules" label-width="80px">
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
      <div slot="footer" class="dialog-footer">
        <el-button size="mini" type="primary" @click="submitForm">确 定</el-button>
        <el-button size="mini" @click="cancel">取 消</el-button>
      </div>
    </el-dialog>

    <el-dialog title="编辑成员" :visible.sync="openUserDialog" >
      <el-form>
        <el-empty v-if="users.length == 0" description="暂无数据"></el-empty>
        <el-card v-else class="box-card" shadow="never">
          <el-tag style="margin: 5px;"
                  v-for="user in users"
                  :key="user.id"
                  closable
                  @close="removeUser(user)"
          >{{user.userName}}
          </el-tag>
        </el-card>
        <InputTableSelect  showColumn="nickName" label="搜索成员" table="user" @selectDone="selectDone"/>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button size="mini" type="primary" @click="submitUsersForm">确 定</el-button>
      </div>
    </el-dialog>

  </div>
</template>

<script>
import InputTableSelect from "@/components/InputTableSelect";
import { queryObject, getObject, delObject, createObject, updateObject } from "@/api/iot/table";

export default {
  name: "Group",
  components: {
    InputTableSelect
  },
  dicts: ['sys_normal_disable'],
  data() {
    return {
      table: 'group',
      desc: '群组',
      // 遮罩层
      loading: true,
      currentRow: undefined,
      users: [],
      // 选中数组
      ids: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 表格数据
      tableList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      openDialog: false,
      openUserDialog: false,
      column: [],
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10
      },

      // 表单参数
      form: {},
      // 表单校验
      rules: {
        name: [
          { required: true, message: "群组不能为空", trigger: "blur" }
        ]
      }
    };
  },
  created() {
    this.column = [
      {label:'ID', key:'id', width:40},
      {label:'群组名称', key:'name', isSearch: true},
      {label:'备注', key:'remark'}
    ],
    this.getList();
  },
  methods: {
    /** 查询列表 */
    getList() {
      this.loading = true;
      queryObject(this.table, this.queryParams).then(response => {
        this.tableList = response.rows;
        this.total = response.total;
        this.loading = false;
      });
    },
    // 取消按钮
    cancel() {
      this.openDialog = false;
      this.reset();
    },
    // 表单重置
    reset() {
      this.form = {};
      this.resetForm("createForm");
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.column.filter(item => {
        if(item.isSearch){
          if(item.value && item !== ''){
            this.queryParams[item.key] = item.value;
          }else{
            this.queryParams[item.key] = undefined;
          }
        }
      });
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm");
      this.handleQuery();
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length!=1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.openDialog = true;
      this.title = "添加" + this.desc;
    },
    addUsers(row) {
      this.openUserDialog = true;
      this.currentRow = row;
      this.users = row.users ? JSON.parse(row.users) : [];
    },
    selectDone: function(user){
      const old = this.users.filter(item => {
        return item.userName == user.userName
      });
      if(old && old.length > 0){
        console.log(old);
      }else{
        this.users.push({
          userId: user.userId,
          userName: user.userName
        });
      }
    },
    removeUser(user) {
      const users = this.users.filter(item => {
        return item.userId !== user.userId
      });
      this.users = users;
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const id = row.id || this.ids
      getObject(this.table, id).then(response => {
        this.form = response.data;
        this.openDialog = true;
        this.title = "修改" + this.desc;
      });
    },
    /** 提交按钮 */
    submitForm: function() {
      this.$refs["queryForm"].validate(valid => {
        if (valid) {
          if (this.form.id != undefined) {
            updateObject(this.table, this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.openDialog = false;
              this.getList();
            });
          } else {
            this.form.users = JSON.stringify([])
            createObject(this.table, this.form).then(response => {
              this.$modal.msgSuccess("新增成功");
              this.openDialog = false;
              this.getList();
            });
          }
        }
      });
    },
    submitUsersForm: function() {
      const data = { id: this.currentRow.id, users: JSON.stringify(this.users) };
      updateObject(this.table, data).then(response => {
        this.$modal.msgSuccess("修改成功");
        this.openUserDialog = false;
        this.getList();
      });
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const ids = row.id || this.ids;
      const table = this.table;
      this.$modal.confirm('是否确认删除'+this.desc+'ID为"' + ids + '"的数据项？').then(function() {
        return delObject(table, ids);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('system/export/'+ this.table, {
        ...this.queryParams
      }, this.desc+`_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>

<style lang="scss" scoped>

</style>
