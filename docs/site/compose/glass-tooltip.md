# GlassTooltip 提示框

**双端可用**：桌面悬停显示，触屏长按显示。

> [!WARNING] 本页没有在线演示
> Compose 组件是 Kotlin 代码，编译成桌面 / Android 原生程序，**无法在浏览器里运行**。
> 效果请参考[验证报告](/verification)里的截图（桌面截图 + Xiaomi 13 真机截图）。

## 基础用法

```kotlin
GlassTooltip(
    text = "打开设置",
    backdrop = backdrop,
) {
    GlassButton(onClick = { /* ... */ }) { Text("设置") }
}
```

## 两种触发方式

| 设备 | 触发 | 机制 |
|---|---|---|
| 指针（鼠标/触控板） | 悬停 | `hoverable` + `collectIsHoveredAsState` |
| 触屏 | **长按** | 自定义手势检测 |

触屏没有 hover（手指离屏幕 2 厘米，电容屏不知道），长按是各平台通用的替代语义。

## 为什么不用 `detectTapGestures`

`detectTapGestures` 在收到 down 时**立即消费**事件，会破坏子元素自身的点击。
而 tooltip 的锚点通常是按钮，需要：

- **短按** → 照常触发锚点的动作（用户要的是那个功能）
- **长按** → 显示提示，且**不**触发动作

因此组件手写检测：在 `PointerEventPass.Initial` 上监听（父级先于子级收到事件），
超时前抬起则完全不干预；判定为长按后消费后续事件，锚点因事件被消费而取消点击。

::: warning `waitForUpOrCancellation` 返回 null 有两种原因
1. **超时** → 确实是长按
2. **事件被他人消费**（如父级滚动接管）→ 手势取消

必须区分，否则在可滚动列表里**一滚就弹提示**。
:::

## 松手后保持显示

长按触发后**松手不隐藏**，下次按下才关闭。

理由：按住时手指正盖着提示文字，松手就消失等于用户根本读不到。
（这是测试暴露出的设计问题 —— 最初实现用 `finally` 在松手时隐藏。）

## 位置

```kotlin
GlassTooltip(
    text = "提示",
    backdrop = backdrop,
    placement = TooltipPlacement.Below,   // 默认，锚点在窗口上方时用
) { ... }

GlassTooltip(
    text = "提示",
    backdrop = backdrop,
    placement = TooltipPlacement.Above,   // 锚点靠近窗口底部时用，避免被裁掉
) { ... }
```

## 延迟

```kotlin
GlassTooltip(
    text = "提示",
    backdrop = backdrop,
    showDelayMillis = 0,        // 无延迟，立即显示（测试用）
) { ... }

GlassTooltip(
    text = "提示",
    backdrop = backdrop,
    showDelayMillis = GlassMotionTokens.SLOW,   // 默认 400ms
) { ... }
```

::: tip 为什么要延迟
立即显示会在鼠标划过时闪出一串提示，延迟是必要的 UX 约定。
`showDelayMillis <= 0` 时**不走协程**（直接从 hovered 派生），
这样"无延迟"是真正的同步语义，也使其可在测试中确定性断言。
:::

长按**不受此值影响**，用系统长按超时。

## 关闭长按

锚点自身需要长按时可关掉：

```kotlin
GlassTooltip(
    text = "提示",
    backdrop = backdrop,
    enableLongPress = false,   // 只保留悬停触发
) { ... }
```

## 为什么不用 Popup

Compose Desktop 的 `Popup` 会创建**独立窗口**，它采样不到父级的 backdrop，
玻璃会退化成普通半透明块。因此本组件用同层 overlay 实现。

::: warning 父级设了 `clip` 提示会被裁掉
提示框绘制在锚点所在的 Box 内，依靠 Compose 默认不裁剪的特性溢出显示。
使用方需保证锚点所在容器有足够空间，或选择合适的方向。
:::

## API

### 参数

| 参数 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `text` | `String` | — | **必填**。提示文字 |
| `backdrop` | `Backdrop` | — | **必填**。被采样的背景层 |
| `modifier` | `Modifier` | `Modifier` | 修饰符 |
| `placement` | `TooltipPlacement` | `TooltipPlacement.Below` | 相对锚点的位置 |
| `showDelayMillis` | `Int` | `GlassMotionTokens.SLOW`（400） | 悬停多久后显示 |
| `enableLongPress` | `Boolean` | `true` | 是否启用长按触发 |
| `content` | `@Composable () -> Unit` | — | 锚点内容 |

### TooltipPlacement 枚举

```kotlin
enum class TooltipPlacement {
    Below,   // 锚点下方（默认）
    Above,   // 锚点上方
}
```

## 测试覆盖

8 个单元测试：

| 用例 | 验证内容 |
|---|---|
| `shortTapStillTriggersAnchorClick` | **短按不被破坏**（最关键） |
| `longPressShowsTooltip` | 长按显示 |
| `longPressDoesNotTriggerAnchorClick` | 长按不误触发点击 |
| `tooltipStaysVisibleAfterLongPressRelease` | 松手后保持 |
| `nextTapDismissesTooltipAndStillClicks` | 关闭那次点击仍生效 |
| `multipleShortTapsAllRegister` | 连续短按不丢 |
| `longPressCanBeDisabled` | 可关闭 |
| `hoverStillWorks` | 悬停路径未被破坏 |

::: warning 真机手感未评估
组件已装进 Android 真机示例并能渲染，但小米拦 `adb shell input tap`，
**无法脚本化触发长按** —— 长按动作的真机手感尚未评估。
:::
