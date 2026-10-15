# Web 端组件

浏览器里的液态玻璃。**10 个组件**，全部是原生 Web Components（`lg-*` 标签），
框架无关 —— 不依赖 React / Vue，直接放进任何页面即可。

::: tip 每个组件页都有**在线演示**
本站的演示区就是这些组件本身在运行（dogfooding）。
拖动滑块、点击开关，都是真实的组件交互。
:::

## 组件清单

### 基础

| 组件 | 说明 |
|---|---|
| [`GlassSurface`](/web/glass-surface) | 材质底板 —— 所有玻璃元素的基底 |
| [`GlassCard`](/web/glass-card) | 内容卡片 |
| [`GlassGroup`](/web/glass-group) | 多个玻璃元素**融合**成一个（SDF） |

### 交互

| 组件 | 说明 |
|---|---|
| [`GlassButton`](/web/glass-button) | 按钮 |
| [`GlassSwitch`](/web/glass-switch) | 开关（`role="switch"`，空格/回车切换） |
| [`GlassSlider`](/web/glass-slider) | 滑块（Pointer Events，鼠标与触摸统一） |
| [`GlassSegmented`](/web/glass-segmented) | 分段控件 |

### 导航

| 组件 | 说明 |
|---|---|
| [`GlassNavBar`](/web/glass-navbar) | 顶部导航 |
| [`GlassBottomBar`](/web/glass-bottombar) | 底部标签栏 |

### 反馈

| 组件 | 说明 |
|---|---|
| [`GlassDialog`](/web/glass-dialog) | 对话框（模态 + 遮罩） |

## 浏览器支持

| 浏览器 | 实际效果 |
|---|---|
| Chrome / Edge / 新版 Opera | **真折射**（SVG 位移贴图） |
| Firefox | 磨砂（**静默**降级，见[降级策略](/guide/fallback)） |
| Safari | 磨砂（同上） |
| 不支持 `backdrop-filter` | 实心 |

::: warning Firefox / Safari 是**静默**失效
它们的 `CSS.supports('backdrop-filter', 'url(#f)')` 返回 `true`，
但实际不渲染 SVG 滤镜。因此本库按 **UA 嗅探**判断，而不是 `@supports`。
详见[降级策略](/guide/fallback)。
:::

## 快速上手

```html
<script type="module">
  import { defineAll } from '@liquidglassui/web'
  defineAll()   // 注册全部 lg-* 自定义元素
</script>

<lg-glass-surface radius="26" level="elevated">
  <p>内容</p>
</lg-glass-surface>
```

安装与构建见[安装](/guide/install)与[快速开始](/guide/quickstart)。

## 相关

- [桌面端组件](/desktop/) —— Compose Multiplatform（Windows）
- [移动端组件](/mobile/) —— Compose Multiplatform（Android）
- [平台能力矩阵](/platform/) —— 三端能力对比
