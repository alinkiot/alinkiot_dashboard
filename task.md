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

方案:URL 前缀 `/p-<项目标识>/…` 已保存在 `settings.project`。新增 `settings/ResolveProject`,按标识查出项目记录并缓存,各页面进入时调用它得到项目 ID。

- [x] store:`ResolveProject`,同一项目只查一次,失败或不是从项目进入时返回 `undefined`,页面按不过滤处理
- [x] 设备列表:默认按当前项目过滤,项目选择框置为只读;URL 里显式带 `project` 参数时以参数为准
- [x] 告警规则:列表默认按当前项目过滤,新建规则默认归属当前项目
- [x] 场景:默认选中并展开当前项目
- [x] 应用接入:列表默认按当前项目过滤,新建应用默认归属当前项目
- [x] 监控大屏:默认展示当前项目,标题栏仍可切换
- [ ] 联调验证:登录一个项目账号,逐页确认过滤结果(后端项目列表按 `name` 精确查询这一点只从代码推断,未实际登录验证)
- [ ] 产品、告警历史所在的表没有项目字段,未处理;如需要,要先确认按什么维度归属项目

已知限制:
- 项目账号如果没有项目列表的查询权限,`ResolveProject` 失败,页面退回不过滤。
- 项目标识只含字母数字(`getProject` 的正则),与 `sys_project.name` 按大小写精确匹配。

## 任务 3:erl-cli 远程调试

目标:提供一个可以启动 erl-cli 通道的入口,配合 erl-cli skill 远程控制后端节点。设计与风险说明见 `docs/remote-debug.md`。

方案演变:最初做成"应用接入里勾选远程工具,每个应用一个令牌",后来发现 erl-cli 的权限范围是整个节点,和项目级的应用对不上,已撤回。改为平台级:系统管理下单独的"远程调试"页面,启动时随机生成一个令牌,存 mnesia 内存表,带有效期,节点重启后失效,需要时再启动即可。

- [x] 阅读 erl-cli:支持自定义认证模块 `auth_mod`,原生只有一个全局令牌
- [x] 后端:
  - [x] `alinkdata_remote_auth`:mnesia 内存表存令牌,认证(保留全局令牌行为),恒定时间比较,连接日志
  - [x] `GET /system/remote/status`、`POST /system/remote/start`、`POST /system/remote/stop`,小时数限制在 1 到 168
- [x] 菜单与权限:`system:remote:query`、`system:remote:edit`,默认不授予任何角色;迁移脚本与初始化脚本
- [x] 前端:系统管理下的"远程调试"页面,启动、重新生成、停止、令牌复制、连接示例
- [x] 验证(本地后端,真实 WebSocket):
  - [x] 启动后令牌可连接并执行 `erlang:node()`
  - [x] 错误令牌、重新生成后的旧令牌、停止后的令牌均返回 401
  - [x] 有效期按小时数设置,非法值回退到 24 小时
  - [x] 过期令牌被拒绝
  - [x] 节点重启后令牌失效
  - [x] 接口未登录返回 401
- [ ] 页面联调:在浏览器里打开"系统管理 / 远程调试"走一遍启动、重新生成、停止
- [ ] 在角色管理里把"远程调试"权限授予需要的角色
- [ ] erl_cli.py 只支持 `ws://`,经 https 域名访问需要改脚本或走内网地址
- [ ] 停止或到期后,已建立的连接不会被断开(最长 5 分钟空闲超时)
- [ ] 记录连接后执行的命令(目前只记录连接)与失败限速
- [ ] 把 erl-cli 的 `SKILL.md` 安装到使用者的 skill 目录
