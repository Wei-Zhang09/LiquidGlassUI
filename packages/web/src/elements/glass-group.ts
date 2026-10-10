/**
 * <lg-glass-group> —— 玻璃组：让相邻玻璃融成一团。
 *
 * 这是本库相对普通 glassmorphism 库的核心差异点。普通实现里相邻玻璃是**叠放**，
 * 各自沿自己的圆角弯折背景，交界处会出现两道互相打架的折射边。
 * 本组件改为：
 *
 *   1. 收集全部子玻璃的几何，算出它们的**平滑并集轮廓**（SDF smooth min）
 *   2. 为每个子元素生成位移贴图时，距离场与梯度都取自**融合后的整体轮廓**
 *   3. 于是折射方向在交界处连续，视觉上是一整块液体
 *
 * ## 用法
 * ```html
 * <lg-glass-group smoothing="24">
 *   <lg-glass-button>确定</lg-glass-button>
 *   <lg-glass-button>取消</lg-glass-button>
 * </lg-glass-group>
 * ```
 * 子元素**不再各自申请滤镜**，由组统一分配；组内元素通过 `data-lg-group-filter`
 * 属性拿到属于自己的滤镜 id。
 *
 * ## 已知限制
 * - 组的几何在布局完成后计算一次；子元素尺寸变化会触发重算（ResizeObserver）。
 * - 融合半径大于子元素间距时，两者会"粘"在一起 —— 这是设计意图，不是 bug。
 * - 暂不支持嵌套组。
 */

import { acquireFilter, registerFusedFilter } from '../core/filter-registry.js'
import { isGlassRefractionSupported, isBackdropFilterSupported } from '../capabilities.js'
import { radius as radiusTokens } from '../generated/tokens.js'
import { optical } from '../generated/tokens.js'
import { refractionProfile, surfaceFns } from '../refraction.js'
import type { RectShape } from '../sdf.js'

const CSS = `
  :host {
    display: inline-flex;
    align-items: center;
    gap: var(--lg-group-gap, 12px);
    position: relative;
  }

  ::slotted(*) {
    /* 子元素自身的玻璃样式由各自组件提供；组只负责滤镜分配 */
    position: relative;
  }
`

/** 子元素需要被组接管：清除自身的 data-support，改用组的滤镜。 */
const MANAGED_ATTR = 'data-lg-group-filter'

export class GlassGroupElement extends HTMLElement {
  static get observedAttributes() {
    return ['smoothing', 'radius', 'surface', 'theme']
  }

  private _root: ShadowRoot
  private _resizeObserver: ResizeObserver | null = null
  private _frame = 0

  constructor() {
    super()
    this._root = this.attachShadow({ mode: 'open' })
    const style = document.createElement('style')
    style.textContent = CSS
    this._root.append(style, document.createElement('slot'))
  }

  connectedCallback() {
    this._resolveSupport()
    this._resizeObserver = new ResizeObserver(() => this._scheduleRebuild())
    this._resizeObserver.observe(this)
    this._scheduleRebuild()
  }

  disconnectedCallback() {
    this._resizeObserver?.disconnect()
    this._resizeObserver = null
    if (this._frame) cancelAnimationFrame(this._frame)
  }

  attributeChangedCallback(name: string, oldV: string | null, newV: string | null) {
    if (oldV === newV) return
    if (name === 'theme') this._applyTheme()
    if (name === 'smoothing' || name === 'radius' || name === 'surface') this._scheduleRebuild()
  }

  private _applyTheme() {
    const theme = this.getAttribute('theme') === 'dark' ? 'dark' : 'light'
    this.setAttribute('data-theme', theme)
  }

  private _resolveSupport() {
    const support = isGlassRefractionSupported()
      ? 'refraction'
      : isBackdropFilterSupported()
        ? 'frost'
        : 'solid'
    this.setAttribute('data-support', support)
  }

  private _scheduleRebuild() {
    if (this._frame) cancelAnimationFrame(this._frame)
    this._frame = requestAnimationFrame(() => this._rebuild())
  }

  /** 子玻璃元素（即 lg-* 自定义元素）。 */
  private _children(): HTMLElement[] {
    return [...this.children].filter((c) => c.tagName.startsWith('LG-')) as HTMLElement[]
  }

  private _rebuild() {
    if (this.getAttribute('data-support') !== 'refraction') return

    const kids = this._children()
    if (kids.length === 0) return

    const groupRect = this.getBoundingClientRect()
    if (groupRect.width < 4 || groupRect.height < 4) return

    // 收集形状（组坐标系）
    const shapes: RectShape[] = []
    const childRects: { el: HTMLElement; x: number; y: number; w: number; h: number }[] = []
    for (const el of kids) {
      const r = el.getBoundingClientRect()
      if (r.width < 1 || r.height < 1) continue
      const x = r.left - groupRect.left
      const y = r.top - groupRect.top
      childRects.push({ el, x, y, w: r.width, h: r.height })
      const radiusAttr = el.getAttribute('radius')
      const radiusPx = radiusAttr ? parseFloat(radiusAttr) : radiusTokens.lg
      shapes.push({
        x,
        y,
        width: r.width,
        height: r.height,
        radius: Math.min(radiusPx, Math.min(r.width, r.height) / 2),
      })
    }
    if (shapes.length === 0) return

    const smoothingAttr = this.getAttribute('smoothing')
    const smoothing = smoothingAttr ? parseFloat(smoothingAttr) : optical.bezelWidth * 1.5

    const surfaceName = (this.getAttribute('surface') ?? 'convexSquircle') as keyof typeof surfaceFns
    const heightFn = surfaceFns[surfaceName] ?? surfaceFns.convexSquircle!
    const profile = refractionProfile(80, optical.bezelWidth, heightFn, optical.ior, 128)
    const maxDisp = Math.max(1, ...Array.from(profile, Math.abs))

    // 为每个子元素生成一份基于融合轮廓的滤镜
    for (const c of childRects) {
      const id = registerFusedFilter({
        width: Math.ceil(c.w),
        height: Math.ceil(c.h),
        offsetX: Math.round(c.x),
        offsetY: Math.round(c.y),
        shapes,
        smoothing,
        bezelWidth: optical.bezelWidth,
        profile,
        maxDisp,
      })
      if (!id) continue
      // 子元素自身不再走单形状折射，改用组分配的融合滤镜
      c.el.setAttribute('data-support', 'refraction')
      c.el.setAttribute(MANAGED_ATTR, id)
      c.el.style.setProperty('--lg-filter', `url(#${id})`)
    }
  }
}

export function defineGlassGroup(tag = 'lg-glass-group') {
  if (typeof customElements === 'undefined') return
  if (!customElements.get(tag)) customElements.define(tag, GlassGroupElement)
}
