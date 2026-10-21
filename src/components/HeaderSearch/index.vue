<template>
  <div class="header-search">
    <i class="el-icon-s-promotion search-icon" :title="shortcutTitle" @click.stop="open" />

    <!-- Spotlight 风格聚焦搜索 -->
    <transition name="spotlight-fade">
      <div v-if="show" ref="mask" class="spotlight-mask" @click.self="close">
        <transition name="spotlight-pop">
          <div v-if="show" class="spotlight-panel" @click.stop>
            <!-- 右上角关闭按钮 -->
            <i class="el-icon-close spotlight-close" @click="close" />
            <!-- 输入框 -->
            <div class="spotlight-input-wrap">
              <svg-icon class-name="spotlight-input-icon" icon-class="search" />
              <input
                ref="input"
                v-model="search"
                class="spotlight-input"
                type="text"
                placeholder="搜索菜单…"
                @input="querySearch"
                @keydown.down.prevent="move(1)"
                @keydown.up.prevent="move(-1)"
                @keydown.enter.prevent="enter"
                @keydown.esc.prevent="close"
              >
            </div>

            <!-- 结果 / 快捷菜单盒子 -->
            <div class="spotlight-box">
              <div class="spotlight-box-title">
                {{ search ? '搜索结果' : '快捷菜单' }}
              </div>
              <div v-if="list.length" class="spotlight-grid">
                <div
                  v-for="(item, index) in list"
                  :key="item.path"
                  :class="{ active: index === activeIndex }"
                  class="spotlight-cell"
                  :title="item.title.join(' / ')"
                  @mouseenter="activeIndex = index"
                  @click="go(item)"
                >
                  <svg-icon v-if="item.icon" :icon-class="item.icon" class="spotlight-cell-icon" />
                  <i v-else class="el-icon-menu spotlight-cell-icon" />
                  <span class="spotlight-cell-title">{{ item.title[item.title.length - 1] }}</span>
                </div>
              </div>
              <div v-else class="spotlight-empty">未找到相关菜单</div>
            </div>
          </div>
        </transition>
      </div>
    </transition>
  </div>
</template>

<script>
// fuse is a lightweight fuzzy-search module
// make search results more in line with expectations
import Fuse from 'fuse.js/dist/fuse.min.js'
import path from 'path'

// 快捷菜单最多展示数量
const QUICK_LIMIT = 18
// 搜索结果最多展示数量
const RESULT_LIMIT = 24

export default {
  name: 'HeaderSearch',
  data() {
    return {
      search: '',
      options: [],
      searchPool: [],
      show: false,
      fuse: undefined,
      activeIndex: 0,
      isMac: /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent)
    }
  },
  computed: {
    routes() {
      return this.$store.getters.permission_routes
    },
    // 无输入时展示的快捷菜单
    quickList() {
      return this.searchPool.slice(0, QUICK_LIMIT)
    },
    // 当前展示的列表（搜索结果或快捷菜单）
    list() {
      if (this.search) {
        return this.options.slice(0, RESULT_LIMIT).map(o => o.item)
      }
      return this.quickList
    },
    shortcutTitle() {
      return (this.isMac ? '⌘' : 'Ctrl') + ' + K 快速搜索'
    }
  },
  watch: {
    routes() {
      this.searchPool = this.generateRoutes(this.routes)
    },
    searchPool(list) {
      this.initFuse(list)
    }
  },
  mounted() {
    this.searchPool = this.generateRoutes(this.routes)
    document.addEventListener('keydown', this.handleShortcut)
  },
  beforeDestroy() {
    document.removeEventListener('keydown', this.handleShortcut)
    // 若遮罩被移动到了 body 下，组件销毁时一并移除，避免残留节点
    if (this.$refs.mask && this.$refs.mask.parentNode) {
      this.$refs.mask.parentNode.removeChild(this.$refs.mask)
    }
  },
  methods: {
    // 全局快捷键：⌘K (Mac) / Ctrl+K (其它) 打开搜索，再次按下或 Esc 关闭
    handleShortcut(e) {
      const key = (e.key || '').toLowerCase()
      if ((e.metaKey || e.ctrlKey) && key === 'k') {
        e.preventDefault()
        this.show ? this.close() : this.open()
      }
    },
    open() {
      this.show = true
      this.search = ''
      this.options = []
      this.activeIndex = 0
      this.$nextTick(() => {
        // 将遮罩移动到 body 下，避免受导航栏 .fixed-header 的 backdrop-filter
        // 产生的新“包含块”影响，否则 position:fixed 只会相对该容器定位
        if (this.$refs.mask && this.$refs.mask.parentNode !== document.body) {
          document.body.appendChild(this.$refs.mask)
        }
        this.$refs.input && this.$refs.input.focus()
      })
    },
    close() {
      this.show = false
      this.search = ''
      this.options = []
      this.activeIndex = 0
    },
    querySearch() {
      const query = this.search
      if (query !== '' && this.fuse) {
        this.options = this.fuse.search(query)
      } else {
        this.options = []
      }
      this.activeIndex = 0
    },
    move(step) {
      const len = this.list.length
      if (!len) return
      this.activeIndex = (this.activeIndex + step + len) % len
    },
    enter() {
      const item = this.list[this.activeIndex]
      if (item) this.go(item)
    },
    go(item) {
      if (this.ishttp(item.path)) {
        const pindex = item.path.indexOf('http')
        window.open(item.path.substr(pindex, item.path.length), '_blank')
      } else {
        this.$router.push(item.path)
      }
      this.close()
    },
    initFuse(list) {
      this.fuse = new Fuse(list, {
        shouldSort: true,
        threshold: 0.4,
        location: 0,
        distance: 100,
        maxPatternLength: 32,
        minMatchCharLength: 1,
        keys: [{
          name: 'title',
          weight: 0.7
        }, {
          name: 'path',
          weight: 0.3
        }]
      })
    },
    // Filter out the routes that can be displayed in the sidebar
    // And generate the internationalized title
    generateRoutes(routes, basePath = '/', prefixTitle = []) {
      let res = []

      for (const router of routes) {
        // skip hidden router
        if (router.hidden) { continue }

        const data = {
          path: !this.ishttp(router.path) ? path.resolve(basePath, router.path) : router.path,
          title: [...prefixTitle],
          icon: (router.meta && router.meta.icon) || ''
        }

        if (router.meta && router.meta.title) {
          data.title = [...data.title, router.meta.title]

          if (router.redirect !== 'noRedirect') {
            // only push the routes with title
            // special case: need to exclude parent router without redirect
            res.push(data)
          }
        }

        // recursive child routes
        if (router.children) {
          const tempRoutes = this.generateRoutes(router.children, data.path, data.title)
          if (tempRoutes.length >= 1) {
            res = [...res, ...tempRoutes]
          }
        }
      }
      return res
    },
    ishttp(url) {
      return url.indexOf('http://') !== -1 || url.indexOf('https://') !== -1
    }
  }
}
</script>

<style lang="scss" scoped>
.header-search {
  font-size: 0 !important;

  .search-icon {
    cursor: pointer;
    font-size: 20px;
    vertical-align: middle;
    transition: opacity 0.2s ease, transform 0.1s ease;
    opacity: 0.85;

    &:hover {
      opacity: 1;
    }
    &:active {
      transform: translateY(1px);
    }
  }
}

.spotlight-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 3000;
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 15vh;
}

.spotlight-panel {
  position: relative;
  width: 640px;
  max-width: 90vw;
  background: #ffffff;
  border-radius: 14px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  font-size: 14px;
}

.spotlight-input-wrap {
  display: flex;
  align-items: center;
  padding: 0 18px;
  height: 60px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);

  .spotlight-input-icon {
    font-size: 22px;
    color: #86868b;
    flex-shrink: 0;
  }

  .spotlight-input {
    flex: 1;
    border: none;
    outline: none;
    background: transparent;
    font-size: 22px;
    color: #1d1d1f;
    margin-left: 12px;

    &::placeholder {
      color: #b0b0b5;
    }
  }
}

.spotlight-close {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 1;
  font-size: 18px;
  color: #86868b;
  cursor: pointer;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(0, 0, 0, 0.06);
    color: #1d1d1f;
  }
}

.spotlight-box {
  max-height: 46vh;
  overflow-y: auto;
  padding: 8px;

  .spotlight-box-title {
    font-size: 12px;
    color: #86868b;
    padding: 6px 10px;
  }

  .spotlight-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 8px;
    padding: 4px;
  }

  .spotlight-cell {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    height: 76px;
    border-radius: 10px;
    background: rgba(0, 0, 0, 0.03);
    border: 1px solid rgba(0, 0, 0, 0.05);
    cursor: pointer;
    padding: 6px 4px;
    transition: all 0.15s ease;

    &:hover {
      background: rgba(0, 0, 0, 0.05);
    }

    &.active {
      background: #2156a4;
      border-color: #2156a4;
      box-shadow: 0 6px 18px rgba(33, 86, 164, 0.35);

      .spotlight-cell-icon,
      .spotlight-cell-title {
        color: #fff;
      }
    }

    .spotlight-cell-icon {
      display: block;
      font-size: 20px;
      line-height: 1;
      color: #2156a4;
    }

    .spotlight-cell-title {
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      margin-top: 7px;
      font-size: 11px;
      line-height: 1.3;
      color: #1d1d1f;
      font-weight: 500;
      text-align: center;
      width: 100%;
      overflow: hidden;
      word-break: break-all;
    }
  }

  .spotlight-empty {
    text-align: center;
    color: #b0b0b5;
    padding: 24px 0;
  }
}

/* ============================================================
   深色主题适配（.theme-dark 深空黑 / .theme-dark-blue 午夜蓝 / .theme-green 森林）
   面板为 fixed 定位且位于组件内，是 body 的后代，可用祖先选择器命中
   ============================================================ */
.theme-dark,
.theme-dark-blue,
.theme-green {
  .spotlight-mask {
    background: rgba(0, 0, 0, 0.5);
  }

  .spotlight-panel {
    background: #28282c;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  }

  .spotlight-input-wrap {
    border-bottom-color: rgba(255, 255, 255, 0.08);

    .spotlight-input-icon {
      color: rgba(255, 255, 255, 0.5);
    }
    .spotlight-input {
      color: #f5f5f7;
      &::placeholder {
        color: rgba(255, 255, 255, 0.35);
      }
    }
  }

  .spotlight-close {
    color: rgba(255, 255, 255, 0.55);
    &:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #f5f5f7;
    }
  }

  .spotlight-box {
    .spotlight-box-title {
      color: rgba(255, 255, 255, 0.45);
    }
    .spotlight-cell {
      background: rgba(255, 255, 255, 0.04);
      border-color: rgba(255, 255, 255, 0.06);

      &:not(.active):hover {
        background: rgba(255, 255, 255, 0.08);
      }
      &.active {
        background: #2997ff;
        border-color: #2997ff;
        box-shadow: 0 6px 18px rgba(41, 151, 255, 0.4);
      }
      .spotlight-cell-icon {
        color: #2997ff;
      }
      .spotlight-cell-title {
        color: #f5f5f7;
      }
      &.active .spotlight-cell-icon,
      &.active .spotlight-cell-title {
        color: #fff;
      }
    }
    .spotlight-empty {
      color: rgba(255, 255, 255, 0.35);
    }
  }
}

/* 午夜蓝：面板偏蓝 */
.theme-dark-blue .spotlight-panel {
  background: #111d42;
}

/* 森林：面板偏绿 */
.theme-green .spotlight-panel {
  background: #1a2a1e;
}

/* 遮罩淡入淡出 */
.spotlight-fade-enter-active,
.spotlight-fade-leave-active {
  transition: opacity 0.2s ease;
}
.spotlight-fade-enter,
.spotlight-fade-leave-to {
  opacity: 0;
}

/* 面板弹出 */
.spotlight-pop-enter-active {
  transition: all 0.22s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.spotlight-pop-leave-active {
  transition: all 0.15s ease;
}
.spotlight-pop-enter,
.spotlight-pop-leave-to {
  opacity: 0;
  transform: translateY(-12px) scale(0.97);
}
</style>
