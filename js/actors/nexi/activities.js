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
 * ========================================================================== */
(() => {
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

    wander: { color: '#3be8ff', route() { const b = NX.room.walkBounds(); return [{ walk: NX.room.clampWalk(80 + Math.random() * 1380, b.minY + Math.random() * (b.maxY - b.minY)) }, { work: { pose: 'look', dur: 3 } }]; } },

    window: { color: '#7a5cff', route() { return [{ walk: P().window }, { face: 1 }, line('window'), { do: () => NX.city.fireworks(7) }, { work: { pose: 'gaze', dur: 7, back: true } }, { do: () => NX.nexi.emote('happy') }]; } },

    kickBall: { color: '#ff4fd8', route() { const b = NX.objects.ball, side = b.x > 768 ? 1 : -1; return [{ walk: NX.room.clampWalk(b.x + side * 16, b.y) }, { face: -side }, line('kickBall'),
      { work: { pose: 'jump', dur: .35 } }, { do: () => { b.kick(-side * 220, (Math.random() - .5) * 80); NX.nexiPhys.land(2); NX.cat.goTo(b.x, b.y, () => NX.cat.set('pounce', .5, () => b.kick((Math.random() - .5) * 160, (Math.random() - .5) * 60)), null, true); } }, { work: { pose: 'cheer', dur: 1.5 } }]; } },
  };
})();
