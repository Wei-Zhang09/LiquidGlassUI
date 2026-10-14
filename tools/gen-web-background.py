#!/usr/bin/env python3
"""生成 Web 示例用的高对比测试背景。

为什么需要：照片背景好看但折射不明显（纹理太柔和，位移看不出来）。
测试图用**细网格 + 高对比色块**，玻璃边缘的位移与色散一眼可见。

输出：examples/web/assets/pattern.png
"""
import pathlib
from PIL import Image, ImageDraw

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "examples" / "web" / "assets" / "pattern.png"

W, H = 1600, 1000
im = Image.new("RGB", (W, H), (250, 250, 252))
d = ImageDraw.Draw(im)

# 1) 细网格：位移最容易被看出的图案（直线弯曲）
GRID = 20
for x in range(0, W, GRID):
    d.line([(x, 0), (x, H)], fill=(150, 165, 180), width=1)
for y in range(0, H, GRID):
    d.line([(0, y), (W, y)], fill=(150, 165, 180), width=1)

# 2) 主网格：每 5 格加深，便于数位移量
for x in range(0, W, GRID * 5):
    d.line([(x, 0), (x, H)], fill=(90, 105, 125), width=2)
for y in range(0, H, GRID * 5):
    d.line([(0, y), (W, y)], fill=(90, 105, 125), width=2)

# 3) 高对比色块：检验色散（chromatic aberration）—— 边缘会分离出红/蓝
blocks = [
    (0, 0, 320, 200, (232, 62, 62)),      # 红
    (320, 0, 640, 200, (32, 132, 232)),   # 蓝
    (640, 0, 960, 200, (24, 168, 96)),    # 绿
    (960, 0, 1280, 200, (240, 196, 32)),  # 黄
    (1280, 0, 1600, 200, (150, 70, 200)), # 紫
    (0, 800, 320, 1000, (150, 70, 200)),
    (320, 800, 640, 1000, (240, 196, 32)),
    (640, 800, 960, 1000, (24, 168, 96)),
    (960, 800, 1280, 1000, (32, 132, 232)),
    (1280, 800, 1600, 1000, (232, 62, 62)),
]
for x0, y0, x1, y1, c in blocks:
    d.rectangle([x0, y0, x1, y1], fill=c)

# 4) 同心圆：检验径向位移是否连续（融合区最容易露馅的地方）
cx, cy = W // 2, H // 2
for r in range(40, 360, 40):
    d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(60, 72, 90), width=3)

# 5) 细密斜线区：高频纹理，位移最敏感
for i in range(0, 700, 8):
    d.line([(0, 200 + i), (700, 200 + i - 700)], fill=(70, 85, 105), width=1)

OUT.parent.mkdir(parents=True, exist_ok=True)
im.save(OUT)
print(f"已保存 {OUT}  ({OUT.stat().st_size} bytes, {W}x{H})")
