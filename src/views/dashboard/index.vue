<template>
  <div class="box">
    <Demo />
  </div>
</template>

<script>

import { setToken } from '@/utils/auth'
import Demo from './components/DataScreen.vue'

export default {
  name: 'Dashboard',
  components: {
    Demo
  },
  data() {
    return {
      token: undefined
    }
  },
  created() {
    this.token = this.$route.query.token
    if (this.token) {
      setToken(this.token)
    }
  }
}
</script>
<style lang="scss" scoped>

.box {
  height: 100%;
  overflow: hidden;
}

</style>
