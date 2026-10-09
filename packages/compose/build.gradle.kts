plugins {
    kotlin("jvm") version "2.1.0"
    `java-library`
}

group = "com.weizhang09.liquidglass"
version = "0.1.0"

repositories {
    mavenCentral()
    google()
    maven("https://maven.pkg.jetbrains.space/public/p/compose/dev")
}

dependencies {
    // 液态玻璃效果原语：AGSL 折射 / 模糊 / 高光 / 阴影。
    // 该库原生支持 jvm("desktop")，同一套代码覆盖 Windows 桌面与 Android。
    api("io.github.kyant0:backdrop:2.0.1")

    testImplementation(kotlin("test"))
}

kotlin {
    jvmToolchain(17)
}

tasks.test {
    useJUnitPlatform()
}
