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
 * Частини, що вже повністю намальовані кодом (панорамне вікно з містом), з картинки не малюються:
 * world/cityscape.js задає NX.room.pieces — прямокутники картинки, які ще потрібні.
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
    // 2) віддзеркалення кімнати в глянці, 3) темніє з глибиною, 4) плитка зі швами й калюжі світла (№7) — їх запікає
    //    сюди objects/wing_floor.js через NX.room.frontFx (щокадру нічого не коштують). Полотно — FR px на одиницю (1).
    this.front = document.createElement('canvas'); this.front.width = W * this.FR; this.front.height = (front + 2) * this.FR;
    this.frontFrom(this.img, 0, W);
    this.patches.forEach(p => this.frontFrom(p.src, p.x0, p.x1));                                    // перемальовані зони (напр. AI-центр)
  },
  patches: [], FR: 1, frontFx: null, pieces: null,                                    // pieces — які частини картинки ще малювати (вікно вже кодом: world/cityscape.js)
                                                                  // FR 2 px/од. подвоював час кадру (велике полотно щокадру) — лишаємо 1
  /** Передня підлога для стовпчиків x0..x1 з джерела src (картинка кімнати або її перемальована копія того ж розміру). */
  frontFrom(src, x0, x1) {
    const { ROOM_W: W, ROOM_H: H } = NX.cfg, FR = this.FR, front = this.front.height / FR - 2, RS = this.RS, c = this.front.getContext('2d');
    c.setTransform(FR, 0, 0, FR, 0, 0);
    c.save(); c.beginPath(); c.rect(x0, 0, x1 - x0, front + 2); c.clip(); c.clearRect(x0, 0, x1 - x0, front + 2);
    c.drawImage(src, 0, (H - 4) * RS, W * RS, 4 * RS, 0, 0, W, front + 2);
    const ref = Math.min(front, 240);
    c.save(); c.globalAlpha = .26; c.scale(1, -1); c.drawImage(src, 0, (H - ref - 14) * RS, W * RS, ref * RS, 0, -ref, W, ref); c.restore();
    let g = c.createLinearGradient(0, 0, 0, front); g.addColorStop(0, 'rgba(10,6,34,0)'); g.addColorStop(.18, 'rgba(10,6,34,.35)'); g.addColorStop(.75, 'rgba(6,6,26,.9)'); g.addColorStop(1, 'rgba(4,5,20,1)');
    c.fillStyle = g; c.fillRect(0, 0, W, front + 2);
    if (this.frontFx) { c.save(); c.translate(0, -H); this.frontFx(c, x0, x1, front); c.restore(); }   // №7: плитка й калюжі світла (у координатах кімнати)
    c.restore(); c.setTransform(1, 0, 0, 1, 0, 0);
  },
  /** Об'єкт, що перемалював частину кімнати, віддає її копію: передня підлога (продовження й глянцеве
   *  віддзеркалення) для стовпчиків x0..x1 будується вже з неї — без "привидів" старої картинки. */
  patchFront(src, x0, x1) { this.patches = this.patches.filter(p => p.x0 !== x0); this.patches.push({ src, x0, x1 }); if (this.front) this.frontFrom(src, x0, x1); },

  draw(c, t) {
    const { ROOM_H: H } = NX.cfg, { top } = NX.cam;
    c.drawImage(this.ceil, 0, -top);
    if (this.pieces) { const RS = this.RS; this.pieces.forEach(([x0, y0, x1, y1]) => c.drawImage(this.img, x0 * RS, y0 * RS, (x1 - x0) * RS, (y1 - y0) * RS, x0, y0, x1 - x0, y1 - y0)); }
    else c.drawImage(this.img, 0, 0, NX.cfg.ROOM_W, NX.cfg.ROOM_H);
    const g = c.createLinearGradient(0, 0, 0, 22); g.addColorStop(0, 'rgba(12,18,54,.9)'); g.addColorStop(1, 'rgba(12,18,54,0)'); c.fillStyle = g; c.fillRect(0, 0, NX.cfg.ROOM_W, 22);
    c.drawImage(this.front, 0, H, NX.cfg.ROOM_W, this.front.height / this.FR);
  },

  /** Де можна ходити (прямокутник підлоги). */
  walkBounds() { return { minX: 26, maxX: NX.cfg.ROOM_W - 26, minY: NX.cfg.FLOOR_Y + 6, maxY: NX.cfg.ROOM_H + NX.cam.front - 24 }; },
  clampWalk(x, y) { const b = this.walkBounds(); return [NX.px.clamp(x, b.minX, b.maxX), NX.px.clamp(y, b.minY, b.maxY)]; },
  /** Масштаб персонажа залежно від глибини (y): далі — менший. */
  scaleAt(y) { const C = NX.cfg, t = NX.px.clamp((y - C.FLOOR_Y) / 330, 0, 1); return NX.px.lerp(C.NEXI_SCALE_FAR, C.NEXI_SCALE_NEAR, t); },
};
