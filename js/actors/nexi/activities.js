/* ============================================================================
 * actors/nexi/activities.js — СЦЕНАРІЇ: ЩО NEXI РОБИТЬ У КІМНАТІ
 * ----------------------------------------------------------------------------
 * Кожен сценарій: { nav, color, route() -> список дій для черги (див. nexi.js) }.
 * Тексти (назва задачі, кроки, фрази) — у js/i18n/<мова>.js -> act.<id>.
 * Щоб додати взаємодію: сценарій тут + тексти в i18n + (за потреби) точка в
 * core/config.js -> POI. Решта коду не змінюється.
 * Чиста основа (власник, 29.10): док, диван (сісти, лягти, батут, подушки, обійми з котом, робота з планшетом — картка
 * результату з ui/zones.js), кіт, танець, вікно, м'ячик, селфі, прогулянка. Зони повертаються по черзі (крок 2, 29.10):
 *   МАРКЕТИНГ — Nexi підходить до крісла, воно обертається до нього, він сідає, крісло крутиться до екрана, Nexi працює
 *     (голо-клавіатура, пости й лайки вилітають з екрана), потім крісло розвертається до глядача — Nexi радіє, картка результату;
 *   СКІНИ (у коді — workshop; до 02.11 — «Майстерня») — Nexi злітає на пад капсули, сканер біжить по ньому, відкривається
 *     лабораторія скінів (лише тут — тап по Nexi тепер привітання, nexi.hi), маніпулятор
 *     «встановлює» кожен новий скін; у вільний час — просто милується голограмою з різними скінами.
 * Крок 11 (власник: «постав крісло; роби взаємодію з Nexi»):
 *   АНАЛІТИКА — як у маркетингу: крісло (objects/an_chair.js) повертається до Nexi, він сідає, крісло — до екрана в куполі;
 *     екран показує задачу (продажі / трафік / прогноз), над проєктором — 3D-діаграма; потім
 *     печатка «ЗВІТ ГОТОВИЙ ✓», крісло розвертається до глядача, з екрана вилітає картка звіту, Nexi радіє (objects/analytics.js);
 *   ІНСТРУМЕНТИ — Nexi підходить до верстака, злітає на ранці (спиною до нас) і лагодить хаб молотком — картка задачі (CRM /
 *     календар / автоматизація) підключається, пакети летять з хаба до неї; ✓, маячок спалахує; Nexi спускається й радіє
 *     (objects/tools.js).
 * Крок 14 (власник: «зроби взаємодію з Nexi»): AI-ЦЕНТР — Nexi підходить до стола, злітає на нього, стає спиною до нас і працює
 *   (на екрані — його задача: відповісти клієнту / лист партнеру / підсумок зустрічі; «✓»), спускається й радіє — картка
 *   результату (objects/aicenter.js). Робота з дивану (sofaWork) лишилась — просто з планшетом, без картки. Портал — гості з
 *   казок (actors/guests/). Старі сценарії зон — в історії git (коміт a941612), тексти act.<зона> — у словниках.
 * Крок 15: за столом AI-центру Рудик часом складає Nexi компанію (cat.js: joinAI) — тоді Nexi на фініші радіє з любов'ю;
 *   ВІРУС (actors/virus/virus.js) — Nexi біжить до AI-центру, дивиться, як Рудик спопеляє його лазером з очей, і дякує
 *   (act.virus: lines — на початку, thanks — після лазера, ai — якщо вірус утік і AI видалив його сам).
 * Декор стін · 6 (власник: «Nexi доглядає стіни»): ПОЛИВ (garden) — на ранці з лійкою облітає рослини стіни, що ближче
 *   (ліва: кошик, корита, мухоловка; права: потос у макраме, кокедами), рослина «оживає»; ГОДУВАННЯ (feedFish) — зависає біля
 *   акваріума й тисне кнопку годівнички: риби пливуть до корму й з'їдають його, у медузарії — хмара планктону, медузи сяють.
 * Декор стін · 7 (план: «Nexi на другому поверсі»): ДРУГИЙ ПОВЕРХ (upstairs) — на ранці до антресолі (двері пілона й ліхтар
 *   вітають), кличе дрона-поливальника й доливає йому води з лійки; дрон дякує й летить щедро поливати рослини антресолі.
 * ========================================================================== */
(() => {
  // (· 6) біля стіни: рядок підлоги на глибині z (масштаб Nexi — як у кімнаті там), куди долетіти, щоб лійка була над рослиною,
  // поруч з акваріумом — збоку від краю; точка підлоги під стіною, звідки злітає; вода з лійки
  const floorAt = z => NX.persp.VP[1] + (372 - NX.persp.VP[1]) * NX.persp.s(z), sprK = dy => NX.room.scaleAt(Math.max(dy, 352)) * SPRITE_K;
  const inRoom = x => Math.max(NX.cfg.ROOM_X0 + 30, Math.min(NX.cfg.ROOM_X1 - 30, x));
  // Спрайт Nexi зараз не віддзеркалюється (actors/nexi/physics.js: sq — NaN, тож scale(NaN) пропускається) — лійка завжди праворуч;
  // поки так, Nexi стає ліворуч від рослини (лійкою до неї); полагодять фізику — спрацює й бажаний бік (dir місця).
  const faceOk = () => Number.isFinite(NX.nexiPhys && NX.nexiPhys.sq), sideOf = d => (faceOk() ? d : 1);
  const hoverAt = sp => { const dy = floorAt(sp.z), s = sprK(dy), d = sideOf(sp.dir); return { p: [inRoom(sp.x - d * 23 * s), sp.y + 17 * s], dy, d }; };
  const hoverBeside = e => { const dy = floorAt(e.z), s = sprK(dy); return { p: [inRoom(e.x + e.side * (24 * s + 3)), e.y + 28 * s], dy, d: -e.side }; };   // кнопка — на пульті: бік руки неважливий
  const wallFloor = side => NX.room.clampWalk(side === 'left' ? 230 : 1460, 446, 'nexi');
  const pourFx = dir => { const n = NX.nexi, s = sprK(n.depthY()), d = sideOf(dir); for (let k = 0; k < 3; k++) NX.fx.emit('rain', n.x + d * (24 + Math.random() * 2) * s, n.y - (18 - Math.random() * 2) * s, { vx: d * (8 + Math.random() * 16), vy: 6 + Math.random() * 20, g: 170, ttl: .5, h: 2.4, s: 1.2, col: Math.random() < .7 ? '#8ad8ff' : '#e8fbff' }); };
  const pourInto = () => { const n = NX.nexi, s = sprK(n.depthY()), d = sideOf(1); for (let k = 0; k < 2; k++) NX.fx.emit('rain', n.x + d * (24 + Math.random() * 2) * s, n.y - (18 - Math.random() * 2) * s, { vx: d * (10 + Math.random() * 8), vy: 14 + Math.random() * 10, g: 170, ttl: .16 + Math.random() * .05, h: 2.4, s: 1.2, col: Math.random() < .7 ? '#8ad8ff' : '#e8fbff' }); };   // (· 7) з лійки — у бачок дрона
  const P = () => NX.cfg.POI, line = id => (NX.nexi.taskOpt && NX.ui.zones.has(id) ? { say: NX.t('zones.start', { task: NX.t(`zones.${id}.${NX.nexi.taskOpt}.t`) }) } : { say: NX.pick('act.' + id + '.lines') });
  NX.acts = {
    home: { route() { const h = NX.objects.rug.home; return [{ walk: h }, { loc: 'dock' }, { face: 1 }, line('home'), { work: { pose: 'wave', dur: 2.5 } }]; } },

    sofa: { color: '#7a5cff', route() { const p = P().sofa; return [{ walk: p.floor }, { hop: p.sit, dy: p.dy }, { do: () => NX.objects.sofa.land(p.sit[0]) }, { loc: 'sofaSit' }, { face: 1 }, line('sofa'), { work: { pose: 'sitRead', dur: 12 } }]; } },

    sofaWork: { color: '#3be8ff', route() { const p = P().sofa;   // задачі зон — на своїх місцях (AI-центр — з кроку 14), з дивану — просто планшет
      return [{ walk: p.floor }, { hop: p.sit, dy: p.dy }, { do: () => NX.objects.sofa.land(p.sit[0]) }, { loc: 'sofaSit' }, { face: 1 }, line('sofaWork'),
        { work: { pose: 'sitTablet', dur: 9, tick: () => Math.random() < .06 && NX.fx.emit('bit', NX.nexi.x + 10, NX.nexi.y - 30, { vy: -30 }) } }, { do: () => NX.nexi.emote('cool', 2) }]; } },

    bounce: { color: '#ff4fd8', route() { const p = P().sofa, [x, y] = p.stand, s = NX.objects.sofa, k = NX.cfg.SOFA.k, L = [{ walk: p.floor }, { hop: [x - 26 * k, y], dy: p.dy }, { loc: 'sofaStand' }, { do: () => s.land(x - 26 * k) }, line('bounce')];
      [8, 34, 4, -22, 10].forEach((dx, i) => L.push({ work: { pose: 'crouch', dur: .12 } }, { hop: [x + dx * k, y], hi: 26 * k, dy: p.dy }, { do: () => { s.land(x + dx * k, 1.2); NX.nexiPhys.land(3); if (i === 2) NX.nexi.emote('happy', 2); } }));
      L.push({ hop: p.floor, hi: 20 }, { do: () => s.land(x, .6) }, { loc: 'floor' }, { spin: .5 }); return L; } },

    fluff: { color: '#9ae8c0', route() { const p = P().sofa, s = NX.objects.sofa; return [{ walk: [p.floor[0] + 14, p.floor[1]] }, { face: 1 }, line('fluff'),
      { work: { pose: 'push', dur: 2.6, back: true, start: () => s.puffAll() } }, { do: () => { NX.nexi.back = false; NX.nexi.emote('happy', 2); } }, { work: { pose: 'cheer', dur: 1 } }]; } },

    cuddle: { color: '#ff7a2a', route() { const p = P().sofa, c = NX.cat; return [{ walk: p.floor }, { hop: p.sit, dy: p.dy }, { do: () => NX.objects.sofa.land(p.sit[0]) }, { loc: 'sofaSit' }, { face: 1 }, line('cuddle'),
      { do: () => c.goTo(p.buddy[0], p.buddy[1], () => { c.onSofa = true; NX.objects.sofa.land(p.buddy[0]); c.purr(7); }, p.catFrom, true) },
      { work: { pose: 'sit', dur: 3 } }, { work: { pose: 'sitPet', dur: 6, tick: () => Math.random() < .04 && NX.fx.emit('heart', NX.nexi.x + 14, NX.nexi.y - 36) } },
      { do: () => { NX.nexi.emote('love', 2.5); c.set('sleep', 14); } }]; } },

    sleep: { color: '#7d8cc4', route() { const p = P().sofa; return [{ walk: p.floor }, line('sleep'), { work: { pose: 'stretch', dur: 1.6 } }, { hop: p.lie, dy: p.dy }, { do: () => NX.objects.sofa.land(p.lie[0], .7) }, { loc: 'sofaLie' }, { rot: -90 }, { face: 1 },
      { work: { pose: 'sleep', dur: 9999, tick: () => Math.random() < .02 && NX.fx.emit('z', NX.nexi.x - 14, NX.nexi.y - 16) } }]; } },

    petCat: { color: '#ff7a2a', route() { const c = NX.cat, [cx, cg] = c.floorPos(), side = cx > 700 ? -1 : 1, gy = Math.max(cg, 362), [x, y] = NX.room.clampWalk(cx + side * 26, gy);
      return [{ walk: [x, y] }, { face: -side }, line('petCat'), { do: () => NX.cat.purr(4.5) }, { work: { pose: 'pet', dur: 4 } }, { do: () => NX.nexi.emote('love') }]; } },

    // смаколик з руки (куточка з мисками поки немає — власник, 02.11): підходить до Рудика, той їсть, голод минає
    feedCat: { color: '#ff7a2a', route() { const c = NX.cat, [cx, cg] = c.floorPos(), side = cx > 700 ? -1 : 1, gy = Math.max(cg, 362), [x, y] = NX.room.clampWalk(cx + side * 26, gy);
      return [{ walk: [x, y] }, { face: -side }, line('feedCat'), { do: () => NX.cat.set('eat', 3.2) }, { work: { pose: 'pour', dur: 3, end: () => { NX.cat.hunger = 0; } } }, { do: () => NX.nexi.emote('love') }]; } },

    dance: { color: '#ff4fd8', route() { const h = NX.objects.rug.home; return [{ walk: [h[0] + 40, h[1]] }, line('dance'), { work: { pose: 'dance', dur: 6, tick: () => Math.random() < .05 && NX.fx.emit('note', NX.nexi.x, NX.nexi.y - 50) } }, { spin: .5 }]; } },

    selfie: { color: '#ffc94d', route() { const c = NX.cat, [x, y] = NX.room.clampWalk(c.x + 22, Math.max(c.ground, 380)); return [{ walk: [x, y] }, { face: -1 }, line('selfie'), { do: () => c.set('sit', 4) },
      { work: { pose: 'carry', dur: 1.4 } }, { do: () => { for (let i = 0; i < 10; i++) NX.fx.emit('spark', NX.nexi.x + (Math.random() - .5) * 34, NX.nexi.y - 30 - Math.random() * 30, { col: '#ffffff' }); NX.ui.hud.toast(NX.t('ui.photo')); NX.nexi.emote('love'); } }, { work: { pose: 'cheer', dur: 1.2 } }]; } },

    // ---------- МАРКЕТИНГ: крісло обертається, Nexi сідає й працює (objects/mk_chair.js, objects/marketing.js) ----------
    marketing: { color: '#d94bff', route() {
      const ch = NX.objects.mkChair, M = NX.objects.marketing; if (!ch || !ch.ready()) return [line('marketing')];
      const sd = ch.side();
      return [{ walk: sd }, { face: -1 }, { do: () => ch.turnTo(270) }, { work: { pose: 'look', dur: .6 } },                 // крісло повертається до Nexi
        { hop: ch.seat(), dy: ch.depth() }, { do: () => ch.sitDown() }, { loc: 'mkChair' },
        { do: () => ch.turnTo(180) }, { work: { pose: 'sit', dur: .8 } }, line('marketing'),                                   // і до екрана
        { work: { pose: 'sitType', dur: 10.5, obj: 'marketing', tick: () => Math.random() < .05 && NX.fx.emit('bit', NX.nexi.x + (Math.random() - .5) * 20, NX.nexi.y - 40, { vy: -30 }) } },
        { do: () => ch.turnTo(360) }, { work: { pose: 'sit', dur: .8 } },                                                    // розворот до глядача
        { do: () => { NX.nexi.emote('happy', 2.2); M && M.card && M.card(NX.time); } }, { work: { pose: 'sitCheer', dur: 1.8 } }]; } },

    // ---------- АНАЛІТИКА: крісло обертається, Nexi сідає, екран у куполі показує задачу (objects/an_chair.js, analytics.js) ----------
    analytics: { color: '#ffc94d', route() {
      const ch = NX.objects.anChair, A = NX.objects.analytics, task = NX.nexi.taskOpt; if (!ch || !ch.ready() || !A) return [line('analytics')];
      return [{ walk: ch.side() }, { face: -1 }, { do: () => ch.turnTo(270) }, { work: { pose: 'look', dur: .6 } },              // крісло повертається до Nexi
        { hop: ch.seat(), dy: ch.depth() }, { do: () => ch.sitDown() }, { loc: 'anChair' },
        { do: () => { ch.turnTo(ch.REST); A.begin(task); } }, { work: { pose: 'sit', dur: .8 } }, line('analytics'),          // і до екрана
        { work: { pose: 'sitType', dur: 10.5, obj: 'analytics', tick: () => Math.random() < .05 && NX.fx.emit('bit', NX.nexi.x + (Math.random() - .5) * 20, NX.nexi.y - 44, { vy: -30 }) } },
        { do: () => A.finish() }, { work: { pose: 'sit', dur: 1.2 } },                                                        // печатка «звіт готовий»
        { do: () => ch.turnTo(ch.REST + 180) }, { work: { pose: 'sit', dur: .8 } },                                          // розворот до глядача
        { do: () => { NX.nexi.emote('happy', 2.2); A.card(); } }, { work: { pose: 'sitCheer', dur: 1.8 } }]; } },

    // ---------- ІНСТРУМЕНТИ: на ранці біля верстака лагодить хаб, картка підключається (objects/tools.js) ----------
    tools: { color: '#3bff8a', route() {
      const T = NX.objects.tools, task = NX.nexi.taskOpt; if (!T || !T.ready()) return [line('tools')];
      const st = T.stand(), hv = T.hover(), spark = () => { const n = NX.nexi; NX.fx.emit('spark', n.x + (Math.random() - .5) * 14, n.y - 46 - Math.random() * 10, { col: Math.random() < .5 ? '#ffd27a' : '#ffffff' }); };
      return [{ walk: st }, { face: 1 }, { work: { pose: 'crouch', dur: .25 } },
        { fly: hv, dy: st[1] }, { loc: 'tlHover' }, { do: () => T.begin(task) }, line('tools'),                               // злітає до верстака
        { work: { pose: 'hoverFix', dur: 10, obj: 'tools', back: true, tick: () => Math.random() < .22 && spark() } },
        { do: () => { T.finish(); NX.nexi.back = false; } }, { fly: st }, { loc: 'floor' }, { face: 1 },                      // ✓ — і вниз
        { do: () => NX.nexi.emote('happy', 2.2) }, { work: { pose: 'cheer', dur: 1.4 } }]; } },

    // ---------- AI-ЦЕНТР: злітає на стіл, працює спиною до нас, екран показує задачу й «✓» (objects/aicenter.js) ----------
    ai: { color: '#3be8ff', route() {
      const A = NX.objects.aicenter, task = NX.nexi.taskOpt; if (!A || !A.ready()) return [line('ai')];
      const st = A.front(), bits = () => { const n = NX.nexi; NX.fx.emit('bit', n.x + (Math.random() - .5) * 26, n.y - 40 - Math.random() * 14, { vy: -34 }); };
      return [{ walk: st }, { face: 1 }, { work: { pose: 'crouch', dur: .25 } },
        { fly: A.top(), dy: A.depth() }, { loc: 'aiDesk' }, { do: () => { A.begin(task); NX.cat.joinAI(); } }, line('ai'),   // на стіл, до екрана (Рудик часом — теж)
        { work: { pose: 'type', dur: 10.5, obj: 'aicenter', back: true, tick: () => Math.random() < .12 && bits() } },
        { do: () => { A.finish(); NX.nexi.back = false; } }, { face: 1 }, { do: () => NX.nexi.emote(/aiDesk/.test(NX.cat.at || '') ? 'love' : 'happy', 2.2) }, { work: { pose: 'cheer', dur: 1.3 } },   // «✓» — і вниз
        { fly: st }, { loc: 'floor' }]; } },

    // ---------- ВІРУС В AI-ЦЕНТРІ (крок 15): біжить подивитись, як Рудик спопеляє його лазером з очей, і дякує ----------
    virus: { color: '#ff3b5c', route() {
      const A = NX.objects.aicenter, V = NX.virus; if (!A || !A.ready() || !V) return [line('virus')];
      const f = A.front(), [x, y] = NX.room.freeAt(...NX.room.clampWalk(f[0] + 34, f[1] + 4), 'nexi');                     // перед серединою стола (на телефоні камера — за Nexi: видно і вірус, і Рудика)
      return [{ walk: [x, y] }, { face: -1 }, { do: () => NX.nexi.emote('surprise', 2.5) }, line('virus'),
        { work: { pose: 'look', dur: 40, tick: () => { const c = NX.nexi.cur; if (c) c._t = V.busy() ? Math.min(Math.max(c._t, 13.6), 26) : Math.max(c._t, 39.6); } } },   // поки вірус на волі (крок «дивлюсь, як Рудик полює»)
        { do: () => { const cat = V.S.by === 'cat'; NX.nexi.emote(cat ? 'love' : 'happy', 2.5); NX.nexi.say(NX.pick('act.virus.' + (cat ? 'thanks' : 'ai'))); } },
        { work: { pose: 'cheer', dur: 1.4 } }]; } },

    // ---------- ЗОНА СКІНИ (workshop): капсула, сканер, лабораторія скінів, маніпулятор (objects/workshop.js) ----------
    workshop: { color: '#ff7af0', route(n) {
      const W = NX.objects.workshop; if (!W || !W.ready()) return [{ do: () => NX.ui.skinlab.show() }];
      if (n && n.autoRun) return [{ walk: W.front() }, { face: 1 }, line('wsLook'), { do: () => W.show() }, { work: { pose: 'look', dur: 3.6 } },   // вільний час: милується голограмою
        { do: () => NX.nexi.emote('love', 2) }, { work: { pose: 'cheer', dur: 1.2 } }];
      return [{ walk: W.front() }, { face: 1 }, line('workshop'), { work: { pose: 'crouch', dur: .25 } },
        { fly: W.pad(), dy: W.depth() }, { loc: 'wsPad' }, { do: () => W.enter() }, { face: 1 },
        { work: { pose: 'scan', dur: 2.6 } }, { do: () => NX.ui.skinlab.show(true) },
        { work: { pose: 'stand', dur: 10, tick: () => { const c = NX.nexi.cur; if (NX.ui.skinlab.open && c && c._t > 9) c._t = 7; } } },   // поки лабораторія відкрита — чекає
        { work: { pose: 'cheer', dur: 1.3 } }, { do: () => W.leave() }, { fly: W.front() }, { loc: 'floor' }]; } },

    // ---------- (Декор стін · 6) ДОГЛЯД ЗА СТІНАМИ: на ранці з лійкою поливає рослини на стіні; тисне кнопки годівничок ----------
    // Власник (03.11, план «Nexi доглядає стіни»): Nexi — ботанік, тож сам поливає зелень на стінах і годує риб. Куди летіти й що
    // полити — objects/decor_live.js (care.spots), годівнички й риби, що пливуть до корму, — objects/decor_aqua.js (feed). Масштаб
    // біля стіни — як у кімнаті на тій глибині (dy: рядок підлоги під рослиною). Стіна — та, що ближче до Nexi.
    garden: { color: '#3bff8a', route() {
      const C = NX.decorLive && NX.decorLive.care, n = NX.nexi, side = n.x < 774 ? 'left' : 'right', S = C ? C.spots(side) : []; if (!S.length) return [line('garden')];
      const f = wallFloor(side), L = [{ walk: f }, { face: sideOf(S[0].dir) }, line('garden'), { work: { pose: 'crouch', dur: .25 } }, { do: () => { n.wallFloor = f; } }, { loc: 'wallHover' }];
      S.forEach(sp => { const h = hoverAt(sp); let done = false;
        L.push({ fly: h.p, dy: h.dy }, { face: h.d }, { work: { pose: 'hoverWater', dur: 2.4, tick: (dt, k) => { pourFx(h.d); if (!done && k > .3) { done = true; C.water(sp.id); } } } }); });
      L.push({ work: { pose: 'hoverLook', dur: .9 } }, { fly: f }, { loc: 'floor' }, { face: 1 }, { do: () => n.emote('love', 2.2) }, { work: { pose: 'cheer', dur: 1.3 } });
      return L; } },

    feedFish: { color: '#3be8ff', route() {
      const A = NX.decorAqua, n = NX.nexi, side = 'left'; if (!A || !A.feederAt) return [line('feedFish')];   // (· 12) обидва акваріуми — ліворуч (праворуч тепер ферма)
      const f = wallFloor(side), L = [{ walk: f }, line('feedFish'), { work: { pose: 'crouch', dur: .25 } }, { do: () => { n.wallFloor = f; } }, { loc: 'wallHover' }];
      ['reef', 'jelly'].forEach(aq => { const e = A.feederAt(aq); if (!e) return; const h = hoverBeside(e);
        L.push({ fly: h.p, dy: h.dy }, { face: h.d }, { work: { pose: 'hoverPress', dur: .9, end: () => A.feed(aq, NX.time) } },
          { work: { pose: 'hoverLook', dur: aq === 'jelly' ? 3.6 : 5.4 } }, { do: () => n.emote(aq === 'jelly' ? 'surprise' : 'love', 2) }); });
      L.push({ fly: f }, { loc: 'floor' }, { face: 1 }, { work: { pose: 'cheer', dur: 1.3 } });
      return L; } },

    // ---------- (Декор стін · 19, · 21) ІНВЕНТАРИЗАЦІЯ: на ранці підлітає до рослин на ближчій стіні (objects/decor_guide.js: врятовані види)
    // і сканує три з них ручним сканером — промінь до рослини, кільце, картка виду відкривається сама (бирки з номерами прибрано · 21). ----------
    census: { color: '#3bff8a', route() {
      const G = NX.decorGuide, n = NX.nexi, side = n.x < 774 ? 'left' : 'right', S = G && G.scanSpots ? G.scanSpots(side) : []; if (!S.length) return [line('census')];
      const f = wallFloor(side), hand = () => { const s = sprK(n.depthY()), d = sideOf(1); return [n.x + d * 25 * s, n.y - 20 * s]; };
      const L = [{ walk: f }, { face: 1 }, line('census'), { work: { pose: 'crouch', dur: .25 } }, { do: () => { n.wallFloor = f; } }, { loc: 'wallHover' }];
      S.forEach(sp => { const h = hoverAt({ x: sp.x - 16, y: sp.y - 12, z: sp.z, dir: 1 });   // трохи збоку й вище — видно промінь від сканера до рослини
        L.push({ fly: h.p, dy: h.dy }, { face: h.d }, { do: () => { const [hx, hy] = hand(); G.scanFrom(hx, hy, sp.kind, NX.time, 1.9); } },
          { work: { pose: 'hoverScan', dur: 1.9, tick: (dt, k) => { const [hx, hy] = hand(); G.scanTick(hx, hy, NX.time, k); } } }, { do: () => { G.scanEnd(); n.emote('happy', 1.2); } }, { work: { pose: 'hoverLook', dur: .7 } }); });
      L.push({ fly: f }, { loc: 'floor' }, { face: 1 }, { do: () => n.emote('cool', 2) }, { work: { pose: 'cheer', dur: 1.3 } });
      return L; } },

    // ---------- (Декор стін · 7) ДРУГИЙ ПОВЕРХ: на ранці злітає до антресолі — двері пілона відчиняються, ліхтар спалахує (вітають);
    // кличе дрона-поливальника (махає лійкою) і доливає йому води; дрон — «бочка», серце, і летить щедро поливати рослини антресолі.
    // Стати на саму антресоль Nexi не може: він вищий (≈ 60 од.), ніж від плити до стелі (≈ 50), а двері пілона — йому до пояса;
    // розмір Nexi не міняємо (власник), тож другий поверх він доглядає з ранця, перед фасадом. Де зависає — objects/decor.js: upstairs(). ----------
    upstairs: { color: '#ffb24a', route() {
      const U = NX.decor && NX.decor.upstairs && NX.decor.upstairs(), n = NX.nexi; if (!U) return [line('upstairs')];
      const f = wallFloor('right'), REF = 2.6;
      return [{ walk: f }, { face: 1 }, line('upstairs'), { work: { pose: 'crouch', dur: .25 } }, { do: () => { n.wallFloor = f; } }, { loc: 'wallHover' },
        { fly: [U.x, U.y], dy: U.dy }, { face: 1 }, { do: () => { if (NX.decorLive) NX.decorLive.greet(NX.time); n.emote('happy', 1.5); } }, { work: { pose: 'hoverLook', dur: 1 } },
        { do: () => { NX.decor.droneCall(U.dock[0], U.dock[1], NX.time, REF, -1, U.spout); n.emote('happy', 2); } }, { work: { pose: 'hoverCall', dur: 1.8 } },
        { work: { pose: 'hoverWater', dur: REF, tick: () => pourInto() } },
        { do: () => { if (NX.decorLive) NX.decorLive.TP.drone = NX.time; n.emote('love', 2.2); } }, { work: { pose: 'hoverLook', dur: 2.4 } },   // дивиться, як дрон полетів поливати монстеру
        { fly: f }, { loc: 'floor' }, { face: 1 }, { work: { pose: 'cheer', dur: 1.3 } }];
    } },

    wander: { color: '#3be8ff', route() { const b = NX.room.walkBounds(); return [{ walk: NX.room.clampWalk(80 + Math.random() * 1380, b.minY + Math.random() * (b.maxY - b.minY)) }, { work: { pose: 'look', dur: 3 } }]; } },

    window: { color: '#7a5cff', route() { return [{ walk: P().window }, { face: 1 }, line('window'), { do: () => NX.city.fireworks(7) }, { work: { pose: 'gaze', dur: 7, back: true } }, { do: () => NX.nexi.emote('happy') }]; } },

    kickBall: { color: '#ff4fd8', route() { const b = NX.objects.ball, side = b.x > 768 ? 1 : -1; return [{ walk: NX.room.clampWalk(b.x + side * 16, b.y) }, { face: -side }, line('kickBall'),
      { work: { pose: 'jump', dur: .35 } }, { do: () => { b.kick(-side * 220, (Math.random() - .5) * 80); NX.nexiPhys.land(2); NX.cat.goTo(b.x, b.y, () => NX.cat.set('pounce', .5, () => b.kick((Math.random() - .5) * 160, (Math.random() - .5) * 60)), null, true); } }, { work: { pose: 'cheer', dur: 1.5 } }]; } },
  };
})();
