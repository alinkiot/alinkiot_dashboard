<template>
  <div>
    <el-form-item label="从站地址" prop="slaveId" v-if="product.nodeType !== 'children'">
      <el-input v-model="modbus.slaveId" @input="onChange" placeholder="从站地址(0x)" />
    </el-form-item>
    <el-form-item label="读功能码" prop="rFunCode" v-if="dataThing.access ==='read' || dataThing.access ==='rw'">
      <el-select v-model.trim="modbus.rFunCode" @input="onChange" placeholder="功能码" clearable>
        <el-option
            v-for="dict in dict.type.iot_modbus_code"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
        />
      </el-select>
<!--      <span class="thing-label">频率</span>-->
<!--      <el-input type="number" min=0 v-model.number="modbus.freq" @input="onChange" style="width: 100px;" placeholder="读取频率"/>-->
<!--      <span class="thing-label">秒</span>-->
    </el-form-item>
    <el-form-item label="写功能码" prop="wFunCode" v-if="dataThing.access ==='write' || dataThing.access ==='rw'">
      <el-select v-model.trim="modbus.wFunCode" @input="onChange" placeholder="功能码" clearable>
        <el-option
            v-for="dict in dict.type.iot_modbus_code"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
        />
      </el-select>
    </el-form-item>
    <el-form-item label="起始地址" prop="start">
      <el-input v-model="modbus.start" @input="onChange" placeholder="寄存器起始地址(0x)" style="width:51%;" />
      <span class="thing-label">数量</span>
      <el-input type="number" min=1 @input="onChange" style="width:30%;" v-model.number="modbus.quantity" placeholder="寄存器数量"/>
    </el-form-item>
    <el-form-item label="符号类型" prop="signed">
      <el-select v-model.trim="modbus.signed" @input="onChange" placeholder="符号类型" style="width: 51%">
        <el-option
            key="signed"
            label="有符号"
            value="signed"
        />
        <el-option
            key="unsigned"
            label="无符号"
            value="unsigned"
        />
      </el-select>
      <span class="thing-label">字节序</span>
      <el-select v-model.trim="modbus.endianness" @input="onChange" placeholder="字节序" style="width: 105px;">
        <el-option
            v-for="dict in dict.type.iot_byte_order"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
        />
      </el-select>
    </el-form-item>
  </div>
</template>
<script>

export default {
  dicts: ['iot_modbus_code', 'iot_byte_order'],
  components: {},
  props: {
    dataThing: {
      type : Object,
      require: true
    },
    product: {
      type : Object,
      require: true
    }
  },
  data() {
    return {
      modbus: {

      }
    };
  },
  created() {
    if(this.dataThing.modbus){
      this.modbus = this.dataThing.modbus;
    }
  },
  methods: {
    onChange : function(){
      this.dataThing.modbus = this.modbus;
    }
  },
  watch: {
    dataThing() {
      if(this.dataThing.modbus){
        this.modbus = this.dataThing.modbus;
      }else{
        this.modbus = {}
      }
    }
  }
};
</script>
<style lang="scss" scoped>
.thing-label {
  font-weight: bold;
  margin: 10px;
}
</style>
