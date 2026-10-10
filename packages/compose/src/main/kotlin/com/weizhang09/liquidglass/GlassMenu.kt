package com.weizhang09.liquidglass

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.hoverable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsHoveredAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.PointerEventPass
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kyant.backdrop.Backdrop
import com.weizhang09.liquidglass.tokens.GlassColorTokens
import com.weizhang09.liquidglass.tokens.GlassMotionTokens
import com.weizhang09.liquidglass.tokens.GlassRadiusTokens

/**
 * 菜单项。[icon] 与 [GlassSidebarItem] 一致，走 `@Composable` 插槽，
 * 组件不绑定任何图标库。
 */
data class GlassMenuItem(
    val id: String,
    val label: String,
    val icon: (@Composable () -> Unit)? = null,
    val shortcut: String? = null,
    val enabled: Boolean = true,
    val danger: Boolean = false,
    /** 为 true 时渲染为分隔线，其余字段忽略。 */
    val isDivider: Boolean = false,
)

/**
 * 液态玻璃下拉菜单 —— 桌面端高频交互。
 *
 * ## 平台适配
 * 下拉菜单是桌面端形态；移动端的等价物是底部动作面板（bottom sheet），
 * 交互模型不同（全屏遮罩 + 从下滑入），因此不共用实现。
 *
 * ## 为什么不用 Popup
 * 与 [GlassTooltip] 同理：Compose Desktop 的 `Popup` 是**独立窗口**，
 * 采样不到父级 backdrop，玻璃会退化成普通半透明块。
 * 本组件用同层 overlay，靠 Box 默认不裁剪溢出显示。
 *
 * ## 已知限制
 * 1. **父级设 `clip` 会裁掉菜单**。
 * 2. 关闭依赖"点击菜单外任意位置"，其实现是在锚点所在 Box 上铺一层
 *    透明捕获层。若锚点容器本身很小，点击层也小，点到容器外不会关闭 ——
 *    使用方应把菜单放在足够大的容器里（如页面根 Box）。
 * 3. 暂未实现键盘导航（上下键/回车）与子菜单，属后续工作。
 *
 * 用法：
 * ```
 * GlassMenu(
 *     backdrop = backdrop,
 *     items = listOf(GlassMenuItem("rename", "重命名", shortcut = "F2"), ...),
 * ) { open, setOpen ->
 *     GlassButton(onClick = { setOpen(!open) }) { Text("操作") }
 * }
 * ```
 */
@Composable
fun GlassMenu(
    backdrop: Backdrop,
    items: List<GlassMenuItem>,
    modifier: Modifier = Modifier,
    minWidth: Dp = 180.dp,
    anchor: @Composable (open: Boolean, setOpen: (Boolean) -> Unit) -> Unit,
) {
    var open by remember { mutableStateOf(false) }
    var anchorHeight by remember { mutableStateOf(0) }

    Box(modifier) {
        // 透明捕获层：菜单打开时铺满容器，点击任意处关闭。
        // 用 Initial pass 抢在子组件之前处理，避免点击被下层控件吃掉。
        if (open) {
            Box(
                Modifier
                    .matchParentSize()
                    .pointerInput(Unit) {
                        awaitPointerEventScope {
                            while (true) {
                                val event = awaitPointerEvent(PointerEventPass.Initial)
                                if (event.changes.any { it.pressed }) {
                                    open = false
                                }
                            }
                        }
                    },
            )
        }

        Column {
            Box(Modifier.onSizeChanged { anchorHeight = it.height }) {
                anchor(open) { open = it }
            }

            if (open) {
                val gapPx = with(androidx.compose.ui.platform.LocalDensity.current) {
                    MENU_GAP.toPx().toInt()
                }
                Box(Modifier.offset { IntOffset(0, anchorHeight + gapPx) }) {
                    GlassMenuPanel(
                        backdrop = backdrop,
                        items = items,
                        minWidth = minWidth,
                        onDismiss = { open = false },
                    )
                }
            }
        }
    }
}

@Composable
private fun GlassMenuPanel(
    backdrop: Backdrop,
    items: List<GlassMenuItem>,
    minWidth: Dp,
    onDismiss: () -> Unit,
) {
    GlassSurface(
        backdrop = backdrop,
        modifier = Modifier.widthIn(min = minWidth),
        shape = RoundedCornerShape(GlassRadiusTokens.md),
        level = GlassLevel.Elevated,
    ) {
        Column(
            modifier = Modifier.padding(vertical = 6.dp),
            verticalArrangement = Arrangement.spacedBy(1.dp),
        ) {
            items.forEach { item ->
                if (item.isDivider) {
                    Box(
                        Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 10.dp, vertical = 5.dp)
                            .height(1.dp)
                            .background(GlassColorTokens.Light.innerShadow),
                    )
                } else {
                    GlassMenuEntry(item) {
                        if (item.enabled) {
                            onDismiss()
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun GlassMenuEntry(item: GlassMenuItem, onClick: () -> Unit) {
    val interaction = remember { MutableInteractionSource() }
    val hovered by interaction.collectIsHoveredAsState()
    val tokens = GlassColorTokens.Light

    val bg = when {
        !item.enabled -> Color.Transparent
        hovered -> tokens.tint
        else -> Color.Transparent
    }
    val labelColor = when {
        !item.enabled -> Color(0xFF9AA6B2)
        item.danger -> Color(0xFFD2453B)
        else -> Color(0xFF1B2733)
    }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(34.dp)
            .padding(horizontal = 6.dp)
            .clip(RoundedCornerShape(GlassRadiusTokens.sm))
            .background(bg)
            .hoverable(interaction, enabled = item.enabled)
            .clickable(
                interactionSource = interaction,
                indication = null,
                enabled = item.enabled,
                onClick = onClick,
            )
            .padding(horizontal = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        if (item.icon != null) {
            Box(Modifier.size(16.dp), contentAlignment = Alignment.Center) {
                item.icon()
            }
        }
        Text(
            text = item.label,
            fontSize = 13.sp,
            color = labelColor,
            modifier = Modifier.weight(1f),
        )
        if (item.shortcut != null) {
            Text(
                text = item.shortcut,
                fontSize = 11.sp,
                color = Color(0xFF8A96A3),
            )
        }
    }
}

/** 菜单与锚点的间距。设计参数，集中在此便于后续迁入 tokens。 */
private val MENU_GAP = 4.dp
