/* ============================================================================
 * objects/portal.js — ПОРТАЛ 2.0: меню напрямків, заряд, подорож, повернення
 * ----------------------------------------------------------------------------
 * ТАП по порталу -> з вихору виходять гості (actors/visitors). Гості також
 * приходять самі, випадково. Кнопка меню ПОРТАЛ -> Nexi сам мандрує:
 *   Nexi стає на сходинку -> phase 'charge' (вихор розкручується, частинки
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
  onTap() { if (this.phase !== 'idle') return true; if (!NX.visitors.wave()) NX.fx.emit('note', 1430, 230); return true; },
  /** Спалах + ударна хвиля по підлозі (коли хтось виходить/заходить). */
  burst(k = 1) { this.flash = Math.max(this.flash, k); this.waves.push({ t: 0, k }); for (let i = 0; i < 24 * k; i++) { const a = Math.random() * 6.28; NX.fx.emit('spark', 1430 + Math.cos(a) * 50, 258 + Math.sin(a) * 70, { vx: Math.cos(a) * 60, vy: Math.sin(a) * 60 - 20, col: Math.random() < .5 ? '#ff7af0' : '#7af0ff' }); } },
  waves: [], bolt: null,
  update(dt) {
    this.menu = Math.max(0, this.menu - dt); this.flash = Math.max(0, this.flash - dt * 2);
    const target = { idle: 0, charge: .7, travel: 1, return: 1 }[this.phase]; this.flare += (target - this.flare) * Math.min(1, dt * 3);
    this.view += ((this.phase === 'travel' ? 1 : 0) - this.view) * Math.min(1, dt * 4);
    if (this.phase !== 'idle' && Math.random() < .5 + this.flare) {                        // частинки затягує у вихор
      const a = Math.random() * 6.28, r = 70 + Math.random() * 30;
      NX.fx.list.push({ type: 'portal', x: 0, y: 0, cx: 1428, cy: 248, orbit: r, a0: a, age: 0, ttl: .9, s: 1.5, col: Math.random() < .5 ? '#d94bff' : '#3be8ff', vx: 0, vy: 0 });
    }
  },
  /* Ефект порталу (усе в отворі порталу на картинці, центр GX,GY):
   *  1) темна глибина вихору (ховає латку картинки), 2) спіральні рукави, що
   *  крутяться, 3) 6 неонових кілець різної швидкості, 4) частинки, що падають
   *  у центр, 5) блискавки по рамці, 6) пульсуючий світляний басейн на підлозі,
   *  7) ударні хвилі при спалаху, 8) пульс-кільця від центру. */
  drawBack(c, t) {
    const P = NX.px, GX = 1430, GY = 258, RX = 60, RY = 84, f = this.flare, fl = this.flash;
    c.save(); c.beginPath(); c.ellipse(GX, GY, RX, RY, 0, 0, 7); c.clip();
    const dg = c.createRadialGradient(GX, GY, 4, GX, GY, RY); dg.addColorStop(0, '#ffffff'); dg.addColorStop(.08, '#9af6ff'); dg.addColorStop(.3, '#3a1a9a'); dg.addColorStop(.75, '#14063a'); dg.addColorStop(1, '#2a0a5a');
    c.fillStyle = dg; c.fillRect(GX - RX, GY - RY, RX * 2, RY * 2);
    c.globalCompositeOperation = 'lighter';
    for (let arm = 0; arm < 4; arm++) for (let i = 0; i < 46; i++) {                                    // спіральні рукави
      const q = i / 46, a = arm * Math.PI / 2 + q * 7 - t * (1.6 + f * 3), r = q;
      P.rect(c, GX + Math.cos(a) * RX * r, GY + Math.sin(a) * RY * r, 2.5 - q, 2.5 - q, arm % 2 ? `rgba(122,240,255,${.75 - q * .5})` : `rgba(255,122,240,${.75 - q * .5})`);
    }
    for (let i = 0; i < 26; i++) {                                                                       // частинки падають у центр
      const ph = (t * .6 + P.hash(i)) % 1, a = P.hash(i + 40) * 6.28 + ph * 3, r = 1 - ph;
      P.rect(c, GX + Math.cos(a) * RX * r, GY + Math.sin(a) * RY * r, 1.5, 1.5, `rgba(255,255,255,${ph})`);
    }
    for (let k = 0; k < 3; k++) { const ph = (t * .45 + k / 3) % 1; c.strokeStyle = `rgba(160,240,255,${.5 * (1 - ph)})`; c.lineWidth = 1.2; c.beginPath(); c.ellipse(GX, GY, 6 + ph * RX, 8 + ph * RY, 0, 0, 7); c.stroke(); }
    c.restore();
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let r = 0; r < 6; r++) {                                                                        // неонові кільця
      c.strokeStyle = r % 2 ? 'rgba(59,232,255,.85)' : 'rgba(217,75,255,.9)'; c.lineWidth = 2.2 - r * .2 + f;
      const a0 = t * (1 + r * .35 + f * 5) * (r % 2 ? 1 : -1) + r * 1.3; c.beginPath(); c.ellipse(GX, GY, RX + 4 - r * 9, RY + 4 - r * 12, 0, a0, a0 + 1.6 + (r % 3) * .6 + f); c.stroke();
    }
    if (!this.bolt && Math.random() < .03 + f * .1) { const a = Math.random() * 6.28, pts = []; for (let i = 0; i <= 6; i++) { const q = i / 6, aa = a + q * (.6 + Math.random() * .4); pts.push([GX + Math.cos(aa) * (RX + 6) + (Math.random() - .5) * 6, GY + Math.sin(aa) * (RY + 6) + (Math.random() - .5) * 6]); } this.bolt = { pts, t: .15 }; }
    if (this.bolt) { c.strokeStyle = '#ffffff'; c.lineWidth = 1.5; c.shadowColor = '#7af0ff'; c.shadowBlur = 10; c.beginPath(); this.bolt.pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke(); c.shadowBlur = 0; if ((this.bolt.t -= 1 / 60) <= 0) this.bolt = null; }
    if (f > .05) { const g = c.createLinearGradient(0, GY - 150, 0, 350); g.addColorStop(0, 'rgba(217,75,255,0)'); g.addColorStop(1, `rgba(217,75,255,${.45 * f})`); c.fillStyle = g; c.fillRect(GX - 50, GY - 150, 100, 350 - GY + 150); }
    c.restore();
    P.glow(c, GX, GY, 70 + f * 40 + fl * 40, 'rgba(217,75,255,.75)', .35 + .15 * Math.sin(t * 2) + f * .4 + fl * .4);
    P.glow(c, GX, 352, 90, 'rgba(160,90,255,.7)', .3 + .12 * Math.sin(t * 3) + fl * .5);                  // світляний басейн на підлозі
    this.waves = this.waves.filter(w => (w.t += 1 / 60) < 1); this.waves.forEach(w => { c.save(); c.globalAlpha = (1 - w.t) * w.k; c.strokeStyle = '#7af0ff'; c.lineWidth = 2; c.beginPath(); c.ellipse(GX, 356, 20 + w.t * 160, 4 + w.t * 22, 0, 0, 7); c.stroke(); c.restore(); });
    if (fl > 0) P.glow(c, GX, GY, 140, 'rgba(255,255,255,.95)', fl * .9);
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
    const L = [];
    if (this.menu > 0) L.push({ y: 1e5, draw: c => {                          // голо-меню напрямків
      const P = NX.px, a = Math.min(1, this.menu * 2); c.save(); c.globalAlpha = a;
      P.rect(c, 1286, 178, 90, 90, '#06102ee8'); P.holo(c, 1286, 178, 90, 90, '#d94bff', t, 1); P.text(c, NX.t('portal.choose'), 1291, 189, '#ff7af0', 4.2);
      this.DESTS.forEach((d, i) => { const r = this.optRect(i), col = this.ICON[d]; P.rect(c, r.x, r.y, r.w, r.h, '#0a1236'); c.strokeStyle = col; c.lineWidth = 1; c.strokeRect(r.x + .5, r.y + .5, r.w - 1, r.h - 1); P.rect(c, r.x + 4, r.y + 6, 7, 7, col); P.text(c, NX.t('portal.dest.' + d), r.x + 15, r.y + 12, '#ffffff', 4.2); });
      c.restore();
    } });
    return L;
  },
});
