<template>
  <span>
    <template v-for="(item, index) in options">
      <template v-if="values.includes(item.value)">
        <template v-if="item.raw.cssClass">
          <el-tooltip class="item" effect="dark" :content="tooltip ? tooltip : item.label" placement="top">
            <el-button type="text">
              <span :class="'tag-icon tag-icon-'+item.raw.listClass">
                <svg-icon slot="prefix" :icon-class="item.raw.cssClass"/>
              </span>
            </el-button>
          </el-tooltip>
        </template>
        <template v-else>
          <el-tooltip class="item" effect="dark" :content="tooltip ? tooltip : item.label" placement="top">
            <el-tag
              v-if="item.raw.listClass === 'primary' || item.raw.listClass === 'success' || item.raw.listClass === 'info' || item.raw.listClass === 'warning' || item.raw.listClass === 'danger'"
              :disable-transitions="true"
              :key="item.value"
              :index="index"
              :type="item.raw.listClass"
            >
              <template v-if="label">{{ label }}</template>
              <template v-else>{{ item.label }}</template>
            </el-tag>
            <span :key="item.value" v-else>{{ item.label }}</span>
          </el-tooltip>
        </template>
      </template>
    </template>
  </span>
</template>

<script>
export default {
  name: "DictTag",
  props: {
    options: {
      type: Array,
      default: null,
    },
    value: [Number, String, Array],
    label: {
      type: String,
      default: null
    },
    tooltip: {
      type: String,
      default: null
    }
  },
  computed: {
    values() {
      if (this.value !== null && typeof this.value !== 'undefined') {
        return Array.isArray(this.value) ? this.value : [String(this.value)];
      } else {
        return [];
      }
    },
  },
  methods: {
  }
};
</script>
<style scoped>

.el-tag + .el-tag {
  margin-left: 10px;
}

.tag-icon{
  padding: 0 2px;
  font-size: 20px;
}


</style>
