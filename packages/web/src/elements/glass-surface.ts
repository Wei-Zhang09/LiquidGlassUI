/**
 * <lg-glass-surface> —— 液态玻璃基础面。
 *
 * 框架无关；React 封装见 packages/web/src/react/GlassSurface.tsx。
 * 共享逻辑（降级阶梯、主题、滤镜重建）在 GlassElementBase。
 */

import { GlassElementBase } from './glass-base.js'
import { radius as radiusTokens } from '../generated/tokens.js'

const CSS = `
  :host {
    display: inline-block;
    border-radius: var(--lg-radius, ${radiusTokens.lg}px);
    background: var(--lg-surface, rgba(255,255,255,0.44));
    box-shadow:
      0 18px 55px var(--lg-shadow, rgba(33,49,62,0.18)),
      inset 1px 1px 0 var(--lg-highlight, rgba(255,255,255,0.5)),
      inset -1px -1px 0 var(--lg-inner-shadow, rgba(103,127,151,0.1));
    transition: transform var(--lg-motion, 250ms) var(--lg-easing, ease),
                box-shadow var(--lg-motion, 250ms) var(--lg-easing, ease);
  }
`

export class GlassSurfaceElement extends GlassElementBase {
  static get observedAttributes() {
    return ['radius', 'level', 'surface', 'theme']
  }

  protected get componentCss(): string {
    return CSS
  }

  protected override get geometryAttributes(): string[] {
    return ['surface']
  }

  constructor() {
    super()
    this.setupShadow()
    this.shadowRoot!.append(document.createElement('slot'))
  }

  connectedCallback() {
    this.initGlass('regular')
  }

  disconnectedCallback() {
    this.teardownGlass()
  }

  attributeChangedCallback(name: string, oldV: string | null, newV: string | null) {
    this.handleAttribute(name, oldV, newV)
  }
}

export function defineGlassSurface(tag = 'lg-glass-surface') {
  if (typeof customElements === 'undefined') return
  if (!customElements.get(tag)) customElements.define(tag, GlassSurfaceElement)
}
