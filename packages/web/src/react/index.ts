/**
 * React 封装。
 *
 * Web Component 的属性是字符串，React 对未知元素的自定义属性处理不一致，
 * 这里显式做一层类型安全的桥接：数值属性转字符串，children 走 slot。
 */

import {
  createElement,
  forwardRef,
  useEffect,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { defineAll } from '../index.js'

/** 挂载时注册全部自定义元素（幂等）。 */
export function useGlassElements() {
  useEffect(() => {
    defineAll()
  }, [])
}

export type GlassLevel = 'plain' | 'regular' | 'elevated' | 'focused'
export type GlassSurfaceShape = 'convexSquircle' | 'convexCircle' | 'concave' | 'lip'

interface CommonProps {
  children?: ReactNode
  /** 圆角像素值。默认取 tokens.radius.lg */
  radius?: number
  /** 材质层级 */
  level?: GlassLevel
  /** 表面高度函数，决定边缘剖面形状 */
  surface?: GlassSurfaceShape
  theme?: 'light' | 'dark'
  className?: string
  style?: CSSProperties
}

function glassAttrs(p: CommonProps) {
  return {
    class: p.className,
    style: p.style,
    level: p.level,
    surface: p.surface,
    theme: p.theme,
    ...(p.radius !== undefined ? { radius: String(p.radius) } : {}),
  }
}

export const GlassSurface = forwardRef<HTMLElement, CommonProps>(function GlassSurface(p, ref) {
  useGlassElements()
  return createElement('lg-glass-surface', { ref, ...glassAttrs(p) }, p.children)
})

export interface GlassButtonProps extends CommonProps {
  disabled?: boolean
  variant?: 'default' | 'primary' | 'danger'
  onClick?: (e: MouseEvent) => void
}

export const GlassButton = forwardRef<HTMLElement, GlassButtonProps>(function GlassButton(p, ref) {
  useGlassElements()
  const { disabled, variant, onClick, ...rest } = p

  useEffect(() => {
    const el = (ref as React.RefObject<HTMLElement>)?.current
    if (!el || !onClick) return
    const handler = (e: Event) => onClick(e as MouseEvent)
    el.addEventListener('click', handler)
    return () => el.removeEventListener('click', handler)
  }, [ref, onClick])

  return createElement(
    'lg-glass-button',
    {
      ref,
      ...glassAttrs(rest),
      variant,
      ...(disabled ? { disabled: '' } : {}),
    },
    rest.children,
  )
})

export interface GlassCardProps extends CommonProps {
  title?: string
  desc?: string
  elevate?: boolean
}

export const GlassCard = forwardRef<HTMLElement, GlassCardProps>(function GlassCard(p, ref) {
  useGlassElements()
  const { title, desc, elevate, ...rest } = p
  return createElement(
    'lg-glass-card',
    {
      ref,
      ...glassAttrs(rest),
      ...(title !== undefined ? { title } : {}),
      ...(desc !== undefined ? { desc } : {}),
      ...(elevate ? { elevate: '' } : {}),
    },
    rest.children,
  )
})

export interface GlassNavBarProps extends CommonProps {
  brand?: string
  sticky?: boolean
}

export const GlassNavBar = forwardRef<HTMLElement, GlassNavBarProps>(function GlassNavBar(p, ref) {
  useGlassElements()
  const { brand, sticky, ...rest } = p
  return createElement(
    'lg-glass-navbar',
    {
      ref,
      ...glassAttrs(rest),
      ...(brand !== undefined ? { brand } : {}),
      ...(sticky ? { sticky: '' } : {}),
    },
    rest.children,
  )
})

export interface GlassBottomBarProps extends CommonProps {
  fixed?: boolean
}

export const GlassBottomBar = forwardRef<HTMLElement, GlassBottomBarProps>(
  function GlassBottomBar(p, ref) {
    useGlassElements()
    const { fixed, ...rest } = p
    return createElement(
      'lg-glass-bottombar',
      { ref, ...glassAttrs(rest), ...(fixed ? { fixed: '' } : {}) },
      rest.children,
    )
  },
)


/* ────────────────────────────────────────────────────────────
   以下为补齐的 5 个组件（原来只有 Surface / Button / Card /
   NavBar / BottomBar 五个封装，其余只能用裸标签）。
   ──────────────────────────────────────────────────────────── */

export interface GlassGroupProps extends CommonProps {
  /** 相邻形状的融合半径（px）。0 = 不融合 */
  smoothing?: number
}

/**
 * 多个玻璃元素的 SDF 融合。
 *
 * 子元素**不需要任何标记** —— 组件自动读取每个子元素的真实几何（getBoundingClientRect），
 * 用它们的平滑并集计算距离场，因此融合处折射方向连续，不会各弯各的。
 * 子元素若带 `radius` 属性，会用它作为该形状的圆角。
 */
export const GlassGroup = forwardRef<HTMLElement, GlassGroupProps>(function GlassGroup(p, ref) {
  useGlassElements()
  const { smoothing, ...rest } = p
  return createElement(
    'lg-glass-group',
    {
      ref,
      ...glassAttrs(rest),
      ...(smoothing !== undefined ? { smoothing: String(smoothing) } : {}),
    },
    rest.children,
  )
})

export interface GlassDialogProps extends CommonProps {
  /** 是否打开 */
  open?: boolean
  /** 标题 */
  heading?: string
  /** 关闭时回调 */
  onClose?: () => void
}

export const GlassDialog = forwardRef<HTMLElement, GlassDialogProps>(function GlassDialog(p, ref) {
  useGlassElements()
  const { open, heading, onClose, ...rest } = p

  useEffect(() => {
    const el = (ref as React.RefObject<HTMLElement>)?.current
    if (!el || !onClose) return
    // 组件在点击遮罩 / 按 Esc / 点关闭按钮时派发 lg-close
    const handler = () => onClose()
    el.addEventListener('lg-close', handler)
    return () => el.removeEventListener('lg-close', handler)
  }, [ref, onClose])

  return createElement(
    'lg-glass-dialog',
    {
      ref,
      ...glassAttrs(rest),
      ...(open ? { open: '' } : {}),
      ...(heading !== undefined ? { heading } : {}),
    },
    rest.children,
  )
})

export interface GlassSegmentedOption {
  value: string
  label: string
}

export interface GlassSegmentedProps extends Omit<CommonProps, 'children'> {
  /** 当前选中值 */
  value?: string
  /** 选项；也可以用 children 传 <lg-segment> 标签 */
  options?: GlassSegmentedOption[]
  /** 选中变化 */
  onChange?: (value: string) => void
}

export const GlassSegmented = forwardRef<HTMLElement, GlassSegmentedProps>(
  function GlassSegmented(p, ref) {
    useGlassElements()
    const { value, options, onChange, ...rest } = p

    useEffect(() => {
      const el = (ref as React.RefObject<HTMLElement>)?.current
      if (!el || !onChange) return
      const handler = (e: Event) => {
        const detail = (e as CustomEvent<{ value?: string }>).detail
        if (detail?.value) onChange(detail.value)
      }
      el.addEventListener('lg-change', handler)
      return () => el.removeEventListener('lg-change', handler)
    }, [ref, onChange])

    return createElement(
      'lg-glass-segmented',
      {
        ref,
        ...glassAttrs(rest),
        ...(value !== undefined ? { value } : {}),
      },
      // ⚠️ 子项是**普通元素 + data-value 属性**，不是自定义标签。
      // 组件用 ::slotted(*) 接管样式，用 data-value 读值（见 glass-segmented.ts）。
      options?.map((o) =>
        createElement('button', { key: o.value, type: 'button', 'data-value': o.value }, o.label),
      ),
    )
  },
)

export interface GlassSwitchProps extends Omit<CommonProps, 'children'> {
  checked?: boolean
  disabled?: boolean
  'aria-label'?: string
  onChange?: (checked: boolean) => void
}

export const GlassSwitch = forwardRef<HTMLElement, GlassSwitchProps>(function GlassSwitch(p, ref) {
  useGlassElements()
  const { checked, disabled, onChange, ...rest } = p
  const ariaLabel = p['aria-label']

  useEffect(() => {
    const el = (ref as React.RefObject<HTMLElement>)?.current
    if (!el || !onChange) return
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ checked?: boolean }>).detail
      onChange(detail?.checked ?? el.hasAttribute('checked'))
    }
    el.addEventListener('lg-change', handler)
    return () => el.removeEventListener('lg-change', handler)
  }, [ref, onChange])

  return createElement('lg-glass-switch', {
    ref,
    ...glassAttrs(rest),
    ...(checked ? { checked: '' } : {}),
    ...(disabled ? { disabled: '' } : {}),
    ...(ariaLabel ? { 'aria-label': ariaLabel } : {}),
  })
})

export interface GlassSliderProps extends Omit<CommonProps, 'children'> {
  min?: number
  max?: number
  step?: number
  value?: number
  disabled?: boolean
  'aria-label'?: string
  onChange?: (value: number) => void
}

export const GlassSlider = forwardRef<HTMLElement, GlassSliderProps>(function GlassSlider(p, ref) {
  useGlassElements()
  const { min, max, step, value, disabled, onChange, ...rest } = p
  const ariaLabel = p['aria-label']

  useEffect(() => {
    const el = (ref as React.RefObject<HTMLElement>)?.current
    if (!el || !onChange) return
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ value?: number }>).detail
      if (typeof detail?.value === 'number') onChange(detail.value)
    }
    el.addEventListener('lg-change', handler)
    return () => el.removeEventListener('lg-change', handler)
  }, [ref, onChange])

  return createElement('lg-glass-slider', {
    ref,
    ...glassAttrs(rest),
    ...(min !== undefined ? { min: String(min) } : {}),
    ...(max !== undefined ? { max: String(max) } : {}),
    ...(step !== undefined ? { step: String(step) } : {}),
    ...(value !== undefined ? { value: String(value) } : {}),
    ...(disabled ? { disabled: '' } : {}),
    ...(ariaLabel ? { 'aria-label': ariaLabel } : {}),
  })
})
