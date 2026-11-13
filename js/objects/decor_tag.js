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
  const TAU = Math.PI * 2, S = 3, CFG = { x: 185, y: 75.5, w: 65 };                                                       // центр тегу на екрані (од. кімнати) і його ширина
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
  const WORD = 'NEXORA AI', GAP = .85, UW = [...WORD].reduce((a, ch) => a + GL[ch].adv + GAP, 0), PADX = 3.4, PADT = 3, PADB = 4.4, VY = 1.2, UH = (10 + PADT + PADB) * VY;
  let SPR = null, ANG = null;
  const path = (c, pts) => { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); };
  function build() {
    const f = CFG.w / (UW + PADX * 2), W = CFG.w, H = UH * f, cv = document.createElement('canvas'); cv.width = Math.ceil(W * S); cv.height = Math.ceil(H * S);
    const c = cv.getContext('2d'), hash = NX.art.hash; c.scale(S * f, S * f * VY); c.translate(PADX, PADT); c.lineCap = 'butt'; c.lineJoin = 'miter'; c.miterLimit = 6;
    const INK = '#07050c', strokes = [];                                                                                 // strokes: [точки, товщина]
    let x = 0; for (const ch of WORD) { for (const st of GL[ch].s) strokes.push([st.map(([px, py]) => [x + px - (py - 10) * .34, py]), .95]); x += GL[ch].adv + GAP; }   // сильний нахил вправо
    strokes.push([[[-2.6, 12.9], [UW * .5, 11.5], [UW + 2.6, 12.2], [UW + .6, 10.6]], .8], [[[UW + 2.6, 12.2], [UW + .2, 13.3]], .8]);                                  // розчерк зі стрілкою
    strokes.push([[[UW + 2.4, .2], [UW + 3.3, -1.8]], .6], [[[UW + 3.4, 1.2], [UW + 4.6, -.6]], .6], [[[UW + 4.4, 2.4], [UW + 5.6, 1]], .6]);                           // три риски
    for (const [dx, len] of [[.1, 2.6], [UW * .47, 1.8], [UW * .83, 3]]) strokes.push([[[dx, 10.4], [dx + .05, 10.6 + len]], .5]);                                       // тонкі патьоки
    for (let k = 0; k < 8; k++) { const bx = hash(k, 1) * UW, by = 1 + hash(k, 2) * 9, r = 3 + hash(k, 3) * 3, g = c.createRadialGradient(bx, by, 0, bx, by, r); g.addColorStop(0, 'rgba(7,5,12,.16)'); g.addColorStop(1, 'rgba(7,5,12,0)'); c.fillStyle = g; c.fillRect(bx - r, by - r, r * 2, r * 2); }
    c.strokeStyle = INK; for (const [pts, w] of strokes) for (const [ox, oy] of [[0, 0], [.42, -.36]]) { c.lineWidth = w; path(c, pts.map(([px, py]) => [px + ox, py + oy])); c.stroke(); }   // скошене перо: штрих двічі зі зсувом
    c.globalCompositeOperation = 'destination-out'; for (let k = 0; k < 380; k++) { c.globalAlpha = .3 + .5 * hash(k, 8); c.fillRect(-4 + hash(k, 11) * (UW + 8), -3 + hash(k, 12) * 18, .3, .3); } c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';   // пориста цегла
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
      if (CFG.x + CFG.w < NX.cam.x || CFG.x - CFG.w > NX.cam.x + NX.cam.viewW) return; if (!SPR) build(); if (ANG == null) ANG = Math.min(slope(), 0) - .1;                              // помітний нахил: тег «лізе» вгору праворуч
      c.save(); c.beginPath(); c.rect(152, 56, 66, 37); c.clip();                                                       // (власник: «щоб не заходило ні на що — тільки на цеглі») страховка: лише вільна цегла між ліаною, рифом і табличками
      c.imageSmoothingEnabled = false; c.translate(CFG.x, CFG.y); c.rotate(ANG); c.globalCompositeOperation = 'multiply'; c.globalAlpha = .82; c.drawImage(SPR.cv, -SPR.w / 2, -SPR.h / 2, SPR.w, SPR.h);   // multiply: шви й фактура цегли проступають крізь фарбу
      c.restore();
    },
  });
})();
