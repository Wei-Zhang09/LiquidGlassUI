// 本文件由 tools/gen-tokens.py 从 packages/tokens/tokens.json 生成，请勿手工编辑。

import Foundation

public struct GlassColor: Sendable, Equatable {
    public let red: Double
    public let green: Double
    public let blue: Double
    public let alpha: Double

    public init(red: Double, green: Double, blue: Double, alpha: Double) {
        self.red = red
        self.green = green
        self.blue = blue
        self.alpha = alpha
    }
}

public struct GlassColors: Sendable {
    public let tint: GlassColor
    public let tintStrong: GlassColor
    public let highlight: GlassColor
    public let shadow: GlassColor
    public let innerShadow: GlassColor
    public let surface: GlassColor
}

public enum GlassColorTokens {
    public static let light = GlassColors(
        tint: GlassColor(red: 1.0000, green: 1.0000, blue: 1.0000, alpha: 0.1500),
        tintStrong: GlassColor(red: 1.0000, green: 1.0000, blue: 1.0000, alpha: 0.2800),
        highlight: GlassColor(red: 1.0000, green: 1.0000, blue: 1.0000, alpha: 0.5000),
        shadow: GlassColor(red: 0.1300, green: 0.1900, blue: 0.2400, alpha: 0.1800),
        innerShadow: GlassColor(red: 0.4000, green: 0.5000, blue: 0.5900, alpha: 0.1000),
        surface: GlassColor(red: 1.0000, green: 1.0000, blue: 1.0000, alpha: 0.4400),
        overlay: GlassColor(red: 0.0700, green: 0.1000, blue: 0.1400, alpha: 0.5500),
        surfaceModal: GlassColor(red: 1.0000, green: 1.0000, blue: 1.0000, alpha: 0.8200)
    )

    public static let dark = GlassColors(
        tint: GlassColor(red: 1.0000, green: 1.0000, blue: 1.0000, alpha: 0.1000),
        tintStrong: GlassColor(red: 1.0000, green: 1.0000, blue: 1.0000, alpha: 0.2000),
        highlight: GlassColor(red: 1.0000, green: 1.0000, blue: 1.0000, alpha: 0.3800),
        shadow: GlassColor(red: 0.0000, green: 0.0000, blue: 0.0000, alpha: 0.4500),
        innerShadow: GlassColor(red: 0.0000, green: 0.0000, blue: 0.0000, alpha: 0.2200),
        surface: GlassColor(red: 1.0000, green: 1.0000, blue: 1.0000, alpha: 0.1000),
        overlay: GlassColor(red: 0.0000, green: 0.0000, blue: 0.0000, alpha: 0.6800),
        surfaceModal: GlassColor(red: 0.1200, green: 0.1500, blue: 0.2000, alpha: 0.8600)
    )
}

public enum GlassRadiusTokens {
    public static let sm: Double = 10
    public static let md: Double = 18
    public static let lg: Double = 26
    public static let xl: Double = 32
    public static let full: Double = 999
}

public enum GlassBlurTokens {
    public static let none: Double = 0
    public static let subtle: Double = 8
    public static let regular: Double = 16
    public static let heavy: Double = 30
}

public enum GlassOpticalTokens {
    public static let bezelWidth: Double = 14
    public static let displacementScale: Double = 70
    public static let ior: Double = 1.5
    public static let dispersion: Double = 2.0
    public static let saturation: Double = 140
    public static let elasticity: Double = 0.15
    public static let cornerSmoothing: Double = 0.6
    public static let refractionHeight: Double = 12
    public static let refractionAmount: Double = 24
}

public enum GlassLightingTokens {
    public static let angle: Double = 45
    public static let highlightWidth: Double = 0.5
    public static let highlightAlpha: Double = 1.0
    public static let specularSharpness: Double = 2.0
    public static let specularOpacity: Double = 0.45
}

public enum GlassMotionTokens {
    public static let fast: Int = 150
    public static let regular: Int = 250
    public static let slow: Int = 400
    public static let easing: String = "cubic-bezier(0.25, 0.1, 0.25, 1)"
}
