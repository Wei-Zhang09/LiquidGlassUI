# LiquidGlassUI 交接文档

> 每次长任务切换模型/会话时更新。目标、关键结论、当前状态、待办、待决策。

最后更新：2026-10-08

## 1. 目标

把六个液态玻璃参考实现（`rdev/liquid-glass-react`、`dashersw/liquid-glass-js`、`Kyant0/AndroidLiquidGlass`、`AndrewPrifer/liquid-dom`、`callstack/liquid-glass`、`archisvaze/liquid-glass`）收敛成**跨端可复用的 UI 组件库**，重点：

1. 通用性 —— 设计参数单源，四端观感不漂移
2. 易用性 —— API 遵循各端惯用法，能力门控显式暴露
3. 平台适配 —— 不同端组件侧重不同，不平铺同一份清单

## 2. 仓库与坐标

| 项 | 值 |
|---|---|
| 仓库 | https://github.com/Wei-Zhang09/LiquidGlassUI.git （private） |
| 本地 | `D:\HermesWorkSpace\LiquidGlassUI` |
| 默认分支 | `main` |
| Git 身份 | local config: `Wei-Zhang09` / `Wei-Zhang09@users.noreply.github.com` |
| 推送凭据 | Git Credential Manager 已存（`git push` 直接可用，无需 token） |
| 代理 | `HTTPS_PROXY=http://127.0.0.1:7897`（git/npm/curl 需要） |
| Kanban 看板 | `liquidglassui`（`hermes kanban --board liquidglassui ls`） |
| 研究材料 | `D:\HermesWorkSpace\tochat\liquid-glass-study\`（6 仓库源码 + 5 篇笔记 + 25 个验证脚本） |
| 相关 skill | `liquid-glass-ui` v3.0.0（跨端，含 `references/mobile-platforms.md`） |

## 3. 已确认的决策

### 来自用户

| 决策 | 结论 |
|---|---|
| 优先级 | **Web > Windows 桌面 > 移动端** |
| 验证策略 | Web + Compose 做到「可运行可验证」；Apple/RN 只出代码骨架并如实标注未验证 |
| Web 封装 | React **+** Web Components（覆盖 Vue/Svelte/原生） |
| 发布 | 暂不发布，仓库内部使用，包名留占位 |
| 执行方式 | 先做最小可运行原型确认手感，再铺开全部组件 |

### 技术结论（已验证）

- **`io.github.kyant0:backdrop:2.0.1` 在 Maven Central 上存在**，且 `.module` 元数据里有 `desktopApiElements-published`（`platform=jvm` → `backdrop-desktop`）。
  → **一套 Compose 代码同时覆盖 Windows 桌面与 Android**，不需要两份实现。这是 P1 的核心依据。
- **WPF 无法做元素级液态玻璃**。仅能通过 P/Invoke `SetWindowCompositionAttribute` 得到窗口级 DWM Acrylic。本项目不提供 WPF 实现。
- **Web 端真折射只有一条路**：`backdrop-filter: url(#svgFilter)`，且**只有 Chromium 渲染**。Safari/Firefox 静默失败（`CSS.supports` 返回 true 但什么都不做）。
- **两个必踩的坑**（实测得出）：滤镜必须写 `color-interpolation-filters="sRGB"`；`feImage` 必须写 `preserveAspectRatio="none"`。缺任一都会静默失效。

## 3.5 代码结构补充（Web 端）

`packages/web/src/elements/glass-base.ts` 是共享基类，承载降级阶梯、主题、
圆角与滤镜重建；各组件只提供自己的 CSS 与属性处理。
新增 Web 组件时继承 `GlassElementBase`，不要重复实现这些逻辑。

## 4. 当前状态

### 已完成并验证

| 项 | 证据 |
|---|---|
| 仓库初始化 + 2 篇 ADR + README | 3 个 commit 已推送，独立 clone 读回确认 |
| Kanban 看板 20 张卡片 + 依赖链 | `hermes kanban boards` 可见 |
| **tokens 单源** | 改一处 JSON → 四端同步；`--check` 正确检出漂移（exit 1） |
| **Web GlassSurface 原型** | `tools/verify-web.py` 双浏览器实测通过 |
| 截图留证 | `docs/screenshots/web-prototype-{chromium,firefox}.png` |

### Web 原型验证结果（`tools/verify-web.py`）

```
Chromium: support=refraction  边缘带位移 mean=83.4 max=224  中心区 mean=0.0
Firefox:  support=frost       正确降级（静默无折射，符合预期）
```

中心区 17 个采样点差异全为 0 —— 证明折射严格限于边缘带，中间不变形。

### 代码结构

```
LiquidGlassUI/
├── docs/
│   ├── adr/0001-component-matrix-and-architecture.md
│   ├── adr/0002-platform-priority-and-desktop.md
│   └── screenshots/
├── packages/
│   ├── tokens/tokens.json              ← 设计参数唯一真源
│   └── web/                            ← 已实现并验证
│       ├── src/capabilities.ts         UA 嗅探门控
│       ├── src/refraction.ts           Snell 定律折射剖面 + 位移贴图
│       ├── src/core/filter-registry.ts SVG 滤镜注册表（含命名空间断言）
│       ├── src/elements/glass-surface.ts  Web Component
│       ├── src/react/GlassSurface.tsx  React 桥接
│       └── src/generated/              由 gen-tokens.py 生成，勿手改
├── examples/web/index.html             ← 可运行示例
└── tools/
    ├── gen-tokens.py                   tokens → 四端代码生成
    ├── verify-web.py                   像素级验证
    └── seed-kanban.sh                  看板种子
```

## 5. 待办（按优先级）

### P0 —— Web 端继续

- [x] Web 组件：`GlassSurface` / `GlassButton` / `GlassCard` / `GlassNavBar` / `GlassBottomBar`
- [x] Web 示例改用真实照片背景（`examples/web/assets/wallpaper.jpg`）
- [x] 双浏览器验证通过（`tools/verify-web-showcase.py`）
- [ ] 待补：`GlassGroup`（SDF 平滑并集融合）/ `GlassDialog` / `GlassSegmentedControl`
- [x] Web 组件测试（Vitest + jsdom，35 个用例）
- [x] `GlassGroup`（SDF 平滑并集融合）
- [x] `GlassDialog`（焦点陷阱/焦点归还/ESC/滚动锁定）
- [x] `GlassSegmentedControl`（roving tabindex + 方向键导航）

**GlassDialog 的一个教训**：它**不参与 backdrop 折射**（覆盖在全屏遮罩上，
没有可采样的背景层），所以不走 `initGlass`。但**颜色变量仍必须显式设置** ——
否则面板与遮罩会落到 CSS 的硬编码 fallback，表现为：
遮罩几乎不可见、背后内容透进面板、文字读不清。
视觉复核时发现的，jsdom 测不出来（jsdom 不算样式）。
模态面板用 `surfaceModal`（不透明度更高）而非 `surface`：
玻璃面可以透，但模态里的文字必须可读。

**GlassGroup 的两个要点**：
1. 融合的正确性基础是 `src/sdf.ts` 的纯数学（sminPoly + 融合距离场梯度），
   可独立单元测试。新增融合类功能先测数学，再接 DOM。
2. 子元素**不再各自申请滤镜**，由组统一分配带 `lg-fused-` 前缀的滤镜。
   若子元素拿到 `lg-filter-`（单形状），说明融合没生效 —— 测试据此断言。

**Web 端测试分层**（重要，别混淆）：
| 层 | 工具 | 测什么 |
|---|---|---|
| 逻辑 | `npx vitest run`（jsdom） | 事件、键盘可达、属性响应、降级档位 |
| 渲染 | `tools/verify-web-showcase.py`（Playwright） | 真实折射、双浏览器降级、像素 |

**Vitest 三个坑**（都是实测踩出来的）：
1. `restoreMocks` **不恢复 `vi.stubGlobal`**。必须开 `unstubGlobals: true`，
   否则前一个用例 stub 的 `navigator`/`CSS` 泄漏到下一个用例，
   门控测试随机失败（曾因此误判为产品缺陷）。
2. jsdom 不实现 `canvas.getContext('2d')` 与 `SVGFilterElement`，需在 helpers 里桩掉。
3. `getBoundingClientRect` 必须在**元素插入 DOM 前**设好 —— connectedCallback
   会同步跑一次构建，之后改尺寸不会自动重触发。

### P1 —— Windows 桌面（Compose）

- [x] 构建链路打通（官方 Compose Multiplatform 插件）
- [x] 玻璃原型可运行并通过 A/B 像素验证
- [x] **与 tokens 打通**（渲染层闭环已验证）
- [x] `GlassSidebar`（桌面主导航，含悬停/选中态）
- [x] `GlassTooltip`（桌面专属，悬停触发）
- [x] `GlassMenu`（桌面高频，含分隔线/快捷键/禁用项）

**测试写法的四个坑**（都是实测踩出来的）：
0. 菜单/提示用 `offset` 绘制在锚点布局边界**之外**，测试根容器太小会报
   `Cannot start a mouse gesture outside the Compose root bounds`。
   测试需给足够大的根容器（如 600x600dp），真实使用同理。

1. `assertDoesNotExist` 是 `SemanticsNodeInteraction` 的**成员方法**，不要 import。
2. v2 测试 API 的 `StandardTestDispatcher` 会**排队协程而非立即执行**，
   `waitForIdle()` 不推进它；用 `waitUntil { onAllNodesWithText(..).fetchSemanticsNodes()... }` 轮询。
3. `GlassTooltip` 用 `offset` 绘制在锚点布局边界之外，`assertIsDisplayed` 会
   **误报失败**（它要求节点在父级边界内）——对提示框只能用 `assertExists`。
   这也是真实限制：**父级设 `clip` 会裁掉提示**。

**组件测试的重要约束**：`backdrop` 的 `GraphicsLayer` 会创建 Skia GPU surface，
在无头测试进程中**原生崩溃**（实测退出码 `0xC0000005` / `0xC0000409`），
`skiko.renderApi=SOFTWARE` 也无效。
对策：**把逻辑与渲染解耦**——
- 交互逻辑用空实现的 `NoopBackdrop` 测试（`GlassSidebarTest`，5 个用例全过）
- 玻璃渲染用截图验证（`tools/capture-sidebar.py`）
不要试图在无头环境测玻璃渲染，那条路走不通。

**tokens 接入要点**：生成物落在 `src/commonMain/kotlin`，而项目是 `kotlin("jvm")`，
默认只编译 `src/main/kotlin`。必须在 `build.gradle.kts` 显式加：
```kotlin
kotlin { sourceSets { main { kotlin.srcDir("src/commonMain/kotlin") } } }
```
否则 `GeneratedTokens.kt` 根本不参与编译（此前就是这个断层）。

**构建环境要求（踩过的坑，必须照做）**：

| 项 | 值 | 原因 |
|---|---|---|
| JDK | **21**（运行期硬要求） | `backdrop-desktop:2.0.1` 的 class 文件版本是 65（Java 21）。jar 的 major version 实测为 65。**注意区分**：`compileKotlin` 用 JDK 17 也能通过（backdrop 仅作编译期依赖，类不被加载）；只有 `run` 才会抛 `UnsupportedClassVersionError`。用 `jvmToolchain(21)` 让两者一致，避免只按 `JAVA_HOME` 判断而踩坑 |
| Gradle | **≥ 8.14.4** | Kotlin 2.4.x 的 Gradle 插件最低要求。wrapper 已设为 8.14.4 |
| 代理 | `~/.gradle/gradle.properties` | **Gradle 不读 `HTTP_PROXY` 环境变量**，必须写 systemProp。这是首次构建 10 分钟零下载的根因 |
| 插件版本 | Kotlin 2.4.21 / compose 1.12.1 | 从 Maven Central metadata 查得的最新稳定版 |

构建命令：
```bash
cd packages/compose
JAVA_HOME="C:/Program Files/Java/jdk-21" ./gradlew --no-daemon compileKotlin   # 编译
JAVA_HOME="C:/Program Files/Java/jdk-21" ./gradlew --no-daemon run             # 运行
python tools/verify-compose.py                                                  # A/B 验证
```

### P2 —— 移动端

- [x] Compose 工程改造为多目标（commonMain 共享 / desktopMain / androidMain）
- [x] Android 库构建通过（产出 AAR）
- [x] Android 示例 App + **真机运行验证通过**（Xiaomi 13 · Android 16 / API 36 / arm64）
- [ ] 待补：Android 侧组件测试（目前测试都在 desktopTest）

**Android 构建环境要求（踩过的坑）**：

| 项 | 值 | 原因 |
|---|---|---|
| AGP | **9.4.1** | Compose 1.12.1 的 AndroidX 依赖要求 AGP >= 9.1 |
| Gradle | **9.8.1** | AGP 9.x 要求 |
| compileSdk | **37** + buildTools 37.0.0 | 同上 |
| 插件 | `com.android.kotlin.multiplatform.library` | AGP 9 下 `com.android.library` 不再适用于 KMP |
| Android 配置位置 | `kotlin { android { } }` | 不是 `androidTarget`，也不是顶层 `android { }` |
| gradle.properties | `android.useAndroidX=true` | 否则 checkDesktopMainComposeLibrariesCompatibility 失败 |
| gradle.properties | `android.builtInKotlin=false` + `android.newDsl=false` | AGP 9 内置 Kotlin 的产物不进 dex（类编译出来但 APK 里没有），用官方开关回到传统路径 |
| local.properties | `sdk.dir` 用**正斜杠** | Properties 里反斜杠是转义符，否则 SdkLocator 报"文件名语法不正确" |
| 任务名 | `:androidApp:assembleDebug` / `compileAndroidMain` | 不是 `assembleDebug`（KMP 插件按变体命名） |

**Android 真机验证流程**（模拟器不可用时的替代方案）：
```bash
ADB="C:/Users/zw/AppData/Local/Android/Sdk/platform-tools/adb.exe"
$ADB install -r androidApp/build/outputs/apk/debug/androidApp-debug.apk
$ADB shell am start -W -n com.weizhang09.liquidglass.android/.MainActivity
$ADB exec-out screencap -p > docs/screenshots/android-device.png
```
小米设备需在开发者选项里**额外打开「USB 安装」**，否则报 `INSTALL_FAILED_USER_RESTRICTED`。

**本机模拟器不可用**（已实测）：无硬件 GPU 加速，只能用 swiftshader 软件渲染，
qemu 进程实测占 **7.3GB**，把 15.6GB 内存压到 0.3GB，导致 Android 的
`system_server` 反复被 OOM 杀掉 —— 表现为 `dumpsys` 与 `am start` 结论矛盾、
`boot_completed=1` 但服务不可用。**不要再在本机跑模拟器，用真机。**

### P3 —— iOS / RN（阻塞）

- [ ] 4 张卡片已加评论标注「无 macOS，不得声称已验证」

## 6. 待用户决策

1. **Compose 桌面端的构建方式**：是否接受用 Compose Multiplatform 官方插件搭建（需要下载较多依赖，首次构建慢）？还是先用更轻量的方式验证 `backdrop` 可用性？
2. **v1 是否要 `GlassSidebar` / `GlassMenu` / `GlassTooltip`**（桌面端高频，ADR-0002 D4 已提升为 v1，但会增加工作量）
3. **移动端验证闭环**：是否需要 Android 模拟器/真机（影响 P2 能否真正验证）
4. **Web Components 的样式隔离策略**：当前用 Shadow DOM，是否需要在需要时开放 `::part()` 定制

## 7. Compose 端验证的测量方差（重要）

`tools/verify-compose.py` 三次独立运行的边缘带均值：**21.1 / 8.1 / 15.5**（2.6 倍差异）。
内部本底始终稳定在 **0.3–0.5**。

- **方差来自截图**：Compose 窗口的合成时机不定，连拍取帧仍会有差异。
- **定性结论三次完全一致**：边缘显著高于内部、衰减单调。结论可信。
- **报告时给区间，不要给单点值**。给单点会造成"精确但不可复现"的错觉。

若要让数字稳定，需要换成程序内渲染（Compose 的 test framework / 离屏渲染），
而不是截桌面窗口。当前方案是权衡后的选择，不是最优。

## 8. 已知坑（避免重复踩）

- `git ls-remote` 对**空仓库**返回 exit=0 且零输出，与"仓库不存在"（exit=128 + "Repository not found"）不同。判断空仓库看 GitHub API 404 + ls-remote 无 ref。
- 示例页 `body` 必须写 `min-height: 100vh`，否则背景传播到 `<html>`，`backdrop-filter` 采样到的 backdrop root 与预期不同。
- **验证脚本要按元素引用解析目标滤镜**：多个玻璃面各有滤镜，取 `document.querySelector('filter')` 会打错对象（这个 bug 让验证假失败过一次）。
- `device_scale_factor=2` 时截图坐标是 CSS 坐标的 2 倍，`getImageData` 必须换算。
- MSYS 的 `/tmp` 对原生 Windows Python 不可见，用 `$TMPDIR`。
- TypeScript 用 `moduleResolution: bundler` 时不会补 `.js` 扩展名，浏览器 ESM 要求完整路径 —— 源码里的相对 import 必须写 `.js`。
- 本机无 `gh` CLI、无 `gradle`（PATH 里没有），但有 JDK 21、Android SDK、Gradle wrapper 缓存。
- **`backdrop-desktop` 需要 JDK 21**：其 class 文件版本 65。用 JDK 17 抛 `UnsupportedClassVersionError`。
- **Gradle 不读 `HTTP_PROXY`**：必须写 `~/.gradle/gradle.properties` 的 `systemProp.*`。
- **Windows `CreateProcess` 不用 cwd 解析可执行文件**：subprocess 调 `gradlew.bat` 必须给绝对路径。
- **截桌面窗口时，同名进程可能有多个**（gradle 残留）：要按窗口面积挑最大的，不能取第一个。
- **判断"画面是否渲染完成"不要用启发式阈值**：试过两种都失败——
  阈值门控会因阈值选错全拒；"最大化低饱和占比"会把深色控制台窗口误判为玻璃。
  最终改用最朴素的"连拍两帧是否一致"，可靠得多。
