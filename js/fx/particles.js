/* ============================================================================
 * fx/particles.js — СИСТЕМА ЧАСТИНОК
 * ----------------------------------------------------------------------------
 * Усі "живі" дрібниці: іскри, полум'я ранця, пара кави, серця кота, Zzz,
 * біти даних, ефекти скінів (дощ, сніг, вогонь...).
 *   NX.fx.emit(type, x, y, opts) — додати частинку
 *   NX.fx.skin(kind, x, y, s, moving, dir) — ефект обраного скіна навколо Nexi
 * Типи: 'spark','flame','steam','heart','z','bit','rain','snow','fire',
 *       'bubble','trail','energy','portal','dust','note'
 * ========================================================================== */
NX.fx = {
  list: [],
  emit(type, x, y, o = {}) {
    const r = Math.random;
    const base = { type, x, y, vx: 0, vy: 0, age: 0, ttl: 1, s: 1.5, col: '#fff' };
    const T = {
      spark:  { vx: (r() - .5) * 60, vy: -20 - r() * 50, g: 120, ttl: .5, col: r() < .5 ? '#ffe27a' : '#fff' },
      flame:  { vx: (r() - .5) * 10, vy: 40 + r() * 30, ttl: .25, s: 2, col: r() < .5 ? '#ffe27a' : '#ff7a2a' },
      steam:  { vx: (r() - .5) * 6, vy: -14, ttl: 1.6, s: 2, col: 'rgba(255,255,255,.6)' },
      heart:  { vx: (r() - .5) * 10, vy: -18, ttl: 1.6, s: 1, col: '#ff5ae0' },
      note:   { vx: (r() - .5) * 10, vy: -16, ttl: 1.6, s: 1, col: '#ffe27a' },
      z:      { vx: 6, vy: -10, ttl: 2.2, col: '#cfe6ff' },
      bit:    { ttl: .8, s: 1.5, col: r() < .5 ? '#3be8ff' : '#ff7af0' },
      rain:   { vx: -6, vy: 160, ttl: .45, s: 1, h: 5, col: '#6ab8ff' },
      snow:   { vx: (r() - .5) * 12, vy: 18, ttl: 3, s: 1.5, col: '#fff' },
      fire:   { vx: (r() - .5) * 14, vy: -40 - r() * 30, ttl: .6, s: 2, col: ['#ffe27a', '#ff9a3a', '#ff3b2e'][r() * 3 | 0] },
      bubble: { vx: (r() - .5) * 6, vy: -22, ttl: 1, s: 2, ring: 1, col: '#9ad8ff' },
      trail:  { ttl: .5, s: 4, col: r() < .5 ? '#7a5cff' : '#3be8ff' },
      energy: { vy: -70, ttl: .45, s: 1, h: 5, col: '#7af0ff' },
      portal: { ttl: .9, s: 1.5, col: r() < .5 ? '#d94bff' : '#3be8ff' },
      dust:   { vx: (r() - .5) * 16, vy: -6, ttl: .6, s: 1.5, col: 'rgba(200,180,255,.6)' },
    }[type] || {};
    this.list.push(Object.assign(base, T, o));
  },
  /** Ефект скіна "Ефекти" навколо бота. s — масштаб бота, H — його висота. */
  skin(kind, x, y, s, moving, dir) {
    const r = Math.random, H = 36 * s;
    if (kind === 'sparks' && r() < .4) this.emit('spark', x + (r() - .5) * H * .8, y - r() * H);
    if (kind === 'energy' && r() < .5) this.emit('energy', x + (r() - .5) * H * .7, y - r() * H * .6);
    if (kind === 'trail' && moving && r() < .8) this.emit('trail', x - dir * H * .25, y - r() * H * .7);
    if (kind === 'rain' && r() < .9) this.emit('rain', x + (r() - .5) * H * 1.4, y - H * 1.3);
    if (kind === 'snow' && r() < .4) this.emit('snow', x + (r() - .5) * H * 1.4, y - H * 1.3);
    if (kind === 'fire' && r() < .8) this.emit('fire', x + (r() - .5) * H * .5, y - 2);
    if (kind === 'water' && r() < .3) this.emit('bubble', x + (r() - .5) * H * .7, y - r() * H * .3);
  },
  update(dt) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i]; p.age += dt; if (p.age > p.ttl) { this.list.splice(i, 1); continue; }
      if (p.g) p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.orbit) { const a = p.a0 + p.age * 4; p.x = p.cx + Math.cos(a) * p.orbit * (1 - p.age / p.ttl); p.y = p.cy + Math.sin(a) * p.orbit * .5 * (1 - p.age / p.ttl); }
    }
  },
  draw(c) {
    const P = NX.px;
    this.list.forEach(p => {
      c.globalAlpha = 1 - p.age / p.ttl;
      if (p.type === 'z') P.text(c, p.age > 1 ? 'Z' : 'z', p.x, p.y, p.col, 5);
      else if (p.type === 'heart') { const x = Math.round(p.x), y = Math.round(p.y); P.rect(c, x, y, 2, 2, p.col); P.rect(c, x + 3, y, 2, 2, p.col); P.rect(c, x, y + 1, 5, 2, p.col); P.rect(c, x + 1, y + 3, 3, 1, p.col); P.rect(c, x + 2, y + 4, 1, 1, p.col); }
      else if (p.type === 'note') { P.rect(c, p.x, p.y, 1, 5, p.col); P.rect(c, p.x - 2, p.y + 4, 3, 2, p.col); P.rect(c, p.x, p.y, 3, 1, p.col); }
      else if (p.ring) { c.strokeStyle = p.col; c.lineWidth = .7; c.strokeRect(p.x, p.y, p.s, p.s); }
      else P.rect(c, p.x, p.y, p.w || p.s, p.h || p.s, p.col);
    });
    c.globalAlpha = 1;
  },
};
