package com.weizhang09.liquidglass

import androidx.compose.ui.geometry.Offset
import kotlin.math.abs
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

/**
 * SDF 与融合轮廓的数学测试。
 *
 * 这是纯计算，不涉及渲染 —— 因此可以精确断言数值。
 * 玻璃融合的「假融合」问题就出在数学上，这里必须站得住。
 */
class SdfTest {

    // ---------- 基础距离场 ----------

    @Test
    fun roundedRectCenterIsInside() {
        // 10x10 的矩形，中心到边界距离应为 -5（负=内部）
        val d = sdRoundedRect(0f, 0f, 5f, 5f, 0f)
        assertEquals(-5f, d, 1e-4f)
    }

    @Test
    fun roundedRectOutsideIsPositive() {
        // 距右边界 3 个单位
        val d = sdRoundedRect(8f, 0f, 5f, 5f, 0f)
        assertEquals(3f, d, 1e-4f)
    }

    @Test
    fun roundedRectCornerIsCut() {
        // 圆角把直角顶点削掉了：该点在圆角矩形**外部**（正距离），
        // 而直角矩形的同名顶点恰在边界上（距离 0）。
        val square = sdRoundedRect(5f, 5f, 5f, 5f, 0f)
        val rounded = sdRoundedRect(5f, 5f, 5f, 5f, 5f)
        assertEquals(0f, square, 1e-4f)
        assertTrue(rounded > 0f, "圆角矩形的直角顶点应在外部（实际 $rounded）")
    }

    @Test
    fun radiusIsClampedToHalfShortSide() {
        // 半径超过短边一半会被钳制，避免轮廓自交
        val clamped = sdRoundedRect(0f, 0f, 5f, 2f, 999f)
        val expected = sdRoundedRect(0f, 0f, 5f, 2f, 2f)
        assertEquals(expected, clamped, 1e-4f)
    }

    @Test
    fun shapeDistanceUsesGroupCoordinates() {
        val s = RectShape(x = 10f, y = 10f, width = 20f, height = 20f, radius = 0f)
        // 形状中心在 (20,20)，中心处距离 = -10
        assertEquals(-10f, shapeDistance(s, 20f, 20f), 1e-4f)
    }

    // ---------- 平滑并集 ----------

    @Test
    fun sminWithZeroKEqualsMin() {
        assertEquals(minOf(3f, 7f), sminPoly(3f, 7f, 0f), 1e-6f)
    }

    @Test
    fun sminIsLessThanMinWhenClose() {
        // 融合的核心：smin 结果比 min 更小（距离场被"拉近"，形状看起来融在一起）
        val a = 1f
        val b = 1.5f
        val k = 4f
        val smin = sminPoly(a, b, k)
        assertTrue(smin < minOf(a, b), "smin 应小于 min（$smin 应 < ${minOf(a, b)}）")
    }

    @Test
    fun sminEqualsMinWhenFarApart() {
        // 距离远大于 k 时退化为普通 min
        val a = 0f
        val b = 100f
        val k = 4f
        assertEquals(minOf(a, b), sminPoly(a, b, k), 1e-6f)
    }

    @Test
    fun sminIsSymmetric() {
        val k = 3f
        assertEquals(sminPoly(2f, 5f, k), sminPoly(5f, 2f, k), 1e-6f)
    }

    // ---------- 融合距离场 ----------

    @Test
    fun fusedDistanceEmptyIsInfinite() {
        assertEquals(Float.POSITIVE_INFINITY, fusedDistance(emptyList(), 0f, 0f, 2f))
    }

    @Test
    fun fusedDistanceSingleShapeEqualsThatShape() {
        val s = RectShape(0f, 0f, 10f, 10f, 0f)
        assertEquals(
            shapeDistance(s, 20f, 5f),
            fusedDistance(listOf(s), 20f, 5f, 4f),
            1e-5f,
        )
    }

    @Test
    fun fusionBridgesGapBetweenTwoShapes() {
        // 两个相隔 8px 的方块。融合半径足够大时，
        // 中间点应被判为"更靠内"（距离更小）—— 这就是桥接。
        val left = RectShape(0f, 0f, 20f, 20f, 0f)
        val right = RectShape(28f, 0f, 20f, 20f, 0f)
        val gapX = 24f
        val gapY = 10f

        val noFusion = fusedDistance(listOf(left, right), gapX, gapY, 0f)
        val fused = fusedDistance(listOf(left, right), gapX, gapY, 16f)

        assertTrue(noFusion > 0f, "不融合时中点应在外部（实际 $noFusion）")
        assertTrue(fused < noFusion, "融合应降低中点距离（$fused 应 < $noFusion）")
    }

    @Test
    fun fusionRadiusControlsBridging() {
        val left = RectShape(0f, 0f, 20f, 20f, 0f)
        val right = RectShape(28f, 0f, 20f, 20f, 0f)
        val small = fusedDistance(listOf(left, right), 24f, 10f, 2f)
        val large = fusedDistance(listOf(left, right), 24f, 10f, 20f)
        assertTrue(large < small, "更大的融合半径应桥接得更强（$large 应 < $small）")
    }

    @Test
    fun fusedGradientPointsOutward() {
        val s = RectShape(0f, 0f, 20f, 20f, 0f)
        // 形状右侧外部的梯度应指向 +x（向外）
        val g = fusedGradient(listOf(s), 30f, 10f, 0f)
        assertTrue(g.x > 0f, "右侧外部梯度 x 应为正（实际 ${g.x}）")
        assertTrue(abs(g.y) < abs(g.x), "正右方的梯度应以 x 为主")
    }

    @Test
    fun normalizeHandlesZeroVector() {
        val n = normalizeOffset(Offset.Zero)
        assertEquals(Offset.Zero, n)
        assertTrue(!n.x.isNaN() && !n.y.isNaN(), "零向量归一化不应产生 NaN")
    }

    @Test
    fun normalizeProducesUnitLength() {
        val n = normalizeOffset(Offset(3f, 4f))
        assertEquals(1f, kotlin.math.hypot(n.x, n.y), 1e-5f)
    }

    // ---------- 融合轮廓提取 ----------

    @Test
    fun contourOfSingleSquareIsRoughlyItsPerimeter() {
        val s = RectShape(0f, 0f, 40f, 40f, 0f)
        val contour = fusedContour(listOf(s), smoothing = 0f, step = 1f)

        assertTrue(contour.size > 40, "轮廓点太少（${contour.size}）—— 提取可能失败")

        // 所有点应落在零线附近（|距离| 很小）
        val maxDev = contour.maxOf { abs(fusedDistance(listOf(s), it.x, it.y, 0f)) }
        assertTrue(maxDev < 1.5f, "轮廓点偏离零线过大（$maxDev）")

        // 轮廓应包围形状中心：x 与 y 的范围接近 0..40
        // （网格在边界外侧半格处采样，因此容差取 2 个 step）
        val xs = contour.map { it.x }
        val ys = contour.map { it.y }
        assertTrue(xs.min() < 2f && xs.max() > 38f, "x 范围不对：${xs.min()}..${xs.max()}")
        assertTrue(ys.min() < 2f && ys.max() > 38f, "y 范围不对：${ys.min()}..${ys.max()}")
    }

    @Test
    fun contourOfFusedPairBulgesIntoTheGap() {
        // 这是「真融合」的判据：两个相邻方块融合后，
        // 轮廓应伸进中间的缝隙（而不是各自保持矩形、留下一个缺口）。
        val left = RectShape(0f, 0f, 20f, 20f, 0f)
        val right = RectShape(28f, 0f, 20f, 20f, 0f)

        val separate = fusedContour(listOf(left), smoothing = 0f, step = 1f)
        val fused = fusedContour(listOf(left, right), smoothing = 18f, step = 1f)

        assertTrue(fused.isNotEmpty(), "融合轮廓为空")

        // 融合轮廓里，缝隙中点附近应有轮廓点（说明桥接发生了）
        val gapX = 24f
        val nearGap = fused.count { abs(it.x - gapX) < 3f }
        assertTrue(nearGap > 0, "融合轮廓未伸入缝隙 —— 可能是假融合（缝隙附近点数 $nearGap）")

        // 单块轮廓不会到缝隙那里
        val separateNearGap = separate.count { abs(it.x - gapX) < 3f }
        assertTrue(separateNearGap == 0, "单块轮廓不该到缝隙（$separateNearGap）")
    }

    @Test
    fun contourIsClosedLoop() {
        val s = RectShape(0f, 0f, 30f, 30f, 4f)
        val contour = fusedContour(listOf(s), smoothing = 0f, step = 1f)
        assertTrue(contour.size > 8, "轮廓点太少")

        // 相邻点的间距不应有巨大跳变（说明点是连续串起来的，不是散点）
        var maxJump = 0f
        for (i in contour.indices) {
            val a = contour[i]
            val b = contour[(i + 1) % contour.size]
            maxJump = maxOf(maxJump, distance(a, b))
        }
        assertTrue(maxJump < 6f, "轮廓有断裂（最大跳变 $maxJump）—— 串环失败")
    }

    @Test
    fun contourEmptyForNoShapes() {
        assertTrue(fusedContour(emptyList(), 4f).isEmpty())
    }

    @Test
    fun contourRespectsStepSize() {
        val s = RectShape(0f, 0f, 40f, 40f, 0f)
        val fine = fusedContour(listOf(s), 0f, step = 1f)
        val coarse = fusedContour(listOf(s), 0f, step = 4f)
        assertTrue(fine.size > coarse.size, "更细的步长应给出更多点（${fine.size} vs ${coarse.size}）")
    }

    @Test
    fun contourPointsAreFinite() {
        val shapes = listOf(
            RectShape(0f, 0f, 20f, 20f, 6f),
            RectShape(24f, 4f, 16f, 16f, 4f),
        )
        val contour = fusedContour(shapes, smoothing = 10f, step = 2f)
        assertTrue(contour.isNotEmpty())
        assertTrue(
            contour.all { it.x.isFinite() && it.y.isFinite() },
            "轮廓包含非有限坐标",
        )
    }

    // ---------- 路径平滑 ----------

    @Test
    fun contourToPathPointsShiftsToMidpoints() {
        val contour = listOf(
            Offset(0f, 0f), Offset(10f, 0f), Offset(10f, 10f), Offset(0f, 10f),
        )
        val mid = contourToPathPoints(contour)
        assertEquals(contour.size, mid.size)
        // 第一个中点应是 (0,0) 与 (10,0) 的中点
        assertEquals(5f, mid[0].x, 1e-4f)
        assertEquals(0f, mid[0].y, 1e-4f)
    }

    @Test
    fun contourToPathPointsPassesThroughTinyInput() {
        val tiny = listOf(Offset(1f, 2f), Offset(3f, 4f))
        assertEquals(tiny, contourToPathPoints(tiny))
    }
}
