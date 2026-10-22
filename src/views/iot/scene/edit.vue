<template>
  <div class="app-container" :class="{ 'scene-preview-container': previewOnly }">
    <el-container  v-loading="loading">
      <el-aside
        width="250px"
        style="margin-right: 10px; min-height: 500px"
        v-if="!single && !previewOnly"
      >
        <el-menu
          :defaultActive="defaultActive"
          @select="handleSelect"
          style="border: 0px"
          v-if="menuData.length > 0"
        >
          <template v-for="menu in menuData">
            <template v-if="menu.children && menu.children.length > 0">
              <el-submenu :index="menu.name" :key="menu.name">
                <template slot="title">
                  <svg-icon style="margin-right: 5px; font-size: 18px;" :icon-class="menu.icon" />
                  <span>{{ menu.title }}</span>
                </template>
                <template v-for="subMenu in menu.children">
                  <el-menu-item
                    :index="subMenu.id.toString()"
                    :key="subMenu.id"
                  >
                    <svg-icon style="margin-right: 5px; font-size: 18px;" :icon-class="subMenu.icon" />
                    <span>{{ subMenu.title }}</span>
                  </el-menu-item>
                </template>
              </el-submenu>
            </template>
            <template v-else>
              <el-menu-item :index="menu.name" :key="menu.name">
                <svg-icon style="margin-right: 3px" :icon-class="menu.icon" />
                <span>{{ menu.title }}</span>
              </el-menu-item>
            </template>
          </template>
        </el-menu>
        <el-empty description="找不到场景"  v-else />
      </el-aside>
      <el-container style="padding: 0px">
          <el-header v-if="scene.title && !previewOnly">
            <span class="title-dev">场景：{{ scene.title }}</span>
            <el-tooltip
              class="item"
              effect="dark"
              content="编辑状态时可以进入编辑状态"
              placement="bottom"
              v-hasPermi="['system:scene:edit']"
            >
              <el-button
                type="text"
                icon="el-icon-unlock"
                @click="openEdit"
                style="margin-left: 5px"
                v-if="isEdit"
              />
              <el-button
                type="text"
                icon="el-icon-lock"
                @click="openEdit"
                style="color: silver; margin-left: 5px"
                v-else
              />
            </el-tooltip>
          </el-header>
          <el-main style="padding: 0px">
            <el-tabs v-model="activeName" @tab-click="tabChange" class="scene-tabs">
              <el-tab-pane
                v-for="item in tabs"
                :key="item.name"
                :label="item.title"
                :name="item.name"
              >
                <DeviceTable
                  @click="deviceClick"
                  :edit="isEdit"
                  :scene="scene"
                  v-if="activeName===item.name && item.name === 'table'"
                />
                <SceneMap
                  @click="deviceClick"
                  :scene="scene"
                  class="devMap"
                  v-else-if="item.name === 'map'"
                />
                <ScenePics
                  @click="deviceClick"
                  :edit="isEdit"
                  :scene="scene"
                  :scene_key="item.name"
                  v-else-if="item.name === 'pic'"
                />
                <SceneChart
                  @click="deviceClick"
                  :edit="isEdit"
                  :scene="scene"
                  :scene_key="item.name"
                  :activeName="activeName"
                  v-else-if="item.name === 'chart'"
                />
                <SphereViewer
                  @click="deviceClick"
                  :edit="isEdit"
                  :scene="scene"
                  :scene_key="item.name"
                  v-else-if="activeName===item.name && item.name === 'panoramic'"
                />
                <!--        <OpenView @click="deviceClick" :scene="scene" v-else-if="item.key === 'view'" />-->
                <!-- 其余视图（三维视图/组态视图/曲线展示等）统一支持上传并嵌入一段 HTML -->
                <SceneHtmlView
                  @click="deviceClick"
                  :edit="isEdit"
                  :scene="scene"
                  :scene_key="item.name"
                  v-else-if="activeName===item.name"
                />
              </el-tab-pane>
            </el-tabs>
          </el-main>
          <el-footer style="height: 22px;"></el-footer>
      </el-container>
    </el-container>
    <el-dialog
      :title="device ? device.name : '当前状态'"
      :visible.sync="showStatus"
      append-to-body
      custom-class="status-dialog"
    >
      <DeviceBoard :devId="selDevId" @deviceChange="deviceChange" />
    </el-dialog>
  </div>
</template>
<script>
import { getObject } from "@/api/iot/table";
import DeviceTable from "./components/deviceTable";
import SceneMap from "./components/sceneMap";
import ScenePics from "./components/scenePics.vue";
import SceneChart from "./components/sceneChart";
import SphereViewer from "./components/sphereViewer.vue";
import SceneHtmlView from "./components/sceneHtml.vue";
import DeviceBoard from "@/views/iot/device/components/deviceBoard.vue";
import { getDicts } from "@/api/system/dict/data";
// import OpenView from "@/components/SceneView/openView.vue";
// import screenfull from "screenfull";
export default {
  name: "SceneEdit",
  props: {
    sceneId: {
      type: [String, Number],
      default: undefined
    },
    previewOnly: {
      type: Boolean,
      default: false
    }
  },
  dicts: [],
  components: {
    DeviceTable,
    SceneMap,
    DeviceBoard,
    ScenePics,
    SphereViewer,
    SceneChart,
    SceneHtmlView,
    // OpenView
  },
  data() {
    return {
      loading: false,
      isEdit: false,
      title: "实时数据",
      activeName: "",
      scene: {},
      showStatus: false,
      selDevId: undefined,
      device: undefined,
      tabs: [],
      single: false,
      menuData: [],
      defaultActive: undefined
    };
  },
  created() {
    if (this.previewOnly && this.sceneId !== undefined && this.sceneId !== null) {
      this.single = true;
      this.queryScene(this.sceneId);
    } else if (this.$route.query.ids) {
      const ids = this.$route.query.ids;
      this.single = false;
      this.queryScene(ids);
    } else {
      const id = this.$route.query.id;
      this.single = true;
      this.queryScene(id);
    }
  },
  methods: {
    openEdit() {
      this.isEdit = !this.isEdit;
      if (this.previewOnly) {
        this.$emit("edit-change", this.isEdit);
      }
    },
    handleSelect(key, keyPath) {
      const items = this.menuData.filter((item) => item.name === keyPath[0]);
      if (items[0]) {
        const item = items[0].children.filter(
          (menu) => menu.id.toString() === key
        );
        if (item[0]) {
          this.changeScene(item[0]);
        }
      }
    },
    changeScene(scene) {
      this.scene = scene;
      this.defaultActive = this.scene.id.toString();
      this.createTab();
    },
    queryScene(ids) {
      this.loading = true;
      getObject("scene", ids).then((response) => {
        const data = response.data;
        let scenes = [];
        if(Array.isArray(data)){
          scenes = data
        }else if(data){
          scenes.push(data)
        }
        // 场景本身不存在，直接结束，页面显示“找不到场景”
        if(scenes.length === 0){
          this.menuData = [];
          this.loading = false;
          return;
        }
        const projects = {};
        scenes.map((item) => {
          if(item.viewType && typeof item.viewType === 'string'){
            try { item.viewType = JSON.parse(item.viewType); } catch(e) { item.viewType = []; }
          }else if(!Array.isArray(item.viewType)){
            item.viewType = [];
          }
          if (projects[item.project]) {
            projects[item.project].push(item);
          } else {
            projects[item.project] = [item];
          }
        });
        const keys = Object.keys(projects)
        if(keys.length > 0){
          getObject("project", keys.join(",")).then((response) => {
            // 项目可能已被删除：response.data 为 null / [] / 对象 / 数组
            const raw = response && response.data;
            let items = [];
            if(Array.isArray(raw)){
              items = raw.filter(Boolean);
            }else if(raw){
              items = [raw];
            }
            // 关联到的项目
            items.map((item) => {
              item.children = projects[item.id];
              item.icon = "project";
            });
            // 补上“项目已不存在”的场景，避免丢失、保证页面能打开
            const foundIds = items.map(i => String(i.id));
            keys.forEach((pk) => {
              if(!foundIds.includes(String(pk))){
                items.push({
                  id: pk,
                  name: "project-" + pk,
                  title: "未关联项目",
                  icon: "project",
                  children: projects[pk]
                });
              }
            });
            this.buildMenu(items);
            this.loading = false;
          }).catch(() => {
            // 查询项目失败时，仍以“未关联项目”分组展示场景
            const items = keys.map((pk) => ({
              id: pk,
              name: "project-" + pk,
              title: "未关联项目",
              icon: "project",
              children: projects[pk]
            }));
            this.buildMenu(items);
            this.loading = false;
          });
        }else{
          this.loading = false;
        }
      }).catch(() => {
        this.menuData = [];
        this.loading = false;
      });
    },
    buildMenu(items) {
      this.menuData = items;
      const first = items.find(i => i && i.children && i.children.length > 0);
      if(first){
        this.changeScene(first.children[0]);
      }
    },
    createTab() {
      const tabs = [];
      this.loading = true;
      getDicts("iot_scene_type").then((res) => {
        const items = res.data;
        this.scene.viewType.map((key) => {
          items.filter((dict) => {
            if (dict.dictValue === key) {
              tabs.push({ name: key, title: dict.dictLabel });
            }
          });
        });
        if (tabs.length > 0) {
          if(!this.activeName || tabs.filter(item => { return item.name === this.activeName }).length === 0){
            this.activeName = tabs[0].name;
          }
          this.tabChange(tabs[0]);
        }
        this.tabs = tabs;
        this.loading = false;
      });
    },
    deviceChange(device) {
      this.device = device;
      console.log(this.device);
    },
    deviceClick(devId) {
      this.selDevId = devId;
      this.showStatus = true;
    },
    tabChange(tab) {

    },
  },
};
</script>

<style lang="scss" scoped>

.devMap {
  border: 1px solid #bbbbbb;
}

/* ===== 自适应高度链：让地图/全景图填满可视区，而不是用固定像素 =====
   顶部减去 navbar(52)+tagsView(38)=90（与 app-main 默认一致）。 */
.app-container {
  height: calc(100vh - 90px);
  box-sizing: border-box;
  overflow: hidden;
}

.app-container.scene-preview-container {
  height: 78vh;
  padding: 12px;
}

.app-container > .el-container {
  height: 100%;
}

/* 右侧内容列：纵向 flex，内容区填满剩余高度 */
.el-container .el-container {
  min-width: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
}

::v-deep .el-main {
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* el-tabs 整体填满 el-main，tab 内容区填满 tabs 剩余高度 */
::v-deep .scene-tabs {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;

  .el-tabs__content {
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  .el-tab-pane {
    height: 100%;
  }
}

.el-aside {
  padding: 0px;
  background: white;
  border: 1px #bbbbbb solid;
}
.el-header {
  line-height: 50px;
  padding: 0px;
}

.title-dev {
  font-weight: bolder;
  font-size: large;
}

</style>

<!-- el-dialog 挂载到 body 根节点，scoped 无法命中，用全局样式收紧标题与内容间距 -->
<style lang="scss">
.el-dialog.status-dialog {
  .el-dialog__header {
    padding: 15px 20px 10px !important;
  }
  .el-dialog__body {
    padding: 0px 20px 20px !important;
  }
}
</style>
