<template>
  <div>
    <el-form-item label="数据键值" prop="dictValue">
      <el-input :value="media.value" placeholder="固定标识，例如 dji_drone" @input="update('value', $event)" />
    </el-form-item>
    <el-form-item :label="isImage ? '选择图片' : '选择文件'">
      <ImageUpload v-if="isImage" :limit="1" :value="media.path" @input="update('path', $event)" />
      <FileUpload v-else :limit="1" :fileType="fileTypes" :value="media.path" @input="update('path', $event)" />
    </el-form-item>
  </div>
</template>
<script>
import FileUpload from "@/components/FileUpload/index.vue";
import ImageUpload from "@/components/ImageUpload/index.vue";
import { detectMediaType, parseMediaDict } from "@/utils/dict/media";

export default {
  components: { FileUpload, ImageUpload },
  props: {
    form: { type: Object, required: true }
  },
  computed: {
    isImage() {
      return this.form.listClass === "picture";
    },
    media() {
      const media = parseMediaDict(this.form);
      return {
        ...media,
        type: this.isImage ? "image" : detectMediaType(media.path)
      };
    },
    fileTypes() {
      return ["doc", "xls", "ppt", "txt", "pdf", "csv", "html", "htm",
        "png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "ico", "avif"];
    }
  },
  methods: {
    update(field, value) {
      const media = { ...this.media, [field]: value };
      media.type = this.isImage ? "image" : detectMediaType(media.path);
      this.$set(this.form, "dictValue", JSON.stringify(media));
    }
  }
};
</script>
