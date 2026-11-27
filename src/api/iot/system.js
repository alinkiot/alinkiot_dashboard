import request from '@/utils/request'
import VueAMap from "vue-amap";

export function getProject(project) {
  if(!project){
    return undefined
  }
  const fields = project.match(/p-([a-zA-Z0-9]+)/)
  if(fields && fields.length ===2 ){
    return fields[1];
  }else{
    return undefined
  }
}

export function toProject(project){
  return 'p-' + project;
}

export function get_permission() {
    return request({
        url: '/permission',
        method: 'get'
    })
}

export function get_phoneCode(phone) {
    return request({
        url: '/system/user/phone/code',
        method: 'get',
        params: { phone : phone }
    })
}

export function phoneLogin(data) {
    return request({
        url: '/system/user/phone/login',
        method: 'post',
        data: data
    })
}

export function kickDevice(data) {
    return request({
        url: '/system/device/kick',
        method: 'post',
        data: data
    })
}

export function deviceControl(Addr, cmd) {
  return request({
    url: '/system/device/control?addr=' + Addr,
    method: 'post',
    data: cmd
  })
}

//应用数据同步 event: "deviceEvent" | "baseData"
export function syncApp(Id, Event) {
    return request({
        url: '/system/app/sync',
        method: 'post',
        data: { id : Id, event: Event }
    })
}

export function queryDeviceLog(params) {
    return request({
        url: '/system/device/log/list',
        method: 'get',
        params: params
    })
}

export function mapInit(that) {
  const str = that.$store.state.settings.siteInfo.map
  const config = str ? JSON.parse(str) : undefined;
  const l_key = config ? config.key : "98570db9dc454af7197cbec15dba6835";
  const l_securityJsCode = config ? config.securityJsCode : 'c2d87d0572c13a02cefe5fd3405275aa';
  VueAMap.initAMapApiLoader({
    key: l_key,
    plugin: ['AMap.Autocomplete', 'AMap.Geocoder', 'AMap.PlaceSearch', 'AMap.Scale', 'AMap.OverView', 'AMap.ToolBar', 'AMap.MapType', 'AMap.PolyEditor', 'AMap.CircleEditor'],
    v: '1.4.4' // 默认高德 sdk 版本为 1.4.4
  });
  window._AMapSecurityConfig = {
    securityJsCode: l_securityJsCode
  };
}
