# 降级策略

## 三级阶梯

| 档位 | 条件 | 效果 |
|---|---|---|
| `refraction` | 支持 SVG 位移贴图 | 真折射（边缘弯折背景） |
| `frost` | 支持 `backdrop-filter` | 磨砂（模糊，但不弯折） |
| `solid` | 都不支持 | 实心半透明底 |

组件的 `data-support` 属性会写成实际生效的档位：

```js
el.getAttribute('data-support')  // 'refraction' | 'frost' | 'solid'
```

## 关键事实：不支持时是**静默**的

Firefox 和 Safari **不支持** SVG 位移贴图。但它们：

| 检测方式 | 结果 |
|---|---|
| `CSS.supports('backdrop-filter', 'url(#x)')` | ✅ 返回 **true** |
| `getComputedStyle(el).backdropFilter` | ✅ 保留该值 |
| 实际渲染 | ❌ **什么都不画** |

::: danger 不能用 `@supports` 判断
这是本项目实测确认的（不是推测）：Firefox 解析通过、computed style 保留、
`@supports` 返回 true，但**页面不渲染任何效果**。

唯一可靠的判断方式是 **UA 嗅探**。
:::

## 本库怎么做

```ts
// packages/web/src/capabilities.ts
const supportsSvgBackdrop =
  ('userAgentData' in navigator || /(?:Headless)?Chrome\/\d+/.test(navigator.userAgent)) &&
  !/Firefox|FxiOS|CriOS|EdgiOS/.test(navigator.userAgent)
```

### 一个容易写错的细节

```js
// ❌ 错：\b 在 "HeadlessChrome" 里匹配不上
/\bChrome\/\d+/

// ✅ 对：显式匹配可选的 Headless 前缀
/(?:Headless)?Chrome\/\d+/
```

`HeadlessChrome/151…` 中 `s` 和 `C` 之间**没有单词边界**，所以 `\b` 会让
这个正则漏掉**每一个**无头 Chrome —— 恰好是你做截图测试的环境。

## 尺寸降级

除了浏览器能力，**尺寸**也会触发降级：

| 情况 | 处理 |
|---|---|
| 元素 0×0 | **不动档位** —— 说明还没布局（初始挂载、或从 `display:none` 切回） |
| 元素有尺寸但过小（< 4px） | 降到 `frost` —— 真的构不成边缘带 |

::: warning 为什么必须区分这两种
把它们合并成一个分支，会导致两种 bug 之一：

- 合并成「一律降级」→ 元素**永久停在 frost**，即使后面正常显示了也回不到折射
- 合并成「一律忽略」→ 留下一块**声称支持折射、实际什么都没画**的玻璃

第一种是"永远恢复不了"，第二种是静默失败。
:::

## 检查清单

部署前确认：

- [ ] 在 Chromium 里 `data-support` 是 `refraction`
- [ ] 在 Firefox 里 `data-support` 是 `frost`，且页面**仍然可读**
- [ ] 关掉 `backdrop-filter`（DevTools）后内容仍可读
- [ ] 元素从 `display:none` 切回后能恢复折射（不是永久 frost）
- [ ] 模态框在不支持时文字仍清晰

## 相关

- [ADR-0002：平台优先级](https://github.com/Wei-Zhang09/LiquidGlassUI/blob/main/docs/adr/0002-platform-priority-and-desktop.md)
- [平台能力矩阵](/platform/)
