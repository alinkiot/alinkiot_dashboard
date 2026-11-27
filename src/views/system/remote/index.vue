<template>
  <div class="app-container">
    <el-alert
      type="warning"
      :closable="false"
      show-icon
      title="远程调试通道等同于在后端节点上执行任意代码，只在需要排查问题时启动，用完停止。令牌保存在内存里，节点重启后失效，到期自动失效。"
    />

    <el-card class="remote-card" shadow="never" v-loading="loading">
      <div slot="header" class="remote-header">
        <span>远程调试</span>
        <el-tag :type="status.enable ? 'success' : 'info'" size="small">
          {{ status.enable ? '已启动' : '未启动' }}
        </el-tag>
      </div>

      <template v-if="status.enable">
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="令牌">
            <el-input readonly :value="status.token" size="small">
              <el-button slot="append" @click="copyText(status.token)">复制</el-button>
            </el-input>
          </el-descriptions-item>
          <el-descriptions-item label="到期时间">{{ formatTime(status.expireAt) }}</el-descriptions-item>
          <el-descriptions-item label="启动人">{{ status.createdBy }}</el-descriptions-item>
          <el-descriptions-item label="启动时间">{{ formatTime(status.createdAt) }}</el-descriptions-item>
        </el-descriptions>

        <div class="remote-section">连接示例（配合 erl-cli skill）</div>
        <el-input type="textarea" readonly :rows="3" :value="command" />
        <div class="remote-tip">
          <el-button type="text" size="mini" @click="copyText(command)">复制命令</el-button>
          端口：直连后端用 <code>dashboard.port</code>（默认 18888），经 nginx 访问用 nginx 的端口。
          <code>erl_cli.py</code> 只支持 <code>ws://</code>，不能直接连 https 域名。
        </div>
      </template>
      <div v-else class="remote-tip">未启动。启动后会生成一个随机令牌，连不上时回到这里重新启动即可。</div>

      <div class="remote-actions">
        <template v-if="status.enable">
          <el-button v-hasPermi="['system:remote:edit']" size="small" type="primary" icon="el-icon-refresh" @click="handleStart">重新生成</el-button>
          <el-button v-hasPermi="['system:remote:edit']" size="small" type="danger" icon="el-icon-switch-button" @click="handleStop">停止</el-button>
        </template>
        <template v-else>
          <span class="remote-hours">有效期</span>
          <el-input-number v-model="hours" :min="1" :max="168" size="small" />
          <span class="remote-hours">小时</span>
          <el-button v-hasPermi="['system:remote:edit']" size="small" type="primary" icon="el-icon-video-play" @click="handleStart">启动</el-button>
        </template>
      </div>
    </el-card>
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
    command() {
      const port = location.port || (location.protocol === 'https:' ? '443' : '80')
      return 'python3 scripts/erl_cli.py eval "erlang:node()" --host ' + location.hostname +
        ' --port ' + port + ' --path /debug --token ' + (this.status.token || '')
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
  margin-top: 16px;
  max-width: 760px;
}

.remote-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
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

.remote-actions {
  margin-top: 16px;
}

.remote-hours {
  margin: 0 6px;
  font-size: 13px;
}
</style>
