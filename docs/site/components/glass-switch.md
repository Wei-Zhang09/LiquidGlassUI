# GlassSwitch 开关

开关控件。用 `role="switch"` + `aria-checked` 暴露状态。

## 基础用法

<ClientOnly>

<div class="lg-demo is-center">
  <lg-glass-switch checked aria-label="启用通知"></lg-glass-switch>
  <span class="lg-note">启用通知</span>
  <lg-glass-switch aria-label="未启用"></lg-glass-switch>
  <span class="lg-note">未启用</span>
  <lg-glass-switch disabled aria-label="禁用项"></lg-glass-switch>
  <span class="lg-note">禁用</span>
</div>

</ClientOnly>

```html
<lg-glass-switch checked aria-label="启用通知"></lg-glass-switch>
<lg-glass-switch aria-label="未启用"></lg-glass-switch>
<lg-glass-switch disabled aria-label="禁用项"></lg-glass-switch>
```

## 监听切换

<ClientOnly>

<div class="lg-demo is-center">
  <lg-glass-switch data-demo="switch" data-demo-name="sw1" checked aria-label="演示开关"></lg-glass-switch>
  <span class="lg-out" data-demo-out="sw1">当前：开</span>
</div>

</ClientOnly>

```html
<lg-glass-switch id="sw" checked></lg-glass-switch>
<span id="sw-out">当前：开</span>
<script>
  const sw = document.getElementById('sw')
  const out = document.getElementById('sw-out')
  sw.addEventListener('lg-change', (e) => {
    out.textContent = `当前：${e.detail.checked ? '开' : '关'}`
  })
</script>
```

## 尺寸

尺寸通过 CSS 变量控制。

<ClientOnly>

<div class="lg-demo is-center">
  <lg-glass-switch checked style="--lg-switch-width:40px;--lg-switch-height:24px"></lg-glass-switch>
  <lg-glass-switch checked></lg-glass-switch>
  <lg-glass-switch checked style="--lg-switch-width:72px;--lg-switch-height:42px"></lg-glass-switch>
</div>

</ClientOnly>

```html
<lg-glass-switch style="--lg-switch-width:40px;--lg-switch-height:24px"></lg-glass-switch>
<lg-glass-switch></lg-glass-switch>
<lg-glass-switch style="--lg-switch-width:72px;--lg-switch-height:42px"></lg-glass-switch>
```

## API

### Attributes

| 属性 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `checked` | `boolean` | — | 存在即选中。反映到 `aria-checked` |
| `disabled` | `boolean` | — | 存在即禁用；禁用时移出 Tab 顺序 |
| `aria-label` | `string` | — | 无障碍名称。**开关没有可见文字，必须提供** |
| `radius` | `number` | `26` | 圆角像素值 |
| `level` | `'plain' \| 'regular' \| 'elevated' \| 'focused'` | `'regular'` | 材质层级 |
| `surface` | 见 [GlassSurface](/components/glass-surface) | `'convexSquircle'` | 边缘高度函数 |
| `theme` | `'light' \| 'dark'` | `'light'` | 配色主题 |

### 属性（JS）

| 属性 | 类型 | 说明 |
|---|---|---|
| `checked` | `boolean` | 读写。设置会同步 `aria-checked` 并触发样式更新 |

### CSS 自定义属性

| 变量 | 默认值 | 说明 |
|---|---|---|
| `--lg-switch-width` | `52px` | 轨道宽度 |
| `--lg-switch-height` | `32px` | 轨道高度（滑块尺寸自动派生） |
| `--lg-switch-on` | — | 选中时的轨道颜色 |

### 键盘

| 按键 | 行为 |
|---|---|
| `Space` | 切换 |
| `Enter` | 切换 |

与原生 `checkbox` 一致。

### Events

| 名称 | 详情 | 说明 |
|---|---|---|
| `lg-change` | `{ checked: boolean }` | 用户切换时触发。冒泡且穿透 shadow 边界 |

::: warning 用 `lg-change` 而不是 `change`
`change` 在自定义元素上不与原生表单关联，容易和表单库混淆。
`lg-change` 明确表明是本组件的语义事件。
:::
