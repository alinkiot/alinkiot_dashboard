<template>
  <div>
    <MqttBoard  @doMqttMessage="doMqttMessage" :subscription="subscription" :publish="publish"/>
    <DevicePannel
      :recvData="recvData"
      :devId = "devId"
      :env="env"
      :protocol="protocol"
      :showImport="showImport"
      @onload="onLoad"
      @send="doSend"
    />
  </div>
</template>
<script>

import MqttBoard from "@/components/MqttBoard/index.vue";
import DevicePannel from "../boards/devicePannel.vue"


export default {
  components: {
    MqttBoard,
    DevicePannel
  },
  props: {
    devId: {
      type: [String, Number]
    },
    env: {
      type: Object,
      default: function (){ return {} }
    },
    showImport: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      device : undefined,
      product : undefined,
      subscription:{ },
      publish: { },
      recvData: undefined,
      protocol:'',
    };
  },
  created() {
  },
  methods: {
    // 按数据类型转换下发值：integer→整数, float→浮点, string/hex→原样字符串
    convertValue(value, format) {
      if (format === 'integer') {
        const n = parseInt(value, 10);
        return isNaN(n) ? value : n;
      }
      if (format === 'float') {
        const n = parseFloat(value);
        return isNaN(n) ? value : n;
      }
      // string / hex / 未指定：原样带回去
      return value;
    },
    doSend(name, value, format) {
      const data = {
        type: "write",
        addr : this.device.addr,
        name : name,
        value : this.convertValue(value, format)
      };
      if (format) {
        data.format = format;
      }
      const msg = {
        msgType : "control_device",
        data: data
      };
      this.publish = {
        topic: 'p/in',
        qos: 0,
        payload: JSON.stringify(msg)
      }
      this.$modal.msgSuccess("发送成功!");
    },
    onLoad(device) {
     console.log('this.device',device)
      this.device = device;
      this.$emit("deviceChange", this.device);
      this.product = device.product;
      this.protocol = this.product.protocol
      this.subscription = {
        topic: 'p/out/' + device.addr,
        qos: 0
      };
    },
    doMqttMessage(topic, message){
      const data = JSON.parse(message);
      this.recvData = data;
    }
  }
};
</script>
<style lang="scss" scoped>


</style>
