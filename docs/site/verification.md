# 验证报告

这个库的主张是「真折射」，所以**必须给出证据**，而不是"看起来像"。

下面每一项都标注了验证手段与**未验证的部分**。

## Web

### 像素级验证

| 项 | 手段 | 结果 |
|---|---|---|
| 折射确实发生 | A/B 逐像素对比（位移贴图 scale 归零） | 边缘带 mean **83.4** / max **224**；中心区 **0.0** |
| 降级正确 | 双浏览器实测 | Chromium → `refraction`；Firefox → `frost` |
| 交互 | 真实浏览器驱动 | 19 项检查全过（含 CDP 真实触摸事件） |
| 单元测试 | vitest | **128 个通过** |

### 关键实测结论

- `feDisplacementMap` **确实**能在 `backdrop-filter` 里工作
- 位移被限制在边缘带内：中心 0/72 像素变化，边缘带 50% 像素变化
- **Firefox 静默不渲染**：`CSS.supports` 返回 true、computed style 保留，
  但页面什么都不画 → 只能用 UA 嗅探

## Windows 桌面（Compose）

| 项 | 手段 | 结果 |
|---|---|---|
| 折射确实发生 | A/B 逐像素对比（`LG_NO_LENS=1` 关闭折射） | 边缘 **21.1** / 本底 **0.5** = **42×** |
| 融合确实发生 | 截图 + 对照组（`smoothing=0`） | 花生形 vs 两个独立的圆 |
| 着色器可编译 | `RuntimeEffect.makeForShader` 真实编译 | 4 个测试通过 |
| SDF 数学 | 单元测试 | **24 个通过** |
| 组件测试 | `desktopTest` | **65 个通过** |

### 关键实测结论

- 库自带 `lens()` **只支持圆角矩形**，传自定义 `Shape` 运行时抛异常
  → 改用自定义 AGSL 运行时着色器
- **着色器编译失败是静默的**（返回 null，退化成矩形，不抛错）
  → 必须有真实编译测试

## Android

| 项 | 手段 | 结果 |
|---|---|---|
| 安装启动 | Xiaomi 13 / Android 16 / API 36 | Success，`TotalTime 1183ms`，无致命异常 |
| 折射可见 | 真机截图 + 视觉复核 | ✅ |
| 融合 | 真机截图 + 像素级裁剪复核 | `smoothing=22` 融合 / `smoothing=0` 断开 |
| 无着色器错误 | logcat | ✅ |

### 验证方法上的坑（值得记）

首次看**全图**截图（1080×2400）时，视觉复核报「右侧不可见」。
实际是**全图下采样把玻璃那点细微的条纹扭曲抹掉了**。

正确做法：`adb shell uiautomator dump` 拿控件**真实边界**，
再按边界裁剪放大复核。**在下采样过的截图上判断细微视觉效果不可靠。**

## iOS

| 项 | 结果 |
|---|---|
| 编译 | ❌ **未做**（无 macOS） |
| 运行 | ❌ **未做** |
| 验证 | ❌ **未做** |

iOS 端只有代码骨架。详见 [iOS 平台页](/platform/ios)。

## 测试与工具

| 项 | 数量 |
|---|---|
| Web 单元测试 | 128 |
| Compose 测试 | 65 |
| 真实浏览器检查 | 19 项 |
| 真机验证 | 3 轮（组件、融合、布局） |
| 文档站页面 | 33（含 Compose 7 个组件页） |
| ADR | 4 篇 |

### 验证工具（仓库内）

| 工具 | 用途 |
|---|---|
| `tools/verify-web.py` | Web 折射的像素级 A/B 验证 |
| `tools/verify-web-showcase.py` | 双浏览器组件渲染验证 |
| `tools/verify-web-interaction.py` | 对话框 / 分段控件的真实交互验证 |
| `tools/verify-web-mobile-controls.py` | 开关 / 滑块的指针与触摸验证 |
| `tools/verify-compose.py` | Compose 折射的像素级 A/B 验证 |
| `tools/gen-tokens.py` | 设计参数四端同步生成 |
| `tools/gen-web-background.py` | 高对比测试背景生成 |

## 未验证清单

如实列出，避免"看起来都做完了"：

- **iOS 全部**（无 macOS 环境）
- `GlassTooltip` **长按手势的真机手感** —— 组件已装进真机示例并能渲染，
  8 个单元测试覆盖全部行为，但小米拦 `adb shell input tap`，
  **无法脚本化触发长按**，真机手感未评估
- `GlassGroup` **8 个以上形状**
- 形状数量多时的**性能**（每像素 N 个 SDF + 4 次额外梯度求值）
- **手写笔 / 混合输入设备**

## 架构决策记录

| ADR | 主题 |
|---|---|
| [0001](https://github.com/Wei-Zhang09/LiquidGlassUI/blob/main/docs/adr/0001-component-matrix-and-architecture.md) | 组件矩阵与架构 |
| [0002](https://github.com/Wei-Zhang09/LiquidGlassUI/blob/main/docs/adr/0002-platform-priority-and-desktop.md) | 平台优先级与桌面方案 |
| [0003](https://github.com/Wei-Zhang09/LiquidGlassUI/blob/main/docs/adr/0003-platform-differentiation-evidence.md) | 组件按平台分化的实证依据 |
| [0004](https://github.com/Wei-Zhang09/LiquidGlassUI/blob/main/docs/adr/0004-compose-glass-group-fusion.md) | Compose 端融合实现 |
