/* ============================================================================
 * actors/cat/cat.js — РУДИЙ КІТ: ВЛАСНЕ ЖИТТЯ (поведінка)
 * ----------------------------------------------------------------------------
 * Кіт живе сам: спить (лежанка / поличка / диван / килим), їсть і п'є з мисок,
 * вмивається, ганяє м'ячик, потягується, нявкає, приходить посидіти біля Nexi.
 * Голод росте з часом -> кіт іде до миски. Якщо миска порожня — нявкає,
 * і Nexi сам іде насипати корм (activities.js → feedCat).
 * Публічно: NX.cat.purr(сек) — коли Nexi гладить; NX.cat.hitTest(x,y).
 * ========================================================================== */
NX.cat = {
  x: 80, y: 349, ground: 349, alt: 0, dir: 1, mode: 'act', pose: 'sleep', timer: 12, frame: 0, ft: 0,
  hunger: .2, target: null, then: null, jump: null, cv: document.createElement('canvas'), name: 'Рудик',
  spots() { const cc = NX.objects.catCorner; return {
    bed: { x: 80, y: 349 }, platform: { x: 78, y: 312, from: [78, 362] }, sofa: { x: 820, y: 320, from: [820, 364] },
    rug: { x: NX.objects.rug.home[0] + 70, y: NX.objects.rug.home[1] + 4 },
    beanbag: { x: NX.objects.lounge.pos[0] + 6, y: NX.objects.lounge.pos[1] - 26 * NX.px.depthK(NX.objects.lounge.pos[1]), from: [NX.objects.lounge.pos[0] + 6, NX.objects.lounge.pos[1] + 6] } }; },

  /** Наступна справа: вибір за потребами та випадком. */
  decide() {
    const cc = NX.objects.catCorner, r = Math.random();
    if (this.hunger > .7) { if (cc.food > .05) return this.goTo(cc.bowl[0] - 16, cc.bowl[1] + 1, () => this.set('eat', 5, () => { cc.food = Math.max(0, cc.food - .35); this.hunger = 0; })); return this.set('meow', 2.5, () => { NX.fx.emit('note', this.x, this.y - 22); NX.nexi.catHungry = true; }); }
    if (r < .25) { const keys = ['bed', 'platform', 'sofa', 'rug', 'beanbag', 'bed'], s = this.spots()[keys[Math.random() * keys.length | 0]]; return this.goTo(s.x, s.y, () => this.set('sleep', 14 + Math.random() * 14, () => this.set('stretch', 1.4)), s.from); }
    if (r < .4) return this.set('groom', 4 + Math.random() * 3);
    if (r < .58) { const b = cc.ball; return this.goTo(b.x - 12, b.y, () => { this.set('pounce', .5, () => { cc.kick((Math.random() - .3) * 160, (Math.random() - .5) * 60); }); }, null, true); }
    if (r < .7) return this.goTo(cc.water[0] - 14, cc.water[1] + 1, () => this.set('eat', 3));
    if (r < .82) { const n = NX.nexi; return this.goTo(n.x + (Math.random() < .5 ? -28 : 28), Math.max(n.y, 362), () => this.set('sit', 6)); }
    const [wx, wy] = NX.room.clampWalk(60 + Math.random() * 1400, 362 + Math.random() * NX.cam.front * .7);
    return this.goTo(wx, wy, () => this.set('sit', 3));
  },
  set(pose, dur, done) { this.mode = 'act'; this.pose = pose; this.timer = dur; this.then = done || null; },
  /** Іти до точки (якщо ціль на висоті — спершу до точки під нею, потім стрибок). */
  goTo(x, y, done, from, run) {
    if (this.alt > 0) { const g = this.ground; this.alt = 0; return this.startJump(this.x + 8 * this.dir, g, () => this.goTo(x, y, done, from, run)); }   // спершу зістрибнути вниз
    this.mode = 'walk'; this.run = !!run; this.then = done;
    if (from) { this.target = { x: from[0], y: from[1] }; this.afterWalk = () => this.startJump(x, y, done); }
    else { this.target = { x, y }; this.afterWalk = null; }
  },
  startJump(x, y, done) { this.mode = 'jump'; this.jump = { x0: this.x, y0: this.y, x1: x, y1: y, t: 0 }; this.then = done; },
  purr(d) { this.set('sit', d, null); this.dir = NX.nexi.x > this.x ? 1 : -1; for (let i = 0; i < 4; i++) setTimeout(() => NX.fx.emit('heart', this.x, this.y - 24), i * 500); },
  hitTest(x, y) { const s = NX.room.scaleAt(Math.max(this.ground, 352)); return Math.abs(x - this.x) < 14 * s && y > this.y - 20 * s && y < this.y + 4; },

  update(dt, t) {
    this.hunger = Math.min(1, this.hunger + dt / 120);
    this.ft += dt; const sp = this.mode === 'walk' ? (this.run ? 80 : 34) : 0;
    if (this.ft > (this.run ? .08 : .14)) { this.ft = 0; this.frame++; }
    if (this.mode === 'walk') {
      const dx = this.target.x - this.x, dy = this.target.y - this.y, d = Math.hypot(dx, dy);
      this.pose = this.run ? 'run' : 'walk';
      if (d < 2) { this.x = this.target.x; this.y = this.target.y; this.ground = this.y; if (this.afterWalk) { const f = this.afterWalk; this.afterWalk = null; f(); } else { this.mode = 'act'; this.pose = 'sit'; this.timer = 0; } }
      else { this.x += dx / d * sp * dt; this.y += dy / d * sp * dt; this.ground = this.y; if (Math.abs(dx) > .5) this.dir = Math.sign(dx); }
    } else if (this.mode === 'jump') {
      const j = this.jump; j.t += dt / .5; const k = Math.min(1, j.t);
      this.x = NX.px.lerp(j.x0, j.x1, k); this.y = NX.px.lerp(j.y0, j.y1, k) - Math.sin(k * Math.PI) * 26; this.pose = 'pounce'; this.dir = Math.sign(j.x1 - j.x0) || this.dir;
      if (k >= 1) { this.y = j.y1; if (j.y1 >= 356) { this.ground = j.y1; this.alt = 0; } else { this.ground = j.y0; this.alt = j.y0 - j.y1; } this.mode = 'act'; this.pose = 'sit'; this.timer = 0; }
    } else {
      this.timer -= dt;
      if (this.pose === 'sleep' && Math.random() < dt * .4) NX.fx.emit('z', this.x + 6 * this.dir, this.y - 14);
      if (this.timer <= 0) { const f = this.then; this.then = null; if (f) f(); if (this.timer <= 0 && this.mode === 'act') this.decide(); }
    }
  },
  layer() {
    return { y: this.y + (this.alt > 0 ? 6 : 0), draw: c => {
      const s = NX.room.scaleAt(this.ground), w = CAT_W * s, h = CAT_H * s;
      drawCat(this.pose, this.frame, NX.time, this.cv);
      c.save(); c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(this.x, this.y + 1, 9 * s, 2 * s, 0, 0, Math.PI * 2); c.fill();
      c.imageSmoothingEnabled = false; c.translate(this.x, 0); c.scale(this.dir, 1); c.drawImage(this.cv, -w / 2, this.y - h + s, w, h); c.restore();
    } };
  },
};
