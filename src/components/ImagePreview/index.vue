<template>
  <el-image
    :src="`${realSrc}`"
    fit="cover"
    :style="`width:${realWidth};height:${realHeight};`"
    :preview-src-list="realSrcList"
  >
    <div slot="error" class="image-slot">
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
      required: true
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
</style>
