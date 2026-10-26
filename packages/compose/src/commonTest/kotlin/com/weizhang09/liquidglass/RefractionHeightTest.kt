package com.weizhang09.liquidglass

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

/**
 * 折射带缩放规则的测试。
 *
 * 为什么必须测这个：这个值算错**不会报错**，只会让玻璃「看起来有点脏」——
 * 文字周围出现一圈灰色底。它是最容易被忽略、也最容易被回归掉的一处。
 *
 * 场景来自真实事故：token 固定 12dp 折射高度，用在 44dp 高的按钮上，
 * 折射带占元素高度 27%，直接盖到居中文字上。
 */
class RefractionHeightTest {

    /** 3x 密度下的换算：44dp = 132px，12dp = 36px，10dp = 30px */
    private val d3 = 3f
    private fun px(dp: Float) = dp * d3

    private fun h(widthDp: Float, heightDp: Float): Float =
        scaledRefractionHeight(
            widthPx = px(widthDp),
            heightPx = px(heightDp),
            tokenHeightPx = px(12f),
            hardCapPx = px(MAX_BEZEL_HARD_CAP_DP),
        )

    @Test
    fun smallPillGetsProportionalBand() {
        // 44dp 高按钮：短边 44dp × 8% = 3.52dp
        val h = h(widthDp = 64f, heightDp = 44f)
        assertEquals(px(3.52f), h, 1e-3f)
        // 关键断言：绝不可能是 token 的 12dp
        assertTrue(h < px(12f), "44dp 元素不应拿到 12dp 的折射带")
    }

    @Test
    fun bandNeverExceedsEightPercentOfShortSide() {
        // 一排尺寸，逐一验证不超过短边的 8%
        val sizes = listOf(32f, 44f, 56f, 64f, 80f, 120f, 200f, 400f)
        for (side in sizes) {
            val band = h(widthDp = side * 2f, heightDp = side)
            val ratio = band / px(side)
            assertTrue(
                ratio <= MAX_BEZEL_RATIO + 1e-4f,
                "${side}dp 元素的折射带占比 ${ratio} 超过 ${MAX_BEZEL_RATIO}",
            )
        }
    }

    @Test
    fun hardCapAppliesOnLargePanels() {
        // 300×200 面板：短边 200dp × 8% = 16dp，但硬上限 10dp 先生效
        val band = h(widthDp = 300f, heightDp = 200f)
        assertEquals(px(MAX_BEZEL_HARD_CAP_DP), band, 1e-3f)
    }

    @Test
    fun tokenIsTheCeilingNotTheFloor() {
        // 元素足够大时，带 = min(token, 8%, cap)；token 比上限小就取 token
        val band = scaledRefractionHeight(
            widthPx = 2000f,
            heightPx = 2000f,
            tokenHeightPx = 6f,      // 故意给一个很小的 token
            hardCapPx = 100f,
        )
        assertEquals(6f, band, 1e-4f)
    }

    @Test
    fun degenerateSizeReturnsZero() {
        assertEquals(0f, h(widthDp = 0f, heightDp = 44f))
        assertEquals(0f, h(widthDp = 64f, heightDp = 0f))
        // 负数不应抛异常，也不应返回负值
        assertEquals(0f, h(widthDp = -10f, heightDp = -10f))
    }

    @Test
    fun monotonicallyNonDecreasingWithSize() {
        // 元素越大，带不应变小 —— 否则观感会随尺寸跳变
        var prev = 0f
        for (side in listOf(20f, 30f, 44f, 60f, 80f, 120f, 160f, 220f, 300f)) {
            val band = h(widthDp = side * 1.5f, heightDp = side)
            assertTrue(band >= prev - 1e-4f, "${side}dp 处的带 ${band} 小于更小尺寸的 ${prev}")
            prev = band
        }
    }

    @Test
    fun shortSideGovernsNotLongSide() {
        // 细长条：短边决定带，长边不参与
        val tall = h(widthDp = 40f, heightDp = 400f)
        val square = h(widthDp = 40f, heightDp = 40f)
        assertEquals(square, tall, 1e-4f)
    }

    /**
     * 核心要求：**折射带不能伸到文字上**。
     *
     * 这不是审美判断，可以算出来：
     *   lens() 的 shader 里 `if (-sd >= refractionHeight) return content.eval(coord)`
     *   —— 超出折射带的像素原样返回，不会被折射。
     * 所以只要「文字到最近边缘的距离 > 折射带高度」，文字就不可能被染色。
     *
     * 文字垂直居中、行高 [lineHeightDp] 时，文字上边缘到元素上边缘的距离是
     * `(height - lineHeight) / 2`。短边通常是高度（按钮、药丸），所以用它算。
     *
     * 这条测试锁住的是**事故本身**：固定 12dp 的带在 44dp 高按钮上，
     * 12 > 10，文字落在带内 → 背景色被折射进文字区 → 用户看到「灰色底」。
     */
    @Test
    fun bandNeverReachesCentredText() {
        val lineHeightDp = 24f   // Compose 默认 body 行高量级
        val heights = listOf(44f, 48f, 56f, 64f, 80f, 120f, 200f, 320f)
        for (height in heights) {
            val band = h(widthDp = height * 2f, heightDp = height)
            val textEdgeDistance = px((height - lineHeightDp) / 2f)
            assertTrue(
                band < textEdgeDistance,
                "${height}dp 元素：折射带 ${band / d3}dp 伸进了文字区" +
                    "（文字边缘距边 ${textEdgeDistance / d3}dp）",
            )
        }
    }

    /** 反证：旧的固定 12dp 在 44dp 按钮上确实会压到文字。 */
    @Test
    fun fixedTokenBandWouldHaveReachedText() {
        val heightDp = 44f
        val lineHeightDp = 24f
        val oldBandPx = px(12f)                                   // 修复前的行为
        val textEdgeDistance = px((heightDp - lineHeightDp) / 2f)  // 10dp
        assertTrue(
            oldBandPx > textEdgeDistance,
            "这个反证的前提不成立：固定 12dp 并未越过文字边缘",
        )
        // 新规则必须把它压到文字边缘以内
        assertTrue(h(widthDp = 64f, heightDp = heightDp) < textEdgeDistance)
    }
}
