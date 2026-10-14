package com.weizhang09.liquidglass

import kotlin.test.Test
import kotlin.test.assertTrue

/**
 * 融合着色器的**真实编译测试**。
 *
 * 为什么需要它：着色器编译失败时 Skia 会静默返回 null，组件退化成普通矩形
 * 而**不抛任何异常** —— 光看截图只能发现"效果不对"，看不出原因。
 * 这个测试直接把 AGSL 交给 Skia 编译，把真实错误逼出来。
 *
 * 同时校验 uniform 数组长度与着色器声明一致（对不上会导致 uniform 设置失败）。
 */
class FusedShaderTest {

    @Test
    fun shaderCompiles() {
        val err = compileError(FUSED_LENS_SHADER)
        assertTrue(err == null, "着色器编译失败：$err")
    }

    @Test
    fun shaderDeclaresExpectedUniforms() {
        val s = FUSED_LENS_SHADER
        for (name in listOf(
            "content", "size", "offset", "rects", "radii",
            "count", "smoothing", "refractionHeight", "refractionAmount",
        )) {
            assertTrue(
                Regex("""uniform\s+\S+\s+$name\b""").containsMatchIn(s),
                "缺少 uniform 声明：$name",
            )
        }
    }

    @Test
    fun rectsArrayLengthMatchesMaxShapes() {
        // 声明长度必须与 Kotlin 侧打包的数组长度一致
        assertTrue(
            FUSED_LENS_SHADER.contains("uniform float rects[${MAX_SHAPES * 4}]"),
            "rects 数组长度与 MAX_SHAPES 不一致",
        )
        assertTrue(
            FUSED_LENS_SHADER.contains("uniform float radii[$MAX_SHAPES]"),
            "radii 数组长度与 MAX_SHAPES 不一致",
        )
    }

    @Test
    fun shaderHasMainEntryPoint() {
        assertTrue(
            Regex("""half4\s+main\s*\(\s*float2\s+coord\s*\)""").containsMatchIn(FUSED_LENS_SHADER),
            "缺少 main(float2 coord) 入口",
        )
    }

    /** 用 Skia 编译；成功返回 null，失败返回错误文本。 */
    private fun compileError(src: String): String? = try {
        // RuntimeEffect.makeForShader 就是 Skia 编译 AGSL 的入口，
        // 编译失败会抛 RuntimeException 并带上真实错误文本。
        org.jetbrains.skia.RuntimeEffect.makeForShader(src)
        null
    } catch (t: Throwable) {
        "${t.javaClass.simpleName}: ${t.message}"
    }
}
