# GlassCard 卡片

内容分组用的玻璃卡片，可带标题与描述。

## 基础用法

<ClientOnly>

<div class="lg-demo is-center">
  <lg-glass-card title="边缘折射" desc="背景在玻璃边缘被压缩、位移" style="width:220px">
    <span style="font-size:13px;color:#48586A">卡片内容区</span>
  </lg-glass-card>
</div>

</ClientOnly>

```html
<lg-glass-card title="边缘折射" desc="背景在玻璃边缘被压缩、位移">
  <p>卡片内容区</p>
</lg-glass-card>
```

## 不带标题

标题或描述为空时，对应区域不占位（`:empty` 隐藏）。

<ClientOnly>

<div class="lg-demo is-center">
  <lg-glass-card style="width:200px">
    <span style="font-size:13px;color:#48586A">只有内容，没有标题</span>
  </lg-glass-card>
</div>

</ClientOnly>

```html
<lg-glass-card>
  <p>只有内容，没有标题</p>
</lg-glass-card>
```

## 并排卡片

<ClientOnly>

<div class="lg-demo">
  <lg-glass-card title="设计参数" desc="tokens.json 唯一真源" style="flex:1;min-width:180px">
    <span style="font-size:13px;color:#48586A">改一处，四端同步</span>
  </lg-glass-card>
  <lg-glass-card title="平台适配" desc="实测驱动分化" style="flex:1;min-width:180px">
    <span style="font-size:13px;color:#48586A">hover 依赖决定是否分化</span>
  </lg-glass-card>
  <lg-glass-card title="可验证" desc="像素级证据" style="flex:1;min-width:180px">
    <span style="font-size:13px;color:#48586A">不靠"看起来像"</span>
  </lg-glass-card>
</div>

</ClientOnly>

```html
<div style="display:flex;gap:16px">
  <lg-glass-card title="设计参数" desc="tokens.json 唯一真源">…</lg-glass-card>
  <lg-glass-card title="平台适配" desc="实测驱动分化">…</lg-glass-card>
  <lg-glass-card title="可验证" desc="像素级证据">…</lg-glass-card>
</div>
```

## API

### Attributes

| 属性 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `title` | `string` | — | 卡片标题。为空时该区域隐藏 |
| `desc` | `string` | — | 标题下方的描述。为空时隐藏 |
| `radius` | `number` | `26` | 圆角像素值 |
| `level` | `'plain' \| 'regular' \| 'elevated' \| 'focused'` | `'regular'` | 材质层级 |
| `surface` | 见 [GlassSurface](/web/glass-surface) | `'convexSquircle'` | 边缘高度函数 |
| `theme` | `'light' \| 'dark'` | `'light'` | 配色主题 |

### CSS 自定义属性

继承 [GlassSurface](/web/glass-surface) 的全部变量，另加：

| 变量 | 说明 |
|---|---|
| `--lg-card-padding` | 内边距 |
| `--lg-card-gap` | 标题与内容间距 |

### Slots

| 名称 | 说明 |
|---|---|
| default | 卡片正文（标题与描述下方） |

### Events

无。
