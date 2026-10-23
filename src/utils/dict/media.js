export function isMediaDict(dict) {
  return dict.listClass === 'picture' || dict.listClass === 'file'
}

export function detectMediaType(path) {
  if (/\.html?(?:[?#]|$)/i.test(path)) return 'html'
  if (/\.(png|jpe?g|gif|webp|svg|bmp|ico|avif)(?:[?#]|$)/i.test(path)) return 'image'
  return 'file'
}

export function parseMediaDict(dict) {
  const raw = dict.dictValue || ''
  if (typeof raw === 'string' && !raw.trim().startsWith('{')) {
    return {
      type: dict.listClass === 'picture' ? 'image' : detectMediaType(raw),
      value: raw,
      path: raw
    }
  }
  const media = typeof raw === 'string' ? JSON.parse(raw) : raw
  if (!media || !['image', 'file', 'html'].includes(media.type) ||
      typeof media.value !== 'string' || typeof media.path !== 'string') {
    throw new Error('多媒体字典必须包含 type、value、path 字符串字段')
  }
  return media
}
