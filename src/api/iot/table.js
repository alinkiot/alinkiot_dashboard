import request from '@/utils/request'
import { buildBuiltinThemeConfigRows } from '@/utils/builtinThemes'

// 查询列表
export function queryObject(table, query) {
  if(table ==='sceneDevice'){
    return queryDevByScene(query);
  }else if(table === 'config' && query && query.configKey === 'layout_setting'){
    // 默认主题选择器：在后端返回的自定义主题基础上，合并前端内置的默认主题
    return request({
      url: '/system/'+table+'/list',
      method: 'get',
      params: query
    }).then(response => mergeBuiltinThemes(response));
  }else{
    return request({
      url: '/system/'+table+'/list',
      method: 'get',
      params: query
    })
  }
}

// 将内置主题合并进 layout_setting 列表（内置在前，后端同款按 configName 覆盖内置）
function mergeBuiltinThemes(response) {
  const builtin = buildBuiltinThemeConfigRows();
  const backendRows = (response && Array.isArray(response.rows)) ? response.rows : [];
  const backendNames = new Set(backendRows.map(r => r.configName));
  const mergedBuiltin = builtin.filter(b => !backendNames.has(b.configName));
  const rows = [...mergedBuiltin, ...backendRows];
  return {
    ...response,
    rows: rows,
    total: rows.length
  };
}

// 查询详细
export function getObject(table, id) {
  // 默认主题选择器回显：内置主题 id 直接本地返回，不走后端
  if(table === 'config' && typeof id === 'string' && id.indexOf('builtin-theme-') === 0){
    const builtin = buildBuiltinThemeConfigRows().find(r => r.configId === id);
    if(builtin){
      return Promise.resolve({ code: 200, data: builtin });
    }
  }
  return request({
    url: '/system/'+table+'/' + id,
    method: 'get'
  })
}

// 新增
export function createObject(table, data) {
  return request({
    url: '/system/' + table,
    method: 'post',
    data: data
  })
}

// 修改
export function updateObject(table, data) {
  return request({
    url: '/system/' + table,
    method: 'put',
    data: data
  })
}

// 删除
export function delObject(table, id) {
  return request({
    url: '/system/'+table+'/' + id,
    method: 'delete'
  })
}

// 导入
export function importData(table, data) {
  return request({
    url: '/system/import/' + table,
    method: 'post',
    data: data
  })
}

// 导入
export function importData2(key, data) {
  return request({
    url: '/importData?key=' + key,
    method: 'post',
    data: JSON.stringify({data: data})
  })
}

// 查询设备状态
export function queryDevStatus(devs) {
  const query = {addr : devs};
  return request({
    url: '/system/device/online',
    method: 'get',
    params: query
  })
}

// 查询设备最后状态
export function getDevHisLast(query) {
  return request({
    url: '/system/device/history/last',
    method: 'get',
    params: query
  })
}

// 查询子设备列表
export function getDevChildren(query) {
  return request({
    url: '/system/device/children',
    method: 'get',
    params: query
  })
}

// 查询网关设备
export function getGateway(addr){
  return new Promise(function(resolve, reject){
    queryObject('sub_device', {addr: addr}).then(response => {
      const data = response.data[0];
      if(data){
        queryObject('device', {addr: data.gateway}).then(response => {
          const device = response.data[0];
          if(device){
            device.subAddr = data.subAddr;
            resolve(device);
          }else{
            resolve()
          }
        })
      }else{
        resolve()
      }
    })
  })
}

// 根据场景查询设备
export function queryDevByScene(query){
  return new Promise(function(resolve, reject){
    queryObject('scene_device', query).then(response => {
      const total = response.total;
      const rows = response.rows;
      const ids = [];
      rows.map(i => {
        ids.push(i.device)
      });
      const tabList = [];
      if(ids.length > 0){
        getObject('device', ids.join(',')).then(response => {
          let devices = [];
          if(Array.isArray(response.data)){
            devices = response.data;
          }else{
            devices.push(response.data)
          }
          rows.map(route => {
            const arr = devices.filter(device => { return device.id === route.device });
            const device = arr.length > 0 ? arr[0] : {};
            device.scene = route.scene;
            device.route = route.id;
            tabList.push(device);
          });
          resolve({ total : total, rows : tabList });
        })
      } else{
        resolve({ total : 0, rows : [] })
      }
    });
  });
}

// 获取直播视频流
export function getCameraLive(query) {
  return request({
    url: '/system/device/camera/live',
    method: 'get',
    params: query
  })
}
