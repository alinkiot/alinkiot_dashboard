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

/* 不再无缝拼接：恢复左下拉右边框与圆角、右下拉左圆角，避免缺边/错位。
   注意：边框颜色用 inherit，继承输入框自身边框色，适配深色主题，
   不要硬编码浅色（否则深色背景下会显白）。 */
.input-left-sel ::v-deep .el-input__inner {
  border-right-width: 1px !important;
  border-right-style: solid !important;
  border-top-right-radius: 4px !important;
  border-bottom-right-radius: 4px !important;
}
.input-right-sel ::v-deep .el-input__inner {
  border-top-left-radius: 4px !important;
  border-bottom-left-radius: 4px !important;
}

/* 绝对时间的日期范围选择器宽度保持原设计 */
::v-deep .el-date-editor--datetimerange {
  width: 340px !important;
}
</style>
