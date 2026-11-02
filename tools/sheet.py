#!/usr/bin/env python3
"""tools/sheet.py — аркуш мініатюр для огляду кадрів (вибрати момент).
   python3 tools/sheet.py <тека> <аркуш.jpg> [--cols 8] [--w 220]
"""
import sys, os, argparse
from PIL import Image, ImageDraw

ap = argparse.ArgumentParser()
ap.add_argument('dir'); ap.add_argument('out')
ap.add_argument('--cols', type=int, default=8); ap.add_argument('--w', type=int, default=220)
a = ap.parse_args()
files = sorted(f for f in os.listdir(a.dir) if f.endswith('.png'))
if not files: sys.exit('порожньо: ' + a.dir)
ims = [Image.open(os.path.join(a.dir, f)).convert('RGB') for f in files]
w = a.w; h = round(ims[0].height * w / ims[0].width); lab = 16
rows = (len(ims) + a.cols - 1) // a.cols
sheet = Image.new('RGB', (a.cols * (w + 4) + 4, rows * (h + lab + 4) + 4), (20, 20, 30))
d = ImageDraw.Draw(sheet)
for i, (f, im) in enumerate(zip(files, ims)):
    x = 4 + (i % a.cols) * (w + 4); y = 4 + (i // a.cols) * (h + lab + 4)
    sheet.paste(im.resize((w, h), Image.LANCZOS), (x, y + lab))
    d.text((x + 2, y + 2), os.path.splitext(f)[0], fill=(230, 230, 240))
sheet.save(a.out, quality=85)
print(a.out, sheet.size, len(files), 'кадрів')
