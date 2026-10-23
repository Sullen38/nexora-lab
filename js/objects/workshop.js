/* ============================================================================
 * objects/workshop.js — МАЙСТЕРНЯ 2.0 (сканер + маніпулятор встановлення скінів)
 * ----------------------------------------------------------------------------
 * Порожня платформа: над нею крутиться голограма Nexi в поточному скіні.
 * Nexi на платформі (this.active):
 *   - кільце сканера їздить уздовж корпусу, на табло "SCAN xx%"
 *   - навколо нього по орбіті літають 3 голограми скінів-пропозицій
 *   - відкривається Лабораторія скінів
 * install() — коли обрано новий скін: маніпулятор зі стелі капсули
 * опускається до голови Nexi, іскрить, спалах — і скін встановлено.
 * ========================================================================== */
NX.addObject({
  id: 'workshop', name: 'obj.workshop', act: 'workshop',
  hit: { x: 930, y: 170, w: 170, h: 165 }, active: false, prog: 0, inst: 0, cv: document.createElement('canvas'), tc: document.createElement('canvas'),
  OFFERS: [{ theme: 'neon', ant: 'gamer', back: 'wings' }, { theme: 'gold', ant: 'crown', body: 'premium' }, { theme: 'space', body: 'cosmos', ant: 'holo', head: 'phones' }],
  install() { this.inst = 1.3; },
  update(dt) {
    if (this.inst > 0) { this.inst -= dt; const k = 1 - this.inst / 1.3; if (k > .35 && k < .7) { for (let i = 0; i < 2; i++) NX.fx.emit('spark', 1005 + (Math.random() - .5) * 8, this.nozzleY + 3); } if (k > .5 && k < .56) NX.nexiPhys.land(2); }
  },
  /** Голограма-спрайт: тонуємо пікселі бота кольором. */
  holo(c, look, pose, t, x, footY, s, alpha, hue) {
    renderBot({ ...DEFAULT_LOOK, ...look }, pose, t, this.cv);
    const tc = this.tc; tc.width = SW; tc.height = SH; const tx = tc.getContext('2d'); tx.drawImage(this.cv, 0, 0);
    tx.globalCompositeOperation = 'source-atop'; tx.fillStyle = hue; tx.fillRect(0, 0, SW, SH);
    const sx = Math.cos(t * 1.4), w = SW * s * Math.max(.08, Math.abs(sx));
    c.save(); c.globalAlpha = alpha; c.imageSmoothingEnabled = false; c.translate(x, 0); c.scale(sx < 0 ? -1 : 1, 1); c.drawImage(tc, -w / 2, footY - FOOT * s, w, SH * s); c.restore();
  },
  get nozzleY() { const k = this.inst > 0 ? Math.sin((1 - this.inst / 1.3) * Math.PI) : 0; return 214 + k * 44; },
  drawBack(c, t) {
    const P = NX.px, [px, py] = NX.cfg.POI.workshop.pad;
    c.save(); c.globalCompositeOperation = 'lighter';
    const g = c.createLinearGradient(0, py - 76, 0, py); g.addColorStop(0, 'rgba(217,75,255,0)'); g.addColorStop(1, `rgba(217,75,255,${this.active ? .6 : .35})`);
    c.fillStyle = g; c.fillRect(px - 28, py - 76, 56, 76); c.restore();
    if (!this.active) { this.holo(c, NX.nexi.look, poseFor('stand', t, false), t, px, py + 3, 1.0, .7, 'rgba(80,220,255,.45)'); for (let i = 0; i < 3; i++) P.rect(c, px - 22, py - 62 + ((t * 20 + i * 20) % 60), 44, .7, 'rgba(160,240,255,.6)'); }
    else this.orbit(c, t, false);
    P.glow(c, px, py - 4, 36, 'rgba(217,75,255,.6)', .5 + (this.active ? .2 : 0));
  },
  /** Орбіта з трьох голограм-пропозицій; front=true — ті, що перед Nexi. */
  orbit(c, t, front) {
    const [px, py] = NX.cfg.POI.workshop.pad;
    this.OFFERS.forEach((lk, i) => { const a = t * 1.1 + i * 2.094, s2 = Math.sin(a); if ((s2 > 0) !== front) return;
      this.holo(c, lk, poseFor('stand', t + i, false), t + i, px + Math.cos(a) * 38, py - 6 + s2 * 6, .6, .75 + s2 * .2, ['rgba(255,80,220,.5)', 'rgba(255,200,80,.5)', 'rgba(120,140,255,.5)'][i]); });
  },
  layers(t) {
    const [px, py] = NX.cfg.POI.workshop.pad, P = NX.px, L = [];
    L.push({ y: py + .6, draw: c => {
      if (this.active) {
        this.orbit(c, t, true);
        const k = Math.sin(t * 2.5) * .5 + .5, y = py - 4 - k * 56;                     // кільце сканера
        c.save(); c.strokeStyle = '#3be8ff'; c.lineWidth = 1.5; c.shadowColor = '#3be8ff'; c.shadowBlur = 8; c.beginPath(); c.ellipse(px, y, 23, 5, 0, 0, Math.PI * 2); c.stroke(); c.restore();
        P.rect(c, 1040, 296, 34, 13, '#06102ee6'); P.holo(c, 1040, 296, 34, 13, '#3be8ff', t, 1); P.text(c, 'SCAN ' + Math.floor(this.prog * 100) + '%', 1042, 305, '#9af6ff', 3.4);
      }
      // маніпулятор (кріплення під куполом капсули)
      const ny = this.nozzleY; P.rect(c, 994, 202, 22, 5, '#3a4070'); P.rect(c, 994, 202, 22, 1, '#7a84c0');
      P.rect(c, 1002, 207, 6, ny - 207, '#8a93b8'); P.rect(c, 1002, 207, 2, ny - 207, '#c3cbea'); P.rect(c, 1000, (207 + ny) / 2 - 2, 10, 4, '#5a6590');
      P.rect(c, 998, ny, 14, 6, '#5a6590'); P.rect(c, 1002, ny + 6, 6, 3, this.inst > 0 ? '#ff4fd8' : '#3be8ff');
      P.glow(c, 1005, ny + 8, 14, this.inst > 0 ? 'rgba(255,80,220,.9)' : 'rgba(59,232,255,.6)', .7);
      if (this.inst > 0 && this.inst < .65 && this.inst > .45) P.glow(c, px, py - 34, 60, 'rgba(255,255,255,.95)', .8);
    } });
    return L;
  },
});
