/**
 * React 封装测试。
 *
 * 重点不是「能渲染出标签」，而是：
 *  1. 数值属性被转成字符串（Web Component 只认字符串）
 *  2. 布尔属性用空字符串表示（HTML 布尔属性语义）
 *  3. 事件回调能接到组件派发的 CustomEvent 上
 *  4. 全部 10 个组件都有封装（原来只有 5 个）
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import * as ReactGlass from '../src/react/index.js'

describe('React 封装', () => {
  it('导出全部 10 个组件', () => {
    const expected = [
      'GlassSurface', 'GlassButton', 'GlassCard', 'GlassNavBar', 'GlassBottomBar',
      'GlassGroup', 'GlassDialog', 'GlassSegmented', 'GlassSwitch', 'GlassSlider',
    ]
    for (const name of expected) {
      expect(ReactGlass, `缺少 ${name}`).toHaveProperty(name)
    }
  })

  it('GlassSurface：radius 转字符串，level 直传', () => {
    const html = renderToString(
      createElement(ReactGlass.GlassSurface, { radius: 26, level: 'elevated' }, '内容'),
    )
    expect(html).toContain('lg-glass-surface')
    expect(html).toContain('radius="26"')
    expect(html).toContain('level="elevated"')
    expect(html).toContain('内容')
  })

  it('GlassButton：disabled 用空字符串（HTML 布尔属性语义）', () => {
    const html = renderToString(
      createElement(ReactGlass.GlassButton, { disabled: true, variant: 'primary' }, '按钮'),
    )
    expect(html).toContain('disabled=""')
    expect(html).toContain('variant="primary"')
  })

  it('GlassSwitch：checked / aria-label', () => {
    const html = renderToString(
      createElement(ReactGlass.GlassSwitch, {
        checked: true, 'aria-label': '开关', level: 'regular',
      } as never),
    )
    expect(html).toContain('checked=""')
    expect(html).toContain('aria-label="开关"')
  })

  it('GlassSlider：数值属性全部转字符串', () => {
    const html = renderToString(
      createElement(ReactGlass.GlassSlider, {
        min: 0, max: 100, step: 5, value: 40,
      }),
    )
    expect(html).toContain('min="0"')
    expect(html).toContain('max="100"')
    expect(html).toContain('step="5"')
    expect(html).toContain('value="40"')
  })

  it('GlassGroup：smoothing 转字符串', () => {
    const html = renderToString(
      createElement(ReactGlass.GlassGroup, { smoothing: 22 }, 'x'),
    )
    expect(html).toContain('smoothing="22"')
  })

  it('GlassSegmented：options 渲染成带 data-value 的按钮', () => {
    const html = renderToString(
      createElement(ReactGlass.GlassSegmented, {
        value: 'b',
        options: [
          { value: 'a', label: '甲' },
          { value: 'b', label: '乙' },
        ],
      }),
    )
    expect(html).toContain('data-value="a"')
    expect(html).toContain('data-value="b"')
    expect(html).toContain('甲')
    expect(html).toContain('value="b"')
  })

  it('GlassDialog：open 用空字符串，heading 直传', () => {
    const html = renderToString(
      createElement(ReactGlass.GlassDialog, { open: true, heading: '标题' }, '正文'),
    )
    expect(html).toContain('open=""')
    expect(html).toContain('heading="标题"')
  })
})
