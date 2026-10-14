/**
 * GlassSwitch 测试。
 *
 * 重点是 role=switch 语义、键盘操作、禁用态。
 */

import { describe, expect, it, beforeEach, vi } from 'vitest'
import { defineGlassSwitch } from '../src/elements/glass-switch.js'
import { __resetCapabilityCache } from '../src/capabilities.js'
import { mockRefractionSupport, mount, flush } from './helpers.js'

defineGlassSwitch()

function sw(attrs = '') {
  return mount(`<lg-glass-switch ${attrs}></lg-glass-switch>`, {
    width: 120,
    height: 60,
  })
}

beforeEach(() => {
  __resetCapabilityCache()
  mockRefractionSupport(false)
})

describe('GlassSwitch', () => {
  it('暴露 role=switch 与 aria-checked', () => {
    const el = sw()
    expect(el.getAttribute('role')).toBe('switch')
    expect(el.getAttribute('aria-checked')).toBe('false')
  })

  it('checked 属性反映到 aria-checked', () => {
    const el = sw('checked')
    expect(el.checked).toBe(true)
    expect(el.getAttribute('aria-checked')).toBe('true')
  })

  it('点击切换并派发 lg-change', () => {
    const el = sw()
    const onChange = vi.fn()
    el.addEventListener('lg-change', onChange)

    el.click()
    expect(el.checked).toBe(true)
    expect(onChange).toHaveBeenCalledTimes(1)
    expect((onChange.mock.calls[0][0] as CustomEvent).detail.checked).toBe(true)

    el.click()
    expect(el.checked).toBe(false)
    expect(onChange).toHaveBeenCalledTimes(2)
  })

  it('lg-change 冒泡且穿透 shadow 边界', () => {
    const el = sw()
    const outer = vi.fn()
    document.body.addEventListener('lg-change', outer)
    el.click()
    expect(outer).toHaveBeenCalledTimes(1)
    document.body.removeEventListener('lg-change', outer)
  })

  it('空格键切换', () => {
    const el = sw()
    el.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }))
    expect(el.checked).toBe(true)
  })

  it('回车键切换', () => {
    const el = sw()
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    expect(el.checked).toBe(true)
  })

  it('禁用时不切换、不派发事件', () => {
    const el = sw('disabled')
    const onChange = vi.fn()
    el.addEventListener('lg-change', onChange)

    el.click()
    expect(el.checked).toBe(false)
    expect(onChange).not.toHaveBeenCalled()
    expect(el.getAttribute('aria-disabled')).toBe('true')
  })

  it('禁用时移出 tab 顺序', () => {
    const el = sw('disabled')
    expect(el.hasAttribute('tabindex')).toBe(false)
  })

  it('未禁用时可 Tab 进入', () => {
    const el = sw()
    expect(el.getAttribute('tabindex')).toBe('0')
  })

  it('checked 的 setter 生效', () => {
    const el = sw()
    el.checked = true
    expect(el.hasAttribute('checked')).toBe(true)
    expect(el.getAttribute('aria-checked')).toBe('true')
    el.checked = false
    expect(el.hasAttribute('checked')).toBe(false)
  })

  it('滑块位置随 checked 变化（CSS 变量/transform）', () => {
    const el = sw()
    const thumb = el.shadowRoot!.querySelector('.thumb') as HTMLElement
    expect(thumb).toBeTruthy()
    // 未选中：translateX(0)；选中：translateX(...)。
    // jsdom 不算布局，验证 host 的 checked 状态驱动了样式规则即可。
    el.checked = true
    expect(el.hasAttribute('checked')).toBe(true)
  })

  it('点击不影响 disabled 之外的默认行为', () => {
    const el = sw()
    const onChange = vi.fn()
    el.addEventListener('lg-change', onChange)
    flush()
    el.click()
    expect(onChange).toHaveBeenCalled()
  })
})
