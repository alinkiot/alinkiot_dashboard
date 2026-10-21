<template>
  <div v-if="things.length > 0">
    <el-button-group>
      <el-button class="btn-tool" size="mini" type="primary" v-for="thing in things" :key="thing.name"  @click="openDialog(thing)" icon="el-icon-s-tools">
        {{ thing.title }}
      </el-button>
    </el-button-group>
    <el-dialog title="命令下发" :visible.sync="openSendDialog" >
      <el-form ref="sendForm" :model="cThing" :rules="rules" label-width="100px" label-position="top">
        <el-form-item :label="cThing.title" prop="value">
          <el-checkbox v-model="checkedHex">Hex</el-checkbox>
          <el-input placeholder="请输入值" v-model="cThing.value" style="width: 80%;margin-left: 5px;"/>
        </el-form-item>
        <el-form-item>
          <el-button icon="el-icon-position" size="mini" type="primary" @click="sendData">发送</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>
<script>

export default {
  components: {  },
  props: {
    device: {
      type: Object
    }
  },
  data() {
    return {
      cThing: {},
      things: [],
      openSendDialog: false,
      checkedHex: false,
      rules: {
        value: [
          {required: true, message: "下发内容不能为空", trigger: "blur"}
        ]
      }
    };
  },
  created() {

  },
  methods: {
    openDialog(thing) {
      this.cThing = thing;
      this.openSendDialog = true;
    },
    sendData() {
      this.$refs["sendForm"].validate(valid => {
          if (valid) {
            let value = this.cThing.value;
            if(this.cThing.type === 'integer'){
              value = this.checkedHex ? parseInt(value, 16) : parseInt(value);
            }else if(this.cThing.type === 'float'){
              value = parseFloat(value);
            }
            this.$emit("sendData", this.cThing.name, value);
            this.openSendDialog = false;
          }
      });
    }
  },
  watch: {
    device: {
      immediate: true,
      handler() {
        // 组件可能在 device 已就绪后才被 v-if 挂载，此时普通 watch 不会触发，
        // 需用 immediate 处理初始值，否则 things 为空、控制按钮不显示。
        if (!this.device || !this.device.product) return;
        const things = Array.isArray(this.device.product.thing) ? this.device.product.thing : [];
        this.things = things.filter(thing => thing.access === "rw" || thing.access === "write");
      }
    }
  }
};
</script>
<style lang="scss" scoped>

.btn-tool{
  margin: 5px 0px 5px 0px;
}

::v-deep .el-card__body {
  padding: 7px;
}

::v-deep .el-dialog__body {
  padding: 10px 20px;
}

::v-deep .el-card__header{
  padding: 5px 5px 5px;
  border-bottom: 1px solid #bebebe;
}

</style>
