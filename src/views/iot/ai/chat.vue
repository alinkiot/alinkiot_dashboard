<template>
  <div class="app-container">
    <div class="dify-chat">
      <div class="dify-main" v-loading="isLoadingAgent">
        <!-- 聊天容器 -->
        <ChatContainer
          ref="chatContainer"
          :messages="messages"
          :is-loading-messages="isLoadingMessages"
          :loading="loading"
          :is-select="isSelect"
          :sender-value="senderValue"
          :uploaded-files="uploadedFiles"
          :map-file-type="mapFileType"
          :agent-info="agentInfo"
          @edit-message="handleEditMessage"
          @retry-message="handleRetryMessage"
          @update-feedback="handleUpdateFeedback"
          @prompt-click="handlePromptItemClick"
          @update-workflow-active="handleUpdateWorkflowActive"
          @update-node-active="handleUpdateNodeActive"
          @send="handleSendMessage"
          @stop="handleStopMessage"
          @file-upload="handleFileUpload"
          @delete-file="handleDeleteUploadedFile"
          @update:is-select="value => (isSelect = value)"
          @update:sender-value="value => (senderValue = value)"
        />
      </div>
      <!-- 隐藏的文件上传输入框 -->
      <input
        ref="fileInput"
        type="file"
        style="display: none"
        @change="handleFileInputChange"
      />
    </div>
  </div>
</template>

<script>
import { sendMixin, streamMixin } from 'vue-element-ui-x';

// 导入新组件
import ChatContainer from './components/ChatContainer.vue';

// 导入mixins
import conversationMixin from './mixins/conversationMixin';
import fileMixin from './mixins/fileMixin';
import messageMixin from './mixins/messageMixin';
import responsiveMixin from './mixins/responsiveMixin';

export default {
  name: 'alinkiotChat',
  components: {
    ChatContainer,
  },
  mixins: [sendMixin, streamMixin, responsiveMixin, conversationMixin, messageMixin, fileMixin],

  data() {
    return {
      // 主组件特有的数据
      loading: false,
    };
  },

  async mounted() {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    await this.loadConversations();
  },

  beforeDestroy() {
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
  },

  methods: {
    // 触发文件上传选择
    handleFileUpload() {
      this.$refs.fileInput.click();
    },

    // 处理文件输入框变化
    handleFileInputChange(event) {
      const file = event.target.files[0];
      if (file) {
        // 调用fileMixin的handleFileChange方法
        this.handleFileChange(file);
      }
      // 清空文件输入
      event.target.value = '';
    },
  },
};
</script>

<style lang="scss" scoped>
@import './assets/index.scss';

.dify-chat {
  height: 80vh;
  overflow: hidden;

  .dify-main {
    display: flex;
    height: 80vh;
  }
}
</style>
