<template>
    <el-form-item label="时间范围" prop="dateRange">
      <div class="time-range-group">
        <el-select v-model="type" class="select-type">
          <el-option label="绝对时间" value="range"/>
          <el-option label="相对时间" value="last"/>
        </el-select>
        <el-date-picker v-if="type==='range'"
          v-model="dateRange"
          class="input-right-range"
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
      </div>
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
/* 「绝对/相对时间」下拉与右侧时间控件拼成一个整体：
   - 左下拉 110px，右侧「最近xx」下拉 150px / 时间区间 340px，用 !important 覆盖全局
     .search-form .el-select { width: 200px }；
   - 左右相接处去掉圆角，右侧控件去掉左边框，只保留一条分隔线；
   - 悬停、聚焦时整体变色，分隔线保持默认颜色。
   颜色用 CSS 变量，深色主题在下方非 scoped 样式里覆盖。 */
.time-range-group {
  display: inline-flex;
  vertical-align: top;
  border-radius: 8px;
  transition: box-shadow 0.2s ease;
}

.select-type {
  width: 110px !important;
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

::v-deep .el-date-editor--datetimerange {
  width: 340px !important;
}

.time-range-group ::v-deep {
  // 左侧下拉：右边不要圆角，右边框作为分隔线
  .select-type .el-input__inner {
    border-top-right-radius: 0 !important;
    border-bottom-right-radius: 0 !important;
  }

  // 右侧控件：左边不要圆角，也不要左边框（与分隔线重叠）
  .input-right-sel .el-input__inner,
  .el-range-editor.el-input__inner {
    border-top-left-radius: 0 !important;
    border-bottom-left-radius: 0 !important;
    border-left-width: 0 !important;
  }

  // 去掉各部分自己的聚焦光晕，改为整体光晕
  .el-input__inner,
  .el-input__inner:focus,
  .el-select .el-input.is-focus .el-input__inner,
  .el-range-editor.is-active,
  .el-range-input,
  .el-range-input:focus {
    box-shadow: none !important;
  }

  .el-input__inner,
  .el-select .el-input.is-focus .el-input__inner,
  .el-range-editor.is-active {
    border-color: var(--trg-border, rgba(0, 0, 0, 0.1)) !important;
  }
}

.time-range-group:hover ::v-deep {
  .el-input__inner,
  .el-select .el-input.is-focus .el-input__inner,
  .el-range-editor.is-active {
    border-color: var(--trg-hover, #c0c4cc) !important;
  }
}

.time-range-group:focus-within {
  box-shadow: 0 0 0 3px var(--current-color-ring, rgba(0, 113, 227, 0.16));
}
.time-range-group:focus-within ::v-deep {
  .el-input__inner,
  .el-select .el-input.is-focus .el-input__inner,
  .el-range-editor.is-active {
    border-color: var(--current-color-focus, var(--current-color, #0071e3)) !important;
  }
}

// 分隔线 = 左侧下拉的右边框，任何状态下都保持默认颜色
.time-range-group ::v-deep .select-type .el-input__inner,
.time-range-group:hover ::v-deep .select-type .el-input__inner,
.time-range-group:focus-within ::v-deep .select-type .el-input__inner,
.time-range-group:focus-within ::v-deep .select-type .el-input.is-focus .el-input__inner {
  border-right-color: var(--trg-border, rgba(0, 0, 0, 0.1)) !important;
}

/* 校验失败：整个组合框外框标红，分隔线（左侧下拉的右边框）保持默认。
   上面的规则用 !important 固定了边框色，所以这里要显式写出错误态，否则不会变红 */
.el-form-item.is-error .time-range-group ::v-deep {
  .select-type .el-input__inner,
  .select-type .el-input.is-focus .el-input__inner {
    border-top-color: #f56c6c !important;
    border-bottom-color: #f56c6c !important;
    border-left-color: #f56c6c !important;
  }

  .input-right-sel .el-input__inner,
  .input-right-sel .el-input.is-focus .el-input__inner,
  .el-range-editor.el-input__inner {
    border-color: #f56c6c !important;
  }

  // 全局深色主题的错误态会把所有边框标红，这里把分隔线压回默认颜色
  .select-type .el-input__inner,
  .select-type .el-input.is-focus .el-input__inner {
    border-right-color: var(--trg-border, rgba(0, 0, 0, 0.1)) !important;
  }
}
</style>

<!-- 深色主题需要从 body class 向下选，不能用 scoped -->
<style lang="scss">
.theme-dark,
.theme-dark-blue,
.theme-green {
  .time-range-group {
    --trg-border: rgba(255, 255, 255, 0.1);
    --trg-hover: rgba(255, 255, 255, 0.2);
  }
}
</style>
