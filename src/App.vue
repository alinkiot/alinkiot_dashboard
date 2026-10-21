<template>
  <div id="app">
    <router-view v-if="isRouterAlive" />
  </div>
</template>

<script>
const THEME_CLASSES = ['theme-light', 'theme-dark', 'theme-dark-blue', 'theme-blue', 'theme-green']

// Element UI 初始化时会把 background-color 作为内联样式写到 table 容器上，
// 内联 style 优先级高于任何外部 CSS（即使加了 !important），只有更晚注入的
// <style> + !important 才能覆盖。每次切主题时重写这个 style 标签即可，不需要刷新。
//
// 所有主题都需要处理：深色主题用自身背景色，亮色主题也需要显式覆盖（防止残留）。
const TABLE_BG = {
  'theme-light':     '#ffffff',
  'theme-blue':      '#ffffff',
  'theme-dark':      '#1d1d1f',
  'theme-dark-blue': '#0C1535',
  'theme-green':     '#121e15'
}
// 亮色主题表头用稍深一点的背景，与 Element UI 默认保持一致
const TABLE_HEADER_BG = {
  'theme-light':     '#f5f7fa',
  'theme-blue':      '#f5f7fa',
  'theme-dark':      '#1d1d1f',
  'theme-dark-blue': '#0C1535',
  'theme-green':     '#121e15'
}

function buildTableStyle(theme) {
  const bg = TABLE_BG[theme]
  const headerBg = TABLE_HEADER_BG[theme]
  if (!bg) return ''
  return `
    .${theme} .el-table,
    .${theme} .el-table__header-wrapper,
    .${theme} .el-table__body-wrapper,
    .${theme} .el-table__footer-wrapper,
    .${theme} .el-table__fixed,
    .${theme} .el-table__fixed-right,
    .${theme} .el-table__fixed .el-table__fixed-body-wrapper,
    .${theme} .el-table__fixed-right .el-table__fixed-body-wrapper {
      background-color: ${bg} !important;
    }
    .${theme} .el-table th.el-table__cell {
      background-color: ${headerBg} !important;
    }
  `
}

export default  {
    name:  'App',
    provide() {
      return {
        reload: this.reload
      }
    },
    data() {
      return {
        isRouterAlive: true
      }
    },
    computed: {
      sideTheme() {
        return this.$store.state.settings.sideTheme
      }
    },
    watch: {
      sideTheme: {
        immediate: true,
        handler(val) {
          this.applyThemeClass(val)
          this.applyDarkTableStyle(val)
        }
      }
    },
    methods: {
      // 同步 body 的主题类名：先移除所有已知主题类，再加当前主题类，
      // 避免切主题后旧类残留，导致表格行背景等依赖 body class 的样式不刷新
      applyThemeClass(val) {
        const body = document.body
        THEME_CLASSES.forEach(c => body.classList.remove(c))
        if (val) {
          body.classList.add(val)
        }
      },
      // 动态注入/更新覆盖表格内联背景色的 <style> 标签。
      // Element UI 初始化时会把 background-color 作为内联样式写到 table 容器上，
      // 普通 CSS（即使 !important）无法覆盖内联样式，必须用同样晚注入的 <style> + !important。
      // 所有主题都注入：深色用深色背景，亮色显式写白色，防止从深色切回来时残留。
      applyDarkTableStyle(val) {
        const id = '__dark-table-override__'
        let el = document.getElementById(id)
        if (!el) {
          el = document.createElement('style')
          el.id = id
          document.head.appendChild(el)
        }
        el.textContent = buildTableStyle(val)
      },
      reload() {
        this.isRouterAlive = false;
        this.$nextTick(function() {
          this.isRouterAlive = true;
        });
      }
    },
    metaInfo() {
        return {
            title: this.$store.state.settings.dynamicTitle && this.$store.state.settings.title,
            titleTemplate: title => {
                const site_title = this.$store.state.settings.siteInfo && this.$store.state.settings.siteInfo.site_title;
                const site = site_title ? site_title : process.env.VUE_APP_TITLE
                return title ? `${title} - ${site}` : site
            }
        }
    }
}
</script>
