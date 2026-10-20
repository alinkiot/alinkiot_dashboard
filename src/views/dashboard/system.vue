<template>
  <div class="node-dashboard" v-loading="loading">
    <div class="dashboard-header">
      <div class="header-left">
        <span class="page-title">MQTT 集群监控</span>
        <span class="update-time">{{ lastUpdate }}</span>
      </div>
      <div class="header-right">
        <el-select v-model="name" size="mini" placeholder="选择节点" @change="changeNode" style="width: 200px;">
          <el-option v-for="item in brokers" :key="item.node" :label="item.node" :value="item.node" />
        </el-select>
        <el-button size="mini" icon="el-icon-refresh" :loading="refreshing" @click="refreshAll">刷新</el-button>
        <el-switch v-model="autoRefresh" active-text="自动" @change="toggleAutoRefresh" />
      </div>
    </div>

    <div class="stats-row">
      <div class="stat-card" v-for="item in statCards" :key="item.key">
        <div class="stat-icon" :style="{ background: item.gradient }">
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
            <div class="node-dot"><div class="node-pulse" v-if="node.node_status === 'Running'"></div></div>
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
      autoRefresh: true,
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
        { key: 'nodes', label: '节点', value: this.nodes.length, icon: 'el-icon-s-grid', gradient: 'linear-gradient(135deg, #667eea, #764ba2)' },
        { key: 'online', label: '在线', value: onlineCount + '/' + this.nodes.length, icon: 'el-icon-circle-check', gradient: 'linear-gradient(135deg, #11998e, #38ef7d)' },
        { key: 'connections', label: '连接', value: this.formatNum(totalConn), icon: 'el-icon-connection', gradient: 'linear-gradient(135deg, #fc5c7d, #6a82fb)' },
        { key: 'topics', label: '主题', value: this.formatNum(totalTopics), icon: 'el-icon-chat-line-square', gradient: 'linear-gradient(135deg, #f093fb, #f5576c)' },
        { key: 'sessions', label: '会话', value: this.formatNum(totalSessions), icon: 'el-icon-user', gradient: 'linear-gradient(135deg, #4facfe, #00f2fe)' },
        { key: 'subscriptions', label: '订阅', value: this.formatNum(totalSubs), icon: 'el-icon-notebook-2', gradient: 'linear-gradient(135deg, #fa709a, #fee140)' }
      ]
    }
  },
  created() {
    this.loadAll()
    this.toggleAutoRefresh(true)
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
  methods: {
    loadAll() {
      this.loading = true
      Promise.all([this.getNodeList(), this.getBrokers(), this.getStats()]).finally(() => {
        this.loading = false
        this.lastUpdate = this.formatTime(new Date())
        this.recordHistory()
        this.renderCharts()
      })
    },
    refreshAll() {
      this.refreshing = true
      this.loadAll().finally(() => { this.refreshing = false })
    },
    toggleAutoRefresh(val) {
      this.clearTimer()
      if (val) this.refreshTimer = setInterval(() => { this.loadAll() }, 30000)
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

      const isDark = document.body.className.includes('theme-dark') || document.body.className.includes('theme-green')
      const axisColor = isDark ? 'rgba(255,255,255,0.2)' : '#ddd'
      const labelColor = isDark ? 'rgba(255,255,255,0.5)' : '#666'
      const splitColor = isDark ? 'rgba(255,255,255,0.06)' : '#f0f0f0'
      const legendColor = isDark ? 'rgba(255,255,255,0.6)' : '#666'

      const colors = ['#667eea', '#67c23a', '#e6a23c', '#f56c6c', '#909399']
      const timeData = this.historyData.time

      const cpuSeries = this.nodes.map((node, i) => ({
        name: node.node,
        type: 'line',
        smooth: true,
        symbol: 'none',
        lineStyle: { width: 2 },
        areaStyle: { opacity: 0.05 },
        data: this.historyData.cpu[node.node] || []
      }))

      const memSeries = this.nodes.map((node, i) => ({
        name: node.node,
        type: 'line',
        smooth: true,
        symbol: 'none',
        lineStyle: { width: 2 },
        areaStyle: { opacity: 0.05 },
        data: this.historyData.mem[node.node] || []
      }))

      const baseOption = {
        backgroundColor: 'transparent',
        color: colors,
        tooltip: { trigger: 'axis', backgroundColor: isDark ? 'rgba(30,30,50,0.9)' : '#fff', borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#ccc', textStyle: { color: isDark ? '#f5f5f7' : '#333' } },
        legend: { show: true, bottom: 0, textStyle: { fontSize: 11, color: legendColor } },
        grid: { top: 10, right: 16, bottom: 50, left: 40 },
        xAxis: { type: 'category', data: timeData, axisLabel: { fontSize: 10, color: labelColor }, axisLine: { lineStyle: { color: axisColor } } },
        yAxis: { type: 'value', axisLabel: { fontSize: 10, color: labelColor }, splitLine: { lineStyle: { color: splitColor } }, axisLine: { show: false } }
      }

      this.cpuChart.setOption({ ...baseOption, series: cpuSeries }, true)
      this.memChart.setOption({ ...baseOption, yAxis: { ...baseOption.yAxis, max: 100, axisLabel: { fontSize: 10, color: labelColor, formatter: '{value}%' } }, series: memSeries }, true)
    }
  }
}
</script>

<style lang="scss" scoped>
.node-dashboard {
  padding: 16px;
}

.dashboard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.update-time {
  font-size: 12px;
  color: #909399;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid #f0f0f0;
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }
}

.stat-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  i { font-size: 17px; color: #fff; }
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-label {
  font-size: 12px;
  color: #909399;
}

.stat-value {
  font-size: 18px;
  font-weight: 700;
  color: #303133;
}

.grid-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  margin-bottom: 12px;

  &.two-col {
    grid-template-columns: 350px 1fr;
  }
}

.info-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-row .info-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  background: #fafafa;
  border-radius: 6px;
}

.panel {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #f0f0f0;
  margin-bottom: 12px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.panel-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.panel-count {
  font-size: 12px;
  color: #909399;
}

.info-label {
  font-size: 12px;
  color: #909399;
}

.info-value {
  font-size: 12px;
  color: #303133;
  &.highlight { color: #667eea; font-weight: 500; }
}

.topology {
  position: relative;
  height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.topo-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.center-ring {
  position: absolute;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  border: 2px solid rgba(102, 126, 234, 0.2);
  animation: ringPulse 3s ease-in-out infinite;
}

.center-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex;
  align-items: center;
  justify-content: center;
  i { font-size: 20px; color: #fff; }
}

.center-label {
  margin-top: 6px;
  font-size: 11px;
  font-weight: 500;
  color: #606266;
}

.topo-node {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 6px;

  &.offline {
    .node-dot { background: #f56c6c; }
    .node-name { color: #f56c6c; }
  }
}

.node-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #67c23a;
  position: relative;
  flex-shrink: 0;
}

.node-pulse {
  position: absolute;
  inset: -3px;
  border-radius: 50%;
  border: 1.5px solid #67c23a;
  animation: pulse 2.5s ease-in-out infinite;
}

.node-detail {
  display: flex;
  flex-direction: column;
}

.node-name {
  font-size: 11px;
  font-weight: 500;
  color: #303133;
  white-space: nowrap;
}

.node-sub {
  font-size: 10px;
  color: #909399;
}

.node-cell {
  display: flex;
  align-items: center;
  gap: 6px;
}

.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
  &.on { background: #67c23a; }
  &.off { background: #f56c6c; }
}

.val {
  font-weight: 600;
  color: #303133;
}

.max {
  color: #c0c4cc;
  font-size: 12px;
}

.mem-bar {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.mem-text {
  font-size: 11px;
  color: #909399;
}

.port {
  font-size: 12px;
  color: #303133;
  background: #f5f7fa;
  padding: 2px 6px;
  border-radius: 3px;
}

.chart-container {
  height: 220px;
}

.chart-row .panel {
  margin-bottom: 0;
}

.panel ::v-deep .el-table {
  background-color: transparent;
  &::before, &::after { display: none; }
  th.el-table__cell { background-color: transparent; border-bottom-color: #ebeef5; }
  tr { background-color: transparent; }
  td.el-table__cell { border-bottom-color: #f0f0f0; }
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0; transform: scale(1.8); }
}

@keyframes ringPulse {
  0%, 100% { transform: scale(1); opacity: 0.4; }
  50% { transform: scale(1.15); opacity: 0; }
}

@media (max-width: 1400px) {
  .stats-row { grid-template-columns: repeat(3, 1fr); }
  .grid-row.two-col { grid-template-columns: 1fr; }
}

@media (max-width: 900px) {
  .stats-row { grid-template-columns: repeat(2, 1fr); }
}
</style>

<style lang="scss">
.theme-dark,
.theme-dark-blue,
.theme-green {
  .node-dashboard {
    .page-title { color: #f5f5f7; }
    .update-time { color: rgba(255, 255, 255, 0.4); }

    .stat-card,
    .panel {
      background: rgba(255, 255, 255, 0.04);
      border-color: rgba(255, 255, 255, 0.08);
    }

    .stat-value, .panel-title, .val, .node-name, .node-cell, .port { color: #f5f5f7; }
    .stat-label, .panel-count, .info-label, .max, .node-sub, .mem-text { color: rgba(255, 255, 255, 0.45); }
    .info-item { background: rgba(255, 255, 255, 0.04); }
    .info-value { color: rgba(255, 255, 255, 0.8); &.highlight { color: #8fa4f3; } }
    .center-label { color: rgba(255, 255, 255, 0.7); }
    .port { background: rgba(255, 255, 255, 0.06); color: #f5f5f7; }

    .el-tabs__item {
      color: rgba(255, 255, 255, 0.6);
      &.is-active { color: #f5f5f7; }
    }
    .el-tabs__nav-wrap::after {
      background-color: rgba(255, 255, 255, 0.08);
    }

    .el-table,
    .el-table__body-wrapper,
    .el-table__header-wrapper {
      background: transparent !important;
      background-color: transparent !important;
    }
    .el-table th.el-table__cell,
    .el-table tr,
    .el-table td.el-table__cell {
      background: transparent !important;
      background-color: transparent !important;
    }
  }
}
</style>
