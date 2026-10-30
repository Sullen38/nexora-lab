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
  /** Підготовка без циклу: полотно, розмір екрана (камера, стеля й підлога, layout об'єктів), дотики. js/main.js кличе її
   *  під вітальною заставкою ще до збірки 3D-крил (їм потрібен масштаб екрана); start() — те саме + головний цикл. */
  prep() {
    if (this.c) return;
    this.canvas = document.getElementById('world');
    this.c = this.canvas.getContext('2d');
    this.resize(); addEventListener('resize', () => this.resize());
    NX.cam.bindInput(this.canvas);
  },
  start() {
    this.prep();
    this.last = performance.now() / 1000;
    requestAnimationFrame(() => this.frame());
  },
  /** ПЕРШИЙ КАДР ПО ШМАТКАХ (генератор, yield — частка 0..1) — під заставкою (js/main.js): той самий порядок малювання, що
   *  й frame(), але з паузою після кожного об'єкта. Растри й кеші, що будуються при першому малюванні (місто під масштаб
   *  екрана, рама вікна, диван, крісло…), готові ще до показу кімнати — перший справжній кадр легкий. */
  *warmG() {
    const t = NX.time, c = this.c, k = NX.cam.k * this.dpr, objs = Object.values(NX.objects), T = () => c.setTransform(k, 0, 0, k, -NX.cam.x * k, NX.cam.top * k);
    NX.nexi.update(0, t); NX.cat.update(0, t); objs.forEach(o => o.update && o.update(0, t)); yield .05;
    c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = '#050818'; c.fillRect(0, 0, this.canvas.width, this.canvas.height);
    T(); c.imageSmoothingEnabled = false; NX.room.draw(c, t); yield .1;
    T(); NX.city.draw(c, t, 0); yield .3;
    const back = objs.filter(o => o.drawBack); for (let n = 0; n < back.length; n++) { T(); back[n].drawBack(c, t); yield .3 + .35 * (n + 1) / back.length; }
    const list = [NX.nexi.layer(), NX.cat.layer()]; objs.forEach(o => o.layers && list.push(...o.layers(t)));
    const L = list.filter(Boolean).sort((a, b) => a.y - b.y); for (let n = 0; n < L.length; n++) { T(); L[n].draw(c, t); yield .65 + .35 * (n + 1) / L.length; }
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
    if (NX.cam.x < NX.cfg.WIN.R && NX.cam.x + NX.cam.viewW > NX.cfg.WIN.L) NX.city.draw(c, t, dt);   // місто — лише коли вікно видно
    const objs = Object.values(NX.objects);
    // ПОЗА ЕКРАНОМ НЕ МАЛЮЄМО: об'єкт зі span [x0, x1] (одиниці кімнати) пропускається, якщо він увесь за межами видимої
    // смуги (телефон бачить ~третину кімнати). Растри й кеші вже готові з-під заставки (warmG і збірка крил) — з першого кадру.
    const vx0 = NX.cam.x - 24, vx1 = NX.cam.x + NX.cam.viewW + 24; this.frames++;
    objs.forEach(o => { if (!o.drawBack) return; if (o.span && (o.span[1] < vx0 || o.span[0] > vx1)) return; o.drawBack(c, t); });
    const list = [NX.nexi.layer(), NX.cat.layer()];
    objs.forEach(o => o.layers && list.push(...o.layers(t)));
    // ВІДДЗЕРКАЛЕННЯ в глянцевій підлозі: усе, що стоїть на передній підлозі (refl:true), малюється ще раз догори дриґом
    // напівпрозоро, сплюснуте (SQ) відносно лінії ніг — прямо під персонажем (до 29.10 дзеркалилось відносно y 0, і
    // «привид» з'являвся далеко внизу екрана). Шар малюється окремо й кладеться на підлогу з затуханням донизу — лише в
    // прямокутнику, де щось віддзеркалюється (шар дає box — [x0, y0, x1, y1] кімнати), і полотно — розміром з цей
    // прямокутник, а не з екран: повноекранне полотно щокадру коштувало ~8 мс на телефоні (очищення, маска й копія
    // всього полотна при кожному drawImage). Немає кого віддзеркалювати — нічого не робимо.
    const RL = list.filter(l => l && l.refl && l.y > NX.cfg.ROOM_H), SQ = .55, CW = this.canvas.width, CH = this.canvas.height;
    if (RL.length) {
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const l of RL) { const b = l.box; if (!b) { x0 = y0 = -Infinity; x1 = y1 = Infinity; break; }        // без box — увесь екран
        const yF = l.y + .5, m0 = (1 + SQ) * yF - SQ * b[3], m1 = (1 + SQ) * yF - SQ * b[1]; x0 = Math.min(x0, b[0]); x1 = Math.max(x1, b[2]); y0 = Math.min(y0, m0); y1 = Math.max(y1, m1); }
      const rx = Math.max(0, Math.floor((x0 - NX.cam.x) * k) - 2), ry = Math.max(0, Math.floor((y0 + NX.cam.top) * k) - 2);
      const rw = Math.min(CW, Math.ceil((x1 - NX.cam.x) * k) + 2) - rx, rh = Math.min(CH, Math.ceil((y1 + NX.cam.top) * k) + 2) - ry;
      if (rw > 0 && rh > 0) {
        const R = this.refl || (this.refl = document.createElement('canvas')), up = v => Math.ceil(v / 64) * 64;   // полотно росте шматками по 64 px
        if (R.width < rw || R.height < rh || R.width * R.height > 4 * up(rw) * up(rh)) { R.width = Math.max(64, up(rw)); R.height = Math.max(64, up(rh)); }
        const rc = R.getContext('2d'); rc.isRefl = true; rc.setTransform(1, 0, 0, 1, 0, 0); rc.clearRect(0, 0, rw, rh); rc.setTransform(k, 0, 0, k, -NX.cam.x * k - rx, NX.cam.top * k - ry); rc.imageSmoothingEnabled = false;
        RL.forEach(l => { rc.save(); rc.translate(0, (1 + SQ) * (l.y + .5)); rc.scale(1, -SQ); l.draw(rc, t); rc.restore(); });
        rc.setTransform(1, 0, 0, 1, 0, 0); rc.globalCompositeOperation = 'destination-in'; const fy = (NX.cfg.ROOM_H + NX.cam.top) * k - ry, fg = rc.createLinearGradient(0, fy, 0, CH - ry); fg.addColorStop(0, 'rgba(0,0,0,.9)'); fg.addColorStop(1, 'rgba(0,0,0,0)'); rc.fillStyle = fg; rc.fillRect(0, 0, rw, rh); rc.globalCompositeOperation = 'source-over';
        c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = .22; c.drawImage(R, 0, 0, rw, rh, rx, ry, rw, rh); c.restore();
      }
    }
    list.filter(Boolean).sort((a, b) => a.y - b.y).forEach(l => l.draw(c, t));
    NX.fx.draw(c);
    NX.input.drawHover(c, t);
    requestAnimationFrame(() => this.frame());
  },
};
