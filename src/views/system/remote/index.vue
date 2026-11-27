<template>
  <agent-access-wizard
    title="远程运维"
    subtitle="临时开放后端节点调试通道，排查完立即关闭"
    risk="crit"
    :steps="steps"
    :current="currentStep"
    :foot-info="footInfo"
    :risk-tips="riskTips"
    :help-tips="helpTips"
    :risk-notice="riskNotice"
    @prev="prevStep"
    @next="nextStep"
  >
    <!-- 1. 启动通道 -->
    <div v-show="currentStep === 1">
      <h3 class="section-title">这是一个临时调试通道</h3>
      <p class="section-desc">启动后，持有令牌的人可以在后端节点执行任意代码。只在排查问题时开启，用完立即停止。</p>
      <div class="field-grid">
        <div class="field">
          <label>有效期</label>
          <el-select v-model="hours" :disabled="status.enable">
            <el-option
              v-for="item in hourOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
          <span class="hint">到期自动失效；节点重启后令牌也会失效</span>
        </div>
        <div class="field">
          <label>通道状态</label>
          <div class="state-box">
            <span :class="['state-dot', { on: status.enable }]" />
            <b>{{ status.enable ? '已启动' : '未启动' }}</b>
          </div>
        </div>
      </div>
      <el-checkbox v-model="acknowledged" class="ack-check">
        我确认仅在排查问题时开启，排查完会立即停止
      </el-checkbox>
      <div class="btn-row">
        <el-button
          type="primary"
          icon="el-icon-video-play"
          :loading="loading"
          :disabled="status.enable"
          @click="handleStart"
        >启动通道</el-button>
        <span v-if="status.enable" class="hint">通道已启动，点「下一步」查看连接信息</span>
      </div>
    </div>

    <!-- 2. 获取连接信息 -->
    <div v-show="currentStep === 2">
      <h3 class="section-title">连接信息与令牌</h3>
      <p class="section-desc">令牌默认遮蔽；复制时复制完整值，请勿粘贴到公开渠道。</p>
      <template v-if="status.enable">
        <div class="status-hero">
          <span class="state-dot on" />
          <div class="status-text">
            <b>通道已启动</b>
            <small>到期时间：{{ formatTime(status.expireAt) }}</small>
          </div>
          <div class="countdown">
            <b>{{ countdownText }}</b>
            <small>剩余时间</small>
            <div class="progress-track"><div class="progress-fill" :style="{ width: progressWidth }" /></div>
          </div>
        </div>
        <agent-credential
          title="连接参数"
          :host="endpoint.host"
          :port="endpoint.port"
          :token="status.token"
          :prompt="prompt"
          :chips="chips"
          skill-name="erl-cli"
          @download-skill="downloadSkill('erl-cli')"
        />
        <div class="btn-row">
          <el-button size="small" icon="el-icon-refresh" @click="handleRegen">重新生成令牌</el-button>
          <el-button size="small" type="danger" icon="el-icon-switch-button" @click="handleStop">立即停止</el-button>
        </div>
        <div class="agent-tip">
          使用步骤：1. 下载 <code>erl-cli.zip</code> 并解压，把 <code>erl-cli</code> 目录放入智能体的 skills 目录；
          2. 复制上面的提示词发给智能体。
        </div>
      </template>
      <div v-else class="empty-note">通道未启动。确认风险后回到上一步启动，才能获取连接参数。</div>
    </div>

    <!-- 3. 交给智能体 -->
    <div v-show="currentStep === 3">
      <h3 class="section-title">交给智能体</h3>
      <p class="section-desc">建议先让智能体做一次节点概览，确认连的是预期节点。</p>
      <div class="progress-line">已完成 {{ checklistDone }} / {{ checklist.length }}</div>
      <div class="checklist">
        <el-checkbox v-model="checklist[0]">
          已安装 erl-cli SKILL
          <div class="check-hint">解压后把 erl-cli 目录放进 skills 目录</div>
        </el-checkbox>
        <el-checkbox v-model="checklist[1]">
          智能体已返回节点概览
          <div class="check-hint">确认节点名与集群状态符合预期</div>
        </el-checkbox>
      </div>
      <div class="empty-note">
        排查结束后，务必回到这里停止通道；不要依赖到期自动失效。
      </div>
      <div class="btn-row">
        <el-button size="small" type="danger" icon="el-icon-switch-button" @click="handleStop">立即停止</el-button>
      </div>
    </div>

    <!-- 4. 用完停止 -->
    <div v-show="currentStep === 4">
      <h3 class="section-title">最近连接记录</h3>
      <p class="section-desc">停止后令牌立即失效；已建立的连接最长 5 分钟内断开。</p>
      <el-table :data="logs" size="mini" border>
        <el-table-column prop="time" label="时间" min-width="150" />
        <el-table-column prop="client" label="来源" min-width="110" />
        <el-table-column prop="commands" label="命令数" min-width="80" />
        <el-table-column label="结果" min-width="90">
          <template slot-scope="scope">
            <span>{{ scope.row.result }}</span>
          </template>
        </el-table-column>
        <template slot="empty">暂无连接记录</template>
      </el-table>
      <div class="btn-row">
        <el-button type="danger" icon="el-icon-switch-button" :disabled="!status.enable" @click="handleStop">
          停止通道
        </el-button>
      </div>
    </div>
  </agent-access-wizard>
</template>

<script>
import { getRemoteStatus, startRemote, stopRemote } from '@/api/system/remote'
import agentCopy from '../agent/mixins/agentCopy'
import AgentAccessWizard from '../agent/components/AgentAccessWizard.vue'
import AgentCredential from '../agent/components/AgentCredential.vue'

export default {
  name: 'Remote',
  components: { AgentAccessWizard, AgentCredential },
  mixins: [agentCopy],
  data() {
    return {
      steps: ['启动通道', '获取连接信息', '交给智能体', '用完停止'],
      footText: [
        '通道未启动，确认后点启动',
        '令牌默认遮蔽，复制的是完整值',
        '先让智能体确认节点概览',
        '排查完请立即停止通道'
      ],
      hourOptions: [
        { label: '1 小时', value: 1 },
        { label: '8 小时', value: 8 },
        { label: '24 小时', value: 24 },
        { label: '72 小时', value: 72 },
        { label: '168 小时', value: 168 }
      ],
      chips: ['host', 'port', 'token'],
      riskTips: [
        '此通道等同在后端节点执行任意代码',
        '只在排查时开启，用完立即停止',
        '令牌只存内存，节点重启后失效',
        '重新生成会让旧令牌马上失效'
      ],
      helpTips: [
        '先让智能体执行节点概览，确认目标正确',
        '排查过程中保留命令记录，便于复盘',
        '连接不上时优先检查令牌是否已轮换或到期'
      ],
      riskNotice: '不要把令牌或含令牌的提示词粘贴到公开群聊、工单或截图里。',
      loading: false,
      hours: 24,
      status: { enable: false },
      acknowledged: false,
      currentStep: 1,
      remainingMs: 0,
      checklist: [false, false, false],
      logs: [],
      timer: null
    }
  },
  computed: {
    // 连接地址与后端接口同源：线上经 nginx 反代 /debug；开发环境直连后端地址
    endpoint() {
      const base = process.env.VUE_APP_BASE_API || ''
      const url = /^https?:\/\//.test(base) ? new URL(base) : location
      return {
        host: url.hostname,
        port: url.port || (url.protocol === 'https:' ? '443' : '80')
      }
    },
    prompt() {
      if (!this.status.enable) return ''
      return [
        '请使用 erl-cli skill 通过 WebSocket 连接远程 ALinkIOT 节点进行调试。',
        '如果还没有 erl-cli skill，先从 ' + this.zipUrl('erl-cli') + ' 下载，解压后把 erl-cli 目录放入 skills 目录。',
        '连接参数：',
        '- host: ' + this.endpoint.host,
        '- port: ' + this.endpoint.port,
        '- token: ' + (this.status.token || ''),
        '令牌到期时间：' + this.formatTime(this.status.expireAt),
        '连接后先执行节点概览检查，确认当前节点和集群情况，然后等待我的调试指令。'
      ].join('\n')
    },
    footInfo() {
      return '第 ' + this.currentStep + ' 步 / 共 4 步 · ' + this.footText[this.currentStep - 1]
    },
    checklistDone() {
      return this.checklist.filter(Boolean).length
    },
    countdownText() {
      const left = Math.max(0, this.remainingMs)
      const hours = Math.floor(left / 3600000)
      const minutes = Math.floor((left % 3600000) / 60000)
      const seconds = Math.floor((left % 60000) / 1000)
      return [hours, minutes, seconds].map(item => String(item).padStart(2, '0')).join(':')
    },
    progressWidth() {
      const total = this.hours * 3600000
      if (!total) return '0%'
      return Math.max(0, Math.min(100, (this.remainingMs / total) * 100)) + '%'
    }
  },
  created() {
    this.getStatus()
    this.timer = setInterval(() => this.tick(), 1000)
  },
  beforeDestroy() {
    if (this.timer) clearInterval(this.timer)
  },
  methods: {
    getStatus() {
      this.loading = true
      getRemoteStatus().then(res => {
        this.status = res.data || { enable: false }
        if (this.status.enable) this.currentStep = 2
        this.tick()
      }).finally(() => {
        this.loading = false
      })
    },
    handleStart() {
      if (!this.acknowledged) {
        this.$modal.msgWarning('请先勾选风险确认')
        return
      }
      this.loading = true
      startRemote(this.hours).then(res => {
        this.status = res.data
        this.acknowledged = false
        this.tick()
        this.currentStep = 2
        this.$modal.msgSuccess('通道已启动')
      }).finally(() => {
        this.loading = false
      })
    },
    handleRegen() {
      this.$modal.confirm('重新生成后旧令牌立即失效，正在使用的智能体会断开。是否继续？').then(() => {
        this.loading = true
        return startRemote(this.hours)
      }).then(res => {
        this.status = res.data
        this.tick()
        this.$modal.msgSuccess('已生成新令牌，旧令牌已失效')
      }).catch(() => {}).finally(() => {
        this.loading = false
      })
    },
    handleStop() {
      this.$modal.confirm('停止后令牌立即失效，已建立的连接最长 5 分钟内断开，正在执行的调试会中断。确认停止吗？').then(() => {
        this.loading = true
        return stopRemote()
      }).then(() => {
        this.status = { enable: false }
        this.remainingMs = 0
        this.acknowledged = false
        this.currentStep = 1
        this.$modal.msgSuccess('已停止')
      }).catch(() => {}).finally(() => {
        this.loading = false
      })
    },
    formatTime(seconds) {
      return seconds ? this.parseTime(seconds * 1000) : '-'
    },
    tick() {
      if (!this.status.enable || !this.status.expireAt) {
        this.remainingMs = 0
        return
      }
      const left = this.status.expireAt * 1000 - Date.now()
      if (left <= 0) {
        this.status = { enable: false }
        this.remainingMs = 0
        this.currentStep = 1
        this.$modal.msgError('令牌已到期，通道自动关闭')
        return
      }
      this.remainingMs = left
    },
    nextStep() {
      if (this.currentStep === 1 && !this.status.enable) {
        this.$modal.msgWarning('请先启动通道')
        return
      }
      if (this.currentStep === 4) {
        this.$modal.msgSuccess('排查完成后请及时停止通道')
        return
      }
      if (this.currentStep < 4) this.currentStep++
    }
  }
}
</script>

<style lang="scss" scoped>
.section-title {
  margin: 0 0 4px;
  font-size: 14px;
  font-weight: 600;
  color: var(--ui-text-primary);
}
.section-desc {
  margin: 0 0 20px;
  font-size: 12px;
  color: var(--ui-text-secondary);
}
.field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 7px;
  min-width: 0;
}
.field label {
  font-size: 12px;
  font-weight: 600;
  color: var(--ui-text-secondary);
}
.hint {
  font-size: 11px;
  font-weight: 400;
  color: var(--ui-text-tertiary);
}
.state-box {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  padding: 0 12px;
  border-radius: 8px;
  background: var(--ui-surface-2);
  font-size: 13px;
}
.state-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #c7c7cc;
  flex: none;
}
.state-dot.on {
  background: #34c759;
  box-shadow: 0 0 0 5px rgba(52, 199, 89, 0.16);
}
.ack-check {
  display: block;
  margin-top: 18px;
  white-space: normal;
  height: auto;
}
.btn-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 16px;
}
.status-hero {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  border-radius: 10px;
  background: var(--ui-surface-2);
  margin-bottom: 14px;
}
.status-text b {
  display: block;
  font-size: 14px;
}
.status-text small {
  display: block;
  margin-top: 3px;
  font-size: 11px;
  color: var(--ui-text-secondary);
}
.countdown {
  margin-left: auto;
  text-align: right;
  min-width: 140px;
}
.countdown b {
  display: block;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 18px;
  letter-spacing: -0.02em;
}
.countdown small {
  font-size: 11px;
  color: var(--ui-text-tertiary);
}
.progress-track {
  height: 5px;
  margin-top: 6px;
  border-radius: 980px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.07);
}
.progress-fill {
  height: 100%;
  background: #34c759;
  transition: width 1s linear;
}
.empty-note {
  padding: 12px 14px;
  border: 1px dashed var(--ui-border);
  border-radius: 8px;
  background: var(--ui-surface-2);
  font-size: 12px;
  color: var(--ui-text-secondary);
}
.progress-line {
  margin-bottom: 12px;
  font-size: 12px;
  color: var(--ui-text-tertiary);
}
.checklist {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
}
.checklist ::v-deep  .el-checkbox {
  height: auto;
  align-items: flex-start;
  white-space: normal;
}
.check-hint {
  margin-top: 3px;
  font-size: 11px;
  color: var(--ui-text-tertiary);
}
.agent-tip {
  margin-top: 14px;
  font-size: 12px;
  line-height: 1.7;
  color: var(--ui-text-secondary);
}
@media (max-width: 760px) {
  .field-grid {
    grid-template-columns: 1fr;
  }
  .countdown {
    min-width: 110px;
  }
}
</style>
