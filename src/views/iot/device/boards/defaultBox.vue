<template>
  <div class="thing-box">
    <div class="thing-box-btn" v-if="hasToolbar">
      <!-- 有控制指令配置时按 cmd 渲染，否则走默认按钮 -->
      <CmdBtnBox v-if="hasCmd" :device="device" :values="valuesMap" @sendData="sendCmd" />
      <DefaultBtnBox v-else-if="category === 'default'" :device="device" @sendData="sendCmd" />
      <!-- ProtocolBtn 内部按钮暂未启用，渲染空容器会在 flex 布局中占用 gap 间距，
           导致导入按钮与前面按钮组距离过大，故暂时隐藏，待远程配置按钮启用后恢复 -->
      <ProtocolBtn :protocol="protocol" v-if="false"/>
      <ImportBtnBox :device="device" v-if="showImport" />
    </div>
    <template v-if="things.length > 0">
      <el-row :gutter="12" type="flex" class="thing-row">
        <el-col :xs="24" :sm="12" :md="8" :lg="6" :xl="6" v-for="thing in pagedThings" :key="thing.name"
          style="margin-bottom: 12px;">
          <div class="thing-card" :class="{ 'thing-card--flash': flashMap[thing.name] }">
            <div class="thing-card__header">
              <span class="thing-card__name">{{ thing.title }}</span>
              <span class="thing-card__unit" v-if="thing.unit">{{ thing.unit }}</span>
              <svg-icon v-if="thing.icon" :icon-class="thing.icon" class="thing-card__icon" />
            </div>
            <div class="thing-card__body">
              <el-tooltip :content="String(getDisplayValue(thing.name))" placement="top" :disabled="!isLong(thing.name)">
                <span class="thing-card__value">{{ getDisplayValue(thing.name) }}</span>
              </el-tooltip>
              <span class="thing-card__trend" v-if="getTrend(thing.name)" :class="'trend--' + getTrend(thing.name)">
                <i :class="getTrend(thing.name) === 'up' ? 'el-icon-top' : 'el-icon-bottom'" />
              </span>
            </div>
            <div class="thing-card__time">{{ getRelativeTime(thing.name) }}</div>
          </div>
        </el-col>
      </el-row>
      <div class="thing-pagination" v-if="things.length > pageSize">
        <el-pagination
          background
          layout="total, prev, pager, next"
          :total="things.length"
          :page-size="pageSize"
          :current-page.sync="currentPage"
          :pager-count="5"
          small
        />
      </div>
    </template>
    <el-empty description="无物模型" v-else />
  </div>
</template>

<script>
import { getValue } from "@/assets/js/iot"
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'
import DefaultBtnBox from "../toolbox/defaultBtnBox.vue"
import CmdBtnBox from "../toolbox/cmdBtnBox.vue"
import ProtocolBtn from '../protocolbox/protocolBtn.vue'
import ImportBtnBox from '../toolbox/importBtnBox.vue'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

export default {
  components: {
    DefaultBtnBox,
    CmdBtnBox,
    ProtocolBtn,
    ImportBtnBox
  },
  props: {
    device: {
      type: Object
    },
    data: {
      type: Object
    },
    env: {
      type: Object,
      default: () => ({})
    },
    protocol: String,
    showImport: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      things: [],
      category: undefined,
      valuesMap: {},
      prevValuesMap: {},
      flashMap: {},
      timeRefreshKey: 0,
      currentPage: 1,
      pageSize: 12
    };
  },
  created() {
    this.timeTimer = setInterval(() => {
      this.timeRefreshKey++;
    }, 10000);
  },
  computed: {
    hasCmd() {
      const product = this.device && this.device.product;
      return !!(product && Array.isArray(product.cmd) && product.cmd.length > 0);
    },
    hasToolbar() {
      return this.hasCmd || this.category === 'default' || this.showImport;
    },
    pagedThings() {
      const start = (this.currentPage - 1) * this.pageSize;
      return this.things.slice(start, start + this.pageSize);
    }
  },
  beforeDestroy() {
    clearInterval(this.timeTimer);
  },
  methods: {
    getDisplayValue(name) {
      const item = this.valuesMap[name];
      if (!item || (item.value === undefined && item.value !== 0)) return '--';
      if (/alink_ignore_.+/.test(item.value)) return '失败';
      return this.formatNumber(item.value);
    },
    // 数值过长（尤其是浮点数小数位过多）时四舍五入保留 4 位小数并去掉多余的 0，
    // 避免卡片宽度被撑爆导致溢出；非数字原样返回
    formatNumber(value) {
      if (typeof value === 'number' || (typeof value === 'string' && value.trim() !== '' && !isNaN(Number(value)))) {
        const num = Number(value);
        if (Number.isFinite(num) && !Number.isInteger(num)) {
          return Number(num.toFixed(4)).toString();
        }
      }
      return value;
    },
    // 格式化后仍然较长（如长文本/长数字）时，配合 el-tooltip 显示完整内容
    isLong(name) {
      const display = this.getDisplayValue(name);
      return typeof display === 'string' && display.length > 10 || (typeof display === 'number' && String(display).length > 10);
    },
    getTrend(name) {
      const curr = this.valuesMap[name];
      const prev = this.prevValuesMap[name];
      if (!curr || !prev || curr.value === undefined || prev.value === undefined) return null;
      const c = parseFloat(curr.value);
      const p = parseFloat(prev.value);
      if (isNaN(c) || isNaN(p) || c === p) return null;
      return c > p ? 'up' : 'down';
    },
    getRelativeTime(name) {
      // eslint-disable-next-line no-unused-vars
      const _ = this.timeRefreshKey;
      const item = this.valuesMap[name];
      if (!item || !item.ts) return '';
      return dayjs(item.ts * 1000).fromNow();
    },
    reload() {
      const newMap = {};
      this.things.forEach(item => {
        const data = getValue(this.data, item.name, undefined);
        if (data) {
          newMap[item.name] = { ts: data.ts, value: data.value };
        }
      });
      this.prevValuesMap = { ...this.valuesMap };
      this.valuesMap = newMap;
      this.triggerFlash(newMap);
    },
    triggerFlash(newMap) {
      Object.keys(newMap).forEach(name => {
        const prev = this.prevValuesMap[name];
        const curr = newMap[name];
        if (!prev || prev.value !== curr.value) {
          this.$set(this.flashMap, name, true);
          setTimeout(() => {
            this.$set(this.flashMap, name, false);
          }, 600);
        }
      });
    },
    sendCmd(name, value, format) {
      this.$emit("sendData", name, value, format);
    }
  },
  watch: {
    device: {
      immediate: true,
      handler() {
        // device 可能在挂载时就已存在（父组件异步加载后一次性赋值），
        // 必须用 immediate 处理初始值，否则 category 为空会导致
        // 控制按钮（DefaultBtnBox）的 v-if 判断失败而不渲染。
        if (!this.device || !this.device.product) return;
        const product = this.device.product;
        this.category = product.category;
        const thing = Array.isArray(product.thing) ? product.thing : [];
        this.things = thing.filter(item => item.access === "rw" || item.access === "read");
        this.currentPage = 1;
      }
    },
    data() {
      this.reload();
    }
  }
};
</script>

<style lang="scss" scoped>
.thing-box {
  &-btn {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 12px;
  }
}

.thing-row {
  flex-wrap: wrap;
}

.thing-pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 4px;
}

.thing-card {
  padding: 14px 16px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.025);
  transition: background 0.2s;
  height: 100%;

  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }

  &--flash {
    animation: cardFlash 0.6s ease;
  }

  &__header {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 10px;
  }

  &__name {
    font-size: 13px;
    font-weight: 500;
    opacity: 0.6;
  }

  &__unit {
    font-size: 11px;
    opacity: 0.4;
  }

  &__icon {
    margin-left: auto;
    font-size: 20px;
    opacity: 0.3;
  }

  &__body {
    display: flex;
    align-items: baseline;
    gap: 4px;
    min-width: 0;
  }

  &__value {
    font-size: 28px;
    font-weight: 600;
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif;
    letter-spacing: -0.02em;
    line-height: 1.2;
    min-width: 0;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__trend {
    font-size: 14px;

    &.trend--up {
      color: #34c759;
    }
    &.trend--down {
      color: #ff3b30;
    }
  }

  &__time {
    margin-top: 6px;
    font-size: 11px;
    opacity: 0.35;
  }
}

@keyframes cardFlash {
  0% { background: rgba(0, 113, 227, 0.08); }
  100% { background: rgba(0, 0, 0, 0.025); }
}
</style>

<style lang="scss">
.theme-dark,
.theme-dark-blue,
.theme-green {
  .thing-card {
    background: rgba(255, 255, 255, 0.04);

    &:hover {
      background: rgba(255, 255, 255, 0.07);
    }
  }

  @keyframes cardFlash {
    0% { background: rgba(41, 151, 255, 0.12); }
    100% { background: rgba(255, 255, 255, 0.04); }
  }
}
</style>
