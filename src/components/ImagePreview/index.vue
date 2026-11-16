<template>
  <!-- 没有图片：传了 emptyText 时显示成可点击的方块（例如「编辑产品图片」），
       否则显示与加载失败一致的图标占位 -->
  <div v-if="!src && emptyText" class="image-empty-action" :style="`width:${realWidth};height:${realHeight};`"
       @click="$emit('empty-click')">
    <i class="el-icon-picture-outline"></i>
    <span>{{ emptyText }}</span>
  </div>
  <div v-else-if="!src" class="el-image image-empty" :style="`width:${realWidth};height:${realHeight};`">
    <div class="image-slot" :class="{ 'image-slot--ratio': !height }">
      <i class="el-icon-picture-outline"></i>
    </div>
  </div>
  <el-image
    v-else
    :src="`${realSrc}`"
    fit="cover"
    :style="`width:${realWidth};height:${realHeight};`"
    :preview-src-list="realSrcList"
  >
    <div slot="error" class="image-slot" :class="{ 'image-slot--ratio': !height }">
      <i class="el-icon-picture-outline"></i>
    </div>
  </el-image>
</template>

<script>
import { isExternal } from "@/utils/validate";

export default {
  name: "ImagePreview",
  props: {
    src: {
      type: String,
      default: ""
    },
    // 没有图片时显示在方块里的文字；不传则显示图标占位
    emptyText: {
      type: String,
      default: ""
    },
    width: {
      type: [Number, String],
      default: ""
    },
    height: {
      type: [Number, String],
      default: ""
    }
  },
  methods: {
    getBaseUrl() {
      let baseUrl = process.env.VUE_APP_BASE_API;
      if(document.location.protocol === 'https:'){
        baseUrl = baseUrl.replace('http:', 'https:');
      }
      return baseUrl;
    }
  },
  computed: {
    realSrc() {
      let real_src = this.src.split(",")[0];
      if (isExternal(real_src)) {
        return real_src;
      }
      const url = this.getBaseUrl();
      return url + real_src;
    },
    realSrcList() {
      const url = this.getBaseUrl();
      let real_src_list = this.src.split(",");
      let srcList = [];
      real_src_list.forEach(item => {
        if (isExternal(item)) {
          return srcList.push(item);
        }
        return srcList.push(url + item);
      });
      return srcList;
    },
    realWidth() {
      return typeof this.width == "string" ? this.width : `${this.width}px`;
    },
    realHeight() {
      return typeof this.height == "string" ? this.height : `${this.height}px`;
    }
  },
};
</script>

<style lang="scss" scoped>
.el-image {
  border-radius: 5px;
  // 没有传高度时，占位用正方形，不会因为没有图片内容而塌成一条线
  ::v-deep .image-slot--ratio {
    aspect-ratio: 1 / 1;
    height: auto;
  }
  background-color: #ebeef5;
  ::v-deep .el-image__inner {
    transition: all 0.3s;
    cursor: pointer;
    &:hover {
      transform: scale(1.2);
    }
  }
  ::v-deep .image-slot {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    color: #909399;
    font-size: 30px;
  }
}

.image-empty-action {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  aspect-ratio: 1 / 1;
  border: 1px dashed #c0c4cc;
  border-radius: 5px;
  background-color: #f5f7fa;
  color: #909399;
  font-size: 13px;
  cursor: pointer;
  transition: color 0.2s ease, border-color 0.2s ease;

  i {
    margin-bottom: 6px;
    font-size: 28px;
  }

  &:hover {
    color: var(--current-color, #0071e3);
    border-color: var(--current-color, #0071e3);
  }
}
</style>
