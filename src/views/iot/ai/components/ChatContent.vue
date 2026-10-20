<template>
  <div class="chat-content">
    <div
      class="chat-content-welcome"
      v-if="messages.length === 0"
    >
      <welcome
        :agent-info="agentInfo"
        @click-prompt="$emit('prompt-click', $event)" />
    </div>

    <el-x-bubble-list
      ref="bubbleListRef"
      :list="messages"
      :max-height="`calc(100vh - 160px)`"
      :defaultMaxWidth="'100%'"
      defaultShape="corner"
      v-loading="isLoadingMessages"
    >
      <template #header="{ item }">
        <bubble-list-header
          :item="item"
          :map-file-type="mapFileType"
          @update-workflow-active="handleUpdateWorkflowActive"
          @update-node-active="handleUpdateNodeActive"
        />
      </template>
      <template #content="{ item }">
        <el-x-typewriter
          v-if="item.content && item.placement === 'start'"
          :content="item.content"
          :md-plugins="mdPlugins"
          :typing="item.typing"
          :is-markdown="item.isMarkdown"
        />
        <div
          v-if="item.content && item.placement === 'end'"
          class="user-content"
          style="white-space: pre-wrap"
        >
          {{ item.content }}
        </div>
      </template>
      <template #footer="{ item }">
        <bubble-list-footer
          :item="item"
          :messages="messages"
          @edit-message="$emit('edit-message', $event)"
          @retry-message="$emit('retry-message', $event)"
          @update-feedback="$emit('update-feedback', $event)"
        />
      </template>
    </el-x-bubble-list>

  </div>
</template>

<script>
// import markdownItMermaidPlugin from '../utils/markdownMermaidPlugin';
// import 'katex/dist/katex.min.css';
// import markdownItKatex from 'markdown-it-katex';
import BubbleListFooter from './BubbleListFooter.vue';
import BubbleListHeader from './BubbleListHeader.vue';
import Welcome from './Welcome.vue';
export default {
  name: 'ChatContent',
  components: {
    BubbleListHeader,
    BubbleListFooter,
    Welcome,
  },
  props: {
    messages: {
      type: Array,
      default: () => [],
    },
    isLoadingMessages: {
      type: Boolean,
      default: false,
    },
    mapFileType: {
      type: Function,
      required: true,
    },
    agentInfo: {
      type: Object,
      default: () => {},
    }
  },
  data() {
    return { mdPlugins: [
        // markdownItMermaidPlugin,
        // markdownItKatex
      ] };
  },
  methods: {

    handleUpdateWorkflowActive(data) {
      this.$emit('update-workflow-active', data);
    },

    handleUpdateNodeActive(data) {
      this.$emit('update-node-active', data);
    },
  },
};
</script>

<style lang="scss" scoped>
.chat-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  padding: 0 0 15px 0;

  .chat-content-welcome {
    width: 100%;
    margin: auto;
    height: 100%;
    //display: flex;
    align-items: center;
    justify-content: center;
  }

  ::v-deep .el-x-bubble-list {
    .el-x-bubble.el-x-bubble-start {
      .el-x-bubble-content-wrapper {
        .el-x-bubble-header,
        .el-x-bubble-content:not(.el-x-bubble-content-loading) {
          width: 100%;
        }
        .el-x-bubble-footer {
          .end-action,
          .start-action {
            display: flex;
            gap: 10px;
            align-items: center;
            opacity: 0;
            transition: opacity 0.2s ease;
            .action-btn {
              cursor: pointer;
            }
          }
        }
      }

      // 鼠标悬停时显示footer
      &:hover {
        .el-x-bubble-content-wrapper {
          .el-x-bubble-footer {
            .start-action {
              opacity: 1;
            }
          }
        }
      }
    }
    .el-x-bubble.el-x-bubble-end {
      &:hover {
        .el-x-bubble-content-wrapper {
          .el-x-bubble-footer {
            .end-action {
              opacity: 1;
            }
          }
        }
      }
    }
  }
}

@media (max-width: 767px) {
  .chat-content {
    padding: 16px 0;

    .chat-content-welcome {
      padding: 0;
    }
  }
}
</style>
