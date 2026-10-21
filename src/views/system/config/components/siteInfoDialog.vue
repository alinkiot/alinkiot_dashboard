<template>
  <div>
    <el-form-item label="站点名称:" prop="title">
      <el-input v-model="site.site_title" placeholder="请输入站点名称" />
    </el-form-item>
    <el-form-item label="Logo:" prop="logo">
      <ImageUpload :limit=1 @input="handleLogoFile" :value="site.logo" />
    </el-form-item>
    <el-form-item label="设为默认:" prop="isDefault">
      <el-switch
        v-model="site.isDefault"
        active-color="#34c759"
        inactive-color="#ff3b30">
      </el-switch>
    </el-form-item>
    <el-form-item label="开启注册:" prop="isRegister">
      <el-switch
        v-model="site.isRegister"
        active-color="#34c759"
        inactive-color="#ff3b30">
      </el-switch>
    </el-form-item>
    <el-form-item label="开启验证码:" prop="captchaEnabled">
      <el-switch
        v-model="site.captchaEnabled"
        active-color="#34c759"
        inactive-color="#ff3b30">
      </el-switch>
    </el-form-item>
    <el-form-item label="登录方式:" prop="loginTypes">
      <el-select v-model="site.loginTypes" multiple style="width: 100%;" clearable>
        <el-option
          v-for="item in options"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
    </el-form-item>
    <el-form-item label="背景图:" prop="background">
      <ImageUpload :limit=1 @input="handleFile" :value="site.background" />
    </el-form-item>
    <InputTableSelect
      label="默认主题"
      showColumn="configName"
      :queryId="site.theme"
      :queryParams="query"
      table="config"
      @selectDone="selectThemeDone"
      prop="theme"
    />
    <el-form-item label="版权信息:" prop="copyright">
      <el-input v-model="site.copyright" placeholder="请输入版权信息" />
    </el-form-item>
    <el-form-item label="帮助链接:" prop="site_help">
      <el-input v-model="site.site_help" placeholder="请输入帮助链接" />
    </el-form-item>
    <div style="text-align: right;">
      <el-button type="primary" @click="submitForm">保存</el-button>
    </div>
  </div>
</template>
<script>

import InputTableSelect from "@/components/InputTableSelect/index.vue";

export default {
  components: {InputTableSelect},
  props: {
    form: {
      type: Object,
      require: true
    },
    project: {
      type: Object,
      default: function() { return {} }
    }
  },
  data() {
    return {
      query: {
        configKey : 'layout_setting',
        project: this.project.name
      },
      options : [
        { label : "帐号登录", value : "username_login"},
        { label : "手机号登录", value : "phone_login"},
        { label : "微信登录", value : "wechat_login"}
      ],
      site :{
        loginTypes : [
          'username_login'
        ],
        isDefault: false,
        isRegister: false,
        captchaEnabled: false,
        copyright: '',
        background: ''
      }
    };
  },
  created() {
    if(this.form.configValue!== undefined && this.form.configValue !== ''){
      const options = JSON.parse(this.form.configValue);
      if(options){
        this.site = options;
      }
    }
  },
  methods: {
    selectThemeDone(config) {
      console.log(config);
      this.site.theme = config.configId
    },
    handleLogoFile(path){
      this.site.logo = path;
    },
    handleFile(path){
      this.site.background = path;
    },
    submitForm: function() {
      this.form.configValue = JSON.stringify(this.site);
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
