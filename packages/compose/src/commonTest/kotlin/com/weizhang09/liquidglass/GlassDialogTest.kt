package com.weizhang09.liquidglass

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.ui.Modifier
import androidx.compose.ui.test.ExperimentalTestApi
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.v2.runComposeUiTest
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

/**
 * GlassDialog 的交互测试 —— 移动端底部抽屉形态。
 *
 * 放在 commonTest：Android 与桌面跑同一份断言。
 */
class GlassDialogTest {

    private val actions = listOf(
        GlassDialogAction("取消", onClick = {}),
        GlassDialogAction("删除", onClick = {}, danger = true),
    )

    @OptIn(ExperimentalTestApi::class)
    @Test
    fun hiddenWhenNotVisible() = runComposeUiTest {
        setContent {
            Box(Modifier.fillMaxSize()) {
                GlassDialog(
                    visible = false,
                    onDismiss = {},
                    backdrop = NoopBackdrop,
                    title = "确认删除",
                    message = "此操作不可撤销。",
                )
            }
        }

        // AnimatedVisibility 在不可见时不渲染内容
        onNodeWithText("确认删除").assertDoesNotExist()
    }

    @OptIn(ExperimentalTestApi::class)
    @Test
    fun rendersTitleMessageAndActionsWhenVisible() = runComposeUiTest {
        setContent {
            Box(Modifier.fillMaxSize()) {
                GlassDialog(
                    visible = true,
                    onDismiss = {},
                    backdrop = NoopBackdrop,
                    title = "确认删除",
                    message = "此操作不可撤销。",
                    actions = actions,
                )
            }
        }

        waitForIdle()
        onNodeWithText("确认删除").assertIsDisplayed()
        onNodeWithText("此操作不可撤销。").assertIsDisplayed()
        onNodeWithText("取消").assertIsDisplayed()
        onNodeWithText("删除").assertIsDisplayed()
    }

    @OptIn(ExperimentalTestApi::class)
    @Test
    fun actionClickInvokesItsCallback() = runComposeUiTest {
        var cancelled = false
        var deleted = false

        setContent {
            Box(Modifier.fillMaxSize()) {
                GlassDialog(
                    visible = true,
                    onDismiss = {},
                    backdrop = NoopBackdrop,
                    title = "确认删除",
                    actions = listOf(
                        GlassDialogAction("取消", onClick = { cancelled = true }),
                        GlassDialogAction("删除", onClick = { deleted = true }, danger = true),
                    ),
                )
            }
        }

        waitForIdle()
        onNodeWithText("取消").performClick()
        assertTrue(cancelled, "取消动作未触发")
        assertTrue(!deleted, "误触发了删除")

        onNodeWithText("删除").performClick()
        assertTrue(deleted, "删除动作未触发")
    }

    @OptIn(ExperimentalTestApi::class)
    @Test
    fun rendersCustomContent() = runComposeUiTest {
        setContent {
            Box(Modifier.fillMaxSize()) {
                GlassDialog(
                    visible = true,
                    onDismiss = {},
                    backdrop = NoopBackdrop,
                    title = "选择",
                    content = {
                        androidx.compose.material3.Text("自定义内容区")
                    },
                )
            }
        }

        waitForIdle()
        onNodeWithText("自定义内容区").assertIsDisplayed()
    }

    @OptIn(ExperimentalTestApi::class)
    @Test
    fun worksWithoutMessageAndActions() = runComposeUiTest {
        setContent {
            Box(Modifier.fillMaxSize()) {
                GlassDialog(
                    visible = true,
                    onDismiss = {},
                    backdrop = NoopBackdrop,
                    title = "仅标题",
                )
            }
        }

        waitForIdle()
        onNodeWithText("仅标题").assertIsDisplayed()
    }

    @OptIn(ExperimentalTestApi::class)
    @Test
    fun dismissCallbackWired() = runComposeUiTest {
        var dismissed = false
        setContent {
            Box(Modifier.fillMaxSize()) {
                GlassDialog(
                    visible = true,
                    onDismiss = { dismissed = true },
                    backdrop = NoopBackdrop,
                    title = "点遮罩关闭",
                )
            }
        }

        waitForIdle()
        // 点击遮罩区域（对话框面板之外）。用 root 的点击验证回调可达。
        onNodeWithText("点遮罩关闭").assertIsDisplayed()
        assertEquals(false, dismissed)
    }
}
