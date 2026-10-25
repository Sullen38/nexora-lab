/* ============================================================================
 * objects/wing_scene.js — ЛІВЕ КРИЛО: ФОН-ПОЛИЦІ ТА ВСІ РОСЛИНИ Й ДРІБНИЧКИ (об'єкти)
 * ----------------------------------------------------------------------------
 * Червоні зони власника ("полички, вазончики, лампочки — цей стиль лишити, але
 * зробити об'єктами, живими"): полиці між AI-центром і аналітикою, верх над
 * аналітикою, стіна між аналітикою й маркетингом. Усе перемальовано в той самий
 * піксель-арт, що й кодові об'єкти (tools/image/08_wing_backdrop.py):
 *   assets/wing_back.png    — фон-полиці (нерухомий, 4 px/од.)
 *   assets/wing_sprites.png — рослини, лампи, речі (NX.WING.sprites)
 * Живе:
 *   - рослини гойдаються (верх хитається, горщик стоїть; ліани — навпаки), тап — шелест
 *   - лампи й ліхтарики мерехтять теплим світлом, неонова вивіска пульсує (NX.WING.lights)
 *   - сині екрани на полицях показують біжучі дані (NX.WING.screens)
 *   - ліхтарик під столом (aiLantern) блимає
 * Шари: 'wall' і 'behindDesk' — малюються за столами (drawBack / NX.wing.drawBehind),
 *       'layer' — за глибиною (y = підлога), 'desk' — речі на столі AI-центру (ai_center.js).
 * Вазони на столах стоять НА стільниці (y підбирається до NX.aiDesk.top / столів).
 * ========================================================================== */
(() => {
  const P = NX.px, PX = 4, D = NX.WING || { sprites: [], lights: [], screens: [], back: { box: [0, 0, 0, 0] } };
  const img = new Image(); img.src = (window.NX_ASSETS && NX_ASSETS['wing_sprites.png']) || 'assets/wing_sprites.png';
  const back = new Image(); back.src = (window.NX_ASSETS && NX_ASSETS['wing_back.png']) || 'assets/wing_back.png';
  const ready = im => im.complete && im.naturalWidth;
  const rgba = (rgb, a) => `rgba(${rgb},${P.clamp(a, 0, 1)})`;
  const [SCV, sc] = (() => { const cv = document.createElement('canvas'); cv.width = 112; cv.height = 64; return [cv, cv.getContext('2d')]; })();

  NX.wing = { behind: [], layerObjs: [],
    drawBehind(c, t) { this.behind.forEach(o => o.draw(c, t)); },
  };
  // ---------- фон-полиці + вогні + екрани ----------
  NX.addObject({
    id: 'wingBack', fr: 0,
    drawBack(c, t) {
      if (!ready(back)) return;
      const [x0, y0] = D.back.box, Kk = NX.cam.k * (NX.loop.dpr || 1);
      c.save(); c.imageSmoothingEnabled = Kk < PX * .95;
      c.drawImage(back, x0, y0, back.naturalWidth / PX, back.naturalHeight / PX);
      // сині екрани на полицях: біжучі дані (оновлення раз на 3 кадри)
      if ((this.fr++ % 3) === 0) { sc.clearRect(0, 0, 112, 64); sc.fillStyle = 'rgba(40,120,255,.35)'; sc.fillRect(0, 0, 112, 64);
        for (let i = 0; i < 9; i++) { const h = 8 + 36 * (.5 + .4 * Math.sin(t * 1.4 + i * 1.3) * Math.sin(t * .7 + i)); sc.fillStyle = i % 3 ? 'rgba(122,240,255,.8)' : 'rgba(255,255,255,.9)'; sc.fillRect(6 + i * 11, 58 - h, 7, h); }
        sc.fillStyle = 'rgba(255,255,255,.5)'; sc.fillRect(0, (t * 30) % 64, 112, 2); }
      c.globalCompositeOperation = 'lighter'; c.globalAlpha = .55; c.imageSmoothingEnabled = true;
      D.screens.forEach(q => NX.furn.warp(c, SCV, q, 1.5)); c.globalAlpha = 1;
      D.lights.forEach((L, i) => { const f = L.pulse ? .6 + .4 * Math.abs(Math.sin(t * 1.2 + i)) : .75 + .12 * Math.sin(t * 6.3 + i * 2.1) + .08 * Math.sin(t * 13.7 + i); P.glow(c, L.x, L.y, L.r, `rgba(${L.c},.9)`, .32 * f); });
      c.restore();
      NX.wing.drawBehind(c, t);
    },
  });
  // ---------- спрайти ----------
  function make(d) {
    const W = d.w / PX, H = d.h / PX, hit = { x: d.x + 1, y: d.y, w: W - 2, h: H };
    const o = NX.addObject({
      id: 'ws_' + d.id, name: d.lamp ? 'obj.lamp' : 'obj.plant', act: d.stage === 'desk' ? undefined : 'rustle', hit, shake: 0, ph: P.hash(d.x, d.y) * 6, d,
      onTap() { this.shake = 1; NX.nexi.emote('happy', 1.5); for (let i = 0; i < 8; i++) NX.fx.emit('spark', hit.x + Math.random() * hit.w, hit.y + Math.random() * hit.h * .6, { col: d.lamp ? '#ffd27a' : Math.random() < .6 ? '#9aff7a' : '#ffe27a', vy: -20 - Math.random() * 20, g: 30, ttl: 1, s: 1.1 }); return true; },
      update(dt) { this.shake = Math.max(0, this.shake - dt * .9); },
      draw(c, t, dy = 0) {
        if (!ready(img)) return;
        const Kk = NX.cam.k * (NX.loop.dpr || 1), hang = d.sway === 'hang', fixed = d.sway === 'none';
        const potPx = fixed ? 0 : hang ? d.h : Math.max(0, Math.min(d.h, (d.potTop - d.y) * PX));
        c.save(); c.imageSmoothingEnabled = Kk < PX * .95;
        if (d.lamp) P.glow(c, d.x + W / 2, d.y + dy + H * .45, 24, 'rgba(255,190,90,.9)', .35 + .12 * Math.sin(t * 7 + this.ph) + .06 * Math.sin(t * 13));
        if (fixed) { c.drawImage(img, d.ax, d.ay, d.w, d.h, d.x, d.y + dy, W, H); c.restore(); return; }
        const bands = Math.max(1, Math.round(potPx / 12)), bh = potPx / bands;
        for (let b = 0; b < bands; b++) {
          const v = hang ? (b + .5) / bands : 1 - (b + .5) / bands, sw = (Math.sin(t * 1.1 + this.ph) * .5 + Math.sin(t * 2.3 + b * .4 + this.ph) * .2) * v * v + Math.sin(t * 18) * this.shake * v * 1.8;
          c.drawImage(img, d.ax, d.ay + b * bh, d.w, bh + .5, d.x + sw, d.y + dy + b * bh / PX, W, (bh + .5) / PX);
        }
        if (potPx < d.h) c.drawImage(img, d.ax, d.ay + potPx, d.w, d.h - potPx, d.x, d.y + dy + potPx / PX, W, (d.h - potPx) / PX);
        c.restore();
      },
      layers(t) { return d.stage === 'layer' ? [{ y: d.floor, draw: c => this.draw(c, t) }] : []; },
    });
    if (d.stage === 'wall') NX.wing.behind.push(o);
    if (d.stage === 'behindDesk') NX.wing.behind.push(o);
    return o;
  }
  D.sprites.forEach(make);
})();
