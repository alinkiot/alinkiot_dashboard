# 应用远程工具(erl-cli 接入)

在"应用接入"里给应用勾选"远程工具"后,该应用会得到一个独立的 token。持有 token 的人可以用 erl-cli(配合 erl-cli skill)连接平台后端节点的 `/debug` 通道,执行 eval、trace、热更新、下载文件等操作。

## 风险

erl-cli 的 `eval` 等同于在后端节点上执行任意 Erlang 代码,`load` 可以热更新任意模块,`download` 可以读取节点上的文件。token 泄露等于后端节点被完全控制。因此:

- 默认关闭。新建的应用不会开启。
- 开启和重置 token 需要单独的权限 `system:app:remote`(菜单"应用接入"下的"远程工具"按钮)。这个权限不会自动授予任何角色,需要管理员在角色管理里手动勾选。
- 只给可信的运维人员开启,用完关闭。

## 使用

1. 在"应用接入"里新增或编辑应用,勾选"远程工具",保存。
2. 保存后弹出 token。token 只显示这一次,库里只保存它的 sha256,丢失后只能在编辑页点"重置 token"。
3. 用 erl-cli 连接:

```bash
python3 scripts/erl_cli.py eval "erlang:node()" \
    --host <后端地址> --port <端口> --path /debug --token <token>
```

`scripts/erl_cli.py` 来自 erl-cli 仓库(也在 `alinkiot/_build/default/lib/erl_cli/scripts/`),依赖 `pip install websocket-client`。skill 说明见同目录的 `SKILL.md`。

端口:直连后端用 `dashboard.port`(默认 18888);经 nginx 访问用 nginx 的端口。`erl_cli.py` 只支持 `ws://`,不支持 `wss://`,所以不能直接连 https 域名。

## 实现

| 部分 | 位置 |
|---|---|
| 认证模块,替换 erl-cli 默认认证 | `alinkiot_data/src/alinkdata_remote_auth.erl` |
| 开关接口 `GET/POST /system/app/remote` | `alinkdata_app_service.erl`(`remote_info/4`、`remote_set/4`) |
| 凭证表 `sys_app_remote` | `alinkiot-compose/init/mysql/migrations/20261127_menu_is_top_app_remote.sql` |
| 前端表单与 token 弹窗 | `src/views/iot/project/app.vue` |

认证规则(`alinkdata_remote_auth:check_auth/2`):

1. 全局运维 token:保持 erl-cli 原有行为,`erl_cli.debug = true` 且 token 与 `erl_cli.token` 一致时放行。默认 `debug = false`,所以默认不放行。
2. 应用 token:64 位十六进制,取 sha256 后在 `sys_app_remote` 里查,并且要求对应的 `sys_app` 记录仍然存在。格式不对的 token 不查库。

`sys_app_remote` 加入了通用增删改查的排除列表,只能通过 `/system/app/remote` 访问,不能经通用接口直接写入 token。

每次连接成功或失败都会在后端日志里记一条 warning,包含来源 IP 和应用 appid。开启、关闭也会记录操作人。

## 已知限制

- 关闭或重置 token 后,已经建立的 WebSocket 连接不会被断开,最长保留到 5 分钟空闲超时。需要立即断开时重启节点或在节点上处理。
- 日志只记录连接,不记录连接后执行了哪些命令。
- 失败的连接没有限速。
