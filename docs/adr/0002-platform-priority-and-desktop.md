# ADR-0002：优先级调整与 Windows 桌面端策略

- 状态：已接受
- 日期：2026-10-08
- 相关：ADR-0001（组件矩阵与分层架构）

## 背景

ADR-0001 按 `web / compose / apple / rn` 四条线平铺。实际推进时确认了两件事：

1. **开发机是 Windows，无 macOS。** `packages/apple` 与 RN 的 iOS 侧只能写出代码，无法编译、运行、截图。按 ADR-0001 平铺推进，会产生大量"看起来完成但未验证"的产出——这违反本项目的验证原则。
2. **用户明确优先级：Web 端 > Windows 桌面端 > 移动端。**

## 决策

### D1：优先做「可运行可验证」的两端

| 优先级 | 目标 | 可否在本机验证 |
|---|---|---|
| P0 | Web（浏览器） | ✅ Chromium + Firefox 双浏览器实测 |
| P1 | Windows 桌面 | ✅ 可编译可运行 |
| P2 | 移动端（Android） | ✅ 可编译；模拟器需确认 |
| P3 | iOS | ❌ 无 macOS，仅出代码骨架 |

iOS 相关卡片保留在板上但标记为 `blocked`，并注明阻塞原因。**不得**在文档中声称 iOS 部分已验证。

### D2：Windows 桌面端走 Compose Multiplatform，不另起一套

关键事实（读 `AndroidLiquidGlass/backdrop/build.gradle.kts` 得到）：

```kotlin
jvm("desktop")
js { browser() }
wasmJs { browser() }
macosArm64()
iosArm64("iosArm64")
iosSimulatorArm64("iosSimulatorArm64")
```

`io.github.kyant0:backdrop` **本身就以 JVM desktop 为一等目标**。因此：

- `packages/compose` 一套代码 → 同时产出 Android + Windows + macOS + Linux
- **不需要**为 Windows 桌面单独写一份实现
- 这直接满足"Windows 桌面端 + 移动端"的合并需求

### D3：WPF 只做能力说明，不做实现

本机环境已知（来自既有项目经验）：**WPF 没有元素级背景模糊**，液态玻璃只能通过 P/Invoke `SetWindowCompositionAttribute` 启用 DWM Acrylic，且作用范围是**整个窗口**，不是单个控件。

因此：

- WPF **无法**实现本项目定义的液态玻璃（边缘折射、per-element 材质）
- 在 WPF 中最多得到"窗口级毛玻璃"
- 本仓库**不提供** WPF 实现。README 中说明该限制，避免使用者在错误的方向上投入

若必须在 WPF 中做，唯一可行路径是承载 WebView2 并复用 `@liquidglass/web`，代价是放弃原生观感与性能。

### D4：桌面端的组件侧重与移动端不同

来自 ADR-0001 的组件矩阵，桌面端的高频项是：

| 组件 | 桌面端 | 说明 |
|---|---|---|
| `GlassSidebar` | **强** | 桌面应用主导形态，移动端几乎不用 |
| `GlassMenu` | **强** | 右键/下拉菜单 |
| `GlassTooltip` | **强** | 悬停交互，触屏无此概念 |
| `GlassDialog` | 中 | 桌面为独立窗口或模态层 |
| `GlassNavBar` | 中 | 桌面更常用侧栏而非顶栏 |
| `GlassBottomBar` | 弱 | 移动端形态，桌面少见 |

所以 `GlassSidebar` / `GlassMenu` / `GlassTooltip` 从 v2 **提升到 v1**，因为桌面端是 P1 目标。

## 后果

### 正面

- P0/P1/P2 全部可在本机真实验证，交付质量可控
- 一套 Compose 代码覆盖桌面 + 移动，工作量显著低于原计划
- 提前说明 WPF 限制，避免无效投入

### 负面 / 风险

- iOS 部分仍是"未验证代码"，需在 README 与发布说明中持续标注
- Compose Multiplatform 在 Windows 上的观感非原生（自带渲染层），需实测确认可接受
- 桌面端与移动端的组件差异扩大，`packages/compose` 内部需要平台分支

### 待确认

1. Compose Multiplatform 桌面端在 Windows 上的实际观感与性能，需做出可运行示例后评估
2. 是否需要在 v1 就提供 `GlassSidebar`（桌面）与 `GlassBottomBar`（移动）的平台分支实现
3. 移动端验证是否需要 Android 模拟器/真机（影响 P2 能否真正闭环）
