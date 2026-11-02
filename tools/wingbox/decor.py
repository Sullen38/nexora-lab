# tools/wingbox/decor.py — ДЕКОР СТІН ПОЗА ЗОНАМИ: антресоль («другий поверх») праворуч, полички з рослинами й артефактами,
# гідропоніка під фітолампою, підвісні рослини, плакати й неонова вивіска (власник 02.11: «Nexi в нас ботанік — рослини цікаві
# й різні»; зони не чіпаємо, декор не заходить на них ні на комп'ютері, ні на телефоні; перспектива — та сама, що в зон).
# -------------------------------------------------------------------------------------------------------------------------
# ОКРЕМИЙ БУДІВНИК: gen_room.py (build_side) кличе decor_side(L, sgn, C, R) після зон — повертає предмети шару 'up' (рушій
# малює їх у шарі «біля стіни»: js/objects/arc_scene.js backLayerG -> форми й малюнки граней js/objects/dc_paint.js, рослини —
# js/objects/dc_plants.js). Нерухоме — у растрі крила (fps не страждає).
# ДЕ ЩО СТОЇТЬ — у координатах ЕКРАНА (одиниці кімнати, як на знімках): вільні ділянки стін — смуги між стелею (y 0) і
# верхом зон, тож місце задаємо так (X — по горизонталі, y — висота на екрані), а генератор сам знаходить точку стіни (дуга
# або пряма біля вікна) і переводить у світ (перспектива кімнати: VP (774, 220), D 520; s(z) = D / (D + z)).
# АНТРЕСОЛЬ рівна в світі (як підлога), тож на екрані вздовж дуги вона «підіймається» до глядача — так само, як поручень на
# стіні й плінтус (одна перспектива). Через це вона стоїть лише над порталом: там між верхом брами й стелею вистачає місця.
# Перевірка: DECOR OVER ZONES — межі кожної речі на екрані проти силуетів зон (грані розкладки, привиди живих екранів) і живих
# частин (маніпулятор майстерні, маячок інструментів, голо-монітори маркетингу) з полем MARGIN; має бути none.
#   python3 tools/wingbox/decor.py [--write] [--plan план.png]   — швидко: зони беруться з js/objects/arc_layout.js (повний прогін —
#   gen_room.py, він кличе decor_side сам); піксель у піксель на зібраній сцені — node tools/wingbox/decor_check.js
import json, math, os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__)); REPO = os.path.normpath(os.path.join(HERE, '..', '..'))
sys.path.insert(0, HERE)
from plan import P3, faces, frame
D, FL, JZ, VX, VY = 520, 372, 185, 774, 220
MARGIN = 5                                                                          # мінімальний проміжок до зони на екрані (од. кімнати)
def s(z): return D / (D + z)
def Yw(y, z): return VY + (y - VY) / s(z)                                            # висота світу, що на екрані в рядку y (на глибині z)
def ys(Y, z): return VY + (Y - VY) * s(z)                                            # і навпаки


# ===================================== СТІНА =====================================
class Wall:
    """стіна крила: пряма біля вікна (від відкосу до xf, глибина JZ) і дуга (центр C, радіус R). Параметр a — градуси дуги
    (< 0 — пряма ділянка: та сама довжина, що й дуга з таким кутом). X(a) — де ця точка стіни на екрані (росте праворуч /
    ліворуч монотонно), a_of(X) — навпаки."""
    def __init__(self, sgn, C, R, jamb):
        self.sgn, self.C, self.R = sgn, C, R
        self.a_min = -math.degrees(abs(C[0] - jamb) / R)                             # від відкосу (пряма) — у «градусах дуги»
    def at(self, a, inset=0.):
        """точка стіни (x, z) (inset — на стільки од. у кімнату), внутрішня нормаль n і дотична t (у бік росту a)"""
        sg, C, R = self.sgn, self.C, self.R
        if a < 0: x, z, n, t = C[0] + sg * R * math.radians(a), JZ, (0., -1.), (float(sg), 0.)
        else:
            r = math.radians(a); x, z = C[0] + sg * R * math.sin(r), C[1] + R * math.cos(r)
            n, t = (-sg * math.sin(r), -math.cos(r)), (sg * math.cos(r), -math.sin(r))
        return (x + n[0] * inset, z + n[1] * inset), n, t
    def X(self, a, inset=0.):
        (x, z), _, _ = self.at(a, inset); return VX + (x - VX) * s(z)
    def a_of(self, X, inset=0.):
        lo, hi = self.a_min, 135.
        for _ in range(60):
            m = (lo + hi) / 2
            if (self.X(m, inset) < X) == (self.sgn > 0): lo = m
            else: hi = m
        return (lo + hi) / 2
    def turn(self, a):
        _, n, _ = self.at(a); return math.degrees(math.atan2(-n[0], -n[1]))         # поворот предмета (лицем у кімнату), як у place()


def item(W, id, a, d, w, yb, yt, st, inset=.4, **kw):
    """ПРЕДМЕТ НА СТІНІ: кут a, виступ d (глибина), ширина w уздовж стіни, низ / верх (світ). (x, z) — середина передньої
    грані (як у place()), спина — за inset од. від стіни; на дузі широка коробка відступає ще на стрілку хорди (кінці не за стіною)."""
    sag = 0. if a < 0 else W.R - math.sqrt(max(0., W.R ** 2 - (w / 2) ** 2))
    (x, z), n, _ = W.at(a, inset + sag + d)
    it = dict(id=id, layer='up', x=round(x, 2), z=round(z, 2), turn=round(W.turn(a), 3), w=round(w, 2), dep=round(d, 2), yb=round(yb, 2), yt=round(yt, 2), st=st, grp='dc')
    it.update(kw); return it                                                     # grp dc — речі декору одна з одною не перевіряються на перетин (gen_room.py check: листя — не коробки)
def chord(W, a0, a1, inset=0.):
    (p, _, _), (q, _, _) = W.at(a0, inset), W.at(a1, inset); return math.hypot(q[0] - p[0], q[1] - p[1])


# ===================================== ДЕКОР КРИЛА =====================================
def decor_side(L, sgn, C, R, verbose=True):
    """sgn +1 — праве крило (панелі: технологічна оранжерея), -1 — ліве (цегла: затишний куточок ботаніка).
    -> список предметів шару 'up'. Порядок усередині: опори (антресоль, полиці) раніше за те, що на них стоїть."""
    W = Wall(sgn, C, R, L['wall'][0][0]); out = []
    add = out.append
    def shelf(id, X0, X1, y, d=10, style='wood', **kw):
        """полиця: дошка від X0 до X1 (екран), верх дошки — на рядку y екрана біля її переднього краю; кронштейни під нею"""
        a0, a1 = W.a_of(X0), W.a_of(X1); am = (a0 + a1) / 2; w = chord(W, a0, a1) + .6
        (x, z), _, _ = W.at(am, d); Y = Yw(y, z)
        add(item(W, id, am, d, w, Y + 7, Y - .2, 'dc_shelf', dc=dict(style=style, th=2.2, brk=7, **kw))); return dict(a0=a0, a1=a1, d=d, Y=Y, id=id)
    def on_shelf(sh, id, X, st, w, h, d=None, **kw):
        """річ на полиці: X — середина на екрані (точка стіни на цьому X), стоїть на верху дошки"""
        a = W.a_of(X, sh['d'] * .5); d = d or min(w, sh['d'] - 2.)
        add(item(W, id, a, d, w, sh['Y'], sh['Y'] - h, st, inset=.4 + (sh['d'] - d) * .5, on=sh['id'], **kw))
    def plant(sh, id, X, kind, w, h, pot='terra', pw=None, ph=None, seed=1, hl=0, **kw):
        """вазон з рослиною на полиці / антресолі: w × h — уся рослина з вазоном (листя — спрайт над вазоном, dc_plants.js);
        hl > 0 — рослина звисає з краю на hl од. світу нижче верху полиці (ліана, непентес): коробка — і вниз, до краю дошки"""
        pw = pw or round(w * .5, 1); ph = ph or round(min(h * .34, 8.), 1); d = min(sh['d'] - 2., pw + 1.)
        a = W.a_of(X, sh['d'] * .5); dc = dict(kind=kind, pot=pot, pw=pw, ph=ph, seed=seed, **kw)
        if hl: dc['hl'] = hl; d = sh['d'] - .6                                     # звисає перед дошкою: коробка до її переднього краю
        add(item(W, id, a, d, w, sh['Y'] + hl, sh['Y'] - h, 'dc_pot', inset=.4 + (sh['d'] - d) * .5, on=sh['id'], dc=dc))
    def hang(id, X, y0, y1, kind='vine', w=12, inset=6, seed=1, frm='wall', **kw):
        """підвісна рослина: від рядка y0 до y1 на екрані (кріплення вгорі: wall — кронштейн у стіні, edge — край антресолі)"""
        a = W.a_of(X, inset); (x, z), _, _ = W.at(a, inset); Y0, Y1 = Yw(y0, z), Yw(y1, z)
        add(item(W, id, a, 3, w, Y1, Y0, 'dc_hang', inset=inset - 1.5, dc=dict(kind=kind, seed=seed, frm=frm, wb=round(inset - 1.5, 2), **kw)))
    def flat(id, X0, X1, y0, y1, st, d=1.4, **kw):
        """пласке на стіні (плакат, вивіска): прямокутник екрана X0..X1 × y0..y1 (за серединою)"""
        a0, a1 = W.a_of(X0), W.a_of(X1); am = (a0 + a1) / 2; w = chord(W, a0, a1)
        (x, z), _, _ = W.at(am, d); add(item(W, id, am, d, w, Yw(y1, z), Yw(y0, z), st, inset=1.6, **kw))   # 1.6 — запас: стіну рушій малює сплайном через вузли дуги

    if sgn > 0:
        # ---------- П1. АНТРЕСОЛЬ над порталом (як на концепті праворуч угорі): плита з неоновим фасадом, поруччя, вазони,
        # золотий ліхтар, ліани з краю. Рівна в світі: верх плити Y 64, фасад 7, виступ 28; дуга 76..104° (екран ~1382..1561).
        MZ = dict(a0=76., a1=104., P=28., top=62., bot=71., rail=14., brk=8., step=2.)
        n = int(round((MZ['a1'] - MZ['a0']) / MZ['step'])); acc = 0.
        for i in range(n):
            a0 = MZ['a0'] + i * MZ['step']; a1 = a0 + MZ['step']; am = (a0 + a1) / 2; w = chord(W, a0, a1) + .2
            seg = dict(MZ, i=i, n=n, sa=a0, sb=a1, s0=round(acc, 2), C=[round(C[0], 2), round(C[1], 2)], R=R, sgn=sgn)
            add(item(W, f'dc_mz{i}', am, MZ['P'], w, MZ['bot'] + MZ['brk'], MZ['top'] - MZ['rail'] - 1.5, 'dc_mz', inset=.3, dc=seg))
            acc += chord(W, a0, a1, MZ['P'])
        mzs = lambda a: dict(a0=a - .5, a1=a + .5, d=MZ['P'] - 3, Y=MZ['top'], id=f"dc_mz{min(n - 1, max(0, int((a - MZ['a0']) / MZ['step'])))}")
        def on_mz(id, a, kind, w, h, **kw):
            sh = mzs(a); X = W.X(a, sh['d'] * .5); plant(sh, id, X, kind, w, h, **kw)
        on_mz('dc_mzp0', 78.5, 'palm', 28, 44, pot='navy', pw=10, ph=7, seed=33)                    # висока пальма біля лівого краю (тут найбільше місця вгорі)
        on_mz('dc_mzp1', 83.5, 'monstera', 24, 32, pot='ceram', pw=9, ph=6, seed=32)
        sh = mzs(88.); add(item(W, 'dc_lantern', 88., 10., 10., MZ['top'], MZ['top'] - 22, 'dc_lantern', inset=MZ['P'] - 14, on=sh['id'], glow=1, gr=34))   # золотий ліхтар (світить на стіну)
        on_mz('dc_mzp2', 92., 'flytrap', 16, 18, pot='terra', pw=8, ph=5.5, seed=5)                 # хижа: венерина мухоловка
        on_mz('dc_mzp3', 95.5, 'shroom', 15, 15, pot='dark', pw=9, ph=5, seed=8, glow=1)          # світні гриби
        on_mz('dc_mzp4', 99., 'cactus', 14, 22, pot='terra', pw=7, ph=5, seed=3)
        on_mz('dc_mzp5', 102.3, 'fern', 18, 17, pot='navy', pw=8, ph=5, seed=34)
        # ліани з краю антресолі — лише там, де під нею вільно (над лівою колоною брами й праворуч від замкового каменя)
        for k, (a, ln) in enumerate(((77.5, 14), (81., 18), (100.5, 16), (103., 22))):
            (x, z), _, _ = W.at(a, MZ['P'] - 1.); y0 = ys(MZ['bot'], z) - 1.5
            hang(f'dc_mzv{k}', W.X(a, MZ['P'] - 1.), y0, y0 + ln, 'vine', w=10, inset=MZ['P'] - 1.5, seed=41 + k, frm='edge')
        # ---------- П2. ГІДРОПОНІКА над інструментами: дві труби з рослинами в отворах, над кожною — фітолампа (фіолетова)
        for k, (X0, X1, y) in enumerate(((1236., 1292., 33.), (1304., 1364., 34.))):
            a0, a1 = W.a_of(X0), W.a_of(X1); am = (a0 + a1) / 2; w = chord(W, a0, a1); (x, z), _, _ = W.at(am, 5.); Y = Yw(y, z)
            add(item(W, f'dc_hydro{k}', am, 6., w, Y + 4, Y - 17, 'dc_hydro', dc=dict(tube=[round(Y - 4, 2), round(Y + 4, 2)], n=4 + k, seed=11 + k, kinds=['basil', 'lettuce', 'straw', 'basil', 'lettuce'][k:])))   # коробка — разом з рослинами над трубою
            add(item(W, f'dc_grow{k}', am, 7., w + 4, Y - 22, Y - 25, 'neon', glow=1, gr=26, dc=dict(seed=k)))   # стиль neon — рожево-фіолетове світло на стіну; форма — за id (dc_paint.js)
        # ---------- П3. ПІДВІСНИЙ ВАЗОН між маніпулятором і інструментами (тут вільно нижче — до ~y 70)
        hang('dc_hangR', 1207., 4., 66., 'pothos', w=20, inset=10, seed=7, frm='hook', pot='macrame')
    else:
        # ---------- Л1. Над AI-центром: полиця (книжки, кришталева куля, бонсай; ліана звисає з краю) і неонова вивіска
        sh = shelf('dc_shL1', -54., 58., 50., d=13)
        plant(sh, 'dc_l1p0', -42., 'vine', 16, 9, pot='terra', pw=8, ph=5, seed=2, hl=24)   # потос звисає з краю
        on_shelf(sh, 'dc_l1b', -20., 'dc_art', 15, 12, dc=dict(kind='books', seed=1))
        on_shelf(sh, 'dc_l1o', 2., 'dc_art', 9, 11, dc=dict(kind='orb'))
        plant(sh, 'dc_l1p1', 24., 'bonsai', 20, 20, pot='ceram', pw=9, ph=4.5, seed=4)
        plant(sh, 'dc_l1p2', 47., 'succ', 11, 10, pot='terra', pw=7, ph=4, seed=9)
        flat('dc_neon', 94., 180., 14., 66., 'neon', d=1.6, glow=1, gr=40)          # неон: Nexi з паростком (без слів; стиль neon — рожевий кант і рожеве світло на стіну)
        # ---------- Л2. Над аналітикою: довга полиця з рослинами й артефактами
        sh = shelf('dc_shL2', 226., 366., 56., d=13)
        plant(sh, 'dc_l2p0', 240., 'pitcher', 18, 10, pot='terra', pw=8, ph=5, seed=6, hl=22)    # хижа: непентес — глечики звисають з краю
        on_shelf(sh, 'dc_l2g', 264., 'dc_art', 15, 15, dc=dict(kind='terrarium', seed=2))   # куля-тераріум зі світним мохом
        plant(sh, 'dc_l2p1', 289., 'sansevieria', 13, 24, pot='navy', pw=8, ph=6, seed=12)
        on_shelf(sh, 'dc_l2b', 312., 'dc_art', 16, 12, dc=dict(kind='books', seed=4))
        on_shelf(sh, 'dc_l2m', 333., 'dc_art', 11, 15, dc=dict(kind='scope'))          # мікроскоп ботаніка
        plant(sh, 'dc_l2p2', 353., 'cactus2', 13, 13, pot='terra', pw=9, ph=4.5, seed=13)
        # ---------- Л3. Цегляна смуга між аналітикою й маркетингом: підвісний вазон угорі й три полички одна над одною
        hang('dc_hangL', 405., 4., 62., 'vine', w=20, inset=10, seed=21, frm='hook', pot='macrame')
        sh = shelf('dc_shL3a', 388., 424., 86., d=10)
        plant(sh, 'dc_l3p0', 397., 'cactus', 11, 20, pot='terra', pw=6, ph=4.5, seed=31)
        plant(sh, 'dc_l3p1', 414., 'succ', 12, 10, pot='ceram', pw=7, ph=4, seed=32)
        sh = shelf('dc_shL3b', 388., 423., 144., d=9)
        on_shelf(sh, 'dc_l3f', 398., 'dc_art', 11, 18, dc=dict(kind='flask', seed=3))   # колба з паростком у світній рідині
        on_shelf(sh, 'dc_l3b', 415., 'dc_art', 11, 11, dc=dict(kind='books', seed=7))
        sh = shelf('dc_shL3c', 388., 423., 204., d=9)
        plant(sh, 'dc_l3p2', 398., 'flytrap', 14, 15, pot='terra', pw=7, ph=4.5, seed=33)
        on_shelf(sh, 'dc_l3w', 415., 'dc_art', 12, 11, dc=dict(kind='can'))            # лійка
        # ---------- Л4. Біля вікна над маркетингом: ботанічний плакат (напис — зі словників)
        flat('dc_poster0', 447., 501., 10., 88., 'dc_poster', d=1.2)
    if verbose: report(L, out, 'right' if sgn > 0 else 'left')
    return out


# ===================================== ПЕРЕВІРКА: НЕ ЗАХОДИТЬ НА ЗОНИ (екран) =====================================
def screen_poly(it):
    """межі предмета на екрані: усі 8 кутів коробки (для рослин коробка = уся рослина з вазоном)"""
    f, r, P = frame(it); w = it['w'] / 2
    return [P3(*P(u, v, y)) for u in (-w, w) for v in (0, it['dep']) for y in (it['yb'], it['yt'])]
def zone_mask(L, S=2, X0=-90, Y0=-20, X1=1630, Y1=500):
    """силуети зон на екрані (растр S px/од.): видимі грані предметів (і привидів — там живі екрани), живі частини"""
    from PIL import Image, ImageDraw
    im = Image.new('L', (int((X1 - X0) * S), int((Y1 - Y0) * S)), 0); d = ImageDraw.Draw(im)
    T = lambda p: ((p[0] - X0) * S, (p[1] - Y0) * S)
    for it in L['items']:
        if it.get('layer') == 'up': continue
        jt = dict(it); jt.pop('cyl', None); F, V = faces(jt)
        for nm in ('front', 'left', 'right', 'top'):
            if V.get(nm) or it.get('ghost'): d.polygon([T(P3(*q)) for q in F[nm]], fill=255)
    A = L.get('anchors', {})
    if L.get('armRig'):                                                             # маніпулятор майстерні: рухається (скан / встановлення) — з запасом
        P = [P3(*p) for p in L['armRig']['pts']]; xs = [p[0] for p in P]; yy = [p[1] for p in P]
        d.rectangle([T((min(xs) - 14, min(yy) - 22)), T((max(xs) + 16, max(yy) + 14))], fill=255)
    if 'tlBeacon' in A:                                                             # маячок інструментів і його сяйво
        x, y = P3(*A['tlBeacon']); d.ellipse([T((x - 16, y - 16)), T((x + 16, y + 16))], fill=255)
    for k in ('mkProjL', 'mkProjR'):                                                # голо-монітори маркетингу над проєкторами
        if k in A: x, y = P3(*A[k]); d.rectangle([T((x - 34, y - 64)), T((x + 34, y))], fill=255)
    return im, (X0, Y0, S)
def hull(pts):
    P = sorted(set((round(x, 3), round(y, 3)) for x, y in pts))
    if len(P) < 3: return P
    cr = lambda o, a, b: (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]); lo, up = [], []
    for q in P:
        while len(lo) >= 2 and cr(lo[-2], lo[-1], q) <= 0: lo.pop()
        lo.append(q)
    for q in reversed(P):
        while len(up) >= 2 and cr(up[-2], up[-1], q) <= 0: up.pop()
        up.append(q)
    return lo[:-1] + up[:-1]
def check_screen(L, items, margin=MARGIN):
    from PIL import Image, ImageDraw, ImageFilter
    im, (X0, Y0, S) = zone_mask(L); grow = im.filter(ImageFilter.MaxFilter(2 * int(margin * S) + 1)); px = grow.load(); W, H = grow.size
    bad = []
    for it in items:
        P = hull(screen_poly(it)); xs = [p[0] for p in P]; yy = [p[1] for p in P]
        x0, x1, y0, y1 = min(xs), max(xs), min(yy), max(yy); hit = 0
        pm = Image.new('L', (W, H), 0); ImageDraw.Draw(pm).polygon([((p[0] - X0) * S, (p[1] - Y0) * S) for p in P], fill=255); pq = pm.load()
        for j in range(max(0, int((y0 - Y0) * S)), min(H, int((y1 - Y0) * S) + 1)):
            for i in range(max(0, int((x0 - X0) * S)), min(W, int((x1 - X0) * S) + 1)):
                if px[i, j] and pq[i, j]: hit += 1
        if hit: bad.append((it['id'], hit, [round(x0), round(x1), round(y0), round(y1)]))
        if y0 < 1: bad.append((it['id'], 'CEIL', round(y0, 1)))
    return bad
def report(L, items, name):
    bad = check_screen(L, items)
    print(f'  decor {name}: {len(items)} речей;', 'DECOR OVER ZONES:', bad if bad else 'none')
    return bad


# ===================================== ПЛАН ЗВЕРХУ (картинка для власника) =====================================
GROUPS = [('dc_mz', 'П1 АНТРЕСОЛЬ (2-й поверх)'), ('dc_lantern', 'П1'), ('dc_hydro', 'П2 ГІДРОПОНІКА + ФІТОЛАМПИ'), ('dc_grow', 'П2'), ('dc_hangR', 'П3 ПІДВІСНИЙ ВАЗОН'),
          ('dc_shL1', 'Л1 ПОЛИЦЯ'), ('dc_l1', 'Л1'), ('dc_neon', 'Л1 НЕОН'), ('dc_shL2', 'Л2 ПОЛИЦЯ'), ('dc_l2', 'Л2'), ('dc_hangL', 'Л3 ПІДВІСНИЙ ВАЗОН'),
          ('dc_shL3', 'Л3 ТРИ ПОЛИЧКИ'), ('dc_l3', 'Л3'), ('dc_poster', 'Л4 ПЛАКАТ')]
def group_of(id):
    for k, v in GROUPS:
        if id.startswith(k): return v
    return '?'
ZNAME = {'workshop': 'МАЙСТЕРНЯ', 'tools': 'ІНСТРУМЕНТИ', 'portal': 'ПОРТАЛ', 'marketing': 'МАРКЕТИНГ', 'analytics': 'АНАЛІТИКА', 'ai': 'AI-ЦЕНТР'}
ZCOL = {'workshop': (255, 79, 216), 'tools': (59, 232, 255), 'portal': (217, 138, 255), 'marketing': (255, 122, 208), 'analytics': (122, 244, 255), 'ai': (138, 200, 255)}
def plan_png(LAY, path, sofa=None):
    """план зверху: стіни (пряма біля вікна + дуга), вікно, диван, сліди зон і ДЕКОР (антресоль — смуга, решта — уздовж стін) з підписами"""
    from PIL import Image, ImageDraw, ImageFont
    from plan import footprint, catmull
    S, X0, Z1, Z0 = 1.1, -330, 235, -300; W, H = int((1900 - X0) * S), int((Z1 - Z0) * S) + 70
    T = lambda x, z: ((x - X0) * S, (Z1 - z) * S)
    try: F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 15); FB = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 17)
    except Exception: F = FB = ImageFont.load_default()
    im = Image.new('RGB', (W, H), (10, 8, 26)); d = ImageDraw.Draw(im, 'RGBA')
    for X in (-64, 1600):                                                            # краї кадру (промені від ока)
        d.line([T(VX + (X - VX) / s(-280), -280), T(VX + (X - VX) / s(230), 230)], fill=(60, 60, 96), width=1)
    jl, jr = LAY['left']['wall'][0][0], LAY['right']['wall'][0][0]
    d.line([T(jl, JZ), T(jr, JZ)], fill=(80, 170, 255), width=5); d.text(T(740, JZ + 26), 'ВІКНО', fill=(80, 170, 255), font=FB)
    if sofa: d.rectangle([T(sofa[0], sofa[3]), T(sofa[1], sofa[2])], outline=(160, 120, 220), width=2); d.text(T((sofa[0] + sofa[1]) / 2 - 28, (sofa[2] + sofa[3]) / 2 + 8), 'ДИВАН', fill=(200, 160, 255), font=F)
    labels = {}
    for name in ('right', 'left'):
        L = LAY[name]; d.line([T(*p) for p in catmull([tuple(p) for p in L['wall']], 6)], fill=(170, 130, 255), width=4)
        zs = {}
        for it in L['items']:
            fp = [T(*q) for q in footprint(dict(it, cyl=0) if it.get('cyl') else it)]
            if it.get('layer') == 'up':
                g = group_of(it['id']); col = (255, 79, 216) if g.startswith('П1') else (255, 210, 122)
                d.polygon(fp, fill=col + (150,), outline=col); labels.setdefault(g, []).append(it)
            elif not it.get('ghost'):
                zc = ZCOL.get(it['zone'], (120, 110, 200)); d.polygon(fp, fill=zc + (40,), outline=zc + (170,)); zs.setdefault(it['zone'], []).extend(footprint(dict(it, cyl=0) if it.get('cyl') else it))
        for zn, pts in zs.items():
            cx = sum(q[0] for q in pts) / len(pts); cz = sum(q[1] for q in pts) / len(pts); tx, ty = T(cx, cz)
            d.text((tx - 45, ty - 8), ZNAME.get(zn, zn), fill=(255, 255, 255), font=FB)
    # підписи декору — стовпчиками ЗА стінами (ліворуч / праворуч), від середини групи — тонка лінія до підпису
    side_lab = {'left': [], 'right': []}
    for g, its in labels.items():
        if len(g) <= 2: continue
        cx, cz = sum(it['x'] for it in its) / len(its), sum(it['z'] for it in its) / len(its)
        side_lab['left' if cx < VX else 'right'].append((cz, cx, g))
    for sd, lst in side_lab.items():
        lst.sort(reverse=True); y_prev = -1e9
        for cz, cx, g in lst:
            tx, ty = T(cx, cz); ty = max(ty, y_prev + 26); y_prev = ty; tw = d.textlength(g, font=FB)
            lx = 8 if sd == 'left' else W - tw - 10; ax = lx + tw + 6 if sd == 'left' else lx - 6
            col = (255, 140, 230) if g.startswith('П1') else (255, 230, 160)
            d.line([T(cx, cz), (ax, ty + 10)], fill=col + (200,), width=2); d.text((lx, ty), g, fill=col, font=FB)
    d.text((10, H - 56), 'План зверху: x — праворуч, z — углиб (вікно вгорі), око глядача — під картинкою (774, −520). Рожеве — антресоль (виступ 28 од. від стіни,', fill=(150, 150, 190), font=F)
    d.text((10, H - 34), 'на висоті над порталом), жовте — полиці, вазони, плакат і неон уздовж стін. Зони — кольорові сліди (як у gen_room.py --plan).', fill=(150, 150, 190), font=F)
    im.save(path)


if __name__ == '__main__':
    import argparse
    ap = argparse.ArgumentParser(description='декор стін поза зонами (швидко: зони — з js/objects/arc_layout.js)')
    ap.add_argument('--write', action='store_true', help='переписати предмети шару up в js/objects/arc_layout.js')
    ap.add_argument('--plan', help='план зверху з декором (PNG)')
    a = ap.parse_args()
    p = os.path.join(REPO, 'js', 'objects', 'arc_layout.js'); src = open(p, encoding='utf8').read()
    m = re.search(r'NX\.arcLayout = (\{.*?\});', src, flags=re.S); LAY = json.loads(m.group(1))
    for name, sgn in (('right', 1), ('left', -1)):
        Ls = LAY[name]; Ls['items'] = [it for it in Ls['items'] if it.get('layer') != 'up']
        up = decor_side(Ls, sgn, Ls['C'], Ls['R']); Ls['items'] = Ls['items'] + up
    if a.plan:
        cfg = open(os.path.join(REPO, 'js', 'core', 'config.js'), encoding='utf8').read(); sy = float(re.search(r'SOFA_Y:\s*([\d.]+)', cfg).group(1))
        zf = D * (FL - 220) / (sy - 220) - D; sk = (lambda v: 1.45 + 1.25 * max(0, min(1, (v - 352) / 330)))(sy) / (1.45 + 1.25 * max(0, min(1, (362 - 352) / 330))); sw = 234 * sk / s(zf)
        plan_png(LAY, a.plan, sofa=(VX - sw / 2, VX + sw / 2, zf, zf + 45)); print('план:', a.plan)
    if a.write:
        new = src[:m.start(1)] + json.dumps(LAY, separators=(',', ':'), ensure_ascii=False) + src[m.end(1):]
        open(p, 'w', encoding='utf8').write(new); print('записано в', os.path.relpath(p, REPO))
