/* ============================================================================
 * objects/rwing_plants.js — ПРАВЕ КРИЛО: РОСЛИНИ, ШТУЧКИ НА АНТРЕСОЛІ, ЛІХТАРІ, СВІТЛО В ПОВІТРІ
 * ----------------------------------------------------------------------------
 * Усе кодом (NX.kit): рослини v3 з автопідгонкою (K.plant), гаджети (K.gadget), лампи (K.lamp), як у лівому крилі.
 *   НА АНТРЕСОЛІ (stage 'mezz') — папороть, монстера, пальма, ще одна папороть, мініатюрка робота, голо-куб,
 *     куля-левітатор: стоять біля поруччя, низ ховає лицьова грань (малюються ДО неї — NX.rwing.items).
 *   ЛІАНИ з краю антресолі (stage 'vine') — над інструментами й порталом (поверх лицьової грані).
 *   НА МЕБЛЯХ (stage 'top') — папороть у теракотовому горщику на дошці інструментів, неонова рослина у
 *     склі на терміналі майстерні, сансев'єра на брамі порталу.
 *   НА ПІДЛОЗІ (stage 'layer', за глибиною з Nexi й котом) — папороть біля верстата, папороть у золотому
 *     горщику на помості порталу, монстера на опорі в правому куті.
 *   ЗОЛОТИЙ ЛІХТАР під антресоллю над порталом (як на картинці), 2 лампи Едісона над верстатом — спалахують,
 *     коли Nexi працює з інструментами.
 *   СВІТЛО В ПОВІТРІ: нові джерела в objects/wing_air.js (LIGHTS) — серпанок, промені, пил: настінний ліхтар
 *     біля інструментів, золотий ліхтар, лампи Едісона, точкові світильники антресолі, лампа верстата.
 * Тап по рослині — шелест; по штучці — іскри. Усі рослини гойдаються.
 * ========================================================================== */
(() => {
  const P = NX.px, K = NX.kit, F = NX.furn, RW = NX.rwing, hash = NX.art.hash, rgba = K.rgba, lit = K.lit, { CHROME, OUT } = F.PAL, ramp = F.ramp;
  const MB = 47.4;                                                                 // на антресолі речі стоять біля поруччя (низ ховає лицьова грань 44..60)
  const LIST = [
    { id: 'mzFern', kind: 'fern', x: 1188, y: MB - 46, w: 46, h: 46, potW: 16, potH: 9, leaves: 14, seed: 31, stage: 'mezz', s: .7, pal: 'light' },
    { id: 'mzMonstera', kind: 'monstera', x: 1284, y: MB - 58, w: 56, h: 58, potW: 20, potH: 10, leaves: 9, seed: 32, stage: 'mezz', s: .6 },
    { id: 'mzPalm', kind: 'palm', x: 1424, y: MB - 64, w: 62, h: 64, potW: 18, potH: 10, leaves: 12, seed: 33, stage: 'mezz', s: .8, neon: '#3be8ff' },
    { id: 'mzFern2', kind: 'fern', x: 1488, y: MB - 52, w: 48, h: 52, potW: 18, potH: 10, leaves: 15, seed: 34, stage: 'mezz', s: .7, pal: 'sage' },
    { id: 'vineA', kind: 'vine', x: 1192, y: 59, w: 40, h: 58, hang: 1, pot: 'none', leaves: 6, seed: 41, stage: 'vine', s: .9, pal: 'light' },
    { id: 'vineB', kind: 'vine', x: 1258, y: 59, w: 32, h: 44, hang: 1, pot: 'none', leaves: 5, seed: 42, stage: 'vine', s: .8 },
    { id: 'vineC', kind: 'vine', x: 1318, y: 59, w: 30, h: 40, hang: 1, pot: 'none', leaves: 4, seed: 43, stage: 'vine', s: .8, pal: 'sage' },
    { id: 'vineD', kind: 'vine', x: 1462, y: 59, w: 34, h: 36, hang: 1, pot: 'none', leaves: 4, seed: 44, stage: 'vine', s: .7, pal: 'light' },
    { id: 'boardFern', kind: 'fern', x: 1260, y: 133, w: 40, h: 32, potW: 14, potH: 8, leaves: 12, seed: 51, stage: 'top', s: .6, pal: 'sage', pot: 'terra' },
    { id: 'termNeon', kind: 'neon', x: 1103, y: 170, w: 24, h: 24.6, potW: 12, potH: 8, leaves: 7, seed: 52, stage: 'top', s: .5, pot: 'glass' },
    { id: 'gateSans', kind: 'sansevieria', x: 1374, y: 70, w: 26, h: 30.6, potW: 13, potH: 8, leaves: 7, seed: 53, stage: 'top', s: .4, pot: 'chrome' },
    { id: 'benchFern', kind: 'fern', x: 1290, y: 296, w: 34, h: 60, potW: 15, potH: 11, leaves: 14, seed: 61, stage: 'layer', depth: 356.4, s: .7, pal: 'light' },
    { id: 'gateGold', kind: 'fern', x: 1484, y: 304, w: 38, h: 40.4, potW: 17, potH: 11, leaves: 13, seed: 62, stage: 'layer', depth: 344.6, s: .6, pot: 'terra', neon: '#ffd06a' },
    { id: 'cornerMon', kind: 'monstera', x: 1500, y: 280, w: 36, h: 86, potW: 18, potH: 15, leaves: 10, seed: 63, stage: 'layer', depth: 366.2, s: .9 },
  ];
  // гаджети на антресолі: x — лівий край, y — лінія, на якій стоять
  const GADGETS = [{ id: 'mzBot', kind: 'botToy', x: 1250, y: MB }, { id: 'mzCube', kind: 'holoCube', x: 1354, y: MB }, { id: 'mzOrb', kind: 'orb', x: 1396, y: MB }];
  // лампи Едісона під антресоллю над верстатом (спалахують, коли Nexi з інструментами); золотий ліхтар над порталом
  const BULBS = [{ x: 1201, top: 66, y: 94 }, { x: 1291, top: 66, y: 98 }], GOLD = { x: 1414, y: 70, w: 20, h: 30, top: 66 };
  // м'які тіні рослин і штучок на стіні (запікаються в стіну — rwing_wall.js)
  LIST.filter(d => d.stage !== 'layer').forEach(d => RW.shades.push({ ell: [d.x + d.w / 2 + 1, d.y + d.h * .45 + 2, d.w * (d.hang ? .4 : .46), d.h * (d.hang ? .44 : .48)], k: d.hang ? .3 : .42 }));
  RW.shades.push({ ell: [GOLD.x + GOLD.w / 2 + 1.5, GOLD.y + GOLD.h / 2 + 2, GOLD.w * .6, GOLD.h * .55], k: .4 });

  const groups = { mezz: [], vine: [], top: [] };
  LIST.forEach(d => {
    const o = NX.addObject({
      id: 'rp_' + d.id, name: 'obj.plant', act: 'rustle', rw: d.stage === 'layer', d, shake: 0, ph: P.hash(d.x, d.y) * 6, hit: { x: d.x + 2, y: d.y, w: d.w - 4, h: d.h },
      onTap() { this.shake = 1; NX.nexi.emote('happy', 1.5); for (let i = 0; i < 8; i++) NX.fx.emit('spark', d.x + Math.random() * d.w, d.y + Math.random() * d.h * .6, { col: Math.random() < .6 ? '#9aff7a' : '#ffe27a', vy: -20 - Math.random() * 20, g: 30, ttl: 1, s: 1.1 }); return true; },
      update(dt) { this.shake = Math.max(0, this.shake - dt * .9); },
      draw(c, t) { if (!this.sp) this.sp = K.plant(d); K.sway(c, this.sp, d.x, d.y, t, this.ph, this.shake, d.s); },
      layers(t) { return d.stage === 'layer' ? [{ y: d.depth, draw: c => { c.save(); c.fillStyle = 'rgba(2,0,10,.5)'; c.beginPath(); c.ellipse(d.x + d.w / 2, d.y + d.h - .4, d.potW / 2 + 2.4, 1.8, 0, 0, 7); c.fill(); c.restore(); this.draw(c, t); } }] : []; },
    });
    if (groups[d.stage]) groups[d.stage].push(o);
  });
  // гаджети: статика — растр, живе — live()
  const gad = GADGETS.map(d => { const o = NX.addObject({ id: 'rg_' + d.id, name: 'obj.plant', act: 'rustle', d, hit: null,
    sp() { if (!this._sp) { this._sp = K.gadget(d.kind); this.hit = { x: d.x, y: d.y - this._sp.h, w: this._sp.w, h: this._sp.h - 3 }; } return this._sp; },
    onTap() { const sp = this.sp(); for (let i = 0; i < 10; i++) NX.fx.emit('spark', d.x + Math.random() * sp.w, d.y - sp.h + Math.random() * sp.h * .6, { col: Math.random() < .5 ? '#7af0ff' : '#ff7af0', vy: -20 - Math.random() * 20, g: 30, ttl: 1, s: 1.1 }); NX.nexi.emote('happy', 1.2); return true; },
    draw(c, t) { const sp = this.sp(), R = F.res(), y = d.y - sp.h; c.save(); c.imageSmoothingEnabled = R < 3.8; c.drawImage(F.fit(sp.cv, sp.w, sp.h, R), d.x, y, sp.w, sp.h); c.restore(); sp.live(c, d.x, y, t, 0); } }); o.sp(); return o; });
  // золотий ліхтар: латунна рамка, скляні грані, тепле полум'я (растр + живе світло)
  let GL = null;
  function buildGold() {
    const { w, h } = GOLD, S = F.Sheet(0, 0, w, h), BR = ['#4a2a08', '#7a4a10', '#b07a1c', '#e0aa30', '#ffd468', '#fff0b0'];
    S.poly([[w / 2 - 3, 2], [w / 2 + 3, 2], [w - 2, 7], [2, 7]], (u, v, i, j) => v < .3 ? BR[4] : ramp(BR, .7 - v * .4, i, j));            // дашок
    S.rr(w / 2 - 1.6, 0, w / 2 + 1.6, 2.6, 1, (d) => d < .4 ? OUT : BR[3]);
    S.rect(3, 7, w - 3, h - 5, (u, v, i, j, X, Y) => { const e = Math.min(X - 3, w - 3 - X); if (e < .6) return OUT; if (e < 1.8 || Math.abs(X - w / 2) < .5) return ramp(BR, .8 - v * .4, i, j); if (Math.abs(Y - (h - 5 + 7) / 2) < .45) return BR[2]; return ramp(['#c86a1e', '#f0a03a', '#ffd06a', '#ffe9a6', '#fff8dc'], .95 - Math.abs(u - .5) * 1.3 - Math.abs(v - .55) * .7, i, j); });
    S.poly([[2, h - 5], [w - 2, h - 5], [w / 2 + 3, h - 1], [w / 2 - 3, h - 1]], (u, v, i, j) => ramp(BR, .7 - v * .5, i, j));             // дно
    return { cv: S.canvas(), w, h };
  }
  NX.addObject({
    id: 'rwingPlants', rw: true, span: [1096, 1536],
    drawBack(c, t) {
      const R = F.res(), tb = NX.objects.tools ? NX.objects.tools.lamp || 0 : 0;
      // лампи Едісона над верстатом (шнури з-під антресолі)
      if (!this.bulb) { this.bulb = K.lamp('edison'); GL = buildGold(); }
      BULBS.forEach(b => { const cx = b.x + 5; c.strokeStyle = '#0a0612'; c.lineWidth = 1.1; c.beginPath(); c.moveTo(cx, b.top); c.lineTo(cx, b.y + .5); c.stroke(); c.save(); c.imageSmoothingEnabled = R < 3.8; c.drawImage(F.fit(this.bulb.cv, 10, 20, R), b.x, b.y, 10, 20); c.restore(); this.bulb.live(c, b.x, b.y, t, tb); });
      // золотий ліхтар на ланцюжку
      const g = GOLD, sw = Math.sin(t * .7) * .04; c.save(); c.translate(g.x + g.w / 2, g.top); c.rotate(sw); c.translate(-(g.x + g.w / 2), -g.top);
      c.strokeStyle = '#6a4a10'; c.lineWidth = .9; c.setLineDash([1, .8]); c.beginPath(); c.moveTo(g.x + g.w / 2, g.top); c.lineTo(g.x + g.w / 2, g.y); c.stroke(); c.setLineDash([]);
      c.imageSmoothingEnabled = R < 3.8; c.drawImage(F.fit(GL.cv, g.w, g.h, R), g.x, g.y, g.w, g.h);
      c.globalCompositeOperation = 'lighter'; const f = .82 + .1 * Math.sin(t * 5.7) + .06 * Math.sin(t * 12.1);
      RW.glow(c, g.x + g.w / 2, g.y + g.h * .55, 34, 'rgba(255,180,80,.9)', .3 * f); RW.glow(c, g.x + g.w / 2, g.y + g.h * .55, 9, 'rgba(255,236,170,1)', .45 * f);
      c.restore();
      groups.top.forEach(o => o.draw(c, t));
      groups.vine.forEach(o => o.draw(c, t));
    },
  });
  // речі на антресолі малюються ПЕРЕД її растром (rwing_wall.js -> rwingMezz): лицьова грань ховає їхній низ
  RW.items.push((c, t) => { groups.mezz.forEach(o => o.draw(c, t)); gad.forEach(o => o.draw(c, t)); });

  // ---------- світло в повітрі: свій шар (wing_air.js -> NX.wing.air) після зон крила — серпанок, промені, пил ----------
  if (NX.wing.air) {
    const WARM = [255, 172, 92], BULB = [255, 206, 132], tl = () => (NX.objects.tools ? NX.objects.tools.lamp || 0 : 0);
    NX.wing.air('rwingAir', [
      { id: 'rLant', ax: 1162.5, ay: 236, hx: 5, hy: 12, dir: Math.PI / 2 + .25, spread: .95, len: 92, col: WARM, rays: 7, haze: .45, ray: .55, dust: 12, seed: 11, fl: t => .85 + .1 * Math.sin(t * 6.1) + .05 * Math.sin(t * 13.3) },
      { id: 'rGold', ax: GOLD.x + GOLD.w / 2, ay: GOLD.y + GOLD.h * .55, hx: 9, hy: 12, dir: Math.PI / 2, spread: 1.1, len: 64, col: [255, 186, 96], rays: 9, haze: .42, ray: .5, dust: 10, seed: 12, sway: { x: GOLD.x + GOLD.w / 2, y: GOLD.top, k: .04, ph: 0 }, fl: t => .84 + .1 * Math.sin(t * 5.7) + .06 * Math.sin(t * 12.1) },
      ...BULBS.map((b, n) => ({ id: 'rBulb' + n, ax: b.x + 5, ay: b.y + 12.5, hx: 5, hy: 7, dir: Math.PI / 2, spread: .6, len: 78, beam: 1, col: BULB, rays: 0, haze: .36, ray: 0, dust: 10, seed: 13 + n, fl: t => (.78 + .14 * Math.sin(t * 7 + b.x) + .08 * Math.sin(t * 13.7)) * (1 + .7 * tl()) })),
      ...RW.SPOTS.map((x, n) => { const [px, py] = RW.mz(x, RW.MZ.YB, RW.MZ.ZB / 2); return { id: 'rSpot' + n, ax: px, ay: py + 1, hx: 2, hy: 1, dir: Math.PI / 2, spread: .32, len: 70, beam: 1, col: [255, 214, 160], rays: 0, haze: .3, ray: 0, dust: 6, seed: 16 + n, fl: t => .82 + .18 * Math.sin(t * 5.3 + n * 2) * Math.sin(t * 1.7 + n) }; }),
      { id: 'rBench', ax: 1289, ay: 299.6, hx: 0, hy: 0, dir: Math.PI / 2 + .35, spread: .5, len: 18, rr: 4, floorY: 313.4, beam: 1, col: [255, 222, 152], rays: 0, haze: .3, ray: 0, dust: 6, seed: 19, fl: t => tl() },
    ], [1060, 1536]);
  }
})();
