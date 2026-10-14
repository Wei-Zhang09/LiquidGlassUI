# GlassSegmented 分段控件

分段选择控件。遵循 `radiogroup` 惯例。

## 基础用法

<ClientOnly>

<div class="lg-demo is-center">
  <lg-glass-segmented value="week" radius="18">
    <button data-value="day">日</button>
    <button data-value="week">周</button>
    <button data-value="month">月</button>
    <button data-value="year">年</button>
  </lg-glass-segmented>
</div>

</ClientOnly>

```html
<lg-glass-segmented value="week">
  <button data-value="day">日</button>
  <button data-value="week">周</button>
  <button data-value="month">月</button>
  <button data-value="year">年</button>
</lg-glass-segmented>
```

## 监听选择

<ClientOnly>

<div class="lg-demo is-center">
  <lg-glass-segmented data-demo="segmented" data-demo-name="seg1" value="a">
    <button data-value="a">选项 A</button>
    <button data-value="b">选项 B</button>
    <button data-value="c">选项 C</button>
  </lg-glass-segmented>
  <span class="lg-out" data-demo-out="seg1">选中：a</span>
</div>

</ClientOnly>

```html
<lg-glass-segmented id="seg" value="a">
  <button data-value="a">选项 A</button>
  <button data-value="b">选项 B</button>
</lg-glass-segmented>
<script>
  document.getElementById('seg').addEventListener('lg-change', (e) => {
    console.log(e.detail.value)
  })
</script>
```

## 键盘导航

遵循 `radiogroup` 惯例：

| 按键 | 行为 |
|---|---|
| `←` / `→` | 在选项间移动（并立即选中） |
| `Home` / `End` | 跳到首 / 尾项 |

**roving tabindex**：整组只有一个可 Tab 进入的项，其余用方向键到达。
这样 Tab 键不会在分段控件里逐个停留 —— 这是 radiogroup 的标准做法。

## API

### Attributes

| 属性 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `value` | `string` | — | 当前选中项的 `data-value` |
| `radius` | `number` | `26` | 圆角像素值 |
| `level` | `'plain' \| 'regular' \| 'elevated' \| 'focused'` | `'regular'` | 材质层级 |
| `surface` | 见 [GlassSurface](/components/glass-surface) | `'convexSquircle'` | 边缘高度函数 |
| `theme` | `'light' \| 'dark'` | `'light'` | 配色主题 |

### 属性（JS）

| 属性 | 类型 | 说明 |
|---|---|---|
| `value` | `string` | 读写。设置会同步选中态 |

### CSS 自定义属性

继承 [GlassSurface](/components/glass-surface) 的全部变量，另加：

| 变量 | 说明 |
|---|---|
| `--lg-segmented-padding` | 内边距 |
| `--lg-segmented-gap` | 选项间距 |

### 子元素约定

子元素应是带 `data-value` 的 `<button>`。`data-value` 的值就是
`value` 属性与 `lg-change` 事件里携带的值。

```html
<lg-glass-segmented value="day">
  <button data-value="day">日</button>   <!-- data-value 是标识 -->
  <button data-value="week">周</button>
</lg-glass-segmented>
```

### Events

| 名称 | 详情 | 说明 |
|---|---|---|
| `lg-change` | `{ value: string }` | 选中项变化时触发 |

### 无障碍

`role="radiogroup"` + 各项 `role="radio"` + `aria-checked`。
屏幕阅读器能正确朗读"3 个选项中的第 2 个"。
