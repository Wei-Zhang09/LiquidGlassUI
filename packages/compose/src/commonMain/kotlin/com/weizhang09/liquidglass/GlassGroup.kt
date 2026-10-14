package com.weizhang09.liquidglass

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.RectangleShape
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.kyant.backdrop.Backdrop
import com.kyant.backdrop.RuntimeShader
import com.kyant.backdrop.drawBackdrop
import com.kyant.backdrop.effects.blur
import com.kyant.backdrop.effects.runtimeShaderEffect
import com.kyant.backdrop.effects.vibrancy
import com.weizhang09.liquidglass.tokens.GlassOpticalTokens

/** 形状数量上限 —— AGSL 的循环边界必须是编译期常量。 */
const val MAX_SHAPES = 8

/**
 * 液态玻璃组合容器 —— 多个玻璃元素**融成一团**。
 *
 * ## 与「叠放」的区别
 * 普通 glassmorphism 里相邻玻璃各自渲染、边缘互相叠加，看起来是两块玻璃贴在一起。
 * 液态玻璃要求像真实液体一样融合：**接缝处轮廓连续**，折射沿整体外形发生。
 *
 * ## 为什么不能用库自带的 `lens()`
 * `lens()` 只支持圆角矩形，传自定义 `Shape` 会在运行时抛：
 * ```
 * java.lang.UnsupportedOperationException:
 *   Only RoundedRectangularShape or CornerBasedShape is supported in lens effects.
 *     at com.kyant.backdrop.effects.LensKt.throwUnsupportedSDFException(Lens.kt:117)
 * ```
 * （实测撞到过这道墙 —— 先把融合轮廓算成 `Outline.Generic` 再交给 `lens()`
 * 的路走不通。）
 *
 * ## 实际做法
 * 用 `runtimeShaderEffect` 提供**自定义 AGSL 着色器**：在 GPU 上对多个矩形做
 * 平滑并集（smooth min），再对融合距离场求梯度得到折射方向。
 * 这与 Web 端 `packages/web/src/sdf.ts` 是同一套算法的两个实现。
 *
 * 着色器结构与 `lens()` 自带的那个一致（同样的坐标约定与折射衰减曲线），
 * **只把单个圆角矩形的 SDF 换成多个矩形的融合 SDF**。
 *
 * ## 已知限制
 * - **形状上限 [MAX_SHAPES] 个**（AGSL 循环边界须为编译期常量）
 * - 依赖运行时着色器：`isRuntimeShaderSupported()` 为 false 时效果被静默跳过
 *   （库内部直接 return，不抛错）
 * - 形状用 [Dp] 显式给出而非自动测量子元素，原因：避免测量竞态
 *   （首帧尺寸为 0）、让调用方明确控制融合拓扑、以及可测试
 *
 * 用法：
 * ```
 * GlassGroup(
 *     backdrop = backdrop,
 *     shapes = listOf(
 *         RectShape(0f, 0f, 48f, 48f, 24f),
 *         RectShape(32f, 0f, 48f, 48f, 24f),   // 与上一个重叠 → 融合
 *     ),
 *     smoothing = 18.dp,
 *     modifier = Modifier.size(120.dp, 48.dp),
 * ) { Text("融合") }
 * ```
 *
 * @param shapes 子形状，**左上角为原点的本地 dp 坐标**，最多 [MAX_SHAPES] 个
 * @param smoothing 融合半径。越大越早融合；0 表示只做普通并集（不融合）
 */
@Composable
fun GlassGroup(
    backdrop: Backdrop,
    shapes: List<RectShape>,
    modifier: Modifier = Modifier,
    smoothing: Dp = 16.dp,
    blurRadius: Dp = 1.dp,
    refraction: Boolean = true,
    content: @Composable BoxScope.() -> Unit = {},
) {
    require(shapes.size <= MAX_SHAPES) {
        "GlassGroup 最多支持 $MAX_SHAPES 个形状（AGSL 循环边界须为编译期常量），实际 ${shapes.size}"
    }

    val density = LocalDensity.current
    val smoothingPx = with(density) { smoothing.toPx() }
    val refractionHeightPx = with(density) { GlassOpticalTokens.REFRACTION_HEIGHT.dp.toPx() }
    val refractionAmountPx = with(density) { GlassOpticalTokens.REFRACTION_AMOUNT.dp.toPx() }

    // 形状先在 Kotlin 侧打包成 uniform 数组，避免每帧在着色器里做坐标换算
    val packed = remember(shapes, density) { packShapes(shapes, density) }

    Box(
        modifier = modifier.drawBackdrop(
            backdrop = backdrop,
            // 整块矩形只用于承载；真实的融合外形由着色器里的 SDF 掩码裁出
            // （lens() 的圆角矩形裁剪在这里用不上 —— 我们要的就是非矩形轮廓）
            shape = { RectangleShape },
            effects = {
                vibrancy()
                if (blurRadius.value > 0f) {
                    blur(blurRadius.toPx())
                }
                if (refraction) {
                    // 折射需要采样边缘外侧的内容，padding 不足时边缘会被裁掉
                    if (padding < refractionHeightPx) padding = refractionHeightPx

                    runtimeShaderEffect(
                        key = "FusedRefraction",
                        shaderString = FUSED_LENS_SHADER,
                        uniformShaderName = "content",
                    ) {
                        setFloatUniform("size", size.width, size.height)
                        // offset 把「含 padding 的坐标」平移回「元素本地坐标」。
                        // 与 lens() 的做法一致（它用的也是 padding）。
                        setFloatUniform("offset", padding, padding)
                        setFloatUniform("rects", packed.rects)
                        setFloatUniform("radii", packed.radii)
                        setIntUniform("count", packed.count)
                        setFloatUniform("smoothing", smoothingPx)
                        setFloatUniform("refractionHeight", refractionHeightPx)
                        setFloatUniform("refractionAmount", refractionAmountPx)
                    }
                }
            },
        ),
        content = content,
    )
}

private class PackedShapes(val rects: FloatArray, val radii: FloatArray, val count: Int)

/**
 * 把形状打包成着色器 uniform。
 *
 * 不足上限的部分留零（着色器里由 `count` 短路，不会用到），
 * 但数组长度必须是编译期常量，否则 uniform 尺寸与着色器声明对不上。
 */
private fun packShapes(shapes: List<RectShape>, density: Density): PackedShapes {
    val rects = FloatArray(MAX_SHAPES * 4)
    val radii = FloatArray(MAX_SHAPES)
    shapes.take(MAX_SHAPES).forEachIndexed { i, s ->
        with(density) {
            rects[i * 4 + 0] = s.x.dp.toPx()
            rects[i * 4 + 1] = s.y.dp.toPx()
            rects[i * 4 + 2] = s.width.dp.toPx()
            rects[i * 4 + 3] = s.height.dp.toPx()
            radii[i] = s.radius.dp.toPx()
        }
    }
    return PackedShapes(rects, radii, shapes.size.coerceAtMost(MAX_SHAPES))
}

/**
 * 融合折射着色器（AGSL / SkSL）。
 *
 * 坐标约定：`local = coord + offset`，即元素左上角为原点的本地像素坐标。
 * 这与 `lens()` 里 `centeredCoord = coord + offset - halfSize` 的换算是等价的
 * （它的 offset 就是 padding，halfSize 只是转成中心坐标系）。
 *
 * 折射衰减沿用 `lens()` 的 `circleMap(1 - t)`：边缘处最强，向内线性归零。
 */
internal val FUSED_LENS_SHADER = """
uniform shader content;

uniform float2 size;
uniform float2 offset;
uniform float rects[${MAX_SHAPES * 4}];
uniform float radii[$MAX_SHAPES];
uniform int count;
uniform float smoothing;
uniform float refractionHeight;
uniform float refractionAmount;

// 圆角矩形的有符号距离（与 Kotlin 侧 sdRoundedRect 同一公式）
float sdRoundRect(float2 p, float2 center, float2 halfSize, float r) {
    float rr = min(r, min(halfSize.x, halfSize.y));
    float2 q = abs(p - center) - (halfSize - float2(rr));
    float outside = length(max(q, float2(0.0))) - rr;
    float inside = min(max(q.x, q.y), 0.0);
    return outside + inside;
}

// 多项式平滑最小值（与 Kotlin 侧 sminPoly 同一公式）
float smin(float a, float b, float k) {
    if (k <= 0.0) return min(a, b);
    float h = max(k - abs(a - b), 0.0) / k;
    return min(a, b) - h * h * k * 0.25;
}

// 全部形状的融合距离场
float fusedSD(float2 p) {
    float d = 1e9;
    for (int i = 0; i < $MAX_SHAPES; i++) {
        if (i >= count) break;
        float2 center = float2(
            rects[i * 4 + 0] + rects[i * 4 + 2] * 0.5,
            rects[i * 4 + 1] + rects[i * 4 + 3] * 0.5
        );
        float2 halfSize = float2(rects[i * 4 + 2], rects[i * 4 + 3]) * 0.5;
        d = smin(d, sdRoundRect(p, center, halfSize, radii[i]), smoothing);
    }
    return d;
}

// 中心差分求梯度（与 Kotlin 侧 fusedGradient 一致）
float2 fusedGrad(float2 p) {
    float e = 0.5;
    float dx = fusedSD(p + float2(e, 0.0)) - fusedSD(p - float2(e, 0.0));
    float dy = fusedSD(p + float2(0.0, e)) - fusedSD(p - float2(0.0, e));
    return float2(dx, dy);
}

// 折射衰减：边缘处最大，向内 refractionHeight 处归零
float circleMap(float x) {
    return 1.0 - sqrt(1.0 - x * x);
}

half4 main(float2 coord) {
    float2 local = coord + offset;
    float sd = fusedSD(local);

    // 融合外形之外 → 透明。这就是非矩形轮廓的由来。
    float alpha = 1.0 - smoothstep(-1.0, 0.0, sd);
    if (alpha <= 0.0) return half4(0.0, 0.0, 0.0, 0.0);

    float2 sampleCoord = coord;

    // 只在边缘带内折射
    float inward = -sd;
    if (inward < refractionHeight) {
        float t = inward / refractionHeight;          // 0 = 边缘, 1 = 带内边界
        float d = circleMap(1.0 - t) * refractionAmount;
        float2 g = fusedGrad(local);
        float len = length(g);
        if (len > 1e-5) {
            sampleCoord = coord + d * (g / len);
        }
    }

    half4 col = content.eval(sampleCoord);
    return half4(col.rgb, col.a * alpha);
}
"""
