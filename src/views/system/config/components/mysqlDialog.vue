<template>
  <div>
    <el-form-item label="Host" prop="host">
      <el-input v-model="config.host" placeholder="请输入连接地址" />
    </el-form-item>
    <el-form-item label="Port" prop="port">
      <el-input-number v-model="config.port"  placeholder="请输入连接端口" />
    </el-form-item>
    <el-form-item label="用户名" prop="user">
      <el-input v-model="config.user" placeholder="请输入用户名" />
    </el-form-item>
    <el-form-item label="密码" prop="password">
      <el-input v-model="config.password" placeholder="请输入密码" />
    </el-form-item>
    <el-form-item label="数据库" prop="db">
      <el-input v-model="config.db" placeholder="请输入数据库名" />
    </el-form-item>
    <div style="text-align: right;">
      <el-button type="primary" @click="submitForm">保存</el-button>
    </div>
  </div>
</template>
<script>

export default {
  components: {},
  props: {
    form: {
      type: Object,
      require: true
    }
  },
  data() {
    return {
      config : {}
    };
  },
  created() {
    if(this.form.configValue !== undefined && this.form.configValue !== ''){
      const config = JSON.parse(this.form.configValue);
      if(config){
        this.config = config;
      }
    }
  },
  methods: {
    submitForm: function() {
      this.form.configValue = JSON.stringify(this.config);
      this.$emit('submit')
    }
  }
};
</script>
<style lang="scss" scoped>

</style>
