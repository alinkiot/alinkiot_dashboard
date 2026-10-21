<template>
  <i-frame :src="url" />
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
