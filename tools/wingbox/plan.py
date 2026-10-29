# tools/wingbox/plan.py — геометрія схеми крил: проєкція кімнати, грані й слід коробки, роздільна лінія в плані.
# Світ: x — вправо, z — углиб (0 = площина картинки), y — вниз; підлога y = 372; око (774, 220, -520) — як core/persp.js.
# Коробка: (x, z) — середина передньої грані на підлозі, turn — поворот (°; 0 — лицем до глядача), back — відступ углиб від
# цієї лінії, w — ширина, dep — глибина, yb / yt — низ / верх.
import math
VP = (774, 220); D = 520; FL = 372; EYE = (774, -520)
def s(z): return D / (D + z)
def P3(x, y, z): k = s(z); return (VP[0] + (x - VP[0]) * k, VP[1] + (y - VP[1]) * k)
def xworld(X, z): return VP[0] + (X - VP[0]) / s(z)                         # x світу, що видно в стовпчику X на глибині z

def frame(B, shear=True):
    """базис коробки; shear — фронтальний вигляд зони (B['sh'] = [K, z0]: x + K·(z − z0), як у js/objects/arc_kit.js basis)"""
    a = math.radians(B.get('turn', 0)); f = (-math.sin(a), -math.cos(a)); r = (-f[1], f[0])
    c = (B['x'] - f[0] * B.get('back', 0), B['z'] - f[1] * B.get('back', 0)); sh = B.get('sh') if shear else None
    def P(u, v, y):
        x, z = c[0] + r[0] * u - f[0] * v, c[1] + r[1] * u - f[1] * v
        return (x + sh[0] * (z - sh[1]) if sh else x, y, z)
    return f, r, P
def footprint(B):
    """слід коробки в плані — як її намальовано (зі зсувом фронтального вигляду, якщо він є): перетини й «за стіною» — по ньому"""
    f, r, P = frame(B); w = B['w'] / 2; d = B['dep']
    return [(P(-w, 0, 0)[0], P(-w, 0, 0)[2]), (P(w, 0, 0)[0], P(w, 0, 0)[2]), (P(w, d, 0)[0], P(w, d, 0)[2]), (P(-w, d, 0)[0], P(-w, d, 0)[2])]
def faces(B):
    f, r, P = frame(B); w = B['w'] / 2; d = B['dep']; yb, yt = B['yb'], B['yt']
    F = {'front': [P(-w, 0, yb), P(w, 0, yb), P(w, 0, yt), P(-w, 0, yt)],
         'left': [P(-w, d, yb), P(-w, 0, yb), P(-w, 0, yt), P(-w, d, yt)],
         'right': [P(w, 0, yb), P(w, d, yb), P(w, d, yt), P(w, 0, yt)],
         'top': [P(-w, d, yt), P(w, d, yt), P(w, 0, yt), P(-w, 0, yt)]}
    def vis(name, n):
        m = [sum(q[i] for q in F[name]) / 4 for i in range(3)]; v = (EYE[0] - m[0], EYE[1] - m[2])
        if B.get('sh'):                                                           # фронтальний вигляд: нормаль зсунутої грані в плані
            q = F[name]; e = (q[1][0] - q[0][0], q[1][2] - q[0][2]); nn = (e[1], -e[0])
            if nn[0] * n[0] + nn[1] * n[1] < 0: nn = (-nn[0], -nn[1])
            n = nn
        return n[0] * v[0] + n[1] * v[1] > 1e-9
    V = {'front': vis('front', f), 'left': vis('left', (-r[0], -r[1])), 'right': vis('right', r), 'top': yt > VP[1]}
    return F, V

# ---------- перетини в плані (опуклі чотирикутники) ----------
def sep(A, B):
    """є лінія-роздільник (ребро A або B)? -> (True, ребро, полігон-власник)"""
    for poly, other in ((A, B), (B, A)):
        n = len(poly); cx = sum(p[0] for p in poly) / n; cz = sum(p[1] for p in poly) / n
        for i in range(n):
            a, b = poly[i], poly[(i + 1) % n]; nx, nz = b[1] - a[1], -(b[0] - a[0]); l = math.hypot(nx, nz) or 1; nx, nz = nx / l, nz / l
            if nx * (cx - a[0]) + nz * (cz - a[1]) > 0: nx, nz = -nx, -nz          # нормаль назовні (одинична)
            if all(nx * (q[0] - a[0]) + nz * (q[1] - a[1]) >= -0.02 for q in other): return True, (a, (nx, nz)), poly   # впритул (до 0.02 од.) — окремо
    return False, None, None
# ---------- стіна: гладка крива через опорні точки (Catmull-Rom) ----------
def catmull(pts, n=8):
    out = []
    P = [pts[0]] + pts + [pts[-1]]
    for i in range(1, len(P) - 2):
        p0, p1, p2, p3 = P[i - 1], P[i], P[i + 1], P[i + 2]
        for k in range(n):
            t = k / n; t2 = t * t; t3 = t2 * t
            out.append(tuple(.5 * ((2 * p1[c]) + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3) for c in (0, 1)))
    out.append(pts[-1]); return out

