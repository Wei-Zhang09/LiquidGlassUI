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
import com.weizhang09.liquidglass.GlassBottomBar
import com.weizhang09.liquidglass.GlassDialog
import com.weizhang09.liquidglass.GlassDialogAction
import com.weizhang09.liquidglass.GlassLevel
import com.weizhang09.liquidglass.GlassSurface
import com.weizhang09.liquidglass.GlassTabItem
import com.weizhang09.liquidglass.tokens.GlassRadiusTokens

/**
 * Android 示例 —— 移动端形态。
 *
 * 与桌面端共用 commonMain 的组件；这里展示**移动端导向**的两个：
 *  - GlassBottomBar：底部标签栏（触屏用按压反馈，无 hover）
 *  - GlassDialog：底部抽屉式对话框（拇指可达，键盘弹出不遮挡）
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

            // 触发底部抽屉对话框
            Box(
                Modifier
                    .width(180.dp)
                    .height(48.dp)
                    .clickable { dialogVisible = true }
            ) {
                GlassSurface(
                    backdrop = backdrop,
                    modifier = Modifier.fillMaxSize(),
                    shape = CircleShape,
                    level = GlassLevel.Focused,
                ) {
                    Text("打开对话框", fontSize = 14.sp, color = Color(0xFF1B2733))
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
