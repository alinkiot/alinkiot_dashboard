<template>
  <div class="app-container agent-page">
    <div class="agent-page-head">
      <div class="agent-head-text">
        <h2>{{ title }}</h2>
        <p>{{ subtitle }}</p>
      </div>
      <span :class="['agent-risk', 'risk-' + risk]">
        <i class="el-icon-warning-outline" />
        {{ riskText }}
      </span>
    </div>

    <div class="agent-workbench">
      <el-card class="agent-main" shadow="never">
        <ol class="agent-steps">
          <li
            v-for="(step, index) in steps"
            :key="step"
            :class="{ active: current === index + 1, done: current > index + 1 }"
          >
            <span class="step-num">{{ current > index + 1 ? '✓' : index + 1 }}</span>
            <span class="step-label">{{ step }}</span>
          </li>
        </ol>

        <div class="agent-step-body">
          <slot />
        </div>

        <div class="agent-foot">
          <span class="foot-info">{{ footInfo }}</span>
          <div class="foot-actions">
            <el-button size="small" :disabled="current <= 1" @click="$emit('prev')">上一步</el-button>
            <el-button size="small" type="primary" @click="$emit('next')">
              {{ current === steps.length ? '完成' : '下一步' }}
            </el-button>
          </div>
        </div>
      </el-card>

      <aside class="agent-aside">
        <el-card shadow="never" class="aside-card">
          <div slot="header">安全须知</div>
          <ul class="aside-list">
            <li v-for="tip in riskTips" :key="tip">{{ tip }}</li>
          </ul>
          <div v-if="riskNotice" class="aside-notice" :class="{ crit: risk === 'crit' }">
            {{ riskNotice }}
          </div>
        </el-card>
        <el-card shadow="never" class="aside-card">
          <div slot="header">接入说明</div>
          <ul class="aside-list">
            <li v-for="tip in helpTips" :key="tip">{{ tip }}</li>
          </ul>
          <slot name="aside-bottom" />
        </el-card>
      </aside>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AgentAccessWizard',
  props: {
    title: {
      type: String,
      required: true
    },
    subtitle: {
      type: String,
      default: ''
    },
    risk: {
      type: String,
      default: 'mid'
    },
    steps: {
      type: Array,
      required: true
    },
    current: {
      type: Number,
      default: 1
    },
    footInfo: {
      type: String,
      default: ''
    },
    riskTips: {
      type: Array,
      default: () => []
    },
    helpTips: {
      type: Array,
      default: () => []
    },
    riskNotice: {
      type: String,
      default: ''
    }
  },
  computed: {
    riskText() {
      const map = {
        mid: '中风险 · 含应用密钥',
        high: '高风险 · 可下发控制指令',
        crit: '极高风险 · 任意代码执行'
      }
      return map[this.risk] || map.mid
    }
  }
}
</script>

<style lang="scss" scoped>
.agent-page {
  max-width: 1320px;
  margin: 0 auto;
}
.agent-page-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 18px;
}
.agent-head-text h2 {
  margin: 0 0 6px;
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--ui-text-primary);
}
.agent-head-text p {
  margin: 0;
  font-size: 13px;
  color: var(--ui-text-secondary);
}
.agent-risk {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 980px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}
.risk-mid {
  background: rgba(255, 159, 10, 0.14);
  color: #a65d00;
}
.risk-high {
  background: rgba(255, 59, 48, 0.12);
  color: #c02d26;
}
.risk-crit {
  background: #ff3b30;
  color: #fff;
}
.agent-workbench {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 284px;
  gap: 20px;
  align-items: start;
}
.agent-main {
  min-width: 0;
}
.agent-steps {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 18px 20px;
  border-bottom: 1px solid var(--ui-border);
  overflow-x: auto;
}
.agent-steps li {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: max-content;
  font-size: 12px;
  color: var(--ui-text-tertiary);
}
.agent-steps li::after {
  content: '';
  height: 1px;
  flex: 1;
  margin: 0 10px;
  min-width: 12px;
  background: var(--ui-border);
}
.agent-steps li:last-child::after {
  display: none;
}
.step-num {
  width: 22px;
  height: 22px;
  flex: none;
  border-radius: 50%;
  border: 1px solid var(--ui-border);
  display: grid;
  place-items: center;
  font-size: 11px;
  font-weight: 600;
}
.agent-steps li.active {
  color: #0071e3;
  font-weight: 600;
}
.agent-steps li.active .step-num {
  background: #0071e3;
  border-color: #0071e3;
  color: #fff;
}
.agent-steps li.done {
  color: var(--ui-text-secondary);
}
.agent-steps li.done .step-num {
  background: rgba(52, 199, 89, 0.14);
  border-color: transparent;
  color: #248a3d;
}
.agent-step-body {
  padding: 22px 20px;
}
.agent-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid var(--ui-border);
}
.foot-info {
  font-size: 12px;
  color: var(--ui-text-tertiary);
}
.foot-actions {
  display: flex;
  gap: 8px;
}
.agent-aside {
  position: sticky;
  top: 76px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.aside-card ::v-deep  .el-card__header {
  padding: 12px 16px;
  font-size: 13px;
  font-weight: 600;
  color: var(--ui-text-primary);
}
.aside-card ::v-deep  .el-card__body {
  padding: 16px;
}
.aside-list {
  margin: 0;
  padding-left: 17px;
  font-size: 12px;
  line-height: 1.8;
  color: var(--ui-text-secondary);
}
.aside-list li {
  margin-bottom: 6px;
}
.aside-notice {
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  background: var(--ui-surface-2);
  font-size: 11px;
  line-height: 1.7;
  color: var(--ui-text-secondary);
}
.aside-notice.crit {
  background: rgba(255, 59, 48, 0.08);
  color: #a82c25;
}
@media (max-width: 1100px) {
  .agent-workbench {
    grid-template-columns: 1fr;
  }
  .agent-aside {
    position: static;
    flex-direction: row;
  }
  .aside-card {
    flex: 1;
  }
}
@media (max-width: 760px) {
  .agent-aside {
    flex-direction: column;
  }
  .step-label {
    display: none;
  }
}
</style>
