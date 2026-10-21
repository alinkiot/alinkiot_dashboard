<template>
  <div>
    <el-form-item label="选择文件" prop="dictValue">
      <FileUpload :limit=1 @input="handleFile" :value="form.dictValue" />
    </el-form-item>
  </div>
</template>
<script>

import FileUpload from "@/components/FileUpload/index.vue";

export default {
  components: { FileUpload },
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
