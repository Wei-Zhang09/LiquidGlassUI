#!/usr/bin/env python3
"""证明 tokens 单源在【渲染层】闭环。

步骤：
  1. 用默认 tokens（radius.lg = 26）渲染 → 截图 A
  2. 改 tokens.json: radius.lg 26 -> 60，重新生成
  3. 重建 + 渲染 → 截图 B
  4. 比较 A/B：圆角应明显变大
  5. 恢复 tokens.json 并重新生成

只有 A/B 出现可测差异，才能说"改一处 JSON，渲染随之改变"。
"""
from __future__ import annotations

import base64
import json
import os
import pathlib
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
COMPOSE = ROOT / "packages" / "compose"
TOKENS = ROOT / "packages" / "tokens" / "tokens.json"
SHOTS = ROOT / "docs" / "screenshots"
TITLE = "LiquidGlassUI Compose Prototype"
JDK = r"C:\Program Files\Java\jdk-21"


def sh(cmd, **kw):
    return subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8",
                          errors="replace", **kw)


def kill_java():
    out = sh(["tasklist"]).stdout
    for line in out.splitlines():
        if line.lower().startswith("java.exe"):
            p = line.split()
            if len(p) > 1:
                sh(["taskkill", "/F", "/PID", p[1]])


def wait_window(timeout=240):
    ps = ("powershell -NoProfile -Command \""
          "(Get-Process java -ErrorAction SilentlyContinue | "
          "Where-Object {$_.MainWindowTitle -eq '" + TITLE + "'} | "
          "Measure-Object).Count\"")
    for _ in range(timeout // 5):
        time.sleep(5)
        r = sh(ps, shell=True)
        if r.stdout.strip().isdigit() and int(r.stdout.strip()) > 0:
            return True
    return False


def capture(out_png: pathlib.Path) -> bool:
    env = {**os.environ, "OUTPNG": str(out_png)}
    r = sh(["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass",
            "-File", str(ROOT / "tools" / "capture-window.ps1")], env=env)
    return "SAVED" in r.stdout


def render(out_png: pathlib.Path) -> bool:
    """重建并渲染一帧。"""
    kill_java()
    time.sleep(2)
    env = {**os.environ, "JAVA_HOME": JDK}
    print("    编译…")
    b = sh([str(COMPOSE / "gradlew.bat"), "--no-daemon", "-q", "classes"],
           cwd=str(COMPOSE), env=env)
    if b.returncode != 0:
        print("    编译失败：")
        print("   ", (b.stdout or "")[-1200:])
        print("   ", (b.stderr or "")[-800:])
        return False
    print("    启动…")
    proc = subprocess.Popen(
        [str(COMPOSE / "gradlew.bat"), "--no-daemon", "-q", "run"],
        cwd=str(COMPOSE), env=env,
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    try:
        if not wait_window():
            print("    窗口未出现")
            return False
        time.sleep(4)  # 让渲染稳定
        return capture(out_png)
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=10)
        except subprocess.TimeoutExpired:
            proc.kill()
        kill_java()


COMPARE = r"""
async (pair) => {
  const [b64a, b64b] = pair;
  const load = async (s) => {
    const img = new Image(); img.src = 'data:image/png;base64,' + s; await img.decode();
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const g = c.getContext('2d'); g.drawImage(img, 0, 0); return g;
  };
  const A = await load(b64a), B = await load(b64b);
  const w = A.canvas.width, h = A.canvas.height;

  // 面板在窗口中的大致范围（340x150 居中；窗口 1000x680，含标题栏）
  const PL = 330, PR = 670, PT = 320, PB = 440;
  const CORNER = 70;   // 圆角影响的角区尺寸

  const zone = { corner: [0, 0], edge: [0, 0], inside: [0, 0], outside: [0, 0] };
  let total = 0;

  for (let y = 0; y < h; y += 2) {
    for (let x = 0; x < w; x += 2) {
      const a = A.getImageData(x, y, 1, 1).data;
      const b = B.getImageData(x, y, 1, 1).data;
      const d = Math.abs(a[0]-b[0]) + Math.abs(a[1]-b[1]) + Math.abs(a[2]-b[2]);
      total += d;
      const inPanel = x >= PL && x <= PR && y >= PT && y <= PB;
      if (!inPanel) { zone.outside[0] += d; zone.outside[1]++; continue; }
      const dcx = Math.min(x - PL, PR - x);
      const dcy = Math.min(y - PT, PB - y);
      if (dcx < CORNER && dcy < CORNER) { zone.corner[0] += d; zone.corner[1]++; }
      else if (dcx < CORNER || dcy < CORNER) { zone.edge[0] += d; zone.edge[1]++; }
      else { zone.inside[0] += d; zone.inside[1]++; }
    }
  }

  const out = {};
  for (const k of Object.keys(zone)) {
    const [sum, n] = zone[k];
    out[k] = { n, mean: n ? +(sum / n).toFixed(2) : null };
  }
  return { size: [w, h], zones: out, overallMean: +(total / (w * h / 4)).toFixed(2) };
}
"""

def main() -> int:
    SHOTS.mkdir(parents=True, exist_ok=True)
    a_png = SHOTS / "_tokens_radius26.png"
    b_png = SHOTS / "_tokens_radius60.png"

    original = TOKENS.read_text(encoding="utf-8")
    try:
        print("[1/4] 默认 tokens（radius.lg=26）渲染")
        if not render(a_png):
            return 1

        print("[2/4] 改 tokens.json: radius.lg 26 -> 60")
        t = json.loads(original)
        assert t["radius"]["lg"] == 26, f"预期 26，实际 {t['radius']['lg']}"
        t["radius"]["lg"] = 60
        TOKENS.write_text(json.dumps(t, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        r = sh([sys.executable, str(ROOT / "tools" / "gen-tokens.py")])
        print("   ", r.stdout.strip().splitlines()[-1] if r.stdout else "")

        print("[3/4] 用新 tokens 重建并渲染")
        if not render(b_png):
            return 1

        print("[4/4] 比较两张截图")
        a = base64.b64encode(a_png.read_bytes()).decode()
        b = base64.b64encode(b_png.read_bytes()).decode()
        with sync_playwright() as p:
            br = p.chromium.launch()
            pg = br.new_page()
            pg.goto("about:blank")
            res = pg.evaluate(COMPARE, [a, b])
            br.close()
        print("\n=== 结果 ===")
        print(json.dumps(res, indent=2, ensure_ascii=False))

        print("\n=== 差异的空间分布 ===")
        z = res["zones"]
        for k in ("corner", "edge", "inside", "outside"):
            mean = z[k]["mean"]
            bar = "#" * min(50, int(mean or 0))
            print(f"  {k:8s} n={z[k]['n']:>6}  mean={str(mean):>7}  {bar}")

        print("\n=== 断言 ===")
        ok = True
        corner = z["corner"]["mean"] or 0
        edge = z["edge"]["mean"] or 0
        outside = z["outside"]["mean"] or 0

        # 改的是 radius.lg，差异必须集中在角区
        if corner < 5:
            print(f"  [FAIL] 角区无变化 mean={corner}，圆角 token 未影响渲染")
            ok = False
        else:
            print(f"  [ok] 角区有明显变化 mean={corner}")
        if corner < edge * 5:
            print(f"  [FAIL] 变化未集中在角区（角 {corner} vs 边 {edge}）")
            ok = False
        else:
            print(f"  [ok] 变化集中在角区（角 {corner} vs 边 {edge}，"
                  f"{corner / max(edge, 0.01):.0f}x）")
        if outside > 1.5:
            print(f"  [WARN] 玻璃外也有变化 mean={outside}，可能是窗口合成抖动")
        else:
            print(f"  [ok] 玻璃外基本无变化 mean={outside}")

        print("\n结论:", "tokens 单源在渲染层闭环" if ok else "未闭环")
        return 0 if ok else 1
    finally:
        TOKENS.write_text(original, encoding="utf-8", newline="\n")
        sh([sys.executable, str(ROOT / "tools" / "gen-tokens.py")])
        for f in (a_png, b_png):
            f.unlink(missing_ok=True)
        print("\n已恢复 tokens.json 并重新生成")


if __name__ == "__main__":
    raise SystemExit(main())
