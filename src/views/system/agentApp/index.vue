<template>
  <agent-access-wizard
    title="应用生成"
    subtitle="按平台设备数据，让智能体生成一个独立的 Python + MySQL 物联网应用"
    risk="mid"
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
      <h3 class="section-title">这次接入使用哪个应用？</h3>
      <p class="section-desc">提示词会带上所选应用的 AppID 和 Secret，请先确认项目与应用无误。</p>
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
          <label>数据来源应用</label>
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

    <!-- 2. 填写需求 -->
    <div v-show="currentStep === 2">
      <h3 class="section-title">先告诉智能体你要什么</h3>
      <p class="section-desc">这些信息会写进提示词，避免你对着空白文本框现编需求。</p>
      <div class="field-grid">
        <div class="field">
          <label>应用名称</label>
          <el-input v-model="form.name" placeholder="例如：滨江设备同步应用" />
        </div>
        <div class="field">
          <label>场景模板</label>
          <el-select v-model="form.scene">
            <el-option v-for="item in scenes" :key="item" :label="item" :value="item" />
          </el-select>
        </div>
        <div class="field">
          <label>设备规模</label>
          <el-select v-model="form.scale">
            <el-option v-for="item in scales" :key="item" :label="item" :value="item" />
          </el-select>
        </div>
        <div class="field">
          <label>数据库位置</label>
          <el-select v-model="form.db">
            <el-option v-for="item in databases" :key="item" :label="item" :value="item" />
          </el-select>
        </div>
        <div class="field full">
          <label>补充说明 <span class="hint">选填</span></label>
          <el-input
            v-model="form.note"
            type="textarea"
            :rows="3"
            placeholder="例如：每 5 分钟同步一次设备数据，保留最近 30 天"
          />
        </div>
      </div>
    </div>

    <!-- 3. 获取接入包 -->
    <div v-show="currentStep === 3">
      <h3 class="section-title">下载 SKILL，然后复制提示词</h3>
      <p class="section-desc">先把 SKILL 放进智能体的 skills 目录，再粘贴提示词。</p>
      <agent-credential
        title="接入凭证"
        :app-id="currentApp ? currentApp.appid : ''"
        :secret="currentSecret"
        :prompt="prompt"
        :chips="chips"
        skill-name="alinkiot-app"
        @download-skill="downloadSkill('alinkiot-app')"
      />
      <div class="agent-tip">
        使用步骤：1. 下载 <code>alinkiot-app.zip</code> 并解压，把 <code>alinkiot-app</code> 目录放入智能体的 skills 目录；
        2. 复制上面的提示词发给智能体。生成的应用依赖 <code>uzyiot-api</code> skill 对接设备数据。
      </div>
    </div>

    <!-- 4. 验证与收尾 -->
    <div v-show="currentStep === 4">
      <h3 class="section-title">接入清单</h3>
      <p class="section-desc">三项都完成后，智能体就会按你的需求开始询问细节。</p>
      <div class="progress-line">已完成 {{ checklistDone }} / {{ checklist.length }}</div>
      <div class="checklist">
        <el-checkbox v-model="checklist[0]">
          已下载并解压 <b>alinkiot-app.zip</b>
          <div class="check-hint">把 alinkiot-app 目录放进智能体的 skills 目录</div>
        </el-checkbox>
        <el-checkbox v-model="checklist[1]">
          已复制提示词发给智能体
          <div class="check-hint">提示词含密钥，不要粘贴到公开群聊</div>
        </el-checkbox>
        <el-checkbox v-model="checklist[2]">
          智能体已回复确认需求
          <div class="check-hint">它会先确认产品、设备类型和规模</div>
        </el-checkbox>
      </div>
      <div class="empty-note">
        密钥泄露了？到「工程项目 / 应用接入」更换 Secret，旧提示词立即失效。
      </div>
    </div>
  </agent-access-wizard>
</template>

<script>
import agentAccess from '../agent/mixins/agentAccess'
import AgentAccessWizard from '../agent/components/AgentAccessWizard.vue'
import AgentCredential from '../agent/components/AgentCredential.vue'

// SKILL 包是 public 下的静态文件，由 build/skill-zip.sh 生成
const SKILL_NAME = 'alinkiot-app'
// 平台接口协议由 uzyiot-api SKILL 描述，生成的应用按它对接设备数据
const API_SKILL_NAME = 'uzyiot-api'

export default {
  name: 'AgentApp',
  components: { AgentAccessWizard, AgentCredential },
  mixins: [agentAccess],
  data() {
    return {
      steps: ['选择上下文', '填写需求', '获取接入包', '验证与收尾'],
      footText: [
        '请先确认项目与应用',
        '补充要生成的应用需求',
        '下载 SKILL 后复制提示词',
        '三项完成即可交给智能体'
      ],
      scenes: ['设备数据同步', '告警分析', '数据看板'],
      scales: ['1–50 台', '51–500 台', '500 台以上'],
      databases: ['平台内置 MySQL', '自建 MySQL', '待定，让智能体建议'],
      form: {
        name: '',
        scene: '设备数据同步',
        scale: '1–50 台',
        db: '平台内置 MySQL',
        note: ''
      },
      checklist: [false, false, false],
      chips: ['项目', 'appId', 'Secret', 'host'],
      riskTips: [
        '提示词包含 AppID 与 Secret，持有者可以此应用身份查询数据、下发控制',
        '只发给可信的智能体，不要粘贴到公开群聊或截图',
        '用完或怀疑泄露，到「应用接入」更换 Secret'
      ],
      helpTips: [
        '按平台接口读取项目下的产品、设备与数据',
        '生成一个独立的 Python + MySQL 应用',
        '不会修改平台侧配置'
      ],
      riskNotice: 'Secret 默认遮蔽。点「显示」仅在本页展开；点「复制」复制的是完整值。'
    }
  },
  computed: {
    footInfo() {
      return '第 ' + this.currentStep + ' 步 / 共 4 步 · ' + this.footText[this.currentStep - 1]
    },
    checklistDone() {
      return this.checklist.filter(Boolean).length
    },
    prompt() {
      const app = this.currentApp || {}
      const project = this.currentProject ? this.currentProject.title : ''
      const requirement = [
        this.form.name ? '应用名称：' + this.form.name : '',
        '场景模板：' + this.form.scene,
        '设备规模：' + this.form.scale,
        '数据库位置：' + this.form.db,
        this.form.note ? '补充说明：' + this.form.note : ''
      ].filter(Boolean).join('；')
      return [
        '请使用 ' + SKILL_NAME + ' skill 为 ALinkIOT 项目「' + project + '」生成一个 Python + MySQL 物联网应用。',
        '如果还没有 ' + SKILL_NAME + ' skill，先从 ' + this.zipUrl(SKILL_NAME) + ' 下载，解压后把 ' + SKILL_NAME + ' 目录放入 skills 目录。',
        '设备数据来源是 ALinkIOT 平台的 HTTP API，接口协议参考 ' + API_SKILL_NAME + ' skill（' + this.zipUrl(API_SKILL_NAME) + '）：',
        'host=' + this.apiHost,
        'appId=' + (app.appid || ''),
        'Secret=' + (app.secret || ''),
        '需求：' + requirement,
        '先确认项目下的产品、设备类型和规模，再按 skill 的流程询问我其他需求。'
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
.field.full {
  grid-column: 1 / -1;
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
@media (max-width: 760px) {
  .field-grid {
    grid-template-columns: 1fr;
  }
}
</style>
