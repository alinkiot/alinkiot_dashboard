import DictOptions from './DictOptions'
import DictData from './DictData'
import { isMediaDict, parseMediaDict } from './media'

export default function(dict, dictMeta) {
  const label = determineDictField(dict, dictMeta.labelField, ...DictOptions.DEFAULT_LABEL_FIELDS)
  const value = determineDictField(dict, dictMeta.valueField, ...DictOptions.DEFAULT_VALUE_FIELDS)
  let optionValue = dict[value]
  if (isMediaDict(dict)) {
    try {
      optionValue = parseMediaDict(dict).value
    } catch (error) {
      console.error('多媒体字典格式无效', dict.dictCode, error)
    }
  }
  return new DictData(dict[label], optionValue, dict)
}

/**
 * 确定字典字段
 * @param {DictData} dict
 * @param  {...String} fields
 */
function determineDictField(dict, ...fields) {
  return fields.find(f => Object.prototype.hasOwnProperty.call(dict, f))
}
