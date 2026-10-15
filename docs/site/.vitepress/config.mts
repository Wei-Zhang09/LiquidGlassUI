import { defineConfig } from 'vitepress'

/**
 * LiquidGlassUI 文档站配置。
 *
 * 结构参考 Element Plus：
 *  - 指南（指南/安装/快速开始/设计原则）
 *  - 组件（每个组件一页，含在线演示 + API 表格）
 *  - 平台（Web / Compose 的能力矩阵与验证状态）
 *
 * 演示直接用 Web Components 标签，无需 Vue 封装 —— 组件本身框架无关。
 */
const BASE = process.env.DOCS_BASE || '/'

export default defineConfig({
  lang: 'zh-CN',
  title: 'LiquidGlassUI',
  description: '跨端液态玻璃 UI 组件库 —— Web / Windows 桌面 / Android',

  /**
   * 部署基路径。
   *
   * GitHub Pages 的项目站点部署在子路径 `/LiquidGlassUI/` 下，
   * 若 `base` 仍为 `/`，所有资源会 404（CSS/JS 都加载不到，页面白屏）。
   * 这是 Pages 部署最常见的失败原因，所以由环境变量显式控制：
   *  - 本地 `npm run dev` / `npm run build`：base = '/'（默认）
   *  - CI 部署：设 `DOCS_BASE=/LiquidGlassUI/`
   */
  base: BASE,

  /**
   * 图标：用户提供的玻璃质感渐变花瓣。
   *  - logo.png     原图细节（导航栏 28px、首页 hero）
   *  - favicon*.png 简化版（提饱和/提对比/去噪/锐化），小尺寸更清晰
   * 详见 tools 里的生成脚本与 docs/screenshots 的对比图。
   */
  /**
   * ⚠️ head 里的 href **不会自动加 base 前缀**（themeConfig.logo 会）。
   * 站点部署在子路径 /LiquidGlassUI/ 下，写死 `/favicon.svg` 会解析成
   * `https://wei-zhang09.github.io/favicon.svg`（根域名，404）。
   * 实测踩过。所以这里显式拼上 `base`。
   */
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: `${BASE}favicon.svg` }],
    ['link', { rel: 'icon', type: 'image/png', sizes: '32x32', href: `${BASE}favicon.png` }],
    ['link', { rel: 'icon', type: 'image/png', sizes: '16x16', href: `${BASE}favicon-16.png` }],
    ['link', { rel: 'apple-touch-icon', sizes: '180x180', href: `${BASE}apple-touch-icon.png` }],
  ],

  themeConfig: {
    logo: '/logo.png',

    /**
     * 导航：**按平台分区**（用户要求三端 UI 分别展示，便于区分）。
     *  - Web      → 浏览器组件（10 个，有在线演示）
     *  - 桌面端   → Compose 桌面形态
     *  - 移动端   → Compose Android 形态
     * 「平台」页保留为三端能力矩阵与选型依据。
     */
    nav: [
      { text: '指南', link: '/guide/' },
      { text: 'Web', link: '/web/' },
      { text: '桌面端', link: '/desktop/' },
      { text: '移动端', link: '/mobile/' },
      { text: '平台矩阵', link: '/platform/' },
      { text: '验证', link: '/verification' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: '指南',
          items: [
            { text: '介绍', link: '/guide/' },
            { text: '安装', link: '/guide/install' },
            { text: '快速开始', link: '/guide/quickstart' },
            { text: '设计原则', link: '/guide/design' },
            { text: '降级策略', link: '/guide/fallback' },
          ],
        },
      ],
      '/web/': [
        {
          text: 'Web 组件',
          items: [
            { text: '总览', link: '/web/' },
          ],
        },
        {
          text: '基础',
          items: [
            { text: 'GlassSurface 玻璃面', link: '/web/glass-surface' },
            { text: 'GlassCard 卡片', link: '/web/glass-card' },
            { text: 'GlassGroup 玻璃组', link: '/web/glass-group' },
          ],
        },
        {
          text: '交互',
          items: [
            { text: 'GlassButton 按钮', link: '/web/glass-button' },
            { text: 'GlassSwitch 开关', link: '/web/glass-switch' },
            { text: 'GlassSlider 滑块', link: '/web/glass-slider' },
            { text: 'GlassSegmented 分段控件', link: '/web/glass-segmented' },
          ],
        },
        {
          text: '导航',
          items: [
            { text: 'GlassNavBar 顶部导航', link: '/web/glass-navbar' },
            { text: 'GlassBottomBar 底部标签栏', link: '/web/glass-bottombar' },
          ],
        },
        {
          text: '反馈',
          items: [
            { text: 'GlassDialog 对话框', link: '/web/glass-dialog' },
          ],
        },
      ],
      '/desktop/': [
        {
          text: '桌面端组件',
          items: [
            { text: '总览', link: '/desktop/' },
          ],
        },
        {
          text: '共用基础',
          items: [
            { text: 'GlassSurface 玻璃面', link: '/desktop/glass-surface' },
            { text: 'GlassGroup 玻璃融合', link: '/desktop/glass-group' },
          ],
        },
        {
          text: '桌面专属形态',
          items: [
            { text: 'GlassSidebar 侧边导航', link: '/desktop/glass-sidebar' },
            { text: 'GlassMenu 下拉菜单', link: '/desktop/glass-menu' },
            { text: 'GlassTooltip 提示框', link: '/desktop/glass-tooltip' },
          ],
        },
      ],
      '/mobile/': [
        {
          text: '移动端组件',
          items: [
            { text: '总览', link: '/mobile/' },
          ],
        },
        {
          text: '移动专属形态',
          items: [
            { text: 'GlassBottomBar 底部标签栏', link: '/mobile/glass-bottombar' },
            { text: 'GlassDialog 底部抽屉', link: '/mobile/glass-dialog' },
          ],
        },
      ],
      '/platform/': [
        {
          text: '平台',
          items: [
            { text: '能力矩阵', link: '/platform/' },
            { text: 'Compose（桌面 / Android）', link: '/platform/compose' },
            { text: 'iOS', link: '/platform/ios' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/Wei-Zhang09/LiquidGlassUI' },
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Made with liquid glass',
    },

    search: {
      provider: 'local',
    },

    outline: {
      label: '本页目录',
      level: [2, 3],
    },

    docFooter: {
      prev: '上一页',
      next: '下一页',
    },

    lastUpdated: {
      text: '最后更新',
    },

    darkModeSwitchLabel: '主题',
    sidebarMenuLabel: '目录',
    returnToTopLabel: '回到顶部',
  },
})
