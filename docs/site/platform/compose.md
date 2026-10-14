# Compose（Windows 桌面 / Android）

基于 [Compose Multiplatform](https://www.jetbrains.com/lp/compose-multiplatform/)
与 [`io.github.kyant0:backdrop`](https://github.com/Kyant0/AndroidLiquidGlass)。

## 组件

7 个，全部在 `commonMain`（桌面与 Android 共用）：

| 组件 | 形态 | 平台侧重 |
|---|---|---|
| `GlassSurface` | 材质底板 | 通用 |
| `GlassSidebar` | 左侧导航 | 桌面（悬停） |
| `GlassMenu` | 下拉菜单 | 桌面（点击外部关闭） |
| `GlassTooltip` | 提示框 | 双端（悬停 / 长按） |
| `GlassBottomBar` | 底部标签栏 | 移动（按压反馈） |
| `GlassDialog` | 底部抽屉 | 移动（拇指可达） |
| `GlassGroup` | 玻璃融合 | 通用 |

## 用法

```kotlin
val backdrop = rememberLayerBackdrop()

Box(Modifier.layerBackdrop(backdrop)) {
    // 背景内容（必须有纹理，否则玻璃看不出效果）
}

GlassSurface(
    backdrop = backdrop,
    level = GlassLevel.Elevated,
    shape = RoundedCornerShape(26.dp),
) {
    Text("内容")
}
```

### 玻璃融合

```kotlin
GlassGroup(
    backdrop = backdrop,
    shapes = listOf(
        RectShape(0f, 0f, 56f, 56f, 28f),
        RectShape(74f, 0f, 56f, 56f, 28f),   // 与上一个拉开缝隙
    ),
    smoothing = 22.dp,
    modifier = Modifier.size(130.dp, 56.dp),
)
```

`smoothing` 是融合半径：两个形状的距离场在半径内被平滑并集缝合。

## 为什么玻璃融合要自己写着色器

库自带的 `lens()` **只支持圆角矩形**，传自定义 `Shape` 会在运行时抛：

```
java.lang.UnsupportedOperationException:
  Only RoundedRectangularShape or CornerBasedShape is supported in lens effects.
    at com.kyant.backdrop.effects.LensKt.throwUnsupportedSDFException(Lens.kt:117)
```

因此 `GlassGroup` 用 `runtimeShaderEffect` 提供**自定义 AGSL 着色器**，
在 GPU 上对多个矩形做平滑并集后求梯度。

详见 [ADR-0004](https://github.com/Wei-Zhang09/LiquidGlassUI/blob/main/docs/adr/0004-compose-glass-group-fusion.md)。

::: warning 着色器编译失败是静默的
Skia 编译失败时返回 null，组件**退化成普通矩形且不抛任何异常**。
所以本库有一个用 `RuntimeEffect.makeForShader` 真实编译着色器的测试 ——
没有它，只能从截图看出"效果不对"，看不出原因。
:::

## 环境要求

| 项 | 要求 |
|---|---|
| JDK | 21+ |
| Gradle | 9.8+ |
| AGP（Android） | 9.4+ |
| compileSdk（Android） | 37 |
| Android 运行时 | API 33+（AGSL） |

## 已知限制

- `GlassGroup` 形状上限 **8 个**（AGSL 循环边界须为编译期常量）
- 形状多时每像素要算 N 个 SDF，且梯度是 4 次额外求值
- 8 个以上形状未验证
