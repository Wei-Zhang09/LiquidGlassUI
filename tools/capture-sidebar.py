#!/usr/bin/env python3
"""启动 Compose 桌面原型并截窗口，用于人工确认观感。"""
from __future__ import annotations

import os
import pathlib
import subprocess
import time

ROOT = pathlib.Path(__file__).resolve().parent.parent
COMPOSE = ROOT / "packages" / "compose"
OUT = ROOT / "docs" / "screenshots" / "compose-sidebar.png"
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


def main() -> int:
    kill_java()
    time.sleep(2)
    env = {**os.environ, "JAVA_HOME": JDK}
    print("启动…")
    proc = subprocess.Popen(
        [str(COMPOSE / "gradlew.bat"), "--no-daemon", "-q", "run"],
        cwd=str(COMPOSE), env=env,
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    try:
        if not wait_window():
            print("窗口未出现")
            return 1
        # 连拍 3 帧取最后一帧，确保渲染稳定
        frames = []
        tmp = OUT.with_name("_probe_" + OUT.name)
        for _ in range(3):
            time.sleep(2.0)
            r = sh(["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass",
                    "-File", str(ROOT / "tools" / "capture-window.ps1")],
                   env={**os.environ, "OUTPNG": str(tmp)})
            if "SAVED" in r.stdout:
                frames.append(tmp.read_bytes())
        tmp.unlink(missing_ok=True)
        if not frames:
            print("截图失败")
            return 1
        OUT.write_bytes(frames[-1])
        print(f"已保存 {OUT}  ({OUT.stat().st_size} bytes)")
        return 0
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=10)
        except subprocess.TimeoutExpired:
            proc.kill()
        kill_java()


if __name__ == "__main__":
    raise SystemExit(main())
