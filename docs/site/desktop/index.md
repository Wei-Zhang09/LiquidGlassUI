# 桌面端组件

Compose Multiplatform 的**桌面形态**（Windows / macOS / Linux）。

::: warning 这些页面没有在线演示
Compose 组件是 Kotlin 代码，编译成原生程序，无法在浏览器里运行。

因此本组页面只有**代码示例与 API 表格**；效果请参考
[验证报告](/verification)里的**桌面截图**。
:::

## 组件清单

### 共用基础

桌面与移动**共用同一份 `commonMain` 代码** —— 这两个组件两端都在用：

| 组件 | 说明 |
|---|---|
| [`GlassSurface`](/desktop/glass-surface) | 材质底板 |
| [`GlassGroup`](/desktop/glass-group) | 多个玻璃元素融合（AGSL 运行时着色器） |

### 桌面专属形态

这几个组件的**核心操作依赖 hover**，在触屏上没有等价交互，
因此只在桌面端有意义（判据见 [ADR-0003](https://github.com/Wei-Zhang09/LiquidGlassUI/blob/main/docs/adr/0003-platform-differentiation-evidence.md)）：

| 组件 | 说明 | 为什么是桌面专属 |
|---|---|---|
| [`GlassSidebar`](/desktop/glass-sidebar) | 左侧导航 | 悬停高亮是主要反馈 |
| [`GlassMenu`](/desktop/glass-menu) | 下拉菜单 | 悬停 + 点击外部关闭 |
| [`GlassTooltip`](/desktop/glass-tooltip) | 提示框 | **hover 是唯一触发方式** |

::: tip 移动端怎么办？
- `GlassTooltip` 在移动端必须改成**长按**触发（hover 不存在）→ 见[移动端组件](/mobile/)
- `GlassSidebar` / `GlassMenu` 在移动端可复用（hover 只是视觉增强）
:::

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

## 环境要求

| 项 | 要求 |
|---|---|
| JDK | 21+（`backdrop` 是 Java 21 class 文件） |
| Gradle | 9.8+ |
| 渲染后端 | Skiko（Skia） |
| 运行时着色器 | 桌面端**无条件支持** |

## 相关

- [移动端组件](/mobile/) —— Android 形态
- [Web 端组件](/web/) —— 浏览器
- [平台能力矩阵](/platform/) —— 三端对比
