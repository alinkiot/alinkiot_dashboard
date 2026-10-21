<template>
  <div v-loading="loading">
    <el-row :gutter="10" class="mb8" v-if="edit">
      <el-col :span="1.5">
        <el-button
            type="primary"
            icon="el-icon-plus"
            size="mini"
            @click="handleUpload"
            v-hasPermi="['system:scene:edit']">
          <span v-if="scene_data">编辑</span>
          <span v-else>上传</span>
        </el-button>
      </el-col>
    </el-row>
    <el-row>
      <el-carousel indicator-position="outside" :height="form.height + 'px'" :interval="form.interval"  v-if="pics.length > 0">
        <el-carousel-item v-for="pic in pics" :key="pic">
          <ImagePreview width="100%" :height="form.height" :src="pic"/>
        </el-carousel-item>
      </el-carousel>
      <el-empty description="暂无相册" v-else/>
    </el-row>
    <el-dialog title="上传图片" :visible.sync="openPicSelector" >
      <el-form ref="form" :model="form" label-width="80px">
        <el-form-item label="轮播频率">
          <el-input v-model.number="form.interval"></el-input>
        </el-form-item>
        <el-form-item label="高度">
          <el-input v-model.number="form.height"></el-input>
        </el-form-item>
        <el-form-item label="上传相片">
          <ImageUpload :limit=10 :value="pics"  @input="handleFile"/>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button size="mini" type="primary" @click="submitForm">保存</el-button>
      </div>
    </el-dialog>
  </div>
</template>
<script>
import {createObject, queryObject, updateObject} from "@/api/iot/table";
import ImageUpload from "@/components/ImageUpload/index.vue";
import ImagePreview from "@/components/ImagePreview/index.vue";

export default {
  dicts: [],
  components: { ImageUpload, ImagePreview },
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
      openPicSelector: false,
      scene_data: undefined,
      pics: [],
      form: {
        interval: 4000,
        height: 350
      }
    };
  },
  created() {
    this.getSceneData();
  },
  methods: {
    getSceneData() {
      const query = {
        scene : this.scene.id,
        sceneType: this.scene_key
      };
      this.loading = true;
      this.scene_data = undefined;
      this.pics = [];
      this.form = { interval: 4000, height: 350  };
      queryObject('scene_view', query).then(response => {
        this.loading = false;
        const items = response.data;
        if(items.length > 0){
          this.scene_data = items[0];
          this.form = JSON.parse(this.scene_data.data);
          this.pics =  this.form.pics;
        }
      })
    },
    handleUpload: function(){
      this.openPicSelector = true;
    },
    handleFile(path) {
      this.form.pics = path.split(',');
    },
    submitForm() {
      this.openPicSelector = false;
      const data = this.form;
      if(this.scene_data){
        this.scene_data.data = JSON.stringify(data);
        updateObject('scene_view', this.scene_data).then(response => {
          this.pics = this.form.pics;
          this.$modal.msgSuccess("修改成功");
        })
      }else{
        this.scene_data = {
          scene : this.scene.id,
          sceneType : this.scene_key,
          data : JSON.stringify(data)
        };
        createObject('scene_view', this.scene_data).then(response => {
          this.pics = this.form.pics;
          this.$modal.msgSuccess("创建成功");
        })
      }
    }
  },
  watch: {
    scene() {
      this.getSceneData();
    }
  }
};
</script>
<style>

</style>
