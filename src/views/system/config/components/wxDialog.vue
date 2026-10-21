<template>
  <div>
    <el-form-item label="AppID" prop="AppID">
      <el-input v-model="wechat.appid" placeholder="请输入应用ID" />
    </el-form-item>
    <el-form-item label="AppSecret" prop="AppSecret">
      <el-input v-model="wechat.secret" placeholder="请输入应用密钥" />
    </el-form-item>
    <el-form-item label="微信通知模板" prop="notice_template_id">
      <el-tooltip class="item" effect="dark" content="登录通知模板。" placement="bottom">
        <el-input v-model="wechat.notice_tpl_id" placeholder="请输入模板ID" suffix-icon="el-icon-question"/>
      </el-tooltip>
    </el-form-item>
    <el-form-item label="微信告警模板" prop="alert_tpl_id">
      <el-tooltip class="item" effect="dark" content="微信告警模板。" placement="bottom">
        <el-input v-model="wechat.alert_tpl_id" placeholder="请输入模板ID" suffix-icon="el-icon-question"/>
      </el-tooltip>
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
      wechat : {}
    };
  },
  created() {
    if(this.form.configValue !== undefined && this.form.configValue !== ''){
      const wechat = JSON.parse(this.form.configValue);
      if(wechat){
        this.wechat = wechat;
      }
    }
  },
  methods: {
    submitForm: function() {
      this.form.configValue = JSON.stringify(this.wechat);
      this.$emit('submit')
    }
  }
};
</script>
<style lang="scss" scoped>

</style>
