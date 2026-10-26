/* ============================================================================
 * world/city_build.js — ХМАРОЧОСИ ЗА ВІКНОМ (NX.cityBuild): три плани міста кодом
 * ----------------------------------------------------------------------------
 * Хмарочос = запис:
 *   x0, x1, top, bot — фасад; z, dz — глибина (для бічної грані); pal — палітра фасаду (FAC); haze — far | mid | near
 *   win  — вікна: {sx, sy — крок, w, h — розмір, lit — частка світлих, cols — кольори світла, style: 'grid' | 'bands'}
 *   roof — дах: {type: flat | crown | spire | dome, ant: {x, h} — щогла з вогнем, tank: [x, w] — бак, dish: [x, dy] — тарілка}
 *   rim  — неонові канти ребер {l, r}; bands — неонові пояси [[y, колір]]; pil — пілястри (крок); slab — кромки перекриттів
 *   sign — вертикальна вивіска {x, y, w, h}; holo — голо-екран {x, y, w, h, kind: tall | wide | graph}; pad — вогні майданчика
 * Будуємо в растри (1 px = 0.25 од.) один раз (cityscape.js складає їх в одне полотно):
 *   farList  — далекі силуети в рожевому серпанку (з просвітами неба); baseList — низькі квартали між вежами
 *   MID      — головні вежі, як на картинці: висока ліва з короною, шпиль, ЦЕНТРАЛЬНА вежа з антеною
 *              (закриває низ планети), права вежа з голо-рекламою; між ними — нижчі
 *   NEAR     — ближні будинки внизу вікна (над диваном): великі вікна, вивіски, екран-білборд,
 *              дах з посадковим майданчиком; між ними — streets (глибина вулиць); ПЕРЕД ними — rail (монорейка)
 * Перспектива — та сама, що в кімнаті (NX.persp: точка сходу (774, 220), D = 520): у кожної вежі
 * видно бічну грань, що «тікає» до центру вікна; чим ближча вежа (менше z), тим ширша грань.
 * Вікна: сітка за поверхами (частина поверхів світиться вся, частина — темна), 5 кольорів світла;
 * частина вікон «жива» — їх засвічує cityscape.js (blink). Знизу вежі тонуть у рожевому світлі вулиць.
 * Повертає також живі точки: вогні антен, «живі» вікна, вивіски, екрани, вогники майданчика.
 * Швидкість: тон фасаду рахується раз на рядок (4 кольори дизерингу), вікна — за номером клітинки.
 * ========================================================================== */
NX.cityBuild = (() => {
  const { col, pal, mix, B, rng, hash2, Ras, clamp } = NX.ckit;
  const VP = (NX.persp && NX.persp.VP) || [774, 220], D = (NX.persp && NX.persp.D) || 520;

  // ---------- палітри фасадів (темний -> світлий) і світла вікон ----------
  const FAC = {
    far: pal(['#24227a', '#2a2a8a', '#31329a', '#3a3ca8', '#4446b6', '#5050c2']),
    blue: pal(['#03051a', '#050824', '#080c2e', '#0b113a', '#0f1748', '#141e58', '#1a266a']),
    violet: pal(['#05031a', '#080522', '#0c082c', '#110c38', '#171146', '#1e1656', '#261c66']),
    teal: pal(['#02081a', '#040d24', '#06132e', '#091a3a', '#0d2248', '#122c5a', '#18376c']),
    near: pal(['#020210', '#030418', '#05061e', '#070926', '#0a0d30', '#0e123c', '#13184a']),
  };
  const LIT = {
    warm: pal(['#ffc45a', '#ffe4a0', '#9a6a22']), pink: pal(['#ff58cf', '#ffa2ec', '#8e2478']), cyan: pal(['#48d6ff', '#b0f2ff', '#1a5e8e']),
    white: pal(['#d6ccff', '#fbf6ff', '#6a62b0']), violet: pal(['#9a6cff', '#cfb0ff', '#4c2ea0']),
  };
  const CSS = { warm: '#ffcc66', pink: '#ff62d4', cyan: '#56dcff', white: '#e2dcff', violet: '#a87cff' };
  const NEON = { cyan: col('#3be8ff'), pink: col('#ff4fd8'), violet: col('#a87aff'), cyanL: col('#b4f8ff'), pinkL: col('#ffb0ee') };
  const OUT = col('#04020f'), HAZE = col('#8a3cc8'), HAZE_FAR = col('#c050d8'), HAZE_LOW = col('#4a2aa8'), STREET = col('#5a3cc0'), STREET2 = col('#6a34b8');

  /** Хмарочос у растр R. Повертає нічого; живі точки — у live. */
  function tower(R, b, live, seed) {
    const P = b.pal || FAC.blue, n = P.length, x0 = b.x0, x1 = b.x1, top = b.top, bot = Math.min(R.y1, b.bot || R.y1), w = x1 - x0;
    const r = rng(seed), WIN = b.win || {}, z = b.z || 3000, dz = b.dz || 26;
    // ---- бічна грань (видно ту, що дивиться до центру вікна) ----
    const mid = (x0 + x1) / 2, sx = mid < VP[0] ? x1 : x0, k = (z + D) / (z + dz + D), sw = (VP[0] - sx) * (1 - k), drop = (VP[1] - top) * (1 - k);
    if (Math.abs(sw) > .3) {
      const pts = [[sx, top], [sx + sw, top + drop], [sx + sw, bot], [sx, bot]], SIDE = P.slice(0, Math.max(2, n - 3));
      R.poly(pts, (i, j, X, Y) => { const u = (X - sx) / sw; if (u > .5 && hash2(Math.floor(u * 5), Math.floor(Y / 2.4)) > .7 && ((Y * 4) | 0) % 10 < 6) return LIT[WIN.cols ? WIN.cols[0] : 'warm'][2];
        return SIDE[clamp(Math.round((.55 - u * .35) * (SIDE.length - 1) + B(i, j) * .9), 0, SIDE.length - 1)]; });
    }
    // ---- фасад: тон за рядком (4 кольори дизерингу), вікна — за клітинкою ----
    const wsx = WIN.sx || 2, wsy = WIN.sy || 2.5, ww = WIN.w || 1, wh = WIN.h || .75, lit = WIN.lit == null ? .4 : WIN.lit, cols = (WIN.cols || ['warm', 'pink', 'cyan']).map(c => [LIT[c], c]);
    const mx0 = WIN.mx || Math.max(.75, w * .07), my = WIN.my || 2, ncol = Math.max(0, Math.floor((w - 2 * mx0 + (wsx - ww)) / wsx));
    const mx = ncol && WIN.style !== 'bands' ? (w - (ncol * wsx - (wsx - ww))) / 2 : mx0;   // сітка вікон — по центру фасаду
    const style = WIN.style || 'grid', haze = b.haze || 'mid', BW = 3.2;           // bands: суцільне скління, поділене на клітинки по 3.2 од.
    const floorLit = rI => { const h = hash2(seed * 7 + rI, 99); return h < .16 ? 1.6 : h > .8 ? .25 : 1; };   // поверх: увесь світиться / темний / звичайний
    const cellOf = (X, ci) => style === 'bands' ? Math.floor((X - x0) / BW) : ci;
    const winCol = (cell, rI) => { const h = hash2(cell * 5 + seed, rI); return cols.length < 2 || h < .7 ? cols[0] : cols[1 + Math.floor((h - .7) / .3 * (cols.length - 1)) % (cols.length - 1)]; };   // переважає перший колір
    const i0 = Math.max(0, R.I(x0)), i1 = Math.min(R.W - 1, R.I(x1 - .01)), j0 = Math.max(0, R.J(top)), j1 = Math.min(R.H - 1, R.J(bot - .01));
    if (i1 < i0 || j1 < j0) return;                                                 // повністю поза растром
    const colIdx = new Int16Array(i1 - i0 + 1);                                    // номер віконного стовпчика для кожного стовпчика пікселів (-1 — простінок)
    for (let i = i0; i <= i1; i++) { const X = R.X(i), lx = X - x0 - mx, c = Math.floor(lx / wsx);
      colIdx[i - i0] = style === 'bands' ? (X > x0 + mx && X < x1 - mx ? 0 : -1) : (lx >= 0 && c < ncol && lx - c * wsx < ww) ? c : -1; }
    const rowTab = new Uint32Array(4), rowL = new Uint32Array(4), pil = b.pil || 0, slab = !!b.slab;   // pil — пілястри (крок, од.), slab — світлі кромки перекриттів
    for (let j = j0; j <= j1; j++) {
      const Y = R.Y(j), ly = Y - top - my, rIdx = Math.floor(ly / wsy), inRow = ly >= 0 && ly - rIdx * wsy < wh && Y < bot - 2, sill = inRow && ly - rIdx * wsy > wh - R.U * 1.01, fl = inRow ? floorLit(rIdx) : 0;
      // тон фасаду в рядку: світліше вгорі (небо), темніше вниз; серпанок/світло вулиць — дизерингом
      let q = (b.q == null ? .4 : b.q) + .12 * clamp(1 - (Y - top) / 30, 0, 1) - .12 * clamp((Y - top) / 120, 0, 1);
      let hz = 0, hc = HAZE;
      if (haze === 'far') { hz = clamp((Y - 104) / 46, 0, 1) * .58; hc = HAZE_FAR; if (Y > 152) { hz = .5; hc = HAZE_LOW; } }
      else if (haze === 'mid') { hz = clamp((Y - 150) / 64, 0, 1) * .55; hc = STREET; }
      else if (haze === 'near') { hz = clamp((Y - 210) / 60, 0, 1) * .36; hc = STREET2; }
      const slabRow = slab && ly > 0 && ly - rIdx * wsy > wsy - .55;
      for (let a = 0; a < 4; a++) { const hq = Math.floor(hz * 4 + B(a + 1, j) + .5) / 4; let c = P[clamp(Math.round(q * (n - 1) + B(a, j) * .9), 0, n - 1)], cl = P[clamp(Math.round((q + .16) * (n - 1) + B(a, j) * .9), 0, n - 1)];
        if (hq > 0) { c = mix(c, hc, hq); cl = mix(cl, hc, hq); } rowTab[a] = slabRow ? cl : c; rowL[a] = cl; }
      const row = j * R.W, glassC = mix(rowTab[0], '#3a52c4', .28);
      for (let i = i0; i <= i1; i++) {
        let c = pil && ((R.X(i) - x0 + pil * .5) % pil) < .75 ? rowL[i & 3] : rowTab[i & 3];
        if (inRow && colIdx[i - i0] >= 0) {
          const X = R.X(i), cell = cellOf(X, colIdx[i - i0]);
          if (style === 'bands' && X - x0 - cell * BW > BW - .4) c = rowTab[(i + 1) & 3];    // простінок між панелями скління
          else if (hash2(seed * 131 + cell, rIdx * 17 + 3) < lit * fl) { const pk = winCol(cell, rIdx)[0]; c = sill ? pk[2] : (hash2(cell, rIdx + seed) > .82 ? pk[1] : pk[0]); }
          else c = glassC;
        }
        R.d[row + i] = c;
      }
    }
    // ---- «живі» вікна: темні зараз, засвічуються й гаснуть (cityscape.js) — клітинки одразу за порогом світла ----
    const nRow = Math.floor((bot - 2 - top - my) / wsy), nCell = style === 'bands' ? Math.ceil(w / BW) : ncol, cap = live.win.length + (haze === 'far' ? 0 : b.liveMax || 7);
    for (let rI = 0; rI <= nRow && live.win.length < cap; rI++) { const thr = lit * floorLit(rI), wy = top + my + rI * wsy; if (wy < R.y0 || wy + wh > bot - 2) continue;
      for (let cl = 0; cl < nCell && live.win.length < cap; cl++) { const h = hash2(seed * 131 + cl, rI * 17 + 3); if (h < thr || h > thr + .05) continue;
        const wx = style === 'bands' ? Math.max(x0 + mx, x0 + cl * BW) : x0 + mx + cl * wsx, wr = style === 'bands' ? Math.min(x1 - mx, x0 + (cl + 1) * BW - .4) : wx + ww;
        if (wr - wx < .4) continue; live.win.push({ x: wx, y: wy, w: wr - wx, h: wh - R.U, c: CSS[winCol(cl, rI)[1]], f: .2 + hash2(cl, rI) * .8, ph: hash2(rI, cl) * 6.28 }); } }
    // ---- контур і неоновий кант на ребрах (у кольорі кімнати) ----
    const rim = b.rim || {};
    for (let j = j0; j <= j1; j++) {
      const Y = R.Y(j), f = clamp(1 - (Y - top) / (b.rimLen || 90), 0, 1); if (f <= 0) continue;
      if (rim.l) { R.over(i0, j, rim.l, .85 * f); R.over(i0 + 1, j, rim.l, .35 * f); } else R.over(i0, j, OUT, .6);
      if (rim.r) { R.over(i1, j, rim.r, .85 * f); R.over(i1 - 1, j, rim.r, .35 * f); } else R.over(i1, j, OUT, .6);
    }
    // ---- горизонтальні неонові смуги (поверхи-«пояси») ----
    (b.bands || []).forEach(([y, c]) => { for (let i = i0; i <= i1; i++) { R.d[R.J(y) * R.W + i] = c; R.over(i, R.J(y) + 1, c, .35); R.over(i, R.J(y) - 1, c, .25); } });
    // ---- дах ----
    roof(R, b, live, r);
    // ---- вертикальна неонова вивіска ----
    if (b.sign) { const s = b.sign; signBoard(R, s); live.signs.push(s); }
    // ---- голо-екран (вміст — живий, cityscape.js) ----
    if (b.holo) { const h = b.holo; R.rect(h.x - .5, h.y - .5, h.x + h.w + .5, h.y + h.h + .5, OUT); R.rect(h.x, h.y, h.x + h.w, h.y + h.h, (i, j) => (i + j) & 1 ? col('#071a3a') : col('#0a2450')); live.holo.push(h); }
    if (b.pad) live.pad.push(...b.pad);
  }
  /** Дах: crown (уступи з неоном), spire (шпиль), ant (щогла з вогнем), flat (короби), dome (купол). */
  function roof(R, b, live, r) {
    const P = b.pal || FAC.blue, rf = b.roof || { type: 'flat' }, x0 = b.x0, x1 = b.x1, top = b.top, cx = rf.cx || (x0 + x1) / 2, tone = (q, i, j) => P[clamp(Math.round(q * (P.length - 1) + B(i, j) * .9), 0, P.length - 1)];
    if (rf.type === 'crown') {
      for (let s = 1; s <= (rf.n || 2); s++) { const a = x0 + s * (rf.inset || 3), c = x1 - s * (rf.inset || 3), yb = top - (s - 1) * (rf.h || 3), yt = top - s * (rf.h || 3); if (c - a < 1) break;
        R.rect(a, yt, c, yb, (i, j) => tone(.5 + s * .05, i, j)); const nc = rf.neon || NEON.pink; R.rect(a, yt, c, yt + .25, nc); R.rect(a, yt + .25, c, yt + .5, mix(nc, P[3], .5)); }
    } else if (rf.type === 'spire') {
      const ins = rf.inset || w4(b), h = rf.h || 18, ax = x0 + ins, bx = x1 - ins;
      R.poly([[ax, top + .01], [cx - .4, top - h], [cx + .4, top - h], [bx, top + .01]], (i, j, X, Y) => { const u = (X - ax) / (bx - ax); return u > .55 ? tone(.62, i, j) : tone(.3, i, j); });
      R.rect(cx - .25, top - h - 6, cx + .25, top - h, col('#9aa6d8')); live.lights.push({ x: cx, y: top - h - 6.2, c: 'red', ph: r() * 6 });
      R.poly([[ax, top + .01], [cx - .4, top - h], [cx - .15, top - h], [ax + .5, top + .01]], rf.neon || NEON.cyan);
    } else if (rf.type === 'dome') {
      const rx = (x1 - x0) / 2 - (rf.inset || 2), ry = rf.h || 6;
      R.rect(cx - rx, top - ry, cx + rx, top, (i, j, X, Y) => (((X - cx) / rx) ** 2 + ((Y - top) / ry) ** 2 <= 1 ? tone(.35 + (X > cx ? .2 : 0) + (top - Y) / ry * .15, i, j) : 0));
      R.rect(cx - rx, top - .5, cx + rx, top, rf.neon || NEON.cyan);
    } else {                                                                          // плаский: короби кондиціонерів, бортик
      const nb = rf.boxes == null ? 2 : rf.boxes;
      for (let k = 0; k < nb; k++) { const bw = 2 + r() * 3.5, bh = 1.2 + r() * 2.2, bx = x0 + 1.5 + r() * Math.max(0, x1 - x0 - 3 - bw); R.rect(bx, top - bh, bx + bw, top, (i, j) => tone(.3, i, j)); R.rect(bx, top - bh, bx + bw, top - bh + .25, P[P.length - 2]); }
      R.rect(x0, top - .5, x1, top, (i, j) => tone(.55, i, j));
    }
    if (rf.tank) { const [tx, tw] = rf.tank, th = tw * 1.15, ty = top - 2.2 - th, TK = [col('#0c0e30'), col('#161a46'), col('#22285e'), col('#2e3676')];   // бак для води на ніжках
      R.rect(tx + tw * .15, top - 2.4, tx + tw * .15 + .4, top, col('#0a0a24')); R.rect(tx + tw * .85 - .4, top - 2.4, tx + tw * .85, top, col('#0a0a24')); R.rect(tx + tw * .1, top - 2.5, tx + tw * .9, top - 2.2, col('#1a1a44'));
      R.rect(tx, ty, tx + tw, top - 2.2, (i, j, X, Y) => { const u = (X - tx) / tw, cap = Y - ty < tw * .18 && Math.abs(u - .5) > Math.sqrt(Math.max(0, 1 - ((Y - ty) / (tw * .18) - 1) ** 2)) * .5; if (cap) return 0;
        return TK[clamp(Math.round((u < .25 ? .9 : u < .6 ? .6 : .3) * 3 + B(i, j) * .6), 0, 3)]; });
      for (let y = ty + 2; y < top - 2.6; y += 2.2) R.rect(tx, y, tx + tw, y + .25, col('#080a20')); }
    if (rf.dish) { const [dx, dy] = rf.dish; R.poly([[dx - 2.2, top - dy - 2.6], [dx + 1.2, top - dy - 3.6], [dx + 1.8, top - dy - .4], [dx - 1.6, top - dy + .2]], col('#3a4482')); R.rect(dx - .2, top - dy, dx + .2, top, col('#141838')); R.rect(dx - 1.6, top - dy - 1.6, dx - 1.2, top - dy - 1.2, col('#ff4fd8')); }
    if (rf.ant) { const a = rf.ant; R.rect(a.x - .25, top - (rf.type === 'crown' ? (rf.n || 2) * (rf.h || 3) : 0) - a.h, a.x + .25, top, col('#8a96cc'));
      const ay = top - (rf.type === 'crown' ? (rf.n || 2) * (rf.h || 3) : 0) - a.h; for (let k = 1; k < 3; k++) R.rect(a.x - 1, ay + k * a.h / 3.2, a.x + 1, ay + k * a.h / 3.2 + .25, col('#5a66a0'));
      live.lights.push({ x: a.x, y: ay - .2, c: a.c || 'red', ph: r() * 6 }); }
  }
  const w4 = b => (b.x1 - b.x0) / 4;
  /** Вертикальна вивіска: темна дошка з неоновою рамкою і блоками-«ієрогліфами» (живе підсвічування — cityscape.js). */
  function signBoard(R, s) {
    const c1 = s.c || NEON.pink, c2 = s.c2 || NEON.cyan;
    R.rect(s.x - .5, s.y - .5, s.x + s.w + .5, s.y + s.h + .5, OUT); R.rect(s.x, s.y, s.x + s.w, s.y + s.h, col('#120a2e'));
    R.rect(s.x, s.y, s.x + s.w, s.y + .25, c1); R.rect(s.x, s.y + s.h - .25, s.x + s.w, s.y + s.h, c1); R.rect(s.x, s.y, s.x + .25, s.y + s.h, c1); R.rect(s.x + s.w - .25, s.y, s.x + s.w, s.y + s.h, c1);
    s.cells = []; const cw = s.w - 1.5, ch = cw * 1.1, n = Math.floor((s.h - 1) / (ch + .8));
    for (let k = 0; k < n; k++) { const y = s.y + .9 + k * (ch + .8), x = s.x + .75, rr = rng(k * 7 + (s.seed || 1)); s.cells.push([x, y, cw, ch, k % 2 ? CSSHEX(c2) : CSSHEX(c1)]);
      for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) if (rr() > .38 || (a === 1 && b === 1)) R.rect(x + a * cw / 3, y + b * ch / 3, x + (a + 1) * cw / 3 - .1, y + (b + 1) * ch / 3 - .1, mix(k % 2 ? c2 : c1, '#120a2e', .45)); }
  }
  const CSSHEX = c => '#' + [c & 255, (c >>> 8) & 255, (c >>> 16) & 255].map(v => v.toString(16).padStart(2, '0')).join('');

  /** Далекий план: суцільна смуга силуетів (детерміновано), x0..x1. */
  function farList(x0, x1, seed) {
    const r = rng(seed), out = []; let x = x0 - 4;
    while (x < x1 + 4) { const w = 5 + r() * 11, tall = r() < .12, t = tall ? 94 + r() * 14 : 118 + r() * 34;
      out.push({ x0: x, x1: x + w, top: t, bot: 200, pal: FAC.far, haze: 'far', z: 9000, q: .45 + r() * .4, rimLen: 24, rim: r() < .35 ? { [r() < .5 ? 'l' : 'r']: r() < .6 ? NEON.violet : NEON.cyan } : {},
        win: { sx: 1.5, sy: 2, w: .5, h: .5, lit: .12, cols: ['pink', 'white'], my: 1.5 }, roof: r() < .22 ? { type: 'ant', ant: { x: x + w * (.3 + r() * .4), h: 3 + r() * 7 } } : r() < .15 ? { type: 'spire', h: 5 + r() * 8, inset: w / 3 } : { type: 'flat', boxes: r() < .5 ? 1 : 0 } });
      x += w + (r() < .35 ? 1 + r() * 5 : -r() * 1.4); }                           // місцями — просвіти рожевого неба
    return out;
  }
  /** Нижні квартали між вежами (щоб під сяйвом не було «дір»): низькі блоки з вікнами. */
  function baseList(x0, x1, seed) {
    const r = rng(seed), out = []; let x = x0 - 3;
    while (x < x1 + 3) { const w = 10 + r() * 16; out.push({ x0: x, x1: x + w, top: 178 + r() * 26, bot: 250, pal: r() < .5 ? FAC.violet : FAC.blue, z: 4200, q: .32, haze: 'mid', rimLen: 16, rim: r() < .4 ? { l: NEON.violet } : {},
      win: { sx: 1.8, sy: 2.2, w: .75, h: .5, lit: .22, cols: ['pink', 'cyan'] }, roof: { type: 'flat', boxes: 1 } }); x += w - r() * 2; }
    return out;
  }

  /** Збудувати растр плану: list — хмарочоси (малюються в порядку списку: спершу дальші). */
  function layer(x0, y0, x1, y1, list, seed0, pre) {
    const R = Ras(x0, y0, x1, y1), live = { lights: [], win: [], signs: [], holo: [], pad: [] };
    if (pre) pre(R);
    list.forEach((b, n) => tower(R, b, live, (seed0 || 1) * 1000 + n * 37 + 11));
    return { R, live };
  }

  /** Глибина вулиць під ближнім планом (видно в просвітах між будинками): темна безодня з рожевим і блакитним
   *  світлом вулиць, що піднімається знизу, і дрібні вогні вулиць/вікон нижніх поверхів. */
  function streets(R, y0, seed) {
    const r = rng(seed), G = [[y0, '#2a1a6e'], [y0 + 14, '#3a1e80'], [y0 + 30, '#251660'], [y0 + 60, '#160e44'], [R.y1, '#0a0828']].map(([y, h]) => [y, col(h)]), PINKG = col('#ff4fd8'), CY = col('#3be8ff');
    for (let j = R.J(y0); j < R.H; j++) { const Y = R.Y(j); let s = 0; while (s < G.length - 2 && Y >= G[s + 1][0]) s++; const t2 = clamp((Y - G[s][0]) / (G[s + 1][0] - G[s][0]), 0, 1);
      for (let i = 0; i < R.W; i++) R.d[j * R.W + i] = NX.ckit.fade(G[s][1], G[s + 1][1], t2, i, j, 1.5); }
    for (let n = 0; n < 260; n++) { const X = R.x0 + r() * (R.x1 - R.x0), Y = y0 + 6 + r() * (R.y1 - y0 - 8), c = [PINKG, CY, col('#ffd36a'), col('#b88aff')][Math.floor(r() * 4)]; R.dot(X, Y, c); if (r() < .3) R.dot(X + R.U, Y, c); }
  }
  /** Естакада монорейки (у растр ближнього плану): балка з неоном, опори. */
  function rail(R, y, xs) {
    const top = y, b0 = y + 5;
    xs.forEach(x => { R.rect(x - 2, b0 - .2, x + 2, R.y1, (i, j, X) => { const u = (X - x + 2) / 4; return u < .1 || u > .9 ? OUT : col(u < .3 ? '#3a3a86' : u < .6 ? '#2a2a6c' : '#1c1c50'); });
      R.rect(x - 2.6, b0, x + 2.6, b0 + 1.4, col('#2a2a66')); R.rect(x - 2.6, b0 + 1.4, x + 2.6, b0 + 1.65, NEON.cyan); });
    R.rect(R.x0, top - .25, R.x1, b0 + .25, OUT);
    const ST = [col('#6a6ac8'), col('#4e4ea6'), col('#3c3c8c'), col('#2e2e74'), col('#24245e')];
    R.rect(R.x0, top, R.x1, b0, (i, j, X, Y) => { const v = (Y - top) / (b0 - top); return v < .06 ? NEON.pinkL : v < .13 ? NEON.pink : v > .86 ? (B(i, j) > -.2 ? NEON.cyan : NEON.cyanL) : v > .79 ? col('#0e0e30') : ST[Math.min(4, Math.floor((v - .13) / .66 * 5 + B(i, j) * .7))]; });
    for (let x = R.x0 + 3; x < R.x1; x += 9.5) R.rect(x, top + 1.4, x + .25, b0 - 1, col('#3a3a80'));   // шви сегментів
  }

  return { FAC, LIT, NEON, CSS, layer, tower, farList, baseList, rail, streets, signBoard };
})();
