// 本文件由 tools/gen-tokens.py 从 packages/tokens/tokens.json 生成，请勿手工编辑。

export const color = {
  light: {
    tint: 'rgba(255, 255, 255, 0.15)',
    tintStrong: 'rgba(255, 255, 255, 0.28)',
    highlight: 'rgba(255, 255, 255, 0.5)',
    shadow: 'rgba(33, 48, 61, 0.18)',
    innerShadow: 'rgba(102, 128, 150, 0.1)',
    surface: 'rgba(255, 255, 255, 0.44)',
  },
  dark: {
    tint: 'rgba(255, 255, 255, 0.1)',
    tintStrong: 'rgba(255, 255, 255, 0.2)',
    highlight: 'rgba(255, 255, 255, 0.38)',
    shadow: 'rgba(0, 0, 0, 0.45)',
    innerShadow: 'rgba(0, 0, 0, 0.22)',
    surface: 'rgba(255, 255, 255, 0.1)',
  },
} as const

export const radius = {
  sm: 10, md: 18, lg: 26, xl: 32, full: 999,
} as const

export const blur = {
  none: 0, subtle: 8, regular: 16, heavy: 30,
} as const

export const optical = {
  bezelWidth: 14,
  displacementScale: 70,
  ior: 1.5,
  dispersion: 2.0,
  saturation: 140,
  elasticity: 0.15,
  cornerSmoothing: 0.6,
  refractionHeight: 12,
  refractionAmount: 24,
} as const

export const lighting = {
  angle: 45,
  highlightWidth: 0.5,
  highlightAlpha: 1.0,
  specularSharpness: 2.0,
  specularOpacity: 0.45,
} as const

export const motion = {
  fast: 150, regular: 250, slow: 400,
  easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
} as const

export const tokens = { color, radius, blur, optical, lighting, motion } as const
export type Theme = keyof typeof color
