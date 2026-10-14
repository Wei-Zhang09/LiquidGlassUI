# iOS

::: danger 状态：仅代码骨架，**未编译、未运行、未验证**
本库**没有** macOS 环境，因此 iOS 端：

- 无法编译
- 无法运行
- 无法验证

下面写的是**设计意图与已知约束**，不是可用性承诺。
:::

## 正确做法：用系统材质

iOS 26 起，系统提供了 Liquid Glass 材质。**不要自己手写着色器** ——
系统材质更好，而且免费。

| API | 用途 |
|---|---|
| `glassEffect(_:in:)` | SwiftUI 单个玻璃元素 |
| `GlassEffectContainer` | SwiftUI 多个玻璃元素融合 |
| `UIGlassEffect` | UIKit 单个玻璃元素 |
| `UIGlassContainerEffect` | UIKit 多个玻璃元素融合 |

```swift
// SwiftUI
Text("内容")
    .padding()
    .glassEffect(.regular, in: .rect(cornerRadius: 26))
```

```swift
// 融合（多个元素粘成一团）
GlassEffectContainer(spacing: 20) {
    HStack(spacing: 12) {
        Circle().frame(width: 56, height: 56).glassEffect()
        Circle().frame(width: 56, height: 56).glassEffect()
    }
}
```

## 最低版本

| 项 | 要求 |
|---|---|
| iOS | **26** |
| Xcode | ≥ 26 |

低于 iOS 26 时系统不提供该材质，需要自己写降级分支。

## 与其它平台的对应关系

| 概念 | iOS | Compose | Web |
|---|---|---|---|
| 单个玻璃 | `UIGlassEffect` | `GlassSurface` | `lg-glass-surface` |
| 融合 | `UIGlassContainerEffect` | `GlassGroup` | `lg-glass-group` |
| 折射实现 | 系统 | AGSL 着色器 | SVG 位移贴图 |
| 降级 | 系统处理 | 需自写 | 自动三级 |

## 本库的 iOS 代码现状

`packages/ios` 目前只有：

- 与其它端同源的 tokens（由 `tools/gen-tokens.py` 生成）
- 组件签名骨架

**没有任何可运行的验证。** 在补齐 macOS 环境之前，iOS 端不应被视为可用。

## 如果要在 iOS 上用本库

建议：

1. 直接用系统 `glassEffect` / `UIGlassEffect` —— 不要移植本库的着色器方案
2. 只复用本库的 **tokens**（圆角、模糊、阴影、配色）
3. 融合用系统的 `GlassEffectContainer`，不要自己实现 SDF

本库的 Compose/Web 实现之所以自己写折射，是因为那些平台**没有系统材质**。
iOS 有，就不该重复造。
