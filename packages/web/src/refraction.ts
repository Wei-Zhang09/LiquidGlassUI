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
  // 边缘带不能超过圆角，也不能超过短边的一半
  const bezelWidth = Math.min(
    cfg.bezelWidth,
    Math.max(radius - 1, 1),
    Math.max(Math.min(width, height) / 2 - 1, 1),
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
  return { mapUrl, scale: maxDisp * 0.8, bezelWidth, maxDisp }
}
