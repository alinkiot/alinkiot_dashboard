<template>
  <div id="tags-view-container" class="tags-view-container">
    <scroll-pane ref="scrollPane" class="tags-view-wrapper" @scroll="handleScroll">
      <router-link
        v-for="tag in visitedViews"
        ref="tag"
        :key="tag.path"
        :class="isActive(tag)?'active':''"
        :to="{ path: tag.path, query: tag.query, fullPath: tag.fullPath }"
        tag="span"
        class="tags-view-item"
        :style="activeStyle(tag)"
        @click.middle.native="!isAffix(tag)?closeSelectedTag(tag):''"
        @contextmenu.prevent.native="openMenu(tag,$event)"
      >
        <item v-if="tag.meta" :icon="tag.meta && tag.meta.icon" :title="tag.title" />
        {{ tag.title }}
        <span v-if="!isAffix(tag)" class="el-icon-close" @click.prevent.stop="closeSelectedTag(tag)" />
      </router-link>
    </scroll-pane>
    <ul v-show="visible" :style="{left:left+'px',top:top+'px'}" class="contextmenu">
      <li @click="refreshSelectedTag(selectedTag)"><i class="el-icon-refresh-right"></i> 刷新页面</li>
      <li v-if="!isAffix(selectedTag)" @click="closeSelectedTag(selectedTag)"><i class="el-icon-close"></i> 关闭当前</li>
      <li @click="closeOthersTags"><i class="el-icon-circle-close"></i> 关闭其他</li>
      <li v-if="!isFirstView()" @click="closeLeftTags"><i class="el-icon-back"></i> 关闭左侧</li>
      <li v-if="!isLastView()" @click="closeRightTags"><i class="el-icon-right"></i> 关闭右侧</li>
      <li @click="closeAllTags(selectedTag)"><i class="el-icon-circle-close"></i> 全部关闭</li>
    </ul>
  </div>
</template>

<script>
import ScrollPane from './ScrollPane'
import path from 'path'
import Item from '../Sidebar/Item.vue'

export default {
  components: { ScrollPane, Item },
  data() {
    return {
      visible: false,
      top: 0,
      left: 0,
      selectedTag: {},
      affixTags: []
    }
  },
  computed: {
    visitedViews() {
      return this.$store.state.tagsView.visitedViews
    },
    routes() {
      return this.$store.state.permission.sidebarRouters
    },
    theme() {
      return this.$store.state.settings.theme
    }
  },
  watch: {
    $route() {
      this.addTags()
      this.moveToCurrentTag()
    },
    visible(value) {
      if (value) {
        document.body.addEventListener('click', this.closeMenu)
      } else {
        document.body.removeEventListener('click', this.closeMenu)
      }
    }
  },
  mounted() {
    this.initTags()
    this.addTags()
  },
  methods: {
    isActive(route) {
      return route.path === this.$route.path
    },
    activeStyle(tag) {
      if (!this.isActive(tag)) return {};
      // 与全局 primary 按钮同源的主题强调色（可在主题设置中配置）
      const accent = this.theme || '#0071e3'
      return {
        'background-color': accent,
        'border-color': accent
      };
    },
    isAffix(tag) {
      return (tag.meta && tag.meta.affix) || /.*\/index/.test(tag.path)
    },
    isFirstView() {
      try {
        const isIndex = /.*\/index/.test(this.selectedTag.fullPath)
        return this.selectedTag.fullPath === this.visitedViews[1].fullPath || isIndex
      } catch (err) {
        return false
      }
    },
    isLastView() {
      try {
        return this.selectedTag.fullPath === this.visitedViews[this.visitedViews.length - 1].fullPath
      } catch (err) {
        return false
      }
    },
    filterAffixTags(routes, basePath = '/') {
      let tags = []
      routes.forEach(route => {
        if (this.isAffix(route)) {
          const tagPath = path.resolve(basePath, route.path)
          tags.push({
            fullPath: tagPath,
            path: tagPath,
            name: route.name,
            query: JSON.parse(route.query),
            meta: { ...route.meta }
          })
        }
        if (route.children) {
          const tempTags = this.filterAffixTags(route.children, route.path)
          if (tempTags.length >= 1) {
            tags = [...tags, ...tempTags]
          }
        }
      })
      return tags
    },
    initTags() {
      const affixTags = this.affixTags = this.filterAffixTags(this.routes)
      for (const tag of affixTags) {
        // Must have tag name
        if (tag.name) {
          this.$store.dispatch('tagsView/addVisitedView', tag)
        }
      }
    },
    addTags() {
      const { name } = this.$route
      if (name) {
        this.$store.dispatch('tagsView/addView', this.$route)
      }
      return false
    },
    moveToCurrentTag() {
      const tags = this.$refs.tag
      this.$nextTick(() => {
        for (const tag of tags) {
          if (tag.to.path === this.$route.path) {
            this.$refs.scrollPane.moveToTarget(tag)
            // when query is different then update
            if (tag.to.fullPath !== this.$route.fullPath) {
              this.$store.dispatch('tagsView/updateVisitedView', this.$route)
            }
            break
          }
        }
      })
    },
    refreshSelectedTag(view) {
      this.$tab.refreshPage(view);
    },
    closeSelectedTag(view) {
      this.$tab.closePage(view).then(({ visitedViews }) => {
        if (this.isActive(view)) {
          this.toLastView(visitedViews, view)
        }
      })
    },
    closeRightTags() {
      this.$tab.closeRightPage(this.selectedTag).then(visitedViews => {
        if (!visitedViews.find(i => i.fullPath === this.$route.fullPath)) {
          this.toLastView(visitedViews)
        }
      })
    },
    closeLeftTags() {
      this.$tab.closeLeftPage(this.selectedTag).then(visitedViews => {
        if (!visitedViews.find(i => i.fullPath === this.$route.fullPath)) {
          this.toLastView(visitedViews)
        }
      })
    },
    closeOthersTags() {
      this.$router.push(this.selectedTag).catch(()=>{});
      this.$tab.closeOtherPage(this.selectedTag).then(() => {
        this.moveToCurrentTag()
      })
    },
    closeAllTags(view) {
      if(this.visitedViews.length === 1){
        this.refreshSelectedTag(view)
      }else{
        this.$tab.closeAllPage().then(({ visitedViews }) => {
          if (this.affixTags.some(tag => tag.path === this.$route.path)) {
            return
          }
          this.toLastView(visitedViews, view)
        })
      }
    },
    toLastView(visitedViews, view) {
      const latestView = visitedViews.slice(-1)[0]
      if (latestView) {
        this.$router.push({...latestView})
      } else {
        // now the default is to redirect to the home page if there is no tags-view,
        // you can adjust it according to your needs.
        if (view.name === 'Dashboard' || view.name === 'Index') {
          // to reload home page
          this.$router.replace({ path: '/redirect' + view.fullPath })
        } else {
          const project = this.$route.params.project
          if(project){
            const path = '/'+ project + '/index'
            this.$router.push(path)
          }else{
            this.$router.push('/')
          }
        }
      }
    },
    openMenu(tag, e) {
      const menuMinWidth = 105
      const offsetLeft = this.$el.getBoundingClientRect().left // container margin left
      const offsetWidth = this.$el.offsetWidth // container width
      const maxLeft = offsetWidth - menuMinWidth // left boundary
      const left = e.clientX - offsetLeft + 15 // 15: margin right

      if (left > maxLeft) {
        this.left = maxLeft
      } else {
        this.left = left
      }

      this.top = e.clientY
      this.visible = true
      this.selectedTag = tag
    },
    closeMenu() {
      this.visible = false
    },
    handleScroll() {
      this.closeMenu()
    }
  }
}
</script>

<style lang="scss" scoped>
.tags-view-container {
  height: 38px;
  width: 100%;
  background: transparent;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  .tags-view-wrapper {
    .tags-view-item {
      border-radius: 8px;
      min-width: 80px;

      display: inline-block;
      position: relative;
      cursor: pointer;
      line-height: 26px;
      color: #333336;
      background: rgba(0, 0, 0, 0.03);
      padding: 2px 14px;
      font-size: 12px;
      margin-left: 2px;
      text-align: center;
      margin-top: 5px;
      border: none;
      font-weight: 400;
      letter-spacing: -0.01em;
      transition: all 0.2s ease;
      &:first-of-type {
        margin-left: 15px;
      }
      &:last-of-type {
        margin-right: 15px;
      }
      &:hover:not(.active) {
        background: rgba(0, 0, 0, 0.06);
        color: #1d1d1f;
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      }
      &.active {
        color: #fff;
        &:hover {
          opacity: 0.9;
          transform: translateY(-1px);
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
        }
        &::before {
        }
      }
    }
  }
  .contextmenu {
    margin: 0;
    background: rgba(251, 251, 253, 0.95);
    backdrop-filter: saturate(180%) blur(20px);
    -webkit-backdrop-filter: saturate(180%) blur(20px);
    z-index: 3000;
    position: absolute;
    list-style-type: none;
    padding: 4px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 400;
    color: #1d1d1f;
    box-shadow: 0 5px 30px rgba(0, 0, 0, 0.15);
    border: none;
    li {
      margin: 0;
      padding: 8px 16px;
      cursor: pointer;
      border-radius: 6px;
      &:hover {
        background: rgba(0, 113, 227, 0.06);
        color: #0071e3;
      }
    }
  }
}

// Dark theme contextmenu override
.theme-dark,
.theme-dark-blue,
.theme-blue,
.theme-green {
  .tags-view-container .tags-view-wrapper .tags-view-item {
    color: rgba(255, 255, 255, 0.78);
    background: rgba(255, 255, 255, 0.06);
    &:hover:not(.active) {
      background: rgba(255, 255, 255, 0.12);
      color: #ffffff;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }
    &.active {
      color: #fff;
    }
  }
  .tags-view-container .contextmenu {
    background: rgba(42, 42, 45, 0.95);
    color: #f5f5f7;
    box-shadow: 0 5px 30px rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.08);
    li {
      color: rgba(255, 255, 255, 0.75);
      &:hover {
        background: rgba(0, 113, 227, 0.12);
        color: #f5f5f7;
      }
    }
  }
}
</style>

<style lang="scss">
//reset element css of el-icon-close
.tags-view-wrapper {
  .tags-view-item {
    .el-icon-close {
      width: 16px;
      height: 16px;
      vertical-align: 2px;
      border-radius: 50%;
      text-align: center;
      transition: all .3s cubic-bezier(.645, .045, .355, 1);
      transform-origin: 100% 50%;
      &:before {
        transform: scale(.6);
        display: inline-block;
        vertical-align: -3px;
      }
      &:hover {
        background-color: rgba(0, 0, 0, 0.12);
        color: #fff;
      }
    }
  }
}
</style>
