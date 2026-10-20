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
            v-hasPermi="['system:agent:add']"
        >创建智能体</el-button>
      </el-col>
    </el-row>
    <div v-if="tableList.length > 0" v-loading="loading">
      <el-row :gutter="10">
        <el-col :xs="24" :sm="12" :md="8" :lg="8" :xl="6" v-for="agent in tableList" :key="agent.name" style="margin-bottom: 10px;">
          <el-card class="box-card" shadow="hover">
            <el-container>
              <el-aside style="width:80px; background-color:unset; padding:0px;" v-if="agent.logo">
                <ImagePreview :src="agent.logo" style="margin:5px;"/>
              </el-aside>
              <el-main style="padding: 0px 0px 0px 5px;">
                <div class="card-title">
                  {{agent.title}}
                  <div style="float:right;">
                    <el-tag size="small" type="success" v-if="agent.status == 0">已发布</el-tag>
                    <el-tag size="small" type="danger" v-else>未发布</el-tag>
                  </div>
                </div>
                <div class="card-row" v-for="item in column" :key="item.key" v-if="item.key!=='title'">
                  <span class="card-row-header">{{item.label}}: </span>{{ getValue(agent, item) }}
                </div>
                <div class="card-row">
                  <span style="font-weight: bolder;">介绍: </span>{{ agent.remark }}
                </div>
                <div class="card-row" style="color:#838383;">
                  <span>创建时间: </span>{{ parseTime(agent.createTime) }}
                </div>
              </el-main>
            </el-container>
            <div class="card-row" style="float: right;">
              <el-button
                type="text"
                icon="el-icon-edit-outline"
                v-hasPermi="['system:agent:query']"
                @click="handleUpdate(agent)"
              >编辑</el-button>
              <el-button
                type="text"
                icon="el-icon-s-promotion"
                v-hasPermi="['system:agent:query']"
                @click="goChat(agent)"
              >对话</el-button>
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
    <el-empty v-else description="无智能体"/>

    <el-drawer :title="title" :visible.sync="open" direction="rtl" size="50%">
      <el-form ref="createForm" :model="form" :rules="rules" label-width="100px" style="padding: 10px;">
        <el-form-item label="名称" prop="title">
          <el-input v-model="form.title" placeholder="给你的智能体起个名字" />
        </el-form-item>
        <el-form-item label="头像" prop="logo">
          <ImageUpload :limit=1 @input="handleFile" :value="form.logo"/>
        </el-form-item>

        <el-form-item label="介绍" prop="remark">
          <el-input rows="5" v-model="form.remark" type="textarea" placeholder="请简单描述你希望应用扮演什么角色，或者完成什么功能" />
        </el-form-item>

        <el-form-item label="提示词" prop="prompt">
          <el-input rows="10" v-model="form.prompt" type="textarea" :placeholder="placeholder" />
        </el-form-item>

        <InputTableSelect
          label="模型参数"
          showColumn="configName"
          :queryId="form.ai"
          :queryParams="queryAi"
          table="config"
          @selectDone="selectAiDone"
          prop="ai"
        />
        <el-form-item label="发布状态" prop="status">
          <el-switch
            v-model="form.status"
            active-value="0"
            inactive-value="1"
          ></el-switch>
        </el-form-item>
        <el-form-item>
          <el-button
            icon="el-icon-check"
            size="mini"
            type="primary"
            @click="submitForm"
          >确 定</el-button>
          <el-button
            v-if="this.form.id"
            type="danger"
            icon="el-icon-delete"
            size="mini"
            @click="handleDelete"
            v-hasPermi="['system:agent:remove']"
          >删除</el-button>
        </el-form-item>
      </el-form>
    </el-drawer>
  </div>
</template>

<script>
import { queryObject, getObject, delObject, createObject, updateObject } from "@/api/iot/table";
import { checkPermi } from "@/utils/permission";
import {toProject, getProject} from "@/api/iot/system";
import InputTableSelect from '@/components/InputTableSelect/index.vue'
export default {
  name: "Agent",
  components: { InputTableSelect },
  dicts: ['sys_normal_disable', 'iot_category'],
  data() {
    return {
      table: 'agent',
      desc: '智能体',
      // 遮罩层
      loading: true,
      // 选中数组
      ids: [],
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
      queryAi: {
        configKey : 'ai',
        // project: this.project.name
      },
      //当前项目
      currAgent: undefined,
      // 表单参数
      form: {  },
      // 表单校验
      rules: {
        title: [
          { required: true, message: "名称不能为空", trigger: "blur" }
        ]
      },
      placeholder:'用于对AI的回复做出一系列的指令及限制，可参考以下撰写方式：\n' +
        '# 角色\n' +
        '你是一个专业的周边游推荐官，能够为用户提供丰富多样的短途旅游和周边游方案，并且用生动的语言介绍各个景点的特色。\n' +
        '\n' +
        '## 技能\n' +
        '### 技能 1: 推荐短途旅游地\n' +
        '1. 当用户请求推荐短途旅游地时，询问用户的位置和偏好的旅游类型（如自然风光、历史文化等）。如果你已经知道了，请跳过这一步。\n' +
        '2. 根据用户的位置和偏好，推荐几个合适的短途旅游地。回复示例：\n' +
        '=====\n' +
        '    -   旅游地名称: <旅游地名称>\n' +
        '    -  🎯 特色: <简要介绍旅游地的特色，不超过 100 字>\n' +
        '    -  🚗 距离: <说明距离用户所在地的大致车程>\n' +
        '=====\n' +
        '\n' +
        '### 技能 2: 介绍周边游景点\n' +
        '1. 当用户询问某个具体的周边游景点时，使用工具搜索该景点的详细信息。\n' +
        '2. 根据搜索结果，生成景点介绍。\n' +
        '\n' +
        '## 限制:\n' +
        '- 只讨论短途旅游和周边游相关内容，拒绝回答与此无关的话题。\n' +
        '- 所输出的内容必须按照给定的格式进行组织，不能偏离框架要求。\n' +
        '- 特色介绍部分不能超过 100 字。'
    };
  },
  created() {
    const agent = this.$route.params.agent;
    this.currAgent = getProject(agent);
    this.column = [
      {label:'智能体', key:'title', isSearch: true, regx: true}
    ];
    this.getList();
  },
  methods: {
    checkPermi,
    getValue(agent, item) {
      return agent[item.key];
    },
    selectAiDone(config) {
      this.form.ai = config.configId;
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
    // 表单重置
    reset() {
      this.form = {
        prompt: undefined,
        title: undefined,
        logo: undefined,
        ai: undefined,
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
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "创建" + this.desc;
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

    goChat(row) {
      const project = this.$route.params.project;
      if(project){
        this.$router.push({
          path: '/'  + project + '/ai/aiChat',
          query: {id: row.id}
        });
      }else{
        this.$router.push({
          path: '/ai/aiChat',
          query: {id: row.id}
        });
      }
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
    /** 删除按钮操作 */
    handleDelete() {
      const ids = this.form.id;
      const table = this.table;
      this.$modal.confirm('是否确认删除？').then(function() {
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

::v-deep .el-card__header{
  padding: 4px;
  .clearfix {
    padding: 5px;
  }
}

::v-deep .el-card__body{
  padding: 15px;
}

.el-row {
  margin-bottom: 20px;
  display: flex;
  flex-wrap: wrap;
}

.el-row .el-card {
  min-width: 100%;
  height: 100%;
  margin-right: 20px;
  transition: all .5s;
}

.card-row {
  font-size: 14px;
  margin: 5px 0;
  font-weight: 400;
}

.card-title{
  font-weight: bolder;
  font-size: 17px;
}

.card-row-header{
  font-weight: bolder;
  margin-right: 5px;
}

.status-label{
  display: block;
  position: absolute;
  right: -15px;
  top: -6px;
  width: 40px;
  height: 24px;
  text-align: center;
  -webkit-transform: rotate(45deg);
  transform: rotate(45deg);
  -webkit-box-shadow: 0 0 1pc 1px rgba(0, 0, 0, 0.2);
  box-shadow: 0 0 1pc 1px rgba(0, 0, 0, 0.2);

  .status-check {
    color: white;
    font-size:13px;
    margin-top: 10px;
    transform: rotate(-45deg);
    -webkit-transform: rotate(-45deg);
  }
}


</style>
