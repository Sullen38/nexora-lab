/* ============================================================================
 * world/room.js — КІМНАТА (робоча зона Nexi)
 * ----------------------------------------------------------------------------
 * Шари кімнати:
 *   1. assets/room.webp — головна картинка-кімната (1536×368). Це НЕ просто
 *      фон: на ній стоять точки взаємодії (core/config.js → POI), і Nexi
 *      ходить по її підлозі, сідає на її диван, злітає на її стіл.
 *   2. Стеля (y < 0) — добудовується кодом під висоту екрана.
 *   3. Передня підлога (y > 368) — продовження тієї ж глянцевої підлоги
 *      з віддзеркаленням кімнати. Це та сама підлога, ближча до глядача.
 * Межі, де можна ходити, повертає walkBounds().
 * ========================================================================== */
NX.room = {
  img: new Image(), ceil: null, front: null,
  load(src) { return new Promise(r => { this.img.onload = r; this.img.src = src; }); },

  /** Перебудова добудованих шарів (на старті та при зміні розміру вікна). */
  build() {
    const { ROOM_W: W, ROOM_H: H } = NX.cfg, { top, front } = NX.cam, P = NX.px;
    // ---------- стеля ----------
    this.ceil = document.createElement('canvas'); this.ceil.width = W; this.ceil.height = top + 2;
    let c = this.ceil.getContext('2d');
    let g = c.createLinearGradient(0, 0, 0, top); g.addColorStop(0, '#02030c'); g.addColorStop(1, '#0c1236'); c.fillStyle = g; c.fillRect(0, 0, W, top + 2);
    P.rect(c, 0, top - 12, W, 6, '#141c52'); P.rect(c, 0, top - 12, W, 1, '#2a3a8a');                 // балка
    for (let x = 24; x < W; x += 128) {                                                               // неонові трубки
      const col = (x / 128 | 0) % 2 ? '#d94bff' : '#3be8ff';
      P.rect(c, x + 30, 0, 1, top - 26, '#1a2260'); P.rect(c, x + 92, 0, 1, top - 26, '#1a2260');
      P.rect(c, x + 26, top - 27, 70, 3, col); P.glow(c, x + 61, top - 26, 40, col === '#3be8ff' ? 'rgba(59,232,255,.35)' : 'rgba(217,75,255,.35)');
    }
    for (let x = 80; x < W; x += 260) {                                                               // кабелі, що провисають
      c.strokeStyle = '#0f1640'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, top - 6); c.quadraticCurveTo(x + 65, top + 4, x + 130, top - 6); c.stroke();
    }
    // ---------- передня підлога ----------
    this.front = document.createElement('canvas'); this.front.width = W; this.front.height = front + 2;
    c = this.front.getContext('2d');
    g = c.createLinearGradient(0, 0, 0, front); g.addColorStop(0, '#1a0e44'); g.addColorStop(1, '#05061a'); c.fillStyle = g; c.fillRect(0, 0, W, front + 2);
    const ref = Math.min(front, 220);                                                                 // віддзеркалення кімнати в глянцевій підлозі
    c.save(); c.globalAlpha = .30; c.translate(0, 0); c.scale(1, -1); c.drawImage(this.img, 0, H - ref, W, ref, 0, -ref, W, ref); c.restore();
    g = c.createLinearGradient(0, 0, 0, front); g.addColorStop(0, 'rgba(20,10,52,.10)'); g.addColorStop(.7, 'rgba(6,6,26,.92)'); g.addColorStop(1, 'rgba(4,5,20,1)'); c.fillStyle = g; c.fillRect(0, 0, W, front + 2);
    const vx = W / 2, vy = -340; c.lineWidth = 1;                                                     // перспективна сітка плитки
    for (let i = -16; i <= 16; i++) { const xb = vx + i * 120, xa = vx + (xb - vx) * (0 - vy) / (front - vy); c.strokeStyle = i % 2 ? 'rgba(217,75,255,.10)' : 'rgba(59,232,255,.10)'; c.beginPath(); c.moveTo(xa, 0); c.lineTo(xb, front); c.stroke(); }
    for (let k = 1; k < 12; k++) { const tt = k / 12; P.rect(c, 0, front * Math.pow(tt, 1.6), W, 1, `rgba(59,232,255,${.03 + .08 * tt})`); }
    for (let y = 0; y < front; y += 4) for (let x = (y / 4 % 2) * 4; x < W; x += 8) P.rect(c, x, y, 1, 1, 'rgba(140,120,255,.05)');  // 8-bit дизеринг
  },

  draw(c, t) {
    const { ROOM_H: H } = NX.cfg, { top } = NX.cam;
    c.drawImage(this.ceil, 0, -top);
    c.drawImage(this.img, 0, 0);
    const g = c.createLinearGradient(0, 0, 0, 22); g.addColorStop(0, 'rgba(12,18,54,.9)'); g.addColorStop(1, 'rgba(12,18,54,0)'); c.fillStyle = g; c.fillRect(0, 0, NX.cfg.ROOM_W, 22);
    c.drawImage(this.front, 0, H);
    // шов картинки й добудови — м'який неоновий відблиск, що "дихає"
    NX.px.rect(c, 0, H, NX.cfg.ROOM_W, 1, `rgba(217,75,255,${.25 + .1 * Math.sin(t * 1.5)})`);
  },

  /** Де можна ходити (прямокутник підлоги). */
  walkBounds() { return { minX: 26, maxX: NX.cfg.ROOM_W - 26, minY: NX.cfg.FLOOR_Y + 6, maxY: NX.cfg.ROOM_H + NX.cam.front - 24 }; },
  clampWalk(x, y) { const b = this.walkBounds(); return [NX.px.clamp(x, b.minX, b.maxX), NX.px.clamp(y, b.minY, b.maxY)]; },
  /** Масштаб персонажа залежно від глибини (y): далі — менший. */
  scaleAt(y) { const C = NX.cfg, t = NX.px.clamp((y - C.FLOOR_Y) / 330, 0, 1); return NX.px.lerp(C.NEXI_SCALE_FAR, C.NEXI_SCALE_NEAR, t); },
};
