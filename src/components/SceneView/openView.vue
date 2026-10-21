<template>
  <div>
    <i-frame :src="url"/>
    <MqttBoard  @doMqttMessage="doMqttMessage" :subscription="subscription" :publish="publish"/>
  </div>
</template>
<script>
import MqttBoard from "@/components/MqttBoard";
import iFrame from "@/components/iFrame/index.vue";
import {getObject} from "@/api/iot/table";

export default {
  name: "SceneOpen",
  components: {
    iFrame,
    MqttBoard
  },
  props: {
    width: {
      type : Number,
      default : 300
    },
    height: {
      type : Number,
      default: 300
    }
  },
  data() {
    return {
      id: undefined,
      token: undefined,
      url: '',
      subscription:{ },
      publish: { }
    };
  },
  created() {
    this.id = this.$route.query.id;
    this.token = this.$route.query.token;
    this.url = "/view/viewer.html?token=" + this.token + '&w=' + this.width + '&h=' + this.height;
    this.getScene();
  },
  methods: {
    getScene() {
      getObject('scene', this.id).then(response => {
        this.scene = response.data;
        window.addEventListener('message', (e) => {
          if (e.data.from === 'scene' && e.data.event === 'done') {
            this.sendMessage({ event: 'update', view: this.scene.view, callback: e.data.callback })
          }
        });
        this.sendData();
      })
    },
    sendData() {
      const self = this;
      setInterval(function (){
        self.sendMessage({ event: 'update_data', data: 'ping'})
      }, 5000)
    },
    sendMessage(message) {
      const myFrame = document.getElementById('myFrame');
      message.from = 'iot';
      myFrame.contentWindow.postMessage(
          message,
          '*'
      )
    },
    doMqttMessage(topic, message){
      const decoder = new TextDecoder("utf-8");
      const data = JSON.parse(decoder.decode(message));
    }
  }
};
</script>

<style lang="scss" scoped>

</style>
