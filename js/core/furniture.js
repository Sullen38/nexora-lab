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
 *     .canvas()                        готове полотно (з темним контуром навколо)
 *   ramp(pal, q, i, j, grain)  — тон палітри за освітленістю q 0..1 + дизеринг Байєра
 *   PAL                         — палітри кімнати (темно-синій, рожевий неон, блакитний, голо-синій...)
 *   fit(cv, w, h, R)            — растр, один раз зменшений під роздільність екрана
 *   warp(c, src, q, step)       — пласке полотно -> чотирикутник у перспективі стовпчиками (голо-панелі, живі грані)
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
      /** Многокутник (правило парності). Швидко: для кожного рядка пікселів один раз рахуємо перетини з ребрами
       *  і заливаємо проміжки [c0, c1), [c2, c3)… — результат той самий піксель-у-піксель, що й перевірка
       *  «точка в многокутнику» для кожного пікселя, але в десятки разів швидше (рослини, листя, постери). */
      poly(pts, fn) {
        const n = pts.length, xs = pts.map(p => p[0]), ys = pts.map(p => p[1]), ax = Math.min(...xs), bx = Math.max(...xs), ay = Math.min(...ys), by = Math.max(...ys), BX = bx + U, BY = by + U;
        const i0 = Math.max(0, Math.floor(px(ax))), i1 = Math.min(W, Math.ceil(px(BX))), j0 = Math.max(0, Math.floor(py(ay))), j1 = Math.min(H, Math.ceil(py(BY))), cs = [];
        for (let j = j0; j < j1; j++) {
          const Y = y0 + (j + .5) * U; if (Y < ay || Y >= BY) continue;
          cs.length = 0;
          for (let a = 0, b = n - 1; a < n; b = a++) { const xa = pts[a][0], ya = pts[a][1], xb = pts[b][0], yb = pts[b][1]; if ((ya > Y) !== (yb > Y)) cs.push((xb - xa) * (Y - ya) / (yb - ya) + xa); }
          if (cs.length < 2) continue; cs.sort((p, q) => p - q);
          for (let k = 0; k + 1 < cs.length; k += 2) {
            const lo = cs[k], hi = cs[k + 1], ia = Math.max(i0, Math.floor((lo - x0) / U - .5)), ib = Math.min(i1, Math.ceil((hi - x0) / U));
            for (let i = ia; i < ib; i++) {
              const X = x0 + (i + .5) * U; if (X < lo || X >= hi || X < ax || X >= BX) continue;
              const col = typeof fn === 'string' ? fn : fn((X - ax) / (bx - ax), (Y - ay) / (by - ay), i, j, X, Y); if (col) r.set(i, j, col);
            }
          }
        }
      },
      set(X, Y, col) { r.set(Math.floor(px(X)), Math.floor(py(Y)), col); },
      canvas(out = PAL.OUT) { if (out) outline(r, out); return r.canvas(); },
    };
    return S;
  }
  /** Гомографія: одиничний квадрат (u, v) -> чотирикутник q = [p00, p10, p11, p01]; fwd і зворотна inv. */
  function homo(q) {
    const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = q;
    const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3, dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
    let g = 0, h = 0;
    if (Math.abs(dx3) > 1e-9 || Math.abs(dy3) > 1e-9) { const den = dx1 * dy2 - dx2 * dy1; g = (dx3 * dy2 - dx2 * dy3) / den; h = (dx1 * dy3 - dx3 * dy1) / den; }
    const a = x1 - x0 + g * x1, b = x3 - x0 + h * x3, c = x0, d = y1 - y0 + g * y1, e = y3 - y0 + h * y3, f = y0;
    const A = e - f * h, B = c * h - b, C = b * f - c * e, D = f * g - d, E = a - c * g, F = c * d - a * f, G = d * h - e * g, Hh = b * g - a * h, I = a * e - b * d;
    return {
      fwd(u, v) { const w = g * u + h * v + 1; return [(a * u + b * v + c) / w, (d * u + e * v + f) / w]; },
      inv(X, Y) { const w = G * X + Hh * Y + I; return [(A * X + B * Y + C) / w, (D * X + E * Y + F) / w]; },
    };
  }
  /** Пласке полотно src -> чотирикутник з вертикальними боками (q = [лв, пв, пн, лн]) стовпчиками шириною step:
   *  текстура лягає з перспективою (кожен стовпчик — точний відрізок картинки). */
  function warp(c, src, q, step) {
    const Hm = homo(q), [[xl, ytl], [xr, ytr], [, ybr], [, ybl]] = q, W = src.width, Hs = src.height;
    for (let X = xl; X < xr - 1e-6; X += step) {
      const X2 = Math.min(xr, X + step), t = ((X + X2) / 2 - xl) / (xr - xl), top = ytl + (ytr - ytl) * t, bot = ybl + (ybr - ybl) * t;
      const ua = Math.max(0, Hm.inv(X, ytl + (ytr - ytl) * (X - xl) / (xr - xl))[0]), ub = Math.min(1, Hm.inv(X2, ytl + (ytr - ytl) * (X2 - xl) / (xr - xl))[0]);
      if (ub > ua) c.drawImage(src, ua * W, 0, Math.max(.5, (ub - ua) * W), Hs, X, top, X2 - X + .03, bot - top);
    }
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
  return { Sheet, ramp, PAL, fit, res, homo, warp };
})();
