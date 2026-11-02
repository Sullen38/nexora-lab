# tools/wingbox/decor.py — ДЕКОР СТІН ПОЗА ЗОНАМИ: масивна антресоль («другий поверх») праворуч, соти-полиці з рослинами й
# артефактами, ТРИ АКВАРІУМИ (риф, медузарій, акватруба з аквапонікою), підвісні рослини, плакат і неонова вивіска (власник
# 02.11: «Nexi в нас ботанік — рослини цікаві й різні»; «щоб нічого не повторювалось — усе унікальне»; зони не чіпаємо, декор
# не заходить на них ні на комп'ютері, ні на телефоні; перспектива — та сама, що в зон).
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


# ===================================== УНІКАЛЬНІСТЬ =====================================
# Власник (02.11, «Декор стін · 2»): «головне — щоб нічого не повторювалось, усе має бути унікальне». Кожна рослина — свого
# виду, кожен вазон — свого дизайну (форма × матеріал × неоновий обідок), кожна полиця-сота й кожна штучка — свої; ліани —
# різних видів. Генератор перевіряє: UNIQUE — повтори (має бути none).
POTS = {   # дизайни вазонів: форма (taper — звужений донизу, bowl — чаша, tall — високий, cube — куб, orb — куля), матеріал, неоновий обідок
    'terra':    dict(shape='taper', mat='terra'),                     # класична теракота
    'navyneon': dict(shape='taper', mat='navy', band='pink'),         # темно-синій з рожевим неоном
    'ceram':    dict(shape='bowl', mat='ceram'),                      # біла кераміка, чаша
    'darkcyan': dict(shape='bowl', mat='dark', band='cyan'),          # чорна чаша з блакитним неоном
    'chrome':   dict(shape='tall', mat='chrome'),                     # хромований циліндр
    'gold':     dict(shape='taper', mat='gold'),                      # золотий
    'jade':     dict(shape='bowl', mat='jade', band='green'),         # нефрит
    'copper':   dict(shape='tall', mat='copper'),                     # мідь з патиною
    'concrete': dict(shape='cube', mat='concrete'),                   # бетонний куб
    'pink':     dict(shape='taper', mat='pink', band='lil'),          # рожева смола з бузковим неоном
    'black':    dict(shape='cube', mat='dark', band='orange'),        # чорний куб з помаранчевим неоном
    'enamel':   dict(shape='tall', mat='enamel', band='gold'),        # синя емаль із золотою смугою
    'stone':    dict(shape='bowl', mat='stone'),                      # сірий камінь
    'macrame':  dict(shape='orb', mat='ceram', band='cyan'),          # біла куля в макраме
}


# ===================================== ДЕКОР КРИЛА =====================================
def decor_side(L, sgn, C, R, verbose=True):
    """sgn +1 — праве крило (панелі: технологічна оранжерея), -1 — ліве (цегла: затишний куточок ботаніка й акваріуми).
    -> список предметів шару 'up'. Порядок усередині: опори (антресоль, соти, труба) раніше за те, що на них стоїть."""
    W = Wall(sgn, C, R, L['wall'][0][0]); out = []
    add = out.append
    zm, (MX0, MY0, MS) = zone_mask(L); zpx = zm.load(); ZW, ZH = zm.size
    def free_y(X, margin=MARGIN):
        """перший зайнятий зонами рядок екрана під стелею в стовпчику X (мінус поле)"""
        i0 = int((X - MX0) * MS)
        for j in range(int((0 - MY0) * MS), ZH):
            if any(0 <= i < ZW and zpx[i, j] for i in (i0 - 2, i0, i0 + 2)): return MY0 + j / MS - margin
        return 400.
    def pot_of(name, pw, ph):
        return dict(POTS[name], name=name, pw=pw, ph=ph)
    def plant_on(sup, id, a, kind, w, h, pot, pw, ph, inset, seed=1, hl=0, **kw):
        """рослина у вазоні на опорі sup (антресоль, сота): кут a, глибина від стіни inset (середина вазона), w × h — уся з вазоном"""
        d = pw + 1.2; dc = dict(kind=kind, pot=pot_of(pot, pw, ph), seed=seed, **kw)
        if hl: dc['hl'] = hl
        add(item(W, id, a, d, w, sup['Y'] + hl, sup['Y'] - h, 'dc_pot', inset=inset - d / 2, on=sup['id'], dc=dc))
    def art_on(sup, id, a, kind, w, h, d, inset, **kw):
        add(item(W, id, a, d, w, sup['Y'], sup['Y'] - h, 'dc_art', inset=inset - d / 2, on=sup['id'], dc=dict(kind=kind, **kw)))
    def hang(id, X, y0, y1, kind, w=12, inset=6, seed=1, frm='wall', **kw):
        """підвісна рослина: від рядка y0 до y1 на екрані (кріплення вгорі: hook — кронштейн зі стіни, edge — край антресолі)"""
        a = W.a_of(X, inset); (x, z), _, _ = W.at(a, inset); Y0, Y1 = Yw(y0, z), Yw(y1, z)
        add(item(W, id, a, 3, w, Y1, Y0, 'dc_hang', inset=inset - 1.5, dc=dict(kind=kind, seed=seed, frm=frm, wb=round(inset - 1.5, 2), **kw)))
    def flat(id, X0, X1, y0, y1, st, d=1.4, **kw):
        """пласке на стіні (плакат, вивіска): прямокутник екрана X0..X1 × y0..y1 (за серединою)"""
        a0, a1 = W.a_of(X0), W.a_of(X1); am = (a0 + a1) / 2; w = chord(W, a0, a1)
        (x, z), _, _ = W.at(am, d); add(item(W, id, am, d, w, Yw(y1, z), Yw(y0, z), st, inset=1.6, **kw))   # 1.6 — запас: стіну рушій малює сплайном через вузли дуги
    def arc_segments(prefix, a0, a1, step, P, yb, yt, st, inset=.3, extra=None):
        """смуга вздовж дуги (антресоль, риф): сегменти по step° — у кожного коробка й свій шматок (s0 — довжина від початку)"""
        n = max(1, int(round(abs(a1 - a0) / step))); da = (a1 - a0) / n; acc = 0.; segs = []
        for i in range(n):
            sa = a0 + i * da; sb = sa + da; am = (sa + sb) / 2; w = chord(W, sa, sb) + .2
            seg = dict(extra or {}, i=i, n=n, sa=round(sa, 4), sb=round(sb, 4), s0=round(acc, 2), C=[round(C[0], 2), round(C[1], 2)], R=R, sgn=sgn)
            it = item(W, f'{prefix}{i}', am, P, w, yb, yt, st, inset=inset, dc=seg); add(it); segs.append(it)
            acc += chord(W, sa, sb, P)
        return segs, acc

    if sgn > 0:
        # ---------- П1. ДРУГИЙ ПОВЕРХ над порталом (власник: «більш масивний, більший і пропрацьований»): товста плита (22 од.)
        # з багатошаровим фасадом — хромова кромка, рожевий неон, панелі з ґратками й заклепками, неонова емблема-листок,
        # блакитна LED-смуга з вогниками; глибший виступ (34), скляне поруччя з хромованими стійками й неоновими ковпачками,
        # ферми-консолі (лише там, де під плитою вільно), спід з балками, трубою й точковими світильниками. Рівна в світі,
        # тому на дузі «підіймається» до глядача — над інструментами не влазить (Декор стін · 1).
        MZ = dict(P=34., top=54., bot=76., rail=12., brk=12., a0=76., a1=104.)
        segs, tot = arc_segments('dc_mz', MZ['a0'], MZ['a1'], 2., MZ['P'], MZ['bot'] + 1, MZ['top'] - MZ['rail'] - 1, 'dc_mz', extra=MZ)
        for sg in segs:                                                               # ферми-консолі — лише там, де під плитою вільно (краї)
            sg['dc']['tot'] = round(tot, 2)
            if sg['dc']['i'] in (0, 2, 11, 13): sg['dc']['truss'] = 1; sg['yb'] = MZ['bot'] + MZ['brk']
            if sg['dc']['i'] in (4, 9): sg['glow'] = 1; sg['gr'] = 34                      # теплі світильники в споді — світло на стіну під антресоллю
        mz = lambda a: dict(Y=MZ['top'], id=f"dc_mz{min(13, max(0, int((a - MZ['a0']) / 2.)))}")
        BACK, FRONT = 11.5, MZ['P'] - 10.                                               # глибина від стіни: високі — ближче до стіни, низькі — до поруччя
        # ОДИН РЯД зліва направо, без накладань на екрані (власник: «щоб нічого нічому не заважало»): кожну річ ставимо одразу
        # за попередньою (межі на екрані + 2 од.); висота — не вище стелі в цьому місці (на дузі праворуч місця вгорі менше)
        ROW = [('strelitzia', 19, 46, 'navyneon', 10, 8, BACK, dict(seed=61)), ('shroom', 12, 13, 'darkcyan', 9, 4.5, FRONT, dict(seed=8, glow=1)),
               ('palm', 19, 38, 'chrome', 8, 9, BACK, dict(seed=33)), ('lantern',), ('greenhouse',), ('flytrap', 13, 16, 'jade', 8, 4.5, FRONT, dict(seed=5)),
               ('monstera', 17, 24, 'ceram', 9, 6, BACK, dict(seed=32)), ('fern', 13, 16, 'copper', 7, 5, BACK, dict(seed=34))]
        prev = W.X(MZ['a0'] + .4, MZ['P']) + 1.; k = 0
        for spec in ROW:
            def make(a, h=None):
                if spec[0] == 'lantern': return item(W, 'dc_lantern', a, 9., 9., MZ['top'], MZ['top'] - (h or 22), 'dc_lantern', inset=FRONT - 4.5, on=mz(a)['id'], glow=1, gr=34)
                if spec[0] == 'greenhouse': return item(W, 'dc_green', a, 13., 13., MZ['top'], MZ['top'] - (h or 28), 'dc_art', inset=BACK - 6.5, on=mz(a)['id'], dc=dict(kind='greenhouse', plant='orchid', seed=27))
                kind, w, hh, pot, pw, ph, ins, kw = spec; d = pw + 1.2
                return item(W, f'dc_mzp{k}', a, d, w, MZ['top'], MZ['top'] - (h or hh), 'dc_pot', inset=ins - d / 2, on=mz(a)['id'], dc=dict(kind=kind, pot=pot_of(pot, pw, ph), **kw))
            lo, hi = MZ['a0'] + .3, MZ['a1'] - .3
            for _ in range(40):                                                         # найменший кут, за якого ліва межа — за попередньою
                m = (lo + hi) / 2
                if min(p[0] for p in screen_poly(make(m))) < prev + 2: lo = m
                else: hi = m
            it = make(hi); top = min(p[1] for p in screen_poly(it))
            if top < 3:                                                                 # не вище стелі: нижча
                H0 = it['yb'] - it['yt']; (x, z), _, _ = W.at(hi, MZ['P'] * .5)
                it = make(hi, H0 - (3 - top) / s(z) - .5)
            add(it); prev = max(p[0] for p in screen_poly(it)); k += spec[0] not in ('lantern', 'greenhouse')
        # ліани з краю — кожна свого виду, лише там, де під плитою вільно (над лівою колоною брами й праворуч від замкового каменя)
        for k, (a, kind, ln) in enumerate(((77.4, 'pearls', 16), (81.2, 'tradescantia', 20), (99.8, 'wisteria', 14), (103.4, 'hoya', 22))):
            (x, z), _, _ = W.at(a, MZ['P'] - 1.); y0 = ys(MZ['bot'], z) - 2.
            hang(f'dc_mzv{k}', W.X(a, MZ['P'] - 1.), y0, min(y0 + ln, free_y(W.X(a, MZ['P'] - 1.)) - 2), kind, w=11., inset=MZ['P'] - 1.5, seed=41 + k, frm='edge')
            out[-1]['on'] = mz(a)['id']
        # ---------- П2. АКВАТРУБА над інструментами (акваріум №3, прісноводний «кібер»): велика скляна труба (r 13) уздовж
        # стіни — РІВНА В СВІТІ, як поручень і антресоль (на екрані «підіймається» до глядача); дальній кінець заходить у
        # стіну коліном, ближній — кришка з неоновим кільцем і трубою подачі в стелю; хомути на стиках, кронштейни знизу.
        # Усередині — акваскейп (мох, папороть, мариміо…), живі риби (objects/decor.js) — за СКЛОМ: вікна dc_tbg* (рушій дає
        # маску видимих пікселів скла). Згори — аквапоніка: базилік, м'ята, салат, полуниця в сітчастих горщиках; над ними —
        # фітолампа на тросах зі стелі (рожево-фіолетова).
        TB = dict(r=13., gap=2.5, X0=1232., X1=1376., n=7)
        ri = TB['r'] + TB['gap']; a0, a1 = W.a_of(TB['X0'], ri), W.a_of(TB['X1'], ri); n = TB['n']; da = (a1 - a0) / n
        Yc = 1e9
        for k in range(61):                                                             # низ труби — над зонами по всій довжині (і спереду, і біля стіни)
            a = a0 + (a1 - a0) * k / 60
            for dd in (-TB['r'], 0., TB['r']):
                (x, z), _, _ = W.at(a, ri + dd); Yc = min(Yc, Yw(free_y(W.X(a, ri + dd)), z) - TB['r'])
        Yc = round(Yc - 1.8, 2); TB['Yc'] = Yc; acc = 0.
        for i in range(n):
            sa, sb = a0 + i * da, a0 + (i + 1) * da; am = (sa + sb) / 2; wc = chord(W, sa, sb, ri)
            seg = dict(TB, i=i, n=n, sa=round(sa, 4), sb=round(sb, 4), s0=round(acc, 2), C=[round(C[0], 2), round(C[1], 2)], R=R, sgn=sgn)
            add(item(W, f'dc_tb{i}', am, 2 * TB['r'], chord(W, sa, sb) + .2, Yc + TB['r'] + .3, Yc - TB['r'] - .3, 'dc_tube', inset=TB['gap'], dc=seg))
            add(item(W, f'dc_tbg{i}', am, .3, wc + .12, Yc + TB['r'] - .4, Yc - TB['r'] + .4, 'dc_win', inset=ri - .3, on=f'dc_tb{i}', dc=dict(aq='tube', i=i, n=n, s0=round(acc, 2), sa=round(sa, 4), sb=round(sb, 4), C=[round(C[0], 2), round(C[1], 2)], R=R, sgn=sgn, ins=ri, r=TB['r'], Yc=Yc)))
            acc += wc
        for sg in out:
            if sg['id'].startswith(('dc_tb', 'dc_tbg')) and 'dc' in sg: sg['dc']['tot'] = round(acc, 2)
        tb = lambda a: f'dc_tb{min(n - 1, max(0, int((a - a0) / da)))}'
        # фітолампа над аквапонікою: планка на двох тросах зі стелі (рівна в світі; ближчий кінець — не вище рядка 4.5 екрана;
        # стиль neon — рожеве світло на стіну)
        la0, la1 = a0 + (a1 - a0) * .02, a0 + (a1 - a0) * .51; am = (la0 + la1) / 2
        (x1_, z1_), _, _ = W.at(la1, ri - 2.5); yl = round(Yw(4.5, z1_), 2)
        (x0_, z0_), _, _ = W.at(la0, ri); (xm_, zm_), _, _ = W.at(la1, ri)
        add(item(W, 'dc_tblamp', am, 5., chord(W, la0, la1, ri), yl + 2.4, yl, 'neon', inset=ri - 2.5, glow=1, gr=30, dc=dict(c0=round(Yw(-3., z0_), 2), c1=round(Yw(-3., zm_), 2))))
        # аквапоніка: на лівій половині (праворуч труба вже під стелею), під лампою — кожна своя
        for k, (u, kind) in enumerate(((.07, 'basil'), (.2, 'mint'), (.33, 'lettuce'), (.46, 'straw'))):
            a = a0 + (a1 - a0) * u; top = Yc - TB['r'] + 1.2; hh = min(13., top - (yl + 2.4 + 2.))
            add(item(W, f'dc_tbp{k}', a, 6., 10., top, top - hh, 'dc_pot', inset=ri - 3, on=tb(a), dc=dict(kind=kind, pot=dict(shape='net', mat='dark', band=['pink', 'cyan', 'lil', 'green'][k], name='net-' + ['pink', 'cyan', 'lil', 'green'][k], pw=5, ph=2), seed=71 + k, net=1)))
        # ---------- П3. ПІДВІСНИЙ ВАЗОН між маніпулятором і інструментами: біла куля в макраме, золотий потос
        hang('dc_hangR', 1207., 4., 66., 'pothos', w=20, inset=10, seed=7, frm='hook', pot=pot_of('macrame', 7, 7))
    else:
        # ---------- Л1. Над AI-центром: СОТИ-ПОЛИЦІ (кіберпанк: шестикутні комірки з неоновим кантом, кожна свого кольору й
        # візерунка дна) — у кожній своя річ; і неонова вивіска «Nexi з паростком» (без слів)
        HX = dict(w=21., d=11., a0=88.6, cols=6)
        h = HX['w'] * .866; step = math.degrees(.75 * HX['w'] / (R - HX['d']))
        NEONS = ['#ff4fd8', '#3be8ff', '#c86aff', '#3bff8a', '#ff9a3a', '#ffd27a', '#ff3a5a', '#b8ff3a', '#3a7aff', '#3affd8']   # 10 сот — 10 різних неонів
        cells = []
        for k in range(HX['cols'] + 2):
            a = HX['a0'] + k * step
            for row in (0, 1, 2):
                (x, z), _, _ = W.at(a, HX['d']); X = W.X(a, HX['d'])
                if X < -56: continue
                Yc = Yw(14 + h * .55, z) + row * h + (h / 2 if k % 2 else 0)
                yt, yb = ys(Yc - h / 2, z), ys(Yc + h / 2, z)
                (xw, zw), _, _ = W.at(a, 0); ybw = ys(Yc + h / 2, zw)
                if yt < 3 or max(yb, ybw) > free_y(X) - 2 or X > 86: continue
                cells.append((k, row, a, Yc))
        ITEMS = [('plant', 'bonsai', 'gold'), ('art', 'orb'), ('plant', 'succ', 'pink'), ('art', 'books'), ('plant', 'cactus2', 'stone'),
                 ('art', 'terrarium'), ('plant', 'sansevieria', 'black'), ('art', 'flask'), ('art', 'scope'), ('art', 'figure')]
        cells = sorted(cells, key=lambda c: (c[0], c[1]))[:len(ITEMS)]
        for q, (k, row, a, Yc) in enumerate(cells):
            cid = f'dc_hx{q}'; add(item(W, cid, a, HX['d'], HX['w'], Yc + h / 2, Yc - h / 2, 'dc_hex', inset=.6, dc=dict(neon=NEONS[q % len(NEONS)], pat=q, w=HX['w'], h=round(h, 2))))
            sup = dict(Y=Yc + h / 2 - 1.6, id=cid); kind = ITEMS[q]
            if kind[0] == 'plant':
                hh = h - 3.5; plant_on(sup, f'dc_hxp{q}', a, kind[1], HX['w'] * .5, hh, kind[2], 6., 4, HX['d'] - 3.8, seed=80 + q)   # ближче до краю соти: знизу видно
            else: art_on(sup, f'dc_hxa{q}', a, kind[1], HX['w'] * .5, h - 4, 6., HX['d'] - 3.2, seed=q)
        flat('dc_neon', 94., 180., 14., 66., 'neon', d=1.6, glow=1, gr=40)          # неон: Nexi з паростком (без слів; стиль neon — рожевий кант і рожеве світло на стіну)
        # ---------- Л2. РИФ над аналітикою (акваріум №1): вигнута панорамна скляна стінка вздовж дуги, кораловий риф, рибки
        # (живі: objects/decor.js); кришка зі світлом зверху, тумба з неоном і вогниками знизу — найбільший, що влазить
        RF = dict(P=14., lid=5., base=7.)
        a0, a1 = W.a_of(222.), W.a_of(362.)
        Ytop = -999.
        for k in range(41):                                                             # верх кришки — не вище рядка 5 по всій довжині
            a = a0 + (a1 - a0) * k / 40; (x, z), _, _ = W.at(a, RF['P'] + .3); Ytop = max(Ytop, Yw(5., z) + RF['lid'])
        Ybot = 999.
        for k in range(41):                                                             # низ тумби — над зонами (біля стіни і спереду)
            a = a0 + (a1 - a0) * k / 40
            for ins in (0., RF['P'] + .3):
                (x, z), _, _ = W.at(a, ins); Ybot = min(Ybot, Yw(free_y(W.X(a, ins)) - 1, z) - RF['base'])
        RF.update(top=round(Ytop, 2), bot=round(Ybot, 2))
        segs, tot = arc_segments('dc_rf', min(a0, a1), max(a0, a1), abs(a1 - a0) / 7, RF['P'], RF['bot'] + RF['base'], RF['top'] - RF['lid'], 'dc_reef', extra=RF)
        acc = 0.
        for sg in segs:                                                                 # скло кожної секції — вікно (рушій дає маску видимих пікселів: риби живуть за ним)
            d = sg['dc']; d['tot'] = round(tot, 2); sa, sb = d['sa'], d['sb']; wc = chord(W, sa, sb, RF['P'] + .1)
            add(item(W, sg['id'].replace('dc_rf', 'dc_rfg'), (sa + sb) / 2, .3, wc + .12, RF['bot'], RF['top'], 'dc_win', inset=RF['P'] + .1 - .3, on=sg['id'],
                     dc=dict(aq='reef', i=d['i'], n=d['n'], s0=round(acc, 2), sa=sa, sb=sb, C=d['C'], R=R, sgn=sgn, ins=RF['P'] + .1, P=RF['P'], top=RF['top'], bot=RF['bot'], tot=round(tot, 2))))
            acc += wc
        # ---------- Л3. МЕДУЗАРІЙ між аналітикою й маркетингом (акваріум №2): висока скляна колона з медузами, хромові
        # кришки з неоновими кільцями, труба подачі вгору (у стелю); кріплення до цегли
        CL = dict(r=16.5, gap=3., X=407., ytop=6.)
        a = W.a_of(CL['X'], CL['r'] + CL['gap']); (x, z), _, _ = W.at(a, CL['r'] + CL['gap'])
        Yt = Yw(CL['ytop'], z - CL['r']); Yb = min(Yw(free_y(CL['X'] + dx) - 2, z - CL['r']) for dx in (-20, -10, 0, 10, 20))
        add(item(W, 'dc_jelly', a, CL['r'] * 2, CL['r'] * 2, Yb, Yt, 'dc_column', inset=CL['gap'], dc=dict(r=CL['r'], cap=7., base=11.)))
        # скло колони — вікно в площині осі, лицем до ока (рушій дає маску; медузи — objects/decor.js)
        tx, tz = VX - x, -D - z; turn = math.degrees(math.atan2(-tx, -tz))
        g0, g1 = Yt + 7. + .4, Yb - 11. - .4
        add(dict(id='dc_jellyg', layer='up', x=round(x, 2), z=round(z, 2), turn=round(turn, 3), w=round(CL['r'] * 2 - .9, 2), dep=.3, yb=round(g1, 2), yt=round(g0, 2), st='dc_win', grp='dc', on='dc_jelly',
                 dc=dict(aq='jelly', cx=round(x, 2), cz=round(z, 2), r=CL['r'], top=round(g0, 2), bot=round(g1, 2))))
        # ---------- Л4. Біля вікна над маркетингом: ботанічний плакат (напис — зі словників)
        flat('dc_poster0', 447., 501., 10., 88., 'dc_poster', d=1.2)
    if verbose: report(L, out, 'right' if sgn > 0 else 'left')
    return out


# ===================================== ПЕРЕВІРКА: НЕ ЗАХОДИТЬ НА ЗОНИ (екран) =====================================
BILLBOARD = ('dc_pot', 'dc_hang', 'dc_art', 'dc_lantern')                              # рослини й штучки — спрайт / дрібні форми лицем до глядача
def screen_poly(it):
    """межі предмета на екрані: рослини й штучки — прямокутник «лицем до глядача» (ширина w, як спрайт рушія), решта — усі 8
    кутів коробки (на дузі біля 90° глибина коробки лягає на екрані вшир, а ширина — углиб: так точніше)"""
    f, r, P = frame(it); w = it['w'] / 2
    if it['st'] in BILLBOARD:
        c = P(0, it['dep'] / 2, 0); x0 = c[0] - w; x1 = c[0] + w; z = c[2]
        return [P3(x, y, z) for x in (x0, x1) for y in (it['yb'], it['yt'])] + [P3(*P(u, v, it['yb'])) for u in (-w * .4, w * .4) for v in (0, it['dep'])]
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
        x, y = P3(*A["tlBeacon"]); d.ellipse([T((x - 19, y - 19)), T((x + 19, y + 19))], fill=255)   # з сяйвом (decor_check.js)
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
SUPPORTS = ('dc_mz', 'dc_reef', 'dc_tube', 'dc_hex', 'dc_column')                                   # опори-смуги: сегменти / соти однієї групи
def group_key(it, by):
    """до якої групи належить річ: опора (антресоль, риф, труба, соти) разом з тим, що на ній стоїть чи з неї звисає"""
    j = it
    while j.get('on') and j['on'] in by: j = by[j['on']]
    return re.sub(r'\d+$', '', j['id']) if j['st'] in SUPPORTS else j['id']
def check_overlap(items, frac=.12):
    """РЕЧІ ДЕКОРУ ОДНА НА ОДНІЙ (власник: «щоб нічого нічому не заважало, не перекривало»): межі на екрані (опуклі оболонки)
    речей різних груп не перетинаються; на одній опорі сусіди не закривають одне одного більш ніж на frac меншого."""
    import numpy as np
    from PIL import Image, ImageDraw
    by = {it['id']: it for it in items}; S = 2; P = {}
    for it in items:
        h = hull(screen_poly(it)); xs = [p[0] for p in h]; yy = [p[1] for p in h]; P[it['id']] = (h, min(xs), max(xs), min(yy), max(yy))
    def mask(i, x0, y0, W, H):
        m = Image.new('L', (W, H), 0); ImageDraw.Draw(m).polygon([((x - x0) * S, (y - y0) * S) for x, y in P[i][0]], fill=255); return np.asarray(m) > 0
    bad = []; ids = list(P)
    for a in range(len(ids)):
        for b in range(a + 1, len(ids)):
            A, B = by[ids[a]], by[ids[b]]; pa, pb = P[ids[a]], P[ids[b]]
            if pa[2] < pb[1] or pb[2] < pa[1] or pa[4] < pb[3] or pb[4] < pa[3]: continue
            if A.get('on') == B['id'] or B.get('on') == A['id']: continue                 # стоїть на ній / звисає з неї
            ga, gb = group_key(A, by), group_key(B, by); same = ga == gb
            if same and (A['st'] in SUPPORTS or B['st'] in SUPPORTS): continue            # опора й річ своєї групи, сусідні сегменти / соти
            x0, y0 = min(pa[1], pb[1]), min(pa[3], pb[3]); W, H = int((max(pa[2], pb[2]) - x0) * S) + 2, int((max(pa[4], pb[4]) - y0) * S) + 2
            ma, mb = mask(ids[a], x0, y0, W, H), mask(ids[b], x0, y0, W, H); inter = int((ma & mb).sum()); mn = max(1, min(int(ma.sum()), int(mb.sum())))
            if (not same and inter > 0) or (same and inter / mn > frac): bad.append((ids[a], ids[b], round(inter / mn, 2)))
    return bad
def check_unique(items):
    """УНІКАЛЬНІСТЬ: вид рослини, дизайн вазона, штучка, сота — кожне один раз"""
    seen, dup = {}, []
    for it in items:
        d = it.get('dc') or {}; keys = []
        if it['st'] in ('dc_pot', 'dc_hang'): keys.append('рослина:' + d.get('kind', '?'))
        pot = d.get('pot')
        if isinstance(pot, dict): keys.append('вазон:' + pot.get('name', '?'))
        if it['st'] == 'dc_art': keys.append('штучка:' + d.get('kind', '?'))
        if it['st'] == 'dc_hex': keys.append('сота:%s/%s' % (d.get('neon'), d.get('pat')))
        for k in keys:
            if k in seen: dup.append((k, seen[k], it['id']))
            else: seen[k] = it['id']
    return dup
def report(L, items, name):
    bad = check_screen(L, items); ov = check_overlap(items); du = check_unique(items)
    print(f'  decor {name}: {len(items)} речей;', 'DECOR OVER ZONES:', bad if bad else 'none', '| DECOR OVERLAP:', ov if ov else 'none', '| UNIQUE:', 'повтори ' + str(du) if du else 'none')
    return bad


# ===================================== ПЛАН ЗВЕРХУ (картинка для власника) =====================================
GROUPS = [('dc_mz', 'П1 АНТРЕСОЛЬ (2-й поверх)'), ('dc_lantern', 'П1'), ('dc_green', 'П1'), ('dc_tb', 'П2 АКВАТРУБА (акваріум №3)'), ('dc_hangR', 'П3 ПІДВІСНИЙ ВАЗОН'),
          ('dc_hx', 'Л1 СОТИ-ПОЛИЦІ'), ('dc_neon', 'Л1 НЕОН'), ('dc_rf', 'Л2 РИФ (акваріум №1)'), ('dc_jelly', 'Л3 МЕДУЗАРІЙ (акваріум №2)'), ('dc_poster', 'Л4 ПЛАКАТ')]
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
    d.text((10, H - 56), 'План зверху: x — праворуч, z — углиб (вікно вгорі), око глядача — під картинкою (774, −520). Рожеве — антресоль (виступ 34 од. від стіни,', fill=(150, 150, 190), font=F)
    d.text((10, H - 34), 'плита 22 од. над порталом), жовте — соти-полиці, три акваріуми, вазони, плакат і неон уздовж стін. Зони — кольорові сліди (як у gen_room.py --plan).', fill=(150, 150, 190), font=F)
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
