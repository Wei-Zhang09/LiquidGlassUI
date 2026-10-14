# 介绍

LiquidGlassUI 是一个**跨端液态玻璃 UI 组件库**，覆盖 Web、Windows 桌面、Android 三端。

它和普通 glassmorphism 库的区别只有一件事：**玻璃边缘会真的把背景弯折**。

## 它不是什么

不是「半透明 + 模糊 + 白边框」。那套配方在任何背景上看起来都差不多，
因为没有让光发生偏折 —— 只是把背景磨砂了。

液态玻璃必须有**边缘折射**：玻璃的边像一块透镜，把背后的东西压缩、位移。
这也是 Apple 在 iOS 26 引入 Liquid Glass 时的核心特征。

## 三端实现方式不同

| 平台 | 折射怎么实现 | 依赖 |
|---|---|---|
| **Web** | SVG 位移贴图，通过 `backdrop-filter: url(#filter)` | 仅 Chromium |
| **Windows 桌面** | Compose Multiplatform + AGSL 运行时着色器 | Skiko |
| **Android** | 同上（同一份 commonMain 代码） | API 33+ |

三条路都做了，但**能力不一样**，详见[平台能力矩阵](/platform/)。

## 一个关键事实：不支持时是静默的

Firefox 与 Safari **不支持** SVG 位移贴图，但它们：

- `CSS.supports('backdrop-filter', 'url(#x)')` 返回 **true**
- `getComputedStyle` 保留该值
- 页面**什么都不画**，也不报错

所以不能用 `@supports` 判断，只能 UA 嗅探。这是本库降级策略的基础，
详见[降级策略](/guide/fallback)。

## 从哪开始

- 想直接用 → [安装](/guide/install) → [快速开始](/guide/quickstart)
- 想理解材质 → [设计原则](/guide/design)
- 想看每个组件的 API → [组件](/components/glass-surface)
- 想确认「真的做了吗」→ [验证报告](/verification)
