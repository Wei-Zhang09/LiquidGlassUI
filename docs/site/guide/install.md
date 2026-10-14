# 安装

## Web

组件是**框架无关的 Web Components**（自定义元素），同时提供 React 封装。

```bash
npm install @liquidglass/web
```

::: tip 目前是私有包
`packages/web` 的 `package.json` 里 `private: true`。在发布到 npm 之前，
可以直接从仓库引用源码 —— 文档站就是这么做的：

```ts
import { defineAll } from '../../packages/web/src/index.js'
defineAll()
```
:::

### 两种用法

**一、注册自定义元素**（任何框架都能用）

```ts
import { defineAll } from '@liquidglass/web'
defineAll()
```

```html
<lg-glass-surface radius="26" level="elevated">
  <p>内容</p>
</lg-glass-surface>
```

**二、React 封装**

```tsx
import { GlassSurface } from '@liquidglass/web/react'

<GlassSurface radius={26} level="elevated">
  <p>内容</p>
</GlassSurface>
```

### 设计参数（CSS 变量）

```ts
import '@liquidglass/web/tokens.css'
```

## Compose（Windows 桌面 / Android）

::: warning 尚未发布到 Maven Central
目前需要从仓库本地引用 `packages/compose`。
:::

```kotlin
// settings.gradle.kts
includeBuild("../LiquidGlassUI/packages/compose")
```

```kotlin
val backdrop = rememberLayerBackdrop()
Box(Modifier.layerBackdrop(backdrop)) { /* 背景内容 */ }

GlassSurface(
    backdrop = backdrop,
    level = GlassLevel.Elevated,
) {
    Text("内容")
}
```

依赖的上游库是 [`io.github.kyant0:backdrop`](https://github.com/Kyant0/AndroidLiquidGlass)。

## 环境要求

| 平台 | 要求 |
|---|---|
| Web — 真折射 | Chromium（Chrome / Edge / 新版 Opera）。Firefox / Safari 会降到磨砂 |
| Web — 磨砂 | 任何支持 `backdrop-filter` 的现代浏览器 |
| Windows 桌面 | JDK 21+ |
| Android | API 33+（AGSL 运行时着色器） |
