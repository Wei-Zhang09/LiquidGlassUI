/**
 * 能力门控与降级阶梯测试。
 *
 * 这是整个库最容易踩坑的地方：Firefox 对 `backdrop-filter: url()` 返回 true
 * 但静默不渲染（实测确认），所以门控必须靠 UA 嗅探，不能靠 CSS.supports。
 */

import { describe, expect, it, beforeEach, vi } from 'vitest'
import {
  isGlassRefractionSupported,
  isBackdropFilterSupported,
  getGlassCapabilities,
  __resetCapabilityCache,
} from '../src/capabilities.js'
import { mockRefractionSupport, mockFrostOnlySupport, mockNoSupport } from './helpers.js'

describe('isGlassRefractionSupported', () => {
  beforeEach(() => {
    __resetCapabilityCache()
  })

  it('Chromium 判定为支持折射', () => {
    mockRefractionSupport()
    expect(isGlassRefractionSupported()).toBe(true)
  })

  it('Firefox 判定为不支持 —— 即便 CSS.supports 说支持', () => {
    mockFrostOnlySupport()
    // 这正是那个坑：Firefox 的 CSS.supports('backdrop-filter','url(#x)') 返回 true，
    // 但实际渲染时什么都不做。门控必须忽略这个信号。
    expect(CSS.supports('backdrop-filter', 'url(#x)')).toBe(true)
    expect(isGlassRefractionSupported()).toBe(false)
  })

  it('headless Chrome 的 UA 也能识别（HeadlessChrome/…）', () => {
    __resetCapabilityCache()
    vi.stubGlobal('navigator', {
      userAgent: 'Mozilla/5.0 HeadlessChrome/151.0.7922.34 Safari/537.36',
    })
    // 纯 /Chrome\// 正则会漏掉 HeadlessChrome，因此实现里优先看 userAgentData；
    // 这里没有 userAgentData，所以依赖 \bChrome\/ 的边界匹配
    expect(isGlassRefractionSupported()).toBe(true)
  })

  it('结果被缓存，UA 变化不再重新判断', () => {
    mockRefractionSupport()
    expect(isGlassRefractionSupported()).toBe(true)

    mockFrostOnlySupport()
    // 仍是缓存值 —— 这是有意的：UA 在页面生命周期内不会变
    expect(isGlassRefractionSupported()).toBe(true)

    __resetCapabilityCache()
    expect(isGlassRefractionSupported()).toBe(false)
  })

  it('无 navigator 环境（SSR）安全返回 false', () => {
    __resetCapabilityCache()
    vi.stubGlobal('navigator', undefined)
    expect(isGlassRefractionSupported()).toBe(false)
  })
})

describe('isBackdropFilterSupported', () => {
  beforeEach(() => __resetCapabilityCache())

  it('CSS.supports 为真时返回 true', () => {
    mockFrostOnlySupport()
    expect(isBackdropFilterSupported()).toBe(true)
  })

  it('CSS.supports 为假时返回 false', () => {
    mockNoSupport()
    expect(isBackdropFilterSupported()).toBe(false)
  })

  it('无 CSS 对象时安全返回 false', () => {
    vi.stubGlobal('CSS', undefined)
    expect(isBackdropFilterSupported()).toBe(false)
  })
})

describe('getGlassCapabilities', () => {
  beforeEach(() => __resetCapabilityCache())

  it('Chromium：refraction + backdropFilter 都为真', () => {
    mockRefractionSupport()
    const caps = getGlassCapabilities()
    expect(caps.refraction).toBe(true)
    expect(caps.backdropFilter).toBe(true)
  })

  it('Firefox：refraction 假、backdropFilter 真', () => {
    mockFrostOnlySupport()
    const caps = getGlassCapabilities()
    expect(caps.refraction).toBe(false)
    expect(caps.backdropFilter).toBe(true)
  })

  it('都不支持时两者皆假', () => {
    mockNoSupport()
    const caps = getGlassCapabilities()
    expect(caps.refraction).toBe(false)
    expect(caps.backdropFilter).toBe(false)
  })
})
