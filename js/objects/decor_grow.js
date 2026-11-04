/* ============================================================================
 * objects/decor_grow.js — РІСТ І ЦВІТІННЯ ПІСЛЯ ПОЛИВУ (Декор стін · 22)
 * ----------------------------------------------------------------------------
 * Політа рослина на стіні (Nexi з лійкою — decor_live.js care.water; дрон-поливальник — decor.js droneAt: spray над рослиною
 * антресолі) «оживає» по-справжньому: спершу на ній проростають НОВІ ПАРОСТКИ (світлі листочки, що розгортаються, 0..SPROUT с),
 * потім розкриваються КВІТИ свого кольору й форми на вид (бутон -> квітка, тримаються до BLOOM с, іскряться), наприкінці пелюстки
 * опадають (частинки вниз, FADE с). Місця паростків і квітів — суцільні пікселі самого спрайта виду (верхні 10–60 % висоти), тож
 * вони сидять на листі; для живих рослин точки йдуть за гойданням (decor_live.js plantPt), для нерухомих — за коробкою предмета.
 * Одна рослина цвіте не частіше ніж раз на COOL с (дрон облітає антресоль постійно). Хижаки (мухоловка) й гриб — лише паростки.
 * Картка довідника (decor_guide.js) показує стан: «НОВИЙ ПАРОСТОК» / «ЦВІТЕ» (decor.guide.grow.*, 4 мови).
 * Малює objects/decor_live.js (draw, після рослин) у координатах кімнати.
 * ========================================================================== */
(() => {
  const hash = NX.art.hash, TAU = Math.PI * 2;
  const SPROUT = 14, BLOOM = 80, FADE = 12, COOL = 240;                                 // с: паростки, цвітіння (від поливу), опадання, пауза між цвітіннями
  // квіти на вид: [колір пелюсток, колір середини, форма: daisy | bell | star | spathe | tube], без квітів — лише паростки
  const FL = {
    bonsai: ['#fff0f4', '#ffd27a', 'daisy'], succ: ['#ff9a4a', '#ffe08a', 'bell'], cactus2: ['#ff4fd8', '#ffe08a', 'star'], sansevieria: ['#e8f8ff', '#b8ffd0', 'tube'],
    bostonfern: null, dichondra: ['#fff8d0', '#ffe060', 'daisy'], muehlenbeckia: ['#f0fff0', '#c8ff9a', 'daisy'], bivy: null, passiflora: ['#a08aff', '#ffffff', 'star'],
    spathiphyllum: ['#ffffff', '#ffe08a', 'spathe'], syngonium: null, bananas: ['#ffffff', '#ffe08a', 'daisy'], adansonii: null, dolphins: ['#ffffff', '#ffd27a', 'daisy'],
    lysimachia: ['#ffe03a', '#ff9a3a', 'star'], davallia: null, flytrap: null, staghorn: null, shroom: null, strelitzia: ['#ff9a3a', '#5a6aff', 'spathe'], palm: null,
    monstera: ['#fff8f0', '#ffe08a', 'spathe'], orchid: ['#d86aff', '#ffffff', 'star'], ivy: null, ceropegia: ['#d8a0ff', '#6a2a8a', 'tube'], rhipsalis: ['#ffffff', '#ffe08a', 'daisy'],
    aeschynanthus: ['#ff3a4a', '#8a1020', 'tube'], pearls: ['#ffffff', '#ffd27a', 'daisy'], tradescantia: ['#ff8ad8', '#ffffff', 'star'], wisteria: ['#b8a0ff', '#8a6ae0', 'bell'],
    hoya: ['#ffd0e8', '#ff4a8a', 'star'], asplenium: null, peperomia: ['#e8ffe0', '#c8ff9a', 'tube'], fittonia: ['#f0fff0', '#ffffff', 'tube'], pothos: null, columnea: ['#ff6a2a', '#ffd27a', 'tube'],
  };
  const ST = {};                                                                       // kind -> { t0, pts: [{i, j, s, kind:'sprout'|'flower'}], L, box }
  const kindOf = id => { const R = NX.arc.dcLive || {}, e = R[id]; if (e && e.sp) return e.sp.kind; const B = NX.decor && NX.decor.byId[id]; return B && B.dc ? (B.dc.plant || B.dc.kind) : null; };
  /** Точки на суцільних пікселях спрайта виду: [{u, v}] у частках ширини / висоти спрайта (верхні 10–60 % висоти). */
  function anchors(kind, n, seed) {
    const sp = NX.arc.dcSpec && NX.arc.dcSpec[kind], r = sp && NX.arc.dcPlant(sp); if (!r) return [];
    const out = []; for (let k = 0; k < 60 && out.length < n; k++) { const u = .12 + hash(k, seed) * .76, v = .1 + hash(k + 7, seed) * .5, i = Math.min(r.sw - 1, (u * r.sw) | 0), j = Math.min(r.sh - 1, (v * r.sh) | 0);
      if ((r.d[j * r.sw + i] >>> 24) > 200 && !out.some(q => Math.abs(q.u - u) < .16 && Math.abs(q.v - v) < .16)) out.push({ u, v, s: .8 + hash(k, seed + 1) * .5 }); }
    return out;
  }
  /** Полили рослину id (предмет розкладки) у час t. */
  function water(id, t = NX.time) {
    const kind = kindOf(id); if (!kind || !(kind in FL)) return; const cur = ST[kind]; if (cur && t - cur.t0 < COOL) return;
    const seed = Math.floor(t * 7) % 97 + 3, fl = FL[kind], spr = anchors(kind, 3, seed).map(p => Object.assign(p, { kind: 'sprout' })), flw = fl ? anchors(kind, 2 + (hash(seed, 2) > .5 ? 1 : 0), seed + 40).map(p => Object.assign(p, { kind: 'flower' })) : [];
    ST[kind] = { id, kind, t0: t, pts: spr.concat(flw), fl };
  }
  /** Стан виду для картки: 'sprout' | 'bloom' | null. */
  function state(kind, t = NX.time) { const s = ST[kind]; if (!s) return null; const a = t - s.t0; return a < SPROUT ? 'sprout' : a < BLOOM + FADE && s.fl ? 'bloom' : null; }
  /** Точка спрайта (частки u, v) -> екран: жива рослина — через decor_live.plantPt (гойдається), нерухома — коробка. */
  function toScreen(s, u, v) {
    const DL = NX.decorLive, L = DL && DL.LP.find(q => q.key === s.id);
    if (L && DL.plantPt) { const W = L.sw * L.U, H = L.hpx * L.U; return DL.plantPt(L, u * W, v * H); }
    const G = NX.decorGuide && NX.decorGuide.statics().find(q => q.kind === s.kind); if (!G) return null;
    return [G.x0 + (G.x1 - G.x0) * u, G.y0 + (G.y1 - G.y0) * v];
  }
  const px = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
  function drawSprout(c, x, y, k, t, ph) {                                              // пара світлих листочків на стебельці, розгортаються (k 0..1)
    const h = 4.2 * k, sw = .4 + Math.sin(t * 2 + ph) * .2; px(c, x - .3, y - h, .6, h, '#3a9a4a');
    const lw = 2.1 * k; px(c, x - lw - sw, y - h + .2, lw, .9, '#9aff8a'); px(c, x + sw, y - h - .2, lw, .9, '#c8ff9a'); px(c, x - lw * .6 - sw, y - h + .1, .5, .3, '#e8ffd0'); px(c, x + sw + lw * .5, y - h - .3, .5, .3, '#ffffff');
  }
  function drawFlower(c, x, y, k, fl, t, ph) {                                          // бутон -> квітка (k 0..1): форма на вид
    const [pc, cc, shape] = fl, r = (1.1 + 1.9 * k), bud = k < .35;
    px(c, x - .25, y, .5, 1.4, '#2a7a3a');                                              // квітконіжка
    if (bud) { px(c, x - .6, y - 1.2, 1.2, 1.4, '#6ac86a'); px(c, x - .3, y - 1.6, .6, .6, pc); return; }
    if (shape === 'daisy' || shape === 'star') { const n = shape === 'star' ? 5 : 8; for (let q = 0; q < n; q++) { const a = q / n * TAU + ph * .1, l = r * (shape === 'star' ? 1.2 : 1); px(c, x + Math.cos(a) * l - .45, y - 1 + Math.sin(a) * l * .8 - .45, .9, .9, pc); } px(c, x - .6, y - 1.6, 1.2, 1.2, cc); }
    else if (shape === 'bell') { px(c, x - r * .7, y - 1.6, r * 1.4, r * 1.1, pc); px(c, x - r * .9, y - .6, r * 1.8, .6, pc); px(c, x - .3, y - .3, .6, .4, cc); }
    else if (shape === 'spathe') { px(c, x - r * .35, y - 1.7 * r, r * .7, 1.7 * r, pc); px(c, x - .2, y - 1.5 * r, .4, 1.1 * r, cc); px(c, x - r * .15, y - 1.9 * r, r * .3, .3, pc); }
    else { px(c, x - .45, y - 2 * r, .9, 2 * r, pc); px(c, x - .8, y - 2 * r - .3, 1.6, .7, pc); px(c, x - .25, y - 2 * r - .2, .5, .4, cc); }   // tube
    if (k > .6 && Math.sin(t * 7 + ph) > .9) { c.globalAlpha = .9; px(c, x + Math.cos(ph) * r * 1.4 - .25, y - 1 + Math.sin(ph) * r - .25, .5, .5, '#ffffff'); c.globalAlpha = 1; }   // іскра
  }
  function draw(c, t, vx0, vx1) {
    if (NX.decor && NX.decor.droneAt) { const D = NX.decor.droneAt(t); if (D && D.spray && D.id) water(D.id, t); }   // дрон поливає антресоль
    for (const kind of Object.keys(ST)) { const s = ST[kind], a = t - s.t0; if (a > BLOOM + FADE + 2) { delete ST[kind]; continue; }
      const p0 = toScreen(s, .5, .5); if (!p0 || p0[0] < vx0 - 30 || p0[0] > vx1 + 30) continue;
      for (let q = 0; q < s.pts.length; q++) { const P = s.pts[q], p = toScreen(s, P.u, P.v); if (!p) continue; const ph = q * 1.7 + hash(q, 3) * TAU;
        if (P.kind === 'sprout') { const k = Math.min(1, a / SPROUT * (.7 + .3 * P.s)); if (a < BLOOM + FADE) drawSprout(c, p[0], p[1], k * P.s, t, ph); }
        else { const open = Math.max(0, Math.min(1, (a - SPROUT * .6) / (SPROUT * 1.2))); if (!open) continue;
          if (a < BLOOM) drawFlower(c, p[0], p[1], open * P.s, s.fl, t, ph);
          else { const f = (a - BLOOM) / FADE; if (f < 1) { c.globalAlpha = 1 - f; drawFlower(c, p[0], p[1], P.s * (1 - f * .4), s.fl, t, ph); c.globalAlpha = 1;                   // в'яне й опадає
            for (let w = 0; w < 4; w++) { const d0 = hash(w, q) * .6, g = Math.max(0, (f - d0) / .7); if (g <= 0 || g >= 1) continue; c.globalAlpha = 1 - g; px(c, p[0] + (hash(w, q + 5) - .5) * 3 + Math.sin(t * 3 + w) * 1.2, p[1] + g * g * 12, .6, .6, s.fl[0]); c.globalAlpha = 1; } } } } }
    }
  }
  NX.decorGrow = { water, state, draw, FL, SPROUT, BLOOM, FADE, COOL };
})();
