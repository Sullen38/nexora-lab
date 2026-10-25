/* ============================================================================
 * core/furniture.js — НАБІР ДЛЯ МЕБЛІВ КІМНАТИ (будки, вивіски, екрани, столи)
 * ----------------------------------------------------------------------------
 * Спільні інструменти для зон аналітики й маркетингу (і далі — для інших):
 * малюємо піксель-артом у растр, що покриває прямокутник кімнати.
 *
 *   Sheet(x0, y0, x1, y1, U)  — "аркуш": растр над прямокутником кімнати
 *                               (U — одиниць кімнати на 1 піксель; 0.25 = 4 px/од.)
 *     .rect(ax, ay, bx, by, fn)        fn(u, v, i, j, X, Y) -> колір | null
 *     .rr(ax, ay, bx, by, rad, fn)     заокруглений прямокутник: fn(d, u, v, i, j) — d: глибина від краю (од.)
 *     .poly(pts, fn)                   опуклий/неопуклий многокутник: fn(u, v, i, j, X, Y)
 *     .line(ax, ay, bx, by, col, w)    лінія товщиною w од.
 *     .canvas()                        готове полотно (з темним контуром навколо)
 *   ramp(pal, q, i, j, grain)  — тон палітри за освітленістю q 0..1 + дизеринг Байєра
 *   PAL                         — палітри кімнати (темно-синій, рожевий неон, блакитний, голо-синій...)
 *   fit(cv, w, h, R)            — растр, один раз зменшений під роздільність екрана
 *   side(c, pts, col)           — бічна грань (видима товща меблів) — чотирикутник
 * Перспектива бічних граней: вони "тікають" до вікна (NX.persp.desk.VP).
 * ========================================================================== */
NX.furn = (() => {
  const P = NX.px, { Raster, outline, hash, BAYER } = NX.art;
  const ramp = (pal, q, i, j, g = 0) => pal[P.clamp(Math.round(P.clamp(q, 0, 1) * (pal.length - 1) + BAYER[(j & 3) * 4 + (i & 3)] * .9 + (g ? (hash(i, j) - .5) * g : 0)), 0, pal.length - 1)];
  const PAL = {
    NAVY: ['#040818', '#070d24', '#0b1434', '#101c46', '#16265a', '#1d3170', '#263e88', '#314c9e', '#3f5eb4'],
    PINK: ['#3a0b38', '#58134f', '#7a1c6d', '#a0288d', '#c63aa8', '#e656c0', '#ff84d4', '#ffc2ec'],
    CYAN: ['#0a2a4a', '#0f4870', '#17709a', '#2aa6c8', '#3be8ff', '#9af6ff', '#ffffff'],
    HOLO: ['#0b2276', '#0f2e92', '#153cae', '#1b4ccc', '#235fe2', '#3276f0', '#4a90fa', '#6eaeff'],
    DESK: ['#07041a', '#0d0828', '#140c36', '#1c1146', '#251758', '#301e6c', '#3d2784', '#4d33a0'],
    LIL: ['#1a143e', '#241c54', '#30266c', '#3d3186', '#4c3ea0', '#5e4eb8', '#7462cc', '#8e7ede'],
    CHROME: ['#22264e', '#353b6a', '#555f8c', '#848db4', '#bcc5e6', '#eef2ff'],
    OUT: '#060313',
  };
  function Sheet(x0, y0, x1, y1, U = .25) {
    const W = Math.ceil((x1 - x0) / U), H = Math.ceil((y1 - y0) / U), r = Raster(W, H);
    const px = X => (X - x0) / U, py = Y => (Y - y0) / U;
    const S = {
      r, x0, y0, x1, y1, U, W, H,
      rect(ax, ay, bx, by, fn) {
        const i0 = Math.max(0, Math.floor(px(ax))), i1 = Math.min(W, Math.ceil(px(bx))), j0 = Math.max(0, Math.floor(py(ay))), j1 = Math.min(H, Math.ceil(py(by)));
        for (let j = j0; j < j1; j++) for (let i = i0; i < i1; i++) {
          const X = x0 + (i + .5) * U, Y = y0 + (j + .5) * U; if (X < ax || X >= bx || Y < ay || Y >= by) continue;
          const col = typeof fn === 'string' ? fn : fn((X - ax) / (bx - ax), (Y - ay) / (by - ay), i, j, X, Y); if (col) r.set(i, j, col);
        }
      },
      rr(ax, ay, bx, by, rad, fn) {
        const w = bx - ax, h = by - ay, R = Array.isArray(rad) ? rad : [rad, rad, rad, rad];   // [лв, пв, пн, лн]
        S.rect(ax, ay, bx, by, (u, v, i, j, X, Y) => {
          const lx = X - ax, ly = Y - ay; let d = Math.min(lx, ly, w - lx, h - ly);
          const corner = (cx, cy, rr) => { const q = rr - Math.hypot(lx - cx, ly - cy); return q; };
          if (lx < R[0] && ly < R[0]) d = corner(R[0], R[0], R[0]); else if (lx > w - R[1] && ly < R[1]) d = corner(w - R[1], R[1], R[1]);
          else if (lx > w - R[2] && ly > h - R[2]) d = corner(w - R[2], h - R[2], R[2]); else if (lx < R[3] && ly > h - R[3]) d = corner(R[3], h - R[3], R[3]);
          if (d < 0) return null; return typeof fn === 'string' ? fn : fn(d, u, v, i, j, X, Y);
        });
      },
      poly(pts, fn) {
        const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]), ax = Math.min(...xs), bx = Math.max(...xs), ay = Math.min(...ys), by = Math.max(...ys);
        const inside = (X, Y) => { let c = false; for (let a = 0, b = pts.length - 1; a < pts.length; b = a++) { const [xa, ya] = pts[a], [xb, yb] = pts[b]; if ((ya > Y) !== (yb > Y) && X < (xb - xa) * (Y - ya) / (yb - ya) + xa) c = !c; } return c; };
        S.rect(ax, ay, bx + U, by + U, (u, v, i, j, X, Y) => inside(X, Y) ? (typeof fn === 'string' ? fn : fn((X - ax) / (bx - ax), (Y - ay) / (by - ay), i, j, X, Y)) : null);
      },
      line(ax, ay, bx, by, col, w = U) {
        const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / U * 1.5));
        for (let k = 0; k <= n; k++) { const X = ax + (bx - ax) * k / n, Y = ay + (by - ay) * k / n; S.rect(X - w / 2, Y - w / 2, X + w / 2 + U * .01, Y + w / 2 + U * .01, col); }
      },
      set(X, Y, col) { r.set(Math.floor(px(X)), Math.floor(py(Y)), col); },
      canvas(out = PAL.OUT) { if (out) outline(r, out); return r.canvas(); },
    };
    return S;
  }
  /** Растр, зменшений один раз під роздільність екрана R (пікселів на одиницю). */
  const FIT = new WeakMap();
  function fit(cv, w, h, R) {
    if (R * w >= cv.width * .95) return cv;
    const old = FIT.get(cv); if (old && old.R === R) return old.cv;
    const o = document.createElement('canvas'); o.width = Math.max(1, Math.round(w * R)); o.height = Math.max(1, Math.round(h * R));
    const x = o.getContext('2d'); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high'; x.drawImage(cv, 0, 0, o.width, o.height);
    FIT.set(cv, { R, cv: o }); return o;
  }
  /** Роздільність кешів: пікселі екрана на одиницю кімнати (кратна 0.5, не більше 4). */
  const res = () => Math.min(4, Math.ceil(NX.cam.k * (NX.loop.dpr || 1) * 2) / 2);
  /** Бічна грань-чотирикутник: точки в одиницях кімнати. */
  function side(c, pts, col) { c.fillStyle = col; c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.fill(); }
  /** Точка, зсунута до точки сходу меблів на частку f (товща меблів, що "тікає" до вікна). */
  const toVP = (x, y, f) => { const VP = (NX.persp.desk || NX.persp).VP; return [x + (VP[0] - x) * f, y + (VP[1] - y) * f]; };
  /** Полотно для живого екрана. */
  const canvas = (w, h) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const x = cv.getContext('2d'); x.imageSmoothingEnabled = false; return [cv, x]; };
  return { Sheet, ramp, PAL, fit, res, side, toVP, canvas };
})();
