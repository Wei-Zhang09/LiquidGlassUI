/**
 * <lg-glass-card> —— 玻璃卡片。
 *
 * 与 GlassSurface 的区别：卡片是**块级、可容纳结构化内容**的容器，
 * 自带内边距与标题/描述插槽，用于内容分组而非单纯做材质底板。
 */

import { GlassElementBase } from './glass-base.js'
import { radius as radiusTokens } from '../generated/tokens.js'

const CSS = `
  :host {
    display: block;
    border-radius: var(--lg-radius, ${radiusTokens.xl}px);
    background: var(--lg-surface, rgba(255,255,255,0.44));
    box-shadow:
      0 18px 55px var(--lg-shadow, rgba(33,49,62,0.18)),
      inset 1px 1px 0 var(--lg-highlight, rgba(255,255,255,0.5)),
      inset -1px -1px 0 var(--lg-inner-shadow, rgba(103,127,151,0.1));
    color: var(--lg-fg, #1b2733);
    overflow: hidden;
    transition: box-shadow var(--lg-motion, 250ms) var(--lg-easing, ease);
  }

  .body {
    padding: var(--lg-padding, 24px 28px);
  }

  .title {
    font: 600 17px/1.35 system-ui, "Segoe UI", sans-serif;
    margin: 0 0 6px;
  }

  .desc {
    font: 400 13px/1.6 system-ui, "Segoe UI", sans-serif;
    opacity: 0.72;
    margin: 0;
  }

  .title:empty, .desc:empty { display: none; }

  /* 指针设备上轻微抬升 */
  @media (hover: hover) {
    :host([elevate]:hover) {
      box-shadow:
        0 28px 80px var(--lg-shadow, rgba(33,49,62,0.24)),
        inset 1px 1px 0 var(--lg-highlight, rgba(255,255,255,0.62));
      transform: translateY(-2px);
    }
  }
`

export class GlassCardElement extends GlassElementBase {
  static get observedAttributes() {
    return ['radius', 'level', 'surface', 'theme', 'title', 'desc']
  }

  private _title!: HTMLParagraphElement
  private _desc!: HTMLParagraphElement
  private _body!: HTMLDivElement

  protected get componentCss(): string {
    return CSS
  }

  constructor() {
    super()
    this.setupShadow()

    this._body = document.createElement('div')
    this._body.className = 'body'

    this._title = document.createElement('p')
    this._title.className = 'title'
    this._desc = document.createElement('p')
    this._desc.className = 'desc'

    const slot = document.createElement('slot')
    this._body.append(this._title, this._desc, slot)
    this.shadowRoot!.append(this._body)
  }

  connectedCallback() {
    this.initGlass('regular')
    this._syncText()
  }

  disconnectedCallback() {
    this.teardownGlass()
  }

  attributeChangedCallback(name: string, oldV: string | null, newV: string | null) {
    this.handleAttribute(name, oldV, newV)
    if (name === 'title' || name === 'desc') this._syncText()
  }

  private _syncText() {
    if (!this._title) return
    this._title.textContent = this.getAttribute('title') ?? ''
    this._desc.textContent = this.getAttribute('desc') ?? ''
  }
}

export function defineGlassCard(tag = 'lg-glass-card') {
  if (typeof customElements === 'undefined') return
  if (!customElements.get(tag)) customElements.define(tag, GlassCardElement)
}
