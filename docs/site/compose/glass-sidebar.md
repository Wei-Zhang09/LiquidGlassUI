# GlassSidebar 侧边导航

**桌面主导航形态**。左侧竖向列表，条目带悬停态。

> [!WARNING] 本页没有在线演示
> Compose 组件是 Kotlin 代码，编译成桌面 / Android 原生程序，**无法在浏览器里运行**。
> 效果请参考[验证报告](/verification)里的截图（桌面截图 + Xiaomi 13 真机截图）。

## 基础用法

```kotlin
GlassSidebar(
    backdrop = backdrop,
    items = listOf(
        GlassSidebarItem("home", "概览"),
        GlassSidebarItem("components", "组件", badge = "11"),
        GlassSidebarItem("tokens", "设计参数"),
        GlassSidebarItem("settings", "设置"),
    ),
    selectedId = selected,
    onSelect = { selected = it },
)
```

## 图标

`icon` 是 `@Composable` 插槽 —— **不绑定任何图标库**，你用什么图标库都行：

```kotlin
GlassSidebarItem(
    id = "home",
    label = "概览",
    icon = { Icon(Icons.Default.Home, contentDescription = null) },
)
```

也可以传任意 Composable：

```kotlin
GlassSidebarItem("star", "收藏", icon = { Text("★", fontSize = 16.sp) })
```

## 头部与底部插槽

```kotlin
GlassSidebar(
    backdrop = backdrop,
    items = items,
    selectedId = selected,
    onSelect = { selected = it },
    header = { Text("LiquidGlassUI", fontWeight = FontWeight.SemiBold) },
    footer = { Text("v0.1.0", fontSize = 11.sp) },
)
```

## 平台适配

| | 桌面 | 触屏 |
|---|---|---|
| 悬停 | 底色加深（三档） | **无**（触屏没有 hover） |
| 点击 | 正常 | 正常 |

::: tip 悬停缺失不影响功能
`GlassSidebar` 只把悬停当**视觉增强**，核心操作是 click ——
所以触屏上功能完整，可以跨端复用。这一点是实测得出的，不是推测。
:::

## API

### 参数

| 参数 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `backdrop` | `Backdrop` | — | **必填**。被采样的背景层 |
| `items` | `List<GlassSidebarItem>` | — | **必填**。导航项 |
| `selectedId` | `String?` | — | 当前选中项的 `id` |
| `onSelect` | `(String) -> Unit` | — | 选中回调，参数是 `id` |
| `modifier` | `Modifier` | `Modifier` | 修饰符 |
| `width` | `Dp` | `240.dp` | 侧栏宽度 |
| `shape` | `Shape` | `RoundedCornerShape(GlassRadiusTokens.xl)` | 形状（圆角默认 32dp） |
| `header` | `(@Composable () -> Unit)?` | `null` | 顶部插槽 |
| `footer` | `(@Composable () -> Unit)?` | `null` | 底部插槽 |

### GlassSidebarItem

| 字段 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `id` | `String` | — | 唯一标识，回调里返回 |
| `label` | `String` | — | 显示文字 |
| `icon` | `(@Composable () -> Unit)?` | `null` | 图标插槽 |
| `badge` | `String?` | `null` | 右侧徽标（如未读数） |

```kotlin
data class GlassSidebarItem(
    val id: String,
    val label: String,
    val icon: (@Composable () -> Unit)? = null,
    val badge: String? = null,
)
```
