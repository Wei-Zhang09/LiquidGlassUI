package com.weizhang09.liquidglass

import androidx.compose.foundation.clickable
import androidx.compose.material3.Text
import androidx.compose.ui.Modifier
import androidx.compose.ui.test.ExperimentalTestApi
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performMouseInput
import androidx.compose.ui.test.performTouchInput
import androidx.compose.ui.test.longClick
import androidx.compose.ui.test.click
import androidx.compose.ui.test.v2.runComposeUiTest
import kotlin.test.Test
import kotlin.test.assertEquals

/**
 * GlassTooltip 的长按支持测试。
 *
 * 这里验证的核心是**长按不能破坏短按** ——
 * tooltip 的锚点通常是按钮，短按必须照常触发其动作，
 * 只有长按才显示提示。这是自写手势检测而非用 detectTapGestures 的原因。
 */
class GlassTooltipLongPressTest {

    @OptIn(ExperimentalTestApi::class)
    @Test
    fun shortTapStillTriggersAnchorClick() = runComposeUiTest {
        var clicks = 0

        setContent {
            GlassTooltip(text = "提示", backdrop = NoopBackdrop, showDelayMillis = 0) {
                Text("锚点", Modifier.clickable { clicks++ })
            }
        }

        // 短按 —— 必须照常触发锚点动作，且不显示提示
        onNodeWithText("锚点").performTouchInput { click() }
        waitForIdle()

        assertEquals(1, clicks, "短按未触发锚点点击 —— 手势检测破坏了子元素")
        onNodeWithText("提示").assertDoesNotExist()
    }

    @OptIn(ExperimentalTestApi::class)
    @Test
    fun longPressShowsTooltip() = runComposeUiTest {
        setContent {
            GlassTooltip(text = "长按提示", backdrop = NoopBackdrop, showDelayMillis = 0) {
                Text("锚点")
            }
        }

        onNodeWithText("锚点").performTouchInput { longClick() }
        waitForIdle()

        onNodeWithText("长按提示").assertExists()
    }

    @OptIn(ExperimentalTestApi::class)
    @Test
    fun longPressDoesNotTriggerAnchorClick() = runComposeUiTest {
        var clicks = 0

        setContent {
            GlassTooltip(text = "提示", backdrop = NoopBackdrop, showDelayMillis = 0) {
                Text("锚点", Modifier.clickable { clicks++ })
            }
        }

        onNodeWithText("锚点").performTouchInput { longClick() }
        waitForIdle()

        // 长按是"查看提示"，不该同时触发锚点动作
        assertEquals(0, clicks, "长按误触发了锚点点击")
    }

    @OptIn(ExperimentalTestApi::class)
    @Test
    fun longPressCanBeDisabled() = runComposeUiTest {
        setContent {
            GlassTooltip(
                text = "不该出现",
                backdrop = NoopBackdrop,
                showDelayMillis = 0,
                enableLongPress = false,
            ) {
                Text("锚点")
            }
        }

        onNodeWithText("锚点").performTouchInput { longClick() }
        waitForIdle()

        onNodeWithText("不该出现").assertDoesNotExist()
    }

    @OptIn(ExperimentalTestApi::class)
    @Test
    fun hoverStillWorks() = runComposeUiTest {
        setContent {
            GlassTooltip(text = "悬停提示", backdrop = NoopBackdrop, showDelayMillis = 0) {
                Text("锚点")
            }
        }

        // 长按的加入不能破坏原有的悬停路径
        onNodeWithText("锚点").performMouseInput { enter(center) }
        waitUntil(timeoutMillis = 5_000) {
            onAllNodesWithText("悬停提示").fetchSemanticsNodes().isNotEmpty()
        }
        onNodeWithText("悬停提示").assertExists()
    }

    @OptIn(ExperimentalTestApi::class)
    @Test
    fun multipleShortTapsAllRegister() = runComposeUiTest {
        var clicks = 0

        setContent {
            GlassTooltip(text = "提示", backdrop = NoopBackdrop, showDelayMillis = 0) {
                Text("锚点", Modifier.clickable { clicks++ })
            }
        }

        repeat(3) {
            onNodeWithText("锚点").performTouchInput { click() }
            waitForIdle()
        }

        // 每次手势都要正确重置，不能因为第一次短按就卡住后续检测
        assertEquals(3, clicks, "连续短按有丢失")
    }

    @OptIn(ExperimentalTestApi::class)
    @Test
    fun tooltipStaysVisibleAfterLongPressRelease() = runComposeUiTest {
        setContent {
            GlassTooltip(text = "保持显示", backdrop = NoopBackdrop, showDelayMillis = 0) {
                Text("锚点")
            }
        }

        onNodeWithText("锚点").performTouchInput { longClick() }
        waitForIdle()

        // 松手后必须仍然可见 —— 按住时手指盖着文字，
        // 松手就消失等于用户读不到提示。
        onNodeWithText("保持显示").assertExists()
    }

    @OptIn(ExperimentalTestApi::class)
    @Test
    fun nextTapDismissesTooltipAndStillClicks() = runComposeUiTest {
        var clicks = 0

        setContent {
            GlassTooltip(text = "提示", backdrop = NoopBackdrop, showDelayMillis = 0) {
                Text("锚点", Modifier.clickable { clicks++ })
            }
        }

        onNodeWithText("锚点").performTouchInput { longClick() }
        waitForIdle()
        onNodeWithText("提示").assertExists()

        // 再点一下：关掉提示，且这次点击照常触发锚点动作
        onNodeWithText("锚点").performTouchInput { click() }
        waitForIdle()

        onNodeWithText("提示").assertDoesNotExist()
        assertEquals(1, clicks, "关闭提示的那次点击被吞掉了")
    }
}
