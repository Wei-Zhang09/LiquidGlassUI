# GlassSurface 玻璃面

所有 Compose 玻璃元素的**材质底板**。其余组件都建立在它之上。

> [!WARNING] 本页没有在线演示
> Compose 组件是 Kotlin 代码，编译成桌面 / Android 原生程序，**无法在浏览器里运行**。
> 效果请参考[验证报告](/verification)里的截图（桌面截图 + Xiaomi 13 真机截图）。

## 基础用法

```kotlin
val backdrop = rememberLayerBackdrop()

GlassSurface(
    backdrop = backdrop,
    modifier = Modifier.size(280.dp, 120.dp),
    shape = RoundedCornerShape(GlassRadiusTokens.lg),
    level = GlassLevel.Elevated,
) {
    Text("玻璃面")
}
```

## 材质层级

`level` 控制模糊强度，对应 tokens 里的模糊值：

| 值 | 模糊 | 用途 |
|---|---|---|
| `GlassLevel.Plain` | `0.dp` | 无模糊，仅作材质底板 |
| `GlassLevel.Regular` | `8.dp` | 常规玻璃面（导航、卡片） |
| `GlassLevel.Elevated` | `16.dp` | 抬升玻璃面（重要面板） |
| `GlassLevel.Focused` | `30.dp` | 交互焦点玻璃面（CTA） |

```kotlin
GlassSurface(backdrop = backdrop, level = GlassLevel.Plain) { Text("plain") }
GlassSurface(backdrop = backdrop, level = GlassLevel.Regular) { Text("regular") }
GlassSurface(backdrop = backdrop, level = GlassLevel.Elevated) { Text("elevated") }
GlassSurface(backdrop = backdrop, level = GlassLevel.Focused) { Text("focused") }
```

::: tip 不要所有元素用同一层级
深度关系靠层级差异表达。全用 `Elevated` 会让界面失去层次。
:::

## 关闭折射

`refraction = false` 只保留模糊（对应 Web 端的 `frost` 档位）。
用于性能敏感场景，或在不支持运行时着色器的设备上。

```kotlin
GlassSurface(backdrop = backdrop, refraction = false) {
    Text("仅模糊，不折射")
}
```

## 自定义形状

`shape` 接受任意 `Shape`。折射沿该形状的边缘发生。

```kotlin
GlassSurface(
    backdrop = backdrop,
    shape = CircleShape,
) { Text("圆形玻璃") }
```

## API

### 参数

| 参数 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `backdrop` | `Backdrop` | — | **必填**。被采样的背景层 |
| `modifier` | `Modifier` | `Modifier` | 修饰符 |
| `shape` | `Shape` | `RoundedCornerShape(GlassRadiusTokens.lg)` | 形状（圆角默认 26dp） |
| `level` | `GlassLevel` | `GlassLevel.Regular` | 材质层级 |
| `refraction` | `Boolean` | `true` | 是否启用边缘折射 |
| `content` | `@Composable BoxScope.() -> Unit` | — | 内容（`BoxScope`，可 `align`） |

### GlassLevel 枚举

```kotlin
enum class GlassLevel {
    Plain,      // 无模糊，仅作为材质底板
    Regular,    // 常规玻璃面（导航、卡片）
    Elevated,   // 抬升玻璃面（重要面板）
    Focused,    // 交互焦点玻璃面（CTA）
}
```

## 相关

- [GlassGroup](/desktop/glass-group) —— 多个玻璃元素融合
- [设计原则](/guide/design) —— 材质是怎么构成的
