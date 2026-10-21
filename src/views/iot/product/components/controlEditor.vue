<template>
  <div>
    <el-button-group style="margin-bottom:12px;">
      <el-button size="small" type="primary" icon="el-icon-plus" @click="openControlDialog">新增指令</el-button>
    </el-button-group>
    <el-table :data="cmdList" stripe>
      <el-table-column prop="title" align="left" label="功能名称" />
      <el-table-column prop="name" align="left" label="标识" />
      <el-table-column prop="ctrlType" align="center" label="类型">
        <template slot-scope="{ row }">
          {{ ctrlTypeLabel(row.ctrlType) }}
        </template>
      </el-table-column>
      <el-table-column prop="value" align="center" label="值/选项">
        <template slot-scope="{ row }">
          <template v-if="row.ctrlType === 'enum'">
            <el-tag
              v-for="(opt, i) in (row.options || [])"
              :key="i"
              size="mini"
              effect="plain"
              style="margin:2px 4px 2px 0;"
            >{{ opt.label }}={{ opt.value }}</el-tag>
          </template>
          <template v-else-if="row.ctrlType === 'input'">—</template>
          <template v-else>{{ row.value }}</template>
        </template>
      </el-table-column>
      <el-table-column prop="format" align="center" label="数据类型">
        <template slot-scope="{ row }">
          {{ formatLabel(row.format) }}
        </template>
      </el-table-column>
      <el-table-column prop="desc" align="left" label="说明" show-overflow-tooltip>
        <template slot-scope="{ row }">
          {{ row.desc || '—' }}
        </template>
      </el-table-column>
      <el-table-column align="center" label="操作">
        <template slot-scope="{ row }">
          <el-button size="mini" type="text" icon="el-icon-edit" @click="editControl(row)">编辑</el-button>
          <el-button size="mini" type="text" icon="el-icon-delete" style="color:red;" @click="confirmDelControl(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 控制指令编辑 -->
    <el-dialog :title="controlIsCreate ? '新增控制指令' : '编辑控制指令'" :visible.sync="openControl" width="460px">
      <el-form ref="controlForm" :rules="controlFormRule" :model="controlForm" label-position="top">
        <el-form-item label="功能名称" prop="title">
          <el-input v-model="controlForm.title" placeholder="请输入功能名称，如：开/关"/>
        </el-form-item>
        <el-form-item label="指令标识(name)" prop="name" v-if="controlIsCreate">
          <el-input v-model.trim="controlForm.name" placeholder="请输入指令标识"/>
        </el-form-item>
        <el-form-item label="指令类型" prop="ctrlType">
          <el-radio-group v-model="controlForm.ctrlType" size="small">
            <el-radio-button label="btn">按钮型</el-radio-button>
            <el-radio-button label="enum">枚举型</el-radio-button>
            <el-radio-button label="input">输入型</el-radio-button>
          </el-radio-group>
          <div class="form-tip">按钮型：下发单个预设值；枚举型：多个选项，点选下发；输入型：下发时现场输入值</div>
        </el-form-item>
        <el-form-item label="数据类型" prop="format">
          <el-select v-model="controlForm.format" placeholder="请选择数据类型" style="width:100%;">
            <el-option
              v-for="dict in dict.type.iot_data_type"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            />
            <el-option label="HEX" value="hex" />
          </el-select>
        </el-form-item>
        <el-form-item label="预设值(value)" prop="value" v-if="controlForm.ctrlType === 'btn'">
          <el-input v-model="controlForm.value" placeholder="请输入下发值"/>
        </el-form-item>
        <el-form-item label="枚举选项" prop="options" v-if="controlForm.ctrlType === 'enum'">
          <div class="enum-opt" v-for="(opt, idx) in controlForm.options" :key="idx">
            <el-input v-model="opt.label" placeholder="名称，如：启动" class="enum-opt__label" size="small" />
            <el-input v-model="opt.value" placeholder="下发值，如：1" class="enum-opt__value" size="small" />
            <el-button type="text" icon="el-icon-remove-outline" class="enum-opt__del" @click="removeOption(idx)" />
          </div>
          <el-button type="text" icon="el-icon-plus" @click="addOption">添加选项</el-button>
        </el-form-item>
        <el-form-item label="说明" prop="desc">
          <el-input
            v-model="controlForm.desc"
            type="textarea"
            :rows="2"
            placeholder="选填，用于说明该指令，如：频率需 ×200 下发、取值含义等"
          />
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button size="mini" @click="openControl = false">取消</el-button>
        <el-button size="mini" type="primary" @click="addControlDone">确定</el-button>
      </span>
    </el-dialog>
  </div>
</template>
<script>

import {updateObject, getObject} from "@/api/iot/table";

export default {
  dicts: ['iot_data_type'],
  props: {
    id: {
      type: [Number, String],
      required: true
    },
    table: {
      type: String,
      default: 'product'
    }
  },
  data() {
    return {
      openControl: false,
      controlIsCreate: true,
      controlForm: { ctrlType: 'btn', format: 'hex', options: [] },
      cmdList: [],       // 控制指令数组
      controlFormRule: {
        title: [
          {required: true, message: "功能名称不能为空", trigger: "blur"}
        ],
        name: [
          {required: true, message: "指令标识不能为空", trigger: "blur"}
        ],
        ctrlType: [
          {required: true, message: "请选择指令类型", trigger: "change"}
        ],
        value: [
          {
            validator: (rule, value, callback) => {
              // 仅按钮型需要预设值
              if (this.controlForm.ctrlType === 'btn' && (value === undefined || value === null || value === '')) {
                callback(new Error('预设值不能为空'));
              } else {
                callback();
              }
            },
            trigger: 'blur'
          }
        ],
        format: [
          {required: true, message: "请选择数据类型", trigger: "change"}
        ]
      }
    };
  },
  created() {
    this.load();
  },
  methods: {
    // 从 control 字段解析控制指令数组（JSON 字符串或已是数组都兼容）
    parseControl(control) {
      if (!control) return [];
      if (Array.isArray(control)) return control;
      try {
        const arr = JSON.parse(control);
        return Array.isArray(arr) ? arr : [];
      } catch (e) {
        return [];
      }
    },
    load(callback) {
      getObject(this.table, this.id).then(response => {
        const o = response.data;
        this.cmdList = this.parseControl(o.control);
        callback && callback();
      });
    },
    openControlDialog() {
      this.controlIsCreate = true;
      this.controlForm = { ctrlType: 'btn', format: 'hex', options: [] };
      this.openControl = true;
    },
    editControl(row) {
      this.controlIsCreate = false;
      // 深拷贝 options，避免直接改到列表里的引用
      const copy = Object.assign({ ctrlType: 'btn', format: 'hex' }, row);
      copy.options = (row.options || []).map(o => ({ label: o.label, value: o.value }));
      this.controlForm = copy;
      this.openControl = true;
    },
    ctrlTypeLabel(t) {
      return { btn: '按钮型', enum: '枚举型', input: '输入型' }[t] || '按钮型';
    },
    addOption() {
      if (!Array.isArray(this.controlForm.options)) {
        this.$set(this.controlForm, 'options', []);
      }
      this.controlForm.options.push({ label: '', value: '' });
    },
    removeOption(idx) {
      this.controlForm.options.splice(idx, 1);
    },
    // 数据类型展示文案：hex 显示 HEX，其余查字典
    formatLabel(format) {
      if (format === 'hex') return 'HEX';
      const dict = (this.dict && this.dict.type && this.dict.type.iot_data_type) || [];
      const hit = dict.find(d => d.value === format);
      return hit ? hit.label : (format || '');
    },
    confirmDelControl(row) {
      this.$modal.confirm(`确认删除控制指令「${row.title}」？`).then(() => {
        const newList = this.cmdList.filter(item => item.name !== row.name);
        this.save(newList, '删除成功!', () => {
          this.cmdList = newList;
        });
      }).catch(() => {});
    },
    addControlDone() {
      this.$refs["controlForm"].validate((valid) => {
        if (!valid) return;
        const name = this.controlForm.name;
        if (this.controlIsCreate) {
          const dup = this.cmdList.some(item => item.name === name);
          if (dup) {
            this.$modal.msgError('该标识已存在，请更换 name');
            return;
          }
        }
        const ctrlType = this.controlForm.ctrlType || 'btn';
        const row = {
          title: this.controlForm.title,
          name: name,
          ctrlType: ctrlType,
          format: this.controlForm.format || 'hex'
        };
        const desc = (this.controlForm.desc || '').trim();
        if (desc) {
          row.desc = desc;
        }
        if (ctrlType === 'btn') {
          // 按钮型：单个预设值
          row.value = this.controlForm.value;
        } else if (ctrlType === 'enum') {
          // 枚举型：过滤出有效选项（名称和值都填了）
          const options = (this.controlForm.options || [])
            .map(o => ({ label: (o.label || '').trim(), value: (o.value + '').trim() }))
            .filter(o => o.label !== '' && o.value !== '');
          if (options.length === 0) {
            this.$modal.msgError('枚举型至少需要一个有效选项');
            return;
          }
          row.options = options;
        }
        // 输入型：不保存值
        const arr = [];
        let isCreate = true;
        this.cmdList.map(item => {
          if (item.name === name) {
            isCreate = false;
            arr.push(row);
          } else {
            arr.push(item);
          }
        });
        if (isCreate) {
          arr.push(row);
        }
        this.save(arr, isCreate ? '创建成功!' : '更新成功!', () => {
          this.cmdList = arr;
          this.openControl = false;
        });
      });
    },
    save(cmdList, successMsg, callback) {
      const data = {
        id: this.id,
        control: JSON.stringify(cmdList)
      };
      updateObject(this.table, data).then(() => {
        this.$modal.msgSuccess(successMsg);
        callback && callback();
      });
    }
  },
  watch: {
    id() {
      this.load();
    }
  }
};
</script>
<style lang="scss" scoped>
.form-tip {
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
  margin-top: 4px;
}

.enum-opt {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;

  &__label {
    flex: 1;
  }

  &__value {
    flex: 1;
  }

  &__del {
    color: #f56c6c;
    padding: 0;
    font-size: 18px;
  }
}
</style>
