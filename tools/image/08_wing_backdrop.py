#!/usr/bin/env python3
"""
tools/image/08_wing_backdrop.py — ЛІВЕ КРИЛО: ПЕРЕМАЛЬОВАНИЙ ФОН + УСІ РОСЛИНИ Й РЕЧІ ОКРЕМО
--------------------------------------------------------------------------------
Власник: "зеленими лініями — місця, які треба промалювати, але зі збереженням усього, що там є:
полички, вазони, лампочки, штучки; щоб було схоже на картинку, бо зараз видно дві різні графіки".

Тому ділянки картинки кімнати (assets/room.webp, 2 px на одиницю) переводимо в ТОЙ САМИЙ
піксель-арт, яким намальовані кодові об'єкти (4 px на одиницю):
  1) збільшення ×2 + згладжування зі збереженням країв (білатеральний фільтр)
  2) спільна палітра (k-means у Lab) — однакова для фону і всіх спрайтів
  3) упорядкований дизеринг Байєра 4×4 (як NX.art.shade у коді)
  4) темний контур по різких краях (з темнішого боку) — як контури кодових об'єктів
Рослини, лампи й речі вирізаються ОКРЕМИМИ спрайтами (щоб гойдались / стояли на столах),
а з фону вони прибираються (інпейнтинг), щоб під ними не було "привидів".

Результат:
  assets/wing_back.png      — перемальований фон (полиці між AI-центром і аналітикою + верх над аналітикою)
  assets/wing_sprites.png   — атлас спрайтів (рослини, лампи, речі на столі AI-центру), 4 px/од.
  js/objects/wing_data.js   — де що стоїть, як гойдається, вогні й живі екрани
Запуск: python3 tools/image/08_wing_backdrop.py
"""
import json, pathlib, numpy as np, cv2
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[2]
ROOM = np.array(Image.open(ROOT / 'assets/room.webp').convert('RGB'))
RS = ROOM.shape[1] / 1536            # пікселів картинки на одиницю кімнати (2)
OUT = 4                               # пікселів на одиницю в результаті (як кодові об'єкти: U = 0.25)
BAY = (np.array([0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]).reshape(4, 4) + .5) / 16 - .5

# ------------------------------------------------------------------ ділянки (одиниці кімнати)
BACK = [(240, 0, 340, 292), (340, 0, 467, 162)]          # перемальований фон: полиці (G1) + верх над аналітикою (G2)
BACK_BOX = (240, 0, 467, 292)

# Спрайти: kind 'leaf' — маска за кольором листя (+ полігон keep, + горщик pot);
#          kind 'poly' — суцільна річ за полігоном (лампи, ліхтарики, речі на столі).
# sway: 'stand' (гойдається верх, низ стоїть), 'hang' (висить: гойдається низ), 'none'.
# stage: 'wall' — одразу за фоном (за кабінками), 'behindDesk' — за столом AI-центру,
#        'layer' — у шарах за глибиною (y = floor), 'desk' — на столі AI-центру (малює ai_center.js).
SPRITES = [
    # --- з перемальованого фону (G1/G2): прибираються з фону
    dict(id='shelfVines', kind='leaf', box=(238, 0, 306, 88), sway='hang', stage='wall', inBack=True,
         keep=[[(238, 0), (306, 0), (306, 30), (290, 40), (282, 62), (276, 88), (250, 88), (238, 70)]]),
    dict(id='shelfOrange', kind='leaf', box=(314, 8, 338, 56), sway='hang', stage='wall', inBack=True, warm=True,
         keep=[[(314, 8), (338, 8), (338, 56), (314, 56)]]),
    dict(id='g2Vines', kind='leaf', box=(434, 0, 470, 90), sway='hang', stage='wall', inBack=True,
         keep=[[(434, 0), (470, 0), (470, 90), (446, 90), (434, 60)]],
         pot=[[(454, 62), (469, 62), (469, 82), (454, 82)]]),
    dict(id='anTop', kind='leaf', box=(362, 74, 472, 166), sway='stand', stage='layer', inBack=True, potTop=142, floor=160, standOn=150,
         keep=[[(395, 76), (420, 82), (450, 96), (462, 104), (472, 118), (470, 128), (456, 128), (452, 150), (440, 162), (382, 162), (376, 150), (366, 140), (370, 118), (378, 100), (390, 82)]],
         pot=[[(384, 142), (432, 142), (430, 160), (388, 160)]], drop=[[(452, 124), (474, 124), (474, 168), (444, 168)]]),
    dict(id='deskProps', kind='poly', box=(240, 248, 324, 298), sway='none', stage='desk', inBack=True, floor=297,
         keep=[[(243, 262), (282, 262), (286, 266), (288, 250), (306, 250), (309, 256), (322, 256), (323, 298), (240, 298), (241, 290)]]),
    # --- між кабінками (G3): фон (місто у вікні) лишається, рослини й лампи — чіткі спрайти
    dict(id='g3Plant', kind='leaf', box=(456, 154, 524, 252), sway='stand', stage='wall', potTop=205, floor=226,
         keep=[[(456, 156), (522, 156), (524, 200), (512, 206), (512, 250), (500, 250), (500, 226), (466, 226), (456, 200)]],
         pot=[[(474, 204), (502, 204), (500, 222), (476, 222)], [(468, 219), (512, 219), (512, 226), (468, 226)]]),
    dict(id='g3Bulb', kind='glow', box=(498, 124, 536, 178), sway='none', stage='wall',
         keep=[[(505, 126), (531, 126), (536, 150), (528, 166), (522, 168), (522, 177), (510, 177), (510, 168), (502, 160), (498, 145)]]),
    dict(id='g3Lantern', kind='poly', box=(486, 224, 508, 254), sway='none', stage='wall',
         keep=[[(489, 227), (506, 227), (507, 252), (488, 252)]]),
    # --- вазони, що вже були окремими (06_trace_plants.py): та сама форма, новий стиль
    dict(id='aiVinesTL', kind='leaf', box=(0, 0, 56, 132), sway='hang', stage='wall',
         keep=[[(0, 0), (52, 0), (52, 30), (46, 60), (36, 95), (30, 132), (0, 132)]], drop=[[(0, 76), (16, 76), (16, 132), (0, 132)]]),
    dict(id='aiCorner', kind='leaf', box=(0, 134, 84, 364), sway='stand', stage='behindDesk', potTop=320, floor=362,
         keep=[[(0, 134), (30, 134), (60, 150), (84, 176), (84, 206), (52, 206), (30, 212), (30, 264), (52, 278), (52, 322), (46, 326), (46, 364), (0, 364)]],
         pot=[[(0, 319), (43, 319), (44, 326), (42, 362), (0, 362)]], drop=[[(0, 132), (16, 132), (16, 153), (0, 153)]]),
    dict(id='aiUnderA', kind='leaf', box=(196, 304, 252, 364), sway='stand', stage='layer', potTop=343, floor=362, standOn=361.5, placeX=80,
         keep=[[(198, 306), (250, 306), (250, 364), (198, 364)]], pot=[[(211, 342), (242, 342), (241, 362), (212, 362)]]),
    dict(id='aiLantern', kind='poly', box=(244, 324, 268, 364), sway='none', stage='layer', floor=362, lamp=True, standOn=361.5, placeX=118,
         keep=[[(249, 328), (263, 328), (264, 362), (248, 362)]]),
    dict(id='aiUnderB', kind='leaf', box=(284, 302, 350, 364), sway='stand', stage='layer', potTop=343, floor=362, standOn=361.5, placeX=196,
         keep=[[(286, 304), (350, 304), (350, 346), (334, 346), (334, 364), (296, 364), (296, 340), (286, 340)]],
         pot=[[(299, 342), (331, 342), (330, 362), (300, 362)], [(304, 330), (326, 330), (330, 343), (300, 343)]]),
    dict(id='mkDeskA', kind='leaf', box=(460, 234, 512, 290), sway='stand', stage='layer', potTop=270, floor=286, standOn=283.6,
         keep=[[(462, 236), (508, 236), (508, 268), (494, 270), (494, 288), (474, 288), (472, 270), (462, 266)]],
         pot=[[(474, 270), (493, 270), (492, 286), (476, 286)]]),
    dict(id='mkDeskB', kind='leaf', box=(500, 228, 552, 290), sway='stand', stage='layer', potTop=272, floor=286, standOn=283.6,
         keep=[[(513, 230), (550, 230), (550, 276), (538, 286), (516, 286), (513, 272)]],
         pot=[[(514, 272), (536, 272), (535, 286), (516, 286)]]),
]

# Вогні (мерехтять у коді) і живі екрани на полицях — координати кімнати
LIGHTS = [
    dict(x=302, y=62, r=11, c='255,90,230'),     # рожевий казанок на полиці
    dict(x=265, y=180, r=8, c='255,170,80'),     # теплі лампочки під полицею
    dict(x=312, y=178, r=8, c='255,170,80'),
    dict(x=286, y=150, r=7, c='255,190,90'),     # золоті дрібнички в шафці
    dict(x=355, y=62, r=20, c='255,150,60'),     # вертикальна тепла лампа на колоні
    dict(x=402, y=52, r=30, c='255,80,230', pulse=1),   # рожева неонова вивіска
    dict(x=462, y=72, r=11, c='255,90,230'),     # рожевий ліхтарик на ліанах
    dict(x=517, y=150, r=24, c='255,200,90'),    # золота лампа-лампочка між кабінками
    dict(x=497, y=240, r=13, c='255,90,230'),    # рожевий ліхтарик між кабінками
]
SCREENS = []                                     # (колишні сині екрани на полицях — тепер акваріуми, TANKS)
TANKS = [dict(q=[[266, 87], [321, 92], [320, 121], [266, 117]], kind='reef'), dict(q=[[266, 189], [321, 196], [320, 224], [266, 219]], kind='deep'), dict(q=[[240, 150], [266, 152], [266, 182], [240, 181]], kind='nano')]

# ------------------------------------------------------------------ піксель-арт фільтр
def up2(img):
    return cv2.resize(img, (img.shape[1] * OUT // 2, img.shape[0] * OUT // 2), interpolation=cv2.INTER_CUBIC)

def smooth(img):
    img = cv2.bilateralFilter(img, 7, 26, 5)
    return cv2.bilateralFilter(img, 5, 20, 3)

def build_palette(imgs, k=56):
    px = np.concatenate([cv2.cvtColor(i, cv2.COLOR_RGB2LAB).reshape(-1, 3) for i in imgs]).astype(np.float32)
    sub = px[np.random.RandomState(7).choice(len(px), min(150000, len(px)), replace=False)]
    _, _, cen = cv2.kmeans(sub, k, None, (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 60, .2), 4, cv2.KMEANS_PP_CENTERS)
    return cen

def quantize(img, pal, ox=0, oy=0, spread=13):
    """Палітра + дизеринг Байєра (фаза сітки — від абсолютних координат кімнати, щоб шви не було видно)."""
    lab = cv2.cvtColor(img, cv2.COLOR_RGB2LAB).astype(np.float32)
    H, W = lab.shape[:2]
    yy, xx = np.mgrid[0:H, 0:W]
    by = BAY[(yy + oy) & 3, (xx + ox) & 3]
    lab[..., 0] += by * spread
    lab[..., 1] += by * spread * .35
    lab[..., 2] += by * spread * .35
    flat = lab.reshape(-1, 3); idx = np.empty(len(flat), np.int32)
    for a in range(0, len(flat), 65536):                                   # частинами — щоб не з'їсти пам'ять
        d = ((flat[a:a + 65536, None, :] - pal[None, :, :]) ** 2).sum(-1); idx[a:a + 65536] = d.argmin(1)
    idx = idx.reshape(H, W)
    return cv2.cvtColor(pal[idx].reshape(H, W, 3).astype(np.uint8), cv2.COLOR_LAB2RGB)

def ink(q, src, strength=.5):
    """Темний контур по різких краях — з темнішого боку (як 1-піксельні контури в коді)."""
    L = cv2.cvtColor(src, cv2.COLOR_RGB2LAB)[..., 0]
    e = cv2.Canny(cv2.GaussianBlur(L, (3, 3), 0), 42, 96) > 0
    dil = cv2.dilate(L, np.ones((3, 3), np.uint8)).astype(int); ero = cv2.erode(L, np.ones((3, 3), np.uint8)).astype(int)
    dark = e & (L.astype(int) - ero < dil - L.astype(int))
    out = q.copy(); out[dark] = (out[dark] * strength).astype(np.uint8)
    return out

def repixel(crop2x, pal, box):
    big = smooth(up2(crop2x))
    q = quantize(big, pal, int(round(box[0] * OUT)), int(round(box[1] * OUT)))
    return ink(q, big)

# ------------------------------------------------------------------ маски
def crop(box):
    x0, y0, x1, y1 = box
    return ROOM[int(round(y0 * RS)):int(round(y1 * RS)), int(round(x0 * RS)):int(round(x1 * RS))].copy()

def poly_mask(shape, polys, box, scale):
    m = np.zeros(shape[:2], np.uint8)
    for p in polys:
        cv2.fillPoly(m, [np.array([[(x - box[0]) * scale, (y - box[1]) * scale] for x, y in p], np.int32)], 1)
    return m

def leafish(c):
    r, g, b = [c[..., i].astype(int) for i in range(3)]
    mx = np.maximum(np.maximum(r, g), b)
    return ((g >= b - 6) & (g >= r - 40) & (mx > 22)) | ((r > 120) & (g > 110) & (b < g - 30))

def sprite_mask(S, c):
    """Маска спрайта в пікселях картинки (2 px/од.)."""
    box = S['box']; keep = poly_mask(c.shape, S['keep'], box, RS)
    if S['kind'] == 'poly':
        m = keep.astype(bool)
    elif S['kind'] == 'glow':                                     # світна річ: лише яскраві/теплі пікселі всередині полігона
        r, g, b = [c[..., i].astype(int) for i in range(3)]
        m = ((np.maximum(np.maximum(r, g), b) > 120) & (r > b - 20)) & (keep > 0)
    else:
        lm = leafish(c).astype(np.uint8) & keep
        r, g, b = [c[..., i].astype(int) for i in range(3)]
        dark = np.maximum(np.maximum(r, g), b) < 60
        near = cv2.dilate(lm, np.ones((5, 5), np.uint8)) > 0
        m = ((lm > 0) | (dark & near)) & (keep > 0)
        if S.get('warm'):                                    # помаранчеві/жовті квіти теж частина рослини
            m |= ((r > 150) & (g > 80) & (b < 120)) & (keep > 0)
    for p in S.get('pot', []): m |= poly_mask(c.shape, [p], box, RS) > 0
    for p in S.get('drop', []): m &= ~(poly_mask(c.shape, [p], box, RS) > 0)
    m = m.astype(np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8))
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((2, 2), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats(m); k = np.zeros_like(m)
    for i in range(1, n):
        if st[i, cv2.CC_STAT_AREA] >= 25: k[lab == i] = 1
    inv = (1 - k).astype(np.uint8); n2, lab2, st2, _ = cv2.connectedComponentsWithStats(inv)
    h, w = k.shape
    for i in range(1, n2):
        x, y, ww, hh, a = st2[i]
        if a < 40 and x > 0 and y > 0 and x + ww < w and y + hh < h: k[lab2 == i] = 1
    return k

def mask_up(m):
    """Маска 2 px/од. -> 4 px/од. з гладкими діагоналями."""
    big = cv2.resize(m.astype(np.float32), (m.shape[1] * OUT // 2, m.shape[0] * OUT // 2), interpolation=cv2.INTER_LINEAR)
    return (big > .5).astype(np.uint8)

# ------------------------------------------------------------------ головне
def main():
    bx0, by0, bx1, by1 = BACK_BOX
    back2 = crop(BACK_BOX)
    # 1) маски спрайтів (у координатах картинки) і що прибрати з фону
    sp_masks, remove = {}, np.zeros(back2.shape[:2], np.uint8)
    for S in SPRITES:
        c = crop(S['box']); m = sprite_mask(S, c); sp_masks[S['id']] = (c, m)
        if S.get('inBack'):
            x0 = int(round((S['box'][0] - bx0) * RS)); y0 = int(round((S['box'][1] - by0) * RS))
            sub = remove[y0:y0 + m.shape[0], x0:x0 + m.shape[1]]
            sub |= cv2.dilate(m, np.ones((5, 5), np.uint8))[:sub.shape[0], :sub.shape[1]]
    # 2) прибрати рослини й речі з фону (інпейнтинг), потім — спільна палітра
    clean = cv2.inpaint(cv2.cvtColor(back2, cv2.COLOR_RGB2BGR), remove * 255, 7, cv2.INPAINT_TELEA)
    clean = cv2.cvtColor(clean, cv2.COLOR_BGR2RGB)
    pal = build_palette([smooth(up2(clean))] + [smooth(up2(c)) for c, _ in sp_masks.values()])
    # 3) фон
    bq = repixel(clean, pal, BACK_BOX)
    region = np.zeros(bq.shape[:2], np.uint8)
    for (x0, y0, x1, y1) in BACK:
        region[int((y0 - by0) * OUT):int((y1 - by0) * OUT), int((x0 - bx0) * OUT):int((x1 - bx0) * OUT)] = 1
    Image.fromarray(np.dstack([bq, region * 255]).astype(np.uint8)).save(ROOT / 'assets/wing_back.png', optimize=True)
    # 4) спрайти
    sprites, meta = [], []
    for S in SPRITES:
        c, m = sp_masks[S['id']]
        q = repixel(c, pal, S['box']); mm = mask_up(m)
        h = min(q.shape[0], mm.shape[0]); w = min(q.shape[1], mm.shape[1]); q, mm = q[:h, :w], mm[:h, :w]
        rgba = np.zeros((h, w, 4), np.uint8); rgba[mm > 0, :3] = q[mm > 0]; rgba[mm > 0, 3] = 255
        edge = (cv2.dilate(mm, np.ones((3, 3), np.uint8)) > 0) & (mm == 0)        # контур навколо силуету
        rgba[edge] = (10, 6, 22, 255)
        ys, xs = np.nonzero(rgba[..., 3]); y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        rgba = rgba[y0:y1, x0:x1]; sprites.append(rgba)
        yy = S['box'][1] + y0 / OUT; pt = S.get('potTop', 0); fl = S.get('floor', 0)
        if S.get('standOn'):                                                   # поставити низ спрайта на стільницю / підлогу під столом
            so = S['standOn']
            if so == 'deskBot': so = 375 - (S['box'][0] + (x0 + x1) / 2 / OUT - 34) * 23 / (315 - 34) - 1.5   # клин підлоги під столом AI (ai_desk.js: bot)
            sh = so - (yy + (y1 - y0) / OUT); yy += sh; pt += sh; fl = round(so, 1)
        meta.append(dict(id=S['id'], x=S.get('placeX', round(S['box'][0] + x0 / OUT, 2)), y=round(yy, 2), w=int(x1 - x0), h=int(y1 - y0),
                         sway=S['sway'], stage=S['stage'], potTop=round(pt, 2), floor=fl, lamp=S.get('lamp', False)))
    # 5) атлас: ряди шириною до 2048
    rows, cur, cw = [], [], 0
    for i, s in enumerate(sprites):
        if cw + s.shape[1] + 2 > 2048 and cur: rows.append(cur); cur, cw = [], 0
        cur.append(i); cw += s.shape[1] + 2
    rows.append(cur)
    W = max(sum(sprites[i].shape[1] + 2 for i in r) for r in rows); H = sum(max(sprites[i].shape[0] for i in r) + 2 for r in rows)
    atlas = np.zeros((H, W, 4), np.uint8); y = 0
    for r in rows:
        x = 0; rh = max(sprites[i].shape[0] for i in r)
        for i in r:
            s = sprites[i]; atlas[y:y + s.shape[0], x:x + s.shape[1]] = s; meta[i]['ax'] = x; meta[i]['ay'] = y; x += s.shape[1] + 2
        y += rh + 2
    Image.fromarray(atlas).save(ROOT / 'assets/wing_sprites.png', optimize=True)
    js = ('/* Згенеровано tools/image/08_wing_backdrop.py — не редагувати вручну.\n'
          ' * Ліве крило: перемальований фон (assets/wing_back.png, 4 px/од., ділянка BACK_BOX),\n'
          ' * спрайти (assets/wing_sprites.png): x, y — лівий верх у кімнаті, w, h — пікселі атласу (4 px = 1 од.),\n'
          ' * вогні (мерехтять) і живі екрани на полицях. */\n'
          'NX.WING = ' + json.dumps(dict(back=dict(box=BACK_BOX, parts=BACK), sprites=meta, lights=LIGHTS, screens=SCREENS, tanks=TANKS), ensure_ascii=False) + ';\n')
    (ROOT / 'js/objects/wing_data.js').write_text(js, encoding='utf-8')
    print('back', bq.shape, 'atlas', atlas.shape, [m['id'] for m in meta])

if __name__ == '__main__':
    main()
