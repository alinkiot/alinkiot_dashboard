import dayjs from "dayjs";

export function randomString(len) {
    let t = "ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678",
        a = t.length,
        n = "";
    for (let i = 0; i < len; i++)
        n += t.charAt(Math.floor(Math.random() * a));
    return n
}

export function getValue(o, key, d){
    let result = undefined;
    for(let i in o) {
        if (i.toLowerCase() === key.toLowerCase()) {
            result = o[i];
            break;
        }
    }
    return result || result ===0 ? result : d;

}

export function validate2Check(rule, value, callback) {
  const field = rule.fullField;
  const regx = /^[0-9a-zA-Z]+$/
  const check = !(value !== undefined && value !== '' && regx.test(value));
  if(check){
    callback(new Error(field.message));
  }else{
    callback();
  }
}

export function validate2Check2(rule, value, callback) {
  const field = rule.fullField;
  const regx = /^[0-9_a-zA-Z]+$/
  const check = !(value !== undefined && value !== '' && regx.test(value));
  if(check){
    callback(new Error(field.message));
  }else{
    callback();
  }
}

export function checkNumber(rule, value, callback) {
  const field = rule.fullField;
  const regx =/^-?\d+(.\d+)?$/
  const check = !(value !== undefined && value !== '' && regx.test(value));
  if(check){
    callback(new Error(field.message));
  }else{
    callback();
  }
}

export function validateCheck(rule, value, callback){
    const field = rule.fullField;
    let self = rule.self;
    let check = function() {
        if(field === 'addr'){
            const regx = /^[0-9a-zA-Z]+$/
            return !(value !== undefined && value !== '' && regx.test(value));
        }else if(field === 'device'){
            return !(self.device && self.device.addr);
        } else if(field === 'product'){
            return !(self.product && typeof self.product.id === 'number');
        } else if(field === 'subDev'){
            return !(self.subDevice && self.subDevice.addr);
        } else if(field === 'project'){
            return !self.project;
        } else if(field === 'scene'){
            return !self.scene;
        }
        return false;
    }
    if(check()){
        callback(new Error(field.message));
    }else{
        callback();
    }
}

export function checkRegx(rule, value, callback){
  const field = rule.fullField;
  const reg = /[^a-zA-Z0-9]/;
  if(value === undefined || reg.test(value)){
    return callback(new Error(field.message));
  }else{
    let len = rule.len;
    if(len && value.length !== len){
      return callback(new Error(field.message));
    }else{
      callback();
    }
  }
}

export function ting2columns(thing) {
  const columns = [];
  thing.map(item => {
    if (item.access === 'read' || item.access === 'rw') {
      columns.push({
        key: item.name,
        label: item.title,
        thing: item,
        visible: true
      });
    }
  });
  return columns;
}

export function getDateRange(params) {
  let dateRange = [];
  if (params.dateMode == 'last') {
    const end = new Date(); const start = new Date();
    start.setTime(start.getTime() - params.dateRange  * 1000);
    dateRange[0] = dayjs(start).format('YYYY-MM-DD HH:mm:ss');
    dateRange[1] = dayjs(end).format('YYYY-MM-DD HH:mm:ss');
  }else{
    dateRange = params.dateRange;
  }
  return dateRange;
}

export function setAlarms(rows, alarms) {
    const alarmList = alarms.length && alarms.length > 0 ? alarms : [alarms];
    rows.map(row => {
        if (row.alarmrule) {
            const arr = row.alarmrule.split(',');
            const levels = [];
            alarmList.map(item => {
                if (arr.indexOf(item.id.toString()) > -1) {
                    levels.push(item)
                }
            });
            row.levels = levels;
        }else{
            row.levels = []
        }
    });
    return rows;
}
