package com.weizhang09.liquidglass.android

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
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
import com.weizhang09.liquidglass.GlassBottomBar
import com.weizhang09.liquidglass.GlassDialog
import com.weizhang09.liquidglass.GlassDialogAction
import com.weizhang09.liquidglass.GlassGroup
import com.weizhang09.liquidglass.GlassLevel
import com.weizhang09.liquidglass.GlassMenu
import com.weizhang09.liquidglass.GlassMenuItem
import com.weizhang09.liquidglass.GlassSidebar
import com.weizhang09.liquidglass.GlassSidebarItem
import com.weizhang09.liquidglass.GlassSurface
import com.weizhang09.liquidglass.GlassTabItem
import com.weizhang09.liquidglass.GlassTooltip
import com.weizhang09.liquidglass.RectShape
import com.weizhang09.liquidglass.tokens.GlassRadiusTokens

/**
 * Android 示例 —— 移动端形态。
 *
 * ⚠️ 必须是**可滚动分区列表**。
 * 原来是一个居中固定 Column，组件一多就超出屏幕（1080×2400 也放不下），
 * 下面的组件根本看不到 —— 等于没有示例。
 *
 * 分区：
 *  ① 边缘折射（材质底板）
 *  ② 材质层级（plain / regular / elevated / focused）
 *  ③ 桌面组件在触屏上的表现（Menu 点击 / Tooltip 长按）
 *  ④ GlassGroup SDF 融合
 *  ⑤ 侧边导航（桌面形态，移动端可复用）
 *  ⑥ 移动专属（BottomBar / Dialog）
 *  ⑦ 交互状态
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

private val TABS = listOf(
    GlassTabItem("home", "首页"),
    GlassTabItem("components", "组件"),
    GlassTabItem("settings", "设置"),
)

@Composable
private fun AndroidShowcase() {
    var tab by remember { mutableStateOf("components") }
    var dialogVisible by remember { mutableStateOf(false) }
    var menuOpen by remember { mutableStateOf(false) }
    var tipClicks by remember { mutableStateOf(0) }
    var selectedSidebar by remember { mutableStateOf("a") }

    // Android 返回键关闭对话框 —— 移动端必备
    BackHandler(enabled = dialogVisible) { dialogVisible = false }

    Box(Modifier.fillMaxSize()) {
        val backdrop = rememberLayerBackdrop()

        // 背景：渐变 + 高对比条纹。玻璃折射需要纹理才可见。
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

        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(top = 56.dp, bottom = 96.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(12.dp),
            contentPadding = PaddingValues(horizontal = 20.dp),
        ) {
            // ── 标题 ──────────────────────────────────────────
            item {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
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
                }
            }

            // ── ① 边缘折射 ────────────────────────────────────
            item { SectionTitle("① 边缘折射 · GlassSurface") }
            item {
                GlassSurface(
                    backdrop = backdrop,
                    modifier = Modifier.width(280.dp).height(110.dp),
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
            }

            // ── ② 材质层级 ────────────────────────────────────
            item { SectionTitle("② 材质层级 · level") }
            item {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf(
                        GlassLevel.Plain to "plain",
                        GlassLevel.Regular to "regular",
                        GlassLevel.Elevated to "elevated",
                        GlassLevel.Focused to "focused",
                    ).forEach { (lvl, name) ->
                        GlassSurface(
                            backdrop = backdrop,
                            modifier = Modifier.width(72.dp).height(44.dp),
                            shape = CircleShape,
                            level = lvl,
                        ) {
                            Text(name, fontSize = 10.sp, color = Color(0xFF1B2733))
                        }
                    }
                }
            }

            // ── ③ 桌面组件在触屏上 ────────────────────────────
            item { SectionTitle("③ 桌面组件 · 触屏降级") }
            item {
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    // GlassMenu：点击驱动，触屏正常工作
                    Box(
                        Modifier.width(120.dp).height(44.dp).clickable { menuOpen = true }
                    ) {
                        GlassSurface(
                            backdrop = backdrop,
                            modifier = Modifier.fillMaxSize(),
                            shape = CircleShape,
                            level = GlassLevel.Regular,
                        ) {
                            Text("点开菜单", fontSize = 12.sp, color = Color(0xFF1B2733))
                        }
                    }
                    // GlassTooltip：长按替代 hover
                    GlassTooltip(
                        text = "长按提示：触屏没有 hover，用长按替代",
                        backdrop = backdrop,
                        showDelayMillis = 0,
                    ) {
                        Box(
                            Modifier.width(120.dp).height(44.dp).clickable { tipClicks++ }
                        ) {
                            GlassSurface(
                                backdrop = backdrop,
                                modifier = Modifier.fillMaxSize(),
                                shape = CircleShape,
                                level = GlassLevel.Regular,
                            ) {
                                Text("长按提示", fontSize = 12.sp, color = Color(0xFF1B2733))
                            }
                        }
                    }
                }
            }

            // ── ④ GlassGroup 融合 ─────────────────────────────
            item { SectionTitle("④ SDF 融合 · GlassGroup") }
            item {
                Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        GlassGroup(
                            backdrop = backdrop,
                            shapes = listOf(
                                RectShape(0f, 0f, 56f, 56f, 28f),
                                RectShape(74f, 0f, 56f, 56f, 28f),
                            ),
                            smoothing = 22.dp,
                            modifier = Modifier.size(130.dp, 56.dp),
                        ) {}
                        Text("smoothing=22", fontSize = 9.sp, color = Color(0xFF1B2733))
                    }
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        GlassGroup(
                            backdrop = backdrop,
                            shapes = listOf(
                                RectShape(0f, 0f, 56f, 56f, 28f),
                                RectShape(74f, 0f, 56f, 56f, 28f),
                            ),
                            smoothing = 0.dp,
                            modifier = Modifier.size(130.dp, 56.dp),
                        ) {}
                        Text("smoothing=0", fontSize = 9.sp, color = Color(0xFF1B2733))
                    }
                }
            }

            // ── ⑤ 侧边导航（桌面形态，移动端可复用）───────────
            item { SectionTitle("⑤ 侧边导航 · GlassSidebar") }
            item {
                Box(Modifier.width(220.dp).height(150.dp)) {
                    GlassSidebar(
                        backdrop = backdrop,
                        items = listOf(
                            GlassSidebarItem("a", "概览"),
                            GlassSidebarItem("b", "组件"),
                            GlassSidebarItem("c", "设置"),
                        ),
                        selectedId = selectedSidebar,
                        onSelect = { selectedSidebar = it },
                        width = 220.dp,
                    )
                }
            }

            // ── ⑥ 移动专属 ────────────────────────────────────
            item { SectionTitle("⑥ 移动专属 · BottomBar / Dialog") }
            item {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        "底部标签栏固定在屏幕底部；对话框从底部滑入",
                        fontSize = 11.sp,
                        color = Color(0xFF48586A),
                    )
                    Spacer(Modifier.height(8.dp))
                    Box(
                        Modifier.width(160.dp).height(44.dp).clickable { dialogVisible = true }
                    ) {
                        GlassSurface(
                            backdrop = backdrop,
                            modifier = Modifier.fillMaxSize(),
                            shape = CircleShape,
                            level = GlassLevel.Focused,
                        ) {
                            Text("打开对话框", fontSize = 13.sp, color = Color(0xFF1B2733))
                        }
                    }
                }
            }

            // ── ⑦ 交互状态 ────────────────────────────────────
            item { SectionTitle("⑦ 交互状态 · 按压反馈") }
            item {
                Text(
                    "长按次数 = $tipClicks   侧栏选中 = $selectedSidebar",
                    fontSize = 11.sp,
                    color = Color(0xFF48586A),
                )
            }

            item { Spacer(Modifier.height(12.dp)) }
        }

        // 桌面组件 GlassMenu 在触屏上：点击驱动，能正常工作
        Box(Modifier.align(Alignment.TopCenter).padding(top = 10.dp)) {
            GlassMenu(
                backdrop = backdrop,
                items = listOf(
                    GlassMenuItem("a", "菜单项 A"),
                    GlassMenuItem("b", "菜单项 B"),
                    GlassMenuItem("d", "", isDivider = true),
                    GlassMenuItem("c", "危险项", danger = true),
                ),
            ) { open, setOpen ->
                if (open != menuOpen) menuOpen = open
                Box(
                    Modifier.width(150.dp).height(40.dp).clickable { setOpen(!open) }
                ) {
                    GlassSurface(
                        backdrop = backdrop,
                        modifier = Modifier.fillMaxSize(),
                        shape = CircleShape,
                        level = GlassLevel.Focused,
                    ) {
                        Text("点开菜单", fontSize = 13.sp, color = Color(0xFF1B2733))
                    }
                }
            }
        }

        // 底部标签栏（移动端主导航）
        GlassBottomBar(
            backdrop = backdrop,
            items = TABS,
            selectedId = tab,
            onSelect = { tab = it },
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(horizontal = 12.dp, vertical = 20.dp),
        )

        // 底部抽屉式对话框
        GlassDialog(
            visible = dialogVisible,
            onDismiss = { dialogVisible = false },
            backdrop = backdrop,
            title = "确认删除",
            message = "此操作不可撤销。移动端用底部抽屉：拇指可达，键盘弹出也不遮挡。",
            actions = listOf(
                GlassDialogAction("取消", onClick = { dialogVisible = false }),
                GlassDialogAction("删除", onClick = { dialogVisible = false }, danger = true),
            ),
        )
    }
}

/** 分区标题。 */
@Composable
private fun SectionTitle(text: String) {
    Text(
        text,
        fontSize = 12.sp,
        fontWeight = FontWeight.Medium,
        color = Color(0xFF3C4C5E),
        modifier = Modifier.padding(top = 10.dp),
    )
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
