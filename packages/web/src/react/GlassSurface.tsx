/**
 * React 封装。
 *
 * Web Component 的属性是字符串，React 对未知元素的自定义属性处理不一致，
 * 这里显式做一层类型安全的桥接：所有数值属性转字符串，children 走 slot。
 */

import { createElement, forwardRef, useEffect, type CSSProperties, type ReactNode } from 'react'
import { defineGlassSurface } from '../elements/glass-surface.js'

export interface GlassSurfaceProps {
  children?: ReactNode
  /** 圆角像素值。默认取 tokens.radius.lg */
  radius?: number
  /** 材质层级 */
  level?: 'plain' | 'regular' | 'elevated' | 'focused'
  /** 表面高度函数，决定边缘剖面形状 */
  surface?: 'convexSquircle' | 'convexCircle' | 'concave' | 'lip'
  theme?: 'light' | 'dark'
  className?: string
  style?: CSSProperties
}

export const GlassSurface = forwardRef<HTMLElement, GlassSurfaceProps>(function GlassSurface(
  { children, radius, level = 'regular', surface = 'convexSquircle', theme = 'light', className, style },
  ref,
) {
  useEffect(() => {
    defineGlassSurface()
  }, [])

  return createElement(
    'lg-glass-surface',
    {
      ref,
      class: className,
      style,
      level,
      surface,
      theme,
      ...(radius !== undefined ? { radius: String(radius) } : {}),
    },
    children,
  )
})
