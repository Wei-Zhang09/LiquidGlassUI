package com.weizhang09.liquidglass

import androidx.compose.material3.Text
import androidx.compose.ui.test.ExperimentalTestApi
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performMouseInput
import androidx.compose.ui.test.v2.runComposeUiTest
import kotlin.test.Test

/**
 * GlassTooltip 的交互测试。
 *
 * 使用共享的 NoopBackdrop（见 NoopBackdrop.kt）：backdrop 的 GraphicsLayer
 * 在无头测试进程中原生崩溃，而提示框的显示/隐藏时序与玻璃渲染无关。
 *
 * 三个写法要点（都是实测踩出来的）：
 *
 * 1. 提示未显示时节点**根本不存在**（条件渲染），用 assertDoesNotExist；
 *    它是 SemanticsNodeInteraction 的成员方法，无需 import。
 *
 * 2. 显示逻辑在 `LaunchedEffect` 里，而 v2 的 StandardTestDispatcher
 *    会把协程排队而非立即执行，`waitForIdle()` **不推进**它。
 *    因此必须用 `waitUntil { ... }` 轮询等待状态收敛，
 *    这是 Compose 测试处理异步状态的标准做法。
 *
 * 3. 测试传 `showDelayMillis = 0`，避免依赖真实时间。
 *
 * 4. 提示框用 `offset` 绘制在锚点布局边界之外（Box 默认不裁剪，屏幕上可见）。
 *    Compose 的 `assertIsDisplayed` 要求节点落在父级边界内，会对此误报失败，
 *    所以对提示框只能用 `assertExists`。
 *
 * 这也是一条真实限制：**父级若设置 `clip`，提示会被裁掉**，
 * 且辅助功能/语义工具不会把它视为"已显示"。使用方需保证容器有足够空间。
 */
class GlassTooltipTest {

    @OptIn(ExperimentalTestApi::class)
    @Test
    fun tooltipNotRenderedUntilHover() = runComposeUiTest {
        setContent {
            GlassTooltip(text = "打开设置", backdrop = NoopBackdrop, showDelayMillis = 0) {
                Text("设置")
            }
        }

        onNodeWithText("打开设置").assertDoesNotExist()
        onNodeWithText("设置").assertExists()
    }

    @OptIn(ExperimentalTestApi::class)
    @Test
    fun tooltipAppearsOnHover() = runComposeUiTest {
        setContent {
            GlassTooltip(text = "打开设置", backdrop = NoopBackdrop, showDelayMillis = 0) {
                Text("设置")
            }
        }

        onNodeWithText("设置").performMouseInput { enter(center) }

        waitUntil(timeoutMillis = 5_000) {
            onAllNodesWithText("打开设置").fetchSemanticsNodes().isNotEmpty()
        }
        // 用 assertExists 而非 assertIsDisplayed：提示框被 offset 到锚点布局边界之外
        // （Box 默认不裁剪，所以屏幕上可见），但 Compose 的 displayed 语义
        // 要求节点落在父级边界内，因此 assertIsDisplayed 会误报失败。
        onNodeWithText("打开设置").assertExists()
    }

    @OptIn(ExperimentalTestApi::class)
    @Test
    fun tooltipDisappearsAfterPointerLeaves() = runComposeUiTest {
        setContent {
            GlassTooltip(text = "打开设置", backdrop = NoopBackdrop, showDelayMillis = 0) {
                Text("设置")
            }
        }

        val anchor = onNodeWithText("设置")
        anchor.performMouseInput { enter(center) }
        waitUntil(timeoutMillis = 5_000) {
            onAllNodesWithText("打开设置").fetchSemanticsNodes().isNotEmpty()
        }
        // 用 assertExists 而非 assertIsDisplayed：提示框被 offset 到锚点布局边界之外
        // （Box 默认不裁剪，所以屏幕上可见），但 Compose 的 displayed 语义
        // 要求节点落在父级边界内，因此 assertIsDisplayed 会误报失败。
        onNodeWithText("打开设置").assertExists()

        anchor.performMouseInput { exit() }
        waitUntil(timeoutMillis = 5_000) {
            onAllNodesWithText("打开设置").fetchSemanticsNodes().isEmpty()
        }
        onNodeWithText("打开设置").assertDoesNotExist()
    }
}
