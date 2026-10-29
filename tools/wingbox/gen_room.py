# tools/wingbox/gen_room.py — РОЗКЛАДКА ОБОХ КРИЛ «по дузі» для js/objects/arc_layout.js (її малює 3D objects/arc_scene.js)
# ----------------------------------------------------------------------------------------------------
# Кімната зверху — пів кола: вікно в найдальшій точці (z = 185), обабіч — коротка пряма стіна до xf, далі стіна
# загинається дугою (центр C, радіус R) до глядача. Стіни дзеркальні відносно центру вікна x = 774.
# ЧИСТА ОСНОВА (власник, 29.10): зони додаються ПО ЧЕРЗІ, по кроку (docs/HANDOFF.md):
#   "n" у крила — скільки зон ланцюжка будувати (0..3): праворуч майстерня -> інструменти -> портал, ліворуч маркетинг ->
#   аналітика -> AI-центр (від вікна до глядача); "H" — висоти головних частин зон на екрані (px), по позиціях
#   [дальня, середня, найближча] або одне число для всіх (власник: перші — найбільші, далі на ~25 % менші: [h, .75h, .56h]).
#   Крок 1 (29.10) — перші зони: майстерня й маркетинг (n 1). "zones" у крила — які заготовки брати (за замовчуванням нові).
#   Решта (екран на стіні "hub", антресоль "mz", колони "cols", настінні полиці "shelves", підвіси "hang") — так само за
#   параметрами, коли знадобляться.
#   Попередня спроба (28.10: усі 6 зон однакові, H 173) — PRESETS['v1'] (--preset v1), щоб було з чого брати й з чим порівнювати.
# Зони — ЛАНЦЮЖКОМ уздовж стіни: дальня біля вікна — прямо, спиною до стіни з вікном, її край біля дивану (far_items, X_in);
# середня й найближча — спиною до дуги й лицем до її центру, кожна впритул до попередньої (chain: gz од. у плані, gs px на
# екрані), нічого не заходить одне на одне. Масштаб кожної зони підбирається під її висоту H (fit_far / fit_chain).
# Кожна зона зібрана з частин картинки-концепту assets/room.webp: X, Y — прямокутник частини на картинці (пікселі
# кімнати), v — наскільки частина відступає вглиб від передньої лінії зони, d — її глибина. Частини переносяться в 3D
# зони: m — од. світу на піксель картинки (однаковий по ширині й висоті).
# Перспектива — як у кімнаті (core/persp.js): VP (774, 220), D 520, око (774, 220, -520); підлога y = 372.
# Межі вікна беруться з js/core/config.js (NX.cfg.WIN) — стіни крил починаються від відкосів.
#
#   python3 tools/wingbox/gen_room.py [out.json] [--params p.json | --preset v1] [--plan plan.png] [--write]
#     --write — вшити розкладку в js/objects/arc_layout.js;   --plan — план зверху (PNG)
#   Перевірки друкуються: висоти зон, проміжки (SEP), перетини об'ємів (INTERSECT), що за стіною (BEHIND WALL) — мають бути none.
#   На плані диван — там, де він у кімнаті (NX.cfg.SOFA_Y: лінія підлоги на екрані -> глибина в кімнаті).
import json, math, os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__)); REPO = os.path.normpath(os.path.join(HERE, '..', '..'))
sys.path.insert(0, HERE)
from plan import P3, faces, footprint, sep, catmull
FL = 372; D = 520; JZ = 185                                                        # підлога, відстань до екрана, глибина стіни з вікном
def _win():
    m = re.search(r'WIN:\s*\{\s*L:\s*([\d.]+),\s*R:\s*([\d.]+)', open(os.path.join(REPO, 'js', 'core', 'config.js'), encoding='utf8').read())
    return float(m.group(1)), float(m.group(2))
WL, WR = _win()                                                                     # зовнішні краї відкосів на екрані
SOFA_Y = float(re.search(r'SOFA_Y:\s*([\d.]+)', open(os.path.join(REPO, 'js', 'core', 'config.js'), encoding='utf8').read()).group(1))   # диван (лінія підлоги на екрані)
def sofa_k(y):                                                                      # масштаб дивану — як у персонажів (NX.room.scaleAt)
    sc = lambda v: 1.45 + 1.25 * max(0, min(1, (v - 352) / 330)); return sc(y) / sc(362)
JAMB_L, JAMB_R = 774 + (WL - 774) * (D + JZ) / D, 774 + (WR - 774) * (D + JZ) / D  # ті самі краї у світі (на глибині JZ)
SHELF_Y = (34, 69, 123, 183, 226, 258)                                              # дошки стелажа AI-центру (y на картинці)
def s(z): return D / (D + z)

def F(x0, x1, y0, y1, X0, X1, Y0, Y1):
    return [round((x0 - X0) / (X1 - X0), 4), round((x1 - X0) / (X1 - X0), 4), round((y0 - Y0) / (Y1 - Y0), 4), round((y1 - Y0) / (Y1 - Y0), 4)]
def FP(x, y, X0, X1, Y0, Y1): return [round((x - X0) / (X1 - X0), 4), round((y - Y0) / (Y1 - Y0), 4)]

class Zone:
    def __init__(self, name, Xref, Yfloor, main):
        self.name, self.Xref, self.Yfloor, self.main, self.comps = name, Xref, Yfloor, main, []
        self.arm = None; self.armv = 0; self.m = 1.
    def add(self, id, X0, X1, Y0, Y1, v, d, st, **kw):
        self.comps.append(dict(id=id, X=(X0, X1), Y=(Y0, Y1), v=v, d=d, st=st, **kw)); return (X0, X1, Y0, Y1)
    def plant(self, id, X0, X1, Y0, Y1, v, d, fw, fh, st='pot', **kw):
        return self.add(id, X0, X1, Y0, Y1, v, d, st, plant=1, fw=fw, fh=fh, cyl=kw.pop('cyl', 10), **kw)

NEON_C, NEON_P = '#3be8ff', '#ff4fd8'
def sign(Z, id, X0, X1, Y0, Y1, v, d, key, line, st='dark', icon=True, **kw):
    r = (X0, X1, Y0, Y1); h = Y1 - Y0
    deco = [dict(t='r', f=[0, 1, 0, 1], fill='#0a0620', line=line, lw=1.2)]
    if icon: deco.append(dict(t='c', f=[(h * .55) / (X1 - X0), .5, (h * .26) / (X1 - X0)], line='#7af4ff', lw=1.1))
    deco.append(dict(t='txt', f=[(h * 1.05 if icon else 4) / (X1 - X0), .97, .16, .86], key=key, col='#7af4ff'))
    return Z.add(id, *r, v, d, st, deco=deco, **kw)

# ===================================== ЗОНИ (попередня спроба, 28.10): ЛИШЕ СТОЛИ Й ЕКРАНИ =====================================
# Тоді власник: «малюй поки тільки столи та екрани, без елементів; усі 6 зон — однакові за розміром, кожна — як та, що навпроти
# (AI-центр = портал, аналітика = інструменти, маркетинг = майстерня)». Будова однакова (стіл ≈ чверть висоти, над ним екран /
# будка / дошка), масштаб зони підбирається під висоту головних частин на екрані H (fit_far / fit_chain).
# 29.10 власник почав з нуля (лише стіни): ці зони — заготовки; нові вимоги (перші — найбільші й найвищі, наступні на ~25%
# менші; екрани — по центру столів; майстерня — як на картинці: більша, масивніша, ближча) — docs/HANDOFF.md.
DESK_H, DESK_D = 56, 50
MS_WS, MS_PT = 1.12, .95
KB_AN, KB_MK = 1.3, 1.4                                                            # будки аналітики й маркетингу більші — стіл ≈ чверть висоти, як в AI-центрі
def zscale(Z, desk_top):
    """початковий масштаб зони (од. світу на піксель картинки): стіл (верх — на desk_top) заввишки DESK_H -> глибина стола в px"""
    Z.m = DESK_H / (Z.Yfloor - desk_top); return DESK_D / Z.m
def grow(r, k, cx, fy):
    """прямокутник частини картинки (X0, X1, Y0, Y1), збільшений у k разів від точки (cx, fy) — низ-середина будки"""
    return (round(cx + (r[0] - cx) * k, 2), round(cx + (r[1] - cx) * k, 2), round(fy - (fy - r[2]) * k, 2), round(fy - (fy - r[3]) * k, 2))
def drawers(de, xs, ys=(304, 318)):
    """оздоби фасаду стола: неоновий кант угорі + блоки шухляд (xs — [(X0, X1)] на картинці), ys — шви між шухлядами"""
    out = [dict(t='l', f=[0, .04, 1, .04], col=NEON_P, lw=1.2)]
    for a, b in xs:
        out.append(dict(t='r', f=F(a, b, de[2] + 10, de[3] - 4, *de), fill='#1a1238', line='#6a4ab0'))
        out += [dict(t='l', f=[*FP(a, y, *de), *FP(b, y, *de)], col='#6a4ab0') for y in ys]
    return out

# ===================================== КРОК 1 (29.10): ПЕРШІ ЗОНИ — МАЙСТЕРНЯ Й МАРКЕТИНГ =====================================
# Власник: «перші зони мають бути більшими та вищими — до верху ще багато місця; екрани основні — по центру столів; майстерню
# змалюй з оригінального зображення — більшою, масивнішою, ближчою, як на картинці; спершу лише столи й екрани».
# Координати — пікселі картинки кімнати (assets/room.webp, 1 = 1 од. кімнати), заміряні з оригіналу; масштаб зони підбирає
# fit_far під висоту H головних частин на екрані. Усе симетричне — дзеркально відносно середини зони (Xref).
FRAME_STY = dict(bev=1.6, ins=3.8, nIn=1.4, nW=1.0)                                # px картинки (place переводить в од. світу)
def mirror(Z, id_, X0, X1, *a, **kw):
    """частина й її дзеркальна пара відносно Xref зони: id_ + 'L' / 'R' (оздоби лиця, ch і on — дзеркально)"""
    def flip(d):
        d = json.loads(json.dumps(d))
        for e in d:
            f = e.get('f')
            if e['t'] in ('r', 'ch', 'grid', 'bars', 'txt'): e['f'] = [round(1 - f[1], 4), round(1 - f[0], 4), f[2], f[3]]
            elif e['t'] == 'l': e['f'] = [round(1 - f[0], 4), f[1], round(1 - f[2], 4), f[3]]
            elif e['t'] == 'c': e['f'] = [round(1 - f[0], 4), f[1], f[2]]
        return d
    kl = dict(kw); kr = dict(kw)
    if 'deco' in kw: kr['deco'] = flip(kw['deco'])
    if 'ch' in kw: kr['ch'] = (kw['ch'][1], kw['ch'][0])
    if isinstance(kw.get('on'), str) and kw['on'].endswith('*'): kl['on'] = kw['on'][:-1] + 'L'; kr['on'] = kw['on'][:-1] + 'R'
    Z.add(id_ + 'L', X0, X1, *a, **kl); Z.add(id_ + 'R', round(2 * Z.Xref - X1, 2), round(2 * Z.Xref - X0, 2), *a, **kr)

def workshop():
    """МАЙСТЕРНЯ — як на оригінальній картинці, але більша й масивніша: широка глибока платформа з помаранчевою щілиною,
    на ній подіум; капсула-сканер — товсті стійки, балка зі зрізаними кутами й вивіскою, рожеве скло сканера (перед ним
    стоятиме Nexi); бічні панелі-«крила»; планшети скінів на ніжках обабіч (перед стійками); на балці — купол із
    кріпленням робота-маніпулятора: рука аркою йде праворуч і вниз (як на картинці). Ближча до глядача — far.front."""
    Z = Zone('workshop', 1005, 358, ('ws_base', 'ws_beam', 'ws_postL')); Z.m = 1.4
    FS = dict(sty=FRAME_STY)                                                         # великі частини — товщі фаска, шов і неоновий кант
    Z.add('ws_base', 900, 1110, 330, 358, 0, 70, 'base', deco=[dict(t='l', f=[0, .05, 1, .05], col=NEON_P, lw=1.3)])   # фасад — arc_paint.js: ws_base
    Z.add('ws_dais', 922, 1088, 320, 330, 7, 56, 'base', on='ws_base', deco=[dict(t='l', f=[.02, .34, .98, .34], col=NEON_C, lw=1.1)])
    mirror(Z, 'ws_wing', 900, 922, 226, 330, 15, 46, 'frame', ch=(9, 0), on='ws_base', **FS,
           deco=[dict(t='l', f=[.36, .1, .36, .92], col=NEON_P, lw=1.3), dict(t='r', f=[.56, .86, .16, .34], fill='#0a0620', line=NEON_C)])
    mirror(Z, 'ws_post', 922, 956, 210, 320, 11, 49, 'frame', on='ws_dais', **FS,
           deco=[dict(t='l', f=[.8, .07, .8, .93], col=NEON_C, lw=1.5), dict(t='r', f=[.18, .58, .62, .7], fill='#0a0620', line=NEON_P),
                 dict(t='r', f=[.18, .58, .74, .82], fill='#0a0620', line='#6a4ab0')])
    # рожеве скло сканера — задня стінка капсули, неглибоко за лицем стійок (v 20): інакше в перспективі скло «з'їжджає» до
    # середини кімнати й виглядає не по центру капсули (власник: «екрани — по центру»)
    bk = (956, 1054, 210, 320)
    Z.add('ws_back', *bk, 20, 8, 'frame', on='ws_dais', deco=[dict(t='ch', f=F(958, 1052, 212, 319, *bk), k=.12, fill='#a0208a', line='#ff7af0', lw=1.1)])
    Z.add('ws_beam', 912, 1098, 170, 210, 9, 53, 'frame', ch=(18, 18), **FS, deco=[dict(t='l', f=[.08, .86, .92, .86], col=NEON_P, lw=1.2)])
    sign(Z, 'ws_sign', 948, 1062, 168, 202, 7.4, 1.5, 'nav.workshop', NEON_P)
    # купол на балці (три зрізані конуси — округлий, як на картинці) і кріплення маніпулятора; центр у плані — v 35.5
    Z.add('ws_dome', 961, 1049, 154, 170, 13.5, 44, 'dome', on='ws_beam', cyl=24, kt=.84, band=1)
    Z.add('ws_dome2', 968, 1042, 144, 154, 17, 37, 'dome', on='ws_dome', cyl=22, kt=.7)
    Z.add('ws_cap', 979, 1031, 138, 144, 22.5, 26, 'dome', on='ws_dome2', cyl=18, kt=.62)
    Z.add('ws_mount', 994, 1016, 126, 138, 26.5, 18, 'dark', on='ws_cap', cyl=14)
    # планшети скінів на ніжках — на платформі перед стійками (як на картинці)
    for id_, X0, X1, Y0 in (('ws_tabL', 907, 947, 244), ('ws_tabR', 1063, 1103, 244)):
        cx = (X0 + X1) / 2
        Z.add(id_ + 's', cx - 5, cx + 5, 304, 330, 2, 5, 'dark', on='ws_base')
        Z.add(id_, X0, X1, Y0, 304, 1.2, 4.6, 'tablet', on=id_ + 's', deco=[dict(t='r', f=[.08, .92, .05, .95], fill='#0c4a8a', line='#7af4ff')])
    Z.arm = [(1005, 128), (1062, 96), (1128, 134), (1114, 158)]; Z.armv = 35.5   # маніпулятор: база на кріпленні, плече, лікоть, захват
    return Z

def marketing():
    """МАРКЕТИНГ — стіл з шухлядами на обох кінцях і великий екран-будка за ним; будка, вивіска й обидві голо-панелі —
    РІВНО ПО ЦЕНТРУ стола (власник: «екрани основні — по центру столів»); по монітору на кінцях стола — симетрично."""
    Z = Zone('marketing', 589, 337, ('mk_booth', 'mk_desk')); dd = zscale(Z, 282)
    de = (466, 712, 282, 337)
    Z.add('mk_desk', *de, 0, dd, 'desk', deco=drawers(de, ((473, 507), (671, 705))))
    bv = dd + 2; bo = (503, 675, 100, 337)                                            # будка: 172 × 237, середина — 589 (як стіл)
    Z.add('mk_booth', *bo, bv, 16, 'frame', ch=(10, 10), sty=dict(FRAME_STY, neon=NEON_C), deco=[dict(t='r', f=[.07, .93, .2, .72], fill='#0c3a7a', line=NEON_C),
        dict(t='r', f=[.1, .486, .235, .69], fill='#1a5ab0', line='#7af4ff'), dict(t='r', f=[.514, .9, .235, .69], fill='#1a5ab0', line='#7af4ff')])
    sign(Z, 'mk_sign', 515, 663, 107, 139, bv - 2.6, 2.5, 'nav.marketing', NEON_P)
    for id_, X0 in (('mk_scr2', 474), ('mk_scr', 666)):                               # монітори на кінцях стола — симетрично
        Z.add(id_, X0, X0 + 38, 246, 282, dd * .36, 6, 'screen', on='mk_desk', deco=[dict(t='r', f=[.1, .9, .1, .8], fill='#3be8ff')])
    Z.vc = [('mk_desk', ('mk_booth', 'mk_sign')), ('mk_desk', ('mk_scr2', 'mk_scr'))]   # на екрані — рівно по центру стола (vcenter)
    return Z

# ===================================== ЗАГОТОВКИ 28.10 (попередня спроба, --preset v1) =====================================
# ----- праве крило -----
def workshop_v1():
    Z = Zone('workshop', 1005, 358, ('ws_base', 'ws_beam', 'ws_back')); Z.m = MS_WS
    Z.add('ws_base', 905, 1105, 324, 358, 0, 42, 'base', deco=[dict(t='l', f=[0, .04, 1, .04], col=NEON_P, lw=1.2),
        dict(t='r', f=F(982, 1022, 334, 344, 905, 1105, 324, 358), fill='#ff9a3a', line='#ffd27a'),
        dict(t='l', f=[.265, .2, .265, .96], col='#0a0620'), dict(t='l', f=[.735, .2, .735, .96], col='#0a0620'),
        *[dict(t='c', f=[x, .62, .012], fill='#3be8ff') for x in (.08, .16, .84, .92)]])
    Z.add('ws_stepL', 905, 958, 316, 324, 2, 38, 'base', on='ws_base', deco=[dict(t='l', f=[0, .3, 1, .3], col=NEON_C)])
    Z.add('ws_stepR', 1052, 1105, 316, 324, 2, 38, 'base', on='ws_base', deco=[dict(t='l', f=[0, .3, 1, .3], col=NEON_C)])
    bk = (959, 1051, 212, 324)
    Z.add('ws_back', *bk, 30, 8, 'frame', on='ws_base', deco=[dict(t='ch', f=F(960, 1050, 214, 323, *bk), k=.1, fill='#a0208a', line='#ff7af0', lw=1.1),
        dict(t='c', f=[*FP(1005, 240, *bk), 12 / 94], fill='#ffd0f4', line='#ffffff'), dict(t='c', f=[*FP(1005, 240, *bk), 18 / 94], line='#ff9af0', lw=1),
        dict(t='l', f=[*FP(960, 300, *bk), *FP(1050, 300, *bk)], col='#ff9af0', lw=.8)])
    for id_, X0, X1, stp in (('ws_postL', 932, 958, 'ws_stepL'), ('ws_postR', 1052, 1078, 'ws_stepR')):
        Z.add(id_, X0, X1, 212, 316, 10, 28, 'frame', on=stp, deco=[dict(t='l', f=[.5, .08, .5, .92], col=NEON_C, lw=1.4), dict(t='r', f=[.2, .8, .7, .82], fill='#0a0620', line=NEON_P)])
    Z.add('ws_beam', 924, 1086, 180, 212, 8, 30, 'frame', ch=(12, 12), deco=[dict(t='l', f=[.05, .9, .95, .9], col=NEON_P, lw=1.2)])
    sign(Z, 'ws_sign', 955, 1056, 174, 204, 1.4, 6, 'nav.workshop', NEON_P)
    for id_, X0, X1, st in (('ws_wingL', 905, 928, 'ws_stepL'), ('ws_wingR', 1082, 1105, 'ws_stepR')):
        Z.add(id_, X0, X1, 222, 316, 14, 26, 'frame', on=st, deco=[dict(t='l', f=[.3, .05, .3, .95], col=NEON_P, lw=1.4), dict(t='r', f=[.55, .85, .1, .3], fill='#0a0620', line=NEON_C)])
    for id_, X0, X1, Y0, stp in (('ws_tabL', 917, 952, 248, 'ws_stepL'), ('ws_tabR', 1058, 1093, 244, 'ws_stepR')):
        cx = (X0 + X1) / 2
        Z.add(id_ + 's', cx - 5, cx + 5, 306, 316, 5, 3, 'dark', on=stp)
        Z.add(id_, X0, X1, Y0, 306, 4, 4, 'tablet', on=id_ + 's', deco=[dict(t='r', f=[.08, .92, .05, .95], fill='#0c4a8a', line='#7af4ff'), dict(t='grid', f=[.16, .84, .12, .88], nx=2, ny=3, fill='#1a6ab0', line='#9af8ff')])
    # термінал зі стійкою, що стояв праворуч від платформи, прибрано: майстерня — симетрична сцена, як маркетинг навпроти
    return Z

def tools():
    Z = Zone('tools', 1226, 357, ('tl_top', 'tl_board', 'tl_cabL')); dd = zscale(Z, 312)
    for id_, X0, X1 in (('tl_cabL', 1154, 1214), ('tl_cabR', 1240, 1298)):
        Z.add(id_, X0, X1, 320, 357, 3, dd - 5, 'desk', notop=1, deco=[dict(t='r', f=[.06, .94, .08, .94], fill='#140c30', line='#6a4ab0'), dict(t='l', f=[.06, .5, .94, .5], col='#6a4ab0'),
            dict(t='r', f=[.42, .58, .26, .32], fill='#9a8ae0'), dict(t='r', f=[.42, .58, .7, .76], fill='#9a8ae0')])
    Z.add('tl_top', 1146, 1306, 312, 320, 0, dd, 'bench', deco=[dict(t='r', f=[0, 1, 0, .55], fill='#ff7ad0')])
    bv = dd - 10; bo = (1167, 1300, 164, 312)                                      # дошка стоїть на задньому краї стільниці
    Z.add('tl_board', *bo, bv, 10, 'board', on='tl_top', ch=(8, 8), deco=[dict(t='r', f=F(1226, 1244, 259, 296, *bo), fill='#ff9a3a', line='#ffd27a'), dict(t='l', f=[.03, .08, .03, .95], col=NEON_C, lw=1.2), dict(t='l', f=[.97, .08, .97, .95], col=NEON_C, lw=1.2)])
    sign(Z, 'tl_sign', 1182, 1287, 175, 202, bv - 3.5, 3, 'nav.tools', NEON_C, st='board')
    Z.add('tl_tiles', 1189, 1290, 206, 251, bv - 2.5, 2, 'board', deco=[dict(t='r', f=[0, 1, 0, 1], fill='#0a1440', line=NEON_C), dict(t='grid', f=[.02, .98, .05, .95], nx=3, ny=1, gap=.05, fill='#0e2a6a', line='#7af4ff', icon='#7af4ff')])
    Z.add('tl_tileBL', 1189, 1224, 266, 302, bv - 2.5, 2, 'board', deco=[dict(t='r', f=[0, 1, 0, 1], fill='#0e2a6a', line='#7af4ff'), dict(t='c', f=[.5, .5, .22], line='#7af4ff', lw=1)])
    Z.add('tl_tileBR', 1246, 1294, 256, 302, bv - 2.5, 2, 'board', deco=[dict(t='r', f=[0, 1, 0, 1], fill='#0e2a6a', line='#7af4ff'), dict(t='c', f=[.5, .5, .2], line='#7af4ff', lw=1)])
    Z.add('tl_item3', 1228, 1246, 296, 312, 12, 6, 'screen', on='tl_top', deco=[dict(t='r', f=[.15, .85, .15, .6], fill='#3be8ff')])   # екранчик на столі
    return Z

def portal():
    # широкі бічні панелі (замість вузьких колон) — портал завширшки як AI-центр навпроти (з його стелажем)
    Z = Zone('portal', 1399, 360, ('pt_d1', 'pt_d2', 'pt_beam', 'pt_pillL')); Z.m = MS_PT
    Z.add('pt_d1', 1267, 1531, 350, 360, -28, 84, 'dais', deco=[dict(t='l', f=[0, .2, 1, .2], col='#d98aff', lw=1.2)])
    Z.add('pt_d2', 1275, 1523, 340, 350, -16, 66, 'dais', on='pt_d1', deco=[dict(t='l', f=[0, .2, 1, .2], col=NEON_C, lw=1.2)])
    bk = (1341, 1457, 150, 340)
    Z.add('pt_back', *bk, 34, 8, 'pframe', on='pt_d2', deco=[dict(t='arch', f=[0, 1, .02, 1], spring=.3, fill='#2a0f6a', line=NEON_C, vortex=[.66, .62])])
    for id_, X0, X1, inner in (('pt_pillL', 1261, 1340, .92), ('pt_pillR', 1458, 1537, .08)):
        Z.add(id_, X0, X1, 150, 340, 6, 38, 'pframe', on='pt_d2', deco=[dict(t='r', f=[.16, .84, .1, .9], fill='#1a0c40', line='#c86aff', lw=1.2),
            dict(t='r', f=[.28, .72, .2, .44], fill='#120830', line='#7a4ad8'), dict(t='r', f=[.28, .72, .54, .8], fill='#120830', line='#7a4ad8'),
            dict(t='l', f=[inner, .04, inner, .96], col=NEON_P, lw=1.4)])
    Z.add('pt_beam', 1261, 1537, 97, 150, 4, 40, 'pframe', ch=(26, 16), deco=[dict(t='l', f=[.05, .92, .95, .92], col=NEON_P, lw=1.2)])
    sign(Z, 'pt_sign', 1340, 1458, 116, 150, -.6, 4, 'nav.portal', '#d98aff')
    return Z

# ----- ліве крило -----
def marketing_v1():
    Z = Zone('marketing', 589, 337, ('mk_booth', 'mk_deskL')); dd = zscale(Z, 280)
    g = lambda r: grow(r, KB_MK, 588.5, 337)
    bv = dd + 2; bo0 = (530, 647, 173, 337); bo = g(bo0)                           # будка з екранами — одразу за столом
    Z.add('mk_booth', *bo, bv, 10, 'frame', ch=(6, 6), deco=[dict(t='r', f=F(557, 637, 210, 262, *bo0), fill='#0c3a7a', line=NEON_C),
        dict(t='r', f=F(561, 595, 214, 258, *bo0), fill='#1a5ab0', line='#7af4ff'), dict(t='r', f=F(599, 633, 214, 258, *bo0), fill='#1a5ab0', line='#7af4ff'),
        dict(t='bars', f=F(564, 592, 230, 256, *bo0), n=5, fill='#7af4ff'), dict(t='c', f=[*FP(616, 236, *bo0), .08], line='#7af4ff', lw=1)])
    sign(Z, 'mk_sign', *g((543, 640, 178, 202)), bv - 2.6, 2.5, 'nav.marketing', NEON_P)
    de = (464, 714, 280, 337)
    Z.add('mk_deskL', *de, 0, dd, 'desk', deco=drawers(de, ((472, 502), (676, 706))))
    for id_, X0 in (('mk_scr2', 470), ('mk_scr', 672)):                            # монітори на краях стола
        Z.add(id_, X0, X0 + 36, 250, 280, dd * .4, 6, 'screen', on='mk_deskL', deco=[dict(t='r', f=[.1, .9, .1, .8], fill='#3be8ff')])
    return Z

def analytics():
    Z = Zone('analytics', 399, 340, ('an_booth', 'an_desk')); dd = zscale(Z, 280)
    g = lambda r: grow(r, KB_AN, 399, 340)
    bv = dd + 2; bo0 = (335, 463, 150, 340); bo = g(bo0)
    Z.add('an_booth', *bo, bv, 16, 'frame', ch=(8, 8), deco=[dict(t='r', f=F(348, 392, 197, 247, *bo0), fill='#0c3a7a', line=NEON_C), dict(t='bars', f=F(352, 388, 205, 243, *bo0), n=6, fill='#7af4ff'),
        dict(t='r', f=F(398, 443, 200, 243, *bo0), fill='#0c3a7a', line=NEON_C), dict(t='c', f=[*FP(420, 222, *bo0), .1], fill='#1a5ab0', line='#7af4ff', lw=1)])
    sign(Z, 'an_sign', *g((353, 443, 163, 190)), bv - 3.5, 3, 'nav.analytics', NEON_C)
    de = (291, 507, 280, 340)
    Z.add('an_desk', *de, 0, dd, 'desk', deco=drawers(de, ((298, 328), (470, 500))))
    for id_, X0 in (('an_scr2', 304), ('an_scr', 458)):                            # монітори на краях стола
        Z.add(id_, X0, X0 + 28, 252, 280, dd * .4, 6, 'screen', on='an_desk', deco=[dict(t='r', f=[.1, .9, .1, .8], fill='#3be8ff')])
    Z.add('an_poster', *g((383, 427, 92, 122)), bv + 13, 3, 'neon', deco=[dict(t='c', f=[.5, .5, .25], line=NEON_P, lw=1.4)])   # неоновий постер на стіні над будкою
    return Z

def aicenter():
    Z = Zone('ai', 181.5, 363, ('ai_screen', 'ai_top', 'ai_top1', 'ai_top2', 'sh_postL')); dd = zscale(Z, 290)   # висота зони — з поличкою екранів угорі
    Z.add('ai_top', 30, 333, 290, 300, 0, dd, 'desk', deco=[dict(t='r', f=[0, 1, 0, .6], fill='#ff7ad0')])
    Z.add('ai_drawers', 160, 200, 300, 363, 4, dd - 10, 'desk', notop=1, deco=[*[dict(t='r', f=[.1, .9, a, b], fill='#140c30', line='#6a4ab0') for a, b in ((.06, .32), (.38, .64), (.7, .96))]])
    for id_, X0 in (('ai_legL', 34), ('ai_legR', 321)): Z.add(id_, X0, X0 + 8, 300, 363, 6, dd - 14, 'dark', notop=1)
    sc = (77, 238, 47, 290)                                                        # великий голо-екран — одразу за столом
    Z.add('ai_screen', *sc, dd, 8, 'neon', ch=(10, 10), deco=[dict(t='r', f=F(85, 230, 55, 282, *sc), fill='#0a1a5a', line=NEON_C),
        dict(t='bars', f=F(93, 130, 110, 158, *sc), n=6, fill='#3be8ff'), dict(t='bars', f=F(93, 130, 165, 213, *sc), n=6, fill='#3be8ff'),
        dict(t='c', f=[*FP(168, 160, *sc), .2], line='#7af4ff', lw=1.6), dict(t='c', f=[*FP(168, 160, *sc), .12], line='#7af4ff', lw=1),
        dict(t='grid', f=F(203, 230, 120, 267, *sc), nx=1, ny=5, gap=.08, fill='#0e2a6a', line='#7af4ff', icon='#7af4ff')])
    sign(Z, 'ai_sign', 87, 230, 63, 100, dd - 2.5, 2, 'nav.ai', NEON_C)
    Z.add('ai_mon', 28, 118, 207, 290, dd * .35, 6, 'screen', on='ai_top', deco=[dict(t='r', f=[.06, .94, .07, .86], fill='#0c3a7a', line=NEON_C), dict(t='bars', f=[.12, .88, .2, .8], n=7, fill='#7af4ff')])
    Z.add('ai_shelfTop', 53, 213, 34, 44, dd + 2, 8, 'shelf')
    Z.add('ai_top1', 56, 118, 2, 34, dd + 3, 3, 'screen', on='ai_shelfTop', deco=[dict(t='r', f=[.06, .94, .1, .9], fill='#0c3a7a', line=NEON_C), dict(t='bars', f=[.12, .88, .25, .85], n=6, fill='#7af4ff')])
    Z.add('ai_top2', 128, 190, 2, 34, dd + 3, 3, 'screen', on='ai_shelfTop', deco=[dict(t='r', f=[.06, .94, .1, .9], fill='#0c3a7a', line=NEON_C)])
    # стелаж (картинка x 240..335, між екраном і аналітикою) — полички як були: бокові стінки, задня стінка, 6 дощок і речі на них
    SV = dd
    Z.add('sh_postL', 240, 246, 20, 290, SV, 18, 'shelf')
    Z.add('sh_postR', 329, 335, 20, 290, SV, 18, 'shelf')
    Z.add('sh_back', 246, 329, 20, 290, SV + 16.3, 2, 'dark')
    for i, y in enumerate(SHELF_Y):
        Z.add(f'sh_b{i}', 246.5, 328.5, y, y + 4, SV, 16, 'shelf', deco=[dict(t='l', f=[0, .5, 1, .5], col='#ff7ad0', lw=1)])
    Z.plant('sh_ivy', 252, 268, 22, 34, SV + 4, 9, 26, 46, on='sh_b0', hangs=1)
    Z.plant('sh_flowers', 298, 318, 21, 34, SV + 4, 10, 36, 26, on='sh_b0', bloom=['#ff7ad0', '#ffd27a', '#ff9af0'])
    Z.add('sh_tea', 280, 304, 52, 69, SV + 4, 10, 'neon', on='sh_b1', cyl=12, glow=1, gr=30, gcol='255,90,220')
    Z.add('sh_jar1', 310, 317, 59, 69, SV + 5, 7, 'glass', on='sh_b1', cyl=8)
    Z.add('sh_jar2', 319, 325, 62, 69, SV + 5, 6, 'glass', on='sh_b1', cyl=8)
    Z.add('sh_scr1', 254, 322, 88, 123, SV + 9, 3, 'screen', on='sh_b2', deco=[dict(t='r', f=[.06, .94, .1, .9], fill='#0c3a7a', line=NEON_C), dict(t='bars', f=[.12, .6, .25, .85], n=5, fill='#7af4ff')])
    Z.add('sh_box', 252, 302, 146, 183, SV + 3, 12, 'desk', on='sh_b3', deco=[dict(t='r', f=[.08, .92, .1, .45], fill='#140c30', line='#6a4ab0'), dict(t='r', f=[.08, .92, .55, .9], fill='#140c30', line='#6a4ab0')])
    Z.plant('sh_succ', 308, 324, 170, 183, SV + 4, 9, 22, 16, on='sh_b3', leaf=['#8a4ac0', '#6a2aa0', '#b07ae0'])
    Z.add('sh_scr2', 254, 322, 194, 226, SV + 9, 3, 'screen', on='sh_b4', deco=[dict(t='r', f=[.06, .94, .1, .9], fill='#0c3a7a', line=NEON_C), dict(t='c', f=[.7, .5, .12], line='#7af4ff', lw=1)])
    Z.add('sh_books', 252, 288, 238, 258, SV + 3, 11, 'item', on='sh_b5', deco=[dict(t='r', f=[a, a + .13, .05 + (.2 if k % 3 == 1 else 0), 1], fill=col, line='#0a0620') for k, (a, col) in enumerate(((.02, '#c84a8a'), (.17, '#4a8ad0'), (.32, '#d8a030'), (.47, '#6a4ac0'), (.62, '#3aa858'), (.77, '#ff7ad0')))])
    Z.plant('sh_flowers2', 294, 322, 236, 258, SV + 3, 11, 40, 30, on='sh_b5', bloom=['#ff9af0', '#ffd27a'])
    return Z
BUILDERS = {'workshop': workshop, 'workshop_v1': workshop_v1, 'tools': tools, 'portal': portal,
            'marketing': marketing, 'marketing_v1': marketing_v1, 'analytics': analytics, 'aicenter': aicenter}
ZONES = {'right': ('workshop', 'tools', 'portal'), 'left': ('marketing', 'analytics', 'aicenter')}   # від вікна до глядача

# ===================================== РОЗМІЩЕННЯ =====================================
KEYS = ('on', 'deco', 'plant', 'glow', 'gcol', 'cyl', 'kt', 'kb', 'band', 'notop', 'leaf', 'gr', 'hangs', 'bloom', 'leaves')
def place(Z, ax, az, turn, m, kx=1.):
    a = math.radians(turn); f = (-math.sin(a), -math.cos(a)); r = (-f[1], f[0]); out = []
    for c in Z.comps:
        u0, u1 = (c['X'][0] - Z.Xref) * m * kx, (c['X'][1] - Z.Xref) * m * kx; uc = (u0 + u1) / 2; vw = c['v'] * m
        it = dict(id=c['id'], zone=Z.name, x=round(ax + r[0] * uc - f[0] * vw, 2), z=round(az + r[1] * uc - f[1] * vw, 2), turn=turn, w=round(u1 - u0, 2), dep=round(c['d'] * m, 2),
                  yb=round(FL - (Z.Yfloor - c['Y'][1]) * m, 2), yt=round(FL - (Z.Yfloor - c['Y'][0]) * m, 2), st=c['st'])
        for k in KEYS:
            if k in c: it[k] = c[k]
        if 'ch' in c: it['ch'] = [round(c['ch'][0] * m * kx, 2), round(c['ch'][1] * m, 2)]
        if 'fw' in c: it['fw'] = round(c['fw'] * m * kx, 2); it['fh'] = round(c['fh'] * m, 2)
        if c.get('cyl'): it['w'] = round(abs(u1 - u0), 2)
        if 'sty' in c: it['sty'] = {k: round(v * m, 2) if isinstance(v, (int, float)) else v for k, v in c['sty'].items()}   # фаска, шов, неоновий кант — px картинки -> од. світу; колір канта (neon) — як є
        out.append(it)
    if Z.arm:
        Z.armw = [[round(ax + r[0] * (X - Z.Xref) * m * kx - f[0] * Z.armv * m, 2), round(FL - (Z.Yfloor - Y) * m, 2), round(az + r[1] * (X - Z.Xref) * m * kx - f[1] * Z.armv * m, 2)] for X, Y in Z.arm]
    return out
def cfaces(it):
    if it.get('cyl'):
        jt = dict(it); jt.pop('cyl'); return faces(jt)                          # циліндр -> обрис як у коробки (для оцінок досить)
    return faces(it)
def screen_ext(items, ids=None):
    xs, ys = [], []
    for it in items:
        if ids and it['id'] not in ids: continue
        Fc, V = cfaces(it)
        for nm in ('front', 'left', 'right', 'top'):
            if V.get(nm):
                for q in Fc[nm]: X, Y = P3(*q); xs.append(X); ys.append(Y)
    return min(xs), max(xs), min(ys), max(ys)
def width_extent(Z): return min(c['X'][0] for c in Z.comps) - Z.Xref, max(c['X'][1] for c in Z.comps) - Z.Xref
def wall_place(Z, q, C, R, sgn):
    """зона СПИНОЮ ДО СТІНИ: середина її ширини — на радіусі під кутом a від центру дуги C, лицем до центру дуги (поворот ±a);
    зону посуваємо до стіни, доки найдальша точка її сліду не опиниться за gap від дуги."""
    a = q['a']; t = q.get('turn', sgn * a); ta = math.radians(t); f = (-math.sin(ta), -math.cos(ta)); r = (-f[1], f[0])
    lo, hi = width_extent(Z); dx, dz = sgn * math.sin(math.radians(a)), math.cos(math.radians(a)); g = q.get('gap', 4)
    def pos(m, kx=1.):
        uc = (lo + hi) / 2 * m * kx
        def at(rho): return C[0] + dx * rho - r[0] * uc, C[1] + dz * rho - r[1] * uc
        a0, a1 = 0., R
        for _ in range(22):
            rho = (a0 + a1) / 2; it = place(Z, *at(rho), t, m, kx)
            if max(math.hypot(px - C[0], pz - C[1]) for i in it for px, pz in fpr(i)) > R - g: a1 = rho
            else: a0 = rho
        return (*at(a0), t)
    return pos
def yov(A, B): return min(A['yb'], B['yb']) - max(A['yt'], B['yt']) > .5
def fpr(it):
    if it.get('cyl'):
        jt = dict(it); jt.pop('cyl'); return footprint(jt)
    return footprint(it)
def hit(A, B): return yov(A, B) and not sep(fpr(A), fpr(B))[0]
def arcpt(C, rad, a, sgn): return (C[0] + sgn * rad * math.sin(math.radians(a)), C[1] + rad * math.cos(math.radians(a)))
def chord(rad, da): return 2 * rad * math.sin(math.radians(da / 2))

# ---------- ЛАНЦЮЖОК ЗОН уздовж стіни (власник, 28.10: «рівномірно, впритул, нічого не заходить одне на інше») ----------
def hull(pts):
    """опукла оболонка точок плану (x, z)"""
    P = sorted(set((round(x, 3), round(z, 3)) for x, z in pts))
    if len(P) < 3: return P
    cr = lambda o, a, b: (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]); lo, up = [], []
    for q in P:
        while len(lo) >= 2 and cr(lo[-2], lo[-1], q) <= 0: lo.pop()
        lo.append(q)
    for q in reversed(P):
        while len(up) >= 2 and cr(up[-2], up[-1], q) <= 0: up.pop()
        up.append(q)
    return lo[:-1] + up[:-1]
def zhull(items): return hull([q for it in items for q in fpr(it)])
def seg_d(p, a, b):
    ax, az = b[0] - a[0], b[1] - a[1]; L2 = ax * ax + az * az or 1e-9; t = max(0, min(1, ((p[0] - a[0]) * ax + (p[1] - a[1]) * az) / L2))
    return math.hypot(p[0] - a[0] - ax * t, p[1] - a[1] - az * t)
def pdist(A, B):
    """відстань між опуклими многокутниками плану (0 — перетинаються)"""
    if not sep(A, B)[0]: return 0.
    return min(min(seg_d(p, Q[i], Q[(i + 1) % len(Q)]) for p in P for i in range(len(Q))) for P, Q in ((A, B), (B, A)))
def vcenter(Z, items):
    """ВІЗУАЛЬНО ПО ЦЕНТРУ (власник, 29.10: «екрани основні — по центру своїх столів»). Глядач бачить зону спереду, і будка, що
    стоїть ЗА столом, у перспективі «з'їжджає» до середини кімнати (що далі — то ближче до точки сходу): на 3D-плані вона по
    центру, а на екрані — ні. Тож група частин (Z.vc: [(опора, (частини…))] — будка з вивіскою, пара моніторів) зсувається
    в світі так, щоб на екрані середина групи припала на середину лицьової грані опори (стола)."""
    by = {it['id']: it for it in items}
    def cx(ids):
        xs = [P3(*q)[0] for i in ids for q in faces(by[i])[0]['front']]; return (min(xs) + max(xs)) / 2
    for ref, grp in getattr(Z, 'vc', []):
        for _ in range(4):
            d = cx([ref]) - cx(grp)
            for i in grp: by[i]['x'] = round(by[i]['x'] + d / s(by[i]['z']), 2)
    return items
def far_items(Z, far, sgn):
    """дальня зона: прямо (лицем до глядача) біля стіни з вікном. far: X_in — її край біля дивану на екрані (найближча до
    середини кімнати точка зони), gap — найменший проміжок до стіни з вікном (за замовчуванням зона спиною до неї);
    front (необов'язково) — лінія підлоги під передньою гранню зони на екрані (y): зона ближче до глядача (власник, 29.10:
    «майстерня — ближча»), але не далі від стіни, ніж дозволяє її глибина (спина — щонайбільше JZ − gap)."""
    m = Z.m; vmax = max(c['v'] + c['d'] for c in Z.comps); zb = JZ - far.get('gap', 6)
    if far.get('front'): zb = min(zb, D * (FL - 220) / (far['front'] - 220) - D + vmax * m)
    az = zb - vmax * m
    def edge(ax):                                                                  # найближча до середини точка зони на екрані
        e = screen_ext(place(Z, ax, az, 0, m)); return e[0] if sgn > 0 else e[1]
    lo, hi = 774 - 900, 774 + 900                                                  # X краю росте з ax — бісекція
    for _ in range(40):
        mid = (lo + hi) / 2
        if edge(mid) < far['X_in']: lo = mid
        else: hi = mid
    return vcenter(Z, place(Z, (lo + hi) / 2, az, 0, m))
def arc_items(Z, a, C, R, sgn, gap):
    """зона спиною до дуги під кутом a (поворот = a: задня грань — уздовж стіни, лицем до центру дуги), впритул до стіни"""
    return place(Z, *wall_place(Z, {'a': a, 'gap': gap}, C, R, sgn)(Z.m), Z.m)
def chain(prev, Z, C, R, sgn, gz, gw, gs, a0=-30., a1=140.):
    """наступна зона на дузі: найменший кут, за якого між нею й попередньою (prev — предмети) лишається gz од. світу в плані
    і gs px на екрані (ближча зона не заходить на дальшу — нічого одне на одне)"""
    H0 = zhull(prev); e0 = screen_ext(prev)
    def ok(it):
        e = screen_ext(it); gap = e[0] - e0[1] if sgn > 0 else e0[0] - e[1]
        return pdist(zhull(it), H0) >= gz and gap >= gs
    for _ in range(24):
        a = (a0 + a1) / 2
        if not ok(arc_items(Z, a, C, R, sgn, gw)): a0 = a
        else: a1 = a
    return a1, arc_items(Z, a1, C, R, sgn, gw)
def wall_angle(p, C, sgn): return math.degrees(math.atan2(sgn * (p[0] - C[0]), p[1] - C[1]))   # кут точки плану від центру дуги
def main_h(Z, items): e = screen_ext(items, Z.main); return e[3] - e[2]
def fit_far(Z, far, sgn, H, n=8):
    """дальня зона з головними частинами заввишки H px на екрані (масштаб m — підбором; край біля дивану — far.X_in)"""
    for _ in range(n): Z.m *= H / main_h(Z, far_items(Z, far, sgn))
    return far_items(Z, far, sgn)
def fit_chain(prev, Z, C, R, sgn, gz, gw, gs, H, n=7):
    """наступна зона ланцюжка з головними частинами заввишки H px на екрані (масштаб і кут на дузі — разом, підбором)"""
    for _ in range(n): Z.m *= H / main_h(Z, chain(prev, Z, C, R, sgn, gz, gw, gs)[1])
    return chain(prev, Z, C, R, sgn, gz, gw, gs)

# речі на настінних полицях лівого крила: (ширина, глибина, висота, стиль, додатково)
BLOOM = ['#ff7ad0', '#ffd27a', '#ff9af0']
SHK = {
    'pot': (12, 10, 10, 'pot', dict(plant=1, fw=30, fh=26, cyl=10)),
    'flower': (12, 10, 10, 'pot', dict(plant=1, fw=30, fh=22, cyl=10, bloom=BLOOM)),
    'trail': (12, 10, 10, 'pot', dict(plant=1, fw=22, fh=52, cyl=10, hangs=1)),
    'jar': (7, 7, 10, 'glass', dict(cyl=8)),
    'books': (20, 10, 14, 'item', dict(deco=[dict(t='r', f=[a, a + .15, .05 + (.22 if k % 3 == 1 else 0), 1], fill=col, line='#0a0620') for k, (a, col) in enumerate(((.03, '#c84a8a'), (.2, '#4a8ad0'), (.37, '#d8a030'), (.54, '#6a4ac0'), (.71, '#3aa858')))])),
    'lamp': (9, 9, 14, 'lamp', dict(glow=1, gr=30, cyl=8)),
}

def build_side(p, sgn):
    """sgn = +1 — праве крило, -1 — ліве. Стіни — дзеркальні відносно x = 774, зони — свої (ліве — затишне, праве — технологічне).
    Зони — ЛАНЦЮЖКОМ (перші n з трьох): дальня біля вікна (прямо, край — біля дивану), далі середня й найближча — спиною до дуги,
    кожна впритул до попередньої (проміжок gz од. світу), без заходу одна на одну; колони — лише там, де між зонами є місце."""
    R = p['R']; xf = p['xf'] if sgn > 0 else 2 * 774 - p['xf']; C = (xf, JZ - R)
    side = 'right' if sgn > 0 else 'left'; jamb = JAMB_R if sgn > 0 else JAMB_L
    q = p[side]; gz, gw, gs = q.get('gz', 3), q.get('gw', 4), q.get('gs', 2)
    builders = [BUILDERS[nm] for nm in q.get('zones', ZONES[side])]
    n = max(0, min(3, q.get('n', 3))); H = p.get('H', 173); Hs = list(H) if isinstance(H, (list, tuple)) else [H] * 3
    zs, zones, angles = [], [], {}
    for i in range(n):                                                               # дальня -> середня -> найближча
        Z = builders[i]()
        if i == 0: it = fit_far(Z, q['far'], sgn, Hs[0])
        else: a_, it = fit_chain(zones[-1], Z, C, R, sgn, gz, gw, gs, Hs[i]); angles[('mid', 'near')[i - 1]] = round(a_, 2)
        zs.append(Z); zones.append(it)
    items = [x for it in zones for x in it]
    wall = [[round(jamb, 1), JZ], [xf, JZ]] + [[round(v, 1) for v in arcpt(C, R, a, sgn)] for a in range(10, 131, 10)]
    cols, up, hang = [], [], []
    def col(id, a, yt, w=24, dep=20, st='col', deco=None):
        x, z = arcpt(C, R - 4 - dep, a, sgn); return dict(id=id, x=round(x, 1), z=round(z, 1), turn=sgn * a, w=w, dep=dep, yb=FL, yt=yt, st=st, deco=deco or [dict(t='l', f=[.5, .02, .5, .98], col=NEON_C if sgn > 0 else NEON_P, lw=1.4), *[dict(t='r', f=[.1, .9, a_, a_ + .015], fill='#5a4ab0') for a_ in (.2, .45, .7)]])
    # колони — у щілині біля стіни між сусідніми зонами (між їхніми задніми кутами); не влазить — колони немає
    cand = {}
    for i, (b, yt, w, *dp) in enumerate(q.get('cols', [])):
        if b + 1 >= len(zones): continue                                             # такої пари зон ще немає
        A_, B_ = zones[b], zones[b + 1]; ha = [wall_angle(t, C, sgn) for t in zhull(A_)]; hb = [wall_angle(t, C, sgn) for t in zhull(B_)]
        a = (max(ha) + min(hb)) / 2; cand[i] = (a, col(f'col{i}', a, yt, w, *dp))
    col_a = {i: a for i, (a, c_) in cand.items() if not any(hit(c_, it) for it in items)}
    L = dict(wall=wall, items=items, cols=cols, armZone=zs[0].name if zs else None, scales={k: Z.m for k, Z in zip(('far', 'mid', 'near'), zs)}, angles=angles,
             mains={Z.name: list(Z.main) for Z in zs})
    if zs and zs[0].arm:                                                             # маніпулятор майстерні: точки світу + товщина під масштаб зони
        L['arm'] = zs[0].armw; L['armk'] = round(zs[0].m / 1.2, 3)
    def upbox(id, a, rad, w, dep, yb, h, st, **kw):
        x, z = arcpt(C, rad, a, sgn); up.append(dict(id=id, layer='up', x=round(x, 1), z=round(z, 1), turn=sgn * a, w=w, dep=dep, yb=yb, yt=yb - h, st=st, **kw))
    # ---- антресоль (праве крило) ----
    if 'mz' in q:
        mz = q['mz']; ER = R - mz['w']; yt = mz['yt']
        L['mezz'] = dict(edge=[[round(v, 1) for v in arcpt(C, ER, a, sgn)] for a in range(mz['phi0'], mz.get('phi1', 101) + 1, 4)], yt=yt, yb=mz['yb'])
        for i, a in enumerate(mz['bots']):
            upbox(f'mz_bot{i}', a, ER + 18, 10, 8, yt, 10, 'bot'); x, z = arcpt(C, ER + 18, a, sgn)
            up.append(dict(id=f'mz_botH{i}', layer='up', on=f'mz_bot{i}', x=round(x, 1), z=round(z, 1), turn=sgn * a, w=8, dep=7, yb=yt - 10, yt=yt - 17, st='bot', deco=[dict(t='c', f=[.33, .5, .14], fill='#7af4ff'), dict(t='c', f=[.67, .5, .14], fill='#7af4ff')]))
        upbox('mz_cube', mz['cube'], ER + 20, 12, 12, yt, 12, 'item', deco=[dict(t='r', f=[.2, .8, .2, .8], fill='#6a3ad8', line='#c8a0ff')])
        for i, a in enumerate(mz['pots']): upbox(f'mz_pot{i}', a, ER + 24, 14, 12, yt, 10, 'pot', plant=1, fw=34, fh=26, cyl=10)
        for k, (a, kind) in enumerate(mz['gold']):
            if kind == 'lantern': upbox('mz_lantern', a, ER + 26, 12, 12, yt, 28, 'gold', glow=1, gr=46, cyl=10)
            else: upbox(f'mz_gold{k}', a, ER + 26, 16, 12, yt, 12, 'gold')
        for a, ln, k in mz['hang']:
            x, z = arcpt(C, R - 34, a, sgn); hang.append(dict(x=round(x, 1), z=round(z, 1), len=ln, kind=k, turn=sgn * a))
        upbox('mz_fern', mz['fern'], R - 30, 18, 14, mz['yb'] + 50, 12, 'pot', plant=1, fw=64, fh=44, cyl=10)          # під антресоллю біля колони
        if 0 in col_a: upbox('mz_lampL', col_a[0], R - 34 - 10, 12, 10, mz['yb'] + 30, 22, 'lamp', glow=1, gr=30, cyl=8)          # ліхтар на лиці колони-опори (під антресоллю)
    # ---- настінні полиці (ліве крило): дошки вздовж дуги, кронштейни, вазони, плющ, книжки, баночки ----
    for k, sh in enumerate(q.get('shelves', [])):
        y, a0, a1, dep = sh['y'], sh['a0'], sh['a1'], sh['dep']; n = max(1, round((a1 - a0) / 6)); da = (a1 - a0) / n
        for i in range(n):
            am = a0 + (i + .5) * da
            upbox(f'wsh{k}_{i}', am, R - 4 - dep, round(chord(R - 4 - dep / 2, da) + .8, 2), dep, y + 3, 3, 'shelf', grp=f'wsh{k}', deco=[dict(t='l', f=[0, .5, 1, .5], col='#ff7ad0', lw=1)])
        for i in range(n + 1):
            if i % 2: continue
            a = a0 + i * da + (1.2 if i == 0 else -1.2 if i == n else 0)
            upbox(f'wsb{k}_{i}', a, R - 3 - dep + 2, 2, dep - 2, y + 13, 10, 'shelf')                               # кронштейн під дошкою
        for j, (a, kind) in enumerate(sh['items']):
            w, d, h, st, extra = SHK[kind]; seg_i = min(n - 1, max(0, int((a - a0) / da)))
            upbox(f'wsi{k}_{j}', a, R - 4 - dep / 2 - d / 2, w, d, y, h, st, on=f'wsh{k}_{seg_i}', **json.loads(json.dumps(extra)))
    for h in q.get('hang', []):
        a, rad, frm, ln, kind = h; x, z = arcpt(C, R - rad, a, sgn); hang.append(dict(x=round(x, 1), z=round(z, 1), len=ln, kind=kind, turn=sgn * a, **{'from': frm}))
    for i, (a, c_) in cand.items():                                               # колона — лише якщо ні з чим не перетинається (зони, полички)
        bad = [it['id'] for it in items + up if hit(c_, it)]
        if bad: print(f'  col{i}: не влазить (кут {a:.1f}: {", ".join(bad[:4])}…) — без неї'); continue
        cols.append(c_)
    L['items'] = items + up; L['hang'] = hang
    # ---- екран NEXORA AI на стіні праворуч від вікна (трохи повернутий — уздовж початку дуги) + стрічка машинерії на дузі ----
    if 'hub' in q:
        hq = q['hub']; zl = hq['z']; xl = 774 + (hq['x0'] - 774) / s(zl); ta = math.radians(hq['turn']); w = hq['w']
        cx, cz = xl + w / 2 * math.cos(ta), zl - w / 2 * math.sin(ta); sh_ = s(cz); WY = lambda Y: round(220 + (Y - 220) / sh_, 1)
        hb = (970, 1082, 15, 165)                                                  # частина картинки (екран праворуч від вікна)
        L['hub'] = dict(x=round(cx, 1), z=round(cz, 1), w=w, turn=hq['turn'], y0=WY(15), y1=WY(165), deco=[
            dict(t='txt', f=F(985, 1050, 33, 54, *hb), s='NEXORA AI', col='#7af4ff'),
            dict(t='r', f=F(977, 1052, 58, 125, *hb), fill='#0a2a7a', line='#3b8aff'),
            dict(t='c', f=[*FP(1000, 85, *hb), .09], fill='#1a5ad0'), dict(t='c', f=[*FP(1030, 95, *hb), .11], fill='#1a5ad0'), dict(t='c', f=[*FP(1012, 112, *hb), .06], fill='#1a5ad0'),
            dict(t='grid', f=F(1055, 1080, 42, 125, *hb), nx=1, ny=4, gap=.08, fill='#0e2a6a', line='#7af4ff', icon='#7af4ff'),
            dict(t='l', f=[*FP(980, 150, *hb), *FP(1050, 140, *hb)], col='#ff4fd8', lw=1)])
        if not hq.get('strip'): return finish(L, C, R)                             # стрічки машинерії немає (власник: зони — окремо)
        a0, a1 = hq['strip']; am = (a0 + a1) / 2; x, z = arcpt(C, R - 4, am, sgn); ss = s(z)
        cols.append(dict(id='hub_strip', x=round(x, 1), z=round(z, 1), turn=sgn * am, w=round(chord(R - 3, a1 - a0), 2), dep=3, yb=round(220 + (165 - 220) / ss, 1), yt=round(220 + (10 - 220) / ss, 1), st='dark',
                         deco=[dict(t='grid', f=[.12, .88, .04, .96], nx=1, ny=6, gap=.1, fill='#1a1450', line='#ff4fd8')]))
    return finish(L, C, R)
def finish(L, C, R):
    L['C'] = [round(C[0], 1), round(C[1], 1)]; L['R'] = R
    return L

def check(L):
    """перетини (усі пари, крім «стоїть на») і що нічого не стоїть за стіною"""
    allit = L['items'] + L['cols']; bad = []
    for i in range(len(allit)):
        for j in range(i + 1, len(allit)):
            A, B = allit[i], allit[j]
            if A.get('on') == B['id'] or B.get('on') == A['id'] or (A.get('grp') and A.get('grp') == B.get('grp')): continue
            if hit(A, B): bad.append((A['id'], B['id']))
    def crosses(a, b, c, d):
        cr = lambda o, p, q: (p[0] - o[0]) * (q[1] - o[1]) - (p[1] - o[1]) * (q[0] - o[0])
        return cr(a, b, c) * cr(a, b, d) < 0 and cr(c, d, a) * cr(c, d, b) < 0
    W = catmull([tuple(p) for p in L['wall']], 4); eye = (774, -520); behind = set()
    for it in allit:
        for p_ in fpr(it):
            if any(crosses(eye, p_, W[k], W[k + 1]) for k in range(len(W) - 1)): behind.add(it['id'])
    return bad, sorted(behind)
def report(L, name):
    """друк: масштаби зон, висоти головних частин (L.mains — головні частини кожної зони; за ними міряється H), межі на екрані,
    проміжок до стіни, проміжки між зонами (SEP), перетини (INTERSECT) і що за стіною (BEHIND WALL)"""
    Zi = {}
    for it in L['items']:
        if it.get('layer') == 'up': continue
        Zi.setdefault(it['zone'], []).append(it)
    print(f'== {name}:', {k: round(v, 3) for k, v in L['scales'].items()} if Zi else 'лише стіни (зон немає)')
    if not Zi:
        bad, behind = check(L); print('  INTERSECT:', bad if bad else 'none'); print('  BEHIND WALL:', behind if behind else 'none')
        return bad, behind
    MAINS = L.get('mains', {})
    hs = {k: screen_ext(v, MAINS[k]) for k, v in Zi.items()}
    hmax = max(e[3] - e[2] for e in hs.values())
    for k, e in hs.items():
        a = screen_ext(Zi[k]); print(f"  {k:9s} main h {e[3] - e[2]:5.0f} ({(e[3] - e[2]) / hmax * 100:5.1f}%) | all x {a[0]:.0f}..{a[1]:.0f} y {a[2]:.0f}..{a[3]:.0f}")
    # відстань до стіни (найближча точка сліду зони до дуги) і чи зони окремі на екрані (власник: «зони не мають зливатись»)
    Wl = catmull([tuple(p) for p in L['wall']], 6); ext = {}
    for k, v in Zi.items():
        a = screen_ext(v); m = screen_ext(v, MAINS[k]); ext[k] = (a, m)
        gap = min(seg_d((px, pz), Wl[i], Wl[i + 1]) for it in v for px, pz in fpr(it) for i in range(len(Wl) - 1))   # до стіни (з вікном і дуги)
        zf = min(pz for it in v for px, pz in fpr(it)); yf = 220 + (FL - 220) * s(zf)
        print(f"  {k:9s} wall gap {gap:5.1f} | main x {m[0]:.0f}..{m[1]:.0f} | front: z {zf:.0f}, floor line y {yf:.0f}")
    if L.get('arm'):
        P = [P3(*p) for p in L['arm']]; print(f"  arm: x {min(p[0] for p in P):.0f}..{max(p[0] for p in P):.0f} y {min(p[1] for p in P):.0f}..{max(p[1] for p in P):.0f} (осі ланок)")
    ks = sorted(ext, key=lambda k: ext[k][1][0])
    for a_, b_ in zip(ks, ks[1:]):
        print(f"  SEP {a_} | {b_}: main {ext[b_][1][0] - ext[a_][1][1]:+.0f}  all {ext[b_][0][0] - ext[a_][0][1]:+.0f}")
    bad, behind = check(L); print('  INTERSECT:', bad if bad else 'none'); print('  BEHIND WALL:', behind if behind else 'none')
    return bad, behind

# ===================================== ПЛАН ЗВЕРХУ (картинка) =====================================
ZCOL = {'workshop': (255, 79, 216), 'tools': (59, 232, 255), 'portal': (217, 138, 255), 'marketing': (255, 122, 208), 'analytics': (122, 244, 255), 'ai': (138, 200, 255)}
def plan_png(out, path):
    from PIL import Image, ImageDraw
    S = .78; x0, z1 = -140, 240; W, H = int(1860 * S), int(420 * S)
    T = lambda x, z: ((x - x0) * S, (z1 - z) * S)
    im = Image.new('RGB', (W, H), (10, 8, 26)); d = ImageDraw.Draw(im)
    for X in (0, 1536):                                                           # краї кадру (промені від ока)
        d.line([T(774 + (X - 774) / s(-170), -170), T(774 + (X - 774) / s(230), 230)], fill=(50, 50, 80))
    d.line([T(JAMB_L, JZ), T(JAMB_R, JZ)], fill=(80, 170, 255), width=4); d.text(T(740, JZ + 22), 'WINDOW', fill=(80, 170, 255))
    for nm, L in out.items():
        Wc = catmull([tuple(p) for p in L['wall']], 6); d.line([T(*p) for p in Wc], fill=(170, 130, 255), width=3)
        if 'mezz' in L: d.line([T(*p) for p in catmull([tuple(p) for p in L['mezz']['edge']], 4)], fill=(255, 79, 216), width=2)
        if 'hub' in L:
            hu = L['hub']; ta = math.radians(hu['turn']); dx, dz = hu['w'] / 2 * math.cos(ta), -hu['w'] / 2 * math.sin(ta)
            d.line([T(hu['x'] - dx, hu['z'] - dz), T(hu['x'] + dx, hu['z'] + dz)], fill=(59, 232, 255), width=3)
        for it in L['items'] + L['cols']:
            col = ZCOL.get(it.get('zone'), (255, 210, 122) if it.get('layer') == 'up' else (120, 110, 200))
            d.polygon([T(*p) for p in fpr(it)], outline=col)
        for h in L.get('hang', []): d.ellipse([T(h['x'], h['z'])[0] - 2, T(h['x'], h['z'])[1] - 2, T(h['x'], h['z'])[0] + 2, T(h['x'], h['z'])[1] + 2], outline=(80, 200, 120))
        for zn in {it.get('zone') for it in L['items'] if it.get('zone')}:
            pts = [p for it in L['items'] if it.get('zone') == zn for p in fpr(it)]
            cx = sum(p[0] for p in pts) / len(pts); cz = sum(p[1] for p in pts) / len(pts); d.text(T(cx - 28, cz + 6), zn.upper(), fill=(255, 255, 255))
    # диван (ближче до глядача — NX.cfg.SOFA_Y): передній край на підлозі там, де його лінія на екрані; ширина — як на екрані
    sy = SOFA_Y; sk = sofa_k(sy); zf = D * (FL - 220) / (sy - 220) - D; sw = 234 * sk / s(zf)
    d.rectangle([T(774 - sw / 2, zf + 45), T(774 + sw / 2, zf)], outline=(160, 120, 220)); d.text(T(774 - 14, zf + 30), 'SOFA', fill=(200, 160, 255))
    d.text((8, H - 16), 'top view: x right, z into the room (window at the top); eye at (774, -520) below the picture', fill=(120, 120, 160))
    im.save(path)

DEFAULT = {
 # 29.10 (власник): «починаємо з нуля» — і зони по черзі (docs/HANDOFF.md). n — скільки зон ланцюжка (дальня -> середня ->
 # найближча); H — висоти головних частин зон на екрані по позиціях [дальня, середня, найближча]: перші — найбільші, далі на
 # ~25 % менші ([h, .75h, .56h]); far.X_in — край дальньої зони біля дивану (екранний x; за диван — щонайбільше трішки),
 # gap — до стіни з вікном, front — лінія підлоги під її передом на екрані (ближче до глядача); gz / gs — проміжок до
 # попередньої зони (у плані / на екрані), gw — до стіни.
 # Крок 1 (29.10): перші зони — майстерня (ближча: front 355 — Nexi ходить від y 358, тож завжди перед нею) і маркетинг.
 "R": 225, "xf": 1200, "H": [240, 180, 135],
 "right": {"n": 1, "far": {"X_in": 893, "gap": 6, "front": 355}, "gz": 3, "gw": 4, "gs": 2},
 "left": {"n": 1, "far": {"X_in": 655, "gap": 6}, "gz": 3, "gw": 4, "gs": 2},
}
V1 = {
 # ПОПЕРЕДНЯ СПРОБА (28.10). Тоді власник: «усі 6 зон важливі — однакові за розміром, кожна — як та, що навпроти; рівномірно, впритул; лише столи й
 # екрани». H — СПІЛЬНА висота головних частин кожної зони на екрані (px): масштаб кожної зони підбирається під неї
 # (fit_far / fit_chain); 173 — найбільша, за якої обидва крила вміщаються від дивану до краю кадру. Зони ЛАНЦЮЖКОМ уздовж
 # стіни: дальня біля вікна — прямо, її край біля дивану (X_in — екранний x; за диван — щонайбільше трішки); середня й
 # найближча — спиною до дуги, кожна впритул до попередньої (gz — проміжок у плані, од. світу; gs — на екрані, px), gw — до стіни.
 # cols: [межа (0 — дальня|середня, 1 — середня|найближча), верх, ширина, глибина] — тонка колона в щілині біля стіни,
 # лише якщо ні з чим не перетинається.
 "R": 225, "xf": 1200, "H": 173,
 "right": {"zones": ["workshop_v1", "tools", "portal"], "far": {"X_in": 893, "gap": 6}, "gz": 3, "gw": 4, "gs": 2,
           "hub": {"x0": WR + 6, "z": 181, "w": 112, "turn": 6},
           "cols": [[1, 64, 12, 8]],                                                 # колона-опора антресолі — між інструментами й порталом
           "mz": {"w": 70, "phi0": 45, "phi1": 101, "yt": 40, "yb": 64, "bots": [52, 56, 60], "cube": 64.5, "pots": [47.5, 69, 74], "gold": [[79, "lantern"], [84, "g"], [90, "g"]], "fern": 112,
                  "hang": [[48, 50, "vine"], [53, 30, "lamp"], [63, 44, "vine"], [68, 26, "lamp"], [74, 36, "vine"], [80, 30, "vine"]]}},
 "left": {"zones": ["marketing_v1", "analytics", "aicenter"], "far": {"X_in": 655, "gap": 6}, "gz": 3, "gw": 4, "gs": 2,
          "cols": [[1, -240, 12, 8]],                                              # колона — між аналітикою й AI-центром (дзеркально до опори антресолі)
          "shelves": [{"y": -10, "a0": 12, "a1": 40, "dep": 14, "items": [[15, "trail"], [20.5, "books"], [26, "flower"], [30, "jar"], [33.5, "pot"], [38, "trail"]]},
                      {"y": 34, "a0": 15, "a1": 37, "dep": 12, "items": [[18, "flower"], [23.5, "lamp"], [29, "trail"], [34, "pot"]]}],
          "hang": [[78, 30, -60, 90, "vine"], [86, 26, -60, 70, "vine"], [55, 40, -60, 50, "vine"], [62.5, 40, -40, 60, "red"]]},
}

ALL3 = json.loads(json.dumps(DEFAULT)); ALL3['right']['n'] = ALL3['left']['n'] = 3   # перевірка наперед: чи вмістяться наступні зони (заготовки 28.10)
PRESETS = {'base': DEFAULT, 'v1': V1, 'all3': ALL3}

def write_js(out):
    """вшити розкладку в js/objects/arc_layout.js (рядок NX.arcLayout = {...};) — її малює 3D (objects/arc_scene.js)"""
    p = os.path.join(REPO, 'js', 'objects', 'arc_layout.js'); src = open(p, encoding='utf8').read()
    new, n = re.subn(r'NX\.arcLayout = \{.*?\};( *//[^\n]*)?\n', lambda m: 'NX.arcLayout = ' + json.dumps(out, separators=(',', ':'), ensure_ascii=False) + ';   // згенеровано tools/wingbox/gen_room.py\n', src, count=1, flags=re.S)
    assert n == 1, 'не знайшов NX.arcLayout у arc_layout.js'
    open(p, 'w', encoding='utf8').write(new); print('записано в', os.path.relpath(p, REPO))

if __name__ == '__main__':
    import argparse
    ap = argparse.ArgumentParser(description='розкладка обох крил «по дузі» для js/objects/arc_layout.js')
    ap.add_argument('out', nargs='?', default=os.path.join(HERE, 'layout.json'), help='куди записати розкладку (JSON)')
    ap.add_argument('--params', help='JSON з параметрами (за замовчуванням — DEFAULT у цьому файлі)')
    ap.add_argument('--preset', choices=sorted(PRESETS), default='base', help='готові параметри: base — поточна розкладка (DEFAULT), v1 — попередня спроба з 6 зонами (28.10), all3 — DEFAULT з усіма трьома зонами на крило (перевірка, чи вмістяться наступні)')
    ap.add_argument('--write', action='store_true', help='також вшити в js/objects/arc_layout.js')
    ap.add_argument('--plan', help='намалювати план зверху (PNG)')
    a = ap.parse_args()
    prm = json.load(open(a.params)) if a.params else PRESETS[a.preset]
    print(f'вікно {WL:.0f}..{WR:.0f} (відкоси на глибині {JZ}: x світу {JAMB_L:.1f} / {JAMB_R:.1f})')
    out = {}
    for name, sgn in (('right', 1), ('left', -1)):
        L = build_side(prm, sgn); report(L, name); out[name] = L
    json.dump(out, open(a.out, 'w'), indent=1, ensure_ascii=False)
    if a.plan: plan_png(out, a.plan)
    if a.write: write_js(out)
