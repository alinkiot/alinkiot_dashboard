<template>
  <div class="amap-wrapper" v-loading="loading">
    <el-amap
        vid="amapScene"
        :amap-manager="amapManager"
        :zoom="zoom"
        :center="center"
        :events="events"
        :map-style="styleName"
        :plugin="plugins">
      <el-amap-marker v-for="marker in markers" :key="marker.device.addr"
                      :title="marker.device.name"
                      :position="marker.position"
                      :extData="marker.device"
                      :events="events"/>
    </el-amap>
  </div>
</template>

<script>
import { AMapManager } from "vue-amap";
import {getObject, queryObject} from "@/api/iot/table";
import { mapInit } from "@/api/iot/system"

let amapManager = new AMapManager();
export default {
  components: {
  },
  props: {
    scene: {
      type: Object,
      required: true
    },
    height: {
      type: Number,
      default: function(){
        // 预留顶栏/标签页/内边距，避免占满整个窗口高度导致纵向溢出
        return Math.max(window.innerHeight - 220, 360);
      }
    }
  },
  computed:{
    styleName() {
      const sideTheme = this.$store.state.settings.sideTheme;
      if(/theme-dark-.+/.test(sideTheme)){
        return 'amap://styles/blue';
      }else{
        return 'amap://styles/normal';
      }
    }
  },
  data() {
    const self = this;
    return {
      amapManager,
      plugins: ['ToolBar', 'Autocomplete', 'OverView', 'Geocoder'],
      loading: false,
      tableList : [],
      queryParams: {
        pageNum: 1,
        pageSize: 1000
      },
      markers : [],
      zoom: 13,
      center: [121.59996, 31.197646],
      defMarkerIcon: require("@/assets/images/marker.png"),
      events: {
        click(e) {
          if(e.target['CLASS_NAME'] === 'AMap.Marker'){
            const device = e.target.w.extData;
            self.$emit('click', device.id);
          }
        },
        complete: (e) => {
          self.getDevice(function(tabList){
            self.tabList = tabList;
            let minLng = 0, maxLng = 0, minLat = 0, maxLat = 0;
            tabList.map(device => {
              if(device.lng > 0 && device.lat > 0){
                minLng = minLng === 0 ? device.lng : Math.min(minLng, device.lng);
                minLat = minLat === 0 ? device.lat : Math.min(minLat, device.lat);
                maxLng = Math.max(maxLng, device.lng);
                maxLat = Math.max(maxLat, device.lat);
                self.markers.push({ position : [device.lng, device.lat], device: device });
              }
            });
            const info = self.getZoom(maxLng, minLng, maxLat, minLat);
            if(info){
              self.center = info.center;
              self.zoom = info.zoom;
            }
            self.loading = false;
          })
        }
      }
    }
  },
  created() {
    mapInit(this);
  },
  methods: {
    getDevice(Fun) {
        this.loading = true;
        this.queryParams.scene = this.scene.id;
        this.queryParams["orderby[desc]"] = "createTime";
        queryObject('scene_device', this.queryParams).then(response => {
          const rows = response.rows;
          const ids = [];
          rows.map(i => {
            ids.push(i.device)
          });
          const tabList = [];
          if(ids.length > 0){
            getObject('device', ids.join(',')).then(response => {
              let devices = [];
              if(Array.isArray(response.data)){
                devices = response.data;
              }else{
                devices.push(response.data)
              }
              rows.map(route => {
                const arr = devices.filter(device => { return device.id === route.device });
                if(arr.length > 0){
                  const device = arr[0];
                  device.scene = route;
                  tabList.push(device);
                }
              });
              Fun(tabList);
            })
          }else{
            Fun([]);
          }
        });
      },
    getZoom(maxLng, minLng, maxLat, minLat) {
      if(maxLng === 0 ||  minLng === 0 || maxLat === 0 || minLat === 0){
        return undefined;
      }
      let map = amapManager.getMap();
      const size = map.getSize();
      const distance = AMap.GeometryUtil.distance([maxLng, maxLat], [minLng, minLat]);
      const nowDivLine = Math.sqrt(size.width * size.width + size.height * size.height);
      const nowScale = distance / nowDivLine;
      const zoom = 16 - Math.ceil(Math.log(nowScale) / Math.log(2));
      const center = [(maxLng + minLng) / 2, (maxLat + minLat) / 2];
      return { zoom : zoom, center : center };
    },

  }
};
</script>
<style lang="scss" scoped>

.amap-wrapper {
  width: 100%;
  max-width: 100%;
  height: 100%;
  min-height: 360px;
  padding: 5px;
  box-sizing: border-box;
  overflow: hidden;

  // vue-amap 渲染出的地图容器需要填满 wrapper 才能正常显示
  ::v-deep .amap-box,
  ::v-deep .el-vue-amap-container,
  ::v-deep .el-vue-amap {
    width: 100%;
    height: 100%;
  }
}

::v-deep .amap-icon img {
  max-width: 30px;
  max-height: 30px;
}

</style>
