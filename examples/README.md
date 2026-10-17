# 可运行示例

三端各有示例。**代码不在同一个目录**，因为三端的构建方式不同 ——
硬塞进 `examples/` 反而会让每端都要改构建脚本去引用外部源码。

| 端 | 位置 | 运行方式 |
|---|---|---|
| **Web** | `examples/web/` | 见下 |
| **Windows 桌面** | `packages/compose/src/desktopMain/kotlin/.../demo/Main.kt` | `cd packages/compose && ./gradlew run` |
| **Android** | `packages/compose/androidApp/` | `cd packages/compose && ./gradlew :androidApp:installDebug` |

---

## Web

```bash
cd packages/web && npm run build      # 先构建 dist
cd ../.. && npx serve examples/web    # 或任意静态服务器
```

`examples/web/index.html` 演示：

- 10 个组件全部在线可交互
- 背景切换（高对比测试图 / 真实照片）—— 玻璃必须有纹理才看得出折射
- `?noLens=1` 可关掉折射，对比 A/B

::: warning 必须先构建
`examples/web` 引用的是 `packages/web/dist`，不是 `src`。
没跑 `npm run build` 会白屏（控制台报 404）。
:::

---

## Windows 桌面

```bash
cd packages/compose
export JAVA_HOME=".../jdk-21"    # backdrop 是 Java 21 class 文件
./gradlew run
```

`Main.kt` 演示：

- 5 个组件：`GlassSurface` / `GlassGroup` / `GlassSidebar` / `GlassMenu` / `GlassTooltip`
  （BottomBar 与 Dialog 是移动形态，桌面示例不展示 —— 见 Android 示例）
- 壁纸背景（`rememberWallpaper()`）
- `LG_NO_LENS=1` 环境变量可关掉折射做 A/B 对比

截图见 `docs/screenshots/compose-desktop-windows.png`。

---

## Android

```bash
cd packages/compose
./gradlew :androidApp:assembleDebug
adb install -r androidApp/build/outputs/apk/debug/androidApp-debug.apk
```

`MainActivity.kt` 是**可滚动的七分区展示**：

1. 边缘折射（GlassSurface）
2. 材质层级（plain / regular / elevated / focused）
3. 桌面组件触屏降级（Menu 点击 / Tooltip 长按）
4. SDF 融合（GlassGroup，smoothing 22 vs 0）
5. 侧边导航（GlassSidebar）
6. 移动专属（BottomBar / Dialog）
7. 交互状态

真机截图见 `docs/screenshots/android-showcase-top.png` / `android-showcase-scrolled.png`。

::: warning 需要 API 33+
AGSL 运行时着色器从 API 33 才有。低版本上融合效果会退化（不崩溃，但看不到融合）。
:::

---

## 为什么三端示例不放在一起

| 原因 | 说明 |
|---|---|
| 构建系统不同 | Web 走 npm/tsc，Compose 走 Gradle |
| 源码引用方式不同 | Web 引用 `dist`，Compose 直接编译 `commonMain` |
| 平台 API 不同 | 桌面用 Skiko，Android 用 AGSL，iOS 用系统材质 |

强行统一目录，只会让三端各自的构建脚本去引用目录外的源码，
比现在更难维护。**索引说明比强行合并更有用**。
