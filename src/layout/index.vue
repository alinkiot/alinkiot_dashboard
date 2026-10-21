<template>
  <div :class="classObj" class="app-wrapper" :style="{'--current-color': theme}">
    <div v-if="device==='mobile'&&sidebar.opened" class="drawer-bg" @click="handleClickOutside" />
    <sidebar v-if="!sidebar.hide" class="sidebar-container" />
    <div :class="{hasTagsView:needTagsView,sidebarHide:sidebar.hide}" class="main-container">
      <div :class="{'fixed-header':fixedHeader}" :style="'background-color:'+ headerBgColor + ';color:' + rightToolbarColor + ';'">
        <navbar />
        <tags-view v-if="needTagsView" />
      </div>
      <app-main :style="'background-color:'+ bodyBgColor + ';'" />
      <right-panel>
        <settings />
      </right-panel>
    </div>
  </div>
</template>

<script>
import RightPanel from '@/components/RightPanel'
import { AppMain, Navbar, Settings, Sidebar, TagsView } from './components'
import ResizeMixin from './mixin/ResizeHandler'
import { mapState } from 'vuex'
import variables from '@/assets/styles/variables.scss'

export default {
  name: 'Layout',
  components: {
    AppMain,
    Navbar,
    RightPanel,
    Settings,
    Sidebar,
    TagsView
  },
  mixins: [ResizeMixin],
  computed: {
    ...mapState({
      theme: state => state.settings.theme,
      sidebarWidth: state => state.settings.sidebarWidth,
      titleSize: state => state.settings.titleSize,
      headerBgColor: state => state.settings.headerBgColor,
      rightToolbarColor: state => state.settings.rightToolbarColor,
      bodyBgColor: state => state.settings.bodyBgColor,
      sideTheme: state => state.settings.sideTheme,
      sidebar: state => state.app.sidebar,
      device: state => state.app.device,
      needTagsView: state => state.settings.tagsView,
      fixedHeader: state => state.settings.fixedHeader
    }),
    marginLeft() {
      if (this.sidebar.hide) {
        return '0px'
      } else {
        return this.sidebarWidth + 'px'
      }
    },
    classObj() {
      return {
        hideSidebar: !this.sidebar.opened,
        openSidebar: this.sidebar.opened,
        withoutAnimation: this.sidebar.withoutAnimation,
        mobile: this.device === 'mobile'
      }
    },
    variables() {
      return variables
    }
  },
  created() {
    this.getSiteInfo()
  },
  methods: {
    getStyle(key) {
      const css = this.sideTheme ? this.sideTheme + '-' + key : key
      return variables[css] ? variables[css] : variables[key]
    },
    async getSiteInfo() {
      const project = this.$route.params.project
      await this.$store.dispatch('settings/SiteInfo', project)
      const body = document.getElementsByTagName('body')[0]
      body.className = this.sideTheme
    },
    handleClickOutside() {
      this.$store.dispatch('app/closeSideBar', { withoutAnimation: false })
    }
  }
}
</script>

<style lang="scss" scoped>
  @import "~@/assets/styles/mixin.scss";
  @import "~@/assets/styles/variables.scss";

  .app-wrapper {
    @include clearfix;
    position: relative;
    height: 100%;
    width: 100%;

    &.mobile.openSidebar {
      position: fixed;
      top: 0;
    }
  }

  // Dark theme header frosted glass — distinct per theme
  .theme-dark .fixed-header {
    background: rgba(29, 29, 31, 0.72) !important;
    border-bottom-color: rgba(255, 255, 255, 0.06);
  }
  .theme-dark-blue .fixed-header {
    background: rgba(17, 29, 66, 0.72) !important;
    border-bottom-color: rgba(66, 103, 196, 0.12);
  }
  .theme-green .fixed-header {
    background: rgba(18, 32, 22, 0.72) !important;
    border-bottom-color: rgba(52, 199, 89, 0.08);
  }

  .drawer-bg {
    background: #000;
    opacity: 0.4;
    width: 100%;
    top: 0;
    height: 100%;
    position: absolute;
    z-index: 999;
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
  }

  .fixed-header {
    position: fixed;
    top: 0;
    right: 0;
    z-index: 9;
    width: calc(100% - #{$sidebar-width});
    transition: width 0.28s;
    backdrop-filter: saturate(180%) blur(20px);
    -webkit-backdrop-filter: saturate(180%) blur(20px);
    background: rgba(251, 251, 253, 0.72);
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  }

  .hideSidebar .fixed-header {
    width: calc(100% - 56px);
  }

  .sidebarHide .fixed-header {
    width: 100%;
  }

  .mobile .fixed-header {
    width: 100%;
  }
</style>

<style lang="scss">
// App-wrapper background per theme (non-scoped, body class is outside component)
.theme-light .app-wrapper { background-color: #f5f5f7; }
.theme-dark .app-wrapper { background-color: #1d1d1f; }
.theme-dark-blue .app-wrapper { background-color: #0C1535; }
.theme-blue .app-wrapper { background-color: #f5f5f7; }
.theme-green .app-wrapper { background-color: #121e15; }
</style>
