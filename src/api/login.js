import request from '@/utils/request'
import {getProject} from "@/api/iot/system";

// 登录方法
export function login(username, password, code, uuid) {
  const data = {
    username,
    password,
    code,
    uuid
  }
  return request({
    url: '/login',
    headers: {
      isToken: false
    },
    method: 'post',
    data: data
  })
}

// 注册方法
export function register(data) {
  return request({
    url: '/register',
    headers: {
      isToken: false
    },
    method: 'post',
    data: data
  })
}

// 获取用户详细信息
export function getInfo() {
  return request({
    url: '/getInfo',
    method: 'get'
  })
}

// 退出方法
export function logout() {
  return request({
    url: '/logout',
    method: 'post'
  })
}

// 获取站点信息
export function siteInfo(project) {
  return request({
    url: '/siteInfo',
    headers: {
      isToken: false
    },
    method: 'get',
    params: { project: getProject(project) },
    timeout: 20000
  })
}
