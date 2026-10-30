<template>
  <el-color-picker
    v-model="theme"
    :predefine="['#0071e3', '#5856d6', '#34c759', '#ff9f0a', '#ff3b30', '#af52de', '#5ac8fa', '#1d1d1f']"
    class="theme-picker"
    popper-class="theme-picker-dropdown"
  />
</template>

<script>
// 主题换色只做一件事：把已编译进包里的主题 CSS 中的强调色替换成站点色。
// 这里刻意不再从 unpkg 拉取 element-ui 官方 theme-chalk：
//   1) 那份 CSS 是默认主题，注入后会把本项目 element-variables.scss 编译出的
//      圆角 / 字号 / 语义色全部覆盖回 Element 默认值（表现为危险按钮变回 #F56C6C、
//      圆角变回 3~4px、字号回到 12px）；
//   2) 它是一次 200KB 级的运行时 CDN 请求，弱网下首屏会出现一次“主题闪变”。
const ORIGINAL_THEME = '#0071e3' // Apple Blue

export default {
  data() {
    return {
      theme: '',
      // 记录当前样式表里实际存在的强调色，避免连续换色时找不到可替换的色值
      applied: ORIGINAL_THEME
    }
  },
  computed: {
    defaultTheme() {
      return this.$store.state.settings.theme
    }
  },
  watch: {
    defaultTheme: {
      handler: function(val, oldVal) {
        this.theme = val
      },
      immediate: true
    },
    async theme(val) {
      await this.setTheme(val)
    }
  },
  created() {
    if (this.defaultTheme !== ORIGINAL_THEME) {
      this.setTheme(this.defaultTheme)
    }
  },

  methods: {
    async setTheme(val) {
      if (typeof val !== 'string') return
      const oldVal = this.applied || ORIGINAL_THEME
      const themeCluster = this.getThemeCluster(val.replace('#', ''))
      const originalCluster = this.getThemeCluster(oldVal.replace('#', ''))

      const styles = [].slice.call(document.querySelectorAll('style'))
        .filter(style => {
          const text = style.innerText
          return text && new RegExp(oldVal, 'i').test(text) && !/Chalk Variables/.test(text)
        })
      styles.forEach(style => {
        const { innerText } = style
        if (typeof innerText !== 'string') return
        style.innerText = this.updateStyle(innerText, originalCluster, themeCluster)
      })

      this.applied = val
      this.$emit('change', val)
    },

    updateStyle(style, oldCluster, newCluster) {
      let newStyle = style
      oldCluster.forEach((color, index) => {
        newStyle = newStyle.replace(new RegExp(color, 'ig'), newCluster[index])
      })
      return newStyle
    },

    getThemeCluster(theme) {
      const tintColor = (color, tint) => {
        let red = parseInt(color.slice(0, 2), 16)
        let green = parseInt(color.slice(2, 4), 16)
        let blue = parseInt(color.slice(4, 6), 16)

        if (tint === 0) { // when primary color is in its rgb space
          return [red, green, blue].join(',')
        } else {
          red += Math.round(tint * (255 - red))
          green += Math.round(tint * (255 - green))
          blue += Math.round(tint * (255 - blue))

          red = red.toString(16)
          green = green.toString(16)
          blue = blue.toString(16)

          return `#${red}${green}${blue}`
        }
      }

      const shadeColor = (color, shade) => {
        let red = parseInt(color.slice(0, 2), 16)
        let green = parseInt(color.slice(2, 4), 16)
        let blue = parseInt(color.slice(4, 6), 16)

        red = Math.round((1 - shade) * red)
        green = Math.round((1 - shade) * green)
        blue = Math.round((1 - shade) * blue)

        red = red.toString(16)
        green = green.toString(16)
        blue = blue.toString(16)

        return `#${red}${green}${blue}`
      }

      const clusters = [theme]
      for (let i = 0; i <= 9; i++) {
        clusters.push(tintColor(theme, Number((i / 10).toFixed(2))))
      }
      clusters.push(shadeColor(theme, 0.1))
      return clusters
    }
  }
}
</script>

<style>
.theme-message,
.theme-picker-dropdown {
  z-index: 99999 !important;
}

.theme-picker .el-color-picker__trigger {
  height: 26px !important;
  width: 26px !important;
  padding: 2px;
}

.theme-picker-dropdown .el-color-dropdown__link-btn {
  display: none;
}
</style>
