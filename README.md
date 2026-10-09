# LiquidGlassUI

跨端液态玻璃（Liquid Glass）UI 组件库。**一次定义设计参数，四端一致渲染。**

> 状态：**v0.1 规划中**。架构与组件矩阵见 [ADR-0001](docs/adr/0001-component-matrix-and-architecture.md)。

## 这是什么

Apple 在 iOS 26 引入 Liquid Glass 材质后，各生态出现了大量独立实现。本项目把这些实现的经验收敛成一套**统一的、可跨端复用的组件库**，重点解决三件事：

1. **通用性** — 设计参数（颜色、圆角、模糊、bezel 宽度、折射率、光照方向）在 `packages/tokens` 单点定义，四端生成原生常量，观感不会漂移
2. **易用性** — 组件 API 遵循各端惯用法，接入成本低；能力门控显式暴露，不会遇到"没报错但没效果"
3. **平台适配** — 不同端的组件侧重不同，不是把同一份清单平铺到所有平台

## 平台支持与优先级

开发优先级：**Web > Windows 桌面 > 移动端**（见 [ADR-0002](docs/adr/0002-platform-priority-and-desktop.md)）。

| 优先级 | 平台 | 包 | 真实折射 | 最低版本 | 本机可验证 |
|---|---|---|---|---|---|
| P0 | Web（React + Web Components） | `@liquidglass/web` | ✅ 仅 Chromium | 现代浏览器 | ✅ 双浏览器实测 |
| P1 | Windows 桌面 | `liquidglass-compose` | ✅ AGSL 运行时着色器 | JVM 11+ | ✅ |
| P2 | Android | `liquidglass-compose` | ✅ AGSL 运行时着色器 | API 33 | ✅ |
| P2 | macOS / Linux 桌面 | `liquidglass-compose` | ✅ | JVM 11+ | ⚠️ 未验证 |
| P3 | iOS / SwiftUI + UIKit | `LiquidGlassUI` (SwiftPM) | ✅ 系统材质 | iOS 26 | ❌ 无 macOS |
| P3 | React Native | `@liquidglass/rn` | ✅ 仅 iOS | iOS 26 + RN 0.80+ | ❌ 无 macOS |

**桌面端与移动端共用一套 Compose 代码**：`io.github.kyant0:backdrop` 以 `jvm("desktop")` 为一等目标，同一份实现同时产出 Windows / macOS / Linux / Android，无需维护两份。

**iOS 部分为未验证代码。** 开发机为 Windows，无 macOS，无法编译、运行或截图。在具备 macOS 环境前，文档与发布说明中不得声称 iOS 部分已验证。

### WPF 说明

**本项目不提供 WPF 实现**，因为技术上不可行：WPF 没有元素级背景模糊，液态玻璃所需的 per-element 边缘折射无法表达；通过 P/Invoke `SetWindowCompositionAttribute` 启用 DWM Acrylic 只能作用于**整个窗口**，不是单个控件。

若必须在 WPF 中实现，唯一可行路径是在 WebView2 中承载 `@liquidglass/web`，代价是放弃原生观感与性能。

### 各端能力门控

调用前请检查，**四端全部是静默失败**：

```ts
// Web
import { isGlassRefractionSupported } from '@liquidglass/web'
```
```kotlin
// Compose
isRuntimeShaderSupported(); isRenderEffectSupported()
```
```swift
// Swift
LiquidGlassUI.isSupported
```
```ts
// React Native
import { isLiquidGlassSupported } from '@liquidglass/rn'
```

## 已验证

| 项 | 方法 | 结果 |
|---|---|---|
| tokens 单源 | 改一处 JSON，比对四端产物 | ✅ 四端同步；`--check` 能检出漂移 |
| Web 折射生效 | `tools/verify-web.py`，A/B 归零位移后逐点比对 | ✅ Chromium 边缘带 mean=83.4 / max=224 |
| Web 中间不变形 | 同上 | ✅ 中心区 mean=0.0（17 个采样点全为 0） |
| Web 降级正确 | 双浏览器实测 | ✅ Chromium→`refraction`；Firefox→`frost` |
| Compose 桌面可构建 | Gradle + JDK 21 编译 | ✅ BUILD SUCCESSFUL |
| Compose 桌面折射生效 | `tools/verify-compose.py`，`LG_NO_LENS=1` 对照 | ✅ 边缘带 mean=21.1，集中度 **42×** |
| Compose 中间不变形 | 同上，按到边界距离分桶 | ✅ 内部本底 0.5；衰减单调 [21.1, 0.7, 0.4] |

截图见 `docs/screenshots/`。

## 组件矩阵

v1 核心组件（跨端一致）：

| 组件 | Web | iOS | Android | Desktop |
|---|---|---|---|---|
| `GlassSurface` 玻璃面 | ● | ● | ● | ● |
| `GlassCard` 卡片 | ● | ● | ● | ● |
| `GlassButton` 按钮 | ● | ● | ● | ● |
| `GlassGroup` 组合容器 | ● | ● | ● | ● |
| `GlassNavBar` 顶部导航 | ● | ● | ● | ○ |
| `GlassBottomBar` 底部标签栏 | ○ | ● | ● | ○ |
| `GlassDialog` 对话框 | ● | ● | ● | ● |
| `GlassSwitch` 开关 | ○ | ● | ● | ○ |
| `GlassSlider` 滑块 | ○ | ● | ● | ○ |
| `GlassSegmentedControl` 分段控件 | ● | ● | ○ | ○ |

● 主力场景　○ 支持但非主流

v2 平台特色组件：`GlassMenu`、`GlassSidebar`、`GlassSearchBar`、`GlassToast`、`GlassListItem`、`GlassFAB`、`GlassChip`、`GlassTooltip`、`GlassProgress`

完整依据（含各参考实现的源码统计）见 [ADR-0001](docs/adr/0001-component-matrix-and-architecture.md)。

## 仓库结构

```
LiquidGlassUI/
├── docs/
│   └── adr/                    架构决策记录
├── packages/
│   ├── tokens/                 设计参数唯一真源（JSON → 四端生成）
│   ├── web/                    React + TypeScript
│   ├── compose/                Kotlin / Compose Multiplatform
│   ├── apple/                  Swift Package（SwiftUI + UIKit）
│   └── rn/                     React Native
├── examples/                   各端可运行示例
└── tools/                      token 生成脚本
```

## 参考实现

本项目的技术依据来自以下开源实现（均已逐行阅读源码）：

| 项目 | 平台 | 借鉴点 |
|---|---|---|
| [rdev/liquid-glass-react](https://github.com/rdev/liquid-glass-react) | React | SVG 位移贴图、色散、鼠标弹性 |
| [archisvaze/liquid-glass](https://github.com/archisvaze/liquid-glass) | HTML | Snell 定律折射剖面的教科书实现 |
| [AndrewPrifer/liquid-dom](https://github.com/AndrewPrifer/liquid-dom) | TS/WebGPU | 超椭圆圆角、SDF 平滑并集、自适应模糊 |
| [Kyant0/AndroidLiquidGlass](https://github.com/Kyant0/AndroidLiquidGlass) | Compose | AGSL 着色器、effect 组合 DSL |
| [callstack/liquid-glass](https://github.com/callstack/liquid-glass) | RN/iOS | 原生 API 包装、生命周期坑 |
| [dashersw/liquid-glass-js](https://github.com/dashersw/liquid-glass-js) | JS/WebGL | 截图式折射（反面教材：性能） |

## 许可

MIT
