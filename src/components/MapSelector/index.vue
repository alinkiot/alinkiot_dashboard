<template>
  <span>
    <p v-if="!readonly">
      <template v-if= "!isEmpty">{{data.location}}</template>
      <template v-else>设置</template>
      <el-button type="text" @click="handleSelect">
        <i class="el-icon-edit el-icon--right"/>
      </el-button>
    </p>
    <p v-else-if="!isEmpty">
      {{location}}
      <el-button type="text" @click="handleSelect">
        <i class="el-icon-position el-icon--right"/>
      </el-button>
    </p>
    <el-tag type="info" v-else>未设置</el-tag>
    <el-dialog :title="readonly?'查看位置':'选择位置'" :visible.sync="openSelector" class="mapDialog" append-to-body>
      <el-input v-model="data.location" placeholder="请输入设备位置" v-if="!readonly">
          <el-button slot="append" type="primary" @click="selectDone">确定</el-button>
      </el-input>
      <div v-else-if="data.location !==''">
          <h3><i class="el-icon-position"/>{{data.location}}</h3>
      </div>
      <h3 v-else>未设置</h3>
      <div style="margin: 10px 0px 10px 0px;">
        <el-tag>纬度:{{ data.lat }}</el-tag><el-tag style="margin-left: 10px;">经度:{{ data.lng }}</el-tag>
      </div>
      <div class="amap-wrapper">
        <el-amap-search-box
            class="amap-search-box"
            :search-option="searchOption"
            :on-search-result="onSearchResult" v-if="!readonly"></el-amap-search-box>
        <el-amap
            vid="amapDev"
            v-loading="loading"
            :zoom="zoom"
            :map-style="styleName"
            :center="center"
            :plugin="plugins"
            :amap-manager="amapManager"
            :events="events">
        </el-amap>
      </div>
    </el-dialog>
  </span>
</template>

<script>
import { AMapManager } from "vue-amap";
import { mapInit } from "@/api/iot/system";
let amapManager = new AMapManager();
export default {
  components: {},
  props: {
    name: {
      type: String,
      default: undefined
    },
    location: {
      type: String,
      default: undefined
    },
    lat: {
      type: Number,
      default: undefined
    },
    lng: {
      type: Number,
      default: undefined
    },
    readonly: {
      type: Boolean,
      default: false
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
      loading: false,
      title:'',
      data: {
        location: undefined,
        lat: undefined,
        lng: undefined
      },
      isEmpty: true,
      amapManager,
      plugins: ['ToolBar', 'Autocomplete', 'OverView', 'Geocoder'],
      zoom: 15,
      center: [121.59996, 31.197646],
      openSelector: false,
      searchOption: {
        city: "",
        citylimit: false
      },
      events: {
        complete: (e) => {
          if(self.data.lat && self.data.lng){
            self.setMarker(self.data);
          }
        },
        click: (e) => {
            self.loading = true;
            self.data.lat = e.lnglat.lat;
            self.data.lng = e.lnglat.lng;
            self.setMarker(e.lnglat);
            let geocoder = new AMap.Geocoder({});
            geocoder.getAddress(e.lnglat, function (status, result) {
              self.loading = false;
              if (status === "complete" && result.regeocode) {
                self.data.country = result.regeocode.addressComponent.country;
                self.data.province = result.regeocode.addressComponent.province;
                self.data.district = result.regeocode.addressComponent.district;
                self.data.location = result.regeocode.formattedAddress;
                self.setEmpty();
              }
            });
        }
      }
    }
  },
  created() {
    this.data = {
      location: this.location,
      lng: this.lng,
      lat: this.lat
    };
    this.setEmpty();
    mapInit(this);
  },
  methods: {
    setEmpty() {
      this.isEmpty = this.data.location === undefined ||
        this.data.location === '';
    },
    setMarker(position) {
      position.Q = position.lat;
      position.R = position.lng;
      let map = amapManager.getMap();
      if(this.marker){
        map.remove(this.marker);
        map.setFitView();
      }
      this.marker = new AMap.Marker({
        map: map
      });
      this.center = [position.lng, position.lat];
      this.marker.setPosition(position);
    },
    selectDone() {
      const data = this.data;
      data.name = this.name;
      this.$emit("selectDone", data);
      this.openSelector = false;
    },
    handleSelect() {
      this.openSelector = true;
    },
    onSearchResult(points) {
      if (points.length > 0) {
        const point = points[0];
        this.center = [point.lng, point.lat];
        this.data.location = point.address;
        this.data.lat = point.lat;
        this.data.lng = point.lng;
      }
    }
  },
  watch: {
    readonly() {
      this.title = this.readonly ? '查看位置' : '选择位置';
    },
    location() {
      this.data = {
        location: this.location,
        lat: this.lat ? this.lat : '-',
        lng: this.lng ? this.lng : '-'
      };
      this.setEmpty();
    }
  }
};
</script>
<style lang="scss" scoped>

::v-deep p{
  margin: 0px;
}

::v-deep .el-dialog__body{
   padding: 0px 20px 20px;
}
.mapDialog {
  //width: 850px;
}
.amap-wrapper {
  width: 100%;
  height: 500px;
  border: 1px solid silver;
}

.amap-search-box {
  position: absolute;
  top: 145px;
  left: 100px;
  border: 1px solid silver;
}

</style>
