/* ============================================================================
 * core/px3d.js — ПІКСЕЛЬНЕ 3D (NX.px3d): справжні об'єми в перспективі кімнати
 * ----------------------------------------------------------------------------
 * Маленький програмний 3D-рушій для крил «по дузі» (гілка rw-arc). Малює ПРЯМО В ПІКСЕЛІ растра
 * (без розмиття), з z-буфером — тож хто кого закриває, рахується для кожного пікселя, а не порядком малювання.
 * Перспектива — та сама, що в кімнаті (core/persp.js): точка сходу VP (774, 220), D 520, око (774, 220, −520);
 * світ: x — вправо, y — вниз (підлога 372), z — углиб (0 — площина картинки).
 *
 *   Layer(x0, y0, x1, y1, R)  — растр над прямокутником кімнати (R пікселів на одиницю): колір (Uint32), глибина,
 *                               номер предмета (контур), номер грані (живі екрани), прапорці (світиться, підлога, глянець)
 *   face(L, poly, O, A, B, shade, o)
 *                             — плоский многокутник світу; u, v — уздовж осей A, B від точки O (0..1 на всю грань);
 *                               shade(u, v, i, j, t) -> упакований колір (0 — дірка); o: {id, fid, n — зовнішня нормаль
 *                               (невидимі грані відкидаються), fl — прапорці, bias}
 *   sprite(L, img, x, y, z, w, h, o)
 *                             — плаский спрайт (рослина), що стоїть у точці світу (x, y — низ по центру, z) лицем до глядача
 *   outline(L, out, w)        — темний контур по силуету кожного предмета (де сусід — порожньо або інший предмет позаду)
 *   reflect(L, sup, o)        — ВІДДЗЕРКАЛЕННЯ в глянці (o.streak — вертикальні смуги мокрого глянцю): кожен піксель предмета «відбивається» в площині, на якій він
 *                               стоїть (підлога y 372 або глянцевий верх стола) — точно, як справжнє дзеркало, без ще
 *                               одного проходу сцени: точка (x, y, z) -> (x, 2·yп − y, z) на тому ж стовпчику екрана
 *   canvas(L)                 — готове полотно растра
 *   col(hex) / rgb(r,g,b,a) / mixc(a, b, k) / dim(c, k) — упаковані кольори (ABGR, як у ImageData)
 *   ramp(pal, q, i, j)        — тон палітри за освітленістю q 0..1 + 8-bit дизеринг Байєра (палітра — упаковані кольори)
 * Швидкість: на піксель — одне ділення (u, v і глибина лінійні вздовж рядка), грані без кольору не пишуть глибину.
 * ========================================================================== */
NX.px3d = (() => {
  const PZ = NX.persp, VX = PZ.VP[0], VY = PZ.VP[1], D = PZ.D, EZ = -D;          // око E = (VX, VY, −D)
  const BAY = NX.art.BAYER;
  // ---------- упаковані кольори (ABGR у пам'яті — як ImageData на little-endian) ----------
  const rgb = (r, g, b, a = 255) => ((a << 24) | ((b & 255) << 16) | ((g & 255) << 8) | (r & 255)) >>> 0;
  const CC = new Map();
  const col = h => { let c = CC.get(h); if (c === undefined) { const n = parseInt(h.slice(1, 7), 16); c = rgb(n >> 16, (n >> 8) & 255, n & 255, h.length > 7 ? parseInt(h.slice(7, 9), 16) : 255); CC.set(h, c); } return c; };
  const R_ = c => c & 255, G_ = c => (c >>> 8) & 255, B_ = c => (c >>> 16) & 255, A_ = c => c >>> 24;
  const mixc = (a, b, k) => { if (k <= 0) return a; if (k >= 1) return b; const q = 1 - k; return rgb(R_(a) * q + R_(b) * k, G_(a) * q + G_(b) * k, B_(a) * q + B_(b) * k, A_(a) * q + A_(b) * k); };
  const dim = (c, k) => rgb(Math.min(255, R_(c) * k), Math.min(255, G_(c) * k), Math.min(255, B_(c) * k), A_(c));
  const add = (c, d, k = 1) => rgb(Math.min(255, R_(c) + R_(d) * k), Math.min(255, G_(c) + G_(d) * k), Math.min(255, B_(c) + B_(d) * k), A_(c));
  const pal = list => Uint32Array.from(list, col);
  /** Тон палітри за освітленістю q 0..1 + дизеринг Байєра (у растрі i, j). */
  const ramp = (P, q, i, j) => { const n = P.length - 1; let k = Math.round((q < 0 ? 0 : q > 1 ? 1 : q) * n + BAY[(j & 3) * 4 + (i & 3)] * .9); return P[k < 0 ? 0 : k > n ? n : k]; };
  const lum = c => (R_(c) * 3 + G_(c) * 6 + B_(c)) / 2550;

  // ---------- вектори ----------
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  /** Нормаль многокутника (метод Ньюелла — стійкий до майже вироджених точок). */
  function newell(P) { let x = 0, y = 0, z = 0; for (let i = 0, n = P.length; i < n; i++) { const a = P[i], b = P[(i + 1) % n]; x += (a[1] - b[1]) * (a[2] + b[2]); y += (a[2] - b[2]) * (a[0] + b[0]); z += (a[0] - b[0]) * (a[1] + b[1]); } return [x, y, z]; }
  const proj = q => { const k = D / (D + q[2]); return [VX + (q[0] - VX) * k, VY + (q[1] - VY) * k]; };

  // ---------- растр ----------
  const F_EMIT = 1, F_FLOOR = 2, F_GLOSS = 4, F_NOOUT = 8, F_REFL = 16;       // прапорці пікселя
  function Layer(x0, y0, x1, y1, R = 4) {
    const W = Math.max(1, Math.ceil((x1 - x0) * R)), H = Math.max(1, Math.ceil((y1 - y0) * R)), n = W * H;
    return { x0, y0, x1: x0 + W / R, y1: y0 + H / R, R, W, H, c: new Uint32Array(n), dep: new Float32Array(n).fill(Infinity), id: new Uint16Array(n), fid: new Uint16Array(n), fl: new Uint8Array(n), info: [null] };
  }
  /** Поточні прапорці пікселя, які може виставити shade() (напр. «світиться» — неон, екран). */
  const SH = { fl: 0 };

  /** Плоска грань. poly — точки світу; O, A, B — параметризація (u = 0..1 уздовж A, v = 0..1 уздовж B). */
  function face(L, poly, O, A, B, shade, o = {}) {
    if (poly.length < 3) return 0;
    let n = o.n || newell(poly);
    const E = [VX, VY, EZ];
    if (o.n && dot(n, sub(E, poly[0])) <= 1e-6) return 0;                       // грань дивиться від ока
    if (!o.n && dot(n, sub(E, poly[0])) < 0) n = [-n[0], -n[1], -n[2]];          // двобічна: нормаль — до ока
    const c0 = dot(n, poly[0]), num = c0 - dot(n, E);
    if (Math.abs(num) < 1e-9) return 0;                                           // площина проходить через око
    // осі u, v -> двоїсті вектори (працює й для непрямокутних A, B)
    const bn = cross(B, n), na = cross(n, A), au = dot(A, bn), bv = dot(B, na);
    if (Math.abs(au) < 1e-12 || Math.abs(bv) < 1e-12) return 0;
    const Au = [bn[0] / au, bn[1] / au, bn[2] / au], Bv = [na[0] / bv, na[1] / bv, na[2] / bv];
    const EO = sub(E, O), u0 = dot(EO, Au), v0 = dot(EO, Bv);
    const S = poly.map(proj), R = L.R, W = L.W, H = L.H, x0 = L.x0, y0 = L.y0;
    let ya = 1e9, yb = -1e9; for (const p of S) { if (p[1] < ya) ya = p[1]; if (p[1] > yb) yb = p[1]; }
    const j0 = Math.max(0, Math.floor((ya - y0) * R)), j1 = Math.min(H, Math.ceil((yb - y0) * R));
    const id = o.id || 0, fid = o.fid || 0, fl0 = o.fl || 0, bias = o.bias || 0, nS = S.length, xs = [];
    const C = L.c, DEP = L.dep, ID = L.id, FID = L.fid, FL = L.fl;
    let drawn = 0;
    for (let j = j0; j < j1; j++) {
      const Y = y0 + (j + .5) / R; xs.length = 0;
      for (let a = 0, b = nS - 1; a < nS; b = a++) { const ya2 = S[a][1], yb2 = S[b][1]; if ((ya2 > Y) !== (yb2 > Y)) xs.push(S[a][0] + (S[b][0] - S[a][0]) * (Y - ya2) / (yb2 - ya2)); }
      if (xs.length < 2) continue; xs.sort((p, q) => p - q);
      const dy = Y - VY, ndY = n[1] * dy + n[2] * D, duY = Au[1] * dy + Au[2] * D, dvY = Bv[1] * dy + Bv[2] * D, row = j * W;
      for (let s = 0; s + 1 < xs.length; s += 2) {
        const i0 = Math.max(0, Math.ceil((xs[s] - x0) * R - .5)), i1 = Math.min(W, Math.ceil((xs[s + 1] - x0) * R - .5));
        for (let i = i0; i < i1; i++) {
          const dx = x0 + (i + .5) / R - VX, nd = n[0] * dx + ndY; if (nd === 0) continue;
          const t = num / nd; if (t <= 0) continue;
          const k = row + i, tb = t - bias; if (tb >= DEP[k]) continue;
          const u = u0 + t * (Au[0] * dx + duY), v = v0 + t * (Bv[0] * dx + dvY);
          SH.fl = fl0; const cc = shade(u, v, i, j, t); if (!cc) continue;
          C[k] = cc; DEP[k] = tb; ID[k] = id; FID[k] = fid; FL[k] = SH.fl; drawn++;
        }
      }
    }
    return drawn;
  }

  /** Плаский спрайт (рослина, ліана): img = {d: Uint32Array, w, h} у пікселях, світові розміри w × h,
   *  (x, y, z) — низ по центру (або верх для hang). Глибина стала (площина паралельна екрану) + o.bias. */
  function sprite(L, img, x, y, z, w, h, o = {}) {
    const k = D / (D + z), t = (D + z) / D - (o.bias || 0), X = VX + (x - VX) * k, Yb = VY + (y - VY) * k, sw = w * k, sh = h * k;
    const Xa = X - sw / 2, Ya = o.hang ? Yb : Yb - sh, R = L.R, W = L.W, H = L.H;
    const i0 = Math.max(0, Math.floor((Xa - L.x0) * R)), i1 = Math.min(W, Math.ceil((Xa + sw - L.x0) * R));
    const j0 = Math.max(0, Math.floor((Ya - L.y0) * R)), j1 = Math.min(H, Math.ceil((Ya + sh - L.y0) * R));
    const id = o.id || 0, fid = o.fid || 0, fl = o.fl || 0, sd = img.d, iw = img.w, ih = img.h, C = L.c, DEP = L.dep, ID = L.id, FID = L.fid, FL = L.fl, tint = o.tint;
    let drawn = 0;
    for (let j = j0; j < j1; j++) {
      const v = ((L.y0 + (j + .5) / R) - Ya) / sh; if (v < 0 || v >= 1) continue; const sy = (v * ih) | 0, row = j * W;
      for (let i = i0; i < i1; i++) {
        const u = ((L.x0 + (i + .5) / R) - Xa) / sw; if (u < 0 || u >= 1) continue;
        const px = sd[sy * iw + ((u * iw) | 0)]; if ((px >>> 24) < 128) continue;
        const kk = row + i; if (t >= DEP[kk]) continue;
        C[kk] = tint ? tint(px, u, v, i, j) : (px | 0xff000000) >>> 0; DEP[kk] = t; ID[kk] = id; FID[kk] = fid; FL[kk] = fl; drawn++;
      }
    }
    return drawn;
  }
  /** Трубка (ланка маніпулятора, кабель, прут поручня) від a до b, товщина w: стрічка, повернута до ока;
   *  shade(u, v, i, j, t): u — поперек (0..1, середина — 0.5 — найсвітліша), v — уздовж. */
  function tube(L, a, b, w, shade, o = {}) {
    const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], ax = sub(b, a), toE = sub([VX, VY, EZ], m);
    let p = cross(ax, toE); const l = Math.hypot(p[0], p[1], p[2]) || 1; p = [p[0] / l * w / 2, p[1] / l * w / 2, p[2] / l * w / 2];
    const q = [[a[0] + p[0], a[1] + p[1], a[2] + p[2]], [b[0] + p[0], b[1] + p[1], b[2] + p[2]], [b[0] - p[0], b[1] - p[1], b[2] - p[2]], [a[0] - p[0], a[1] - p[1], a[2] - p[2]]];
    return face(L, q, q[0], [-2 * p[0], -2 * p[1], -2 * p[2]], ax, shade, Object.assign({}, o, { n: null }));
  }
  /** Диск (суглоб, кулька, лампочка) з центром c і радіусом r, лицем до глядача: shade(u, v, ...) у квадраті 0..1,
   *  поза колом — дірка. */
  function disc(L, c, r, shade, o = {}) {
    const q = [[c[0] - r, c[1] - r, c[2]], [c[0] + r, c[1] - r, c[2]], [c[0] + r, c[1] + r, c[2]], [c[0] - r, c[1] + r, c[2]]];
    return face(L, q, q[0], [2 * r, 0, 0], [0, 2 * r, 0], (u, v, i, j, t) => ((u - .5) ** 2 + (v - .5) ** 2 > .25 ? 0 : shade(u, v, i, j, t)), Object.assign({}, o, { n: [0, 0, -1] }));
  }
  /** Полотно -> {d, w, h} для sprite(). */
  function imgData(cv) { const x = cv.getContext('2d', { willReadFrequently: true }), im = x.getImageData(0, 0, cv.width, cv.height); return { d: new Uint32Array(im.data.buffer), w: cv.width, h: cv.height }; }

  /** Контур по силуету: піксель предмета, поруч з яким (на відстані до w) порожньо або інший предмет помітно далі,
   *  стає кольором out (або out(id)). Межі між гранями ОДНОГО предмета не обводяться — там працює фаска матеріалу. */
  function outline(L, out = col('#060313'), w = 2, rel = .006) {
    const { W, H, id: ID, dep: DP, c: C, fl: FL } = L, mark = new Uint8Array(W * H), oc = typeof out === 'function' ? out : () => out;
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const k = j * W + i, a = ID[k]; if (!a || (FL[k] & F_NOOUT)) continue; const d = DP[k] * (1 + rel);
      let edge = false;
      for (let s = 1; s <= w && !edge; s++) {
        if (i - s < 0 || i + s >= W || j - s < 0 || j + s >= H) { edge = true; break; }
        const q1 = k - s, q2 = k + s, q3 = k - s * W, q4 = k + s * W;
        if ((ID[q1] !== a && DP[q1] > d) || (ID[q2] !== a && DP[q2] > d) || (ID[q3] !== a && DP[q3] > d) || (ID[q4] !== a && DP[q4] > d)) edge = true;
      }
      if (edge) mark[k] = 1;
    }
    for (let k = 0; k < mark.length; k++) if (mark[k]) { const o = oc(ID[k]); if (o) C[k] = (FL[k] & F_EMIT) ? mixc(C[k], o, .55) : o; }
  }

  /** ВІДДЗЕРКАЛЕННЯ в глянці. sup(id) -> {y — площина опори (підлога 372 або верх стола), on — id глянцевої опори (0 — підлога)}
   *  або null (не відбивається). Відбиток лягає на пікселі підлоги / глянцю опори цього растра або на порожні (там підлога
   *  іншого растра — тоді піксель напівпрозорий). o: {a — сила біля опори, h — висота згасання, emit — підсилення неону}. */
  function reflect(L, sup, o = {}) {
    const { W, H, R, x0, y0, id: ID, dep: DP, c: C, fl: FL } = L, A0 = o.a || .42, H0 = o.h || 46, EM = o.emit || 2.1, ST = o.streak ? new Float32Array(W).map((_, i) => .62 + .38 * NX.art.hash(i >> 1, 7) * NX.art.hash(i >> 3, 3)) : null;
    const RD = new Float32Array(W * H).fill(Infinity), RC = new Uint32Array(W * H), RA = new Float32Array(W * H), cache = [];
    for (let j = 0; j < H; j++) {
      const Y = y0 + (j + .5) / R;
      for (let i = 0; i < W; i++) {
        const k = j * W + i, a = ID[k]; if (!a || (FL[k] & (F_FLOOR | F_GLOSS))) continue;
        let sp = cache[a]; if (sp === undefined) { sp = cache[a] = sup(a) || null; } if (!sp) continue;
        const t = DP[k], yw = VY + (Y - VY) * t, h = sp.y - yw; if (h < -.5) continue;
        const Ys = VY + (sp.y - VY) / t, Y2 = 2 * Ys - Y, j2 = Math.floor((Y2 - y0) * R); if (j2 < 0 || j2 >= H) continue;
        const k2 = j2 * W + i, f2 = FL[k2];
        if (sp.on ? !(ID[k2] === sp.on && (f2 & F_GLOSS)) : !(ID[k2] === 0 || (f2 & F_FLOOR))) continue;
        if (t >= RD[k2]) continue;
        const em = (FL[k] & F_EMIT) ? EM : 1, al = Math.min(.92, A0 * em * Math.exp(-Math.max(0, h) / (sp.h || H0)) * (sp.k || 1) * (ST ? ST[i] : 1));   // streak — «мокрі» смуги глянцю
        RD[k2] = t; RC[k2] = C[k]; RA[k2] = al;
      }
    }
    for (let k = 0; k < W * H; k++) {
      const al = RA[k]; if (al <= .004) continue;
      if (ID[k] === 0) { C[k] = (RC[k] & 0x00ffffff | (Math.round(al * 255) << 24)) >>> 0; FL[k] |= F_REFL; }
      else C[k] = mixc(C[k], add(C[k], RC[k], .9), al);
    }
  }

  /** Растр -> полотно. */
  function canvas(L) {
    const cv = document.createElement('canvas'); cv.width = L.W; cv.height = L.H;
    cv.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(L.c.buffer.slice(0)), L.W, L.H), 0, 0); return cv;
  }
  /** Маска видимих пікселів грані fid (для живих екранів) у межах растра: {cv, x, y, w, h} у одиницях кімнати або null. */
  function mask(L, fids) {
    const set = new Set(Array.isArray(fids) ? fids : [fids]); let i0 = 1e9, i1 = -1, j0 = 1e9, j1 = -1;
    for (let j = 0; j < L.H; j++) for (let i = 0; i < L.W; i++) if (set.has(L.fid[j * L.W + i])) { if (i < i0) i0 = i; if (i > i1) i1 = i; if (j < j0) j0 = j; if (j > j1) j1 = j; }
    if (i1 < 0) return null;
    const w = i1 - i0 + 1, h = j1 - j0 + 1, cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const x = cv.getContext('2d'), im = x.createImageData(w, h), d = new Uint32Array(im.data.buffer);
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (set.has(L.fid[(j + j0) * L.W + i + i0])) d[j * w + i] = 0xffffffff;
    x.putImageData(im, 0, 0);
    return { cv, x: L.x0 + i0 / L.R, y: L.y0 + j0 / L.R, w: w / L.R, h: h / L.R };
  }
  return { VX, VY, D, EZ, rgb, col, pal, mixc, dim, add, ramp, lum, R_, G_, B_, A_, sub, dot, cross, newell, proj, Layer, face, sprite, tube, disc, imgData, outline, reflect, canvas, mask, SH,
    F_EMIT, F_FLOOR, F_GLOSS, F_NOOUT, F_REFL };
})();
