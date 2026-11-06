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
    { kind: 'yucca', x: 760, w: 60, h: 104, seed: 11, back: 1 },                                                         // задній шар: синюватий серпанок
    { kind: 'strelitzia', x: 836, w: 64, h: 116, seed: 5, back: 1 },
    { kind: 'philodendron', x: 722, w: 96, h: 92, seed: 3 },
    { kind: 'areca', x: 796, w: 84, h: 94, seed: 7 },
    { kind: 'cereus', x: 880, w: 24, h: 84, seed: 9 },
    { kind: 'asplenium', x: 756, w: 54, h: 38, seed: 13 },                                                               // низький передній
    // (· 37) квітучі малята спереду: кожен — свій вид і свій колір
    { kind: 'saintpaulia', x: 684, w: 30, h: 22, seed: 21 },
    { kind: 'kalanchoe', x: 720, w: 28, h: 26, seed: 22 },
    { kind: 'anthurium', x: 792, w: 34, h: 34, seed: 23 },
    { kind: 'viola', x: 826, w: 30, h: 22, seed: 24 },
    { kind: 'primula', x: 862, w: 30, h: 26, seed: 25 },
  ];
  // ---------- палітри ----------
  const PAL = { out: '#04120c', d0: '#082218', d1: '#0f3a2a', d2: '#176a44', d3: '#2a9a62', hi: '#5cd08a', stem: '#3a5a2e', stemHi: '#6a8a4a', rimL: '#3be8ff', rimR: '#ff6ad8', bark: '#4a3a2a', barkHi: '#7a6040', spine: '#e8e0a0', white: '#e8f0ff', blue: '#4a6ae0', purple: '#7a3ac8', lilac: '#b88aff', yellow: '#ffd84a', orange: '#ff7a30', red: '#e8304a', pink: '#ff8ad0', cream: '#fff0c0' };
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
    /** Юка: грубий стовбур із рубцями й 2 голови — віяла з 22 гострих мечоподібних листків (задні темні, передні світлі зі смугою). */
    yucca(c, W, H, seed) {
      const cx = W / 2, by = H - 2; c.lineCap = 'round'; c.lineJoin = 'round';
      c.fillStyle = PAL.out; c.fillRect(cx - 7, by - H * .5 - 2, 14, H * .5 + 2); c.fillStyle = PAL.bark; c.fillRect(cx - 5.5, by - H * .5, 11, H * .5); c.fillStyle = PAL.barkHi; for (let y = by - H * .48; y < by - 4; y += 5) c.fillRect(cx - 5.5 + (y % 10 < 5 ? 0 : 3), y, 4, 1.2);
      for (const [hx, hy, R, n] of [[cx - 6, by - H * .5, H * .4, 22], [cx + 7, by - H * .62, H * .38, 20]]) { const bl = []; for (let i = 0; i < n; i++) { const a = (i / (n - 1) - .5) * 3.4 + (hash(seed, i + hx) - .5) * .12; bl.push({ a, len: R * (.72 + .28 * hash(seed, i * 7 + hx)), back: Math.abs(a) > 1.1 || i % 3 === 1 }); }
        bl.sort((p, q) => (q.back - p.back) || (Math.abs(q.a) - Math.abs(p.a)));
        for (const pass of [0, 1]) for (const B of bl) { const ex = hx + Math.sin(B.a) * B.len, ey = hy - Math.cos(B.a) * B.len, w = 4.2; c.beginPath(); c.moveTo(hx - Math.cos(B.a) * w / 2, hy - Math.sin(B.a) * w / 2); c.lineTo(ex, ey); c.lineTo(hx + Math.cos(B.a) * w / 2, hy + Math.sin(B.a) * w / 2); c.closePath();
          if (pass === 0) { c.strokeStyle = PAL.out; c.lineWidth = 2.4; c.stroke(); c.fillStyle = PAL.out; c.fill(); } else { c.fillStyle = B.back ? PAL.d1 : PAL.d2; c.fill(); if (!B.back) { c.strokeStyle = PAL.d3; c.lineWidth = 1; c.beginPath(); c.moveTo(hx + Math.sin(B.a) * 4 - Math.cos(B.a) * .8, hy - Math.cos(B.a) * 4 - Math.sin(B.a) * .8); c.lineTo(ex - Math.cos(B.a) * .6, ey - Math.sin(B.a) * .6); c.stroke(); } } } }
    },
    /** Аспленіум (гніздовий папороть): низька розетка з 11 широких хвилястих листків із темною жилкою. */
    asplenium(c, W, H, seed) {
      const cx = W / 2, by = H - 2; c.lineCap = 'round'; c.lineJoin = 'round';
      const ls = []; for (let i = 0; i < 11; i++) { const a = (i / 10 - .5) * 3 + (hash(seed, i) - .5) * .2; ls.push({ a, len: H * (.75 + .25 * hash(seed, i + 4)) * (1 - Math.abs(a) * .12), back: i % 2 === 0 }); }
      ls.sort((p, q) => (q.back - p.back) || (Math.abs(q.a) - Math.abs(p.a)));
      for (const pass of [0, 1]) for (const L of ls) { const dx = Math.sin(L.a), dy = -Math.cos(L.a), nx = Math.cos(L.a), ny = Math.sin(L.a), wd = L.len * .2; c.beginPath(); c.moveTo(cx, by - 3);
        for (const sd of [-1, 1]) { const pts = []; for (let i = 1; i <= 8; i++) { const t = i / 8, w = wd * Math.sin(t * Math.PI * .9) * (1 + .18 * Math.sin(t * 14 + seed)); pts.push([cx + dx * L.len * t + nx * sd * w, by - 3 + dy * L.len * t + ny * sd * w]); } if (sd < 0) for (const q of pts) c.lineTo(q[0], q[1]); else for (const q of pts.reverse()) c.lineTo(q[0], q[1]); }
        c.closePath(); if (pass === 0) { c.strokeStyle = PAL.out; c.lineWidth = 3; c.stroke(); c.fillStyle = PAL.out; c.fill(); } else { c.fillStyle = L.back ? PAL.d2 : PAL.d3; c.fill(); c.strokeStyle = L.back ? PAL.d0 : PAL.d1; c.lineWidth = 1.6; c.beginPath(); c.moveTo(cx, by - 3); c.lineTo(cx + dx * L.len * .92, by - 3 + dy * L.len * .92); c.stroke(); if (!L.back) { c.strokeStyle = PAL.hi; c.lineWidth = .8; c.beginPath(); c.moveTo(cx + dx * L.len * .3 + nx * 1.5, by - 3 + dy * L.len * .3 + ny * 1.5); c.lineTo(cx + dx * L.len * .85 + nx * 1.5, by - 3 + dy * L.len * .85 + ny * 1.5); c.stroke(); } } }
    },
    /** Сенполія (фіалка): розетка округлих оксамитових листків, зверху 5 фіолетових п'ятипелюсткових квіток із жовтим вічком. */
    saintpaulia(c, W, H, seed) {
      const cx = W / 2, by = H - 2; c.lineJoin = 'round';
      for (const pass of [0, 1]) for (let i = 0; i < 9; i++) { const a = (i / 8 - .5) * 3.3, r = H * .55, lx = cx + Math.sin(a) * r * .75, ly = by - 4 - Math.cos(a) * r * .35, R = H * .22; c.fillStyle = pass ? (i % 2 ? PAL.d2 : PAL.d1) : PAL.out; c.beginPath(); c.ellipse(lx, ly, R + (pass ? 0 : 1.6), R * .8 + (pass ? 0 : 1.6), a * .3, 0, TAU); c.fill(); if (pass) { c.fillStyle = PAL.d3; c.beginPath(); c.ellipse(lx - 1, ly - 1.2, R * .45, R * .3, a * .3, 0, TAU); c.fill(); } }
      for (let f = 0; f < 5; f++) { const fx = cx + (f - 2) * 5.5 + (hash(seed, f) - .5) * 2, fy = by - H * .68 - (f % 2) * 3; for (const pass of [0, 1]) for (let k = 0; k < 5; k++) { const a = k / 5 * TAU + f; c.fillStyle = pass ? PAL.purple : PAL.out; c.beginPath(); c.ellipse(fx + Math.cos(a) * 2.2, fy + Math.sin(a) * 2.2, 2 + (pass ? 0 : 1.2), 1.4 + (pass ? 0 : 1.2), a, 0, TAU); c.fill(); }
        c.fillStyle = PAL.lilac; c.beginPath(); c.arc(fx - 1.4, fy - 1.4, 1.5, 0, TAU); c.fill(); c.fillStyle = PAL.yellow; c.beginPath(); c.arc(fx, fy, 1.2, 0, TAU); c.fill(); }
    },
    /** Каланхое: м'ясисті зубчасті листки, над ними щільні китиці дрібних помаранчево-червоних квіток. */
    kalanchoe(c, W, H, seed) {
      const cx = W / 2, by = H - 2; c.lineJoin = 'round';
      for (const pass of [0, 1]) for (let i = 0; i < 7; i++) { const a = (i / 6 - .5) * 2.8, r = H * .5, lx = cx + Math.sin(a) * r * .7, ly = by - 3 - Math.cos(a) * r * .4; c.fillStyle = pass ? (i % 2 ? PAL.d3 : PAL.d2) : PAL.out; c.beginPath(); const R = H * .2 + (pass ? 0 : 1.6); for (let k = 0; k <= 12; k++) { const t = k / 12 * TAU, rr = R * (1 + .12 * Math.cos(t * 6)); c.lineTo(lx + Math.cos(t) * rr, ly + Math.sin(t) * rr * .75); } c.closePath(); c.fill(); }
      for (let s2 = 0; s2 < 3; s2++) { const sx = cx + (s2 - 1) * 8, sy = by - H * .55; c.strokeStyle = PAL.out; c.lineWidth = 3; c.beginPath(); c.moveTo(sx, sy + 6); c.lineTo(sx, sy - 4); c.stroke(); c.strokeStyle = PAL.stemHi; c.lineWidth = 1.2; c.stroke();
        for (const pass of [0, 1]) for (let k = 0; k < 7; k++) { const a = hash(seed, s2 * 9 + k) * TAU, r = 2 + hash(seed, k + s2) * 3, fx = sx + Math.cos(a) * r, fy = sy - 5 + Math.sin(a) * r * .7; c.fillStyle = pass ? (k % 3 ? PAL.orange : PAL.red) : PAL.out; c.beginPath(); c.arc(fx, fy, 1.6 + (pass ? 0 : 1.1), 0, TAU); c.fill(); if (pass) { c.fillStyle = PAL.yellow; c.fillRect(fx - .5, fy - .5, 1, 1); } } }
    },
    /** Антуріум: глянцеві серцеподібні листки на черешках і 2 червоні «покривала» з жовтими початками — найграфічніший. */
    anthurium(c, W, H, seed) {
      const cx = W / 2, by = H - 2; c.lineCap = 'round'; c.lineJoin = 'round';
      const heart = (x, y, R, ang, fill, hi) => { for (const pass of [0, 1]) { c.save(); c.translate(x, y); c.rotate(ang); c.fillStyle = pass ? fill : PAL.out; const e = pass ? 0 : 1.5; c.beginPath(); c.moveTo(0, R + e); c.bezierCurveTo(-R * 1.1 - e, R * .3, -R * 1.1 - e, -R * .8 - e, 0, -R * .35); c.bezierCurveTo(R * 1.1 + e, -R * .8 - e, R * 1.1 + e, R * .3, 0, R + e); c.fill();
        if (pass && hi) { c.fillStyle = hi; c.beginPath(); c.ellipse(-R * .35, -R * .1, R * .3, R * .45, .4, 0, TAU); c.fill(); } c.restore(); } };
      for (const [a, r, back] of [[-1.1, .5, 1], [1.0, .5, 1], [-.45, .62, 0], [.5, .6, 0], [0, .42, 0]]) { const lx = cx + Math.sin(a) * H * r * .8, ly = by - 4 - Math.cos(a) * H * r * .6; c.strokeStyle = PAL.out; c.lineWidth = 3.2; c.beginPath(); c.moveTo(cx, by - 3); c.lineTo(lx, ly); c.stroke(); c.strokeStyle = PAL.stem; c.lineWidth = 1.4; c.stroke(); heart(lx, ly - 3, H * .17, a * .5 + Math.PI, back ? PAL.d1 : PAL.d2, back ? null : PAL.d3); }
      for (const [a, r] of [[-.7, .95], [.6, 1.0]]) { const fx = cx + Math.sin(a) * H * r * .45, fy = by - 4 - Math.cos(a) * H * r * .75; c.strokeStyle = PAL.out; c.lineWidth = 3.2; c.beginPath(); c.moveTo(cx, by - 3); c.lineTo(fx, fy + 2); c.stroke(); c.strokeStyle = PAL.stemHi; c.lineWidth = 1.4; c.stroke(); heart(fx, fy - 2, H * .14, a * .4 + Math.PI, PAL.red, PAL.pink);
        c.strokeStyle = PAL.out; c.lineWidth = 3.6; c.beginPath(); c.moveTo(fx, fy - 2); c.lineTo(fx + Math.sin(a * .4) * 7, fy - 2 - Math.cos(a * .4) * 7); c.stroke(); c.strokeStyle = PAL.yellow; c.lineWidth = 1.8; c.stroke(); }
    },
    /** Віола (братки): дрібні листочки й 4 великі «личка» — фіолетові верхні пелюстки, жовта нижня з темним вічком. */
    viola(c, W, H, seed) {
      const cx = W / 2, by = H - 2;
      for (const pass of [0, 1]) for (let i = 0; i < 8; i++) { const a = (i / 7 - .5) * 3, lx = cx + Math.sin(a) * W * .4, ly = by - 3 - Math.cos(a) * H * .25; c.fillStyle = pass ? (i % 2 ? PAL.d2 : PAL.d1) : PAL.out; c.beginPath(); c.ellipse(lx, ly, 2.6 + (pass ? 0 : 1.3), 3.4 + (pass ? 0 : 1.3), a, 0, TAU); c.fill(); }
      for (let f = 0; f < 4; f++) { const fx = cx + (f - 1.5) * 7 + (hash(seed, f) - .5) * 2, fy = by - H * .6 - (f % 2) * 4, cols = f % 2 ? [PAL.purple, PAL.yellow] : [PAL.lilac, PAL.yellow];
        c.strokeStyle = PAL.out; c.lineWidth = 2.6; c.beginPath(); c.moveTo(fx, fy + 3); c.lineTo(fx + (f - 1.5) * .8, by - 4); c.stroke(); c.strokeStyle = PAL.stemHi; c.lineWidth = 1; c.stroke();
        for (const pass of [0, 1]) { const e = pass ? 0 : 1.2; for (const [dx, dy, r, col] of [[-2.2, -2, 2.4, cols[0]], [2.2, -2, 2.4, cols[0]], [-2.6, .8, 2, cols[0]], [2.6, .8, 2, cols[0]], [0, 2.2, 2.8, cols[1]]]) { c.fillStyle = pass ? col : PAL.out; c.beginPath(); c.ellipse(fx + dx, fy + dy, r + e, r * .85 + e, 0, 0, TAU); c.fill(); } }
        c.fillStyle = PAL.out; c.beginPath(); c.arc(fx, fy + 1, 1, 0, TAU); c.fill(); c.fillStyle = PAL.orange; c.fillRect(fx - .5, fy + .3, 1, 1); }
    },
    /** Примула: зморшкуваті зубчасті листки розеткою, над ними парасолька з 6 рожево-кремових квіток із жовтим вічком. */
    primula(c, W, H, seed) {
      const cx = W / 2, by = H - 2; c.lineJoin = 'round';
      for (const pass of [0, 1]) for (let i = 0; i < 7; i++) { const a = (i / 6 - .5) * 3.1, lx = cx + Math.sin(a) * W * .36, ly = by - 3 - Math.cos(a) * H * .2; c.save(); c.translate(lx, ly); c.rotate(a * .6); c.fillStyle = pass ? (i % 2 ? PAL.d2 : PAL.d1) : PAL.out; c.beginPath(); const e = pass ? 0 : 1.4; for (let k = 0; k <= 14; k++) { const t = k / 14 * TAU, rr = (1 + .1 * Math.cos(t * 7)); c.lineTo(Math.cos(t) * (3 + e) * rr, Math.sin(t) * (5 + e) * rr); } c.closePath(); c.fill(); if (pass) { c.strokeStyle = PAL.d0; c.lineWidth = .8; c.beginPath(); c.moveTo(0, 4); c.lineTo(0, -3.5); c.stroke(); } c.restore(); }
      c.strokeStyle = PAL.out; c.lineWidth = 3.4; c.beginPath(); c.moveTo(cx, by - 4); c.lineTo(cx, by - H * .6); c.stroke(); c.strokeStyle = PAL.stemHi; c.lineWidth = 1.4; c.stroke();
      for (const pass of [0, 1]) for (let f = 0; f < 6; f++) { const a = f / 6 * TAU + .3, fx = cx + Math.cos(a) * 6.5, fy = by - H * .66 + Math.sin(a) * 3.5; for (let k = 0; k < 5; k++) { const b = k / 5 * TAU + f; c.fillStyle = pass ? (f % 2 ? PAL.pink : PAL.cream) : PAL.out; c.beginPath(); c.arc(fx + Math.cos(b) * 1.9, fy + Math.sin(b) * 1.9, 1.5 + (pass ? 0 : 1), 0, TAU); c.fill(); } if (pass) { c.fillStyle = PAL.yellow; c.beginPath(); c.arc(fx, fy, 1.1, 0, TAU); c.fill(); } }
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
    /** Нічна квітка цереуса (окремий спрайт, малюється лише вночі): велика біла воронка з жовтою серединою на боці стовпа. */
    cereusBloom(c, W, H) {
      const cx = W / 2 - 6, cy = H * .3; c.lineCap = 'round'; c.strokeStyle = PAL.out; c.lineWidth = 3.5; c.beginPath(); c.moveTo(cx + 8, cy + 6); c.lineTo(cx + 2, cy + 2); c.stroke(); c.strokeStyle = PAL.d2; c.lineWidth = 1.6; c.stroke();
      for (const pass of [0, 1]) for (let i = 0; i < 9; i++) { const a = Math.PI * .55 + (i / 8 - .5) * 2.6, l = 7 + (i % 2) * 2; c.strokeStyle = pass ? PAL.white : PAL.out; c.lineWidth = pass ? 2.2 : 4.2; c.beginPath(); c.moveTo(cx + 2, cy + 2); c.lineTo(cx + 2 + Math.cos(a) * l, cy + 2 + Math.sin(a) * l); c.stroke(); }
      c.fillStyle = PAL.spine; c.beginPath(); c.arc(cx + 2, cy + 2, 1.8, 0, TAU); c.fill();
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
  const SPR = {}, PADU = 40;                                                                                      // запас полотна, щоб крайні лопаті не різалися
  /** Спрайт героя: малюємо на великому полотні, далі обрізаємо до вмісту (нічого не різане) і запам'ятовуємо, де в ньому точка основи. */
  function spriteOf(p, kind = p.kind) {
    if (SPR[kind]) return SPR[kind]; const S = 2, P = PADU, big = document.createElement('canvas'); big.width = (p.w + 2 * P) * S; big.height = (p.h + 2 * P) * S; const c = big.getContext('2d'); c.scale(S, S); c.translate(P, P); DRAW[kind](c, p.w, p.h, p.seed);
    pixelize(big); const im = c.getImageData(0, 0, big.width, big.height).data; let x0 = big.width, y0 = big.height, x1 = -1, y1 = -1;
    for (let y = 0; y < big.height; y++) for (let x = 0; x < big.width; x++) if (im[(y * big.width + x) * 4 + 3]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 < 0) { x0 = y0 = 0; x1 = y1 = 1; } const cv = document.createElement('canvas'); cv.width = x1 - x0 + 1; cv.height = y1 - y0 + 1; cv.getContext('2d').drawImage(big, -x0, -y0);
    cv.base = [(P + p.w / 2) * S - x0, (P + p.h) * S - y0]; cv.S = S;                                                      // точка основи (центр низу) у пікселях спрайта
    return SPR[kind] = cv;
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
    px(c, x0 + 4, top + 4.5, w - 8, 1, '#3a4a6a'); for (let x = x0 + 18; x < x1 - 10; x += 26) { px(c, x, top + 4, 2, 2, '#5a6a8a'); const ph = (t * .5 + x * .013) % 1; if (ph < .3) { c.save(); c.globalAlpha = .9 - ph * 2; px(c, x + .5, top + 6 + ph * 10, 1, 1.6, '#8ae8ff'); c.restore(); } }   // крапельна трубка з емітерами, краплі в ґрунт
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
      const top = JAR.y - JAR.h + 2, night = Math.max(0, Math.min(1, (LK - 1) / .7));
      c.save(); c.beginPath(); c.rect(JAR.x0 - 80, 0, JAR.x1 - JAR.x0 + 160, top + 1); c.clip();                           // нижче канта героїв не малюємо — вони «в ґрунті»
      for (const p of HEROES) { if (p.x + p.w < vx0 || p.x - p.w > vx1) continue; const cv = spriteOf(p), S = cv.S, w = cv.width / S, h = cv.height / S, bx = cv.base[0] / S, byy = cv.base[1] / S, sh = Math.sin(t * .7 + p.seed) * .012 + Math.sin(t * 1.9 + p.seed * 2) * .004;
        c.save(); c.imageSmoothingEnabled = false; c.translate(p.x, top); c.transform(1, 0, sh, 1, 0, 0);                   // легке погойдування: верх ходить, основа стоїть
        c.drawImage(cv, -bx, -byy, w, h);
        if (p.back) { c.globalAlpha = .2 + .08 * night; c.globalCompositeOperation = 'source-atop'; c.fillStyle = '#2a3a8a'; c.fillRect(-bx, -byy, w, h); }   // серпанок на задньому шарі — глибина
        if (p.kind === 'cereus' && night > .05) { const bl = spriteOf(p, 'cereusBloom'); c.globalAlpha = night; c.drawImage(bl, -bl.base[0] / S, -bl.base[1] / S, bl.width / S, bl.height / S); c.globalCompositeOperation = 'lighter'; c.globalAlpha = night * (.25 + .1 * Math.sin(t * 2)); c.fillStyle = '#fff6c0'; c.beginPath(); c.arc(-4, -p.h * .7 + 2, 9, 0, TAU); c.fill(); }   // (· 36) цереус квітне вночі
        if (p.flash != null && t - p.flash < .8) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = (1 - (t - p.flash) / .8) * .3; c.fillStyle = '#fff'; c.fillRect(-bx, -byy, w, h); } c.restore(); }
      c.restore();
      if (night > .05) for (let i = 0; i < 7; i++) { const ph = t * (.25 + .08 * (i % 3)) + i * 1.7, x = JAR.x0 + 14 + ((i * 37 + Math.sin(ph) * 22 + 400) % (JAR.x1 - JAR.x0 - 28)), y = top - 24 - (i % 4) * 16 + Math.sin(ph * 1.6) * 9, a = night * (.35 + .65 * Math.max(0, Math.sin(ph * 3 + i)));   // світлячки над жардиньєром уночі
        c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a; c.fillStyle = '#c8ff6a'; c.fillRect(x, y, 1.4, 1.4); c.globalAlpha = a * .35; c.beginPath(); c.arc(x + .7, y + .7, 3.5, 0, TAU); c.fill(); c.restore(); }
    },
  });
})();
