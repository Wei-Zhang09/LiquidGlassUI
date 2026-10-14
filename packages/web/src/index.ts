import { defineGlassSurface } from './elements/glass-surface.js'
import { defineGlassButton } from './elements/glass-button.js'
import { defineGlassCard } from './elements/glass-card.js'
import { defineGlassNavBar } from './elements/glass-navbar.js'
import { defineGlassBottomBar } from './elements/glass-bottombar.js'
import { defineGlassGroup } from './elements/glass-group.js'
import { defineGlassDialog } from './elements/glass-dialog.js'
import { defineGlassSegmented } from './elements/glass-segmented.js'
import { defineGlassSwitch } from './elements/glass-switch.js'
import { defineGlassSlider } from './elements/glass-slider.js'

export { GlassElementBase, SHARED_CSS, LEVEL_BLUR } from './elements/glass-base.js'
export type { SupportLevel } from './elements/glass-base.js'

export { defineGlassSurface, GlassSurfaceElement } from './elements/glass-surface.js'
export { defineGlassButton, GlassButtonElement } from './elements/glass-button.js'
export { defineGlassCard, GlassCardElement } from './elements/glass-card.js'
export { defineGlassNavBar, GlassNavBarElement } from './elements/glass-navbar.js'
export { defineGlassBottomBar, GlassBottomBarElement } from './elements/glass-bottombar.js'
export { defineGlassGroup, GlassGroupElement } from './elements/glass-group.js'
export { defineGlassDialog, GlassDialogElement } from './elements/glass-dialog.js'
export { defineGlassSegmented, GlassSegmentedElement } from './elements/glass-segmented.js'
export { defineGlassSwitch, GlassSwitchElement } from './elements/glass-switch.js'
export { defineGlassSlider, GlassSliderElement } from './elements/glass-slider.js'

export { acquireFilter, registerFusedFilter, __resetFilterRegistry, __filterCount } from './core/filter-registry.js'
export {
  sdRoundedRect,
  shapeDistance,
  sminPoly,
  fusedDistance,
  fusedGradient,
  normalize,
  createFusedDisplacementMap,
} from './sdf.js'
export type { RectShape, FusedDisplacementOptions } from './sdf.js'
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
  defineGlassGroup()
  defineGlassDialog()
  defineGlassSegmented()
  defineGlassSwitch()
  defineGlassSlider()
}
