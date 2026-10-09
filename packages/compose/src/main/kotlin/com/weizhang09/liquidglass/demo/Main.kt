package com.weizhang09.liquidglass.demo

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Window
import androidx.compose.ui.window.application
import androidx.compose.ui.window.rememberWindowState
import com.kyant.backdrop.backdrops.layerBackdrop
import com.kyant.backdrop.backdrops.rememberLayerBackdrop
import com.weizhang09.liquidglass.GlassLevel
import com.weizhang09.liquidglass.GlassSurface
import com.weizhang09.liquidglass.tokens.GlassColorTokens
import com.weizhang09.liquidglass.tokens.GlassRadiusTokens

/**
 * Compose Multiplatform 桌面端原型 —— tokens 驱动版。
 *
 * 本文件不含任何硬编码的光学参数：圆角、模糊强度、折射高度/强度
 * 全部来自 `packages/tokens/tokens.json` 生成的 Glass*Tokens。
 * 改一处 JSON → 重新生成 → 本界面观感随之变化。
 */
fun main() = application {
    Window(
        onCloseRequest = ::exitApplication,
        title = "LiquidGlassUI Compose Prototype",
        state = rememberWindowState(width = 1000.dp, height = 680.dp),
    ) {
        MaterialTheme {
            DesktopGlassPrototype()
        }
    }
}

@Composable
private fun DesktopGlassPrototype() {
    // 验证用开关：置 1 可关闭折射，用于 A/B 逐像素对比
    val noLens = System.getenv("LG_NO_LENS") == "1"

    Box(Modifier.fillMaxSize()) {
        val backdrop = rememberLayerBackdrop()

        // 背景层：高对比竖条纹。
        // 必须用 layerBackdrop 标记，否则玻璃采样不到内容。
        // 条纹是必要的 —— 平滑渐变上看不出位移，与 web 端同理。
        Box(
            Modifier
                .layerBackdrop(backdrop)
                .fillMaxSize()
                .background(
                    Brush.linearGradient(
                        listOf(Color(0xFFDFE7EE), Color(0xFFF6F8FA), Color(0xFFD5DEE7))
                    )
                )
        ) {
            Stripes()
        }

        Column(
            modifier = Modifier.align(Alignment.Center),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(28.dp),
        ) {
            // 玻璃面板：圆角/模糊/折射全部由 tokens 决定
            GlassSurface(
                backdrop = backdrop,
                modifier = Modifier.width(340.dp).height(150.dp),
                shape = RoundedCornerShape(GlassRadiusTokens.lg),
                level = GlassLevel.Elevated,
                refraction = !noLens,
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        "边缘折射",
                        fontSize = 17.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = Color(0xFF1B2733),
                    )
                    Text(
                        "边缘带内的像素被 Snell 定律推挤，中心保持清晰",
                        fontSize = 12.sp,
                        color = Color(0xFF48586A),
                    )
                }
            }

            // 玻璃胶囊按钮
            GlassSurface(
                backdrop = backdrop,
                modifier = Modifier.width(200.dp).height(52.dp),
                shape = CircleShape,
                level = GlassLevel.Regular,
                refraction = !noLens,
            ) {
                Text("Glass Button", fontSize = 15.sp, color = Color(0xFF1B2733))
            }
        }
    }
}

/** 高对比竖条纹。周期 60px：品红 / 青 / 黄。 */
@Composable
private fun Stripes() {
    Canvas(Modifier.fillMaxSize()) {
        val colors = listOf(
            Color(0xFFFF0055),
            Color(0xFF00E5FF),
            Color(0xFFFFE600),
        )
        val bandWidth = 20f
        var x = 0f
        var i = 0
        while (x < size.width) {
            drawRect(
                color = colors[i % colors.size],
                topLeft = Offset(x, 0f),
                size = Size(bandWidth, size.height),
            )
            x += bandWidth
            i++
        }
    }
}
