# 任务清单

状态:`[x]` 已完成,`[~]` 进行中或待验证,`[ ]` 未开始。

## 任务 1:监控大屏统计数据重构

目标:大屏所有指标使用真实数据,去掉假数据。设计见 `docs/dashboard-metrics-design.md`。

- [x] 盘点数据源(MySQL、在线会话、TDengine),规划 14 个指标
- [x] 后端重构 `alinkdata_dashboard_service.erl`
  - [x] 全局与按项目过滤统一为一套 SQL
  - [x] 每个指标独立取数,出错不影响其他指标
  - [x] 修复项目名拼接 SQL 的注入风险
  - [x] 项目查不到时返回 0,不再回退为全系统数据
  - [x] TDengine 指标缓存 60 秒
  - [x] 新增字段:`alarmDaily`、`productDist`、`areaDist`、`onlineTrend`、`messageDaily`,以及 `online_rate`、`today_new`、`today`、`unconfirmed`
- [x] 前端 `DataScreen.vue` 删除所有 `Math.random()` 与写死数据,无数据时显示"暂无数据"
- [x] 前端每 60 秒自动刷新;底部重复的 24h 在线图换成地区分布
- [x] 开发环境接口指向本地 `http://127.0.0.1:18888/iotapi`(`.env.development`)
- [x] 本地库 `sys_menu` 补 `is_top` 字段
- [ ] 联调验证:登录后打开大屏,逐个核对 14 个指标与数据库是否一致
  - [ ] 重点核对 `confirm = 0` 是否确实是"待确认告警"
  - [ ] 核对 TDengine 的 `time` 字段返回格式,确认 `dayjs` 解析正确
  - [ ] 核对 `metrics_device_log` 中 `up_data` 日志是否持续写入
- [ ] 补 `alinkiot-compose/init/mysql/backup.sql` 中 `sys_menu.is_top`,否则新环境初始化后仍会报缺字段
- [ ] 按项目的在线趋势:新增 `metrics_project_device` 表,在 `alinkiot_metrics:record_td/0` 中每小时按项目写入(可选)
- [ ] 旧页面 `views/dashboard/screen.vue` 无路由引用,仍含随机数据,确认后删除或改造

### 当前状态
代码已提交,但联调时发现有问题,待调试。具体现象由负责人补充,调试前不要把"联调验证"标为完成。

### 已知问题
- `make shell`(`console` 模式)会让 Erlang 虚拟机段错误,根因未查。用 `_build/prod/rel/alinkiot/bin/alinkiot foreground` 可正常启动。
- 日志中的 Redis `econnrefused` 是连接池重连产生的报错,后端不依赖 Redis 也能提供接口。

## 任务 2:从项目进入时,自动过滤项目数据

目标:用户从某个项目进入后,设备列表等带项目过滤条件的页面,自动带上该项目的过滤,无需手动选择。

现状线索:
- 路由前缀为 `/:project?/…`,项目标识已经在 URL 里。
- 大屏用 `sys_project.name` 作为项目标识传给后端。

- [ ] 梳理"从项目进入"的入口:路由前缀 `:project`、登录后项目信息存放位置(`store`、`settings`)
- [ ] 梳理有项目过滤的页面清单:设备列表、产品、告警、历史数据、场景等,确认各页面项目过滤字段名
- [ ] 设计统一机制:在 store 或封装的查询方法里注入当前项目,避免每个页面各写一份
- [ ] 默认值自动带入,并保留手动清除或切换项目的能力
- [ ] 确认后端各列表接口是否已支持按项目过滤,不支持的补上
- [ ] 验证:从项目进入后,各列表默认只显示该项目数据;不从项目进入时行为不变

待确认:
- "从项目进入"具体指哪个入口(项目列表点击进入,还是带项目前缀的 URL)?
- 用户在项目内是否允许切换到其他项目?

## 任务 3:erl-cli 与应用接入打通

目标:创建应用(`sys_app`)时可勾选"远程工具",勾选后可使用 erl-cli 配合 skill 远程控制该应用。

现状线索:
- 后端已集成 `erl_cli`(`rebar.config`),配置项 `erl_cli.debug`、`erl_cli.token`(`etc/alinkiot.conf`)。
- WebSocket 通道:`alinkiot_dashboard_mqtt.erl` 中 `/debug` 路由到 `erl_cli_ws_handler`。
- nginx 已为 erl_cli 配置 WebSocket 反向代理(`alinkiot-compose/config/nginx.conf`)。
- 应用服务:`alinkdata_app_service.erl`,表 `sys_app`。

- [ ] 阅读 `erl-cli` 仓库,确认认证方式、命令能力、权限模型(当前是全局固定 token)
- [ ] 设计应用级授权:`sys_app` 增加"远程工具"开关字段,并为每个应用生成独立的访问凭证
- [ ] 后端:
  - [ ] `sys_app` 增加字段,同步更新建表脚本与 mapper
  - [ ] `/debug` 握手时按应用凭证校验,开关关闭或凭证无效则拒绝
  - [ ] 限制可执行的命令范围,记录操作日志
- [ ] 前端:创建与编辑应用表单增加"远程工具"勾选项,展示连接地址与凭证,支持重置凭证
- [ ] 编写 skill:说明如何用 erl-cli 连接应用并执行常用运维操作
- [ ] 安全评审:远程控制等同于在服务节点上执行代码,需要评估越权、凭证泄露和审计,并确认生产环境默认关闭
- [ ] 验证:创建应用并勾选后可连接;未勾选或凭证错误时被拒绝

待确认:
- "远程控制"的对象是平台后端节点,还是接入的设备或应用?
- skill 面向谁使用(平台运维人员,还是应用开发者)?
