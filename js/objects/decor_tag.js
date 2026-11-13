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
  const TAU = Math.PI * 2, S = 3, CFG = { x: 185, y: 75, w: 60 };                                                       // центр тегу на екрані (од. кімнати) і його ширина
  // літери: adv — крок, s — штрихи (ламані; згладжуються), одиниці: висота рядка 10, базова лінія y = 10
  const GL = {
    N: { adv: 5.6, s: [[[0, 10.4], [.4, .4], [3.9, 10], [4.6, -1.4]]] },
    e: { adv: 4.2, s: [[[.2, 7], [3, 6.3], [2.6, 4.3], [1, 4.3], [0, 7], [.9, 9.9], [3.6, 8.9]]] },
    x: { adv: 4.6, s: [[[0, 4.2], [3.4, 10]], [[4, 3.2], [-.9, 12.2]]] },
    o: { adv: 4.4, s: [[[1.7, 4.1], [.1, 6.6], [.6, 9.6], [2.4, 10], [3.5, 7], [2.7, 4.5], [1.1, 4.4]]] },
    r: { adv: 3.8, s: [[[0, 4.2], [.3, 10]], [[.2, 6.2], [1.6, 4.3], [3.2, 4.9]]] },
    a: { adv: 4.8, s: [[[3, 4.8], [1.3, 4.2], [0, 7], [.8, 9.8], [2.6, 9.1], [3.2, 4.2], [3.6, 10.2]]] },
    ' ': { adv: 2.4, s: [] },
    A: { adv: 6.4, s: [[[0, 10.4], [2.5, -1], [4.6, 10.2]], [[-.7, 6.9], [5.8, 5.5]]] },
    i: { adv: 2, s: [[[0, 4.6], [.35, 10.2]]] },
  };
  const WORD = 'Nexora Ai', UW = [...WORD].reduce((a, ch) => a + GL[ch].adv + .5, 0), PADX = 5, PADT = 6, PADB = 8, UH = 10 + PADT + PADB;
  let SPR = null, ANG = null;
  const path = (c, pts) => { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length - 1; i++) c.quadraticCurveTo(pts[i][0], pts[i][1], (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2); const L = pts[pts.length - 1]; c.lineTo(L[0], L[1]); };
  function build() {
    const f = CFG.w / (UW + PADX * 2), W = CFG.w, H = UH * f, cv = document.createElement('canvas'); cv.width = Math.ceil(W * S); cv.height = Math.ceil(H * S);
    const c = cv.getContext('2d'), hash = NX.art.hash; c.scale(S * f, S * f); c.translate(PADX, PADT); c.lineCap = 'round'; c.lineJoin = 'round';
    const INK = '#07050c', PINK = INK, CYAN = INK, YEL = INK, strokes = [];   // (13.11, власник: «чорним, щоб лягав на цеглу, під нахилом, більш вуличне») одна чорна фарба                           // strokes: [точки, колір, товщина]
    let x = 0; for (const ch of WORD) { const col = x > UW * .68 ? CYAN : PINK; for (const st of GL[ch].s) strokes.push([st.map(([px, py]) => [x + px - (py - 10) * .3, py]), col, 1.55]); x += GL[ch].adv + .5; }   // нахил вправо; літери трохи розсунуті — читається
    strokes.push([[[-2.4, 13], [UW * .35, 11.6], [UW * .8, 12.6], [UW + 3.2, 11.2]], CYAN, 1.2], [[[UW + 1.2, 9.8], [UW + 3.4, 11.2], [UW + 1, 13]], CYAN, 1.2]);   // розчерк і стрілка
    strokes.push([[[.6, -2.6], [1.3, -5], [2.4, -3.2], [3.5, -5.2], [4.6, -3.4], [5.8, -5], [6.1, -2.4]], YEL, .9], [[[.6, -2.4], [6.1, -2.3]], YEL, .9]);            // корона над N
    const ix = UW - GL.i.adv + .2 + 1.6; for (const [a, b] of [[[ix - 1.5, 2], [ix + 1.5, 2]], [[ix, .5], [ix, 3.5]], [[ix - 1, 1], [ix + 1, 3]], [[ix + 1, 1], [ix - 1, 3]]]) strokes.push([[a, b], YEL, .6]);   // зірка над i
    strokes.push([[[-1.6, 14.4], [UW * .4, 13.2], [UW * .7, 14]], INK, .8]);                                                                                   // другий, короткий розчерк
    strokes.push([[[-3.4, 1], [-2.2, 3.4]], PINK, .8], [[[-4.6, 3.2], [-3, 4.6]], PINK, .8], [[[UW + 3, .4], [UW + 4.2, -1.6]], CYAN, .8], [[[UW + 4.4, 2.2], [UW + 6, 1.2]], CYAN, .8]);   // штрихи-акценти
    for (const [dx, len, w] of [[.3, 3.6, 1], [UW * .2, 1.8, .7], [UW * .36, 3, .9], [UW * .52, 1.6, .6], [UW * .66, 2.4, .8], [UW * .8, 4, 1], [UW - 1, 2.2, .8]]) strokes.push([[[dx, 10.4], [dx + .08, 10.6 + len]], INK, w], [[[dx + .08, 10.6 + len], [dx + .08, 10.9 + len]], INK, w + .5]);   // патьоки з краплею на кінці
    for (let k = 0; k < 12; k++) { const bx = hash(k, 1) * UW, by = 2 + hash(k, 2) * 9, r = 4 + hash(k, 3) * 4, g = c.createRadialGradient(bx, by, 0, bx, by, r); g.addColorStop(0, 'rgba(7,5,12,.22)'); g.addColorStop(1, 'rgba(7,5,12,0)'); c.fillStyle = g; c.fillRect(bx - r, by - r, r * 2, r * 2); }   // чорний напил від балона
    for (let k = 0; k < 140; k++) { c.fillStyle = 'rgba(7,5,12,.55)'; c.fillRect(-5 + hash(k, 5) * (UW + 10), -5 + hash(k, 6) * 22, .34, .34); }
    for (const [pts, col, w] of strokes) { c.strokeStyle = col; c.lineWidth = w; path(c, pts); c.stroke(); }
    c.globalCompositeOperation = 'destination-out'; for (let k = 0; k < 520; k++) { c.globalAlpha = .35 + .5 * hash(k, 8); c.fillRect(-5 + hash(k, 11) * (UW + 10), -6 + hash(k, 12) * 24, .34, .34); } c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';   // пориста цегла: фарба лягла нерівно
    SPR = { cv, w: W, h: H };
  }
  function slope() {                                                                                                     // нахил цегляних рядів біля тегу — із задньої стінки найближчої соти
    const items = NX.decor && NX.decor.items, kit = NX.arc && NX.arc.kit, proj = NX.px3d && NX.px3d.proj; if (!items || !kit || !proj) return 0; let best = 0, bd = 1e9;
    for (const B of items) { if (B.st !== 'dc_hex') continue; const { P } = kit.basis(B), Yc = (B.yt + B.yb) / 2, a = proj(P(-B.w / 2, B.dep, Yc)), b = proj(P(B.w / 2, B.dep, Yc)), d = Math.abs((a[0] + b[0]) / 2 - CFG.x);
      if (d < bd) { bd = d; let an = Math.atan2(b[1] - a[1], b[0] - a[0]); if (an > Math.PI / 2) an -= Math.PI; if (an < -Math.PI / 2) an += Math.PI; best = an; } }
    return best;
  }
  NX.addObject({
    id: 'wallTag', span: [CFG.x - CFG.w, CFG.x + CFG.w],
    drawBack(c, t) {
      if (CFG.x + CFG.w < NX.cam.x || CFG.x - CFG.w > NX.cam.x + NX.cam.viewW) return; if (!SPR) build(); if (ANG == null) ANG = Math.min(slope(), 0) - .15;                              // помітний нахил: тег «лізе» вгору праворуч
      c.save(); c.beginPath(); c.rect(152, 58, 66, 34); c.clip();                                                       // (власник: «щоб не заходило ні на що — тільки на цеглі») страховка: лише вільна цегла між ліаною, рифом і табличками
      c.imageSmoothingEnabled = false; c.translate(CFG.x, CFG.y); c.rotate(ANG); c.globalCompositeOperation = 'multiply'; c.globalAlpha = .82; c.drawImage(SPR.cv, -SPR.w / 2, -SPR.h / 2, SPR.w, SPR.h);   // multiply: шви й фактура цегли проступають крізь фарбу
      c.restore();
    },
  });
})();
