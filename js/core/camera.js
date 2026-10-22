/* ============================================================================
 * core/camera.js — КАМЕРА, МАСШТАБ, ДОТИКИ
 * ----------------------------------------------------------------------------
 * Десктоп: кімната вміщується по ширині екрана (видно всю квартиру), а зайва
 * висота екрана стає добудованою стелею (зверху) і підлогою (знизу).
 * Телефон: кімната масштабується по висоті, а ширину гортаємо пальцем.
 * Тап (дотик без перетягування) передається в NX.input.onTap(x,y) у
 * координатах кімнати.
 * ========================================================================== */
NX.cam = {
  k: 1,          // скільки CSS-пікселів в 1 одиниці кімнати
  x: 0,          // лівий край видимої області (одиниці кімнати)
  top: 60,       // висота добудованої стелі
  front: 200,    // висота добудованої підлоги
  viewW: 1536,   // ширина видимої області (одиниці кімнати)
  mobile: false,
  dragUntil: 0,  // до якого часу камера не слідкує за Nexi (користувач гортав)

  /** Перерахунок під розмір вікна. Викликається на старті і при resize. */
  layout(vw, vh) {
    const C = NX.cfg;
    this.mobile = vw < 820 || vh > vw;
    if (!this.mobile) {
      this.k = vw / C.ROOM_W;                                   // вся кімната по ширині
      if (vh / this.k - C.ROOM_H < C.FRONT_MIN + C.TOP_MIN)     // дуже широкий екран
        this.k = vh / (C.ROOM_H + C.FRONT_MIN + C.TOP_MIN);
    } else {
      this.k = vh / (C.ROOM_H + 60 + 190);                      // телефон: по висоті
    }
    this.viewW = vw / this.k;
    const extra = vh / this.k - C.ROOM_H;                       // скільки треба добудувати
    this.top = Math.round(Math.max(C.TOP_MIN, Math.min(110, extra * .2)));
    this.front = Math.round(extra - this.top);
    this.x = NX.px.clamp(this.x, 0, Math.max(0, C.ROOM_W - this.viewW));
  },
  /** Камера м'яко тримає Nexi в центрі (якщо кімната ширша за екран). */
  follow(tx, dt) {
    if (performance.now() < this.dragUntil) return;
    const max = Math.max(0, NX.cfg.ROOM_W - this.viewW);
    const want = NX.px.clamp(tx - this.viewW / 2, 0, max);
    this.x += (want - this.x) * Math.min(1, dt * 3);
  },
  /** Екранні CSS-пікселі -> координати кімнати. */
  toRoom(sx, sy) { return [sx / this.k + this.x, sy / this.k - this.top]; },
  /** Координати кімнати -> екранні CSS-пікселі (для DOM-баблів). */
  toScreen(x, y) { return [(x - this.x) * this.k, (y + this.top) * this.k]; },

  /** Підключення перетягування (миша/палець) і тапів до canvas. */
  bindInput(canvas) {
    let down = null;
    canvas.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY, cx: this.x, moved: false }; canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener('pointermove', e => {
      if (down) {
        const dx = e.clientX - down.x;
        if (Math.abs(dx) > 6) down.moved = true;
        if (down.moved) { const max = Math.max(0, NX.cfg.ROOM_W - this.viewW); this.x = NX.px.clamp(down.cx - dx / this.k, 0, max); this.dragUntil = performance.now() + 4000; }
      } else NX.input && NX.input.onHover(...this.toRoom(e.clientX, e.clientY));
    });
    canvas.addEventListener('pointerup', e => { if (down && !down.moved) NX.input.onTap(...this.toRoom(e.clientX, e.clientY)); down = null; });
    canvas.addEventListener('pointercancel', () => down = null);
  },
};
