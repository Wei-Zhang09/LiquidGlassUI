/**
 * 折射位移贴图生成。
 *
 * 数学来自 archisvaze/liquid-glass 的教科书式实现（MIT）：
 * 表面高度函数 h(t) → 求导得法线 → Snell 定律 → 采样偏移量。
 *
 * 关键约束（实测得出，缺任一项都会静默失效）：
 *  1. 使用本贴图的 <filter> 必须带 color-interpolation-filters="sRGB"，
 *     否则默认的 linearRGB 会把中性值 128 反解成约 145，位移量被 gamma 扭曲。
 *  2. <feImage> 必须带 preserveAspectRatio="none"，否则映射不稳、位移完全不生效。
 *
 * @see docs/adr/0001-component-matrix-and-architecture.md
 */

import { optical } from './generated/tokens.js'

export interface Vec2 {
  x: number
  y: number
}

/** 表面高度函数：x 为归一化的边缘带内进度（0=形状边缘，1=边缘带内边界）。 */
export type SurfaceHeightFn = (x: number) => number

export const surfaceFns: Record<string, SurfaceHeightFn> = {
  /** 苹果超椭圆凸起，最接近 iOS 观感。 */
  convexSquircle: (x) => Math.pow(1 - Math.pow(1 - x, 4), 0.25),
  /** 半圆凸起。 */
  convexCircle: (x) => Math.sqrt(1 - (1 - x) * (1 - x)),
  /** 内凹（水滴边缘）。 */
  concave: (x) => 1 - Math.sqrt(1 - (1 - x) * (1 - x)),
  /** 凸→凹混合。 */
  lip: (x) => {
    const convex = Math.pow(1 - Math.pow(1 - Math.min(x * 2, 1), 4), 0.25)
    const concave = 1 - Math.sqrt(1 - (1 - x) * (1 - x)) + 0.1
    const t = 6 * x ** 5 - 15 * x ** 4 + 10 * x ** 3 // smootherstep
    return convex * (1 - t) + concave * t
  },
}

/**
 * Snell 定律折射剖面。
 * 返回长度为 samples 的查找表：距边缘 fromSide 处应向内采样多远。
 */
export function refractionProfile(
  glassThickness: number,
  bezelWidth: number,
  heightFn: SurfaceHeightFn,
  ior: number,
  samples = 128,
): Float64Array {
  const eta = 1 / ior // 空气 → 玻璃
  const refract = (nx: number, ny: number): Vec2 | null => {
    const k = 1 - eta * eta * (1 - ny * ny)
    if (k < 0) return null // 全反射
    const sq = Math.sqrt(k)
    return { x: -(eta * ny + sq) * nx, y: eta - (eta * ny + sq) * ny }
  }

  const profile = new Float64Array(samples)
  for (let i = 0; i < samples; i++) {
    const x = i / samples
    const y = heightFn(x)
    const deriv = (heightFn(x + 1e-4) - y) / 1e-4 // h'(t)
    const mag = Math.hypot(deriv, 1)
    const ref = refract(-deriv / mag, -1 / mag)
    profile[i] = ref ? ref.x * ((y * bezelWidth + glassThickness) / ref.y) : 0
  }
  return profile
}

export interface DisplacementMapOptions {
  width: number
  height: number
  radius: number
  bezelWidth: number
  profile: Float64Array
  maxDisp: number
}

/**
 * 生成位移贴图 dataURL。
 * R 通道 = x 偏移，G 通道 = y 偏移（均以 128 为中性），B 通道 = 边缘遮罩。
 */
export function createDisplacementMap(opts: DisplacementMapOptions): string {
  const { width: w, height: h, radius, bezelWidth, profile, maxDisp } = opts
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('[LiquidGlass] 无法创建 2D 上下文')

  const img = ctx.createImageData(w, h)
  const d = img.data
  for (let i = 0; i < d.length; i += 4) {
    d[i] = 128 // R 中性
    d[i + 1] = 128 // G 中性
    d[i + 2] = 0 // B 遮罩
    d[i + 3] = 255
  }

  const r = radius
  const rSq = r * r
  const r1Sq = (r + 1) ** 2
  const rBSq = Math.max(r - bezelWidth, 0) ** 2 // 边缘带内边界
  const wB = w - r * 2
  const hB = h - r * 2
  const S = profile.length

  for (let y1 = 0; y1 < h; y1++) {
    for (let x1 = 0; x1 < w; x1++) {
      // 把点折叠到最近的角：直边上的点 x 或 y 为 0
      const x = x1 < r ? x1 - r : x1 >= w - r ? x1 - r - wB : 0
      const y = y1 < r ? y1 - r : y1 >= h - r ? y1 - r - hB : 0
      const dSq = x * x + y * y
      if (dSq > r1Sq || dSq < rBSq) continue // 只处理边缘带

      const dist = Math.sqrt(dSq)
      const fromSide = r - dist
      // 1px 抗锯齿渐变
      const op =
        dSq < rSq
          ? 1
          : 1 - (dist - Math.sqrt(rSq)) / (Math.sqrt(r1Sq) - Math.sqrt(rSq))
      if (op <= 0 || dist === 0) continue

      const bi = Math.min(((fromSide / bezelWidth) * S) | 0, S - 1)
      const disp = profile[bi] || 0
      const idx = (y1 * w + x1) * 4
      d[idx] = clamp255(128 - ((x / dist) * disp) / maxDisp * 127 * op)
      d[idx + 1] = clamp255(128 - ((y / dist) * disp) / maxDisp * 127 * op)
      // B 通道 = 边缘遮罩，越靠边越亮，在边缘带内边界淡出
      const t = Math.min(1, fromSide / (bezelWidth * 0.85))
      d[idx + 2] = clamp255(255 * (1 - t) * op)
    }
  }

  ctx.putImageData(img, 0, 0)
  return canvas.toDataURL()
}

function clamp255(v: number): number {
  return Math.max(0, Math.min(255, (v + 0.5) | 0))
}

/** 一次性算出贴图与 scale，供组件调用。 */
export function buildDisplacementMap(
  width: number,
  height: number,
  radius: number,
  surface: keyof typeof surfaceFns = 'convexSquircle',
  overrides: Partial<typeof optical> = {},
): { mapUrl: string; scale: number; bezelWidth: number; maxDisp: number } {
  const cfg = { ...optical, ...overrides }

  /**
   * ⚠️⚠️ 边缘带宽度必须**随元件尺寸缩放**，而且比例要小。
   *
   * 这是「文字周围出现一圈灰底」的真正根因（用户两次反馈）。
   *
   * 实测：按钮 132×64，按短边 18% 算 → bezelWidth = 11.5px。
   * 但文字行高只有 24px、垂直居中，文字上下各只有 20px 余量 ——
   * 11.5px 的边缘带**直接盖到文字上**，把背景色块折射进文字区域，
   * 视觉上就是「文字有一块灰色横带」。
   *
   * 关掉 backdrop-filter 后暗带从 22.5 降到 15.3（只剩边缘阴影），
   * 关掉彩色背景后完全消失 —— 证实是折射把背景色拉进了文字区。
   *
   * 修正：边缘带上限从短边 18% 降到 **8%**，且硬上限 10px。
   * 小胶囊得到 5px 级细边缘，文字区不再被侵蚀；
   * 大面板仍受 cfg.bezelWidth(22px) 与圆角约束，观感不变。
   */
  const shortSide = Math.min(width, height)
  const bezelWidth = Math.min(
    cfg.bezelWidth,
    Math.max(radius - 1, 1),
    Math.max(shortSide * 0.08, 2),
    Math.max(shortSide / 2 - 1, 1),
    10,                       // 硬上限：再大就会盖住内容
  )
  if (bezelWidth <= 1) {
    return { mapUrl: '', scale: 0, bezelWidth: 0, maxDisp: 0 }
  }

  const profile = refractionProfile(
    80,
    bezelWidth,
    surfaceFns[surface] ?? surfaceFns.convexSquircle!,
    cfg.ior,
    128,
  )
  const maxDisp = Math.max(1, ...Array.from(profile, Math.abs))
  const mapUrl = createDisplacementMap({
    width,
    height,
    radius,
    bezelWidth,
    profile,
    maxDisp,
  })
  /**
   * 位移放大系数。
   *
   * ⚠️ 这个值决定「边缘透镜有多明显」，是液态玻璃观感的关键。
   * 原来是 0.8 —— 实测边缘效应只有参考实现（archisvaze）的 59%，
   * 看起来像「软边框」而不是「厚玻璃弯折」。
   * 提到 1.6 后边缘位移翻倍，与参考实现同一量级。
   * 再大（>2.2）会出现明显的采样拉扯条纹，不可取。
   */
  return { mapUrl, scale: maxDisp * 1.6, bezelWidth, maxDisp }
}


/**
 * 生成**镜面高光贴图** dataURL（RGB + alpha）。
 *
 * 为什么需要独立的高光层（参照 archisvaze/liquid-glass 的做法）：
 * 只用 CSS `inset box-shadow` 做边缘高光，得到的是**均匀一圈**的描边，
 * 看起来像塑料边框，不像玻璃 —— 真实玻璃的高光是：
 *   1. 只出现在**迎光侧**（本库光照方向 45°，即左上）
 *   2. 强度沿边缘**连续变化**（法线与光向的夹角决定）
 *   3. 集中在**边缘带内**，中心无高光
 *
 * 所以按像素计算 `dot(边缘法线, 光向)` 并据此调制 alpha。
 * 与参考实现等价，但复用本库已有的 tokens（lighting.angle / specularOpacity）。
 *
 * @param angleDeg 光照方向（度）。0 = 向右，90 = 向下；45 = 左上→右下。
 */
export function createSpecularMap(opts: {
  width: number
  height: number
  radius: number
  bezelWidth: number
  angleDeg?: number
  /** 高光带相对 bezel 的宽度倍数。参考实现用 2.5。 */
  bandScale?: number
}): string {
  const { width: w, height: h, radius } = opts
  const bezelWidth = Math.max(1, opts.bezelWidth)
  const bandScale = opts.bandScale ?? 2.5
  // 光照向量：tokens 里 angle 是「顺时针从右方向下」，转成数学坐标（y 向上为正）
  const rad = ((opts.angleDeg ?? 45) * Math.PI) / 180
  const lx = Math.cos(rad)
  const ly = -Math.sin(rad)

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('[LiquidGlass] 无法创建 2D 上下文')

  const img = ctx.createImageData(w, h)
  const d = img.data
  d.fill(0) // 全透明：没有高光的地方就是透明

  const r = radius
  const rSq = r * r
  const r1Sq = (r + 1) ** 2
  // 高光带内边界（比折射带更窄，集中在最外圈）
  const rBSq = Math.max(r - bezelWidth * bandScale, 0) ** 2
  const wB = w - r * 2
  const hB = h - r * 2

  for (let y1 = 0; y1 < h; y1++) {
    for (let x1 = 0; x1 < w; x1++) {
      const x = x1 < r ? x1 - r : x1 >= w - r ? x1 - r - wB : 0
      const y = y1 < r ? y1 - r : y1 >= h - r ? y1 - r - hB : 0
      const dSq = x * x + y * y
      if (dSq > r1Sq || dSq < rBSq) continue // 只在高光带内
      const dist = Math.sqrt(dSq)
      if (dist === 0) continue

      const fromSide = r - dist
      // 1px 抗锯齿
      const op =
        dSq < rSq ? 1 : 1 - (dist - Math.sqrt(rSq)) / (Math.sqrt(r1Sq) - Math.sqrt(rSq))
      if (op <= 0) continue

      // 边缘法线（指向形状中心的反向 = 向外）
      const nx = x / dist
      const ny = y / dist
      // 迎光程度：法线与光向的点积，取绝对值 → 两侧对称高光
      const dot = Math.abs(nx * lx + ny * ly)
      // 越靠近最外缘越亮（平方让高光收得更紧，形成「镜面线」）
      const edge = Math.sqrt(Math.max(0, 1 - (1 - Math.min(1, fromSide / (bezelWidth * bandScale))) ** 2))
      const coeff = dot * edge
      if (coeff <= 0.002) continue

      const col = clamp255(255 * coeff)
      const alpha = clamp255(255 * coeff * coeff * op)
      const idx = (y1 * w + x1) * 4
      d[idx] = col
      d[idx + 1] = col
      d[idx + 2] = col
      d[idx + 3] = alpha
    }
  }

  ctx.putImageData(img, 0, 0)
  return canvas.toDataURL()
}
