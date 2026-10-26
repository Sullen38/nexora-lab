/* ============================================================================
 * world/city_mega.js — МЕГАПОЛІС v3 (NX.cityMega): деталізований піксель-арт рендер міста
 * ----------------------------------------------------------------------------
 * Власник: «все одно слабо — треба втричі краще». Попередні ескізи були «пласкими»: будинки
 * залиті одним кольором, вікна — великі блоки, мало будинків, порожньо. Тут — нічний мегаполіс:
 *   • ГЛИБИНА: 5 планів (far2 -> far1 -> mid -> hero -> near). Дальні — світлі, рожево-фіолетові, тонуть
 *     у сяйві горизонту; ближчі — темно-сині, контрастні, з неоновими кантами (повітряна перспектива)
 *   • МАСШТАБ ЕКРАНА: на комп'ютері 1 од. кімнати ≈ 1 піксель, на телефоні ≈ 2.7. Тому вогник-вікно —
 *     ціла одиниця (дальні плани — пів), сітка вікон прив'язана до цілих одиниць: на екрані кожен
 *     вогник — чіткий яскравий піксель, а не сіра «каша» від усереднення дрібниць
 *   • ФАСАДИ: вікна КЛАСТЕРАМИ (освітлені офіси, темні поверхи, поверх одного кольору), різні типи
 *     сітки (точки, стрічки поверхів, вертикальні щілини, дрібна сітка), бічна грань з боку центру
 *     вікна (перспектива кімнати), циліндричне світло круглих веж, неонові канти
 *   • НЕОН: вивіски зі СПРАВЖНІМИ написами (NEON, TAXI, КАВА, ТАКСІ, КІНО, NEXORA…) — трубки зі
 *     світлим осердям і ореолом, відсвіт кольору на фасаді; живі (по літері спалахують) — cityscape.js
 *   • ТУМАН: кожен план має свій колір серпанку, а нижче — рожеве світло вулиць (дизерингом, без розмиття)
 * Швидкість: тон фасаду й світло вікон з туманом рахуються ОДИН раз на рядок (палітра рядка, кеш),
 * на піксель — лише вибір індексу; растри будуються один раз.
 *   building(R, b, live, seed) — будинок (форми — NX.cityBuild.silhouette); b: x0, x1, top, bot, shape, plane,
 *       tone, lit, lights, wdx/wdy/ww/wh (сітка вікон), glass/strip/band (скляні фасади), outline, ledge,
 *       rimI/rimO, sign (вивіска {text, dir, p, c, c2, x, y}) або signP, holo, ant, decks (палуби мегавежі), ring
 *   skyline(plane, x0, x1, seed, o) — згенерувати щільний ряд будинків плану
 *   sign(R, s, live) — неонова вивіска з написом
 *   haze(R, y0, y1, color, a) — серпанок / світло вулиць знизу поверх усього, що вже намальовано
 * ========================================================================== */
NX.cityMega = (() => {
  const { col, pal, mix, B, rng, hash2, vn, clamp, FONT } = NX.ckit, CB = NX.cityBuild, NEON = CB.NEON, VPX = 774;
  // фасади: 11 тонів від майже чорного до приглушеного синього (нічні будинки — темні, світло дають вікна й неон)
  const BASE = pal(['#020312', '#04061c', '#070a29', '#0b0f37', '#101646', '#161d57', '#1e266a', '#28307f', '#333b94', '#4148aa', '#5357c0']);
  const LIGHT = { warm: col('#ffd27e'), amber: col('#ffa64a'), pink: col('#ff6ad6'), cyan: col('#5cf0ff'), lav: col('#b49cff'), white: col('#fff3e2'), mint: col('#78ffc8') };
  const NEONS = ['#ff3fd0', '#3be8ff', '#ffe04a', '#56ff9e', '#ff5a6a', '#8a9cff', '#c07aff'];
  // плани: тон фасаду, туман (колір угорі й унизу), сітка вікон (крок/розмір, од.), частка світлих, канти, бічна грань, шви, вивіски
  const PLANES = {
    far2: { tone: 4, fog: .64, fogC: '#b468e6', low: .2, lowC: '#ff7ae0', lowY: 140, wdx: 1.5, wdy: 1.5, ww: .5, wh: .5, lit: .24, rim: 0, side: 0, seams: 0, signP: 0 },
    far1: { tone: 3, fog: .44, fogC: '#7a4cd6', low: .3, lowC: '#f064e0', lowY: 134, wdx: 1.5, wdy: 2, ww: .5, wh: .5, lit: .3, rim: .45, side: .02, seams: 0, signP: .1 },
    mid: { tone: 2, fog: .2, fogC: '#3c2ea0', low: .36, lowC: '#d84ad8', lowY: 134, wdx: 2, wdy: 2.5, ww: 1, wh: .75, lit: .38, rim: .85, side: .035, seams: 1, signP: .34 },
    hero: { tone: 1, fog: .05, fogC: '#22186a', low: .26, lowC: '#a838d0', lowY: 150, wdx: 2, wdy: 2.5, ww: 1, wh: 1, lit: .4, rim: 1, side: .04, seams: 1, signP: 0 },
    near: { tone: 0, fog: .02, fogC: '#100c3a', low: .1, lowC: '#5a2aa0', lowY: 228, wdx: 2.5, wdy: 3, ww: 1.25, wh: 1.25, lit: .3, rim: .7, side: .06, seams: 1, signP: .45 },
  };
  const PCACHE = new Map();                                                         // палітри рядків (план × туман × світло) — спільні для всіх будинків
  const LIGHTSETS = [['cyan', 'white', 'pink'], ['pink', 'lav', 'cyan'], ['warm', 'white', 'amber'], ['cyan', 'lav', 'white'], ['pink', 'warm', 'cyan'], ['warm', 'pink', 'lav'], ['white', 'cyan', 'warm'], ['amber', 'warm', 'pink']];
  // написи вивісок (латиниця й українська; лише загальні слова — без чужих брендів)
  const WORDS = {
    far1: ['AI', 'BAR', '24', 'HI', 'SPA'],
    mid: ['NEON', 'TAXI', 'HOTEL', 'КАВА', 'CLUB', 'SUSHI', 'ТАКСІ', 'КІНО', 'RAMEN', 'BAR', 'DATA', 'МЕТРО', 'ГОТЕЛЬ', 'NEXI', 'ARCADE', 'АПТЕКА', 'OPEN', '24/7', 'CYBER', 'БАР', 'ПІЦА', 'SYNTH'],
    hero: ['NEXORA', 'NEXI', 'AI'],
    near: ['КАВА', 'BAR', 'TAXI', 'NEON', 'SHOP', 'ПІЦА', 'КІНО', 'OPEN', 'RAMEN', 'СУШІ', 'ТАКСІ', 'HOTEL'],
  };

  /** М'який відсвіт кольору C на вже намальованому (еліпс rx×ry, сильніше в центрі), дизерингом. */
  function spill(R, cx, cy, rx, ry, C, a) {
    const i0 = Math.max(0, R.I(cx - rx)), i1 = Math.min(R.W - 1, R.I(cx + rx)), j0 = Math.max(0, R.J(cy - ry)), j1 = Math.min(R.H - 1, R.J(cy + ry)), d = R.d;
    for (let j = j0; j <= j1; j++) { const v = (R.Y(j) - cy) / ry, vv = v * v; if (vv >= 1) continue;
      for (let i = i0; i <= i1; i++) { const k0 = j * R.W + i, o = d[k0]; if (!o) continue; const u = (R.X(i) - cx) / rx, e = u * u + vv; if (e >= 1) continue;
        const q = Math.floor((1 - e) * (1 - e) * a * 8 + B(i, j) + .5) / 8; if (q > 0) d[k0] = mix(o, C, q); } }
  }
  const gw = ch => (FONT[ch] || FONT[' '])[0].length;
  /** Неонова вивіска з написом. s: x, y (лівий верхній кут), text, dir 'v' (літери стовпчиком) | 'h', p — «піксель» шрифту (од.),
   *  c — колір трубок, c2 — рамка. Трубка: колір + світле осердя по центру штрихів; ореол навколо літер; відсвіт на фасад. */
  function sign(R, s, live) {
    const U = R.U, p = s.p || .75, txt = [...s.text], m = Math.max(p, .5), C = col(s.c), C2 = col(s.c2 || s.c);
    const tube = mix(C, col('#ffffff'), .22), core = mix(C, col('#ffffff'), .72), halo = mix(C, col('#07041a'), .62), board = col('#07041a');
    const pos = []; let w, h;
    if (s.dir === 'h') { w = txt.reduce((a, ch) => a + (gw(ch) + 1) * p, -p) + 2 * m; h = 5 * p + 2 * m; let x = s.x + m; txt.forEach(ch => { pos.push([ch, x, s.y + m]); x += (gw(ch) + 1) * p; }); }
    else { const mw = Math.max(...txt.map(gw)); w = mw * p + 2 * m; h = txt.length * 6 * p - p + 2 * m; let y = s.y + m; txt.forEach(ch => { pos.push([ch, s.x + m + Math.floor((mw - gw(ch)) / 2) * p, y]); y += 6 * p; }); }
    s.w = w; s.h = h;
    if (s.spill !== 0) spill(R, s.x + w / 2, s.y + h / 2, w / 2 + (s.spillR || 4), h / 2 + (s.spillR || 4), C, s.spill || .42);
    if (s.posts) { const pc = col('#141038'); [s.x + w * .2, s.x + w * .8].forEach(x => R.rect(x - U, s.y + h, x + U, s.posts, pc)); }   // стійки дахової вивіски
    R.rect(s.x, s.y, s.x + w, s.y + h, board);
    const fw = Math.max(U, Math.round(p * .4 / U) * U);                               // рамка
    R.rect(s.x, s.y, s.x + w, s.y + fw, C2); R.rect(s.x, s.y + h - fw, s.x + w, s.y + h, C2); R.rect(s.x, s.y, s.x + fw, s.y + h, C2); R.rect(s.x + w - fw, s.y, s.x + w, s.y + h, C2);
    const ins = p / U >= 3 ? U : 0;                                                    // осердя трубки (від 3 пікс. на «піксель» шрифту)
    for (const pass of [0, 1, 2]) pos.forEach(([ch, x, y]) => { const g = FONT[ch] || FONT[' '];
      g.forEach((row, j) => { for (let i = 0; i < row.length; i++) { if (row[i] !== 'X') continue; const ax = x + i * p, ay = y + j * p;
        if (pass === 0) R.rect(ax - U, ay - U, ax + p + U, ay + p + U, halo);            // ореол
        else if (pass === 1) R.rect(ax, ay, ax + p, ay + p, tube);                       // трубка
        else if (ins) { const rt = row[i + 1] === 'X', dn = g[j + 1] && g[j + 1][i] === 'X';   // світле осердя, суцільне вздовж штрихів
          R.rect(ax + ins, ay + ins, ax + p - ins + (rt ? 2 * ins : 0), ay + p - ins, core); if (dn) R.rect(ax + ins, ay + p - ins, ax + p - ins, ay + p + ins, core); } } });
    });
    live.signs.push({ x: s.x, y: s.y, w, h, p, c: s.c, letters: pos, seed: s.seed || 0 });
    return s;
  }
  /** Випадкова вивіска на будинку: вертикальна біля зовнішнього краю (часом виступає за край) або дахова з написом. */
  function autoSign(R, b, r, live, inner, seed, botY) {
    const p = b.plane === 'far1' ? .5 : b.plane === 'mid' ? .75 : 1, words = WORDS[b.plane] || WORDS.mid, text = words[Math.floor(r() * words.length)], n = [...text].length;
    const ci = Math.floor(r() * NEONS.length), c = NEONS[ci], c2 = NEONS[(ci + 2 + Math.floor(r() * 3)) % NEONS.length], m = Math.max(p, .5), w = b.x1 - b.x0, tall = botY - b.top;
    if (r() < .72) {
      const mw = Math.max(...[...text].map(gw)), sw = mw * p + 2 * m, sh = n * 6 * p - p + 2 * m; if (sh > tall - 10 || w < sw + 1) return;
      const out = r() < .35 ? sw * .45 : -.6 - r();                                  // виступає за край будинку або висить на фасаді
      const x = inner > 0 ? b.x0 - out : b.x1 - sw + out, y = b.top + 4 + r() * Math.max(1, Math.min(60, tall - sh - 12));
      sign(R, { x, y, text, dir: 'v', p, c, c2, seed }, live);
    } else {
      const sw = [...text].reduce((a, ch) => a + (gw(ch) + 1) * p, -p) + 2 * m, sh = 5 * p + 2 * m; if (sw > w + 2) return;
      const x = (b.x0 + b.x1) / 2 - sw / 2, y = b.top - sh - .75 - r() * 1.5;
      sign(R, { x, y, text, dir: 'h', p, c, c2, seed, posts: b.top + .2 }, live);
    }
  }

  /** Будинок. */
  function building(R, b, live, seed) {
    const pl = PLANES[b.plane || 'mid'], bot = Math.min(R.y1, b.bot || R.y1), M = CB.maskOf(R, CB.silhouette({ ...b, bot })); if (!M) return;
    const r = rng(seed), { x0, x1, top } = b, w = x1 - x0, cx = (x0 + x1) / 2, inner = cx < VPX ? 1 : -1, U = R.U, own = R.own, id = (R.nid = (R.nid || 0) + 1);
    const tone = b.tone == null ? pl.tone : b.tone, sideW = b.side == null ? (pl.side ? clamp(Math.abs(cx - VPX) * pl.side, 1, 7) : 0) : b.side;
    const cyl = b.cyl || /^(round|needle|twist|saucer)$/.test(b.shape || '');
    const dx = b.wdx || pl.wdx, dy = b.wdy || pl.wdy, ww = b.ww || pl.ww, wh = b.wh || pl.wh, lit = b.lit == null ? pl.lit : b.lit;
    const LS = (b.lights || LIGHTSETS[Math.floor(r() * LIGHTSETS.length)]).map(k => LIGHT[k]), nl = LS.length;
    const panel = b.panel || dx * (2 + Math.floor(r() * 3)), floorH = b.floorH || dy * (2 + Math.floor(r() * 3));
    const glass = !!b.glass, strip = b.strip || 0, band = b.band || 0, stripC = b.stripC || NEON.cyan, bandC = b.bandC || NEON.pink;
    const rimI = b.rimI === undefined ? (pl.rim ? (pl.rim > .6 ? NEON.cyan : NEON.blueL) : 0) : b.rimI, rimO = b.rimO === undefined ? (pl.rim > .6 ? NEON.pink : 0) : b.rimO, outline = !!b.outline;
    const mH = Math.max(1, Math.round(.75 / U)), mV = Math.max(1, Math.round(1.25 / U)), fogC = col(pl.fogC), lowC = col(pl.lowC);
    const media = b.media || null; let mA = 0, mB = 0, m2A = 0, m2B = 0;
    const ow = b.ow || (b.plane === 'hero' ? 3 : 1), sw2 = (b.sw || (b.plane === 'hero' ? .5 : .25)) * 1.01, crown = b.crown || 0;   // товщина контуру (пікс.), ширина світлових ліній, світла «корона» вгорі
    const rw = b.rw || (U >= .5 ? 1 : (b.plane === 'hero' || b.plane === 'near') ? 3 : 2);   // ширина канта (пікс.): на екрані має бути видно
    const gx0 = Math.ceil(x0 + (b.wm == null ? .75 : b.wm)), gy0 = Math.ceil(top + (b.wt == null ? 1.5 : b.wt));   // сітка вікон — від цілих одиниць
    const setKey = (b.lights || []).join() || LS.join(), PK = (b.plane || 'mid') + '|' + tone + '|' + setKey + '|' + (media ? media.c1 + ',' + media.c2 : '');
    let rowA, rowB, lA, lB;
    // відстані до краю силуету (у пікселях) рахуються проходами по рядку; усе, що залежить лише від стовпчика
    // (бічна грань, шви панелей, світлові лінії, світло круглої вежі, клітинка вікна), — один раз на стовпчик;
    // рішення «вікно світиться?» і колір — один раз на клітинку поверху (а не для кожного пікселя)
    const MW = M.W, mm = M.m, dl = new Int16Array(MW), dr = new Int16Array(MW), dtop = new Int16Array(MW), BAY = NX.ckit.BAY, X0 = R.x0, mixRim = pl.rim;
    const cX = new Float32Array(MW), cSide = new Uint8Array(MW), cAdd = new Int8Array(MW), cStrip = new Uint8Array(MW), cWin = new Int16Array(MW);
    let ncw = 0;
    for (let i = 0; i < MW; i++) { const X = X0 + (i + M.i0 + .5) * U, xin = inner > 0 ? x1 - X : X - x0, lx = X - gx0, cw = Math.floor(lx / dx);
      cX[i] = X; cSide[i] = xin < sideW ? 1 : 0;
      cAdd[i] = (cSide[i] ? 2 : 0) + (cyl ? Math.round(1.7 * Math.cos(((X - x0) / w - (inner > 0 ? .7 : .3)) * Math.PI) - .5) : 0) - (pl.seams && !glass && ((X - x0) % panel) < U * 1.01 ? 1 : 0);
      cStrip[i] = strip && !cSide[i] && ((((X - x0 - strip / 2) % strip) + strip) % strip) < sw2 ? 1 : 0;
      cWin[i] = lx >= 0 && lx - cw * dx < ww ? cw : -1; if (cw + 1 > ncw) ncw = cw + 1; }
    const cell = new Int8Array(Math.max(1, ncw)); let lastFy = -1e9;
    const twk = own && !glass && !media && b.plane !== 'far1' && b.plane !== 'far2' ? (b.twinkle == null ? .03 : b.twinkle) : 0, cand = [];   // вікна, що вмикаються/вимикаються наживо
    for (let j = 0; j < M.H; j++) {
      const jj = j + M.j0, Y = R.Y(jj), ly = Y - top, base = j * MW;
      for (let i = 0; i < MW; i++) dtop[i] = mm[base + i] ? dtop[i] + 1 : 0;
      for (let i = 0, run = -1; i < MW; i++) { run = mm[base + i] ? run + 1 : -1; dl[i] = run; }
      for (let i = MW - 1, run = -1; i >= 0; i--) { run = mm[base + i] ? run + 1 : -1; dr[i] = run; }
      // палітра рядка: туман плану (вгорі — його колір, нижче — рожеве світло вулиць), два рівні для дизерингу; палітри кешуються
      const lowK = Math.round(clamp((Y - pl.lowY) / 100, 0, 1) * 24) / 24, F = clamp(pl.fog + pl.low * lowK - (ly < 4 ? .05 : 0), 0, .92);
      const fq = F * 6, f0 = Math.floor(fq), fr = fq - f0, key = PK + '|' + f0 + '|' + lowK;
      let pc = PCACHE.get(key);
      if (!pc) { const T = lowK > 0 ? mix(fogC, lowC, lowK) : fogC, a0 = f0 / 6, a1 = Math.min(1, (f0 + 1) / 6);
        pc = { rA: new Uint32Array(11), rB: new Uint32Array(11), lA: new Uint32Array(nl * 2), lB: new Uint32Array(nl * 2), m: null };
        for (let k = 0; k < 11; k++) { pc.rA[k] = mix(BASE[k], T, a0); pc.rB[k] = mix(BASE[k], T, a1); }
        for (let m = 0; m < nl; m++) { pc.lA[m] = mix(LS[m], T, a0 * .4); pc.lB[m] = mix(LS[m], T, a1 * .4); pc.lA[nl + m] = mix(pc.lA[m], pc.rA[tone], .55); pc.lB[nl + m] = mix(pc.lB[m], pc.rB[tone], .55); }   // яскраве / тьмяне світло
        if (media) pc.m = [mix(media.c1, T, a0 * .5), mix(media.c1, T, a1 * .5), mix(media.c2, T, a0 * .5), mix(media.c2, T, a1 * .5)];
        PCACHE.set(key, pc); }
      rowA = pc.rA; rowB = pc.rB; lA = pc.lA; lB = pc.lB; if (pc.m) [mA, mB, m2A, m2B] = pc.m;
      // ряд вікон (поверх): частина поверхів світиться цілком, частина — темна; поверх має «свій» колір світла
      const wy = Y - gy0, fy = Math.floor(wy / dy), inWy = wy >= 0 && wy - fy * dy < wh && Y < bot - 1;
      if (inWy && fy !== lastFy) { lastFy = fy; const fh = hash2(seed * 13 + fy, 7), floorMul = fh < .08 ? 2.6 : fh > .86 ? .1 : 1, fc = (hash2(fy * 3 + seed, 11) * nl) | 0;
        for (let cw = 0; cw < ncw; cw++) { const cl = vn(cw * .19 + seed * .37, fy * .27 + seed * .11), h = hash2(seed * 131 + cw, fy * 17 + 3);
          cell[cw] = h < lit * floorMul * (.2 + cl * 1.6) ? (hash2(cw + seed, fy) < .72 ? fc : ((hash2(fy + seed * 3, cw) * nl) | 0)) + (hash2(fy + seed, cw) > .7 ? nl : 0) : -1;
          if (twk && cell[cw] >= 0 && hash2(cw * 7 + seed, fy * 5 + 1) < twk) { cand.push({ x: gx0 + cw * dx, y: gy0 + fy * dy, w: ww, h: wh, k: cell[cw] % nl, f: .25 + hash2(cw, fy + seed) * .7, ph: hash2(fy, cw + seed) * 6.28, id }); cell[cw] = -1; } } }
      const floorLine = pl.seams && (((ly % floorH) + floorH) % floorH) < U * 1.01, tRow = tone + (ly < 2.5 ? 1 : 0) - (floorLine ? 1 : 0), bj = (jj & 3) * 4;
      const bandRow = glass && band && ((((ly - band / 2) % band) + band) % band) < sw2, crownRow = crown && ly < crown, out = R.d, ob = jj * R.W + M.i0;
      for (let i = 0; i < MW; i++) {
        if (!mm[base + i]) continue;
        const ii = i + M.i0, Lb = dl[i] < ow, Rb = dr[i] < ow, Tb = dtop[i] <= ow, dith = BAY[bj + (ii & 3)] + .5 < fr, row = dith ? rowB : rowA, side = cSide[i];
        let tk = tRow + cAdd[i]; tk = tk < 0 ? 0 : tk > 10 ? 10 : tk;
        let c = row[tk], lightOk = true;
        const deep = dl[i] >= mH && dr[i] >= mH && dtop[i] > mV;
        if (deep && glass) {                                                            // скляний фасад майбутнього: світлові лінії, пояси, косий відблиск
          if (cStrip[i]) { c = (jj >> 3) % 11 < 9 ? stripC : row[tk < 8 ? tk + 2 : 10]; lightOk = false; }
          else if (bandRow) { c = side ? row[tk < 7 ? tk + 3 : 10] : bandC; lightOk = false; }
          else if (((cX[i] - x0 + ly * .55 + seed * 7) % 46) < 4) c = row[tk < 8 ? tk + 2 : 10];
        }
        if (deep && media && !side && ly > 3 && ((ii + jj) & 1) === 0) {               // медіафасад: LED-пікселі, діагональні кольорові смуги
          const q = (((cX[i] - x0) * .6 + ly * media.k + seed * 3) % media.p + media.p) % media.p, tri = Math.abs(q / media.p * 2 - 1);   // плавний діагональний перелив двох кольорів
          c = BAY[bj + (ii & 3)] + .5 < tri ? (dith ? m2B : m2A) : (dith ? mB : mA);
        }
        else if (deep && inWy && lightOk && cWin[i] >= 0) {                              // вікна-вогники кластерами
          const st = cell[cWin[i]]; if (st >= 0) c = (dith ? lB : lA)[st]; else if (!side) c = row[tk > 0 ? tk - 1 : 0];
        }
        if (crownRow && !Tb && ((jj + ii) & 1)) c = row[tk < 6 ? tk + 4 : 10];                                                // світла «корона» — верх вежі
        if (outline && (Lb || Rb || Tb)) c = Tb ? (b.ledge || rimI || rimO) : ((Rb && inner > 0) || (Lb && inner < 0)) ? (rimI || rimO) : (rimO || rimI);   // неоновий контур
        else {
          const Lr = dl[i] < rw, Rr = dr[i] < rw;
          if ((Lr || Rr) && mixRim) { const isIn = (Rr && inner > 0) || (Lr && inner < 0); if (isIn && rimI) c = mix(c, rimI, mixRim * clamp(1 - ly / 170, .35, 1)); else if (!isIn && rimO) c = mix(c, rimO, .42 * mixRim); }
          if (Tb) c = b.ledge || row[tk < 7 ? tk + 3 : 10];
        }
        out[ob + i] = c; if (own) own[ob + i] = id;
      }
    }
    // живі вікна: лише ті, що цілком на фасаді (не на краю силуету)
    if (cand.length) { const inM = (X, Y) => { const i = R.I(X) - M.i0, j = R.J(Y) - M.j0; return i >= 0 && j >= 0 && i < MW && j < M.H && mm[j * MW + i]; };
      cand.forEach(q => { if (inM(q.x - .75, q.y) && inM(q.x + q.w + .75, q.y + q.h) && inM(q.x, q.y - 1.25)) { const [cr, cg, cb] = NX.ckit.rgb(LS[q.k]); q.c = `rgb(${cr},${cg},${cb})`; live.win.push(q); } }); }
    // ---- палуби мегавежі, кільце-майданчик ----
    (b.decks || []).forEach(([y, ex, h]) => {
      const hh = h || 3, a0 = x0 - ex, a1 = x1 + ex, DK = [col('#121448'), col('#1c2066'), col('#2a2e86')];
      R.rect(a0, y, a1, y + hh, (i, j, X, Y) => { const rr = hh / 2, cx2 = X < a0 + rr ? a0 + rr : X > a1 - rr ? a1 - rr : X; if (((X - cx2) / rr) ** 2 + ((Y - y - rr) / rr) ** 2 > 1) return 0;
        const v = (Y - y) / hh; return v < .2 ? NEON.cyanL : v > .8 ? NEON.pink : DK[clamp(Math.round((1 - v) * 2 + B(i, j) * .8), 0, 2)]; });
      for (let x = Math.ceil(a0 + 1.5); x < a1 - 1.5; x += 2) if (hash2(x * 7, y) > .25) R.rect(x, y + hh * .38, x + 1, y + hh * .66, hash2(x, y) > .5 ? LIGHT.warm : LIGHT.cyan);
      for (let k = 1; k <= 8; k++) for (let i = R.I(a0 + 2); i <= R.I(a1 - 2); i++) R.over(i, R.J(y + hh) + k, NEON.cyan, .3 / k);   // світло з-під палуби
    });
    if (b.ring) CB.ringOf(R, b, M);
    // ---- дах: щогли з вогнями, короби ----
    (b.ant || []).forEach(a => { const y0 = a.y0 || top; R.rect(a.x - U, y0 - a.h, a.x + U, y0, col('#7a86c4')); for (let k = 1; k < 3; k++) R.rect(a.x - .6, y0 - a.h + k * a.h / 3.2, a.x + .6, y0 - a.h + k * a.h / 3.2 + U, col('#4a56a0')); live.lights.push({ x: a.x, y: y0 - a.h - .2, c: 'red', ph: r() * 6 }); });
    if (b.needle) { const nx = b.needle.x || cx, y0 = b.needle.y0 || top, h = b.needle.h; R.rect(nx - U, y0 - h, nx + U, y0 + .5, col('#9aa6e8')); R.rect(nx - .6, y0 - h * .55, nx + .6, y0 - h * .55 + U * 2, col('#6a76c0')); live.lights.push({ x: nx, y: y0 - h - .2, c: 'red', ph: r() * 6 }); }
    if (b.boxes) for (let k = 0; k < b.boxes; k++) { const bw = 1.5 + r() * 3, bh = 1 + r() * 2, bx = x0 + 1 + r() * Math.max(0, w - 2 - bw); R.rect(bx, top - bh, bx + bw, top + .1, rowA[Math.min(10, tone + 1)]); R.rect(bx, top - bh, bx + bw, top - bh + U, rowA[Math.min(10, tone + 4)]); }
    // ---- вивіски: задані або випадкові ----
    const sp = b.signP == null ? pl.signP : b.signP;
    if (b.sign) (Array.isArray(b.sign) ? b.sign : [b.sign]).forEach(s => sign(R, { seed, ...s }, live));
    else if (sp && r() < sp && w > 6) autoSign(R, b, r, live, inner, seed, bot);
    if (b.holo) { const h = b.holo; R.rect(h.x - .5, h.y - .5, h.x + h.w + .5, h.y + h.h + .5, col('#04020f')); R.rect(h.x, h.y, h.x + h.w, h.y + h.h, (i, j) => (i + j) & 1 ? col('#071a3a') : col('#0a2450')); live.holo.push(h); }
  }

  /** Щільний ряд будинків плану. o: w [мін, макс], top [мін, макс], tall (частка високих), tallBy, shapes [[форма, вага]], lit [мін, макс],
   *  step (крок як частка ширини — <1: будинки перекриваються), gapP/gap — просвіти, antP, glassP, mediaP, signP, bot, dark (частка темних). */
  function skyline(plane, x0, x1, seed, o = {}) {
    const r = rng(seed), out = [], SH = o.shapes || [['box', 6], ['round', 2], ['setback', 2], ['needle', 1], ['dome', 1]], tot = SH.reduce((a, s) => a + s[1], 0), P = PLANES[plane];
    let x = x0 - 10;
    while (x < x1 + 10) {
      const w = o.w[0] + r() * (o.w[1] - o.w[0]); let t = o.top[0] + r() * (o.top[1] - o.top[0]); if (r() < (o.tall || 0)) t -= (o.tallBy || 30) * (.4 + r() * .6);
      let q = r() * tot, shape = 'box'; for (const [s, k] of SH) { if ((q -= k) < 0) { shape = s; break; } }
      const xs = Math.round(x * 2) / 2, b = { x0: xs, x1: Math.round((x + w) * 2) / 2, top: Math.round(t * 2) / 2, plane, shape, bot: o.bot, lit: o.lit ? o.lit[0] + r() * (o.lit[1] - o.lit[0]) : undefined, signP: o.signP,
        tiers: [[w * (.12 + r() * .14), 2 + r() * 6], [w * .06, 3 + r() * 6]], sh: 5 + r() * 12, ins: w * (.15 + r() * .1), k: .45 + r() * .35, dh: w * (.25 + r() * .2), flat: .6 + r() * .4, th: 8 + r() * 14,
        ant: r() < (o.antP == null ? .25 : o.antP) ? [{ x: x + w * (.25 + r() * .5), h: 2 + r() * (o.antH || 7) }] : [], boxes: o.boxes ? Math.floor(r() * 3) : 0 };
      if (shape === 'needle') b.top -= 8 + r() * (o.needleBy || 18);
      // тип сітки вікон: точки (план), стрічки поверхів, вертикальні щілини, дрібна сітка; частина будинків — майже темні
      const ws = r();
      if (ws < .24) b.ww = P.wdx; else if (ws < .38) { b.wh = P.wdy - .5; b.ww = Math.max(.5, P.ww * .5); } else if (ws < .5) { b.wdx = P.wdx * .75; b.wdy = P.wdy * .8; b.ww = .5; b.wh = .5; }
      if (b.lit != null && r() < (o.dark == null ? .18 : o.dark)) b.lit *= .25;
      const rr = r(); if (P.rim) { b.rimI = rr < .55 ? NEON.cyan : rr < .8 ? NEON.pink : NEON.blueL; b.rimO = rr < .55 ? NEON.pink : NEON.violet; }
      if (o.mediaP && r() < o.mediaP && shape !== 'needle') { const MC = ['#ff3fd0', '#3be8ff', '#c07aff', '#8a9cff'], a = Math.floor(r() * 4), c2 = (a + 1 + Math.floor(r() * 3)) % 4; b.media = { c1: col(MC[a]), c2: col(MC[c2]), p: 14 + r() * 16, k: r() < .5 ? .7 : -.7 }; }
      if (o.glassP && r() < o.glassP) Object.assign(b, { glass: true, strip: r() < .5 ? 3 + r() * 3 : 0, band: r() < .6 ? 5 + r() * 6 : 0, stripC: r() < .5 ? NEON.cyan : NEON.pink, bandC: r() < .5 ? NEON.pink : NEON.cyan, lit: (b.lit || .25) * .6 });
      out.push(b); x += w * (o.step || .8) + (r() < (o.gapP || .15) ? r() * (o.gap || 5) : 0);
    }
    // порядок малювання: вищі — позаду, нижчі — попереду (з випадковим зсувом, щоб перекриття були різні)
    return out.map(b => [b, b.top + (hash2(b.x0 | 0, seed) - .5) * 26]).sort((a, c) => a[1] - c[1]).map(a => a[0]);
  }

  /** Серпанок / світло вулиць знизу: усе, що вже намальовано між y0 і y1, тоне в кольорі c (густіше донизу), дизерингом. */
  function haze(R, y0, y1, c, a, pow = 1.4) {
    const C = col(c);
    for (let j = Math.max(0, R.J(y0)); j < Math.min(R.H, R.J(y1)); j++) { const k = Math.pow((R.Y(j) - y0) / (y1 - y0), pow) * a; if (k <= .01) continue;
      for (let i = 0; i < R.W; i++) { const v = R.d[j * R.W + i]; if (!v) continue; const q = Math.floor(k * 6 + B(i, j) + .5) / 6; if (q > 0) R.d[j * R.W + i] = mix(v, C, q); } }
  }

  /** Пасма туману між вежами (нерухомі): напівпрозорі горизонтальні смуги з шумом, рожево-фіолетові. */
  function mist(R, y, h, c, a, seed) {
    const C = col(c);
    for (let j = R.J(y - h); j <= R.J(y + h); j++) { if (j < 0 || j >= R.H) continue; const v = 1 - Math.abs(R.Y(j) - y) / h;
      for (let i = 0; i < R.W; i++) { const X = R.X(i), n = vn(X * .03 + seed, R.Y(j) * .25 + seed * .3) * .7 + vn(X * .09 + seed * 2, R.Y(j) * .5) * .3, k = v * v * a * clamp((n - .35) * 2.2, 0, 1);
        if (k > .03 && B(i, j) + .5 < k * 1.6) R.over(i, j, C, Math.min(.6, k * 1.2)); } }
  }
  return { PLANES, NEONS, LIGHT, WORDS, building, skyline, sign, haze, mist, spill };
})();
