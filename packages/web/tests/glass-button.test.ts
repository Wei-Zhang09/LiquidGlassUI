/**
 * GlassButton 交互测试：点击、键盘可达性、禁用态。
 *
 * 这些是"组件行为"而非"渲染效果"，因此用 jsdom 测试；
 * 真实折射由 tools/verify-web-showcase.py 验证。
 */

import { describe, expect, it, beforeEach, vi } from 'vitest'
import { defineGlassButton } from '../src/elements/glass-button.js'
import { mockRefractionSupport, mount, flush } from './helpers.js'

defineGlassButton()

describe('GlassButton', () => {
  beforeEach(() => {
    mockRefractionSupport()
  })

  it('点击触发 click 事件', async () => {
    const el = mount('<lg-glass-button>点我</lg-glass-button>')
    await flush()

    const spy = vi.fn()
    el.addEventListener('click', spy)
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('Enter 键触发 click（键盘可达）', async () => {
    const el = mount('<lg-glass-button>点我</lg-glass-button>')
    await flush()

    const spy = vi.fn()
    el.addEventListener('click', spy)
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))

    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('空格键触发 click', async () => {
    const el = mount('<lg-glass-button>点我</lg-glass-button>')
    await flush()

    const spy = vi.fn()
    el.addEventListener('click', spy)
    el.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }))

    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('其他按键不触发 click', async () => {
    const el = mount('<lg-glass-button>点我</lg-glass-button>')
    await flush()

    const spy = vi.fn()
    el.addEventListener('click', spy)
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }))

    expect(spy).not.toHaveBeenCalled()
  })

  it('禁用时点击被吞掉，且不冒泡到父级', async () => {
    const parent = document.createElement('div')
    document.body.append(parent)
    parent.innerHTML = '<lg-glass-button disabled>点我</lg-glass-button>'
    const el = parent.firstElementChild as HTMLElement
    await flush()

    const onSelf = vi.fn()
    const onParent = vi.fn()
    el.addEventListener('click', onSelf)
    parent.addEventListener('click', onParent)

    el.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(onSelf).not.toHaveBeenCalled()
    expect(onParent).not.toHaveBeenCalled()
  })

  it('禁用时键盘也不触发', async () => {
    const el = mount('<lg-glass-button disabled>点我</lg-glass-button>')
    await flush()

    const spy = vi.fn()
    el.addEventListener('click', spy)
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))

    expect(spy).not.toHaveBeenCalled()
  })

  it('可聚焦且 role=button', async () => {
    const el = mount('<lg-glass-button>点我</lg-glass-button>')
    await flush()

    expect(el.getAttribute('role')).toBe('button')
    expect(el.getAttribute('tabindex')).toBe('0')
  })

  it('禁用时移除 tabindex 并标记 aria-disabled', async () => {
    const el = mount('<lg-glass-button>点我</lg-glass-button>')
    await flush()

    el.setAttribute('disabled', '')
    await flush()

    expect(el.getAttribute('aria-disabled')).toBe('true')
    expect(el.hasAttribute('tabindex')).toBe(false)
  })

  it('解除禁用后恢复可聚焦', async () => {
    const el = mount('<lg-glass-button disabled>点我</lg-glass-button>')
    await flush()

    el.removeAttribute('disabled')
    await flush()

    expect(el.hasAttribute('aria-disabled')).toBe(false)
    expect(el.getAttribute('tabindex')).toBe('0')
  })
})
