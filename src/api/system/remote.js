import request from '@/utils/request'

// 查看远程调试状态（是否启动、令牌、到期时间）
export function getRemoteStatus() {
  return request({
    url: '/system/remote/status',
    method: 'get'
  })
}

// 启动远程调试，生成随机令牌，hours 为有效小时数
export function startRemote(hours) {
  return request({
    url: '/system/remote/start',
    method: 'post',
    data: { hours }
  })
}

// 停止远程调试，令牌立即失效
export function stopRemote() {
  return request({
    url: '/system/remote/stop',
    method: 'post'
  })
}
