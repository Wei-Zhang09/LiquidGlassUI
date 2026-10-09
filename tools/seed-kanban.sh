#!/usr/bin/env bash
# 为 LiquidGlassUI v0.1 建立 Kanban 卡片与依赖关系
set -euo pipefail

BOARD=liquidglassui
WS='dir:D:\HermesWorkSpace\LiquidGlassUI'

mk() { # mk <title> <body> -> echoes id
  hermes kanban --board "$BOARD" create "$1" \
    --body "$2" --workspace "$WS" --json 2>/dev/null \
  | python -c "import sys,json; print(json.load(sys.stdin)['id'])"
}

link() { hermes kanban --board "$BOARD" link "$1" "$2" >/dev/null 2>&1 && echo "  link $1 -> $2"; }

echo "=== M1 基础设施 ==="
T1=$(mk "tokens: 设计参数唯一真源 + 跨端代码生成" \
"建立 packages/tokens：以 JSON 作为颜色/圆角/模糊/bezel/IOR/光照方向的唯一真源。
tools/ 下写生成脚本，产出四端原生常量：
- packages/web/src/generated/tokens.ts
- packages/compose/.../GeneratedTokens.kt
- packages/apple/Sources/.../GeneratedTokens.swift
- packages/rn/src/generated/tokens.ts
验收：改一处 JSON，四端常量同步更新；生成物不入库（已在 .gitignore）。")
echo "T1=$T1"

T2=$(mk "web: 包骨架 + 能力门控 + GlassSurface" \
"packages/web：React + TypeScript，Vite 构建。
实现 isGlassRefractionSupported()：UA 嗅探（@supports 对 Firefox 说谎，实测确认）。
GlassSurface 组件：SVG feDisplacementMap 真折射 + CSS 磨砂降级阶梯。
必带两个属性：color-interpolation-filters=\"sRGB\"、feImage 的 preserveAspectRatio=\"none\"（缺任一都会静默失效）。
验收：Chromium 有折射、Firefox 有磨砂、无 JS 报错。")
echo "T2=$T2"

T3=$(mk "compose: 包骨架 + 能力门控 + GlassSurface" \
"packages/compose：Kotlin Multiplatform。
依赖 io.github.kyant0:backdrop:2.0.1（AGSL 折射）或自研。
封装 isRuntimeShaderSupported() / isRenderEffectSupported() 为统一的 LiquidGlassCapabilities。
GlassSurface：drawBackdrop + blur/vibrancy/lens 组合。
验收：API 33+ 有折射，低版本自动降级不报错。")
echo "T3=$T3"

T4=$(mk "apple: Swift Package 骨架 + 能力门控" \
"packages/apple：SwiftPM，同时提供 SwiftUI 与 UIKit 两套。
封装 isSupported：编译期 #if compiler(>=6.2) + 运行期 NSClassFromString + #available(iOS 26.0, *)。
注意：本机为 Windows，无 macOS，无法编译验证 —— 必须如实标注，不得声称已验证。")
echo "T4=$T4"

T5=$(mk "rn: 包骨架 + 平台降级" \
"packages/rn：React Native 封装。
iOS 走原生 UIGlassEffect，Android 无原生支持 —— 非 iOS 必须降级为 CSS 风格磨砂并给出可见回退。
导出 isLiquidGlassSupported，非 iOS 恒 false。
验收：Android 上不出现\"没报错但没效果\"。")
echo "T5=$T5"

echo "=== M2 Web 组件 ==="
T6=$(mk "web: GlassCard / GlassButton / GlassGroup" \
"三个核心组件。
GlassGroup 负责多块玻璃的合并：SDF 平滑并集（参考 liquid-dom），含法线门控避免假融合。
验收：组件可组合，GlassGroup 内相邻玻璃能融合。")
echo "T6=$T6"

T7=$(mk "web: GlassNavBar / GlassDialog / GlassSegmentedControl" \
"Web 高频组件。NavBar 为吸顶玻璃条，Dialog 为模态玻璃面板（含焦点陷阱与 ESC 关闭），SegmentedControl 为分段控件。
验收：键盘可达（Tab/ESC），aria 属性正确。")
echo "T7=$T7"

T8=$(mk "web: 示例站点 + 浏览器矩阵验证" \
"examples/web 可运行示例。
必须实测的浏览器矩阵：Chromium（有折射）、Firefox（静默降级为磨砂）、Safari（若有环境）。
验收：附截图与像素级验证脚本，证明 Chromium 有位移、Firefox 无位移但可用。")
echo "T8=$T8"

echo "=== M3 Compose 组件 ==="
T9=$(mk "compose: GlassCard / GlassButton / GlassGroup" \
"三个核心组件，对应 web 的 API 概念。
GlassGroup 用 Compose 的 GraphicsLayer 导出机制实现子玻璃采样父层。")
echo "T9=$T9"

T10=$(mk "compose: BottomBar / Switch / Slider / Dialog / SegmentedControl" \
"移动端高频组件（Android catalog 的 LiquidBottomTabs/Toggle/Slider 为参考）。
交互手感用 tanh 阻尼映射位移与缩放，避免拖拽飞出。
验收：真机或模拟器上交互正常，低版本 API 自动降级。")
echo "T10=$T10"

T11=$(mk "compose: 示例应用" \
"examples/compose 可运行示例，覆盖 v1 全部组件。
验收：可在 Android 设备/模拟器运行。")
echo "T11=$T11"

echo "=== M4 Apple 组件 ==="
T12=$(mk "apple: SwiftUI 组件集" \
"glassEffect(_:in:) + GlassEffectContainer 实现 v1 组件。
含 glassEffectID / glassEffectUnion / GlassEffectTransition 的形态变换。
注意：本机无 macOS，编译未验证，如实标注。")
echo "T12=$T12"

T13=$(mk "apple: UIKit 组件集 + 生命周期处理" \
"UIGlassEffect + UIGlassContainerEffect 实现。
必须处理五个已知坑（来自 callstack 源码）：
1. 首次 window 布局前不应用 effect
2. willMove(toWindow:) 拆掉 effect，防 interactive 状态残留崩溃
3. 应用后强制 contentView.isUserInteractionEnabled = true
4. 改 isInteractive 需置 nil 后重建
5. 编译期+运行期双重门控")
echo "T13=$T13"

T14=$(mk "apple: 示例应用（需 macOS 环境）" \
"examples/apple：Xcode 工程。
阻塞项：本机为 Windows，无法编译/运行。需 macOS 环境或委托他人验证。
交付前不得声称已验证。")
echo "T14=$T14"

echo "=== M5 RN ==="
T15=$(mk "rn: 组件集 + 平台降级" \
"封装 @callstack/liquid-glass@0.8.2（或直接原生）。
iOS 走原生材质，Android 走自定义降级渲染。
注意 RN 已知限制：glass 高度 >= 65 时文字自动变色失效。")
echo "T15=$T15"

T16=$(mk "rn: 示例应用" \
"examples/rn：可运行示例，iOS 与 Android 各跑一遍验证降级路径。")
echo "T16=$T16"

echo "=== M6 发布 ==="
T17=$(mk "docs: 组件 API 文档与接入指南" \
"每端一份接入指南 + 统一的组件 API 对照表。
必须包含各端能力门控说明与降级行为表。")
echo "T17=$T17"

T18=$(mk "release: 发布流程（npm / Maven Central / SwiftPM）" \
"确定包名与发布目标，配置各端发布流程。
待用户决策：包名、是否公开发布、Web 是否同时提供 Web Components 封装。")
echo "T18=$T18"

T19=$(mk "verify: 跨端视觉一致性验证" \
"同一组 token 下，四端渲染结果对比。
方法：固定背景 + 固定组件，各端截图，比对边缘折射宽度/高光角度/圆角。
验收：附四端截图对照，差异在可接受范围内或有明确记录。")
echo "T19=$T19"

echo
echo "=== 依赖关系 ==="
link "$T1" "$T2"; link "$T1" "$T3"; link "$T1" "$T4"; link "$T1" "$T5"
link "$T2" "$T6"; link "$T6" "$T7"; link "$T7" "$T8"
link "$T3" "$T9"; link "$T9" "$T10"; link "$T10" "$T11"
link "$T4" "$T12"; link "$T12" "$T13"; link "$T13" "$T14"
link "$T5" "$T15"; link "$T15" "$T16"
link "$T8" "$T17"; link "$T11" "$T17"; link "$T16" "$T17"
link "$T17" "$T18"; link "$T18" "$T19"

echo
echo "=== 完成 ==="
hermes kanban --board "$BOARD" ls 2>&1 | head -30
