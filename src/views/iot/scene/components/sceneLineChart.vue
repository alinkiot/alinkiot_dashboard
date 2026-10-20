<!--  -->
<template>
    <div class="sceneLineChart" :style="{ height: height, width: width }"></div>
</template>

<script>
import echarts from "echarts";
require('echarts/theme/macarons'); // echarts theme
import resize from '../../history/components/mixins/resize'
export default {
    name: 'sceneLineChart',
    props: {
        width: {
            type: String,
            default: '100%'
        },
        height: {
            type: String,
            default: '450px'
        },
        chartData: {
            type: Object,
            default: {
                xAxis: [],
                yAxis: [],
            }
        }
    },
    mixins: [resize],
   
    data () {
        return {
            chart: null
        };
    },

    components: {},

    watch: {
        chartTheme () {
            this.initChart();
        },
        chartData: {
            deep: true,
            handler (val) {
                this.setOptions()
            }
        }
    },
    computed: {
        chartColor () {
            return this.chartTheme === 'dark' ? 'white' : 'black'
        },
        chartTheme () {
            return /theme-dark-.+/.test(this.$store.state.settings.sideTheme) ? 'dark' : 'light'
        }
    },
    beforeDestroy () {
        if (!this.chart) {
            return
        }
        this.chart.dispose()
        this.chart = null
    },
    mounted () {
        this.initChart()
    },

    methods: {
        initChart () {
            if (this.chart != null && this.chart.dispose) {
                this.chart.dispose();
            }
            this.chart = echarts.init(this.$el, 'macarons');
            this.setOptions(this.chartData);
        },
        setOptions (val) {
            let series = this.chartData.yAxis.map(item => {
                return {
                    name: item.name,
                    data: item.data,
                    type: 'line',
                }
            })
            const options = {
                grid: {
                    top: '40',
                    left: '3%',
                    right: '1%',
                    bottom: '2%',
                    containLabel: true,
                },
                // legend: {
                //     data:  this.chartData.xAxis,
                //     show: false,
                // },
                tooltip: {
                    trigger: 'axis'
                },
                xAxis: {
                    type: 'category',
                    boundaryGap: false,
                    data: this.chartData.xAxis,
                    axisLabel: {
                        color: this.chartColor
                    },

                    splitLine: {
                        lineStyle: {
                            type: 'dashed',
                            color: this.chartColor
                        },
                        show: true
                    }
                },
                yAxis: {
                    name: '高程_(米)',
                    type: 'value',
                    nameTextStyle: {
                        color: this.chartColor,
                    },
                    axisLabel: {
                        color: this.chartColor,
                    },
                    splitLine: {
                        lineStyle: {
                            type: 'dashed',
                            color: this.chartColor
                        },
                        show: true
                    }
                },
                series: series
            };
            this.chart.setOption(options);
        }
    }
}

</script>
<style lang='scss' scoped></style>