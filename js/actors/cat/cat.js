/* ============================================================================
 * actors/cat/cat.js — РУДИЙ КІТ: ВЛАСНЕ ЖИТТЯ (поведінка)
 * ----------------------------------------------------------------------------
 * Кіт живе сам: спить (лежанка / поличка / диван / килим), їсть і п'є з мисок,
 * вмивається, ганяє м'ячик, потягується, нявкає, приходить посидіти біля Nexi.
 * Голод росте з часом -> кіт іде до миски. Якщо миска порожня — нявкає,
 * і Nexi сам іде насипати корм (activities.js → feedCat).
 * Публічно: NX.cat.purr(сек) — коли Nexi гладить; NX.cat.hitTest(x,y).
 * Ще кіт п'є з фонтану, ганяє м'ячик і катається на робопилососі.
 * Ходить лише по підлозі (FLOOR); на лежанку, поличку, диван, пуф — стрибає.
 * ПРИХОДИТЬ НА СТІЛ (пункт №8, objects/wing_react.js): коли Nexi сідає працювати за стіл зони,
 *   toDesk(id, місце) — кіт біжить до точки підлоги під місцем, високо застрибує на стільницю,
 *   нявкає до Nexi й вмощується (сидить, вмивається, дрімає — під увімкненою лампою частіше);
 *   leaveDesk() — Nexi пішов: потягується й зістрибує туди, звідки застрибнув. На столі кіт
 *   такого ж розміру, як Nexi за столом (desk.sy), у стрибку розмір змінюється плавно.
 * ========================================================================== */
NX.cat = {
  FLOOR: 378,   // кіт ходить ТІЛЬКИ по підлозі (y >= FLOOR); на меблі — лише стрибком
  x: 60, y: 397, ground: 397, alt: 0, dir: -1, mode: 'act', pose: 'sleep', timer: 12, frame: 0, ft: 0,
  hunger: .2, target: null, then: null, jump: null, desk: null, cv: document.createElement('canvas'), name: 'Рудик',
  spots() { const cc = NX.objects.catCorner; return {
    bed: { x: 60, y: 397 }, platform: { x: 78, y: 368, from: [78, 400] }, sofa: { x: 830, y: 324, from: [830, 384] }, sofaArm: { x: 871, y: 301, from: [871, 384] },
    rug: { x: NX.objects.rug.home[0] + 70, y: NX.objects.rug.home[1] + 4 },
    beanbag: { x: NX.objects.lounge.pos[0] + 6, y: NX.objects.lounge.pos[1] - 26 * NX.px.depthK(NX.objects.lounge.pos[1]), from: [NX.objects.lounge.pos[0] + 6, NX.objects.lounge.pos[1] + 6] } }; },

  /** Наступна справа: вибір за потребами та випадком. */
  decide() {
    if (this.desk && this.desk.phase === 'on') return this.deskLife();          // на столі біля Nexi (№8)
    const cc = NX.objects.catCorner, r = Math.random();
    if (this.hunger > .7) { if (cc.food > .05) return this.goTo(cc.bowl[0] - 16, cc.bowl[1] + 1, () => this.set('eat', 5, () => { cc.food = Math.max(0, cc.food - .35); this.hunger = 0; })); return this.set('meow', 2.5, () => { NX.fx.emit('note', this.x, this.y - 22); NX.nexi.catHungry = true; }); }
    if (r < .25) { const keys = ['bed', 'platform', 'sofa', 'sofaArm', 'rug', 'beanbag', 'bed'], s = this.spots()[keys[Math.random() * keys.length | 0]]; return this.goTo(s.x, s.y, () => this.set('sleep', 14 + Math.random() * 14, () => this.set('stretch', 1.4)), s.from); }
    if (r < .4) return this.set('groom', 4 + Math.random() * 3);
    if (r < .58) { const b = cc.ball; return this.goTo(b.x - 12, b.y, () => { this.set('pounce', .5, () => { cc.kick((Math.random() - .3) * 160, (Math.random() - .5) * 60); }); }, null, true); }
    if (r < .64) return this.goTo(cc.water[0] - 14, cc.water[1] + 1, () => this.set('eat', 3));
    if (r < .7 && NX.objects.fountain) { const [fx, fy] = NX.objects.fountain.pos, k = NX.px.depthK(fy); return this.goTo(fx - 44 * k, fy + 2, () => this.set('eat', 3.5)); }
    if (r < .76 && NX.objects.vacuum) { const v = NX.objects.vacuum; return this.goTo(v.x - 14, v.y, () => v.board(), null, true); }
    if (r < .84) { const n = NX.nexi; return this.goTo(n.x + (Math.random() < .5 ? -28 : 28), Math.max(n.y, 362), () => this.set('sit', 6)); }
    const [wx, wy] = NX.room.clampWalk(60 + Math.random() * 1400, 362 + Math.random() * NX.cam.front * .7);
    return this.goTo(wx, wy, () => this.set('sit', 3));
  },
  set(pose, dur, done) { this.mode = 'act'; this.pose = pose; this.timer = dur; this.then = done || null; },
  /** Іти до точки (якщо ціль на висоті — спершу до точки під нею, потім стрибок).
   *  jo — параметри стрибка {hi, dur, sy0, sy1}; jo.desk — це похід на стіл (№8), інакше похід на стіл скасовується. */
  goTo(x, y, done, from, run, jo) {
    if (this.desk && this.desk.phase === 'go' && !(jo && jo.desk)) this.desk = null;   // кличуть деінде — на стіл уже не йде
    if (this.alt > 0) { const g = this.ground, d = this.desk; this.alt = 0; this.desk = null; return this.startJump(this.x + 8 * this.dir, g, () => this.goTo(x, y, done, from, run, jo), d ? { sy0: d.sy, sy1: g, hi: 10, dur: .55 } : null); }   // спершу зістрибнути вниз
    if (!from) y = Math.max(y, this.FLOOR);
    this.mode = 'walk'; this.run = !!run; this.then = done;
    if (from) { this.target = { x: from[0], y: from[1] }; this.afterWalk = () => this.startJump(x, y, done, jo); }
    else { this.target = { x, y }; this.afterWalk = null; }
  },
  /** Стрибок у точку. o: hi — висота дуги (26), dur — тривалість (.5 с), sy0/sy1 — глибина для масштабу на старті/фініші (плавно). */
  startJump(x, y, done, o) { this.onSofa = false; this.mode = 'jump'; this.jump = { x0: this.x, y0: this.y, x1: x, y1: y, t: 0, hi: (o && o.hi) || 26, dur: (o && o.dur) || .5, sy0: o ? o.sy0 : undefined, sy1: o ? o.sy1 : undefined }; this.then = done; },
  purr(d) { this.set('happy', d, null); this.dir = NX.nexi.x > this.x ? 1 : -1; for (let i = 0; i < 4; i++) setTimeout(() => NX.fx.emit('heart', this.x, this.y - 24), i * 500); },
  hitTest(x, y) { const s = NX.room.scaleAt(Math.max(this.depthY(), 352)); return Math.abs(x - this.x) < 14 * s && y > this.y - 20 * s && y < this.y + 4; },

  /* ---------------- НА СТОЛІ БІЛЯ NEXI (№8, objects/wing_react.js) ---------------- */
  /** Чи може зараз піти на стіл (не катається на пилососі, не в стрибку). */
  canDesk() { return !this.riding && this.mode !== 'jump'; },
  /** Сидить на столі поруч з Nexi (тоді тап по коту — погладити, не відриваючи Nexi від роботи). */
  withNexi() { const d = this.desk; return !!(d && d.phase === 'on' && NX.wing.react && NX.wing.react.here(d.id)); },
  /** Де кіт буде на підлозі (на столі — точка, куди зістрибне). */
  floorPos() { return this.desk && this.desk.phase !== 'go' ? this.desk.from : [this.x, this.ground]; },
  /** Прийти на стіл зони id: s = {x, y — місце на стільниці, from — точка підлоги під ним, face, sy — глибина для масштабу}.
   *  Спить — спершу потягнеться; сидить деінде на висоті — зістрибне; далі біжить і високо стрибає на стіл. */
  toDesk(id, s) {
    if (this.desk && this.desk.id === id) { if (this.desk.phase === 'off' && this.alt > 0) { this.desk.phase = 'on'; this.set('sit', 1.5); } return; }   // Nexi повернувся, поки кіт потягувався, — лишається
    const go = () => { this.goTo(s.x, s.y, () => this.deskLand(), s.from, true, { desk: 1, hi: 18 + (s.from[1] - s.y) * .26, dur: .62, sy0: s.from[1], sy1: s.sy }); this.desk = Object.assign({ id, phase: 'go' }, s); };
    const down = () => { if (this.alt <= 0) return go(); const g = this.ground, d = this.desk; this.alt = 0; this.desk = null; this.startJump(d ? d.from[0] : this.x + 8 * this.dir, g, go, d ? { sy0: d.sy, sy1: g, hi: 12, dur: .55 } : null); };   // з висоти (диван, інший стіл) — спершу вниз
    if (this.desk && this.desk.phase === 'on') this.desk.phase = 'off';           // з іншого столу йде сам — щоб «Nexi пішов» не перебив
    if (this.pose === 'sleep' && this.mode === 'act') return this.set('stretch', 1, down);
    down();
  },
  /** Приземлився на стільницю: пилок з-під лап, нявкнути до Nexi, сісти поруч (Nexi радіє — wing_react.greet). */
  deskLand() {
    const d = this.desk; if (!d) return this.set('sit', 1);
    d.phase = 'on'; this.dir = d.face; for (let i = 0; i < 5; i++) NX.fx.emit('dust', this.x + (i - 2) * 3, this.y, { vy: -4, ttl: .5 });
    if (d.leave) return this.leaveDesk();                                          // поки стрибав, Nexi вже пішов
    if (NX.wing.react) NX.wing.react.greet(d.id);
    this.set('meow', 1, () => { NX.fx.emit('note', this.x, this.y - 24, { col: '#ff9ae6' }); this.set('sit', 2 + Math.random(), () => this.deskLife()); });
  },
  /** Життя на столі: сидить і дивиться на Nexi, вмивається, дрімає (під увімкненою лампою — частіше й довше), мурчить.
   *  Зголоднів — іде їсти (зістрибує сам). */
  deskLife() {
    const d = this.desk, r = Math.random(), warm = NX.wing.react ? NX.wing.react.lamp(d.id) > .5 : false; this.dir = d.face;
    if (this.hunger > .85) return this.leaveDesk();
    if (r < (warm ? .5 : .28)) return this.set('sleep', (warm ? 9 : 6) + Math.random() * 6, () => this.set('stretch', 1.1));
    if (r < .62) return this.set('groom', 2.4 + Math.random() * 2);
    if (r < .86) return this.set('sit', 2 + Math.random() * 2.5);
    return this.set('happy', 1.8, () => NX.fx.emit('heart', this.x, this.y - 24));
  },
  /** Nexi пішов зі столу: потягнутись і зістрибнути туди, звідки застрибнув (ще йде / в стрибку — скасувати). */
  leaveDesk() {
    const d = this.desk; if (!d) return;
    if (d.phase === 'go') { if (this.mode === 'jump') { d.leave = true; return; } this.desk = null; this.afterWalk = null; this.set('sit', 0); return; }
    if (d.phase === 'off') return;
    d.phase = 'off';
    this.set('stretch', 1.1, () => { const [fx, fy] = d.from; this.alt = 0; this.desk = null; this.startJump(fx, fy, () => this.set('sit', .5 + Math.random()), { sy0: d.sy, sy1: fy, hi: 12, dur: .55 }); });
  },
  /** Глибина для масштабу: на підлозі — де стоїть; на столі — як у Nexi за столом; у стрибку на стіл / зі столу — плавно між ними. */
  depthY() { const j = this.jump; if (this.mode === 'jump' && j && j.sy0 !== undefined) return NX.px.lerp(j.sy0, j.sy1, Math.min(1, j.t)); return this.desk && this.alt > 0 ? this.desk.sy : this.ground; },

  update(dt, t) {
    if (this.riding) { const v = NX.objects.vacuum; this.x = v.x; this.y = v.y + .2; this.ground = v.y; this.alt = 0; this.dir = v.vx >= 0 ? 1 : -1; this.pose = 'sit'; if ((this.rideT -= dt) <= 0) { this.riding = false; this.startJump(this.x + 20 * this.dir, NX.room.clampWalk(this.x, v.y + 10)[1], null); } return; }
    this.hunger = Math.min(1, this.hunger + dt / 120);
    this.ft += dt; const sp = this.mode === 'walk' ? (this.run ? 80 : 34) : 0;
    if (this.ft > (this.run ? .08 : .14)) { this.ft = 0; this.frame++; }
    if (this.mode === 'walk') {
      const dx = this.target.x - this.x, dy = this.target.y - this.y, d = Math.hypot(dx, dy);
      this.pose = this.run ? 'run' : 'walk';
      if (d < Math.max(2, sp * dt)) { this.x = this.target.x; this.y = this.target.y; this.ground = this.y; if (this.afterWalk) { const f = this.afterWalk; this.afterWalk = null; f(); } else { this.mode = 'act'; this.pose = 'sit'; this.timer = 0; } }
      else { this.x += dx / d * sp * dt; this.y += dy / d * sp * dt; this.ground = this.y; if (Math.abs(dx) > .5) this.dir = Math.sign(dx); }
    } else if (this.mode === 'jump') {
      const j = this.jump; j.t += dt / j.dur; const k = Math.min(1, j.t);
      this.x = NX.px.lerp(j.x0, j.x1, k); this.y = NX.px.lerp(j.y0, j.y1, k) - Math.sin(k * Math.PI) * j.hi; this.pose = 'pounce'; this.dir = Math.sign(j.x1 - j.x0) || this.dir;
      if (k >= 1) { this.y = j.y1; if (j.y1 >= this.FLOOR - 4) { this.ground = j.y1; this.alt = 0; } else { this.ground = j.y0; this.alt = j.y0 - j.y1; } this.mode = 'act'; this.pose = 'sit'; this.timer = 0; }
    } else {
      this.timer -= dt;
      if (this.pose === 'sleep' && Math.random() < dt * .4) NX.fx.emit('z', this.x + 6 * this.dir, this.y - 14);
      if (this.timer <= 0) { const f = this.then; this.then = null; if (f) f(); if (this.timer <= 0 && this.mode === 'act') this.decide(); }
    }
  },
  layer() {
    return { y: this.y + (this.alt > 0 ? 6 : 0), refl: true, draw: c => {
      const s = NX.room.scaleAt(this.depthY()) * .82, lift = this.riding ? 5 * NX.px.depthK(this.y) : 0, w = CAT_W * s, h = CAT_H * s;   // .82 — кіт у пропорції до Nexi
      if (this._rt !== NX.time) { this._rt = NX.time; drawCat(this.pose, this.frame, NX.time, this.cv); }
      c.save(); c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(this.x, this.y + 1, 9 * s, 2 * s, 0, 0, Math.PI * 2); c.fill();
      c.imageSmoothingEnabled = false; c.translate(this.x, 0); c.scale(this.dir, 1); c.drawImage(this.cv, -w / 2, this.y - h + s - lift, w, h); c.restore();
    } };
  },
};
