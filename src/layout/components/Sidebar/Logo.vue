<template>
  <div class="sidebar-logo-container" :class="{'collapse':collapse}" :style="{ backgroundColor: getStyle('menuBackground') }">
    <transition name="sidebarLogoFade">
      <router-link v-if="collapse" key="collapse" class="sidebar-logo-link" to="#">
        <el-image v-if="site.logo" :src="site.logo" class="sidebar-logo"/>
        <el-image v-else :src="defLogo" class="sidebar-logo"/>
        <h1 class="sidebar-title" :style="{ color: getStyle('logoTitleColor') }">
          <span :style="{  'font-size': titleSize + 'px'  }">{{ title }}</span>
        </h1>
      </router-link>
      <router-link v-else key="expand" class="sidebar-logo-link" to="#">
        <el-image v-if="site.logo" :src="site.logo" class="sidebar-logo"/>
        <el-image v-else :src="defLogo" class="sidebar-logo"/>
        <h1 class="sidebar-title" :style="{ color: getStyle('logoTitleColor') }">
          <span :style="{  'font-size': titleSize + 'px'  }">{{ title }}</span>
        </h1>
      </router-link>
    </transition>
  </div>
</template>

<script>
import logoImg from '@/assets/logo/logo.png'
import variables from '@/assets/styles/variables.scss'
import {mapState} from "vuex";


export default {
  name: 'SidebarLogo',
  components:{},
  props: {
    collapse: {
      type: Boolean,
      required: true
    }
  },
  computed: {
    ...mapState(["settings"]),
    site() {
      const site = this.$store.state.settings.siteInfo
      return site ? site : {}
    },
    title() {
      const siteInfo = this.getSite().siteInfo;
      if(siteInfo && siteInfo.site_title){
        return siteInfo.site_title
      }else{
        return process.env.VUE_APP_TITLE
      }
    },
    titleSize() {
      const site = this.getSite();
      return site.titleSize ? site.titleSize : 17;
    },
    variables() {
      return variables;
    },
    sideTheme() {
      return this.$store.state.settings.sideTheme
    }
  },
  data() {
    return {
      // title: process.env.VUE_APP_TITLE,
      defLogo: logoImg
    }
  },
  methods:{
    getSite() {
      const site = this.$store.state.settings;
      return site ? site : {}
    },
    getStyle(key){
      let css = this.settings.sideTheme ? this.settings.sideTheme + '-' + key : key;
      return variables[css] ? variables[css] : variables[key];
    }
  }
}
</script>

<style lang="scss" scoped>
.sidebarLogoFade-enter-active {
  transition: opacity 1.5s;
}

.sidebarLogoFade-enter,
.sidebarLogoFade-leave-to {
  opacity: 0;
}

.sidebar-logo-container {
  position: relative;
  width: 100%;
  height: 52px;
  line-height: 52px;
  background: #2b2f3a;
  overflow: hidden;
  padding-left: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);

  & .sidebar-logo-link {
    height: 100%;
    width: 100%;

    & .sidebar-logo {
      width: 28px;
      height: 28px;
      vertical-align: middle;
    }

    & .sidebar-title {
      display: inline-block;
      margin: 0;
      color: #1d1d1f;
      font-weight: 600;
      line-height: 52px;
      font-size: 17px;
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display',
        'Helvetica Neue', 'PingFang SC', sans-serif;
      vertical-align: middle;
      letter-spacing: -0.022em;
    }
  }

  &.collapse {
    .sidebar-logo {
      margin-right: 0px;
    }
  }
}
</style>
