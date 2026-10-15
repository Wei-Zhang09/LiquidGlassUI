# 移动端组件

Compose Multiplatform 的**移动形态**（Android）。

::: warning 这些页面没有在线演示
Compose 组件是 Kotlin 代码，编译成原生程序，无法在浏览器里运行。

因此本组页面只有**代码示例与 API 表格**；效果请参考
[验证报告](/verification)里的 **Xiaomi 13 真机截图**
（Android 16 / API 36 / arm64-v8a）。
:::

## 组件清单

### 移动专属形态

这几个组件的交互模型是为**触屏 + 拇指区**设计的，桌面端没有对应形态：

| 组件 | 说明 | 为什么是移动专属 |
|---|---|---|
| [`GlassBottomBar`](/mobile/glass-bottombar) | 底部标签栏 | 拇指可达区，桌面无意义 |
| [`GlassDialog`](/mobile/glass-dialog) | 底部抽屉 | 从底部滑入，拇指可达 |

::: tip 按压反馈 ≠ 悬停
触屏没有 hover，因此这些组件用 `collectIsPressedAsState` 做**按压反馈**。
判据见 [ADR-0003](https://github.com/Wei-Zhang09/LiquidGlassUI/blob/main/docs/adr/0003-platform-differentiation-evidence.md)。
:::

### 可复用的桌面组件

这两个组件的 hover 只是**视觉增强**（核心操作是点击），因此移动端可直接复用：

| 组件 | 桌面行为 | 移动端行为 |
|---|---|---|
| [`GlassSidebar`](/desktop/glass-sidebar) | 悬停改底色 | 点击可用 |
| [`GlassMenu`](/desktop/glass-menu) | 悬停改底色 | 点击可用 |

### ⚠️ 移动端**不可用**的组件

| 组件 | 问题 | 替代方案 |
|---|---|---|
| [`GlassTooltip`](/desktop/glass-tooltip) | **hover 是唯一触发方式**，触屏永不显示 | 需改为**长按**触发（**未实现**） |

## 共用基础

移动与桌面**共用同一份 `commonMain` 代码**：

- [`GlassSurface`](/desktop/glass-surface) —— 材质底板
- [`GlassGroup`](/desktop/glass-group) —— 玻璃融合

## 环境要求

| 项 | 要求 |
|---|---|
| Android | **API 33+**（AGSL 运行时着色器，融合效果依赖它） |
| ABI | arm64-v8a（实测机型） |
| 真机验证 | Xiaomi 13 / Android 16 / API 36 |

::: warning API 33 以下
AGSL（Android Graphics Shading Language）从 API 33 才有。
低版本上 `GlassGroup` 的融合着色器无法运行 —— 会退化成普通玻璃，
**不会崩溃**，但看不到融合效果。
:::

## 相关

- [桌面端组件](/desktop/) —— Windows 形态
- [Web 端组件](/web/) —— 浏览器
- [平台能力矩阵](/platform/) —— 三端对比
