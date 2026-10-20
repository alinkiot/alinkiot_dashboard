<template>
  <div class="wscn-http404-container">
    <div class="wscn-http404">
      <div class="pic-404">
        <img class="pic-404__parent" src="@/assets/404_images/404.png" alt="404">
        <img class="pic-404__child left" src="@/assets/404_images/404_cloud.png" alt="404">
        <img class="pic-404__child mid" src="@/assets/404_images/404_cloud.png" alt="404">
        <img class="pic-404__child right" src="@/assets/404_images/404_cloud.png" alt="404">
      </div>
      <div class="bullshit">
        <div class="bullshit__oops">
          404错误!
        </div>
        <div class="bullshit__headline">
          {{ message }}
        </div>
        <div class="bullshit__info">
          对不起，您正在寻找的页面不存在。尝试检查URL的错误，然后按浏览器上的刷新按钮或尝试在我们的应用程序中找到其他内容。
        </div>
        <router-link to="/" class="bullshit__return-home">
          返回首页
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>

export default {
  name: 'Page404',
  computed: {
    message() {
      return '找不到网页！'
    }
  }
}
</script>

<style lang="scss" scoped>
.wscn-http404-container{
  transform: translate(-50%,-50%);
  position: absolute;
  top: 40%;
  left: 50%;
}
.wscn-http404 {
  position: relative;
  max-width: 480px;
  padding: 0 32px;
  overflow: hidden;
  text-align: center;
  .pic-404 {
    display: none;
  }
  .bullshit {
    width: 100%;
    padding: 0;
    float: none;
    overflow: hidden;
    &__oops {
      font-size: 96px;
      font-weight: 700;
      line-height: 1;
      color: #1d1d1f;
      letter-spacing: -0.04em;
      opacity: 0;
      margin-bottom: 8px;
      animation-name: slideUp;
      animation-duration: 0.5s;
      animation-fill-mode: forwards;
    }
    &__headline {
      font-size: 21px;
      line-height: 1.19;
      color: #1d1d1f;
      font-weight: 600;
      letter-spacing: -0.015em;
      opacity: 0;
      margin-bottom: 12px;
      animation-name: slideUp;
      animation-duration: 0.5s;
      animation-delay: 0.1s;
      animation-fill-mode: forwards;
    }
    &__info {
      font-size: 15px;
      line-height: 1.47;
      color: #6e6e73;
      font-weight: 400;
      opacity: 0;
      margin-bottom: 32px;
      animation-name: slideUp;
      animation-duration: 0.5s;
      animation-delay: 0.2s;
      animation-fill-mode: forwards;
    }
    &__return-home {
      display: inline-block;
      width: auto;
      min-width: 120px;
      height: 36px;
      line-height: 36px;
      background: #0071e3;
      border-radius: 980px;
      text-align: center;
      color: #ffffff;
      opacity: 0;
      font-size: 14px;
      font-weight: 400;
      letter-spacing: -0.01em;
      cursor: pointer;
      padding: 0 24px;
      animation-name: slideUp;
      animation-duration: 0.5s;
      animation-delay: 0.3s;
      animation-fill-mode: forwards;
      &:hover {
        background: #0077ed;
      }
    }
    @keyframes slideUp {
      0% {
        transform: translateY(60px);
        opacity: 0;
      }
      100% {
        transform: translateY(0);
        opacity: 1;
      }
    }
  }
}
</style>

<style lang="scss">
.theme-dark .wscn-http404,
.theme-dark-blue .wscn-http404,
.theme-green .wscn-http404 {
  .bullshit {
    &__oops { color: #f5f5f7; }
    &__headline { color: #f5f5f7; }
    &__info { color: rgba(255, 255, 255, 0.55); }
  }
}
</style>
