/**
 * <lg-glass-surface> —— 液态玻璃基础面（Web Component）。
 *
 * 框架无关：React / Vue / Svelte / 原生 HTML 都能直接用。
 * React 封装见 packages/web/src/react/GlassSurface.tsx。
 *
 * 降级阶梯：
 *   1. 支持折射（Chromium）→ SVG 位移滤镜作用于 backdrop
 *   2. 支持 backdrop-filter  → 磨砂玻璃（无弯曲）
 *   3. 都不支持              → 半透明实心背景
 */

import { acquireFilter } from '../core/filter-registry.js'
import { isBackdropFilterSupported, isGlassRefractionSupported } from '../capabilities.js'
import { radius as radiusTokens, color as colorTokens } from '../generated/tokens.js'

type SurfaceLevel = 'plain' | 'regular' | 'elevated' | 'focused'

const BASE_CSS = `
:host {
  display: inline-block;
  position: relative;
  box-sizing: border-box;
  border-radius: var(--lg-radius, ${radiusTokens.lg}px);
  background: var(--lg-surface, ${colorTokens.light.surface});
  box-shadow:
    0 18px 55px var(--lg-shadow, ${colorTokens.light.shadow}),
    inset 1px 1px 0 var(--lg-highlight, ${colorTokens.light.highlight}),
    inset -1px -1px 0 var(--lg-inner-shadow, ${colorTokens.light.innerShadow});
  transition: transform var(--lg-motion, 250ms) var(--lg-easing, ease),
              box-shadow var(--lg-motion, 250ms) var(--lg-easing, ease);
  isolation: isolate;
}
:host([data-level="regular"])  { --lg-blur: ${'var(--lg-blur-regular, 16px)'}; }
:host([data-level="elevated"]) { --lg-blur: var(--lg-blur-heavy, 30px); }
:host([data-level="focused"])  { --lg-blur: var(--lg-blur-heavy, 30px); }
:host([data-level="plain"])    { --lg-blur: var(--lg-blur-none, 0px); }

/* 降级 2：磨砂 */
:host([data-support="frost"]) {
  backdrop-filter: blur(var(--lg-blur, 16px)) saturate(1.4);
  -webkit-backdrop-filter: blur(var(--lg-blur, 16px)) saturate(1.4);
}

/* 降级 1：真折射。模糊与位移都在 SVG 滤镜内部完成，这里只引用它。 */
:host([data-support="refraction"]) {
  backdrop-filter: var(--lg-filter);
}

/* 降级 3：实心 */
:host([data-support="solid"]) {
  background: var(--lg-surface-solid, rgba(255, 255, 255, 0.88));
}

/* 边缘高光：渐变而非实心边框 */
:host::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  background: linear-gradient(
    var(--lg-light-angle, 45deg),
    transparent 0%,
    var(--lg-highlight, rgba(255,255,255,0.5)) 42%,
    transparent 72%
  );
  opacity: 0.55;
  mix-blend-mode: screen;
}

@media (prefers-reduced-motion: reduce) {
  :host { transition: none; }
}
`

export class GlassSurfaceElement extends HTMLElement {
  static get observedAttributes() {
    return ['radius', 'level', 'interactive', 'surface', 'theme']
  }

  private _root: ShadowRoot
  private _resizeObserver: ResizeObserver | null = null
  private _frame = 0
  private _filterId: string | null = null

  constructor() {
    super()
    this._root = this.attachShadow({ mode: 'open' })
    const style = document.createElement('style')
    style.textContent = BASE_CSS
    const slot = document.createElement('slot')
    this._root.append(style, slot)
  }

  connectedCallback() {
    if (!this.hasAttribute('level')) this.setAttribute('level', 'regular')
    this._applyTheme()
    this._applyRadius()
    this._resolveSupport()
    this._resizeObserver = new ResizeObserver(() => this._scheduleBuild())
    this._resizeObserver.observe(this)
    this._scheduleBuild()
  }

  disconnectedCallback() {
    this._resizeObserver?.disconnect()
    this._resizeObserver = null
    if (this._frame) cancelAnimationFrame(this._frame)
  }

  attributeChangedCallback(name: string, oldV: string | null, newV: string | null) {
    if (oldV === newV) return
    if (name === 'radius') this._applyRadius()
    if (name === 'theme') this._applyTheme()
    if (name === 'surface' || name === 'level') this._scheduleBuild()
  }

  private _applyRadius() {
    const r = this.getAttribute('radius')
    const px = r ? `${parseFloat(r)}px` : `${radiusTokens.lg}px`
    this.style.setProperty('--lg-radius', px)
  }

  private _applyTheme() {
    const theme = this.getAttribute('theme') === 'dark' ? 'dark' : 'light'
    const c = colorTokens[theme]
    this.style.setProperty('--lg-surface', c.surface)
    this.style.setProperty('--lg-shadow', c.shadow)
    this.style.setProperty('--lg-highlight', c.highlight)
    this.style.setProperty('--lg-inner-shadow', c.innerShadow)
  }

  /** 决定走哪一级降级。这是"不静默失败"的关键。 */
  private _resolveSupport() {
    const support = isGlassRefractionSupported()
      ? 'refraction'
      : isBackdropFilterSupported()
        ? 'frost'
        : 'solid'
    this.setAttribute('data-support', support)
    return support
  }

  private _scheduleBuild() {
    if (this._frame) cancelAnimationFrame(this._frame)
    this._frame = requestAnimationFrame(() => this._build())
  }

  private _build() {
    const support = this.getAttribute('data-support')
    if (support !== 'refraction') return

    const rect = this.getBoundingClientRect()
    const w = Math.ceil(rect.width)
    const h = Math.ceil(rect.height)
    if (w < 4 || h < 4) return

    const radiusAttr = this.getAttribute('radius')
    const radiusPx = radiusAttr ? parseFloat(radiusAttr) : radiusTokens.lg
    const radius = Math.min(radiusPx, Math.min(w, h) / 2)

    const id = acquireFilter({
      width: w,
      height: h,
      radius,
      surface: this.getAttribute('surface') ?? 'convexSquircle',
    })
    if (!id) {
      // 几何尺寸不足以构成边缘带 → 退到磨砂，而不是留一块没效果的玻璃
      this.setAttribute('data-support', 'frost')
      return
    }
    if (id === this._filterId) return
    this._filterId = id
    this.style.setProperty('--lg-filter', `url(#${id})`)
  }
}

/** 幂等注册。 */
export function defineGlassSurface(tag = 'lg-glass-surface') {
  if (typeof customElements === 'undefined') return
  if (!customElements.get(tag)) customElements.define(tag, GlassSurfaceElement)
}
