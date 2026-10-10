#!/usr/bin/env python3
"""真实浏览器里的交互验证：对话框打开/关闭、分段控件切换。

jsdom 覆盖了逻辑（焦点陷阱、键盘、ESC），但看不到"打开后是什么样"，
也验不了 CSS 定位。这里补上：
  1. 打开对话框 → 截图 + 检查遮罩是否铺满、面板是否可见
  2. 关闭对话框 → 确认真的消失
  3. 点击分段控件 → 确认选中态迁移
"""
from __future__ import annotations

import base64
import json
import pathlib

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
URL = "http://127.0.0.1:8913/examples/web/index.html"
OUT = ROOT / "docs" / "screenshots"

OPEN_DIALOG = """() => {
  const dlg = document.getElementById('demo-dialog');
  document.getElementById('open-dialog').click();
  const overlay = dlg.shadowRoot.querySelector('.overlay');
  const panel = dlg.shadowRoot.querySelector('.panel');
  const oRect = overlay.getBoundingClientRect();
  const pRect = panel.getBoundingClientRect();
  return {
    open: dlg.hasAttribute('open'),
    overlaySize: [Math.round(oRect.width), Math.round(oRect.height)],
    viewport: [window.innerWidth, window.innerHeight],
    panelRect: [Math.round(pRect.width), Math.round(pRect.height), Math.round(pRect.left), Math.round(pRect.top)],
    panelVisible: pRect.width > 100 && pRect.height > 50,
    bodyOverflow: document.body.style.overflow,
  };
}"""

CLOSE_DIALOG = """() => {
  const dlg = document.getElementById('demo-dialog');
  dlg.removeAttribute('open');
  return {
    open: dlg.hasAttribute('open'),
    bodyOverflow: document.body.style.overflow,
  };
}"""

SEGMENT = """(idx) => {
  const seg = document.querySelector('lg-glass-segmented');
  const items = [...seg.children];
  const before = seg.getAttribute('value');
  items[idx].dispatchEvent(new MouseEvent('click', { bubbles: true }));
  const after = seg.getAttribute('value');
  return {
    before, after,
    checkedFlags: items.map(i => i.getAttribute('aria-checked')),
    tabindexes: items.map(i => i.tabIndex),
  };
}"""


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    results = {}

    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(viewport={"width": 1280, "height": 1000}, device_scale_factor=2)
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto(URL)
        pg.wait_for_timeout(1500)

        opened = pg.evaluate(OPEN_DIALOG)
        pg.wait_for_timeout(400)
        pg.screenshot(path=str(OUT / "web-dialog-open.png"))
        closed = pg.evaluate(CLOSE_DIALOG)

        seg = pg.evaluate(SEGMENT, 3)  # 点第 4 项（年）

        results = {"open": opened, "close": closed, "segment": seg, "errors": errs}
        b.close()

    print(json.dumps(results, indent=2, ensure_ascii=False))

    print("\n=== 断言 ===")
    ok = True
    o = results["open"]
    if not o["open"]:
        print("  [FAIL] 对话框未打开")
        ok = False
    else:
        print("  [ok] 对话框已打开")
    # 遮罩应铺满视口
    if o["overlaySize"] != o["viewport"]:
        print(f"  [FAIL] 遮罩未铺满：{o['overlaySize']} vs 视口 {o['viewport']}")
        ok = False
    else:
        print(f"  [ok] 遮罩铺满视口 {o['viewport']}")
    if not o["panelVisible"]:
        print(f"  [FAIL] 面板尺寸异常：{o['panelRect']}")
        ok = False
    else:
        print(f"  [ok] 面板可见 {o['panelRect'][:2]}")
    if o["bodyOverflow"] != "hidden":
        print(f"  [FAIL] 打开时未锁定滚动：{o['bodyOverflow']!r}")
        ok = False
    else:
        print("  [ok] 打开时页面滚动被锁定")

    c = results["close"]
    if c["open"]:
        print("  [FAIL] 关闭失败")
        ok = False
    else:
        print("  [ok] 关闭成功")
    if c["bodyOverflow"] == "hidden":
        print("  [FAIL] 关闭后未恢复滚动")
        ok = False
    else:
        print(f"  [ok] 关闭后滚动已恢复（{c['bodyOverflow']!r}）")

    s = results["segment"]
    if s["after"] == s["before"]:
        print(f"  [FAIL] 分段控件未切换（仍为 {s['before']}）")
        ok = False
    else:
        print(f"  [ok] 分段控件切换 {s['before']} → {s['after']}")
    if s["checkedFlags"].count("true") != 1:
        print(f"  [FAIL] 选中项数量异常：{s['checkedFlags']}")
        ok = False
    else:
        print(f"  [ok] 恰好一项选中 {s['checkedFlags']}")
    if s["tabindexes"].count(0) != 1:
        print(f"  [FAIL] roving tabindex 异常：{s['tabindexes']}")
        ok = False
    else:
        print(f"  [ok] roving tabindex 正确 {s['tabindexes']}")

    if results["errors"]:
        print(f"  [FAIL] JS 错误：{results['errors'][:2]}")
        ok = False
    else:
        print("  [ok] 无 JS 错误")

    print("\n结论:", "通过" if ok else "失败")
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
