<template>
    <el-form-item label="时间范围" prop="dateRange">
      <el-select v-model="type" class="select-type input-left-sel">
        <el-option label="绝对时间" value="range"/>
        <el-option label="相对时间" value="last"/>
      </el-select>
      <el-date-picker v-if="type==='range'"
        v-model="dateRange"
        style="width: 340px"
        value-format="yyyy-MM-dd HH:mm:ss"
        type="datetimerange"
        range-separator="-"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        :picker-options="pickerOptions"
        @change="rangeChange"
      ></el-date-picker>
      <el-select v-model="seconds" @change="selectChange" class="input-right-sel" v-else>
        <el-option
          v-for="item in pickerOptions.shortcuts"
          :key="item.value"
          :label="item.text"
          :value="item.value">
        </el-option>
      </el-select>
    </el-form-item>
</template>
<script>
export default {
  components: {},
  props: {
    options: {
      type: Array,
      default: function (){ return []}
    }
  },
  data() {
    return {
      type: 'last',
      dateRange: [],
      seconds: undefined,
      pickerOptions: {
        shortcuts: []
      }
    }
  },
  created() {

  },
  methods: {
    change2shortcuts(){
      const that = this;
      const arr = [];
      this.options.map(item =>{
        console.log('1111');
        const value = parseInt(item.value);
        if(value > 0){
          arr.push({
            text: '最近' + item.label,
            value: value,
            onClick(picker){
              that.seconds = value;
              that.setRange(picker);
            }
          })
        }
      });
      return arr;
    },
    rangeChange() {
      this.$emit('change', this.type, this.dateRange);
    },
    selectChange() {
      this.$emit('change', this.type, this.seconds);
    },
    createRange() {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - this.seconds * 1000);
      return [start, end];
    },
    setRange(picker) {
      picker.$emit('pick', this.createRange());
    }
  },
  watch: {
    options(){
      this.pickerOptions = {
        shortcuts: this.change2shortcuts()
      };
      this.seconds = 30 * 60;
      this.selectChange();
    }
  }
}
</script>

<style lang="scss" scoped>
/* 修复“时间范围内两个下拉错位/裂缝、以及被全局 .search-form .el-select{200px}
   撑宽导致的溢出”。已在浏览器实测验证：
   - 左“相对/绝对时间”下拉固定 110px，右“最近xx”下拉固定 150px；
   - 两个下拉之间留 8px 间距，各自边框圆角完整（不再强行无缝拼接）；
   - 用 !important 覆盖全局固定宽度。 */
.select-type {
  width: 110px !important;
  margin-right: 8px !important;
}
.select-type ::v-deep .el-input {
  width: 110px !important;
}

.input-right-sel {
  width: 150px !important;
}
.input-right-sel ::v-deep .el-input {
  width: 150px !important;
}



.input-left-sel ::v-deep .el-input__inner {
  border-right-width: 1px !important;
  border-right-style: solid !important;
  border-right-color: #dcdfe6 !important;
  border-top-right-radius: 4px !important;
  border-bottom-right-radius: 4px !important;
}

/* 深色主题下边框色与 theme-dark.scss 保持一致 */
::v-deep .el-date-editor--datetimerange {
  width: 340px !important;
}
</style>

<!-- 深色主题需要从 body class 向下选，不能用 scoped -->
<style lang="scss">
.theme-dark,
.theme-dark-blue,
.theme-green {
  .input-left-sel .el-input__inner {
    border-right-color: rgba(255, 255, 255, 0.1) !important;
  }
}
</style>
