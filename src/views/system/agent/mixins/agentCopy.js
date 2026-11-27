// 智能体页面通用能力：SKILL 包地址、下载、复制（含旧浏览器兜底）
export default {
  computed: {
    // SKILL 脚本会在后面拼接 /iotapi，所以这里取 /iotapi 前面的部分
    apiHost() {
      const base = process.env.VUE_APP_BASE_API || '/iotapi'
      if (/^https?:\/\//.test(base)) {
        return base.replace(/\/iotapi\/?$/, '')
      }
      return location.origin
    }
  },
  methods: {
    zipUrl(name) {
      return location.origin + process.env.BASE_URL + 'skills/' + name + '.zip'
    },
    downloadSkill(name) {
      const link = document.createElement('a')
      link.href = this.zipUrl(name)
      link.download = name + '.zip'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    },
    // navigator.clipboard 只在安全上下文可用；HTTP / 嵌入 iframe 时退回 execCommand
    copyText(text, successMsg) {
      const done = () => this.$modal.msgSuccess(successMsg || '已复制')
      const fail = () => this.$modal.msgError('当前环境不支持自动复制，请手动选中文本复制')
      if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(text)
          .then(() => {
            done()
            return true
          })
          .catch(() => Promise.resolve(this.fallbackCopy(text, done, fail)))
      }
      return Promise.resolve(this.fallbackCopy(text, done, fail))
    },
    fallbackCopy(text, done, fail) {
      const input = document.createElement('textarea')
      input.value = text
      input.setAttribute('readonly', '')
      input.style.position = 'fixed'
      input.style.opacity = '0'
      document.body.appendChild(input)
      input.select()
      let ok = false
      try {
        ok = document.execCommand('copy')
      } catch (e) {
        ok = false
      }
      document.body.removeChild(input)
      if (ok) {
        done()
      } else {
        fail()
      }
      return ok
    }
  }
}
