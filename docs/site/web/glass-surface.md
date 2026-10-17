# GlassSurface 玻璃面

所有玻璃元素的**材质底板**。其余组件都建立在它之上。

## 基础用法

<ClientOnly>

<div class="lg-demo is-center">
  <lg-glass-surface radius="26" level="elevated" style="padding:28px 40px;">
    <strong>玻璃面</strong><br>
    <span style="font-size:13px;color:#48586A">背景在边缘被弯折</span>
  </lg-glass-surface>
</div>

</ClientOnly>

```html
<lg-glass-surface radius="26" level="elevated">
  <p>内容</p>
</lg-glass-surface>
```

## 材质层级

`level` 控制模糊强度。层级越高越"厚"，用于表达元素在界面中的高度。

<ClientOnly>

<div class="lg-demo is-center">
  <lg-glass-surface level="plain" style="padding:20px 26px;">plain</lg-glass-surface>
  <lg-glass-surface level="regular" style="padding:20px 26px;">regular</lg-glass-surface>
  <lg-glass-surface level="elevated" style="padding:20px 26px;">elevated</lg-glass-surface>
  <lg-glass-surface level="focused" style="padding:20px 26px;">focused</lg-glass-surface>
</div>

</ClientOnly>

```html
<lg-glass-surface level="plain">plain</lg-glass-surface>
<lg-glass-surface level="regular">regular</lg-glass-surface>
<lg-glass-surface level="elevated">elevated</lg-glass-surface>
<lg-glass-surface level="focused">focused</lg-glass-surface>
```

## 折射曲面

`surface` 决定边缘的高度函数 —— 也就是光在玻璃边缘**怎么弯**。

<ClientOnly>

<div class="lg-demo is-center lg-surface-row">
  <lg-glass-surface surface="convexSquircle" radius="22">convexSquircle</lg-glass-surface>
  <lg-glass-surface surface="convexCircle" radius="22">convexCircle</lg-glass-surface>
  <lg-glass-surface surface="concave" radius="22">concave</lg-glass-surface>
  <lg-glass-surface surface="lip" radius="22">lip</lg-glass-surface>
</div>

</ClientOnly>

```html
<lg-glass-surface surface="convexSquircle">苹果超椭圆（默认，最接近 iOS）</lg-glass-surface>
<lg-glass-surface surface="convexCircle">半圆凸起</lg-glass-surface>
<lg-glass-surface surface="concave">内凹（水滴边缘）</lg-glass-surface>
<lg-glass-surface surface="lip">凸→凹混合</lg-glass-surface>
```

::: tip 为什么凸起看起来像玻璃
真实玻璃的边缘是**凸起**的（像透镜）。`convexSquircle` 是 Apple 使用的超椭圆曲线，
折射方向在边缘处偏折最大、向内迅速归零 —— 这就是"边缘弯折、中心干净"的来源。
:::

## 深色主题

<ClientOnly>

<div class="lg-demo is-center is-dark">
  <lg-glass-surface theme="dark" level="elevated" radius="26" style="padding:26px 38px;">
    <span style="color:#fff">深色玻璃</span>
  </lg-glass-surface>
</div>

</ClientOnly>

```html
<lg-glass-surface theme="dark" level="elevated">深色玻璃</lg-glass-surface>
```

## API

### Attributes

| 属性 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `radius` | `number` | `26` | 圆角像素值。会被钳制到短边的一半以内 |
| `level` | `'plain' \| 'regular' \| 'elevated' \| 'focused'` | `'regular'` | 材质层级 → 模糊强度 |
| `surface` | `'convexSquircle' \| 'convexCircle' \| 'concave' \| 'lip'` | `'convexSquircle'` | 边缘高度函数（决定折射形态） |
| `theme` | `'light' \| 'dark'` | `'light'` | 配色主题 |

### CSS 自定义属性

| 变量 | 说明 |
|---|---|
| `--lg-radius` | 圆角（由 `radius` 属性写入，也可直接覆盖） |
| `--lg-blur` | 模糊强度（由 `level` 写入） |
| `--lg-surface` | 玻璃底色 |
| `--lg-shadow` | 外阴影 |
| `--lg-highlight` | 边缘高光 |
| `--lg-inner-shadow` | 内阴影 |
| `--lg-light-angle` | 光源角度（默认 `45deg`，左上） |
| `--lg-filter` | 折射滤镜引用（内部使用） |

### 只读状态

| 属性 | 值 | 说明 |
|---|---|---|
| `data-support` | `'refraction' \| 'frost' \| 'solid'` | 当前实际生效的降级档位 |

::: warning 降级是静默发生的
浏览器不支持时会自动降到 `frost` 或 `solid`。读 `data-support` 可以知道
当前是哪一档 —— 见[降级策略](/guide/fallback)。
:::

### Slots

| 名称 | 说明 |
|---|---|
| default | 玻璃面内容 |

### Events

无。
