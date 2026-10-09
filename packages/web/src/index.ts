import { defineGlassSurface } from './elements/glass-surface.js'

export { defineGlassSurface, GlassSurfaceElement } from './elements/glass-surface.js'
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

/** 注册全部自定义元素。 */
export function defineAll() {
  defineGlassSurface()
}
