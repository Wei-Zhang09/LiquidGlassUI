import org.jetbrains.compose.desktop.application.dsl.TargetFormat
import org.jetbrains.kotlin.gradle.ExperimentalKotlinGradlePluginApi
import org.jetbrains.kotlin.gradle.dsl.JvmTarget

plugins {
    kotlin("multiplatform")
    id("org.jetbrains.compose")
    id("org.jetbrains.kotlin.plugin.compose")
    id("com.android.kotlin.multiplatform.library")
}

group = "com.weizhang09.liquidglass"
version = "0.1.0"

kotlin {
    // Android 与桌面都基于 JVM，backdrop 的 class 版本是 65（Java 21）。
    // 用 JDK 17 编译能过、运行会抛 UnsupportedClassVersionError，
    // 因此统一要求 21，避免只按 JAVA_HOME 判断而踩坑。
    jvmToolchain(21)

    // AGP 9.x + com.android.kotlin.multiplatform.library 的写法：
    // Android 目标配置在 kotlin { android { } } 内（不是 androidTarget，
    // 也不是顶层 android { }）。照 Kyant0/AndroidLiquidGlass 的 backdrop 模块。
    android {
        namespace = "com.weizhang09.liquidglass"
        compileSdk = 37
        buildToolsVersion = "37.0.0"
        // backdrop 的 AGSL 折射需要 API 33+（RuntimeShader）；低版本自动降级
        minSdk = 24
        compilerOptions {
            jvmTarget = JvmTarget.JVM_21
        }
    }

    jvm("desktop")

    sourceSets {
        val commonMain by getting {
            dependencies {
                implementation(compose.runtime)
                implementation(compose.foundation)
                implementation(compose.material3)
                implementation(compose.ui)
                // 液态玻璃效果原语：AGSL 折射 / 模糊 / 高光 / 阴影
                api("io.github.kyant0:backdrop:2.0.1")
            }
        }

        val desktopMain by getting {
            dependencies {
                implementation(compose.desktop.currentOs)
            }
        }

        val desktopTest by getting {
            dependencies {
                implementation(kotlin("test"))
                @OptIn(org.jetbrains.compose.ExperimentalComposeLibrary::class)
                implementation(compose.uiTest)
                implementation(compose.desktop.currentOs)
            }
        }

        // Android 侧暂不放代码：组件全部在 commonMain，两端共享。
        // 将来若需要平台专属实现，在此目录加 actual 声明。
        val androidMain by getting
    }
}


// 桌面端测试：Compose 的 GraphicsLayer + Skia runtime shader 在无图形上下文时
// 会原生崩溃（实测退出码 0xC0000005 / 0xC0000409）。用软件渲染使其可在无头环境运行。
tasks.withType<Test>().configureEach {
    useJUnitPlatform()
    systemProperty("skiko.renderApi", "SOFTWARE")
    systemProperty("java.awt.headless", "true")
    jvmArgs("-Xss4m")
}

compose.desktop {
    application {
        mainClass = "com.weizhang09.liquidglass.demo.MainKt"

        nativeDistributions {
            targetFormats(TargetFormat.Msi, TargetFormat.Exe)
            packageName = "LiquidGlassUI"
            packageVersion = "1.0.0"
            description = "LiquidGlassUI — Compose Multiplatform 示例"
            vendor = "Wei-Zhang09"
        }
    }
}
