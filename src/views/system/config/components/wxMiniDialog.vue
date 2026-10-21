<template>
  <div>
    <el-form-item label="AppID" prop="appid">
      <el-input v-model="wxMini.appid" placeholder="请输入应用ID" />
    </el-form-item>
    <el-form-item label="AppSecret" prop="app_secret">
      <el-input v-model="wxMini.app_secret" placeholder="请输入应用密钥" />
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
      wxMini : {}
    };
  },
  created() {
    if(this.form.configValue !== undefined && this.form.configValue !== ''){
      const wxMini = JSON.parse(this.form.configValue);
      if(wxMini){
        this.wxMini = wxMini;
      }
    }
  },
  methods: {
    submitForm: function() {
      this.form.configValue = JSON.stringify(this.wxMini);
      this.$emit('submit')
    }
  }
};
</script>
<style lang="scss" scoped>

</style>
