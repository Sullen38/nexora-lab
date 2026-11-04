/* ============================================================================
 * objects/decor_live.js — ДЕКОР СТІН · 4–5: ЖИВЕ (рослини гойдаються, пілон, плакат Рудика, штучки в сотах; · 5 — тапи, мухоловка, равлик, світло й повітря, краще видно)
 * ----------------------------------------------------------------------------
 * Власник (02.11, «Декор стін · 4»): «більше анімації; рослини — пишніші й живіші; різні артефакти — анімованіші; плакат
 * Рудика — прикольний, піксельний; зараз трохи скучно». Кличе objects/decor.js (NX.decorLive.draw) щокадру — між рибами
 * й дроном, у шарі «позаду персонажів» (поверх нерухомого растра крила).
 *   • РОСЛИНИ, ЩО ГОЙДАЮТЬСЯ: їхньої живої частини в растрі немає (objects/dc_paint.js: NX.arc.dcLive — спрайт і грань у
 *     світі); тут той самий спрайт рядками зсувається вітерцем (від кріплення — до кінчика більше; хвиля йде вздовж), кадр
 *     перемальовується лише коли зсув змінився (≈ 6 разів на секунду), малюється — щокадру; поривами розмах трохи росте.
 *   • ПІЛОН: розсувні двері інколи відчиняються (за ними — тепле світло й полички з розсадою), у колбі піднімаються
 *     бульбашки й смуга світла (обидва — за маскою скла з рушія), крутиться вентилятор, блимають кодовий замок і вогники.
 *   • ФАСАД АНТРЕСОЛІ: блакитною LED-смугою біжать вогники (звиси попереду — їх не перекривають).
 *   • ПЛАКАТ РУДИКА: Рудик (спрайт кота — actors/cat/cat_sprite.js) сидить, кліпає й махає хвостом; час від часу —
 *     лазерні очі: промені в піксельного вірус, той спалахує й зникає (потім з'являється знову).
 *   • ШТУЧКИ В СОТАХ: кришталева куля (вихор), колба (бульбашки), тераріум (світлячки), мікроскоп (світло столика),
 *     статуетка (золотий відблиск), книжки (кристал і іскри); неон сот «дихає»; неонова вивіска — серце б'ється, неон
 *     інколи мерехтить.
 *   • МЕТЕЛИКИ (по одному на крило) пурхають між рослинами; листочки інколи падають з великих висячих.
 * (Декор стін · 5) • ТАПИ по декору (зони — першими): сота спалахує кільцем, двері, лазер Рудика, неон, рослина потрушується,
 *     риби розпливаються, дрон — «бочка». • МУХОЛОВКА на моховому корчі: муха кружляє, сідає — пастка клацає (інший кадр
 *     спрайта); РАВЛИК повзе корчем. • ТРУТОВИКИ на пілоні: сяйво й спори. • СВІТЛО Й ПОВІТРЯ: конуси світла з-під антресолі,
 *     пил і пилок, туман в оранжереї. • КРАЩЕ ВИДНО: накладка на злиття крила (декор яскравіший, контровий відблиск).
 *     Акваріуми · 5 — objects/decor_aqua.js.
 * Зони не зачіпає: усе — у межах декору (decor.py / decor_check.js перевіряють, що декор не заходить на зони).
 * ========================================================================== */
(() => {
  const DC = NX.decor; if (!DC) return;
  const X = NX.px3d, hash = NX.art.hash, proj = X.proj, { MK, AQ, sprite, glowSpr, byId, items } = DC, TAU = Math.PI * 2;
  const basis = B => NX.arc.kit.basis(B);
  /** Передня грань предмета на екрані: три кути (лівий верхній — той, що лівіше на екрані), розміри грані (од. світу). */
  function faceOf(B) {
    const { P } = basis(B), w = B.w / 2; let a = proj(P(-w, 0, B.yt)), b = proj(P(w, 0, B.yt)), d = proj(P(-w, 0, B.yb));
    if (b[0] < a[0]) { a = proj(P(w, 0, B.yt)); b = proj(P(-w, 0, B.yt)); d = proj(P(w, 0, B.yb)); }
    return { S0: a, S1: b, S3: d, fw: B.w, fh: B.yb - B.yt };
  }
  /** Афінне перетворення «текстура грані (од.) -> екран» (на малій грані перспектива майже лінійна). */
  const affOf = F => [(F.S1[0] - F.S0[0]) / F.fw, (F.S1[1] - F.S0[1]) / F.fw, (F.S3[0] - F.S0[0]) / F.fh, (F.S3[1] - F.S0[1]) / F.fh, F.S0[0], F.S0[1]];
  const G = {}; const glow = hx => G[hx] || (G[hx] = glowSpr(hx, 1));                // радіальне світіння (розмір — під час малювання)
  const blob = (c, x, y, r, fill) => { c.fillStyle = fill; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); };

  // =============================== РОСЛИНИ, ЩО ГОЙДАЮТЬСЯ ===============================
  const OUTC = 0xff130306;                                                              // контур (#060313, як у растра)
  const LP = []; let lpN = -1, lpQ = [];
  /** Живі рослини з реєстру — потроху (не більше lim за кадр: без довгої задачі на першому кадрі після збірки). */
  /** Пікселі живої частини спрайта S (рядки r0..r1) + контур 2 px (як у растра). */
  function baseOf(S, r0, r1) {
    const sw = S.sw, sh = S.sh, n = r1 - r0, op = (x, y) => x >= 0 && y >= 0 && x < sw && y < sh && (S.d[y * sw + x] >>> 24) >= 110, base = new Uint32Array(sw * n);
    for (let y = r0; y < r1; y++) for (let x = 0; x < sw; x++) {
      if (!op(x, y)) continue; let edge = false;
      for (let s = 1; s <= 2 && !edge; s++) if (!op(x - s, y) || !op(x + s, y) || !op(x, y - s) || !op(x, y + s)) edge = true;
      base[(y - r0) * sw + x] = edge ? OUTC : ((S.d[y * sw + x] | 0xff000000) >>> 0);
    }
    return base;
  }
  function buildPlants(lim = 4) {
    const R = NX.arc.dcLive || {}, keys = Object.keys(R); if (keys.length !== lpN) { lpN = keys.length; LP.length = 0; lpQ = keys.slice(); }
    for (let left = lim; lpQ.length && left > 0; left--) {
      const key = lpQ[0], e = R[lpQ.shift()], S = e && NX.arc.dcPlant(e.sp); if (!S) continue;
      const sw = S.sw, sh = S.sh, U = S.U || .25, OV = 3, cutR = Math.round(e.cut * sh), up = e.dir === 'up';
      const r0 = up ? 0 : Math.max(0, cutR - OV), r1 = up ? Math.min(sh, cutR + OV) : sh, n = r1 - r0; if (n < 2) continue;
      const base = baseOf(S, r0, r1);
      const pad = Math.ceil(e.amp * 1.35 / U) + 2, W2 = sw + 2 * pad, cv = document.createElement('canvas'); cv.width = W2; cv.height = n;
      const ctx = cv.getContext('2d'), img = ctx.createImageData(W2, n);
      const S0 = proj(e.P0), S1 = proj(e.P1), S3 = proj(e.P3), xs = [S0[0], S1[0], S3[0], S1[0] + S3[0] - S0[0]];
      const ys = [S0[1] + (S3[1] - S0[1]) * r0 / sh, S0[1] + (S3[1] - S0[1]) * r1 / sh, S1[1] + (S3[1] - S0[1]) * r0 / sh, S1[1] + (S3[1] - S0[1]) * r1 / sh];
      LP.push({ e, key, sw, n, r0, r1, cutR, up, pad, U, base, cv, ctx, img, d32: new Uint32Array(img.data.buffer), shx: new Int16Array(n), hpx: sh, meta: S.meta, cur: 0, M: [(S1[0] - S0[0]) / sw, (S1[1] - S0[1]) / sw, (S3[0] - S0[0]) / sh, (S3[1] - S0[1]) / sh, S0[0], S0[1]],
        x0: Math.min(...xs) - 6, x1: Math.max(...xs) + 6, y0: Math.min(...ys), y1: Math.max(...ys), q: -1, N: 26, ph: hash(e.seed, 5) * TAU, shake: -99 });
    }
  }
  function renderPlant(L, q, gust, sk = 0, sph = 0) {                                 // sk — потрушування (тап), розмах у од.; sph — його фаза
    const { e, sw, n, r0, cutR, up, pad, U, base, d32, N } = L, W2 = sw + 2 * pad, len = Math.max(1, up ? cutR : L.r1 - cutR), A = e.amp * gust / U, ph = q / N * TAU + L.ph, SK = sk / U;
    d32.fill(0);
    for (let r = 0; r < n; r++) {
      const y = r0 + r, dist = Math.max(0, up ? cutR - y : y - cutR) / len;
      const dx = Math.max(-pad, Math.min(pad, Math.round(A * Math.pow(dist, 1.45) * (Math.sin(ph - dist * 1.7) + .22 * Math.sin(ph * 2.3 - dist * 3.1)) + SK * Math.pow(dist, 1.2) * Math.sin(sph - dist * 2.4))));
      L.shx[r] = dx; d32.set(base.subarray(r * sw, r * sw + sw), r * W2 + pad + dx);
    }
    L.ctx.putImageData(L.img, 0, 0); L.q = q;
  }
  /** (· 5) ВЕНЕРИНА МУХОЛОВКА: цикл 15 с — муха кружляє (0..9.6), підлітає до пастки (..10.4), сидить і повзає (..12), ПАСТКА
   *  КЛАЦАЄ (12) і тримає муху закритою (..14.6), далі відкривається; наступного циклу — нова муха й інша пастка. Тап — муха
   *  одразу летить до пастки (цикл перескакує). -> {k — закрита пастка або −1, fly — муха (од. спрайта) або null, snap — с від клацання}. */
  const FT = { off: 0 };
  function trapAt(L, t) {
    const T = 15, tt = t + 5 + FT.off, ph = ((tt % T) + T) % T, cyc = Math.floor(tt / T), TR = L.meta && L.meta.traps; if (!TR) return { k: -1, fly: null, snap: -9 };
    const k = [1, 0, 2][((cyc % 3) + 3) % 3], [tx, ty, r] = TR[k], W = L.sw * L.U, H = L.hpx * L.U;
    const orb = u => { const a = u * 1.9 + Math.sin(u * .7) * 1.4; return [W / 2 + Math.cos(a) * W * .52 + Math.sin(u * 5.3) * .5, H * .3 + Math.sin(a * 1.3) * H * .22 + Math.sin(u * 7.1) * .4]; };
    if (ph < 9.6) { const p = orb(tt), e = Math.min(1, ph / 1.4), s0 = [W / 2 + 5, -4];   // влітає згори-праворуч
      return { k: -1, fly: [s0[0] + (p[0] - s0[0]) * e, s0[1] + (p[1] - s0[1]) * e], snap: -9 }; }
    if (ph < 10.4) { const p = orb(tt - (ph - 9.6)), f = (ph - 9.6) / .8, e = f * f * (3 - 2 * f); return { k: -1, fly: [p[0] + (tx - p[0]) * e, p[1] + (ty - r * .15 - p[1]) * e], snap: -9 }; }
    if (ph < 12) return { k: -1, fly: [tx + Math.sin(ph * 3.1) * r * .25, ty - r * .15 + Math.sin(ph * 4.3) * .15], sit: 1, snap: -9 };
    return { k: ph < 14.6 ? k : -1, fly: null, snap: ph - 12, at: [tx, ty, r] };
  }
  const FLY = [0, 1].map(f => sprite(9, 7, S => {                                       // муха: два кадри (крила вгорі / внизу)
    if (f) { S.ell(3.6, 1.7, 1.7, 1.2, '#cfe8ff', 170); S.ell(5.3, 1.6, 1.4, 1.1, '#e8f6ff', 170); } else { S.ell(3.3, 5.6, 1.7, 1, '#cfe8ff', 140); S.ell(5, 5.8, 1.4, .9, '#e8f6ff', 140); }
    S.ell(4.4, 4, 2.3, 1.6, (x, y, u, v) => v < -.3 ? '#8af0a0' : u > .3 ? '#1a7a3a' : '#2ec058'); S.ell(6.8, 3.8, 1.3, 1.2, '#14502a'); S.set(7, 3, '#ff3a3a'); S.set(7, 4, '#c81e28'); S.set(3, 3, '#e8fff0');   // смарагдова муха: видно на фіолетовій стіні
  }, false));
  /** Точка спрайта рослини L (од. спрайта; рядок — з його поточним зсувом) -> екран (од. кімнати). */
  const plantPt = (L, x, y) => { const py = y / L.U, r = Math.max(0, Math.min(L.n - 1, Math.round(py) - L.r0)), px = x / L.U + (L.shx[r] || 0), M = L.M; return [M[0] * px + M[2] * py + M[4], M[1] * px + M[3] * py + M[5]]; };
  function drawFlytrap(c, L, t) {
    const st = trapAt(L, t);
    if (st.fly) { const p = plantPt(L, st.fly[0], st.fly[1]), S = FLY[st.sit ? 1 : Math.floor(t * 30) % 2], w = 2.7, h = w * S.h / S.w, dir = st.sit ? 1 : (Math.cos(t * 1.9) > 0 ? -1 : 1);
      c.setTransform(c.__base[0], c.__base[1], c.__base[2], c.__base[3], c.__base[4], c.__base[5]); c.translate(p[0], p[1]); if (dir < 0) c.scale(-1, 1); c.drawImage(S.cv, -w / 2, -h / 2, w, h); }
    if (st.snap >= 0 && st.snap < .5) { const [tx, ty] = st.at, p = plantPt(L, tx, ty), f = st.snap / .5;   // клац: зелені іскорки
      c.setTransform(c.__base[0], c.__base[1], c.__base[2], c.__base[3], c.__base[4], c.__base[5]); c.globalCompositeOperation = 'lighter';
      for (let q = 0; q < 6; q++) { const a = q / 6 * TAU + .4, rr = .8 + f * 2.6; c.globalAlpha = 1 - f; c.fillStyle = q % 2 ? '#b8ff9a' : '#ffffff'; c.fillRect(p[0] + Math.cos(a) * rr - .25, p[1] + Math.sin(a) * rr * .7 - .25, .5, .5); }
      c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; }
    return st;
  }
  function drawPlants(c, t, vx0, vx1) {
    let budget = 9;                                                                      // перемальовок за кадр (решта — наступного)
    c.save(); c.imageSmoothingEnabled = true;
    for (const L of LP) {
      if (L.x1 < vx0 || L.x0 > vx1) continue;
      if (L.e.sp.kind === 'flytrap' && L.meta) { const k = trapAt(L, t).k, want = k + 1;   // мухоловка: закрита пастка — інший кадр спрайта
        if (want !== L.cur) { L.alt = L.alt || []; if (!L.alt[want]) L.alt[want] = want ? baseOf(NX.arc.dcPlant(Object.assign({}, L.e.sp, { snap: k })), L.r0, L.r1) : L.base0 || L.base;
          L.base0 = L.base0 || L.base; L.base = L.alt[want]; L.cur = want; L.dirty = 1; } }
      const q = Math.floor((t / L.e.per) * L.N) % L.N, gust = .8 + .35 * (.5 + .5 * Math.sin(t * .23 + L.ph)) * (.6 + .4 * Math.sin(t * .61 + L.ph * 2)), ds = t - L.shake;
      if (ds >= 0 && ds < 2.4) { renderPlant(L, q, gust, Math.min(4.5, L.e.amp * 2.2 + 1.2) * Math.exp(-ds / .55), ds * 15); L.dirty = 1; }   // тап: потрушується (щокадру)
      else if ((q !== L.q || L.dirty) && budget-- > 0) { renderPlant(L, q, gust); L.dirty = 0; }
      if (L.q < 0) continue;
      const [a, b, cc, d, e, f] = L.M; c.setTransform(...mul(c.__base, [a, b, cc, d, e, f])); c.drawImage(L.cv, -L.pad, L.r0);
      if (L.e.sp.kind === 'flytrap' && L.meta) drawFlytrap(c, L, t);
    }
    c.restore();
  }
  /** Множення матриць канваса (база кадру × грань): setTransform швидший за save/transform/restore на кожну рослину. */
  const mul = (m, n) => [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3], m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]];

  // =============================== ПІЛОН ===============================
  const PYL = byId.dc_pylon;
  /** Точка бокової грані пілона (глибина від стіни ins, висота Y) — як у decor.py (u = ±w/2, v = fin − ins). */
  const sideP = PYL && (() => { const { P } = basis(PYL), M = PYL.dc, u = (M.sR || 1) * (PYL.w / 2 + .2); return (ins, Y) => P(u, M.fin - ins, Y); })();
  /** Маскований малюнок вікна пілона (як риби в акваріумах): текстура -> полотно -> «destination-in» маскою скла. */
  function maskedDraw(c, aq, t, Rd, vx0, vx1, paint, every2 = true) {
    const M = MK[aq], A = AQ[aq]; if (!M || !A) return;
    if (M.x > vx1 || M.x + M.w < vx0) return;
    const W = Math.max(1, Math.ceil(M.w * Rd)), H = Math.max(1, Math.ceil(M.h * Rd)), fresh = !M.out || M.out.width !== W || M.out.height !== H;
    if (fresh) { M.out = document.createElement('canvas'); M.out.width = W; M.out.height = H; }
    M.fr = (M.fr || 0) + 1;
    if (!fresh && every2 && (M.fr & 1)) { if (M.vis) { c.save(); c.imageSmoothingEnabled = true; c.drawImage(M.out, M.x, M.y, M.w, M.h); c.restore(); } return; }
    const fx = M.out.getContext('2d'); fx.setTransform(1, 0, 0, 1, 0, 0); fx.globalCompositeOperation = 'source-over'; fx.globalAlpha = 1; fx.clearRect(0, 0, W, H);
    fx.setTransform(Rd, 0, 0, Rd, -M.x * Rd, -M.y * Rd); fx.imageSmoothingEnabled = true;
    const F = faceOf(A.B); fx.transform(...affOf(F)); M.vis = paint(fx, F.fw, F.fh, t) !== false;
    if (!M.vis) return;
    fx.setTransform(1, 0, 0, 1, 0, 0); fx.globalCompositeOperation = 'destination-in'; fx.drawImage(M.cv, 0, 0, W, H); fx.globalCompositeOperation = 'source-over';
    c.save(); c.imageSmoothingEnabled = true; c.drawImage(M.out, M.x, M.y, M.w, M.h); c.restore();
  }
  /** Двері: цикл 17 с — зачинені (статичний малюнок растра), відчиняються, відчинені (тепле світло, полички з розсадою, лампа),
   *  зачиняються. -> false, коли зачинені (нічого не малюємо). */
  const openAt = k => k < 0 ? 0 : k < .9 ? k / .9 : k < 3.6 ? 1 : k < 4.5 ? 1 - (k - 3.6) / .9 : 0;
  const doorOpen = t => Math.max((t % 17) < 11 ? 0 : openAt((t % 17) - 11), openAt(t - TP.door));   // сама — раз на 17 с; від тапу — одразу
  /** (· 7) Другий поверх вітає Nexi, що підлетів на ранці: двері пілона відчиняються (якщо зачинені), ліхтар спалахує. */
  const greet = t => { if (doorOpen(t) <= 0) TP.door = t; TP.lamp = t; };
  function paintDoor(c, fw, fh, t) {
    const o0 = doorOpen(t); if (o0 <= 0) return false; const o = o0 * o0 * (3 - 2 * o0), s = o * fw * .5;
    const g = c.createLinearGradient(0, 0, 0, fh); g.addColorStop(0, '#5a2a10'); g.addColorStop(.4, '#c8641e'); g.addColorStop(1, '#ffb24a'); c.fillStyle = g; c.fillRect(0, 0, fw, fh);
    const lr = c.createRadialGradient(fw / 2, fh * .2, 0, fw / 2, fh * .2, fw * .7); lr.addColorStop(0, 'rgba(255,240,200,.95)'); lr.addColorStop(1, 'rgba(255,200,120,0)'); c.fillStyle = lr; c.fillRect(0, 0, fw, fh);
    c.fillStyle = '#3a1a0a'; c.fillRect(fw / 2 - .15, 0, .3, fh * .12); blob(c, fw / 2, fh * .14, 1, '#fff4d8');                   // лампа
    for (const y of [fh * .48, fh * .78]) { c.fillStyle = '#4a2a14'; c.fillRect(.5, y, fw - 1, .6);                                  // полички з розсадою
      for (let k = 0; k < 4; k++) { const x = 1.6 + k * (fw - 3.2) / 3; c.fillStyle = '#2a1608'; c.fillRect(x - .8, y - 1.3, 1.6, 1.3); c.fillStyle = k % 2 ? '#3aa84a' : '#5ad86a';
        c.beginPath(); c.ellipse(x - .5, y - 2, .6, 1, -.5, 0, TAU); c.fill(); c.beginPath(); c.ellipse(x + .5, y - 2.1, .6, 1, .5, 0, TAU); c.fill(); } }
    for (const sd of [-1, 1]) { c.save(); c.beginPath(); c.rect(sd < 0 ? 0 : fw / 2 + s, 0, fw / 2 - s, fh); c.clip(); c.translate(sd * s, 0); NX.arc.paint.dc_door(c, fw, fh); c.restore(); }
    return true;
  }
  /** Колба: бульбашки знизу вгору, смуга світла біжить угору, іскорки. */
  function paintGlass(c, fw, fh, t) {
    for (let k = 0; k < 16; k++) { const sp = 6 + 9 * hash(k, 3), f = ((t * sp / fh) + hash(k, 7)) % 1, y = fh - f * fh, x = fw * (.2 + .6 * hash(k, 11)) + Math.sin(t * 2 + k) * .4, r = .25 + .4 * hash(k, 13);
      c.globalAlpha = .75 * (1 - f * .4); blob(c, x, y, r, '#d8fff4'); c.globalAlpha = .9; blob(c, x - r * .3, y - r * .3, r * .3, '#ffffff'); }
    c.globalAlpha = 1; const by = fh - ((t * .33) % 1) * (fh + 10) + 5, g = c.createLinearGradient(0, by - 5, 0, by + 5); g.addColorStop(0, 'rgba(120,255,220,0)'); g.addColorStop(.5, 'rgba(160,255,230,.45)'); g.addColorStop(1, 'rgba(120,255,220,0)');
    c.fillStyle = g; c.fillRect(0, by - 5, fw, 10);
    return true;
  }
  /** Вентилятор у круглій ґратці (бокова грань), вогник кодового замка, вогники лицьової грані. */
  function drawPylonBits(c, t, vx0, vx1) {
    if (!PYL || !sideP) return; const M = PYL.dc, [vu, vy, vr] = M.vent;
    const q0 = proj(sideP(vu, vy)); if (q0[0] < vx0 - 30 || q0[0] > vx1 + 30) return;
    const qi = proj(sideP(vu + 1, vy)), qy = proj(sideP(vu, vy + 1));
    c.save(); c.transform(qi[0] - q0[0], qi[1] - q0[1], qy[0] - q0[0], qy[1] - q0[1], q0[0], q0[1]);
    c.beginPath(); c.arc(0, 0, vr - 1.25, 0, TAU); c.clip();
    const a0 = t * 4.2; c.fillStyle = 'rgba(4,3,14,.65)'; c.fillRect(-vr, -vr, vr * 2, vr * 2);
    for (let k = 0; k < 5; k++) { const a = a0 + k / 5 * TAU; c.save(); c.rotate(a); const g = c.createLinearGradient(0, -1, 0, 1); g.addColorStop(0, '#8a92b8'); g.addColorStop(1, '#3a4068'); c.fillStyle = g;
      c.beginPath(); c.moveTo(.6, -.5); c.quadraticCurveTo(vr * .55, -1.9, vr - 1.4, -.6); c.lineTo(vr - 1.5, .6); c.quadraticCurveTo(vr * .5, .4, .6, .5); c.closePath(); c.fill(); c.restore(); }
    blob(c, 0, 0, 1.1, '#c8ccdd'); blob(c, -.25, -.25, .4, '#ffffff');
    c.restore();
    const [k0, k1, ky0] = M.keys, kp = proj(sideP((k0 + k1) / 2, ky0 + .8)), op = doorOpen(t) > 0;                // кодовий замок: зелений, коли відчинено; інакше блимає
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = op ? .9 : (Math.sin(t * 3.3) > .2 ? .8 : .15);
    const gk = glow(op ? '#3bff8a' : (t % 6 < 3 ? '#3bff8a' : '#ff4a3a'), 1.6); c.drawImage(gk.cv, kp[0] - 1.6, kp[1] - 1.6, 3.2, 3.2);
    const { P } = basis(PYL), cols = ['#3bff8a', '#ffd23a', '#3be8ff', '#ff4fd8', '#ff4a3a'];                      // лицьова грань: вогники біжать униз
    for (let k = 0; k < 5; k++) { const p = proj(P(0, -.1, M.deck + 6 + k * 2)), on = ((Math.floor(t * 4) - k) % 5 + 5) % 5 === 0;
      c.globalAlpha = on ? 1 : .22; const gg = glow(cols[k], 1.4); c.drawImage(gg.cv, p[0] - 1.4, p[1] - 1.4, 2.8, 2.8); }
    c.restore();
  }

  /** (· 5) СВІТНІ ТРУТОВИКИ на лицьовій грані пілона: сяйво дихає, спори злітають угору (тап — хмарка спор і спалах). */
  function drawFungi(c, t, vx0, vx1) {
    const F = PYL && PYL.dc.fungi; if (!F) return; const { P } = basis(PYL), s = 520 / (520 + P(0, 0, 0)[2]);
    const p0 = proj(P(F[0][0], -.1, F[0][1])); if (p0[0] < vx0 - 30 || p0[0] > vx1 + 30) return;
    const dt = t - TP.fungi, boost = dt >= 0 && dt < 2.6 ? Math.exp(-dt / .8) : 0, g = glow('#3be8ff');
    c.save(); c.globalCompositeOperation = 'lighter';
    F.forEach(([fu, fY, fr], k) => {
      const p = proj(P(fu, -.1, fY + fr * .15)), r = fr * 2.3 * s * (1 + boost * .9);
      c.globalAlpha = Math.min(1, .2 + .14 * Math.sin(t * 1.3 + k * 2.1) + .55 * boost); c.drawImage(g.cv, p[0] - r, p[1] - r, r * 2, r * 2);
      for (let q = 0; q < 5 + (boost > .05 ? 9 : 0); q++) {                               // спори: з-під шапки вгору, хитаючись
        const f = ((t * (.16 + .1 * hash(q, k)) + hash(k, q + 3)) % 1), y = fY + fr * .35 - f * (7 + boost * 7), x = fu + (hash(q, k + 9) - .5) * fr * 1.5 + Math.sin(f * 7 + q) * .7, pp = proj(P(x, -.4 - f * 1.6, y));
        c.globalAlpha = (1 - f) * (.75 + .25 * boost); c.fillStyle = q % 3 ? '#9af6ff' : '#e8ffff'; c.fillRect(pp[0] - .22, pp[1] - .22, .44, .44);
      }
    });
    c.restore();
  }

  // =============================== (· 5) СВІТЛО Й ПОВІТРЯ ===============================
  /** Конуси світла з точкових світильників на споді антресолі (decor.py: dc.cones — точка й низ у світі; низ — над полем зон):
   *  тепле світло згасає донизу, у ньому повільно кружляють порошинки. ПИЛ І ПИЛОК біля стін (dc.air — прямокутники екрана над
   *  зонами): ледь помітні цятки дрейфують і мерехтять. */
  const CONES = [], MOTES = [];
  (() => {
    for (const B of items) { const d = B.dc; if (!d) continue;
      if (d.cones) d.cones.forEach(([x, Y, z, Ye]) => { const a = proj([x, Y, z]), b = proj([x, Ye, z]), s = 520 / (520 + z); CONES.push({ x: a[0], y0: a[1], y1: b[1], w0: .8 * s, w1: 5.6 * s, sd: CONES.length }); });
      if (d.air) d.air.forEach(([x0, x1, y0, y1]) => { const k = MOTES.length + 1, n = Math.max(1, Math.round((x1 - x0) * (y1 - y0) / 330));
        for (let q = 0; q < n; q++) MOTES.push({ x: x0 + 3 + (x1 - x0 - 6) * hash(k, q), y: y0 + 3 + (y1 - y0 - 6) * hash(q, k + 7), sd: k * 31 + q }); }); }
  })();
  const moteAt = (m, t) => [m.x + Math.sin(t * (.11 + .07 * hash(m.sd, 1)) + m.sd) * 2.6, m.y + Math.sin(t * (.09 + .05 * hash(m.sd, 2)) + m.sd * 1.7) * 2.2];
  function drawAir(c, t, vx0, vx1) {
    c.save(); c.globalCompositeOperation = 'lighter';
    for (const C of CONES) { if (C.x < vx0 - 12 || C.x > vx1 + 12) continue; const fl = .85 + .15 * Math.sin(t * .7 + C.sd * 1.7);
      const g = c.createLinearGradient(0, C.y0, 0, C.y1); g.addColorStop(0, `rgba(255,228,175,${.34 * fl})`); g.addColorStop(.45, `rgba(255,214,150,${.13 * fl})`); g.addColorStop(1, 'rgba(255,200,140,0)');
      c.globalAlpha = 1; c.fillStyle = g; c.beginPath(); c.moveTo(C.x - C.w0, C.y0); c.lineTo(C.x + C.w0, C.y0); c.lineTo(C.x + C.w1, C.y1); c.lineTo(C.x - C.w1, C.y1); c.closePath(); c.fill();
      const gs = glow('#ffe2a8'); c.globalAlpha = .5 * fl; c.drawImage(gs.cv, C.x - 2.4, C.y0 - 1.4, 4.8, 2.8);                    // сам світильник
      for (let q = 0; q < 6; q++) { const f = (t * (.04 + .03 * hash(q, C.sd)) + hash(C.sd, q)) % 1, y = C.y0 + (C.y1 - C.y0) * f, hw = C.w0 + (C.w1 - C.w0) * f, x = C.x + Math.sin(t * .4 + q * 2.3) * hw * .7;
        c.globalAlpha = Math.sin(f * Math.PI) * .85; c.fillStyle = '#fff2d0'; c.fillRect(x - .2, y - .2, .4, .4); } }
    for (const m of MOTES) { const [x, y] = moteAt(m, t); if (x < vx0 || x > vx1) continue;
      const b = .5 + .5 * Math.sin(t * (.8 + hash(m.sd, 3)) + m.sd); c.globalAlpha = .14 + .4 * b * b; c.fillStyle = hash(m.sd, 4) > .5 ? '#fff4d8' : '#d8fff0'; c.fillRect(x - .22, y - .22, .44, .44); }
    c.restore();
  }

  // =============================== (· 5) РАВЛИК НА МОХОВОМУ КОРЧІ ===============================
  const DRS = items.filter(B => B.st === 'dc_drift').sort((a, b) => a.dc.i - b.dc.i);
  /** Точка корча на довжині s (від лівого кінця): сегмент і NX.arc.driftAt (objects/dc_paint.js). */
  const driftPt = (s, ins, dy) => { for (const B of DRS) { const M = B.dc; NX.arc.driftAt(M, M.s0); if (s <= M.s0 + M.len + 1e-6 || B === DRS[DRS.length - 1]) return NX.arc.driftAt(M, s, ins, dy); } return null; };
  const SNAIL = [0, 1, 2].map(f => sprite(14, 10, S => {                              // кадри: витягнувся, підтягнувся, сховався в мушлю
    if (f < 2) { const L = f ? 9 : 11.5; S.ell(1.5 + L / 2, 8.3, L / 2, 1.5, (x, y, u, v) => v < -.2 ? '#cfc4b0' : '#a89a84');   // тіло
      const hx = 1.5 + L; S.line(hx - 1, 7.5, hx + .5, f ? 3.5 : 2.5, '#b8ab94'); S.line(hx - 2.2, 7.5, hx - 1.6, f ? 4 : 3.2, '#b8ab94'); S.set(hx + .5, f ? 3 : 2, '#1a1410'); S.set(hx - 1.6, f ? 3.5 : 2.7, '#1a1410'); }
    S.ell(5.2, 5, 4.2, 4, (x, y, u, v) => { const r = Math.hypot(u, v), a = Math.atan2(v, u); if (Math.abs(((r * 3 + a / TAU) % 1) - .5) < .14) return '#5a2c10';   // мушля: спіраль
      return u < -.2 && v < -.2 ? '#f0b870' : r > .82 ? '#8a4a1c' : '#c87a34'; });
  }));
  /** Де равлик (екран) і куди дивиться: повзе туди-сюди по верху корча (цикл 160 с); тап — ховається в мушлю на 3.5 с. */
  function snailAt(t) {
    if (!DRS.length) return null; const tot = DRS[0].dc.tot, a = 3, b = tot - 9, T = 160, k = ((t + 37) % T) / T, f = .5 - .5 * Math.cos(k * TAU), sN = a + (b - a) * f;
    const p = driftPt(sN, .55, 0); if (!p) return null; const q = proj([p.c[0], p.c[1] - p.r * .95, p.c[2]]), q2 = proj(driftPt(sN + .5, .55, 0).c), dir = (Math.sin(k * TAU) >= 0 ? 1 : -1) * (q2[0] >= q[0] ? 1 : -1);
    return { x: q[0], y: q[1], dir, s: 520 / (520 + p.c[2]) };
  }
  function drawSnail(c, t, vx0, vx1) {
    const S = snailAt(t); if (!S || S.x < vx0 - 6 || S.x > vx1 + 6) return; const hid = t - TP.snail >= 0 && t - TP.snail < 3.5;
    const fr = hid ? 2 : (Math.floor(t / 1.3) % 2), w = 3.2 * S.s, h = w * 10 / 14;
    c.save(); c.imageSmoothingEnabled = true; c.translate(S.x, S.y); if (S.dir < 0) c.scale(-1, 1); c.drawImage(SNAIL[fr].cv, -w / 2, -h * .86, w, h); c.restore();
  }

  // =============================== ФАСАД: LED-ВОГНИКИ ===============================
  const LED = []; let ledLen = 0;
  (() => {
    const seg = items.filter(B => B.st === 'dc_mz').sort((a, b) => a.dc.i - b.dc.i); if (!seg.length) return;
    const M = seg[0].dc, sg = M.sgn, C = M.C, R = M.R - M.P - .08, Y = M.top + 16.2, a0 = M.a0 + .8, a1 = M.a1, D2R = Math.PI / 180;
    const spill = items.filter(B => B.st === 'dc_spill').map(B => { const { P } = basis(B), a = proj(P(-B.w / 2, 0, B.yt)), b = proj(P(B.w / 2, 0, B.yt)); return [Math.min(a[0], b[0]) - .6, Math.max(a[0], b[0]) + .6]; });
    let prev = null;
    for (let k = 0; k <= 420; k++) { const a = a0 + (a1 - a0) * k / 420, p = proj([C[0] + sg * R * Math.sin(a * D2R), Y, C[1] + R * Math.cos(a * D2R)]);
      if (p[1] < 1 || p[0] > 1601) break; if (prev) ledLen += Math.hypot(p[0] - prev[0], p[1] - prev[1]); prev = p;
      LED.push({ x: p[0], y: p[1], s: ledLen, hid: spill.some(([x0, x1]) => p[0] > x0 && p[0] < x1) }); }
  })();
  function drawLED(c, t, vx0, vx1) {
    if (LED.length < 2) return; const g = glow('#9af6ff', 2);
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let h = 0; h < 4; h++) {
      const head = ((t * 46 + h * ledLen / 4) % (ledLen + 30));
      for (let q = 0; q < 7; q++) { const s = head - q * 1.6; if (s < 0 || s > ledLen) continue; let i = 0; while (i < LED.length - 1 && LED[i + 1].s < s) i++;
        const P = LED[i]; if (P.hid || P.x < vx0 || P.x > vx1) continue; c.globalAlpha = (1 - q / 7) * .9; c.drawImage(g.cv, P.x - 1.6, P.y - 1.6, 3.2, 3.2); }
    }
    c.restore();
  }

  // =============================== ПЛАКАТ РУДИКА ===============================
  const RUD = byId.dc_poster1, CATCV = document.createElement('canvas');
  const VIR = [0, 1].map(v => sprite(14, 14, S => {                                     // піксельний вірус: кулька з шипами й сердитими очима
    const cc = v ? ['#7a2ad8', '#b46aff', '#e0c0ff'] : ['#1a8a2a', '#3bd84a', '#b8ff9a'];
    for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; S.ell(7 + Math.cos(a) * 5.6, 7 + Math.sin(a) * 5.6, 1.1, 1.1, cc[1]); }
    S.ell(7, 7, 4.6, 4.6, (x, y, u, w) => u < -.3 && w < -.3 ? cc[2] : cc[1]); S.ell(7, 7.6, 3.4, 3.2, cc[0]);
    S.set(5, 6, '#ffffff'); S.set(9, 6, '#ffffff'); S.set(5, 7, '#ff2438'); S.set(9, 7, '#ff2438'); S.set(4, 5, '#101018'); S.set(10, 5, '#101018');
  }));
  const SLOTS = [[.16, .36], [.84, .3], [.8, .52]];
  /** Подія лазера на плакаті: сама — раз на 13 с (з 7.2 с циклу), або одразу від тапу (Декор стін · 5). -> {k — час від
   *  початку події, tgt — вірус-ціль} або null. Лазер 0..1.7 с, спалах цілі .9..1.7, «пуф» 1.3..2.2, цілі немає 1.3..4.8 (далі
   *  з'являється за 1.2 с), Рудик радіє 2.4..3.5 і нявчить 3.5..4.6. */
  function rudikEv(t) {
    const kt = t - TP.poster; if (kt >= 0 && kt < 6) return { k: kt, tgt: TP.posterTgt, tap: 1 };
    const T = 13, k = t % T; return k > 7.2 ? { k: k - 7.2, tgt: Math.floor(t / T) % 3 } : null;
  }
  function drawRudik(c, t, vx0, vx1) {
    if (!RUD || typeof drawCat !== 'function') return; const F = faceOf(RUD); if (F.S1[0] < vx0 || F.S0[0] > vx1) return;
    const fw = F.fw, fh = F.fh, ev = rudikEv(t), ek = ev ? ev.k : -1, laser = ek >= 0 && ek < 1.7, tgt = ev ? ev.tgt : -1;
    const pose = ek > 2.4 && ek < 4.6 ? (ek < 3.5 ? 'happy' : 'meow') : 'sit';
    if (ev && ek > 3.5 && TP.note !== Math.floor(t / 13) * 100 + (ev.tap ? TP.poster : 0)) {   // нявкнув — нотки злітають угору (над плакатом)
      TP.note = Math.floor(t / 13) * 100 + (ev.tap ? TP.poster : 0); const m = affOf(F), x = m[4] + m[0] * fw * .55 + m[2] * fh * .25, y = m[5] + m[1] * fw * .55 + m[3] * fh * .25;
      if (NX.fx) { NX.fx.emit('note', x, y); NX.fx.emit('note', x + 4, y - 2); }
    }
    drawCat(pose, 0, t, CATCV, null, laser ? { angry: 1, hot: 1 } : null); const EY = drawCat.eyes;
    c.save(); c.transform(...affOf(F)); c.beginPath(); c.rect(1.4, 1.4, fw - 2.8, fh - 2.8); c.clip();   // у межах рами плаката
    const ch = fh * .41, cw = ch * 32 / 24, cx0 = fw * .48 - cw / 2, cy0 = fh * .668 - ch;
    for (let v = 0; v < 3; v++) {                                                       // віруси: гойдаються; ціль спалахує, зникає, з'являється знову
      const [ux, uy] = SLOTS[v], gone = v === tgt && ek > 1.3 && ek < 4.8, flash = v === tgt && ek > .9 && ek < 1.7; if (gone) continue;
      const x = fw * ux + Math.sin(t * 1.3 + v * 2) * .8, y = fh * uy + Math.sin(t * 2.1 + v) * .9, s = Math.min(fw, fh) * .15;
      c.globalAlpha = v === tgt && ek >= 4.8 && ek < 6 ? (ek - 4.8) / 1.2 : 1; c.imageSmoothingEnabled = false; c.drawImage(VIR[v % 2].cv, x - s / 2, y - s / 2, s, s);
      if (flash) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = .9; const g = glow('#ffffff'); c.drawImage(g.cv, x - s * .7, y - s * .7, s * 1.4, s * 1.4); c.globalCompositeOperation = 'source-over'; }
    }
    c.globalAlpha = 1;
    if (ek > 1.3 && ek < 2.2) { const [ux, uy] = SLOTS[tgt], x = fw * ux, y = fh * uy, f = (ek - 1.3) / .9;               // «пуф»: іскри розлітаються
      for (let q = 0; q < 10; q++) { const a = q / 10 * TAU, r = f * fw * .16; c.globalAlpha = 1 - f; c.fillStyle = q % 2 ? '#3bff8a' : '#ffd27a'; c.fillRect(x + Math.cos(a) * r - .25, y + Math.sin(a) * r - .25, .5, .5); } c.globalAlpha = 1; }
    c.imageSmoothingEnabled = false; c.drawImage(CATCV, cx0, cy0, cw, ch);
    if (laser && EY) {                                                                 // лазерні промені з очей
      const [ux, uy] = SLOTS[tgt], tx = fw * ux, ty = fh * uy, flick = .75 + .25 * Math.sin(t * 60);
      c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
      for (const [ex, ey] of EY) { const x = cx0 + ex / 32 * cw, y = cy0 + ey / 24 * ch;
        for (const [lw, col, a] of [[1.6, '#ff2a1a', .35], [.7, '#ff6a3a', .8], [.25, '#fff0c8', 1]]) { c.globalAlpha = a * flick; c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); c.moveTo(x, y); c.lineTo(tx, ty); c.stroke(); } }
      c.globalCompositeOperation = 'source-over';
    }
    c.restore();
  }

  // =============================== ШТУЧКИ В СОТАХ, НЕОН ===============================
  const ART = items.filter(B => B.st === 'dc_art' && B.id.startsWith('dc_hxa')), HEX = items.filter(B => B.st === 'dc_hex'), NEON = byId.dc_neon, GREEN = byId.dc_green;
  function drawArt(c, t, vx0, vx1) {
    c.save(); c.globalCompositeOperation = 'lighter'; c.imageSmoothingEnabled = true;
    for (const B of HEX) {                                                              // неон соти «дихає» — кожна у свій такт
      const { P } = basis(B), p = proj(P(0, B.dep * .35, (B.yt + B.yb) / 2)); if (p[0] < vx0 - 20 || p[0] > vx1 + 20) continue;
      const k = hash(B.dc.pat || 0, 3), dt = t - (TP.hex[B.id] || -99), fl = dt >= 0 && dt < 1.6 ? Math.exp(-dt / .45) : 0;
      const a = .07 + .09 * (.5 + .5 * Math.sin(t * (.7 + k * .6) + k * 9)) + .9 * fl, r = B.w * .5 * (520 / (520 + P(0, 0, 0)[2])) * (1 + .7 * fl), g = glow(B.dc.neon || '#3be8ff');
      c.globalAlpha = Math.min(1, a); c.drawImage(g.cv, p[0] - r, p[1] - r, r * 2, r * 2);
      if (fl > .03) {                                                                    // тап: неонова кромка соти спалахує й «розходиться» кільцем
        const Ro = B.w / 2, Yc = (B.yt + B.yb) / 2, hexP = sc => Array.from({ length: 6 }, (_, q) => proj(P(Ro * sc * Math.cos(q * Math.PI / 3), -.2, Yc + Ro * sc * Math.sin(q * Math.PI / 3))));
        c.strokeStyle = B.dc.neon || '#3be8ff'; c.lineJoin = 'round';
        for (const [sc, al, lw] of [[1, fl, 1.1], [1 + dt * .9, fl * .6, .7]]) { c.globalAlpha = Math.min(1, al); c.lineWidth = lw; c.beginPath(); hexP(sc).forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.closePath(); c.stroke(); }
      }
    }
    for (const B of ART) {
      const { P } = basis(B), w = B.w, H = B.yb - B.yt, z = P(0, B.dep / 2, B.yb)[2], s = 520 / (520 + z), at = (u, v, y) => proj(P(u, v, y)), k = B.dc.kind;
      const c0 = at(0, B.dep / 2, B.yb); if (c0[0] < vx0 - 20 || c0[0] > vx1 + 20) continue;
      const tdt = t - (TP.hex[B.on] || -99), boost = tdt >= 0 && tdt < 2 ? Math.exp(-tdt / .6) : 0;                       // тап по соті: штучка «спрацьовує»
      if (boost > .02) { const o = at(0, B.dep / 2, B.yb - H * .45), r = Math.max(w, H) * .7 * s * (1 + tdt), g = glow(k === 'figure' ? '#ffd27a' : k === 'flask' || k === 'terrarium' ? '#7aff9a' : '#d8a0ff');
        c.globalAlpha = .7 * boost; c.drawImage(g.cv, o[0] - r, o[1] - r, r * 2, r * 2);
        for (let q = 0; q < 8; q++) { const aa = q / 8 * TAU + B.dc.seed, rr = tdt * 9 + 1; c.globalAlpha = boost; c.fillStyle = q % 2 ? '#ffffff' : '#ffd27a'; c.fillRect(o[0] + Math.cos(aa) * rr - .3, o[1] + Math.sin(aa) * rr * .7 - .3, .6, .6); } }
      if (k === 'orb') { const o = at(0, B.dep / 2 - .2, B.yb - 1.6 - w * .36), r = w * .38 * s;
        c.globalAlpha = .35 + .2 * Math.sin(t * 2.3); const g = glow('#c88aff', r); c.drawImage(g.cv, o[0] - r, o[1] - r, r * 2, r * 2);
        for (let q = 0; q < 3; q++) { const a = t * (1.6 + q * .4) + q * 2.1, x = o[0] + Math.cos(a) * r * .55, y = o[1] + Math.sin(a) * r * .3; c.globalAlpha = .9; c.fillStyle = q === 1 ? '#3be8ff' : '#f0d8ff'; c.fillRect(x - .3, y - .3, .6, .6); } }
      else if (k === 'flask') { const r = w * .42, yN = B.yb - H * .55, top = yN + (B.yb - yN) * .5;
        for (let q = 0; q < 5; q++) { const f = ((t * (.5 + .3 * hash(q, 2))) + hash(q, 4)) % 1, y = B.yb - .6 - f * (B.yb - .6 - top), p = at((hash(q, 6) - .5) * r * .9, B.dep / 2 - r - .1, y);
          c.globalAlpha = .8 * (1 - f); c.fillStyle = '#d8fff0'; c.fillRect(p[0] - .25, p[1] - .25, .5, .5); }
        const p = at(0, B.dep / 2 - r, B.yb - (B.yb - yN) * .25), gg = glow('#5af08a', r * s * 1.2); c.globalAlpha = .18 + .1 * Math.sin(t * 1.7); c.drawImage(gg.cv, p[0] - r * s * 1.2, p[1] - r * s * 1.2, r * s * 2.4, r * s * 2.4); }
      else if (k === 'terrarium') { const r = Math.min(w, H) * .46, o = at(0, B.dep / 2 - .2, B.yb - r);
        for (let q = 0; q < 4; q++) { const a = t * (.5 + .2 * q) + q * 1.7, x = o[0] + Math.sin(a) * r * s * .5, y = o[1] + Math.cos(a * 1.3) * r * s * .3 - r * s * .1, b = Math.max(0, Math.sin(t * 2 + q * 2));
          c.globalAlpha = b * .9; const g = glow('#d8ff6a', 1); c.drawImage(g.cv, x - 1, y - 1, 2, 2); } }
      else if (k === 'scope') { const p = at(-w * .05, B.dep * .3, B.yb - H * .38); c.globalAlpha = .45 + .4 * (.5 + .5 * Math.sin(t * 3.1)); const g = glow('#3be8ff', 2.4); c.drawImage(g.cv, p[0] - 2.4, p[1] - 2.4, 4.8, 4.8);
        if ((t % 4) < 1.2) { const f = (t % 4) / 1.2; c.globalAlpha = 1 - f; c.fillStyle = '#9af6ff'; c.fillRect(p[0] - .3, p[1] - 1 - f * 3, .6, .6); } }
      else if (k === 'figure') { const f = ((t % 6.5) / 1.1); if (f < 1) { const pb = 2.6, fh = H - pb - .6, top = at(-w * .45, B.dep / 2, B.yb - pb - .5 - fh), bot = at(w * .45, B.dep / 2, B.yb - pb - .5);
          const x = top[0] + (bot[0] - top[0]) * f; c.save(); c.beginPath(); c.rect(top[0], top[1], bot[0] - top[0], bot[1] - top[1]); c.clip();
          const g = c.createLinearGradient(x - 2, 0, x + 2, 0); g.addColorStop(0, 'rgba(255,240,180,0)'); g.addColorStop(.5, 'rgba(255,250,220,.75)'); g.addColorStop(1, 'rgba(255,240,180,0)'); c.globalAlpha = 1; c.fillStyle = g;
          c.beginPath(); c.moveTo(x - 1.5, top[1]); c.lineTo(x + 1.5, top[1]); c.lineTo(x + .2, bot[1]); c.lineTo(x - 2.8, bot[1]); c.closePath(); c.fill(); c.restore(); } }
      else if (k === 'books') { const p = at(w / 2 - 1.3, B.dep / 2, B.yb - H * .25); c.globalAlpha = .3 + .25 * Math.sin(t * 1.9); const g = glow('#c88aff', 2.6); c.drawImage(g.cv, p[0] - 2.6, p[1] - 2.6, 5.2, 5.2);
        for (let q = 0; q < 3; q++) { const f = ((t * .4) + q / 3) % 1, x = p[0] - 1 + Math.sin(q * 3 + t) * 1.2, y = p[1] - 2 - f * 5; c.globalAlpha = (1 - f) * .9; c.fillStyle = '#f0d8ff'; c.fillRect(x - .2, y - .2, .4, .4); } }
    }
    if (NEON) {                                                                         // неонова вивіска: серце б'ється (подвійний удар), неон інколи мерехтить
      const F = faceOf(NEON); if (F.S1[0] > vx0 && F.S0[0] < vx1) {
        const nd = t - TP.neon, fast = nd >= 0 && nd < 3.5, m = affOf(F), sc = Math.min(F.fw, F.fh) / 40, hx = F.fw * .82, hy = F.fh * .28, k = (fast ? t * 2.2 : t) % 1.25, beat = Math.max(0, Math.sin(Math.min(1, k / .18) * Math.PI)) + .7 * Math.max(0, Math.sin(Math.min(1, Math.max(0, k - .24) / .18) * Math.PI));
        c.save(); c.transform(...m); const g = glow('#ff4fd8', 6 * sc); c.globalAlpha = .25 + .45 * beat; c.drawImage(g.cv, hx - 6 * sc, hy - 6 * sc, 12 * sc, 12 * sc);
        const fl = t % 11, tf = nd >= 0 && nd < .45 && ((nd * 22) | 0) % 2 === 0;
        if ((fl > 4 && fl < 4.07) || (fl > 4.16 && fl < 4.21) || tf) { c.globalCompositeOperation = 'source-over'; c.globalAlpha = .6; c.fillStyle = '#04020c'; c.fillRect(0, 0, F.fw, F.fh); }
        c.restore();
      }
    }
    if (GREEN) { const { P } = basis(GREEN), p = proj(P(0, GREEN.dep / 2, GREEN.yb - (GREEN.yb - GREEN.yt) * .4)), dg = t - TP.green, tg = dg >= 0 && dg < 1.5 ? Math.exp(-dg / .5) : 0, r = GREEN.w * .45 * (1 + .5 * tg);   // міні-оранжерея: фітолампа «дихає» (тап — спалах)
      if (p[0] > vx0 - 20 && p[0] < vx1 + 20) { c.globalAlpha = Math.min(1, .12 + .1 * Math.sin(t * 1.1) + .6 * tg); const g = glow('#ff6ae0'); c.drawImage(g.cv, p[0] - r, p[1] - r, r * 2, r * 2);
        const H = GREEN.yb - GREEN.yt, yP = GREEN.yb - 3.2, eave = GREEN.yt + H * .3, hw = GREEN.w / 2, a = proj(P(-hw, 0, eave)), b = proj(P(hw, 0, yP));   // (· 5) туман і конденсат під склом
        c.save(); c.beginPath(); c.rect(Math.min(a[0], b[0]) + .4, a[1] + .3, Math.abs(b[0] - a[0]) - .8, b[1] - a[1] - .6); c.clip(); c.globalCompositeOperation = 'source-over';
        const gw = glow('#eef8ff'), ww = Math.abs(b[0] - a[0]);
        for (let q = 0; q < 4; q++) { const f = ((t * (.05 + .02 * q) + q * .27) % 1), x = Math.min(a[0], b[0]) + ww * (.1 + .8 * ((q * .37 + f) % 1)), y = b[1] - (b[1] - a[1]) * (.25 + .2 * Math.sin(t * .3 + q * 2)), rr = ww * (.22 + .08 * Math.sin(t * .5 + q));
          c.globalAlpha = .1 + .06 * Math.sin(t * .7 + q * 1.3); c.drawImage(gw.cv, x - rr, y - rr * .6, rr * 2, rr * 1.2); }
        for (let q = 0; q < 3; q++) { const f = ((t * .12 + hash(q, 5)) % 1), x = Math.min(a[0], b[0]) + ww * (.15 + .7 * hash(q, Math.floor(t * .12 + hash(q, 5)))), y = a[1] + (b[1] - a[1]) * f * f;
          c.globalAlpha = .7 * (1 - f); c.fillStyle = '#e8f8ff'; c.fillRect(x - .18, y - .3, .36, .6); }
        c.restore(); c.globalCompositeOperation = 'lighter'; } }
    const LN = byId.dc_lantern, dl = t - TP.lamp;                                       // ліхтар: тап — спалахує й мерехтить
    if (LN && dl >= 0 && dl < 1.4) { const { P } = basis(LN), p = proj(P(0, LN.dep / 2, LN.yt + (LN.yb - LN.yt) * .62)), r = 9 + 6 * Math.exp(-dl / .4);
      c.globalAlpha = Math.min(1, .9 * Math.exp(-dl / .5) * (.7 + .3 * Math.sin(dl * 40))); const g = glow('#ffd27a'); c.drawImage(g.cv, p[0] - r, p[1] - r, r * 2, r * 2); }
    c.restore();
  }

  // =============================== МЕТЕЛИКИ, ЛИСТОЧКИ, СВІТЛЯЧКИ ===============================
  const BUTTER = [0, 1].map(v => [0, 1].map(f => sprite(16, 12, S => {               // кібер-метелик: два кадри (крила розкриті / складені)
    const cc = v ? ['#3be8ff', '#9af6ff', '#1a4a8a'] : ['#ff4fd8', '#ffb0f0', '#6a1a6a'], k = f ? .45 : 1;
    for (const sd of [-1, 1]) { S.ell(8 + sd * 3.6 * k, 4.5, 3.4 * k, 3.4, (x, y, u, w) => u * u + w * w > .55 ? cc[2] : cc[0]); S.ell(8 + sd * 2.6 * k, 8.4, 2.4 * k, 2.2, cc[1]); S.set(8 + sd * 3.5 * k, 4, '#ffffff'); }
    for (let y = 3; y < 10; y++) S.set(8, y, '#101018'); S.set(7, 2, '#101018'); S.set(9, 2, '#101018');
  })));
  const ROUTES = [['dc_basket', 'dc_tr0', 'dc_hp0', 'dc_tr1', 'dc_rfp0', 'dc_hp2', 'dc_rfp1'], ['dc_kk0', 'dc_kk1', 'dc_kk2', 'dc_hangR', 'dc_hp3', 'dc_mzv1']]
    .map(r => r.map(id => byId[id]).filter(Boolean).map(B => { const { P } = basis(B), y = B.yt + (B.yb - B.yt) * (B.st === 'dc_hang' ? .32 : .2); return proj(P(0, B.dep / 2, y)); }));
  /** Де метелик v у час t (екран, од. кімнати): від рослини до рослини дугою вгору, з тремтінням. */
  function butterflyAt(v, t) {
    const R = ROUTES[v]; if (!R || R.length < 2) return null; t += (TP.fly[v] || []).reduce((a, t0) => a + (t >= t0 ? 4 * (1 - Math.exp(-(t - t0) / .7)) : 0), 0);   // тап — тікає
    const n = R.length, T = n * 3.4, u = ((t + v * 7) % T) / 3.4, i = Math.floor(u), f = u - i, a = R[i % n], b = R[(i + 1) % n], e = f * f * (3 - 2 * f);
    return { x: a[0] + (b[0] - a[0]) * e + Math.sin(t * 2.3 + v) * 2, y: a[1] + (b[1] - a[1]) * e - Math.sin(f * Math.PI) * 6 + Math.sin(t * 3.1 + v * 2) * 1.5, dir: b[0] >= a[0] ? 1 : -1 };
  }
  function drawButterflies(c, t, vx0, vx1) {
    c.save(); c.imageSmoothingEnabled = true;
    ROUTES.forEach((R, v) => { const B = butterflyAt(v, t); if (!B || B.x < vx0 - 8 || B.x > vx1 + 8) return;
      const S = BUTTER[v][Math.floor(t * 9 + v) % 2], w = 4.4, h = w * S.h / S.w; c.translate(B.x, B.y); if (B.dir < 0) c.scale(-1, 1); c.drawImage(S.cv, -w / 2, -h / 2, w, h); c.setTransform(c.__base[0], c.__base[1], c.__base[2], c.__base[3], c.__base[4], c.__base[5]); });
    c.restore();
  }
  const LEAF = sprite(6, 4, S => { S.ell(3, 2, 2.6, 1.4, (x, y, u, w) => u < 0 ? '#5ac85a' : '#2a8a3a'); S.set(1, 2, '#1a5a2a'); });
  const DROP = items.filter(B => ['dc_basket', 'dc_hp1', 'dc_hangR', 'dc_hp0', 'dc_hp3'].includes(B.id)).map(B => { const { P } = basis(B), a = proj(P(0, B.dep / 2, B.yt + (B.yb - B.yt) * .35)), b = proj(P(0, B.dep / 2, B.yb)); return { x: a[0], y0: a[1], y1: b[1] - 3, w: B.w * .3 }; });
  function drawLeaves(c, t, vx0, vx1) {
    c.save(); c.imageSmoothingEnabled = true;
    DROP.forEach((L, k) => { const T = 7 + k * 1.7, f = ((t + k * 2.3) % T) / 3.2; if (f > 1 || L.y1 - L.y0 < 6) return; const x = L.x + (hash(Math.floor((t + k * 2.3) / T), k) - .5) * L.w + Math.sin(f * 9) * 1.6, y = L.y0 + (L.y1 - L.y0) * f;
      if (x < vx0 || x > vx1) return; c.globalAlpha = f < .8 ? 1 : (1 - f) * 5; c.translate(x, y); c.rotate(Math.sin(f * 9) * .7); c.drawImage(LEAF.cv, -1, -.7, 2, 1.4); c.setTransform(c.__base[0], c.__base[1], c.__base[2], c.__base[3], c.__base[4], c.__base[5]); });
    c.restore();
  }
  const FLY2 = items.filter(B => ['dc_kk1', 'dc_hangR', 'dc_hp3', 'dc_mzv0', 'dc_green'].includes(B.id)).map((B, k) => { const { P } = basis(B), a = proj(P(0, B.dep / 2, (B.yt + B.yb) / 2)); return { x: a[0], y: a[1], ax: B.w * .5, ay: (B.yb - B.yt) * .25, sd: k * 13 + 5 }; });
  function drawFlies2(c, t, vx0, vx1) {
    const g = glow('#d8ff6a', 2.4); c.save(); c.globalCompositeOperation = 'lighter'; c.imageSmoothingEnabled = true;
    for (const f of FLY2) { const x = f.x + Math.sin(t * (.27 + hash(f.sd, 1) * .2) + f.sd) * f.ax, y = f.y + Math.sin(t * (.39 + hash(f.sd, 2) * .2) + f.sd * 2) * f.ay, b = Math.max(0, Math.sin(t * (1.2 + hash(f.sd, 3)) + f.sd));
      if (b < .05 || x < vx0 || x > vx1) continue; c.globalAlpha = .85 * b; c.drawImage(g.cv, x - 2.4, y - 2.4, 4.8, 4.8); c.globalAlpha = b; c.fillStyle = '#f8ffd0'; c.fillRect(x - .25, y - .25, .5, .5); }
    c.restore();
  }

  // =============================== ТАПИ (Декор стін · 5) ===============================
  /** Тап по декору (власник: «тапи по декору»): зони — першими (їхні рамки тапу не чіпаємо); далі найменше, що влучили:
   *  сота зі штучкою, дрон, метелик, плакат Рудика (лазер одразу), двері пілона (відчиняються), неонова вивіска (серце
   *  частіше, неон блимає), рослина, що гойдається (потрушується, падає листочок), акваріум (риби розпливаються від пальця,
   *  бульбашки), ліхтар, міні-оранжерея. -> true, якщо тап наш. */
  const TP = { door: -99, poster: -99, posterTgt: 0, neon: -99, drone: -99, lamp: -99, green: -99, fungi: -99, snail: -99, hex: {}, fly: [[], []], aq: null, marks: [], fall: [], note: -1 };
  const boxOf = F => { const xs = [F.S0[0], F.S1[0], F.S3[0], F.S1[0] + F.S3[0] - F.S0[0]], ys = [F.S0[1], F.S1[1], F.S3[1], F.S1[1] + F.S3[1] - F.S0[1]]; return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; };
  const inB = (x, y, b, pad = 0) => x >= b[0] - pad && x <= b[2] + pad && y >= b[1] - pad && y <= b[3] + pad;
  function tap(x, y) {
    let LPhit = null;                                                                   // (· 18) яку рослину зачепили (для довідника)
    if (NX.input && NX.input.objectAt(x, y)) return false;
    const t = NX.time; let hit = null;
    for (const B of HEX) { const { P } = basis(B), c0 = proj(P(0, B.dep * .2, (B.yt + B.yb) / 2)), r = B.w * .48 * (520 / (520 + P(0, 0, 0)[2])); if (Math.hypot(x - c0[0], y - c0[1]) < r) { TP.hex[B.id] = t; hit = 'hex'; break; } }
    if (!hit && NX.decor.droneAt) { const D = NX.decor.droneAt(t); if (Math.hypot(x - D.x, y - Math.max(10, D.y)) < 7) { TP.drone = t; hit = 'drone'; } }
    if (!hit) for (let v = 0; v < ROUTES.length; v++) { const B = butterflyAt(v, t); if (B && Math.hypot(x - B.x, y - B.y) < 6) { TP.fly[v].push(t); hit = 'fly'; break; } }
    if (!hit && RUD && inB(x, y, boxOf(faceOf(RUD)))) { const e = rudikEv(t); if (!e || e.k > 4.8) { TP.poster = t; TP.posterTgt = (TP.posterTgt + 1) % 3; } hit = 'poster'; }
    if (!hit && AQ.door && inB(x, y, boxOf(faceOf(AQ.door.B)), 1.5)) { if (doorOpen(t) <= 0) TP.door = t; hit = 'door'; }
    if (!hit && NEON && inB(x, y, boxOf(faceOf(NEON)))) { TP.neon = t; hit = 'neon'; }
    for (const [id, k] of [['dc_lantern', 'lamp'], ['dc_green', 'green']]) { const B = byId[id]; if (hit || !B) continue; const { P } = basis(B), a = proj(P(-B.w / 2, B.dep / 2, B.yt)), b = proj(P(B.w / 2, B.dep / 2, B.yb)); if (inB(x, y, [Math.min(a[0], b[0]), a[1], Math.max(a[0], b[0]), b[1]], 1)) { TP[k] = t; hit = k; } }
    if (!hit && PYL && PYL.dc.fungi) { const { P } = basis(PYL); for (const [fu, fY, fr] of PYL.dc.fungi) { const p = proj(P(fu, -.1, fY)); if (Math.hypot(x - p[0], y - p[1]) < fr * 1.6 + 1.5) { TP.fungi = t; hit = 'fungi'; break; } } }
    if (!hit) { const S = snailAt(t); if (S && Math.hypot(x - S.x, y - S.y + 1) < 3.5) { TP.snail = t; hit = 'snail'; } }
    if (!hit) { let best = null, ar = 1e9; for (const L of LP) if (x >= L.x0 + 4 && x <= L.x1 - 4 && y >= L.y0 - 1 && y <= L.y1 + 1) { const a = (L.x1 - L.x0) * (L.y1 - L.y0); if (a < ar) { ar = a; best = L; } }
      if (best && best.e.sp.kind === 'flytrap') { const ph = (((t + 5 + FT.off) % 15) + 15) % 15; if (ph < 9.6) FT.off += 9.6 - ph; }   // мухоловка: муха одразу летить до пастки
      if (best) { LPhit = best; best.shake = t; for (let q = 0; q < 2 + (best.e.amp > 1.5 ? 1 : 0); q++) TP.fall.push({ x: x + (Math.random() - .5) * 6, y, y1: Math.min(best.y1 - 2, y + 22), t0: t + q * .15, s: Math.random() }); hit = 'plant'; } }
    if (!hit && MK.farm && NX.decorFarm && inB(x, y, [MK.farm.x, MK.farm.y, MK.farm.x + MK.farm.w, MK.farm.y + MK.farm.h]) && NX.decorFarm.tap(x, y, t)) hit = 'farm';   // (· 13) тап по фермі — туман, рослини трусяться
    if (!hit) for (const aq of ['reef', 'jelly']) { const M = MK[aq]; if (!M || !inB(x, y, [M.x, M.y, M.x + M.w, M.y + M.h])) continue;
      if (!M.px) M.px = M.cv.getContext('2d').getImageData(0, 0, M.cv.width, M.cv.height);
      const i = Math.floor((x - M.x) / M.w * M.cv.width), j = Math.floor((y - M.y) / M.h * M.cv.height); if (i < 0 || j < 0 || i >= M.cv.width || j >= M.cv.height || M.px.data[(j * M.cv.width + i) * 4 + 3] < 128) continue;
      TP.aq = { aq, x, y, t0: t }; hit = 'aq'; break; }
    if (!hit && NX.decorVault && NX.decorVault.tap(x, y, t)) hit = 'vault';                  // (· 20) капсула сховища — картка виду ферми
    if (!hit && NX.decorGuide && NX.decorGuide.tapStatic(x, y, t)) hit = 'guide';     // (· 18) нерухомі рослини (соти, витки, корч…) — лише картка довідника
    if (hit) { TP.marks.push({ x, y, t0: t }); if (NX.decorGuide) NX.decorGuide.tap(hit, x, y, t, hit === 'plant' ? LPhit : null); }   // (· 18) картка врятованого виду
    return !!hit;
  }
  /** Риби від тапу (кличе objects/decor.js: drawAq): зсув на екрані від пальця, що гасне, і куди дивитись. */
  function fishPush(aq, q, t) {
    const E = TP.aq; if (!E || E.aq !== aq) return null; const dt = t - E.t0; if (dt < 0 || dt > 2.6) return null;
    const dx = q[0] - E.x, dy = q[1] - E.y, d = Math.hypot(dx, dy) || 1; if (d > 34) return null;
    const k = (34 - d) / 34 * 14 * Math.sin(Math.min(1, dt / .28) * Math.PI / 2) * Math.exp(-dt / 1.1);
    return [dx / d * k, dy / d * k * .55, dx >= 0 ? 1 : -1];
  }
  /** Бульбашки від тапу (кличе decor.js усередині маски акваріума). */
  function aqFx(fx, aq, t) {
    const E = TP.aq; if (!E || E.aq !== aq) return; const dt = t - E.t0; if (dt < 0 || dt > 1.8) return;
    for (let q = 0; q < 12; q++) { const f = Math.min(1, dt / 1.8), a = hash(q, 7) * TAU, r = 2 + dt * (6 + 8 * hash(q, 9)), x = E.x + Math.cos(a) * r * .6, y = E.y - dt * (14 + 10 * hash(q, 3)) + Math.sin(a) * r * .3, s = .35 + .4 * hash(q, 5);
      fx.globalAlpha = .85 * (1 - f); fx.fillStyle = '#d8f8ff'; fx.beginPath(); fx.arc(x, y, s, 0, TAU); fx.fill(); fx.globalAlpha = 1 - f; fx.fillStyle = '#ffffff'; fx.fillRect(x - s * .4, y - s * .4, s * .35, s * .35); }
    fx.globalAlpha = 1;
  }
  /** Дрон від тапу: робить «бочку» (кут повороту). */
  const droneSpin = t => { const dt = t - TP.drone; return dt >= 0 && dt < .8 ? (dt / .8) * TAU * (dt < .4 ? 1 : 1) : 0; };
  /** Позначка тапу (іскорки кільцем) і листочки від потрушеної рослини. */
  function drawTapFx(c, t) {
    TP.marks = TP.marks.filter(m => t - m.t0 < .5); TP.fall = TP.fall.filter(f => t - f.t0 < 2.2);
    if (!TP.marks.length && !TP.fall.length) return;
    c.save(); c.imageSmoothingEnabled = true;
    for (const f of TP.fall) { const dt = t - f.t0; if (dt < 0) continue; const k = Math.min(1, dt / 2.2), y = f.y + (f.y1 - f.y) * k, x = f.x + Math.sin(dt * 5 + f.s * 6) * 1.6;
      c.globalAlpha = k < .8 ? 1 : (1 - k) * 5; c.translate(x, y); c.rotate(Math.sin(dt * 5 + f.s * 6) * .7); c.drawImage(LEAF.cv, -1, -.7, 2, 1.4); c.setTransform(c.__base[0], c.__base[1], c.__base[2], c.__base[3], c.__base[4], c.__base[5]); }
    c.globalCompositeOperation = 'lighter';
    for (const m of TP.marks) { const k = (t - m.t0) / .5; for (let q = 0; q < 8; q++) { const a = q / 8 * TAU, r = 1.5 + k * 5; c.globalAlpha = 1 - k; c.fillStyle = q % 2 ? '#9af6ff' : '#ffffff'; c.fillRect(m.x + Math.cos(a) * r - .3, m.y + Math.sin(a) * r - .3, .6, .6); } }
    c.restore();
  }

  // =============================== (Декор стін · 6) ДОГЛЯД: NEXI ПОЛИВАЄ РОСЛИНИ НА СТІНАХ ===============================
  /** Куди Nexi летить з лійкою (actors/nexi/activities.js garden): предмет, що саме полити (foliage — листя збоку, top — верх
   *  корита, pot — верх вазона, ball — верх кокедами), і з якого боку він (dir: +1 — ліворуч від рослини, лійкою вправо). */
  const CARE = { left: [['dc_basket', 'foliage', 1], ['dc_tr1', 'top', -1], ['dc_tr0', 'top', -1], ['dc_drp0', 'pot', -1]],
    right: [['dc_hangR', 'pot', -1], ['dc_kk2', 'ball', 1], ['dc_kk0', 'ball', 1]] };
  /** Точка поливу (екран) і глибина z предмета. */
  function careTarget(B, kind) {
    const { P } = basis(B), d = B.dc || {}, ph = (d.pot && d.pot.ph) || 4, T = B.yb - B.yt, v = B.dep / 2;
    let u = 0, Y = B.yt;
    if (kind === 'foliage') { u = -B.w * .3; Y = B.yt + T * .28 + 20; }
    else if (kind === 'top') Y = B.yt + .3;
    else if (kind === 'pot') Y = d.frm === 'hook' ? B.yt + Math.min(16, T * .3) - ph - .4 : B.yb - ph - .4;
    else if (kind === 'ball') Y = B.yb - ph - .4;
    const W = P(u, v, Y), p = proj(W); return { x: p[0], y: p[1], z: W[2] };
  }
  const WFX = [];
  const care = {
    /** Місця поливу на стіні side ('left' | 'right'): [{id, x, y — куди лити (екран), z — глибина, dir}]. */
    spots(side) { return (CARE[side] || []).map(([id, kind, dir]) => { const B = byId[id]; return B ? Object.assign(careTarget(B, kind), { id, dir }) : null; }).filter(Boolean); },
    /** Полили: рослина потрушується (якщо жива), свіже сяйво, іскорки вгору, краплі стікають униз (над зонами — недалеко). */
    water(id, t = NX.time) {
      const B = byId[id]; if (!B) return; const L = LP.find(q => q.key === id); if (L) L.shake = t;
      const { P } = basis(B), a = proj(P(-B.w / 2, B.dep / 2, B.yt)), b = proj(P(B.w / 2, B.dep / 2, B.yb));
      WFX.push({ t0: t, x0: Math.min(a[0], b[0]), x1: Math.max(a[0], b[0]), y0: a[1], y1: b[1] });
    },
  };
  function drawCare(c, t) {
    for (let i = WFX.length - 1; i >= 0; i--) if (t - WFX[i].t0 > 3) WFX.splice(i, 1);
    if (!WFX.length) return; c.save(); c.globalCompositeOperation = 'lighter';
    for (const F of WFX) { const a = t - F.t0, cx = (F.x0 + F.x1) / 2, cy = (F.y0 + F.y1) / 2, r = Math.max(F.x1 - F.x0, F.y1 - F.y0) * .6, g = glow('#7aff9a');
      c.globalAlpha = .45 * Math.sin(Math.min(1, a / 3) * Math.PI); c.drawImage(g.cv, cx - r, cy - r, r * 2, r * 2);                        // «ожила»: свіже зелене сяйво
      for (let q = 0; q < 10; q++) { const f = (a * .7 + hash(q, 3)) % 1, x = F.x0 + (F.x1 - F.x0) * hash(q, 5), y = cy - f * r * .9; c.globalAlpha = (1 - f) * Math.min(1, (3 - a) * 2); c.fillStyle = q % 2 ? '#b8ffc8' : '#9af6ff'; c.fillRect(x - .25, y - .25, .5, .5); }
      c.globalCompositeOperation = 'source-over';
      for (let q = 0; q < 6; q++) { const d0 = hash(q, 7) * 1.2, f = (a - d0) / 1.1; if (f < 0 || f > 1) continue; const x = F.x0 + (F.x1 - F.x0) * (.15 + .7 * hash(q, 9)), y = F.y1 - 2 + f * f * 7;   // краплі з листя
        c.globalAlpha = .9 * (1 - f); c.fillStyle = '#8ad8ff'; c.fillRect(x - .2, y - .4, .4, .8); c.fillStyle = '#ffffff'; c.fillRect(x - .1, y - .4, .2, .2); }
      c.globalCompositeOperation = 'lighter'; }
    c.restore();
  }

  // =============================== (· 5) ВИДНІСТЬ ДЕКОРУ ===============================
  /** Власник: «щоб елементи було краще видно» (особливо на комп'ютері). Раз на збірку крила: видимі пікселі шару «біля стіни»
   *  (декор; зони попереду — віднімаються) -> накладка: декор трохи яскравіший (+10 % свого кольору) і холодний контровий
   *  відблиск на краях, звернених до світла (до середини кімнати й угору) — там, де за краєм видно стіну (біля зон — ні: інакше
   *  ореол навколо зони). Рахується шматками по кадрах, кладеться світлом у готове злиття крила (S.comp) — один раз на злиття;
   *  зони не змінюються (їхні пікселі в накладці порожні). */
  const LIFT = {};
  function liftStep(side) {
    const S = NX.arc.built && NX.arc.built[side]; if (!S || !S.layers || S.layers.length < 2 || !S.comp) return;
    const D = S.layers[1]; let J = LIFT[side];
    if (!J || J.D !== D) {
      const W = D.cv.width, H = D.cv.height, k = W / (D.x1 - D.x0), mk = () => { const cv = document.createElement('canvas'); cv.width = W; cv.height = H; return [cv, cv.getContext('2d', { willReadFrequently: true })]; };
      const [, dx] = mk(), [, zx] = mk(); dx.drawImage(D.cv, 0, 0);
      for (let n = 2; n < S.layers.length; n++) { const Z = S.layers[n]; zx.drawImage(Z.cv, (Z.x0 - D.x0) * k, (Z.y0 - D.y0) * k, (Z.x1 - Z.x0) * k, (Z.y1 - Z.y0) * k); }
      const out = dx.createImageData(W, H);
      J = LIFT[side] = { D, W, H, k, d: dx.getImageData(0, 0, W, H).data, z: zx.getImageData(0, 0, W, H).data, out, row: 0, cv: null, applied: null, dir: side === 'right' ? -1 : 1 };
      return;
    }
    if (!J.cv) {
      const { W, H, d, z, dir } = J, o = J.out.data, y1 = Math.min(H, J.row + 48), R2 = Math.max(1, Math.round(J.k * .6));
      const wall = (x, y) => x < 0 || y < 0 || x >= W || y >= H ? true : (() => { const q = (y * W + x) * 4; return d[q + 3] < 128 && z[q + 3] < 128; })();
      for (let y = J.row; y < y1; y++) for (let x = 0; x < W; x++) {
        const q = (y * W + x) * 4; if (d[q + 3] < 200 || z[q + 3] >= 128) continue;
        const r = d[q], g = d[q + 1], b = d[q + 2], m = Math.max(r, g, b); if (m < 30) continue;                       // контур і тіні — як є
        let ar = r * .1, ag = g * .1, ab = b * .1;
        if (wall(x + dir * R2, y) || wall(x, y - R2) || wall(x + dir * R2, y - R2)) { ar += 20 + r * .17; ag += 27 + g * .17; ab += 36 + b * .17; }   // контровий відблиск
        o[q] = Math.min(255, ar); o[q + 1] = Math.min(255, ag); o[q + 2] = Math.min(255, ab); o[q + 3] = 255;
      }
      J.row = y1; if (J.row < H) return;
      const cv = document.createElement('canvas'); cv.width = W; cv.height = H; cv.getContext('2d').putImageData(J.out, 0, 0); J.cv = cv; J.d = J.z = J.out = null;
    }
    if (J.applied !== S.comp) {
      const c = S.comp.getContext('2d'), Rd = S.comp.width / (S.box[2] - S.box[0]); c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'lighter'; c.imageSmoothingEnabled = true;
      c.drawImage(J.cv, (D.x0 - S.box[0]) * Rd, (D.y0 - S.box[1]) * Rd, (D.x1 - D.x0) * Rd, (D.y1 - D.y0) * Rd); c.restore(); J.applied = S.comp;
    }
  }

  // =============================== КАДР ===============================
  NX.decorLive = {
    LP, LED, TP, tap, fishPush, aqFx, droneSpin, trapAt, snailAt, care, greet, butterflyAt,
    /** Для tools/wingbox/decor_check.js: усе живе цього файлу в крайніх положеннях — на контекст у координатах кімнати
     *  (рослини — обидва крайні нахили з поривом; метелики, листочки, світлячки — точки за 2 хвилини). */
    extentTo(c) {
      buildPlants(1e9); const m0 = c.getTransform(), base = [m0.a, m0.b, m0.c, m0.d, m0.e, m0.f]; c.save(); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
      for (const L of LP) for (const q of [Math.round(L.N / 4), Math.round(L.N * 3 / 4)]) { renderPlant(L, q, 1.2); c.setTransform(...mul(base, L.M)); c.drawImage(L.cv, -L.pad, L.r0); }
      c.setTransform(m0); c.fillStyle = '#fff';
      for (let k = 0; k < 2400; k++) { const t = k * .05;
        for (const L of LP) if (L.e.sp.kind === 'flytrap' && L.meta) { const st = trapAt(L, t); if (st.fly) { const p = plantPt(L, st.fly[0], st.fly[1]); c.fillRect(p[0] - 1, p[1] - .7, 2, 1.4); } }
        if (k % 8 === 0) { const S = snailAt(t * 4); if (S) c.fillRect(S.x - 1.8 * S.s, S.y - 2.3 * S.s, 3.6 * S.s, 2.4 * S.s); }
        if (k === 0 && NX.decorAqua && NX.decorAqua.drawFeeders) NX.decorAqua.drawFeeders(c, 0, -1e9, 1e9);   // (· 6) годівнички на кришках
        if (k < 120) for (const C of CONES) { const f = k / 119, y = C.y0 + (C.y1 - C.y0) * f, hw = C.w0 + (C.w1 - C.w0) * f; c.fillRect(C.x - hw, y - .3, hw * 2, .6); }
        if (k % 4 === 0) for (const m of MOTES) { const [x, y] = moteAt(m, t * 2); c.fillRect(x - .2, y - .2, .4, .4); }
        if (PYL && PYL.dc.fungi && k < 200) { const { P } = basis(PYL); for (const [fu, fY, fr] of PYL.dc.fungi) { const f = k / 200, pp = proj(P(fu + Math.sin(f * 7) * (fr * .75 + .7), -.4 - f * 1.6, fY + fr * .35 - f * 14)); c.fillRect(pp[0] - .3, pp[1] - .3, .6, .6); } }
        for (let v = 0; v < ROUTES.length; v++) { const B = butterflyAt(v, t); if (B) c.fillRect(B.x - 2.2, B.y - 1.6, 4.4, 3.2); }
        for (const f of FLY2) { const x = f.x + Math.sin(t * (.27 + hash(f.sd, 1) * .2) + f.sd) * f.ax, y = f.y + Math.sin(t * (.39 + hash(f.sd, 2) * .2) + f.sd * 2) * f.ay; c.fillRect(x - .6, y - .6, 1.2, 1.2); }
      }
      if (NX.decorGuide) NX.decorGuide.extentTo(c);                                                              // (· 19) бирки
      c.restore(); LP.forEach(L => { L.q = -1; });
    },
    draw(c, t, Rd, vx0, vx1) {
      const P = this.prof, T = P ? (k, f) => { const a = performance.now(); f(); P[k] = (P[k] || 0) + performance.now() - a; } : (k, f) => f();   // NX.decorLive.prof = {} — заміри частин (мс)
      T('build', () => { buildPlants(); liftStep('left'); liftStep('right'); });
      const m = c.getTransform(); c.__base = [m.a, m.b, m.c, m.d, m.e, m.f];
      T('pylon', () => { maskedDraw(c, 'door', t, Rd, vx0, vx1, paintDoor); maskedDraw(c, 'pylon', t, Rd, vx0, vx1, paintGlass); drawPylonBits(c, t, vx0, vx1); drawFungi(c, t, vx0, vx1); });
      T('led', () => drawLED(c, t, vx0, vx1));
      T('art', () => drawArt(c, t, vx0, vx1));
      T('rudik', () => drawRudik(c, t, vx0, vx1));
      T('plants', () => drawPlants(c, t, vx0, vx1));
      T('tags', () => { if (NX.decorGuide) NX.decorGuide.draw(c, t, vx0, vx1); if (NX.decorVault) NX.decorVault.draw(c, t, vx0, vx1); });   // (· 20) сховище насіння: сяйво капсул, насінини                              // (· 19) бирки видів і промінь сканера
      T('snail', () => drawSnail(c, t, vx0, vx1));
      T('air', () => drawAir(c, t, vx0, vx1));
      T('care', () => { drawCare(c, t); if (NX.decorAqua && NX.decorAqua.drawFeeders) NX.decorAqua.drawFeeders(c, t, vx0, vx1); });   // (· 6) полив і годівнички
      T('fx', () => { drawLeaves(c, t, vx0, vx1); drawButterflies(c, t, vx0, vx1); drawFlies2(c, t, vx0, vx1); drawTapFx(c, t); });
    },
  };
})();
