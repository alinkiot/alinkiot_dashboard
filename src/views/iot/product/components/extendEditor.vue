<template>
  <div>
    <TableShow
      title = '扩展字段'
      :columns="columns"
      :item="extend"
      :buttons="buttons"
      @click="itemClick"
    />
    <el-dialog title="扩展字段" :visible.sync="open" >
      <el-form ref="cfgForm" :rules="cfgFormRule" :model="form" label-width="100px" prop="cfgForm">
        <el-form-item label="字段名称" prop="title">
          <el-input v-model="form.title" placeholder="请输入字段名称" :disabled="isPresetField"/>
          <div class="form-tip" v-if="isPresetField">该字段为预设字段，名称不可修改，仅可修改数据值</div>
        </el-form-item>
        <template v-if="isCreate">
          <el-form-item label="字段标识" prop="name" >
            <el-input v-model="form.name" placeholder="请输入字段标识"/>
          </el-form-item>
        </template>
        <el-form-item v-else label="字段标识">
          <span class="form-readonly">{{ form.name }}</span>
        </el-form-item>
        <el-form-item label="值形式" prop="valueType" v-if="!isPresetField">
          <el-radio-group v-model="form.valueType" size="small">
            <el-radio-button label="input">输入型</el-radio-button>
            <el-radio-button label="enum">枚举型</el-radio-button>
          </el-radio-group>
          <div class="form-tip">输入型：数据值自由输入；枚举型：预设多个选项，编辑数据值时下拉选择</div>
        </el-form-item>
        <el-form-item v-if="isCreate" label="数据类型" prop="type">
          <el-select v-model.trim="form.type" placeholder="数据类型">
            <el-option
              v-for="dict in dict.type.iot_data_type"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            />
            <el-option label="HEX" value="hex" />
          </el-select>
        </el-form-item>
        <el-form-item label="枚举选项" prop="options" v-if="form.valueType === 'enum' && !isPresetField">
          <div class="enum-opt" v-for="(opt, idx) in form.options" :key="idx">
            <el-input v-model="opt.label" placeholder="名称，如：开启" class="enum-opt__label" size="small" />
            <el-input v-model="opt.value" placeholder="值，如：1" class="enum-opt__value" size="small" />
            <el-button type="text" icon="el-icon-remove-outline" class="enum-opt__del" @click="removeOption(idx)" />
          </div>
          <el-button type="text" icon="el-icon-plus" @click="addOption">添加选项</el-button>
        </el-form-item>
        <el-form-item label="数据值" prop="value">
          <el-select v-if="form.valueType === 'enum'" v-model="form.value" placeholder="请选择数据值" style="width:100%;">
            <el-option
              v-for="(opt, i) in (form.options || [])"
              :key="i"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
          <el-input v-else-if="form.type==='integer'" v-model.number="form.value" placeholder="请输入数值"/>
          <el-input
            v-else
            v-model="form.value"
            type="textarea"
            :autosize="{ minRows: 3, maxRows: 12 }"
            placeholder="请输入数据内容（支持多行，如 JSON 配置）"/>
          <div v-if="form.valueType !== 'enum' && form.type !== 'integer'" class="value-tools">
            <el-button size="mini" type="text" @click="formatValueAsJson">JSON显示</el-button>
            <el-button size="mini" type="text" @click="formatValueAsText">文本显示</el-button>
          </div>
        </el-form-item>
        <el-form-item>
          <el-button size="mini" type="primary" @click="addExtendDone">确定</el-button>
          <el-button v-if="!isCreate && !isPresetField" size="mini" type="danger" @click="delExtend">删除</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>
<script>

import {updateObject, getObject} from "@/api/iot/table";
import TableShow from "@/components/TableShow/index.vue";

export default {
  dicts: ['iot_data_type'],
  components: {TableShow},
  props: {
    id: {
      type: [Number,String],
      required: true
    },
    table: {
      type: String
    }
  },
  data() {
    return {
      open: false,
      form: {},
      extendTable: [],
      isCreate: true,
      columns: [],
      extend:{},
      buttons: [
        {icon: 'el-icon-plus', key: 'addExtend', title:'新增' },
        {icon: 'el-icon-delete', key: 'cleanAll', title:'清空' }
      ],
      cfgFormRule: {
        type: [
          {required: true, message: "数据类型不能为空", trigger: "blur"}
        ],
        name: [
          {required: true, message: "字段标识不能为空", trigger: "blur"}
        ],
        title: [
          {required: true, message: "字段名称不能为空", trigger: "blur"}
        ]
      }
    };
  },
  computed: {
    // 是否为预设字段：编辑状态下且 form.default 为 true。
    // 预设字段名称不可改、不可删，只能改数据值。
    isPresetField() {
      return !this.isCreate && !!this.form.default;
    }
  },
  created() {
    this.getExtend();
  },
  methods: {
    createData() {
      this.columns = [];
      this.extend = {};
      this.extendTable.map(row => {
        this.extend[row.name] = row.value;
        const item = {
          key: row.name,
          title: row.title,
          type: 'text',
          click: { icon:'el-icon-edit-outline' }
        }
        // 枚举型：列表展示对应选项的 label 而非原始 value
        if (row.valueType === 'enum' && Array.isArray(row.options)) {
          const options = row.options;
          item.format = (key, value) => {
            const hit = options.find(o => String(o.value) === String(value));
            return hit ? hit.label : value;
          };
        } else if (row.type === 'json') {
          // JSON 类型：列表里显示占位符，点编辑查看
          item.format = () => '<JSON>';
        } else {
          // 普通字段：列表里只做预览，长内容（如 JSON 配置）单行截断，避免撑乱布局
          item.format = (key, value) => this.previewValue(value);
        }
        this.columns.push(item)
      })
    },
    // JSON显示：把当前值按 JSON 美化（带缩进）；非合法 JSON 则提示，不改内容
    formatValueAsJson() {
      const v = this.form.value;
      if (v === undefined || v === null || String(v).trim() === '') return;
      try {
        this.$set(this.form, 'value', JSON.stringify(JSON.parse(v), null, 2));
      } catch (e) {
        this.$modal.msgWarning('当前内容不是合法 JSON，无法格式化');
      }
    },
    // 文本显示：把当前值压成紧凑单行；非合法 JSON 则仅压缩空白
    formatValueAsText() {
      const v = this.form.value;
      if (v === undefined || v === null || String(v).trim() === '') return;
      try {
        this.$set(this.form, 'value', JSON.stringify(JSON.parse(v)));
      } catch (e) {
        this.$set(this.form, 'value', String(v).replace(/\s+/g, ' ').trim());
      }
    },
    // 列表值预览：换行转空格、多余空白压缩、超长截断，避免长 JSON 撑乱布局
    previewValue(value) {
      if (value === null || value === undefined) return value;
      const str = String(value).replace(/\s+/g, ' ').trim();
      const max = 40;
      return str.length > max ? str.slice(0, max) + '…' : str;
    },
    // 从 config 数组中提取扩展字段（普通 { name, title, type, value } 元素）
    splitConfig(cfg) {
      const extend = [];
      (cfg || []).forEach(item => {
        if (item && item.name !== undefined) {
          extend.push(item);
        }
      });
      return { extend };
    },
    // 将 extendTable 直接写回 config
    buildConfig() {
      return this.extendTable.slice();
    },
    itemClick(column) {
      if(column.key === 'addExtend'){
        this.isCreate = true;
        this.form = { valueType: 'input', options: [] };
        this.open = true;
      } else if(column.key === 'cleanAll'){
        this.delAll();
      } else{
        const arr = this.extendTable.filter(item => { return item.name === column.key });
        if(arr.length > 0){
          this.isCreate = false;
          const src = arr[0];
          // 深拷贝，避免未保存前直接改到列表里的引用；补默认 valueType/options
          let formValue = src.value;
          // JSON 类型：base64 解码后编辑
          if (src.type === 'json' && typeof formValue === 'string') {
            try {
              formValue = decodeURIComponent(escape(atob(formValue)));
            } catch (e) {
              // 解码失败，保持原值
            }
          }
          this.form = {
            ...src,
            value: formValue,
            valueType: src.valueType || 'input',
            options: (src.options || []).map(o => ({ label: o.label, value: o.value }))
          };
          this.open = true;
        }
      }
    },
    addOption() {
      if (!Array.isArray(this.form.options)) {
        this.$set(this.form, 'options', []);
      }
      this.form.options.push({ label: '', value: '' });
    },
    removeOption(idx) {
      this.form.options.splice(idx, 1);
    },
    // 产品扩展字段的预设默认列表，首次打开时自动补充缺失的字段
    defaultFields() {
      return [
        {
          name: 'supportImport',
          title: '数据导入',
          type: 'integer',
          value: 0,
          default: true,
          valueType: 'enum',
          options: [
            { label: '关闭', value: 0 },
            { label: '开启', value: 1 }
          ]
        }
      ];
    },
    // 检查 extendTable 中的预设字段：缺则追加，已存在但缺少标记/枚举配置则补齐。
    // 返回 true 表示有变更需要保存。
    ensureDefaultFields(extendTable) {
      let changed = false;
      this.defaultFields().forEach(def => {
        const existing = extendTable.find(item => item.name === def.name);
        if (!existing) {
          extendTable.push({ ...def });
          changed = true;
          return;
        }
        // 老数据补齐 default 锁定标记
        if (!existing.default) {
          this.$set(existing, 'default', true);
          changed = true;
        }
        // 老数据补齐枚举值形式配置（不覆盖已有的 value）
        if (def.valueType === 'enum' && existing.valueType !== 'enum') {
          this.$set(existing, 'valueType', 'enum');
          this.$set(existing, 'options', def.options.map(o => ({ ...o })));
          changed = true;
        }
      });
      return changed;
    },
    // 解析 config：后端返回字符串，需要 JSON.parse
    parseConfig(raw) {
      if (!raw) return [];
      // 已经是数组，直接返回
      if (Array.isArray(raw)) return raw;
      // 字符串需要解析
      if (typeof raw === 'string') {
        try {
          const v = JSON.parse(raw);
          return Array.isArray(v) ? v : [];
        } catch (e) {
          console.warn('config 解析失败，原始内容：', raw);
          return [];
        }
      }
      return [];
    },
    getExtend(callback) {
      getObject(this.table, this.id).then(response => {
        const o = response.data;
        const rawCfg = this.parseConfig(o.config);
        const { extend: devExtend } = this.splitConfig(rawCfg);
        if(this.table === 'device' && o.product){
          getObject('product', o.product).then(response => {
            const rawProductCfg = this.parseConfig(response.data.config);
            const { extend: productExtend } = this.splitConfig(rawProductCfg);
            productExtend.map(item => {
              const arr = devExtend.filter(i => { return i.name === item.name });
              if(arr.length === 0){
                item.default = true;
                devExtend.push(item);
              }
            });
            this.extendTable = devExtend;
            this.createData();
            callback && callback()
          })
        }else{
          // 产品扩展字段：自动补充预设的默认字段（首次加载时写入，已存在则跳过）
          const changed = this.ensureDefaultFields(devExtend);
          this.extendTable = devExtend;
          this.createData();
          if (changed) {
            // 静默保存，确保默认字段持久化，不打断用户操作
            updateObject(this.table, { id: o.id, config: JSON.stringify(this.buildConfig()) });
          }
          callback && callback();
        }
      })
    },
    delAll() {
      this.extendTable = [];
      const data = {
        id: this.id,
        config: JSON.stringify(this.buildConfig())
      };
      const that = this;
      updateObject(this.table, data).then(response => {
        this.getExtend(function(){
          that.open = false;
        });
      });
    },
    delExtend(){
      const name = this.form.name;
      this.extendTable = this.extendTable.filter(item => {
        return !item.default && item.name !== name;
      });
      const data = {
        id : this.id,
        config : JSON.stringify(this.buildConfig())
      };
      const that = this;
      updateObject(this.table, data).then(response => {
        this.getExtend(function(){
          that.open = false;
        });
      });
    },
    addExtendDone() {
      this.$refs["cfgForm"].validate((valid) => {
        if (!valid) {
          this.$modal.msgWarning('请完整填写必填项');
          return;
        }
        const valueType = this.form.valueType || 'input';
        let options = [];
        if (valueType === 'enum') {
          if (this.isPresetField) {
            // 预设字段的枚举选项不可编辑，沿用表单里已带的 options
            options = (this.form.options || []).map(o => ({ label: o.label, value: o.value }));
          } else {
            // 普通枚举型：过滤出有效选项（名称和值都填了）
            options = (this.form.options || [])
              .map(o => ({ label: (o.label || '').trim(), value: (o.value + '').trim() }))
              .filter(o => o.label !== '' && o.value !== '');
            if (options.length === 0) {
              this.$modal.msgError('枚举型至少需要一个有效选项');
              return;
            }
          }
        }
        let value = this.form.value;
        if(this.form.type === 'float'){
          value = parseFloat(value);
        }
        // JSON 类型：值用 base64 编码存储，避免特殊字符破坏 config 结构
        if(this.form.type === 'json' && typeof value === 'string'){
          try {
            // 先校验是否为合法 JSON
            JSON.parse(value);
            value = btoa(unescape(encodeURIComponent(value)));
          } catch (e) {
            // 非合法 JSON，直接保存原字符串
          }
        }
        const row = {
          title: this.form.title,
          name: this.form.name,
          type: this.form.type,
          value: value
        };
        // 预设字段保留 default 标记，避免保存后丢失锁定状态
        if (this.form.default) {
          row.default = true;
        }
        // 记录值形式；枚举型额外存选项
        if (valueType === 'enum') {
          row.valueType = 'enum';
          row.options = options;
        }
        const arr = [];
        let isCreate = true;
        this.extendTable.map(item => {
          if(item.name === this.form.name){
            isCreate = false;
            arr.push(row);
          }else{
            arr.push(item)
          }
        });
        if(isCreate){
          arr.push(row);
        }
        this.extendTable = arr;
        const data = {
          id: this.id,
          config: JSON.stringify(this.buildConfig())
        };
        const that = this;
        updateObject(this.table, data).then(response => {
          that.open = false;
          that.getExtend(function() {
            that.$modal.msgSuccess(isCreate ? '创建成功!' : '更新成功!');
          });
        });
      })
    }
  }
};
</script>
<style lang="scss" scoped>

.form-tip {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
}

.form-readonly {
  color: #606266;
  font-size: 14px;
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

.value-tools {
  margin-top: 4px;
  text-align: right;

  .el-button--mini {
    padding: 0;
    margin-left: 12px;
  }
}

</style>
