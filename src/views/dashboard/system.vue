<template>
  <div class="node-dashboard" v-loading="loading">
    <div class="dashboard-header">
      <div class="header-left">
        <span class="page-title">集群监控</span>
        <span class="update-time">{{ lastUpdate }}</span>
      </div>
      <div class="header-right">
        <el-select v-model="name" size="mini" placeholder="选择节点" @change="changeNode" style="width: 200px;">
          <el-option v-for="item in brokers" :key="item.node" :label="item.node" :value="item.node" />
        </el-select>
        <el-button size="mini" icon="el-icon-refresh" :loading="refreshing" @click="refreshAll">刷新</el-button>
        <el-select v-model="refreshInterval" size="mini" placeholder="自动刷新" style="width: 110px;" @change="changeInterval">
          <el-option label="关闭自动" :value="0" />
          <el-option label="5秒自动" :value="5" />
          <el-option label="10秒自动" :value="10" />
          <el-option label="30秒自动" :value="30" />
        </el-select>
      </div>
    </div>

    <div class="stats-row">
      <div class="stat-card" v-for="item in statCards" :key="item.key">
        <div class="stat-icon">
          <i :class="item.icon"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">{{ item.label }}</span>
          <span class="stat-value">{{ item.value }}</span>
        </div>
      </div>
    </div>

    <div class="grid-row two-col">
      <div class="panel node-info-panel">
        <div class="panel-header">
          <span class="panel-title">当前节点</span>
          <el-tag size="mini" :type="broker.node_status === 'Running' ? 'success' : 'danger'" effect="light">
            {{ broker.node_status === 'Running' ? '运行中' : '离线' }}
          </el-tag>
        </div>
        <div class="info-row">
          <div class="info-item" v-for="field in nodeFields" :key="field.key">
            <span class="info-label">{{ field.label }}</span>
            <span class="info-value" :class="{ highlight: field.key === 'node' }">{{ broker[field.key] || '-' }}</span>
          </div>
        </div>
      </div>
      <div class="panel topo-panel">
        <div class="panel-header">
          <span class="panel-title">集群拓扑</span>
          <el-tag size="mini" :type="allOnline ? 'success' : 'warning'" effect="light">
            {{ allOnline ? '集群健康' : '部分异常' }}
          </el-tag>
        </div>
        <div class="topology">
          <!-- 连接线层：中心到各节点 -->
          <svg class="topo-lines" width="300" height="240" viewBox="-150 -120 300 240">
            <line
              v-for="(node, index) in nodes"
              :key="'line-' + node.node"
              x1="0"
              y1="0"
              :x2="getLineEnd(index).x"
              :y2="getLineEnd(index).y"
              :class="['topo-line', { offline: node.node_status !== 'Running' }]"
            />
          </svg>
          <div class="topo-center">
            <div class="center-ring"></div>
            <div class="center-icon"><i class="el-icon-s-platform"></i></div>
            <span class="center-label">Cluster</span>
          </div>
          <div
            class="topo-node"
            v-for="(node, index) in nodes"
            :key="node.node"
            :style="getNodePosition(index)"
            :class="{ offline: node.node_status !== 'Running' }"
          >
            <div class="node-icon">
              <svg viewBox="0 0 24 24" class="server-svg" width="22" height="22">
                <rect x="3" y="3" width="18" height="7" rx="1.5" />
                <rect x="3" y="14" width="18" height="7" rx="1.5" />
                <circle class="led" cx="7" cy="6.5" r="1" />
                <line x1="10" y1="6.5" x2="18" y2="6.5" />
                <circle class="led" cx="7" cy="17.5" r="1" />
                <line x1="10" y1="17.5" x2="18" y2="17.5" />
              </svg>
              <div class="node-pulse" v-if="node.node_status === 'Running'"></div>
            </div>
            <div class="node-detail">
              <span class="node-name">{{ node.node }}</span>
              <span class="node-sub">{{ formatMemory(node.memory_used) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="grid-row two-col chart-row">
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">CPU 负载趋势</span>
        </div>
        <div class="chart-container" ref="cpuChart"></div>
      </div>
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">内存使用趋势</span>
        </div>
        <div class="chart-container" ref="memChart"></div>
      </div>
    </div>

    <div class="panel">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="节点信息" name="nodes">
          <el-table :data="nodes" size="small">
            <el-table-column label="节点" min-width="180">
              <template slot-scope="{ row }">
                <div class="node-cell">
                  <span class="dot" :class="row.node_status === 'Running' ? 'on' : 'off'"></span>
                  {{ row.node }}
                </div>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="80" align="center">
              <template slot-scope="{ row }">
                <el-tag size="mini" :type="row.node_status === 'Running' ? 'success' : 'danger'" effect="light">
                  {{ row.node_status === 'Running' ? '在线' : '离线' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="进程 (used/avail)" width="140" align="center">
              <template slot-scope="{ row }">{{ row.process_used }} / {{ row.process_available }}</template>
            </el-table-column>
            <el-table-column label="CPU (1/5/15)" width="140" align="center">
              <template slot-scope="{ row }">{{ row.load1 }} / {{ row.load5 }} / {{ row.load15 }}</template>
            </el-table-column>
            <el-table-column label="内存" width="180" align="center">
              <template slot-scope="{ row }">
                <div class="mem-bar">
                  <el-progress :percentage="getMemPercent(row)" :stroke-width="5" :show-text="false" :color="getProgressColor(getMemPercent(row))" />
                  <span class="mem-text">{{ formatMemory(row.memory_used) }} / {{ formatMemory(row.memory_total) }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="句柄" prop="max_fds" width="80" align="center" />
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="状态统计" name="stats">
          <el-table :data="stats" size="small">
            <el-table-column label="节点" min-width="180">
              <template slot-scope="{ row }">
                <div class="node-cell"><span class="dot on"></span>{{ row.node }}</div>
              </template>
            </el-table-column>
            <el-table-column label="连接数" width="120" align="center">
              <template slot-scope="{ row }">
                <span class="val">{{ row['connections.count'] }}</span><span class="max"> / {{ row['connections.max'] }}</span>
              </template>
            </el-table-column>
            <el-table-column label="主题" width="120" align="center">
              <template slot-scope="{ row }">
                <span class="val">{{ row['topics.count'] }}</span><span class="max"> / {{ row['topics.max'] }}</span>
              </template>
            </el-table-column>
            <el-table-column label="会话" width="120" align="center">
              <template slot-scope="{ row }">
                <span class="val">{{ row['sessions.count'] }}</span><span class="max"> / {{ row['sessions.max'] }}</span>
              </template>
            </el-table-column>
            <el-table-column label="订阅" width="120" align="center">
              <template slot-scope="{ row }">
                <span class="val">{{ row['suboptions.count'] }}</span><span class="max"> / {{ row['suboptions.max'] }}</span>
              </template>
            </el-table-column>
            <el-table-column label="保留消息" width="120" align="center">
              <template slot-scope="{ row }">
                <span class="val">{{ row['retained.count'] }}</span><span class="max"> / {{ row['retained.max'] }}</span>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="监听端口" name="listeners">
          <el-table :data="listens" size="small">
            <el-table-column label="端口" prop="listen_on" min-width="160">
              <template slot-scope="{ row }"><code class="port">{{ row.listen_on }}</code></template>
            </el-table-column>
            <el-table-column label="协议" width="120" align="center">
              <template slot-scope="{ row }">
                <el-tag size="mini" effect="plain">{{ row.protocol }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="连接数" width="100" align="center" prop="current_conns" />
            <el-table-column label="最大连接" width="100" align="center" prop="max_conns" />
            <el-table-column label="使用率" width="180" align="center">
              <template slot-scope="{ row }">
                <el-progress
                  v-if="row.max_conns > 0"
                  :percentage="Math.min(100, Math.round(row.current_conns / row.max_conns * 100))"
                  :stroke-width="5"
                  :color="getProgressColor(Math.round(row.current_conns / row.max_conns * 100))"
                />
                <span v-else class="max">-</span>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script>
import { get_nodes, get_brokers, get_stats, get_listen } from "@/api/iot/metrics"
import * as echarts from 'echarts'

export default {
  name: "SystemDashboard",
  data() {
    return {
      loading: false,
      refreshing: false,
      refreshInterval: 30,
      refreshTimer: null,
      lastUpdate: '',
      broker: {},
      brokers: [],
      name: undefined,
      nodes: [],
      stats: [],
      listens: [],
      activeTab: 'nodes',
      cpuChart: null,
      memChart: null,
      historyData: { time: [], cpu: {}, mem: {} },
      nodeFields: [
        { key: 'node', label: '名称' },
        { key: 'version', label: '版本' },
        { key: 'otp_release', label: 'OTP' },
        { key: 'uptime', label: '运行时间' },
        { key: 'datetime', label: '系统时间' }
      ]
    }
  },
  computed: {
    sideTheme() {
      return this.$store.state.settings.sideTheme
    },
    allOnline() {
      return this.nodes.length > 0 && this.nodes.every(n => n.node_status === 'Running')
    },
    statCards() {
      const totalConn = this.stats.reduce((sum, s) => sum + (s['connections.count'] || 0), 0)
      const totalTopics = this.stats.reduce((sum, s) => sum + (s['topics.count'] || 0), 0)
      const totalSessions = this.stats.reduce((sum, s) => sum + (s['sessions.count'] || 0), 0)
      const totalSubs = this.stats.reduce((sum, s) => sum + (s['suboptions.count'] || 0), 0)
      const onlineCount = this.nodes.filter(n => n.node_status === 'Running').length

      return [
        { key: 'nodes', label: '节点', value: this.nodes.length, icon: 'el-icon-s-grid', gradient: 'linear-gradient(135deg, #4facfe, #00f2fe)' },
        { key: 'online', label: '在线', value: onlineCount + '/' + this.nodes.length, icon: 'el-icon-circle-check', gradient: 'linear-gradient(135deg, #2af598, #009efd)' },
        { key: 'connections', label: '连接', value: this.formatNum(totalConn), icon: 'el-icon-connection', gradient: 'linear-gradient(135deg, #3b82f6, #22d3ee)' },
        { key: 'topics', label: '主题', value: this.formatNum(totalTopics), icon: 'el-icon-chat-line-square', gradient: 'linear-gradient(135deg, #0ea5e9, #6ee7f9)' },
        { key: 'sessions', label: '会话', value: this.formatNum(totalSessions), icon: 'el-icon-user', gradient: 'linear-gradient(135deg, #4facfe, #00f2fe)' },
        { key: 'subscriptions', label: '订阅', value: this.formatNum(totalSubs), icon: 'el-icon-notebook-2', gradient: 'linear-gradient(135deg, #5b8def, #00d4ff)' }
      ]
    }
  },
  created() {
    this.loadAll()
    this.startAutoRefresh()
  },
  mounted() {
    this.$nextTick(() => {
      this.initCharts()
      setTimeout(() => { this.renderCharts() }, 300)
    })
  },
  beforeDestroy() {
    this.clearTimer()
    if (this.cpuChart) this.cpuChart.dispose()
    if (this.memChart) this.memChart.dispose()
    window.removeEventListener('resize', this.handleResize)
  },
  watch: {
    // 主题切换时，图表重新按新主题配色渲染
    sideTheme() {
      this.$nextTick(() => {
        // 等待 CSS 变量在 DOM 上应用后再读取
        setTimeout(() => { this.renderCharts() }, 60)
      })
    }
  },
  methods: {
    loadAll() {
      this.loading = true
      return Promise.all([this.getNodeList(), this.getBrokers(), this.getStats()]).finally(() => {
        this.loading = false
        this.lastUpdate = this.formatTime(new Date())
        // 刷新后重新同步当前选中节点的信息（系统时间/运行时间等随之更新）
        if (this.name) this.changeNode()
        this.recordHistory()
        this.renderCharts()
      })
    },
    refreshAll() {
      this.refreshing = true
      this.loadAll().finally(() => { this.refreshing = false })
    },
    changeInterval() {
      this.startAutoRefresh()
    },
    startAutoRefresh() {
      this.clearTimer()
      if (this.refreshInterval > 0) {
        this.refreshTimer = setInterval(() => { this.loadAll() }, this.refreshInterval * 1000)
      }
    },
    clearTimer() {
      if (this.refreshTimer) { clearInterval(this.refreshTimer); this.refreshTimer = null }
    },
    getNodeList() {
      return get_nodes().then(res => { this.nodes = res.data || [] }).catch(() => {})
    },
    getBrokers() {
      return get_brokers().then(res => {
        this.brokers = res.data || []
        if (this.brokers.length > 0 && !this.name) { this.name = this.brokers[0].node; this.changeNode() }
      }).catch(() => {})
    },
    getStats() {
      return get_stats().then(res => { this.stats = res.data || [] }).catch(() => {})
    },
    getListens() {
      return get_listen({ node: this.name }).then(res => { this.listens = res.data || [] }).catch(() => {})
    },
    changeNode() {
      const b = this.brokers.find(item => item.node === this.name)
      if (b) this.broker = { ...b }
      const n = this.nodes.find(item => item.node === this.name)
      if (n) this.broker = { ...this.broker, otp_release: n.otp_release }
      this.getListens()
    },
    getNodePosition(index) {
      const total = this.nodes.length
      const angle = (360 / total) * index - 90
      const r = 90
      return { transform: `translate(${Math.cos(angle * Math.PI / 180) * r}px, ${Math.sin(angle * Math.PI / 180) * r}px)` }
    },
    getLineEnd(index) {
      const total = this.nodes.length
      const angle = (360 / total) * index - 90
      const r = 90
      return {
        x: +(Math.cos(angle * Math.PI / 180) * r).toFixed(2),
        y: +(Math.sin(angle * Math.PI / 180) * r).toFixed(2)
      }
    },
    getMemPercent(row) {
      if (!row.memory_total) return 0
      return Math.round((row.memory_used / row.memory_total) * 100)
    },
    getProgressColor(p) {
      if (p > 80) return '#f56c6c'
      if (p > 60) return '#e6a23c'
      return '#67c23a'
    },
    formatMemory(bytes) {
      if (!bytes) return '0'
      const mb = bytes / 1024 / 1024
      return mb >= 1024 ? (mb / 1024).toFixed(1) + 'G' : mb.toFixed(0) + 'M'
    },
    formatNum(num) {
      if (!num) return '0'
      if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
      if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
      return num.toString()
    },
    formatTime(d) {
      const p = n => String(n).padStart(2, '0')
      return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
    },
    initCharts() {
      const opts = { renderer: 'canvas' }
      if (this.$refs.cpuChart) this.cpuChart = echarts.init(this.$refs.cpuChart, null, opts)
      if (this.$refs.memChart) this.memChart = echarts.init(this.$refs.memChart, null, opts)
      if (this.cpuChart) this.cpuChart.setOption({ backgroundColor: 'transparent' })
      if (this.memChart) this.memChart.setOption({ backgroundColor: 'transparent' })
      window.addEventListener('resize', this.handleResize)
    },
    handleResize() {
      if (this.cpuChart) this.cpuChart.resize()
      if (this.memChart) this.memChart.resize()
    },
    recordHistory() {
      if (!this.nodes.length) return
      const now = this.formatTime(new Date())
      const maxPoints = 20

      this.historyData.time.push(now)
      if (this.historyData.time.length > maxPoints) this.historyData.time.shift()

      this.nodes.forEach(node => {
        if (!this.historyData.cpu[node.node]) this.historyData.cpu[node.node] = []
        if (!this.historyData.mem[node.node]) this.historyData.mem[node.node] = []

        this.historyData.cpu[node.node].push(parseFloat(node.load1) || 0)
        this.historyData.mem[node.node].push(this.getMemPercent(node))

        if (this.historyData.cpu[node.node].length > maxPoints) this.historyData.cpu[node.node].shift()
        if (this.historyData.mem[node.node].length > maxPoints) this.historyData.mem[node.node].shift()
      })
    },
    renderCharts() {
      if (!this.cpuChart || !this.memChart) {
        this.$nextTick(() => {
          this.initCharts()
          this.renderCharts()
        })
        return
      }

      // 从当前主题的 CSS 变量读取配色，跟随主题切换
      const theme = this.readThemeColors()
      const axisColor = theme.axis
      const labelColor = theme.label
      const splitColor = theme.split
      const legendColor = theme.legend

      // 以主题强调色为主，叠加几个和谐色相，适配多节点
      const colors = theme.series
      const timeData = this.historyData.time

      const makeSeries = (dataMap) => this.nodes.map((node, i) => {
        const c = colors[i % colors.length]
        return {
          name: node.node,
          type: 'line',
          smooth: true,
          symbol: 'none',
          lineStyle: {
            width: 2.5,
            shadowColor: theme.isDark ? c : 'transparent',
            shadowBlur: theme.isDark ? 10 : 0
          },
          itemStyle: { color: c },
          areaStyle: {
            opacity: 1,
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: this.colorAlpha(c, theme.isDark ? 0.35 : 0.22) },
              { offset: 1, color: this.colorAlpha(c, 0) }
            ])
          },
          data: dataMap[node.node] || []
        }
      })

      const cpuSeries = makeSeries(this.historyData.cpu)
      const memSeries = makeSeries(this.historyData.mem)

      const baseOption = {
        backgroundColor: 'transparent',
        color: colors,
        tooltip: {
          trigger: 'axis',
          backgroundColor: theme.tooltipBg,
          borderColor: theme.tooltipBorder,
          borderWidth: 1,
          padding: [8, 12],
          textStyle: { color: theme.tooltipText, fontSize: 12 },
          extraCssText: 'backdrop-filter: blur(6px); border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);'
        },
        legend: { show: true, bottom: 0, textStyle: { fontSize: 11, color: legendColor }, itemWidth: 12, itemHeight: 8 },
        grid: { top: 12, right: 16, bottom: 50, left: 40 },
        xAxis: { type: 'category', boundaryGap: false, data: timeData, axisLabel: { fontSize: 10, color: labelColor }, axisLine: { lineStyle: { color: axisColor } }, axisTick: { show: false } },
        yAxis: { type: 'value', axisLabel: { fontSize: 10, color: labelColor }, splitLine: { lineStyle: { color: splitColor } }, axisLine: { show: false } }
      }

      this.cpuChart.setOption({ ...baseOption, series: cpuSeries }, true)
      this.memChart.setOption({ ...baseOption, yAxis: { ...baseOption.yAxis, max: 100, axisLabel: { fontSize: 10, color: labelColor, formatter: '{value}%' } }, series: memSeries }, true)
    },
    // 读取当前主题 CSS 变量，推导图表配色
    readThemeColors() {
      const el = this.$el && this.$el.classList ? this.$el : document.querySelector('.node-dashboard')
      const cs = el ? getComputedStyle(el) : null
      const accent = (cs && cs.getPropertyValue('--nd-accent').trim()) || '#0071e3'
      const accentRgb = (cs && cs.getPropertyValue('--nd-accent-rgb').trim()) || '0, 113, 227'
      const glow = parseFloat((cs && cs.getPropertyValue('--nd-glow-strength')) || '0')
      const isDark = glow >= 0.5
      // 以强调色为首，补几个和谐节点色
      const series = isDark
        ? [accent, '#2af598', '#6ee7f9', '#f6c453', '#ff8fab', '#a78bfa']
        : [accent, '#34c759', '#13bfd6', '#e6a23c', '#f56c6c', '#8e7bef']
      return {
        isDark,
        series,
        axis: `rgba(${accentRgb}, ${isDark ? 0.15 : 0.18})`,
        label: isDark ? 'rgba(220, 230, 245, 0.5)' : 'rgba(29, 29, 31, 0.5)',
        split: `rgba(${accentRgb}, ${isDark ? 0.06 : 0.08})`,
        legend: isDark ? 'rgba(220, 230, 245, 0.65)' : 'rgba(29, 29, 31, 0.6)',
        tooltipBg: isDark ? 'rgba(13, 22, 41, 0.88)' : 'rgba(255, 255, 255, 0.92)',
        tooltipBorder: `rgba(${accentRgb}, 0.35)`,
        tooltipText: isDark ? '#e8f0fb' : '#1d1d1f'
      }
    },
    // 颜色转带透明度 rgba，支持 #hex 与 rgb()/颜色关键字
    colorAlpha(color, alpha) {
      if (color && color.charAt(0) === '#') {
        const h = color.replace('#', '')
        const full = h.length === 3 ? h.split('').map(x => x + x).join('') : h
        const r = parseInt(full.substring(0, 2), 16)
        const g = parseInt(full.substring(2, 4), 16)
        const b = parseInt(full.substring(4, 6), 16)
        return `rgba(${r}, ${g}, ${b}, ${alpha})`
      }
      // rgb(...) -> rgba
      const m = color && color.match(/rgba?\(([^)]+)\)/)
      if (m) {
        const parts = m[1].split(',').slice(0, 3).map(s => s.trim())
        return `rgba(${parts.join(', ')}, ${alpha})`
      }
      return color
    }
  }
}
</script>

<style lang="scss" scoped>
/* ============================================================
   MQTT 集群监控 —— 主题自适应（CSS 变量驱动）
   默认值 = 明亮白(浅色)。深色主题在页面底部的非 scoped 块里
   仅覆盖这组变量即可，结构样式全部引用 var()。
   ============================================================ */
.node-dashboard {
  /* ---- 默认（浅色：明亮白 / 科技蓝）变量 ---- */
  --nd-accent: #0071e3;            // 强调色
  --nd-accent-2: #46a0ff;          // 强调色2（渐变用）
  --nd-accent-rgb: 0, 113, 227;    // 强调色 rgb（做半透明）
  --nd-bg: radial-gradient(1200px 600px at 15% -10%, rgba(0, 113, 227, 0.06), transparent 60%),
           linear-gradient(160deg, #f7f9fc 0%, #eef2f7 100%);
  --nd-grid: rgba(0, 113, 227, 0.05);
  --nd-glass: rgba(255, 255, 255, 0.72);
  --nd-glass-border: rgba(0, 0, 0, 0.07);
  --nd-glass-shadow: 0 6px 20px rgba(0, 0, 0, 0.06);
  --nd-glass-shadow-hover: 0 12px 28px rgba(0, 113, 227, 0.14);
  --nd-inset-hi: inset 0 1px 0 rgba(255, 255, 255, 0.7);
  --nd-text: #1d1d1f;              // 主文字
  --nd-text-sub: rgba(29, 29, 31, 0.55);  // 次文字
  --nd-text-soft: rgba(29, 29, 31, 0.85);
  --nd-row-soft: rgba(0, 0, 0, 0.03);      // 信息项底
  --nd-hover: rgba(0, 113, 227, 0.08);     // hover 高亮
  --nd-th-bg: rgba(0, 113, 227, 0.06);     // 表头底
  --nd-border-soft: rgba(0, 0, 0, 0.08);
  --nd-glow-strength: 0;           // 发光强度(浅色关掉, 深色开)
  --nd-success: #34c759;
  --nd-danger: #f56c6c;

  position: relative;
  padding: 20px;
  min-height: 100%;
  color: var(--nd-text);
  background: var(--nd-bg);

  // 氛围网格层
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background-image:
      linear-gradient(var(--nd-grid) 1px, transparent 1px),
      linear-gradient(90deg, var(--nd-grid) 1px, transparent 1px);
    background-size: 36px 36px;
    mask-image: radial-gradient(ellipse at 50% 40%, #000 55%, transparent 100%);
    -webkit-mask-image: radial-gradient(ellipse at 50% 40%, #000 55%, transparent 100%);
  }

  > * { position: relative; z-index: 1; }
}

/* ---------- 顶部栏 ---------- */
.dashboard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.header-left { display: flex; align-items: baseline; gap: 14px; }

.page-title {
  font-size: 19px;
  font-weight: 700;
  letter-spacing: 2px;
  color: var(--nd-text);
  text-shadow: 0 0 calc(18px * var(--nd-glow-strength)) rgba(var(--nd-accent-rgb), 0.5);
}

.update-time { font-size: 12px; color: var(--nd-text-sub); letter-spacing: 0.5px; }

.header-right { display: flex; align-items: center; gap: 10px; }

/* ---------- 统计卡片（玻璃拟态） ---------- */
.stats-row {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 14px;
  margin-bottom: 18px;
}

.stat-card {
  position: relative;
  overflow: hidden;
  padding: 16px 18px;
  display: flex;
  align-items: center;
  gap: 14px;
  border-radius: 14px;
  background: var(--nd-glass);
  border: 1px solid var(--nd-glass-border);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  box-shadow: var(--nd-inset-hi), var(--nd-glass-shadow);
  transition: transform 0.28s ease, box-shadow 0.28s ease, border-color 0.28s ease;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 10%;
    right: 10%;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--nd-accent-2), transparent);
    opacity: 0.6;
  }

  &:hover {
    transform: translateY(-4px);
    border-color: rgba(var(--nd-accent-rgb), 0.4);
    box-shadow: var(--nd-inset-hi), var(--nd-glass-shadow-hover);
    .stat-icon { transform: scale(1.08); }
  }
}

.stat-icon {
  position: relative;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: linear-gradient(135deg, var(--nd-accent-2), var(--nd-accent));
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.18);
  transition: transform 0.28s ease;
  i { font-size: 20px; color: #fff; filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.25)); }

  &::after {
    content: '';
    position: absolute;
    inset: -5px;
    border-radius: 14px;
    background: inherit;
    filter: blur(14px);
    opacity: calc(0.25 + 0.3 * var(--nd-glow-strength));
    z-index: -1;
  }
}

.stat-info { display: flex; flex-direction: column; gap: 4px; }
.stat-label { font-size: 12px; color: var(--nd-text-sub); letter-spacing: 1px; }

.stat-value {
  font-size: 24px;
  font-weight: 800;
  line-height: 1.05;
  color: var(--nd-text);
  font-variant-numeric: tabular-nums;
  text-shadow: 0 0 calc(14px * var(--nd-glow-strength)) rgba(var(--nd-accent-rgb), 0.55);
}

/* ---------- 栅格 / 面板 ---------- */
.grid-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
  margin-bottom: 14px;
  &.two-col { grid-template-columns: 360px 1fr; }
}

.panel {
  position: relative;
  padding: 18px;
  margin-bottom: 14px;
  border-radius: 14px;
  background: var(--nd-glass);
  border: 1px solid var(--nd-glass-border);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  box-shadow: var(--nd-inset-hi), var(--nd-glass-shadow);
  transition: border-color 0.28s ease, box-shadow 0.28s ease;

  &:hover {
    border-color: rgba(var(--nd-accent-rgb), 0.3);
    box-shadow: var(--nd-inset-hi), var(--nd-glass-shadow-hover);
  }
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--nd-border-soft);
}

.panel-title {
  position: relative;
  padding-left: 13px;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.5px;
  color: var(--nd-text);

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 15px;
    border-radius: 2px;
    background: linear-gradient(180deg, var(--nd-accent-2), var(--nd-accent));
    box-shadow: 0 0 calc(8px * var(--nd-glow-strength)) rgba(var(--nd-accent-rgb), 0.6);
  }
}

.panel-count { font-size: 12px; color: var(--nd-text-sub); }

/* ---------- 当前节点信息 ---------- */
.info-row { display: flex; flex-direction: column; gap: 9px; }

.info-row .info-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 13px;
  border-radius: 8px;
  background: var(--nd-row-soft);
  border-left: 2px solid transparent;
  transition: background 0.2s ease, border-color 0.2s ease;

  &:hover { background: var(--nd-hover); border-left-color: var(--nd-accent); }
}

.info-label { font-size: 12px; color: var(--nd-text-sub); }

.info-value {
  font-size: 12px;
  color: var(--nd-text-soft);
  &.highlight {
    color: var(--nd-accent);
    font-weight: 600;
    text-shadow: 0 0 calc(10px * var(--nd-glow-strength)) rgba(var(--nd-accent-rgb), 0.5);
  }
}

/* ---------- 拓扑 ---------- */
.topology {
  position: relative;
  height: 240px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.topo-lines {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 0;
  overflow: visible;
}

.topo-line {
  stroke: rgba(var(--nd-accent-rgb), 0.5);
  stroke-width: 1.5;
  stroke-dasharray: 4 6;
  filter: drop-shadow(0 0 calc(3px * var(--nd-glow-strength)) rgba(var(--nd-accent-rgb), 0.6));
  animation: dashFlow 1s linear infinite;

  &.offline {
    stroke: rgba(245, 108, 108, 0.4);
    filter: none;
    animation: none;
  }
}

@keyframes dashFlow { to { stroke-dashoffset: -20; } }

.topo-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  z-index: 1;
}

.center-ring {
  position: absolute;
  top: 10px;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  border: 2px solid rgba(var(--nd-accent-rgb), 0.35);
  animation: ringPulse 3s ease-in-out infinite;
}

.center-icon {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, var(--nd-accent-2), var(--nd-accent));
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 calc(24px * (0.4 + 0.6 * var(--nd-glow-strength))) rgba(var(--nd-accent-rgb), 0.55),
              inset 0 0 10px rgba(255, 255, 255, 0.25);
  i { font-size: 24px; color: #fff; }
}

.center-label {
  margin-top: 8px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 2px;
  color: var(--nd-text-sub);
}

.topo-node {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 7px;
  z-index: 1;

  &.offline {
    .node-icon {
      background: linear-gradient(135deg, #f56c6c, #c0392b);
      box-shadow: 0 0 14px rgba(245, 108, 108, 0.5);
    }
    .server-svg { color: #fff; }
    .node-name { color: var(--nd-danger); }
  }
}

.node-icon {
  position: relative;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--nd-accent-2), var(--nd-accent));
  box-shadow: 0 0 calc(16px * (0.3 + 0.7 * var(--nd-glow-strength))) rgba(var(--nd-accent-rgb), 0.55),
              inset 0 0 6px rgba(255, 255, 255, 0.2);
}

.server-svg {
  position: relative;
  z-index: 1;
  color: #fff;

  rect { fill: none; stroke: currentColor; stroke-width: 1.6; }
  line { stroke: currentColor; stroke-width: 1.4; stroke-linecap: round; opacity: 0.85; }
  .led { fill: #eafff8; stroke: none; }
}

.node-pulse {
  position: absolute;
  inset: -5px;
  border-radius: 11px;
  border: 1.5px solid rgba(var(--nd-accent-rgb), 0.75);
  animation: pulse 2.4s ease-in-out infinite;
}

.node-detail { display: flex; flex-direction: column; }
.node-name { font-size: 11px; font-weight: 600; color: var(--nd-text); white-space: nowrap; }
.node-sub { font-size: 10px; color: var(--nd-text-sub); }

/* ---------- 表格内通用小元素 ---------- */
.node-cell { display: flex; align-items: center; gap: 6px; color: var(--nd-text); }

.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
  &.on { background: var(--nd-success); box-shadow: 0 0 calc(8px * var(--nd-glow-strength)) rgba(52, 199, 89, 0.7); }
  &.off { background: var(--nd-danger); box-shadow: 0 0 calc(8px * var(--nd-glow-strength)) rgba(245, 108, 108, 0.6); }
}

.val { font-weight: 700; color: var(--nd-text); }
.max { color: var(--nd-text-sub); font-size: 12px; }

.mem-bar { display: flex; flex-direction: column; gap: 3px; }
.mem-text { font-size: 11px; color: var(--nd-text-sub); }

.port {
  font-size: 12px;
  color: var(--nd-accent);
  background: rgba(var(--nd-accent-rgb), 0.08);
  border: 1px solid rgba(var(--nd-accent-rgb), 0.2);
  padding: 2px 7px;
  border-radius: 4px;
}

/* ---------- 图表容器 ---------- */
.chart-container { height: 230px; }
.chart-row .panel { margin-bottom: 0; }

/* ---------- Element 表格深色/浅色自适应（变量驱动） ---------- */
.panel ::v-deep .el-table {
  background-color: transparent !important;
  color: var(--nd-text);
  &::before, &::after { display: none; }

  .el-table__body-wrapper,
  .el-table__header-wrapper,
  .el-table__footer-wrapper,
  .el-table__fixed,
  .el-table__fixed-right,
  .el-table__body,
  .el-table__header { background-color: transparent !important; }

  th.el-table__cell {
    background-color: var(--nd-th-bg) !important;
    color: var(--nd-text-sub);
    font-weight: 600;
    border-bottom-color: var(--nd-border-soft) !important;
  }
  tr { background-color: transparent !important; }
  td.el-table__cell {
    background-color: transparent !important;
    border-bottom-color: var(--nd-border-soft) !important;
    color: var(--nd-text-soft);
  }
  .el-table__row--striped td.el-table__cell { background-color: var(--nd-row-soft) !important; }
  tbody tr:hover > td.el-table__cell { background-color: var(--nd-hover) !important; }
  .el-table__empty-block { background-color: transparent !important; }
  .el-table__empty-text { color: var(--nd-text-sub); }
}

.panel ::v-deep .el-tabs {
  .el-tabs__item {
    color: var(--nd-text-sub);
    &.is-active { color: var(--nd-accent); }
    &:hover { color: var(--nd-text); }
  }
  .el-tabs__active-bar { background: linear-gradient(90deg, var(--nd-accent), var(--nd-accent-2)); height: 2px; }
  .el-tabs__nav-wrap::after { background-color: var(--nd-border-soft); }
}

.header-right ::v-deep {
  .el-input__inner {
    background: var(--nd-row-soft);
    border-color: var(--nd-glass-border);
    color: var(--nd-text);
    &::placeholder { color: var(--nd-text-sub); }
    &:focus { border-color: var(--nd-accent); }
  }
  .el-button {
    background: var(--nd-row-soft);
    border-color: var(--nd-glass-border);
    color: var(--nd-text);
    &:hover { border-color: var(--nd-accent); color: var(--nd-accent); }
  }
  .el-switch__label { color: var(--nd-text-sub); }
  .el-switch__label.is-active { color: var(--nd-accent); }
}

/* ---------- 动画 ---------- */
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0; transform: scale(1.7); }
}
@keyframes ringPulse {
  0%, 100% { transform: scale(1); opacity: 0.4; }
  50% { transform: scale(1.18); opacity: 0; }
}

/* ---------- 响应式 ---------- */
@media (max-width: 1400px) {
  .stats-row { grid-template-columns: repeat(3, 1fr); }
  .grid-row.two-col { grid-template-columns: 1fr; }
}
@media (max-width: 900px) {
  .stats-row { grid-template-columns: repeat(2, 1fr); }
}
</style>

<style lang="scss">
/* ============================================================
   各主题变量覆盖（非 scoped：主题 class 在 body 上）
   - 明亮白 / 科技蓝：沿用 scoped 默认浅色，无需覆盖
   - 深空黑 / 午夜蓝 / 森林绿：各自深色氛围 + 强调色
   ============================================================ */

/* 科技蓝：浅背景但强调色偏科技蓝，略增强调氛围 */
.theme-blue .node-dashboard {
  --nd-accent: #0071e3;
  --nd-accent-2: #4a9bff;
  --nd-accent-rgb: 0, 113, 227;
  --nd-bg: radial-gradient(1200px 600px at 15% -10%, rgba(0, 113, 227, 0.08), transparent 60%),
           linear-gradient(160deg, #eef4fe 0%, #e7eef9 100%);
  --nd-grid: rgba(0, 113, 227, 0.06);
}

/* 深空黑 */
.theme-dark .node-dashboard {
  --nd-accent: #2997ff;
  --nd-accent-2: #5fb4ff;
  --nd-accent-rgb: 41, 151, 255;
  --nd-bg: radial-gradient(1200px 600px at 15% -10%, rgba(41, 151, 255, 0.14), transparent 60%),
           linear-gradient(160deg, #15151a 0%, #1d1d22 55%, #141418 100%);
  --nd-grid: rgba(120, 180, 255, 0.045);
  --nd-glass: rgba(255, 255, 255, 0.045);
  --nd-glass-border: rgba(140, 190, 255, 0.14);
  --nd-glass-shadow: 0 8px 24px rgba(0, 0, 0, 0.28);
  --nd-glass-shadow-hover: 0 14px 34px rgba(41, 151, 255, 0.22);
  --nd-inset-hi: inset 0 1px 0 rgba(255, 255, 255, 0.08);
  --nd-text: #f5f5f7;
  --nd-text-sub: rgba(220, 230, 245, 0.5);
  --nd-text-soft: rgba(245, 245, 247, 0.85);
  --nd-row-soft: rgba(255, 255, 255, 0.03);
  --nd-hover: rgba(41, 151, 255, 0.12);
  --nd-th-bg: rgba(41, 151, 255, 0.1);
  --nd-border-soft: rgba(140, 190, 255, 0.1);
  --nd-glow-strength: 1;
}

/* 午夜蓝 */
.theme-dark-blue .node-dashboard {
  --nd-accent: #4267c4;
  --nd-accent-2: #6d8ef0;
  --nd-accent-rgb: 66, 103, 196;
  --nd-bg: radial-gradient(1200px 600px at 15% -10%, rgba(99, 140, 240, 0.18), transparent 60%),
           linear-gradient(160deg, #0b1440 0%, #0c1535 55%, #0a1030 100%);
  --nd-grid: rgba(120, 160, 255, 0.05);
  --nd-glass: rgba(60, 90, 180, 0.12);
  --nd-glass-border: rgba(120, 155, 240, 0.18);
  --nd-glass-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
  --nd-glass-shadow-hover: 0 14px 34px rgba(66, 103, 196, 0.35);
  --nd-inset-hi: inset 0 1px 0 rgba(255, 255, 255, 0.07);
  --nd-text: #e6ecfb;
  --nd-text-sub: rgba(200, 212, 245, 0.5);
  --nd-text-soft: rgba(230, 236, 251, 0.85);
  --nd-row-soft: rgba(255, 255, 255, 0.035);
  --nd-hover: rgba(99, 140, 240, 0.16);
  --nd-th-bg: rgba(99, 140, 240, 0.12);
  --nd-border-soft: rgba(120, 155, 240, 0.14);
  --nd-glow-strength: 1;
}

/* 森林绿 */
.theme-green .node-dashboard {
  --nd-accent: #34c759;
  --nd-accent-2: #5fe07e;
  --nd-accent-rgb: 52, 199, 89;
  --nd-bg: radial-gradient(1200px 600px at 15% -10%, rgba(52, 199, 89, 0.16), transparent 60%),
           linear-gradient(160deg, #0f1e13 0%, #121e15 55%, #0d1a11 100%);
  --nd-grid: rgba(120, 220, 150, 0.05);
  --nd-glass: rgba(255, 255, 255, 0.045);
  --nd-glass-border: rgba(120, 220, 150, 0.16);
  --nd-glass-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  --nd-glass-shadow-hover: 0 14px 34px rgba(52, 199, 89, 0.26);
  --nd-inset-hi: inset 0 1px 0 rgba(255, 255, 255, 0.08);
  --nd-text: #e9f7ec;
  --nd-text-sub: rgba(210, 240, 218, 0.5);
  --nd-text-soft: rgba(233, 247, 236, 0.85);
  --nd-row-soft: rgba(255, 255, 255, 0.03);
  --nd-hover: rgba(52, 199, 89, 0.14);
  --nd-th-bg: rgba(52, 199, 89, 0.12);
  --nd-border-soft: rgba(120, 220, 150, 0.12);
  --nd-glow-strength: 1;
}
</style>
