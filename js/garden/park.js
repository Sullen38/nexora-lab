/* ============================================================================
 * garden/park.js — ПАРК ВРЯТОВАНИХ ДЕРЕВ: НЕБО, ДАЛЕЧІНЬ, ГАЛЯВИНА, СТЕЖКА (NX.gardenPark)
 * ----------------------------------------------------------------------------
 * Власник (14.11): «Хочу, щоб на задньому фоні був великий парк з різних врятованих дерев — сад красивий, дуже великий
 * та масштабний». Парк — декорація позаду ботанічного саду: не тапається, але живе. Глибину дає ПАРАЛАКС — що далі план,
 * то повільніше він їде, коли гортаєш сад:
 *   небо (стоїть)  → гори (f .1) → лісовий хребет (f .26) → парк із великими деревами, озером і альтанкою (f .48)
 *   → квітучі кущі й ліхтарі (f .76) → галявина й стежка саду (f 1, тут стоять ділянки й ходить Nexi).
 * Дерева малює генератор за видами (піксель-арт, тон за освітленістю + дизеринг): дуб, клен (осінній), береза, сакура,
 * сосна, кипарис, верба, пальма, баобаб, жакаранда, гінкго. Далекі плани підмішані до кольору серпанку — повітряна перспектива.
 *
 * ШВИДКОДІЯ: кожен план — стрічка растрових плиток по 128 од.; плитки збираються шматками під час прогріву (buildG), у кадрі
 * малюються лише видимі (телефон — 3–4 плитки на план). Щокадру — лише живе: небо за часом доби, сонце / місяць / зорі, хмари,
 * птахи, лебеді й відблиски на озері, метелики, листя, світлячки й ліхтарі вночі, таблички ділянок (i18n).
 * ДОБА (tod 0..1, повний круг — DAY с): світанок → день → захід → ніч. Колір неба — тут; загальний відтінок сцени (tint) і
 * «наскільки ніч» (night) бере garden.js: після сцени накладає відтінок множенням, а світло (ліхтарі, світлячки) — поверх.
 * ========================================================================== */
NX.gardenPark = (() => {
  const P = NX.px, CAT = NX.gardenCat, { Raster, hash, BAYER } = NX.art, mix = (a, b, k) => NX.kit.mix(a, b, Math.max(0, Math.min(1, k)));
  const cl = (v, a, b) => Math.max(a, Math.min(b, v)), GY = CAT.GY, GW = CAT.X1 - CAT.X0, TW = 128, DAY = 300, HAZE = '#b9d6ee';
  // ---------- палітри видів (темне → світле) ----------
  const SP = {
    oak: ['#12351f', '#1c5229', '#2a7433', '#42993f', '#6cbb4e', '#a5dc6a'], maple: ['#4a1418', '#7a2218', '#b03a1c', '#dc6a22', '#f49a32', '#ffd060'],
    birch: ['#2a5a26', '#3f8030', '#62a83c', '#8ccc4c', '#bce66a', '#e4f8a0'], sakura: ['#7a2a5a', '#b04a80', '#e07aa8', '#ffa8c8', '#ffd0e2', '#fff0f6'],
    pine: ['#0a2a22', '#0f3d2c', '#165636', '#237342', '#3a9454', '#62b870'], cypress: ['#0c2e24', '#12442e', '#1b5e38', '#2a7a44', '#44985a', '#6ab878'],
    willow: ['#1e4a2a', '#2e6c34', '#48903e', '#70b44c', '#a0d264', '#d0ee90'], palm: ['#103a22', '#1a5a2c', '#2a8038', '#48a646', '#78c85a', '#b0e67a'],
    jacaranda: ['#3a1c6a', '#5a2c98', '#7e48c4', '#a472e4', '#c8a0f6', '#e8d4ff'], ginkgo: ['#6a5010', '#9a7a14', '#c8a41c', '#eec832', '#ffe466', '#fff6b0'],
    baobab: ['#1e4a2a', '#2e6c34', '#48903e', '#70b44c', '#a0d264', '#d0ee90'],
  };
  const BARK = ['#2c1c1a', '#4a3028', '#6a4838'], BIRCH = ['#8a92a8', '#c8d0e0', '#f2f5fb'], TAN = ['#5a4030', '#8a6a48', '#b8946a'];
  const LAWN = ['#1c5a2c', '#2a7a34', '#3c9a3e', '#58b848', '#80d058', '#aee070'];
  const hz = (pal, k) => k ? pal.map(c => mix(c, HAZE, k)) : pal;

  // ---------- пензлі (координати — пікселі плитки) ----------
  function blob(r, cx, cy, rx, ry, pal, seed, holes) {
    const x0 = Math.max(0, Math.floor(cx - rx)), x1 = Math.min(r.w - 1, Math.ceil(cx + rx)), y0 = Math.max(0, Math.floor(cy - ry)), y1 = Math.min(r.h - 1, Math.ceil(cy + ry)), n = pal.length - 1;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const u = (x - cx) / rx, v = (y - cy) / ry, d = u * u + v * v + (hash(x + seed, y) - .5) * .3; if (d > 1) continue;
      if (holes && hash(x * 1.7 + seed, y * 1.3) < holes) continue;
      const q = 2.5 - u * .9 - v * 1.6 + (hash((x >> 1) + seed, y >> 1) - .5) * 1.6 + BAYER[(y & 3) * 4 + (x & 3)] * .9 - (d > .78 ? .7 : 0);
      r.set(x, y, pal[cl(Math.round(q), 0, n)]);
    }
  }
  function trunk(r, x, y, w, h, pal, lean = 0, flare = .5) {
    for (let j = 0; j < h; j++) { const k = j / h, ww = Math.max(1, Math.round(w * (1 + flare * (1 - k) * (1 - k)) * (1 - k * .35))), cx = x + lean * k;
      for (let i = 0; i < ww; i++) r.set(cx - ww / 2 + i, y - j, pal[i < ww * .3 ? 2 : i < ww * .7 ? 1 : 0]); }
  }
  const TREE = {
    round(r, x, y, H, pal, s, o = {}) {
      const wide = o.wide || 1, n = 7; trunk(r, x, y, Math.max(2, H * .08), H * .52, o.bark || BARK, (hash(s, 1) - .5) * H * .08);
      for (let i = 0; i < n; i++) { const a = hash(s, i + 2), b = hash(s + 3, i); blob(r, x + (a - .5) * H * .5 * wide, y - H * (.5 + b * .3), H * (.17 + .09 * hash(i, s)) * wide, H * (.15 + .07 * hash(i + 4, s)), pal, s + i * 7, o.holes); }
      blob(r, x, y - H * .72, H * .27 * wide, H * .24, pal, s + 99, o.holes);
    },
    conifer(r, x, y, H, pal, s) {
      trunk(r, x, y, Math.max(2, H * .06), H * .2, BARK, 0, .2); const n = 5, np = pal.length - 1;
      for (let i = 0; i < n; i++) { const top = y - H + i * H * .16, th = H * .3, hw = (i + 1.3) * H * .07;
        for (let j = 0; j < th; j++) { const w = hw * (j / th) + (hash(j + s, i) - .5) * 2; for (let dx = -w; dx <= w; dx++) {
          const u = dx / (hw || 1), q = 2.6 - u * 1.6 - (j / th) * 2 + BAYER[((top + j) & 3) * 4 + ((x + dx) & 3)] * 1.1 + (hash(dx + s, j + i) - .5); r.set(x + dx, top + j, pal[cl(Math.round(q), 0, np)]); } } }
    },
    cypress(r, x, y, H, pal, s) { trunk(r, x, y, Math.max(2, H * .05), H * .12, BARK, 0, .2); blob(r, x, y - H * .54, H * .11, H * .48, pal, s); },
    willow(r, x, y, H, pal, s) {
      trunk(r, x, y, Math.max(2, H * .09), H * .55, BARK, (hash(s, 1) - .5) * H * .1); blob(r, x, y - H * .7, H * .4, H * .26, pal, s);
      for (let dx = -H * .4; dx <= H * .4; dx += 2) { const L = H * (.22 + .34 * hash(dx + s, 3)), y0 = y - H * .7 + Math.sqrt(Math.max(0, 1 - (dx / (H * .4)) ** 2)) * H * .2;
        for (let j = 0; j < L; j++) r.set(x + dx + Math.sin(j * .12 + dx) * 1.2, y0 + j, pal[cl(Math.round(3.6 - j / L * 2 + (hash(dx, j + s) - .5)), 1, 5)]); }
    },
    palm(r, x, y, H, pal, s) {
      const lean = (hash(s, 2) - .5) * H * .3, tw = Math.max(2, H * .04); let tx = x, ty = y;
      for (let j = 0; j < H * .78; j++) { const k = j / (H * .78); tx = x + lean * k * k; ty = y - j; for (let i = 0; i < tw; i++) r.set(tx - tw / 2 + i, ty, TAN[(j % 5 === 0) ? 0 : i < tw * .4 ? 2 : 1]); }
      for (let i = 0; i < 9; i++) { const a = -Math.PI * (.05 + .9 * i / 8), L = H * (.34 + .1 * hash(i, s));
        for (let q = 0; q <= 1; q += 1 / L) { const px = tx + Math.cos(a) * L * q, py = ty + Math.sin(a) * L * q * .6 + q * q * L * .5, c = pal[cl(Math.round(4.5 - q * 2 - (i % 2)), 1, 5)];
          r.set(px, py, c); r.set(px, py + 1, c); for (let m = 2; m < 2 + L * .16 * (1 - Math.abs(q - .5)); m++) r.set(px, py + m, pal[cl(3 - (m >> 1), 0, 5)]); } }
      blob(r, tx, ty, H * .04 + 1, H * .04 + 1, TAN, s);
    },
    birch(r, x, y, H, pal, s) {
      for (const d of [-1, 1]) { const lx = d * H * .09; for (let j = 0; j < H * .7; j++) { const cx = x + lx * (j / (H * .7)); r.set(cx, y - j, hash(j, s + d) < .14 ? '#2a2a34' : BIRCH[2]); r.set(cx + 1, y - j, hash(j + 5, s + d) < .14 ? '#2a2a34' : BIRCH[1]); if (H > 60) r.set(cx + 2, y - j, BIRCH[0]); } }
      for (let i = 0; i < 6; i++) blob(r, x + (hash(s, i) - .5) * H * .44, y - H * (.52 + hash(s + 2, i) * .36), H * .16, H * .14, pal, s + i * 5, .28);
    },
    baobab(r, x, y, H, pal, s) {
      const bk = ['#4a342c', '#6e4e3c', '#927058'];
      for (let j = 0; j < H * .62; j++) { const k = j / (H * .62), w = H * (.3 - .1 * k + .03 * Math.sin(k * 9)); for (let i = -w / 2; i < w / 2; i++) r.set(x + i, y - j, bk[i < -w * .2 ? 2 : i < w * .22 ? 1 : 0]); }
      for (let i = 0; i < 6; i++) { const a = -Math.PI * (.12 + .76 * i / 5), L = H * .3, ex = x + Math.cos(a) * L, ey = y - H * .6 + Math.sin(a) * L * .7;
        for (let q = 0; q <= 1; q += .03) { r.set(x + (ex - x) * q, y - H * .6 + (ey - (y - H * .6)) * q, bk[1]); r.set(x + (ex - x) * q + 1, y - H * .6 + (ey - (y - H * .6)) * q, bk[0]); }
        blob(r, ex, ey - H * .03, H * .14, H * .07, pal, s + i * 3); }
    },
  };
  const KIND = { oak: 'round', maple: 'round', jacaranda: 'round', ginkgo: 'round', sakura: 'round', birch: 'birch', pine: 'conifer', cypress: 'cypress', willow: 'willow', palm: 'palm', baobab: 'baobab' };
  function tree(r, sp, x, y, H, s, haze) { TREE[KIND[sp]](r, Math.round(x), Math.round(y), H, hz(SP[sp], haze), s, sp === 'sakura' ? { wide: 1.35, bark: ['#2a1420', '#4a2436', '#6e3a50'] } : sp === 'ginkgo' ? { holes: .12 } : {}); }

  // ---------- плани: f — частка руху камери, sc — пікселів на од., y0/h — смуга (кімната), ground(lx), елементи ----------
  let viewW = 286, lakeLX = 0;
  const wav = (x, a, b, c) => Math.sin(x * a) * 1 + Math.sin(x * b + 1.7) * .6 + Math.sin(x * c + 4.1) * .35;
  const LAY = [
    { id: 'mount', f: .1, sc: 1, y0: 40, h: 190 }, { id: 'ridge', f: .26, sc: 1, y0: 110, h: 150 },
    { id: 'park', f: .48, sc: 2, y0: 96, h: 246 }, { id: 'near', f: .76, sc: 2, y0: 250, h: 130 },
  ];
  const len = L => viewW + (GW - viewW) * L.f + 40, off = (L, camx) => CAT.X0 + (camx - CAT.X0) * (1 - L.f) - 20;
  /** Список дерев плану: [вид, lx, зсув основи, висота (од.), зерно]. */
  function plant(L) {
    const E = [], n = len(L), R = (i, k) => hash(i * 3.1 + k, L.f * 100);
    if (L.id === 'ridge') { const S = ['pine', 'oak', 'pine', 'birch', 'maple', 'cypress', 'oak', 'ginkgo', 'pine', 'jacaranda']; for (let x = -10, i = 0; x < n + 10; x += 5 + R(i, 1) * 7, i++) E.push([S[(R(i, 2) * S.length) | 0], x, R(i, 3) * 26, 16 + R(i, 4) * 20, i]); }
    if (L.id === 'park') {
      const S = ['oak', 'sakura', 'birch', 'maple', 'pine', 'willow', 'jacaranda', 'cypress', 'ginkgo', 'palm', 'baobab', 'oak', 'sakura', 'pine'];
      for (let x = 10, i = 0; x < n; x += 34 + R(i, 1) * 46, i++) { const sp = S[i % S.length], big = R(i, 5) < .3, d = Math.abs(x - lakeLX);
        if (d < 150) { if (d > 128) E.push(['willow', x, 46, 62, i]); continue; }
        E.push([sp, x, 8 + R(i, 3) * 44, sp === 'baobab' ? 96 : sp === 'cypress' ? 78 + R(i, 4) * 30 : (big ? 104 : 62) + R(i, 4) * 34, i]);
        if (R(i, 6) < .5) E.push([S[(i + 5) % S.length], x + 16 + R(i, 7) * 10, 2 + R(i, 8) * 12, 38 + R(i, 9) * 20, i + 500]); }
      E.sort((a, b) => a[2] - b[2]);
    }
    if (L.id === 'near') for (let x = 0, i = 0; x < n; x += 120 + R(i, 1) * 150, i++) E.push([['sakura', 'maple', 'birch', 'jacaranda'][i % 4], x + 30, 36, 84 + R(i, 2) * 26, i + 900]);
    return E;
  }
  const GROUND = {
    mount: lx => 96 + wav(lx, .011, .027, .06) * 22, ridge: lx => 62 + wav(lx, .016, .041, .09) * 9,
    park: lx => 150 + wav(lx, .008, .021, .05) * 9, near: lx => 86 + wav(lx, .012, .03, .07) * 5,
  };
  /** Розмалювати одну плитку плану (lx0 — її лівий край у плані). */
  function paint(L, ti) {
    const sc = L.sc, lx0 = ti * TW, r = Raster(TW * sc, L.h * sc), g = GROUND[L.id], np = 5;
    if (L.id === 'mount') {                                                            // гори: дві гряди в серпанку, снігові шапки
      for (let x = 0; x < r.w; x++) { const lx = lx0 + x, a = g(lx) - 34 - wav(lx + 900, .006, .017, .045) * 20, b = g(lx);
        for (let y = Math.round(a); y < r.h; y++) { const d = y - a; r.set(x, y, d < 5 + hash(x, 3) * 5 && a < 52 ? '#f4f8ff' : mix('#7f9cc8', '#a9c6e6', cl(d / 90 + BAYER[(y & 3) * 4 + (x & 3)] * .2 + (hash(x >> 2, y >> 1) - .5) * .2, 0, 1))); }
        for (let y = Math.round(b); y < r.h; y++) { const d = y - b; r.set(x, y, mix('#4f8a78', '#8ebfa6', cl(d / 110 + BAYER[(y & 3) * 4 + (x & 3)] * .25 + (hash(x >> 1, y >> 1) - .5) * .3, 0, 1))); } }
    } else {
      const lawn = hz(LAWN, L.id === 'ridge' ? .42 : L.id === 'park' ? .12 : 0);
      for (let x = 0; x < r.w; x++) { const lx = lx0 + x / sc, gy = Math.round(g(lx) * sc);
        for (let y = gy; y < r.h; y++) { const d = (y - gy) / sc, stripe = Math.sin((lx + d * 1.6) * .21) > 0 ? .5 : 0;
          r.set(x, y, lawn[cl(Math.round(3.4 - d * .018 * (L.id === 'near' ? 1.4 : 1) + stripe + BAYER[(y & 3) * 4 + (x & 3)] * 1.1 + (hash(x >> 1, y) - .5) * .9 - (d < 1.2 ? -1 : 0)), 0, np)]); } }
    }
    if (L.id === 'park') {
      const X = lx => (lx - lx0) * sc, GYs = lx => g(lx) * sc;
      // тюльпанові смуги й піщана стежка на галявині
      for (let x = 0; x < r.w; x++) { const lx = lx0 + x / sc, gy = GYs(lx), py = gy + (26 + Math.sin(lx * .018) * 12) * sc;
        if (Math.abs(lx - lakeLX) > 170) { for (let j = 0; j < 5 * sc; j++) r.set(x, py + j, j < 2 ? '#f6ecc8' : hash(x, j) < .2 ? '#cbb888' : '#e6d6a8');
          const band = Math.floor((lx + 4000) / 46) % 4, fy = gy + 9 * sc, COL = [['#ff5a6a', '#ffd0d6'], ['#ffd84a', '#fff6c0'], ['#c07aff', '#ecd8ff'], ['#ff8ad0', '#ffe0f2']][band];
          if (Math.floor((lx + 4000) / 23) % 2 === 0) for (let j = 0; j < 7 * sc; j += 2) if (hash(x, j) < .55) { r.set(x, fy + j, COL[hash(x + 1, j) < .3 ? 1 : 0]); r.set(x, fy + j + 1, '#2a7a34'); } } }
      // озеро: смуги неба на воді, берег, острівець із вербою, місток, альтанка
      const lcx = X(lakeLX), lcy = GYs(lakeLX) + 34 * sc, lrx = 150 * sc, lry = 22 * sc;
      for (let y = Math.max(0, Math.floor(lcy - lry)); y <= Math.min(r.h - 1, lcy + lry); y++) for (let x = 0; x < r.w; x++) { const u = (x - lcx) / lrx, v = (y - lcy) / lry, d = u * u + v * v; if (d > 1) continue;
        r.set(x, y, d > .93 ? '#2a6a4a' : mix('#d4f2ff', '#3f8fd6', cl((v + 1) / 2 + Math.sin(y * 1.3 + x * .05) * .08 + BAYER[(y & 3) * 4 + (x & 3)] * .16, 0, 1))); }
      blob(r, lcx + 40 * sc, lcy - 2 * sc, 26 * sc, 5 * sc, LAWN, 5); tree(r, 'willow', lcx + 40 * sc, lcy - 3 * sc, 50 * sc, 77, .08);
      for (let i = -28; i <= 28; i++) { const bx = lcx - 96 * sc + i, by = lcy + 6 * sc - Math.round((1 - (i / 28) ** 2) * 8 * sc); r.rect(bx, by, 1, 3, i % 4 ? '#b8845a' : '#7a5236'); if (i % 7 === 0) r.rect(bx, by - 5, 1, 5, '#7a5236'); r.set(bx, by - 5, '#d8a878'); }
      const gx = X(lakeLX + 214), gy2 = GYs(lakeLX + 214) + 8 * sc;                    // альтанка
      for (let j = 0; j < 14 * sc; j++) { const w = (j / (14 * sc)) * 22 * sc; r.rect(gx - w, gy2 - 38 * sc + j, w * 2, 1, j % 6 < 2 ? '#c8486a' : '#e8688a'); }
      r.rect(gx - 1, gy2 - 44 * sc, 2, 6 * sc, '#ffd84a'); for (const dx of [-18, -9, 0, 9, 18]) r.rect(gx + dx * sc - 1, gy2 - 24 * sc, 3, 24 * sc, dx % 2 ? '#dfe6f4' : '#ffffff'); r.rect(gx - 21 * sc, gy2 - 2, 42 * sc, 4, '#c8d0e0'); r.rect(gx - 20 * sc, gy2 - 8 * sc, 40 * sc, 2, '#ffffff');
    }
    const E = L.E || (L.E = plant(L)); if (L.id !== 'mount') for (const [sp, lx, dy, H, s] of E) { if (lx + H < lx0 - 4 || lx - H > lx0 + TW + 4) continue; tree(r, sp, (lx - lx0) * sc, (g(lx) + dy) * sc, H * sc, s * 13 + 5, L.id === 'ridge' ? .45 : L.id === 'park' ? .1 + .12 * (1 - dy / 52) : 0); }
    if (L.id === 'near') {                                                             // квітучі кущі, живопліт, стовпчики ліхтарів
      const R2 = (i, k) => hash(i * 2.3 + k, 41);
      for (let i = Math.floor((lx0 - 60) / 22); i * 22 < lx0 + TW + 60; i++) { const lx = i * 22 + R2(i, 1) * 10, x = (lx - lx0) * sc, y = (g(lx) + 20 + R2(i, 2) * 26) * sc, w = (12 + R2(i, 3) * 12) * sc, kind = (R2(i, 4) * 5) | 0;
        blob(r, x, y, w, w * .55, kind === 4 ? SP.cypress : LAWN, i * 9);
        const FC = [['#ff7ab0', '#ffd0e4'], ['#ffffff', '#fff3c2'], ['#ffb03a', '#ffe08a'], ['#b48cff', '#e6d6ff']][kind]; if (FC) for (let k = 0; k < w * .9; k++) { const fx = x + (hash(k, i) - .5) * w * 1.7, fy = y - hash(k + 3, i) * w * .5 + 2; if (r.alpha(Math.round(fx), Math.round(fy))) { r.set(fx, fy, FC[0]); r.set(fx + 1, fy, FC[1]); } } }
      for (let i = Math.floor(lx0 / 190); i * 190 < lx0 + TW; i++) { const lx = i * 190 + 40, x = (lx - lx0) * sc, y = (g(lx) + 40) * sc; r.rect(x - 1, y - 44 * sc, 3, 44 * sc, '#3a3050'); r.rect(x - 2, y - 44 * sc, 1, 44 * sc, '#6a5a8a'); r.rect(x - 5, y - 52 * sc, 11, 9 * sc, '#fff3c2'); r.rect(x - 6, y - 54 * sc, 13, 3, '#3a3050'); r.rect(x - 5, y - 43 * sc, 11, 2, '#3a3050'); }
    }
    return r.canvas();
  }

  // ---------- галявина й стежка саду (f = 1): трава, бордюр, бруківка в перспективі, плита під острівець ----------
  let FLOOR = null, floorH = 0, BED = null;
  const LY0 = 366;                                                                     // верх галявини саду
  function* floorG() {
    const C = NX.cfg, X0 = CAT.X0, W = GW, H = Math.max(40, C.ROOM_H + NX.cam.front0 - LY0 + 2), sc = NX.cam.k0 * (NX.loop.dpr || 1) > 1.3 ? 2 : 1;
    const cv = document.createElement('canvas'); cv.width = W * sc; cv.height = H * sc; const c = cv.getContext('2d'); c.scale(sc, sc); c.translate(-X0, -LY0); floorH = H;
    const R = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); }, [vx, vy] = NX.persp.VP, D = NX.persp.D, T = 64;
    c.imageSmoothingEnabled = false;
    for (let part = 0; part < 8; part++) { const pw = Math.ceil(W / 8), lw = Raster(pw * sc, (GY - LY0) * sc), xo = part * pw * sc;   // галявина (вісьмома шматками): смуги покосу, конюшина й ромашки
      for (let y = 0; y < lw.h; y++) for (let xx = 0; xx < lw.w; xx++) { const x = xx + xo; const d = y / sc, ux = x / sc, hsh = hash(x, y), q = 2.4 + d * .02 + (Math.sin((ux + d * 2) * .16) > 0 ? .6 : 0) + BAYER[(y & 3) * 4 + (x & 3)] * 1.2 + (hsh - .5);
        lw.set(xx, y, hsh > .994 ? '#ffffff' : hsh > .99 ? '#ffe27a' : hsh > .986 ? '#ff9ad0' : LAWN[cl(Math.round(q), 0, 5)]); }
      c.drawImage(lw.canvas(), X0 + part * pw, LY0, pw, GY - LY0); yield; }
    const rows = [GY]; for (let n = 1; D - n * 70 > 30; n++) rows.push(vy + (GY - vy) * D / (D - n * 70)); rows.push(LY0 + H + 4);
    const xa = (xg, y) => vx + (xg - vx) * (y - vy) / (GY - vy), STN = ['#cdbfa6', '#d9cdb6', '#c2b49c', '#e2d8c4'];
    for (let r = 0; r < rows.length - 1; r++) { const y0 = rows[r], y1 = Math.min(rows[r + 1], LY0 + H + 4); if (y0 > LY0 + H) break;
      for (let i = -70; i < 70; i++) { const x0 = vx + i * T + (r % 2 ? T / 2 : 0); if (Math.max(xa(x0 + T, y0), xa(x0 + T, y1)) < X0 || Math.min(xa(x0, y0), xa(x0, y1)) > CAT.X1) continue;
        c.fillStyle = mix(STN[((i * 7 + r * 3) % 4 + 4) % 4], '#8f8672', Math.min(.35, r * .07));
        c.beginPath(); c.moveTo(xa(x0, y0) + .6, y0 + .6); c.lineTo(xa(x0 + T, y0) - .6, y0 + .6); c.lineTo(xa(x0 + T, y1) - .6, y1 - .4); c.lineTo(xa(x0, y1) + .6, y1 - .4); c.closePath(); c.fill(); } }
    c.globalCompositeOperation = 'destination-over'; R(X0, GY, W, H, '#8c8068'); c.globalCompositeOperation = 'source-over';   // шви бруківки
    R(X0, GY - 3, W, 5, '#efe6d2'); R(X0, GY + 2, W, 1.5, '#a89c84'); for (let x = X0; x < CAT.X1; x += 18) R(x, GY - 3, 1, 5, '#b8ac94');   // бордюр
    for (let x = X0; x < CAT.X1; x += 3) if (hash(x, 77) < .4) { const h = 2 + hash(x, 78) * 4; R(x, GY - 3 - h, 1, h, LAWN[3 + ((hash(x, 79) * 3) | 0)]); }   // трава понад бордюром
    const L = NX.objects.sakura; if (L) { const { cx, cy, RX, RY } = L;                                            // кам'яна плита під острівець (без кілець)
      c.fillStyle = '#857a64'; c.beginPath(); c.ellipse(cx, cy + L.h + 1.5, RX + 7, RY + 3.5, 0, 0, 7); c.fill();
      c.fillStyle = '#b3a78e'; c.beginPath(); c.ellipse(cx, cy + L.h, RX + 7, RY + 3.5, 0, 0, 7); c.fill();
      c.fillStyle = '#9c917a'; c.beginPath(); c.ellipse(cx, cy + L.h, RX + 2, RY + 1, 0, 0, 7); c.fill(); }
    FLOOR = cv;
  }
  /** Ділянка, що ще готується: зорані гряди з паростками, кілочки з пакетиками насіння, лійка. 268 × 44 од. */
  function buildBed() {
    const r = Raster(536, 88), SOIL = ['#2e1c16', '#4a2e22', '#6a4430', '#8a5c40'];
    for (let y = 30; y < 88; y++) for (let x = 8; x < 528; x++) { const d = y - 30, ridge = Math.sin(x * .12) * .5 + .5, edge = Math.min(x - 8, 528 - x) < 3 || d < 2;
      r.set(x, y, edge ? '#b8946a' : SOIL[cl(Math.round(1 + ridge * 1.8 - d * .012 + BAYER[(y & 3) * 4 + (x & 3)] * .9 + (hash(x, y) - .5) * .8), 0, 3)]); }
    for (let x = 24; x < 520; x += 26) { const h = 5 + hash(x, 1) * 9, y = 44 + ((x / 26) % 3) * 12; r.rect(x, y - h, 2, h, '#3c9a3e'); r.rect(x - 3, y - h - 2, 4, 3, '#80d058'); r.rect(x + 1, y - h - 3, 4, 3, '#aee070'); r.set(x - 3, y - h - 2, '#d6f4a0'); }
    [[60, '#ff6a5a'], [270, '#ffe27a'], [470, '#b48cff']].forEach(([x, col]) => { r.rect(x, 6, 2, 30, '#8a6a48'); r.rect(x - 7, 2, 16, 14, '#fbf6ea'); r.rect(x - 7, 2, 16, 3, col); r.rect(x - 4, 8, 10, 5, col); r.rect(x - 7, 15, 16, 1, '#b8ac94'); });
    return r.canvas();
  }

  // ---------- доба ----------
  const KEY = [[0, '#34489a', '#ffb4a4', '#eebccc'], [.1, '#3d9cea', '#cbf1ff', '#ffffff'], [.52, '#3d9cea', '#cbf1ff', '#ffffff'], [.62, '#4a3a98', '#ff9c5c', '#f2ac94'], [.7, '#070b2c', '#1c2c70', '#6a78d0'], [.94, '#070b2c', '#1c2c70', '#6a78d0'], [1, '#34489a', '#ffb4a4', '#eebccc']];
  function sky(tod) { let i = 0; while (i < KEY.length - 2 && KEY[i + 1][0] <= tod) i++; const a = KEY[i], b = KEY[i + 1], k = (tod - a[0]) / (b[0] - a[0] || 1); return { top: mix(a[1], b[1], k), bot: mix(a[2], b[2], k), tint: mix(a[3], b[3], k) }; }
  const nightK = tod => cl(tod < .5 ? 1 - tod / .08 : (tod - .6) / .1, 0, 1) * (tod > .94 ? 1 - (tod - .94) / .06 * .0 : 1);
  let CLOUD = null;
  function buildClouds() { return [0, 1, 2].map(i => { const r = Raster(120, 36); for (let k = 0; k < 6; k++) blob(r, 22 + k * 15 + hash(i, k) * 6, 22 - hash(k, i) * 8, 14 + hash(i + 2, k) * 6, 8 + hash(k, i + 4) * 4, ['#b9cfee', '#d4e4f8', '#eaf3ff', '#ffffff', '#ffffff', '#ffffff'], i * 31 + k); return r.canvas(); }); }

  const tilesOf = L => L.T || (L.T = {});
  return {
    DAY, LY0,
    setView(w) { const nv = Math.ceil(w); if (nv !== viewW) { viewW = nv; LAY.forEach(L => { L.T = {}; L.E = null; }); } const Lp = LAY[2]; lakeLX = (768 - CAT.X0) - (768 - viewW / 2 - CAT.X0) * (1 - Lp.f) + 20; },
    /** Збірка шматками: плитки довкола холу — першими (їх видно одразу), решта — далі; підлога, гряда, хмари. */
    *buildG() {
      this.setView(NX.cam.viewW); yield* floorG(); yield; BED = buildBed(); CLOUD = buildClouds(); yield;
      for (const L of LAY) { const n = Math.ceil(len(L) / TW), mid = Math.floor(((768 - viewW / 2) - off(L, 768 - viewW / 2)) / TW); const ord = [...Array(n).keys()].sort((a, b) => Math.abs(a - mid) - Math.abs(b - mid));
        for (const ti of ord) { tilesOf(L)[ti] = paint(L, ti); yield; } }
    },
    layout() { if (!FLOOR) return; const w = Math.ceil(NX.cam.viewW); for (const _ of floorG()) { /* одразу вся */ } if (w !== viewW) { this.setView(w); for (const L of LAY) { const n = Math.ceil(len(L) / TW); for (let ti = 0; ti < n; ti++) tilesOf(L)[ti] = paint(L, ti); } } },
    sky, nightK,
    /** Небо (у координатах екрана), сонце / місяць, зорі, ребра купола, хмари. */
    drawSky(c, t, tod, W, H, k) {
      const s = sky(tod), g = c.createLinearGradient(0, 0, 0, H * .62), nk = nightK(tod); g.addColorStop(0, s.top); g.addColorStop(1, s.bot); c.fillStyle = g; c.fillRect(0, 0, W, H);
      if (nk > .05) { c.fillStyle = '#ffffff'; for (let i = 0; i < 70; i++) { c.globalAlpha = nk * (.35 + .65 * Math.abs(Math.sin(t * (.6 + hash(i, 1)) + i))); const z = hash(i, 2) < .2 ? 2 : 1; c.fillRect(Math.round(hash(i, 3) * W), Math.round(hash(i, 4) * H * .4), z * k | 0 || 1, z * k | 0 || 1); } c.globalAlpha = 1; }
      const a = Math.PI * cl((tod - .02) / .62, 0, 1), sx = W * (.08 + .84 * (1 - Math.cos(a)) / 2), sy = H * (.36 - Math.sin(a) * .27), ma = Math.PI * cl((tod - .64) / .34, 0, 1);
      if (tod < .66) { c.fillStyle = 'rgba(255,244,200,.25)'; c.beginPath(); c.arc(sx, sy, 34 * k, 0, 7); c.fill(); c.fillStyle = '#fff6d0'; c.beginPath(); c.arc(sx, sy, 15 * k, 0, 7); c.fill(); }
      if (nk > .3) { const mx = W * (.12 + .76 * (1 - Math.cos(ma)) / 2), my = H * (.3 - Math.sin(ma) * .2); c.globalAlpha = nk; c.fillStyle = 'rgba(200,220,255,.18)'; c.beginPath(); c.arc(mx, my, 26 * k, 0, 7); c.fill(); c.fillStyle = '#eef4ff'; c.beginPath(); c.arc(mx, my, 11 * k, 0, 7); c.fill(); c.fillStyle = s.top; c.beginPath(); c.arc(mx + 5 * k, my - 3 * k, 9 * k, 0, 7); c.fill(); c.globalAlpha = 1; }
      c.strokeStyle = `rgba(255,255,255,${.1 + .05 * (1 - nk)})`; c.lineWidth = Math.max(1, k * .8);                // купол: ребра скла
      for (let i = 1; i <= 4; i++) { c.beginPath(); c.ellipse(W / 2, H * .62, W * (.5 + i * .34), H * (.2 + i * .15), 0, Math.PI, 2 * Math.PI); c.stroke(); }
      for (let i = -5; i <= 5; i++) { c.beginPath(); c.moveTo(W / 2 + i * W * .16, H * .62); c.quadraticCurveTo(W / 2 + i * W * .2, H * .2, W / 2 + i * W * .34, 0); c.stroke(); }
      if (CLOUD) { c.imageSmoothingEnabled = false; c.globalAlpha = .9 - nk * .6; for (let i = 0; i < 5; i++) { const cw = 120 * k * (1 + (i % 2) * .5), x = ((hash(i, 9) * (W + 400 * k) + t * (3 + i) * k) % (W + 400 * k)) - 200 * k; c.drawImage(CLOUD[i % 3], Math.round(x), Math.round(H * (.05 + hash(i, 8) * .2)), cw, cw * .3); } c.globalAlpha = 1; }
    },
    /** Плани парку, галявина й стежка в кадрі. Координати — кімната. */
    drawBack(c, t, vx0, vx1) {
      c.imageSmoothingEnabled = false; const Kk = NX.cam.k * (NX.loop.dpr || 1), camx = NX.cam.x;
      for (const L of LAY) { const o = Math.round(off(L, camx) * Kk) / Kk, T = tilesOf(L), i0 = Math.max(0, Math.floor((vx0 - o) / TW)), i1 = Math.floor((vx1 - o) / TW);
        for (let ti = i0; ti <= i1; ti++) { const cv = T[ti]; if (cv) c.drawImage(cv, o + ti * TW, L.y0, TW + .02, L.h); }
        if (L.id === 'park') this.lake(c, t, o); }
      const x0 = Math.max(CAT.X0, Math.floor(vx0)), x1 = Math.min(CAT.X1, Math.ceil(vx1)), sc = FLOOR.width / GW;
      if (x1 > x0) c.drawImage(FLOOR, (x0 - CAT.X0) * sc, 0, (x1 - x0) * sc, FLOOR.height, x0, LY0, x1 - x0, floorH);
      for (const s of CAT.SECTORS) if (!s.ready && s.x1 > vx0 && s.x0 < vx1) c.drawImage(BED, s.x0 + 6, GY - 46, 268, 44);
    },
    /** Живе на озері: лебеді й відблиски. o — зсув плану парку. */
    lake(c, t, o) {
      const x = o + lakeLX, y = LAY[2].y0 + GROUND.park(lakeLX) + 34;
      for (let i = 0; i < 2; i++) { const sx = x + Math.sin(t * .05 + i * 3) * 80 - 20 + i * 30, sy = y + 6 + i * 5, d = Math.cos(t * .05 + i * 3) > 0 ? 1 : -1; P.rect(c, sx - 3, sy, 7, 3, '#ffffff'); P.rect(c, sx + d * 3, sy - 4, 1.5, 4, '#ffffff'); P.rect(c, sx + d * 4, sy - 4, 1.5, 1.5, '#ff9a3a'); P.rect(c, sx - 3, sy + 3, 7, 1, '#a8d4f0'); }
      for (let i = 0; i < 10; i++) { const q = (t * .5 + hash(i, 5) * 9) % 1; if (q < .35) P.rect(c, x + (hash(i, Math.floor(t * .5 + hash(i, 5) * 9)) - .5) * 250, y + (hash(i + 3, Math.floor(t * .5 + hash(i, 5) * 9)) - .5) * 30, 3, 1, '#ffffff'); }
    },
    /** Дрібне життя перед парком: птахи вдень, метелики, листя. */
    drawLife(c, t, tod, vx0, vx1) {
      const nk = nightK(tod), w = vx1 - vx0;
      if (nk < .6) for (let i = 0; i < 6; i++) { const x = vx0 + ((hash(i, 1) * (w + 200) + t * (16 + i * 3)) % (w + 200)) - 100, y = 20 + hash(i, 2) * 120 + Math.sin(t * .7 + i) * 8, f = Math.sin(t * 9 + i * 2) > 0 ? 1 : -1;
        P.rect(c, x - 3, y + f, 2, 1, '#2a3050'); P.rect(c, x - 1, y, 2, 1, '#2a3050'); P.rect(c, x + 1, y + f, 2, 1, '#2a3050'); }
      if (nk < .5) for (let i = 0; i < 4; i++) { const x = vx0 + hash(i, 6) * w + Math.sin(t * .5 + i * 2) * 40, y = 330 + Math.sin(t * .9 + i * 3) * 34 + Math.sin(t * 5 + i) * 3, op = Math.floor(t * 10 + i) % 2, col = ['#ffe27a', '#8af0ff', '#ff9ad0', '#ffffff'][i];
        P.rect(c, x - (op ? 2 : 1), y, op ? 2 : 1, 2, col); P.rect(c, x + 1, y, op ? 2 : 1, 2, col); P.rect(c, x, y, 1, 2, '#2a2040'); }
      for (let i = 0; i < 9; i++) { const T = 7 + hash(i, 3) * 6, q = (t / T + hash(i, 4)) % 1, x = vx0 + ((hash(i, 5) * w + q * 60 + Math.sin(q * 9 + i) * 12) % w), y = 150 + q * 290; c.globalAlpha = q > .9 ? (1 - q) * 10 : 1; P.rect(c, x, y, 2, 1, i % 3 ? '#ffb0d0' : '#ffd060'); }
      c.globalAlpha = 1;
    },
    /** Світло поверх нічного відтінку: ліхтарі, світлячки, таблички ділянок і холу (текст — i18n). */
    drawLights(c, t, tod, vx0, vx1) {
      const nk = nightK(tod), Ln = LAY[3], o = off(Ln, NX.cam.x);
      if (nk > .05) {
        for (let i = Math.floor((vx0 - o) / 190) - 1; i * 190 + 40 + o < vx1 + 40; i++) { const lx = i * 190 + 40, x = o + lx, y = Ln.y0 + GROUND.near(lx) + 40 - 48; P.glow(c, x, y, 46, 'rgba(255,220,140,.9)', nk * (.5 + .04 * Math.sin(t * 6 + i))); P.rect(c, x - 2.5, y - 4, 5.5, 4.5, '#fff3c2'); }
        for (let i = 0; i < 18; i++) { const x = vx0 + hash(i, 11) * (vx1 - vx0) + Math.sin(t * .4 + i * 2.1) * 26, y = 250 + hash(i, 12) * 190 + Math.cos(t * .33 + i * 1.7) * 14, a = nk * (.5 + .5 * Math.sin(t * 3 + i * 4)); P.glow(c, x, y, 6, 'rgba(232,255,138,.9)', .5 * a); c.globalAlpha = a; P.rect(c, x - .5, y - .5, 1, 1, '#f4ffb0'); c.globalAlpha = 1; }
      }
      for (const s of CAT.SECTORS) { if (s.x1 < vx0 || s.x0 > vx1) continue; const m = (s.x0 + s.x1) / 2, w = 150, y = GY + 4, col = s.ready ? s.col : '#8a84a8';      // табличка в бордюрі: однакова на всіх ділянках
        P.rect(c, m - w / 2, y, w, 14, '#1c1830'); P.rect(c, m - w / 2, y, w, 1, col); P.rect(c, m - w / 2, y + 13, w, 1, col); P.rect(c, m - w / 2, y, 1, 14, col); P.rect(c, m + w / 2 - 1, y, 1, 14, col);
        P.text(c, String(NX.t('garden.sec.' + s.id)).toUpperCase(), m, y + 10, col, 6, 'center'); }
      if (CAT.LOBBY[1] > vx0 && CAT.LOBBY[0] < vx1) { const m = 700, y = GY - 40, w = 116;                          // щит холу на галявині: назва саду й лічильник культур
        P.rect(c, m - 40, y + 26, 3, 12, '#3a3050'); P.rect(c, m + 37, y + 26, 3, 12, '#3a3050');
        P.rect(c, m - w / 2, y, w, 28, '#1c1830'); P.rect(c, m - w / 2, y, w, 1, '#3bff8a'); P.rect(c, m - w / 2, y + 27, w, 1, '#3bff8a'); P.rect(c, m - w / 2, y, 1, 28, '#3bff8a'); P.rect(c, m + w / 2 - 1, y, 1, 28, '#3bff8a');
        P.text(c, String(NX.t('garden.title')), m, y + 11.5, '#3bff8a', 6, 'center'); P.text(c, String(NX.t('garden.count', { n: CAT.grown(), all: CAT.CROPS.length })), m, y + 22.5, '#8af0ff', 6, 'center'); }
    },
  };
})();
