<template>
  <div>
    <el-form-item label="Key" prop="key">
      <el-input v-model="map.key" placeholder="请输入高德地图key" />
    </el-form-item>
    <el-form-item label="安全密钥" prop="securityJsCode">
      <el-input v-model="map.securityJsCode" placeholder="请输入安全密钥" />
    </el-form-item>
    <div style="text-align: right;">
      <el-button type="primary" @click="submitForm">保存</el-button>
    </div>
  </div>
</template>
<script>

export default {
  components: {},
  props: {
    form: {
      type: Object,
      require: true
    }
  },
  data() {
    return {
      map : {}
    };
  },
  created() {
    if(this.form.configValue !== undefined && this.form.configValue !== ''){
      const map = JSON.parse(this.form.configValue);
      if(map){
        this.map = map;
      }
    }
  },
  methods: {
    submitForm: function() {
      this.form.configValue = JSON.stringify(this.map);
      this.$emit('submit')
    }
  }
};
</script>
<style lang="scss" scoped>

</style>
