/**
 * <lg-glass-bottombar> —— 底部标签栏（移动端形态）。
 *
 * 平台适配：与 <lg-glass-navbar> 对应，但交互模型不同 ——
 *  - 条目等宽分布，拇指可达（顶部区域单手难触及）
 *  - 图标在上、文字在下，符合移动端惯例
 *  - **无 hover 态**：触屏没有悬停，只有选中态
 *
 * 用法：
 * ```html
 * <lg-glass-bottombar>
 *   <button data-icon="◎">概览</button>
 *   <button data-icon="◈" aria-selected="true">组件</button>
 *   <button data-icon="⚙">设置</button>
 * </lg-glass-bottombar>
 * ```
 * 子元素上用 `aria-selected="true"` 标记当前项。
 */

import { GlassElementBase } from './glass-base.js'
import { radius as radiusTokens } from '../generated/tokens.js'

const CSS = `
  :host {
    display: flex;
    align-items: stretch;
    padding: var(--lg-padding, 8px 10px);
    border-radius: var(--lg-radius, ${radiusTokens.lg}px);
    background: var(--lg-surface, rgba(255,255,255,0.44));
    box-shadow:
      0 -10px 40px var(--lg-shadow, rgba(33,49,62,0.16)),
      inset 1px 1px 0 var(--lg-highlight, rgba(255,255,255,0.5));
    color: var(--lg-fg, #1b2733);
    font: 500 11px/1.2 system-ui, "Segoe UI", sans-serif;
  }

  /* 贴底：移动端底部安全区 */
  :host([fixed]) {
    position: fixed;
    left: var(--lg-inset, 12px);
    right: var(--lg-inset, 12px);
    bottom: calc(var(--lg-safe-bottom, 0px) + var(--lg-inset, 12px));
    z-index: 20;
  }

  ::slotted(*) {
    flex: 1 1 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 6px 4px;
    border: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: center;
    text-decoration: none;
    cursor: pointer;
    border-radius: calc(var(--lg-radius, ${radiusTokens.lg}px) * 0.6);
    opacity: 0.62;
    transition: opacity var(--lg-motion, 250ms) var(--lg-easing, ease),
                background var(--lg-motion, 250ms) var(--lg-easing, ease);
  }

  /* 图标位（由 data-icon 渲染，避免绑定图标库） */
  ::slotted(*)::before {
    content: attr(data-icon);
    font-size: 17px;
    line-height: 1;
  }

  /* 选中态。触屏没有 hover，因此不做悬停样式。 */
  ::slotted([aria-selected="true"]) {
    opacity: 1;
    background: var(--lg-tint, rgba(255,255,255,0.5));
    font-weight: 600;
  }

  @media (prefers-reduced-motion: reduce) {
    ::slotted(*) { transition: none; }
  }
`

export class GlassBottomBarElement extends GlassElementBase {
  static get observedAttributes() {
    return ['radius', 'level', 'surface', 'theme', 'fixed']
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
    this.setAttribute('role', 'tablist')
  }

  disconnectedCallback() {
    this.teardownGlass()
  }

  attributeChangedCallback(name: string, oldV: string | null, newV: string | null) {
    this.handleAttribute(name, oldV, newV)
  }
}

export function defineGlassBottomBar(tag = 'lg-glass-bottombar') {
  if (typeof customElements === 'undefined') return
  if (!customElements.get(tag)) customElements.define(tag, GlassBottomBarElement)
}
