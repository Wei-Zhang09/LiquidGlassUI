# GlassMenu 下拉菜单

**桌面高频组件**。点击外部关闭，支持分隔线、快捷键、禁用项、危险项。

> [!WARNING] 本页没有在线演示
> Compose 组件是 Kotlin 代码，编译成桌面 / Android 原生程序，**无法在浏览器里运行**。
> 效果请参考[验证报告](/verification)里的截图（桌面截图 + Xiaomi 13 真机截图）。

## 基础用法

```kotlin
GlassMenu(
    backdrop = backdrop,
    items = listOf(
        GlassMenuItem("new", "新建", shortcut = "Ctrl+N"),
        GlassMenuItem("open", "打开", shortcut = "Ctrl+O"),
        GlassMenuItem("d1", "", isDivider = true),
        GlassMenuItem("dup", "创建副本", shortcut = "Ctrl+D"),
        GlassMenuItem("del", "删除", danger = true, shortcut = "Del"),
    ),
) { open, setOpen ->
    GlassButton(onClick = { setOpen(!open) }) {
        Text(if (open) "收起菜单" else "打开菜单")
    }
}
```

## 锚点：为什么用 lambda

最后一个参数 `anchor` 接收一个 `(open, setOpen) -> Unit` 的 Composable。
组件**不持有打开状态** —— 状态由调用方管理，锚点自己决定何时开关。

```kotlin
) { open, setOpen ->          // ← open: Boolean, setOpen: (Boolean) -> Unit
    Button(onClick = { setOpen(!open) }) { Text("菜单") }
}
```

::: tip 受控设计
组件不管状态，就能和任意状态库配合（`remember`、ViewModel、路由状态都可以）。
这和 React 的受控组件是同一个思路。
:::

## 菜单项类型

```kotlin
// 普通项
GlassMenuItem("a", "菜单项 A")

// 带快捷键提示
GlassMenuItem("b", "保存", shortcut = "Ctrl+S")

// 分隔线（其余字段忽略）
GlassMenuItem("d", "", isDivider = true)

// 禁用项（点击无反应）
GlassMenuItem("c", "不可用", enabled = false)

// 危险项（红色）
GlassMenuItem("e", "删除", danger = true)
```

## 点击外部关闭

组件内部用透明捕获层实现（`PointerEventPass.Initial`），
点击菜单外的任意位置即关闭。

::: warning 需要足够大的容器
菜单绘制在锚点布局边界之外（用 `offset`）。若父级设了 `clip`，
菜单会被裁掉。测试与使用都要给足够大的容器。
:::

## 平台适配

| | 桌面 | 触屏 |
|---|---|---|
| 悬停 | 底色加深 | **无** |
| 点击开关 | 正常 | 正常 |

点击驱动的交互在触屏上工作正常 —— 已在 Xiaomi 13 真机验证
（触摸点开菜单，含分隔线与危险项，渲染与桌面一致）。

## API

### 参数

| 参数 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `backdrop` | `Backdrop` | — | **必填**。被采样的背景层 |
| `items` | `List<GlassMenuItem>` | — | **必填**。菜单项 |
| `modifier` | `Modifier` | `Modifier` | 修饰符 |
| `minWidth` | `Dp` | `180.dp` | 菜单最小宽度 |
| `anchor` | `@Composable (open: Boolean, setOpen: (Boolean) -> Unit) -> Unit` | — | 锚点内容 |

### GlassMenuItem

| 字段 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `id` | `String` | — | 唯一标识 |
| `label` | `String` | — | 显示文字 |
| `icon` | `(@Composable () -> Unit)?` | `null` | 图标插槽 |
| `shortcut` | `String?` | `null` | 右侧快捷键提示 |
| `enabled` | `Boolean` | `true` | 是否可点击 |
| `danger` | `Boolean` | `false` | 危险项（红色） |
| `isDivider` | `Boolean` | `false` | 为 true 时渲染为分隔线，其余字段忽略 |

```kotlin
data class GlassMenuItem(
    val id: String,
    val label: String,
    val icon: (@Composable () -> Unit)? = null,
    val shortcut: String? = null,
    val enabled: Boolean = true,
    val danger: Boolean = false,
    val isDivider: Boolean = false,
)
```

### 已知限制

- 未实现子菜单（多级菜单）
- 未实现键盘导航（方向键在项间移动）
