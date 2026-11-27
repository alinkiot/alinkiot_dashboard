<template>
  <agent-access-wizard
    title="虚拟设备"
    subtitle="让智能体用设备的身份模拟接入，按产品协议上报数据"
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
    <!-- 1. 选择设备 -->
    <div v-show="currentStep === 1">
      <h3 class="section-title">模拟哪台设备？</h3>
      <p class="section-desc">
        先选产品，再选该产品下的设备。产品决定协议和物模型。
        <span v-if="projectLocked" class="lock-note">
          <i class="el-icon-lock" />
          只列出当前项目「{{ projectTitle }}」的设备
        </span>
      </p>
      <div class="field-grid">
        <div class="field">
          <label>产品</label>
          <el-select v-model="productId" placeholder="请选择产品" filterable @change="handleProductChange">
            <el-option v-for="item in productOptions" :key="item.id" :label="item.name" :value="item.id">
              <span>{{ item.name }}</span>
              <span class="option-sub">{{ item.protocol }}</span>
            </el-option>
          </el-select>
        </div>
        <div class="field">
          <label>设备</label>
          <el-select
            v-model="deviceId"
            :placeholder="productId ? '搜索设备名称' : '请先选择产品'"
            :disabled="!productId"
            filterable
            remote
            :remote-method="loadDevices"
            :loading="deviceLoading"
            no-data-text="该产品下没有设备"
          >
            <el-option v-for="item in deviceOptions" :key="item.id" :label="item.name" :value="item.id">
              <span>{{ item.name }}</span>
              <span class="option-sub">{{ item.addr }}</span>
            </el-option>
          </el-select>
        </div>
      </div>

      <div v-if="currentProduct" class="device-info">
        <div class="info-row">
          <span class="info-k">协议</span>
          <span>
            <b>{{ protocolId || '未设置' }}</b>
            <span :class="['support', protocolInfo.level]">{{ protocolInfo.supportText }}</span>
          </span>
        </div>
        <div class="info-row"><span class="info-k">上报方式</span><span>{{ protocolInfo.modeText }}</span></div>
        <div class="info-row"><span class="info-k">物模型</span><span>{{ thingCount }} 个数据点</span></div>
        <div v-if="currentDevice" class="info-row"><span class="info-k">设备</span><span>{{ currentDevice.name }} · {{ currentDevice.addr }}</span></div>
        <div v-if="isGateway" class="empty-note">该产品是网关，虚拟设备只模拟网关自身，不模拟子设备。</div>
      </div>
    </div>

    <!-- 2. 通讯方式 -->
    <div v-show="currentStep === 2">
      <h3 class="section-title">怎么连到平台？</h3>
      <p class="section-desc">通讯方式由协议决定，协议不支持的方式不能选。</p>
      <div class="sub-title">通讯方式</div>
      <div class="radio-row">
        <div
          v-for="item in transportOptions"
          :key="item.value"
          :class="['radio-card', { selected: transport === item.value, disabled: item.disabled }]"
          :title="item.disabled ? item.reason : ''"
          @click="selectTransport(item)"
        >
          <b>{{ item.label }}</b>
          <span>{{ item.disabled ? item.reason : item.desc }}</span>
        </div>
      </div>
      <div class="field-grid conn-grid">
        <div class="field">
          <label>接入地址</label>
          <el-input v-model="host" placeholder="平台域名或 IP" />
        </div>
        <div class="field">
          <label>端口</label>
          <el-input v-model.number="port" placeholder="端口" />
        </div>
      </div>

      <div class="sub-title">登录方式</div>
      <div class="radio-row">
        <div
          v-for="item in authOptions"
          :key="item.value"
          :class="['radio-card', { selected: authMode === item.value, disabled: item.disabled }]"
          :title="item.disabled ? item.reason : ''"
          @click="selectAuth(item)"
        >
          <b>{{ item.label }}</b>
          <span>{{ item.disabled ? item.reason : item.desc }}</span>
        </div>
      </div>
      <div v-if="authMode" class="summary">
        <span>登录</span>
        <span class="sep">·</span>
        <span>{{ maskedLoginText }}</span>
      </div>
    </div>

    <!-- 3. 获取提示词 -->
    <div v-show="currentStep === 3">
      <h3 class="section-title">下载 SKILL，然后复制提示词</h3>
      <p class="section-desc">提示词里有连接方式、登录方式、协议文档和设备描述，智能体不需要再访问平台接口。</p>
      <agent-credential
        title="连接信息"
        :host="host"
        :port="port"
        :secret="loginPass"
        :prompt="prompt"
        :chips="chips"
        :skill-name="skillName"
        @download-skill="downloadSkill(skillName)"
      />
      <div class="agent-tip">
        使用步骤：1. 下载 <code>{{ skillName }}.zip</code> 并解压，把 <code>{{ skillName }}</code> 目录放入智能体的 skills 目录；2. 把提示词发给智能体。
        智能体会用 industrial-screen 技能生成设备面板，运行后在本机打开监控页实时显示数据；平台上也可以到设备详情里看在线状态和最新数据。
      </div>
    </div>
  </agent-access-wizard>
</template>

<script>
import { queryObject } from '@/api/iot/table'
import agentCopy from '../agent/mixins/agentCopy'
import AgentAccessWizard from '../agent/components/AgentAccessWizard.vue'
import AgentCredential from '../agent/components/AgentCredential.vue'

// SKILL 包是 public 下的静态文件，由 build/skill-zip.sh 生成
const SKILL_NAME = 'alinkiot-vdevice'
// 设备面板由 industrial-screen 技能生成，run 时由虚拟设备的本地监控服务提供
const PANEL_SKILL_REPO = 'https://github.com/alinkiot/skill-industrial-screen.git'

// 与 SKILL 的 references/protocols/README.md 一致：接入方式、上报方式、是否内置 driver
const PROTOCOLS = {
  'Modbus-RTU': { transport: 'tcp', mode: 'poll', builtin: true },
  'mqtt-json': { transport: 'mqtt', mode: 'push', builtin: true },
  'tcp-json': { transport: 'tcp', mode: 'push', builtin: true },
  'Modbus-JY-R100': { transport: 'tcp', mode: 'poll' },
  'rouxingcexie-huasi': { transport: 'tcp', mode: 'poll' },
  'protocol_t': { transport: 'tcp', mode: 'push', port: 10881, noReg: true },
  'GNSS': { transport: 'mqtt', mode: 'push', topic: '$dp' },
  'RION-HM705': { transport: 'mqtt', mode: 'push' },
  'hnlg-protocol': { transport: 'mqtt', mode: 'push' },
  'hnlg-vdg-protocol': { transport: 'mqtt', mode: 'push' },
  'LANZUN-GNSS': { unsupported: '平台定时从第三方云拉取数据' },
  'CEHOUSHEBEI': { unsupported: '平台定时从第三方数据库拉取数据' },
  'ezviz': { unsupported: '由萤石云回调平台推送' },
  'JIANYUWENSHIDU': { unsupported: '平台代码中没有该协议的处理模块' },
  'dji4': { unsupported: '平台代码中没有该协议的处理模块' }
}

// 协议标识 → driver 模块名，与 SKILL 的 drivers.module_name 一致
function moduleName(protocol) {
  return protocol.toLowerCase().replace(/[^0-9a-z]+/g, '_').replace(/^_+|_+$/g, '')
}

function parseJson(value, fallback) {
  if (value === null || value === undefined || value === '') return fallback
  if (typeof value !== 'string') return value
  try {
    return JSON.parse(value)
  } catch (e) {
    return fallback
  }
}

export default {
  name: 'AgentDevice',
  components: { AgentAccessWizard, AgentCredential },
  mixins: [agentCopy],
  data() {
    return {
      skillName: SKILL_NAME,
      currentStep: 1,
      steps: ['选择设备', '通讯方式', '获取提示词'],
      footText: ['先选产品，再选设备', '确认通讯方式和登录方式', '下载 SKILL 后复制提示词'],
      // 从项目进入时只列出该项目的设备，与其它页面一致
      projectId: undefined,
      projectTitle: '',
      projectLocked: false,
      productId: undefined,
      productOptions: [],
      deviceId: undefined,
      deviceOptions: [],
      deviceLoading: false,
      transport: '',
      host: '',
      port: '',
      authMode: 0,
      chips: ['连接方式', '登录凭证', '协议文档', '设备描述'],
      riskTips: [
        '虚拟设备使用真实设备的身份接入，真实设备在线时会互相挤掉',
        '虚拟数据会进入历史记录，并可能触发告警和联动',
        '提示词含设备或产品密钥，只发给可信的智能体'
      ],
      helpTips: [
        '协议由产品决定，提示词会指定对应的协议文档',
        '内置协议可直接模拟；其它协议智能体会先按协议文档编写 driver',
        '平台下发的控制会被虚拟设备接收，并改为输出写入的值',
        '运行时在本机打开监控页，显示实时数据和收发报文，可直接修改模拟取值'
      ],
      riskNotice: '建议只在测试项目或现场设备离线时使用；测试结束后停止虚拟设备。'
    }
  },
  computed: {
    footInfo() {
      return '第 ' + this.currentStep + ' 步 / 共 ' + this.steps.length + ' 步 · ' + this.footText[this.currentStep - 1]
    },
    currentProduct() {
      return this.productOptions.find(item => item.id === this.productId)
    },
    currentDevice() {
      return this.deviceOptions.find(item => item.id === this.deviceId)
    },
    protocolId() {
      return this.currentProduct ? this.currentProduct.protocol || '' : ''
    },
    protocolConf() {
      return PROTOCOLS[this.protocolId] || null
    },
    isGateway() {
      const product = this.currentProduct
      return !!product && (product.nodeType || product.node_type) === 'gateway'
    },
    thingCount() {
      const thing = parseJson(this.currentProduct && this.currentProduct.thing, [])
      return Array.isArray(thing) ? thing.length : 0
    },
    protocolInfo() {
      const conf = this.protocolConf
      if (!conf) {
        return { level: 'bad', supportText: '未知协议，SKILL 中没有协议文档，无法模拟', modeText: '未知' }
      }
      if (conf.unsupported) {
        return { level: 'bad', supportText: '不可模拟：' + conf.unsupported, modeText: '无设备接入' }
      }
      return {
        level: conf.builtin ? 'ok' : 'warn',
        supportText: conf.builtin ? 'SKILL 已内置，可直接模拟' : '未内置，智能体会先按协议文档编写 driver',
        modeText: conf.mode === 'poll' ? '平台按物模型轮询，设备应答' : '设备按间隔主动上报'
      }
    },
    transportOptions() {
      const conf = this.protocolConf || {}
      const tcpPort = conf.port || 6500
      const options = [
        { value: 'mqtt', label: 'MQTT', desc: '端口 1883', port: 1883, kind: 'mqtt' },
        { value: 'mqtts', label: 'MQTT over TLS', desc: '端口 8883，加密传输', port: 8883, kind: 'mqtt' },
        { value: 'tcp', label: 'TCP', desc: '端口 ' + tcpPort + (conf.noReg ? '，不需要 reg 登录' : '，透传，先发 reg 登录'), port: tcpPort, kind: 'tcp' }
      ]
      return options.map(item => Object.assign(item, {
        disabled: !!conf.transport && conf.transport !== item.kind,
        reason: '协议 ' + this.protocolId + ' 只支持 ' + (conf.transport || '').toUpperCase() + ' 接入'
      }))
    },
    authOptions() {
      const device = this.currentDevice || {}
      const product = this.currentProduct || {}
      return [
        {
          value: 1, label: '一机一证', desc: '用设备自己的 dk / ds',
          disabled: !(device.dk && device.ds), reason: '该设备没有设置 dk / ds'
        },
        {
          value: 2, label: '一型一密', desc: '用产品的 pk / ps，同产品设备共用',
          disabled: !(product.pk && product.ps), reason: '该产品没有设置 pk / ps'
        }
      ]
    },
    loginUser() {
      if (this.authMode === 1) return (this.currentDevice || {}).dk || ''
      if (this.authMode === 2) return (this.currentProduct || {}).pk || ''
      return ''
    },
    loginPass() {
      if (this.authMode === 1) return (this.currentDevice || {}).ds || ''
      if (this.authMode === 2) return (this.currentProduct || {}).ps || ''
      return ''
    },
    isMqtt() {
      return this.transport === 'mqtt' || this.transport === 'mqtts'
    },
    addr() {
      return this.currentDevice ? this.currentDevice.addr : ''
    },
    loginText() {
      const name = this.authMode === 1 ? '一机一证' : '一型一密'
      if (this.isMqtt) {
        return name + '，clientId uzy_' + this.authMode + '_' + this.addr + '，用户名 ' + this.loginUser + '，密码 ' + this.loginPass
      }
      if (this.protocolConf && this.protocolConf.noReg) {
        return name + '，该协议不需要 reg 登录，连接后直接发送数据'
      }
      return name + '，登录报文 reg,' + this.authMode + ',' + this.addr + ',' + this.loginUser + ',' + this.loginPass +
        '\\r\\n（结尾是 4 个字符的 \\r\\n，不是回车换行）'
    },
    // 页面上遮蔽密码，复制的提示词里是完整值
    maskedLoginText() {
      const pass = this.loginPass
      if (!pass) return this.loginText
      const masked = pass.length <= 8 ? '••••••••' : pass.slice(0, 4) + '••••••••' + pass.slice(-4)
      return this.loginText.split(pass).join(masked)
    },
    connectText() {
      const label = { mqtt: 'MQTT', mqtts: 'MQTT over TLS', tcp: 'TCP' }[this.transport] || ''
      let text = label + '，' + this.host + ':' + this.port
      if (this.isMqtt) {
        text += '，上报 topic ' + ((this.protocolConf && this.protocolConf.topic) || 'd/out/' + this.addr)
      }
      return text
    },
    description() {
      const device = this.currentDevice || {}
      const product = this.currentProduct || {}
      return {
        device: { id: device.id, name: device.name, addr: device.addr },
        product: {
          id: product.id,
          name: product.name,
          protocol: product.protocol,
          nodeType: product.nodeType || product.node_type,
          thing: parseJson(product.thing, []),
          config: parseJson(product.config, [])
        },
        connect: { transport: this.isMqtt ? 'mqtt' : 'tcp', host: this.host, port: Number(this.port), tls: this.transport === 'mqtts' },
        auth: { mode: this.authMode, user: this.loginUser, pass: this.loginPass }
      }
    },
    prompt() {
      if (!this.currentDevice || !this.currentProduct) return ''
      const protocol = this.protocolId
      const conf = this.protocolConf || {}
      const doc = 'references/protocols/' + protocol + '.md'
      const driver = 'scripts/drivers/' + moduleName(protocol) + '.py'
      const file = 'devices/' + this.addr + '.desc.json'
      return [
        '请使用 ' + SKILL_NAME + ' skill 创建虚拟设备，模拟 ALinkIOT 设备接入平台并上报数据。',
        '如果还没有 ' + SKILL_NAME + ' skill，先从 ' + this.zipUrl(SKILL_NAME) + ' 下载，解压后把 ' + SKILL_NAME + ' 目录放入 skills 目录。',
        '设备：「' + this.currentDevice.name + '」，地址 ' + this.addr + '；产品：「' + this.currentProduct.name + '」',
        '连接方式：' + this.connectText,
        '登录方式：' + this.loginText,
        '协议：' + protocol + '，协议文档 ' + doc + '；' +
          (conf.builtin ? '已内置 driver ' + driver + '。' : '没有内置 driver，先按文档的「写 driver 要点」实现 ' + driver + '，接口见 scripts/drivers/__init__.py。'),
        '把下面的设备描述原样保存为 skill 目录下的 ' + file + '，执行 python3 scripts/vdevice.py init --from-json ' + file +
          '，核对输出的协议和连接方式，向我列出数据点；按我的要求用 set 调整取值。',
        '然后按 references/panel.md，用 industrial-screen skill（没有时从 ' + PANEL_SKILL_REPO + ' 获取）为这台设备生成实时面板，' +
          '再执行 run 开始模拟：run 会在本机打开监控页实时显示设备数据，把监控页地址告诉我。',
        '设备描述：',
        JSON.stringify(this.description)
      ].join('\n')
    }
  },
  async created() {
    const current = await this.$store.dispatch('settings/ResolveProject')
    if (current) {
      this.projectId = current.id
      this.projectTitle = current.title || current.name || ''
      this.projectLocked = true
    }
    this.host = this.defaultHost()
    this.loadProducts()
  },
  methods: {
    // 设备接入与 API 同域名：取 VUE_APP_BASE_API 的主机名，相对地址时取当前页面
    defaultHost() {
      try {
        return new URL(this.apiHost).hostname
      } catch (e) {
        return location.hostname
      }
    },
    loadProducts() {
      queryObject('product', { pageNum: 1, pageSize: 500 }).then(response => {
        this.productOptions = Array.isArray(response.rows) ? response.rows : []
      }).catch(() => {
        this.$modal.msgError('产品列表加载失败')
      })
    },
    handleProductChange() {
      this.deviceId = undefined
      this.deviceOptions = []
      this.loadDevices()
    },
    loadDevices(keyword) {
      if (!this.productId) return
      const query = { pageNum: 1, pageSize: 50, product: this.productId, 'orderBy[desc]': 'createTime' }
      if (this.projectLocked) query.project = this.projectId
      if (keyword) query['name[like]'] = keyword
      this.deviceLoading = true
      queryObject('device', query).then(response => {
        const rows = Array.isArray(response.rows) ? response.rows : []
        // 搜索时保留已选设备，避免选中项因不在结果里而显示成 ID
        const selected = this.currentDevice
        if (selected && keyword && !rows.some(item => item.id === selected.id)) rows.unshift(selected)
        this.deviceOptions = rows
      }).catch(() => {
        this.$modal.msgError('设备列表加载失败')
      }).finally(() => {
        this.deviceLoading = false
      })
    },
    selectTransport(item) {
      if (item.disabled) return
      this.transport = item.value
      this.port = item.port
    },
    selectAuth(item) {
      if (item.disabled) return
      this.authMode = item.value
    },
    // 进入第 2 步时按协议和设备给出默认的通讯方式和登录方式
    applyDefaults() {
      const transport = this.transportOptions.find(item => item.value === this.transport && !item.disabled) ||
        this.transportOptions.find(item => !item.disabled)
      if (transport) this.selectTransport(transport)
      const auth = this.authOptions.find(item => item.value === this.authMode && !item.disabled) ||
        this.authOptions.find(item => !item.disabled)
      this.authMode = auth ? auth.value : 0
    },
    prevStep() {
      if (this.currentStep > 1) this.currentStep--
    },
    nextStep() {
      if (this.currentStep === 1) {
        if (!this.currentProduct || !this.currentDevice) {
          this.$modal.msgWarning('请先选择产品和设备')
          return
        }
        if (this.protocolInfo.level === 'bad') {
          this.$modal.msgWarning('该设备的协议无法用虚拟设备模拟：' + this.protocolInfo.supportText)
          return
        }
        this.applyDefaults()
      } else if (this.currentStep === 2) {
        if (!this.authMode) {
          this.$modal.msgWarning('设备没有 dk / ds，产品也没有 pk / ps，无法登录')
          return
        }
        if (!this.host || !this.port) {
          this.$modal.msgWarning('请填写接入地址和端口')
          return
        }
      } else {
        this.copyText(this.prompt, '已复制完整提示词（含密钥），请勿粘贴到公开群聊')
        return
      }
      this.currentStep++
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
.sub-title {
  margin: 18px 0 10px;
  font-size: 12px;
  font-weight: 600;
  color: var(--ui-text-secondary);
}
.sub-title:first-of-type {
  margin-top: 0;
}
.field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}
.conn-grid {
  margin-top: 14px;
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
.option-sub {
  float: right;
  margin-left: 12px;
  font-size: 12px;
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
  margin-top: 14px;
  padding: 12px 14px;
  border-radius: 8px;
  background: var(--ui-surface-2);
  font-size: 12px;
  color: var(--ui-text-secondary);
  word-break: break-all;
}
.sep {
  color: var(--ui-text-tertiary);
}
.device-info {
  margin-top: 18px;
  padding: 12px 14px;
  border-radius: 8px;
  background: var(--ui-surface-2);
  font-size: 12px;
  color: var(--ui-text-secondary);
}
.info-row {
  display: flex;
  gap: 12px;
  line-height: 2;
}
.info-k {
  flex: none;
  width: 64px;
  color: var(--ui-text-tertiary);
}
.info-row b {
  color: var(--ui-text-primary);
}
.support {
  margin-left: 8px;
  font-size: 11px;
}
.support.ok {
  color: #248a3d;
}
.support.warn {
  color: #a65d00;
}
.support.bad {
  color: #c02d26;
}
.radio-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.radio-card {
  flex: 1;
  min-width: 160px;
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
.radio-card.disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
.radio-card.disabled:hover {
  border-color: var(--ui-border);
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
}
</style>
