---
layout: home

hero:
  name: LiquidGlassUI
  text: 跨端液态玻璃组件库
  tagline: 真折射、可验证、一套设计参数覆盖 Web / Windows 桌面 / Android
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/quickstart
    - theme: alt
      text: 浏览组件
      link: /web/glass-surface

features:
  - title: 真折射，不是模糊
    details: 用 SVG 位移贴图（Web）与运行时着色器（Compose）让背景在玻璃边缘真实弯曲。附像素级验证方法，不靠"看起来像"。
  - title: 三级降级，不静默失败
    details: 折射 → 磨砂 → 实心。Firefox/Safari 静默不支持 SVG backdrop-filter，因此按 UA 嗅探而非 @supports 判断。
  - title: 三端各自成型
    details: Web（原生 Web Components）、桌面端与移动端（Compose Multiplatform）分别成组展示，各自有独立的组件清单与验证证据。
  - title: 组件按平台分化
    details: 用实测数据决定分化：核心操作依赖 hover 的必须分化（如 Tooltip），仅作视觉增强的可复用。
---
