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
  ];
  // ---------- палітри ----------
  const PAL = { out: '#04120c', d0: '#082218', d1: '#0f3a2a', d2: '#176a44', d3: '#2a9a62', hi: '#5cd08a', stem: '#3a5a2e', stemHi: '#6a8a4a', rimL: '#3be8ff', rimR: '#ff6ad8' };
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
  const SPR = {}, PADU = 18;                                                                                      // запас полотна, щоб крайні лопаті не різалися
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
