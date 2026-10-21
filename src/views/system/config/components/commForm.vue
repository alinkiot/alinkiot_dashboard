<template>
  <div>
    <template v-if="isCreate">
      <el-form-item label="参数键名" prop="configKey">
        <el-autocomplete style="display: block;"
                         v-model="form.configKey"
                         :fetch-suggestions="querySearch"
                         placeholder="请输入参数键名"
                         @change="onChange"
                         @select="handleSelectKey"
        >
          <template slot-scope="{ item }">
            <div class="name">{{ item.label }}</div>
          </template>
        </el-autocomplete>
      </el-form-item>
      <el-form-item v-if="dict" label="参数类型">
        <el-tooltip effect="dark" :content="dict.remark" placement="top">
          <el-button type="text">
            {{dict.dictLabel}}
            <i class="el-icon-question"></i>
          </el-button>
        </el-tooltip>
      </el-form-item>
      <el-form-item label="参数名称" prop="configName">
        <el-input v-model="form.configName" placeholder="请输入参数名称" />
      </el-form-item>
      <el-form-item label="参数说明" prop="remark">
        <el-input v-model="form.remark" type="textarea" placeholder="请输入参数说明"/>
      </el-form-item>
    </template>
    <template v-else>
      <el-form-item label="参数名称">
        <el-tooltip effect="dark" :content="getTips()" placement="top">
          <el-button type="text">
            {{form.configName}}
            <i class="el-icon-question"></i>
          </el-button>
        </el-tooltip>
        <el-button type="text"  @click.native="handleEdit">
          <i class="el-icon-edit-outline"></i>
        </el-button>
      </el-form-item>
    </template>
  </div>
</template>
<script>

export default {
  components: {  },
  props: {
    form: {
      type: Object,
      require: true
    },
    isCreate: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    sysConfigs() {
      const arr = this.$store.state.dict.dict.filter(item => {
        return item.key === 'iot_sys_config'
      });
      if(arr.length > 0){
        const types = arr[0].value;
        const dicts = [];
        types.map(type => {
          dicts.push({
            label : type.dictLabel,
            value : type.dictValue,
            dict : type
          });
        })
        return dicts;
      }else{
        return []
      }
    }
  },
  data() {
    return {
      dict: undefined
    };
  },
  created() {

  },
  methods: {
    getTips() {
      const remark = this.dict ? this.dict.remark : '无'
      return this.form.remark ? this.form.remark : remark
    },
    handleEdit() {
      this.$emit('edit')
    },
    querySearch(queryString, cb) {
      const  results = this.sysConfigs;
      cb(results);
    },
    onChange(value) {
      this.findDict(value);
      if(this.dict){
        this.form.configName = this.dict.dictLabel;
      }
      this.form.remark = '';
    },
    findDict(value) {
      this.dict = undefined
      if(this.form.configKey){
        const arr = this.sysConfigs.filter(item => { return item.value === value });
        if(arr.length > 0){
          this.dict = arr[0].dict;
        }
      }
    },
    handleSelectKey(item) {
      this.dict = item.dict;
      this.form.configKey = this.dict.dictValue;
      this.form.configName = this.dict.dictLabel;
      this.form.remark = '';
    }
  },
  watch: {
    form: {
      deep: true,
      immediate: true,
      handler(val) {
        this.findDict(this.form.configKey);
      }
    }
  }
};
</script>
<style lang="scss" scoped>

</style>
