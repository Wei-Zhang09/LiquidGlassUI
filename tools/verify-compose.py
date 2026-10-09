#!/usr/bin/env python3
"""Compose 桌面端折射的 A/B 验证。

跑两次渲染：
  A) 正常（含 lens 折射）
  B) LG_NO_LENS=1（关掉折射）

不硬编码、也不猜测面板坐标。改为分析【差异图本身】：
  1. 算出所有差异 > 阈值的像素
  2. 取这些像素的包围盒（这就是玻璃的轮廓，自校准）
  3. 在包围盒内，比较"靠近边界的一圈"与"深处"的差异强度

判定：差异必须集中在边界一圈（边缘折射），深处应接近 0。
如果深处和边界一样强，说明是整体模糊/色调变化，不是边缘折射。
"""
from __future__ import annotations

import base64
import json
import os
import pathlib
import subprocess
import time

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
COMPOSE = ROOT / "packages" / "compose"
OUT = ROOT / "docs" / "screenshots"
TITLE = "LiquidGlassUI Compose Prototype"
JDK = r"C:\Program Files\Java\jdk-21"


def kill_java() -> None:
    out = subprocess.run(["tasklist"], capture_output=True, text=True, errors="replace").stdout
    for line in out.splitlines():
        if line.lower().startswith("java.exe"):
            p = line.split()
            if len(p) > 1:
                subprocess.run(["taskkill", "/F", "/PID", p[1]], capture_output=True)


def wait_window(timeout: int = 220) -> bool:
    ps = ("powershell -NoProfile -Command \""
          "(Get-Process java -ErrorAction SilentlyContinue | "
          "Where-Object {$_.MainWindowTitle -eq '" + TITLE + "'} | "
          "Measure-Object).Count\"")
    for _ in range(timeout // 5):
        time.sleep(5)
        r = subprocess.run(ps, shell=True, capture_output=True, text=True)
        if r.stdout.strip().isdigit() and int(r.stdout.strip()) > 0:
            return True
    return False


def capture(out_png: pathlib.Path) -> bool:
    env = {**os.environ, "OUTPNG": str(out_png)}
    r = subprocess.run(
        ["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass",
         "-File", str(ROOT / "tools" / "capture-window.ps1")],
        capture_output=True, text=True, encoding="utf-8", errors="replace", env=env,
    )
    if "SAVED" not in r.stdout:
        print("  截图失败:", r.stdout.strip()[:200])
        return False
    return True


def run_variant(no_lens: bool, out_png: pathlib.Path) -> bool:
    kill_java()
    time.sleep(2)
    env = {**os.environ, "JAVA_HOME": JDK}
    if no_lens:
        env["LG_NO_LENS"] = "1"
    print(f"  启动（lens={'关' if no_lens else '开'}）…")
    proc = subprocess.Popen(
        [str(COMPOSE / "gradlew.bat"), "--no-daemon", "-q", "run"],
        cwd=str(COMPOSE), env=env,
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    try:
        if not wait_window():
            print("  窗口未出现")
            return False
        time.sleep(2)
        return capture(out_png)
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=10)
        except subprocess.TimeoutExpired:
            proc.kill()
        kill_java()


ANALYZE = r"""
async (pair) => {
  const [b64a, b64b] = pair;
  const load = async (s) => {
    const img = new Image(); img.src = 'data:image/png;base64,' + s; await img.decode();
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0);
    return g;
  };
  const A = await load(b64a), B = await load(b64b);
  const w = A.canvas.width, h = A.canvas.height;

  // 差异图
  const d = new Float32Array(w * h);
  let maxD = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const a = A.getImageData(x, y, 1, 1).data;
      const b = B.getImageData(x, y, 1, 1).data;
      const v = Math.abs(a[0]-b[0]) + Math.abs(a[1]-b[1]) + Math.abs(a[2]-b[2]);
      d[y * w + x] = v;
      if (v > maxD) maxD = v;
    }
  }

  // 用 maxD 的一个比例做阈值，避免绝对阈值选错
  const T = Math.max(12, maxD * 0.25);
  let minX = w, maxX = -1, minY = h, maxY = -1, count = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (d[y * w + x] > T) {
        count++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (count === 0) return { error: 'no diff above threshold', maxD, T };

  // 包围盒内，按"到边界距离"分桶统计差异强度
  const buckets = {};  // 距离桶 -> [sum, n]
  const BW = 8;
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const ed = Math.min(x - minX, maxX - x, y - minY, maxY - y);
      const bkt = Math.floor(ed / BW) * BW;
      const v = d[y * w + x];
      if (!buckets[bkt]) buckets[bkt] = [0, 0];
      buckets[bkt][0] += v;
      buckets[bkt][1]++;
    }
  }
  const profile = Object.keys(buckets)
    .map(Number).sort((a, b) => a - b)
    .map(k => ({ dist: k, mean: +(buckets[k][0] / buckets[k][1]).toFixed(1), n: buckets[k][1] }));

  return {
    size: [w, h],
    maxDiff: +maxD.toFixed(1),
    threshold: +T.toFixed(1),
    diffPixelCount: count,
    bbox: { minX, maxX, minY, maxY, w: maxX - minX + 1, h: maxY - minY + 1 },
    profile,
  };
}
"""


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    on = OUT / "compose-desktop-windows.png"
    off = OUT / "_compose-nolens.png"

    print("[1/2] 渲染 A：含折射")
    if not run_variant(False, on):
        return 1
    print("[2/2] 渲染 B：关闭折射")
    if not run_variant(True, off):
        return 1

    a = base64.b64encode(on.read_bytes()).decode()
    b = base64.b64encode(off.read_bytes()).decode()
    with sync_playwright() as p:
        br = p.chromium.launch()
        pg = br.new_page()
        pg.goto("about:blank")
        res = pg.evaluate(ANALYZE, [a, b])
        br.close()

    off.unlink(missing_ok=True)
    print("\n=== 结果 ===")
    print(json.dumps(res, indent=2, ensure_ascii=False))

    if "error" in res:
        print("\n无法判定：", res["error"])
        return 1

    print("\n=== 差异随「到玻璃边界距离」的衰减 ===")
    for row in res["profile"]:
        bar = "#" * min(50, int(row["mean"] / 4))
        print(f"  距边界 {row['dist']:>3}-{row['dist'] + 7:>3}px  mean={row['mean']:>7.1f}  n={row['n']:>6}  {bar}")

    prof = res["profile"]
    if not prof:
        print("\n无数据")
        return 1
    edge_mean = prof[0]["mean"]
    deep_mean = prof[-1]["mean"]
    print(f"\n最外圈 mean={edge_mean}  最深圈 mean={deep_mean}  比值={edge_mean / max(deep_mean, 0.1):.1f}x")

    print("\n=== 断言（自校准：以实测内部本底为基准）===")
    ok = True

    # 边缘 = 第一桶；内部本底 = 距边界 >= 3 倍边缘带宽度之后的中位数
    edge_mean = prof[0]["mean"]
    deep = [p["mean"] for p in prof[3:]] or [0]
    deep_sorted = sorted(deep)
    baseline = deep_sorted[len(deep_sorted) // 2]  # 中位数，抗文字区域的偶发差异

    print(f"  边缘带(0-7px) mean = {edge_mean}")
    print(f"  内部本底中位数     = {baseline}")
    print(f"  集中度             = {edge_mean / max(baseline, 0.1):.1f}x")

    # 1) 边缘必须显著高于内部本底
    if edge_mean < 5 or edge_mean < baseline * 5:
        print(f"  [FAIL] 边缘差异未显著高于内部本底")
        ok = False
    else:
        print(f"  [ok] 边缘差异显著高于内部本底")

    # 2) 内部必须接近无差异（本底 <= 1.0）
    if baseline > 1.0:
        print(f"  [FAIL] 内部本底偏高 = {baseline}，说明不是纯边缘效果")
        ok = False
    else:
        print(f"  [ok] 内部接近无差异 = {baseline}")

    # 3) 衰减必须是单调下降的（边缘 -> 内部）
    first_three = [p["mean"] for p in prof[:3]]
    if not (first_three[0] > first_three[1] >= first_three[2] * 0.5):
        print(f"  [WARN] 衰减不够干净：{first_three}")
    else:
        print(f"  [ok] 差异由边缘向内部衰减：{first_three}")

    print("\n结论:", "通过" if ok else "失败")
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
