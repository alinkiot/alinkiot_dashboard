<template>
  <div :class="'login ' + sideTheme" :style="rootCss">
      <theme-picker style="visibility: hidden; width: 0px;" />
      <div class="login-page" v-loading="loadInfo" :style="'color:'+hdColor">
        <div class="login-head">
          <el-image v-if="logo" :src="logo" class="logo-img">
            <el-image slot="error" :src="defLogo" class="logo-img"/>
          </el-image>
          <div class="title">{{title}}</div>
        </div>
        <div v-if="isWxLogin && wxLoginBox">
          <el-divider></el-divider>
          <bindWechat @bindDone="bindWxDone" @onclose="stopWechat"/>
        </div>
        <el-tabs v-model="activeName" v-else>
          <el-tab-pane v-for="item in loginTypes" :key="item"
                       :label="item ==='username_login'?'帐号登录':'手机登录'"
                       :name="item" v-if="item!=='wechat_login'">
            <el-form ref="loginForm" :model="loginForm" :rules="loginRules" class="login-form" v-if="item==='username_login'">
              <el-form-item prop="username">
                <el-input
                  v-model="loginForm.username"
                  type="text"
                  auto-complete="off"
                  placeholder="请输入账号"
                >
                  <svg-icon slot="prefix" icon-class="user" class="el-input__icon input-icon" />
                </el-input>
              </el-form-item>
              <el-form-item prop="password">
                <el-input
                  v-model="loginForm.password"
                  type="password"
                  auto-complete="off"
                  placeholder="请输入密码"
                  :show-password="true"
                  @keyup.enter.native="handleLogin"
                >
                  <svg-icon slot="prefix" icon-class="password" class="el-input__icon input-icon" />
                </el-input>
              </el-form-item>
              <el-form-item prop="code" v-if="captchaEnabled">
                <el-input
                  v-model="loginForm.code"
                  auto-complete="off"
                  placeholder="验证码"
                  style="width: 63%"
                  @keyup.enter.native="handleLogin"
                >
                  <svg-icon slot="prefix" icon-class="validCode" class="el-input__icon input-icon" />
                </el-input>
                <div class="login-code">
                  <img :src="codeUrl" @click="getSiteInfo" class="login-code-img"/>
                </div>
              </el-form-item>
              <el-checkbox v-model="loginForm.rememberMe" style="margin:0px 0px 25px 0px;">记住密码</el-checkbox>
              <el-form-item style="width:100%;">
                <el-button
                  :loading="loading"
                  size="medium"
                  type="primary"
                  style="width:100%;"
                  @click.native.prevent="handleLogin"
                >
                  <span v-if="!loading">登 录</span>
                  <span v-else>登 录 中...</span>
                </el-button>
              </el-form-item>
            </el-form>
            <el-form ref="loginPhoneForm" :model="loginPhoneForm" :rules="loginPhoneRules" class="login-form" v-if="item ==='phone_login'">
              <el-form-item prop="phone">
                <el-input
                  v-model="loginPhoneForm.phone"
                  type="text"
                  prefix-icon="el-icon-mobile"
                  auto-complete="off"
                  placeholder="请输入手机号"
                >
                </el-input>
              </el-form-item>
              <el-form-item prop="verifyCode">
                <el-input
                  v-model="loginPhoneForm.verifyCode"
                  type="text"
                  auto-complete="off"
                  placeholder="请输入验证码"
                  prefix-icon="el-icon-message"
                  @keyup.enter.native="handlePhoneLogin"
                >
                  <el-button slot="append" @click="getPhoneCode">{{phoneCodeTitle}}</el-button>
                </el-input>
              </el-form-item>
              <el-form-item style="width:100%;">
                <el-button
                  :loading="loading"
                  size="medium"
                  type="primary"
                  style="width:100%;"
                  @click.native.prevent="handlePhoneLogin"
                >
                  <span v-if="!loading">登 录</span>
                  <span v-else>登 录 中...</span>
                </el-button>
              </el-form-item>
            </el-form>
          </el-tab-pane>
        </el-tabs>
        <el-row style="float: right;" v-if="!wxLoginBox">
          <el-button v-if="isWxLogin" type="text" class="go-btn" @click="openWxLogin">微信登录</el-button>
          <el-button v-if="isRegister" type="text" class="go-btn" @click="openRegister({})">立即注册</el-button>
        </el-row>
      </div>
    <!--  底部  -->
    <div class="el-login-footer">
      <span>{{copyright}}</span>
    </div>
  </div>
</template>

<script>
import Cookies from "js-cookie";
import { encrypt, decrypt } from '@/utils/jsencrypt'
import bindWechat from "@/components/BindWechat";
import { wxBind } from "@/api/iot/wx";
import { get_phoneCode } from '@/api/iot/system'
import { updateUserProfile } from '@/api/system/user'
import ThemePicker from "@/components/ThemePicker/index.vue";
import { ensureContrastWithWhite, mixWithWhite, toRgba } from '@/utils/contrast'

export default {
  name: "Login",
  components:{ThemePicker, bindWechat },
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
    },
    rootCss() {
      // 把当前主题的配色注入为 CSS 变量，供表单/卡片/输入框渲染使用
      const accent = this.theme || '#0071e3'
      // 主按钮 / 激活 Tab / 焦点环都是「填充色承载白字」，主题色过亮时压暗到达标
      const accentStrong = ensureContrastWithWhite(accent)
      const panel = this.bgColor || '#1d1d1f'      // 主题面板色（卡片背景）
      const text = this.hdColor || '#f5f5f7'       // 主题前景色（文字）
      // 登录卡片恒为深色底：聚焦描边要用提亮版主题色，压暗版会糊进背景
      const accentFocus = mixWithWhite(accent, 0.35)
      return this.bgCss +
        ';--login-accent:' + accentStrong +
        ';--current-color:' + accent +
        ';--current-color-strong:' + accentStrong +
        ';--current-color-focus:' + accentFocus +
        ';--current-color-ring:' + toRgba(accentFocus, 0.26) +
        ';--login-panel:' + panel +
        ';--login-text:' + text + ';'
    }
  },
  data() {
    return {
      title : process.env.VUE_APP_TITLE,
      defLogo: require("@/assets/logo/logo.png"),
      logo : undefined,
      bgCss : '',
      phoneCodeTitle: '获取验证码',
      timer: null,
      activeName: "",
      codeUrl: "",
      wxLoginBox: false,
      loginForm: {
        username: "",
        password: "",
        rememberMe: false,
        code: "",
        uuid: ""
      },
      loginPhoneForm: {
        phone: "",
        verifyCode: ""
      },
      loginRules: {
        username: [{ required: true, trigger: "blur", message: "请输入您的账号" }],
        password: [{ required: true, trigger: "blur", message: "请输入您的密码" }],
        code: [{ required: true, trigger: "change", message: "请输入验证码" }]
      },
      loginPhoneRules: {
        phone: [{ required: true, trigger: "blur", message: "请输入您的手机号码" }],
        verifyCode: [{ required: true, trigger: "change", message: "请输入验证码" }]
      },
      loadInfo: false,
      loading: false,
      // 验证码开关
      captchaEnabled: true,
      // 注册开关
      isRegister: false,
      isWxLogin: false,
      copyright: '',
      redirect: undefined,
      loginTypes: []
    };
  },
  watch: {
    $route: {
      handler: function(route) {
        this.redirect = route.query && route.query.redirect;
      },
      immediate: true
    }
  },
  created() {
    this.$cache.local.remove("layout-setting");
    this.getSiteInfo();
    this.getCookie();
  },
  methods: {
    stopWechat() {
      this.wxLoginBox = false;
    },
    async getSiteInfo() {
      this.loadInfo = true;
      const project = this.$route.params.project;
      const data = await this.$store.dispatch("settings/SiteInfo", project);
      this.loadInfo = false;
      const bgPath = (data.background && data.background !== '') ? data.background : '/images/bg.jpg';
      this.bgCss = "backgroundImage: linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('" + bgPath + "'); background-color: #000;"
      this.loginTypes = data.loginTypes ? data.loginTypes : ['username_login'];
      this.activeName = this.loginTypes[0];
      this.captchaEnabled = data.captchaEnabled;
      this.isRegister = data.isRegister;
      this.logo = data.logo ? data.logo : this.defLogo;
      this.title = data['site_title'] ? data['site_title'] : process.env.VUE_APP_TITLE;
      this.copyright = data.copyright;
      this.isWxLogin = this.loginTypes.includes('wechat_login');
      if (this.captchaEnabled) {
        this.codeUrl = "data:image/gif;base64," + data.img;
        this.loginForm.uuid = data.uuid;
      }

    },
    goNext() {
      let index = '/';
      if (this.$route.params.project) {
        index = '/' + this.$route.params.project + '/index';
      }
      const path = this.redirect || index;
      this.$router.push({path: path}).catch(() => {
      });
    },
    getPhoneCode() {
      if(this.loginPhoneForm.phone.length > 0 && ! this.timer){
        get_phoneCode(this.loginPhoneForm.phone).then(res => {
          this.$notify({
            title: '成功',
            message: '验证码已经发送到您手机，请查收！',
            type: 'success'
          })
          let seconds = res.data.expire ? res.data.expire : 1 * 60;
          const that = this;
          this.timer = setInterval(function(){
            seconds = seconds - 1;
            if(seconds === 0){
              clearInterval(that.timer);
              that.phoneCodeTitle = "获取验证码";
              that.timer = null;
            }else {
              that.phoneCodeTitle = "等待(" + seconds + "秒)";
            }
          }, 1000);
        })
      }
    },
    getCookie() {
      const username = Cookies.get("username");
      const password = Cookies.get("password");
      const rememberMe = Cookies.get('rememberMe')
      this.loginForm = {
        username: username === undefined ? this.loginForm.username : username,
        password: password === undefined ? this.loginForm.password : decrypt(password),
        rememberMe: rememberMe === undefined ? false : Boolean(rememberMe)
      };
    },
    handleLogin() {
      this.$refs.loginForm[0].validate(valid => {
        if (valid) {
          this.loading = true;
          if (this.loginForm.rememberMe) {
            Cookies.set("username", this.loginForm.username, { expires: 30 });
            Cookies.set("password", encrypt(this.loginForm.password), { expires: 30 });
            Cookies.set('rememberMe', this.loginForm.rememberMe, { expires: 30 });
          } else {
            Cookies.remove("username");
            Cookies.remove("password");
            Cookies.remove('rememberMe');
          }
          this.$store.dispatch("Login", this.loginForm).then(() => {
            const query = this.$route.query;
            if(query.wechatSession){
              wxBind(query.wechatSession).then(res => {
                this.$modal.msgSuccess("微信绑定成功！");
                this.goNext();
              });
            }else if (query.phone){
              updateUserProfile({phonenumber : query.phone}).then(res => {
                this.$modal.msgSuccess(query.phone +" 绑定成功！");
                this.goNext();
              });
            } else{
              this.goNext();
            }
          }).catch(() => {
            this.loading = false;
            if (this.captchaEnabled) {
              this.getSiteInfo();
            }
          });
        }
      });
    },
    handlePhoneLogin() {
      this.$refs.loginPhoneForm[0].validate(valid => {
        if (valid) {
          this.loading = true;
          this.$store.dispatch("PhoneLogin", this.loginPhoneForm).then((response) => {
            if(response.exists){
              this.goNext();
            }else{
              this.$modal.msgWarning("没有绑定的用户，正在前往注册页面！");
              const that = this;
              setTimeout(function(){
                that.openRegister({phone: that.loginPhoneForm.phone});
              }, 1000)
            }
          }).catch(() => {
            this.loginPhoneForm.verifyCode = '';
            this.loading = false;
          });
        }
      });
    },
    openWxLogin() {
      this.wxLoginBox = true;
    },
    openRegister(query) {
      let path = '/register';
      if(this.$route.params.project){
        path = '/' + this.$route.params.project + '/register';
      }
      this.$router.push({
        path: path,
        query: query
      });
    },
    bindWxDone(data) {
      this.wxLoginBox = false;
      this.loading = true;
      this.$store.dispatch("WxLogin", data.wechatSession).then(response => {
        if(response.exists){
          this.goNext();
        }else{
          this.$modal.msgWarning("没有绑定的用户，请先注册！");
          this.openRegister({ wechatSession : data.wechatSession });
        }
      }).catch(() => {
        this.loading = false;
      });
    }
  }
};
</script>

<style rel="stylesheet/scss" lang="scss">

.logo-img{
  width: 40px;
  height: 40px;
  object-fit: contain;
  flex: 0 0 auto;
}
.login {
  background-color: #000000;
  background-position: center center;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  background-size: cover;
}

// 品牌区：logo 与标题基线对齐，替代原先 20% / 80% 的硬分栏
.login-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.title {
  font-size: 26px;
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: -0.02em;
  color: inherit;
}

.login-page {
  border-radius: 16px;
  background: color-mix(in srgb, var(--login-panel, #1d1d1f) 85%, transparent);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  padding: 48px 44px 24px 44px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 5px 30px rgba(0, 0, 0, 0.5);
  animation: fadeSlideUp 0.6s cubic-bezier(0.23, 1, 0.32, 1) both;
}

@media screen and (min-width: 768px) {
  .login-page {
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

.login-form {
  .el-input {
    height: 48px;
    input {
      height: 48px;
      background: color-mix(in srgb, var(--login-accent, #ffffff) 10%, rgba(255, 255, 255, 0.04));
      border-color: color-mix(in srgb, var(--login-accent, #ffffff) 25%, rgba(255, 255, 255, 0.1));
      color: var(--login-text, #f5f5f7);
      border-radius: 10px;
      transition: border-color 0.3s, box-shadow 0.3s;
      &:focus {
        border-color: var(--current-color-focus, #2997ff);
        box-shadow: 0 0 0 3px var(--current-color-ring, rgba(41, 151, 255, 0.2));
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
  .el-checkbox__label {
    color: rgba(255, 255, 255, 0.55);
  }
  .el-button--primary {
    height: 48px;
    border-radius: 10px;
    font-size: 16px;
    font-weight: 500;
    letter-spacing: 0.02em;
    // 静止态用纯色 + 顶部微高光：原来的横向渐变在静止时就露出一道浅色光带，
    // 看起来像渲染错误的按钮
    background-color: var(--login-accent, #0071e3);
    background-image: linear-gradient(180deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0));
    border-color: var(--login-accent, #0071e3);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.18), 0 2px 8px rgba(0, 0, 0, 0.18);
    transition: filter .18s ease, box-shadow .18s ease, transform .12s ease;

    &:hover, &:focus {
      background-color: var(--login-accent, #0071e3);
      border-color: var(--login-accent, #0071e3);
      filter: brightness(1.07);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 4px 14px rgba(0, 0, 0, 0.24);
    }
    &:active {
      filter: brightness(0.95);
      transform: translateY(1px);
    }
  }
}

// 登录卡内的 Tab：默认样式是浅色主题配色，放在深色毛玻璃卡上几乎看不清
.login-page {
  .el-tabs__header {
    margin-bottom: 24px;
  }
  .el-tabs__nav-wrap::after {
    height: 1px;
    background-color: rgba(255, 255, 255, 0.1);
  }
  .el-tabs__item {
    height: 36px;
    line-height: 36px;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.5);

    &.is-active {
      color: var(--login-text, #f5f5f7);
      font-weight: 600;
    }
    &:hover {
      color: rgba(255, 255, 255, 0.78);
    }
  }
  .el-tabs__active-bar {
    height: 2px;
    border-radius: 1px;
    background-color: var(--login-accent, #0071e3);
  }
}
.login-tip {
  font-size: 13px;
  text-align: center;
  color: rgba(255, 255, 255, 0.35);
}
.login-code {
  width: 33%;
  height: 48px;
  float: right;
  img {
    cursor: pointer;
    vertical-align: middle;
    height: 48px;
    border-radius: 8px;
    object-fit: cover;
  }
}
.el-login-footer {
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
.login-code-img {
  height: 48px;
  border-radius: 8px;
}
.link-type{
  margin-left: 5px;
  font-size: 14px;
}

.go-btn {
  color: var(--login-accent, #2997ff);
  font-size: 13px;
}

.login.theme-light,
.login.theme-blue {
  .login-page {
    background: rgba(255, 255, 255, 0.9);
    border-color: rgba(0, 0, 0, 0.08);
    box-shadow: 0 5px 30px rgba(0, 0, 0, 0.15);
    // 浅底卡片强制深色文字，盖过内联的浅色 hdColor（标题继承此色）
    color: #1d1d1f !important;
  }
  .login-form {
    .el-input input {
      background: color-mix(in srgb, var(--login-accent, #0071e3) 6%, rgba(0, 0, 0, 0.02));
      border-color: color-mix(in srgb, var(--login-accent, #0071e3) 25%, rgba(0, 0, 0, 0.1));
      color: #1d1d1f;
      &:focus {
        border-color: var(--login-accent, #0071e3);
      }
      &::placeholder {
        color: rgba(0, 0, 0, 0.35);
      }
    }
    .input-icon {
      color: rgba(0, 0, 0, 0.45);
    }
    .el-checkbox__label {
      color: rgba(0, 0, 0, 0.55);
    }
  }
  .el-login-footer {
    color: rgba(255, 255, 255, 0.55);
  }

  // 浅底卡片上的 Tab 换回深色文字
  .el-tabs__nav-wrap::after {
    background-color: rgba(0, 0, 0, 0.08);
  }
  .el-tabs__item {
    color: rgba(0, 0, 0, 0.5);
    &.is-active {
      color: #1d1d1f;
    }
    &:hover {
      color: rgba(0, 0, 0, 0.75);
    }
  }
}

</style>
