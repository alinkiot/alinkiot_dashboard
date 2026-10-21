<template>
  <div class="cmd-btn-box" v-if="cmds.length > 0">
    <template v-for="cmd in cmds">
      <!-- 按钮型：单个按钮，下发预设值 -->
      <el-button
        v-if="cmd.ctrlType === 'btn'"
        :key="cmd.name"
        class="cmd-btn"
        size="mini"
        type="primary"
        icon="el-icon-s-promotion"
        @click="sendBtn(cmd)"
      >{{ cmd.title }}</el-button>

      <!-- 枚举型：下拉菜单，点选项下发 -->
      <el-dropdown
        v-else-if="cmd.ctrlType === 'enum'"
        :key="cmd.name"
        trigger="click"
        class="cmd-dropdown"
        @command="opt => sendEnum(cmd, opt)"
      >
        <el-button size="mini" type="primary">
          {{ cmd.title }}<template v-if="enumLabel(cmd)">：{{ enumLabel(cmd) }}</template><i class="el-icon-arrow-down el-icon--right"></i>
        </el-button>
        <el-dropdown-menu slot="dropdown">
          <el-dropdown-item
            v-for="(opt, i) in (cmd.options || [])"
            :key="cmd.name + '_' + i"
            :command="opt"
          >
            <i
              class="el-icon-check cmd-check"
              :style="{
                color: '#409eff',
                marginRight: '4px',
                visibility: enumLabel(cmd) === opt.label ? 'visible' : 'hidden'
              }"
            />
            {{ opt.label }}
          </el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>

      <!-- 输入型：按钮点击后弹框输入值 -->
      <el-button
        v-else-if="cmd.ctrlType === 'input'"
        :key="cmd.name"
        class="cmd-btn"
        size="mini"
        type="warning"
        icon="el-icon-edit"
        @click="openInput(cmd)"
      >{{ cmd.title }}</el-button>
    </template>

    <!-- 输入型下发弹框 -->
    <el-dialog :title="curCmd ? curCmd.title : '输入下发'" :visible.sync="openInputDialog" width="420px">
      <el-alert
        v-if="curCmd && curCmd.desc"
        :title="curCmd.desc"
        type="info"
        :closable="false"
        show-icon
        style="margin-bottom: 12px;"
      />
      <el-form ref="inputForm" :model="inputForm" :rules="inputRules" label-position="top">
        <el-form-item :label="'下发值' + (curCmd ? '（' + formatLabel(curCmd.format) + '）' : '')" prop="value">
          <el-input-number
            v-if="curCmd && (curCmd.format === 'integer' || curCmd.format === 'float')"
            v-model="inputForm.value"
            :precision="curCmd.format === 'float' ? 2 : 0"
            style="width: 100%;"
            placeholder="请输入数值"
          />
          <el-input v-else v-model="inputForm.value" placeholder="请输入下发值" />
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button size="mini" @click="openInputDialog = false">取消</el-button>
        <el-button size="mini" type="primary" @click="sendInput">发送</el-button>
      </span>
    </el-dialog>
  </div>
</template>
<script>

export default {
  dicts: ['iot_data_type'],
  props: {
    device: {
      type: Object
    },
    values: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      cmds: [],
      enumState: {},  // 枚举指令当前所选 label：{ [cmd.name]: label }
      openInputDialog: false,
      curCmd: undefined,
      inputForm: { value: undefined },
      inputRules: {
        value: [
          {required: true, message: '下发值不能为空', trigger: 'blur'}
        ]
      }
    };
  },
  methods: {
    formatLabel(format) {
      if (format === 'hex') return 'HEX';
      const dict = (this.dict && this.dict.type && this.dict.type.iot_data_type) || [];
      const hit = dict.find(d => d.value === format);
      return hit ? hit.label : (format || '');
    },
    sendBtn(cmd) {
      this.$emit('sendData', cmd.name, cmd.value, cmd.format);
    },
    sendEnum(cmd, opt) {
      this.$set(this.enumState, cmd.name, opt.label);
      this.$emit('sendData', cmd.name, opt.value, cmd.format);
    },
    // 枚举当前状态：优先用设备上报值匹配选项，否则用本地最近一次选择
    enumLabel(cmd) {
      const item = this.values && this.values[cmd.name];
      if (item && item.value !== undefined && item.value !== null && item.value !== '') {
        const hit = (cmd.options || []).find(o => String(o.value) === String(item.value));
        if (hit) return hit.label;
      }
      return this.enumState[cmd.name] || '';
    },
    openInput(cmd) {
      this.curCmd = cmd;
      this.inputForm = { value: undefined };
      this.openInputDialog = true;
    },
    sendInput() {
      this.$refs['inputForm'].validate(valid => {
        if (!valid) return;
        this.$emit('sendData', this.curCmd.name, this.inputForm.value, this.curCmd.format);
        this.openInputDialog = false;
      });
    }
  },
  watch: {
    device: {
      immediate: true,
      handler() {
        const product = this.device && this.device.product;
        this.cmds = (product && Array.isArray(product.cmd)) ? product.cmd : [];
        this.enumState = {};
      }
    }
  }
};
</script>
<style lang="scss" scoped>
.cmd-btn-box {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.cmd-btn {
  margin: 0;
}

.cmd-dropdown {
  display: inline-flex;
}
</style>
