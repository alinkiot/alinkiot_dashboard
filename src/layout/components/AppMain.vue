<template>
  <section class="app-main">
    <transition name="fade-transform" mode="out-in">
      <keep-alive :include="cachedViews">
        <router-view :key="$route.path" />
      </keep-alive>
    </transition>
  </section>
</template>

<script>
export default {
  name: 'AppMain',
  computed: {
    cachedViews() {
      return this.$store.state.tagsView.cachedViews
    }
  }
}
</script>

<style lang="scss" scoped>

.app-main {
  /* 52= navbar  52  */
  min-height: calc(100vh - 52px);
  width: 100%;
  position: relative;
  overflow: hidden;
}

/* 大屏仪表盘内嵌在 app-main 时，填满去掉顶栏后的可视高度，
   让其内部固定布局（flex）正常收缩、不塌陷也不溢出。
   独立的 /screen 路由不在 app-main 内，仍使用自身的 100vh。 */
.app-main ::v-deep .dashboard-screen {
  height: calc(100vh - 52px);
  width: 100%;
  margin: 0;
  border-radius: 0;
  overflow: hidden;
}

.fixed-header+.app-main {
  padding-top: 52px;
}

.hasTagsView {
  .app-main {
    /* 90 = navbar + tags-view = 52 + 38 */
    min-height: calc(100vh - 90px);
  }

  .app-main ::v-deep .dashboard-screen {
    height: calc(100vh - 90px);
    width: 100%;
    margin: 0;
    border-radius: 0;
    overflow: hidden;
  }

  .fixed-header+.app-main {
    padding-top: 90px;
  }
}

::v-deep .el-drawer__header {
  font-weight: 600;
}

</style>

<style lang="scss">
// fix css style bug in open el-dialog
.el-popup-parent--hidden {
  .fixed-header {
    padding-right: 17px;
  }
}
</style>
