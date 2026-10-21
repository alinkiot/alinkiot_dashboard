<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" class="search-form">
      <el-form-item v-for="item in column" v-if="item.isSearch" :label="item.label" :key="item.key" :prop="item.key">
        <el-input v-model="item.value" :placeholder="item.label" clearable/>
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
            v-hasPermi="['system:project:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
            :type="selectionMode ? 'danger' : 'default'"
            icon="el-icon-delete"
            size="mini"
            @click="handleDeleteClick"
            v-hasPermi="['system:project:remove']"
        >{{ selectionMode ? '删除' + (ids.length > 0 ? '(' + ids.length + ')' : '') : '删除' }}</el-button>
      </el-col>
    </el-row>
    <div v-if="tableList.length > 0" v-loading="loading">
      <el-row :gutter="16">
        <el-col :xs="24" :sm="12" :md="8" :lg="8" :xl="6" v-for="project in tableList" :key="project.name" style="margin-bottom: 16px;">
          <el-card class="project-card" :class="{'project-card--active': currProject===project.name}" shadow="never">
            <div slot="header" class="card-header">
              <div class="card-header-left">
                <el-checkbox v-if="selectionMode" @change="checked => handleSelectionChange(checked, project)" />
                <div class="card-header-logo" v-if="project.logo">
                  <ImagePreview :src="project.logo"/>
                </div>
                <div class="card-header-logo card-header-logo--placeholder" v-else>
                  <i class="el-icon-folder-opened"></i>
                </div>
                <div class="card-header-info">
                  <span class="card-header-title" @click="handleUpdate(project)">{{ project.title }}</span>
                  <span class="card-header-name">{{ project.name }}</span>
                </div>
              </div>
              <template v-if="currProject===project.name">
                <span class="status-badge" :style="'background:'+ theme + ';'">
                  <i class="el-icon-check"></i> 当前
                </span>
              </template>
            </div>
            <div class="card-body">
              <div class="card-info-list">
                <div class="card-info-item" v-for="item in column" :key="item.key">
                  <span class="card-info-label">{{ item.label }}</span>
                  <span class="card-info-value">{{ getValue(project, item) || '-' }}</span>
                </div>
                <div class="card-info-item">
                  <span class="card-info-label">行业分类</span>
                  <span class="card-info-value">
                    <dict-tag :options="dict.type.iot_category" :value="project.category"/>
                  </span>
                </div>
                <div class="card-info-item">
                  <span class="card-info-label">创建时间</span>
                  <span class="card-info-value">{{ parseTime(project.createTime, '{y}-{m}-{d}') }}</span>
                </div>
              </div>
            </div>
            <div class="card-footer">
              <el-button
                size="mini"
                icon="el-icon-edit-outline"
                v-hasPermi="['system:project:query']"
                @click="handleUpdate(project)"
              >编辑</el-button>
              <el-button
                size="mini"
                icon="el-icon-setting"
                v-hasPermi="['system:config:query']"
                @click="handleConfig(project)"
              >配置</el-button>
              <el-button
                v-if="currProject!==project.name"
                size="mini"
                type="primary"
                icon="el-icon-s-home"
                @click="goProject('change', project)"
              >访问</el-button>
              <el-button
                v-else
                size="mini"
                type="danger"
                icon="el-icon-close"
                @click="goProject('logout', project)"
              >退出</el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
      <pagination
        v-show="total>0"
        :total="total"
        :page.sync="queryParams.pageNum"
        :limit.sync="queryParams.pageSize"
        @pagination="getList"
      />
    </div>
    <el-empty v-else description="无项目"/>

    <el-drawer :title="title" :visible.sync="open" direction="rtl" size="40%">
      <el-form ref="createForm" :model="form" :rules="rules" label-width="80px" style="padding: 10px;">
        <el-form-item label="项目标识" prop="name">
          <el-input v-model="form.name" placeholder="请输入项目标识" />
        </el-form-item>
        <el-form-item label="项目名称" prop="title">
          <el-input v-model="form.title" placeholder="请输入项目名称" />
        </el-form-item>
        <el-form-item label="所属公司" prop="productType">
          <el-input v-model="form.company" />
        </el-form-item>
        <el-form-item label="项目图标" prop="logo">
          <ImageUpload :limit=1 @input="handleFile" :value="form.logo"/>
        </el-form-item>
        <el-form-item label="行业分类" prop="category">
          <el-select v-model="form.category" placeholder="请选择行业分类">
            <el-option
                v-for="dict in dict.type.iot_category"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
            />
          </el-select>
          <el-button style="margin-left:5px;" size="mini" type="primary" icon="el-icon-plus" circle @click="addCategory"></el-button>
        </el-form-item>
        <el-form-item label="是否禁用" prop="status">
          <el-switch
            v-model="form.status"
            active-value="0"
            inactive-value="1"
          ></el-switch>
        </el-form-item>
        <el-form-item label="访问域名" prop="domain">
          <el-input v-model="form.domain" placeholder="访问域名" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入内容" />
        </el-form-item>
        <el-form-item>
          <el-button size="mini" type="primary" @click="submitForm">确 定</el-button>
          <el-button size="mini" @click="cancel">取 消</el-button>
        </el-form-item>
      </el-form>
    </el-drawer>
  </div>
</template>

<script>
import { queryObject, getObject, delObject, createObject, updateObject } from "@/api/iot/table";
import { checkPermi } from "@/utils/permission";
import {toProject, getProject} from "@/api/iot/system";
import { siteInfo } from "@/api/login";
import {validate2Check} from "@/assets/js/iot";
export default {
  name: "Project",
  dicts: ['sys_normal_disable', 'iot_category'],
  data() {
    return {
      table: 'project',
      desc: '项目',
      // 遮罩层
      loading: true,
      // 选中数组
      ids: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 选择模式
      selectionMode: false,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 表格数据
      tableList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      selection:[],
      open: false,
      column: [],
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10
      },
      //当前项目
      currProject: undefined,
      // 表单参数
      form: {  },
      // 表单校验
      rules: {
        name: [
          {required: true, validator: validate2Check, message: "项目标识只能为0-9、a-z、A-Z", trigger: "blur"}
        ],
        title: [
          { required: true, message: "项目名称不能为空", trigger: "blur" }
        ]
      }
    };
  },
  computed:{
    theme() {
      return this.$store.state.settings.theme;
    }
  },
  created() {
    const project = this.$route.params.project;
    this.currProject = getProject(project);
    this.column = [
      {label:'项目名称', key:'title', isSearch: true, regx: true},
      {label:'所属公司', key:'company', isSearch: true, regx: true}
    ];
    this.getList();
  },
  methods: {
    checkPermi,
    getValue(project, item) {
      return project[item.key];
    },
    /** 查询列表 */
    getList() {
      this.loading = true;
      const query = {
        pageNum: this.queryParams.pageNum,
        pageSize: this.queryParams.pageSize
      };
      this.column.filter(item => {
        if(item.isSearch && item.value && item !== ''){
          const name = item.regx ? item.key + '[like]' : item.key;
          query[name] = item.value;
        }
      });
      queryObject(this.table, query).then(response => {
        this.tableList = response.rows;
        this.total = response.total;
        this.loading = false;
      });
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
        title: undefined,
        company: undefined,
        category:"0",
        status: "0",
        remark: undefined
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
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm");
      this.handleQuery();
    },
    // 多选框选中数据

    handleSelectionChange(checked, project) {
      if(checked){
        this.selection.push(project)
      }else{
        this.selection = this.selection.filter(item => { return item.id !== project.id })
      }
      this.ids = this.selection.map(item => item.id)
      this.single = this.selection.length!==1
      this.multiple = !this.selection.length
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
      const id = row.id
      this.loading = true;
      getObject(this.table, id).then(response => {
        this.form = response.data;
        this.loading = false;
        this.open = true;
        this.title = "修改" + this.desc;
      });
    },
    handleFile(path) {
      this.form.logo = path;
    },
    /** 提交按钮 */
    submitForm: function() {
      this.$refs["queryForm"].validate(valid => {
        if (valid) {
          if (this.form.id !== undefined) {
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
    handleConfig(row) {
      const project = this.$route.params.project;
      if(project){
        this.$router.push({
          path: '/' + project + '/project/config',
          query: { projectId: row.id }
        });
      }else{
        this.$router.push({
          path: '/project/config',
          query: { projectId: row.id }
        });
      }
    },
    goProject(type, project) {
      if(type === 'logout'){
        this.$store.dispatch('LogOut').then(() => {
          location.href = '/' + toProject(project.name) + '/login';
        })
      }else{
        // 使用 siteInfo 接口按 project 查询参数检测站点配置是否存在。
        // 注意：不能用 listConfig，因为 request 拦截器会把当前激活项目写入
        // project 请求头，导致查询的是“当前项目”而非被点击项目的配置，
        // 从而出现“接口有数据却仍提示未配置”的问题。
        siteInfo(toProject(project.name)).then(response => {
          const data = response && response.data;
          const hasSite = data && (typeof data !== 'object' || Object.keys(data).length > 0);
          if(hasSite){
            location.href = '/' + toProject(project.name) + '/index';
          }else{
            this.promptSiteConfig(project);
          }
        }).catch(() => {
          // 查询失败按未配置处理，引导用户前往配置
          this.promptSiteConfig(project);
        });
      }
    },
    promptSiteConfig(project) {
      this.$confirm('该项目尚未创建站点配置，请先前往配置站点信息。', '提示', {
        confirmButtonText: '前往配置',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const routeProject = this.$route.params.project;
        if(routeProject){
          this.$router.push({
            path: '/' + routeProject + '/project/config',
            query: { projectId: project.id, configKey: 'site_info' }
          });
        }else{
          this.$router.push({
            path: '/project/config',
            query: { projectId: project.id, configKey: 'site_info' }
          });
        }
      }).catch(() => {});
    },
    handleDeleteClick() {
      if (!this.selectionMode) {
        this.selectionMode = true;
        this.ids = [];
        this.selection = [];
      } else if (this.ids.length > 0) {
        this.handleDelete({});
      } else {
        this.selectionMode = false;
      }
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
    addCategory() {
      const project = this.$route.params.project
      if(project){
        this.$router.push({
          path: '/' + project + '/system/dict-data/index/iot_category'
        });
      }else{
        this.$router.push({
          path: '/system/dict-data/index/iot_category'
        });
      }
    }
  }
};
</script>

<style lang="scss" scoped>

.el-row {
  display: flex;
  flex-wrap: wrap;
}

.project-card {
  height: 100%;
  border-radius: 8px;
  overflow: hidden;
  // 覆盖全局 .el-card 的 hover 阴影（apple-overrides.scss），避免卡片浮出
  box-shadow: none !important;

  &:hover {
    box-shadow: none !important;
    transform: none !important;
  }

  &--active {
    border: 1px solid var(--el-color-primary, #409eff);
  }
}

::v-deep .el-card__header {
  padding: 14px 16px;
  border-bottom: 1px solid #f0f2f5;
  background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
}

::v-deep .el-card__body {
  padding: 0;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
  overflow: hidden;
}

.card-header-logo {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;

  ::v-deep img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &--placeholder {
    background: linear-gradient(135deg, #e8f4fd 0%, #d4ecfa 100%);
    color: #409eff;
    font-size: 20px;
  }
}

.card-header-info {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.card-header-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  &:hover {
    color: #409eff;
  }
}

.card-header-name {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 8px;
  border-radius: 10px;
  color: #fff;
  font-size: 12px;
  white-space: nowrap;
  flex-shrink: 0;
}

.card-body {
  padding: 16px;
}

.card-info-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.card-info-item {
  display: flex;
  align-items: center;
  font-size: 13px;
  line-height: 1.4;
}

.card-info-label {
  color: #909399;
  width: 70px;
  flex-shrink: 0;

  &::after {
    content: ':';
  }
}

.card-info-value {
  color: #303133;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 10px 16px;
  border-top: 1px solid #f0f2f5;
  background: #fafbfc;
  gap: 4px;
}

</style>
