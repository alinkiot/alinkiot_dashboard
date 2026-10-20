<template>
  <div>
    <svg-icon icon-class="github" @click="goto" />
  </div>
</template>

<script>
export default {
  name: 'AlinkiotGit',
  data() {
    return {
      url: 'https://codeup.aliyun.com/uzyiot/uzyiot/alinkiot_dashboard'
    }
  },
  methods: {
    goto() {
      window.open(this.url)
    }
  }
}
</script>