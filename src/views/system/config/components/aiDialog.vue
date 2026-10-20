<template>
  <div>
    <el-form-item label="请求地址" prop="base_url">
      <el-input v-model="ai.base_url" placeholder="请输入请求URL" />
    </el-form-item>
    <el-form-item label="Api Key" prop="apiKey">
      <el-input v-model="ai.apiKey" placeholder="请输入API Key" />
    </el-form-item>
    <el-form-item label="模型" prop="model">
      <el-input v-model="ai.model" placeholder="请输入使用模型，如 DeepSeek-V3.2" />
    </el-form-item>

    <el-form-item label="请求方法" prop="method">
      <el-input v-model="ai.method" placeholder="GET/POST" />
    </el-form-item>

    <el-form-item label="请求Header" prop="format_header">
      <el-input type="textarea" rows="5" v-model="ai.format_header" placeholder="JSON 描述" />
      <el-collapse class="tip-collapse">
        <el-collapse-item title="示例">
          <pre class="tip-example">{{ headerExample }}</pre>
        </el-collapse-item>
      </el-collapse>
    </el-form-item>

    <el-form-item label="请求Body" prop="format_body">
      <el-input type="textarea" rows="5" v-model="ai.format_body" placeholder="JSON 描述" />
      <el-collapse class="tip-collapse">
        <el-collapse-item title="示例">
          <pre class="tip-example">{{ bodyExample }}</pre>
        </el-collapse-item>
      </el-collapse>
    </el-form-item>

    <el-form-item label="返回结果" prop="format_result">
      <el-input type="textarea" rows="5" v-model="ai.format_result" placeholder="JSON 描述" />
      <el-collapse class="tip-collapse">
        <el-collapse-item title="示例">
          <pre class="tip-example">{{ resultExample }}</pre>
        </el-collapse-item>
      </el-collapse>
    </el-form-item>

    <div style="text-align: right;">
      <el-button type="primary" @click="submitForm">保存</el-button>
    </div>
  </div>
</template>
<script>

import { Base64 } from 'js-base64';

export default {
  components: {},
  props: {
    form: {
      type: Object,
      require: true
    }
  },
  data() {
    return {
      ai : {},
      headerExample: JSON.stringify({
        "Content-Type": "application/json; charset=utf-8",
        "Authorization": {
          "ref": "#apiKey",
          "re": "(\\w)",
          "replace": "Bearer \\1"
        }
      }, null, 2),
      bodyExample: JSON.stringify({
        "model": "#model",
        "messages": [
          {
            "role": "system",
            "content": "#prompt"
          },
          {
            "role": "user",
            "content": "#content"
          }
        ]
      }, null, 2),
      resultExample: JSON.stringify({
        "200": {
          "id": "#id",
          "created": "#created",
          "content": "#choices/items/1/message/content"
        },
        "other": {
          "code": "#error/code",
          "http_code": "#http_code",
          "message": "#error/message"
        }
      }, null, 2)
    };
  },
  created() {
    if(this.form.configValue !== undefined && this.form.configValue !== ''){
      console.log(this.form.configValue);
      const ai = JSON.parse(this.form.configValue);
      if(ai){
        this.ai = ai;
        this.ai.format_header = this.decode_format('format_header');
        this.ai.format_body = this.decode_format('format_body');
        this.ai.format_result = this.decode_format('format_result');
      }
    }
  },
  methods: {
    encode_format(key) {
      const value = this.ai[key];
      const NValue = value ? JSON.stringify(JSON.parse(value), null, 0) : '';
      return Base64.encode(NValue);
    },
    decode_format(key) {
      const value = this.ai[key];
      const NValue = value ? JSON.stringify(JSON.parse(Base64.decode(value)), null, 2) : '';
      return NValue;
    },
    submitForm: function() {
      this.ai.format_header =  this.encode_format('format_header');
      this.ai.format_body = this.encode_format('format_body');
      this.ai.format_result = this.encode_format('format_result');
      this.form.configValue = JSON.stringify(this.ai);
      this.$emit('submit')
    }
  }
};
</script>
<style lang="scss" scoped>
.tip-collapse {
  margin-top: 5px;
  border: none;
  ::v-deep .el-collapse-item__header {
    height: 28px;
    line-height: 28px;
    font-size: 12px;
    color: #909399;
    border: none;
    background: transparent;
  }
  ::v-deep .el-collapse-item__wrap {
    border: none;
    background: transparent;
  }
  ::v-deep .el-collapse-item__content {
    padding-bottom: 0;
  }
}
.tip-example {
  background: #f5f7fa;
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 12px;
  line-height: 1.5;
  color: #606266;
  margin: 0;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
