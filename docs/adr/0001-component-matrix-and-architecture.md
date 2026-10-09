# ADR-0001：组件矩阵与分层架构

- 状态：提议（待确认）
- 日期：2026-10-08
- 决策者：Wei-Zhang09
- 相关：本仓库 README、`docs/adr/0002-*`

## 背景

要把六个液态玻璃参考实现（`rdev/liquid-glass-react`、`dashersw/liquid-glass-js`、`Kyant0/AndroidLiquidGlass`、`AndrewPrifer/liquid-dom`、`callstack/liquid-glass`、`archisvaze/liquid-glass`）整理成一套可复用的多端 UI 组件库，要求：

1. 通用性——一次定义，多端可用
2. 易用性——接入成本低
3. 平台适配——不同端的组件侧重不同

第 3 点是本 ADR 要解决的核心问题：**不能把同一份组件清单平铺到所有平台**。

## 证据：各端实际用到哪些组件

不是凭印象列的。以下来自逐个仓库的 demo / catalog 源码统计。

| 来源 | 实际演示的组件 |
|---|---|
| `AndroidLiquidGlass` `catalog/components/` | `LiquidButton`、`LiquidToggle`、`LiquidSlider`、`LiquidBottomTab(s)` |
| `AndroidLiquidGlass` `catalog/destinations/`（14 个页面） | Home、Buttons、Toggle、Slider、BottomTabs、ControlCenter、Dialog、LockScreen、Magnifier、ProgressiveBlur、AdaptiveLuminance、ScrollContainer、LazyScrollContainer、GlassPlayground |
| `liquid-dom` `demo/showcase/src/demos/`（8 个） | ControlCenter、IosNotification、Menu、MusicSidebar、NotificationCenter、VideoControls、R3F |
| `liquid-dom` `packages/react/src/components.tsx` | `HStack`、`VStack`、`ZStack`、`Frame`、`Padding`、`Overlay`、`Background`、`Transform`、`GlassContainer`、`Glass`、`Html`、`Spacer` |
| `callstack/liquid-glass` RN 示例 | `LiquidGlassView`、`LiquidGlassContainerView`、`Text` + `PlatformColor('labelColor')` |
| `archisvaze/liquid-glass` 控件面板 | 参数实验室：厚度、bezel、IOR、模糊、圆角、高光透明度/饱和度、内/外阴影、tint、背景选择器 |
| `liquid-glass-react` 示例 | 单个 `LiquidGlass` 组件 + 全参数面板 |

### 从证据得出的两个结论

**结论 1：核心原语是跨端一致的，只有三个。**

所有六个实现，无论语言，最终都归结为：

- 一个**玻璃面**（容器，内部放任意内容）——`Glass` / `LiquidGlassView` / `drawBackdrop` / `.glassEffect()`
- 一个**可交互玻璃按钮**——`LiquidButton` / `interactive: true` / `.interactive()`
- 一个**玻璃组容器**（负责多块玻璃的合并/融合）——`GlassContainer` / `LiquidGlassContainerView` / `GlassEffectContainer` / `UIGlassContainerEffect`

**结论 2：高频组件按平台分化明显。**

| 组件 | Web | iOS | Android | Desktop | 证据 |
|---|---|---|---|---|---|
| 玻璃面 / 卡片 | 强 | 中 | 中 | 强 | web 卡片布局是主流；liquid-dom showcase 全是面板 |
| 玻璃导航栏（顶部吸顶） | **强** | 强 | 强 | 中 | web 站点头部；iOS nav bar；Android top app bar |
| 玻璃底栏 / 标签栏 | 弱 | **强** | **强** | 弱 | Android catalog 有 `LiquidBottomTabs`；iOS tab bar |
| 玻璃侧栏 / 导航栏 | 中 | 弱 | 弱 | **强** | 桌面应用主导；web 后台管理 |
| 玻璃对话框 / 弹窗 | 中 | **强** | **强** | 中 | iOS 通知/控制中心；Android `DialogContent` |
| 玻璃底部抽屉 | 弱 | **强** | **强** | 弱 | 移动端独有交互 |
| 玻璃开关 | 弱 | **强** | **强** | 弱 | Android catalog 有 `LiquidToggle` |
| 玻璃滑块 | 弱 | **强** | **强** | 弱 | Android catalog 有 `LiquidSlider`；控制中心 |
| 玻璃分段控件 | 中 | **强** | 中 | 弱 | iOS 常见 |
| 玻璃菜单 / 下拉 | **强** | 中 | 中 | **强** | liquid-dom 有 `MenuDemo` |
| 玻璃搜索栏 | 强 | 强 | 强 | 中 | 三端都有 |
| 玻璃列表项 | 中 | **强** | **强** | 中 | 移动端设置页 |
| 玻璃悬浮按钮 FAB | 弱 | 弱 | **强** | 弱 | Material 设计语言特有 |
| 玻璃提示 / Toast | 中 | **强** | 强 | 中 | liquid-dom 有 `IosNotificationDemo` |
| 玻璃进度 / 加载 | 中 | 中 | 中 | 中 | 通用 |
| 玻璃工具提示 Tooltip | **强** | 弱 | 弱 | **强** | 桌面/web 悬停交互 |

## 决策

### D1：四层架构，token 单源

```
LiquidGlassUI/
├── packages/tokens/      ← 唯一真源：颜色/圆角/模糊/bezel/IOR/光照方向
├── packages/web/         ← React + TS（SVG 位移折射 + CSS 降级）
├── packages/compose/     ← Kotlin / Compose Multiplatform
├── packages/apple/       ← Swift Package（SwiftUI + UIKit）
├── packages/rn/          ← React Native（iOS 原生，Android 降级）
└── examples/             ← 各端可运行示例
```

**理由**：四个平台的渲染实现无法共享代码（语言不同），但**设计参数必须共享**，否则四端观感会漂移。`tokens` 用 JSON 作为唯一真源，各端生成对应语言的原生常量。

**取舍**：JSON → 四份生成代码需要构建脚本。选它而不是手写四份常量，是因为手写必然漂移——这是本库"通用性"承诺的物理基础。

### D2：API 命名跨端对齐，但用各端惯用法

不追求"同名同签名"，追求**概念一一对应**：

| 概念 | Web | Compose | SwiftUI | RN |
|---|---|---|---|---|
| 玻璃面 | `<GlassSurface>` | `Modifier.glassSurface()` | `.glassSurface()` | `<GlassSurface>` |
| 可交互玻璃 | `<GlassButton>` | `<GlassButton>` | `GlassButton` | `<GlassButton>` |
| 玻璃组 | `<GlassGroup spacing>` | `GlassGroup(spacing)` | `GlassGroup(spacing:)` | `<GlassGroup spacing>` |

**理由**：强行统一签名会违反各端惯例（Swift 用 `label:`、Compose 用 `Modifier`、Web 用 children）。**易用性的定义是"本端开发者觉得自然"，不是"跨端字面一致"。**

### D3：v1 只做 10 个核心组件，其余进 v2

**v1（跨端一致的核心）**：

1. `GlassSurface` — 基础玻璃面
2. `GlassButton` — 可交互玻璃按钮
3. `GlassGroup` — 玻璃组合并容器
4. `GlassCard` — 卡片（Surface + 内边距 + 圆角预设）
5. `GlassNavBar` — 顶部导航
6. `GlassBottomBar` — 底部标签栏
7. `GlassDialog` — 对话框
8. `GlassSwitch` — 开关
9. `GlassSlider` — 滑块
10. `GlassSegmentedControl` — 分段控件

**v2（平台特色，按端实现）**：`GlassMenu`、`GlassSidebar`、`GlassSearchBar`、`GlassToast`、`GlassListItem`、`GlassFAB`、`GlassChip`、`GlassTooltip`、`GlassProgress`

**理由**：v1 覆盖了"结论 2"表格里三端都 ≥中 的组件，以及移动端最高频的控制类组件。`GlassFAB`、`GlassTooltip` 这类单端专属的放 v2，避免 v1 里塞一半平台用不到的东西。

### D4：能力门控是一等公民

每个组件必须暴露"本平台是否支持真实折射"的查询，并在不支持时**自动降级**而非静默失效：

| 平台 | 门控 API |
|---|---|
| Web | `isGlassRefractionSupported()`（UA 嗅探，因 `@supports` 对 Firefox 说谎） |
| Compose | `isRuntimeShaderSupported()` / `isRenderEffectSupported()` |
| iOS | `isLiquidGlassSupported`（`#available(iOS 26.0, *)` + `NSClassFromString`） |
| RN | `isLiquidGlassSupported`（非 iOS 恒为 false） |

**理由**：四个平台的能力门控**全部是静默失败**（web 的 Firefox 不报错、Compose 的 effect 直接 return、RN 的非 iOS 导出是个裸 `View`）。这是本项目最容易让使用者踩坑的地方，必须在 API 层面暴露。

## 后果

### 正面

- token 单源，四端观感不会漂移
- 组件分层清晰，v1 范围可控
- 能力门控显式暴露，使用者不会遇到"没报错但没效果"

### 负面 / 风险

- **四端无法共享渲染代码**，`packages/` 下四份实现，维护成本 ×4
- **Windows 上无法验证 Swift 与 iOS 部分**。本机无 macOS，`packages/apple` 与 RN 的 iOS 侧只能做到"代码写对、编译未验证"，必须在 README 和发布说明里如实标注，不能声称"已验证"
- token 生成脚本引入构建复杂度

### 待确认

1. 包名与发布目标：是否发布到 npm / Maven Central / SwiftPM？（影响 `package.json`、`build.gradle.kts`、`Package.swift` 的配置）
2. Web 端是否同时提供 React 与 Web Components 两种封装？（Web Components 可覆盖 Vue/Svelte，但开发量翻倍）
3. v1 是否需要深色/浅色主题的自动适配，还是先只做深色？
