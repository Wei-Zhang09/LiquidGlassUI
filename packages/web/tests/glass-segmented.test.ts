/**
 * GlassSegmented 测试。
 *
 * 重点是 roving tabindex 与键盘导航 —— 遵循 radiogroup 惯例：
 * 整组只有一个可 Tab 进入的项，其余用方向键到达。
 */

import { describe, expect, it, beforeEach, vi } from 'vitest'
import { defineGlassSegmented } from '../src/elements/glass-segmented.js'
import { __resetCapabilityCache } from '../src/capabilities.js'
import { mockRefractionSupport, mount, flush } from './helpers.js'

defineGlassSegmented()

function segmented(value = 'day') {
  return mount(`
    <lg-glass-segmented value="${value}">
      <button data-value="day">日</button>
      <button data-value="week">周</button>
      <button data-value="month">月</button>
    </lg-glass-segmented>
  `, { width: 260, height: 40 })
}

const items = (el: HTMLElement) => [...el.children] as HTMLElement[]
const checked = (el: HTMLElement) => el.getAttribute('aria-checked') === 'true'

describe('GlassSegmented', () => {
  beforeEach(() => {
    __resetCapabilityCache()
    mockRefractionSupport()
  })

  it('role=radiogroup，子项 role=radio', async () => {
    const el = segmented()
    await flush()
    expect(el.getAttribute('role')).toBe('radiogroup')
    for (const it of items(el)) expect(it.getAttribute('role')).toBe('radio')
  })

  it('value 属性决定选中项', async () => {
    const el = segmented('week')
    await flush()
    const [d, w, m] = items(el)
    expect(checked(d!)).toBe(false)
    expect(checked(w!)).toBe(true)
    expect(checked(m!)).toBe(false)
  })

  it('roving tabindex：只有选中项可 Tab 进入', async () => {
    const el = segmented('week')
    await flush()
    const [d, w, m] = items(el)
    expect(d!.tabIndex).toBe(-1)
    expect(w!.tabIndex).toBe(0)
    expect(m!.tabIndex).toBe(-1)
  })

  it('点击切换选中并派发 lg-change', async () => {
    const el = segmented('day')
    await flush()
    const spy = vi.fn()
    el.addEventListener('lg-change', spy)

    items(el)[2]!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await flush()

    expect(el.getAttribute('value')).toBe('month')
    expect(spy).toHaveBeenCalledTimes(1)
    expect((spy.mock.calls[0]![0] as CustomEvent).detail.value).toBe('month')
  })

  it('点击已选中项不派发事件', async () => {
    const el = segmented('day')
    await flush()
    const spy = vi.fn()
    el.addEventListener('lg-change', spy)

    items(el)[0]!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await flush()

    expect(spy).not.toHaveBeenCalled()
  })

  it('点击子元素内部的节点也能选中（事件委托）', async () => {
    const el = segmented('day')
    await flush()
    // 在第一个子项里塞一个 span，点它应视为点该选项
    const span = document.createElement('span')
    span.textContent = 'x'
    items(el)[1]!.append(span)

    span.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await flush()

    expect(el.getAttribute('value')).toBe('week')
  })

  it('ArrowRight 移到下一项', async () => {
    const el = segmented('day')
    await flush()
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    await flush()
    expect(el.getAttribute('value')).toBe('week')
  })

  it('ArrowRight 在末项回绕到首项', async () => {
    const el = segmented('month')
    await flush()
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    await flush()
    expect(el.getAttribute('value')).toBe('day')
  })

  it('ArrowLeft 在首项回绕到末项', async () => {
    const el = segmented('day')
    await flush()
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }))
    await flush()
    expect(el.getAttribute('value')).toBe('month')
  })

  it('Home / End 跳到首尾', async () => {
    const el = segmented('week')
    await flush()

    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }))
    await flush()
    expect(el.getAttribute('value')).toBe('month')

    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }))
    await flush()
    expect(el.getAttribute('value')).toBe('day')
  })

  it('其他按键不改变选中', async () => {
    const el = segmented('week')
    await flush()
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }))
    await flush()
    expect(el.getAttribute('value')).toBe('week')
  })

  it('value 属性变化时重新同步 aria 与 tabindex', async () => {
    const el = segmented('day')
    await flush()
    el.setAttribute('value', 'month')
    await flush()

    const [d, , m] = items(el)
    expect(checked(d!)).toBe(false)
    expect(d!.tabIndex).toBe(-1)
    expect(checked(m!)).toBe(true)
    expect(m!.tabIndex).toBe(0)
  })

  it('无 value 属性时默认选中第一项', async () => {
    const el = mount(
      '<lg-glass-segmented><button data-value="a">A</button><button data-value="b">B</button></lg-glass-segmented>',
      { width: 200, height: 40 },
    )
    await flush()
    const [a, b] = items(el)
    expect(checked(a!)).toBe(true)
    expect(a!.tabIndex).toBe(0)
    expect(checked(b!)).toBe(false)
  })

  it('空组不崩溃', async () => {
    const el = mount('<lg-glass-segmented></lg-glass-segmented>', { width: 200, height: 40 })
    await flush()
    expect(el.getAttribute('role')).toBe('radiogroup')
  })
})
