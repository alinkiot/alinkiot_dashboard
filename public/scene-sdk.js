/**
 * SceneSDK 1.1.0 — 场景及产品自定义 HTML 面板 SDK（供页面作者及 AI 使用）。
 *
 * 【接入】
 * 1. 在 HTML 的业务脚本之前手动引入本文件，不使用 import，也不需要注册。
 *    同域：<script src="/scene-sdk.js?v=1.1.0"></script>
 *    跨域：将 src 改为 Dashboard 的完整地址，而不是上传文件服务器的地址。
 * 2. HTML 必须在 Dashboard 场景或设备详情的 HTML 面板 iframe 中运行。
 *    单独打开 HTML 无法调用父页面接口。建议在 window 的 load 事件后初始化数据和订阅。
 * 3. 父页面负责登录鉴权、后端请求和 MQTT；不要在 HTML 中填写 token 或 MQTT 凭据。
 *    本 SDK 不会自动注入 HTML，也不提供设备控制/写入方法。
 *
 * 【AI 生成页面时的数据规则】
 * - 场景模式可访问当前场景设备；产品面板模式只可访问设备详情当前设备。
 *   产品面板在 iot_product_mgr 字典中选择“多媒体-文件”上传 HTML，产品仅需选择该项；
 *   字典 dictValue 保存 JSON，例如：
 *   {"type":"html","value":"dji_drone","path":"/upload/drone.html"}。
 *   产品 category 只保存固定标识 dji_drone；替换 path 不影响产品关联。
 *   同一 HTML 可供多个产品/设备复用，不要把设备 ID 写死在 HTML 中。
 *   两种模式使用相同 API：产品面板 getDevices() 的 total 为 1，第一页只有当前设备，
 *   后续页为空；传其他设备 ID 的查询或订阅会被拒绝，不要求当前设备关联场景。
 * - 先 getDevices() 获取当前场景设备；后续传 device.id，不是 device.addr 或产品 ID。
 * - 按产品物模型 product.thing 渲染：name 是数据键，title 是显示名称，unit 是单位；
 *   access 为 "read" 或 "rw" 的属性用于当前状态展示。不要猜测/写死位移字段和单位。
 * - 最新记录/历史记录通常是平铺数据；MQTT 通常是 { 字段: { value, ts } }。
 *   两者不是同一种结构，SDK 不做统一转换；MQTT 回调也不是 getDeviceStatus 的返回值。
 * - 物模型 name 与数据键匹配时可忽略大小写（与设备详情页一致）。
 *   缺失值显示 "--"，保留合法的 0、false；不要把无数据展示为 0 或模拟数据。
 * - 时间字段可能为 createtime/createTime，实时字段可能有 ts；
 *   设备详情页按秒解释实时 ts。按实际返回格式处理，不要混用秒和毫秒。
 * - 所有请求方法返回 Promise，失败需 catch 并显示错误；请求超时为 30 秒。
 *   空场景、无产品、无记录和未收到实时消息均需提供明确的空状态。
 * - getDeviceStatus 是一次性快照，不会自动更新；实时订阅只有后续设备消息，
 *   不保证立即回调，也不提供独立的上线/离线通知。先加载最新记录，再接收实时数据。
 * - 订阅 Promise 成功仅表示父页面登记了订阅，不代表 MQTT 已连接或已有数据。
 *   离开/切换设备时调用返回的 unsubscribe 并处理其 Promise；重新加载页面需重新订阅。
 *
 * 【最小完整 HTML 示例】
 * 以下地址中的 dashboard.example.com 需替换为实际 Dashboard 地址。
 *
 * <div id="status">正在加载…</div>
 * <pre id="values"></pre>
 * <button id="stop" disabled>停止实时更新</button>
 * <script src="https://dashboard.example.com/scene-sdk.js?v=1.1.0"></script>
 * <script>
 * window.addEventListener("load", async function () {
 *   const status = document.getElementById("status");
 *   const values = document.getElementById("values");
 *   const stop = document.getElementById("stop");
 *   try {
 *     if (!window.SceneSDK || typeof SceneSDK.getDeviceProduct !== "function") {
 *       throw new Error("请检查 SDK 地址及版本，需加载 1.1.0 或兼容新版");
 *     }
 *     const { rows } = await SceneSDK.getDevices({ pageSize: 100 });
 *     if (!rows.length) { status.textContent = "当前场景暂无设备"; return; }
 *     const device = rows[0];
 *     const { product } = await SceneSDK.getDeviceProduct(device.id);
 *     const things = product ? product.thing.filter(
 *       item => item.access === "read" || item.access === "rw"
 *     ) : [];
 *     function render(data) {
 *       const source = data && typeof data === "object" ? data : {};
 *       values.textContent = things.map(function (thing) {
 *         const key = Object.keys(source).find(
 *           name => name.toLowerCase() === thing.name.toLowerCase()
 *         );
 *         const entry = source[key];
 *         const value = entry && typeof entry === "object" ? entry.value : entry;
 *         return (thing.title || thing.name) + ": " +
 *           (value == null ? "--" : String(value)) + " " + (thing.unit || "");
 *       }).join("\n");
 *     }
 *     const latest = await SceneSDK.getDeviceLatestRecord(device.id);
 *     render(latest);
 *     status.textContent = !product ? "设备未关联产品" :
 *       !things.length ? "产品暂无可读物模型" :
 *       !latest ? "暂无记录，等待设备上报" : "已加载最新记录，等待实时更新";
 *     // 缓存合并，避免设备只上报部分字段时清空其他读数。
 *     let current = Object.assign({}, latest || {});
 *     const unsubscribe = await SceneSDK.subscribeDeviceStatus(device.id, function (data) {
 *       if (!data || typeof data !== "object") {
 *         status.textContent = "收到非结构化消息，无法按物模型显示";
 *         return;
 *       }
 *       current = Object.assign({}, current, data);
 *       render(current);
 *       status.textContent = "已收到实时数据";
 *     });
 *     stop.disabled = false;
 *     stop.onclick = async function () {
 *       try {
 *         await unsubscribe();
 *         stop.disabled = true;
 *         status.textContent = "已停止实时更新";
 *       } catch (error) { status.textContent = "取消订阅失败：" + error.message; }
 *     };
 *   } catch (error) { status.textContent = "加载失败：" + error.message; }
 * });
 * </script>
 */
(function (window) {
  "use strict";

  var pending = {};
  var subscribers = {};
  var requestId = 0;
  var subscriptionId = 0;
  var timeoutMs = 30000;

  window.addEventListener("message", function (event) {
    if (event.source !== window.parent) return;
    var message = event.data;
    if (!message) return;
    if (message.type === "scene-sdk-event") {
      var callback = subscribers[message.subscriptionId];
      if (callback && message.event === "device-status") {
        callback(message.data, {
          deviceId: message.deviceId,
          topic: message.topic
        });
      }
      return;
    }
    if (message.type !== "scene-sdk-response") return;

    var task = pending[message.requestId];
    if (!task) return;
    clearTimeout(task.timeout);
    delete pending[message.requestId];

    if (message.error) task.reject(new Error(message.error));
    else task.resolve(message.result);
  });

  function call(method, args) {
    return new Promise(function (resolve, reject) {
      var id = ++requestId;
      var timeout = setTimeout(function () {
        delete pending[id];
        reject(new Error("SceneSDK 请求超时"));
      }, timeoutMs);
      pending[id] = { resolve: resolve, reject: reject, timeout: timeout };

      window.parent.postMessage({
        type: "scene-sdk-request",
        requestId: id,
        method: method,
        args: args
      }, "*");
    });
  }

  window.SceneSDK = Object.freeze({
    /** @type {string} SDK 版本；用于排查错误地址或浏览器旧缓存。 */
    version: "1.1.0",
    /**
     * 分页获取授权范围内设备，并附带在线状态及最新采集记录。
     * 产品面板模式仅返回当前设备，total 为 1；场景模式返回当前场景设备。
     * total 是场景设备总数，rows 仅为当前页；设备较多时需继续分页。
     * @param {Object} [options]
     * @param {number} [options.pageNum=1] 页码，从 1 开始。
     * @param {number} [options.pageSize=100] 每页数量，上限 1000。
     * @returns {Promise<{total: number, rows: Array<Object>}>}
     * rows 元素保留后端设备字段（如 id、name、addr、product），并补充：
     * onlineStatus: 在线状态对象或 null（online 为 1 表示在线）；
     * latestData: 最新记录对象或 null。product 此处是产品 ID，不是产品详情。
     */
    getDevices: function (options) {
      return call("getDevices", options || {});
    },
    /**
     * 查询单个设备的当前快照，不启动轮询或实时订阅。
     * @param {string|number} deviceId 当前场景中的设备 ID。
     * @returns {Promise<{device: Object, onlineStatus: ?Object, latestData: ?Object}>}
     * onlineStatus 是在线状态，latestData 是最后一条采集记录；
     * 在线不代表刚刚采集过，离线也可能有历史记录。
     */
    getDeviceStatus: function (deviceId) {
      return call("getDeviceStatus", { deviceId: deviceId });
    },
    /**
     * 按设备查询关联产品信息，参数不是产品 ID。
     * @param {string|number} deviceId 当前场景中的设备 ID。
     * @returns {Promise<{device: Object, product: ?Object}>}
     * 无关联产品时 product 为 null；有产品时保留产品字段，并解析：
     * thing: 物模型数组，条目通常含 name/title/unit/access；
     * cmd: 从 control 解析的控制指令数组（仅返回配置，SDK 不执行指令）；
     * supportImport: 从 config 中提取的数据导入支持标志。
     * 不需要再次 JSON.parse(product.thing)。产品 JSON 无效时 Promise 会拒绝。
     */
    getDeviceProduct: function (deviceId) {
      return call("getDeviceProduct", { deviceId: deviceId });
    },
    /**
     * 查询设备最后一条已保存的采集记录，不是实时订阅。
     * @param {string|number} deviceId 当前场景中的设备 ID。
     * @returns {Promise<?Object>} 原始记录或 null，不包裹在 rows/data/latestData 中。
     * 示例（字段仅作说明，实际按物模型读取）：
     * { addr: "设备地址", createtime: "2026-10-23 10:00:00", displacement: 12.5 }
     * 记录中通常没有单位；单位应从产品物模型读取。
     */
    getDeviceLatestRecord: function (deviceId) {
      return call("getDeviceLatestRecord", { deviceId: deviceId });
    },
    /**
     * 分页查询设备历史记录，按采集时间倒序返回；画时间曲线时按时间升序排列。
     * @param {string|number} deviceId 当前场景中的设备 ID。
     * @param {Object} [options]
     * @param {number} [options.pageNum=1] 页码，从 1 开始。
     * @param {number} [options.pageSize=10] 每页数量，上限 500。
     * @param {string} [options.begin] 开始时间，格式 "YYYY-MM-DD HH:mm:ss"。
     * @param {string} [options.end] 结束时间，格式同 begin。
     * @param {string|number} [options.step] 后端采样参数，原样透传；
     *   未确认后端约定时请省略，SDK 不定义其单位。
     * @returns {Promise<{total: number, rows: Array<Object>}>} rows 为平铺历史记录。
     * @example
     * SceneSDK.getDeviceHistory(deviceId, {
     *   begin: "2026-10-01 00:00:00", end: "2026-10-02 00:00:00", pageSize: 100
     * }).then(({ rows, total }) => console.log(rows, total)).catch(console.error);
     */
    getDeviceHistory: function (deviceId, options) {
      return call("getDeviceHistory", {
        deviceId: deviceId,
        options: options || {}
      });
    },
    /**
     * 订阅设备 p/out/<addr> 的后续 MQTT 消息，与设备详情“当前状态”使用同一数据源。
     * 必须传函数；可以分别订阅多个设备，每次调用有独立的取消订阅函数。
     * @param {string|number} deviceId 当前场景中的设备 ID。
     * @param {function((Object|string), {deviceId: (string|number), topic: string}): void} callback
     * callback(data, meta) 中 data 为解析后的原始 MQTT JSON，解析失败则为原始字符串；
     * 常见结构为 { displacement: { value: 12.5, ts: 1792720800 } }，不保证每次字段齐全。
     * 回调内不要抛出异常；异步操作的错误需自行处理。
     * @returns {Promise<function(): Promise<Object|undefined>>}
     * await 后得到 unsubscribe()；调用后停止本地回调，并请求父页面取消订阅。
     * 重复调用 unsubscribe 不会重复发送请求。不要把返回的 Promise 当函数直接调用。
     * @example
     * const unsubscribe = await SceneSDK.subscribeDeviceStatus(deviceId, (data, meta) => {
     *   console.log(meta.deviceId, meta.topic, data);
     * });
     * await unsubscribe();
     */
    subscribeDeviceStatus: function (deviceId, callback) {
      if (typeof callback !== "function") {
        return Promise.reject(new Error("实时状态回调必须是函数"));
      }
      var id = "scene-sub-" + (++subscriptionId);
      subscribers[id] = callback;
      return call("subscribeDeviceStatus", {
        deviceId: deviceId,
        subscriptionId: id
      }).then(function () {
        var active = true;
        return function () {
          if (!active) return Promise.resolve();
          active = false;
          delete subscribers[id];
          return call("unsubscribeDeviceStatus", { subscriptionId: id });
        };
      }).catch(function (error) {
        delete subscribers[id];
        throw error;
      });
    }
  });
})(window);
