import org.jetbrains.compose.desktop.application.dsl.TargetFormat

plugins {
    kotlin("jvm") version "2.4.21"
    id("org.jetbrains.compose") version "1.12.1"
    id("org.jetbrains.kotlin.plugin.compose") version "2.4.21"
}

group = "com.weizhang09.liquidglass"
version = "0.1.0"

dependencies {
    // Compose Multiplatform 运行时（桌面目标）
    implementation(compose.desktop.currentOs)
    implementation(compose.material3)
    implementation(compose.foundation)

    // 液态玻璃效果原语：AGSL 折射 / 模糊 / 高光 / 阴影。
    // 该库原生支持 jvm("desktop")，同一套代码覆盖 Windows 桌面与 Android。
    api("io.github.kyant0:backdrop:2.0.1")

    testImplementation(kotlin("test"))
}

kotlin {
    // backdrop-desktop 2.0.1 的 class 文件版本是 65（Java 21），
    // 用 JDK 17 会抛 UnsupportedClassVersionError。桌面目标必须 21。
    jvmToolchain(21)

    sourceSets {
        main {
            // tokens 生成到 commonMain（保持多平台就绪），
            // 而本项目是 kotlin("jvm")，默认只编译 src/main/kotlin。
            // 不显式加这个源目录，GeneratedTokens.kt 不会参与编译。
            kotlin.srcDir("src/commonMain/kotlin")
        }
    }
}

tasks.test {
    useJUnitPlatform()
}

compose.desktop {
    application {
        mainClass = "com.weizhang09.liquidglass.demo.MainKt"

        nativeDistributions {
            targetFormats(TargetFormat.Msi, TargetFormat.Exe)
            packageName = "LiquidGlassUI"
            packageVersion = "1.0.0"
            description = "LiquidGlassUI — Compose Multiplatform 桌面示例"
            vendor = "Wei-Zhang09"
        }
    }
}
