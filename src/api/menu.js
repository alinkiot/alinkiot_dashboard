import request from '@/utils/request'

// 获取路由
export const getRouters = (project) => {
  return request({
    url: '/getRouters',
    method: 'get',
    params: { project : project }
  })
}
