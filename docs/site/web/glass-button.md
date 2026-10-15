# GlassButton 按钮

玻璃按钮。支持三种视觉变体。

## 基础用法

<ClientOnly>

<div class="lg-demo is-center">
  <lg-glass-button>默认按钮</lg-glass-button>
  <lg-glass-button variant="primary">主要按钮</lg-glass-button>
  <lg-glass-button variant="danger">危险按钮</lg-glass-button>
  <lg-glass-button disabled>禁用按钮</lg-glass-button>
</div>

</ClientOnly>

```html
<lg-glass-button>默认按钮</lg-glass-button>
<lg-glass-button variant="primary">主要按钮</lg-glass-button>
<lg-glass-button variant="danger">危险按钮</lg-glass-button>
<lg-glass-button disabled>禁用按钮</lg-glass-button>
```

## 圆角

<ClientOnly>

<div class="lg-demo is-center">
  <lg-glass-button radius="8">radius=8</lg-glass-button>
  <lg-glass-button radius="18">radius=18</lg-glass-button>
  <lg-glass-button radius="999">radius=999（胶囊）</lg-glass-button>
</div>

</ClientOnly>

```html
<lg-glass-button radius="8">radius=8</lg-glass-button>
<lg-glass-button radius="18">radius=18</lg-glass-button>
<lg-glass-button radius="999">radius=999（胶囊）</lg-glass-button>
```

## 点击

<ClientOnly>

<div class="lg-demo is-center">
  <lg-glass-button data-demo="counter" data-demo-name="btn" variant="primary">点我</lg-glass-button>
  <span class="lg-out" data-demo-out="btn">点击次数：0</span>
</div>

</ClientOnly>

```html
<lg-glass-button id="btn-demo" variant="primary">点我</lg-glass-button>
<span id="btn-out">点击次数：0</span>
<script>
  let n = 0
  const out = document.getElementById('btn-out')
  document.getElementById('btn-demo')
    .addEventListener('click', () => { out.textContent = `点击次数：${++n}` })
</script>
```

## API

### Attributes

| 属性 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `variant` | `'default' \| 'primary' \| 'danger'` | `'default'` | 视觉变体 |
| `disabled` | `boolean` | — | 存在即禁用。禁用时不可点击、移出 Tab 顺序 |
| `radius` | `number` | `26` | 圆角像素值 |
| `level` | `'plain' \| 'regular' \| 'elevated' \| 'focused'` | `'regular'` | 材质层级 |
| `surface` | 见 [GlassSurface](/web/glass-surface) | `'convexSquircle'` | 边缘高度函数 |
| `theme` | `'light' \| 'dark'` | `'light'` | 配色主题 |

### CSS 自定义属性

继承 [GlassSurface](/web/glass-surface) 的全部变量，另加：

| 变量 | 说明 |
|---|---|
| `--lg-button-padding` | 内边距 |
| `--lg-button-font-size` | 字号 |

### Slots

| 名称 | 说明 |
|---|---|
| default | 按钮文字 / 内容 |

### Events

| 名称 | 说明 |
|---|---|
| `click` | 原生点击事件（禁用时不触发） |

::: tip 为什么不用 `lg-click`
按钮直接用原生 `click` —— 它是标准 HTML 交互，包一层自定义事件只会让
表单库、测试工具、无障碍工具都多一层适配。
:::
