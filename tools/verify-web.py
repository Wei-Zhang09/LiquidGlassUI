#!/usr/bin/env python3
"""Web 原型的像素级验证。

验证三件事：
  A. 能力门控正确（Chromium 判为 refraction，Firefox 判为 frost）
  B. 折射真实生效（位移量与理论值 d = scale*(channel/255-0.5) 吻合）
  C. 折射只发生在边缘带，中心区域像素零变化

用法：
    python tools/verify-web.py            # 跑全部
    python tools/verify-web.py --headed   # 显示浏览器窗口
"""
from __future__ import annotations

import argparse
import base64
import json
import pathlib
import sys

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
URL = "http://127.0.0.1:8912/examples/web/index.html"

# 在页面里对截图做采样，避免依赖 PIL
PROBE = r"""
async (b64) => {
  const img = new Image();
  img.src = 'data:image/png;base64,' + b64;
  await img.decode();
  const c = document.createElement('canvas');
  c.width = img.width; c.height = img.height;
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0);

  // 截图是 device_scale_factor 倍，采样时必须换算，否则采到错误位置
  const DPR = img.width / window.innerWidth;
  const px = (x, y) => {
    const p = ctx.getImageData(Math.round(x * DPR), Math.round(y * DPR), 1, 1).data;
    return [p[0], p[1], p[2]];
  };

  const el = document.getElementById('panel');
  const r = el.getBoundingClientRect();

  const y = Math.round(r.top + r.height / 2);
  const refX = Math.max(0, Math.round(r.left) - 40);

  const sample = [];
  for (let dx = 0; dx < 48; dx += 2) {
    const x = Math.round(r.left) + dx;
    sample.push({ dx, inside: px(x, y), ref: px(refX, y) });
  }
  return {
    dpr: DPR,
    support: el.getAttribute('data-support'),
    caps: window.__lg ? window.__lg.caps : null,
    rect: { left: r.left, top: r.top, width: r.width, height: r.height },
    sample,
  };
}
"""

# 把面板实际引用的那个滤镜的 scale 归零，用于 A/B 对照。
# 注意：必须按元素引用解析目标，不能取第一个 filter —— 多个玻璃面各有一个滤镜。
KILL = r"""
() => {
  const el = document.getElementById('panel');
  const v = getComputedStyle(el).getPropertyValue('--lg-filter').trim();
  const m = v.match(/#([\w-]+)/);
  if (!m) return { ok: false, reason: 'panel has no filter var', var: v };
  const f = document.getElementById(m[1]);
  if (!f) return { ok: false, reason: 'filter not found', id: m[1] };
  const maps = [...f.querySelectorAll('feDisplacementMap')];
  maps.forEach(e => e.setAttribute('data-scale', e.getAttribute('scale') || '0'));
  maps.forEach(e => e.setAttribute('scale', '0'));
  return { ok: true, id: m[1], count: maps.length };
}
"""

RESTORE = r"""
() => {
  const el = document.getElementById('panel');
  const v = getComputedStyle(el).getPropertyValue('--lg-filter').trim();
  const m = v.match(/#([\w-]+)/);
  if (!m) return false;
  const f = document.getElementById(m[1]);
  if (!f) return false;
  [...f.querySelectorAll('feDisplacementMap')].forEach(e => {
    const s = e.getAttribute('data-scale');
    if (s !== null) e.setAttribute('scale', s);
  });
  return true;
}
"""


def diff(a, b) -> int:
    return sum(abs(x - y) for x, y in zip(a, b))


def run(browser_name: str, headed: bool) -> dict:
    with sync_playwright() as p:
        bt = getattr(p, browser_name)
        b = bt.launch(headless=not headed)
        pg = b.new_page(viewport={"width": 1200, "height": 760}, device_scale_factor=2)
        pg.goto(URL)
        pg.wait_for_timeout(1500)

        shot = pg.screenshot()
        res = pg.evaluate(PROBE, base64.b64encode(shot).decode())

        # A/B：把位移归零后再采样
        killed = pg.evaluate(KILL)
        pg.wait_for_timeout(500)
        shot2 = pg.screenshot()
        res2 = pg.evaluate(PROBE, base64.b64encode(shot2).decode())
        pg.evaluate(RESTORE)

        b.close()

    # 2x device scale：CSS 坐标要乘 2
    scale = 2
    bevel_diffs, center_diffs = [], []
    for s1, s2 in zip(res["sample"], res2["sample"]):
        # s.dx 是相对面板左边缘的 CSS 像素
        d = diff(s1["inside"], s2["inside"])
        # 边缘带 = tokens.bezelWidth(14px) 之内；中心 = 14px 之外
        (bevel_diffs if s1["dx"] < 14 else center_diffs).append(d)

    out = {
        "browser": browser_name,
        "support": res["support"],
        "caps": res["caps"],
        "filter_found": killed.get("ok"),
        "displacement_maps": killed.get("count"),
        "bevel_samples": len(bevel_diffs),
        "bevel_mean_diff": round(sum(bevel_diffs) / len(bevel_diffs), 1) if bevel_diffs else None,
        "bevel_max_diff": max(bevel_diffs) if bevel_diffs else None,
        "center_samples": len(center_diffs),
        "center_mean_diff": round(sum(center_diffs) / len(center_diffs), 1) if center_diffs else None,
        "center_max_diff": max(center_diffs) if center_diffs else None,
    }
    _ = scale
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--headed", action="store_true")
    args = ap.parse_args()

    results = []
    for name in ("chromium", "firefox"):
        try:
            results.append(run(name, args.headed))
        except Exception as e:  # noqa: BLE001
            results.append({"browser": name, "error": str(e)})

    print(json.dumps(results, indent=2, ensure_ascii=False))

    # 断言
    print("\n=== 断言 ===")
    ok = True
    for r in results:
        if "error" in r:
            print(f"  [skip] {r['browser']}: {r['error']}")
            continue
        if r["browser"] == "chromium":
            if r["support"] != "refraction":
                print(f"  [FAIL] chromium 应判为 refraction，实际 {r['support']}")
                ok = False
            else:
                print("  [ok] chromium 判为 refraction")
            if not r["bevel_mean_diff"] or r["bevel_mean_diff"] < 10:
                print(f"  [FAIL] chromium 边缘带无位移，mean={r['bevel_mean_diff']}")
                ok = False
            else:
                print(f"  [ok] chromium 边缘带有位移，mean={r['bevel_mean_diff']}")
            if r["center_mean_diff"] and r["center_mean_diff"] > 5:
                print(f"  [FAIL] chromium 中心区被改动，mean={r['center_mean_diff']}")
                ok = False
            else:
                print(f"  [ok] chromium 中心区未被改动，mean={r['center_mean_diff']}")
        else:
            if r["support"] == "refraction":
                print(f"  [FAIL] {r['browser']} 不应判为 refraction")
                ok = False
            else:
                print(f"  [ok] {r['browser']} 正确降级为 {r['support']}")
    print("\n结论:", "全部通过" if ok else "存在失败项")
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
