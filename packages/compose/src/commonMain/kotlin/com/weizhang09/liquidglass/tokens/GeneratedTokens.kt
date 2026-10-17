// 本文件由 tools/gen-tokens.py 从 packages/tokens/tokens.json 生成，请勿手工编辑。

package com.weizhang09.liquidglass.tokens

import androidx.compose.runtime.Immutable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

@Immutable
data class GlassColors(
    val tint: Color,
    val tintStrong: Color,
    val highlight: Color,
    val shadow: Color,
    val innerShadow: Color,
    val surface: Color,
    val overlay: Color,
    val surfaceModal: Color,
)

object GlassColorTokens {
    val Light = GlassColors(
        tint = Color(1.0000f, 1.0000f, 1.0000f, 0.1500f),
        tintStrong = Color(1.0000f, 1.0000f, 1.0000f, 0.2800f),
        highlight = Color(1.0000f, 1.0000f, 1.0000f, 0.7000f),
        shadow = Color(0.1300f, 0.1900f, 0.2400f, 0.1800f),
        innerShadow = Color(0.4000f, 0.5000f, 0.5900f, 0.1000f),
        surface = Color(1.0000f, 1.0000f, 1.0000f, 0.1200f),
        overlay = Color(0.0700f, 0.1000f, 0.1400f, 0.5500f),
        surfaceModal = Color(1.0000f, 1.0000f, 1.0000f, 0.8200f),
    )

    val Dark = GlassColors(
        tint = Color(1.0000f, 1.0000f, 1.0000f, 0.1000f),
        tintStrong = Color(1.0000f, 1.0000f, 1.0000f, 0.2000f),
        highlight = Color(1.0000f, 1.0000f, 1.0000f, 0.3800f),
        shadow = Color(0.0000f, 0.0000f, 0.0000f, 0.4500f),
        innerShadow = Color(0.0000f, 0.0000f, 0.0000f, 0.2200f),
        surface = Color(1.0000f, 1.0000f, 1.0000f, 0.0600f),
        overlay = Color(0.0000f, 0.0000f, 0.0000f, 0.6800f),
        surfaceModal = Color(0.1200f, 0.1500f, 0.2000f, 0.8600f),
    )
}

object GlassRadiusTokens {
    val sm = 10.dp
    val md = 18.dp
    val lg = 26.dp
    val xl = 32.dp
    val full = 999.dp
}

object GlassBlurTokens {
    val none = 0.dp
    val subtle = 2.dp
    val regular = 4.dp
    val heavy = 12.dp
}

object GlassOpticalTokens {
    const val BEZEL_WIDTH = 22f
    const val DISPLACEMENT_SCALE = 70f
    const val IOR = 1.6f
    const val DISPERSION = 2.0f
    const val SATURATION = 180f
    const val ELASTICITY = 0.15f
    const val CORNER_SMOOTHING = 0.6f
    const val REFRACTION_HEIGHT = 12f
    const val REFRACTION_AMOUNT = 24f
}

object GlassLightingTokens {
    const val ANGLE = 45f
    const val HIGHLIGHT_WIDTH = 0.5f
    const val HIGHLIGHT_ALPHA = 1.0f
    const val SPECULAR_SHARPNESS = 3.0f
    const val SPECULAR_OPACITY = 0.85f
}

object GlassMotionTokens {
    const val FAST = 150
    const val REGULAR = 250
    const val SLOW = 400
    const val EASING = "cubic-bezier(0.25, 0.1, 0.25, 1)"
}
