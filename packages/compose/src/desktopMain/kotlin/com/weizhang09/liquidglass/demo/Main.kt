package com.weizhang09.liquidglass.demo

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
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
import androidx.compose.ui.graphics.painter.BitmapPainter
import androidx.compose.ui.graphics.painter.Painter
import androidx.compose.ui.graphics.toComposeImageBitmap
import androidx.compose.ui.layout.ContentScale
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
import com.weizhang09.liquidglass.GlassGroup
import com.weizhang09.liquidglass.GlassMenu
import com.weizhang09.liquidglass.GlassMenuItem
import com.weizhang09.liquidglass.GlassSidebar
import com.weizhang09.liquidglass.GlassSidebarItem
import com.weizhang09.liquidglass.GlassSurface
import com.weizhang09.liquidglass.GlassTooltip
import com.weizhang09.liquidglass.RectShape
import com.weizhang09.liquidglass.tokens.GlassRadiusTokens
import java.awt.image.BufferedImage
import javax.imageio.ImageIO

/**
 * Compose Multiplatform 桌面端示例。
 *
 * 背景使用真实照片（`resources/backgrounds/wallpaper.jpg`）而非纯色 ——
 * 玻璃的折射需要背景有足够的边缘与纹理才可见。
 *
 * 所有光学参数来自 packages/tokens，本文件无硬编码折射/圆角/模糊值。
 */
fun main() = application {
    Window(
        onCloseRequest = ::exitApplication,
        title = "LiquidGlassUI Compose Prototype",
        state = rememberWindowState(width = 1200.dp, height = 780.dp),
    ) {
        MaterialTheme {
            DesktopShowcase()
        }
    }
}

private val NAV_ITEMS = listOf(
    GlassSidebarItem("home", "概览"),
    GlassSidebarItem("components", "组件", badge = "11"),
    GlassSidebarItem("tokens", "设计参数"),
    GlassSidebarItem("platforms", "平台适配"),
    GlassSidebarItem("verify", "验证报告"),
    GlassSidebarItem("settings", "设置"),
)

@Composable
private fun DesktopShowcase() {
    val noLens = System.getenv("LG_NO_LENS") == "1"
    var selected by remember { mutableStateOf("components") }

    Box(Modifier.fillMaxSize()) {
        val backdrop = rememberLayerBackdrop()

        // 背景层：真实照片。必须用 layerBackdrop 标记，否则玻璃采样不到内容。
        // 用 ImageIO 从 classpath 读，避免引入 Compose Resources 插件与代码生成。
        Image(
            painter = rememberWallpaper(),
            contentDescription = null,
            modifier = Modifier.fillMaxSize().layerBackdrop(backdrop),
            contentScale = ContentScale.Crop,
        )

        Row(
            modifier = Modifier.fillMaxSize().padding(28.dp),
            horizontalArrangement = Arrangement.spacedBy(28.dp),
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
                        Text("Compose 桌面端", fontSize = 11.sp, color = Color(0xFF48586A))
                    }
                },
            )

            GlassSurface(
                backdrop = backdrop,
                modifier = Modifier.weight(1f).fillMaxSize(),
                shape = RoundedCornerShape(GlassRadiusTokens.xl),
                level = GlassLevel.Elevated,
                refraction = !noLens,
            ) {
                Column(
                    modifier = Modifier.padding(32.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    Text(
                        NAV_ITEMS.firstOrNull { it.id == selected }?.label ?: "—",
                        fontSize = 24.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = Color(0xFF1B2733),
                    )
                    Text(
                        "桌面端组件：GlassSurface / GlassSidebar / GlassTooltip / " +
                            "GlassMenu / GlassGroup\n" +
                            "背景为真实照片 —— 折射需要纹理才可见。",
                        fontSize = 13.sp,
                        color = Color(0xFF48586A),
                    )

                    // GlassGroup：三个圆融合成一团（SDF 平滑并集）。
                    // 若只是叠放，三个圆会有清晰分界；真融合的接缝是连续的。
                    Text(
                        "GlassGroup — SDF 融合（三个圆融成一团）",
                        fontSize = 12.sp,
                        color = Color(0xFF48586A),
                        modifier = Modifier.padding(top = 18.dp),
                    )
                    // 两个形状拉开一段距离（18dp 缝隙）：只有融合才会把中间
                    // 填成"花生"形；不融合时是两个独立的圆，中间透明。
                    Row(horizontalArrangement = Arrangement.spacedBy(24.dp)) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            GlassGroup(
                                backdrop = backdrop,
                                shapes = listOf(
                                    RectShape(0f, 0f, 56f, 56f, 28f),
                                    RectShape(74f, 0f, 56f, 56f, 28f),
                                ),
                                smoothing = 22.dp,
                                modifier = Modifier.padding(top = 6.dp).size(130.dp, 56.dp),
                            ) {
                                Text(
                                    "融合",
                                    fontSize = 12.sp,
                                    color = Color(0xFF1B2733),
                                    modifier = Modifier.align(Alignment.Center),
                                )
                            }
                            Text("smoothing=22", fontSize = 10.sp, color = Color(0xFF48586A))
                        }
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            // 对照组：smoothing=0 → 只做普通并集，中间应断开
                            GlassGroup(
                                backdrop = backdrop,
                                shapes = listOf(
                                    RectShape(0f, 0f, 56f, 56f, 28f),
                                    RectShape(74f, 0f, 56f, 56f, 28f),
                                ),
                                smoothing = 0.dp,
                                modifier = Modifier.padding(top = 6.dp).size(130.dp, 56.dp),
                            ) {}
                            Text("smoothing=0", fontSize = 10.sp, color = Color(0xFF48586A))
                        }
                    }

                    Row(
                        modifier = Modifier.padding(top = 20.dp),
                        horizontalArrangement = Arrangement.spacedBy(20.dp),
                    ) {
                        // 提示框：桌面悬停显示，触屏长按显示
                        GlassTooltip(
                            text = "悬停或长按显示（触屏用长按）",
                            backdrop = backdrop,
                        ) {
                            GlassSurface(
                                backdrop = backdrop,
                                modifier = Modifier.width(180.dp).height(44.dp),
                                shape = CircleShape,
                                level = GlassLevel.Focused,
                                refraction = !noLens,
                            ) {
                                Text("悬停我", fontSize = 14.sp, color = Color(0xFF1B2733))
                            }
                        }

                        // 下拉菜单（桌面高频）
                        GlassMenu(
                            backdrop = backdrop,
                            items = listOf(
                                GlassMenuItem("new", "新建", shortcut = "Ctrl+N"),
                                GlassMenuItem("open", "打开", shortcut = "Ctrl+O"),
                                GlassMenuItem("d1", "", isDivider = true),
                                GlassMenuItem("dup", "创建副本", shortcut = "Ctrl+D"),
                                GlassMenuItem("del", "删除", danger = true, shortcut = "Del"),
                            ),
                        ) { _, setOpen ->
                            GlassSurface(
                                backdrop = backdrop,
                                modifier = Modifier.width(180.dp).height(44.dp),
                                shape = CircleShape,
                                level = GlassLevel.Focused,
                                refraction = !noLens,
                            ) {
                                Text("点击菜单", fontSize = 14.sp, color = Color(0xFF1B2733))
                            }
                        }
                    }
                }
            }
        }
    }
}

/**
 * 从 classpath 加载示例壁纸。
 *
 * 用 `ImageIO` + `toComposeImageBitmap()` 而非 Compose Resources：
 * 后者需要额外的 Gradle 插件与资源代码生成，对"示例背景图"这种简单需求过重。
 * 资源位于 `src/main/resources/backgrounds/wallpaper.jpg`。
 */
@Composable
private fun rememberWallpaper(): Painter = remember {
    val stream = Thread.currentThread().contextClassLoader
        ?.getResourceAsStream("backgrounds/wallpaper.jpg")
        ?: error("找不到示例背景图 backgrounds/wallpaper.jpg")
    val image = ImageIO.read(stream) ?: error("示例背景图解码失败")
    BitmapPainter(image.toComposeImageBitmap())
}
