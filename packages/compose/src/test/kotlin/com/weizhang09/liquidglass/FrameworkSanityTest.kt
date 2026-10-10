package com.weizhang09.liquidglass

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Text
import androidx.compose.ui.Modifier
import androidx.compose.ui.test.ExperimentalTestApi
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.runComposeUiTest
import kotlin.test.Test
import kotlin.test.assertEquals

/**
 * 隔离测试：确认 Compose UI 测试框架本身在本机可用，
 * 从而判定 GlassSidebarTest 的崩溃是否由 backdrop 的 GraphicsLayer 引起。
 *
 * 本测试不含任何 backdrop / 玻璃，只用基础 Compose 组件。
 */
class FrameworkSanityTest {

    @OptIn(ExperimentalTestApi::class)
    @Test
    fun plainComposeClickWorks() = runComposeUiTest {
        var clicked = false
        setContent {
            Box(Modifier.fillMaxSize()) {
                Text("点我", Modifier.clickable { clicked = true })
            }
        }
        onNodeWithText("点我").assertIsDisplayed()
        onNodeWithText("点我").performClick()
        assertEquals(true, clicked)
    }
}
