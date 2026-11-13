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
    { kind: 'yucca', x: 760, w: 60, h: 104, seed: 11, back: 1, young: [10, -96, -.2], old: [-22, -50, -1.9] },                // задній шар: синюватий серпанок; young/old — якір нового / пожовклого листка (dx, dy, кут)
    { kind: 'strelitzia', x: 836, w: 64, h: 116, seed: 5, back: 1, young: [6, -100, -.1], old: [-24, -42, -2.1] },
    { kind: 'philodendron', x: 722, w: 96, h: 92, seed: 3, young: [-6, -72, -.35], old: [-38, -30, -2.3] },
    { kind: 'areca', x: 796, w: 84, h: 94, seed: 7, young: [4, -82, .1], old: [34, -28, -.9] },
    { kind: 'cereus', x: 880, w: 24, h: 84, seed: 9 },
    { kind: 'asplenium', x: 756, w: 54, h: 38, seed: 13 },                                                               // низький передній
    // (· 37) квітучі малята спереду: кожен — свій вид і свій колір
    { slot: 1, kind: 'saintpaulia', x: 724, w: 30, h: 22, seed: 21 },
    { slot: 1, kind: 'kalanchoe', x: 750, w: 28, h: 26, seed: 22 },
    { kind: 'anthurium', x: 792, w: 34, h: 34, seed: 23 },
    { slot: 1, kind: 'viola', x: 826, w: 30, h: 22, seed: 24 },
    { slot: 1, kind: 'primula', x: 862, w: 30, h: 26, seed: 25 },
  ];
  // (· 39) висячий сад над вікном: гачок на стельовій рейці (y HOOK_Y), рослина звисає вниз; x — центр, w/h — од.
  const RAIL = { x0: 662, x1: 892, y: 1 }, HOOK_Y = 4;
  const HANG = [
    { kind: 'chlorophytum', x: 686, w: 40, h: 64, seed: 31, hang: 1 },
    { kind: 'scindapsus', x: 738, w: 30, h: 82, seed: 32, hang: 1 },
    { kind: 'tillandsia', x: 828, w: 26, h: 54, seed: 33, hang: 1 },
    { kind: 'sedum', x: 866, w: 24, h: 72, seed: 34, hang: 1 },
    { kind: 'pitcher', x: 782, w: 28, h: 52, seed: 35, hang: 1 },                                                        // (· 44) непентес над вивіскою міста (до y ≈ 70)
  ];
  // ---------- палітри ----------
  const PAL = { out: '#04120c', d0: '#082218', d1: '#0f3a2a', d2: '#176a44', d3: '#2a9a62', hi: '#5cd08a', stem: '#3a5a2e', stemHi: '#6a8a4a', rimL: '#3be8ff', rimR: '#ff6ad8', bark: '#4a3a2a', barkHi: '#7a6040', spine: '#e8e0a0', white: '#e8f0ff', blue: '#4a6ae0', purple: '#7a3ac8', lilac: '#b88aff', yellow: '#ffd84a', orange: '#ff7a30', red: '#e8304a', pink: '#ff8ad0', cream: '#fff0c0', silver: '#b8c8d8', sage: '#7aa890', dusty: '#6a9a98', gray: '#98ac9c', grayD: '#5a7064', moss: '#3a6a30', copper: '#c8803a', copperHi: '#f0b070', terra: '#b05a3a', terraHi: '#d88a5a', teal: '#2ac8c0', navy: '#1a2048', navyHi: '#2a3468' };
  const HEX = Object.values(PAL).map(h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]);
  const FLOWERS = ['saintpaulia', 'kalanchoe', 'anthurium', 'viola', 'primula'], STAGES = 4, PERIOD = 170;              // цвітіння: 4 стадії спрайта, цикл 170 с
  /** Бутон замість квітки на ранній стадії: зелена крапля з кольоровим кінчиком. Повертає true, якщо намалював бутон. */
  const bud = (c, x, y, st, col) => { if (st >= .3) return false; const k = .6 + st; c.fillStyle = PAL.out; c.beginPath(); c.ellipse(x, y, 1.6 * k + 1, 2.2 * k + 1, 0, 0, TAU); c.fill(); c.fillStyle = PAL.d3; c.beginPath(); c.ellipse(x, y, 1.6 * k, 2.2 * k, 0, 0, TAU); c.fill(); c.fillStyle = col; c.beginPath(); c.ellipse(x, y - 1.2 * k, .9 * k, 1.1 * k, 0, 0, TAU); c.fill(); return true; };
  const pt = (c, x, y, col) => { if (c.__pts) c.__pts.push([x, y, col]); };
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
    /** Квітучі малята: DRAW отримує стадію st (0 — бутони, 1 — повне цвітіння) і пише центри квіток у c.__pts (для пелюсток і гостей). */
    saintpaulia(c, W, H, seed, st = 1) {
      const cx = W / 2, by = H - 2; c.lineJoin = 'round';
      for (const pass of [0, 1]) for (let i = 0; i < 9; i++) { const a = (i / 8 - .5) * 3.3, r = H * .55, lx = cx + Math.sin(a) * r * .75, ly = by - 4 - Math.cos(a) * r * .35, R = H * .22; c.fillStyle = pass ? (i % 2 ? PAL.d2 : PAL.d1) : PAL.out; c.beginPath(); c.ellipse(lx, ly, R + (pass ? 0 : 1.6), R * .8 + (pass ? 0 : 1.6), a * .3, 0, TAU); c.fill(); if (pass) { c.fillStyle = PAL.d3; c.beginPath(); c.ellipse(lx - 1, ly - 1.2, R * .45, R * .3, a * .3, 0, TAU); c.fill(); } }
      for (let f = 0; f < 5; f++) { const fx = cx + (f - 2) * 5.5 + (hash(seed, f) - .5) * 2, fy = by - H * .68 - (f % 2) * 3; if (bud(c, fx, fy, st, PAL.purple)) continue; const m = .5 + .5 * st; for (const pass of [0, 1]) for (let k = 0; k < 5; k++) { const a = k / 5 * TAU + f; c.fillStyle = pass ? PAL.purple : PAL.out; c.beginPath(); c.ellipse(fx + Math.cos(a) * 2.2 * m, fy + Math.sin(a) * 2.2 * m, 2 * m + (pass ? 0 : 1.2), 1.4 * m + (pass ? 0 : 1.2), a, 0, TAU); c.fill(); }
        c.fillStyle = PAL.lilac; c.beginPath(); c.arc(fx - 1.4 * m, fy - 1.4 * m, 1.5 * m, 0, TAU); c.fill(); c.fillStyle = PAL.yellow; c.beginPath(); c.arc(fx, fy, 1.2, 0, TAU); c.fill(); pt(c, fx, fy, PAL.purple); }
    },
    kalanchoe(c, W, H, seed, st = 1) {
      const cx = W / 2, by = H - 2; c.lineJoin = 'round';
      for (const pass of [0, 1]) for (let i = 0; i < 7; i++) { const a = (i / 6 - .5) * 2.8, r = H * .5, lx = cx + Math.sin(a) * r * .7, ly = by - 3 - Math.cos(a) * r * .4; c.fillStyle = pass ? (i % 2 ? PAL.d3 : PAL.d2) : PAL.out; c.beginPath(); const R = H * .2 + (pass ? 0 : 1.6); for (let k = 0; k <= 12; k++) { const t = k / 12 * TAU, rr = R * (1 + .12 * Math.cos(t * 6)); c.lineTo(lx + Math.cos(t) * rr, ly + Math.sin(t) * rr * .75); } c.closePath(); c.fill(); }
      for (let s2 = 0; s2 < 3; s2++) { const sx = cx + (s2 - 1) * 8, sy = by - H * .55; c.strokeStyle = PAL.out; c.lineWidth = 3; c.beginPath(); c.moveTo(sx, sy + 6); c.lineTo(sx, sy - 4); c.stroke(); c.strokeStyle = PAL.stemHi; c.lineWidth = 1.2; c.stroke();
        if (bud(c, sx, sy - 5, st, PAL.orange)) continue; const m = .4 + .6 * st;
        for (const pass of [0, 1]) for (let k = 0; k < 7; k++) { const a = hash(seed, s2 * 9 + k) * TAU, r = (2 + hash(seed, k + s2) * 3) * m, fx = sx + Math.cos(a) * r, fy = sy - 5 + Math.sin(a) * r * .7; c.fillStyle = pass ? (k % 3 ? PAL.orange : PAL.red) : PAL.out; c.beginPath(); c.arc(fx, fy, 1.6 * m + (pass ? 0 : 1.1), 0, TAU); c.fill(); if (pass) { c.fillStyle = PAL.yellow; c.fillRect(fx - .5, fy - .5, 1, 1); } } pt(c, sx, sy - 5, PAL.orange); }
    },
    anthurium(c, W, H, seed, st = 1) {
      const cx = W / 2, by = H - 2; c.lineCap = 'round'; c.lineJoin = 'round';
      const heart = (x, y, R, ang, fill, hi) => { for (const pass of [0, 1]) { c.save(); c.translate(x, y); c.rotate(ang); c.fillStyle = pass ? fill : PAL.out; const e = pass ? 0 : 1.5; c.beginPath(); c.moveTo(0, R + e); c.bezierCurveTo(-R * 1.1 - e, R * .3, -R * 1.1 - e, -R * .8 - e, 0, -R * .35); c.bezierCurveTo(R * 1.1 + e, -R * .8 - e, R * 1.1 + e, R * .3, 0, R + e); c.fill();
        if (pass && hi) { c.fillStyle = hi; c.beginPath(); c.ellipse(-R * .35, -R * .1, R * .3, R * .45, .4, 0, TAU); c.fill(); } c.restore(); } };
      for (const [a, r, back] of [[-1.1, .5, 1], [1.0, .5, 1], [-.45, .62, 0], [.5, .6, 0], [0, .42, 0]]) { const lx = cx + Math.sin(a) * H * r * .8, ly = by - 4 - Math.cos(a) * H * r * .6; c.strokeStyle = PAL.out; c.lineWidth = 3.2; c.beginPath(); c.moveTo(cx, by - 3); c.lineTo(lx, ly); c.stroke(); c.strokeStyle = PAL.stem; c.lineWidth = 1.4; c.stroke(); heart(lx, ly - 3, H * .17, a * .5 + Math.PI, back ? PAL.d1 : PAL.d2, back ? null : PAL.d3); }
      for (const [a, r] of [[-.7, .95], [.6, 1.0]]) { const fx = cx + Math.sin(a) * H * r * .45, fy = by - 4 - Math.cos(a) * H * r * .75; c.strokeStyle = PAL.out; c.lineWidth = 3.2; c.beginPath(); c.moveTo(cx, by - 3); c.lineTo(fx, fy + 2); c.stroke(); c.strokeStyle = PAL.stemHi; c.lineWidth = 1.4; c.stroke(); if (bud(c, fx, fy, st, PAL.red)) continue; heart(fx, fy - 2, H * .14 * (.5 + .5 * st), a * .4 + Math.PI, PAL.red, PAL.pink);
        c.strokeStyle = PAL.out; c.lineWidth = 3.6; c.beginPath(); c.moveTo(fx, fy - 2); c.lineTo(fx + Math.sin(a * .4) * 7 * st, fy - 2 - Math.cos(a * .4) * 7 * st); c.stroke(); c.strokeStyle = PAL.yellow; c.lineWidth = 1.8; c.stroke(); pt(c, fx, fy - 2, PAL.red); }
    },
    viola(c, W, H, seed, st = 1) {
      const cx = W / 2, by = H - 2;
      for (const pass of [0, 1]) for (let i = 0; i < 8; i++) { const a = (i / 7 - .5) * 3, lx = cx + Math.sin(a) * W * .4, ly = by - 3 - Math.cos(a) * H * .25; c.fillStyle = pass ? (i % 2 ? PAL.d2 : PAL.d1) : PAL.out; c.beginPath(); c.ellipse(lx, ly, 2.6 + (pass ? 0 : 1.3), 3.4 + (pass ? 0 : 1.3), a, 0, TAU); c.fill(); }
      for (let f = 0; f < 4; f++) { const fx = cx + (f - 1.5) * 7 + (hash(seed, f) - .5) * 2, fy = by - H * .6 - (f % 2) * 4, cols = f % 2 ? [PAL.purple, PAL.yellow] : [PAL.lilac, PAL.yellow];
        c.strokeStyle = PAL.out; c.lineWidth = 2.6; c.beginPath(); c.moveTo(fx, fy + 3); c.lineTo(fx + (f - 1.5) * .8, by - 4); c.stroke(); c.strokeStyle = PAL.stemHi; c.lineWidth = 1; c.stroke(); if (bud(c, fx, fy, st, cols[0])) continue; const m = .5 + .5 * st;
        for (const pass of [0, 1]) { const e = pass ? 0 : 1.2; for (const [dx, dy, r, col] of [[-2.2, -2, 2.4, cols[0]], [2.2, -2, 2.4, cols[0]], [-2.6, .8, 2, cols[0]], [2.6, .8, 2, cols[0]], [0, 2.2, 2.8, cols[1]]]) { c.fillStyle = pass ? col : PAL.out; c.beginPath(); c.ellipse(fx + dx * m, fy + dy * m, r * m + e, r * .85 * m + e, 0, 0, TAU); c.fill(); } }
        c.fillStyle = PAL.out; c.beginPath(); c.arc(fx, fy + 1, 1, 0, TAU); c.fill(); c.fillStyle = PAL.orange; c.fillRect(fx - .5, fy + .3, 1, 1); pt(c, fx, fy, cols[0]); }
    },
    primula(c, W, H, seed, st = 1) {
      const cx = W / 2, by = H - 2; c.lineJoin = 'round';
      for (const pass of [0, 1]) for (let i = 0; i < 7; i++) { const a = (i / 6 - .5) * 3.1, lx = cx + Math.sin(a) * W * .36, ly = by - 3 - Math.cos(a) * H * .2; c.save(); c.translate(lx, ly); c.rotate(a * .6); c.fillStyle = pass ? (i % 2 ? PAL.d2 : PAL.d1) : PAL.out; c.beginPath(); const e = pass ? 0 : 1.4; for (let k = 0; k <= 14; k++) { const t = k / 14 * TAU, rr = (1 + .1 * Math.cos(t * 7)); c.lineTo(Math.cos(t) * (3 + e) * rr, Math.sin(t) * (5 + e) * rr); } c.closePath(); c.fill(); if (pass) { c.strokeStyle = PAL.d0; c.lineWidth = .8; c.beginPath(); c.moveTo(0, 4); c.lineTo(0, -3.5); c.stroke(); } c.restore(); }
      c.strokeStyle = PAL.out; c.lineWidth = 3.4; c.beginPath(); c.moveTo(cx, by - 4); c.lineTo(cx, by - H * .6); c.stroke(); c.strokeStyle = PAL.stemHi; c.lineWidth = 1.4; c.stroke();
      const m = .5 + .5 * st; for (const pass of [0, 1]) for (let f = 0; f < 6; f++) { const a = f / 6 * TAU + .3, fx = cx + Math.cos(a) * 6.5, fy = by - H * .66 + Math.sin(a) * 3.5; if (st < .3) { if (pass) bud(c, fx, fy, st, f % 2 ? PAL.pink : PAL.cream); continue; } for (let k = 0; k < 5; k++) { const b = k / 5 * TAU + f; c.fillStyle = pass ? (f % 2 ? PAL.pink : PAL.cream) : PAL.out; c.beginPath(); c.arc(fx + Math.cos(b) * 1.9 * m, fy + Math.sin(b) * 1.9 * m, 1.5 * m + (pass ? 0 : 1), 0, TAU); c.fill(); } if (pass) { c.fillStyle = PAL.yellow; c.beginPath(); c.arc(fx, fy, 1.1, 0, TAU); c.fill(); pt(c, fx, fy, f % 2 ? PAL.pink : PAL.cream); } }
    },
    // ---------- (· 39) висячі: малюються від ГОРИ (y 0 — гачок), кашпо зверху, рослина звисає ----------
    /** (· 46) Кашпо — у кожного своє: pod — хромована капсула з ілюмінатором на ланцюжках; hex — шестикутник із рожевим неоновим
     *  кільцем на тросах; cage — мідний ліхтар-клітка з теплим світлом усередині; bowl — теракотова чаша з піксельним візерунком на
     *  макраме-шнурах. Повертає y низу кашпо. */
    _pot(c, W, seed, style) { const cx = W / 2, y0 = 10; c.lineCap = 'round'; c.lineJoin = 'round';
      const cables = (n, col, w, spread, dashed) => { const ks = n === 3 ? [-1, 0, 1] : [-1, 1]; for (const pass of [0, 1]) for (const k of ks) { c.strokeStyle = pass ? col : PAL.out; c.lineWidth = pass ? w : w + 1.6; if (dashed) c.setLineDash([1.2, 1]); c.beginPath(); c.moveTo(cx, 0); c.lineTo(cx + k * spread, y0 + 1); c.stroke(); c.setLineDash([]); } };
      if (style === 'pod') { cables(2, PAL.silver, .9, 5, true); const r = Math.min(W * .3, 8), ph = 11, cy = y0 + ph * .5;                              // капсула: верх хром, низ темний, вікно-щілина з бірюзовим світлом, антенка
        c.fillStyle = PAL.out; c.beginPath(); c.ellipse(cx, cy, r + 1.5, ph * .5 + 1.5, 0, 0, TAU); c.fill(); c.fillStyle = PAL.navy; c.beginPath(); c.ellipse(cx, cy, r, ph * .5, 0, 0, TAU); c.fill();
        c.save(); c.beginPath(); c.rect(cx - r - 1, y0 - 1, r * 2 + 2, ph * .5); c.clip(); c.fillStyle = PAL.silver; c.beginPath(); c.ellipse(cx, cy, r, ph * .5, 0, 0, TAU); c.fill(); c.fillStyle = PAL.white; c.beginPath(); c.ellipse(cx - r * .4, cy - ph * .25, r * .3, ph * .12, -.3, 0, TAU); c.fill(); c.restore();
        c.fillStyle = PAL.out; c.fillRect(cx - r, cy - .4, r * 2, 1); c.fillStyle = PAL.rimL; c.fillRect(cx - r * .5, cy + 1.5, r, 1.2); c.fillStyle = PAL.navyHi; c.fillRect(cx - r * .5, cy + 3.2, r, .6);   // шов, вікно-щілина
        c.fillStyle = PAL.out; c.fillRect(cx - .6, y0 - 2.5, 1.2, 3); c.fillStyle = PAL.red; c.fillRect(cx - .7, y0 - 3.2, 1.4, 1.2); return y0 + ph; }
      if (style === 'hex') { cables(3, PAL.silver, .8, 6, false); const r = Math.min(W * .32, 8), ph = 10;                                     // шестикутник, неонове кільце, LED
        const hexP = (R, dy) => { c.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + Math.PI / 6; c.lineTo(cx + Math.cos(a) * R, y0 + dy + Math.sin(a) * R * .5); } c.closePath(); };
        c.fillStyle = PAL.out; hexP(r + 1.5, 1.5); c.fill(); c.fillRect(cx - r - 1.5, y0 + 1.5, (r + 1.5) * 2, ph); hexP(r + 1.5, ph + 1.5); c.fill();
        c.fillStyle = PAL.navy; c.fillRect(cx - r, y0 + 2, r * 2, ph - 1); hexP(r, ph); c.fill(); c.fillStyle = PAL.navyHi; hexP(r, 2); c.fill(); c.fillStyle = '#0a0c1c'; hexP(r * .8, 2); c.fill();
        c.strokeStyle = PAL.rimR; c.lineWidth = 1.1; c.beginPath(); c.moveTo(cx - r, y0 + ph * .55); c.lineTo(cx + r, y0 + ph * .55); c.stroke(); c.fillStyle = PAL.rimL; c.fillRect(cx + r - 2.6, y0 + ph - 2.6, 1.2, 1.2); return y0 + ph + 1; }
      if (style === 'cage') { cables(1, PAL.copper, 1.2, 0, false); const r = Math.min(W * .3, 7), ph = 13;                                     // мідна клітка: кільця зверху/знизу, 5 прутів, тепле сяйво
        c.fillStyle = PAL.out; c.fillRect(cx - r - 1.5, y0 - 1, (r + 1.5) * 2, ph + 2); c.save(); c.globalAlpha = .55; c.fillStyle = '#ffb04a'; c.fillRect(cx - r + .5, y0 + 1, r * 2 - 1, ph - 2); c.restore();
        c.fillStyle = PAL.copper; c.fillRect(cx - r, y0, r * 2, 1.8); c.fillRect(cx - r, y0 + ph - 2, r * 2, 2); c.fillStyle = PAL.copperHi; c.fillRect(cx - r, y0, r * 2, .6); c.fillRect(cx - r, y0 + ph - 2, r * 2, .6);
        for (let i = 0; i < 5; i++) { const x = cx - r + .8 + i * (r * 2 - 1.6) / 4; c.fillStyle = i === 1 ? PAL.copperHi : PAL.copper; c.fillRect(x - .5, y0 + 1, 1, ph - 3); }
        c.fillStyle = '#fff0c0'; c.fillRect(cx - 1, y0 + ph * .45, 2, 2); return y0 + ph; }
      if (style === 'bowl') { for (const pass of [0, 1]) for (const k of [-1, 1]) { c.strokeStyle = pass ? PAL.cream : PAL.out; c.lineWidth = pass ? 1.3 : 2.9; c.beginPath(); c.moveTo(cx, 0); c.quadraticCurveTo(cx + k * 2, 5, cx + k * 7, y0 + 2); c.stroke(); if (pass) for (let q = 3; q < y0; q += 3) { c.fillStyle = PAL.cream; c.fillRect(cx + k * (q / y0 * 7) - 1.1, q, 2.2, 1.3); } }   // макраме: два шнури з вузликами
        const r = Math.min(W * .36, 9), ph = 9; c.fillStyle = PAL.out; c.beginPath(); c.moveTo(cx - r - 1.5, y0 - 1); c.lineTo(cx + r + 1.5, y0 - 1); c.lineTo(cx + r * .55 + 1.5, y0 + ph + 1.5); c.lineTo(cx - r * .55 - 1.5, y0 + ph + 1.5); c.closePath(); c.fill();
        c.fillStyle = PAL.terra; c.beginPath(); c.moveTo(cx - r, y0); c.lineTo(cx + r, y0); c.lineTo(cx + r * .55, y0 + ph); c.lineTo(cx - r * .55, y0 + ph); c.closePath(); c.fill(); c.fillStyle = PAL.terraHi; c.fillRect(cx - r, y0, r * 2, 1.4);
        for (let i = 0; i < 7; i++) { const x = cx - r + 1.5 + i * (r * 2 - 3) / 6; c.fillStyle = i % 2 ? PAL.teal : PAL.cream; c.beginPath(); c.moveTo(x - 1.2, y0 + 3); c.lineTo(x, y0 + 5.2); c.lineTo(x + 1.2, y0 + 3); c.closePath(); c.fill(); }   // зигзаг
        c.fillStyle = PAL.teal; c.fillRect(cx - r * .55, y0 + ph - 1.6, r * 1.1, .8); return y0 + ph; }
      return y0 + 10; },
    /** Хлорофітум: розетка дугастих смугастих листків (зелений з кремовою серединою) з кашпо, 3 вуси з дитинками нижче. */
    chlorophytum(c, W, H, seed) { const cx = W / 2, pb = 21, py = pb + 1; c.lineCap = 'round';                                                   // капсулу малюємо наприкінці — поверх розетки
      const blade = (x0, y0, a, len, w, col, mid, pass) => { const pts = []; for (let i = 0; i <= 8; i++) { const t = i / 8, ang = a + t * t * 1.3 * Math.sign(Math.sin(a) || 1); pts.push([x0 + Math.sin(ang) * len * t, y0 - Math.cos(ang) * len * t + t * t * len * .25]); }
        c.strokeStyle = pass ? col : PAL.out; c.lineWidth = pass ? w : w + 2.2; c.beginPath(); pts.forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.stroke(); if (pass && mid) { c.strokeStyle = mid; c.lineWidth = w * .35; c.stroke(); } };
      const bl = []; for (let i = 0; i < 15; i++) { const a = (i / 14 - .5) * 3.6 + (hash(seed, i) - .5) * .2; bl.push({ a, len: 22 + 12 * hash(seed, i + 3), back: i % 2 }); } bl.sort((p, q) => q.back - p.back);
      for (const pass of [0, 1]) for (const B of bl) blade(cx, py, B.a, B.len, 3, B.back ? PAL.d2 : PAL.d3, B.back ? null : PAL.cream, pass);
      for (const [k, dx, len] of [[0, -.7, .95], [1, .15, 1], [2, .8, .85]]) { const ex = cx + dx * W * .42, ey = py + (H - py) * len - 10, mx = (cx + ex) / 2 + dx * 4; c.strokeStyle = PAL.out; c.lineWidth = 3; c.beginPath(); c.moveTo(cx, py + 2); c.quadraticCurveTo(mx, py + (ey - py) * .4, ex, ey); c.stroke(); c.strokeStyle = PAL.cream; c.lineWidth = 1.1; c.stroke();   // вус
        for (const pass of [0, 1]) for (let i = 0; i < 9; i++) { const a = (i / 8 - .5) * 3.2 + .1 * hash(seed, i + k); blade(ex, ey, a, 7 + 5 * hash(seed, i * 3 + k), 1.8, i % 2 ? PAL.d2 : PAL.d3, i % 2 ? null : PAL.cream, pass); }   // дитинка
        c.fillStyle = PAL.white; c.fillRect(ex - 1, ey - 1, 2, 2); }
      DRAW._pot(c, W, seed, 'pod'); },
    /** Сциндапсус (атласний потос): 5 лоз із серцеподібними темно-зеленими листками в срібних плямах. */
    scindapsus(c, W, H, seed) { const cx = W / 2, pb = DRAW._pot(c, W, seed, 'hex'); c.lineCap = 'round'; c.lineJoin = 'round';
      const vines = []; for (let v = 0; v < 5; v++) { const dx = (v / 4 - .5) * W * .8, len = (H - pb) * (.55 + .45 * hash(seed, v)), pts = []; for (let i = 0; i <= 10; i++) { const t = i / 10; pts.push([cx + dx * Math.min(1, t * 2.5) + Math.sin(t * 5 + v) * 2.5, pb - 2 + len * t]); } vines.push({ pts, back: v % 2 === 0, v }); }
      vines.sort((p, q) => q.back - p.back);
      for (const V of vines) { c.strokeStyle = PAL.out; c.lineWidth = 3; c.beginPath(); V.pts.forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.stroke(); c.strokeStyle = V.back ? PAL.stem : PAL.stemHi; c.lineWidth = 1.2; c.stroke();
        for (let i = 1; i <= 10; i += 1) { if (i % 2 !== V.v % 2) continue; const [x, y] = V.pts[i], sd = (i % 4 < 2 ? -1 : 1), R = 4.2 + 1.2 * hash(seed, i + V.v * 7), ang = sd * .9 + .3;
          for (const pass of [0, 1]) { c.save(); c.translate(x + sd * 1.5, y + 1); c.rotate(ang); c.fillStyle = pass ? (V.back ? PAL.d1 : PAL.d2) : PAL.out; const e = pass ? 0 : 1.4; c.beginPath(); c.moveTo(0, R + e); c.bezierCurveTo(-R * 1.1 - e, R * .3, -R * 1.1 - e, -R * .8 - e, 0, -R * .35); c.bezierCurveTo(R * 1.1 + e, -R * .8 - e, R * 1.1 + e, R * .3, 0, R + e); c.fill();
            if (pass) { c.fillStyle = PAL.silver; for (let k = 0; k < 4; k++) { const a = hash(seed, i * 11 + k + V.v) * TAU, r = R * .55 * hash(seed, i + k * 5); c.beginPath(); c.arc(Math.cos(a) * r, Math.sin(a) * r * .8, 1 + .5 * hash(seed, k + i), 0, TAU); c.fill(); } } c.restore(); } } } },
    /** Тіландсія вусата («іспанський мох»): без кашпо — моховий кулька на тросі, з якого звисають сіро-зелені кучеряві нитки. */
    tillandsia(c, W, H, seed) { const cx = W / 2; c.lineCap = 'round';
      c.strokeStyle = PAL.out; c.lineWidth = 2.2; c.beginPath(); c.moveTo(cx, 0); c.lineTo(cx, 8); c.stroke(); c.strokeStyle = PAL.copper; c.lineWidth = .9; c.stroke();
      c.strokeStyle = PAL.out; c.lineWidth = 3.2; c.beginPath(); c.arc(cx, 16, 8.6, 0, TAU); c.stroke(); c.strokeStyle = PAL.copper; c.lineWidth = 1.4; c.stroke(); c.strokeStyle = PAL.copperHi; c.lineWidth = .5; c.beginPath(); c.arc(cx, 16, 8.6, -2.6, -1.2); c.stroke();   // (· 46) мідне кільце-обруч навколо мохового м'яча
      c.fillStyle = PAL.out; c.beginPath(); c.arc(cx, 16, 7.5, 0, TAU); c.fill(); c.fillStyle = PAL.moss; c.beginPath(); c.arc(cx, 16, 6, 0, TAU); c.fill(); c.fillStyle = PAL.d3; for (let k = 0; k < 7; k++) { const a = hash(seed, k) * TAU, r = 5 * hash(seed, k + 9); c.fillRect(cx + Math.cos(a) * r - .6, 16 + Math.sin(a) * r - .6, 1.2, 1.2); }
      const st = []; for (let i = 0; i < 16; i++) { const dx = (i / 15 - .5) * W * .85, len = (H - 20) * (.45 + .55 * hash(seed, i + 2)), pts = []; for (let k = 0; k <= 12; k++) { const t = k / 12; pts.push([cx + dx * Math.min(1, t * 3) + Math.sin(t * 9 + i * 1.7) * 2.2 * (1 - t * .3), 18 + len * t]); } st.push({ pts, back: i % 3 !== 1 }); }
      st.sort((p, q) => q.back - p.back); for (const pass of [0, 1]) for (const S of st) { c.strokeStyle = pass ? (S.back ? PAL.grayD : PAL.gray) : PAL.out; c.lineWidth = pass ? 1.3 : 3; c.beginPath(); S.pts.forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.stroke(); } },
    /** Седум Моргана («ослячий хвіст»): 6 товстих джгутів із пухких сизо-зелених намистин. */
    sedum(c, W, H, seed) { const cx = W / 2, pb = DRAW._pot(c, W, seed, 'bowl');
      const ropes = []; for (let v = 0; v < 6; v++) { const dx = (v / 5 - .5) * W * .7, len = (H - pb) * (.6 + .4 * hash(seed, v)); ropes.push({ dx, len, back: v % 2 === 0, v }); } ropes.sort((p, q) => q.back - p.back);
      for (const pass of [0, 1]) for (const R of ropes) { const n = Math.floor(R.len / 2.6); for (let i = 0; i < n; i++) { const t = i / n, x = cx + R.dx * Math.min(1, t * 3) + Math.sin(t * 4 + R.v) * 1.5, y = pb - 2 + R.len * t, r = 2.1 - t * .5 + (i % 2) * .3; c.fillStyle = pass ? (R.back ? PAL.dusty : (i % 3 ? PAL.sage : PAL.d3)) : PAL.out; c.beginPath(); c.ellipse(x + (i % 2 ? 1 : -1) * .9, y, r + (pass ? 0 : 1.1), r * .8 + (pass ? 0 : 1.1), 0, 0, TAU); c.fill(); if (pass && !R.back && i % 3 === 0) { c.fillStyle = PAL.cream; c.fillRect(x + (i % 2 ? 1 : -1) * .9 - .6, y - .9, 1, .8); } } } },
    /** Непентес (висячий): розетка довгастих листків, з кінчиків на вусиках звисають глечики з кришечками. */
    pitcher(c, W, H, seed) { const cx = W / 2, pb = DRAW._pot(c, W, seed, 'cage'), py = pb - 3; c.lineCap = 'round'; c.lineJoin = 'round';
      const ls = []; for (let i = 0; i < 9; i++) { const a = (i / 8 - .5) * 3.2 + (hash(seed, i) - .5) * .2; ls.push({ a, len: 14 + 8 * hash(seed, i + 3), back: i % 2 === 0, i }); } ls.sort((p, q) => q.back - p.back);
      for (const pass of [0, 1]) for (const L of ls) { const ex = cx + Math.sin(L.a) * L.len, ey = py + Math.cos(L.a) * L.len * .55 + Math.abs(Math.sin(L.a)) * 2; c.strokeStyle = pass ? (L.back ? PAL.d1 : PAL.d2) : PAL.out; c.lineWidth = pass ? 3.4 : 5.6; c.beginPath(); c.moveTo(cx, py); c.lineTo(ex, ey); c.stroke(); if (pass && !L.back) { c.strokeStyle = PAL.d3; c.lineWidth = 1; c.beginPath(); c.moveTo(cx, py); c.lineTo(ex, ey); c.stroke(); }
        if (pass && L.i % 2 === 1) { const vx = ex + Math.sin(L.a) * 3, vy = ey + 9 + 6 * hash(seed, L.i); c.strokeStyle = PAL.out; c.lineWidth = 2.4; c.beginPath(); c.moveTo(ex, ey); c.quadraticCurveTo(ex + Math.sin(L.a) * 4, (ey + vy) / 2, vx, vy); c.stroke(); c.strokeStyle = PAL.stemHi; c.lineWidth = .9; c.stroke();   // вусик
          for (const p2 of [0, 1]) { c.fillStyle = p2 ? (L.i % 4 === 1 ? '#c84a5a' : '#8a3a6a') : PAL.out; const e = p2 ? 0 : 1.3; c.beginPath(); c.ellipse(vx, vy + 6, 3 + e, 6.5 + e, 0, 0, TAU); c.fill(); }   // глечик
          c.fillStyle = '#e8a0b0'; c.fillRect(vx - 1.4, vy + 1, 1.2, 8); c.fillStyle = PAL.d3; c.beginPath(); c.ellipse(vx + .5, vy - .5, 3.2, 1.4, -.3, 0, TAU); c.fill(); c.fillStyle = PAL.out; c.beginPath(); c.ellipse(vx + .3, vy + .6, 2, .9, 0, 0, TAU); c.fill(); } }   // смужка, кришечка, отвір
    },
    /** Калатея (мала, передня): розетка округлих листків із темно-світлими смугами й пурпуровим низом. */
    calathea(c, W, H, seed) { const cx = W / 2, by = H - 2; c.lineJoin = 'round';
      const ls = []; for (let i = 0; i < 9; i++) { const a = (i / 8 - .5) * 3 + (hash(seed, i) - .5) * .2; ls.push({ a, len: H * (.55 + .4 * hash(seed, i + 2)), back: i % 2 === 0 }); } ls.sort((p, q) => q.back - p.back);
      for (const pass of [0, 1]) for (const L of ls) { const ex = cx + Math.sin(L.a) * L.len * .8, ey = by - 4 - Math.cos(L.a) * L.len * .8, R = H * .2; c.strokeStyle = PAL.out; c.lineWidth = 2.4; c.beginPath(); c.moveTo(cx, by - 3); c.lineTo(ex, ey); c.stroke(); if (pass) { c.strokeStyle = '#7a3a6a'; c.lineWidth = 1; c.stroke(); }
        c.save(); c.translate(ex, ey); c.rotate(L.a * .6); c.fillStyle = pass ? (L.back ? PAL.d1 : PAL.d2) : PAL.out; const e = pass ? 0 : 1.4; c.beginPath(); c.ellipse(0, 0, R + e, R * 1.35 + e, 0, 0, TAU); c.fill();
        if (pass) { c.fillStyle = L.back ? PAL.d2 : PAL.hi; for (let k = -3; k <= 3; k++) { c.beginPath(); c.ellipse(k * R * .3, 0, R * .1, R * 1.2 * (1 - Math.abs(k) * .12), 0, 0, TAU); c.fill(); } c.fillStyle = PAL.d0; c.fillRect(-.5, -R * 1.3, 1, R * 2.6); } c.restore(); } },
    /** Алоказія (мала, передня): 4 стрілоподібні листки з білими жилками на високих черешках. */
    alocasia(c, W, H, seed) { const cx = W / 2, by = H - 2; c.lineJoin = 'round'; c.lineCap = 'round';
      const ls = [[-.9, .8, 1], [.8, .85, 1], [-.3, 1, 0], [.4, .95, 0]];
      for (const pass of [0, 1]) for (const [a, l, back] of ls) { const ex = cx + Math.sin(a) * H * l * .5, ey = by - 4 - Math.cos(a) * H * l * .75; c.strokeStyle = PAL.out; c.lineWidth = 3; c.beginPath(); c.moveTo(cx, by - 3); c.lineTo(ex, ey); c.stroke(); if (pass) { c.strokeStyle = back ? PAL.stem : PAL.stemHi; c.lineWidth = 1.3; c.stroke(); }
        const R = H * .22; c.save(); c.translate(ex, ey); c.rotate(a * .5); c.fillStyle = pass ? (back ? PAL.d1 : PAL.d2) : PAL.out; const e = pass ? 0 : 1.4; c.beginPath(); c.moveTo(0, R * 1.3 + e); c.lineTo(-R - e, -R * .2); c.lineTo(-R * .45, -R * 1.1 - e); c.lineTo(0, -R * .6); c.lineTo(R * .45, -R * 1.1 - e); c.lineTo(R + e, -R * .2); c.closePath(); c.fill();
        if (pass) { c.strokeStyle = back ? PAL.d3 : PAL.cream; c.lineWidth = .9; c.beginPath(); c.moveTo(0, R * 1.1); c.lineTo(0, -R * .5); c.moveTo(0, R * .3); c.lineTo(-R * .7, -R * .3); c.moveTo(0, R * .3); c.lineTo(R * .7, -R * .3); c.moveTo(0, -R * .2); c.lineTo(-R * .35, -R * .85); c.moveTo(0, -R * .2); c.lineTo(R * .35, -R * .85); c.stroke(); } c.restore(); } },
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
  function spriteOf(p, kind = p.kind, stage = STAGES - 1) {
    const key = kind + ':' + stage; if (SPR[key]) return SPR[key]; const S = 2, P = PADU, big = document.createElement('canvas'); big.width = (p.w + 2 * P) * S; big.height = (p.h + 2 * P) * S; const c = big.getContext('2d'); c.scale(S, S); c.translate(P, P); c.__pts = []; DRAW[kind](c, p.w, p.h, p.seed, stage / (STAGES - 1));
    const pts = c.__pts.map(([x, y, col]) => [x - p.w / 2, y - p.h, col]);                                               // центри квіток відносно основи (од. кімнати)
    pixelize(big); const im = c.getImageData(0, 0, big.width, big.height).data; let x0 = big.width, y0 = big.height, x1 = -1, y1 = -1;
    for (let y = 0; y < big.height; y++) for (let x = 0; x < big.width; x++) if (im[(y * big.width + x) * 4 + 3]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 < 0) { x0 = y0 = 0; x1 = y1 = 1; } const cv = document.createElement('canvas'); cv.width = x1 - x0 + 1; cv.height = y1 - y0 + 1; cv.getContext('2d').drawImage(big, -x0, -y0);
    cv.base = [(P + p.w / 2) * S - x0, (P + (p.hang ? 0 : p.h)) * S - y0]; cv.S = S; cv.pts = pts;                        // висячі: основа — точка гачка (центр верху)                                        // точка основи (центр низу) у пікселях спрайта
    return SPR[key] = cv;
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
    px(c, x0 + 4, top + 4.5, w - 8, 1, '#3a4a6a'); for (let x = x0 + 18; x < x1 - 10; x += 26) { px(c, x, top + 4, 2, 2, '#5a6a8a'); const ph = (t * .5 + x * .013) % 1; if (HUM.drip && ph < .3) { c.save(); c.globalAlpha = .9 - ph * 2; px(c, x + .5, top + 6 + ph * 10, 1, 1.6, '#8ae8ff'); c.restore(); } }   // крапельна трубка з емітерами, краплі в ґрунт
    for (let k = 0; k < 3; k++) { const on = Math.floor(t * 1.5 + k) % 3 === 0; c.save(); c.globalAlpha = on ? .95 : .3; px(c, x1 - 12 + k * 3, top + d + 2, 1.6, 1.2, on ? '#3bff8a' : '#1a6a3a'); c.restore(); }   // індикатори
  }
  let hit = null;
  // ---------- (· 38) ЖИТТЯ ЖАРДИНЬЄРА: цвітіння по циклу, пелюстки, вологість і дисплей, гості-комахи, відблиск на дивані ----------
  const TOP = () => JAR.y - JAR.h + 2;
  const FL = HEROES.filter(p => FLOWERS.includes(p.kind)); FL.forEach((p, i) => { p.t0 = -PERIOD * (.25 + .6 * i / FL.length); });   // цикли зсунуто — цвітуть не разом
  /** Стадія цвітіння 0..1 за часом: бутон (0–.15 циклу) → розкривання (до .25) → повне (до .8) → опадання (стрибком) → бутон. */
  const stageOf = (p, t) => { const u = ((t - p.t0) % PERIOD + PERIOD) % PERIOD / PERIOD; return u < .15 ? 0 : u < .25 ? (u - .15) / .1 : u < .8 ? 1 : 0; };
  const PET = [], HUM = { v: .9, drip: 0 };
  function flowerPts(p, t) { const cv = spriteOf(p, p.kind, Math.round(stageOf(p, t) * (STAGES - 1))); return cv.pts.map(([x, y, col]) => [p.x + x, TOP() + y, col]); }
  /** Пелюстки летять з квіток рослини p (n штук) — лягають на кант і зникають. */
  function shed(p, t, n = 6) { const pts = flowerPts(p, t); if (!pts.length) return; for (let i = 0; i < n; i++) { const q = pts[(i * 7 + p.seed) % pts.length]; PET.push({ x: q[0] + (Math.random() - .5) * 2, y: q[1], vx: (Math.random() - .5) * 6, vy: -4 - Math.random() * 6, col: q[2], t0: t, ph: Math.random() * TAU }); } }
  function tickLife(t, dt) {
    for (const p of FL) { const st = stageOf(p, t); if (p.lastSt === 1 && st === 0) shed(p, t, 7); p.lastSt = st; }                  // цикл добіг до опадання
    HUM.v = Math.max(0, HUM.v - dt / 300); if (HUM.v < .3) HUM.drip = 1; if (HUM.drip) { HUM.v = Math.min(1, HUM.v + dt / 40); if (HUM.v >= .95) HUM.drip = 0; }   // сама поливається, як пересохла
    for (let i = PET.length - 1; i >= 0; i--) { const q = PET[i], a = t - q.t0; if (a > 9) { PET.splice(i, 1); continue; } if (q.y < TOP() + 3) { q.vy += 14 * dt; q.vy = Math.min(q.vy, 9); q.x += (q.vx + Math.sin(t * 5 + q.ph) * 6) * dt; q.y += q.vy * dt; if (q.y >= TOP() + 3) { q.y = TOP() + 3 + Math.random() * 3; q.land = t; } } }
  }
  function drawPetals(c, t) { for (const q of PET) { const a = q.land ? Math.max(0, 1 - (t - q.land) / 6) : 1; c.globalAlpha = a; c.fillStyle = q.col; const r = q.land ? 0 : Math.sin(t * 6 + q.ph); c.fillRect(q.x - 1, q.y - .6, 2 + Math.abs(r), 1.2); } c.globalAlpha = 1; }
  /** Голодисплей на лівому краю канта: вологість (крапля + смуга), температура (стовпчик), кільце таймера поливу. Без тексту. */
  function drawPanel(c, t, LK) {
    const x = JAR.x0 + 2, y = TOP() - 32, w = 54, h = 24, a = .75 + .15 * Math.sin(t * 3), T = NX.t, n = NX.planters.PL.length;
    c.save(); c.globalAlpha = .72; c.fillStyle = '#071226'; c.fillRect(x, y, w, h); c.globalAlpha = a * Math.min(1.2, LK); c.strokeStyle = '#3be8ff'; c.lineWidth = .6; c.strokeRect(x + .3, y + .3, w - .6, h - .6);
    c.fillStyle = '#3be8ff'; c.fillRect(x, y + h, 1, 8); c.fillRect(x + w - 1, y + h, 1, 8);                                                                   // ніжки до канта
    NX.px.text(c, T('decor.garden.title'), x + w / 2, y + 5.5, '#7aff9a', 3.1, 'center'); NX.px.text(c, T('decor.garden.count', { n }), x + w / 2, y + 10.5, '#9ad8ff', 2.5, 'center');   // (· 43) табличка-голограма
    c.fillStyle = '#1a3a5a'; c.fillRect(x + 3, y + 12.6, w - 6, .5);
    const hv = HUM.v, hc = hv < .3 ? '#ff6a5a' : '#3be8ff'; c.fillStyle = hc; c.beginPath(); c.moveTo(x + 5, y + 15); c.lineTo(x + 7, y + 18.5); c.lineTo(x + 3, y + 18.5); c.closePath(); c.fill(); c.fillRect(x + 3, y + 18, 4, 1.5);   // крапля
    c.globalAlpha = .35 * a; c.fillRect(x + 9, y + 16, 16, 2.2); c.globalAlpha = a; c.fillRect(x + 9, y + 16, 16 * hv, 2.2);                                     // смуга вологості
    c.fillStyle = '#ffb04a'; c.fillRect(x + 30, y + 15, 2, 4); c.fillRect(x + 29.5, y + 18, 3, 1.5); c.globalAlpha = .35 * a; c.fillRect(x + 34, y + 16, 12, 2.2); c.globalAlpha = a; c.fillRect(x + 34, y + 16, 12 * (.55 + .05 * Math.sin(t * .3)), 2.2);   // температура
    c.strokeStyle = '#b8ff3a'; c.lineWidth = 1; c.beginPath(); c.arc(x + w - 4.5, y + 17, 2.4, -Math.PI / 2, -Math.PI / 2 + TAU * ((t * .02) % 1)); c.stroke();   // кільце таймера
    if (HUM.drip) { c.globalAlpha = .5 + .5 * Math.sin(t * 8); c.fillStyle = '#8ae8ff'; c.fillRect(x + 9, y + 20.5, 16, 1.2); }
    c.restore();
  }
  // ---------- гості: 2 метелики по квітах удень, колібрі-бражник, нічний метелик до квітки цереуса ----------
  const BUG = {}; function bug(kind) { if (BUG[kind]) return BUG[kind]; const S = 2, cv = document.createElement('canvas'); cv.width = 20 * S; cv.height = 12 * S; const c = cv.getContext('2d'); c.scale(S, S);
    if (kind === 'bfA' || kind === 'bfB') { const cc = kind === 'bfA' ? ['#ffb84a', '#ff6a30', '#2a1a10'] : ['#8ad8ff', '#4a6ae0', '#101a3a']; for (const sd of [-1, 1]) { c.fillStyle = cc[2]; c.beginPath(); c.ellipse(10 + sd * 4.2, 5, 4.6, 3.6, sd * .3, 0, TAU); c.fill(); c.fillStyle = cc[0]; c.beginPath(); c.ellipse(10 + sd * 4.2, 5, 3.4, 2.6, sd * .3, 0, TAU); c.fill(); c.fillStyle = cc[1]; c.beginPath(); c.ellipse(10 + sd * 3, 8, 2.4, 1.8, 0, 0, TAU); c.fill(); c.fillStyle = '#fff'; c.fillRect(10 + sd * 5 - .5, 3.5, 1, 1); } c.fillStyle = '#101018'; c.fillRect(9.5, 2, 1, 8); }
    if (kind === 'moth') { for (const sd of [-1, 1]) { c.fillStyle = '#2a2018'; c.beginPath(); c.ellipse(10 + sd * 4, 6, 4.4, 3, sd * .5, 0, TAU); c.fill(); c.fillStyle = '#9a8a60'; c.beginPath(); c.ellipse(10 + sd * 4, 6, 3.2, 2, sd * .5, 0, TAU); c.fill(); c.fillStyle = '#e8d8a0'; c.fillRect(10 + sd * 4 - .5, 5.5, 1, 1); } c.fillStyle = '#3a2a18'; c.fillRect(9, 3, 2, 7); }
    if (kind === 'hum' || kind === 'humW') { c.fillStyle = '#2a1a10'; c.beginPath(); c.ellipse(10, 7, 4.5, 2.4, 0, 0, TAU); c.fill(); c.fillStyle = '#8a6a3a'; c.beginPath(); c.ellipse(10, 7, 3.4, 1.6, 0, 0, TAU); c.fill(); c.fillStyle = '#ff7a30'; c.fillRect(11.5, 7.5, 2.5, 1); c.fillStyle = '#2a1a10'; c.fillRect(14.5, 6.5, 5, .8);   // тіло, помаранчеві задні крила, хоботок
      c.fillStyle = kind === 'hum' ? '#6a5a40' : '#c8b890'; c.beginPath(); c.ellipse(9, kind === 'hum' ? 3.5 : 5, 2.2, kind === 'hum' ? 3 : 1.4, .3, 0, TAU); c.fill(); }
    return BUG[kind] = cv; }
  const VIS = { tgt: null, t0: -9, from: null };
  function drawVisitors(c, t, night) {
    const day = 1 - night; c.save(); c.imageSmoothingEnabled = false;
    if (day > .05) { const pts = FL.flatMap(p => flowerPts(p, t)); if (pts.length) {
      for (let v = 0; v < 2; v++) { const T = 5.5, u = (t / T + v * .5), i = Math.floor(u), f = u - i, e = f * f * (3 - 2 * f), a = pts[(i * 5 + v * 3) % pts.length], b = pts[((i + 1) * 5 + v * 3) % pts.length], x = a[0] + (b[0] - a[0]) * e + Math.sin(t * 2.1 + v) * 1.5, y = a[1] + (b[1] - a[1]) * e - Math.sin(f * Math.PI) * 10 - 3, fr = Math.floor(t * 10 + v) % 2;   // метелик: від квітки до квітки дугою
        c.save(); c.globalAlpha = day; c.translate(x, y); if (b[0] < a[0]) c.scale(-1, 1); const k = fr ? .55 : 1; c.drawImage(bug(v ? 'bfB' : 'bfA'), -7 * k, -4.2, 14 * k, 8.4); c.restore(); }
      if (!VIS.tgt || t - VIS.t0 > 7) { VIS.from = VIS.tgt; VIS.tgt = pts[Math.floor(hash(Math.floor(t / 7), 1) * pts.length)]; VIS.t0 = t; }                  // бражник: зависає біля квітки, через 7 с — до іншої
      const q = VIS.tgt, f = Math.min(1, (t - VIS.t0) / 1.2), e = f * f * (3 - 2 * f), src = VIS.from || q, hx = src[0] + (q[0] - src[0]) * e - 9 + Math.sin(t * 7) * .6, hy = src[1] + (q[1] - src[1]) * e - 5 + Math.sin(t * 9) * .8;
      c.save(); c.globalAlpha = day; c.translate(hx, hy); c.drawImage(bug(Math.floor(t * 30) % 2 ? 'humW' : 'hum'), -7, -4.9, 14, 8.4); c.restore(); } }
    if (night > .05) { const cp = HEROES.find(p => p.kind === 'cereus'), bx = cp.x - 4, by = TOP() - cp.h * .7 + 2, a = t * 1.6, r = 7 + Math.sin(t * .9) * 3, x = bx + Math.cos(a) * r, y = by + Math.sin(a * 1.3) * r * .5 - 2;   // нічний метелик кружляє біля квітки цереуса
      c.globalAlpha = night; c.translate(x, y); if (Math.cos(a) < 0) c.scale(-1, 1); const k = Math.floor(t * 12) % 2 ? .6 : 1; c.drawImage(bug('moth'), -6.5 * k, -4, 13 * k, 7.8); }
    c.restore();
  }
  /** (· 39) Стельова рейка з LED і гачками, висячі рослини: гойдаються від гачка (зсув низу), вночі LED ярче. */
  function drawHanging(c, t, LK, night) {
    const { x0, x1, y } = RAIL; px(c, x0, y, x1 - x0, 3, '#0c1026'); px(c, x0, y + 3, x1 - x0, .8, '#2a3468');
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = .6 + .4 * night; for (let x = x0 + 6; x < x1 - 4; x += 11) px(c, x, y + 1.2, 2, .8, Math.floor(x / 11 + t * 2) % 7 === 0 ? '#ffffff' : '#3be8ff'); c.restore();
    for (const p of HANG) { const cv = spriteOf(p), S = cv.S, w = cv.width / S, h = cv.height / S, bx = cv.base[0] / S, by = cv.base[1] / S, sh = Math.sin(t * .55 + p.seed) * .022 + Math.sin(t * 1.7 + p.seed * 3) * .006;
      px(c, p.x - 1.5, y + 2, 3, 3, '#0c1026'); px(c, p.x - .8, y + 3, 1.6, 2, PAL.silver);                                                             // гачок
      c.save(); c.imageSmoothingEnabled = false; c.translate(p.x, HOOK_Y); c.transform(1, 0, sh, 1, 0, 0); c.drawImage(cv, -bx, -by, w, h);
      c.restore(); }   // (13.11) білий спалах-прямокутник при тапі прибрано (власник: «без обводок і рамок»)
  }
  // ---------- (· 41) ЖИТТЯ ЛИСТЯ: новий листок після поливу, пожовклий листок падає на кант, Nexi прибирає (prune); гекон; гроу-лампа; роса ----------
  const LEAFY = HEROES.filter(p => p.young), FALLEN = [], LIFE = { nextOld: 240 + Math.random() * 120 };
  function youngLeaf(c, k, lit) {                                                                                            // згорнутий молодий листок: конус, що розкривається (k 0..1)
    const L = 10 + 8 * k, w = 2 + 4 * k; c.lineCap = 'round'; c.lineJoin = 'round';
    for (const pass of [0, 1]) { c.fillStyle = pass ? (lit ? PAL.hi : PAL.d3) : PAL.out; const e = pass ? 0 : 1.2; c.beginPath(); c.moveTo(0, e); c.quadraticCurveTo(-w - e, -L * .5, -w * .3, -L - e); c.lineTo(w * .3, -L - e); c.quadraticCurveTo(w + e, -L * .5, 0, e); c.fill(); }
    c.strokeStyle = PAL.d2; c.lineWidth = .9; c.beginPath(); c.moveTo(0, -1); c.lineTo(0, -L * .9); c.stroke(); if (k > .5) { c.strokeStyle = PAL.cream; c.lineWidth = .7; c.beginPath(); c.moveTo(-w * .5, -L * .3); c.lineTo(-w * .7, -L * .7); c.stroke(); }
  }
  function oldLeaf(c, k) {                                                                                                   // пожовклий листок (k 0..1 — жовтіє далі й опускається)
    const L = 16, w = 5; c.lineJoin = 'round'; c.rotate(k * .5);
    for (const pass of [0, 1]) { c.fillStyle = pass ? (k < .5 ? '#c8c84a' : '#e8a83a') : PAL.out; const e = pass ? 0 : 1.3; c.beginPath(); c.moveTo(0, e); c.quadraticCurveTo(-w - e, -L * .4, 0, -L - e); c.quadraticCurveTo(w + e, -L * .4, 0, e); c.fill(); }
    c.fillStyle = '#8a5a2a'; for (let i = 0; i < 4; i++) c.fillRect(-2 + (i % 2) * 3, -L * .25 - i * 2.8, 1.2, 1.2); c.strokeStyle = '#8a7a2a'; c.lineWidth = .8; c.beginPath(); c.moveTo(0, -1); c.lineTo(0, -L * .9); c.stroke();
  }
  function lifeTick(t, dt) {
    for (const p of LEAFY) { if (p.old && !p.old.dropped && t - p.old.t0 > 70) { p.old.dropped = 1; FALLEN.push({ x: p.x + p.old.dx, y: TOP() + p.old.dy, y1: TOP() + 2 + Math.random() * 3, vx: (Math.random() - .5) * 8, t0: t, ph: Math.random() * TAU, land: 0 }); p.old = null; }
      if (p.young && t - p.young.t0 > 110) p.young = null; }
    if (t > LIFE.nextOld) { LIFE.nextOld = t + 240 + Math.random() * 180; const cand = LEAFY.filter(p => !p.old); if (cand.length && FALLEN.length < 3) { const p = cand[Math.floor(Math.random() * cand.length)]; p.old = { t0: t, dx: p.oldA[0], dy: p.oldA[1] }; } }
    for (const f of FALLEN) { if (f.land) continue; f.y += Math.min(10, 4 + (t - f.t0) * 6) * dt; f.x += (f.vx + Math.sin(t * 4 + f.ph) * 7) * dt; if (f.y >= f.y1) { f.y = f.y1; f.land = t; } }
  }
  function drawLife(c, t, LK) {
    const top = TOP();
    for (const p of LEAFY) { if (p.young) { const k = Math.min(1, (t - p.young.t0) / 90), a = t - p.young.t0 > 95 ? Math.max(0, 1 - (t - p.young.t0 - 95) / 15) : 1; c.save(); c.globalAlpha = a; c.translate(p.x + p.youngA[0], top + p.youngA[1]); c.rotate(p.youngA[2] + Math.sin(t * .9) * .04); c.scale(.6 + .4 * k, .6 + .4 * k); youngLeaf(c, k, !p.back); c.restore(); }
      if (p.old) { const k = Math.min(1, (t - p.old.t0) / 70); c.save(); c.translate(p.x + p.oldA[0], top + p.oldA[1]); c.rotate(p.oldA[2] + Math.PI + Math.sin(t * 1.3) * .05); oldLeaf(c, k); c.restore(); } }
    for (const f of FALLEN) { c.save(); c.translate(f.x, f.y); c.rotate(f.land ? 1.4 : Math.sin(t * 3 + f.ph) * .6); c.scale(.7, .7); oldLeaf(c, 1); c.restore(); }
    void LK;
  }
  // гекон: живе на ареці, повільно перелазить між трьома точками, підлаштовує колір під листя, язиком стріляє в метелика поруч
  const GK = { pts: [[-18, -38], [8, -58], [24, -30]], i: 0, j: 0, t0: -99, next: 30 + Math.random() * 20, tongue: -9 };
  const GECKO = [0, 1].map(f => { const cv = document.createElement('canvas'); cv.width = 36; cv.height = 16; const c = cv.getContext('2d'); c.scale(2, 2);
    c.fillStyle = PAL.out; c.beginPath(); c.ellipse(9, 4.5, 6.5, 2.6, 0, 0, TAU); c.fill(); c.beginPath(); c.ellipse(15.2, 4, 2.6, 2, 0, 0, TAU); c.fill(); c.beginPath(); c.moveTo(3, 4.5); c.quadraticCurveTo(-1, 2 + f * 3, 0.5, 7 - f * 3); c.lineWidth = 2.2; c.strokeStyle = PAL.out; c.stroke();
    c.fillStyle = '#7ac85a'; c.beginPath(); c.ellipse(9, 4.5, 5.5, 1.8, 0, 0, TAU); c.fill(); c.beginPath(); c.ellipse(15.2, 4, 1.9, 1.4, 0, 0, TAU); c.fill(); c.strokeStyle = '#7ac85a'; c.lineWidth = 1.1; c.beginPath(); c.moveTo(3.5, 4.5); c.quadraticCurveTo(-1, 2 + f * 3, 0.5, 7 - f * 3); c.stroke();
    c.fillStyle = '#4a8a3a'; for (let i = 0; i < 4; i++) c.fillRect(5 + i * 2.4, 3.6, 1, 1); c.fillStyle = PAL.out; for (const [x, y] of [[6, 6.2], [11.5, 6.2], [6.5 + f, 2.6], [12 - f, 2.6]]) { c.fillRect(x, y, .9, 1.6 - (y < 3 ? .9 : 0)); c.fillRect(x - .6, y + (y < 3 ? -.4 : 1.2), 2.1, .6); }
    c.fillStyle = '#101010'; c.fillRect(16.3, 3.2, 1, 1); c.fillStyle = '#ffffff'; c.fillRect(16.3, 3.2, .5, .5); return cv; });
  function drawGecko(c, t, night) {
    const A = HEROES.find(p => p.kind === 'areca'); if (!A) return; const top = TOP();
    if (t > GK.next) { GK.next = t + 35 + Math.random() * 25; GK.i = GK.j; GK.j = (GK.j + 1 + Math.floor(Math.random() * 2)) % 3; GK.t0 = t; }
    const u = Math.min(1, (t - GK.t0) / 7), e = u * u * (3 - 2 * u), a = GK.pts[GK.i], b = GK.pts[GK.j], x = A.x + a[0] + (b[0] - a[0]) * e, y = top + a[1] + (b[1] - a[1]) * e, moving = u < 1, fr = moving ? Math.floor(t * 6) % 2 : 0, dir = b[0] >= a[0] ? 1 : -1;
    c.save(); c.imageSmoothingEnabled = false; c.translate(x, y); if (dir < 0) c.scale(-1, 1); c.rotate(moving ? Math.atan2(b[1] - a[1], Math.abs(b[0] - a[0])) * .5 : 0); c.drawImage(GECKO[fr], -9, -4, 18, 8);
    c.globalCompositeOperation = 'source-atop'; c.globalAlpha = .35 + .25 * Math.sin(t * .3 + GK.j); c.fillStyle = night > .5 ? '#2a4a8a' : '#1a6a3a'; c.fillRect(-9, -4, 18, 8); c.restore();   // маскується під листя
    if (!moving && VIS.tgt && Math.hypot(VIS.tgt[0] - x, VIS.tgt[1] - y) < 26 && t - GK.tongue > 12 && hash(Math.floor(t), 3) < .02) GK.tongue = t;
    if (t - GK.tongue < .3) { const k = Math.sin((t - GK.tongue) / .3 * Math.PI), tx = x + dir * (8 + 18 * k), ty = y - 1 - 4 * k; c.save(); c.strokeStyle = '#ff6a8a'; c.lineWidth = 1; c.beginPath(); c.moveTo(x + dir * 8, y - 1); c.lineTo(tx, ty); c.stroke(); c.fillStyle = '#ff6a8a'; c.fillRect(tx - .8, ty - .8, 1.6, 1.6); c.restore(); }
  }
  /** Гроу-лампа на рейці (вночі): рожево-фіолетова смуга і рожевий відтінок на верхівках листя. */
  function drawGrowLamp(c, t, night) {
    if (night < .03) return; const { x0, x1, y } = RAIL; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = night * (.5 + .1 * Math.sin(t * 1.3)); px(c, x0 + 30, y + 3.5, x1 - x0 - 60, 1, '#ff4fd8'); c.restore();   // (· 45) лише смуга — без конуса й відтінку на листі (власник: рослини тьмяніли)
  }
  /** Роса на світанку: блискітки на квітках і листі, гаснуть із днем. */
  function drawDew(c, t) {
    const nm = NX.daylight && NX.daylight.name ? NX.daylight.name(t) : 'day'; if (nm !== 'dawn') return; const v = NX.daylight.v(t), a = Math.max(0, 1 - Math.abs(v - .45) / .4); if (a <= 0) return; const top = TOP();
    c.save(); c.globalCompositeOperation = 'lighter'; for (const p of HEROES) { if (p.hang) continue; for (let i = 0; i < 6; i++) { const x = p.x + (hash(p.seed, i) - .5) * p.w * .8, y = top - p.h * (.15 + .7 * hash(p.seed, i + 9)), tw = .5 + .5 * Math.sin(t * 3 + i * 1.7 + p.seed); c.globalAlpha = a * tw; c.fillStyle = '#e8ffff'; c.fillRect(x, y, 1, 1); c.globalAlpha = a * tw * .4; c.fillRect(x - 1, y, 3, 1); c.fillRect(x, y - 1, 1, 3); } } c.restore();
  }
  for (const p of LEAFY) { p.youngA = p.young; p.oldA = p.old; p.young = null; p.old = null; }                              // якорі → youngA/oldA; стан — young/old
  let lastT = 0;
  NX.planters = {
    JAR, HEROES, HANG, RAIL, PL: HEROES.concat(HANG), FLOWERS,
    tap(x, y) { let best = null; for (const p of HEROES) { const top = TOP(); if (x >= p.x - p.w / 2 && x <= p.x + p.w / 2 && y >= top - p.h && y <= top) { const d = Math.abs(x - p.x) / (p.w / 2); if (!best || d < best.d) best = { p, d }; } }
      if (!best) return false; hit = best.p.kind; best.p.flash = NX.time; if (FLOWERS.includes(hit)) shed(best.p, NX.time, 3); return true; },
    get lastKind() { return hit; },
    tapHang(x, y) { let best = null; for (const p of HANG) if (x >= p.x - p.w / 2 && x <= p.x + p.w / 2 && y >= HOOK_Y && y <= HOOK_Y + p.h) { const d = Math.abs(x - p.x) / (p.w / 2); if (!best || d < best.d) best = { p, d }; } if (!best) return false; hit = best.p.kind; best.p.flash = NX.time; return true; },
    sprite: spriteOf,
    /** Полив (Nexi, activities.js jardin): вологість повна, бутони, що чекали, одразу йдуть у розкривання; квіти «кивають» пелюстками. */
    water(t = NX.time) { HUM.v = 1; HUM.drip = 0; for (const p of LEAFY) if (!p.young && hash(Math.floor(t), p.seed) < .7) p.young = { t0: t + 20 + 40 * hash(p.seed, 5) }; for (const p of FL) { const u = ((t - p.t0) % PERIOD + PERIOD) % PERIOD / PERIOD; if (u < .15 || u >= .8) p.t0 = t - PERIOD * .15; shed(p, t, 2); } },
    hum() { return HUM.v; },
    /** (· 44) Nexi пересаджує: один із передніх малят (крім квітучих у повному цвіті) міняється на вид із ротації — калатея, алоказія,
     *  і назад на квітку; повертає {from, to} або null. */
    repot(t = NX.time) { const ROT = ['calathea', 'alocasia', 'saintpaulia', 'kalanchoe', 'viola', 'primula'], slots = HEROES.filter(p => p.slot); if (!slots.length) return null;
      const p = slots.reduce((a, b) => (a.rep || 0) <= (b.rep || 0) ? a : b), used = new Set(HEROES.map(q => q.kind)), cand = ROT.filter(k => !used.has(k)); if (!cand.length) return null;
      const to = cand[Math.floor(hash(Math.floor(t), p.seed) * cand.length)], from = p.kind; p.kind = to; p.rep = t; p.t0 = t - PERIOD * .1; p.young = null; p.flash = t; if (!FLOWERS.includes(to)) { p.w = 34; p.h = 30; } else { p.w = 30; p.h = 24; }
      if (FLOWERS.includes(to) && !FL.includes(p)) FL.push(p); if (!FLOWERS.includes(to)) { const i = FL.indexOf(p); if (i >= 0) FL.splice(i, 1); } hit = to; return { from, to }; },
    repotSpot() { const slots = HEROES.filter(p => p.slot), p = slots.reduce((a, b) => (a.rep || 0) <= (b.rep || 0) ? a : b), top = TOP(), z = NX.persp.zOf((352 - NX.persp.VP[1]) / (372 - NX.persp.VP[1])); return { x: p.x, y: top - 30, z, dir: p.x < 790 ? 1 : -1 }; },
    /** (· 42) Де Nexi сидить на канті: між філодендроном і арекою; hoverAt ставить її на точку (y — рівень канта, вона «сидить» на ньому). */
    sitSpot() { const top = TOP(), z = NX.persp.zOf((352 - NX.persp.VP[1]) / (372 - NX.persp.VP[1])); return { x: 764, y: top - 14, z, dir: 1 }; },
    /** (· 42) Рудик копає ґрунт: грудки летять, вологість трохи падає; Nexi (якщо вільна) свариться. */
    dig(x, t = NX.time) { for (let i = 0; i < 5; i++) PET.push({ x: x + (Math.random() - .5) * 4, y: TOP() + 1, vx: (Math.random() - .5) * 14, vy: -8 - Math.random() * 10, col: Math.random() < .5 ? '#3a2a18' : '#1c1410', t0: t - 6, ph: Math.random() * TAU }); HUM.v = Math.max(0, HUM.v - .05); },
    /** (· 41) Є пожовклий або опалий листок — Nexi йде з кошиком (activities.js prune). */
    needsPrune() { return FALLEN.length > 0 || LEAFY.some(p => p.old); },
    pruneSpot() { const p = LEAFY.find(q => q.old) || LEAFY[0], top = TOP(), z = NX.persp.zOf((352 - NX.persp.VP[1]) / (372 - NX.persp.VP[1])); return { x: p.x, y: top - 36, z, dir: p.x < 790 ? 1 : -1 }; },
    prune(t = NX.time) { let n = FALLEN.length; FALLEN.length = 0; for (const p of LEAFY) if (p.old) { p.old = null; n++; p.young = p.young || { t0: t + 10 }; } return n; },
    needsWater() { return HUM.v < .35 && !HUM.drip; },
    /** Струснути рослину (Рудик нюхає й чхає): пелюстки летять. */
    shake(kind, t = NX.time) { const p = FL.find(q => q.kind === kind) || FL[0]; shed(p, t, 8); p.flash = t; },
    /** Куди Nexi цілить лійкою: дві точки над жардиньєром (екран, од. кімнати) з глибиною задньої стіни. */
    waterSpots() { const top = TOP(), z = NX.persp.zOf((352 - NX.persp.VP[1]) / (372 - NX.persp.VP[1])); return [{ id: 'jarL', x: 724, y: top - 34, z, dir: 1 }, { id: 'jarR', x: 846, y: top - 34, z, dir: -1 }]; },
    /** Місце для Рудика на канті між віолою й примулою: точка на канті й точка підлоги перед диваном, звідки стрибати. */
    catSpot() { const x = 846, [fx, fy] = NX.cfg.sofaPt ? NX.cfg.sofaPt(x, 384) : [x, 384]; return { x, y: TOP() + 1, from: [fx, fy], flower: 'viola' }; },
  };
  NX.addObject({
    id: 'planters', span: [600, 950],
    drawBack(c, t) {
      const dt = Math.min(.1, Math.max(0, t - lastT)); lastT = t; tickLife(t, dt); lifeTick(t, dt);
      const LK = NX.decorLight ? NX.decorLight.k(t) : 1, vx0 = NX.cam.x - 80, vx1 = NX.cam.x + NX.cam.viewW + 80; if (JAR.x1 < vx0 || JAR.x0 > vx1) return;
      drawJar(c, t, LK);
      const top = TOP(), night = Math.max(0, Math.min(1, (LK - 1) / .7));
      c.save(); c.beginPath(); c.rect(JAR.x0 - 80, 0, JAR.x1 - JAR.x0 + 160, top + 1); c.clip();                           // нижче канта героїв не малюємо — вони «в ґрунті»
      for (const p of HEROES) { if (p.x + p.w < vx0 || p.x - p.w > vx1) continue; const cv = spriteOf(p, p.kind, FLOWERS.includes(p.kind) ? Math.round(stageOf(p, t) * (STAGES - 1)) : STAGES - 1), S = cv.S, w = cv.width / S, h = cv.height / S, bx = cv.base[0] / S, byy = cv.base[1] / S, sh = Math.sin(t * .7 + p.seed) * .012 + Math.sin(t * 1.9 + p.seed * 2) * .004;
        c.save(); c.imageSmoothingEnabled = false; c.translate(p.x, top); c.transform(1, 0, sh, 1, 0, 0);                   // легке погойдування: верх ходить, основа стоїть
        c.drawImage(cv, -bx, -byy, w, h);
        if (p.back) { c.globalAlpha = .12 + .05 * night; c.globalCompositeOperation = 'source-atop'; c.fillStyle = '#2a3a8a'; c.fillRect(-bx, -byy, w, h); }   // серпанок на задньому шарі — глибина
        if (p.kind === 'cereus' && night > .05) { const bl = spriteOf(p, 'cereusBloom'); c.globalAlpha = night; c.drawImage(bl, -bl.base[0] / S, -bl.base[1] / S, bl.width / S, bl.height / S); c.globalCompositeOperation = 'lighter'; c.globalAlpha = night * (.25 + .1 * Math.sin(t * 2)); c.fillStyle = '#fff6c0'; c.beginPath(); c.arc(-4, -p.h * .7 + 2, 9, 0, TAU); c.fill(); }   // (· 36) цереус квітне вночі
        c.restore(); }   // (13.11) білий спалах-прямокутник при тапі прибрано (власник: «без обводок і рамок»)
      drawLife(c, t, LK); drawGecko(c, t, night); drawPanel(c, t, LK); c.restore();
      drawPetals(c, t); drawVisitors(c, t, night); drawDew(c, t);
      if (night > .05) for (let i = 0; i < 7; i++) { const ph = t * (.25 + .08 * (i % 3)) + i * 1.7, x = JAR.x0 + 14 + ((i * 37 + Math.sin(ph) * 22 + 400) % (JAR.x1 - JAR.x0 - 28)), y = top - 24 - (i % 4) * 16 + Math.sin(ph * 1.6) * 9, a = night * (.35 + .65 * Math.max(0, Math.sin(ph * 3 + i)));   // світлячки над жардиньєром уночі
        c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a; c.fillStyle = '#c8ff6a'; c.fillRect(x, y, 1.4, 1.4); c.globalAlpha = a * .35; c.beginPath(); c.arc(x + .7, y + .7, 3.5, 0, TAU); c.fill(); c.restore(); }
      drawHanging(c, t, LK, night); drawGrowLamp(c, t, night);
    },
    /** Відблиск неону жардиньєра на спинці дивана (шар одразу після тіла дивана) — зв'язує рослини з кімнатою. */
    layers(t) { const SF = NX.cfg.SOFA || { y: 414, k: 1.13 }; return [{ y: SF.y - 24 + .5, draw: c => { const LK = NX.decorLight ? NX.decorLight.k(t) : 1, y0 = SF.y - 126 * SF.k + 2, x0 = Math.max(JAR.x0, 650), x1 = Math.min(JAR.x1, 900);
      c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createLinearGradient(0, y0, 0, y0 + 9); g.addColorStop(0, 'rgba(59,232,255,' + (.28 * Math.min(1.3, LK)) + ')'); g.addColorStop(1, 'rgba(59,232,255,0)'); c.fillStyle = g; c.fillRect(x0, y0, x1 - x0, 9); c.restore(); } }]; },
  });
})();
