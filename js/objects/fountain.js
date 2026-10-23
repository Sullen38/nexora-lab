/* ============================================================================
 * objects/fountain.js — ФОНТАН З ГОЛОГРАМОЮ ГЕРБА УКРАЇНИ (передня частина кімнати)
 * ----------------------------------------------------------------------------
 * Кругла чаша з неоновим бортиком, вода з брижами, чотири струмені.
 * Над колоною по колу обертається голографічний герб України (тризуб).
 * Взаємодія (сценарій 'fountain'): Nexi кидає монетку -> сплеск, іскри, герб спалахує. Кіт іноді п'є з фонтану.
 * ========================================================================== */
NX.addObject({
  id: 'fountain', name: 'obj.fountain', act: 'fountain', pos: [1120, 450], hue: 190, flash: 0, cv: document.createElement('canvas'), tc: document.createElement('canvas'),
  // Герб: S — синій щит, B — світлий кант, Y — золотий тризуб
  TRYZUB: [
    'BBBBBBBBBBBBBBBBBBBBBBBBB',
    'BSSSSSSSSSSSSSSSSSSSSSSSB',
    'BSSSSSSSSSSSSSSSSSSSSSSSB',
    'BSSSSSSSSSSSYSSSSSSSSSSSB',
    'BSSSSSSSSSSYYYSSSSSSSSSSB',
    'BSSSSSSSSSSYYYSSSSSSSSSSB',
    'BSSSYSSSSSSYYYSSSSSSYSSSB',
    'BSSYYSSSSSSYYYSSSSSSYYSSB',
    'BSSYYSSSSSSYYYSSSSSSYYSSB',
    'BSSYYSSSSSSYYYSSSSSSYYSSB',
    'BSSYYSSSSSYYYYYSSSSSYYSSB',
    'BSSYYSSSSSYYSYYSSSSSYYSSB',
    'BSSYYSSSSYYSSSYYSSSSYYSSB',
    'BSSYYSSSSYYSSSYYSSSSYYSSB',
    'BSSYYSSSSYYSSSYYSSSSYYSSB',
    'BSSYYSSSSSYYSYYSSSSSYYSSB',
    'BSSYYSSSSSYYYYYSSSSSYYSSB',
    'BSSYYSSSSSSYYYSSSSSSYYSSB',
    'BSSYYSSSSSSYYYSSSSSSYYSSB',
    'BSSYYYSSSSSYYYSSSSSYYYSSB',
    'BSSYYYYSSSSYYYSSSSYYYYSSB',
    'BSSYYYYYSSSYYYSSSYYYYYSSB',
    'BSSYYSYYYSSYYYSSYYYSYYSSB',
    'BSSYYSSYYYYYYYYYYYSSYYSSB',
    'BSSYYYYYYYYYYYYYYYYYYYSSB',
    'BSSSYYYYYYYYYYYYYYYYYSSSB',
    'BSSSSSSSSSSYYYSSSSSSSSSSB',
    'BBSSSSSSSSYYYYYSSSSSSSSBB',
    '.BBSSSSSSSSYYYSSSSSSSSBB.',
    '..BBBSSSSSSSYSSSSSSSBBB..',
    '....BBBSSSSSSSSSSSBBB....',
    '......BBBSSSSSSSBBB......',
    '........BBBSSSBBB........',
    '..........BBBBB..........',
    '............B............',
  ],
  get hit() { const [x, y] = this.pos, k = NX.px.depthK(y); return { x: x - 40 * k, y: y - 110 * k, w: 80 * k, h: 114 * k }; },
  layout() { const F = NX.cam.front; this.pos = [1120, Math.round(368 + Math.max(62, F * .44))]; },
  /** Монетка впала у воду. */
  wish() { this.flash = 1; this.hue = (this.hue + 70) % 360; const [x, y] = this.pos, k = NX.px.depthK(y); for (let i = 0; i < 16; i++) NX.fx.emit('spark', x + (Math.random() - .5) * 30 * k, y - 14 * k); for (let i = 0; i < 8; i++) NX.fx.emit('bubble', x + (Math.random() - .5) * 20 * k, y - 12 * k); },
  update(dt) { this.flash = Math.max(0, this.flash - dt * 1.5); },
  layers(t) {
    const P = NX.px, [x, y] = this.pos;
    return [{ y, refl: true, draw: c => P.depth(c, x, y, () => {
      const col = `hsl(${this.hue} 90% 60%)`, colL = `hsl(${this.hue} 90% 80%)`;
      // --- чаша
      c.fillStyle = '#1b1244'; c.beginPath(); c.ellipse(x, y - 2, 36, 9, 0, 0, Math.PI); c.fill();
      P.rect(c, x - 36, y - 12, 72, 10, '#2a1c60'); for (let i = -34; i < 34; i += 6) P.rect(c, x + i, y - 11, 2, 8, '#3a2a7a');
      c.fillStyle = '#3a2a7a'; c.beginPath(); c.ellipse(x, y - 12, 36, 9, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#1a4ab8'; c.beginPath(); c.ellipse(x, y - 12, 31, 7, 0, 0, Math.PI * 2); c.fill();            // вода
      c.save(); c.beginPath(); c.ellipse(x, y - 12, 31, 7, 0, 0, Math.PI * 2); c.clip();
      for (let r = 0; r < 3; r++) { const ph = (t * .6 + r / 3) % 1; c.strokeStyle = `rgba(160,230,255,${.6 * (1 - ph)})`; c.lineWidth = 1; c.beginPath(); c.ellipse(x, y - 12, 8 + ph * 24, 2 + ph * 5, 0, 0, Math.PI * 2); c.stroke(); }
      for (let i = 0; i < 6; i++) if (Math.sin(t * 3 + i * 2) > .7) P.rect(c, x - 26 + P.hash(i) * 52, y - 16 + P.hash(i + 9) * 8, 1.5, 1.5, '#ffffff');
      c.restore();
      c.save(); c.strokeStyle = Math.sin(t * 2) > 0 ? '#ff4fd8' : '#d94bff'; c.lineWidth = 1.5; c.shadowColor = '#ff4fd8'; c.shadowBlur = 6; c.beginPath(); c.ellipse(x, y - 12, 36, 9, 0, 0, Math.PI * 2); c.stroke(); c.restore();
      // --- колона
      P.cube(c, x - 5, y - 13, 10, 24, 4, '#2a1c60', '#4b32a0', '#1b1244'); P.rect(c, x - 5, y - 30, 10, 1, colL);
      c.fillStyle = '#4b32a0'; c.beginPath(); c.ellipse(x + 2, y - 38, 10, 3, 0, 0, Math.PI * 2); c.fill();
      // --- струмені: краплі летять по параболі
      for (let j = 0; j < 4; j++) { const dir = [-1, 1, -.5, .5][j], reach = [24, 24, 14, 14][j];
        for (let i = 0; i < 7; i++) { const ph = (t * 1.2 + i / 7 + j * .13) % 1, dx = dir * reach * ph, dy = -10 * Math.sin(ph * Math.PI) + ph * 26;
          P.rect(c, x + 2 + dx, y - 38 + dy, 1.5, 2, ph > .85 ? '#ffffff' : '#7ad0ff'); } }
      // --- голограма: ГЕРБ УКРАЇНИ (тризуб на щиті) обертається по колу
      const tc = this.tc, G = this.TRYZUB, gw = G[0].length, gh = G.length; tc.width = gw; tc.height = gh; const tx = tc.getContext('2d');
      G.forEach((r, j) => [...r].forEach((ch, i) => { if (ch === '.') return; tx.fillStyle = ch === 'S' ? '#2a6aff' : ch === 'B' ? '#9ad0ff' : (i + j + Math.floor(t * 6)) % 9 ? '#ffd02a' : '#fff6c0'; tx.fillRect(i, j, 1, 1); }));
      tx.globalCompositeOperation = 'source-atop'; for (let yy = Math.floor(t * 12) % 3; yy < gh; yy += 3) { tx.fillStyle = 'rgba(255,255,255,.22)'; tx.fillRect(0, yy, gw, 1); }
      const sx = Math.cos(t * 1.2), s = 1.05, w = gw * s * Math.max(.06, Math.abs(sx)), h = gh * s, by = y - 44 + Math.sin(t * 1.5) * 2;
      const cone = c.createLinearGradient(0, by - h, 0, y - 38); cone.addColorStop(0, 'rgba(0,0,0,0)'); cone.addColorStop(1, 'rgba(255,208,42,.32)');
      c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = cone; c.beginPath(); c.moveTo(x - 4, y - 38); c.lineTo(x + 8, y - 38); c.lineTo(x + 2 + 22, by - h + 4); c.lineTo(x + 2 - 22, by - h + 4); c.fill(); c.restore();
      c.save(); c.globalAlpha = (.72 + this.flash * .28) * (.85 + .15 * Math.sin(t * 17)); c.imageSmoothingEnabled = false; c.translate(x + 2, 0); c.scale(sx < 0 ? -1 : 1, 1); c.drawImage(tc, -w / 2, by - h, w, h); c.restore();
      if (Math.abs(sx) < .12) for (let k2 = 0; k2 < 3; k2++) NX.px.rect(c, x + 2 + (Math.random() - .5) * 20, by - Math.random() * h, 1.5, 1.5, '#fff6c0');   // відблиск, коли герб "ребром"
      P.glow(c, x + 2, by - h / 2, 46, 'rgba(255,208,42,.8)', .35 + this.flash * .6);
      if (this.flash > 0) P.glow(c, x, y - 12, 50, 'rgba(255,255,255,.9)', this.flash * .7);
    }) }];
  },
});
