<template>
  <div>
    <el-form-item label="公式名称" prop="formula">
      <el-select v-model="formula.name" placeholder="选择计算公式" @input="onChange" clearable>
        <el-option
          v-for="item in dict.type.iot_formula_funs"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
    </el-form-item>
    <el-form-item label="公式说明" prop="formula">
      <div v-html="get_formula_desc()"></div>
    </el-form-item>
  </div>
</template>
<script>

export default {
  dicts: ['iot_formula_funs'],
  components: {},
  props: {
    dataThing: {
      type : Object,
      require: true
    },
    product: {
      type : Object,
      require: true
    }
  },
  data() {
    return {
      formula: {
        name: undefined
      }
    };
  },
  created() {

  },
  methods: {
    onChange : function(){
      this.dataThing.formula = this.formula;
    },
    get_formula_desc() {
      const name = this.formula.name;
      const dicts = this.dict.type.iot_formula_funs;
      const arr = dicts.filter(item => { return item.value === name });
      if(arr.length > 0){
        const remark = arr[0].raw.remark;
        if(remark){
          return remark.replace(/\n/g, '<br/>');
        }
      }
      return '暂无说明';
    }
  },
  watch: {
    dataThing: {
      immediate: true,
      deep: true,
      handler() {
        console.log(this.dataThing);
        if(this.dataThing.formula){
          this.formula = this.dataThing.formula;
        }else{
          this.formula = {
            name: undefined
          }
        }
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.thing-label {
  font-weight: bold;
  margin: 10px;
}
</style>
