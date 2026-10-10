package com.weizhang09.liquidglass

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.hoverable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsHoveredAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
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
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kyant.backdrop.Backdrop
import com.weizhang09.liquidglass.tokens.GlassColorTokens
import com.weizhang09.liquidglass.tokens.GlassMotionTokens
import com.weizhang09.liquidglass.tokens.GlassRadiusTokens

/**
 * 侧栏条目。
 *
 * [icon] 是 `@Composable` 插槽而非某个图标库的 `ImageVector` ——
 * 这样组件不绑定任何图标依赖，消费方用自带图标库、emoji 或自绘图形都可以。
 */
data class GlassSidebarItem(
    val id: String,
    val label: String,
    val icon: (@Composable () -> Unit)? = null,
    val badge: String? = null,
)

/**
 * 液态玻璃侧栏 —— 桌面端主导航形态。
 *
 * 平台适配说明：移动端用底部标签栏（[GlassBottomBar]，待实现），
 * 桌面端用左侧栏。两者的差异不只是位置：
 *  - 桌面端有**悬停态**（触屏无 hover 概念），本组件据此设计交互反馈
 *  - 桌面端条目通常带图标 + 文字横排，移动端多为图标纵排
 *
 * 视觉层级：整条侧栏是一块玻璃；选中项额外获得一层浅色指示底，
 * 悬停项获得更浅的底。指示底用的是 tokens 里的高光色，
 * 不是独立玻璃层 —— 嵌套玻璃（子元素采样父层）留待 v2。
 *
 * 用法：
 * ```
 * val backdrop = rememberLayerBackdrop()
 * Box(Modifier.layerBackdrop(backdrop).fillMaxSize()) { /* 背景 */ }
 * GlassSidebar(
 *     backdrop = backdrop,
 *     items = listOf(GlassSidebarItem("home", "首页"), ...),
 *     selectedId = current,
 *     onSelect = { current = it },
 * )
 * ```
 *
 * @param width 侧栏宽度。桌面端常规 200–280dp
 * @param shape 形状，默认取 tokens 的 xl 圆角
 */
@Composable
fun GlassSidebar(
    backdrop: Backdrop,
    items: List<GlassSidebarItem>,
    selectedId: String?,
    onSelect: (String) -> Unit,
    modifier: Modifier = Modifier,
    width: Dp = 240.dp,
    shape: Shape = RoundedCornerShape(GlassRadiusTokens.xl),
    header: (@Composable () -> Unit)? = null,
    footer: (@Composable () -> Unit)? = null,
) {
    GlassSurface(
        backdrop = backdrop,
        modifier = modifier.width(width).fillMaxHeight(),
        shape = shape,
        level = GlassLevel.Regular,
    ) {
        Column(
            modifier = Modifier.fillMaxWidth().padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp),
        ) {
            if (header != null) {
                Box(Modifier.fillMaxWidth().padding(horizontal = 8.dp, vertical = 10.dp)) {
                    header()
                }
                Spacer(Modifier.height(4.dp))
            }

            items.forEach { item ->
                GlassSidebarEntry(
                    item = item,
                    selected = item.id == selectedId,
                    onSelect = { onSelect(item.id) },
                )
            }

            if (footer != null) {
                Spacer(Modifier.height(4.dp))
                Box(Modifier.fillMaxWidth().padding(horizontal = 8.dp, vertical = 10.dp)) {
                    footer()
                }
            }
        }
    }
}

/**
 * 单个侧栏条目。
 *
 * 悬停态只对指针设备有意义；Compose Desktop 的 `hoverable` 在触屏上不会触发，
 * 因此这里无需额外平台分支。
 */
@Composable
private fun GlassSidebarEntry(
    item: GlassSidebarItem,
    selected: Boolean,
    onSelect: () -> Unit,
) {
    val interaction = remember { MutableInteractionSource() }
    val hovered by interaction.collectIsHoveredAsState()
    val tokens = GlassColorTokens.Light

    // 三档底色：选中 > 悬停 > 常态
    val target = when {
        selected -> tokens.tintStrong
        hovered -> tokens.tint
        else -> Color.Transparent
    }
    val bg by animateColorAsState(
        targetValue = target,
        animationSpec = tween(GlassMotionTokens.FAST),
        label = "sidebar-entry-bg",
    )
    val labelColor by animateColorAsState(
        targetValue = if (selected) Color(0xFF1B2733) else Color(0xFF48586A),
        animationSpec = tween(GlassMotionTokens.FAST),
        label = "sidebar-entry-fg",
    )

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(40.dp)
            .clip(RoundedCornerShape(GlassRadiusTokens.sm))
            .background(bg)
            .hoverable(interaction)
            .clickable(
                interactionSource = interaction,
                indication = null,
                onClick = onSelect,
            )
            .padding(horizontal = 10.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        if (item.icon != null) {
            Box(Modifier.size(18.dp), contentAlignment = Alignment.Center) {
                item.icon()
            }
        }
        Text(
            text = item.label,
            fontSize = 14.sp,
            fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Normal,
            color = labelColor,
            modifier = Modifier.weight(1f),
        )
        if (item.badge != null) {
            Text(
                text = item.badge,
                fontSize = 11.sp,
                color = Color(0xFF48586A),
            )
        }
    }
}
