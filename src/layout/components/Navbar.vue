<template>
  <div class="navbar">
    <hamburger id="hamburger-container" :is-active="sidebar.opened" class="hamburger-container" @toggleClick="toggleSideBar" />

    <breadcrumb id="breadcrumb-container" class="breadcrumb-container" v-if="!topNav"/>
    <top-nav id="topmenu-container" class="topmenu-container" v-if="topNav"/>

    <div class="right-menu">
      <template v-if="device!=='mobile'">
        <search id="header-search" class="right-menu-item" />
        <el-tooltip content="文档地址" effect="dark" placement="bottom" v-if="site.site_help">
          <div class="right-menu-item hover-effect">
            <svg-icon icon-class="question" @click="gotoDoc(site.site_help)" />
          </div>
        </el-tooltip>
        <screenfull id="screenfull" class="right-menu-item hover-effect" />
      </template>
      <MsgBox id="header-msgbox" class="right-menu-item" />
      <el-dropdown content="主题切换" class="right-menu-item hover-effect" trigger="click">
        <div style="font-size: 25px;">
          <i class="el-icon-loading" style="color: goldenrod" v-if="changeThemeLoading"/>
          <i class="el-icon-sunny" v-else/>
        </div>
        <el-dropdown-menu slot="dropdown">
          <el-dropdown-item
            v-for="theme in site.layout_setting" :key="theme.id"
            @click.native="changeTheme(theme)">
            <div style="display: inline-block; width: 20px;">
              <el-button type="text" v-if="theme.id===currTheme">
                <i class="el-icon-view"/>
              </el-button>
            </div>
            <span>{{theme.name}}</span>
          </el-dropdown-item>
          <el-dropdown-item @click.native="changeTheme('default')">
            <div style="display: inline-block; width: 20px;">
              <i class="el-icon-refresh-left"></i>
            </div>
            恢复默认
          </el-dropdown-item>
        </el-dropdown-menu>
        <theme-picker style="visibility: hidden; width: 0px;" />
      </el-dropdown>
      <el-dropdown class="avatar-container right-menu-item hover-effect" trigger="click">
        <div class="avatar-wrapper">
          <el-image fit="cover" :src="avatar" class="user-avatar">
            <el-image slot="error" fit="cover" :src="defAvatar" class="user-avatar" />
          </el-image>
          <i class="el-icon-caret-bottom" />
        </div>
        <el-dropdown-menu slot="dropdown">
          <el-dropdown-item @click.native="goProfile">个人中心</el-dropdown-item>
          <el-dropdown-item divided @click.native="logout">
            <span>退出登录</span>
          </el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import Breadcrumb from '@/components/Breadcrumb'
import TopNav from '@/components/TopNav'
import Hamburger from '@/components/Hamburger'
import Screenfull from '@/components/Screenfull'
import Search from '@/components/HeaderSearch'
import MsgBox from '@/components/HeaderMsgBox'
import ThemePicker from "@/components/ThemePicker/index.vue";

export default {
  components: {
    ThemePicker,
    Breadcrumb,
    TopNav,
    Hamburger,
    Screenfull,
    MsgBox,
    Search,
  },
  computed: {
    ...mapGetters([
      'sidebar',
      'avatar',
      'device'
    ]),
    site() {
      const site = this.$store.state.settings.siteInfo
      return site ? site : {}
    },
    currTheme() {
      return this.$store.state.settings.currentTheme;
    },
    setting: {
      get() {
        return this.$store.state.settings.showSettings
      },
      set(val) {
        this.$store.dispatch('settings/changeSetting', {
          key: 'showSettings',
          value: val
        })
      }
    },
    topNav: {
      get() {
        return this.$store.state.settings.topNav
      }
    }
  },
  data() {
    return {
      defAvatar : require("@/assets/images/profile.png"),
      changeThemeLoading: false
    }
  },
  created() {
  },
  methods: {
    changeTheme(theme) {
      this.changeThemeLoading = true;
      if(theme ==='default'){
        this.$modal.loading("正在清除设置缓存并刷新，请稍候...");
        this.$cache.local.remove("layout-setting");
        setTimeout("window.location.reload()", 1000)
      }else{
        this.$modal.loading("正在切换主题，请稍候...");
        for(let key in theme){
          const value = theme[key]
          if(key === 'topNav' && !value){
            this.$store.dispatch('app/toggleSideBarHide', false);
            this.$store.commit("SET_SIDEBAR_ROUTERS", this.$store.state.permission.defaultRoutes);
          }
        }
        const that = this;
        setTimeout(()=>{
          // 只 dispatch store，body class 由 App.vue 的 sideTheme watch 统一维护，
          // 不要在这里直接赋值 body.className，否则会绕过 App.vue 的动态样式注入逻辑
          that.$store.dispatch('settings/changeTheme', theme);
          that.changeThemeLoading = false
          that.$modal.closeLoading()
        }, 500)
      }
    },
    gotoDoc(url) {
      window.open(url)
    },
    toggleSideBar() {
      this.$store.dispatch('app/toggleSideBar')
    },
    goProfile() {
      this.$router.push({
        path : this.getPath("/userCenter/profile")
      });
    },
    getPath(path) {
      if(this.$route.params.project){
        return '/' + this.$route.params.project +  path
      }
      return path;
    },
    async logout() {
      this.$confirm('确定注销并退出系统吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.$store.dispatch('LogOut').then(() => {
          location.href = this.getPath('/login');
        })
      }).catch(() => {});
    }
  }
}
</script>

<style lang="scss" scoped>


::v-deep .el-dropdown{
  color: unset;
}

// Dark theme navbar adjustments
.theme-dark,
.theme-dark-blue,
.theme-blue,
.theme-green {
  .navbar {
    border-bottom-color: rgba(255, 255, 255, 0.06);
    .hamburger-container:hover {
      background: rgba(255, 255, 255, 0.06);
    }
    .right-menu-item {
      color: rgba(255, 255, 255, 0.55);
      &.hover-effect:hover {
        background: rgba(255, 255, 255, 0.06);
      }
    }
    .avatar-container .avatar-wrapper .el-icon-caret-bottom {
      color: rgba(255, 255, 255, 0.35);
    }
  }
}

// 科技蓝顶栏渐变背景
.theme-blue {
  .navbar {
    background: linear-gradient(90deg, #0a2a5e 0%, #124a8f 50%, #0a2a5e 100%);
    border-bottom: 1px solid rgba(64, 158, 255, 0.25);
    box-shadow: 0 2px 12px rgba(10, 42, 94, 0.4);

    // 汉堡菜单图标
    .hamburger-container {
      color: rgba(255, 255, 255, 0.85);
      &:hover {
        background: rgba(64, 158, 255, 0.18);
      }
    }

    // 右侧按钮组
    .right-menu {
      .right-menu-item {
        color: rgba(255, 255, 255, 0.85);
        transition: color 0.2s ease, background 0.2s ease;
        .svg-icon {
          fill: currentColor;
        }
        &.hover-effect:hover {
          color: #7fc4ff;
          background: rgba(64, 158, 255, 0.18);
        }
      }
      .avatar-container .avatar-wrapper .el-icon-caret-bottom {
        color: rgba(255, 255, 255, 0.6);
      }
    }
  }
}

.navbar {
  height: 52px;
  overflow: hidden;
  position: relative;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);

  .hamburger-container {
    line-height: 48px;
    height: 100%;
    float: left;
    cursor: pointer;
    transition: background .2s ease;
    -webkit-tap-highlight-color:transparent;

    &:hover {
      background: rgba(0, 0, 0, .03)
    }
  }

  .breadcrumb-container {
    float: left;
  }

  .topmenu-container {
    position: absolute;
    left: 50px;
  }

  .errLog-container {
    display: inline-block;
    vertical-align: top;
  }

  .right-menu {
    float: right;
    height: 100%;
    line-height: 52px;

    &:focus {
      outline: none;
    }

    .right-menu-item {
      display: inline-block;
      padding: 0 12px;
      height: 100%;
      font-size: 17px;
      vertical-align: text-bottom;
      color: #6e6e73;

      &.hover-effect {
        cursor: pointer;
        transition: background .2s ease;

        &:hover {
          background: rgba(0, 0, 0, .03)
        }
      }
    }

    .avatar-container {
      margin-right: 24px;

      .avatar-wrapper {
        margin-top: 6px;
        position: relative;

        .user-avatar {
          cursor: pointer;
          width: 32px;
          height: 32px;
          border-radius: 50%;
        }

        .el-icon-caret-bottom {
          cursor: pointer;
          position: absolute;
          right: -16px;
          top: 18px;
          font-size: 12px;
          color: #86868b;
        }
      }
    }
  }
}
</style>
