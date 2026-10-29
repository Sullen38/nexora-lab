/* ============================================================================
 * objects/mk_chair.js — КРІСЛО МАРКЕТИНГУ (Nexi сідає й працює)
 * ----------------------------------------------------------------------------
 * Власник (29.10): «до відділу маркетингу додай крісло, на яке Nexi буде сідати»; потім (крок 3): «крісло вийшло якесь
 * калічне — зроби краще в два рази». Тепер це справжнє ГОНОЧНЕ геймерське крісло (рушій піксельного 3D — core/px3d.js,
 * матеріали — objects/arc_kit.js), що ОБЕРТАЄТЬСЯ:
 *   СПИНКА — витягнутий профіль, як у гоночного сидіння: широкі «крила» на плечах, талія, шия, підголівник з двома
 *     прорізами під ремені (справжні дірки), легкий нахил назад. Спереду — стьобана «ромбом» середина, рожеві бокові
 *     валики, вишитий N; ззаду — глянцевий корпус, дві рожеві гоночні смуги, неонова емблема N, кант;
 *   СИДІННЯ — платформа, стьобана подушка, високі бокові валики, заокруглений передній край; подушка під шию;
 *   ПІДЛОКІТНИКИ — стійки й м'які накладки з рожевою смугою; механізм, рожеве LED-кільце (світиться);
 *   ОПОРА — газліфт у кожусі, хрестовина з 5 хромованих променів, подвійні коліщатка.
 * Кадр під кут повороту рендериться в растр (z-буфер, контур) і кешується (кілька останніх кутів). Растр ділиться на
 * ДВА ШАРИ: спинка (і підлокітник, що ближче до глядача) — поверх Nexi, коли вона між ним і глядачем; решта — під ним.
 * API (activities.js -> marketing): ready(), side() — де стати біля крісла, seat() — куди сісти, depth() — глибина Nexi,
 *   turnTo(кут) — повернутись (0 — до глядача, 180 — до екрана, 270 — праворуч), sitDown() / standUp(); foot — слід на
 *   підлозі (Nexi й кіт обходять крісло — world/room.js: route).
 * ========================================================================== */
(() => {
  const X = NX.px3d, A = NX.arc.kit, PL = A.PAL, P = NX.px, FL = 372, R = 4, K = 1.5, { ramp, col } = X;
  let Z = null; const zone = () => Z || (Z = NX.arc.zone && NX.arc.zone('marketing'));
  const centre = () => zone().W(589, 337, -24);                                       // вісь крісла (px картинки зони -> світ)

  // ---------- СПИНКА: профіль лиця (половина праворуч, знизу вгору; [u, h] в одиницях крісла) ----------
  const PROF = [[11.8, 20], [11.7, 22.5], [11.1, 25.5], [10.8, 27.5], [11.3, 29.6], [12.3, 31.4], [12.9, 33.0], [12.6, 34.2], [11.1, 35.0], [8.4, 35.6],
    [7.8, 36.4], [7.6, 39.8], [7.2, 41.2], [6.1, 42.1], [4.2, 42.55], [0, 42.7]];
  const OUT = [...PROF, ...PROF.slice(0, -1).reverse().map(([u, h]) => [-u, h])];   // контур: праворуч угору, ліворуч униз
  const INNER = [[8.2, 20.6], [7.8, 23.5], [7.4, 26.5], [7.7, 29.5], [8.2, 31.7], [7.5, 33.6], [5.6, 34.8], [4.9, 35.9], [4.7, 40.7], [3.8, 41.6], [0, 41.8]];
  const INN = [...INNER, ...INNER.slice(0, -1).reverse().map(([u, h]) => [-u, h])];
  const BW = 12.9, BH0 = 20, BH1 = 42.7, TILT = .16, BV = 9.4, BD = 5.4;              // межі профілю, нахил назад (на од. висоти), площина лиця, товщина
  const slot = (u, h) => Math.abs(Math.abs(u) - 3.2) < .7 && h > 38.4 && h < 40.8;   // прорізи під ремені — наскрізь
  // ---------- текстури спинки (полотно в од. світу: x = (u + BW)·K, y = (BH1 − h)·K) ----------
  const tx = (u, h) => [(u + BW) * K, (BH1 - h) * K];
  const path = (c, pts, mirror = 1) => { c.beginPath(); pts.forEach(([u, h], k) => { const [x, y] = tx(u * mirror, h); k ? c.lineTo(x, y) : c.moveTo(x, y); }); c.closePath(); };
  /** Лице спинки: рожеві бокові валики (глянець), стьобана «ромбом» середина з кантом і пунктиром-строчкою, поперечна строчка
   *  попереку, темні обідки прорізів, вишитий N між ними. */
  const backFront = (c, fw, fh) => {
    let g = c.createLinearGradient(0, 0, fw, 0); g.addColorStop(0, '#5a1458'); g.addColorStop(.12, '#c63aa8'); g.addColorStop(.3, '#7a1c6d'); g.addColorStop(.7, '#7a1c6d'); g.addColorStop(.88, '#a0288d'); g.addColorStop(1, '#4a1048');
    path(c, OUT); c.fillStyle = g; c.fill();
    c.save(); path(c, OUT); c.clip(); c.fillStyle = 'rgba(255,200,240,.22)'; for (let y = 0; y < fh; y += 2.2) c.fillRect(0, y, fw, .35); c.restore();   // фактура шкіри
    path(c, INN); g = c.createLinearGradient(0, 0, 0, fh); g.addColorStop(0, '#2a1a5e'); g.addColorStop(.5, '#1c1146'); g.addColorStop(1, '#140c36'); c.fillStyle = g; c.fill();
    c.save(); path(c, INN); c.clip(); const s = 2.6 * K;                                  // «ромб»: шви й пухкі подушечки
    c.strokeStyle = 'rgba(8,4,24,.85)'; c.lineWidth = .5; for (let k = -12; k < 14; k++) { c.beginPath(); c.moveTo(k * s, 0); c.lineTo(k * s + fh, fh); c.stroke(); c.beginPath(); c.moveTo(k * s, fh); c.lineTo(k * s + fh, 0); c.stroke(); }
    c.fillStyle = 'rgba(120,96,220,.4)'; for (let y = s / 2; y < fh; y += s) for (let x = s / 2 + ((y / s | 0) % 2) * s / 2; x < fw; x += s) c.fillRect(x - .5, y - .9, 1, 1.2);
    c.restore();
    path(c, INN); c.strokeStyle = '#ff4fd8'; c.lineWidth = .8; c.stroke(); c.setLineDash([.7, .7]); c.strokeStyle = 'rgba(255,214,246,.8)'; c.lineWidth = .3; c.stroke(); c.setLineDash([]);
    const [lx0, ly] = tx(-7.4, 27.4), [lx1] = tx(7.4, 27.4); c.setLineDash([.7, .7]); c.strokeStyle = 'rgba(255,170,240,.6)'; c.lineWidth = .3; c.beginPath(); c.moveTo(lx0, ly); c.lineTo(lx1, ly); c.stroke(); c.setLineDash([]);
    [-1, 1].forEach(sd => { const [x, y] = tx(sd * 3.2 - 1.1, 41.3), w = 2.2 * K, h = 3.4 * K; c.fillStyle = '#05030f'; c.fillRect(x, y, w, h); c.fillStyle = 'rgba(255,170,240,.55)'; c.fillRect(x, y + h - .4, w, .4); });   // обідки прорізів
    const [nx, ny] = tx(-1.25, 41.1), nw = 2.5 * K, nh = 2.1 * K; c.strokeStyle = '#ff9af0'; c.lineWidth = .7; c.lineJoin = 'round'; c.beginPath(); c.moveTo(nx, ny + nh); c.lineTo(nx, ny); c.lineTo(nx + nw, ny + nh); c.lineTo(nx + nw, ny); c.stroke();
    path(c, OUT); c.strokeStyle = 'rgba(255,190,240,.7)'; c.lineWidth = .5; c.stroke();
  };
  /** Спинка ззаду: глянцевий корпус (світліше вгорі, відблиск збоку), дві рожеві гоночні смуги з блакитними нитками,
   *  неонова емблема з N, кант по краю, обідки прорізів. */
  const backBack = (c, fw, fh) => {
    let g = c.createLinearGradient(0, 0, 0, fh); g.addColorStop(0, '#3a2a7e'); g.addColorStop(.35, '#241a5a'); g.addColorStop(1, '#120a36');
    path(c, OUT); c.fillStyle = g; c.fill();
    c.save(); path(c, OUT); c.clip();
    g = c.createLinearGradient(0, 0, fw, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.16, 'rgba(200,180,255,.22)'); g.addColorStop(.24, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, fw, fh);   // глянцевий відблиск
    [-1, 1].forEach(sd => { const [x0] = tx(sd > 0 ? 1.9 : -3.7, 0), w = 1.8 * K;         // гоночні смуги
      g = c.createLinearGradient(0, 0, 0, fh); g.addColorStop(0, '#ff9af0'); g.addColorStop(.5, '#ff4fd8'); g.addColorStop(1, '#a0288d'); c.fillStyle = g; c.fillRect(x0, 0, w, fh);
      c.fillStyle = '#9af6ff'; c.fillRect(sd > 0 ? x0 + w + .4 : x0 - .7, 0, .3, fh); });
    const [ex, ey] = tx(0, 30.4), r = 4 * K;                                               // емблема
    c.fillStyle = '#0a0620'; c.beginPath(); c.arc(ex, ey, r, 0, 7); c.fill();
    c.strokeStyle = '#ff4fd8'; c.lineWidth = 1.1; c.beginPath(); c.arc(ex, ey, r * .82, 0, 7); c.stroke(); c.strokeStyle = '#ffd6f6'; c.lineWidth = .35; c.stroke();
    c.strokeStyle = '#3be8ff'; c.lineWidth = 1.2; c.lineJoin = 'round'; const q = r * .38; c.beginPath(); c.moveTo(ex - q, ey + q); c.lineTo(ex - q, ey - q); c.lineTo(ex + q, ey + q); c.lineTo(ex + q, ey - q); c.stroke(); c.strokeStyle = '#e4fdff'; c.lineWidth = .4; c.stroke();
    c.restore();
    [-1, 1].forEach(sd => { const [x, y] = tx(sd * 3.2 - 1.1, 41.3); c.fillStyle = '#05030f'; c.fillRect(x, y, 2.2 * K, 3.4 * K); });
    path(c, OUT); c.strokeStyle = '#ff4fd8'; c.lineWidth = .9; c.stroke(); c.strokeStyle = 'rgba(255,214,246,.8)'; c.lineWidth = .3; c.stroke();
  };
  /** Стьобана подушка сидіння (зверху): «ромб», кант, строчка. */
  const quilt = (c, fw, fh) => { const s = Math.min(fw, fh) / 3.4;
    c.strokeStyle = 'rgba(8,4,24,.8)'; c.lineWidth = .45; for (let k = -8; k < 10; k++) { c.beginPath(); c.moveTo(k * s, 0); c.lineTo(k * s + fh, fh); c.stroke(); c.beginPath(); c.moveTo(k * s, fh); c.lineTo(k * s + fh, 0); c.stroke(); }
    c.fillStyle = 'rgba(140,110,240,.38)'; for (let y = s / 2; y < fh; y += s) for (let x = s / 2 + ((y / s | 0) % 2) * s / 2; x < fw; x += s) c.fillRect(x - .4, y - .4, .8, .8);
    c.setLineDash([.6, .6]); c.strokeStyle = 'rgba(255,190,240,.7)'; c.lineWidth = .3; c.strokeRect(.8, .8, fw - 1.6, fh - 1.6); c.setLineDash([]); };
  /** Валик (зверху / спереду): глянцевий відблиск уздовж і строчка. */
  const roll = (c, fw, fh) => { c.fillStyle = 'rgba(255,214,246,.32)'; c.fillRect(0, fh * .22, fw, fh * .14); c.setLineDash([.6, .6]); c.strokeStyle = 'rgba(255,214,246,.6)'; c.lineWidth = .3; c.beginPath(); c.moveTo(.5, fh * .7); c.lineTo(fw - .5, fh * .7); c.stroke(); c.setLineDash([]); };
  /** Накладка підлокітника (зверху): рожева смуга. */
  const pad = (c, fw, fh) => { c.fillStyle = '#ff4fd8'; c.fillRect(fw * .38, 0, fw * .24, fh); c.fillStyle = '#ffd6f6'; c.fillRect(fw * .46, 0, fw * .08, fh); };

  // частини-коробки: [id, u (середина), v0 (передній край; + — назад), ширина, глибина, низ, верх, матеріал, додатково]
  const PARTS = [
    ['slab', 0, -12.4, 26, 24.2, 15, 18.6, 'shell', { ch: 1.2 }], ['cush', 0, -11.2, 16.8, 20.4, 18.6, 20.6, 'cush', { top: quilt }],
    ['bolL', -10.7, -12, 4.8, 22, 18.6, 22.8, 'pink', { ch: 1.7, top: roll }], ['bolR', 10.7, -12, 4.8, 22, 18.6, 22.8, 'pink', { ch: 1.7, top: roll }],
    ['nose', 0, -14.2, 24.6, 3.2, 15.4, 21, 'pink', { ch: 1.4, front: roll }],
    ['neck', 0, 9.5, 9, 2.8, 34.6, 37.7, 'pinkL', { ch: 1.2, front: roll }],
    ['postL', -15.4, 1.2, 3.2, 3.4, 15.6, 27.4, 'steel'], ['postR', 15.4, 1.2, 3.2, 3.4, 15.6, 27.4, 'steel'],
    ['brkL', -14, .9, 3.6, 4, 15.4, 17.2, 'steel'], ['brkR', 14, .9, 3.6, 4, 15.4, 17.2, 'steel'],
    ['padL', -15.4, -7.4, 5.6, 12.6, 27.2, 29.8, 'arm', { ch: 1.1, top: pad }], ['padR', 15.4, -7.4, 5.6, 12.6, 27.2, 29.8, 'arm', { ch: 1.1, top: pad }],
    ['mech', 0, -7.2, 14.4, 14.4, 13.3, 15, 'steel'], ['ring', 0, -11.4, 22.8, 22.8, 12.6, 13.4, 'led', { cyl: 28 }],
    ['lift', 0, -2.2, 4.4, 4.4, 7.5, 13.3, 'chrome', { cyl: 16 }], ['cover', 0, -3.3, 6.6, 6.6, 3.4, 8.6, 'dark', { cyl: 16, kt: .78 }],
    ['hub', 0, -3.8, 7.6, 7.6, 2.6, 4.8, 'dark', { cyl: 18 }],
  ];
  const MAT = { shell: { pal: PL.DESK, q: .5, bev: .8 }, cush: { pal: PL.DESK, q: .56, bev: .7 }, pink: { pal: PL.PINKP, q: .5, bev: 1 }, pinkL: { pal: PL.PINKP, q: .64, bev: .9 },
    arm: { pal: PL.MET, q: .4, bev: .7 }, steel: { pal: PL.STEEL, q: .6, bev: .5 }, chrome: { pal: PL.CHROME, q: .58, metal: 1, bev: 0 }, dark: { pal: PL.DARK, q: .62, bev: .4 },
    led: { pal: PL.PINKP, q: .92, emit: 1, bev: 0 } };
  const BACK_ID = PARTS.length + 1, LEG_ID = BACK_ID + 1, WHEEL_ID = LEG_ID + 1;
  const cache = new Map(), TX = new Map(); let Lr = null, box = null;
  /** Текстура грані не залежить від кута — малюється раз (ключ — частина й грань). */
  const texOf = (key, B, Fc, paint) => { if (!TX.has(key)) TX.set(key, A.texture(B, Fc, R, paint)); return TX.get(key); };

  /** Витягнутий профіль спинки: грані лиця, тилу й боків (k, poly, O, A, B, n, fw, fh) для кута key. */
  function backFaces(b) {
    const V = (u, h, bk) => b.P(u * K, (BV + (h - BH0) * TILT + (bk ? BD : 0)) * K, FL - h * K);
    const fr = OUT.map(([u, h]) => V(u, h, 0)), bk = OUT.map(([u, h]) => V(u, h, 1)), out = [], sub = (p, q) => [p[0] - q[0], p[1] - q[1], p[2] - q[2]];
    const orient = (poly, ref) => { let n = X.newell(poly); const m = poly.reduce((s, p) => [s[0] + p[0] / poly.length, s[1] + p[1] / poly.length, s[2] + p[2] / poly.length], [0, 0, 0]), d = sub(m, ref);
      if (n[0] * d[0] + n[1] * d[1] + n[2] * d[2] < 0) n = [-n[0], -n[1], -n[2]]; const l = Math.hypot(...n) || 1; return [n[0] / l, n[1] / l, n[2] / l]; };
    const mid = V(0, 30, 0), cen = [(mid[0] + V(0, 30, 1)[0]) / 2, (mid[1] + V(0, 30, 1)[1]) / 2, (mid[2] + V(0, 30, 1)[2]) / 2];
    { const O = V(-BW, BH1, 0); out.push({ k: 'front', poly: fr, O, A: sub(V(BW, BH1, 0), O), B: sub(V(-BW, BH0, 0), O), fw: 2 * BW * K, fh: (BH1 - BH0) * K, n: orient(fr, cen), side: 'f' }); }
    { const O = V(BW, BH1, 1); out.push({ k: 'back', poly: bk.slice().reverse(), O, A: sub(V(-BW, BH1, 1), O), B: sub(V(BW, BH0, 1), O), fw: 2 * BW * K, fh: (BH1 - BH0) * K, n: orient(bk, cen), side: 'b' }); }
    for (let i = 0; i < OUT.length; i++) { const j = (i + 1) % OUT.length, poly = [fr[i], fr[j], bk[j], bk[i]], len = Math.hypot(...sub(fr[j], fr[i]));
      if (len < .05) continue; out.push({ k: 'left', poly, O: fr[i], A: sub(fr[j], fr[i]), B: sub(bk[i], fr[i]), fw: len, fh: BD * K, n: orient(poly, cen), side: 's' }); }
    return out;
  }

  /** Растр крісла під кут a (градуси): {back, front} — два полотна (позаду / попереду Nexi), x0, y0, w, h (од. кімнати). */
  function render(a) {
    const key = ((Math.round(a / 4) * 4) % 360 + 360) % 360; if (cache.has(key)) return cache.get(key);
    const C = centre(), b = A.basis({ x: C[0], z: C[2], turn: key }), Pt = (u, v, h) => b.P(u * K, v * K, FL - h * K);
    if (!Lr) {                                                                         // растр — один на всі кути (межі з запасом)
      const pts = []; for (let q = 0; q < 8; q++) { const an = q / 8 * Math.PI * 2; [0, 46].forEach(h => pts.push(X.proj([C[0] + Math.cos(an) * 26 * K, FL - h * K, C[2] + Math.sin(an) * 26 * K]))); }
      box = [Math.min(...pts.map(p => p[0])) - 3, Math.min(...pts.map(p => p[1])) - 3, Math.max(...pts.map(p => p[0])) + 3, Math.max(...pts.map(p => p[1])) + 3];
      Lr = X.Layer(box[0], box[1], box[2], box[3], R);
    }
    const L = Lr; L.c.fill(0); L.dep.fill(Infinity); L.id.fill(0); L.fid.fill(0); L.fl.fill(0);
    const front = new Set(), zc = C[2], Bx = { yb: FL - 20 * K };
    // спинка (витягнутий профіль): прорізи — наскрізь; боки — темніша шкіра з рожевим кантом спереду
    const BF = backFaces(b), bmid = Pt(0, BV + BD / 2 + 1.6, 0); if (bmid[2] < zc - 1.5) { front.add(BACK_ID); front.add(PARTS.findIndex(p => p[0] === 'neck') + 1); }
    BF.forEach(Fc => {
      if (!A.visible(Fc)) return;
      if (Fc.side === 's') { const base = A.shader('chair', Fc, Bx, { pal: PL.PINKP, q: .34, bev: .25 }); X.face(L, Fc.poly, Fc.O, Fc.A, Fc.B, (u, v, i, j, t) => v < .2 ? col(v < .1 ? '#ff9af0' : '#ff4fd8') : base(u, v, i, j, t), { id: BACK_ID, fid: BACK_ID, n: Fc.n }); return; }
      const tex = texOf('back' + Fc.side, Bx, Fc, Fc.side === 'f' ? backFront : backBack), base = A.shader('chair', Fc, Bx, { pal: PL.DESK, q: .5, bev: .3, tex }), mir = Fc.side === 'f' ? 1 : -1;
      X.face(L, Fc.poly, Fc.O, Fc.A, Fc.B, (u, v, i, j, t) => slot(mir * (-BW + u * 2 * BW), BH1 - v * (BH1 - BH0)) ? 0 : base(u, v, i, j, t), { id: BACK_ID, fid: BACK_ID, n: Fc.n });
    });
    PARTS.forEach(([nm, u, v0, w, d, h0, h1, mat, ex = {}], n) => {
      const id = n + 1, p0 = Pt(u, v0, 0), B = { x: p0[0], z: p0[2], turn: key, w: w * K, dep: d * K, yb: FL - h0 * K, yt: FL - h1 * K, ch: ex.ch ? [ex.ch * K, ex.ch * K] : null, cyl: ex.cyl, kt: ex.kt, id: 'chair_' + nm };
      const mid = Pt(u, v0 + d / 2, 0); if (/^pad|^post/.test(nm) && mid[2] < zc - 7) front.add(id);
      for (const Fc of A.faces(B)) {
        if (!A.visible(Fc)) continue;
        const paint = Fc.k === 'top' ? ex.top : Fc.k === 'front' ? ex.front : null, tex = paint ? texOf(nm + Fc.k, B, Fc, paint) : null;
        const sh = A.shader('chair', Fc, B, Object.assign({ bev: .9, ins: 0, fog: 0 }, MAT[mat], { tex }));
        X.face(L, Fc.poly, Fc.O, Fc.A, Fc.B, sh, { id, fid: id, n: Fc.n });
      }
    });
    // хрестовина: 5 хромованих променів (світла грань угорі) з подвійними коліщатками
    const hub = Pt(0, 0, 3.8);
    for (let q = 0; q < 5; q++) { const an = q / 5 * Math.PI * 2 + .3, cs = Math.cos(an), sn = Math.sin(an), tip = Pt(cs * 15.6, sn * 15.6, 2.8);
      X.tube(L, hub, tip, 3 * K, (u0, v0, i, j) => ramp(PL.CHROME, .2 + (1 - Math.abs(u0 - .35) * 2.2) * .62 + (v0 > .9 ? -.15 : 0), i, j), { id: LEG_ID, fid: LEG_ID });
      X.tube(L, tip, Pt(cs * 16.4, sn * 16.4, 1.6), 1.2 * K, (u0, v0, i, j) => ramp(PL.STEEL, .55, i, j), { id: LEG_ID, fid: LEG_ID });
      [-.9, .9].forEach(o => { const w = Pt(cs * 16.4 - sn * o, sn * 16.4 + cs * o, 1.5);
        X.disc(L, w, 1.55 * K, (u0, v0, i, j) => { const dd = Math.hypot(u0 - .5, v0 - .5); return dd > .34 ? ramp(PL.DARK, .45 + (v0 < .4 ? .2 : 0), i, j) : dd > .2 ? ramp(PL.STEEL, .5, i, j) : ramp(PL.CHROME, .7, i, j); }, { id: WHEEL_ID, fid: WHEEL_ID }); });
    }
    X.outline(L, () => A.C.out, 2);
    // ділимо растр на два шари: позаду Nexi (сидіння, опора, …) і попереду (спинка, коли вона між ним і глядачем)
    const mk = sel => { const cv = document.createElement('canvas'); cv.width = L.W; cv.height = L.H; const x = cv.getContext('2d'), im = x.createImageData(L.W, L.H), d = new Uint32Array(im.data.buffer);
      for (let k = 0; k < L.c.length; k++) if (L.c[k] && sel(L.id[k])) d[k] = L.c[k]; x.putImageData(im, 0, 0); return cv; };
    const out = { back: mk(id => !front.has(id)), front: mk(id => front.has(id)), x0: L.x0, y0: L.y0, w: L.W / R, h: L.H / R };
    cache.set(key, out); if (cache.size > 16) cache.delete(cache.keys().next().value);
    return out;
  }

  const ch = NX.addObject({
    id: 'mkChair', name: 'obj.marketing', act: 'marketing',
    a: 166, tgt: 166, seated: false, idleT: 4,
    ready() { return !!zone(); },
    /** Точка підлоги під серединою крісла (екран) і глибина — для порядку малювання з Nexi. */
    floor() { return X.proj(centre()); },
    depth() { return this.floor()[1]; },
    side() { const f = this.floor(); return [f[0] + 46, Math.max(362, f[1] + 6)]; },
    seat() { const C = centre(); return X.proj([C[0], FL - 21 * K, C[2] + 2]); },
    /** Слід на підлозі (екран): коло хрестовини з коліщатками — Nexi й кіт обходять (world/room.js: route). */
    get foot() { if (!zone()) return null; if (!this._foot) { const C = centre(), pts = []; for (let q = 0; q < 16; q++) { const an = q / 16 * Math.PI * 2; pts.push(X.proj([C[0] + Math.cos(an) * 17.5 * K, FL, C[2] + Math.sin(an) * 17.5 * K])); }
      this._foot = [Math.min(...pts.map(p => p[0])), Math.max(...pts.map(p => p[0])), Math.min(...pts.map(p => p[1])), Math.max(...pts.map(p => p[1]))]; } return this._foot; },
    turnTo(deg) { let d = deg; while (d - this.a > 180) d -= 360; while (d - this.a < -180) d += 360; this.tgt = d; },
    spin(deg) { this.tgt = this.a + deg; },                                                 // повний оберт (на радощах)
    sitDown() { this.seated = true; }, standUp() { this.seated = false; this.turnTo(166); },
    get span() { const f = zone() && this.floor(); return f ? [f[0] - 44, f[0] + 44] : null; },
    get hit() { if (!zone()) return null; const f = this.floor(); return { x: f[0] - 26, y: f[1] - 64, w: 52, h: 66 }; },
    update(dt, t) {
      if (!zone()) return;
      const d = this.tgt - this.a, sp = (90 + Math.abs(d) * 5) * dt; this.a = Math.abs(d) <= sp ? this.tgt : this.a + Math.sign(d) * sp;
      if (!this.seated && Math.abs(d) < .5) { this.idleT -= dt; if (this.idleT < 0) { this.idleT = 5 + Math.random() * 6; this.turnTo(166 + (Math.random() - .5) * 26); } }
      const n = NX.nexi;
      if (this.seated && n.loc === 'mkChair') {                                             // Nexi їде разом із кріслом: спиною / лицем / боком
        const r = this.a * Math.PI / 180, fx = -Math.sin(r), fz = -Math.cos(r); n.back = fz > .2; if (Math.abs(fx) > .55) n.dir = fx > 0 ? 1 : -1;
        if (!(n.cur && (n.cur.hop || n.cur.fly))) { const s = this.seat(); n.x = s[0]; n.y = s[1]; }
      }
    },
    layers(t) {
      if (!zone()) return [];
      const fr = render(this.a), f = this.floor(), y = f[1], act = NX.objects.marketing && NX.objects.marketing.active, lit = .55 + .25 * Math.sin(t * 2.4) + (act ? .25 : 0);
      const draw = cv => c => { c.save(); c.imageSmoothingEnabled = true; c.drawImage(cv, fr.x0, fr.y0, fr.w, fr.h); c.restore(); };
      return [
        { y: y - .5, draw: c => { c.save(); c.fillStyle = 'rgba(4,2,14,.55)'; c.beginPath(); c.ellipse(f[0], f[1] + .5, 30, 4.4, 0, 0, 7); c.fill(); c.restore();
          P.glow(c, f[0], f[1] - 5, 34, 'rgba(255,79,216,.8)', lit * .55); draw(fr.back)(c); } },
        { y: y + .5, draw: draw(fr.front) },
      ];
    },
  });
})();
