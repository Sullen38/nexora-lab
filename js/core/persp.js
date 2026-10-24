/* ============================================================================
 * core/persp.js — ПЕРСПЕКТИВА КІМНАТИ (щоб об'єкти були "трішки 3D")
 * ----------------------------------------------------------------------------
 * Картинка кімнати намальована в ОДНОТОЧКОВІЙ перспективі: усі лінії вглиб
 * сходяться в точці VP (центр вікна, там же центр дивану). Це видно з фону:
 * верх екрана AI-центру йде з (74, 44) у (238, 85), низ — з (74, 284) у (238, 270).
 *
 * Світ: x — вправо, y — вниз (як у кімнаті), z — углиб (0 = площина картинки).
 *   s(z) = D / (D + z)                 — у скільки разів менше на глибині z
 *   p(x, y, z) -> [X, Y]               — точка світу -> координати кімнати
 * Ліва стіна — площина x = 0 (вона й дає нахил екрана AI-центру).
 *
 *   box(r, ox, oy, U, {x0,x1,y0,y1,z0,z1}, {front, top, bottom, right, left})
 *        — малює коробку прямо в растр (NX.art.Raster), лише видимі грані.
 *          Кожна грань: fn(u, v, i, j) -> колір | null; u, v = 0..1 по грані
 *          (для правої/лівої: u — глибина, v — висота; для верху: u — ширина, v — глибина).
 *   wall(c, src, xw, z0, z1, y0, y1, step)
 *        — кладе пласку картинку (екран) на стіну x = xw смужками-стовпчиками:
 *          так екран "лягає" в перспективу і при цьому лишається живим.
 *          step — ширина смужки (у кожній — точний відрізок картинки, стиснутий за перспективою).
 * ========================================================================== */
NX.persp = (() => {
  const VP = [774, 220], D = 520;
  const s = z => D / (D + z), zOf = k => D / k - D, P01 = v => Math.min(1, Math.max(0, v));
  const p = (x, y, z) => { const k = s(z); return [VP[0] + (x - VP[0]) * k, VP[1] + (y - VP[1]) * k]; };
  /** На якій глибині площина x = xw видна в стовпчику X кімнати. */
  const zAtX = (X, xw) => zOf((X - VP[0]) / (xw - VP[0]));

  function box(r, ox, oy, U, b, F) {
    const { x0, x1, y0, y1, z0, z1 } = b, xs = [], ys = [];
    for (const x of [x0, x1]) for (const y of [y0, y1]) for (const z of [z0, z1]) { const q = p(x, y, z); xs.push(q[0]); ys.push(q[1]); }
    const i0 = Math.max(0, Math.floor((Math.min(...xs) - ox) / U)), i1 = Math.min(r.w, Math.ceil((Math.max(...xs) - ox) / U));
    const j0 = Math.max(0, Math.floor((Math.min(...ys) - oy) / U)), j1 = Math.min(r.h, Math.ceil((Math.max(...ys) - oy) / U));
    const kf = s(z0), sx = x1 - x0, sy = y1 - y0, sz = z1 - z0;
    const T = F.top && y0 > VP[1], B = F.bottom && y1 < VP[1], R = F.right && x1 < VP[0], L = F.left && x0 > VP[0];
    for (let j = j0; j < j1; j++) {
      const Y = oy + (j + .5) * U;
      for (let i = i0; i < i1; i++) {
        const X = ox + (i + .5) * U; let col, hit = false;
        if (F.front) { const wx = VP[0] + (X - VP[0]) / kf, wy = VP[1] + (Y - VP[1]) / kf; if (wx >= x0 && wx < x1 && wy >= y0 && wy < y1) { hit = true; col = F.front((wx - x0) / sx, (wy - y0) / sy, i, j); } }
        if (!hit && T && Y > VP[1]) { const k = (Y - VP[1]) / (y0 - VP[1]), z = zOf(k), wx = VP[0] + (X - VP[0]) / k; if (z >= z0 && z < z1 && wx >= x0 && wx < x1) { hit = true; col = F.top((wx - x0) / sx, (z - z0) / sz, i, j); } }
        if (!hit && B && Y < VP[1]) { const k = (Y - VP[1]) / (y1 - VP[1]), z = zOf(k), wx = VP[0] + (X - VP[0]) / k; if (z >= z0 && z < z1 && wx >= x0 && wx < x1) { hit = true; col = F.bottom((wx - x0) / sx, (z - z0) / sz, i, j); } }
        if (!hit && R && X < VP[0]) { const k = (X - VP[0]) / (x1 - VP[0]), z = zOf(k), wy = VP[1] + (Y - VP[1]) / k; if (z >= z0 && z < z1 && wy >= y0 && wy < y1) { hit = true; col = F.right((z - z0) / sz, (wy - y0) / sy, i, j); } }
        if (!hit && L && X > VP[0]) { const k = (X - VP[0]) / (x0 - VP[0]), z = zOf(k), wy = VP[1] + (Y - VP[1]) / k; if (z >= z0 && z < z1 && wy >= y0 && wy < y1) { hit = true; col = F.left((z - z0) / sz, (wy - y0) / sy, i, j); } }
        if (col) r.set(i, j, col);
      }
    }
  }

  /** Пласка картинка src -> на стіну x = xw (глибина z0..z1, висота y0..y1). step — ширина смужки в од. кімнати. */
  function wall(c, src, xw, z0, z1, y0, y1, step) {
    const xa = p(xw, 0, z0)[0], xb = p(xw, 0, z1)[0], W = src.width, H = src.height;
    for (let X = xa; X < xb - .01; X += step) {
      const X2 = Math.min(xb, X + step), za = zAtX(X, xw), zb = zAtX(X2, xw), zm = zAtX((X + X2) / 2, xw);
      const ua = P01((za - z0) / (z1 - z0)), ub = P01((zb - z0) / (z1 - z0)), k = s(zm), top = VP[1] + (y0 - VP[1]) * k, bot = VP[1] + (y1 - VP[1]) * k;
      c.drawImage(src, ua * W, 0, Math.max(1, (ub - ua) * W), H, X, top, X2 - X + .02, bot - top);
    }
  }
  /** Чотирикутник грані на стіні x = xw у координатах кімнати (для тап-зон, світіння). */
  const wallQuad = (xw, z0, z1, y0, y1) => [p(xw, y0, z0), p(xw, y0, z1), p(xw, y1, z1), p(xw, y1, z0)];
  return { VP, D, s, zOf, p, zAtX, box, wall, wallQuad };
})();
