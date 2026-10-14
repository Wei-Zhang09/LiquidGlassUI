/**
 * <lg-glass-slider> —— 玻璃滑块。
 *
 * 平台适配：滑块是移动端高频控件（音量、亮度、进度），
 * 也是**触屏与指针设备差异最大**的一个 —— 差异不在语义，在事件模型：
 *
 * | | 指针设备 | 触屏 |
 * |---|---|---|
 * | 拖动 | `mousemove` | `pointermove`（触摸事件） |
 * | 滚动冲突 | 无 | **有** —— 浏览器默认把拖动当滚动 |
 * | 解法 | — | `touch-action: none` 阻止浏览器接管 |
 *
 * 本组件用 Pointer Events 统一两端（`pointerdown/move/up`），
 * 并用 `touch-action: none` + `setPointerCapture` 解决触屏滚动冲突与
 * 手指移出元素后丢事件的问题。这是移动端滑块最容易踩的坑。
 *
 * ## 可访问性
 * `role="slider"` + `aria-valuemin/max/now`。
 * 键盘：←→（步进）、↑↓（步进）、Home/End（首尾）、PageUp/PageDown（大步）。
 *
 * ## 用法
 * ```html
 * <lg-glass-slider min="0" max="100" value="40" aria-label="音量"></lg-glass-slider>
 * ```
 * 值变化时派发 `lg-change` 事件（detail.value）。
 */

import { GlassElementBase } from './glass-base.js'

const CSS = `
  :host {
    display: inline-flex;
    align-items: center;
    box-sizing: border-box;
    width: var(--lg-slider-width, 220px);
    height: var(--lg-slider-height, 36px);
    /* 触屏关键：阻止浏览器把拖动解释为页面滚动 */
    touch-action: none;
    cursor: pointer;
    user-select: none;
  }

  :host([disabled]) {
    cursor: not-allowed;
    opacity: 0.45;
  }

  :host(:focus-visible) {
    outline: 2px solid var(--lg-focus, rgba(0, 122, 255, 0.75));
    outline-offset: 4px;
    border-radius: 999px;
  }

  .track {
    position: relative;
    width: 100%;
    height: var(--lg-slider-track-height, 8px);
    border-radius: 999px;
    background: var(--lg-surface, rgba(255,255,255,0.40));
    box-shadow:
      inset 1px 1px 0 var(--lg-highlight, rgba(255,255,255,0.5)),
      inset -1px -1px 0 var(--lg-inner-shadow, rgba(103,127,151,0.1));
    overflow: visible;
  }

  /* 已填充部分：用 scaleX 走合成层，避免每帧改 width 触发布局 */
  .fill {
    position: absolute;
    inset: 0;
    border-radius: 999px;
    background: var(--lg-slider-fill, rgba(0, 122, 255, 0.62));
    transform-origin: left center;
    transform: scaleX(var(--lg-slider-progress, 0));
    will-change: transform;
  }

  .thumb {
    position: absolute;
    top: 50%;
    width: var(--lg-slider-thumb, 22px);
    height: var(--lg-slider-thumb, 22px);
    margin-top: calc(var(--lg-slider-thumb, 22px) / -2);
    margin-left: calc(var(--lg-slider-thumb, 22px) / -2);
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 1px 5px rgba(20, 30, 40, 0.32);
    left: calc(var(--lg-slider-progress, 0) * 100%);
    will-change: left;
  }

  :host([dragging]) .thumb {
    box-shadow: 0 2px 10px rgba(20, 30, 40, 0.42);
  }

  @media (prefers-reduced-motion: reduce) {
    .fill, .thumb { transition: none; }
  }
`

export class GlassSliderElement extends GlassElementBase {
  static get observedAttributes() {
    return [
      'radius', 'level', 'surface', 'theme',
      'min', 'max', 'value', 'step', 'disabled', 'aria-label',
    ]
  }

  private _track!: HTMLDivElement
  private _fill!: HTMLDivElement
  private _thumb!: HTMLDivElement
  private _dragging = false

  protected get componentCss(): string {
    return CSS
  }

  constructor() {
    super()
    this.setupShadow()

    this._track = document.createElement('div')
    this._track.className = 'track'
    this._fill = document.createElement('div')
    this._fill.className = 'fill'
    this._thumb = document.createElement('div')
    this._thumb.className = 'thumb'
    this._track.append(this._fill, this._thumb)
    this.shadowRoot!.append(this._track)
  }

  connectedCallback() {
    this.initGlass('regular')
    this.setAttribute('role', 'slider')
    if (!this.hasAttribute('tabindex') && !this.hasAttribute('disabled')) {
      this.setAttribute('tabindex', '0')
    }
    this._syncAria()
    this._render()

    this.addEventListener('pointerdown', this._onPointerDown)
    this.addEventListener('pointermove', this._onPointerMove)
    this.addEventListener('pointerup', this._onPointerUp)
    this.addEventListener('pointercancel', this._onPointerUp)
    this.addEventListener('keydown', this._onKeyDown)
  }

  disconnectedCallback() {
    this.teardownGlass()
    this.removeEventListener('pointerdown', this._onPointerDown)
    this.removeEventListener('pointermove', this._onPointerMove)
    this.removeEventListener('pointerup', this._onPointerUp)
    this.removeEventListener('pointercancel', this._onPointerUp)
    this.removeEventListener('keydown', this._onKeyDown)
  }

  attributeChangedCallback(name: string, oldV: string | null, newV: string | null) {
    this.handleAttribute(name, oldV, newV)
    if (name === 'min' || name === 'max' || name === 'value' || name === 'step') {
      this._render()
      this._syncAria()
    }
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

  // ---- 数值 ----

  get min(): number {
    return Number(this.getAttribute('min') ?? 0)
  }
  get max(): number {
    return Number(this.getAttribute('max') ?? 100)
  }
  get step(): number {
    const s = Number(this.getAttribute('step') ?? 1)
    return s > 0 ? s : 1
  }
  get value(): number {
    const v = Number(this.getAttribute('value') ?? this.min)
    return Math.min(Math.max(v, this.min), this.max)
  }
  set value(v: number) {
    this.setAttribute('value', String(this._clamp(v)))
  }

  private _clamp(v: number): number {
    const { min, max } = this
    // 对齐到步长，避免出现 33.333 这类值
    const stepped = Math.round((v - min) / this.step) * this.step + min
    const fixed = Number(stepped.toFixed(10))
    return Math.min(Math.max(fixed, min), max)
  }

  private get _progress(): number {
    const { min, max } = this
    return max === min ? 0 : (this.value - min) / (max - min)
  }

  private _syncAria() {
    this.setAttribute('aria-valuemin', String(this.min))
    this.setAttribute('aria-valuemax', String(this.max))
    this.setAttribute('aria-valuenow', String(this.value))
  }

  private _render() {
    this.style.setProperty('--lg-slider-progress', String(this._progress))
  }

  private _commit(v: number) {
    const next = this._clamp(v)
    if (next === this.value) return
    this.setAttribute('value', String(next))
    this.dispatchEvent(
      new CustomEvent('lg-change', {
        detail: { value: next },
        bubbles: true,
        composed: true,
      }),
    )
  }

  // ---- 指针（统一鼠标与触摸）----

  private _valueFromEvent(e: PointerEvent): number {
    const rect = this._track.getBoundingClientRect()
    if (rect.width === 0) return this.value
    const ratio = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1)
    return this.min + ratio * (this.max - this.min)
  }

  private _onPointerDown = (e: PointerEvent) => {
    if (this.hasAttribute('disabled')) return
    e.preventDefault()
    this._dragging = true
    this.setAttribute('dragging', '')
    // 捕获指针：手指移出元素后仍能收到 move 事件。
    // 触屏上不做这步，拖到元素外就丢事件，滑块会"粘住"。
    // 特性检测是必要的：环境不支持（如无 Pointer Events 的宿主）或
    // pointerId 无效时 setPointerCapture 会抛，不能让它中断取值。
    try {
      this.setPointerCapture?.(e.pointerId)
    } catch {
      /* 不支持捕获时退化为普通拖动 */
    }
    this.focus()
    this._commit(this._valueFromEvent(e))
  }

  private _onPointerMove = (e: PointerEvent) => {
    if (!this._dragging) return
    e.preventDefault()
    this._commit(this._valueFromEvent(e))
  }

  private _onPointerUp = (e: PointerEvent) => {
    if (!this._dragging) return
    this._dragging = false
    this.removeAttribute('dragging')
    try {
      if (this.hasPointerCapture?.(e.pointerId)) {
        this.releasePointerCapture(e.pointerId)
      }
    } catch {
      /* 与捕获对称：释放失败不影响拖动结束 */
    }
  }

  // ---- 键盘 ----

  private _onKeyDown = (e: KeyboardEvent) => {
    if (this.hasAttribute('disabled')) return
    const { min, max, step } = this
    const big = (max - min) / 10
    let next: number | null = null

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        next = this.value + step
        break
      case 'ArrowLeft':
      case 'ArrowDown':
        next = this.value - step
        break
      case 'PageUp':
        next = this.value + big
        break
      case 'PageDown':
        next = this.value - big
        break
      case 'Home':
        next = min
        break
      case 'End':
        next = max
        break
      default:
        return
    }

    e.preventDefault()
    this._commit(next)
  }
}

export function defineGlassSlider(tag = 'lg-glass-slider') {
  if (typeof customElements === 'undefined') return
  if (!customElements.get(tag)) customElements.define(tag, GlassSliderElement)
}
