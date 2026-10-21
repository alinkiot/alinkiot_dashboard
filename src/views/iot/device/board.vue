<template>
  <div class="box">
    <el-row v-if="device" class="info-box">
      <el-col :span="6" style="text-align: center;" v-if="product && product.img">
        <ImagePreview style="width:80%;" :src="product.img"/>
      </el-col>
      <el-col :span="18">
        <el-row>
          <span class="title">设备名称：</span>
          <span class="value">{{device.name}}</span>
        </el-row>
        <el-row>
          <span class="title">设备地址：</span>
          <span class="value">{{device.addr}}</span>
        </el-row>
        <el-row>
          <span class="title">所属产品：</span>
          <span class="value">{{product.name}}</span>
        </el-row>
        <el-row>
          <div class="value" v-if="device.location">
            <span class="location">
              <i class="el-icon-position"></i>{{device.location}}
            </span>
          </div>
          <div class="value" v-else>
            <i class="el-icon-location"></i>暂无位置
          </div>
        </el-row>
      </el-col>
    </el-row>
    <DeviceBoard @deviceChange="deviceChange" :devId="devId" :env="env" />
  </div>
</template>

<script>

import {setToken} from '@/utils/auth'
import DeviceBoard from "./components/deviceBoard.vue";

export default {
  name: "board",
  dicts: [],
  components: {
    DeviceBoard
  },
  data() {
    return {
      devId: undefined,
      device: undefined,
      product: undefined,
      token: undefined,
      env: {
        width : document.body.clientWidth - 20
      }
    };
  },
  created() {
    document.title = '设备实时状态';
    this.devId = this.$route.query.devId;
    this.token = this.$route.query.token;
    if (this.token) {
      setToken(this.token);
    }
  },
  methods: {
    deviceChange(device) {
      this.device = device;
      this.product = device.product;
    }
  }
};
</script>
<style lang="scss" scoped>

.box {
  padding: 10px;
  background-color: #f4f4f4;
  height: 100%;
}

.info-box {
  border-radius: 5px;
  margin-bottom: 10px;
  padding: 10px;
  background-color: white;
}

.title, .value {
  padding-bottom: 3px;
  color: #606266;
}

.title {
  font-weight: bolder;
}

.value {
  font-size: 15px;
}

.location {
  font-weight: unset;
}

.location:hover {
  color: #606266;
}

</style>
