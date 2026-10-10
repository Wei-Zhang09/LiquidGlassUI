/**
 * <lg-glass-button> —— 可交互玻璃按钮。
 *
 * 交互态：hover / active / focus-visible / disabled。
 * hover 用 `@media (hover: hover)` 门控 —— 触屏设备不触发，
 * 避免"点一下留下悬停态"的经典移动端问题。
 */

import { GlassElementBase } from './glass-base.js'
import { radius as radiusTokens } from '../generated/tokens.js'

const CSS = `
  :host {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: var(--lg-padding, 10px 20px);
    border-radius: var(--lg-radius, ${radiusTokens.full}px);
    background: var(--lg-surface, rgba(255,255,255,0.44));
    box-shadow:
      0 10px 30px var(--lg-shadow, rgba(33,49,62,0.16)),
      inset 1px 1px 0 var(--lg-highlight, rgba(255,255,255,0.5));
    font: 500 14px/1.2 system-ui, "Segoe UI", sans-serif;
    color: var(--lg-fg, #1b2733);
    cursor: pointer;
    user-select: none;
    transition: transform var(--lg-motion, 250ms) var(--lg-easing, ease),
                box-shadow var(--lg-motion, 250ms) var(--lg-easing, ease),
                background var(--lg-motion, 250ms) var(--lg-easing, ease);
  }

  /* hover 仅对指针设备生效 */
  @media (hover: hover) {
    :host(:not([disabled]):hover) {
      background: var(--lg-surface-hover, rgba(255,255,255,0.58));
      box-shadow:
        0 16px 44px var(--lg-shadow, rgba(33,49,62,0.22)),
        inset 1px 1px 0 var(--lg-highlight, rgba(255,255,255,0.62));
      transform: translateY(-1px);
    }
  }

  :host(:not([disabled]):active) {
    transform: scale(0.97);
  }

  :host([disabled]) {
    cursor: not-allowed;
    opacity: 0.5;
  }

  /* 键盘可达性：仅在键盘聚焦时显示轮廓 */
  :host(:focus-visible) {
    outline: 2px solid var(--lg-focus, rgba(0, 122, 255, 0.75));
    outline-offset: 2px;
  }

  :host([data-variant="primary"]) {
    --lg-surface: rgba(0, 122, 255, 0.72);
    --lg-fg: #ffffff;
    --lg-surface-hover: rgba(0, 122, 255, 0.84);
  }

  :host([data-variant="danger"]) {
    --lg-surface: rgba(210, 69, 59, 0.72);
    --lg-fg: #ffffff;
    --lg-surface-hover: rgba(210, 69, 59, 0.84);
  }
`

export class GlassButtonElement extends GlassElementBase {
  static get observedAttributes() {
    return ['radius', 'level', 'surface', 'theme', 'disabled', 'variant']
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
    if (!this.hasAttribute('tabindex') && !this.hasAttribute('disabled')) {
      this.setAttribute('tabindex', '0')
    }
    this.setAttribute('role', 'button')
    this.addEventListener('keydown', this._onKeyDown)
    this.addEventListener('click', this._onClick)
  }

  disconnectedCallback() {
    this.teardownGlass()
    this.removeEventListener('keydown', this._onKeyDown)
    this.removeEventListener('click', this._onClick)
  }

  attributeChangedCallback(name: string, oldV: string | null, newV: string | null) {
    this.handleAttribute(name, oldV, newV)
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

  /** 键盘可达：Enter / Space 触发 click，与原生 button 行为一致。 */
  private _onKeyDown = (e: KeyboardEvent) => {
    if (this.hasAttribute('disabled')) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      this.click()
    }
  }

  /** 禁用时吞掉点击，避免事件冒泡到父级。 */
  private _onClick = (e: MouseEvent) => {
    if (this.hasAttribute('disabled')) {
      e.stopImmediatePropagation()
      e.preventDefault()
    }
  }
}

export function defineGlassButton(tag = 'lg-glass-button') {
  if (typeof customElements === 'undefined') return
  if (!customElements.get(tag)) customElements.define(tag, GlassButtonElement)
}
