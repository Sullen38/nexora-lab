/* ============================================================================
 * objects/decor_tag.js — ГРАФІТІ-ТЕГ «Nexora Ai» на цеглі між сотами й рифом (Декор стін, 13.11)
 * ----------------------------------------------------------------------------
 * Власник (скрін, обвів вільну цеглу над табличками AI-ЦЕНТР / АНАЛІТИКА): «додай сюди графіті, розпис прикольний — Nexora Ai,
 * тільки щоб виглядало більше як тег». Тег — рукописний підпис маркером / балоном в один рух: літери-штрихи з нахилом (не шрифт),
 * рожевий «Nexora» і бірюзовий «Ai», розчерк-підкреслення зі стрілкою, корона над N, зірка замість крапки над i, патьоки фарби,
 * напил довкола. Назва бренду однакова всіма мовами й намальована штрихами — тому не через словники.
 * Спрайт малюється раз (3 px на одиницю кімнати — піксельний вигляд), кладеться на стіну з нахилом уздовж цегляних рядів
 * (нахил — із найближчої соти). Живе: уночі фарба ледь світиться, по тегу блимають кілька іскорок.
 * Малюється drawBack після растру крил (тег підключено після decor_live.js).
 * ========================================================================== */
(() => {
  const TAU = Math.PI * 2, S = 3, CFG = { x: 185, y: 75, w: 66 };                                                       // центр тегу на екрані (од. кімнати) і його ширина
  // (13.11, власник: «в іншому стилі — більш дорослому вуличному, стильному, і трохи більшим») ХЕНДСТАЙЛ: високі вузькі гострі
  // літери одним рухом плаского маркера (ламані без згладжування, кожен штрих двічі зі зсувом — тонко/товсто, як від скошеного
  // пера), сильний нахил, довгі виноси в X, R, A; один різкий розчерк зі стрілкою, три короткі риски, три тонкі патьоки. Без корон і зірок.
  const GL = {
    N: { adv: 3.6, s: [[[-.9, 11.6], [0, 10], [.3, 0], [3, 10], [3.5, -1.8]]] },
    E: { adv: 3.4, s: [[[3.3, .7], [.4, .2], [.2, 5], [2.7, 4.5]], [[.2, 5], [.1, 10], [3.5, 9.3]]] },
    X: { adv: 3.9, s: [[[.1, 0], [3.4, 10]], [[4.3, -1.6], [-1, 12.4]]] },
    O: { adv: 3.5, s: [[[1.9, -.2], [.1, 5.2], [1.4, 10.1], [3.4, 4.9], [1.7, -.1], [2.9, -1.2]]] },
    R: { adv: 3.7, s: [[[0, 10.6], [.3, 0], [3.1, 1.7], [.6, 5.2], [4.2, 11.4]]] },
    A: { adv: 3.8, s: [[[-.2, 10.6], [2, -1.4], [3.7, 10.3]], [[-1, 7.2], [4.9, 5.4]]] },
    ' ': { adv: 1.6, s: [] },
    I: { adv: 1.6, s: [[[.3, -.6], [.6, 10.5]], [[-.9, .3], [1.6, -.3]], [[-.7, 10.4], [2, 9.8]]] },
  };
  // мала рукописна абетка (згладжені штрихи) — для стилів throw і mop
  const GLOW = {
    N: { adv: 5.6, s: [[[0, 10.4], [.4, .4], [3.9, 10], [4.6, -1.4]]] },
    e: { adv: 4.2, s: [[[.2, 7], [3, 6.3], [2.6, 4.3], [1, 4.3], [0, 7], [.9, 9.9], [3.6, 8.9]]] },
    x: { adv: 4.6, s: [[[0, 4.2], [3.4, 10]], [[3.6, 4], [-.2, 10.2]]] },
    o: { adv: 4.4, s: [[[1.7, 4.1], [.1, 6.6], [.6, 9.6], [2.4, 10], [3.5, 7], [2.7, 4.5], [1.1, 4.4]]] },
    r: { adv: 3.8, s: [[[0, 4.2], [.3, 10]], [[.2, 6.2], [1.6, 4.3], [3.2, 4.9]]] },
    a: { adv: 4.8, s: [[[3, 4.8], [1.3, 4.2], [0, 7], [.8, 9.8], [2.6, 9.1], [3.2, 4.2], [3.6, 10.2]]] },
    ' ': { adv: 2, s: [] },
    A: { adv: 6, s: [[[0, 10.4], [2.5, -1], [4.6, 10.2]], [[.6, 6.8], [4.4, 6.2]]] },
    i: { adv: 2, s: [[[0, 4.6], [.35, 10.2]], [[-.1, 2.2], [0, 2.6]]] },
  };
  // (13.11, власник надіслав приклади класичних тегів товстим маркером: «щось у такому стилі») стиль marker: рівний жирний штрих
  // із круглими кінцями, великі літери налазять одна на одну, петлі в E та R, O — кільце з перекресленням, довгі виноси X, R, A,
  // німб над словом, дві риски-лапки зліва, коротке підкреслення і стрілка від останньої літери. Літери свої, не з прикладів.
  const ell = (cx, cy, rx, ry, a0, a1, n = 12) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + (a1 - a0) * i / n; return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]; });
  const GM = {
    N: { adv: 4, s: [[[-.6, 10.8], [.5, .2], [3.3, 9.6], [4, -1.8]]] },
    E: { adv: 3.6, s: [[[3.5, 1.2], [1.6, -.2], [.4, 1.6], [1.2, 4.6], [3, 4.2]], [[1.2, 4.6], [.1, 7.4], [1.2, 10.2], [3.9, 9]]] },
    X: { adv: 4, s: [[[0, -.4], [3.7, 10.6]], [[4.8, -2], [-1.4, 12.2]]] },
    O: { adv: 4.2, s: [ell(2, 5.2, 2.1, 4.9, -1.9, 4.9, 14), [[-.4, 8.6], [4.6, 1.4]]] },
    R: { adv: 4, s: [[[.1, 10.8], [.5, 0]], [[.5, 0], [2.6, -.6], [3.7, 1.6], [2.6, 4.2], [.5, 5.2]], [[.5, 5.2], [5.4, 12]]] },
    A: { adv: 4.4, s: [[[-.5, 10.8], [2.3, -1.4], [4.1, 10.6]], [[-1.8, 7.8], [5.8, 5.2]]] },
    ' ': { adv: 1.2, s: [] },
    I: { adv: 1.8, s: [[[.5, -1], [.8, 10.8]]] },
  };
  // СТИЛІ (вибір власника; NX.wallTag.set(назва)): hand — гострий хендстайл; throw — «бабл»: товсті округлі літери з чорним контуром
  // і світлою заливкою, тінь; stencil — трафарет: рубані літери з перемичками й напилом по краях; mop — жирний маркер-«швабра»
  // одним рухом із довгими патьоками
  let STYLE = 'marker', SPR = null, ANG = null;
  const sharp = (c, pts) => { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); };
  const soft = (c, pts) => { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length - 1; i++) c.quadraticCurveTo(pts[i][0], pts[i][1], (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2); const L = pts[pts.length - 1]; c.lineTo(L[0], L[1]); };
  function build() {
    const ST = { marker: { G: GM, word: 'NEXORA AI', gap: .25, sl: .16, vy: 1.3, pt: 5.4, pb: 4.4 }, hand: { G: GL, word: 'NEXORA AI', gap: .85, sl: .34, vy: 1.2, pt: 3, pb: 4.4 }, throw: { G: GLOW, word: 'Nexora Ai', gap: -.5, sl: .12, vy: 1.25, pt: 3.4, pb: 3.4 },
      stencil: { G: GL, word: 'NEXORA AI', gap: 1.5, sl: 0, vy: 1.05, pt: 3.6, pb: 3.6 }, mop: { G: GLOW, word: 'Nexora Ai', gap: .2, sl: .26, vy: 1.1, pt: 3.4, pb: 8 } }[STYLE];
    const { G, word, gap, sl, vy: VY, pt: PADT, pb: PADB } = ST, UW = [...word].reduce((a, ch) => a + G[ch].adv + gap, 0), PADX = 3.4, UH = (10 + PADT + PADB) * VY;
    const f = CFG.w / (UW + PADX * 2), W = CFG.w, H = UH * f, cv = document.createElement('canvas'); cv.width = Math.ceil(W * S); cv.height = Math.ceil(H * S);
    const c = cv.getContext('2d'), hash = NX.art.hash; c.scale(S * f, S * f * VY); c.translate(PADX, PADT);
    const INK = '#07050c', L = []; let x = 0; for (const ch of word) { for (const st of G[ch].s) L.push(st.map(([px, py]) => [x + px - (py - 10) * sl, py])); x += G[ch].adv + gap; }
    const haze = (n, a) => { for (let k = 0; k < n; k++) { const bx = hash(k, 1) * UW, by = 1 + hash(k, 2) * 9, r = 3 + hash(k, 3) * 3, g = c.createRadialGradient(bx, by, 0, bx, by, r); g.addColorStop(0, 'rgba(7,5,12,' + a + ')'); g.addColorStop(1, 'rgba(7,5,12,0)'); c.fillStyle = g; c.fillRect(bx - r, by - r, r * 2, r * 2); } };
    const pores = n => { c.globalCompositeOperation = 'destination-out'; for (let k = 0; k < n; k++) { c.globalAlpha = .3 + .5 * hash(k, 8); c.fillRect(-4 + hash(k, 11) * (UW + 8), -3 + hash(k, 12) * 20, .3, .3); } c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; };
    let mul = true;
    if (STYLE === 'marker') { c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = INK;
      const E = [ell(UW * .46, -3.2, 3.4, 1.25, .5, 6.6, 16),                                                               // німб
        [[-3, 1.2], [-2.2, 3.6]], [[-1.6, .4], [-.8, 2.8]],                                                               // лапки
        [[UW * .22, 12.6], [UW * .5, 12], [UW * .66, 12.5]],                                                              // коротке підкреслення
        [[UW - 1.2, 10.4], [UW + 1, 8.4], [UW + 3.6, 7.4]], [[UW + 1.8, 5.8], [UW + 3.6, 7.4], [UW + 1.6, 8.9]]];           // стрілка від останньої літери
      for (const pts of L) { c.lineWidth = 1.05; sharp(c, pts); c.stroke(); } for (const pts of E) { c.lineWidth = .85; sharp(c, pts); c.stroke(); }
      for (const [dx, len] of [[.6, 1.8], [UW * .62, 1.4]]) { c.lineWidth = .5; sharp(c, [[dx, 10.6], [dx, 10.8 + len]]); c.stroke(); } pores(90); }
    if (STYLE === 'hand') { c.lineCap = 'butt'; c.lineJoin = 'miter'; c.miterLimit = 6; const E = [[[-2.6, 12.9], [UW * .5, 11.5], [UW + 2.6, 12.2], [UW + .6, 10.6]], [[UW + 2.6, 12.2], [UW + .2, 13.3]]];
      haze(8, .16); c.strokeStyle = INK; for (const pts of L.concat(E)) for (const [ox, oy] of [[0, 0], [.42, -.36]]) { c.lineWidth = .95; sharp(c, pts.map(([px, py]) => [px + ox, py + oy])); c.stroke(); }
      for (const [dx, len] of [[.1, 2.6], [UW * .47, 1.8], [UW * .83, 3]]) { c.lineWidth = .5; sharp(c, [[dx, 10.4], [dx + .05, 10.6 + len]]); c.stroke(); } pores(380); }
    if (STYLE === 'throw') { mul = false; c.lineCap = 'round'; c.lineJoin = 'round';
      c.strokeStyle = INK; c.globalAlpha = .55; for (const pts of L) { c.lineWidth = 4.4; soft(c, pts.map(([px, py]) => [px + .9, py + .8])); c.stroke(); } c.globalAlpha = 1;      // тінь
      for (const pts of L) { c.lineWidth = 4.3; soft(c, pts); c.stroke(); }                                                                                              // контур
      c.strokeStyle = '#e6e2f2'; for (const pts of L) { c.lineWidth = 2.7; soft(c, pts); c.stroke(); }                                                                   // заливка
      c.strokeStyle = '#ffffff'; for (const pts of L) { c.lineWidth = .5; soft(c, pts.map(([px, py]) => [px - .7, py - .6])); c.stroke(); }                              // блік
      c.strokeStyle = '#b8b0d0'; for (const pts of L) { c.lineWidth = .45; soft(c, pts.map(([px, py]) => [px + .75, py + .65])); c.stroke(); }                           // півтінь
      c.fillStyle = INK; for (const [dx, len] of [[2, 2.4], [UW * .55, 1.6], [UW * .86, 2.8]]) { c.fillRect(dx, 11.6, .8, len); c.fillRect(dx - .15, 11.6 + len, 1.1, .7); } pores(160); }
    if (STYLE === 'stencil') { c.lineCap = 'butt'; c.lineJoin = 'miter'; c.miterLimit = 4;
      c.fillStyle = 'rgba(7,5,12,.2)'; c.fillRect(-3, -2.2, UW + 6, .7); c.fillRect(-3, 11.6, UW + 6, .7); c.fillRect(-3, -2.2, .7, 14.4); c.fillRect(UW + 2.3, -2.2, .7, 14.4);   // слід краю трафарету
      haze(14, .14); c.strokeStyle = INK; for (const pts of L) { c.lineWidth = 1.9; sharp(c, pts); c.stroke(); }
      c.globalCompositeOperation = 'destination-out'; c.fillRect(-4, 4.7, UW + 8, .55); let gx = 0; for (const ch of word) { c.save(); c.translate(gx + G[ch].adv * .5, 0); c.fillRect(-.22, -3, .44, 16); c.restore(); gx += G[ch].adv + gap; } c.globalCompositeOperation = 'source-over';   // перемички
      pores(300); }
    if (STYLE === 'mop') { c.lineCap = 'round'; c.lineJoin = 'round'; haze(10, .18); c.strokeStyle = INK;
      for (const pts of L) { c.lineWidth = 2.3; soft(c, pts); c.stroke(); } c.lineWidth = 1.6; soft(c, [[-2.4, 12.6], [UW * .4, 11.4], [UW + 2.4, 12.4]]); c.stroke();
      for (let k = 0; k < 9; k++) { const dx = .4 + k * UW / 9 + hash(k, 21) * 2, len = 2.2 + hash(k, 22) * 5.4, w = .7 + hash(k, 23) * .5; c.lineWidth = w; sharp(c, [[dx, 10.2], [dx, 10.6 + len]]); c.stroke(); c.lineWidth = w + .5; sharp(c, [[dx, 10.4 + len], [dx, 10.9 + len]]); c.stroke(); }   // довгі патьоки з краплями
      pores(260); }
    SPR = { cv, w: W, h: H, mul };
  }
  NX.wallTag = { set(st) { STYLE = st; SPR = null; }, get style() { return STYLE; } };
  function slope() {                                                                                                     // нахил цегляних рядів біля тегу — із задньої стінки найближчої соти
    const items = NX.decor && NX.decor.items, kit = NX.arc && NX.arc.kit, proj = NX.px3d && NX.px3d.proj; if (!items || !kit || !proj) return 0; let best = 0, bd = 1e9;
    for (const B of items) { if (B.st !== 'dc_hex') continue; const { P } = kit.basis(B), Yc = (B.yt + B.yb) / 2, a = proj(P(-B.w / 2, B.dep, Yc)), b = proj(P(B.w / 2, B.dep, Yc)), d = Math.abs((a[0] + b[0]) / 2 - CFG.x);
      if (d < bd) { bd = d; let an = Math.atan2(b[1] - a[1], b[0] - a[0]); if (an > Math.PI / 2) an -= Math.PI; if (an < -Math.PI / 2) an += Math.PI; best = an; } }
    return best;
  }
  NX.addObject({
    id: 'wallTag', span: [CFG.x - CFG.w, CFG.x + CFG.w],
    drawBack(c, t) {
      if (CFG.x + CFG.w < NX.cam.x || CFG.x - CFG.w > NX.cam.x + NX.cam.viewW) return; if (!SPR) build(); if (ANG == null) ANG = Math.min(slope(), 0) - .1;                              // помітний нахил: тег «лізе» вгору праворуч
      c.save(); c.beginPath(); c.rect(152, 56, 66, 37); c.clip();                                                       // (власник: «щоб не заходило ні на що — тільки на цеглі») страховка: лише вільна цегла між ліаною, рифом і табличками
      c.imageSmoothingEnabled = false; c.translate(CFG.x, CFG.y); c.rotate(ANG); if (SPR.mul) { c.globalCompositeOperation = 'multiply'; c.globalAlpha = STYLE === 'marker' ? .9 : .82; } else c.globalAlpha = .96; c.drawImage(SPR.cv, -SPR.w / 2, -SPR.h / 2, SPR.w, SPR.h);   // multiply: шви й фактура цегли проступають крізь фарбу
      c.restore();
    },
  });
})();
