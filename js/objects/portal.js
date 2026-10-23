/* ============================================================================
 * objects/portal.js — ПОРТАЛ 2.0: меню напрямків, заряд, подорож, повернення
 * ----------------------------------------------------------------------------
 * Тап по порталу відкриває голо-меню з трьома напрямками (Проєкти / Команда /
 * Клієнти). Обраний напрямок -> сценарій 'portal' (activities.js):
 *   Nexi натискає пульт -> phase 'charge' (вихор розкручується, частинки
 *   затягує всередину) -> Nexi закручується й зникає -> phase 'travel'
 *   (над порталом голо-вікно з тим, що він там робить) -> phase 'return'
 *   (спалах, Nexi вилітає назад з планшетом і розповідає результат).
 * ========================================================================== */
NX.addObject({
  id: 'portal', name: 'obj.portal', act: 'portal',
  hit: { x: 1335, y: 95, w: 170, h: 255 }, phase: 'idle', flare: 0, flash: 0, menu: 0, view: 0, dest: 'projects',
  DESTS: ['projects', 'team', 'clients'], ICON: { projects: '#ffc94d', team: '#3bff8a', clients: '#3be8ff' },
  optRect(i) { return { x: 1290, y: 196 + i * 23, w: 82, h: 19 }; },
  /** Тап по пункту меню (перевіряється раніше за інші об'єкти). */
  tapFirst(x, y) {
    if (this.menu <= 0) return false;
    for (let i = 0; i < 3; i++) { const r = this.optRect(i); if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) { this.menu = 0; this.dest = this.DESTS[i]; NX.nexi.do('portal'); return true; } }
    return false;
  },
  onTap() { if (this.phase !== 'idle') return true; if (NX.kozak.pop()) { setTimeout(() => { this.menu = 9; }, 3500); return true; } this.menu = 9; return true; },
  update(dt) {
    this.menu = Math.max(0, this.menu - dt); this.flash = Math.max(0, this.flash - dt * 2);
    const target = { idle: 0, charge: .7, travel: 1, return: 1 }[this.phase]; this.flare += (target - this.flare) * Math.min(1, dt * 3);
    this.view += ((this.phase === 'travel' ? 1 : 0) - this.view) * Math.min(1, dt * 4);
    if (this.phase !== 'idle' && Math.random() < .5 + this.flare) {                        // частинки затягує у вихор
      const a = Math.random() * 6.28, r = 70 + Math.random() * 30;
      NX.fx.list.push({ type: 'portal', x: 0, y: 0, cx: 1428, cy: 248, orbit: r, a0: a, age: 0, ttl: .9, s: 1.5, col: Math.random() < .5 ? '#d94bff' : '#3be8ff', vx: 0, vy: 0 });
    }
  },
  drawBack(c, t) {
    const P = NX.px, cx = 1428, cy = 248, f = this.flare;
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let r = 0; r < 5; r++) {
      c.strokeStyle = r % 2 ? 'rgba(59,232,255,.75)' : 'rgba(217,75,255,.85)'; c.lineWidth = 2 + f * 1.5;
      const a0 = t * (1.2 + f * 6) * (r % 2 ? 1 : -1) + r; c.beginPath(); c.ellipse(cx, cy, 60 - r * 11, 74 - r * 13, 0, a0, a0 + 2.2 + f); c.stroke();
    }
    if (f > .05) { const g = c.createLinearGradient(0, cy - 140, 0, 350); g.addColorStop(0, 'rgba(217,75,255,0)'); g.addColorStop(1, `rgba(217,75,255,${.4 * f})`); c.fillStyle = g; c.fillRect(cx - 48, cy - 140, 96, 350 - cy + 140); }
    c.restore();
    P.glow(c, cx, cy, 60 + f * 40, 'rgba(217,75,255,.7)', .3 + .2 * Math.sin(t * 2) + f * .45);
    if (this.flash > 0) P.glow(c, cx, cy, 120, 'rgba(255,255,255,.95)', this.flash);
    if (this.view > .02) this.drawPreview(c, t);
  },
  /** Голо-вікно над порталом: що Nexi робить "там". */
  drawPreview(c, t) {
    const P = NX.px, x = 1352, y = 116, w = 152, h = 84, d = this.dest, col = this.ICON[d];
    c.save(); c.globalAlpha = this.view; P.rect(c, x, y, w, h, '#06102ee0'); P.holo(c, x, y, w, h, col, t, 1);
    P.text(c, NX.t('portal.dest.' + d).toUpperCase(), x + 5, y + 9, col, 4.5);
    if (d === 'projects') for (let k = 0; k < 3; k++) { P.rect(c, x + 6 + k * 49, y + 14, 44, 66, 'rgba(255,255,255,.06)'); for (let i = 0; i < 3; i++) { const mv = (t * .5 + i * .33 + k * .2) % 1, cxp = x + 9 + k * 49 + (k < 2 && i === 0 ? mv * 49 : 0); P.rect(c, cxp, y + 18 + i * 20, 38, 15, ['#ffc94d', '#ff7af0', '#3be8ff'][(i + k) % 3] + '55'); P.rect(c, cxp + 3, y + 22 + i * 20, 24, 2, '#ffffff'); } }
    if (d === 'team') for (let i = 0; i < 4; i++) { const ax = x + 22 + i * 36, ay = y + 40; c.fillStyle = ['#ff7af0', '#3be8ff', '#ffc94d', '#3bff8a'][i]; c.beginPath(); c.arc(ax, ay, 10, 0, 7); c.fill(); P.rect(c, ax - 3, ay - 3, 2, 2, '#06102e'); P.rect(c, ax + 1, ay - 3, 2, 2, '#06102e'); P.rect(c, ax + 6, ay + 6, 4, 4, Math.sin(t * 3 + i) > 0 ? '#3bff8a' : '#1f6a45'); if ((Math.floor(t * 1.5) + i) % 4 === 0) { P.rect(c, ax - 10, ay - 26, 22, 10, '#ffffff'); P.text(c, '...', ax - 7, ay - 18, '#06102e', 4); } }
    if (d === 'clients') { for (let i = 0; i < 4; i++) { const ph = (t * .4 + i / 4) % 1, by = y + 76 - ph * 58, left = i % 2; c.globalAlpha = this.view * Math.min(1, (1 - ph) * 3); P.rect(c, left ? x + 8 : x + 60, by, 84, 12, left ? '#0f1b4d' : '#2a1450'); P.rect(c, (left ? x + 12 : x + 64), by + 5, 50 + i * 6, 2, left ? '#3be8ff' : '#ff7af0'); } c.globalAlpha = this.view; P.rect(c, x + w - 24, y + 2, 20, 10, '#ff3b6a'); P.text(c, '+3', x + w - 21, y + 10, '#fff', 4.5); }
    c.restore();
  },
  layers(t) {
    const L = [{ y: 338, draw: c => {                                        // пульт керування
      const P = NX.px, on = this.phase !== 'idle';
      P.cube(c, 1366, 338, 36, 58, 6, '#1c1440', '#2e2266', '#120c2c');
      P.rect(c, 1370, 285, 28, 18, '#06061e'); c.strokeStyle = on ? '#ff4fd8' : '#7a3a9a'; c.lineWidth = 1; c.strokeRect(1370.5, 285.5, 27, 17);
      if (this.phase === 'charge') { P.text(c, '>>', 1373, 296, '#ffe27a', 4); P.rect(c, 1373, 299, 22 * ((t * 1.2) % 1), 2, '#ff4fd8'); }
      else if (this.phase === 'travel') { P.text(c, NX.t('portal.dest.' + this.dest).slice(0, 5).toUpperCase(), 1372, 296, this.ICON[this.dest], 3.5); }
      else { c.beginPath(); c.ellipse(1384, 294, 6, 6, 0, t * 3, t * 3 + 4.5); c.stroke(); }
      [0, 1, 2].forEach(i => P.rect(c, 1372 + i * 9, 308, 6, 4, on && Math.floor(t * 6) % 3 === i ? '#3be8ff' : '#3a2a6a'));
      P.rect(c, 1372, 316, 24, 2, '#d94bff'); P.rect(c, 1382, 274, 4, 6, '#5a6590'); P.rect(c, 1381, 271, 6, 3, Math.sin(t * 6) > 0 ? '#ff4fd8' : '#7a3a9a');
      P.glow(c, 1384, 294, 22, 'rgba(217,75,255,.6)', on ? .8 : .35);
    } }];
    if (this.menu > 0) L.push({ y: 1e5, draw: c => {                          // голо-меню напрямків
      const P = NX.px, a = Math.min(1, this.menu * 2); c.save(); c.globalAlpha = a;
      P.rect(c, 1286, 178, 90, 90, '#06102ee8'); P.holo(c, 1286, 178, 90, 90, '#d94bff', t, 1); P.text(c, NX.t('portal.choose'), 1291, 189, '#ff7af0', 4.2);
      this.DESTS.forEach((d, i) => { const r = this.optRect(i), col = this.ICON[d]; P.rect(c, r.x, r.y, r.w, r.h, '#0a1236'); c.strokeStyle = col; c.lineWidth = 1; c.strokeRect(r.x + .5, r.y + .5, r.w - 1, r.h - 1); P.rect(c, r.x + 4, r.y + 6, 7, 7, col); P.text(c, NX.t('portal.dest.' + d), r.x + 15, r.y + 12, '#ffffff', 4.2); });
      c.restore();
    } });
    return L;
  },
});
