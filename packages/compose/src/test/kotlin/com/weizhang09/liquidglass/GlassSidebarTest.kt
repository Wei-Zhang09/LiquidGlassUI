package com.weizhang09.liquidglass

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Text
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.GraphicsLayerScope
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.layout.LayoutCoordinates
import androidx.compose.ui.test.ExperimentalTestApi
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.runComposeUiTest
import androidx.compose.ui.unit.Density
import com.kyant.backdrop.Backdrop
import kotlin.test.Test
import kotlin.test.assertEquals

/**
 * GlassSidebar 的交互测试。
 *
 * 为什么用假 Backdrop 而不是 rememberLayerBackdrop()：
 * backdrop 的 GraphicsLayer 会创建 Skia GPU surface，在无头测试进程中
 * 原生崩溃（实测退出码 0xC0000005 / 0xC0000409）。
 * 而组件的点击/选中逻辑与玻璃渲染无关，用空实现的 Backdrop 即可隔离验证。
 *
 * 玻璃渲染本身由截图验证（tools/capture-sidebar.py + verify-compose.py）。
 */
private object NoopBackdrop : Backdrop {
    override val isCoordinatesDependent: Boolean = false
    override fun DrawScope.drawBackdrop(
        density: Density,
        coordinates: LayoutCoordinates?,
        layerBlock: (GraphicsLayerScope.() -> Unit)?,
    ) {
        // 测试用：不绘制任何内容
    }
}

class GlassSidebarTest {

    private val items = listOf(
        GlassSidebarItem("home", "概览"),
        GlassSidebarItem("components", "组件"),
        GlassSidebarItem("settings", "设置"),
    )

    @OptIn(ExperimentalTestApi::class)
    @Test
    fun clickingItemInvokesOnSelectWithItsId() = runComposeUiTest {
        val selected = mutableListOf<String>()

        setContent {
            GlassSidebar(
                backdrop = NoopBackdrop,
                items = items,
                selectedId = "home",
                onSelect = { selected += it },
            )
        }

        onNodeWithText("组件").assertIsDisplayed()
        onNodeWithText("组件").performClick()
        onNodeWithText("设置").performClick()

        assertEquals(listOf("components", "settings"), selected)
    }

    @OptIn(ExperimentalTestApi::class)
    @Test
    fun sidebarIsControlledBySelectedId() = runComposeUiTest {
        var current = "home"

        setContent {
            GlassSidebar(
                backdrop = NoopBackdrop,
                items = items,
                selectedId = current,
                onSelect = { current = it },
            )
        }

        onNodeWithText("设置").performClick()
        assertEquals("settings", current)
    }

    @OptIn(ExperimentalTestApi::class)
    @Test
    fun rendersHeaderAndAllItems() = runComposeUiTest {
        setContent {
            GlassSidebar(
                backdrop = NoopBackdrop,
                items = items,
                selectedId = "home",
                onSelect = {},
                header = { Text("LiquidGlassUI") },
                footer = { Text("v0.1.0") },
            )
        }

        onNodeWithText("LiquidGlassUI").assertIsDisplayed()
        onNodeWithText("概览").assertIsDisplayed()
        onNodeWithText("组件").assertIsDisplayed()
        onNodeWithText("设置").assertIsDisplayed()
        onNodeWithText("v0.1.0").assertIsDisplayed()
    }

    @OptIn(ExperimentalTestApi::class)
    @Test
    fun badgeIsRenderedWhenPresent() = runComposeUiTest {
        setContent {
            GlassSidebar(
                backdrop = NoopBackdrop,
                items = listOf(
                    GlassSidebarItem("a", "有徽标", badge = "10"),
                    GlassSidebarItem("b", "无徽标"),
                ),
                selectedId = null,
                onSelect = {},
            )
        }

        onNodeWithText("10").assertIsDisplayed()
    }
}
