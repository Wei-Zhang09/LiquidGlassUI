pluginManagement {
    // 插件版本在此统一声明，子模块只写 id（不写 version），
    // 否则会报 'already on the classpath with an unknown version'。
    plugins {
        id("com.android.application") version "9.4.1"
        id("com.android.kotlin.multiplatform.library") version "9.4.1"
        kotlin("multiplatform") version "2.4.21"
        id("org.jetbrains.compose") version "1.12.1"
        id("org.jetbrains.kotlin.plugin.compose") version "2.4.21"
    }

    repositories {
        mavenCentral()
        google()
        gradlePluginPortal()
        maven("https://maven.pkg.jetbrains.space/public/p/compose/dev")
    }
}

dependencyResolutionManagement {
    repositories {
        mavenCentral()
        google()
        maven("https://maven.pkg.jetbrains.space/public/p/compose/dev")
    }
}

rootProject.name = "liquidglass-compose"

// Android 示例 App（依赖本工程作为库）
include(":androidApp")
