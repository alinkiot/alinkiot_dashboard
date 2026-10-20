<template>
  <div :class="'register ' + sideTheme" :style="bgCss">
    <theme-picker style="visibility: hidden; width: 0px;" />
    <el-form ref="registerForm" :style="'background-color:'+bgColor+';color:'+hdColor" :model="registerForm" :rules="registerRules" class="register-form" v-loading="loadInfo">
      <div style="margin-bottom: 10px;">
        <div style="width: 20%; display: inline-block;">
          <el-image v-if="logo" :src="logo" class="logo-img">
            <el-image  slot="error" :src="defLogo" class="logo-img"/>
          </el-image>
        </div>
        <div class="title">{{title}}</div>
      </div>
      <el-button type="text" class="reg-title">用户注册</el-button>
      <el-form-item prop="username">
        <el-input v-model="registerForm.username" type="text" auto-complete="off" placeholder="账号">
          <svg-icon slot="prefix" icon-class="user" class="el-input__icon input-icon" />
        </el-input>
      </el-form-item>
      <el-form-item prop="password">
        <el-input
          v-model="registerForm.password"
          type="password"
          auto-complete="off"
          :show-password="true"
          placeholder="密码"
          @keyup.enter.native="handleRegister"
        >
          <svg-icon slot="prefix" icon-class="password" class="el-input__icon input-icon" />
        </el-input>
      </el-form-item>
      <el-form-item prop="confirmPassword">
        <el-input
          v-model="registerForm.confirmPassword"
          type="password"
          auto-complete="off"
          placeholder="确认密码"
          @keyup.enter.native="handleRegister"
        >
          <svg-icon slot="prefix" icon-class="password" class="el-input__icon input-icon" />
        </el-input>
      </el-form-item>
      <el-form-item prop="code" v-if="captchaEnabled">
        <el-input
          v-model="registerForm.code"
          auto-complete="off"
          placeholder="验证码"
          style="width: 63%"
          @keyup.enter.native="handleRegister"
        >
          <svg-icon slot="prefix" icon-class="validCode" class="el-input__icon input-icon" />
        </el-input>
        <div class="register-code">
          <img :src="codeUrl" @click="getSiteInfo" class="register-code-img"/>
        </div>
      </el-form-item>
      <el-form-item style="width:100%;">
        <el-button
          :loading="loading"
          size="medium"
          type="primary"
          style="width:100%;"
          @click.native.prevent="handleRegister"
        >
          <span v-if="!loading">注 册</span>
          <span v-else>注 册 中...</span>
        </el-button>
        <div style="float: right;margin-top: 10px">
          <el-button type="text" @click="goLogin({})">返回登录</el-button>
        </div>
      </el-form-item>
    </el-form>
    <!--  底部  -->
    <div class="el-register-footer">
      <span>{{copyright}}</span>
    </div>
  </div>
</template>

<script>
import { register } from "@/api/login";
import ThemePicker from "@/components/ThemePicker/index.vue";


export default {
  name: "Register",
  components: {ThemePicker},
  computed: {
    theme() {
      return this.$store.state.settings.theme;
    },
    sideTheme() {
      return this.$store.state.settings.sideTheme;
    },
    bgColor() {
      return this.$store.state.settings.headerBgColor;
    },
    hdColor() {
      return this.$store.state.settings.rightToolbarColor;
    }
  },
  data() {
    const equalToPassword = (rule, value, callback) => {
      if (this.registerForm.password !== value) {
        callback(new Error("两次输入的密码不一致"));
      } else {
        callback();
      }
    };
    return {
      title : process.env.VUE_APP_TITLE,
      defLogo: require("@/assets/logo/logo.png"),
      logo : undefined,
      bgCss : '',
      codeUrl: "",
      registerForm: {
        username: "",
        password: "",
        confirmPassword: "",
        code: "",
        uuid: ""
      },
      registerRules: {
        username: [
          { required: true, trigger: "blur", message: "请输入您的账号" },
          { min: 2, max: 20, message: '用户账号长度必须介于 2 和 20 之间', trigger: 'blur' }
        ],
        password: [
          { required: true, trigger: "blur", message: "请输入您的密码" },
          { min: 5, max: 20, message: '用户密码长度必须介于 5 和 20 之间', trigger: 'blur' }
        ],
        confirmPassword: [
          { required: true, trigger: "blur", message: "请再次输入您的密码" },
          { required: true, validator: equalToPassword, trigger: "blur" }
        ],
        code: [{ required: true, trigger: "change", message: "请输入验证码" }]
      },
      loadInfo: false,
      loading: false,
      copyright: '',
      captchaEnabled: true
    };
  },
  created() {
    this.getSiteInfo();
  },
  methods: {
    goLogin(query) {
      let path = '/login';
      if(this.$route.params.project){
        path = '/' + this.$route.params.project + '/login';
      }
      this.$router.push({
        path: path,
        query: query
      });
    },
    async getSiteInfo() {
      this.loadInfo = true;
      const project = this.$route.params.project;
      const data = await this.$store.dispatch("settings/SiteInfo", project);
      const bgPath = (data.background && data.background !== '') ? data.background : '/images/bg.jpg';
      this.bgCss = "backgroundImage: linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('" + bgPath + "'); background-color: #000;"
      this.logo = data.logo ? data.logo : this.defLogo;
      this.title = data['site_title'] ? data['site_title'] : process.env.VUE_APP_TITLE;
      this.copyright = data.copyright;
      this.captchaEnabled = data.captchaEnabled;
      if (this.captchaEnabled) {
        this.codeUrl = "data:image/gif;base64," + data.img;
        this.registerForm.uuid = data.uuid;
      }
      this.loadInfo = false;
    },
    handleRegister() {
      this.$refs.registerForm.validate(valid => {
        if (valid) {
          this.loading = true;
          register(this.registerForm).then(res => {
            const query = this.$route.query;
            const username = this.registerForm.username;
            this.$alert("<font color='red'>恭喜你，您的账号 " + username + " 注册成功！</font>", '系统提示', {
              dangerouslyUseHTMLString: true,
              type: 'success'
            }).then(() => {
              this.goLogin(query);
            }).catch(() => {});
          }).catch(() => {
            this.loading = false;
            if (this.captchaEnabled) {
              this.getSiteInfo();
            }
          })
        }
      });
    }
  }
};
</script>

<style rel="stylesheet/scss" lang="scss">
.logo-img{
  width: 60px;
  vertical-align: middle;
}
.register {
  background-color: #000000;
  background-position: center center;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  background-size: cover;
}
.title {
  display: inline-block;
  font-size: 32px;
  font-weight: 600;
  vertical-align: middle;
  letter-spacing: -0.025em;
  color: inherit;
}

.register-form {
  border-radius: 16px;
  background: rgba(29, 29, 31, 0.85);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  padding: 48px 44px 24px 44px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 5px 30px rgba(0, 0, 0, 0.5);
  animation: fadeSlideUp 0.6s cubic-bezier(0.23, 1, 0.32, 1) both;
  .el-input {
    height: 48px;
    input {
      height: 48px;
      background: rgba(255, 255, 255, 0.06);
      border-color: rgba(255, 255, 255, 0.1);
      color: #f5f5f7;
      border-radius: 10px;
      transition: border-color 0.3s, box-shadow 0.3s;
      &:focus {
        border-color: #2997ff;
        animation: glowPulse 2s ease-in-out infinite;
      }
      &::placeholder {
        color: rgba(255, 255, 255, 0.35);
      }
    }
  }
  .input-icon {
    height: 48px;
    width: 14px;
    margin-left: 2px;
    color: rgba(255, 255, 255, 0.55);
  }
  .el-button--primary {
    height: 48px;
    border-radius: 10px;
    font-size: 16px;
    font-weight: 500;
    letter-spacing: -0.01em;
    background: linear-gradient(90deg, #0071e3 0%, #0071e3 40%, #38a3ff 50%, #0071e3 60%, #0071e3 100%);
    background-size: 200% 100%;
    border-color: #0071e3;
    transition: background-position 0.3s;
    &:hover {
      animation: shimmer 2s linear infinite;
      background-color: #0077ed;
    }
  }
  .reg-title {
    color: #2997ff;
    font-size: 17px;
    font-weight: 600;
    letter-spacing: -0.022em;
  }
}

@media screen and (min-width: 768px) {
  .register-form {
    width: 460px;
  }
}

@keyframes fadeSlideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes glowPulse {
  0%, 100% {
    box-shadow: 0 0 0 3px rgba(41, 151, 255, 0.15);
  }
  50% {
    box-shadow: 0 0 0 5px rgba(41, 151, 255, 0.25), 0 0 20px rgba(41, 151, 255, 0.1);
  }
}

@keyframes shimmer {
  0% {
    background-position: -200% center;
  }
  100% {
    background-position: 200% center;
  }
}

.register-tip {
  font-size: 13px;
  text-align: center;
  color: rgba(255, 255, 255, 0.35);
}
.register-code {
  width: 33%;
  height: 48px;
  float: right;
  img {
    cursor: pointer;
    vertical-align: middle;
  }
}
.el-register-footer {
  height: 40px;
  line-height: 40px;
  position: fixed;
  bottom: 0;
  width: 100%;
  text-align: center;
  color: rgba(255, 255, 255, 0.35);
  font-size: 12px;
  letter-spacing: 0.01em;
}
.register-code-img {
  height: 38px;
}

.register.theme-light,
.register.theme-blue {
  .register-form {
    border-color: rgba(0, 0, 0, 0.08);
    box-shadow: 0 5px 30px rgba(0, 0, 0, 0.15);
    .el-input input {
      background: rgba(0, 0, 0, 0.03);
      border-color: rgba(0, 0, 0, 0.1);
      color: #1d1d1f;
      &:focus {
        border-color: #0071e3;
      }
      &::placeholder {
        color: rgba(0, 0, 0, 0.35);
      }
    }
    .input-icon {
      color: rgba(0, 0, 0, 0.45);
    }
  }
  .el-register-footer {
    color: rgba(255, 255, 255, 0.55);
  }
}

</style>
