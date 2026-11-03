/* ============================================================================
 * objects/decor_aqua.js — АКВАРІУМИ · 5: удвічі живіші (Декор стін · 5)
 * ----------------------------------------------------------------------------
 * Власник (03.11): «окремо попрацюй над акваріумами — треба їх зробити в два рази краще». Нерухоме — у малюнках скла
 * (objects/dc_paint.js: риф — глибина шарами, живий камінь з печерою, удвічі більше коралів). Тут — живе, на те саме полотно, що й риби (objects/decor.js drawAq: back — до риб,
 * front — після), під тією самою маскою скла (що попереду — лишається попереду):
 *   • РИФ: промені світла гойдаються, КАУСТИКА біжить по камінню й піску, ламінарія й щупальця анемони колишуться, МУРЕНА
 *     визирає з печери й «дихає» ротом, САД ВУГРІВ (три види) виринає з піску й ховається (тап по рифу — ховаються одразу),
 *     КРАБ ходить боком і погрожує клешнями, КРЕВЕТКА-ЧИСТИЛЬНИК біля печери, РИБКА-КЛОУН живе в анемоні (кружляє над нею),
 *     нові риби — королівська грамма й крилатка; морський сніг, мерехтіння поверхні.
 *   • (· 12) акваріума №3 більше немає — на його місці ВЕРТИКАЛЬНА ФЕРМА (objects/decor_farm.js).
 *   • МЕДУЗАРІЙ: підсвітка повільно змінює колір (рожевий — фіолетовий — блакитний), планктон підіймається, каустика
 *     струменить, на дні пульсує перевернута медуза кассіопея.
 * Кожна істота — свого виду, жодна не повторюється (власник: «щоб нічого не повторювалось»).
 * Координати малюнка скла (x — уздовж скла від лівого краю, y — від верху скла, од. світу) -> світ -> екран: mapper().
 * ========================================================================== */
(() => {
  const DC = NX.decor; if (!DC) return;
  const X = NX.px3d, hash = NX.art.hash, proj = X.proj, { sprite, items, SPR, CREW, ramp } = DC, TAU = Math.PI * 2, D2R = Math.PI / 180;
  const REEF = NX.arc.REEF;
  const sm = f => f * f * (3 - 2 * f);

  // ---------- малюнок скла -> світ ----------
  function mapper(aq) {
    const S = items.filter(B => B.st === 'dc_win' && B.dc && B.dc.aq === aq).sort((a, b) => a.dc.i - b.dc.i); if (!S.length) return null;
    const d0 = S[0].dc, rad = d0.R - d0.ins, sg = d0.sgn, C = d0.C, pt = a => [C[0] + sg * rad * Math.sin(a * D2R), C[1] + rad * Math.cos(a * D2R)];
    const seg = S.map(B => { const a = pt(B.dc.sa), b = pt(B.dc.sb), am = (B.dc.sa + B.dc.sb) / 2; return { s0: B.dc.s0, len: Math.hypot(b[0] - a[0], b[1] - a[1]), a, b, n: [-sg * Math.sin(am * D2R), -Math.cos(am * D2R)], sa: B.dc.sa, sb: B.dc.sb }; });
    const top = d0.top, fh = d0.bot - d0.top;                                            // у сегментів свій верх / низ (рівні на екрані) — y масштабується
    seg.forEach((g, k) => { g.top = S[k].dc.top; g.ky = (S[k].dc.bot - S[k].dc.top) / fh; });
    /** back — на стільки од. углиб від скла (до стіни); y — в одиницях першого модуля: 0 — поверхня, fh — дно. */
    const W = (x, y, back = 0) => { let g = seg[0]; for (const q of seg) if (x >= q.s0) g = q; const u = (x - g.s0) / g.len;
      return [g.a[0] + (g.b[0] - g.a[0]) * u - g.n[0] * back, g.top + y * g.ky, g.a[1] + (g.b[1] - g.a[1]) * u - g.n[1] * back]; };
    /** Точка світу (x, z) -> x малюнка (найближчий сегмент). */
    const xOf = (wx, wz) => { let best = 0, bd = 1e9; for (const g of seg) { const vx = g.b[0] - g.a[0], vz = g.b[1] - g.a[1], L2 = vx * vx + vz * vz, u = Math.max(0, Math.min(1, ((wx - g.a[0]) * vx + (wz - g.a[1]) * vz) / L2)), px = g.a[0] + vx * u, pz = g.a[1] + vz * u, dd = (px - wx) ** 2 + (pz - wz) ** 2; if (dd < bd) { bd = dd; best = g.s0 + u * g.len; } } return best; };
    return { W, S: (x, y, back) => proj(W(x, y, back)), T: d0.tot, fh, top, xOf, d0 };
  }
  const MR = mapper('reef'), JL = (() => { const B = items.find(B => B.id === 'dc_jellyg'); return B ? B.dc : null; })();
  const sOf = z => 520 / (520 + z);

  // ---------- каустика: тайл, що повторюється (світла сітка «сонячних зайчиків» на дні) ----------
  const CAU = (() => { const n = 96, cv = document.createElement('canvas'); cv.width = cv.height = n; const c = cv.getContext('2d'), im = c.createImageData(n, n), d = im.data;
    const P = Array.from({ length: 9 }, (_, k) => [hash(k, 3) * n, hash(k, 7) * n]);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {                          // Вороного: світло — на межах комірок (тайл без шва)
      let a = 1e9, b = 1e9; for (const [px, py] of P) for (let ox = -1; ox <= 1; ox++) for (let oy = -1; oy <= 1; oy++) { const dd = Math.hypot(x - px - ox * n, y - py - oy * n); if (dd < a) { b = a; a = dd; } else if (dd < b) b = dd; }
      const e = b - a, k = Math.max(0, 1 - e / 3.2), q = (y * n + x) * 4; d[q] = 200; d[q + 1] = 250; d[q + 2] = 255; d[q + 3] = Math.round(255 * k * k);
    }
    c.putImageData(im, 0, 0); return cv; })();
  let CP = null;
  /** Каустика в смузі малюнка (низ — y1(x), верх — y0(x)): два шари в різні боки — мерехтить. */
  function caustics(fx, M, x0, x1, y0, y1, t, a, cell) {
    if (!CP) CP = fx.createPattern(CAU, 'repeat'); if (!CP) return;
    fx.save(); fx.beginPath(); for (let x = x0; x <= x1 + .01; x += 4) { const p = M.S(x, y0(x)); x === x0 ? fx.moveTo(p[0], p[1]) : fx.lineTo(p[0], p[1]); }
    for (let x = x1; x >= x0 - .01; x -= 4) { const p = M.S(x, y1(x)); fx.lineTo(p[0], p[1]); } fx.closePath(); fx.clip();
    const b = M.S(x0, y0(x0)), e = M.S(x1, y1(x1)), k = cell / 96; fx.globalCompositeOperation = 'lighter'; fx.fillStyle = CP;
    for (const [sx, sy, al, fl] of [[t * 1.1, t * .7, a, 1], [-t * .8, t * 1.3 + 30, a * .7, -1]]) {
      CP.setTransform(new DOMMatrix([k * fl, 0, 0, k, sx, sy])); fx.globalAlpha = al; fx.fillRect(Math.min(b[0], e[0]) - 4, Math.min(b[1], e[1]) - 30, Math.abs(e[0] - b[0]) + 8, Math.abs(e[1] - b[1]) + 60); }
    fx.restore();
  }
  /** Ламана по точках малюнка. */
  function strand(fx, M, pts, w, col, back = 0) { fx.beginPath(); pts.forEach(([x, y], k) => { const p = M.S(x, y, back); k ? fx.lineTo(p[0], p[1]) : fx.moveTo(p[0], p[1]); }); fx.lineWidth = w; fx.strokeStyle = col; fx.lineCap = 'round'; fx.lineJoin = 'round'; fx.stroke(); }
  const dot = (fx, p, r, col) => { fx.fillStyle = col; fx.beginPath(); fx.arc(p[0], p[1], r, 0, TAU); fx.fill(); };

  // ---------- спрайти нових мешканців (піксель-арт кодом, 4 px на од.) ----------
  const eye = (S, x, y) => { S.set(x, y, '#ffffff'); S.set(x + 1, y, '#101018'); S.set(x, y + 1, '#ffffff'); S.set(x + 1, y + 1, '#101018'); };
  const MORAY = [0, 1].map(f => sprite(30, 11, S => {                                  // мурена (зелена): довге тіло вправо (у печеру), голова ліворуч, рот відкривається
    S.ell(17, 6, 14, 3.4, (x, y, u, v) => hash(x >> 1, y) > .78 ? '#e8e070' : v < -.3 ? '#8ac84a' : '#4a8a2a');
    S.ell(5, 5.5, 4.6, 3.6 + f * .5, (x, y, u, v) => v < -.2 ? '#9ad85a' : '#5a9a3a');
    if (f) { S.tri([[1, 6], [6, 5.5], [6, 8.2]], '#5a0a1a'); for (const x of [2, 4]) S.set(x, 6, '#ffffff'); }
    else S.line(1, 6.5, 6, 6.2, '#1a3a0a');
    S.set(4, 3, '#ffe24a'); S.set(5, 3, '#101018'); for (let x = 10; x < 29; x += 3) S.set(x, 2.6 + (x % 2), '#2a5a1a');
  }));
  const CRAB = [0, 1].map(f => sprite(17, 11, S => {                                  // краб: червоний панцир, лапки по черзі, клешні з білими кінчиками, очі на стебельцях
    for (let k = 0; k < 3; k++) for (const s of [-1, 1]) { const x0 = 8.5 + s * (3 + k * 1.3), y0 = 7; S.line(x0, y0, x0 + s * 2, y0 + 2.6 + ((k + f) % 2), '#c8341a'); }
    S.ell(8.5, 6, 5.4, 3, (x, y, u, v) => v < -.3 ? '#ff7a4a' : '#e0421a');
    for (const s of [-1, 1]) { S.line(8.5 + s * 4, 5, 8.5 + s * 6, 2.5 - f, '#e0421a'); S.ell(8.5 + s * 6.4, 2 - f, 1.6, 1.2, '#ff6a3a'); S.set(8.5 + s * 7.4, 1 - f, '#ffffff'); }
    S.line(7, 3.5, 6.6, 1.5, '#c8341a'); S.line(10, 3.5, 10.4, 1.5, '#c8341a'); S.set(6.5, 1, '#101018'); S.set(10.5, 1, '#101018');
  }));
  const CLEAN = [0, 1].map(f => sprite(16, 8, S => {                                  // креветка-чистильник: жовта, червоні смуги з білою серединою, довгі білі вусики
    S.ell(8, 5, 5.2, 1.8, (x, y, u, v) => Math.abs(v) < .3 ? '#ffffff' : '#e8281a'); S.tri([[3, 5], [0, 3], [0, 7]], '#e8281a');
    for (let k = 0; k < 7; k++) { S.set(13 + k * .4, 4 - k * (f ? .5 : .35), '#ffffff'); S.set(13 + k * .3, 4 - k * (f ? .3 : .55), '#f0f0f0'); }
    S.set(12, 4, '#101018'); for (let k = 0; k < 4; k++) S.set(6 + k * 1.5, 7, '#ffd23a');
  }));
  const CASSIO = [0, 1].map(f => sprite(24, 10, S => {                                // кассіопея: перевернута медуза — блюдце на дні, руки-«квіти» вгору (пульсує)
    S.ell(12, 8, 9 + f, 2, (x, y, u, v) => v < 0 ? '#c8a878' : '#a08050', 220);
    for (let k = 0; k < 7; k++) { const x = 4 + k * 2.7, h = 3 + (k % 3) + f; S.ell(x, 7 - h, 1.3, h * .55, (xx, y, u, v) => (xx + y) % 2 ? '#5ad8b0' : '#b8f0d8', 220); S.set(x, 7 - h * 1.5, '#ffffff', 230); }
  }, false));
  // нові вільні риби — у спільний список (objects/decor.js: CREW, «прогулянка» сумою синусоїд)
  Object.assign(SPR, {
    gramma: ph => sprite(24, 12, S => {                                                 // королівська грамма: перед — фіолетовий, зад — жовтий, чорна цятка на спинному
      S.tri([[5, 6], [0, 2 + ph], [0, 10 + ph]], '#ffd820'); S.ell(12, 6, 8, 3.6, (x, y, u, v) => x > 11 ? (v < -.3 ? '#d070ff' : '#a83ae0') : (v < -.3 ? '#ffe860' : '#f0c800'));
      S.tri([[10, 2.6], [16, 0 + ph * .4], [19, 3]], '#b44ae8'); S.set(17, 1, '#101018'); eye(S, 17, 5); }),
    lion: ph => sprite(34, 24, S => {                                                   // крилатка: червоно-білі смуги, віяла грудних плавців з колючками, «пір'я» спинного
      S.tri([[8, 12], [2, 7 + ph], [2, 17 + ph]], '#f0d8c8');
      for (let k = 0; k < 7; k++) { const a = -.9 + k * .32; S.line(16, 13, 16 - Math.cos(a) * 11, 13 + Math.sin(a) * 9 + 3, k % 2 ? '#c8281a' : '#f8e8e0'); }
      S.ell(18, 11, 10, 4.6, (x) => ((x >> 1) % 2) ? '#c8281a' : '#fff0e8');
      for (let k = 0; k < 9; k++) { const x = 11 + k * 1.6; S.line(x, 7, x - 1.5 + ph * .4, 0 + (k % 2) * 1.5, k % 2 ? '#f8e8e0' : '#c8281a'); }
      eye(S, 25, 9); S.set(28, 11, '#a01a1a'); }),
  });
  if (DC.JELLY) DC.JELLY.pelagia = p => sprite(30, 64, S => {                         // пелагія «нічне світло»: бузковий дзвін у світних бородавках, довгі нитки, рожеві рюші
    const cy = 10, rx = 11 * (1 + p * .12), ry = 8.5 * (1 - p * .18);
    S.ell(15, cy, rx, ry, (x, y, u, v) => v > .05 ? null : (hash(x, y) > .82 ? '#ffd8ff' : (u * u + v * v > .7 ? '#c86ae8' : '#9a4ad0')), 200);
    for (let k = 0; k < 8; k++) { const x0 = 15 + (k - 3.5) * rx / 4.3; for (let q = 0; q < 50; q++) S.set(x0 + Math.sin(q * .15 + k + p * 5) * (.8 + q * .04), cy + 1 + q, '#e0a8ff', 150); }
    for (let k = 0; k < 4; k++) { const x0 = 15 + (k - 1.5) * 2; for (let q = 0; q < 26; q++) { const x = x0 + Math.sin(q * .3 + k * 2 + p * 6) * 1.8; S.set(x, cy + 2 + q, '#ff8ad8', 220); if (q % 2) S.set(x + 1, cy + 2 + q, '#ffc8f0', 200); } }
  }, false);
  // (· 16) нові мешканці: морська черепаха, риба-метелик, спинорог Пікассо; медузи — левова грива й синій блабер
  Object.assign(SPR, {
    turtle: ph => sprite(36, 20, S => {                                                 // зелена черепаха: панцир зі щитками, ласти махають, голова з оком
      S.ell(18, 10, 13, 7, (x, y, u, v) => v > .55 ? '#8a7a4a' : ((((x + 2) / 5) | 0) + (((y + 1) / 4) | 0)) % 2 ? '#2a6a3a' : '#3a8a4a'); for (let x = 7; x < 30; x += 5) for (let y = 4; y < 15; y += 4) S.set(x, y, '#5aaa5a');
      S.tri([[8, 8], [1, 3 + ph * 2], [6, 13]], '#4a8a4a'); S.tri([[28, 8], [34, 3 + ph * 2], [30, 13]], '#4a8a4a'); S.tri([[10, 13], [6, 18 - ph], [13, 15]], '#3a7a3a'); S.tri([[26, 13], [30, 18 - ph], [23, 15]], '#3a7a3a');
      S.ell(32, 9, 3.4, 2.6, '#5a9a5a'); S.set(34, 8, '#101018'); S.set(33, 8, '#ffffff'); S.tri([[5, 10], [1, 9], [5, 12]], '#3a7a3a'); }),
    butterfly: ph => sprite(16, 14, S => {                                               // риба-метелик: жовта з чорною смугою через око, видовжений ніс
      S.tri([[3, 7], [0, 3 + ph], [0, 11 - ph]], '#ffd23a'); S.ell(8, 7, 5.5, 5.5, (x, y, u, v) => Math.abs(x - 10.5) < 1 ? '#101018' : (v < -.7 ? '#ffa03a' : '#ffd23a'));
      S.tri([[6, 2], [8, -1], [11, 2]], '#ffa03a'); S.tri([[6, 12], [8, 15], [11, 12]], '#ffa03a'); S.line(13, 8, 15, 8, '#ffd23a'); S.set(11, 6, '#ffffff'); S.set(10, 6, '#101018'); }),
    trigger: ph => sprite(22, 14, S => {                                                 // спинорог Пікассо: бежевий, блакитні й чорні смуги, жовті губи, «ріг»
      S.tri([[4, 7], [0, 3 + ph], [0, 11 - ph]], '#e8d8a0'); S.ell(12, 7, 8.5, 5.5, (x, y, u, v) => (x > 13 && x < 16 && v > -.2) ? '#101018' : ((x + y) % 7 < 1.5 && u > -.5 ? '#3a8aff' : v < -.5 ? '#c8b070' : '#f0e4b8'));
      S.line(10, 2, 13, -1, '#3a8aff'); S.line(10, 12, 12, 15, '#c8b070'); S.set(19, 8, '#ffd23a'); S.set(20, 8, '#ffd23a'); S.set(17, 5, '#101018'); S.set(16, 5, '#ffffff'); }),
  });
  if (DC.JELLY) {
    DC.JELLY.lionmane = p => sprite(40, 70, S => {                                      // левова грива: помаранчево-червоний широкий дзвін, густі довгі рудi щупальця
      const cy = 11, rx = 18 * (1 + p * .1), ry = 9 * (1 - p * .2);
      S.ell(20, cy, rx, ry, (x, y, u, v) => v > .05 ? null : ramp(['#8a2a10', '#d8522a', '#ffa060', '#ffe0b0'], .35 - v * .45 + (hash(x, y) > .85 ? .2 : 0)), 215);
      for (let x = Math.ceil(20 - rx); x < 20 + rx; x++) S.set(x, cy, '#ffb070', 230);
      for (let k = 0; k < 16; k++) { const x0 = 20 + (k - 7.5) * rx / 8.2, len = 40 + (k % 4) * 6; for (let q = 0; q < len; q++) S.set(x0 + Math.sin(q * .17 + k + p * 6) * (1 + q * .04), cy + 1 + q, k % 3 ? '#d8582a' : '#ff8a4a', 140 + (q % 2) * 40); } }, false);
    DC.JELLY.blubber = p => sprite(30, 30, S => {                                        // синій блабер: щільний синій купол, короткі товсті «руки»-губки
      const cy = 11, rx = 13 * (1 + p * .1), ry = 10 * (1 - p * .16);
      S.ell(15, cy, rx, ry, (x, y, u, v) => v > .1 ? null : ramp(['#1a3ab8', '#3a6ae8', '#7ab0ff', '#d0e8ff'], .4 - v * .4 + (u * u) * .15), 235);
      for (let k = 0; k < 4; k++) { const x0 = 15 + (k - 1.5) * 5; S.ell(x0, cy + 7 + (k % 2) * 1.5, 2.6, 5 + p * .5, (x, y, u, v) => hash(x, y) > .6 ? '#6a9aff' : '#3a5ad8', 220); S.ell(x0, cy + 12 + (k % 2) * 1.5, 2, 1.5, '#a0c8ff', 200); } }, false);
  }
  if (CREW) { CREW.reef.push(['gramma', 6.2, .75, 8], ['lion', 11.5, .22, 9], ['turtle', 15, .3, 10], ['butterfly', 6.4, .7, 11], ['trigger', 8.6, .55, 12]); if (DC.JELLY) CREW.jelly.push(['pelagia', 13, 1, 26], ['lionmane', 17, 1, 27], ['blubber', 11, 1, 28]); }

  // ---------- РИФ ----------
  const R = MR && (() => {
    const fh = MR.fh, T = MR.T, rk = x => Math.min(REEF.sand(fh), REEF.rock(x, fh)), sy = x => REEF.sy(x, fh), [cvx, cvk, cvr] = REEF.cave, cvy = cvk * fh, ax = REEF.anem, ay = rk(ax) - 2.4;
    const SNOW = Array.from({ length: 34 }, (_, k) => ({ x: hash(k, 91) * T, y: hash(k, 92) * fh, sp: .5 + hash(k, 93), sd: k }));
    const EEL = REEF.eels.map((x, k) => ({ x, h: 4 + 1.6 * hash(k, 5), ph: hash(k, 9) * 6, col: [['#f0ece0', '#1a1a20', 'spot'], ['#ff8a2a', '#ffd8a0', 'plain'], ['#f8f0e0', '#2a2a30', 'zebra']][k] }));
    return { fh, T, rk, sy, cvx, cvy, cvr, ax, ay, SNOW, EEL };
  })();
  let eelHide = -99;
  /** Рибка-клоун живе в анемоні: кружляє над щупальцями, інколи пірнає в них (objects/decor.js where). */
  function clownAt(A, t) {
    if (!R) return null; const th = t * .85 + Math.sin(t * .31) * 1.4, dive = Math.max(0, Math.sin(t * .23)) ** 6, x = R.ax + Math.cos(th) * (3.2 - dive * 1.6), y = R.ay - 2.2 + Math.sin(th * 1.7) * 1.2 + dive * 2;
    return { p: MR.W(x, y, 1.6), dir: -Math.sin(th) >= 0 ? 1 : -1 };
  }
  function reefBack(fx, A, t) {
    const { fh, T, rk, sy } = R, TP = NX.decorLive && NX.decorLive.TP;
    if (TP && TP.aq && TP.aq.aq === 'reef' && t - TP.aq.t0 >= 0 && t - TP.aq.t0 < .1) eelHide = t;            // тап по рифу — вугри ховаються
    // промені світла: гойдаються, повільно пливуть
    fx.save(); fx.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 5; k++) { const x0 = (k * 26 + 8 + Math.sin(t * .13 + k * 2) * 7) % T, w = 3 + 2 * hash(k, 4), sl = 8 + 4 * Math.sin(t * .1 + k), yb = fh * .82;
      const a = MR.S(x0, 0), b = MR.S(x0 + w, 0), cc = MR.S(x0 + w * 1.8 + sl, yb), d = MR.S(x0 + sl, yb), g = fx.createLinearGradient(0, a[1], 0, d[1]), al = .13 + .06 * Math.sin(t * .7 + k * 1.9);
      g.addColorStop(0, `rgba(200,245,255,${al})`); g.addColorStop(1, 'rgba(200,245,255,0)'); fx.fillStyle = g; fx.beginPath(); fx.moveTo(a[0], a[1]); fx.lineTo(b[0], b[1]); fx.lineTo(cc[0], cc[1]); fx.lineTo(d[0], d[1]); fx.closePath(); fx.fill(); }
    fx.restore();
    // каустика по каменю й піску
    caustics(fx, MR, 0, T, x => Math.min(rk(x), sy(x)) - 3.5, () => fh, t, .32, 7);
    // ламінарія: чотири стрічки до самої поверхні
    for (let k = 0; k < 4; k++) { const x0 = 2.5 + k * 1.4, base = sy(x0), pts = [], n = 18;
      for (let q = 0; q <= n; q++) { const f = q / n; pts.push([x0 + Math.sin(t * .7 + f * 3.2 + k * 1.3) * 2.4 * Math.pow(f, 1.3) + Math.sin(t * 1.9 + f * 7 + k) * .25 * f, base - f * fh * .84]); }
      strand(fx, MR, pts, .95 * sOf(MR.W(x0, 0)[2]), k % 2 ? '#2a8a3a' : '#3aa84a');
      for (let q = 3; q < n; q += 3) { const [x, y] = pts[q], sd = (q + k) % 2 ? 1 : -1; strand(fx, MR, [[x, y], [x + sd * 1.6, y - .9 + Math.sin(t + q) * .3]], .55, '#5ac85a'); } }
    // анемона: щупальця колишуться, кінчики світяться
    for (let k = 0; k < 17; k++) { const a = -1.45 + k * .18 + .22 * Math.sin(t * 1.3 + k * .7), l = 3.6 + 1.6 * hash(k, 9), bx = R.ax + Math.sin(a) * 1.6, by = R.ay + .4, pts = [];
      for (let q = 0; q <= 4; q++) { const f = q / 4, aa = a + .35 * Math.sin(t * 1.7 + k + f * 2) * f; pts.push([bx + Math.sin(aa) * l * f, by - Math.cos(aa) * l * f * .9]); }
      strand(fx, MR, pts, .55, k % 3 ? '#5ad86a' : '#7ae87a'); const e = MR.S(pts[4][0], pts[4][1]); dot(fx, e, .32, '#e0ff9a'); }
    // мурена визирає з печери, «дихає» ротом (цикл 16 с; тап — ховається)
    { const c = (t + 3) % 16, o = c < 2 ? sm(c / 2) : c < 10 ? 1 : c < 11.5 ? 1 - sm((c - 10) / 1.5) : 0, o2 = Math.min(o, eelHide > t - 2.5 ? 0 : 1); if (o2 > .02) {
      const S = MORAY[Math.floor(t / .9) % 2], w = S.w, h = S.h, p = MR.S(R.cvx + 1.6 - o2 * 5.2, R.cvy + .2 + Math.sin(t * .8) * .25), k = sOf(MR.W(R.cvx, R.cvy)[2]);
      const back = MR.S(R.cvx + R.cvr * .85, R.cvy), out = MR.S(R.cvx - 1, R.cvy)[0] > MR.S(R.cvx, R.cvy)[0] ? 1 : -1;   // куди виринає (на екрані) і задня стінка печери
      fx.save(); fx.beginPath(); fx.rect(out > 0 ? back[0] : back[0] - 40, back[1] - 12, 40, 24); fx.clip();          // тіло — лише від задньої стінки печери назовні
      fx.translate(p[0], p[1]); if (out > 0) fx.scale(-1, 1); fx.drawImage(S.cv, -w * k * .18, -h * k / 2, w * k, h * k); fx.restore(); } }
    // креветка-чистильник біля печери: вусики ворушаться
    { const S = CLEAN[Math.floor(t * 2.2) % 2], p = MR.S(R.cvx + R.cvr + 1.4, rk(R.cvx + R.cvr + 1.4) - .4), k = sOf(MR.W(R.cvx, 0)[2]); fx.drawImage(S.cv, p[0] - S.w * k / 2, p[1] - S.h * k, S.w * k, S.h * k); }
    // сад вугрів: три види виринають з нірок, гойдаються; інколи (і від тапу) ховаються
    for (const E of R.EEL) { const c = (t * .21 + E.ph) % 4, up = (c < .5 ? sm(c / .5) : c < 3.3 ? 1 : c < 3.6 ? 1 - sm((c - 3.3) / .3) : 0) * (eelHide > t - 3 ? Math.max(0, (t - eelHide - 2) / 1) : 1);
      if (up < .05) continue; const base = R.sy(E.x), h = E.h * up, pts = [];
      for (let q = 0; q <= 8; q++) { const f = q / 8; pts.push([E.x + Math.sin(t * 1.1 + E.ph + f * 2.5) * .9 * f * f, base - f * h]); }
      const [c1, c2, pat] = E.col; strand(fx, MR, pts, .62, c1);
      if (pat !== 'plain') for (let q = 1; q < 8; q++) { const p = MR.S(pts[q][0], pts[q][1]); if (pat === 'spot' ? q % 2 : true) { fx.fillStyle = c2; fx.fillRect(p[0] - .25, p[1] - (pat === 'zebra' ? .12 : .2), .5, pat === 'zebra' ? .24 : .4); } }
      const hp = MR.S(pts[8][0], pts[8][1]); dot(fx, hp, .42, c1); fx.fillStyle = '#101018'; fx.fillRect(hp[0] + .1, hp[1] - .15, .22, .22); }
    // (· 16) водолаз: з регулятора йдуть бульбашки, ліхтар сканує рифом; скриня зі скарбом відкривається раз на 14 с (блиск, іскри);
    //        затонула неонова N блимає
    { const dx = REEF.diver, dy = sy(dx) - 7.5, k = sOf(MR.W(dx, dy)[2]); fx.save(); fx.globalCompositeOperation = 'lighter';
      for (let q = 0; q < 6; q++) { const f = ((t * .55 + q / 6) % 1), p = MR.S(dx + .6 + Math.sin(f * 9 + q) * .6, dy - 1 - f * (dy - 2)), r = (.25 + f * .5) * k; fx.globalAlpha = .7 * (1 - f * .6); fx.fillStyle = '#e8fbff'; fx.beginPath(); fx.arc(p[0], p[1], r, 0, TAU); fx.fill(); }
      const a = -.5 + .5 * Math.sin(t * .4), hx = dx + 2.6, hy = dy - 2, e = MR.S(hx + Math.cos(a) * 22, hy + Math.sin(a) * 22 * .5), h0 = MR.S(hx, hy), g = fx.createLinearGradient(h0[0], h0[1], e[0], e[1]);   // промінь ліхтаря
      g.addColorStop(0, 'rgba(255,250,200,.4)'); g.addColorStop(1, 'rgba(255,250,200,0)'); fx.fillStyle = g; fx.beginPath(); fx.moveTo(h0[0], h0[1]); const e1 = MR.S(hx + Math.cos(a - .18) * 22, hy + Math.sin(a - .18) * 22 * .5), e2 = MR.S(hx + Math.cos(a + .18) * 22, hy + Math.sin(a + .18) * 22 * .5); fx.lineTo(e1[0], e1[1]); fx.lineTo(e2[0], e2[1]); fx.closePath(); fx.fill(); fx.restore(); }
    { const c = (t + 5) % 14, o = c < 1 ? sm(c) : c < 5 ? 1 : c < 6 ? 1 - sm(c - 5) : 0, cx = REEF.chest, cy = sy(cx) - .4, k = sOf(MR.W(cx, cy)[2]);                       // скриня: кришка відкривається, золото світиться
      if (o > .02) { const lid = [[cx - 3.2, cy - 3.6], [cx + 3.2, cy - 3.6], [cx + 3.2 + o * 1.2, cy - 3.6 - o * 3.2], [cx - 3.2 + o * 1.2, cy - 3.6 - o * 3.2]]; fx.fillStyle = '#6a3a1a'; fx.beginPath(); lid.forEach(([x, y], q) => { const p = MR.S(x, y, 2); q ? fx.lineTo(p[0], p[1]) : fx.moveTo(p[0], p[1]); }); fx.closePath(); fx.fill();
        fx.save(); fx.globalCompositeOperation = 'lighter'; const p = MR.S(cx, cy - 3, 2), gr = fx.createRadialGradient(p[0], p[1], 0, p[0], p[1], 7 * k); gr.addColorStop(0, `rgba(255,220,100,${.6 * o})`); gr.addColorStop(1, 'rgba(255,200,60,0)'); fx.fillStyle = gr; fx.fillRect(p[0] - 8, p[1] - 8, 16, 16);
        for (let q = 0; q < 6; q++) { const f = ((t * .8 + q / 6) % 1); fx.globalAlpha = o * (1 - f); fx.fillStyle = q % 2 ? '#ffe080' : '#ffffff'; fx.fillRect(p[0] + (hash(q, 3) - .5) * 6 * k, p[1] - f * 6 * k, .5, .5); } fx.restore(); } }
    { const on = Math.sin(t * 7) > -.6 && Math.sin(t * .9) > -.8, x = REEF.neonN, y = sy(x) - 1.5, k = sOf(MR.W(x, y)[2]); if (on) { fx.save(); fx.globalCompositeOperation = 'lighter'; const p = MR.S(x, y - 3, 1); fx.globalAlpha = .35; const gr = fx.createRadialGradient(p[0], p[1], 0, p[0], p[1], 6 * k); gr.addColorStop(0, 'rgba(90,232,255,.8)'); gr.addColorStop(1, 'rgba(90,232,255,0)'); fx.fillStyle = gr; fx.fillRect(p[0] - 7, p[1] - 7, 14, 14); fx.restore(); } }
    // краб ходить боком по піску, зупиняється й погрожує клешнями
    { const c = t % 22, x = c < 7 ? 62 + c * 3.4 : c < 11 ? 85.8 : c < 18 ? 85.8 - (c - 11) * 3.4 : 62, walk = (c < 7 || (c >= 11 && c < 18)), S = CRAB[walk ? Math.floor(t * 6) % 2 : (c % 2 < 1 ? 1 : 0)], p = MR.S(x, R.sy(x) - .1), k = sOf(MR.W(x, 0)[2]);
      fx.drawImage(S.cv, p[0] - S.w * k / 2, p[1] - S.h * k * .9, S.w * k, S.h * k); }
  }
  function reefFront(fx, A, t) {
    const { fh, T } = R;
    fx.save(); fx.globalCompositeOperation = 'lighter';
    for (const s of R.SNOW) { const y = (s.y + t * s.sp * .9) % fh, x = (s.x + Math.sin(t * .4 + s.sd) * 1.2 + T) % T, p = MR.S(x, y); fx.globalAlpha = .45 * Math.min(1, (fh - y) / 6); fx.fillStyle = '#e8f6ff'; fx.fillRect(p[0] - .17, p[1] - .17, .34, .34); }   // морський сніг
    fx.globalAlpha = .55; fx.beginPath(); for (let x = 0; x <= T; x += 2) { const p = MR.S(x, .9 + .35 * Math.sin(x * .4 + t * 2.1) + .2 * Math.sin(x * 1.3 - t * 3)); x ? fx.lineTo(p[0], p[1]) : fx.moveTo(p[0], p[1]); }   // мерехтіння поверхні
    fx.lineWidth = .35; fx.strokeStyle = '#d8faff'; fx.stroke();
    for (let k = 0; k < 9; k++) { const x = ((k * 13.7 + t * (2 + k % 3)) % T), p = MR.S(x, 1 + .3 * Math.sin(t * 3 + k)); fx.globalAlpha = .5 + .5 * Math.sin(t * 4 + k * 2); fx.fillStyle = '#ffffff'; fx.fillRect(p[0] - .3, p[1] - .12, .6, .24); }
    fx.restore();
  }

  // ---------- МЕДУЗАРІЙ ----------
  const PLK = Array.from({ length: 30 }, (_, k) => ({ u: hash(k, 61), v: hash(k, 62), sp: .02 + .03 * hash(k, 63), sd: k }));
  function jellyBack(fx, A, t) {
    if (!JL) return; const top = JL.top, bot = JL.bot, r = JL.r, at = (u, y) => proj([JL.cx + (u - .5) * 2 * r * .92, y, JL.cz - r]);   // лицьова площина колони
    const hue = ((t / 22) % 1), cols = [[255, 90, 220], [160, 90, 255], [70, 200, 255], [255, 90, 220]], i = Math.floor(hue * 3), f = sm(hue * 3 - i), C = cols[i].map((v, k) => Math.round(v + (cols[i + 1][k] - v) * f));
    const a = at(0, top), b = at(1, bot), g = fx.createLinearGradient(0, a[1], 0, b[1]);
    g.addColorStop(0, `rgba(${C[0]},${C[1]},${C[2]},.06)`); g.addColorStop(.55, `rgba(${C[0]},${C[1]},${C[2]},.12)`); g.addColorStop(1, `rgba(${C[0]},${C[1]},${C[2]},.42)`);
    fx.save(); fx.globalCompositeOperation = 'lighter'; fx.fillStyle = g; fx.fillRect(Math.min(a[0], b[0]), a[1], Math.abs(b[0] - a[0]), b[1] - a[1]);
    { const f2 = (t % 9) / 9, y = bot - (bot - top) * sm(f2), p = at(0, y), q = at(1, y), gr = fx.createLinearGradient(0, p[1] - 14, 0, p[1] + 14);   // кільце світла біжить угору (раз на 9 с)
      gr.addColorStop(0, `rgba(${C[0]},${C[1]},${C[2]},0)`); gr.addColorStop(.5, `rgba(${C[0]},${C[1]},${C[2]},${.32 * Math.sin(f2 * Math.PI)})`); gr.addColorStop(1, `rgba(${C[0]},${C[1]},${C[2]},0)`); fx.fillStyle = gr; fx.fillRect(Math.min(p[0], q[0]), p[1] - 14, Math.abs(q[0] - p[0]), 28); }
    for (let k = 0; k < 5; k++) { fx.beginPath(); for (let y = top; y <= bot; y += 4) { const p = at(.15 + .17 * k + Math.sin(y * .07 + t * .6 + k * 1.7) * .04, y); y === top ? fx.moveTo(p[0], p[1]) : fx.lineTo(p[0], p[1]); }   // каустика струменить
      fx.globalAlpha = .12; fx.strokeStyle = '#bff4ff'; fx.lineWidth = .45; fx.stroke(); }
    for (const P of PLK) { const v = 1 - ((P.v + t * P.sp) % 1), p = at(P.u + Math.sin(t * .5 + P.sd) * .03, top + (bot - top) * v), tw = .6 + .4 * Math.sin(t * 2.3 + P.sd);
      fx.globalAlpha = .8 * tw * Math.min(1, (1 - v) * 4); fx.fillStyle = P.sd % 3 ? '#e8f4ff' : `rgb(${C[0]},${C[1]},${C[2]})`; fx.fillRect(p[0] - .3, p[1] - .3, .6, .6);
      if (P.sd % 4 === 0) { fx.globalAlpha = .25 * tw; fx.beginPath(); fx.arc(p[0], p[1], 1.2, 0, TAU); fx.fill(); } }
    fx.restore();
    { const S = CASSIO[Math.floor(t * 1.4) % 2], p = proj([JL.cx - r * .3, bot - .6, JL.cz - r * .5]), k = sOf(JL.cz - r * .5) * 1.5; fx.drawImage(S.cv, p[0] - S.w * k / 2, p[1] - S.h * k, S.w * k, S.h * k); }   // кассіопея на дні
  }

  // ---------- (Декор стін · 6) ГОДУВАННЯ: Nexi тисне кнопку годівнички (actors/nexi/activities.js feedFish) ----------
  /** Годівничка на кришці: риф — над лівим краєм скла (на екрані); x — у координатах малюнка скла. (· 12: праворуч акваріума вже немає.) */
  const FEEDER = { reef: MR && { M: MR, x: MR.T - 12 } };
  const FEED = {};
  /** Почати годування акваріума aq у час t: пластівці сиплються з годівнички 1.6 с; медузарій — хмара планктону. */
  function feed(aq, t) {
    if (aq === 'jelly') { FEED.jelly = { t0: t }; return; }
    const F = FEEDER[aq]; if (!F) return;
    FEED[aq] = { t0: t, fl: Array.from({ length: 16 }, (_, k) => ({ x: F.x + (hash(k, 5) - .5) * 3, t0: t + k * .1, vy: .9 + .7 * hash(k, 7), sw: hash(k, 9) * 6, c: ['#ffb24a', '#e86a2a', '#7ac84a', '#ffd27a'][k % 4], eaten: -1 })) };
  }
  const flakeAt = (F, f, t) => { const a = t - f.t0; return a < 0 ? null : [f.x + Math.sin(a * 1.7 + f.sw) * .8, .4 + a * f.vy * (a < 1 ? .6 : 1)]; };
  /** Риби пливуть до корму (кличе objects/decor.js: позиція з «прогулянки» r -> зсунута до найближчого пластівця). */
  function adjust(aq, A, m, k, t, r) {
    const E = FEED[aq], F = FEEDER[aq]; if (!E || !F || t - E.t0 > 16) return r;
    const w = Math.min(1, Math.max(0, (t - E.t0 - .4) / 1.4)) * Math.min(1, Math.max(0, (16 - (t - E.t0)) / 2)) * (m[0] === 'seahorse' ? .35 : m[0] === 'shrimp' || m[0] === 'axolotl' ? .5 : .9);
    if (w <= 0) return r; let best = null, bd = 1e9;
    E.fl.forEach((f, q) => { if (f.eaten >= 0) return; const p = flakeAt(F.M, f, t); if (!p) return; const W = F.M.W(p[0], p[1], 2 + (k % 3)), d = Math.hypot(W[0] - r.p[0], W[1] - r.p[1], W[2] - r.p[2]) + ((q + k) % 4) * 3; if (d < bd) { bd = d; best = W; } });
    if (!best) return r; const p = r.p.map((v, i) => v + (best[i] - v) * w + (i === 1 ? Math.sin(t * 9 + k) * .4 * w : 0)), a = proj(r.p), b = proj(best);
    return { p, dir: Math.abs(b[0] - a[0]) > .5 ? (b[0] > a[0] ? 1 : -1) : r.dir };
  }
  /** Корм у воді: пластівці тонуть і хитаються; риба поруч — з'їдає (бульбашка). */
  function drawFeed(fx, aq, t, list) {
    const E = FEED[aq], F = FEEDER[aq]; if (!E || !F || t - E.t0 > 18) return; const M = F.M;
    for (const f of E.fl) { if (f.eaten >= 0 && t - f.eaten > .5) continue; const p = flakeAt(M, f, t); if (!p || p[1] > M.fh - 3) continue; const W = M.W(p[0], p[1], 2), q = proj(W);
      if (f.eaten < 0 && list) for (const e of list) if (Math.hypot(e.p[0] - W[0], e.p[1] - W[1], e.p[2] - W[2]) < 2.6) { f.eaten = t; break; }
      if (f.eaten >= 0) { const a = (t - f.eaten) / .5; fx.globalAlpha = .8 * (1 - a); fx.fillStyle = '#e8fbff'; fx.beginPath(); fx.arc(q[0], q[1] - a * 2, .3 + a * .3, 0, TAU); fx.fill(); continue; }
      fx.globalAlpha = 1; fx.fillStyle = f.c; fx.fillRect(q[0] - .3, q[1] - .22, .6, .44); }
    fx.globalAlpha = 1;
  }
  /** Медузарій після годування: хмара світного планктону спускається згори; медузи світяться яскравіше (glow). */
  function drawBloom(fx, t) {
    const E = FEED.jelly; if (!E || !JL) return; const a = t - E.t0; if (a < 0 || a > 10) return; const r = JL.r, at = (u, y) => proj([JL.cx + (u - .5) * 2 * r * .92, y, JL.cz - r]);
    fx.save(); fx.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 60; k++) { const d = .2 + .8 * hash(k, 31), y = JL.top + 12 + a * (6 + 10 * hash(k, 33)) * d, u = .5 + (hash(k, 35) - .5) * Math.min(1, a * .5 + .2) + Math.sin(a * .8 + k) * .04, p = at(u, y);
      fx.globalAlpha = Math.min(1, a * 2) * (1 - a / 10) * (.5 + .5 * Math.sin(t * 5 + k)); fx.fillStyle = ['#9af6ff', '#ffb0f0', '#d8ff9a'][k % 3]; fx.beginPath(); fx.arc(p[0], p[1], .35, 0, TAU); fx.fill(); }
    fx.restore();
  }
  /** Годівнички на кришках (поза склом — малює objects/decor_live.js, без маски): бункер з кормом, вогник; під час годування
   *  барабан крутиться, вогник блимає. */
  function drawFeeders(c, t, vx0, vx1) {
    for (const aq of ['reef']) { const F = FEEDER[aq]; if (!F) continue; const M = F.M, p = M.S(F.x, -5), k = sOf(M.W(F.x, 0)[2]); if (p[0] < vx0 - 10 || p[0] > vx1 + 10) continue;
      const E = FEED[aq], on = E && t - E.t0 < 1.8, w = 3.4 * k, h = 3 * k;
      c.save(); c.fillStyle = '#c8ccdd'; c.fillRect(p[0] - w / 2, p[1] - h, w, h); c.fillStyle = '#6a7298'; c.fillRect(p[0] - w / 2, p[1] - h, w, .45 * k);
      c.fillStyle = '#ffb24a'; c.fillRect(p[0] - w * .3, p[1] - h * .72, w * .6, h * .42);                                       // віконце з кормом
      c.fillStyle = on && Math.floor(t * 8) % 2 ? '#ffffff' : '#3bff8a'; c.fillRect(p[0] + w * .3, p[1] - h * .9, .5 * k, .5 * k);   // вогник
      if (on) { const a = t * 9; c.strokeStyle = '#ffd27a'; c.lineWidth = .3 * k; c.beginPath(); c.moveTo(p[0] + Math.cos(a) * w * .25, p[1] - h * .5 + Math.sin(a) * h * .2); c.lineTo(p[0] - Math.cos(a) * w * .25, p[1] - h * .5 - Math.sin(a) * h * .2); c.stroke(); }
      c.fillStyle = '#060313'; c.globalAlpha = .9; c.fillRect(p[0] - w / 2, p[1] - h, w, .22); c.fillRect(p[0] - w / 2, p[1] - .22, w, .22); c.restore(); }
  }

  NX.decorAqua = {
    /** До риб (objects/decor.js drawAq). */
    back(fx, aq, A, t) { if (aq === 'reef' && R) reefBack(fx, A, t); else if (aq === 'jelly') jellyBack(fx, A, t); },
    /** Після риб (list — риби кадру: корм, до якого риба доплила, з'їдено). */
    front(fx, aq, A, t, list) { drawFeed(fx, aq, t, list); if (aq === 'reef' && R) reefFront(fx, A, t); else if (aq === 'jelly') drawBloom(fx, t); },
    /** Особлива поведінка мешканця (objects/decor.js where): рибка-клоун — в анемоні. */
    where(aq, A, m, t) { return aq === 'reef' && m[0] === 'clown' ? clownAt(A, t) : null; },
    adjust, feed, drawFeeders,
    /** Медузи після годування світяться яскравіше (множник сяйва). */
    glow(aq, t) { const E = FEED.jelly; if (aq !== 'jelly' || !E) return 1; const a = t - E.t0; return a < 0 || a > 10 ? 1 : 1 + 1.4 * Math.min(1, a * 1.5) * (1 - a / 10); },
    /** Біля якого краю акваріума Nexi зависає й тисне кнопку годівнички: точка краю на екрані (на середині висоти), глибина z
     *  (масштаб Nexi) і з якого боку від краю він (side: −1 — ліворуч, +1 — праворуч). Риф — лівий край (годівничка там),
     *  медузарій — праворуч від колони. */
    feederAt(aq) {
      if (aq === 'jelly') { if (!JL) return null; const W = [JL.cx + JL.r, JL.top + 72, JL.cz], p = proj(W); return { x: p[0], y: p[1], z: W[2], side: 1 }; }
      const F = FEEDER[aq]; if (!F) return null; const M = F.M, W = M.W(M.T, M.fh * .45), p = proj(W); return { x: p[0], y: p[1], z: W[2], side: -1 }; },
  };
})();
