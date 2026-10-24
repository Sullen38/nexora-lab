/* ============================================================================
 * actors/nexi/nexi.js — NEXI: СТАН, ЧЕРГА ДІЙ, МАЛЮВАННЯ В КІМНАТІ
 * ----------------------------------------------------------------------------
 * Nexi виконує ЧЕРГУ ДІЙ (queue). Кожна дія — простий об'єкт:
 *   {walk:[x,y]}  іти по підлозі          {fly:[x,y]}  летіти на ранці
 *   {hop:[x,y]}   застрибнути/зістрибнути {face:±1}    повернутись
 *   {loc:'..'}    де він зараз (для виходу) {do:fn}    виконати функцію
 *   {say:'..'}    сказати фразу           {wait:сек}   почекати
 *   {work:{pose,dur,obj,start,end}}       працювати в позі з прогресом
 *   {fade:{alpha,zoom,y,dur}}             портал: зменшитись/зникнути
 *   {rot:градуси}                          лягти (поворот спрайта)
 * Сценарії (з якої дії складається "сісти на диван" тощо) — в activities.js.
 * Тут же автономне життя: якщо довго немає команд, Nexi сам щось робить.
 * ========================================================================== */
NX.nexi = {
  x: 768, y: 440, gy: 440, dir: 1, look: { ...DEFAULT_LOOK }, loc: 'dock',
  queue: [], cur: null, task: null, history: [], speak: null, talking: false,
  alpha: 1, zoom: 1, rot: 0, back: false, lastCmd: 0, mood: null, moodT: 0, temp: null, tempT: 0,
  catHungry: false, box: null, scr: document.createElement('canvas'),

  /* ---------------- КОМАНДИ ---------------- */
  /** Виконати сценарій з activities.js. byUser=false — це "вільний час". */
  do(id, byUser = true, opt = {}) {
    const A = NX.acts[id]; if (!A) return;
    this.taskOpt = opt.task || null;   // конкретна задача зони (ui/zones.js)
    if (byUser) this.lastCmd = NX.time;
    this.finishTask(false);
    this.queue = [...this.exitRoute(), ...A.route(this)]; this.cur = null;
    this.task = { id, title: this.taskOpt ? NX.t(`zones.${id}.${this.taskOpt}.t`) : NX.t('act.' + id + '.title'), color: A.color || '#3be8ff', steps: NX.t('act.' + id + '.steps') || [], prog: 0, auto: !byUser };
    NX.ui.hud.setActive(A.nav || null);
  },
  /** Просто піти в точку підлоги (тап по підлозі). */
  walkTo(x, y) { this.lastCmd = NX.time; this.finishTask(false); const [cx, cy] = NX.room.clampWalk(x, y); this.queue = [...this.exitRoute(), { walk: [cx, cy] }, { loc: 'floor' }]; this.cur = null; },
  /** Як "вийти" з поточного місця (злізти з дивану, злетіти зі столу...). */
  exitRoute() {
    const P = NX.cfg.POI, up = { do: () => { this.rot = 0; this.back = false; } };
    return ({
      aiDesk: [{ fly: P.aiDesk.floor }],
      chairA: [{ do: () => { this.seat = null; NX.chairA.roll(NX.chairA.OUT); } }, { hop: [NX.chairA.x + 4, 366] }, { do: () => NX.chairA.roll(0) }],
      chairM: [{ do: () => { this.seat = null; NX.chairM.roll(NX.chairM.OUT); } }, { hop: [NX.chairM.x + 4, 366] }, { do: () => NX.chairM.roll(0) }],
      sofaSit: [up, { hop: P.sofa.floor }], sofaLie: [up, { hop: P.sofa.floor }], pad: [{ hop: P.workshop.floor }],
      hover: [up, { fly: P.tools.floor }], portalStep: [{ walk: P.portal.floor }],
      beanbag: [{ hop: [NX.objects.lounge.pos[0] + 30 * NX.px.depthK(NX.objects.lounge.pos[1]), NX.objects.lounge.pos[1] + 8] }],
    }[this.loc] || []).concat([{ loc: 'floor' }, up]);
  },
  finishTask(done) {
    if (done && this.task && this.taskOpt && NX.ui.zones.has(this.task.id)) { NX.ui.zones.result(this.task.id, this.taskOpt, this.task.auto); this.taskOpt = null; } if (this.task && done && !this.task.auto) this.history.push({ title: this.task.title, color: this.task.color }); if (this.history.length > 8) this.history.shift(); if (done || !this.queue.length) this.task = null; NX.objects && Object.values(NX.objects).forEach(o => { if ('active' in o && !done) o.active = false; }); },
  say(text) { this.speak = { text, t: 0 }; NX.ui.hud.bubble(text); NX.ui.chat && NX.ui.chat.add('b', text); },
  emote(m, d = 2.5) { this.mood = m; this.moodT = NX.time + d; },
  hitTest(x, y) { const b = this.box; return b && this.alpha > .3 && x > b[0] && x < b[0] + b[2] && y > b[1] && y < b[1] + b[3]; },

  /* ---------------- ВИКОНАННЯ ЧЕРГИ ---------------- */
  update(dt, t) {
    if (!this.cur && this.queue.length) { this.cur = this.queue.shift(); this.cur._t = 0; this.begin(this.cur); }
    if (this.cur) { this.cur._t += dt; if (this.step(this.cur, dt)) { this.end(this.cur); this.cur = null; } }
    if (!this.cur && !this.queue.length && this.task) { this.finishTask(true); }
    if (this.speak) { this.speak.t += dt; this.talking = this.speak.t < this.speak.text.length / 40; if (this.speak.t > this.speak.text.length / 40 + 3.2) { this.speak = null; this.talking = false; NX.ui.hud.bubble(null); } }
    this.autolife(t);
    if (this.buff && t > this.buff.until) this.buff = null;
    if (this.buff && this.buff.type === 'dizzy' && Math.random() < .25) NX.fx.emit('spark', this.x + Math.cos(t * 6) * 12, this.y - 52 + Math.sin(t * 6) * 3, { vx: 0, vy: 0, g: 0, ttl: .4, col: '#ffe27a' });
    this.moodLife(t);
    NX.nexiPhys.update(this, dt);
    if (!this.cur && !this.queue.length && !this.talking && t > (this.nextIdle || 0) && this.loc !== 'sofaLie') { this.nextIdle = t + 5 + Math.random() * 5; const a = ['look', 'stretch', 'stand', 'look'][Math.random() * 4 | 0]; if (a !== 'stand') { this.temp = a; this.tempT = t + 2.6; } }
    if (this.cur && (this.cur.fly || this.pose === 'fly' || (this.cur.work && /hover/.test(this.cur.work.pose))) && Math.random() < .7) NX.fx.emit('flame', this.x + (Math.random() < .5 ? -9 : 9) * NX.room.scaleAt(this.y) / 1.45 * (this.dir), this.y + 2);
    if (this.fxNow && this.fxNow !== 'none' && this.alpha > .5) NX.fx.skin(this.fxNow, this.x, this.y, NX.room.scaleAt(Math.max(this.y, 352)), !!(this.cur && this.cur.walk), this.dir);
  },
  begin(a) {
    if (a.walk) { a.from = [this.x, this.y]; a.run = Math.hypot(a.walk[0] - this.x, a.walk[1] - this.y) > 500; }
    if (a.fly || a.hop) { a.from = [this.x, this.y]; const to = a.fly || a.hop; a.dur = a.hop ? .45 : Math.max(.5, Math.hypot(to[0] - this.x, to[1] - this.y) / NX.cfg.FLY_SPEED); if (a.fly) for (let i = 0; i < 6; i++) NX.fx.emit('dust', this.x, this.y); }
    if (a.face) this.dir = a.face;
    if (a.loc) this.loc = a.loc;
    if (a.do) a.do();
    if (a.say) this.say(a.say);
    if (a.rot !== undefined) this.rot = a.rot;
    if (a.fade) a.from = { alpha: this.alpha, zoom: this.zoom, y: this.y };
    if (a.work) { const w = a.work; if (w.back) this.back = true; if (w.obj) { NX.objects[w.obj].active = true; NX.objects[w.obj].prog = 0; } w.start && w.start(); }
  },
  step(a, dt) {
    if (a.walk) {
      const [tx, ty] = a.walk, dx = tx - this.x, dy = ty - this.y, d = Math.hypot(dx, dy), sp = (a.run ? NX.cfg.RUN_SPEED : NX.cfg.WALK_SPEED) * dt * (this.buff && this.buff.type === 'speed' ? 2.2 : 1);
      this.pose = a.run ? 'run' : 'walk'; if (Math.abs(dx) > 1) this.dir = Math.sign(dx);
      if (d <= sp) { this.x = tx; this.y = ty; this.gy = ty; return true; } this.x += dx / d * sp; this.y += dy / d * sp; this.gy = this.y; return false;
    }
    if (a.spin) { this.dir = Math.floor(a._t * 12) % 2 ? 1 : -1; this.pose = 'spin'; if (a._t >= a.spin) { this.dir = 1; return true; } return false; }
    if (a.hop && a._t < .12) { this.pose = 'crouch'; return false; }                   // присід перед стрибком
    if (a.hop && !a.kicked) { a.kicked = true; NX.nexiPhys.kick(2.6); }
    if (a.fly || a.hop) {
      const to = a.fly || a.hop, k = Math.min(1, (a._t - (a.hop ? .12 : 0)) / a.dur);
      const e = a.hop ? k : (k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);   // плавний розгін/гальмування ранця
      this.x = NX.px.lerp(a.from[0], to[0], e); this.y = NX.px.lerp(a.from[1], to[1], e) - (a.hop ? Math.sin(k * Math.PI) * 14 : 0);
      this.pose = a.hop ? 'hop' : 'fly'; if (Math.abs(to[0] - a.from[0]) > 2) this.dir = Math.sign(to[0] - a.from[0]);
      if (k >= 1) NX.nexiPhys.land(a.hop ? 3.2 : 2.2);
      return k >= 1;
    }
    if (a.wait) { this.pose = 'stand'; return a._t >= a.wait; }
    if (a.fade) { const f = a.fade, k = Math.min(1, a._t / f.dur); if (f.spin) this.dir = Math.floor(a._t * 14) % 2 ? 1 : -1; this.alpha = NX.px.lerp(a.from.alpha, f.alpha, k); this.zoom = NX.px.lerp(a.from.zoom, f.zoom, k); if (f.y !== undefined) this.y = NX.px.lerp(a.from.y, f.y, k); this.pose = 'walk'; if (Math.random() < .6) NX.fx.list.push({ type: 'portal', x: this.x, y: this.y - 20, orbit: 26, cx: this.x, cy: this.y - 20, a0: Math.random() * 6.3, age: 0, ttl: .8, s: 1.5, col: Math.random() < .5 ? '#d94bff' : '#3be8ff', vx: 0, vy: 0 }); return k >= 1; }
    if (a.work) {
      const w = a.work; this.pose = w.pose; if (w.face) this.dir = w.face;
      const k = Math.min(1, a._t / w.dur); if (this.task) this.task.prog = k; if (w.obj) NX.objects[w.obj].prog = k;
      w.tick && w.tick(dt, k);
      return a._t >= w.dur;
    }
    return true;
  },
  end(a) { if (a.work) { const w = a.work; if (w.obj) { NX.objects[w.obj].active = false; NX.objects[w.obj].done = true; } w.end && w.end(); } },

  /* ---------------- ГОСТІ ПОРТАЛУ ----------------
   * react(v)        — побачив гостя: дивується й махає
   * eatMushroom(v)  — біжить до грибочка, з'їдає -> eatEffect() (випадковий)
   * magic()         — чари Мерліна: випадковий колір корпусу на 12 с
   * buff            — тимчасовий ефект {type, theme?, until}
   */
  buff: null,
  /** Яблуко Білосніжки: Nexi куштує й засинає на підлозі на кілька секунд. */
  appleNap() {
    if (this.cur || this.queue.length || this.loc !== 'floor' && this.loc !== 'dock') { this.emote('love', 2); return; }
    this.queue = [{ work: { pose: 'drink', dur: 1 } }, { do: () => { this.emote('sleepy', 4); this.rot = -90; } },
      { work: { pose: 'sleep', dur: 4, tick: () => Math.random() < .05 && NX.fx.emit('z', this.x - 12, this.y - 14) } },
      { do: () => { this.rot = 0; NX.nexiPhys.kick(2.5); this.emote('surprise', 2); this.say(NX.t('visitors.snowwhite.wake')); } }];
  },
  react(v) { this.emote('surprise', 1.6); if (!this.cur && !this.queue.length && this.loc !== 'sofaLie') { this.temp = 'wave'; this.tempT = NX.time + 2; } },
  eatMushroom(v) {
    this.lastCmd = NX.time; this.finishTask(false);
    const [x, y] = NX.room.clampWalk(v.x + 16, Math.max(v.y, 384));
    this.queue = [...this.exitRoute(), { walk: [x, y] }, { face: -1 }, { work: { pose: 'drink', dur: 1.1 } },
      { do: () => { v.gone = true; for (let i = 0; i < 14; i++) NX.fx.emit('spark', v.x + (Math.random() - .5) * 14, v.y - Math.random() * 16, { col: Math.random() < .5 ? '#ff7af0' : '#7af0ff' }); this.eatEffect(); } }];
    this.cur = null; this.task = { id: 'mushroom', title: NX.t('act.mushroom.title'), steps: NX.t('act.mushroom.steps'), color: '#ff7af0', prog: 0 };
    setTimeout(() => { if (!v.gone) { v.queue = [{ walk: NX.visitors.OUT }, { walk: NX.visitors.STEP }, { vanish: 1 }]; v.cur = null; } }, 16000);
  },
  eatEffect() {
    const type = ['rainbow', 'tiny', 'dizzy', 'sparkle', 'speed'][Math.random() * 5 | 0];
    this.buff = { type, until: NX.time + 9, theme: type === 'rainbow' ? 'rainbow' : null };
    if (type === 'sparkle') { this.fxNow = 'sparks'; this.fxUntil = NX.time + 9; }
    if (type === 'speed') { this.fxNow = 'trail'; this.fxUntil = NX.time + 9; }
    this.emote({ rainbow: 'love', tiny: 'surprise', dizzy: 'sleepy', sparkle: 'happy', speed: 'cool' }[type], 3);
    setTimeout(() => this.say(NX.t('act.mushroom.fx.' + type)), 300);
    if (type === 'dizzy') { this.temp = 'look'; this.tempT = NX.time + 4; }
  },
  magic() {
    const ks = Object.keys(THEMES).filter(k => k !== this.look.theme && k !== 'standard');
    this.buff = { type: 'theme', theme: ks[Math.random() * ks.length | 0], until: NX.time + 12 };
    for (let i = 0; i < 20; i++) NX.fx.emit('spark', this.x + (Math.random() - .5) * 30, this.y - Math.random() * 50, { col: '#ffe27a' });
    NX.nexiPhys.kick(2.5); this.emote('love', 2.5);
  },

  /* ---------------- ВИПАДКОВІ ЕМОЦІЇ ТА "ПОГОДА" ----------------
   * Емоції й ефекти не обираються в скінах — вони трапляються самі:
   *  - кожні 8–16 с Nexi проявляє випадкову емоцію (частіше радість);
   *  - кожні 22–40 с над ним "трапляється погода" на 6–9 с: хмаринка з дощем
   *    (він сумує), сніг (радіє), іскри, аура, вогник, бульбашки, неон...
   */
  fxNow: 'none', fxUntil: 0, nextFx: 14, nextMood: 6,
  moodLife(t) {
    if (t > this.nextMood && !this.mood) { this.nextMood = t + 8 + Math.random() * 8; const m = ['happy', 'happy', 'love', 'idea', 'cool', 'surprise', 'sleepy', 'happy', 'sad'][Math.random() * 9 | 0]; if (this.loc !== 'sofaLie') this.emote(m, 2.2); }
    if (this.fxNow !== 'none' && t > this.fxUntil) this.fxNow = 'none';
    if (t > this.nextFx && this.fxNow === 'none') {
      this.nextFx = t + 22 + Math.random() * 18; const fx = ['rain', 'snow', 'sparks', 'aura', 'fire', 'water', 'neon', 'energy', 'trail', 'rain'][Math.random() * 10 | 0];
      this.fxNow = fx; this.fxUntil = t + 6 + Math.random() * 3;
      const react = { rain: 'sad', snow: 'happy', fire: 'surprise', sparks: 'love', aura: 'cool', water: 'happy', neon: 'cool', energy: 'idea' }[fx]; if (react) setTimeout(() => this.emote(react, 2.5), 400);
    }
  },
  /* ---------------- ВІЛЬНИЙ ЧАС ---------------- */
  autolife(t) {
    if (this.cur || this.queue.length || NX.ui.skinlab.open) return;
    const idle = t - this.lastCmd;
    if (idle > NX.cfg.IDLE_BEFORE_SLEEP && this.loc !== 'sofaLie') { this.do('sleep', false); return; }
    if (idle > NX.cfg.IDLE_BEFORE_AUTOLIFE && t > (this.nextLife || 0) && this.loc !== 'sofaLie') {
      this.nextLife = t + 10 + Math.random() * 8;
      if (this.catHungry && NX.objects.catCorner.food < .2) { this.catHungry = false; this.do('feedCat', false); return; }
      if (NX.objects.coins.list.length && Math.random() < .7) { this.do('collect', false); return; }
      if (Math.random() < .35) { const z = ['ai', 'analytics', 'marketing', 'tools'][Math.random() * 4 | 0]; this.do(z, false, { task: NX.ui.zones.pick(z) }); return; }   // сам працює
      const pool = ['sofa', 'coffee', 'petCat', 'dance', 'home', 'wander', 'fountain', 'beanbag', 'laser', 'window', 'water', 'kickBall', 'selfie', 'laser'];
      this.do(pool[Math.random() * pool.length | 0], false);
    }
  },

  /* ---------------- МАЛЮВАННЯ ---------------- */
  layer() {
    return { y: this.y, refl: true, draw: (c, t) => {
      let pname = this.pose || 'stand';
      if (!this.cur && !this.queue.length) pname = this.talking ? 'talk' : (this.temp && t < this.tempT ? this.temp : (this.loc === 'sofaLie' ? 'sleep' : 'stand'));
      const p = poseFor(pname, t, !!(this.cur && this.cur.walk));
      if (this.back) p.back = 1; if (this.talking && !p.back && !p.talk) p.talk = 1;
      if (this.mood && t < this.moodT) p.face = { happy: 'happy', love: 'hearts', surprise: 'surprised', idea: 'think', sleepy: 'sleepy', sad: 'sad', angry: 'angry', cool: 'standard' }[this.mood];
      const ph = NX.nexiPhys; p.antX = ph.ax; p.antY = ph.ay; p.vel = NX.px.clamp(ph.vx / NX.cfg.RUN_SPEED, -1, 1); p.thrust = Math.min(1, Math.abs(ph.vy) / 80);
      const lookNow = this.buff && this.buff.theme ? { ...this.look, theme: this.buff.theme } : this.look;
      if (this.buff && this.buff.type === 'dizzy') { p.face = 'sleepy'; p.hx = Math.round(Math.sin(t * 6) * 1.5); }
      if (this._rt !== t) { this._rt = t; renderBot(lookNow, p, t, this.scr); }   // раз за кадр (віддзеркалення бере готовий)
      const K = NX.cam.k * NX.loop.dpr, s = NX.room.scaleAt(Math.max(this.y, 352)) * this.zoom * SPRITE_K * (this.buff && this.buff.type === 'tiny' ? .55 : 1), w = SW * s, h = SH * s, top = FOOT * s;
      const X = Math.round(this.x * K) / K, Y = Math.round(this.y * K) / K;
      const shY = p.jet ? this.gy : Y, sr = s / SPRITE_K / 1.45;
      c.save(); c.globalAlpha = .45 * this.alpha * (p.jet ? .6 : 1); c.fillStyle = '#000'; c.beginPath(); c.ellipse(X, shY + 1, 11 * sr * (2 - ph.sq), 2.5 * sr, 0, 0, 7); c.fill(); c.restore();
      if (this.fxNow === 'aura') NX.px.glow(c, X, Y - top / 2, top * .8, 'rgba(140,100,255,.6)', this.alpha);
      c.save(); c.globalAlpha = this.alpha; c.imageSmoothingEnabled = false;
      c.translate(X, Y); c.rotate(((this.rot || 0) + (this.rot ? 0 : ph.lean)) * Math.PI / 180);
      c.scale((this.dir < 0 ? -1 : 1) * (1 + (1 - ph.sq) * .55), ph.sq);                 // стискання/розтяг
      c.drawImage(this.scr, -w / 2, -top, w, h); c.restore();
      if ((this.fxNow === 'rain' || this.fxNow === 'snow') && this.alpha > .5) {   // піксельна хмаринка над головою
        const cy = Y - top - 22 + Math.sin(t * 2) * 1.5, cx = X; c.save(); c.globalAlpha = .92;
        [[-11, 2, 22, 5], [-14, 4, 28, 4], [-7, -1, 10, 4], [0, -2, 8, 5]].forEach(([dx, dy, w2, h2]) => NX.px.rect(c, cx + dx, cy + dy, w2, h2, this.fxNow === 'rain' ? '#5a6590' : '#c3cbea'));
        NX.px.rect(c, cx - 12, cy + 8, 24, 1, this.fxNow === 'rain' ? '#3a4070' : '#8a93b8'); NX.px.rect(c, cx - 6, cy, 6, 1, '#ffffff'); c.restore();
        if (Math.random() < .5) NX.fx.emit(this.fxNow === 'rain' ? 'rain' : 'snow', cx + (Math.random() - .5) * 22, cy + 9, this.fxNow === 'rain' ? { vy: 120, ttl: (Y - cy - 10) / 120 } : { vy: 16, ttl: (Y - cy - 10) / 16 });
      }
      if (this.fxNow === 'neon') { c.save(); c.globalAlpha = this.alpha; c.strokeStyle = Math.floor(t * 3) % 2 ? '#ff4fd8' : '#3be8ff'; c.lineWidth = 1.2; c.shadowColor = c.strokeStyle; c.shadowBlur = 8; c.strokeRect(X - w * .42, Y - top - 3, w * .84, top + 5); c.restore(); }
      if (this.mood && t < this.moodT) NX.px.text(c, { happy: '♪', love: '♥', surprise: '!', idea: '!?', sleepy: 'z', sad: '...', angry: '#!', cool: '*' }[this.mood], X + w * .3, Y - top - 4, '#ffe27a', 6);
      this.box = this.rot ? [X - top * .6, Y - w * .5, top * 1.2, w * .6] : [X - w * .4, Y - top, w * .8, top];
      this.headScreen = NX.cam.toScreen(X, Y - (this.rot ? w * .4 : top));
    } };
  },
};
