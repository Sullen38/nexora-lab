/* ============================================================================
 * objects/tl_paint.js — ІНСТРУМЕНТИ («МАЙСТЕРНЯ ІНТЕГРАЦІЙ»): МАЛЮНКИ ГРАНЕЙ, ФОРМА РОЗПІРОК, ВМІСТ ГОЛО-КАРТОК
 * ----------------------------------------------------------------------------
 * Розкладка частин — tools/wingbox/gen_room.py: tools() (id tl_*). Тут — як виглядають їхні грані (NX.arc.paint[id], пласкі
 * текстури: рушій кладе їх у перспективу), що на них живе (NX.arc.LIVE[id]) і форма розпірок (NX.arc.shape['st:brace']).
 * Голо-картки, маячок, антена, іскри лещат — живий об'єкт objects/tools.js (вміст карток — NX.arc.tlPane нижче).
 * Крок 9 (власник: «вклади душу: більше графіки, унікальності, фішок; простір для ніг, унікальні краї; столи не однакові;
 * екрани — пласкі, зрідка глючать»). Характер зони — на противагу спокійній аналітиці: індустріальна майстерня — сталь,
 * помаранчеве робоче світло, попереджувальні смуги, заклепки, кабелі; голо-картки — бурштинові.
 *   tl_top     — товста сталева стільниця: кромка з помаранчевим неоном (живе: «дихає», по ній пробігає вогник, коли картка
 *                синхронізувалась), заклепки, смуги на кінцях; зверху — гумовий килимок із сіткою й лінійкою; торець — плита
 *   tl_leg*    — ніжки: смуги «обережно», болти, гумові п'ятки;  розпірки (форма brace) — помаранчеві трубки навхрест
 *   tl_shelf, tl_box, tl_coil — нижня полиця з LED-кромкою, червоний ящик (защіпки, наліпка, ручка), бухта кабелю
 *   tl_hub     — хаб інтеграцій: віконце з хвилею, шість портів з кольоровими штекерами (живі: вогники трафіку)
 *   tl_viseB/J — лещата: гвинт з воротком, рифлені губки (іскри — живі)
 * Крок 10 (власник: «екрани громосткі в профіль; треба інноваційні, футуристичні, кіберпанк»): шафу-панель прибрано —
 * КОЗЛОВИЙ ПІДЙОМНИК: tl_beam (двотаврова балка; знизу — тепла LED-смуга на картки), tl_postL/R (тонкі стійки з LED-смугою),
 * tl_podL/R (прожектори-проєктори на кінцях балки), tl_cblL/R (кабелі вздовж стійок — форма st:cable, NX.arc.tlCable);
 *   tl_back    — перфодошка внизу, за верстаком: дірочки, ряд гнізд над стільницею, інструменти на гачках (видно крізь
 *                простір для ніг); голо-картки — восьмикутні кіберпанк-картки з бурштиновим кантом (NX.arc.tlPane)
 * Коли Nexi працює в зоні (NX.objects.tools.active — наступний крок), усе біжить швидше. Написи — NX.t (4 мови):
 * scene.tools.*; без перекладу — CRM, API, AI (правило словників).
 * ========================================================================== */
(() => {
  const A = NX.arc.kit, T = NX.arc.pt, PAINT = NX.arc.paint, LIVE = NX.arc.LIVE, hash = NX.art.hash, t_ = k => NX.t(k), X3 = NX.px3d, PL = A.PAL;
  const { icon, rr, inset, bolt, led, vent } = T;
  const TL = () => NX.objects.tools || {};
  const CY = '#3be8ff', OR = '#ff9a3a', GR = '#3bff8a', PK = '#ff4fd8', VI = '#9a8cff', YE = '#ffd27a';
  const ease = k => k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;

  // ---------- матеріали й форма розпірок ----------
  A.STY.chrome = A.STY.chrome || { pal: PL.CHROME, q: .55, bev: .4, ins: 0, metal: 1 };
  A.STY.brushed = { pal: X3.pal(['#0b0a20', '#141236', '#1d1b4a', '#28265e', '#363474', '#47458c', '#5c5aa6', '#7674c0', '#9896da']), q: .5, bev: .9, ins: 0, metal: 1 };   // шліфована сталь
  A.STY.toolbox = { pal: X3.pal(['#22040e', '#3e0816', '#5e0e20', '#82162a', '#a62034', '#c8323e', '#e44e4c', '#fa7a66']), q: .55, bev: .7, ins: 0 };            // червоний ящик
  const PAINTED = X3.pal(['#2a1006', '#4a1c08', '#6e2c0c', '#924012', '#b4561a', '#d27028', '#ea8c3c', '#ffb066']);   // помаранчева фарба розпірок
  const SHP = NX.arc.shape = NX.arc.shape || {};
  /** Розпірка навхрест (стиль brace): дві трубки по діагоналях з хомутом у перетині. Вузька (w < dep) — бічна, у площині
   *  u = 0 від переду до заду; широка — задня, у площині v = dep/2, кілька прольотів «XX» і верхня рейка. */
  SHP['st:brace'] = (G, B) => {
    const P = G.P, w = B.w, d = B.dep, yt = B.yt + .8, yb = B.yb - .8, side = w < d, r = 1.5;
    const sh = (u, v, i, j) => X3.ramp(PAINTED, .16 + (1 - Math.abs(u - .36) * 2.1) * .72 + ((v * 7) % 1 < .05 ? -.18 : 0), i, j);
    const at = (f, y) => side ? P(0, d * f, y) : P(-w / 2 + w * f, d / 2, y), n = side ? 1 : Math.max(1, Math.round(w / ((yb - yt) * 2)));
    for (let k = 0; k < n; k++) {
      const a = k / n, b = (k + 1) / n; G.tube(at(a, yt), at(b, yb), r, sh); G.tube(at(a, yb), at(b, yt), r, sh);
      const m = at((a + b) / 2, (yt + yb) / 2); G.disc([m[0], m[1], m[2] - 1], r * 1.05, (u, v, i, j) => X3.ramp(PL.CHROME, .82 - Math.hypot(u - .38, v - .38) * 1.3, i, j));
    }
    if (!side) G.tube(at(0, yt - .4), at(1, yt - .4), r * .8, (u, v, i, j) => X3.ramp(PL.STEEL, .3 + (1 - Math.abs(u - .4) * 2) * .6, i, j));
  };

  // ---------- дрібниці ----------
  /** Попереджувальні смужки (жовто-чорні, навскіс). */
  function hazard(c, x, y, w, h, s = 1) {
    c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip(); c.fillStyle = '#e8b82a'; c.fillRect(x, y, w, h); c.fillStyle = '#1a1020';
    const p = Math.max(h, 2.2) * 1.2 * s; for (let xx = x - h - p; xx < x + w + p; xx += p) { c.beginPath(); c.moveTo(xx, y + h); c.lineTo(xx + p * .5, y + h); c.lineTo(xx + p * .5 + h, y); c.lineTo(xx + h, y); c.fill(); }
    c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(x, y, w, Math.min(.35, h * .2)); c.restore();
  }
  /** Шліфування: тонкі світлі й темні горизонтальні штрихи (сталь). */
  function brush(c, x, y, w, h, seed = 0) {
    for (let k = 0; k < h * 2.2; k++) { const yy = y + hash(k, seed) * h, a = .05 + .08 * hash(k, seed + 1), x0 = x + w * hash(k, seed + 2) * .6;
      c.fillStyle = k % 3 ? `rgba(220,225,255,${a})` : `rgba(0,0,10,${a * 1.4})`; c.fillRect(x0, yy, w * (.2 + .5 * hash(k, seed + 3)), .22); }
  }
  /** Інструменти на гачках (силуети з бліком): ключ, викрутка, молоток, плоскогубці, рулетка. */
  function tool(c, kind, x, y, s, col = '#c8d0f0') {
    c.save(); c.translate(x, y); c.fillStyle = col; const hi = 'rgba(255,255,255,.55)', dk = 'rgba(10,6,30,.6)';
    if (kind === 'wrench') { c.rotate(-.12); c.fillRect(-s * .06, -s * .38, s * .12, s * .76); c.beginPath(); c.arc(0, -s * .42, s * .15, 0, 7); c.fill(); c.fillStyle = '#0a0620'; c.fillRect(-s * .05, -s * .6, s * .1, s * .17); c.fillStyle = col; c.beginPath(); c.arc(0, s * .42, s * .12, 0, 7); c.fill(); c.fillStyle = hi; c.fillRect(-s * .06, -s * .3, s * .035, s * .6); }
    else if (kind === 'driver') { c.fillStyle = OR; rr(c, -s * .08, -s * .5, s * .16, s * .38, s * .05); c.fill(); c.fillStyle = dk; c.fillRect(-s * .02, -s * .48, s * .04, s * .34); c.fillStyle = col; c.fillRect(-s * .025, -s * .12, s * .05, s * .58); c.fillStyle = hi; c.fillRect(-s * .025, -s * .1, s * .02, s * .5); }
    else if (kind === 'hammer') { c.fillStyle = '#a05668'; c.fillRect(-s * .04, -s * .3, s * .08, s * .78); c.fillStyle = col; rr(c, -s * .22, -s * .46, s * .44, s * .17, s * .03); c.fill(); c.fillStyle = hi; c.fillRect(-s * .2, -s * .45, s * .4, s * .04); }
    else if (kind === 'tape') { c.fillStyle = YE; c.beginPath(); c.arc(0, 0, s * .26, 0, 7); c.fill(); c.fillStyle = '#1a1020'; c.beginPath(); c.arc(0, 0, s * .1, 0, 7); c.fill(); c.fillStyle = '#e8e0c8'; c.fillRect(s * .2, s * .14, s * .3, s * .06); c.fillStyle = hi; c.fillRect(-s * .18, -s * .2, s * .14, s * .05); }
    else { c.rotate(.12); c.fillRect(-s * .1, -s * .45, s * .07, s * .34); c.fillRect(s * .03, -s * .45, s * .07, s * .34); c.beginPath(); c.arc(0, -s * .1, s * .08, 0, 7); c.fill();
      c.fillStyle = PK; c.fillRect(-s * .12, -s * .06, s * .08, s * .5); c.fillRect(s * .04, -s * .06, s * .08, s * .5); c.fillStyle = hi; c.fillRect(-s * .1, -s * .44, s * .02, s * .3); }   // плоскогубці
    c.restore();
  }

  // ---------- ВЕРСТАК: стільниця ----------
  /** Кромка стільниці: світла губа, шліфована сталь, помаранчевий неон робочого світла, ряд заклепок, смуги на кінцях. */
  PAINT.tl_top = (c, fw, fh) => {
    brush(c, 0, 0, fw, fh, 3);
    c.fillStyle = 'rgba(255,236,214,.34)'; c.fillRect(0, 0, fw, fh * .08); c.fillStyle = 'rgba(8,4,24,.4)'; c.fillRect(0, fh * .08, fw, fh * .05);
    c.fillStyle = 'rgba(6,3,18,.75)'; c.fillRect(0, fh * .3, fw, fh * .24); A.neon(c, fw * .012, fh * .42, fw * .988, fh * .42, OR, 1.6);   // паз з неоном
    for (let x = 5; x < fw - 3; x += 11.5) bolt(c, x, fh * .76, .72);
    hazard(c, 0, fh * .62, fw * .055, fh * .3); hazard(c, fw * .945, fh * .62, fw * .055, fh * .3);
    c.fillStyle = 'rgba(0,0,0,.45)'; c.fillRect(0, fh * .95, fw, fh * .05);
  };
  /** Кромка живе: неон «дихає»; коли картка синхронізувалась (і зрідка просто так) — уздовж пробігає білий вогник. */
  LIVE.tl_top = { every: 3, draw(c, fw, fh, t) {
    const p = .5 + .5 * Math.sin(t * 1.7), s = NX.arc.tlSync(t), run = s.f > .82 ? (s.f - .82) / .18 : ((t * .11) % 1) < .08 ? ((t * .11) % 1) / .08 : -1;
    c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(255,160,70,${.06 + .1 * p})`; c.fillRect(0, fh * .3, fw, fh * .24);
    if (run >= 0) { const x = fw * run, g = c.createRadialGradient(x, fh * .42, 0, x, fh * .42, fh * .9); g.addColorStop(0, 'rgba(255,250,230,.95)'); g.addColorStop(.35, 'rgba(255,180,90,.55)'); g.addColorStop(1, 'rgba(255,150,60,0)'); c.fillStyle = g; c.fillRect(x - fh, 0, fh * 2, fh); }
    c.restore();
  } };
  /** Стільниця зверху: гумовий килимок (сітка, лінійка вздовж краю, рамка-«місце» під хабом), сталевий кант навколо. */
  PAINT.tl_top.sides = {
    top: (c, fw, fh) => {
      const x0 = fw * .025, x1 = fw * .975, y0 = fh * .07, y1 = fh * .93; c.fillStyle = 'rgba(6,22,34,.86)'; rr(c, x0, y0, x1 - x0, y1 - y0, 1.2); c.fill();
      c.strokeStyle = 'rgba(80,210,230,.16)'; c.lineWidth = .25; for (let x = x0 + 5; x < x1; x += 5) { c.beginPath(); c.moveTo(x, y0 + 2.4); c.lineTo(x, y1); c.stroke(); } for (let y = y0 + 5; y < y1; y += 5) { c.beginPath(); c.moveTo(x0, y); c.lineTo(x1, y); c.stroke(); }
      for (let k = 0, x = x0 + 1; x < x1 - .5; x += 1, k++) { c.fillStyle = k % 10 ? 'rgba(255,210,150,.5)' : '#ffd8a8'; c.fillRect(x, y0 + .3, .22, k % 10 ? .9 : 1.9); }   // лінійка
      c.strokeStyle = 'rgba(255,154,58,.55)'; c.lineWidth = .4; c.setLineDash([1.4, 1]); c.strokeRect(fw * .27, fh * .18, fw * .38, fh * .64); c.setLineDash([]);   // «місце» під хабом
      for (let k = 0; k < 9; k++) { c.fillStyle = 'rgba(200,230,255,.12)'; c.fillRect(x0 + (x1 - x0) * hash(k, 31), y0 + (y1 - y0) * hash(k, 33), 2 + 4 * hash(k, 35), .2); }   // подряпини
    },
    right: (c, fw, fh) => {                                                                               // торець (видно): плита з болтами, смуги
      inset(c, fw * .06, fh * .14, fw * .88, fh * .72, 'rgba(10,8,30,.55)', .5); hazard(c, fw * .1, fh * .56, fw * .8, fh * .24);
      A.neon(c, 0, fh * .42, fw * .14, fh * .42, OR, 1.4); bolt(c, fw * .2, fh * .32, .7); bolt(c, fw * .8, fh * .32, .7);
    },
  };

  // ---------- ВЕРСТАК: ніжки, полиця, ящик, бухта ----------
  /** Ніжка: болти вгорі, світловідбивна смужка, смуги «обережно» над гумовою п'ятою. */
  const leg = (c, fw, fh) => {
    brush(c, 0, 0, fw, fh, 7); bolt(c, fw * .3, fh * .05, .7); bolt(c, fw * .7, fh * .05, .7);
    c.fillStyle = 'rgba(255,154,58,.75)'; c.fillRect(fw * .38, fh * .3, fw * .24, fh * .14); c.fillStyle = 'rgba(255,230,190,.8)'; c.fillRect(fw * .4, fh * .31, fw * .06, fh * .12);
    hazard(c, 0, fh * .8, fw, fh * .09); c.fillStyle = '#07040f'; c.fillRect(-.5, fh * .92, fw + 1, fh * .08); c.fillStyle = 'rgba(150,140,200,.3)'; c.fillRect(0, fh * .92, fw, .3);
  };
  ['tl_legFL', 'tl_legFR', 'tl_legBL', 'tl_legBR'].forEach(id => { PAINT[id] = leg; PAINT[id].sides = { right: leg }; });
  /** Полиця: кромка з блакитною LED-смугою (світить на підлогу) і заклепками. */
  PAINT.tl_shelf = (c, fw, fh) => { c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(0, 0, fw, fh * .16); A.neon(c, fw * .02, fh * .58, fw * .98, fh * .58, CY, .9); for (let x = 4; x < fw; x += 16) bolt(c, x, fh * .58, .5); };
  /** Ящик інструментів: кришка зі швом, хромовані защіпки, наліпки (шестерня NEXORA й смуга «обережно»), темне дно. */
  PAINT.tl_box = (c, fw, fh) => {
    c.fillStyle = 'rgba(255,200,200,.22)'; c.fillRect(0, 0, fw, fh * .06); c.fillStyle = 'rgba(30,0,8,.7)'; c.fillRect(0, fh * .3, fw, fh * .05); c.fillStyle = 'rgba(255,180,170,.25)'; c.fillRect(0, fh * .35, fw, .3);
    [.18, .82].forEach(f => { c.fillStyle = '#2a2a4a'; rr(c, fw * f - 2.2, fh * .2, 4.4, fh * .3, .5); c.fill(); c.fillStyle = '#c8d0f0'; rr(c, fw * f - 1.6, fh * .22, 3.2, fh * .24, .4); c.fill(); c.fillStyle = '#ffffff'; c.fillRect(fw * f - 1.3, fh * .23, 1, fh * .2); });
    c.fillStyle = '#0a0620'; c.beginPath(); c.arc(fw * .62, fh * .62, fh * .2, 0, 7); c.fill(); c.strokeStyle = CY; c.lineWidth = .5; c.beginPath(); c.arc(fw * .62, fh * .62, fh * .2, 0, 7); c.stroke();
    icon(c, 'gear', fw * .62, fh * .62, fh * .24, '#9af6ff'); hazard(c, fw * .12, fh * .56, fw * .3, fh * .12);
    c.fillStyle = 'rgba(10,0,4,.65)'; c.fillRect(0, fh * .9, fw, fh * .1);
  };
  PAINT.tl_box.sides = {
    top: (c, fw, fh) => { c.fillStyle = 'rgba(255,190,180,.12)'; c.fillRect(0, 0, fw, fh); c.fillStyle = '#1a1830'; c.fillRect(fw * .3, fh * .38, 2, fh * .24); c.fillRect(fw * .7 - 2, fh * .38, 2, fh * .24);
      c.fillStyle = '#c8d0f0'; rr(c, fw * .3, fh * .42, fw * .4, fh * .16, .8); c.fill(); c.fillStyle = '#ffffff'; c.fillRect(fw * .32, fh * .44, fw * .36, .4); },   // ручка
    right: (c, fw, fh) => { inset(c, fw * .3, fh * .3, fw * .4, fh * .2, 'rgba(20,0,6,.8)', .5); },
  };
  /** Бухта кабелю: зверху — спіраль помаранчевого кабелю зі штекером, збоку — витки. */
  PAINT.tl_coil = () => {};
  PAINT.tl_coil.sides = {
    top: (c, fw, fh) => { const cx = fw / 2, cy = fh / 2; c.fillStyle = '#0a0618'; c.beginPath(); c.ellipse(cx, cy, fw * .2, fh * .2, 0, 0, 7); c.fill();
      c.strokeStyle = '#b4561a'; c.lineWidth = 1.1; c.beginPath(); for (let a = 0; a < Math.PI * 9; a += .1) { const r = .22 + .25 * a / (Math.PI * 9); c.lineTo(cx + Math.cos(a) * fw * r, cy + Math.sin(a) * fh * r); } c.stroke();
      c.strokeStyle = 'rgba(255,200,140,.5)'; c.lineWidth = .3; c.stroke(); c.fillStyle = '#c8d0f0'; c.fillRect(cx + fw * .44, cy - 1, 2.6, 2); c.fillStyle = CY; c.fillRect(cx + fw * .44 + 2.6, cy - .5, 1, 1); },
    side: (c, fw, fh) => { for (let y = fh * .18; y < fh; y += 1.3) { c.fillStyle = 'rgba(180,86,26,.85)'; c.fillRect(0, y, fw, .9); c.fillStyle = 'rgba(255,200,140,.35)'; c.fillRect(0, y, fw, .25); } },
  };

  // ---------- ХАБ ІНТЕГРАЦІЙ ----------
  const PORTS = [OR, CY, GR, PK, VI, YE], portX = k => .4 + k * .095;
  /** Хаб: віконце хвилі (живе), шість портів з кольоровими штекерами, решітка. */
  PAINT.tl_hub = (c, fw, fh) => {
    c.fillStyle = 'rgba(200,230,255,.18)'; c.fillRect(0, 0, fw, fh * .08);
    inset(c, fw * .05, fh * .22, fw * .27, fh * .56, 'rgba(2,10,28,.95)', .6);                                     // віконце
    PORTS.forEach((col, k) => { const x = fw * portX(k), y = fh * .56; c.fillStyle = '#05030f'; rr(c, x - 2.4, y - 2.2, 4.8, 4.4, .6); c.fill();
      c.fillStyle = col; rr(c, x - 1.6, y - 1.5, 3.2, 3, .5); c.fill(); c.fillStyle = '#1a1830'; c.fillRect(x - .8, y - .7, 1.6, 1.4); c.fillStyle = 'rgba(255,255,255,.6)'; c.fillRect(x - 1.4, y - 1.4, 1.2, .35); });
    vent(c, fw * .935, fh * .2, fw * .05, fh * .6, 4);
  };
  PAINT.tl_hub.sides = { top: (c, fw, fh) => { vent(c, fw * .08, fh * .2, fw * .5, fh * .5, 5);
    const x = fw * .85, y = fh * .73; c.fillStyle = '#05030f'; c.beginPath(); c.arc(x, y, 2.2, 0, 7); c.fill(); c.strokeStyle = CY; c.lineWidth = .5; c.beginPath(); c.arc(x, y, 2.2, 0, 7); c.stroke(); } };   // гніздо антени
  /** Хаб живе: хвиля у віконці, вогники над портами (трафік; той, що синхронізується, — частіше). */
  LIVE.tl_hub = { every: 2, draw(c, fw, fh, t) {
    const s = NX.arc.tlSync(t), sp = TL().active ? 2.2 : 1, x0 = fw * .05 + .5, w = fw * .27 - 1, y = fh * .5, a = fh * .16;
    c.fillStyle = 'rgba(2,12,30,.95)'; c.fillRect(x0, fh * .22 + .5, w, fh * .56 - 1);
    c.strokeStyle = s.f < .82 ? '#ffb066' : GR; c.lineWidth = .45; c.beginPath();
    for (let i = 0; i <= 24; i++) { const x = x0 + w * i / 24, v = Math.sin(i * .7 - t * 6 * sp) * Math.sin(i * .21 + t * 1.3) * (s.f < .82 ? 1 : .35); i ? c.lineTo(x, y + v * a) : c.moveTo(x, y + v * a); } c.stroke();
    PORTS.forEach((col, k) => { const on = hash(Math.floor(t * 7 * sp) + k * 13, k + 3) > (k % 3 === s.k ? .25 : .6); if (on) led(c, fw * portX(k), fh * .2, col, .42); });
  } };
  /** Лещата: основа з гвинтом і воротком, рифлені хромовані губки з затиснутою заготовкою. */
  PAINT.tl_viseB = (c, fw, fh) => { brush(c, 0, 0, fw, fh, 9); bolt(c, fw * .1, fh * .5, .6); bolt(c, fw * .9, fh * .5, .6);
    c.fillStyle = '#c8d0f0'; c.fillRect(fw * .2, fh * .42, fw * .6, fh * .18); c.fillStyle = '#ffffff'; c.fillRect(fw * .2, fh * .42, fw * .6, .3); [.2, .8].forEach(f => { c.fillStyle = '#e0e4ff'; c.beginPath(); c.arc(fw * f, fh * .51, fh * .2, 0, 7); c.fill(); });
    c.fillStyle = '#05030f'; c.beginPath(); c.arc(fw * .5, fh * .51, fh * .26, 0, 7); c.fill(); c.fillStyle = '#8a93b8'; c.beginPath(); c.arc(fw * .5, fh * .51, fh * .14, 0, 7); c.fill(); };
  PAINT.tl_viseJ = (c, fw, fh) => {
    for (let x = .8; x < fw - .4; x += 1.1) { c.fillStyle = 'rgba(10,8,30,.4)'; c.fillRect(x, fh * .1, .35, fh * .38); }
    c.fillStyle = '#05030f'; c.fillRect(fw * .47, 0, fw * .06, fh); c.fillStyle = '#3a2a1a'; c.fillRect(fw * .44, fh * .04, fw * .12, fh * .2);   // щілина й заготовка
    c.fillStyle = 'rgba(255,160,80,.85)'; c.fillRect(fw * .45, fh * .04, fw * .1, .5);
  };

  // ---------- КОЗЛОВИЙ ПІДЙОМНИК (крок 10): тонкий сталевий портал замість шафи-панелі ----------
  // Власник: «екрани громосткі в профіль; треба інноваційні, футуристичні, типу кіберпанк». Шапки, стовпів і великої
  // перфодошки більше немає: за верстаком — двотаврова балка на двох тонких стійках, уздовж стійок звисають кабелі, на кінцях
  // балки — прожектори-проєктори, під нею на тягах висить вивіска; голо-картки висять між стійками (objects/tools.js).
  A.STY.gantry = { pal: X3.pal(['#07061a', '#0d0b26', '#141134', '#1c1844', '#262056', '#322a6c', '#403684', '#52469e']), q: .55, bev: .9, ins: 0, metal: 1 };   // воронована сталь
  A.STY.pod = { pal: PL.MACH, q: .5, bev: .7, ins: 0 };
  /** Двотаврова балка: світлі полиці зверху й знизу, темна стінка з отворами-полегшеннями й заклепками, смуги на кінцях. */
  PAINT.tl_beam = (c, fw, fh) => {
    brush(c, 0, 0, fw, fh, 21);
    c.fillStyle = 'rgba(220,226,255,.3)'; c.fillRect(0, 0, fw, fh * .16); c.fillRect(0, fh * .84, fw, fh * .16); c.fillStyle = 'rgba(255,255,255,.5)'; c.fillRect(0, 0, fw, .35);
    c.fillStyle = 'rgba(2,2,12,.55)'; c.fillRect(0, fh * .16, fw, fh * .68);                                       // стінка
    for (let x = fw * .1; x < fw * .91; x += 15) { c.fillStyle = '#03020a'; c.beginPath(); c.ellipse(x, fh * .5, 3.4, fh * .22, 0, 0, 7); c.fill();
      c.strokeStyle = 'rgba(160,150,240,.35)'; c.lineWidth = .35; c.beginPath(); c.ellipse(x, fh * .5, 3.4, fh * .22, 0, 0, 7); c.stroke(); }   // отвори-полегшення
    for (let x = 4; x < fw; x += 7.5) { bolt(c, x, fh * .08, .45); bolt(c, x, fh * .92, .45); }
    hazard(c, 0, fh * .2, fw * .05, fh * .6); hazard(c, fw * .95, fh * .2, fw * .05, fh * .6);
  };
  const endPlate = (c, fw, fh) => { inset(c, fw * .1, fh * .15, fw * .8, fh * .7, 'rgba(8,6,28,.6)', .5); hazard(c, fw * .14, fh * .3, fw * .72, fh * .4); };
  PAINT.tl_beam.sides = {
    bottom: (c, fw, fh) => { c.fillStyle = 'rgba(4,3,14,.7)'; c.fillRect(0, 0, fw, fh); A.neon(c, fw * .03, fh * .5, fw * .97, fh * .5, OR, 1.6);   // світло на картки
      for (let x = fw * .04; x < fw * .96; x += 5) { c.fillStyle = 'rgba(255,244,224,.95)'; c.fillRect(x, fh * .5 - .45, 1.6, .9); } },
    right: endPlate, left: endPlate,
  };
  /** Тонка стійка: бурштинова LED-смуга згори до верстака, болти, смуги «обережно» на рівні верстака й біля підлоги. */
  const post = (c, fw, fh) => {
    brush(c, 0, 0, fw, fh, 23); A.neon(c, fw * .5, fh * .02, fw * .5, fh * .62, OR, .8);
    for (let y = fh * .05; y < fh * .62; y += 22) bolt(c, fw * .5, y, .55);
    hazard(c, 0, fh * .66, fw, fh * .03); hazard(c, 0, fh * .9, fw, fh * .04); c.fillStyle = '#07040f'; c.fillRect(-.5, fh * .97, fw + 1, fh * .03);
  };
  ['tl_postL', 'tl_postR'].forEach(id => { PAINT[id] = (c, fw, fh) => post(c, fw, fh); PAINT[id].sides = { right: post, left: post }; });
  /** Прожектори-проєктори на кінцях балки: корпус зі світлою губою, велика бурштинова лінза, щілини; згори — ребра. */
  const pod = (c, fw, fh) => {
    c.fillStyle = 'rgba(4,3,14,.6)'; c.fillRect(0, 0, fw, fh); c.fillStyle = 'rgba(200,210,255,.3)'; c.fillRect(0, 0, fw, fh * .12);
    const cx = fw * .5, cy = fh * .55, r = Math.min(fw, fh) * .36; c.fillStyle = '#05030f'; c.beginPath(); c.arc(cx, cy, r * 1.2, 0, 7); c.fill();
    const g = c.createRadialGradient(cx - r * .2, cy - r * .2, 0, cx, cy, r); g.addColorStop(0, '#fff8e0'); g.addColorStop(.35, '#ffd27a'); g.addColorStop(.8, '#ff9a3a'); g.addColorStop(1, '#8a3a0a'); c.fillStyle = g; c.beginPath(); c.arc(cx, cy, r, 0, 7); c.fill();
    [.12, .88].forEach(f => { for (let k = 0; k < 3; k++) { c.fillStyle = 'rgba(2,2,10,.8)'; c.fillRect(fw * f - .8, fh * (.3 + k * .2), 1.6, .5); } });
  };
  const fins = (c, fw, fh) => { for (let x = 1.5; x < fw - 1; x += 2.4) { c.fillStyle = 'rgba(2,2,10,.75)'; c.fillRect(x, fh * .15, .8, fh * .7); } };
  ['tl_podL', 'tl_podR'].forEach(id => { PAINT[id] = (c, fw, fh) => pod(c, fw, fh); PAINT[id].sides = { top: fins }; });
  LIVE.tl_sign = NX.arc.glint(8.1, 4.4);                                                                   // відблиск по вивісці (не разом з іншими)

  // ---------- КАБЕЛІ вздовж стійок (форма st:cable) ----------
  /** Шлях кабелю (px картинки зони): хомути на стійці через третину висоти, між ними кабель провисає всередину (до карток);
   *  q — 0 (балка) .. 1 (низ), lane — 0 товстий чорний з помаранчевою смугою, 1 тонкий синій. Для форми й живих імпульсів
   *  (objects/tools.js: NX.arc.tlCable). */
  const CABLE = { tl_cblL: { X: 1138, s: 1 }, tl_cblR: { X: 1322, s: -1 }, Y0: 96, Y1: 272, w: 6 };
  const cableAt = (id, q, lane = 0) => { const C = CABLE[id], sag = Math.abs(Math.sin(q * Math.PI * 3)) * CABLE.w * (.42 + lane * .2); return [C.X + C.s * (sag + lane * .9), CABLE.Y0 + (CABLE.Y1 - CABLE.Y0) * q]; };
  NX.arc.tlCable = cableAt;
  SHP['st:cable'] = (G, B) => {
    const C = CABLE[B.id]; if (!C) return; const P = G.P, m = B.w / CABLE.w, H = B.yb - B.yt, N = 48;
    const pt = (q, lane, dv = 0) => { const X = cableAt(B.id, q, lane)[0]; return P((X - C.X) * m, B.dep / 2 + dv, B.yt + H * q); };
    const rub = (u, vv, i, j) => { const k = 1 - Math.abs(u - .4) * 2; return Math.abs(u - .5) < .13 ? X3.ramp(PAINTED, .5 + k * .35, i, j) : X3.ramp(PL.DARK, .25 + k * .55, i, j); };
    const blue = (u, vv, i, j) => X3.ramp(PL.GLASS, .2 + (1 - Math.abs(u - .4) * 2) * .6, i, j);
    for (let i = 0; i < N; i++) { G.tube(pt(i / N, 0), pt((i + 1) / N, 0), 1.6 * m, rub); G.tube(pt(i / N, 1, -.7), pt((i + 1) / N, 1, -.7), .9 * m, blue); }
    for (let k = 0; k <= 3; k++) { const p = pt(k / 3, 0, -1.1); G.disc([p[0], p[1], p[2] - .2], 1.4 * m, (u, vv, i, j) => X3.ramp(PL.CHROME, .85 - Math.hypot(u - .4, vv - .4) * 1.2, i, j)); }   // хомути
  };

  // ---------- ПЕРФОДОШКА внизу, за верстаком (видно смугою над стільницею й крізь простір для ніг) ----------
  const BK = { X0: 1137, W: 186, Y0: 281, H: 76 }, BU = X => (X - BK.X0) / BK.W, BV = Y => (Y - BK.Y0) / BK.H;   // частки грані з px картинки
  const SOCKS = [1150, 1172, 1194, 1266, 1288, 1310].map(BU);
  PAINT.tl_back = (c, fw, fh) => {
    const g = c.createLinearGradient(0, 0, 0, fh); g.addColorStop(0, 'rgba(8,10,34,.55)'); g.addColorStop(1, 'rgba(4,4,20,.7)'); c.fillStyle = g; c.fillRect(0, 0, fw, fh);
    for (let y = 2.6; y < fh - 1; y += 3.4) for (let x = 2.6; x < fw - 1; x += 3.4) { c.fillStyle = 'rgba(1,1,8,.95)'; c.fillRect(x, y, .8, .8); c.fillStyle = 'rgba(150,140,240,.2)'; c.fillRect(x + .15, y + .8, .65, .22); }   // дірочки
    SOCKS.forEach((u, k) => { const x = fw * u, y = fh * BV(285.5); c.fillStyle = '#05030f'; rr(c, x - 2.4, y - 2, 4.8, 4, .6); c.fill(); c.strokeStyle = PORTS[k]; c.lineWidth = .45; rr(c, x - 2.4, y - 2, 4.8, 4, .6); c.stroke(); c.fillStyle = '#2a2a4a'; c.fillRect(x - 1.2, y - .5, .7, 1); c.fillRect(x + .5, y - .5, .7, 1); });
    [['wrench', 1145, 12], ['wrench', 1207, 14], ['hammer', 1222, 15], ['pliers', 1255, 13], ['driver', 1302, 13], ['tape', 1313, 11]].forEach(([k, X, sz]) => {   // смуга між стільницею й полицею (Y ~308..332)
      const x = fw * BU(X), y = fh * BV(320); c.fillStyle = '#8a93b8'; c.fillRect(x - .3, y - sz * .55 - 1.5, .6, 1.6); tool(c, k, x, y, sz * 1.13, '#cdd4f4'); });
    c.strokeStyle = 'rgba(40,200,255,.75)'; c.lineWidth = .9; c.beginPath(); c.ellipse(fw * BU(1240), fh * BV(319), 5.5, 4.2, 0, 0, 7); c.stroke(); c.beginPath(); c.ellipse(fw * BU(1240), fh * BV(319), 4.2, 3.1, .3, 0, 7); c.stroke();
    hazard(c, fw * .03, fh * BV(348), fw * .94, fh * .06);
  };

  // ---------- ВМІСТ ГОЛО-КАРТОК (objects/tools.js -> NX.arc.holo.pane) ----------
  /** Стан синхронізації: яка картка зараз «підключається» і наскільки (k — номер, f — 0..1; f > 0.82 — готово, спалах),
   *  коли Nexi працює — швидше. Одна для всіх (картки, жили дошки, хаб, маячок). */
  const tlSync = t => { const p = t * (TL().active ? .45 : .16), k = Math.floor(p) % 3; return { k, f: p - Math.floor(p) }; };
  NX.arc.tlSync = tlSync;
  /** КІБЕРПАНК-КАРТКА (крок 10): восьмикутний обрис із виїмкою-«підвісом» угорі посередині, тепле темне скло з квадратною
   *  сіткою, бурштиновий неоновий кант з розщепленням кольорів (помаранчевий / жовтий), заклепки в кутах; шапка (title) —
   *  смуга з попереджувальними смугами на лівому краю. Повертає висоту шапки. */
  function cardBase(c, fw, fh, title, t, o = {}) {
    const e = .8, k = Math.min(fw, fh) * .1, nw = fw * .1;
    const path = (dx = 0) => { c.beginPath(); c.moveTo(k + e + dx, e); c.lineTo(fw / 2 - nw - 1 + dx, e); c.lineTo(fw / 2 - nw + 1 + dx, e + 1.6); c.lineTo(fw / 2 + nw - 1 + dx, e + 1.6); c.lineTo(fw / 2 + nw + 1 + dx, e);
      c.lineTo(fw - k - e + dx, e); c.lineTo(fw - e + dx, k + e); c.lineTo(fw - e + dx, fh - k - e); c.lineTo(fw - k - e + dx, fh - e); c.lineTo(k + e + dx, fh - e); c.lineTo(e + dx, fh - k - e); c.lineTo(e + dx, k + e); c.closePath(); };
    const g = c.createLinearGradient(0, 0, 0, fh); g.addColorStop(0, 'rgba(34,26,62,.86)'); g.addColorStop(.5, 'rgba(16,22,58,.82)'); g.addColorStop(1, 'rgba(30,18,52,.86)'); path(); c.fillStyle = g; c.fill();
    c.save(); path(); c.clip(); c.strokeStyle = 'rgba(255,170,90,.08)'; c.lineWidth = .25; c.beginPath(); for (let x = 3; x < fw; x += 5) { c.moveTo(x, 0); c.lineTo(x, fh); } for (let y = 3; y < fh; y += 5) { c.moveTo(0, y); c.lineTo(fw, y); } c.stroke(); c.restore();
    let hh = 0;
    if (title != null) { hh = fh * (o.hh || .15); const x0 = k * .6 + e;
      c.fillStyle = 'rgba(255,154,58,.2)'; c.fillRect(x0, e + 2.2, fw - 2 * x0, hh - 2); hazard(c, x0 + .4, e + 2.6, fw * .1, hh - 2.8, .6);
      c.fillStyle = 'rgba(255,170,90,.85)'; c.fillRect(e + 1, e + hh + .4, fw - 2 * e - 2, .45);
      A.txt(c, title, fw * .53, e + 1.2 + hh * .5, fw * .6, hh * .52, '#fff1dc', { glow: OR }); }
    [[k * .95, k * .95], [fw - k * .95, k * .95], [k * .95, fh - k * .95], [fw - k * .95, fh - k * .95]].forEach(([x, y]) => bolt(c, x, y, .55));
    c.save(); c.globalCompositeOperation = 'lighter'; c.lineWidth = .5; c.strokeStyle = 'rgba(255,90,40,.55)'; path(.5); c.stroke(); c.strokeStyle = 'rgba(255,230,90,.45)'; path(-.5); c.stroke(); c.restore();   // розщеплення
    c.strokeStyle = '#ffb066'; c.lineWidth = .6; path(); c.stroke();
    return hh;
  }
  /** Скан-смуга по картці. */
  function sheen(c, fw, fh, t, seed) {
    c.save(); c.globalCompositeOperation = 'lighter'; const ry = (((t + seed) * .13) % 1.3 - .15) * fh, g = c.createLinearGradient(0, ry - fh * .08, 0, ry + fh * .08);
    g.addColorStop(0, 'rgba(255,200,140,0)'); g.addColorStop(.5, 'rgba(255,200,140,.09)'); g.addColorStop(1, 'rgba(255,200,140,0)'); c.fillStyle = g; c.fillRect(0, ry - fh * .08, fw, fh * .16); c.restore();
  }
  const TILE = { mail: ['mail', 'scene.tools.mail', CY], cal: ['cal', 'scene.tools.cal', VI], crm: ['crm', 'scene.tools.crm', PK] }, ORDER = ['mail', 'cal', 'crm'];
  /** Картка інтеграції: велика іконка, назва, кружечок стану (чекає / крутиться / ✓), смужка прогресу; конверт вилітає,
   *  у календарі блимає день, у CRM росте лічильник контактів. */
  function tile(kind, c, fw, fh, t) {
    const [ic, key, col] = TILE[kind], k = ORDER.indexOf(kind), s = tlSync(t), done = k < s.k || (k === s.k && s.f > .82), busy = k === s.k && !done;
    cardBase(c, fw, fh, null, t);
    if (busy) { c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(255,170,90,${.1 + .08 * Math.sin(t * 6)})`; c.fillRect(0, 0, fw, fh); c.restore(); }
    if (done && k === s.k) { c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(120,255,170,${.35 * (1 - (s.f - .82) / .18)})`; c.fillRect(0, 0, fw, fh); c.restore(); }
    const cx = fw * .5, cy = fh * .42, R = fh * .25; c.fillStyle = 'rgba(6,20,60,.75)'; c.beginPath(); c.arc(cx, cy, R, 0, 7); c.fill();
    c.strokeStyle = done ? GR : col; c.lineWidth = .8; c.beginPath(); c.arc(cx, cy, R, 0, 7); c.stroke();
    if (busy) { c.strokeStyle = '#ffe2c0'; c.lineWidth = 1.2; c.beginPath(); c.arc(cx, cy, R + 1.6, t * 4, t * 4 + Math.PI * 2 * ease(Math.min(1, s.f / .82))); c.stroke(); }
    icon(c, ic, cx, cy, R * 1.05, col === PK ? '#ff9af0' : col === CY ? '#9af6ff' : '#c8bcff');
    A.txt(c, t_(key), fw * .5, fh * .77, fw * .8, fh * .1, '#fff1dc', { glow: OR });
    const sx = fw * .8, sy = fh * .15; c.fillStyle = 'rgba(8,20,70,.95)'; c.beginPath(); c.arc(sx, sy, fh * .07, 0, 7); c.fill();       // кружечок стану
    if (done) { c.strokeStyle = GR; c.lineWidth = fh * .03; c.beginPath(); c.moveTo(sx - fh * .035, sy); c.lineTo(sx - fh * .005, sy + fh * .03); c.lineTo(sx + fh * .045, sy - fh * .035); c.stroke(); }
    else if (busy) { c.strokeStyle = '#ffe2c0'; c.lineWidth = fh * .02; c.beginPath(); c.arc(sx, sy, fh * .045, -t * 8, -t * 8 + 4.2); c.stroke(); }
    else { c.fillStyle = 'rgba(255,200,150,.4)'; c.beginPath(); c.arc(sx, sy, fh * .025, 0, 7); c.fill(); }
    const px = fw * .16, pw = fw * .68, py = fh * .87; c.fillStyle = 'rgba(8,24,80,.9)'; c.fillRect(px, py, pw, fh * .035); c.fillStyle = done ? GR : col; c.fillRect(px, py, pw * (done ? 1 : busy ? ease(Math.min(1, s.f / .82)) : 0), fh * .035);
    if (busy && ic === 'mail') { const q = (t * 1.3) % 1; c.globalAlpha = 1 - q; icon(c, 'mail', cx + R * (.4 + q * 1.4), cy - R * (.3 + q * 1.3), R * (.55 - q * .25), '#fff1dc'); c.globalAlpha = 1; }
    if (ic === 'cal' && Math.sin(t * 4) > 0) { c.fillStyle = '#ff9af0'; c.fillRect(cx + R * .1, cy + R * .02, R * .16, R * .16); }
    if (ic === 'crm') { const n = 1240 + Math.floor(t * (TL().active ? 3 : .7)); A.txt(c, '+' + n, fw * .17, fh * .15, fw * .44, fh * .08, '#ffc4f0', { align: 'left' }); }
    sheen(c, fw, fh, t, k * 1.7);
  }
  // АВТО: заявка -> AI -> CRM -> пошта; пакети біжать вузлами, лічильник заявок росте
  const NODES = [['doc', .18], ['bot', .39], ['crm', .61], ['mail', .82]];
  function auto(c, fw, fh, t) {
    cardBase(c, fw, fh, t_('scene.tools.auto'), t);
    const y = fh * .5, sp = TL().active ? .9 : .38, r = fh * .1;
    c.strokeStyle = 'rgba(255,190,120,.4)'; c.lineWidth = .6; c.setLineDash([1.2, 1]); c.beginPath(); c.moveTo(fw * .18, y); c.lineTo(fw * .82, y); c.stroke(); c.setLineDash([]);
    NODES.forEach(([ic, f], k) => { const hit = Math.abs(((t * sp * 4) % 4) - k) < .25; c.fillStyle = hit ? 'rgba(255,170,90,.45)' : 'rgba(8,26,72,.9)'; rr(c, fw * f - r, y - r, r * 2, r * 2, 1.2); c.fill();
      c.strokeStyle = hit ? '#ffe2c0' : 'rgba(255,190,120,.7)'; c.lineWidth = .5; rr(c, fw * f - r, y - r, r * 2, r * 2, 1.2); c.stroke(); icon(c, ic, fw * f, y, r * 1.1, hit ? '#ffffff' : '#bff8ff'); });
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let q = 0; q < 4; q++) { const ph = (t * sp + q / 4) % 1, x = fw * (.18 + .64 * ph); c.fillStyle = q % 2 ? 'rgba(255,170,240,.95)' : 'rgba(255,230,190,.95)'; c.fillRect(x - .9, y - .9, 1.8, 1.8); c.fillStyle = 'rgba(255,170,90,.35)'; c.fillRect(x - 3.4, y - .35, 2.4, .7); }
    c.restore();
    const n = 128 + Math.floor(t * sp * 1.2); c.fillStyle = 'rgba(8,24,80,.85)'; c.fillRect(fw * .07, fh * .74, fw * .86, fh * .16);
    A.txt(c, t_('scene.tools.leads'), fw * .1, fh * .82, fw * .5, fh * .09, 'rgba(255,230,200,.9)', { align: 'left' });
    A.txt(c, '+' + n, fw * .9, fh * .82, fw * .3, fh * .1, '#b8ffd2', { align: 'right' });
    sheen(c, fw, fh, t, 1.7);
  }
  // API: дві шестерні в зачепленні (голограма) і маніпулятор, що їх налаштовує; іскри; стан «200 ОК»
  function gear(c, cx, cy, r, n, a, col, hole) {
    c.save(); c.translate(cx, cy); c.rotate(a); c.beginPath();
    for (let k = 0; k < n * 2; k++) { const r2 = k % 2 ? r : r * 1.22, a0 = k / (n * 2) * Math.PI * 2, a1 = (k + 1) / (n * 2) * Math.PI * 2; c.lineTo(Math.cos(a0) * r2, Math.sin(a0) * r2); c.lineTo(Math.cos(a1) * r2, Math.sin(a1) * r2); }
    c.closePath(); c.fillStyle = col; c.fill(); c.fillStyle = '#081c52'; c.beginPath(); c.arc(0, 0, r * hole, 0, 7); c.fill();
    c.strokeStyle = 'rgba(255,240,220,.8)'; c.lineWidth = r * .07; c.beginPath(); c.arc(0, 0, r * .68, 0, 7); c.stroke(); c.restore();
  }
  function api(c, fw, fh, t) {
    cardBase(c, fw, fh, 'API', t);
    const sp = TL().active ? 1.6 : .7, cx = fw * .36, cy = fh * .6, r = fh * .17, r2 = r * .62;
    c.fillStyle = 'rgba(255,170,90,.12)'; c.beginPath(); c.moveTo(cx - r * 1.5, fh * .95); c.lineTo(cx + r * 2.7, fh * .95); c.lineTo(cx + r * 1.7, fh * .3); c.lineTo(cx - r * .7, fh * .3); c.fill();   // конус голограми
    gear(c, cx, cy, r, 10, t * sp, 'rgba(90,220,255,.85)', .3); gear(c, cx + r * 1.62, cy - r * .55, r2, 7, -t * sp * 10 / 7 + .22, 'rgba(255,160,80,.9)', .32);
    const bx = fw * .9, by = fh * .92, a1 = -2.2 + .18 * Math.sin(t * 1.3), l1 = fh * .3, ex = bx + Math.cos(a1) * l1, ey = by + Math.sin(a1) * l1, a2 = a1 - 1.1 + .25 * Math.sin(t * 2.1), l2 = fh * .22, tx = ex + Math.cos(a2) * l2, ty = ey + Math.sin(a2) * l2;
    c.strokeStyle = 'rgba(255,220,180,.9)'; c.lineCap = 'round'; c.lineWidth = fh * .045; c.beginPath(); c.moveTo(bx, by); c.lineTo(ex, ey); c.lineTo(tx, ty); c.stroke();
    c.fillStyle = '#fff1dc'; [[bx, by, .05], [ex, ey, .04], [tx, ty, .03]].forEach(([x, y, k]) => { c.beginPath(); c.arc(x, y, fh * k, 0, 7); c.fill(); });
    if (Math.sin(t * 7) > .55) { c.save(); c.globalCompositeOperation = 'lighter'; for (let q = 0; q < 6; q++) { const a = hash(q, Math.floor(t * 9)) * 6.28, d = fh * (.03 + .06 * hash(q + 3, Math.floor(t * 9))); c.fillStyle = q % 2 ? '#ffe2b0' : '#ffffff'; c.fillRect(tx + Math.cos(a) * d - .4, ty + Math.sin(a) * d - .4, .8, .8); } c.restore(); }   // іскри
    c.fillStyle = 'rgba(8,24,80,.9)'; c.fillRect(fw * .06, fh * .24, fw * .34, fh * .12);
    c.fillStyle = Math.sin(t * 3) > -.6 ? GR : '#1f6a45'; c.beginPath(); c.arc(fw * .1, fh * .3, fh * .022, 0, 7); c.fill();
    A.txt(c, '200 ' + t_('scene.ai.ok'), fw * .13, fh * .3, fw * .26, fh * .07, '#b8ffd2', { align: 'left' });
    sheen(c, fw, fh, t, 5.2);
  }
  NX.arc.tlPane = (kind, c, fw, fh, t) => kind === 'auto' ? auto(c, fw, fh, t) : kind === 'api' ? api(c, fw, fh, t) : tile(kind, c, fw, fh, t);
})();
