package com.weizhang09.liquidglass

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kyant.backdrop.Backdrop
import com.weizhang09.liquidglass.tokens.GlassColorTokens
import com.weizhang09.liquidglass.tokens.GlassMotionTokens
import com.weizhang09.liquidglass.tokens.GlassRadiusTokens

/**
 * 对话框动作。`danger` 用于破坏性操作（红色）。
 */
data class GlassDialogAction(
    val label: String,
    val onClick: () -> Unit,
    val danger: Boolean = false,
)

/**
 * 液态玻璃对话框 —— **移动端形态（底部抽屉）**。
 *
 * ## 平台适配
 * 桌面端的模态是**居中弹窗**；移动端的等价物是**从底部滑入的抽屉**，
 * 原因有二：
 *  1. 拇指可达性 —— 屏幕下缘是单手最容易触及的区域
 *  2. 键盘弹出时不会遮挡内容（居中弹窗会被软键盘顶掉）
 *
 * 因此本组件的入场动画是 `slideInVertically`（自下而上），
 * 而非桌面的缩放淡入。
 *
 * ## 为什么用同层 overlay 而非 Dialog
 * Compose 的 `Dialog` 是**独立窗口**，采样不到父级 backdrop，玻璃会退化。
 * 这里用同层 Box 铺满父容器作遮罩，与 [GlassTooltip]、[GlassMenu] 同理。
 *
 * ## 已知限制
 * - 需要父容器铺满可用区域，否则遮罩不完整
 * - 未实现返回键处理（Android 侧应由调用方接 `BackHandler`）
 *
 * 用法：
 * ```
 * Box(Modifier.fillMaxSize()) {
 *     // 页面内容
 *     GlassDialog(
 *         visible = showDialog,
 *         onDismiss = { showDialog = false },
 *         backdrop = backdrop,
 *         title = "确认删除",
 *         message = "此操作不可撤销。",
 *         actions = listOf(
 *             GlassDialogAction("取消") { showDialog = false },
 *             GlassDialogAction("删除", danger = true) { doDelete(); showDialog = false },
 *         ),
 *     )
 * }
 * ```
 */
@Composable
fun GlassDialog(
    visible: Boolean,
    onDismiss: () -> Unit,
    backdrop: Backdrop,
    title: String,
    modifier: Modifier = Modifier,
    message: String? = null,
    actions: List<GlassDialogAction> = emptyList(),
    content: (@Composable () -> Unit)? = null,
) {
    val interaction = remember { MutableInteractionSource() }

    AnimatedVisibility(
        visible = visible,
        enter = fadeIn(tween(GlassMotionTokens.FAST)),
        exit = fadeOut(tween(GlassMotionTokens.FAST)),
        modifier = modifier,
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                // 遮罩：点击空白处关闭。用 tokens 的 overlay 保证足够暗度，
                // 否则背景内容会干扰前景可读性。
                .background(GlassColorTokens.Light.overlay)
                .clip(RoundedCornerShape(0.dp))
                .clickable(interaction, null, onClick = onDismiss),
            contentAlignment = Alignment.BottomCenter,
        ) {
            // 面板：阻止点击穿透到遮罩
            Box(Modifier.clickable(remember { MutableInteractionSource() }, null) {}) {
                AnimatedVisibility(
                    visible = visible,
                    enter = slideInVertically(tween(GlassMotionTokens.REGULAR)) { it },
                    exit = slideOutVertically(tween(GlassMotionTokens.FAST)) { it },
                ) {
                    GlassSurface(
                        backdrop = backdrop,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(
                            topStart = GlassRadiusTokens.xl,
                            topEnd = GlassRadiusTokens.xl,
                        ),
                        level = GlassLevel.Elevated,
                    ) {
                        Column(
                            modifier = Modifier.fillMaxWidth().padding(24.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp),
                        ) {
                            Text(
                                text = title,
                                fontSize = 18.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = Color(0xFF1B2733),
                            )
                            if (message != null) {
                                Text(
                                    text = message,
                                    fontSize = 14.sp,
                                    color = Color(0xFF48586A),
                                )
                            }
                            content?.invoke()

                            if (actions.isNotEmpty()) {
                                Row(
                                    modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
                                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                                ) {
                                    actions.forEach { action ->
                                        GlassSurface(
                                            backdrop = backdrop,
                                            modifier = Modifier.weight(1f).height(46.dp),
                                            shape = RoundedCornerShape(GlassRadiusTokens.md),
                                            level = GlassLevel.Focused,
                                        ) {
                                            Box(
                                                modifier = Modifier
                                                    .fillMaxSize()
                                                    .clickable(
                                                        interactionSource = remember { MutableInteractionSource() },
                                                        indication = null,
                                                        onClick = action.onClick,
                                                    ),
                                                contentAlignment = Alignment.Center,
                                            ) {
                                                Text(
                                                    text = action.label,
                                                    fontSize = 15.sp,
                                                    fontWeight = FontWeight.Medium,
                                                    color = if (action.danger) {
                                                        Color(0xFFD2453B)
                                                    } else {
                                                        Color(0xFF1B2733)
                                                    },
                                                )
                                            }
                                        }
                                    }
                                }
                            }
                            // 底部安全区占位
                            Box(Modifier.height(8.dp))
                        }
                    }
                }
            }
        }
    }
}
