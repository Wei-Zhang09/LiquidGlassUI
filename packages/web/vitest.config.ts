import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // 组件是纯 DOM/CSS，jsdom 足够且可在 CI 无头运行。
    // 真实渲染与折射效果由 tools/verify-web-showcase.py（Playwright）验证，
    // 两者分工：这里测逻辑（事件、属性、状态、降级），那里测像素。
    environment: 'jsdom',
    include: ['tests/**/*.test.ts'],
    globals: false,
    restoreMocks: true,
    // 关键：restoreMocks 只恢复 vi.fn()，**不恢复 vi.stubGlobal**。
    // 不打开这个开关，前一个用例 stub 的 navigator / CSS 会泄漏到下一个用例，
    // 导致门控测试随机失败（曾因此误判为产品缺陷）。
    unstubGlobals: true,
    clearMocks: true,
  },
})
