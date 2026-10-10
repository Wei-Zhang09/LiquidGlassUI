import { defineGlassSurface } from './elements/glass-surface.js'
import { defineGlassButton } from './elements/glass-button.js'
import { defineGlassCard } from './elements/glass-card.js'
import { defineGlassNavBar } from './elements/glass-navbar.js'
import { defineGlassBottomBar } from './elements/glass-bottombar.js'

export { GlassElementBase, SHARED_CSS, LEVEL_BLUR } from './elements/glass-base.js'
export type { SupportLevel } from './elements/glass-base.js'

export { defineGlassSurface, GlassSurfaceElement } from './elements/glass-surface.js'
export { defineGlassButton, GlassButtonElement } from './elements/glass-button.js'
export { defineGlassCard, GlassCardElement } from './elements/glass-card.js'
export { defineGlassNavBar, GlassNavBarElement } from './elements/glass-navbar.js'
export { defineGlassBottomBar, GlassBottomBarElement } from './elements/glass-bottombar.js'

export { acquireFilter, __resetFilterRegistry, __filterCount } from './core/filter-registry.js'
export {
  isGlassRefractionSupported,
  isBackdropFilterSupported,
  getGlassCapabilities,
} from './capabilities.js'
export {
  refractionProfile,
  createDisplacementMap,
  buildDisplacementMap,
  surfaceFns,
} from './refraction.js'
export type { SurfaceHeightFn, Vec2, DisplacementMapOptions } from './refraction.js'
export { color, radius, blur, optical, lighting, motion, tokens } from './generated/tokens.js'
export type { Theme } from './generated/tokens.js'

/** 注册全部自定义元素。幂等。 */
export function defineAll() {
  defineGlassSurface()
  defineGlassButton()
  defineGlassCard()
  defineGlassNavBar()
  defineGlassBottomBar()
}
