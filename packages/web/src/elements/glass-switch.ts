/**
 * <lg-glass-switch> —— 玻璃开关。
 *
 * 平台适配：开关是移动端高频控件（设置页），Web 上也常见。
 * 交互模型两端一致（点选切换），差异只在尺寸 —— 移动端需要更大的触摸目标。
 *
 * ## 可访问性
 * 用 `role="switch"` + `aria-checked`，符合 WAI-ARIA 规范。
 * 键盘：Space / Enter 切换（与原生 checkbox 一致）。
 *
 * ## 用法
 * ```html
 * <lg-glass-switch checked aria-label="启用通知"></lg-glass-switch>
 * ```
 * 用户切换时派发 `lg-change` 事件（detail.checked）。
 */

import { GlassElementBase } from './glass-base.js'

const CSS = `
  :host {
    display: inline-flex;
    align-items: center;
    box-sizing: border-box;
    width: var(--lg-switch-width, 52px);
    height: var(--lg-switch-height, 32px);
    padding: 3px;
    border-radius: 999px;
    background: var(--lg-surface, rgba(255,255,255,0.40));
    box-shadow:
      0 6px 18px var(--lg-shadow, rgba(33,49,62,0.14)),
      inset 1px 1px 0 var(--lg-highlight, rgba(255,255,255,0.5)),
      inset -1px -1px 0 var(--lg-inner-shadow, rgba(103,127,151,0.1));
    cursor: pointer;
    user-select: none;
    transition: background var(--lg-motion, 250ms) var(--lg-easing, ease);
  }

  :host([checked]) {
    background: var(--lg-switch-on, rgba(0, 122, 255, 0.62));
  }

  :host([disabled]) {
    cursor: not-allowed;
    opacity: 0.45;
  }

  :host(:focus-visible) {
    outline: 2px solid var(--lg-focus, rgba(0, 122, 255, 0.75));
    outline-offset: 2px;
  }

  /* 滑块：位置用 transform 而非 left，走合成层更顺滑 */
  .thumb {
    width: calc(var(--lg-switch-height, 32px) - 6px);
    height: calc(var(--lg-switch-height, 32px) - 6px);
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 1px 4px rgba(20, 30, 40, 0.28);
    transform: translateX(0);
    transition: transform var(--lg-motion, 250ms) var(--lg-easing, ease);
    will-change: transform;
  }

  :host([checked]) .thumb {
    transform: translateX(calc(var(--lg-switch-width, 52px) - var(--lg-switch-height, 32px)));
  }

  @media (prefers-reduced-motion: reduce) {
    :host, .thumb { transition: none; }
  }
`

export class GlassSwitchElement extends GlassElementBase {
  static get observedAttributes() {
    return ['radius', 'level', 'surface', 'theme', 'checked', 'disabled', 'aria-label']
  }

  private _thumb!: HTMLDivElement

  protected get componentCss(): string {
    return CSS
  }

  constructor() {
    super()
    this.setupShadow()
    this._thumb = document.createElement('div')
    this._thumb.className = 'thumb'
    this.shadowRoot!.append(this._thumb)
  }

  connectedCallback() {
    this.initGlass('regular')
    this.setAttribute('role', 'switch')
    if (!this.hasAttribute('tabindex') && !this.hasAttribute('disabled')) {
      this.setAttribute('tabindex', '0')
    }
    this._syncChecked()
    this.addEventListener('click', this._onClick)
    this.addEventListener('keydown', this._onKeyDown)
  }

  disconnectedCallback() {
    this.teardownGlass()
    this.removeEventListener('click', this._onClick)
    this.removeEventListener('keydown', this._onKeyDown)
  }

  attributeChangedCallback(name: string, oldV: string | null, newV: string | null) {
    this.handleAttribute(name, oldV, newV)
    if (name === 'checked') this._syncChecked()
    if (name === 'disabled') {
      if (newV !== null) {
        this.setAttribute('aria-disabled', 'true')
        this.removeAttribute('tabindex')
      } else {
        this.removeAttribute('aria-disabled')
        this.setAttribute('tabindex', '0')
      }
    }
  }

  get checked(): boolean {
    return this.hasAttribute('checked')
  }

  set checked(v: boolean) {
    if (v) this.setAttribute('checked', '')
    else this.removeAttribute('checked')
  }

  private _syncChecked() {
    // role=switch 用 aria-checked 暴露状态
    this.setAttribute('aria-checked', String(this.checked))
  }

  private _toggle() {
    if (this.hasAttribute('disabled')) return
    this.checked = !this.checked
    this.dispatchEvent(
      new CustomEvent('lg-change', {
        detail: { checked: this.checked },
        bubbles: true,
        composed: true,
      }),
    )
  }

  private _onClick = (e: MouseEvent) => {
    if (this.hasAttribute('disabled')) {
      e.stopImmediatePropagation()
      e.preventDefault()
      return
    }
    this._toggle()
  }

  private _onKeyDown = (e: KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      this._toggle()
    }
  }
}

export function defineGlassSwitch(tag = 'lg-glass-switch') {
  if (typeof customElements === 'undefined') return
  if (!customElements.get(tag)) customElements.define(tag, GlassSwitchElement)
}
