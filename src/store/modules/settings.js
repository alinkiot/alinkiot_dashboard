import defaultSettings from '@/settings'
import { siteInfo} from '@/api/login'
import { getProject } from "@/api/iot/system";
// Apple 主题预设与内置主题生成逻辑统一维护在 @/utils/builtinThemes
import { appleThemePresets, buildBuiltinThemes } from '@/utils/builtinThemes'

const { sidebarWidth, titleSize, theme, headerBgColor, rightToolbarColor, bodyBgColor, sideTheme, showSettings, topNav, tagsView, fixedHeader, sidebarLogo, dynamicTitle } = defaultSettings

// Known old (non-Apple) color values that should be migrated
const oldColors = new Set([
  '#409EFF', '#1890FF', '#11A983', '#1B2965', '#063F30', '#AF52DE',
  '#EBEBEB', '#FFFFFF', '#000000',
  '#1e2233', '#141825', '#252a3d', '#e8eaf4', '#2997ff',
  '#3a5ba0', '#1e3468', '#1e3a5f'
])

function applyAppleMigration(themeObj) {
  const preset = appleThemePresets[themeObj.sideTheme]
  if (!preset) return
  // If header/body/toolbar colors are old values, replace with Apple presets
  if (oldColors.has(themeObj.headerBgColor)) {
    themeObj.headerBgColor = preset.headerBgColor
  }
  if (oldColors.has(themeObj.bodyBgColor)) {
    themeObj.bodyBgColor = preset.bodyBgColor
  }
  if (oldColors.has(themeObj.rightToolbarColor)) {
    themeObj.rightToolbarColor = preset.rightToolbarColor
  }
  // Migrate old primary accent colors to theme-appropriate Apple accent
  if (['#409EFF', '#1890FF'].includes(themeObj.theme)) {
    themeObj.theme = preset.theme
  }
  // Ensure fixedHeader is true for frosted glass effect
  if (themeObj.fixedHeader === false) {
    themeObj.fixedHeader = true
  }
}

const state = {
  title: '',
  theme: theme,
  titleSize: titleSize,
  sidebarWidth: sidebarWidth,
  headerBgColor: headerBgColor,
  rightToolbarColor: rightToolbarColor,
  bodyBgColor: bodyBgColor,
  sideTheme: sideTheme,
  showSettings: showSettings,
  topNav: topNav,
  tagsView: tagsView,
  fixedHeader: fixedHeader,
  sidebarLogo: sidebarLogo,
  dynamicTitle: dynamicTitle,
  project: undefined,
  siteInfo: undefined,
  currentTheme: undefined
}
const mutations = {
  CHANGE_THEME: (state, theme) => {
    state.currentTheme = theme.id
    localStorage.setItem("layout-setting", JSON.stringify(theme));
    for(let key in defaultSettings){
      const value = theme[key]
      if(value){
        state[key] = value
      }else{
        state[key] = defaultSettings[key]
      }
    }
  },
  SET_SITE: (state, site) => {
    try {
      let defSetting = undefined;
      const layouts = site.layout_setting;
      const defTheme = site.theme;
      site.layout_setting = [];

      // 后端下发的主题（解析后）
      const backendThemes = [];
      if(layouts && layouts.length){
        layouts.map(layout => {
          const theme = JSON.parse(layout.configValue)
          if(theme){
            theme.id = layout.configId;
            theme.name = layout.configName;
            // Migrate old color values to Apple design presets
            applyAppleMigration(theme);
            backendThemes.push(theme)
          }
        })
      }

      // 叠加模式：内置五种始终存在（排在前面），后端下发的追加/覆盖
      // 去重规则：按 sideTheme 匹配，若后端存在同款，则以后端配置为准
      const merged = buildBuiltinThemes();
      backendThemes.forEach(bt => {
        const idx = merged.findIndex(m => m.sideTheme === bt.sideTheme)
        if(idx >= 0){
          merged[idx] = bt      // 后端同款覆盖内置
        }else{
          merged.push(bt)       // 后端新增主题追加
        }
      })

      // 默认选中主题：优先后端 site.theme 指定的那一个
      if(defTheme){
        defSetting = merged.find(m => m.id === defTheme) || undefined
      }

      {
        site.layout_setting = merged;

        defSetting = !defSetting && merged.length > 0 ? merged[0] : defSetting;
        const storageSetting = JSON.parse(localStorage.getItem('layout-setting')) || undefined
        if(storageSetting){
          defSetting = storageSetting
        }
        if(defSetting){
          state.currentTheme = defSetting.id
          for(let key in defaultSettings){
            const value = defSetting[key]
            if(value){
              state[key] = defSetting[key]
            }else{
              state[key] = defaultSettings[key]
            }
          }
        }
      }
    }catch (err){
      // 异常时同样兜底内置主题，保证顶栏主题下拉始终可用
      site.layout_setting = buildBuiltinThemes();
      console.log(site, err);
    }
    state.siteInfo = site
  },
  CHANGE_SETTING: (state, { key, value }) => {
    console.log('change_setting', {key, value});
    if (state.hasOwnProperty(key)) {
      state[key] = value
    }
  }
}

const actions = {
  // 获取站点信息
  SiteInfo({ commit }, project) {
    return new Promise((resolve, reject) => {
      state.project = getProject(project);
      siteInfo(project).then(res => {
        const site_info = res.data
        commit('SET_SITE', site_info)
        resolve(site_info)
      }).catch(error => {
        reject(error)
      })
    });
  },
  // 修改布局设置
  changeSetting({ commit }, data) {
    commit('CHANGE_SETTING', data)
  },
  // 切换主题
  changeTheme({ commit }, theme) {
    commit('CHANGE_THEME', theme)
  },
  // 设置网页标题
  setTitle({ commit }, title) {
    state.title = title
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}

