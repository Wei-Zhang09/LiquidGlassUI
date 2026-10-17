# @liquidglass/web

跨端液态玻璃 UI 组件库的 **Web 实现**。原生 Web Components（`lg-*` 标签），框架无关；另带 React 封装。

> 完整文档与在线演示：<https://wei-zhang09.github.io/LiquidGlassUI/>
> 仓库：<https://github.com/Wei-Zhang09/LiquidGlassUI>

## 它和普通 glassmorphism 的区别

**真折射，不是模糊。**

普通 `backdrop-filter: blur()` 得到的是磨砂玻璃 —— 背景被均匀糊掉。
本库用 SVG 位移贴图 + Snell 定律计算边缘折射剖面，让背景在玻璃边缘**真实弯折**，
再叠一层按光照方向逐像素生成的高光。这是 iOS 26 Liquid Glass 的核心特征。

代价：真折射**只有 Chromium 支持**（`backdrop-filter: url(#svgFilter)`）。
Firefox / Safari 会**静默**忽略，所以本库按 UA 嗅探降级到磨砂，而不是靠 `@supports`
（两家的 `CSS.supports` 都返回 `true`，但实际不渲染 —— 这是本项目踩过的坑）。

## 安装

```bash
npm install @liquidglass/web
```

## 用法

### Web Components（框架无关）

```html
<link rel="stylesheet" href="node_modules/@liquidglass/web/dist/tokens.css">

<script type="module">
  import { defineAll } from '@liquidglass/web'
  defineAll()   // 注册全部 lg-* 自定义元素（幂等）
</script>

<lg-glass-surface radius="26" level="elevated">
  <p>内容</p>
</lg-glass-surface>
```

也可以只注册需要的组件：

```js
import { defineGlassSurface, defineGlassButton } from '@liquidglass/web'
defineGlassSurface()
defineGlassButton()
```

### React

```tsx
import { GlassSurface, GlassButton } from '@liquidglass/web/react'
import '@liquidglass/web/tokens.css'

export function App() {
  return (
    <GlassSurface radius={26} level="elevated">
      <p>内容</p>
    </GlassSurface>
  )
}
```

React 封装负责把数值属性转成字符串（Web Component 的属性都是字符串），
并在挂载时自动注册元素。

## 组件

| 标签 | React | 说明 |
|---|---|---|
| `lg-glass-surface` | `GlassSurface` | 材质底板，所有玻璃元素的基底 |
| `lg-glass-card` | `GlassCard` | 内容卡片 |
| `lg-glass-button` | `GlassButton` | 按钮 |
| `lg-glass-navbar` | `GlassNavBar` | 顶部导航 |
| `lg-glass-bottombar` | `GlassBottomBar` | 底部标签栏 |
| `lg-glass-group` | — | 多个玻璃元素 SDF 融合 |
| `lg-glass-dialog` | — | 对话框 |
| `lg-glass-segmented` | — | 分段控件 |
| `lg-glass-switch` | — | 开关 |
| `lg-glass-slider` | — | 滑块 |

## 玻璃必须有东西可折射

玻璃放在纯色背景上看不出效果 —— 模糊一片纯色等于什么都没做。
演示和截图请铺**高对比纹理**（细网格 / 色块 / 照片）。

## 浏览器支持

| 浏览器 | 效果 |
|---|---|
| Chrome / Edge / 新版 Opera | 真折射 |
| Firefox / Safari | 磨砂（静默降级） |
| 不支持 `backdrop-filter` | 实心 |

## 许可

MIT
