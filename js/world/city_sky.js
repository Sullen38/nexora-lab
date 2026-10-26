/* ============================================================================
 * world/city_sky.js — НЕБО ЗА ПАНОРАМНИМ ВІКНОМ (NX.citySky): небо, зорі, планета, кільце, хмари
 * ----------------------------------------------------------------------------
 * Усе — піксель-артом кодом (1 px = 0.25 од.), кольори й композиція — як на картинці кімнати:
 *   sky(x0,y0,x1,y1)  — небо: густа синява вгорі -> яскраво-синє -> фіолет -> РОЖЕВЕ СЯЙВО міста
 *                       (y ~133, за хмарочосами) -> темний фіолет; 8-bit перелив дизерингом Байєра,
 *                       зорі (густіші вгорі), «хрестики» яскравих зір, зоря-сонце з піксельним ореолом
 *   Planet(cx,cy,R)   — планета-Земля з кільцем, що ОБЕРТАЄТЬСЯ: океан і блакитні континенти (мапа
 *                       світу з wing_screens.js + шум берегів), полярні шапки, ніч з вогнями міст,
 *                       голо-сітка, блакитна атмосфера на краю й піксельний ореол. Кожна точка диска
 *                       рахується наперед (довгота, широта, світло); .update(rot) лише зсуває мапу
 *                       (~4 мс), тож планета повертається плавно без шкоди для fps
 *   Ring(...)         — кільце: дві половини (задня — за планетою, передня — поперед неї), смуги,
 *                       щілина Кассіні, частинки; освітлене справа (звідти світить зоря-сонце)
 *   Cloud(cl)         — хмара-пасмо: фіолетова з рожевою верхівкою (світло міста), край — дизерингом;
 *                       кожна хмара — окремий спрайт, що пливе (cityscape.js)
 * ========================================================================== */
NX.citySky = (() => {
  const { col, pal, mix, ramp, fade, B, rng, hash2, vn, fbm, Ras, clamp } = NX.ckit;

  // ---------------- НЕБО ----------------
  // кольори зняті з картинки кімнати (синє небо, рожеве сяйво за містом на y ~125..145)
  const SKY = [[0, '#080b46'], [10, '#0a1468'], [24, '#0b1f8c'], [42, '#0c2bae'], [60, '#1239cc'], [76, '#2445dc'], [90, '#4248e2'], [102, '#6a4ce6'],
    [113, '#9650ea'], [122, '#be56ee'], [130, '#e05ff1'], [137, '#f26cee'], [145, '#c44fdc'], [156, '#8a3cc8'], [170, '#5a2eb2'], [188, '#3c24a0'],
    [206, '#36239c'], [222, '#4c2aa8'], [238, '#3e2498'], [270, '#24186e'], [345, '#110b44']].map(([y, h]) => [y, col(h)]);
  const STAR = pal(['#ffffff', '#d6ecff', '#ffd8f4', '#b8f4ff']);
  /** Піксельний ореол (дизеринг, без розмиття): освітлює пікселі в колі r. */
  function halo(R, X, Y, r, c, k) {
    const i0 = R.I(X - r), i1 = R.I(X + r), j0 = R.J(Y - r), j1 = R.J(Y + r);
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const d = Math.hypot(R.X(i) - X, R.Y(j) - Y) / r; if (d >= 1) continue; const v = k * (1 - d) * (1 - d); const q = Math.floor(v * 4 + B(i, j) + .5) / 4; if (q > 0) R.over(i, j, c, Math.min(.9, q)); }
  }
  function sky(x0, y0, x1, y1, o = {}) {
    const R = Ras(x0, y0, x1, y1), W = R.W;
    for (let j = 0, s = 0; j < R.H; j++) {
      const Y = R.Y(j); while (s < SKY.length - 2 && Y >= SKY[s + 1][0]) s++;
      const [ya, a] = SKY[s], [yb, b] = SKY[s + 1], t = clamp((Y - ya) / (yb - ya), 0, 1);
      for (let i = 0; i < W; i++) R.d[j * W + i] = fade(a, b, t, i, j, 1.5);
    }
    // ледь помітні «хмарки» туманності вгорі (зерно дизерингу, щоб небо не було пласким)
    for (let j = 0; j < R.J(96); j++) for (let i = 0; i < W; i++) { const n = fbm(R.X(i) * .035, R.Y(j) * .05); if (n > .62 && B(i, j) < (n - .62) * 3 - .3) R.over(i, j, col('#3a5af0'), .35); }
    // зорі: густіші вгорі, біля сяйва — тьмяніші
    const r = rng(o.seed || 7);
    for (let n = 0; n < 420; n++) {
      const X = x0 + r() * (x1 - x0), Y = y0 + Math.pow(r(), 1.6) * 132, b = r(), sz = r(), c = STAR[n & 3], a = (.3 + .7 * b) * clamp(1.2 - Y / 128, 0, 1);
      const i = R.I(X), j = R.J(Y); R.over(i, j, c, a);
      if (sz > .84) { R.over(i + 1, j, c, a * .8); R.over(i, j + 1, c, a * .8); R.over(i + 1, j + 1, c, a * .55); }
      if (sz > .975 && Y < 90) for (const [di, dj, k] of [[-1, 0, .6], [2, 0, .6], [0, -1, .6], [0, 2, .6], [-2, 0, .25], [3, 0, .25], [0, -2, .25], [0, 3, .25]]) R.over(i + di, j + dj, c, a * k);
    }
    // зоря-сонце (світло на планету й кільце — звідси)
    if (o.sun) { const [sx, sy] = o.sun; halo(R, sx, sy, 7, col('#8ab8ff'), .7); halo(R, sx, sy, 3, col('#d8f0ff'), 1);
      const i = R.I(sx), j = R.J(sy), W2 = col('#ffffff'), C2 = col('#bfeeff');
      for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) R.put(i + a, j + b, W2);
      for (let k = 2; k <= 9; k++) { const al = 1 - k / 10; R.over(i + k, j, C2, al); R.over(i - k, j, C2, al); R.over(i, j + k, C2, al * .8); R.over(i, j - k, C2, al * .8); }
      for (let k = 2; k <= 4; k++) { const al = .6 - k / 8; R.over(i + k, j + k, C2, al); R.over(i - k, j - k, C2, al); R.over(i + k, j - k, C2, al); R.over(i - k, j + k, C2, al); } }
    return R;
  }

  // ---------------- ПЛАНЕТА ----------------
  // голографічна Земля, як на картинці: глибокий синій океан, світліші блакитні континенти з яскравим берегом,
  // голо-сітка, яскравий блакитний обідок і світіння від краю всередину
  const OCEAN = ['#040a3c', '#061052', '#08176a', '#0b1f84', '#0e289e', '#1232b6', '#173ec8', '#1d4cd8'];
  const LAND = ['#0c2f80', '#103d98', '#164eb0', '#1d62c6', '#2678d8', '#3292e6', '#46acf0', '#62c6f8'];
  const COAST = ['#2a6ad0', '#327ade', '#3c8cea', '#4aa2f2', '#5cbaf8', '#74d0fc', '#90e2ff', '#b0f0ff'];
  const ICE = ['#1e3474', '#2a4690', '#385aa8', '#4a70be', '#6088d0', '#7ca2e0', '#9cc0ee', '#c0dcf8'];
  /** Таблиця кольорів: [тип 0..3 (+4 — з лінією сітки)] × [світіння від краю 0..3] × [тон 0..7] -> c32 (рахується раз). */
  const LUT = (() => { const out = new Uint32Array(8 * 32), base = [OCEAN, LAND, ICE, COAST];
    for (let ty = 0; ty < 8; ty++) for (let g = 0; g < 4; g++) for (let s = 0; s < 8; s++) { let c = col(base[ty & 3][s]); if (ty > 3) c = mix(c, '#5ad8ff', .3); if (g) c = mix(c, '#3aa8ff', g * .13); out[ty * 32 + g * 8 + s] = c; }
    return out; })();
  /** Мапа світу 256×128 (рівнокутна): 0 — океан, 1 — суша, 2 — лід, 3 — берег; плавна мапа + шум берегів. */
  function worldTex() {
    const TW = 256, TH = 128, T = new Uint8Array(TW * TH), WM = (NX.kit && NX.kit.WORLD) || null;
    const cell = (gx, gy) => { if (!WM || gy < 0 || gy >= WM.length) return 0; const row = WM[gy]; return row[((gx % 48) + 48) % 48] === 'X' ? 1 : 0; };
    for (let v = 0; v < TH; v++) for (let u = 0; u < TW; u++) {
      const lon = u / TW * 360 - 180, lat = 90 - (v + .5) / TH * 180, gx = (lon + 180) / 7.5 - .5, gy = (80 - lat) / 7 - .5, ix = Math.floor(gx), iy = Math.floor(gy), fx = gx - ix, fy = gy - iy;
      let f = WM ? (cell(ix, iy) * (1 - fx) + cell(ix + 1, iy) * fx) * (1 - fy) + (cell(ix, iy + 1) * (1 - fx) + cell(ix + 1, iy + 1) * fx) * fy : fbm(u * .05, v * .05) * 1.2 - .1;
      f += (fbm(u * .11 + 3, v * .11 + 7) - .5) * .55;
      const ice = Math.abs(lat) + (vn(u * .2, v * .2) - .5) * 9;
      T[v * TW + u] = (lat > 0 ? ice > 74 : ice > 66) ? 2 : f > .5 ? 1 : 0;
    }
    for (let v = 0; v < TH; v++) for (let u = 0; u < TW; u++) { const k = v * TW + u; if (T[k] !== 1) continue;   // берег: суша поруч з океаном
      if (T[v * TW + (u + 1) % TW] === 0 || T[v * TW + (u + TW - 1) % TW] === 0 || (v > 0 && T[k - TW] === 0) || (v < TH - 1 && T[k + TW] === 0)) T[k] = 3; }
    for (let u = 0; u < TW; u++) if ((u * 12) % TW < 12) for (let v = 0; v < TH; v++) T[v * TW + u] |= 4;   // меридіани голо-сітки (кожні 30°) — у самій мапі: обертаються з нею
    return { TW, TH, T };
  }
  function Planet(cx, cy, Rp, o = {}) {
    const U = .25, pad = 4, half = Rp + pad, N = Math.ceil(half * 2 / U);
    const cv = document.createElement('canvas'); cv.width = cv.height = N;
    const ctx = cv.getContext('2d'), im = ctx.createImageData(N, N), d = new Uint32Array(im.data.buffer);
    const tex = worldTex(), L = (() => { const v = [.5, -.5, .7], l = Math.hypot(...v); return v.map(a => a / l); })();
    const tilt = o.tilt == null ? -.36 : o.tilt, ct = Math.cos(tilt), st = Math.sin(tilt);
    const K = [], LON = [], V = [], S = [], RIM = [], LATG = [];   // для кожної точки диска: індекс пікселя, довгота (у текселях), рядок мапи, тон|світіння, обідок, паралель
    const RIMC = pal(['#c8fbff', '#7af0ff', '#3be8ff', '#2aa8e8', '#1e6ccc']), HALO = col('#3be8ff'), HALO2 = col('#6a8cff');
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const dx = ((i + .5) * U - half) / Rp, dy = ((j + .5) * U - half) / Rp, rr = dx * dx + dy * dy, k = j * N + i;
      if (rr > 1) {                                                                   // ореол атмосфери (статичний): дизеринг, яскравіший з боку сонця
        const e = (Math.sqrt(rr) - 1) * Rp / (pad - .4); if (e >= 1) continue;
        const lit = clamp(.4 + .6 * (dx * L[0] + dy * L[1]) / Math.sqrt(rr), 0, 1), v = (1 - e) ** 2 * (.3 + .7 * lit);
        if (v + B(i, j) * .7 > .36) d[k] = ((Math.round(clamp(v * 1.3, .22, .8) * 255) << 24) | ((lit > .45 ? HALO : HALO2) & 0xffffff)) >>> 0;
        continue;
      }
      const nz = Math.sqrt(1 - rr), tx = dx * ct - dy * st, ty = dx * st + dy * ct, lat = Math.asin(clamp(-ty, -1, 1)), lon = Math.atan2(tx, nz);
      const dif = dx * L[0] + dy * L[1] + nz * L[2], q = clamp(.12 + .82 * Math.max(dif, -.15) + .06 * (1 - nz), 0, 1);
      const edge = (1 - Math.sqrt(rr)) * Rp, lit = dif > -.05;                        // відстань до краю диска (од.)
      K.push(k); LON.push((lon / (Math.PI * 2) + 2) * tex.TW); V.push(clamp(Math.floor((.5 - lat / Math.PI) * tex.TH), 0, tex.TH - 1) * tex.TW);
      S.push(clamp(Math.round(q * 7 + B(i, j) * .9), 0, 7) | (clamp(Math.floor((1 - edge / 7) * 4 + B(i, j) * .8), 0, 3) << 3));   // тон | світіння від краю
      RIM.push(edge < .45 ? RIMC[lit ? 0 : 2] : edge < .95 ? RIMC[lit ? 1 : 3] : edge < 1.5 ? RIMC[lit ? 2 : 4] : 0);
      LATG.push(Math.abs(((lat * 180 / Math.PI) % 30 + 30) % 30 - 15) > 14.25 ? 4 : 0);   // паралелі голо-сітки (кожні 30°)
    }
    const n = K.length, Kk = Int32Array.from(K), Lo = Float32Array.from(LON), Vv = Int32Array.from(V), Ss = Uint8Array.from(S), Rm = Uint32Array.from(RIM), Lg = Uint8Array.from(LATG);
    const TW = tex.TW, T = tex.T, MASK = TW - 1;
    return {
      cv, x: cx - half, y: cy - half, w: half * 2, h: half * 2,
      /** Повернути планету на кут rot (рад): лише зсув мапи для кожної точки диска. */
      update(rot) {
        const ru = rot / (Math.PI * 2) * TW;                                         // поворот у текселях мапи (TW — степінь двійки)
        for (let m = 0; m < n; m++) {
          if (Rm[m]) { d[Kk[m]] = Rm[m]; continue; }
          d[Kk[m]] = LUT[((T[Vv[m] + ((Lo[m] + ru) & MASK)] | Lg[m]) << 5) + Ss[m]];   // тип (+сітка) × світіння × тон
        }
        ctx.putImageData(im, 0, 0);
      },
    };
  }

  // ---------------- КІЛЬЦЕ ----------------
  /** Голографічне кільце, як на картинці: тонка яскрава лінія з «намистом» вогників + м'яке світіння
   *  і слабше внутрішнє кільце. Дві половини (растри): задня (за планетою) і передня (поперед неї).
   *  Товщина лінії однакова по всьому колу (відстань до еліпса рахується на екрані). */
  function Ring(cx, cy, A, e, th, Rp) {
    const Bm = A * e, ct = Math.cos(th), st = Math.sin(th), xh = Math.hypot(A * ct, Bm * st) + 4, yh = Math.hypot(A * st, Bm * ct) + 4;
    const back = Ras(cx - xh, cy - yh, cx + xh, cy + yh), front = Ras(cx - xh, cy - yh, cx + xh, cy + yh);
    const CORE = col('#d4fcff'), MID = col('#5aeeff'), EDGE = col('#2ab8f0'), GLOW = col('#2a8cf0'), INNER = col('#3a9cf0');
    const dist = (xr, yr, a, b) => { const f = (xr / a) ** 2 + (yr / b) ** 2 - 1, gx = 2 * xr / (a * a), gy = 2 * yr / (b * b); return f / Math.max(1e-6, Math.hypot(gx, gy)); };
    for (let j = 0; j < back.H; j++) for (let i = 0; i < back.W; i++) {
      const dx = back.X(i) - cx, dy = back.Y(j) - cy, xr = dx * ct + dy * st, yr = -dx * st + dy * ct;
      const fr = yr > 0, inDisk = dx * dx + dy * dy < (Rp + .2) * (Rp + .2); if (!fr && inDisk) continue;   // задня половина за диском не видна
      const R = fr ? front : back, s = Math.atan2(yr / Bm, xr / A), lit = .55 + .45 * Math.cos(s - .5);   // справа яскравіше (там сонце)
      const d1 = Math.abs(dist(xr, yr, A, Bm)), d2 = Math.abs(dist(xr, yr, A * .9, Bm * .9));
      if (d1 < 2.6) {
        const bead = Math.sin(s * 230) > -.2;                                         // «намисто» вогників уздовж лінії
        if (d1 < .4) R.d[j * R.W + i] = bead && lit > .45 ? CORE : MID;
        else if (d1 < .8) R.d[j * R.W + i] = lit > .3 ? MID : EDGE;
        else if (d1 < 1.25) { if (B(i, j) + .5 < .85 * lit + .1) R.d[j * R.W + i] = EDGE; else R.over(i, j, GLOW, .55); }
        else { const a = (1 - (d1 - 1.25) / 1.35) * .5 * lit; if (a + B(i, j) * .4 > .18) R.over(i, j, GLOW, Math.max(.2, a)); }
      } else if (d2 < .7 && Math.sin(s * 150) > .1) R.over(i, j, INNER, .55 * (1 - d2 / .7) + .2);
    }
    return { back, front };
  }

  // ---------------- ХМАРИ ----------------
  // тонкі пасма, як на картинці: фіолетові з рожевими верхівками (світло міста й зорі), без розмиття — дизеринг
  const CLOUD = pal(['#2a1c74', '#38218c', '#4a28a2', '#6230b6', '#7e3ac4', '#a046d0', '#c456da', '#e470e2', '#ff9cec']);
  /** Одна хмара-пасмо: растр на її межах (щокадру хмари пливуть окремими спрайтами — це в рази дешевше за смугу
   *  на всю ширину вікна). cl: {x, y, w, h, seed, k} — центр, розмір, тон. */
  function Cloud(cl) {
    const w2 = cl.w / 2, h2 = cl.h / 2, R = Ras(cl.x - w2 - 1, cl.y - cl.h - .5, cl.x + w2 + 1, cl.y + cl.h * .7 + .5), sd = cl.seed * 17.3;
    for (let j = 0; j < R.H; j++) {
      const Y = R.Y(j);
      for (let i = 0; i < R.W; i++) {
        const X = R.X(i), ex = (X - cl.x) / w2, ey = (Y - cl.y) / h2, env = 1 - ex * ex - (ey < 0 ? ey * ey * .7 : ey * ey * 1.6); if (env <= 0) continue;
        const n = fbm(X * .045 + sd, Y * .36 + sd * .3), dens = n * 1.3 - .52 + env * .6;
        if (dens + B(i, j) * .3 < .24) continue;
        const lit = clamp(.2 + (cl.y - Y) / cl.h * .55 + (dens - .3) * .9 + (cl.k || 0), 0, 1), c = CLOUD[clamp(Math.round(lit * 8 + B(i, j) * .9), 0, 8)];
        if (dens < .36) R.over(i, j, c, .55); else R.d[j * R.W + i] = c;
      }
    }
    return R;
  }

  return { sky, Planet, Ring, Cloud, halo, SKY };
})();
