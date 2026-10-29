# tools/wingbox/gen_room.py — РОЗКЛАДКА ОБОХ КРИЛ «по дузі» для js/objects/arc_layout.js (її малює 3D objects/arc_scene.js)
# ----------------------------------------------------------------------------------------------------
# Кімната зверху — пів кола: вікно в найдальшій точці (z = 185), обабіч — коротка пряма стіна до xf, далі стіна
# загинається дугою (центр C, радіус R) до глядача. Стіни дзеркальні відносно центру вікна x = 774.
# ЧИСТА ОСНОВА (власник, 29.10): зони додаються ПО ЧЕРЗІ, по кроку (docs/HANDOFF.md):
#   "n" у крила — скільки зон ланцюжка будувати (0..3): праворуч майстерня -> інструменти -> портал, ліворуч маркетинг ->
#   аналітика -> AI-центр (від вікна до глядача); "H" — висоти головних частин зон на екрані (px), по позиціях
#   [дальня, середня, найближча] або одне число для всіх (власник: перші — найбільші, далі на ~25 % менші: [h, .75h, .56h]).
#   Крок 1 (29.10) — перші зони: майстерня й маркетинг (n 1). "zones" у крила — які заготовки брати (за замовчуванням нові).
#   Кроки 5–8 (29.10) — середні зони: аналітика й інструменти (n 2, H 300); як їх ставити — "mid" у крила: {"turn": 20, "fv": 1.25}
#   — намальовані так, ніби ми стоїмо перед ними (фронтальний зсув, як перші зони; fv > 1 — око ще трохи назовні), і повернуті на
#   20° до середини кімнати: видно ЗОВНІШНІЙ бік (front_items); без fv — у перспективі кімнати (chain: {"turn": 20} — крок 6,
#   --preset turn6; без turn — лицем до центру дуги, ~52°: --preset arc); {"fv": 1} без turn — просто фронтально (--preset front);
#   "gs" у mid — свій проміжок на екрані (< 0 — трішки заходить на дальню зону).
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
#   python3 tools/wingbox/gen_room.py [out.json] [--params p.json | --preset v1|all3|front|arc|turn6] [--plan plan.png] [--write]
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
        self.arm = None; self.armv = 0; self.m = 1.; self.anchors = {}
    def add(self, id, X0, X1, Y0, Y1, v, d, st, **kw):
        self.comps.append(dict(id=id, X=(X0, X1), Y=(Y0, Y1), v=v, d=d, st=st, **kw)); return (X0, X1, Y0, Y1)
    def plant(self, id, X0, X1, Y0, Y1, v, d, fw, fh, st='pot', **kw):
        return self.add(id, X0, X1, Y0, Y1, v, d, st, plant=1, fw=fw, fh=fh, cyl=kw.pop('cyl', 10), **kw)
    def anchor(self, name, X, Y, v):
        """точка зони для живого шару й Nexi (голограма, крісло, де стати…): px картинки (X, Y) і відступ углиб v"""
        self.anchors[name] = (X, Y, v)

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
FRAME_STY = dict(bev=1.8, ins=3.6, nIn=1.4, nW=1.1)                                # px картинки (place переводить в од. світу)
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
    """МАЙСТЕРНЯ (СКІНИ) — крок 2 (власник, 29.10: «краще в 4 рази; дивимося прямо; голограма Nexi з різними скінами; щоб він
    туди ставати міг»). Фронтально (far.fv): видно лице й ВНУТРІШНІ грані капсули — глибина без бокових стінок.
      платформа (фасад — arc_paint.js ws_base) -> подіум капсули -> світний пад (тут стає Nexi, з нього б'є голограма)
      -> стійки (внутрішні грані — світлові панелі) -> рожеве скло сканера в глибині -> балка (знизу — панель світла) з
      вивіскою -> купол з кріпленням маніпулятора; бічні панелі; проєктори голо-панелей СКІНИ й АКСЕСУАРИ (самі панелі —
      живі голограми без рамки: objects/workshop.js; Правки зон · 2).
    Живе (objects/workshop.js): голограма Nexi, що змінює скіни, маніпулятор (рухається), сканування, «встановлення» скіна."""
    Z = Zone('workshop', 1005, 358, ('ws_base', 'ws_beam', 'ws_postL')); Z.m = 1.4
    FS = dict(sty=FRAME_STY)                                                         # великі частини — товщі фаска, шов і неоновий кант
    Z.add('ws_base', 896, 1114, 328, 358, 0, 76, 'base')                             # фасад — малюнок (arc_paint.js: ws_base)
    Z.add('ws_dais', 920, 1090, 320, 328, 6, 64, 'base', on='ws_base')
    Z.add('ws_pad', 983, 1027, 316, 320, 12, 32, 'dark', on='ws_dais', cyl=24, band=1)   # пад: середина в плані — v 28
    mirror(Z, 'ws_wing', 896, 920, 224, 328, 14, 54, 'frame', ch=(10, 0), on='ws_base', **FS)
    mirror(Z, 'ws_post', 920, 958, 206, 320, 10, 54, 'frame', on='ws_dais', **FS)
    Z.add('ws_back', 958, 1052, 206, 320, 46, 8, 'frame', on='ws_dais')              # рожеве скло сканера — глибоко: капсула об'ємна
    Z.add('ws_beam', 908, 1102, 166, 206, 6, 58, 'frame', ch=(16, 16), **FS)
    sign(Z, 'ws_sign', 948, 1062, 168, 202, 3.4, 2.4, 'nav.workshop', NEON_P)
    # купол на балці (три зрізані конуси — округлий, як на картинці) і кріплення маніпулятора; середина в плані — v 36.5
    Z.add('ws_dome', 963, 1047, 152, 166, 14.5, 44, 'dome', on='ws_beam', cyl=24, kt=.84, band=1)
    Z.add('ws_dome2', 970, 1040, 142, 152, 18, 37, 'dome', on='ws_dome', cyl=22, kt=.7)
    Z.add('ws_cap', 980, 1030, 136, 142, 23.5, 26, 'dome', on='ws_dome2', cyl=18, kt=.62)
    Z.add('ws_mount', 995, 1015, 124, 136, 27.5, 18, 'dark', on='ws_cap', cyl=14)
    # ГОЛО-ПАНЕЛІ СКІНИ / АКСЕСУАРИ (Правки зон · 2, власник: «панелі зі скінами та аксесуарами зроби голографічними та
    # безрамочними; довшими до низу й трохи ширшими»): корпусів і ніжок більше немає — панелі світять живою голограмою
    # (objects/workshop.js: HPANES — X 896..950 / 1060..1114, Y 236..318, було 899..943 × 236..300), тут — лише плоскі
    # проєктори на передньому краї платформи, з яких вони б'ють (кришка з лінзою — ws_paint.js: ws_projL / ws_projR)
    mirror(Z, 'ws_proj', 907, 939, 324, 328, .6, 5, 'dark', on='ws_base', ch=(2, 2))     # перед подіумом (він — з v 6)
    Z.anchor('wsPad', 1005, 316, 28); Z.anchor('wsFront', 1005, 358, -9); Z.anchor('wsArm', 1005, 125, 36.5)
    Z.anchor('wsBeamBot', 1005, 206, 30); Z.anchor('wsTabL', 923, 277, 3); Z.anchor('wsTabR', 1087, 277, 3)   # середини голо-панелей
    Z.anchor('wsProjL', 923, 324, 3.1); Z.anchor('wsProjR', 1087, 324, 3.1)                                   # лінзи проєкторів (верх кришки)
    Z.arm = [(1005, 128), (1062, 96), (1128, 134), (1114, 158)]; Z.armv = 36.5    # маніпулятор (спокій): база, плече, лікоть, захват
    return Z

def marketing():
    """МАРКЕТИНГ — крок 2 (власник, 29.10: «краще в 4 рази; крісло, на яке Nexi сідає; монітори — трохи голограмні;
    дивимося прямо»). Фронтально (far.fv). Стіл з шухлядами на обох кінцях і панеллю посередині; за ним — екран-будка
    з ГЛИБОКОЮ РАМКОЮ (видно внутрішні грані: світлові смуги) — вивіска вгорі, утоплений голо-екран (стрічка постів, реклама,
    лічильники охоплення); на столі — проєктори голо-моніторів (самі голо-панелі — живі: objects/marketing.js) і голо-клавіатура;
    перед столом — крісло (objects/mk_chair.js), на яке сідає Nexi."""
    Z = Zone('marketing', 589, 337, ('mk_booth', 'mk_desk')); dd = zscale(Z, 282)
    FS = dict(sty=dict(FRAME_STY, neon=NEON_C))
    de = (460, 718, 282, 337)
    Z.add('mk_desk', *de, 0, dd, 'desk')                                             # фасад — малюнок (arc_paint.js: mk_desk)
    bv = dd + 3                                                                      # будка — одразу за столом
    Z.add('mk_booth', 495, 683, 96, 142, bv, 22, 'frame', ch=(12, 12), **FS)         # шапка з вивіскою
    mirror(Z, 'mk_bp', 495, 509, 142, 337, bv, 22, 'frame', **FS)                    # бічні стовпи рамки (внутрішні грані — світло)
    Z.add('mk_bb', 509, 669, 272, 337, bv, 22, 'frame', **FS)                        # нижня полиця рамки (за столом)
    Z.add('mk_screen', 509, 669, 142, 272, bv + 9, 6, 'screen')                       # утоплений голо-екран
    sign(Z, 'mk_sign', 520, 658, 103, 135, bv - 2.4, 2.4, 'nav.marketing', NEON_P)
    for id_, X0 in (('mk_projL', 470), ('mk_projR', 670)):                            # проєктори голо-моніторів на кінцях стола
        Z.add(id_, X0, X0 + 38, 276, 282, dd * .42, 11, 'dark', on='mk_desk')
    Z.anchor('mkChair', 589, 337, -24); Z.anchor('mkKeys', 589, 282, 9); Z.anchor('mkProjL', 489, 276, dd * .42 + 5.5); Z.anchor('mkProjR', 689, 276, dd * .42 + 5.5)
    Z.anchor('mkScreen', 589, 207, bv + 9); Z.anchor('mkDeskTop', 589, 282, 0)
    return Z

# ===================================== КРОК 5 (29.10): СЕРЕДНІ ЗОНИ — АНАЛІТИКА Й ІНСТРУМЕНТИ =====================================
# Власник: «наступні дві зони — аналітика (ліворуч, за маркетингом) та інструменти (праворуч, за майстернею), як на оригінальній
# картинці; десь на 25 % менші (H 180); головні екрани — по центру своїх столів; спершу лише столи й екрани, без дрібних
# елементів; якість — як у маркетингу й майстерні». Координати — px картинки кімнати (assets/room.webp), заміряні з оригіналу
# (аналітика: рамка 332..462 з вивіскою й двома екранами, стіл 300..515; інструменти: панель 1167..1300 з вивіскою, рядом із трьох
# плиток і двома екранами знизу, верстак 1146..1306); усе симетричне відносно Xref (екрани — рівно по центру стола). Як зону
# поставити — фронтально чи лицем до центру дуги — параметр крила "mid" (build_side): обидва варіанти — для вибору власником.
def analytics():
    """АНАЛІТИКА — «ОБСЕРВАТОРІЯ ДАНИХ» (крок 9, власник: «вклади в ці дві зони душу: більше графіки, унікальності, фішок; простір
    для ніг між тумбочками, унікальні краї; екрани — пласкі, як голо-панелі, зрідка глючать; столи не однакові»). Спокійна,
    наукова: холодний блакитний і фіолет, теплі акценти (кава, латунь), плавні форми.
      СТІЛ: скляна стільниця (an_top) з ЗАОКРУГЛЕНИМ зовнішнім кінцем (an_topR — циліндр, звисає за тумбу) і живою стрічкою
      ПРОДАЖІ по кромці; знизу — блакитне підсвічування (an_glow: світить і на підлогу); ліворуч — тумба з шухлядами (an_pedL),
      праворуч — серверна стійка з вогниками (an_pedR); між ними — ПРОСТІР ДЛЯ НІГ: у глибині панель з «трубою даних», по якій
      біжать імпульси (an_knee), хромована підставка для ніг (an_kick). На стільниці — голо-проєктор (an_puck: з нього росте
      3D-діаграма, коли Nexi працює) і чашка кави з парою (an_mug).
      ЕКРАН — КУПОЛ ОБСЕРВАТОРІЇ (крок 11, власник: «з екраном аналітики перебор — треба простіше; або хоч якийсь фон, бо дуже
      цегляну стіну видно; спробуй ще щось»): гало-кільця, трьох панелей-крил, радара й світлових завіс (крок 10) більше немає.
      За столом на стіні — КУПОЛ (an_dome, форма st:dome: тонка плита темного скла з аркою вгорі — ледь видимі зорі й ребра
      купола, неоновий кант по арці; ховає цеглу), угорі в ньому — вивіска, нижче — ОДИН широкий плаский голо-екран (привид
      an_scr — не малюється: вісь екрана, за ним екран по центру стола; живий: objects/analytics.js). Проєктор — на правому краї
      стільниці (там його не закриває Nexi в кріслі). Перед столом — крісло (objects/an_chair.js, якір anChair).
    Розміри — як у кроці 8 (власник: «це вже інша справа»): стіл 74 заввишки, купол ~210 завширшки."""
    Z = Zone('analytics', 399, 340, ('an_dome', 'an_pedL')); Z.m = 1.; dd = 52
    # --- стіл: стільниця з заокругленим зовнішнім кінцем, тумба й серверна стійка, простір для ніг ---
    Z.add('an_top', 313, 513, 266, 280, -2, dd + 4, 'desk', grp='an_top')            # скляна стільниця (кромка — стрічка ПРОДАЖІ)
    Z.add('an_topR', 299, 327, 266.05, 280, -2, dd + 4, 'desk', cyl=28, grp='an_top')   # заокруглений зовнішній кінець (пів-еліпс у плані; верх — на волосину нижче: без мерехтіння з an_top)
    Z.add('an_pedL', 315, 363, 280, 340, 2, dd - 6, 'desk')                          # тумба з шухлядами
    Z.add('an_pedR', 459, 507, 280, 340, 2, dd - 6, 'term')                          # серверна стійка (вогники — живі)
    Z.add('an_knee', 363, 459, 282, 334, dd - 12, 4, 'dark')                         # у глибині простору для ніг — «труба даних»
    Z.add('an_kick', 363, 459, 326, 330, 12, 5, 'chrome')                            # підставка для ніг (між тумбою й стійкою)
    Z.add('an_glow', 315, 509, 280, 281.6, 0, 1.6, 'clamp', glow=1, gr=48)           # підсвічування під стільницею (і на підлогу)
    Z.add('an_puck', 455, 491, 261, 266, 18, 26, 'dark', cyl=20, band=1, on='an_top')   # голо-проєктор на правому краї (3D-діаграма — жива, коли Nexi працює)
    Z.add('an_mug', 319, 331, 254, 266, 10, 12, 'mug', cyl=14, on='an_top')          # чашка кави (пара — жива)
    # --- купол обсерваторії на стіні: вивіска вгорі, привид екрана ---
    Z.add('an_dome', 300, 512, 58, 292, 72, 2.5, 'dome')                             # купол: плита темного скла з аркою вгорі (низ — за столом)
    sign(Z, 'an_sign', 316, 496, 104, 130, 69, 2.4, 'nav.analytics', NEON_C)        # вивіска — угорі в куполі
    Z.add('an_scr', 405, 407, 140, 240, 62, 1, 'dark', ghost=1)                      # привид — вісь екрана (X 406, v 62): за ним екран по центру стола
    Z.anchor('anChair', 366, 340, -32); Z.anchor('anDeskTop', 366, 266, 0); Z.anchor('anScreen', 406, 190, 62)
    Z.anchor('anPuck', 473, 261, 31); Z.anchor('anMug', 325, 254, 16)
    DESK = ('an_top', 'an_topR', 'an_pedL', 'an_pedR')
    Z.vc = [(DESK, ('an_dome', 'an_sign'), ()), (DESK, ('an_scr',), ('anScreen',))]  # купол з вивіскою й екран — кожне по центру стола
    return Z

def tools():
    """ІНСТРУМЕНТИ — «МАЙСТЕРНЯ ІНТЕГРАЦІЙ» (крок 9). Індустріальна, енергійна: сталь, помаранчеве робоче світло, попереджувальні
    смуги, заклепки, кабелі.
      ВЕРСТАК на козлах: товста сталева стільниця (tl_top) з помаранчевою кромкою; чотири ніжки (tl_legFL/FR/BL/BR), між ними —
      ВІДКРИТО (простір для ніг), хрестові розпірки збоку й ззаду (tl_brR, tl_brL, tl_brB — форма «brace»: трубки навхрест),
      унизу — полиця (tl_shelf) з червоним ящиком інструментів (tl_box) і бухтою кабелю (tl_coil). На стільниці — хаб інтеграцій
      з портами (tl_hub; антена й потік даних до карток — живі, objects/tools.js), на зовнішньому кінці — ЛЕЩАТА (tl_viseB/J: іскри — живі).
      ЕКРАНИ — КОЗЛОВИЙ ПІДЙОМНИК (крок 10, власник: «екрани громосткі в профіль; треба інноваційні, футуристичні, кіберпанк»):
      шафи-панелі більше немає — за верстаком тонкий сталевий портал: двотаврова балка (tl_beam; на зовнішньому кінці —
      маячок посередині, живий) на двох тонких стійках (tl_postL/R), уздовж стійок звисають кабелі (tl_cblL/R, форма st:cable),
      на кінцях балки — два прожектори-проєктори (tl_podL/R), під нею на тягах (tl_hangL/R) висить вивіска; голо-картки ПОШТА / КАЛЕНДАР / CRM і АВТО / API —
      пласкі, без рамки, висять між стійками (живі: objects/tools.js); привид tl_scr (ghost) — для центрування й базису карток.
      Унизу між стійками, за верстаком — перфодошка (tl_back: гнізда, інструменти на гачках — видно крізь простір для ніг).
    Розміри — як у кроці 8: верстак 72 заввишки, портал ~220 завширшки."""
    Z = Zone('tools', 1230, 357, ('tl_beam', 'tl_legFL')); Z.m = 1.; dd = 50
    # --- верстак на козлах ---
    Z.add('tl_top', 1127, 1333, 285, 297, -2, dd + 4, 'brushed')                     # сталева стільниця (кромка — помаранчеве світло)
    for id_, X0, v in (('tl_legFL', 1131, 1), ('tl_legFR', 1319, 1), ('tl_legBL', 1131, dd - 8), ('tl_legBR', 1319, dd - 8)):
        Z.add(id_, X0, X0 + 10, 297, 357, v, 6, 'col')                                # ніжки
    Z.add('tl_brR', 1320, 1328, 300, 329, 7, dd - 15, 'brace')                       # розпірка навхрест — на зовнішньому боці
    Z.add('tl_brL', 1132, 1140, 300, 329, 7, dd - 15, 'brace')                       # і на внутрішньому
    Z.add('tl_brB', 1141, 1319, 300, 329, dd - 6, 2, 'brace')                        # ззаду (видно крізь простір для ніг)
    Z.add('tl_shelf', 1141, 1319, 329, 333, 3, dd - 4, 'col')                        # нижня полиця (між ніжками)
    Z.add('tl_box', 1150, 1200, 312, 329, 10, 22, 'toolbox', on='tl_shelf')         # червоний ящик інструментів
    Z.add('tl_coil', 1262, 1296, 318, 329, 10, 28, 'dark', cyl=22, band=1, on='tl_shelf')   # бухта кабелю (світна смуга)
    Z.add('tl_hub', 1196, 1264, 273, 285, 12, 22, 'term', on='tl_top')              # хаб інтеграцій (порти; антена й потік даних до карток — живі)
    Z.add('tl_viseB', 1298, 1324, 279, 285, 6, 20, 'col', on='tl_top')               # лещата: основа
    Z.add('tl_viseJ', 1300, 1322, 270, 279, 8, 12, 'chrome', on='tl_viseB')          # лещата: губки (іскри — живі)
    # --- козловий підйомник: балка на двох стійках, кабелі, проєктори, вивіска на тягах; перфодошка внизу; привид карток ---
    Z.add('tl_beam', 1120, 1340, 83, 95, 61, 10, 'gantry')                          # двотаврова балка (маячок — живий)
    for id_, X0 in (('tl_postL', 1128), ('tl_postR', 1326)):
        Z.add(id_, X0, X0 + 6, 95, 357, 63, 6, 'gantry')                              # тонкі стійки (за верстаком)
    Z.add('tl_back', 1137, 1323, 281, 357, 67, 3, 'board')                           # перфодошка внизу (за верстаком)
    for id_, X0 in (('tl_cblL', 1135), ('tl_cblR', 1319)):
        Z.add(id_, X0, X0 + 6, 96, 272, 63, 2, 'cable')                               # кабелі вздовж стійок (форма st:cable)
    for id_, X0 in (('tl_podL', 1123), ('tl_podR', 1321)):
        Z.add(id_, X0, X0 + 16, 75, 83, 60, 7, 'pod', on='tl_beam')                   # прожектори-проєктори на кінцях балки (промінь на картки — живий)
    for id_, X0 in (('tl_hangL', 1176), ('tl_hangR', 1282)):
        Z.add(id_, X0, X0 + 2, 95, 108, 60.5, 2, 'chrome', cyl=8)                     # тяги вивіски (за нею)
    sign(Z, 'tl_sign', 1140, 1320, 104, 130, 57.6, 2.4, 'nav.tools', NEON_C, st='board')
    Z.add('tl_scr', 1141, 1319, 134, 266, 52, 1, 'dark', ghost=1)                   # привид карток (площина v 52)
    Z.anchor('tlFront', 1230, 357, -12); Z.anchor('tlBenchTop', 1230, 285, 0); Z.anchor('tlTiles', 1230, 162, 52)
    Z.anchor('tlHub', 1230, 273, 23); Z.anchor('tlAnt', 1254, 273, 28); Z.anchor('tlVise', 1311, 270, 14); Z.anchor('tlBeacon', 1230, 83, 62)
    BENCH = ('tl_top', 'tl_legFL', 'tl_legFR')
    Z.vc = [(BENCH, ('tl_beam', 'tl_postL', 'tl_postR', 'tl_back', 'tl_cblL', 'tl_cblR', 'tl_podL', 'tl_podR'), ('tlBeacon',)),
            (BENCH, ('tl_sign', 'tl_hangL', 'tl_hangR'), ()), (BENCH, ('tl_scr',), ('tlTiles',))]   # кожне — по центру верстака окремо
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

def tools_v1():
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

def analytics_v1():
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
BUILDERS = {'workshop': workshop, 'workshop_v1': workshop_v1, 'tools': tools, 'tools_v1': tools_v1, 'portal': portal,
            'marketing': marketing, 'marketing_v1': marketing_v1, 'analytics': analytics, 'analytics_v1': analytics_v1, 'aicenter': aicenter}
ZONES = {'right': ('workshop', 'tools', 'portal'), 'left': ('marketing', 'analytics', 'aicenter')}   # від вікна до глядача

# ===================================== РОЗМІЩЕННЯ =====================================
KEYS = ('on', 'deco', 'plant', 'glow', 'gcol', 'cyl', 'kt', 'kb', 'band', 'notop', 'leaf', 'gr', 'hangs', 'bloom', 'leaves', 'grp', 'ghost')
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
    W = lambda X, Y, v: [round(ax + r[0] * (X - Z.Xref) * m * kx - f[0] * v * m, 2), round(FL - (Z.Yfloor - Y) * m, 2), round(az + r[1] * (X - Z.Xref) * m * kx - f[1] * v * m, 2)]
    if Z.arm: Z.armw = [W(X, Y, Z.armv) for X, Y in Z.arm]
    Z.anchw = {k: W(*a) for k, a in Z.anchors.items()}
    return out
def frontal(Z, items, ax, az, fv=1.):
    """ФРОНТАЛЬНИЙ ВИГЛЯД ДАЛЬНЬОЇ ЗОНИ (власник, 29.10: «на ці відділи ми дивимося прямо — перспектива пряма»).
    Зсув у плані x + K·(z − z0) (z0 — передня лінія зони) з K = fv · (xc − 774) / (D + z0): тоді в перспективі кімнати зона
    виглядає так, ніби око стоїть прямо перед її серединою xc — бокових граней не видно, дальнє рівно за ближнім (fv 1 —
    повністю прямо). Рушій (arc_kit.js basis, plan.py frame) зсуває грані за B.sh = [K, z0]; точки руки й якорі — тут."""
    K = fv * (ax - 774) / (D + az); sh = [round(K, 6), round(az, 3)]
    for it in items: it['sh'] = sh
    shp = lambda p: [round(p[0] + K * (p[2] - az), 2), p[1], p[2]]
    if Z.arm: Z.armw = [shp(p) for p in Z.armw]
    Z.anchw = {k: shp(p) for k, p in Z.anchw.items()}
    return items
SIGN_W, SIGN_H = 150, 30                                                            # вивіска зони на екрані — ОДНАКОВА для всіх зон (од. кімнати)
def sign_size(items):
    """власник, 29.10: «заголовки об'єктів взаємодії — однакові всюди, незалежно від розмірів об'єкта»: вивіска (id *_sign)
    отримує той самий розмір на екрані SIGN_W × SIGN_H (середина — на місці), шрифт — спільний (arc_paint.js: signFit)"""
    for it in items:
        if not it['id'].endswith('_sign'): continue
        k = s(it['z']); yc = (it['yt'] + it['yb']) / 2; h = SIGN_H / k; it['yt'] = round(yc - h / 2, 2); it['yb'] = round(yc + h / 2, 2)
        it['w'] = round(SIGN_W / k, 2)
        if it.get('turn') or it.get('sh'):                                         # повернута / зсунута зона: ширина — та, що на екрані (за лицем)
            for _ in range(5):
                xs = [P3(*q)[0] for q in faces(it)[0]['front']]; it['w'] = round(it['w'] * SIGN_W / (max(xs) - min(xs)), 3)
    return items
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
            rho = (a0 + a1) / 2; it = vcenter(Z, place(Z, *at(rho), t, m, kx))           # до стіни — уже з рамкою по центру стола
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
    def cx(ids):                                                                   # середина на екрані — посередині між серединою ЛИЦЬОВИХ граней і серединою всього видимого (з боком)
        # крок 8 рівняли за лицем — власник: «екрани здвинуті до попередніх зон»; крок 9 — за всім видимим (і бік стола, і
        # заокруглений кінець) — «не відцентрував, здається»; око бачить ширину предмета як лице плюс десь половину боку
        e = screen_ext([by[i] for i in ids]); fx = [P3(*q)[0] for i in ids if not by[i].get('cyl') for q in cfaces(by[i])[0]['front']]
        return ((e[0] + e[1]) / 2 + ((min(fx) + max(fx)) / 2 if fx else (e[0] + e[1]) / 2)) / 2
    for ent in getattr(Z, 'vc', []):
        ref, grp = ent[0], ent[1]; anc = ent[2] if len(ent) > 2 else getattr(Z, 'vca', ())   # якорі, що їдуть з цією групою (крок 10: у кожної групи свої)
        ref = (ref,) if isinstance(ref, str) else ref
        tx = tz = 0.
        for _ in range(5):                                                         # група рухається ЦІЛА (частини не роз'їжджаються) уздовж лиця зони
            d = cx(ref) - cx(grp); g0 = by[grp[0]]; a = math.radians(g0.get('turn', 0)); r = (math.cos(a), -math.sin(a)); u = d / (s(g0['z']) * max(.3, r[0]))
            for i in grp: by[i]['x'] = round(by[i]['x'] + r[0] * u, 3); by[i]['z'] = round(by[i]['z'] + r[1] * u, 3)
            tx += r[0] * u; tz += r[1] * u
        K = (by[grp[0]].get('sh') or [0, 0])[0]                                    # фронтальний зсув: x точки ще й залежить від її глибини
        for nm in anc:                                                             # якорі на зсунутій групі (екран) — разом із нею
            if nm in getattr(Z, 'anchw', {}): p = Z.anchw[nm]; Z.anchw[nm] = [round(p[0] + tx + K * tz, 2), p[1], round(p[2] + tz, 2)]
    return items
def far_items(Z, far, sgn):
    """дальня зона: прямо (лицем до глядача) біля стіни з вікном. far: X_in — її край біля дивану на екрані (найближча до
    середини кімнати точка зони), gap — найменший проміжок до стіни з вікном (за замовчуванням зона спиною до неї);
    front (необов'язково) — лінія підлоги під передньою гранню зони на екрані (y): зона ближче до глядача (власник, 29.10:
    «майстерня — ближча»), але не далі від стіни, ніж дозволяє її глибина (спина — щонайбільше JZ − gap)."""
    m = Z.m; vmax = max(c['v'] + c['d'] for c in Z.comps); zb = JZ - far.get('gap', 6)
    if far.get('front'): zb = min(zb, D * (FL - 220) / (far['front'] - 220) - D + vmax * m)
    az = zb - vmax * m; fv = far.get('fv', 0.)
    def placed(ax):
        it = place(Z, ax, az, 0, m)
        if fv: it = frontal(Z, it, ax, az, fv)
        Z.xf = dict(ax=round(ax, 3), az=round(az, 3), m=round(m, 5), Xref=Z.Xref, Yf=Z.Yfloor, sh=it[0].get('sh'))   # як перевести px картинки зони в світ (JS: NX.arc.zone)
        return sign_size(it)
    def edge(ax):                                                                  # найближча до середини точка зони на екрані
        e = screen_ext(placed(ax)); return e[0] if sgn > 0 else e[1]
    lo, hi = 774 - 900, 774 + 900                                                  # X краю росте з ax — бісекція
    for _ in range(40):
        mid = (lo + hi) / 2
        if edge(mid) < far['X_in']: lo = mid
        else: hi = mid
    return vcenter(Z, placed((lo + hi) / 2))
def arc_items(Z, a, C, R, sgn, gap, turn=None):
    """зона спиною до дуги під кутом a (поворот = a: задня грань — уздовж стіни, лицем до центру дуги), впритул до стіни;
    turn — свій поворот (°, у бік середини кімнати; 0 — лицем прямо до глядача): власник, крок 6 — «трохи повернутим до центру
    дуги, не так, як лицем до центру — там перебор», тож зона повернута менше, ніж стіна за нею (задній зовнішній кут — біля стіни)"""
    q = {'a': a, 'gap': gap}
    if turn is not None: q['turn'] = sgn * turn
    ax, az, t = wall_place(Z, q, C, R, sgn)(Z.m)
    Z.xf = dict(ax=round(ax, 3), az=round(az, 3), m=round(Z.m, 5), Xref=Z.Xref, Yf=Z.Yfloor, sh=None, turn=round(t, 3))   # px картинки зони -> світ (з поворотом)
    return sign_size(vcenter(Z, place(Z, ax, az, t, Z.m)))
def front_items(prev, Z, C, R, sgn, gz, gw, gs, mq):
    """СЕРЕДНЯ ЗОНА ФРОНТАЛЬНО (як перші зони: дивимося прямо на неї — frontal, mq.fv; 1 — око прямо перед серединою зони,
    більше — око ще далі назовні) І ТРОХИ ПОВЕРНУТА до середини кімнати (mq.turn, °). Крок 7 (власник: «бокова частина має бути
    з іншого боку; розмір столу — більше, ніж попередній, бо ближче до користувача»): справжнє око стоїть посередині кімнати, і
    в нього зона, повернута менше, ніж на ~52°, показує ВНУТРІШНІЙ бік (до вікна) — так було в кроці 6. Тут зона намальована так,
    ніби ми стоїмо перед нею (як маркетинг і майстерню), а сама вона повернута до центру: її ближчий кінець — ЗОВНІШНІЙ, він
    більший, і видно саме його бік. На екрані — до попередньої зони gs px (< 0 — трішки заходить на неї); у плані — якомога
    глибше, спиною до стіни: найдальша точка сліду — за gw од. від дуги, до попередньої зони — щонайменше gz од. (mq.front —
    натомість лінія підлоги під передом зони на екрані). Рамка з екранами — по центру стола на екрані (Z.vc, vcenter)."""
    m = Z.m; fv = mq.get('fv', 1.); t = sgn * mq.get('turn', 0.); e0 = screen_ext(prev); H0 = zhull(prev)
    def placed(ax, az):
        it = place(Z, ax, az, t, m)
        if fv: it = frontal(Z, it, ax, az, fv)
        Z.xf = dict(ax=round(ax, 3), az=round(az, 3), m=round(m, 5), Xref=Z.Xref, Yf=Z.Yfloor, sh=it[0].get('sh'), turn=round(t, 3))
        return sign_size(vcenter(Z, it))
    def at(az):                                                                    # на глибині az: x — щоб на екрані до попередньої було gs px
        lo, hi = 774 - 1600., 774 + 1600.
        for _ in range(40):
            ax = (lo + hi) / 2; e = screen_ext(placed(ax, az)); gap = e[0] - e0[1] if sgn > 0 else e0[0] - e[1]
            if (gap > gs) == (sgn > 0): hi = ax
            else: lo = ax
        return placed((lo + hi) / 2, az)
    def ok(it): return max(math.hypot(px - C[0], pz - C[1]) for i in it for px, pz in fpr(i)) <= R - gw and pdist(zhull(it), H0) >= gz
    if mq.get('front'): return at(D * (FL - 220) / (mq['front'] - 220) - D)
    lo, hi = -60., float(JZ)
    for _ in range(26):
        mid = (lo + hi) / 2
        if ok(at(mid)): lo = mid
        else: hi = mid
    return at(lo)
def fit_front(prev, Z, C, R, sgn, gz, gw, gs, H, mq, n=7):
    """середня зона фронтально з головними частинами заввишки H px на екрані (масштаб — підбором)"""
    for _ in range(n): Z.m *= H / main_h(Z, front_items(prev, Z, C, R, sgn, gz, gw, gs, mq))
    return front_items(prev, Z, C, R, sgn, gz, gw, gs, mq)
def chain(prev, Z, C, R, sgn, gz, gw, gs, a0=-30., a1=140., turn=None):
    """наступна зона на дузі: найменший кут, за якого між нею й попередньою (prev — предмети) лишається gz од. світу в плані
    і gs px на екрані (ближча зона не заходить на дальшу — нічого одне на одне; gs < 0 — на екрані трішки заходить на неї,
    власник, крок 6: «навіть якщо трохи зайде на попередню зону — нічого страшного, але зовсім трішки»); turn — arc_items"""
    H0 = zhull(prev); e0 = screen_ext(prev)
    def ok(it):
        e = screen_ext(it); gap = e[0] - e0[1] if sgn > 0 else e0[0] - e[1]
        return pdist(zhull(it), H0) >= gz and gap >= gs
    for _ in range(24):
        a = (a0 + a1) / 2
        if not ok(arc_items(Z, a, C, R, sgn, gw, turn)): a0 = a
        else: a1 = a
    return a1, arc_items(Z, a1, C, R, sgn, gw, turn)
def wall_angle(p, C, sgn): return math.degrees(math.atan2(sgn * (p[0] - C[0]), p[1] - C[1]))   # кут точки плану від центру дуги
def main_h(Z, items): e = screen_ext(items, Z.main); return e[3] - e[2]
def fit_far(Z, far, sgn, H, n=8):
    """дальня зона з головними частинами заввишки H px на екрані (масштаб m — підбором; край біля дивану — far.X_in)"""
    for _ in range(n): Z.m *= H / main_h(Z, far_items(Z, far, sgn))
    return far_items(Z, far, sgn)
def fit_chain(prev, Z, C, R, sgn, gz, gw, gs, H, n=7, turn=None):
    """наступна зона ланцюжка з головними частинами заввишки H px на екрані (масштаб і кут на дузі — разом, підбором)"""
    for _ in range(n): Z.m *= H / main_h(Z, chain(prev, Z, C, R, sgn, gz, gw, gs, turn=turn)[1])
    return chain(prev, Z, C, R, sgn, gz, gw, gs, turn=turn)

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
        mq = q.get(('far', 'mid', 'near')[i]) or {}
        if i == 0: it = fit_far(Z, q['far'], sgn, Hs[0])
        elif mq.get('fv') is not None: it = fit_front(zones[-1], Z, C, R, sgn, gz, gw, mq.get('gs', gs), Hs[i], mq); angles[('mid', 'near')[i - 1]] = 'front'   # фронтально (як перші зони), трохи повернута (turn)
        else:                                                                       # спиною до дуги: лицем до її центру або (turn) повернута менше
            a_, it = fit_chain(zones[-1], Z, C, R, sgn, gz, gw, mq.get('gs', gs), Hs[i], turn=mq.get('turn')); angles[('mid', 'near')[i - 1]] = round(a_, 2)
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
    anch = {k: v for Z in zs for k, v in getattr(Z, 'anchw', {}).items()}           # якорі зон (голограма, крісло, де стати…) — світ, уже зі зсувом
    if anch: L['anchors'] = anch
    L['zoneXf'] = {Z.name: Z.xf for Z in zs if getattr(Z, 'xf', None)}               # px картинки зони -> світ (JS: NX.arc.zone; зсув sh, поворот turn)
    L['zoneBox'] = {Z.name: [round(v, 1) for v in screen_ext(it)] for Z, it in zip(zs, zones)}   # межі зони на екрані (тап, span)
    if zs and zs[0].arm:                                                             # маніпулятор майстерні — ЖИВИЙ (objects/arc_holo.js): точки спокою + товщина
        L['armRig'] = dict(pts=zs[0].armw, k=round(zs[0].m / 1.2, 3), zone=zs[0].name)
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
DESKS = ('mk_desk', 'ws_base', 'an_top', 'tl_top', 'mk_screen', 'an_back', 'tl_back')   # столи й екрани (стіни за голо-екранами) зон — для порівняння розмірів на екрані
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
    if L.get('armRig'):
        P = [P3(*p) for p in L['armRig']['pts']]; print(f"  arm: x {min(p[0] for p in P):.0f}..{max(p[0] for p in P):.0f} y {min(p[1] for p in P):.0f}..{max(p[1] for p in P):.0f} (осі ланок, спокій)")
    for k, p in sorted(L.get('anchors', {}).items()):
        X, Y = P3(*p); print(f"  anchor {k:10s} screen ({X:.0f}, {Y:.0f})  world ({p[0]:.0f}, {p[1]:.0f}, {p[2]:.0f})")
    for it in L['items']:                                                          # столи зон на екрані (власник, крок 7: ближчий стіл — більший)
        if it['id'] in DESKS:
            F = faces(it)[0]['front']; P = [P3(*q) for q in F]; xs = [p[0] for p in P]
            hl = abs(P3(*F[0])[1] - P3(*F[3])[1]); hr = abs(P3(*F[1])[1] - P3(*F[2])[1])
            print(f"  {'desk' if it['id'] in DESKS[:4] else 'scr '} {it['id']:9s} screen w {max(xs) - min(xs):5.0f}  h {hl:4.0f} (left) / {hr:4.0f} (right)")
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
 # Крок 2 (29.10): fv 1 — дальні зони ФРОНТАЛЬНО (власник: «на ці відділи ми дивимося прямо»); вивіски — однакові (sign_size).
 # Крок 5 (29.10): n 2 — середні зони: інструменти (праворуч) і аналітика (ліворуч). Показано два варіанти: А — фронтально
 #   (--preset front), Б — лицем до центру дуги (--preset arc). Крок 6 (власник: «трохи повернутим до центру дуги — не так, як
 #   у Б, там перебор, але ефект має бути; рівне не катить; і трохи більше; трохи зайде на попередню — не страшно, але зовсім
 #   трішки»): спиною до дуги, повернуті лише на 20° (у Б — ~52°), рамка — по центру стола на екрані (vcenter), на екрані
 #   можуть зайти на дальню зону до 6 px. Але справжнє око — посередині кімнати, і зона, повернута менше, ніж на ~52°, показує
 #   йому ВНУТРІШНІЙ бік. Крок 7 (власник: «бокова частина має бути з іншого боку, подумай сам; стіл — більше, ніж попередній,
 #   бо ближче до користувача; об'єкти трохи більше»): "mid": {"turn": 20, "fv": 1.25, "gs": -6} — зона намальована так, ніби
 #   ми стоїмо перед нею (як маркетинг і майстерня: фронтальний зсув, fv 1.25 — око ще трохи назовні), а сама повернута на 20°
 #   до центру: її ближчий кінець — ЗОВНІШНІЙ (більший), і видно саме його бік. H середніх — 265 (було 200: ближчі — більші);
 #   столи ширші (1.4× рамки) і вищі — на екрані більші за стіл маркетингу й основу майстерні (report: desk …).
 #   Крок 8 (власник: «не такими довгими — потрібне місце для AI-центру й порталу: на ~30 % коротші в бік попередніх зон; столи
 #   вищі на ~25 %, екрани — на ~30 %»): зони вужчі й вищі (analytics(), tools()), H 300 — на екрані зона на 28 % вужча
 #   (аналітика 166..392 замість 78..392), стіл +25 %, екрани +30 % (report: desk …, scr …).
 #   Крок 9 (власник: «вклади в ці дві зони душу; екрани основні відцентруй»): зони з характером (analytics() — «обсерваторія
 #   даних», tools() — «майстерня інтеграцій»), параметри ті самі; vcenter — за всіма видимими гранями (і боком стола); місце по
 #   краях — як у кроці 8 (аналітика 172..392, інструменти 1161..1391).
 "R": 225, "xf": 1200, "H": [240, 300, 135],
 "right": {"n": 2, "far": {"X_in": 893, "gap": 6, "front": 355, "fv": 1}, "mid": {"turn": 20, "fv": 1.25, "gs": -6}, "gz": 3, "gw": 4, "gs": 2},
 "left": {"n": 2, "far": {"X_in": 655, "gap": 6, "fv": 1}, "mid": {"turn": 20, "fv": 1.25, "gs": -6}, "gz": 3, "gw": 4, "gs": 2},
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
 "right": {"zones": ["workshop_v1", "tools_v1", "portal"], "far": {"X_in": 893, "gap": 6}, "gz": 3, "gw": 4, "gs": 2,
           "hub": {"x0": WR + 6, "z": 181, "w": 112, "turn": 6},
           "cols": [[1, 64, 12, 8]],                                                 # колона-опора антресолі — між інструментами й порталом
           "mz": {"w": 70, "phi0": 45, "phi1": 101, "yt": 40, "yb": 64, "bots": [52, 56, 60], "cube": 64.5, "pots": [47.5, 69, 74], "gold": [[79, "lantern"], [84, "g"], [90, "g"]], "fern": 112,
                  "hang": [[48, 50, "vine"], [53, 30, "lamp"], [63, 44, "vine"], [68, 26, "lamp"], [74, 36, "vine"], [80, 30, "vine"]]}},
 "left": {"zones": ["marketing_v1", "analytics_v1", "aicenter"], "far": {"X_in": 655, "gap": 6}, "gz": 3, "gw": 4, "gs": 2,
          "cols": [[1, -240, 12, 8]],                                              # колона — між аналітикою й AI-центром (дзеркально до опори антресолі)
          "shelves": [{"y": -10, "a0": 12, "a1": 40, "dep": 14, "items": [[15, "trail"], [20.5, "books"], [26, "flower"], [30, "jar"], [33.5, "pot"], [38, "trail"]]},
                      {"y": 34, "a0": 15, "a1": 37, "dep": 12, "items": [[18, "flower"], [23.5, "lamp"], [29, "trail"], [34, "pot"]]}],
          "hang": [[78, 30, -60, 90, "vine"], [86, 26, -60, 70, "vine"], [55, 40, -60, 50, "vine"], [62.5, 40, -40, 60, "red"]]},
}

ALL3 = json.loads(json.dumps(DEFAULT)); ALL3['right']['n'] = ALL3['left']['n'] = 3   # перевірка наперед: чи вмістяться наступні зони (заготовки 28.10)
ARC = json.loads(json.dumps(DEFAULT)); ARC['H'] = [240, 180, 135]                  # крок 5, варіант Б (відхилено: «перебор»): лицем до центру дуги
FRONT = json.loads(json.dumps(ARC))                                                 # крок 5, варіант А (відхилено: «рівне не катить»): фронтально
TURN6 = json.loads(json.dumps(ARC)); TURN6['H'] = [240, 200, 135]                   # крок 6 (відхилено: «бокова частина має бути з іншого боку»): 20° у перспективі кімнати
for _sd in ('right', 'left'): ARC[_sd].pop('mid', None); FRONT[_sd]['mid'] = {'fv': 1}; TURN6[_sd]['mid'] = {'turn': 20, 'gs': -6}
PRESETS = {'base': DEFAULT, 'v1': V1, 'all3': ALL3, 'arc': ARC, 'front': FRONT, 'turn6': TURN6}

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
    ap.add_argument('--preset', choices=sorted(PRESETS), default='base', help='готові параметри: base — поточна розкладка (DEFAULT), v1 — попередня спроба з 6 зонами (28.10), all3 — DEFAULT з усіма трьома зонами на крило (перевірка, чи вмістяться наступні), front / arc — варіанти А / Б кроку 5 (середні зони фронтально / лицем до центру дуги, H 180), turn6 — крок 6 (20° у перспективі кімнати, H 200)')
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
