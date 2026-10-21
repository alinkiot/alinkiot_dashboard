
export default {
  data() {
    return {
      // 会话相关
      conversationList: [],
      activeConversation: null,
      isLoadingConversations: false,
      isCreatingChat: false,
      customMenu: [
        {
          label: '修改名称',
          key: 'rename',
          icon: 'el-icon-edit',
          command: 'rename',
        },
        {
          label: '删除',
          key: 'delete',
          icon: 'el-icon-delete',
          command: 'delete',
          menuItemHoverStyle: {
            color: '#F56C6C',
            backgroundColor: 'rgba(245, 108, 108, 0.1)',
          },
        },
      ],
    };
  },
  computed: {

  },
  methods: {
    // 加载会话列表
    async loadConversations() {
      try {
        this.isLoadingConversations = true;
        // todo 不需要会话列表
      } catch (error) {
        this.$message.error('加载会话列表失败: ' + error.message);
      } finally {
        this.isLoadingConversations = false;
      }
    },

    // 新建对话
    async handleNewChat() {
      try {
        this.isCreatingChat = true;
        // 重置当前状态
        this.activeConversation = null;
        this.messages = [];
        this.senderValue = '';
        this.uploadedFiles = [];
      } catch (error) {
        this.$message.error('创建新对话失败: ' + error.message);
      } finally {
        this.isCreatingChat = false;
      }
    }

  },
};
