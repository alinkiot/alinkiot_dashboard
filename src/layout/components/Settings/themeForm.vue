<template>
    <div class="drawer-container">
      <div>
        <div class="setting-drawer-content">
          <div class="setting-drawer-title">
            <h3 class="drawer-title">主题风格设置</h3>
          </div>
          <div class="setting-drawer-block-checbox">
            <div class="setting-drawer-block-checbox-item"
                 @click="handleTheme(layout.name)"
                 v-for="layout in layouts" :key="layout.name"
                 :style="'background-color:'+ layout.color +';'">
              <el-tooltip effect="dark" :content="layout.title" placement="top">
                <img src="@/assets/images/theme.png" :alt="layout.title"/>
              </el-tooltip>
              <div v-if="sideTheme === layout.name" class="setting-drawer-block-checbox-selectIcon" style="display: block;">
                  <i class="el-icon-check" />
              </div>
            </div>
          </div>
          <div class="drawer-item" style="padding: 4px 0; overflow: hidden;margin-bottom: 10px;">
            <span>字体大小</span>
            <el-input-number v-model="titleSize" :min="17" style="float: right" />
          </div>
          <div class="drawer-item" style="padding: 4px 0; overflow: hidden;margin-bottom: 10px;">
            <span>菜单宽度</span>
            <el-input-number v-model="sidebarWidth" :min="250" style="float: right" />
          </div>
          <el-divider/>
          <div class="drawer-item" style="padding: 4px 0;">
            <el-button style="cursor: default;" type="text">主题颜色</el-button>
            <theme-picker style="float: right;height: 26px;margin: -3px 8px 0 0;" @change="themeChange" />
          </div>
          <div class="drawer-item" style="padding: 4px 0;">
            <span>Header 配色</span>
            <el-color-picker style="float: right;height: 26px;margin: -3px 8px 0 0;"
              v-model="headerBgColor"
              :predefine="['#fbfbfd', '#1d1d1f', '#111D42', '#2563EB', '#1a2a1e', '#ffffff', '#242426', '#272729']"
              popper-class="theme-picker-dropdown" class="theme-picker"
            />
          </div>
          <div class="drawer-item" style="padding: 4px 0;">
            <span>右上角字体色</span>
            <el-color-picker style="float: right;height: 26px;margin: -3px 8px 0 0;"
               v-model="rightToolbarColor"
               :predefine="['#1d1d1f', '#f5f5f7', '#e8eaf4', '#d8dcea', '#dceadc', '#ffffff', '#6e6e73', '#86868b']"
               popper-class="theme-picker-dropdown" class="theme-picker"
            />
          </div>
          <div class="drawer-item" style="padding: 4px 0;">
            <span>Body 配色</span>
            <el-color-picker style="float: right;height: 26px;margin: -3px 8px 0 0;"
              v-model="bodyBgColor"
              :predefine="['#f5f5f7', '#1d1d1f', '#0C1535', '#2563EB', '#121e15', '#ffffff', '#272729', '#fbfbfd']"
              popper-class="theme-picker-dropdown" class="theme-picker"
            />
          </div>

        </div>

        <el-divider/>

        <h3 class="drawer-title">系统布局配置</h3>

        <div class="drawer-item">
          <span>开启 TopNav</span>
          <el-switch v-model="topNav" class="drawer-switch" />
        </div>

        <div class="drawer-item">
          <span>开启 Tags-Views</span>
          <el-switch v-model="tagsView" class="drawer-switch" />
        </div>

        <div class="drawer-item">
          <span>固定 Header</span>
          <el-switch v-model="fixedHeader" class="drawer-switch" />
        </div>

        <div class="drawer-item">
          <span>显示 Logo</span>
          <el-switch v-model="sidebarLogo" class="drawer-switch" />
        </div>

        <div class="drawer-item">
          <span>动态标题</span>
          <el-switch v-model="dynamicTitle" class="drawer-switch" />
        </div>

        <el-divider/>

        <el-button size="small" type="primary" plain icon="el-icon-document-add" @click="saveSetting">保存配置</el-button>
      </div>
    </div>
</template>

<script>
import ThemePicker from '@/components/ThemePicker'
import { appleThemePresets, buildThemeLayouts } from '@/utils/builtinThemes'

export default {
  components: { ThemePicker },
  props: {
    settings: {
      type: Object,
      default: function() { return {} }
    }
  },
  data() {
    return {

    };
  },
  computed: {
    layouts: {
      get() {
        return buildThemeLayouts();
      }
    },
    sideTheme: {
      get() {
        return this.settings.sideTheme
      }
    },
    theme: {
      get() {
        return this.settings.theme
      }
    },
    headerBgColor: {
      get() {
        return this.settings.headerBgColor
      },
      set(val){
        this.change('headerBgColor', val);
      }
    },
    titleSize: {
      get() {
        return this.settings.titleSize
      },
      set(val){
        this.change('titleSize', val);
      }
    },
    sidebarWidth: {
      get() {
        return this.settings.sidebarWidth
      },
      set(val){
        this.change('sidebarWidth', val);
      }
    },
    rightToolbarColor: {
      get() {
        return this.settings.rightToolbarColor
      },
      set(val){
        this.change('rightToolbarColor', val);
      }
    },
    bodyBgColor: {
      get() {
        return this.settings.bodyBgColor
      },
      set(val){
        this.change('bodyBgColor', val);
      }
    },
    fixedHeader: {
      get() {
        return this.settings.fixedHeader
      },
      set(val) {
        this.change('fixedHeader', val);
      }
    },
    topNav: {
      get() {
        return this.settings.topNav
      },
      set(val) {
        this.change('topNav', val);
      }
    },
    tagsView: {
      get() {
        return this.settings.tagsView
      },
      set(val) {
        this.change('tagsView', val);
      }
    },
    sidebarLogo: {
      get() {
        return this.settings.sidebarLogo
      },
      set(val) {
        this.change('sidebarLogo', val);
      }
    },
    dynamicTitle: {
      get() {
        return this.settings.dynamicTitle
      },
      set(val) {
        this.change('dynamicTitle', val);
      }
    },
  },
  methods: {
    themeChange(val) {
      this.change('theme', val);
    },
    handleTheme(val) {
      this.change('sideTheme', val);
      // 套用每个主题对应的 Apple 风格配色（统一来自 @/utils/builtinThemes）
      const preset = appleThemePresets[val];
      if (preset) {
        this.change('headerBgColor', preset.headerBgColor);
        this.change('bodyBgColor', preset.bodyBgColor);
        this.change('rightToolbarColor', preset.rightToolbarColor);
      }
    },
    change(key, val) {
      this.$emit('change', key, val);
    },
    saveSetting() {
      const config = `{
          "topNav":${this.topNav},
          "tagsView":${this.tagsView},
          "fixedHeader":${this.fixedHeader},
          "sidebarLogo":${this.sidebarLogo},
          "dynamicTitle":${this.dynamicTitle},
          "sideTheme":"${this.sideTheme}",
          "theme":"${this.theme}",
          "headerBgColor":"${this.headerBgColor}",
          "bodyBgColor":"${this.bodyBgColor}",
          "rightToolbarColor":"${this.rightToolbarColor}",
          "sidebarWidth":"${this.sidebarWidth}",
          "titleSize":"${this.titleSize}"
      }`;
      this.$emit('save', config);
    }
  }
}
</script>

<style lang="scss" scoped>
  .setting-drawer-content {
    .setting-drawer-title {
      margin-bottom: 12px;
      //color: rgba(0, 0, 0, .85);
      font-size: 14px;
      line-height: 22px;
      font-weight: bold;
    }

    .setting-drawer-block-checbox {
      display: flex;
      justify-content: flex-start;
      align-items: center;
      margin-top: 10px;
      margin-bottom: 20px;

      .setting-drawer-block-checbox-item {
        position: relative;
        margin-right: 16px;
        border-radius: 8px;
        cursor: pointer;
        width: 48px;
        height: 48px;

        img {
          width: 48px;
          height: 48px;
        }

        .setting-drawer-block-checbox-selectIcon {
          position: absolute;
          top: 0;
          right: 0;
          width: 100%;
          height: 100%;
          padding-top: 22px;
          padding-left: 24px;
          color: #0071e3;
          font-weight: 700;
          font-size: 15px;
        }
      }
    }
  }

  .drawer-container {
    padding: 20px;
    font-size: 14px;
    line-height: 1.5;
    word-wrap: break-word;

    .drawer-title {
      margin-bottom: 12px;
      font-size: 14px;
      line-height: 22px;
    }

    .drawer-item {
      font-size: 14px;
      padding: 6px 0;
    }

    .drawer-switch {
      float: right
    }
  }

</style>
