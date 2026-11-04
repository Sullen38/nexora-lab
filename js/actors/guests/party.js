/* ============================================================================
 * actors/guests/party.js — ВЕЧІРКА В ПОРТАЛІ: КІМНАТА, ДЕ ТАНЦЮЮТЬ СПІЙМАНІ ГОСТІ (04.11, чат «Персонажі»)
 * ----------------------------------------------------------------------------
 * Власник: «на портал коли ми нажимаємо — ми попадаємо на вечірку; на вечірці будуть тільки ті гості, яких ми вже спіймали:
 * прийшов гість, ми на нього натиснули — і він з'явився в колекції; а потім, коли він уже пішов, він з'являється в нас на
 * вечірці — паті-кімната, де вони всі танцюють; з'явиться, коли Nexi відправиться в портал».
 *   ЯК ПОТРАПИТИ: тап по брамі (guests.js: tapFirst) → сценарій Nexi `party` (activities.js): іде до брами, стрибає на майданчик,
 *     тане у вихорі → open(). «← У КІМНАТУ» (кнопка чи Esc) → close() → Nexi з'являється на майданчику й зіскакує.
 *   ХТО ТУТ: NX.guests.atParty() — спіймані тапом (колекція, localStorage) і зараз не в кімнаті. Нікого — Nexi сам за пультом,
 *     на танцполі підказка (party.empty). Тап по гостю — його репліка (guests.<id>.t) і сердечко; тап по Nexi — нотки.
 *   КІМНАТА (своя сцена поверх головного циклу: core/loop.js віддає кадр сюди, поки on): світ 720×400 од., на екрані — «cover»
 *     (по більшій стороні), на телефоні гортається пальцем. Нерухоме — один раз у растр (BG) під масштаб екрана: цегляна стіна з
 *     неоновими пілястрами, неонова вивіска «ВЕЧІРКА NEXI» з лампочками, гірлянди, дзеркальна куля на ланцюгу, DJ-пульт, два
 *     стеки колонок, бар з пляшками, стіл із тортом, кульки. Живе щокадру: танцпол з плитками, що пульсують у такт (128 bpm),
 *     плями дискокулі, лазери з кутів, конуси колонок, диски пульта, лампочки, свічки, конфеті, нотки, гості й Nexi.
 *   ТАНЕЦЬ: кожен гість у такт підстрибує, чергує кроки й «ура», раз на 5–9 с робить свою фішку (Мерлін чаклує, Горинич чхає,
 *     Піноккіо бреше, Попелюшка кружляє…) і часом переходить на інше місце танцполу; летуни (Яга в ступі, Жар-птиця, Джин,
 *     Мюнхгаузен) ширяють над танцполом, Колобок скаче, Чеширський кіт тане й з'являється. Nexi за пультом танцює (поза dance).
 *   ТЕКСТИ — party.* у словниках (4 мови); вивіска й кнопка перебудовуються при зміні мови.
 * ========================================================================== */
NX.party = (() => {
  const W = 720, H = 400, FL = 292, BALL = 130, BPM = 128, GS = 1.12;                                            // світ; лінія підлоги; темп; масштаб гостей (як у кімнаті)
  const S = { on: false, k: 1, x: 0, top: 0, viewW: 0, t0: 0, list: [], fx: [], bub: null, btn: null, pointer: null };
  const P = NX.px, A = () => NX.guestArt, rnd = Math.random, clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const R = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  const NEON = ['#ff4fd8', '#3be8ff', '#ffe27a', '#3bff8a', '#b48aff', '#ff7a2a'];
  const beat = () => (NX.time - S.t0) * BPM / 60, pulse = () => Math.abs(Math.sin(beat() * Math.PI));
  // ---------- танцпол: трапеція в перспективі (8 × 4 плиток) ----------
  const DF = { x0: 140, x1: 580, yb: FL + 6, yf: FL + 96, back: .8 };
  const tile = (i, j) => { const kb = (j + .5) / 4, ya = DF.yb + (DF.yf - DF.yb) * (j / 4), yb = DF.yb + (DF.yf - DF.yb) * ((j + 1) / 4), cw = (DF.x1 - DF.x0) / 8, cx = (DF.x0 + DF.x1) / 2;
    const sa = DF.back + (1 - DF.back) * (j / 4), sb = DF.back + (1 - DF.back) * ((j + 1) / 4); return { ya, yb, xa0: cx + (DF.x0 + i * cw - cx) * sa, xa1: cx + (DF.x0 + (i + 1) * cw - cx) * sa, xb0: cx + (DF.x0 + i * cw - cx) * sb, xb1: cx + (DF.x0 + (i + 1) * cw - cx) * sb, kb }; };
  const floorPt = (u, v) => { const s = DF.back + (1 - DF.back) * v, cx = (DF.x0 + DF.x1) / 2; return [cx + (DF.x0 + u * (DF.x1 - DF.x0) - cx) * s, DF.yb + (DF.yf - DF.yb) * v]; };

  // ============================ НЕРУХОМЕ (растр під масштаб екрана) ============================
  let BG = null, BGq = 0;
  function bg() {
    const q = Math.min(3, Math.max(1, Math.ceil(S.k * NX.loop.dpr))); if (BG && BGq === q) return BG;
    BGq = q; BG = BG || document.createElement('canvas'); BG.width = W * q; BG.height = H * q; const c = BG.getContext('2d'); c.setTransform(q, 0, 0, q, 0, 0); c.imageSmoothingEnabled = false;
    R(c, 0, 0, W, FL, '#17103c');                                                                   // стіна
    for (let y = 8; y < FL - 6; y += 10) for (let x = (y / 10 | 0) % 2 ? 0 : 14; x < W; x += 28) { R(c, x, y, 26, 8, (x * 7 + y) % 5 ? '#1c1448' : '#1a1244'); R(c, x, y, 26, 1, '#231a56'); }   // цегла
    for (let x = 0; x < W; x += 180) { R(c, x + 2, 0, 10, FL, '#120b30'); R(c, x + 5, 4, 4, FL - 8, '#2a1a6a'); R(c, x + 6, 6, 1, FL - 12, '#b48aff'); }   // пілястри з неоном
    R(c, 0, 0, W, 6, '#0a0626'); R(c, 0, FL - 3, W, 3, '#0a0626'); R(c, 0, FL - 2, W, 1, '#3be8ff');   // карниз, плінтус із неоном
    R(c, 0, FL, W, H - FL, '#0c0a2c'); for (let y = FL; y < H; y += 6) R(c, 0, y, W, 1, '#100d34');     // підлога (глянець — смужки)
    // танцпол: рама
    const t0 = tile(0, 0), t7 = tile(7, 3); c.fillStyle = '#060418'; c.beginPath(); c.moveTo(t0.xa0 - 4, t0.ya - 2); c.lineTo(tile(7, 0).xa1 + 4, t0.ya - 2); c.lineTo(t7.xb1 + 6, t7.yb + 2); c.lineTo(tile(0, 3).xb0 - 6, t7.yb + 2); c.fill();
    // гірлянди: дроти від кутів до вивіски (лампочки — живі, bulbs())
    c.strokeStyle = '#2a2050'; c.lineWidth = 1; bulbs().forEach((b, i) => { if (i && bulbs()[i - 1].w === b.w) { const a = bulbs()[i - 1]; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke(); } });
    // дзеркальна куля: ланцюг і куля (блиск — живий)
    R(c, W / 2 - .5, 6, 1, 108, '#6a6a8a'); for (let y = -16; y <= 16; y += 4) { const hw = Math.sqrt(256 - y * y); for (let x = -hw; x < hw; x += 4) R(c, W / 2 + x, BALL + y, 3, 3, (x + y) % 8 ? '#8fa0c8' : '#d8e4ff'); }
    // вивіска: рамка з лампочками (лампочки — живі), текст неоном
    const sign = NX.t('party.sign'); c.font = '14px "Press Start 2P", monospace'; const tw = c.measureText(sign).width, sx = W / 2 - tw / 2 - 22, sw = tw + 44;
    R(c, sx, 22, sw, 40, '#0a0626'); R(c, sx + 2, 24, sw - 4, 36, '#120b30'); c.strokeStyle = '#ff4fd8'; c.lineWidth = 1; c.strokeRect(sx + 4.5, 26.5, sw - 9, 31);
    for (const [dx, dy, a] of [[-1, 0, .35], [1, 0, .35], [0, -1, .35], [0, 1, .35], [0, 0, 1]]) { c.globalAlpha = a; P.text(c, sign, W / 2 + dx, 47 + dy, a < 1 ? '#ff9af0' : '#fff0fb', 14, 'center'); } c.globalAlpha = 1;
    // DJ-пульт: задня частина (передню панель малює кадр — поверх Nexi)
    R(c, 296, FL - 44, 128, 8, '#1e1650'); R(c, 296, FL - 44, 128, 1, '#3be8ff');
    // колонки: два стеки (конуси — живі)
    [[186, 1], [484, 1]].forEach(([x]) => { R(c, x, FL - 74, 52, 80, '#0d0a2a'); R(c, x + 2, FL - 72, 48, 76, '#15113a'); R(c, x, FL - 74, 52, 1, '#3be8ff'); R(c, x, FL + 5, 52, 1, '#3be8ff'); R(c, x + 20, FL - 66, 12, 6, '#0a0626'); R(c, x + 23, FL - 64, 6, 2, '#ff4fd8'); });
    // бар: полиця з пляшками, стійка
    R(c, 572, FL - 96, 120, 4, '#2a1a6a'); R(c, 572, FL - 95, 120, 1, '#b48aff'); [['#3be8ff', 0], ['#ffe27a', 1], ['#ff4fd8', 2], ['#3bff8a', 3], ['#ff7a2a', 4], ['#b48aff', 5]].forEach(([col, i]) => { const x = 580 + i * 18; R(c, x, FL - 118, 8, 22, col); R(c, x + 2, FL - 124, 4, 7, col); R(c, x + 1, FL - 116, 2, 14, '#ffffff66'); R(c, x + 2, FL - 110, 4, 6, '#0a0626'); });
    R(c, 570, FL - 34, 124, 40, '#1a1446'); R(c, 566, FL - 38, 132, 6, '#2a2068'); R(c, 566, FL - 38, 132, 1, '#ff4fd8'); R(c, 566, FL + 5, 132, 1, '#3be8ff'); for (let x = 574; x < 690; x += 16) R(c, x, FL - 26, 1, 26, '#120b30');
    P.text(c, NX.t('party.bar'), 632, FL - 14, '#ff9af0', 7, 'center');
    [[596, '#ffe27a'], [616, '#3be8ff'], [660, '#ff7a2a']].forEach(([x, col]) => { R(c, x, FL - 48, 8, 10, col); R(c, x + 1, FL - 50, 6, 2, '#ffffff'); R(c, x + 3, FL - 38, 2, 3, '#c8c8e8'); R(c, x + 1, FL - 35, 6, 1, '#c8c8e8'); R(c, x + 6, FL - 54, 1, 6, '#ff4fd8'); });   // келихи з трубочками
    // стіл із тортом (свічки — живі)
    R(c, 44, FL - 30, 104, 36, '#2a1a6a'); R(c, 40, FL - 34, 112, 6, '#3a2a7a'); R(c, 40, FL - 34, 112, 1, '#ffe27a'); R(c, 46, FL + 2, 4, 6, '#1a1446'); R(c, 142, FL + 2, 4, 6, '#1a1446');
    R(c, 66, FL - 50, 60, 16, '#ff9ad0'); R(c, 66, FL - 50, 60, 3, '#fff0fb'); R(c, 76, FL - 64, 40, 14, '#b48aff'); R(c, 76, FL - 64, 40, 3, '#fff0fb'); R(c, 86, FL - 76, 20, 12, '#3be8ff'); R(c, 86, FL - 76, 20, 3, '#fff0fb');
    for (let x = 68; x < 124; x += 8) R(c, x, FL - 40, 3, 3, '#ff4fd8'); for (let x = 78; x < 114; x += 8) R(c, x, FL - 56, 3, 3, '#ffe27a');
    P.text(c, NX.t('party.cake'), 96, FL - 18, '#ffe27a', 7, 'center');
    // кульки
    balloons().forEach(b => { c.strokeStyle = '#8a8ab0'; c.lineWidth = 1; c.beginPath(); c.moveTo(b.x, b.y + 12); c.lineTo(b.x + b.sx, b.y + 34); c.stroke(); });
    return BG;
  }
  const bulbs = () => { const out = []; for (let w = 0; w < 2; w++) for (let i = 0; i <= 10; i++) { const u = i / 10, x0 = w ? W - 6 : 6, x1 = w ? W / 2 + 150 : W / 2 - 150, x = x0 + (x1 - x0) * u, y = 10 + Math.sin(u * Math.PI) * 26 + u * 14; out.push({ x, y, w, i }); } return out; };
  const balloons = () => [[24, 120, '#ff4fd8', -3], [36, 104, '#3be8ff', 2], [50, 126, '#ffe27a', 4], [W - 28, 110, '#3bff8a', 3], [W - 44, 96, '#ff7a2a', -2], [W - 56, 122, '#b48aff', -4], [250, 150, '#ff4fd8', 2], [470, 146, '#3be8ff', -3]].map(([x, y, col, sx]) => ({ x, y, col, sx }));

  // ============================ ГОСТІ НА ВЕЧІРЦІ ============================
  const FLYER = { babaYaga: 'ride', firebird: 'fly', genie: 'float', munchausen: 'ride' };
  const SPECIAL = { quixote: 'charge', merlin: 'cast', gorynych: 'sneeze', genie: 'cast', tinMan: 'rust', silver: 'dig', sherlock: 'inspect', robinHood: 'aim', pinocchio: 'nose', cinderella: 'twirl',
    snowWhite: 'search', redHood: 'give', pussBoots: 'bow', whiteRabbit: 'watch', stNicholas: 'give', babaYaga: 'sweep' };
  function roster() {
    const ids = NX.guests ? NX.guests.atParty() : [], n = ids.length; S.list = [];
    ids.forEach((id, i) => { const row = n <= 7 ? 1 : i % 3, col = n <= 7 ? i : Math.floor(i / 3), per = n <= 7 ? n : Math.ceil(n / 3), u = (col + .5) / per, v = [.2, .55, .9][row] || .55;
      const [x, y] = floorPt(u, v), g = { id, x, y, tx: x, ty: y, dir: x < W / 2 ? 1 : -1, ph: rnd(), fr: 0, ft: 0, alt: 0, pose: 'stand', next: NX.time + 3 + rnd() * 8, spT: 0, g: {}, fly: FLYER[id] || null, u, v };
      if (g.fly) { g.alt = 30 + rnd() * 10; g.ty = y; } S.list.push(g); });
  }
  const sparks = (x, y, n, cols) => { for (let i = 0; i < n; i++) S.fx.push({ t: 'sp', x: x + (rnd() - .5) * 30, y: y - rnd() * 30, vx: (rnd() - .5) * 40, vy: -20 - rnd() * 40, g: 60, col: cols[i % cols.length], ttl: .6 + rnd() * .5, age: 0 }); };
  function updGuest(g, dt, t) {
    const b = beat() + g.ph, bounce = Math.abs(Math.sin(b * Math.PI)); g.ft += dt; if (g.ft > .13) { g.ft = 0; g.fr++; } g.g.nose = 0;
    if (g.fly) {                                                                                      // летуни ширяють над танцполом
      if (t > g.next) { g.next = t + 4 + rnd() * 6; const [x, y] = floorPt(.1 + rnd() * .8, .15 + rnd() * .7); g.tx = x; g.ty = y; }
      const dx = g.tx - g.x, dy = g.ty - g.y, d = Math.hypot(dx, dy); if (d > 1) { const sp = Math.min(d, 36 * dt); g.x += dx / d * sp; g.y += dy / d * sp; if (Math.abs(dx) > 2) g.dir = Math.sign(dx); }
      g.alt = 34 + Math.sin(t * 1.7 + g.ph * 6) * 8 + bounce * 3; g.pose = g.fly; if (g.id === 'firebird' && rnd() < .5) S.fx.push({ t: 'sp', x: g.x - g.dir * 14, y: g.y - g.alt - 16, vx: -g.dir * 20, vy: 10, g: 0, col: rnd() < .5 ? '#ff7a2a' : '#ffe27a', ttl: .4, age: 0 });
      if (g.id === 'babaYaga' && rnd() < .2) S.fx.push({ t: 'sp', x: g.x - g.dir * 10, y: g.y - g.alt - 4, vx: -g.dir * 10, vy: 8, g: 0, col: '#8a8ab0', ttl: .5, age: 0 }); return;
    }
    if (g.id === 'kolobok') { g.pose = 'roll'; g.alt = bounce * 14; if (t > g.next) { g.next = t + 3 + rnd() * 5; const [x, y] = floorPt(clamp(g.u + (rnd() - .5) * .5, .06, .94), g.v); g.tx = x; g.ty = y; } const dx = g.tx - g.x; if (Math.abs(dx) > 1) { g.x += Math.sign(dx) * Math.min(Math.abs(dx), 44 * dt); g.dir = Math.sign(dx); } return; }
    if (g.id === 'cheshire') { g.pose = 'sit'; g.alt = 0; return; }
    if (g.mv) {                                                                                      // переходить на інше місце
      const dx = g.tx - g.x, dy = g.ty - g.y, d = Math.hypot(dx, dy); g.pose = 'walk'; g.alt = 0; if (Math.abs(dx) > 1) g.dir = Math.sign(dx);
      if (d < 2) { g.mv = false; g.next = t + 5 + rnd() * 6; } else { const sp = Math.min(d, 40 * dt); g.x += dx / d * sp; g.y += dy / d * sp; } return;
    }
    if (t < g.spT) { g.pose = g.sp === 'nose' ? 'stand' : g.sp; if (g.sp === 'nose') g.g.nose = Math.min(9, (g.spT - t) * 5); g.alt = 0;
      if (g.sp === 'cast' && rnd() < .4) sparks(g.x + g.dir * 14, g.y - 50, 1, ['#9af6ff', '#e2c4ff']); if (g.sp === 'sneeze' && rnd() < .5) sparks(g.x + g.dir * 34, g.y - 46, 1, ['#ff7a2a', '#ffe27a']);
      if (g.sp === 'twirl' && rnd() < .3) sparks(g.x, g.y - 20, 1, ['#ffffff']); if (g.sp === 'rust' && rnd() < .2) sparks(g.x, g.y - 30, 1, ['#ffd27a']); return; }
    if (t > g.next) { if (rnd() < .45 || !SPECIAL[g.id]) { g.mv = true; const [x, y] = floorPt(clamp(g.u + (rnd() - .5) * .3, .05, .95), g.v + (rnd() - .5) * .18); g.tx = x; g.ty = clamp(y, DF.yb + 2, DF.yf - 2); } else { g.sp = SPECIAL[g.id]; g.spT = t + 1.6; g.next = t + 5 + rnd() * 5; } return; }
    const k = Math.floor(b) % 8; g.alt = bounce * (k === 7 ? 9 : 5); g.pose = k === 7 || k === 3 ? 'cheer' : 'walk'; if (g.pose === 'walk') g.fr = Math.floor(b * 2) % 4;   // танець: кроки в такт, раз на 4 такти — «ура» зі стрибком
    if (Math.floor(b * 2) % 2 === 0 && Math.floor(b * 2) !== g.lastB) { g.lastB = Math.floor(b * 2); if (rnd() < .3) g.dir = -g.dir; }
  }
  function drawGuest(c, g, t) {
    const [GW, GH, K] = A().size(g.id), s = GS * K * .98, w = GW * s, h = GH * s, top = g.y - g.alt - h, tq = Math.floor(t * 12) / 12;
    c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(g.x, g.y + 1, w * .26 * Math.max(.3, 1 - g.alt / 120), 2.4, 0, 0, 7); c.fill();
    const img = A().frame(g.id, g.pose, g.fr, tq, g.g); c.save(); c.imageSmoothingEnabled = false; c.translate(g.x, 0); c.scale(g.dir, 1); c.drawImage(img, -w / 2, top, w, h); c.restore();
    if (g.bub && t < g.bub.until) bubble(c, g.bub.text, g.x, top - 6, Math.min(1, (g.bub.until - t) * 3));
  }
  function bubble(c, text, x, top, al) {
    let fs = 7; c.save(); c.font = `${fs}px "Press Start 2P", monospace`; let tw = c.measureText(text).width; if (tw > 180) { fs = Math.max(5, fs * 180 / tw); c.font = `${fs}px "Press Start 2P", monospace`; tw = c.measureText(text).width; }
    const pw = tw + 12, ph = fs + 10, bx = clamp(x - pw / 2, S.x + 4, S.x + S.viewW - pw - 4), by = top - ph - 6; c.globalAlpha = al;
    c.fillStyle = '#0a0626ee'; c.fillRect(bx, by, pw, ph); c.strokeStyle = '#ff7af0'; c.lineWidth = 1; c.strokeRect(bx + .5, by + .5, pw - 1, ph - 1);
    c.fillStyle = '#0a0626ee'; c.beginPath(); c.moveTo(x - 4, by + ph); c.lineTo(x + 4, by + ph); c.lineTo(x, by + ph + 5); c.fill();
    c.fillStyle = '#ffffff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, bx + pw / 2, by + ph / 2 + .5); c.restore();
  }
  // Nexi за пультом: малює його власний шар (nexi.js: layer) через «двійника» з координатами вечірки й позою dance — спрайт, скін і настрій ті самі
  const NX_DJ = { x: W / 2, y: FL - 24 };
  function drawNexi(c, t) {
    const n = NX.nexi, D = Object.create(n); Object.assign(D, { x: NX_DJ.x, y: NX_DJ.y, alpha: 1, zoom: 1, dy: null, cur: null, queue: [], temp: 'dance', tempT: 1e9, talking: false, hiT: S.hiT || 0, rot: 0, back: false, fxNow: 'none', dir: 1, pose: 'dance' });
    D.layer().draw(c, t); S.nexiBox = D.box;
  }
  // ============================ ЖИВЕ ============================
  function drawLive(c, t) {
    const pl = pulse(), b = beat(), bi = Math.floor(b);
    for (let j = 0; j < 4; j++) for (let i = 0; i < 8; i++) { const T = tile(i, j), on = (i + j + bi) % 3 === 0, col = NEON[(i * 3 + j * 5 + Math.floor(b / 4)) % NEON.length];   // плитки танцполу
      c.globalAlpha = on ? .55 + .4 * pl : .22; c.fillStyle = col; c.beginPath(); c.moveTo(T.xa0 + 1, T.ya + 1); c.lineTo(T.xa1 - 1, T.ya + 1); c.lineTo(T.xb1 - 1, T.yb - 1); c.lineTo(T.xb0 + 1, T.yb - 1); c.fill(); }
    c.globalAlpha = 1;
    bulbs().forEach((bl, i) => { const col = NEON[(i + bi) % NEON.length]; R(c, bl.x - 1.5, bl.y - 1.5, 3, 3, col); if ((i + bi) % 2) P.glow(c, bl.x, bl.y, 5, col, .5); });   // лампочки гірлянд
    { const sign = NX.t('party.sign'); c.font = '14px "Press Start 2P", monospace'; const tw = c.measureText(sign).width, sx = W / 2 - tw / 2 - 22, sw = tw + 44;   // лампочки рамки вивіски
      for (let i = 0; i < 26; i++) { const u = i / 25, on = (i + bi) % 2 === 0; R(c, sx + 4 + u * (sw - 8) - 1, 23, 2, 2, on ? '#ffe27a' : '#6a5a30'); R(c, sx + 4 + u * (sw - 8) - 1, 59, 2, 2, on ? '#ffe27a' : '#6a5a30'); } }
    c.save(); c.globalCompositeOperation = 'lighter';                                                // дискокуля: блиск і плями світла
    for (let k = 0; k < 7; k++) { const a = t * .6 + k * .9, x = W / 2 + Math.cos(a) * 300, y = FL + 50 + Math.sin(a * 1.3) * 60 + k * 9, col = NEON[k % NEON.length];
      c.globalAlpha = .13; c.fillStyle = col; c.beginPath(); c.ellipse(x, y, 34, 12, 0, 0, 7); c.fill(); c.globalAlpha = .08; c.beginPath(); c.ellipse(W / 2 + Math.cos(a + 1.3) * 250, 60 + Math.sin(a * .7) * 50 + k * 20, 24, 24, 0, 0, 7); c.fill(); }
    for (let k = 0; k < 10; k++) { const a = t * 2 + k * .63, x = W / 2 + Math.cos(a) * 14, y = BALL + Math.sin(a * 1.7) * 12; c.globalAlpha = .5 + .5 * Math.sin(t * 9 + k); R(c, x, y, 2, 2, '#ffffff'); }
    [[40, 0, '#ff4fd8'], [W - 40, 0, '#3be8ff'], [W / 2 - 90, 0, '#3bff8a'], [W / 2 + 90, 0, '#ffe27a']].forEach(([x, y, col], i) => { const a = 1.2 + Math.sin(t * .9 + i * 1.6) * .9;   // лазери з-під стелі
      c.globalAlpha = .35 + .2 * pl; c.strokeStyle = col; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x, y + 6); c.lineTo(x + Math.cos(a) * 520, y + 6 + Math.sin(a) * 520); c.stroke(); });
    c.restore();
    [186, 484].forEach(x => { [FL - 54, FL - 22].forEach((y, k) => { const r = 11 - k * 2 + pl * 2.5; c.fillStyle = '#0a0626'; c.beginPath(); c.arc(x + 26, y, r + 2, 0, 7); c.fill(); c.fillStyle = '#2a2560'; c.beginPath(); c.arc(x + 26, y, r, 0, 7); c.fill(); c.fillStyle = '#3be8ff'; c.beginPath(); c.arc(x + 26, y, r * .3, 0, 7); c.fill(); });
      if (rnd() < .05) S.fx.push({ t: 'note', x: x + 26 + (rnd() - .5) * 20, y: FL - 70, vx: (rnd() - .5) * 10, vy: -22, g: 0, col: rnd() < .5 ? '#ff4fd8' : '#3be8ff', ttl: 1.6, age: 0 }); });   // колонки: конуси в такт, нотки
    [[86, 0], [94, 1], [102, 2]].forEach(([x, i]) => { R(c, x, FL - 84, 2, 8, '#ffffff'); const f = 1 + Math.sin(t * 13 + i * 2) * .5; R(c, x - 1, FL - 88 - f, 3, 3 + f, '#ffe27a'); R(c, x, FL - 87 - f, 2, 2, '#ffffff'); });   // свічки торта
    balloons().forEach((bl, i) => { const dx = Math.sin(t * 1.1 + i) * 2.5, dy = Math.sin(t * .8 + i * 2) * 2; c.fillStyle = bl.col; c.beginPath(); c.ellipse(bl.x + dx, bl.y + dy, 9, 11, 0, 0, 7); c.fill(); R(c, bl.x + dx - 3, bl.y + dy - 6, 2, 3, '#ffffffaa'); R(c, bl.x + dx - 1, bl.y + dy + 11, 2, 2, bl.col); });
  }
  function drawBooth(c, t) {                                                                        // передня панель пульта — поверх Nexi
    R(c, 296, FL - 36, 128, 44, '#1a1446'); R(c, 292, FL - 40, 136, 6, '#2a2068'); R(c, 292, FL - 40, 136, 1, '#3be8ff'); R(c, 292, FL + 7, 136, 1, '#ff4fd8');
    [320, 400].forEach(x => { c.fillStyle = '#0a0626'; c.beginPath(); c.ellipse(x, FL - 37, 16, 5, 0, 0, 7); c.fill(); c.fillStyle = '#2a2560'; c.beginPath(); c.ellipse(x, FL - 37, 13, 4, 0, 0, 7); c.fill(); const a = t * 5; R(c, x + Math.cos(a) * 9 - 1, FL - 37 + Math.sin(a) * 3 - 1, 2, 2, '#3be8ff'); R(c, x - 1, FL - 38, 2, 2, '#ff4fd8'); });   // диски крутяться
    for (let i = 0; i < 8; i++) { const on = i < 2 + Math.floor(pulse() * 6); R(c, 346 + i * 4, FL - 38, 2, 4, on ? (i > 5 ? '#ff3b5c' : i > 3 ? '#ffe27a' : '#3bff8a') : '#1e1650'); }   // еквалайзер
    R(c, 300, FL - 28, 120, 26, '#120b30'); P.text(c, NX.t('party.dj'), 360, FL - 12, '#3be8ff', 8, 'center'); for (let i = 0; i < 6; i++) R(c, 306 + i * 20, FL - 6, 8, 2, (i + Math.floor(t * 6)) % 3 ? '#ff4fd8' : '#3be8ff');
  }
  function drawFx(c, dt) {
    if (rnd() < .35) S.fx.push({ t: 'conf', x: S.x + rnd() * S.viewW, y: -S.top - 4, vx: (rnd() - .5) * 10, vy: 24 + rnd() * 20, g: 0, col: NEON[rnd() * 6 | 0], ttl: 9, age: 0, ph: rnd() * 6 });
    S.fx = S.fx.filter(f => (f.age += dt) < f.ttl); S.fx.forEach(f => { f.vy += (f.g || 0) * dt; f.x += f.vx * dt + (f.t === 'conf' ? Math.sin(f.age * 3 + f.ph) * 14 * dt : 0); f.y += f.vy * dt;
      c.globalAlpha = f.t === 'conf' ? .9 : 1 - f.age / f.ttl; if (f.t === 'note') P.text(c, f.age * 4 % 2 < 1 ? '♪' : '♫', f.x, f.y, f.col, 7); else R(c, f.x, f.y, f.t === 'conf' ? 3 : 2, f.t === 'conf' ? 2 : 2, f.col); });
    c.globalAlpha = 1;
  }
  function drawHud(c) {
    const k = S.k * NX.loop.dpr, vw = innerWidth, vh = innerHeight; c.setTransform(NX.loop.dpr, 0, 0, NX.loop.dpr, 0, 0);
    const n = S.list.length, total = NX.guests ? NX.guests.IDS.length : 20, s1 = `${NX.t('party.guests')} ${n}/${total}`; c.font = '9px "Press Start 2P", monospace';
    const w1 = c.measureText(s1).width + 18; R(c, 12, 52, w1, 22, '#0a0626dd'); c.strokeStyle = '#ff4fd8'; c.lineWidth = 1; c.strokeRect(12.5, 52.5, w1 - 1, 21); P.text(c, s1, 21, 68, '#ffe27a', 9);
    const s2 = NX.t('party.back'); c.font = '9px "Press Start 2P", monospace'; const w2 = c.measureText(s2).width + 20, bx = vw - 12 - w2, by = vh > vw ? 52 : 14;
    R(c, bx, by, w2, 26, '#0a0626ee'); c.strokeStyle = '#3be8ff'; c.strokeRect(bx + .5, by + .5, w2 - 1, 25); P.text(c, s2, bx + w2 / 2, by + 18, '#3be8ff', 9, 'center'); S.btn = { x: bx, y: by, w: w2, h: 26 };
    if (!n) { c.setTransform(k, 0, 0, k, -S.x * k, S.top * k); const txt = NX.t('party.empty'), words = txt.split(' '), lines = []; let cur = ''; c.font = '7px "Press Start 2P", monospace';   // підказка на порожньому танцполі
      words.forEach(w => { const tr = cur ? cur + ' ' + w : w; if (c.measureText(tr).width > 330 && cur) { lines.push(cur); cur = w; } else cur = tr; }); lines.push(cur);
      const ph = lines.length * 12 + 10, y0 = FL + 36; R(c, W / 2 - 180, y0, 360, ph, '#0a0626cc'); c.strokeStyle = '#ffe27a'; c.strokeRect(W / 2 - 179.5, y0 + .5, 359, ph - 1); lines.forEach((l, i) => P.text(c, l, W / 2, y0 + 15 + i * 12, '#ffe27a', 7, 'center')); }
  }
  /** Кадр вечірки (core/loop.js віддає сюди, поки on): логіка гостей, малювання шарами, інтерфейс. */
  function frame(c, dt, t) {
    S.list.forEach(g => updGuest(g, dt, t)); if (S.bub && t > S.bub.until) S.bub = null;
    const k = S.k * NX.loop.dpr; c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = '#050818'; c.fillRect(0, 0, NX.loop.canvas.width, NX.loop.canvas.height);
    c.setTransform(k, 0, 0, k, -S.x * k, S.top * k); c.imageSmoothingEnabled = false;
    const B = bg(); c.drawImage(B, 0, 0, B.width, B.height, 0, 0, W, H);
    drawLive(c, t); drawNexi(c, t); drawBooth(c, t);
    if (S.bub && S.bub.nexi) bubble(c, S.bub.text, NX_DJ.x, FL - 70, Math.min(1, (S.bub.until - t) * 3));
    S.list.slice().sort((a, b) => a.y - b.y).forEach(g => drawGuest(c, g, t));
    drawFx(c, dt); drawHud(c);
  }
  // ============================ ВХІД, ВИХІД, ДОТИКИ ============================
  function layout() { const vw = innerWidth, vh = innerHeight; S.k = Math.max(vw / W, vh / H); S.viewW = vw / S.k; S.top = (vh / S.k - H) / 2; S.x = clamp(S.x, 0, Math.max(0, W - S.viewW)); }
  const toWorld = (sx, sy) => [sx / S.k + S.x, sy / S.k - S.top];
  function tap(sx, sy) {
    const b = S.btn; if (b && sx >= b.x && sx <= b.x + b.w && sy >= b.y && sy <= b.y + b.h) { close(); return; }
    const [x, y] = toWorld(sx, sy);
    for (const g of S.list.slice().reverse()) { const [GW, GH, K] = A().size(g.id), s = GS * K * .98, w = GW * s * .6, h = GH * s, top = g.y - g.alt - h;
      if (x > g.x - w / 2 && x < g.x + w / 2 && y > top && y < g.y - g.alt + 3) { const L = NX.t(`guests.${g.id}.t`) || NX.t(`guests.${g.id}.s`) || []; g.ti = ((g.ti == null ? rnd() * L.length | 0 : g.ti + 1)) % Math.max(1, L.length);
        if (L.length) g.bub = { text: L[g.ti], until: NX.time + 2.8 }; sparks(g.x, g.y - 30, 6, ['#ff7af0', '#ffffff']); S.fx.push({ t: 'note', x: g.x, y: top - 4, vx: 0, vy: -18, g: 0, col: '#ff7af0', ttl: 1.2, age: 0 }); return; } }
    const nb = S.nexiBox; if (nb && x > nb[0] && x < nb[0] + nb[2] && y > nb[1] && y < nb[1] + nb[3]) { S.hiT = NX.time + 1.6; NX.nexi.emote('love', 2); for (let i = 0; i < 5; i++) S.fx.push({ t: 'note', x: NX_DJ.x + (rnd() - .5) * 30, y: FL - 70, vx: (rnd() - .5) * 20, vy: -24, g: 0, col: NEON[i], ttl: 1.4, age: 0 }); }
  }
  const H_ = {
    down(e) { if (!S.on) return; e.stopImmediatePropagation(); S.pointer = { x: e.clientX, y: e.clientY, sx: S.x, moved: false }; },
    move(e) { if (!S.on) return; e.stopImmediatePropagation(); const p = S.pointer; if (!p) return; const dx = e.clientX - p.x; if (Math.abs(dx) > 6) p.moved = true; if (p.moved) S.x = clamp(p.sx - dx / S.k, 0, Math.max(0, W - S.viewW)); },
    up(e) { if (!S.on) return; e.stopImmediatePropagation(); const p = S.pointer; S.pointer = null; if (p && !p.moved) tap(e.clientX, e.clientY); },
    key(e) { if (S.on && e.key === 'Escape') close(); },
  };
  let bound = false;
  function bind() { if (bound) return; bound = true; const cv = NX.loop.canvas; cv.addEventListener('pointerdown', H_.down, true); cv.addEventListener('pointermove', H_.move, true); cv.addEventListener('pointerup', H_.up, true); cv.addEventListener('pointercancel', e => { if (S.on) { e.stopImmediatePropagation(); S.pointer = null; } }, true);
    addEventListener('keydown', H_.key); addEventListener('resize', () => { if (S.on) layout(); }); if (NX.i18n && NX.i18n.onLang) NX.i18n.onLang(() => { BG = null; }); }
  /** Відкрити вечірку (кличе сценарій Nexi `party`, коли він зник у вихорі). */
  function open() { bind(); S.on = true; S.t0 = NX.time; S.fx = []; S.bub = null; layout(); S.x = clamp((W - S.viewW) / 2, 0, Math.max(0, W - S.viewW)); roster(); document.body.classList.add('nx-party'); if (NX.input) NX.input.hover = null; }
  /** Закрити (кнопка «← У КІМНАТУ», Esc): сценарій Nexi бачить !on і повертає його на майданчик. */
  function close() { if (!S.on) return; S.on = false; document.body.classList.remove('nx-party'); }
  return { open, close, frame, S, get on() { return S.on; }, roster };
})();
