/* ============================================================================
 * world/city_build.js — ХМАРОЧОСИ ЗА ВІКНОМ v2 (NX.cityBuild): силуети, неон, вікна-стрічки
 * ----------------------------------------------------------------------------
 * Власник: «місто не дуже подобається». План (погоджено): менше веж, кожна зі своїм силуетом;
 * насичені індиго-сині фасади з неоновими кантами (як на картинці кімнати), вікна більші й рідші
 * (переважно лавандово-рожеві), три чіткі плани з серпанком, низ над диваном — низькі дахи й шосе.
 * Растри будинків — 2 px/од. (U = .5): «пікселі» міста крупніші, ближчі до піксель-арту картинки.
 *
 * Вежа = запис:
 *   x0, x1, top, bot  — фасад (bot за замовчуванням — низ растра)
 *   shape             — box | setback (tiers: [[відступ, висота], ...] згори вниз) | spire (sh — висота
 *                       шпиля, ins — відступ) | taper (k — ширина верху, th — висота звуження) | crown
 *                       (spikes, ch) | dome (dh) | round (скруглений верх) | twin (gap, dt, bridge, bh — міст)
 *   plane             — far | mid | near (палітра, серпанок, сила кантів); pal — палітра фасаду (FAC)
 *   win               — вікна: {style: grid | stripes | cols | dots | none, sx, sy — крок, w, h — розмір,
 *                       lit — частка світлих, cols — кольори світла (перший переважає), mx, my — поля}
 *   rimI / rimO       — неоновий кант з боку центру вікна (світло планети) / із зовнішнього боку
 *   ledge             — неон на кожному уступі й скосі даху; pil — пілястри (крок); bands — неонові пояси [[y, колір]]
 *   ant: [{x, h}]     — щогли з вогнем; needle — голка над верхівкою; gear — короби, бак, тарілка на даху
 *   ring              — кільце-майданчик навколо вежі {y, a, b}; sign — вертикальна вивіска; holo — голо-екран
 * Як малюється: силует -> маска (скан-рядки) -> фасад (тон від світла згори, темніша бічна грань з боку
 * центру вікна — перспектива кімнати, VP x 774) -> вікна лише всередині маски з полями від краю ->
 * канти по межі маски (бічні, верхні — уступи й скоси даху) -> серпанок плану (дизерингом).
 * Повертає живі точки: вогні щогл, «живі» вікна, вивіски, екрани, вогники майданчика.
 * Генератори: farBand — далекі силуети (з просвітами неба), lowRoofs — низькі дахи над диваном,
 * highway — естакада шосе, rail — монорейка.
 * ========================================================================== */
NX.cityBuild = (() => {
  const { col, pal, mix, B, rng, hash2, Ras, clamp } = NX.ckit;
  const VPX = (NX.persp && NX.persp.VP[0]) || 774;

  // ---------- палітри (темний -> світлий): насичені індиго й сині, як вежі на картинці ----------
  const FAC = {
    indigo: pal(['#08003e', '#0e0258', '#140a72', '#1a168a', '#2022a2', '#2830b8', '#3240cc', '#3e52de']),
    blue: pal(['#020838', '#041052', '#061a6c', '#0a2486', '#0e309e', '#143eb6', '#1c4eca', '#2860dc']),
    violet: pal(['#0e0036', '#16044e', '#200a66', '#2a107e', '#361896', '#4222aa', '#502ebe', '#6040ce']),
    far: pal(['#251c84', '#2d2494', '#352ca4', '#3f36b4', '#4a41c2', '#574ece']),
    near: pal(['#03021c', '#05042a', '#080838', '#0c0c48', '#121258', '#181868']),
  };
  const LITE = {                                                                   // світло вікон: [основний, яскравий, тьмяний]
    lav: pal(['#b07cff', '#e4ccff', '#5e34b0']), pink: pal(['#ff58d6', '#ffb4f2', '#9a2888']), cyan: pal(['#48d8ff', '#c0f6ff', '#1a62a0']),
    warm: pal(['#ffbe5c', '#ffe4a6', '#9a6220']), white: pal(['#d8d0ff', '#ffffff', '#6a62b4']), gold: pal(['#ffd36a', '#fff0b8', '#a07a28']),
  };
  const CSS = { lav: '#b888ff', pink: '#ff62d8', cyan: '#56dcff', warm: '#ffc65e', white: '#e0d8ff', gold: '#ffd870' };
  const NEON = { cyan: col('#3be8ff'), cyanL: col('#b4f8ff'), blue: col('#5a7cff'), blueL: col('#a8beff'), pink: col('#ff4fd8'), pinkL: col('#ffb0ee'), violet: col('#a87aff'), gold: col('#ffd36a') };
  const OUT = col('#04020f'), HAZE = { far: col('#c650e0'), glow: col('#cc4ce8'), mid: col('#4a34c4'), near: col('#2a2080') };
  const BASE = { far: .5, mid: .28, near: .26 };

  // ---------- силует ----------
  function silhouette(b) {
    const { x0, x1, top } = b, bot = b.bot, w = x1 - x0, cx = (x0 + x1) / 2, P = [], box = (a, t, c, d) => P.push([[a, t], [c, t], [c, d], [a, d]]);
    switch (b.shape || 'box') {
      case 'setback': { let y = top; (b.tiers || [[w * .25, 10]]).forEach(([ins, h]) => { box(x0 + ins, y, x1 - ins, y + h + .01); y += h; }); box(x0, y, x1, bot); break; }
      case 'spire': { const ins = b.ins == null ? w * .18 : b.ins, h = b.sh || 16; P.push([[x0 + ins, top + .01], [cx - .5, top - h], [cx + .5, top - h], [x1 - ins, top + .01]]); box(x0, top, x1, bot); break; }
      case 'taper': { const tw = w * (b.k || .5) / 2, th = b.th || 40; P.push([[cx - tw, top], [cx + tw, top], [x1, top + th], [x1, bot], [x0, bot], [x0, top + th]]); break; }
      case 'crown': { box(x0, top, x1, bot); const n = b.spikes || 5;
        for (let k = 0; k < n; k++) { const a = x0 + (k + .12) * w / n, c = x0 + (k + .88) * w / n, h = (b.ch || 6) * (k === (n >> 1) ? 1.9 : k % 2 ? 1 : .62); P.push([[a, top + .01], [(a + c) / 2 - .3, top - h], [(a + c) / 2 + .3, top - h], [c, top + .01]]); } break; }
      case 'dome': { box(x0, top, x1, bot); const r = w / 2 - (b.ins || 1), rh = b.dh || r * .75, pts = []; for (let k = 0; k <= 18; k++) { const a = Math.PI * k / 18; pts.push([cx - Math.cos(a) * r, top + .01 - Math.sin(a) * rh]); } P.push(pts); break; }
      case 'round': { const r = w / 2, pts = [[x0, bot], [x0, top + r]]; for (let k = 0; k <= 18; k++) { const a = Math.PI * (1 - k / 18); pts.push([cx + Math.cos(a) * r, top + r - Math.sin(a) * r * (b.flat || 1)]); } pts.push([x1, bot]); P.push(pts); break; }
      case 'twin': { const g = b.gap == null ? w * .22 : b.gap, tw = (w - g) / 2; box(x0, top, x0 + tw, bot); box(x1 - tw, top + (b.dt || 0), x1, bot); if (b.bridge) box(x0 + tw - .2, b.bridge, x1 - tw + .2, b.bridge + (b.bh || 4)); break; }
      default: box(x0, top, x1, bot);
    }
    return P;
  }
  /** Маска силуету в сітці растра R (union многокутників, скан-рядки). */
  function maskOf(R, polys) {
    let ax = Infinity, bx = -Infinity, ay = Infinity, by = -Infinity;
    polys.forEach(p => p.forEach(([x, y]) => { if (x < ax) ax = x; if (x > bx) bx = x; if (y < ay) ay = y; if (y > by) by = y; }));
    const i0 = Math.max(0, R.I(ax) - 1), i1 = Math.min(R.W - 1, R.I(bx) + 1), j0 = Math.max(0, R.J(ay) - 1), j1 = Math.min(R.H - 1, R.J(by) + 1);
    if (i1 < i0 || j1 < j0) return null;
    const W = i1 - i0 + 1, H = j1 - j0 + 1, m = new Uint8Array(W * H), cs = [];
    polys.forEach(pts => { const n = pts.length;
      for (let j = 0; j < H; j++) { const Y = R.Y(j + j0); cs.length = 0;
        for (let a = 0, b = n - 1; a < n; b = a++) { const ya = pts[a][1], yb = pts[b][1]; if ((ya > Y) !== (yb > Y)) cs.push(pts[a][0] + (pts[b][0] - pts[a][0]) * (Y - ya) / (yb - ya)); }
        cs.sort((p, q) => p - q);
        for (let k = 0; k + 1 < cs.length; k += 2) { const a = Math.max(0, Math.ceil((cs[k] - R.x0) / R.U - .5) - i0), e = Math.min(W, Math.ceil((cs[k + 1] - R.x0) / R.U - .5) - i0); for (let i = a; i < e; i++) m[j * W + i] = 1; }
      } });
    return { m, i0, j0, W, H, at: (i, j) => (i < 0 || j < 0 || i >= W || j >= H) ? 0 : m[j * W + i] };
  }

  // ---------- вежа ----------
  function tower(R, b, live, seed) {
    const bot = Math.min(R.y1, b.bot || R.y1), bb = { ...b, bot }, M = maskOf(R, silhouette(bb)); if (!M) return;
    const plane = b.plane || 'mid', P = b.pal || (plane === 'far' ? FAC.far : plane === 'near' ? FAC.near : FAC.indigo), n = P.length;
    const { x0, x1, top } = b, w = x1 - x0, cx = (x0 + x1) / 2, inner = cx < VPX ? 1 : -1;
    const sw = plane === 'far' ? 0 : clamp(Math.abs(cx - VPX) * (plane === 'near' ? .07 : .04), 1, 6) * (b.side == null ? 1 : b.side);   // бічна грань (од.)
    const rimI = b.rimI === undefined ? (plane === 'far' ? 0 : NEON.blueL) : b.rimI, rimO = b.rimO === undefined ? (plane === 'mid' ? NEON.violet : 0) : b.rimO;
    const rimLen = b.rimLen || (plane === 'near' ? 30 : 110), ledge = b.ledge || 0;
    // вікна
    const WIN = b.win || {}, style = WIN.style || (plane === 'far' ? 'dots' : 'grid'), sx = WIN.sx || 3, sy = WIN.sy || 3.4, ww = WIN.w || 1.5, wh = WIN.h || 1, lit = WIN.lit == null ? .42 : WIN.lit;
    const cols = (WIN.cols || ['lav', 'pink']).map(k => [LITE[k], k]), seg = WIN.seg || 4;
    const mH = Math.max(1, Math.round((WIN.mx == null ? 1.5 : WIN.mx) / R.U)), mV = Math.max(1, Math.round((WIN.my == null ? 2 : WIN.my) / R.U));
    const ncol = Math.max(1, Math.floor((w - 2 * R.U * mH + (sx - ww)) / sx)), mx = (w - (ncol * sx - (sx - ww))) / 2, my0 = WIN.my0 == null ? 2 : WIN.my0;
    const floorLit = f => { const h = hash2(seed * 7 + f, 99); return h < .14 ? 1.7 : h > .82 ? .2 : 1; };   // поверх: увесь світиться / темний / звичайний
    const winCol = (cell, f) => { const h = hash2(cell * 5 + seed, f); return cols.length < 2 || h < .72 ? cols[0] : cols[1 + Math.floor((h - .72) / .28 * (cols.length - 1)) % (cols.length - 1)]; };
    /** Клітинка вікна в точці (X, ly): номер або -1 (простінок), для кожного стилю. */
    const cellAt = (X, ly) => {
      const fl = Math.floor((ly - my0) / sy), fy = ly - my0 - fl * sy; if (fl < 0) return -1;
      if (style === 'stripes') { if (fy >= wh) return -1; const u = (X - x0) % seg; return u < seg - .5 ? Math.floor((X - x0) / seg) : -1; }
      if (style === 'cols') { if (fy >= sy - .5) return -1; const lx = X - x0 - mx, c = Math.floor(lx / sx); return lx >= 0 && c < ncol && lx - c * sx < ww ? c : -1; }
      if (fy >= wh) return -1; const lx = X - x0 - mx, c = Math.floor(lx / sx); return lx >= 0 && c < ncol && lx - c * sx < ww ? c : -1;
    };
    for (let j = 0; j < M.H; j++) {
      const jj = j + M.j0, Y = R.Y(jj), ly = Y - top, fl = Math.floor((ly - my0) / sy), fF = floorLit(fl), sill = ((ly - my0) - fl * sy) > (style === 'cols' ? sy - .5 : wh) - R.U * 1.01;
      // тон і серпанок рядка
      const q0 = BASE[plane] + (b.q || 0) + .16 * clamp(1 - ly / 24, 0, 1) - .12 * clamp(ly / 150, 0, 1);
      let hz = 0, hc = HAZE.mid, hz2 = 0;
      if (plane === 'far') { hz = clamp((Y - 98) / 44, 0, 1) * .62; hc = HAZE.far; }
      else if (plane === 'mid') { hz = .2 * Math.exp(-(((Y - 136) / 14) ** 2)); hc = HAZE.glow; hz2 = clamp((Y - 162) / 70, 0, 1) * .32; }
      else hz2 = clamp((Y - 236) / 60, 0, 1) * .25;
      const rimF = clamp(1 - ly / rimLen, .22, 1);
      for (let i = 0; i < M.W; i++) {
        if (!M.m[j * M.W + i]) continue;
        const ii = i + M.i0, X = R.X(ii), L = !M.at(i - 1, j), Rt = !M.at(i + 1, j), T = !M.at(i, j - 1);
        const xin = inner > 0 ? x1 - X : X - x0, side = xin < sw;
        let c = P[clamp(Math.round((q0 - (side ? .2 : 0) + (b.pil && ((X - x0 + b.pil / 2) % b.pil) < .8 ? .12 : 0)) * (n - 1) + B(ii, jj) * .9), 0, n - 1)];
        // вікна: лише всередині силуету з полями від краю
        if (style !== 'none' && !side && M.at(i - mH, j) && M.at(i + mH, j) && M.at(i, j - mV) && Y < bot - 1.5) {
          const cell = cellAt(X, ly);
          if (cell >= 0) {
            if (style === 'dots' ? hash2(seed * 131 + cell, fl * 17 + 3) < lit : hash2(seed * 131 + cell, fl * 17 + 3) < lit * fF) { const pk = winCol(cell, fl)[0]; c = sill ? pk[2] : hash2(cell, fl + seed) > .85 ? pk[1] : pk[0]; }
            else if (plane !== 'far') c = mix(c, '#3448c8', .22);                    // темне скло
          }
        } else if (side && style !== 'none' && plane !== 'far' && M.at(i, j - mV) && cellAt(X, ly) >= 0 && hash2(seed + ii, fl) > .8) c = mix(c, cols[0][0][2], .55);   // рідкі тьмяні вікна на бічній грані
        // канти: бічні (з боку центру — світло планети) і верхні (уступи, скоси даху)
        if (L || Rt) { const isIn = (Rt && inner > 0) || (L && inner < 0), rc = isIn ? rimI : rimO; if (rc) c = mix(c, rc, rimF * (isIn ? 1 : .6)); }
        else if (rimI && plane !== 'far' && ((inner > 0 && !M.at(i + 2, j)) || (inner < 0 && !M.at(i - 2, j)))) c = mix(c, rimI, rimF * .45);
        if (T) c = ledge ? ledge : mix(c, rimI || P[n - 1], plane === 'far' ? .3 : .55);
        // серпанок плану (дизерингом)
        if (hz > 0) { const k = Math.floor(hz * 4 + B(ii + 1, jj) + .5) / 4; if (k > 0) c = mix(c, hc, k); }
        if (hz2 > 0) { const k = Math.floor(hz2 * 4 + B(ii, jj + 1) + .5) / 4; if (k > 0) c = mix(c, plane === 'near' ? HAZE.near : HAZE.mid, k); }
        R.d[jj * R.W + ii] = c;
      }
    }
    // неонові пояси — лише в межах силуету
    (b.bands || []).forEach(([y, cc]) => { const j = R.J(y) - M.j0; if (j < 0 || j >= M.H) return; for (let i = 0; i < M.W; i++) if (M.m[j * M.W + i]) { R.d[(j + M.j0) * R.W + i + M.i0] = cc; R.over(i + M.i0, j + M.j0 + 1, cc, .3); } });
    if (b.ring) ringOf(R, b, M);
    roof(R, b, live, rng(seed));
    if (b.sign) { signBoard(R, b.sign); live.signs.push(b.sign); }
    if (b.holo) { const h = b.holo; R.rect(h.x - .5, h.y - .5, h.x + h.w + .5, h.y + h.h + .5, OUT); R.rect(h.x, h.y, h.x + h.w, h.y + h.h, (i, j) => (i + j) & 1 ? col('#071a3a') : col('#0a2450')); live.holo.push(h); }
    if (b.pad) live.pad.push(...b.pad);
    // «живі» вікна: зараз темні, засвічуються й гаснуть (cityscape.js) — клітинки одразу за порогом світла
    if (plane !== 'far' && style !== 'none') {
      const cap = live.win.length + (b.liveMax || 5), nf = Math.floor((bot - 3 - top - my0) / sy);
      for (let f = 1; f <= nf && live.win.length < cap; f++) { const thr = lit * floorLit(f);
        for (let cl = 0; cl < (style === 'stripes' ? Math.ceil(w / seg) : ncol) && live.win.length < cap; cl++) { const h = hash2(seed * 131 + cl, f * 17 + 3); if (h < thr || h > thr + .06) continue;
          const wx = style === 'stripes' ? x0 + cl * seg : x0 + mx + cl * sx, wy = top + my0 + f * sy, wwid = style === 'stripes' ? seg - .5 : ww, whh = style === 'cols' ? sy - .5 : wh;
          const ok = [[wx, wy], [wx + wwid, wy], [wx, wy + whh], [wx + wwid, wy + whh]].every(([px, py]) => { const i = R.I(px) - M.i0, j = R.J(py) - M.j0; return M.at(i - mH, j) && M.at(i + mH, j) && M.at(i, j - mV); });
          const xin = inner > 0 ? x1 - (wx + wwid) : wx - x0;
          if (ok && xin >= sw) live.win.push({ x: wx, y: wy, w: wwid, h: whh - R.U, c: CSS[winCol(cl, f)[1]], f: .2 + hash2(cl, f) * .8, ph: hash2(f, cl) * 6.28 }); } }
    }
  }
  /** Кільце-майданчик навколо вежі: задня половина — за вежею, передня — поперед неї, неоновий край. */
  function ringOf(R, b, M) {
    const { y, a, b: rb } = b.ring, cx = (b.x0 + b.x1) / 2, C = [col('#1a1a5a'), col('#262a78'), col('#343c96')], E = b.ring.neon || NEON.cyan;
    for (let j = R.J(y - rb - 1); j <= R.J(y + rb + 1); j++) for (let i = R.I(cx - a - 1); i <= R.I(cx + a + 1); i++) {
      const X = R.X(i), Y = R.Y(j), e = ((X - cx) / a) ** 2 + ((Y - y) / rb) ** 2; if (e > 1 || e < .42) continue;
      const behind = Y < y, inT = M.at(i - M.i0, j - M.j0); if (behind && inT) continue;
      R.put(i, j, e > .82 ? (Y > y ? E : mix(E, '#000000', .3)) : C[clamp(Math.round((Y > y ? .8 : .3) * 2 + B(i, j) * .8), 0, 2)]);
    }
  }
  /** Дах: щогли з вогнем, голка, короби, бак для води, тарілка. */
  function roof(R, b, live, r) {
    const P = b.pal || FAC.indigo, tone = (q, i, j) => P[clamp(Math.round(q * (P.length - 1) + B(i, j) * .9), 0, P.length - 1)], top = b.top, x0 = b.x0, x1 = b.x1;
    if (b.needle) { const cx = b.needle.x || (x0 + x1) / 2, y0 = b.needle.y0 || top, h = b.needle.h; R.rect(cx - .25, y0 - h, cx + .25, y0 + .5, col('#9aa6e8')); R.rect(cx - .75, y0 - h * .55, cx + .75, y0 - h * .55 + .5, col('#6a76c0')); live.lights.push({ x: cx, y: y0 - h - .2, c: 'red', ph: r() * 6 }); }
    (b.ant || []).forEach(a => { const y0 = a.y0 || top; R.rect(a.x - .25, y0 - a.h, a.x + .25, y0, col('#7a86c4')); for (let k = 1; k < 3; k++) R.rect(a.x - .9, y0 - a.h + k * a.h / 3.2, a.x + .9, y0 - a.h + k * a.h / 3.2 + .5, col('#4a56a0')); live.lights.push({ x: a.x, y: y0 - a.h - .2, c: 'red', ph: r() * 6 }); });
    const g = b.gear; if (!g) return;
    for (let k = 0; k < (g.boxes || 0); k++) { const bw = 2.5 + r() * 4, bh = 1.5 + r() * 2.5, bx = x0 + 1.5 + r() * Math.max(0, x1 - x0 - 3 - bw); R.rect(bx, top - bh, bx + bw, top + .1, (i, j) => tone(.4, i, j)); R.rect(bx, top - bh, bx + bw, top - bh + .5, P[P.length - 2]); }
    if (g.tank) { const [tx, tw] = g.tank, th = tw * 1.15, ty = top - 2.5 - th, TK = [col('#0c0e30'), col('#161a46'), col('#22285e'), col('#2e3676')];   // бак для води на ніжках
      R.rect(tx + tw * .15, top - 2.6, tx + tw * .15 + .5, top, col('#0a0a24')); R.rect(tx + tw * .85 - .5, top - 2.6, tx + tw * .85, top, col('#0a0a24'));
      R.rect(tx, ty, tx + tw, top - 2.5, (i, j, X) => TK[clamp(Math.round(((X - tx) / tw < .3 ? .9 : (X - tx) / tw < .65 ? .6 : .3) * 3 + B(i, j) * .6), 0, 3)]);
      R.rect(tx - .3, ty - .6, tx + tw + .3, ty, col('#3a4486')); }
    if (g.dish) { const [dx] = g.dish; R.poly([[dx - 2.4, top - 3], [dx + 1.2, top - 4], [dx + 1.8, top - .6], [dx - 1.8, top]], col('#4a54a0')); R.rect(dx - .25, top - 1.5, dx + .25, top, col('#141838')); R.rect(dx - 1.8, top - 2.2, dx - 1.2, top - 1.6, NEON.pink); }
  }
  /** Вертикальна вивіска: темна дошка з неоновою рамкою і блоками-«ієрогліфами» (живе підсвічування — cityscape.js). */
  function signBoard(R, s) {
    const c1 = s.c || NEON.pink, c2 = s.c2 || NEON.cyan;
    R.rect(s.x - .5, s.y - .5, s.x + s.w + .5, s.y + s.h + .5, OUT); R.rect(s.x, s.y, s.x + s.w, s.y + s.h, col('#120a2e'));
    R.rect(s.x, s.y, s.x + s.w, s.y + .5, c1); R.rect(s.x, s.y + s.h - .5, s.x + s.w, s.y + s.h, c1); R.rect(s.x, s.y, s.x + .5, s.y + s.h, c1); R.rect(s.x + s.w - .5, s.y, s.x + s.w, s.y + s.h, c1);
    s.cells = []; const cw = s.w - 2, ch = cw * 1.1, n = Math.floor((s.h - 1.5) / (ch + 1));
    for (let k = 0; k < n; k++) { const y = s.y + 1.2 + k * (ch + 1), x = s.x + 1, rr = rng(k * 7 + (s.seed || 1)); s.cells.push([x, y, cw, ch, k % 2 ? CSSHEX(c2) : CSSHEX(c1)]);
      for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) if (rr() > .38 || (a === 1 && b === 1)) R.rect(x + a * cw / 3, y + b * ch / 3, x + (a + 1) * cw / 3 - .1, y + (b + 1) * ch / 3 - .1, mix(k % 2 ? c2 : c1, '#120a2e', .45)); }
  }
  const CSSHEX = c => '#' + [c & 255, (c >>> 8) & 255, (c >>> 16) & 255].map(v => v.toString(16).padStart(2, '0')).join('');

  // ---------- генератори планів ----------
  /** Далекі силуети в рожевому серпанку: різні форми, просвіти неба, поодинокі вогники. */
  function farBand(x0, x1, seed, o = {}) {
    const r = rng(seed), out = []; let x = x0 - 6;
    while (x < x1 + 6) {
      const w = 6 + r() * 12, tall = r() < .14, t = (o.top || 118) + (tall ? -18 - r() * 12 : r() * (o.var || 30)), k = r();
      const shape = k < .62 ? 'box' : k < .74 ? 'spire' : k < .84 ? 'setback' : k < .92 ? 'taper' : 'round';
      out.push({ x0: x, x1: x + w, top: t, bot: o.bot || 214, plane: 'far', q: r() * .25, shape, sh: 4 + r() * 8, tiers: [[w * .2, 3 + r() * 4]], k: .45, th: 10 + r() * 10,
        rimI: r() < .45 ? NEON.violet : 0, win: { style: 'dots', sx: 1.5, sy: 2, w: .5, h: .5, lit: .1, cols: ['lav', 'pink'], mx: 1, my: 1.5 },
        ant: r() < .2 ? [{ x: x + w * (.3 + r() * .4), h: 3 + r() * 6 }] : [] });
      x += w + (r() < .4 ? 2 + r() * 6 : -r() * 1.5);
    }
    return out;
  }
  /** Низькі дахи над диваном (ближній план): майже чорні, великі рідкі вікна, обладнання на дахах. */
  function lowRoofs(x0, x1, seed, o = {}) {
    const r = rng(seed), out = []; let x = x0 - 4;
    while (x < x1 + 4) {
      const w = 14 + r() * 18, t = (o.top || 228) + r() * (o.var || 18);
      out.push({ x0: x, x1: x + w, top: t, plane: 'near', q: r() * .12, side: .6, rimI: r() < .5 ? NEON.violet : NEON.blue, rimO: 0, rimLen: 14,
        win: { style: 'grid', sx: 5, sy: 5.5, w: 2.5, h: 1.6, lit: .2, cols: ['warm', 'pink', 'lav'], mx: 2, my: 3, my0: 3 },
        gear: { boxes: 1 + Math.floor(r() * 3), tank: r() < .3 ? [x + 2 + r() * (w - 8), 4 + r() * 2] : null, dish: r() < .18 ? [x + w * .7] : null },
        ant: r() < .3 ? [{ x: x + 2 + r() * (w - 4), h: 5 + r() * 7 }] : [] });
      x += w - r() * 2;
    }
    return out;
  }
  /** Естакада шосе: настил з неоном, ліхтарі, опори; на настилі — ледь помітні смуги руху (живі фари — cityscape.js). */
  function highway(R, y, posts) {
    const top = y, b0 = y + 4.5, DK = [col('#10145a'), col('#0c1048'), col('#080a36')];
    posts.forEach(x => R.rect(x - 2.2, b0, x + 2.2, R.y1, (i, j, X) => { const u = (X - x + 2.2) / 4.4; return u < .12 || u > .88 ? OUT : col(u < .35 ? '#22266e' : '#161a52'); }));
    R.rect(R.x0, top - .5, R.x1, b0 + .5, OUT);
    R.rect(R.x0, top, R.x1, b0, (i, j, X, Y) => { const v = (Y - top) / (b0 - top); return v < .12 ? NEON.blueL : v < .22 ? col('#3a44a8') : v > .86 ? NEON.pink : DK[clamp(Math.floor((v - .22) / .64 * 3 + B(i, j) * .6), 0, 2)]; });
    for (let x = R.x0 + 6; x < R.x1; x += 18) { R.rect(x - .25, top - 5, x + .25, top, col('#5a64b0')); R.rect(x - .25, top - 5.5, x + 1.8, top - 5, col('#5a64b0')); R.rect(x + 1.2, top - 5, x + 2, top - 4.5, col('#ffe7a0')); }   // ліхтарі
  }
  /** Естакада монорейки: балка з неоном, опори. */
  function rail(R, y, xs) {
    const top = y, b0 = y + 5;
    xs.forEach(x => { R.rect(x - 2, b0 - .2, x + 2, R.y1, (i, j, X) => { const u = (X - x + 2) / 4; return u < .12 || u > .88 ? OUT : col(u < .35 ? '#3a3a86' : u < .6 ? '#2a2a6c' : '#1c1c50'); });
      R.rect(x - 2.6, b0, x + 2.6, b0 + 1.5, col('#2a2a66')); R.rect(x - 2.6, b0 + 1.5, x + 2.6, b0 + 2, NEON.cyan); });
    R.rect(R.x0, top - .5, R.x1, b0 + .5, OUT);
    const ST = [col('#6a6ac8'), col('#4e4ea6'), col('#3c3c8c'), col('#2e2e74'), col('#24245e')];
    R.rect(R.x0, top, R.x1, b0, (i, j, X, Y) => { const v = (Y - top) / (b0 - top); return v < .1 ? NEON.pinkL : v < .2 ? NEON.pink : v > .86 ? NEON.cyan : v > .76 ? col('#0e0e30') : ST[Math.min(4, Math.floor((v - .2) / .56 * 5 + B(i, j) * .7))]; });
    for (let x = R.x0 + 3; x < R.x1; x += 9.5) R.rect(x, top + 1.5, x + .5, b0 - 1.2, col('#3a3a80'));   // шви сегментів
  }

  /** Растр плану (U од./піксель): list — вежі (малюються по черзі: спершу дальші); pre — підкладка. */
  function layer(x0, y0, x1, y1, list, seed0, pre, U = .5) {
    const R = Ras(x0, y0, x1, y1, U), live = { lights: [], win: [], signs: [], holo: [], pad: [] };
    if (pre) pre(R);
    list.forEach((b, n) => tower(R, b, live, (seed0 || 1) * 1000 + n * 37 + 11));
    return { R, live };
  }

  return { FAC, LITE, NEON, CSS, layer, tower, silhouette, farBand, lowRoofs, highway, rail, signBoard };
})();
