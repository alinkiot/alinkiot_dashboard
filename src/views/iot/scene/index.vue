<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" class="search-form">
      <el-form-item label="场景名称" prop="title">
        <el-input v-model="queryParams.title" placeholder="请输入场景名称" clearable/>
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

    <div class="scene-layout">
      <aside class="scene-project-menu">
        <div class="scene-project-menu-title">
          <span>项目</span>
          <span class="scene-project-count">{{ projectList.length }}</span>
        </div>
        <el-menu :default-active="activeProjectKey" @select="handleProjectSelect">
          <el-menu-item
            v-for="item in projectList"
            :key="item.id"
            :index="String(item.id)"
            class="scene-project-item"
          >
            <i class="el-icon-folder"></i>
            <span slot="title" class="scene-project-name">{{ item.title }}</span>
          </el-menu-item>
        </el-menu>
      </aside>
      <div v-loading="loading" class="scene-content">
        <div class="scene-content-header">
          <div>
            <h2>{{ activeProjectTitle }}</h2>
            <span>共 {{ total }} 个场景</span>
          </div>
        </div>
        <div v-if="tableList.length" class="scene-cards">
          <el-card v-for="sceneItem in tableList" :key="sceneItem.id" class="scene-card" shadow="never">
            <div class="scene-card-heading">
              <el-checkbox
                :value="ids.includes(sceneItem.id)"
                @change="checked => toggleSceneSelection(sceneItem, checked)"
              />
              <div class="scene-card-icon">
                <svg-icon v-if="sceneItem.icon" :icon-class="sceneItem.icon"/>
                <i v-else class="el-icon-monitor"></i>
              </div>
              <div class="scene-card-title">{{ sceneItem.title }}</div>
              <dict-tag :options="dict.type.sys_normal_disable" :value="sceneItem.status"/>
            </div>
            <div class="scene-card-description">{{ sceneItem.remark || '暂无描述' }}</div>
            <div class="scene-card-footer">
              <div class="scene-card-meta">
                <span>ID: {{ sceneItem.id }}</span>
                <span v-if="sceneItem.createTime">{{ parseTime(sceneItem.createTime, '{y}-{m}-{d}') }}</span>
              </div>
              <div class="scene-card-actions">
                <el-button size="mini" type="text" icon="el-icon-info" @click="goEditScene(sceneItem)">查看</el-button>
                <el-button
                  size="mini"
                  type="text"
                  icon="el-icon-edit-outline"
                  @click="handleEdit(sceneItem)"
                  v-hasPermi="['system:scene:edit']"
                >编辑</el-button>
              </div>
            </div>
          </el-card>
        </div>
        <el-empty v-else-if="!loading" description="暂无场景" />
        <pagination
          v-show="total > 0"
          :total="total"
          :page.sync="queryParams.pageNum"
          :limit.sync="queryParams.pageSize"
          @pagination="getList"
        />
      </div>
    </div>
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
import { queryObject, delObject, createObject, updateObject } from "@/api/iot/table";
import {validateCheck} from "@/assets/js/iot";
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
      projectList: [],
      sceneQuery: {},
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        title: '',
        status: ''
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
  computed: {
    activeProjectKey() {
      return this.project.id ? String(this.project.id) : '';
    },
    activeProjectTitle() {
      return this.project.title || '项目';
    }
  },
  created() {
    this.getProjects();
    this.getList();
  },
  methods: {
    getProjects() {
      const pageSize = 100;
      const projects = [];
      const projectIds = new Set();
      const loadPage = pageNum => queryObject('project', { pageNum, pageSize }).then(response => {
        const rows = Array.isArray(response.rows) ? response.rows : [];
        const newProjects = rows.filter(item => {
          const id = String(item.id);
          if (projectIds.has(id)) {
            return false;
          }
          projectIds.add(id);
          return true;
        });
        projects.push(...newProjects);

        const total = Number(response.total);
        const hasLoadedAll = (total > 0 && projects.length >= total) || rows.length === 0 || newProjects.length === 0;
        if (!hasLoadedAll) {
          return loadPage(pageNum + 1);
        }
        this.projectList = projects;
        if (!this.project.id && projects.length) {
          this.project = projects[0];
          this.queryParams.pageNum = 1;
          this.getList();
        }
      });
      loadPage(1).catch(() => {
        this.$modal.msgError('项目列表加载失败');
      });
    },
    /** 查询列表 */
    getList() {
      this.loading = true;
      this.ids = [];
      this.multiple = true;
      const queryParams = {
        pageNum : this.queryParams.pageNum,
        pageSize: this.queryParams.pageSize,
        project: this.project.id,
        status: this.queryParams.status
      };
      queryParams['title[like]'] = this.queryParams.title;
      this.sceneQuery = {
        project: this.project.id,
        status: this.queryParams.status,
        'title[like]': this.queryParams.title
      };
      queryObject(this.table, queryParams).then(response => {
        this.tableList = response.rows || [];
        this.total = response.total || 0;
        this.loading = false;
      }).catch(() => {
        this.loading = false;
        this.tableList = [];
        this.total = 0;
        this.$modal.msgError('场景列表加载失败');
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
    toggleSceneSelection(sceneItem, checked) {
      const selected = new Set(this.ids);
      if (checked) {
        selected.add(sceneItem.id);
      } else {
        selected.delete(sceneItem.id);
      }
      this.ids = Array.from(selected);
      this.sceneQuery = { ids: this.ids.join(',') };
      this.multiple = this.ids.length === 0;
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
      const ids = row && row.id ? row.id : this.ids;
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
        ...this.queryParams,
        project: this.project.id,
      }, this.desc+`_${new Date().getTime()}.xlsx`)
    },
    editProjectDone(project) {
      this.scene.project = project.id;
    },
    handleProjectSelect(projectId) {
      this.project = this.projectList.find(item => String(item.id) === projectId) || {};
      this.queryParams.pageNum = 1;
      this.getList();
    }
  }
};
</script>

<style lang="scss" scoped>
.scene-layout {
  display: flex;
  min-height: 420px;
  gap: 16px;
}

.scene-project-menu {
  display: flex;
  min-height: 0;
  flex-direction: column;
  width: 248px;
  flex: 0 0 248px;
  padding: 6px;
  overflow: hidden;
  border: 1px solid rgba(127, 127, 127, 0.14);
  border-radius: 10px;

  ::v-deep .el-menu {
    min-height: 0;
    flex: 1;
    background: transparent;
    overflow-x: hidden;
    overflow-y: auto;
    border-right: 0;
  }

  ::v-deep .el-menu-item.scene-project-item {
    display: flex;
    align-items: center;
    gap: 12px;
    height: 44px;
    margin: 2px 0;
    padding: 0 12px !important;
    border-radius: 6px;
    line-height: 44px;
    font-size: 13px;
    transition: background-color 0.18s ease, color 0.18s ease;

    > i {
      flex: 0 0 20px;
      margin: 0;
      color: #909399;
      font-size: 16px;
      text-align: center;
    }

    > .el-menu-item__title {
      overflow: hidden;
      min-width: 0;
      flex: 1;
    }

    .scene-project-name {
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &.scene-project-all {
      margin-bottom: 8px;
    }
  }

  ::v-deep .el-menu-item.scene-project-item:not(.is-active):hover {
    background-color: rgba(127, 127, 127, 0.08);
  }

  ::v-deep .el-menu-item.scene-project-item.is-active > i {
    color: currentColor;
  }
}

.scene-project-menu-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 4px 6px 8px;
  padding: 8px 8px 12px;
  border-bottom: 1px solid rgba(127, 127, 127, 0.14);
  color: inherit;
  font-size: 14px;
  font-weight: 600;
}

.scene-project-count {
  min-width: 22px;
  padding: 2px 8px;
  border-radius: 12px;
  background: rgba(127, 127, 127, 0.12);
  color: #909399;
  font-size: 12px;
  font-weight: 400;
  line-height: 20px;
  text-align: center;
}

.scene-content {
  min-width: 0;
  flex: 1;
}

.scene-content-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 50px;
  margin: 0 0 14px;
  padding: 0 2px 12px;
  border-bottom: 1px solid rgba(127, 127, 127, 0.14);

  h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    line-height: 24px;
  }

  span {
    display: block;
    margin-top: 3px;
    color: #909399;
    font-size: 12px;
  }
}

.scene-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 12px;
}

.scene-card {
  min-width: 0;
  border-radius: 7px;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;

  &:hover {
    border-color: #c6e2ff;
    box-shadow: 0 3px 12px rgba(0, 0, 0, 0.06);
  }

  ::v-deep .el-card__body {
    padding: 12px 14px;
  }
}

.scene-card-heading {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
}

.scene-card-icon {
  display: flex;
  width: 32px;
  height: 32px;
  flex: 0 0 32px;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: rgba(0, 113, 227, 0.08);
  color: var(--current-color, #0071e3);
  font-size: 16px;
}

.scene-card-title {
  overflow: hidden;
  min-width: 0;
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.scene-card-description {
  overflow: hidden;
  height: 18px;
  margin-top: 8px;
  color: #909399;
  font-size: 12px;
  line-height: 18px;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
}

.scene-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px solid rgba(127, 127, 127, 0.12);
}

.scene-card-meta {
  display: flex;
  min-width: 0;
  flex: 1;
  gap: 8px;
  color: #909399;
  font-size: 11px;

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.scene-card-actions {
  display: flex;
  flex: 0 0 auto;
  gap: 4px;

  ::v-deep .el-button {
    margin: 0;
    padding: 4px 2px;
  }
}

@media (max-width: 600px) {
  .scene-layout {
    flex-direction: column;
  }

  .scene-project-menu {
    display: block;
    width: 100%;
    flex-basis: auto;
    overflow: hidden;
    padding: 8px;

    ::v-deep .el-menu {
      display: flex;
      min-height: auto;
      overflow-y: hidden;
      overflow-x: auto;
    }

    ::v-deep .el-menu-item {
      width: auto;
      flex: 0 0 auto;
    }
  }

  .scene-content-header {
    margin-top: 4px;
  }

  .scene-cards {
    grid-template-columns: 1fr;
  }

  .scene-project-menu-title {
    margin-bottom: 8px;
    padding: 4px 8px 10px;
  }
}

</style>
