/* ============================================================================
 * objects/planters.js — ВАЗОНИ ПЕРЕД ВІКНОМ (Декор стін · 31)
 * ----------------------------------------------------------------------------
 * Власник: «за диваном і за робочими зонами (СКІНИ, маркетинг) — місце перед вікном: вазонів усяких прикольних, і щоб читалися».
 * Ряд з п'яти великих підлогових вазонів уздовж вікна за диваном (підлога біля задньої стіни, y ≈ FLOOR_Y) — видно над спинкою,
 * перед шибками й рамами. Рослини — великі (70–90 од.), кожен вид свій і новий: алоказія, цереус, фікус ліровидний, юка, драцена
 * (objects/dc_plants.js OWN.*; спрайти через NX.arc.dcPlant). Вазони — кібер, кожен свій: шестигранник з неоновим кантом, тринога з
 * LED-ногами, бочка зі шкалою вологи, колона з сяйними щілинами, ЛЕВІТУЮЧИЙ горщик на кільці (гойдається). Малюються ПОЗАДУ дивана й зон: drawBack у порядку об'єктів — скрипт
 * іде після arc_scene (стіни, вікно) і перед workshop / marketing (index.html); диван, Nexi й Рудик — шари поверх. Тап по рослині — картка довідника (· 18, група 'floor').
 * Світло декору вночі (· 23) — через NX.decorLight.k: неон вазонів яскравіший.
 * ========================================================================== */
(() => {
  const C = NX.cfg, FY = C.FLOOR_Y, hash = NX.art.hash;
  // x — центр на підлозі; kind — вид (dc_plants OWN); pot — вазон; pw/ph — вазон (од.); w/h — рослина (од.); seed
  const PL = [
    { x: 670, y: FY + 3, kind: 'calathea', pot: 'cage', pw: 24, ph: 18, w: 44, h: 60, seed: 71, col: '#ff4fd8' },
    { x: 706, y: FY + 3, kind: 'alocasia', pot: 'hex', pw: 30, ph: 21, w: 54, h: 74, seed: 11, col: '#3be8ff' },
    { x: 740, y: FY + 2, kind: 'cactus', pot: 'tripod', pw: 22, ph: 16, w: 30, h: 82, seed: 23, col: '#ff4fd8' },
    { x: 774, y: FY + 4, kind: 'ficus', pot: 'barrel', pw: 34, ph: 25, w: 60, h: 94, seed: 37, col: '#b8ff3a' },
    { x: 806, y: FY + 3, kind: 'bamboo', pot: 'column', pw: 22, ph: 30, w: 34, h: 98, seed: 83, col: '#9af6ff' },
    { x: 836, y: FY + 3, kind: 'yucca', pot: 'column', pw: 26, ph: 32, w: 56, h: 76, seed: 41, col: '#3bff8a' },
    { x: 864, y: FY + 4, kind: 'dracaena', pot: 'hover', pw: 28, ph: 16, w: 50, h: 96, seed: 53, col: '#ff4fd8' },
    { x: 882, y: FY + 2, kind: 'pitcher', pot: 'cage', pw: 20, ph: 18, w: 32, h: 64, seed: 61, col: '#ffd23a' },
  ];
  // (· 33) Вісім вазонів у смузі вікна за диваном: вазони між тумбою маркетингу (655) і панеллю СКІНІВ (893), листя — над ними;
  // спрайти з полем pad (листя не зрізається). «За зонами» перевірено червоними смугами перед стінами: шибки за екраном маркетингу й
  // капсулою СКІНІВ закриті растром цілком, тож там рослин не видно; рами вікна — перед склом, рослини — перед рамами (після стін).
  const PAD = 14, SPR = {};                                                                                              // поле навколо спрайта (од.)
  function spriteOf(p) {
    if (SPR[p.kind]) return SPR[p.kind]; const r = NX.arc.dcPlant({ kind: p.kind, w: p.w, h: p.h, seed: p.seed, lit: 1, pad: PAD }); if (!r) return null;
    const cv = document.createElement('canvas'); cv.width = r.sw; cv.height = r.sh; const c = cv.getContext('2d'), im = c.createImageData(r.sw, r.sh); new Uint32Array(im.data.buffer).set(r.d); c.putImageData(im, 0, 0);
    return SPR[p.kind] = cv;
  }
  const px = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
  /** Вазон: x — центр, y — підлога; вертає зсув рослини вгору (де дно рослини) і сяйво (для ночі). */
  function drawPot(c, p, t, LK) {
    const { x, y, pw, ph, col } = p, hw = pw / 2, bob = p.pot === 'hover' ? Math.sin(t * 1.3 + p.x) * 1.2 : 0, yb = y - (p.pot === 'hover' ? 6 + bob : 0);
    c.save(); c.globalAlpha = .35; c.fillStyle = '#000'; c.beginPath(); c.ellipse(x, y + 1, hw * 1.15, 2.2, 0, 0, 6.2832); c.fill(); c.restore();     // тінь на підлозі
    switch (p.pot) {
      case 'hex': {                                                                                                           // шестигранна призма, неоновий кант
        c.fillStyle = '#141a3a'; c.beginPath(); c.moveTo(x - hw, yb - 2); c.lineTo(x - hw * .5, yb); c.lineTo(x + hw * .5, yb); c.lineTo(x + hw, yb - 2); c.lineTo(x + hw, yb - ph); c.lineTo(x - hw, yb - ph); c.closePath(); c.fill();
        px(c, x - hw * .5, yb - ph, hw, ph, '#1c2450'); px(c, x - hw * .5, yb - ph - 1.5, hw * 1.3, 1.5, '#2a3468'); px(c, x - hw, yb - ph - 1.5, hw * .5, 1.5, '#0e1230'); px(c, x + hw * .5, yb - ph - 1.5, hw * .5, 1.5, '#0e1230');
        c.save(); c.globalAlpha = .8 * LK; px(c, x - hw, yb - ph - 2, pw, .7, col); c.restore(); px(c, x - hw * .5 + 1, yb - ph * .35, .8, ph * .25, col); break; }
      case 'tripod': {                                                                                                         // чаша на трьох ніжках з LED
        const sy = yb - 14; for (const d of [-1, 0, 1]) { c.strokeStyle = '#8a92b8'; c.lineWidth = 1; c.beginPath(); c.moveTo(x + d * hw * .9, yb); c.lineTo(x + d * hw * .4, sy); c.stroke(); c.save(); c.globalAlpha = .9 * LK; px(c, x + d * hw * .9 - .5, yb - 2, 1, 1, col); c.restore(); }
        c.fillStyle = '#1c2450'; c.beginPath(); c.moveTo(x - hw, sy - ph + 2); c.lineTo(x + hw, sy - ph + 2); c.lineTo(x + hw * .55, sy); c.lineTo(x - hw * .55, sy); c.closePath(); c.fill();
        px(c, x - hw, sy - ph, pw, 2.2, '#2a3468'); c.save(); c.globalAlpha = .7 * LK; px(c, x - hw, sy - ph + 2.2, pw, .6, col); c.restore(); p._top = sy - ph; break; }
      case 'barrel': {                                                                                                         // бочка зі шкалою вологи
        c.fillStyle = '#1a2040'; c.beginPath(); c.ellipse(x, yb - ph / 2, hw, ph / 2 + 1.5, 0, 0, 6.2832); c.fill(); px(c, x - hw * .95, yb - ph + 1, pw * .95, ph - 2, '#1a2040');
        px(c, x - hw * .9, yb - ph * .3, pw * .9, 1.2, '#2a3468'); px(c, x - hw * .9, yb - ph * .7, pw * .9, 1.2, '#2a3468'); px(c, x - hw, yb - ph - 1, pw, 1.6, '#2a3468');
        const lv = .55 + .35 * Math.sin(t * .15 + p.x); for (let k = 0; k < 5; k++) { const on = k / 5 < lv; c.save(); c.globalAlpha = on ? .9 * LK : .25; px(c, x + hw * .62, yb - 3 - k * 3, 2.4, 1.6, on ? (k < 3 ? col : '#ffd23a') : '#3a4a7a'); c.restore(); } break; }
      case 'column': {                                                                                                         // висока колона з сяйними щілинами
        px(c, x - hw, yb - ph, pw, ph, '#10142e'); px(c, x - hw * .8, yb - ph, pw * .8, ph, '#1c2450'); px(c, x - hw, yb - ph - 1.5, pw, 1.5, '#3a4680'); px(c, x - hw * 1.1, yb - 1.2, pw * 1.1, 1.2, '#0a0e22');
        for (let k = 0; k < 4; k++) { c.save(); c.globalAlpha = (.5 + .4 * Math.sin(t * 2 + k)) * LK; px(c, x - hw * .55, yb - ph + 4 + k * (ph - 8) / 4, pw * .55, .9, col); c.restore(); } break; }
      case 'hover': {                                                                                                          // левітує над світним кільцем
        c.save(); c.globalAlpha = .9 * LK; c.strokeStyle = col; c.lineWidth = 1.2; c.beginPath(); c.ellipse(x, y - 1, hw * .9, 2.4, 0, 0, 6.2832); c.stroke(); c.globalAlpha = .25 * LK; c.fillStyle = col; c.beginPath(); c.ellipse(x, y - 1, hw * .9, 2.4, 0, 0, 6.2832); c.fill(); c.restore();
        c.fillStyle = '#1c2450'; c.beginPath(); c.moveTo(x - hw, yb - ph); c.lineTo(x + hw, yb - ph); c.lineTo(x + hw * .6, yb); c.lineTo(x - hw * .6, yb); c.closePath(); c.fill();
        px(c, x - hw, yb - ph - 1.5, pw, 1.5, '#3a4680'); c.save(); c.globalAlpha = .8 * LK; px(c, x - hw * .6, yb - 2.5, pw * .6, .7, col); c.restore(); p._top = yb - ph; break; }
      case 'cage': {                                                                                                           // клітка-каркас з дротів
        px(c, x - hw * .7, yb - ph * .35, pw * .7, ph * .35, '#1c2450'); c.strokeStyle = '#9aa2c8'; c.lineWidth = .8;
        for (const d of [-1, 1]) { c.beginPath(); c.moveTo(x + d * hw * .7, yb); c.lineTo(x + d * hw, yb - ph); c.stroke(); } for (let k = 1; k <= 3; k++) { const yy = yb - ph * k / 3, ww = hw * (.7 + .3 * k / 3); c.beginPath(); c.moveTo(x - ww, yy); c.lineTo(x + ww, yy); c.stroke(); }
        c.save(); c.globalAlpha = .8 * LK; px(c, x - hw, yb - ph - .7, pw, .7, col); c.restore(); break; }
    }
    return p._top != null ? p._top : yb - ph;
  }
  let hit = null;
  NX.planters = {
    PL,
    /** Тап по рослині чи вазону -> true; вид — lastKind (картка показує objects/decor_guide.js). */
    tap(x, y) { let best = null; for (const p of PL) { const top = p._top != null ? p._top : p.y - p.ph; if (x >= p.x - p.w / 2 - 6 && x <= p.x + p.w / 2 + 6 && y >= top - p.h - 8 && y <= p.y + 1) { const d = Math.abs(x - p.x) / (p.w / 2 + 6); if (!best || d < best.d) best = { p, d }; } }
      if (!best) return false; hit = best.p.kind; best.p.flash = NX.time; return true; },
    get lastKind() { return hit; },
  };
  function drawAll(c, t, back) {
        const LK = NX.decorLight ? NX.decorLight.k(t) : 1, vx0 = NX.cam.x - 60, vx1 = NX.cam.x + NX.cam.viewW + 60;
        for (const p of PL) { if (p.x < vx0 || p.x > vx1) continue; const top = drawPot(c, p, t, LK), cv = spriteOf(p); if (!cv) continue;
          const sway = Math.sin(t * .9 + p.seed) * .4; c.save(); c.imageSmoothingEnabled = false; c.translate(p.x + sway, top + 1); c.drawImage(cv, -p.w / 2 - PAD, -p.h - PAD, p.w + 2 * PAD, p.h + PAD);
          if (p.flash != null && t - p.flash < .8) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = (1 - (t - p.flash) / .8) * .35; c.fillStyle = '#ffffff'; c.fillRect(-p.w / 2, -p.h, p.w, p.h); } c.restore(); }
  }
  NX.addObject({ id: 'planters', span: [590, 950], drawBack(c, t) { drawAll(c, t, false); } });                                // після стін і вікна (arc_scene), перед диваном (шар)
})();
