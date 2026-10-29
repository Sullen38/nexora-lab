/* ============================================================================
 * objects/ws_paint.js — МАЙСТЕРНЯ (СКІНИ): МАЛЮНКИ ГРАНЕЙ І ЖИВІ ЕКРАНИ
 * ----------------------------------------------------------------------------
 * Розкладка частин — tools/wingbox/gen_room.py: workshop() (id ws_*). Тут — як виглядають їхні грані (пласкі текстури, рушій
 * кладе їх у перспективу; NX.arc.paint[id]) і що на них живе (NX.arc.LIVE[id] — лише те, що рухається). Голограма Nexi,
 * маніпулятор і сканування — окремий живий об'єкт: objects/workshop.js.
 *   ws_base   — фасад платформи: рожева кромка, панелі зі швами й болтами, ґратки, ніша з помаранчевою щілиною й шевронами
 *   ws_dais   — подіум капсули: блакитний неон, отвори; зверху — металеві плити й кільця навколо пада
 *   ws_pad    — пад (зверху): кільця, мітки, значок N — світиться (сюди стає Nexi, звідси б'є голограма)
 *   ws_wingL/R, ws_postL/R — бічні панелі й стійки капсули (внутрішні грані стійок — світлові панелі)
 *   ws_back   — рожеве скло сканера: сітка, кільця емблеми, іконки скінів
 *   ws_beam   — балка: заклепки, ґратки; знизу — панель світла над капсулою
 *   ws_tabL   — планшет СКІНИ (живий: готові скіни на міні-Nexi, рамка кольору рідкості, сторінки)
 *   ws_tabR   — планшет АКСЕСУАРИ (живий: міні-Nexi в рюкзаку, плащі, крилах, шоломах…; реліквії — на орбіті голограми)
 * c уже масштабоване: 1 = одиниця світу на грані; fw × fh — розмір грані. Усі написи — NX.t (4 мови).
 * ========================================================================== */
(() => {
  const A = NX.arc.kit, T = NX.arc.pt, PAINT = NX.arc.paint, LIVE = NX.arc.LIVE, hash = NX.art.hash;
  const { glass, icon, rr } = T;

  // ---------- дрібниці піксельного «заліза» ----------
  /** Заклепка: темне кільце, світлий блік угорі ліворуч. */
  const bolt = (c, x, y, r = .9) => { c.fillStyle = '#05030f'; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); c.fillStyle = '#6a5ab8'; c.beginPath(); c.arc(x - r * .15, y - r * .15, r * .62, 0, 7); c.fill(); c.fillStyle = '#d8d0ff'; c.fillRect(x - r * .45, y - r * .45, r * .4, r * .4); };
  /** Утоплена панель: темне дно, тінь зверху й ліворуч, світла кромка знизу й праворуч. */
  function inset(c, x, y, w, h, o = {}) {
    c.fillStyle = o.fill || 'rgba(6,3,20,.55)'; rr(c, x, y, w, h, o.r || .6); c.fill();
    c.fillStyle = 'rgba(0,0,0,.55)'; c.fillRect(x, y, w, .5); c.fillRect(x, y, .5, h);
    c.fillStyle = 'rgba(170,150,255,.28)'; c.fillRect(x, y + h - .45, w, .45); c.fillRect(x + w - .45, y, .45, h);
  }
  /** Ґратка вентиляції: горизонтальні щілини з темним нутром і світлою нижньою губою. */
  function vent(c, x, y, w, h, n) {
    inset(c, x, y, w, h, { fill: 'rgba(4,2,14,.7)' }); const g = h / n;
    for (let k = 0; k < n; k++) { const yy = y + g * k + g * .3; c.fillStyle = '#020108'; c.fillRect(x + w * .08, yy, w * .84, g * .42); c.fillStyle = 'rgba(150,130,240,.35)'; c.fillRect(x + w * .08, yy + g * .42, w * .84, .35); }
  }
  /** Світлодіод: яскрава серцевина, кольорове тіло, темна оправа. */
  const led = (c, x, y, col, r = .8) => { c.fillStyle = '#05030f'; c.beginPath(); c.arc(x, y, r * 1.5, 0, 7); c.fill(); c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); c.fillStyle = '#ffffff'; c.fillRect(x - r * .35, y - r * .35, r * .5, r * .5); };
  /** Шеврон «>» (вказує в бік dir: 1 — праворуч). */
  function chevron(c, x, y, s, dir, col) { c.strokeStyle = col; c.lineWidth = s * .32; c.lineCap = 'square'; c.beginPath(); c.moveTo(x - dir * s * .4, y - s * .5); c.lineTo(x + dir * s * .4, y); c.lineTo(x - dir * s * .4, y + s * .5); c.stroke(); }
  /** Попереджувальні смуги (жовто-чорні). */
  function hazard(c, x, y, w, h) { c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip(); c.fillStyle = '#e8b82a'; c.fillRect(x, y, w, h); c.fillStyle = '#1a1020'; for (let k = -2; k < w / h + 2; k++) { const xx = x + k * h * 1.2; c.beginPath(); c.moveTo(xx, y + h); c.lineTo(xx + h * .6, y + h); c.lineTo(xx + h * 1.2, y); c.lineTo(xx + h * .6, y); c.fill(); } c.restore(); }

  // ---------- ПЛАТФОРМА ----------
  /** Фасад платформи (як на картинці): кромка з рожевим неоном, панелі зі швами й болтами, ґратки, по центру — ніша з
   *  помаранчевою світною щілиною й шевронами, блакитні LED. Світлої смуги знизу немає (власник прибрав, крок 3). */
  PAINT.ws_base = (c, fw, fh) => {
    c.fillStyle = 'rgba(210,190,255,.22)'; c.fillRect(0, 0, fw, fh * .045);                                        // світла губа кромки
    A.neon(c, 0, fh * .09, fw, fh * .09, '#ff4fd8', 1.5);
    c.fillStyle = 'rgba(0,0,0,.45)'; c.fillRect(0, fh * .14, fw, fh * .03);                                        // тінь під кромкою
    const seam = x => { c.fillStyle = '#04020e'; c.fillRect(x - .45, fh * .2, .9, fh * .72); c.fillStyle = 'rgba(170,150,255,.3)'; c.fillRect(x + .45, fh * .2, .4, fh * .72); };
    [.115, .3, .7, .885].forEach(f => seam(fw * f));
    [[.02, .1], [.9, .98]].forEach(([a, b]) => vent(c, fw * a, fh * .3, fw * (b - a), fh * .5, 5));                // ґратки на кінцях
    [.135, .28, .72, .865].forEach(f => { bolt(c, fw * f, fh * .3); bolt(c, fw * f, fh * .82); });
    // бічні панелі з написом-міткою (смужки) і LED
    [[.15, .27], [.73, .85]].forEach(([a, b], k) => { inset(c, fw * a, fh * .34, fw * (b - a), fh * .38); for (let q = 0; q < 3; q++) { c.fillStyle = q === 1 ? 'rgba(59,232,255,.55)' : 'rgba(150,140,230,.4)'; c.fillRect(fw * (a + .015), fh * (.43 + q * .1), fw * (b - a) * (.7 - q * .15), fh * .035); }
      led(c, fw * (b - .02), fh * .43, k ? '#ff4fd8' : '#3bff8a', .75); });
    // середина: ніша з помаранчевою щілиною (як на картинці) + шеврони до неї
    const nx = fw * .34, nw = fw * .32; inset(c, nx, fh * .26, nw, fh * .56, { fill: 'rgba(3,1,10,.82)', r: 1.4 });
    const sx = fw * .5 - fw * .1, sw = fw * .2, sy = fh * .43, sh = fh * .22;
    c.fillStyle = '#05020a'; rr(c, sx - 1.2, sy - 1.2, sw + 2.4, sh + 2.4, 1.2); c.fill();
    const g = c.createLinearGradient(0, sy, 0, sy + sh); g.addColorStop(0, '#fff2cc'); g.addColorStop(.28, '#ffc35e'); g.addColorStop(.7, '#ff8a2a'); g.addColorStop(1, '#b8440a'); c.fillStyle = g; rr(c, sx, sy, sw, sh, .9); c.fill();
    c.fillStyle = 'rgba(255,255,255,.8)'; c.fillRect(sx + 1, sy + sh * .2, sw - 2, .55);
    c.fillStyle = 'rgba(110,36,4,.5)'; for (let x = sx + 2; x < sx + sw - 1; x += 2.2) c.fillRect(x, sy + .3, .5, sh - .6);
    for (let k = 0; k < 3; k++) { chevron(c, sx - 3 - k * 3.2, sy + sh / 2, 2.4, 1, 'rgba(59,232,255,.35)'); chevron(c, sx + sw + 3 + k * 3.2, sy + sh / 2, 2.4, -1, 'rgba(59,232,255,.35)'); }
    hazard(c, nx + 1, fh * .74, fw * .045, fh * .05); hazard(c, nx + nw - 1 - fw * .045, fh * .74, fw * .045, fh * .05);
  };
  /** Живе на фасаді: шеврони біжать до щілини, щілина «дихає». */
  LIVE.ws_base = { every: 3, draw(c, fw, fh, t) {
    const sx = fw * .4, sw = fw * .2, sy = fh * .43, sh = fh * .22, p = .5 + .5 * Math.sin(t * 2.6);
    c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(255,190,90,${.18 + .3 * p})`; rr(c, sx - .6, sy - .6, sw + 1.2, sh + 1.2, 1); c.fill(); c.restore();
    for (let k = 0; k < 3; k++) { const on = (Math.floor(t * 5) % 3) === 2 - k, col = on ? '#9af6ff' : null; if (!col) continue; chevron(c, sx - 3 - k * 3.2, sy + sh / 2, 2.4, 1, col); chevron(c, sx + sw + 3 + k * 3.2, sy + sh / 2, 2.4, -1, col); }
  } };

  // ---------- ПОДІУМ І ПАД ----------
  PAINT.ws_dais = (c, fw, fh) => {
    A.neon(c, fw * .02, fh * .32, fw * .98, fh * .32, '#3be8ff', 1.1);
    for (let k = 0; k < 18; k++) { const x = fw * (.08 + k * .049); c.fillStyle = '#03020c'; c.fillRect(x, fh * .55, 1.6, fh * .22); c.fillStyle = k % 3 ? 'rgba(59,232,255,.35)' : 'rgba(255,79,216,.45)'; c.fillRect(x + .3, fh * .6, 1, fh * .12); }
  };
  /** Верх подіуму (видно згори): металеві плити зі швами, світні кільця навколо пада. */
  PAINT.ws_dais.sides = { top: (c, fw, fh) => {
    c.fillStyle = 'rgba(8,4,26,.35)'; c.fillRect(0, 0, fw, fh);
    for (let x = fw * .1; x < fw; x += fw * .2) { c.fillStyle = 'rgba(0,0,0,.5)'; c.fillRect(x, 0, .5, fh); c.fillStyle = 'rgba(160,140,255,.18)'; c.fillRect(x + .5, 0, .35, fh); }
    const cx = fw / 2, cy = fh * .34;                                                                              // пад — на v 28 (подіум від v 6)
    [[1.9, 'rgba(255,79,216,.55)', .7], [1.45, 'rgba(59,232,255,.5)', .5]].forEach(([k, col, lw]) => { c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); c.ellipse(cx, cy, fw * .13 * k, fh * .25 * k, 0, 0, 7); c.stroke(); });
    for (let a = 0; a < 12; a++) { const q = a / 12 * Math.PI * 2; c.fillStyle = a % 3 ? 'rgba(59,232,255,.6)' : '#ff9af0'; c.fillRect(cx + Math.cos(q) * fw * .27 - .5, cy + Math.sin(q) * fh * .5 - .5, 1, 1); }
  } };
  /** Пад (зверху): кільця з поділками, світна середина, значок N — тут стає Nexi. */
  PAINT.ws_pad = (c, fw, fh) => {};
  PAINT.ws_pad.sides = { top: (c, fw, fh) => {
    const cx = fw / 2, cy = fh / 2, R = Math.min(fw, fh) / 2;
    c.save(); c.translate(cx, cy); c.scale(fw / (2 * R), fh / (2 * R));
    const g = c.createRadialGradient(0, 0, 0, 0, 0, R); g.addColorStop(0, '#fff0fc'); g.addColorStop(.25, '#ff9af0'); g.addColorStop(.55, '#c83ab8'); g.addColorStop(.8, '#5a1470'); g.addColorStop(1, '#2a0a3a');
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, R * .98, 0, 7); c.fill();
    [[.92, '#3be8ff', .9], [.7, '#ffd6f6', .6], [.48, '#3be8ff', .5]].forEach(([k, col, lw]) => { c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); c.arc(0, 0, R * k, 0, 7); c.stroke(); });
    for (let a = 0; a < 24; a++) { const q = a / 24 * Math.PI * 2; c.strokeStyle = a % 6 ? 'rgba(255,214,246,.7)' : '#ffffff'; c.lineWidth = a % 6 ? .35 : .6; c.beginPath(); c.moveTo(Math.cos(q) * R * .75, Math.sin(q) * R * .75); c.lineTo(Math.cos(q) * R * .88, Math.sin(q) * R * .88); c.stroke(); }
    c.fillStyle = '#5a1460'; c.font = `${R * .5}px "Press Start 2P", monospace`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('N', 0, R * .04); c.textAlign = 'left';
    c.restore();
  } };

  // ---------- БІЧНІ ПАНЕЛІ Й СТІЙКИ ----------
  /** Бічна панель: вертикальна рожева неонова трубка, екранчик-шкала, ґратка, болти. side: 1 — права (дзеркально). */
  const wing = side => (c, fw, fh) => {
    const X = f => side > 0 ? fw * (1 - f) : fw * f;
    A.neon(c, X(.3), fh * .12, X(.3), fh * .9, '#ff4fd8', 1.6);
    const sx = Math.min(X(.48), X(.86)); inset(c, sx, fh * .16, fw * .38, fh * .2, { fill: '#050a26' });
    for (let k = 0; k < 5; k++) { c.fillStyle = k < 3 ? '#3be8ff' : k < 4 ? '#ffd27a' : '#ff4fd8'; c.fillRect(sx + fw * .05, fh * (.33 - k * .033), fw * .28, fh * .018); }
    vent(c, sx, fh * .45, fw * .38, fh * .26, 6);
    bolt(c, X(.66), fh * .08); bolt(c, X(.66), fh * .8); led(c, X(.66), fh * .87, side > 0 ? '#3bff8a' : '#ff9a3a', .7);
  };
  PAINT.ws_wingL = wing(-1); PAINT.ws_wingR = wing(1);
  /** Живе на бічній панелі: шкала «рівня» гуляє, як еквалайзер; неонова трубка зрідка коротко блимає. */
  const wingLive = side => ({ every: 4, draw(c, fw, fh, t) {
    const X = f => side > 0 ? fw * (1 - f) : fw * f, sx = Math.min(X(.48), X(.86)), lv = .55 + .45 * Math.sin(t * 2.3 + side) * Math.sin(t * .9 + side * 2), n = Math.max(1, Math.round(lv * 5));
    for (let k = 0; k < 5; k++) { c.fillStyle = k < n ? ['#9af6ff', '#9af6ff', '#9af6ff', '#ffe6a8', '#ffb4f2'][k] : 'rgba(5,10,38,.9)'; c.fillRect(sx + fw * .05, fh * (.33 - k * .033), fw * .28, fh * .018); }
    if (hash(Math.floor(t * 10), side > 0 ? 3 : 4) > .95) { c.fillStyle = 'rgba(10,0,24,.55)'; c.fillRect(X(.3) - 1.4, fh * .12, 2.8, fh * .78); }
  } });
  LIVE.ws_wingL = wingLive(-1); LIVE.ws_wingR = wingLive(1);
  /** Стійка капсули спереду: блакитний неон біля внутрішнього краю, два індикатори, значок скінів, ґратка внизу. */
  const post = side => (c, fw, fh) => {
    const X = f => side > 0 ? fw * (1 - f) : fw * f, inner = X(.86);
    A.neon(c, inner, fh * .05, inner, fh * .95, '#3be8ff', 1.5);
    inset(c, Math.min(X(.14), X(.64)), fh * .1, fw * .5, fh * .3, { fill: 'rgba(5,10,38,.8)' });
    const cx = X(.39); icon(c, 'bot', cx, fh * .2, fw * .28, '#ff9af0'); for (let k = 0; k < 3; k++) { c.fillStyle = ['#3bff8a', '#3be8ff', '#ff4fd8'][k]; c.fillRect(cx - fw * .15 + k * fw * .11, fh * .33, fw * .07, fh * .02); }
    vent(c, Math.min(X(.14), X(.64)), fh * .62, fw * .5, fh * .24, 7);
    bolt(c, X(.12), fh * .05); bolt(c, X(.12), fh * .95); bolt(c, X(.66), fh * .05); bolt(c, X(.66), fh * .95);
  };
  /** Внутрішня грань стійки (видно в капсулі): світлова панель — рожево-біла смуга з поділками на темній сітці. u — від
   *  лиця вглиб (однаково для обох стійок). */
  const innerLight = (c, fw, fh) => {
    c.fillStyle = 'rgba(20,6,40,.6)'; c.fillRect(0, 0, fw, fh);
    for (let y = 2; y < fh; y += 3) { c.fillStyle = 'rgba(255,120,240,.12)'; c.fillRect(0, y, fw, .4); }
    const g = c.createLinearGradient(fw * .15, 0, fw * .55, 0); g.addColorStop(0, 'rgba(255,90,220,0)'); g.addColorStop(.5, '#ffb8f2'); g.addColorStop(1, 'rgba(255,90,220,0)');
    c.fillStyle = g; c.fillRect(fw * .15, fh * .06, fw * .4, fh * .88);
    for (let k = 0; k < 12; k++) { c.fillStyle = 'rgba(40,6,60,.55)'; c.fillRect(fw * .15, fh * (.06 + k * .0733), fw * .4, .5); }
  };
  PAINT.ws_postL = post(-1); PAINT.ws_postL.sides = { right: innerLight };
  PAINT.ws_postR = post(1); PAINT.ws_postR.sides = { left: innerLight };
  /** Живе на стійці: по неоновій трубці біжить світла «крапля», індикатори під значком спалахують по черзі. */
  const postLive = side => ({ every: 4, draw(c, fw, fh, t) {
    const X = f => side > 0 ? fw * (1 - f) : fw * f, inner = X(.86), cx = X(.39), y = fh * (.05 + ((t * .32 + (side > 0 ? .5 : 0)) % 1) * .9);
    c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createLinearGradient(0, y - 7, 0, y + 7); g.addColorStop(0, 'rgba(160,250,255,0)'); g.addColorStop(.5, 'rgba(235,255,255,.95)'); g.addColorStop(1, 'rgba(160,250,255,0)');
    c.fillStyle = g; c.fillRect(inner - 1.3, y - 7, 2.6, 14); c.restore();
    const k = (Math.floor(t * 2.5) + (side > 0 ? 1 : 0)) % 3; c.fillStyle = '#ffffff'; c.fillRect(cx - fw * .15 + k * fw * .11, fh * .33, fw * .07, fh * .02);
  } });
  LIVE.ws_postL = postLive(-1); LIVE.ws_postR = postLive(1);

  // ---------- СКЛО СКАНЕРА ----------
  /** Рожеве скло сканера: перелив, шестикутна сітка, велика емблема-кільце вгорі, іконки скінів, скан-лінії, світлий кант. */
  PAINT.ws_back = (c, fw, fh) => {
    const k = fw * .1;
    const path = () => { c.beginPath(); c.moveTo(0, fh); c.lineTo(fw, fh); c.lineTo(fw, k); c.lineTo(fw - k, 0); c.lineTo(k, 0); c.lineTo(0, k); c.closePath(); };
    path(); const g = c.createLinearGradient(0, 0, 0, fh); g.addColorStop(0, '#e046c4'); g.addColorStop(.45, '#9a1c96'); g.addColorStop(.8, '#5a0c6a'); g.addColorStop(1, '#3a0650'); c.fillStyle = g; c.fill();
    c.save(); path(); c.clip();
    const R = fw * .045; c.strokeStyle = 'rgba(255,200,250,.16)'; c.lineWidth = .35;                             // шестикутна сітка
    for (let row = 0; row * R * 1.5 < fh + R; row++) for (let col = 0; col * R * 1.73 < fw + R; col++) { const x = col * R * 1.73 + (row % 2) * R * .87, y = row * R * 1.5; c.beginPath(); for (let a = 0; a < 6; a++) { const q = Math.PI / 6 + a * Math.PI / 3; a ? c.lineTo(x + Math.cos(q) * R, y + Math.sin(q) * R) : c.moveTo(x + Math.cos(q) * R, y + Math.sin(q) * R); } c.closePath(); c.stroke(); }
    const e = c.createRadialGradient(fw / 2, fh * .55, fw * .05, fw / 2, fh * .55, fw * .7); e.addColorStop(0, 'rgba(255,220,250,.35)'); e.addColorStop(1, 'rgba(255,220,250,0)'); c.fillStyle = e; c.fillRect(0, 0, fw, fh);   // сяйво за голограмою
    const cx = fw / 2, cy = fh * .2, r = fw * .13;                                                                 // емблема вгорі
    [[1.75, 'rgba(255,170,240,.45)', .7], [1.35, '#ff9af0', .8], [1, '#ffd6f6', 1]].forEach(([q, col, lw]) => { c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); c.arc(cx, cy, r * q, 0, 7); c.stroke(); });
    c.fillStyle = 'rgba(255,214,246,.9)'; c.beginPath(); c.arc(cx, cy, r * .78, 0, 7); c.fill(); icon(c, 'bot', cx, cy, r * 1.05, '#7a1478');
    ['ai', 'heart', 'bolt', 'gear', 'chart', 'bot'].forEach((ic, n) => icon(c, ic, fw * (n < 3 ? .1 : .9), fh * (.42 + (n % 3) * .16), fw * .07, 'rgba(255,200,245,.5)'));
    c.fillStyle = 'rgba(255,190,245,.1)'; for (let y = 0; y < fh; y += 1.6) c.fillRect(0, y, fw, .55);
    c.fillStyle = 'rgba(30,0,40,.45)'; c.fillRect(0, 0, fw * .06, fh); c.fillRect(fw * .94, 0, fw * .06, fh);       // тінь у кутах (глибина капсули)
    c.restore();
    c.strokeStyle = '#ff9af0'; c.lineWidth = 1.1; path(); c.stroke(); c.strokeStyle = '#ffe6fb'; c.lineWidth = .35; path(); c.stroke();
  };
  /** Живе на склі: кільця емблеми обертаються, смуга сканування пробігає згори вниз. */
  LIVE.ws_back = { every: 3, draw(c, fw, fh, t) {
    const cx = fw / 2, cy = fh * .2, r = fw * .13;
    c.save(); c.globalCompositeOperation = 'lighter'; c.setLineDash([2.6, 2]);
    for (let k = 0; k < 2; k++) { const a = t * (k ? -1.1 : .8) + k; c.strokeStyle = k ? 'rgba(120,230,255,.6)' : 'rgba(255,190,245,.75)'; c.lineWidth = .8; c.beginPath(); c.arc(cx, cy, r * (1.55 + k * .25), a, a + 4.4); c.stroke(); }
    c.setLineDash([]); const sy = fh * ((t * .3) % 1), g = c.createLinearGradient(0, sy - 7, 0, sy + 1); g.addColorStop(0, 'rgba(255,120,240,0)'); g.addColorStop(1, 'rgba(255,215,250,.55)'); c.fillStyle = g; c.fillRect(fw * .02, sy - 7, fw * .96, 8);
    c.restore();
  } };

  // ---------- БАЛКА ----------
  PAINT.ws_beam = (c, fw, fh) => {
    for (let k = 0; k < 15; k++) bolt(c, fw * (.08 + k * .06), fh * .13, .75);
    [[.035, .14], [.86, .965]].forEach(([a, b]) => vent(c, fw * a, fh * .3, fw * (b - a), fh * .4, 4));
    A.neon(c, fw * .07, fh * .86, fw * .93, fh * .86, '#ff4fd8', 1.3);
    c.fillStyle = 'rgba(0,0,0,.4)'; c.fillRect(0, fh * .93, fw, fh * .07);
  };
  /** Живе на балці: по рожевому неону біжать три вогники; вивіска зрідка ловить відблиск. */
  LIVE.ws_beam = { every: 4, draw(c, fw, fh, t) {
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 3; k++) { const x = fw * (.07 + (((t * .22) + k / 3) % 1) * .86), g = c.createLinearGradient(x - 9, 0, x + 9, 0); g.addColorStop(0, 'rgba(255,150,240,0)'); g.addColorStop(.5, 'rgba(255,238,252,.95)'); g.addColorStop(1, 'rgba(255,150,240,0)');
      c.fillStyle = g; c.fillRect(x - 9, fh * .86 - 1, 18, 2); }
    c.restore();
  } };
  LIVE.ws_sign = NX.arc.glint(6.8, 3.4);
  /** Спід балки (видно знизу, над капсулою): панель світла — сітка світлодіодів над входом. */
  PAINT.ws_beam.sides = { bottom: (c, fw, fh) => {
    c.fillStyle = 'rgba(10,4,26,.7)'; c.fillRect(0, 0, fw, fh);
    const x0 = fw * .27, x1 = fw * .73; inset(c, x0 - 1, fh * .12, x1 - x0 + 2, fh * .76, { fill: 'rgba(40,10,60,.9)' });
    for (let y = fh * .2; y < fh * .82; y += 2.6) for (let x = x0 + 1.4; x < x1 - .5; x += 2.6) { c.fillStyle = (Math.round(x * 3 + y * 7) % 5) ? '#ffd6f6' : '#9af6ff'; c.fillRect(x - .55, y - .55, 1.1, 1.1); }
  } };

  // ---------- ПЛАНШЕТИ: ліворуч — СКІНИ (готові скіни з рідкістю), праворуч — АКСЕСУАРИ (те, що він вдягає) ----------
  // Власник (29.10): «аксесуари й предмети розділи; предмети — це реліквії, вони окремо» — реліквії тепер кружляють навколо
  // голограми (objects/workshop.js), а планшети показують скіни й аксесуари. Обидва гортаються сторінками.
  const TAB = { [-1]: { title: 'scene.ws.skins', glass: ['#1a62c8', '#0f3a96', '#0a2470'], line: '#7af4ff', glow: '#3be8ff', card: 'rgba(16,40,120,.85)', edge: 'rgba(150,230,255,.5)', hi: '150,240,255' },
    [1]: { title: 'scene.ws.acc', glass: ['#4a1c9a', '#2c1274', '#1a0c52'], line: '#ff9af0', glow: '#ff4fd8', card: 'rgba(44,18,104,.85)', edge: 'rgba(255,180,240,.5)', hi: '255,160,240' } };
  /** Планшет (нерухоме): корпус, скло з переливом, заголовок, сітка карток 2 × 3. */
  const tablet = side => (c, fw, fh) => {
    const S = TAB[side];
    c.fillStyle = '#0a0a2a'; rr(c, 0, 0, fw, fh, 2.2); c.fill(); c.strokeStyle = '#3b4aa8'; c.lineWidth = .6; rr(c, .4, .4, fw - .8, fh - .8, 2); c.stroke();
    glass(c, fw * .07, fh * .05, fw * .86, fh * .88, { r: 1.4, a: S.glass[0], b: S.glass[1], c: S.glass[2], line: S.line });
    A.txt(c, NX.t(S.title), fw / 2, fh * .1, fw * .6, fh * .045, '#f4fbff', { glow: S.glow });
    for (let q = 0; q < 6; q++) { const [x, y, w, h] = cell(fw, fh, q); c.fillStyle = S.card; rr(c, x, y, w, h, .8); c.fill(); c.strokeStyle = S.edge; c.lineWidth = .35; rr(c, x, y, w, h, .8); c.stroke(); }
    c.fillStyle = '#05030f'; c.fillRect(fw * .4, fh * .952, fw * .2, fh * .026); led(c, side > 0 ? fw * .15 : fw * .85, fh * .965, '#3bff8a', .55);
  };
  const cell = (fw, fh, q) => [fw * (.13 + (q % 2) * .38), fh * (.17 + Math.floor(q / 2) * .26), fw * .36, fh * .23];
  PAINT.ws_tabL = tablet(-1); PAINT.ws_tabR = tablet(1);
  /** Гортання: картка підсвічується по черзі (per с), після шести — наступна сторінка (по колу: на останній — знову перші). */
  const pager = (t, n, shift = 0) => { const per = 1.6, k = Math.floor(t / per) + shift, pages = Math.ceil(n / 6), page = Math.floor(k / 6) % pages, since = (t + shift * per) - Math.floor(k / 6) * 6 * per; return { page, pages, sel: k % 6, since }; };
  /** Поява картки q нової сторінки: масштаб з легким «перестрибуванням» (0..1+), спалах на мить. */
  const pop = (since, q) => { const k = Math.max(0, Math.min(1, (since - q * .07) / .32)); if (k >= 1) return [1, 0]; const s = 1 + 2.2 * Math.pow(k - 1, 3) + 1.2 * Math.pow(k - 1, 2); return [Math.max(0, s), 1 - k]; };
  /** Рамка вибраної картки, сяйво, крапки сторінок, скан-лінія по екрану. */
  function chrome(c, fw, fh, t, S, sel, page, pages) {
    const [x, y, w, h] = cell(fw, fh, sel); c.strokeStyle = '#ffffff'; c.lineWidth = .6; rr(c, x - .3, y - .3, w + .6, h + .6, .9); c.stroke();
    c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(${S.hi},${.12 + .1 * Math.sin(t * 5)})`; rr(c, x, y, w, h, .8); c.fill(); c.restore();
    for (let k = 0; k < pages; k++) { c.fillStyle = k === page ? S.line : 'rgba(255,255,255,.3)'; c.fillRect(fw / 2 - pages * 1.6 + k * 3.2 + .4, fh * .96, 1.6, fh * .012); }
    const sy = fh * (.15 + ((t * .25) % 1) * .8); c.fillStyle = `rgba(${S.hi},.2)`; c.fillRect(fw * .08, sy, fw * .84, .6);
  }
  /** Міні-Nexi для карток: кожен образ малюється раз (renderBot) і береться з кешу. */
  const MINI = {};
  function mini(look) {
    const k = JSON.stringify(look); if (MINI[k]) return MINI[k];
    const cv = document.createElement('canvas'); renderBot(Object.assign({}, DEFAULT_LOOK, look), poseFor('stand', .5, false), .5, cv); return MINI[k] = cv;   // t .5 — очі відкриті (у t 0 Nexi кліпає)
  }
  /** Сторінка карток: міні-Nexi в образі look(id), «вистрибують» при гортанні; frame(id) — колір рамки картки (рідкість). */
  function cards(c, fw, fh, t, ids, shift, S, look, frame) {
    const { page, pages, sel, since } = pager(t, ids.length, shift);
    for (let q = 0; q < 6; q++) {
      const id = ids[(page * 6 + q) % ids.length], [x, y, w, h] = cell(fw, fh, q), cv = mini(look(id)), [k, fl] = pop(since, q), s = Math.min(w / SW, h / SH) * 1.25 * k, bob = q === sel ? Math.sin(t * 6) * .4 : 0, col = frame && frame(id);
      c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip(); c.imageSmoothingEnabled = false;
      if (col) { const g = c.createLinearGradient(0, y + h * .55, 0, y + h); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, col + '66'); c.fillStyle = g; c.fillRect(x, y, w, h); }   // сяйво рідкості знизу
      if (s > .01) c.drawImage(cv, 0, 0, SW, SH, x + w / 2 - SW * s / 2, y + h * .98 - SH * s * .93 + bob, SW * s, SH * s);
      if (fl > 0) { c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(${S.hi},${fl * .5})`; rr(c, x, y, w, h, .8); c.fill(); }
      c.restore();
      if (col) { c.strokeStyle = col; c.lineWidth = .45; rr(c, x + .2, y + .2, w - .4, h - .4, .8); c.stroke(); c.fillStyle = col; c.fillRect(x + w * .3, y + h - .9, w * .4, .6); }   // рамка й рисочка кольору рідкості
    }
    chrome(c, fw, fh, t, S, sel, page, pages);
  }
  const PRESETS = Object.keys(SKINS);
  LIVE.ws_tabL = { every: 4, draw(c, fw, fh, t) { cards(c, fw, fh, t, PRESETS, 0, TAB[-1], id => skinLook(id), id => RARITY[SKINS[id].rar]); } };
  LIVE.ws_tabR = { every: 4, draw(c, fw, fh, t) { cards(c, fw, fh, t, WEAR_ACCS, 3, TAB[1], id => ({ [ACCS[id].slot]: id })); } };
})();
