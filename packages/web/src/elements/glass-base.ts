/**
 * 玻璃元素的共享基类。
 *
 * 所有 `lg-*` 组件都共用同一套：
 *  - 降级阶梯（refraction / frost / solid）
 *  - 主题与圆角变量
 *  - 折射滤镜的尺寸监听与重建
 *
 * 子类只需提供 CSS 与自身的属性处理。
 */

import { acquireFilter } from '../core/filter-registry.js'
import { isBackdropFilterSupported, isGlassRefractionSupported } from '../capabilities.js'
import { radius as radiusTokens, color as colorTokens } from '../generated/tokens.js'

export type SupportLevel = 'refraction' | 'frost' | 'solid'

/** 所有玻璃元素共享的基础样式。子类把自己的 CSS 追加在后面。 */
export const SHARED_CSS = `
  :host {
    box-sizing: border-box;
    position: relative;
    isolation: isolate;
    -webkit-tap-highlight-color: transparent;
  }

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

  /**
   * 边缘高光 —— 用 **内阴影** 实现，不用 mask 环带。
   *
   * ⚠️⚠️ 为什么放弃 mask 方案（用户两次反馈「边缘有硬切」）：
   *
   * 之前用 mask: linear-gradient(...) content-box + mask-composite: exclude
   * 挖出一个 2.5px 的环带。问题在于：**mask 的边界是硬边**，
   * 在圆角处抗锯齿很弱，于是按钮上边缘左右各出现一条竖直接缝。
   * 实测 x=24..26 亮度突跳 +38 / **+55** / +16，肉眼就是「硬切」。
   *
   * 换成 inset box-shadow：浏览器对圆角内阴影做的是**沿轮廓的连续渐变**，
   * 天然没有起止点，也就不可能有接缝。
   * 用两层模拟迎光方向：左上亮、右下淡。
   */
  :host::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    pointer-events: none;
    background: none;
    /* 沿轮廓的一圈高光：左上强、右下弱，连续无接缝 */
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.9),
      inset 1px 0 0 rgba(255, 255, 255, 0.55),
      inset 0 -1px 0 rgba(255, 255, 255, 0.30),
      inset -1px 0 0 rgba(255, 255, 255, 0.22),
      inset 0 0 0 1px rgba(255, 255, 255, 0.18);
    opacity: 1;
    mix-blend-mode: screen;
    z-index: 1;
  }

  @media (prefers-reduced-motion: reduce) {
    :host { transition: none; }
  }
`

/**
 * 能构成折射边缘带的最小边长（px）。小于此值无法建滤镜，需降级。
 * 与 filter-registry 里的最小尺寸检查保持一致。
 */
const MIN_FILTER_SIZE = 4

/** 材质层级 → 模糊强度。与 Compose 端的 GlassLevel 对应。 */
/**
 * 材质层级 → 模糊强度。
 *
 * ⚠️ fallback 值必须与 tokens.json 里的 blur 值一致。
 * 原来写的是 8 / 16 / 30，而 token 是 2 / 4 / 12 ——
 * 一旦 CSS 变量没加载（或顺序问题），就会退回一个**大 4 倍**的模糊，
 * 直接变成磨砂玻璃。这种「值不一致」不会报错，只会静默变糊。
 *
 * 层级差异靠「模糊 + 表面填充」共同拉开（见 applyLevel）：
 *   plain    0px   完全通透
 *   regular  2px   轻微扩散
 *   elevated 6px   明显厚感
 *   focused  14px  最厚（模态/焦点态）
 */
export const LEVEL_BLUR: Record<string, string> = {
  plain: 'var(--lg-blur-none, 0px)',
  regular: 'var(--lg-blur-subtle, 2px)',
  elevated: 'var(--lg-blur-regular, 6px)',
  focused: 'var(--lg-blur-heavy, 14px)',
}

export abstract class GlassElementBase extends HTMLElement {
  protected _filterId: string | null = null
  private _resizeObserver: ResizeObserver | null = null
  private _frame = 0

  /** 子类返回自己的 CSS，会被追加到 SHARED_CSS 之后。 */
  protected abstract get componentCss(): string

  /** 子类需要重建滤镜的属性名（尺寸变化始终会触发重建）。 */
  protected get geometryAttributes(): string[] {
    return []
  }

  /** 子类需要响应但不影响滤镜的属性名。 */
  protected get styleAttributes(): string[] {
    return []
  }

  protected setupShadow(): void {
    const root = this.attachShadow({ mode: 'open' })
    const style = document.createElement('style')
    style.textContent = SHARED_CSS + this.componentCss
    root.append(style)
  }

  /** 子类在 connectedCallback 中调用，完成共享的初始化。 */
  protected initGlass(defaultLevel = 'regular'): void {
    if (!this.hasAttribute('level')) this.setAttribute('level', defaultLevel)
    this.applyTheme()
    this.applyLevel()
    this.applyRadius()
    this.resolveSupport()

    this._resizeObserver = new ResizeObserver(() => this.scheduleBuild())
    this._resizeObserver.observe(this)
    this.scheduleBuild()
  }

  protected teardownGlass(): void {
    this._resizeObserver?.disconnect()
    this._resizeObserver = null
    if (this._frame) cancelAnimationFrame(this._frame)
  }

  /** 子类在 attributeChangedCallback 中调用。 */
  protected handleAttribute(name: string, oldV: string | null, newV: string | null): void {
    if (oldV === newV) return
    if (name === 'radius') this.applyRadius()
    else if (name === 'theme') this.applyTheme()
    else if (name === 'level') {
      this.applyLevel()
      // 模糊强度变了 → 需要重新生成滤镜（缓存 key 含 blur）
      this.scheduleBuild()
    }
    if (this.geometryAttributes.includes(name)) this.scheduleBuild()
    if (this.styleAttributes.includes(name)) this.onStyleAttribute(name)
  }

  /** 子类可覆盖，处理自己的样式属性。 */
  protected onStyleAttribute(_name: string): void {}

  protected applyRadius(): void {
    const r = this.getAttribute('radius')
    this.style.setProperty('--lg-radius', r ? `${parseFloat(r)}px` : `${radiusTokens.lg}px`)
  }

  protected applyLevel(): void {
    const level = this.getAttribute('level') ?? 'regular'
    this.style.setProperty('--lg-blur', LEVEL_BLUR[level] ?? LEVEL_BLUR.regular!)
  }

  protected applyTheme(): void {
    const theme = this.getAttribute('theme') === 'dark' ? 'dark' : 'light'
    const c = colorTokens[theme]
    this.style.setProperty('--lg-surface', c.surface)
    this.style.setProperty('--lg-shadow', c.shadow)
    this.style.setProperty('--lg-highlight', c.highlight)
    this.style.setProperty('--lg-inner-shadow', c.innerShadow)
  }

  /** 决定走哪一级降级。这是「不静默失败」的关键。 */
  protected resolveSupport(): SupportLevel {
    const support: SupportLevel = isGlassRefractionSupported()
      ? 'refraction'
      : isBackdropFilterSupported()
        ? 'frost'
        : 'solid'
    this.setAttribute('data-support', support)
    return support
  }

  protected scheduleBuild(): void {
    if (this._frame) cancelAnimationFrame(this._frame)
    this._frame = requestAnimationFrame(() => this.build())
  }

  protected build(): void {
    if (this.getAttribute('data-support') !== 'refraction') return

    const rect = this.getBoundingClientRect()
    const w = Math.ceil(rect.width)
    const h = Math.ceil(rect.height)

    // 区分两种情况：
    //  - 0×0：元素**还没布局**（初始状态、或从 display:none 切回）。
    //    此时不能动 support 档位 —— ResizeObserver 稍后会再触发，
    //    若在这里降级，元素会永久停在 frost 且再也回不到 refraction。
    //  - 有尺寸但过小：真的构不成边缘带，降级到磨砂，
    //    否则会留下一块声称支持折射、实际什么都没画的玻璃（静默失败）。
    if (w <= 0 || h <= 0) return
    if (w < MIN_FILTER_SIZE || h < MIN_FILTER_SIZE) {
      this.setAttribute('data-support', 'frost')
      return
    }

    const radiusAttr = this.getAttribute('radius')
    const radiusPx = radiusAttr ? parseFloat(radiusAttr) : radiusTokens.lg
    const radius = Math.min(radiusPx, Math.min(w, h) / 2)

    /**
     * ⚠️ level 的模糊必须**传给滤镜**，否则四档完全一样。
     * 原来 --lg-blur 只设了 CSS 变量，但折射路径用的是
     * `backdrop-filter: url(#filter)` —— 模糊发生在 SVG 滤镜内部，
     * CSS 变量根本没人读。实测：四个 level 的中心像素完全相同（35.51）。
     */
    const level = this.getAttribute('level') ?? 'regular'
    const blurPx = parseFloat(LEVEL_BLUR[level]?.match(/([\d.]+)px/)?.[1] ?? '2')

    const id = acquireFilter({
      width: w,
      height: h,
      radius,
      surface: this.getAttribute('surface') ?? 'convexSquircle',
      blur: blurPx,
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
