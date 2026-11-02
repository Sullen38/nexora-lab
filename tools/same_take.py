#!/usr/bin/env python3
"""tools/same_take.py — чи дубль повторюється: порівняти дві теки кадрів піксель у піксель.
   python3 tools/same_take.py <тека1> <тека2>      (код виходу 1 — є різниця)
"""
import sys, os
from PIL import Image, ImageChops

a, b = sys.argv[1], sys.argv[2]
names = sorted(f for f in os.listdir(a) if f.endswith('.png'))
bad = 0
for f in names:
    pb = os.path.join(b, f)
    if not os.path.exists(pb): print(f'{f}: немає в другій теці'); bad += 1; continue
    ia, ib = Image.open(os.path.join(a, f)).convert('RGB'), Image.open(pb).convert('RGB')
    if ia.size != ib.size: print(f'{f}: розмір {ia.size} / {ib.size}'); bad += 1; continue
    box = ImageChops.difference(ia, ib).getbbox()
    if box:
        d = ImageChops.difference(ia, ib).convert('L'); n = sum(1 for v in d.getdata() if v)
        print(f'{f}: РІЗНИЦЯ {n} px у {box}'); bad += 1
    else: print(f'{f}: однаково')
print('УСЕ ОДНАКОВО' if not bad else f'різниця в {bad} кадрах'); sys.exit(1 if bad else 0)
