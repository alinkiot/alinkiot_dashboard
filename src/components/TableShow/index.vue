<template>
  <div class="table-show">
    <div class="table-show__header" v-if="buttons.length > 0 || title">
      <span class="table-show__title" v-if="title">{{ title }}</span>
      <div class="table-show__actions">
        <template v-for="btn in buttons">
          <!-- 指定了 type（如 danger）的按钮：和普通按钮同样是文字样式，只换颜色，不抢主操作 -->
          <el-button
            v-if="btn.type"
            :key="btn.key"
            type="text"
            :icon="btn.icon"
            :loading="!!btn.loading"
            :class="'table-show__btn--' + btn.type"
            @click="doClick(btn)">{{ btn.title }}</el-button>
          <el-button
            v-else
            :key="btn.key"
            type="text"
            :class="btn.icon" @click="doClick(btn)">{{ btn.title }}</el-button>
        </template>
      </div>
    </div>
    <div v-if="columns.length > 0" class="table-show__body">
      <div class="table-show__item" v-for="column in columns" :key="column.key">
        <span class="table-show__label">{{ column.title }}</span>
        <span class="table-show__value">
          <template v-if="column.type === 'map'">
            <MapSelector
              :ref="'map_' + column.key"
              :name="column.key"
              :location="getValue(column)" :lat="getLngLat('lat', column)"
              :lng="getLngLat('lng', column)"
              @selectDone="selectMapDone"
            />
          </template>
          <template v-else-if="column.type === 'dict'">
            <dict-tag :options="column.options" :value="getValue(column)"/>
            <el-button
              v-if="column.tip === 'protocol'"
              type="text"
              icon="el-icon-question"
              class="table-show__tip-btn"
              @click="onTipClick(column)"/>
          </template>
          <template v-else-if="checkEmpty(column)">--</template>
          <template v-else>
            <template v-if="column.type === 'href'">
              <el-link type="primary" :underline="true" :href="getValue(column)" target="_blank">访问</el-link>
            </template>
            <template v-else-if="column.type === 'image'">
              <ImagePreview style="width: 20px;" :src="getValue(column)"/>
            </template>
            <template v-else-if="column.type === 'secret'">
              <span class="table-show__secret">******</span>
              <el-popover
                placement="bottom"
                :title="column.title + ':'"
                width="200"
                trigger="click"
                :content="getValue(column)">
                <el-button slot="reference" type="text" icon="el-icon-view"/>
              </el-popover>
            </template>
            <template v-else>
              {{ getValue(column) }}
            </template>
          </template>
          <el-button v-if="column.click"
                     type="text"
                     @click="doClick(column)"
                     :icon="column.click.icon" circle>
            <template v-if="column.click.title">
              {{ column.click.title }}
            </template>
          </el-button>
        </span>
      </div>
    </div>
    <el-empty :description="'暂无' + title" v-else/>
  </div>
</template>

<script>
import dayjs from "dayjs";
import ImagePreview from "@/components/ImagePreview/index.vue";
import MapSelector from "@/components/MapSelector/index.vue";

// 产品扩展字段中承载字段映射 JSON 的字段名
const PROTOCOL_CONFIG_KEY = 'protocolConfig';

// 协议标识的定制说明：value / label / 别名均可命中
const protoTip = extra => [
  '<div class="protocol-tip">',
  '<p>该协议需在产品「扩展字段」中新增一条 JSON 字段 <code>' + PROTOCOL_CONFIG_KEY + '</code>，把设备上报的 JSON 转成标准 JSON（完整转换定义）。</p>',
  '<p><b>配置格式</b>：值为合法 JSON 对象，每个标准字段是一个定义：<code>"字段名": {"value": 取值路径, "ts": 时间定义}</code>，其中 <code>ts</code> 可省略：</p>',
  '<pre>{\n  "temperature": {\n    "value": "#HOTWATER/items/1/values/SteamFlow",\n    "ts": { "ref": "${CURRENT_TIME}" }\n  },\n  "energy": { "value": "#Energy" },\n  "$sub_addr": { "value": "#sn" }\n}</pre>',
  '<p><b># 路径规范</b>（用于 value / ref）：</p>',
  '<p>· <code>#Energy</code> 取顶层字段 Energy 的值；<code>#a/b/c</code> 用 <code>/</code> 逐层取嵌套字段；</p>',
  '<p>· 数组用 <code>items/下标</code>（下标从 1 开始），如 <code>#HOTWATER/items/1/values/SteamFlow</code>；</p>',
  '<p>· <code>${CURRENT_TIME}</code> 表示取当前时间戳；value/ref 还支持 format（type/rate/offset/precision、datetime→unix）与正则 re/keys、replace；</p>',
  '<p>· 路径取不到则该字段为空；JSON 必须是合法对象，否则设备接入会被拒绝。</p>',
  extra,
  '<p><b>$sub_addr（规范约定，非必需）</b>：若转换结果中包含 <code>$sub_addr</code>（如配置 <code>"$sub_addr": {"value": "#sn"}</code>），则表示该消息属于子设备，网关据此路由给对应子设备处理；没有则按设备自身处理。</p>',
  '</div>'
].join('');

const PROTOCOL_TIPS = {
  'mqtt-json': protoTip(''),
  'tcp-json': protoTip('<p>· TCP 报文以 <code>\\r\\n</code> 分隔。</p>')
};

// 协议别名：字典 label（如 "JSON Over MQTT"）归一化后 → 内置键
const PROTOCOL_ALIAS = {
  'jsonovermqtt': 'mqtt-json',
  'jsonovertcp': 'tcp-json'
};
// 归一化：忽略大小写、空格、连字符、下划线，让 "JSON Over TCP"/"json-over-tcp" 都能命中
const normalizeProtocol = s => String(s).toLowerCase().replace(/[\s\-_]/g, '');

export default {
  components: {
    MapSelector,
    ImagePreview
  },
  props: {
    title: {
      type: String,
      default: undefined
    },
    columns: {
      type: Array,
      default: () => []
    },
    item: {
      type: Object,
      default: () => ({})
    },
    buttons: {
      type: Array,
      default: () => []
    }
  },
  methods: {
    checkEmpty(column) {
      const value = this.getValue(column);
      return value === null || value === undefined || value === '';
    },
    doClick(column) {
      this.$emit('click', column);
    },
    // 协议问号按钮点击：把说明内容抛给父组件弹窗展示
    onTipClick(column) {
      this.$emit('tip-click', { column, content: this.getTipContent(column) });
    },
    // 字段说明：协议标识命中内置定制说明则用它，否则取字典项的 remark（都有则弹窗都有内容）
    getTipContent(column) {
      const value = this.getValue(column);
      if (column.tip !== 'protocol') return this.getDictRemark(column) || '';
      // 协议值可能是字面量（mqtt-json）、字典 value（如数字 ID），label 则是 "JSON Over TCP" 等
      // 逐个尝试：原始值 + 对应字典项的 value/label/raw，再用别名归一化匹配内置说明
      const candidates = [value];
      const hit = (column.options || []).find(o => String(o.value) === String(value));
      if (hit) {
        candidates.push(hit.value, hit.label);
        if (hit.raw) candidates.push(hit.raw.dictValue, hit.raw.dictLabel);
      }
      for (const c of candidates) {
        if (c === undefined || c === null) continue;
        let key = String(c).trim();
        if (PROTOCOL_TIPS[key]) return this.withCurrentConfig(key);
        // 别名归一化匹配（"JSON Over TCP" / "json-over-tcp" 等）
        const norm = normalizeProtocol(key);
        const alias = PROTOCOL_ALIAS[norm];
        if (alias && PROTOCOL_TIPS[alias]) return this.withCurrentConfig(alias);
        // 兜底：label 里同时含 json 和 tcp/mqtt 关键词也命中
        if (norm.indexOf('json') >= 0 && norm.indexOf('mqtt') >= 0) return this.withCurrentConfig('mqtt-json');
        if (norm.indexOf('json') >= 0 && norm.indexOf('tcp') >= 0) return this.withCurrentConfig('tcp-json');
      }
      // 其它协议：展示字典 remark；没填则给一句默认说明，保证点击都有内容
      const remark = this.getDictRemark(column);
      const label = hit && hit.label ? hit.label : value;
      if (remark) {
        return '<div class="protocol-tip"><p>协议：<code>' + this.escapeHtml(label) +
          '</code></p><p>' + this.escapeHtml(remark) + '</p></div>';
      }
      return '<div class="protocol-tip"><p>协议：<code>' + this.escapeHtml(label) +
        '</code></p><p>该协议暂无特别说明。</p></div>';
    },
    // 若产品已配置 protocolConfig，把实际 JSON 内容追加到说明里展示
    withCurrentConfig(key) {
      const tip = PROTOCOL_TIPS[key];
      const conf = this.getProtocolConfig();
      if (!conf) return tip;
      return tip + '<div class="protocol-tip__cur"><p>当前产品已配置：</p><pre>' +
        this.escapeHtml(conf) + '</pre></div>';
    },
    // 从产品 item.config（JSON 字符串 [{name,value}]）中取 protocolConfig 的值
    getProtocolConfig() {
      const raw = this.item && this.item.config;
      if (!raw) return '';
      try {
        const arr = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (!Array.isArray(arr)) return '';
        const hit = arr.find(o => o && o.name === PROTOCOL_CONFIG_KEY);
        if (!hit) return '';
        let val = hit.value;
        if (val === undefined || val === null || val === '') return '';
        // 值本身可能是 JSON 字符串，格式化展示得更清晰
        if (typeof val === 'string') {
          try {
            val = JSON.stringify(JSON.parse(val), null, 2);
          } catch (e) { /* 非合法 JSON，原样展示 */ }
        } else {
          val = JSON.stringify(val, null, 2);
        }
        return String(val);
      } catch (e) {
        return '';
      }
    },
    // 简单 HTML 转义，避免展示的 JSON 内容破坏弹窗结构
    escapeHtml(str) {
      return String(str).replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
      })[c]);
    },
    // 取当前字典值对应项的 remark 说明（字典原始数据保存在 option.raw 里）
    getDictRemark(column) {
      const value = this.getValue(column);
      const options = column.options || [];
      const hit = options.find(o => String(o.value) === String(value));
      return hit && hit.raw ? hit.raw.remark : undefined;
    },
    selectMapDone(data) {
      const name = data.name;
      const arr = this.columns.filter(item => item.key === name);
      if (arr.length > 0) {
        this.$emit('selectMapDone', arr[0], data);
      }
    },
    getLngLat(key, column) {
      return this.item[column[key]];
    },
    getValue(column) {
      const key = column.key;
      const format = column.format;
      let value = this.item[key];
      if (column.type === 'relation') {
        const field = column.on;
        let other = this.item[field];
        if (format) {
          return format(key, { field: other, key: value });
        } else {
          if (!other && !value) return undefined;
          other = other ? other : '--';
          value = value ? value : '--';
          return [value, other].join(",");
        }
      } else if (column.type === 'datetime') {
        if (value) {
          return dayjs(value * 1000).format('YYYY-MM-DD HH:mm:ss');
        }
        return undefined;
      } else {
        if (format) {
          return format(key, value);
        }
        return value;
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.table-show {
  margin-bottom: 20px;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  &__title {
    font-size: 15px;
    font-weight: 600;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 8px;

    // flex gap 已经留了间距，去掉 Element 相邻按钮的默认左外边距
    .el-button + .el-button {
      margin-left: 0;
    }
  }

  &__btn--danger {
    color: #909399;

    &:hover,
    &:focus {
      color: #f56c6c;
    }
  }

  &__body {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 0;
  }

  &__item {
    display: flex;
    align-items: center;
    padding: 10px 12px;
    border-radius: 6px;
    min-height: 40px;

    &:hover {
      background: rgba(0, 0, 0, 0.025);
    }
  }

  &__label {
    font-size: 13px;
    font-weight: 500;
    color: #86868b;
    min-width: 72px;
    flex-shrink: 0;
  }

  &__value {
    flex: 1;
    font-size: 14px;
    word-break: break-word;
    overflow-wrap: anywhere;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  &__secret {
    letter-spacing: 2px;
    margin-right: 4px;
  }

  &__tip-btn {
    padding: 0;
    font-size: 14px;
    color: #909399;
  }
}
</style>

<style lang="scss">
.protocol-tip {
  font-size: 13px;
  line-height: 1.7;
  p { margin: 0 0 6px; }
  p:last-child { margin-bottom: 0; }
  code {
    background: #f5f7fa;
    padding: 1px 4px;
    border-radius: 3px;
    color: #d14;
  }
  pre {
    margin: 6px 0;
    padding: 8px 10px;
    background: #f5f7fa;
    border-radius: 4px;
    font-size: 12px;
    white-space: pre-wrap;
    word-break: break-all;
  }
  &__cur {
    margin-top: 10px;
    padding-top: 8px;
    border-top: 1px dashed #dcdfe6;
    p { color: #67c23a; font-weight: 600; }
    pre { background: #f0f9eb; color: #529b2e; }
  }
}
.protocol-tip-dialog .protocol-tip { font-size: 14px; }
.theme-dark,
.theme-dark-blue,
.theme-green {
  .table-show__item:hover {
    background: rgba(255, 255, 255, 0.04);
  }
  .table-show__label {
    color: rgba(255, 255, 255, 0.45);
  }
}
</style>
