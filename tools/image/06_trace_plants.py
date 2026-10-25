#!/usr/bin/env python3
"""
tools/image/06_trace_plants.py — ВАЗОНИ ЛІВОГО КРИЛА: ТОЧНІ КОПІЇ З КАРТИНКИ КІМНАТИ
--------------------------------------------------------------------------------
Власник попросив вазони "точно такі, як були, і на тих самих місцях". Тому вазони
лівого крила (AI-центр, аналітика, маркетинг) не малюються наново, а переносяться
з assets/room.webp (2x) у чисті спрайти:
  1) маска: листя за кольором (зелене/жовте — не фіолет, не синє, не рожеве),
     темний контур поруч із листям, горщик — простим полігоном; полігон "keep"
     обмежує саму рослину, "drop" — прибирає зайве (сусідні предмети)
  2) кольори зведено до палітри (k-means) і прибрано поодинокі пікселі —
     виходить чистий піксель-арт без розмиття
  3) навколо силуету — темний контур
Результат: assets/plants_wing.png (атлас) + js/objects/wing_plants_data.js
(де кожен спрайт стоїть у кімнаті, де верх горщика — від нього гойдається листя).
Запуск: python3 tools/image/06_trace_plants.py
"""
import json, pathlib, numpy as np, cv2
from PIL import Image
ROOT = pathlib.Path(__file__).resolve().parents[2]
ROOM = np.array(Image.open(ROOT / 'assets/room.webp').convert('RGB'))
RS = ROOM.shape[1] / 1536                       # пікселів картинки на одиницю кімнати (2)

def crop(box):
    x0, y0, x1, y1 = box
    return ROOM[int(round(y0 * RS)):int(round(y1 * RS)), int(round(x0 * RS)):int(round(x1 * RS))].copy()

def poly_mask(shape, polys, box):
    m = np.zeros(shape[:2], np.uint8)
    for p in polys:
        cv2.fillPoly(m, [np.array([[(x - box[0]) * RS, (y - box[1]) * RS] for x, y in p], np.int32)], 1)
    return m

def leafish(c, loose):
    r, g, b = [c[..., i].astype(int) for i in range(3)]
    mx = np.maximum(np.maximum(r, g), b)
    return ((g >= b - 6) & (g >= r - (40 if loose else 22)) & (mx > 22)) | ((r > 120) & (g > 110) & (b < g - 30))

def build(P):
    box = P['box']; c = crop(box); h, w = c.shape[:2]
    lm = leafish(c, P.get('loose', True)).astype(np.uint8)
    keep = poly_mask(c.shape, P['keep'], box)
    lm &= keep
    r, g, b = [c[..., i].astype(int) for i in range(3)]
    dark = np.maximum(np.maximum(r, g), b) < 60
    near = cv2.dilate(lm, np.ones((5, 5), np.uint8)) > 0
    m = ((lm > 0) | (dark & near)) & (keep > 0)
    for p in P.get('pot', []): m |= poly_mask(c.shape, [p], box) > 0
    for p in P.get('drop', []): m &= ~(poly_mask(c.shape, [p], box) > 0)
    m = m.astype(np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8))
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((2, 2), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats(m); k = np.zeros_like(m)
    for i in range(1, n):
        if st[i, cv2.CC_STAT_AREA] >= P.get('min_area', 60): k[lab == i] = 1
    inv = (1 - k).astype(np.uint8); n2, lab2, st2, _ = cv2.connectedComponentsWithStats(inv)
    for i in range(1, n2):
        x, y, ww, hh, a = st2[i]
        if a < 40 and x > 0 and y > 0 and x + ww < w and y + hh < h: k[lab2 == i] = 1
    return c, k

def clean(c, m, k=16):
    px = c[m > 0].reshape(-1, 3).astype(np.float32)
    _, lab, cen = cv2.kmeans(px, k, None, (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 40, .5), 4, cv2.KMEANS_PP_CENTERS)
    idx = np.full(m.shape, -1, np.int32); idx[m > 0] = lab.flatten()
    out = idx.copy(); H, W = m.shape
    for y in range(1, H - 1):                    # поодинокі пікселі -> колір більшості сусідів
        for x in range(1, W - 1):
            if idx[y, x] < 0: continue
            nb = idx[y - 1:y + 2, x - 1:x + 2].flatten(); nb = nb[nb >= 0]
            v, cnt = np.unique(nb, return_counts=True)
            if (nb == idx[y, x]).sum() <= 1 and cnt.max() >= 5: out[y, x] = v[cnt.argmax()]
    rgba = np.zeros((H, W, 4), np.uint8)
    rgba[m > 0, :3] = cen[out[m > 0]].astype(np.uint8); rgba[m > 0, 3] = 255
    edge = (cv2.dilate(m, np.ones((3, 3), np.uint8)) > 0) & (m == 0)
    rgba[edge] = (10, 8, 20, 255)
    return rgba

# ---------- вазони (координати — одиниці кімнати, як у core/config.js) ----------
PLANTS = [
  dict(id='aiVinesTL', box=(0, 0, 56, 132), pot_top=0, floor=0, stage='wall', min_area=25,                    # ліани, що звисають у верхньому лівому куті
       keep=[[(0, 0), (52, 0), (52, 30), (46, 60), (36, 95), (30, 132), (0, 132)]], drop=[[(0, 76), (16, 76), (16, 132), (0, 132)]]),
  dict(id='aiCorner', box=(0, 134, 84, 364), pot_top=320, floor=362, stage='behindDesk',      # високий кущ у кутку AI-центру, темно-синій горщик
       keep=[[(0, 134), (30, 134), (60, 150), (84, 176), (84, 206), (52, 206), (30, 212), (30, 264), (52, 278), (52, 322), (46, 326), (46, 364), (0, 364)]],
       pot=[[(0, 319), (43, 319), (44, 326), (42, 362), (0, 362)]], drop=[[(0, 132), (16, 132), (16, 153), (0, 153)]]),
  dict(id='aiUnderA', box=(196, 304, 252, 364), pot_top=343, floor=362,                        # під столом AI-центру: кущ у темно-синьому горщику
       keep=[[(198, 306), (250, 306), (250, 364), (198, 364)]],
       pot=[[(211, 342), (242, 342), (241, 362), (212, 362)]]),
  dict(id='aiLantern', box=(244, 324, 268, 364), pot_top=364, floor=362, loose=True, lamp=True, # теплий ліхтарик на підлозі
       keep=[[(246, 326), (266, 326), (266, 364), (246, 364)]],
       pot=[[(249, 328), (263, 328), (264, 362), (248, 362)]]),
  dict(id='aiUnderB', box=(284, 302, 350, 364), pot_top=343, floor=362,                        # під поличками: кущ із жовтими кінчиками
       keep=[[(286, 304), (350, 304), (350, 346), (334, 346), (334, 364), (296, 364), (296, 340), (286, 340)]],
       pot=[[(299, 342), (331, 342), (330, 362), (300, 362)], [(304, 330), (326, 330), (330, 343), (300, 343)]]),
  dict(id='anTop', box=(362, 74, 472, 166), pot_top=142, floor=160,                            # велика строката рослина на будці аналітики
       keep=[[(395, 76), (420, 82), (450, 96), (462, 104), (472, 118), (470, 128), (456, 128), (452, 150), (440, 162), (382, 162), (376, 150), (366, 140), (370, 118), (378, 100), (390, 82)]],
       pot=[[(384, 142), (432, 142), (430, 159), (388, 159)]], drop=[[(452, 124), (474, 124), (474, 168), (444, 168)]]),
  dict(id='mkDeskA', box=(460, 234, 512, 290), pot_top=270, floor=286,                         # на столі маркетингу: строката рослина в теракоті
       keep=[[(462, 236), (508, 236), (508, 268), (494, 270), (494, 288), (474, 288), (472, 270), (462, 266)]],
       pot=[[(474, 270), (493, 270), (492, 286), (476, 286)]]),
  dict(id='mkDeskB', box=(500, 228, 552, 290), pot_top=272, floor=286,                         # на столі маркетингу: темно-зелений кущ
       keep=[[(513, 230), (550, 230), (550, 276), (538, 286), (516, 286), (513, 272)]],
       pot=[[(514, 272), (536, 272), (535, 286), (516, 286)]]),
]

def main():
    sprites, meta = [], []
    for P in PLANTS:
        c, m = build(P); rgba = clean(c, m)
        ys, xs = np.nonzero(rgba[..., 3])
        y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        rgba = rgba[y0:y1, x0:x1]
        sprites.append(rgba)
        meta.append(dict(id=P['id'], x=round(P['box'][0] + x0 / RS, 2), y=round(P['box'][1] + y0 / RS, 2), w=int(x1 - x0), h=int(y1 - y0),
                         potTop=P['pot_top'], floor=P['floor'], stage=P.get('stage', 'layer'), lamp=P.get('lamp', False)))
    # атлас: усе в один ряд з проміжком 2 px
    W = sum(s.shape[1] + 2 for s in sprites); H = max(s.shape[0] for s in sprites)
    atlas = np.zeros((H, W, 4), np.uint8); x = 0
    for s, mt in zip(sprites, meta):
        atlas[:s.shape[0], x:x + s.shape[1]] = s; mt['ax'] = x; x += s.shape[1] + 2
    Image.fromarray(atlas).save(ROOT / 'assets/plants_wing.png', optimize=True)
    js = ('/* Згенеровано tools/image/06_trace_plants.py — не редагувати вручну.\n'
          ' * Вазони лівого крила: де кожен спрайт атласу assets/plants_wing.png стоїть у кімнаті\n'
          ' * (x, y — лівий верх в одиницях кімнати; w, h — пікселі атласу, 2 px = 1 од.). */\n'
          'NX.WING_PLANTS = ' + json.dumps(meta, ensure_ascii=False) + ';\n')
    (ROOT / 'js/objects/wing_plants_data.js').write_text(js, encoding='utf-8')
    print('atlas', atlas.shape, [m['id'] for m in meta])

if __name__ == '__main__':
    main()
