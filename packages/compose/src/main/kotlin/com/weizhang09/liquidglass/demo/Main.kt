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
import com.kyant.backdrop.drawBackdrop
import com.kyant.backdrop.effects.blur
import com.kyant.backdrop.effects.lens
import com.kyant.backdrop.effects.vibrancy

/**
 * Compose Multiplatform 桌面端玻璃原型。
 *
 * 标准用法（取自 backdrop 官方 catalog）：
 *   val backdrop = rememberLayerBackdrop()
 *   背景层用 Modifier.layerBackdrop(backdrop) 标记
 *   玻璃元素用 Modifier.drawBackdrop(backdrop, shape, effects) 采样该层
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
            // 玻璃面板：折射 + 模糊 + 增艳
            Box(
                Modifier
                    .width(340.dp)
                    .height(150.dp)
                    .drawBackdrop(
                        backdrop = backdrop,
                        shape = { RoundedCornerShape(26.dp) },
                        effects = {
                            vibrancy()
                            blur(8f.dp.toPx())
                            if (!noLens) lens(12f.dp.toPx(), 24f.dp.toPx())
                        },
                    ),
                contentAlignment = Alignment.Center,
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
            Box(
                Modifier
                    .width(200.dp)
                    .height(52.dp)
                    .drawBackdrop(
                        backdrop = backdrop,
                        shape = { CircleShape },
                        effects = {
                            vibrancy()
                            blur(2f.dp.toPx())
                            lens(12f.dp.toPx(), 24f.dp.toPx())
                        },
                    ),
                contentAlignment = Alignment.Center,
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
