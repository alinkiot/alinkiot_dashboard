<template>
  <div class="device-map">
    <TableShow ref="locationInfo" class="location-info" :columns="columns" :item="device" @selectMapDone="selectMapDone" />
    <div class="amap-wrapper" ref="amapWrapper" :style="{height: mapHeight + 'px'}">
      <el-amap
        vid="amapScene"
        :amap-manager="amapManager"
        :zoom="zoom"
        :center="center"
        :events="events"
        :map-style="styleName"
        :plugin="plugins">
        <el-amap-marker v-if="device.lng && device.lat" :position="center" :events="events"/>
        <el-amap-info-window
          v-if="device.lng && device.lat"
          :position="center"
          :content="device.location"
          :offset="[0,-35]"
        />
      </el-amap>
      <div class="amap-empty-tip" v-if="!device.lng || !device.lat">
        <i class="el-icon-warning-outline"/>
        <span>该设备尚未设置位置，当前为默认地图</span>
        <el-button type="primary" size="mini" @click="openLocationSelector">点击设置位置</el-button>
      </div>
    </div>
  </div>
</template>

<script>
import { AMapManager } from "vue-amap";
import { mapInit } from "@/api/iot/system";
import TableShow from "@/components/TableShow/index.vue";
import {updateObject} from "@/api/iot/table";

let amapManager = new AMapManager();
export default {
  components: {
    TableShow
  },
  props: {
    device: {
      type: Object,
      required: true
    },
    height: {
      type: Number,
      default: function(){
        return 500;
      }
    }
  },
  computed: {
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
      mapHeight: this.height,
      plugins: ['ToolBar', 'Autocomplete', 'OverView', 'Geocoder'],
      zoom: 13,
      center: [121.59996, 31.197646],
      columns: [
        {key: 'country', title: '国家', type: 'text'},
        {key: 'district', title: '区域', type: 'text'},
        {key: 'lat', title: '经纬度', type: 'relation', on: 'lng'},
        {key: 'location', title: '位置', type: 'map', lat: 'lat', lng:'lng'}
      ],
      events: {
        complete: (e) => {
          if(self.device.lng && self.device.lat){
            self.center = [self.device.lng, self.device.lat];
            self.zoom = 13;
          }else{
            // 未设置经纬度时，先用默认中心点以较低缩放级别展示大范围地图
            self.zoom = 5;
          }
        }
      }
    }
  },
  created() {
    mapInit(this);
  },
  mounted() {
    this.$nextTick(this.resizeMap);
    window.addEventListener('resize', this.resizeMap);
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.resizeMap);
  },
  watch: {
    'device.lng'() {
      this.$nextTick(this.resizeMap);
    },
    'device.lat'() {
      this.$nextTick(this.resizeMap);
    }
  },
  methods: {
    // 让地图高度按可视区自适应：视口高度 - 容器距顶距离 - 底部留白
    resizeMap() {
      const wrapper = this.$refs.amapWrapper;
      if (!wrapper) return;
      const top = wrapper.getBoundingClientRect().top;
      // 预留下方 .app-container 的 padding(24) + margin(16) + 地图自身 margin 等空间
      const bottomGap = 55;
      const available = window.innerHeight - top - bottomGap;
      // 不低于传入的 height 作为最小高度，避免过矮
      this.mapHeight = Math.max(available, this.height);
    },
    selectMapDone(column, data) {
      const form = {
        id: this.device.id,
        location: data.location,
        country: data.country,
        province: data.province,
        district: data.district,
        lat: data.lat,
        lng: data.lng
      }
      updateObject('device', form).then(response => {
        this.device.location = data.location;
        this.device.country = data.country;
        this.device.province = data.province;
        this.device.district = data.district;
        this.device.lat = data.lat;
        this.device.lng = data.lng;
        this.$modal.msgSuccess("修改成功!");
      });
    },
    // 大地图上的引导按钮：直接打开「位置」字段的设置弹窗，而不是让用户自己找入口
    openLocationSelector() {
      const refs = this.$refs.locationInfo && this.$refs.locationInfo.$refs['map_location'];
      const comp = Array.isArray(refs) ? refs[0] : refs;
      if (comp && comp.handleSelect) {
        comp.handleSelect();
      }
    }
  }
};
</script>
<style lang="scss" scoped>

::v-deep .el-col {
  height: 75px;
}

// 地图上方的位置信息区：压缩高度与间距，给地图腾出空间
.location-info {
  ::v-deep.table-show {
    margin-bottom: 8px;
  }
  ::v-deep .table-show__item {
    padding: 4px 10px;
    min-height: 28px;
  }
  ::v-deep .table-show__label {
    min-width: 56px;
    font-size: 12px;
  }
  ::v-deep .table-show__value {
    font-size: 13px;
  }
}

.amap-wrapper {
  width: 100%;
  margin: 4px 0px 0px 0px;
  border: 1px solid silver;
  position: relative;
}

.amap-empty-tip {
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid #e6a23c;
  border-radius: 6px;
  font-size: 13px;
  color: #e6a23c;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>
