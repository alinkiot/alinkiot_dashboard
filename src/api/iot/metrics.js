import request from '@/utils/request'

export function get_dashboard_info(params) {
  return request({
    url: '/system/dashboard/info',
    method: 'get',
    params: params
  })
}

export function get_nodes(params) {
  return request({
    url: '/nodes',
    method: 'get',
    params: params
  })
}

export function get_brokers(params) {
  return request({
    url: '/brokers',
    method: 'get',
    params: params
  })
}

export function get_stats(params) {
  return request({
    url: '/stats',
    method: 'get',
    params: params
  })
}

export function get_listen(params) {
  return request({
    url: '/listeners',
    method: 'get',
    params: params
  })
}

export function get_device(params) {
  return request({
    url: '/system/metrics/device',
    method: 'get',
    params: params
  })
}

export function get_stats_info(params) {
  return request({
    url: '/system/metrics/statsInfo',
    method: 'get',
    params: params
  })
}

export function get_alarm(params) {
  return request({
    url: '/system/metrics/alarm',
    method: 'get',
    params: params
  })
}
