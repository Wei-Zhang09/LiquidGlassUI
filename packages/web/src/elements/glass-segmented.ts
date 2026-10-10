/**
 * <lg-glass-segmented> —— 玻璃分段控件。
 *
 * 平台适配：分段控件在 iOS / Web 都常见，是少数跨端语义一致的控件。
 * 触屏与指针设备的差异只在视觉反馈强度，交互模型相同（点选切换）。
 *
 * ## 键盘支持
 * 遵循 radiogroup 惯例：左右方向键在选项间移动，Home/End 跳首尾。
 * 用 roving tabindex —— 整组只有一个可 Tab 进入的项，避免 Tab 键
 * 在分段控件里逐个停留。
 *
 * ## 用法
 * ```html
 * <lg-glass-segmented value="day">
 *   <button data-value="day">日</button>
 *   <button data-value="week">周</button>
 *   <button data-value="month">月</button>
 * </lg-glass-segmented>
 * ```
 * 选中项由 `value` 属性决定；用户选择时派发 `lg-change` 事件（detail.value）。
 */

import { GlassElementBase } from './glass-base.js'
import { radius as radiusTokens } from '../generated/tokens.js'

const CSS = `
  :host {
    display: inline-flex;
    align-items: stretch;
    padding: 3px;
    gap: 2px;
    border-radius: var(--lg-radius, ${radiusTokens.md}px);
    background: var(--lg-surface, rgba(255,255,255,0.40));
    box-shadow:
      0 10px 30px var(--lg-shadow, rgba(33,49,62,0.14)),
      inset 1px 1px 0 var(--lg-highlight, rgba(255,255,255,0.5));
    color: var(--lg-fg, #1b2733);
    font: 500 13px/1.2 system-ui, "Segoe UI", sans-serif;
    user-select: none;
  }

  ::slotted(*) {
    flex: 1 1 auto;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 8px 16px;
    border: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    cursor: pointer;
    border-radius: calc(var(--lg-radius, ${radiusTokens.md}px) - 3px);
    transition: background var(--lg-motion, 250ms) var(--lg-easing, ease),
                box-shadow var(--lg-motion, 250ms) var(--lg-easing, ease);
    white-space: nowrap;
  }

  /* 选中态：一枚独立的浅色指示片 */
  ::slotted([aria-checked="true"]) {
    background: var(--lg-segment-active, rgba(255,255,255,0.72));
    box-shadow: 0 1px 4px rgba(20, 30, 40, 0.16);
    font-weight: 600;
  }

  /* 指针设备才有悬停反馈；触屏没有 hover 概念 */
  @media (hover: hover) {
    ::slotted(:not([aria-checked="true"]):hover) {
      background: var(--lg-segment-hover, rgba(255,255,255,0.34));
    }
  }

  ::slotted(:focus-visible) {
    outline: 2px solid var(--lg-focus, rgba(0, 122, 255, 0.75));
    outline-offset: -2px;
  }

  @media (prefers-reduced-motion: reduce) {
    ::slotted(*) { transition: none; }
  }
`

export class GlassSegmentedElement extends GlassElementBase {
  static get observedAttributes() {
    return ['radius', 'level', 'surface', 'theme', 'value']
  }

  protected get componentCss(): string {
    return CSS
  }

  constructor() {
    super()
    this.setupShadow()
    this.shadowRoot!.append(document.createElement('slot'))
  }

  connectedCallback() {
    this.initGlass('regular')
    this.setAttribute('role', 'radiogroup')
    this.addEventListener('click', this._onClick)
    this.addEventListener('keydown', this._onKeyDown)
    this._sync()
  }

  disconnectedCallback() {
    this.teardownGlass()
    this.removeEventListener('click', this._onClick)
    this.removeEventListener('keydown', this._onKeyDown)
  }

  attributeChangedCallback(name: string, oldV: string | null, newV: string | null) {
    this.handleAttribute(name, oldV, newV)
    if (name === 'value') this._sync()
  }

  private _items(): HTMLElement[] {
    return [...this.children] as HTMLElement[]
  }

  /** 当前选中值；未设置时取第一个。 */
  get value(): string {
    const v = this.getAttribute('value')
    if (v !== null) return v
    const first = this._items()[0]
    return first?.getAttribute('data-value') ?? first?.textContent?.trim() ?? ''
  }

  set value(v: string) {
    this.setAttribute('value', v)
  }

  /** 同步 aria 状态与 roving tabindex。 */
  private _sync() {
    const items = this._items()
    if (items.length === 0) return

    const current = this.value
    items.forEach((el, i) => {
      const v = el.getAttribute('data-value') ?? el.textContent?.trim() ?? ''
      const checked = v === current
      el.setAttribute('role', 'radio')
      el.setAttribute('aria-checked', String(checked))
      // roving tabindex：只有选中项可 Tab 进入，其余用方向键到达
      el.tabIndex = checked ? 0 : -1
      if (!checked && el.getAttribute('aria-checked') === 'true') {
        el.setAttribute('aria-checked', 'false')
      }
      void i
    })
  }

  private _onClick = (e: Event) => {
    const target = e.target as HTMLElement | null
    if (!target) return
    const item = this._items().find((el) => el === target || el.contains(target))
    if (!item) return
    this._select(item)
  }

  private _onKeyDown = (e: KeyboardEvent) => {
    const items = this._items()
    if (items.length === 0) return

    const idx = items.findIndex(
      (el) => el.getAttribute('data-value') === this.value ||
        el.textContent?.trim() === this.value,
    )
    const from = idx >= 0 ? idx : 0

    let next = -1
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        next = (from + 1) % items.length
        break
      case 'ArrowLeft':
      case 'ArrowUp':
        next = (from - 1 + items.length) % items.length
        break
      case 'Home':
        next = 0
        break
      case 'End':
        next = items.length - 1
        break
      default:
        return
    }

    e.preventDefault()
    const el = items[next]!
    this._select(el)
    el.focus()
  }

  private _select(el: HTMLElement) {
    const v = el.getAttribute('data-value') ?? el.textContent?.trim() ?? ''
    if (v === this.value) return
    this.setAttribute('value', v)
    this._sync()
    this.dispatchEvent(
      new CustomEvent('lg-change', { detail: { value: v }, bubbles: true, composed: true }),
    )
  }
}

export function defineGlassSegmented(tag = 'lg-glass-segmented') {
  if (typeof customElements === 'undefined') return
  if (!customElements.get(tag)) customElements.define(tag, GlassSegmentedElement)
}
