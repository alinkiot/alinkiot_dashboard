<template>
  <div>
    <el-row>
      <el-col :span="product && product.img ? 18:24">
        <TableShow
          title = '基本信息'
          v-if="product"
          :columns="product_columns"
          :item="product"
          @click="onClick"
          :buttons="buttons"
        />
      </el-col>
      <el-col :span="6" style="text-align: center;" v-if="product && product.img">
        <ImagePreview style="width:80%;" :src="product.img"/>
      </el-col>
    </el-row>
    <el-drawer
      title="编辑产品"
      :visible.sync="openEditDialog"
      direction="rtl" size="45%">
      <ProductForm style="padding: 10px;" :product="product" @onUpdate="onUpdate" @onCancel="openEditDialog = false"/>
    </el-drawer>
    <el-dialog title="设置产品密钥" :visible.sync="openSecretSelector" >
      <el-form ref="keyForm" status-icon :rules="keyFormRule" :model="secret" label-width="80px" prop="keyForm">
        <el-form-item label="产品Key" prop="key">
          <el-input v-model="secret.key" placeholder="请输入产品Key">
            <el-button @click="createKey" slot="append" type="text" icon="el-icon-refresh" circle></el-button>
          </el-input>
        </el-form-item>
        <el-form-item label="产品密钥" prop="secret">
          <el-input v-model="secret.value" placeholder="请输入产品密钥">
            <el-button @click="createSecret" slot="append" type="text" icon="el-icon-refresh" circle></el-button>
          </el-input>
        </el-form-item>
        <el-alert title="警告:更新密钥会导致旧设备无法连接!" type="warning" :closable="false" style="margin-bottom:10px;"/>
        <el-form-item>
          <el-button  type="primary" @click="addSecretDone">更新</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>
<script>

import TableShow from "@/components/TableShow/index.vue";
import {getObject, updateObject} from "@/api/iot/table";
import ProductForm from "@/views/iot/product/components/productForm.vue";
import {checkRegx, randomString} from "@/assets/js/iot";

export default {
  components: {
    ProductForm,
    TableShow
  },
  dicts: [
    'sys_normal_disable',
    'iot_node_type',
    'iot_net_type',
    'iot_auto_register',
    'iot_product_mgr',
    'iot_protocol_id'
  ],
  props: {
    id: {
      type: [String, Number],
      default: undefined
    }
  },
  data() {
    return {
      product_columns: [],
      openSecretSelector: false,
      secret: { key : '', value : '' },
      product: undefined,
      openEditDialog: false,
      buttons: [
        {icon: 'el-icon-edit-outline', key: 'editProduct', title:'编辑' }
      ],
      keyFormRule:{
        key: [
          {required: true, len: 8, validator: checkRegx, message: "只能大小写字母，数字组成的8位字符串", trigger: "blur"}
        ],
        value: [
          {required: true, len: 16, validator: checkRegx, message: "只能大小写字母，数字组成的16位字符串", trigger: "blur"}
        ]
      }
    };
  },
  created() {
      this.product_columns = [
        {key: 'name', title: '产品名称', type: 'text'},
        {key: 'autoRegister', title: '自动注册', type: 'dict', options: this.dict.type.iot_auto_register},
        {key: 'nodeType', title: '节点类型', type: 'dict', options: this.dict.type.iot_node_type},
        {key: 'netType', title: '网络类型', type: 'dict', options: this.dict.type.iot_net_type},
        {key: 'pk', title: '产品Key', type: 'text', click: { icon:'el-icon-refresh' }},
        {key: 'ps', title: '产品密钥', type: 'secret', click: { icon:'el-icon-refresh' }},
        {key: 'category', title: '产品分类', type: 'dict', options: this.dict.type.iot_product_mgr},
        {key: 'protocol', title: '协议标识', type: 'dict', options: this.dict.type.iot_protocol_id},
        {key: 'status', title: '是否停用', type: 'dict', options: this.dict.type.sys_normal_disable},
        {key: 'doc', title: '帮助文档', type: 'href'}
      ];
    this.load();
  },
  methods: {
    onClick(column) {
      console.log(column);
      if(column.key === 'editProduct'){
        this.openEditDialog = true;
      }else if(column.key === 'ps' || column.key === 'pk'){
        this.secret = {
          key: this.product.pk,
          value:this.product.ps
        }
        this.openSecretSelector = true;
      }
    },
    createSecret: function(){
      this.secret.value = randomString(16);
    },
    createKey: function(){
      this.secret.key = randomString(8);
    },
    load() {
      getObject('product', this.id).then(response => {
        this.product = response.data;
        this.$emit('onload', this.product);
      })
    },
    onUpdate(form) {
      this.load();
      this.openEditDialog = false;
    },
    addSecretDone(){
      this.$refs["keyForm"].validate((valid) => {
        if(valid){
          const data = {
            id: this.product.id,
            pk: this.secret.key,
            ps: this.secret.value
          };
          updateObject('product', data).then(response => {
            if(response.code === 200){
              this.product.pk = this.secret.key;
              this.product.ps = this.secret.value;
              this.$modal.msgSuccess('保存成功！');
              this.openSecretSelector =  false;
            }else{
              this.$modal.msgError("保存失败！");
            }
          });
        }
      })
    }
  }
};
</script>

<style lang="scss" scoped>



</style>
