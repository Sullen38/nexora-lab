/* ============================================================================
 * actors/nexi/activities.js — СЦЕНАРІЇ: ЩО NEXI РОБИТЬ У КОЖНІЙ ЗОНІ КІМНАТИ
 * ----------------------------------------------------------------------------
 * Кожен сценарій: { nav, color, route() -> список дій для черги (див. nexi.js) }.
 * Тексти (назва задачі, кроки, фрази) — у js/i18n/<мова>.js -> act.<id>.
 * Щоб додати взаємодію: сценарій тут + тексти в i18n + (за потреби) точка в
 * core/config.js -> POI. Решта коду не змінюється.
 * ========================================================================== */
(() => {
  const P = () => NX.cfg.POI, line = id => ({ say: NX.pick('act.' + id + '.lines') });
  const celebrate = () => [{ spin: .5 }, { do: () => { NX.nexi.emote('happy'); NX.nexi.say(NX.pick('act.done')); } }];
  NX.acts = {
    home: { nav: 'home', route() { const h = NX.objects.home.home; return [{ walk: h }, { loc: 'dock' }, { face: 1 }, line('home'), { work: { pose: 'wave', dur: 2.5 } }]; } },

    ai: { nav: 'ai', color: '#3be8ff', route() { const p = P().aiDesk; return [{ walk: p.floor }, { work: { pose: 'crouch', dur: .25 } }, { fly: p.top }, { loc: 'aiDesk' }, { face: -1 }, line('ai'), { work: { pose: 'type', dur: 11, obj: 'aiPc', face: -1, tick: () => Math.random() < .12 && NX.fx.emit('bit', NX.nexi.x - 12, NX.nexi.y - 6, { vx: -20 - Math.random() * 20, vy: -30 - Math.random() * 30 }) } }, ...celebrate()]; } },

    analytics: { nav: 'analytics', color: '#ffc94d', route() { const p = P().analytics; return [{ walk: p.floor }, { hop: p.chair }, { loc: 'chairA' }, line('analytics'), { work: { pose: 'sitType', dur: 11, obj: 'analytics', back: true } }]; } },

    marketing: { nav: 'marketing', color: '#d94bff', route() { const p = P().marketing; return [{ walk: p.floor }, { hop: p.chair }, { loc: 'chairM' }, line('marketing'), { work: { pose: 'sitType', dur: 11, obj: 'marketing', back: true } }]; } },

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

    sofa: { color: '#7a5cff', route() { const p = P().sofa; return [{ walk: p.floor }, { hop: p.sit }, { loc: 'sofaSit' }, { face: 1 }, line('sofa'), { work: { pose: 'sitRead', dur: 12 } }]; } },

    sleep: { color: '#7d8cc4', route() { const p = P().sofa; return [{ walk: p.floor }, line('sleep'), { work: { pose: 'stretch', dur: 1.6 } }, { hop: p.lie }, { loc: 'sofaLie' }, { rot: -90 }, { face: 1 },
      { work: { pose: 'sleep', dur: 9999, tick: () => Math.random() < .02 && NX.fx.emit('z', NX.nexi.x - 14, NX.nexi.y - 16) } }]; } },

    petCat: { color: '#ff7a2a', route() { const c = NX.cat, side = c.x > 700 ? -1 : 1, gy = Math.max(c.ground, 362), [x, y] = NX.room.clampWalk(c.x + side * 26, gy);
      return [{ walk: [x, y] }, { face: -side }, line('petCat'), { do: () => NX.cat.purr(4.5) }, { work: { pose: 'pet', dur: 4 } }, { do: () => NX.nexi.emote('love') }]; } },

    dance: { color: '#ff4fd8', route() { const h = NX.objects.home.home; return [{ walk: [h[0] + 40, h[1]] }, line('dance'), { work: { pose: 'dance', dur: 6, tick: () => Math.random() < .05 && NX.fx.emit('note', NX.nexi.x, NX.nexi.y - 50) } }, { spin: .5 }]; } },

    wander: { color: '#3be8ff', route() { const b = NX.room.walkBounds(); return [{ walk: NX.room.clampWalk(80 + Math.random() * 1380, b.minY + Math.random() * (b.maxY - b.minY)) }, { work: { pose: 'look', dur: 3 } }]; } },

    water: { color: '#3bff8a', route() { return [{ walk: [850, 362] }, { face: 1 }, line('water'), { work: { pose: 'water', dur: 4, tick: () => Math.random() < .5 && NX.fx.emit('rain', NX.nexi.x + 16, NX.nexi.y - 34, { vx: 10, vy: 60, ttl: .5, col: '#7ad0ff' }) } }, { do: () => NX.objects.plant.watered() }, { work: { pose: 'cheer', dur: 1.2 } }]; } },

    window: { color: '#7a5cff', route() { return [{ walk: [705, 362] }, { face: 1 }, line('window'), { do: () => NX.city.fireworks(7) }, { work: { pose: 'gaze', dur: 7, back: true } }, { do: () => NX.nexi.emote('happy') }]; } },

  };
})();
