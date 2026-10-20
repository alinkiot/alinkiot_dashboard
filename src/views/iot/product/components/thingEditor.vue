<template>
  <div>
    <el-button-group style="margin-bottom:12px;">
      <el-button size="small" type="primary" @click="openThingDialog" icon="el-icon-plus">新增</el-button>
      <el-button size="small" type="primary" @click="openCloneThing=true" icon="el-icon-s-goods">克隆</el-button>
      <el-button size="small" type="primary"
                 @click="openShareDialog"
                 icon="el-icon-share"
                 v-hasPermi="['system:dict:add']">分享</el-button>
    </el-button-group>
    <ThingTable :things="things" @selectDone="editThing" @deleteThing="thingDelete"/>
    <el-dialog title="物模型编辑" :visible.sync="openThingEditor" width="550px">
      <el-form ref="thingForm" :model="dataThing" :rules="rulesThing" label-width="100px">
        <el-tabs v-model="activeName" type="border-card">
          <el-tab-pane label="基本信息" name="base">
            <el-form-item label="监测名称" prop="title">
              <el-input v-model.trim="dataThing.title" placeholder="请输入监测点名称"/>
            </el-form-item>
            <el-form-item label="变量名" prop="name">
              <el-input v-model.trim="dataThing.name" placeholder="请输入变量名"/>
            </el-form-item>
            <el-form-item label="数据类型" prop="type">
              <el-select v-model.trim="dataThing.type" placeholder="数据类型">
                <el-option
                    v-for="dict in dict.type.iot_data_type"
                    :key="dict.value"
                    :label="dict.label"
                    :value="dict.value"
                />
              </el-select>
            </el-form-item>

            <template v-if="dataThing.type !== 'string'">
              <el-form-item label="精度" prop="precision">
                <el-input type="number" min=0 v-model.number="dataThing.precision" placeholder="精度"/>
              </el-form-item>
              <el-form-item label="最小值" prop="min">
                <el-input type="number" v-model="dataThing.min" placeholder="最小值"/>
              </el-form-item>
              <el-form-item label="最大值" prop="max">
                <el-input type="number" v-model="dataThing.max" placeholder="最大值"/>
              </el-form-item>
            
              <el-form-item label="倍率" prop="rate">
                <el-input v-model="dataThing.rate" placeholder="倍率"/>
              </el-form-item>
              <el-form-item label="偏移量" prop="offset">
                <el-input type="number" v-model="dataThing.offset" placeholder="偏移量"/>
              </el-form-item>

              <el-form-item :label="'单位' + (dataThing.unit ? '(' + dataThing.unit + ')':'')" prop="unit">
                <el-select v-model.trim="dataThing.unit" @change="changeUnit" placeholder="请选择数据单位" clearable>
                  <el-option
                      v-for="dict in dict.type.iot_data_unit"
                      :key="dict.value"
                      :label="dict.label"
                      :value="dict.value"
                  >
                  </el-option>
                </el-select>
                <el-button style="margin-left:5px;" size="mini" type="primary" icon="el-icon-plus" circle @click="addUnit"/>
              </el-form-item>
            </template>

            <el-form-item label="图标显示" prop="icon">
              <el-popover
                placement="bottom-start"
                width="560"
                trigger="click"
                @show="$refs['iconSelect'].reset()"
              >
                <IconSelect ref="iconSelect" @selected="changeIcon" />
                <el-input slot="reference" v-model="dataThing.icon" placeholder="点击选择图标" clearable>
                  <svg-icon
                    v-if="dataThing.icon"
                    slot="prefix"
                    :icon-class="dataThing.icon"
                    class="el-input__icon"
                  />
                  <i v-else slot="prefix" class="el-icon-search el-input__icon" />
                </el-input>
              </el-popover>
            </el-form-item>
            <el-form-item label="读写权限" prop="access">
              <el-radio-group v-model="dataThing.access">
                <el-radio
                    v-for="dict in dict.type.iot_data_access"
                    :key="dict.value"
                    :label="dict.value"
                >{{ dict.label }}
                </el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="频率(秒)" prop="freq">
              <el-input-number v-model.trim="dataThing.freq" placeholder="上报或抄读频率"/>
            </el-form-item>
          </el-tab-pane>
          <el-tab-pane label="计算公式" name="formula">
            <ThingFormula :dataThing="dataThing" :product="product" />
          </el-tab-pane>
          <el-tab-pane label="Modbus" name="modbus" v-if="product.protocol==='Modbus-RTU'">
            <ThingModbus :dataThing="dataThing" :product="product" />
          </el-tab-pane>
          <el-tab-pane label="全向位移计" name="modbus" v-if="product.protocol==='Modbus-JY-R100'">
            <ThingModbus :dataThing="dataThing" :product="product" />
          </el-tab-pane>
        </el-tabs>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button size="mini" type="primary" @click="submitThingForm">确定</el-button>
      </div>
    </el-dialog>
    <DictDialog :open="openShareThing" :default="shareThing" dictType="iot_product_thing" />
    <el-dialog title="克隆公共库" :visible.sync="openCloneThing">
      <DictTable dictType="iot_product_thing" :buttons="buttons" @click="selectThing" />
    </el-dialog>

  </div>
</template>
<script>

import ThingTable from "./thingTable";
import ThingModbus from "./thingModbus";
import DictDialog from "@/views/system/dict/components/dictDialog.vue";
import DictTable from "@/views/system/dict/components/dictTable.vue";
import ThingFormula from "@/views/iot/product/components/thingFormula.vue";
import {checkNumber, validate2Check2} from "@/assets/js/iot";
import IconSelect from "@/components/IconSelect/index.vue";


export default {
  dicts: ['iot_data_type', 'iot_data_unit', 'iot_data_access'],
  components: {IconSelect, ThingModbus, ThingTable, DictDialog, DictTable, ThingFormula },
  props: {
    product: {
      type: Object
    },
    tabThing: {
      type : Array,
      require: true
    }
  },
  data() {
    return {
      shareThing: {
        dictLabel:'',
        dictValue:''
      },
      openThingEditor: false,
      openCloneThing: false,
      openShareThing: false,
      activeName: 'base',
      things: [],
      dataThing: {  },
      unitDict: undefined,
      buttons: [
        {key: 'select', title: '选择', icon:'el-icon-check'}
      ],
      rulesThing: {
        name: [
          {required: true, validator: validate2Check2, message: "变量名称只能为_、0-9、a-z、A-Z", trigger: "blur"}
        ],
        type: [
          {required: true, message: "物模型数据格式不能为空", trigger: "blur"}
        ],
        title: [
          {required: true, message: "功能名称不能为空", trigger: "blur"}
        ],
        rate: [
          {required: true, validator: checkNumber, message: "只能为数字、浮点", trigger: "blur"}
        ]
      }
    };
  },
  created() {
    this.things = this.tabThing;
  },
  methods: {
    selectThing(button, row) {
      this.openCloneThing = false;
      if(button.key === 'select'){
        const value = row.dictValue;
       this.things = JSON.parse(value);
       this.$emit("updateThing", this.things);
      }
    },
    openThingDialog: function () {
      this.dataThing = { access : 'read', icon:'' };
      this.openThingEditor = true;
    },
    openShareDialog: function(){
      this.openShareThing = !this.openShareThing;
      this.shareThing= {
        dictLabel : this.product.name,
        dictValue : this.product.thing
      };
    },
    formatter: function (row, column) {
      switch (column.property){
        case 'range':
          const min = row.min ? row.min : '-∞';
          const max = row.max ? row.max : '∞';
          return min + ' ~ ' + max;
        case 'rate':
          const rate = row.rate ? row.rate : 1;
          const offset = row.offset ? row.offset : 0;
          return '值 * ' + rate + ' + ' + offset;
      }
    },
    addUnit: function(){
      const project = this.$route.params.project
      let path = '/system/dict-data/index/iot_data_unit'
      if(project){
        path = '/' + project + path
      }
      this.$router.push({
        path: path
      });
    },
    changeUnit(unit) {
      const units = this.dict.type.iot_data_unit;
      const results = units.filter(item => item.value === unit);
      if(results[0] && results[0].raw.cssClass){
        this.dataThing.icon = results[0].raw.cssClass
      }else{
        this.dataThing.icon = undefined
      }
    },
    changeIcon(name) {
      this.dataThing.icon = name;
    },
    thingDelete: function (thing) {
      const tabThing = this.tabThing.filter(item => {
        return !(thing.name === item.name);
      });
      this.$emit("updateThing", tabThing);
    },
    editThing: function (row) {
      this.dataThing = row;
      if(!this.dataThing.icon){
        this.dataThing.icon = '';
      }
      this.openThingEditor = true;
    },
    submitThingForm: function () {
      this.$refs["thingForm"].validate(valid => {
        if (valid) {
          const name = this.dataThing.name;
          this.dataThing.max = this.dataThing.max ? Number(this.dataThing.max) : undefined;
          this.dataThing.min = this.dataThing.min ? Number(this.dataThing.min) : undefined;
          this.dataThing.rate = this.dataThing.rate ? Number(this.dataThing.rate) : undefined;
          this.dataThing.offset = this.dataThing.offset ? Number(this.dataThing.offset) : undefined;
          this.dataThing.precision = this.dataThing.precision ? Number(this.dataThing.precision) : undefined;
          let arr = this.tabThing.filter((i) => {
            return name === i.name;
          });
          if (arr.length === 0) {
            this.tabThing.push(this.dataThing);
          }
          console.log(this.dataThing);
          this.$emit("updateThing", this.tabThing);
          this.openThingEditor = false;
        }
      });
    }
  },
  watch: {
    tabThing() {
      this.things = this.tabThing;
    }
  }
};
</script>
<style lang="scss" scoped>
.thing-label {
  font-weight: bold;
  margin: 10px;
}
::v-deep {
  .el-button--mini.is-circle {
   padding : 4px;
 }
}
</style>
