<template>
  <div>
    <el-form-item label="AppID" prop="AppID">
      <el-input v-model="sms.appid" placeholder="请输入应用ID" />
    </el-form-item>
    <el-form-item label="AppKey" prop="AppKey">
      <el-input v-model="sms.appkey" placeholder="请输入应用密钥" />
    </el-form-item>
    <el-form-item label="签名" prop="Sign">
      <el-input v-model="sms.sign" placeholder="请输入签名" />
    </el-form-item>
    <el-form-item label="验证码模板ID" prop="verify_tpl_id">
      <el-tooltip class="item" effect="dark" content="模板内容：您的验证码为{1}，请于{2}分钟内填写，如非本人操作，请忽略本短信。" placement="bottom">
        <el-input v-model="sms.verify_tpl_id" placeholder="请输入模板ID" suffix-icon="el-icon-question"/>
      </el-tooltip>
    </el-form-item>
    <el-form-item label="告警模板ID" prop="alert_tpl_id">
      <el-tooltip class="item" effect="dark" content="模板内容：您的设备{1}出现故障,故障等级:{2},设备状态:{3},位置:{4}。" placement="bottom">
        <el-input v-model="sms.alert_tpl_id" placeholder="请输入模板ID" suffix-icon="el-icon-question"/>
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
      sms : {}
    };
  },
  created() {
    if(this.form.configValue!== undefined && this.form.configValue !== ''){
      const sms = JSON.parse(this.form.configValue);
      if(sms){
        this.sms = sms;
      }
    }
  },
  methods: {
    submitForm: function() {
      this.form.configValue = JSON.stringify(this.sms);
      this.$emit('submit')
    }
  }
};
</script>
<style lang="scss" scoped>

</style>
