/**
 * <lg-glass-dialog> —— 玻璃模态对话框。
 *
 * ## 可访问性（本组件的主要工作量）
 * - `role="dialog"` + `aria-modal="true"`
 * - 打开时**焦点陷阱**：Tab 在对话框内循环，不会跑到背后的页面
 * - 打开时记录 `document.activeElement`，关闭后**归还焦点**
 * - ESC 关闭
 * - 打开时锁定页面滚动（`overflow: hidden`），关闭时恢复
 *
 * ## 不用原生 <dialog>
 * 原生 `<dialog>::backdrop` 无法承载 SVG 位移滤镜（backdrop-filter 在
 * `::backdrop` 上不受支持），玻璃会退化成纯色。因此用自绘遮罩层。
 *
 * ## 用法
 * ```html
 * <lg-glass-dialog heading="确认删除">
 *   <p>此操作不可撤销。</p>
 *   <lg-glass-button slot="footer">取消</lg-glass-button>
 * </lg-glass-dialog>
 * ```
 * 通过 `open` 属性控制显隐；`slot="footer"` 的内容放在底部操作区。
 */

import { GlassElementBase } from './glass-base.js'
import { radius as radiusTokens, color as colorTokens } from '../generated/tokens.js'

const CSS = `
  :host {
    display: none;
  }
  :host([open]) {
    display: block;
  }

  .overlay {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: var(--lg-overlay, rgba(12, 18, 26, 0.42));
    animation: lg-fade var(--lg-motion, 250ms) var(--lg-easing, ease);
  }

  .panel {
    position: relative;
    display: block;
    box-sizing: border-box;
    min-width: 280px;
    max-width: min(560px, 100%);
    max-height: calc(100vh - 48px);
    overflow: auto;
    border-radius: var(--lg-radius, ${radiusTokens.xl}px);
    background: var(--lg-surface, rgba(255,255,255,0.44));
    box-shadow:
      0 28px 80px var(--lg-shadow, rgba(33,49,62,0.28)),
      inset 1px 1px 0 var(--lg-highlight, rgba(255,255,255,0.5)),
      inset -1px -1px 0 var(--lg-inner-shadow, rgba(103,127,151,0.1));
    color: var(--lg-fg, #1b2733);
    font: 400 14px/1.6 system-ui, "Segoe UI", sans-serif;
    animation: lg-rise var(--lg-motion, 250ms) var(--lg-easing, ease);
  }

  .heading {
    font-size: 17px;
    font-weight: 600;
    margin: 0;
    padding: 22px 26px 0;
  }
  .heading:empty { display: none; }

  .content { padding: 18px 26px; }

  .footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding: 0 26px 22px;
  }
  .footer:empty { display: none; }

  @keyframes lg-fade { from { opacity: 0; } to { opacity: 1; } }
  @keyframes lg-rise {
    from { opacity: 0; transform: translateY(8px) scale(0.985); }
    to   { opacity: 1; transform: none; }
  }

  @media (prefers-reduced-motion: reduce) {
    .overlay, .panel { animation: none; }
  }
`

/** 可聚焦元素的选择器（焦点陷阱用）。 */
const FOCUSABLE =
  'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"]), lg-glass-button'

export class GlassDialogElement extends GlassElementBase {
  static get observedAttributes() {
    return ['radius', 'level', 'surface', 'theme', 'open', 'heading']
  }

  private _overlay!: HTMLDivElement
  private _panel!: HTMLDivElement
  private _heading!: HTMLHeadingElement
  private _lastFocused: HTMLElement | null = null
  private _prevOverflow = ''

  protected get componentCss(): string {
    return CSS
  }

  constructor() {
    super()
    this.setupShadow()

    this._overlay = document.createElement('div')
    this._overlay.className = 'overlay'

    this._panel = document.createElement('div')
    this._panel.className = 'panel'
    this._panel.setAttribute('role', 'dialog')
    this._panel.setAttribute('aria-modal', 'true')

    this._heading = document.createElement('h2')
    this._heading.className = 'heading'

    const content = document.createElement('div')
    content.className = 'content'
    content.append(document.createElement('slot'))

    const footer = document.createElement('div')
    footer.className = 'footer'
    const footerSlot = document.createElement('slot')
    footerSlot.name = 'footer'
    footer.append(footerSlot)

    this._panel.append(this._heading, content, footer)
    this._overlay.append(this._panel)
    this.shadowRoot!.append(this._overlay)
  }

  connectedCallback() {
    // 注意：对话框是浮层，**不参与 backdrop 折射**（它覆盖在全屏遮罩上，
    // 没有可采样的背景层）。因此不调 initGlass —— 玻璃样式由 CSS 直接给。
    this._applyThemeVars()
    this._overlay.addEventListener('pointerdown', this._onOverlayDown)
    this._panel.addEventListener('keydown', this._onKeyDown)
    this._syncHeading()
    if (this.hasAttribute('open')) this._activate()
  }

  disconnectedCallback() {
    this._overlay.removeEventListener('pointerdown', this._onOverlayDown)
    this._panel.removeEventListener('keydown', this._onKeyDown)
    this._deactivate()
  }

  attributeChangedCallback(name: string, oldV: string | null, newV: string | null) {
    if (oldV === newV) return
    if (name === 'heading') this._syncHeading()
    if (name === 'theme') this._applyThemeVars()
    if (name === 'radius') {
      const r = this.getAttribute('radius')
      this._panel.style.setProperty('--lg-radius', r ? `${parseFloat(r)}px` : `${radiusTokens.xl}px`)
    }
    if (name === 'open') {
      if (newV !== null) this._activate()
      else this._deactivate()
    }
  }

  /**
   * 设置主题相关变量。
   *
   * 注意：对话框**不参与 backdrop 折射**（它覆盖在全屏遮罩上，没有可采样的
   * 背景层），所以不走 initGlass。但颜色变量仍必须显式设置 ——
   * 否则面板与遮罩会落到 CSS 里的硬编码 fallback，
   * 表现为遮罩几乎不可见、背景内容透进面板导致文字读不清。
   *
   * 模态面板用 surfaceModal（不透明度更高）而非 surface：
   * 玻璃面可以透，但模态里的文字必须可读，这是可用性底线。
   */
  private _applyThemeVars() {
    const theme = this.getAttribute('theme') === 'dark' ? 'dark' : 'light'
    this.setAttribute('data-theme', theme)
    const c = colorTokens[theme]
    this.style.setProperty('--lg-overlay', c.overlay)
    this.style.setProperty('--lg-surface', c.surfaceModal)
    this.style.setProperty('--lg-shadow', c.shadow)
    this.style.setProperty('--lg-highlight', c.highlight)
    this.style.setProperty('--lg-inner-shadow', c.innerShadow)
    this.style.setProperty('--lg-fg', theme === 'dark' ? '#eef2f7' : '#1b2733')
  }

  private _syncHeading() {
    if (!this._heading) return
    const text = this.getAttribute('heading') ?? ''
    this._heading.textContent = text
    if (text) this._panel.setAttribute('aria-label', text)
  }

  /** 打开：记录焦点、锁定滚动、把焦点移入对话框。 */
  private _activate() {
    if (this._lastFocused) return // 已在打开状态，避免重复处理

    this._lastFocused = document.activeElement as HTMLElement | null

    // 锁定页面滚动。用 overflow 而非 position:fixed，避免页面跳动。
    this._prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // 焦点移入第一个可聚焦元素；没有则聚焦面板本身
    const first = this._focusable()[0]
    if (first) {
      first.focus()
    } else {
      this._panel.setAttribute('tabindex', '-1')
      this._panel.focus()
    }
  }

  /** 关闭：恢复滚动、归还焦点。 */
  private _deactivate() {
    if (!this._lastFocused) return
    document.body.style.overflow = this._prevOverflow

    // 归还焦点。用可选链防止元素已从 DOM 移除。
    this._lastFocused.focus?.()
    this._lastFocused = null
  }

  private _focusable(): HTMLElement[] {
    return [...this._panel.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
      (el) => !el.hasAttribute('disabled') && el.tabIndex >= 0,
    )
  }

  /** 点击遮罩本身（而非面板）时关闭。 */
  private _onOverlayDown = (e: PointerEvent) => {
    if (e.target === this._overlay) {
      this.removeAttribute('open')
      this.dispatchEvent(new CustomEvent('lg-close', { bubbles: true, composed: true }))
    }
  }

  /** 焦点陷阱 + ESC。 */
  private _onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation()
      this.removeAttribute('open')
      this.dispatchEvent(new CustomEvent('lg-close', { bubbles: true, composed: true }))
      return
    }

    if (e.key !== 'Tab') return

    const items = this._focusable()
    if (items.length === 0) return

    const first = items[0]!
    const last = items[items.length - 1]!
    const active = this.shadowRoot!.activeElement ?? document.activeElement

    // 在首尾之间循环，焦点不逃出对话框
    if (e.shiftKey && active === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && active === last) {
      e.preventDefault()
      first.focus()
    }
  }
}

export function defineGlassDialog(tag = 'lg-glass-dialog') {
  if (typeof customElements === 'undefined') return
  if (!customElements.get(tag)) customElements.define(tag, GlassDialogElement)
}
