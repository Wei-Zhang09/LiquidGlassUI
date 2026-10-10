/**
 * 测试公共设施。
 *
 * jsdom 缺少 ResizeObserver 与 requestAnimationFrame 的完整实现，
 * 组件依赖它们，这里补上最小可用的桩。
 */

import { beforeEach, vi } from 'vitest'

/** 记录所有被观察的元素，便于测试触发尺寸回调。 */
export const resizeCallbacks = new Map<Element, ResizeObserverCallback>()

export function installDomStubs() {
  resizeCallbacks.clear()

  class ResizeObserverStub {
    constructor(private cb: ResizeObserverCallback) {}
    observe(el: Element) {
      resizeCallbacks.set(el, this.cb)
    }
    unobserve(el: Element) {
      resizeCallbacks.delete(el)
    }
    disconnect() {
      resizeCallbacks.clear()
    }
  }

  ;(globalThis as any).ResizeObserver = ResizeObserverStub

  // jsdom 不实现 canvas 2D 上下文，而位移贴图生成依赖它。
  // 这里桩一个最小可用实现：只需 createImageData / putImageData / toDataURL。
  // 注意：这测的是"逻辑链路能否走通"，不是像素结果 —— 像素由
  // tools/verify-web-showcase.py 在真实浏览器里验证。
  HTMLCanvasElement.prototype.getContext = function () {
    return {
      canvas: this,
      createImageData: (w: number, h: number) => ({
        width: w,
        height: h,
        data: new Uint8ClampedArray(w * h * 4),
      }),
      putImageData: () => {},
      getImageData: (_x: number, _y: number, w: number, h: number) => ({
        width: w,
        height: h,
        data: new Uint8ClampedArray(w * h * 4),
      }),
    }
  } as any
  HTMLCanvasElement.prototype.toDataURL = () => 'data:image/png;base64,'

  // jsdom 未实现 SVGFilterElement 构造器，但生产代码用 `instanceof SVGFilterElement`
  // 断言滤镜确实进了 SVG 命名空间（这是防 Chromium 静默丢弃 backdrop-filter 的关键检查）。
  // 这里按命名空间判断给出等价实现，保持断言语义不变。
  if (typeof (globalThis as any).SVGFilterElement === 'undefined') {
    ;(globalThis as any).SVGFilterElement = class SVGFilterElement {}
    const origCreate = document.createElementNS.bind(document)
    document.createElementNS = ((ns: string, name: string) => {
      const el = origCreate(ns, name)
      if (ns === 'http://www.w3.org/2000/svg' && name === 'filter') {
        Object.setPrototypeOf(el, (globalThis as any).SVGFilterElement.prototype)
      }
      return el
    }) as typeof document.createElementNS
  }
  ;(globalThis as any).requestAnimationFrame = (cb: FrameRequestCallback) => {
    cb(0)
    return 1
  }
  ;(globalThis as any).cancelAnimationFrame = () => {}
}

/** 让组件完成一次构建（rAF 已被同步化，无需等待）。 */
export function flush() {
  return new Promise<void>((r) => setTimeout(r, 0))
}

/** 给元素一个固定的尺寸，jsdom 默认所有元素尺寸为 0。 */
export function stubRect(el: Element, width: number, height: number) {
  el.getBoundingClientRect = () =>
    ({
      width,
      height,
      top: 0,
      left: 0,
      right: width,
      bottom: height,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }) as DOMRect
}

/** 模拟支持折射（Chromium）。 */
export function mockRefractionSupport() {
  vi.stubGlobal('navigator', {
    ...globalThis.navigator,
    userAgent: 'Mozilla/5.0 Chrome/151.0.0.0 Safari/537.36',
    userAgentData: {},
  })
  vi.stubGlobal('CSS', {
    supports: (prop: string) => prop === 'backdrop-filter' || prop === '-webkit-backdrop-filter',
  })
}

/** 模拟不支持折射但支持磨砂（Firefox / Safari）。 */
export function mockFrostOnlySupport() {
  vi.stubGlobal('navigator', {
    ...globalThis.navigator,
    userAgent: 'Mozilla/5.0 Firefox/153.0',
  })
  vi.stubGlobal('CSS', { supports: () => true })
}

/** 模拟完全不支持 backdrop-filter。 */
export function mockNoSupport() {
  vi.stubGlobal('navigator', {
    ...globalThis.navigator,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0)',
  })
  vi.stubGlobal('CSS', { supports: () => false })
}

/**
 * 挂载元素。
 *
 * 时序要点：`getBoundingClientRect` 必须在**元素进入 DOM 之前**就设好。
 * 元素的 connectedCallback 会同步跑一次构建（测试里 rAF 是同步的），
 * 若此时尺寸还是 jsdom 默认的 0×0，组件会按"尚未布局"处理（不动档位），
 * 之后再改尺寸也不会重新触发 —— 除非显式再调一次 scheduleBuild。
 *
 * 因此这里分两步：先造元素并设尺寸，再插入 DOM 触发 connectedCallback。
 */
export function mount<T extends HTMLElement>(
  html: string,
  size?: { width: number; height: number },
): T {
  const tpl = document.createElement('div')
  tpl.innerHTML = html
  const el = tpl.firstElementChild as T
  if (!el) throw new Error('mount: html 未产生元素')

  if (size) stubRect(el, size.width, size.height)

  document.body.append(el)
  return el
}

beforeEach(() => {
  installDomStubs()
  document.body.innerHTML = ''
})
