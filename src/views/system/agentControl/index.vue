<template>
  <div class="app-container">
    <el-card class="agent-card" shadow="never">
      <div slot="header" class="agent-header">
        <span>智能控制</span>
      </div>

      <el-form size="small" :inline="true" @submit.native.prevent>
        <el-form-item label="所属项目">
          <el-select
            v-model="projectId"
            placeholder="请选择项目"
            filterable
            :disabled="projectLocked"
            @change="handleProjectChange"
          >
            <el-option v-for="item in projectOptions" :key="item.id" :label="item.title" :value="item.id"/>
          </el-select>
        </el-form-item>
        <el-form-item label="应用">
          <el-select v-model="appId" placeholder="请选择应用" filterable :loading="appLoading" no-data-text="该项目下没有应用">
            <el-option v-for="item in appOptions" :key="item.id" :label="item.name" :value="item.id"/>
          </el-select>
        </el-form-item>
      </el-form>

      <template v-if="currentApp">
        <div class="agent-section">提示词</div>
        <el-input type="textarea" readonly :rows="10" :value="prompt" />
        <div class="agent-actions">
          <el-button size="mini" type="primary" icon="el-icon-document-copy" @click="copyText(prompt)">复制提示词</el-button>
          <el-button size="mini" icon="el-icon-download" @click="downloadSkill">下载 SKILL</el-button>
        </div>
      </template>
      <div v-else class="agent-tip">
        {{ appLoading ? '应用加载中…' : '请选择应用。项目下还没有应用时，先到"工程项目 / 应用接入"里创建。' }}
        <el-button type="text" size="mini" icon="el-icon-download" @click="downloadSkill">下载 SKILL</el-button>
      </div>

      <div class="agent-tip">
        使用步骤：1. 下载 SKILL 并解压，把 <code>uzyiot-api</code> 目录放入智能体的 skills 目录；
        2. 复制上面的提示词发给智能体，智能体会按 SKILL 以该应用的身份调用平台接口，查询项目、场景、设备和数据，或下发设备控制。
      </div>
    </el-card>

    <el-alert
      class="page-alert"
      type="warning"
      :closable="false"
      show-icon
      title="提示词里包含应用的 AppID 和 Secret，持有它就能以该应用的身份查询数据、下发设备控制。只发给可信的智能体，泄露后请到应用接入里更换 Secret。"
    />
  </div>
</template>

<script>
import { queryObject } from '@/api/iot/table'

// SKILL 包是 public 下的静态文件，由 build/skill-zip.sh 生成
const SKILL_NAME = 'uzyiot-api'

export default {
  name: 'AgentControl',
  data() {
    return {
      projectId: undefined,
      projectOptions: [],
      // 从项目进入时锁定项目，与其它页面一致
      projectLocked: false,
      appId: undefined,
      appOptions: [],
      appLoading: false
    }
  },
  computed: {
    currentApp() {
      return this.appOptions.find(item => item.id === this.appId)
    },
    // 平台接入地址：SKILL 脚本会在后面拼接 /iotapi，所以这里取 /iotapi 前面的部分
    apiHost() {
      const base = process.env.VUE_APP_BASE_API || '/iotapi'
      if (/^https?:\/\//.test(base)) {
        return base.replace(/\/iotapi\/?$/, '')
      }
      return location.origin
    },
    skillUrl() {
      return location.origin + process.env.BASE_URL + 'skills/' + SKILL_NAME + '.zip'
    },
    prompt() {
      const app = this.currentApp || {}
      return [
        '请使用 ' + SKILL_NAME + ' skill 操作 ALinkIOT 平台，查询项目、场景、设备和数据，或下发设备控制。',
        '如果还没有 ' + SKILL_NAME + ' skill，先从 ' + this.skillUrl + ' 下载，解压后把 ' + SKILL_NAME + ' 目录放入 skills 目录。',
        '在 skill 目录下新建 env.ini，内容如下：',
        'host=' + this.apiHost,
        'appId=' + (app.appid || ''),
        'Secret=' + (app.secret || ''),
        '登录后先确认所属项目和可访问的设备，然后等待我的指令。'
      ].join('\n')
    }
  },
  async created() {
    const current = await this.$store.dispatch('settings/ResolveProject')
    if (current) {
      this.projectId = current.id
      this.projectLocked = true
    }
    this.loadProjectOptions()
  },
  methods: {
    loadProjectOptions() {
      const pageSize = 100
      const options = []
      const ids = new Set()
      const loadPage = pageNum => queryObject('project', { pageNum, pageSize }).then(response => {
        const rows = Array.isArray(response.rows) ? response.rows : []
        rows.forEach(item => {
          if (!ids.has(String(item.id))) {
            ids.add(String(item.id))
            options.push(item)
          }
        })
        const total = Number(response.total)
        if (total > 0 && options.length < total && rows.length === pageSize) {
          return loadPage(pageNum + 1)
        }
        this.projectOptions = options
        // 未从项目进入时默认选第一个项目；锁定的项目不在列表里（无权限或已删除）时解除锁定
        const matched = options.find(item => String(item.id) === String(this.projectId))
        if (!matched) {
          this.projectLocked = false
          this.projectId = options.length ? options[0].id : undefined
        } else {
          this.projectId = matched.id
        }
        this.loadApps()
      })
      loadPage(1).catch(() => {
        this.$modal.msgError('项目列表加载失败')
      })
    },
    handleProjectChange() {
      this.loadApps()
    },
    loadApps() {
      this.appId = undefined
      this.appOptions = []
      if (this.projectId === undefined) return
      this.appLoading = true
      queryObject('app', { pageNum: 1, pageSize: 100, project: this.projectId }).then(response => {
        this.appOptions = Array.isArray(response.rows) ? response.rows : []
        if (this.appOptions.length) {
          this.appId = this.appOptions[0].id
        }
      }).catch(() => {
        this.$modal.msgError('应用列表加载失败')
      }).finally(() => {
        this.appLoading = false
      })
    },
    downloadSkill() {
      const link = document.createElement('a')
      link.href = this.skillUrl
      link.download = SKILL_NAME + '.zip'
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
.agent-card {
  max-width: 760px;
}

.page-alert {
  margin-top: 16px;
  max-width: 760px;
}

.agent-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.agent-section {
  margin: 8px 0;
  font-weight: 600;
}

.agent-actions {
  margin-top: 8px;
}

.agent-tip {
  margin-top: 8px;
  font-size: 12px;
  line-height: 1.6;
  color: #909399;
}
</style>
