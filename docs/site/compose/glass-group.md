# GlassGroup 玻璃融合

让相邻的玻璃**融成一团**，而不是各自贴在一起。

> [!WARNING] 本页没有在线演示
> Compose 组件是 Kotlin 代码，编译成桌面 / Android 原生程序，**无法在浏览器里运行**。
> 效果请参考[验证报告](/verification)里的截图（桌面截图 + Xiaomi 13 真机截图）。

## 基础用法

```kotlin
GlassGroup(
    backdrop = backdrop,
    shapes = listOf(
        RectShape(0f, 0f, 56f, 56f, 28f),
        RectShape(74f, 0f, 56f, 56f, 28f),   // 与上一个拉开 18dp 缝隙
    ),
    smoothing = 22.dp,
    modifier = Modifier.size(130.dp, 56.dp),
)
```

`smoothing` 是融合半径：两个形状的距离场在半径内被平滑并集（smooth min）缝合。

| `smoothing` | 效果 |
|---|---|
| `22.dp` | 两圆融成花生形，中间桥接 |
| `0.dp` | 只做普通并集，两个独立的圆 |

## 为什么不能用库自带的 `lens()`

backdrop 库的 `lens()` **只支持圆角矩形**，传自定义形状会在运行时抛：

```
java.lang.UnsupportedOperationException:
  Only RoundedRectangularShape or CornerBasedShape is supported in lens effects.
    at com.kyant.backdrop.effects.LensKt.throwUnsupportedSDFException(Lens.kt:117)
```

反编译确认：`lens()` 内部把 `shape` 强转成 `RoundedRectangularShape` 取四角半径，
任何非圆角矩形都被拒。

::: warning 这条路我们实测撞过
先把融合轮廓算成 `Outline.Generic` 再交给 `lens()` 的方案**不可行** ——
运行时直接抛异常。见 [ADR-0004](https://github.com/Wei-Zhang09/LiquidGlassUI/blob/main/docs/adr/0004-compose-glass-group-fusion.md)。
:::

## 实际做法：自定义 AGSL 着色器

用 `runtimeShaderEffect` 提供自定义 AGSL，在 GPU 上：

1. 对多个矩形做**平滑并集**（smooth min）
2. 对融合距离场求**中心差分梯度**，作为折射方向
3. 用 SDF 掩码裁出非矩形外形

这与 Web 端 `packages/web/src/sdf.ts` 是同一套算法的两个实现。

```kotlin
// 组件内部（简化）
runtimeShaderEffect(
    key = "FusedRefraction",
    shaderString = FUSED_LENS_SHADER,
    uniformShaderName = "content",
) {
    setFloatUniform("rects", packed.rects)
    setFloatUniform("radii", packed.radii)
    setIntUniform("count", packed.count)
    setFloatUniform("smoothing", smoothingPx)
    // ...
}
```

::: danger 着色器编译失败是静默的
Skia 编译失败时返回 `null`，组件**退化成普通矩形且不抛任何异常**。

因此本库有一个用 `RuntimeEffect.makeForShader` **真实编译**着色器的测试 ——
没有它，只能从截图看出"效果不对"，看不出原因。
:::

## 验证方式

真融合的判据是**两圆之间缝隙处的条纹是否保持笔直**：

| 样例 | 缝隙处条纹 | 判读 |
|---|---|---|
| `smoothing=22` | 弯曲、被桥接 | 融合 |
| `smoothing=0` | **保持笔直** | 未融合（两个独立的圆） |

桌面与 Android 真机均已按此判据验证通过。

## API

### 参数

| 参数 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `backdrop` | `Backdrop` | — | **必填**。被采样的背景层 |
| `shapes` | `List<RectShape>` | — | **必填**。子形状，左上角为原点的本地 dp 坐标 |
| `modifier` | `Modifier` | `Modifier` | 修饰符 |
| `smoothing` | `Dp` | `16.dp` | 融合半径。越大越早融合；`0.dp` 表示只做普通并集 |
| `blurRadius` | `Dp` | `1.dp` | 模糊强度 |
| `refraction` | `Boolean` | `true` | 是否启用折射 |
| `content` | `@Composable BoxScope.() -> Unit` | `{}` | 内容 |

### RectShape

```kotlin
data class RectShape(
    val x: Float,
    val y: Float,
    val width: Float,
    val height: Float,
    val radius: Float,
)
```

坐标为**组本地 dp**（左上角为原点）。

### 常量

| 名称 | 值 | 说明 |
|---|---|---|
| `MAX_SHAPES` | `8` | 形状数量上限 |

## 已知限制

- **形状上限 8 个** —— AGSL 的循环边界必须是编译期常量，超过会 `require` 报错
- 形状多时每像素要算 N 个 SDF，且梯度是 4 次额外求值（**性能未测**）
- 8 个以上形状未验证
- 依赖运行时着色器：`isRuntimeShaderSupported()` 为 false 时效果被静默跳过
