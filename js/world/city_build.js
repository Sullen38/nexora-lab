/* ============================================================================
 * world/city_build.js — БУДІВЕЛЬНІ БЛОКИ МІСТА ЗА ВІКНОМ (NX.cityBuild): силуети веж, маски, транспорт
 * ----------------------------------------------------------------------------
 * Мегаполіс малює world/city_mega.js (місто v3); тут — спільне для нього й world/cityscape.js:
 *   FAC, NEON          — палітри фасадів (темний -> світлий: індиго, синій, фіолет, далекий, ближній) і неон;
 *   silhouette(b)      — силует вежі (многокутники): b — x0, x1, top, bot (за замовчуванням низ растра) і shape:
 *                        box | setback (tiers: [[відступ, висота], ...] згори вниз) | spire (sh — висота шпиля,
 *                        ins — відступ) | taper (k — ширина верху, th — висота звуження) | crown (spikes, ch) |
 *                        dome (dh) | round (скруглений верх) | twin (gap, dt, bridge, bh — міст);
 *   maskOf(R, polys)   — маска силуету в сітці растра (скан-рядки);
 *   ringOf(R, b, M)    — кільце-майданчик навколо вежі (b.ring = {y, a, b}): задня половина — за вежею;
 *   highway / rail     — естакади шосе й монорейки; skyway — небесна траса (смуги фар); tube — скляна труба
 *                        маглева по кривій; elevatorBase — основа космічного ліфта.
 * Растри міста — 2 px/од. (U = .5). Вежі міста v2 (tower, layer, farBand, lowRoofs) — в історії git (коміт a431f03).
 * ========================================================================== */
NX.cityBuild = (() => {
  const { col, pal, mix, B, rng, clamp } = NX.ckit;

  // ---------- палітри (темний -> світлий): насичені індиго й сині, як вежі на картинці ----------
  const FAC = {
    indigo: pal(['#08003e', '#0e0258', '#140a72', '#1a168a', '#2022a2', '#2830b8', '#3240cc', '#3e52de']),
    blue: pal(['#020838', '#041052', '#061a6c', '#0a2486', '#0e309e', '#143eb6', '#1c4eca', '#2860dc']),
    violet: pal(['#0e0036', '#16044e', '#200a66', '#2a107e', '#361896', '#4222aa', '#502ebe', '#6040ce']),
    far: pal(['#251c84', '#2d2494', '#352ca4', '#3f36b4', '#4a41c2', '#574ece']),
    near: pal(['#03021c', '#05042a', '#080838', '#0c0c48', '#121258', '#181868']),
  };
  const NEON = { cyan: col('#3be8ff'), cyanL: col('#b4f8ff'), blue: col('#5a7cff'), blueL: col('#a8beff'), pink: col('#ff4fd8'), pinkL: col('#ffb0ee'), violet: col('#a87aff'), gold: col('#ffd36a') };
  const OUT = col('#04020f');

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
      // ---- майбутнє ----
      case 'needle': {                                                               // голка: плавно звужується догори до вістря
        const L = [], Rr = [], N = 24, k = b.k == null ? .55 : b.k;
        for (let s2 = 0; s2 <= N; s2++) { const v = s2 / N, y = top + (bot - top) * v, hw = w / 2 * (.06 + .94 * Math.pow(v, k)); L.push([cx - hw, y]); Rr.unshift([cx + hw, y]); }
        P.push([...L, ...Rr]); break; }
      case 'saucer': {                                                               // «космічна голка»: тонкий стовбур, диск-под угорі, шпиль
        const st = b.stem || w * .34, pod = b.pod || { y: top + 14, a: w * .6, b: 4 }, pts = [];
        box(cx - st / 2, pod.y, cx + st / 2, bot);
        for (let k = 0; k < 24; k++) { const a = k / 24 * Math.PI * 2; pts.push([cx + Math.cos(a) * pod.a, pod.y + Math.sin(a) * pod.b * (Math.sin(a) > 0 ? 1.4 : 1)]); } P.push(pts);
        P.push([[cx - st * .35, pod.y - pod.b + .2], [cx - .4, top], [cx + .4, top], [cx + st * .35, pod.y - pod.b + .2]]);
        if (b.pod2) { const q = b.pod2, pp = []; for (let k = 0; k < 20; k++) { const a = k / 20 * Math.PI * 2; pp.push([cx + Math.cos(a) * q.a, q.y + Math.sin(a) * q.b]); } P.push(pp); }
        break; }
      case 'arch': {                                                                 // ворота: дві опори й арка вгорі
        const lw = b.leg || w * .18, ah = b.ah || 26, out = [], inn = [];
        box(x0, top + ah, x0 + lw, bot); box(x1 - lw, top + ah, x1, bot);
        for (let k = 0; k <= 20; k++) { const a = Math.PI * (1 - k / 20); out.push([cx + Math.cos(a) * w / 2, top + ah - Math.sin(a) * ah]); inn.unshift([cx + Math.cos(a) * (w / 2 - lw), top + ah - Math.sin(a) * (ah - lw * .8)]); }
        P.push([...out, ...inn]); break; }
      case 'twist': {                                                                // скручена: сегменти з різною шириною й зсувом
        const N = b.seg || 9, L = [], Rr = [], sh = (bot - top) / N;
        for (let s2 = 0; s2 <= N; s2++) { const y = top + s2 * sh, k2 = s2 < N ? s2 : N - 1, ww = w / 2 * (.72 + .28 * Math.abs(Math.sin(k2 * .8 + .3))) * (s2 === 0 ? .8 : 1), dx = w * .1 * Math.sin(k2 * 1.15); L.push([cx + dx - ww, y]); Rr.unshift([cx + dx + ww, y]); }
        P.push([[cx - 1, top - (b.sh || 8)], [cx + 1, top - (b.sh || 8)], ...Rr.slice(-1), ...L.slice(0, 1)]); P.push([...L, ...Rr]); break; }
      case 'mega': {                                                                 // мегавежа-аркологія: виходить за край вікна, палуби-майданчики
        box(x0, top, x1, bot);
        (b.decks || []).forEach(([y, ex, h]) => { const hh = h || 3, pts = []; for (let k = 0; k <= 10; k++) { const a = -Math.PI / 2 + Math.PI * k / 10; pts.push([x1 + ex - hh / 2 + Math.cos(a) * hh / 2, y + hh / 2 + Math.sin(a) * hh / 2]); }
          for (let k = 0; k <= 10; k++) { const a = Math.PI / 2 + Math.PI * k / 10; pts.push([x0 - ex + hh / 2 + Math.cos(a) * hh / 2, y + hh / 2 + Math.sin(a) * hh / 2]); } P.push(pts); });
        break; }
      case 'pyramid': {                                                              // ступінчаста піраміда-мегаспоруда
        const st = b.steps || 12, L = [], Rr = [], hw = k => w / 2 * (.08 + .92 * (k + 1) / st), yk = k => top + (bot - top) * k / st;
        for (let k = 0; k < st; k++) L.push([cx - hw(k), yk(k)], [cx - hw(k), yk(k + 1)]);
        for (let k = st - 1; k >= 0; k--) Rr.push([cx + hw(k), yk(k + 1)], [cx + hw(k), yk(k)]);
        P.push([...L, ...Rr]); break; }
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

  /** Кільце-майданчик навколо вежі: задня половина — за вежею, передня — поперед неї, неоновий край. */
  function ringOf(R, b, M) {
    const { y, a, b: rb } = b.ring, cx = (b.x0 + b.x1) / 2, C = [col('#1a1a5a'), col('#262a78'), col('#343c96')], E = b.ring.neon || NEON.cyan;
    for (let j = R.J(y - rb - 1); j <= R.J(y + rb + 1); j++) for (let i = R.I(cx - a - 1); i <= R.I(cx + a + 1); i++) {
      const X = R.X(i), Y = R.Y(j), e = ((X - cx) / a) ** 2 + ((Y - y) / rb) ** 2; if (e > 1 || e < .42) continue;
      const behind = Y < y, inT = M.at(i - M.i0, j - M.j0); if (behind && inT) continue;
      R.put(i, j, e > .82 ? (Y > y ? E : mix(E, '#000000', .3)) : C[clamp(Math.round((Y > y ? .8 : .3) * 2 + B(i, j) * .8), 0, 2)]);
    }
  }

  // ---------- транспорт ----------
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

  /** Небесна траса: довга витримка руху — тонкі смуги фар (білі/теплі) і стоп-сигналів (червоні), ряди на висоті y. */
  function skyway(R, y, seed, o = {}) {
    const r = rng(seed), W = [col('#fff4d8'), col('#ffe2a0'), col('#cfe8ff')], Rd = [col('#ff3b5a'), col('#ff6a7a')], x0 = o.x0 || R.x0, x1 = o.x1 || R.x1;
    for (let n = 0; n < (o.n || 70); n++) { const lane = r() < .5 ? 0 : 1, yy = y + lane * 1.5 + (r() - .5) * .6, len = 5 + r() * 22, x = x0 + r() * (x1 - x0), c = lane ? Rd[Math.floor(r() * 2)] : W[Math.floor(r() * 3)];
      for (let k = 0; k < len / R.U; k++) { const xx = x + k * R.U, a = .25 + .75 * (k / (len / R.U)); R.over(R.I(lane ? x + len - k * R.U : xx), R.J(yy), c, lane ? 1 - a * .75 : a); } }
  }
  /** Скляна транспортна труба (маглев) по кривій Безьє p0 -> c -> p1: напівпрозоре скло, світлі краї, опори. */
  function tube(R, p0, cc, p1, o = {}) {
    const wd = o.w || 3.2, N = 160, pts = [], GL2 = col('#5ad8ff'), ED = col('#c4f6ff');
    for (let k = 0; k <= N; k++) { const t = k / N, x = (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * cc[0] + t * t * p1[0], y = (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * cc[1] + t * t * p1[1]; pts.push([x, y]); }
    for (let k = 0; k < N; k++) { const [x, y] = pts[k], [x2, y2] = pts[k + 1], len = Math.hypot(x2 - x, y2 - y), nx = -(y2 - y) / len, ny = (x2 - x) / len;
      for (let u = 0; u <= len; u += R.U * .7) for (let v = -wd / 2; v <= wd / 2; v += R.U * .7) { const X = x + (x2 - x) * u / len + nx * v, Y = y + (y2 - y) * u / len + ny * v, i = R.I(X), j = R.J(Y), e = Math.abs(v) / (wd / 2);
        if (e > .82) R.put(i, j, ED); else R.over(i, j, GL2, .16 + .1 * (1 - e)); } }
    (o.posts || []).forEach(t => { const k = Math.round(t * N), [x, y] = pts[k]; R.rect(x - .5, y + wd / 2, x + .5, o.postTo || y + 30, col('#2a2e7a')); });
    return pts;
  }
  /** Основа космічного ліфта: конусна вежа з неоновими ребрами (трос малюється окремо, поверх неба). */
  function elevatorBase(R, x, y0, y1, o = {}) {
    const w0 = o.w || 26, P = FAC.violet, T = col('#9af6ff');
    R.poly([[x - w0 / 2, y1], [x - 2, y0], [x + 2, y0], [x + w0 / 2, y1]], (i, j, X, Y) => { const v = (Y - y0) / (y1 - y0), hw = 2 + (w0 / 2 - 2) * v, u = (X - x + hw) / (2 * hw);
      if (u < .06 || u > .94) return NEON.pink; if (Math.abs(u - .5) < .03) return T; const rib = ((Y - y0) % 7) < .6; return rib ? NEON.violet : P[clamp(Math.round((.3 + (u < .5 ? .15 : 0) - v * .15) * 7 + B(i, j) * .9), 0, 7)]; });
    for (let y = y0 + 10; y < y1 - 4; y += 14) R.rect(x - 1.5, y, x + 1.5, y + 1, NEON.cyanL);
  }

  return { FAC, NEON, silhouette, maskOf, ringOf, highway, rail, skyway, tube, elevatorBase };
})();
