<template>
  <div>
    <div class="section-title">系统内置 Topic</div>
    <el-table :data="builtinTopics" stripe size="small" class="builtin-table">
      <el-table-column prop="topic" align="left" label="Topic 模板" min-width="260">
        <template slot-scope="{ row }">
          <code class="topic-code">{{ row.topic }}</code>
        </template>
      </el-table-column>
      <el-table-column prop="action" align="center" label="动作" width="110">
        <template slot-scope="{ row }">
          <el-tag :type="row.action === 'publish' ? 'success' : ''" size="mini" effect="plain">
            {{ actionLabel(row.action) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="desc" align="left" label="说明" min-width="180" />
    </el-table>
    <div class="tip-bar">以上是系统内置的 Topic，无需配置、不可修改；<code>{addr}</code> 会在设备面板中替换为真实设备地址。</div>

    <div class="section-title custom-title">自定义 Topic</div>
    <el-button-group style="margin-bottom:12px;">
      <el-button size="small" type="primary" icon="el-icon-plus" @click="openTopicDialog">新增 Topic</el-button>
    </el-button-group>

    <el-table :data="topicList" stripe size="small">
      <el-table-column prop="title" align="left" label="名称" min-width="140" />
      <el-table-column prop="topic" align="left" label="Topic 模板" min-width="260">
        <template slot-scope="{ row }">
          <code class="topic-code">{{ row.topic }}</code>
        </template>
      </el-table-column>
      <el-table-column prop="action" align="center" label="动作" width="110">
        <template slot-scope="{ row }">
          <el-tag :type="row.action === 'publish' ? 'success' : ''" size="mini" effect="plain">
            {{ actionLabel(row.action) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="desc" align="left" label="说明" min-width="180" show-overflow-tooltip>
        <template slot-scope="{ row }">{{ row.desc || '—' }}</template>
      </el-table-column>
      <el-table-column align="center" label="操作" width="140">
        <template slot-scope="{ row }">
          <el-button size="mini" type="text" icon="el-icon-edit" @click="editTopic(row)">编辑</el-button>
          <el-button size="mini" type="text" icon="el-icon-delete" style="color:red;" @click="confirmDelTopic(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="tip-bar">
      <i class="el-icon-info"></i>
      Topic 模板中必须包含 <code>{addr}</code> 占位符，实际使用时会自动替换为设备地址（addr）。
    </div>

    <el-dialog :title="isCreate ? '新增 Topic' : '编辑 Topic'" :visible.sync="open" width="520px">
      <el-form ref="form" :rules="rules" :model="form" label-position="top">
        <el-form-item label="名称" prop="title">
          <el-input v-model="form.title" placeholder="如：自定义数据上报" />
        </el-form-item>
        <el-form-item label="Topic 模板" prop="topic">
          <el-input v-model.trim="form.topic" placeholder="如：tmp/{addr}/aaaa/#" />
          <div class="form-tip">必须包含 {addr}，使用时替换为设备地址</div>
        </el-form-item>
        <el-form-item label="动作" prop="action">
          <el-radio-group v-model="form.action" size="small">
            <el-radio-button label="subscribe">订阅</el-radio-button>
            <el-radio-button label="publish">发布</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="说明" prop="desc">
          <el-input v-model="form.desc" type="textarea" :rows="2" placeholder="选填，用于说明该 Topic 的用途" />
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button size="mini" @click="open = false">取消</el-button>
        <el-button size="mini" type="primary" @click="done">确定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { updateObject, getObject } from "@/api/iot/table";

export default {
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
    const checkTopic = (rule, value, callback) => {
      if (!value) {
        callback(new Error('Topic 模板不能为空'));
        return;
      }
      if (String(value).indexOf('{addr}') === -1) {
        callback(new Error('Topic 必须包含 {addr} 占位符'));
        return;
      }
      callback();
    };
    return {
      open: false,
      isCreate: true,
      form: { action: 'subscribe' },
      // 系统内置 Topic（与设备面板保持一致，只读展示）
      builtinTopics: [
        { topic: 'd/out/{addr}', action: 'publish', desc: '设备上报到平台（MQTT 接入）' },
        { topic: 'd/in/{addr}', action: 'subscribe', desc: '平台下发给设备，设备订阅（MQTT 接入）' },
        { topic: 'p/out/{addr}', action: 'publish', desc: '平台发布设备上行消息' },
        { topic: 's/out/{project}/{scene}/{addr}', action: 'publish', desc: '场景发布设备上行消息' },
        { topic: 'p/in', action: 'subscribe', desc: '平台订阅，如设备控制、数据同步' }
      ],
      topicList: [],
      editOrigin: undefined,
      rules: {
        title: [
          { required: true, message: '名称不能为空', trigger: 'blur' }
        ],
        topic: [
          { required: true, message: 'Topic 模板不能为空', trigger: 'blur' },
          { validator: checkTopic, trigger: 'blur' }
        ],
        action: [
          { required: true, message: '请选择动作', trigger: 'change' }
        ]
      }
    };
  },
  created() {
    this.load();
  },
  methods: {
    // 兼容 JSON 字符串 / 数组两种存储形式
    parseTopics(raw) {
      if (!raw) return [];
      if (Array.isArray(raw)) return raw;
      try {
        const arr = JSON.parse(raw);
        return Array.isArray(arr) ? arr : [];
      } catch (e) {
        return [];
      }
    },
    load() {
      getObject(this.table, this.id).then(response => {
        const o = response.data || {};
        // 后端产品表字段名为 topic（单数），这里存放自定义 Topic 列表 JSON
        this.topicList = this.parseTopics(o.topic);
      });
    },
    actionLabel(a) {
      return a === 'publish' ? '发布' : '订阅';
    },
    openTopicDialog() {
      this.isCreate = true;
      this.editOrigin = undefined;
      this.form = { title: '', topic: '', action: 'subscribe', desc: '' };
      this.open = true;
      this.$nextTick(() => {
        if (this.$refs.form) this.$refs.form.clearValidate();
      });
    },
    editTopic(row) {
      this.isCreate = false;
      this.editOrigin = row;
      this.form = Object.assign({}, row);
      this.open = true;
    },
    confirmDelTopic(row) {
      this.$modal.confirm(`确认删除 Topic「${row.title}」？`).then(() => {
        const next = this.topicList.filter(item => item !== row);
        this.save(next, '删除成功!', () => {
          this.topicList = next;
        });
      }).catch(() => {});
    },
    done() {
      this.$refs["form"].validate(valid => {
        if (!valid) return;
        const topic = String(this.form.topic).trim();
        // 排除编辑中的自身，Topic 模板不允许重复
        const dup = this.topicList.some(item => item.topic === topic && item !== this.editOrigin);
        if (dup) {
          this.$modal.msgError('该 Topic 模板已存在，请更换');
          return;
        }
        const row = {
          title: (this.form.title || '').trim(),
          topic: topic,
          action: this.form.action || 'subscribe',
          desc: (this.form.desc || '').trim()
        };
        const next = this.topicList.slice();
        const idx = next.indexOf(this.editOrigin);
        if (!this.isCreate && idx !== -1) {
          next.splice(idx, 1, row);
        } else {
          next.push(row);
        }
        this.save(next, this.isCreate ? '创建成功!' : '更新成功!', () => {
          this.topicList = next;
          this.open = false;
        });
      });
    },
    save(topicList, successMsg, callback) {
      const data = {
        id: this.id,
        topic: JSON.stringify(topicList)
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
.section-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--ui-text-primary);
  margin-bottom: 12px;
  padding-left: 8px;
  border-left: 3px solid #409EFF;
}
.custom-title {
  margin-top: 24px;
}
.builtin-table {
  margin-bottom: 4px;
}
.topic-code {
  font-family: 'SF Mono', 'Menlo', 'Consolas', monospace;
  font-size: 12px;
  color: var(--ui-text-primary);
}
.form-tip {
  font-size: 12px;
  color: var(--ui-text-tertiary);
  line-height: 1.5;
  margin-top: 4px;
}
.tip-bar {
  margin-top: 12px;
  padding: 8px 12px;
  font-size: 12px;
  color: var(--ui-text-secondary);
  background: var(--ui-surface-2);
  border: 1px solid var(--ui-border);
  border-radius: 8px;
  line-height: 1.6;
  code {
    font-family: 'SF Mono', 'Menlo', 'Consolas', monospace;
    color: #409EFF;
  }
}
</style>
