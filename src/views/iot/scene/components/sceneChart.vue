<template>
    <div v-loading="loading">
        <div v-if="scene.category === 'rxwyj'">

            <h1>曲线类型：固定测协算法</h1>
            <el-row :gutter="20">
                <!--左边的图-->
                <el-col :span="10">
                    <el-form :model="queryData" :inline="true">
                        <el-form-item label="选择方向:">
                            <el-select v-model="queryData.type" size="mini">
                                <el-option value="x" label="X轴"></el-option>
                                <el-option value="y" label="Y轴"></el-option>
                            </el-select>
                        </el-form-item>
                        <el-form-item>
                            <el-button type="primary" size="mini" @click="changeLeftChart"> 查询</el-button>
                        </el-form-item>
                    </el-form>
                    <div id="leftLineChart" style="width: 100%;height: 800px;"></div>
                </el-col>
                <!--右边的图-->
                <el-col :span="14">
                    <div class="search">
                        <!-- <el-select v-model="queryData.time" size="mini">
                    <el-option value="1" label="最近一周"></el-option>
                    <el-option value="2" label="最近二周"></el-option>
                    <el-option value="3" label="最近一月"></el-option>
                    <el-option value="4" label="最近三月"></el-option>
                </el-select> -->
                        <el-form :model="queryData" :inline="true">
                            <el-form-item label="时间范围:">
                                <el-date-picker v-model="queryData.time" type="datetimerange" size="mini"
                                    :picker-options="pickerOptions" range-separator="-" start-placeholder="开始日期"
                                    end-placeholder="结束日期" align="right" value-format="yyyy-MM-dd HH:mm:ss">
                                </el-date-picker>
                            </el-form-item>
                            <el-form-item>
                                <el-button type="primary" size="mini" @click="getSceneData"> 查 询</el-button>
                            </el-form-item>
                        </el-form>
                    </div>
                    <div id="rightLineChart" style="width: 100%;height: 400px;"></div>
                </el-col>
            </el-row>
        </div>
    </div>
</template>

<script>
import { queryObject } from "@/api/iot/table";
import echarts from "echarts";
import _ from 'lodash';
require('echarts/theme/macarons'); // echarts theme
export default {
    props: {
        scene: {
            type: Object,
            required: true
        },
        activeName: {
            type: String,
            default: ''
        },
    },
    data () {
        return {

            queryData: {
                time: [this.parseTime(new Date().getTime() - 3600 * 1000 * 24 * 7), this.parseTime(new Date())],
                type: 'x'
            },
            loading: false,
            scene_data: [],
            leftLineChart: null,
            rightLineChart: null,
            resizePieChart: null,
            leftChartData: {
                xAxis: [],
                yAxis: [],
            },
            rightChartData: {
                xAxis: [],
                yAxis: [],

            },
            pickerOptions: {
                disabledDate: (time) => {
                    return time.getTime() > Date.now(); //禁止选择今天以后的时间
                },
                shortcuts: [{
                    text: '最近一周',
                    onClick (picker) {
                        const end = new Date();
                        const start = new Date();
                        start.setTime(start.getTime() - 3600 * 1000 * 24 * 7);
                        picker.$emit('pick', [start, end]);
                    }
                }, {
                    text: '最近二周',
                    onClick (picker) {
                        const end = new Date();
                        const start = new Date();
                        start.setTime(start.getTime() - 3600 * 1000 * 24 * 14);
                        picker.$emit('pick', [start, end]);
                    }
                }, {
                    text: '最近一个月',
                    onClick (picker) {
                        const end = new Date();
                        const start = new Date();
                        start.setTime(start.getTime() - 3600 * 1000 * 24 * 30);
                        picker.$emit('pick', [start, end]);
                    }
                }, {
                    text: '最近三个月',
                    onClick (picker) {
                        const end = new Date();
                        const start = new Date();
                        start.setTime(start.getTime() - 3600 * 1000 * 24 * 90);
                        picker.$emit('pick', [start, end]);
                    }
                }]
            },
        };
    },
    components: {

    },
    computed: {
        chartColor () {
            return this.chartTheme === 'dark' ? 'white' : 'black';
        },
        chartTheme () {
            return /theme-dark-.+/.test(this.$store.state.settings.sideTheme) ? 'dark' : 'light';
        }
    },
    created () {

    },
    methods: {
        changeLeftChart () {
            let parsedData = []
            this.scene_data.map(item => {
                if (item.data && item.data !== "{}") {
                    parsedData.push({
                        createTime: item.createTime,
                        data: JSON.parse(item.data).data
                    })
                }
            });

            const leftData = {
                xAxis: [], yAxis: []
            };
            parsedData[parsedData.length - 1].data.forEach(item => {
                leftData.yAxis.push(item.depth);
                if (this.queryData.type === 'x') {
                    leftData.xAxis.push(item.x1_disp/1000);
                } else {
                    leftData.xAxis.push(item.y1_disp/1000);
                }
            })
            this.leftChartData = leftData;
            this.initLeftChart()
        },
        /**
         * 左边的表格
         */
        initLeftChart(){
            if (this.leftLineChart) this.leftLineChart.dispose();
            this.leftLineChart = echarts.init(document.getElementById('leftLineChart'), 'macarons');
            this.setLeftLineChartOptions();
        },
        /**
         * 初始化图表
         */
        initChart () {
            if (this.leftLineChart) this.leftLineChart.dispose();
            if (this.rightLineChart) this.rightLineChart.dispose();
            this.leftLineChart = echarts.init(document.getElementById('leftLineChart'), 'macarons');
            this.rightLineChart = echarts.init(document.getElementById('rightLineChart'), 'macarons');
            this.resizePieChart = _.throttle(() => {
                this.leftLineChart.resize();
                this.rightLineChart.resize();
            }, 100);
            window.addEventListener('resize', this.resizePieChart);

            this.setLeftLineChartOptions();
            this.setRightLineChartOptions();
        },
        getSceneData () {
            const query = {
                scene: this.scene.id,
                sceneType: this.scene.scene_key,
                'createTime[begin]': this.queryData.time[0],
                'createTime[end]': this.queryData.time[1]
            };
            this.loading = true;
            queryObject('scene_view', query).then(response => {
                this.scene_data = response.data
                this.parseChartData();
                this.initChart();
            }).finally(() => {
                this.loading = false;
            });
        },
        parseChartData () {
            // 解析数据并转换为目标格式
            let parsedData = []
            this.scene_data.map(item => {
                if (item.data && item.data !== "{}") {
                    parsedData.push({
                        createTime: item.createTime,
                        data: JSON.parse(item.data).data
                    })
                }
            });

            const leftData = {
                xAxis: [], yAxis: []
            };
            parsedData[parsedData.length - 1].data.forEach(item => {
                leftData.yAxis.push(item.depth);
                if (this.queryData.type === 'x') {
                    leftData.xAxis.push(item.x1_disp/1000);
                } else {
                    leftData.xAxis.push(item.y1_disp/1000);
                }
            })
            const rightData = {
                xAxis: parsedData.map(item => item.createTime), // 时间数组
                yAxis: []
            };
            parsedData.forEach(item => {
                item.data.forEach(point => {
                    let addrData = rightData.yAxis.find(addr => addr.name === point.addr);
                    if (!addrData) {
                        addrData = { name: point.addr, data: [] };
                        rightData.yAxis.push(addrData);
                    }
                    addrData.data.push(point.depth);
                });
            })
            this.leftChartData = leftData;
            this.rightChartData = rightData;
        },
        setLeftLineChartOptions () {
            const options = {
                grid: {
                    top: '40',
                    left: '3%',
                    right: '1%',
                    bottom: '2%',
                    containLabel: true,
                },
                tooltip: {
                    trigger: 'axis'
                },
                xAxis: {
                    type: 'category',
                    boundaryGap: false,
                    data: this.leftChartData.xAxis,
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
                series: [
                    {
                        data: this.leftChartData.yAxis,
                        type: 'line',
                    }
                ]
            };
            this.leftLineChart.setOption(options);
        },
        setRightLineChartOptions () {
            let _this = this
            let series = _this.rightChartData.yAxis.map(item => {
                return {
                    name: item.name,
                    data: item.data,
                    type: 'line',
                }
            })
            let legendData = _this.rightChartData.yAxis.map(item => {
                return item.name
            })
            const options = {
                grid: {
                    top: '40',
                    left: '1%',
                    right: '1%',
                    bottom: '2%',
                    containLabel: true,
                },
                legend: {
                    data: legendData,
                    show: false,
                },
                tooltip: {
                    trigger: 'axis'
                },
                xAxis: {
                    type: 'category',
                    boundaryGap: false,
                    data: _this.rightChartData.xAxis,
                    axisLabel: {
                        color: this.chartColor,
                        formatter: function (params) {
                            return `${params.substr(0, 10)}`
                        },
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
                    name: '毫米_(mm)',
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
            this.rightLineChart.setOption(options);
        }
    },
    watch: {
        scene () {
            this.getSceneData();
        },
        chartTheme () {
            this.initChart();
        },
        activeName: {
            handler: function (newVal, oldVal) {
                console.log(newVal)
                if (newVal === 'chart') {
                    this.getSceneData();
                }
            },
        }
    }
};
</script>

<style lang="scss" scoped>
.search {
    .el-button {
        margin-left: 20px;

    }
}
</style>
