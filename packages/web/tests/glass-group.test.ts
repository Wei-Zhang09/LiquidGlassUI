/**
 * GlassGroup 测试：子元素是否被组接管、是否拿到**融合**滤镜。
 *
 * 关键断言：组内子元素的滤镜 id 必须带 `lg-fused-` 前缀 ——
 * 若它们各自拿到单形状滤镜（`lg-filter-`），说明融合没生效，
 * 交界处会出现两道互相打架的折射边。
 */

import { describe, expect, it, beforeEach } from 'vitest'
import { defineGlassGroup } from '../src/elements/glass-group.js'
import { defineGlassButton } from '../src/elements/glass-button.js'
import { __resetFilterRegistry, __filterCount } from '../src/core/filter-registry.js'
import { __resetCapabilityCache } from '../src/capabilities.js'
import { mockRefractionSupport, mockFrostOnlySupport, mount, flush, stubRect } from './helpers.js'

defineGlassGroup()
defineGlassButton()

/** 给组及其子元素布置几何。 */
function layoutGroup(group: HTMLElement, childSizes: { w: number; h: number }[]) {
  stubRect(group, 400, 60)
  const kids = [...group.children] as HTMLElement[]
  kids.forEach((k, i) => {
    const s = childSizes[i] ?? { w: 80, h: 40 }
    // 水平排布，间距 20
    k.getBoundingClientRect = () =>
      ({
        width: s.w,
        height: s.h,
        top: 10,
        left: 10 + i * (s.w + 20),
        right: 10 + i * (s.w + 20) + s.w,
        bottom: 10 + s.h,
        x: 10 + i * (s.w + 20),
        y: 10,
        toJSON: () => ({}),
      }) as DOMRect
  })
  return kids
}

describe('GlassGroup', () => {
  beforeEach(() => {
    __resetCapabilityCache()
    __resetFilterRegistry()
    mockRefractionSupport()
  })

  it('支持折射时标记自身为 refraction', async () => {
    const group = mount('<lg-glass-group></lg-glass-group>', { width: 400, height: 60 })
    await flush()
    expect(group.getAttribute('data-support')).toBe('refraction')
  })

  it('不支持折射时降级为 frost，且不给子元素分配滤镜', async () => {
    mockFrostOnlySupport()
    __resetCapabilityCache()
    const group = mount(
      '<lg-glass-group><lg-glass-button>确定</lg-glass-button></lg-glass-group>',
      { width: 400, height: 60 },
    )
    await flush()
    expect(group.getAttribute('data-support')).toBe('frost')
    expect(__filterCount()).toBe(0)
  })

  it('为子元素分配**融合**滤镜（id 带 lg-fused- 前缀）', async () => {
    const group = mount(
      '<lg-glass-group>' +
        '<lg-glass-button>确定</lg-glass-button>' +
        '<lg-glass-button>取消</lg-glass-button>' +
        '</lg-glass-group>',
    )
    const kids = layoutGroup(group, [
      { w: 80, h: 40 },
      { w: 80, h: 40 },
    ])
    await flush()
    // 触发组重算
    ;(group as any)._rebuild?.()
    await flush()

    const ids = kids.map((k) => k.getAttribute('data-lg-group-filter'))
    expect(ids[0]).toBeTruthy()
    expect(ids[1]).toBeTruthy()
    // 融合滤镜前缀 —— 若拿到 lg-filter- 说明走的是单形状路径，融合没生效
    expect(ids[0]!.startsWith('lg-fused-')).toBe(true)
    expect(ids[1]!.startsWith('lg-fused-')).toBe(true)
  })

  it('每个子元素拿到各自的滤镜 id（尺寸不同 → 贴图不同）', async () => {
    const group = mount(
      '<lg-glass-group>' +
        '<lg-glass-button>确定</lg-glass-button>' +
        '<lg-glass-button>取消</lg-glass-button>' +
        '</lg-glass-group>',
    )
    const kids = layoutGroup(group, [
      { w: 80, h: 40 },
      { w: 120, h: 40 },
    ])
    await flush()
    ;(group as any)._rebuild?.()
    await flush()

    const a = kids[0]!.getAttribute('data-lg-group-filter')
    const b = kids[1]!.getAttribute('data-lg-group-filter')
    expect(a).toBeTruthy()
    expect(b).toBeTruthy()
    expect(a).not.toBe(b)
  })

  it('子元素被标记为 refraction 并写入 --lg-filter', async () => {
    const group = mount(
      '<lg-glass-group><lg-glass-button>确定</lg-glass-button></lg-glass-group>',
    )
    const kids = layoutGroup(group, [{ w: 80, h: 40 }])
    await flush()
    ;(group as any)._rebuild?.()
    await flush()

    const k = kids[0]!
    expect(k.getAttribute('data-support')).toBe('refraction')
    expect(k.style.getPropertyValue('--lg-filter')).toContain('url(#lg-fused-')
  })

  it('无子元素时不崩溃、不注册滤镜', async () => {
    const group = mount('<lg-glass-group></lg-glass-group>', { width: 400, height: 60 })
    await flush()
    expect(__filterCount()).toBe(0)
  })

  it('子元素尺寸为 0 时跳过，不产生无效滤镜', async () => {
    const group = mount(
      '<lg-glass-group><lg-glass-button>确定</lg-glass-button></lg-glass-group>',
    )
    stubRect(group, 400, 60)
    const kid = group.children[0] as HTMLElement
    stubRect(kid, 0, 0)
    await flush()
    ;(group as any)._rebuild?.()
    await flush()
    expect(__filterCount()).toBe(0)
  })

  it('smoothing 属性改变触发重算', async () => {
    const group = mount(
      '<lg-glass-group smoothing="10"><lg-glass-button>确定</lg-glass-button></lg-glass-group>',
    )
    layoutGroup(group, [{ w: 80, h: 40 }])
    await flush()
    ;(group as any)._rebuild?.()
    await flush()
    const first = __filterCount()

    group.setAttribute('smoothing', '60')
    await flush()
    ;(group as any)._rebuild?.()
    await flush()

    // 融合半径变了 → 贴图不同 → 新增一个滤镜
    expect(__filterCount()).toBeGreaterThan(first)
  })

  it('相同几何重复重算不会重复注册（缓存命中）', async () => {
    const group = mount(
      '<lg-glass-group><lg-glass-button>确定</lg-glass-button></lg-glass-group>',
    )
    layoutGroup(group, [{ w: 80, h: 40 }])
    await flush()
    ;(group as any)._rebuild?.()
    await flush()
    const first = __filterCount()

    ;(group as any)._rebuild?.()
    await flush()

    expect(__filterCount()).toBe(first)
  })
})
