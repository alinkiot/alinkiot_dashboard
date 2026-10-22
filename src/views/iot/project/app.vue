<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" class="search-form">
      <el-form-item label="所属项目" prop="project">
        <el-select
          v-model="queryParams.project"
          placeholder="全部项目"
          clearable
          filterable
          @change="handleQuery"
        >
          <el-option label="全部项目" value="" />
          <el-option
            v-for="project in projectOptions"
            :key="project.id"
            :label="project.title"
            :value="project.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item v-for="item in column" v-if="item.isSearch" :label="item.label" :key="item.key" :prop="item.key">
        <el-input v-model="item.value" :placeholder="item.label" clearable/>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
<!--        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>-->
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
            type="primary"

            icon="el-icon-plus"
            size="mini"
            @click="handleAdd"
            v-hasPermi="['system:app:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
            type="danger"

            icon="el-icon-delete"
            size="mini"
            :disabled="multiple"
            @click="handleDelete"
            v-hasPermi="['system:app:remove']"
        >删除</el-button>
      </el-col>
      <right-toolbar :table="table" :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="tableList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column v-for="item in column" :key="item.key" :label="item.label" :prop="item.key" :width="item.width" :min-width="item.minWidth" align="center" :formatter="formatRow" show-overflow-tooltip/>
      <el-table-column label="同步状态" align="center" prop="syncStatus" width="100px">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.sys_sync_status" :value="(scope.row.syncStatus === null || scope.row.syncStatus === undefined || scope.row.syncStatus === '') ? 'wait' : scope.row.syncStatus"/>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" prop="createTime" width="165">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
              size="mini"
              type="text"
              icon="el-icon-edit"
              v-hasPermi="['system:app:edit']"
              @click="handleUpdate(scope.row)"
          >编辑</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-refresh"
            @click="showSyncDlg(scope.row)"
            v-hasPermi="['system:project:sync']"
          >同步</el-button>
          <el-button
              size="mini"
              type="text"
              icon="el-icon-delete"
              style="color:red;"
              @click="handleDelete(scope.row)"
              v-hasPermi="['system:app:remove']"
          >删除</el-button>
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

    <el-dialog :title="title" :visible.sync="open" width="500px" >
      <el-form ref="createForm" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="应用名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入项目标识" />
        </el-form-item>
        <InputTableSelect :queryId="form.project" showColumn="title" label="项目" table="project" @selectDone="selectProjectDone" prop="project"/>
        <el-form-item label="appId" prop="appid">
          <el-input maxlength="8"  v-model="form.appid" placeholder="请输入应用 appid">
            <el-button @click="createAppid" slot="append">随机生成</el-button>
          </el-input>
        </el-form-item>
        <el-form-item label="Secret" prop="secret">
          <el-input maxlength="16" v-model="form.secret" placeholder="请输入应用密钥">
            <el-button @click="createSecret" slot="append">随机生成</el-button>
          </el-input>
        </el-form-item>
        <el-form-item label="过期时间" prop="expire">
          <el-input v-model.number="form.expire" placeholder="过期时间"/>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入内容" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button size="mini" type="primary" @click="submitForm">确 定</el-button>
        <el-button size="mini" @click="cancel">取 消</el-button>
      </div>
    </el-dialog>
    <el-dialog title="数据变更通知"
               :visible.sync="openSync"
               :before-close="cancelSyncDlg" width="500px" >
      <div class="sync-dialog-body">
        <el-radio-group v-model="syncEvent" class="sync-radio-group">
          <el-radio label="syncBaseData">基本数据(设备、产品、场景、项目)</el-radio>
          <el-radio label="syncDeviceStatus">设备在线状态</el-radio>
        </el-radio-group>
        <el-alert class="sync-alert"
          title="同步说明"
          type="warning"
          description="该操作会通知应用有数据更新，应用收到通知后重新拉取数据。"
          :closable="false"
          show-icon>
        </el-alert>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button size="mini" type="primary" @click="doSync">确 定</el-button>
        <el-button size="mini" @click="cancelSyncDlg">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import InputTableSelect from "@/components/InputTableSelect";
import { queryObject, getObject, delObject, createObject, updateObject } from "@/api/iot/table";
import {randomString, validateCheck} from "@/assets/js/iot";
import { syncApp } from "@/api/iot/system";

export default {
  name: "App",
  dicts: [ 'sys_sync_status' ],
  components: { InputTableSelect },
  data() {
    return {
      table: 'app',
      desc: '应用管理',
      // 遮罩层
      loading: true,
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
      syncEvent: "syncBaseData",
      // 是否显示弹出层
      open: false,
      column: [],
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        project: ''
      },
      app: undefined,
      openSync: false,
      // 表单参数
      form: { name: '', appid : '',  secret:'', expire:7200, syncStatus: 'wait' },
      projects: [],
      projectOptions: [],
      // 表单校验
      rules: {
        name: [
          { required: true, message: "应用不能为空", trigger: "blur" }
        ],
        appid: [
          { required: true, message: "appid不能为空", trigger: "blur" }
        ],
        secret: [
          { required: true, message: "secret不能为空", trigger: "blur" }
        ],
        project: [
          { self: this, validator: validateCheck,required: true, message: "项目不能为空", trigger: "blur" }
        ]
      }
    };
  },
  created() {
    this.column = [
      {label:'ID', key:'id', width:40},
      {label:'应用名称', key:'name', isSearch: true, regx: true},
      {label:'所属项目', key:'project'},
      // {label:'AppID', key:'appid'},
      {label:'备注', key:'remark'}
    ];
    this.getProjectOptions();
    this.getList();
  },
  methods: {
    getProjectOptions() {
      const pageSize = 100;
      const projectOptions = [];
      const projectIds = new Set();
      const loadPage = pageNum => queryObject('project', { pageNum, pageSize }).then(response => {
        const rows = Array.isArray(response.rows) ? response.rows : [];
        const newProjects = rows.filter(project => {
          const id = String(project.id);
          if (projectIds.has(id)) {
            return false;
          }
          projectIds.add(id);
          return true;
        });
        projectOptions.push(...newProjects);

        const total = Number(response.total);
        const hasLoadedAll = (total > 0 && projectOptions.length >= total) || rows.length < pageSize || newProjects.length === 0;
        if (!hasLoadedAll) {
          return loadPage(pageNum + 1);
        }
        this.projectOptions = projectOptions;
      });
      loadPage(1).catch(() => {
        this.$modal.msgError('项目列表加载失败');
      });
    },
    /** 查询列表 */
    getList() {
      this.loading = true;
      const query = {
        pageNum: this.queryParams.pageNum,
        pageSize: this.queryParams.pageSize,
        project: this.queryParams.project || undefined
      };
      this.column.filter(item => {
        if(item.isSearch && item.value && item !== ''){
          const name = item.regx ? item.key + '[like]' : item.key;
          query[name] = item.value;
        }
      });
      queryObject(this.table, query).then(response => {
        const rows = response.rows;
        const total= response.total;
        const ids = [];
        rows.map(row => {
          if(row.project && !ids.includes(row.project)){
            ids.push(row.project);
          }
        });
        if(ids.length > 0){
          getObject('project', ids.join(',')).then(response => {
            const projects = response.data;
            if(Array.isArray(projects)){
              this.projects = projects;
            }else{
              this.projects.push(projects)
            }
            this.tableList = rows;
            this.total = total;
            this.loading = false;
          }).catch(err => {
            this.tableList = rows;
            this.total = total;
            this.loading = false;
          });
        }else{
          this.tableList = rows;
          this.total = total;
          this.loading = false;
        }
      });
    },
    selectProjectDone(project) {
      if(project){
        this.form.project = project.id;
      }else{
        this.form.project = undefined;
      }
    },
    formatRow(row, column) {
      switch (column.property){
        case 'project':
          const project = this.projects.filter(item => {
            return item.id === row.project
          });
          return project && project[0] ? project[0].title : '-';
        default:
          return row[column.property];
      }
    },
    createAppid: function(){
      this.form.appid = randomString(8);
    },
    createSecret: function(){
      this.form.secret = randomString(16);
    },
    // 取消按钮
    cancel() {
      this.open = false;
      this.reset();
    },
    // 表单重置
    reset() {
      this.form = {
        name: undefined,
        appid: '',
        secret: '',
        expire: 7200,
        syncStatus: 'wait'
      };
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
    // /** 重置按钮操作 */
    // resetQuery() {
    //   this.resetForm("queryForm");
    //   this.handleQuery();
    // },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length!=1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加" + this.desc;
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const id = row.id || this.ids
      getObject(this.table, id).then(response => {
        this.form = response.data;
        this.open = true;
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
              this.open = false;
              this.getList();
            });
          } else {
            createObject(this.table, this.form).then(response => {
              this.$modal.msgSuccess("新增成功");
              this.open = false;
              this.getList();
            });
          }
        }
      });
    },

    showSyncDlg(row) {
      this.openSync = true;
      this.app = row;
    },
    cancelSyncDlg() {
      this.openSync = false;
      this.app = undefined;
    },
    doSync(){
      syncApp(this.app.id, this.syncEvent).then(res =>{
        this.getList();
        this.$modal.msgSuccess("操作成功!");
      })
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
    }
  }
};
</script>

<style lang="scss" scoped>
.sync-dialog-body {
  .sync-radio-group {
    display: flex;
    flex-direction: column;
    gap: 14px;

    ::v-deep .el-radio {
      margin-right: 0;
      display: flex;
      align-items: center;
    }
  }

  .sync-alert {
    margin-top: 20px;
  }
}
</style>

<!-- 深色主题适配：el-alert(warning) 在深色背景下的配色 -->
<style lang="scss">
.theme-dark,
.theme-dark-blue,
.theme-green {
  .sync-dialog-body {
    .sync-alert.el-alert--warning.is-light {
      background-color: rgba(230, 162, 60, 0.14) !important;
      border: 1px solid rgba(230, 162, 60, 0.35);

      .el-alert__title,
      .el-alert__description {
        color: #f5d08a !important;
      }
      .el-alert__icon {
        color: #e6a23c !important;
      }
    }
  }
}
</style>
