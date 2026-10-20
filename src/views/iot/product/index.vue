<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" class="search-form">
      <el-form-item label="产品名称" prop="name">
        <el-input
            v-model="queryParams.name"
            placeholder="请输入产品名称"
            clearable
            @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="禁用状态" prop="status">
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
            @click="open = true"
            v-hasPermi="['system:product:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
            type="danger"

            icon="el-icon-delete"
            size="mini"
            :disabled="multiple"
            @click="handleDelete"
            v-hasPermi="['system:product:remove']"
        >删除</el-button>
      </el-col>
      <right-toolbar
        :table="table"
        :showSearch.sync="showSearch"
        @queryTable="getList"
        :showDownload="true"
        @download="handleExport"/>
    </el-row>

    <el-table v-loading="loading" :data="tableList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="ID" width="50" align="left" prop="id" />
      <el-table-column label="产品名称" align="center" prop="name" min-width="140" show-overflow-tooltip />
      <el-table-column label="注册类型" align="center" prop="autoRegister" width="100">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.iot_auto_register" :value="scope.row.autoRegister"/>
        </template>
      </el-table-column>
      <el-table-column label="通讯方式" align="center" prop="netType" width="150">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.iot_net_type" :value="scope.row.netType"/>
        </template>
      </el-table-column>
      <el-table-column label="设备类型" align="center" prop="nodeType" width="100">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.iot_node_type" :value="scope.row.nodeType"/>
        </template>
      </el-table-column>
      <el-table-column label="禁用状态" align="center" prop="status" width="100">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.sys_normal_disable" :value="scope.row.status"/>
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
              icon="el-icon-info"
              @click="handleUpdate(scope.row)"
              v-hasPermi="['system:product:edit']"
          >详情</el-button>
          <el-button
              size="mini"
              type="text"
              style="color:red;"
              icon="el-icon-delete"
              @click="handleDelete(scope.row)"
              v-hasPermi="['system:product:remove']"
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
    <el-drawer
      title="创建产品"
      :visible.sync="open"
      direction="rtl" size="45%">
      <ProductForm @onCreate="onCreate" @onCancel="open = false" style="padding: 10px;"/>
    </el-drawer>
  </div>
</template>

<script>
import { queryObject, delObject, createObject, updateObject } from "@/api/iot/table";
import InputTableSelect from "@/components/InputTableSelect";
import DeviceForm from "@/views/iot/device/components/deviceForm.vue";
import ProductForm from "@/views/iot/product/components/productForm.vue";

export default {
  name: "Product",
  dicts: ['sys_normal_disable','iot_node_type', 'iot_net_type', 'iot_auto_register', 'iot_product_type'],
  components: {
    DeviceForm,
    InputTableSelect,
    ProductForm
  },
  data() {
    return {
      table: 'product',
      desc: '产品',
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
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        status: "0"
      },
      // 表单参数
      form: {}
    };
  },
  created() {
    this.getList();
  },
  methods: {
    onCreate(form){
      this.open = false;
      this.reset();
      this.queryParams['name'] = form.name;
      this.getList();
    },
    /** 查询列表 */
    getList() {
      this.loading = true;
      const queryParams = {
        pageNum: this.queryParams.pageNum,
        pageSize: this.queryParams.pageSize,
        status: this.queryParams.status
      }
      queryParams['name[like]'] = this.queryParams.name;
      queryObject(this.table, queryParams).then(response => {
        const rows = response.rows;
        const total = response.total;
        this.tableList = rows;
        this.total = total;
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
        status: "0"
      };
      this.resetForm("form");
    },
    /** 搜索按钮操作 */
    handleQuery() {
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
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const project = this.$route.params.project
      if(project){
        this.$router.push({
          path: '/' + project + '/device/productEdit',
          query: {id: row.id}
        })
      }else{
        this.$router.push({
          path: '/device/productEdit',
          query: {id: row.id}
        })
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
