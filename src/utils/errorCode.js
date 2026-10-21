import {Notification} from "element-ui";

export default {
    '401': '认证失败，无法访问系统资源',
    '403': '当前操作没有权限',
    '404': '访问资源不存在',
    'default': '系统未知错误，请反馈给管理员'
}

export function formatError(res, msg) {
    const url = res.request.responseURL;
    if (msg.message) {
        return formatError(msg.message);
    } else if (msg.match(/Duplicate entry '(.+)' for key '(.+)'/)) {
        const fields = msg.match(/Duplicate entry '(.+)' for key '(.+)'/);
        return '数据库已经存在 ' + fields[1] + '！';
    } else if (msg.match(/Unknown column '(.+)'/g)) {
      const fields = msg.match(/Unknown column '(.+)'/g);
      return '未知字段' + fields[1] + '!';
    } else if (msg.match(/access_token not found/g)) {
        return '微信接口禁止访问！';
    } else if (msg.match(/function_clause/g)) {
        return '服务器内部错误！';
    } else if(msg.match(/disconnect/g)) {
        return '数据库未连接！';
    } else if(msg.match(/You have an error in your SQL/g)){
        return 'SQL语法错误！';
    } else if(msg.match(/Table does not exist/g)){
        return '数据表不存在';
    } else if(msg.match(/Server Internal Error/g)){
      return '服务器内部错误！';
    } else if(msg.match(/Importing data offline is not supported by this device/g)){
      return '该设备不支持离线数据导入！';
    } else if(msg.match(/Field '(.+)' doesn't have a default value/)){
      const fields = msg.match(/Field '(.+)' doesn't have a default value/);
      return '字段 (' + fields[1] + ') 缺少默认值';
    } else if(msg.match(/未找到该id/)){
      if(url.match(/\/system\/.+\/\d+/)){
        const fields = url.match(/\/system\/(.+)\/(\d+)/);
        console.log('error', fields);
        return false;
      }
    } else if(msg.match(/not in whitelist rid:/g)){
      return '微信登录暂不支持，非法IP';
    } else if(/.+siteInfo\?project=.+/.test(url)){
      // const arr = url.match(/.+siteInfo\?project=(.+)/);
      // Notification.error({
      //   title: '站点（' + arr[1] + '）不存在！'
      // })
      window.location.replace("/404")
      return false;
    }
    return msg;
}
