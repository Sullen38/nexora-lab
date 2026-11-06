/* ============================================================================
 * objects/planters.js — ЗЕЛЕНЬ ПЕРЕД ВІКНОМ ЗА ДИВАНОМ (Декор стін · 31 → · 34)
 * ----------------------------------------------------------------------------
 * Власник (· 31–· 33): «за диваном перед вікном — вазонів прикольних, щоб читалися; …все одно не подобається — запропонуй краще».
 * Рішення · 34: замість ряду дрібних горщиків — ОДИН довгий неоновий ЖАРДИНЬЄР за диваном (кант видно над спинкою) і кілька
 * «ГЕРОЇВ» — великі рослини з чистим силуетом, намальовані як цілісний піксель-арт (великі форми, 3 тони, темний контур), з
 * КОНТРОВИМ світлом від міста (тіло темне, краї листя — тонкий бірюзово-рожевий рім). Кожен герой — свій і новий вид.
 * Спрайт героя: малюється контурними фігурами на полотні 2 px/од., потім піксельний прохід: альфа в поріг, кольори — до палітри
 * (без напівтонів), рім на краях з боку світла (зліва — бірюза, справа — рожевий). Жардиньєр — прямокутниками в одиницях кімнати.
 * Малюється drawBack після стін / вікна (перед рамами), диван і персонажі — поверх. Тап по листю — картка довідника (група 'floor').
 * ========================================================================== */
(() => {
  const C = NX.cfg, FY = C.FLOOR_Y, hash = NX.art.hash, TAU = Math.PI * 2;
  const JAR = { x0: 662, x1: 892, y: FY + 4, h: 86, d: 10 };                                                          // високий короб: кант на y≈282 — над спинкою дивана (≈288)                                                          // жардиньєр: x, низ (підлога), висота, «глибина» верху
  // герої: x — центр на верхній кромці жардиньєра; w, h — од.; kind — вид (довідник floor.*)
  const HEROES = [
    { kind: 'philodendron', x: 714, w: 110, h: 96, seed: 3 },
    { kind: 'strelitzia', x: 836, w: 64, h: 116, seed: 5 },                                                               // задня, висока
    { kind: 'areca', x: 792, w: 92, h: 98, seed: 7 },
    { kind: 'cereus', x: 880, w: 24, h: 84, seed: 9 },                                                                    // передній, вузький
  ];
  // ---------- палітри ----------
  const PAL = { out: '#04120c', d0: '#082218', d1: '#0f3a2a', d2: '#176a44', d3: '#2a9a62', hi: '#5cd08a', stem: '#3a5a2e', stemHi: '#6a8a4a', rimL: '#3be8ff', rimR: '#ff6ad8', bark: '#4a3a2a', barkHi: '#7a6040', spine: '#e8e0a0', white: '#e8f0ff', blue: '#4a6ae0' };
  const HEX = Object.values(PAL).map(h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]);
  // ---------- малювання героїв (полотно 2 px/од.) ----------
  const DRAW = {
    /** Філодендрон Селло: товсте стебло-«стовбурець», 7 великих перисто-розсічених листків: кожен — середня жилка й по 6 округлих
     *  лопатей з боків (глибокі розрізи між ними), задні листки темні, передні — світліші з бліками на верхніх лопатях. */
    philodendron(c, W, H, seed) {
      const cx = W / 2, by = H - 2;
      c.lineCap = 'round'; c.lineJoin = 'round';
      c.fillStyle = PAL.out; c.beginPath(); c.ellipse(cx, by - 4, 9, 6, 0, 0, TAU); c.fill(); c.fillStyle = PAL.stem; c.beginPath(); c.ellipse(cx, by - 4, 7, 4.5, 0, 0, TAU); c.fill();   // основа
      const leaves = [];
      for (let q = 0; q < 7; q++) { const u = (q + .5) / 7, a = (u - .5) * 2.9 + (hash(seed, q) - .5) * .25, back = q % 2 === 0, st = (back ? .5 : .42) * H * (.85 + .3 * hash(seed, q + 3)), len = H * (back ? .5 : .44); leaves.push({ a, st, len, back, q }); }
      leaves.sort((p, q) => (q.back - p.back) || (Math.abs(q.a) - Math.abs(p.a)));                                      // задні спершу, крайні спершу
      for (const L of leaves) {
        const { a, st, len, back, q } = L, sx = cx, sy = by - 5, ex = cx + Math.sin(a) * st, ey = sy - Math.cos(a) * st;
        c.strokeStyle = PAL.out; c.lineWidth = 5; c.beginPath(); c.moveTo(sx, sy); c.quadraticCurveTo(sx + Math.sin(a) * st * .5, sy - Math.cos(a) * st * .3, ex, ey); c.stroke();   // черешок
        c.strokeStyle = back ? PAL.stem : PAL.stemHi; c.lineWidth = 2.6; c.stroke();
        const la = a * .72, dx = Math.sin(la), dy = -Math.cos(la), nx = Math.cos(la), ny = Math.sin(la), fill = back ? PAL.d1 : PAL.d2, hi = back ? PAL.d2 : PAL.d3;
        const lobes = [];
        for (let k = 0; k < 7; k++) { const t = (k + .6) / 7.6, px = ex + dx * len * t, py = ey + dy * len * t, ll = len * (.26 + .14 * Math.sin(t * Math.PI)) * (k === 6 ? .6 : 1), lw = len * (.036 + .014 * Math.sin(t * Math.PI));   // лопать: довжина, товщина
          for (const sd of (k === 6 ? [0] : [-1, 1])) { const ang = la + sd * (1.05 - t * .45), mx = px + Math.sin(ang) * ll * .5, my = py - Math.cos(ang) * ll * .5; lobes.push({ mx, my, ll, lw, ang, sd, t }); } }
        c.fillStyle = PAL.out; for (const o of lobes) { c.beginPath(); c.ellipse(o.mx, o.my, o.lw + 1.6, o.ll * .5 + 1.6, o.ang, 0, TAU); c.fill(); }                     // контур
        c.strokeStyle = PAL.out; c.lineWidth = 5.5; c.beginPath(); c.moveTo(ex, ey); c.lineTo(ex + dx * len, ey + dy * len); c.stroke();
        for (const o of lobes) { c.fillStyle = fill; c.beginPath(); c.ellipse(o.mx, o.my, o.lw, o.ll * .5, o.ang, 0, TAU); c.fill();                                          // лопать
          c.fillStyle = hi; c.beginPath(); c.ellipse(o.mx - Math.cos(o.ang) * o.lw * .4, o.my - Math.sin(o.ang) * o.lw * .4, o.lw * .45, o.ll * .38, o.ang, 0, TAU); c.fill(); }   // світліша верхня половина лопаті
        c.strokeStyle = back ? PAL.d0 : PAL.d1; c.lineWidth = 2.4; c.beginPath(); c.moveTo(ex, ey); c.lineTo(ex + dx * len * .97, ey + dy * len * .97); c.stroke();          // середня жилка
        if (!back) { c.strokeStyle = PAL.hi; c.lineWidth = 1; c.beginPath(); c.moveTo(ex + nx * 1.2, ey + ny * 1.2); c.lineTo(ex + dx * len * .9 + nx * 1.2, ey + dy * len * .9 + ny * 1.2); c.stroke(); }
      }
    },
    /** Арека: 9 дуг-вай з пучка, кожна — тонкий рахіс і по 14 пар вузьких листочків, що звисають; передні світліші. */
    areca(c, W, H, seed) {
      const cx = W / 2, by = H - 2; c.lineCap = 'round'; c.lineJoin = 'round';
      c.fillStyle = PAL.out; c.beginPath(); c.ellipse(cx, by - 3, 10, 5, 0, 0, TAU); c.fill(); c.fillStyle = PAL.barkHi; c.beginPath(); c.ellipse(cx, by - 3, 8, 3.5, 0, 0, TAU); c.fill();
      const fr = []; for (let q = 0; q < 9; q++) { const u = (q + .5) / 9, a = (u - .5) * 3.1 + (hash(seed, q) - .5) * .2, back = q % 2 === 1; fr.push({ a, back, len: H * (back ? .9 : .78) * (.85 + .25 * hash(seed, q + 5)), q }); }
      fr.sort((p, q) => (q.back - p.back) || (Math.abs(q.a) - Math.abs(p.a)));
      for (const F of fr) { const { a, back, len } = F, sx = cx, sy = by - 4, pts = []; for (let i = 0; i <= 16; i++) { const t = i / 16, bend = t * t * .9 * Math.sign(a || 1) * (Math.abs(a) * .5 + .3); pts.push([sx + Math.sin(a + bend) * len * t, sy - Math.cos(a + bend) * len * t]); }
        const fill = back ? PAL.d1 : PAL.d2, hi = back ? PAL.d2 : PAL.d3;
        for (const pass of [0, 1]) for (let i = 2; i < 16; i++) { const [x, y] = pts[i], [x1, y1] = pts[i + 1], da = Math.atan2(y1 - y, x1 - x), t = i / 16, ll = len * (.22 + .1 * Math.sin(t * Math.PI)) * (i > 14 ? .6 : 1), lw = 1.9;
          for (const sd of [-1, 1]) { const ang = da + sd * (1.15 - t * .25) + .35, ex = x + Math.cos(ang) * ll, ey = y + Math.sin(ang) * ll;
            if (pass === 0) { c.strokeStyle = PAL.out; c.lineWidth = lw + 3; } else { c.strokeStyle = (sd < 0 && !back) ? hi : fill; c.lineWidth = lw; }
            c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo((x + ex) / 2, (y + ey) / 2 + 2.5, ex, ey + 1.5); c.stroke(); } }
        c.strokeStyle = PAL.out; c.lineWidth = 4.2; c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (const q of pts) c.lineTo(q[0], q[1]); c.stroke();
        c.strokeStyle = back ? PAL.stem : PAL.stemHi; c.lineWidth = 1.8; c.stroke(); }
    },
    /** Стреліція Ніколая: 2 віяла з 5 довгих черешків, на кожному — широкий бананоподібний листок із надірваними краями; біла квітка-«птах» зверху. */
    strelitzia(c, W, H, seed) {
      const cx = W / 2, by = H - 2; c.lineCap = 'round'; c.lineJoin = 'round';
      c.fillStyle = PAL.out; c.fillRect(cx - 9, by - 12, 18, 12); c.fillStyle = PAL.bark; c.fillRect(cx - 7, by - 11, 14, 10); c.fillStyle = PAL.barkHi; for (let y = by - 10; y < by - 1; y += 3) c.fillRect(cx - 6, y, 5, 1);   // стовбурець
      const ls = []; for (let q = 0; q < 7; q++) { const u = (q + .5) / 7, a = (u - .5) * 1.5 + (hash(seed, q) - .5) * .15, back = q % 2 === 0; ls.push({ a, back, st: H * (back ? .5 : .42) * (.85 + .3 * hash(seed, q + 2)), len: H * (back ? .5 : .46), q }); }
      ls.sort((p, q) => (q.back - p.back) || (Math.abs(q.a) - Math.abs(p.a)));
      for (const L of ls) { const { a, back, st, len, q } = L, sx = cx, sy = by - 10, ex = sx + Math.sin(a) * st, ey = sy - Math.cos(a) * st, la = a * .55, dx = Math.sin(la), dy = -Math.cos(la), nx = Math.cos(la), ny = Math.sin(la), wd = len * .22;
        c.strokeStyle = PAL.out; c.lineWidth = 5; c.beginPath(); c.moveTo(sx, sy); c.lineTo(ex, ey); c.stroke(); c.strokeStyle = back ? PAL.stem : PAL.stemHi; c.lineWidth = 2.6; c.stroke();
        const edge = (sd, pass) => { c.beginPath(); c.moveTo(ex, ey); for (let i = 1; i <= 10; i++) { const t = i / 10, w = wd * Math.sin(Math.min(1, t * 1.25) * Math.PI * .5) * (1 - t * t * .5), tear = (i === 4 || i === 7) && hash(seed, q * 3 + sd + i) > .35 ? .45 : 1; c.lineTo(ex + dx * len * t + nx * sd * w * tear, ey + dy * len * t + ny * sd * w * tear); } c.lineTo(ex + dx * len, ey + dy * len); for (let i = 10; i >= 1; i--) { const t = i / 10; c.lineTo(ex + dx * len * t, ey + dy * len * t); } c.closePath(); if (pass === 0) { c.strokeStyle = PAL.out; c.lineWidth = 3; c.stroke(); } c.fillStyle = pass === 0 ? PAL.out : (back ? PAL.d1 : (sd < 0 ? PAL.d3 : PAL.d2)); c.fill(); };
        for (const pass of [0, 1]) for (const sd of [-1, 1]) edge(sd, pass);
        c.strokeStyle = back ? PAL.d0 : PAL.d1; c.lineWidth = 2; c.beginPath(); c.moveTo(ex, ey); c.lineTo(ex + dx * len * .96, ey + dy * len * .96); c.stroke();
        if (!back) { c.strokeStyle = PAL.hi; c.lineWidth = .9; for (let i = 2; i < 9; i += 2) { const t = i / 10, x = ex + dx * len * t, y = ey + dy * len * t; c.beginPath(); c.moveTo(x, y); c.lineTo(x - nx * wd * .6, y - ny * wd * .6 + 2); c.stroke(); } } }
      const fx = cx + 14, fy = by - H * .72; c.strokeStyle = PAL.out; c.lineWidth = 4.5; c.beginPath(); c.moveTo(cx + 2, by - 10); c.lineTo(fx, fy + 10); c.stroke(); c.strokeStyle = PAL.stemHi; c.lineWidth = 2; c.stroke();   // квітконіс
      c.fillStyle = PAL.out; c.beginPath(); c.moveTo(fx - 4, fy + 12); c.lineTo(fx + 12, fy + 6); c.lineTo(fx + 10, fy + 1); c.lineTo(fx - 3, fy + 5); c.closePath(); c.fill();                                              // човник
      c.fillStyle = PAL.blue; c.beginPath(); c.moveTo(fx - 2, fy + 10); c.lineTo(fx + 10, fy + 5); c.lineTo(fx + 8, fy + 2); c.lineTo(fx - 1, fy + 6); c.closePath(); c.fill();
      c.strokeStyle = PAL.out; c.lineWidth = 3.2; for (const [ang, l] of [[-1.2, 11], [-.95, 13], [-.7, 10]]) { c.beginPath(); c.moveTo(fx, fy + 6); c.lineTo(fx + Math.cos(ang) * l, fy + 6 + Math.sin(ang) * l); c.stroke(); }
      c.strokeStyle = PAL.white; c.lineWidth = 1.6; for (const [ang, l] of [[-1.2, 11], [-.95, 13], [-.7, 10]]) { c.beginPath(); c.moveTo(fx, fy + 6); c.lineTo(fx + Math.cos(ang) * l, fy + 6 + Math.sin(ang) * l); c.stroke(); }   // білі пелюстки
    },
    /** Цереус: ребристий стовп з двома бічними пагонами, ребра — світлі смуги, ареоли з колючками-крапками. */
    cereus(c, W, H, seed) {
      const cx = W / 2, by = H - 2, col = (x, y0, w, h, r) => { c.fillStyle = PAL.out; c.beginPath(); c.roundRect(x - w / 2 - 1.5, y0 - 1.5, w + 3, h + 3, r + 1.5); c.fill();
        c.fillStyle = PAL.d1; c.beginPath(); c.roundRect(x - w / 2, y0, w, h, r); c.fill(); const rb = 4, rw = w / rb;
        for (let i = 0; i < rb; i++) { c.fillStyle = i % 2 ? PAL.d2 : PAL.d1; c.fillRect(x - w / 2 + i * rw, y0 + 1, rw, h - 1); if (i === 1) { c.fillStyle = PAL.d3; c.fillRect(x - w / 2 + i * rw + .4, y0 + 1.5, rw * .45, h - 3); } }
        for (let i = 0; i < rb; i++) for (let y = y0 + 3; y < y0 + h - 2; y += 5) { c.fillStyle = PAL.spine; c.fillRect(x - w / 2 + i * rw + rw * .5 - .6, y + hash(seed, y + i) * 1.5, 1.2, .8); } };
      col(cx - 5, by - H * .55, 7, H * .55, 3.5); col(cx + 5, by - H * .68, 7, H * .68, 3.5); col(cx, by - H + 2, 9, H - 2, 4.5);
      c.fillStyle = PAL.out; c.fillRect(cx - 6, by - 4, 12, 4); c.fillStyle = PAL.bark; c.fillRect(cx - 5, by - 3, 10, 2);
    },
  };
  // ---------- піксельний прохід: поріг альфи, палітра, рім з боку світла ----------
  function pixelize(cv) {
    const w = cv.width, h = cv.height, c = cv.getContext('2d'), im = c.getImageData(0, 0, w, h), d = im.data, n = w * h, op = new Uint8Array(n);
    for (let i = 0; i < n; i++) { const q = i * 4; if (d[q + 3] < 110) { d[q + 3] = 0; continue; } d[q + 3] = 255; op[i] = 1;
      let best = 0, bd = 1e9; for (let k = 0; k < HEX.length; k++) { const P = HEX[k], dd = (d[q] - P[0]) ** 2 + (d[q + 1] - P[1]) ** 2 + (d[q + 2] - P[2]) ** 2; if (dd < bd) { bd = dd; best = k; } }
      d[q] = HEX[best][0]; d[q + 1] = HEX[best][1]; d[q + 2] = HEX[best][2]; }
    const RL = HEX[Object.keys(PAL).indexOf('rimL')], RR = HEX[Object.keys(PAL).indexOf('rimR')], OUTI = HEX[0];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * w + x; if (!op[i]) continue; const q = i * 4;
      const isOut = d[q] === OUTI[0] && d[q + 1] === OUTI[1] && d[q + 2] === OUTI[2]; if (!isOut) continue;                                   // рім — лише на контурних пікселях
      const upL = (y > 0 && x > 0 && !op[i - w - 1]) || (y > 0 && !op[i - w]) || (x > 0 && !op[i - 1]), upR = (y > 0 && x < w - 1 && !op[i - w + 1]) || (y > 0 && !op[i - w]) || (x < w - 1 && !op[i + 1]);
      if (upL && hash(x, y) < .85) { d[q] = RL[0]; d[q + 1] = RL[1]; d[q + 2] = RL[2]; } else if (upR && hash(x, y + 7) < .7) { d[q] = RR[0]; d[q + 1] = RR[1]; d[q + 2] = RR[2]; } }
    c.putImageData(im, 0, 0); return cv;
  }
  const SPR = {}, PADU = 24;                                                                                      // запас полотна, щоб крайні лопаті не різалися
  function spriteOf(p) {
    if (SPR[p.kind]) return SPR[p.kind]; const S = 2, P = PADU, cv = document.createElement('canvas'); cv.width = (p.w + 2 * P) * S; cv.height = (p.h + P) * S; const c = cv.getContext('2d'); c.scale(S, S); c.translate(P, P); DRAW[p.kind](c, p.w, p.h, p.seed);
    return SPR[p.kind] = pixelize(cv);
  }
  const px = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
  /** Жардиньєр: довгий кібер-короб; видно верх (кант з неоном, ґрунт) над спинкою дивана. */
  function drawJar(c, t, LK) {
    const { x0, x1, y, h, d } = JAR, top = y - h, w = x1 - x0;
    c.save(); c.globalAlpha = .35; c.fillStyle = '#000'; c.fillRect(x0 - 3, y - 1, w + 6, 3); c.restore();
    px(c, x0, top, w, h, '#10142e'); px(c, x0 + 1, top + d, w - 2, h - d, '#171c3e');                                                      // корпус
    for (let x = x0 + 6; x < x1 - 6; x += 12) px(c, x, top + d + 6, 7, 1, '#2a3468');                                                        // щілини вентиляції
    px(c, x0, top, w, d, '#1e2650'); px(c, x0 + 2, top + 1.5, w - 4, d - 3, '#0a0c1c'); px(c, x0 + 2, top + 1.5, w - 4, 1.2, '#2a1a10');      // верх: рамка, ґрунт
    for (let x = x0 + 3; x < x1 - 3; x += 2.3) if (hash(x, 1) > .55) px(c, x, top + 2.5 + hash(x, 2) * (d - 5), 1.2, .8, hash(x, 3) > .5 ? '#3a2a18' : '#1c1410');   // грудки ґрунту
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = .85 * Math.min(1.3, LK); px(c, x0, top, w, .9, '#3be8ff'); px(c, x0, top + d - .8, w, .6, '#3be8ff');
    c.globalAlpha = .18 * LK; const g = c.createLinearGradient(0, top - 6, 0, top); g.addColorStop(0, 'rgba(59,232,255,0)'); g.addColorStop(1, 'rgba(59,232,255,1)'); c.fillStyle = g; c.fillRect(x0, top - 6, w, 6); c.restore();   // неон і його відсвіт
    for (let k = 0; k < 3; k++) { const on = Math.floor(t * 1.5 + k) % 3 === 0; c.save(); c.globalAlpha = on ? .95 : .3; px(c, x1 - 12 + k * 3, top + d + 2, 1.6, 1.2, on ? '#3bff8a' : '#1a6a3a'); c.restore(); }   // індикатори
  }
  let hit = null;
  NX.planters = {
    JAR, HEROES, PL: HEROES,
    tap(x, y) { let best = null; for (const p of HEROES) { const top = JAR.y - JAR.h + 2; if (x >= p.x - p.w / 2 && x <= p.x + p.w / 2 && y >= top - p.h && y <= top) { const d = Math.abs(x - p.x) / (p.w / 2); if (!best || d < best.d) best = { p, d }; } }
      if (!best) return false; hit = best.p.kind; best.p.flash = NX.time; return true; },
    get lastKind() { return hit; },
    sprite: spriteOf,
  };
  NX.addObject({
    id: 'planters', span: [600, 950],
    drawBack(c, t) {
      const LK = NX.decorLight ? NX.decorLight.k(t) : 1, vx0 = NX.cam.x - 80, vx1 = NX.cam.x + NX.cam.viewW + 80; if (JAR.x1 < vx0 || JAR.x0 > vx1) return;
      drawJar(c, t, LK);
      for (const p of HEROES) { if (p.x + p.w / 2 < vx0 || p.x - p.w / 2 > vx1) continue; const cv = spriteOf(p), top = JAR.y - JAR.h + 2, sway = Math.sin(t * .8 + p.seed) * .5;
        c.save(); c.imageSmoothingEnabled = false; c.translate(p.x + sway, top); c.drawImage(cv, -p.w / 2 - PADU, -p.h - PADU, p.w + 2 * PADU, p.h + PADU);
        if (p.flash != null && t - p.flash < .8) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = (1 - (t - p.flash) / .8) * .3; c.fillStyle = '#fff'; c.fillRect(-p.w / 2 - PADU, -p.h - PADU, p.w + 2 * PADU, p.h + PADU); } c.restore(); }
    },
  });
})();
