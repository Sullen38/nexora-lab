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
  // (15.11, чат «Кімната — правки»; власник: «калапуця з контурами — зробити суцільний RGB-контур, який буде переливатися») усі неонові
  // лінії модуля беруть ОДИН градієнт-веселку на кадр (objects/decor_shroom.js rgb) — кромки фасаду, ребра вежі, нитка поруччя, цоколь
  const SH = NX.shroom; let RGBX = null;
  const rgbOf = (c, t) => { if (!RGBX) RGBX = [(VIT ? VIT.at(0, 0, VIT.M.Yb)[0] : 1378) - 3, 1604]; return SH.rgb(c, t, RGBX[0], RGBX[1]); };
  /** Лінії фасаду галереї й коміра вежі — один набір на обидва (L(y, ширина, колір, альфа) веде лінію на висоті y від верху плити). */
  const fLines = (c, t, L, h) => { const g = rgbOf(c, t);
    L(.55, 1.1, '#1a2038'); L(.2, .3, '#7a88a8'); L(2, 1.5, '#080a1a'); L(2, .85, g); L(2, .22, '#ffffff', .8); L(2.95, .5, '#161c32'); L(15.3, .6, '#161c32');
    L(16.2, 1.3, '#0a0e22'); c.lineDashOffset = -t * 2; c.setLineDash([1.3, 6.45]); L(16.2, .7, g); c.setLineDash([]); c.lineDashOffset = 0; L(17.05, .5, '#161c32');
    L(h - .5, 1.3, '#080a1a'); L(h - .5, .75, g); L(h - .5, .2, '#ffffff', .8);
    c.globalCompositeOperation = 'lighter'; L(2, 2.8, g, .2); L(h - .5, 2.6, g, .2); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; };
  const hitReset = t => { if (CONV && CONV.HT !== t) { CONV.HT = t; CONV.HIT = []; } };
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
  /** (15.11, власник: «там все живе само собою… пусти всі ресурси саме на промальовку та анімацію всього того блоку») ЖИТТЯ ВІТРИНИ-
   *  ГРИБНИЦІ — усе саме, без Nexi: спори підіймаються вгору (вночі світяться яскравіше), туман стікає з-під лампи й клубочиться,
   *  краплі конденсату сповзають склом, світні плями «дихають» — кожна у своєму такті, раз на ~3 хв — «дощ» усередині; уночі вежа
   *  світить ізсередини на галерею й стіну. Точки — на двох видимих гранях коробки (лицьова — P(u, 0, Y), бічна — sideP(ins, Y));
   *  на бічній грані — лише там, де її не закриває галерея (вище поруччя або ближче до кута, ніж її кромка). */
  const VIT = PYL && PYL.dc.vit ? (() => { const M = PYL.dc, { P } = basis(PYL), top = Math.max(M.Ytop, -2), bot = M.slab ? M.slab[0] - 1 : M.Yb - 9, sR = M.sR || 1, hw = PYL.w / 2;
    const at = (f, a, Y) => f ? proj(sideP(M.D * (1 - a), Y)) : proj(P(-sR * hw * (1 - 2 * a) * 1, 0, Y)), ok = (f, a, Y) => !f || Y < M.deck - 13 || a < .12;   // a: 0 — кут між гранями
    const R = (k, q) => hash(k * 7 + 3, q * 13 + 1);
    const S = NX.arc.vitScene, fw = M.fwv || PYL.w, y0 = M.slab ? M.slab[0] : M.Yb - 8.5, uh = (U, h) => { const f = U < 0 ? 0 : 1, a = f ? U / M.D : 1 + U / fw, Y = y0 - h; return Y > -1 && ok(f, a, Y) ? at(f, a, Y) : null; };   // (U, h) сцени → екран (null — за галереєю)
    const P3 = (x, dp, h) => proj(P(sR * x, M.fin - M.D + dp, y0 - h)), SPR = S ? S.ISL.map(I => I.r ? null : NX.arc.mushCanvas(8 + I.k, 80, 2)) : [], FAR = Array.from({ length: 8 }, (_, k) => NX.arc.mushCanvas(k, 32));   // чіткі спрайти: нові види й дальній план
    let sE = 21.5; const CONV0 = null; if (CONV0) { const xe = at(1, 1, 0)[0]; while (sE < 60 && CONV0.P(sE, 0)[0] < xe) sE += .25; }                                             // де поруччя галереї виходить за вежу
    return { M, at, ok, top, bot, R, S, uh, P3, y0, sE, SPR, FAR, SP: Array.from({ length: 46 }, (_, k) => ({ f: R(k, 1) < .28 ? 0 : 1, a: .06 + R(k, 2) * .88, ph: R(k, 3), sp: .012 + R(k, 4) * .02, sw: R(k, 5) * 6.28 })),
      GL: Array.from({ length: 9 }, (_, k) => ({ f: k % 3 ? 1 : 0, a: .12 + R(k, 6) * .76, y: R(k, 7), ph: R(k, 8) * 6.28, sp: .5 + R(k, 9) * .9, col: ['#3be8ff', '#7aff9a', '#ff6ad8', '#c77dff'][k % 4] })),
      DR: Array.from({ length: 10 }, (_, k) => ({ f: k % 3 ? 1 : 0, a: .08 + R(k, 10) * .84, ph: R(k, 11), sp: .025 + R(k, 12) * .03 })) }; })() : null;
  function vitLive(c, t, vx0, vx1) {
    const V = VIT; if (!V) return; const c0 = V.at(1, 0, V.top), c1 = V.at(1, 1, V.bot), c2 = V.at(0, 1, V.top); if (Math.max(c0[0], c1[0], c2[0]) < vx0 - 10 || Math.min(c0[0], c1[0], c2[0]) > vx1 + 10) return;
    const nt = 1 - (NX.daylight ? NX.daylight.v(t) : 1), H = V.bot - V.top, rain = (t % 190) > 176 ? Math.min(1, ((t % 190) - 176) / 2, (190 - (t % 190)) / 2) : 0;
    c.save(); c.globalCompositeOperation = 'lighter';
    c.beginPath(); c.rect(vx0 - 20, -1, vx1 - vx0 + 40, 400); c.clip();                                                                                   // не вище стелі
    if (nt > .05) for (const f of [0, 1]) { const yb = f ? V.M.deck - 13 : V.bot, a = V.at(f, 0, V.top), b = V.at(f, 1, V.top), d = V.at(f, 1, yb), e = V.at(f, 0, yb);   // бічна грань — лише над галереєю                 // нічне внутрішнє світіння граней
      c.globalAlpha = nt * (.2 + .04 * Math.sin(t * .7)); c.fillStyle = '#1fb0b4'; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.lineTo(d[0], d[1]); c.lineTo(e[0], e[1]); c.closePath(); c.fill(); }
    // (15.11, власник: «наповни світними грибами нових видів… красиву вітрину з міні-дрончиками») нові види дихають світлом — кожен
    // своїм кольором і у своєму такті (вночі яскравіше); нитками міцелію між острівцями біжать іскри; під острівцями — сяйво антиграву
    vit3d(c, t, V, nt); c.globalCompositeOperation = 'lighter';
    for (const s of V.SP) { const u = (s.ph + t * s.sp) % 1, Y = V.bot - u * H, a = s.a + Math.sin(t * .6 + s.sw) * .03; if (!V.ok(s.f, a, Y)) continue; const p = V.at(s.f, a, Y);           // спори вгору
      c.globalAlpha = Math.sin(u * Math.PI) * (.5 + .5 * nt); c.fillStyle = s.sw > 4 ? '#eaffff' : '#7af0ff'; c.fillRect(p[0] - .25, p[1] - .25, .5, .5); if (nt > .3 && s.sw > 3) { c.globalAlpha *= .35; c.fillRect(p[0] - .7, p[1] - .7, 1.4, 1.4); } }
    c.globalCompositeOperation = 'source-over';
    for (let k = 0; k < 7; k++) { const f = k % 3 ? 1 : 0, u = (V.R(k, 20) + t * (.006 + V.R(k, 21) * .006)) % 1, a = .12 + V.R(k, 22) * .7 + Math.sin(t * .23 + k) * .06, Y = V.top + 2 + u * H * .55; if (!V.ok(f, a, Y)) continue;   // туман стікає з-під лампи
      const p = V.at(f, a, Y), w = 9 + 4 * Math.sin(t * .31 + k); c.globalAlpha = .16 * Math.sin(u * Math.PI) + .0; c.fillStyle = u < .25 ? '#d8a0e8' : '#bfeaea'; c.beginPath(); c.ellipse(p[0], p[1], w, 2.2, 0, 0, 6.2832); c.fill(); }
    for (const d of V.DR) { const u = (d.ph + t * d.sp) % 1, Y = V.top + 3 + u * (H - 4), sl = u % .31 < .08 ? 0 : 1; if (!V.ok(d.f, d.a, Y)) continue; const p = V.at(d.f, d.a, Y);            // краплі конденсату сповзають
      c.globalAlpha = .75; c.fillStyle = '#eaffff'; c.fillRect(p[0] - .2, p[1], .4, .6); c.globalAlpha = .25 * sl; c.fillRect(p[0] - .12, p[1] - 2.2, .24, 2.2); }
    if (rain > 0) for (let k = 0; k < 50; k++) { const f = k % 4 ? 1 : 0, a = V.R(k, 30), Y = V.top + ((V.R(k, 31) + t * 1.4) % 1) * H; if (!V.ok(f, a, Y)) continue; const p = V.at(f, a, Y); c.globalAlpha = .5 * rain; c.fillStyle = '#bff4ff'; c.fillRect(p[0], p[1], .25, 1.6); }   // «дощ»
    // (15.11, власник: «воно так і буде там усе статичне?… як додати глибини… зробити однією цільною системою») ще життя й глибина:
    // косі промені світла від лампи росту, що повільно гойдаються; кільце сканера їде вежею вгору-вниз (обидві грані, одна висота);
    // світляки блукають між грибами; по кутовій стійці вгору біжать краплі розчину — з труби коридору у вежу (одна система)
    c.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 3; k++) { const a0 = .18 + k * .26, sw = Math.sin(t * .21 + k * 2) * .07, yb = Math.min(V.bot, V.M.deck - 13); c.globalAlpha = .07 + .03 * Math.sin(t * .5 + k);       // промені
      const p0 = V.at(1, a0, V.top), p1 = V.at(1, a0 + .1, V.top), p2 = V.at(1, Math.min(.98, a0 + .26 + sw), yb), p3 = V.at(1, Math.max(.02, a0 + .02 + sw), yb); c.fillStyle = '#ffc8f0'; c.beginPath(); c.moveTo(p0[0], p0[1]); c.lineTo(p1[0], p1[1]); c.lineTo(p2[0], p2[1]); c.lineTo(p3[0], p3[1]); c.closePath(); c.fill(); }
    for (let k = 0; k < 6; k++) { const f = k % 3 ? 1 : 0, a = .2 + .6 * (.5 + .5 * Math.sin(t * (.17 + k * .03) + k * 1.9)), Y = V.top + H * (.12 + .7 * (.5 + .5 * Math.sin(t * (.13 + k * .02) + k * 2.7))); if (!V.ok(f, a, Y)) continue;   // світляки
      const p = V.at(f, a, Y), bl = .5 + .5 * Math.sin(t * 3 + k * 4); c.globalAlpha = .35 + .5 * bl; c.drawImage(glow('#d8ff7a').cv, p[0] - 1.8, p[1] - 1.8, 3.6, 3.6); c.globalAlpha = 1; c.fillStyle = '#f4ffc8'; c.fillRect(p[0] - .25, p[1] - .25, .5, .5); }
    for (let k = 0; k < 7; k++) { const u = (k / 7 + t * .09) % 1, p = V.at(1, 0, V.M.Yb - 9 - u * (V.M.Yb - 9 - V.top)); c.globalAlpha = .9; c.fillStyle = '#eaffff'; c.fillRect(p[0] - .3, p[1] - .5, .6, 1); }      // розчин кутовою стійкою вгору
    vitGlass(c, t, V); vitTrays(c, t, V);
    c.restore();
    vitHolo(c, t, nt);
  }
  /** (15.11, власник: «зроби ефект, що воно всередині блока, а не поверх модуля накладене») ВЕЖА — СПРАВЖНІЙ ОБ'ЄМ: острівці стоять
   *  не на гранях, а всередині коробки, у точках (x — упоперек лицьової грані, dp — углиб уздовж бічної, h — над плитою), і
   *  проєктуються тим самим proj, що й уся кімната. Тому їх видно крізь ОБИДВІ грані одразу, кутова стійка й відблиски скла йдуть
   *  поверх них, дальні — тьмяніші (туман) і перекриваються ближніми. Видно й саму кімнату за склом: дві задні стінки різного тону
   *  й дальнє ребро коробки. Усе обрізано по видимому склу: лицьова грань і бічна над поруччям. */
  const V3 = [[-2, 3], [-2.4, 3.5], [-2, 3], [3, 14], [3, 14], [3, 25.5], [3, 25.5], [3, 25.5], [3.4, 36], [3.4, 36]];     // (x, dp) острівців VS.ISL: стовпчик за лицьовою гранню й два — за бічною
  const VFAR = [[-4.6, 9, 9, 2], [-5, 20, 30, 5], [-4.4, 30, 14, 7], [-2, 37.5, 44, 1], [2.5, 38, 20, 3], [-5.2, 13, 47, 6], [0, 38.5, 33, 4]];   // дальній план: x, dp, h, вид
  const VDR = [[0, 1, 2, 1], [3, 4, 7, 6, 5], [8, 9, 6]];
  function vit3d(c, t, V, nt) {
    const S = V.S, M = V.M, hw = PYL.w / 2, D = M.D, y0 = V.y0, P3 = V.P3, rail = M.deck - 13, K = 1.04;
    const poly = pts => { pts.forEach((p, k) => k ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); };
    c.save(); c.globalCompositeOperation = 'source-over'; c.beginPath();
    poly([V.at(0, 0, V.top - 4), V.at(0, 1, V.top - 4), V.at(0, 1, y0), V.at(0, 0, y0)]); { const A = V.at(1, 0, V.top - 4), B = V.at(1, 1, V.top - 4), dk = CONV ? [CONV.P(V.sE, CONV.M.top - .4), CONV.P(-.8, CONV.M.top - .4)] : [V.at(1, 1, rail), V.at(1, 0, rail)]; poly([A, B, dk[0], dk[1]]); } c.clip();   // бічна грань — до кромки плити галереї (крізь скло поруччя видно низ вежі)
    // кімната за склом: ліва задня стінка (x = −hw) темніша, дальня (dp = D) світліша, між ними — дальнє ребро
    const e0 = P3(-hw, 0, 62), e1 = P3(-hw, D, 62), e2 = P3(hw, D, 62), f0 = P3(-hw, 0, 0), f1 = P3(-hw, D, 0), f2 = P3(hw, D, 0);
    c.globalAlpha = 1; c.fillStyle = '#03101c'; c.beginPath(); poly([e0, e1, f1, f0]); c.fill(); c.fillStyle = '#082838'; c.beginPath(); poly([e1, e2, f2, f1]); c.fill();
    if (nt > .05) { c.globalAlpha = nt * .2; c.fillStyle = '#1fb0b4'; c.beginPath(); poly([e0, e1, e2, f2, f1, f0]); c.fill(); c.globalAlpha = 1; }                    // уночі кімната світиться зсередини
    for (let q = 0; q < 6; q++) { const h = 4 + q * 10, a = P3(-hw, 0, h), b = P3(-hw, D, h), d = P3(hw, D, h); c.globalAlpha = .16; c.strokeStyle = '#3aa0b0'; c.lineWidth = .3; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.lineTo(d[0], d[1]); c.stroke(); }   // шви панелей задніх стінок — видно перспективу
    c.globalAlpha = .55; c.strokeStyle = '#4ab8c8'; c.lineWidth = .45; c.beginPath(); c.moveTo(e1[0], e1[1]); c.lineTo(f1[0], f1[1]); c.stroke();
    { const g = c.createLinearGradient(0, f1[1] - 30, 0, f1[1]); g.addColorStop(0, 'rgba(30,160,170,0)'); g.addColorStop(1, 'rgba(30,160,170,.28)'); c.globalAlpha = 1; c.fillStyle = g; c.fillRect(e0[0] - 2, f1[1] - 32, 60, 34); }   // туман при підлозі
    for (const [x, dp, h, k] of VFAR) { const p = P3(x, dp, h), w = 7; c.globalAlpha = .5 + .1 * nt; c.fillStyle = '#0c3a48'; c.beginPath(); c.ellipse(p[0], p[1] + .4, 2.6, .8, 0, 0, TAU); c.fill(); c.drawImage(V.FAR[k], p[0] - w / 2, p[1] - w, w, w); }   // дальній план — у тумані
    for (let q = 0; q < 12; q++) { const x = -5 + hash(q, 61) * 10, dp = 2 + hash(q, 62) * 36, len = 3 + hash(q, 63) * 9, a = P3(x, dp, 58.5), sw = Math.sin(t * .6 + q) * .5, far = (hw - x) / 12;    // дзвіночки зі стелі
      c.globalAlpha = .85 - far * .5; c.strokeStyle = '#1a7a84'; c.lineWidth = .3; c.beginPath(); c.moveTo(a[0], a[1]); c.quadraticCurveTo(a[0], a[1] + len * .6, a[0] + sw, a[1] + len); c.stroke();
      c.fillStyle = ['#7af6ff', '#ff8ae0', '#8affa8'][q % 3]; c.beginPath(); c.moveTo(a[0] + sw, a[1] + len - .9); c.lineTo(a[0] + sw + .9, a[1] + len + .7); c.lineTo(a[0] + sw - .9, a[1] + len + .7); c.closePath(); c.fill(); }
    const bob = k => Math.sin(t * (.62 + (k % 4) * .07) + k * 1.7) * .9, pt = k => { const I = S.ISL[k], v = V3[k]; return P3(v[0], v[1], I.h + bob(k)); }, far = k => k < 3 ? V3[k][1] : hw - V3[k][0];   // (15.11) острівці плавають угору-вниз, кожен у своєму такті; нитки тягнуться за ними
    for (let q = 0; q < S.TH.length; q++) { const [ia, ib] = S.TH[q]; if (!V3[ia] || !V3[ib]) continue; const a = pt(ia), b = pt(ib), mx = (a[0] + b[0]) / 2 + Math.sin(q) * 1.5, my = Math.max(a[1], b[1]) + 3.5 + (q % 3);    // нитки міцелію провисають
      c.globalAlpha = .75; c.strokeStyle = rgbOf(c, t); c.lineWidth = .32; c.beginPath(); c.moveTo(a[0], a[1] + 1.5); c.quadraticCurveTo(mx, my, b[0], b[1] + 1.5); c.stroke();   // (15.11) нитки міцелію — у такт RGB-контуру
      c.globalCompositeOperation = 'lighter'; for (let n = 0; n < 2; n++) { const u = (t * (.11 + (q % 4) * .02) + q * .37 + n * .5) % 1, w = 1 - u, x = w * w * a[0] + 2 * w * u * mx + u * u * b[0], y = w * w * (a[1] + 1.5) + 2 * w * u * my + u * u * (b[1] + 1.5);
        c.globalAlpha = Math.sin(u * Math.PI) * .9; c.drawImage(glow(n ? '#ff9ae0' : '#a8f4ff').cv, x - 1.3, y - 1.3, 2.6, 2.6); c.fillStyle = '#ffffff'; c.fillRect(x - .25, y - .25, .5, .5); } c.globalCompositeOperation = 'source-over'; }
    const ord = S.ISL.map((_, k) => k).filter(k => V3[k]).sort((a, b) => far(b) - far(a));
    for (const k of ord) { const I = S.ISL[k], [x, y] = pt(k), fg = far(k), sc = K * (1 - fg * .018), R = I.hw * .8 * sc, br = .5 + .5 * Math.sin(t * (.7 + k * .13) + k * 2.1), yy = y;   // острівець левітує — ледь гойдається
      const is = SH.isle(8 + I.k);                                                                                                                                                             // острівець — із ґрунту свого виду
      c.globalAlpha = 1 - fg * .035; c.fillStyle = is[3]; c.beginPath(); c.moveTo(x - R, yy); c.quadraticCurveTo(x - R * .55, yy + R * .5, x - R * .1, yy + R * .78); c.lineTo(x + R * .12, yy + R * .7); c.quadraticCurveTo(x + R * .6, yy + R * .45, x + R, yy); c.closePath(); c.fill();   // скеля знизу
      c.fillStyle = is[4]; c.beginPath(); c.moveTo(x - R, yy); c.quadraticCurveTo(x - R * .55, yy + R * .5, x - R * .1, yy + R * .78); c.lineTo(x - R * .2, yy); c.closePath(); c.fill();                                                           // освітлений бік
      c.fillStyle = is[0]; c.beginPath(); c.ellipse(x, yy, R, R * .24, 0, 0, TAU); c.fill(); c.fillStyle = is[1]; c.beginPath(); c.ellipse(x, yy - .15, R * .92, R * .17, 0, 0, TAU); c.fill();                                                     // моховий верх — диск
      c.fillStyle = is[2]; for (let m = 0; m < 5; m++) c.fillRect(x + (hash(k, m + 70) - .5) * R * 1.5, yy - .25 + (hash(k, m + 80) - .5) * R * .2, .4, .3);
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = .55 + .25 * Math.sin(t * 2.3 + k); c.drawImage(glow('#3be8ff').cv, x - R * .5, yy + R * .5, R, R * .7); c.restore();                                                             // антиграв
      const cv = V.SPR[k]; for (const [du, sz, ph] of [[-R * .62, .36, 1.7], [R * .64, .28, 3.1], [0, 1, 0]]) { const w = I.s * sz * sc / .92, sw = Math.sin(t * (.7 + k * .07) + k * 1.3 + ph) * (sz < 1 ? .07 : .03);
        c.save(); c.translate(x + du, yy + .1); c.rotate(sw); c.scale(1, 1 + .012 * Math.sin(t * 1.1 + k + ph)); c.drawImage(cv, -w / 2, -w, w, w); c.restore(); }
      c.save(); c.globalCompositeOperation = 'lighter'; const r = I.s * sc * (.7 + .12 * br); c.globalAlpha = (.16 + .3 * nt) * (.55 + .45 * br); c.drawImage(glow(S.GC[I.k] || SH.SUB[8 + I.k].led).cv, x - r, yy - I.s * sc * .6 - r, r * 2, r * 2); c.restore(); }
    c.globalAlpha = 1;
    for (let d = 0; d < 3; d++) { const R = VDR[d], T = 9.5, tt = t + d * 3.7, n = Math.floor(tt / T), ph = tt / T - n, ka = R[n % R.length], kb = R[(n + 1) % R.length], A = S.ISL[ka], B = S.ISL[kb], mv = Math.min(1, ph / .37), e = mv * mv * (3 - 2 * mv), work = ph > .4 && ph < .96;   // міні-дрони
      const top = I => Math.min(55.5, I.h + I.s * K + 3), a = P3(V3[ka][0], V3[ka][1], top(A)), b = P3(V3[kb][0], V3[kb][1], top(B)), x = a[0] + (b[0] - a[0]) * e, y = a[1] + (b[1] - a[1]) * e - Math.sin(e * Math.PI) * 2 + Math.sin(t * 2.6 + d * 2) * .25;
      const spray = (n + d) % 2 === 0, colr = ['#3be8ff', '#ff6ad8', '#7aff9a'][d], drop = B.s * K * .5 + 2.2;
      if (work) { c.save(); c.globalCompositeOperation = 'lighter';
        if (spray) for (let k = 0; k < 9; k++) { const u = (t * 1.3 + k * .111) % 1; c.globalAlpha = (1 - u) * .85; c.fillStyle = '#d8faff'; c.fillRect(x + (hash(k, d + 40) - .5) * 3.2 * u - .2, y + .8 + u * drop, .4, .6); }
        else { const sw = Math.sin(t * 2.2 + d) * B.s * .26; c.globalAlpha = .26; c.fillStyle = colr; c.beginPath(); c.moveTo(x, y + .8); c.lineTo(x + sw - .8, y + drop); c.lineTo(x + sw + .8, y + drop); c.closePath(); c.fill(); c.globalAlpha = .9; c.fillRect(x + sw - .9, y + drop - .2, 1.8, .4); }
        c.restore(); }
      c.save(); c.translate(x, y); c.scale(1.15, 1.15);
      c.fillStyle = '#060c16'; c.fillRect(-1.4, -.7, 2.8, 1.5); c.fillRect(-1.95, -.7, 3.9, .5);
      c.fillStyle = '#eef4ff'; c.fillRect(-1.2, -.5, 2.4, .7); c.fillStyle = '#8a98b4'; c.fillRect(-1.2, .2, 2.4, .4); c.fillStyle = '#5a6880'; c.fillRect(-1.75, -.5, .55, .3); c.fillRect(1.2, -.5, .55, .3);
      const rw = 1.1 + .6 * Math.abs(Math.sin(t * 31 + d)); c.fillStyle = '#eaffff'; c.fillRect(-1.5 - rw / 2, -.85, rw, .25); c.fillRect(1.5 - rw / 2, -.85, rw, .25);
      c.fillStyle = colr; c.fillRect(-.5, -.35, 1, .6); c.fillStyle = '#ffffff'; c.fillRect(-.15, -.25, .3, .3); c.restore();
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = (.4 + .35 * nt) * (.7 + .3 * Math.sin(t * 5 + d)); c.drawImage(glow(colr).cv, x - 3.5, y - 2.8, 7, 5.6); c.restore(); }
    // (15.11, власник показав на знімку: «сканування виглядає неправильно з точки зору перспективи») СКАНЕР — горизонтальний зріз коробки:
    // площина на одній висоті крізь увесь об'єм (чотири ребра по чотирьох стінках, а не лінія на двох гранях); ближні ребра яскраві,
    // дальні тьмяні, сама площина ледь світиться; їде вежею вгору-вниз
    { const u = .5 - .5 * Math.cos(t * .35), h = 3 + u * 52, A = P3(-hw, 0, h), B = P3(hw, 0, h), Cq = P3(hw, D, h), Dq = P3(-hw, D, h), seg = (p, q, lw, al) => { c.lineWidth = lw; c.globalAlpha = al; c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]); c.stroke(); };
      c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = '#3be8ff'; c.globalAlpha = .09; c.beginPath(); poly([A, B, Cq, Dq]); c.fill(); c.strokeStyle = '#7af6ff'; c.lineCap = 'round';
      seg(Dq, Cq, .3, .35); seg(A, Dq, .3, .35); seg(A, B, 2.2, .14); seg(B, Cq, 2.2, .14); seg(A, B, .5, .9); seg(B, Cq, .5, .9);
      for (const p of [A, B, Cq, Dq]) { c.globalAlpha = .8; c.drawImage(glow('#a8f4ff').cv, p[0] - 1.4, p[1] - 1.4, 2.8, 2.8); } c.restore(); }
    c.restore();
  }
  /** (15.11, власник: «не подобається, як зникають останні гриби — виходять за рамки; треба, щоб у тому місці був голографічний
   *  дисплей, що пише про останній гриб, який туди потрапляє») ПРИЙМАЛЬНИЙ ПОРТ у комірі вежі: лотки з дорослими грибами заїжджають
   *  за ріг і зупиняються під портом (a = .66 лицьової грані) — гриб підіймається світлом і розчиняється, порожній лоток гасне; за
   *  рамку нічого не виходить. Ліворуч — голо-дисплей: гриб, що прибув останнім, його номер виду й лічильник прийнятих. */
  function vitTrays(c, t, V) {
    if (!CONV) return; hitReset(t); const C = CONV, L = C.n * 7.75, fw = PYL.w, D = V.M.D, Y = C.fl, uE = 5 + fw * .34, tx = NX.px.text; let last = null; c.save(); c.imageSmoothingEnabled = false;
    const TF = (f, a, y) => { const da = f ? 1 / D : 1 / fw, p = V.at(f, a, y), q = V.at(f, a + da, y), d = V.at(f, a, y + 1); c.transform(q[0] - p[0], q[1] - p[1], d[0] - p[0], d[1] - p[1], p[0], p[1]); };
    for (let k = 0; k < C.n; k++) { const raw = k * 7.75 - t * .55, wr = Math.floor(raw / L), u = L - (raw - wr * L), idx = (((k * 5 - (wr + 1) * 7) % 18) + 18) % 18, past = u - uE;
      if (past >= 0 && (!last || past < last.past)) last = { past, idx, n: -wr * C.n + (C.n - k) };
      if (u > uE + 2.2) continue; const uu = Math.min(u, uE), f = uu < 5 ? 1 : 0, a = f ? (5 - uu) / D : 1 - (uu - 5) / fw, go = Math.max(0, past) / 2.2, sz = 7.3;       // go 0…1 — гриб «злітає» в порт
      // (15.11, власник: «не подобається перехід останнього гриба в конвеєрі… краще продумати») ПРИЙОМ У ВЕЖУ, три кроки замість «танення»:
      // 1) лоток стає під порт — рядок сканера проходить грибом згори донизу; 2) гриб розбирається на спори свого кольору згори донизу,
      // спори потоком ідуть у кільце порту (у вежу); 3) порожній лоток опускається в люк стрічки — не зникає, а їде вниз
      const A0 = Math.min(1, u / 1.5), SB = SH.SUB[idx], sh = SB.h, col = SB.led, cl = v => Math.max(0, Math.min(1, v)), dis = cl((go - .3) / .5), sink = cl((go - .82) / .18), top = .12 - sh - sz, cv = C.CV[idx];
      c.save(); TF(f, a, Y);
      c.save(); if (sink > 0) { c.beginPath(); c.rect(-3.4, -4, 6.8, 5.5); c.clip(); c.translate(0, sink * 3.2); } c.globalAlpha = A0; SH.tray(c, idx, t); c.restore();
      if (dis < 1) { c.globalAlpha = A0; c.drawImage(cv, 0, cv.height * dis, cv.width, cv.height * (1 - dis), -sz / 2, top + sz * dis, sz, sz * (1 - dis)); }
      if (go < .5) { const hp = V.at(f, a, Y - sh - sz * .5); C.HIT.push([hp[0], hp[1], idx, sz * .6]); }
      if (go > 0 && go < 1) { c.globalCompositeOperation = 'lighter';
        if (go < .32) { const y = top + sz * (go / .32); c.globalAlpha = .9; c.fillStyle = col; c.fillRect(-sz / 2 - .5, y - .2, sz + 1, .4); c.fillStyle = '#ffffff'; c.fillRect(-sz / 2 - .2, y - .07, sz + .4, .14); c.globalAlpha = .18; c.fillStyle = col; c.fillRect(-sz / 2, top, sz, y - top); }   // сканер
        if (dis > 0 && dis < 1) { const y0 = top + sz * dis; c.globalAlpha = .9; c.fillStyle = '#ffffff'; c.fillRect(-sz * .4, y0 - .1, sz * .8, .2);                                                                                                   // кромка розбирання
          for (let q = 0; q < 14; q++) { const w = (t * 1.1 + q / 14) % 1, x = (hash(q, 51) - .5) * sz * .8 * (1 - w * .85), y = y0 + (-8.4 - y0) * w * w; c.globalAlpha = .95 * (1 - w * .4); c.fillStyle = q % 3 ? col : '#ffffff'; c.fillRect(x - .2, y - .2, .4, .4); } }   // спори — у порт
        c.globalCompositeOperation = 'source-over'; }
      c.restore(); }
    V.last = last;
    { c.save(); TF(0, 1 - fw * .34 / fw, Y); c.globalCompositeOperation = 'lighter'; const pu = .5 + .5 * Math.sin(t * 3);                                               // порт: кільце під стелею й стовп світла
      c.globalAlpha = .1 + .06 * pu; c.fillStyle = '#7af6ff'; c.beginPath(); c.moveTo(-1.6, -8.6); c.lineTo(1.6, -8.6); c.lineTo(3, .2); c.lineTo(-3, .2); c.closePath(); c.fill();
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.fillStyle = '#0c0c1c'; c.fillRect(-2.2, -9.2, 4.4, .9); c.fillStyle = '#3be8ff'; c.fillRect(-1.8, -8.7, 3.6, .3); c.restore(); }
    { const W = fw * .46, H = 9.6; c.save(); TF(0, .05, Y - 8.9); const fl = .9 + .08 * Math.sin(t * 9);                                                                 // голо-дисплей останнього гриба
      c.globalAlpha = .78 * fl; c.fillStyle = '#061640'; c.fillRect(0, 0, W, H); c.globalAlpha = fl; c.fillStyle = 'rgba(60,232,255,.12)'; for (let y = .5; y < H; y += 1) c.fillRect(0, y, W, .22);
      c.fillStyle = '#3be8ff'; c.fillRect(0, 0, W, .3); c.fillRect(0, H - .3, W, .3); c.fillRect(0, 0, .25, H); c.fillRect(W - .25, 0, .25, H);
      if (last) { const nw = Math.min(1, last.past / 3), s = 4.6; c.globalAlpha = fl * nw; c.drawImage(C.CV[last.idx], W / 2 - s / 2, .9 + (1 - nw) * 1.5, s, s);
        c.globalAlpha = fl; tx(c, '№' + (last.idx + 1), W / 2, 7.2, '#7aff9a', 1.5, 'center'); tx(c, '×' + (((last.n % 1000) + 1000) % 1000), W / 2, 9, '#7af6ff', 1.1, 'center'); }
      c.restore(); }
    c.restore();
  }
  /** (15.11) СКЛО ПОВЕРХ УСЬОГО: косі відблиски на обох гранях (повільно пливуть) і кутова стійка — те, що за ними, читається «всередині». */
  function vitGlass(c, t, V) {
    const M = V.M, rail = M.deck - 13, y0 = V.y0, Yb = M.Yb, fw = PYL.w, D = M.D; c.save(); c.globalCompositeOperation = 'lighter';
    if (V.sJ == null && CONV) { const xj = V.at(1, .125, M.deck)[0]; let s = -1; while (s < 12 && CONV.P2(s, 0, M.deck)[0] < xj) s += .1; V.sJ = s; }                 // де фасад галереї входить у бічну грань вежі
    for (const f of [0, 1]) { const yb = f ? rail : y0; for (const [a0, w, al] of [[.12, .16, .075], [.52, .07, .05]]) { const dr = .04 * Math.sin(t * .13 + f), sl = f ? .34 : .5;
        const p = [V.at(f, a0 + dr + sl, V.top), V.at(f, Math.min(1, a0 + dr + sl + w), V.top), V.at(f, a0 + dr + w, yb), V.at(f, a0 + dr, yb)]; c.globalAlpha = al; c.fillStyle = '#d8f4ff'; c.beginPath(); p.forEach((q, k) => k ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.closePath(); c.fill(); } }
    c.globalCompositeOperation = 'source-over'; c.lineCap = 'butt'; c.lineJoin = 'round';
    if (M.slab) { const y1 = M.slab[0], h = M.slab[1] - y1;
      // (15.11, власник обвів нестиковки на куті) смуги коміра — ОДНА ламана: лицьова грань → кут → стик із фасадом галереї (далі їх
      // веде fasciaLive з тієї самої точки), тож рожевий неон, LED і помаранчевий низ переходять із вежі в галерею без сходинки
      const L = (y, w, col, al = 1) => { const Y = y1 + y, a = V.at(0, 0, Y), b = V.at(0, 1, Y), j = CONV ? CONV.P2(V.sJ, 0, Y) : V.at(1, .125, Y); c.globalAlpha = al; c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.lineTo(j[0] + .3, j[1]); c.stroke(); };
      { const W = Y => [V.at(0, 0, Y), V.at(0, 1, Y), CONV ? CONV.P2(V.sJ, 0, Y) : V.at(1, .125, Y)], ya = y1 + 3.25, yb = y1 + 14.95, fl = y1 + 13.9, pg = (A, B) => { c.beginPath(); A.forEach((q, k) => k ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); B.slice().reverse().forEach(q => c.lineTo(q[0], q[1])); c.closePath(); c.fill(); };   // (15.11) вікно коміра — чистий фон замість лишків старого растру (блідий гриб, ряд крапок): темне скло, стрічка
        c.globalAlpha = 1; c.fillStyle = '#06202c'; pg(W(ya), W(yb)); c.fillStyle = '#0a0a18'; pg(W(fl), W(yb)); c.fillStyle = '#6a6a9c'; pg(W(fl), W(fl + .3)); }
      fLines(c, t, L, h);
      // ЦОКОЛЬ (власник: «нижня частина виглядає доволі примітивно») — технічна база вежі: панелі зі швами, ґратки вентиляції, міні-
      // екрани з живими стовпчиками, емблема в рамці, рожевий неон, рядок діодів, що блимають, хромова губа; знизу — тепле сяйво лампи
      // (15.11, чат «Кімната — правки»; власник: «нижня частина виглядає слабкою та примітивною») ЦОКОЛЬ — КОРЕНЕВА КАМЕРА ГРИБНИЦІ:
      // скляний бак під вежею — темний субстрат шарами, у ньому світна мережа міцелію (нитки гілкуються вниз, ними біжать імпульси
      // живлення до вежі), бульбашки розчину; посередині — ілюмінатор з емблемою; зверху й знизу — темний профіль з RGB-контуром
      for (const f of [0, 1]) { const len = f ? D : fw, p = V.at(f, 0, Yb - 8.5), q = V.at(f, 1 / len, Yb - 8.5), d = V.at(f, 0, Yb - 7.5), cx = len / 2, n = Math.max(3, Math.round(len / 2.4));
        c.save(); c.transform(q[0] - p[0], q[1] - p[1], d[0] - p[0], d[1] - p[1], p[0], p[1]); c.globalAlpha = 1;
        const g = c.createLinearGradient(0, 0, 0, 8.5); g.addColorStop(0, '#0a2030'); g.addColorStop(.55, '#06101c'); g.addColorStop(1, '#03060c'); c.fillStyle = g; c.fillRect(0, 0, len, 8.5);
        c.fillStyle = '#1c1208'; c.fillRect(0, 5.5, len, 2.4); c.fillStyle = '#2e1e0e'; c.fillRect(0, 5.0, len, .6); c.fillStyle = '#4a3418'; for (let x = .3, i = 0; x < len - .5; x += .9 + hash(i, f + 3) * .8, i++) c.fillRect(x, 5.0 + hash(i, f + 9) * 2.4, .4, .22);   // шари субстрату, камінці
        c.lineCap = 'round'; c.lineJoin = 'round';
        const RX = (r, u) => (r + .5) * len / n + Math.sin(u * 5 + r * 2.3 + f) * .55 + (hash(r, f + 21) - .5) * .8, RY = u => .9 + u * 6.5;
        for (const [lw, col, al] of [[.5, '#1a8aa0', .35], [.17, '#c8f8ff', .8]]) { c.strokeStyle = col; c.lineWidth = lw; c.globalAlpha = al; c.beginPath();                                    // міцелій: стовбурці й бічні нитки
          for (let r = 0; r < n; r++) { if (Math.abs(RX(r, .5) - cx) < 3.2) continue; for (let k = 0; k <= 8; k++) { const u = k / 8, x = RX(r, u), y = RY(u * (.7 + .3 * hash(r, f + 5))); k ? c.lineTo(x, y) : c.moveTo(x, y); }
            for (const [u0, sd] of [[.3, -1], [.5, 1], [.72, -1]]) { const x = RX(r, u0), y = RY(u0 * (.7 + .3 * hash(r, f + 5))); c.moveTo(x, y); c.quadraticCurveTo(x + sd * .5, y + .5, x + sd * (.7 + hash(r, u0 * 10 | 0) * .5), y + 1.3); } }
          c.stroke(); }
        c.globalCompositeOperation = 'lighter'; for (let r = 0; r < n; r++) { if (Math.abs(RX(r, .5) - cx) < 3.2) continue; const u = 1 - ((t * (.22 + hash(r, 4) * .14) + hash(r, f + 8)) % 1), x = RX(r, u), y = RY(u * (.7 + .3 * hash(r, f + 5)));   // імпульси вгору, до вежі
          c.globalAlpha = Math.sin(u * Math.PI); c.drawImage(glow(r % 2 ? '#7aff9a' : '#a8f4ff').cv, x - .9, y - .9, 1.8, 1.8); c.fillStyle = '#ffffff'; c.fillRect(x - .16, y - .16, .32, .32); }
        c.globalCompositeOperation = 'source-over'; c.fillStyle = '#bff4ff'; for (let k = 0; k < Math.round(len / 3); k++) { const u = (t * (.08 + hash(k, f + 30) * .06) + hash(k, f + 31)) % 1; c.globalAlpha = .7 * Math.sin(u * Math.PI); c.fillRect(hash(k, f + 32) * len, 4.8 - u * 3.6, .22, .22); }   // бульбашки
        { const pu = .8 + .2 * Math.sin(t * 1.6 + f * 2); c.globalAlpha = 1; c.fillStyle = '#0c1226'; c.beginPath(); c.arc(cx, 4.25, 3.2, 0, TAU); c.fill(); c.fillStyle = '#04060e'; c.beginPath(); c.arc(cx, 4.25, 2.7, 0, TAU); c.fill();                     // ілюмінатор з емблемою
          c.strokeStyle = '#5a6a94'; c.lineWidth = .22; c.beginPath(); c.arc(cx, 4.25, 3.05, 0, TAU); c.stroke(); c.fillStyle = '#8a98b8'; for (let k = 0; k < 6; k++) c.fillRect(cx + Math.cos(k * 1.047 + .5) * 2.92 - .13, 4.25 + Math.sin(k * 1.047 + .5) * 2.92 - .13, .26, .26);
          c.save(); c.translate(cx, 4.9); c.scale(.62, .62); c.fillStyle = '#3be8ff'; c.fillRect(-.7, .1, 1.4, 2.3); c.fillStyle = '#eaffff'; c.fillRect(-.3, .1, .6, 2.3);
          c.fillStyle = '#ff6ad8'; c.beginPath(); c.ellipse(0, .1, 3.1, 2.3, 0, Math.PI, TAU); c.closePath(); c.fill(); c.fillStyle = '#8a1c6a'; c.beginPath(); c.ellipse(0, -.25, 2.5, 1.65, 0, Math.PI, TAU); c.closePath(); c.fill();
          c.fillStyle = '#fff0f8'; for (const [x, y, r] of [[-1.1, -1, .42], [1, -1.3, .38], [0, -.6, .26]]) { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); }
          c.globalCompositeOperation = 'lighter'; c.globalAlpha = .35 * pu; c.drawImage(glow('#ff6ad8').cv, -4.5, -3.6, 9, 6.4); c.restore();
          c.globalAlpha = .9; c.strokeStyle = '#7af6ff'; c.lineWidth = .16; c.beginPath(); c.arc(cx, 4.25, 2.45, t * .6, t * .6 + 1.6); c.stroke(); c.beginPath(); c.arc(cx, 4.25, 2.45, t * .6 + 3.14, t * .6 + 4.74); c.stroke(); }
        c.globalAlpha = .1; c.fillStyle = '#d8f4ff'; c.beginPath(); c.moveTo(len * .12, .8); c.lineTo(len * .2, .8); c.lineTo(len * .1, 7.7); c.lineTo(len * .02, 7.7); c.closePath(); c.fill();                                                               // відблиск скла
        c.globalAlpha = 1; c.fillStyle = '#10162c'; c.fillRect(0, 0, len, .85); c.fillRect(0, 7.7, len, .8); c.fillStyle = '#3a4668'; c.fillRect(0, 0, len, .14); c.fillRect(0, 7.7, len, .12);
        for (let x = .7, i = 0; x < len - .6; x += 1.25, i++) { if (Math.abs(x - cx) < 3.3) continue; const on = hash(i + f * 40, Math.floor(t * 1.4 + hash(i, 7) * 5)) > .45; c.fillStyle = on ? ['#7aff9a', '#3be8ff', '#ffd23a'][i % 3] : '#1a1640'; c.fillRect(x, 8.02, .5, .24); }                 // діоди на нижньому профілі
        c.restore(); }
      { const gr = rgbOf(c, t), PL = (Y, w, col, al = 1) => { const a = V.at(0, 0, Y), b = V.at(0, 1, Y), e = V.at(1, 1, Y); c.globalAlpha = al; c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.lineTo(e[0], e[1]); c.stroke(); };   // RGB-контур цоколя
        PL(Yb - 8.02, .42, gr); PL(Yb - .62, .42, gr); c.globalCompositeOperation = 'lighter'; PL(Yb - 8.02, 1.6, gr, .2); PL(Yb - .62, 1.6, gr, .2); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; }
      { const a = V.at(0, .3, Yb + .6), b = V.at(1, .55, Yb + .6); c.globalCompositeOperation = 'lighter'; c.globalAlpha = .4 + .12 * Math.sin(t * 1.3); c.drawImage(glow('#ffd27a').cv, a[0], a[1] - 2.2, b[0] - a[0], 6); c.globalCompositeOperation = 'source-over'; } }
    // РЕБРА ВЕЖІ (власник: «сіра рамка там зовсім не личить») — темний профіль зі світною блакитною жилкою, по якій біжать іскри
    const edge = (p, q, ph) => { c.globalAlpha = 1; c.strokeStyle = '#141a30'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]); c.stroke(); c.strokeStyle = rgbOf(c, t); c.lineWidth = .55; c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]); c.stroke();
      c.globalCompositeOperation = 'lighter'; c.globalAlpha = .2; c.lineWidth = 2; c.stroke(); for (let n = 0; n < 2; n++) { const u = (t * .16 + ph + n * .5) % 1, x = p[0] + (q[0] - p[0]) * u, y = p[1] + (q[1] - p[1]) * u; c.globalAlpha = .9 * Math.sin(u * Math.PI); c.drawImage(glow(n ? '#ff8ae0' : '#a8f4ff').cv, x - 1.6, y - 1.6, 3.2, 3.2); } c.globalCompositeOperation = 'source-over'; };
    edge(V.at(0, 0, V.top - 4), V.at(0, 0, Yb), 0); edge(V.at(0, 1, V.top - 4), V.at(0, 1, Yb), .33); if (M.slab) edge(V.at(1, 1, M.slab[1]), V.at(1, 1, Yb), .66); edge(V.at(1, 1, V.top - 4), V.at(1, 1, M.deck - 8.6), .5);
    c.restore();
  }
  /** (15.11) ГОЛО-ДИСПЛЕЙ ГРИБНИЦІ — над проєктором біля вежі, на рівні галереї (де були двері): напівпрозора панель у площині
   *  бічної грані — заголовок, гриб, що повільно обертається, три смужки (волога, тепло, спори — «дихають»), «ВИДІВ: 8»; промені
   *  від проєктора, рядки розгортки, мерехтіння. Тексти — словники decor.shroommon (4 мови). */
  function vitHolo(c, t, nt) {
    // (15.11, власник: «голографічний комп'ютер лягає на поручні — неправильно») панель стоїть НАД поруччям і паралельно йому, на
    // двох тонких стійках від поручня: низ панелі — на 3 од. вище поручня й іде тим самим нахилом, що й галерея
    if (!CONV) return; const M = PYL.dc, W = 30, H = 26, pa = proj(sideP(M.D, M.deck)), pb = proj(sideP(0, M.deck)), xr = Math.max(pa[0], pb[0]) + 2.5, Yb = CONV.M.top - (CONV.M.rail || 12) - 3;
    let s0 = 0; while (s0 < 40 && CONV.P(s0, Yb)[0] < xr) s0 += .5; const p0 = CONV.P(s0, Yb), p1 = CONV.P(s0 + 16.5, Yb),   /* (15.11, власник: «дисплей зроби трохи менше, щоб не виходив за рамку сайту й не находив на орхідеї») було 23 */  ax = [(p1[0] - p0[0]) / W, (p1[1] - p0[1]) / W], k = Math.hypot(ax[0], ax[1]), ay = [0, k], o = [p0[0], p0[1] - H * k];
    const fl = .86 + .08 * Math.sin(t * 9) - (hash(Math.floor(t * 6), 5) > .96 ? .3 : 0), T = (kk, v) => NX.t('decor.shroommon.' + kk, v), tx = NX.px.text;
    c.save(); c.transform(ax[0], ax[1], ay[0], ay[1], o[0], o[1]); c.fillStyle = '#9aa8c8'; c.fillRect(W * .14, H, .7, 3.6); c.fillRect(W * .84, H, .7, 3.6); c.fillStyle = '#3be8ff'; c.fillRect(W * .1, H - .2, W * .82, .5); c.restore();   // стійки й планка
    c.save();
    c.globalCompositeOperation = 'source-over'; c.transform(ax[0], ax[1], ay[0], ay[1], o[0], o[1]); c.globalAlpha = fl;
    c.fillStyle = 'rgba(6,22,64,.62)'; c.fillRect(0, 0, W, H); c.fillStyle = 'rgba(60,232,255,.1)'; for (let y = .6; y < H; y += 1.3) c.fillRect(0, y, W, .3);
    const sw = (t * 6) % (H + 6) - 3; c.fillStyle = 'rgba(160,250,255,.1)'; c.fillRect(0, sw, W, 2.4);
    c.fillStyle = '#3be8ff'; c.fillRect(0, 0, W, .4); c.fillRect(0, H - .4, W, .4); c.fillRect(0, 0, .4, H); c.fillRect(W - .4, 0, .4, H);
    c.fillStyle = '#eaffff'; for (const [x, y] of [[0, 0], [W - 2.6, 0], [0, H - .8], [W - 2.6, H - .8]]) c.fillRect(x, y, 2.6, .8);
    const fit = (s, x, y, col, size, al, mw) => { c.font = size + 'px "Press Start 2P", monospace'; const w = c.measureText(s).width; tx(c, s, x, y, col, w > mw ? size * mw / w : size, al); };
    fit(T('title'), W / 2, 4.2, '#7aff9a', 2.6, 'center', W - 3);
    // (15.11) дисплей показує СПРАВЖНІЙ стан: гриб — той вид, що останнім прибув у вежу (обертається); волога росте з хвилею туману
    // в коридорі (раз на 48 с) і спадає; тепло йде за лампою росту на рейці; спори — більше вночі
    { const k = Math.cos(t * .9), cx = 7.5, cy = 15.6, L = VIT && VIT.last, cv = L && CONV && CONV.CV[L.idx]; if (cv) { c.save(); c.translate(cx, cy); c.scale(.45 + .55 * Math.abs(k), 1); c.imageSmoothingEnabled = false; c.drawImage(cv, -4.6, -9.2, 9.2, 9.2); c.restore(); }
      c.strokeStyle = '#3be8ff'; c.lineWidth = .3; c.beginPath(); c.ellipse(cx, cy + .7, 4.6, 1.1, 0, 0, 6.2832); c.stroke(); }
    { const T0 = t % 48, hum = .5 + .45 * (T0 < 10 ? T0 / 10 : Math.max(0, 1 - (T0 - 10) / 38)), tmp = .5 + .3 * (.5 + .5 * Math.sin(t * .11)), spo = Math.min(1, .3 + .55 * nt + .08 * Math.sin(t * .5));
      [[T('hum'), hum, '#3be8ff'], [T('temp'), tmp, '#ffb24a'], [T('spores'), spo, '#c77dff']].forEach(([nm, v, col], q) => { const y = 9 + q * 3.6;
        fit(nm, 15, y, '#9ad8ff', 1.8, 'left', 13.4); c.fillStyle = 'rgba(60,232,255,.18)'; c.fillRect(15, y + .5, 13.4, 1); c.fillStyle = col; c.fillRect(15, y + .5, 13.4 * v, 1); }); }
    { const L = VIT && VIT.last; if (L && SH) fit(String(NX.t('decor.guide.sp.shroom.' + SH.KINDS[L.idx])).toUpperCase(), W / 2, 20.6, '#eaffff', 1.7, 'center', W - 3); }   // (15.11) назва виду, що прибув останнім
    fit(T('kinds', { n: 18 }), W / 2, 24.2, '#7aff9a', 2.1, 'center', W - 3);
    c.restore();
  }
  /** Вентилятор у круглій ґратці (бокова грань), вогник кодового замка, вогники лицьової грані. */
  function drawPylonBits(c, t, vx0, vx1) {
    if (!PYL || !sideP) return; const M = PYL.dc; if (M.vit) return vitLive(c, t, vx0, vx1);   // (15.11) вітрина-грибниця: без вентилятора, замка й вогників — своє життя
    const [vu, vy, vr] = M.vent;
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
      c.globalAlpha = Math.min(1, .2 + .14 * Math.sin(t * 1.3 + k * 2.1) + .55 * boost + .3 * (NX.daylight ? 1 - NX.daylight.v(t) : 0)); c.drawImage(g.cv, p[0] - r, p[1] - r, r * 2, r * 2);   // (15.11) уночі світяться помітно
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
    c.save(); c.globalCompositeOperation = 'lighter'; const LK = NX.decorLight ? NX.decorLight.k(t) : 1;   // (· 23) увечері світильники й світлячки яскравіші
    for (const C of CONES) { if (C.x < vx0 - 12 || C.x > vx1 + 12) continue; const fl = (.85 + .15 * Math.sin(t * .7 + C.sd * 1.7)) * LK;
      const g = c.createLinearGradient(0, C.y0, 0, C.y1); g.addColorStop(0, `rgba(255,228,175,${.34 * fl})`); g.addColorStop(.45, `rgba(255,214,150,${.13 * fl})`); g.addColorStop(1, 'rgba(255,200,140,0)');
      c.globalAlpha = 1; c.fillStyle = g; c.beginPath(); c.moveTo(C.x - C.w0, C.y0); c.lineTo(C.x + C.w0, C.y0); c.lineTo(C.x + C.w1, C.y1); c.lineTo(C.x - C.w1, C.y1); c.closePath(); c.fill();
      const gs = glow('#ffe2a8'); c.globalAlpha = .5 * fl; c.drawImage(gs.cv, C.x - 2.4, C.y0 - 1.4, 4.8, 2.8);                    // сам світильник
      for (let q = 0; q < 6; q++) { const f = (t * (.04 + .03 * hash(q, C.sd)) + hash(C.sd, q)) % 1, y = C.y0 + (C.y1 - C.y0) * f, hw = C.w0 + (C.w1 - C.w0) * f, x = C.x + Math.sin(t * .4 + q * 2.3) * hw * .7;
        c.globalAlpha = Math.sin(f * Math.PI) * .85; c.fillStyle = '#fff2d0'; c.fillRect(x - .2, y - .2, .4, .4); } }
    for (const m of MOTES) { const [x, y] = moteAt(m, t); if (x < vx0 || x > vx1) continue;
      const b = .5 + .5 * Math.sin(t * (.8 + hash(m.sd, 3)) + m.sd); c.globalAlpha = Math.min(1, (.14 + .4 * b * b) * LK); c.fillStyle = hash(m.sd, 4) > .5 ? '#fff4d8' : '#d8fff0'; c.fillRect(x - .22, y - .22, .44, .44); }
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

  // =============================== КОНВЕЄР ГРИБНИЦІ ===============================
  // (15.11, власник: «другий поверх — це модуль по вирощуванню та утриманню грибів… як вона може жити, рухатись»; план, крок 2)
  // У скляному коридорі в тілі плити лотки повільно їдуть стрічкою до вежі; гриб на лотку росте дорогою: з дальнього кінця —
  // паросток, біля вежі — дорослий; у вежі лоток зникає, з дальнього кінця заїжджає новий (інший вид). По мідній трубі під стелею
  // біжать бульбашки розчину — теж до вежі. Геометрія — фасад антресолі (як LED-вогники вище).
  const CONV = (() => { const seg = items.filter(B => B.st === 'dc_mz').sort((a, b) => a.dc.i - b.dc.i); if (!seg.length || !NX.arc.mushCanvas) return null;
    const M = seg[0].dc, sg = M.sgn, C = M.C, R = M.R - M.P - .05, D2R = Math.PI / 180, a0 = M.a0, P = (s, Y) => { const a = a0 + s / (R * D2R); return proj([C[0] + sg * R * Math.sin(a * D2R), Y, C[1] + R * Math.cos(a * D2R)]); }, P2 = (s, d, Y) => { const a = a0 + s / (R * D2R), r = R + d; return proj([C[0] + sg * r * Math.sin(a * D2R), Y, C[1] + r * Math.cos(a * D2R)]); };   // P2 — точка в глибині коридору (d — від скла до стіни)
    let smax = 0; for (let s = 0; s < 400; s += 2) { const p = P(s, M.top + 12); if (p[1] < -6 || p[0] > 1606 || a0 + s / (R * D2R) > M.a1) break; smax = s; }
    const PO = []; seg.forEach(B => { const m = B.dc, pk = Math.round((m.sa - m.a0) / 2), sOf = a => (a - a0) * R * D2R; if (m.i % 2 === 0) PO.push({ s: sOf(m.sa), k: pk }); if (m.i === m.n - 1) PO.push({ s: sOf(m.sb), k: pk + 1 }); });   // стійки поруччя — як у растрі (dc_paint.js st:dc_mz)
    return { M, P, P2, PO, smax, n: Math.floor(smax / 7.75), fl: M.top + 12.7, pipe: M.top + 3.65, mid: M.mid != null ? M.mid : (M.tot || 93) / 2, CV: Array.from({ length: 18 }, (_, k) => NX.arc.mushCanvas(k, 48)) }; })();
  /** (15.11, власник: «якісне зображення без недомальованих пробілів, щоб усе було гарненько й чітко… додай поверх прикольний
   *  неоновий логотип там, де він був, тільки щоб гриби за нього заходили чітко») КОРИДОР — В ОБ'ЄМІ, як вежа: за склом видно задню
   *  стінку (глибина 9), дальню полицю з дрібними грибами (7), мідну трубу (4), стрічку з лотками (2.5); ребра вікон, відблиски скла
   *  й неоновий логотип — на самому склі, поверх усього: лотки проїжджають ЗА логотипом і лишаються видимими крізь нього. */
  function convBack(c, t, V, nt, vx0, vx1) {
    const M = V.M, P2 = V.P2, yT = M.top + 3.25, yB = M.top + 14.95, sB = sJ0(), band = (d, Ya, Yb) => { c.beginPath(); for (let s = sB; s <= V.smax + 4; s += 5) { const p = P2(s, d, Ya); s > sB ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); } for (let s = V.smax + 4; s >= sB; s -= 5) { const p = P2(s, d, Yb); c.lineTo(p[0], p[1]); } c.closePath(); };
    c.save(); band(0, yT, yB); c.clip(); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    c.fillStyle = '#03101c'; band(0, yT, yB); c.fill(); c.fillStyle = '#08303e'; c.beginPath(); for (let s = -16; s <= V.smax + 4; s += 5) { const p = P2(s, 9, yT); s > -16 ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); } for (let s = V.smax + 4; s >= -16; s -= 5) { const p = P2(s, 9, yB); c.lineTo(p[0], p[1]); } c.closePath(); c.fill();                                              // тло й задня стінка
    { const a = P2(0, 9, yB), g = c.createLinearGradient(0, a[1] - 9, 0, a[1] + 2); g.addColorStop(0, 'rgba(40,170,170,0)'); g.addColorStop(1, 'rgba(40,170,170,.3)'); }
    c.strokeStyle = '#2a8a98'; c.lineWidth = .3; c.globalAlpha = .35; for (let s = 2; s < V.smax + 4; s += 7.75) { const a = P2(s, 9, yT), b = P2(s, 9, yB); if (a[0] < vx0 - 4 || a[0] > vx1 + 4) continue; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); }   // шви задньої стінки
    c.globalAlpha = .8; c.strokeStyle = '#1a6a74'; c.lineWidth = .5; c.beginPath(); for (let s = -1; s <= V.smax + 4; s += 5) { const p = P2(s, 7, V.fl - 3.4); s > -1 ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); } c.stroke();   // дальня полиця
    c.imageSmoothingEnabled = false; for (let s = 1.5, k = 0; s < V.smax + 2; s += 5.3, k++) { if (hash(k, 91) < .18) continue; const p = P2(s, 7, V.fl - 3.6); if (p[0] < vx0 - 4 || p[0] > vx1 + 4) continue; const w = 3.2 + hash(k, 92) * 1.3; c.globalAlpha = .5 + .12 * nt; c.drawImage(V.CV[(k * 7 + 3) % 18], p[0] - w / 2, p[1] - w, w, w); }
    c.globalAlpha = 1; for (const [dy, col, lw] of [[.35, '#6a3a18', 1.1], [.2, '#c8803a', .6], [-.05, '#ffc890', .22]]) { c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); for (let s = -1; s <= V.smax + 4; s += 5) { const p = P2(s, 4, V.pipe + dy); s > -1 ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); } c.stroke(); }   // мідна труба
    for (let s = 7.75, k = 0; s < V.smax; s += 15.5, k++) { const p = P2(s, 2, M.top + 4.3), q = P2(s + 1, 2, M.top + 4.3), ux = q[0] - p[0], uy = q[1] - p[1]; if (p[0] < vx0 - 8 || p[0] > vx1 + 8) continue;                    // лампи росту під стелею
      c.save(); c.transform(ux, uy, 0, 1, p[0], p[1]); c.fillStyle = '#0c0c1c'; c.fillRect(-2.6, -.5, 5.2, .9); c.fillStyle = '#ff6ad8'; c.fillRect(-2.3, .1, 4.6, .4); c.fillStyle = '#fff0f8'; c.fillRect(-2.3, .1, 4.6, .14);
      c.globalCompositeOperation = 'lighter'; c.globalAlpha = .05 + .025 * Math.sin(t * .8 + k) + .05 * nt; c.fillStyle = '#ff8ae0'; c.beginPath(); c.moveTo(-2.2, .5); c.lineTo(2.2, .5); c.lineTo(4.6, 9.5); c.lineTo(-4.6, 9.5); c.closePath(); c.fill(); c.restore(); }
    c.fillStyle = '#0a0a18'; band(2.5, V.fl + 1.2, yB + 1); c.fill(); c.strokeStyle = '#6a6a9c'; c.lineWidth = .35; c.beginPath(); for (let s = -1; s <= V.smax + 4; s += 5) { const p = P2(s, 2.5, V.fl + 1.25); s > -1 ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); } c.stroke();   // стрічка
    c.fillStyle = '#3a3a64'; for (let s = (-t * .55) % 2 + 2; s < V.smax + 2; s += 2) { const p = P2(s, 2.5, V.fl + 1.9); if (p[0] < vx0 || p[0] > vx1) continue; c.fillRect(p[0] - .5, p[1] - .15, 1, .3); }                               // риски стрічки їдуть
    c.restore();
  }
  function convFront(c, t, V, nt, vx0, vx1) {
    const M = V.M, P = V.P, yT = M.top + 3.2, yB = M.top + 15, s0 = M.s0 || 0; c.save(); c.globalCompositeOperation = 'source-over';
    for (let k = Math.ceil(s0 / 15.5); k * 15.5 - s0 < V.smax + 4; k++) { const s = k * 15.5 - s0 + .25, a = P(s, yT), b = P(s, yB); if (a[0] < vx0 - 4 || a[0] > vx1 + 4 || s < sJ0() + 1) continue;       // ребра вікон
      c.globalAlpha = 1; c.strokeStyle = '#1a2038'; c.lineWidth = 1.1; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); c.strokeStyle = '#46527a'; c.lineWidth = .35; c.beginPath(); c.moveTo(a[0] - .2, a[1]); c.lineTo(b[0] - .2, b[1]); c.stroke();
      const g0 = P(s + 5.2, yT + .3), g1 = P(s + 2.2, yB - .3), g2 = P(s + 6.4, yT + .3), g3 = P(s + 3.4, yB - .3); c.globalAlpha = .1; c.fillStyle = '#d8f4ff'; c.beginPath(); c.moveTo(g0[0], g0[1]); c.lineTo(g2[0], g2[1]); c.lineTo(g3[0], g3[1]); c.lineTo(g1[0], g1[1]); c.closePath(); c.fill(); }   // відблиск скла
    // НЕОНОВИЙ ЛОГОТИП ГРИБНИЦІ на склі: кільце, гриб-контур, спори на орбіті; темна підкладка напівпрозора — лотки видно за ним
    { const sm = (Math.floor(V.mid / 15.5) + .5) * 15.5 - s0 + .25, p = P(sm, M.top + 9.1), q = P(sm + 1, M.top + 9.1), fl = .88 + .12 * Math.sin(t * 2.1) - (hash(Math.floor(t * 5), 17) > .97 ? .35 : 0);
      if (p[0] > vx0 - 10 && p[0] < vx1 + 10) { c.transform(q[0] - p[0], q[1] - p[1], 0, 1, p[0], p[1]); c.lineCap = 'round'; c.lineJoin = 'round';
        c.globalAlpha = .62; c.fillStyle = '#02060e'; c.beginPath(); c.arc(0, 0, 5.5, 0, TAU); c.fill();
        const draw = (lw, al) => { c.lineWidth = lw; c.globalAlpha = al * fl;
          c.strokeStyle = '#3be8ff'; c.beginPath(); c.arc(0, 0, 5.2, .25 + t * .2, TAU - .25 + t * .2); c.stroke();                                                   // кільце з розривом, що обертається
          c.strokeStyle = '#ff6ad8'; c.beginPath(); c.moveTo(-3.5, .2); c.bezierCurveTo(-3.5, -4.4, 3.5, -4.4, 3.5, .2); c.closePath(); c.stroke();                     // шапинка
          c.strokeStyle = '#3be8ff'; c.beginPath(); c.moveTo(-.8, .2); c.lineTo(-1, 3.3); c.lineTo(1, 3.3); c.lineTo(.8, .2); c.stroke(); };                              // ніжка
        c.globalCompositeOperation = 'lighter'; draw(1.9, .22); c.globalCompositeOperation = 'source-over'; draw(.7, 1);
        c.globalAlpha = fl; c.fillStyle = '#fff0f8'; for (const [x, y, r] of [[-1.5, -1.3, .5], [.9, -2, .45], [1.9, -.8, .36]]) { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); }
        c.fillStyle = '#8affa8'; for (let k = 0; k < 4; k++) { const a = t * .5 + k * 1.57; c.fillRect(Math.cos(a) * 4.3 - .25, Math.sin(a) * 4.3 - .25, .5, .5); } } }
    c.restore();
  }
  /** (15.11, власник: «поручні спочатку одної якості, потім іншої… зроби повністю в одному стилі… контури всі, нижню частину — усе
   *  в одній якості») ПОРУЧЧЯ Й КОНТУРИ ФАСАДУ — чітким шаром на всю довжину галереї, тією самою геометрією, що в растрі:
   *  fasciaLive — хромова кромка, рожевий неон, рамка вікон, блакитна LED-смуга, помаранчевий низ; railLive — скло з відблисками
   *  й хромовою планкою, неонова нитка, поручень, стійки з неоновими ковпачками (стоять там само, де растрові). */
  const sJ0 = () => VIT && VIT.sJ != null ? VIT.sJ : -1.2, lineS = (c, V, d, Y, s0 = sJ0(), s1 = V.smax + 6) => { c.beginPath(); for (let s = s0; s < s1 + 4; s += 4) { const p = V.P2(Math.min(s, s1), d, Y); s > s0 ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); } c.stroke(); };
  function fasciaLive(c, t, V) {
    const top = V.M.top, h = V.M.bot - top, L = (Y, w, col, al = 1) => { c.globalAlpha = al; c.strokeStyle = col; c.lineWidth = w; lineS(c, V, 0, top + Y); };
    c.save(); c.globalCompositeOperation = 'source-over'; c.lineCap = 'butt';
    fLines(c, t, L, h); c.restore();
  }
  /** (15.11, чат «Кімната — правки»; власник: «нижня частина виглядає слабкою та примітивною») НИЗ ГАЛЕРЕЇ чітким шаром:
   *  panelsLive — нижня смуга фасаду: панелі зі швами, ґратки вентиляції, діод стану на кожній;
   *  underLive — спід плити (видно знизу): темні касети з ребрами, кабель-канал, вбудовані світильники з теплим
   *  сяйвом, уздовж переднього краю — тонка RGB-нитка того самого контуру. */
  function panelsLive(c, t, V, vx0, vx1) {
    const top = V.M.top; c.save(); c.globalCompositeOperation = 'source-over';
    for (let s = Math.max(sJ0() + 1, .5), k = 0; s < V.smax + 4; s += 7.75, k++) { const p = V.P2(s, 0, top + 17.5), q = V.P2(s + 1, 0, top + 17.5); if (p[0] < vx0 - 10 || p[0] > vx1 + 10) continue;
      c.save(); c.transform(q[0] - p[0], q[1] - p[1], 0, 1, p[0], p[1]); c.globalAlpha = 1;
      c.fillStyle = '#05061a'; c.fillRect(-.14, 0, .28, 5.3); c.fillStyle = '#2a3260'; c.fillRect(.14, 0, .12, 5.3);                                                  // шов панелі
      for (let i = 0; i < 3; i++) { c.fillStyle = '#04040e'; c.fillRect(1.1, 1.1 + i * 1.05, 2.6, .5); c.fillStyle = '#3a4478'; c.fillRect(1.1, 1.6 + i * 1.05, 2.6, .12); }   // ґратки
      c.fillStyle = '#1a2048'; c.fillRect(4.6, 1.3, 2.1, 2.6); c.fillStyle = '#0a0c22'; c.fillRect(4.75, 1.45, 1.8, 2.3); c.fillStyle = '#5a6aa0'; c.fillRect(4.9, 1.7, 1.2, .16); c.fillRect(4.9, 2.2, .8, .16);   // табличка
      c.fillStyle = hash(k, Math.floor(t * .7 + k * .37)) > .3 ? (k % 3 ? '#7aff9a' : '#ffd23a') : '#14183a'; c.fillRect(5.9, 3.05, .42, .36);                                     // діод стану
      c.restore(); }
    c.restore();
  }
  function underLive(c, t, V, vx0, vx1) {
    const Y = V.M.bot + .05, D = V.M.P - .3, s0 = sJ0() + .6, s1 = V.smax + 6, path = (d0, d1) => { c.beginPath(); for (let s = s0; s <= s1; s += 5) { const p = V.P2(s, d0, Y); s > s0 ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); } for (let s = s1; s >= s0; s -= 5) { const p = V.P2(s, d1, Y); c.lineTo(p[0], p[1]); } c.closePath(); };
    const ln = (d, w, col, al = 1) => { c.globalAlpha = al; c.strokeStyle = col; c.lineWidth = w; c.beginPath(); for (let s = s0; s <= s1; s += 5) { const p = V.P2(s, d, Y); s > s0 ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); } c.stroke(); };
    c.save(); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.lineCap = 'butt';
    c.fillStyle = '#0c0e2a'; path(0, D); c.fill(); c.fillStyle = '#12163a'; path(.4, D * .45); c.fill();                                                                      // касети: ближня світліша
    for (let s = Math.max(s0 + .5, .5); s < s1; s += 7.75) { const a = V.P2(s, .6, Y), b = V.P2(s, D, Y); if (Math.max(a[0], b[0]) < vx0 - 4 || Math.min(a[0], b[0]) > vx1 + 4) continue;   // ребра
      c.globalAlpha = 1; c.strokeStyle = '#04051a'; c.lineWidth = .7; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); c.strokeStyle = '#2c3468'; c.lineWidth = .18; c.beginPath(); c.moveTo(a[0] + .45, a[1]); c.lineTo(b[0] + .45, b[1]); c.stroke(); }
    ln(D * .45, .5, '#04051a'); ln(D * .45 + .5, .16, '#2c3468');
    ln(D * .74, .9, '#05061c'); ln(D * .74 - .2, .2, '#3a4478');                                                                                                           // кабель-канал
    const LK = NX.decorLight ? NX.decorLight.k(t) : 1;
    for (let s = Math.max(s0 + 4.4, 4.4), k = 0; s < s1; s += 7.75, k++) { const p = V.P2(s, D * .24, Y), q = V.P2(s + 1.6, D * .24, Y); if (p[0] < vx0 - 6 || p[0] > vx1 + 6) continue; const w = Math.abs(q[0] - p[0]) + .5;   // світильники
      c.globalAlpha = 1; c.fillStyle = '#04051a'; c.beginPath(); c.ellipse(p[0], p[1], w * .9, .75, 0, 0, TAU); c.fill(); c.fillStyle = '#ffe2a8'; c.beginPath(); c.ellipse(p[0], p[1], w * .6, .42, 0, 0, TAU); c.fill(); c.fillStyle = '#ffffff'; c.fillRect(p[0] - w * .2, p[1] - .14, w * .4, .24);
      c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, (.32 + .06 * Math.sin(t * .9 + k)) * LK); c.drawImage(glow('#ffd27a').cv, p[0] - w * 2.4, p[1] - 1.6, w * 4.8, 5.4); c.globalCompositeOperation = 'source-over'; }
    { const g = rgbOf(c, t); ln(1.1, .34, g); c.globalCompositeOperation = 'lighter'; ln(1.1, 1.4, g, .18); }
    c.restore();
  }
  function railLive(c, t, V, vx0, vx1) {
    const M = V.M, t2 = M.top - M.rail, D = .95, L = (Y, w, col, al = 1) => { c.globalAlpha = al; c.strokeStyle = col; c.lineWidth = w; lineS(c, V, D + .25, Y); };
    c.save(); c.globalCompositeOperation = 'source-over'; c.lineCap = 'butt';
    c.globalAlpha = .07; c.fillStyle = '#9adcf0'; { const sA = sJ0(); c.beginPath(); for (let s = sA; s <= V.smax + 6; s += 4) { const p = V.P2(s, D + .25, t2 + .8); s > sA ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); } for (let s = V.smax + 6; s >= sA; s -= 4) { const p = V.P2(s, D + .25, M.top - .6); c.lineTo(p[0], p[1]); } } c.closePath(); c.fill();   // скло
    c.strokeStyle = '#cfeeff'; c.lineWidth = .3; for (let s = 6; s < V.smax + 4; s += 13) { const a = V.P2(s + 6, D + .25, t2 + 1.9), b = V.P2(s, D + .25, M.top - 1.6); if (a[0] < vx0 - 8 || a[0] > vx1 + 8) continue; c.globalAlpha = .45; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); }   // відблиски
    L(M.top - .85, .5, '#aab6d0', .9);                                                                                                                         // хромова планка внизу скла
    { const g = rgbOf(c, t); L(t2 + 1.5, .55, g); c.globalCompositeOperation = 'lighter'; L(t2 + 1.5, 1.6, g, .2); c.globalCompositeOperation = 'source-over'; }
    c.globalAlpha = 1; for (const po of V.PO) { const ps = Math.max(po.s, sJ0() + .4), a = V.P2(ps, D, t2 - .3), b = V.P2(ps, D, M.top); if (a[0] < vx0 - 4 || a[0] > vx1 + 4) continue;       // стійки
      for (const [w, col, dx] of [[1.5, '#1c2238', 0], [1.1, '#94a2c0', 0], [.3, '#f4f8ff', -.3]]) { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(a[0] + dx, a[1]); c.lineTo(b[0] + dx, b[1]); c.stroke(); } }
    L(t2, 1.8, '#1c2238'); L(t2, 1.4, '#94a2c0'); L(t2 - .35, .35, '#f4f8ff');                                                                                // поручень
    for (const po of V.PO) { const a = V.P2(Math.max(po.s, sJ0() + .4), D, t2 - 1.1); if (a[0] < vx0 - 4 || a[0] > vx1 + 4) continue; const col = po.k % 2 ? '#3be8ff' : '#ff6ad8', bl = .75 + .25 * Math.sin(t * 1.7 + po.k);
      c.globalAlpha = 1; c.fillStyle = '#1c2238'; c.fillRect(a[0] - .95, a[1] - .95, 1.9, 1.9); c.fillStyle = col; c.fillRect(a[0] - .7, a[1] - .7, 1.4, 1.4); c.fillStyle = '#ffffff'; c.fillRect(a[0] - .3, a[1] - .4, .6, .6);
      c.globalCompositeOperation = 'lighter'; c.globalAlpha = .5 * bl; c.drawImage(glow(col).cv, a[0] - 2.4, a[1] - 2.4, 4.8, 4.8); c.globalCompositeOperation = 'source-over'; }
    c.restore();
  }
  /** (15.11) Тап по грибу: кільце й хмарка спор кольору виду злітають від місця дотику (1.6 с). */
  function shroomFx(c, t) {
    const E = TP.shroom; if (!E || !SH) return; const dt = t - E.t0; if (dt < 0 || dt > 1.6) return; const f = dt / 1.6, col = SH.SUB[E.k].led;
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = (1 - f) * .8; c.drawImage(glow(col).cv, E.x - 5 - f * 4, E.y - 5 - f * 4, 10 + f * 8, 10 + f * 8);
    c.strokeStyle = col; c.lineWidth = .5; c.globalAlpha = (1 - f) * .9; c.beginPath(); c.arc(E.x, E.y, 1.5 + f * 6, 0, TAU); c.stroke();
    for (let q = 0; q < 16; q++) { const a = hash(q, 61) * TAU, r = f * (3 + hash(q, 62) * 7), x = E.x + Math.cos(a) * r + Math.sin(t * 5 + q) * .4, y = E.y + Math.sin(a) * r * .6 - f * f * 7; c.globalAlpha = (1 - f) * (.6 + .4 * hash(q, 63)); c.fillStyle = q % 3 ? col : '#ffffff'; c.fillRect(x - .25, y - .25, .5, .5); }
    c.restore();
  }
  function drawConv(c, t, vx0, vx1) {
    const V = CONV; if (!V || V.n < 2) return; const a = V.P(0, V.fl), b = V.P(V.smax, V.fl); if (Math.max(a[0], b[0]) < vx0 - 10 || Math.min(a[0], b[0]) > vx1 + 10) return;
    hitReset(t); c.save(); c.beginPath(); c.rect(vx0 - 20, 0, Math.min(vx1 + 20, 1600) - vx0 + 20, 400); c.clip(); c.imageSmoothingEnabled = false; const L = V.n * 7.75;   // не вище стелі й не за торцеву стіну
    const nt0 = 1 - (NX.daylight ? NX.daylight.v(t) : 1); convBack(c, t, V, nt0, vx0, vx1); c.imageSmoothingEnabled = false;
    for (let k = 0; k < V.n; k++) { const raw = k * 7.75 - t * .55, wr = Math.floor(raw / L), s = raw - wr * L; if (s < 1.6 || s > V.smax - 1) continue;                                    // у вежі, за краєм
      const p = V.P2(s, 2.5, V.fl); if (p[0] < vx0 - 8 || p[0] > vx1 + 8) continue; const q = V.P2(s + 1, 2.5, V.fl), d = V.P2(s, 2.5, V.fl + 1), near = 1 - s / V.smax, sz = 1.6 + near * 5.7, fade = Math.min(1, (s - 1.6) / 2, (V.smax - 1 - s) / 3);
      c.save(); c.globalAlpha = fade; c.transform(q[0] - p[0], q[1] - p[1], d[0] - p[0], d[1] - p[1], p[0], p[1]);
      const idx = (((k * 5 - wr * 7) % 18) + 18) % 18, sh = SH.tray(c, idx, t);                                                                                                    // свій лоток і ґрунт у кожного виду
      c.drawImage(V.CV[idx], -sz / 2, .12 - sh - sz, sz, sz); c.restore(); { const hp = V.P2(s, 2.5, V.fl - sh - sz * .5); V.HIT.push([hp[0], hp[1], idx, Math.max(2.4, sz * .6)]); } }
    // (15.11, крок 3) ТУМАН: раз на 48 с форсунки під стелею спрацьовують хвилею від дальнього кінця до вежі — під кожною хмарка
    // осідає на лотки; після хвилі скло коридору запотіває й за ~20 с прояснюється
    { const T0 = t % 48, wv = V.smax - T0 * 14, fog = T0 > V.smax / 14 ? Math.max(0, 1 - (T0 - V.smax / 14) / 20) : Math.min(1, T0 * 14 / V.smax) * .8;
      c.globalCompositeOperation = 'source-over'; c.imageSmoothingEnabled = true;
      if (fog > .02) { c.globalAlpha = .2 * fog; c.fillStyle = '#d8f4f4'; c.beginPath(); for (let s = 0; s <= V.smax; s += 8) { const p = V.P(s, V.pipe + .6); s ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); }
        for (let s = V.smax; s >= 0; s -= 8) { const p = V.P(s, V.fl + 1.4); c.lineTo(p[0], p[1]); } c.closePath(); c.fill(); }
      for (let s = 4; s < V.smax; s += 7.75) { const d = s - wv; if (d < 0 || d > 34) continue; const u = d / 34, p = V.P(s, V.pipe + 1 + u * 6), q = V.P(s + 1, V.pipe), w = Math.hypot(q[0] - p[0], 0) + .6; if (p[0] < vx0 - 6 || p[0] > vx1 + 6) continue;
        c.globalAlpha = .5 * Math.sin(Math.min(1, u * 1.2) * Math.PI); c.fillStyle = '#eafcff'; c.beginPath(); c.ellipse(p[0], p[1], (1.2 + u * 2.6) * w, (.8 + u * 1.2) * w, 0, 0, 6.2832); c.fill();
        if (u < .25) { const n = V.P(s, V.pipe + .5); c.globalAlpha = 1; c.fillStyle = '#3be8ff'; c.fillRect(n[0] - .3, n[1] - .3, .6, .6); } } }                                       // форсунка блимає
    // (15.11, крок 4) ТЕХНІКА В КОРИДОРІ: лампа росту їздить рейкою під стелею туди-сюди (рожевий конус світла на лотки); рука-
    // маніпулятор переїжджає від лотка до лотка, зупиняється, опускає «лапу» й сканує гриб блакитним променем. Крок 5 — НІЧ: коридор
    // світиться зсередини (бірюза), під лампою — рожева пляма.
    { const nt = 1 - (NX.daylight ? NX.daylight.v(t) : 1), TF = (s, Y) => { const p = V.P(s, Y), q = V.P(s + 1, Y), d = V.P(s, Y + 1); c.transform(q[0] - p[0], q[1] - p[1], d[0] - p[0], d[1] - p[1], p[0], p[1]); }, top = V.pipe + .7, hgt = V.fl - top;
      if (nt > .05) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = nt * .24; c.fillStyle = '#1fb0b4'; c.beginPath(); for (let s = 0; s <= V.smax; s += 8) { const p = V.P(s, top); s ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); }
        for (let s = V.smax; s >= 0; s -= 8) { const p = V.P(s, V.fl + 1.4); c.lineTo(p[0], p[1]); } c.closePath(); c.fill(); c.globalCompositeOperation = 'source-over'; }
      const sL = V.smax * (.5 + .44 * Math.sin(t * .11));                                                                                              // лампа на рейці
      c.save(); TF(sL, top); c.globalCompositeOperation = 'lighter'; c.globalAlpha = .08 + .1 * nt; c.fillStyle = '#ff8ae0'; c.beginPath(); c.moveTo(-2.6, .8); c.lineTo(2.6, .8); c.lineTo(5.2, hgt); c.lineTo(-5.2, hgt); c.closePath(); c.fill();
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.fillStyle = '#0c0c1c'; c.fillRect(-3.2, -.2, 6.4, 1.1); c.fillStyle = '#ff6ad8'; c.fillRect(-2.8, .45, 5.6, .4); c.fillStyle = '#fff0f8'; c.fillRect(-2.8, .45, 5.6, .14); c.restore();
      const ph = t * .085, n = Math.floor(ph), u = ph - n, pos = q => 7 + hash(q, 5) * (V.smax - 16), mv = Math.min(1, u / .38), e = mv * mv * (3 - 2 * mv), sA = pos(n) + (pos(n + 1) - pos(n)) * e, scan = u > .42 && u < .92, ext = scan ? Math.min(1, (u - .42) / .1, (.92 - u) / .08) : 0;   // рука
      c.save(); TF(sA, top); c.fillStyle = '#0c0c1c'; c.fillRect(-1.5, -.3, 3, 1.2); c.fillStyle = '#9a9ac4'; c.fillRect(-1.2, -.1, 2.4, .35); c.fillStyle = '#ffd23a'; c.fillRect(-.35, .2, .7, .5);                 // каретка
      const al = 1.4 + ext * 1.6; c.fillStyle = '#0c0c1c'; c.fillRect(-.45, .9, .9, al); c.fillStyle = '#c4c4ec'; c.fillRect(-.22, .9, .44, al); c.fillStyle = '#0c0c1c'; c.fillRect(-1.1, .9 + al, 2.2, .7); c.fillStyle = '#3be8ff'; c.fillRect(-.8, 1.05 + al, 1.6, .35);   // плече й головка
      if (ext > 0) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = .3 * ext; c.fillStyle = '#3be8ff'; c.beginPath(); c.moveTo(-.7, 1.5 + al); c.lineTo(.7, 1.5 + al); c.lineTo(2.6, hgt); c.lineTo(-2.6, hgt); c.closePath(); c.fill();
        const sy = 1.6 + al + (hgt - 1.6 - al) * (.5 + .5 * Math.sin(t * 7)); c.globalAlpha = .9 * ext; c.fillRect(-2.2, sy, 4.4, .2); }                                                                                    // рядок сканера
      c.restore(); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; }
    c.globalCompositeOperation = 'lighter'; c.fillStyle = '#eaffff';                                                                                                             // бульбашки в трубі
    for (let k = 0; k < 16; k++) { const s = V.smax - ((k * V.smax / 16 + t * 3.2) % V.smax); if (s < 1) continue; const p = V.P2(s, 4, V.pipe + .2); if (p[0] < vx0 || p[0] > vx1) continue; c.globalAlpha = .7; c.fillRect(p[0] - .25, p[1] - .25, .5, .5); }
    underLive(c, t, V, vx0, vx1); panelsLive(c, t, V, vx0, vx1); fasciaLive(c, t, V); convFront(c, t, V, nt0, vx0, vx1); railLive(c, t, V, vx0, vx1); shroomFx(c, t);
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
  /** (· 56) Геометрія артефакта в соті — рахується один раз: передній зовнішній / внутрішній шестикутники (fo, fi), точка на поличці
   *  посеред глибини (fl), розмір спрайта (w, h), стінки-скло, звернені до нас (glass). */
  const AG = {};
  function artGeo(B) {
    if (AG[B.id] !== undefined) return AG[B.id]; const HXB = byId[B.on], DA = NX.decorArt; if (!HXB || !DA || !DA.has(B.dc.kind)) return AG[B.id] = null;
    const { P } = basis(HXB), Ro = HXB.w / 2, Ri = Ro - 2.3 / .866, Yc = (HXB.yt + HXB.yb) / 2, dep = HXB.dep, dp = dep * .42;
    const hx = (R, v) => Array.from({ length: 6 }, (_, q) => proj(P(R * Math.cos(q * Math.PI / 3), v, Yc + R * Math.sin(q * Math.PI / 3))));
    const fo = hx(Ro, 0), fi = hx(Ri, 0), bo = hx(Ro, dep), all = fo.concat(bo);
    const inPoly = (x, y, p) => { let ins = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++) if ((p[i][1] > y) !== (p[j][1] > y) && x < (p[j][0] - p[i][0]) * (y - p[i][1]) / (p[j][1] - p[i][1]) + p[i][0]) ins = !ins; return ins; };
    const fl = proj(P(0, dp, Yc + Ri * .866 - .1)), tp = proj(P(0, dp, Yc - Ri * .866)), wl = proj(P(-Ri, dp, Yc)), wr = proj(P(Ri, dp, Yc));
    const h = Math.min((fl[1] - tp[1]) * .9, Math.abs(wr[0] - wl[0]) * .8 * DA.H / DA.W), L = (a, b, f) => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f], glass = [];
    for (let k = 0; k < 6; k++) { const k1 = (k + 1) % 6, q = [fo[k], fo[k1], bo[k1], bo[k]];
      if (inPoly((q[0][0] + q[1][0] + q[2][0] + q[3][0]) / 4, (q[0][1] + q[1][1] + q[2][1] + q[3][1]) / 4, fo)) continue;          // ця стінка — за артефактом (видно крізь вікно)
      glass.push({ q, sh: [L(fo[k], fo[k1], .2), L(fo[k], fo[k1], .34), L(bo[k], bo[k1], .62), L(bo[k], bo[k1], .48)] }); }
    const fx0 = Math.min(...fi.map(q => q[0])), fx1 = Math.max(...fi.map(q => q[0])), fy0 = Math.min(...fi.map(q => q[1])), fy1 = Math.max(...fi.map(q => q[1]));
    return AG[B.id] = { fo, fi, fl, h, w: h * DA.W / DA.H, glass, bb: [Math.min(...all.map(q => q[0])) - .6, Math.min(...all.map(q => q[1])) - .6, Math.max(...all.map(q => q[0])) + .6, Math.max(...all.map(q => q[1])) + .6], pane: [fx0, fy0, fx1, fy1], fc: [(fx0 + fx1) / 2, (fy0 + fy1) / 2], ceil: [(fx0 + fx1) / 2, Math.min(...all.map(q => q[1])) - 3.2 * (fx1 - fx0) / (2 * Ri)], s: (fx1 - fx0) / (2 * Ri), nc: HXB.dc.neon || '#3be8ff', x0: Math.min(...all.map(q => q[0])), x1: Math.max(...all.map(q => q[0])) };
  }
  /** (· 56, · 57) «Скло й рама» соти одним полотенцем — кладеться поверх артефакта: скло бічних стінок, звернених до нас (тон кольору
   *  соти, косий відблиск, хромові ребра), передня шибка (ледь тонована, два косі відблиски) і ПЕРЕДНЯ КРОМКА, вирізана з готового
   *  злиття крила (S.comp). Збирається раз; перезбирається, коли злиття змінилось і раз на кілька секунд (світло декору
   *  домальовується в злиття). Так на кадр — одне drawImage на соту замість кліпів і заливок. */
  function rimOf(A) {
    const SB = NX.arc.built; if (!SB) return null; const S = [SB.left, SB.right].find(S => S && S.comp && A.fo[0][0] >= S.box[0] && A.fo[0][0] <= S.box[2]); if (!S) return null;
    const now = performance.now(); if (A.rim && A.rim.comp === S.comp && now - A.rim.at < 4000) return A.rim;
    const kx = S.comp.width / (S.box[2] - S.box[0]), ky = S.comp.height / (S.box[3] - S.box[1]), [x, y, x1, y1] = A.bb, w = x1 - x, h = y1 - y;
    const cv = (A.rim && A.rim.cv) || document.createElement('canvas'); cv.width = Math.ceil(w * kx); cv.height = Math.ceil(h * ky); const c = cv.getContext('2d');
    const path = (p, close = 1) => { c.beginPath(); p.forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); if (close) c.closePath(); };
    c.setTransform(kx, 0, 0, ky, -x * kx, -y * ky);
    for (const q of A.glass) { c.globalAlpha = .13; c.fillStyle = A.nc; path(q.q); c.fill(); c.globalAlpha = .2; c.fillStyle = '#eaffff'; path(q.sh); c.fill();
      c.globalAlpha = .6; c.strokeStyle = '#cfe0ff'; c.lineWidth = .45; path([q.q[0], q.q[3], q.q[2], q.q[1]], 0); c.stroke(); }
    { const [px0, py0, px1, py1] = A.pane, pw = px1 - px0; c.save(); path(A.fi); c.clip(); c.globalAlpha = .06; c.fillStyle = '#bfe8ff'; c.fillRect(px0, py0, pw, py1 - py0);
      c.globalAlpha = .13; c.fillStyle = '#ffffff'; for (const [f, wd] of [[.16, .1], [.34, .04]]) path([[px0 + pw * (f + .22), py0], [px0 + pw * (f + .22 + wd), py0], [px0 + pw * (f + wd), py1], [px0 + pw * f, py1]]), c.fill(); c.restore(); }
    c.globalAlpha = 1; c.beginPath(); for (const pl of [A.fo, A.fi]) { pl.forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.closePath(); } c.clip('evenodd');
    c.drawImage(S.comp, S.box[0], S.box[1], S.box[2] - S.box[0], S.box[3] - S.box[1]);
    return A.rim = { cv, x, y, w: cv.width / kx, h: cv.height / ky, comp: S.comp, at: now + Math.random() * 1500 };
  }
  const NIGHT = { lamp: 1, crystal: 1, orb: 1, globe: 1, terrarium: 1 };
  /** (· 57) СПОТИ над сотами й ДРОН-КУРАТОР. Споти: три маленькі світильники на цеглі над верхніми сотами, вузький промінь на соту (удень
   *  ледь видно, уночі — головне світло стіни). Дрон-куратор — окремий модуль objects/decor_drone.js (· 59). */
  const SPOT_K = [];   // (13.11, власник: «прибери звідти ті три міні-фонарики, вони там не потрібні») було ['crystal', 'globe', 'hourglass'] — споти над сотами знято
  function drawCurator(c, t, nt, vx0, vx1) {
    c.save(); c.imageSmoothingEnabled = true;
    for (const k of SPOT_K) { const B = ART.find(q => q.dc.kind === k), A = B && artGeo(B); if (!A || A.ceil[0] < vx0 - 30 || A.ceil[0] > vx1 + 30) continue;              // споти: корпус під стелею й конус світла на соту
      const [sx, sy] = A.ceil, hw = (A.pane[2] - A.pane[0]) * .62, ty = A.fc[1] + (A.pane[3] - A.pane[1]) * .3, g = A.sg && A.sgc === c ? A.sg : (A.sgc = c, A.sg = (() => { const q = c.createLinearGradient(0, sy, 0, ty); q.addColorStop(0, 'rgba(255,244,214,.9)'); q.addColorStop(1, 'rgba(255,244,214,0)'); return q; })());
      c.globalCompositeOperation = 'lighter'; c.globalAlpha = .07 + .2 * nt; c.fillStyle = g; c.beginPath(); c.moveTo(sx - .8, sy + 1.6); c.lineTo(sx + .8, sy + 1.6); c.lineTo(A.fc[0] + hw, ty); c.lineTo(A.fc[0] - hw, ty); c.closePath(); c.fill();
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.fillStyle = '#0b0620'; c.fillRect(sx - 1.9, sy - 1.2, 3.8, 3); c.fillStyle = '#3a3a66'; c.fillRect(sx - 1.4, sy - .8, 2.8, 1.4); c.fillStyle = '#6a6aa8'; c.fillRect(sx - 1.4, sy - .8, 2.8, .4); c.fillStyle = nt > .3 ? '#fff4d6' : '#ffe9b0'; c.fillRect(sx - .9, sy + .6, 1.8, .8); }
    c.restore();
    if (NX.decorDrone) NX.decorDrone.draw(c, t, nt, CELLS || (CELLS = ART.map(B => ({ A: artGeo(B), on: B.on, kind: B.dc.kind })).filter(q => q.A)), vx0, vx1, glow);   // (· 59) дрон-куратор — objects/decor_drone.js
  }
  let CELLS = null;
  function drawArt(c, t, vx0, vx1) {
    c.save(); c.globalCompositeOperation = 'lighter'; c.imageSmoothingEnabled = true;
    // ---------- (Декор стін · 55, · 56) АРТЕФАКТИ СОТ — живий піксель-арт (objects/decor_art.js). Власник (· 56): «має бути видно, що
    // артефакти знаходяться ВСЕРЕДИНІ сот, зараз вони поверхневі». Тому: 1) спрайт стоїть на поличці посеред ГЛИБИНИ соти (не біля
    // вікна), під ним тінь, за ним сяйво його кольору; видно його крізь скло; 2) поверх нього —
    // скло бічних стінок, що звернені до нас (тон кольору соти, косий відблиск, хромові ребра); 3) ПЕРЕДНЯ КРОМКА сот повертається
    // зверху (одним полотенцем зі склом стінок і шибкою, rimOf) — рама перекриває артефакт там, де вона ближче до нас. Малюється ДО сяйва й вогників
    // сот — ті лягають уже на скло. Тап по соті — артефакт підстрибує, спалах, іскри. Той самий спрайт — у картці (decor_guide.js). ----------
    if (NX.decorVines) NX.decorVines.draw(c, t, vx0, vx1);                                                            // (· 57) ліани між сотами — під артефактами й кромками сот
    const nt = NX.daylight ? 1 - NX.daylight.v(t) : 0;                                                               // 0 — день, 1 — ніч
    const DA = NX.decorArt, path = p => { c.beginPath(); p.forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.closePath(); };
    for (const B of ART) {
      const A = artGeo(B), kind = B.dc.kind; if (!A || A.x1 < vx0 - 20 || A.x0 > vx1 + 20) continue;
      const { fl, h, w } = A, tdt = t - (TP.hex[B.on] || -99), boost = tdt >= 0 && tdt < 2 ? Math.exp(-tdt / .6) : 0, hop = tdt >= 0 && tdt < .5 ? Math.sin(tdt / .5 * Math.PI) * h * .12 : 0;
      const g = glow(DA.glow(kind)), r = h * .8, pop = tdt >= 0 && tdt < 1.6 ? 1 + .14 * Math.sin(Math.min(1, tdt / 1.6) * Math.PI) : 1, hh = h * pop, ww = w * pop;   // тап: артефакт «виїздить» уперед
      c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, (.22 + .08 * Math.sin(t * 1.7 + (B.dc.seed || 0))) * (1 + 1.1 * nt) + .6 * boost); c.drawImage(g.cv, fl[0] - r, fl[1] - h * .5 - r, r * 2, r * 2);
      if (nt > .05 && NIGHT[kind]) { const rr = h * 2.3; c.globalAlpha = nt * (.2 + .06 * Math.sin(t * 1.3 + (B.dc.seed || 0))); c.drawImage(g.cv, fl[0] - rr, fl[1] - h * .4 - rr, rr * 2, rr * 2); }   // (· 57) уночі лампа, кристали, куля, глобус кидають колір на цеглу
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = .55; c.fillStyle = '#05020f'; c.beginPath(); c.ellipse(fl[0], fl[1] - .1, w * .4, h * .06, 0, 0, TAU); c.fill();   // тінь на поличці
      c.globalAlpha = 1; c.imageSmoothingQuality = 'high'; c.drawImage(DA.sprite(kind, t + (B.dc.seed || 0) * 1.7, 2, tdt >= 0 && tdt < 2.2 ? tdt : -1), fl[0] - ww / 2, fl[1] - hh - hop, ww, hh);
      { // (· 57) ПЕРЕДНЯ ШИБКА жива (сама шибка — у полотенці rimOf): повільно пропливає відсвіт міста (рожевий і бірюзовий); тап — світла
        // крайка шибки від'їжджає вбік і вертається. Усе — в прямокутнику між верхньою й нижньою гранями вікна (без кліпу).
        const [px0, py0, px1, py1] = A.pane, pw = px1 - px0, ix0 = px0 + pw * .25, iw = pw * .5, sl = tdt >= 0 && tdt < 1.8 ? Math.sin(Math.min(1, tdt / 1.8) * Math.PI) : 0;
        const cf = (t * .07 + (B.dc.seed || 0) * .13) % 1; c.globalAlpha = .08 * Math.sin(cf * Math.PI); c.fillStyle = '#ff4fd8'; c.fillRect(ix0 + iw * cf * .8, py0 + .6, iw * .14, py1 - py0 - 1.2); c.fillStyle = '#3be8ff'; c.fillRect(ix0 + iw * (cf * .8 + .2), py0 + .6, iw * .07, py1 - py0 - 1.2);
        if (sl > .02) { c.globalAlpha = .75; c.fillStyle = '#eaffff'; c.fillRect(ix0 + iw * sl - .25, py0 + .6, .5, py1 - py0 - 1.2); c.globalAlpha = .12; c.fillRect(ix0 + iw * sl, py0 + .6, iw * (1 - sl), py1 - py0 - 1.2); } }
      if (boost > .02) { const o = [fl[0], fl[1] - h * .5];
        for (let q = 0; q < 8; q++) { const aa = q / 8 * TAU + (B.dc.seed || 0), rr = tdt * 9 + 1; c.globalAlpha = boost; c.fillStyle = q % 2 ? '#ffffff' : DA.glow(kind); c.fillRect(o[0] + Math.cos(aa) * rr - .3, o[1] + Math.sin(aa) * rr * .7 - .3, .6, .6); } }
    }
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;                                                       // скло й передні кромки ВСІХ сот — поверх усіх артефактів (кромка сусіда теж ближча)
    for (const B of ART) { const A = artGeo(B); if (!A || A.x1 < vx0 - 20 || A.x0 > vx1 + 20) continue; const R = rimOf(A); if (R) c.drawImage(R.cv, R.x, R.y, R.w, R.h); }
    drawCurator(c, t, nt, vx0, vx1);
    c.globalCompositeOperation = 'lighter';
    for (const B of HEX) {                                                              // неон соти «дихає» — кожна у свій такт
      const { P } = basis(B), p = proj(P(0, B.dep * .35, (B.yt + B.yb) / 2)); if (p[0] < vx0 - 20 || p[0] > vx1 + 20) continue;
      const k = hash(B.dc.pat || 0, 3), dt = t - (TP.hex[B.id] || -99), fl = dt >= 0 && dt < 1.6 ? Math.exp(-dt / .45) : 0;
      const a = .07 + .09 * (.5 + .5 * Math.sin(t * (.7 + k * .6) + k * 9)) + .9 * fl, r = B.w * .5 * (520 / (520 + P(0, 0, 0)[2])) * (1 + .7 * fl), g = glow(B.dc.neon || '#3be8ff');
      c.globalAlpha = Math.min(1, a); c.drawImage(g.cv, p[0] - r, p[1] - r, r * 2, r * 2);
      { // ---------- (Декор стін · 49) ЖИВІ СОТИ: вогник біжить по неоновій кромці, хвиля світла проходить по всій решітці, відблиск
        // ковзає по склу, у комірці плавають порошинки ----------
        const Ro = B.w / 2, Yc = (B.yt + B.yb) / 2, nc = B.dc.neon || '#3be8ff', V6 = Array.from({ length: 6 }, (_, q) => proj(P(Ro * .93 * Math.cos(q * Math.PI / 3), -.2, Yc + Ro * .93 * Math.sin(q * Math.PI / 3))));
        const at = u => { const q = ((u % 6) + 6) % 6, i = Math.floor(q), f = q - i, A = V6[i], Bq = V6[(i + 1) % 6]; return [A[0] + (Bq[0] - A[0]) * f, A[1] + (Bq[1] - A[1]) * f]; };
        const u0 = t * (.55 + .35 * k) * (k > .5 ? 1 : -1) + k * 17; c.lineCap = 'round'; c.strokeStyle = nc;
        for (let q = 0; q < 7; q++) { const a0 = at(u0 - q * .16), a1 = at(u0 - (q + 1) * .16); c.globalAlpha = .85 * (1 - q / 7); c.lineWidth = 1.3 - q * .12; c.beginPath(); c.moveTo(a0[0], a0[1]); c.lineTo(a1[0], a1[1]); c.stroke(); }   // хвіст вогника
        const hd = at(u0); c.globalAlpha = 1; c.fillStyle = '#ffffff'; c.fillRect(hd[0] - .6, hd[1] - .6, 1.2, 1.2);
        const wv = ((t * .11) % 1) * 260 - 60, wk = Math.exp(-Math.pow((p[0] - wv) / 16, 2));                                          // хвиля: раз на ~9 с зліва направо, кромка спалахує
        if (wk > .03) { c.globalAlpha = wk * .9; c.lineWidth = 1.5; c.beginPath(); V6.forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.closePath(); c.stroke(); c.globalAlpha = wk * .35; c.drawImage(g.cv, p[0] - r * 1.5, p[1] - r * 1.5, r * 3, r * 3); }
        const gp = ((t * .16 + k * 3.7) % 1) * 4 - 1; if (gp > -.3 && gp < 1.3) { c.save(); c.beginPath(); V6.forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.closePath(); c.clip();        // відблиск по склу: коса смуга проїжджає комірку
          const x = p[0] - r + gp * r * 2; c.globalAlpha = .22; c.fillStyle = '#eaffff'; c.beginPath(); c.moveTo(x, p[1] - r); c.lineTo(x + 2.2, p[1] - r); c.lineTo(x - 3.8, p[1] + r); c.lineTo(x - 6, p[1] + r); c.closePath(); c.fill(); c.globalAlpha = .12; c.fillRect(x + 3.4, p[1] - r, .8, r * 2); c.restore(); }
        for (let q = 0; q < 4; q++) { const f = ((t * (.05 + .03 * hash(q, k * 9)) + hash(q, B.dc.pat || 0)) % 1), m = proj(P((hash(q, 5 + (B.dc.pat || 0)) - .5) * Ro * 1.1 + Math.sin(t * .8 + q * 2) * 1.2, B.dep * (.25 + .5 * hash(q, 8)), Yc + Ro * .7 - f * Ro * 1.4));   // порошинки пливуть угору
          c.globalAlpha = .75 * Math.sin(f * Math.PI); c.fillStyle = q % 2 ? '#ffffff' : nc; c.fillRect(m[0] - .35, m[1] - .35, .7, .7); }
      }
      if (fl > .03) {                                                                    // тап: неонова кромка соти спалахує й «розходиться» кільцем
        const Ro = B.w / 2, Yc = (B.yt + B.yb) / 2, hexP = sc => Array.from({ length: 6 }, (_, q) => proj(P(Ro * sc * Math.cos(q * Math.PI / 3), -.2, Yc + Ro * sc * Math.sin(q * Math.PI / 3))));
        c.strokeStyle = B.dc.neon || '#3be8ff'; c.lineJoin = 'round';
        for (const [sc, al, lw] of [[1, fl, 1.1], [1 + dt * .9, fl * .6, .7]]) { c.globalAlpha = Math.min(1, al); c.lineWidth = lw; c.beginPath(); hexP(sc).forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.closePath(); c.stroke(); }
      }
    }
    for (const B of items) { if (B.st !== 'dc_tube' || !NX.arc.tubePts) continue;                                          // (· 52) неонові трубки між острівцями: сяйво вздовж і імпульс, що біжить
      const { P } = basis(B), pts = NX.arc.tubePts(B).map(([u, y]) => proj(P(u, B.dep * .45, y))); if (pts[5][0] < vx0 - 20 || pts[0][0] > vx1 + 20) continue;
      const g = glow(B.dc.col || '#ff4fd8'), L = [0]; for (let k = 1; k < pts.length; k++) L.push(L[k - 1] + Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]));
      const at = d => { let k = 1; while (k < pts.length - 1 && L[k] < d) k++; const f = (d - L[k - 1]) / Math.max(.01, L[k] - L[k - 1]); return [pts[k - 1][0] + (pts[k][0] - pts[k - 1][0]) * f, pts[k - 1][1] + (pts[k][1] - pts[k - 1][1]) * f]; };
      for (let d = 0; d <= L[5]; d += 5) { const q = at(d); c.globalAlpha = .16 + .06 * Math.sin(t * 2.2 + d * .3); c.drawImage(g.cv, q[0] - 6, q[1] - 6, 12, 12); }
      const f = ((t * .22 + (B.dc.seed || 0) * .5) % 1), hd = at(f * L[5]); c.globalAlpha = .9; c.drawImage(g.cv, hd[0] - 5, hd[1] - 5, 10, 10); c.globalAlpha = 1; c.fillStyle = '#ffffff'; c.fillRect(hd[0] - .7, hd[1] - .7, 1.4, 1.4); }
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
  const TP = { door: -99, poster: -99, posterTgt: 0, neon: -99, drone: -99, lamp: -99, green: -99, fungi: -99, shroom: null, snail: -99, hex: {}, fly: [[], []], aq: null, marks: [], fall: [], note: -1 };
  const boxOf = F => { const xs = [F.S0[0], F.S1[0], F.S3[0], F.S1[0] + F.S3[0] - F.S0[0]], ys = [F.S0[1], F.S1[1], F.S3[1], F.S1[1] + F.S3[1] - F.S0[1]]; return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; };
  const inB = (x, y, b, pad = 0) => x >= b[0] - pad && x <= b[2] + pad && y >= b[1] - pad && y <= b[3] + pad;
  /** (15.11, власник: «у них ще немає своїх карточок») Який гриб під пальцем: лоток конвеєра чи порту (CONV.HIT — де вони були в
   *  останньому кадрі) або острівець вежі -> номер виду 0…17, інакше −1. */
  function shroomAt(x, y) {
    let best = -1, bd = 1e9; if (CONV && CONV.HIT) for (const [hx, hy, idx, r] of CONV.HIT) { const d = Math.hypot(x - hx, y - hy) - r; if (d < 1.5 && d < bd) { bd = d; best = idx; } }
    if (VIT && VIT.S) VIT.S.ISL.forEach((I, k) => { const v = V3[k]; if (!v) return; const p = VIT.P3(v[0], v[1], I.h + I.s * .5), d = Math.hypot(x - p[0], y - p[1]) - I.s * .55; if (d < 1 && d < bd) { bd = d; best = 8 + I.k; } });
    return best;
  }
  function tap(x, y) {
    let LPhit = null;                                                                   // (· 18) яку рослину зачепили (для довідника)
    const pre = NX.planters && NX.planters.tapHang && NX.planters.tapHang(x, y);                                   // (· 39) висячий сад над вікном — раніше за вікно
    if (!pre && NX.input && NX.input.objectAt(x, y)) return false;
    const t = NX.time; let hit = pre ? 'planter' : null;
    for (const B of HEX) { const { P } = basis(B), c0 = proj(P(0, B.dep * .2, (B.yt + B.yb) / 2)), r = B.w * .48 * (520 / (520 + P(0, 0, 0)[2])); if (Math.hypot(x - c0[0], y - c0[1]) < r) { TP.hex[B.id] = t; hit = 'hex'; break; } }
    if (!hit && NX.decor.droneAt) { const D = NX.decor.droneAt(t); if (D && Math.hypot(x - D.x, y - Math.max(10, D.y)) < 7) { TP.drone = t; hit = 'drone'; } }
    if (!hit) for (let v = 0; v < ROUTES.length; v++) { const B = butterflyAt(v, t); if (B && Math.hypot(x - B.x, y - B.y) < 6) { TP.fly[v].push(t); hit = 'fly'; break; } }
    if (!hit && RUD && inB(x, y, boxOf(faceOf(RUD)))) { const e = rudikEv(t); if (!e || e.k > 4.8) { TP.poster = t; TP.posterTgt = (TP.posterTgt + 1) % 3; } hit = 'poster'; }
    if (!hit && AQ.door && inB(x, y, boxOf(faceOf(AQ.door.B)), 1.5)) { if (doorOpen(t) <= 0) TP.door = t; hit = 'door'; }
    if (!hit && NEON && inB(x, y, boxOf(faceOf(NEON)))) { TP.neon = t; hit = 'neon'; }
    for (const [id, k] of [['dc_lantern', 'lamp'], ['dc_green', 'green']]) { const B = byId[id]; if (hit || !B) continue; const { P } = basis(B), a = proj(P(-B.w / 2, B.dep / 2, B.yt)), b = proj(P(B.w / 2, B.dep / 2, B.yb)); if (inB(x, y, [Math.min(a[0], b[0]), a[1], Math.max(a[0], b[0]), b[1]], 1)) { TP[k] = t; hit = k; } }
    if (!hit && SH) { const k = shroomAt(x, y); if (k >= 0) { TP.shroom = { k, x, y, t0: t }; hit = 'shroom'; } }                       // (15.11) гриб у вежі чи на конвеєрі — картка виду
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
    if (!hit && NX.planters && NX.planters.tap(x, y)) hit = 'planter';
    if (!hit && NX.decorCollage && NX.decorCollage.tap(x, y, t)) hit = 'collage';                                      // (· 53) річ колажу гойднеться                  // (· 31) вазони перед вікном — картка виду
    if (!hit && NX.decorVines && NX.decorVines.tap(x, y, t)) hit = 'vine';                                             // (· 57) ліана між сотами — гойднеться, картка виду
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
      const B = byId[id]; if (!B) return; const L = LP.find(q => q.key === id); if (L) L.shake = t; if (NX.decorGrow) NX.decorGrow.water(id, t);   // (· 22) паростки й квіти
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
    LP, LED, TP, tap, fishPush, aqFx, droneSpin, trapAt, snailAt, care, greet, butterflyAt, plantPt,
    /** Для tools/wingbox/decor_check.js: усе живе цього файлу в крайніх положеннях — на контекст у координатах кімнати
     *  (рослини — обидва крайні нахили з поривом; метелики, листочки, світлячки — точки за 2 хвилини). */
    extentTo(c) {
      buildPlants(1e9); const m0 = c.getTransform(), base = [m0.a, m0.b, m0.c, m0.d, m0.e, m0.f]; c.save(); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
      for (const L of LP) for (const q of [Math.round(L.N / 4), Math.round(L.N * 3 / 4)]) { renderPlant(L, q, 1.2); c.setTransform(...mul(base, L.M)); c.drawImage(L.cv, -L.pad, L.r0); }
      c.setTransform(m0); c.fillStyle = '#fff'; if (NX.decorVines) NX.decorVines.extentTo(c);                             // (· 57) ліани між сотами
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
      c.restore(); LP.forEach(L => { L.q = -1; });
    },
    draw(c, t, Rd, vx0, vx1) {
      const P = this.prof, T = P ? (k, f) => { const a = performance.now(); f(); P[k] = (P[k] || 0) + performance.now() - a; } : (k, f) => f();   // NX.decorLive.prof = {} — заміри частин (мс)
      T('build', () => { buildPlants(); liftStep('left'); liftStep('right'); });
      const m = c.getTransform(); c.__base = [m.a, m.b, m.c, m.d, m.e, m.f];
      T('farm', () => { if (NX.decorFarm && NX.decorFarm.frame) NX.decorFarm.frame(c, t, vx0, vx1); });   // (15.11) рама ферми чітким шаром — objects/decor_farm.js
      T('pylon', () => { maskedDraw(c, 'door', t, Rd, vx0, vx1, paintDoor); maskedDraw(c, 'pylon', t, Rd, vx0, vx1, paintGlass); drawPylonBits(c, t, vx0, vx1); drawFungi(c, t, vx0, vx1); drawConv(c, t, vx0, vx1); });
      T('led', () => drawLED(c, t, vx0, vx1));
      T('art', () => { if (NX.decorCollage) NX.decorCollage.draw(c, t, { items, proj, basis, vx0, vx1 }); drawArt(c, t, vx0, vx1); });   // (· 53) колаж довкола сот — під сяйвом сот
      T('rudik', () => drawRudik(c, t, vx0, vx1));
      T('plants', () => drawPlants(c, t, vx0, vx1));
      T('guide', () => { if (NX.decorGrow) NX.decorGrow.draw(c, t, vx0, vx1); if (NX.decorGuide) NX.decorGuide.draw(c, t); if (NX.decorVault) NX.decorVault.draw(c, t, vx0, vx1); });   // (· 22) паростки й квіти після поливу;   // (· 19) промінь сканера Nexi; (· 20) сховище насіння: сяйво капсул, насінини                              // (· 19) бирки видів і промінь сканера
      T('snail', () => drawSnail(c, t, vx0, vx1));
      T('air', () => drawAir(c, t, vx0, vx1));
      T('care', () => { drawCare(c, t); if (NX.decorAqua && NX.decorAqua.drawFeeders) NX.decorAqua.drawFeeders(c, t, vx0, vx1); });   // (· 6) полив і годівнички
      T('fx', () => { drawLeaves(c, t, vx0, vx1); drawButterflies(c, t, vx0, vx1); drawFlies2(c, t, vx0, vx1); drawTapFx(c, t); });
      T('light', () => { if (NX.decorLight) NX.decorLight.draw(c, t, vx0, vx1); });                                 // (· 23) ореоли джерел світла на стінах, коли темніє
    },
  };
})();
