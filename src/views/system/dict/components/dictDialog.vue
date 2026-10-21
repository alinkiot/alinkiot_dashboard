<template>
    <!-- 添加或修改参数配置对话框 -->
    <el-dialog :title="title" :visible.sync="show" width="500px"  v-loading="loadInfo">
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="字典类型">
          <el-input v-model="dictCategory.dictName" :disabled="true" />
        </el-form-item>
        <el-form-item label="数据标签" prop="dictLabel">
          <el-input v-model="form.dictLabel" placeholder="请输入数据标签" />
        </el-form-item>
        <el-form-item label="显示样式" prop="listClass">
          <el-select v-model="form.listClass">
            <el-option
              v-for="item in listClassOptions"
              :key="item.value"
              v-bind:style="getStyle(item.value)"
              :label="item.label + '(' + item.value + ')'"
              :value="item.value"
            ></el-option>
          </el-select>
        </el-form-item>
        <ImageInput :form="form" v-if="form.listClass === 'picture'" />
        <FileInput :form="form" v-else-if="form.listClass === 'file'" />
        <el-form-item label="数据键值" prop="dictValue" v-else-if="form.listClass === 'code' || form.dictType === 'iot_product_thing'">
          <el-input v-model="form.dictValue" rows="4" type="textarea" placeholder="请输入数据键值" />
        </el-form-item>
        <el-form-item label="数据键值" prop="dictValue" v-else>
          <el-input v-model="form.dictValue" placeholder="请输入数据键值" />
        </el-form-item>
        <el-form-item label="图标显示" prop="cssClass">
          <el-popover
            placement="bottom-start"
            width="560"
            trigger="click"
            @show="$refs['iconSelect'].reset()"
          >
            <IconSelect ref="iconSelect" @selected="selected" />
            <el-input slot="reference" v-model="form.cssClass" placeholder="点击选择图标" clearable>
              <svg-icon
                v-if="form.cssClass"
                slot="prefix"
                :icon-class="form.cssClass"
                class="el-input__icon"
                style="height: 32px;width: 16px;"
              />
              <i v-else slot="prefix" class="el-icon-search el-input__icon" />
            </el-input>
          </el-popover>
        </el-form-item>
        <el-form-item label="显示排序" prop="dictSort">
          <el-input-number v-model="form.dictSort" controls-position="right" :min="0" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio
              v-for="dict in dict.type.sys_normal_disable"
              :key="dict.value"
              :label="dict.value"
            >{{dict.label}}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入内容"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>
</template>
<script>

import { optionselect as getDictOptionselect } from "@/api/system/dict/type";
import { getData, addData, updateData } from "@/api/system/dict/data";
import ImageInput from "@/views/system/dict/components/imageInput.vue";
import FileInput from "@/views/system/dict/components/fileInput.vue";
import IconSelect from "@/components/IconSelect/index.vue";

export default {
  components: {IconSelect, FileInput, ImageInput},
  dicts: ['sys_normal_disable'],
  props: {
    open: {
      type: Boolean,
      default: false
    },
    dictType: {
      type: String,
      required: true
    },
    dictCode: {
      type: Number,
      default: undefined
    },
    default: {
      type: Object,
      default: function (){ return {} }
    }
  },
  data() {
    return {
      // 弹出层标题
      title: "",
      form: { },
      show: false,
      loadInfo: false,
      dictCategory: {},
      // 数据标签回显样式
      listClassOptions: [
        {
          value: "picture",
          label: "多媒体-图片"
        },
        {
          value: "file",
          label: "多媒体-文件"
        },
        {
          value: "code",
          label: "长文本"
        },
        {
          value: "default",
          label: "文本-默认"
        },
        {
          value: "primary",
          label: "文本-主要"
        },
        {
          value: "success",
          label: "文本-成功"
        },
        {
          value: "info",
          label: "文本-信息"
        },
        {
          value: "warning",
          label: "文本-警告"
        },
        {
          value: "danger",
          label: "文本-危险"
        }
      ],
      // 表单校验
      rules: {
        dictLabel: [
          { required: true, message: "数据标签不能为空", trigger: "blur" }
        ],
        dictValue: [
          { required: true, message: "数据键值不能为空", trigger: "blur" }
        ],
        dictSort: [
          { required: true, message: "数据顺序不能为空", trigger: "blur" }
        ]
      }
    };
  },
  created() {
    this.reset();
    this.getDictType();
  },
  methods: {
    // 选择图标
    selected(name) {
      this.form.cssClass = name;
    },
    /** 查询字典类型列表 */
    getDictType() {
      getDictOptionselect({ 'dictType': this.dictType }).then(response => {
        const items = response.data;
        if(items.length === 1){
          this.dictCategory = items[0];
          this.form.dictType = this.dictCategory.dictType;
          this.$emit('change', this.dictCategory);
        }
      });
    },
    getStyle(value) {
      if(value === 'danger'){
        return 'color:#f56c6c;'
      } else if(value === 'primary'){
        return 'color:#409eff;'
      } else if(value === 'success'){
        return 'color:#67c23a;'
      } else if(value === 'info'){
        return 'color:#9da0a6;'
      } else if(value === 'warning'){
        return 'color:#e6a23c;'
      } else if(value === 'default'){
        return 'color:#6a6a6a;'
      }
    },
    /** 提交按钮 */
    submitForm: function() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.dictCode != undefined) {
            updateData(this.form).then(response => {
              this.$store.dispatch('dict/removeDict', this.dictCategory.dictType);
              this.$modal.msgSuccess("修改成功");
              this.$emit('change', this.dictCategory);
              this.show = false;
            });
          } else {
            addData(this.form).then(response => {
              this.$store.dispatch('dict/removeDict', this.dictCategory.dictType);
              this.$modal.msgSuccess("新增成功");
              this.$emit('change', this.dictCategory);
              this.show = false;
            });
          }
        }
      });
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.show = true;
      if(this.dictCode){
        this.loadInfo = true;
        getData(this.dictCode).then(response => {
          this.loadInfo = false;
          this.form = response.data;
          this.title = "修改字典数据";
        });
      }else{
        this.reset();
        this.title = "新增字典数据";
      }
    },
    // 取消按钮
    cancel() {
      this.show = false;
      this.reset();
    },
    // 表单重置
    reset() {
      this.form = {
        dictType: this.dictCategory.dictType,
        dictCode: this.default.dictCode,
        dictLabel: this.default.dictLabel,
        dictValue: this.default.dictValue,
        cssClass: this.default.cssClass,
        listClass: this.dictCategory.dictType === 'iot_product_thing'? 'code':'default',
        dictSort: 0,
        status: "0",
        remark: this.default.remark
      };
      this.resetForm("form");
    }
  },
  watch: {
    open() {
      this.handleAdd()
    }
  }
};
</script>
<style lang="scss" scoped>

</style>
