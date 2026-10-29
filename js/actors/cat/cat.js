/* ============================================================================
 * actors/cat/cat.js — РУДИЙ КІТ: ВЛАСНЕ ЖИТТЯ (поведінка)
 * ----------------------------------------------------------------------------
 * Кіт живе сам: спить (лежанка / поличка / диван / килим), їсть і п'є з мисок,
 * вмивається, ганяє м'ячик, потягується, нявкає, приходить посидіти біля Nexi.
 * Голод росте з часом -> кіт іде до миски. Якщо миска порожня — нявкає,
 * і Nexi сам іде насипати корм (activities.js → feedCat).
 * Публічно: NX.cat.purr(сек) — коли Nexi гладить; NX.cat.hitTest(x,y); goTo / set — коли кличуть сценарії Nexi.
 * Ходить лише по підлозі (FLOOR); на лежанку, поличку, диван — стрибає.
 * (Кіт на столі зони біля Nexi, фонтан, робопилосос — були до чистої основи 29.10; в історії git, коміт a941612.)
 * ========================================================================== */
NX.cat = {
  FLOOR: 378,   // кіт ходить ТІЛЬКИ по підлозі (y >= FLOOR); на меблі — лише стрибком
  x: 60, y: 397, ground: 397, alt: 0, dir: -1, mode: 'act', pose: 'sleep', timer: 12, frame: 0, ft: 0,
  hunger: .2, target: null, then: null, jump: null, cv: document.createElement('canvas'), name: 'Рудик',
  /** Місце на дивані (задане для старого місця дивану — переноситься разом з ним, core/config.js sofaPt) і точка підлоги перед ним. */
  sofaSpot(k, x, y) { const [sx, sy] = NX.cfg.sofaPt(x, y), [, fy] = NX.cfg.sofaPt(x, 384); return { [k]: { x: sx, y: sy, from: [sx, fy] } }; },
  spots() { return {
    bed: { x: 60, y: 397 }, platform: { x: 78, y: 368, from: [78, 400] }, ...this.sofaSpot('sofa', 830, 324), ...this.sofaSpot('sofaArm', 871, 301),
    rug: { x: NX.objects.rug.home[0] + 70, y: NX.objects.rug.home[1] + 4 } }; },

  /** Наступна справа: вибір за потребами та випадком. */
  decide() {
    const cc = NX.objects.catCorner, r = Math.random();
    if (this.hunger > .7) { if (cc.food > .05) return this.goTo(cc.bowl[0] - 16, cc.bowl[1] + 1, () => this.set('eat', 5, () => { cc.food = Math.max(0, cc.food - .35); this.hunger = 0; })); return this.set('meow', 2.5, () => { NX.fx.emit('note', this.x, this.y - 22); NX.nexi.catHungry = true; }); }
    if (r < .28) { const keys = ['bed', 'platform', 'sofa', 'sofaArm', 'rug', 'bed'], s = this.spots()[keys[Math.random() * keys.length | 0]]; return this.goTo(s.x, s.y, () => this.set('sleep', 14 + Math.random() * 14, () => this.set('stretch', 1.4)), s.from); }
    if (r < .44) return this.set('groom', 4 + Math.random() * 3);
    if (r < .64) { const b = cc.ball; return this.goTo(b.x - 12, b.y, () => { this.set('pounce', .5, () => { cc.kick((Math.random() - .3) * 160, (Math.random() - .5) * 60); }); }, null, true); }
    if (r < .72) return this.goTo(cc.water[0] - 14, cc.water[1] + 1, () => this.set('eat', 3));
    if (r < .84) { const n = NX.nexi; return this.goTo(n.x + (Math.random() < .5 ? -28 : 28), Math.max(n.y, 362), () => this.set('sit', 6)); }
    const [wx, wy] = NX.room.clampWalk(60 + Math.random() * 1400, 362 + Math.random() * NX.cam.front * .7);
    return this.goTo(wx, wy, () => this.set('sit', 3));
  },
  set(pose, dur, done) { this.mode = 'act'; this.pose = pose; this.timer = dur; this.then = done || null; },
  /** Іти до точки (якщо ціль на висоті — спершу до точки під нею, потім стрибок). */
  goTo(x, y, done, from, run) {
    if (this.alt > 0) { const g = this.ground; this.alt = 0; return this.startJump(this.x + 8 * this.dir, g, () => this.goTo(x, y, done, from, run)); }   // спершу зістрибнути вниз
    if (!from) y = Math.max(y, this.FLOOR);
    this.mode = 'walk'; this.run = !!run; this.then = done;
    if (from) { this.target = { x: from[0], y: from[1] }; this.afterWalk = () => this.startJump(x, y, done, true); }
    else { [x, y] = NX.room.freeAt(x, y, 'cat'); this.target = { x, y }; this.afterWalk = null; }
    this.path = NX.room.route([this.x, this.y], [this.target.x, this.target.y], 'cat');                // в обхід дивану й крісла (world/room.js)
  },
  /** Стрибок у точку (висота дуги 26, тривалість .5 с). up — на меблі: там кіт «на висоті», навіть якщо точка на екрані
   *  нижче лінії підлоги (місце біля Nexi на дивані після того, як диван поставили ближче, — y 374 > FLOOR − 4; до 29.10
   *  кіт вважав його підлогою і йшов з дивану пішки крізь диван). */
  startJump(x, y, done, up) { this.onSofa = false; this.mode = 'jump'; this.jump = { x0: this.x, y0: this.y, x1: x, y1: y, t: 0, hi: 26, dur: .5, up: !!up }; this.then = done; },
  purr(d) { this.set('happy', d, null); this.dir = NX.nexi.x > this.x ? 1 : -1; for (let i = 0; i < 4; i++) setTimeout(() => NX.fx.emit('heart', this.x, this.y - 24), i * 500); },
  hitTest(x, y) { const s = NX.room.scaleAt(Math.max(this.depthY(), 352)); return Math.abs(x - this.x) < 14 * s && y > this.y - 20 * s && y < this.y + 4; },
  /** Де кіт на підлозі (на висоті — точка, з якої стрибав). */
  floorPos() { return [this.x, this.ground]; },
  /** Глибина для масштабу: де стоїть на підлозі (на дивані — точка підлоги, з якої застрибнув). */
  depthY() { return this.ground; },

  update(dt, t) {
    this.hunger = Math.min(1, this.hunger + dt / 120);
    this.ft += dt; const sp = this.mode === 'walk' ? (this.run ? 80 : 34) : 0;
    if (this.ft > (this.run ? .08 : .14)) { this.ft = 0; this.frame++; }
    if (this.mode === 'walk') {
      const w = this.path && this.path.length > 1 ? { x: this.path[0][0], y: this.path[0][1] } : this.target;   // спершу кути обходу
      const dx = w.x - this.x, dy = w.y - this.y, d = Math.hypot(dx, dy);
      this.pose = this.run ? 'run' : 'walk';
      if (w !== this.target && d < Math.max(2, sp * dt)) { this.x = w.x; this.y = w.y; this.ground = this.y; this.path.shift(); }
      else if (d < Math.max(2, sp * dt)) { this.x = this.target.x; this.y = this.target.y; this.ground = this.y; if (this.afterWalk) { const f = this.afterWalk; this.afterWalk = null; f(); } else { this.mode = 'act'; this.pose = 'sit'; this.timer = 0; } }
      else { this.x += dx / d * sp * dt; this.y += dy / d * sp * dt; this.ground = this.y; if (Math.abs(dx) > .5) this.dir = Math.sign(dx); }
    } else if (this.mode === 'jump') {
      const j = this.jump; j.t += dt / j.dur; const k = Math.min(1, j.t);
      this.x = NX.px.lerp(j.x0, j.x1, k); this.y = NX.px.lerp(j.y0, j.y1, k) - Math.sin(k * Math.PI) * j.hi; this.pose = 'pounce'; this.dir = Math.sign(j.x1 - j.x0) || this.dir;
      if (k >= 1) { this.y = j.y1; if (!j.up && j.y1 >= this.FLOOR - 4) { this.ground = j.y1; this.alt = 0; } else { this.ground = j.y0; this.alt = Math.max(1, j.y0 - j.y1); } this.mode = 'act'; this.pose = 'sit'; this.timer = 0; }
    } else {
      this.timer -= dt;
      if (this.pose === 'sleep' && Math.random() < dt * .4) NX.fx.emit('z', this.x + 6 * this.dir, this.y - 14);
      if (this.timer <= 0) { const f = this.then; this.then = null; if (f) f(); if (this.timer <= 0 && this.mode === 'act') this.decide(); }
    }
  },
  layer() {
    const onSofa = NX.objects.sofa && NX.objects.sofa.holds(this.x, this.y, this.ground);   // на дивані — поверх нього (диван може стояти ближче до глядача)
    const bs = NX.room.scaleAt(this.depthY()) * .82, bw = CAT_W * bs / 2 + 3;                // межі малюнка — для віддзеркалення (core/loop.js)
    return { y: onSofa ? NX.cfg.SOFA.y + 1 : this.y + (this.alt > 0 ? 6 : 0), refl: !onSofa, box: [this.x - bw, this.y - CAT_H * bs - 3, this.x + bw, this.y + 3], draw: c => {
      const s = NX.room.scaleAt(this.depthY()) * .82, w = CAT_W * s, h = CAT_H * s;   // .82 — кіт у пропорції до Nexi
      if (this._rt !== NX.time) { this._rt = NX.time; drawCat(this.pose, this.frame, NX.time, this.cv); }
      c.save(); c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(this.x, this.y + 1, 9 * s, 2 * s, 0, 0, Math.PI * 2); c.fill();
      c.imageSmoothingEnabled = false; c.translate(this.x, 0); c.scale(this.dir, 1); c.drawImage(this.cv, -w / 2, this.y - h + s, w, h); c.restore();
    } };
  },
};
