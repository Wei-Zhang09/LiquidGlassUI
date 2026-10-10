/**
 * GlassDialog 测试。
 *
 * 重点是**可访问性**：焦点陷阱、焦点归还、ESC、滚动锁定。
 * 这些逻辑最容易做错，也最难在真实浏览器里自动化验证。
 */

import { describe, expect, it, beforeEach, vi } from 'vitest'
import { defineGlassDialog } from '../src/elements/glass-dialog.js'
import { mount, flush } from './helpers.js'

defineGlassDialog()

function dialogWithButtons() {
  return mount(`
    <lg-glass-dialog heading="确认删除">
      <p>此操作不可撤销。</p>
      <lg-glass-button slot="footer">取消</lg-glass-button>
      <lg-glass-button slot="footer">删除</lg-glass-button>
    </lg-glass-dialog>
  `)
}

/** 在面板内造几个可聚焦元素（shadow DOM 内查询用）。 */
function seedFocusables(dlg: HTMLElement): HTMLElement[] {
  const panel = dlg.shadowRoot!.querySelector('.panel') as HTMLElement
  const made: HTMLElement[] = []
  for (let i = 0; i < 3; i++) {
    const b = document.createElement('button')
    b.textContent = `b${i}`
    panel.append(b)
    made.push(b)
  }
  return made
}

describe('GlassDialog', () => {
  beforeEach(() => {
    document.body.style.overflow = ''
  })

  it('默认关闭（无 open 属性）', async () => {
    const dlg = dialogWithButtons()
    await flush()
    expect(dlg.hasAttribute('open')).toBe(false)
  })

  it('open 属性控制显隐', async () => {
    const dlg = dialogWithButtons()
    await flush()
    dlg.setAttribute('open', '')
    await flush()
    expect(dlg.hasAttribute('open')).toBe(true)
  })

  it('role=dialog 且 aria-modal=true', async () => {
    const dlg = dialogWithButtons()
    await flush()
    const panel = dlg.shadowRoot!.querySelector('.panel')!
    expect(panel.getAttribute('role')).toBe('dialog')
    expect(panel.getAttribute('aria-modal')).toBe('true')
  })

  it('heading 属性渲染到标题并作为 aria-label', async () => {
    const dlg = dialogWithButtons()
    await flush()
    const panel = dlg.shadowRoot!.querySelector('.panel')!
    expect(dlg.shadowRoot!.querySelector('.heading')!.textContent).toBe('确认删除')
    expect(panel.getAttribute('aria-label')).toBe('确认删除')
  })

  it('打开时锁定页面滚动', async () => {
    const dlg = dialogWithButtons()
    await flush()
    dlg.setAttribute('open', '')
    await flush()
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('关闭时恢复原有滚动设置', async () => {
    document.body.style.overflow = 'auto'
    const dlg = dialogWithButtons()
    await flush()

    dlg.setAttribute('open', '')
    await flush()
    expect(document.body.style.overflow).toBe('hidden')

    dlg.removeAttribute('open')
    await flush()
    expect(document.body.style.overflow).toBe('auto')
  })

  it('打开时把焦点移入对话框内的第一个可聚焦元素', async () => {
    const dlg = dialogWithButtons()
    await flush()
    const btns = seedFocusables(dlg)

    dlg.setAttribute('open', '')
    await flush()

    expect(document.activeElement === btns[0] || dlg.shadowRoot!.activeElement === btns[0]).toBe(true)
  })

  it('关闭时把焦点归还给打开前的元素', async () => {
    const trigger = document.createElement('button')
    trigger.textContent = '触发'
    document.body.append(trigger)
    trigger.focus()
    expect(document.activeElement).toBe(trigger)

    const dlg = dialogWithButtons()
    await flush()
    seedFocusables(dlg)

    dlg.setAttribute('open', '')
    await flush()
    expect(document.activeElement).not.toBe(trigger)

    dlg.removeAttribute('open')
    await flush()
    expect(document.activeElement).toBe(trigger)
  })

  it('ESC 关闭并派发 lg-close', async () => {
    const dlg = dialogWithButtons()
    await flush()
    dlg.setAttribute('open', '')
    await flush()

    const spy = vi.fn()
    dlg.addEventListener('lg-close', spy)

    const panel = dlg.shadowRoot!.querySelector('.panel') as HTMLElement
    panel.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))

    expect(dlg.hasAttribute('open')).toBe(false)
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('点击遮罩关闭，但点击面板内部不关闭', async () => {
    const dlg = dialogWithButtons()
    await flush()
    dlg.setAttribute('open', '')
    await flush()

    const panel = dlg.shadowRoot!.querySelector('.panel') as HTMLElement
    panel.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    expect(dlg.hasAttribute('open')).toBe(true)

    const overlay = dlg.shadowRoot!.querySelector('.overlay') as HTMLElement
    overlay.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    expect(dlg.hasAttribute('open')).toBe(false)
  })

  it('Tab 在末项时回到首项（焦点陷阱）', async () => {
    const dlg = dialogWithButtons()
    await flush()
    const btns = seedFocusables(dlg)
    dlg.setAttribute('open', '')
    await flush()

    const panel = dlg.shadowRoot!.querySelector('.panel') as HTMLElement
    const last = btns[btns.length - 1]!
    last.focus()

    const ev = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
    panel.dispatchEvent(ev)

    // 被拦截（preventDefault）且焦点回到首项
    expect(ev.defaultPrevented).toBe(true)
    expect(dlg.shadowRoot!.activeElement).toBe(btns[0])
  })

  it('Shift+Tab 在首项时跳到末项', async () => {
    const dlg = dialogWithButtons()
    await flush()
    const btns = seedFocusables(dlg)
    dlg.setAttribute('open', '')
    await flush()

    const panel = dlg.shadowRoot!.querySelector('.panel') as HTMLElement
    btns[0]!.focus()

    const ev = new KeyboardEvent('keydown', {
      key: 'Tab', shiftKey: true, bubbles: true, cancelable: true,
    })
    panel.dispatchEvent(ev)

    expect(ev.defaultPrevented).toBe(true)
    expect(dlg.shadowRoot!.activeElement).toBe(btns[btns.length - 1])
  })

  it('中间项按 Tab 不被拦截（正常前进）', async () => {
    const dlg = dialogWithButtons()
    await flush()
    const btns = seedFocusables(dlg)
    dlg.setAttribute('open', '')
    await flush()

    const panel = dlg.shadowRoot!.querySelector('.panel') as HTMLElement
    btns[1]!.focus()

    const ev = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
    panel.dispatchEvent(ev)

    expect(ev.defaultPrevented).toBe(false)
  })

  it('重复设置 open 不会重复锁定/覆盖上次焦点记录', async () => {
    const trigger = document.createElement('button')
    document.body.append(trigger)
    trigger.focus()

    const dlg = dialogWithButtons()
    await flush()
    seedFocusables(dlg)

    dlg.setAttribute('open', '')
    await flush()
    // 再次写入同值属性
    dlg.setAttribute('open', '')
    await flush()

    dlg.removeAttribute('open')
    await flush()
    // 仍应归还给最初的触发元素
    expect(document.activeElement).toBe(trigger)
  })
})
