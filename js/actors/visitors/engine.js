/* ============================================================================
 * actors/visitors/engine.js — ГОСТІ ПОРТАЛУ: двигун (абсолютний рандом)
 * ----------------------------------------------------------------------------
 * Час від часу (і при тапі по порталу) з вихору виходить 1, 2 або 3 гостей.
 * Кожен гість — окремий файл у js/actors/visitors/ і реєструється так:
 *   NX.visitors.def('id', { W, H, speed, draw(P, pose, t, v), script(v), tap(v) })
 *     draw   — малює піксельний спрайт W×H (поза: walk/stand/... + кадр)
 *     script — повертає список кроків, що гість зробить у кімнаті
 *     tap    — що буде, якщо по ньому тапнути (необов'язково)
 * Кроки (як у Nexi): {walk:[x,y]} {fly:[x,y]} {wait:сек,pose} {say:'ключ'}
 *                    {do:fn} {face:±1}
 * Двигун сам додає вихід із порталу на початку і повернення в кінці.
 * Тексти гостей — у js/i18n/*.js -> visitors.<id>.<ключ>.
 * ========================================================================== */
NX.visitors = {
  DEFS: {}, list: [], nextWave: 45, MAX: 3,   // перша хвиля ~45 с, далі раз на 1–2 хв
  GATE: [1430, 258], STEP: [1432, 344], OUT: [1418, 380],
  def(id, d) { this.DEFS[id] = Object.assign({ id, W: 28, H: 42, speed: 40, pxs: .75 }, d); },

  /** Хвиля гостей: n — скільки (за замовчуванням випадково 1–3). */
  wave(n) {
    const free = this.MAX - this.list.length; if (free <= 0) return false;
    n = Math.min(free, n || [1, 1, 1, 1, 1, 2, 2, 3][Math.random() * 8 | 0]);
    const busy = new Set(this.list.map(v => v.def.id)), ids = Object.keys(this.DEFS).filter(i => !busy.has(i)).sort(() => Math.random() - .5).slice(0, n);
    ids.forEach((id, i) => setTimeout(() => this.spawn(id), i * 1300));
    return ids.length > 0;
  },
  spawn(id) {
    if (this.list.some(v => v.def.id === id) || this.list.length >= this.MAX) return null;   // без дублікатів
    const d = this.DEFS[id], v = { def: d, x: this.GATE[0], y: this.STEP[1], dir: -1, k: 0, alpha: 1, rot: 0, alt: 0, pose: 'stand', frame: 0, ft: 0, t: 0, say: null, cv: document.createElement('canvas'), mem: {} };
    const body = d.script(v) || [];
    v.queue = [{ emerge: 1 }, { walk: this.OUT }, ...body, { walk: this.OUT }, { walk: this.STEP }, { vanish: 1 }];
    this.list.push(v); NX.objects.portal.burst(); NX.nexi.react && NX.nexi.react(v);
    return v;
  },
  /** Сказати фразу (ключ i18n visitors.<id>.<key> або готовий текст). */
  say(v, key, dur = 2.4) { const txt = NX.t('visitors.' + v.def.id + '.' + key); v.say = { text: txt === 'visitors.' + v.def.id + '.' + key ? key : txt, t: dur }; },

  update(dt, t) {
    if (t > this.nextWave) { this.nextWave = t + 60 + Math.random() * 60; this.wave(); }
    this.list.forEach(v => this.step(v, dt));
    this.list = this.list.filter(v => !v.gone);
  },
  step(v, dt) {
    v.t += dt; v.ft += dt; if (v.ft > .14) { v.ft = 0; v.frame = (v.frame + 1) % 8; } if (v.say && (v.say.t -= dt) <= 0) v.say = null;
    if (!v.cur) { v.cur = v.queue.shift(); if (!v.cur) { v.gone = true; return; } v.cur._t = 0; if (v.cur.say) this.say(v, v.cur.say, v.cur.dur); if (v.cur.do) v.cur.do(v); if (v.cur.face) v.dir = v.cur.face; v.from = [v.x, v.y, v.alt]; }
    const a = v.cur; a._t += dt; let done = true;
    if (a.emerge) { const k = Math.min(1, a._t / .9); v.k = k; v.x = NX.px.lerp(this.GATE[0], this.STEP[0], k); v.y = NX.px.lerp(this.GATE[1] + 30, this.STEP[1], k); v.rot = (1 - k) * 8; v.pose = 'stand'; done = k >= 1; if (Math.random() < .6) this.puff(v); }
    else if (a.vanish) { const k = Math.min(1, a._t / .9); v.k = 1 - k; v.x = NX.px.lerp(this.STEP[0], this.GATE[0], k); v.y = NX.px.lerp(this.STEP[1], this.GATE[1] + 30, k); v.rot = k * 9; done = k >= 1; if (Math.random() < .6) this.puff(v); if (done && !a.flashed) { a.flashed = 1; NX.objects.portal.burst(.6); } }
    else if (a.walk || a.fly) {
      const to = a.walk || a.fly, sp = (a.fly ? (v.def.flySpeed || 70) : (a.run ? v.def.speed * 2 : v.def.speed)) * dt;
      const dx = to[0] - v.x, dy = to[1] - v.y, d = Math.hypot(dx, dy); v.pose = a.fly ? 'fly' : (a.run ? 'run' : 'walk');
      if (a.fly) v.alt += ((a.alt ?? 40) - v.alt) * Math.min(1, dt * 2); else v.alt += (0 - v.alt) * Math.min(1, dt * 4);
      if (Math.abs(dx) > .5) v.dir = Math.sign(dx);
      if (d > sp) { v.x += dx / d * sp; v.y += dy / d * sp; done = false; } else { v.x = to[0]; v.y = to[1]; done = !a.fly || Math.abs(v.alt - (a.alt ?? 40)) < 2; }
    }
    else if (a.wait) { v.pose = a.pose || 'stand'; a.tick && a.tick(v, dt, a._t); done = a._t >= a.wait; }
    if (done) v.cur = null;
  },
  puff(v) { NX.fx.list.push({ type: 'portal', x: 0, y: 0, cx: this.GATE[0], cy: this.GATE[1], orbit: 30 + Math.random() * 30, a0: Math.random() * 6.3, age: 0, ttl: .7, s: 1.5, col: v.def.color || '#d94bff', vx: 0, vy: 0 }); },

  /** Випадкова точка на підлозі. */
  spot() { const B = NX.room.walkBounds(); return NX.room.clampWalk(120 + Math.random() * 1250, 384 + Math.random() * (B.maxY - 400)); },
  scale(v) { return NX.room.scaleAt(Math.max(v.y, 352)) * v.def.pxs * (.15 + .85 * v.k); },
  hit(x, y) { return this.list.find(v => { const s = this.scale(v), w = v.def.W * s, h = v.def.H * s, by = v.y - v.alt; return Math.abs(x - v.x) < w / 2 && y > by - h && y < by + 2; }); },
  tap(v) { if (v.def.tap) v.def.tap(v); else this.say(v, 'hi'); NX.fx.emit('note', v.x, v.y - 40); },

  /** Шари для сортування за глибиною (з віддзеркаленням у підлозі). */
  layers() {
    return this.list.map(v => {
      // спрайт малюємо ОДИН раз за кадр (його використовують і сам гість, і віддзеркалення)
      const d = v.def, cv = v.cv, key = v.pose + v.frame + (v.mem.fade || 0).toFixed(2);
      if (v._key !== key) { v._key = key; cv.width = d.W; cv.height = d.H; const x = cv.getContext('2d', { willReadFrequently: true }); x.clearRect(0, 0, d.W, d.H);
        const P = (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(a, b, w, h); };
        d.draw(P, v.pose, NX.time, v, x); this.outline(x, d.W, d.H, d.outline || [30, 12, 40]); }
      return { y: v.y + .2, refl: true, draw: c => {
      const s = this.scale(v), w = d.W * s, h = d.H * s, by = v.y - v.alt;
      if (v.alt < 30) { c.save(); c.globalAlpha = .35 * v.k; c.fillStyle = '#000'; c.beginPath(); c.ellipse(v.x, v.y + 1, w * .35, 2.2 * s / .75, 0, 0, 7); c.fill(); c.restore(); }
      c.save(); c.globalAlpha = v.alpha * Math.min(1, v.k * 1.4); c.imageSmoothingEnabled = false; c.translate(v.x, by); if (v.rot) c.rotate(v.rot); if (v.dir < 0) c.scale(-1, 1);
      c.drawImage(cv, -w / 2, -h, w, h); c.restore();
      if (v.say && !c.isRefl) this.bubble(c, v.say.text, v.x, by - h - 4, d.color || '#d94bff');
    } }; });
  },
  bubble(c, msg, x, y, col) {
    c.font = '5px "Press Start 2P", monospace'; const bw = c.measureText(msg).width + 10, bx = NX.px.clamp(x - bw / 2, 4, NX.cfg.ROOM_W - bw - 4);
    NX.px.rect(c, bx, y - 12, bw, 13, '#0a0c26'); c.strokeStyle = col; c.lineWidth = 1; c.strokeRect(bx + .5, y - 11.5, bw - 1, 12); NX.px.rect(c, x - 2, y + 1, 4, 2, col);
    NX.px.text(c, msg, bx + 5, y - 3, '#ffffff', 5);
  },
  outline(x, W, H, o) {
    const id = x.getImageData(0, 0, W, H), d = id.data, op = new Uint8Array(W * H);
    for (let i = 0; i < op.length; i++) op[i] = d[i * 4 + 3] > 40 ? 1 : 0;
    for (let yy = 0; yy < H; yy++) for (let xx = 0; xx < W; xx++) { const i = yy * W + xx; if (op[i]) continue; if ((xx > 0 && op[i - 1]) || (xx < W - 1 && op[i + 1]) || (yy > 0 && op[i - W]) || (yy < H - 1 && op[i + W])) { d[i * 4] = o[0]; d[i * 4 + 1] = o[1]; d[i * 4 + 2] = o[2]; d[i * 4 + 3] = 255; } }
    x.putImageData(id, 0, 0);
  },
  /** Ноги, що крокують (спільне для людиноподібних гостей). */
  legs(P, v, pose, lx, rx, y, h, col, shoe) {
    const f = v.frame % 4, mv = pose === 'walk' || pose === 'run', a = mv && f === 1 ? 1 : 0, b = mv && f === 3 ? 1 : 0;
    P(lx - a, y, 3, h - b, col); P(rx + b, y, 3, h - a, col); P(lx - 1 - a, y + h - b, 5, 2, shoe); P(rx - 1 + b, y + h - a, 5, 2, shoe);
  },
};
