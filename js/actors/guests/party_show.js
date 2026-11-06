/* ============================================================================
 * actors/guests/party_show.js — СПРАВЖНЯ ВЕЧІРКА: СЦЕНАРІЙ НА 5 ХВИЛИН (06.11, чат «Персонажі»)
 * ----------------------------------------------------------------------------
 * Власник: «коли ми збираємо всю колекцію героїв — починається справжня вечірка: якісь події відбуваються з кожним учасником
 * по черзі, камера в цей момент наближається до події; хай вона ділиться десь 5 хвилин, і в кінці всі сплять; можна почати
 * заново, якщо нажати, — і все перепуститься з початку з написом ПАТІ».
 * Умова: усі 20 у колекції (NX.guests.full()) і всі на вечірці. Тоді party.js віддає гостей сюди (upd), а свій «режисер»
 * (пари, події, бар, караоке…) не кличе. Сценарій — список СЦЕН (SCENES): у кожній головний герой і 1–2 партнери йдуть на
 * місце (place), далі за часом (at) — пози, репліки (i18n show.s.<id>), ефекти (вогонь, піна, іскри, дим); наприкінці сцени
 * герой лишається в НОВОМУ ОБРАЗІ (g.look, guest_art LOOKS: обгорілий Буратіно, Попелюшка в купальнику…) до кінця вечірки.
 * Тап по герою в новому образі — картка образу в колекцію (guests.collectAlt, значок «НОВИЙ ОБРАЗ ✓»). Інші гості тим часом
 * танцюють на своїх місцях. Камера (party.js S.focus): наїзд ×1.7 на місце сцени, між сценами — загальний план.
 * Фінал: усі на танцпол, «ура», салют; потім ПОЗАСИНАЮТЬ (g.sleep — лежать, «Zzz»), Nexi теж; кнопка «↻ ПАТІ» — спочатку
 * (напис ПАТІ — великий неон на вході, drawTitle). Тривалість: заставка 6 с + 19 сцен × 13 с + фінал 20 с + сон ≈ 5 хв.
 * ========================================================================== */
NX.partyShow = (() => {
  const SH = { on: false, t0: 0, i: -1, sc: null, scT0: 0, phase: 'off', fin: 0 };   // phase: title | scene | final | sleep
  let Pp = null;                                                                  // party.js: { S, G, gxy, fp, pt, sc, sparks, floorXZ, NEON, nexiPos }
  const rnd = Math.random, SCENE_T = 12, TITLE_T = 6, FINAL_T = 20;
  const say = (g, i) => { const L = NX.t(`show.s.${g.id}`) || []; if (L[i]) g.bub = { text: L[i], until: NX.time + 3, up: !!(g.sc && g !== g.sc.g) }; };   // партнер — бабл вище, щоб не накривав бабл героя
  const sayN = i => { const L = NX.t('show.nexi') || []; if (L[i]) Pp.S.bub = { nexi: true, text: L[i], until: NX.time + 3 }; };
  const byId = id => Pp.S.list.find(g => g.id === id);
  /** Крок гостя до (tx, tz); true — дійшов. */
  function walk(g, tx, tz, sp, dt) { const dx = tx - g.x, dz = tz - g.z, d = Math.hypot(dx, dz); if (d < 2) { g.pose = 'stand'; return true; } const k = Math.min(d, sp * dt); g.x += dx / d * k; g.z += dz / d * k; if (Math.abs(dx) > 2) g.dir = Math.sign(dx); g.pose = g.fly || (sp > 70 ? 'run' : 'walk'); return false; }
  const fire = (g, n = 6) => { const [sx, sy] = Pp.gxy(g), s = Pp.sc(g.z); for (let i = 0; i < n; i++) Pp.S.fx.push({ t: 'sp', x: sx + (rnd() - .5) * 20 * s, y: sy - (20 + rnd() * 40) * s, vx: (rnd() - .5) * 30, vy: -40 - rnd() * 50, g: -10, col: ['#ff6a1a', '#ffe27a', '#ff3a2a'][i % 3], ttl: .5 + rnd() * .4, age: 0 }); };
  const smokeAt = (g, n = 2) => { const [sx, sy] = Pp.gxy(g), s = Pp.sc(g.z); for (let i = 0; i < n; i++) Pp.S.fx.push({ t: 'smoke', x: sx + (rnd() - .5) * 20 * s, y: sy - 50 * s, vx: (rnd() - .5) * 10, vy: -14 - rnd() * 10, g: -2, col: '#8a8a9a', ttl: 1.6 + rnd(), age: 0, r: 4 + rnd() * 4 }); };
  const foamAt = (x, z, n = 10) => { const [sx, sy] = Pp.fp(x, z); for (let i = 0; i < n; i++) Pp.S.fx.push({ t: 'foam', x: sx + (rnd() - .5) * 40, y: sy - 60, vx: (rnd() - .5) * 120, vy: -60 - rnd() * 80, g: 160, col: ['#ffffff', '#e8f6ff', '#fff0fa'][i % 3], ttl: 2.2, age: 0, r: 3 + rnd() * 4, fz: z + (rnd() - .5) * 60 }); };
  const glitter = (g, cols = ['#ffe27a', '#ffffff', '#9af6ff']) => { const [sx, sy] = Pp.gxy(g), s = Pp.sc(g.z); Pp.sparks(sx, sy - 30 * s, 10, cols); };
  const splash = (g, col = '#b48aff') => { const [sx, sy] = Pp.gxy(g), s = Pp.sc(g.z); for (let i = 0; i < 12; i++) Pp.S.fx.push({ t: 'sp', x: sx, y: sy - 40 * s, vx: (rnd() - .5) * 90, vy: -50 - rnd() * 50, g: 160, col: i % 3 ? col : '#ffffff', ttl: .8, age: 0 }); };
  const zzz = g => { const [sx, sy] = Pp.gxy(g), s = Pp.sc(g.z); Pp.S.fx.push({ t: 'note', z: 1, x: sx + g.dir * 20 * s, y: sy - 30 * s, vx: 6, vy: -14, g: 0, col: '#bff8ff', ttl: 1.8, age: 0 }); };
  const flash = () => { Pp.S.flashT = NX.time + .3; };
  const look = (g, lk) => { g.look = lk || NX.guestArt.LOOKS[g.id]; g.g.look = g.look; glitter(g); flash(); };
  const mid = () => Pp.floorXZ(.5, .72);   // сцени — на передньому плані танцполу (задній ряд — решта гостей)

  // ---------------------------------------------------------- СЦЕНИ ----------------------------------------------------------
  // { id, with: [партнери], place: [x, z] (місце сцени; герой стає тут, партнери — обабіч), at: {сек: fn(ctx)}, tick: fn(ctx, k) }
  // ctx: { g (герой), p (партнери за індексом), k (сек від початку сцени), dt } — коли всі дійшли; до того — йдуть (walk).
  const M = (dx, dz) => () => { const [x, z] = mid(); return [x + dx, z + dz]; };   // місця рахуються при старті сцени (party.js уже є)
  const SCENES = [
    { id: 'pinocchio', with: ['gorynych'], place: M(-40, 0), tick: ({ g, p, k }) => { if (k > 2 && k < 4.5) p[0].pose = 'sneeze'; if (k > 3 && k < 4.5) fire(p[0], 3); if (k > 3.2 && k < 8) { fire(g, 2); g.pose = 'run'; g.x += Math.sin(k * 6) * 2; g.dir = Math.sign(Math.cos(k * 6)) || 1; } if (k > 8 && k < 10) smokeAt(g); },
      at: { 1: ({ g }) => say(g, 0), 3: ({ p }) => say(p[0], 0), 5: ({ g }) => say(g, 1), 8: ({ g }) => { foamAt(g.x, g.z, 8); look(g); }, 10: ({ g }) => { g.pose = 'cheer'; say(g, 2); } } },
    { id: 'cinderella', with: ['cheshire'], place: M(20, 20), tick: ({ g, p, k }) => { if (k > 1 && k < 4) g.pose = 'twirl'; if (k > 2.5 && k < 6) p[0].pose = 'sit'; if (k > 4.5 && k < 6 && rnd() < .3) glitter(p[0], ['#b48aff', '#ffffff']); },
      at: { 1: ({ g }) => say(g, 0), 4.5: ({ p }) => say(p[0], 0), 6: ({ g, p }) => { look(g); look(p[0]); p[0].x += 60; }, 6.5: ({ g }) => say(g, 1), 9: ({ p }) => say(p[0], 1), 11: ({ g }) => { g.pose = 'cheer'; say(g, 2); } } },
    { id: 'sherlock', with: ['cheshire', 'cinderella'], place: M(0, -20), tick: ({ g, k }) => { if (k > 1 && k < 6) g.pose = 'inspect'; if (k > 7 && k < 9) g.pose = 'cheer'; },
      at: { 1: ({ g }) => say(g, 0), 4: ({ g }) => say(g, 1), 7: ({ p }) => { say(p[0], 2); glitter(p[0]); }, 9: ({ g }) => { look(g); say(g, 2); }, 11: ({ p }) => say(p[1], 3) } },
    { id: 'snowWhite', with: ['whiteRabbit'], place: () => { const Sn = NX.partyRoom.GEO.snack; return [Sn.x0 + 120, Sn.z0 - 40]; }, tick: ({ g, p, k }) => { if (k > 1 && k < 3) g.pose = 'search'; if (k > 3 && k < 7) { g.sleep = true; } else g.sleep = false; if (k > 4 && k < 7 && rnd() < .05) zzz(g); if (k > 4.5 && k < 7) p[0].pose = 'cheer'; },
      at: { 1: ({ g }) => say(g, 0), 4: ({ p }) => say(p[0], 0), 7: ({ g }) => { foamAt(g.x, g.z, 12); say(g, 1); }, 8.5: ({ g }) => look(g), 10: ({ g, p }) => { g.pose = 'cheer'; say(g, 2); say(p[0], 1); } } },
    { id: 'babaYaga', with: ['whiteRabbit'], place: M(-120, 60), tick: ({ g, k }) => { if (k < 6) { g.pose = 'ride'; g.alt = 20 + Math.sin(k * 5) * 6; } else g.alt = 0; if (k > 5 && k < 7.5) foamAt(g.x, g.z, 3); },
      at: { 1: ({ g }) => say(g, 0), 4: ({ p }) => say(p[0], 0), 6: ({ g }) => { g.pose = 'stand'; }, 7.5: ({ g }) => { look(g); say(g, 1); }, 10: ({ g, p }) => { g.pose = 'cheer'; say(g, 2); p[0].pose = 'cheer'; } } },
    { id: 'redHood', with: ['kolobok'], place: () => { const Sn = NX.partyRoom.GEO.snack; return [Sn.x0 + 60, Sn.z0 - 44]; }, tick: ({ g, p, k }) => { if (k > 2 && k < 5) p[0].pose = 'roll'; if (k > 4.6 && k < 5.4 && rnd() < .4) splash(g); },
      at: { 1: ({ g }) => say(g, 0), 2: ({ p }) => say(p[0], 0), 5: ({ g }) => { look(g); say(g, 1); }, 8: ({ g }) => { g.pose = 'cheer'; glitter(g, ['#3bff8a', '#9af6ff']); }, 10: ({ g }) => say(g, 2) } },
    { id: 'whiteRabbit', with: ['sherlock'], place: M(-200, -40), tick: ({ g, k }) => { if (k > 1 && k < 2.5) g.pose = 'watch'; if (k > 2.5 && k < 5) { g.pose = 'run'; g.x += 40 * .016 * (k < 4 ? 1 : -1); } if (k > 5 && k < 7 && rnd() < .3) glitter(g, ['#ffe27a']); },
      at: { 1: ({ g }) => say(g, 0), 5: ({ g }) => { look(g); flash(); }, 6: ({ g }) => say(g, 1), 8: ({ p }) => say(p[0], 4), 10: ({ g }) => { g.pose = 'cheer'; say(g, 2); } } },
    { id: 'pussBoots', with: ['firebird'], place: M(100, 70), tick: ({ g, k }) => { if (k > 1 && k < 3) g.pose = 'bow'; if (k > 3 && k < 6) foamAt(g.x, g.z, 4); if (k > 6 && k < 8) g.pose = 'search'; },
      at: { 1: ({ g }) => say(g, 0), 6: ({ g }) => { look(g); say(g, 1); }, 9: ({ g }) => { g.pose = 'cheer'; say(g, 2); }, 10: ({ p }) => say(p[0], 3) } },
    { id: 'quixote', with: ['mavka'], place: M(0, 100), tick: ({ g, k }) => { if (k > 1.5 && k < 4) { g.pose = 'charge'; g.z -= 30 * .016; } if (k > 4 && k < 7) g.pose = 'fall'; if (k > 4 && k < 4.3) flash(); },
      at: { 1: ({ g }) => say(g, 0), 4: ({ p }) => { say(p[0], 3); Pp.S.shakeT = NX.time + .6; }, 7: ({ g }) => { look(g); say(g, 1); }, 10: ({ g }) => { g.pose = 'cheer'; say(g, 2); } } },
    { id: 'robinHood', with: ['tinMan'], place: M(160, -30), tick: ({ g, k }) => { if (k > 1.5 && k < 4) g.pose = 'aim'; },
      at: { 1: ({ g }) => say(g, 0), 4: ({ g }) => { glitter(g, ['#ff4fd8', '#3be8ff', '#ffe27a']); Pp.S.shakeT = NX.time + .3; }, 4.5: ({ g }) => { look(g); say(g, 1); }, 7: ({ p }) => say(p[0], 3), 10: ({ g }) => { g.pose = 'cheer'; say(g, 2); } } },
    { id: 'mavka', with: ['genie'], place: M(-60, -60), tick: ({ g, p, k }) => { if (k > 1 && k < 6) { g.pose = 'bloom'; if (rnd() < .3) glitter(g, ['#d8ff6a', '#ff8fd0', '#ffffff']); } if (k > 3 && k < 6) p[0].pose = 'cast'; if (k > 5.5 && k < 6.5) foamAt(g.x, g.z, 4); },
      at: { 1: ({ g }) => say(g, 0), 3: ({ p }) => say(p[0], 3), 6.5: ({ g }) => { look(g); say(g, 1); }, 10: ({ g }) => { g.pose = 'cheer'; say(g, 2); } } },    { id: 'stNicholas', with: ['redHood', 'pinocchio'], place: M(0, 40), tick: ({ g, p, k }) => { if (k > 1 && k < 6) { g.pose = 'give'; if (rnd() < .1) glitter(p[Math.floor(k) % 2], ['#ffe27a', '#ff4fd8']); } if (k > 2 && k < 6) p.forEach(q => { q.pose = 'cheer'; }); },
      at: { 1: ({ g }) => say(g, 0), 3: ({ p }) => say(p[0], 3), 6.5: ({ g }) => { look(g); say(g, 1); }, 10: ({ g }) => { g.pose = 'cheer'; say(g, 2); } } },
    { id: 'merlin', with: ['pinocchio'], place: M(-100, -20), tick: ({ g, k }) => { if (k > 1.5 && k < 5) { g.pose = 'cast'; if (rnd() < .3) glitter(g, ['#9af6ff', '#e2c4ff']); } },
      at: { 1: ({ g }) => say(g, 0), 5: ({ g }) => { look(g); say(g, 1); flash(); }, 7: ({ p }) => say(p[0], 3), 10: ({ g }) => { g.pose = 'cheer'; say(g, 2); } } },
    { id: 'genie', with: ['snegurka', 'whiteRabbit'], place: M(80, -40), tick: ({ g, p, k }) => { g.alt = 30 + Math.sin(k * 2) * 6; if (k > 1.5 && k < 6) { g.pose = 'cast'; if (rnd() < .2) glitter(p[Math.floor(k) % 2], ['#ffe27a', '#d4b8ff']); } else g.pose = 'float'; },
      at: { 1: ({ g }) => say(g, 0), 3: ({ p }) => say(p[0], 3), 6: ({ g }) => { look(g); say(g, 1); }, 10: ({ g }) => say(g, 2) } },
    { id: 'tinMan', with: ['snowWhite'], place: M(60, 60), tick: ({ g, k }) => { if (k > 1 && k < 5) { g.pose = 'rust'; if (rnd() < .1) glitter(g, ['#ffd27a']); } },
      at: { 1: ({ g }) => say(g, 0), 3: ({ p }) => say(p[0], 3), 5.5: ({ g }) => { look(g); say(g, 1); }, 9: ({ g, p }) => { g.pose = 'cheer'; p[0].pose = 'cheer'; say(g, 2); } } },
    { id: 'snegurka', with: ['firebird'], place: M(-40, 110), tick: ({ g, p, k }) => { if (k > 1 && k < 4) { g.pose = 'frost'; if (rnd() < .3) glitter(g, ['#ffffff', '#bfe6ff']); } if (k > 3.5 && k < 6) { p[0].alt = 40 + Math.sin(k * 4) * 6; if (rnd() < .3) fire(p[0], 2); } if (k > 5 && k < 6.5 && rnd() < .3) splash(g, '#bfe6ff'); },
      at: { 1: ({ g }) => say(g, 0), 3.5: ({ p }) => say(p[0], 3), 6.5: ({ g }) => { look(g); say(g, 1); flash(); }, 10: ({ g }) => { g.pose = 'cheer'; say(g, 2); } } },    { id: 'cheshire', with: ['sherlock', 'whiteRabbit'], place: M(0, 0), tick: ({ g, k }) => { g.pose = 'sit'; if (k > 1 && k < 9 && Math.floor(k * 2) !== g.lastJ) { g.lastJ = Math.floor(k * 2); const [x, z] = Pp.floorXZ(.2 + rnd() * .6, .2 + rnd() * .6); glitter(g, ['#b48aff', '#ffffff']); g.x = x; g.z = z; glitter(g, ['#b48aff', '#ffffff']); } },
      at: { 1: ({ g }) => say(g, 3), 5: ({ p }) => say(p[0], 5), 9: ({ g }) => say(g, 4), 11: ({ p }) => { p[0].pose = 'cheer'; p[1].pose = 'cheer'; } } },
    { id: 'kolobok', with: ['babaYaga'], place: () => { const Sn = NX.partyRoom.GEO.snack; return [Sn.x0 + 220, Sn.z0 - 36]; }, tick: ({ g, k }) => { if (k > 1 && k < 4) { g.pose = 'roll'; g.alt = Math.abs(Math.sin(k * 8)) * 10; } else g.alt = 0; if (k > 4 && k < 4.5 && rnd() < .5) splash(g, '#7a4a2a'); },
      at: { 1: ({ g }) => say(g, 0), 4.5: ({ g }) => { look(g); say(g, 1); }, 7: ({ p }) => say(p[0], 3), 10: ({ g }) => say(g, 2) } },
    { id: 'firebird', with: ['cinderella'], place: () => { const B = NX.partyRoom.GEO.bar; return [B.x0 + 80, B.z0 - 80]; }, tick: ({ g, k }) => { if (k < 5) { g.pose = 'fly'; g.alt = 30 + Math.sin(k * 3) * 8; } else g.alt = Math.max(0, g.alt - 60 * .016); if (k > 4.6 && k < 5.4 && rnd() < .5) splash(g, '#ff4fd8'); },
      at: { 1: ({ g }) => say(g, 0), 5.5: ({ g }) => { look(g); say(g, 1); }, 8: ({ p }) => say(p[0], 3), 10: ({ g }) => say(g, 2) } },
    { id: 'gorynych', with: ['merlin'], place: () => { const B = NX.partyRoom.GEO.bar; return [B.x0 + 160, B.z0 - 70]; }, tick: ({ g, k }) => { if (k > 1 && k < 5 && Math.floor(k * 3) % 3 === 0) g.pose = 'sneeze'; else if (k < 6) g.pose = 'stand'; if (k > 2 && k < 5 && rnd() < .1) fire(g, 2); },
      at: { 1: ({ g }) => say(g, 0), 3: ({ p }) => say(p[0], 3), 6: ({ g }) => { look(g); say(g, 1); }, 10: ({ g }) => say(g, 2) } },
  ];

  /** Початок (вхід на вечірку з повною колекцією або кнопка «↻ ПАТІ»). */
  function start(P_) {
    Pp = P_ || Pp; SH.on = true; SH.t0 = NX.time; SH.i = -1; SH.sc = null; SH.phase = 'title'; SH.fin = 0; Pp.S.focus = null;
    const n = Pp.S.list.length; Pp.S.list.forEach((g, i) => { const [hx, hz] = Pp.floorXZ((i + .5) / n, .1); g.home = [hx, hz]; g.look = null; g.g.look = null; g.sleep = false; g.bub = null; g.alt = g.fly ? 30 : 0; g.y = null; g.trip = g.up = g.pouf = g.hockey = g.sing = g.fan = g.conga = g.photo = g.rest = null; g.mv = false; g.spT = 0; g.pairT = 0; g.cheerT = 0; });
    if (NX.nexi) NX.nexi.emote('love', 2);
  }
  function stop() { SH.on = false; SH.phase = 'off'; if (Pp) { Pp.S.focus = null; Pp.S.list.forEach(g => { g.sleep = false; }); } }
  /** Перейти до сцени i (або фіналу). */
  function nextScene(t) {
    SH.i++; const sc = SCENES[SH.i];
    if (SH.sc) { const old = SH.sc; [old.g, ...old.p].forEach(g => { if (g) { g.sleep = false; g.pose = 'stand'; g.alt = g.fly ? 30 : 0; g.sc = null; } }); }
    if (!sc) { SH.phase = 'final'; SH.scT0 = t; SH.sc = null; Pp.S.focus = null; Pp.S.list.forEach(g => { g.cheerT = t + 4; }); sayN(1); return; }
    const g = byId(sc.id), p = sc.with.map(byId).filter(Boolean); if (!g || p.length < sc.with.length) { nextScene(t); return; }   // когось нема — сцену пропускаємо
    SH.sc = { ...sc, g, p, done: {}, arrived: false }; SH.scT0 = t; SH.phase = 'scene'; [g, ...p].forEach(q => { q.sc = SH.sc; q.bub = null; });
    const [px, pz] = sc.place(); g.tx = px; g.tz = pz; p.forEach((q, i) => { q.tx = px + (i ? 70 : -70) * (i === 1 ? 1 : (g.dir || 1)); q.tz = pz + (i ? 10 : -4); });
    const [fx, fy] = Pp.fp(px, pz); Pp.S.focus = { x: fx, y: fy - 55 * Pp.sc(pz), zoom: Pp.S.viewW >= 1200 ? 1.9 : 1.45 };
    if (SH.i === 0) sayN(0);
  }
  /** Логіка гостя під час шоу; true — гостем керує шоу (party.js updGuest далі не йде). */
  function upd(g, dt, t) {
    if (!SH.on) return false;
    g.trip = g.up = g.pouf = g.hockey = g.sing = g.fan = g.conga = g.photo = g.rest = null; g.mv = false; g.next = t + 999;
    if (SH.phase === 'sleep') { if (g.sleep) { if (rnd() < .01) zzz(g); return true; } return false; }
    if (SH.phase === 'final') { g.cheerT = t + 1; return false; }
    const sc = SH.sc; if (!sc || g.sc !== sc) { if (g.home && !g.fly && g.id !== 'cheshire' && Math.hypot(g.x - g.home[0], g.z - g.home[1]) > 3) { walk(g, g.home[0], g.home[1], 90, dt); g.alt = 0; return true; } return false; }   // решта — у задньому ряду, танцюють там (сцени — спереду)
    const k = t - SH.scT0; g.rot = 0; g.sx = 1;
    if (!sc.arrived) { const all = [sc.g, ...sc.p].every(q => walk(q, q.tx, q.tz, 150, dt)); if (all) { sc.arrived = true; SH.scT0 = t; sc.g.dir = sc.p[0] && sc.p[0].x > sc.g.x ? 1 : -1; sc.p.forEach(q => { q.dir = q.x > sc.g.x ? -1 : 1; }); } else if (g.fly) g.alt = 30; return true; }
    if (g !== sc.g) return true;   // партнерів веде tick/at головного (одна логіка на сцену)
    const ctx = { g: sc.g, p: sc.p, k, dt }; [sc.g, ...sc.p].forEach(q => { if (!q.fly) q.alt = Math.max(0, q.alt || 0); if (q.pose === 'run' || q.pose === 'walk') q.pose = 'stand'; });
    if (sc.tick) sc.tick(ctx);
    Object.keys(sc.at).forEach(key => { if (!sc.done[key] && k >= +key) { sc.done[key] = true; sc.at[key](ctx); } });
    if (k > SCENE_T) nextScene(t);
    return true;
  }
  /** Кадр шоу (party.js frame, після director): фази й сон. */
  function tick(t, dt) {
    if (!SH.on) return;
    if (SH.phase === 'title' && t - SH.t0 > TITLE_T) nextScene(t);
    if (SH.phase === 'final' && t - SH.scT0 > FINAL_T) { SH.phase = 'sleep'; SH.scT0 = t; sayN(2); Pp.S.list.forEach((g, i) => { g.sleepAt = t + 1 + i * .35; }); }
    if (SH.phase === 'final' && rnd() < .15) { const x = 774 + (rnd() - .5) * 700, [sx, sy] = Pp.pt(x, 90 + rnd() * 80, NX.partyRoom.GEO.ZB - 20), col = Pp.NEON[rnd() * 6 | 0]; for (let i = 0; i < 14; i++) { const a = i / 14 * 6.283; Pp.S.fx.push({ t: 'sp', x: sx, y: sy, vx: Math.cos(a) * 45, vy: Math.sin(a) * 45, g: 30, col, ttl: .9, age: 0 }); } }   // салют
    if (SH.phase === 'sleep') { Pp.S.list.forEach(g => { if (!g.sleep && g.sleepAt && t > g.sleepAt) { g.sleep = true; g.pose = 'stand'; g.alt = 0; g.fly = null; g.bub = null; zzz(g); } }); Pp.S.nexiSleep = t - SH.scT0 > 8; }
  }
  /** Напис ПАТІ (заставка на старті й кнопка «↻ ПАТІ»): великий неоновий текст з мерехтінням, обвідкою й зірками. */
  function drawTitle(c, vw, vh, t) {
    if (!SH.on || SH.phase !== 'title') return; const k = (t - SH.t0) / TITLE_T, a = k < .15 ? k / .15 : k > .8 ? (1 - k) / .2 : 1, s = NX.t('show.title');
    c.save(); c.globalAlpha = a; c.fillStyle = 'rgba(3,2,10,.55)'; c.fillRect(0, 0, vw, vh); const fs = Math.min(72, vw / 6), y = vh * .42, fl = Math.floor(t * 9) % 11 === 0 ? .5 : 1;
    c.font = `${fs}px "Press Start 2P", monospace`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.shadowColor = '#ff4fd8'; c.shadowBlur = 40 * fl; c.fillStyle = '#ff4fd8'; c.fillText(s, vw / 2, y); c.shadowBlur = 0; c.fillStyle = '#ffffff'; c.globalAlpha = a * .9 * fl; c.fillText(s, vw / 2, y - 3);
    c.globalAlpha = a; c.font = `${Math.min(14, vw / 28)}px "Press Start 2P", monospace`; c.fillStyle = '#ffe27a'; c.fillText(NX.t('show.sub'), vw / 2, y + fs * .9);
    for (let i = 0; i < 12; i++) { const ph = (t * .6 + i / 12) % 1, sx = vw / 2 + Math.cos(i * 2.1 + t) * (fs * 3), sy = y + Math.sin(i * 1.7 + t * .8) * fs * 1.2; c.fillStyle = Pp.NEON[i % 6]; c.globalAlpha = a * (1 - ph); c.fillRect(sx, sy, 4, 4); }
    c.restore();
  }
  /** Плашка сцени: «СЦЕНА 7/20 · ПІНОККІО» зі смужкою часу; наприкінці — «↻ ПАТІ». Повертає прямокутник кнопки або null. */
  function drawHud(c, vw, vh, chip, t) {
    if (!SH.on) return null; const tp = vh > vw ? 86 : 84; c.font = '8px "Press Start 2P", monospace';
    if (SH.phase === 'scene' || (SH.sc && SH.phase !== 'sleep')) { const sc = SH.sc; if (sc) { const s = `${NX.t('show.scene')} ${SH.i + 1}/${SCENES.length} · ${(NX.t(`guests.${sc.id}.n`) || sc.id).toUpperCase()}`, w = c.measureText(s).width + 22; chip(c, 12, tp, w, 22, '#ffe27a'); NX.px.text(c, s, 23, tp + 15, '#ffe27a', 8); const pr = Math.min(1, (t - SH.scT0) / SCENE_T); c.fillStyle = '#ff4fd8'; c.fillRect(12, tp + 22, w * pr, 2); } }
    if (SH.phase === 'final') { const s = NX.t('show.fin'), w = c.measureText(s).width + 22; chip(c, 12, tp, w, 22, '#3bff8a'); NX.px.text(c, s, 23, tp + 15, '#3bff8a', 8); }
    if (SH.phase === 'sleep') { const s = '↻ ' + NX.t('show.title'), w = c.measureText(s).width * 1.4 + 30, x = vw / 2 - w / 2, y = vh - 70; c.font = '11px "Press Start 2P", monospace'; chip(c, x, y, w, 34, '#ff4fd8'); NX.px.text(c, s, vw / 2, y + 23, Math.floor(t * 2) % 2 ? '#ff4fd8' : '#ffffff', 11, 'center'); return { x, y, w, h: 34 }; }
    return null;
  }
  return { start, stop, upd, tick, drawTitle, drawHud, SH, SCENES, get on() { return SH.on; } };
})();
