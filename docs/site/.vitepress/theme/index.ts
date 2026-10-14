/**
 * LiquidGlassUI 文档站客户端入口。
 *
 * 1. 引入液态玻璃主题（覆盖 VitePress 默认皮肤）—— dogfooding：
 *    文档站自己就是用本库的材质做的。
 * 2. 注册全部 `lg-*` 自定义元素，并在每次路由切换后接线演示交互。
 *
 * ## 为什么组件注册必须是动态 import
 * `packages/web/src` 里的组件在**模块顶层**就 `extends HTMLElement`。
 * VitePress 构建时会做 SSR —— 在 Node 里求值该模块会直接抛
 * `ReferenceError: HTMLElement is not defined`，**生产构建失败**。
 *
 * 因此注册代码放在 `if (inBrowser)` 里用动态 `import()`：
 * 模块只在浏览器中加载，SSR 阶段完全不求值。
 *
 * （dev 模式不做 SSR，所以这个错误只在 `vitepress build` 时暴露。）
 */
import DefaultTheme from 'vitepress/theme'
import { inBrowser } from 'vitepress'
import './custom.css'
import './demo.css'

/** 只在浏览器里注册组件 + 启动演示接线。幂等。 */
async function setupDemos(): Promise<void> {
  const [{ defineAll }, { startDemoWiring }] = await Promise.all([
    import('../../../../packages/web/src/index.ts'),
    import('./demo-wire'),
  ])
  defineAll()
  // MutationObserver 驱动：ClientOnly 内容异步挂载后自动接线
  startDemoWiring()
}

export default {
  extends: DefaultTheme,
  enhanceApp({ router }) {
    if (!inBrowser) return

    let ready = false
    const run = () => {
      if (!ready) {
        setupDemos().catch((err) => console.error('[lg-docs] 初始化失败', err))
        ready = true
      }
      // 路由切换后无需手动接线：MutationObserver 会捕获新插入的演示元素
    }

    router.onAfterRouteChanged = run
    if (document.readyState === 'complete') run()
    else window.addEventListener('load', run)
  },
}
