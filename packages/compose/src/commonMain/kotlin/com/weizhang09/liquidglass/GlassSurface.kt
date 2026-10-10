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
                    // 边缘带宽度与折射强度都取自 tokens（Float.dp 由 Compose 提供）
                    lens(
                        refractionHeight = GlassOpticalTokens.REFRACTION_HEIGHT.dp.toPx(),
                        refractionAmount = GlassOpticalTokens.REFRACTION_AMOUNT.dp.toPx(),
                    )
                }
            },
        ),
        contentAlignment = Alignment.Center,
        content = content,
    )
}
