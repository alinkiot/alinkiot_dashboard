<template>
  <agent-access-wizard
    title="设备控制"
    subtitle="让智能体以应用身份查询或控制设备"
    risk="high"
    :steps="steps"
    :current="currentStep"
    :foot-info="footInfo"
    :risk-tips="riskTips"
    :help-tips="helpTips"
    :risk-notice="riskNotice"
    @prev="prevStep"
    @next="nextStep"
  >
    <!-- 1. 选择上下文 -->
    <div v-show="currentStep === 1">
      <h3 class="section-title">以哪个应用的身份操作？</h3>
      <p class="section-desc">智能体将以所选应用的权限访问平台，请先确认项目与应用。</p>
      <div class="field-grid">
        <div class="field">
          <label>
            所属项目
            <span v-if="projectLocked" class="lock-note">
              <i class="el-icon-lock" />
              由当前项目上下文决定
            </span>
          </label>
          <el-select
            v-model="projectId"
            placeholder="请选择项目"
            filterable
            :disabled="projectLocked"
            title="由当前项目上下文决定，退出项目后可切换"
            @change="handleProjectChange"
          >
            <el-option
              v-for="item in projectOptions"
              :key="item.id"
              :label="item.title"
              :value="item.id"
            />
          </el-select>
        </div>
        <div class="field">
          <label>应用</label>
          <el-select
            v-model="appId"
            placeholder="请选择应用"
            filterable
            :loading="appLoading"
            no-data-text="该项目下没有应用"
          >
            <el-option
              v-for="item in appOptions"
              :key="item.id"
              :label="item.name + ' · ' + item.appid"
              :value="item.id"
            />
          </el-select>
          <div v-if="!appLoading && projectId && !appOptions.length" class="empty-note">
            该项目暂无应用。请到「工程项目 / 应用接入」创建后返回。
          </div>
        </div>
      </div>
      <div class="summary">
        <span>当前接入</span>
        <span class="sep">·</span>
        <span>项目：<b>{{ currentProject ? currentProject.title : '未选择' }}</b></span>
        <span class="sep">·</span>
        <span>应用：<b>{{ currentApp ? currentApp.name : '未选择' }}</b></span>
      </div>
    </div>

    <!-- 2. 配置权限 -->
    <div v-show="currentStep === 2">
      <h3 class="section-title">给智能体多大权限？</h3>
      <p class="section-desc">权限范围会写进提示词：选择只读时，提示词里不会出现控制指令。</p>
      <div class="radio-row">
        <div
          v-for="item in scopes"
          :key="item.value"
          :class="['radio-card', { selected: scope === item.value }]"
          @click="scope = item.value"
        >
          <b>{{ item.label }}</b>
          <span>{{ item.desc }}</span>
        </div>
      </div>
      <div class="toggle-row">
        <el-switch v-model="confirmControl" active-color="#34c759" />
        <span>控制指令需我逐条确认 <span class="hint">（建议保持开启）</span></span>
      </div>
      <div class="summary">
        <span>数据范围</span>
        <span class="sep">·</span>
        <span>项目：<b>{{ currentProject ? currentProject.title : '未选择' }}</b></span>
        <span class="sep">·</span>
        <span>权限：<b>{{ scope === 'read' ? '只读查询' : '查询 + 设备控制' }}</b></span>
      </div>
    </div>

    <!-- 3. 获取接入包 -->
    <div v-show="currentStep === 3">
      <h3 class="section-title">下载 SKILL，然后复制提示词</h3>
      <p class="section-desc">SKILL 里的 env.ini 会用到下面的接入凭证。</p>
      <agent-credential
        title="接入凭证"
        :host="apiHost"
        :app-id="currentApp ? currentApp.appid : ''"
        :secret="currentSecret"
        :prompt="prompt"
        :chips="chips"
        skill-name="uzyiot-api"
        @download-skill="downloadSkill('uzyiot-api')"
      />
      <div class="agent-tip">
        使用步骤：1. 下载 <code>uzyiot-api.zip</code> 并解压；2. 在 skill 目录新建 <code>env.ini</code>，填入上面的 host / appId / Secret；3. 把提示词发给智能体。
      </div>
    </div>

    <!-- 4. 验证与收尾 -->
    <div v-show="currentStep === 4">
      <h3 class="section-title">确认智能体真的连上了</h3>
      <p class="section-desc">先做一次只读试连，再决定是否下发控制指令。</p>
      <div class="progress-line">已完成 {{ checklistDone }} / {{ checklist.length }}</div>
      <div class="checklist">
        <el-checkbox v-model="checklist[0]">
          已安装 SKILL 并写入 env.ini
          <div class="check-hint">host / appId / Secret 三项都要填对</div>
        </el-checkbox>
        <el-checkbox v-model="checklist[1]">
          已复制提示词，智能体确认了项目与设备范围
          <div class="check-hint">应能列出当前项目下的设备</div>
        </el-checkbox>
        <el-checkbox v-model="checklist[2]">
          试连成功
          <div class="check-hint">先只读查询，确认返回的是预期设备</div>
        </el-checkbox>
      </div>
      <div class="btn-row">
        <el-button size="small" icon="el-icon-document-copy" @click="copyTestPrompt">
          复制只读试连指令
        </el-button>
        <span class="hint">发给智能体，返回设备列表后再勾选第三项</span>
      </div>
      <div class="empty-note">
        控制指令误操作怎么办？到「应用接入」更换 Secret 可立即阻断该应用的访问。
      </div>
    </div>
  </agent-access-wizard>
</template>

<script>
import agentAccess from '../agent/mixins/agentAccess'
import AgentAccessWizard from '../agent/components/AgentAccessWizard.vue'
import AgentCredential from '../agent/components/AgentCredential.vue'

// SKILL 包是 public 下的静态文件，由 build/skill-zip.sh 生成
const SKILL_NAME = 'uzyiot-api'

export default {
  name: 'AgentControl',
  components: { AgentAccessWizard, AgentCredential },
  mixins: [agentAccess],
  data() {
    return {
      steps: ['选择上下文', '配置权限', '获取接入包', '验证与收尾'],
      footText: [
        '请先确认项目与应用',
        '选择只读或可控制范围',
        '下载 SKILL 后复制提示词',
        '建议先做只读试连'
      ],
      scopes: [
        { value: 'read', label: '只读查询', desc: '查询项目、场景、设备与历史数据；不能下发控制' },
        { value: 'write', label: '查询 + 设备控制', desc: '可下发设备控制指令，误操作会影响现场设备' }
      ],
      scope: 'read',
      confirmControl: true,
      checklist: [false, false, false],
      chips: ['权限范围', 'appId', 'Secret'],
      riskTips: [
        '选择「查询 + 设备控制」后，智能体可以下发控制指令',
        '建议开启「控制指令需我逐条确认」',
        '权限范围由应用的 Secret 决定，换 Secret 可立即阻断'
      ],
      helpTips: [
        '只读模式下智能体不会调用控制接口',
        '应用权限不足时，先到「应用接入」调整授权范围',
        '试连只做查询，不改变设备状态'
      ],
      riskNotice: '现场设备可能因错误指令停机。控制类指令请逐条核对设备与参数。'
    }
  },
  computed: {
    footInfo() {
      return '第 ' + this.currentStep + ' 步 / 共 4 步 · ' + this.footText[this.currentStep - 1]
    },
    checklistDone() {
      return this.checklist.filter(Boolean).length
    },
    scopeText() {
      if (this.scope === 'read') {
        return '只允许查询项目、场景、设备与历史数据，不要调用任何控制接口。'
      }
      return '允许查询数据，并可下发设备控制指令；' +
        (this.confirmControl ? '每条控制指令执行前必须先向我确认。' : '控制指令可直接执行，无需再次确认。')
    },
    prompt() {
      const app = this.currentApp || {}
      return [
        '请使用 ' + SKILL_NAME + ' skill 操作 ALinkIOT 平台，查询项目、场景、设备和数据，或下发设备控制。',
        '如果还没有 ' + SKILL_NAME + ' skill，先从 ' + this.zipUrl(SKILL_NAME) + ' 下载，解压后把 ' + SKILL_NAME + ' 目录放入 skills 目录。',
        '在 skill 目录下新建 env.ini，内容如下：',
        'host=' + this.apiHost,
        'appId=' + (app.appid || ''),
        'Secret=' + (app.secret || ''),
        '权限范围：' + this.scopeText,
        '登录后先确认所属项目和可访问的设备，然后等待我的指令。'
      ].join('\n')
    }
  },
  methods: {
    nextStep() {
      if (this.currentStep === 4) {
        this.$modal.msgSuccess('接入清单已记录')
        return
      }
      this.goNextStep()
    },
    copyTestPrompt() {
      const project = this.currentProject ? this.currentProject.title : '当前项目'
      const text = '请只做一次只读查询：列出 ALinkIOT 项目「' + project + '」下的设备名称与在线状态，不要下发任何控制指令。'
      this.copyText(text, '已复制只读试连指令')
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
.lock-note {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: 6px;
  padding: 2px 6px;
  border-radius: 5px;
  background: rgba(255, 159, 10, 0.12);
  color: #a65d00;
  font-size: 11px;
  font-weight: 400;
}
.empty-note {
  margin-top: 7px;
  padding: 8px 10px;
  border: 1px dashed var(--ui-border);
  border-radius: 6px;
  background: var(--ui-surface-2);
  font-size: 11px;
  color: var(--ui-text-secondary);
}
.summary {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 18px;
  padding: 12px 14px;
  border-radius: 8px;
  background: var(--ui-surface-2);
  font-size: 12px;
  color: var(--ui-text-secondary);
}
.summary b {
  color: var(--ui-text-primary);
}
.sep {
  color: var(--ui-text-tertiary);
}
.radio-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.radio-card {
  flex: 1;
  min-width: 200px;
  padding: 14px;
  border: 1px solid var(--ui-border);
  border-radius: 10px;
  cursor: pointer;
  transition: border-color 0.15s;
}
.radio-card:hover {
  border-color: #0071e3;
}
.radio-card.selected {
  border-color: #0071e3;
  background: rgba(0, 113, 227, 0.08);
  box-shadow: inset 0 0 0 1px #0071e3;
}
.radio-card b {
  display: block;
  margin-bottom: 4px;
  font-size: 13px;
}
.radio-card span {
  font-size: 11px;
  color: var(--ui-text-secondary);
}
.toggle-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 16px;
  font-size: 13px;
}
.agent-tip {
  margin-top: 14px;
  font-size: 12px;
  line-height: 1.7;
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
.btn-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 16px;
}
@media (max-width: 760px) {
  .field-grid {
    grid-template-columns: 1fr;
  }
}
</style>
