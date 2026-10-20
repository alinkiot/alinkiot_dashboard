<template>
  <div v-loading="loading">
    <el-row v-if="device">
      <el-col :span="product && product.img ? 18:24">
        <TableShow
          title="基本信息"
          :columns="device_columns"
          :item="device"
          :buttons="buttons"
          @click="onClick"
        />
        <TableShow
          title="产品信息"
          v-if="product"
          :columns="product_columns"
          :item="product"
          @click="onProductClick"
        />
        <ExtendEditor table="device" :id="id" />
      </el-col>
      <el-col :span="6" style="text-align: center;" v-if="product && product.img">
        <ImagePreview style="width:80%;" :src="product.img"/>
      </el-col>
    </el-row>
    <el-empty description="找不到该设备" v-else/>
    <el-drawer
      title="编辑设备"
      :visible.sync="openEditDialog"
      direction="rtl" size="40%">
      <DeviceForm
        style="padding: 10px;"
        :device="device" @onUpdate="onUpdate"/>
    </el-drawer>
    <el-dialog title="设置设备密钥" :visible.sync="openSecretSelector" >
      <el-form ref="keyForm" status-icon :rules="keyFormRule" :model="secret" label-width="80px" prop="keyForm">
        <el-form-item label="设备Key" prop="key">
          <el-input v-model="secret.key" placeholder="请输入设备Key">
            <el-button @click="createKey" slot="append" type="text" icon="el-icon-refresh" circle></el-button>
          </el-input>
        </el-form-item>
        <el-form-item label="设备密钥" prop="secret">
          <el-input v-model="secret.value" placeholder="请输入设备密钥">
            <el-button @click="createSecret" slot="append" type="text" icon="el-icon-refresh" circle></el-button>
          </el-input>
        </el-form-item>
        <el-alert title="警告:更新密钥会导致旧设备无法连接!" type="warning" :closable="false" style="margin-bottom:10px;"/>
        <el-form-item>
          <el-button  type="primary" @click="addDevSecretDone">更新</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>
<script>

import TableShow from "@/components/TableShow/index.vue";
import {getObject, queryDevStatus, updateObject} from "@/api/iot/table";
import DeviceForm from "@/views/iot/device/components/deviceForm.vue";
import {checkRegx, randomString} from "@/assets/js/iot";
import ExtendEditor from "@/views/iot/product/components/extendEditor.vue";
import {kickDevice} from "@/api/iot/system";

export default {
  components: {
    ExtendEditor,
    DeviceForm,
    TableShow
  },
  dicts: [
    'sys_normal_disable',
    'iot_node_type',
    'iot_net_type',
    'iot_device_status',
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
      loading: false,
      device_columns: [],
      product_columns: [],
      openSecretSelector: false,
      secret: { key : '', value : '' },
      device: undefined,
      product: undefined,
      online: undefined,
      openEditDialog: false,
      buttons: [],
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
    this.device_columns = [
      {key: 'name', title: '设备名称', type: 'text'},
      {key: 'addr', title: '设备地址', type: 'text'},
      {key: 'online', title: '在线状态', type: 'dict', options: this.dict.type.iot_device_status},
      {key: 'lastOnline', title: '上线时间', type: 'datetime'},
      {key: 'status', title: '是否禁用', type: 'dict', options: this.dict.type.sys_normal_disable},
      {key: 'dk', title: '设备Key', type: 'text', click: { icon:'el-icon-refresh' }},
      {key: 'ds', title: '设备密钥', type: 'secret', click: { icon:'el-icon-refresh' }},
      {key: 'createTime', title: '创建时间', type: 'text'},
    ];
    this.product_columns = [
      {key: 'name', title: '产品名称', type: 'text', click: { icon:'el-icon-link' }},
      {key: 'autoRegister', title: '自动注册', type: 'dict', options: this.dict.type.iot_auto_register},
      {key: 'nodeType', title: '节点类型', type: 'dict', options: this.dict.type.iot_node_type},
      {key: 'netType', title: '网络类型', type: 'dict', options: this.dict.type.iot_net_type},
      {key: 'category', title: '产品分类', type: 'dict', options: this.dict.type.iot_product_mgr},
      {key: 'protocol', title: '协议标识', type: 'dict', options: this.dict.type.iot_protocol_id},
      {key: 'status', title: '是否停用', type: 'dict', options: this.dict.type.sys_normal_disable},
      {key: 'doc', title: '帮助文档', type: 'href'}
    ];
    this.load();
  },
  methods: {
    onClick(column) {
      if(column.key === 'kickDevice'){
        this.handleKick(this.device);
      }else if(column.key === 'editDevice'){
        this.openEditDialog = true;
      }else if(column.key === 'ds' || column.key === 'dk'){
        this.secret = {
          key: this.device.dk,
          value:this.device.ds
        }
        this.openSecretSelector = true;
      }
    },
    onProductClick(column) {
      if(column.key === 'name'){
        // 跳转产品编辑页
        const project = this.$route.params.project;
        if(project){
          this.$router.push({
            path: '/'  + project + '/device/productEdit',
            query: {id: this.product.id}
          });
        }else{
          this.$router.push({
            path: '/device/productEdit',
            query: {id: this.product.id}
          });
        }
      }
    },
    handleKick(device) {
      kickDevice({addr : device.addr}).then(response => {
        this.getDeviceStatus();
        this.$modal.msgSuccess("操作成功");
      }).catch(err =>{
        console.log(err);
      })
    },
    createSecret: function(){
      this.secret.value = randomString(16);
    },
    createKey: function(){
      this.secret.key = randomString(8);
    },
    async getDeviceStatus() {
      const res = await queryDevStatus(this.device.addr);
      const data = res.data;
      if(data[0]){
        this.device.online = data[0].online;
        this.device.lastOnline = data[0].connectTime;
      }else{
        this.device.online = false;
        this.device.lastOnline = undefined
      }
      this.buttons = [{icon: 'el-icon-edit-outline', key: 'editDevice', title:'编辑' }];
      if(this.device.online){
        this.buttons.push({icon: 'el-icon-close', key: 'kickDevice', title:'下线' })
      }
      this.$emit('onload', {
        device: this.device,
        product: this.product
      });
    },
    load() {
      this.loading = true;
      getObject('device', this.id).then(response => {
        const device = response.data;
        if(device.product){
          getObject('product', device.product).then(response => {
            this.product = response.data;
            this.device = device;
            this.getDeviceStatus();
            this.loading = false;
          })
        }
      }).catch(err => {
        this.loading = false;
      })
    },
    onUpdate(form) {
      this.load();
      this.openEditDialog = false;
    },
    addDevSecretDone(){
      this.$refs["keyForm"].validate((valid) => {
        if(valid){
          const data = {
            id: this.device.id,
            dk: this.secret.key,
            ds: this.secret.value
          };
          updateObject('device', data).then(response => {
            if(response.code === 200){
              this.device.dk = this.secret.key;
              this.device.ds = this.secret.value;
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
