/* ============================================================================
 * objects/decor_live.js — ДЕКОР СТІН · 4: ЖИВЕ (рослини гойдаються, пілон другого поверху, плакат Рудика, штучки в сотах)
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
  function buildPlants(lim = 4) {
    const R = NX.arc.dcLive || {}, keys = Object.keys(R); if (keys.length !== lpN) { lpN = keys.length; LP.length = 0; lpQ = keys.slice(); }
    for (let left = lim; lpQ.length && left > 0; left--) {
      const e = R[lpQ.shift()], S = e && NX.arc.dcPlant(e.sp); if (!S) continue;
      const sw = S.sw, sh = S.sh, U = S.U || .25, OV = 3, cutR = Math.round(e.cut * sh), up = e.dir === 'up';
      const r0 = up ? 0 : Math.max(0, cutR - OV), r1 = up ? Math.min(sh, cutR + OV) : sh, n = r1 - r0; if (n < 2) continue;
      const op = (x, y) => x >= 0 && y >= 0 && x < sw && y < sh && (S.d[y * sw + x] >>> 24) >= 110, base = new Uint32Array(sw * n);
      for (let y = r0; y < r1; y++) for (let x = 0; x < sw; x++) {                       // пікселі живої частини + контур 2 px (як у растра)
        if (!op(x, y)) continue; let edge = false;
        for (let s = 1; s <= 2 && !edge; s++) if (!op(x - s, y) || !op(x + s, y) || !op(x, y - s) || !op(x, y + s)) edge = true;
        base[(y - r0) * sw + x] = edge ? OUTC : ((S.d[y * sw + x] | 0xff000000) >>> 0);
      }
      const pad = Math.ceil(e.amp * 1.35 / U) + 2, W2 = sw + 2 * pad, cv = document.createElement('canvas'); cv.width = W2; cv.height = n;
      const ctx = cv.getContext('2d'), img = ctx.createImageData(W2, n);
      const S0 = proj(e.P0), S1 = proj(e.P1), S3 = proj(e.P3), xs = [S0[0], S1[0], S3[0], S1[0] + S3[0] - S0[0]];
      LP.push({ e, sw, n, r0, r1, cutR, up, pad, U, base, cv, ctx, img, d32: new Uint32Array(img.data.buffer), M: [(S1[0] - S0[0]) / sw, (S1[1] - S0[1]) / sw, (S3[0] - S0[0]) / sh, (S3[1] - S0[1]) / sh, S0[0], S0[1]],
        x0: Math.min(...xs) - 6, x1: Math.max(...xs) + 6, q: -1, N: 26, ph: hash(e.seed, 5) * TAU });
    }
  }
  function renderPlant(L, q, gust) {
    const { e, sw, n, r0, cutR, up, pad, U, base, d32, N } = L, W2 = sw + 2 * pad, len = Math.max(1, up ? cutR : L.r1 - cutR), A = e.amp * gust / U, ph = q / N * TAU + L.ph;
    d32.fill(0);
    for (let r = 0; r < n; r++) {
      const y = r0 + r, dist = Math.max(0, up ? cutR - y : y - cutR) / len;
      const dx = Math.round(A * Math.pow(dist, 1.45) * (Math.sin(ph - dist * 1.7) + .22 * Math.sin(ph * 2.3 - dist * 3.1)));
      d32.set(base.subarray(r * sw, r * sw + sw), r * W2 + pad + Math.max(-pad, Math.min(pad, dx)));
    }
    L.ctx.putImageData(L.img, 0, 0); L.q = q;
  }
  function drawPlants(c, t, vx0, vx1) {
    let budget = 9;                                                                      // перемальовок за кадр (решта — наступного)
    c.save(); c.imageSmoothingEnabled = true;
    for (const L of LP) {
      if (L.x1 < vx0 || L.x0 > vx1) continue;
      const q = Math.floor((t / L.e.per) * L.N) % L.N;
      if (q !== L.q && budget-- > 0) renderPlant(L, q, .8 + .35 * (.5 + .5 * Math.sin(t * .23 + L.ph)) * (.6 + .4 * Math.sin(t * .61 + L.ph * 2)));
      if (L.q < 0) continue;
      const [a, b, cc, d, e, f] = L.M; c.setTransform(...mul(c.__base, [a, b, cc, d, e, f])); c.drawImage(L.cv, -L.pad, L.r0);
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
  const doorOpen = t => { const k = t % 17; return k < 11 ? 0 : k < 11.9 ? (k - 11) / .9 : k < 14.6 ? 1 : k < 15.5 ? 1 - (k - 14.6) / .9 : 0; };
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
  function drawRudik(c, t, vx0, vx1) {
    if (!RUD || typeof drawCat !== 'function') return; const F = faceOf(RUD); if (F.S1[0] < vx0 || F.S0[0] > vx1) return;
    const fw = F.fw, fh = F.fh, T = 13, cyc = Math.floor(t / T), k = t % T, laser = k > 7.2 && k < 8.9, tgt = cyc % 3;
    const pose = k > 9.6 && k < 11.8 ? (k < 10.7 ? 'happy' : 'meow') : 'sit';
    drawCat(pose, 0, t, CATCV, null, laser ? { angry: 1, hot: 1 } : null); const EY = drawCat.eyes;
    c.save(); c.transform(...affOf(F)); c.beginPath(); c.rect(1.4, 1.4, fw - 2.8, fh - 2.8); c.clip();   // у межах рами плаката
    const ch = fh * .41, cw = ch * 32 / 24, cx0 = fw * .48 - cw / 2, cy0 = fh * .668 - ch;
    // віруси: гойдаються; ціль лазера спалахує й зникає, з'являється знову через кілька секунд
    for (let v = 0; v < 3; v++) {
      const [ux, uy] = SLOTS[v], gone = v === tgt && k > 8.5 && k < 12, flash = v === tgt && laser && k > 8.1; if (gone) continue;
      const x = fw * ux + Math.sin(t * 1.3 + v * 2) * .8, y = fh * uy + Math.sin(t * 2.1 + v) * .9, s = Math.min(fw, fh) * .15;
      c.globalAlpha = v === tgt && k < 1.2 && cyc > 0 ? k / 1.2 : 1; c.imageSmoothingEnabled = false; c.drawImage(VIR[v % 2].cv, x - s / 2, y - s / 2, s, s);
      if (flash) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = .9; const g = glow('#ffffff', 4); c.drawImage(g.cv, x - s * .7, y - s * .7, s * 1.4, s * 1.4); c.globalCompositeOperation = 'source-over'; }
    }
    c.globalAlpha = 1;
    if (k > 8.5 && k < 9.4) { const [ux, uy] = SLOTS[tgt], x = fw * ux, y = fh * uy, f = (k - 8.5) / .9;                  // «пуф»: іскри розлітаються
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
      const k = hash(B.dc.pat || 0, 3), a = .07 + .09 * (.5 + .5 * Math.sin(t * (.7 + k * .6) + k * 9)), r = B.w * .5 * (520 / (520 + P(0, 0, 0)[2])), g = glow(B.dc.neon || '#3be8ff', r);
      c.globalAlpha = a; c.drawImage(g.cv, p[0] - r, p[1] - r, r * 2, r * 2);
    }
    for (const B of ART) {
      const { P } = basis(B), w = B.w, H = B.yb - B.yt, z = P(0, B.dep / 2, B.yb)[2], s = 520 / (520 + z), at = (u, v, y) => proj(P(u, v, y)), k = B.dc.kind;
      const c0 = at(0, B.dep / 2, B.yb); if (c0[0] < vx0 - 20 || c0[0] > vx1 + 20) continue;
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
        const m = affOf(F), sc = Math.min(F.fw, F.fh) / 40, hx = F.fw * .82, hy = F.fh * .28, k = t % 1.25, beat = Math.max(0, Math.sin(Math.min(1, k / .18) * Math.PI)) + .7 * Math.max(0, Math.sin(Math.min(1, Math.max(0, k - .24) / .18) * Math.PI));
        c.save(); c.transform(...m); const g = glow('#ff4fd8', 6 * sc); c.globalAlpha = .25 + .45 * beat; c.drawImage(g.cv, hx - 6 * sc, hy - 6 * sc, 12 * sc, 12 * sc);
        const fl = t % 11; if ((fl > 4 && fl < 4.07) || (fl > 4.16 && fl < 4.21)) { c.globalCompositeOperation = 'source-over'; c.globalAlpha = .6; c.fillStyle = '#04020c'; c.fillRect(0, 0, F.fw, F.fh); }
        c.restore();
      }
    }
    if (GREEN) { const { P } = basis(GREEN), p = proj(P(0, GREEN.dep / 2, GREEN.yb - (GREEN.yb - GREEN.yt) * .4)), r = GREEN.w * .45;   // міні-оранжерея: фітолампа «дихає»
      if (p[0] > vx0 - 20 && p[0] < vx1 + 20) { c.globalAlpha = .12 + .1 * Math.sin(t * 1.1); const g = glow('#ff6ae0', r); c.drawImage(g.cv, p[0] - r, p[1] - r, r * 2, r * 2); } }
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
    const R = ROUTES[v]; if (!R || R.length < 2) return null; const n = R.length, T = n * 3.4, u = ((t + v * 7) % T) / 3.4, i = Math.floor(u), f = u - i, a = R[i % n], b = R[(i + 1) % n], e = f * f * (3 - 2 * f);
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

  // =============================== КАДР ===============================
  NX.decorLive = {
    LP, LED,
    /** Для tools/wingbox/decor_check.js: усе живе цього файлу в крайніх положеннях — на контекст у координатах кімнати
     *  (рослини — обидва крайні нахили з поривом; метелики, листочки, світлячки — точки за 2 хвилини). */
    extentTo(c) {
      buildPlants(1e9); const m0 = c.getTransform(), base = [m0.a, m0.b, m0.c, m0.d, m0.e, m0.f]; c.save(); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
      for (const L of LP) for (const q of [Math.round(L.N / 4), Math.round(L.N * 3 / 4)]) { renderPlant(L, q, 1.2); c.setTransform(...mul(base, L.M)); c.drawImage(L.cv, -L.pad, L.r0); }
      c.setTransform(m0); c.fillStyle = '#fff';
      for (let k = 0; k < 2400; k++) { const t = k * .05;
        for (let v = 0; v < ROUTES.length; v++) { const B = butterflyAt(v, t); if (B) c.fillRect(B.x - 2.2, B.y - 1.6, 4.4, 3.2); }
        for (const f of FLY2) { const x = f.x + Math.sin(t * (.27 + hash(f.sd, 1) * .2) + f.sd) * f.ax, y = f.y + Math.sin(t * (.39 + hash(f.sd, 2) * .2) + f.sd * 2) * f.ay; c.fillRect(x - .6, y - .6, 1.2, 1.2); }
      }
      c.restore(); LP.forEach(L => { L.q = -1; });
    },
    draw(c, t, Rd, vx0, vx1) {
      buildPlants();
      const m = c.getTransform(); c.__base = [m.a, m.b, m.c, m.d, m.e, m.f];
      maskedDraw(c, 'door', t, Rd, vx0, vx1, paintDoor);
      maskedDraw(c, 'pylon', t, Rd, vx0, vx1, paintGlass);
      drawPylonBits(c, t, vx0, vx1);
      drawLED(c, t, vx0, vx1);
      drawArt(c, t, vx0, vx1);
      drawRudik(c, t, vx0, vx1);
      drawPlants(c, t, vx0, vx1);
      drawLeaves(c, t, vx0, vx1);
      drawButterflies(c, t, vx0, vx1);
      drawFlies2(c, t, vx0, vx1);
    },
  };
})();
