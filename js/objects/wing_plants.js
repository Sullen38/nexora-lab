/* ============================================================================
 * objects/wing_plants.js — ВАЗОНИ ЛІВОГО КРИЛА (AI-центр, аналітика, маркетинг)
 * ----------------------------------------------------------------------------
 * Вазони тут — ТОЧНІ КОПІЇ з картинки кімнати і стоять на тих самих місцях
 * (так попросив власник: "вазони точно такі, як були"). Їх перенесено скриптом
 * tools/image/06_trace_plants.py у чистий піксель-арт: маска за кольором,
 * палітра без розмиття, темний контур. Атлас — assets/plants_wing.png,
 * розстановка — js/objects/wing_plants_data.js (NX.WING_PLANTS).
 *
 * Кожен вазон — окремий об'єкт:
 *   - листя над горщиком легенько гойдається (спрайт ріжеться на смужки, низ
 *     нерухомий — горщик стоїть, крони хитаються), тап — листя шелестить
 *   - ліхтарик (lamp) тепло мерехтить
 *   - stage 'behindDesk' — малюється за столом AI-центру (кущ у кутку ховається
 *     за монітором, як на картинці); 'wall' — ліани на стіні (звисають, низ гойдається
 *     більше); решта — у шарах за глибиною (y = підлога)
 * CLONES — вазони, яких на картинці не видно через латки фону: беремо такий
 * самий вазон з іншого столу (стиль той самий).
 * ========================================================================== */
(() => {
  const P = NX.px, RS = 2;                                                     // 2 px атласу = 1 од. кімнати
  const img = new Image(); img.src = (window.NX_ASSETS && NX_ASSETS['plants_wing.png']) || 'assets/plants_wing.png';
  const DATA = NX.WING_PLANTS || [], byId = Object.fromEntries(DATA.map(d => [d.id, d]));
  /** Копії вазонів у місцях, де на картинці латки: { id, src (з якого спрайта), x, y, floor, flip }. */
  const CLONES = [
    { id: 'anDesk', src: 'mkDeskB', x: 393, y: 236, floor: 284, flip: true },                // на столі аналітики
  ];
  NX.wingPlants = { behind: [], drawBehind(c, t) { this.behind.forEach(o => o.draw(c, t)); } };

  function make(d, src) {
    const hit = { x: d.x + 2, y: d.y, w: src.w / RS - 4, h: src.h / RS };
    const o = NX.addObject({
      id: 'wp_' + d.id, name: d.lamp ? 'obj.lamp' : 'obj.plant', act: 'rustle', hit, shake: 0, ph: P.hash(d.x, d.y) * 6,
      onTap() {
        this.shake = 1; NX.nexi.emote('happy', 1.5);
        for (let i = 0; i < 8; i++) NX.fx.emit('spark', hit.x + Math.random() * hit.w, hit.y + Math.random() * hit.h * .6, { col: d.lamp ? '#ffd27a' : Math.random() < .6 ? '#9aff7a' : '#ffe27a', vy: -20 - Math.random() * 20, g: 30, ttl: 1, s: 1.1 });
        return true;
      },
      update(dt) { this.shake = Math.max(0, this.shake - dt * .9); },
      /** Малюємо смужками: над горщиком — з гойданням (більше вгорі), горщик — нерухомий. */
      draw(c, t) {
        if (!img.complete || !img.naturalWidth) return;
        const Kk = NX.cam.k * (NX.loop.dpr || 1), W = src.w / RS, hang = d.stage === 'wall', potPx = hang ? src.h : Math.max(0, Math.min(src.h, (d.potTop - d.y) * RS));
        c.save(); c.imageSmoothingEnabled = Kk < RS;                                 // атлас дрібніший за пікселі екрана -> згладжене зменшення
        if (d.flip) { c.translate(d.x * 2 + W, 0); c.scale(-1, 1); }
        if (d.lamp) P.glow(c, d.x + W / 2, d.y + src.h / RS * .45, 26, 'rgba(255,190,90,.9)', .35 + .12 * Math.sin(t * 7 + this.ph) + .06 * Math.sin(t * 13));
        const bands = Math.max(1, Math.round(potPx / 10)), bh = potPx / bands;
        for (let b = 0; b < bands; b++) {
          const v = hang ? (b + .5) / bands : 1 - (b + .5) / bands, sw = (Math.sin(t * 1.1 + this.ph) * .5 + Math.sin(t * 2.3 + b * .4 + this.ph) * .2) * v * v + Math.sin(t * 18) * this.shake * v * 1.8;
          c.drawImage(img, src.ax, b * bh, src.w, bh + .5, d.x + sw, d.y + b * bh / RS, W, (bh + .5) / RS);
        }
        if (potPx < src.h) c.drawImage(img, src.ax, potPx, src.w, src.h - potPx, d.x, d.y + potPx / RS, W, (src.h - potPx) / RS);
        c.restore();
      },
      layers(t) { return d.stage === 'layer' ? [{ y: d.floor, draw: c => this.draw(c, t) }] : []; },
    });
    if (d.stage === 'behindDesk' || d.stage === 'wall') NX.wingPlants.behind.push(o);
    return o;
  }
  DATA.forEach(d => make(d, d));
  CLONES.forEach(cl => { const s = byId[cl.src]; if (s) make({ ...s, ...cl, potTop: cl.y + (s.potTop - s.y), stage: 'layer' }, s); });
})();
