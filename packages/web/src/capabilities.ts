/**
 * 液态玻璃能力门控。
 *
 * 为什么不用 CSS.supports 或 computed style 判断：
 * 实测（Chromium 151 / Firefox 153）证明 Firefox 对 `backdrop-filter: url(#x)`
 * 返回 true，computed style 也保留该值，但渲染时完全不做位移 —— 静默失败。
 * 唯一可靠的判断是 UA 嗅探。
 *
 * @see docs/adr/0001-component-matrix-and-architecture.md 决策 D4
 */

let cached: boolean | null = null

/** 当前浏览器是否支持 SVG 位移滤镜作用于 backdrop（即真实折射）。 */
export function isGlassRefractionSupported(): boolean {
  if (cached !== null) return cached
  if (typeof navigator === 'undefined') return (cached = false)

  const ua = navigator.userAgent
  // 注意：不能用 /\bChrome\/\d+/ —— headless Chrome 的 UA 是 "HeadlessChrome/…"，
  // 而 "HeadlessChrome" 中 "s" 与 "C" 之间没有词边界，\b 会导致匹配失败。
  // 这里显式列出两种形态，避免依赖词边界语义。
  const isChromium =
    'userAgentData' in navigator || /(?:Headless)?Chrome\/\d+/.test(ua)
  const isNonChromium =
    /Firefox|FxiOS|CriOS|EdgiOS/.test(ua) || /^((?!chrome|android).)*safari/i.test(ua)

  return (cached = isChromium && !isNonChromium)
}

/** 基础 backdrop-filter 能力（磨砂降级路径需要）。 */
export function isBackdropFilterSupported(): boolean {
  if (typeof CSS === 'undefined' || !CSS.supports) return false
  return (
    CSS.supports('backdrop-filter', 'blur(1px)') ||
    CSS.supports('-webkit-backdrop-filter', 'blur(1px)')
  )
}

/** 能力汇总，便于在应用启动时打日志排查。 */
export function getGlassCapabilities() {
  return {
    refraction: isGlassRefractionSupported(),
    backdropFilter: isBackdropFilterSupported(),
    reducedMotion:
      typeof matchMedia !== 'undefined' &&
      matchMedia('(prefers-reduced-motion: reduce)').matches,
  }
}

/** 仅供测试：清空缓存。 */
export function __resetCapabilityCache() {
  cached = null
}
