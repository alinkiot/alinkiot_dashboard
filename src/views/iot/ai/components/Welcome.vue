<template>
  <div>
    <el-x-welcome
      variant="borderless"
      :title="agentInfo.title"
      :description="agentInfo.description"
    >
    </el-x-welcome>
    <br v-if="!isMobile" />
    <el-x-prompts
      v-if="!isMobile"
      :items="agentInfo.suggested"
      :wrap="true"
      :styles="promptStyles"
      @on-item-click="handlePromptItemClick"
    >
      <template v-slot:icon="{ item }">
        <i
          :class="item.icon"
          :style="item.iconStyle"
        ></i>
      </template>
    </el-x-prompts>
  </div>
</template>

<script>
  export default {
    name: 'Welcome',
    components: {

    },
    props: {
      agentInfo: {
        type: Object,
        default: () => {
          return {
            title: 'AlinkIOT AI 助手',
            description: '我是您的智能助手，请告诉我您需要什么帮助！',
            suggestedQuestions:[]
          };
        },
      }
    },
    computed: {
      isMobile() {
        return window.innerWidth <= 767;
      }
    },
    data() {
      return {
        promptStyles: {
          item: {
            flex: 'none',
            backgroundImage: 'linear-gradient(137deg, #f0f7ff 0%, #edf1ff 100%)',
            border: '0',
            width: 'calc(50% - 6px)',
          },
          subItem: {
            background: 'rgba(255,255,255,0.6)',
            border: '1px solid #e6efff',
          },
        },
      };
    },
    mounted() {
      console.log(this.agentInfo);
      window.addEventListener('resize', this.handleResize);
    },
    beforeDestroy() {
      window.removeEventListener('resize', this.handleResize);
    },
    methods: {
      handlePromptItemClick({ data }) {
        this.$emit('click-prompt', data);
      },
      handleResize() {
        this.$forceUpdate();
      },
    },
  };
</script>

<style lang="scss" scoped>
  // 移动端微调 (<768px)
  @media screen and (max-width: 767px) {
    ::v-deep .el-x-prompts {
      padding: 0 20px;
      .el-x-prompts-list {
        gap: 8px;
      }
      .el-x-prompts-list-vertical {
        .el-x-prompts-item {
          width: 100% !important;
          // width: calc(100% - 8px) !important; // 移动端单列布局
          margin-bottom: 8px !important;
          padding: 14px 16px !important;

          .el-x-prompts-content {
            gap: 6px !important;
          }

          .el-x-prompts-label {
            font-size: 15px !important;
            line-height: 1.4 !important;
          }

          .el-x-prompts-desc {
            font-size: 13px !important;
            line-height: 1.3 !important;
          }
        }
      }
    }
  }
</style>
