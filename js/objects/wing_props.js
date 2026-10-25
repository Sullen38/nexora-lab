/* ============================================================================
 * objects/wing_props.js — ШТУЧКИ Й ЛАМПИ ЛІВОГО КРИЛА (на поличках і зі стелі)
 * ----------------------------------------------------------------------------
 * Власник: «додай поличок з прикольними вазонами та штучками інноваційними,
 * лампочки як там були, одну в китайському стилі». Полички — wing_wall.js
 * (NX.wing.SHELVES), рослини на них — wing_plants.js, а тут:
 *   гаджети (NX.kit.gadget): голо-куб з каркасом, що обертається; куля-левітатор;
 *     міні-дрон на стійці; тераріум з неоновою рослиною; мініатюрка робота;
 *     розумна колонка з LED-кільцем. Тап — іскри.
 *   лампи (NX.kit.lamp): 2 лампи Едісона на шнурах зі стелі (над аналітикою і
 *     перед вікном) і червоний китайський ліхтар з китицею над пальмою —
 *     мерехтять, ліхтар злегка гойдається.
 * Статична частина — растр 4 px/од., живе — live(c, x, y, t).
 * ========================================================================== */
(() => {
  const P = NX.px, K = NX.kit, F = NX.furn;
  // гаджети: x — лівий край, y — лінія, на якій стоїть (верх планки або стільниці); stage 'wall' — за столами, 'layer' — за глибиною
  const GADGETS = [
    { id: 'holoCube', kind: 'holoCube', x: 352, y: 50, stage: 'wall' }, { id: 'terrarium', kind: 'terrarium', x: 370, y: 50, stage: 'wall' }, { id: 'botToy', kind: 'botToy', x: 392, y: 50, stage: 'wall' },
    { id: 'orb', kind: 'orb', x: 489, y: 104, stage: 'wall' }, { id: 'drone', kind: 'drone', x: 6, y: 160, stage: 'wall' },
    { id: 'speaker', kind: 'speaker', x: 536, y: 278, stage: 'layer', depth: 279 },
  ];
  // лампи: x — лівий край спрайта, top — де кріпиться шнур (стеля), y — верх спрайта
  const LAMPS = [
    { id: 'bulbA', kind: 'edison', x: 327, top: -40, y: 26 }, { id: 'bulbB', kind: 'edison', x: 635, top: -40, y: 96 },
    { id: 'lantern', kind: 'chinese', x: 454, top: -40, y: 2, sway: 1 },
  ];
  const wall = [];
  GADGETS.forEach(d => {
    const o = NX.addObject({
      id: 'wg_' + d.id, name: 'obj.plant', act: 'rustle', d, hit: null,
      sp() { if (!this._sp) { this._sp = K.gadget(d.kind); this.hit = { x: d.x, y: d.y - this._sp.h, w: this._sp.w, h: this._sp.h }; } return this._sp; },
      onTap() { const sp = this.sp(); for (let i = 0; i < 10; i++) NX.fx.emit('spark', d.x + Math.random() * sp.w, d.y - sp.h + Math.random() * sp.h * .6, { col: Math.random() < .5 ? '#7af0ff' : '#ff7af0', vy: -20 - Math.random() * 20, g: 30, ttl: 1, s: 1.1 }); NX.nexi.emote('happy', 1.2); return true; },
      draw(c, t) { const sp = this.sp(), R = F.res(), y = d.y - sp.h; c.save(); c.imageSmoothingEnabled = R < 3.8; c.drawImage(F.fit(sp.cv, sp.w, sp.h, R), d.x, y, sp.w, sp.h); c.restore(); sp.live(c, d.x, y, t); },
      layers(t) { return d.stage === 'layer' ? [{ y: d.depth, draw: c => this.draw(c, t) }] : []; },
    });
    if (d.stage === 'wall') wall.push(o);
  });
  const lamps = LAMPS.map(d => ({ d, sp: null }));
  NX.addObject({
    id: 'wingProps',
    drawBack(c, t) {
      const R = F.res();
      lamps.forEach(L => {
        if (!L.sp) L.sp = K.lamp(L.d.kind);
        const { d, sp } = L, cx = d.x + sp.w / 2, a = d.sway ? Math.sin(t * .8 + d.x) * .05 : 0;
        c.save(); c.translate(cx, d.top); c.rotate(a); c.translate(-cx, -d.top);
        c.strokeStyle = '#0a0612'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(cx, d.top); c.lineTo(cx, d.y + .5); c.stroke();       // шнур зі стелі
        c.strokeStyle = '#2a2454'; c.lineWidth = .4; c.beginPath(); c.moveTo(cx - .3, d.top); c.lineTo(cx - .3, d.y + .5); c.stroke();
        c.imageSmoothingEnabled = R < 3.8; c.drawImage(F.fit(sp.cv, sp.w, sp.h, R), d.x, d.y, sp.w, sp.h); sp.live(c, d.x, d.y, t);
        c.restore();
      });
      wall.forEach(o => o.draw(c, t));
    },
  });
})();
