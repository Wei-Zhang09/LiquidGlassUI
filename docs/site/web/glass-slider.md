# GlassSlider 滑块

滑块控件。用 Pointer Events 统一鼠标与触摸。

## 基础用法

<ClientOnly>

<div class="lg-demo is-center">
  <lg-glass-slider min="0" max="100" value="40" aria-label="音量"></lg-glass-slider>
</div>

</ClientOnly>

```html
<lg-glass-slider min="0" max="100" value="40" aria-label="音量"></lg-glass-slider>
```

## 监听值变化

<ClientOnly>

<div class="lg-demo is-center">
  <lg-glass-slider data-demo="slider" data-demo-name="sl1" min="0" max="100" value="40" aria-label="音量"></lg-glass-slider>
  <span class="lg-out" data-demo-out="sl1">值：40</span>
</div>

</ClientOnly>

```html
<lg-glass-slider id="sl" min="0" max="100" value="40"></lg-glass-slider>
<span id="sl-out">值：40</span>
<script>
  const sl = document.getElementById('sl')
  const out = document.getElementById('sl-out')
  sl.addEventListener('lg-change', (e) => {
    out.textContent = `值：${e.detail.value}`
  })
</script>
```

## 步长

<ClientOnly>

<div class="lg-demo is-center">
  <lg-glass-slider min="0" max="100" step="10" value="50" aria-label="步长 10"></lg-glass-slider>
  <span class="lg-note">step=10（值会对齐到步长）</span>
</div>

</ClientOnly>

```html
<lg-glass-slider min="0" max="100" step="10" value="50"></lg-glass-slider>
```

## 触屏上的两个坑

这个组件在触屏上有两个**不处理就废掉**的问题，都已解决：

| 问题 | 现象 | 解法 |
|---|---|---|
| 滚动冲突 | 拖动被浏览器当成页面滚动，滑块**拖不动** | `touch-action: none` |
| 丢事件 | 手指移出元素后不再收到 `pointermove`，滑块**粘住** | `setPointerCapture` |

```css
/* 组件内部已包含 */
:host { touch-action: none; }
```

::: tip 为什么用 Pointer Events
鼠标用 `mousemove`、触摸用 `touchmove` 是两套事件模型。
Pointer Events（`pointerdown/move/up`）统一了两者，代码只需一套。
:::

## API

### Attributes

| 属性 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `min` | `number` | `0` | 最小值 |
| `max` | `number` | `100` | 最大值 |
| `value` | `number` | `min` | 当前值。超出范围会被钳制，并自动对齐到 `step` |
| `step` | `number` | `1` | 步长。非正数会被当作 `1` |
| `disabled` | `boolean` | — | 存在即禁用（忽略指针与键盘） |
| `aria-label` | `string` | — | 无障碍名称 |
| `radius` | `number` | `26` | 圆角像素值 |
| `level` | `'plain' \| 'regular' \| 'elevated' \| 'focused'` | `'regular'` | 材质层级 |
| `surface` | 见 [GlassSurface](/web/glass-surface) | `'convexSquircle'` | 边缘高度函数 |
| `theme` | `'light' \| 'dark'` | `'light'` | 配色主题 |

### 属性（JS）

| 属性 | 类型 | 说明 |
|---|---|---|
| `min` | `number` | 只读 |
| `max` | `number` | 只读 |
| `step` | `number` | 只读 |
| `value` | `number` | 读写 |

### CSS 自定义属性

| 变量 | 默认值 | 说明 |
|---|---|---|
| `--lg-slider-width` | `220px` | 总宽 |
| `--lg-slider-height` | `36px` | 总高（触摸目标） |
| `--lg-slider-track-height` | `8px` | 轨道高度 |
| `--lg-slider-thumb` | `22px` | 滑块直径 |
| `--lg-slider-fill` | — | 已填充部分颜色 |

### 键盘

| 按键 | 行为 |
|---|---|
| `←` / `↓` | 减一个步长 |
| `→` / `↑` | 加一个步长 |
| `PageUp` / `PageDown` | 加/减范围的 10% |
| `Home` / `End` | 跳到最小 / 最大值 |

### Events

| 名称 | 详情 | 说明 |
|---|---|---|
| `lg-change` | `{ value: number }` | 值变化时触发（拖动、点击轨道、键盘）。值未变则不触发 |

### 无障碍

`role="slider"` + `aria-valuemin` / `aria-valuemax` / `aria-valuenow`，
屏幕阅读器可朗读当前值。
