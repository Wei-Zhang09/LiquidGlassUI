#!/usr/bin/env python3
"""从 packages/tokens/tokens.json 生成四端原生常量。

唯一真源是 tokens.json。任何手改生成物的行为都会在下一次生成时被覆盖。

用法：
    python tools/gen-tokens.py            # 生成
    python tools/gen-tokens.py --check    # 只校验是否同步（CI 用，不写文件）
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "packages" / "tokens" / "tokens.json"

HEADER = "本文件由 tools/gen-tokens.py 从 packages/tokens/tokens.json 生成，请勿手工编辑。"


def load() -> dict:
    with SRC.open(encoding="utf-8") as f:
        return json.load(f)


def rgba(c: dict) -> str:
    return f"rgba({round(c['r']*255)}, {round(c['g']*255)}, {round(c['b']*255)}, {c['a']})"


# ---------------------------------------------------------------- TypeScript
def gen_ts(t: dict) -> str:
    L, D = t["color"]["light"], t["color"]["dark"]
    o, li, m = t["optical"], t["lighting"], t["motion"]
    r, b = t["radius"], t["blur"]

    def theme(name: str, c: dict) -> str:
        return f"""  {name}: {{
    tint: '{rgba(c['tint'])}',
    tintStrong: '{rgba(c['tintStrong'])}',
    highlight: '{rgba(c['highlight'])}',
    shadow: '{rgba(c['shadow'])}',
    innerShadow: '{rgba(c['innerShadow'])}',
    surface: '{rgba(c['surface'])}',
    overlay: '{rgba(c['overlay'])}',
    surfaceModal: '{rgba(c['surfaceModal'])}',
  }},"""

    return f"""// {HEADER}

export const color = {{
{theme('light', L)}
{theme('dark', D)}
}} as const

export const radius = {{
  sm: {r['sm']}, md: {r['md']}, lg: {r['lg']}, xl: {r['xl']}, full: {r['full']},
}} as const

export const blur = {{
  none: {b['none']}, subtle: {b['subtle']}, regular: {b['regular']}, heavy: {b['heavy']},
}} as const

export const optical = {{
  bezelWidth: {o['bezelWidth']},
  displacementScale: {o['displacementScale']},
  ior: {o['ior']},
  dispersion: {o['dispersion']},
  saturation: {o['saturation']},
  elasticity: {o['elasticity']},
  cornerSmoothing: {o['cornerSmoothing']},
  refractionHeight: {o['refractionHeight']},
  refractionAmount: {o['refractionAmount']},
}} as const

export const lighting = {{
  angle: {li['angle']},
  highlightWidth: {li['highlightWidth']},
  highlightAlpha: {li['highlightAlpha']},
  specularSharpness: {li['specularSharpness']},
  specularOpacity: {li['specularOpacity']},
}} as const

export const motion = {{
  fast: {m['fast']}, regular: {m['regular']}, slow: {m['slow']},
  easing: '{m['easing']}',
}} as const

export const tokens = {{ color, radius, blur, optical, lighting, motion }} as const
export type Theme = keyof typeof color
"""


# -------------------------------------------------------------------- Kotlin
def gen_kt(t: dict) -> str:
    L, D = t["color"]["light"], t["color"]["dark"]
    o, li, m = t["optical"], t["lighting"], t["motion"]
    r, b = t["radius"], t["blur"]

    def kcolor(c: dict) -> str:
        return (f"Color({c['r']:.4f}f, {c['g']:.4f}f, {c['b']:.4f}f, {c['a']:.4f}f)")

    def theme(name: str, c: dict) -> str:
        return f"""    val {name} = GlassColors(
        tint = {kcolor(c['tint'])},
        tintStrong = {kcolor(c['tintStrong'])},
        highlight = {kcolor(c['highlight'])},
        shadow = {kcolor(c['shadow'])},
        innerShadow = {kcolor(c['innerShadow'])},
        surface = {kcolor(c['surface'])},
    )"""

    return f"""// {HEADER}

package com.weizhang09.liquidglass.tokens

import androidx.compose.runtime.Immutable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

@Immutable
data class GlassColors(
    val tint: Color,
    val tintStrong: Color,
    val highlight: Color,
    val shadow: Color,
    val innerShadow: Color,
    val surface: Color,
)

object GlassColorTokens {{
{theme('Light', L)}

{theme('Dark', D)}
}}

object GlassRadiusTokens {{
    val sm = {r['sm']}.dp
    val md = {r['md']}.dp
    val lg = {r['lg']}.dp
    val xl = {r['xl']}.dp
    val full = {r['full']}.dp
}}

object GlassBlurTokens {{
    val none = {b['none']}.dp
    val subtle = {b['subtle']}.dp
    val regular = {b['regular']}.dp
    val heavy = {b['heavy']}.dp
}}

object GlassOpticalTokens {{
    const val BEZEL_WIDTH = {o['bezelWidth']}f
    const val DISPLACEMENT_SCALE = {o['displacementScale']}f
    const val IOR = {o['ior']}f
    const val DISPERSION = {o['dispersion']}f
    const val SATURATION = {o['saturation']}f
    const val ELASTICITY = {o['elasticity']}f
    const val CORNER_SMOOTHING = {o['cornerSmoothing']}f
    const val REFRACTION_HEIGHT = {o['refractionHeight']}f
    const val REFRACTION_AMOUNT = {o['refractionAmount']}f
}}

object GlassLightingTokens {{
    const val ANGLE = {li['angle']}f
    const val HIGHLIGHT_WIDTH = {li['highlightWidth']}f
    const val HIGHLIGHT_ALPHA = {li['highlightAlpha']}f
    const val SPECULAR_SHARPNESS = {li['specularSharpness']}f
    const val SPECULAR_OPACITY = {li['specularOpacity']}f
}}

object GlassMotionTokens {{
    const val FAST = {m['fast']}
    const val REGULAR = {m['regular']}
    const val SLOW = {m['slow']}
    const val EASING = "{m['easing']}"
}}
"""


# --------------------------------------------------------------------- Swift
def gen_swift(t: dict) -> str:
    L, D = t["color"]["light"], t["color"]["dark"]
    o, li, m = t["optical"], t["lighting"], t["motion"]
    r, b = t["radius"], t["blur"]

    def scolor(c: dict) -> str:
        return (f"GlassColor(red: {c['r']:.4f}, green: {c['g']:.4f}, "
                f"blue: {c['b']:.4f}, alpha: {c['a']:.4f})")

    def theme(name: str, c: dict) -> str:
        return f"""    public static let {name} = GlassColors(
        tint: {scolor(c['tint'])},
        tintStrong: {scolor(c['tintStrong'])},
        highlight: {scolor(c['highlight'])},
        shadow: {scolor(c['shadow'])},
        innerShadow: {scolor(c['innerShadow'])},
        surface: {scolor(c['surface'])}
    )"""

    return f"""// {HEADER}

import Foundation

public struct GlassColor: Sendable, Equatable {{
    public let red: Double
    public let green: Double
    public let blue: Double
    public let alpha: Double

    public init(red: Double, green: Double, blue: Double, alpha: Double) {{
        self.red = red
        self.green = green
        self.blue = blue
        self.alpha = alpha
    }}
}}

public struct GlassColors: Sendable {{
    public let tint: GlassColor
    public let tintStrong: GlassColor
    public let highlight: GlassColor
    public let shadow: GlassColor
    public let innerShadow: GlassColor
    public let surface: GlassColor
}}

public enum GlassColorTokens {{
{theme('light', L)}

{theme('dark', D)}
}}

public enum GlassRadiusTokens {{
    public static let sm: Double = {r['sm']}
    public static let md: Double = {r['md']}
    public static let lg: Double = {r['lg']}
    public static let xl: Double = {r['xl']}
    public static let full: Double = {r['full']}
}}

public enum GlassBlurTokens {{
    public static let none: Double = {b['none']}
    public static let subtle: Double = {b['subtle']}
    public static let regular: Double = {b['regular']}
    public static let heavy: Double = {b['heavy']}
}}

public enum GlassOpticalTokens {{
    public static let bezelWidth: Double = {o['bezelWidth']}
    public static let displacementScale: Double = {o['displacementScale']}
    public static let ior: Double = {o['ior']}
    public static let dispersion: Double = {o['dispersion']}
    public static let saturation: Double = {o['saturation']}
    public static let elasticity: Double = {o['elasticity']}
    public static let cornerSmoothing: Double = {o['cornerSmoothing']}
    public static let refractionHeight: Double = {o['refractionHeight']}
    public static let refractionAmount: Double = {o['refractionAmount']}
}}

public enum GlassLightingTokens {{
    public static let angle: Double = {li['angle']}
    public static let highlightWidth: Double = {li['highlightWidth']}
    public static let highlightAlpha: Double = {li['highlightAlpha']}
    public static let specularSharpness: Double = {li['specularSharpness']}
    public static let specularOpacity: Double = {li['specularOpacity']}
}}

public enum GlassMotionTokens {{
    public static let fast: Int = {m['fast']}
    public static let regular: Int = {m['regular']}
    public static let slow: Int = {m['slow']}
    public static let easing: String = "{m['easing']}"
}}
"""


# ------------------------------------------------------------------------ CSS
def gen_css(t: dict) -> str:
    L, D = t["color"]["light"], t["color"]["dark"]
    o, li, m = t["optical"], t["lighting"], t["motion"]
    r, b = t["radius"], t["blur"]

    def block(sel: str, c: dict) -> str:
        return f"""{sel} {{
  --lg-tint: {rgba(c['tint'])};
  --lg-tint-strong: {rgba(c['tintStrong'])};
  --lg-highlight: {rgba(c['highlight'])};
  --lg-shadow: {rgba(c['shadow'])};
  --lg-inner-shadow: {rgba(c['innerShadow'])};
  --lg-surface: {rgba(c['surface'])};
}}"""

    return f"""/* {HEADER} */

:root {{
  --lg-radius-sm: {r['sm']}px;
  --lg-radius-md: {r['md']}px;
  --lg-radius-lg: {r['lg']}px;
  --lg-radius-xl: {r['xl']}px;
  --lg-radius-full: {r['full']}px;

  --lg-blur-none: {b['none']}px;
  --lg-blur-subtle: {b['subtle']}px;
  --lg-blur-regular: {b['regular']}px;
  --lg-blur-heavy: {b['heavy']}px;

  --lg-bezel-width: {o['bezelWidth']}px;
  --lg-displacement-scale: {o['displacementScale']};
  --lg-ior: {o['ior']};
  --lg-dispersion: {o['dispersion']};
  --lg-saturation: {o['saturation']}%;
  --lg-elasticity: {o['elasticity']};
  --lg-corner-smoothing: {o['cornerSmoothing']};

  --lg-light-angle: {li['angle']}deg;
  --lg-highlight-width: {li['highlightWidth']}px;
  --lg-highlight-alpha: {li['highlightAlpha']};
  --lg-specular-sharpness: {li['specularSharpness']};
  --lg-specular-opacity: {li['specularOpacity']};

  --lg-motion-fast: {m['fast']}ms;
  --lg-motion-regular: {m['regular']}ms;
  --lg-motion-slow: {m['slow']}ms;
  --lg-easing: {m['easing']};
}}

{block('[data-lg-theme="light"]', L)}

{block('[data-lg-theme="dark"]', D)}
"""


TARGETS = {
    "packages/web/src/generated/tokens.ts": gen_ts,
    "packages/web/src/generated/tokens.css": gen_css,
    "packages/rn/src/generated/tokens.ts": gen_ts,
    "packages/compose/src/commonMain/kotlin/com/weizhang09/liquidglass/tokens/GeneratedTokens.kt": gen_kt,
    "packages/apple/Sources/LiquidGlassTokens/GeneratedTokens.swift": gen_swift,
}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true", help="只校验同步状态，不写文件")
    args = ap.parse_args()

    t = load()
    stale, written = [], []

    for rel, fn in TARGETS.items():
        path = ROOT / rel
        content = fn(t)
        if args.check:
            current = path.read_text(encoding="utf-8") if path.exists() else None
            if current != content:
                stale.append(rel)
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(content, encoding="utf-8", newline="\n")
            written.append(rel)

    if args.check:
        if stale:
            print("以下生成物与 tokens.json 不同步：", file=sys.stderr)
            for s in stale:
                print(f"  {s}", file=sys.stderr)
            print("\n运行 `python tools/gen-tokens.py` 重新生成。", file=sys.stderr)
            return 1
        print(f"OK — {len(TARGETS)} 个生成物均与 tokens.json 同步。")
        return 0

    for w in written:
        print(f"  写入 {w}")
    print(f"\n完成：{len(written)} 个文件。源：packages/tokens/tokens.json")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
