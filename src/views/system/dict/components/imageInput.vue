<template>
  <FileInput :form="form" />
</template>
<script>
import FileInput from "./fileInput.vue";

export default {
  components: { FileInput },
  props: {
    form: { type: Object, required: true }
  }
};
</script>
