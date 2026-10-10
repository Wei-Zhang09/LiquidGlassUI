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
