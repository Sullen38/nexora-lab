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
  const pt = (x, y, z) => PZ.p(x, y, z), fp = (x, z) => PZ.p(x, FL, z), sc = z => NX.cfg.NEXI_SCALE_FAR * PZ.s(z) * 1.15;   // ×1.15 — гостей видно краще (власник, 06.11)   // масштаб спрайта на підлозі в глибині z
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
    const full = NX.guests && NX.guests.full && NX.guests.full() && n >= NX.guests.IDS.length; if (NX.partyShow) { if (full) NX.partyShow.start(SHOW_API); else NX.partyShow.stop(); }   // повна колекція — справжня вечірка (party_show.js)
    S.pair = null; S.event = null; S.eventT = NX.time + 25; CAT.until = 0; S.upNext = 0; S.hockey = null; S.hockeyNext = 0; S.karaoke = null; S.karaokeNext = 0; G().poufs.forEach(p => { p.busy = false; });
  }
  const sparks = (x, y, n, cols) => { for (let i = 0; i < n; i++) S.fx.push({ t: 'sp', x: x + (rnd() - .5) * 30, y: y - rnd() * 30, vx: (rnd() - .5) * 40, vy: -20 - rnd() * 40, g: 60, col: cols[i % cols.length], ttl: .6 + rnd() * .5, age: 0 }); };
  const gxy = g => g.y == null ? fp(g.x, g.z) : pt(g.x, g.y, g.z);                                      // ноги гостя на екрані (g.y — коли не на підлозі: сходи, другий поверх, пуф)
  function updGuest(g, dt, t) {
    const b = beat() + g.ph, bounce = Math.abs(Math.sin(b * Math.PI)); g.ft += dt; if (g.ft > .13) { g.ft = 0; g.fr++; } g.g.nose = 0;
    if (NX.partyShow && NX.partyShow.on && NX.partyShow.upd(g, dt, t)) return;   // справжня вечірка: сцени ведуть героїв
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
    if (g.rest) { const Rs = g.rest; g.alt = 0; g.sx = 1; if (Rs.ph === 'go') { g.pose = 'walk'; g.tx = Rs.x; g.tz = Rs.z; if (step(36)) { Rs.ph = 'sit'; g.dir = -1; } return; }
      if (Rs.ph === 'sit') { g.pose = 'stand'; g.rot = Math.sin(t * .8 + g.ph * 6) * .06; if (rnd() < .025) { const [sx, sy] = gxy(g), s = sc(g.z); S.fx.push({ t: 'note', x: sx + g.dir * 10 * s, y: sy - 52 * s, vx: 6, vy: -12, g: 0, col: '#b48aff', ttl: 1.8, age: 0, z: 1 }); }
        if (t > Rs.until) { Rs.ph = 'back'; const [x, z] = floorXZ(g.u, g.v); g.tx = x; g.tz = z; } return; }
      g.pose = 'walk'; g.rot = 0; if (step(40)) { g.rest = null; g.next = t + 4 + rnd() * 6; } return; }
    if (g.up) { const U = g.up, St = U.st, Bc = G().balcony, sx0 = (St.x0 + St.x1) / 2; g.alt = 0; g.sx = 1; g.rot = 0;                  // другий поверх: до сходів → нагору → гуляє/танцює/спирається на балюстраду → до сходів → униз
      if (U.ph === 'toStairs') { g.pose = 'walk'; g.tx = sx0; g.tz = St.z0 - 24; if (step(44)) { U.ph = 'climb'; U.k = 0; g.dir = St.side < 0 ? 1 : -1; } return; }
      if (U.ph === 'climb' || U.ph === 'descend') { const up = U.ph === 'climb'; U.k = Math.min(1, U.k + dt / 7); const k = up ? U.k : 1 - U.k; g.pose = 'walk'; g.fr = Math.floor(t * 7) % 4; g.x = sx0; g.z = St.z0 + (Bc.z0 - St.z0) * k; g.y = FL - (FL - Bc.y) * k;
        if (U.k >= 1) { if (up) { U.ph = 'balcony'; g.y = Bc.y; g.z = Bc.z0 + 30; U.until = t + 22 + rnd() * 24; g.next = t + 1; } else { g.y = null; g.z = St.z0 - 24; g.up = null; g.mv = true; goto(g.u, g.v); } } return; }
      if (U.ph === 'balcony') { g.y = Bc.y; if (t > U.until) { U.ph = 'toTop'; const Ss = G().stairs; U.st = Ss[rnd() * Ss.length | 0]; g.tx = (U.st.x0 + U.st.x1) / 2; g.tz = Bc.z0 + 30; return; }
        if (U.mv) { g.pose = 'walk'; if (step(40)) U.mv = false; return; }
        if (U.sip) { if (!U.sipT) { g.pose = 'walk'; const M = G().minibar; g.tx = M.x0 + 20 + rnd() * (M.x1 - M.x0 - 40); g.tz = M.z0 - 16; if (step(40)) { U.sipT = t + 2.5; g.dir = 1; } return; } g.pose = 'stand'; if (t > U.sipT) { U.sip = false; U.sipT = 0; g.item = rnd() < .5 ? 'drink' : 'drink2'; g.itemT = t + 20; } return; }   // бере напій на мінібарі
        if (U.photo) { const Ph = G().photo; if (!U.photoT) { g.pose = 'walk'; g.tx = (Ph.x0 + Ph.x1) / 2; g.tz = Ph.z0 - 14; if (step(40)) { U.photoT = t + 2.2; g.dir = 1; } return; } g.pose = 'cheer'; if (t > U.photoT - .4 && !U.flashed) { U.flashed = true; S.boothFlash = t + .35; const [fx, fy] = gxy(g); sparks(fx, fy - 40 * sc(g.z), 10, ['#ffffff', '#ffe27a']); } if (t > U.photoT) { U.photo = false; U.photoT = 0; U.flashed = false; } return; }   // фотобудка нагорі: позує, спалах
        if (t > g.next) { const r2 = rnd(); if (r2 < .25 && !g.item) { U.sip = true; } else if (r2 < .4) { U.photo = true; } else if (r2 < .6) { U.mv = true; g.tx = G().XL + 70 + rnd() * (G().XR - G().XL - 140); g.tz = Bc.z0 + 16 + rnd() * 56; } else { U.lean = t + 5 + rnd() * 5; g.tz = Bc.z0 + 14; } g.next = t + 5 + rnd() * 6; }
        if (U.lean && t < U.lean) { g.pose = 'stand'; g.dir = g.x < 774 ? 1 : -1; return; }                                                   // спирається на балюстраду, дивиться на танцпол
        const hb2 = Math.floor(b * 2); g.pose = Math.floor(b) % 4 === 3 ? 'cheer' : 'walk'; g.fr = hb2 % 4; g.alt = bounce * 4; return; }
      if (U.ph === 'toTop') { g.pose = 'walk'; g.y = Bc.y; if (step(44)) { U.ph = 'descend'; U.k = 0; g.dir = U.st.side < 0 ? -1 : 1; } return; } }
    if (g.sing) { const Sg = g.sing, K = G().karaoke; g.alt = 0; g.sx = 1; g.rot = 0; if (Sg.ph === 'go') { g.pose = 'walk'; g.tx = K.mic.x + 8; g.tz = K.mic.z + 10; if (step(44)) { Sg.ph = 'sing'; g.y = K.y0; g.z = K.mic.z + 10; g.dir = -1; } return; }
      g.y = K.y0; g.pose = Math.floor(b * 2) % 4 === 0 ? 'cheer' : 'stand'; g.rot = Math.sin(b * Math.PI) * .08; g.alt = Math.abs(Math.sin(b * Math.PI)) * 2; if (rnd() < .12) { const [sx, sy] = gxy(g); S.fx.push({ t: 'note', x: sx + (rnd() - .5) * 20, y: sy - 56 * sc(g.z), vx: (rnd() - .5) * 16, vy: -20, g: 0, col: NEON[rnd() * 6 | 0], ttl: 1.6, age: 0 }); } return; }   // співає
    if (g.fan) { const F = g.fan; g.alt = 0; g.sx = 1; g.rot = 0; if (!F.at) { g.pose = 'walk'; g.tx = F.x; g.tz = F.z; if (step(44)) { F.at = true; g.dir = 1; } return; } g.pose = Math.floor(b) % 2 ? 'cheer' : 'stand'; g.alt = Math.abs(Math.sin(b * Math.PI)) * 4; return; }   // слухає й плескає
    if (g.hockey) { const Hk = g.hockey; g.alt = 0; g.sx = 1; g.rot = 0; g.tx = Hk.x; g.tz = Hk.z; if (!Hk.at) { g.pose = 'walk'; if (step(44)) Hk.at = true; return; }
      const Pk = S.hockey && S.hockey.puck; g.dir = Pk ? (Pk.u < .5 ? -1 : 1) : 1; g.pose = Pk && Math.abs(Pk.v - (Hk.end > 0 ? 1 : 0)) < .2 ? 'cheer' : 'stand'; g.alt = Math.abs(Math.sin(b * Math.PI)) * 2; return; }
    if (g.pouf) { const Pf = g.pouf, P2 = Pf.p; g.alt = 0; g.sx = 1;                                                                           // пуф: підходить, сідає (ноги ховає пуф), посидить, іде
      if (Pf.ph === 'go') { g.pose = 'walk'; g.rot = 0; g.tx = P2.x; g.tz = P2.z - P2.r - 8; if (step(40)) { Pf.ph = 'sit'; g.y = FL - P2.h; g.z = P2.z + 2; g.x = P2.x; g.dir = g.x < 774 ? 1 : -1; Pf.until = t + 12 + rnd() * 14; if (!g.item && rnd() < .5) { g.item = rnd() < .5 ? 'drink' : 'drink2'; g.itemT = Pf.until + 3; } } return; }
      if (Pf.ph === 'sit') { g.pose = 'stand'; g.rot = Math.sin(t * .9 + g.ph * 6) * .05; if (t > Pf.until) { Pf.ph = 'leave'; g.y = null; g.z = P2.z - P2.r - 8; P2.busy = false; goto(g.u, g.v); } return; }
      g.pose = 'walk'; g.rot = 0; if (step(40)) { g.pouf = null; g.next = t + 4 + rnd() * 5; } return; }
    if (g.trip) { const T = g.trip; g.alt = 0;                                                        // похід до бару / закусок
      if (T.ph === 'go') { g.pose = 'walk'; if (step(44)) { T.ph = 'wait'; T.t = t + (T.to === 'bar' ? 3.2 : 2.2) + rnd(); g.dir = g.x < 774 ? 1 : -1; if (T.to === 'bar' && !BM.guest) { BM.guest = g; BM.pose = 'shake'; BM.until = t + 1.7; } } return; }
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
    if (t > g.next) { const r = rnd(); if (r < .22 && !g.item) { const bar = rnd() < .55, Bz = bar ? G().bar : G().snack; g.trip = { to: bar ? 'bar' : 'snack', ph: 'go' }; g.tx = Bz.x0 + 24 + rnd() * (Bz.x1 - Bz.x0 - 48); g.tz = Bz.z0 - (bar ? 64 : 30); g.item = null; }
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
  // ---------- світло на спрайтах (06.11): колір сцени на гостях, Nexi, бармені; тінь — від найближчого прожектора ----------
  const LIT = document.createElement('canvas');
  /** Кадр спрайта в світлі точки (x, z): множимо на [r, g, b] від lightAt (тінь у темних кутах, колір прожектора), поверх — м'яке підсвічування. */
  function litFrame(img, x, z, y = FL - 30) {
    const [r, g, b] = NX.partyRoom.lightAt(x, y, z), W = img.width, H = img.height; if (LIT.width !== W || LIT.height !== H) { LIT.width = W; LIT.height = H; } const c = LIT.getContext('2d');
    c.globalCompositeOperation = 'source-over'; c.clearRect(0, 0, W, H); c.drawImage(img, 0, 0); c.globalCompositeOperation = 'multiply'; c.fillStyle = `rgb(${Math.min(255, r * 170) | 0},${Math.min(255, g * 170) | 0},${Math.min(255, b * 170) | 0})`; c.fillRect(0, 0, W, H);
    c.globalCompositeOperation = 'destination-in'; c.drawImage(img, 0, 0); c.globalCompositeOperation = 'source-over'; return LIT;
  }
  /** Тінь гостя: витягнута від найближчого сильного джерела (прожектори з рейки) по підлозі. */
  function shadow(c, x, z, w, alt) {
    const [sx, sy] = fp(x, z), s = PZ.s(z), Ls = NX.partyRoom.LIGHTS; let best = null, bd = 1e9; for (const L of Ls) { if (L.p[1] > 200) continue; const d = Math.hypot(x - L.p[0], z - L.p[2]); if (d < bd) { bd = d; best = L; } }
    const dir = best ? Math.sign(x - best.p[0]) || 1 : 1, len = best ? Math.min(1.6, .6 + bd / 300) : 1, k = Math.max(.3, 1 - alt / 120);
    c.save(); c.fillStyle = 'rgba(0,0,0,.42)'; c.beginPath(); c.ellipse(sx + dir * 6 * s * len, sy + 1, w * .32 * k * len, 3.2 * s * k, 0, 0, 7); c.fill(); c.restore();
  }
  /** Гість: тінь, відбиток у підлозі (перевернутий, тане), спрайт, бабл. */
  function drawGuest(c, g, t) {
    const [GW, GH, K] = A().size(g.id), s = sc(g.z) * K, w = GW * s, h = GH * s, [sx, sy] = gxy(g), alt = g.alt * s, top = sy - alt - h, tq = Math.floor(t * 12) / 12;
    const img0 = A().frame(g.id, g.pose, g.fr, tq, g.g), img = litFrame(img0, g.x, g.z); c.imageSmoothingEnabled = false; if (g.y == null) { drawPool(c, g); shadow(c, g.x, g.z, w, alt); } else { c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(sx, sy + 1, w * .3, 2.5 * PZ.s(g.z), 0, 0, 7); c.fill(); }
    if (g.y == null) { c.save(); c.translate(sx, sy + alt); c.scale(g.dir, -1); c.globalAlpha = .26; c.drawImage(img, -w / 2, -h, w, h); c.restore(); }   // відбиток у глянці (лише на підлозі)
    c.save(); c.translate(sx, sy - alt); if (g.sleep) { c.rotate(g.dir * Math.PI * .5); c.translate(0, 4); } else c.rotate(g.rot || 0); c.scale(g.dir * (g.sx || 1), 1); c.drawImage(img, -w / 2, -h, w, h); c.restore();   // sleep — лежить (справжня вечірка, фінал)
    if (g.item) drawItem(c, g.item, sx + g.dir * 9 * s, sy - alt - 19 * s, s, g.dir);
    if (g.bub && t < g.bub.until) bubble(c, g.bub.text, sx, top - 6 - (g.bub.up ? 36 : 0), Math.min(1, (g.bub.until - t) * 3));
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
  // ============================ СТИЛЬ (06.11: «більше графіки»): VJ-ЕКРАН, LED-МАТРИЦЯ, ГОБО, СВІТЛОВІ КАЛЮЖІ ============================
  const VJ = { cv: document.createElement('canvas'), mode: 0, t0: 0, bars: new Float32Array(32) };
  /** VJ-екран за пультом: 4 режими по 8 с — еквалайзер, хвилі-плазма, рядок «NEXI» з шевронами, кільця в такт; скан-лінії, вінʼєтка. */
  function drawScreen(c, t) {
    const Sc = G().screen, W = 190, H = 63, cv = VJ.cv; if (cv.width !== W) { cv.width = W; cv.height = H; } const x = cv.getContext('2d'), b = beat(), pl = pulse();
    if (t - VJ.t0 > 8) { VJ.t0 = t; VJ.mode = (VJ.mode + 1) % 4; } x.fillStyle = '#05030f'; x.fillRect(0, 0, W, H);
    if (VJ.mode === 0) { for (let i = 0; i < 32; i++) { const tgt = (Math.sin(b * 3 + i * .7) * .5 + .5) * (i % 4 ? .6 : 1) * pl + .1; VJ.bars[i] += (tgt - VJ.bars[i]) * .3; const h = VJ.bars[i] * (H - 6), bx = 3 + i * (W - 6) / 32; for (let y = 0; y < h; y += 3) { x.fillStyle = y > h * .75 ? '#ff3b5c' : y > h * .45 ? '#ffe27a' : '#3bff8a'; x.fillRect(bx, H - 3 - y, (W - 6) / 32 - 1.5, 2); } } }
    else if (VJ.mode === 1) { for (let k = 0; k < 4; k++) { x.strokeStyle = ['#ff4fd8', '#3be8ff', '#b48aff', '#ffe27a'][k]; x.lineWidth = 1.5; x.beginPath(); for (let px = 0; px <= W; px += 3) { const y = H / 2 + Math.sin(px * .05 + t * (1.5 + k * .4) + k) * (10 + k * 4) * (.6 + pl * .4) + Math.sin(px * .11 - t * 2) * 4; px ? x.lineTo(px, y) : x.moveTo(px, y); } x.stroke(); } }
    else if (VJ.mode === 2) { const txt = 'N E X I ★ ' + NX.t('party.dj') + ' ★ '; x.font = '16px "Press Start 2P", monospace'; const tw = x.measureText(txt).width, off = (t * 60) % tw; x.fillStyle = '#ff4fd8'; x.textBaseline = 'middle'; for (let k = -1; k < 3; k++) x.fillText(txt, k * tw - off, H / 2); x.fillStyle = '#3be8ff'; for (let i = 0; i < 12; i++) { const cx = ((i * 20 + t * 40) % (W + 20)) - 10, yy = (i % 2 ? 8 : H - 8); x.fillRect(cx, yy - 1, 6, 2); x.fillRect(cx + 4, yy - 3, 2, 6); } }
    else { for (let k = 0; k < 5; k++) { const r = ((b * .5 + k * .2) % 1) * 70; x.strokeStyle = NEON[(k + Math.floor(b / 4)) % 6]; x.lineWidth = 2; x.globalAlpha = 1 - r / 70; x.beginPath(); x.ellipse(W / 2, H / 2, r * 1.6, r * .6, 0, 0, 7); x.stroke(); } x.globalAlpha = 1; x.fillStyle = '#ffffff'; x.fillRect(W / 2 - 1, H / 2 - 1, 2, 2); }
    x.fillStyle = 'rgba(0,0,0,.35)'; for (let y = 0; y < H; y += 2) x.fillRect(0, y, W, 1); const vg = x.createRadialGradient(W / 2, H / 2, 20, W / 2, H / 2, W * .7); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.6)'); x.fillStyle = vg; x.fillRect(0, 0, W, H);
    const [ax, ay] = pt(Sc.x0, Sc.y0, Sc.z), [bx, by] = pt(Sc.x1, Sc.y1, Sc.z); c.imageSmoothingEnabled = false; c.drawImage(cv, ax, ay, bx - ax, by - ay); c.globalCompositeOperation = 'lighter'; c.globalAlpha = .12 + pl * .08; c.fillStyle = NEON[VJ.mode]; c.fillRect(ax - 6, ay - 6, bx - ax + 12, by - ay + 12); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
  }
  /** LED-матриця на передній панелі пульта: 24×4 точок, біжучі хвилі в такт. */
  function drawLed(c, t) {
    const Bt = G().booth, b = beat(), cols = 24, rows = 4, s = PZ.s(Bt.z0); for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { const on = Math.sin(i * .6 - b * 3 + j * .9) > .3, [sx, sy] = pt(Bt.x0 + 10 + (i + .5) * (Bt.x1 - Bt.x0 - 20) / cols, Bt.led.y0 + (j + .5) * (Bt.led.y1 - Bt.led.y0) / rows, Bt.z0 - .5); R(c, sx - 1.5 * s, sy - 1.5 * s, 3 * s, 3 * s, on ? NEON[(i + j + Math.floor(b / 2)) % 6] : '#1a1446'); }
  }
  /** Гобо-прожектори на рейці: віяло з 6 тонких променів, що обертаються, і візерунок плям на підлозі. */
  function drawGobos(c, t) {
    const g = G(); c.save(); c.globalCompositeOperation = 'lighter'; g.gobos.forEach((x, k) => { const src = pt(x, g.CEIL + 16, 150), col = ['#3be8ff', '#ff4fd8', '#ffe27a'][k], a0 = t * (.6 + k * .2) * (k % 2 ? -1 : 1);
      for (let i = 0; i < 6; i++) { const a = a0 + i * Math.PI / 3, fx = x + Math.cos(a) * 170, fz = 60 + Math.sin(a) * 110, [px, py] = fp(fx, fz); c.globalAlpha = .16; c.strokeStyle = col; c.lineWidth = 1.5; c.beginPath(); c.moveTo(src[0], src[1]); c.lineTo(px, py); c.stroke(); c.globalAlpha = .22; c.fillStyle = col; c.beginPath(); c.ellipse(px, py, 12 * PZ.s(fz), 4 * PZ.s(fz), 0, 0, 7); c.fill(); } }); c.restore();
  }
  /** Світлова «калюжа» під гостем — колір від найближчого прожектора, пульсує в такт. */
  function drawPool(c, g) { const [sx, sy] = gxy(g), s = sc(g.z), col = NEON[(Math.floor((g.x - 400) / 180) + Math.floor(beat() / 8) + 6) % 6]; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = .14 + pulse() * .1; c.fillStyle = col; c.beginPath(); c.ellipse(sx, sy + 1, 26 * s, 8 * s, 0, 0, 7); c.fill(); c.restore(); }
  /** Режисер вечірки (кроки 4–6): пари танцюристів, «ура» від Nexi, Рудик на колонці, події раз на ~35 с. */
  function director(t) {
    if (NX.partyShow && NX.partyShow.on) { NX.partyShow.tick(t, S.dt || .016); if (S.bub && t > S.bub.until) S.bub = null; return; }
    const idle = S.list.filter(g => !g.trip && !g.mv && !g.fly && !g.up && !g.pouf && !g.rest && !g.conga && !g.photo && !g.hockey && !g.sing && !g.fan && g.id !== 'kolobok' && g.id !== 'cheshire' && !(g.pairT && t < g.pairT) && t > g.spT);
    if (S.hockey && t > S.hockey.until) { S.hockey.a.hockey = S.hockey.b.hockey = null; S.hockey.a.next = S.hockey.b.next = t + 3; S.hockey = null; }
    if (!S.hockey && !S.hockeyNext) S.hockeyNext = t + 20 + rnd() * 20;
    if (!S.hockey && t > S.hockeyNext && idle.length >= 2 && !S.event) { S.hockeyNext = 0; const a = idle[rnd() * idle.length | 0], bq = idle.filter(g => g !== a), b = bq[rnd() * bq.length | 0], H = G().hockey, cx = (H.x0 + H.x1) / 2;   // аерохокей: двоє йдуть до столу й грають
      a.hockey = { x: cx, z: H.z1 + 14, dir: -1, end: 1 }; b.hockey = { x: cx, z: H.z0 - 14, dir: 1, end: -1 }; a.mv = b.mv = false; S.hockey = { a, b, until: t + 18, puck: { u: .5, v: .5, vu: .3, vv: .45 }, score: [0, 0] }; }
    if (S.karaoke && t > S.karaoke.until) { S.karaoke.singer.sing = null; S.karaoke.singer.y = null; S.karaoke.singer.z = G().karaoke.z0 - 20; S.karaoke.singer.next = t + 3; S.karaoke.fans.forEach(f => { f.fan = null; f.next = t + 2; }); S.karaoke = null; }
    if (!S.karaoke && !S.karaokeNext) S.karaokeNext = t + 30 + rnd() * 30;
    if (!S.karaoke && t > S.karaokeNext && idle.length >= 2 && !S.event) { S.karaokeNext = 0; const K = G().karaoke, singer = idle[rnd() * idle.length | 0], fans = idle.filter(g => g !== singer).slice(0, 3);   // караоке: співак до мікрофона, 2–3 слухачі перед сценою плескають
      singer.sing = { ph: 'go' }; singer.mv = false; fans.forEach((f, i) => { f.fan = { x: K.x0 + 20 + i * 40, z: K.z0 - 40 - (i % 2) * 20, at: false }; f.mv = false; }); S.karaoke = { singer, fans, until: t + 18, t0: t }; }
    if (!S.upNext) S.upNext = t + 6; if (t > S.upNext && !S.event) { S.upNext = t + 10 + rnd() * 10; const ups = S.list.filter(g => g.up).length, sits = S.list.filter(g => g.pouf).length;   // час від часу хтось іде на другий поверх або сідає на пуф
      if (idle.length && rnd() < .55 && ups < 5) { const g = idle[rnd() * idle.length | 0], Ss = G().stairs; g.up = { ph: 'toStairs', st: Ss[rnd() * Ss.length | 0] }; g.mv = false; g.item = null; }
      else if (idle.length && sits < 5) { const free = G().poufs.filter(p => !p.busy); if (free.length) { const g = idle[rnd() * idle.length | 0], p = free[rnd() * free.length | 0]; p.busy = true; g.pouf = { ph: 'go', p }; g.mv = false; } } }
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
    const age = t - S.t0;
    if (t > CAT.until) { if (age > 150 && CAT.pose !== 'meow') { CAT.pose = 'sleep'; CAT.until = t + 30; } else { CAT.pose = CAT.pose === 'sit' && rnd() < .35 ? 'paw' : CAT.pose === 'sit' && rnd() < .2 ? 'groom' : 'sit'; CAT.until = t + (CAT.pose === 'sit' ? 4 + rnd() * 6 : 1.6); } }   // пізно — Рудик засинає
    if (age > 120 && !S.event && !S.restNext) S.restNext = t + 5;                                      // пізно ввечері: гості по черзі йдуть перепочити на диванчик
    if (S.restNext && t > S.restNext && !S.event) { S.restNext = t + 14 + rnd() * 10; const free = idle.filter(g => !g.rest && !g.item); const n = S.list.filter(g => g.rest).length; if (free.length && n < 2) { const g = free[rnd() * free.length | 0], So = G().sofa; g.rest = { x: So.x0 - 26, z: So.z0 + 24 + n * 50, ph: 'go', until: t + 14 + rnd() * 8 }; g.mv = false; g.trip = null; } }   // Рудик: сидить, б'є лапкою конфеті, вмивається
    if (!S.event && t > S.eventT) { const kinds = ['spot', 'strobe', 'fire', 'conga', 'photo', 'solo', 'foam', 'smoke', 'foam', 'smoke']; const kind = kinds[rnd() * kinds.length | 0]; S.event = { kind, t0: t, until: t + (kind === 'conga' ? 14 : kind === 'photo' ? 9 : kind === 'solo' ? 11 : kind === 'foam' ? 16 : kind === 'smoke' ? 10 : rnd() < .5 ? 6 : 5) };
      if (kind === 'foam') { S.foam = []; S.list.forEach(g => { if (!g.trip && !g.fly) g.cheerT = t + 2; }); }
      if (kind === 'solo') { S.event.label = NX.t('party.solo'); S.solo = { k: 0, z: 40 }; S.list.forEach(g => { if (!g.trip) g.next = Math.max(g.next, t + 11); }); } S.eventT = t + 30 + rnd() * 20;   // події
      if (S.event.kind === 'spot') { const cand = S.list.filter(g => !g.trip && !g.fly); S.event.g = cand[rnd() * cand.length | 0] || null; S.list.forEach(g => { if (g !== S.event.g && !g.trip) g.cheerT = t + 2.5; }); } }
    if (S.event && S.event.kind === 'conga' && !S.event.set) { S.event.set = true; const free = idle.slice(0, 7); if (free.length >= 3) { const D = G().dance; S.event.line = free; free.forEach((g, i) => { g.conga = { prev: i ? free[i - 1] : null, idx: 0 }; g.trip = null; g.mv = false; }); S.event.route = [[.12, .15], [.88, .15], [.88, .85], [.12, .85]]; S.event.label = NX.t('party.conga'); } else S.event = null; }   // конга: 3–7 гостей ланцюжком по колу танцполу
    if (S.event && S.event.kind === 'photo' && !S.event.set) { S.event.set = true; const free = idle.slice(0, 9); if (free.length >= 2) { S.event.line = free; free.forEach((g, i) => { const [x, z] = floorXZ(.5 + (i - (free.length - 1) / 2) * .11, i % 2 ? .12 : .02); g.photo = { x, z, dir: i < free.length / 2 ? 1 : -1 }; g.trip = null; g.mv = false; }); S.event.flashT = t + 5; S.event.label = NX.t('party.photo'); } else S.event = null; }   // фото біля пульта: стають у ряд, «ура», спалах
    if (S.solo) { const E = S.event, el = E ? t - E.t0 : 99, k = el < 1 ? el : el > 10 ? Math.max(0, 11 - el) : 1; S.solo.k = k;   // соло Nexi: 1 с стрибок униз, 9 с танець у центрі, 1 с назад
      if (el >= 1 && !S.solo.landed) { S.solo.landed = true; S.list.forEach(g => { if (!g.trip && !g.fly) g.cheerT = t + 2; }); const [fx, fy] = fp(774, S.solo.z); sparks(fx, fy, 12, NEON); } if (!E || el > 11) S.solo = null; }
    if (S.event && t > S.event.until) { (S.event.line || []).forEach(g => { g.conga = null; g.photo = null; g.next = t + 2 + rnd() * 4; }); S.event = null; }
    if (S.event && S.event.kind === 'fire' && rnd() < .25) { const x = 774 + (rnd() - .5) * 700, [sx, sy] = pt(x, 90 + rnd() * 80, G().ZB - 20), col = NEON[rnd() * 6 | 0]; for (let i = 0; i < 14; i++) { const a = i / 14 * 6.283; S.fx.push({ t: 'sp', x: sx, y: sy, vx: Math.cos(a) * 45, vy: Math.sin(a) * 45, g: 30, col, ttl: .9, age: 0 }); } }   // салют за пультом
  }
  /** Події поверх: прожектор на найкращого танцюриста з підписом, строб. */
  function drawEvent(c, t) {
    const E = S.event; if (!E) return;
    if (E.kind === 'spot' && E.g) { const g = E.g, [sx, sy] = gxy(g), s = sc(g.z), top = pt(774, G().CEIL + 20, 150); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = .22; c.fillStyle = '#ffffff'; poly(c, [top, [sx - 40 * s, sy + 6], [sx + 40 * s, sy + 6]]); c.fill(); c.globalAlpha = .3; c.beginPath(); c.ellipse(sx, sy + 2, 44 * s, 12 * s, 0, 0, 7); c.fill(); c.restore();
      const lab = NX.t('party.best'); c.font = '8px "Press Start 2P", monospace'; const w = c.measureText(lab).width + 14, y = sy - 78 * s; R(c, sx - w / 2, y - 7, w, 14, '#0a0626ee'); c.strokeStyle = '#ffe27a'; c.lineWidth = 1; c.strokeRect(sx - w / 2 + .5, y - 6.5, w - 1, 13); P.text(c, lab, sx, y + 3, '#ffe27a', 8, 'center');
      if (rnd() < .3) sparks(sx + (rnd() - .5) * 60 * s, sy - 20 * s, 1, ['#ffe27a', '#ffffff']); }
    if (E.label) { const [lx, ly] = pt(774, G().screen.y0 - 16, G().ZB - 8); c.font = '9px "Press Start 2P", monospace'; const w = c.measureText(E.label).width + 16; R(c, lx - w / 2, ly - 8, w, 16, '#0a0626ee'); c.strokeStyle = '#ff7af0'; c.lineWidth = 1; c.strokeRect(lx - w / 2 + .5, ly - 7.5, w - 1, 15); P.text(c, E.label, lx, ly + 3.5, '#ff9af0', 9, 'center'); }
    if (E.kind === 'photo' && t > E.flashT && t < E.flashT + .5) { c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = (E.flashT + .5 - t) * 1.6; c.fillStyle = '#ffffff'; c.fillRect(0, 0, NX.loop.canvas.width, NX.loop.canvas.height); c.restore(); if (!E.flashed) { E.flashed = true; (E.line || []).forEach(g => { g.cheerT = t + 2.5; }); for (let i = 0; i < 20; i++) sparks(774 + (rnd() - .5) * 400, fp(774, 60)[1] - 40, 1, ['#ffffff', '#ffe27a']); } }
    if (E.kind === 'solo' && S.solo && S.solo.k >= 1) { const N = nexiPos(), top = pt(774, G().CEIL + 20, 150); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = .2; c.fillStyle = '#ffffff'; poly(c, [top, [N.x - 50, N.y + 4], [N.x + 50, N.y + 4]]); c.fill(); c.globalAlpha = .3; c.beginPath(); c.ellipse(N.x, N.y + 2, 54, 14, 0, 0, 7); c.fill(); c.restore(); if (rnd() < .4) sparks(N.x + (rnd() - .5) * 80, N.y - 30, 1, NEON); }
    if (E.kind === 'foam') { const el = t - E.t0; G().foam.forEach(({ x, z }, k) => { if (el > 12) return; const d = k ? -1 : 1, [sx, sy] = pt(x + d * 36, 257, z + 42); for (let i = 0; i < 2; i++) S.fx.push({ t: 'foam', x: sx, y: sy, vx: d * (90 + rnd() * 120), vy: -120 - rnd() * 60, g: 160, col: ['#ffffff', '#e8f6ff', '#fff0fa'][rnd() * 3 | 0], ttl: 2.2, age: 0, r: 3 + rnd() * 4, fz: -60 + rnd() * 200 }); }); }
    if (E.kind === 'smoke') { const el = t - E.t0; if (el < 6) G().smoke.forEach(({ x, z }) => { const [sx, sy] = pt(x, FL - 14, z - 14); if (rnd() < .6) S.fx.push({ t: 'smoke', x: sx + (rnd() - .5) * 30, y: sy, vx: (x < 774 ? 1 : -1) * (25 + rnd() * 35), vy: -1 - rnd() * 3, g: -.5, col: rnd() < .5 ? '#a89ad8' : '#8a7ac0', ttl: 4 + rnd() * 3, age: 0, r: 7 + rnd() * 9 }); }); }
    if ((E.kind === 'strobe' || E.kind === 'solo') && t - E.t0 < 2.5 && G().co2) G().co2.forEach(({ x, y, z, d }) => { const [sx, sy] = pt(x, y, z); for (let i = 0; i < 3; i++) S.fx.push({ t: 'smoke', x: sx, y: sy, vx: d * (40 + rnd() * 60), vy: -140 - rnd() * 80, g: 60, col: '#e8f4ff', ttl: 1.1, age: 0, r: 4 + rnd() * 5 }); });   // CO2-гармати на дроп
    if (E.kind === 'strobe' && Math.floor(t * 8) % 2 === 0) { c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = .18; c.fillStyle = '#ffffff'; c.fillRect(0, 0, NX.loop.canvas.width, NX.loop.canvas.height); c.restore(); }
  }
  /** Рудик на лівій колонці: сидить і киває в такт; б'є лапкою по конфеті; вмивається. */
  function drawRudyk(c, t) {
    const drawCat_ = window.drawCat; if (typeof drawCat_ !== 'function') return; const Ct = G().cat, s = sc(Ct.z) * .62, [sx, sy] = pt(Ct.x, Ct.y, Ct.z), bob = Math.abs(Math.sin(beat() * Math.PI)) * 2 * s;
    drawCat_(CAT.pose, Math.floor(t * 6) % 4, t, CAT.cv, null, null); c.save(); c.imageSmoothingEnabled = false; c.translate(sx, sy - bob); c.scale(-1, 1); c.drawImage(CAT.cv, -16 * s, -24 * s, 32 * s, 24 * s); c.restore(); S.catBox = [sx - 16 * s, sy - 24 * s, 32 * s, 24 * s];
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
        x.save(); x.beginPath(); x.rect(cx - cw / 2 + 3, cy + 1, cw - 6, ch - 5); x.clip(); if (got) x.drawImage(img, cx - sw / 2, cy + ch - 4 - sh, sw, sh); else { x.globalAlpha = .85; x.filter = 'brightness(0)'; x.drawImage(img, cx - sw / 2, cy + ch - 4 - sh, sw, sh); } x.restore(); }); }
    const [px0, py0] = pt(Po.x0 + 4, Po.y0 + 4, G().ZB - 4.5), [px1, py1] = pt(Po.x1 - 4, Po.y1 - 4, G().ZB - 4.5); c.imageSmoothingEnabled = true; c.drawImage(POSTER, px0, py0, px1 - px0, py1 - py0); c.imageSmoothingEnabled = false;
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = .08 + pulse() * .06; c.fillStyle = '#c86aff'; c.fillRect(px0 - 4, py0 - 4, px1 - px0 + 8, py1 - py0 + 8); c.globalAlpha = .25; c.fillStyle = '#000'; c.globalCompositeOperation = 'source-over'; for (let y = py0; y < py1; y += 2) c.fillRect(px0, y, px1 - px0, .6); c.restore();   // голо-світіння й скан-лінії
  }
  /** Велика картка колекції (тап по афіші): спіймані — портрет і ім'я, не спіймані — темний силует БЕЗ підпису (власник, 06.11:
   *  «герої, яких не відкрито, не мають бути підписані — тільки темний силует; відкривати їх можна лише у великій кімнаті»). */
  /** Бармен за стійкою: протирає келихи; гість підійшов — шейкер, потім наливає й віддає келих. Після нього поверх — грані стійки з растра. */
  function drawBartender(c, t) {
    const Bm = G().barman, Br = G().bar, s = sc(Bm.z) * .95, [GW, GH] = A().size('bartender'), w = GW * s, h = GH * s, [sx, sy] = pt(Bm.x, Bm.y, Bm.z);   // бармен на підвищенні за стійкою, трохи більший
    if (BM.guest && t > BM.until) { if (BM.pose === 'shake') { BM.pose = 'pour'; BM.until = t + 1.5; } else if (BM.pose === 'pour') { BM.guest.item = rnd() < .5 ? 'drink' : 'drink2'; BM.guest = null; BM.pose = 'wipe'; const L = NX.t('party.barman') || []; if (L.length) BM.bub = { text: L[rnd() * L.length | 0], until: t + 2.8 }; } }
    else if (!BM.guest && BM.pose !== 'wipe' && BM.pose !== 'stand') BM.pose = 'wipe';
    if (!BM.guest && t > BM.until) { BM.pose = rnd() < .7 ? 'wipe' : 'stand'; BM.until = t + 3 + rnd() * 4; }
    const img = litFrame(A().frame('bartender', BM.pose, 0, Math.floor(t * 12) / 12, {}), Bm.x, Bm.z - 30, 320); c.save(); c.imageSmoothingEnabled = false; c.translate(sx, 0); c.scale(BM.guest && BM.guest.x < Bm.x ? -1 : 1, 1); c.drawImage(img, -w / 2, sy - h, w, h); c.restore(); S.barBox = [sx - w / 2, sy - h, w, h * .6];
    if (BM.bub && t < BM.bub.until) bubble(c, BM.bub.text, sx, sy - h - 4, Math.min(1, (BM.bub.until - t) * 3));
    const y0 = Br.y0 - 3, q = [[Br.x0, y0, Br.z0], [Br.x1, y0, Br.z0], [Br.x1, FL, Br.z0], [Br.x0, FL, Br.z0], [Br.x0, y0, Br.z0], [Br.x1, y0, Br.z0], [Br.x1, y0, Br.z1], [Br.x0, y0, Br.z1], [Br.x0, y0, Br.z0], [Br.x0, y0, Br.z1], [Br.x0, FL, Br.z1], [Br.x0, FL, Br.z0], [Br.x1, y0, Br.z0], [Br.x1, y0, Br.z1], [Br.x1, FL, Br.z1], [Br.x1, FL, Br.z0]];
    c.save(); c.beginPath(); for (let k = 0; k < 4; k++) { const P4 = q.slice(k * 4, k * 4 + 4).map(p => pt(...p)); c.moveTo(P4[0][0], P4[0][1]); for (let m = 1; m < 4; m++) c.lineTo(P4[m][0], P4[m][1]); c.closePath(); } c.clip(); c.drawImage(S.bg.cv, S.bg.x0, S.bg.y0); c.restore();
  }
  /** Натовп-тло: темні силуети обабіч пульта хитаються в такт, дехто підіймає руки. */
  function drawCrowd(c, t) {
    const b = beat(); G().crowd.forEach((p, i) => { const s = PZ.s(p.z), [x, y] = fp(p.x, p.z), bob = Math.abs(Math.sin((b + p.ph) * Math.PI)) * 4 * s, h = p.h * s, w = p.w * s, up = Math.sin(t * .7 + p.ph * 3) > .55;
      c.fillStyle = 'rgba(34,24,82,.92)'; c.beginPath(); c.roundRect(x - w / 2, y - h * .62 - bob, w, h * .62 + bob, 3 * s); c.fill(); c.beginPath(); c.arc(x, y - h * .78 - bob, h * .17, 0, 7); c.fill();
      if (up) { c.fillRect(x - w / 2 - 3 * s, y - h * 1.05 - bob, 3 * s, h * .45); c.fillRect(x + w / 2, y - h * 1.02 - bob, 3 * s, h * .42); }
      c.fillStyle = 'rgba(160,120,255,.45)'; c.fillRect(x - w / 2, y - h * .62 - bob, 1.5, h * .62); c.fillRect(x - h * .17, y - h * .78 - bob, 1.5, h * .2); });
  }
  // Nexi на подіумі за пультом: його власний шар (nexi.js: layer) через «двійника» з координатами вечірки й позою dance — спрайт, скін і настрій ті самі
  function nexiPos() { const Pd = G().podium, So = S.solo;
    if (So) { const k = So.k, z = Pd.z + (So.z - Pd.z) * k, yw = Pd.y + (FL - Pd.y) * k - Math.sin(k * Math.PI) * 40, [x, y] = pt(774, yw, z); return { x, y, zoom: PZ.s(z), feet: fp(774, z) }; }   // соло: зіскочив з подіуму на танцпол
    const [x, y] = pt(774, Pd.y, Pd.z); return { x, y, zoom: PZ.s(Pd.z) }; }
  function drawNexi(c, t) {
    const n = NX.nexi, N = nexiPos(), D = Object.create(n); Object.assign(D, { x: N.x, y: N.y, alpha: 1, zoom: N.zoom, dy: FL, cur: null, queue: [], temp: 'dance', tempT: 1e9, talking: false, hiT: S.hiT || 0, rot: 0, back: false, fxNow: 'none', dir: 1, pose: S.nexiSleep ? 'sleep' : S.solo && S.solo.k < 1 ? 'cheer' : (S.nexiPose || 'dance'), temp: S.nexiSleep ? 'sleep' : S.solo && S.solo.k < 1 ? 'cheer' : (S.nexiPose || 'dance') });
    const Lr = D.layer(); c.save(); c.translate(0, 2 * N.y); c.scale(1, -1); c.globalAlpha = .22; Lr.draw(c, t); c.restore();   // відбиток
    Lr.draw(c, t); S.nexiBox = D.box;
  }
  // ============================ ЖИВЕ СВІТЛО Й ДРІБНИЦІ ============================
  function drawTiles(c) {
    const D = G().dance, b = beat(), bi = Math.floor(b), pl = pulse(), cw = (D.x1 - D.x0) / D.cols, rd = (D.z1 - D.z0) / D.rows;
    for (let j = 0; j < D.rows; j++) for (let i = 0; i < D.cols; i++) { const x0 = D.x0 + i * cw, x1 = x0 + cw, z1 = D.z1 - j * rd, z0 = z1 - rd, on = (i + j + bi) % 3 === 0, col = NEON[(i * 3 + j * 5 + Math.floor(b / 4)) % NEON.length];
      poly(c, [fp(x0 + 1.5, z1 - 1.5), fp(x1 - 1.5, z1 - 1.5), fp(x1 - 1.5, z0 + 1.5), fp(x0 + 1.5, z0 + 1.5)]); c.globalAlpha = on ? .5 + .4 * pl : .16; c.fillStyle = col; c.fill(); }
    c.globalAlpha = 1; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = .5 + pl * .4; c.strokeStyle = '#3be8ff'; c.lineWidth = 1.5; for (let i = 0; i <= D.cols; i++) { const x = D.x0 + i * cw; c.beginPath(); c.moveTo(...fp(x, D.z1)); c.lineTo(...fp(x, D.z0)); c.stroke(); } for (let j = 0; j <= D.rows; j++) { const z = D.z1 - j * rd; c.beginPath(); c.moveTo(...fp(D.x0, z)); c.lineTo(...fp(D.x1, z)); c.stroke(); } c.restore();   // LED-сітка танцполу
    poly(c, [fp(D.x0 - 4, D.z1 + 4), fp(D.x1 + 4, D.z1 + 4), fp(D.x1 + 4, D.z0 - 4), fp(D.x0 - 4, D.z0 - 4)]); c.strokeStyle = '#3be8ff'; c.lineWidth = 1; c.stroke();
  }
  function drawLights(c, t) {
    const g = G(), pl = pulse(), b = beat(), bi = Math.floor(b);
    c.save(); c.globalCompositeOperation = 'lighter';
    g.lamps.forEach((lp, k) => {                                                                       // moving-head прожектори (план 4): пан і тілт, промінь падає на підлогу або на стіну
      const pan = Math.sin(t * .45 + k * 1.9) * 420, tilt = Math.sin(t * .31 + k * .8), onWall = tilt > .45, col = NEON[k % 4];
      const top = pt(lp.x, lp.y + 22, lp.z); let A1, A2, spot;
      if (onWall) { const wy = 80 + (1 - tilt) * 300, wx = lp.x + pan; A1 = pt(wx - 60, wy + 40, g.ZB - 1); A2 = pt(wx + 60, wy + 40, g.ZB - 1); spot = [pt(wx, wy, g.ZB - 1), 60 * PZ.s(g.ZB), 60 * PZ.s(g.ZB)]; }
      else { const zf = 40 + tilt * 160, fx = lp.x + pan; A1 = fp(fx - 70, zf); A2 = fp(fx + 70, zf); spot = [fp(fx, zf), 70 * PZ.s(zf), 22 * PZ.s(zf)]; }
      c.globalAlpha = .12 + .08 * pl; c.fillStyle = col; poly(c, [top, A2, A1]); c.fill(); c.globalAlpha = .2; c.beginPath(); c.ellipse(spot[0][0], spot[0][1], spot[1], spot[2], 0, 0, 7); c.fill();
      for (let i = 0; i < 6; i++) { const u = ((t * .25 + i * .17 + k * .1) % 1), x = top[0] + (spot[0][0] - top[0]) * u + Math.sin(t * 2 + i) * 6 * u, y = top[1] + (spot[0][1] - top[1]) * u; c.globalAlpha = .35 * u; R(c, x, y, 1.5, 1.5, '#ffffff'); }   // пил у промені
      S.heads = S.heads || []; S.heads[k] = { col, spot: spot[0], r: spot[1], wall: onWall }; });
    { const b2 = beat(); if (Math.floor(b2) % 16 === 0) for (let k = 0; k < 2; k++) { const a0 = pt(774 + (k ? 300 : -300), g.CEIL + 10, g.ZB - 20); for (let i = -5; i <= 5; i++) { const a1 = fp(774 + (k ? -1 : 1) * 200 + i * 60 + Math.sin(t * 3) * 40, 60 + i * 15); c.globalAlpha = .18; c.strokeStyle = k ? '#3bff8a' : '#3be8ff'; c.lineWidth = 1; c.beginPath(); c.moveTo(a0[0], a0[1]); c.lineTo(a1[0], a1[1]); c.stroke(); } } }   // лазерне віяло-сітка кожні 16 тактів
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
    { const B2 = g.bar, [tx, ty] = pt(B2.x0 + 32 + (rnd() * 3 | 0) * 10, B2.y0 - 36, B2.z0 + 6); if (rnd() < .06) S.fx.push({ t: 'sp', x: tx, y: ty + 2, vx: 0, vy: 18, g: 40, col: '#ffe27a', ttl: .5, age: 0 }); }   // крапля з пивного крана    { const B2 = g.bar, [ax, ay] = pt(B2.x0 - 6, B2.back.y0, B2.back.z0 - 1), [bx2, by2] = pt(B2.x1 + 6, 330, B2.back.z0 - 1); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = .1 + pl * .05; c.fillStyle = NEON[Math.floor(b / 8) % 6]; c.fillRect(Math.min(ax, bx2), ay, Math.abs(bx2 - ax), by2 - ay); c.restore(); }   // підсвітка вітрини міняє колір
    g.speakers.forEach(sp => { for (let k = 0; k < 2; k++) { const y0 = FL - (k + 1) * 76; [[y0 + 22, 15], [y0 + 54, 11]].forEach(([cy, r]) => { const [sx, sy] = pt(sp.x, cy, sp.z - 1), s = PZ.s(sp.z), rr = (r * .55 + pl * 3) * s;   // динаміки дихають
        c.fillStyle = '#2a2560'; c.beginPath(); c.arc(sx, sy, rr, 0, 7); c.fill(); c.fillStyle = '#3be8ff'; c.beginPath(); c.arc(sx, sy, rr * .3, 0, 7); c.fill(); }); }
      if (rnd() < .05) { const [sx, sy] = pt(sp.x, FL - 160, sp.z); S.fx.push({ t: 'note', x: sx + (rnd() - .5) * 20, y: sy, vx: (rnd() - .5) * 10, vy: -22, g: 0, col: rnd() < .5 ? '#ff4fd8' : '#3be8ff', ttl: 1.6, age: 0 }); } });
    { const Bt = g.booth, s = PZ.s(Bt.z0); [Bt.x0 + 50, Bt.x1 - 50].forEach(x => { const [sx, sy] = pt(x, Bt.y0 - 1, Bt.z0 + 24), a = t * 5;                       // диски пульта крутяться
        c.fillStyle = '#0a0626'; c.beginPath(); c.ellipse(sx, sy, 17 * s, 6 * s, 0, 0, 7); c.fill(); c.fillStyle = '#2a2560'; c.beginPath(); c.ellipse(sx, sy, 14 * s, 5 * s, 0, 0, 7); c.fill(); R(c, sx + Math.cos(a) * 10 * s - 1, sy + Math.sin(a) * 3.5 * s - 1, 2, 2, '#3be8ff'); R(c, sx - 1, sy - 1, 2, 2, '#ff4fd8'); });
      for (let i = 0; i < 10; i++) { const on = i < 2 + Math.floor(pl * 8), [sx, sy] = pt(774 - 24 + i * 5, Bt.y0 - 1, Bt.z0 + 30); R(c, sx, sy - 1, 3, 2, on ? (i > 7 ? '#ff3b5c' : i > 4 ? '#ffe27a' : '#3bff8a') : '#1e1650'); } }   // еквалайзер
    { const Sn = g.snack, zb = Sn.z1 - 14; [Sn.x0 + 30, Sn.x0 + 90].forEach(x => { if (rnd() < .25) { const [mx, my] = pt(x + (rnd() - .5) * 30, Sn.y0 - 32, zb - 18); S.fx.push({ t: 'smoke', x: mx, y: my, vx: (rnd() - .5) * 6, vy: -10 - rnd() * 8, g: -2, col: '#d8d0f0', ttl: 2 + rnd(), age: 0, r: 2 + rnd() * 3 }); } });   // пара над мармітами
      [g.bar.x0 + 40, (g.bar.x0 + g.bar.x1) / 2, g.bar.x1 - 40].forEach((x, k) => { const z = g.bar.z0 - 10, sw = Math.sin(t * 1.3 + k) * 3, [lx, ly] = pt(x + sw, g.CEIL + 92, z); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = .08; c.fillStyle = '#ffd27a'; c.beginPath(); c.ellipse(lx, ly + 40 * PZ.s(z), 30 * PZ.s(z), 50 * PZ.s(z), 0, 0, 7); c.fill(); c.restore(); });   // лампи над баром ледь гойдаються — світло теж
      if (rnd() < .15) { const x = g.bar.x0 + 176 + (rnd() * 4 | 0) * 20, [ix, iy] = pt(x - 2 + rnd() * 6, g.bar.y0 - 16, g.bar.z0 + 18); S.fx.push({ t: 'sp', x: ix, y: iy, vx: 0, vy: 0, g: 0, col: '#ffffff', ttl: .3, age: 0 }); }   // блиск льоду в келихах
      const [jx, jy] = pt(Sn.x0 + 256, Sn.y0 - 28, zb - 10); if (rnd() < .12) S.fx.push({ t: 'sp', x: jx + (rnd() - .5) * 6, y: jy, vx: 0, vy: -10, g: 0, col: '#ffe27a', ttl: .8, age: 0 }); }   // іскорки над чашею пуншу
  }
  /** Поверх гостей — те, що має їх закривати: скляна балюстрада другого поверху (напівпрозоро) і пуфи (ноги тих, хто сидить). */
  function drawOverlays(c) {
    const g = G(), quad = pts => { const P4 = pts.map(p => pt(...p)); c.moveTo(P4[0][0], P4[0][1]); for (let m = 1; m < 4; m++) c.lineTo(P4[m][0], P4[m][1]); c.closePath(); };
    if (S.list.some(x => x.up && (x.up.ph === 'balcony' || x.up.ph === 'toTop'))) { const Bc = g.balcony; c.save(); c.beginPath(); quad([[g.XL, Bc.y - Bc.rail, Bc.z0 + 1], [g.XR, Bc.y - Bc.rail, Bc.z0 + 1], [g.XR, Bc.y + 12, Bc.z0 + 1], [g.XL, Bc.y + 12, Bc.z0 + 1]]); c.clip(); c.globalAlpha = .62; c.drawImage(S.bg.cv, S.bg.x0, S.bg.y0); c.restore(); }
    S.list.forEach(x => { if (!x.pouf || x.pouf.ph !== 'sit') return; const P2 = x.pouf.p; c.save(); c.beginPath(); quad([[P2.x - P2.r, FL - P2.h, P2.z - P2.r], [P2.x + P2.r, FL - P2.h, P2.z - P2.r], [P2.x + P2.r, FL, P2.z - P2.r], [P2.x - P2.r, FL, P2.z - P2.r]]); quad([[P2.x - P2.r, FL - P2.h, P2.z - P2.r], [P2.x + P2.r, FL - P2.h, P2.z - P2.r], [P2.x + P2.r, FL - P2.h, P2.z + P2.r * .6], [P2.x - P2.r, FL - P2.h, P2.z + P2.r * .6]]); c.clip(); c.drawImage(S.bg.cv, S.bg.x0, S.bg.y0); c.restore(); });
  }
  /** Плями дзеркальної кулі поверх усього (стіни, підлога, гості): кільце маленьких ромбів, що обертається навколо кулі. */
  function drawBallSpots(c, t) {
    const g = G(), B = g.ball; c.save(); c.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 26; k++) { const a = t * .35 + k * .2417, ring = k % 3, R0 = 240 + ring * 120, u = .5 + Math.cos(a) * .48, lvl = Math.sin(a * .7 + ring); let p, s;
      if (lvl > .35) { p = pt(g.XL + (g.XR - g.XL) * u, 100 + (1 - lvl) * 220, g.ZB - 2); s = PZ.s(g.ZB) * 9; } else { p = fp(g.XL + (g.XR - g.XL) * u, g.ZF + 40 + (lvl + .65) * 400); s = 9; }
      c.globalAlpha = .18 + .1 * Math.sin(t * 5 + k); c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(p[0], p[1] - s); c.lineTo(p[0] + s * .7, p[1]); c.lineTo(p[0], p[1] + s); c.lineTo(p[0] - s * .7, p[1]); c.fill(); }
    c.restore();
  }
  /** Аерохокей: шайба бігає по столу, відбивається, гол — спалах і рахунок над столом. */
  function drawHockey(c, dt, t) {
    const Hk = S.hockey; if (!Hk) return; const H = G().hockey, Pk = Hk.puck; Pk.u += Pk.vu * dt; Pk.v += Pk.vv * dt;
    if (Pk.u < .06 || Pk.u > .94) { Pk.vu = -Pk.vu; Pk.u = clamp(Pk.u, .06, .94); } if (Pk.v < .04 || Pk.v > .96) { if (Math.abs(Pk.u - .5) < .25) { Hk.score[Pk.v < .5 ? 1 : 0]++; Hk.flash = t + .4; Pk.u = .5; Pk.v = .5; Pk.vu = (rnd() - .5) * .8; Pk.vv = (rnd() < .5 ? 1 : -1) * (.4 + rnd() * .3); } else { Pk.vv = -Pk.vv; Pk.v = clamp(Pk.v, .04, .96); } }
    const [px, py] = pt(H.x0 + (H.x1 - H.x0) * Pk.u, H.y0 - 1, H.z0 + (H.z1 - H.z0) * Pk.v), s = PZ.s(H.z0 + (H.z1 - H.z0) * Pk.v); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = .9; c.fillStyle = '#ff4fd8'; c.beginPath(); c.ellipse(px, py, 4 * s, 2 * s, 0, 0, 7); c.fill(); c.globalAlpha = .35; c.beginPath(); c.ellipse(px, py, 8 * s, 4 * s, 0, 0, 7); c.fill();
    if (Hk.flash && t < Hk.flash) { c.globalAlpha = (Hk.flash - t) * 1.5; c.fillStyle = '#ffffff'; poly(c, [pt(H.x0, H.y0, H.z0), pt(H.x1, H.y0, H.z0), pt(H.x1, H.y0, H.z1), pt(H.x0, H.y0, H.z1)]); c.fill(); } c.restore();
    const [lx, ly] = pt((H.x0 + H.x1) / 2, H.y0 - 60, (H.z0 + H.z1) / 2); c.font = '8px "Press Start 2P", monospace'; const txt = `${Hk.score[0]} : ${Hk.score[1]}`, w = c.measureText(txt).width + 12; R(c, lx - w / 2, ly - 7, w, 14, '#0a0626dd'); c.strokeStyle = '#3be8ff'; c.lineWidth = 1; c.strokeRect(lx - w / 2 + .5, ly - 6.5, w - 1, 13); P.text(c, txt, lx, ly + 3, '#3be8ff', 8, 'center');
  }
  /** Екран караоке на правій стіні: біжучі «рядки» пісні й смужка прогресу (без тексту — умовні рядки). Спалах фотобудки нагорі. */
  function drawKaraoke(c, t) {
    const K = G().karaoke, g = G(), [ax, ay] = pt(g.XR - 6.5, 174, K.z0 - 6), [bx, by] = pt(g.XR - 6.5, 236, K.z1 + 6), on = !!S.karaoke; c.save();
    for (let i = 0; i < 4; i++) { const yy = ay + (by - ay) * (.15 + i * .2), w = Math.abs(bx - ax), cur = on && Math.floor((t - S.karaoke.t0) * .5) % 4 === i; c.globalAlpha = cur ? .95 : .35; for (let k = 0; k < 6; k++) { const bw = w * .12, sx = Math.min(ax, bx) + k * w * .15 + 4; R(c, sx, yy - 1.5, bw, 3, cur && (k < ((t * 2) % 6)) ? '#ffe27a' : '#3be8ff'); } }
    if (on) { c.globalAlpha = .9; const pr = (t - S.karaoke.t0) / 18; R(c, Math.min(ax, bx) + 4, by - 6, Math.abs(bx - ax) * pr - 8, 2, '#ff4fd8'); } c.restore();
    if (S.boothFlash && t < S.boothFlash) { const Ph = g.photo, Bc = g.balcony, [fx0, fy0] = pt(Ph.x0, Bc.y - 104, Ph.z0 - 1), [fx1, fy1] = pt(Ph.x1, Bc.y, Ph.z0 - 1); c.save(); c.globalAlpha = (S.boothFlash - t) * 2.5; c.fillStyle = '#ffffff'; c.fillRect(fx0, fy0, fx1 - fx0, fy1 - fy0); c.restore(); }
  }
  function drawFog(c) {                                                                               // туман над підлогою: смуга в глибині танцполу
    const g = G(), [, y1] = fp(774, g.ZF + 60), [, y0] = fp(774, g.ZB - 60), gr = c.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, 'rgba(120,90,200,0)'); gr.addColorStop(.5, 'rgba(120,90,200,.13)'); gr.addColorStop(1, 'rgba(120,90,200,0)');
    c.fillStyle = gr; c.fillRect(S.x, y0, S.viewW, y1 - y0);
  }
  function drawFx(c, dt) {
    if (rnd() < .35) S.fx.push({ t: 'conf', x: S.x + rnd() * S.viewW, y: S.y - 4, vx: (rnd() - .5) * 10, vy: 24 + rnd() * 20, g: 0, col: NEON[rnd() * 6 | 0], ttl: 14, age: 0, ph: rnd() * 6 });
    if (S.foam) { S.foam = S.foam.filter(b => (b.age += dt) < b.ttl); c.save(); S.foam.forEach(b => { const [sx, sy] = fp(b.x, b.z), s = PZ.s(b.z), k = Math.min(1, b.age * 3), a = b.age > b.ttl - 3 ? (b.ttl - b.age) / 3 : 1; c.globalAlpha = .75 * a; c.fillStyle = b.col; c.beginPath(); c.ellipse(sx, sy - b.r * s * .5 * k, b.r * s * k, b.r * s * .55 * k, 0, 0, 7); c.fill(); c.globalAlpha = .9 * a; c.fillStyle = '#ffffff'; c.beginPath(); c.arc(sx - b.r * s * .3 * k, sy - b.r * s * .7 * k, b.r * s * .25 * k, 0, 7); c.fill(); }); c.restore(); if (!S.foam.length && !(S.event && S.event.kind === 'foam')) S.foam = null; }   // піна на танцполі: купки бульбашок
    S.fx = S.fx.filter(f => { if ((f.age += dt) >= f.ttl) return false; if (f.t === 'foam' && f.vy > 0 && f.y > fp(774, f.fz)[1]) { if (S.foam) S.foam.push({ x: ((f.x - 774) / PZ.s(f.fz)) + 774, z: f.fz, r: 6 + rnd() * 10, col: f.col, age: 0, ttl: 10 + rnd() * 6 }); return false; } return true; }); S.fx.forEach(f => { f.vy += (f.g || 0) * dt; f.x += f.vx * dt + (f.t === 'conf' ? Math.sin(f.age * 3 + f.ph) * 14 * dt : 0); f.y += f.vy * dt;
      c.globalAlpha = f.t === 'conf' ? .9 : f.t === 'smoke' ? .11 * Math.sin(Math.PI * f.age / f.ttl) : 1 - f.age / f.ttl; if (f.t === 'foam') { c.fillStyle = f.col; c.beginPath(); c.arc(f.x, f.y, f.r, 0, 7); c.fill(); } else if (f.t === 'smoke') { const r = f.r * (1 + f.age * .6); c.fillStyle = f.col; c.beginPath(); c.ellipse(f.x, f.y, r * 1.6, r, 0, 0, 7); c.fill(); } else if (f.t === 'txt') P.text(c, f.text, f.x, f.y, f.col, 7, 'center'); else if (f.t === 'note') P.text(c, f.z ? (f.age * 3 % 2 < 1 ? 'z' : 'Z') : f.age * 4 % 2 < 1 ? '♪' : '♫', f.x, f.y, f.col, 8); else R(c, f.x, f.y, f.t === 'conf' ? 3 : 2, 2, f.col); });
    c.globalAlpha = 1;
  }
  /** Голо-плашка інтерфейсу: темне скло, тонка рамка, кутові дужки, світіння. */
  function chip(c, x, y, w, h, col) { c.save(); c.fillStyle = '#0a0626e6'; c.fillRect(x, y, w, h); c.strokeStyle = col; c.globalAlpha = .55; c.lineWidth = 1; c.strokeRect(x + .5, y + .5, w - 1, h - 1); c.globalAlpha = 1; c.lineWidth = 2;
    for (const [cx, cy, dx, dy] of [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]]) { c.beginPath(); c.moveTo(cx, cy + dy * 6); c.lineTo(cx, cy); c.lineTo(cx + dx * 6, cy); c.stroke(); }
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = .12; c.fillStyle = col; c.fillRect(x, y, w, 3); c.restore(); }
  // ---------- тонування кадру (06.11): пурпур у тінях, бірюза у світлі, зерно — «фотографія клубу» ----------
  let GRAIN = null;
  function grade(c) {
    const cv = NX.loop.canvas; c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalCompositeOperation = 'multiply'; c.fillStyle = 'rgb(222,206,255)'; c.fillRect(0, 0, cv.width, cv.height);               // тіні в пурпур
    c.globalCompositeOperation = 'screen'; c.fillStyle = 'rgba(10,30,50,.35)'; c.fillRect(0, 0, cv.width, cv.height);                // ледь бірюзи у світлі
    if (!GRAIN) { GRAIN = document.createElement('canvas'); GRAIN.width = GRAIN.height = 256; const g = GRAIN.getContext('2d'), d = g.createImageData(256, 256); for (let i = 0; i < d.data.length; i += 4) { const v = 110 + Math.random() * 90; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; } g.putImageData(d, 0, 0); }
    c.globalCompositeOperation = 'overlay'; c.globalAlpha = .08; const ox = (Math.random() * 256) | 0, oy = (Math.random() * 256) | 0; for (let y = -oy; y < cv.height; y += 256) for (let x = -ox; x < cv.width; x += 256) c.drawImage(GRAIN, x, y);   // зерно
    c.restore();
  }
  function drawHud(c) {
    const dpr = NX.loop.dpr, vw = innerWidth, vh = innerHeight; c.setTransform(dpr, 0, 0, dpr, 0, 0);
    const vg = c.createRadialGradient(vw / 2, vh / 2, Math.min(vw, vh) * .45, vw / 2, vh / 2, Math.max(vw, vh) * .8); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.55)'); c.fillStyle = vg; c.fillRect(0, 0, vw, vh);   // віньєтка
    const n = S.list.length, total = NX.guests ? NX.guests.IDS.length : 20, s1 = `${NX.t('party.guests')} ${n}/${total}`; c.font = '9px "Press Start 2P", monospace';
    const w1 = c.measureText(s1).width + 22; chip(c, 12, 52, w1, 24, '#ff4fd8'); P.text(c, s1, 23, 69, '#ffe27a', 9);
    const s2 = NX.t('party.back'); c.font = '9px "Press Start 2P", monospace'; const w2 = c.measureText(s2).width + 20, bx = vw - 12 - w2, by = vh > vw ? 52 : 14;
    chip(c, bx, by, w2, 26, '#3be8ff'); P.text(c, s2, bx + w2 / 2, by + 18, '#3be8ff', 9, 'center'); S.btn = { x: bx, y: by, w: w2, h: 26 };
    if (NX.partyMusic) { const M = NX.partyMusic, s3 = '♪ ' + NX.t('party.sound'), onM = M.playing; c.font = '9px "Press Start 2P", monospace'; const w3 = c.measureText(s3).width + 20, bx3 = bx - 10 - w3;   // кнопка звуку (музика — party_music.js)
      chip(c, bx3, by, w3, 26, onM ? '#ffe27a' : '#5a5a7a'); P.text(c, s3, bx3 + w3 / 2, by + 18, onM ? '#ffe27a' : '#8a8aa8', 9, 'center'); S.btnM = { x: bx3, y: by, w: w3, h: 26 };
      if (onM) { const bt = beat() % 1; R(c, bx3 + 4, by + 22 - bt * 0, 3, 2, bt < .25 ? '#ffe27a' : '#5a5a7a'); } }
    if (S.openT && NX.time - S.openT < 1.2) { const k0 = (NX.time - S.openT) / 1.2, a = 1 - k0; c.save(); c.globalAlpha = a; const gr = c.createRadialGradient(vw / 2, vh / 2, 0, vw / 2, vh / 2, Math.max(vw, vh) * (0.2 + k0 * .9)); gr.addColorStop(0, 'rgba(200,120,255,.0)'); gr.addColorStop(.6, 'rgba(120,60,220,.5)'); gr.addColorStop(1, 'rgba(6,3,20,1)'); c.fillStyle = gr; c.fillRect(0, 0, vw, vh); c.restore(); }   // вхід: вихор розходиться
    if (S.flashT && NX.time < S.flashT) { c.save(); c.globalAlpha = (S.flashT - NX.time) * 2.5; c.fillStyle = '#ffffff'; c.fillRect(0, 0, vw, vh); c.restore(); }   // спалах (сцени справжньої вечірки)
    if (NX.partyShow) { S.btnR = NX.partyShow.drawHud(c, vw, vh, chip, NX.time); NX.partyShow.drawTitle(c, vw, vh, NX.time); }
    if (NX.cards && NX.cards.on) NX.cards.draw(c, vw, vh, NX.time);   // сторінка карток / картка героя (cards.js)
    if (!n) { const k = S.k * dpr; c.setTransform(k, 0, 0, k, -S.x * k, -S.y * k); const txt = NX.t('party.empty'), words = txt.split(' '), lines = []; let cur = ''; c.font = '8px "Press Start 2P", monospace';   // підказка на порожньому танцполі
      words.forEach(w => { const tr = cur ? cur + ' ' + w : w; if (c.measureText(tr).width > Math.min(380, S.viewW - 40) && cur) { lines.push(cur); cur = w; } else cur = tr; }); lines.push(cur);
      const ph = lines.length * 13 + 12, [, y0] = fp(774, 40), hw = Math.min(205, S.viewW / 2 - 12); R(c, 774 - hw, y0, hw * 2, ph, '#0a0626cc'); c.strokeStyle = '#ffe27a'; c.strokeRect(774 - hw + .5, y0 + .5, hw * 2 - 1, ph - 1); lines.forEach((l, i) => P.text(c, l, 774, y0 + 16 + i * 13, '#ffe27a', 8, 'center')); }
  }
  /** Кадр вечірки (core/loop.js віддає сюди, поки on): логіка гостей, малювання шарами, інтерфейс. */
  function frame(c, dt, t) {
    S.list.forEach(g => updGuest(g, dt, t)); director(t); if (S.bub && t > S.bub.until) S.bub = null; prepare();
    S.dt = dt; const E = S.event, F = S.focus, want = F ? F.zoom : E && (E.kind === 'solo' || E.kind === 'photo' || E.kind === 'spot') ? 1.08 : 1; S.zoom = S.zoom == null ? 1 : S.zoom + (want - S.zoom) * Math.min(1, dt * 1.5);   // камера (план 7): м'який наїзд на події; F — фокус сцени справжньої вечірки
    const V = G().VIEW, wantX = F ? clamp(F.x, V.x0 + S.viewW / 2 / want, V.x1 - S.viewW / 2 / want) : S.x + S.viewW / 2, wantY = F ? F.y : S.y + S.viewH * .55; S.cx = S.cx == null ? wantX : S.cx + (wantX - S.cx) * Math.min(1, dt * 1.5); S.cy = S.cy == null ? wantY : S.cy + (wantY - S.cy) * Math.min(1, dt * 1.5);
    const drift = S.viewW >= 1200 ? [Math.sin(t * .11) * 6, Math.cos(t * .09) * 4] : [0, 0], shake = E && E.kind === 'strobe' ? [(rnd() - .5) * 3, (rnd() - .5) * 3] : [0, 0];   // дрейф на комп'ютері, тремтіння під строб
    if (S.shakeT && t < S.shakeT) { shake[0] += (rnd() - .5) * 6; shake[1] += (rnd() - .5) * 6; }
    const k = S.k * NX.loop.dpr * S.zoom, cxw = S.cx + drift[0] + shake[0], cyw = S.cy + drift[1] + shake[1];
    c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = '#03020a'; c.fillRect(0, 0, NX.loop.canvas.width, NX.loop.canvas.height);
    c.setTransform(k, 0, 0, k, NX.loop.canvas.width / 2 - cxw * k, NX.loop.canvas.height * .55 - cyw * k); c.imageSmoothingEnabled = false; S.tf = { k, cxw, cyw };
    c.drawImage(S.bg.cv, S.bg.x0, S.bg.y0);
    drawPoster(c); drawScreen(c, t); drawTiles(c); drawFog(c); drawCrowd(c, t); drawLights(c, t); drawGobos(c, t); drawNexi(c, t); drawLed(c, t); drawBartender(c, t); drawRudyk(c, t);
    if (S.bub && S.bub.nexi) { const N = nexiPos(); bubble(c, S.bub.text, N.x, N.y - 60, Math.min(1, (S.bub.until - t) * 3)); }
    S.list.slice().sort((a, b) => b.z - a.z).forEach(g => drawGuest(c, g, t)); drawOverlays(c); drawBallSpots(c, t);
    drawHockey(c, dt, t); drawKaraoke(c, t); drawEvent(c, t); drawFx(c, dt); grade(c); drawHud(c);
  }
  // ============================ ВХІД, ВИХІД, ДОТИКИ ============================
  function layout() { const V = G().VIEW, vw = innerWidth, vh = innerHeight, VW = V.x1 - V.x0, VH = V.y1 - V.y0; S.k = Math.max(vw / VW, vh / VH); S.viewW = vw / S.k; S.viewH = vh / S.k;
    S.x = clamp(S.x, V.x0, Math.max(V.x0, V.x1 - S.viewW)); const Rr = G().RASTER;
    S.y = vh / VH > vw / VW ? clamp(FL - .6 * S.viewH, Rr.y0, Rr.y1 - S.viewH) : V.y0 - (S.viewH - VH) / 2; }   // телефон: підлога на 60 % висоти; комп'ютер: уся кімната по центру
  const toWorld = (sx, sy) => { const T = S.tf; if (!T) return [sx / S.k + S.x, sy / S.k + S.y]; const k = T.k / NX.loop.dpr; return [(sx - innerWidth / 2) / k + T.cxw, (sy - innerHeight * .55) / k + T.cyw]; };
  function tap(sx, sy) {
    const b = S.btn; if (b && sx >= b.x && sx <= b.x + b.w && sy >= b.y && sy <= b.y + b.h) { close(); return; }
    const bm = S.btnM; if (bm && NX.partyMusic && sx >= bm.x && sx <= bm.x + bm.w && sy >= bm.y && sy <= bm.y + bm.h) { if (NX.partyMusic.toggle()) S.t0 = NX.time; return; }
    const br = S.btnR; if (br && sx >= br.x && sx <= br.x + br.w && sy >= br.y && sy <= br.y + br.h) { S.nexiSleep = false; S.flashT = NX.time + .4; roster(); return; }   // «↻ ПАТІ» — спочатку
    if (NX.cards && NX.cards.on) { NX.cards.tap(sx, sy); return; }   // відкрита сторінка карток — тапи їй
    const [x, y] = toWorld(sx, sy);
    for (const g of S.list.slice().sort((a, b) => a.z - b.z)) { const [GW, GH, K] = A().size(g.id), s = sc(g.z) * K, w = Math.max(30, GW * s * .9), h = GH * s, [gx, gy] = gxy(g), top = gy - g.alt * s - h - 8;
      if (x > gx - w / 2 && x < gx + w / 2 && y > top && y < gy - g.alt * s + 8) {
        if (g.look && NX.guests.collectAlt && NX.guests.collectAlt(g.id, g.look)) { sparks(gx, gy - 30 * s, 16, ['#ffe27a', '#ffffff', '#ff4fd8']); S.fx.push({ t: 'txt', text: NX.t('show.alt'), x: gx, y: top - 10, vx: 0, vy: -10, g: 0, col: '#ffe27a', ttl: 2.2, age: 0 }); S.flashT = NX.time + .25; return; }   // картка нового образу в колекцію
        if (NX.cards && !(NX.partyShow && NX.partyShow.on && NX.partyShow.SH.phase === 'scene' && g.sc)) { NX.cards.open('hero', g.id); sparks(gx, gy - 30 * s, 6, ['#ff7af0', '#ffffff']); return; }   // тап по герою — його картка (власник, 06.11); під час його сцени — не перебиваємо
        const L = NX.t(`guests.${g.id}.t`) || NX.t(`guests.${g.id}.s`) || []; g.ti = ((g.ti == null ? rnd() * L.length | 0 : g.ti + 1)) % Math.max(1, L.length);
        if (L.length) g.bub = { text: L[g.ti], until: NX.time + 2.8 }; if (SPECIAL[g.id] && !g.trip && !g.fly && !g.conga && !g.photo) { g.sp = SPECIAL[g.id]; g.spT = NX.time + 1.6; g.mv = false; } sparks(gx, gy - 30 * s, 6, ['#ff7af0', '#ffffff']); S.fx.push({ t: 'note', x: gx, y: top - 4, vx: 0, vy: -18, g: 0, col: '#ff7af0', ttl: 1.2, age: 0 }); return; } }
    { const Po = G().poster, [ax, ay] = pt(Po.x0, Po.y0, G().ZB - 4), [bx2, by2] = pt(Po.x1, Po.y1, G().ZB - 4); if (x > ax && x < bx2 && y > ay && y < by2) { NX.cards.open('grid'); return; } }   // тап по афіші — велика картка колекції
    const bb = S.barBox; if (bb && x > bb[0] && x < bb[0] + bb[2] && y > bb[1] && y < bb[1] + bb[3]) { if (!BM.guest) { BM.pose = 'shake'; BM.until = NX.time + 1.6; BM.guest = null; } const L = NX.t('party.barman') || []; if (L.length) BM.bub = { text: L[rnd() * L.length | 0], until: NX.time + 2.6 }; sparks(bb[0] + bb[2] / 2, bb[1] + 10, 5, ['#9af6ff', '#ffffff']); return; }   // тап по бармену
    const cb = S.catBox; if (cb && x > cb[0] && x < cb[0] + cb[2] && y > cb[1] && y < cb[1] + cb[3]) { CAT.pose = 'meow'; CAT.until = NX.time + 1.6; S.fx.push({ t: 'note', x: cb[0] + cb[2] / 2, y: cb[1] - 4, vx: 0, vy: -18, g: 0, col: '#ffb24a', ttl: 1.2, age: 0 }); return; }   // тап по Рудику
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
  function open() { bind(); prepare(); S.on = true; S.t0 = NX.time; S.openT = NX.time; S.zoom = 1.25; S.fx = []; S.bub = null; S.cx = S.cy = null; S.focus = null; S.nexiSleep = false; layout(); const V = G().VIEW; S.x = clamp(774 - S.viewW / 2, V.x0, Math.max(V.x0, V.x1 - S.viewW)); roster(); document.body.classList.add('nx-party'); if (NX.input) NX.input.hover = null; if (NX.partyMusic && NX.partyMusic.enabled) NX.partyMusic.on(); }
  /** Закрити (кнопка «← У КІМНАТУ», Esc): сценарій Nexi бачить !on і повертає його на майданчик. */
  function close() { if (!S.on) return; S.on = false; document.body.classList.remove('nx-party'); if (NX.partyMusic) NX.partyMusic.off(); }
  const SHOW_API = { S, G, gxy, fp, pt, sc, sparks, floorXZ, NEON, nexiPos };   // для party_show.js
  return { open, close, frame, prepare, S, get on() { return S.on; }, roster };
})();
