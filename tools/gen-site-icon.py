"""从用户提供的花瓣图标生成站点 logo 与简化版 favicon。

原图 1254×1254 RGBA（玻璃质感渐变花瓣，蓝→紫→粉，带高光/阴影）。
问题：32×32 下细节会糊成蓝紫团。因此生成两套：
  - logo.png     原图细节（512），用于导航栏/首页
  - favicon*.png 简化版（提饱和 + 提对比 + 中值去噪 + 锐化），用于标签页
"""
from PIL import Image, ImageEnhance, ImageFilter
import base64
import pathlib

SRC = r"C:/Users/zw/Downloads/玻璃质感渐变花瓣图标.png"
OUT = pathlib.Path(r"D:/HermesWorkSpace/LiquidGlassUI/docs/site/public")
OUT.mkdir(parents=True, exist_ok=True)

im = Image.open(SRC).convert("RGBA")
print("原图尺寸:", im.size)

# 1) 按 alpha 包围盒裁掉透明边，再补成正方形
bbox = im.split()[-1].getbbox()
print("内容包围盒:", bbox)
icon = im.crop(bbox)
iw, ih = icon.size
s = max(iw, ih)
sq = Image.new("RGBA", (s, s), (0, 0, 0, 0))
sq.paste(icon, ((s - iw) // 2, (s - ih) // 2))
print("裁切补方后:", sq.size)

# 2) logo：保留原图细节
sq.resize((512, 512), Image.LANCZOS).save(OUT / "logo.png")
print("已存 logo.png 512x512")

# 3) favicon 简化版：小尺寸下要更"实"
def simplify(img, sat=1.45, con=1.18, sharp_pct=60):
    # ⚠️ MedianFilter(1) 会让 PIL 原生崩溃（进程直接消失，rc=127，无 Python 异常）。
    # 实测 size=1 崩、3/5/7/9/11/15 都正常 —— 用 3。
    x = img.filter(ImageFilter.MedianFilter(3))      # 去极细高光噪点
    x = ImageEnhance.Color(x).enhance(sat)           # 提饱和
    a = x.split()[-1]
    rgb = ImageEnhance.Contrast(x.convert("RGB")).enhance(con)  # 提对比（只作用 RGB）
    x = Image.merge("RGBA", (*rgb.split(), a))
    return x.filter(ImageFilter.UnsharpMask(radius=2, percent=sharp_pct, threshold=2))

big = simplify(sq.resize((512, 512), Image.LANCZOS))
for size, name in [(180, "apple-touch-icon.png"), (64, "favicon-64.png"),
                   (32, "favicon.png"), (16, "favicon-16.png")]:
    big.resize((size, size), Image.LANCZOS).save(OUT / name)
    print(f"已存 {name} {size}x{size}")

# 4) SVG favicon（内嵌 PNG，现代浏览器优先用）
b32 = base64.b64encode((OUT / "favicon.png").read_bytes()).decode()
(OUT / "favicon.svg").write_text(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">'
    f'<image width="32" height="32" href="data:image/png;base64,{b32}"/></svg>',
    encoding="utf-8")
print("已存 favicon.svg")

print()
print("产物:", sorted(p.name for p in OUT.iterdir()))
