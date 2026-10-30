<template>
  <div class="swagger-frame">
    <i-frame :src="url" />
  </div>
</template>
<script>
import iFrame from "@/components/iFrame/index";
export default {
  name: "Swagger",
  components: { iFrame },
  data() {
    return {
      url: "/swagger-ui/index.html"
    };
  },
  created(){
    let url = process.env.VUE_APP_BASE_API;
    if(document.location.protocol === 'https:'){
      url = url.replace('http:', 'https:');
    }
    window.addEventListener("message", (e) => {
      const data = e.data;
      if(data.type === 'swagger' && data.event === 'done'){
        const message = {
          type : 'swagger',
          url : url + '/swagger/default.json'
        };
        const myFrame = document.getElementById('myFrame');
        myFrame.contentWindow.postMessage(message, "*");
      }
    });
  }
};
</script>

<style lang="scss" scoped>
// Swagger UI 是后端直出的第三方页面，不跟随前端主题。
// 与其硬改它的内部样式（升级即失效），不如把它当成"内嵌文档"：
// 白底 + 圆角 + 描边，让它读起来像一张嵌进来的 A4 纸，而不是"页面坏了"。
.swagger-frame {
  margin: 16px;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}
</style>
