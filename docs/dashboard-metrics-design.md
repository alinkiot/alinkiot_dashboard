# 监控大屏统计数据设计

适用页面:`src/views/dashboard/components/DataScreen.vue`(路由 `/dashboard` 对应的大屏)。
后端:`alinkiot/apps/alinkiot_data/src/service/alinkdata_dashboard_service.erl`,接口 `GET /system/dashboard/info`。

## 1. 现状与问题

| 问题 | 位置 |
|---|---|
| 在线设备趋势(左2格、底部第2格)使用 `Math.random()` | 前端 |
| 告警趋势(右3格)使用 `Math.random()` | 前端 |
| 消息上报统计(底部第3格)使用 `Math.random()` | 前端 |
| 产品分布写死 `传感器/控制器/…` 与固定数值 | 前端 |
| 告警饼图初始值写死 12/28/45,接口失败时仍显示 | 前端 |
| 左2格与底部第2格是同一份数据(24h 在线),重复 | 前端 |
| 项目名直接拼进 SQL,存在注入风险 | 后端 `resolve_project_id` |
| 项目标识查不到时回退成全系统数据,会把别的项目的数据显示在当前项目下 | 后端 |
| 全局与按项目各写一套 SQL,每个指标两份实现 | 后端 |
| 任一数据源(MySQL 或 TDengine)出错,整个接口失败 | 后端 |
| 页面只在加载和切换项目时取数,不刷新 | 前端 |

## 2. 数据源盘点

| 数据源 | 内容 | 保留期 | 项目维度 |
|---|---|---|---|
| MySQL `sys_device` | 设备、状态、经纬度、省份、创建时间、所属产品和项目 | 永久 | 有 `project` |
| MySQL `sys_product` | 产品名称 | 永久 | 无,经设备关联 |
| MySQL `sys_alarm` | 告警级别、时间、确认状态 `confirm` | 永久 | 无,经 `addr` 关联设备 |
| 内存 `alinkcore_cache` | 实时在线会话 | 实时 | 无,经设备 `addr` 查询 |
| TDengine `metrics_device` | 每小时一个快照:总数、启用、在线 | 7 天 | 无 |
| TDengine `metrics_device_log` | 设备日志,`event=up_data` 即上报一次数据 | 7 天 | 标签 `addr`、`product_id` |

## 3. 指标规划

只规划有真实来源的指标。没有数据时前端显示"暂无数据",不填充任何生成值。

| 编号 | 指标 | 展示位置 | 来源 | 项目过滤 |
|---|---|---|---|---|
| M1 | 设备总数、在线数、离线数 | 设备概览 | `sys_device` + 在线会话 | 支持 |
| M2 | 在线率 = 在线 / 总数 | 设备概览(在线设备标签) | M1 计算 | 支持 |
| M3 | 今日新增设备 | 设备概览(设备总数标签) | `sys_device.create_time` | 支持 |
| M4 | 产品数 | 设备概览 | `sys_product`;选项目时为该项目设备涉及的产品数 | 支持 |
| M5 | 设备在线趋势(24h,每小时) | 左2格 | `metrics_device` | 不支持(见 §6) |
| M6 | 产品分布(设备数 Top 8) | 左3格 | `sys_device` 关联 `sys_product.name` | 支持 |
| M7 | 设备地图 | 中间 | `sys_device` 经纬度 | 支持 |
| M8 | 告警级别分布 | 右2格(饼图) | `sys_alarm` 按级别 | 支持 |
| M9 | 今日告警数、待确认告警数 | 右2格(饼图中心) | `sys_alarm.create_time`、`confirm = 0` | 支持 |
| M10 | 最近 20 条告警 | 右1格 | `sys_alarm` | 支持 |
| M11 | 近 7 天告警趋势(按级别堆叠) | 右3格 | `sys_alarm` 按日期、级别 | 支持 |
| M12 | 近 30 天每日新增设备 | 底部第1格 | `sys_device.create_time` | 支持 |
| M13 | 设备地区分布(省份 Top 10) | 底部第2格,替换重复的 24h 在线图 | `sys_device.province` | 支持 |
| M14 | 近 7 天每日消息上报量 | 底部第3格 | `metrics_device_log`,`event='up_data'` | 支持,设备数不超过 2000 |

## 4. 接口设计

`GET /system/dashboard/info?project=<项目ID或标识>`

保留原有字段并保持结构不变,新增字段不影响旧页面(`screen.vue`)。

```jsonc
{
  "device": {
    "all_device": 120, "active_device": 118, "online_device": 87,
    "offline_device": 33, "online_rate": 72.5, "today_new": 3
  },
  "product": { "all_product": 6 },
  "alarm": {
    "total": 85, "today": 4, "unconfirmed": 12,
    "detail": [ { "level": "1", "count": 12 } ]
  },
  "recentAlarms": [ { "id": 1, "title": "", "level": "1", "addr": "", "content": "", "create_time": "" } ],
  "deviceMap":    [ { "id": 1, "addr": "", "name": "", "lng": 0, "lat": 0, "status": "0" } ],
  "deviceDaily":  [ { "date": "2026-07-01", "count": 3 } ],
  "alarmDaily":   [ { "date": "2026-07-01", "level": "1", "count": 2 } ],
  "productDist":  [ { "name": "产品A", "count": 50 } ],
  "areaDist":     [ { "province": "广东省", "count": 40 } ],
  "onlineTrend":  [ { "time": "2026-07-01 10:00:00", "online_device": 80, "all_device": 120 } ],
  "messageDaily": [ { "time": "2026-07-01 00:00:00", "count": 12345 } ]
}
```

约定:
- 只返回有数据的日期。缺失日期由前端补 0(`fillDays`)。
- `onlineTrend` 与 `messageDaily` 为 `null` 表示该指标当前不可用(选了项目、TDengine 出错、设备过多),为 `[]` 表示可用但没有数据。前端对两者都显示"暂无数据"。
- 各指标独立取数。某个指标出错只影响自己,该字段返回 `null` 或空值,其余指标正常。

## 5. 后端重构要点

1. 项目过滤统一为 `all | {project, Id}`,由 `project_filter/1` 一次解析,各指标用同一个条件片段,去掉全局与项目各一套的重复 SQL。
2. 项目标识按字符串转义后查询。查不到项目时返回 ID `-1`,各指标结果为 0,不再回退为全系统数据。
3. 每个指标用 `safe/2` 包裹,出错时记录日志并返回默认值。
4. TDengine 指标(M5、M14)缓存 60 秒,缓存放在 `alinkiot_metrics` 持有的 ETS 表,该表不存在时直接查询。
5. 计数统一用 `count(case when … then 1 end)`,避免 `sum()` 返回 DECIMAL 类型。

## 6. 已知限制与后续

- `metrics_device` 只按节点记录,没有项目维度,所以选了项目后"在线趋势"显示"暂无数据"。要支持需要新增 `metrics_project_device`(标签 `project`),并在 `alinkiot_metrics:record_td/0` 每小时按项目写入。
- `metrics_device` 每小时记录一次,服务重启后一小时内趋势图可能没有点。
- `metrics_device_log` 与 `metrics_device` 只保留 7 天,所以消息量最多展示 7 天。
- `sys_alarm.confirm = 0` 视为待确认,依据是告警入库时 `confirm` 写 0(`alinkiot_alarm_alert.erl`)。
- 前端每 60 秒刷新一次。
