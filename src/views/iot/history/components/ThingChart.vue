<template>
  <div :style="{height:height,width:width}" class="chart-thing" />
</template>

<script>
import echarts from 'echarts'
require('echarts/theme/macarons') // echarts theme
import resize from './mixins/resize'
import dayjs from 'dayjs'
import { getValue } from "@/assets/js/iot"


export default {
  mixins: [resize],
  props: {
    group: {
      type: String,
      default: 'default'
    },
    width: {
      type: String,
      default: '100%'
    },
    height: {
      type: String,
      default: '450px'
    },
    thing: {
      type: Object,
      required: true
    },
    chartData: {
      type: Array,
      default: []
    }
  },
  data() {
    return {
      chart: null
    }
  },
  watch: {
    sideTheme() {
      this.initChart();
    },
    chartData: {
      deep: true,
      handler(val) {
        this.setOptions(val)
      }
    }
  },
  computed: {
    sideTheme() {
      return this.$store.state.settings.sideTheme;
    },
    chartColor() {
      return this.chartTheme === 'dark' ? 'white' : 'black'
    },
    chartTheme() {
      return /theme-dark-.+/.test(this.sideTheme) ? 'dark' : 'light'
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.initChart()
    })
  },
  beforeDestroy() {
    if (!this.chart) {
      return
    }
    this.chart.dispose()
    this.chart = null
  },
  methods: {
    initChart() {
      if(this.chart != null && this.chart.dispose){
        this.chart.dispose();
      }
      this.chart = echarts.init(this.$el, this.chartTheme);
      this.chart.group = this.group;
      this.setOptions(this.chartData);
    },
    formatData(Name, chartData) {
      const xData = [], yData = [];
      chartData.map(row => {
        const value = getValue(row, Name);
        const ts = dayjs(row.createtime * 1000).format('MM-DD HH:mm:ss');
        yData.push(value);
        xData.push(ts)
      });
      return [xData.reverse(), yData.reverse()];
    },
    formatTitle() {
      return this.thing.title;
    },
    setOptions(chartData) {
      const data = this.formatData(this.thing.name, chartData);
      const option = {
        backgroundColor: '',
        title: {
          text: this.formatTitle(),
          textStyle: {
            fontSize: 14,
            color: this.chartColor,
          }
        },
        tooltip: { trigger: 'axis' },
        legend: {},
        toolbox: {
          show: true,
          feature: {
            magicType: { type: ['line', 'bar'] },
            saveAsImage: {}
          }
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          axisLine: { lineStyle:{  color:this.chartColor } },
          axisLabel: {
            color:this.chartColor,
            // rotate: -30,
          },
          data: data[0]
        },
        yAxis: {
          type: 'value',
          axisLine: { lineStyle:{  color:this.chartColor } },
          axisLabel: {
            color:this.chartColor,
            formatter: '{value}' + (this.thing.unit ? this.thing.unit : '')
          }
        },
        series: [
          {
            name: this.thing.title,
            type: 'line',
            smooth: true,
            data: data[1]
          }
        ]
      };
      this.chart.setOption(option);
    }
  }
}
</script>

<style lang="scss" scoped>

.chart-thing div{
}

</style>
