#!/usr/bin/env python3
"""验证 GlassSidebar 的点击选择交互。

渲染正确不等于交互正确。本脚本：
  1. 启动应用，截图作为基线
  2. 用 Windows API 在侧栏条目位置真实点击
  3. 再截图，比较右侧内容区标题是否随之改变
  4. 若改变 → 选择交互生效

坐标换算：Compose 的 dp 坐标 → 屏幕像素，需要窗口原点 + 标题栏高度 + DPI 缩放。
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
SHOTS = ROOT / "docs" / "screenshots"
TITLE = "LiquidGlassUI Compose Prototype"
JDK = r"C:\Program Files\Java\jdk-21"


def sh(cmd, **kw):
    return subprocess.run(cmd, capture_output=True, text=True,
                          encoding="utf-8", errors="replace", **kw)


def kill_java():
    for line in sh(["tasklist"]).stdout.splitlines():
        if line.lower().startswith("java.exe"):
            p = line.split()
            if len(p) > 1:
                sh(["taskkill", "/F", "/PID", p[1]])


def wait_window(timeout=240) -> bool:
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


CLICK_PS = r"""
param([int]$X, [int]$Y)
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class M {
  [DllImport("user32.dll")] public static extern bool SetCursorPos(int x, int y);
  [DllImport("user32.dll")] public static extern void mouse_event(uint f, uint dx, uint dy, uint d, IntPtr e);
  [DllImport("user32.dll")] public static extern IntPtr FindWindow(string c, string n);
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
  [StructLayout(LayoutKind.Sequential)]
  public struct RECT { public int Left; public int Top; public int Right; public int Bottom; }
}
"@
$h = [M]::FindWindow($null, "LiquidGlassUI Compose Prototype")
if ($h -eq [IntPtr]::Zero) { Write-Output "NO_WINDOW"; exit 1 }
[M]::SetForegroundWindow($h) | Out-Null
Start-Sleep -Milliseconds 500
$r = New-Object M+RECT
[M]::GetWindowRect($h, [ref]$r) | Out-Null
$sx = $r.Left + $X
$sy = $r.Top + $Y
[M]::SetCursorPos($sx, $sy) | Out-Null
Start-Sleep -Milliseconds 250
[M]::mouse_event(0x0002, 0, 0, 0, [IntPtr]::Zero)   # LEFTDOWN
Start-Sleep -Milliseconds 80
[M]::mouse_event(0x0004, 0, 0, 0, [IntPtr]::Zero)   # LEFTUP
Write-Output "CLICKED $sx,$sy"
"""


def click(rel_x: int, rel_y: int) -> bool:
    ps1 = ROOT / "tools" / "_click.ps1"
    r = sh(["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass",
            "-File", str(ps1), "-X", str(rel_x), "-Y", str(rel_y)])
    return "CLICKED" in r.stdout


def capture(path: pathlib.Path) -> bool:
    r = sh(["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass",
            "-File", str(ROOT / "tools" / "capture-window.ps1")],
           env={**os.environ, "OUTPNG": str(path)})
    return "SAVED" in r.stdout


# 读取右侧内容区标题区域的像素指纹（标题是深色大字，位置固定）
HEAD_FP = r"""
async (b64) => {
  const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
  const c = document.createElement('canvas');
  c.width = img.width; c.height = img.height;
  const g = c.getContext('2d'); g.drawImage(img, 0, 0);
  // 右侧面板标题大致区域：面板起点 x≈290，标题在 y≈70..110
  let sum = 0, dark = 0, n = 0;
  for (let y = 65; y < 115; y += 2) {
    for (let x = 300; x < 620; x += 2) {
      const p = g.getImageData(x, y, 1, 1).data;
      const lum = 0.299*p[0] + 0.587*p[1] + 0.114*p[2];
      sum += lum; n++;
      if (lum < 110) dark++;   // 深色文字像素
    }
  }
  return { meanLum: +(sum/n).toFixed(2), darkPx: dark, n };
}
"""


def main() -> int:
    SHOTS.mkdir(parents=True, exist_ok=True)
    (ROOT / "tools" / "_click.ps1").write_text(CLICK_PS, encoding="utf-8")

    kill_java()
    time.sleep(2)
    env = {**os.environ, "JAVA_HOME": JDK}
    print("启动…")
    proc = subprocess.Popen(
        [str(COMPOSE / "gradlew.bat"), "--no-daemon", "-q", "run"],
        cwd=str(COMPOSE), env=env,
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    tmp = SHOTS / "_click_probe.png"
    try:
        if not wait_window():
            print("窗口未出现")
            return 1
        time.sleep(4)

        if not capture(tmp):
            print("基线截图失败")
            return 1
        base = base64.b64encode(tmp.read_bytes()).decode()

        # 侧栏条目 y 坐标（Compose dp）：标题栏约 32px，再叠加条目中心
        # 初始选中 "组件"(item1)。点击 "设置"(item5) 应改变右侧标题。
        targets = [("设置", 336), ("概览", 116)]
        results = []
        with sync_playwright() as p:
            br = p.chromium.launch()
            pg = br.new_page()
            pg.goto("about:blank")
            before = pg.evaluate(HEAD_FP, base)
            print(f"基线标题区: {before}")

            for name, y in targets:
                print(f"点击「{name}」(y={y})…")
                if not click(144, y):
                    print("  点击失败")
                    continue
                time.sleep(1.5)
                if not capture(tmp):
                    print("  截图失败")
                    continue
                fp = pg.evaluate(HEAD_FP, base64.b64encode(tmp.read_bytes()).decode())
                changed = abs(fp["darkPx"] - before["darkPx"]) > 20
                print(f"  标题区: {fp}  变化={'是' if changed else '否'}")
                results.append((name, changed))
                before = fp

            br.close()

        print("\n=== 断言 ===")
        ok = any(c for _, c in results)
        for name, changed in results:
            print(f"  {'[ok]' if changed else '[FAIL]'} 点击「{name}」→ 右侧标题"
                  f"{'随之改变' if changed else '未改变'}")
        print("\n结论:", "选择交互生效" if ok else "未检测到交互效果")
        return 0 if ok else 1
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=10)
        except subprocess.TimeoutExpired:
            proc.kill()
        kill_java()
        tmp.unlink(missing_ok=True)
        (ROOT / "tools" / "_click.ps1").unlink(missing_ok=True)


if __name__ == "__main__":
    raise SystemExit(main())
