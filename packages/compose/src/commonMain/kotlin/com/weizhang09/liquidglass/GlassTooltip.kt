package com.weizhang09.liquidglass

import androidx.compose.foundation.hoverable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsHoveredAsState
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kyant.backdrop.Backdrop
import com.weizhang09.liquidglass.tokens.GlassMotionTokens
import com.weizhang09.liquidglass.tokens.GlassRadiusTokens
import kotlinx.coroutines.delay

/** 提示框相对锚点的位置。 */
enum class TooltipPlacement {
    /** 锚点下方（默认）。锚点靠近窗口顶部时用这个。 */
    Below,

    /** 锚点上方。锚点靠近窗口底部时用这个，避免提示被裁掉。 */
    Above,
}

/**
 * 液态玻璃提示框 —— 桌面端专属交互。
 *
 * 平台适配说明：tooltip 依赖指针悬停，**触屏没有 hover 概念**，
 * 因此这是桌面端专有组件，移动端不提供对应实现
 * （移动端的等价物是长按弹出，语义不同，留待需要时单独设计）。
 *
 * ## 为什么不用 Popup
 * Compose Desktop 的 `Popup` 会创建**独立窗口**，它采样不到父级的 backdrop，
 * 玻璃会退化成普通半透明块。因此本组件用同层 overlay 实现：
 * 提示框绘制在锚点所在的 Box 内，依靠 Compose 默认不裁剪的特性溢出显示。
 *
 * 代价与约束：**父级若设置了 `clip`，提示会被裁掉**。
 * 使用方需保证锚点所在容器有足够空间，或选择合适的方向。
 *
 * 用法：
 * ```
 * GlassTooltip(text = "打开设置", backdrop = backdrop) {
 *     GlassButton(...)
 * }
 * ```
 *
 * @param showDelayMillis 悬停多久后显示。默认取 tokens 的 slow（400ms）——
 *                       这是交互时序，属于设计参数，因此走 tokens 而非硬编码
 */
@Composable
fun GlassTooltip(
    text: String,
    backdrop: Backdrop,
    modifier: Modifier = Modifier,
    placement: TooltipPlacement = TooltipPlacement.Below,
    showDelayMillis: Int = GlassMotionTokens.SLOW,
    content: @Composable () -> Unit,
) {
    val interaction = remember { MutableInteractionSource() }
    val hovered by interaction.collectIsHoveredAsState()
    var delayedVisible by remember { mutableStateOf(false) }
    var anchorHeight by remember { mutableIntStateOf(0) }
    var tooltipHeight by remember { mutableIntStateOf(0) }
    val density = LocalDensity.current

    // 悬停后延迟显示，移开立即隐藏。
    // 立即显示会在鼠标划过时闪出一串提示，延迟是必要的 UX 约定。
    LaunchedEffect(hovered, showDelayMillis) {
        if (hovered && showDelayMillis > 0) {
            delay(showDelayMillis.toLong())
            delayedVisible = true
        } else {
            delayedVisible = false
        }
    }

    // 延迟为 0 时直接从 hovered 派生，**不经过协程**。
    // 这样"无延迟"是真正的同步语义（也使其可在测试中确定性地断言）；
    // 若走 LaunchedEffect，即使跳过 delay，状态更新仍需等待协程调度。
    val visible = if (showDelayMillis <= 0) hovered else delayedVisible

    Box(modifier) {
        Box(
            Modifier
                .hoverable(interaction)
                .onSizeChanged { anchorHeight = it.height },
        ) {
            content()
        }

        if (visible) {
            val gapPx = with(density) { TOOLTIP_GAP.toPx() }.toInt()
            val offsetY = when (placement) {
                TooltipPlacement.Below -> anchorHeight + gapPx
                TooltipPlacement.Above -> -(tooltipHeight + gapPx)
            }
            Box(
                Modifier
                    .offset { IntOffset(0, offsetY) }
                    .onSizeChanged { tooltipHeight = it.height },
            ) {
                GlassSurface(
                    backdrop = backdrop,
                    shape = RoundedCornerShape(GlassRadiusTokens.sm),
                    level = GlassLevel.Regular,
                ) {
                    Text(
                        text = text,
                        fontSize = 12.sp,
                        color = Color(0xFF1B2733),
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                    )
                }
            }
        }
    }
}

/** 提示框与锚点的间距。属于设计参数，集中在此便于后续迁入 tokens。 */
private val TOOLTIP_GAP = 6.dp
