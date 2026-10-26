package com.weizhang09.liquidglass

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.kyant.backdrop.Backdrop
import com.kyant.backdrop.drawBackdrop
import com.kyant.backdrop.effects.blur
import com.kyant.backdrop.effects.lens
import com.kyant.backdrop.effects.vibrancy
import com.weizhang09.liquidglass.tokens.GlassBlurTokens
import com.weizhang09.liquidglass.tokens.GlassOpticalTokens
import com.weizhang09.liquidglass.tokens.GlassRadiusTokens
import kotlin.math.min

/**
 * 折射带最多占元素短边的比例。
 *
 * 取值依据：文字行高通常 24dp、垂直居中，元素短边必须留出
 * `短边/2 - 行高/2` 的余量，边缘带才能不压到文字。
 * 8% 在 44dp 按钮上得 3.5dp，安全；18% 会到 8dp，压到文字。
 */
internal const val MAX_BEZEL_RATIO = 0.08f

/** 折射带硬上限（dp）。超过这个值在任何尺寸上都开始明显侵蚀内容。 */
internal const val MAX_BEZEL_HARD_CAP_DP = 10f

/** 折射强度相对折射带高度的倍率。保持 2× 以维持原本的衰减曲线形状。 */
internal const val REFRACTION_AMOUNT_RATIO = 2f

/**
 * 边缘折射带的实际高度（px）。
 *
 * ⚠️⚠️ 这是本组件最容易被忽略的一处：**折射带必须随元素尺寸缩放**。
 *
 * 曾经直接用 token 的固定值（12dp）。在 300×200 的面板上很合适，
 * 但在 44dp 高的按钮上，12dp 的边缘带 = 元素高度的 27% ——
 * 折射带直接盖到居中的文字上，把背景色块折射进文字区域。
 * 真机截图实测：文字所在行的平均亮度比上下低 **22.5**，
 * 用户看到的现象就是「文字周围有一圈灰色底」。
 *
 * 因此按短边 8% 缩放，并加 10dp 硬上限：
 *   44dp 按钮 → 3.5dp
 *   64dp 元素 → 5.1dp
 *   200dp 面板 → 10dp（硬上限）
 *
 * 抽成纯函数是为了可单测 —— 这个值算错不会报错，只会「看起来有点脏」。
 *
 * @param widthPx 元素宽（px，不含采样 padding）
 * @param heightPx 元素高（px，不含采样 padding）
 * @param tokenHeightPx token 里的折射高度（px），作为尺寸允许时的目标值
 * @param hardCapPx 硬上限（px）
 */
internal fun scaledRefractionHeight(
    widthPx: Float,
    heightPx: Float,
    tokenHeightPx: Float,
    hardCapPx: Float,
): Float {
    if (widthPx <= 0f || heightPx <= 0f) return 0f
    val shortSide = min(widthPx, heightPx)
    return min(tokenHeightPx, min(shortSide * MAX_BEZEL_RATIO, hardCapPx))
}

/**
 * 材质层级。对应 web 端 <lg-glass-surface> 的 level 属性。
 *
 * 模糊强度取自 tokens，不在此处硬编码。
 */
enum class GlassLevel {
    /** 无模糊，仅作为材质底板 */
    Plain,

    /** 常规玻璃面（导航、卡片） */
    Regular,

    /** 抬升玻璃面（重要面板） */
    Elevated,

    /** 交互焦点玻璃面（CTA） */
    Focused,
    ;

    internal val blurRadius: Dp
        get() = when (this) {
            Plain -> GlassBlurTokens.none
            Regular -> GlassBlurTokens.subtle
            Elevated -> GlassBlurTokens.regular
            Focused -> GlassBlurTokens.heavy
        }
}

/**
 * 液态玻璃面。
 *
 * 所有光学参数（边缘带宽度、折射率、折射高度/强度、模糊半径、圆角）
 * 均来自 `packages/tokens/tokens.json` 生成的 `Glass*Tokens`，
 * 因此改一处 JSON、重新生成，四端观感同步变化。
 *
 * 用法（与 backdrop 官方一致）：
 * ```
 * val backdrop = rememberLayerBackdrop()
 * Box(Modifier.layerBackdrop(backdrop).fillMaxSize()) { /* 背景内容 */ }
 * GlassSurface(backdrop = backdrop, modifier = Modifier.size(300.dp, 120.dp)) {
 *     Text("内容")
 * }
 * ```
 *
 * @param backdrop 由 `rememberLayerBackdrop()` 创建、并用 `Modifier.layerBackdrop()` 标记过的背景层
 * @param shape 形状，默认取 tokens 的圆角
 * @param level 材质层级，决定模糊强度
 * @param refraction 是否启用边缘折射。关闭后仅保留模糊与增艳，
 *                   用于 A/B 验证或在低端设备上降级
 * @param content 玻璃面内容（不会被折射扭曲）
 */
@Composable
fun GlassSurface(
    backdrop: Backdrop,
    modifier: Modifier = Modifier,
    shape: Shape = RoundedCornerShape(GlassRadiusTokens.lg),
    level: GlassLevel = GlassLevel.Regular,
    refraction: Boolean = true,
    content: @Composable BoxScope.() -> Unit,
) {
    Box(
        modifier = modifier.drawBackdrop(
            backdrop = backdrop,
            shape = { shape },
            effects = {
                vibrancy()
                if (level.blurRadius.value > 0f) {
                    blur(level.blurRadius.toPx())
                }
                if (refraction) {
                    // ⚠️ 折射带必须随元素尺寸缩放，不能直接用 token 的固定值 ——
                    // 固定 12dp 在 44dp 高的按钮上会盖住文字（详见 scaledRefractionHeight 的注释）。
                    // size 是元素自身尺寸（lens() 的 shader 里 halfSize = size * 0.5），
                    // 不含采样 padding，正是这里需要的。
                    val h = scaledRefractionHeight(
                        widthPx = size.width,
                        heightPx = size.height,
                        tokenHeightPx = GlassOpticalTokens.REFRACTION_HEIGHT.dp.toPx(),
                        hardCapPx = MAX_BEZEL_HARD_CAP_DP.dp.toPx(),
                    )
                    if (h > 0f) {
                        lens(
                            refractionHeight = h,
                            refractionAmount = h * REFRACTION_AMOUNT_RATIO,
                        )
                    }
                }
            },
        ),
        contentAlignment = Alignment.Center,
        content = content,
    )
}
