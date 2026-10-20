<template>
  <div class="app-container">
    <h3 class="title-dev">组态：{{scene.title}}</h3>
    <i-frame :src="url" />
  </div>
</template>
<script>
import iFrame from "@/components/iFrame/index.vue";
import InputTableSelect from "@/components/InputTableSelect/index.vue"
import { getObject, updateObject} from "@/api/iot/table";

export default {
  name: "ViewEdit",
  dicts: [],
  components: { iFrame, InputTableSelect },
  data() {
    return {
      url: '/view/',
      scene: {},
      things: [],
      loading: false,
      bindDev: false,
      bindThing: false,
      message: undefined, // 组态发过来的消息
      device: undefined,
      view: undefined
    };
  },
  created() {
    this.url = this.url + "index.html";
    this.loadPage();
  },
  methods: {
    deviceClick(device) {
      this.currentDev = true;
    },
    loadPage() {
      const id = this.$route.query.id;
      if (id) {
        this.loading = true;
        getObject('scene', id).then(response => {
          this.scene = response.data;
          this.addEventListener();
        });
      } else{
        this.scene = undefined;
        this.addEventListener()
        this.open = true;
      }
    },
    addEventListener() {
      window.addEventListener("message", (e) => {
        this.message = e.data;
        if(this.message.from === 'scene'){
          if(this.message.event === 'done'){
            this.sceneDone(this.message);
            this.loading = false;
          } else if(this.message.event ==='bind'){
            this.deviceBind();
          } else if(this.message.event === 'publish'){
            this.view = this.message.view;
            if(this.scene && this.scene.id){
              this.saveScene(this.view);
            }else{
              this.open = true;
            }
          } else if(this.message.event ==='preview'){
            if(this.scene && this.scene.id){
              this.saveScene(this.message.view);
              this.openView();
            }else{
              this.open = true;
            }
          }
        }
      });
    },
    // 将 view 发给 scene
    sceneDone(data) {
      if(this.scene && this.scene.view){
        this.sendMsg({ event : 'update', view: this.scene.view, callback: data.callback });
      }
    },
    sendMsg(msg) {
      const message = msg;
      message.from = 'iot';
      const myFrame = document.getElementById('myFrame');
      myFrame.contentWindow.postMessage(
          message,
          '*'
      );
    },
    deviceBind(){
      this.bindDev = true;
      this.device = undefined;
    },
    saveScene(view) {
      const data = {
        id: this.scene.id,
        view: view
      };
      updateObject('scene', data).then(response => {
        this.scene.view = view;
        this.$modal.msgSuccess("更新成功");
      });
    },
    openView() {
      const query = {id: this.scene.id, token: this.scene.token};
      const routeData =
          this.$router.resolve({
            path: '/scene/monitor',
            query: query
          });
      window.open(routeData.href, '_blank');
    }
  }
};
</script>

<style lang="scss" scoped>

</style>
