<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" class="search-form">
      <el-form-item label="场景名称" prop="title">
        <el-input v-model="queryParams.title" placeholder="请输入场景名称" clearable/>
      </el-form-item>
      <InputTableSelect :queryId="project.id" showColumn="title" label="所属项目" table="project" @selectDone="selectProjectDone"/>
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
            @click="openDialog"
            v-hasPermi="['system:scene:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
            type="danger"

            icon="el-icon-delete"
            size="mini"
            :disabled="multiple"
            @click="handleDelete"
            v-hasPermi="['system:scene:remove']"
        >删除</el-button>
      </el-col>
      <right-toolbar
        component="iot/scene/edit"
        :menuQuery='sceneQuery'
        :table="table"
        :showSearch.sync="showSearch"
        @queryTable="getList"
        @download="handleExport"/>
    </el-row>

    <el-table v-loading="loading" :data="tableList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column align="center" label="场景ID" prop="id" width="60"></el-table-column>
      <el-table-column align="center" label="场景名称" min-width="140" show-overflow-tooltip>
        <template slot-scope="scope">
            <svg-icon v-if="scope.row.icon" style="margin-right: 5px;" :icon-class="scope.row.icon"/>
            <el-link type="primary" @click="goEditScene(scope.row)">
              {{scope.row.title}}
            </el-link>
        </template>
      </el-table-column>
      <el-table-column align="center" label="所属项目" prop="project" :formatter="formatRow" min-width="120" show-overflow-tooltip></el-table-column>
      <el-table-column align="center" label="描述" prop="remark" min-width="180" show-overflow-tooltip></el-table-column>
      <el-table-column label="禁用状态" align="center" prop="status">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.sys_normal_disable" :value="scope.row.status"/>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" prop="createTime" width="180">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-info"
            @click="goEditScene(scope.row)"
          >查看</el-button>
          <el-button
              size="mini"
              type="text"
              icon="el-icon-edit-outline"
              @click="handleEdit(scope.row)"
              v-hasPermi="['system:scene:edit']"
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
    <el-dialog title="创建/编辑场景" :visible.sync="open">
      <el-form ref="createForm" :model="scene" :rules="rules" label-width="100px" label-position="right">
        <el-form-item label="场景名称：" prop="title">
          <el-input v-model="scene.title" placeholder="请输入场景名称" />
        </el-form-item>
        <el-form-item label="场景图标" prop="icon">
          <el-popover
            placement="bottom-start"
            width="460"
            trigger="click"
            @show="$refs['iconSelect'].reset()"
          >
            <IconSelect ref="iconSelect" @selected="selected" />
            <el-input slot="reference" v-model="scene.icon" placeholder="点击选择图标" readonly>
              <svg-icon
                v-if="scene.icon"
                slot="prefix"
                :icon-class="scene.icon"
                class="el-input__icon"
                style="height: 32px;width: 16px;"
              />
              <i v-else slot="prefix" class="el-icon-search el-input__icon" />
            </el-input>
          </el-popover>
        </el-form-item>
        <InputTableSelect  :queryId="scene.project" showColumn="title" label="所属项目" table="project" @selectDone="editProjectDone" prop="project"/>
        <el-form-item label="类型" prop="category">
          <el-select v-model="scene.category" placeholder="场景类型">
            <el-option
              v-for="dict in dict.type.iot_scene_category"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="视图列表：" prop="viewType">
          <el-select v-model="scene.viewType" multiple  placeholder="视图类型" style="width: 100%;" clearable>
            <el-option
              v-for="dict in dict.type.iot_scene_type"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="是否禁用：" prop="status">
          <el-radio-group v-model="scene.status">
            <el-radio
                v-for="dict in dict.type.sys_normal_disable"
                :key="dict.value"
                :label="dict.value"
            >{{dict.label}}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注：" prop="remark">
          <el-input v-model="scene.remark" rows="4" type="textarea" placeholder="请输入内容" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button size="mini" type="primary" @click="submitForm">确 定</el-button>
        <el-button size="mini" @click="cancel">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import InputTableSelect from "@/components/InputTableSelect";
import { queryObject, getObject, delObject, createObject, updateObject } from "@/api/iot/table";
import {validateCheck} from "@/assets/js/iot";
import {toProject} from "@/api/iot/system";
import IconSelect from "@/components/IconSelect/index.vue";

export default {
  name: "Scene",
  dicts: [
    'sys_normal_disable',
    'iot_scene_type',
    'iot_scene_category'
  ],
  components: {
    IconSelect,
    InputTableSelect
  },
  data() {
    return {
      table: 'scene',
      desc: '场景',
      // 遮罩层
      loading: true,
      // 选中数组
      ids: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: false,
      // 总条数
      total: 0,
      // 表格数据
      tableList: [],
      scene: { },
      project: {},
      projects : [],
      sceneQuery: {},
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        title: [
          { required: true, message: "场景名称不能为空", trigger: "blur" }
        ],
        project: [
          { self: this, validator: validateCheck,required: true, message: "项目不能为空", trigger: "blur" }
        ],
        viewType: [
          { required: true, message: "场景视图不能为空", trigger: "blur" }
        ]
      }
    };
  },
  created() {
    this.getList();
  },
  methods: {
    /** 查询列表 */
    getList() {
      this.loading = true;
      const queryParams = {
        pageNum : this.queryParams.pageNum,
        pageSize: this.queryParams.pageSize,
        project: this.project.id,
        status: this.queryParams.status
      }
      queryParams['title[like]'] = this.queryParams.title;
      this.sceneQuery = {
        project: this.project.id,
        status: this.queryParams.status
      };
      queryObject(this.table, queryParams).then(response => {
        const rows = response.rows;
        const total = response.total;
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
    // 选择图标
    selected(name) {
      this.scene.icon = name;
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
      this.sceneQuery = { ids : this.ids.join(',') }
      this.single = selection.length!=1
      this.multiple = !selection.length
    },
    goEditScene(row) {
      const project = this.$route.params.project
      if(project){
        this.$router.push({
          path: '/' + project + '/project/sceneEdit',
          query: {id: row.id}
        });
      }else{
        this.$router.push({
          path: '/project/sceneEdit',
          query: {id: row.id}
        });
      }
    },
    handleEdit(row) {
      const scene = JSON.parse(JSON.stringify(row));
      scene['viewType'] = JSON.parse(scene.viewType);
      this.scene = scene;
      // this.project = { id : row.project };
      this.open = true;
    },
    openDialog() {
      this.scene = { status : "0", viewType : [] };
      this.project = {};
      this.open = true;
    },
    cancel() {
      this.open = false;
    },
    /** 提交按钮 */
    submitForm: function() {
      this.$refs["createForm"].validate(valid => {
        if (valid) {
          const viewType = this.scene.viewType;
          this.scene.viewType = JSON.stringify(viewType);
          if (this.scene.id !== undefined) {
            updateObject(this.table, this.scene).then(response => {
              this.open = false;
              this.getList();
              this.$modal.msgSuccess("更新成功");
            });
          } else {
            createObject(this.table, this.scene).then(response => {
              this.open = false;
              this.getList();
              this.$modal.msgSuccess("创建成功");
            });
          }
        }
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
    },
    formatRow(row, column) {
      switch (column.property){
        case 'project':
          const project = this.projects.filter(item => {
            return item.id === row.project
          });
          return project && project[0] ? project[0].title : '未关联';
        default:
          return row[column.property];
      }
    },
    editProjectDone(project) {
      this.scene.project = project.id;
    },
    selectProjectDone(project) {
      if(project){
        this.project = project;
      }else{
        this.project = {};
      }
    }
  }
};
</script>

<style lang="scss" scoped>

.el-dropdown-link {
  font-size: 14px;
}
.el-dropdown-link:hover{
  text-decoration: underline;
}

</style>
