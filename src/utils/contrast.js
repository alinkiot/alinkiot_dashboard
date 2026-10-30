/**
 * 强调色可读性兜底
 *
 * 站点主题色是可配置的，其中一部分（如森林绿的 #34c759）作为「填充底色 + 白字」时
 * 对比度只有 2.2:1，远低于 WCAG AA 要求的 4.5:1，主按钮和激活标签会读不清。
 *
 * 这里不改变品牌色本身（标签点、进度条、图标仍然用原色），
 * 只在「作为填充块承载白字」的场景下，把底色按比例压暗到刚好达标。
 */

function hexToRgb(hex) {
  let h = (hex || '').replace('#', '').trim()
  if (h.length === 3) {
    h = h.split('').map(c => c + c).join('')
  }
  if (h.length !== 6) return null
  const n = parseInt(h, 16)
  if (isNaN(n)) return null
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

function rgbToHex(r, g, b) {
  const to = v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')
  return '#' + to(r) + to(g) + to(b)
}

// WCAG 相对亮度
function luminance({ r, g, b }) {
  const f = v => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}

// 与白色的对比度
export function contrastWithWhite(hex) {
  const rgb = hexToRgb(hex)
  if (!rgb) return 21
  return (1.05) / (luminance(rgb) + 0.05)
}

/**
 * 与白色混合，得到「提亮版」主题色。
 * 深色主题下直接用原色描边会糊在深底上，提亮后既能看清又保留色相。
 */
export function mixWithWhite(hex, ratio = 0.35) {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  const k = Math.max(0, Math.min(1, ratio))
  return rgbToHex(
    rgb.r + (255 - rgb.r) * k,
    rgb.g + (255 - rgb.g) * k,
    rgb.b + (255 - rgb.b) * k
  )
}

/**
 * 转成 rgba() 字符串，用于描边外的半透明光晕。
 * 用半透明是为了让「描边 + 光晕」读成一个整体，而不是两层框。
 */
export function toRgba(hex, alpha = 1) {
  const rgb = hexToRgb(hex)
  if (!rgb) return `rgba(0, 113, 227, ${alpha})`
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`
}

/**
 * 返回一个与白字对比度 ≥ minRatio 的加深色。
 * 已经达标则原样返回，避免无谓改色。
 */
export function ensureContrastWithWhite(hex, minRatio = 4.5) {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  if (contrastWithWhite(hex) >= minRatio) return hex

  // 按 2% 步长逐级压暗，最多压到 60%，保证色相不跑偏
  for (let step = 0.02; step <= 0.6; step += 0.02) {
    const k = 1 - step
    const candidate = rgbToHex(rgb.r * k, rgb.g * k, rgb.b * k)
    if (contrastWithWhite(candidate) >= minRatio) return candidate
  }
  return '#1d1d1f'
}
