# GlassGroup 玻璃组

让相邻的玻璃**融成一团**，而不是各自贴在一起。

## 与「叠放」的区别

普通 glassmorphism 里相邻玻璃各自渲染、边缘互相叠加，看起来是两块玻璃贴在一起。
液态玻璃要求像真实液体一样融合：**接缝处轮廓连续**，折射沿整体外形发生。

<ClientOnly>

<div class="lg-demo is-center">
  <div style="text-align:center">
    <lg-glass-group smoothing="24" style="width:200px;height:70px;display:block">
      <lg-glass-button>确定</lg-glass-button>
      <lg-glass-button>取消</lg-glass-button>
    </lg-glass-group>
    <div class="lg-note" style="display:inline-block;margin-top:6px">smoothing=24（融合）</div>
  </div>
  <div style="text-align:center">
    <lg-glass-group smoothing="0" style="width:200px;height:70px;display:block">
      <lg-glass-button>确定</lg-glass-button>
      <lg-glass-button>取消</lg-glass-button>
    </lg-glass-group>
    <div class="lg-note" style="display:inline-block;margin-top:6px">smoothing=0（不融合）</div>
  </div>
</div>

</ClientOnly>

```html
<!-- 融合 -->
<lg-glass-group smoothing="24">
  <lg-glass-button>确定</lg-glass-button>
  <lg-glass-button>取消</lg-glass-button>
</lg-glass-group>

<!-- 不融合（对照） -->
<lg-glass-group smoothing="0">
  <lg-glass-button>确定</lg-glass-button>
  <lg-glass-button>取消</lg-glass-button>
</lg-glass-group>
```

::: tip 融合半径大于间距时会「粘」在一起
这是设计意图，不是 bug。`smoothing` 就是融合半径：两个形状的距离场
在半径内被平滑并集（smooth min）缝合，视觉上像液滴合并。
:::

## 融合是怎么做到的

1. 把组内每个子元素的形状转成**有符号距离场**（SDF）
2. 对多个距离场做**平滑并集**（smooth min），得到融合后的整体距离场
3. 对融合距离场求**梯度**，作为折射方向

关键在于第 2 步：梯度来自**融合后**的轮廓，所以折射方向在接缝处也连续。
如果各子元素各自求梯度再叠加，接缝处会出现两条互相打架的折射边 —— 那是"假融合"。

::: warning 组拥有滤镜分配权
子元素**不再各自申请滤镜**，由组统一分配。如果子元素保留自己的单形状滤镜，
每个都会绕自己的圆角弯折背景，接缝处就会露馅。
:::

## API

### Attributes

| 属性 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `smoothing` | `number` | `24` | 融合半径（px）。越大越早融合；`0` 表示只做普通并集 |
| `radius` | `number` | `26` | 圆角像素值 |
| `surface` | 见 [GlassSurface](/components/glass-surface) | `'convexSquircle'` | 边缘高度函数 |
| `theme` | `'light' \| 'dark'` | `'light'` | 配色主题 |

### 内部属性（由组件写入子元素）

| 属性 | 说明 |
|---|---|
| `data-lg-group-filter` | 组分配给该子元素的滤镜 id。**不应手动设置** |

### Slots

| 名称 | 说明 |
|---|---|
| default | 组内子元素（通常是玻璃元素） |

### Events

无。

### 已知限制

- 组的几何在布局完成后计算一次；子元素尺寸变化会触发重算（`ResizeObserver`）
- 若形状互不相连且 `smoothing` 不足以桥接，只有最大的一块会显示玻璃
