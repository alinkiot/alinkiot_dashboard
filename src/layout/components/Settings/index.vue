<template>
  <el-drawer size="280px" :visible="visible" :with-header="false" :append-to-body="true" :show-close="false">
    <ThemeForm :settings="settings" @change="change" @save="save" />
    <el-button style="margin-left: 20px;" size="small" plain icon="el-icon-refresh" @click="resetSetting">重置配置</el-button>
  </el-drawer>
</template>

<script>
import ThemeForm from "./themeForm.vue";

export default {
  components: { ThemeForm },
  data() {
    return {
    };
  },
  computed: {
    settings: {
      get() {
        return this.$store.state.settings;
      }
    },
    visible: {
      get() {
        return this.$store.state.settings.showSettings
      }
    },
  },
  methods: {
    change(key, val) {
      this.$store.dispatch('settings/changeSetting', {
        key: key,
        value: val
      })
      if(key === 'topNav' && !val){
        this.$store.dispatch('app/toggleSideBarHide', false);
        this.$store.commit("SET_SIDEBAR_ROUTERS", this.$store.state.permission.defaultRoutes);
      }
    },
    save(config) {
      this.$modal.loading("正在保存到本地，请稍候...");
      setTimeout(this.$modal.closeLoading(), 1000)
    },
    resetSetting() {
      this.$modal.loading("正在清除设置缓存并刷新，请稍候...");
      setTimeout("window.location.reload()", 1000)
    }
  }
}
</script>

<style lang="scss" scoped>

</style>
