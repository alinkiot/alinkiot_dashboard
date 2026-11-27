# 远程运维(erl-cli)

"智能体应用 / 远程运维"页面(原"系统管理 / 远程调试")可以启动 erl-cli 的 `/debug` 通道。启动时随机生成一个令牌,持有令牌的人可以用 erl-cli(配合 erl-cli skill)连接后端节点,执行 eval、trace、热更新、下载文件等操作。

它是平台级功能,和应用、项目都没有关联。

## 风险

erl-cli 的 `eval` 等同于在后端节点上执行任意 Erlang 代码,`load` 可以热更新任意模块,`download` 可以读取节点上的文件。令牌泄露等于后端节点被完全控制。

- 平时不启动,需要排查问题时再启动,用完停止。
- 页面和接口需要权限 `system:remote:query`(查看)和 `system:remote:edit`(启动、停止)。这两个权限不会自动授予任何角色,需要管理员在角色管理里手动勾选。
- 令牌保存在后端 mnesia 的内存表里,不落盘。到期、停止、节点重启后都会失效。

## 使用

1. 打开"智能体应用 / 远程运维",设置有效期(1 到 168 小时,默认 24),点"启动"。
2. 点"下载 SKILL",解压后把 `erl-cli` 目录放入智能体的 skills 目录。
3. 点"复制提示词",发给智能体。提示词里带有 host、port、token,智能体按 SKILL 连接后端节点进行调试。也可以手动用脚本连接:

```bash
python3 scripts/erl_cli.py eval "erlang:node()" \
    --host <后端地址> --port <端口> --path /debug --token <令牌>
```

4. 连不上时回到页面查看状态,过期或节点重启过的话重新启动即可。"重新生成"会让旧令牌立即失效。

SKILL 包是前端的静态文件 `public/skills/erl-cli.zip`,只包含 SKILL 部分(`SKILL.md`、`README.md`、`scripts/`),不含 Erlang 应用部分。由 `build/skill-zip.sh` 从后端依赖 `../alinkiot/_build/default/lib/erl_cli` 打包,和后端锁定的 erl-cli 版本一致;erl-cli 升级后重新执行并提交 zip。同一个脚本也负责打包"智能控制"用的 `uzyiot-api.zip`(来自 skill-alinkiot-api)、"智能应用"用的 `alinkiot-app.zip`(来自 skill-alinkiot-app,包含 `framework/`、`themes/`、`references/`)和"虚拟设备"用的 `alinkiot-vdevice.zip`(来自 skill-alinkiot-vdevice)。脚本依赖 `pip install websocket-client`。

端口:直连后端用 `dashboard.port`(默认 18888);经 nginx 访问用 nginx 的端口。`erl_cli.py` 只支持 `ws://`,不支持 `wss://`,所以不能直接连 https 域名。

## 实现

| 部分 | 位置 |
|---|---|
| 令牌存储(mnesia 内存表)与认证 | `alinkiot_data/src/alinkdata_remote_auth.erl` |
| 接口 `GET /system/remote/status`、`POST /system/remote/start`、`POST /system/remote/stop` | `alinkiot_data/src/service/alinkdata_remote_service.erl`,路由与权限在 `swagger_global.json` |
| 菜单与权限 | `alinkiot-compose/init/mysql/migrations/20261127_menu_is_top_remote_debug.sql`,`20261127_agent_ops_menu.sql`(移到"智能体运维"下),`20261128_agent_app_menu.sql`(应用生成,后改名"智能应用"),`20261128_agent_menu_rename_reorder.sql`(改名"智能体应用"并排到仪表盘之后),`20261128_agent_vdevice_menu.sql`(虚拟设备) |
| 前端页面 | `src/views/system/remote/index.vue`,`src/api/system/remote.js` |

认证规则(`alinkdata_remote_auth:check_auth/2`)有两条,满足任意一条即放行:

1. 全局运维令牌:保持 erl-cli 原有行为,`erl_cli.debug = true` 且令牌与 `erl_cli.token` 一致。默认 `debug = false`,所以默认不放行。
2. 页面启动的令牌:与 mnesia 表里的令牌一致且未过期。比较时逐字节异或,耗时不随匹配位置变化。

同一时间只有一个有效令牌,重新启动会覆盖旧的。每次连接成功或失败,以及启动、停止,都会在后端日志里记一条 warning,包含来源 IP 和操作人,不记录令牌本身。

## 已知限制

- 停止、到期或重新生成后,已经建立的 WebSocket 连接不会被断开,最长保留到 5 分钟空闲超时。
- 日志只记录连接,不记录连接后执行了哪些命令。
- 失败的连接没有限速。
- 集群部署时,表在各节点各有一份内存副本,令牌会同步到加入集群的节点。节点单独重启后,该节点上的令牌丢失,需要重新启动。
