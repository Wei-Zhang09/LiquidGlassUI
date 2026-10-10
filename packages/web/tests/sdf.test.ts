/**
 * SDF 与平滑并集的数学测试。
 *
 * 这是玻璃融合的正确性基础，纯数学、不依赖 DOM，因此可以精确断言数值。
 */

import { describe, expect, it } from 'vitest'
import {
  sdRoundedRect,
  shapeDistance,
  sminPoly,
  fusedDistance,
  fusedGradient,
  normalize,
  type RectShape,
} from '../src/sdf.js'

describe('sdRoundedRect', () => {
  it('中心点的距离为负（在内部）', () => {
    expect(sdRoundedRect(0, 0, 50, 30, 8)).toBeLessThan(0)
  })

  it('正上方超出边界的点距离为正，且等于超出量', () => {
    // 半高 30，点在 y=40 → 超出 10
    expect(sdRoundedRect(0, 40, 50, 30, 8)).toBeCloseTo(10, 5)
  })

  it('边界上的点距离为 0', () => {
    expect(sdRoundedRect(0, 30, 50, 30, 8)).toBeCloseTo(0, 5)
  })

  it('半径超过半高时被钳制，不产生异常', () => {
    const d = sdRoundedRect(0, 0, 50, 10, 999)
    expect(Number.isFinite(d)).toBe(true)
    expect(d).toBeLessThan(0)
  })

  it('中心距离等于负的较短半轴（圆形内切）', () => {
    // 50x30、半径 30（被钳到 30）时中心到边界的距离是 30
    expect(sdRoundedRect(0, 0, 50, 30, 30)).toBeCloseTo(-30, 5)
  })
})

describe('shapeDistance', () => {
  const rect: RectShape = { x: 0, y: 0, width: 100, height: 60, radius: 10 }

  it('矩形中心为负', () => {
    expect(shapeDistance(rect, 50, 30)).toBeLessThan(0)
  })

  it('矩形外部为正', () => {
    expect(shapeDistance(rect, 200, 30)).toBeGreaterThan(0)
  })

  it('偏移量计算正确（x=10 处）', () => {
    const shifted: RectShape = { ...rect, x: 10 }
    expect(shapeDistance(shifted, 60, 30)).toBeCloseTo(shapeDistance(rect, 50, 30), 5)
  })
})

describe('sminPoly', () => {
  it('k=0 时退化为普通 min', () => {
    expect(sminPoly(3, 7, 0)).toBe(3)
    expect(sminPoly(7, 3, 0)).toBe(3)
  })

  it('两值相等时结果小于原值（产生融合）', () => {
    const v = sminPoly(5, 5, 4)
    expect(v).toBeLessThan(5)
  })

  it('融合量不超过 k/4', () => {
    const k = 4
    const v = sminPoly(5, 5, k)
    // h=1 → 修正项 = 1*1*k*0.25 = k/4
    expect(5 - v).toBeLessThanOrEqual(k / 4 + 1e-9)
  })

  it('两值差距超过 k 时退化为 min', () => {
    expect(sminPoly(0, 100, 4)).toBeCloseTo(0, 10)
  })

  it('k 越大融合越强（结果越小）', () => {
    const small = sminPoly(5, 5, 2)
    const large = sminPoly(5, 5, 8)
    expect(large).toBeLessThan(small)
  })
})

describe('fusedDistance', () => {
  const a: RectShape = { x: 0, y: 0, width: 100, height: 100, radius: 20 }
  const b: RectShape = { x: 140, y: 0, width: 100, height: 100, radius: 20 }

  it('空形状列表返回正无穷', () => {
    expect(fusedDistance([], 0, 0, 10)).toBe(Number.POSITIVE_INFINITY)
  })

  it('单形状时等于该形状的距离', () => {
    expect(fusedDistance([a], 50, 50, 10)).toBeCloseTo(shapeDistance(a, 50, 50), 10)
  })

  it('两个分离形状：中点处融合后距离小于无融合', () => {
    // 两矩形间隙 40px（100..140），中点在 x=120
    const noFuse = Math.min(shapeDistance(a, 120, 50), shapeDistance(b, 120, 50))
    const fused = fusedDistance([a, b], 120, 50, 40)
    expect(fused).toBeLessThan(noFuse)
  })

  it('融合半径越大，间隙处距离越小（更容易连成一体）', () => {
    const small = fusedDistance([a, b], 120, 50, 10)
    const large = fusedDistance([a, b], 120, 50, 60)
    expect(large).toBeLessThan(small)
  })

  it('远离形状处仍为正（不会误判为内部）', () => {
    expect(fusedDistance([a, b], 800, 800, 40)).toBeGreaterThan(0)
  })

  it('形状内部为负', () => {
    expect(fusedDistance([a, b], 50, 50, 40)).toBeLessThan(0)
    expect(fusedDistance([a, b], 190, 50, 40)).toBeLessThan(0)
  })
})

describe('fusedGradient', () => {
  const a: RectShape = { x: 0, y: 0, width: 100, height: 100, radius: 20 }

  it('单形状左侧的梯度指向 -x（外侧）', () => {
    // 点在矩形左侧外部，SDF 沿 -x 方向增大 → 梯度 x 为负
    const g = fusedGradient([a], -20, 50, 10)
    expect(g.x).toBeLessThan(0)
  })

  it('单形状右侧的梯度指向 +x', () => {
    const g = fusedGradient([a], 120, 50, 10)
    expect(g.x).toBeGreaterThan(0)
  })

  it('形状上方的梯度指向 -y', () => {
    const g = fusedGradient([a], 50, -20, 10)
    expect(g.y).toBeLessThan(0)
  })

  it('融合区内梯度只沿 x 变化，无横向偏折', () => {
    const b: RectShape = { ...a, x: 140 }
    // 两个等高矩形并排，融合区的法线应纯水平。
    // 若出现横向分量，说明融合把轮廓带歪了 —— 那才是缺陷。
    for (let x = 102; x <= 138; x += 2) {
      expect(fusedGradient([a, b], x, 50, 40).y).toBeCloseTo(0, 10)
    }
  })

  it('融合区内梯度方向随 x 单调翻转（由 +x 渐变到 -x）', () => {
    const b: RectShape = { ...a, x: 140 }
    // 从左形状右侧（应指向 +x）过渡到右形状左侧（应指向 -x），
    // 中间必须连续穿过 0，不能跳变。
    const left = normalize(fusedGradient([a, b], 104, 50, 40))
    const right = normalize(fusedGradient([a, b], 136, 50, 40))
    expect(left.x).toBeGreaterThan(0.5)
    expect(right.x).toBeLessThan(-0.5)

    // 单调性：沿 x 前进，grad.x 应单调不增
    let prev = Infinity
    for (let x = 102; x <= 138; x += 2) {
      const gx = fusedGradient([a, b], x, 50, 40).x
      expect(gx).toBeLessThanOrEqual(prev + 1e-9)
      prev = gx
    }
  })

  it('对称中点处梯度退化为零向量（几何奇点，非缺陷）', () => {
    const b: RectShape = { ...a, x: 140 }
    // 两个相同矩形等距处的合梯度恰好抵消。
    // 这是对称性的必然结果；normalize 已保证不会产生 NaN。
    const g = fusedGradient([a, b], 120, 50, 40)
    expect(Math.abs(g.x)).toBeLessThan(1e-9)
    const n = normalize(g)
    expect(n.x).toBe(0)
    expect(n.y).toBe(0)
  })
})

describe('normalize', () => {
  it('归一化后长度为 1', () => {
    const n = normalize({ x: 3, y: 4 })
    expect(Math.hypot(n.x, n.y)).toBeCloseTo(1, 10)
  })

  it('零向量返回 (0,0) 而非 NaN', () => {
    const n = normalize({ x: 0, y: 0 })
    expect(n.x).toBe(0)
    expect(n.y).toBe(0)
    expect(Number.isNaN(n.x)).toBe(false)
  })
})
