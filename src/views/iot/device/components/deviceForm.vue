<template>
  <div>
    <el-card shadow="never" v-if="!device" style="margin-bottom: 10px; border-width: 0px;">
      <el-steps :active="2" align-center finish-status="success" >
        <el-step title="步骤1" description="创建产品、定义物模型"></el-step>
        <el-step title="步骤2" description="创建设备，关联产品"></el-step>
        <el-step title="步骤3" description="连接上云、查看实时数据"></el-step>
      </el-steps>
    </el-card>
    <el-row v-loading="loading">
      <el-form ref="form" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="设备地址：" prop="addr">
          <el-input v-model="form.addr" placeholder="请输入设备地址"/>
        </el-form-item>
        <el-form-item label="设备名称：" prop="name">
          <el-input v-model="form.name" placeholder="请输入设备名称"/>
        </el-form-item>
        <InputTableSelect
          :queryId="form.product"
          showColumn="name"
          label="所属产品 "
          table="product"
          @selectDone="selectProductDone"
          prop="product"/>
        <br/>
        <InputTableSelect
          :queryId="form.project"
          showColumn="title"
          label="所属项目"
          table="project"
          @selectDone="selectProjectDone"
          prop="project"/>
        <el-form-item label="安装位置：" prop="location">
          <MapSelector
            :location="form.location" :lat="form.lat"
            :lng="form.lng"
            @selectDone="selectMapDone"
          />
        </el-form-item>
        <el-form-item label="禁用状态：" prop="status">
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
          <el-button size="mini" type="primary" @click="submitForm">保存</el-button>
        </el-form-item>
      </el-form>
    </el-row>
  </div>
</template>
<script>
import InputTableSelect from "@/components/InputTableSelect/index.vue";
import MapSelector from "@/components/MapSelector";
import {createObject, updateObject} from "@/api/iot/table";
import {validate2Check, validateCheck} from "@/assets/js/iot";

export default {
  components: {
    InputTableSelect,
    MapSelector
  },
  dicts: ['sys_normal_disable'],
  props: {
    device: {
      type: Object,
      default: function (){ return undefined; }
    }
  },
  data() {
    return {
      loading: false,
      table: 'device',
      form: { status : '0' },
      product: undefined,
      project: undefined,
      rules: {
        addr: [
          {required: true, validator: validate2Check, message: "设备地址只能为0-9、a-z、A-Z", trigger: "blur"}
        ],
        name: [
          {required: true, message: "设备名称不能为空", trigger: "blur"}
        ],
        nodeType: [
          {required: true, message: "设备类型不能为空", trigger: "blur"}
        ],
        product: [
          {self: this,  validator: validateCheck, required: true, message: "所属产品不能为空", trigger: "blur"}
        ]
      }
    };
  },
  created() {
    if(this.device){
      this.form = {
        id: this.device.id,
        addr: this.device.addr,
        name: this.device.name,
        product: this.device.product,
        project: this.device.project,
        location: this.device.location,
        lat: this.device.lat,
        lng: this.device.lng,
        status: this.device.status
      }
    }
  },
  methods: {
    reset() {
      this.product = undefined;
      this.project = undefined;
      this.form = { status : '0' };
    },
    /** 提交按钮 */
    submitForm: function () {
      this.$refs["form"].validate(valid => {
        if (valid) {
          this.loading = true;
          if (this.device) {
            updateObject(this.table, this.form).then(response => {
              this.$modal.msgSuccess("修改成功!");
              this.loading = false;
              this.$emit('onUpdate', this.form);
            });
          } else {
            createObject(this.table, this.form).then(response => {
              this.$modal.msgSuccess("新增成功!");
              this.loading = false;
              this.$emit('onCreate', this.form);
              this.reset();
            });
          }
        }
      });
    },
    selectMapDone: function(data){
      this.form.location = data.location;
      this.form.country = data.country;
      this.form.province = data.province;
      this.form.district = data.district;
      this.form.lat = data.lat;
      this.form.lng = data.lng;
    },
    selectProjectDone: function(project){
      this.project = project;
      if(!project){
        this.form.project = undefined;
        this.device.project = undefined;
      }else{
        this.form.project = this.project.id;
      }
    },
    selectProductDone: function(product){
      this.product = product;
      if(!product){
        this.form.product = undefined;
        this.device.product = undefined;
      }else{
        this.form.product = this.product.id;
      }
    }
  }
};
</script>
<style lang="scss" scoped>


</style>
