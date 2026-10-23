<template>
  <div>
    <el-card shadow="never" v-if="!product" style="margin-bottom: 10px; border-width: 0px;">
      <el-steps :active="0" align-center finish-status="success" >
        <el-step title="步骤1" description="创建产品、定义物模型"></el-step>
        <el-step title="步骤2" description="创建设备，关联产品"></el-step>
        <el-step title="步骤3" description="连接上云、查看实时数据"></el-step>
      </el-steps>
    </el-card>
    <el-form ref="form" :model="form" :rules="rules" label-width="80px">
      <el-form-item label="产品名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入产品名称"/>
      </el-form-item>
      <el-form-item label="设备类型" prop="nodeType">
        <el-radio-group v-model="form.nodeType" class="node-type-options">
          <el-radio
            v-for="dict in dict.type.iot_node_type"
            :key="dict.value"
            :label="dict.value"
            class="node-type-card"
          >
            <span class="node-type-option">
              <svg-icon
                v-if="dict.raw && dict.raw.cssClass"
                :icon-class="dict.raw.cssClass"
                class="node-type-option__icon"
              />
              <span>{{ dict.label }}</span>
            </span>
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="产品面板" prop="category">
        <el-select v-model="form.category" placeholder="请选择产品分类">
          <el-option
            v-for="dict in dict.type.iot_product_mgr"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="协议标识" prop="protocol">
        <el-select v-model="form.protocol" placeholder="协议标识">
          <el-option
            v-for="dict in dict.type.iot_protocol_id"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="注册类型" prop="autoRegister">
        <el-select v-model="form.autoRegister" placeholder="是否自动注册">
          <el-option
            v-for="dict in dict.type.iot_auto_register"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="通讯方式" prop="netType">
        <el-select v-model="form.netType" placeholder="请选择通讯方式">
          <el-option
            v-for="dict in dict.type.iot_net_type"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="产品图片" prop="img">
        <ImageUpload :limit=1 @input="handleFile" :value="form.img"/>
      </el-form-item>
      <el-form-item label="说明链接" prop="doc">
        <el-input v-model="form.doc" placeholder="请输入该设备说明文档"/>
      </el-form-item>
      <el-form-item label="是否禁用" prop="status">
        <el-radio-group v-model="form.status">
          <el-radio
            v-for="dict in dict.type.sys_normal_disable"
            :key="dict.value"
            :label="dict.value"
          >{{ dict.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item>
        <el-button size="mini" type="primary" :loading="loading" @click="submitForm">保存</el-button>
        <el-button size="mini" @click="handleCancel">取消</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>
<script>
import ImageUpload from "@/components/ImageUpload/index.vue";
import InputTableSelect from "@/components/InputTableSelect";
import {createObject, updateObject, getObject} from "@/api/iot/table";

export default {
  name: "ProductEdit",
  props: {
    product: {
      type: Object,
      default: function (){ return undefined; }
    }
  },
  dicts: [
    'sys_normal_disable',
    'iot_protocol_id',
    'iot_net_type',
    'iot_auto_register',
    'iot_node_type',
    'iot_product_mgr'
  ],
  components: {
    InputTableSelect,
    ImageUpload
  },
  data() {
    return {
      form: { status : '0', nodeType: 'device' },
      loading: false,
      // 表单校验
      rules: {
        name: [
          {required: true, message: "产品名称不能为空", trigger: "blur"}
        ],
        autoRegister: [
          {required: true, message: "是否自动注册不能为空", trigger: "blur"}
        ],
        protocol: [
          {required: true, message: "协议标识不能为空", trigger: "blur"}
        ],
        category: [
          {required: true, message: "品类不能为空", trigger: "blur"}
        ],
        nodeType: [
          {required: true, message: "节点类型不能为空", trigger: "blur"}
        ]
      }
    };
  },
  watch: {
    'dict.type.iot_auto_register': {
      handler(options) {
        if (!this.product && this.isEmptyAutoRegister() && options && options.length) {
          this.form.autoRegister = options[0].value;
        }
      }
    },
    'dict.type.iot_product_mgr': {
      handler() {
        if (!this.product) {
          this.setDefaultCategory();
        }
      }
    }
  },
  created() {
    if(this.product){
      this.form = {
        id: this.product.id,
        name: this.product.name,
        nodeType: this.product.nodeType,
        category: this.product.category,
        protocol: this.product.protocol,
        autoRegister: this.product.autoRegister,
        netType: this.product.netType,
        doc : this.product.doc,
        status: this.product.status,
        img: this.product.img
      }
    } else {
      this.setDefaultAutoRegister();
      this.setDefaultCategory();
    }
  },
  methods: {
    isEmptyAutoRegister() {
      return this.form.autoRegister === undefined || this.form.autoRegister === null || this.form.autoRegister === '';
    },
    setDefaultAutoRegister() {
      const options = this.dict.type.iot_auto_register;
      if (this.isEmptyAutoRegister() && options && options.length) {
        this.form.autoRegister = options[0].value;
      }
    },
    isEmptyCategory() {
      return this.form.category === undefined || this.form.category === null || this.form.category === '';
    },
    setDefaultCategory() {
      const options = this.dict.type.iot_product_mgr;
      const defaultPanel = options && options.find(item => item.value === 'default');
      if (this.isEmptyCategory() && defaultPanel) {
        this.$set(this.form, 'category', defaultPanel.value);
      }
    },
    reset() {
      this.form = { status : '0', nodeType: 'device' };
      this.setDefaultAutoRegister();
      this.setDefaultCategory();
    },
    addDict(dictType) {
      // 新开标签页管理字典，避免离开当前抽屉导致正在编辑的表单内容丢失
      const routeData = this.$router.resolve({
        path: '/system/dict-data/index/' + dictType
      });
      window.open(routeData.href, '_blank');
    },
    handleFile(path) {
      this.form.img = path;
    },
    handleCancel() {
      this.$emit('onCancel');
    },
    /** 提交按钮 */
    submitForm: function () {
      this.$refs["form"].validate(valid => {
        if (valid) {
          this.loading = true;
          if (this.product) {
            updateObject('product', this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.$emit('onUpdate', this.form);
            }).finally(() => {
              this.loading = false;
            });
          } else {
            createObject('product', this.form).then(response => {
              this.$modal.msgSuccess("新增成功");
              this.$emit('onCreate', this.form);
              this.reset();
            }).finally(() => {
              this.loading = false;
            });
          }
        }
      });
    }
  }
};
</script>
<style lang="scss" scoped>

::v-deep {
  .el-button--small.is-circle{
    padding : 4px;
  }
}

.node-type-option {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: 112px;
  min-height: 72px;
  flex-direction: column;
  font-size: 13px;
  font-weight: 500;
}

.node-type-option__icon {
  font-size: 24px;
  vertical-align: middle;
}

.node-type-options {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;

  ::v-deep .node-type-card {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: auto;
    margin: 0;
    padding: 0;

    .el-radio__input {
      display: none;
    }

    .el-radio__label {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 10px;
      border: 1px solid rgba(127, 127, 127, 0.24);
      border-radius: 8px;
      color: inherit;
      line-height: normal;
      transition: border-color 0.18s ease, background-color 0.18s ease, box-shadow 0.18s ease;
    }

    &:hover .el-radio__label {
      border-color: #409eff;
    }

    &.is-checked .el-radio__label {
      border-color: #409eff;
      background: rgba(64, 158, 255, 0.08);
      box-shadow: 0 0 0 1px rgba(64, 158, 255, 0.14);
      color: #409eff;
    }
  }
}
</style>
