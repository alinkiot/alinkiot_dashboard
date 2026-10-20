<template>
  <div class="topic-board">
    <div class="section">
      <div class="section-header">
        <el-radio-group v-model="activeProtocol" size="mini">
          <el-radio-button label="mqtt">MQTT 接入</el-radio-button>
          <el-radio-button label="tcp">TCP 透传接入</el-radio-button>
        </el-radio-group>
      </div>

      <div class="auth-group">
        <div class="auth-block" v-for="block in authBlocks" :key="block.key">
          <div class="auth-block-head">
            <div class="auth-block-title">{{ block.title }}</div>
            <el-button
              v-if="block.configured"
              class="copy-all-btn"
              type="text"
              size="mini"
              icon="el-icon-document-copy"
              v-clipboard:copy="block.text"
              v-clipboard:success="onCopySuccess"
            >复制全部</el-button>
          </div>
          <template v-if="block.configured">
            <div class="credential-row" v-for="item in block.credentials" :key="item.label">
              <span class="credential-label">{{ item.label }}</span>
              <code class="credential-value">{{ item.value }}</code>
              <el-button
                class="copy-btn"
                icon="el-icon-document-copy"
                type="text"
                size="mini"
                v-clipboard:copy="item.value"
                v-clipboard:success="onCopySuccess"
              />
            </div>
          </template>
          <div v-else class="auth-placeholder">
            <i class="el-icon-key auth-placeholder__icon" />
            <span class="auth-placeholder__text">
              {{ block.emptyText }}
              <el-button
                v-if="block.jump"
                type="text"
                size="mini"
                class="auth-placeholder__link"
                @click="block.jump"
              >前往产品详情中设置</el-button>
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-header">
        <span class="section-title">订阅/发布 Topic</span>
      </div>
      <el-table :data="tabTopic" size="small" class="topic-table">
        <el-table-column prop="topic" label="Topic" min-width="240">
          <template slot-scope="{ row }">
            <code class="topic-value">{{ row.topic }}</code>
            <el-button
              class="copy-btn"
              icon="el-icon-document-copy"
              type="text"
              size="mini"
              v-clipboard:copy="row.topic"
              v-clipboard:success="onCopySuccess"
            />
          </template>
        </el-table-column>
        <el-table-column prop="action" label="动作" width="100">
          <template slot-scope="{ row }">
            <el-tag
              :type="row.action === 'publish' ? 'success' : ''"
              size="mini"
              effect="plain"
            >{{ row.action }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="desc" label="说明" min-width="180" />
      </el-table>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    device: {
      type: Object,
      default: () => ({})
    },
    product: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      activeProtocol: 'mqtt',
      tabTopic: []
    };
  },
  computed: {
    deviceCredentials() {
      if (this.activeProtocol === 'mqtt') {
        return [
          { label: 'ClientID', value: `uzy_1_${this.device.addr}` },
          { label: 'Username', value: this.device.dk },
          { label: 'Password', value: this.device.ds }
        ];
      }
      return [
        { label: '注册报文', value: `reg,1,${this.device.addr},${this.device.dk},${this.device.ds}\\r\\n` },
        { label: '心跳', value: 'ping\\r\\n' }
      ];
    },
    productCredentials() {
      if (this.activeProtocol === 'mqtt') {
        return [
          { label: 'ClientID', value: `uzy_2_${this.device.addr}` },
          { label: 'Username', value: this.product.pk },
          { label: 'Password', value: this.product.ps }
        ];
      }
      return [
        { label: '注册报文', value: `reg,2,${this.device.addr},${this.product.pk},${this.product.ps}\\r\\n` },
        { label: '心跳', value: 'ping\\r\\n' }
      ];
    },
    deviceCredentialsText() {
      return this.deviceCredentials.map(c => `${c.label}: ${c.value}`).join('\n');
    },
    productCredentialsText() {
      return this.productCredentials.map(c => `${c.label}: ${c.value}`).join('\n');
    },
    authBlocks() {
      const deviceConfigured = !!(this.device.dk && this.device.ds);
      const productConfigured = !!(this.product.pk && this.product.ps);
      const blocks = [
        {
          key: 'device',
          title: '一机一密',
          configured: deviceConfigured,
          credentials: this.deviceCredentials,
          text: this.deviceCredentialsText,
          emptyText: '未设置设备 Key 和密钥，请在设备详情中设置'
        },
        {
          key: 'product',
          title: '一型一密',
          configured: productConfigured,
          credentials: this.productCredentials,
          text: this.productCredentialsText,
          emptyText: '未设置产品 Key 和密钥',
          jump: productConfigured ? null : this.goProductSetting
        }
      ];
      // 有配置的排前面，未配置的靠后（保持原相对顺序）
      return blocks.slice().sort((a, b) => (b.configured === a.configured ? 0 : (b.configured ? 1 : -1)));
    }
  },
  created() {
    this.updateTopic();
  },
  methods: {
    onCopySuccess() {
      this.$message({ message: '已复制到剪贴板', type: 'success', duration: 1500 });
    },
    goProductSetting() {
      const project = this.$route.params.project;
      const path = (project ? '/' + project : '') + '/device/productEdit';
      this.$router.push({
        path,
        query: { id: this.product.id, tab: 'baseInfo' }
      });
    },
    updateTopic() {
      const addr = this.device.addr || '${addr}';
      const project = this.project || '${projectId}';
      const scene = this.scene || '${sceneId}';
      const topics = [];
      // d/out、d/in 为 MQTT 设备特有，仅 MQTT 接入时展示
      if (this.activeProtocol === 'mqtt') {
        topics.push(
          { topic: `d/out/${addr}`, action: 'publish', desc: '设备上报到平台' },
          { topic: `d/in/${addr}`, action: 'subscribe', desc: '平台下发给设备，设备订阅' }
        );
      }
      topics.push(
        { topic: `p/out/${addr}`, action: 'publish', desc: '平台发布设备上行消息' },
        { topic: `s/out/${project}/${scene}/${addr}`, action: 'publish', desc: '场景发布设备上行消息' },
        { topic: 'p/in', action: 'subscribe', desc: '平台订阅，如设备控制，数据同步' }
      );
      this.tabTopic = topics;
    }
  },
  watch: {
    'device.addr'() {
      this.updateTopic();
    },
    activeProtocol() {
      this.updateTopic();
    }
  }
};
</script>

<style lang="scss" scoped>
.topic-board {
  padding: 4px 0;

  .section {
    margin-bottom: 28px;
    &:last-child {
      margin-bottom: 0;
    }
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
  }

  .section-title {
    font-size: 15px;
    font-weight: 600;
  }

  .auth-group {
    display: flex;
    gap: 24px;

    .auth-block {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
    }
  }

  .auth-block-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
    min-height: 24px;
  }

  .auth-block-title {
    font-size: 13px;
    font-weight: 500;
    opacity: 0.5;
  }

  .copy-all-btn {
    flex-shrink: 0;
    padding: 0;
  }

  .credential-row {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    border-radius: 6px;
    margin-bottom: 4px;
    background: var(--credential-bg, rgba(0, 0, 0, 0.03));

    .credential-label {
      font-size: 12px;
      font-weight: 500;
      min-width: 64px;
      flex-shrink: 0;
      opacity: 0.5;
    }

    .credential-value {
      flex: 1;
      font-family: 'SF Mono', 'Menlo', 'Consolas', monospace;
      font-size: 12px;
      word-break: break-all;
      padding: 0 10px;
      background: none;
      border: none;
      color: inherit;
    }

    .copy-btn {
      flex-shrink: 0;
      opacity: 0;
      transition: opacity 0.15s;
      padding: 4px;
    }

    &:hover .copy-btn {
      opacity: 1;
    }
  }

  .auth-placeholder {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 96px;
    padding: 20px 12px;
    border: 1px dashed var(--placeholder-border, rgba(0, 0, 0, 0.12));
    border-radius: 8px;
    background: var(--placeholder-bg, rgba(0, 0, 0, 0.015));

    &__icon {
      font-size: 24px;
      opacity: 0.3;
    }

    &__text {
      font-size: 12px;
      opacity: 0.45;
    }

    &__link {
      padding: 0;
      margin-left: 4px;
      font-size: 12px;
      vertical-align: baseline;
    }
  }

  .topic-table {
    &::before {
      display: none;
    }
  }

  .topic-value {
    font-family: 'SF Mono', 'Menlo', 'Consolas', monospace;
    font-size: 12px;
    background: none;
    border: none;
    padding: 0;
    color: inherit;
  }

  .copy-btn {
    opacity: 0.4;
    padding: 4px;
    &:hover {
      opacity: 1;
    }
  }
}
</style>

<style lang="scss">
.theme-dark,
.theme-dark-blue,
.theme-green {
  .topic-board {
    .credential-row {
      background: rgba(255, 255, 255, 0.05);
    }
    .auth-placeholder {
      border-color: rgba(255, 255, 255, 0.14);
      background: rgba(255, 255, 255, 0.03);
    }
  }
}
</style>
