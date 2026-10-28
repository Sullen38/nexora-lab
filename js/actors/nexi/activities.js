/* ============================================================================
 * actors/nexi/activities.js — СЦЕНАРІЇ: ЩО NEXI РОБИТЬ У КОЖНІЙ ЗОНІ КІМНАТИ
 * ----------------------------------------------------------------------------
 * Кожен сценарій: { nav, color, route() -> список дій для черги (див. nexi.js) }.
 * Тексти (назва задачі, кроки, фрази) — у js/i18n/<мова>.js -> act.<id>.
 * Щоб додати взаємодію: сценарій тут + тексти в i18n + (за потреби) точка в
 * core/config.js -> POI. Решта коду не змінюється.
 * ========================================================================== */
(() => {
  const P = () => NX.cfg.POI, line = id => (NX.nexi.taskOpt && NX.ui.zones.has(id) ? { say: NX.t('zones.start', { task: NX.t(`zones.${id}.${NX.nexi.taskOpt}.t`) }) } : { say: NX.pick('act.' + id + '.lines') });
  const celebrate = () => [{ spin: .5 }, { do: () => { NX.nexi.emote('happy'); NX.nexi.say(NX.pick('act.done')); } }];
  NX.acts = {
    home: { nav: 'home', route() { const h = NX.objects.rug.home; return [{ walk: h }, { loc: 'dock' }, { face: 1 }, line('home'), { work: { pose: 'wave', dur: 2.5 } }]; } },

    ai: { nav: 'ai', color: '#3be8ff', route() { const p = P().aiDesk; return [{ walk: p.floor }, { work: { pose: 'crouch', dur: .25 } }, { fly: p.top }, { loc: 'aiDesk' }, { face: -1 }, line('ai'), { work: { pose: 'type', dur: 11, obj: 'aiPc', face: -1, tick: () => Math.random() < .12 && NX.fx.emit('bit', NX.nexi.x - 12, NX.nexi.y - 6, { vx: -20 - Math.random() * 20, vy: -30 - Math.random() * 30 }) } }, ...celebrate()]; } },

    analytics: { nav: 'analytics', color: '#ffc94d', route() { const p = P().analytics, ch = NX.chairA; return [{ walk: [ch.x + 4, 366] }, { face: 1 }, { do: () => ch.roll(ch.OUT) }, { work: { pose: 'look', dur: .6 } }, { hop: [ch.x + ch.seat[0] + ch.OUT, ch.y + ch.seat[1]] }, { do: () => { NX.nexi.seat = ch; ch.roll(0); } }, { loc: 'chairA' }, { face: -1 }, line('analytics'), { work: { pose: 'sitWork', dur: 11, obj: 'analytics' } }, { do: () => NX.nexi.emote('happy') }]; } },

    marketing: { nav: 'marketing', color: '#d94bff', route() { const p = P().marketing, ch = NX.chairM; return [{ walk: [ch.x + 4, 366] }, { face: 1 }, { do: () => ch.roll(ch.OUT) }, { work: { pose: 'look', dur: .6 } }, { hop: [ch.x + ch.seat[0] + ch.OUT, ch.y + ch.seat[1]] }, { do: () => { NX.nexi.seat = ch; ch.roll(0); } }, { loc: 'chairM' }, { face: -1 }, line('marketing'), { work: { pose: 'sitWork', dur: 11, obj: 'marketing' } }, { do: () => NX.nexi.emote('happy') }]; } },

    workshop: { nav: 'workshop', color: '#ff7af0', route() { const p = P().workshop; return [{ walk: p.floor }, { hop: p.pad }, { loc: 'pad' }, { face: 1 }, line('workshop'), { do: () => NX.ui.skinlab.show(true) },
      { work: { pose: 'scan', dur: 7, obj: 'workshop', tick: () => { if (NX.ui.skinlab.open && NX.nexi.cur && NX.nexi.cur._t > 6) NX.nexi.cur._t = 5; } } }, { work: { pose: 'cheer', dur: 1.2 } }]; } },

    tools: { nav: 'tools', color: '#3bff8a', route() { const p = P().tools; return [{ walk: p.floor }, { work: { pose: 'crouch', dur: .25 } }, { fly: p.hover }, { loc: 'hover' }, line('tools'), { work: { pose: 'hoverFix', dur: 10, obj: 'tools', back: true, tick: () => Math.random() < .25 && NX.fx.emit('spark', NX.nexi.x + 8, NX.nexi.y - 44) } }, { fly: p.floor }, { loc: 'floor' }, ...celebrate()]; } },

    portal: { nav: 'portal', color: '#d94bff', route() {
      const p = P().portal, o = NX.objects.portal, d = o.dest || 'projects';
      return [{ walk: p.floor }, { face: 1 }, { say: NX.t('portal.go.' + d) },
        { work: { pose: 'scan', dur: 1.6, start: () => o.phase = 'charge' } },
        { walk: p.step }, { loc: 'portalStep' }, { face: 1 }, { work: { pose: 'crouch', dur: .3 } },
        { do: () => o.phase = 'travel' }, { fade: { alpha: 0, zoom: .25, y: p.gate[1], dur: 1.1, spin: true } },
        { work: { pose: 'stand', dur: 3.6 } },
        { do: () => { o.phase = 'return'; o.flash = 1; } }, { fade: { alpha: 1, zoom: 1, y: p.step[1], dur: .8 } },
        { do: () => { o.phase = 'idle'; NX.nexiPhys.land(4); } }, { say: NX.t('portal.res.' + d) }, { work: { pose: 'carry', dur: 3 } },
        { walk: p.floor }, { loc: 'floor' }];
    } },

    coffee: { color: '#ffc94d', route() { const p = P().coffee, m = NX.objects.coffee; return [{ walk: p.stand }, { face: -1 }, line('coffee'),
      { work: { pose: 'press', dur: 3.2, start: () => m.brew = .01 } }, { do: () => { m.brew = 0; m.cup = false; } }, { work: { pose: 'drink', dur: 5 } }]; } },

    sofa: { color: '#7a5cff', route() { const p = P().sofa; return [{ walk: p.floor }, { hop: p.sit, dy: p.dy }, { do: () => NX.objects.sofa.land(p.sit[0]) }, { loc: 'sofaSit' }, { face: 1 }, line('sofa'), { work: { pose: 'sitRead', dur: 12 } }]; } },

    sofaWork: { color: '#3be8ff', route() { const p = P().sofa, zs = ['ai', 'analytics', 'marketing', 'tools'], z = zs[Math.random() * 4 | 0], task = NX.ui.zones.pick(z);
      return [{ walk: p.floor }, { hop: p.sit, dy: p.dy }, { do: () => NX.objects.sofa.land(p.sit[0]) }, { loc: 'sofaSit' }, { face: 1 }, line('sofaWork'),
        { work: { pose: 'sitTablet', dur: 9, tick: () => Math.random() < .06 && NX.fx.emit('bit', NX.nexi.x + 10, NX.nexi.y - 30, { vy: -30 }) } }, { do: () => { NX.ui.zones.result(z, task, false); NX.nexi.emote('cool', 2); } }]; } },

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

    petCat: { color: '#ff7a2a', route() { const c = NX.cat, [cx, cg] = c.floorPos(), side = cx > 700 ? -1 : 1, gy = Math.max(cg, 362), [x, y] = NX.room.clampWalk(cx + side * 26, gy); if (c.desk) c.leaveDesk();   // кіт на столі — зістрибне туди, звідки застрибнув (№8)
      return [{ walk: [x, y] }, { face: -side }, line('petCat'), { do: () => NX.cat.purr(4.5) }, { work: { pose: 'pet', dur: 4 } }, { do: () => NX.nexi.emote('love') }]; } },

    feedCat: { color: '#ff7a2a', route() { const b = NX.objects.catCorner.bowl; return [{ walk: [b[0] + 22, b[1] + 2] }, { face: -1 }, line('feedCat'), { work: { pose: 'pour', dur: 3, end: () => { NX.objects.catCorner.food = 1; NX.cat.hunger = .75; } } }]; } },

    dance: { color: '#ff4fd8', route() { const h = NX.objects.rug.home; return [{ walk: [h[0] + 40, h[1]] }, line('dance'), { work: { pose: 'dance', dur: 6, tick: () => Math.random() < .05 && NX.fx.emit('note', NX.nexi.x, NX.nexi.y - 50) } }, { spin: .5 }]; } },

    laser: { color: '#ff3b4a', route() { return [{ walk: NX.room.clampWalk(NX.cat.x + 90, Math.max(NX.cat.ground, 400)) }, { face: -1 }, line('laser'),
      { work: { pose: 'point', dur: 8, start: () => NX.objects.laser.start(), end: () => NX.objects.laser.stop() } }, { do: () => NX.nexi.emote('happy') }]; } },

    selfie: { color: '#ffc94d', route() { const c = NX.cat, [x, y] = NX.room.clampWalk(c.x + 22, Math.max(c.ground, 380)); return [{ walk: [x, y] }, { face: -1 }, line('selfie'), { do: () => c.set('sit', 4) },
      { work: { pose: 'carry', dur: 1.4 } }, { do: () => { NX.objects.laser.flash = 1; NX.ui.hud.toast(NX.t('ui.photo')); NX.nexi.emote('love'); } }, { work: { pose: 'cheer', dur: 1.2 } }]; } },

    collect: { color: '#ffd02a', route() { const L = NX.objects.coins.list.slice().sort((a, b) => Math.abs(a.x - NX.nexi.x) - Math.abs(b.x - NX.nexi.x)).slice(0, 6);
      return [line('collect'), ...L.map(c => ({ walk: [c.x, c.y], run: true })), { work: { pose: 'cheer', dur: 1.2 } }]; } },

    wander: { color: '#3be8ff', route() { const b = NX.room.walkBounds(); return [{ walk: NX.room.clampWalk(80 + Math.random() * 1380, b.minY + Math.random() * (b.maxY - b.minY)) }, { work: { pose: 'look', dur: 3 } }]; } },

    beanbag: { color: '#d94bff', route() { const [x, y] = NX.objects.lounge.pos, k = NX.px.depthK(y); return [{ walk: [x + 30 * k, y + 8] }, { hop: [x, y - 22 * k] }, { loc: 'beanbag' }, { face: 1 }, line('beanbag'), { work: { pose: 'sitRead', dur: 11 } }]; } },

    fountain: { color: '#3be8ff', route() { const f = NX.objects.fountain, [x, y] = f.pos, k = NX.px.depthK(y); return [{ walk: [x - 50 * k, y + 6] }, { face: 1 }, line('fountain'),
      { work: { pose: 'toss', dur: .55 } }, { do: () => { NX.fx.emit('spark', NX.nexi.x + 8, NX.nexi.y - 40, { vx: 40 * k, vy: -50, g: 140, ttl: .8, col: '#ffc94d', s: 2.5 }); setTimeout(() => f.wish(), 700); } },
      { work: { pose: 'cheer', dur: 1.6 } }, { do: () => NX.nexi.emote('love') }]; } },

    lamp: { color: '#ffc94d', route() { const l = NX.objects.lamp, [x, y] = l.pos, k = NX.px.depthK(y); return [{ walk: [x - 18 * k, y + 4] }, { face: 1 }, line('lamp'), { work: { pose: 'press', dur: .8 } }, { do: () => l.toggle() }, { work: { pose: 'wave', dur: 1 } }]; } },

    water: { color: '#3bff8a', route() { return [{ walk: NX.cfg.sofaPt(850, 362) }, { face: 1 }, line('water'), { work: { pose: 'water', dur: 4, tick: () => Math.random() < .5 && NX.fx.emit('rain', NX.nexi.x + 16, NX.nexi.y - 34, { vx: 10, vy: 60, ttl: .5, col: '#7ad0ff' }) } }, { do: () => NX.objects.plant.watered() }, { work: { pose: 'cheer', dur: 1.2 } }]; } },

    window: { color: '#7a5cff', route() { return [{ walk: P().window }, { face: 1 }, line('window'), { do: () => NX.city.fireworks(7) }, { work: { pose: 'gaze', dur: 7, back: true } }, { do: () => NX.nexi.emote('happy') }]; } },

    kickBall: { color: '#ff4fd8', route() { const b = NX.objects.catCorner.ball, side = b.x > 768 ? 1 : -1; return [{ walk: NX.room.clampWalk(b.x + side * 16, b.y) }, { face: -side }, line('kickBall'),
      { work: { pose: 'jump', dur: .35 } }, { do: () => { NX.objects.catCorner.kick(-side * 220, (Math.random() - .5) * 80); NX.nexiPhys.land(2); NX.cat.goTo(b.x, b.y, () => NX.cat.set('pounce', .5, () => NX.objects.catCorner.kick((Math.random() - .5) * 160, (Math.random() - .5) * 60)), null, true); } }, { work: { pose: 'cheer', dur: 1.5 } }]; } },
  };
})();
