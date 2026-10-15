# GlassDialog 底部抽屉

**移动端形态的对话框**。从底部滑入，而不是居中弹窗。

> [!WARNING] 本页没有在线演示
> Compose 组件是 Kotlin 代码，编译成桌面 / Android 原生程序，**无法在浏览器里运行**。
> 效果请参考[验证报告](/verification)里的截图（桌面截图 + Xiaomi 13 真机截图）。

## 基础用法

```kotlin
Box(Modifier.fillMaxSize()) {
    // 页面内容

    GlassDialog(
        visible = showDialog,
        onDismiss = { showDialog = false },
        backdrop = backdrop,
        title = "确认删除",
        message = "此操作不可撤销。",
        actions = listOf(
            GlassDialogAction("取消", onClick = { showDialog = false }),
            GlassDialogAction("删除", onClick = { doDelete(); showDialog = false }, danger = true),
        ),
    )
}
```

## 为什么是底部抽屉而不是居中弹窗

| 原因 | 说明 |
|---|---|
| **拇指可达性** | 屏幕下缘是单手最容易触及的区域 |
| **键盘弹出不遮挡** | 居中弹窗会被软键盘顶掉，底部抽屉不会 |

因此入场动画是 `slideInVertically`（自下而上），而非桌面的缩放淡入。

## 动作按钮

```kotlin
actions = listOf(
    GlassDialogAction("取消", onClick = { /* ... */ }),
    GlassDialogAction("删除", onClick = { /* ... */ }, danger = true),   // 红色
)
```

`danger = true` 用于破坏性操作。

::: tip 尾随 lambda 对 `onClick` 不生效
`GlassDialogAction` 的最后一个参数是 `danger`（带默认值），
所以 `GlassDialogAction("取消") { ... }` **编译不过** —— 必须显式写：

```kotlin
GlassDialogAction("取消", onClick = { showDialog = false })
```
:::

## 自定义内容

`message` 不够用时用 `content` 插槽：

```kotlin
GlassDialog(
    visible = visible,
    onDismiss = { visible = false },
    backdrop = backdrop,
    title = "选择",
    content = {
        Column {
            Text("自定义内容区")
            // 任意 Composable
        }
    },
)
```

## 为什么不用 Dialog

Compose 的 `Dialog` 是**独立窗口**，采样不到父级 backdrop，玻璃会退化。

因此本组件用同层 Box 铺满父容器作遮罩 —— 与 `GlassTooltip`、`GlassMenu` 同理。

::: warning 需要父容器铺满可用区域
否则遮罩不完整。
:::

## Android 返回键

组件**不**自己处理返回键 —— 应由调用方接 `BackHandler`：

```kotlin
BackHandler(enabled = showDialog) { showDialog = false }
```

::: tip 为什么交给调用方
组件不持有导航栈的知识。返回键该关对话框还是退出页面，
只有调用方知道 —— 强行内建会限制使用场景。
:::

## API

### 参数

| 参数 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `visible` | `Boolean` | — | **必填**。是否显示 |
| `onDismiss` | `() -> Unit` | — | **必填**。点击遮罩关闭时调用 |
| `backdrop` | `Backdrop` | — | **必填**。被采样的背景层 |
| `title` | `String` | — | **必填**。标题 |
| `modifier` | `Modifier` | `Modifier` | 修饰符 |
| `message` | `String?` | `null` | 正文说明 |
| `actions` | `List<GlassDialogAction>` | `emptyList()` | 底部动作按钮 |
| `content` | `(@Composable () -> Unit)?` | `null` | 自定义内容插槽 |

### GlassDialogAction

| 字段 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `label` | `String` | — | 按钮文字 |
| `onClick` | `() -> Unit` | — | 点击回调 |
| `danger` | `Boolean` | `false` | 破坏性操作（红色） |

```kotlin
data class GlassDialogAction(
    val label: String,
    val onClick: () -> Unit,
    val danger: Boolean = false,
)
```

## 模态的透明度预算

对话框**不参与折射** —— 它盖在全屏遮罩上，背后没有值得采样的内容。

但它的**颜色仍必须显式设置**：遮罩用 `overlay`（不透明度约 0.55），
面板用 `surfaceModal`（约 0.82，高于普通玻璃的 0.44）。

::: danger 这个失败在 DOM/单元测试里看不出来
如果只切主题属性、依赖 CSS 回退，遮罩会几乎不可见、内容会透进面板。
这个坑我们踩过 —— 只在渲染截图里才暴露。
:::

## 测试覆盖

6 个用例：不可见时不渲染、可见时渲染标题/正文/动作、
动作回调触发且不误触发、自定义内容渲染、无正文无动作可用、dismiss 接线。

## 已知限制

- 未实现多层对话框的堆叠管理
- 未内建返回键处理（见上）
