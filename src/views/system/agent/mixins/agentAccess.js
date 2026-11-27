import { queryObject } from '@/api/iot/table'
import agentCopy from './agentCopy'

// 智能应用 / 智能控制共用：项目与应用列表、项目上下文锁定、默认不选应用
export default {
  mixins: [agentCopy],
  data() {
    return {
      projectId: undefined,
      projectOptions: [],
      projectLocked: false,
      appId: undefined,
      appOptions: [],
      appLoading: false,
      currentStep: 1
    }
  },
  computed: {
    currentApp() {
      return this.appOptions.find(item => item.id === this.appId)
    },
    currentProject() {
      return this.projectOptions.find(item => String(item.id) === String(this.projectId))
    },
    currentSecret() {
      return this.currentApp ? (this.currentApp.secret || '') : ''
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
        // 锁定的项目不在列表里（无权限或已删除）时解除锁定；不默认选择任何项目
        const matched = options.find(item => String(item.id) === String(this.projectId))
        if (!matched) {
          this.projectId = undefined
          this.projectLocked = false
          this.appOptions = []
        } else {
          this.projectId = matched.id
          // 项目锁定时下拉框不会触发 change，需要在这里加载应用
          this.loadApps()
        }
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
        // 不再默认选中第一个应用：必须由用户确认，避免复制错项目的 Secret
      }).catch(() => {
        this.$modal.msgError('应用列表加载失败')
      }).finally(() => {
        this.appLoading = false
      })
    },
    prevStep() {
      if (this.currentStep > 1) this.currentStep--
    },
    goNextStep() {
      if (this.currentStep === 1 && (!this.projectId || !this.appId)) {
        this.$modal.msgWarning('请先选择项目和对应应用')
        return false
      }
      if (this.currentStep < 4) {
        this.currentStep++
      }
      return true
    }
  }
}
