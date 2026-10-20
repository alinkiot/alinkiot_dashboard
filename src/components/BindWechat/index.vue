<template>
  <div style="text-align: center;">
    <div v-loading="loading">
        <h4>使用手机微信扫一扫</h4>
        <el-image class="wxImg" @click="reload" :src="url" fit="fill">
            <div slot="error" style="margin-top: 80px;">
              <i style="color: #ccc;">已过期，请重新刷新</i>
            </div>
        </el-image>
    </div>
    <h4>长时间没有反应可以点刷新？
      <el-button type="text" @click="reload" icon="el-icon-refresh">刷新</el-button>
      <el-button type="text" style="color: red;" @click="back" icon="el-icon-close">关闭</el-button>
    </h4>
  </div>
</template>
<script>
import {wxQr, wxVerify} from "@/api/iot/wx";

export default {
  name: 'bindWechat',
  props: {},
  data() {
    return {
      loading: false,
      url: undefined,
      ticket: undefined,
      sceneId: undefined,
      timer: undefined,
    };
  },
  created() {
    this.reload();
  },
  destroyed() {
    this.back();
  },
  methods: {
    back() {
      if(this.timer){
        clearInterval(this.timer);
      }
      this.$emit('onclose');
    },
    reload() {
      this.loading = true;
      wxQr().then(response => {
        this.sceneId = response.data.sceneId;
        this.ticket = response.data.ticket;
        this.url = 'https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=' + this.ticket;
        this.loading = false;
        this.checkWx();
      })
    },
    checkWx() {
      const that = this;
      if(this.timer){
        clearInterval(that.timer);
      }
      this.timer = setInterval(function (){
        wxVerify(that.sceneId).then(response => {
          console.log(response);
          if(response.data.expired){
            that.url = undefined;
            clearInterval(that.timer);
          } else if(response.data.verified){
             clearInterval(that.timer);
             that.$emit("bindDone", response.data);
          }
        })
      }, 2000)
    }
  }
};
</script>
<style lang="scss" scoped>
.wxImg {
  width: 200px;
  height: 200px;
  border: 1px solid silver;

  img {
    width: 100%;
    height: 100%;
  }
}

</style>
