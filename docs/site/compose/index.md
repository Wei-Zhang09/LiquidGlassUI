# Compose 组件

Compose Multiplatform 端的 7 个组件，全部在 `commonMain`（桌面与 Android 共用）。

::: warning 这些页面没有在线演示
Compose 组件无法在浏览器里运行 —— 它们是 Kotlin 代码，编译成桌面/Android 原生程序。

因此 Compose 文档页只有**代码示例与 API 表格**，效果请参考
[验证报告](/verification)里的截图（桌面截图 + Xiaomi 13 真机截图）。
:::

## 组件清单

| 组件 | 形态 | 平台侧重 |
|---|---|---|
| [`GlassSurface`](/compose/glass-surface) | 材质底板 | 通用 |
| [`GlassGroup`](/compose/glass-group) | 玻璃融合 | 通用 |
| [`GlassSidebar`](/compose/glass-sidebar) | 左侧导航 | 桌面（悬停） |
| [`GlassMenu`](/compose/glass-menu) | 下拉菜单 | 桌面（点击外部关闭） |
| [`GlassTooltip`](/compose/glass-tooltip) | 提示框 | 双端（悬停 / 长按） |
| [`GlassBottomBar`](/compose/glass-bottombar) | 底部标签栏 | 移动（按压反馈） |
| [`GlassDialog`](/compose/glass-dialog) | 底部抽屉 | 移动（拇指可达） |

## 基本用法

所有组件都接收一个 `Backdrop` —— 它是**被采样的背景层**。

```kotlin
@Composable
fun App() {
    val backdrop = rememberLayerBackdrop()

    Box(Modifier.fillMaxSize()) {
        // 背景内容：必须有纹理，否则玻璃看不出效果
        Box(
            Modifier
                .layerBackdrop(backdrop)   // ← 标记为可采样层
                .fillMaxSize()
                .background(/* 渐变 + 纹理 */)
        )

        // 玻璃元素放在同一 Box 内，采样上面的背景
        GlassSurface(
            backdrop = backdrop,
            modifier = Modifier.align(Alignment.Center).size(280.dp, 120.dp),
            level = GlassLevel.Elevated,
        ) {
            Text("玻璃面")
        }
    }
}
```

::: tip `layerBackdrop` 是关键
`rememberLayerBackdrop()` 创建一个空的采样源，`Modifier.layerBackdrop(backdrop)`
把某个子树标记为**可被采样**。玻璃元素必须与背景层在**同一个 Box 内**，
否则采样不到。
:::

## 依赖

```kotlin
// build.gradle.kts
dependencies {
    implementation("io.github.kyant0:backdrop:2.0.1")
}
```

上游库是 [`Kyant0/AndroidLiquidGlass`](https://github.com/Kyant0/AndroidLiquidGlass)，
本库在其之上提供组件与设计参数。

## 设计参数

所有默认值来自 `packages/tokens/tokens.json`（四端唯一真源），
通过 `tools/gen-tokens.py` 生成 Kotlin 常量：

```kotlin
GlassRadiusTokens.lg          // 26.dp
GlassBlurTokens.regular       // 16.dp
GlassOpticalTokens.REFRACTION_HEIGHT   // 12f
GlassOpticalTokens.REFRACTION_AMOUNT   // 24f
GlassMotionTokens.SLOW        // 400 (ms)
```

改 `tokens.json` 会同步影响 Web / Compose / iOS —— 有渲染层闭环验证
（改一个值，截图差异集中在圆角区域）。

## 环境要求

| 项 | 要求 |
|---|---|
| JDK | 21+ |
| Gradle | 9.8+ |
| 桌面渲染 | Skiko（Skia） |
| Android | API 33+（AGSL 运行时着色器） |

## 平台差异

组件不是全都该两端通用。判据是**核心操作是否依赖 hover**：

| 组件 | 桌面 | 移动 | 依据 |
|---|---|---|---|
| `GlassTooltip` | 悬停 | **长按** | hover 是唯一触发方式 → 必须分化 |
| `GlassSidebar` | 悬停改底色 | 点击可用 | hover 只是视觉增强 → 可复用 |
| `GlassMenu` | 悬停改底色 | 点击可用 | 同上 → 可复用 |
| `GlassBottomBar` | — | 主导航 | 拇指区，桌面无意义 |

这组结论是实测得出的（同一份测试分别注入鼠标与触摸输入），
详见 [ADR-0003](https://github.com/Wei-Zhang09/LiquidGlassUI/blob/main/docs/adr/0003-platform-differentiation-evidence.md)。
