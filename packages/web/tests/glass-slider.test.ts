/**
 * GlassSlider 测试。
 *
 * 重点是**指针事件统一**（鼠标与触摸同一套 pointerdown/move/up）
 * 和触屏特有的两个坑：滚动冲突（touch-action: none）与
 * 手指移出元素后丢事件（setPointerCapture）。
 */

import { describe, expect, it, beforeEach, vi } from 'vitest'
import { defineGlassSlider } from '../src/elements/glass-slider.js'
import { __resetCapabilityCache } from '../src/capabilities.js'
import { mockRefractionSupport, mount, flush } from './helpers.js'

defineGlassSlider()

function slider(attrs = '') {
  return mount(`<lg-glass-slider ${attrs}></lg-glass-slider>`, {
    width: 260,
    height: 60,
  })
}

/** 给 track 伪造一个 200px 宽的布局（jsdom 不做布局）。 */
function stubTrack(el: HTMLElement, left = 0, width = 200) {
  const track = el.shadowRoot!.querySelector('.track') as HTMLElement
  track.getBoundingClientRect = () =>
    ({ left, width, top: 0, height: 8, right: left + width, bottom: 8, x: left, y: 0, toJSON: () => ({}) }) as DOMRect
  return track
}

function pointer(type: string, clientX: number, pointerId = 1) {
  const e = new Event(type, { bubbles: true, cancelable: true }) as PointerEvent
  Object.defineProperties(e, {
    clientX: { value: clientX },
    pointerId: { value: pointerId },
  })
  return e
}

beforeEach(() => {
  __resetCapabilityCache()
  mockRefractionSupport(false)
})

describe('GlassSlider', () => {
  it('暴露 role=slider 与 aria 值', () => {
    const el = slider('min="0" max="100" value="40"')
    expect(el.getAttribute('role')).toBe('slider')
    expect(el.getAttribute('aria-valuemin')).toBe('0')
    expect(el.getAttribute('aria-valuemax')).toBe('100')
    expect(el.getAttribute('aria-valuenow')).toBe('40')
  })

  it('值被钳制在 [min, max] 内', () => {
    const el = slider('min="0" max="100" value="250"')
    expect(el.value).toBe(100)

    const el2 = slider('min="0" max="100" value="-30"')
    expect(el2.value).toBe(0)
  })

  it('值对齐到步长', () => {
    const el = slider('min="0" max="100" step="10"')
    el.value = 37
    expect(el.value).toBe(40)
  })

  it('默认 min=0 max=100 step=1', () => {
    const el = slider()
    expect(el.min).toBe(0)
    expect(el.max).toBe(100)
    expect(el.step).toBe(1)
  })

  it('指针按下设置值并派发 lg-change', () => {
    const el = slider('min="0" max="100" value="0"')
    stubTrack(el, 0, 200)
    const onChange = vi.fn()
    el.addEventListener('lg-change', onChange)

    // 点在 200px 轨道的 50% 处 → 值 50
    el.dispatchEvent(pointer('pointerdown', 100))
    expect(el.value).toBe(50)
    expect(onChange).toHaveBeenCalledTimes(1)
    expect((onChange.mock.calls[0][0] as CustomEvent).detail.value).toBe(50)
  })

  it('拖动时持续更新（pointermove）', () => {
    const el = slider('min="0" max="100" value="0"')
    stubTrack(el, 0, 200)

    el.dispatchEvent(pointer('pointerdown', 0))
    expect(el.value).toBe(0)

    el.dispatchEvent(pointer('pointermove', 50))
    expect(el.value).toBe(25)

    el.dispatchEvent(pointer('pointermove', 200))
    expect(el.value).toBe(100)
  })

  it('未按下时 pointermove 不改变值', () => {
    const el = slider('min="0" max="100" value="10"')
    stubTrack(el, 0, 200)
    el.dispatchEvent(pointer('pointermove', 100))
    expect(el.value).toBe(10)
  })

  it('pointerup 结束拖动，之后 move 不再改变值', () => {
    const el = slider('min="0" max="100" value="0"')
    stubTrack(el, 0, 200)

    el.dispatchEvent(pointer('pointerdown', 100))
    expect(el.value).toBe(50)
    el.dispatchEvent(pointer('pointerup', 100))
    el.dispatchEvent(pointer('pointermove', 200))
    expect(el.value).toBe(50)
  })

  it('拖动时捕获指针（触屏关键：手指移出元素仍能收到事件）', () => {
    const el = slider('min="0" max="100" value="0"')
    stubTrack(el, 0, 200)
    const capture = vi.fn()
    const release = vi.fn()
    el.setPointerCapture = capture
    el.releasePointerCapture = release
    ;(el as any).hasPointerCapture = () => true

    el.dispatchEvent(pointer('pointerdown', 50, 7))
    expect(capture).toHaveBeenCalledWith(7)

    el.dispatchEvent(pointer('pointerup', 50, 7))
    expect(release).toHaveBeenCalledWith(7)
  })

  it('拖动时设置 dragging 属性（视觉反馈）', () => {
    const el = slider('min="0" max="100" value="0"')
    stubTrack(el, 0, 200)
    el.dispatchEvent(pointer('pointerdown', 50))
    expect(el.hasAttribute('dragging')).toBe(true)
    el.dispatchEvent(pointer('pointerup', 50))
    expect(el.hasAttribute('dragging')).toBe(false)
  })

  it('触屏滚动冲突：CSS 声明 touch-action: none', () => {
    const el = slider()
    const css = (el.constructor as any).prototype.componentCss as string
    // 不做这一步，触屏拖动会被浏览器当成页面滚动，滑块根本拖不动
    expect(css).toContain('touch-action: none')
  })

  it('方向键步进', () => {
    const el = slider('min="0" max="100" step="5" value="50"')
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    expect(el.value).toBe(55)
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }))
    expect(el.value).toBe(50)
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }))
    expect(el.value).toBe(55)
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
    expect(el.value).toBe(50)
  })

  it('Home / End 跳到首尾', () => {
    const el = slider('min="0" max="100" value="50"')
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }))
    expect(el.value).toBe(0)
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }))
    expect(el.value).toBe(100)
  })

  it('PageUp / PageDown 走大步（范围的 10%）', () => {
    const el = slider('min="0" max="100" value="50"')
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageUp', bubbles: true }))
    expect(el.value).toBe(60)
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageDown', bubbles: true }))
    expect(el.value).toBe(50)
  })

  it('禁用时忽略指针与键盘', () => {
    const el = slider('min="0" max="100" value="10" disabled')
    stubTrack(el, 0, 200)
    el.dispatchEvent(pointer('pointerdown', 150))
    expect(el.value).toBe(10)
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }))
    expect(el.value).toBe(10)
    expect(el.getAttribute('aria-disabled')).toBe('true')
  })

  it('值相同时不重复派发事件', () => {
    const el = slider('min="0" max="100" value="50"')
    stubTrack(el, 0, 200)
    const onChange = vi.fn()
    el.addEventListener('lg-change', onChange)
    el.dispatchEvent(pointer('pointerdown', 100))
    expect(onChange).not.toHaveBeenCalled() // 100px/200px = 50，与现值相同
  })

  it('进度写入 CSS 变量驱动填充与滑块位置', () => {
    const el = slider('min="0" max="100" value="25"')
    flush()
    expect(el.style.getPropertyValue('--lg-slider-progress')).toBe('0.25')
  })
})
