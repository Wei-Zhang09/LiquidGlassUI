# GlassNavBar 顶部导航

顶部导航栏。`brand` 属性设置品牌名，子元素是导航项。

## 基础用法

<ClientOnly>

<div class="lg-demo is-column">
  <lg-glass-navbar data-demo="navbar" brand="LiquidGlassUI" radius="20" style="width:100%">
    <a href="#">概览</a>
    <a href="#">组件</a>
    <a href="#">设计参数</a>
    <a href="#">平台适配</a>
  </lg-glass-navbar>
  <span class="lg-out" data-demo-out="navbar">点击任意项</span>
</div>

</ClientOnly>

```html
<lg-glass-navbar brand="LiquidGlassUI" radius="20">
  <a href="/">概览</a>
  <a href="/components">组件</a>
  <a href="/design">设计参数</a>
  <a href="/platform">平台适配</a>
</lg-glass-navbar>
```

## 吸顶

加上 `sticky` 让导航在滚动时固定。

```html
<lg-glass-navbar brand="LiquidGlassUI" sticky>
  <a href="/">概览</a>
</lg-glass-navbar>
```

::: tip 吸顶时的模糊很重要
吸顶导航会盖在滚动内容上。没有 `backdrop-filter` 时，文字会和下方内容
混在一起读不清 —— 这正是玻璃材质在导航上的实用价值，不只是好看。
:::

## 不带品牌名

`brand` 为空时品牌区不占位。

<ClientOnly>

<div class="lg-demo">
  <lg-glass-navbar radius="20" style="width:100%">
    <a href="#">仅导航项</a>
    <a href="#">没有品牌名</a>
  </lg-glass-navbar>
</div>

</ClientOnly>

```html
<lg-glass-navbar>
  <a href="#">仅导航项</a>
</lg-glass-navbar>
```

## API

### Attributes

| 属性 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `brand` | `string` | — | 左侧品牌名。为空时该区域隐藏 |
| `sticky` | `boolean` | — | 存在即 `position: sticky` |
| `radius` | `number` | `26` | 圆角像素值 |
| `level` | `'plain' \| 'regular' \| 'elevated' \| 'focused'` | `'regular'` | 材质层级 |
| `surface` | 见 [GlassSurface](/web/glass-surface) | `'convexSquircle'` | 边缘高度函数 |
| `theme` | `'light' \| 'dark'` | `'light'` | 配色主题 |

### CSS 自定义属性

继承 [GlassSurface](/web/glass-surface) 的全部变量，另加：

| 变量 | 说明 |
|---|---|
| `--lg-navbar-padding` | 内边距 |
| `--lg-navbar-gap` | 品牌与导航项间距 |
| `--lg-sticky-top` | 吸顶时的 `top` 偏移（默认 `0px`） |

### Slots

| 名称 | 说明 |
|---|---|
| default | 导航项（通常是 `<a>` 或 `<button>`） |

### Events

无。导航项用原生事件（`click`）。
