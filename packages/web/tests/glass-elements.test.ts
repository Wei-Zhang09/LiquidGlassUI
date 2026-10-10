/**
 * 降级阶梯与属性响应测试。
 *
 * 重点验证：**任何情况下都不会静默失败** ——
 * 组件必须落在 refraction / frost / solid 三档之一，
 * 且几何尺寸不足以构成边缘带时要主动降级，而不是留一块没效果的玻璃。
 */

import { describe, expect, it, beforeEach, vi } from 'vitest'
import { defineGlassSurface } from '../src/elements/glass-surface.js'
import { defineGlassCard } from '../src/elements/glass-card.js'
import { defineGlassNavBar } from '../src/elements/glass-navbar.js'
import { defineGlassBottomBar } from '../src/elements/glass-bottombar.js'
import { __resetFilterRegistry } from '../src/core/filter-registry.js'
import { __resetCapabilityCache } from '../src/capabilities.js'
import {
  mockRefractionSupport,
  mockFrostOnlySupport,
  mockNoSupport,
  mount,
  flush,
} from './helpers.js'

defineGlassSurface()
defineGlassCard()
defineGlassNavBar()
defineGlassBottomBar()

describe('降级阶梯', () => {
  beforeEach(() => {
    // 能力判断结果与滤镜注册表都是模块级缓存，必须逐个用例重置
    __resetCapabilityCache()
    __resetFilterRegistry()
  })

  it('Chromium → refraction', async () => {
    mockRefractionSupport()
    const el = mount('<lg-glass-surface></lg-glass-surface>', { width: 200, height: 60 })
    await flush()
    expect(el.getAttribute('data-support')).toBe('refraction')
  })

  it('Firefox → frost', async () => {
    mockFrostOnlySupport()
    const el = mount('<lg-glass-surface></lg-glass-surface>', { width: 200, height: 60 })
    await flush()
    expect(el.getAttribute('data-support')).toBe('frost')
  })

  it('都不支持 → solid', async () => {
    mockNoSupport()
    const el = mount('<lg-glass-surface></lg-glass-surface>', { width: 200, height: 60 })
    await flush()
    expect(el.getAttribute('data-support')).toBe('solid')
  })

  it('尺寸过小无法构成边缘带时，从 refraction 降级到 frost', async () => {
    mockRefractionSupport()
    const el = mount('<lg-glass-surface></lg-glass-surface>', { width: 2, height: 2 }) // 小于最小尺寸 4px
    await flush()
    // 不能留在 refraction —— 那会是一块没有效果的玻璃
    expect(el.getAttribute('data-support')).toBe('frost')
  })
})

describe('属性响应', () => {
  beforeEach(() => {
    __resetCapabilityCache()
    __resetFilterRegistry()
    mockRefractionSupport()
  })

  it('radius 属性写入 --lg-radius', async () => {
    const el = mount('<lg-glass-surface radius="42"></lg-glass-surface>', { width: 200, height: 60 })
    await flush()
    expect(el.style.getPropertyValue('--lg-radius')).toBe('42px')
  })

  it('theme=dark 切换颜色变量', async () => {
    const el = mount('<lg-glass-surface></lg-glass-surface>', { width: 200, height: 60 })
    await flush()
    const light = el.style.getPropertyValue('--lg-surface')

    el.setAttribute('theme', 'dark')
    await flush()
    const dark = el.style.getPropertyValue('--lg-surface')

    expect(light).not.toBe('')
    expect(dark).not.toBe('')
    expect(light).not.toBe(dark)
  })

  it('level 属性改变模糊强度', async () => {
    const el = mount('<lg-glass-surface level="regular"></lg-glass-surface>', { width: 200, height: 60 })
    await flush()
    const regular = el.style.getPropertyValue('--lg-blur')

    el.setAttribute('level', 'focused')
    await flush()
    const focused = el.style.getPropertyValue('--lg-blur')

    expect(regular).not.toBe(focused)
  })

  it('未指定 level 时默认为 regular', async () => {
    const el = mount('<lg-glass-surface></lg-glass-surface>', { width: 200, height: 60 })
    await flush()
    expect(el.getAttribute('level')).toBe('regular')
  })

  it('属性值未变化时不重复处理', async () => {
    const el = mount('<lg-glass-surface radius="30"></lg-glass-surface>', { width: 200, height: 60 })
    await flush()
    const before = el.style.getPropertyValue('--lg-radius')
    el.setAttribute('radius', '30') // 同值
    await flush()
    expect(el.style.getPropertyValue('--lg-radius')).toBe(before)
  })
})

describe('GlassCard', () => {
  beforeEach(() => {
    __resetCapabilityCache()
    __resetFilterRegistry()
    mockRefractionSupport()
  })

  it('title / desc 属性渲染到内部文本', async () => {
    const el = mount('<lg-glass-card title="标题" desc="描述"></lg-glass-card>', { width: 300, height: 180 })
    await flush()

    const title = el.shadowRoot!.querySelector('.title')!
    const desc = el.shadowRoot!.querySelector('.desc')!
    expect(title.textContent).toBe('标题')
    expect(desc.textContent).toBe('描述')
  })

  it('属性更新时同步文本', async () => {
    const el = mount('<lg-glass-card title="旧"></lg-glass-card>', { width: 300, height: 180 })
    await flush()

    el.setAttribute('title', '新')
    await flush()
    expect(el.shadowRoot!.querySelector('.title')!.textContent).toBe('新')
  })
})

describe('GlassNavBar', () => {
  beforeEach(() => {
    __resetCapabilityCache()
    __resetFilterRegistry()
    mockRefractionSupport()
  })

  it('brand 属性渲染品牌文字', async () => {
    const el = mount('<lg-glass-navbar brand="LiquidGlassUI"></lg-glass-navbar>', { width: 800, height: 56 })
    await flush()
    expect(el.shadowRoot!.querySelector('.brand')!.textContent).toBe('LiquidGlassUI')
  })

  it('无 brand 时品牌元素隐藏', async () => {
    const el = mount('<lg-glass-navbar></lg-glass-navbar>', { width: 800, height: 56 })
    await flush()
    const brand = el.shadowRoot!.querySelector('.brand') as HTMLElement
    expect(brand.style.display).toBe('none')
  })
})

describe('GlassBottomBar', () => {
  beforeEach(() => {
    __resetCapabilityCache()
    __resetFilterRegistry()
    mockRefractionSupport()
  })

  it('设置 role=tablist（移动端语义）', async () => {
    const el = mount('<lg-glass-bottombar></lg-glass-bottombar>', { width: 320, height: 64 })
    await flush()
    expect(el.getAttribute('role')).toBe('tablist')
  })

  it('同样遵循降级阶梯', async () => {
    mockFrostOnlySupport()
    const el = mount('<lg-glass-bottombar></lg-glass-bottombar>', { width: 320, height: 64 })
    await flush()
    expect(el.getAttribute('data-support')).toBe('frost')
  })
})
