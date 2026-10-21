<template>
  <div>
      <el-button size="mini" type="success" @click="openDialog()" class="btn-tool" icon="el-icon-upload">导入
      </el-button>
      <el-dialog title="导入本地数据" :visible.sync="openSendDialog" >
        <el-form ref="importForm" :model="form" :rules="rules" label-position="top">
          <el-form-item label="选择文件" prop="path">
            <FileUpload :limit=1 :fileType="fileType" @input="handleFile" :value="form.path" />
          </el-form-item>
        </el-form>
        <span slot="footer" class="dialog-footer">
          <el-button icon="el-icon-position" size="small" type="primary" @click="sendData">确定</el-button>
        </span>
      </el-dialog>
  </div>
</template>
<script>

import FileUpload from '@/components/FileUpload/index.vue'
import { importData2 } from '@/api/iot/table'

export default {
  components: {
    FileUpload
  },
  props: {
    device: {
      type: Object
    }
  },
  data() {

    const validateCheck = (rule, value, callback) => {
      const field = rule.fullField;
      let self = rule.self;
      let check = function() {
        return !(self.form && self.form.path);
      }
      if(check()){
        callback(new Error(field.message));
      }else{
        callback();
      }
    };

    return {
      form: {
      },
      fileType: ['csv'],
      openSendDialog: false,
      rules:{
        path: [
          {required: true, self: this, validator: validateCheck,  message: "请选择要导入的文件！", trigger: "blur"}
        ]
      }
    };
  },
  created() {

  },
  methods: {
    openDialog() {
      this.openSendDialog = true;
    },
    sendData() {
      this.$refs["importForm"].validate(valid => {
        if (valid) {
          this.form.addr = this.device.addr;
          this.form.product = this.device.product.id;
          importData2(this.device.product.protocol, this.form).then(res => {
            this.openSendDialog = false;
            const error = res.error;
            console.log(res);
            if(error.length > 0){
              this.$message({
                message: '数据导入成功, 但有部分数据导入失败，请查看日志',
                type: 'success'
              });
            }else{
              this.$message({
                message: '数据导入成功',
                type: 'success'
              });
            }
          })
        }
      });
    },
    handleFile(path){
      this.form.path = path;
    }
  },
  watch: {

  }
};
</script>
<style lang="scss" scoped>

.btn-tool{
  margin: 5px 0px 5px 0px;
  border-radius: 4px;
}

::v-deep .el-dialog{
  max-width: 450px;
}

@media screen and (min-width: 220px) and (max-width:600px) {
  ::v-deep .el-dialog{
    width: 90% !important;
  }
}

</style>
