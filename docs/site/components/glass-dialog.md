# GlassDialog 对话框

模态对话框。自绘遮罩，含焦点陷阱与焦点归还。

## 基础用法

<ClientOnly>

<div class="lg-demo is-center">
  <lg-glass-button data-demo="open-dialog" data-demo-target="demo-dlg" variant="primary">打开对话框</lg-glass-button>
  <span class="lg-out" data-demo-out="dialog">未打开</span>
</div>

</ClientOnly>

<lg-glass-dialog id="demo-dlg" heading="确认删除" radius="26">
  <p style="margin:0 0 4px">此操作不可撤销。</p>
  <p style="margin:0;font-size:13px;opacity:.8">按 ESC 或点遮罩关闭。</p>
  <lg-glass-button slot="footer" radius="16">取消</lg-glass-button>
  <lg-glass-button slot="footer" radius="16" variant="danger">删除</lg-glass-button>
</lg-glass-dialog>

```html
<lg-glass-dialog id="dlg" heading="确认删除">
  <p>此操作不可撤销。</p>
  <lg-glass-button slot="footer">取消</lg-glass-button>
  <lg-glass-button slot="footer" variant="danger">删除</lg-glass-button>
</lg-glass-dialog>

<script>
  document.getElementById('open-btn').addEventListener('click', () => {
    document.getElementById('dlg').setAttribute('open', '')
  })
  document.getElementById('dlg').addEventListener('lg-close', () => {
    console.log('对话框已关闭')
  })
</script>
```

## 关闭方式

三种都支持：

| 方式 | 说明 |
|---|---|
| `ESC` | 键盘关闭 |
| 点击遮罩 | 面板外的遮罩区域 |
| 移除 `open` 属性 | 程序化关闭 |

关闭时派发 `lg-close` 事件。

## 为什么不用原生 `<dialog>`

原生 `<dialog>` 的 `::backdrop` **不支持 `backdrop-filter`** —— 玻璃会退化成
普通半透明块。因此本组件自绘遮罩。

## 为什么对话框不参与折射

对话框盖在全屏遮罩上，背后没有值得采样的内容 —— 折射它没有意义。
因此对话框**不走折射路径**，而是用更实的底（不透明度约 0.82）保证文字可读。

::: warning 模态面板的透明度预算和普通玻璃不同
普通玻璃可以很透（它盖在装饰性内容上）；模态框承载必须可读的文字，
所以用**专用的更高不透明度**。可读性优先于材质还原。

这个失败**在 DOM 层测试里看不出来**（jsdom 不算样式），只在渲染截图里
才暴露 —— 这个坑我们踩过。
:::

## API

### Attributes

| 属性 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `open` | `boolean` | — | 存在即显示。移除即关闭 |
| `heading` | `string` | — | 标题。为空时标题区隐藏 |
| `radius` | `number` | `26` | 圆角像素值 |
| `level` | `'plain' \| 'regular' \| 'elevated' \| 'focused'` | `'regular'` | 材质层级 |
| `surface` | 见 [GlassSurface](/components/glass-surface) | `'convexSquircle'` | 边缘高度函数 |
| `theme` | `'light' \| 'dark'` | `'light'` | 配色主题 |

### Slots

| 名称 | 说明 |
|---|---|
| default | 对话框正文 |
| `footer` | 底部操作区 |

### Events

| 名称 | 详情 | 说明 |
|---|---|---|
| `lg-close` | — | 关闭时触发（ESC、点遮罩、或移除 `open`） |

### 无障碍

| 特性 | 实现 |
|---|---|
| 角色 | `role="dialog"` + `aria-modal="true"` |
| 焦点陷阱 | 打开时焦点移入面板，Tab 循环限制在面板内 |
| 焦点归还 | 关闭时焦点回到打开前的元素 |
| 键盘 | `ESC` 关闭 |
| 滚动锁定 | 打开时锁定页面滚动 |

### 已知限制

- 需要父容器铺满可用区域，否则遮罩不完整
- 未实现多层对话框的堆叠管理
