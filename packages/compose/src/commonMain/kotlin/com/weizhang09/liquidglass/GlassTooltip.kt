package com.weizhang09.liquidglass

import androidx.compose.foundation.gestures.awaitEachGesture
import androidx.compose.foundation.gestures.awaitFirstDown
import androidx.compose.foundation.gestures.waitForUpOrCancellation
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
import androidx.compose.ui.input.pointer.AwaitPointerEventScope
import androidx.compose.ui.input.pointer.PointerEventPass
import androidx.compose.ui.input.pointer.changedToUpIgnoreConsumed
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kyant.backdrop.Backdrop
import com.weizhang09.liquidglass.tokens.GlassMotionTokens
import com.weizhang09.liquidglass.tokens.GlassRadiusTokens
import kotlinx.coroutines.delay
import kotlinx.coroutines.withTimeoutOrNull

/** 提示框相对锚点的位置。 */
enum class TooltipPlacement {
    /** 锚点下方（默认）。锚点靠近窗口顶部时用这个。 */
    Below,

    /** 锚点上方。锚点靠近窗口底部时用这个，避免提示被裁掉。 */
    Above,
}

/**
 * 液态玻璃提示框 —— 双端可用。
 *
 * ## 两种触发方式（平台分化在这里的具体解法）
 *
 * | 设备 | 触发 | 机制 |
 * |---|---|---|
 * | 指针（鼠标/触控板） | 悬停 | `hoverable` + `collectIsHoveredAsState` |
 * | 触屏 | **长按** | 自定义手势检测（见下） |
 *
 * 触屏没有 hover，长按是各平台通用的替代语义（iOS/Android 原生 tooltip 同此）。
 *
 * ## 为什么不用 detectTapGestures
 * `detectTapGestures` 在收到 down 时**立即消费**事件，会破坏子元素自身的点击。
 * 而 tooltip 的锚点通常是按钮，需要：
 *  - **短按** → 照常触发锚点的动作（用户要的是那个功能）
 *  - **长按** → 显示提示，且**不**触发动作
 *
 * 因此这里手写检测：在 `PointerEventPass.Initial` 上监听（父级先于子级收到事件），
 * 超时前抬起则完全不干预；判定为长按后消费后续事件，子元素因事件被消费而取消点击。
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
 *                       这是交互时序，属于设计参数，因此走 tokens 而非硬编码。
 *                       长按不受此值影响，用系统长按超时。
 * @param enableLongPress 是否启用长按触发。锚点自身需要长按时可关掉。
 */
@Composable
fun GlassTooltip(
    text: String,
    backdrop: Backdrop,
    modifier: Modifier = Modifier,
    placement: TooltipPlacement = TooltipPlacement.Below,
    showDelayMillis: Int = GlassMotionTokens.SLOW,
    enableLongPress: Boolean = true,
    content: @Composable () -> Unit,
) {
    val interaction = remember { MutableInteractionSource() }
    val hovered by interaction.collectIsHoveredAsState()
    var delayedVisible by remember { mutableStateOf(false) }
    var touchVisible by remember { mutableStateOf(false) }
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
    val visible = touchVisible || if (showDelayMillis <= 0) hovered else delayedVisible

    Box(modifier) {
        Box(
            Modifier
                .hoverable(interaction)
                .then(
                    if (enableLongPress) {
                        Modifier.pointerInput(Unit) {
                            awaitEachGesture {
                                // Initial 通道：父级先于子级收到事件。
                                // 不消费 down —— 短按要让子元素正常工作。
                                awaitFirstDown(
                                    requireUnconsumed = false,
                                    pass = PointerEventPass.Initial,
                                )

                                // 上次长按留下的提示还显示着 → 本次按下先关掉。
                                // 这样"再点一下关闭"是自然的，且该次点击照常生效。
                                if (touchVisible) touchVisible = false

                                // waitForUpOrCancellation 返回 null 有**两种**原因：
                                //   1) 超时 → 确实是长按
                                //   2) 事件被他人消费（如父级滚动接管）→ 手势取消
                                // 必须区分，否则在可滚动列表里一滚就弹提示。
                                var cancelled = false
                                val up = withTimeoutOrNull(
                                    viewConfiguration.longPressTimeoutMillis,
                                ) {
                                    val r = waitForUpOrCancellation(PointerEventPass.Initial)
                                    if (r == null) cancelled = true
                                    r
                                }

                                if (up == null && !cancelled) {
                                    // 长按：显示提示，并消费到抬起以阻止锚点被点击。
                                    //
                                    // **松手后不隐藏** —— 这是必要的：按住时手指正盖着
                                    // 提示文字，松手就消失等于用户根本读不到。
                                    // 改为保持显示，下次按下时关闭（见上方）。
                                    touchVisible = true
                                    consumeUntilUp()
                                }
                            }
                        }
                    } else {
                        Modifier
                    },
                )
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

/**
 * 消费后续事件直到抬起。
 *
 * 在 Initial 通道消费，子元素在 Main 通道只能看到已消费的事件，
 * 其按压被取消 —— 这样长按不会同时触发锚点的点击。
 */
private suspend fun AwaitPointerEventScope.consumeUntilUp() {
    var up = false
    while (!up) {
        val event = awaitPointerEvent(PointerEventPass.Initial)
        event.changes.forEach { it.consume() }
        up = event.changes.all { it.changedToUpIgnoreConsumed() }
    }
}

/** 提示框与锚点的间距。属于设计参数，集中在此便于后续迁入 tokens。 */
private val TOOLTIP_GAP = 6.dp
