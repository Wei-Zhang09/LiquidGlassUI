package com.weizhang09.liquidglass

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Text
import androidx.compose.ui.Modifier
import androidx.compose.ui.test.ExperimentalTestApi
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performMouseInput
import androidx.compose.ui.test.click
import androidx.compose.ui.test.performTouchInput
import androidx.compose.ui.test.v2.runComposeUiTest
import kotlin.test.Test

/**
 * 平台交互假设的**实证验证**。
 *
 * ADR-0001 主张"组件按平台分化"：桌面用悬停、移动用按压。
 * 本测试用**触摸输入**与**鼠标输入**分别驱动同一批组件，
 * 用实际行为差异验证这个主张，而不是靠口头断言。
 *
 * 结论预期：
 *  - GlassTooltip：鼠标悬停显示；**触摸不显示**（触屏没有 hover）
 *  - GlassSidebar：悬停仅影响底色；**触摸下点击仍可用**（优雅降级）
 *  - GlassMenu：悬停仅影响底色；**触摸下点击开关仍可用**（优雅降级）
 *
 * 这组测试的价值在于：它把"该不该分化"从设计观点变成可验证的事实。
 */
class PlatformInteractionTest {

    // ---------------- GlassTooltip ----------------

    @OptIn(ExperimentalTestApi::class)
    @Test
    fun tooltipShowsOnMouseHover() = runComposeUiTest {
        setContent {
            GlassTooltip(text = "提示内容", backdrop = NoopBackdrop, showDelayMillis = 0) {
                Text("锚点")
            }
        }

        onNodeWithText("锚点").performMouseInput { enter(center) }
        waitUntil(timeoutMillis = 5_000) {
            onAllNodesWithText("提示内容").fetchSemanticsNodes().isNotEmpty()
        }
        onNodeWithText("提示内容").assertExists()
    }

    @OptIn(ExperimentalTestApi::class)
    @Test
    fun tooltipDoesNotShowOnTouchTap() = runComposeUiTest {
        setContent {
            GlassTooltip(text = "提示内容", backdrop = NoopBackdrop, showDelayMillis = 0) {
                Text("锚点")
            }
        }

        // 触摸点击（触屏设备上用户的唯一操作）
        onNodeWithText("锚点").performTouchInput { click() }
        waitForIdle()

        // 触屏没有 hover，提示不会出现 —— 这就是 GlassTooltip 在移动端失效的证据
        onNodeWithText("提示内容").assertDoesNotExist()
    }

    // ---------------- GlassSidebar ----------------

    @OptIn(ExperimentalTestApi::class)
    @Test
    fun sidebarClickStillWorksOnTouch() = runComposeUiTest {
        val selected = mutableListOf<String>()

        setContent {
            GlassSidebar(
                backdrop = NoopBackdrop,
                items = listOf(
                    GlassSidebarItem("home", "概览"),
                    GlassSidebarItem("settings", "设置"),
                ),
                selectedId = "home",
                onSelect = { selected += it },
            )
        }

        // 触摸点击 —— 悬停缺失不影响核心功能
        onNodeWithText("设置").performTouchInput { click() }
        waitForIdle()

        kotlin.test.assertEquals(listOf("settings"), selected)
    }

    // ---------------- GlassMenu ----------------

    @OptIn(ExperimentalTestApi::class)
    @Test
    fun menuOpenCloseStillWorksOnTouch() = runComposeUiTest {
        setContent {
            Box(Modifier.fillMaxSize()) {
                GlassMenu(
                    backdrop = NoopBackdrop,
                    items = listOf(
                        GlassMenuItem("a", "选项A"),
                        GlassMenuItem("b", "选项B"),
                    ),
                ) { _, setOpen ->
                    Text("打开菜单", Modifier.clickable { setOpen(true) })
                }
            }
        }

        // 触摸点击打开
        onNodeWithText("打开菜单").performTouchInput { click() }
        waitUntil(timeoutMillis = 5_000) {
            onAllNodesWithText("选项A").fetchSemanticsNodes().isNotEmpty()
        }
        onNodeWithText("选项A").assertExists()

        // 触摸点击选项 → 关闭
        onNodeWithText("选项A").performTouchInput { click() }
        waitUntil(timeoutMillis = 5_000) {
            onAllNodesWithText("选项A").fetchSemanticsNodes().isEmpty()
        }
        onNodeWithText("选项A").assertDoesNotExist()
    }
}
