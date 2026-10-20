<template>
  <div class="dashboard-screen" :class="{ 'is-fullscreen': isFullscreen }">
    <div class="screen-container">
      <!-- 顶部标题栏 -->
      <div class="screen-header">
        <div class="header-left">
          <span class="datetime">{{ now }}</span>
        </div>
        <div class="header-center">
          <h1 class="main-title" @click="handleSelectProject">
            {{ projectTitle }}
            <i class="el-icon-caret-bottom" style="font-size: 18px;" />
          </h1>
        </div>
        <div class="header-right">
          <el-button type="text" class="fullscreen-btn" @click="toggleFullscreen">
            <i :class="isFullscreen ? 'el-icon-close' : 'el-icon-full-screen'" />
            {{ isFullscreen ? '退出全屏' : '全屏' }}
          </el-button>
        </div>
      </div>

      <!-- 主体内容 -->
      <div class="screen-body">
        <!-- 左侧面板 -->
        <div class="panel panel-left">
          <!-- 设备统计 -->
          <div class="panel-card">
            <div class="card-title">设备概览</div>
            <div class="card-body">
              <div class="stat-grid">
                <div class="stat-item">
                  <div class="stat-value online">{{ stats.deviceOnline }}</div>
                  <div class="stat-label">在线设备</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value total">{{ stats.deviceTotal }}</div>
                  <div class="stat-label">设备总数</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value offline">{{ stats.deviceOffline }}</div>
                  <div class="stat-label">离线设备</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value product">{{ stats.productTotal }}</div>
                  <div class="stat-label">产品数</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 设备趋势 -->
          <div class="panel-card flex-1">
            <div class="card-title">设备上线趋势</div>
            <div class="card-body">
              <div ref="deviceTrendChart" class="chart-container" />
            </div>
          </div>
        </div>

        <!-- 中间面板 - 地图 -->
        <div class="panel panel-center">
          <div class="panel-card full-height">
            <div class="card-body map-body">
              <div class="amap-wrapper">
                <el-amap
                  v-if="mapReady"
                  vid="dashboardMap"
                  :amap-manager="amapManager"
                  :zoom="zoom"
                  :center="mapCenter"
                  map-style="amap://styles/blue"
                  :plugin="mapPlugins"
                >
                  <el-amap-marker
                    v-for="marker in deviceMarkers"
                    :key="marker.id"
                    :position="marker.position"
                    :title="marker.name"
                    :icon="marker.icon"
                  />
                </el-amap>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧面板 -->
        <div class="panel panel-right">
          <!-- 告警统计 -->
          <div class="panel-card">
            <div class="card-title">告警统计</div>
            <div class="card-body">
              <div ref="alarmChart" class="chart-container" />
            </div>
          </div>

          <!-- 告警滚动 -->
          <div class="panel-card flex-1">
            <div class="card-title">
              实时告警
              <span class="alarm-badge">{{ alarmList.length }}</span>
            </div>
            <div class="card-body">
              <div ref="alarmScroll" class="alarm-scroll-wrapper" @mouseenter="pauseScroll" @mouseleave="resumeScroll">
                <div class="alarm-scroll-content" :style="{ transform: `translateY(${scrollTop}px)` }">
                  <el-tooltip
                    v-for="(alarm, index) in alarmList"
                    :key="index"
                    placement="left"
                    effect="dark"
                    popper-class="alarm-tooltip"
                    :open-delay="200"
                  >
                    <div slot="content" class="alarm-tooltip-content">{{ alarm.detail }}</div>
                    <div
                      class="alarm-item"
                      :class="['alarm-level-' + alarm.level, { 'alarm-item-hover': hoverIndex === index }]"
                      @mouseenter="hoverIndex = index"
                      @mouseleave="hoverIndex = -1"
                    >
                      <span class="alarm-left">
                        <span class="alarm-level-tag">{{ alarm.levelText }}</span>
                        <span class="alarm-time">{{ alarm.time }}</span>
                      </span>
                      <span class="alarm-content">{{ alarm.content }}</span>
                    </div>
                  </el-tooltip>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部面板 -->
      <div class="screen-footer">
        <div class="footer-card">
          <div class="card-title">产品分布</div>
          <div class="card-body">
            <div ref="productChart" class="chart-container" />
          </div>
        </div>
        <div class="footer-card">
          <div class="card-title">每日设备新增</div>
          <div class="card-body">
            <div ref="messageChart" class="chart-container" />
          </div>
        </div>
        <div class="footer-card">
          <div class="card-title">告警趋势</div>
          <div class="card-body">
            <div ref="alarmTrendChart" class="chart-container" />
          </div>
        </div>
      </div>
    </div>

    <!-- 项目选择弹窗 -->
    <el-dialog title="选择项目" :visible.sync="openSelector" append-to-body width="700px">
      <TableSelect table="project" :column="projectColumn" @selectDone="selectProjectDone" />
    </el-dialog>
  </div>
</template>

<script>
import '@/assets/digit.scss'
import echarts from 'echarts'
import 'echarts/theme/macarons'
import screenfull from 'screenfull'
import { AMapManager } from 'vue-amap'
import { get_dashboard_info } from '@/api/iot/metrics'
import { mapInit } from '@/api/iot/system'
import TableSelect from '@/components/TableSelect/index.vue'
import dayjs from 'dayjs'

const amapManager = new AMapManager()

export default {
  name: 'DashboardScreen',
  components: { TableSelect },
  data() {
    return {
      amapManager,
      zoom: 5,
      mapCenter: [116.397428, 39.90923],
      mapPlugins: ['ToolBar'],
      now: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      isFullscreen: false,
      openSelector: false,
      project: null,
      projectColumn: [
        { label: '项目ID', key: 'id' },
        { label: '项目标识', key: 'name', isSearch: true, regx: true },
        { label: '项目名称', key: 'title', isSearch: true, regx: true },
        { label: '所属公司', key: 'company', isSearch: true, regx: true }
      ],
      stats: {
        deviceOnline: 0,
        deviceTotal: 0,
        deviceOffline: 0,
        productTotal: 0
      },
      deviceMarkers: [],
      alarmList: [],
      scrollTop: 0,
      scrollTimer: null,
      chartInstances: [],
      mapReady: false,
      hoverIndex: -1
    }
  },
  computed: {
    projectTitle() {
      return this.project ? this.project.title : 'IoT 数据监控平台'
    }
  },
  created() {
    this.startClock()
  },
  mounted() {
    this.$nextTick(() => {
      this.initCharts()
    })
    window.addEventListener('resize', this.handleResize)
    if (screenfull.isEnabled) {
      screenfull.on('change', this.fullscreenChange)
    }
    this.fetchData()
    this.initMap()
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize)
    if (screenfull.isEnabled) {
      screenfull.off('change', this.fullscreenChange)
    }
    clearInterval(this.clockTimer)
    clearInterval(this.scrollTimer)
    this.chartInstances.forEach((c) => c && c.dispose())
  },
  methods: {
    startClock() {
      this.clockTimer = setInterval(() => {
        this.now = dayjs().format('YYYY-MM-DD HH:mm:ss')
      }, 1000)
    },

    initMap() {
      const siteInfo = this.$store.state.settings.siteInfo
      if (siteInfo) {
        mapInit(this)
        this.mapReady = true
      } else {
        const unwatch = this.$watch(
          () => this.$store.state.settings.siteInfo,
          (val) => {
            if (val) {
              mapInit(this)
              this.mapReady = true
              unwatch()
            }
          }
        )
      }
    },

    handleResize() {
      this.chartInstances.forEach((c) => c && c.resize())
    },

    toggleFullscreen() {
      if (!screenfull.isEnabled) {
        this.$message.warning('当前浏览器不支持全屏')
        return
      }
      screenfull.toggle(this.$el)
    },

    fullscreenChange() {
      this.isFullscreen = screenfull.isFullscreen
      this.$nextTick(() => this.handleResize())
    },

    handleSelectProject() {
      this.openSelector = true
    },

    selectProjectDone(project) {
      this.openSelector = false
      if (project) {
        this.project = project
      } else {
        this.project = null
      }
      this.fetchData()
    },

    fetchData() {
      const params = {}
      if (this.project) {
        params.project = this.project.name
      }
      get_dashboard_info(params).then((res) => {
        if (res.code === 200 && res.data) {
          const data = res.data
          // 设备统计
          if (data.device) {
            this.stats.deviceTotal = data.device.all_device || 0
            this.stats.deviceOnline = data.device.online_device || 0
            this.stats.deviceOffline = (data.device.all_device || 0) - (data.device.online_device || 0)
          }
          // 产品统计
          if (data.product) {
            this.stats.productTotal = data.product.all_product || 0
          }
          // 告警统计 - 更新饼图
          if (data.alarm && data.alarm.detail) {
            this.updateAlarmChart(data.alarm.detail)
          }
          // 实时告警列表
          if (data.recentAlarms) {
            const levelMap = { '1': 'high', '2': 'medium', '3': 'low' }
            const levelTextMap = { '1': '紧急', '2': '警告', '3': '提示' }
            this.alarmList = data.recentAlarms.map((item) => {
              let detail = item.content || ''
              try {
                const parsed = JSON.parse(item.content)
                detail = parsed.remark || parsed.status || item.content
              } catch (e) {
                detail = item.content || ''
              }
              return {
                time: item.create_time ? dayjs(item.create_time).format('M/D HH:mm:ss') : '',
                level: levelMap[item.level] || 'low',
                levelText: levelTextMap[item.level] || '提示',
                content: item.title || '',
                detail: detail
              }
            })
            this.scrollTop = 0
            clearInterval(this.scrollTimer)
            this.startAlarmScroll()
          }
          // 设备地图
          if (data.deviceMap) {
            this.deviceMarkers = data.deviceMap
              .filter((d) => d.lng && d.lat)
              .map((d) => ({
                id: d.addr,
                name: d.name,
                position: [d.lng, d.lat]
              }))
            this.fitMapView()
          }
          // 每日设备新增
          if (data.deviceDaily) {
            this.updateDeviceDailyChart(data.deviceDaily)
          }
        }
      }).catch(() => {})
    },

    updateAlarmChart(detail) {
      const levelNameMap = { '1': '紧急', '2': '警告', '3': '提示' }
      const levelColorMap = { '1': '#f56c6c', '2': '#e6a23c', '3': '#409eff' }
      const chartData = detail.map((item) => ({
        value: item.count,
        name: levelNameMap[item.level] || item.level,
        itemStyle: { color: levelColorMap[item.level] || '#409eff' }
      }))
      if (this.chartInstances[1]) {
        this.chartInstances[1].setOption({
          series: [{ data: chartData }]
        })
      }
    },

    fitMapView() {
      if (!this.deviceMarkers.length) return
      if (this.deviceMarkers.length === 1) {
        this.mapCenter = this.deviceMarkers[0].position
        this.zoom = 14
        return
      }
      const lngs = this.deviceMarkers.map((m) => m.position[0])
      const lats = this.deviceMarkers.map((m) => m.position[1])
      const minLng = Math.min(...lngs)
      const maxLng = Math.max(...lngs)
      const minLat = Math.min(...lats)
      const maxLat = Math.max(...lats)
      this.mapCenter = [(minLng + maxLng) / 2, (minLat + maxLat) / 2]
      const lngDiff = maxLng - minLng
      const latDiff = maxLat - minLat
      const maxDiff = Math.max(lngDiff, latDiff)
      if (maxDiff > 20) this.zoom = 4
      else if (maxDiff > 10) this.zoom = 5
      else if (maxDiff > 5) this.zoom = 6
      else if (maxDiff > 2) this.zoom = 7
      else if (maxDiff > 1) this.zoom = 8
      else if (maxDiff > 0.5) this.zoom = 10
      else if (maxDiff > 0.1) this.zoom = 12
      else this.zoom = 14
    },

    startAlarmScroll() {
      const itemHeight = 36
      const totalHeight = this.alarmList.length * itemHeight
      this.scrollTimer = setInterval(() => {
        this.scrollTop -= 1
        if (Math.abs(this.scrollTop) >= totalHeight / 2) {
          this.scrollTop = 0
        }
      }, 50)
    },

    pauseScroll() {
      clearInterval(this.scrollTimer)
    },

    resumeScroll() {
      this.hoverIndex = -1
      this.startAlarmScroll()
    },

    initCharts() {
      this.initDeviceTrendChart()
      this.initAlarmChart()
      this.initProductChart()
      this.initMessageChart()
      this.initAlarmTrendChart()
    },

    initDeviceTrendChart() {
      const chart = echarts.init(this.$refs.deviceTrendChart)
      this.chartInstances.push(chart)
      const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`)
      chart.setOption({
        tooltip: { trigger: 'axis' },
        grid: { top: 20, right: 15, bottom: 25, left: 40 },
        xAxis: {
          type: 'category',
          data: hours,
          axisLabel: { color: '#7eb7e1', fontSize: 10 },
          axisLine: { lineStyle: { color: '#1a3a5c' }}
        },
        yAxis: {
          type: 'value',
          axisLabel: { color: '#7eb7e1', fontSize: 10 },
          splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' }},
          axisLine: { lineStyle: { color: '#1a3a5c' }}
        },
        series: [
          {
            name: '在线设备',
            type: 'line',
            smooth: true,
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(0,212,255,0.3)' },
                { offset: 1, color: 'rgba(0,212,255,0)' }
              ])
            },
            lineStyle: { color: '#00d4ff', width: 2 },
            itemStyle: { color: '#00d4ff' },
            data: hours.map(() => Math.floor(80 + Math.random() * 60))
          }
        ]
      })
    },

    initAlarmChart() {
      const chart = echarts.init(this.$refs.alarmChart)
      this.chartInstances.push(chart)
      chart.setOption({
        tooltip: { trigger: 'item' },
        legend: {
          bottom: 0,
          textStyle: { color: '#7eb7e1', fontSize: 10 }
        },
        series: [
          {
            type: 'pie',
            radius: ['40%', '65%'],
            center: ['50%', '45%'],
            label: { show: false },
            data: [
              { value: 12, name: '紧急', itemStyle: { color: '#f56c6c' }},
              { value: 28, name: '警告', itemStyle: { color: '#e6a23c' }},
              { value: 45, name: '提示', itemStyle: { color: '#409eff' }}
            ]
          }
        ]
      })
    },

    initProductChart() {
      const chart = echarts.init(this.$refs.productChart)
      this.chartInstances.push(chart)
      const products = ['传感器', '控制器', '网关', '摄像头', '执行器']
      chart.setOption({
        tooltip: { trigger: 'axis' },
        grid: { top: 15, right: 15, bottom: 25, left: 45 },
        xAxis: {
          type: 'category',
          data: products,
          axisLabel: { color: '#7eb7e1', fontSize: 10 },
          axisLine: { lineStyle: { color: '#1a3a5c' }}
        },
        yAxis: {
          type: 'value',
          axisLabel: { color: '#7eb7e1', fontSize: 10 },
          splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' }},
          axisLine: { lineStyle: { color: '#1a3a5c' }}
        },
        series: [
          {
            type: 'bar',
            barWidth: '40%',
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#00d4ff' },
                { offset: 1, color: '#0072ff' }
              ])
            },
            data: [156, 89, 42, 35, 34]
          }
        ]
      })
    },

    initMessageChart() {
      const chart = echarts.init(this.$refs.messageChart)
      this.chartInstances.push(chart)
      chart.setOption({
        tooltip: { trigger: 'axis' },
        grid: { top: 15, right: 15, bottom: 25, left: 40 },
        xAxis: {
          type: 'category',
          data: [],
          axisLabel: { color: '#7eb7e1', fontSize: 10 },
          axisLine: { lineStyle: { color: '#1a3a5c' } }
        },
        yAxis: {
          type: 'value',
          minInterval: 1,
          axisLabel: { color: '#7eb7e1', fontSize: 10 },
          splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
          axisLine: { lineStyle: { color: '#1a3a5c' } }
        },
        series: [
          {
            name: '新增设备',
            type: 'bar',
            barWidth: '50%',
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#67c23a' },
                { offset: 1, color: '#1d6b2a' }
              ])
            },
            data: []
          }
        ]
      })
    },

    updateDeviceDailyChart(deviceDaily) {
      if (!this.chartInstances[3]) return
      const dates = deviceDaily.map((d) => dayjs(d.date).format('MM-DD'))
      const counts = deviceDaily.map((d) => d.count)
      this.chartInstances[3].setOption({
        xAxis: { data: dates },
        series: [{ data: counts }]
      })
    },

    initAlarmTrendChart() {
      const chart = echarts.init(this.$refs.alarmTrendChart)
      this.chartInstances.push(chart)
      const days = Array.from({ length: 7 }, (_, i) =>
        dayjs().subtract(6 - i, 'day').format('MM-DD')
      )
      chart.setOption({
        tooltip: { trigger: 'axis' },
        legend: {
          top: 0,
          textStyle: { color: '#7eb7e1', fontSize: 10 }
        },
        grid: { top: 25, right: 15, bottom: 25, left: 35 },
        xAxis: {
          type: 'category',
          data: days,
          axisLabel: { color: '#7eb7e1', fontSize: 10 },
          axisLine: { lineStyle: { color: '#1a3a5c' }}
        },
        yAxis: {
          type: 'value',
          axisLabel: { color: '#7eb7e1', fontSize: 10 },
          splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' }},
          axisLine: { lineStyle: { color: '#1a3a5c' }}
        },
        series: [
          {
            name: '紧急',
            type: 'bar',
            stack: 'alarm',
            itemStyle: { color: '#f56c6c' },
            data: days.map(() => Math.floor(Math.random() * 5))
          },
          {
            name: '警告',
            type: 'bar',
            stack: 'alarm',
            itemStyle: { color: '#e6a23c' },
            data: days.map(() => Math.floor(3 + Math.random() * 8))
          },
          {
            name: '提示',
            type: 'bar',
            stack: 'alarm',
            itemStyle: { color: '#409eff' },
            data: days.map(() => Math.floor(5 + Math.random() * 15))
          }
        ]
      })
    }
  }
}
</script>

<style lang="scss" scoped>
@import "~@/assets/digit.scss";

.dashboard-screen {
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: #0a1a2e;

  &.is-fullscreen {
    height: 100vh;
  }
}

.screen-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 8px;
  background: linear-gradient(180deg, #0a1a2e 0%, #0d2847 100%);
}

.screen-header {
  display: flex;
  align-items: center;
  height: 60px;
  background: url("/images/top_title.png") no-repeat center;
  background-size: 100% 100%;
  padding: 0 20px;
  flex-shrink: 0;

  .header-left {
    flex: 1;
    .datetime {
      color: #00d4ff;
      font-size: 16px;
      font-family: "electronicFont";
    }
  }

  .header-center {
    flex: 2;
    text-align: center;
    .main-title {
      color: #00f6ff;
      font-size: 28px;
      margin: 0;
      cursor: pointer;
      letter-spacing: 4px;
      text-shadow: 0 0 10px rgba(0, 246, 255, 0.5);
    }
  }

  .header-right {
    flex: 1;
    text-align: right;
    .fullscreen-btn {
      color: #7eb7e1;
      font-size: 14px;
      &:hover {
        color: #00d4ff;
      }
    }
  }
}

.screen-body {
  flex: 1;
  display: flex;
  gap: 8px;
  margin-top: 8px;
  min-height: 0;
}

.panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.panel-left,
.panel-right {
  width: 25%;
}

.panel-center {
  flex: 1;
}

.panel-card {
  background: rgba(0, 35, 120, 0.36);
  border: 1px solid rgba(100, 162, 255, 0.2);
  position: relative;
  display: flex;
  flex-direction: column;

  &::before {
    content: "";
    position: absolute;
    left: -1px;
    top: -1px;
    width: 15px;
    height: 15px;
    border-left: 2px solid #02a6b5;
    border-top: 2px solid #02a6b5;
  }

  &::after {
    content: "";
    position: absolute;
    right: -1px;
    bottom: -1px;
    width: 15px;
    height: 15px;
    border-right: 2px solid #02a6b5;
    border-bottom: 2px solid #02a6b5;
  }

  &.flex-1 {
    flex: 1;
    min-height: 0;
  }

  &.full-height {
    flex: 1;
    min-height: 0;
  }
}

.card-title {
  padding: 8px 12px;
  font-size: 14px;
  color: #00d4ff;
  border-bottom: 1px solid rgba(100, 162, 255, 0.15);
  flex-shrink: 0;

  .alarm-badge {
    background: #f56c6c;
    color: #fff;
    font-size: 11px;
    padding: 1px 6px;
    border-radius: 8px;
    margin-left: 6px;
  }
}

.card-body {
  flex: 1;
  padding: 8px;
  min-height: 0;
  position: relative;
}

.stat-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding: 8px;
}

.stat-item {
  text-align: center;

  .stat-value {
    font-size: 28px;
    font-family: "electronicFont";
    font-weight: bold;

    &.online { color: #67c23a; }
    &.total { color: #00d4ff; }
    &.offline { color: #909399; }
    &.product { color: #e6a23c; }
  }

  .stat-label {
    color: #7eb7e1;
    font-size: 12px;
    margin-top: 4px;
  }
}

.chart-container {
  width: 100%;
  height: 100%;
  min-height: 120px;
}

.map-body {
  padding: 0;
}

.amap-wrapper {
  width: 100%;
  height: 100%;
  min-height: 200px;
}

.alarm-scroll-wrapper {
  height: 100%;
  overflow: hidden;
}

.alarm-scroll-content {
  transition: transform 0.1s linear;
}

.alarm-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
  border-bottom: 1px solid rgba(100, 162, 255, 0.1);
  font-size: 12px;
  height: 36px;
  box-sizing: border-box;

  .alarm-left {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  .alarm-time {
    color: #7eb7e1;
    margin-right: 8px;
    flex-shrink: 0;
    font-family: "electronicFont";
  }

  .alarm-level-tag {
    padding: 1px 6px;
    border-radius: 3px;
    margin-right: 8px;
    flex-shrink: 0;
    font-size: 11px;
  }

  .alarm-content {
    color: #c0d8ef;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-align: right;
  }

  &.alarm-level-high .alarm-level-tag {
    background: rgba(245, 108, 108, 0.2);
    color: #f56c6c;
    border: 1px solid rgba(245, 108, 108, 0.4);
  }

  &.alarm-level-medium .alarm-level-tag {
    background: rgba(230, 162, 60, 0.2);
    color: #e6a23c;
    border: 1px solid rgba(230, 162, 60, 0.4);
  }

  &.alarm-level-low .alarm-level-tag {
    background: rgba(64, 158, 255, 0.2);
    color: #409eff;
    border: 1px solid rgba(64, 158, 255, 0.4);
  }

  &.alarm-item-hover {
    background: rgba(0, 212, 255, 0.1);
  }
}

.screen-footer {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  height: 200px;
  flex-shrink: 0;

  .footer-card {
    flex: 1;
    background: rgba(0, 35, 120, 0.36);
    border: 1px solid rgba(100, 162, 255, 0.2);
    position: relative;
    display: flex;
    flex-direction: column;

    &::before {
      content: "";
      position: absolute;
      left: -1px;
      top: -1px;
      width: 15px;
      height: 15px;
      border-left: 2px solid #02a6b5;
      border-top: 2px solid #02a6b5;
    }

    &::after {
      content: "";
      position: absolute;
      right: -1px;
      bottom: -1px;
      width: 15px;
      height: 15px;
      border-right: 2px solid #02a6b5;
      border-bottom: 2px solid #02a6b5;
    }

    .card-title {
      padding: 6px 12px;
    }

    .card-body {
      flex: 1;
      min-height: 0;
    }
  }
}
</style>

<style lang="scss">
.alarm-tooltip.el-tooltip__popper {
  background: rgba(10, 26, 46, 0.95) !important;
  border: 1px solid rgba(0, 212, 255, 0.3) !important;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.5);
  max-width: 320px;
  width: 320px;

  .popper__arrow {
    border-left-color: rgba(0, 212, 255, 0.3) !important;
    &::after {
      border-left-color: rgba(10, 26, 46, 0.95) !important;
    }
  }

  .alarm-tooltip-content {
    white-space: pre-wrap;
    word-break: break-all;
    line-height: 1.6;
    color: #c0d8ef;
    font-size: 12px;
    padding: 4px;
  }
}
</style>
