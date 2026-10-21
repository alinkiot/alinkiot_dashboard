<template>
    <MenuForm :menu="menu" @submit="submitForm"></MenuForm>
</template>
<script>
import MenuForm from "@/views/system/menu/components/menuForm.vue";

export default {
  components: { MenuForm },
  props: {
    form: {
      type: Object,
      require: true
    }
  },
  data() {
    return {
      menu: undefined
    };
  },
  created() {
    if(this.form.configValue!== undefined && this.form.configValue !== '') {
      this.menu = JSON.parse(this.form.configValue);
    }
  },
  methods: {
    submitForm: function(menu) {
      this.form.configValue = JSON.stringify(menu);
      this.$emit('submit')
    }
  }
};
</script>
<style lang="scss" scoped>

.pre-img {
  width: 40%;
  padding-left: 10px;
}

</style>
