/* ============================================================================
 * actors/guests/guests.js — ГОСТІ З ПОРТАЛУ (крок 14)
 * ----------------------------------------------------------------------------
 * Власник: «з портала з'являються рандомні відомі персонажі — не більше трьох за раз, не повторюються (20 персонажів, потім
 * по-новому в рандомному порядку) і щось роблять: Баба Яга підмітає, Білосніжка шукає гнома, на Чеширського кота нападає
 * Рудик — той трохи погуляє, Рудик «цап!», і той утік у портал».
 *   МІШОК: 20 героїв перемішані; беремо по черзі, поки не скінчаться, тоді — нове перемішування (перший з нового — не той,
 *     що був останнім). Разом у кімнаті — щонайбільше MAX (3); новий гість — раз на 20–40 с, перший — за ~25 с після старту.
 *   ГІСТЬ: з'являється на майданчику порталу (вихор крутиться швидше, руни довкола), зіскакує зі сходинок, грає свою сценку
 *     (кроки: go / run — іти підлогою в обхід меблів, fly — летіти, hop — стрибок, act — поза на час, say — репліка, do — дія,
 *     until — чекати), іде назад, заскакує в портал і тане. Сценки — SCENES нижче; малюнки — guest_art.js; тексти —
 *     guests.<id>.n / .s у словниках (4 мови).
 *   Рудик і Nexi беруть участь: Рудик ганяє Колобка й нападає на Чеширського кота, вітається з Котом у чоботях, тікає від
 *     Змія Горинича; Nexi отримує пиріжок, подарунок, чари Мерліна, змащує Залізного Дроворуба (якщо вільний).
 *   Крок 15: на Чеширського кота й від Змія Рудик сердиться — очі червоні (NX.cat.grr); полює на вірус — гості його не кличуть.
 *   Крок 15.1: погоня за Чеширським котом і Колобком, поклон Кота в чоботях, Змій — камера на Рудику (NX.cat.look).
 *   Крок 16: спрайти — HD (guest_art.js, сітка 48×58 × .75); кадр гостя береться щонайбільше 12 разів на секунду з кешу
 *     готових кадрів (guest_art.js: frame — поза, крок, фаза анімації, ніс, черевичок), речі перемальовуються 8 разів.
 * Крок 17 (власник, 03.11): ТАП ПО БРАМІ кличе випадкового гостя (разом — не більше трьох); підказки «з порталу: …» немає —
 *   гості просто з'являються; ТАП ПО ГОСТЮ — своя репліка (guests.<id>.t, по черзі) і своя дія (TAP: Яга мете, Піноккіо бреше —
 *   ніс росте, Дон Кіхот атакує й падає, Чеширський кіт тане, Горинич чхає…), після якої гість продовжує свою сценку.
 * Крок 19 (власник: «появу та зникнення героїв — більш красиво»): ТЕЛЕПОРТ — спалах з променями у вихорі, кільце енергії
 *   на майданчику (розходиться / сходиться), гість матеріалізується рядками знизу вгору (верхній фронт тремтить, кольоровий
 *   зсув, світна лінія сканера, світний силует), іскри злітаються до тіла; зникнення — те саме навпаки й спалах у кінці.
 * КОЛЕКЦІЯ Й ВЕЧІРКА (власник, 04.11: «прийшов гість, ми на нього натиснули — і він з'явився в колекції; коли він уже пішов,
 *   він з'являється в нас на вечірці; паті-кімната, де вони всі танцюють, з'явиться, коли Nexi відправиться в портал»):
 *   ТАП ПО ГОСТЮ, крім репліки й дії, кладе його в колекцію (localStorage nx.guests; значок «У КОЛЕКЦІЇ ✓» злітає над ним —
 *   лише першого разу); ТАП ПО БРАМІ тепер — Nexi йде у вихор на вечірку (activities.js: party → party.js), а не кличе гостя
 *   (summon лишився для коду: NX.guests.summon()). На вечірці — спіймані гості, яких зараз немає в кімнаті (atParty()).
 * Наведення — ім'я (ui/input.js). Для перевірки: NX.guests.spawn(id), NX.guests.demo(), NX.guests.collectAll().
 * ========================================================================== */
NX.guests = (() => {
  const IDS = ['babaYaga', 'snowWhite', 'cheshire', 'redHood', 'whiteRabbit', 'kolobok', 'pinocchio', 'pussBoots', 'quixote', 'sherlock',
    'robinHood', 'munchausen', 'firebird', 'stNicholas', 'cinderella', 'merlin', 'genie', 'tinMan', 'silver', 'gorynych'];
  const MAX = 3, S = { list: [], bag: [], last: null, next: 25, props: [], fx: [], on: true };
  // ---------- КОЛЕКЦІЯ (хто вже спійманий тапом) — у цьому браузері ----------
  const KEY = 'nx.guests'; let COL = []; try { COL = (JSON.parse(localStorage.getItem(KEY) || '[]') || []).filter(id => IDS.includes(id)); } catch (e) {}
  const saveCol = () => { try { localStorage.setItem(KEY, JSON.stringify(COL)); } catch (e) {} };
  /** Спіймати гостя (тап): новий — у колекцію, значок і феєрверк іскор над ним. */
  function collect(g) {
    if (COL.includes(g.id)) return false; COL.push(g.id); saveCol();
    S.fx.push({ type: 'badge', x: g.x, y: g.y - g.alt - 58, t0: NX.time, dur: 2.2 });
    for (let i = 0; i < 14; i++) NX.fx.emit('spark', g.x + (rnd() - .5) * 36, g.y - g.alt - 20 - rnd() * 40, { col: i % 3 ? '#ffe27a' : '#9af6ff', vy: 30 });
    return true;
  }
  const collection = () => COL.slice();
  /** Хто зараз на вечірці: спіймані, яких немає в кімнаті (пішли назад у портал). */
  const atParty = () => COL.filter(id => !S.list.some(g => g.id === id));
  const P = NX.px, A = NX.guestArt, t_ = (k, o) => NX.t(k, o), rnd = Math.random;
  const zone = () => NX.arc && NX.arc.zone && NX.arc.zone('portal');
  /** Точки порталу на екрані: майданчик під аркою (де з'являються) і підлога перед брамою. */
  const pad = () => { const p = zone().S(100, 316, 30); return [p[0], p[1]]; };
  const front = () => NX.room.clampWalk(...zone().S(100, 352, -30), 'nexi');
  const free = (x, y) => NX.room.freeAt(...NX.room.clampWalk(x, y, 'nexi'), 'nexi');
  /** Випадкова точка підлоги в середній смузі кімнати (не біля самих країв). */
  const anyPt = () => { const B = NX.room.walkBounds(); return free(160 + rnd() * 1240, B.minY + 12 + rnd() * Math.min(110, B.maxY - B.minY - 20)); };
  const nexiFree = () => { const n = NX.nexi; return !n.cur && !n.queue.length && (n.loc === 'floor' || n.loc === 'dock') && n.dy == null; };
  const nearNexi = g => { const n = NX.nexi; return nexiFree() ? free(n.x + (n.x > g.x ? -34 : 34), n.y) : free(NX.objects.rug.home[0] + 60, NX.objects.rug.home[1]); };
  const nearCat = () => { const [cx, cy] = NX.cat.floorPos(); return free(cx + (cx > 774 ? -30 : 30), Math.max(cy, 380)); };

  // ============================ СЦЕНКИ ============================
  // кожна — функція (g) -> кроки між «зіскочив з порталу» і «пішов назад» (flyer: true — прилітає й відлітає сам)
  const dust = g => () => rnd() < .3 && NX.fx.emit('dust', g.x + g.dir * (14 + rnd() * 10), g.y - 2);
  /** Nexi реагує (емоція, повертається до гостя), якщо вільний — крок 26 (власник: у кожного гостя — коротка взаємодія з Nexi). */
  const nexiRe = (g, em, dur = 2) => () => { if (!nexiFree()) return; const n = NX.nexi; n.emote(em, dur); n.dir = g.x > n.x ? 1 : -1; };
  const overNexi = () => { const n = NX.nexi; return [n.x, Math.max(n.y, NX.room.walkBounds().minY + 10)]; };
  const SCENES = {
    babaYaga: { flyer: true, steps: g => [{ hop: front() }, { go: anyPt() }, { act: 'sweep', dur: 3.2, tick: dust(g) }, { say: 0 }, { go: nearNexi(g) }, { act: 'sweep', dur: 2.2, tick: dust(g), start: nexiRe(g, 'surprise', 2.4) }, { say: 1 },
      { fly: pad(), alt: 46, pose: 'ride', speed: 120 }] },
    snowWhite: { steps: g => { const hide = free(...(rnd() < .5 ? [NX.cfg.SOFA.x + 150, NX.cfg.SOFA.y + 70] : [520, 400])); g.comp = { id: 'dwarf', x: hide[0], y: hide[1], dir: -1, pose: 'stand', hidden: true };
      return [{ go: anyPt() }, { act: 'search', dur: 1.6 }, { say: 0 }, { go: anyPt() }, { act: 'search', dur: 1.2 }, { go: free(hide[0] + 30, hide[1] + 6) }, { face: hide[0] },
        { do: () => { g.comp.hidden = false; g.comp.pose = 'cheer'; NX.fx.emit('heart', hide[0], hide[1] - 30); } }, { act: 'cheer', dur: 1.6 }, { say: 1 }, { do: () => { g.comp.follow = true; g.comp.pose = 'walk'; } }]; } },
    cheshire: { steps: g => [{ go: anyPt() }, { act: 'sit', dur: 2 }, { say: 0 }, { go: anyPt() }, { act: 'sit', dur: .6 },
      { do: () => { if (!NX.cat.free()) return; const side = NX.cat.x < g.x ? -1 : 1; g.dir = side; NX.cat.grr(6); NX.cat.look(10);    // суперник! очі червоні (крок 15), камера — на Рудика
        NX.cat.goTo(g.x + side * 18, g.y, () => { g.caught = true; NX.cat.grr(2.2); NX.cat.look(2.6, null, true); NX.cat.set('pounce', .5, () => NX.cat.set('meow', 1.6)); }, null, true); } },   // «цап!» і шипить
      { until: () => g.caught, max: 10, pose: 'sit' }, { say: 1 }, { do: () => { g.fade = .45; } }] , speed: 1.4, runBack: true },
    redHood: { steps: g => [{ go: nearNexi(g) }, { face: () => NX.nexi.x }, { act: 'give', dur: 2.2, start: () => { NX.nexi.emote('love', 2); NX.fx.emit('heart', g.x + g.dir * 16, g.y - 40); } }, { say: 0 }, { act: 'cheer', dur: 1 }] },
    whiteRabbit: { speed: 1.8, steps: g => [{ run: anyPt() }, { act: 'watch', dur: 1.6 }, { say: 0 }, { run: nearNexi(g) }, { face: () => NX.nexi.x }, { act: 'watch', dur: 1.4, start: nexiRe(g, 'surprise', 2.2) }, { run: anyPt() }, { act: 'watch', dur: .6 }], runBack: true },   // показує годинник Nexi
    kolobok: { speed: 1.4, steps: g => [{ go: nearNexi(g), pose: 'roll' }, { act: 'roll', dur: .8, start: nexiRe(g, 'happy', 2) }, { go: anyPt(), pose: 'roll' }, { say: 0 }, { act: 'roll', dur: 1, tick: () => rnd() < .12 && NX.fx.emit('note', g.x, g.y - 22) }, { go: anyPt(), pose: 'roll' },
      { do: () => { if (!NX.cat.free()) return; NX.cat.look(8); NX.cat.goTo(g.x, g.y, () => { NX.cat.look(2.4, null, true); NX.cat.set('pounce', .5, () => NX.cat.set('meow', 1.4)); }, null, true); } }, { say: 1 }, { wait: .5 }], runBack: true, rollBack: true },
    pinocchio: { steps: g => [{ go: nearNexi(g) }, { face: () => NX.nexi.x }, { say: 0 }, { act: 'stand', dur: 2.6, start: () => NX.nexi.emote('surprise', 2.5), tick: dt => { g.nose = Math.min(9, (g.nose || 0) + dt * 4); } },
      { act: 'cheer', dur: 1, end: () => { g.nose = 0; } }] },
    pussBoots: { steps: g => [{ go: nearCat() }, { face: () => NX.cat.x }, { act: 'bow', dur: 2.2, start: () => { if (NX.cat.free()) { NX.cat.purr(3); NX.cat.look(4, () => (NX.cat.x + g.x) / 2); } } }, { say: 0 }, { go: nearNexi(g) }, { face: () => NX.nexi.x }, { act: 'bow', dur: 1.6, start: nexiRe(g, 'love', 2) }, { act: 'stand', dur: .4 }] },   // і Nexi кланяється
    quixote: { steps: g => [{ go: anyPt() }, { face: 1000 }, { say: 0 }, { run: free(1000 + rnd() * 80, 372), pose: 'charge' }, { act: 'fall', dur: 1.8, start: () => { for (let i = 0; i < 8; i++) NX.fx.emit('spark', g.x + g.dir * 16, g.y - 30); nexiRe(g, 'surprise', 2.4)(); } },
      { say: 1 }, { act: 'stand', dur: .6 }] },
    sherlock: { steps: g => [{ go: nearCat() }, { act: 'inspect', dur: 2.4, tick: dust(g) }, { say: 0 }, { go: nearNexi(g) }, { face: () => NX.nexi.x }, { act: 'inspect', dur: 2, start: nexiRe(g, 'surprise', 2.4) }, { say: 1 }, { act: 'stand', dur: .6 }] },   // оглядає Nexi з лупою
    robinHood: { steps: g => { const b = NX.objects.ball; return [{ go: free(b.x + (b.x > 774 ? -110 : 110), b.y) }, { face: () => b.x }, { act: 'aim', dur: 1.4 },
      { do: () => { S.fx.push({ type: 'arrow', x0: g.x + g.dir * 22, y0: g.y - 38, x1: b.x, y1: b.y - 6, t0: NX.time, dur: .35, then: () => { b.kick(g.dir * 260, (rnd() - .5) * 90); for (let i = 0; i < 6; i++) NX.fx.emit('spark', b.x, b.y - 6); } }); } },
      { act: 'aim', dur: .6 }, { say: 0 }, { act: 'cheer', dur: 1 }]; } },
    munchausen: { flyer: true, steps: g => { const B = NX.room.walkBounds(), far = free(250 + rnd() * 300, B.minY + 70); return [{ fly: far, alt: 70, pose: 'ride', speed: 170, smoke: 1 }, { say: 0 }, { fly: overNexi(), alt: 95, pose: 'ride', speed: 170, smoke: 1 }, { act: 'ride', dur: 1, alt: 95, start: nexiRe(g, 'surprise', 2) },
      { fly: pad(), alt: 60, pose: 'ride', speed: 170, smoke: 1 }]; } },
    firebird: { flyer: true, steps: g => { const pts = [anyPt(), anyPt(), anyPt()]; return [{ fly: pts[0], alt: 95, pose: 'fly', speed: 150, trail: 1 }, { fly: pts[1], alt: 70, pose: 'fly', speed: 150, trail: 1 },
      { do: () => S.props.push({ type: 'feather', x: pts[1][0], y: pts[1][1], until: NX.time + 30 }) }, { say: 0 }, { fly: overNexi(), alt: 90, pose: 'fly', speed: 150, trail: 1 }, { act: 'fly', dur: 1.4, alt: 90, start: nexiRe(g, 'love', 2.2), tick: () => rnd() < .4 && NX.fx.emit('spark', g.x + (rnd() - .5) * 30, g.y - 60, { col: '#ffd27a', vy: 40 }) }, { fly: pts[2], alt: 110, pose: 'fly', speed: 150, trail: 1 }, { fly: pad(), alt: 60, pose: 'fly', speed: 150, trail: 1 }]; } },
    stNicholas: { steps: g => { const h = NX.objects.rug.home, gp = free(h[0] - 70 + rnd() * 140, h[1] + 20); return [{ go: free(gp[0] + 26, gp[1]) }, { face: gp[0] },
      { act: 'give', dur: 1.6, start: () => S.props.push({ type: 'gift', x: gp[0], y: gp[1], until: NX.time + 40 }) }, { say: 0 }, { act: 'cheer', dur: 1, start: () => NX.nexi.emote('love', 2) }]; } },
    cinderella: { steps: g => [{ go: free(NX.objects.rug.home[0] + (rnd() - .5) * 200, NX.objects.rug.home[1] - 10) }, { act: 'twirl', dur: 3, start: nexiRe(g, 'love', 3), tick: () => rnd() < .2 && NX.fx.emit('spark', g.x + (rnd() - .5) * 30, g.y - 20 - rnd() * 30, { col: '#ffffff' }) },
      { say: 0 }, { do: () => { g.g.lostShoe = true; S.props.push({ type: 'shoe', x: g.x + g.dir * 8, y: g.y + 2, until: NX.time + 35 }); } }], runBack: true },
    merlin: { steps: g => [{ go: nearNexi(g) }, { face: () => NX.nexi.x }, { act: 'cast', dur: 2.6, start: () => NX.nexi.emote('surprise', 2.5),
      tick: () => { const n = NX.nexi; if (rnd() < .35) NX.fx.emit('spark', n.x + (rnd() - .5) * 50, n.y - 70 - rnd() * 30, { col: rnd() < .5 ? '#9af6ff' : '#e2c4ff', vy: 20 }); if (rnd() < .2) NX.fx.emit('snow', n.x + (rnd() - .5) * 60, n.y - 90); } }, { say: 0 }, { act: 'stand', dur: .8 }] },
    genie: { flyer: true, steps: g => { const sp = anyPt(); return [{ fly: sp, alt: 8, pose: 'float', speed: 120 }, { do: () => { g.lamp = { type: 'lamp', x: sp[0] + 4, y: sp[1] + 1, until: Infinity }; S.props.push(g.lamp); } },
      { say: 0 }, { act: 'cast', dur: 1.8, alt: 8, start: () => { NX.city && NX.city.fireworks && NX.city.fireworks(9); nexiRe(g, 'love', 2.5)(); } }, { say: 1 }, { act: 'float', dur: 1.4, alt: 8 },
      { do: () => { if (g.lamp) g.lamp.until = NX.time; } }, { fly: pad(), alt: 20, pose: 'float', speed: 120 }]; } },
    tinMan: { steps: g => [{ go: nearNexi(g) }, { act: 'rust', dur: 1.2 }, { say: 0 }, { do: () => { if (nexiFree()) { const n = NX.nexi; NX.nexi.walkTo(g.x + (n.x > g.x ? 30 : -30), g.y); g.helped = true; } } },
      { until: () => !g.helped || (!NX.nexi.cur && !NX.nexi.queue.length), max: 7, pose: 'rust' },
      { act: 'rust', dur: 1.2, start: () => { for (let i = 0; i < 6; i++) NX.fx.emit('bubble', g.x - g.dir * 6, g.y - 34 + i * 3, { col: '#ffd27a' }); if (g.helped) NX.nexi.emote('happy', 2); } },
      { act: 'cheer', dur: 1.6 }, { say: 1 }] },
    silver: { steps: g => [{ go: anyPt() }, { act: 'dig', dur: 3, tick: dust(g) }, { do: () => { nexiRe(g, 'surprise', 2.2)(); g.carry = { type: 'chest', x: g.x + g.dir * 18, y: g.y + 1, until: Infinity }; S.props.push(g.carry); } },
      { say: 0 }, { act: 'cheer', dur: 1.2 }, { say: 'p' }, { do: () => { if (g.carry) g.carry.follow = g; } }] },
    gorynych: { steps: g => [{ go: anyPt() }, { act: 'stand', dur: 1 }, { act: 'sneeze', dur: 1.3, start: () => { for (let i = 0; i < 10; i++) NX.fx.emit('fire', g.x + g.dir * 34, g.y - 50); nexiRe(g, 'surprise', 2)(); } }, { say: 0 },
      { do: () => { const c = NX.cat; if (Math.abs(c.x - g.x) < 260 && c.alt === 0 && c.free()) { c.grr(1.6); c.look(3.6); c.goTo(...free(c.x + (c.x > g.x ? 160 : -160), c.y + 20), () => c.set('sit', 2), null, true); } } }, { act: 'stand', dur: .8 }] },   // сердито тікає
  };

  // ============================ ГІСТЬ ============================
  function make(id) {
    const sc = SCENES[id], p = pad(), g = { id, x: p[0], y: p[1], dir: -1, pose: 'stand', fr: 0, ft: 0, alt: 0, alpha: 0, zoom: .25, g: {}, cv: document.createElement('canvas'), q: [], cur: null, onPad: true, speed: sc.speed || 1 };
    const back = sc.flyer ? [] : sc.rollBack ? [{ run: front(), pose: 'roll' }, { hop: p }] : [{ [sc.runBack ? 'run' : 'go']: front() }, { hop: p }];   // назад: до брами, на майданчик
    g.q = [{ appear: 1.9 }, ...(sc.flyer ? [] : [{ hop: front() }]), ...sc.steps(g), ...back, { vanish: 1.6 }];
    S.portalT = NX.time + 2; if (nexiFree()) NX.nexi.emote(['surprise', 'happy', 'idea'][Math.random() * 3 | 0], 2);
    return g;                                                                                                             // підказки «з порталу: …» немає (власник, 03.11): гостя просто видно
  }
  /** Наступний гість із мішка (20 героїв без повторів; скінчились — нове перемішування). */
  function pick() {
    if (!S.bag.length) { S.bag = IDS.slice(); for (let i = S.bag.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [S.bag[i], S.bag[j]] = [S.bag[j], S.bag[i]]; }
      if (S.bag[S.bag.length - 1] === S.last) S.bag.unshift(S.bag.pop()); }
    let id = S.bag.pop(); if (S.list.some(g => g.id === id) && S.bag.length) { S.bag.unshift(id); id = S.bag.pop(); }
    return S.last = id;
  }
  const say = (g, k) => { const L = k === 'p' ? t_(`guests.${g.id}.p`) : (NX.t(`guests.${g.id}.s`) || [])[k]; if (L) g.bub = { text: L, until: NX.time + 2.6, parrot: k === 'p' }; };
  /** Репліка на тап (guests.<id>.t — по черзі, без повторів поспіль). */
  const sayTap = g => { const L = NX.t(`guests.${g.id}.t`) || NX.t(`guests.${g.id}.s`) || []; if (!L.length) return; g.ti = ((g.ti == null ? Math.random() * L.length | 0 : g.ti + 1)) % L.length; g.bub = { text: L[g.ti], until: NX.time + 2.8 }; };
  // ---------- ТАП ПО ГОСТЮ (крок 17): своя дія кожного — вставляється в чергу перед поточним кроком ----------
  const sparks = (g, n, col, dy = 40) => { for (let i = 0; i < n; i++) NX.fx.emit('spark', g.x + (rnd() - .5) * 30, g.y - dy - rnd() * 20, { col: typeof col === 'function' ? col() : col }); };
  const TAP = {
    babaYaga: g => [{ act: 'sweep', dur: 1.6, tick: dust(g) }],
    snowWhite: g => [{ act: 'cheer', dur: 1.2, start: () => { NX.fx.emit('heart', g.x, g.y - 44); if (g.comp && !g.comp.hidden) g.comp.pose = 'cheer'; } }],
    cheshire: g => [{ act: 'sit', dur: 2.4, start: () => { g.fade = .7; }, end: () => { g.fade = 0; } }],                   // тане й повертається
    redHood: g => [{ act: 'give', dur: 1.4, start: () => NX.fx.emit('heart', g.x + g.dir * 16, g.y - 40) }],
    whiteRabbit: g => [{ act: 'watch', dur: 1.3 }, { act: 'run', dur: .5 }],
    kolobok: g => [{ act: 'roll', dur: 1.2, tick: () => rnd() < .2 && NX.fx.emit('note', g.x, g.y - 22) }],
    pinocchio: g => [{ act: 'stand', dur: 1.8, tick: dt => { g.nose = Math.min(9, (g.nose || 0) + dt * 5); }, end: () => { g.nose = 0; } }],
    pussBoots: g => [{ act: 'bow', dur: 1.6 }],
    quixote: g => [{ act: 'charge', dur: .9 }, { act: 'fall', dur: 1.4, start: () => sparks(g, 6, '#ffe27a', 30) }, { act: 'stand', dur: .3 }],
    sherlock: g => [{ act: 'inspect', dur: 1.8, tick: dust(g) }],
    robinHood: g => [{ act: 'aim', dur: 1.3, end: () => { S.fx.push({ type: 'arrow', x0: g.x + g.dir * 22, y0: g.y - 38, x1: g.x + g.dir * 140, y1: g.y - 60, t0: NX.time, dur: .3 }); } }],
    munchausen: g => [{ act: 'ride', dur: 1.6, alt: 22, start: () => { for (let i = 0; i < 6; i++) NX.fx.emit('steam', g.x - g.dir * 12, g.y - 6); } }, { act: 'stand', dur: .2, alt: 0 }],
    firebird: g => [{ act: 'fly', dur: 1.4, alt: g.alt, tick: () => rnd() < .6 && NX.fx.emit('fire', g.x - g.dir * 16, g.y - g.alt - 20) }],
    stNicholas: g => [{ act: 'give', dur: 1.5, start: () => { for (let i = 0; i < 5; i++) NX.fx.emit('snow', g.x + (rnd() - .5) * 40, g.y - 70); } }],
    cinderella: g => [{ act: 'twirl', dur: 1.6, tick: () => rnd() < .3 && NX.fx.emit('spark', g.x + (rnd() - .5) * 30, g.y - 20 - rnd() * 30, { col: '#ffffff' }) }],
    merlin: g => [{ act: 'cast', dur: 1.6, tick: () => rnd() < .4 && NX.fx.emit('spark', g.x + g.dir * 14 + (rnd() - .5) * 20, g.y - 60 - rnd() * 20, { col: rnd() < .5 ? '#9af6ff' : '#e2c4ff', vy: 20 }) }],
    genie: g => [{ act: 'cast', dur: 1.5, alt: g.alt, start: () => sparks(g, 10, () => rnd() < .5 ? '#ffe27a' : '#d4b8ff', 60) }],
    tinMan: g => [{ act: 'rust', dur: 1.4, start: () => { for (let i = 0; i < 4; i++) NX.fx.emit('bubble', g.x - g.dir * 6, g.y - 34 + i * 3, { col: '#ffd27a' }); } }, { act: 'cheer', dur: .8 }],
    silver: g => [{ act: 'dig', dur: 1.6, tick: dust(g) }],
    gorynych: g => [{ act: 'sneeze', dur: 1.2, start: () => { for (let i = 0; i < 8; i++) NX.fx.emit('fire', g.x + g.dir * 34, g.y - 50); } }],
  };
  function tap(g) {
    sayTap(g); NX.fx.emit('heart', g.x, g.y - g.alt - 50); collect(g);
    if (g.busy || !TAP[g.id] || !g.cur || g.cur.appear || g.cur.vanish || g.cur.hop || (g.cur.act && g.cur.start && !g.cur.st)) return;   // під час появи / стрибка — лише репліка
    g.busy = true; const was = g.cur; if (was.go || was.run || was.fly) was.path = null;                                          // хода триває з того ж місця (шлях перерахується)
    const q = TAP[g.id](g).map(a => Object.assign({}, a)); q.push({ do: () => { g.busy = false; } });
    g.q.unshift(was); g.q.unshift(...q); g.cur = null;
  }
  const atPad = g => { const p = pad(); return Math.hypot(g.x - p[0], g.y - p[1]) < 3; };
  /** Крок черги: повертає true, коли зроблено. */
  function step(g, a, dt) {
    a._t = (a._t || 0) + dt;
    if (a.appear || a.vanish) {                                                                              // ТЕЛЕПОРТ (крок 19): спалах у вихорі, матеріалізація рядками знизу вгору
      const k = Math.min(1, a._t / (a.appear || a.vanish)), e = a.appear ? k : 1 - k; g.alpha = 1; g.zoom = 1; g.tp = { k: e, inn: !!a.appear, t0: a._t };
      if (!a.st) { a.st = 1; S.fx.push({ type: 'flash', x: g.x, y: g.y - 30, t0: NX.time, dur: .45 }); S.fx.push({ type: 'ring', x: g.x, y: g.y, t0: NX.time, dur: a.appear ? 1.4 : 1.2, inn: !!a.appear });
        if (a.vanish) g.pose = 'stand'; }
      if (a.vanish && k > .96 && !a.st2) { a.st2 = 1; S.fx.push({ type: 'flash', x: g.x, y: g.y - 30, t0: NX.time, dur: .4 }); }
      for (let i = 0; i < 2; i++) if (Math.random() < .8) { const h = 50 * (a.appear ? e : 1 - e), ang = Math.random() * 6.283, r = 26 + Math.random() * 10;   // іскри: злітаються до тіла (поява) / розлітаються у вихор (зникнення)
        const sx = g.x + Math.cos(ang) * r, sy = g.y - h - Math.sin(ang) * r * .5, tx = g.x, ty = g.y - h; NX.fx.emit('portal', a.appear ? sx : tx, a.appear ? sy : ty, { vx: (a.appear ? tx - sx : sx - tx) * 2.2, vy: (a.appear ? ty - sy : sy - ty) * 2.2, ttl: .45, s: 1.3 }); }
      if (k >= 1) g.tp = null; return k >= 1; }
    if (a.hop) { if (!a.from) a.from = [g.x, g.y]; const k = Math.min(1, a._t / .5); g.x = P.lerp(a.from[0], a.hop[0], k); g.y = P.lerp(a.from[1], a.hop[1], k); g.alt = Math.sin(k * Math.PI) * 12; g.pose = 'stand';
      if (Math.abs(a.hop[0] - a.from[0]) > 2) g.dir = Math.sign(a.hop[0] - a.from[0]); if (k >= 1) { g.alt = 0; g.onPad = atPad(g); } return k >= 1; }
    if (a.go || a.run) {
      const to = a.go || a.run, sp = (a.run ? 76 : 44) * g.speed;
      if (!a.path) { a.path = NX.room.route([g.x, g.y], to, 'nexi'); g.onPad = false; }
      const w = a.path.length > 1 ? a.path[0] : to, dx = w[0] - g.x, dy = w[1] - g.y, d = Math.hypot(dx, dy);
      g.pose = a.pose || (a.run ? 'run' : 'walk'); if (Math.abs(dx) > .5) g.dir = Math.sign(dx);
      if (d < Math.max(2, sp * dt)) { g.x = w[0]; g.y = w[1]; if (a.path.length > 1) a.path.shift(); else return true; }
      else { g.x += dx / d * sp * dt; g.y += dy / d * sp * dt; }
      if (a._t > 25) return true; return false;
    }
    if (a.fly) {
      if (!a.from) { a.from = [g.x, g.y, g.alt]; a.dur = Math.max(.6, Math.hypot(a.fly[0] - g.x, a.fly[1] - g.y) / (a.speed || 120)); g.onPad = false; }
      const k = Math.min(1, a._t / a.dur), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      g.x = P.lerp(a.from[0], a.fly[0], e); g.y = P.lerp(a.from[1], a.fly[1], e); g.alt = P.lerp(a.from[2], a.alt || 0, e) + Math.sin(k * Math.PI) * (a.alt || 0) * .35; g.pose = a.pose || 'fly';
      if (Math.abs(a.fly[0] - a.from[0]) > 2) g.dir = Math.sign(a.fly[0] - a.from[0]);
      if (a.smoke && Math.random() < .5) NX.fx.emit('steam', g.x - g.dir * 14, g.y - g.alt - 8); if (a.trail && Math.random() < .8) NX.fx.emit('fire', g.x - g.dir * 16, g.y - g.alt - 22);
      if (k >= 1) g.onPad = atPad(g); return k >= 1;
    }
    if (a.act) { if (!a.st) { a.st = 1; a.start && a.start(); } g.pose = a.act; if (a.alt != null) g.alt = a.alt; a.tick && a.tick(dt); if (a._t >= a.dur) { a.end && a.end(); return true; } return false; }
    if (a.say != null) { say(g, a.say); return true; }
    if (a.face != null) { const fx = typeof a.face === 'function' ? a.face() : a.face; if (Math.abs(fx - g.x) > 1) g.dir = Math.sign(fx - g.x); return true; }
    if (a.do) { a.do(); return true; }
    if (a.wait) { g.pose = 'stand'; return a._t >= a.wait; }
    if (a.hold) return false;                                                                            // демо: стоїть у своїй позі
    if (a.until) { g.pose = a.pose || 'stand'; return a.until() || a._t >= (a.max || 8); }
    return true;
  }
  function spawn(id) { if (!zone()) return null; const g = make(id || pick()); S.list.push(g); return g; }
  function update(dt, t) {
    if (!zone() || !(NX.boot && NX.boot.done)) return;
    if (S.on && t > S.next && S.list.length < MAX) { spawn(); S.next = t + 20 + Math.random() * 20; }
    const po = NX.objects.portal; if (po) po.active = NX.time < (S.portalT || 0) || S.list.some(g => g.cur && (g.cur.appear || g.cur.vanish));
    S.list.forEach(g => {
      g.ft += dt; if (g.ft > (g.pose === 'run' ? .08 : .13)) { g.ft = 0; g.fr++; }
      if (!g.cur) { g.cur = g.q.shift(); if (g.cur && (g.cur.appear || g.cur.vanish)) S.portalT = NX.time + 1.4; }
      if (!g.cur) { g.dead = true; return; }
      if (step(g, g.cur, dt)) g.cur = null;
      const c = g.comp; if (c && c.follow) { const tx = g.x - g.dir * 20, ty = g.y + 3, dx = tx - c.x, dy = ty - c.y, d = Math.hypot(dx, dy); if (d > 2) { c.x += dx / d * Math.min(d, 60 * dt); c.y += dy / d * Math.min(d, 60 * dt); c.pose = 'walk'; c.dir = Math.sign(dx) || c.dir; } else c.pose = 'stand'; c.fr = g.fr; }
      if (g.bub && t > g.bub.until) g.bub = null;
    });
    S.list = S.list.filter(g => !g.dead);
    S.props = S.props.filter(p => NX.time < p.until || p.follow);
    S.props.forEach(p => { if (p.follow) { const g = p.follow; if (g.dead) { p.until = NX.time; p.follow = null; } else { p.x = g.x + g.dir * 14; p.y = g.y + 1; p.alt = 16; p.alpha = g.alpha; p.zoom = g.zoom; } } });
    S.fx = S.fx.filter(f => { if (NX.time - f.t0 >= f.dur) { f.then && f.then(); return false; } return true; });
  }
  /** Шар гостя: тінь, спрайт (масштаб — як у Nexi за глибиною), репліка над головою. */
  function layerOf(o, id, pose, fr, extra) {
    const [W, H, K] = A.size(id), s = NX.room.scaleAt(o.y) * K * .98 * (o.zoom || 1), w = W * s, h = H * s, top = o.y - (o.alt || 0) - h;
    return { y: o.y + (o.onPad ? -40 : 0), refl: !o.onPad && !(o.alt > 30), box: [o.x - w / 2 - 4, top - 30, o.x + w / 2 + 4, o.y + 4], draw: c => {
      const gx = extra || o.g, tq = Math.floor(NX.time * 12) / 12, key = pose + '|' + fr + '|' + tq + '|' + (gx.nose ? Math.round(gx.nose) : 0) + '|' + (gx.lostShoe ? 1 : 0);   // кадр — щонайбільше 12 разів на секунду; готові кадри — з кешу (guest_art.js: frame)
      if (o._key !== key || !o.img) { o._key = key; o.img = A.frame(id, pose, fr, tq, gx); }
      c.save(); c.globalAlpha = (o.alpha != null ? o.alpha : 1) * (1 - (o.fade || 0));
      c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(o.x, o.y + 1, w * .26 * Math.max(.3, 1 - (o.alt || 0) / 120), 2.2 * s, 0, 0, 7); c.fill();
      c.imageSmoothingEnabled = false; c.translate(o.x, 0); c.scale(o.dir || 1, 1);
      const T = o.tp;
      if (!T) c.drawImage(o.img, -w / 2, top, w, h);
      else {                                                                                             // телепорт: рядки спрайта з'являються знизу вгору (e 0 → 1), з кольоровим зсувом і світною лінією сканера
        const img = o.img, IH = img.height, IW = img.width, e = T.k, yk = h / IH, rows = IH, lim = Math.floor(rows * e), fr = Math.floor(NX.time * 24);
        for (let r = rows - 1; r >= rows - lim; r--) { const sy = r, dy = top + r * yk, nd = (rows - r) - lim, jit = nd > -3 ? (P.hash(fr + r) - .5) * 4 * s : 0;   // верхні 3 рядки тремтять
          c.drawImage(img, 0, sy, IW, 1, -w / 2 + jit, dy, w, yk + .3); }
        if (lim > 0 && lim < rows) { c.globalCompositeOperation = 'lighter'; const r = rows - lim, dy = top + r * yk;                     // кольоровий зсув і лінія сканера на фронті
          c.globalAlpha = .6; c.drawImage(img, 0, r, IW, 3, -w / 2 - 2 * s, dy, w, yk * 3); c.drawImage(img, 0, r, IW, 3, -w / 2 + 2 * s, dy, w, yk * 3);
          c.globalAlpha = 1; c.fillStyle = T.inn ? '#bff8ff' : '#ff9af0'; c.fillRect(-w / 2 - 3 * s, dy - .6, w + 6 * s, 1.2); c.fillStyle = 'rgba(255,255,255,.6)'; c.fillRect(-w / 2, dy + 1, w, .6);
          c.globalCompositeOperation = 'source-over'; }
        c.globalCompositeOperation = 'lighter'; c.globalAlpha = .18 + .25 * Math.sin(NX.time * 20) * e; c.fillStyle = T.inn ? '#9af6ff' : '#ff9af0';                    // світний силует
        for (let r = rows - 1; r >= rows - lim; r--) c.drawImage(img, 0, r, IW, 1, -w / 2, top + r * yk, w, yk + .3);
        c.globalCompositeOperation = 'source-over'; }
      c.restore();
    } };
  }
  /** Репліка: темна плашка з неоновим кантом над головою, текст — піксельним шрифтом (вміщується в будь-якій мові). */
  function bubble(c, g, s, top) {
    const b = g.bub; if (!b) return; let fs = 8; c.save(); c.font = `${fs}px "Press Start 2P", monospace`; let tw = c.measureText(b.text).width;
    if (tw > 190) { fs = Math.max(5, fs * 190 / tw); c.font = `${fs}px "Press Start 2P", monospace`; tw = c.measureText(b.text).width; }
    const pw = tw + 12, ph = fs + 10, bx = P.clamp(g.x - pw / 2 + (b.parrot ? g.dir * 10 : 0), NX.cam.x + 4, NX.cam.x + NX.cam.viewW - pw - 4), by = top - ph - 8;
    c.globalAlpha = Math.min(1, (b.until - NX.time) * 3) * (g.alpha != null ? g.alpha : 1);
    c.fillStyle = '#0a0626ee'; c.fillRect(bx, by, pw, ph); c.strokeStyle = b.parrot ? '#3bff8a' : '#ff7af0'; c.lineWidth = 1; c.strokeRect(bx + .5, by + .5, pw - 1, ph - 1);
    c.fillStyle = '#0a0626ee'; c.beginPath(); c.moveTo(g.x - 4, by + ph); c.lineTo(g.x + 4, by + ph); c.lineTo(g.x, by + ph + 6); c.fill();
    c.fillStyle = '#ffffff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(b.text, bx + pw / 2, by + ph / 2 + .5); c.restore();
  }
  function layers() {
    const out = [];
    S.list.forEach(g => {
      const L = layerOf(g, g.id, g.pose, g.fr), d0 = L.draw, [W, H, K] = A.size(g.id), s = NX.room.scaleAt(g.y) * K * .98 * g.zoom, top = g.y - g.alt - H * s;
      L.draw = c => { d0(c); bubble(c, g, s, top); }; out.push(L);
      const c = g.comp; if (c && !c.hidden) out.push(layerOf(Object.assign(c, { alpha: g.alpha, zoom: g.zoom }), c.id, c.pose, c.fr || 0, {}));
    });
    const [PW, PH, PK] = A.PROP;                                                                      // речі: сітка 24×16 (guest_art.js), у кімнаті — того самого розміру
    S.props.forEach(p => { const pr = p.cv || (p.cv = document.createElement('canvas')), s = NX.room.scaleAt(p.y) * PK * (p.zoom || 1), w = PW * s, h = PH * s, al = Math.min(1, (p.until - NX.time) / 1.5);
      out.push({ y: p.y, refl: true, box: [p.x - w / 2, p.y - h - (p.alt || 0), p.x + w / 2, p.y + 2], draw: c => { const tq = Math.floor(NX.time * 8) / 8; if (p._t !== tq) { p._t = tq; A.drawProp(p.type, tq, pr); } c.save(); c.globalAlpha = Math.max(0, Math.min(p.alpha != null ? p.alpha : 1, p.follow ? 1 : al));
        c.imageSmoothingEnabled = false; c.drawImage(pr, p.x - w / 2, p.y - h - (p.alt || 0), w, h); c.restore(); } }); });
    S.fx.forEach(f => { if (f.type !== 'arrow') return; out.push({ y: 999, draw: c => { const k = Math.min(1, (NX.time - f.t0) / f.dur), xx = P.lerp(f.x0, f.x1, k), yy = P.lerp(f.y0, f.y1, k) - Math.sin(k * Math.PI) * 10, ang = Math.atan2(f.y1 - f.y0, f.x1 - f.x0);
      c.save(); c.strokeStyle = '#e8d0a0'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(xx - Math.cos(ang) * 12, yy - Math.sin(ang) * 12); c.lineTo(xx, yy); c.stroke(); c.fillStyle = '#d02a2a'; c.fillRect(xx - Math.cos(ang) * 12 - 1.5, yy - Math.sin(ang) * 12 - 1.5, 3, 3); c.restore(); } }); });
    { const fr = zone().S(100, 352, -30), n = COL.length, tot = IDS.length, y = fr[1] + 16, pl = .75 + .25 * Math.sin(NX.time * 2);   // табличка колекції біля брами: «ГОСТІ n/20» (голо-плашка на підлозі перед сходами)
      out.push({ y: y - 30, draw: c => { c.save(); c.font = '6px "Press Start 2P", monospace'; const txt = `${NX.t('party.guests')} ${n}/${tot}`, w = c.measureText(txt).width + 10; c.globalAlpha = .9;
        c.fillStyle = '#0a0626dd'; c.fillRect(fr[0] - w / 2, y - 6, w, 12); c.strokeStyle = n >= tot ? '#ffe27a' : '#c86aff'; c.lineWidth = 1; c.strokeRect(fr[0] - w / 2 + .5, y - 5.5, w - 1, 11);
        c.fillStyle = n >= tot ? '#ffe27a' : '#e2b4ff'; c.globalAlpha = pl; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(txt, fr[0], y + .5); c.fillStyle = '#c86aff'; c.globalAlpha = .5; c.fillRect(fr[0] - 1, y + 6, 2, 4); c.restore(); } }); }
    S.fx.forEach(f => { if (f.type !== 'badge') return; out.push({ y: 999, draw: c => { const k = Math.min(1, (NX.time - f.t0) / f.dur), y = f.y - k * 26, a = k < .15 ? k / .15 : k > .7 ? (1 - k) / .3 : 1;   // значок «У КОЛЕКЦІЇ ✓» злітає й тане
      c.save(); c.globalAlpha = a; c.font = '6px "Press Start 2P", monospace'; const s = NX.t('guests.badge'), w = c.measureText(s).width + 10, x0 = P.clamp(f.x - w / 2, NX.cam.x + 4, NX.cam.x + NX.cam.viewW - w - 4);
      c.fillStyle = '#0a0626ee'; c.fillRect(x0, y - 9, w, 13); c.strokeStyle = '#ffe27a'; c.lineWidth = 1; c.strokeRect(x0 + .5, y - 8.5, w - 1, 12); c.fillStyle = '#ffe27a'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(s, x0 + w / 2, y - 2.5); c.restore(); } }); });
    S.fx.forEach(f => { if (f.type !== 'flash' && f.type !== 'ring') return; const k = Math.min(1, (NX.time - f.t0) / f.dur), sc = NX.room.scaleAt(f.y) * .98;
      if (f.type === 'flash') out.push({ y: 998, draw: c => { const a = Math.sin(k * Math.PI), r = (18 + 30 * k) * sc; P.glow(c, f.x, f.y, r, 'rgba(200,240,255,.95)', a); P.glow(c, f.x, f.y, r * .45, '#ffffff', a * .9);   // спалах
          c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a; c.strokeStyle = '#e8f8ff'; c.lineWidth = 1; for (let i = 0; i < 6; i++) { const an = i * 1.047 + k * 2, L = r * (.7 + i % 2 * .25); c.beginPath(); c.moveTo(f.x, f.y); c.lineTo(f.x + Math.cos(an) * L, f.y + Math.sin(an) * L * .6); c.stroke(); } c.restore(); } });
      else out.push({ y: f.y - 1, refl: false, draw: c => { const q = f.inn ? k : 1 - k, rr = (6 + 34 * q) * sc, a = (1 - q) * .9;   // кільце енергії на підлозі: розходиться (поява) / сходиться (зникнення)
          c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a; c.strokeStyle = f.inn ? '#9af6ff' : '#ff9af0'; c.lineWidth = 1.6; c.beginPath(); c.ellipse(f.x, f.y + 1, rr, rr * .38, 0, 0, 7); c.stroke();
          c.globalAlpha = a * .45; c.lineWidth = .8; c.strokeStyle = '#ffffff'; c.beginPath(); c.ellipse(f.x, f.y + 1, rr * .8, rr * .3, 0, 0, 7); c.stroke();
          for (let i = 0; i < 10; i++) { const an = i * .628 + NX.time * 3; c.fillStyle = i % 2 ? '#e2c4ff' : '#9af6ff'; c.fillRect(f.x + Math.cos(an) * rr - .8, f.y + 1 + Math.sin(an) * rr * .38 - .8, 1.6, 1.6); }
          c.restore(); } }); });
    return out;
  }
  /** Гість під точкою (тап, наведення): межі спрайта. */
  function hitTest(x, y) {
    for (const g of S.list) { const [W, H, K] = A.size(g.id), s = NX.room.scaleAt(g.y) * K * .98 * g.zoom, w = W * s * .6, h = H * s, top = g.y - g.alt - h;
      if (g.alpha > .5 && x > g.x - w / 2 && x < g.x + w / 2 && y > top && y < g.y - g.alt + 3) return { g, box: { x: g.x - w / 2, y: top, w, h: h - 2 }, name: `guests.${g.id}.n`, tap: () => tap(g) }; }
    return null;
  }
  /** Кликати гостя з мішка (до 04.11 — тап по брамі; тепер — для коду й перевірок): якщо в кімнаті менше трьох. Інакше — лише спалах. */
  function summon() {
    const po = NX.objects.portal; if (S.list.length >= MAX || S.list.some(g => g.cur && g.cur.appear)) { S.portalT = NX.time + 1; return false; }
    S.on = true; spawn(); S.next = NX.time + 20 + Math.random() * 20; po && (po.active = true); return true;
  }
  NX.addObject({ id: 'guests', update, layers,
    tapFirst(x, y) { const z = zone(); if (!z || !z.box) return false; const [x0, x1, y0, y1] = z.box; if (x < x0 || x > x1 || y < y0 || y > y1 - 6) return false;
      const p = pad(); for (let i = 0; i < 12; i++) NX.fx.emit('portal', p[0] + (Math.random() - .5) * 60, p[1] - 20 - Math.random() * 90);
      if (NX.party && !NX.party.on && NX.acts.party) NX.nexi.do('party'); return true; } });   // тап по брамі — Nexi на вечірку (власник, 04.11)
  return { spawn, summon, hitTest, IDS, S, collect, collection, atParty,
    collectAll() { COL = IDS.slice(); saveCol(); }, forget() { COL = []; saveCol(); },
    /** Для перевірки й знімків: усі 20 рядами перед брамою (поза stand), без сценок. */
    demo(ids = IDS) { S.on = false; S.list = []; const B = NX.room.walkBounds(); ids.forEach((id, i) => { const g = { id, x: 140 + (i % 10) * 132, y: B.minY + 40 + Math.floor(i / 10) * 70, dir: 1, pose: i === 2 ? 'sit' : 'stand', fr: 0, ft: 0, alt: 0, alpha: 1, zoom: 1, g: {}, cv: null, q: [{ hold: 1 }], cur: null, speed: 1 }; S.list.push(g); }); },
  };
})();
