<template>
  <div class="agent-credential">
    <div class="cred-hd">
      <span>{{ title }}</span>
      <span class="cred-flag">默认遮蔽 · 复制时复制完整值</span>
    </div>
    <div v-for="row in rows" :key="row.key" class="cred-row">
      <span class="cred-k">{{ row.label }}</span>
      <span class="cred-v">{{ displayValue(row) }}</span>
      <el-button
        v-if="row.sensitive"
        type="text"
        size="mini"
        icon="el-icon-view"
        @click="revealed = !revealed"
      >{{ revealed ? '隐藏' : '显示' }}</el-button>
      <el-button
        type="text"
        size="mini"
        icon="el-icon-document-copy"
        @click="copyValue(row)"
      >复制</el-button>
    </div>

    <div class="prompt-wrap">
      <div class="prompt-hd">
        <span class="prompt-warn">预览已遮蔽 · 复制时自动填入完整凭证</span>
        <span v-if="chips.length" class="prompt-chips">
          <span v-for="chip in chips" :key="chip" class="prompt-chip">{{ chip }}</span>
        </span>
      </div>
      <pre class="prompt-code">{{ previewPrompt }}</pre>
    </div>

    <div class="cred-actions">
      <el-button
        size="small"
        type="primary"
        icon="el-icon-document-copy"
        @click="copyPrompt"
      >复制完整提示词</el-button>
      <el-button
        v-if="skillName"
        size="small"
        icon="el-icon-download"
        @click="$emit('download-skill')"
      >下载 SKILL</el-button>
    </div>
  </div>
</template>

<script>
import agentCopy from '../mixins/agentCopy'

export default {
  name: 'AgentCredential',
  mixins: [agentCopy],
  props: {
    title: {
      type: String,
      default: '接入凭证'
    },
    appId: {
      type: String,
      default: ''
    },
    secret: {
      type: String,
      default: ''
    },
    host: {
      type: String,
      default: ''
    },
    port: {
      type: [String, Number],
      default: ''
    },
    token: {
      type: String,
      default: ''
    },
    prompt: {
      type: String,
      default: ''
    },
    skillName: {
      type: String,
      default: ''
    },
    chips: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      revealed: false
    }
  },
  computed: {
    rows() {
      const rows = []
      if (this.host) rows.push({ key: 'host', label: 'host', value: String(this.host), sensitive: false })
      if (this.port) rows.push({ key: 'port', label: 'port', value: String(this.port), sensitive: false })
      if (this.appId) rows.push({ key: 'appId', label: 'AppID', value: this.appId, sensitive: false })
      if (this.secret) rows.push({ key: 'secret', label: 'Secret', value: this.secret, sensitive: true })
      if (this.token) rows.push({ key: 'token', label: 'token', value: this.token, sensitive: true })
      return rows
    },
    // 预览里遮蔽凭证，复制时使用完整的 prompt
    previewPrompt() {
      let text = this.prompt || ''
      const secrets = [this.secret, this.token].filter(Boolean)
      secrets.forEach(value => {
        text = text.split(value).join(this.mask(value))
      })
      return text
    }
  },
  methods: {
    mask(value) {
      if (!value) return ''
      if (value.length <= 8) return '••••••••'
      return value.slice(0, 4) + '••••••••' + value.slice(-4)
    },
    displayValue(row) {
      return row.sensitive && !this.revealed ? this.mask(row.value) : row.value
    },
    copyValue(row) {
      const msg = row.sensitive ? '已复制完整凭证，请勿粘贴到公开渠道' : '已复制'
      this.copyText(row.value, msg)
    },
    copyPrompt() {
      this.copyText(this.prompt, '已复制完整提示词（含凭证），请勿粘贴到公开群聊')
    }
  }
}
</script>

<style lang="scss" scoped>
.agent-credential {
  border: 1px solid var(--ui-border);
  border-radius: 10px;
  overflow: hidden;
}
.cred-hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  padding: 9px 14px;
  background: var(--ui-surface-2);
  border-bottom: 1px solid var(--ui-border);
  font-size: 12px;
  font-weight: 600;
}
.cred-flag {
  font-size: 11px;
  font-weight: 400;
  color: #a65d00;
}
.cred-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 9px 14px;
  border-bottom: 1px solid var(--ui-border);
}
.cred-k {
  width: 62px;
  flex: none;
  font-size: 12px;
  color: var(--ui-text-secondary);
}
.cred-v {
  flex: 1;
  min-width: 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  word-break: break-all;
}
.prompt-wrap {
  border: 1px solid #2c2c2e;
  border-radius: 8px;
  overflow: hidden;
  margin: 14px;
}
.prompt-hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 12px;
  background: #2c2c2e;
  color: #e8e8ed;
  font-size: 11px;
}
.prompt-warn {
  color: #ffb340;
}
.prompt-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.prompt-chip {
  padding: 1px 5px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.09);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}
.prompt-code {
  margin: 0;
  padding: 14px;
  max-height: 260px;
  overflow: auto;
  background: #1d1d1f;
  color: #e8e8ed;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 11.5px;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
}
.cred-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 0 14px 14px;
}
</style>
