# 平台能力矩阵

三端的实现方式不同，**能力也不同**。这个表是选型的依据。

## 能力对比

::: warning 这张表说的是「技术上能做到」，不是「本库已验证」
每一格的含义是**该平台的能力上限**，不是本库的实现状态。
本库的实际验证状态见下方表格 —— iOS / RN / macOS / Linux **均未验证**。
:::

| 能力 | Web | Windows 桌面 | Android | iOS |
|---|---|---|---|---|
| 真折射 | ✅ 仅 Chromium | ✅ | ✅ API 33+ | ✅ iOS 26+ |
| 实现方式 | SVG 位移贴图 | AGSL 运行时着色器 | AGSL 运行时着色器 | 系统 `UIGlassEffect` |
| 形状融合（SDF） | ✅ | ✅ | ✅（共用代码） | ⚠️ 系统容器 |
| 色散 | ✅ | ✅ | ✅ | ⚠️ 系统控制 |
| 降级到磨砂 | ✅ 自动 | ⚠️ 需自写分支 | ⚠️ 需自写分支 | ✅ 自动 |

## 本库的实际验证状态

| 平台 | 实现 | 验证 | 证据 |
|---|---|---|---|
| Web | ✅ 10 个组件 | ✅ **已验证** | 双浏览器 + 像素级 A/B（边缘 mean 83.4 / 中心 0.0） |
| Windows 桌面 | ✅ 7 个组件 | ✅ **已验证** | 截图 + 像素级 A/B（边缘 21.1 / 本底 0.5 = 42×） |
| Android | ✅ 7 个组件 | ✅ **已验证** | Xiaomi 13 / Android 16 真机截图 |
| macOS / Linux 桌面 | ✅（同一份代码） | ⚠️ **未验证 —— 无设备** | 无 |
| iOS | ⚠️ 仅骨架 | ❌ **未验证 —— 无 macOS** | 无 |
| React Native | ⚠️ 仅骨架 | ❌ **未验证 —— 无 macOS** | 无 |

**「未验证」的三项不应被当作可用**。逐项证据见[验证报告](/verification)。

## Web

| 浏览器 | 实际效果 |
|---|---|
| Chrome / Edge / 新版 Opera | 真折射 |
| Firefox | 磨砂（**静默**降级，见[降级策略](/guide/fallback)） |
| Safari | 磨砂（同上） |
| 不支持 `backdrop-filter` | 实心 |

## Compose 双端

两端共用 `commonMain` 的同一份组件代码，但**渲染路径不同**：

| | 桌面 | Android |
|---|---|---|
| 渲染后端 | Skiko（Skia） | Android 图形栈 |
| 运行时着色器 | ✅ 无条件支持 | ✅ API 33+ |
| 真机验证 | ✅ 截图 + 像素级 A/B | ✅ Xiaomi 13 真机 |

### 组件按平台分化

不是所有组件都该两端通用。判据是**核心操作是否依赖 hover**：

| 组件 | 桌面 | 移动 | 依据 |
|---|---|---|---|
| `GlassTooltip` | 悬停显示 | 长按显示 | hover 是**唯一**触发方式 → 必须分化 |
| `GlassSidebar` | 悬停改底色 | 点击可用 | hover 只是视觉增强 → 可复用 |
| `GlassMenu` | 悬停改底色 | 点击可用 | 同上 → 可复用 |
| `GlassBottomBar` | — | 主导航 | 拇指区，桌面无意义 |

这组结论是**实测**得出的（同一份测试分别注入鼠标与触摸输入），
详见 [ADR-0003](https://github.com/Wei-Zhang09/LiquidGlassUI/blob/main/docs/adr/0003-platform-differentiation-evidence.md)。

## 组件矩阵

| 组件 | Web | Windows | Android | iOS |
|---|---|---|---|---|
| `GlassSurface` | ● | ● | ● | ◐ |
| `GlassCard` | ● | ● | ● | ◐ |
| `GlassButton` | ● | ● | ● | ◐ |
| `GlassGroup` | ● | ● | ● | ○ |
| `GlassNavBar` | ● | ○ | ● | ◐ |
| `GlassBottomBar` | ● | ○ | ● | ◐ |
| `GlassDialog` | ● | ● | ● | ◐ |
| `GlassSwitch` | ● | ○ | ● | ◐ |
| `GlassSlider` | ● | ○ | ● | ◐ |
| `GlassSegmented` | ● | ○ | ○ | ◐ |
| `GlassSidebar` | — | ● | ● | — |
| `GlassMenu` | — | ● | ● | — |
| `GlassTooltip` | — | ● | ● | — |

`●` 已实现**并验证**　`◐` 只有代码骨架、**未编译未运行**　`○` 未实现　`—` 该平台无此形态

::: warning iOS 整列都是 ◐
iOS 只有 Swift 骨架，**没有编译、没有运行、没有截图**（开发机为 Windows，无 macOS）。
不要把 `◐` 当作可用。详见 [iOS 平台页](/platform/ios)。
:::

## 下一步

- [Compose 平台详情](/platform/compose)
- [iOS 平台详情](/platform/ios)
