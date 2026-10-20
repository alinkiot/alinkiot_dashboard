<template>
  <div>
    <el-form-item label="选择相册" prop="dictValue">
      <ImageUpload :limit=1 @input="handleFile" :value="form.dictValue" />
    </el-form-item>
  </div>
</template>
<script>

import ImageUpload from "@/components/ImageUpload/index.vue";

export default {
  components: { ImageUpload },
  props: {
    form: {
      type: Object,
      require: true
    }
  },
  data() {
    return {

    };
  },
  created() {

  },
  methods: {
    handleFile(path){
      this.form.dictValue = path;
    }
  }
};
</script>
<style lang="scss" scoped>

</style>
