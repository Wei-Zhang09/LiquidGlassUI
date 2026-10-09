# LiquidGlassUI

跨端液态玻璃（Liquid Glass）UI 组件库。**一次定义设计参数，四端一致渲染。**

> 状态：**v0.1 规划中**。架构与组件矩阵见 [ADR-0001](docs/adr/0001-component-matrix-and-architecture.md)。

## 这是什么

Apple 在 iOS 26 引入 Liquid Glass 材质后，各生态出现了大量独立实现。本项目把这些实现的经验收敛成一套**统一的、可跨端复用的组件库**，重点解决三件事：

1. **通用性** — 设计参数（颜色、圆角、模糊、bezel 宽度、折射率、光照方向）在 `packages/tokens` 单点定义，四端生成原生常量，观感不会漂移
2. **易用性** — 组件 API 遵循各端惯用法，接入成本低；能力门控显式暴露，不会遇到"没报错但没效果"
3. **平台适配** — 不同端的组件侧重不同，不是把同一份清单平铺到所有平台

## 平台支持

| 平台 | 包 | 真实折射 | 最低版本 |
|---|---|---|---|
| Web (React) | `@liquidglass/web` | ✅ 仅 Chromium（SVG 位移） | 现代浏览器；降级为磨砂 |
| Android / Compose MP | `io.github.weizhang09:liquidglass-compose` | ✅ AGSL 运行时着色器 | Android API 33 |
| iOS / SwiftUI + UIKit | `LiquidGlassUI` (SwiftPM) | ✅ 系统材质 | iOS 26 |
| React Native | `@liquidglass/rn` | ✅ 仅 iOS（包装原生） | iOS 26 + RN 0.80+ |

**各端能力门控**（调用前请检查，四端全部是静默失败）：

```ts
// Web
import { isGlassRefractionSupported } from '@liquidglass/web'
// Compose
isRuntimeShaderSupported(); isRenderEffectSupported()
// Swift
LiquidGlassUI.isSupported
// RN
import { isLiquidGlassSupported } from '@liquidglass/rn'
```

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
