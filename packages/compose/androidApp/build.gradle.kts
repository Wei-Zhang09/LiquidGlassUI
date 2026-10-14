plugins {
    id("com.android.application")
    kotlin("android")
    id("org.jetbrains.kotlin.plugin.compose")
}

android {
    namespace = "com.weizhang09.liquidglass.android"
    compileSdk = 37

    defaultConfig {
        applicationId = "com.weizhang09.liquidglass.android"
        minSdk = 24
        targetSdk = 37
        versionCode = 1
        versionName = "0.1.0"
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_21
        targetCompatibility = JavaVersion.VERSION_21
    }

    buildFeatures { compose = true }

    // AGP 9 的内置 Kotlin 编译产物落在 built_in_kotlinc/，默认未被 dex 任务接上，
    // 表现为：类能编译出来，但 dex 里没有 → 装到设备后 Activity 找不到。
    // 显式声明 kotlin 源集，让编译产物进入正常的 classes 输出路径。
    sourceSets["main"].kotlin.srcDirs("src/main/kotlin")
}

dependencies {
    implementation(project(":"))
    implementation("androidx.activity:activity-compose:1.9.3")
    implementation("org.jetbrains.compose.ui:ui:1.12.1")
    implementation("org.jetbrains.compose.runtime:runtime:1.12.1")
    implementation("org.jetbrains.compose.foundation:foundation:1.12.1")
    implementation("org.jetbrains.compose.material3:material3:1.9.0")
}
