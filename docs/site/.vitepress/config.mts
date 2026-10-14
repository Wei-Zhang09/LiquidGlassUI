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
export default defineConfig({
  lang: 'zh-CN',
  title: 'LiquidGlassUI',
  description: '跨端液态玻璃 UI 组件库 —— Web / Windows 桌面 / Android',

  // 站内资源（演示页用的示例背景图等）
  public: 'public',

  themeConfig: {
    logo: undefined,

    nav: [
      { text: '指南', link: '/guide/' },
      { text: '组件', link: '/components/glass-surface' },
      { text: '平台', link: '/platform/' },
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
      '/components/': [
        {
          text: '基础',
          items: [
            { text: 'GlassSurface 玻璃面', link: '/components/glass-surface' },
            { text: 'GlassCard 卡片', link: '/components/glass-card' },
            { text: 'GlassGroup 玻璃组', link: '/components/glass-group' },
          ],
        },
        {
          text: '交互',
          items: [
            { text: 'GlassButton 按钮', link: '/components/glass-button' },
            { text: 'GlassSwitch 开关', link: '/components/glass-switch' },
            { text: 'GlassSlider 滑块', link: '/components/glass-slider' },
            { text: 'GlassSegmented 分段控件', link: '/components/glass-segmented' },
          ],
        },
        {
          text: '导航',
          items: [
            { text: 'GlassNavBar 顶部导航', link: '/components/glass-navbar' },
            { text: 'GlassBottomBar 底部标签栏', link: '/components/glass-bottombar' },
          ],
        },
        {
          text: '反馈',
          items: [
            { text: 'GlassDialog 对话框', link: '/components/glass-dialog' },
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
