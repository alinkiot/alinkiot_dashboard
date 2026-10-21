<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" class="search-form">
      <InputTableSelect :read="isRead('project')"
                        :queryId="project.id" showColumn="title" label="所属项目" table="project"
                        @selectDone="selectProjectDone"/>
      <InputTableSelect showColumn="name" label="所属产品" :read="isRead('product')"
                        :queryId="product.id"  table="product"
                        @selectDone="selectProductDone"/>
      <el-form-item label="设备类型" prop="nodeType">
        <el-select v-model="nodeType" multiple  placeholder="设备类型" disabled v-if="isRead('nodeType')">
          <el-option
            v-for="dict in dict.type.iot_node_type"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
        <el-select v-model="nodeType" multiple  placeholder="设备类型" clearable v-else>
          <el-option
              v-for="dict in dict.type.iot_node_type"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-input placeholder="请输入" v-model="queryParams.device" clearable class="device-search-input">
          <el-select v-model="select" slot="prepend" class="device-search-prepend">
            <el-option label="设备地址" value="addr"></el-option>
            <el-option label="设备名称" value="name"></el-option>
          </el-select>
        </el-input>
      </el-form-item>
      <el-form-item label="禁用状态" prop="status">
        <el-select v-model="queryParams.status" disabled placeholder="是否禁用" v-if="isRead('status')">
          <el-option
            v-for="dict in dict.type.sys_normal_disable"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
        <el-select v-model="queryParams.status" placeholder="是否禁用" clearable v-else>
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
            v-hasPermi="['system:device:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
            type="danger"
            icon="el-icon-delete"
            size="mini"
            :disabled="selectionMode && multiple"
            @click="handleDeleteClick"
            v-hasPermi="['system:device:remove']"
        >{{ selectionMode ? '删除' + (ids.length > 0 ? '(' + ids.length + ')' : '') : '删除' }}</el-button>
      </el-col>
      <el-col :span="1.5" v-if="selectionMode">
        <el-button
            size="mini"
            @click="cancelSelection"
        >取消</el-button>
      </el-col>
      <right-toolbar
        :component="componentPath"
        :menuQuery="menuQuery"
        :table="table"
        :showSearch.sync="showSearch"
        :showType.sync="showType"
        @queryTable="getList"
        :showImport="true"
        :showDownload="true"
        @download="handleExport"/>
    </el-row>
    <DeviceTable
      :queryParams="deviceQuery"
      :buttons="buttons"
      :showType="showType"
      :selectionMode="selectionMode"
      @handleEvent="handleEvent"
      @handleSelectionChange="handleSelectionChange"
    />
    <el-drawer
      title="创建设备"
      :visible.sync="open"
      direction="rtl" size="40%">
      <DeviceForm @onCreate="onCreate" style="padding: 10px;"/>
    </el-drawer>
  </div>
</template>

<script>
import {  delObject, createObject, updateObject } from "@/api/iot/table";
import InputTableSelect from "@/components/InputTableSelect";
import { kickDevice } from "@/api/iot/system";
import DeviceForm from "./components/deviceForm.vue";
import DeviceTable from "./components/deviceTable.vue"

export default {
  name: "Device",
  dicts: ['sys_normal_disable', 'iot_node_type'],
  components: {
    InputTableSelect,
    DeviceTable,
    DeviceForm
  },
  data() {
    return {
      table: 'device',
      desc: '设备',
      // 选中数组
      ids: [],
      nodeType: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      project: {},
      product:{},
      tableList: [],
      // 显示搜索条件
      showSearch: true,
      showType: 'card',
      selectionMode: false,
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      select: 'name',
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        status:""
      },
      // 表单参数
      form: {},
      deviceQuery: {},
      menuQuery: {},
      componentPath:'iot/device/index',
      buttons: [
        {
          text: '下线',
          event: 'kick',
          icon: 'el-icon-warning-outline',
          permission: "['system:device:kick']"
        },
        {
          text: '详情',
          event: 'goEdit',
          icon: 'el-icon-info',
          permission: "['system:device:edit']"
        }
      ],

      fixParams: [] // 初始参数

    };
  },
  created() {
    const projectId = this.$route.query.project;
    const productId = this.$route.query.product;
    const status = this.$route.query.status;
    const nodeType = this.$route.query.nodeType;
    if(projectId){
      this.project.id = projectId;
      this.fixParams.push({key:'project', 'value': projectId});
    }
    if(productId){
      this.product.id = productId;
      this.fixParams.push({key:'product', 'value': productId});
    }
    if(status){
      this.queryParams.status = status;
      this.fixParams.push({key:'status', 'value': status});
    }
    if(nodeType){
      this.nodeType = nodeType.split(',');
      this.fixParams.push({key:'nodeType', 'value': this.nodeType});
    }
    this.getList();
  },
  methods: {
    reset() {
      this.nodeType = [];
      this.queryParams = {
        pageNum: 1,
        pageSize: 10,
        status:"",
        device: undefined
      }
    },
    onCreate(form){
      this.open = false;
      this.reset();
      this.select = 'addr';
      this.queryParams.device = form.addr;
      this.getList();
    },
    isRead(key) {
      const arr = this.fixParams.filter(item => { return item.key === key });
      return arr.length > 0;
    },
    /** 查询列表 */
    getList() {
      const query = JSON.parse(JSON.stringify(this.queryParams));
      delete query['device'];
      if(this.select === 'addr'){
        query['addr[like]'] = this.queryParams.device;
      }else{
        query['name[like]'] = this.queryParams.device;
      }
      if(this.nodeType.length > 0){
        query['nodeType'] = this.nodeType.join(',');
      }
      query['project'] = this.project.id;
      query['product'] = this.product.id;
      this.deviceQuery = query;
      this.menuQuery = query;
      this.componentPath = 'iot/device/index';
    },
    selectProductDone(product) {
      if(product){
        this.product = product;
      }else{
        this.product = {}
      }
    },
    selectProjectDone(project) {
      if(project){
        this.project = project;
      }else{
        this.project = {};
      }
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm");
      this.queryParams = {
        pageNum: 1,
        pageSize: 10,
        status:""
      };
      this.dateRange = [];
      this.handleQuery();
    },
    // 多选框选中数据
    handleSelectionChange(obj) {
      const selection = obj.selection;
      this.ids = selection.map(item => item.id);
      this.single = selection.length!==1;
      this.multiple = !selection.length;
      this.tableList = obj.tableList;
      this.menuQuery = { id : this.ids.join(',')};
      this.componentPath = 'iot/device/edit';
    },
    handleKick() {
      const device = this.tableList.filter(item => { return item.id === this.ids[0] });
      kickDevice({addr : device[0].addr}).then(response => {
        this.$modal.msgSuccess("操作成功");
      }).catch(err =>{
        console.log(err);
      })
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.open = true;
    },
    handleEvent(event, row) {
      if(event === 'goEdit'){
        // 跳转设备编辑页
        const project = this.$route.params.project;
        if(project){
          this.$router.push({
            path: '/'  + project + '/device/deviceEdit',
            query: {id: row.id}
          });
        }else{
          this.$router.push({
            path: '/device/deviceEdit',
            query: {id: row.id}
          });
        }
      } else if(event === 'kick'){
        kickDevice({addr : row.addr}).then(response => {
          this.$modal.msgSuccess("操作成功");
        }).catch(err =>{
          console.log(err);
        })
      }
    },
    handleDeleteClick() {
      if (!this.selectionMode) {
        this.selectionMode = true;
        this.ids = [];
      } else if (this.ids.length > 0) {
        this.handleDelete({});
      }
    },
    cancelSelection() {
      this.selectionMode = false;
      this.ids = [];
      this.multiple = true;
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const ids = row.id || this.ids;
      const table = this.table;
      this.$modal.confirm('是否确认删除'+this.desc+'ID为"' + ids + '"的数据项？').then(function() {
        return delObject(table, ids);
      }).then(() => {
        this.selectionMode = false;
        this.ids = [];
        this.multiple = true;
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
// 「设备地址/设备名称」前置下拉：原生下拉箭头被项目样式隐藏了，
// 这里用伪元素强制画一个向下箭头，明确提示「可下拉」。
.device-search-input {
  ::v-deep .el-input-group__prepend {
    .el-select {
      width: 96px;
      position: relative;

      // 文字右侧留出箭头空间
      .el-input__inner {
        padding-left: 10px;
        padding-right: 22px;
      }

      // 用伪元素画下拉箭头（▾），紧跟文字右侧
      &::after {
        content: '';
        position: absolute;
        top: 50%;
        right: 9px;
        width: 7px;
        height: 7px;
        border-right: 1.5px solid #606266;
        border-bottom: 1.5px solid #606266;
        transform: translateY(-65%) rotate(45deg);
        pointer-events: none;
        z-index: 1;
      }
    }
  }
}
</style>
