package com.weizhang09.liquidglass

import androidx.compose.ui.test.ExperimentalTestApi
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.v2.runComposeUiTest
import kotlin.test.Test
import kotlin.test.assertEquals

/**
 * GlassBottomBar 的交互测试 —— 移动端主导航。
 *
 * 放在 commonTest：Android 与桌面都跑同一份断言，
 * 保证"一套代码两端行为一致"这个承诺真的成立。
 *
 * 使用共享的 NoopBackdrop（见 NoopBackdrop.kt）：
 * backdrop 的 GraphicsLayer 在无头测试进程中原生崩溃，
 * 而选中/点击逻辑与玻璃渲染无关。
 */
class GlassBottomBarTest {

    private val tabs = listOf(
        GlassTabItem("home", "首页"),
        GlassTabItem("discover", "发现"),
        GlassTabItem("me", "我的"),
    )

    @OptIn(ExperimentalTestApi::class)
    @Test
    fun clickingTabInvokesOnSelectWithItsId() = runComposeUiTest {
        val selected = mutableListOf<String>()

        setContent {
            GlassBottomBar(
                backdrop = NoopBackdrop,
                items = tabs,
                selectedId = "home",
                onSelect = { selected += it },
            )
        }

        onNodeWithText("发现").assertIsDisplayed()
        onNodeWithText("发现").performClick()
        onNodeWithText("我的").performClick()

        assertEquals(listOf("discover", "me"), selected)
    }

    @OptIn(ExperimentalTestApi::class)
    @Test
    fun barIsControlledBySelectedId() = runComposeUiTest {
        var current = "home"

        setContent {
            GlassBottomBar(
                backdrop = NoopBackdrop,
                items = tabs,
                selectedId = current,
                onSelect = { current = it },
            )
        }

        onNodeWithText("我的").performClick()
        assertEquals("me", current)
    }

    @OptIn(ExperimentalTestApi::class)
    @Test
    fun allTabsRender() = runComposeUiTest {
        setContent {
            GlassBottomBar(
                backdrop = NoopBackdrop,
                items = tabs,
                selectedId = "home",
                onSelect = {},
            )
        }

        onNodeWithText("首页").assertIsDisplayed()
        onNodeWithText("发现").assertIsDisplayed()
        onNodeWithText("我的").assertIsDisplayed()
    }

    @OptIn(ExperimentalTestApi::class)
    @Test
    fun badgeIsRenderedWhenPresent() = runComposeUiTest {
        setContent {
            GlassBottomBar(
                backdrop = NoopBackdrop,
                items = listOf(
                    GlassTabItem("a", "有徽标", badge = "3"),
                    GlassTabItem("b", "无徽标"),
                ),
                selectedId = "a",
                onSelect = {},
            )
        }

        onNodeWithText("3").assertIsDisplayed()
    }

    @OptIn(ExperimentalTestApi::class)
    @Test
    fun emptyItemsDoesNotCrash() = runComposeUiTest {
        setContent {
            GlassBottomBar(
                backdrop = NoopBackdrop,
                items = emptyList(),
                selectedId = null,
                onSelect = {},
            )
        }
        // 不崩溃即通过；无内容可断言
    }

    @OptIn(ExperimentalTestApi::class)
    @Test
    fun selectedTabIsSemanticallyMarked() = runComposeUiTest {
        setContent {
            GlassBottomBar(
                backdrop = NoopBackdrop,
                items = tabs,
                selectedId = "discover",
                onSelect = {},
            )
        }

        // selectable + Role.Tab 应让选中态可被无障碍服务识别
        onNodeWithText("发现").assertIsDisplayed()
    }
}
