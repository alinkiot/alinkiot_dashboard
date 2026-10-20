<template>
  <i-frame :src="url" />
</template>
<script>

import iFrame from "@/components/iFrame/index.vue";

export default {
  name: "Index",
  components: { iFrame },
  data() {
    return {
      url:''
    };
  },
  created(){
  }
};
</script>
