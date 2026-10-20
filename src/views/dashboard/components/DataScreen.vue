<template>
  <div class="dashboard-screen" :class="[themeClass, { 'is-fullscreen': isFullscreen }]">
    <div class="screen-container">
      <!-- 顶部标题栏 -->
      <div class="screen-header">
        <div class="header-left">
          <i class="el-icon-time clock-icon" />
          <span class="datetime">{{ now }}</span>
        </div>
        <div class="header-center">
          <h1 class="main-title" @click="handleSelectProject">
            <span class="title-text">{{ projectTitle }}</span>
            <i class="el-icon-caret-bottom title-caret" />
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
        <!-- 左列第1格：设备概览 -->
        <div class="grid-cell cell-l1">
          <div class="panel-card">
            <div class="card-title"><span class="title-bar" />设备概览</div>
            <div class="card-body">
              <div class="stat-grid">
                <div class="stat-item is-online">
                  <div class="stat-icon"><i class="el-icon-connection" /></div>
                  <div class="stat-info">
                    <div class="stat-value online">{{ stats.deviceOnline }}</div>
                    <div class="stat-label">在线设备</div>
                  </div>
                </div>
                <div class="stat-item is-offline">
                  <div class="stat-icon"><i class="el-icon-close-notification" /></div>
                  <div class="stat-info">
                    <div class="stat-value offline">{{ stats.deviceOffline }}</div>
                    <div class="stat-label">离线设备</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 左列第2格：设备总览 -->
        <div class="grid-cell cell-l2">
          <div class="panel-card">
            <div class="card-title"><span class="title-bar" />设备总览</div>
            <div class="card-body">
              <div class="stat-grid">
                <div class="stat-item is-total">
                  <div class="stat-icon"><i class="el-icon-cpu" /></div>
                  <div class="stat-info">
                    <div class="stat-value total">{{ stats.deviceTotal }}</div>
                    <div class="stat-label">设备总数</div>
                  </div>
                </div>
                <div class="stat-item is-product">
                  <div class="stat-icon"><i class="el-icon-box" /></div>
                  <div class="stat-info">
                    <div class="stat-value product">{{ stats.productTotal }}</div>
                    <div class="stat-label">产品数</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 左列第3格：占位 -->
        <div class="grid-cell cell-l3">
          <div class="panel-card">
            <div class="card-title"><span class="title-bar" />待定面板</div>
            <div class="card-body">
              <div class="cell-placeholder">待放置内容</div>
            </div>
          </div>
        </div>

        <!-- 中间列：地图（跨3行） -->
        <div class="grid-cell cell-center">
          <div class="panel-card full-height">
            <div class="card-body map-body">
              <div class="amap-wrapper">
                <el-amap
                  v-if="mapReady"
                  vid="dashboardMap"
                  :amap-manager="amapManager"
                  :zoom="zoom"
                  :center="mapCenter"
                  :map-style="mapStyle"
                  :plugin="mapPlugins"
                >
                  <el-amap-marker
                    v-for="marker in deviceMarkers"
                    :key="marker.id"
                    :position="marker.position"
                    :icon="marker.icon"
                    :events="markerEvents(marker)"
                  />
                  <el-amap-info-window
                    v-if="hoverMarker"
                    :position="hoverMarker.position"
                    :visible="showInfoWindow"
                    :offset="[0, -30]"
                    :close-when-click-map="true"
                    :is-custom="true"
                    :events="infoWindowEvents"
                  >
                    <div class="marker-tip">
                      <div class="marker-tip-name">{{ hoverMarker.name }}</div>
                      <div class="marker-tip-info" v-if="hoverMarker.location">位置: {{ hoverMarker.location }}</div>
                      <div class="marker-tip-info">状态: <span :class="hoverMarker.online === 1 ? 'status-online' : 'status-offline'">{{ hoverMarker.online === 1 ? '在线' : hoverMarker.online === 0 ? '离线' : '查询中...' }}</span></div>
                    </div>
                  </el-amap-info-window>
                </el-amap>
              </div>
            </div>
          </div>
        </div>

        <!-- 右列第1格：实时告警 -->
        <div class="grid-cell cell-r1">
          <div class="panel-card">
            <div class="card-title">
              <span class="title-bar" />实时告警
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
                    <div slot="content" class="alarm-tooltip-content">
                      <div class="alarm-tip-row"><span class="alarm-tip-label">设备：</span>{{ alarm.device }}</div>
                      <div class="alarm-tip-row"><span class="alarm-tip-label">位置：</span>{{ alarm.location }}</div>
                      <div class="alarm-tip-row"><span class="alarm-tip-label">状态：</span>{{ alarm.status }}</div>
                      <div class="alarm-tip-row"><span class="alarm-tip-label">时间：</span>{{ alarm.createTime }}</div>
                      <div class="alarm-tip-remark">
                        <p v-for="(line, i) in alarm.remark" :key="i">{{ line }}</p>
                      </div>
                    </div>
                    <div
                      class="alarm-item"
                      :class="['alarm-level-' + alarm.level, { 'alarm-item-hover': hoverIndex === index }]"
                      @mouseenter="hoverIndex = index"
                      @mouseleave="hoverIndex = -1"
                    >
                      <span class="alarm-left">
                        <span class="alarm-level-tag">{{ alarm.levelText }}</span>
                        <span class="alarm-time">{{ alarm.time }}</span>
                        <span class="alarm-device">{{ alarm.device }}</span>
                      </span>
                      <span class="alarm-content">{{ alarm.content }}</span>
                    </div>
                  </el-tooltip>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右列第2格：告警统计 -->
        <div class="grid-cell cell-r2">
          <div class="panel-card">
            <div class="card-title"><span class="title-bar" />告警统计</div>
            <div class="card-body">
              <div ref="alarmChart" class="chart-container" />
            </div>
          </div>
        </div>

        <!-- 右列第3格：占位 -->
        <div class="grid-cell cell-r3">
          <div class="panel-card">
            <div class="card-title"><span class="title-bar" />待定面板</div>
            <div class="card-body">
              <div class="cell-placeholder">待放置内容</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部面板 -->
      <div class="screen-footer">
        <div class="footer-card">
          <div class="card-title"><span class="title-bar" />每日设备新增</div>
          <div class="card-body">
            <div ref="messageChart" class="chart-container" />
          </div>
        </div>
        <div class="footer-card">
          <div class="card-title"><span class="title-bar" />设备上线趋势</div>
          <div class="card-body">
            <div ref="deviceTrendChart" class="chart-container" />
          </div>
        </div>
        <div class="footer-card">
          <div class="card-title"><span class="title-bar" />告警趋势</div>
          <div class="card-body">
            <div ref="alarmTrendChart" class="chart-container" />
          </div>
        </div>
      </div>
    </div>

    <!-- 项目选择弹窗 -->
    <el-dialog title="选择项目" :visible.sync="openSelector" append-to-body width="700px" :custom-class="'screen-project-dialog ' + themeClass">
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
import { getObject, queryDevStatus } from '@/api/iot/table'
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
      hoverMarker: null,
      showInfoWindow: false,
      hoverIndex: -1,
      infoWindowEvents: {}
    }
  },
  computed: {
    themeClass() {
      const t = this.$store.state.settings.sideTheme
      return t ? `screen-${t}` : 'screen-theme-blue'
    },
    // 地图样式跟随主题：明亮白用亮色地图，其余用深色地图（均为高德官方内置样式）
    mapStyle() {
      const t = this.$store.state.settings.sideTheme
      const map = {
        'theme-light': 'amap://styles/normal',
        'theme-blue': 'amap://styles/blue',
        'theme-dark-blue': 'amap://styles/blue',
        'theme-dark': 'amap://styles/dark',
        'theme-green': 'amap://styles/fresh'
      }
      return map[t] || 'amap://styles/blue'
    },
    projectTitle() {
      if (this.project) return this.project.title
      const siteInfo = this.$store.state.settings.siteInfo
      return (siteInfo && siteInfo.site_title) || 'IoT 数据监控平台'
    }
  },
  created() {
    this.startClock()
    this.infoWindowEvents = {
      close: () => {
        this.showInfoWindow = false
      }
    }
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
  watch: {
    // 主题切换：图表按新主题重建并重新取数；地图按新样式重建
    '$store.state.settings.sideTheme'() {
      this.$nextTick(() => {
        setTimeout(() => {
          this.initCharts()
          this.fetchData()
        }, 60)
      })
      // 重建地图以应用新的 map-style（vue-amap 仅在创建时读取样式）
      if (this.mapReady) {
        this.mapReady = false
        this.$nextTick(() => {
          this.mapReady = true
          this.$nextTick(() => { this.fitMapView() })
        })
      }
    }
  },
  methods: {
    markerEvents(marker) {
      const self = this
      return {
        mouseover() {
          self.hoverMarker = { ...marker, location: '', online: -1 }
          self.showInfoWindow = true
          if (marker.deviceId) {
            getObject('device', marker.deviceId).then((res) => {
              if (res.code === 200 && res.data) {
                self.hoverMarker = {
                  ...self.hoverMarker,
                  name: res.data.name || marker.name,
                  location: res.data.location || ''
                }
              }
            })
          }
          if (marker.addr) {
            queryDevStatus(marker.addr).then((statusRes) => {
              if (statusRes.code === 200 && statusRes.data && statusRes.data.length) {
                self.hoverMarker = {
                  ...self.hoverMarker,
                  online: statusRes.data[0].online
                }
              } else {
                self.hoverMarker = { ...self.hoverMarker, online: 0 }
              }
            })
          }
        },
        mouseout() {
          self.showInfoWindow = false
        }
      }
    },

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
              let device = ''
              let location = ''
              let status = ''
              let remark = []
              try {
                const parsed = JSON.parse((item.content || '').replace(/[\r|\n|\t]/g, '|'))
                device = parsed.device || ''
                location = parsed.location || ''
                status = parsed.status || ''
                remark = parsed.remark ? parsed.remark.split('|') : []
              } catch (e) {}
              return {
                time: item.create_time ? dayjs(item.create_time).format('M/D HH:mm') : '',
                createTime: item.create_time ? dayjs(item.create_time).format('YYYY-MM-DD HH:mm:ss') : '',
                level: levelMap[item.level] || 'low',
                levelText: levelTextMap[item.level] || '提示',
                content: item.title || '',
                device,
                location,
                status,
                remark
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
                deviceId: d.id || '',
                addr: d.addr,
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
      const accent = this.themePalette().accent
      const levelColorMap = { '1': '#f56c6c', '2': '#e6a23c', '3': accent }
      const chartData = detail.map((item) => ({
        value: item.count,
        name: levelNameMap[item.level] || item.level,
        itemStyle: { color: levelColorMap[item.level] || accent }
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

    // 读取当前主题的 CSS 变量，供 ECharts 使用（跟随主题切换）
    themePalette() {
      const el = this.$el && this.$el.querySelector ? this.$el.querySelector('.dashboard-screen') || this.$el : document.querySelector('.dashboard-screen')
      const cs = el ? getComputedStyle(el) : null
      const get = (name, fallback) => {
        const v = cs && cs.getPropertyValue(name)
        return (v && v.trim()) || fallback
      }
      const accentRgb = get('--sc-accent-rgb', '34, 211, 238')
      const accent = get('--sc-accent', '#22d3ee')
      const accent2Rgb = get('--sc-accent-2-rgb', '59, 130, 246')
      return {
        accent,
        accentRgb,
        accent2: get('--sc-accent-2', '#3b82f6'),
        accent2Rgb,
        dim: get('--sc-text-dim', '#8bb4d8'),
        axis: `rgba(${accentRgb}, 0.25)`,
        split: `rgba(${accentRgb}, 0.07)`,
        areaTop: `rgba(${accentRgb}, 0.45)`,
        areaBottom: `rgba(${accentRgb}, 0)`,
        lineShadow: `rgba(${accentRgb}, 0.6)`
      }
    },

    initCharts() {
      // 先销毁旧实例（主题切换重渲染时复用）
      if (this.chartInstances && this.chartInstances.length) {
        this.chartInstances.forEach(c => { try { c.dispose() } catch (e) { /* noop */ } })
      }
      this.chartInstances = []
      this.initDeviceTrendChart()
      this.initAlarmChart()
      this.initMessageChart()
      this.initAlarmTrendChart()
    },

    initDeviceTrendChart() {
      const chart = echarts.init(this.$refs.deviceTrendChart)
      this.chartInstances.push(chart)
      const p = this.themePalette()
      const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`)
      chart.setOption({
        tooltip: { trigger: 'axis' },
        grid: { top: 20, right: 15, bottom: 30, left: 40 },
        xAxis: {
          type: 'category',
          data: hours,
          boundaryGap: false,
          axisLabel: {
            color: p.dim,
            fontSize: 10,
            interval: 'auto',
            hideOverlap: true,
            rotate: 40
          },
          axisTick: { alignWithLabel: true },
          axisLine: { lineStyle: { color: p.axis }}
        },
        yAxis: {
          type: 'value',
          axisLabel: { color: p.dim, fontSize: 10 },
          splitLine: { lineStyle: { color: p.split }},
          axisLine: { lineStyle: { color: p.axis }}
        },
        series: [
          {
            name: '在线设备',
            type: 'line',
            smooth: true,
            symbol: 'circle',
            symbolSize: 5,
            showSymbol: false,
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: p.areaTop },
                { offset: 1, color: p.areaBottom }
              ])
            },
            lineStyle: { color: p.accent, width: 2.5, shadowColor: p.lineShadow, shadowBlur: 10 },
            itemStyle: { color: p.accent, borderColor: '#fff', borderWidth: 1 },
            data: hours.map(() => Math.floor(80 + Math.random() * 60))
          }
        ]
      })
    },

    initAlarmChart() {
      const chart = echarts.init(this.$refs.alarmChart)
      this.chartInstances.push(chart)
      const p = this.themePalette()
      chart.setOption({
        tooltip: { trigger: 'item' },
        legend: {
          bottom: 0,
          textStyle: { color: p.dim, fontSize: 10 }
        },
        series: [
          {
            type: 'pie',
            radius: ['42%', '66%'],
            center: ['50%', '45%'],
            avoidLabelOverlap: true,
            itemStyle: { borderColor: 'rgba(6,21,39,0.8)', borderWidth: 2 },
            label: { show: false },
            emphasis: {
              scale: true,
              scaleSize: 6,
              itemStyle: { shadowBlur: 16, shadowColor: `rgba(${p.accentRgb}, 0.5)` }
            },
            data: [
              { value: 12, name: '紧急', itemStyle: { color: '#f56c6c' }},
              { value: 28, name: '警告', itemStyle: { color: '#e6a23c' }},
              { value: 45, name: '提示', itemStyle: { color: p.accent }}
            ]
          }
        ]
      })
    },

    initMessageChart() {
      const chart = echarts.init(this.$refs.messageChart)
      this.chartInstances.push(chart)
      const p = this.themePalette()
      chart.setOption({
        tooltip: { trigger: 'axis' },
        grid: { top: 15, right: 15, bottom: 25, left: 40 },
        xAxis: {
          type: 'category',
          data: [],
          axisLabel: { color: p.dim, fontSize: 10 },
          axisLine: { lineStyle: { color: p.axis } }
        },
        yAxis: {
          type: 'value',
          minInterval: 1,
          axisLabel: { color: p.dim, fontSize: 10 },
          splitLine: { lineStyle: { color: p.split } },
          axisLine: { lineStyle: { color: p.axis } }
        },
        series: [
          {
            name: '新增设备',
            type: 'bar',
            barWidth: '50%',
            itemStyle: {
              borderRadius: [4, 4, 0, 0],
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: p.accent },
                { offset: 1, color: `rgba(${p.accentRgb}, 0.15)` }
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
      const p = this.themePalette()
      chart.setOption({
        tooltip: { trigger: 'axis' },
        legend: {
          top: 0,
          textStyle: { color: p.dim, fontSize: 10 }
        },
        grid: { top: 25, right: 15, bottom: 25, left: 35 },
        xAxis: {
          type: 'category',
          data: days,
          axisLabel: { color: p.dim, fontSize: 10 },
          axisLine: { lineStyle: { color: p.axis }}
        },
        yAxis: {
          type: 'value',
          axisLabel: { color: p.dim, fontSize: 10 },
          splitLine: { lineStyle: { color: p.split }},
          axisLine: { lineStyle: { color: p.axis }}
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
            itemStyle: { color: p.accent },
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

// SCSS 变量改为引用 CSS 变量，使所有既有 $accent 用法随主题变化
$accent: var(--sc-accent);
$accent-2: var(--sc-accent-2);
$text-dim: var(--sc-text-dim);

.dashboard-screen {
  /* ===== 默认主题变量（科技蓝）===== */
  --sc-accent: #22d3ee;
  --sc-accent-rgb: 34, 211, 238;
  --sc-accent-2: #3b82f6;
  --sc-accent-2-rgb: 59, 130, 246;
  --sc-text: #e6f3ff;
  --sc-text-dim: var(--sc-text-dim);
  --sc-grid: rgba(90, 160, 230, 0.04);
  --sc-card-bg: rgba(10, 30, 56, 0.55);
  --sc-card-border: rgba(var(--sc-accent-rgb), 0.18);
  --sc-bg: radial-gradient(ellipse at 50% -10%, #12427e 0%, #0a2a5e 45%, #071f45 100%);
  --sc-glow-1: rgba(var(--sc-accent-rgb), 0.12);
  --sc-glow-2: rgba(var(--sc-accent-2-rgb), 0.14);

  width: 100%;
  height: 100vh;
  overflow: hidden;
  position: relative;
  background: var(--sc-bg);

  // 氛围光晕
  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at 15% 20%, var(--sc-glow-1), transparent 35%),
      radial-gradient(circle at 85% 75%, var(--sc-glow-2), transparent 40%);
    pointer-events: none;
    z-index: 0;
  }

  // 网格纹理
  &::after {
    content: "";
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(var(--sc-grid) 1px, transparent 1px),
      linear-gradient(90deg, var(--sc-grid) 1px, transparent 1px);
    background-size: 44px 44px;
    pointer-events: none;
    z-index: 0;
  }

  &.is-fullscreen { height: 100vh; }

  /* ===== 各主题变量覆盖 ===== */
  // 科技蓝（默认，沿用上面的值）
  &.screen-theme-blue {
    --sc-accent: #22d3ee;
    --sc-accent-rgb: 34, 211, 238;
    --sc-accent-2: #3b82f6;
    --sc-accent-2-rgb: 59, 130, 246;
    --sc-text: #ffffff;
    // 背景与菜单(#0a2a5e)一致、偏蓝
    --sc-bg: radial-gradient(ellipse at 50% -10%, #12427e 0%, #0a2a5e 45%, #071f45 100%);
  }

  // 午夜蓝（与科技蓝保持一致）
  &.screen-theme-dark-blue {
    --sc-accent: #22d3ee;
    --sc-accent-rgb: 34, 211, 238;
    --sc-accent-2: #3b82f6;
    --sc-accent-2-rgb: 59, 130, 246;
    --sc-text: #ffffff;
    --sc-bg: radial-gradient(ellipse at 50% -10%, #12427e 0%, #0a2a5e 45%, #071f45 100%);
  }

  // 深空黑（中性蓝强调）
  &.screen-theme-dark {
    --sc-accent: #2997ff;
    --sc-accent-rgb: 41, 151, 255;
    --sc-accent-2: #5fb4ff;
    --sc-accent-2-rgb: 95, 180, 255;
    --sc-text: #f0f4fa;
    --sc-text-dim: #9aa7bd;
    --sc-card-bg: rgba(40, 44, 54, 0.5);
    --sc-bg: radial-gradient(ellipse at 50% -10%, #23262e 0%, #17181d 45%, #0d0e11 100%);
    --sc-glow-1: rgba(41, 151, 255, 0.12);
    --sc-glow-2: rgba(95, 180, 255, 0.1);
  }

  // 森林绿
  &.screen-theme-green {
    --sc-accent: #34c759;
    --sc-accent-rgb: 52, 199, 89;
    --sc-accent-2: #5fe07e;
    --sc-accent-2-rgb: 95, 224, 126;
    --sc-text: #e9f7ec;
    --sc-text-dim: #a2cbb0;
    --sc-card-bg: rgba(20, 50, 30, 0.45);
    --sc-bg: radial-gradient(ellipse at 50% -10%, #16331f 0%, #112516 45%, #081209 100%);
    --sc-glow-1: rgba(52, 199, 89, 0.14);
    --sc-glow-2: rgba(40, 160, 90, 0.12);
  }

  // 明亮白（浅色大屏：浅底、深字、蓝色强调）
  &.screen-theme-light {
    --sc-accent: #0071e3;
    --sc-accent-rgb: 0, 113, 227;
    --sc-accent-2: #46a0ff;
    --sc-accent-2-rgb: 70, 160, 255;
    --sc-text: #1d1d1f;
    --sc-text-dim: rgba(29, 29, 31, 0.55);
    --sc-grid: rgba(0, 113, 227, 0.05);
    --sc-card-bg: rgba(255, 255, 255, 0.72);
    --sc-card-border: rgba(0, 0, 0, 0.08);
    --sc-bg: radial-gradient(ellipse at 50% -10%, #eef4fe 0%, #f2f5f9 45%, #eaeef4 100%);
    --sc-glow-1: rgba(0, 113, 227, 0.08);
    --sc-glow-2: rgba(70, 160, 255, 0.08);

    // 明亮白：顶部标题改为黑色实色（去掉白色渐变文字）
    .header-center .main-title {
      background: none !important;
      background-image: none !important;
      -webkit-text-fill-color: #1d1d1f !important;
      color: #1d1d1f !important;
      filter: none !important;
      .title-caret { -webkit-text-fill-color: var(--sc-accent) !important; }
    }
    .header-center .title-sub { color: rgba(29, 29, 31, 0.55); }
  }
}

.screen-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 14px 16px 16px;
  position: relative;
  z-index: 1;
}

/* ===================== 顶部标题栏 ===================== */
.screen-header {
  position: relative;
  display: flex;
  align-items: center;
  height: 66px;
  flex-shrink: 0;
  padding: 0 24px;

  // 底部渐变分隔线
  &::after {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, rgba(var(--sc-accent-rgb), 0.7) 20%, rgba(var(--sc-accent-2-rgb), 0.7) 80%, transparent);
    box-shadow: 0 0 12px rgba(var(--sc-accent-rgb), 0.5);
  }

  .header-left {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;

    .clock-icon {
      color: $accent;
      font-size: 18px;
    }
    .datetime {
      color: var(--sc-text);
      font-size: 18px;
      letter-spacing: 1px;
      font-family: "electronicFont";
    }
  }

  .header-center {
    flex: 2;
    text-align: center;

    .main-title {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      margin: 0;
      cursor: pointer;
      font-size: 30px;
      font-weight: 700;
      letter-spacing: 6px;
      background: linear-gradient(180deg, #ffffff 20%, #8fe3ff 100%);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      filter: drop-shadow(0 0 14px rgba(var(--sc-accent-rgb), 0.55));
      transition: filter 0.3s;

      &:hover {
        filter: drop-shadow(0 0 20px rgba(var(--sc-accent-rgb), 0.9));
      }
      .title-caret {
        -webkit-text-fill-color: $accent;
        font-size: 18px;
      }
    }

    .title-sub {
      margin-top: 2px;
      font-size: 11px;
      letter-spacing: 4px;
      color: rgba(139, 180, 216, 0.6);
    }
  }

  .header-right {
    flex: 1;
    text-align: right;
    .fullscreen-btn {
      color: var(--sc-text);
      font-size: 14px;
      padding: 6px 14px;
      border: 1px solid rgba(var(--sc-accent-rgb), 0.3);
      border-radius: 6px;
      transition: all 0.3s;
      &:hover {
        color: var(--sc-accent);
        border-color: rgba(var(--sc-accent-rgb), 0.6);
        background: rgba(var(--sc-accent-rgb), 0.08);
      }
      i { margin-right: 4px; }
    }
  }
}

/* ===================== 主体 ===================== */
.screen-body {
  flex: 1;
  display: grid;
  grid-template-columns: 25% 1fr 25%;
  grid-template-rows: repeat(3, 1fr);
  grid-template-areas:
    "l1 center r1"
    "l2 center r2"
    "l3 center r3";
  gap: 14px;
  margin-top: 14px;
  min-height: 0;
}

/* 网格格子：每个格子固定占一个区域，内部卡片铺满 */
.grid-cell {
  min-height: 0;
  min-width: 0;
  display: flex;
}

.cell-l1 { grid-area: l1; }
.cell-l2 { grid-area: l2; }
.cell-l3 { grid-area: l3; }
.cell-r1 { grid-area: r1; }
.cell-r2 { grid-area: r2; }
.cell-r3 { grid-area: r3; }
.cell-center { grid-area: center; }

/* 格子内卡片铺满整个格子 */
.grid-cell > .panel-card {
  flex: 1;
  min-height: 0;
  min-width: 0;
}

/* 占位内容样式 */
.cell-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(139, 180, 216, 0.5);
  font-size: 13px;
  letter-spacing: 2px;
}

/* ===================== 卡片（玻璃拟态） ===================== */
.panel-card,
.footer-card {
  background: var(--sc-card-bg);
  backdrop-filter: blur(8px);
  border: 1px solid var(--sc-card-border);
  border-radius: 10px;
  position: relative;
  display: flex;
  flex-direction: column;
  box-shadow: inset 0 0 24px rgba(var(--sc-accent-rgb), 0.05), 0 6px 20px rgba(0, 0, 0, 0.18);
  transition: border-color 0.3s, box-shadow 0.3s;

  &:hover {
    border-color: rgba(var(--sc-accent-rgb), 0.45);
    box-shadow: inset 0 0 24px rgba(var(--sc-accent-rgb), 0.1), 0 8px 28px rgba(0, 0, 0, 0.28);
  }
}

.panel-card {
  &.flex-1,
  &.full-height {
    flex: 1;
    min-height: 0;
  }
}

.card-title {
  display: flex;
  align-items: center;
  padding: 10px 14px;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 1px;
  color: var(--sc-text);
  border-bottom: 1px solid var(--sc-card-border);
  flex-shrink: 0;

  .title-bar {
    display: inline-block;
    width: 4px;
    height: 14px;
    margin-right: 8px;
    border-radius: 2px;
    background: linear-gradient(180deg, $accent, $accent-2);
    box-shadow: 0 0 8px rgba(var(--sc-accent-rgb), 0.7);
  }

  .alarm-badge {
    background: linear-gradient(135deg, #ff6b6b, #f5222d);
    color: #fff;
    font-size: 11px;
    padding: 1px 7px;
    border-radius: 10px;
    margin-left: 8px;
    box-shadow: 0 0 8px rgba(245, 34, 45, 0.5);
  }
}

.card-body {
  flex: 1;
  padding: 10px;
  min-height: 0;
  position: relative;
  overflow: hidden;
}

/* ===================== 统计卡片 ===================== */
.stat-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding: 10px 6px;
  height: 100%;
  box-sizing: border-box;
  align-content: center;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 10px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: transform 0.25s, background 0.25s;

  &:hover {
    transform: translateY(-3px);
    background: rgba(255, 255, 255, 0.06);
  }

  .stat-icon {
    width: 42px;
    height: 42px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    font-size: 22px;
  }

  .stat-value {
    font-size: 30px;
    line-height: 1;
    font-family: "electronicFont";
    font-weight: bold;

    &.online { color: #52e39a; }
    &.total { color: $accent; }
    &.offline { color: #a3b5c9; }
    &.product { color: #ffc861; }
  }

  .stat-label {
    color: var(--sc-text);
    font-size: 12px;
    margin-top: 6px;
  }

  &.is-online .stat-icon { color: #52e39a; background: rgba(82, 227, 154, 0.12); box-shadow: 0 0 14px rgba(82, 227, 154, 0.25); }
  &.is-total .stat-icon { color: $accent; background: rgba(var(--sc-accent-rgb), 0.12); box-shadow: 0 0 14px rgba(var(--sc-accent-rgb), 0.25); }
  &.is-offline .stat-icon { color: #a3b5c9; background: rgba(163, 181, 201, 0.12); }
  &.is-product .stat-icon { color: #ffc861; background: rgba(255, 200, 97, 0.12); box-shadow: 0 0 14px rgba(255, 200, 97, 0.25); }
}

.chart-container {
  width: 100%;
  height: 100%;
}

.map-body {
  padding: 0;
  overflow: hidden;
  border-radius: 0 0 10px 10px;
}

.amap-wrapper {
  width: 100%;
  height: 100%;
  min-height: 200px;
}

/* ===================== 告警滚动列表 ===================== */
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
  padding: 6px 10px;
  margin-bottom: 2px;
  border-radius: 6px;
  font-size: 12px;
  height: 36px;
  box-sizing: border-box;
  transition: background 0.2s;

  .alarm-left {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  .alarm-time {
    color: $text-dim;
    margin-right: 8px;
    flex-shrink: 0;
    width: 75px;
    font-size: 13px;
  }

  .alarm-device {
    color: $accent;
    margin-right: 8px;
    flex-shrink: 0;
    width: 80px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
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
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &.alarm-level-high {
    .alarm-level-tag {
      background: rgba(245, 108, 108, 0.2);
      color: #ff8a8a;
      border: 1px solid rgba(245, 108, 108, 0.4);
    }
  }

  &.alarm-level-medium {
    .alarm-level-tag {
      background: rgba(230, 162, 60, 0.2);
      color: #ffcc7a;
      border: 1px solid rgba(230, 162, 60, 0.4);
    }
  }

  &.alarm-level-low {
    .alarm-level-tag {
      background: rgba(64, 158, 255, 0.2);
      color: #7cc0ff;
      border: 1px solid rgba(64, 158, 255, 0.4);
    }
  }

  &.alarm-item-hover {
    background: rgba(var(--sc-accent-rgb), 0.1);
  }
}

/* ===================== 底部 ===================== */
.screen-footer {
  display: flex;
  gap: 14px;
  margin-top: 14px;
  height: 210px;
  flex-shrink: 0;

  .footer-card {
    flex: 1;

    .card-title {
      padding: 8px 14px;
    }

    .card-body {
      flex: 1;
      min-height: 0;
    }
  }
}
</style>

<style lang="scss">
.marker-tip {
  background: rgba(10, 26, 46, 0.95);
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: 4px;
  padding: 8px 12px;
  color: #fff;
  font-size: 12px;
  white-space: nowrap;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.5);

  .marker-tip-name {
    font-size: 13px;
    font-weight: bold;
    margin-bottom: 4px;
    color: #00d4ff;
  }

  .marker-tip-info {
    color: rgba(255, 255, 255, 0.8);
    line-height: 1.6;
  }

  .status-online {
    color: #67c23a;
  }

  .status-offline {
    color: #f56c6c;
  }
}

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

    .alarm-tip-row {
      margin-bottom: 6px;
      border-bottom: 1px solid rgba(100, 162, 255, 0.15);
      padding-bottom: 4px;
    }

    .alarm-tip-label {
      font-weight: bold;
      color: #00d4ff;
    }

    .alarm-tip-remark {
      padding: 4px 0;
      p {
        margin: 0;
        padding: 2px 0;
      }
    }
  }
}

/* ===== 大屏「选择项目」弹窗：深色风格，仅作用于本弹窗（custom-class 隔离） ===== */
.screen-project-dialog {
  background: rgba(10, 26, 46, 0.96);
  border: 1px solid rgba(0, 212, 255, 0.25);
  border-radius: 8px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.6);

  .el-dialog__header {
    border-bottom: 1px solid rgba(0, 212, 255, 0.18);
    padding: 16px 20px;

    .el-dialog__title {
      color: #00d4ff;
      font-size: 16px;
      font-weight: 600;
      letter-spacing: 1px;
    }
    .el-dialog__headerbtn .el-dialog__close {
      color: #8fb6d8;
    }
    .el-dialog__headerbtn:hover .el-dialog__close {
      color: #00d4ff;
    }
  }

  .el-dialog__body {
    padding: 16px 20px 20px;
    color: #c0d8ef;
  }

  /* 搜索区输入框 */
  .el-input__inner {
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(0, 212, 255, 0.25);
    color: #e6f2ff;
    &::placeholder { color: rgba(192, 216, 239, 0.5); }
    &:focus { border-color: #00d4ff; }
  }
  .el-input__icon { color: #8fb6d8; }

  /* 搜索按钮 */
  .el-button--primary {
    background: linear-gradient(90deg, #0088cc, #00d4ff);
    border-color: #00d4ff;
    color: #04121f;
    font-weight: 600;
  }
  .el-button--text {
    color: #00d4ff;
  }

  /* 表格：深色底、去白边 */
  .el-table,
  .el-table__expanded-cell {
    background: transparent !important;
    background-color: transparent !important;
    color: #c0d8ef;
  }
  /* Element 默认白底的容器，全部透明化 */
  .el-table__body-wrapper,
  .el-table__header-wrapper,
  .el-table__footer-wrapper,
  .el-table__body,
  .el-table__header {
    background: transparent !important;
    background-color: transparent !important;
  }
  .el-table th.el-table__cell,
  .el-table tr,
  .el-table td.el-table__cell {
    background: transparent !important;
    background-color: transparent !important;
  }
  .el-table thead th.el-table__cell {
    background: rgba(0, 212, 255, 0.08) !important;
    color: #8fd8ff;
    font-weight: 600;
    border-bottom: 1px solid rgba(0, 212, 255, 0.2);
  }
  .el-table td.el-table__cell,
  .el-table th.el-table__cell.is-leaf {
    border-bottom: 1px solid rgba(100, 162, 255, 0.12);
    color: #c0d8ef;
  }
  .el-table--border,
  .el-table--border .el-table__cell {
    border-color: rgba(100, 162, 255, 0.12);
  }
  .el-table::before,
  .el-table--border::after {
    background-color: rgba(100, 162, 255, 0.12);
  }
  /* 斑马纹 + hover 行 */
  .el-table--striped .el-table__body tr.el-table__row--striped td.el-table__cell {
    background: rgba(255, 255, 255, 0.03) !important;
  }
  .el-table__body tr:hover > td.el-table__cell {
    background: rgba(0, 212, 255, 0.12) !important;
  }
  /* 空数据 */
  .el-table__empty-block { background: transparent !important; }
  .el-table__empty-text { color: rgba(192, 216, 239, 0.6); }

  /* 分页 */
  .pagination-container { background: transparent; }
  .el-pagination {
    color: #c0d8ef;
    button, .el-pager li {
      background: rgba(255, 255, 255, 0.04);
      color: #c0d8ef;
    }
    .el-pager li.active { color: #00d4ff; }
    .el-pagination__total,
    .el-pagination__jump { color: #8fb6d8; }
  }
}

/* 明亮白主题：选择项目弹窗改为浅色，和浅色大屏协调 */
.screen-project-dialog.screen-theme-light {
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.18);

  .el-dialog__header {
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
    .el-dialog__title { color: #0071e3; }
    .el-dialog__headerbtn .el-dialog__close { color: #909399; }
    .el-dialog__headerbtn:hover .el-dialog__close { color: #0071e3; }
  }
  .el-dialog__body { color: #1d1d1f; }

  .el-input__inner {
    background: #fff;
    border: 1px solid #dcdfe6;
    color: #1d1d1f;
    &::placeholder { color: #a8abb2; }
    &:focus { border-color: #0071e3; }
  }
  .el-input__icon { color: #909399; }

  .el-button--primary {
    background: #0071e3;
    border-color: #0071e3;
    color: #fff;
  }
  .el-button--text { color: #0071e3; }

  .el-table,
  .el-table__expanded-cell,
  .el-table__body-wrapper,
  .el-table__header-wrapper,
  .el-table__footer-wrapper,
  .el-table__body,
  .el-table__header {
    background: #fff !important;
    background-color: #fff !important;
    color: #1d1d1f;
  }
  .el-table th.el-table__cell,
  .el-table tr,
  .el-table td.el-table__cell {
    background: #fff !important;
    background-color: #fff !important;
  }
  .el-table thead th.el-table__cell {
    background: #f5f7fa !important;
    color: #606266;
    border-bottom: 1px solid #ebeef5;
  }
  .el-table td.el-table__cell,
  .el-table th.el-table__cell.is-leaf {
    border-bottom: 1px solid #ebeef5;
    color: #1d1d1f;
  }
  .el-table--border,
  .el-table--border .el-table__cell { border-color: #ebeef5; }
  .el-table::before,
  .el-table--border::after { background-color: #ebeef5; }
  .el-table--striped .el-table__body tr.el-table__row--striped td.el-table__cell {
    background: #fafafa !important;
  }
  .el-table__body tr:hover > td.el-table__cell {
    background: #f0f7ff !important;
  }
  .el-table__empty-block { background: #fff !important; }
  .el-table__empty-text { color: #909399; }

  .el-pagination {
    color: #606266;
    button, .el-pager li { background: #fff; color: #606266; }
    .el-pager li.active { color: #0071e3; }
    .el-pagination__total, .el-pagination__jump { color: #606266; }
  }
}
</style>
