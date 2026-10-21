<template>
  <div>
    <div id="video-container"/>
    <el-row class="thingBox" :style="style">
      <el-col :span="12" v-for="thing in things" :key="thing.name" :id="'box_' + thing.name">
        <div class="thing_name">
          <div :id="thing.name" class="thing_value">--</div>
        </div>
        <div :id="'update_' + thing.name" class="update_time" v-if="thing.name==='alarmType'"/>
      </el-col>
    </el-row>
  </div>
</template>
<script>

var player = null;
import EZUIKit from 'ezuikit-js';
import { getCameraLive } from '@/api/iot/table'
import { getValue } from "@/assets/js/iot"
import dayjs from 'dayjs'


export default {
  components: {  },
  props: {
    device: {
      type: Object
    },
    data: {
      type: Object
    },
    env: {
      type: Object,
      default: function (){ return {} }
    }
  },
  data() {
    return {
      things: [],
      width: 600,
      height: 400,
      style: ''
    };
  },
  mounted() {
    let data = { addr: this.device.addr };
    getCameraLive(data).then(response => {
      const data = response.data;
      data.config = JSON.parse(data.config);
      this.createEZPlayer('video-container', this.width, this.height, data );
    });
  },
  created() {
    this.things = this.device.product.thing;
    if(this.env.width){
      this.width = this.env.width;
      this.height = this.env.width * 4 / 6;
    }
    this.style = 'width: '+ this.width +'px;';
  },
  methods: {
    createEZPlayer(id, width, height, data) {
      const device_serial = data.config.filter(item => { return item.name === 'device_serial' })
      player = new EZUIKit.EZUIKitPlayer({
        id: id,
        accessToken: data.accessToken,
        url: "ezopen://open.ys7.com/" + device_serial[0].value  + "/1.hd.live",
        // simple - 极简版; pcLive-pc直播；pcRec-pc回放；mobileLive-移动端直播；mobileRec-移动端回放;security - 安防版;voice-语音版;
        template: 'security',
        audio: 0,
        width: width,
        height: height
      });
    },
    formatTitle(name, value) {
      if(name === 'alarmType'){
        switch (value) {
          case 'motiondetect': return '<i class="el-icon-message-solid"></i>移动侦测';
          default: return value
        }
      } else if(name === 'pictureList'){
        const arr =  JSON.parse(value);
        let html = '';
        arr.map(item => {
          html += '<img style="width: 100%; padding:5px;" src="' + item + '"/>';
        });
        return html;
      } else{
        return value;
      }
    },
    reload() {
      this.things.map(item => {
        const data = getValue(this.data, item.name, '--');
        const valueBox = document.getElementById(item.name);
        if(data.value || data.value === 0){
          valueBox.innerHTML = this.formatTitle(item.name, data.value);
        }
        const timerBox = document.getElementById('update_' + item.name);
        if(timerBox){
          timerBox.innerText = dayjs(data.ts * 1000).format('YYYY-MM-DD HH:mm:ss');
        }
      })
    }
  },
  watch: {
    device() {
      this.things = this.device.product.thing;
    },
    data() {
      this.reload();
    }
  }
};
</script>
<style lang="scss" scoped>

.thingBox {
  margin-top: 4px;
  background-color: #ebebeb;
  border-radius: 10px;
}

.thing_name, .update_time {
  padding: 10px;
}

.update_time{
  font-size: 15px;
  padding-top: 0px;
  color: blue;
}

.thing_name {
  font-size: 20px;
  font-weight: bolder;
  color: #e8589b;
}

</style>
