# alinkiot_dashboard

alinkiot_dashboard - 物联网管理后台前端工程。基于 Vue 2 + Element UI 的单页管理系统，面向设备接入与运营，提供产品 / 物模型、设备管理、场景联动、告警、历史数据、AI 助手等物联网业务的可视化管理界面，并内置一套完整的后台权限（RBAC）与系统监控能力。

## 功能模块

IoT 业务页面集中在 `src/views/iot`，对应接口封装在 `src/api/iot`：

| 模块 | 目录 | 说明 |
|------|------|------|
| 产品 / 物模型 | `iot/product` | 产品的创建与配置，定义物模型（属性 / 事件 / 服务）等设备能力模型 |
| 设备管理 | `iot/device` | 设备列表与详情、设备看板（`boards`）、设备工具箱（`toolbox`）、协议调试盒（`protocolbox`）；查看设备状态、下发指令、调试上下行报文 |
| 项目 / 应用 | `iot/project` | 按项目维度组织设备与资源，管理应用接入（`app.vue`）；项目卡片支持「编辑」「配置」「访问 / 退出」操作（详见下方「项目配置」） |
| 场景联动 | `iot/scene` | 配置"条件触发 - 执行动作"的自动化场景规则，实现设备间联动 |
| 告警管理 | `iot/alarm` | 告警规则（`rule`）、告警通知组（`group`）、告警记录（`history`） |
| 历史数据 | `iot/history` | 设备上报数据的列表 / 表格 / 图表展示与导出（`list` / `table` / `chart` / `export`） |
| AI 助手 | `iot/ai` | 内置 AI Agent / 对话（`agent` / `chat`），用于智能问答与辅助运维 |

设备通信基于 MQTT（`mqtt` 依赖），实时数据与看板通过订阅设备主题获取；地图相关展示使用高德地图（`vue-amap`）。

### 系统与监控

沿用成熟的后台管理能力，位于 `src/views/system` 与 `src/views/monitor`：

- 系统管理：用户、角色、菜单、部门、岗位、字典、参数配置、通知公告
- 系统监控：在线用户、定时任务、服务监控、缓存监控
- 日志：登录日志、操作日志、**设备日志**（`monitor/devicelog`）

### 项目配置

项目列表（`iot/project/index.vue`）中每张项目卡片提供「编辑」「配置」「访问 / 退出」三类操作：

- **配置**：点击后跳转到项目配置页，并带上 `projectId` 查询参数。
  - 未激活项目时跳转到 `/project/config?projectId=<id>`；
  - 已激活某项目（URL 带项目前缀）时跳转到 `/{project}/project/config?projectId=<id>`。
- **访问**：先调用 `siteInfo` 接口检测该项目是否已创建站点配置。
  - 已配置：跳转到项目首页 `/{project}/index`；
  - 未配置：弹窗引导「前往配置」，跳转到配置页并附带 `configKey=site_info` 直接定位到站点信息配置项。
- **退出**：注销当前项目（`LogOut`），回到该项目的登录页 `/{project}/login`。

配置页实现位于 `src/views/system/config`，由 `index.vue` 聚合多个配置项弹窗组件（`components/`），可配置的内容包括：

- 站点信息（`siteInfoDialog`）、主题（`themeDialog`）、菜单（`menuDialog`）、图片（`imageDialog`）
- AI（`aiDialog`）、地图（`mapDialog`）、短信（`smsDialog`）
- 微信公众号 / 小程序（`wxDialog` / `wxMiniDialog`）
- 数据源：MySQL（`mysqlDialog`）、Redis（`redisDialog`）、TDengine（`tdDialog`）

> 「配置」「访问」等按钮均受 RBAC 权限控制（如 `system:config:query`、`system:project:*`），无权限时按钮不显示。

### 快捷菜单

顶部导航栏的快捷菜单（`src/components/HeaderSearch`）是一套 Spotlight 风格的菜单快速检索入口：

- **打开方式**：点击导航栏图标，或使用全局快捷键 `⌘ + K`（Mac）/ `Ctrl + K`（其它系统）；再次按下或 `Esc` 关闭。
- **快捷菜单**：无输入时以网格形式展示常用菜单（最多 18 个），来源为当前用户**有权限的路由菜单**（`permission_routes`，自动跳过隐藏项）。
- **模糊搜索**：输入关键字后用 `fuse.js` 对菜单标题 / 路径做模糊匹配（最多展示 24 条结果）。
- **键盘操作**：`↑` / `↓` 移动高亮，`Enter` 跳转到选中菜单，外链菜单会在新标签页打开。
- **主题适配**：面板样式自动适配深色主题（深空黑 / 午夜蓝 / 森林）。

> 快捷菜单只展示登录用户有权访问的菜单，权限变化时随路由动态更新。

#### 把查询保存为快捷菜单

列表页的查询工具栏组件 `RightToolbar`（右上角那排圆形图标）提供一个**星形按钮**「保存此查询到菜单，方便直接进入」（受 `system:config:add` 权限控制），点击弹出「添加快捷菜单」对话框（`system/menu/components/menuDlg.vue`）：

- 会把**当前查询条件**（自动剔除 `pageNum` / `pageSize` / `orderNum` 等分页字段）与**显隐列**（`fields`）一起保存成菜单项，下次从菜单直接进入即带着该查询条件打开页面。
- 「添加至」可选：
  - **项目菜单**（`addType=0`）：保存为所选项目的专属配置（写入该项目 config，`configKey=menu`）；
  - **全局菜单**（`addType=1`）：调用 `addMenu` 保存为系统菜单（`menuType=C`）。

### 主题

内置主题预设维护在 `src/utils/builtinThemes.js`，共 5 套 Apple 风格主题（各自定义了强调色与头 / 体背景）：

| 显示名 | class（`sideTheme`） | 风格 | 强调色 |
|--------|----------------------|------|--------|
| 明亮白 | `theme-light` | 亮色 | `#0071e3` |
| 深空黑 | `theme-dark` | 深色 | `#2997ff` |
| 午夜蓝 | `theme-dark-blue` | 深色 | `#4267c4` |
| 科技蓝 | `theme-blue` | 亮色（深色头部） | `#0071e3` |
| 森林绿 | `theme-green` | 深色 | `#34c759` |

- **切换入口**：顶部导航栏的「主题切换」下拉，以及设置抽屉的「主题风格设置」（`layout/components/Settings/themeForm.vue`）；`ThemePicker` 组件还支持自定义强调色。
- **生效方式**：主题以 body 的 class（即 `sideTheme`）形式应用，由 `App.vue` 统一监听并重写，切换即时生效、无需刷新；各组件的深色样式通过 `.theme-dark` / `.theme-dark-blue` / `.theme-green` 选择器适配。
- **持久化与下发**：当前主题存于 Vuex `settings`（`store/modules/settings.js`）；项目还可在站点配置中设置默认主题（config `layout_setting`），由后端下发给该项目的所有用户。

## 技术栈

- Vue 2.6 + Vue Router 3 + Vuex 3
- Element UI 2.15
- Vue CLI 4（webpack 4）
- ECharts、MQTT.js、高德地图（vue-amap）等
- Sass、ESLint

## 环境要求

- Node.js 14.19.1（项目已通过 `.tool-versions` 锁定，推荐使用 asdf 管理版本）
- npm

> 注意：项目依赖 webpack 4，请勿使用 Node 17+（OpenSSL 3 会导致 `digital envelope routines::unsupported` 报错）。

## 快速开始

```bash
# 进入项目目录
cd alinkiot_dashboard

# 确认 Node 版本（asdf 会根据 .tool-versions 自动切换）
node -v   # 应为 v14.19.1

# 安装依赖
npm install

# 国内网络较慢时可指定镜像源（不建议使用 cnpm，容易产生诡异问题）
npm install --registry=https://registry.npmmirror.com

# 启动开发服务
npm run dev
```

开发服务默认运行在 http://localhost:1024

## 可用脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务（热更新） |
| `npm run build:stage` | 构建测试环境产物 |
| `npm run build:prod` | 构建生产环境产物 |
| `npm run preview` | 本地预览构建产物 |
| `npm run lint` | ESLint 代码检查 |

## 环境配置

不同环境的变量在根目录的 `.env.*` 文件中维护，核心变量：

- `VUE_APP_TITLE`：网页标题
- `VUE_APP_BASE_API`：后端接口基础地址

| 文件 | 对应环境 | 构建命令 |
|------|---------|---------|
| `.env.development` | 开发 | `npm run dev` |
| `.env.staging` | 测试 | `npm run build:stage` |
| `.env.production` | 生产 | `npm run build:prod` |

## 目录结构

```
alinkiot_dashboard
├── bin                 # 构建 / 运行脚本
├── public              # 静态资源与 index.html 模板
├── src
│   ├── api             # 后端接口封装
│   ├── assets          # 样式、图片等静态资源
│   ├── components      # 全局通用组件
│   ├── directive       # 自定义指令（权限、拖拽等）
│   ├── plugins         # 插件（下载、缓存等）
│   ├── router          # 路由配置
│   ├── store           # Vuex 状态管理
│   ├── utils           # 工具方法
│   ├── views           # 业务页面
│   └── main.js         # 应用入口
├── vue.config.js       # Vue CLI 配置
├── babel.config.js     # Babel 配置
└── .eslintrc.js        # ESLint 配置
```
