/* ============================================================================
 * objects/decor.js — ДЕКОР СТІН: ЖИВЕ (риби, медузи, бульбашки, світіння)
 * ----------------------------------------------------------------------------
 * Нерухоме декору — у растрі крила (objects/dc_paint.js, розкладка tools/wingbox/decor.py). Тут — те, що рухається, і
 * його небагато (власник: «живого — небагато й вразбіг»):
 *   • два акваріуми: РИФ над аналітикою (морські риби), МЕДУЗАРІЙ між аналітикою й маркетингом (медузи) — КОЖНА ІСТОТА
 *     СВОГО ВИДУ, жодна не повторюється (власник: «щоб нічого не повторювалось»); на правій стіні за маніпулятором — (· 13)
 *     ВЕРТИКАЛЬНА ФЕРМА NEXI (те саме полотно й маска, що в акваріумів; малює objects/decor_farm.js);
 *     бульбашки від розпилювачів;
 *   • тепле мерехтіння ліхтаря й світних грибів на антресолі;
 *   • (Декор стін · 3) ДРОН-ПОЛИВАЛЬНИК облітає рослини (аквапоніка, антресоль, висячий сад під нею), зависає й розпилює воду;
 *     СВІТЛЯЧКИ біля висячої зелені лівого крила;
 *   • (Декор стін · 4) решту живого — рослини, що гойдаються, пілон, плакат Рудика, штучки в сотах — малює objects/decor_live.js
 *     (кличеться звідси, між рибами й дроном).
 * Як риби опиняються «за склом»: скло акваріумів — предмети-вікна dc_rfg* / dc_tbg* / dc_jellyg (лицьова грань — малюнок
 * води); рушій рахує для них маску видимих пікселів з z-буфера (NX.arc.LIVE[id] з draw -> false: самі вікна не
 * перемальовуються), а тут маски зливаються в одну на акваріум. Риба має точку в об'ємі акваріума (світ) -> екран
 * (X.proj), розмір — за глибиною; усі риби акваріума — на одне полотно, потім «destination-in» маскою скла: те, що
 * попереду (рами, стійки, вазони, зони), лишається попереду.
 * Спрайти — піксель-арт кодом (4 px на одиницю світу, темний контур), два кадри (хвіст / плавці), у медуз — чотири (пульс).
 * ========================================================================== */
(() => {
  const X = NX.px3d, LIVE = NX.arc.LIVE, hash = NX.art.hash, PZ = NX.persp, D2R = Math.PI / 180;
  const NOP = { every: 1e9, draw: () => false };                                     // вікно: лише маска (вміст малює цей файл)
  for (let k = 0; k < 12; k++) { LIVE['dc_rfg' + k] = NOP; } LIVE.dc_jellyg = NOP; LIVE.dc_door = NOP; LIVE.dc_pyg = NOP;   // (· 4) двері й колба пілона; (· 10) скло контейнера хижаків

  // ---------- піксель-арт спрайти ----------
  const PX = 4, OUTC = [6, 3, 19];
  const hex = h => { const n = parseInt(h.slice(1, 7), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  const lerp = (a, b, t) => a.map((v, k) => Math.round(v + (b[k] - v) * t));
  /** Спрайт W×H пікселів: draw(S) малює через S.set(x, y, колір|[r,g,b], альфа); потім — темний контур навколо (окрім
   *  напівпрозорого: медузи). -> {cv, w, h} (w, h — одиниці світу). */
  function sprite(W, H, draw, outline = true) {
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d'), im = c.createImageData(W, H), d = im.data;
    const S = {
      W, H,
      set(x, y, cc, a = 255) { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= W || y >= H) return; const q = (y * W + x) * 4, v = typeof cc === 'string' ? hex(cc) : cc; d[q] = v[0]; d[q + 1] = v[1]; d[q + 2] = v[2]; d[q + 3] = a; },
      get: (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? 0 : d[(y * W + x) * 4 + 3],
      ell(cx, cy, rx, ry, f, a) { for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) { const u = (x + .5 - cx) / rx, v = (y + .5 - cy) / ry; if (u * u + v * v <= 1) { const cc = typeof f === 'function' ? f(x, y, u, v) : f; if (cc) S.set(x, y, cc, a); } } },
      tri(p, f, a) { const [A, B, C] = p, x0 = Math.floor(Math.min(A[0], B[0], C[0])), x1 = Math.ceil(Math.max(A[0], B[0], C[0])), y0 = Math.floor(Math.min(A[1], B[1], C[1])), y1 = Math.ceil(Math.max(A[1], B[1], C[1]));
        const ar = (B[0] - A[0]) * (C[1] - A[1]) - (C[0] - A[0]) * (B[1] - A[1]); if (!ar) return;
        for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const px = x + .5, py = y + .5, w0 = ((B[0] - px) * (C[1] - py) - (C[0] - px) * (B[1] - py)) / ar, w1 = ((C[0] - px) * (A[1] - py) - (A[0] - px) * (C[1] - py)) / ar, w2 = 1 - w0 - w1;
          if (w0 >= 0 && w1 >= 0 && w2 >= 0) { const cc = typeof f === 'function' ? f(x, y, w0, w1, w2) : f; if (cc) S.set(x, y, cc, a); } } },
      line(x0, y0, x1, y1, cc, a, w = 1) { const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 1.5) + 1; for (let k = 0; k <= n; k++) { const t = k / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t; for (let q = 0; q < w; q++) S.set(x + (q % 2), y + (q >> 1), typeof cc === 'function' ? cc(t) : cc, a); } },
    };
    draw(S);
    if (outline) { const o = new Uint8Array(W * H); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] < 200 && (S.get(x - 1, y) > 200 || S.get(x + 1, y) > 200 || S.get(x, y - 1) > 200 || S.get(x, y + 1) > 200)) o[y * W + x] = 1;
      for (let q = 0; q < W * H; q++) if (o[q]) { d[q * 4] = OUTC[0]; d[q * 4 + 1] = OUTC[1]; d[q * 4 + 2] = OUTC[2]; d[q * 4 + 3] = 255; } }
    c.putImageData(im, 0, 0); return { cv, w: W / PX, h: H / PX };
  }
  const ramp = (cols, t) => { const P = cols.map(hex), k = Math.max(0, Math.min(P.length - 1.001, t * (P.length - 1))), i = Math.floor(k); return lerp(P[i], P[i + 1] || P[i], k - i); };
  const eye = (S, x, y, big) => { S.set(x, y, '#ffffff'); S.set(x + 1, y, '#ffffff'); S.set(x, y + 1, '#ffffff'); S.set(x + 1, y + 1, '#101018'); if (big) { S.set(x - 1, y, '#ffffff'); S.set(x - 1, y + 1, '#ffffff'); S.set(x, y + 2, '#ffffff'); S.set(x + 1, y + 2, '#101018'); S.set(x, y - 1, '#ffffff'); } };
  /** Хвіст-віяло позаду тіла (x0 — корінь, ph — кадр: кінчик угору / вниз). */
  const tail = (S, x0, cy, len, h, ph, f) => S.tri([[x0, cy], [x0 - len, cy - h + ph], [x0 - len, cy + h + ph]], f);

  // ---- МОРСЬКІ (риф) ----
  const SPR = {
    clown: ph => sprite(30, 17, S => {                                                 // рибка-клоун: помаранчева з трьома білими смугами в чорній облямівці
      tail(S, 7, 8.5, 6, 5, ph, (x) => x < 3 ? '#1a1010' : '#ff8a2a');
      S.tri([[12, 4], [19, 1 + ph * .5], [21, 4]], '#ff8a2a'); S.tri([[14, 13], [18, 16], [20, 13]], '#ff8a2a');
      S.ell(16, 8.5, 10, 6, (x, y, u, v) => { const bands = [21.5, 15.5, 9.5]; for (const b of bands) { const dd = Math.abs(x + .5 - b); if (dd < 1.4) return '#fff8f0'; if (dd < 2.1) return '#1a1010'; } return ramp(['#c8400a', '#ff7a1a', '#ffb050'], .35 - v * .45 + .2); });
      eye(S, 22, 6);
    }),
    tang: ph => sprite(32, 20, S => {                                                  // синій хірург: королівська синява, чорна «палітра», жовтий хвіст
      tail(S, 7, 10, 6, 6, ph, '#ffd820');
      S.ell(17, 10, 11, 7.5, (x, y, u, v) => { const pal = Math.abs(v + .05 - .55 * Math.sin((u + 1) * 1.6)) < .16 && u > -.75 && u < .55; if (pal) return '#0a0a2a'; return ramp(['#1838c0', '#2a5ae8', '#4a8aff'], .55 - v * .35); });
      S.tri([[16, 12], [20, 15 + ph * .5], [21, 11]], '#ffd820'); eye(S, 24, 7);
    }),
    ytang: ph => sprite(26, 24, S => {                                                 // жовтий хірург: диск, гострий носик, біла цятка біля хвоста
      tail(S, 6, 12, 5, 5, ph, '#ffe040');
      S.ell(14, 12, 9, 9.5, (x, y, u, v) => ramp(['#e8b800', '#ffd820', '#fff070'], .6 - v * .3 + u * .1));
      S.tri([[21, 10], [25, 12], [21, 14]], '#ffd820'); S.set(7, 12, '#ffffff'); S.set(8, 12, '#ffffff');
      S.tri([[9, 3], [16, 1], [19, 4]], '#f0c800'); eye(S, 18, 9);
    }),
    mandarin: ph => sprite(22, 13, S => {                                              // мандаринка: психоделічні хвилі помаранчевого й синього
      tail(S, 5, 6.5, 4, 4, ph, '#2a6aff');
      S.ell(12, 6.5, 7.5, 4.6, (x, y, u, v) => { const w = Math.sin(x * .9 + Math.sin(y * 1.3) * 2); return w > .35 ? '#ff7a1a' : w > -.2 ? '#2a6aff' : '#3be8ff'; });
      S.tri([[8, 2], [13, 0 + ph * .4], [15, 2]], '#ff7a1a'); eye(S, 16, 4);
    }),
    idol: ph => sprite(26, 30, S => {                                                  // мавританський ідол: вертикальні смуги, довга біла нитка спинного плавця
      tail(S, 6, 17, 5, 4, ph, '#101018');
      S.ell(14, 17, 8.5, 8.5, (x) => x < 9 ? '#f4f0e8' : x < 12 ? '#101018' : x < 16 ? '#ffd820' : x < 18 ? '#101018' : '#f4f0e8');
      S.tri([[19, 16], [25, 18], [19, 20]], '#ff8a3a');
      for (let k = 0; k < 13; k++) S.set(12 - k * .7 + ph * (k / 13), 8 - k * .6, '#f4f0e8');
      eye(S, 18, 14);
    }),
    puffer: ph => sprite(22, 20, S => {                                                // рибка-їжак: кругла, плямиста, великі очі
      tail(S, 4, 10, 3, 3, ph, '#e8d8a0');
      S.ell(11.5, 10, 7.8, 7.4, (x, y, u, v) => { if (v > .35) return '#fff8e8'; return hash(x >> 1, y >> 1) > .72 ? '#7a5a2a' : ramp(['#c8b070', '#f0e0a0'], .7 - v * .4); });
      for (const [x, y] of [[6, 4], [10, 2], [15, 3], [18, 7], [4, 9]]) S.set(x, y, '#5a4020');
      eye(S, 15, 7, 1); S.set(18, 11, '#c86a5a');
    }),
    seahorse: ph => sprite(14, 28, S => {                                              // коник: S-подібне тіло, кільця, закручений хвіст
      const body = [[7, 6], [8, 9], [8, 12], [7, 15], [6, 18], [6, 21], [8, 23], [9, 21]];
      body.forEach(([x, y], k) => S.ell(x, y, k < 4 ? 3.2 : 2.4 - k * .15, 1.9, (xx, yy) => ((yy % 3) ? ramp(['#c86a10', '#ffa020', '#ffd060'], .5 + (xx - x) * .12) : '#a8500a')));
      S.ell(8, 4, 3, 2.6, '#ffa020'); S.tri([[10, 3], [13.5, 4.5], [10, 5.5]], '#e88a18'); S.tri([[6, 1], [8, 0], [9, 2]], '#ffd060');
      S.tri([[3, 9 + ph], [5, 12], [3, 14 + ph]], '#ffe090'); eye(S, 8, 3);
    }),
  };
  // ---- ПРІСНОВОДНІ (акватруба) ----
  Object.assign(SPR, {
    betta: ph => sprite(32, 26, S => {                                                 // півник: малиново-фіолетові шлейфи плавців, сині лусочки
      S.tri([[12, 11], [0, 2 + ph * 1.5], [1, 24 + ph]], (x, y) => ramp(['#7a2ad8', '#c81a6a', '#ff3a6a'], x / 12));
      S.tri([[14, 8], [10, 1 + ph], [20, 6]], '#a01a5a'); S.tri([[14, 13], [11, 23 - ph], [21, 13]], '#8a1a8a');
      S.ell(19, 10, 7.5, 3.6, (x, y, u, v) => hash(x, y) > .7 ? '#3a8aff' : ramp(['#8a0a3a', '#c81a4a', '#ff4a6a'], .55 - v * .3));
      eye(S, 23, 9);
    }),
    axolotl: ph => sprite(34, 16, S => {                                               // аксолотль: рожевий, зябра-«пір'ячко», усмішка
      S.tri([[10, 8], [0, 6 + ph], [0, 10 + ph]], '#ffc8d8');
      S.ell(16, 8.5, 10, 3.6, (x, y, u, v) => ramp(['#e88aa8', '#ffb0c8', '#ffe0ea'], .6 - v * .4));
      S.ell(27, 8, 4.5, 4, (x, y, u, v) => ramp(['#e88aa8', '#ffb8cc', '#ffe8f0'], .7 - v * .3));
      for (const s of [-1, 1]) for (let k = 0; k < 3; k++) { const x0 = 24, y0 = 8 + s * 2, a = s * (.6 + k * .35); for (let q = 0; q < 4; q++) S.set(x0 - q * Math.cos(a) * .9 - k * .6, y0 + s * q * .9 + (s < 0 ? -k : k) * .3, q % 2 ? '#ff4f9a' : '#ff7ab8'); }
      for (const [x, y] of [[12, 12], [20, 12], [13, 4.5], [21, 4.5]]) S.set(x + ph * .5, y, '#e88aa8');
      S.set(29, 7, '#101018'); S.set(30, 9, '#a04060'); S.set(29, 10, '#a04060');
    }),
    koi: ph => sprite(34, 16, S => {                                                   // короп кої: білий з червоно-помаранчевими плямами
      tail(S, 8, 8, 7, 5, ph, '#f4e8e0');
      S.ell(19, 8, 12, 4.8, (x, y, u, v) => { const n = Math.sin(x * .45) + Math.cos(y * .9 + x * .2); return n > .6 || (u > .55 && v < 0) ? '#ff4a1a' : ramp(['#d8d0cc', '#f8f4f0', '#ffffff'], .6 - v * .3); });
      S.tri([[16, 12], [19, 15 + ph * .4], [21, 12]], '#f4e8e0'); S.set(31, 10, '#c88a6a'); S.set(32, 11, '#c88a6a'); eye(S, 27, 6);
    }),
    discus: ph => sprite(26, 26, S => {                                                // дискус: бірюзовий диск з червоними хвилями
      tail(S, 5, 13, 4, 4, ph, '#2ab8a8');
      S.ell(14, 13, 9.5, 9.8, (x, y) => (Math.sin(y * .9 + Math.sin(x * .55) * 1.6) > .55 ? '#ff4a3a' : ramp(['#1a9a9a', '#2ad8c8', '#8af8e8'], .5 + (x - 14) * .02)));
      S.set(19, 10, '#ff2a2a'); S.set(20, 10, '#101018');
    }),
    tetra: ph => sprite(18, 9, S => {                                                  // неонова тетра: світна блакитна смуга, червоний задок
      tail(S, 4, 4.5, 3, 3, ph, '#c8d8e8');
      S.ell(10, 4.5, 6.5, 2.7, (x, y, u, v) => v < -.05 && v > -.6 ? '#3bf0ff' : v >= -.05 && u < .1 ? '#ff2a3a' : v > 0 ? '#e8f0ff' : '#5a6a8a');
      eye(S, 14, 3);
    }),
    glow: ph => sprite(20, 10, S => {                                                  // світна рибка: флуоресцентна лаймова з темними смугами
      tail(S, 5, 5, 4, 3.5, ph, '#b8ff3a');
      S.ell(11.5, 5, 7, 3.2, (x) => x % 4 === 0 ? '#3a8a1a' : ramp(['#7aff3a', '#d8ff8a'], .5));
      eye(S, 15, 3);
    }),
    shrimp: ph => sprite(14, 10, S => {                                                // креветка «вишня»: червона, сегменти, вусики
      for (let k = 0; k < 6; k++) S.ell(3 + k * 1.6, 5 + Math.sin(k * .6) * 1.2, 1.6, 1.8, k % 2 ? '#e81a2a' : '#ff4a4a');
      S.line(11, 4, 13.5, 0 + ph, '#ff8a8a'); S.line(11, 4, 13.5, 2 - ph, '#ff8a8a'); for (let k = 0; k < 4; k++) S.set(4 + k * 1.6, 8 + (k + ph) % 2, '#c81a2a');
      S.set(11, 4, '#101018');
    }),
  });
  // ---- МЕДУЗИ (4 кадри пульсу: p 0..1; напівпрозорі — без контуру) ----
  const jelly = {
    moon: p => sprite(40, 34, S => {                                                   // аурелія: прозорий дзвін з чотирма рожевими підковами, коротка бахрома
      const k = 1 - p * .2, cy = 12, rx = 17 * (1 + p * .12), ry = 10 * k;
      S.ell(20, cy, rx, ry, (x, y, u, v) => v > 0 ? null : ramp(['#7aa8e8', '#c8e0ff', '#f0f8ff'], .5 - v * .4), 150);
      for (let q = 0; q < 4; q++) { const a = q / 4 * Math.PI + .4, x = 20 + Math.cos(a) * rx * .45; S.ell(x, cy - ry * .35, 2.3, 1.6, (xx, yy, u, v) => (u * u + v * v > .35 ? '#ff8ac8' : null), 220); }
      for (let x = Math.ceil(20 - rx); x < 20 + rx; x++) for (let q = 0; q < 4 + (x % 3); q++) S.set(x, cy + 1 + q + Math.sin(x * .7 + p * 6) * .8, '#c8e0ff', 120);
      for (const s of [-1, 1]) for (let q = 0; q < 14; q++) S.set(20 + s * (2 + Math.sin(q * .5 + p * 5) * 1.4), cy + 2 + q, '#f0c8ff', 170);
    }, false),
    nettle: p => sprite(34, 72, S => {                                                 // морська кропива: золотий смугастий дзвін, довгі червоні щупальця, білі «рюші»
      const cy = 11, rx = 13 * (1 + p * .1), ry = 9 * (1 - p * .18);
      S.ell(17, cy, rx, ry, (x, y, u, v) => v > .05 ? null : (Math.abs(Math.sin(Math.atan2(v, u) * 8)) < .3 ? '#c85a10' : ramp(['#e87a1a', '#ffa83a', '#ffd88a'], .5 - v * .4)), 210);
      for (let t = 0; t < 8; t++) { const x0 = 17 + (t - 3.5) * rx / 4.2; for (let q = 0; q < 52; q++) S.set(x0 + Math.sin(q * .18 + t + p * 6) * (1 + q * .05), cy + 1 + q, t % 2 ? '#c83a1a' : '#ff6a3a', 190); }
      for (let t = 0; t < 4; t++) { const x0 = 17 + (t - 1.5) * 2.2; for (let q = 0; q < 34; q++) { const x = x0 + Math.sin(q * .25 + t * 2 + p * 6) * 2; S.set(x, cy + 2 + q, '#fff0f0', 230); if (q % 3 === 0) S.set(x + 1, cy + 2 + q, '#ffd8e8', 200); } }
    }, false),
    comb: p => sprite(20, 30, S => {                                                   // реброплав: прозорий овал, веселкові гребні (переливаються з кадром)
      S.ell(10, 15, 7, 13, (x, y, u, v) => (Math.abs(u) > .88 ? '#c8f0ff' : null), 160);
      for (let r = 0; r < 4; r++) { const x = 10 + (r - 1.5) * 3; for (let y = 4; y < 27; y++) { if (Math.abs(x - 10) / 7 > Math.sqrt(Math.max(0, 1 - ((y - 15) / 13) ** 2)) * .95) continue; const h = (y * .12 + p + r * .2) % 1; S.set(x, y, ramp(['#3be8ff', '#ff4fd8', '#3bff8a', '#ffd27a', '#3be8ff'], h), 255); } }
      S.ell(10, 15, 2, 5, '#e8f8ff', 90);
    }, false),
    crystal: p => sprite(36, 46, S => {                                                // кришталева: майже прозорий дзвін, світне зелено-блакитне кільце, тонкі щупальця
      const cy = 12, rx = 15 * (1 + p * .12), ry = 10 * (1 - p * .18);
      S.ell(18, cy, rx, ry, (x, y, u, v) => v > 0 ? null : (u * u + v * v > .82 ? '#7affd8' : '#d8f8ff'), 110);
      for (let a = 0; a < 16; a++) { const t = a / 16 * Math.PI; S.line(18, cy - ry + 1, 18 + Math.cos(t) * rx * .95, cy - Math.sin(t) * ry * .1, '#b8fff0', 120); }
      for (let x = Math.ceil(18 - rx); x <= 18 + rx; x++) S.set(x, cy, '#5affc8', 255);
      for (let t = 0; t < 14; t++) { const x0 = 18 + (t - 6.5) * rx / 7.5; for (let q = 0; q < 30; q++) S.set(x0 + Math.sin(q * .2 + t + p * 6) * .8, cy + 1 + q, '#c8fff0', 110); }
    }, false),
    flower: p => sprite(30, 40, S => {                                                 // «квітковий капелюх»: смугастий дзвін, щупальця стирчать з дзвона — кольорові кінчики
      const cy = 13, rx = 11 * (1 + p * .1), ry = 9.5 * (1 - p * .16);
      S.ell(15, cy, rx, ry, (x, y, u, v) => v > .1 ? null : (((y + 40) % 3) ? ramp(['#c8a0e8', '#f0e0ff'], .6 - v * .3) : '#a07ad8'), 180);
      const tips = ['#ff4fd8', '#ffd27a', '#3bff8a', '#ff9a3a', '#3be8ff'];
      for (let t = 0; t < 18; t++) { const a = Math.PI * (t / 17), x0 = 15 - Math.cos(a) * rx * .9, y0 = cy - Math.sin(a) * ry * .8, l = 5 + (t % 3) * 2;
        for (let q = 0; q < l; q++) S.set(x0 - Math.cos(a) * q * .25 + Math.sin(q * .5 + p * 6) * .5, y0 + q * .9, q > l - 3 ? tips[t % 5] : '#f0d8ff', q > l - 3 ? 255 : 160); }
      for (let q = 0; q < 16; q++) S.set(15 + Math.sin(q * .4 + p * 5), cy + 2 + q, '#ff8ac8', 200);
    }, false),
  };
  const BUB = sprite(8, 8, S => { S.ell(4, 4, 3.5, 3.5, (x, y, u, v) => (u * u + v * v > .45 ? '#c8f8ff' : null), 220); S.set(3, 2, '#ffffff'); }, false);
  // кеш кадрів: SPR[kind](ph) — 2 кадри; медузи — 4
  const FR = {}; const frame = (kind, f) => { const key = kind + f; return FR[key] || (FR[key] = SPR[kind] ? SPR[kind](f ? 1 : -1) : jelly[kind](f / 4)); };

  // ---------- акваріуми з розкладки ----------
  const LAY = NX.arcLayout || {}, items = [...((LAY.left || {}).items || []), ...((LAY.right || {}).items || [])], byId = {};
  items.forEach(B => byId[B.id] = B);
  const wins = aq => items.filter(B => B.st === 'dc_win' && B.dc && B.dc.aq === aq);
  const AQ = {};
  (() => {
    const rf = wins('reef'); if (rf.length) { const d = rf[0].dc; AQ.reef = { ids: rf.map(B => B.id), C: d.C, R: d.R, sgn: d.sgn, a0: Math.min(...rf.map(B => B.dc.sa)), a1: Math.max(...rf.map(B => B.dc.sb)), P: d.P, top: d.top, bot: d.bot }; }
    const vw = items.filter(B => B.st === 'dc_farm').sort((p, q) => p.dc.i - q.dc.i);     // (· 13) ферма: нутро — грань сегментів рами (між кришкою й тумбою); маска — многокутник (poly), живе — objects/decor_farm.js
    if (vw.length) { const d = vw[0].dc, ov = d.ov == null ? .5 : d.ov, segs = vw.map(B => B.dc), poly = [];
      const pt = (q, a, ins, y) => { const rad = q.R - ins; return [q.C[0] + q.sgn * rad * Math.sin(a * D2R), y, q.C[1] + rad * Math.cos(a * D2R)]; };
      segs.forEach(q => poly.push(X.proj(pt(q, q.sa, q.P - .4, q.yta + q.lid - ov)), X.proj(pt(q, q.sb, q.P - .4, q.ytb + q.lid - ov))));
      [...segs].reverse().forEach(q => poly.push(X.proj(pt(q, q.sb, q.P - .4, q.ybb - q.base + ov)), X.proj(pt(q, q.sa, q.P - .4, q.yba - q.base + ov))));
      AQ.farm = { ids: [], segs, poly, ov, pt }; }
    const jl = wins('jelly'); if (jl.length) { const d = jl[0].dc; AQ.jelly = { ids: jl.map(B => B.id), cx: d.cx, cz: d.cz, r: d.r, top: d.top, bot: d.bot }; }
    for (const aq of ['door', 'pylon']) { const w = wins(aq); if (w.length) AQ[aq] = { ids: w.map(B => B.id), B: w[0] }; }   // (· 4) вікна пілона: малює objects/decor_live.js
  })();
  const arcPt = (A, a, d, y) => { const rad = A.R - d; return [A.C[0] + A.sgn * rad * Math.sin(a * D2R), y, A.C[1] + rad * Math.cos(a * D2R)]; };
  const sOf = z => PZ.D / (PZ.D + z);
  // мешканці: kind, розмір (од. світу, довжина), швидкість, зерно; кожен вид — один раз
  const CREW = {
    reef: [['clown', 8.8, 1, 1], ['tang', 10.5, .8, 2], ['ytang', 8.8, .7, 3], ['mandarin', 6.8, .35, 4], ['idol', 9.5, .6, 5], ['puffer', 7.4, .3, 6], ['seahorse', 8.6, .12, 7]],
    jelly: [['moon', 16, 1, 21], ['nettle', 14, 1, 22], ['comb', 8.5, 1, 23], ['crystal', 14.5, 1, 24], ['flower', 12.5, 1, 25]],
  };
  /** Де мешканець зараз (світ) і куди дивиться: плавна «прогулянка» сумою синусоїд у межах об'єму акваріума. */
  function where(aq, A, m, k, t) {
    const own = NX.decorAqua && NX.decorAqua.where(aq, A, m, t); if (own) return own;             // (· 5) особлива поведінка: рибка-клоун — в анемоні
    const [kind, , sp, sd] = m, h = q => hash(sd * 7 + q, 3), w = .045 * sp * (.8 + .4 * h(1)), ph = h(2) * 6.28;
    if (aq === 'jelly') {
      const yT = A.top + 9, yB = A.bot - 14, yy = yT + (yB - yT) * (.5 + .45 * Math.sin(t * (.018 + .01 * h(3)) + ph)) - 1.4 * Math.max(0, Math.sin(t * (1.3 + .4 * h(4)) * 6.28 / 6.28 * 3.14));
      const th = h(5) * 6.28 + t * .05 * (h(6) - .5), rr = (A.r - 8) * (.2 + .6 * h(7));
      return { p: [A.cx + Math.cos(th) * rr, yy, A.cz + Math.sin(th) * rr], dir: 1 };
    }
    const span = A.a1 - A.a0, u = .5 + .42 * Math.sin(t * w + ph) + .06 * Math.sin(t * w * 2.7 + ph * 2), a = A.a0 + 1.2 + (span - 2.4) * u;
    const da = Math.cos(t * w + ph) + .16 * 2.7 * Math.cos(t * w * 2.7 + ph * 2), dir = da * A.sgn;
    const low = kind === 'mandarin' ? .9 : kind === 'seahorse' ? .35 + .25 * Math.sin(t * .3 + ph) : .15 + .6 * h(8);   // риф (і запас для хижаків без decor_aqua)
    const y = A.top + 6 + (A.bot - A.top - 10) * Math.max(0, Math.min(1, low + .12 * Math.sin(t * w * 1.7 + ph * 3))), d = 2 + (A.P - 4) * (.5 + .45 * Math.sin(t * w * .8 + ph * 5));
    return { p: arcPt(A, a, d, y), dir };
  }
  /** Бульбашки: струмені від розпилювачів (світ). */
  const STREAMS = {
    reef: A => [[A.a0 + (A.a1 - A.a0) * .3, A.P * .4], [A.a0 + (A.a1 - A.a0) * .78, A.P * .6]].map(([a, d]) => ({ p: arcPt(A, a, d, A.bot - 2), h: A.bot - A.top - 6, n: 7 })),
    jelly: A => [{ p: [A.cx + A.r * .5, A.bot - 2, A.cz - 2], h: A.bot - A.top - 8, n: 12 }],
  };

  // ---------- маски скла (з рушія) ----------
  const MK = {}; let lastL = null, lastR = null;
  function buildMasks() {
    const SD = NX.arc.scene && NX.arc.scene.SIDES; if (!SD) return false;
    const L = SD.left, R = SD.right; if (L === lastL && R === lastR) return true; lastL = L; lastR = R;
    const live = [...((L && L.live) || []), ...((R && R.live) || [])];
    for (const aq of Object.keys(AQ)) {
      if (AQ[aq].poly) { if (!MK[aq]) { const Rm = 3, pl = AQ[aq].poly, x0 = Math.floor(Math.min(...pl.map(p => p[0]))), y0 = Math.floor(Math.min(...pl.map(p => p[1]))), x1 = Math.ceil(Math.max(...pl.map(p => p[0]))), y1 = Math.ceil(Math.max(...pl.map(p => p[1])));   // (· 13) маска з многокутника (нутро ферми)
          const cv = document.createElement('canvas'); cv.width = Math.ceil((x1 - x0) * Rm); cv.height = Math.ceil((y1 - y0) * Rm); const c = cv.getContext('2d'); c.scale(Rm, Rm); c.fillStyle = '#fff'; c.beginPath(); pl.forEach((p, k) => k ? c.lineTo(p[0] - x0, p[1] - y0) : c.moveTo(p[0] - x0, p[1] - y0)); c.closePath(); c.fill();
          MK[aq] = { cv, x: x0, y: y0, w: x1 - x0, h: y1 - y0 }; } continue; }
      const es = live.filter(E => AQ[aq].ids.includes(E.id) && E.mask); if (!es.length) { delete MK[aq]; continue; }
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; es.forEach(({ mask: m }) => { x0 = Math.min(x0, m.x); y0 = Math.min(y0, m.y); x1 = Math.max(x1, m.x + m.w); y1 = Math.max(y1, m.y + m.h); });
      const Rm = 3, cv = document.createElement('canvas'); cv.width = Math.ceil((x1 - x0) * Rm); cv.height = Math.ceil((y1 - y0) * Rm); const c = cv.getContext('2d');
      es.forEach(({ mask: m }) => c.drawImage(m.cv, (m.x - x0) * Rm, (m.y - y0) * Rm, m.w * Rm, m.h * Rm));
      MK[aq] = { cv, x: x0, y: y0, w: x1 - x0, h: y1 - y0, out: MK[aq] && MK[aq].out };
    }
    return true;
  }

  // ---------- світіння на антресолі (без маски: це світло) ----------
  const glowSpr = (hx, r) => { const cv = document.createElement('canvas'), n = 64; cv.width = cv.height = n; const c = cv.getContext('2d'), g = c.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2), [rr, gg, bb] = hex(hx);
    g.addColorStop(0, `rgba(${rr},${gg},${bb},.9)`); g.addColorStop(.35, `rgba(${rr},${gg},${bb},.35)`); g.addColorStop(1, `rgba(${rr},${gg},${bb},0)`); c.fillStyle = g; c.fillRect(0, 0, n, n); return { cv, r }; };
  const GLOWS = [];
  (() => {
    const at = (id, k) => { const B = byId[id]; if (!B) return null; const { P } = NX.arc.kit.basis(B); return X.proj(P(0, B.dep / 2, B.yt + (B.yb - B.yt) * k)); };
    const ln = at('dc_lantern', .62); if (ln) GLOWS.push({ p: ln, s: glowSpr('#ffb24a', 9), a: t => .32 + .1 * Math.sin(t * 9.1) * Math.sin(t * 3.7) + .06 * Math.sin(t * 23) });
    const shr = items.find(B => B.dc && B.dc.kind === 'shroom'); const sh = shr && at(shr.id, .45); if (sh) GLOWS.push({ p: sh, s: glowSpr('#3be8ff', 8), a: t => .2 + .12 * (.5 + .5 * Math.sin(t * 1.3)) });
  })();

  // ---------- ДРОН-ПОЛИВАЛЬНИК (Декор стін · 3): облітає рослини антресолі й макраме (· 10: аквапоніки над трубою вже немає), зависає й розпилює воду ----------
  const DRONE = sprite(24, 14, S => {
    S.ell(12, 7.5, 6.2, 3.4, (x, y, u, v) => v < -.2 ? '#f0f4ff' : v < .35 ? '#c8d0ec' : '#8a92b8');                   // корпус
    for (let x = 12; x < 17; x++) S.set(x, 6, '#101830'); S.set(15, 6, '#3be8ff'); S.set(16, 6, '#9af6ff');           // візор з «оком»
    S.line(6, 6, 2.5, 4, '#6a7298'); S.line(18, 6, 21.5, 4, '#6a7298');                                                // кронштейни гвинтів
    S.ell(2.5, 3.6, 1.4, 1, '#3a4268'); S.ell(21.5, 3.6, 1.4, 1, '#3a4268');                                             // мотори
    S.ell(12, 12, 3.4, 1.9, (x, y, u, v) => u < -.3 && v < 0 ? '#c8e8ff' : '#3a8aff'); S.set(12, 13, '#1a2040');       // бачок з водою, сопло
  });
  const ROUTE_ID = ['dc_mzp0', 'dc_mzp1', 'dc_mzp2', 'dc_green', 'dc_mzp3', 'dc_mzp4', 'dc_kk0', 'dc_kk1', 'dc_kk2', 'dc_hangR', 'dc_hp3'].filter(id => byId[id]);
  const ROUTE = ROUTE_ID.map(id => byId[id]).map(B => { const { P } = NX.arc.kit.basis(B), y = B.st === 'dc_hang' ? B.yt + (B.yb - B.yt) * .32 : B.yt, q = X.proj(P(0, B.dep / 2, y)); return [q[0], Math.max(11, q[1] - 7)]; });
  const LEGS = []; (() => { let tt = 0; for (let k = 0; k < ROUTE.length; k++) { const a = ROUTE[k], b = ROUTE[(k + 1) % ROUTE.length], d = Math.hypot(b[0] - a[0], b[1] - a[1]), fly = Math.max(1.2, d / 26);
    LEGS.push({ a, b, t0: tt, hover: 2.4, fly }); tt += 2.4 + fly; } LEGS.T = tt; })();
  // (· 7) ВИКЛИК ДО NEXI (власник: «Nexi на другому поверсі»): Nexi на ранці перед антресоллю кличе дрона й доливає йому води з
  // лійки. CALL — куди й коли дрон прилітає (FIN с, дугою), коли бачок повний (t1: «бочка» — тап-обертання з decor_live — і
  // серце) і коли летить далі (tg); маршрут продовжується з монстери на антресолі — праворуч від Nexi, тож видно, як дрон одразу
  // її поливає (OFF — зсув фази маршруту: міняється, коли дрон уже біля Nexi, тож стрибка не видно); перші BOOST_T с після
  // заправки дрон поливає щедріше (більше бризок і туману).
  let CALL = null, OFF = 0, BOOST = -99;
  const FIN = 1.8, BACK = 1.3, BOOST_T = 16, I_GO = Math.max(0, ROUTE_ID.includes('dc_mzp2') ? ROUTE_ID.indexOf('dc_mzp2') : ROUTE_ID.indexOf('dc_mzp0')), sstep = u => u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u);
  /** Де дрон у час t на маршруті: зависає над рослиною (spray), потім летить до наступної (плавно, дугою вгору). */
  function routeAt(t) {
    const tt = (((t + OFF) % LEGS.T) + LEGS.T) % LEGS.T; let L = LEGS[LEGS.length - 1]; for (const g of LEGS) if (tt >= g.t0) L = g;
    const lt = tt - L.t0; if (lt < L.hover) return { x: L.a[0], y: L.a[1] + Math.sin(t * 3.1) * .6, spray: lt > .4 && lt < L.hover - .3, dir: L.b[0] >= L.a[0] ? 1 : -1, wet: lt > L.hover - .3 ? lt - L.hover + .3 : null, wx: L.a[0], wy: L.a[1] + 8 };
    const u = (lt - L.hover) / L.fly, e = u * u * (3 - 2 * u); return { x: L.a[0] + (L.b[0] - L.a[0]) * e, y: L.a[1] + (L.b[1] - L.a[1]) * e - Math.sin(u * Math.PI) * Math.min(10, Math.abs(L.b[0] - L.a[0]) * .12), spray: false, dir: L.b[0] >= L.a[0] ? 1 : -1, wet: lt - L.hover + .3, wx: L.a[0], wy: L.a[1] + 8 };
  }
  /** Де дрон у час t: маршрут або (· 7) політ до Nexi / зависання біля лійки (fill — скільки води долито, 0..1) / повернення. */
  function droneAt(t) {
    const C = CALL; if (C && C.off != null && t >= C.t0 + FIN) { OFF = C.off; C.off = null; }
    const D = routeAt(t); if (!C || t < C.t0) return D;
    if (t > C.tg + BACK) { CALL = null; return D; }
    const k = Math.min(sstep((t - C.t0) / FIN), t > C.tg ? 1 - sstep((t - C.tg) / BACK) : 1), arc = Math.sin(Math.PI * k) * (k < 1 ? 5 : 0), B = t <= C.tg && C.from ? C.from : D;
    return { x: B.x + (C.x - B.x) * k, y: B.y + (C.y - B.y) * k - arc + (k >= 1 ? Math.sin(t * 3.1) * .4 : 0), spray: k < .02 && D.spray, dir: k > .98 ? C.face : t > C.tg ? (D.x >= C.x ? 1 : -1) : (C.x >= B.x ? 1 : -1),
      wet: k < .02 ? D.wet : null, wx: D.wx, wy: D.wy, fill: t >= C.t0 + FIN ? Math.min(1, (t - C.t0 - FIN) / Math.max(.1, C.t1 - C.t0 - FIN)) : 0, done: t > C.t1 ? t - C.t1 : -1 };
  }
  /** (· 7) Покликати дрона до лійки Nexi: прилетить у (x, y) за FIN с від t0 і повисить dur с (поки Nexi доливає), face — куди
   *  дивитись (на Nexi), spout — носик лійки (звідти струмінь у бачок); linger с після заправки ще біля Nexi («бочка», серце),
   *  потім летить поливати рослини антресолі. -> через скільки секунд прилетить. */
  function droneCall(x, y, t0, dur, face = -1, spout = null, linger = 1) {
    if (!ROUTE.length) return 0; const t1 = t0 + FIN + dur, tg = t1 + linger, now = CALL ? droneAt(t0) : null;   // уже летить до Nexi — новий виклик з того ж місця
    CALL = { x, y, t0, t1, tg, face, spout, from: now && { x: now.x, y: now.y }, off: (((LEGS[I_GO].t0 - .9 - tg) % LEGS.T) + LEGS.T) % LEGS.T }; BOOST = t1; return FIN;
  }
  /** (· 7) Де Nexi зависає перед другим поверхом: праворуч від дверей пілона (двері видно), трохи перед фасадом антресолі, голова —
   *  на 5 од. нижче верху кадру (вище — стеля: стати на саму антресоль Nexi не може — він вищий, ніж від плити до стелі).
   *  -> { x, y — ступні, z, dy — рядок підлоги на тій глибині (масштаб), s — масштаб спрайта, spout — носик лійки (поза hoverWater),
   *  dock — де зависає дрон під носиком }. */
  function upstairs() {
    const S = items.find(B => B.st === 'dc_mz'), DR = byId.dc_door; if (!S || !DR) return null;
    const d = S.dc, R = d.R - d.P - 4, VX = PZ.VP[0];
    const front = X0 => { let lo = d.a0, hi = d.a1; for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2, x = d.C[0] + R * Math.sin(m * D2R), z = d.C[1] + R * Math.cos(m * D2R); if (VX + (x - VX) * PZ.s(z) < X0) lo = m; else hi = m; } return d.C[1] + R * Math.cos(lo * D2R); };
    const { P } = NX.arc.kit.basis(DR), doorR = Math.max(...[-1, 1].map(u => X.proj(P(u * DR.w / 2, 0, DR.yb))[0]));
    let x = doorR + 26, z = 0, dy = 0, s = 1;
    for (let k = 0; k < 4; k++) { z = front(x); dy = PZ.VP[1] + (372 - PZ.VP[1]) * PZ.s(z); s = NX.room.scaleAt(Math.max(dy, 352)) * SPRITE_K; x = doorR + 2 + 20 * s; }
    const y = Math.ceil(5 + 52 * s);
    return { x: Math.round(x * 10) / 10, y, z, dy, s, spout: [x + 24 * s, y - 18 * s], dock: [x + 27 * s, y - 9 * s] };
  }
  const droneY = D => Math.max(10, D.y), MIST = glowSpr('#d8f4ff', 5), TANK = glowSpr('#3be8ff', 4.6), HALO = glowSpr('#3be8ff', 11), TAU2 = Math.PI * 2;
  const HEART = ['.XX.XX.', 'XXXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...'];
  function drawDrone(c, t, vx0, vx1) {
    if (!ROUTE.length) return; const D = droneAt(t); if (D.x < vx0 - 10 || D.x > vx1 + 10) return;
    const w = 10, h = w * DRONE.h / DRONE.w, x = D.x, y = droneY(D), bo = t > BOOST && t - BOOST < BOOST_T;   // (· 7) bo — щойно заправлений: щедріше
    c.save(); c.imageSmoothingEnabled = true;
    if (D.spray) { const n = bo ? 26 : 14; c.globalCompositeOperation = 'lighter'; for (let k = 0; k < n; k++) { const f = (t * 1.6 + k / n) % 1, a = (hash(k, 3) - .5) * (bo ? 1.3 : .9); c.globalAlpha = .75 * (1 - f); c.fillStyle = k % 3 ? '#9af6ff' : '#ffffff'; c.fillRect(x + Math.sin(a) * f * (bo ? 7 : 6) - .3, y + h * .45 + f * (bo ? 11 : 9), .6, .6); } c.globalCompositeOperation = 'source-over'; }
    if (D.wet != null && D.wet < 1.8) { const k = D.wet / 1.8, px = D.wx, py = D.wy;                                  // (· 5) після поливу: хмаринка туману над листям і краплі стікають
      c.globalCompositeOperation = 'lighter'; c.globalAlpha = (bo ? .36 : .26) * (1 - k); const gm = MIST.r * (1 + k * .8) * (bo ? 1.5 : 1); c.drawImage(MIST.cv, px - gm, py - gm * .6, gm * 2, gm * 1.2);
      for (let q = 0; q < (bo ? 10 : 6); q++) { const d0 = hash(q, 17) * .5, f = Math.max(0, (D.wet - d0) / 1.3); if (f <= 0 || f >= 1) continue; const dx = (hash(q, 19) - .5) * (bo ? 9 : 7), yy = py + 1 + f * f * 7;
        c.globalAlpha = .9 * (1 - f); c.fillStyle = '#c8f4ff'; c.fillRect(px + dx - .2, yy - .35, .4, .7); c.fillStyle = '#ffffff'; c.fillRect(px + dx - .1, yy - .35, .2, .2); }
      c.globalCompositeOperation = 'source-over'; }
    if (D.fill > 0 && D.done < 0 && CALL && CALL.spout) {                               // (· 7) струмінь з лійки Nexi в бачок: хвилястий, світлі краплі біжать униз, бризки
      const [sx, sy] = CALL.spout, ex = x - .4, ey = y - h * .42, n = 8; c.globalCompositeOperation = 'lighter';
      for (let q = 0; q < n; q++) { const u0 = q / n, u1 = (q + 1) / n, w0 = Math.sin(t * 23 + q * 1.7) * .25 * u0, w1 = Math.sin(t * 23 + q * 1.7 + 1.7) * .25 * u1;
        c.globalAlpha = .55; c.strokeStyle = '#8ad8ff'; c.lineWidth = .9 - u0 * .3; c.beginPath(); c.moveTo(sx + (ex - sx) * u0 + w0, sy - 1.5 + (ey - sy + 1.5) * u0); c.lineTo(sx + (ex - sx) * u1 + w1, sy - 1.5 + (ey - sy + 1.5) * u1); c.stroke(); }
      for (let q = 0; q < 3; q++) { const u = (t * 2.6 + q / 3) % 1; c.globalAlpha = .95; c.fillStyle = '#ffffff'; c.fillRect(sx + (ex - sx) * u - .25, sy - 1.5 + (ey - sy + 1.5) * u - .3, .5, .6); }
      for (let q = 0; q < 4; q++) { const f = (t * 3.1 + q / 4) % 1, a = (q % 2 ? 1 : -1) * (.8 + hash(q, 23) * 1.4); c.globalAlpha = .85 * (1 - f); c.fillStyle = q % 2 ? '#c8f4ff' : '#ffffff';
        c.fillRect(ex + a * f * 2.2 - .2, ey - Math.sin(f * Math.PI) * 1.6 + f * .6 - .2, .4, .4); }
      c.globalCompositeOperation = 'source-over'; }
    if (D.fill > 0 && D.done < .9) {                                                    // (· 7) сяйво навколо дрона росте, поки бачок наповнюється; повний — спалах-кільце й іскри
      const fade = D.done > 0 ? 1 - D.done / .9 : 1; c.globalCompositeOperation = 'lighter';
      c.globalAlpha = (.12 + .3 * D.fill) * (.8 + .2 * Math.sin(t * 9)) * fade; const gr = HALO.r * (.7 + .5 * D.fill); c.drawImage(HALO.cv, x - gr, y - gr, gr * 2, gr * 2);
      if (D.done >= 0 && D.done < .55) { const f = D.done / .55; c.globalAlpha = .9 * (1 - f); c.strokeStyle = '#9af6ff'; c.lineWidth = .7; c.beginPath(); c.arc(x, y, 3 + f * 10, 0, TAU2); c.stroke();
        for (let q = 0; q < 8; q++) { const a = q / 8 * TAU2 + .3, r = 4 + f * 11; c.fillStyle = q % 2 ? '#ffffff' : '#9af6ff'; c.fillRect(x + Math.cos(a) * r - .3, y + Math.sin(a) * r * .8 - .3, .6, .6); } }
      c.globalCompositeOperation = 'source-over'; }
    if (D.done >= 0 && D.done < 1.2) {                                                   // (· 7) «дякую»: піксельне серце злітає над дроном
      const k = D.done / 1.2, px = .7, hx = x + 1.5 - 3.5 * px, hy = y - 6 - k * 7; c.globalAlpha = Math.min(1, (1 - k) * 1.6);
      HEART.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === 'X') { c.fillStyle = i === 1 && j === 1 ? '#ffffff' : j > 2 ? '#d82aa8' : '#ff4fd8'; c.fillRect(hx + i * px, hy + j * px, px, px); } }));
    }
    const spin = NX.decorLive ? NX.decorLive.droneSpin(t) : 0;                          // (· 5) тап — «бочка»
    c.globalAlpha = 1; c.translate(x, y); if (D.dir < 0) c.scale(-1, 1); if (spin) c.rotate(spin); c.drawImage(DRONE.cv, -w / 2, -h / 2, w, h);
    if (D.fill > 0 && D.done < .6) {                                                     // (· 7) бачок наповнюється: світиться дедалі ясніше
      c.globalCompositeOperation = 'lighter'; c.globalAlpha = (.2 + .55 * D.fill) * (.75 + .25 * Math.sin(t * 14)) * (D.done > 0 ? 1 - D.done / .6 : 1);
      c.drawImage(TANK.cv, -TANK.r, h * .36 - TANK.r * .7, TANK.r * 2, TANK.r * 1.4); c.globalCompositeOperation = 'source-over'; }
    c.globalAlpha = .55; c.fillStyle = '#e8f0ff'; const r = (t * 40) % 2 < 1; for (const hx of [-w * .4, w * .4]) c.fillRect(hx - (r ? 2.2 : 1.6), -h * .38, r ? 4.4 : 3.2, .35);   // гвинти (миготять)
    c.globalAlpha = 1; c.fillStyle = (t % 1) < .5 ? '#3bff8a' : '#14602e'; c.fillRect(-w * .2, -h * .05, .45, .45);   // вогник
    c.restore();
  }
  // ---------- СВІТЛЯЧКИ біля зелені лівого крила ----------
  const FLIES = []; (() => {
    const near = (id, n, ky) => { const B = byId[id]; if (!B) return; const { P } = NX.arc.kit.basis(B), a = X.proj(P(-B.w / 2, B.dep / 2, B.yt)), b = X.proj(P(B.w / 2, B.dep / 2, B.yb));
      for (let k = 0; k < n; k++) FLIES.push({ x: (a[0] + b[0]) / 2, y: a[1] + (b[1] - a[1]) * ky, ax: Math.abs(b[0] - a[0]) * .4, ay: Math.abs(b[1] - a[1]) * .3, sd: FLIES.length * 7 + 3 }); };
    near('dc_basket', 4, .55); near('dc_tr0', 2, .45); near('dc_tr1', 2, .45); near('dc_cl1', 2, .5);
  })();
  const FLY = glowSpr('#d8ff6a', 2.4);
  function drawFlies(c, t, vx0, vx1) {
    c.save(); c.globalCompositeOperation = 'lighter'; c.imageSmoothingEnabled = true;
    for (const f of FLIES) { const x = f.x + Math.sin(t * (.31 + hash(f.sd, 1) * .2) + f.sd) * f.ax, y = f.y + Math.sin(t * (.43 + hash(f.sd, 2) * .2) + f.sd * 2) * f.ay; if (x < vx0 || x > vx1) continue;
      const b = Math.max(0, Math.sin(t * (1.1 + hash(f.sd, 3)) + f.sd)); if (b < .05) continue; c.globalAlpha = .85 * b; c.drawImage(FLY.cv, x - FLY.r, y - FLY.r, FLY.r * 2, FLY.r * 2);
      c.globalAlpha = b; c.fillStyle = '#f8ffd0'; c.fillRect(x - .25, y - .25, .5, .5); }
    c.restore();
  }

  // ---------- кадр ----------
  function drawAq(c, aq, t, Rd, vx0, vx1) {
    const M = MK[aq], A = AQ[aq]; if (!M || !A) return;
    if (M.x > vx1 || M.x + M.w < vx0) return;                                          // поза екраном (телефон) — не малюємо
    const W = Math.max(1, Math.ceil(M.w * Rd)), H = Math.max(1, Math.ceil(M.h * Rd));
    const fresh = !M.out || M.out.width !== W || M.out.height !== H;
    if (fresh) { M.out = document.createElement('canvas'); M.out.width = W; M.out.height = H; }
    M.fr = (M.fr || 0) + 1;
    if (!fresh && (M.fr & 1)) { c.save(); c.imageSmoothingEnabled = true; c.drawImage(M.out, M.x, M.y, M.w, M.h); c.restore(); return; }   // риби оновлюються через кадр (30 к/с), кладуться щокадру
    const fx = M.out.getContext('2d'); fx.setTransform(1, 0, 0, 1, 0, 0); fx.globalCompositeOperation = 'source-over'; fx.globalAlpha = 1; fx.clearRect(0, 0, W, H);
    fx.setTransform(Rd, 0, 0, Rd, -M.x * Rd, -M.y * Rd); fx.imageSmoothingEnabled = true;
    if (aq === 'farm') { if (NX.decorFarm) NX.decorFarm.draw(fx, A, t); fx.globalAlpha = 1; fx.globalCompositeOperation = 'source-over'; }   // (· 13) ферма замість води й риб — objects/decor_farm.js
    else drawLife(fx, aq, A, t);
    // маска скла
    fx.setTransform(1, 0, 0, 1, 0, 0); fx.globalCompositeOperation = 'destination-in'; fx.drawImage(M.cv, 0, 0, W, H); fx.globalCompositeOperation = 'source-over';
    c.save(); c.imageSmoothingEnabled = true; c.drawImage(M.out, M.x, M.y, M.w, M.h); c.restore();
  }
  /** Вода й мешканці акваріума (риф, медузарій) на полотно fx (у координатах кімнати). */
  function drawLife(fx, aq, A, t) {
    const AQX = NX.decorAqua; if (AQX) { AQX.back(fx, aq, A, t); fx.globalAlpha = 1; fx.globalCompositeOperation = 'source-over'; }   // (· 5) промені, каустика, ламінарія, мурена, вугри, краб… (objects/decor_aqua.js)
    // бульбашки
    for (const S of STREAMS[aq](A)) for (let k = 0; k < S.n; k++) { const f = (t * .09 + k / S.n + hash(k, aq.length) * .05) % 1, y = S.p[1] - f * S.h, x = S.p[0] + Math.sin(t * 2.2 + k * 1.9) * .7, q = X.proj([x, y, S.p[2]]), s = sOf(S.p[2]) * (.9 + .6 * hash(k, 9));
      fx.globalAlpha = .8 * (1 - f * .5); fx.drawImage(BUB.cv, q[0] - s, q[1] - s, s * 2, s * 2); }
    fx.globalAlpha = 1;
    // мешканці: дальші — раніше; дальші — трохи тьмяніші (товща води)
    const list = CREW[aq].map((m, k) => Object.assign(AQX && AQX.adjust ? AQX.adjust(aq, A, m, k, t, where(aq, A, m, k, t)) : where(aq, A, m, k, t), { m, k })).sort((p, q) => q.p[2] - p.p[2]);   // (· 6) годування: пливуть до корму
    const DL = NX.decorLive;
    for (const e of list) {
      const [kind, size, sp] = e.m, jel = aq === 'jelly', f = jel ? Math.floor((t * (.55 + .2 * hash(e.k, 4)) + hash(e.k, 6)) * 4) % 4 : Math.floor(t * (3 + 4 * sp) + e.k) % 2;
      const S = frame(kind, f), q = X.proj(e.p), k = sOf(e.p[2]), w = size * k, h = w * S.h / S.w;
      const pu = DL && DL.fishPush(aq, q, t); if (pu) { q[0] += pu[0]; q[1] += pu[1]; if (!jel) e.dir = pu[2]; }   // (· 5) тап: розпливаються від пальця
      fx.globalAlpha = jel ? .92 : Math.max(.72, Math.min(1, 1.25 - (e.p[2] - 40) / 400));
      if (e.dir < 0 && !jel) { fx.save(); fx.translate(q[0], q[1]); fx.scale(-1, 1); fx.drawImage(S.cv, -w / 2, -h / 2, w, h); fx.restore(); }
      else { const y0 = q[1] - (jel ? h * .2 : h / 2); fx.drawImage(S.cv, q[0] - w / 2, y0, w, h);
        if (jel) { fx.globalCompositeOperation = 'lighter'; fx.globalAlpha = Math.min(1, .38 * (AQX && AQX.glow ? AQX.glow(aq, t) : 1)); fx.drawImage(S.cv, q[0] - w * .58, y0 - h * .04, w * 1.16, h * 1.08); fx.globalCompositeOperation = 'source-over'; } }   // медузи світяться (· 6: після годування — яскравіше)
    }
    fx.globalAlpha = 1;
    if (AQX) { AQX.front(fx, aq, A, t, list); fx.globalAlpha = 1; fx.globalCompositeOperation = 'source-over'; }   // (· 5) морський сніг, поверхня, анциструс на склі… (· 6: корм — риби його з'їдають)
    if (DL) DL.aqFx(fx, aq, t);                                                         // (· 5) бульбашки від тапу
  }
  NX.decor = { droneAt, droneCall, upstairs, ROUTE, MK, AQ, sprite, glowSpr, hex, byId, items, SPR, CREW, JELLY: jelly };   // для перевірок (tools), живого шару · 4 (objects/decor_live.js), акваріумів · 5 (objects/decor_aqua.js) і Nexi на другому поверсі · 7 (actors/nexi/activities.js)
  NX.addObject({
    id: 'decorLive',
    /** (Декор стін · 5) тапи по декору — objects/decor_live.js (зони мають першість; ui/input.js кличе tapFirst до зон). */
    tapFirst(x, y) { return !!(NX.decorLive && NX.decorLive.tap(x, y)); },
    drawBack(c, t) {
      if (c.isRefl || !buildMasks()) return;
      const Rd = Math.min(4, Math.round(NX.cam.k * (NX.loop.dpr || 1) * 100) / 100), vx0 = NX.cam.x - 8, vx1 = NX.cam.x + NX.cam.viewW + 8;
      for (const aq of ['reef', 'jelly', 'farm']) drawAq(c, aq, t, Rd, vx0, vx1);
      if (NX.decorLive) NX.decorLive.draw(c, t, Rd, vx0, vx1);                       // (· 4) живі рослини, пілон, плакат Рудика, штучки — objects/decor_live.js
      drawDrone(c, t, vx0, vx1); drawFlies(c, t, vx0, vx1);
      if (!GLOWS.length) return;
      c.save(); c.globalCompositeOperation = 'lighter'; c.imageSmoothingEnabled = true;
      for (const g of GLOWS) { if (g.p[0] < vx0 || g.p[0] > vx1) continue; c.globalAlpha = Math.max(0, Math.min(1, g.a(t))); c.drawImage(g.s.cv, g.p[0] - g.s.r, g.p[1] - g.s.r, g.s.r * 2, g.s.r * 2); }
      c.restore();
    },
  });
})();
