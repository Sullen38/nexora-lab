/* ============================================================================
 * world/city_mega.js — МЕГАПОЛІС v3 (NX.cityMega): деталізований піксель-арт рендер міста
 * ----------------------------------------------------------------------------
 * Власник: «все одно слабо — треба втричі краще». Попередні ескізи були «пласкими»: будинки
 * залиті одним кольором, вікна — великі блоки, мало будинків, порожньо. Тут — рівень нічного
 * мегаполісу в піксель-арті:
 *   • ЩІЛЬНІСТЬ: десятки будинків на кожному з 5 планів (far2 -> far1 -> mid -> hero -> near), що
 *     перекривають один одного; туман і світло міста знизу розділяють плани
 *   • ФАСАДИ: тисячі дрібних вогників-вікон (1 піксель = 0.25 од.) КЛАСТЕРАМИ (освітлені офіси, темні
 *     поверхи, поверхи, що світяться цілком), шви панелей і перекриттів, освітлена бічна грань з боку
 *     центру вікна (перспектива кімнати), циліндричне світло на круглих вежах, неоновий кант-ребро
 *   • НЕОН: вертикальні вивіски з яскравими «ієрогліфами» різних кольорів (живі — cityscape.js)
 *   • ТУМАН: кожен план має свій колір серпанку, а нижче — рожеве світло міста (дизерингом, без розмиття)
 * Швидкість: тон фасаду й світло вікон з туманом рахуються ОДИН раз на рядок (палітра рядка),
 * на піксель — лише вибір індексу; растри будуються один раз.
 *   building(R, b, live, seed) — будинок (форми — NX.cityBuild.silhouette); b: x0, x1, top, bot, shape, plane,
 *       tone, lit, lights, glass/strip/band (скляні фасади майбутнього), outline, ledge, rimI/rimO, sign/autoSign,
 *       holo, ant, decks (палуби мегавежі), ring
 *   skyline(plane, x0, x1, seed, o) — згенерувати щільний ряд будинків плану
 *   haze(R, y0, y1, color, a) — серпанок / світло міста знизу поверх усього, що вже намальовано
 * ========================================================================== */
NX.cityMega = (() => {
  const { col, pal, mix, B, rng, hash2, vn, clamp } = NX.ckit, CB = NX.cityBuild, NEON = CB.NEON, VPX = 774;
  // фасади: 11 тонів від майже чорного індиго до світлого синьо-фіолетового
  const BASE = pal(['#04031a', '#070526', '#0b0834', '#100c42', '#151150', '#1c1760', '#241f72', '#2e2a86', '#3a369a', '#4a46b0', '#5e5ac6']);
  const LIGHT = { warm: col('#ffe9cc'), amber: col('#ffc46e'), pink: col('#ffaaea'), cyan: col('#9eeaff'), lav: col('#cbb6ff'), white: col('#f6f2ff') };
  const NEONS = ['#ff3fd0', '#3be8ff', '#ffe04a', '#56ff9e', '#ff5a6a', '#8a9cff', '#c07aff'];
  // плани: тон фасаду, туман (колір угорі й унизу), крок вікон, частка світлих, сила кантів, бічна грань, шви, вивіски
  const PLANES = {
    far2: { tone: 5, fog: .7, fogC: '#a05ad8', low: .12, lowC: '#e064e4', lowY: 150, wdx: .75, wdy: 1.25, ww: .25, wh: .25, lit: .2, rim: 0, side: 0, seams: 0, signP: 0 },
    far1: { tone: 4, fog: .5, fogC: '#7048c8', low: .22, lowC: '#cc56dc', lowY: 140, wdx: .75, wdy: 1, ww: .25, wh: .25, lit: .26, rim: .45, side: .02, seams: 0, signP: .06 },
    mid: { tone: 3, fog: .27, fogC: '#46349e', low: .32, lowC: '#b048d0', lowY: 140, wdx: 1, wdy: 1.25, ww: .5, wh: .5, lit: .32, rim: .85, side: .035, seams: 1, signP: .28 },
    hero: { tone: 2, fog: .08, fogC: '#2c2276', low: .3, lowC: '#9a40c8', lowY: 150, wdx: 1, wdy: 1.25, ww: .5, wh: .5, lit: .34, rim: 1, side: .04, seams: 1, signP: .3 },
    near: { tone: 1, fog: .03, fogC: '#16124a', low: .14, lowC: '#5a30a8', lowY: 228, wdx: 1.5, wdy: 2, ww: 1, wh: .75, lit: .22, rim: .75, side: .06, seams: 1, signP: .35 },
  };
  const PCACHE = new Map();                                                         // палітри рядків (план × туман × світло) — спільні для всіх будинків
  const LIGHTSETS = [['warm', 'amber', 'lav'], ['warm', 'pink', 'cyan'], ['lav', 'cyan', 'white'], ['pink', 'warm', 'lav'], ['amber', 'warm', 'white'], ['cyan', 'lav', 'pink']];

  /** Вертикальна неонова вивіска: темна дошка, яскрава рамка, яскраві «ієрогліфи» (кожен знак — свій візерунок штрихів). */
  function sign(R, s, live) {
    const c1 = col(s.c), c2 = col(s.c2 || s.c), D = col('#0c0624'), U = R.U;
    R.rect(s.x - U, s.y - U, s.x + s.w + U, s.y + s.h + U, col('#04020f')); R.rect(s.x, s.y, s.x + s.w, s.y + s.h, D);
    R.rect(s.x, s.y, s.x + s.w, s.y + U, c1); R.rect(s.x, s.y + s.h - U, s.x + s.w, s.y + s.h, c1); R.rect(s.x, s.y, s.x + U, s.y + s.h, c1); R.rect(s.x + s.w - U, s.y, s.x + s.w, s.y + s.h, c1);
    s.cells = []; const cw = s.w - 1, ch = cw * 1.15, n = Math.max(1, Math.floor((s.h - 1) / (ch + .5))), r = rng(s.seed || 7);
    for (let k = 0; k < n; k++) {
      const x = s.x + .5, y = s.y + .6 + k * (ch + .5), cc = k % 3 === 2 ? c2 : c1; s.cells.push([x, y, cw, ch, k % 3 === 2 ? (s.c2 || s.c) : s.c]);
      const gx = 3, gy = 4, px = cw / gx, py = ch / gy;                                      // знак: штрихи на сітці 3×4
      for (let a = 0; a < gx; a++) for (let b = 0; b < gy; b++) if (r() > .42 || (a === 1 && (b === 0 || b === 2))) R.rect(x + a * px, y + b * py, x + (a + 1) * px - U * .5, y + (b + 1) * py - U * .5, cc);
    }
    live.signs.push(s);
  }

  /** Будинок. */
  function building(R, b, live, seed) {
    const pl = PLANES[b.plane || 'mid'], bot = Math.min(R.y1, b.bot || R.y1), M = CB.maskOf(R, CB.silhouette({ ...b, bot })); if (!M) return;
    const r = rng(seed), { x0, x1, top } = b, w = x1 - x0, cx = (x0 + x1) / 2, inner = cx < VPX ? 1 : -1, U = R.U;
    const tone = b.tone == null ? pl.tone : b.tone, sideW = b.side == null ? (pl.side ? clamp(Math.abs(cx - VPX) * pl.side, 1, 7) : 0) : b.side;
    const cyl = b.cyl || /^(round|needle|twist|saucer)$/.test(b.shape || '');
    const dx = b.wdx || pl.wdx, dy = b.wdy || pl.wdy, ww = b.ww || pl.ww, wh = b.wh || pl.wh, lit = b.lit == null ? pl.lit : b.lit;
    const LS = (b.lights || LIGHTSETS[Math.floor(r() * LIGHTSETS.length)]).map(k => LIGHT[k]), nl = LS.length;
    const panel = b.panel || dx * (3 + Math.floor(r() * 3)), floorH = b.floorH || dy * (3 + Math.floor(r() * 3));
    const glass = !!b.glass, strip = b.strip || 0, band = b.band || 0, stripC = b.stripC || NEON.cyan, bandC = b.bandC || NEON.pink;
    const rimI = b.rimI === undefined ? (pl.rim ? NEON.blueL : 0) : b.rimI, rimO = b.rimO === undefined ? (pl.rim > .6 ? NEON.violet : 0) : b.rimO, outline = !!b.outline;
    const mH = Math.max(1, Math.round(.75 / U)), mV = Math.max(1, Math.round(1.25 / U)), fogC = col(pl.fogC), lowC = col(pl.lowC);
    const media = b.media || null; let mA = 0, mB = 0, m2A = 0, m2B = 0;
    const ow = b.ow || (b.plane === 'hero' ? 2 : 1), sw2 = (b.sw || (b.plane === 'hero' ? .5 : .25)) * 1.01, crown = b.crown || 0;   // товщина контуру (пікс.), ширина світлових ліній, світла «корона» вгорі
    const setKey = (b.lights || []).join() || LS.join(), PK = (b.plane || 'mid') + '|' + tone + '|' + setKey + '|' + (media ? media.c1 + ',' + media.c2 : '');
    let rowA, rowB, lA, lB;
    // відстані до краю силуету (у пікселях) рахуються проходами по рядку; усе, що залежить лише від стовпчика
    // (бічна грань, шви панелей, світлові лінії, світло круглої вежі, клітинка вікна), — один раз на стовпчик;
    // рішення «вікно світиться?» — один раз на клітинку поверху (а не для кожного пікселя)
    const MW = M.W, mm = M.m, dl = new Int16Array(MW), dr = new Int16Array(MW), dtop = new Int16Array(MW), BAY = NX.ckit.BAY, X0 = R.x0, mixRim = pl.rim;
    const cX = new Float32Array(MW), cSide = new Uint8Array(MW), cAdd = new Int8Array(MW), cStrip = new Uint8Array(MW), cWin = new Int16Array(MW);
    let ncw = 0;
    for (let i = 0; i < MW; i++) { const X = X0 + (i + M.i0 + .5) * U, xin = inner > 0 ? x1 - X : X - x0, lx = X - x0 - .75, cw = Math.floor(lx / dx);
      cX[i] = X; cSide[i] = xin < sideW ? 1 : 0;
      cAdd[i] = (cSide[i] ? 2 : 0) + (cyl ? Math.round(1.7 * Math.cos(((X - x0) / w - (inner > 0 ? .7 : .3)) * Math.PI) - .5) : 0) - (pl.seams && !glass && ((X - x0) % panel) < U * 1.01 ? 1 : 0);
      cStrip[i] = strip && !cSide[i] && ((((X - x0 - strip / 2) % strip) + strip) % strip) < sw2 ? 1 : 0;
      cWin[i] = lx >= 0 && lx - cw * dx < ww ? cw : -1; if (cw + 1 > ncw) ncw = cw + 1; }
    const cell = new Int8Array(Math.max(1, ncw)); let lastFy = -1e9;
    for (let j = 0; j < M.H; j++) {
      const jj = j + M.j0, Y = R.Y(jj), ly = Y - top, base = j * MW;
      for (let i = 0; i < MW; i++) dtop[i] = mm[base + i] ? dtop[i] + 1 : 0;
      for (let i = 0, run = -1; i < MW; i++) { run = mm[base + i] ? run + 1 : -1; dl[i] = run; }
      for (let i = MW - 1, run = -1; i >= 0; i--) { run = mm[base + i] ? run + 1 : -1; dr[i] = run; }
      // палітра рядка: туман плану (вгорі — його колір, нижче — рожеве світло міста), два рівні для дизерингу; палітри кешуються
      const lowK = Math.round(clamp((Y - pl.lowY) / 100, 0, 1) * 24) / 24, F = clamp(pl.fog + pl.low * lowK - (ly < 4 ? .05 : 0), 0, .92);
      const fq = F * 6, f0 = Math.floor(fq), fr = fq - f0, key = PK + '|' + f0 + '|' + lowK;
      let pc = PCACHE.get(key);
      if (!pc) { const T = lowK > 0 ? mix(fogC, lowC, lowK) : fogC, a0 = f0 / 6, a1 = Math.min(1, (f0 + 1) / 6);
        pc = { rA: new Uint32Array(11), rB: new Uint32Array(11), lA: new Uint32Array(nl * 2), lB: new Uint32Array(nl * 2), m: null };
        for (let k = 0; k < 11; k++) { pc.rA[k] = mix(BASE[k], T, a0); pc.rB[k] = mix(BASE[k], T, a1); }
        for (let m = 0; m < nl; m++) { pc.lA[m] = mix(LS[m], T, a0 * .55); pc.lB[m] = mix(LS[m], T, a1 * .55); pc.lA[nl + m] = mix(pc.lA[m], pc.rA[tone], .5); pc.lB[nl + m] = mix(pc.lB[m], pc.rB[tone], .5); }   // яскраве / тьмяне світло
        if (media) pc.m = [mix(media.c1, T, a0 * .5), mix(media.c1, T, a1 * .5), mix(media.c2, T, a0 * .5), mix(media.c2, T, a1 * .5)];
        PCACHE.set(key, pc); }
      rowA = pc.rA; rowB = pc.rB; lA = pc.lA; lB = pc.lB; if (pc.m) [mA, mB, m2A, m2B] = pc.m;
      // ряд вікон (поверх): частина поверхів світиться цілком, частина — темна; стан клітинок — раз на поверх
      const wy = ly - 1.25, fy = Math.floor(wy / dy), inWy = wy >= 0 && wy - fy * dy < wh && Y < bot - 1;
      if (inWy && fy !== lastFy) { lastFy = fy; const fh = hash2(seed * 13 + fy, 7), floorMul = fh < .08 ? 2.6 : fh > .86 ? .1 : 1;
        for (let cw = 0; cw < ncw; cw++) { const cl = vn(cw * .19 + seed * .37, fy * .27 + seed * .11), h = hash2(seed * 131 + cw, fy * 17 + 3);
          cell[cw] = h < lit * floorMul * (.2 + cl * 1.6) ? ((hash2(cw + seed, fy) * nl) | 0) + (hash2(fy + seed, cw) > .66 ? nl : 0) : -1; } }
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
          if ((Lb || Rb) && mixRim) { const isIn = (Rb && inner > 0) || (Lb && inner < 0); if (isIn && rimI) c = mix(c, rimI, mixRim * clamp(1 - ly / 170, .3, 1)); else if (!isIn && rimO) c = mix(c, rimO, .38 * mixRim); }
          if (Tb) c = b.ledge || row[tk < 7 ? tk + 3 : 10];
        }
        out[ob + i] = c;
      }
    }
    // ---- палуби мегавежі, кільце-майданчик ----
    (b.decks || []).forEach(([y, ex, h]) => {
      const hh = h || 3, a0 = x0 - ex, a1 = x1 + ex, DK = [col('#1c1660'), col('#2a2280'), col('#3a30a0')];
      R.rect(a0, y, a1, y + hh, (i, j, X, Y) => { const rr = hh / 2, cx2 = X < a0 + rr ? a0 + rr : X > a1 - rr ? a1 - rr : X; if (((X - cx2) / rr) ** 2 + ((Y - y - rr) / rr) ** 2 > 1) return 0;
        const v = (Y - y) / hh; return v < .18 ? NEON.cyanL : v > .82 ? NEON.pink : DK[clamp(Math.round((1 - v) * 2 + B(i, j) * .8), 0, 2)]; });
      for (let x = a0 + 1.5; x < a1 - 1; x += 1.5) if (hash2(x * 7, y) > .3) R.rect(x, y + hh * .42, x + .5, y + hh * .62, hash2(x, y) > .5 ? LIGHT.warm : LIGHT.cyan);
      for (let k = 1; k <= 6; k++) for (let i = R.I(a0 + 2); i <= R.I(a1 - 2); i++) R.over(i, R.J(y + hh) + k, NEON.cyan, .22 / k);   // світло з-під палуби
    });
    if (b.ring) CB.ringOf(R, b, M);
    // ---- дах: щогли з вогнями, короби ----
    (b.ant || []).forEach(a => { const y0 = a.y0 || top; R.rect(a.x - U, y0 - a.h, a.x + U, y0, col('#7a86c4')); for (let k = 1; k < 3; k++) R.rect(a.x - .6, y0 - a.h + k * a.h / 3.2, a.x + .6, y0 - a.h + k * a.h / 3.2 + U, col('#4a56a0')); live.lights.push({ x: a.x, y: y0 - a.h - .2, c: 'red', ph: r() * 6 }); });
    if (b.needle) { const nx = b.needle.x || cx, y0 = b.needle.y0 || top, h = b.needle.h; R.rect(nx - U, y0 - h, nx + U, y0 + .5, col('#9aa6e8')); R.rect(nx - .6, y0 - h * .55, nx + .6, y0 - h * .55 + U * 2, col('#6a76c0')); live.lights.push({ x: nx, y: y0 - h - .2, c: 'red', ph: r() * 6 }); }
    if (b.boxes) for (let k = 0; k < b.boxes; k++) { const bw = 1.5 + r() * 3, bh = 1 + r() * 2, bx = x0 + 1 + r() * Math.max(0, w - 2 - bw); R.rect(bx, top - bh, bx + bw, top + .1, rowA[Math.min(10, tone + 1)]); R.rect(bx, top - bh, bx + bw, top - bh + U, rowA[Math.min(10, tone + 4)]); }
    // ---- вивіски: задані або випадкові (на лицьовій грані, біля зовнішнього краю) ----
    const sp = b.signP == null ? pl.signP : b.signP;
    if (b.sign) sign(R, b.sign, live);
    else if (sp && r() < sp && w > 7 && bot - top > 22) {
      const sw = 2.2 + r() * 1.3, sh = 9 + r() * 16, sx = inner > 0 ? x0 + .8 + r() * 1.2 : x1 - sw - .8 - r() * 1.2, sy = top + 5 + r() * Math.max(1, Math.min(60, bot - top - sh - 12));
      const ci = Math.floor(r() * NEONS.length); sign(R, { x: sx, y: sy, w: sw, h: sh, c: NEONS[ci], c2: NEONS[(ci + 1 + Math.floor(r() * 3)) % NEONS.length], seed: seed }, live);
    }
    if (b.holo) { const h = b.holo; R.rect(h.x - .5, h.y - .5, h.x + h.w + .5, h.y + h.h + .5, col('#04020f')); R.rect(h.x, h.y, h.x + h.w, h.y + h.h, (i, j) => (i + j) & 1 ? col('#071a3a') : col('#0a2450')); live.holo.push(h); }
  }

  /** Щільний ряд будинків плану. o: w [мін, макс], top [мін, макс], tall (частка високих), tallBy, shapes [[форма, вага]], lit [мін, макс],
   *  step (крок як частка ширини — <1: будинки перекриваються), gapP/gap — просвіти, antP, glassP, signP, bot. */
  function skyline(plane, x0, x1, seed, o = {}) {
    const r = rng(seed), out = [], SH = o.shapes || [['box', 6], ['round', 2], ['setback', 2], ['needle', 1], ['dome', 1]], tot = SH.reduce((a, s) => a + s[1], 0);
    let x = x0 - 10;
    while (x < x1 + 10) {
      const w = o.w[0] + r() * (o.w[1] - o.w[0]); let t = o.top[0] + r() * (o.top[1] - o.top[0]); if (r() < (o.tall || 0)) t -= (o.tallBy || 30) * (.4 + r() * .6);
      let q = r() * tot, shape = 'box'; for (const [s, k] of SH) { if ((q -= k) < 0) { shape = s; break; } }
      const b = { x0: x, x1: x + w, top: t, plane, shape, bot: o.bot, lit: o.lit ? o.lit[0] + r() * (o.lit[1] - o.lit[0]) : undefined, signP: o.signP,
        tiers: [[w * (.12 + r() * .14), 2 + r() * 6], [w * .06, 3 + r() * 6]], sh: 5 + r() * 12, ins: w * (.15 + r() * .1), k: .45 + r() * .35, dh: w * (.25 + r() * .2), flat: .6 + r() * .4, th: 8 + r() * 14,
        ant: r() < (o.antP == null ? .25 : o.antP) ? [{ x: x + w * (.25 + r() * .5), h: 2 + r() * (o.antH || 7) }] : [], boxes: o.boxes ? Math.floor(r() * 3) : 0 };
      if (shape === 'needle') b.top -= 8 + r() * (o.needleBy || 18);
      if (o.mediaP && r() < o.mediaP && shape !== 'needle') { const MC = ['#ff3fd0', '#3be8ff', '#c07aff', '#8a9cff'], a = Math.floor(r() * 4), c2 = (a + 1 + Math.floor(r() * 3)) % 4; b.media = { c1: col(MC[a]), c2: col(MC[c2]), p: 14 + r() * 16, k: r() < .5 ? .7 : -.7 }; }
      if (o.glassP && r() < o.glassP) Object.assign(b, { glass: true, strip: r() < .5 ? 3 + r() * 3 : 0, band: r() < .6 ? 5 + r() * 6 : 0, stripC: r() < .5 ? NEON.cyan : NEON.pink, bandC: r() < .5 ? NEON.pink : NEON.cyan, lit: (b.lit || .25) * .6 });
      out.push(b); x += w * (o.step || .8) + (r() < (o.gapP || .15) ? r() * (o.gap || 5) : 0);
    }
    // порядок малювання: вищі — позаду, нижчі — попереду (з випадковим зсувом, щоб перекриття були різні)
    return out.map(b => [b, b.top + (hash2(b.x0 | 0, seed) - .5) * 26]).sort((a, c) => a[1] - c[1]).map(a => a[0]);
  }

  /** Серпанок / світло міста знизу: усе, що вже намальовано між y0 і y1, тоне в кольорі c (густіше донизу), дизерингом. */
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
  /** Промінь світла вгору (з вершини піраміди / вежі): у растр неба — смуга, що згасає догори. */
  return { PLANES, NEONS, LIGHT, building, skyline, sign, haze, mist };
})();
