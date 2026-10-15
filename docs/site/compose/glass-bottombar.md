# GlassBottomBar 底部标签栏

**移动端主导航形态**。底部横向标签栏。

> [!WARNING] 本页没有在线演示
> Compose 组件是 Kotlin 代码，编译成桌面 / Android 原生程序，**无法在浏览器里运行**。
> 效果请参考[验证报告](/verification)里的截图（桌面截图 + Xiaomi 13 真机截图）。

## 基础用法

```kotlin
val tabs = listOf(
    GlassTabItem("home", "首页"),
    GlassTabItem("components", "组件"),
    GlassTabItem("settings", "设置"),
)

GlassBottomBar(
    backdrop = backdrop,
    items = tabs,
    selectedId = current,
    onSelect = { current = it },
    modifier = Modifier.align(Alignment.BottomCenter),
)
```

## 与 GlassSidebar 的区别

| | GlassSidebar（桌面） | GlassBottomBar（移动） |
|---|---|---|
| 位置 | 左侧竖向 | 底部横向 |
| 交互反馈 | **悬停**（指针设备） | **按压**（触屏无 hover） |
| 条目布局 | 图标+文字横排、左对齐 | 图标在上文字在下、等宽居中 |
| 可达性 | 鼠标可及全屏 | 拇指区（屏幕下缘） |

::: tip 触屏没有 hover，所以用按压反馈
这不是实现偷懒，是物理限制。移动端的对应交互语言是**按压反馈**
（`collectIsPressedAsState`）。
:::

## 图标

`icon` 是 `@Composable` 插槽，不绑定图标库：

```kotlin
GlassTabItem(
    id = "home",
    label = "首页",
    icon = { Icon(Icons.Default.Home, contentDescription = null) },
)
```

## 徽标

```kotlin
GlassTabItem("inbox", "收件箱", badge = "3")
```

## 高度

```kotlin
GlassBottomBar(
    backdrop = backdrop,
    items = tabs,
    selectedId = current,
    onSelect = { current = it },
    height = 60.dp,   // 默认。移动端常规 56–64dp
)
```

::: warning 安全区需调用方自行处理
组件不感知系统导航栏 / 手势条。在有安全区的设备上，
需要调用方在 `modifier` 里自行加 `padding`。
:::

## API

### 参数

| 参数 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `backdrop` | `Backdrop` | — | **必填**。被采样的背景层 |
| `items` | `List<GlassTabItem>` | — | **必填**。标签项 |
| `selectedId` | `String?` | — | 当前选中项的 `id` |
| `onSelect` | `(String) -> Unit` | — | 选中回调，参数是 `id` |
| `modifier` | `Modifier` | `Modifier` | 修饰符 |
| `height` | `Dp` | `60.dp` | 栏高 |
| `shape` | `Shape` | `RoundedCornerShape(GlassRadiusTokens.lg)` | 形状（圆角默认 26dp） |

### GlassTabItem

| 字段 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `id` | `String` | — | 唯一标识，回调里返回 |
| `label` | `String` | — | 显示文字 |
| `icon` | `(@Composable () -> Unit)?` | `null` | 图标插槽 |
| `badge` | `String?` | `null` | 徽标文字 |

```kotlin
data class GlassTabItem(
    val id: String,
    val label: String,
    val icon: (@Composable () -> Unit)? = null,
    val badge: String? = null,
)
```

## 无障碍

条目使用 `selectable` + `Role.Tab`，让无障碍服务正确朗读选中状态。

## 测试覆盖

6 个用例：点击回调传对 `id`、受控于 `selectedId`、全部标签渲染、
徽标渲染、空列表不崩、选中态语义标记。
