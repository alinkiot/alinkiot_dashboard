<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" class="search-form">
      <el-form-item v-for="item in column" v-if="item.isSearch" :label="item.label" :key="item.key" :prop="item.key">
        <el-input v-model="item.value" :placeholder="item.label" clearable/>
      </el-form-item>
      <InputTableSelect  :queryId="queryParams.product"  showColumn="name" label="所属产品" table="product" @selectDone="selectSearchDone"/>
      <el-form-item label="类型" prop="type">
        <el-select v-model="queryParams.type" placeholder="类型" clearable>
          <el-option
              v-for="dict in dict.type.iot_rule_type"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="等级" prop="level">
        <el-select v-model="queryParams.level" placeholder="等级" clearable>
          <el-option
              v-for="dict in dict.type.iot_level"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="静默状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="静默状态" clearable>
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
            v-hasPermi="['system:rule:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
            type="danger"

            icon="el-icon-delete"
            size="mini"
            :disabled="multiple"
            @click="handleDelete"
            v-hasPermi="['system:rule:remove']"
        >删除</el-button>
      </el-col>
      <right-toolbar :table="table" :showSearch.sync="showSearch" @queryTable="getList" @download="handleExport"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="tableList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column align="center" v-for="item in column" :label="item.label" :key="item.id" :prop="item.key" :width="item.width" :min-width="item.minWidth" show-overflow-tooltip />
      <el-table-column label="类型" align="center" prop="type">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.iot_rule_type" :value="scope.row.type"/>
        </template>
      </el-table-column>
      <el-table-column label="等级" align="center" prop="level">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.iot_level" :value="scope.row.level"/>
        </template>
      </el-table-column>
      <el-table-column label="静默状态" align="center" width="100">
        <template slot-scope="scope">
          <el-switch
              v-model="scope.row.status"
              active-value="0"
              inactive-value="1"
              @change="handleStatusChange(scope.row)"
          ></el-switch>
        </template>
      </el-table-column>
      <el-table-column label="所属项目" align="center" prop="project" :formatter="formatRow" min-width="120" show-overflow-tooltip />
      <el-table-column label="所属产品" align="center" prop="product" :formatter="formatRow" min-width="120" show-overflow-tooltip />
      <el-table-column label="创建时间" align="center" prop="createTime" width="180">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
              type="text"
              icon="el-icon-edit-outline"
              size="mini"
              @click="handleUpdate(scope.row)"
          >详情</el-button>
          <el-button
              size="mini"
              type="text"
              icon="el-icon-plus"
              @click="handleEditRule(scope.row)"
              v-hasPermi="['system:rule:edit']"
          >规则</el-button>
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

    <!-- 添加或修改规则对话框 -->

    <el-drawer
      :title="title"
      :visible.sync="openRule"
      direction="rtl"
      size="30%"
    >
      <el-form ref="createForm" :model="form" :rules="rules" label-width="100px" style="padding: 20px;">
        <el-form-item label="告警名称：" prop="name">
          <el-input v-model="form.name" placeholder="请输入告警名称" />
        </el-form-item>
        <InputTableSelect  :queryId="form.project" showColumn="title" label="所属项目" table="project" prop="project" @selectDone="selectProjectDone"/>
        <InputTableSelect  :queryId="form.product" showColumn="name" label="所属产品" table="product" prop="product" @selectDone="selectProductDone"/>
        <el-form-item label="告警类型：" prop="category">
          <el-select v-model="form.type" placeholder="请选择告警分类">
            <el-option
                v-for="dict in dict.type.iot_rule_type"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="告警级别：" prop="level">
          <el-select v-model="form.level" placeholder="请选择告警级别">
            <el-option
                v-for="dict in dict.type.iot_level"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
            />
          </el-select>
          <el-button style="margin-left:5px;" size="mini" type="primary" icon="el-icon-plus" circle @click="addDict('iot_level')"></el-button>
        </el-form-item>
        <el-form-item label="静默状态：" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio
                v-for="dict in dict.type.sys_normal_disable"
                :key="dict.value"
                :label="dict.value"
            >{{dict.label}}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="通知类型：" prop="notifyType">
          <el-checkbox-group v-model="form.notifyType">
            <el-checkbox
                v-for="dict in dict.type.iot_notify_type"
                :key="dict.value"
                :label="dict.value"
            >{{ dict.label }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <InputTableSelect :queryId="form.groupId" showColumn="name" label="群组通知" table="group" @selectDone="selectGroupDone" v-if="checkShowGroup" />
        <el-form-item label="消息模板：" prop="content">
          <el-input rows="4" v-model="form.content" type="textarea" placeholder="请输入消息模板" />
        </el-form-item>
        <el-form-item>
            <el-button size="mini" type="primary" @click="submitForm">保 存</el-button>
            <el-button size="mini" @click="cancel">取 消</el-button>
        </el-form-item>
      </el-form>
    </el-drawer>

    <el-dialog title="编辑规则" :visible.sync="openEditRule" >
      <RuleBoard :formDatas="formDatas" :rulesData="rulesData" @rulesChange="rulesChange" />
      <div slot="footer" class="dialog-footer">
        <el-button size="mini" type="primary" @click="submitRuleForm">确 定</el-button>
        <el-button size="mini" @click="cancel">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import RuleBoard from "./components/ruleBoard";
import InputTableSelect from "@/components/InputTableSelect";
import { queryObject, getObject, delObject, createObject, updateObject } from "@/api/iot/table";
import {validateCheck} from "@/assets/js/iot";

export default {
  name: "Rule",
  components: {
    InputTableSelect,
    RuleBoard
  },
  dicts: ['sys_normal_disable', 'iot_level', 'iot_rule_type', 'iot_notify_type'],
  data() {
    return {
      table: 'rule',
      desc: '告警规则',
      // 遮罩层
      loading: true,
      products: [],
      projects: [],
      groups: [],
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
      openRule: false,
      openEditRule: false,
      column: [],
      product: undefined,
      project: undefined,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10
      },

      currentRow: undefined,
      formDatas: [
      ],
      rulesData: {
        relation: "and",
        conditions: [],
        children: []
      },
      // 表单参数
      form: { },
      // 表单校验
      rules: {
        name: [
          { required: true, message: "告警名称不能为空", trigger: "blur" }
        ],
        product: [
          {self: this,  validator: validateCheck, required: true, message: "所属产品不能为空", trigger: "blur"}
        ],
        project: [
          {self: this,  validator: validateCheck, required: true, message: "所属项目不能为空", trigger: "blur"}
        ]
      }
    };
  },
  computed:{
    checkShowGroup() {
      const types = this.form.notifyType
      return types && (types.includes('wechat') || types.includes('sms'))
    }
  },
  created() {
    this.column = [
      // {label:'ID', key:'id', width:40},
      {label:'告警名称', key:'name', isSearch: true}
    ],
    this.getList();
  },
  methods: {
    rulesChange(datas){
      this.rulesData = datas;
    },
    addDict(dictType) {
      this.openRule = false;
      this.$router.push({
        path: '/system/dict-data/index/' + dictType
      });
    },

    getProduct(ids, callback) {
      if (ids.length > 0) {
        getObject('product', ids.join(',')).then(response => {
          const products = response.data;
          if (Array.isArray(products)) {
            this.products = products;
          } else {
            this.products.push(products)
          }
          callback(this.products)
        });
      } else {
        this.products = [];
        callback(this.products)
      }
    },

    getProject(ids, callback) {
      if (ids.length > 0) {
        getObject('project', ids.join(',')).then(response => {
          const projects = response.data;
          if (Array.isArray(projects)) {
            this.projects = projects;
          } else {
            this.projects.push(projects)
          }
          callback(this.projects)
        }).catch(err => {
          callback([]);
        })
      } else {
        this.projects = [];
        callback(this.projects)
      }
    },

    /** 查询列表 */
    getList() {
      this.loading = true;
      queryObject(this.table, this.queryParams).then(response => {
        const that = this;
        const rows = response.rows;
        const total = response.total;
        const productIds = [];
        const projectIds = [];
        rows.map(row => {
          if(row.product && !productIds.includes(row.product)){
            productIds.push(row.product);
          }
          if(row.project && !projectIds.includes(row.project)){
            projectIds.push(row.project);
          }
        });
        that.getProduct(productIds, function(){
          that.getProject(projectIds, function(){
            that.tableList = rows;
            that.total = total;
            that.loading = false;
          })
        });
      });
    },
    // 取消按钮
    cancel() {
      this.openEditRule = false;
      this.openRule = false;
      this.reset();
    },
    // 表单重置
    reset() {
      this.product = undefined;
      this.form = { notifyType : [] };
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
      this.openRule = true;
      this.title = "添加" + this.desc;
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const id = row.id || this.ids
      getObject(this.table, id).then(response => {
        this.form = response.data;
        this.form['notifyType'] = JSON.parse(this.form.notifyType);
        this.openRule = true;
        this.title = "修改" + this.desc;
      });
    },
    /** 修改按钮操作 */
    handleEditRule(row) {
      this.currentRow = row;
      const products = this.products.filter(item => {
        return item.id == row.product
      });
      const product = products && products[0] ? products[0] : undefined;
      if(product) {
          const thing = JSON.parse(product.thing);
          thing.push({
            title: '设备地址',
            name: 'addr',
            type: 'string'
          });
          thing.push({
            title: '设备状态',
            name: 'status',
            type: 'string'
          });
          this.formDatas = thing;
      }
      const rule = this.currentRow.rule;
      if(rule && rule !== ''){
        this.rulesData = JSON.parse(rule);
      }else{
        this.rulesData = {
          relation: "and",
          conditions: [],
          children: []
        };
      }
      this.openEditRule = true;
    },

    /** 提交按钮 */
    submitForm: function() {
      this.$refs["createForm"].validate(valid => {
        if (valid) {
          const notifyType = this.form.notifyType;
          this.form.notifyType = JSON.stringify(notifyType);
          if (this.form.id != undefined) {
            updateObject(this.table, this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.openRule = false;
              this.getList();
            });
          } else {
            createObject(this.table, this.form).then(response => {
              this.$modal.msgSuccess("新增成功");
              this.openRule = false;
              this.getList();
            });
          }
        }
      });
    },
    submitRuleForm: function(){
      const data = {
        id: this.currentRow.id,
        rule: JSON.stringify(this.rulesData)
      };
      updateObject(this.table, data).then(response =>{
        this.getList();
        this.$modal.msgSuccess("规则更新成功");
        this.openEditRule = false;
      })
    },
    handleStatusChange(row) {
      return updateObject(this.table, {id : row.id, status : row.status});
      // 为啥下面不生效？
      // let text = row.status === "0" ? "启用" : "停用";
      // this.$modal.confirm('确认要"' + text + '""' + row.name + '"规则吗？').then(function() {
      //   console.log({id : row.id, status : row.status});
      //   return updateObject(this.table, {id : row.id, status : row.status});
      // }).then(() => {
      //   this.$modal.msgSuccess(text + "成功");
      // }).catch(function() {
      //   row.status = row.status === "0" ? "1" : "0";
      // });
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
    },
    formatRow: function(row, column){
      switch (column.property){
        case 'product':
          const product = this.products.filter(item => {
            return item.id == row.product
          });
          return product && product[0] ? product[0].name : '-';
          break;
        case 'project':
          const project = this.projects.filter(item => {
            return item.id == row.project
          });
          return project && project[0] ? project[0].title : '-';
          break;
        case 'groupId':
          const group = this.groups.filter(item => {
            return item.id == row.groupId
          });
          return group && group[0] ? group[0].name : '';
          break;
      }
    },
    selectProductDone: function(product){
      this.product = product;
      this.form.product = product ? product.id : undefined
    },
    selectProjectDone: function(project){
      this.project = project;
      this.form.project = project ? project.id : undefined
    },
    selectSearchDone: function(product){
      this.queryParams.product = product ? product.id : undefined;
    },
    selectGroupDone: function (group) {
      this.form.groupId = group ? group.id : undefined
    }
  }
};
</script>

<style lang="scss" scoped>

</style>
