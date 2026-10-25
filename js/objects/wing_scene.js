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

  // ---------- акваріум: вода, бульбашки, водорості/техно-корали, рибки з неоновими слідами ----------
  const FISH = { reef: ['#ff7af0', '#ffe27a', '#7af0ff', '#ff9a5c'], deep: ['#3be8ff', '#9a8cff', '#3bff8a'], nano: ['#ffe27a', '#ff4fd8'] };
  function drawTank(T, t, n) {
    if (!T.cv) { T.cv = document.createElement('canvas'); T.cv.width = 220; T.cv.height = 128; T.fish = Array.from({ length: T.kind === 'reef' ? 6 : T.kind === 'nano' ? 2 : 4 }, (_, i) => ({ x: Math.random() * 220, y: 20 + Math.random() * 90, v: (8 + Math.random() * 14) * (i % 2 ? 1 : -1), ph: Math.random() * 6, s: .8 + Math.random() * .7, col: FISH[T.kind][i % FISH[T.kind].length] })); }
    const c = T.cv.getContext('2d'), W = 220, H = 128, deep = T.kind === 'deep';
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, deep ? '#06204a' : '#0a3a6a'); g.addColorStop(1, deep ? '#020a22' : '#06204a'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.fillStyle = 'rgba(160,230,255,.08)'; for (let k = 0; k < 4; k++) { const x = ((t * 9 + k * 55) % (W + 40)) - 20; c.fillRect(x, 0, 6, H); }            // промені світла
    if (T.kind === 'nano') { c.fillStyle = '#ff4fd8'; for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(40 + k * 70, H - 18 - 8 * Math.abs(Math.sin(t + k)), 9, 0, 7); c.fill(); } c.fillStyle = '#ffe27a'; c.fillRect(100, H - 40, 6, 32); }   // медузи-ліхтарики й колона
    else if (deep) { for (let k = 0; k < 7; k++) { const x = 14 + k * 32, h = 30 + 18 * Math.sin(k * 2.1); c.strokeStyle = k % 2 ? '#1a7a5a' : '#3be8ff'; c.lineWidth = 3; c.beginPath(); c.moveTo(x, H); for (let y = 0; y < h; y += 6) c.lineTo(x + Math.sin(t * 1.5 + k + y * .15) * 4, H - y); c.stroke(); } }   // неонові водорості
    else { for (let k = 0; k < 5; k++) { const x = 20 + k * 44, r = 12 + 6 * Math.sin(k); c.fillStyle = ['#ff4fd8', '#ffe27a', '#ff7a2a'][k % 3]; for (let m = 0; m < 5; m++) { const a = m * 1.26 + k; c.beginPath(); c.arc(x + Math.cos(a) * r * .6, H - 10 - Math.abs(Math.sin(a)) * r, 5, 0, 7); c.fill(); } } }   // техно-корали
    c.fillStyle = deep ? '#0c1a3a' : '#1a2a50'; c.fillRect(0, H - 8, W, 8); for (let x = 0; x < W; x += 9) c.fillRect(x, H - 11, 5, 3);                      // ґрунт
    T.fish.forEach(f => { f.x += f.v * .05; if (f.x > W + 16) f.x = -16; if (f.x < -16) f.x = W + 16; const y = f.y + Math.sin(t * 2 + f.ph) * 5, d = Math.sign(f.v), s = f.s;
      c.fillStyle = f.col; c.globalAlpha = .35; for (let k = 1; k < 5; k++) c.fillRect(f.x - d * k * 7 * s, y - 1, 4 * s, 2 * s); c.globalAlpha = 1;             // неоновий слід
      c.fillRect(f.x - 7 * s, y - 4 * s, 14 * s, 8 * s); c.fillRect(f.x - 12 * s * d - (d > 0 ? 0 : -5 * s), y - 6 * s, 5 * s, 12 * s);                        // тіло + хвіст
      c.fillStyle = '#ffffff'; c.fillRect(f.x + 3 * s * d, y - 2 * s, 2 * s, 2 * s); c.fillStyle = '#0a0a2a'; c.fillRect(f.x + 4 * s * d, y - 1.5 * s, 1 * s, 1 * s);   // око
      c.fillStyle = 'rgba(255,255,255,.5)'; c.fillRect(f.x - 2 * s, y - 1, 5 * s, 1); });
    for (let k = 0; k < 8; k++) { const q = ((t * .25 + k * .13) % 1), x = 20 + k * 26 + Math.sin(q * 9 + k) * 4; c.strokeStyle = 'rgba(200,240,255,.7)'; c.lineWidth = 1; c.beginPath(); c.arc(x, H - 10 - q * (H - 16), 1.5 + (k % 3), 0, 7); c.stroke(); }   // бульбашки
    c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(4, 4, W - 8, 10);                                                                                      // блік скла
  }
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
      // АКВАРІУМИ З ТЕХНОРИБАМИ на полицях (замість однакових екранів): кожен свій
      (D.tanks || []).forEach((T, n) => { if ((this.fr % 3) === n % 3 || !T.cv) drawTank(T, t, n); c.imageSmoothingEnabled = true; c.globalAlpha = .95; NX.furn.warp(c, T.cv, T.q, 1.2); c.globalAlpha = 1; });
      c.globalCompositeOperation = 'lighter'; c.imageSmoothingEnabled = true;
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
  D.sprites.filter(d => d.stage !== 'hidden').forEach(make);
})();
