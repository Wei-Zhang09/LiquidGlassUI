# 快速开始

## 1. 引入并注册

```ts
import { defineAll } from '@liquidglass/web'

// 注册全部 lg-* 自定义元素（幂等，可重复调用）
defineAll()
```

也可以只注册需要的：

```ts
import { defineGlassSurface, defineGlassButton } from '@liquidglass/web'

defineGlassSurface()
defineGlassButton()
```

## 2. 准备背景

::: warning 这一步不能省
玻璃**必须有东西可折射**。放在纯色背景上，它和一块半透明白色方块没有区别 ——
这是这个项目反复踩到的坑。
:::

背景需要三样东西：

| 要素 | 为什么 |
|---|---|
| **高频纹理** | 模糊后能看出纹理被抹平 —— 这是"玻璃"的视觉证据 |
| **彩色光斑** | 模糊后能看出色相渗透 |
| **明暗对比** | 边缘高光才有东西可反射 |

一个够用的背景：

```css
body {
  background-color: #cdd9e8;
  background-image:
    radial-gradient(circle 42rem at 8% 4%, rgba(120, 175, 255, 0.85) 0%, transparent 60%),
    radial-gradient(circle 36rem at 92% 8%, rgba(190, 145, 255, 0.80) 0%, transparent 58%),
    radial-gradient(circle 40rem at 78% 88%, rgba(90, 220, 210, 0.70) 0%, transparent 60%),
    radial-gradient(circle 34rem at 18% 92%, rgba(255, 170, 150, 0.68) 0%, transparent 58%),
    linear-gradient(150deg, #b8cce4 0%, #dde7f2 38%, #c3d5e8 72%, #aec4dc 100%);
  background-attachment: fixed;
}

/* 网格：玻璃模糊掉它的证据 */
body::before {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  background-image:
    linear-gradient(rgba(70, 100, 140, 0.20) 1px, transparent 1px),
    linear-gradient(90deg, rgba(70, 100, 140, 0.20) 1px, transparent 1px);
  background-size: 120px 120px;
}
```

## 3. 用组件

```html
<lg-glass-surface radius="26" level="elevated" style="padding:24px">
  <h3>玻璃面板</h3>
  <p>背景在边缘被弯折。</p>
</lg-glass-surface>

<lg-glass-button variant="primary">确定</lg-glass-button>
```

## 4. 确认折射生效

在浏览器控制台检查 `data-support`：

```js
document.querySelector('lg-glass-surface').getAttribute('data-support')
// 'refraction' → 真折射
// 'frost'      → 磨砂（Firefox / Safari）
// 'solid'      → 实心（不支持 backdrop-filter）
```

::: tip 用 Chromium 看效果
真折射只在 Chromium 渲染。Firefox / Safari 会静默降级到磨砂 ——
见[降级策略](/guide/fallback)。
:::

## 完整示例

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: linear-gradient(135deg, #b8cce4, #dde7f2 40%, #c3d5e8);
    }
    body::before {
      content: "";
      position: fixed; inset: 0; pointer-events: none;
      background-image:
        linear-gradient(rgba(70,100,140,.2) 1px, transparent 1px),
        linear-gradient(90deg, rgba(70,100,140,.2) 1px, transparent 1px);
      background-size: 24px 24px;
    }
  </style>
</head>
<body>
  <lg-glass-surface radius="26" level="elevated" style="padding:32px 40px">
    <h2 style="margin:0 0 8px">Liquid Glass</h2>
    <p style="margin:0">边缘会把背景弯折</p>
  </lg-glass-surface>

  <script type="module">
    import { defineAll } from '@liquidglass/web'
    defineAll()
  </script>
</body>
</html>
```

## 下一步

- [设计原则](/guide/design) —— 材质是怎么构成的
- [降级策略](/guide/fallback) —— 不支持时发生什么
- [组件](/components/glass-surface) —— 完整 API
