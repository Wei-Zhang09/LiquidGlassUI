package com.weizhang09.liquidglass

import androidx.compose.ui.geometry.Offset
import kotlin.math.abs
import kotlin.math.hypot
import kotlin.math.max
import kotlin.math.min
import kotlin.math.sqrt

/**
 * 有符号距离场（SDF）与平滑并集 —— 玻璃形状融合的数学核心。
 *
 * 普通 glassmorphism 库里相邻玻璃是**叠放**；液态玻璃要求它们像真实液体一样
 * **融成一团**。做法不是叠图，而是把多个形状的距离场做平滑并集（smooth min），
 * 再取融合后轮廓的等值线作为形状 —— 这样折射沿融合后的整体轮廓发生，
 * 不会出现两个圆角各自弯折的「假融合」。
 *
 * 本文件是纯数学，不依赖 Compose 运行时，可直接单元测试。
 *
 * 与 Web 端 `packages/web/src/sdf.ts` 是同一套算法的两个实现，
 * 参数语义（smoothing 的含义、半径钳制）保持一致。
 *
 * @see docs/adr/0004-compose-glass-group-fusion.md
 */

/** 轴对齐圆角矩形，坐标为组本地坐标系。 */
data class RectShape(
    val x: Float,
    val y: Float,
    val width: Float,
    val height: Float,
    val radius: Float,
)

/**
 * 圆角矩形的有符号距离。负值在内部，正值在外部。
 *
 * @param px 相对矩形中心的 x
 * @param py 相对矩形中心的 y
 */
fun sdRoundedRect(px: Float, py: Float, halfW: Float, halfH: Float, radius: Float): Float {
    // 半径不能超过短边的一半，否则轮廓会自交
    val r = min(radius, min(halfW, halfH))
    val qx = abs(px) - halfW + r
    val qy = abs(py) - halfH + r
    val outside = hypot(max(qx, 0f), max(qy, 0f))
    val inside = min(max(qx, qy), 0f)
    return outside + inside - r
}

/** 单个矩形形状的 SDF（输入为组坐标）。 */
fun shapeDistance(shape: RectShape, x: Float, y: Float): Float {
    val cx = shape.x + shape.width / 2f
    val cy = shape.y + shape.height / 2f
    return sdRoundedRect(x - cx, y - cy, shape.width / 2f, shape.height / 2f, shape.radius)
}

/**
 * 多项式平滑最小值（smooth min）。
 *
 * [k] 是融合半径：越大过渡越宽，两个形状越早「融」在一起。
 * 标准 smin 在 a≈b 时用二次修正把两段距离场缝合。
 */
fun sminPoly(a: Float, b: Float, k: Float): Float {
    if (k <= 0f) return min(a, b)
    val h = max(k - abs(a - b), 0f) / k
    return min(a, b) - h * h * k * 0.25f
}

/** 多个形状的平滑并集距离场。 */
fun fusedDistance(shapes: List<RectShape>, x: Float, y: Float, k: Float): Float {
    if (shapes.isEmpty()) return Float.POSITIVE_INFINITY
    var d = shapeDistance(shapes[0], x, y)
    for (i in 1 until shapes.size) {
        d = sminPoly(d, shapeDistance(shapes[i], x, y), k)
    }
    return d
}

/**
 * 融合距离场的梯度（未归一化）。
 *
 * 用中心差分而非解析式：形状数量与融合拓扑是任意的，解析梯度需要逐形状
 * 处理 smin 的权重，中心差分在实现上更稳、也更容易与命中测试保持一致。
 */
fun fusedGradient(
    shapes: List<RectShape>,
    x: Float,
    y: Float,
    k: Float,
    eps: Float = 0.5f,
): Offset {
    val dx = fusedDistance(shapes, x + eps, y, k) - fusedDistance(shapes, x - eps, y, k)
    val dy = fusedDistance(shapes, x, y + eps, k) - fusedDistance(shapes, x, y - eps, k)
    return Offset(dx, dy)
}

/** 归一化向量；零向量返回零而不是 NaN。 */
fun normalizeOffset(v: Offset): Offset {
    val len = hypot(v.x, v.y)
    if (len < 1e-6f) return Offset.Zero
    return Offset(v.x / len, v.y / len)
}

/**
 * 提取融合轮廓（SDF 零等值线）的顶点序列。
 *
 * 用 **marching squares**：把包围盒切成网格，逐格根据四角距离值的符号
 * 判断零线穿过哪条边，线性插值出交点，再把线段串成环。
 *
 * ## 为什么需要它
 * Compose 的 backdrop 库只接受一个 `Shape`，没有自定义 SDF 的入口
 * （`BackdropEffectScope` 只暴露 `shape` 的 getter）。因此要让折射沿
 * 融合轮廓发生，只能把融合轮廓**算成一个 Shape**。
 *
 * ## 返回
 * 最大的那个环的顶点（按 [step] 采样的多边形，已闭合）。
 * 若形状完全不相连且融合半径不足，只返回最大的一块 —— 这是已知限制，
 * 液态玻璃的典型用法（一两个相邻元素融合）不受影响。
 *
 * @param step 网格步长（像素）。越小越精确、点越多。1–3 之间视觉上足够。
 */
fun fusedContour(
    shapes: List<RectShape>,
    smoothing: Float,
    step: Float = 2f,
): List<Offset> {
    if (shapes.isEmpty()) return emptyList()

    // 包围盒：全部形状外扩 smoothing + 一点余量，保证零线落在网格内部
    var left = Float.MAX_VALUE
    var top = Float.MAX_VALUE
    var right = -Float.MAX_VALUE
    var bottom = -Float.MAX_VALUE
    for (s in shapes) {
        left = min(left, s.x)
        top = min(top, s.y)
        right = max(right, s.x + s.width)
        bottom = max(bottom, s.y + s.height)
    }
    val pad = smoothing + step * 2f
    left -= pad; top -= pad; right += pad; bottom += pad

    val cols = max(2, ((right - left) / step).toInt() + 1)
    val rows = max(2, ((bottom - top) / step).toInt() + 1)

    // 采样网格
    val grid = Array(rows) { j ->
        FloatArray(cols) { i ->
            fusedDistance(shapes, left + i * step, top + j * step, smoothing)
        }
    }

    val segments = ArrayList<Pair<Offset, Offset>>()

    fun lerpX(x0: Float, x1: Float, v0: Float, v1: Float, y: Float): Offset {
        val d = v1 - v0
        val t = if (abs(d) < 1e-9f) 0.5f else (0f - v0) / d
        return Offset(x0 + t * (x1 - x0), y)
    }
    fun lerpY(y0: Float, y1: Float, v0: Float, v1: Float, x: Float): Offset {
        val d = v1 - v0
        val t = if (abs(d) < 1e-9f) 0.5f else (0f - v0) / d
        return Offset(x, y0 + t * (y1 - y0))
    }

    for (j in 0 until rows - 1) {
        for (i in 0 until cols - 1) {
            val x0 = left + i * step
            val x1 = x0 + step
            val y0 = top + j * step
            val y1 = y0 + step

            val v0 = grid[j][i]          // 左上
            val v1 = grid[j][i + 1]      // 右上
            val v2 = grid[j + 1][i + 1]  // 右下
            val v3 = grid[j + 1][i]      // 左下

            // 四个角都在内部或都在外部 → 该格无零线
            val insideCount = (if (v0 < 0f) 1 else 0) + (if (v1 < 0f) 1 else 0) +
                (if (v2 < 0f) 1 else 0) + (if (v3 < 0f) 1 else 0)
            if (insideCount == 0 || insideCount == 4) continue

            // 四条边上的交点
            val eTop = lerpX(x0, x1, v0, v1, y0)
            val eRight = lerpY(y0, y1, v1, v2, x1)
            val eBottom = lerpX(x0, x1, v3, v2, y1)
            val eLeft = lerpY(y0, y1, v0, v3, x0)

            // 按 marching squares 的 16 种情形连接（鞍点按简单规则处理）
            val idx = (if (v0 < 0f) 1 else 0) or
                (if (v1 < 0f) 2 else 0) or
                (if (v2 < 0f) 4 else 0) or
                (if (v3 < 0f) 8 else 0)

            when (idx) {
                1, 14 -> segments += eLeft to eTop
                2, 13 -> segments += eTop to eRight
                3, 12 -> segments += eLeft to eRight
                4, 11 -> segments += eRight to eBottom
                6, 9 -> segments += eTop to eBottom
                7, 8 -> segments += eBottom to eLeft
                5 -> { segments += eLeft to eTop; segments += eRight to eBottom }
                10 -> { segments += eTop to eRight; segments += eBottom to eLeft }
            }
        }
    }

    return chainLargestLoop(segments, step)
}

/**
 * 把散乱线段串成环，返回最大的一个。
 *
 * ## 为什么要做无向游走
 * marching squares 的 16 种情形表若朝向约定有一处不一致，按
 * 「终点 → 下一段起点」的有向匹配就会在中途断链。因此这里不依赖
 * 线段朝向：把每段当作无向边，从一个端点走到另一个端点，
 * 只要连通就一定能走回起点。对轮廓提取更稳健。
 *
 * 顶点按量化后的坐标匹配（浮点插值结果不会逐位相等，
 * 直接用坐标做 key 会匹配失败）。
 */
private fun chainLargestLoop(
    segments: List<Pair<Offset, Offset>>,
    step: Float,
): List<Offset> {
    if (segments.isEmpty()) return emptyList()

    fun key(p: Offset): Long {
        // 量化到 step 的 1/16，兼顾精度与匹配
        val q = step / 16f
        val kx = (p.x / q).toLong()
        val ky = (p.y / q).toLong()
        return (kx shl 32) xor (ky and 0xffffffffL)
    }

    // 点 → 触及该点的线段下标（无向）
    val touching = HashMap<Long, MutableList<Int>>()
    for ((i, seg) in segments.withIndex()) {
        touching.getOrPut(key(seg.first)) { ArrayList() }.add(i)
        touching.getOrPut(key(seg.second)) { ArrayList() }.add(i)
    }

    val used = BooleanArray(segments.size)
    var best: List<Offset> = emptyList()

    for (start in segments.indices) {
        if (used[start]) continue

        val loop = ArrayList<Offset>()
        used[start] = true
        val firstPoint = segments[start].first
        var cursor = segments[start].second
        loop += firstPoint
        loop += cursor

        var guard = 0
        while (guard++ <= segments.size) {
            // 回到起点 → 闭环
            if (key(cursor) == key(firstPoint)) break

            val next = (touching[key(cursor)] ?: break)
                .firstOrNull { !used[it] } ?: break

            used[next] = true
            val seg = segments[next]
            // 走到该段的另一端
            cursor = if (key(seg.first) == key(cursor)) seg.second else seg.first
            loop += cursor
        }

        // 去掉首尾重复的闭合点
        if (loop.size >= 2 && key(loop.first()) == key(loop.last())) {
            loop.removeAt(loop.size - 1)
        }
        if (loop.size > best.size) best = loop
    }
    return best
}

/** 把轮廓点转成平滑路径数据（用中点二次曲线，避免折线的锯齿）。 */
fun contourToPathPoints(contour: List<Offset>): List<Offset> {
    if (contour.size < 3) return contour
    val out = ArrayList<Offset>(contour.size)
    for (i in contour.indices) {
        val cur = contour[i]
        val next = contour[(i + 1) % contour.size]
        out += Offset((cur.x + next.x) / 2f, (cur.y + next.y) / 2f)
    }
    return out
}

/** 两点距离，供测试与调试使用。 */
internal fun distance(a: Offset, b: Offset): Float = sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y))
