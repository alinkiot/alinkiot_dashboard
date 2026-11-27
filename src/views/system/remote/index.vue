<template>
  <div class="app-container">
    <el-card class="remote-card" shadow="never" v-loading="loading">
      <div slot="header" class="remote-header">
        <div class="remote-header-title">
          <span>智能运维</span>
          <el-tag :type="status.enable ? 'success' : 'info'" size="small">
            {{ status.enable ? '已启动' : '未启动' }}
          </el-tag>
        </div>
        <div class="remote-header-actions">
          <el-button v-if="status.enable" v-hasPermi="['system:remote:edit']" size="mini" type="danger" icon="el-icon-switch-button" @click="handleStop">停止</el-button>
          <template v-else>
            <span class="remote-hours">有效期</span>
            <el-input-number v-model="hours" :min="1" :max="168" size="mini" />
            <span class="remote-hours">小时</span>
            <el-button v-hasPermi="['system:remote:edit']" size="mini" type="primary" icon="el-icon-video-play" @click="handleStart">启动</el-button>
          </template>
        </div>
      </div>

      <template v-if="status.enable">
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="令牌">
            <el-input readonly :value="status.token" size="small">
              <el-button slot="append" v-hasPermi="['system:remote:edit']" icon="el-icon-refresh" @click="handleStart">重新生成</el-button>
            </el-input>
          </el-descriptions-item>
          <el-descriptions-item label="到期时间">{{ formatTime(status.expireAt) }}</el-descriptions-item>
        </el-descriptions>

        <div class="remote-section">提示词</div>
        <el-input type="textarea" readonly :rows="8" :value="prompt" />
        <div class="remote-actions-inline">
          <el-button size="mini" type="primary" icon="el-icon-document-copy" @click="copyText(prompt)">复制提示词</el-button>
          <el-button size="mini" icon="el-icon-download" @click="downloadSkill">下载 SKILL</el-button>
        </div>
        <div class="remote-tip">
          使用步骤：1. 下载 SKILL 并解压，把 <code>erl-cli</code> 目录放入智能体的 skills 目录；
          2. 复制上面的提示词发给智能体，智能体会按 SKILL 连接后端节点进行调试。
        </div>
      </template>
      <div v-else class="remote-tip">
        未启动。启动后会生成一个随机令牌，连不上时回到这里重新启动即可。
        <el-button type="text" size="mini" icon="el-icon-download" @click="downloadSkill">下载 SKILL</el-button>
      </div>
    </el-card>

    <el-alert
      class="page-alert"
      type="warning"
      :closable="false"
      show-icon
      title="远程调试通道等同于在后端节点上执行任意代码，只在需要排查问题时启动，用完停止。令牌保存在内存里，节点重启后失效，到期自动失效。"
    />
  </div>
</template>

<script>
import { getRemoteStatus, startRemote, stopRemote } from '@/api/system/remote'

export default {
  name: 'Remote',
  data() {
    return {
      loading: false,
      hours: 24,
      status: { enable: false }
    }
  },
  computed: {
    // 发给智能体的提示词：智能体加载 erl-cli SKILL 后，按这里的参数连接
    // 连接地址与后端接口同源：线上经 nginx 反向代理 /debug，用当前页面的地址和端口；
    // 开发环境 VUE_APP_BASE_API 是后端的绝对地址时，直连该地址
    endpoint() {
      const base = process.env.VUE_APP_BASE_API || ''
      const url = /^https?:\/\//.test(base) ? new URL(base) : location
      return {
        host: url.hostname,
        port: url.port || (url.protocol === 'https:' ? '443' : '80')
      }
    },
    prompt() {
      return [
        '请使用 erl-cli skill 通过 WebSocket 连接远程 ALinkIOT 节点进行调试。',
        '如果还没有 erl-cli skill，先从 ' + this.skillUrl + ' 下载，解压后把 erl-cli 目录放入 skills 目录。',
        '连接参数：',
        '- host: ' + this.endpoint.host,
        '- port: ' + this.endpoint.port,
        '- token: ' + (this.status.token || ''),
        '令牌到期时间：' + this.formatTime(this.status.expireAt),
        '连接后先执行节点概览检查，确认当前节点和集群情况，然后等待我的调试指令。'
      ].join('\n')
    },
    // erl-cli SKILL 包的完整下载地址，是 public 下的静态文件，由 build/skill-zip.sh 生成
    skillUrl() {
      return location.origin + process.env.BASE_URL + 'skills/erl-cli.zip'
    }
  },
  created() {
    this.getStatus()
  },
  methods: {
    getStatus() {
      this.loading = true
      getRemoteStatus().then(res => {
        this.status = res.data || { enable: false }
      }).finally(() => {
        this.loading = false
      })
    },
    handleStart() {
      const run = () => startRemote(this.hours).then(res => {
        this.status = res.data
        this.$modal.msgSuccess('已启动')
      })
      if (this.status.enable) {
        this.$modal.confirm('重新生成后旧令牌立即失效，是否继续？').then(run).catch(() => {})
      } else {
        run()
      }
    },
    handleStop() {
      this.$modal.confirm('停止后令牌立即失效，是否继续？').then(() => {
        return stopRemote()
      }).then(() => {
        this.status = { enable: false }
        this.$modal.msgSuccess('已停止')
      }).catch(() => {})
    },
    formatTime(seconds) {
      return seconds ? this.parseTime(seconds * 1000) : '-'
    },
    downloadSkill() {
      const link = document.createElement('a')
      link.href = this.skillUrl
      link.download = 'erl-cli.zip'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    },
    copyText(text) {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => this.$modal.msgSuccess('已复制'))
      } else {
        this.$modal.msgError('当前环境不支持自动复制，请手动选中复制')
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.remote-card {
  max-width: 760px;
}

.page-alert {
  margin-top: 16px;
  max-width: 760px;
}

.remote-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.remote-header-title,
.remote-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.remote-section {
  margin: 16px 0 8px;
  font-weight: 600;
}

.remote-tip {
  margin-top: 8px;
  font-size: 12px;
  line-height: 1.6;
  color: #909399;
}

.remote-actions-inline {
  margin-top: 8px;
}

.remote-hours {
  font-size: 13px;
}
</style>
