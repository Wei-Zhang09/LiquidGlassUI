/**
 * 有符号距离场（SDF）与平滑并集 —— 玻璃形状融合的数学核心。
 *
 * 普通 glassmorphism 库里相邻玻璃是**叠放**；液态玻璃要求它们像真实液体一样
 * **融成一团**。做法不是叠图，而是把多个形状的距离场做平滑并集（smooth min），
 * 再对融合后的轮廓求梯度当作法线 —— 这样折射方向在融合区域也连续，
 * 不会出现两个圆角各自弯折的"假融合"。
 *
 * 本模块是纯数学，不依赖 DOM，可直接单元测试。
 *
 * @see docs/adr/0001-component-matrix-and-architecture.md
 */

export interface Vec2 {
  x: number
  y: number
}

/** 轴对齐圆角矩形，坐标为元素本地坐标系。 */
export interface RectShape {
  x: number
  y: number
  width: number
  height: number
  radius: number
}

/**
 * 圆角矩形的有符号距离。负值在内部，正值在外部。
 *
 * @param px 相对矩形中心的 x
 * @param py 相对矩形中心的 y
 */
export function sdRoundedRect(
  px: number,
  py: number,
  halfW: number,
  halfH: number,
  radius: number,
): number {
  const r = Math.min(radius, Math.min(halfW, halfH))
  const qx = Math.abs(px) - halfW + r
  const qy = Math.abs(py) - halfH + r
  const outside = Math.hypot(Math.max(qx, 0), Math.max(qy, 0))
  const inside = Math.min(Math.max(qx, qy), 0)
  return outside + inside - r
}

/** 单个矩形形状的 SDF（输入为全局坐标）。 */
export function shapeDistance(shape: RectShape, x: number, y: number): number {
  const cx = shape.x + shape.width / 2
  const cy = shape.y + shape.height / 2
  return sdRoundedRect(x - cx, y - cy, shape.width / 2, shape.height / 2, shape.radius)
}

/**
 * 多项式平滑最小值（smooth min）。
 *
 * `k` 是融合半径：越大过渡越宽，两个形状越早"融"在一起。
 * 标准 smin 在 a≈b 时用二次修正把两段距离场缝合。
 */
export function sminPoly(a: number, b: number, k: number): number {
  if (k <= 0) return Math.min(a, b)
  const h = Math.max(k - Math.abs(a - b), 0) / k
  return Math.min(a, b) - h * h * k * 0.25
}

/** 多个形状的平滑并集距离场。 */
export function fusedDistance(shapes: RectShape[], x: number, y: number, k: number): number {
  if (shapes.length === 0) return Number.POSITIVE_INFINITY
  let d = shapeDistance(shapes[0]!, x, y)
  for (let i = 1; i < shapes.length; i++) {
    d = sminPoly(d, shapeDistance(shapes[i]!, x, y), k)
  }
  return d
}

/**
 * 融合距离场的梯度（未归一化）。
 *
 * 用中心差分而非解析式：形状数量与融合拓扑是任意的，解析梯度需要逐形状
 * 处理 smin 的权重，中心差分在实现上更稳、也更容易与 CPU 命中测试保持一致。
 */
export function fusedGradient(
  shapes: RectShape[],
  x: number,
  y: number,
  k: number,
  eps = 0.5,
): Vec2 {
  const dx = fusedDistance(shapes, x + eps, y, k) - fusedDistance(shapes, x - eps, y, k)
  const dy = fusedDistance(shapes, x, y + eps, k) - fusedDistance(shapes, x, y - eps, k)
  return { x: dx, y: dy }
}

/** 归一化向量；零向量返回 (0,0) 而不是 NaN。 */
export function normalize(v: Vec2): Vec2 {
  const len = Math.hypot(v.x, v.y)
  if (len < 1e-6) return { x: 0, y: 0 }
  return { x: v.x / len, y: v.y / len }
}

export interface FusedDisplacementOptions {
  /** 输出贴图尺寸（通常是某个玻璃子元素的包围盒）。 */
  width: number
  height: number
  /** 输出区域左上角在**组坐标系**中的位置。 */
  offsetX: number
  offsetY: number
  /** 组内全部形状（组坐标系）。 */
  shapes: RectShape[]
  /** 融合半径。 */
  smoothing: number
  /** 边缘折射带宽度。 */
  bezelWidth: number
  /** 折射偏移查找表。 */
  profile: Float64Array
  maxDisp: number
}

/**
 * 生成**融合后轮廓**的位移贴图。
 *
 * 与单形状版本的区别：距离场与梯度都来自 `fusedDistance`，
 * 因此贴图上的折射方向跟随融合后的整体轮廓，而不是各个矩形自己的边。
 * 这正是不出现"假融合"的原因。
 */
export function createFusedDisplacementMap(opts: FusedDisplacementOptions): string {
  const { width: w, height: h, offsetX, offsetY, shapes, smoothing, bezelWidth, profile, maxDisp } =
    opts

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('[LiquidGlass] 无法创建 2D 上下文')

  const img = ctx.createImageData(w, h)
  const d = img.data
  for (let i = 0; i < d.length; i += 4) {
    d[i] = 128
    d[i + 1] = 128
    d[i + 2] = 0
    d[i + 3] = 255
  }

  const S = profile.length

  for (let y1 = 0; y1 < h; y1++) {
    for (let x1 = 0; x1 < w; x1++) {
      // 转换到组坐标系
      const gx = x1 + offsetX
      const gy = y1 + offsetY

      const dist = fusedDistance(shapes, gx, gy, smoothing)
      const inward = -dist
      if (inward <= 0 || inward >= bezelWidth) continue // 只处理边缘带

      const t = inward / bezelWidth
      const bi = Math.min((t * S) | 0, S - 1)
      const disp = profile[bi] || 0
      if (disp === 0) continue

      // 融合后的法线：SDF 梯度指向外侧，取反得到向内的折射方向
      const g = fusedDistance(shapes, gx + 0.5, gy, smoothing) - fusedDistance(shapes, gx - 0.5, gy, smoothing)
      const gy2 = fusedDistance(shapes, gx, gy + 0.5, smoothing) - fusedDistance(shapes, gx, gy - 0.5, smoothing)
      const n = normalize({ x: -g, y: -gy2 })
      if (n.x === 0 && n.y === 0) continue

      const idx = (y1 * w + x1) * 4
      d[idx] = clamp255(128 + (n.x * disp) / maxDisp * 127)
      d[idx + 1] = clamp255(128 + (n.y * disp) / maxDisp * 127)
      // B 通道 = 边缘遮罩：越靠近融合轮廓越亮
      d[idx + 2] = clamp255(255 * (1 - Math.min(1, t / 0.85)))
    }
  }

  ctx.putImageData(img, 0, 0)
  return canvas.toDataURL()
}

function clamp255(v: number): number {
  return Math.max(0, Math.min(255, (v + 0.5) | 0))
}
