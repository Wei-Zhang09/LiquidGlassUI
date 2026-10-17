/**
 * 位移滤镜注册表 —— 框架无关的核心。
 *
 * 为什么必须集中管理：SVG <filter> 只能挂在真实的 <svg> 元素里。
 * 若用 <template>/<div>/DOMParser(text/html) 解析，得到的会是 HTML 命名空间的
 * 同名元素，Chromium 会**静默丢掉整个 backdrop-filter**（不报错，玻璃直接全透明）。
 * 这里统一用 SVG 元素 + insertAdjacentHTML，并在写入后断言命名空间。
 *
 * 滤镜按几何参数缓存，尺寸变化时才重新生成贴图。
 */

import { buildDisplacementMap, createSpecularMap } from '../refraction.js'
import { createFusedDisplacementMap, type RectShape } from '../sdf.js'
import { optical, lighting } from '../generated/tokens.js'

/**
 * 判断节点是否为 SVG 命名空间的 `<filter>`。
 *
 * 为什么不用 `instanceof SVGFilterElement`：
 * 该构造器在部分环境（如 jsdom）不存在，且 `instanceof` 对跨文档/跨 realm
 * 的元素也会失效。真正要断言的语义是"它属于 SVG 命名空间" ——
 * 若 filter 被 HTML 解析器创建（如经 <template> / DOMParser(text/html)），
 * 它会是 HTML 命名空间里一个名为 "filter" 的未知元素，
 * Chromium 会因此静默丢弃整个 backdrop-filter。
 */
function isSvgFilterElement(node: Element | null): boolean {
  return (
    node != null &&
    node.namespaceURI === 'http://www.w3.org/2000/svg' &&
    node.localName === 'filter'
  )
}

export interface FilterRequest {
  width: number
  height: number
  radius: number
  surface?: string
  /**
   * 中心模糊强度（px）。
   *
   * ⚠️ 必须参与缓存 key —— 否则同一尺寸不同 level 会命中同一个滤镜，
   * 四档材质长得完全一样（实测踩过：plain/regular/elevated/focused 像素级相同）。
   */
  blur?: number
  overrides?: Partial<typeof optical>
}

/** 能构成折射边缘带的最小边长（px），与 glass-base 保持一致。 */
const MIN_FILTER_SIZE = 4

let host: SVGSVGElement | null = null
const cache = new Map<string, string>()
let seq = 0

function ensureHost(): SVGSVGElement {
  if (host && host.isConnected) return host
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('width', '0')
  svg.setAttribute('height', '0')
  svg.setAttribute('aria-hidden', 'true')
  svg.style.position = 'absolute'
  svg.style.overflow = 'hidden'
  svg.style.pointerEvents = 'none'
  svg.setAttribute('data-lg-filter-host', '')
  document.body.appendChild(svg)
  host = svg
  return svg
}

/**
 * 取得（或创建）一个折射滤镜，返回其 id。
 * 返回 null 表示该几何尺寸下边缘带无效，调用方应走降级路径。
 */
export function acquireFilter(req: FilterRequest): string | null {
  const { width, height, radius, surface = 'convexSquircle', blur = 2, overrides = {} } = req
  const w = Math.ceil(width)
  const h = Math.ceil(height)
  if (w < 4 || h < 4) return null

  const cfg = { ...optical, ...overrides }
  const key = [w, h, radius, surface, blur, cfg.bezelWidth, cfg.ior, cfg.dispersion, cfg.saturation].join(':')
  const existing = cache.get(key)
  if (existing) return existing

  const { mapUrl, scale, bezelWidth } = buildDisplacementMap(w, h, radius, surface as never, overrides)
  if (!mapUrl || bezelWidth <= 1) return null

  /**
   * 独立的镜面高光贴图。
   *
   * ⚠️ 这是「液态玻璃」与「磨砂玻璃」的分界线之一。
   * 只用 CSS inset shadow 做边缘高光，得到的是均匀一圈描边 ——
   * 像塑料边框，不像玻璃。真实玻璃的高光只出现在迎光侧，
   * 且强度随边缘法线连续变化。所以这里按像素算 dot(法线, 光向)。
   */
  const specUrl = createSpecularMap({
    width: w,
    height: h,
    radius,
    bezelWidth,
    angleDeg: lighting.angle,
  })

  const id = `lg-filter-${seq++}`
  const pad = 8 // 滤镜区域外扩，给模糊留余量
  const a = cfg.dispersion

  // 三通道 scale 差 → 色散；a=0 时退化为单次位移
  const dispBlock =
    a > 0
      ? `
      <feDisplacementMap in="BLUR_EDGE" in2="MAP" scale="${scale * (1 + a * 0.025)}"
        xChannelSelector="R" yChannelSelector="G" result="RD"/>
      <feColorMatrix in="RD" type="matrix" result="R"
        values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"/>
      <feDisplacementMap in="BLUR_EDGE" in2="MAP" scale="${scale}"
        xChannelSelector="R" yChannelSelector="G" result="GD"/>
      <feColorMatrix in="GD" type="matrix" result="G"
        values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"/>
      <feDisplacementMap in="BLUR_EDGE" in2="MAP" scale="${scale * (1 - a * 0.05)}"
        xChannelSelector="R" yChannelSelector="G" result="BD"/>
      <feColorMatrix in="BD" type="matrix" result="B"
        values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"/>
      <feBlend in="G" in2="B" mode="screen" result="GB"/>
      <feBlend in="R" in2="GB" mode="screen" result="RGB"/>
      <feGaussianBlur in="RGB" stdDeviation="0.35" result="DISP"/>`
      : `<feDisplacementMap in="BLUR_EDGE" in2="MAP" scale="${scale}"
        xChannelSelector="R" yChannelSelector="G" result="DISP"/>`

  const svgHost = ensureHost()
  svgHost.insertAdjacentHTML(
    'beforeend',
    `<filter id="${id}" x="${-pad}" y="${-pad}" width="${w + pad * 2}" height="${h + pad * 2}"
        filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
  <feImage href="${mapUrl}" x="0" y="0" width="${w}" height="${h}"
           preserveAspectRatio="none" result="MAP"/>

  <!-- 贴图 B 通道 → alpha，得到边缘遮罩 -->
  <feColorMatrix in="MAP" type="matrix" result="EDGE_MASK"
    values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 1 0 0"/>

  <!-- 全幅底色：模糊，中心保持清晰 -->
  <feGaussianBlur in="SourceGraphic" stdDeviation="${blur}" result="BLUR"/>
  <feColorMatrix in="BLUR" type="saturate" values="${cfg.saturation / 100}" result="BASE"/>

  <!-- 边缘带：更重的模糊 + 位移 + 色散 -->
  <feGaussianBlur in="SourceGraphic" stdDeviation="${Math.max(1.9, blur * 1.4)}" result="BLUR_EDGE"/>
  ${dispBlock}
  <feColorMatrix in="DISP" type="saturate" values="${cfg.saturation / 100}" result="DISP_SAT"/>

  <feComposite in="DISP_SAT" in2="EDGE_MASK" operator="in" result="EDGE_ONLY"/>
  <feComposite in="EDGE_ONLY" in2="BASE" operator="over" result="GLASS"/>

  <!-- 镜面高光：独立贴图叠在最上层，只在迎光侧出现 -->
  <feImage href="${specUrl}" x="0" y="0" width="${w}" height="${h}"
           preserveAspectRatio="none" result="SPEC"/>
  <feComponentTransfer in="SPEC" result="SPEC_FADED">
    <feFuncA type="linear" slope="${lighting.specularOpacity}"/>
  </feComponentTransfer>
  <feBlend in="SPEC_FADED" in2="GLASS" mode="screen"/>
</filter>`,
  )

  const node = svgHost.lastElementChild
  if (!isSvgFilterElement(node)) {
    // 命名空间错误会导致整个 backdrop-filter 被静默丢弃 —— 必须显式失败
    node?.remove()
    console.error(
      '[LiquidGlass] filter 未进入 SVG 命名空间，backdrop-filter 会被静默丢弃。' +
        '请确认宿主是 <svg> 元素而非 <div>/<template>。',
    )
    return null
  }

  cache.set(key, id)
  return id
}

/**
 * 注册一个基于**融合轮廓**的滤镜（供 <lg-glass-group> 使用）。
 *
 * 与 acquireFilter 的区别：位移贴图的距离场与梯度来自组内全部形状的平滑并集，
 * 因此相邻玻璃交界处的折射方向是连续的，不会各弯各的。
 */
export function registerFusedFilter(opts: {
  width: number
  height: number
  offsetX: number
  offsetY: number
  shapes: RectShape[]
  smoothing: number
  bezelWidth: number
  profile: Float64Array
  maxDisp: number
}): string | null {
  const { width: w, height: h, smoothing, shapes } = opts
  if (w < MIN_FILTER_SIZE || h < MIN_FILTER_SIZE) return null
  if (shapes.length === 0) return null

  const key = [
    'fused',
    w, h, opts.offsetX, opts.offsetY, smoothing, opts.bezelWidth,
    shapes.map((s) => `${Math.round(s.x)},${Math.round(s.y)},${Math.round(s.width)},${Math.round(s.height)},${Math.round(s.radius)}`).join(';'),
  ].join(':')
  const existing = cache.get(key)
  if (existing) return existing

  let mapUrl: string
  try {
    mapUrl = createFusedDisplacementMap({
      width: w,
      height: h,
      offsetX: opts.offsetX,
      offsetY: opts.offsetY,
      shapes,
      smoothing,
      bezelWidth: opts.bezelWidth,
      profile: opts.profile,
      maxDisp: opts.maxDisp,
    })
  } catch {
    return null
  }
  if (!mapUrl) return null

  const id = `lg-fused-${seq++}`
  const scale = opts.maxDisp * 1.6
  const pad = 8
  const a = optical.dispersion

  const dispBlock =
    a > 0
      ? `
      <feDisplacementMap in="BLUR_EDGE" in2="MAP" scale="${scale * (1 + a * 0.025)}"
        xChannelSelector="R" yChannelSelector="G" result="RD"/>
      <feColorMatrix in="RD" type="matrix" result="R"
        values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"/>
      <feDisplacementMap in="BLUR_EDGE" in2="MAP" scale="${scale}"
        xChannelSelector="R" yChannelSelector="G" result="GD"/>
      <feColorMatrix in="GD" type="matrix" result="G"
        values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"/>
      <feDisplacementMap in="BLUR_EDGE" in2="MAP" scale="${scale * (1 - a * 0.05)}"
        xChannelSelector="R" yChannelSelector="G" result="BD"/>
      <feColorMatrix in="BD" type="matrix" result="B"
        values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"/>
      <feBlend in="G" in2="B" mode="screen" result="GB"/>
      <feBlend in="R" in2="GB" mode="screen" result="RGB"/>
      <feGaussianBlur in="RGB" stdDeviation="0.35" result="DISP"/>`
      : `<feDisplacementMap in="BLUR_EDGE" in2="MAP" scale="${scale}"
        xChannelSelector="R" yChannelSelector="G" result="DISP"/>`

  const svgHost = ensureHost()
  svgHost.insertAdjacentHTML(
    'beforeend',
    `<filter id="${id}" x="${-pad}" y="${-pad}" width="${w + pad * 2}" height="${h + pad * 2}"
        filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
  <feImage href="${mapUrl}" x="0" y="0" width="${w}" height="${h}"
           preserveAspectRatio="none" result="MAP"/>
  <feColorMatrix in="MAP" type="matrix" result="EDGE_MASK"
    values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 1 0 0"/>
  <feGaussianBlur in="SourceGraphic" stdDeviation="1.2" result="BLUR"/>
  <feColorMatrix in="BLUR" type="saturate" values="${optical.saturation / 100}" result="BASE"/>
  <feGaussianBlur in="SourceGraphic" stdDeviation="1.9" result="BLUR_EDGE"/>
  ${dispBlock}
  <feColorMatrix in="DISP" type="saturate" values="${optical.saturation / 100}" result="DISP_SAT"/>
  <feComposite in="DISP_SAT" in2="EDGE_MASK" operator="in" result="EDGE_ONLY"/>
  <feComposite in="EDGE_ONLY" in2="BASE" operator="over"/>
</filter>`,
  )

  const node = svgHost.lastElementChild
  if (!isSvgFilterElement(node)) {
    node?.remove()
    console.error('[LiquidGlass] 融合滤镜未进入 SVG 命名空间，backdrop-filter 会被静默丢弃。')
    return null
  }

  cache.set(key, id)
  return id
}

/** 仅供测试：清空注册表。 */
export function __resetFilterRegistry() {
  cache.clear()
  host?.remove()
  host = null
  seq = 0
}

/** 仅供测试：读取当前缓存的滤镜数量。 */
export function __filterCount() {
  return cache.size
}
