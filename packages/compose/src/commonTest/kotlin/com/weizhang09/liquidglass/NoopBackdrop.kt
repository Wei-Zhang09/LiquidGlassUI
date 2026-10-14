package com.weizhang09.liquidglass

import androidx.compose.ui.graphics.GraphicsLayerScope
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.layout.LayoutCoordinates
import androidx.compose.ui.unit.Density
import com.kyant.backdrop.Backdrop

/**
 * 测试用的空实现 Backdrop。
 *
 * 为什么不直接用 `rememberLayerBackdrop()`：
 * backdrop 的 GraphicsLayer 会创建 Skia GPU surface，在无头测试进程中
 * **原生崩溃**（实测退出码 0xC0000005 / 0xC0000409），
 * `skiko.renderApi=SOFTWARE` 也无效。
 *
 * 而组件的交互逻辑（点击、悬停、显示时序）与玻璃渲染无关，
 * 因此用空实现隔离验证；玻璃渲染本身由截图验证。
 */
object NoopBackdrop : Backdrop {
    override val isCoordinatesDependent: Boolean = false

    override fun DrawScope.drawBackdrop(
        density: Density,
        coordinates: LayoutCoordinates?,
        layerBlock: (GraphicsLayerScope.() -> Unit)?,
    ) = Unit
}
