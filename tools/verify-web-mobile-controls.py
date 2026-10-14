#!/usr/bin/env python3
"""真实浏览器验证 GlassSwitch / GlassSlider 的交互。

不是截图比对，而是**真实驱动指针与键盘**，读回组件状态：
  - 点击开关 → aria-checked 翻转
  - 键盘切换
  - 拖动滑块 → aria-valuenow 跟随
  - 点击轨道跳值
  - 键盘步进 / Home / End
  - 触屏拖动（用 CDP 触摸事件，验证 touch-action 与指针捕获真的有效）

用法: python tools/verify-web-mobile-controls.py
"""

import json
import pathlib
import subprocess
import sys
import time
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
PAGE = ROOT / "examples" / "web" / "index.html"
PORT = 8921

failures = []


def check(name, ok, detail=""):
    mark = "ok  " if ok else "FAIL"
    print(f"  [{mark}] {name}" + (f"  {detail}" if detail else ""))
    if not ok:
        failures.append(name)


def main():
    from playwright.sync_api import sync_playwright

    server = subprocess.Popen(
        [sys.executable, "-m", "http.server", str(PORT)],
        cwd=str(ROOT),
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    time.sleep(2)

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page(viewport={"width": 1280, "height": 1000})
            page.goto(f"http://127.0.0.1:{PORT}/examples/web/index.html")
            page.wait_for_timeout(1500)

            print("=== GlassSwitch ===")
            sw = page.locator("lg-glass-switch").first

            before = sw.get_attribute("aria-checked")
            check("初始 aria-checked = true（标记了 checked）", before == "true", f"实际 {before}")

            sw.click()
            page.wait_for_timeout(200)
            after = sw.get_attribute("aria-checked")
            check("点击后翻转为 false", after == "false", f"实际 {after}")

            sw.click()
            page.wait_for_timeout(200)
            check("再次点击回到 true", sw.get_attribute("aria-checked") == "true")

            # 键盘
            sw.focus()
            page.keyboard.press("Space")
            page.wait_for_timeout(200)
            check("空格键切换", sw.get_attribute("aria-checked") == "false")
            page.keyboard.press("Enter")
            page.wait_for_timeout(200)
            check("回车键切换", sw.get_attribute("aria-checked") == "true")

            # 事件接线（示例页的输出文本）
            out = page.locator("#switch-out").inner_text()
            check("lg-change 事件驱动了页面输出", "开" in out, f"文本 {out!r}")

            # 禁用态
            dis = page.locator("lg-glass-switch[disabled]")
            d_before = dis.get_attribute("aria-checked")
            dis.click(force=True)
            page.wait_for_timeout(200)
            check(
                "禁用开关点击不改变状态",
                dis.get_attribute("aria-checked") == d_before,
                f"{d_before} -> {dis.get_attribute('aria-checked')}",
            )

            print("\n=== GlassSlider ===")
            sl = page.locator("lg-glass-slider").first
            box = sl.bounding_box()
            check("滑块有可见布局", box is not None and box["width"] > 100, f"box={box}")

            check("初始 aria-valuenow = 40", sl.get_attribute("aria-valuenow") == "40")

            # 点击轨道 75% 处
            sl.click(position={"x": box["width"] * 0.75, "y": box["height"] / 2})
            page.wait_for_timeout(200)
            v = int(sl.get_attribute("aria-valuenow"))
            check("点击轨道 75% 处 → 值接近 75", 70 <= v <= 80, f"实际 {v}")

            # 拖动
            page.mouse.move(box["x"] + box["width"] * 0.75, box["y"] + box["height"] / 2)
            page.mouse.down()
            page.mouse.move(box["x"] + box["width"] * 0.2, box["y"] + box["height"] / 2, steps=10)
            page.mouse.up()
            page.wait_for_timeout(200)
            v = int(sl.get_attribute("aria-valuenow"))
            check("拖动到 20% → 值接近 20", 15 <= v <= 25, f"实际 {v}")

            # 键盘
            sl.focus()
            page.keyboard.press("Home")
            page.wait_for_timeout(150)
            check("Home → 最小值 0", sl.get_attribute("aria-valuenow") == "0")
            page.keyboard.press("End")
            page.wait_for_timeout(150)
            check("End → 最大值 100", sl.get_attribute("aria-valuenow") == "100")
            page.keyboard.press("ArrowLeft")
            page.wait_for_timeout(150)
            check("← 步进 → 99", sl.get_attribute("aria-valuenow") == "99")

            # 事件接线
            out = page.locator("#slider-out").inner_text()
            check("lg-change 事件驱动了页面输出", "音量" in out, f"文本 {out!r}")

            print("\n=== 触屏拖动（CDP 真实触摸事件）===")
            page.keyboard.press("Home")
            page.wait_for_timeout(150)
            cdp = page.context.new_cdp_session(page)
            cx = box["x"] + box["width"] * 0.5
            cy = box["y"] + box["height"] / 2
            cdp.send("Input.dispatchTouchEvent", {
                "type": "touchStart",
                "touchPoints": [{"x": cx, "y": cy, "id": 1}],
            })
            page.wait_for_timeout(80)
            v_start = int(sl.get_attribute("aria-valuenow"))
            check("触摸按下即取值（50% 处 → 50）", 45 <= v_start <= 55, f"实际 {v_start}")

            # 手指移出元素边界后继续拖 —— 验证 setPointerCapture 生效
            cdp.send("Input.dispatchTouchEvent", {
                "type": "touchMove",
                "touchPoints": [{"x": box["x"] + box["width"] * 0.9, "y": cy, "id": 1}],
            })
            page.wait_for_timeout(80)
            cdp.send("Input.dispatchTouchEvent", {
                "type": "touchMove",
                # 移到元素外面（下方 100px），若不捕获指针则收不到事件
                "touchPoints": [{"x": box["x"] + box["width"] * 0.9, "y": cy + 100, "id": 1}],
            })
            page.wait_for_timeout(80)
            cdp.send("Input.dispatchTouchEvent", {"type": "touchEnd", "touchPoints": []})
            page.wait_for_timeout(200)
            v_end = int(sl.get_attribute("aria-valuenow"))
            check("手指移出元素后仍能拖动（指针捕获生效）", 85 <= v_end <= 95, f"实际 {v_end}")

            print("\n=== 布局完整性 ===")
            # 检查组件没有溢出或被裁剪
            for sel in ["lg-glass-switch", "lg-glass-slider"]:
                el = page.locator(sel).first
                bb = el.bounding_box()
                check(f"{sel} 有非零尺寸", bb and bb["width"] > 0 and bb["height"] > 0, f"{bb}")

            browser.close()
    finally:
        server.terminate()

    print("\n=== 结论 ===")
    if failures:
        print(f"失败 {len(failures)} 项: {', '.join(failures)}")
        return 1
    print("全部通过")
    return 0


if __name__ == "__main__":
    sys.exit(main())
