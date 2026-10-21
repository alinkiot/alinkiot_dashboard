<template>
  <div>
    <el-form-item :label="form.configName" prop="configValue">
      <ImageUpload :limit=1 @input="handleFile" :value="form.configValue" />
    </el-form-item>
    <div style="text-align: right;">
      <el-button type="primary" @click="submitForm">保存</el-button>
    </div>
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
      this.form.configValue = path;
    },
    submitForm: function() {
      this.form.configName = ''
      this.$emit('submit')
    }
  }
};
</script>
<style lang="scss" scoped>

.pre-img {
  width: 40%;
  padding-left: 10px;
}

</style>
