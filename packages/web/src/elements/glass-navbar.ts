/**
 * <lg-glass-navbar> —— 顶部导航栏（Web / 桌面形态）。
 *
 * 平台适配：移动端的等价物是底部标签栏 <lg-glass-bottombar>。
 * 差异不只是位置 ——
 *  - 顶部导航：水平排布、常驻吸顶、可含 logo/搜索/操作区
 *  - 底部标签栏：条目等宽、图标在上文字在下、拇指可达
 */

import { GlassElementBase } from './glass-base.js'
import { radius as radiusTokens } from '../generated/tokens.js'

const CSS = `
  :host {
    display: flex;
    align-items: center;
    gap: var(--lg-gap, 16px);
    padding: var(--lg-padding, 12px 20px);
    border-radius: var(--lg-radius, ${radiusTokens.lg}px);
    background: var(--lg-surface, rgba(255,255,255,0.44));
    box-shadow:
      0 14px 44px var(--lg-shadow, rgba(33,49,62,0.18)),
      inset 1px 1px 0 var(--lg-highlight, rgba(255,255,255,0.5));
    color: var(--lg-fg, #1b2733);
    font: 500 14px/1.2 system-ui, "Segoe UI", sans-serif;
  }

  /* 吸顶模式：贴在滚动容器顶部 */
  :host([sticky]) {
    position: sticky;
    top: var(--lg-sticky-top, 0px);
    z-index: 10;
  }

  .brand {
    font-weight: 600;
    font-size: 15px;
    white-space: nowrap;
  }

  .items {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-left: auto;
  }

  ::slotted(a), ::slotted(button) {
    color: inherit;
    text-decoration: none;
  }

  /* 导航条目：指针设备才有悬停态 */
  @media (hover: hover) {
    .items ::slotted(*) {
      transition: background var(--lg-motion, 250ms) var(--lg-easing, ease);
    }
  }
`

export class GlassNavBarElement extends GlassElementBase {
  static get observedAttributes() {
    return ['radius', 'level', 'surface', 'theme', 'brand', 'sticky']
  }

  private _brand!: HTMLSpanElement

  protected get componentCss(): string {
    return CSS
  }

  constructor() {
    super()
    this.setupShadow()

    this._brand = document.createElement('span')
    this._brand.className = 'brand'

    const items = document.createElement('div')
    items.className = 'items'
    items.append(document.createElement('slot'))

    this.shadowRoot!.append(this._brand, items)
  }

  connectedCallback() {
    this.initGlass('regular')
    this._syncBrand()
  }

  disconnectedCallback() {
    this.teardownGlass()
  }

  attributeChangedCallback(name: string, oldV: string | null, newV: string | null) {
    this.handleAttribute(name, oldV, newV)
    if (name === 'brand') this._syncBrand()
  }

  private _syncBrand() {
    if (!this._brand) return
    const text = this.getAttribute('brand') ?? ''
    this._brand.textContent = text
    this._brand.style.display = text ? '' : 'none'
  }
}

export function defineGlassNavBar(tag = 'lg-glass-navbar') {
  if (typeof customElements === 'undefined') return
  if (!customElements.get(tag)) customElements.define(tag, GlassNavBarElement)
}
