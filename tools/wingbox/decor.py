# tools/wingbox/decor.py — ДЕКОР СТІН ПОЗА ЗОНАМИ: масивна антресоль («другий поверх») праворуч — з пілона за край кадру (· 4),
# соти-полиці з рослинами й артефактами, ДВА АКВАРІУМИ (риф, медузарій) і ВЕРТИКАЛЬНА ФЕРМА за маніпулятором (· 13), висяча зелень, плакати
# ботаніка й Рудика (· 4) і неонова вивіска (власник
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
# стіні й плінтус (одна перспектива). Через це вона починається над порталом (з пілона) і йде за край кадру, під стелю.
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
    'basket':   dict(shape='basket', mat='wicker'),                   # плетений кошик з кокосовою підкладкою (Декор стін · 3)
    'koke-pink': dict(shape='moss', mat='moss', band='pink'),         # кокедама: мохова куля, обв'язана рожевим шнуром
    'koke-gold': dict(shape='moss', mat='moss', band='gold'),         #   … золотим
    'koke-cyan': dict(shape='moss', mat='moss', band='cyan'),         #   … блакитним
    'lava':     dict(shape='orb', mat='stone', band='orange'),        # (· 5) куля з лавового каменю з помаранчевим неоном (макраме)
}
INVIS = ('dc_lt_',)                                                                 # невидиме (світло на стіну) — без перевірок
ONWALL = ('dc_shadow', 'dc_climb')                                                  # лежить НА стіні (тінь, плющ) — під речами, накладання з декором не рахуємо
INCEIL = ('dc_mz', 'dc_pylon', 'dc_pyg', 'dc_fm')                                                       # (· 4) навмисно йде «в стелю» (пілон від стелі; ближній кінець антресолі) — без CEIL
JOIN = {('dc_pylon', 'dc_mz')}                                                      # (· 4) з'єднані: антресоль виходить з пілона


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

    # ---------- (Декор стін · 3) пласке біля стіни, тінь, світло ----------
    def flatw(id, X0, X1, y0, y1, st, inset, d=.4, **kw):
        """пласке біля стіни (плющ, дошка): прямокутник екрана X0..X1 × y0..y1 (на обох кінцях хорди — у межах); передня
        грань — за inset од. від стіни"""
        a0, a1 = W.a_of(X0, inset), W.a_of(X1, inset); am = (a0 + a1) / 2; w = chord(W, a0, a1, inset); zs = [W.at(a, inset)[0][1] for a in (a0, a1)]
        it = item(W, id, am, d, w, min(Yw(y1, z) for z in zs), max(Yw(y0, z) for z in zs), st, inset=inset - d, **kw); add(it); return it
    def climb(id, X0, X1, y0, y1, kind, seed):
        """виткá рослина НА стіні (дикий виноград, пасифлора): пласка грань за .9 од. від стіни"""
        return flatw(id, X0, X1, y0, y1, 'dc_climb', .9, d=.3, dc=dict(kind=kind, seed=seed))
    def wshadow(owner, dy=4., pad=1.5, k=.34, soft=3., rnd=0, top=0.):
        """ТІНЬ речі на стіні (дизеринг — у стилі кімнати): за річчю на екрані (ті самі X), у світі — ті самі висоти, зсунуті
        вниз на dy (top — частка висоти речі згори без тіні: ланцюжки, шнури); низ — не нижче вільного місця (на зони не лягає)"""
        P = hull(screen_poly(owner)); xs = [p[0] for p in P]; X0_, X1_ = min(xs) - pad, max(xs) + pad
        a0, a1 = W.a_of(X0_, .35), W.a_of(X1_, .35); am = (a0 + a1) / 2; w = chord(W, a0, a1, .35); zs = [W.at(a, .35)[0][1] for a in (a0, am, a1)]
        yt = owner['yt'] + (owner['yb'] - owner['yt']) * top + dy - pad; yb = owner['yb'] + dy + pad
        yb = min(yb, min(Yw(free_y(X) - 2.5, W.at(W.a_of(X, .35), .35)[0][1]) for X in (X0_ - 2 + (X1_ - X0_ + 4) * q / 16 for q in range(17)))); yt = max(yt, max(Yw(2., z) for z in zs))
        if yb - yt < 1: return None
        it = item(W, 'dc_sh' + owner['id'][2:], am, .15, w, yb, yt, 'dc_shadow', inset=.2 if am >= 0 else 1.35, on=owner['id'], dc=dict(k=k, soft=soft, rnd=rnd)); add(it); return it
    def shy(a0, a1, inset=.35, m=1.5):
        """найнижча висота світу (на стіні між кутами a0..a1), до якої може лягти тінь, не зайшовши на зони"""
        return round(min(Yw(free_y(W.X(a, inset)) - m, W.at(a, inset)[0][1]) for a in (a0 + (a1 - a0) * q / 6 for q in range(7))), 2)
    def light(id, X, y, st, gr, inset=6.):
        """невидиме джерело кольорового світла на стіну (рушій: lightsOf — стиль clamp блакитний, neon рожевий, gold жовтий)"""
        a = W.a_of(X, inset); (x, z), _, _ = W.at(a, inset); Y = Yw(y, z)
        add(item(W, id, a, .4, .4, Y + .2, Y - .2, st, inset=inset, glow=1, gr=gr))

    if sgn > 0:
        # ---------- П0. ПІЛОН (Декор стін · 4; власник: «другий поверх більший і масивніший, щоб не було видно, звідки він
        # починається»): масивна торцева стіна-пілон від стелі до низу плити й нижче — антресоль ВИХОДИТЬ з неї (початку плити
        # не видно; у пілоні — двері на другий поверх). Бокова грань (лицем уздовж антресолі — до глядача): розсувні двері з
        # неоновою рамою й табличкою (живі: інколи відчиняються — за ними тепле світло), скляна колба з поживним розчином від
        # стелі (живі бульбашки), вентиляційна ґратка з вентилятором (живий); лицьова — пульт з вогниками й неонова смуга.
        # Лівий край — не лівіше інструментів, низ — над брамою порталу (DECOR OVER ZONES).
        MZ = dict(P=35., top=54., bot=78., rail=12., brk=12.)
        PY = dict(T=10., D=MZ['P'] + 5., X0=1381.)
        scr = lambda p: (VX + (p[0] - VX) * s(p[2]), ys(p[1], p[2]))
        dT = lambda: math.degrees(PY['T'] / (R - PY['D']))
        lo, hi = 60., 100.
        for _ in range(50):                                                             # кут бокової грані: лівий передній ріг — на X0
            m = (lo + hi) / 2
            if W.X(m - dT(), PY['D']) < PY['X0']: lo = m
            else: hi = m
        ap = round(hi, 3); apm = ap - dT() / 2
        corners = lambda Y: [(W.at(a, ins)[0][0], Y, W.at(a, ins)[0][1]) for a in (ap - dT(), ap) for ins in (0., PY['D'])]
        Yb = 60.
        while Yb < 140 and all(scr(p)[1] <= min(free_y(scr(p)[0] + dx) for dx in (-6, -3, 0, 3, 6)) - 1.5 for p in corners(Yb + .25)): Yb += .25
        Ytop = min(Yw(-7., p[2]) for p in corners(0.))
        PY.update(a0=round(ap - dT(), 3), a1=ap, Yb=round(Yb, 2), Ytop=round(Ytop, 2))
        pyl = item(W, 'dc_pylon', apm, PY['D'], chord(W, ap - dT(), ap) + .3, PY['Yb'], PY['Ytop'], 'dc_pylon', inset=.5, dc=dict(PY, sgn=sgn, C=[round(C[0], 2), round(C[1], 2)], R=R, deck=MZ['top'], plant='shroom',
                   fungi=[[-3.1, MZ['top'] + 3.5, 2.6], [3.2, MZ['top'] + 6.8, 2.3], [-2.6, MZ['top'] + 10., 2.]]))   # (· 5) світні гриби-трутовики: u, Y, r
        add(pyl)
        # вікна на боковій грані (лицем уздовж антресолі, до глядача) — рушій дає маски видимих пікселів (objects/decor.js). Бокова
        # грань — грань коробки пілона (u = ±w/2), глибина від стіни ins = fin − v (fin — де лицьова грань: стрілка хорди + D)
        _, _, tS = W.at(ap, 0.); ta = math.radians(pyl['turn']); fP = (-math.sin(ta), -math.cos(ta)); rP = (-fP[1], fP[0])
        sR = 1. if rP[0] * tS[0] + rP[1] * tS[1] > 0 else -1.; fin = round(R - math.sqrt(R * R - (pyl['w'] / 2) ** 2) + PY['D'], 3)
        PY.update(sR=sR, fin=fin)
        Pp = lambda u, v: (pyl['x'] + rP[0] * u - fP[0] * v, pyl['z'] + rP[1] * u - fP[1] * v)
        turnS = math.degrees(math.atan2(-sR * rP[0], -sR * rP[1]))
        def side_win(id, u0, u1, y0, y1, aq, **kw):
            """вікно на боковій грані пілона: u0..u1 — глибина від стіни (од.), y — висота світу"""
            x, z = Pp(sR * (pyl['w'] / 2 + .25), fin - (u0 + u1) / 2)
            add(dict(id=id, layer='up', x=round(x, 2), z=round(z, 2), turn=round(turnS, 3), w=round(u1 - u0, 2), dep=.3, yb=round(y1, 2), yt=round(y0, 2), st='dc_win', grp='dc', on='dc_pylon', dc=dict(aq=aq, u0=u0, u1=u1, **kw)))
        PY.update(door=[15.5, 28.5, round(MZ['top'] - 25., 2), round(MZ['top'] - .2, 2)], glass=[30., 36., PY['Ytop'], round(MZ['top'] - 4.5, 2)], vent=[22., 10.5, 6.2], keys=[11.4, 14., 36.5, 44.])
        pyl['dc'].update(door=PY['door'], glass=PY['glass'], vent=PY['vent'], keys=PY['keys'], sR=PY['sR'], fin=PY['fin'])
        side_win('dc_door', PY['door'][0], PY['door'][1], PY['door'][2], PY['door'][3], 'door')
        side_win('dc_pyg', PY['glass'][0], PY['glass'][1], PY['glass'][2], PY['glass'][3], 'pylon')
        door_X1 = max(p[0] for p in hull(screen_poly(out[-2]))) + 3.                   # правий край дверей (і кодового замка) на екрані: рослини — правіше
        # ---------- П1. ДРУГИЙ ПОВЕРХ: виходить з пілона й тягнеться за правий край кадру — ближній кінець іде «в стелю» (кінця
        # теж не видно). Товща плита (26 од.) з багатошаровим фасадом (хромова кромка, рожевий неон, панелі, емблема-паросток,
        # блакитна LED-смуга — живі вогники біжать нею), глибший виступ, скляне поруччя, ферми-консолі там, де під плитою вільно,
        # спід з балками, трубою й точковими світильниками. Рівна в світі — на дузі «підіймається» до глядача.
        lo, hi = ap, 140.
        for _ in range(50):                                                             # кінець — коли передня кромка вже за кадром
            m = (lo + hi) / 2
            if W.X(m, MZ['P']) < 1606.: lo = m
            else: hi = m
        MZ.update(a0=round(ap - .3, 3), a1=round(hi, 3), pier=1)
        # емблема — посередині видимої частини фасаду (до місця, де фасад іде в стелю)
        a_vis = W.a_of(1520., MZ['P']); a_em = (ap + a_vis) / 2
        MZ['mid'] = round(sum(chord(W, MZ['a0'] + (a_em - MZ['a0']) * k / 20, MZ['a0'] + (a_em - MZ['a0']) * (k + 1) / 20, MZ['P']) for k in range(20)), 2)
        segs, tot = arc_segments('dc_mz', MZ['a0'], MZ['a1'], 2., MZ['P'], MZ['bot'] + 1, MZ['top'] - MZ['rail'] - 1, 'dc_mz', extra=MZ)
        a_out = ap
        for sg in segs:
            d = sg['dc']; d['tot'] = round(tot, 2); sa, sb = d['sa'], d['sb']
            d['shy'] = shy(sa, sb)                                                       # межа тіні під плитою (не на зони)
            # ферма-консоль — де під плитою біля стіни вільно (і не в ядрі, і в кадрі)
            fits = all(ys(MZ['bot'] + MZ['brk'] + 1, W.at(a, ins)[0][1]) <= free_y(W.X(a, ins)) - 1 for a in (sa, (sa + sb) / 2, sb) for ins in (0., MZ['P']))
            if fits and sa > a_out + 1.5 and W.X(sb) < 1598 and d['i'] % 2 == 1: d['truss'] = 1; sg['yb'] = MZ['bot'] + MZ['brk']
            if d['i'] in (6, 13): sg['glow'] = 1; sg['gr'] = 30                            # теплі світильники в споді — світло на стіну під антресоллю
        mz = lambda a: dict(Y=MZ['top'], id=f"dc_mz{min(len(segs) - 1, max(0, int((a - MZ['a0']) / ((MZ['a1'] - MZ['a0']) / len(segs)))))}")
        BACK, FRONT = 11.5, MZ['P'] - 10.
        # ОДИН РЯД зліва направо (від ядра), без накладань: кожна річ — одразу за попередньою (межі на екрані + 2 од.);
        # висота — до стелі в цьому місці; там, де плита вже під стелею, — більше не ставимо
        ROW = [('strelitzia', 17, 52, 'navyneon', 10, 8, BACK, dict(seed=61)), ('palm', 17, 46, 'chrome', 8, 9, BACK, dict(seed=33)), ('lantern',),
               ('monstera', 16, 32, 'ceram', 9, 6, BACK, dict(seed=32)), ('greenhouse',), ('flytrap', 11, 14, 'jade', 8, 4.5, FRONT, dict(seed=5)),
               ('shroom', 10, 12, 'darkcyan', 9, 4.5, FRONT, dict(seed=8, glow=1))]
        prev = door_X1 + .5; k = 0
        for spec in ROW:
            def make(a, h=None):
                if spec[0] == 'lantern': return item(W, 'dc_lantern', a, 9., 9., MZ['top'], MZ['top'] - (h or 22), 'dc_lantern', inset=FRONT - 4.5, on=mz(a)['id'], glow=1, gr=34)
                if spec[0] == 'greenhouse': return item(W, 'dc_green', a, 13., 13., MZ['top'], MZ['top'] - (h or 28), 'dc_art', inset=BACK - 6.5, on=mz(a)['id'], dc=dict(kind='greenhouse', plant='orchid', seed=27))
                kind, w, hh, pot, pw, ph, ins, kw = spec; d = pw + 1.2
                return item(W, f'dc_mzp{k}', a, d, w, MZ['top'], MZ['top'] - (h or hh), 'dc_pot', inset=ins - d / 2, on=mz(a)['id'], dc=dict(kind=kind, pot=pot_of(pot, pw, ph), **kw))
            lo, hi = a_out, MZ['a1'] - .3
            for _ in range(40):
                m = (lo + hi) / 2
                if min(p[0] for p in screen_poly(make(m))) < prev + 2: lo = m
                else: hi = m
            it = make(hi); top = min(p[1] for p in screen_poly(it)); H0 = it['yb'] - it['yt']
            if top < 3:
                (x, z), _, _ = W.at(hi, MZ['P'] * .5); it = make(hi, H0 - (3 - top) / s(z) - .5)
            if it['yb'] - it['yt'] < H0 * .55: break                                     # під стелею вже тісно — ряд скінчився
            add(it); prev = max(p[0] for p in screen_poly(it)); k += spec[0] not in ('lantern', 'greenhouse')
        # ЗВИСИ з краю плити через фасад (кожна свого виду) — обабіч емблеми
        fb = lambda X: ys(MZ['bot'], W.at(W.a_of(X, MZ['P']), MZ['P'])[0][1])              # низ фасаду на екрані в стовпчику X
        for k, (X, kind, ln, w) in enumerate(((1436., 'ivy', 17, 13), (1452., 'ceropegia', 15, 11), (1500., 'rhipsalis', 16, 12), (1517., 'aeschynanthus', 17, 13))):
            a = W.a_of(X, MZ['P'] + .6); add(item(W, f'dc_mzs{k}', a, .3, w, MZ['top'] + ln, MZ['top'] - .3, 'dc_spill', inset=MZ['P'] + .6, on=mz(a)['id'], dc=dict(kind=kind, seed=91 + k)))
        # ---------- П2. ВЕРТИКАЛЬНА ФЕРМА NEXI (Декор стін · 13–· 14; власник на · 12 «не подобається мені той екран — що ще можна
        # туди придумати»: обрано «вертикальну ферму»; на · 13: «воно рівне, а має бути як та плитка в перспективі; камерки більше,
        # покращити в три рази»): СПРАВЖНЯ 3D-ТЕПЛИЦЯ вздовж стіни від вікна до плаката Рудика (X 1058..1316 — передня кромка),
        # глибока (P 26), верх і низ — на ОДНІЙ ВИСОТІ У СВІТІ (як плита антресолі): на екрані сходиться в перспективі, ближній кінець
        # іде в стелю (INCEIL), низ — над полем зон (найнижчий — далекий лівий кінець). Три яруси-камери (комірки — сегменти дуги по
        # 2 на камеру). Маніпулятор майстерні — ПЕРЕД теплицею (рушій малює зони після растра крил; маска зон без маніпулятора: noarm).
        # Рама — objects/dc_paint.js st:dc_farm (кришка з фітолампами, стійки-імпости, полиці ярусів, тумба-бак, спід з трубами й лампами,
        # торці); нутро — грань сегмента між кришкою й тумбою з текстурою farmPaint; живе (лотки їдуть конвеєрами трьох ярусів від
        # сівби до збору, ростуть, садівник-робот, бджоли-дрони, туман) — objects/decor_farm.js.
        SH = dict(P=26., lid=6., base=7.)
        zm2, _ = zone_mask(L, arm=False); zpx2 = zm2.load()
        def free_y2(X, margin=MARGIN):
            i0 = int((X - MX0) * MS)
            for j in range(int((0 - MY0) * MS), ZH):
                if any(0 <= i < ZW and zpx2[i, j] for i in (i0 - 2, i0, i0 + 2)): return MY0 + j / MS - margin
            return 400.
        a0, a1 = W.a_of(1058., SH['P']), W.a_of(1308., SH['P'])
        n = 10; bounds = [a0 + (a1 - a0) * k / n for k in range(n + 1)]
        # висоти у світі — одні на всю теплицю: верх — рядок 1.5 на ДАЛЕКОМУ кінці (далі — у стелю), низ — так, щоб у кожному стовпчику
        # низ був над полем зон (найсуворіший — далекий кінець: там низ на екрані найнижче)
        YT = round(max(Yw(1.5, W.at(a0, ins)[0][1]) for ins in (0., SH['P'] + .3)), 2)
        YB = round(min(Yw(free_y2(X) - 1., W.at(W.a_of(X, ins), ins)[0][1]) for X in range(1058, 1309) for ins in (0., SH['P'] + .3)), 2)
        SH['YT'] = YT; SH['YB'] = YB
        segs = []; acc = 0.
        for i in range(n):
            sa, sb = bounds[i], bounds[i + 1]; am = (sa + sb) / 2
            d = dict(SH, i=i, n=n, sa=round(sa, 4), sb=round(sb, 4), s0=round(acc, 2), C=[round(C[0], 2), round(C[1], 2)], R=R, JZ=JZ, sgn=sgn, noarm=1, yta=YT, ytb=YT, yba=YB, ybb=YB)   # JZ — пряма ділянка стіни біля вікна (a < 0): JS pt() малює її прямою, як Wall.at
            it = item(W, f'dc_fm{i}', am, SH['P'], chord(W, sa, sb) + .2, YB, YT, 'dc_farm', inset=.3, dc=d); add(it); segs.append(it)
            acc += chord(W, sa, sb, SH['P'])
        tot = acc; OV = .5                                                               # tot — довжина (x малюнка 0..tot); нутро заходить за кришку й тумбу на OV (без щілин)
        H0 = round((YB - SH['base'] + OV) - (YT + SH['lid'] - OV), 2)
        for sg in segs: sg['dc']['tot'] = round(tot, 2); sg['dc']['shy'] = shy(sg['dc']['sa'], sg['dc']['sb']); sg['dc']['ov'] = OV; sg['dc']['H0'] = H0   # H0 — висота нутра (однакова на всі сегменти)
        fmX1 = 1308.
        # ---------- П3. ПЛАКАТ РУДИКА (Декор стін · 4; власник: «плакат Рудика — прикольний, піксельний») — між акватрубою й
        # пілоном (біля входу на другий поверх); напис — зі словників (4 мови); живе — сам Рудик (кліпає, хвіст, лазерні очі)
        PX0, PX1 = fmX1 + 14., 1375.                                                      # праворуч від ферми — до пілона
        pa0, pa1 = W.a_of(PX0), W.a_of(PX1); pam = (pa0 + pa1) / 2
        pyb = min(Yw(free_y(X) - 6., W.at(W.a_of(X), ins)[0][1]) for X in [PX0 - 4 + q for q in range(int(PX1 - PX0) + 9)] for ins in (1.2, 4.6))
        pyt = max(Yw(5.5, W.at(a, ins)[0][1]) for a in (pa0, pa1) for ins in (1.2, 4.6))
        add(item(W, 'dc_poster1', pam, 2.6, chord(W, pa0, pa1), round(pyb, 2), round(pyt, 2), 'dc_poster', inset=1.6, dc=dict(kind='rudik')))
        rud = out[-1]
        # ---------- П4. ВИСЯЧИЙ САД ПІД АНТРЕСОЛЛЮ (· 4): ліани з краю плити, кокедами на шнурах, макраме з потосом, колумнея в
        # неоновому кільці — кожна своя (усе живе: гойдається)
        def under(id, X, kind, w, ln, frm='edge', **kw):
            y0 = fb(X) + (.6 if frm == 'edge' else 0.); y1 = min(y0 + ln, min(free_y(X + dx) for dx in (-w / 2 - 5, -w / 2, -w / 4, 0, w / 4, w / 2, w / 2 + 5)) - 1.5)
            a = W.a_of(X, MZ['P'] - 1.5); (x, z), _, _ = W.at(a, MZ['P'] - 1.5)
            hang(id, X, y0 - (1.2 if frm != 'edge' else 0.), y1, kind, w=w, inset=MZ['P'] - 1.5, frm=frm, anch=round(MZ['bot'], 2), **kw); out[-1]['on'] = mz(a)['id']; return out[-1]
        for k, (X, kind, ln, w) in enumerate(((1426., 'pearls', 20, 11), (1587., 'tradescantia', 46, 11), (1466., 'wisteria', 14, 11), (1480., 'hoya', 16, 11))):
            under(f'dc_mzv{k}', X, kind, w, ln, seed=41 + k)
        KK = []
        for k, (X, ln, kind, pot) in enumerate(((1495., 25., 'asplenium', 'koke-pink'), (1508., 33., 'peperomia', 'koke-gold'), (1523., 30., 'fittonia', 'koke-cyan'))):
            KK.append(under(f'dc_kk{k}', X, kind, 8.6, ln, frm='string', seed=131 + k, pot=pot_of(pot, 6., 6.)))
        hangR = under('dc_hangR', 1545., 'pothos', 20., 52., frm='hook', seed=7, pot=pot_of('macrame', 7, 7))
        under('dc_hp3', 1567., 'columnea', 10., 44., frm='ring', seed=171, pot=dict(shape='ring', mat='chrome', band='pink', name='ring-neon', pw=5.5, ph=4))
        # ---------- (· 5) СВІТЛО Й ПОВІТРЯ: конуси світла з точкових світильників на споді антресолі (кожні 23 од. уздовж фасаду, за
        # 4.6 од. від краю — як у objects/dc_paint.js) — униз, поки не дійдуть до поля над зонами (живе: objects/decor_live.js)
        cones = []
        for sg_ in segs:
            d = sg_['dc']; sa, sb = d['sa'], d['sb']; Lf = chord(W, sa, sb, MZ['P']); s0 = d['s0']
            for k in range(math.ceil((s0 - 5.75) / 23.), math.ceil((s0 + Lf - 5.75) / 23.)):
                u = (23. * k + 5.75 - s0) / Lf; v = 4.6 / (MZ['P'] - .3)
                (f0, _, _), (f1, _, _), (w0, _, _) = W.at(sa, MZ['P']), W.at(sb, MZ['P']), W.at(sa, .3)
                x = f0[0] + u * (f1[0] - f0[0]) + v * (w0[0] - f0[0]); z = f0[1] + u * (f1[1] - f0[1]) + v * (w0[1] - f0[1])
                sx, sy = VX + (x - VX) * s(z), ys(MZ['bot'], z); hw = 6. * s(z)
                if sy < 3 or sx > 1598: continue
                yb = min(free_y(X) for X in (sx - hw, sx - hw / 2, sx, sx + hw / 2, sx + hw)) - 5.   # світло згасає ще до поля (живе сяйво зон — вище за їхні грані)
                if yb - sy >= 6: cones.append([round(x, 2), MZ['bot'], round(z, 2), round(Yw(yb, z), 2)])
        segs[0]['dc']['cones'] = cones
        # ---------- (· 3) ОБ'ЄМ: тіні на стіні й світло
        wshadow(rud, dy=3.)
        for o in [hangR] + KK: wshadow(o, dy=5., rnd=1, top=.3 if o is hangR else .55)
    else:
        # ---------- Л1. Над AI-центром: СОТИ-ПОЛИЦІ (кіберпанк: шестикутні комірки з неоновим кантом, кожна свого кольору й
        # візерунка дна) — у кожній своя річ; і неонова вивіска «Nexi з паростком» (без слів)
        HX = dict(w=21., d=13., a0=88.6, cols=6)                                        # глибші комірки (Декор стін · 3: більше об'єму)
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
            da_ = math.degrees(HX['w'] * .4 / R)
            cid = f'dc_hx{q}'; add(item(W, cid, a, HX['d'], HX['w'], Yc + h / 2, Yc - h / 2, 'dc_hex', inset=.6, dc=dict(neon=NEONS[q % len(NEONS)], pat=q, w=HX['w'], h=round(h, 2), shy=shy(a - da_, a + da_, .2))))
            sup = dict(Y=Yc + h / 2 - 1.6, id=cid); kind = ITEMS[q]
            if kind[0] == 'plant':
                hh = h - 3.5; plant_on(sup, f'dc_hxp{q}', a, kind[1], HX['w'] * .5, hh, kind[2], 6., 4, HX['d'] - 3.8, seed=80 + q)   # ближче до краю соти: знизу видно
            else: art_on(sup, f'dc_hxa{q}', a, kind[1], HX['w'] * .5, h - 4, 6., HX['d'] - 3.2, seed=q)
        flat('dc_neon', 94., 180., 14., 66., 'neon', d=3.2, glow=1, gr=40)          # неон: Nexi з паростком (без слів; стиль neon — рожевий кант і рожеве світло на стіну)
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
            d = sg['dc']; d['tot'] = round(tot, 2); sa, sb = d['sa'], d['sb']; wc = chord(W, sa, sb, RF['P'] + .1); d['shy'] = shy(sa, sb)
            add(item(W, sg['id'].replace('dc_rf', 'dc_rfg'), (sa + sb) / 2, .3, wc + .9, RF['bot'], RF['top'], 'dc_win', inset=RF['P'] + .1 - .3, on=sg['id'],
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
        flat('dc_poster0', 447., 501., 10., 88., 'dc_poster', d=2.4)
        neon, poster = [it for it in out if it['id'] == 'dc_neon'][0], out[-1]
        # ---------- (· 3) Л5. ВИСЯЧИЙ КОШИК між неоном і рифом: нефролепіс каскадом, кошик на трьох ланцюжках зі стелі
        hang('dc_basket', 201., 1.5, 73.5, 'bostonfern', w=33., inset=11., seed=101, frm='chain', pot=pot_of('basket', 9.5, 6.))
        basket = out[-1]
        # ---------- (· 3) Л6. ДВА КОРИТА під неоновою вивіскою: зі стіни звисають діхондра «срібний водоспад» і мюленбекія
        for k, (X0, X1, kind) in enumerate(((103., 137., 'dichondra'), (142., 176., 'muehlenbeckia'))):
            a0, a1 = W.a_of(X0, 3.), W.a_of(X1, 3.); am = (a0 + a1) / 2; (x, z), _, _ = W.at(am, 3.)
            top = max(Yw(ys(neon['yb'], z) + 2.5, z), neon['yb'] + 2.); bot = min(Yw(free_y(X) - 1.5, z) for X in (X0, (X0 + X1) / 2, X1))
            add(item(W, f'dc_tr{k}', am, 5.5, chord(W, a0, a1, 3.), bot, top, 'dc_trough', inset=.4, dc=dict(kind=kind, seed=151 + k, th=3.2, pot=dict(shape='trough', mat='steel', band=['lil', 'green'][k], name='trough-' + ['lil', 'green'][k]))))
        TR = out[-2:]
        # ---------- (· 3) Л7. ВИТКІ НА ЦЕГЛІ: дикий виноград угору між аналітикою й медузарієм, пасифлора — між медузарієм і плакатом
        climb('dc_cl0', 380., 390., 4., 209., 'bivy', 111)                       # (· 15) удвічі ширші — пишніші (власник: «рослини в три рази крутіше»)
        climb('dc_cl1', 426.5, 446.5, 4., 104., 'passiflora', 112)
        # ---------- (· 3) Л8. НА КРИШЦІ РИФУ (дальній край, де над ним є місце): спатифілум і сингоніум
        for k, (X, kind, pot) in enumerate(((326., 'spathiphyllum', 'enamel'), (350., 'syngonium', 'terra'))):
            a = W.a_of(X, RF['P'] * .5); (x, z), _, _ = W.at(a, RF['P'] * .5); Y0 = RF['top'] - RF['lid']; h = min(17., Y0 - Yw(3., z))
            seg = min(segs, key=lambda sg: abs((sg['dc']['sa'] + sg['dc']['sb']) / 2 - a))
            add(item(W, f'dc_rfp{k}', a, 7.2, 16., Y0, Y0 - h, 'dc_pot', inset=RF['P'] * .5 - 3.6, on=seg['id'], dc=dict(kind=kind, pot=pot_of(pot, 6., 4.), seed=161 + k)))
        # ---------- (· 4) ВИСЯЧІ У ПРОМІЖКАХ (труби під стелею прибрано — власник: «смужки зверху не потрібні»): кожна рослина —
        # на своєму кріпленні: скляна куля на дроті зі стелі, мідний конус-кишеня на цеглі, керамічний «місяць» на стіні
        hang('dc_hp0', 88.6, 1.5, 56., 'bananas', w=9.6, inset=4.6, seed=191, frm='orb', pot=dict(shape='orb-glass', mat='glass', band='cyan', name='orb-glass', pw=8.2, ph=8.2))
        hang('dc_hp1', 371.5, 4., 92., 'adansonii', w=15., inset=5.2, seed=192, frm='cone', pot=dict(shape='cone', mat='copper', band='gold', name='cone-copper', pw=9., ph=10.))
        hang('dc_hp2', 292., 2.5, 18., 'dolphins', w=16., inset=4.6, seed=193, frm='moon', pot=dict(shape='moon', mat='ceram', band='pink', name='moon-ceram', pw=10.5, ph=5.2))
        a0, a1 = W.a_of(450., 3.), W.a_of(498., 3.); am = (a0 + a1) / 2; (x, z), _, _ = W.at(am, 3.)
        top = max(Yw(ys(poster['yb'], z) + 2.5, z), poster['yb'] + 2.); bot = min(Yw(free_y(X) - 1.5, z) for X in (450., 474., 498.))
        add(item(W, 'dc_tr2', am, 5., chord(W, a0, a1, 3.), bot, top, 'dc_trough', inset=.9, dc=dict(kind='lysimachia', seed=153, th=3., pot=dict(shape='trough', mat='steel', band='gold', name='trough-gold'))))
        TR.append(out[-1])
        # ---------- (· 5) ПОВЕРНУЛИСЯ: МОХОВИЙ КОРЧ-ПОЛИЦЯ під сотами — сріблястий корч уздовж стіни на двох латунних кронштейнах
        # (мох, лишайник; по ньому повзе равлик — objects/decor_live.js); по корчу — даваллія «заяча лапка» (пухнасті кореневища-
        # «лапки» й мереживні вайї там, де над корчем є місце); ВЕНЕРИНА МУХОЛОВКА в нефритовій чаші під скляною кулею з бананами
        # (ловить муху — objects/decor_live.js); ПЛАТИЦЕРІУМ на дубовій дошці — під висячим кошиком. Корч — сегментами по дузі
        # (як антресоль і риф): межі кожного на екрані тісні, тож під сотами вистачає місця
        DX0, DX1, DI, dr, NS = 41., 98., 2.8, 1.62, 6
        da0, da1 = W.a_of(DX0, DI), W.a_of(DX1, DI)
        dlow = min(Yw(free_y(X) - 1., W.at(W.a_of(X, DI), DI)[0][1]) for X in [DX0 - 2 + q * 2 for q in range(int((DX1 - DX0) / 2) + 3)])
        dYc = round(dlow - dr - .75, 2)                                                   # .75 — лишайник звисає
        def roof(X0, X1):
            """найнижчий край речей (екран) над стовпчиками X0..X1 — щоб рослина під ними їх не торкалась"""
            lo = -99.
            for it in out:
                if it['st'] in ONWALL or it['id'].startswith(INVIS) or it['st'] == 'dc_drift': continue
                P = hull(screen_poly(it)); n = len(P)
                if min(p[1] for p in P) > ys(dYc, W.at(da0, DI)[0][1]) - 2: continue
                for q in range(n):
                    (xa, ya), (xb, yb) = P[q], P[(q + 1) % n]
                    if X0 <= xa <= X1: lo = max(lo, ya)
                    for Xc in (X0, X1):
                        if (xa - Xc) * (xb - Xc) < 0: lo = max(lo, ya + (yb - ya) * (Xc - xa) / (xb - xa))
            return lo
        dsegs = []; acc = 0.
        for i in range(NS):
            sa = da0 + (da1 - da0) * i / NS; sb = sa + (da1 - da0) / NS; am = (sa + sb) / 2; w = chord(W, sa, sb, DI) + .3
            Xa, Xb = sorted((W.X(sa, DI + dr), W.X(sb, DI + dr))); (x, z), _, _ = W.at(am, DI + dr + .3)
            ytop = dYc - dr - .5                                                           # мох угорі
            fr = 0.
            if Xb < 76.:                                                                  # даваллія — ліва частина корча (права — мухоловка)
                lim = Yw(roof(Xa - 1.5, Xb + 1.5) + 1.6, z); fr = round(max(0., min(4.6, ytop - lim)), 2)
            seg = dict(i=i, n=NS, sa=round(sa, 4), sb=round(sb, 4), s0=round(acc, 2), C=[round(C[0], 2), round(C[1], 2)], R=R, sgn=sgn, DI=DI, dr=dr, Yc=dYc, fr=fr, seed=77)
            if i == 0: seg['plant'] = 'davallia'
            it = item(W, f'dc_drift{i}', am, 2 * dr + .5, w, round(dYc + dr + .75, 2), round(ytop - fr, 2), 'dc_drift', inset=round(DI - dr - .25, 2), dc=seg)
            add(it); dsegs.append(it); acc += chord(W, sa, sb, DI)
        for it in dsegs: it['dc']['tot'] = round(acc, 2)
        X = 91.4; a = W.a_of(X, DI); (x, z), _, _ = W.at(a, DI + 2.6); w = 13. / s(z)
        sg_ = min(dsegs, key=lambda q: abs((q['dc']['sa'] + q['dc']['sb']) / 2 - a)); sup = dict(Y=round(dYc - dr * .78, 2), id=sg_['id'])
        h = min(16., sup['Y'] - Yw(roof(X - 7.5, X + 7.5) + 1.6, z))
        plant_on(sup, 'dc_drp0', a, 'flytrap', round(w, 2), round(h, 2), 'jade', 3.6, 2.6, DI, seed=5)
        stag = flatw('dc_stag', 181., 200., 77.4, min(free_y(X) for X in (181., 190.5, 200.)) - 1.2, 'dc_art', 5.6, d=5., dc=dict(kind='staghorn', plant='staghorn', seed=141))
        wshadow(stag, dy=2., k=.38)
        # ---------- (· 3) ОБ'ЄМ: тіні на стіні й кольорове світло акваріумів і сот
        wshadow(neon, dy=3.); wshadow(poster, dy=3.); wshadow(basket, dy=5., rnd=1, top=.2)
        for o in TR: wshadow(o, dy=3., k=.3, top=0.)
        for o in [it for it in out if it['id'] in ('dc_hp0', 'dc_hp1')]: wshadow(o, dy=4., k=.26, top=.1)
        light('dc_lt_reef', 292., 46., 'clamp', 50, inset=7.)
        light('dc_lt_jelly', 406., 120., 'neon', 48, inset=CL['r'] + CL['gap'])
        light('dc_lt_hex', 30., 40., 'neon', 30, inset=7.)
    # ---------- (· 4) ЖИВІ РОСЛИНИ (власник: «рослини пишніші й живіші»): що гойдається (dc.sway — objects/dc_paint.js не кладе
    # цю частину в растр, objects/decor.js малює її щокадру): висячі — від кріплення, звиси з антресолі, корита, рослини на
    # антресолі — лише НАД поруччям (поруччя попереду; межа — висота поручня на екрані в їхніх межах), кокедами, аквапоніка
    hh = lambda k, q: ((k * 7919 + q * 104729) % 1000) / 1000.
    rail_pts = []
    if sgn > 0:
        for q in range(161):
            a = MZ['a0'] + (MZ['a1'] - MZ['a0']) * q / 160; (x, z), _, _ = W.at(a, MZ['P'] - .9); rail_pts.append((VX + (x - VX) * s(z), ys(MZ['top'] - MZ['rail'] - .9, z)))
    for n_, it in enumerate(out):
        d = it.get('dc') or {}; st = it['st']; per = round(3.6 + 1.8 * hh(n_, 3), 2)
        if st == 'dc_hang': d['sway'] = dict(amp=round(max(.8, min(2.6 if it['id'] != 'dc_epi' else .9, (it['yb'] - it['yt']) * .045)), 2), per=per)
        elif st == 'dc_spill': d['sway'] = dict(amp=.8, per=per)
        elif st == 'dc_trough': d['sway'] = dict(amp=1., per=per)
        elif st == 'dc_pot' and str(it.get('on', '')).startswith('dc_mz') and rail_pts:
            P = hull(screen_poly(it)); x0, x1 = min(p[0] for p in P) - 2, max(p[0] for p in P) + 2
            yc = min([y for X, y in rail_pts if x0 <= X <= x1] or [999.]) - .6
            f = (-math.sin(math.radians(it['turn'])), -math.cos(math.radians(it['turn']))); zc = it['z'] - f[1] * it['dep'] / 2
            cut = Yw(yc, zc)
            if cut - it['yt'] > 3: d['sway'] = dict(cut=round(cut, 2), amp=round(min(1.6, (cut - it['yt']) * .05), 2), per=round(per + 1, 2))
        elif st == 'dc_pot' and str(it.get('on', '')).startswith('dc_rf'): d['sway'] = dict(amp=.45, per=per)
        elif st == 'dc_pot' and str(it.get('on', '')).startswith('dc_drift'): d['sway'] = dict(amp=.5, per=per)
    # (· 5) ПИЛ І ПИЛОК у повітрі біля стін: прямокутники екрана над зонами (з полем) — порошинки живуть у них (objects/decor_live.js)
    air = []; XA, XB = (1190., 1598.) if sgn > 0 else (-60., 500.)
    X = XA
    while X < XB - 8:
        X1 = min(XB, X + 34.); y1 = min(free_y(q) for q in [X - 7 + 2 * k for k in range(int((X1 - X + 14) / 2) + 1)]) - 4.   # з запасом на дрейф (±3) і сусідні стовпчики
        if y1 - 4. >= 10: air.append([round(X, 1), round(X1, 1), 4., round(min(y1, 120.), 1)])
        X = X1
    if out: (out[0].setdefault('dc', {}))['air'] = air
    if verbose: report(L, out, 'right' if sgn > 0 else 'left')
    return out


# ===================================== ПЕРЕВІРКА: НЕ ЗАХОДИТЬ НА ЗОНИ (екран) =====================================
BILLBOARD = ('dc_pot', 'dc_hang', 'dc_art', 'dc_lantern')                              # dc_art на стіні (платицеріум) — теж прямокутник                              # рослини й штучки — спрайт / дрібні форми лицем до глядача
def screen_poly(it):
    """межі предмета на екрані: рослини й штучки — прямокутник «лицем до глядача» (ширина w, як спрайт рушія), решта — усі 8
    кутів коробки (на дузі біля 90° глибина коробки лягає на екрані вшир, а ширина — углиб: так точніше)"""
    f, r, P = frame(it); w = it['w'] / 2
    if it['st'] in BILLBOARD:
        c = P(0, it['dep'] / 2, 0); x0 = c[0] - w; x1 = c[0] + w; z = c[2]
        return [P3(x, y, z) for x in (x0, x1) for y in (it['yb'], it['yt'])] + [P3(*P(u, v, it['yb'])) for u in (-w * .4, w * .4) for v in (0, it['dep'])]
    return [P3(*P(u, v, y)) for u in (-w, w) for v in (0, it['dep']) for y in (it['yb'], it['yt'])]
def zone_mask(L, S=2, X0=-90, Y0=-20, X1=1630, Y1=500, arm=True):
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
    if L.get('armRig') and arm:                                                     # маніпулятор майстерні: рухається (скан / встановлення) — з запасом (arm=False: для
                                                                                    # декору, що навмисно ЗА ним — акваріум хижаків · 10, власник: «палка зі скінів — попереду»)
        P = [P3(*p) for p in L['armRig']['pts']]; xs = [p[0] for p in P]; yy = [p[1] for p in P]
        d.rectangle([T((min(xs) - 14, min(yy) - 22)), T((max(xs) + 16, max(yy) + 14))], fill=255)
    if 'tlBeacon' in A:                                                             # маячок інструментів: лампа з ядром спалаху (r 14); решта сяйва й промені — світло поверх декору
        x, y = P3(*A["tlBeacon"]); d.ellipse([T((x - 14, y - 14)), T((x + 14, y + 14))], fill=255)
        # (· 8) Далі ореол спалаху (до r ≈ 36) і промені (вліво-вправо на ~60 од., tools.js: beam) — це світло, що лягає поверх
        # декору (малюється після растра крил, 'lighter'): по склу акваріума воно ковзає як промінь — не заважає (власник
        # 03.11: «акваріум утричі більший — місця достатньо»). decor_check.js так само не рахує слабке світло маячка за зону.
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
    im, (X0, Y0, S) = zone_mask(L); grow = im.filter(ImageFilter.MaxFilter(2 * int(margin * S) + 1)); pxA = grow.load(); W, H = grow.size
    im2, _ = zone_mask(L, arm=False); pxN = im2.filter(ImageFilter.MaxFilter(2 * int(margin * S) + 1)).load()
    bad = []
    for it in items:
        if it['id'].startswith(INVIS): continue
        px = pxN if it.get('dc', {}).get('noarm') else pxA                           # (· 10) за маніпулятором — можна (він попереду)
        P = hull(screen_poly(it)); xs = [p[0] for p in P]; yy = [p[1] for p in P]
        x0, x1, y0, y1 = min(xs), max(xs), min(yy), max(yy); hit = 0
        pm = Image.new('L', (W, H), 0); ImageDraw.Draw(pm).polygon([((p[0] - X0) * S, (p[1] - Y0) * S) for p in P], fill=255); pq = pm.load()
        for j in range(max(0, int((y0 - Y0) * S)), min(H, int((y1 - Y0) * S) + 1)):
            for i in range(max(0, int((x0 - X0) * S)), min(W, int((x1 - X0) * S) + 1)):
                if px[i, j] and pq[i, j]: hit += 1
        if hit: bad.append((it['id'], hit, [round(x0), round(x1), round(y0), round(y1)]))
        if y0 < 1 and not it['id'].startswith(INCEIL): bad.append((it['id'], 'CEIL', round(y0, 1)))
    return bad
SUPPORTS = ('dc_mz', 'dc_reef', 'dc_farm', 'dc_hex', 'dc_column', 'dc_drift')                                   # опори-смуги: сегменти / соти однієї групи
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
        if it['id'].startswith(INVIS) or it['st'] in ONWALL: continue
        h = hull(screen_poly(it)); xs = [p[0] for p in h]; yy = [p[1] for p in h]; P[it['id']] = (h, min(xs), max(xs), min(yy), max(yy))
    def mask(i, x0, y0, W, H):
        m = Image.new('L', (W, H), 0); ImageDraw.Draw(m).polygon([((x - x0) * S, (y - y0) * S) for x, y in P[i][0]], fill=255); return np.asarray(m) > 0
    bad = []; ids = list(P)
    for a in range(len(ids)):
        for b in range(a + 1, len(ids)):
            A, B = by[ids[a]], by[ids[b]]; pa, pb = P[ids[a]], P[ids[b]]
            if pa[2] < pb[1] or pb[2] < pa[1] or pa[4] < pb[3] or pb[4] < pa[3]: continue
            if A.get('on') == B['id'] or B.get('on') == A['id']: continue                 # стоїть на ній / звисає з неї
            if 'dc_win' in (A['st'], B['st']) and A.get('on') and A.get('on') == B.get('on'): continue   # скло опори й те, що на тій самій опорі
            ga, gb = group_key(A, by), group_key(B, by); same = ga == gb
            if same and (A['st'] in SUPPORTS or B['st'] in SUPPORTS): continue            # опора й річ своєї групи, сусідні сегменти / соти
            if same and 'dc_spill' in (A['st'], B['st']): continue                         # звиси — на фасаді, нижче поруччя: рослин за ним не закривають
            if (ga, gb) in JOIN or (gb, ga) in JOIN: continue                                # з'єднані частини однієї споруди (пілон — антресоль — акватруба)
            x0, y0 = min(pa[1], pb[1]), min(pa[3], pb[3]); W, H = int((max(pa[2], pb[2]) - x0) * S) + 2, int((max(pa[4], pb[4]) - y0) * S) + 2
            ma, mb = mask(ids[a], x0, y0, W, H), mask(ids[b], x0, y0, W, H); inter = int((ma & mb).sum()); mn = max(1, min(int(ma.sum()), int(mb.sum())))
            if (not same and inter > 0) or (same and inter / mn > frac): bad.append((ids[a], ids[b], round(inter / mn, 2)))
    return bad
def check_unique(items):
    """УНІКАЛЬНІСТЬ: вид рослини, дизайн вазона, штучка, сота — кожне один раз"""
    seen, dup = {}, []
    for it in items:
        d = it.get('dc') or {}; keys = []
        if it['st'] in ('dc_pot', 'dc_hang', 'dc_climb', 'dc_spill', 'dc_trough'): keys.append('рослина:' + d.get('kind', '?'))
        if d.get('plant'): keys.append('рослина:' + d['plant'])
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
GROUPS = [('dc_pylon', 'П0 ПІЛОН'), ('dc_door', 'П0'), ('dc_pyg', 'П0'), ('dc_mz', 'П1 АНТРЕСОЛЬ (2-й поверх)'), ('dc_lantern', 'П1'), ('dc_green', 'П1'), ('dc_fm', 'П2 ВЕРТИКАЛЬНА ФЕРМА NEXI'),
          ('dc_poster1', 'П3 ПЛАКАТ РУДИКА'), ('dc_hangR', 'П4 ВИСЯЧИЙ САД'), ('dc_kk', 'П4'),
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
    both = []
    for name, sgn in (('right', 1), ('left', -1)):
        Ls = LAY[name]; Ls['items'] = [it for it in Ls['items'] if it.get('layer') != 'up']
        up = decor_side(Ls, sgn, Ls['C'], Ls['R']); Ls['items'] = Ls['items'] + up; both += up
    du = check_unique(both); print('  UNIQUE (обидві стіни разом):', 'повтори ' + str(du) if du else 'none')
    if a.plan:
        cfg = open(os.path.join(REPO, 'js', 'core', 'config.js'), encoding='utf8').read(); sy = float(re.search(r'SOFA_Y:\s*([\d.]+)', cfg).group(1))
        zf = D * (FL - 220) / (sy - 220) - D; sk = (lambda v: 1.45 + 1.25 * max(0, min(1, (v - 352) / 330)))(sy) / (1.45 + 1.25 * max(0, min(1, (362 - 352) / 330))); sw = 234 * sk / s(zf)
        plan_png(LAY, a.plan, sofa=(VX - sw / 2, VX + sw / 2, zf, zf + 45)); print('план:', a.plan)
    if a.write:
        new = src[:m.start(1)] + json.dumps(LAY, separators=(',', ':'), ensure_ascii=False) + src[m.end(1):]
        open(p, 'w', encoding='utf8').write(new); print('записано в', os.path.relpath(p, REPO))
