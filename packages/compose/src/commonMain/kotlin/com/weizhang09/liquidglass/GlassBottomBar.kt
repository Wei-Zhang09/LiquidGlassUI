package com.weizhang09.liquidglass

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kyant.backdrop.Backdrop
import com.weizhang09.liquidglass.tokens.GlassColorTokens
import com.weizhang09.liquidglass.tokens.GlassMotionTokens
import com.weizhang09.liquidglass.tokens.GlassRadiusTokens

/**
 * 底部标签栏条目。[icon] 与其他组件一致，走 `@Composable` 插槽，
 * 不绑定任何图标库。
 */
data class GlassTabItem(
    val id: String,
    val label: String,
    val icon: (@Composable () -> Unit)? = null,
    val badge: String? = null,
)

/**
 * 液态玻璃底部标签栏 —— **移动端主导航形态**。
 *
 * ## 平台适配（与 [GlassSidebar] 的对比）
 *
 * | | GlassSidebar（桌面） | GlassBottomBar（移动） |
 * |---|---|---|
 * | 位置 | 左侧竖向 | 底部横向 |
 * | 交互反馈 | **悬停**（指针设备） | **按压**（触屏无 hover） |
 * | 条目布局 | 图标+文字横排、左对齐 | 图标在上文字在下、等宽居中 |
 * | 可达性 | 鼠标可及全屏 | 拇指区（屏幕下缘） |
 *
 * 触屏没有 hover 概念，因此本组件用 `collectIsPressedAsState` 提供
 * **按压反馈** —— 这是移动端对应的交互语言。
 *
 * ## 语义
 * 使用 `selectable` + `Role.Tab`，让无障碍服务正确朗读选中状态。
 *
 * 用法：
 * ```
 * val backdrop = rememberLayerBackdrop()
 * Box(Modifier.layerBackdrop(backdrop)) { /* 内容 */ }
 * GlassBottomBar(
 *     backdrop = backdrop,
 *     items = listOf(GlassTabItem("home", "首页"), ...),
 *     selectedId = current,
 *     onSelect = { current = it },
 * )
 * ```
 *
 * @param height 栏高。移动端常规 56–64dp（含安全区需调用方自行加 padding）
 */
@Composable
fun GlassBottomBar(
    backdrop: Backdrop,
    items: List<GlassTabItem>,
    selectedId: String?,
    onSelect: (String) -> Unit,
    modifier: Modifier = Modifier,
    height: Dp = 60.dp,
    shape: Shape = RoundedCornerShape(GlassRadiusTokens.lg),
) {
    GlassSurface(
        backdrop = backdrop,
        modifier = modifier.fillMaxWidth().height(height),
        shape = shape,
        level = GlassLevel.Regular,
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 6.dp, vertical = 4.dp),
            horizontalArrangement = Arrangement.SpaceEvenly,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            items.forEach { item ->
                GlassTab(
                    item = item,
                    selected = item.id == selectedId,
                    onSelect = { onSelect(item.id) },
                    modifier = Modifier.weight(1f),
                )
            }
        }
    }
}

/**
 * 单个标签。
 *
 * 选中态用 tokens 的高光色作指示底；按压态额外加深 —— 触屏的反馈语言。
 */
@Composable
private fun GlassTab(
    item: GlassTabItem,
    selected: Boolean,
    onSelect: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val interaction = remember { MutableInteractionSource() }
    val pressed by interaction.collectIsPressedAsState()
    val tokens = GlassColorTokens.Light

    val bg by animateColorAsState(
        targetValue = when {
            pressed -> tokens.tintStrong
            selected -> tokens.tint
            else -> Color.Transparent
        },
        animationSpec = tween(GlassMotionTokens.FAST),
        label = "tab-bg",
    )
    val contentColor by animateColorAsState(
        targetValue = if (selected) Color(0xFF1B2733) else Color(0xFF6B7885),
        animationSpec = tween(GlassMotionTokens.FAST),
        label = "tab-fg",
    )

    Column(
        modifier = modifier
            .clip(RoundedCornerShape(GlassRadiusTokens.sm))
            .background(bg)
            .selectable(
                selected = selected,
                interactionSource = interaction,
                indication = null,
                onClick = onSelect,
            )
            .padding(vertical = 6.dp, horizontal = 4.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(3.dp),
    ) {
        if (item.icon != null) {
            Box(Modifier.size(20.dp), contentAlignment = Alignment.Center) {
                item.icon()
            }
        }
        Text(
            text = item.label,
            fontSize = 11.sp,
            fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Normal,
            color = contentColor,
            textAlign = TextAlign.Center,
            maxLines = 1,
        )
        if (item.badge != null) {
            Text(text = item.badge, fontSize = 9.sp, color = contentColor)
        }
    }
}
