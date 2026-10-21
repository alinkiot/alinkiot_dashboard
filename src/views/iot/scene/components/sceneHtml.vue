<template>
  <div v-loading="loading" class="html-root">
    <el-row :gutter="10" v-if="edit">
      <el-col class="mb8">
        <el-button
          type="primary"
          icon="el-icon-upload"
          size="mini"
          @click="openSelector = true"
          v-hasPermi="['system:scene:edit']">
          <span v-if="scene_data">编辑</span>
          <span v-else>上传HTML</span>
        </el-button>
      </el-col>
    </el-row>

    <div class="html-box">
      <el-empty description="暂无内容，请上传HTML" v-if="!src" />
      <iframe
        v-else
        :src="src"
        frameborder="no"
        scrolling="auto"
        class="html-frame"
      />
    </div>

    <el-dialog title="上传HTML" :visible.sync="openSelector" append-to-body>
      <el-form ref="form" :model="form" label-width="100px">
        <el-form-item label="HTML文件">
          <FileUpload
            :limit="1"
            :fileType="['html', 'htm', 'zip']"
            :fileSize="20"
            :value="form.path"
            @input="handleFile"
          />
        </el-form-item>
        <el-form-item label="标题">
          <el-input v-model="form.caption" placeholder="选填"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button size="mini" v-if="scene_data" icon="el-icon-delete" type="danger" @click="deleteScene">删除</el-button>
        <el-button size="mini" icon="el-icon-success" type="primary" @click="submitForm">保存</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { createObject, queryObject, updateObject, delObject } from "@/api/iot/table";
import FileUpload from "@/components/FileUpload/index.vue";
import { isExternal } from "@/utils/validate";

export default {
  dicts: [],
  components: { FileUpload },
  props: {
    scene: {
      type: Object,
      required: true
    },
    scene_key: {
      type: String,
      required: true
    },
    edit: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      loading: false,
      openSelector: false,
      scene_data: undefined,
      form: {}
    };
  },
  computed: {
    // 将存储的相对路径解析为可嵌入的完整地址
    src() {
      const path = this.form && this.form.path;
      if (!path) {
        return "";
      }
      // FileUpload 以逗号拼接多个文件，这里只取第一个
      const real = String(path).split(",")[0];
      if (!real) {
        return "";
      }
      if (isExternal(real)) {
        return real;
      }
      let baseUrl = process.env.VUE_APP_BASE_API;
      if (document.location.protocol === "https:") {
        baseUrl = baseUrl.replace("http:", "https:");
      }
      return baseUrl + real;
    }
  },
  created() {
    this.getSceneData();
  },
  methods: {
    getSceneData() {
      const query = {
        scene: this.scene.id,
        sceneType: this.scene_key
      };
      this.loading = true;
      this.scene_data = undefined;
      this.form = {};
      queryObject("scene_view", query).then(response => {
        this.loading = false;
        const items = response.data;
        if (items.length > 0) {
          this.scene_data = items[0];
          this.form = JSON.parse(this.scene_data.data);
        }
      }).catch(() => {
        this.loading = false;
      });
    },
    handleFile(path) {
      this.$set(this.form, "path", path);
    },
    submitForm() {
      const post = {
        scene: this.scene.id,
        sceneType: this.scene_key,
        data: JSON.stringify(this.form)
      };
      if (this.scene_data) {
        post.id = this.scene_data.id;
        updateObject("scene_view", post).then(() => {
          this.openSelector = false;
          this.getSceneData();
          this.$modal.msgSuccess("修改成功");
        });
      } else {
        createObject("scene_view", post).then(() => {
          this.openSelector = false;
          this.getSceneData();
          this.$modal.msgSuccess("创建成功");
        });
      }
    },
    deleteScene() {
      if (!this.scene_data) {
        return;
      }
      delObject("scene_view", this.scene_data.id).then(() => {
        this.openSelector = false;
        this.$modal.msgSuccess("删除成功");
        this.getSceneData();
      });
    }
  },
  watch: {
    scene() {
      this.getSceneData();
    },
    scene_key() {
      this.getSceneData();
    }
  }
};
</script>

<style lang="scss" scoped>
.html-root {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.html-box {
  flex: 1;
  width: 100%;
  max-width: 100%;
  min-height: 0;
  overflow: hidden;
}

.html-frame {
  width: 100%;
  height: 100%;
  min-height: 360px;
  border: 0;
}
</style>
