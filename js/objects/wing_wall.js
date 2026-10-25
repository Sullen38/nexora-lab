/* ============================================================================
 * objects/wing_wall.js — СТІНА ЛІВОГО КРИЛА: цегла, полиці з акваріумами, ліхтарі, неон
 * ----------------------------------------------------------------------------
 * Перший шар лівого крила (x 0..534 — до вікна, y 0..368). Закриває картинку
 * повністю: усе, що видно ліворуч від дивана, намальоване кодом.
 *   цегла з теплими відсвітами ліхтарів і холодним — від екранів; неоновий
 *   плінтус; глянцева підлога під столами (до x 664, далі — підлога картинки)
 *   верхня полиця над AI-центром (з неї звисає ліана), тепла лампа-ліхтар
 *   стелаж між AI-центром і аналітикою: 2 акваріуми з технорибами, нано-куб,
 *   книжки, неонова трубка-роздільник
 *   неонова табличка "AI CHAT" над аналітикою, ліхтар між аналітикою і вікном,
 *   рожева трубка на краю вікна
 * Живе: риби пливуть, бульбашки, лампи мерехтять, табличка блимає.
 * NX.wing.patch() — після кількох кадрів складає нерухому копію крила, з якої
 * кімната тягне передню підлогу й глянцеве віддзеркалення (NX.room.patchFront).
 * ========================================================================== */
(() => {
  const P = NX.px, F = NX.furn, K = NX.kit, { NAVY, PINK, CYAN, CHROME, OUT } = F.PAL, ramp = F.ramp, hash = NX.art.hash, rgba = K.rgba, lit = K.lit;
  const WIN = 534;                                                                // де починається вікно
  const SHELF = { l: 250, r: 318, top: 26, planks: [26, 86, 152, 218, 284] };
  const LANT = [{ x: 206, y: 14, w: 24, h: 32 }, { x: 498, y: 148, w: 24, h: 46 }];   // теплі ліхтарі на стіні
  const SIGN = { x: 330, y: 86, w: 58, h: 34 };
  const TANKS = [{ box: [256, 94, 312, 150], kind: 'reef' }, { box: [256, 160, 312, 216], kind: 'deep' }, { box: [284, 236, 312, 282], kind: 'nano' }];
  const floorTop = X => X < 326 ? 352 : X < 486 ? 346 : 338;

  // ---------- стіна (2 px/од.) ----------
  function buildWall() {
    const S = F.Sheet(0, 0, WIN, 368, .5), FL = ['#07041a', '#0c0726', '#120b34', '#1a1046', '#231658', '#2e1c6c'];
    K.brick(S, [0, 0, WIN, 352], [
      { x: 218, y: 32, r: 90, k: .55, warm: 1 }, { x: 510, y: 172, r: 80, k: .5, warm: 1 },
      { x: 150, y: 170, r: 190, k: .14 }, { x: 358, y: 104, r: 60, k: .28 }, { x: 400, y: 200, r: 120, k: .1 }, { x: 594, y: 215, r: 100, k: .12 },
    ]);
    S.rect(0, 340, WIN, 352, (u, v, i, j, X, Y) => { const k = Y - 340; return k < 1 ? PINK[7] : k < 2 ? PINK[5] : k < 2.6 ? PINK[2] : ramp(['#07041a', '#0d0828', '#140c36'], .3 - k / 24, i, j); });   // плінтус з неоном
    return S;
  }
  // ---------- підлога під столами (до x 664) ----------
  function buildFloor() {
    const S = F.Sheet(0, 336, 664, 368, .5), FL = ['#07041a', '#0c0726', '#120b34', '#1a1046', '#231658', '#2e1c6c'];
    S.rect(0, 336, 664, 368, (u, v, i, j, X, Y) => {
      if (Y < floorTop(X)) return null;
      if (X > 650 && (i + j) % 2 === 0) return null; if (X > 660) return null;                                   // плавний перехід у підлогу картинки
      const st = hash(i >> 1, 3), seam = (((X % 32) + 32) % 32 < .5);
      if (st > .955) return (i >> 1) % 2 ? '#3a1e6e' : '#1c3a7a';                                               // вертикальні відблиски неону
      return ramp(FL, .22 + (Y - 336) / 32 * .25 + (st > .9 ? .25 : st > .8 ? .1 : 0) - (seam ? .1 : 0), i, j, .12);
    });
    return S;
  }
  // ---------- меблі стіни (4 px/од.): полиця зверху, ліхтарі, стелаж, табличка, трубки ----------
  function buildFurn() {
    const S = F.Sheet(0, 0, WIN, 300), BK = ['#1a0e3a', '#24144c', '#2e1a60', '#3a2474'];
    // верхня полиця над AI-центром: товста планка з рожевим неоном знизу, кронштейни
    S.rect(0, 0, 240, 6, (u, v, i, j) => v > .8 ? PINK[5] : v > .62 ? PINK[2] : ramp(NAVY, .5 - v * .3, i, j));
    for (const x of [40, 120, 200]) S.poly([[x - 3, 6], [x + 3, 6], [x + 1, 16], [x - 1, 16]], (u, v, i, j) => ramp(CHROME, .6 - v * .3, i, j));
    // неонові трубки: блакитна — роздільник перед стелажем, рожева — край вікна
    S.rect(243, 10, 246.4, 290, (u, v) => (u > .25 && u < .75) ? '#dff8ff' : '#3be8ff');
    S.rect(WIN - 5, 0, WIN - 1.6, 278, (u, v) => (u > .25 && u < .75) ? '#ffd4ff' : '#ff4fd8');
    // ліхтарі: козирок, золоте скло з рамкою, дно
    for (const L of LANT) {
      S.poly([[L.x - 3, L.y], [L.x + L.w + 3, L.y], [L.x + L.w, L.y + 4], [L.x, L.y + 4]], (u, v, i, j) => v < .3 ? '#ffb070' : ramp(['#3a1408', '#6e3418', '#a85a26'], .7 - v * .5, i, j));
      S.rect(L.x, L.y + 4, L.x + L.w, L.y + L.h, (u, v, i, j, X, Y) => { const e = Math.min(u * L.w, (1 - u) * L.w, v * (L.h - 4), (1 - v) * (L.h - 4));
        if (e < .6) return '#2a0a04'; if (e < 1.8) return ramp(['#5c2410', '#9a4a1a', '#d8782a', '#f4a046'], .7 - v * .4 + (u < .3 ? .2 : 0), i, j);
        if (Math.abs(u - .5) < .03 || Math.abs(v - .5) < .03) return '#9a4a1a';
        return ramp(['#c86a1e', '#f0a03a', '#ffd06a', '#ffe9a6', '#fff8dc'], .95 - Math.abs(u - .5) * 1.3 - Math.abs(v - .5) * .6, i, j); });
      S.rect(L.x - 1, L.y + L.h, L.x + L.w + 1, L.y + L.h + 2.5, (u, v, i, j) => ramp(['#2a0a04', '#5c2410', '#823a18'], .7 - v * .6, i, j));
      S.rect(L.x + L.w / 2 - 1, L.y - 6, L.x + L.w / 2 + 1, L.y, CHROME[2]);                                    // підвіс
    }
    // стелаж: стійки, планки з неоновою кромкою, задня панель
    const { l, r, planks } = SHELF;
    S.rect(l + 4, planks[0], r - 4, planks[4] + 4, (u, v, i, j, X, Y) => ((X - l) % 10 < .7) ? BK[0] : ramp(BK, .45 - v * .25, i, j, .1));   // задня панель з рейками
    for (const x of [l, r - 4]) S.rect(x, SHELF.top - 2, x + 4, planks[4] + 6, (u, v, i, j) => u < .2 || u > .8 ? OUT : ramp(CHROME, .55 - Math.abs(u - .4) * .8 - v * .2, i, j));
    planks.forEach((y, n) => S.rect(l, y, r, y + 4, (u, v, i, j) => v < .2 ? NAVY[7] : v > .78 ? (n % 2 ? '#3be8ff' : '#ff4fd8') : ramp(NAVY, .5 - v * .3, i, j)));
    // ніша 4: книжки + нано-куб (скло кладеться живим)
    const books = [['#3a6ad8', 6], ['#d84a9a', 4], ['#ffd27a', 5], ['#3bd8a8', 4], ['#9a7aff', 6], ['#ff7a4a', 3]]; let bx = l + 6;
    books.forEach(([col, w], k) => { const h = 30 + 10 * hash(k, 2); S.rect(bx, planks[4] - h, bx + w, planks[4], (u, v, i, j) => u < .15 || u > .85 ? OUT : v < .06 ? '#ffffff' : (Math.abs(v - .5) < .04 ? '#ffffff' : K.mix(col, '#000000', .25 + u * .3))); bx += w + .8; });
    TANKS.forEach(T => { const [a, b, c2, d] = T.box; S.rr(a - 2, b - 2, c2 + 2, d + 2, 1.5, (dd, u, v, i, j) => dd < .6 ? OUT : dd < 1.6 ? ramp(CHROME, .6 - v * .3, i, j) : '#061a3a'); });   // рамки акваріумів
    // табличка "AI CHAT": темна пластина з блакитним кантом, іконка-бабл
    S.rr(SIGN.x, SIGN.y, SIGN.x + SIGN.w, SIGN.y + SIGN.h, 2.5, (d, u, v, i, j) => d < .6 ? CYAN[1] : d < 1.4 ? CYAN[4] : d < 2 ? '#06102e' : ramp(['#070b26', '#0a1236', '#0e1a48'], .8 - v * .5, i, j));
    S.rr(SIGN.x + 6, SIGN.y + 10, SIGN.x + 19, SIGN.y + 19, 2, CYAN[4]); S.poly([[SIGN.x + 9, SIGN.y + 19], [SIGN.x + 12, SIGN.y + 19], [SIGN.x + 9, SIGN.y + 22]], CYAN[4]);
    S.rect(SIGN.x + 9, SIGN.y + 13, SIGN.x + 11, SIGN.y + 15, '#070b26'); S.rect(SIGN.x + 13, SIGN.y + 13, SIGN.x + 15, SIGN.y + 15, '#070b26');
    return S;
  }

  // ---------- акваріуми: вода, бульбашки, техно-корали / неонові водорості / медузи, рибки зі слідами ----------
  const FISH = { reef: ['#ff7af0', '#ffe27a', '#7af0ff', '#ff9a5c'], deep: ['#3be8ff', '#9a8cff', '#3bff8a'], nano: ['#ffe27a', '#ff4fd8'] };
  function drawTank(T, t) {
    if (!T.cv) { T.cv = document.createElement('canvas'); T.cv.width = 224; T.cv.height = T.kind === 'nano' ? 184 : 224; T.fish = Array.from({ length: T.kind === 'reef' ? 6 : T.kind === 'nano' ? 2 : 4 }, (_, i) => ({ x: Math.random() * 224, y: 30 + Math.random() * 140, v: (10 + Math.random() * 16) * (i % 2 ? 1 : -1), ph: Math.random() * 6, s: .8 + Math.random() * .7, col: FISH[T.kind][i % FISH[T.kind].length] })); }
    const c = T.cv.getContext('2d'), W = T.cv.width, H = T.cv.height, deep = T.kind === 'deep';
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, deep ? '#06204a' : '#0a3a6a'); g.addColorStop(1, deep ? '#020a22' : '#06204a'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.fillStyle = 'rgba(160,230,255,.08)'; for (let k = 0; k < 4; k++) c.fillRect(((t * 9 + k * 55) % (W + 40)) - 20, 0, 6, H);
    if (T.kind === 'nano') { c.fillStyle = '#ff4fd8'; for (let k = 0; k < 2; k++) { const x = 60 + k * 100, y = H - 40 - 14 * Math.abs(Math.sin(t + k)); c.beginPath(); c.arc(x, y, 12, Math.PI, 0); c.fill(); for (let m = 0; m < 4; m++) c.fillRect(x - 9 + m * 6, y, 2, 16 + 6 * Math.sin(t * 3 + m + k)); } c.fillStyle = '#ffe27a'; c.fillRect(100, H - 60, 8, 50); }
    else if (deep) { for (let k = 0; k < 7; k++) { const x = 14 + k * 32, h = 50 + 30 * Math.sin(k * 2.1); c.strokeStyle = k % 2 ? '#1a7a5a' : '#3be8ff'; c.lineWidth = 3; c.beginPath(); c.moveTo(x, H); for (let y = 0; y < h; y += 6) c.lineTo(x + Math.sin(t * 1.5 + k + y * .15) * 4, H - y); c.stroke(); } }
    else { for (let k = 0; k < 5; k++) { const x = 20 + k * 44, r = 16 + 8 * Math.sin(k); c.fillStyle = ['#ff4fd8', '#ffe27a', '#ff7a2a'][k % 3]; for (let m = 0; m < 5; m++) { const a = m * 1.26 + k; c.beginPath(); c.arc(x + Math.cos(a) * r * .6, H - 12 - Math.abs(Math.sin(a)) * r, 6, 0, 7); c.fill(); } } }
    c.fillStyle = deep ? '#0c1a3a' : '#1a2a50'; c.fillRect(0, H - 10, W, 10); for (let x = 0; x < W; x += 9) c.fillRect(x, H - 13, 5, 3);
    T.fish.forEach(f => { f.x += f.v * .05; if (f.x > W + 16) f.x = -16; if (f.x < -16) f.x = W + 16; const y = f.y + Math.sin(t * 2 + f.ph) * 5, d = Math.sign(f.v), s = f.s;
      c.fillStyle = f.col; c.globalAlpha = .35; for (let k = 1; k < 5; k++) c.fillRect(f.x - d * k * 7 * s, y - 1, 4 * s, 2 * s); c.globalAlpha = 1;
      c.fillRect(f.x - 7 * s, y - 4 * s, 14 * s, 8 * s); c.fillRect(f.x - 12 * s * d - (d > 0 ? 0 : -5 * s), y - 6 * s, 5 * s, 12 * s);
      c.fillStyle = '#ffffff'; c.fillRect(f.x + 3 * s * d, y - 2 * s, 2 * s, 2 * s); c.fillStyle = '#0a0a2a'; c.fillRect(f.x + 4 * s * d, y - 1.5 * s, s, s); c.fillStyle = 'rgba(255,255,255,.5)'; c.fillRect(f.x - 2 * s, y - 1, 5 * s, 1); });
    for (let k = 0; k < 8; k++) { const q = ((t * .25 + k * .13) % 1), x = 20 + k * 26 + Math.sin(q * 9 + k) * 4; c.strokeStyle = 'rgba(200,240,255,.7)'; c.lineWidth = 1; c.beginPath(); c.arc(x, H - 12 - q * (H - 20), 1.5 + (k % 3), 0, 7); c.stroke(); }
    c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(4, 4, W - 8, 10);
  }

  let WALL = null, FLOOR = null, FURN = null;
  NX.wing = { WIN, SHELF, LANT, SIGN, TANKS, floorTop,
    /** Нерухома копія крила (стіна, столи, будки, крісла, рослини): з неї кімната будує передню підлогу й віддзеркалення. */
    patch() {
      this.patched = true; const img = NX.room.img, RS = NX.room.RS, cv = document.createElement('canvas'); cv.width = img.naturalWidth; cv.height = img.naturalHeight; const x = cv.getContext('2d'), t = NX.time;
      x.imageSmoothingEnabled = true; x.drawImage(img, 0, 0); x.save(); x.scale(RS, RS);
      ['wingBack', 'aiPc', 'analytics', 'marketing', 'wingPlantsWall'].forEach(id => { const o = NX.objects[id]; if (o && o.drawBack) o.drawBack(x, t); });
      const L = []; ['analyticsChair', 'marketingChair', 'coffee', 'catCorner'].forEach(id => { const o = NX.objects[id]; if (o && o.layers) L.push(...o.layers(t)); });
      Object.values(NX.objects).forEach(o => { if (o.id.startsWith('wp_') && o.layers) L.push(...o.layers(t)); });
      L.filter(Boolean).sort((a, b) => a.y - b.y).forEach(l => l.draw(x, t));
      x.restore(); NX.room.patchFront(cv, 0, 664);
    },
  };
  NX.addObject({
    id: 'wingBack', fr: 0,
    drawBack(c, t) {
      if (!WALL) { WALL = buildWall(); WALL.cv = WALL.canvas(null); FLOOR = buildFloor(); FLOOR.cv = FLOOR.canvas(null); FURN = buildFurn(); FURN.cv = FURN.canvas(); }
      const R = F.res();
      c.save();
      K.draw(c, WALL, Math.min(2, R)); K.draw(c, FLOOR, Math.min(2, R)); K.draw(c, FURN, R);
      // акваріуми (кожен оновлюється раз на 3 кадри)
      this.fr++; TANKS.forEach((T, n) => { if (this.fr % 3 === n || !T.cv) drawTank(T, t); const [a, b, c2, d] = T.box; c.imageSmoothingEnabled = true; c.globalAlpha = .95; c.drawImage(T.cv, a, b, c2 - a, d - b); c.globalAlpha = 1; });
      // живе: ліхтарі мерехтять, табличка "AI CHAT", неонові трубки дихають, екрани на полицях відсвічують
      c.globalCompositeOperation = 'lighter';
      LANT.forEach((L, n) => P.glow(c, L.x + L.w / 2, L.y + L.h / 2 + 2, n ? 34 : 30, 'rgba(255,180,80,.9)', .3 + .08 * Math.sin(t * 6.3 + n * 2) + .05 * Math.sin(t * 13.7 + n)));
      P.glow(c, 244.7, 150, 10, 'rgba(59,232,255,.8)', .25 + .1 * Math.sin(t * 1.5)); c.fillStyle = rgba('59,232,255', .25 + .15 * Math.sin(t * 1.5)); c.fillRect(242, 10, 5.4, 280);
      c.fillStyle = rgba('255,79,216', .22 + .12 * Math.sin(t * 1.3 + 1)); c.fillRect(WIN - 6, 0, 6, 278);
      TANKS.forEach(T => { const [a, b, c2, d] = T.box; P.glow(c, (a + c2) / 2, (b + d) / 2, (c2 - a) * .8, 'rgba(60,160,255,.6)', .12 + .04 * Math.sin(t + a)); });
      c.globalCompositeOperation = 'source-over';
      P.text(c, 'AI', SIGN.x + 24, SIGN.y + 14, '#ff7af0', 5); P.text(c, 'CHAT', SIGN.x + 24, SIGN.y + 23, '#3be8ff', 5);
      if (Math.sin(t * 3) > 0) lit(c, SIGN.x + SIGN.w - 8, SIGN.y + 4, 3, 3, '#3bff8a');
      c.restore();
      if (!NX.wing.patched && this.fr > 6 && !c.isRefl && NX.room.img.naturalWidth) NX.wing.patch();
    },
  });
})();
