import defaultSettings from '@/settings'

// Apple 设计风格的内置主题预设：每种主题各自的强调色与背景风格
// 与 store/modules/settings.js 中的 appleThemePresets 保持一致
export const appleThemePresets = {
  'theme-light': { headerBgColor: '#fbfbfd', bodyBgColor: '#f5f5f7', rightToolbarColor: '#1d1d1f', theme: '#0071e3' },
  'theme-dark': { headerBgColor: '#1d1d1f', bodyBgColor: '#1d1d1f', rightToolbarColor: '#f5f5f7', theme: '#2997ff' },
  'theme-dark-blue': { headerBgColor: '#111D42', bodyBgColor: '#0C1535', rightToolbarColor: '#dce4f8', theme: '#4267c4' },
  'theme-blue': { headerBgColor: '#0a2a5e', bodyBgColor: '#f5f5f7', rightToolbarColor: '#eaf3ff', theme: '#0071e3' },
  'theme-green': { headerBgColor: '#1a2a1e', bodyBgColor: '#121e15', rightToolbarColor: '#dceadc', theme: '#34c759' }
}

// 内置主题的元信息（id/显示名/sideTheme/缩略图展示色 swatch）
export const BUILTIN_THEME_META = [
  { id: 'builtin-theme-light', name: '明亮白', sideTheme: 'theme-light', swatch: '#f5f5f7' },
  { id: 'builtin-theme-dark', name: '深空黑', sideTheme: 'theme-dark', swatch: '#1d1d1f' },
  { id: 'builtin-theme-dark-blue', name: '午夜蓝', sideTheme: 'theme-dark-blue', swatch: '#111D42' },
  { id: 'builtin-theme-blue', name: '科技蓝', sideTheme: 'theme-blue', swatch: '#2563EB' },
  { id: 'builtin-theme-green', name: '森林绿', sideTheme: 'theme-green', swatch: '#1a2a1e' }
]

// 主题风格设置抽屉里的缩略图列表（name/title/color）
export function buildThemeLayouts() {
  return BUILTIN_THEME_META.map(meta => ({
    name: meta.sideTheme,
    title: meta.name,
    color: meta.swatch
  }))
}

// 生成内置主题的完整配置对象（供顶栏主题切换使用）
export function buildBuiltinThemes() {
  return BUILTIN_THEME_META.map(meta => {
    const preset = appleThemePresets[meta.sideTheme] || {}
    return {
      id: meta.id,
      name: meta.name,
      sideTheme: meta.sideTheme,
      theme: preset.theme,
      headerBgColor: preset.headerBgColor,
      bodyBgColor: preset.bodyBgColor,
      rightToolbarColor: preset.rightToolbarColor,
      topNav: defaultSettings.topNav,
      tagsView: defaultSettings.tagsView,
      fixedHeader: true,
      sidebarLogo: defaultSettings.sidebarLogo,
      dynamicTitle: defaultSettings.dynamicTitle,
      sidebarWidth: defaultSettings.sidebarWidth,
      titleSize: defaultSettings.titleSize
    }
  })
}

// 生成"config 表记录形状"的内置主题，供站点配置的默认主题选择器展示/合并
// 结构与后端 config 表（configKey=layout_setting）返回的记录保持一致
export function buildBuiltinThemeConfigRows() {
  return buildBuiltinThemes().map(theme => ({
    configId: theme.id,
    configName: theme.name,
    configKey: 'layout_setting',
    configValue: JSON.stringify(theme),
    remark: '系统内置主题',
    builtin: true
  }))
}
