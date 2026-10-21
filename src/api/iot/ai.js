import request from '@/utils/request';
import { createChatRequest } from '@/utils/request'
import store from '@/store'

/**
 * 消息管理API
 */
export const messageApi = {

  chatMessage(self, agentId, body) {
    console.log('chat message');
    createChatRequest(self,  `/ai/${agentId}/chat-messages`, body);
  },

  // 停止响应
  stopMessage(taskId) {
    return request.post(`/ai/chat-messages/${taskId}/stop`, {
    });
  },

  // 消息反馈
  feedbackMessage(messageId, rating, content = '') {
    return request.post(`/ai/feedbacks`, {
      messageId,
      rating, // 'like' | 'dislike' | null
      content
    });
  },

  // 获取建议问题
  getAgent(agentId) {
    return request.get(`/ai/agent`, {
      params: {
        agentId
      }
    });
  },
};

/**
 * 文件上传API
 */
export const fileApi = {
  // 上传文件
  uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('user', store.getters.name);

    return request.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// 默认导出所有API
export default {
  message: messageApi,
  file: fileApi,
};
