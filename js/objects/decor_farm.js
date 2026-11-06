/* ============================================================================
 * objects/decor_farm.js — ВЕРТИКАЛЬНА ФЕРМА NEXI: живе (Декор стін · 13–· 14)
 * ----------------------------------------------------------------------------
 * Власник (03.11): на · 12 «не подобається той екран — що ще можна туди придумати» → «давай 7-й варіант» (ферма); на · 13 «воно
 * рівне, а має бути як та плитка в перспективі; камерки більше, покращити в три рази, вкласти душу». Рама й нерухоме нутро —
 * objects/dc_paint.js (st:dc_farm / farmPaint; розкладка — NX.arc.FARM і tools/wingbox/decor.py П2). Тут — те, що рухається, на
 * те саме полотно, що в акваріумів (objects/decor.js drawAq -> NX.decorFarm.draw), під маскою нутра без рами (стійки й кромки полиць
 * попереду; маніпулятор майстерні малюється поверх — він попереду):
 *   • ТРИ ЯРУСИ-КОНВЕЄРИ: лотки виїжджають із лівої шахти (СІВБА: насіння сиплеться з бункера, іскорка), їдуть праворуч і РОСТУТЬ
 *     дорогою (6 стадій), у правій шахті — ЗБІР (різак, спалах, листочки в кошик), назад повертаються ліфтом (сховано). Верхній ярус —
 *     швидкі трави й мікрозелень, середній — листові й коренеплоди, нижній — плодові. 21 лоток — 21 ВИД, кожен один раз
 *     (мікрозелень, м'ята, базилік, редис, горох, кріп, петрушка; салат, кейл, морква, полуниця, огірок, шпинат, рукола; томат
 *     чері, чилі, карликовий соняшник, лохина, баклажан, диня, лаванда); спрайти 32×30 піксель-артом з контуром.
 *   • САДІВНИК-РОБОТ на рейці під стелею верхнього ярусу: їздить, зупиняється над лотком, сканує рослину зеленим променем, кліпає;
 *     дві БДЖОЛИ-ДРОНИ у нижньому ярусі літають між квітучими рослинами й зависають над ними.
 *   • ФІТОЛАМПИ дихають (рожеве світло на кожен ярус), ТУМАН з форсунок, КРАПЛІ, рослини ледь гойдаються під вентиляцією.
 *   • тап по теплиці (objects/decor_live.js tap -> NX.decorFarm.tap) — хмарка туману від пальця, рослини поруч трусяться.
 * Координати: x — уздовж нутра (0..T, як у farmPaint), y — від низу кришки (0..H); -> світ -> екран: M (нижче). Усе — через кадр.
 * ========================================================================== */
(() => {
  const DC = NX.decor, FARM = NX.arc.FARM, VW = DC && DC.AQ && DC.AQ.farm; if (!DC || !FARM || !VW) return;
  const X = NX.px3d, hash = NX.art.hash, TAU = Math.PI * 2, D2R = Math.PI / 180, { sprite, glowSpr } = DC;
  /** Координати нутра -> світ: уздовж хорди сегмента при вставці P − .4, по висоті — від низу кришки (одна висота на всю теплицю). */
  const M = (() => { const segs = VW.segs, d0 = segs[0], y0 = d0.yta + d0.lid, H = (d0.yba - d0.base) - y0;
    const seg = segs.map(q => { const a = VW.pt(q, q.sa, q.P - .4, 0), b = VW.pt(q, q.sb, q.P - .4, 0), a1 = VW.pt(q, q.sa, q.P, 0), b1 = VW.pt(q, q.sb, q.P, 0), L = Math.hypot(b1[0] - a1[0], b1[2] - a1[2]);
      return { s0: q.i * L, len: Math.hypot(b[0] - a[0], b[2] - a[2]), a, b, n: [-q.sgn * Math.sin((q.sa + q.sb) / 2 * D2R), -Math.cos((q.sa + q.sb) / 2 * D2R)] }; });
    const W = (x, y, back = 0) => { let g = seg[0]; for (const q of seg) if (x >= q.s0) g = q; const u = Math.max(0, Math.min(1, (x - g.s0) / g.len));
      return [g.a[0] + (g.b[0] - g.a[0]) * u - g.n[0] * back, y0 + y, g.a[2] + (g.b[2] - g.a[2]) * u - g.n[1] * back]; };
    return { W, S: (x, y, back) => X.proj(W(x, y, back)), T: seg.reduce((m, g) => Math.max(m, g.s0 + g.len), 0), H, P: d0.P }; })();
  const T = M.T, H = M.H, SH = FARM.shaft, sOf = z => 520 / (520 + z), S = (x, y, b) => M.S(x, y, b), kAt = (x, y, b) => sOf(M.W(x, y, b)[2]);
  const quadF = (fx, pts, fill, a = 1, back = 0) => { fx.globalAlpha = a; fx.fillStyle = fill; fx.beginPath(); pts.forEach(([x, y], k) => { const p = S(x, y, back); k ? fx.lineTo(p[0], p[1]) : fx.moveTo(p[0], p[1]); }); fx.closePath(); fx.fill(); fx.globalAlpha = 1; };
  const MID = M.P / 2 - 1;                                                               // лотки стоять посередині глибини теплиці
  let TAP = null;

  // ---------- рослини: 14 видів × 6 стадій (кеш спрайтів 32×30; низ стебла — (16, 29)) ----------
  const ROWS = [['micro', 'mint', 'basil', 'radish', 'pea', 'dill', 'parsley'], ['lettuce', 'kale', 'carrot', 'strawberry', 'cucumber', 'spinach', 'arugula'], ['tomato', 'chili', 'sunflower', 'blueberry', 'eggplant', 'melon', 'lavender']];
  const G1 = '#2a8a3a', G2 = '#4ac84a', G3 = '#9aff6a', DG = '#1a5a2a', OUT = '#0c2a14';
  const leaf = (S, x, y, a, l, w, c1, c2, vein) => { const ex = x + Math.cos(a) * l, ey = y + Math.sin(a) * l, nx = -Math.sin(a) * w, ny = Math.cos(a) * w; S.tri([[x, y], [x + (ex - x) * .5 + nx, y + (ey - y) * .5 + ny], [ex, ey]], c1); S.tri([[x, y], [x + (ex - x) * .5 - nx, y + (ey - y) * .5 - ny], [ex, ey]], c2 || c1); if (vein) S.line(x, y, ex, ey, vein); };
  const stem = (S, x0, y0, x1, y1, c = DG, w = 1) => S.line(x0, y0, x1, y1, c, 255, w);
  const berry = (S, x, y, r, c, hi) => { S.ell(x, y, r, r, c); S.set(x - r * .4, y - r * .4, hi); };
  function drawPlant(S, kind, s) {                                                       // s — стадія 0..1 (розмір і деталі)
    const k = .32 + .68 * s, bx = 16, by = 29, ripe = s > .62, h = 19 * k;
    switch (kind) {
      case 'lettuce': for (let q = 0; q < 12; q++) { const a = -Math.PI + q / 12 * Math.PI, r = 7.5 * k; leaf(S, bx, by - 1, a, r + (q % 2) * 2.5, 3 * k, q % 2 ? G2 : G3, G1, q % 3 ? null : '#c8ff9a'); } S.ell(bx, by - 2.5 * k, 3.4 * k, 2.2 * k, '#d8ffb0'); S.ell(bx, by - 2.5 * k, 1.6 * k, 1 * k, G3); break;
      case 'basil': stem(S, bx, by, bx, by - h, DG, 2); for (let q = 0; q < 5; q++) { const y = by - h * (.25 + q * .18); leaf(S, bx, y, -2.6 + q * .05, 6 * k, 2.4 * k, G1, G2, '#1a6a2a'); leaf(S, bx, y - 1, -.55 - q * .05, 6 * k, 2.4 * k, G2, G1, '#1a6a2a'); } if (ripe) { S.ell(bx, by - h - 1.5, 2, 2.5, '#f0e8ff'); S.set(bx, by - h - 1, '#ffffff'); S.set(bx, by - h - 3, '#d8c8ff'); } break;
      case 'strawberry': for (let q = 0; q < 7; q++) { const a = -Math.PI + .25 + q / 6 * (Math.PI - .5); leaf(S, bx, by, a, 7 * k, 2.6 * k, q % 2 ? G1 : G2, DG); for (let w = 1; w < 4; w++) S.set(bx + Math.cos(a) * 7 * k * w / 4 + (w % 2 ? 1 : -1), by + Math.sin(a) * 7 * k * w / 4, G3); } if (ripe) for (const [dx, dy] of [[-6, -1.5], [4, -3], [0, -5.5], [-2, -3]]) { berry(S, bx + dx * k, by + dy * k, 2.2, '#ff3a4a', '#ffb0b8'); S.set(bx + dx * k + 1, by + dy * k + 1, '#ffe08a'); S.set(bx + dx * k - 1, by + dy * k - 2.4, '#3bff8a'); S.set(bx + dx * k + 1, by + dy * k - 2.4, '#3bff8a'); } else if (s > .35) { S.set(bx - 3, by - 4, '#ffffff'); S.set(bx + 4, by - 5, '#ffffff'); S.set(bx + 4, by - 6, '#ffe08a'); } break;
      case 'tomato': { const tx = bx + 2; stem(S, bx, by, tx, by - h, DG, 2); S.line(bx - 7, by, bx - 7, by - h - 1, '#8a7a5a'); S.line(bx + 8, by, bx + 8, by - h - 1, '#8a7a5a');   // стебло на шпалері
        for (let q = 0; q < 4; q++) { const y = by - h * (.28 + q * .2); leaf(S, bx + 1, y, -2.4 - q * .12, 7 * k, 2 * k, G1, G2, '#1a6a2a'); leaf(S, tx, y - 1.2, -.7 + q * .08, 6 * k, 2 * k, G2, G1, '#1a6a2a'); }
        if (ripe) for (const [dx, dy] of [[-4, -8], [-1, -11], [4, -7], [6, -12], [1, -5]]) berry(S, bx + dx * k, by + dy * k, 2.1, s > .85 ? '#ff4a2a' : '#ffa03a', '#ffd0b0'); else if (s > .4) for (const [dx, dy] of [[-3, -8], [4, -7]]) S.set(bx + dx * k, by + dy * k, '#ffe08a'); break; }
      case 'chili': stem(S, bx, by, bx, by - h * .8, DG, 2); for (let q = 0; q < 7; q++) { const a = -Math.PI * .92 + q * .3; leaf(S, bx, by - h * .5, a, 7 * k, 2 * k, q % 2 ? G1 : G2, DG, '#1a6a2a'); } if (ripe) for (const [dx, dy, c] of [[-6, -4, '#ff3a2a'], [5, -3, '#ffd23a'], [0, -1, '#ff6a2a'], [-3, -7, '#ff3a2a']]) { S.line(bx, by - h * .5, bx + dx * k, by + dy * k, DG); S.line(bx + dx * k, by + dy * k, bx + dx * k * 1.3, by + dy * k + 4.5, c, 255, 3); S.set(bx + dx * k * 1.3 - 1, by + dy * k + 1, '#fff0d0'); } else if (s > .4) { S.set(bx - 4, by - 7, '#ffffff'); S.set(bx + 3, by - 8, '#ffffff'); } break;
      case 'mint': for (let q = 0; q < 4; q++) { const x0 = bx + (q - 1.5) * 4 * k; stem(S, x0, by, x0, by - h * (.65 + .12 * (q % 2)), DG); for (let w = 0; w < 4; w++) { const y = by - h * (.18 + w * .18); S.ell(x0 - 2.6 * k, y, 2.6 * k, 1.6 * k, w % 2 ? G3 : G2); S.ell(x0 + 2.6 * k, y - .8, 2.6 * k, 1.6 * k, w % 2 ? G2 : G3); S.set(x0 - 2.6 * k, y, G1); S.set(x0 + 2.6 * k, y - .8, G1); } } break;
      case 'micro': for (let q = 0; q < 24 * k + 6; q++) { const x = bx - 10 + q * (20 / (24 * k + 6)), hh = (5 + 4 * hash(q, 3)) * (.45 + .55 * s); stem(S, x, by, x + (hash(q, 5) - .5) * 2.5, by - hh, q % 4 ? G2 : '#7adf5a'); S.ell(x + (hash(q, 5) - .5) * 2.5, by - hh - 1, 1.2, .9, q % 3 ? G3 : '#e8ffb0'); } break;
      case 'kale': for (let q = 0; q < 10; q++) { const a = -Math.PI + .15 + q / 9 * (Math.PI - .3), l = 8.5 * k + (q % 2) * 1.5; leaf(S, bx, by, a, l, 3.2 * k, q % 2 ? '#7a3aa8' : '#5a2a8a', '#2a6a4a', '#c88aff'); for (let w = 2; w < 6; w++) S.set(bx + Math.cos(a) * l * w / 6 + Math.sin(a) * (w % 2 ? 2.4 : -2.4) * k, by + Math.sin(a) * l * w / 6 - Math.cos(a) * (w % 2 ? 2.4 : -2.4) * k, '#c88aff'); } break;
      case 'sunflower': stem(S, bx, by, bx, by - h, DG, 2); leaf(S, bx, by - h * .35, -2.5, 7 * k, 2.8 * k, G1, G2, '#1a6a2a'); leaf(S, bx, by - h * .6, -.6, 7 * k, 2.8 * k, G2, G1, '#1a6a2a'); if (ripe) { for (let q = 0; q < 14; q++) { const a = q / 14 * TAU; S.ell(bx + Math.cos(a) * 4.6, by - h - 1.5 + Math.sin(a) * 4.6, 1.9, 1.9, q % 2 ? '#ffd23a' : '#ffb01a'); } S.ell(bx, by - h - 1.5, 3, 3, '#5a3a1a'); for (let q = 0; q < 6; q++) S.set(bx - 2 + (q % 3) * 2, by - h - 2.5 + (q >> 1 & 1) * 2, '#8a6a3a'); } else S.ell(bx, by - h - 1.5, 2.2, 2.2, s > .4 ? '#a0d040' : G2); break;
      case 'blueberry': for (let q = 0; q < 5; q++) { const a = -Math.PI * .88 + q * .19, ex = bx + Math.cos(a) * h, ey = by + Math.sin(a) * h; stem(S, bx, by, ex, ey, '#5a4a2a'); for (let w = 0; w < 3; w++) leaf(S, bx + (ex - bx) * (.35 + w * .3), by + (ey - by) * (.35 + w * .3), a + (w % 2 ? 1.2 : -1.2), 3.4 * k, 1.3 * k, G1, G2); if (ripe) { berry(S, ex, ey - 1, 1.7, '#3a4ad8', '#9ab0ff'); berry(S, ex - 2, ey + 1, 1.3, '#2a3ab8', '#8aa0ff'); } else if (s > .4) S.set(ex, ey - 1, '#f0f0ff'); } break;
      case 'cucumber': stem(S, bx - 8, by, bx + 8, by - h, DG, 2); S.line(bx - 9, by, bx + 9, by - h - 1, '#8a7a5a'); for (let q = 0; q < 4; q++) { const u = .15 + q * .25, x = bx - 8 + 16 * u, y = by - h * u; S.ell(x, y - 2.5, 3.6 * k, 3 * k, q % 2 ? G2 : G1); S.set(x, y - 2.5, DG); S.set(x - 1, y - 3.5, G3); } if (ripe) { for (const [u, l] of [[.45, 7], [.8, 5]]) { const x = bx - 8 + 16 * u + 2, y = by - h * u; S.line(x, y, x, y + l, '#2a9a3a', 255, 3); S.set(x - 1, y + 2, '#9aff9a'); S.set(x, y + l, '#1a6a2a'); } } else if (s > .4) S.ell(bx, by - h * .5, 1.5, 1.5, '#ffe08a'); break;
      case 'carrot': for (let q = 0; q < 9; q++) { const a = -Math.PI * .92 + q * .24, l = h * (.6 + .4 * hash(q, 7)); stem(S, bx, by - 1, bx + Math.cos(a) * l, by - 1 + Math.sin(a) * l, q % 2 ? G2 : G3); for (let w = 1; w < 5; w++) { S.set(bx + Math.cos(a) * l * w / 5 + (w % 2 ? 1.4 : -1.4), by - 1 + Math.sin(a) * l * w / 5, G3); S.set(bx + Math.cos(a) * l * w / 5 + (w % 2 ? -1.4 : 1.4), by - 1 + Math.sin(a) * l * w / 5 - 1, G2); } } if (ripe) { S.ell(bx, by, 3, 1.6, '#ff8a2a'); S.set(bx - 1, by - 1, '#ffb060'); S.set(bx + 1, by, '#e86a1a'); } break;
      case 'radish': for (let q = 0; q < 6; q++) { const a = -Math.PI * .88 + q * .3; S.ell(bx + Math.cos(a) * 5.5 * k, by - 2.5 + Math.sin(a) * 5.5 * k, 3.2 * k, 2.4 * k, q % 2 ? G2 : G1); S.set(bx + Math.cos(a) * 5.5 * k, by - 2.5 + Math.sin(a) * 5.5 * k, G3); stem(S, bx, by, bx + Math.cos(a) * 4 * k, by - 2.5 + Math.sin(a) * 4 * k, '#c84a8a'); } if (ripe) { S.ell(bx, by, 3.2, 2.2, '#e83a7a'); S.set(bx - 1, by - 1, '#ff9ac8'); S.set(bx + 1, by + 1, '#b82a5a'); } break;
      case 'pea': { const tx = bx - 5, ty = by - h - 2; S.line(tx, by, tx, ty, '#8a7a5a'); S.line(tx + 10, by, tx + 10, ty, '#8a7a5a'); S.line(tx, ty, tx + 10, ty, '#8a7a5a'); S.line(tx, by - h * .5, tx + 10, by - h * .5, '#8a7a5a');
        for (let q = 0; q < 9 * k + 3; q++) { const y = by - q * 2.1, x = tx + 5 + Math.sin(q * 1.3) * 4.5; S.set(x, y, G2); S.set(x + 1, y - 1, G3); S.set(x - 1, y - 1, G2); S.set(x + 2, y, G1); }
        if (ripe) for (const [dx, dy] of [[-3, -9], [5, -13], [2, -5], [-5, -15]]) { S.line(bx + dx, by + dy, bx + dx + 1, by + dy + 4.5, '#5ad84a', 255, 3); S.set(bx + dx, by + dy + 1, '#c8ff9a'); S.set(bx + dx + 1, by + dy + 3, '#c8ff9a'); } else if (s > .4) { S.set(bx - 2, by - 8, '#ffffff'); S.set(bx + 4, by - 12, '#f0e0ff'); } break; }
      case 'dill': for (let q = 0; q < 7; q++) { const a = -Math.PI * .9 + q * .27, l = h * (.7 + .3 * hash(q, 8)), ex = bx + Math.cos(a) * l, ey = by + Math.sin(a) * l; stem(S, bx, by, ex, ey, '#4a9a3a'); for (let w = 0; w < 6; w++) { const b = a + (w % 2 ? .5 : -.5); S.set(ex + Math.cos(b) * (1 + w % 3), ey + Math.sin(b) * (1 + w % 3), w % 2 ? '#8ad860' : '#c8f080'); } if (ripe && q % 2) for (let w = 0; w < 5; w++) S.set(ex + (w - 2) * 1.2, ey - 1 - (w % 2), '#ffe060'); } break;
      case 'parsley': for (let q = 0; q < 8; q++) { const a = -Math.PI * .92 + q * .25, l = h * (.55 + .4 * hash(q, 6)), ex = bx + Math.cos(a) * l, ey = by + Math.sin(a) * l; stem(S, bx, by, ex, ey, '#3a8a3a'); S.ell(ex, ey, 2.4 * k, 1.8 * k, (x, y, u, v) => ((x + y) % 2) ? '#2a9a3a' : '#5ad85a'); S.set(ex, ey - 2 * k, '#8aff8a'); S.set(ex + 2 * k, ey, '#8aff8a'); } break;
      case 'spinach': for (let q = 0; q < 9; q++) { const a = -Math.PI + .2 + q / 8 * (Math.PI - .4), l = 7 * k + (q % 2) * 2; stem(S, bx, by, bx + Math.cos(a) * l * .5, by + Math.sin(a) * l * .5, '#8ad860'); S.ell(bx + Math.cos(a) * l, by + Math.sin(a) * l, 3.4 * k, 2.6 * k, q % 2 ? '#1a7a3a' : '#2a9a4a'); S.line(bx + Math.cos(a) * l * .5, by + Math.sin(a) * l * .5, bx + Math.cos(a) * l * 1.3, by + Math.sin(a) * l * 1.3, '#9adf8a'); } break;
      case 'arugula': for (let q = 0; q < 9; q++) { const a = -Math.PI + .15 + q / 8 * (Math.PI - .3), l = 8.5 * k + (q % 2) * 1.5; stem(S, bx, by, bx + Math.cos(a) * l, by + Math.sin(a) * l, '#3a9a4a'); for (let w = 1; w < 6; w++) { const px = bx + Math.cos(a) * l * w / 6, py = by + Math.sin(a) * l * w / 6, sz = (w % 2 ? 2.2 : 1.4) * k; S.ell(px + Math.sin(a) * sz, py - Math.cos(a) * sz, sz, sz * .7, '#4ab85a'); S.ell(px - Math.sin(a) * sz, py + Math.cos(a) * sz, sz, sz * .7, '#5ad86a'); } } if (ripe) { S.set(bx - 3, by - h - 1, '#ffffff'); S.set(bx + 4, by - h, '#ffffff'); S.set(bx + 4, by - h - 1, '#fff0a0'); } break;
      case 'eggplant': stem(S, bx, by, bx, by - h, '#5a3a6a', 2); for (let q = 0; q < 4; q++) { const y = by - h * (.3 + q * .2); leaf(S, bx, y, -2.5 + q * .1, 8 * k, 3 * k, '#2a6a4a', '#3a8a5a', '#8a6aa8'); leaf(S, bx, y - 1.5, -.6 - q * .1, 7 * k, 2.8 * k, '#3a8a5a', '#2a6a4a', '#8a6aa8'); } if (ripe) for (const [dx, dy] of [[-5, -7], [4, -5]]) { S.line(bx, by - h * .55, bx + dx * k, by + dy * k, '#5a3a6a'); S.ell(bx + dx * k, by + dy * k + 3, 2.4, 4, '#4a1a7a'); S.set(bx + dx * k - 1, by + dy * k + 1, '#9a6ad8'); S.set(bx + dx * k, by + dy * k - 1, '#3a9a5a'); } else if (s > .4) { S.ell(bx - 4, by - h * .6, 1.6, 1.6, '#b08ad8'); S.set(bx - 4, by - h * .6, '#ffe08a'); } break;
      case 'melon': stem(S, bx - 10, by, bx + 10, by - h * .45, DG, 2); for (let q = 0; q < 4; q++) { const u = .1 + q * .27, x = bx - 10 + 20 * u, y = by - h * .45 * u; S.ell(x, y - 2.5, 3.6 * k, 3 * k, q % 2 ? G2 : G1); S.set(x, y - 2.5, DG); S.set(x - 1, y - 3.5, G3); } if (ripe) { S.ell(bx + 3, by - 4, 5.5, 4.5, (x, y, u, v) => Math.abs(Math.sin(u * 5)) < .3 ? '#1a6a2a' : '#4ab84a'); S.set(bx + 1, by - 7, '#c8ff9a'); S.set(bx + 3, by - 8.5, '#8a6a3a'); } else if (s > .4) { S.ell(bx + 2, by - 4, 1.8, 1.6, '#ffe060'); S.set(bx + 2, by - 4, '#c8a020'); } break;
      case 'lavender': for (let q = 0; q < 7; q++) { const x0 = bx + (q - 3) * 2.6 * k, hh = h * (.75 + .25 * hash(q, 4)); stem(S, x0, by, x0 + (q - 3) * .4, by - hh, '#6a8a6a'); for (let w = 0; w < 3; w++) S.set(x0 + (w % 2 ? 1 : -1), by - hh * (.2 + w * .15), '#8ab08a'); if (s > .45) for (let w = 0; w < 5 * Math.min(1, s + .2); w++) { S.set(x0 + (q - 3) * .4 + (w % 2 ? .8 : -.8), by - hh + 2 - w * 1.4, w % 2 ? '#b07aff' : '#8a4ae8'); S.set(x0 + (q - 3) * .4, by - hh + 2 - w * 1.4, '#d8b0ff'); } } break;
    }
    void OUT;
  }
  const PS = {}; const plantSpr = (kind, s) => { const st = Math.min(5, Math.floor(s * 6)), key = kind + st; return PS[key] || (PS[key] = sprite(32, 30, S => drawPlant(S, kind, (st + .5) / 6), true)); };

  // ---------- лотки: три конвеєри від сівби (ліва шахта) до збору (права) ----------
  const X0 = SH + FARM.trayW / 2 + 1, X1 = T - SH - FARM.trayW / 2 - 1, RUN = X1 - X0, HID = 46;                           // HID — сховано в ліфті (од. шляху)
  const SPEED = [1.9, 1.5, 1.25], LOOP = RUN + HID;
  const TR = []; ROWS.forEach((kinds, row) => kinds.forEach((kind, j) => TR.push({ kind, row, k: TR.length, off: j / kinds.length * LOOP + hash(row, 2) * 9, sway: hash(TR.length, 9) * TAU })));
  /** Де лоток у час t: { x, y (низ лотка), row, s — стадія, hide, sow — фаза сівби (0..1), harv — фаза збору (0..1) }. */
  function trayAt(tr, t) {
    const p = (((tr.off + t * SPEED[tr.row]) % LOOP) + LOOP) % LOOP, y = FARM.rowY(H, tr.row);
    if (p < RUN) return { x: X0 + p, y, row: tr.row, s: .04 + .96 * (p / RUN), hide: 0, sow: p < 8 ? p / 8 : -1, harv: p > RUN - 10 ? (p - RUN + 10) / 10 : -1 };
    return { x: X1 + 3, y, row: tr.row, s: 1, hide: 1, sow: -1, harv: -1 };
  }
  function drawTray(fx, tr, t) {
    const A = trayAt(tr, t); if (A.hide) return A;
    const w = FARM.trayW, hh = FARM.trayH, x = A.x, y = A.y, e = 1;                                                      // біля шахт лоток заходить ЗА стінку шахти (clip у draw — різко, без «танення»)
    quadF(fx, [[x - w / 2, y - hh], [x + w / 2, y - hh], [x + w / 2 - .7, y], [x - w / 2 + .7, y]], '#2a3038', e, MID);               // лоток
    quadF(fx, [[x - w / 2 + 1, y - hh], [x + w / 2 - 1, y - hh], [x + w / 2 - 1.2, y - hh + 1.2], [x - w / 2 + 1.2, y - hh + 1.2]], '#5a3a22', e, MID);   // субстрат
    quadF(fx, [[x - w / 2, y - hh], [x + w / 2, y - hh], [x + w / 2, y - hh + .45], [x - w / 2, y - hh + .45]], '#7a8a9a', e, MID);
    quadF(fx, [[x - w / 2 + 2, y - .9], [x + w / 2 - 2, y - .9], [x + w / 2 - 2.2, y - .4], [x - w / 2 + 2.2, y - .4]], '#3bff8a', e * .8, MID);   // смужка-індикатор лотка
    const sp = plantSpr(tr.kind, A.s), p = S(x, y - hh + .7, MID), k = kAt(x, y, MID), sc = (18 + 10 * Math.min(1, A.s + .25)) * k / 32;   // рослина: ширина 18–28 од.
    const boost = TAP && Math.abs(TAP.fx - x) < 34 && t - TAP.t0 < 1.6 ? 1 - (t - TAP.t0) / 1.6 : 0, sw = Math.sin(t * 1.7 + tr.sway) * .03 + boost * Math.sin(t * 22) * .12;
    fx.save(); fx.globalAlpha = e; fx.translate(p[0], p[1]); fx.rotate(sw); fx.drawImage(sp.cv, -16 * sc, -29 * sc, 32 * sc, 30 * sc); fx.restore();
    return A;
  }
  // ---------- садівник-робот, бджоли-дрони ----------
  const BOT = sprite(20, 14, S => { S.ell(10, 8, 6, 4.5, (x, y, u, v) => v < -.3 ? '#f0f4ff' : v < .4 ? '#c8d0ec' : '#8a92b8'); for (let x = 8; x < 14; x++) S.set(x, 7, '#101830'); S.set(10, 7, '#3bff8a'); S.set(12, 7, '#9af6ff');   // корпус, візор
    S.line(10, 0, 10, 4, '#6a7298'); S.set(9, 0, '#3a4268'); S.set(11, 0, '#3a4268'); S.line(4, 9, 1, 12, '#6a7298'); S.line(16, 9, 19, 12, '#6a7298'); S.set(1, 13, '#3be8ff'); S.set(19, 13, '#3be8ff'); S.ell(10, 12.5, 2, 1.2, '#3a4268'); });   // кріплення до рейки, руки-манипулятори, сканер
  const BEE = [0, 1].map(f => sprite(10, 8, S => { S.ell(5, 5, 3.4, 2.4, (x, y, u, v) => ((x + 10) % 3) ? '#ffd23a' : '#1a1a1a'); S.set(2, 4, '#101018'); S.ell(4, 2 - f, 2.2, 1.1, '#d8f0ff', 170); S.ell(7, 2 - f, 2.2, 1.1, '#d8f0ff', 170); S.set(9, 5, '#3be8ff'); }));
  function botAt(t) { const c = (t * .055) % 2, u = c < 1 ? c : 2 - c, stops = 6, q = u * stops, i = Math.floor(q), f = q - i, e = f < .7 ? 0 : (f - .7) / .3, uu = (i + e * e * (3 - 2 * e)) / stops;   // їде з зупинками над лотками
    return { x: SH + 12 + (T - 2 * SH - 24) * uu, y: 3.2, scan: f < .7 ? f / .7 : -1, dir: c < 1 ? 1 : -1 }; }
  function drawBot(fx, t) {
    const B = botAt(t), p = S(B.x, B.y, MID), k = kAt(B.x, B.y, MID), w = 11 * k, h = w * BOT.cv.height / BOT.cv.width;
    if (B.scan >= 0) { const yb = FARM.rowY(H, 0) - 2, q = S(B.x, yb, MID), g = .5 + .5 * Math.sin(B.scan * Math.PI);                 // сканує рослину під собою: зелений віяло-промінь
      fx.save(); fx.globalCompositeOperation = 'lighter'; fx.globalAlpha = .28 * g; fx.fillStyle = '#3bff8a'; fx.beginPath(); fx.moveTo(p[0], p[1] + h * .4); fx.lineTo(q[0] - 7 * k, q[1]); fx.lineTo(q[0] + 7 * k, q[1]); fx.closePath(); fx.fill();
      fx.globalAlpha = .9 * g; fx.fillStyle = '#9affb0'; const sy = p[1] + h * .4 + (q[1] - p[1] - h * .4) * ((t * 1.4) % 1); fx.fillRect(q[0] - 6 * k, sy, 12 * k, .4); fx.restore(); }
    fx.save(); fx.translate(p[0], p[1]); if (B.dir < 0) fx.scale(-1, 1); fx.drawImage(BOT.cv, -w / 2, 0, w, h); fx.restore();
    fx.fillStyle = Math.floor(t * 2) % 2 ? '#3bff8a' : '#14602e'; fx.fillRect(p[0] - .3, p[1] + h * .55, .6, .6);
  }
  const BEES = [{ sd: 1, row: 2 }, { sd: 2, row: 2 }];
  function drawBees(fx, t) {
    for (const b of BEES) { const yb = FARM.rowY(H, b.row), c = (t * .07 + b.sd * .5) % 1, i = Math.floor((t * .07 + b.sd * .5)), x0 = SH + 20 + hash(i, b.sd) * (T - 2 * SH - 40), x1 = SH + 20 + hash(i + 1, b.sd) * (T - 2 * SH - 40), e = c < .6 ? 0 : (c - .6) / .4, ee = e * e * (3 - 2 * e);
      const x = x0 + (x1 - x0) * ee + Math.sin(t * 3 + b.sd) * 1.2, y = yb - 14 - Math.abs(Math.sin(t * 2.3 + b.sd)) * 3 - (c < .6 ? 0 : Math.sin(e * Math.PI) * 6), p = S(x, y, MID - 3), k = kAt(x, y, MID - 3), w = 5 * k, h = w * .8;
      fx.save(); fx.translate(p[0], p[1]); if (x1 < x0 && e > 0) fx.scale(-1, 1); fx.drawImage(BEE[Math.floor(t * 18) % 2].cv, -w / 2, -h / 2, w, h); fx.restore(); }
  }
  // ---------- світло, туман, краплі, сівба, збір ----------
  const MIST = glowSpr('#d8f4ff', 5), LAMP = glowSpr('#ff4fd8', 9), GRAD = new WeakMap();
  const NOZ = []; for (let x = SH + FARM.nozzle / 2; x < T - SH; x += FARM.nozzle) NOZ.push(x);
  function lampsLive(fx, t) {
    fx.save(); fx.globalCompositeOperation = 'lighter';
    let gs = GRAD.get(fx); if (!gs) { gs = []; for (let k = 0; k < FARM.tiers; k++) { const y0 = FARM.tierY(H, k) + (k ? FARM.shelf : 0), y1 = FARM.rowY(H, k), p0 = S(SH + 1, y0, MID), p1 = S(T - SH - 1, y1, MID), g = fx.createLinearGradient(0, p0[1], 0, p1[1]); g.addColorStop(0, 'rgba(255,79,216,.42)'); g.addColorStop(.5, 'rgba(200,80,255,.16)'); g.addColorStop(1, 'rgba(120,60,255,0)'); gs.push(g); } GRAD.set(fx, gs); }
    for (let k = 0; k < FARM.tiers; k++) { const y0 = FARM.tierY(H, k) + (k ? FARM.shelf : 0), y1 = FARM.rowY(H, k); fx.globalAlpha = .75 + .2 * Math.sin(t * .9 + k * 2);   // фітосвітло дихає
      fx.fillStyle = gs[k]; fx.beginPath(); [[SH + 1, y0], [T - SH - 1, y0], [T - SH - 1, y1], [SH + 1, y1]].forEach(([x, y], q) => { const p = S(x, y, MID); q ? fx.lineTo(p[0], p[1]) : fx.moveTo(p[0], p[1]); }); fx.closePath(); fx.fill();
      for (let q = 0; q < NOZ.length; q++) { const p = S(NOZ[q], y0 + 1, MID), kk = kAt(NOZ[q], y0, MID), r = LAMP.r * kk * (.8 + .1 * Math.sin(t * 2 + q + k)); fx.globalAlpha = .26; fx.drawImage(LAMP.cv, p[0] - r, p[1] - r * .4, r * 2, r); } }
    fx.restore();
  }
  function mistLive(fx, t) {
    fx.save(); fx.globalCompositeOperation = 'lighter';
    for (let k = 0; k < FARM.tiers; k++) { const py = FARM.tierY(H, k) + 6, yb = FARM.rowY(H, k);
      for (let q = 0; q < NOZ.length; q++) { const per = 7 + ((q + k) % 3), ph = ((t + q * 1.7 + k * 3.1) % per); if (ph < 2.4)                       // форсунка раз на per с — 2.4 с туману
        for (let m = 0; m < 6; m++) { const f = Math.min(1, Math.max(0, (ph - m * .12) / 2.2)); if (f <= 0 || f >= 1) continue; const dx = (hash(m + q * 7, 4) - .5) * 16 * f, dy = 1.5 + f * 10 + Math.sin(t * 2 + m) * .5, x = NOZ[q] + dx, y = py + dy, p = S(x, y, MID), r = MIST.r * kAt(x, y, MID) * (.5 + f);
          fx.globalAlpha = .26 * (1 - f) * Math.min(1, f * 4); fx.drawImage(MIST.cv, p[0] - r, p[1] - r * .7, r * 2, r * 1.4); }
        const dp = (t * .9 + q * .37 + k) % 3; if (dp < 1) { const y = py + 1.5 + dp * dp * (yb - 4 - py), p = S(NOZ[q], y, MID);                      // крапля з форсунки
          fx.globalAlpha = .9; fx.fillStyle = '#c8f4ff'; fx.fillRect(p[0] - .25, p[1] - .5, .5, 1); fx.fillStyle = '#ffffff'; fx.fillRect(p[0] - .12, p[1] - .5, .25, .3); } } }
    if (TAP) { const a = t - TAP.t0; if (a > 1.6) TAP = null; else for (let m = 0; m < 9; m++) { const f = Math.min(1, Math.max(0, (a - m * .05) / 1.4)); if (f <= 0 || f >= 1) continue; const ang = hash(m, 11) * TAU, r0 = f * (6 + 8 * hash(m, 12)), x = TAP.fx + Math.cos(ang) * r0, y = TAP.fy + Math.sin(ang) * r0 * .6 - f * 3, p = S(x, y, MID), r = MIST.r * kAt(x, y, MID) * (.6 + f);   // тап — хмарка від пальця
      fx.globalAlpha = .4 * (1 - f); fx.drawImage(MIST.cv, p[0] - r, p[1] - r * .7, r * 2, r * 1.4); } }
    fx.restore();
  }
  /** Сівба (ліва шахта): насіння сиплеться з бункера в лоток, іскорка; збір (права): різак блимає, листочки летять у кошик. */
  function stationFx(fx, A, t, tr) {
    if (!A || A.hide) return; const yb = A.y, yt = FARM.tierY(H, A.row);
    if (A.sow >= 0 && A.sow < 1) { const f = A.sow, x = SH + 4; fx.save();
      for (let q = 0; q < 6; q++) { const g = ((f * 1.6 + q * .17) % 1), p = S(x + (hash(q, 13) - .5) * 3 + 2, yt + 9 + g * (yb - yt - 12), MID); fx.globalAlpha = .9 * (1 - g * .3); fx.fillStyle = q % 2 ? '#e8d090' : '#c8a060'; fx.fillRect(p[0] - .35, p[1] - .35, .7, .7); }   // насіння
      const p = S(A.x, yb - FARM.trayH - 1, MID), k = kAt(A.x, yb, MID); fx.globalCompositeOperation = 'lighter'; fx.globalAlpha = .6 * Math.sin(f * Math.PI); fx.fillStyle = '#9aff9a'; fx.fillRect(p[0] - 2 * k, p[1] - .3, 4 * k, .6); fx.restore(); }
    if (A.harv >= 0 && A.harv < 1) { const f = A.harv, cx = T - SH - 2, p = S(cx, yt + 6, MID), k = kAt(cx, yt, MID); fx.save(); fx.globalCompositeOperation = 'lighter';
      fx.globalAlpha = .7 * (Math.floor(t * 8) % 2 ? 1 : .4); fx.fillStyle = '#ff4fd8'; fx.fillRect(p[0] - .5 * k, p[1], 1 * k, 1 * k);                                       // різак блимає
      for (let q = 0; q < 7; q++) { const a = hash(q + tr.k * 9, 21) * TAU, d = (2 + 8 * f) * k, px = S(A.x, yb - 6, MID)[0] + Math.cos(a) * d, py = S(A.x, yb - 6, MID)[1] + Math.sin(a) * d * .5 + f * f * 9 * k; fx.globalAlpha = .9 * (1 - f); fx.fillStyle = q % 2 ? '#3bff8a' : '#e8ffb0'; fx.fillRect(px - .45 * k, py - .45 * k, .9 * k, .9 * k); }   // листочки летять
      fx.restore(); }
  }

  /** Ліфти в шахтах: кабіна-каркас з лотком їде правою шахтою вниз (зібране — в кошик), лівою — вгору (нові лотки); трос, вогник. */
  function liftsLive(fx, t) {
    for (const [x0, dn, ph] of [[T - SH, 1, 0], [0, -1, .5]]) { const f = ((t * .04 + ph) % 1), u = f < .8 ? f / .8 : 1, cy = 4 + (H - 8) * (dn > 0 ? u : 1 - u), cx = x0 + SH / 2, w = SH - 3, h = 8;   // кабіна
      const P = (dx, dy) => S(cx + dx, cy + dy, MID + 2), a = P(-w / 2, -h / 2), b = P(w / 2, -h / 2), c = P(w / 2, h / 2), d = P(-w / 2, h / 2), k = kAt(cx, cy, MID + 2);
      fx.save(); fx.strokeStyle = '#9ab0c8'; fx.lineWidth = .6 * k; fx.beginPath(); fx.moveTo(a[0], a[1]); fx.lineTo(b[0], b[1]); fx.lineTo(c[0], c[1]); fx.lineTo(d[0], d[1]); fx.closePath(); fx.stroke();
      const top = P(0, -h / 2), rt = S(cx, 0, MID + 2); fx.strokeStyle = '#6a7a8a'; fx.lineWidth = .4 * k; fx.beginPath(); fx.moveTo(rt[0], rt[1]); fx.lineTo(top[0], top[1]); fx.stroke();   // трос
      quadF(fx, [[cx - w / 2 + 1, cy + h / 2 - 3], [cx + w / 2 - 1, cy + h / 2 - 3], [cx + w / 2 - 1.6, cy + h / 2 - .4], [cx - w / 2 + 1.6, cy + h / 2 - .4]], '#2a3038', 1, MID + 2);   // лоток у кабіні
      quadF(fx, [[cx - w / 2 + 2, cy + h / 2 - 3], [cx + w / 2 - 2, cy + h / 2 - 3], [cx + w / 2 - 2.2, cy + h / 2 - 2], [cx - w / 2 + 2.2, cy + h / 2 - 2]], dn > 0 ? '#6a8a3a' : '#5a3a22', 1, MID + 2);
      fx.fillStyle = Math.floor(t * 3) % 2 ? '#3bff8a' : '#14602e'; fx.fillRect(a[0] + 1 * k, a[1] + 1 * k, .8 * k, .8 * k); fx.restore(); }
  }
  NX.decorFarm = {
    /** Кадр теплиці на полотно fx (координати кімнати; маску нутра без рами накладає objects/decor.js). */
    draw(fx, A, t) { void A; fx.save(); fx.imageSmoothingEnabled = true; lampsLive(fx, t); liftsLive(fx, t);
      fx.save(); fx.beginPath(); [[SH, -2], [T - SH, -2], [T - SH, H + 2], [SH, H + 2]].forEach(([x, y], k) => { const p = S(x, y, MID); k ? fx.lineTo(p[0], p[1]) : fx.moveTo(p[0], p[1]); }); fx.closePath(); fx.clip();   // лотки — лише між шахтами
      for (let row = 0; row < FARM.tiers; row++) for (const tr of TR) if (tr.row === row) { const a = drawTray(fx, tr, t); stationFx(fx, a, t, tr); }
      drawBot(fx, t); drawBees(fx, t); fx.restore(); mistLive(fx, t); fx.restore(); },
    /** Тап по теплиці (objects/decor_live.js): x, y — екран -> точка нутра; хмарка туману, рослини поруч трусяться. -> true */
    tap(x, y, t) { let best = null, bd = 1e9; for (let fx_ = 0; fx_ <= T; fx_ += 4) for (let k = 0; k < FARM.tiers; k++) { const fy = FARM.rowY(H, k) - 8, p = S(fx_, fy, MID), d = Math.hypot(p[0] - x, p[1] - y); if (d < bd) { bd = d; best = [fx_, fy]; } }
      TAP = { fx: best[0], fy: best[1], t0: t }; return true; },
    trayAt, TR, T, H, plantSpr,
    /** (· 20) Де шахта ярусу row на екрані (ліва — сівалка, права — різак): [x, y] для сховища насіння (objects/decor_vault.js). */
    shaft(row, side) { return S(side === 'left' ? SH * .5 : T - SH * .5, FARM.rowY(H, row) - 6, MID); },
    /** (· 30) Світова точка правої шахти ярусу (для Nexi: збір врожаю) — [X, Y, Z]. */
    shaftW(row) { return M.W(T - SH * .5, FARM.rowY(H, row) - 6, MID); },
    /** (· 30) Який лоток наступним дійде до різака: {tr, row, kind, eta (с)}. */
    nextHarvest(t) { let best = null; for (const tr of TR) { const p = (((tr.off + t * SPEED[tr.row]) % LOOP) + LOOP) % LOOP, cut = RUN - 10, eta = (p <= cut ? cut - p : LOOP - p + cut) / SPEED[tr.row]; if (!best || eta < best.eta) best = { tr, row: tr.row, kind: tr.kind, eta }; } return best; },
    harvestOf(tr, t) { return trayAt(tr, t).harv; },
    /** (· 18) Найближчий до точки екрана лоток (для довідника ботаніка): {kind, s, d} або null. */
    nearTray(x, y, t) { let best = null; for (const tr of TR) { const A = trayAt(tr, t); if (A.hide) continue; const p = S(A.x, A.y - FARM.trayH - 7, MID), d = Math.hypot(p[0] - x, p[1] - y); if (!best || d < best.d) best = { kind: tr.kind, s: A.s, d }; } return best; },
  };
})();
