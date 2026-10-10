#!/usr/bin/env python3
"""Web 示例的渲染验证：截图 + 检查各组件是否渲染、降级是否正确。"""
from __future__ import annotations

import base64
import json
import pathlib

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
URL = "http://127.0.0.1:8913/examples/web/index.html"
OUT = ROOT / "docs" / "screenshots"

PROBE = """() => {
  const tags = ['lg-glass-surface','lg-glass-button','lg-glass-card','lg-glass-navbar','lg-glass-bottombar','lg-glass-group'];
  const out = {};
  for (const t of tags) {
    const els = [...document.querySelectorAll(t)];
    out[t] = {
      count: els.length,
      supports: els.map(e => e.getAttribute('data-support')),
      filterVars: els.map(e => getComputedStyle(e).getPropertyValue('--lg-filter').trim()).filter(Boolean),
    };
  }
  out.caps = window.__lg ? window.__lg.caps : null;
  out.level = window.__lg ? window.__lg.support : null;

  // 融合验证：组内子元素应拿到 lg-fused- 前缀的滤镜，
  // 而不是各自申请的单形状滤镜（后者意味着融合没生效）
  out.fusion = [...document.querySelectorAll('lg-glass-group')].map(g => {
    const kids = [...g.children];
    const ids = kids.map(k => k.getAttribute('data-lg-group-filter'));
    return {
      smoothing: g.getAttribute('smoothing'),
      childCount: kids.length,
      filterIds: ids,
      allFused: ids.length > 0 && ids.every(i => i && i.startsWith('lg-fused-')),
    };
  });
  return out;
}"""


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    results = []

    with sync_playwright() as p:
        for name, shot in (("chromium", "web-showcase-chromium.png"),
                           ("firefox", "web-showcase-firefox.png")):
            bt = getattr(p, name)
            b = bt.launch()
            pg = b.new_page(viewport={"width": 1280, "height": 1100}, device_scale_factor=2)
            errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.on("requestfailed", lambda r: errs.append(f"REQFAIL {r.url}"))
            pg.goto(URL)
            pg.wait_for_timeout(2000)
            data = pg.evaluate(PROBE)
            pg.screenshot(path=str(OUT / shot), full_page=True)
            b.close()

            data["browser"] = name
            data["errors"] = errs
            results.append(data)
            print(f"\n=== {name} ===")
            print(json.dumps(data, indent=2, ensure_ascii=False))

    print("\n=== 断言 ===")
    ok = True
    for r in results:
        name = r["browser"]
        if r["errors"]:
            print(f"  [FAIL] {name} 有 JS 错误: {r['errors'][:2]}")
            ok = False
        else:
            print(f"  [ok] {name} 无 JS 错误")

        # 五个组件都应渲染
        for tag in ("lg-glass-surface", "lg-glass-button", "lg-glass-card",
                    "lg-glass-navbar", "lg-glass-bottombar", "lg-glass-group"):
            n = r[tag]["count"]
            if n == 0:
                print(f"  [FAIL] {name} {tag} 未渲染")
                ok = False
            else:
                print(f"  [ok] {name} {tag} x{n}")

        if name == "chromium":
            if r["level"] != "refraction":
                print(f"  [FAIL] chromium 应判为 refraction，实际 {r['level']}")
                ok = False
            else:
                print("  [ok] chromium 判为 refraction")
            # 至少应有一个组件拿到折射滤镜
            any_filter = any(v["filterVars"] for v in r.values() if isinstance(v, dict) and "filterVars" in v)
            if not any_filter:
                print("  [FAIL] chromium 无组件拿到折射滤镜")
                ok = False
            else:
                print("  [ok] chromium 有组件应用了折射滤镜")
        else:
            if r["level"] == "refraction":
                print(f"  [FAIL] {name} 不应判为 refraction")
                ok = False
            else:
                print(f"  [ok] {name} 正确降级为 {r['level']}")

        # 融合检查：仅 Chromium 会真正分配融合滤镜
        groups = r.get("fusion", [])
        if not groups:
            print(f"  [FAIL] {name} 未找到任何 lg-glass-group")
            ok = False
        for g in groups:
            if name == "chromium":
                if not g["allFused"]:
                    print(f"  [FAIL] chromium 组(smoothing={g['smoothing']}) 未使用融合滤镜: {g['filterIds']}")
                    ok = False
                else:
                    print(f"  [ok] chromium 组(smoothing={g['smoothing']}) "
                          f"{g['childCount']} 个子元素全部使用融合滤镜")
            else:
                # 非 Chromium 不应分配滤镜
                if any(g["filterIds"]):
                    print(f"  [FAIL] {name} 不应分配融合滤镜")
                    ok = False
                else:
                    print(f"  [ok] {name} 组未分配滤镜（已降级）")

    print("\n结论:", "通过" if ok else "失败")
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
