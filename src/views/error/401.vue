<template>
  <div class="errPage-container">
    <el-button icon="arrow-left" class="pan-back-btn" @click="back">
      返回
    </el-button>
    <el-row>
      <el-col :span="12">
        <h1 class="text-jumbo text-ginormous">
          401错误!
        </h1>
        <h2>您没有访问权限！</h2>
        <h6>对不起，您没有访问权限，请不要进行非法操作！您可以返回主页面</h6>
        <ul class="list-unstyled">
          <li class="link-type">
            <router-link to="/">
              回首页
            </router-link>
          </li>
        </ul>
      </el-col>
      <el-col :span="12">
        <img :src="errGif" width="313" height="428" alt="Girl has dropped her ice cream.">
      </el-col>
    </el-row>
  </div>
</template>

<script>
import errGif from '@/assets/401_images/401.gif'

export default {
  name: 'Page401',
  data() {
    return {
      errGif: errGif + '?' + +new Date()
    }
  },
  methods: {
    back() {
      if (this.$route.query.noGoBack) {
        this.$router.push({ path: '/' })
      } else {
        this.$router.go(-1)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
  .errPage-container {
    max-width: 480px;
    margin: 120px auto;
    text-align: center;
    .pan-back-btn {
      background: #0071e3;
      color: #fff;
      border: none !important;
      border-radius: 980px;
      padding: 8px 24px;
      height: auto;
      font-weight: 400;
      letter-spacing: -0.01em;
    }
    .pan-gif {
      margin: 0 auto;
      display: block;
    }
    .pan-img {
      display: block;
      margin: 0 auto;
      width: 100%;
    }
    .text-jumbo {
      font-size: 96px;
      font-weight: 700;
      color: #1d1d1f;
      letter-spacing: -0.04em;
      line-height: 1;
    }
    h2 {
      font-size: 21px;
      font-weight: 600;
      color: #1d1d1f;
      letter-spacing: -0.015em;
      margin-top: 12px;
    }
    h6 {
      font-size: 15px;
      font-weight: 400;
      color: #6e6e73;
      line-height: 1.47;
    }
    .list-unstyled {
      font-size: 14px;
      li {
        padding-bottom: 5px;
      }
      a {
        color: #0066cc;
        text-decoration: none;
        &:hover {
          color: #0071e3;
        }
      }
    }
    img {
      opacity: 0.6;
      filter: grayscale(100%);
      max-width: 200px;
    }
  }
</style>

<style lang="scss">
.theme-dark .errPage-container,
.theme-dark-blue .errPage-container,
.theme-green .errPage-container {
  .text-jumbo { color: #f5f5f7; }
  h2 { color: #f5f5f7; }
  h6 { color: rgba(255, 255, 255, 0.55); }
  .list-unstyled a { color: #2997ff; &:hover { color: #5eb0ff; } }
  img { opacity: 0.3; }
}
</style>
