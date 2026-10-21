<template>
  <div v-loading="loading" class="pano-root">
    <MqttBoard  @doMqttMessage="doMqttMessage" :subscription="subscription"/>
    <el-row :gutter="10">
      <el-col v-if="edit" class="mb8">
        <el-button
            type="primary"
            icon="el-icon-upload"
            size="mini"
            @click="openPicSelector = true"
            v-hasPermi="['system:scene:edit']">
          <span v-if="scene_data">编辑</span>
          <span v-else>上传全景图</span>
        </el-button>
        <el-button v-if="scene_data"
          type="primary"
          icon="el-icon-edit"
          size="mini"
          @click="goAddMarker"
          v-hasPermi="['system:scene:edit']">
          <span v-if="action ==='start'">开始锚点</span>
          <span v-if="action ==='stop'">正在锚点，查看({{markers.length}})</span>
        </el-button>
      </el-col>
    </el-row>
    <div class="pano-box">
      <el-empty description="暂无全景图" v-if="!scene_data"/>
      <div id="viewBox"></div>
    </div>
    <el-dialog title="上传全景图" :visible.sync="openPicSelector">
      <el-form ref="form" :model="form" label-width="100px">
        <el-form-item label="全景图">
          <ImageUpload :limit=1 :value="form.path"  @input="handleFile"/>
        </el-form-item>
        <el-form-item label="标题">
          <el-input v-model="form.caption"></el-input>
        </el-form-item>
        <el-form-item label="宽度">
          <el-input v-model="form.width"></el-input>
        </el-form-item>
        <el-form-item label="高度">
          <el-input v-model="form.height"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button size="mini" v-if="scene_data" icon="el-icon-delete" type="danger" @click="deleteScene">删除</el-button>
        <el-button size="mini" icon="el-icon-success" type="primary" @click="submitForm">保存</el-button>
      </div>
    </el-dialog>

    <el-dialog
      title="选择设备"
      :visible.sync="openSelectDevice"
      width="55%">
      <DeviceTable
        :buttons="buttons"
        :queryParams="queryParams"
        @handleEvent="onSelectDevice"
        @handleSelectionChange="onSelectDevice"
      />
    </el-dialog>
    <el-drawer
      :title="'当前已添加：'+ markers.length"
      :visible.sync="openAddPosition"
      size="40%"
      direction="rtl">
      <el-card shadow="never">
        <el-collapse accordion>
          <el-collapse-item v-for="marker in markers" :name="marker.id" :key="marker.id">
            <template slot="title">
              <el-image fit="contain" :src="defMarkerIcon" />
              <span class="collapse-title">{{marker.id}} {{marker.listContent}}</span>
            </template>
            <div>经度: {{marker.longitude}}</div>
            <div>纬度: {{marker.latitude}}</div>
            <div>
              <el-button
                type="text"
                icon="el-icon-info"
                size="mini"
                v-if="showId === marker.id"
                @click="hiddenMarker(marker)">
                隐藏
              </el-button>
              <el-button
                type="text"
                icon="el-icon-info"
                size="mini"
                v-else
                @click="selectMarker(marker)">
                显示
              </el-button>
              <el-button
                type="text"
                icon="el-icon-delete"
                size="mini"
                @click="cleanMarker(marker)">
                删除
              </el-button>
              <el-button
                type="text"
                icon="el-icon-text"
                size="mini"
                @click="selectDevice(marker)">
                选择设备
              </el-button>
            </div>
          </el-collapse-item>
        </el-collapse>
        <div style="margin-top: 10px;">
          <el-button v-if="markers.length > 0"
                     type="danger"
                     icon="el-icon-delete"
                     size="mini"
                     @click="cleanAllMarkers">
            清除
          </el-button>
          <el-button
            type="primary"
            icon="el-icon-success"
            size="mini"
            @click="saveMarkers">
            保存
          </el-button>
        </div>
      </el-card>
    </el-drawer>
  </div>
</template>
<script>

import 'photo-sphere-viewer/dist/photo-sphere-viewer.css'
import 'photo-sphere-viewer/dist/plugins/markers.css';
import { Viewer } from 'photo-sphere-viewer';
import { MarkersPlugin } from 'photo-sphere-viewer/dist/plugins/markers'
import {createObject, queryObject, updateObject, delObject} from "@/api/iot/table";

import ImageUpload from "@/components/ImageUpload/index.vue";
import DeviceTable from "@/views/iot/device/components/deviceTable.vue";
import MqttBoard from "@/components/MqttBoard/index.vue";

export default {
  dicts: [],
  components: {
    MqttBoard,
    DeviceTable,
    ImageUpload
  },
  props: {
    scene: {
      type: Object,
      required: true
    },
    scene_key: {
      type: String,
      required: true
    },
    edit: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      loading: false,
      openPicSelector: false,
      openAddPosition: false,
      openSelectDevice: false,
      form: { },
      scene_data: undefined,
      viewer: undefined,
      markersPlugin: undefined,
      markers: [],
      action: 'start',
      showId: undefined,
      showAllTip: true,
      currenMarker: undefined,
      defMarkerIcon: require("@/assets/images/marker.png"),
      queryParams:undefined,
      subscription: undefined,
      buttons:[
        {
          text: '选择设备',
          event: 'selectDevice',
          icon: 'el-icon-success'
        }
      ]
    };
  },
  mounted() {
    this.sceneChange();
  },
  methods: {
    sub() {
      const topic = 's/out/' + this.scene.project + '/' + this.scene.id + '/#';
      this.subscription = {
        topic: topic,
        qos: 0
      }
    },
    doMqttMessage(topic, message){
      const data = JSON.parse(message);
      console.log(data);
      this.updateStatus();
    },
    hiddenMarker(row) {
      this.markersPlugin.hideMarkerTooltip(row.id);
      this.showId = undefined;
    },
    hiddenAllMarker(){
      this.markers.map(item => {
        this.hiddenMarker(item);
      })
    },
    selectMarker(row) {
      if(this.showId){
        this.markersPlugin.hideMarkerTooltip(this.showId);
      }
      this.openAddPosition = false;
      this.showId = row.id;
      this.markersPlugin.gotoMarker(row.id);
      this.markersPlugin.showMarkerTooltip(row.id);
    },
    onSelectDevice(event, device){
      if(event === 'selectDevice'){
        this.openSelectDevice = false;
        this.currenMarker.listContent = device.name;
        const tooltip = this.currenMarker.tooltip;
        tooltip.content = device.name;
        this.currenMarker.tooltip = tooltip;
        let data = this.currenMarker.data;
        if(!data){
          data = { 'devId': device.id }
        }
        data.addr = device.addr;
        this.currenMarker.data = data;
      }else{
        // 多选
      }

    },
    saveMarkers() {
      const new_data = this.scene_data.data;
      const markers = [];
      this.markers.map(item => {
        const position = {
          latitude: item.latitude,
          longitude: item.longitude
        }
        markers.push({
          position: position,
          data: item.data,
          listContent: item.listContent
        })
      });
      new_data.markers = markers;
      const params = {
        id: this.scene_data.id,
        data: JSON.stringify(new_data)
      };
      updateObject('scene_view', params).then(response => {
        this.action = 'start';
        this.openAddPosition = false;
        this.$modal.msgSuccess("保存成功!");
        this.sceneChange();
      })
    },
    cleanAllMarkers() {
      this.markersPlugin.clearMarkers();
      this.markers = [];
    },
    cleanMarker(row) {
      this.markersPlugin.removeMarker(row.id);
      this.markers = this.markers.filter(item => { return item.id !== row.id});
    },
    selectDevice(marker) {
      this.currenMarker = marker;
      this.openSelectDevice = true;
      this.queryParams = {
          pageNum: 1,
          pageSize: 10,
          scene: this.scene.id
      };
      this.queryParams["orderby[desc]"] = "createTime";
    },
    goAddMarker() {
      if(this.action === 'start'){
        this.action = 'stop';
      }else{
        this.openAddPosition = true;
      }
    },
    reset() {
      this.showId = undefined;
      this.showAllTip = false;
      this.currenMarker = undefined;
      this.scene_data = undefined;
      this.subscription = { };
      this.form = {};
      if(this.viewer){
        this.cleanAllMarkers();
        this.viewer.destroy();
        this.viewer = undefined;
      }
    },
    sceneChange() {
      this.reset();
      const query = {
        scene : this.scene.id,
        sceneType: this.scene_key
      };
      this.loading = true;
      const container = document.getElementById('viewBox');
      container.style.display = 'none';
      queryObject('scene_view', query).then(response => {
        this.loading = false;
        const items = response.data;
        if(items.length > 0){
          this.sub();
          this.scene_data = items[0];
          const data = this.scene_data.data;
          this.scene_data.data = JSON.parse(data);
          this.form = this.scene_data.data;
          this.transportMarkers(this.scene_data.data);
          container.style.display = 'block';
          this.createViewer(container);
        }
      })
    },
    createViewer(container) {
      const data = this.scene_data.data;
      this.viewer = new Viewer({
        container: container,
        panorama: data.path,
        navbar: [
          'caption',
          'zoom',
          'move',
          {
            id: 'showTipBtn',
            content: '显示/隐藏',
            title: '显示所有标记提示',
            className: 'custom-button',
            onClick: (viewer) => {
              if(this.markers.length > 0){
                if(this.showAllTip){
                  this.hiddenAllMarker();
                }else{
                  this.markersPlugin.showAllTooltips();
                }
                this.showAllTip = !this.showAllTip;
              }
            },
          },
          'fullscreen',
          'markersList'
        ],
        caption: data.caption,
        mousewheel: true,
        mousemove: true,
        size: {
          // 宽高均跟随容器，避免用户填写的固定像素撑破内容区（底部溢出）
          width: '100%',
          height: '100%',
        },
        plugins:[
          [MarkersPlugin, {
            defaultHoverScale: true,
            markers: this.markers
          }]
        ]
      });
      this.markersPlugin = this.viewer.getPlugin(MarkersPlugin);
      this.markersPlugin.on("select-marker", (e, marker, event) => {
        const data = marker.data;
        this.$emit('click', data.devId);
      });
      this.viewer.once('ready', () => {
        this.showAllTip = true;
        this.markersPlugin.showAllTooltips();
      });
      this.viewer.on('click', (e, data) => {
        if (!data.rightclick && this.action === 'stop') {
          const id = this.getId();
          const position = {
            latitude: data.latitude,
            longitude: data.longitude
          };
          const marker = this.createMarker(id, position, '未绑定');
          this.markers.push(marker);
          this.markersPlugin.addMarker(marker);
        }
      });
    },
    getId() {
      let i = 0;
      try {
        const markers = this.markers.sort((a, b) =>  a.id - b.id );
        markers.forEach(item => {
          i = i + 1;
          if(item.id !== i){
            throw new Error('break');
          }
        });
      } catch(e) {
        return i;
      }
      return this.markers.length + 1;
    },
    createMarker(id, position, listContent, data) {
      return {
        id: id,
        longitude: position.longitude,
        latitude: position.latitude,
        image: this.defMarkerIcon,
        width: 32,
        height: 32,
        anchor: 'bottom center',
        tooltip: { // tooltip with a custom class shown on click
          content: listContent,
          className: 'custom-tooltip',
          trigger: 'click', // hover
        },
        listContent: listContent, // 右侧列表
        content: '<div>暂无数据</div>', // 点击设备显示内容
        data: data
      };
    },
    transportMarkers(data, IsAdd) {
      const markers = data.markers ? data.markers : [];
      let i = 0;
      markers.map(item => {
        i = i + 1;
        const marker = this.createMarker(
          i,
          item.position,
          item.listContent,
          item.data
        );
        if(IsAdd){
          this.markersPlugin.addMarker(marker);
        }
        this.markers.push(marker);
      });
    },
    handleFile(path) {
      this.form.path = path;
    },
    // 把数字/字符串尺寸规范成合法的 CSS 尺寸；空值用兜底
    toCssSize(val, fallback) {
      if (val === undefined || val === null || val === '') {
        return fallback;
      }
      // 纯数字（或纯数字字符串）按像素处理
      if (/^\d+(\.\d+)?$/.test(String(val).trim())) {
        return String(val).trim() + 'px';
      }
      return val;
    },
    updateStatus() {
      // const self = this;
      // const Format = function(marker) {
      //   return '<iframe style="width: 100%;" src="http://www.baidu.com"/>';
      // }
      // self.markers.map(item => {
      //   self.markersPlugin.updateMarker({
      //     id: item.id,
      //     content: Format(item)
      //   });
      // })
      // setInterval(function (){
      //   self.markers.map(item => {
      //     self.markersPlugin.updateMarker({
      //       id: item.id,
      //       content: Format(item)
      //     });
      //   })
      // }, 100000)
    },
    deleteScene() {
      delObject('scene_view', this.scene_data.id).then(response => {
        this.openPicSelector = false;
        this.$modal.msgSuccess("删除成功!");
        this.sceneChange();
      })
    },
    submitForm() {
      const post = {
        scene : this.scene.id,
        sceneType : this.scene_key,
        data : JSON.stringify(this.form)
      }
      if(this.scene_data){
        post.id = this.scene_data.id;
        updateObject('scene_view', post).then(response => {
          this.openPicSelector = false;
          this.edit = false;
          this.sceneChange();
          this.$modal.msgSuccess("修改成功");
        })
      }else{
        createObject('scene_view', post).then(response => {
          this.openPicSelector = false;
          this.edit = false;
          this.$modal.msgSuccess("创建成功");
          this.sceneChange();
        })
      }
    }
  },
  watch: {
    scene: {
      deep: true,
      handler() {
        this.sceneChange();
      }
    }
  }
};
</script>
<style lang="scss" scoped>

.pano-root {
  height: 100%;
  display: flex;
  flex-direction: column;
}

#viewBox {
  position: relative;
  width: 100%;
  max-width: 100%;
  height: 100%;
  min-height: 360px;
  overflow: hidden;
}

.pano-box {
  flex: 1;
  width: 100%;
  max-width: 100%;
  min-height: 0;
  overflow: hidden;
}

.collapse-title {
  font-size: 19px;
}
::v-deep .el-collapse-item__content{
  font-size: 15px;
}
::v-deep .el-image{
  width: 15px;
  margin-right: 5px;
}
::v-deep .el-image__inner {
  vertical-align: middle;
}
.custom-tooltip {
  color: red;
}

</style>
