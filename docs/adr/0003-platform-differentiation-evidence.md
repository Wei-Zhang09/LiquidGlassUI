# ADR-0003：组件按平台分化的实证依据

- 状态：已接受
- 日期：2026-10-14
- 相关：ADR-0001（组件矩阵）、ADR-0002（平台优先级）

## 背景

ADR-0001 主张「组件按平台分化」——桌面用悬停、移动用按压，两端各有专属组件。
但 Compose Multiplatform 的卖点是**一套代码跨端**。如果组件其实都能通用，
那维护两套就是浪费。

这个主张需要一个可验证的判据，而不是设计偏好。

## 决策

用**同一份测试代码，分别以鼠标输入和触摸输入驱动同一批组件**，
以实际行为差异作为判据。

测试位于 `packages/compose/src/commonTest/.../PlatformInteractionTest.kt`，
用 Compose 的 `performMouseInput` / `performTouchInput` 分别注入两种输入。

## 实证结果

| 组件 | 鼠标悬停 | 触摸点击 | 判定 |
|---|---|---|---|
| `GlassTooltip` | 显示提示 | **不显示** | **必须分化** |
| `GlassSidebar` | 悬停改底色 | 点击正常 | 优雅降级，可复用 |
| `GlassMenu` | 悬停改底色 | 开关正常 | 优雅降级，可复用 |

四个用例全部通过（`desktopTest`）。

### 关键发现

**分化与否取决于组件是否把「悬停」当唯一触发方式**：

- `GlassTooltip` 的**唯一**显示途径是 hover → 触屏上功能完全丧失 → 必须分化
- `GlassSidebar` / `GlassMenu` 把 hover 只当**视觉增强**，核心操作是 click
  → 触屏上功能完整，只是少一层反馈 → 可复用

所以正确的规则不是「桌面组件 vs 移动组件」，
而是：**核心操作是否依赖 hover**。

## 真机复核

在 Xiaomi 13（Android 16 / API 36）上把 `GlassMenu` 装进示例：
触摸点开菜单 → 正常弹出，含分隔线与危险项。与桌面行为一致。

截图：`docs/screenshots/android-desktop-components.png`

## 后果

- `GlassTooltip` 在移动端不推荐使用（触屏上永不显示）
- `GlassSidebar` / `GlassMenu` 可以跨端复用，不必维护两套
- 新增组件时应先问：**核心操作是否依赖 hover？**
  - 是 → 提供触屏替代触发方式，或明确标注桌面专用
  - 否 → 直接进 `commonMain` 复用

## 未验证

- 触屏上的长按（long-press）作为 hover 替代方案未做
- 手写笔 / 混合输入设备未覆盖
