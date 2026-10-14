/**
 * 演示页的交互接线。
 *
 * 为什么不用每页的 `<script setup>`：VitePress 是 SPA，
 * 页面切换后 `onMounted` 的时机与元素存在性都不好保证。
 * 统一在路由切换后按 `data-*` 属性接线，简单且可复用。
 *
 * 用法（在 markdown 里）：
 *   <lg-glass-button data-demo="counter">点我</lg-glass-button>
 *   <span data-demo-out="counter">点击次数：0</span>
 */

type Wire = (root: ParentNode) => void

/** 幂等标记：避免同一元素被重复接线 */
const WIRED = 'lgDemoWired'

function wire(root: ParentNode, selector: string, fn: (el: HTMLElement) => void): void {
  root.querySelectorAll<HTMLElement>(selector).forEach((el) => {
    if (el.dataset[WIRED]) return
    el.dataset[WIRED] = '1'
    fn(el)
  })
}

const wires: Wire[] = [
  // ---- 按钮：点击计数 ----
  (root) => {
    wire(root, '[data-demo="counter"]', (el) => {
      const name = el.dataset.demoName ?? 'counter'
      const out = root.querySelector<HTMLElement>(`[data-demo-out="${name}"]`)
      let n = 0
      el.addEventListener('click', () => {
        if (out) out.textContent = `点击次数：${++n}`
      })
    })
  },

  // ---- 开关：同步输出 ----
  (root) => {
    wire(root, 'lg-glass-switch[data-demo="switch"]', (el) => {
      const name = el.getAttribute('data-demo-name') ?? 'switch'
      const out = root.querySelector<HTMLElement>(`[data-demo-out="${name}"]`)
      const sync = () => {
        if (out) out.textContent = `当前：${(el as any).checked ? '开' : '关'}`
      }
      el.addEventListener('lg-change', sync)
      sync()
    })
  },

  // ---- 滑块：同步输出 ----
  (root) => {
    wire(root, 'lg-glass-slider[data-demo="slider"]', (el) => {
      const name = el.getAttribute('data-demo-name') ?? 'slider'
      const out = root.querySelector<HTMLElement>(`[data-demo-out="${name}"]`)
      const sync = () => {
        if (out) out.textContent = `值：${(el as any).value}`
      }
      el.addEventListener('lg-change', sync)
      sync()
    })
  },

  // ---- 分段控件：同步输出 ----
  (root) => {
    wire(root, 'lg-glass-segmented[data-demo="segmented"]', (el) => {
      const name = el.getAttribute('data-demo-name') ?? 'segmented'
      const out = root.querySelector<HTMLElement>(`[data-demo-out="${name}"]`)
      const sync = () => {
        if (out) out.textContent = `选中：${(el as any).value}`
      }
      el.addEventListener('lg-change', sync)
      sync()
    })
  },

  // ---- 对话框：开 / 关 ----
  (root) => {
    wire(root, '[data-demo="open-dialog"]', (el) => {
      const id = el.dataset.demoTarget
      const dlg = id ? root.querySelector<HTMLElement>(`#${id}`) : null
      if (!dlg) return
      el.addEventListener('click', () => dlg.setAttribute('open', ''))
      const out = root.querySelector<HTMLElement>(`[data-demo-out="dialog"]`)
      let closes = 0
      dlg.addEventListener('lg-close', () => {
        if (out) out.textContent = `已关闭 ${++closes} 次`
      })
    })
  },

  // ---- 底部标签栏：切换选中 ----
  (root) => {
    wire(root, 'lg-glass-bottombar[data-demo="tabs"]', (el) => {
      const items = [...el.querySelectorAll<HTMLElement>('button')]
      const out = root.querySelector<HTMLElement>('[data-demo-out="tabs"]')
      items.forEach((btn) => {
        btn.addEventListener('click', () => {
          items.forEach((b) => b.removeAttribute('aria-selected'))
          btn.setAttribute('aria-selected', 'true')
          if (out) out.textContent = `选中：${btn.textContent?.trim()}`
        })
      })
    })
  },

  // ---- 顶部导航：点击项 ----
  (root) => {
    wire(root, 'lg-glass-navbar[data-demo="navbar"]', (el) => {
      const out = root.querySelector<HTMLElement>('[data-demo-out="navbar"]')
      el.querySelectorAll<HTMLElement>('a').forEach((a) => {
        a.addEventListener('click', (e) => {
          e.preventDefault()
          if (out) out.textContent = `点击：${a.textContent?.trim()}`
        })
      })
    })
  },
]

/** 在指定根节点上接线（幂等）。 */
export function wireDemos(root: ParentNode = document): void {
  for (const w of wires) {
    try {
      w(root)
    } catch (err) {
      // 单个演示接线失败不该影响整页
      console.warn('[lg-docs] 演示接线失败', err)
    }
  }
}

/**
 * 启动自动接线。
 *
 * ## 为什么需要 MutationObserver 而不是"路由切换后跑一次"
 * 演示区包在 `<ClientOnly>` 里（为了避开 SSR 水合不一致），
 * 而 ClientOnly 的内容是**异步挂载**的 —— 在路由切换回调里立刻接线，
 * 元素还不存在，事件绑不上（表现为"初始状态不同步、点击无反应"）。
 *
 * 用 MutationObserver 观察 DOM 变化，元素一出现就接线。
 * `wireDemos` 是幂等的（`data-lgDemoWired` 标记），重复触发安全。
 */
export function startDemoWiring(): void {
  let scheduled = false

  const run = () => {
    scheduled = false
    wireDemos(document)
  }

  const schedule = () => {
    if (scheduled) return
    scheduled = true
    // 合并同一批 DOM 变化，避免每个节点都触发一次全量接线
    requestAnimationFrame(run)
  }

  schedule()
  if (document.readyState !== 'complete') {
    window.addEventListener('load', schedule)
  }

  // ClientOnly 挂载与 SPA 路由切换都会异步插入节点
  new MutationObserver(schedule).observe(document.body, {
    childList: true,
    subtree: true,
  })
}
