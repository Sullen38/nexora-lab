/* ============================================================================
 * actors/guests/party.js — ВЕЧІРКА В ПОРТАЛІ: ЖИВИЙ ШАР, ГОСТІ, NEXI-DJ, ДОТИКИ (04.11; 3D-кімната — 06.11, чат «Персонажі»)
 * ----------------------------------------------------------------------------
 * Власник: «на портал коли ми нажимаємо — ми попадаємо на вечірку; на вечірці будуть тільки ті гості, яких ми вже спіймали:
 * прийшов гість, ми на нього натиснули — і він з'явився в колекції; а потім, коли він уже пішов, він з'являється в нас на
 * вечірці — паті-кімната, де вони всі танцюють; з'явиться, коли Nexi відправиться в портал». 06.11: «графіка дуже примітивна —
 * треба рішення» → кімната перебудована як піксельне 3D у перспективі кімнати (party_room.js), тут — усе, що живе.
 *   ЯК ПОТРАПИТИ: тап по брамі (guests.js: tapFirst) → сценарій Nexi `party` (activities.js): іде до брами (тим часом prepare()
 *     збирає растр кімнати), стрибає на майданчик, тане у вихорі → open(). «← У КІМНАТУ» (кнопка чи Esc) → close() → Nexi
 *     з'являється на майданчику й зіскакує.
 *   ХТО ТУТ: NX.guests.atParty() — спіймані тапом (колекція, localStorage) і зараз не в кімнаті. Нікого — Nexi сам за пультом,
 *     на танцполі підказка (party.empty). Тап по гостю — його репліка (guests.<id>.t) і сердечко; тап по Nexi — нотки.
 *   СВІТ: координати кімнати (core/persp.js: VP (774, 220), підлога 372, z углиб) — гості й Nexi стоять на підлозі в (x, z),
 *     на екрані — PZ.p(x, 372, z), масштаб — як у кімнаті (NEXI_SCALE_FAR · s(z)), тож далекі менші. Камера своя: на
 *     комп'ютері видно всю кімнату (GEO.VIEW 1480×740 од., «cover»), на телефоні гортається пальцем.
 *   ЖИВЕ ЩОКАДРУ (поверх растра party_room.js): танцпол 8×4 на підлозі в перспективі (плитки в такт 128 bpm), промені
 *     прожекторів з рейки на стелі (конуси світла, lighter) і лазери з кутів, плями від дзеркальної кулі на підлозі й стінах,
 *     блиск кулі, лампочки гірлянд і рамки вивіски, динаміки колонок пульсують, диски пульта крутяться, еквалайзер, свічки,
 *     туман над підлогою, віньєтка, конфеті, нотки; гості й Nexi — з ВІДБИТКОМ у глянці підлоги (перевернутий спрайт).
 *   ТАНЕЦЬ: кожен гість у такт підстрибує, чергує кроки й «ура», раз на 5–9 с робить свою фішку (Мерлін чаклує, Горинич чхає,
 *     Піноккіо бреше, Попелюшка кружляє…) і часом переходить на інше місце танцполу; летуни (Яга в ступі, Жар-птиця, Джин,
 *     Мюнхгаузен) ширяють над танцполом, Колобок скаче, Чеширський кіт тане. Nexi на подіумі за пультом танцює (поза dance).
 *   БАР І ЗАКУСКИ (власник, 06.11): за стійкою — БАРМЕН (guest_art.js: bartender; протирає келихи, а коли підходить гість —
 *     трусить шейкер і наливає); гості час від часу йдуть до стійки по напій або до столу із закусками (піца, кекс), чекають,
 *     беруть і повертаються на танцпол з річчю в руці (напій — ще кілька секунд танцюють із келихом). Стійка закриває бармена
 *     знизу: після нього поверх перемальовуються грані стійки з растра (clip по їх многокутниках).
 *   ТРИ ПЛАНИ (крок 3): спереду — огорожа лаунжу (растр), посередині — танцпол і гості, позаду — НАТОВП-ТЛО: темні силуети
 *     обабіч пульта, що хитаються в такт і підіймають руки (GEO.crowd), — кімната не порожня навіть із трьома гостями.
 *   МУЗИКА (party_music.js): 8-bit трек синтезом (Web Audio), кнопка «♪ ЗВУК» у шапці, за замовчуванням вимкнено, вибір
 *     запам'ятовується; увімкнення скидає такт (S.t0) — плитки й танець у такт музиці.
 *   ТЕКСТИ — party.* у словниках (4 мови); растр кімнати перебудовується при зміні мови.
 * ========================================================================== */
NX.party = (() => {
  const PZ = NX.persp, FL = 372, BPM = 128;
  const S = { on: false, k: 1, x: 0, y: 0, viewW: 0, viewH: 0, t0: 0, list: [], fx: [], bub: null, btn: null, pointer: null, bg: null };
  const P = NX.px, A = () => NX.guestArt, rnd = Math.random, clamp = (v, a, b) => Math.max(a, Math.min(b, v)), G = () => NX.partyRoom.GEO;
  const R = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  const NEON = ['#ff4fd8', '#3be8ff', '#ffe27a', '#3bff8a', '#b48aff', '#ff7a2a'];
  const beat = () => (NX.time - S.t0) * BPM / 60, pulse = () => Math.abs(Math.sin(beat() * Math.PI));
  const pt = (x, y, z) => PZ.p(x, y, z), fp = (x, z) => PZ.p(x, FL, z), sc = z => NX.cfg.NEXI_SCALE_FAR * PZ.s(z);   // масштаб спрайта на підлозі в глибині z
  const poly = (c, pts) => { c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); };
  /** Точка танцполу за частками u (ліворуч-праворуч) і v (0 — далі, 1 — ближче) -> [x, z]. */
  const floorXZ = (u, v) => { const D = G().dance; return [D.x0 + (D.x1 - D.x0) * u, D.z1 - (D.z1 - D.z0) * v]; };

  // ============================ РАСТР КІМНАТИ ============================
  /** Зібрати растр (party_room.js) — кличе сценарій Nexi на старті (поки він іде до брами) і зміна мови. */
  function prepare() { if (!S.bg) S.bg = NX.partyRoom.build(); }

  // ============================ ГОСТІ НА ВЕЧІРЦІ ============================
  const FLYER = { babaYaga: 'ride', firebird: 'fly', genie: 'float', munchausen: 'ride' };
  const SPECIAL = { quixote: 'charge', merlin: 'cast', gorynych: 'sneeze', genie: 'cast', tinMan: 'rust', silver: 'dig', sherlock: 'inspect', robinHood: 'aim', pinocchio: 'nose', cinderella: 'twirl',
    snowWhite: 'search', redHood: 'give', pussBoots: 'bow', whiteRabbit: 'watch', stNicholas: 'give', babaYaga: 'sweep' };
  const BM = { pose: 'wipe', until: 0, guest: null };
  const STYLES = ['bounce', 'sway', 'twist', 'jump', 'spin'];                                        // стилі танцю (крок 4): кожен гість має свій, міняє раз на 10–20 с
  const CAT = { pose: 'sit', until: 0, cv: document.createElement('canvas') };                      // Рудик на колонці (крок 5)                                                  // бармен: що робить і кого обслуговує
  function roster() {
    const ids = NX.guests ? NX.guests.atParty() : [], n = ids.length; S.list = []; BM.pose = 'wipe'; BM.guest = null;
    ids.forEach((id, i) => { const row = n <= 7 ? 1 : i % 3, col = n <= 7 ? i : Math.floor(i / 3), per = n <= 7 ? n : Math.ceil(n / 3), u = (col + .5) / per, v = [.15, .5, .85][row] || .5;
      const [x, z] = floorXZ(u, v), g = { id, x, z, tx: x, tz: z, dir: x < 774 ? 1 : -1, ph: rnd(), fr: 0, ft: 0, alt: 0, pose: 'stand', next: NX.time + 3 + rnd() * 8, spT: 0, g: {}, fly: FLYER[id] || null, u, v };
      if (g.fly) g.alt = 30 + rnd() * 10; g.style = STYLES[(id.length + i) % STYLES.length]; g.styleT = NX.time + 10 + rnd() * 10; S.list.push(g); });
    S.pair = null; S.event = null; S.eventT = NX.time + 25; CAT.until = 0;
  }
  const sparks = (x, y, n, cols) => { for (let i = 0; i < n; i++) S.fx.push({ t: 'sp', x: x + (rnd() - .5) * 30, y: y - rnd() * 30, vx: (rnd() - .5) * 40, vy: -20 - rnd() * 40, g: 60, col: cols[i % cols.length], ttl: .6 + rnd() * .5, age: 0 }); };
  const gxy = g => fp(g.x, g.z);                                                                      // ноги гостя на екрані
  function updGuest(g, dt, t) {
    const b = beat() + g.ph, bounce = Math.abs(Math.sin(b * Math.PI)); g.ft += dt; if (g.ft > .13) { g.ft = 0; g.fr++; } g.g.nose = 0;
    const goto = (u, v) => { const [x, z] = floorXZ(clamp(u, .04, .96), clamp(v, .02, .98)); g.tx = x; g.tz = z; };
    const step = sp => { const dx = g.tx - g.x, dz = g.tz - g.z, d = Math.hypot(dx, dz); if (d < 1.5) return true; const k = Math.min(d, sp * dt); g.x += dx / d * k; g.z += dz / d * k; if (Math.abs(dx) > 2) g.dir = Math.sign(dx); return false; };
    if (g.fly) {                                                                                      // летуни ширяють над танцполом
      if (t > g.next) { g.next = t + 4 + rnd() * 6; goto(g.u + (rnd() - .5) * .6, .1 + rnd() * .8); } step(40);
      g.alt = 34 + Math.sin(t * 1.7 + g.ph * 6) * 8 + bounce * 3; g.pose = g.fly; const [sx, sy] = gxy(g), s = sc(g.z);
      if (g.id === 'firebird' && rnd() < .5) S.fx.push({ t: 'sp', x: sx - g.dir * 14 * s, y: sy - (g.alt + 16) * s, vx: -g.dir * 20, vy: 10, g: 0, col: rnd() < .5 ? '#ff7a2a' : '#ffe27a', ttl: .4, age: 0 });
      if (g.id === 'babaYaga' && rnd() < .2) S.fx.push({ t: 'sp', x: sx - g.dir * 10 * s, y: sy - (g.alt + 4) * s, vx: -g.dir * 10, vy: 8, g: 0, col: '#8a8ab0', ttl: .5, age: 0 }); return;
    }
    if (g.conga) { const C = g.conga, E = S.event; g.alt = Math.abs(Math.sin((b + .5) * Math.PI)) * 3; g.pose = 'walk'; g.rot = Math.sin(b * Math.PI) * .1; g.sx = 1;
      if (!C.prev) { const R = E && E.route ? E.route : [[.5, .5]], [x, z] = floorXZ(...R[C.idx % R.length]); g.tx = x; g.tz = z; if (step(52)) C.idx++; }
      else { g.tx = C.prev.x - C.prev.dir * 30; g.tz = C.prev.z; step(56); if (Math.abs(g.tx - g.x) < 4) g.dir = C.prev.dir; } return; }
    if (g.photo) { const Ph = g.photo; g.alt = 0; g.rot = 0; g.sx = 1; g.tx = Ph.x; g.tz = Ph.z; if (!step(48)) { g.pose = 'walk'; return; } g.dir = Ph.dir; g.pose = S.event && t > S.event.flashT - 1.5 ? 'cheer' : 'stand'; g.alt = g.pose === 'cheer' ? bounce * 6 : 0; return; }
    if (g.trip) { const T = g.trip; g.alt = 0;                                                        // похід до бару / закусок
      if (T.ph === 'go') { g.pose = 'walk'; if (step(44)) { T.ph = 'wait'; T.t = t + (T.to === 'bar' ? 3.2 : 2.2) + rnd(); g.dir = T.to === 'bar' ? 1 : -1; if (T.to === 'bar' && !BM.guest) { BM.guest = g; BM.pose = 'shake'; BM.until = t + 1.7; } } return; }
      if (T.ph === 'wait') { g.pose = Math.floor(b) % 4 === 0 ? 'cheer' : 'stand'; if (T.to === 'snack' && !g.item && t > T.t - 1) g.item = rnd() < .5 ? 'pizza' : 'cake';
        if (t > T.t && (T.to !== 'bar' || g.item)) { T.ph = 'back'; const [x, z] = floorXZ(g.u, g.v); g.tx = x; g.tz = z; g.itemT = t + 7 + rnd() * 5; } return; }
      g.pose = 'walk'; if (step(44)) { g.trip = null; g.next = t + 6 + rnd() * 6; } return; }
    if (g.id === 'kolobok') { g.pose = 'roll'; g.alt = bounce * 14; if (t > g.next) { g.next = t + 3 + rnd() * 5; goto(g.u + (rnd() - .5) * .6, g.v); } step(50); return; }
    if (g.id === 'cheshire') { g.pose = 'sit'; g.alt = 0; return; }
    if (g.item && t > g.itemT) g.item = null;
    if (g.mv) { g.pose = 'walk'; g.alt = 0; if (step(44)) { g.mv = false; g.next = t + 5 + rnd() * 6; } return; }   // переходить на інше місце
    if (t < g.spT) { g.pose = g.sp === 'nose' ? 'stand' : g.sp; if (g.sp === 'nose') g.g.nose = Math.min(9, (g.spT - t) * 5); g.alt = 0; const [sx, sy] = gxy(g), s = sc(g.z);
      if (g.sp === 'cast' && rnd() < .4) sparks(sx + g.dir * 14 * s, sy - 50 * s, 1, ['#9af6ff', '#e2c4ff']); if (g.sp === 'sneeze' && rnd() < .5) sparks(sx + g.dir * 34 * s, sy - 46 * s, 1, ['#ff7a2a', '#ffe27a']);
      if (g.sp === 'twirl' && rnd() < .3) sparks(sx, sy - 20 * s, 1, ['#ffffff']); if (g.sp === 'rust' && rnd() < .2) sparks(sx, sy - 30 * s, 1, ['#ffd27a']); return; }
    if (t > g.next) { const r = rnd(); if (r < .22 && !g.item) { const bar = rnd() < .55, Bz = bar ? G().bar : G().snack; g.trip = { to: bar ? 'bar' : 'snack', ph: 'go' }; g.tx = bar ? Bz.x0 - 28 : Bz.x1 + 28; g.tz = Bz.z0 + 24 + rnd() * (Bz.z1 - Bz.z0 - 48); g.item = null; }
      else if (r < .6 || !SPECIAL[g.id]) { g.mv = true; goto(g.u + (rnd() - .5) * .3, g.v + (rnd() - .5) * .25); } else { g.sp = SPECIAL[g.id]; g.spT = t + 1.6; g.next = t + 5 + rnd() * 5; } return; }
    if (t > g.styleT) { g.style = STYLES[rnd() * STYLES.length | 0]; g.styleT = t + 10 + rnd() * 10; }
    g.rot = 0; g.sx = 1; const k = Math.floor(b) % 8, hb = Math.floor(b * 2), sgn = hb % 2 ? 1 : -1;
    if (g.cheerT && t < g.cheerT) { g.pose = 'cheer'; g.alt = bounce * 10; return; }                 // усі «ура» (Nexi підняв руку / подія)
    if (g.pairT && t < g.pairT) { g.pose = k % 4 === 3 ? 'cheer' : 'stand'; g.alt = bounce * 4; g.rot = Math.sin(b * Math.PI) * .14 * (g.pairSide || 1); return; }   // танець у парі: гойдаються дзеркально
    switch (g.style) {
      case 'sway': g.pose = 'stand'; g.alt = bounce * 2; g.rot = Math.sin(b * Math.PI) * .16; break;
      case 'twist': g.pose = 'walk'; g.fr = 1; g.alt = bounce * 3; g.sx = .55 + .45 * Math.abs(Math.cos(b * Math.PI)); break;
      case 'jump': g.pose = hb % 4 < 2 ? 'cheer' : 'stand'; g.alt = (hb % 4 < 2 ? bounce * 12 : bounce * 3); break;
      case 'spin': g.pose = 'walk'; g.fr = hb % 4; g.alt = bounce * 4; if (hb !== g.lastB) { g.lastB = hb; g.dir = -g.dir; } break;
      default: g.alt = bounce * (k === 7 ? 9 : 5); g.pose = k === 7 || k === 3 ? 'cheer' : 'walk'; if (g.pose === 'walk') g.fr = hb % 4;
        if (hb % 2 === 0 && hb !== g.lastB) { g.lastB = hb; if (rnd() < .3) g.dir = -g.dir; }
    }
  }
  /** Гість: тінь, відбиток у підлозі (перевернутий, тане), спрайт, бабл. */
  function drawGuest(c, g, t) {
    const [GW, GH, K] = A().size(g.id), s = sc(g.z) * K, w = GW * s, h = GH * s, [sx, sy] = gxy(g), alt = g.alt * s, top = sy - alt - h, tq = Math.floor(t * 12) / 12;
    const img = A().frame(g.id, g.pose, g.fr, tq, g.g); c.imageSmoothingEnabled = false;
    c.fillStyle = 'rgba(0,0,0,.4)'; c.beginPath(); c.ellipse(sx, sy + 1, w * .3 * Math.max(.3, 1 - alt / 120), 3 * PZ.s(g.z), 0, 0, 7); c.fill();
    c.save(); c.translate(sx, sy + alt); c.scale(g.dir, -1); c.globalAlpha = .26; c.drawImage(img, -w / 2, -h, w, h); c.restore();       // відбиток у глянці
    c.save(); c.translate(sx, sy - alt); c.rotate(g.rot || 0); c.scale(g.dir * (g.sx || 1), 1); c.drawImage(img, -w / 2, -h, w, h); c.restore();
    if (g.item) drawItem(c, g.item, sx + g.dir * 9 * s, sy - alt - 19 * s, s, g.dir);
    if (g.bub && t < g.bub.until) bubble(c, g.bub.text, sx, top - 6, Math.min(1, (g.bub.until - t) * 3));
  }
  /** Річ у руці гостя (у масштабі s, од. ≈ пікселі спрайта): келих з напоєм, шматок піци, кекс. */
  function drawItem(c, kind, x, y, s, dir) {
    c.save(); c.translate(x, y); c.scale(s * dir, s);
    if (kind === 'drink' || kind === 'drink2') { const col = kind === 'drink' ? '#ffd27a' : '#ff84d4'; R(c, -3, -8, 6, 7, '#e0f4ff'); R(c, -2, -5, 4, 4, col); R(c, -2, -8, 1, 3, '#ffffff'); R(c, -1, -1, 2, 3, '#c8d8e0'); R(c, -3, 2, 6, 1, '#c8d8e0'); R(c, 1, -11, 1, 4, '#3be8ff'); }
    else if (kind === 'pizza') { c.fillStyle = '#ffd27a'; c.beginPath(); c.moveTo(-5, -2); c.lineTo(5, -6); c.lineTo(5, 2); c.closePath(); c.fill(); R(c, 4, -6, 1, 8, '#c8902a'); R(c, 0, -3, 2, 2, '#c8302a'); R(c, 2, 0, 2, 1, '#2a8a3a'); }
    else { R(c, -3, -3, 6, 5, '#b8844a'); R(c, -3, -3, 6, 1, '#d8a060'); R(c, -4, -7, 8, 4, '#ff84d4'); R(c, -3, -8, 6, 1, '#ffc2ec'); R(c, -1, -10, 2, 2, '#c81e3c'); }
    c.restore();
  }
  function bubble(c, text, x, top, al) {
    let fs = 8; c.save(); c.font = `${fs}px "Press Start 2P", monospace`; let tw = c.measureText(text).width; if (tw > 260) { fs = Math.max(6, fs * 260 / tw); c.font = `${fs}px "Press Start 2P", monospace`; tw = c.measureText(text).width; }
    const pw = tw + 14, ph = fs + 12, bx = clamp(x - pw / 2, S.x + 4, S.x + S.viewW - pw - 4), by = top - ph - 6; c.globalAlpha = al;
    c.fillStyle = '#0a0626ee'; c.fillRect(bx, by, pw, ph); c.strokeStyle = '#ff7af0'; c.lineWidth = 1; c.strokeRect(bx + .5, by + .5, pw - 1, ph - 1);
    c.fillStyle = '#0a0626ee'; c.beginPath(); c.moveTo(x - 4, by + ph); c.lineTo(x + 4, by + ph); c.lineTo(x, by + ph + 5); c.fill();
    c.fillStyle = '#ffffff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, bx + pw / 2, by + ph / 2 + .5); c.restore();
  }
  /** Режисер вечірки (кроки 4–6): пари танцюристів, «ура» від Nexi, Рудик на колонці, події раз на ~35 с. */
  function director(t) {
    const idle = S.list.filter(g => !g.trip && !g.mv && !g.fly && g.id !== 'kolobok' && g.id !== 'cheshire' && !(g.pairT && t < g.pairT) && t > g.spT);
    if (S.pair && t > S.pair.until) S.pair = null;
    if (!S.pair && idle.length >= 2 && !S.pairNext) S.pairNext = t + 8 + rnd() * 8;
    if (!S.pair && S.pairNext && t > S.pairNext && idle.length >= 2) {                                // пара: другий підходить до першого, стають лицем одне до одного
      const a = idle[rnd() * idle.length | 0]; let bq = idle.filter(g => g !== a); const b = bq[rnd() * bq.length | 0];
      b.mv = true; b.tx = clamp(a.x + a.dir * 40, G().dance.x0 + 10, G().dance.x1 - 10); b.tz = a.z; S.pair = { a, b, until: t + 16, met: false }; S.pairNext = 0;
    }
    if (S.pair && !S.pair.met && !S.pair.b.mv) { const { a, b } = S.pair; S.pair.met = true; a.dir = Math.sign(b.x - a.x) || 1; b.dir = -a.dir; a.pairT = b.pairT = t + 9; a.pairSide = 1; b.pairSide = -1; a.next = b.next = t + 10; S.duet = { a, b, at: t + .6, step: 0 }; sparks((a.x + b.x) / 2, 0, 0, []); S.fx.push({ t: 'note', x: fp((a.x + b.x) / 2, a.z)[0], y: fp(a.x, a.z)[1] - 70 * sc(a.z), vx: 0, vy: -16, g: 0, col: '#ff7af0', ttl: 1.6, age: 0 }); }
    if (S.duet && t > S.duet.at) { const D = S.duet, g = D.step % 2 ? D.b : D.a, L = NX.t(`guests.${g.id}.t`) || []; if (L.length) g.bub = { text: L[(D.step >> 1) % L.length], until: t + 2.6 }; D.step++; D.at = t + 3.2; if (D.step >= 4) S.duet = null; }   // дует: обмінюються репліками
    if (!S.nexiCheer || t > S.nexiCheer + 20) { S.nexiCheer = t + 6 + rnd() * 10; }                   // Nexi підіймає руку — усі «ура»
    if (t > S.nexiCheer && t < S.nexiCheer + 1.6) { S.nexiPose = 'cheer'; if (!S.cheerDone) { S.cheerDone = true; S.list.forEach(g => { if (!g.trip && !g.fly) g.cheerT = t + 1.8; }); const N = nexiPos(); for (let i = 0; i < 8; i++) S.fx.push({ t: 'note', x: N.x + (rnd() - .5) * 60, y: N.y - 70, vx: (rnd() - .5) * 30, vy: -26, g: 0, col: NEON[i % 6], ttl: 1.6, age: 0 }); } }
    else { S.nexiPose = 'dance'; if (t > S.nexiCheer + 1.6) S.cheerDone = false; }
    if (t > CAT.until) { CAT.pose = CAT.pose === 'sit' && rnd() < .35 ? 'paw' : CAT.pose === 'sit' && rnd() < .2 ? 'groom' : 'sit'; CAT.until = t + (CAT.pose === 'sit' ? 4 + rnd() * 6 : 1.6); }   // Рудик: сидить, б'є лапкою конфеті, вмивається
    if (!S.event && t > S.eventT) { const kinds = ['spot', 'strobe', 'fire', 'conga', 'photo']; const kind = kinds[rnd() * kinds.length | 0]; S.event = { kind, t0: t, until: t + (kind === 'conga' ? 14 : kind === 'photo' ? 9 : rnd() < .5 ? 6 : 5) }; S.eventT = t + 30 + rnd() * 20;   // події
      if (S.event.kind === 'spot') { const cand = S.list.filter(g => !g.trip && !g.fly); S.event.g = cand[rnd() * cand.length | 0] || null; S.list.forEach(g => { if (g !== S.event.g && !g.trip) g.cheerT = t + 2.5; }); } }
    if (S.event && S.event.kind === 'conga' && !S.event.set) { S.event.set = true; const free = idle.slice(0, 7); if (free.length >= 3) { const D = G().dance; S.event.line = free; free.forEach((g, i) => { g.conga = { prev: i ? free[i - 1] : null, idx: 0 }; g.trip = null; g.mv = false; }); S.event.route = [[.12, .15], [.88, .15], [.88, .85], [.12, .85]]; S.event.label = NX.t('party.conga'); } else S.event = null; }   // конга: 3–7 гостей ланцюжком по колу танцполу
    if (S.event && S.event.kind === 'photo' && !S.event.set) { S.event.set = true; const free = idle.slice(0, 9); if (free.length >= 2) { S.event.line = free; free.forEach((g, i) => { const [x, z] = floorXZ(.5 + (i - (free.length - 1) / 2) * .11, i % 2 ? .12 : .02); g.photo = { x, z, dir: i < free.length / 2 ? 1 : -1 }; g.trip = null; g.mv = false; }); S.event.flashT = t + 5; S.event.label = NX.t('party.photo'); } else S.event = null; }   // фото біля пульта: стають у ряд, «ура», спалах
    if (S.event && t > S.event.until) { (S.event.line || []).forEach(g => { g.conga = null; g.photo = null; g.next = t + 2 + rnd() * 4; }); S.event = null; }
    if (S.event && S.event.kind === 'fire' && rnd() < .25) { const x = 774 + (rnd() - .5) * 700, [sx, sy] = pt(x, 90 + rnd() * 80, G().ZB - 20), col = NEON[rnd() * 6 | 0]; for (let i = 0; i < 14; i++) { const a = i / 14 * 6.283; S.fx.push({ t: 'sp', x: sx, y: sy, vx: Math.cos(a) * 45, vy: Math.sin(a) * 45, g: 30, col, ttl: .9, age: 0 }); } }   // салют за пультом
  }
  /** Події поверх: прожектор на найкращого танцюриста з підписом, строб. */
  function drawEvent(c, t) {
    const E = S.event; if (!E) return;
    if (E.kind === 'spot' && E.g) { const g = E.g, [sx, sy] = gxy(g), s = sc(g.z), top = pt(774, G().CEIL + 20, 150); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = .22; c.fillStyle = '#ffffff'; poly(c, [top, [sx - 40 * s, sy + 6], [sx + 40 * s, sy + 6]]); c.fill(); c.globalAlpha = .3; c.beginPath(); c.ellipse(sx, sy + 2, 44 * s, 12 * s, 0, 0, 7); c.fill(); c.restore();
      const lab = NX.t('party.best'); c.font = '8px "Press Start 2P", monospace'; const w = c.measureText(lab).width + 14, y = sy - 78 * s; R(c, sx - w / 2, y - 7, w, 14, '#0a0626ee'); c.strokeStyle = '#ffe27a'; c.lineWidth = 1; c.strokeRect(sx - w / 2 + .5, y - 6.5, w - 1, 13); P.text(c, lab, sx, y + 3, '#ffe27a', 8, 'center');
      if (rnd() < .3) sparks(sx + (rnd() - .5) * 60 * s, sy - 20 * s, 1, ['#ffe27a', '#ffffff']); }
    if (E.label) { const [lx, ly] = pt(774, G().sign.y1 + 30, G().ZB - 8); c.font = '9px "Press Start 2P", monospace'; const w = c.measureText(E.label).width + 16; R(c, lx - w / 2, ly - 8, w, 16, '#0a0626ee'); c.strokeStyle = '#ff7af0'; c.lineWidth = 1; c.strokeRect(lx - w / 2 + .5, ly - 7.5, w - 1, 15); P.text(c, E.label, lx, ly + 3.5, '#ff9af0', 9, 'center'); }
    if (E.kind === 'photo' && t > E.flashT && t < E.flashT + .5) { c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = (E.flashT + .5 - t) * 1.6; c.fillStyle = '#ffffff'; c.fillRect(0, 0, NX.loop.canvas.width, NX.loop.canvas.height); c.restore(); if (!E.flashed) { E.flashed = true; (E.line || []).forEach(g => { g.cheerT = t + 2.5; }); for (let i = 0; i < 20; i++) sparks(774 + (rnd() - .5) * 400, fp(774, 60)[1] - 40, 1, ['#ffffff', '#ffe27a']); } }
    if (E.kind === 'strobe' && Math.floor(t * 8) % 2 === 0) { c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = .18; c.fillStyle = '#ffffff'; c.fillRect(0, 0, NX.loop.canvas.width, NX.loop.canvas.height); c.restore(); }
  }
  /** Рудик на лівій колонці: сидить і киває в такт; б'є лапкою по конфеті; вмивається. */
  function drawRudyk(c, t) {
    const drawCat_ = window.drawCat; if (typeof drawCat_ !== 'function') return; const Ct = G().cat, s = sc(Ct.z) * .62, [sx, sy] = pt(Ct.x, Ct.y, Ct.z), bob = Math.abs(Math.sin(beat() * Math.PI)) * 2 * s;
    drawCat_(CAT.pose, Math.floor(t * 6) % 4, t, CAT.cv, null, null); c.save(); c.imageSmoothingEnabled = false; c.translate(sx, sy - bob); c.scale(-1, 1); c.drawImage(CAT.cv, -16 * s, -24 * s, 32 * s, 24 * s); c.restore();
    if (CAT.pose === 'paw' && rnd() < .2) S.fx.push({ t: 'conf', x: sx - 10 * s, y: sy - 14 * s, vx: -20, vy: 10, g: 0, col: NEON[rnd() * 6 | 0], ttl: 3, age: 0, ph: 0 });
  }
  /** Афіша колекції на задній стіні: портрети спійманих (верх кадру stand), темні силуети ще не спійманих, підпис. */
  let POSTER = null, posterKey = '';
  function drawPoster(c) {
    const Po = G().poster, ids = NX.guests.IDS, col = NX.guests.collection(), key = col.join(',') + '|' + NX.i18n.lang;
    if (!POSTER || posterKey !== key) { posterKey = key; const w = Po.x1 - Po.x0, h = Po.y1 - Po.y0; POSTER = POSTER || document.createElement('canvas'); POSTER.width = w * 2; POSTER.height = h * 2; const x = POSTER.getContext('2d'); x.imageSmoothingEnabled = false; x.scale(2, 2);
      P.text(x, NX.t('party.poster'), w / 2, 16, '#ff9af0', 8, 'center'); const cols = 5, cw = (w - 16) / cols, ch = (h - 28) / 4;
      ids.forEach((id, i) => { const cx = 8 + (i % cols) * cw + cw / 2, cy = 24 + Math.floor(i / cols) * ch, got = col.includes(id), img = A().frame(id, 'stand', 0, .5, {}), [GW, GH, K] = A().size(id), sw = GW * K * .55, sh = GH * K * .55;
        x.fillStyle = got ? '#1e1650' : '#0c0a22'; x.fillRect(cx - cw / 2 + 2, cy, cw - 4, ch - 3); x.strokeStyle = got ? '#3be8ff' : '#2a2260'; x.lineWidth = 1; x.strokeRect(cx - cw / 2 + 2.5, cy + .5, cw - 5, ch - 4);
        x.save(); x.beginPath(); x.rect(cx - cw / 2 + 3, cy + 1, cw - 6, ch - 5); x.clip(); if (got) x.drawImage(img, cx - sw / 2, cy + ch - 4 - sh, sw, sh); else { x.globalAlpha = .9; x.filter = 'brightness(0.12)'; x.drawImage(img, cx - sw / 2, cy + ch - 4 - sh, sw, sh); } x.restore(); }); }
    const [px0, py0] = pt(Po.x0 + 4, Po.y0 + 4, G().ZB - 4.5), [px1, py1] = pt(Po.x1 - 4, Po.y1 - 4, G().ZB - 4.5); c.imageSmoothingEnabled = true; c.drawImage(POSTER, px0, py0, px1 - px0, py1 - py0); c.imageSmoothingEnabled = false;
  }
  /** Бармен за стійкою: протирає келихи; гість підійшов — шейкер, потім наливає й віддає келих. Після нього поверх — грані стійки з растра. */
  function drawBartender(c, t) {
    const Bm = G().barman, Br = G().bar, s = sc(Bm.z) * .95, [GW, GH] = A().size('bartender'), w = GW * s, h = GH * s, [sx, sy] = pt(Bm.x, Bm.y, Bm.z);   // бармен на підвищенні за стійкою, трохи більший
    if (BM.guest && t > BM.until) { if (BM.pose === 'shake') { BM.pose = 'pour'; BM.until = t + 1.5; } else if (BM.pose === 'pour') { BM.guest.item = rnd() < .5 ? 'drink' : 'drink2'; BM.guest = null; BM.pose = 'wipe'; const L = NX.t('party.barman') || []; if (L.length) BM.bub = { text: L[rnd() * L.length | 0], until: t + 2.8 }; } }
    else if (!BM.guest && BM.pose !== 'wipe' && BM.pose !== 'stand') BM.pose = 'wipe';
    if (!BM.guest && t > BM.until) { BM.pose = rnd() < .7 ? 'wipe' : 'stand'; BM.until = t + 3 + rnd() * 4; }
    const img = A().frame('bartender', BM.pose, 0, Math.floor(t * 12) / 12, {}); c.save(); c.imageSmoothingEnabled = false; c.translate(sx, 0); c.scale(-1, 1); c.drawImage(img, -w / 2, sy - h, w, h); c.restore();
    if (BM.bub && t < BM.bub.until) bubble(c, BM.bub.text, sx, sy - h - 4, Math.min(1, (BM.bub.until - t) * 3));
    const y0 = Br.y0 - 3, q = [[Br.x0, y0, Br.z0], [Br.x1, y0, Br.z0], [Br.x1, FL, Br.z0], [Br.x0, FL, Br.z0], [Br.x0, y0, Br.z0], [Br.x1, y0, Br.z0], [Br.x1, y0, Br.z1], [Br.x0, y0, Br.z1], [Br.x0, y0, Br.z0], [Br.x0, y0, Br.z1], [Br.x0, FL, Br.z1], [Br.x0, FL, Br.z0]];
    c.save(); c.beginPath(); for (let k = 0; k < 3; k++) { const P4 = q.slice(k * 4, k * 4 + 4).map(p => pt(...p)); c.moveTo(P4[0][0], P4[0][1]); for (let m = 1; m < 4; m++) c.lineTo(P4[m][0], P4[m][1]); c.closePath(); } c.clip(); c.drawImage(S.bg.cv, S.bg.x0, S.bg.y0); c.restore();
  }
  /** Натовп-тло: темні силуети обабіч пульта хитаються в такт, дехто підіймає руки. */
  function drawCrowd(c, t) {
    const b = beat(); G().crowd.forEach((p, i) => { const s = PZ.s(p.z), [x, y] = fp(p.x, p.z), bob = Math.abs(Math.sin((b + p.ph) * Math.PI)) * 4 * s, h = p.h * s, w = p.w * s, up = Math.sin(t * .7 + p.ph * 3) > .55;
      c.fillStyle = 'rgba(34,24,82,.92)'; c.beginPath(); c.roundRect(x - w / 2, y - h * .62 - bob, w, h * .62 + bob, 3 * s); c.fill(); c.beginPath(); c.arc(x, y - h * .78 - bob, h * .17, 0, 7); c.fill();
      if (up) { c.fillRect(x - w / 2 - 3 * s, y - h * 1.05 - bob, 3 * s, h * .45); c.fillRect(x + w / 2, y - h * 1.02 - bob, 3 * s, h * .42); }
      c.fillStyle = 'rgba(160,120,255,.45)'; c.fillRect(x - w / 2, y - h * .62 - bob, 1.5, h * .62); c.fillRect(x - h * .17, y - h * .78 - bob, 1.5, h * .2); });
  }
  // Nexi на подіумі за пультом: його власний шар (nexi.js: layer) через «двійника» з координатами вечірки й позою dance — спрайт, скін і настрій ті самі
  function nexiPos() { const Pd = G().podium, [x, y] = pt(774, Pd.y, Pd.z); return { x, y, zoom: PZ.s(Pd.z) }; }
  function drawNexi(c, t) {
    const n = NX.nexi, N = nexiPos(), D = Object.create(n); Object.assign(D, { x: N.x, y: N.y, alpha: 1, zoom: N.zoom, dy: FL, cur: null, queue: [], temp: 'dance', tempT: 1e9, talking: false, hiT: S.hiT || 0, rot: 0, back: false, fxNow: 'none', dir: 1, pose: S.nexiPose || 'dance', temp: S.nexiPose || 'dance' });
    const Lr = D.layer(); c.save(); c.translate(0, 2 * N.y); c.scale(1, -1); c.globalAlpha = .22; Lr.draw(c, t); c.restore();   // відбиток
    Lr.draw(c, t); S.nexiBox = D.box;
  }
  // ============================ ЖИВЕ СВІТЛО Й ДРІБНИЦІ ============================
  function drawTiles(c) {
    const D = G().dance, b = beat(), bi = Math.floor(b), pl = pulse(), cw = (D.x1 - D.x0) / D.cols, rd = (D.z1 - D.z0) / D.rows;
    for (let j = 0; j < D.rows; j++) for (let i = 0; i < D.cols; i++) { const x0 = D.x0 + i * cw, x1 = x0 + cw, z1 = D.z1 - j * rd, z0 = z1 - rd, on = (i + j + bi) % 3 === 0, col = NEON[(i * 3 + j * 5 + Math.floor(b / 4)) % NEON.length];
      poly(c, [fp(x0 + 1.5, z1 - 1.5), fp(x1 - 1.5, z1 - 1.5), fp(x1 - 1.5, z0 + 1.5), fp(x0 + 1.5, z0 + 1.5)]); c.globalAlpha = on ? .5 + .4 * pl : .16; c.fillStyle = col; c.fill(); }
    c.globalAlpha = 1; poly(c, [fp(D.x0 - 4, D.z1 + 4), fp(D.x1 + 4, D.z1 + 4), fp(D.x1 + 4, D.z0 - 4), fp(D.x0 - 4, D.z0 - 4)]); c.strokeStyle = '#3be8ff'; c.lineWidth = 1; c.stroke();
  }
  function drawLights(c, t) {
    const g = G(), pl = pulse(), b = beat(), bi = Math.floor(b);
    c.save(); c.globalCompositeOperation = 'lighter';
    g.lamps.forEach((lp, k) => {                                                                       // прожектори: конус світла з рейки на підлогу, гойдається
      const a = Math.sin(t * .7 + k * 1.9) * 160, zf = 60 + Math.sin(t * .5 + k) * 90, top = pt(lp.x, lp.y + 22, lp.z), A1 = fp(lp.x + a - 70, zf), A2 = fp(lp.x + a + 70, zf), col = NEON[k % 4];
      c.globalAlpha = .13 + .08 * pl; c.fillStyle = col; poly(c, [top, A2, A1]); c.fill(); c.globalAlpha = .18; c.beginPath(); c.ellipse((A1[0] + A2[0]) / 2, A1[1], (A2[0] - A1[0]) / 2, 10 * PZ.s(zf), 0, 0, 7); c.fill(); });
    const B = g.ball, bc = pt(B.x, B.y, B.z);                                                            // дзеркальна куля: плями на підлозі й стінах, блиск
    for (let k = 0; k < 9; k++) { const a = t * .5 + k * .7, u = .5 + Math.cos(a) * .45, v = .5 + Math.sin(a * 1.3) * .45, [x, y] = fp(g.XL + (g.XR - g.XL) * u, g.ZF + (g.ZB - g.ZF) * v), col = NEON[k % NEON.length];
      c.globalAlpha = .12; c.fillStyle = col; c.beginPath(); c.ellipse(x, y, 30 * PZ.s(g.ZF + (g.ZB - g.ZF) * v), 9 * PZ.s(g.ZF + (g.ZB - g.ZF) * v), 0, 0, 7); c.fill();
      const [wx, wy] = pt(g.XL + (g.XR - g.XL) * (.5 + Math.cos(a + 1.1) * .45), g.CEIL + 60 + Math.sin(a * .8) * 100, g.ZB); c.globalAlpha = .08; c.beginPath(); c.ellipse(wx, wy, 18 * PZ.s(g.ZB), 18 * PZ.s(g.ZB), 0, 0, 7); c.fill(); }
    for (let k = 0; k < 10; k++) { const a = t * 2 + k * .63, rr = B.r * PZ.s(B.z); c.globalAlpha = .4 + .6 * Math.abs(Math.sin(t * 9 + k)); R(c, bc[0] + Math.cos(a) * rr * .7, bc[1] + Math.sin(a * 1.7) * rr * .6, 2, 2, '#ffffff'); }
    [[g.XL + 40, 'pink'], [g.XR - 40, 'cyan'], [774 - 200, 'green'], [774 + 200, 'gold']].forEach(([x, cn], i) => {                  // лазери з-під стелі на підлогу
      const a0 = pt(x, g.CEIL + 6, g.ZB - 30), zz = 100 + Math.sin(t * .9 + i * 1.6) * 230, xx = 774 + Math.cos(t * .6 + i) * 500, a1 = fp(xx, zz);
      c.globalAlpha = .3 + .2 * pl; c.strokeStyle = { pink: '#ff4fd8', cyan: '#3be8ff', green: '#3bff8a', gold: '#ffe27a' }[cn]; c.lineWidth = 1.2; c.beginPath(); c.moveTo(a0[0], a0[1]); c.lineTo(a1[0], a1[1]); c.stroke(); });
    c.restore();
    g.bulbs.forEach(([x, y, z], i) => { const col = NEON[(i + bi) % NEON.length], [sx, sy] = pt(x, y, z), s = PZ.s(z); R(c, sx - 1.5 * s, sy - 1.5 * s, 3 * s, 3 * s, col); if ((i + bi) % 2) P.glow(c, sx, sy, 5 * s, col, .5); });   // лампочки гірлянд
    { const Sg = g.sign, s = PZ.s(Sg.z); for (let i = 0; i < 30; i++) { const u = i / 29, on = (i + bi) % 2 === 0, x = Sg.x0 + 6 + (Sg.x1 - Sg.x0 - 12) * u;                                 // лампочки рамки вивіски
      for (const yy of [Sg.y0 + 3, Sg.y1 - 3]) { const [sx, sy] = pt(x, yy, Sg.z - 1); R(c, sx - 1.2, sy - 1.2, 2.4, 2.4, on ? '#ffe27a' : '#6a5a30'); } } }
    g.speakers.forEach(sp => { for (let k = 0; k < 2; k++) { const y0 = FL - (k + 1) * 76; [[y0 + 22, 15], [y0 + 54, 11]].forEach(([cy, r]) => { const [sx, sy] = pt(sp.x, cy, sp.z - 1), s = PZ.s(sp.z), rr = (r * .55 + pl * 3) * s;   // динаміки дихають
        c.fillStyle = '#2a2560'; c.beginPath(); c.arc(sx, sy, rr, 0, 7); c.fill(); c.fillStyle = '#3be8ff'; c.beginPath(); c.arc(sx, sy, rr * .3, 0, 7); c.fill(); }); }
      if (rnd() < .05) { const [sx, sy] = pt(sp.x, FL - 160, sp.z); S.fx.push({ t: 'note', x: sx + (rnd() - .5) * 20, y: sy, vx: (rnd() - .5) * 10, vy: -22, g: 0, col: rnd() < .5 ? '#ff4fd8' : '#3be8ff', ttl: 1.6, age: 0 }); } });
    { const Bt = g.booth, s = PZ.s(Bt.z0); [Bt.x0 + 50, Bt.x1 - 50].forEach(x => { const [sx, sy] = pt(x, Bt.y0 - 1, Bt.z0 + 24), a = t * 5;                       // диски пульта крутяться
        c.fillStyle = '#0a0626'; c.beginPath(); c.ellipse(sx, sy, 17 * s, 6 * s, 0, 0, 7); c.fill(); c.fillStyle = '#2a2560'; c.beginPath(); c.ellipse(sx, sy, 14 * s, 5 * s, 0, 0, 7); c.fill(); R(c, sx + Math.cos(a) * 10 * s - 1, sy + Math.sin(a) * 3.5 * s - 1, 2, 2, '#3be8ff'); R(c, sx - 1, sy - 1, 2, 2, '#ff4fd8'); });
      for (let i = 0; i < 10; i++) { const on = i < 2 + Math.floor(pl * 8), [sx, sy] = pt(774 - 24 + i * 5, Bt.y0 - 1, Bt.z0 + 30); R(c, sx, sy - 1, 3, 2, on ? (i > 7 ? '#ff3b5c' : i > 4 ? '#ffe27a' : '#3bff8a') : '#1e1650'); } }   // еквалайзер
    { const Sn = g.snack, [jx, jy] = pt((Sn.x0 + Sn.x1) / 2 + 34, Sn.y0 - 32, Sn.z0 + 90); if (rnd() < .08) S.fx.push({ t: 'sp', x: jx + (rnd() - .5) * 6, y: jy, vx: 0, vy: -10, g: 0, col: '#ffe27a', ttl: .8, age: 0 }); }   // бульбашки над глечиком соку
  }
  function drawFog(c) {                                                                               // туман над підлогою: смуга в глибині танцполу
    const g = G(), [, y1] = fp(774, g.ZF + 60), [, y0] = fp(774, g.ZB - 60), gr = c.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, 'rgba(120,90,200,0)'); gr.addColorStop(.5, 'rgba(120,90,200,.13)'); gr.addColorStop(1, 'rgba(120,90,200,0)');
    c.fillStyle = gr; c.fillRect(S.x, y0, S.viewW, y1 - y0);
  }
  function drawFx(c, dt) {
    if (rnd() < .35) S.fx.push({ t: 'conf', x: S.x + rnd() * S.viewW, y: S.y - 4, vx: (rnd() - .5) * 10, vy: 24 + rnd() * 20, g: 0, col: NEON[rnd() * 6 | 0], ttl: 14, age: 0, ph: rnd() * 6 });
    S.fx = S.fx.filter(f => (f.age += dt) < f.ttl); S.fx.forEach(f => { f.vy += (f.g || 0) * dt; f.x += f.vx * dt + (f.t === 'conf' ? Math.sin(f.age * 3 + f.ph) * 14 * dt : 0); f.y += f.vy * dt;
      c.globalAlpha = f.t === 'conf' ? .9 : 1 - f.age / f.ttl; if (f.t === 'note') P.text(c, f.age * 4 % 2 < 1 ? '♪' : '♫', f.x, f.y, f.col, 8); else R(c, f.x, f.y, f.t === 'conf' ? 3 : 2, 2, f.col); });
    c.globalAlpha = 1;
  }
  function drawHud(c) {
    const dpr = NX.loop.dpr, vw = innerWidth, vh = innerHeight; c.setTransform(dpr, 0, 0, dpr, 0, 0);
    const vg = c.createRadialGradient(vw / 2, vh / 2, Math.min(vw, vh) * .45, vw / 2, vh / 2, Math.max(vw, vh) * .8); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.55)'); c.fillStyle = vg; c.fillRect(0, 0, vw, vh);   // віньєтка
    const n = S.list.length, total = NX.guests ? NX.guests.IDS.length : 20, s1 = `${NX.t('party.guests')} ${n}/${total}`; c.font = '9px "Press Start 2P", monospace';
    const w1 = c.measureText(s1).width + 18; R(c, 12, 52, w1, 22, '#0a0626dd'); c.strokeStyle = '#ff4fd8'; c.lineWidth = 1; c.strokeRect(12.5, 52.5, w1 - 1, 21); P.text(c, s1, 21, 68, '#ffe27a', 9);
    const s2 = NX.t('party.back'); c.font = '9px "Press Start 2P", monospace'; const w2 = c.measureText(s2).width + 20, bx = vw - 12 - w2, by = vh > vw ? 52 : 14;
    R(c, bx, by, w2, 26, '#0a0626ee'); c.strokeStyle = '#3be8ff'; c.strokeRect(bx + .5, by + .5, w2 - 1, 25); P.text(c, s2, bx + w2 / 2, by + 18, '#3be8ff', 9, 'center'); S.btn = { x: bx, y: by, w: w2, h: 26 };
    if (NX.partyMusic) { const M = NX.partyMusic, s3 = '♪ ' + NX.t('party.sound'), onM = M.playing; c.font = '9px "Press Start 2P", monospace'; const w3 = c.measureText(s3).width + 20, bx3 = bx - 10 - w3;   // кнопка звуку (музика — party_music.js)
      R(c, bx3, by, w3, 26, '#0a0626ee'); c.strokeStyle = onM ? '#ffe27a' : '#5a5a7a'; c.strokeRect(bx3 + .5, by + .5, w3 - 1, 25); P.text(c, s3, bx3 + w3 / 2, by + 18, onM ? '#ffe27a' : '#8a8aa8', 9, 'center'); S.btnM = { x: bx3, y: by, w: w3, h: 26 };
      if (onM) { const bt = beat() % 1; R(c, bx3 + 4, by + 22 - bt * 0, 3, 2, bt < .25 ? '#ffe27a' : '#5a5a7a'); } }
    if (!n) { const k = S.k * dpr; c.setTransform(k, 0, 0, k, -S.x * k, -S.y * k); const txt = NX.t('party.empty'), words = txt.split(' '), lines = []; let cur = ''; c.font = '8px "Press Start 2P", monospace';   // підказка на порожньому танцполі
      words.forEach(w => { const tr = cur ? cur + ' ' + w : w; if (c.measureText(tr).width > Math.min(380, S.viewW - 40) && cur) { lines.push(cur); cur = w; } else cur = tr; }); lines.push(cur);
      const ph = lines.length * 13 + 12, [, y0] = fp(774, 40), hw = Math.min(205, S.viewW / 2 - 12); R(c, 774 - hw, y0, hw * 2, ph, '#0a0626cc'); c.strokeStyle = '#ffe27a'; c.strokeRect(774 - hw + .5, y0 + .5, hw * 2 - 1, ph - 1); lines.forEach((l, i) => P.text(c, l, 774, y0 + 16 + i * 13, '#ffe27a', 8, 'center')); }
  }
  /** Кадр вечірки (core/loop.js віддає сюди, поки on): логіка гостей, малювання шарами, інтерфейс. */
  function frame(c, dt, t) {
    S.list.forEach(g => updGuest(g, dt, t)); director(t); if (S.bub && t > S.bub.until) S.bub = null; prepare();
    const k = S.k * NX.loop.dpr; c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = '#03020a'; c.fillRect(0, 0, NX.loop.canvas.width, NX.loop.canvas.height);
    c.setTransform(k, 0, 0, k, -S.x * k, -S.y * k); c.imageSmoothingEnabled = false;
    c.drawImage(S.bg.cv, S.bg.x0, S.bg.y0);
    drawPoster(c); drawTiles(c); drawFog(c); drawCrowd(c, t); drawLights(c, t); drawNexi(c, t); drawBartender(c, t); drawRudyk(c, t);
    if (S.bub && S.bub.nexi) { const N = nexiPos(); bubble(c, S.bub.text, N.x, N.y - 60, Math.min(1, (S.bub.until - t) * 3)); }
    S.list.slice().sort((a, b) => b.z - a.z).forEach(g => drawGuest(c, g, t));
    drawEvent(c, t); drawFx(c, dt); drawHud(c);
  }
  // ============================ ВХІД, ВИХІД, ДОТИКИ ============================
  function layout() { const V = G().VIEW, vw = innerWidth, vh = innerHeight, VW = V.x1 - V.x0, VH = V.y1 - V.y0; S.k = Math.max(vw / VW, vh / VH); S.viewW = vw / S.k; S.viewH = vh / S.k;
    S.x = clamp(S.x, V.x0, Math.max(V.x0, V.x1 - S.viewW)); const Rr = G().RASTER;
    S.y = vh / VH > vw / VW ? clamp(FL - .6 * S.viewH, Rr.y0, Rr.y1 - S.viewH) : V.y0 - (S.viewH - VH) / 2; }   // телефон: підлога на 60 % висоти; комп'ютер: уся кімната по центру
  const toWorld = (sx, sy) => [sx / S.k + S.x, sy / S.k + S.y];
  function tap(sx, sy) {
    const b = S.btn; if (b && sx >= b.x && sx <= b.x + b.w && sy >= b.y && sy <= b.y + b.h) { close(); return; }
    const bm = S.btnM; if (bm && NX.partyMusic && sx >= bm.x && sx <= bm.x + bm.w && sy >= bm.y && sy <= bm.y + bm.h) { if (NX.partyMusic.toggle()) S.t0 = NX.time; return; }
    const [x, y] = toWorld(sx, sy);
    for (const g of S.list.slice().sort((a, b) => a.z - b.z)) { const [GW, GH, K] = A().size(g.id), s = sc(g.z) * K, w = GW * s * .6, h = GH * s, [gx, gy] = gxy(g), top = gy - g.alt * s - h;
      if (x > gx - w / 2 && x < gx + w / 2 && y > top && y < gy - g.alt * s + 3) { const L = NX.t(`guests.${g.id}.t`) || NX.t(`guests.${g.id}.s`) || []; g.ti = ((g.ti == null ? rnd() * L.length | 0 : g.ti + 1)) % Math.max(1, L.length);
        if (L.length) g.bub = { text: L[g.ti], until: NX.time + 2.8 }; sparks(gx, gy - 30 * s, 6, ['#ff7af0', '#ffffff']); S.fx.push({ t: 'note', x: gx, y: top - 4, vx: 0, vy: -18, g: 0, col: '#ff7af0', ttl: 1.2, age: 0 }); return; } }
    const nb = S.nexiBox; if (nb && x > nb[0] && x < nb[0] + nb[2] && y > nb[1] && y < nb[1] + nb[3]) { const N = nexiPos(); S.hiT = NX.time + 1.6; NX.nexi.emote('love', 2); for (let i = 0; i < 5; i++) S.fx.push({ t: 'note', x: N.x + (rnd() - .5) * 30, y: N.y - 60, vx: (rnd() - .5) * 20, vy: -24, g: 0, col: NEON[i], ttl: 1.4, age: 0 }); }
  }
  const H_ = {
    down(e) { if (!S.on) return; e.stopImmediatePropagation(); S.pointer = { x: e.clientX, y: e.clientY, sx: S.x, moved: false }; },
    move(e) { if (!S.on) return; e.stopImmediatePropagation(); const p = S.pointer; if (!p) return; const dx = e.clientX - p.x; if (Math.abs(dx) > 6) p.moved = true; if (p.moved) { const V = G().VIEW; S.x = clamp(p.sx - dx / S.k, V.x0, Math.max(V.x0, V.x1 - S.viewW)); } },
    up(e) { if (!S.on) return; e.stopImmediatePropagation(); const p = S.pointer; S.pointer = null; if (p && !p.moved) tap(e.clientX, e.clientY); },
    key(e) { if (S.on && e.key === 'Escape') close(); },
  };
  let bound = false;
  function bind() { if (bound) return; bound = true; const cv = NX.loop.canvas; cv.addEventListener('pointerdown', H_.down, true); cv.addEventListener('pointermove', H_.move, true); cv.addEventListener('pointerup', H_.up, true); cv.addEventListener('pointercancel', e => { if (S.on) { e.stopImmediatePropagation(); S.pointer = null; } }, true);
    addEventListener('keydown', H_.key); addEventListener('resize', () => { if (S.on) layout(); }); if (NX.i18n && NX.i18n.onLang) NX.i18n.onLang(() => { S.bg = null; }); }
  /** Відкрити вечірку (кличе сценарій Nexi `party`, коли він зник у вихорі). */
  function open() { bind(); prepare(); S.on = true; S.t0 = NX.time; S.fx = []; S.bub = null; layout(); const V = G().VIEW; S.x = clamp(774 - S.viewW / 2, V.x0, Math.max(V.x0, V.x1 - S.viewW)); roster(); document.body.classList.add('nx-party'); if (NX.input) NX.input.hover = null; if (NX.partyMusic && NX.partyMusic.enabled) NX.partyMusic.on(); }
  /** Закрити (кнопка «← У КІМНАТУ», Esc): сценарій Nexi бачить !on і повертає його на майданчик. */
  function close() { if (!S.on) return; S.on = false; document.body.classList.remove('nx-party'); if (NX.partyMusic) NX.partyMusic.off(); }
  return { open, close, frame, prepare, S, get on() { return S.on; }, roster };
})();
