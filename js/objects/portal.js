/* ============================================================================
 * objects/portal.js — ПОРТАЛ: брама кодом, вихор, подорож Nexi, гості
 * ----------------------------------------------------------------------------
 * Третя зона правого крила (найближча до глядача, x 1314..1532), уся кодом у стилі кімнати (NX.kit):
 *   БРАМА (x 1344..1516 × 100..336) — масивна рама з фіолетової сталі зі зрізаними верхніми кутами,
 *     подвійний рожевий неоновий контур, панелі з болтами, вивіска зони (K.sign «ПОРТАЛ» мовою глядача,
 *     іконка — спіраль); АРКА-ОТВІР (x 1370..1490, верх — півеліпс) з хромованим ободом і блакитним /
 *     рожевим неоном; ПІЛОНИ обабіч — LED-шкали заряду (наповнюються, коли портал заряджається),
 *     вентиляційні ґратки; праворуч — рожева неонова трубка.
 *   ПОМОСТ (x 1328..1532): верхній ярус — тут стає Nexi й виходять гості (POI.portal.step, y 344),
 *     нижня сходинка з блакитним неоном; глянцевий верх з неоновим колом перед аркою.
 *   ПУЛЬТ ліворуч (x 1314..1340) — стійка з похилою голо-панеллю: гліфи напрямку, «заряд».
 *   ВИХОР (живий, обрізаний аркою): темна глибина, 4 спіральні рукави, частинки падають у центр,
 *     пульс-кільця; поверх — неонові дуги-кільця, блискавки по ободу, світловий стовп під час заряду,
 *     світляний басейн на підлозі, ударні хвилі, спалах.
 * ВЗАЄМОДІЯ (як і була): ТАП по порталу -> з вихору виходять гості (actors/visitors). Кнопка ПОРТАЛ ->
 *   Nexi сам мандрує: стає на помост -> 'charge' (вихор розкручується, частинки затягує, шкали пілонів
 *   наповнюються) -> закручується й зникає -> 'travel' (над брамою голо-вікно з тим, що він там робить:
 *   проєкти / команда / клієнти) -> 'return' (спалах, Nexi вилітає назад і розповідає результат).
 * ========================================================================== */
(() => {
  const P = NX.px, F = NX.furn, K = NX.kit, RW = NX.rwing, { NAVY, PINK, CYAN, CHROME, OUT } = F.PAL, ramp = F.ramp, hash = NX.art.hash, rgba = K.rgba, lit = K.lit;
  const ACC = ['#3a0a5a', '#7a2aa8', '#b04ae0', '#d98aff'];                        // акцент зони — фіолетовий
  const VIO = ['#07041a', '#0e0a2a', '#17103c', '#211650', '#2c1d66', '#39257e', '#483096', '#5b3eb0'];
  const STEEL = ['#06051a', '#0c0a28', '#141038', '#1c164a', '#261e5e', '#322874', '#40348c', '#5244a6'];
  const GX = 1430, GY = 258, RX = 60, RY = 84;                                       // центр і піврозміри вихору (як були — гості виходять звідси)
  const GATE = { x0: 1344, x1: 1516, y0: 100, y1: 336, cut: 22, sign: [1370, 114, 1490, 144] };
  const ARCH = { x0: 1370, x1: 1490, top: 170, spring: 222, bot: 336 };            // отвір: півеліпс угорі (від spring), прямі боки
  const DAIS = { x0: 1340, x1: 1520, back: 334, top: 346, step: 352, bot: 358, sx0: 1328, sx1: 1532 };
  const PULT = { x0: 1314, x1: 1340, y0: 300, y1: 352 };
  const PYL = [[1350, 1364], [1496, 1510]];                                          // LED-шкали заряду на пілонах
  const inArch = (X, Y) => { if (X < ARCH.x0 || X > ARCH.x1 || Y > ARCH.bot) return false; if (Y >= ARCH.spring) return true; const rx = (ARCH.x1 - ARCH.x0) / 2, ry = ARCH.spring - ARCH.top; return ((X - GX) / rx) ** 2 + ((Y - ARCH.spring) / ry) ** 2 <= 1; };
  const archPath = (() => { const p = new Path2D(), rx = (ARCH.x1 - ARCH.x0) / 2, ry = ARCH.spring - ARCH.top; p.moveTo(ARCH.x0, ARCH.bot); p.lineTo(ARCH.x0, ARCH.spring); p.ellipse(GX, ARCH.spring, rx, ry, 0, Math.PI, 0); p.lineTo(ARCH.x1, ARCH.bot); p.closePath(); return p; })();
  const toL = (x, y, f = .035) => F.toVP(x, y, f);

  RW.shades.push({ box: [GATE.x0, GATE.y0, GATE.x1, GATE.y1], dx: 3, dy: 2.5, r: 18, k: .55 }, { box: [PULT.x0, PULT.y0, PULT.x1, PULT.y1], dx: 2, dy: 2, r: 7, k: .45 }, { box: [1518, 100, 1526, 346], dx: 2.5, dy: 0, r: 5, k: .45 });

  // ---------- БРАМА, ПОМОСТ, ПУЛЬТ (4 px/од.) ----------
  function buildGate() {
    const S = F.Sheet(1306, 92, 1536, 360), { x0, x1, y0, y1, cut } = GATE;
    // бічна грань брами (до вікна)
    S.poly([[x0 + .4, y0 + cut], toL(x0, y0 + cut), toL(x0, y1), [x0 + .4, y1]], (u, v, i, j) => u > .78 ? '#ff4fd8' : ramp(VIO, .3 - v * .16, i, j));
    // рама: восьмикутник зі зрізаними верхніми кутами; подвійний неоновий контур, панелі, болти; отвір — прозорий (вихор — живий)
    const frame = [[x0 + cut, y0], [x1 - cut, y0], [x1, y0 + cut], [x1, y1], [x0, y1], [x0, y0 + cut]];
    S.poly(frame, (u, v, i, j, X, Y) => {
      if (inArch(X, Y)) return null;
      const ex = Math.min(X - x0, x1 - X), ey = Y - y0, ec = Math.min(X - x0 + Y - y0 - cut, x1 - X + Y - y0 - cut) / 1.414, e = Math.min(ex, ey, ec);   // відстань до зовнішнього краю
      if (e < .6) return OUT; if (e < 1.6) return '#ff4fd8'; if (e < 2.2) return '#ffc2ec'; if (e < 2.9) return '#3a0a3a';
      if (e < 4.4) return ramp(VIO, .7 - v * .3, i, j);
      if (e > 6.6 && e < 7.6) return '#ff4fd8';                                                              // внутрішній неоновий контур
      const sy = ((Y - y0 - 8) % 30 + 30) % 30; if (sy < .6 && (X < ARCH.x0 - 2 || X > ARCH.x1 + 2)) return '#05031a';
      if ((Math.abs(X - 1357) < .7 || Math.abs(X - 1503) < .7) && sy > 3 && sy < 4.4) return CHROME[3];      // болти пілонів
      return ramp(VIO, .4 - v * .2 + (Y < 150 ? .06 : 0), i, j, .1);
    });
    S.rr(GATE.sign[0] - 2.4, GATE.sign[1] - 2.4, GATE.sign[2] + 2.4, GATE.sign[3] + 2.4, 4, (d) => d < .6 ? '#05031a' : '#0d0828');   // ніша вивіски
    // обід арки: хром, блакитний і рожевий неон, темна щілина до вихору
    const rx = (ARCH.x1 - ARCH.x0) / 2, ry = ARCH.spring - ARCH.top;
    S.rect(ARCH.x0 - 7, ARCH.top - 7, ARCH.x1 + 7, ARCH.bot, (u, v, i, j, X, Y) => {
      if (inArch(X, Y)) return null;
      let d; if (Y >= ARCH.spring) d = Math.min(Math.abs(X - ARCH.x0), Math.abs(X - ARCH.x1)); else { const q = Math.hypot((X - GX) / rx, (Y - ARCH.spring) / ry); d = (q - 1) * Math.min(rx, ry) * .95; }
      if (d > 6.4) return null;
      if (d < .8) return '#0a0418'; if (d < 1.8) return d < 1.3 ? '#d8fbff' : '#3be8ff'; if (d < 2.4) return '#06102e';
      if (d < 4.6) return ramp(CHROME, .78 - (d - 2.4) * .18 - v * .2, i, j); if (d < 5.6) return '#ff4fd8'; return OUT;
    });
    // LED-шкали заряду на пілонах (світять живим) і ґратки
    PYL.forEach(([a, b]) => { for (let k = 0; k < 10; k++) { const y = 176 + k * 14; S.rr(a + 3, y, b - 3, y + 9, 1, (d) => d < .4 ? OUT : '#14082a'); } S.rect(a + 2, 318, b - 2, 332, (u, v, i, j, X, Y) => ((Y * 1.3) | 0) % 2 ? VIO[0] : VIO[3]); });
    // рожева неонова трубка праворуч (на хомутах)
    S.rect(1518, 100, 1526, 346, (u, v, i, j, X, Y) => { const cl = [130, 210, 290].some(y => Math.abs(Y - y) < 1.4); if (cl) return u < .15 || u > .85 ? OUT : ramp(CHROME, .7 - u * .5, i, j); return u < .2 || u > .8 ? (u < .1 || u > .9 ? OUT : '#ff4fd8') : (Math.abs(u - .5) < .12 ? '#ffd4ff' : '#ff7ae0'); });
    // ПОМОСТ: нижня сходинка, верхній ярус (видимий верх з неоновим колом), бічна грань
    S.poly([[DAIS.sx0 + .4, DAIS.step], toL(DAIS.sx0, DAIS.step, .04), toL(DAIS.sx0, DAIS.bot, .04), [DAIS.sx0 + .4, DAIS.bot]], (u, v, i, j) => u > .8 ? '#3be8ff' : ramp(STEEL, .3 - v * .2, i, j));
    S.rect(DAIS.sx0, DAIS.step - 2.4, DAIS.sx1, DAIS.bot, (u, v, i, j, X, Y) => { if (Y < DAIS.step) return ramp(STEEL, .5 + (Y - DAIS.step) * .06, i, j, .06); const dy = Y - DAIS.step; if (dy < .5) return '#9af6ff'; if (dy < 1.2) return '#3be8ff'; if (dy > 5.4) return OUT; return ramp(STEEL, .42 - dy * .05, i, j, .08); });
    S.rect(DAIS.x0, DAIS.back, DAIS.x1, DAIS.step, (u, v, i, j, X, Y) => {
      if (Y >= DAIS.top) { const dy = Y - DAIS.top; if (dy < .5) return '#ffc2ec'; if (dy < 1.2) return '#ff4fd8'; if (X - DAIS.x0 < .5 || DAIS.x1 - X < .5) return OUT; return ((X - DAIS.x0) % 20 < .6) ? '#05031a' : ramp(STEEL, .46 - dy * .06, i, j, .08); }
      const e = ((X - GX) / 64) ** 2 + ((Y - 341) / 5.4) ** 2;
      if (Math.abs(e - 1) < .12) return e < 1 ? '#3be8ff' : '#0a2a4a';                                          // неонове коло перед аркою (світить живим)
      return ramp(STEEL, .18 + (Y - DAIS.back) / 12 * .34 + (((X * .5 + Y) | 0) % 23 === 0 ? .12 : 0), i, j, .08);
    });
    // ПУЛЬТ ліворуч: стійка, похила голо-панель (гліфи — живі), кнопки
    S.poly([[PULT.x0 + .4, PULT.y0 + 8], toL(PULT.x0, PULT.y0 + 8), toL(PULT.x0, PULT.y1), [PULT.x0 + .4, PULT.y1]], (u, v, i, j) => u > .8 ? '#3be8ff' : ramp(STEEL, .26 - v * .16, i, j));
    S.rr(PULT.x0 + 4, PULT.y0 + 12, PULT.x1 - 4, PULT.y1, [1, 1, .6, .6], (d, u, v, i, j, X, Y) => d < .5 ? OUT : (Y > PULT.y1 - 6 ? (Y > PULT.y1 - 1 ? OUT : ramp(STEEL, .45, i, j)) : ((Y * 1.2) | 0) % 6 === 0 ? VIO[1] : ramp(VIO, .4 - v * .2 + (u < .2 ? .12 : 0), i, j, .08)));
    S.poly([[PULT.x0, PULT.y0 + 2], [PULT.x1, PULT.y0 - 4], [PULT.x1, PULT.y0 + 8], [PULT.x0, PULT.y0 + 14]], (u, v, i, j) => v < .14 ? CHROME[4] : v > .86 ? OUT : (u > .08 && u < .92 && v > .26 && v < .78) ? '#061032' : ramp(STEEL, .5 - v * .2, i, j));
    return S;
  }

  let GS = null;
  const ensure = () => { if (!GS) { GS = buildGate(); GS.cv = GS.canvas(); } };
  RW.static(50, () => (ensure(), GS));                                               // брама з помостом і пультом — у злиття правого крила (rwing_wall.js)
  const portal = NX.addObject({
    id: 'portal', name: 'obj.portal', act: 'portal', rw: true, span: [1304, 1536],
    hit: { x: 1314, y: 96, w: 212, h: 262 }, phase: 'idle', flare: 0, flash: 0, view: 0, dest: 'projects', charge: 0,
    DESTS: ['projects', 'team', 'clients'], ICON: { projects: '#ffc94d', team: '#3bff8a', clients: '#3be8ff' },
    onTap() { if (this.phase !== 'idle') return true; if (!NX.visitors.wave()) NX.fx.emit('note', GX, 230); return true; },
    /** Спалах + ударна хвиля по підлозі (коли хтось виходить/заходить). */
    burst(k = 1) { this.flash = Math.max(this.flash, k); this.waves.push({ t: 0, k }); for (let i = 0; i < 24 * k; i++) { const a = Math.random() * 6.28; NX.fx.emit('spark', GX + Math.cos(a) * 50, GY + Math.sin(a) * 70, { vx: Math.cos(a) * 60, vy: Math.sin(a) * 60 - 20, col: Math.random() < .5 ? '#ff7af0' : '#7af0ff' }); } },
    waves: [], bolt: null,
    update(dt) {
      this.flash = Math.max(0, this.flash - dt * 2);
      const target = { idle: 0, charge: .7, travel: 1, return: 1 }[this.phase]; this.flare += (target - this.flare) * Math.min(1, dt * 3);
      this.charge += ((this.phase === 'idle' ? 0 : 1) - this.charge) * Math.min(1, dt * (this.phase === 'idle' ? .8 : 1.6));
      this.view += ((this.phase === 'travel' ? 1 : 0) - this.view) * Math.min(1, dt * 4);
      if (this.phase !== 'idle' && Math.random() < .5 + this.flare) {                        // частинки затягує у вихор
        const a = Math.random() * 6.28, r = 70 + Math.random() * 30;
        NX.fx.list.push({ type: 'portal', x: 0, y: 0, cx: GX - 2, cy: GY - 10, orbit: r, a0: a, age: 0, ttl: .9, s: 1.5, col: Math.random() < .5 ? '#d94bff' : '#3be8ff', vx: 0, vy: 0 });
      }
    },
    /* Вихор (живий): у межах арки — глибина, спіральні рукави, частинки в центр, пульс-кільця;
     * поверх — неонові дуги, блискавки по ободу, світловий стовп під час заряду, басейн світла, хвилі, спалах. */
    /** Вихор — в окреме полотно (до 2 px/од., раз на 2 кадри; форма арки — один раз маскою), щокадру — один drawImage.
     *  (Раніше ~250 дрібних заливок під складним clip() щокадру — найдорожче в крилі, особливо на телефоні.) */
    vortexCached(c, t) {
      const R = Math.min(2, F.res()), x0 = ARCH.x0 - 2, y0 = ARCH.top - 2, w = ARCH.x1 - ARCH.x0 + 4, h = ARCH.bot - ARCH.top + 2;
      if (!this.vc || this.vcR !== R) { this.vc = document.createElement('canvas'); this.vc.width = Math.round(w * R); this.vc.height = Math.round(h * R); this.vcR = R; this.vfr = 0;
        this.vm = document.createElement('canvas'); this.vm.width = this.vc.width; this.vm.height = this.vc.height; const m = this.vm.getContext('2d'); m.setTransform(R, 0, 0, R, -x0 * R, -y0 * R); m.fill(archPath); }
      if ((this.vfr++ % 2) === 0 || RW.patching) {
        const v = this.vc.getContext('2d'); v.setTransform(1, 0, 0, 1, 0, 0); v.globalCompositeOperation = 'source-over'; v.clearRect(0, 0, this.vc.width, this.vc.height);
        v.setTransform(R, 0, 0, R, -x0 * R, -y0 * R); this.vortexIn(v, t);
        v.setTransform(1, 0, 0, 1, 0, 0); v.globalCompositeOperation = 'destination-in'; v.drawImage(this.vm, 0, 0); v.globalCompositeOperation = 'source-over';
      }
      c.save(); c.imageSmoothingEnabled = false; c.drawImage(this.vc, x0, y0, w, h); c.restore();
      this.vortexOut(c, t);
    },
    /** Глибина вихору (у межах арки; маска — у vortexCached). */
    vortexIn(c, t) {
      const f = this.flare;
      c.save();
      const dg = c.createRadialGradient(GX, GY, 4, GX, GY, RY + 10); dg.addColorStop(0, '#ffffff'); dg.addColorStop(.07, '#9af6ff'); dg.addColorStop(.28, '#3a1a9a'); dg.addColorStop(.7, '#14063a'); dg.addColorStop(1, '#22084a');
      c.fillStyle = dg; c.fillRect(ARCH.x0, ARCH.top, ARCH.x1 - ARCH.x0, ARCH.bot - ARCH.top);
      c.globalCompositeOperation = 'lighter';
      for (let arm = 0; arm < 4; arm++) for (let i = 0; i < 46; i++) {                                    // спіральні рукави
        const q = i / 46, a = arm * Math.PI / 2 + q * 7 - t * (1.6 + f * 3), r = q;
        P.rect(c, GX + Math.cos(a) * RX * r, GY + Math.sin(a) * RY * r, 2.5 - q, 2.5 - q, arm % 2 ? `rgba(122,240,255,${.75 - q * .5})` : `rgba(255,122,240,${.75 - q * .5})`);
      }
      for (let i = 0; i < 26; i++) { const ph = (t * .6 + P.hash(i)) % 1, a = P.hash(i + 40) * 6.28 + ph * 3, r = 1 - ph; P.rect(c, GX + Math.cos(a) * RX * r, GY + Math.sin(a) * RY * r, 1.5, 1.5, `rgba(255,255,255,${ph})`); }
      for (let k = 0; k < 3; k++) { const ph = (t * .45 + k / 3) % 1; c.strokeStyle = `rgba(160,240,255,${.5 * (1 - ph)})`; c.lineWidth = 1.2; c.beginPath(); c.ellipse(GX, GY, 6 + ph * RX, 8 + ph * RY, 0, 0, 7); c.stroke(); }
      for (let r = 0; r < 5; r++) {                                                                        // неонові дуги-кільця (у глибині)
        c.strokeStyle = r % 2 ? 'rgba(59,232,255,.85)' : 'rgba(217,75,255,.9)'; c.lineWidth = 2 - r * .2 + f;
        const a0 = t * (1 + r * .35 + f * 5) * (r % 2 ? 1 : -1) + r * 1.3; c.beginPath(); c.ellipse(GX, GY, RX - 4 - r * 9, RY - 4 - r * 12, 0, a0, a0 + 1.6 + (r % 3) * .6 + f); c.stroke();
      }
      if (f > .05) { const g = c.createLinearGradient(0, ARCH.top, 0, ARCH.bot); g.addColorStop(0, 'rgba(217,75,255,0)'); g.addColorStop(1, `rgba(217,75,255,${.45 * f})`); c.fillStyle = g; c.fillRect(GX - 50, ARCH.top, 100, ARCH.bot - ARCH.top); }
      c.restore();
    },
    /** Поверх арки: блискавки по ободу, загальне світіння. */
    vortexOut(c, t) {
      const f = this.flare, fl = this.flash;
      c.save(); c.globalCompositeOperation = 'lighter';
      if (!this.bolt && Math.random() < .03 + f * .1) { const a = Math.random() * 6.28, pts = []; for (let i = 0; i <= 6; i++) { const q = i / 6, aa = a + q * (.6 + Math.random() * .4); pts.push([GX + Math.cos(aa) * (RX + 2) + (Math.random() - .5) * 5, Math.min(ARCH.bot - 2, GY + Math.sin(aa) * (RY - 4) + (Math.random() - .5) * 5)]); } this.bolt = { pts, t: .15 }; }
      if (this.bolt) { c.strokeStyle = '#ffffff'; c.lineWidth = 1.2; c.beginPath(); this.bolt.pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke(); c.strokeStyle = 'rgba(122,240,255,.5)'; c.lineWidth = 3; c.stroke(); if ((this.bolt.t -= 1 / 60) <= 0) this.bolt = null; }
      c.restore();
      RW.glow(c, GX, GY, 70 + f * 40 + fl * 40, 'rgba(217,75,255,.75)', .3 + .12 * Math.sin(t * 2) + f * .4 + fl * .4);
    },
    /** Живе на брамі: неонові контури дихають, обід арки, шкали заряду, коло на помості, трубка, пульт. */
    live(c, t) {
      const f = this.flare, ch = this.charge;
      c.save(); c.globalCompositeOperation = 'lighter';
      c.strokeStyle = rgba('255,79,216', .16 + .08 * Math.sin(t * 1.5) + f * .2); c.lineWidth = 3;
      c.beginPath(); const { x0, x1, y0, y1, cut } = GATE; c.moveTo(x0 + cut, y0 - 1); c.lineTo(x1 - cut, y0 - 1); c.lineTo(x1 + 1, y0 + cut); c.lineTo(x1 + 1, y1); c.moveTo(x0 - 1, y1); c.lineTo(x0 - 1, y0 + cut); c.closePath(); c.stroke();
      c.strokeStyle = rgba('59,232,255', .22 + .1 * Math.sin(t * 2.2) + f * .3); c.lineWidth = 1.6; c.stroke(archPath);
      PYL.forEach(([a, b], s) => { for (let k = 0; k < 10; k++) { const y = 176 + (9 - k) * 14, lv = ch * 10 - k, on = lv > 0 ? Math.min(1, lv) : 0, idle = .25 + .15 * Math.sin(t * 2 + k * .6 + s); lit(c, a + 4, y + 1.2, b - a - 8, 6.6, rgba(on > .02 ? (k > 6 ? '255,122,240' : '122,240,255') : '120,80,200', on > .02 ? .5 + .5 * on : idle * (k === Math.floor(t * 3) % 10 ? 2 : 1))); } });
      c.strokeStyle = rgba('59,232,255', .3 + .2 * Math.sin(t * 2.5) + f * .4); c.lineWidth = .8; c.beginPath(); c.ellipse(GX, 341, 64, 5.4, 0, 0, 7); c.stroke();
      c.fillStyle = rgba('255,79,216', .28 + .14 * Math.sin(t * 1.9)); c.fillRect(1520, 100, 4, 246);
      c.fillStyle = rgba('59,232,255', .3 + .2 * Math.sin(t * 1.6)); c.fillRect(DAIS.sx0 + 1, DAIS.step + .3, DAIS.sx1 - DAIS.sx0 - 2, 1);
      // пульт: голо-гліфи напрямку й смужка заряду
      const px0 = PULT.x0 + 3, py0 = PULT.y0 + 2;
      for (let k = 0; k < 3; k++) { const d = this.DESTS[k], on = d === this.dest; lit(c, px0 + 2 + k * 6.4, py0 + 2.2 - k * .9, 4.4, 2.6, rgba(on ? '255,226,122' : '90,200,255', on ? .9 : .4)); }
      lit(c, px0 + 1, py0 + 7 - 1.6, (PULT.x1 - PULT.x0 - 8) * Math.max(.08, ch), 1.2, rgba('122,240,255', .8));
      for (let k = 0; k < 3; k++) lit(c, PULT.x0 + 7 + k * 4.5, PULT.y1 - 4.4, 1.6, 1.6, hash(k, Math.floor(t * 2)) > .4 ? ['#3bff8a', '#ff4fd8', '#ffe27a'][k] : '#14082a');
      RW.glow(c, (PULT.x0 + PULT.x1) / 2, PULT.y0 + 4, 12, 'rgba(59,232,255,.8)', .18 + ch * .2);
      c.restore();
    },
    drawBack(c, t) {
      ensure();
      const fl = this.flash, f = this.flare;
      this.vortexCached(c, t);                                                       // вихор — поверх злиття, точно в отворі арки (растр брами з прозорою аркою — у злитті)
      this.live(c, t);
      K.sign(c, GATE.sign[0], GATE.sign[1], GATE.sign[2] - GATE.sign[0], GATE.sign[3] - GATE.sign[1], { acc: ACC, icon: 'spiral', key: 'nav.portal', t, glow: '217,75,255', text: '230,200,255' });
      RW.glow(c, GX, 352, 90, 'rgba(160,90,255,.7)', .26 + .1 * Math.sin(t * 3) + fl * .5);                  // світляний басейн на підлозі
      this.waves = this.waves.filter(w => (w.t += 1 / 60) < 1); this.waves.forEach(w => { c.save(); c.globalAlpha = (1 - w.t) * w.k; c.strokeStyle = '#7af0ff'; c.lineWidth = 2; c.beginPath(); c.ellipse(GX, 356, 20 + w.t * 160, 4 + w.t * 22, 0, 0, 7); c.stroke(); c.restore(); });
      if (fl > 0) RW.glow(c, GX, GY, 140, 'rgba(255,255,255,.95)', fl * .9);
      if (this.view > .02) this.drawPreview(c, t);
    },
    /** Голо-вікно над порталом: що Nexi робить "там". */
    drawPreview(c, t) {
      const x = 1356, y = 104, w = 148, h = 82, d = this.dest, col = this.ICON[d];
      c.save(); c.globalAlpha = this.view; P.rect(c, x, y, w, h, '#06102ee0'); P.holo(c, x, y, w, h, col, t, 1);
      P.text(c, NX.t('portal.dest.' + d).toUpperCase(), x + 5, y + 9, col, 4.5);
      if (d === 'projects') for (let k = 0; k < 3; k++) { P.rect(c, x + 6 + k * 47, y + 14, 42, 64, 'rgba(255,255,255,.06)'); for (let i = 0; i < 3; i++) { const mv = (t * .5 + i * .33 + k * .2) % 1, cxp = x + 9 + k * 47 + (k < 2 && i === 0 ? mv * 47 : 0); P.rect(c, cxp, y + 18 + i * 20, 36, 15, ['#ffc94d', '#ff7af0', '#3be8ff'][(i + k) % 3] + '55'); P.rect(c, cxp + 3, y + 22 + i * 20, 22, 2, '#ffffff'); } }
      if (d === 'team') for (let i = 0; i < 4; i++) { const ax = x + 22 + i * 35, ay = y + 40; c.fillStyle = ['#ff7af0', '#3be8ff', '#ffc94d', '#3bff8a'][i]; c.beginPath(); c.arc(ax, ay, 10, 0, 7); c.fill(); P.rect(c, ax - 3, ay - 3, 2, 2, '#06102e'); P.rect(c, ax + 1, ay - 3, 2, 2, '#06102e'); P.rect(c, ax + 6, ay + 6, 4, 4, Math.sin(t * 3 + i) > 0 ? '#3bff8a' : '#1f6a45'); if ((Math.floor(t * 1.5) + i) % 4 === 0) { P.rect(c, ax - 10, ay - 26, 22, 10, '#ffffff'); P.text(c, '...', ax - 7, ay - 18, '#06102e', 4); } }
      if (d === 'clients') { for (let i = 0; i < 4; i++) { const ph = (t * .4 + i / 4) % 1, by = y + 74 - ph * 56, left = i % 2; c.globalAlpha = this.view * Math.min(1, (1 - ph) * 3); P.rect(c, left ? x + 8 : x + 58, by, 82, 12, left ? '#0f1b4d' : '#2a1450'); P.rect(c, (left ? x + 12 : x + 62), by + 5, 50 + i * 6, 2, left ? '#3be8ff' : '#ff7af0'); } c.globalAlpha = this.view; P.rect(c, x + w - 24, y + 2, 20, 10, '#ff3b6a'); P.text(c, '+3', x + w - 21, y + 10, '#fff', 4.5); }
      c.restore();
    },
    /** Віддзеркалення в підлозі під зоною (rwing_floor.js): брама з помостом і пультом. */
    reflect(c, t) { if (GS) K.draw(c, GS, Math.min(2, F.res())); },
  });
  RW.reflectors.push((c, t) => portal.reflect(c, t));
})();
