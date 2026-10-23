/* ============================================================================
 * world/room.js — КІМНАТА (робоча зона Nexi)
 * ----------------------------------------------------------------------------
 * Шари кімнати:
 *   1. assets/room.webp — головна картинка-кімната (1536×368). Це НЕ просто
 *      фон: на ній стоять точки взаємодії (core/config.js → POI), і Nexi
 *      ходить по її підлозі, сідає на її диван, злітає на її стіл.
 *   2. Стеля (y < 0) — добудовується кодом під висоту екрана.
 *   3. Передня підлога (y > 368) — продовження тієї ж глянцевої підлоги:
 *      нижні рядки картинки тягнуться вниз, тому шву між ними не видно.
 * Межі, де можна ходити, повертає walkBounds().
 * ========================================================================== */
NX.room = {
  img: new Image(), ceil: null, front: null,
  /** Скільки пікселів картинки на 1 одиницю кімнати (картинка 3072×736 -> RS = 2: удвічі чіткіше). */
  get RS() { return (this.img.naturalWidth || NX.cfg.ROOM_W) / NX.cfg.ROOM_W; },
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
    // ---------- передня підлога: ПРОДОВЖЕННЯ тієї ж підлоги з картинки ----------
    // 1) останні рядки картинки розтягуємо вниз — кольори й відблиски тягнуться без шву
    // 2) віддзеркалення кімнати в глянці, 3) темніє з глибиною, 4) сітка плитки
    //    з'являється плавно (на шві її не видно)
    this.front = document.createElement('canvas'); this.front.width = W; this.front.height = front + 2;
    c = this.front.getContext('2d');
    const RS = this.RS; c.drawImage(this.img, 0, (H - 4) * RS, W * RS, 4 * RS, 0, 0, W, front + 2);
    const ref = Math.min(front, 240);
    c.save(); c.globalAlpha = .26; c.scale(1, -1); c.drawImage(this.img, 0, (H - ref - 14) * RS, W * RS, ref * RS, 0, -ref, W, ref); c.restore();
    g = c.createLinearGradient(0, 0, 0, front); g.addColorStop(0, 'rgba(10,6,34,0)'); g.addColorStop(.18, 'rgba(10,6,34,.35)'); g.addColorStop(.75, 'rgba(6,6,26,.9)'); g.addColorStop(1, 'rgba(4,5,20,1)');
    c.fillStyle = g; c.fillRect(0, 0, W, front + 2);
    const gr = document.createElement('canvas'); gr.width = W; gr.height = front + 2; const gc = gr.getContext('2d');
    const vx = W / 2, vy = -340; gc.lineWidth = 1;
    for (let i = -16; i <= 16; i++) { const xb = vx + i * 120, xa = vx + (xb - vx) * (0 - vy) / (front - vy); gc.strokeStyle = i % 2 ? 'rgba(217,75,255,.16)' : 'rgba(59,232,255,.16)'; gc.beginPath(); gc.moveTo(xa, 0); gc.lineTo(xb, front); gc.stroke(); }
    for (let k = 1; k < 12; k++) { const tt = k / 12; gc.fillStyle = `rgba(59,232,255,${.05 + .08 * tt})`; gc.fillRect(0, Math.round(front * Math.pow(tt, 1.6)), W, 1); }
    gc.globalCompositeOperation = 'destination-in'; const gm = gc.createLinearGradient(0, 0, 0, Math.min(140, front)); gm.addColorStop(0, 'rgba(0,0,0,0)'); gm.addColorStop(1, 'rgba(0,0,0,1)'); gc.fillStyle = gm; gc.fillRect(0, 0, W, front + 2);
    c.drawImage(gr, 0, 0);
  },

  draw(c, t) {
    const { ROOM_H: H } = NX.cfg, { top } = NX.cam;
    c.drawImage(this.ceil, 0, -top);
    c.drawImage(this.img, 0, 0, NX.cfg.ROOM_W, NX.cfg.ROOM_H);
    const g = c.createLinearGradient(0, 0, 0, 22); g.addColorStop(0, 'rgba(12,18,54,.9)'); g.addColorStop(1, 'rgba(12,18,54,0)'); c.fillStyle = g; c.fillRect(0, 0, NX.cfg.ROOM_W, 22);
    c.drawImage(this.front, 0, H);
  },

  /** Де можна ходити (прямокутник підлоги). */
  walkBounds() { return { minX: 26, maxX: NX.cfg.ROOM_W - 26, minY: NX.cfg.FLOOR_Y + 6, maxY: NX.cfg.ROOM_H + NX.cam.front - 24 }; },
  clampWalk(x, y) { const b = this.walkBounds(); return [NX.px.clamp(x, b.minX, b.maxX), NX.px.clamp(y, b.minY, b.maxY)]; },
  /** Масштаб персонажа залежно від глибини (y): далі — менший. */
  scaleAt(y) { const C = NX.cfg, t = NX.px.clamp((y - C.FLOOR_Y) / 330, 0, 1); return NX.px.lerp(C.NEXI_SCALE_FAR, C.NEXI_SCALE_NEAR, t); },
};
