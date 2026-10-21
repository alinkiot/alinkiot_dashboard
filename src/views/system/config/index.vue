<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" class="search-form">
      <InputTableSelect
        prop="project"
        showColumn="title"
        label="所属项目"
        table="project"
        :queryId="queryId"
        :read="queryId !== undefined"
        @selectDone="selectProjectDone"/>
    </el-form>
    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-tooltip class="item" effect="dark" :content="project ? '新增配置':'选择项目后可以新增'" placement="bottom">
          <el-button :disabled="!project"
                     type="primary"
                     icon="el-icon-plus"
                     size="mini"
                     @click="handleAdd"
                     v-hasPermi="['system:config:add']"
          >新增配置</el-button>
        </el-tooltip>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          icon="el-icon-delete"
          size="mini"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['system:config:remove']"
        >删除配置</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          icon="el-icon-refresh"
          size="mini"
          :disabled="multiple"
          @click="handleRefreshCache"
          v-hasPermi="['system:config:remove']"
        >刷新配置</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <div class="config-layout">
      <div class="config-menu">
        <el-menu
          :default-active="queryParams.configKey"
          @select="handleMenuSelect">
          <el-menu-item
            v-for="dict in dict.type.iot_sys_config"
            :key="dict.value"
            :index="dict.value">
            <i :class="getConfigIcon(dict.value)"></i>
            <span slot="title">{{ dict.label }}</span>
          </el-menu-item>
        </el-menu>
      </div>
      <div class="config-table">
        <el-table v-loading="loading" :data="configList" @selection-change="handleSelectionChange">
          <el-table-column type="selection" width="55" align="center" />
          <el-table-column label="参数键名" align="center" prop="configKey"/>
          <el-table-column label="参数名称" align="center" prop="configName" :show-overflow-tooltip="true" />
          <el-table-column label="参数类型" align="center" prop="configType">
            <template slot-scope="scope">
              <el-tag>{{getCfgType(scope.row.configKey)}}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="项目标识" align="center" prop="project" />
          <el-table-column label="参数说明" prop="remark" :show-overflow-tooltip="true" />
          <el-table-column label="前端配置" align="center" width="80">
            <template slot-scope="scope">
              <el-switch
                  v-model="scope.row.configType"
                  active-value="Y"
                  inactive-value="N"
                  @change="handleStatusChange(scope.row)"
              ></el-switch>
            </template>
          </el-table-column>
          <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
            <template slot-scope="scope">
              <el-button
                size="mini"
                type="text"
                icon="el-icon-edit-outline"
                v-hasPermi="['system:config:query']"
                @click="handleUpdate(scope.row)"
              >详情</el-button>
              <el-button
                size="mini"
                type="text"
                icon="el-icon-delete"
                @click="handleDelete(scope.row)"
                v-hasPermi="['system:config:remove']"
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
      </div>
    </div>
    <el-dialog
      title="编辑参数"
      :visible.sync="openEdit"
      width="450px">
      <el-form ref="formDict" :model="form" label-width="120px">
        <el-form-item label="参数类型">
          <el-tag v-if="form && form.configKey">{{getCfgType(form.configKey)}}</el-tag>
        </el-form-item>
        <el-form-item label="参数名称" prop="configName">
          <el-input v-model="form.configName" placeholder="请输入参数名称" />
        </el-form-item>
        <el-form-item label="参数说明" prop="remark">
          <el-input v-model="form.remark"  type="textarea" placeholder="请输入参数说明" />
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
          <el-button type="primary" @click="handleEdit">保存</el-button>
      </span>
    </el-dialog>
    <!-- 添加或修改参数配置对话框 -->
    <el-drawer direction="rtl"
               :title="title"
               :visible.sync="open"
               size="550px">
      <el-form ref="form" :model="form" :rules="rules" label-width="120px" style="padding: 20px;">
        <CommForm :form="form" :isCreate="isCreate" @edit="openEdit = true" />
        <WxDialog :form="form" @submit="submitForm" v-if="form.configKey === 'wechat'" />
        <SmsDialog :form="form" @submit="submitForm" v-else-if="form.configKey === 'sms'" />
        <MapDialog :form="form" @submit="submitForm" v-else-if="form.configKey === 'map'" />
        <WxMiniDialog :form="form" @submit="submitForm" v-else-if="form.configKey === 'wechat_mini'" />
        <SiteInfoDialog :form="form" :project="project" @submit="submitForm" v-else-if="form.configKey === 'site_info'" />
        <TdengineDialog :form="form" @submit="submitForm" v-else-if="form.configKey === 'tdengine'" />
        <RedisDialog :form="form" @submit="submitForm" v-else-if="form.configKey === 'redis'" />
        <MenuDlg :form="form" @submit="submitForm" v-else-if="form.configKey === 'menu'" />
        <ThemeDialog :form="form" @submit="submitForm" v-else-if="form.configKey === 'layout_setting'" />
        <MysqlDialog :form="form" @submit="submitForm" v-else-if="form.configKey === 'mysql'" />
        <AiDialog :form="form" @submit="submitForm" v-else-if="form.configKey === 'ai'" />
        <template v-else>
          <el-form-item label="参数键值" prop="configValue">
            <el-input v-model="form.configValue" placeholder="请输入参数键值" />
          </el-form-item>
          <div style="text-align: right;">
            <el-button size="mini" type="primary" @click="submitForm">确 定</el-button>
            <el-button size="mini" @click="cancel">取 消</el-button>
          </div>
        </template>
      </el-form>
    </el-drawer>
  </div>
</template>

<script>
import { listConfig, getConfig, delConfig, addConfig, updateConfig, refreshCache } from "@/api/system/config";
import ImageDialog from "./components/imageDialog.vue"
import WxDialog from "./components/wxDialog.vue"
import AiDialog from "./components/aiDialog.vue"
import MapDialog from "./components/mapDialog.vue";
import SmsDialog from "./components/smsDialog.vue"
import SiteInfoDialog from "./components/siteInfoDialog.vue"
import ImagePreview from "@/components/ImagePreview/index.vue";
import WxMiniDialog from "./components/wxMiniDialog.vue";
import TdengineDialog from "./components/tdDialog.vue";
import RedisDialog from "./components/redisDialog.vue";
import InputTableSelect from "@/components/InputTableSelect/index.vue";
import MenuDlg from "./components/menuDialog.vue";
import CommForm from "@/views/system/config/components/commForm.vue";
import ThemeDialog from "@/views/system/config/components/themeDialog.vue";
import MysqlDialog from "@/views/system/config/components/mysqlDialog.vue";


export default {
  name: "Config",
  dicts: ['sys_yes_no','iot_sys_config'],
  components: {
    ThemeDialog,
    InputTableSelect,
    ImageDialog,
    WxDialog,
    SmsDialog,
    SiteInfoDialog,
    ImagePreview,
    MapDialog,
    WxMiniDialog,
    TdengineDialog,
    RedisDialog,
    MenuDlg,
    CommForm,
    MysqlDialog,
    AiDialog
  },
  data() {
    return {
      // 遮罩层
      loading: false,
      queryId: undefined,
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
      // 参数表格数据
      configList: [],
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        configKey: undefined,
        project: undefined
      },
      project: undefined,
      projects: [],
      isCreate: true,
      // 表单参数
      form: {},
      openEdit: false,
      // 表单校验
      rules: {
        configName: [
          { required: true, message: "参数名称不能为空", trigger: "blur" }
        ],
        configKey: [
          { required: true, message: "参数键名不能为空", trigger: "blur" }
        ]
      }
    };
  },
  computed: {
    title() {
      const key = this.form.configKey
      if(key){
        const cfgs = this.dict.type.iot_sys_config
        const arr = cfgs.filter(item => { return item.value === key })
        return arr.length > 0 ? arr[0].label : '创建参数'
      }
      return '创建参数';
    }
  },
  watch: {
    'dict.type.iot_sys_config'(val) {
      if (val && val.length > 0 && !this.queryParams.configKey) {
        this.queryParams.configKey = val[0].value;
        this.getList();
      }
    },
    // 切换项目/项目ID 时（组件被复用、created 不再执行），重新按新路由初始化
    '$route'(to, from) {
      const toKey = to && to.query ? to.query.projectId : undefined;
      const fromKey = from && from.query ? from.query.projectId : undefined;
      const toProject = to && to.params ? to.params.project : undefined;
      const fromProject = from && from.params ? from.params.project : undefined;
      if (toKey !== fromKey || toProject !== fromProject) {
        this.initFromRoute();
      }
    }
  },
  created() {
    this.initFromRoute();
  },
  methods: {
    // 从当前路由初始化配置页（切换项目/项目ID 时可重复调用以刷新）
    initFromRoute() {
      this.reset();
      // 重置选中项目与查询，避免沿用上一个项目的状态
      this.project = undefined;
      this.configList = [];
      this.total = 0;
      const configKey = this.$route.query.configKey;
      if(configKey){
        this.queryParams.configKey = configKey;
      }
      this.queryId = this.$route.query.projectId;
      if(!this.queryId && this.queryParams.configKey){
        this.getList();
      }
    },
    getConfigIcon(configKey) {
      const iconMap = {
        wechat: 'el-icon-chat-dot-round',
        sms: 'el-icon-message',
        map: 'el-icon-location',
        wechat_mini: 'el-icon-mobile-phone',
        site_info: 'el-icon-s-home',
        menu: 'el-icon-menu',
        layout_setting: 'el-icon-brush',
        mysql: 'el-icon-coin',
        redis: 'el-icon-cpu',
        tdengine: 'el-icon-s-data',
        ai: 'el-icon-magic-stick'
      };
      return iconMap[configKey] || 'el-icon-setting';
    },
    getCfgType(configKey) {
      const cfgs = this.dict.type.iot_sys_config
      const arr = cfgs.filter(item => { return item.value === configKey })
      return arr.length > 0 ? arr[0].label : '自定义参数'
    },
    selectProjectDone(project) {
      if(project){
        this.project = project;
      }else{
        this.project = undefined;
      }
      this.handleQuery();
    },
    /** 查询参数列表 */
    getList() {
      this.loading = true;
      const queryParams = {
        pageNum: this.queryParams.pageNum,
        pageSize: this.queryParams.pageSize,
        configKey: this.queryParams.configKey
      }
      if (this.project) {
        queryParams.project = this.project.name;
      }
      listConfig(this.addDateRange(queryParams, this.dateRange)).then(response => {
        this.configList = response.rows;
        this.total = response.total;
        this.loading = false;
      });
    },
    handleStatusChange(row){
      const data = {
        configId : row.configId,
        configType : row.configType
      };
      updateConfig(data).then(response => {
        this.$modal.msgSuccess("修改成功");
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
        configId: undefined,
        configName: undefined,
        configKey: undefined,
        configValue: '',
        configType: "N",
        remark: ''
      };
      this.resetForm("form");
    },
    handleMenuSelect(index) {
      this.queryParams.configKey = index;
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      if(this.queryParams.configKey){
        this.form.configKey = this.queryParams.configKey
      }
      this.isCreate = true;
      this.open = true;
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.configId)
      this.single = selection.length!==1
      this.multiple = !selection.length
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      this.isCreate = false;
      const configId = row.configId
      getConfig(configId).then(response => {
        this.form = response.data;
        this.open = true;
      });
    },
    handleEdit(){
      this.openEdit = false;
      console.log(this.form)
      this.submitForm();
    },
    /** 提交按钮 */
    submitForm: function() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (!this.isCreate) {
            updateConfig(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            const form = this.form;
            form.project = this.project.name;
            addConfig(this.form).then(response => {
              this.$modal.msgSuccess("新增成功");
              this.open = false;
              this.getList();
            });
          }
        }
      });
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const configIds = row.configId || this.ids;
      this.$modal.confirm('是否确认删除参数编号为"' + configIds + '"的数据项？').then(function() {
          return delConfig(configIds);
        }).then(() => {
          this.getList();
          this.$modal.msgSuccess("删除成功");
        }).catch(() => {});
    },
    /** 刷新缓存按钮操作 */
    handleRefreshCache(row) {
      const configIds = row.configId || this.ids;
      refreshCache(configIds).then(() => {
        this.$modal.msgSuccess("刷新成功");
      });
    }
  }
};
</script>
<style lang="scss" scoped>
.config-layout {
  display: flex;
  gap: 12px;

  .config-menu {
    width: 180px;
    flex-shrink: 0;
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 4px;
    overflow: hidden;

    .el-menu {
      border-right: none;
    }

    .el-menu-item {
      height: 40px;
      line-height: 40px;
      font-size: 13px;
    }
  }

  .config-table {
    flex: 1;
    min-width: 0;
  }
}
</style>

