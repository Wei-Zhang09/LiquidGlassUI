package com.weizhang09.liquidglass.android

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kyant.backdrop.backdrops.layerBackdrop
import com.kyant.backdrop.backdrops.rememberLayerBackdrop
import com.weizhang09.liquidglass.GlassLevel
import com.weizhang09.liquidglass.GlassSurface
import com.weizhang09.liquidglass.GlassTooltip
import com.weizhang09.liquidglass.tokens.GlassRadiusTokens

/**
 * Android 示例。
 *
 * 与桌面端共用同一套组件（commonMain），这里只做平台外壳。
 *
 * 注意：桌面专属的 GlassSidebar / GlassMenu 依赖悬停，
 * 移动端不适用；Android 侧演示 GlassSurface / GlassTooltip 等通用组件。
 */
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                AndroidShowcase()
            }
        }
    }
}

@Composable
private fun AndroidShowcase() {
    var tapped by remember { mutableStateOf(false) }

    Box(Modifier.fillMaxSize()) {
        val backdrop = rememberLayerBackdrop()

        // 背景：渐变 + 高对比条纹。
        // 玻璃折射需要纹理才可见，纯渐变看不出效果。
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
            modifier = Modifier.align(Alignment.Center).padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(20.dp),
        ) {
            Text(
                "LiquidGlassUI",
                fontSize = 26.sp,
                fontWeight = FontWeight.SemiBold,
                color = Color(0xFF1B2733),
            )
            Text(
                "Android · 与桌面共用同一套组件",
                fontSize = 13.sp,
                color = Color(0xFF48586A),
            )

            // 玻璃面板
            GlassSurface(
                backdrop = backdrop,
                modifier = Modifier.width(280.dp).height(120.dp),
                shape = RoundedCornerShape(GlassRadiusTokens.lg),
                level = GlassLevel.Elevated,
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        "边缘折射",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = Color(0xFF1B2733),
                    )
                    Text(
                        "AGSL 运行时着色器（API 33+）",
                        fontSize = 11.sp,
                        color = Color(0xFF48586A),
                    )
                }
            }

            // 玻璃胶囊按钮
            GlassSurface(
                backdrop = backdrop,
                modifier = Modifier.width(180.dp).height(48.dp),
                shape = CircleShape,
                level = GlassLevel.Focused,
            ) {
                Text(
                    if (tapped) "已点击" else "点击我",
                    fontSize = 14.sp,
                    color = Color(0xFF1B2733),
                )
            }
        }
    }
}

/** 高对比竖条纹。 */
@Composable
private fun Stripes() {
    Canvas(Modifier.fillMaxSize()) {
        val colors = listOf(Color(0xFFFF0055), Color(0xFF00E5FF), Color(0xFFFFE600))
        val band = 24f
        var x = 0f
        var i = 0
        while (x < size.width) {
            drawRect(
                color = colors[i % colors.size],
                topLeft = Offset(x, 0f),
                size = Size(band, size.height),
            )
            x += band
            i++
        }
    }
}
