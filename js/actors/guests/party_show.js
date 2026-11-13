/* ============================================================================
 * actors/guests/party_show.js — СЦЕНКИ ГЕРОЇВ НА ВЕЧІРЦІ: НА МІСЦЯХ, БЕЗ СЦЕНАРІЮ (13.11, чат «Гості й вечірка»)
 * ----------------------------------------------------------------------------
 * Власник (13.11): «тупо виходить, коли вона починається; краще, щоб ми самі могли спостерігати за персонажами; не треба
 * більше сценарію і щоб воно само приближало; не треба, щоб гості приходили в центр, коли їхня сценка».
 * Було (06.11): при 20/20 — 5-хвилинне шоу: заставка «ПАТІ», усі в ряд, сцени по черзі в центрі з наїздом камери, фінал, сон.
 * ГЛАВИ (власник, 13.11): 1 — зібрати 20 героїв у кімнаті; 2 — «ПАТІ»: вечірка, коли зібрано всіх (заставка ПАТІ на вході,
 * сценки, нові образи); 3 — «СУПЕР ХІРОУ»: коли зібрано всі образи з вечірки (ще не зроблено).
 * Стало: сценки — частина вечірки глави «ПАТІ». Раз на кілька секунд рушій бере наступну сценку з перетасованої черги, якщо її
 * герой і партнери зараз вільні (не біля бару, не нагорі, не в конзі…): герой лишається ТАМ, ДЕ СТОЇТЬ (сценки біля фуршету
 * й бару — біля них), партнери підходять до нього кроком; одночасно йдуть 1–2 сценки в різних місцях. Камеру не чіпаємо —
 * нею керує власник (party.js). Над героєм сценки — зірочка; репліки — субтитрами, лише коли герой у кадрі.
 * Сценка: SCENES — пози, репліки (i18n show.s.<id>), ефекти (вогонь, піна, іскри, дим); наприкінці герой лишається в НОВОМУ
 * ОБРАЗІ (g.look, guest_art LOOKS) до кінця вечірки; тап по ньому — картка образу в колекцію (guests.collectAlt).
 * Гачки в party.js: roster → start; director → tick; updGuest: гостя з g.sc веде цей файл.
 * ========================================================================== */
NX.partyShow = (() => {
  const SH = { on: false, full: false, t0: 0, act: [], next: 0, queue: [] };                         // act — сценки, що йдуть зараз; queue — перетасована черга номерів
  let Pp = null;                                                                  // party.js: { S, G, gxy, fp, pt, sc, sparks, floorXZ, NEON, nexiPos }
  const rnd = Math.random, SCENE_T = 12, TITLE_T = 4, clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const say = (g, i) => { const L = NX.t(`show.s.${g.id}`) || []; if (L[i]) g.bub = { text: L[i], until: NX.time + 3, up: !!(g.sc && g !== g.sc.g) }; };   // партнер — бабл вище, щоб не накривав бабл героя
  const byId = id => Pp.S.list.find(g => g.id === id);
  /** Крок гостя до (tx, tz); true — дійшов. */
  function walk(g, tx, tz, sp, dt) { const dx = tx - g.x, dz = tz - g.z, d = Math.hypot(dx, dz); if (d < 2) { g.pose = 'stand'; return true; } const k = Math.min(d, sp * dt); g.x += dx / d * k; g.z += dz / d * k; if (Math.abs(dx) > 2) g.dir = Math.sign(dx); g.pose = g.fly || (sp > 70 ? 'run' : 'walk'); return false; }
  const fire = (g, n = 6) => { const [sx, sy] = Pp.gxy(g), s = Pp.sc(g.z); for (let i = 0; i < n; i++) Pp.S.fx.push({ t: 'sp', x: sx + (rnd() - .5) * 20 * s, y: sy - (20 + rnd() * 40) * s, vx: (rnd() - .5) * 30, vy: -40 - rnd() * 50, g: -10, col: ['#ff6a1a', '#ffe27a', '#ff3a2a'][i % 3], ttl: .5 + rnd() * .4, age: 0 }); };
  const smokeAt = (g, n = 2) => { const [sx, sy] = Pp.gxy(g), s = Pp.sc(g.z); for (let i = 0; i < n; i++) Pp.S.fx.push({ t: 'smoke', x: sx + (rnd() - .5) * 20 * s, y: sy - 50 * s, vx: (rnd() - .5) * 10, vy: -14 - rnd() * 10, g: -2, col: '#8a8a9a', ttl: 1.6 + rnd(), age: 0, r: 4 + rnd() * 4 }); };
  const foamAt = (x, z, n = 10) => { const [sx, sy] = Pp.fp(x, z); for (let i = 0; i < n; i++) Pp.S.fx.push({ t: 'foam', x: sx + (rnd() - .5) * 40, y: sy - 60, vx: (rnd() - .5) * 120, vy: -60 - rnd() * 80, g: 160, col: ['#ffffff', '#e8f6ff', '#fff0fa'][i % 3], ttl: 2.2, age: 0, r: 3 + rnd() * 4, fz: z + (rnd() - .5) * 60 }); };
  const glitter = (g, cols = ['#ffe27a', '#ffffff', '#9af6ff']) => { const [sx, sy] = Pp.gxy(g), s = Pp.sc(g.z); Pp.sparks(sx, sy - 30 * s, 10, cols); };
  const splash = (g, col = '#b48aff') => { const [sx, sy] = Pp.gxy(g), s = Pp.sc(g.z); for (let i = 0; i < 12; i++) Pp.S.fx.push({ t: 'sp', x: sx, y: sy - 40 * s, vx: (rnd() - .5) * 90, vy: -50 - rnd() * 50, g: 160, col: i % 3 ? col : '#ffffff', ttl: .8, age: 0 }); };
  const zzz = g => { const [sx, sy] = Pp.gxy(g), s = Pp.sc(g.z); Pp.S.fx.push({ t: 'note', z: 1, x: sx + g.dir * 20 * s, y: sy - 30 * s, vx: 6, vy: -14, g: 0, col: '#bff8ff', ttl: 1.8, age: 0 }); };
  const flash = () => {};   // спалаху на весь екран більше немає — сценка не перебиває те, на що дивиться власник
  const look = (g, lk) => { g.look = lk || NX.guestArt.LOOKS[g.id]; g.g.look = g.look; glitter(g); flash(); };

  // ---------------------------------------------------------- СЦЕНИ ----------------------------------------------------------
  // { id, with: [партнери], place: null — там, де герой стоїть, або fn -> [x, z] (біля фуршету / бару; партнери — обабіч), at: {сек: fn(ctx)}, tick: fn(ctx, k) }
  // ctx: { g (герой), p (партнери за індексом), k (сек від початку сцени), dt } — коли всі дійшли; до того — йдуть (walk).
  const SCENES = [
    { id: 'pinocchio', with: ['gorynych'], place: null, tick: ({ g, p, k }) => { if (k > 2 && k < 4.5) p[0].pose = 'sneeze'; if (k > 3 && k < 4.5) fire(p[0], 3); if (k > 3.2 && k < 8) { fire(g, 2); g.pose = 'run'; g.x += Math.sin(k * 6) * 2; g.dir = Math.sign(Math.cos(k * 6)) || 1; } if (k > 8 && k < 10) smokeAt(g); },
      at: { 1: ({ g }) => say(g, 0), 3: ({ p }) => say(p[0], 0), 5: ({ g }) => say(g, 1), 8: ({ g }) => { foamAt(g.x, g.z, 8); look(g); }, 10: ({ g }) => { g.pose = 'cheer'; say(g, 2); } } },
    { id: 'cinderella', with: ['cheshire'], place: null, tick: ({ g, p, k }) => { if (k > 1 && k < 4) g.pose = 'twirl'; if (k > 2.5 && k < 6) p[0].pose = 'sit'; if (k > 4.5 && k < 6 && rnd() < .3) glitter(p[0], ['#b48aff', '#ffffff']); },
      at: { 1: ({ g }) => say(g, 0), 4.5: ({ p }) => say(p[0], 0), 6: ({ g, p }) => { look(g); look(p[0]); p[0].x += 60; }, 6.5: ({ g }) => say(g, 1), 9: ({ p }) => say(p[0], 1), 11: ({ g }) => { g.pose = 'cheer'; say(g, 2); } } },
    { id: 'sherlock', with: ['cheshire', 'cinderella'], place: null, tick: ({ g, k }) => { if (k > 1 && k < 6) g.pose = 'inspect'; if (k > 7 && k < 9) g.pose = 'cheer'; },
      at: { 1: ({ g }) => say(g, 0), 4: ({ g }) => say(g, 1), 7: ({ p }) => { say(p[0], 2); glitter(p[0]); }, 9: ({ g }) => { look(g); say(g, 2); }, 11: ({ p }) => say(p[1], 3) } },
    { id: 'snowWhite', with: ['whiteRabbit'], place: () => { const Sn = NX.partyRoom.GEO.snack; return [Sn.x0 + 120, Sn.z0 - 40]; }, tick: ({ g, p, k }) => { if (k > 1 && k < 3) g.pose = 'search'; if (k > 3 && k < 7) { g.sleep = true; } else g.sleep = false; if (k > 4 && k < 7 && rnd() < .05) zzz(g); if (k > 4.5 && k < 7) p[0].pose = 'cheer'; },
      at: { 1: ({ g }) => say(g, 0), 4: ({ p }) => say(p[0], 0), 7: ({ g }) => { foamAt(g.x, g.z, 12); say(g, 1); }, 8.5: ({ g }) => look(g), 10: ({ g, p }) => { g.pose = 'cheer'; say(g, 2); say(p[0], 1); } } },
    { id: 'babaYaga', with: ['whiteRabbit'], place: null, tick: ({ g, k }) => { if (k < 6) { g.pose = 'ride'; g.alt = 20 + Math.sin(k * 5) * 6; } else g.alt = 0; if (k > 5 && k < 7.5) foamAt(g.x, g.z, 3); },
      at: { 1: ({ g }) => say(g, 0), 4: ({ p }) => say(p[0], 0), 6: ({ g }) => { g.pose = 'stand'; }, 7.5: ({ g }) => { look(g); say(g, 1); }, 10: ({ g, p }) => { g.pose = 'cheer'; say(g, 2); p[0].pose = 'cheer'; } } },
    { id: 'redHood', with: ['kolobok'], place: () => { const Sn = NX.partyRoom.GEO.snack; return [Sn.x0 + 60, Sn.z0 - 44]; }, tick: ({ g, p, k }) => { if (k > 2 && k < 5) p[0].pose = 'roll'; if (k > 4.6 && k < 5.4 && rnd() < .4) splash(g); },
      at: { 1: ({ g }) => say(g, 0), 2: ({ p }) => say(p[0], 0), 5: ({ g }) => { look(g); say(g, 1); }, 8: ({ g }) => { g.pose = 'cheer'; glitter(g, ['#3bff8a', '#9af6ff']); }, 10: ({ g }) => say(g, 2) } },
    { id: 'whiteRabbit', with: ['sherlock'], place: null, tick: ({ g, k }) => { if (k > 1 && k < 2.5) g.pose = 'watch'; if (k > 2.5 && k < 5) { g.pose = 'run'; g.x += 40 * .016 * (k < 4 ? 1 : -1); } if (k > 5 && k < 7 && rnd() < .3) glitter(g, ['#ffe27a']); },
      at: { 1: ({ g }) => say(g, 0), 5: ({ g }) => { look(g); flash(); }, 6: ({ g }) => say(g, 1), 8: ({ p }) => say(p[0], 4), 10: ({ g }) => { g.pose = 'cheer'; say(g, 2); } } },
    { id: 'pussBoots', with: ['firebird'], place: null, tick: ({ g, k }) => { if (k > 1 && k < 3) g.pose = 'bow'; if (k > 3 && k < 6) foamAt(g.x, g.z, 4); if (k > 6 && k < 8) g.pose = 'search'; },
      at: { 1: ({ g }) => say(g, 0), 6: ({ g }) => { look(g); say(g, 1); }, 9: ({ g }) => { g.pose = 'cheer'; say(g, 2); }, 10: ({ p }) => say(p[0], 3) } },
    { id: 'quixote', with: ['mavka'], place: null, tick: ({ g, k }) => { if (k > 1.5 && k < 4) { g.pose = 'charge'; g.z -= 30 * .016; } if (k > 4 && k < 7) g.pose = 'fall'; if (k > 4 && k < 4.3) flash(); },
      at: { 1: ({ g }) => say(g, 0), 4: ({ p }) => { say(p[0], 3); }, 7: ({ g }) => { look(g); say(g, 1); }, 10: ({ g }) => { g.pose = 'cheer'; say(g, 2); } } },
    { id: 'robinHood', with: ['tinMan'], place: null, tick: ({ g, k }) => { if (k > 1.5 && k < 4) g.pose = 'aim'; },
      at: { 1: ({ g }) => say(g, 0), 4: ({ g }) => { glitter(g, ['#ff4fd8', '#3be8ff', '#ffe27a']); }, 4.5: ({ g }) => { look(g); say(g, 1); }, 7: ({ p }) => say(p[0], 3), 10: ({ g }) => { g.pose = 'cheer'; say(g, 2); } } },
    { id: 'mavka', with: ['genie'], place: null, tick: ({ g, p, k }) => { if (k > 1 && k < 6) { g.pose = 'bloom'; if (rnd() < .3) glitter(g, ['#d8ff6a', '#ff8fd0', '#ffffff']); } if (k > 3 && k < 6) p[0].pose = 'cast'; if (k > 5.5 && k < 6.5) foamAt(g.x, g.z, 4); },
      at: { 1: ({ g }) => say(g, 0), 3: ({ p }) => say(p[0], 3), 6.5: ({ g }) => { look(g); say(g, 1); }, 10: ({ g }) => { g.pose = 'cheer'; say(g, 2); } } },    { id: 'stNicholas', with: ['redHood', 'pinocchio'], place: null, tick: ({ g, p, k }) => { if (k > 1 && k < 6) { g.pose = 'give'; if (rnd() < .1) glitter(p[Math.floor(k) % 2], ['#ffe27a', '#ff4fd8']); } if (k > 2 && k < 6) p.forEach(q => { q.pose = 'cheer'; }); },
      at: { 1: ({ g }) => say(g, 0), 3: ({ p }) => say(p[0], 3), 6.5: ({ g }) => { look(g); say(g, 1); }, 10: ({ g }) => { g.pose = 'cheer'; say(g, 2); } } },
    { id: 'merlin', with: ['pinocchio'], place: null, tick: ({ g, k }) => { if (k > 1.5 && k < 5) { g.pose = 'cast'; if (rnd() < .3) glitter(g, ['#9af6ff', '#e2c4ff']); } },
      at: { 1: ({ g }) => say(g, 0), 5: ({ g }) => { look(g); say(g, 1); flash(); }, 7: ({ p }) => say(p[0], 3), 10: ({ g }) => { g.pose = 'cheer'; say(g, 2); } } },
    { id: 'genie', with: ['snegurka', 'whiteRabbit'], place: null, tick: ({ g, p, k }) => { g.alt = 30 + Math.sin(k * 2) * 6; if (k > 1.5 && k < 6) { g.pose = 'cast'; if (rnd() < .2) glitter(p[Math.floor(k) % 2], ['#ffe27a', '#d4b8ff']); } else g.pose = 'float'; },
      at: { 1: ({ g }) => say(g, 0), 3: ({ p }) => say(p[0], 3), 6: ({ g }) => { look(g); say(g, 1); }, 10: ({ g }) => say(g, 2) } },
    { id: 'tinMan', with: ['snowWhite'], place: null, tick: ({ g, k }) => { if (k > 1 && k < 5) { g.pose = 'rust'; if (rnd() < .1) glitter(g, ['#ffd27a']); } },
      at: { 1: ({ g }) => say(g, 0), 3: ({ p }) => say(p[0], 3), 5.5: ({ g }) => { look(g); say(g, 1); }, 9: ({ g, p }) => { g.pose = 'cheer'; p[0].pose = 'cheer'; say(g, 2); } } },
    { id: 'snegurka', with: ['firebird'], place: null, tick: ({ g, p, k }) => { if (k > 1 && k < 4) { g.pose = 'frost'; if (rnd() < .3) glitter(g, ['#ffffff', '#bfe6ff']); } if (k > 3.5 && k < 6) { p[0].alt = 40 + Math.sin(k * 4) * 6; if (rnd() < .3) fire(p[0], 2); } if (k > 5 && k < 6.5 && rnd() < .3) splash(g, '#bfe6ff'); },
      at: { 1: ({ g }) => say(g, 0), 3.5: ({ p }) => say(p[0], 3), 6.5: ({ g }) => { look(g); say(g, 1); flash(); }, 10: ({ g }) => { g.pose = 'cheer'; say(g, 2); } } },    { id: 'cheshire', with: ['sherlock', 'whiteRabbit'], place: null, tick: ({ g, k }) => { g.pose = 'sit'; if (k > 1 && k < 9 && Math.floor(k * 2) !== g.lastJ) { g.lastJ = Math.floor(k * 2); const [x, z] = Pp.floorXZ(.2 + rnd() * .6, .2 + rnd() * .6); glitter(g, ['#b48aff', '#ffffff']); g.x = x; g.z = z; glitter(g, ['#b48aff', '#ffffff']); } },
      at: { 1: ({ g }) => say(g, 3), 5: ({ p }) => say(p[0], 5), 9: ({ g }) => say(g, 4), 11: ({ p }) => { p[0].pose = 'cheer'; p[1].pose = 'cheer'; } } },
    { id: 'kolobok', with: ['babaYaga'], place: () => { const Sn = NX.partyRoom.GEO.snack; return [Sn.x0 + 220, Sn.z0 - 36]; }, tick: ({ g, k }) => { if (k > 1 && k < 4) { g.pose = 'roll'; g.alt = Math.abs(Math.sin(k * 8)) * 10; } else g.alt = 0; if (k > 4 && k < 4.5 && rnd() < .5) splash(g, '#7a4a2a'); },
      at: { 1: ({ g }) => say(g, 0), 4.5: ({ g }) => { look(g); say(g, 1); }, 7: ({ p }) => say(p[0], 3), 10: ({ g }) => say(g, 2) } },
    { id: 'firebird', with: ['cinderella'], place: () => { const B = NX.partyRoom.GEO.bar; return [B.x0 + 80, B.z0 - 80]; }, tick: ({ g, k }) => { if (k < 5) { g.pose = 'fly'; g.alt = 30 + Math.sin(k * 3) * 8; } else g.alt = Math.max(0, g.alt - 60 * .016); if (k > 4.6 && k < 5.4 && rnd() < .5) splash(g, '#ff4fd8'); },
      at: { 1: ({ g }) => say(g, 0), 5.5: ({ g }) => { look(g); say(g, 1); }, 8: ({ p }) => say(p[0], 3), 10: ({ g }) => say(g, 2) } },
    { id: 'gorynych', with: ['merlin'], place: () => { const B = NX.partyRoom.GEO.bar; return [B.x0 + 160, B.z0 - 70]; }, tick: ({ g, k }) => { if (k > 1 && k < 5 && Math.floor(k * 3) % 3 === 0) g.pose = 'sneeze'; else if (k < 6) g.pose = 'stand'; if (k > 2 && k < 5 && rnd() < .1) fire(g, 2); },
      at: { 1: ({ g }) => say(g, 0), 3: ({ p }) => say(p[0], 3), 6: ({ g }) => { look(g); say(g, 1); }, 10: ({ g }) => say(g, 2) } },
  ];

  const busy = g => g.sc || g.trip || g.up || g.pouf || g.rest || g.conga || g.photo || g.hockey || g.sing || g.fan || g.y != null;
  /** Початок вечірки (party.js roster). full — зібрано всіх 20: це глава «ПАТІ» — заставка, далі сценки; інакше — звичайна вечірка без сценок. */
  function start(P_, full) { Pp = P_ || Pp; SH.on = true; SH.full = !!full; SH.t0 = NX.time; SH.act = []; SH.queue = []; SH.next = NX.time + TITLE_T + 3 + rnd() * 3; if (full && NX.nexi) NX.nexi.emote('love', 2); }
  function stop() { SH.act.slice().forEach(end); SH.on = false; }
  /** Кінець сценки: учасники вільні — далі їх веде party.js (танець там, де стоять). */
  function end(sc) {
    [sc.g, ...sc.p].forEach(g => { g.sleep = false; g.pose = 'stand'; g.rot = 0; g.sx = 1; g.alt = g.fly ? 30 : 0; g.sc = null; g.mv = false; g.tx = g.x; g.tz = g.z; g.next = NX.time + 3 + rnd() * 5; });
    SH.act = SH.act.filter(q => q !== sc); SH.next = Math.max(SH.next, NX.time + 5 + rnd() * 6);
  }
  /** Спробувати почати наступну сценку з черги: герой і партнери вільні, місце не поруч з іншою сценкою. */
  function tryStart(t) {
    if (!SH.queue.length) SH.queue = SCENES.map((_, i) => i).sort(() => rnd() - .5);
    const D = Pp.G().dance, g0 = Pp.G();
    for (let qi = 0; qi < SH.queue.length; qi++) {
      const def = SCENES[SH.queue[qi]], g = byId(def.id), p = def.with.map(byId).filter(Boolean); if (!g || p.length < def.with.length || busy(g) || p.some(busy)) continue;
      let [px, pz] = def.place ? def.place() : [g.x, g.z]; if (!def.place) { px = clamp(px, D.x0 + 56, D.x1 - 56); pz = clamp(pz, D.z0 + 8, D.z1 - 8); }
      if (SH.act.some(a => Math.hypot(a.px - px, a.pz - pz) < 150)) continue;
      const sc = { ...def, g, p, done: {}, arrived: false, t0: t, px, pz }; SH.queue.splice(qi, 1); SH.act.push(sc);
      [g, ...p].forEach(q => { q.sc = sc; q.bub = null; q.mv = false; q.spT = 0; q.pairT = 0; q.cheerT = 0; q.item = null; });
      g.tx = px; g.tz = pz; const side = Math.sign((p[0] ? p[0].x : px + 1) - px) || 1;
      p.forEach((q, i) => { q.tx = clamp(px + (i ? -side : side) * 46, g0.XL + 40, g0.XR - 40); q.tz = pz + (i ? 8 : -4); });
      return;
    }
  }
  /** Кадр (party.js director): почати нову сценку, вести ті, що йдуть. */
  function tick(t, dt) {
    if (!SH.on || !Pp || !SH.full) return;   // сценки й нові образи — лише в главі «ПАТІ» (20/20)
    const max = Pp.S.list.length >= 12 ? 2 : 1; if (t > SH.next && SH.act.length < max) { SH.next = t + 4 + rnd() * 5; tryStart(t); }
    SH.act.slice().forEach(sc => {
      const all = [sc.g, ...sc.p];
      if (!sc.arrived) {                                                           // партнери підходять кроком (герой уже на місці або поруч)
        let ok = true; all.forEach(q => { q.rot = 0; q.sx = 1; q.alt = q.fly ? 30 : 0; if (!walk(q, q.tx, q.tz, 60, dt)) ok = false; });
        if (ok) { sc.arrived = true; sc.t0 = t; sc.g.dir = sc.p[0] && sc.p[0].x > sc.g.x ? 1 : -1; sc.p.forEach(q => { q.dir = q.x > sc.g.x ? -1 : 1; }); } else if (t - sc.t0 > 14) end(sc);
        return;
      }
      const k = t - sc.t0, ctx = { g: sc.g, p: sc.p, k, dt }; all.forEach(q => { q.rot = 0; q.sx = 1; if (!q.fly) q.alt = Math.max(0, q.alt || 0); if (q.pose === 'run' || q.pose === 'walk') q.pose = 'stand'; });
      if (sc.tick) sc.tick(ctx);
      Object.keys(sc.at).forEach(key => { if (!sc.done[key] && k >= +key) { sc.done[key] = true; sc.at[key](ctx); } });
      if (k > SCENE_T) end(sc);
    });
  }
  /** Напис ПАТІ (заставка на вході, коли зібрано всіх 20 — початок глави «ПАТІ»; власник, 13.11: «заставка паті має з'являтися все ж»): великий неоновий текст з мерехтінням, обвідкою й зірками. */
  function drawTitle(c, vw, vh, t) {
    if (!SH.on || !SH.full || t - SH.t0 > TITLE_T) return; const k = (t - SH.t0) / TITLE_T, a = k < .15 ? k / .15 : k > .8 ? (1 - k) / .2 : 1, s = NX.t('show.title');
    c.save(); c.globalAlpha = a; c.fillStyle = 'rgba(3,2,10,.55)'; c.fillRect(0, 0, vw, vh); const fs = Math.min(72, vw / 6), y = vh * .42, fl = Math.floor(t * 9) % 11 === 0 ? .5 : 1;
    c.font = `${fs}px "Press Start 2P", monospace`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.shadowColor = '#ff4fd8'; c.shadowBlur = 40 * fl; c.fillStyle = '#ff4fd8'; c.fillText(s, vw / 2, y); c.shadowBlur = 0; c.fillStyle = '#ffffff'; c.globalAlpha = a * .9 * fl; c.fillText(s, vw / 2, y - 3);
    c.globalAlpha = a; c.font = `${Math.min(14, vw / 28)}px "Press Start 2P", monospace`; c.fillStyle = '#ffe27a'; c.fillText(NX.t('show.sub'), vw / 2, y + fs * .9);
    for (let i = 0; i < 12; i++) { const ph = (t * .6 + i / 12) % 1, sx = vw / 2 + Math.cos(i * 2.1 + t) * (fs * 3), sy = y + Math.sin(i * 1.7 + t * .8) * fs * 1.2; c.fillStyle = Pp.NEON[i % 6]; c.globalAlpha = a * (1 - ph); c.fillRect(sx, sy, 4, 4); }
    c.restore();
  }
  return { start, stop, tick, drawTitle, SH, SCENES, get on() { return SH.on; } };
})();
