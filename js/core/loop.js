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
      // ГРУПИ: кожне віддзеркалення — у своєму прямокутнику (px екрана, з запасом 2 px); ті, що перетинаються, — разом. Досі
      // бралась спільна рамка всіх: Nexi на одному краю екрана й кіт на другому — полотно на всю ширину (~250 тис. px тричі
      // щокадру: очищення, маска, накладання). Порожнеча між ними прозора й нічого не додавала, тож результат той самий
      const px = (x0, y0, x1, y1) => { const rx = Math.floor((x0 - NX.cam.x) * k) - 2, ry = Math.floor((y0 + NX.cam.top) * k) - 2;
        return { rx, ry, ex: Math.ceil((x1 - NX.cam.x) * k) + 2, ey: Math.ceil((y1 + NX.cam.top) * k) + 2 }; };
      let G = [];
      for (const l of RL) { const b = l.box; if (!b) { G = [{ L: RL, rx: -Infinity, ry: -Infinity, ex: Infinity, ey: Infinity }]; break; }        // без box — увесь екран
        const yF = l.y + .5; G.push(Object.assign({ L: [l] }, px(b[0], (1 + SQ) * yF - SQ * b[3], b[2], (1 + SQ) * yF - SQ * b[1]))); }
      for (let merged = true; merged;) { merged = false;                                                                     // перетинаються — одна група
        for (let i = 0; i < G.length && !merged; i++) for (let j = i + 1; j < G.length && !merged; j++) { const a = G[i], b = G[j];
          if (a.rx < b.ex && b.rx < a.ex && a.ry < b.ey && b.ry < a.ey) { a.L = RL.filter(l => a.L.includes(l) || b.L.includes(l)); a.rx = Math.min(a.rx, b.rx); a.ry = Math.min(a.ry, b.ry); a.ex = Math.max(a.ex, b.ex); a.ey = Math.max(a.ey, b.ey); G.splice(j, 1); merged = true; } } }
      const clip = g => { g.rx = Math.max(0, g.rx); g.ry = Math.max(0, g.ry); g.rw = Math.min(CW, g.ex) - g.rx; g.rh = Math.min(CH, g.ey) - g.ry; return g; };
      const U = clip({ rx: Math.min(...G.map(g => g.rx)), ry: Math.min(...G.map(g => g.ry)), ex: Math.max(...G.map(g => g.ex)), ey: Math.max(...G.map(g => g.ey)) });
      G.forEach(clip); const on = G.filter(g => g.rw > 0 && g.rh > 0);
      if (U.rw > 0 && U.rh > 0) {                                                                                       // спільна рамка зачіпає екран — як і досі
        const R = this.refl || (this.refl = document.createElement('canvas')), up = v => Math.ceil(v / 64) * 64;   // полотно росте шматками по 64 px
        const mw = Math.max(1, ...on.map(g => g.rw)), mh = Math.max(1, ...on.map(g => g.rh));
        if (R.width < mw || R.height < mh || R.width * R.height > 4 * up(mw) * up(mh)) { R.width = Math.max(64, up(mw)); R.height = Math.max(64, up(mh)); }
        const rc = R.getContext('2d'); rc.isRefl = true;
        const draw = g => { rc.setTransform(k, 0, 0, k, -NX.cam.x * k - g.rx, NX.cam.top * k - g.ry); rc.imageSmoothingEnabled = false;
          g.L.forEach(l => { rc.save(); rc.translate(0, (1 + SQ) * (l.y + .5)); rc.scale(1, -SQ); l.draw(rc, t); rc.restore(); }); };
        for (const g of G) {
          // група за екраном: її шари однаково малюються (як і досі, коли спільна рамка зачіпала екран) — у них бувають побічні
          // дії (кубик дощу над Nexi, його box для чату); на екран це не потрапляє
          if (!on.includes(g)) { draw(g); continue; }
          const { rx, ry, rw, rh } = g; rc.setTransform(1, 0, 0, 1, 0, 0); rc.clearRect(0, 0, rw, rh); draw(g);
          rc.setTransform(1, 0, 0, 1, 0, 0); rc.globalCompositeOperation = 'destination-in'; const fy = (NX.cfg.ROOM_H + NX.cam.top) * k - ry, fg = rc.createLinearGradient(0, fy, 0, CH - ry); fg.addColorStop(0, 'rgba(0,0,0,.9)'); fg.addColorStop(1, 'rgba(0,0,0,0)'); rc.fillStyle = fg; rc.fillRect(0, 0, rw, rh); rc.globalCompositeOperation = 'source-over';
          c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = .22; c.drawImage(R, 0, 0, rw, rh, rx, ry, rw, rh); c.restore();
        }
      }
    }
    list.filter(Boolean).sort((a, b) => a.y - b.y).forEach(l => l.draw(c, t));
    NX.fx.draw(c);
    NX.input.drawHover(c, t);
    requestAnimationFrame(() => this.frame());
  },
};
