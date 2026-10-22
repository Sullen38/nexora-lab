/* ============================================================================
 * core/loop.js — ГОЛОВНИЙ ЦИКЛ І ПОРЯДОК МАЛЮВАННЯ
 * ----------------------------------------------------------------------------
 * Кожен кадр:
 *   1) update(dt) усіх модулів (Nexi, кіт, об'єкти, частинки, UI)
 *   2) малювання шарами:
 *        стеля -> картинка кімнати -> "життя" фону (ambient)
 *        -> drawBack об'єктів (те, що завжди позаду персонажів)
 *        -> СОРТУВАННЯ ЗА ГЛИБИНОЮ: персонажі + drawFront об'єктів
 *           (хто нижче на екрані — той ближче і малюється пізніше)
 *        -> частинки -> підсвітка наведення
 * Об'єкт може віддати кілька "шарів" через layers(): [{y, draw}], тоді
 * частини одного меблю (сидіння і спинка крісла) правильно перекривають Nexi.
 * ========================================================================== */
NX.loop = {
  canvas: null, c: null, last: 0, dpr: 1,
  start() {
    this.canvas = document.getElementById('world');
    this.c = this.canvas.getContext('2d');
    this.resize(); addEventListener('resize', () => this.resize());
    NX.cam.bindInput(this.canvas);
    this.last = performance.now() / 1000;
    requestAnimationFrame(() => this.frame());
  },
  resize() {
    this.dpr = Math.min(2, devicePixelRatio || 1);
    const vw = innerWidth, vh = innerHeight;
    this.canvas.width = Math.round(vw * this.dpr); this.canvas.height = Math.round(vh * this.dpr);
    NX.cam.layout(vw, vh);
    NX.room.build();                           // перебудувати стелю/підлогу під новий розмір
    Object.values(NX.objects).forEach(o => o.layout && o.layout());
  },
  frame() {
    const now = performance.now() / 1000, dt = Math.min(.05, now - this.last); this.last = now; NX.time += dt;
    const t = NX.time, c = this.c;
    // ---- 1. логіка
    NX.nexi.update(dt, t); NX.cat.update(dt, t);
    Object.values(NX.objects).forEach(o => o.update && o.update(dt, t));
    NX.fx.update(dt); NX.ui.hud.update(dt, t);
    NX.cam.follow(NX.nexi.x, dt);
    // ---- 2. малювання
    const k = NX.cam.k * this.dpr;
    c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = '#050818'; c.fillRect(0, 0, this.canvas.width, this.canvas.height);
    c.setTransform(k, 0, 0, k, -NX.cam.x * k, NX.cam.top * k);
    c.imageSmoothingEnabled = false;
    NX.room.draw(c, t);
    NX.city.draw(c, t, dt);
    NX.ambient.draw(c, t);
    const objs = Object.values(NX.objects);
    objs.forEach(o => o.drawBack && o.drawBack(c, t));
    const list = [NX.nexi.layer(), NX.cat.layer()];
    objs.forEach(o => o.layers && list.push(...o.layers(t)));
    list.filter(Boolean).sort((a, b) => a.y - b.y).forEach(l => l.draw(c, t));
    NX.fx.draw(c);
    NX.input.drawHover(c, t);
    requestAnimationFrame(() => this.frame());
  },
};
