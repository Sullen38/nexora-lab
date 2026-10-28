/* ============================================================================
 * core/loop.js — ГОЛОВНИЙ ЦИКЛ І ПОРЯДОК МАЛЮВАННЯ
 * ----------------------------------------------------------------------------
 * Кожен кадр:
 *   1) update(dt) усіх модулів (Nexi, кіт, об'єкти, частинки, UI)
 *   2) малювання шарами:
 *        стеля -> картинка кімнати (лише те, що ще не кодом) -> місто за вікном
 *        -> drawBack об'єктів (те, що завжди позаду персонажів: стіни й підлога крил у 3D, рама вікна, віддзеркалення)
 *        -> СОРТУВАННЯ ЗА ГЛИБИНОЮ: персонажі + drawFront об'єктів
 *           (хто нижче на екрані — той ближче і малюється пізніше)
 *        -> частинки -> підсвітка наведення
 * Об'єкт може віддати кілька "шарів" через layers(): [{y, draw}], тоді
 * частини одного меблю (сидіння і спинка крісла) правильно перекривають Nexi.
 * ========================================================================== */
NX.loop = {
  canvas: null, c: null, last: 0, dpr: 1, frames: 0,
  start() {
    this.canvas = document.getElementById('world');
    this.c = this.canvas.getContext('2d');
    this.resize(); addEventListener('resize', () => this.resize());
    NX.cam.bindInput(this.canvas);
    this.last = performance.now() / 1000;
    requestAnimationFrame(() => this.frame());
  },
  resize() {
    this.dpr = Math.min(2, devicePixelRatio || 1);   // рідна роздільність екрана (до 2×); чіткість дає картинка кімнати 2× (3072×736)
    const vw = innerWidth, vh = innerHeight;
    this.canvas.width = Math.round(vw * this.dpr); this.canvas.height = Math.round(vh * this.dpr);
    NX.cam.layout(vw, vh);
    NX.room.build();                           // перебудувати стелю/підлогу під новий розмір
    Object.values(NX.objects).forEach(o => o.layout && o.layout());
  },
  frame() {
    const now = performance.now() / 1000, dt = Math.min(.1, now - this.last); this.last = now; NX.time += dt;
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
    if (this.frames < 90 || (NX.cam.x < NX.cfg.WIN.R && NX.cam.x + NX.cam.viewW > NX.cfg.WIN.L)) NX.city.draw(c, t, dt);   // місто — лише коли вікно видно
    const objs = Object.values(NX.objects);
    // ПОЗА ЕКРАНОМ НЕ МАЛЮЄМО: об'єкт зі span [x0, x1] (одиниці кімнати) пропускається, якщо він увесь за межами видимої
    // смуги (телефон бачить ~третину кімнати). Перші 90 кадрів — малюється все: будуються растри (обидва крила в 3D —
    // по шару за кадр) і копія для передньої підлоги-дзеркала.
    const vx0 = NX.cam.x - 24, vx1 = NX.cam.x + NX.cam.viewW + 24, all = ++this.frames < 90;
    objs.forEach(o => { if (!o.drawBack) return; if (!all && o.span && (o.span[1] < vx0 || o.span[0] > vx1)) return; o.drawBack(c, t); });
    const list = [NX.nexi.layer(), NX.cat.layer()];
    objs.forEach(o => o.layers && list.push(...o.layers(t)));
    // ВІДДЗЕРКАЛЕННЯ в глянцевій підлозі: усе, що стоїть на передній підлозі (refl:true),
    // малюється ще раз догори дриґом напівпрозоро — предмети "вростають" у стиль картинки
    // (малюємо в окремий шар, потім кладемо його на підлогу прозоро й з затуханням донизу)
    const R = this.refl || (this.refl = document.createElement('canvas')); if (R.width !== this.canvas.width || R.height !== this.canvas.height) { R.width = this.canvas.width; R.height = this.canvas.height; }
    const rc = R.getContext('2d'); rc.isRefl = true; rc.setTransform(1, 0, 0, 1, 0, 0); rc.clearRect(0, 0, R.width, R.height); rc.setTransform(k, 0, 0, k, -NX.cam.x * k, NX.cam.top * k); rc.imageSmoothingEnabled = false;
    list.filter(l => l && l.refl && l.y > NX.cfg.ROOM_H).forEach(l => { rc.save(); rc.translate(0, 2 * l.y + 1); rc.scale(1, .55 * -1 / .55); rc.scale(1, .55); rc.translate(0, 0); l.draw(rc, t); rc.restore(); });
    rc.setTransform(1, 0, 0, 1, 0, 0); rc.globalCompositeOperation = 'destination-in'; const fy = (NX.cfg.ROOM_H + NX.cam.top) * k, fg = rc.createLinearGradient(0, fy, 0, R.height); fg.addColorStop(0, 'rgba(0,0,0,.9)'); fg.addColorStop(1, 'rgba(0,0,0,0)'); rc.fillStyle = fg; rc.fillRect(0, 0, R.width, R.height); rc.globalCompositeOperation = 'source-over';
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = .22; c.drawImage(R, 0, 0); c.restore();
    list.filter(Boolean).sort((a, b) => a.y - b.y).forEach(l => l.draw(c, t));
    NX.fx.draw(c);
    NX.input.drawHover(c, t);
    requestAnimationFrame(() => this.frame());
  },
};
