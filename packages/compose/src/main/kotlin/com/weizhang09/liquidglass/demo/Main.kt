package com.weizhang09.liquidglass.demo

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
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
import com.weizhang09.liquidglass.GlassSidebar
import com.weizhang09.liquidglass.GlassSidebarItem
import com.weizhang09.liquidglass.GlassSurface
import com.weizhang09.liquidglass.GlassTooltip
import com.weizhang09.liquidglass.tokens.GlassRadiusTokens

/**
 * 桌面端 GlassSidebar 原型。
 *
 * 所有光学参数来自 packages/tokens —— 本文件无硬编码折射/圆角/模糊值。
 */
fun main() = application {
    Window(
        onCloseRequest = ::exitApplication,
        title = "LiquidGlassUI Compose Prototype",
        state = rememberWindowState(width = 1100.dp, height = 720.dp),
    ) {
        MaterialTheme {
            DesktopSidebarDemo()
        }
    }
}

private val NAV_ITEMS = listOf(
    GlassSidebarItem("home", "概览"),
    GlassSidebarItem("components", "组件", badge = "10"),
    GlassSidebarItem("tokens", "设计参数"),
    GlassSidebarItem("platforms", "平台适配"),
    GlassSidebarItem("verify", "验证报告"),
    GlassSidebarItem("settings", "设置"),
)

@Composable
private fun DesktopSidebarDemo() {
    val noLens = System.getenv("LG_NO_LENS") == "1"
    var selected by remember { mutableStateOf("components") }

    Box(Modifier.fillMaxSize()) {
        val backdrop = rememberLayerBackdrop()

        // 背景层：高对比竖条纹。必须用 layerBackdrop 标记，
        // 否则玻璃采样不到内容；条纹也是让折射可见的必要条件。
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

        Row(
            modifier = Modifier.fillMaxSize().padding(24.dp),
            horizontalArrangement = Arrangement.spacedBy(24.dp),
        ) {
            GlassSidebar(
                backdrop = backdrop,
                items = NAV_ITEMS,
                selectedId = selected,
                onSelect = { selected = it },
                header = {
                    Column {
                        Text(
                            "LiquidGlassUI",
                            fontSize = 15.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = Color(0xFF1B2733),
                        )
                        Text(
                            "Compose 桌面端",
                            fontSize = 11.sp,
                            color = Color(0xFF48586A),
                        )
                    }
                },
            )

            // 右侧内容区：用玻璃面板承载，演示多块玻璃共存
            GlassSurface(
                backdrop = backdrop,
                modifier = Modifier.weight(1f).fillMaxSize(),
                shape = RoundedCornerShape(GlassRadiusTokens.xl),
                level = GlassLevel.Elevated,
                refraction = !noLens,
            ) {
                Column(
                    modifier = Modifier.padding(28.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    Text(
                        NAV_ITEMS.firstOrNull { it.id == selected }?.label ?: "—",
                        fontSize = 22.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = Color(0xFF1B2733),
                    )
                    Text(
                        "左侧栏是桌面端主导航形态；移动端对应 GlassBottomBar。\n" +
                            "悬停与选中态的底色取自 tokens 的高光色。",
                        fontSize = 13.sp,
                        color = Color(0xFF48586A),
                    )

                    // 桌面专属交互：指针悬停显示玻璃提示（触屏无 hover 概念）
                    GlassTooltip(
                        text = "GlassTooltip —— 桌面专属，触屏没有悬停",
                        backdrop = backdrop,
                        modifier = Modifier.padding(top = 18.dp),
                    ) {
                        GlassSurface(
                            backdrop = backdrop,
                            modifier = Modifier.width(200.dp).height(44.dp),
                            shape = CircleShape,
                            level = GlassLevel.Focused,
                            refraction = !noLens,
                        ) {
                            Text("悬停我", fontSize = 14.sp, color = Color(0xFF1B2733))
                        }
                    }
                }
            }
        }
    }
}

/** 高对比竖条纹。周期 60px：品红 / 青 / 黄。 */
@Composable
private fun Stripes() {
    Canvas(Modifier.fillMaxSize()) {
        val colors = listOf(Color(0xFFFF0055), Color(0xFF00E5FF), Color(0xFFFFE600))
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
