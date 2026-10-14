# GlassBottomBar 底部标签栏

移动端主导航。与 [GlassNavBar](/components/glass-navbar) 对应，但**交互模型不同**。

## 基础用法

<ClientOnly>

<div class="lg-demo is-center">
  <div class="lg-phone">
    <lg-glass-bottombar data-demo="tabs" radius="18">
      <button data-icon="◎">概览</button>
      <button data-icon="◈" aria-selected="true">组件</button>
      <button data-icon="⚙">设置</button>
    </lg-glass-bottombar>
  </div>
</div>

</ClientOnly>

```html
<lg-glass-bottombar>
  <button data-icon="◎">概览</button>
  <button data-icon="◈" aria-selected="true">组件</button>
  <button data-icon="⚙">设置</button>
</lg-glass-bottombar>
```

## 与顶部导航的区别

| | GlassNavBar（桌面） | GlassBottomBar（移动） |
|---|---|---|
| 位置 | 顶部横向 | 底部横向 |
| 交互反馈 | **悬停**（指针设备） | **按压**（触屏无 hover） |
| 条目布局 | 图标+文字横排、左对齐 | 图标在上文字在下、等宽居中 |
| 可达性 | 鼠标可及全屏 | 拇指区（屏幕下缘） |

::: tip 触屏没有 hover
这不是实现偷懒，是物理限制：手指离屏幕 2 厘米，电容屏不知道。
移动端的对应交互语言是**按压反馈**（`collectIsPressedAsState` / `:active`）。

详见 [ADR-0003：组件按平台分化的实证依据](https://github.com/Wei-Zhang09/LiquidGlassUI/blob/main/docs/adr/0003-platform-differentiation-evidence.md)。
:::

## 图标怎么来的

`data-icon` 的值作为 CSS `content` 渲染 —— **不绑定任何图标库**。

```html
<button data-icon="◎">概览</button>
```

```css
/* 组件内部 */
[data-icon]::before { content: attr(data-icon); }
```

这样你可以用任意字符、emoji，或通过 CSS 换成图标字体。

## 固定定位

加 `fixed` 让标签栏固定在视口底部。

```html
<lg-glass-bottombar fixed>
  <button data-icon="◎">概览</button>
</lg-glass-bottombar>
```

## API

### Attributes

| 属性 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `fixed` | `boolean` | — | 存在即 `position: fixed` |
| `radius` | `number` | `26` | 圆角像素值 |
| `level` | `'plain' \| 'regular' \| 'elevated' \| 'focused'` | `'regular'` | 材质层级 |
| `surface` | 见 [GlassSurface](/components/glass-surface) | `'convexSquircle'` | 边缘高度函数 |
| `theme` | `'light' \| 'dark'` | `'light'` | 配色主题 |

### CSS 自定义属性

继承 [GlassSurface](/components/glass-surface) 的全部变量，另加：

| 变量 | 说明 |
|---|---|
| `--lg-bottombar-padding` | 内边距 |
| `--lg-bottombar-height` | 栏高 |

### 子元素约定

| 位置 | 说明 |
|---|---|
| `data-icon` | 图标字符（作为 CSS `content` 渲染） |
| `aria-selected="true"` | 标记当前选中项 |

```html
<button data-icon="◈" aria-selected="true">组件</button>
```

### Events

无。选中状态由调用方通过 `aria-selected` 控制 ——
这样组件不持有状态，可以配合任何路由或状态库。

::: warning 为什么组件不管选中态
如果把选中态做成内部状态，就无法和路由同步。
让调用方写 `aria-selected` 是**受控**设计，和 React 的受控组件同理。
:::
