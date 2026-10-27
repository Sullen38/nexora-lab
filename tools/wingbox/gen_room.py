# tools/wingbox/gen_room.py — РОЗКЛАДКА ОБОХ КРИЛ «по дузі» для js/objects/arc_layout.js (схема rwing_box.js і 3D arc_scene.js)
# ----------------------------------------------------------------------------------------------------
# Кімната зверху — пів кола: вікно в найдальшій точці (z = 185), обабіч — коротка пряма стіна до xf, далі стіна
# загинається дугою (центр C, радіус R) до глядача. Стіни дзеркальні відносно центру вікна x = 774, зони — кожна своя:
#   праворуч (технологічне): майстерня (біля вікна, прямо) -> інструменти -> портал (найближче, лицем до центру кімнати);
#                            екран NEXORA AI на стіні біля вікна, антресоль з ботами, вазонами й золотом, колони
#   ліворуч (затишне):       маркетинг (біля вікна) -> аналітика -> AI-центр зі стелажем (полиці, вазони, чайник-лампа);
#                            настінні полиці вздовж дуги з вазонами, квітами, плющем і книжками, ліани й ліхтар
# Розміри зон — крок 15%: найближча 100, середня 85, дальня 72 (висота головних частин на екрані: HP, HP·.85, HP·.85²).
# Кожна зона зібрана з частин картинки-концепту assets/room.webp: X, Y — прямокутник частини на картинці (пікселі
# кімнати), v — наскільки частина відступає вглиб від передньої лінії зони, d — її глибина. Частини переносяться в 3D
# зони: m — од. світу на піксель картинки, kx — стиснення по ширині проти ширококутного розтягу на краях кадру.
# Перспектива — як у кімнаті (core/persp.js): VP (774, 220), D 520, око (774, 220, -520); підлога y = 372.
# Межі вікна беруться з js/core/config.js (NX.cfg.WIN) — стіни крил починаються від відкосів.
#
#   python3 tools/wingbox/gen_room.py [out.json] [--params p.json] [--plan plan.png] [--write]
#     --write — вшити розкладку в js/objects/arc_layout.js;   --plan — план зверху (PNG)
#   Перевірки друкуються: висоти зон (15%), перетини об'ємів (INTERSECT), що за стіною (BEHIND WALL) — мають бути none.
import json, math, os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__)); REPO = os.path.normpath(os.path.join(HERE, '..', '..'))
sys.path.insert(0, HERE)
from plan import P3, faces, footprint, sep, catmull
FL = 372; D = 520; JZ = 185                                                        # підлога, відстань до екрана, глибина стіни з вікном
def _win():
    m = re.search(r'WIN:\s*\{\s*L:\s*([\d.]+),\s*R:\s*([\d.]+)', open(os.path.join(REPO, 'js', 'core', 'config.js'), encoding='utf8').read())
    return float(m.group(1)), float(m.group(2))
WL, WR = _win()                                                                     # зовнішні краї відкосів на екрані
JAMB_L, JAMB_R = 774 + (WL - 774) * (D + JZ) / D, 774 + (WR - 774) * (D + JZ) / D  # ті самі краї у світі (на глибині JZ)
SHELF_Y = (34, 69, 123, 183, 226, 258)                                              # дошки стелажа AI-центру (y на картинці)
def s(z): return D / (D + z)

def F(x0, x1, y0, y1, X0, X1, Y0, Y1):
    return [round((x0 - X0) / (X1 - X0), 4), round((x1 - X0) / (X1 - X0), 4), round((y0 - Y0) / (Y1 - Y0), 4), round((y1 - Y0) / (Y1 - Y0), 4)]
def FP(x, y, X0, X1, Y0, Y1): return [round((x - X0) / (X1 - X0), 4), round((y - Y0) / (Y1 - Y0), 4)]

class Zone:
    def __init__(self, name, Xref, Yfloor, main):
        self.name, self.Xref, self.Yfloor, self.main, self.comps = name, Xref, Yfloor, main, []
        self.arm = None; self.armv = 0
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

# ===================================== ПРАВЕ КРИЛО =====================================
def workshop():
    Z = Zone('workshop', 1005, 358, ('ws_base', 'ws_beam', 'ws_dome'))
    b = Z.add('ws_base', 905, 1105, 324, 358, 0, 42, 'base', deco=[dict(t='l', f=[0, .04, 1, .04], col=NEON_P, lw=1.2),
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
    sign(Z, 'ws_sign', 955, 1056, 174, 204, 2, 6, 'nav.workshop', NEON_P)
    Z.add('ws_dome', 975, 1035, 160, 180, 14, 22, 'dome', on='ws_beam', cyl=12, band=1)
    Z.add('ws_armMount', 996, 1014, 150, 160, 20, 10, 'dark', on='ws_dome', cyl=10)
    for id_, X0, X1, st in (('ws_wingL', 905, 928, 'ws_stepL'), ('ws_wingR', 1082, 1105, 'ws_stepR')):
        Z.add(id_, X0, X1, 222, 316, 14, 26, 'frame', on=st, deco=[dict(t='l', f=[.3, .05, .3, .95], col=NEON_P, lw=1.4), dict(t='r', f=[.55, .85, .1, .3], fill='#0a0620', line=NEON_C)])
    for id_, X0, X1, Y0, stp in (('ws_tabL', 917, 952, 248, 'ws_stepL'), ('ws_tabR', 1058, 1093, 244, 'ws_stepR')):
        cx = (X0 + X1) / 2
        Z.add(id_ + 's', cx - 5, cx + 5, 306, 316, 5, 3, 'dark', on=stp)
        Z.add(id_, X0, X1, Y0, 306, 4, 4, 'tablet', on=id_ + 's', deco=[dict(t='r', f=[.08, .92, .05, .95], fill='#0c4a8a', line='#7af4ff'), dict(t='grid', f=[.16, .84, .12, .88], nx=2, ny=3, fill='#1a6ab0', line='#9af8ff')])
    for i, (a, top) in enumerate(((980, 292), (998, 286), (1017, 294))):
        Z.add(f'ws_ped{i}', a, a + 14, 312, 324, 6, 12, 'fig', on='ws_base', cyl=10, band=1)
        Z.add(f'ws_fig{i}', a + 3, a + 11, top + 8, 312, 8, 7, 'bot', on=f'ws_ped{i}', deco=[dict(t='r', f=[.2, .8, .3, .5], fill='#c8f0ff')])
        Z.add(f'ws_head{i}', a + 4, a + 10, top, top + 8, 8.5, 6, 'bot', on=f'ws_fig{i}', deco=[dict(t='c', f=[.32, .5, .12], fill='#7af4ff'), dict(t='c', f=[.68, .5, .12], fill='#7af4ff')])
    pe = (1110, 1148, 277, 358)
    Z.add('ws_ped', *pe, 8, 18, 'term', deco=[dict(t='r', f=F(1113, 1145, 314, 350, *pe), fill='#0c2a5a', line=NEON_C), dict(t='c', f=[.5, .7, .17], line='#7af4ff', lw=1)])
    Z.add('ws_term', 1106, 1152, 199, 277, 6, 20, 'term', on='ws_ped', ch=(6, 6), deco=[*[dict(t='r', f=[.16, .84, a, b], fill='#14306a', line='#7af4ff') for a, b in ((.12, .36), (.42, .66), (.72, .94))]])
    Z.add('ws_termTop', 1110, 1148, 193, 199, 8, 14, 'clamp', on='ws_term', glow=1, gr=20, gcol='120,240,255')
    Z.add('ws_col', 883, 904, 200, 358, 22, 20, 'mach', deco=[dict(t='l', f=[.5, .04, .5, .96], col='#ff9a3a', lw=2), dict(t='r', f=[.15, .85, .3, .42], fill='#2a1a10', line='#ff9a3a'), dict(t='r', f=[.15, .85, .6, .7], fill='#2a1a10', line='#ff9a3a')])
    Z.add('ws_colCap', 880, 907, 194, 200, 21, 22, 'mach', on='ws_col')
    Z.plant('ws_colPlant', 885, 903, 182, 194, 24, 14, 48, 36, on='ws_colCap')
    Z.plant('ws_potBL', 880, 904, 330, 358, -8, 20, 42, 42)
    Z.arm = [(1005, 150), (1067, 112), (1127, 148), (1108, 162)]; Z.armv = 26
    return Z

def tools():
    Z = Zone('tools', 1234, 357, ('tl_top', 'tl_board', 'tl_cabL'))
    for id_, X0, X1 in (('tl_cabL', 1154, 1214), ('tl_cabR', 1240, 1298)):
        c = (X0, X1, 320, 357)
        Z.add(id_, *c, 6, 50, 'desk', notop=1, deco=[dict(t='r', f=[.06, .94, .08, .94], fill='#140c30', line='#6a4ab0'), dict(t='l', f=[.06, .5, .94, .5], col='#6a4ab0'),
            dict(t='r', f=[.42, .58, .26, .32], fill='#9a8ae0'), dict(t='r', f=[.42, .58, .7, .76], fill='#9a8ae0')])
    Z.add('tl_top', 1146, 1306, 312, 320, -4, 62, 'bench', deco=[dict(t='r', f=[0, 1, 0, .55], fill='#ff7ad0')])
    bo = (1167, 1300, 164, 312)
    Z.add('tl_board', *bo, 46, 12, 'board', on='tl_top', ch=(8, 8), deco=[dict(t='r', f=F(1226, 1244, 259, 296, *bo), fill='#ff9a3a', line='#ffd27a'), dict(t='l', f=[.03, .08, .03, .95], col=NEON_C, lw=1.2), dict(t='l', f=[.97, .08, .97, .95], col=NEON_C, lw=1.2)])
    sign(Z, 'tl_sign', 1182, 1287, 175, 202, 42.5, 3, 'nav.tools', NEON_C, st='board')
    Z.add('tl_tiles', 1189, 1290, 206, 251, 43.5, 2, 'board', deco=[dict(t='r', f=[0, 1, 0, 1], fill='#0a1440', line=NEON_C), dict(t='grid', f=[.02, .98, .05, .95], nx=3, ny=1, gap=.05, fill='#0e2a6a', line='#7af4ff', icon='#7af4ff')])
    Z.add('tl_tileBL', 1189, 1224, 266, 302, 43.5, 2, 'board', deco=[dict(t='r', f=[0, 1, 0, 1], fill='#0e2a6a', line='#7af4ff'), dict(t='c', f=[.5, .5, .22], line='#7af4ff', lw=1)])
    Z.add('tl_tileBR', 1246, 1294, 256, 302, 43.5, 2, 'board', deco=[dict(t='r', f=[0, 1, 0, 1], fill='#0e2a6a', line='#7af4ff'), dict(t='c', f=[.5, .5, .2], line='#7af4ff', lw=1)])
    Z.add('tl_bot', 1252, 1278, 148, 164, 48, 8, 'bot', on='tl_board')
    Z.add('tl_botH', 1255, 1275, 134, 148, 48.5, 7, 'bot', on='tl_bot', deco=[dict(t='c', f=[.33, .5, .12], fill='#7af4ff'), dict(t='c', f=[.67, .5, .12], fill='#7af4ff')])
    Z.plant('tl_plantTop', 1176, 1194, 154, 164, 48, 8, 46, 32, on='tl_board')
    Z.add('tl_item1', 1200, 1218, 300, 312, 10, 10, 'item', on='tl_top', deco=[dict(t='r', f=[0, 1, 0, .3], fill='#ff9a3a')])
    Z.add('tl_item2', 1258, 1282, 302, 312, 10, 10, 'item', on='tl_top')
    Z.add('tl_item3', 1230, 1242, 298, 312, 14, 6, 'screen', on='tl_top', deco=[dict(t='r', f=[.15, .85, .15, .6], fill='#3be8ff')])
    Z.add('tl_lanL', 1154, 1164, 232, 262, 50, 6, 'lamp', glow=1)
    Z.add('tl_stand', 1127, 1145, 312, 357, 4, 14, 'stand')
    Z.plant('tl_standPlant', 1128, 1144, 300, 312, 5, 12, 36, 40, on='tl_stand', leaf=['#8a4ac0', '#6a2aa0', '#b07ae0'])
    Z.plant('tl_potR', 1308, 1336, 312, 357, 10, 22, 58, 66)
    Z.add('tl_lanF', 1284, 1298, 330, 357, -18, 10, 'clamp', glow=1, gcol='120,240,255')
    return Z

def portal():
    Z = Zone('portal', 1405, 360, ('pt_d1', 'pt_d2', 'pt_beam', 'pt_pillL'))
    Z.add('pt_d1', 1306, 1496, 350, 360, -28, 84, 'dais', deco=[dict(t='l', f=[0, .2, 1, .2], col='#d98aff', lw=1.2)])
    Z.add('pt_d2', 1316, 1486, 340, 350, -16, 66, 'dais', on='pt_d1', deco=[dict(t='l', f=[0, .2, 1, .2], col=NEON_C, lw=1.2)])
    bk = (1341, 1457, 150, 340)
    Z.add('pt_back', *bk, 34, 8, 'pframe', on='pt_d2', deco=[dict(t='arch', f=[0, 1, .02, 1], spring=.3, fill='#2a0f6a', line=NEON_C, vortex=[.66, .62])])
    Z.add('pt_pillL', 1297, 1340, 150, 340, 6, 38, 'pframe', on='pt_d2', deco=[dict(t='l', f=[.2, .04, .2, .96], col='#c86aff', lw=1.6), dict(t='l', f=[.9, .04, .9, .96], col=NEON_P, lw=1.2)])
    Z.add('pt_pillR', 1458, 1493, 150, 340, 6, 38, 'pframe', on='pt_d2', deco=[dict(t='l', f=[.5, .04, .5, .96], col=NEON_P, lw=1.6)])
    Z.add('pt_beam', 1297, 1493, 97, 150, 4, 40, 'pframe', ch=(26, 16), deco=[dict(t='l', f=[.05, .92, .95, .92], col=NEON_P, lw=1.2)])
    sign(Z, 'pt_sign', 1352, 1468, 116, 150, -.6, 4, 'nav.portal', '#d98aff')
    Z.add('pt_crys1', 1372, 1392, 296, 340, 26, 8, 'glass', on='pt_d2', ch=(10, 10))
    Z.add('pt_crys2', 1396, 1416, 312, 340, 24, 8, 'glass', on='pt_d2', ch=(9, 9))
    Z.plant('pt_gold', 1448, 1480, 306, 340, -14, 16, 44, 28, st='gold', on='pt_d2')
    Z.plant('pt_plantR', 1506, 1530, 312, 360, -34, 22, 58, 62, st='stand')
    return Z

# ===================================== ЛІВЕ КРИЛО =====================================
def marketing():
    Z = Zone('marketing', 585, 337, ('mk_booth', 'mk_deskL'))
    bo = (530, 647, 173, 337)
    Z.add('mk_booth', *bo, 31, 10, 'frame', ch=(6, 6), deco=[dict(t='r', f=F(557, 637, 210, 262, *bo), fill='#0c3a7a', line=NEON_C),
        dict(t='r', f=F(561, 595, 214, 258, *bo), fill='#1a5ab0', line='#7af4ff'), dict(t='r', f=F(599, 633, 214, 258, *bo), fill='#1a5ab0', line='#7af4ff'),
        dict(t='bars', f=F(564, 592, 230, 256, *bo), n=5, fill='#7af4ff'), dict(t='c', f=[*FP(616, 236, *bo), .08], line='#7af4ff', lw=1)])
    sign(Z, 'mk_sign', 543, 640, 178, 202, 28.4, 2.5, 'nav.marketing', NEON_P)
    for id_, X0, X1, dr in (('mk_deskL', 450, 583, (463, 480)), ('mk_deskR', 637, 683, (650, 670))):
        c = (X0, X1, 280, 337)
        Z.add(id_, *c, 0, 30, 'desk', deco=[dict(t='l', f=[0, .04, 1, .04], col=NEON_P, lw=1.2), dict(t='r', f=F(dr[0], dr[1], 290, 333, *c), fill='#1a1238', line='#6a4ab0'),
            *[dict(t='l', f=[*FP(dr[0], y, *c), *FP(dr[1], y, *c)], col='#6a4ab0') for y in (304, 318)]])
    Z.add('mk_chairB', 594, 626, 266, 302, 12.5, 5, 'chair'); Z.add('mk_seat', 590, 630, 300, 309, -10, 22, 'chair'); Z.add('mk_chairBase', 602, 618, 309, 337, -4, 10, 'dark', cyl=8)
    Z.add('mk_post', 514, 521, 170, 337, 34, 5, 'dark')
    Z.add('mk_bulb', 503, 533, 136, 170, 30.5, 12, 'lamp', on='mk_post', glow=1, gr=44, cyl=10)
    Z.plant('mk_plant1', 470, 495, 262, 280, 8, 14, 40, 36, on='mk_deskL')
    Z.plant('mk_plant2', 522, 546, 264, 280, 6, 14, 36, 30, on='mk_deskL', bloom=['#ff7ad0', '#ffd27a'])
    Z.add('mk_lampR', 652, 674, 244, 280, 8, 12, 'lamp', on='mk_deskR', glow=1, gr=36)
    Z.add('mk_stand', 472, 494, 230, 337, 33, 10, 'stand')
    Z.plant('mk_standPot', 468, 498, 208, 230, 33.5, 9, 54, 46, on='mk_stand')
    return Z

def analytics():
    Z = Zone('analytics', 398, 340, ('an_booth', 'an_desk'))
    bo = (335, 463, 150, 340)
    Z.add('an_booth', *bo, 36, 16, 'frame', ch=(8, 8), deco=[dict(t='r', f=F(348, 392, 197, 247, *bo), fill='#0c3a7a', line=NEON_C), dict(t='bars', f=F(352, 388, 205, 243, *bo), n=6, fill='#7af4ff'),
        dict(t='r', f=F(398, 443, 200, 243, *bo), fill='#0c3a7a', line=NEON_C), dict(t='c', f=[*FP(420, 222, *bo), .1], fill='#1a5ab0', line='#7af4ff', lw=1)])
    sign(Z, 'an_sign', 353, 443, 163, 190, 32.5, 3, 'nav.analytics', NEON_C)
    Z.plant('an_plantTop', 392, 436, 140, 150, 38, 12, 90, 66, on='an_booth')
    de = (313, 480, 280, 340)
    Z.add('an_desk', *de, 0, 34, 'desk', deco=[dict(t='l', f=[0, .04, 1, .04], col=NEON_P, lw=1.2), dict(t='r', f=F(458, 478, 290, 336, *de), fill='#1a1238', line='#6a4ab0'),
        dict(t='r', f=F(318, 338, 290, 336, *de), fill='#1a1238', line='#6a4ab0')])
    Z.add('an_scr', 444, 472, 252, 280, 10, 6, 'screen', on='an_desk', deco=[dict(t='r', f=[.1, .9, .1, .8], fill='#3be8ff')])
    Z.add('an_mug', 330, 340, 270, 280, 8, 8, 'item', on='an_desk', cyl=8)
    Z.add('an_chairB', 402, 438, 262, 306, -34, 5, 'chair'); Z.add('an_seat', 398, 442, 300, 310, -28.5, 22, 'chair'); Z.add('an_chairBase', 412, 428, 310, 340, -22, 10, 'dark', cyl=8)
    Z.plant('an_potL', 282, 310, 304, 340, -22, 22, 52, 48)
    Z.add('an_poster', 383, 427, 92, 122, 46, 3, 'neon', deco=[dict(t='c', f=[.5, .5, .25], line=NEON_P, lw=1.4)])
    return Z

def aicenter():
    Z = Zone('ai', 158, 363, ('ai_screen', 'ai_top'))
    Z.add('ai_top', 30, 330, 290, 300, -4, 48, 'desk', deco=[dict(t='r', f=[0, 1, 0, .6], fill='#ff7ad0')])
    Z.add('ai_drawers', 160, 200, 300, 363, 4, 38, 'desk', notop=1, deco=[*[dict(t='r', f=[.1, .9, a, b], fill='#140c30', line='#6a4ab0') for a, b in ((.06, .32), (.38, .64), (.7, .96))]])
    for id_, X0 in (('ai_legL', 34), ('ai_legR', 318)): Z.add(id_, X0, X0 + 8, 300, 363, 6, 34, 'dark', notop=1)
    sc = (77, 238, 47, 290)
    Z.add('ai_screen', *sc, 40, 8, 'neon', ch=(10, 10), deco=[dict(t='r', f=F(85, 230, 55, 282, *sc), fill='#0a1a5a', line=NEON_C),
        dict(t='bars', f=F(93, 130, 110, 158, *sc), n=6, fill='#3be8ff'), dict(t='bars', f=F(93, 130, 165, 213, *sc), n=6, fill='#3be8ff'),
        dict(t='c', f=[*FP(168, 160, *sc), .2], line='#7af4ff', lw=1.6), dict(t='c', f=[*FP(168, 160, *sc), .12], line='#7af4ff', lw=1),
        dict(t='grid', f=F(203, 230, 120, 267, *sc), nx=1, ny=5, gap=.08, fill='#0e2a6a', line='#7af4ff', icon='#7af4ff')])
    sign(Z, 'ai_sign', 87, 230, 63, 100, 37.5, 2, 'nav.ai', NEON_C)
    Z.add('ai_mon', 28, 118, 207, 290, 16, 6, 'screen', on='ai_top', deco=[dict(t='r', f=[.06, .94, .07, .86], fill='#0c3a7a', line=NEON_C), dict(t='bars', f=[.12, .88, .2, .8], n=7, fill='#7af4ff')])
    Z.add('ai_holoB', 150, 186, 282, 290, 14, 16, 'dark', on='ai_top', cyl=10, band=1)
    Z.add('ai_holo', 142, 194, 214, 282, 22, 2, 'glass', on='ai_holoB', deco=[dict(t='c', f=[.5, .45, .36], line='#7af4ff', lw=1.6), dict(t='c', f=[.5, .45, .2], line='#9af8ff', lw=1)])
    Z.add('ai_laptop', 242, 283, 262, 290, 10, 14, 'screen', on='ai_top', deco=[dict(t='r', f=[.1, .9, .1, .9], fill='#1a5ab0', line='#7af4ff')])
    Z.add('ai_mug', 286, 296, 278, 290, 6, 8, 'item', on='ai_top', cyl=8)
    Z.add('ai_lampS', 121, 137, 254, 290, 22, 10, 'lamp', on='ai_top', glow=1, cyl=8)
    Z.add('ai_shelfTop', 53, 213, 34, 44, 42, 8, 'shelf')
    Z.add('ai_top1', 56, 118, 2, 34, 43, 3, 'screen', on='ai_shelfTop', deco=[dict(t='r', f=[.06, .94, .1, .9], fill='#0c3a7a', line=NEON_C), dict(t='bars', f=[.12, .88, .25, .85], n=6, fill='#7af4ff')])
    Z.add('ai_top2', 128, 190, 2, 34, 43, 3, 'screen', on='ai_shelfTop', deco=[dict(t='r', f=[.06, .94, .1, .9], fill='#0c3a7a', line=NEON_C)])
    Z.add('ai_lampO', 196, 210, 12, 34, 43.5, 4, 'lamp', on='ai_shelfTop', glow=1, gr=40)
    # стелаж (картинка x 240..335, між екраном AI-центру й аналітикою): бокові стінки, задня стінка, 6 дощок і речі на них
    SV = 36                                                                         # передній край дощок (відступ від лінії зони)
    Z.add('sh_postL', 240, 246, 20, 290, SV, 18, 'shelf')
    Z.add('sh_postR', 329, 335, 20, 290, SV, 18, 'shelf')
    Z.add('sh_back', 246, 329, 20, 290, SV + 16, 2, 'dark')
    for i, y in enumerate(SHELF_Y):
        Z.add(f'sh_b{i}', 246.5, 328.5, y, y + 4, SV, 16, 'shelf', deco=[dict(t='l', f=[0, .5, 1, .5], col='#ff7ad0', lw=1)])
    Z.plant('sh_ivy', 252, 268, 22, 34, SV + 4, 9, 26, 46, on='sh_b0', hangs=1)                     # плющ звисає з верхньої полиці
    Z.plant('sh_flowers', 298, 318, 21, 34, SV + 4, 10, 36, 26, on='sh_b0', bloom=['#ff7ad0', '#ffd27a', '#ff9af0'])
    Z.add('sh_tea', 280, 304, 52, 69, SV + 4, 10, 'neon', on='sh_b1', cyl=12, glow=1, gr=30, gcol='255,90,220')   # рожевий чайник-лампа
    Z.add('sh_jar1', 310, 317, 59, 69, SV + 5, 7, 'glass', on='sh_b1', cyl=8)
    Z.add('sh_jar2', 319, 325, 62, 69, SV + 5, 6, 'glass', on='sh_b1', cyl=8)
    Z.add('sh_scr1', 254, 322, 88, 123, SV + 9, 3, 'screen', on='sh_b2', deco=[dict(t='r', f=[.06, .94, .1, .9], fill='#0c3a7a', line=NEON_C), dict(t='bars', f=[.12, .6, .25, .85], n=5, fill='#7af4ff')])
    Z.add('sh_box', 252, 302, 146, 183, SV + 3, 12, 'desk', on='sh_b3', deco=[dict(t='r', f=[.08, .92, .1, .45], fill='#140c30', line='#6a4ab0'), dict(t='r', f=[.08, .92, .55, .9], fill='#140c30', line='#6a4ab0')])
    Z.plant('sh_succ', 308, 324, 170, 183, SV + 4, 9, 22, 16, on='sh_b3', leaf=['#8a4ac0', '#6a2aa0', '#b07ae0'])
    Z.add('sh_scr2', 254, 322, 194, 226, SV + 9, 3, 'screen', on='sh_b4', deco=[dict(t='r', f=[.06, .94, .1, .9], fill='#0c3a7a', line=NEON_C), dict(t='c', f=[.7, .5, .12], line='#7af4ff', lw=1)])
    Z.add('sh_books', 252, 288, 238, 258, SV + 3, 11, 'item', on='sh_b5', deco=[dict(t='r', f=[a, a + .13, .05 + (.2 if k % 3 == 1 else 0), 1], fill=col, line='#0a0620') for k, (a, col) in enumerate(((.02, '#c84a8a'), (.17, '#4a8ad0'), (.32, '#d8a030'), (.47, '#6a4ac0'), (.62, '#3aa858'), (.77, '#ff7ad0')))])
    Z.plant('sh_flowers2', 294, 322, 236, 258, SV + 3, 11, 40, 30, on='sh_b5', bloom=['#ff9af0', '#ffd27a'])
    Z.plant('ai_potF', 248, 280, 324, 363, -26, 22, 46, 44, bloom=['#ff7ad0', '#ffd27a'])          # вазон з квітами перед столом
    Z.add('ai_ped', 44, 78, 238, 363, 48, 10, 'stand')
    Z.plant('ai_fern', 42, 80, 220, 238, 48.5, 9, 80, 70, on='ai_ped')
    Z.plant('ai_potBL', 30, 64, 318, 363, -30, 24, 44, 42)
    Z.plant('ai_potUnder', 210, 238, 340, 363, 8, 18, 34, 22)
    for i, (X0, X1) in enumerate(((70, 96), (102, 126), (132, 156))):
        Z.add(f'ai_stone{i}', X0, X1, 350, 363, -34 + i * 3, 14, 'stone', ch=(5, 5))
    return Z
# ===================================== РОЗМІЩЕННЯ =====================================
KEYS = ('on', 'deco', 'plant', 'glow', 'gcol', 'cyl', 'band', 'notop', 'leaf', 'gr', 'hangs', 'bloom', 'leaves')
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
def face_aspect(items, id):
    it = next(i for i in items if i['id'] == id); Fc, V = faces(it); q = [P3(*p) for p in Fc['front']]
    xs = [p[0] for p in q]; hl = abs(q[0][1] - q[-1][1]); hr = abs(q[1][1] - q[2][1]); return (max(xs) - min(xs)) / ((hl + hr) / 2)
def width_extent(Z): return min(c['X'][0] for c in Z.comps) - Z.Xref, max(c['X'][1] for c in Z.comps) - Z.Xref
def free(Z, q):
    """зона стоїть так, що її середина на екрані — X (на глибині z), поворот turn"""
    a = math.radians(q['turn']); r = (math.cos(a), -math.sin(a)); lo, hi = width_extent(Z)
    def pos(m, kx=1.):
        uc = (lo + hi) / 2 * m * kx; cx = 774 + (q['X'] - 774) / s(q['z']); return cx - r[0] * uc, q['z'] - r[1] * uc, q['turn']
    return pos
def solve_m(Z, pos, target, kx=1.):
    lo, hi = .3, 3.
    for _ in range(36):
        m = (lo + hi) / 2; it = place(Z, *pos(m, kx), m, kx); x0, x1, y0, y1 = screen_ext(it, Z.main)
        if y1 - y0 > target: hi = m
        else: lo = m
    return m
def fit(Z, pos, H, aspect=None):
    """масштаб m — щоб головні частини зони мали на екрані висоту H; kx — щоб головна грань мала пропорції картинки"""
    kx = 1.; m = solve_m(Z, pos, H)
    if aspect:
        aid, asp = aspect
        for _ in range(3):
            lo, hi = .4, 1.6
            for _ in range(28):
                kx = (lo + hi) / 2; a = face_aspect(place(Z, *pos(m, kx), m, kx), aid)
                if a > asp: hi = kx
                else: lo = kx
            m = solve_m(Z, pos, H, kx)
    return m, kx

def yov(A, B): return min(A['yb'], B['yb']) - max(A['yt'], B['yt']) > .5
def fpr(it):
    if it.get('cyl'):
        jt = dict(it); jt.pop('cyl'); return footprint(jt)
    return footprint(it)
def hit(A, B): return yov(A, B) and not sep(fpr(A), fpr(B))[0]
def arcpt(C, rad, a, sgn): return (C[0] + sgn * rad * math.sin(math.radians(a)), C[1] + rad * math.cos(math.radians(a)))
def chord(rad, da): return 2 * rad * math.sin(math.radians(da / 2))

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
    """sgn = +1 — праве крило, -1 — ліве. Стіни — дзеркальні відносно x = 774, зони — свої (ліве — затишне, праве — технологічне)."""
    R = p['R']; xf = p['xf'] if sgn > 0 else 2 * 774 - p['xf']; C = (xf, JZ - R)
    HP = p['HP']; HT, HW = HP * .85, HP * .85 * .85
    if sgn > 0: far, mid, near = workshop(), tools(), portal(); jamb = JAMB_R
    else: far, mid, near = marketing(), analytics(), aicenter(); jamb = JAMB_L
    q = p['right' if sgn > 0 else 'left']
    zf = q['far']['z']; sf = s(zf); farX = q['far']['X']
    fpos = lambda m, kx=1.: (774 + (farX - 774) / sf, zf, 0)                     # дальня зона: Xref -> центр екрана farX, прямо
    mf = solve_m(far, fpos, HW); it_far = place(far, *fpos(mf), mf)
    mpos = free(mid, q['mid']); mm, km = fit(mid, mpos, HT, q['mid'].get('aspect')); it_mid = place(mid, *mpos(mm, km), mm, km)
    npos = free(near, q['near']); mn, kn = fit(near, npos, HP, q['near'].get('aspect')); it_near = place(near, *npos(mn, kn), mn, kn)
    items = it_far + it_mid + it_near
    wall = [[round(jamb, 1), JZ], [xf, JZ]] + [[round(v, 1) for v in arcpt(C, R, a, sgn)] for a in range(10, 131, 10)]
    cols, up, hang = [], [], []
    def col(id, a, yt, w=24, dep=20, st='col', deco=None):
        x, z = arcpt(C, R - 4 - dep, a, sgn); cols.append(dict(id=id, x=round(x, 1), z=round(z, 1), turn=sgn * a, w=w, dep=dep, yb=FL, yt=yt, st=st, deco=deco or [dict(t='l', f=[.5, .02, .5, .98], col=NEON_C if sgn > 0 else NEON_P, lw=1.4), *[dict(t='r', f=[.1, .9, a_, a_ + .015], fill='#5a4ab0') for a_ in (.2, .45, .7)]]))
    for i, (a, yt) in enumerate(q['cols']): col(f'col{i}', a, yt)
    L = dict(wall=wall, items=items, cols=cols, armZone=far.name, scales=dict(far=mf, mid=mm, kmid=km, near=mn, knear=kn))
    if far.arm: L['arm'] = far.armw
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
        c0 = q['cols'][0]; upbox('mz_lampL', c0[0], R - 34 - 10, 12, 10, mz['yb'] - 4, 22, 'lamp', glow=1, gr=30, cyl=8)          # ліхтар на лиці першої колони
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
        a0, a1 = hq['strip']; am = (a0 + a1) / 2; x, z = arcpt(C, R - 4, am, sgn); ss = s(z)
        cols.append(dict(id='hub_strip', x=round(x, 1), z=round(z, 1), turn=sgn * am, w=round(chord(R - 3, a1 - a0), 2), dep=3, yb=round(220 + (165 - 220) / ss, 1), yt=round(220 + (10 - 220) / ss, 1), st='dark',
                         deco=[dict(t='grid', f=[.12, .88, .04, .96], nx=1, ny=6, gap=.1, fill='#1a1450', line='#ff4fd8')]))
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
MAINS = {'workshop': ('ws_base', 'ws_beam', 'ws_dome'), 'tools': ('tl_top', 'tl_board', 'tl_cabL'), 'portal': ('pt_d1', 'pt_d2', 'pt_beam', 'pt_pillL'),
         'marketing': ('mk_booth', 'mk_deskL'), 'analytics': ('an_booth', 'an_desk'), 'ai': ('ai_screen', 'ai_top')}
def report(L, name):
    Zi = {}
    for it in L['items']:
        if it.get('layer') == 'up': continue
        Zi.setdefault(it['zone'], []).append(it)
    print(f'== {name}:', {k: round(v, 3) for k, v in L['scales'].items()})
    hs = {k: screen_ext(v, MAINS[k]) for k, v in Zi.items()}
    hmax = max(e[3] - e[2] for e in hs.values())
    for k, e in hs.items():
        a = screen_ext(Zi[k]); print(f"  {k:9s} main h {e[3] - e[2]:5.0f} ({(e[3] - e[2]) / hmax * 100:5.1f}%) | all x {a[0]:.0f}..{a[1]:.0f} y {a[2]:.0f}..{a[3]:.0f}")
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
    sx0, sx1 = 774 + (657 - 774) / s(150), 774 + (891 - 774) / s(150)
    d.rectangle([T(sx0, 150), T(sx1, 118)], outline=(160, 120, 220)); d.text(T((sx0 + sx1) / 2 - 14, 140), 'SOFA', fill=(200, 160, 255))
    d.text((8, H - 16), 'top view: x right, z into the room (window at the top); eye at (774, -520) below the picture', fill=(120, 120, 160))
    im.save(path)

DEFAULT = {
 "R": 225, "xf": 1200, "HP": 250,
 "right": {"far": {"X": 1081, "z": 117}, "mid": {"X": 1240, "z": 10, "turn": 36, "aspect": ["tl_board", 133 / 148]}, "near": {"X": 1405, "z": -30, "turn": 86, "aspect": ["pt_beam", 196 / 53]},
           "hub": {"x0": WR + 6, "z": 181, "w": 150, "turn": 6, "strip": [25, 31]},
           "cols": [[40, -240], [58, 64]],
           "mz": {"w": 70, "phi0": 45, "phi1": 101, "yt": 40, "yb": 64, "bots": [52, 56, 60], "cube": 64.5, "pots": [47.5, 69, 74], "gold": [[79, "lantern"], [84, "g"], [90, "g"]], "fern": 48,
                  "hang": [[48, 50, "vine"], [53, 30, "lamp"], [63, 44, "vine"], [68, 26, "lamp"], [74, 36, "vine"], [80, 30, "vine"]]}},
 "left": {"far": {"X": 480, "z": 105}, "mid": {"X": 365, "z": 10, "turn": -36, "aspect": ["an_booth", 128 / 190]}, "near": {"X": 204, "z": -30, "turn": -86, "aspect": ["ai_screen", 161 / 243]},
          "cols": [[45, -240], [70, -240]],
          "shelves": [{"y": 34, "a0": 12, "a1": 40, "dep": 14, "items": [[15, "trail"], [20.5, "books"], [26, "flower"], [30, "jar"], [33.5, "pot"], [38, "trail"]]},
                      {"y": 76, "a0": 15, "a1": 37, "dep": 12, "items": [[18, "flower"], [23.5, "lamp"], [29, "trail"], [34, "pot"]]}],
          "hang": [[78, 30, -60, 90, "vine"], [84, 26, -60, 70, "vine"], [55, 40, -60, 60, "vine"], [60, 40, -40, 70, "red"]]},
}

def write_js(out):
    """вшити розкладку в js/objects/arc_layout.js (рядок NX.arcLayout = {...};) — її беруть схема (rwing_box.js) і 3D (arc_scene.js)"""
    p = os.path.join(REPO, 'js', 'objects', 'arc_layout.js'); src = open(p, encoding='utf8').read()
    new, n = re.subn(r'NX\.arcLayout = \{.*?\};( *//[^\n]*)?\n', lambda m: 'NX.arcLayout = ' + json.dumps(out, separators=(',', ':'), ensure_ascii=False) + ';   // згенеровано tools/wingbox/gen_room.py\n', src, count=1, flags=re.S)
    assert n == 1, 'не знайшов NX.arcLayout у arc_layout.js'
    open(p, 'w', encoding='utf8').write(new); print('записано в', os.path.relpath(p, REPO))

if __name__ == '__main__':
    import argparse
    ap = argparse.ArgumentParser(description='схема обох крил для js/objects/rwing_box.js')
    ap.add_argument('out', nargs='?', default=os.path.join(HERE, 'layout.json'), help='куди записати розкладку (JSON)')
    ap.add_argument('--params', help='JSON з параметрами (за замовчуванням — DEFAULT у цьому файлі)')
    ap.add_argument('--write', action='store_true', help='також вшити в js/objects/arc_layout.js')
    ap.add_argument('--plan', help='намалювати план зверху (PNG)')
    a = ap.parse_args()
    prm = json.load(open(a.params)) if a.params else DEFAULT
    print(f'вікно {WL:.0f}..{WR:.0f} (відкоси на глибині {JZ}: x світу {JAMB_L:.1f} / {JAMB_R:.1f})')
    out = {}
    for name, sgn in (('right', 1), ('left', -1)):
        L = build_side(prm, sgn); report(L, name); out[name] = L
    json.dump(out, open(a.out, 'w'), indent=1, ensure_ascii=False)
    if a.plan: plan_png(out, a.plan)
    if a.write: write_js(out)
