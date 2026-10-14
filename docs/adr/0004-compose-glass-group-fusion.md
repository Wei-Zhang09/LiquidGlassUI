# ADR-0004：Compose 端 GlassGroup 的融合实现

- 状态：已接受
- 日期：2026-10-14
- 相关：ADR-0001（组件矩阵）、ADR-0003（平台分化实证）

## 背景

Web 端已有 `GlassGroup`（SDF 平滑并集，见 `packages/web/src/sdf.ts`），
组件矩阵里 Compose 列一直是空的。要把「多个玻璃元素融成一团」补到 Compose 端。

## 走过的弯路（实测撞墙）

### 方案 A：把融合轮廓算成 `Shape` 交给 `lens()`

思路：用 marching squares 提取融合轮廓的零等值线，做成 `Outline.Generic`
路径，交给 backdrop 库自带的 `lens()` 做折射。

**结果：运行时抛异常，方案不可行。**

```
java.lang.UnsupportedOperationException:
  Only RoundedRectangularShape or CornerBasedShape is supported in lens effects.
    at com.kyant.backdrop.effects.LensKt.throwUnsupportedSDFException(Lens.kt:117)
    at com.weizhang09.liquidglass.GlassGroupKt.GlassGroup(GlassGroup.kt:100)
```

反编译 `LensKt` 确认：`lens()` 内部把 `shape` 强转成
`com.kyant.shapes.RoundedRectangularShape`，并从中取四个角的半径
（`cornerRadii`）喂给它自带的着色器。任何非圆角矩形形状都会被拒。

代价：这个方案已写好的 `fusedContour` / marching squares 代码（约 200 行）
不能用于渲染。**保留在 `Sdf.kt` 里** —— 它的数学测试（24 个）仍是
距离场与融合语义的可验证依据，只是不再作为渲染路径。

### 方案 B：自定义运行时着色器（采用）

反编译发现 `effects/RenderEffectKt` 提供：

```kotlin
fun BackdropEffectScope.runtimeShaderEffect(
    key: String,
    shaderString: String,
    uniformShaderName: String,
    block: RuntimeShader.() -> Unit,
)
```

且 `isRuntimeShaderSupported()` 在桌面端**无条件返回 true**（有 `SkikoRuntimeShader` 实现）。

因此：**写自己的 AGSL 着色器**，把多个矩形的平滑并集直接放进 GPU。
这与 Web 端是同一套算法（同样的 `sminPoly`、同样的中心差分梯度、
同样的 `circleMap` 折射衰减），只是执行位置从 Canvas 2D 变成 GPU。

## 关键实现细节

### 坐标约定
着色器里 `local = coord + offset`，`offset` 取 `BackdropEffectScope.padding`。
这与 `lens()` 的 `centeredCoord = coord + offset - halfSize` 等价
（它的 offset 也是 padding，halfSize 只是转成中心坐标系）。

`padding` 必须设为 ≥ `refractionHeight`，否则折射需要采样的边缘外侧内容会被裁掉 ——
`lens()` 内部也是这么做的。

### 为什么用 `RectangleShape` 而不是融合轮廓
`drawBackdrop` 的 `shape` 参数在这里只用于**承载**；
真实的非矩形外形由着色器里的 SDF 掩码裁出：
```glsl
float alpha = 1.0 - smoothstep(-1.0, 0.0, sd);
```
既然 `lens()` 的圆角矩形裁剪用不上，就没必要再算一遍轮廓。

### 形状上限 8 个
AGSL 的循环边界必须是编译期常量，因此 uniform 数组长度固定为 `MAX_SHAPES * 4`，
超出部分留零、由 `count` 短路。超过 8 个形状时 `require` 直接报错，
而不是静默出错。

## 验证

| 层次 | 手段 | 结果 |
|---|---|---|
| 数学 | `SdfTest` 24 个用例 | 通过（含"轮廓伸入缝隙"这一真融合判据） |
| 着色器 | `FusedShaderTest` 4 个用例 | 通过（用 `RuntimeEffect.makeForShader` 真实编译） |
| 渲染 | 截图 + 视觉复核 | 通过（见下） |

**着色器编译测试是必需的**：Skia 编译失败时返回 null，组件退化成普通矩形
**且不抛任何异常**。没有这个测试，只能从截图看出"效果不对"，看不出原因。

**渲染证据**（`docs/screenshots/compose-desktop-showcase.png`）：
同一组两个圆，`smoothing=22` 呈现为中间桥接的花生形，
`smoothing=0` 呈现为两个独立的圆 —— 对照组证明融合确实由 `smoothing` 驱动。

## 踩到的另一个坑：样例选得差会误判为 bug

第一次截图看到的是"一个普通圆角矩形"，我一度以为着色器没生效。
实际原因是我把三个 `radius=24`、间距仅 4dp 的圆放进 152×56 的盒子 ——
重叠太多，融合后**本来就长得像圆角矩形**。

改用两个拉开 18dp 缝隙的圆 + `smoothing=0` 对照组后，融合效果一目了然。
**教训**：验证渲染效果时，样例必须能让"有效果"和"没效果"产生可见差异，
否则测不出问题，也测不出没问题。

## 后果

- Compose 端组件矩阵补上 `GlassGroup`
- `Sdf.kt` 的轮廓提取不再用于渲染，但保留（数学测试有价值，且未来若库支持
  自定义 Shape 可复用）
- 自定义 AGSL 意味着**着色器代码是手写的**，与库自带 `lens()` 的视觉一致性
  需要人工比对（折射高度/强度都取自同一组 tokens）

## 未验证

- Android 真机（AGSL 在 Android 上是 API 33+；本组件走的是 Skia 运行时着色器，
  Android 侧路径与桌面不同，未测）
- 8 个以上形状的融合
- 形状数量多时的性能（每像素要算 N 个 SDF，且梯度是 4 次额外求值）
