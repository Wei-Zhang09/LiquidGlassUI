package com.weizhang09.liquidglass

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.size
import androidx.compose.ui.unit.dp
import androidx.compose.material3.Text
import androidx.compose.ui.Modifier
import androidx.compose.ui.test.ExperimentalTestApi
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.v2.runComposeUiTest
import kotlin.test.Test
import kotlin.test.assertEquals

/**
 * GlassMenu 的交互测试。
 *
 * 使用共享的 NoopBackdrop（见 NoopBackdrop.kt）：backdrop 的 GraphicsLayer
 * 在无头测试进程中原生崩溃，而菜单的开关逻辑与玻璃渲染无关。
 *
 * 注意 v2 测试 API 的 `StandardTestDispatcher` 会排队协程而非立即执行，
 * `waitForIdle()` 不推进它；异步状态变化需用 `waitUntil` 轮询等待。
 */
class GlassMenuTest {

    private val items = listOf(
        GlassMenuItem("rename", "重命名", shortcut = "F2"),
        GlassMenuItem("duplicate", "创建副本"),
        GlassMenuItem("divider", "", isDivider = true),
        GlassMenuItem("delete", "删除", danger = true),
    )

    @OptIn(ExperimentalTestApi::class)
    @Test
    fun menuClosedInitially() = runComposeUiTest {
        setContent { MenuHost(items) { setOpen -> setOpen(true) } }

        onNodeWithText("操作").assertExists()
        onNodeWithText("重命名").assertDoesNotExist()
    }

    @OptIn(ExperimentalTestApi::class)
    @Test
    fun menuOpensAndShowsAllItems() = runComposeUiTest {
        setContent { MenuHost(items) { setOpen -> setOpen(true) } }

        onNodeWithText("操作").performClick()
        waitUntil(timeoutMillis = 5_000) {
            onAllNodesWithText("重命名").fetchSemanticsNodes().isNotEmpty()
        }

        onNodeWithText("重命名").assertExists()
        onNodeWithText("创建副本").assertExists()
        onNodeWithText("删除").assertExists()
        // 分隔线不渲染文字
        onNodeWithText("F2").assertExists()
    }

    @OptIn(ExperimentalTestApi::class)
    @Test
    fun selectingItemClosesMenu() = runComposeUiTest {
        setContent { MenuHost(items) { setOpen -> setOpen(true) } }

        onNodeWithText("操作").performClick()
        waitUntil(timeoutMillis = 5_000) {
            onAllNodesWithText("重命名").fetchSemanticsNodes().isNotEmpty()
        }

        onNodeWithText("重命名").performClick()
        waitUntil(timeoutMillis = 5_000) {
            onAllNodesWithText("重命名").fetchSemanticsNodes().isEmpty()
        }

        onNodeWithText("重命名").assertDoesNotExist()
    }

    @OptIn(ExperimentalTestApi::class)
    @Test
    fun disabledItemDoesNotCloseMenu() = runComposeUiTest {
        val disabledItems = listOf(
            GlassMenuItem("a", "可用项"),
            GlassMenuItem("b", "禁用项", enabled = false),
        )
        setContent { MenuHost(disabledItems) { setOpen -> setOpen(true) } }

        onNodeWithText("操作").performClick()
        waitUntil(timeoutMillis = 5_000) {
            onAllNodesWithText("禁用项").fetchSemanticsNodes().isNotEmpty()
        }

        onNodeWithText("禁用项").performClick()
        // 禁用项点击无效，菜单应仍开着
        onNodeWithText("禁用项").assertExists()
    }

    @OptIn(ExperimentalTestApi::class)
    @Test
    fun anchorReceivesOpenState() = runComposeUiTest {
        val states = mutableListOf<Boolean>()
        setContent {
            Box(Modifier.size(600.dp, 600.dp)) {
                GlassMenu(backdrop = NoopBackdrop, items = items) { open, setOpen ->
                    states += open
                    Text("操作", Modifier.clickable { setOpen(!open) })
                }
            }
        }

        // 初始为关闭
        assertEquals(false, states.last())

        onNodeWithText("操作").performClick()
        waitUntil(timeoutMillis = 5_000) { states.last() }

        // 点击后锚点应收到 open = true
        assertEquals(true, states.last())
    }
}

/**
 * 测试宿主：给菜单一个足够大的根容器。
 *
 * 必需的原因：菜单用 `offset` 绘制在锚点布局边界**之外**。
 * 若根容器太小，菜单项会落在 Compose root 边界外，
 * performClick 会报 "Cannot start a mouse gesture outside the Compose root bounds"。
 * 这也对应真实使用约束：锚点容器要留出足够空间容纳菜单。
 */
@androidx.compose.runtime.Composable
private fun MenuHost(
    items: List<GlassMenuItem>,
    onOpen: ((Boolean) -> Unit) -> Unit,
) {
    Box(Modifier.size(600.dp, 600.dp)) {
        GlassMenu(backdrop = NoopBackdrop, items = items) { _, setOpen ->
            Text("操作", Modifier.clickable { onOpen(setOpen) })
        }
    }
}
