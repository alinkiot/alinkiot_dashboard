<template>
  <div>
    <ThemeForm
      :settings="settings"
      @change="change"
      @save="submitForm" />
  </div>
</template>
<script>

import ThemeForm from "@/layout/components/Settings/themeForm.vue";

import defaultSettings from '@/settings'
export default {
  components: { ThemeForm },
  props: {
    form: {
      type: Object,
      require: true
    }
  },
  data() {
    return {
      settings: {}
    };
  },
  created() {
    this.settings = defaultSettings;
    if(this.form.configValue !== undefined && this.form.configValue !== ''){
      const settings = JSON.parse(this.form.configValue);
      if(settings){
        this.settings = settings;
      }
    }
  },
  methods: {
    change(key, val) {
      console.log(key, val);
      this.settings[key] = val;
    },
    submitForm: function(config) {
      console.log(config);
      this.form.configValue = config;
      this.$emit('submit')
    }
  }
};
</script>
<style lang="scss" scoped>

::v-deep .el-form-item{
  margin-bottom: 0px;
}

.pre-img {
  width: 40%;
  padding-left: 10px;
}

</style>
