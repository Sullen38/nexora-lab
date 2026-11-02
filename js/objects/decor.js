/* ============================================================================
 * objects/decor.js — ДЕКОР СТІН: ЖИВЕ (риби, медузи, бульбашки, світіння)
 * ----------------------------------------------------------------------------
 * Нерухоме декору — у растрі крила (objects/dc_paint.js, розкладка tools/wingbox/decor.py). Тут — те, що рухається, і
 * його небагато (власник: «живого — небагато й вразбіг»):
 *   • три акваріуми: РИФ над аналітикою (морські риби), МЕДУЗАРІЙ між аналітикою й маркетингом (медузи), АКВАТРУБА над
 *     інструментами (прісноводні) — КОЖНА ІСТОТА СВОГО ВИДУ, жодна не повторюється (власник: «щоб нічого не повторювалось»);
 *     бульбашки від розпилювачів;
 *   • тепле мерехтіння ліхтаря й світних грибів на антресолі.
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
  for (let k = 0; k < 12; k++) { LIVE['dc_rfg' + k] = NOP; LIVE['dc_tbg' + k] = NOP; } LIVE.dc_jellyg = NOP;

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
    const tb = wins('tube'); if (tb.length) { const d = tb[0].dc; AQ.tube = { ids: tb.map(B => B.id), C: d.C, R: d.R, sgn: d.sgn, a0: Math.min(...tb.map(B => B.dc.sa)), a1: Math.max(...tb.map(B => B.dc.sb)), ins: d.ins, r: d.r, Yc: d.Yc }; }
    const jl = wins('jelly'); if (jl.length) { const d = jl[0].dc; AQ.jelly = { ids: jl.map(B => B.id), cx: d.cx, cz: d.cz, r: d.r, top: d.top, bot: d.bot }; }
  })();
  const arcPt = (A, a, d, y) => { const rad = A.R - d; return [A.C[0] + A.sgn * rad * Math.sin(a * D2R), y, A.C[1] + rad * Math.cos(a * D2R)]; };
  const sOf = z => PZ.D / (PZ.D + z);
  // мешканці: kind, розмір (од. світу, довжина), швидкість, зерно; кожен вид — один раз
  const CREW = {
    reef: [['clown', 8.8, 1, 1], ['tang', 10.5, .8, 2], ['ytang', 8.8, .7, 3], ['mandarin', 6.8, .35, 4], ['idol', 9.5, .6, 5], ['puffer', 7.4, .3, 6], ['seahorse', 8.6, .12, 7]],
    tube: [['betta', 8.8, .5, 11], ['axolotl', 10.5, .22, 12], ['koi', 10.5, .55, 13], ['discus', 8, .4, 14], ['tetra', 5.4, 1.1, 15], ['glow', 5.8, .9, 16], ['shrimp', 4, .15, 17]],
    jelly: [['moon', 16, 1, 21], ['nettle', 14, 1, 22], ['comb', 8.5, 1, 23], ['crystal', 14.5, 1, 24], ['flower', 12.5, 1, 25]],
  };
  /** Де мешканець зараз (світ) і куди дивиться: плавна «прогулянка» сумою синусоїд у межах об'єму акваріума. */
  function where(aq, A, m, k, t) {
    const [kind, , sp, sd] = m, h = q => hash(sd * 7 + q, 3), w = .045 * sp * (.8 + .4 * h(1)), ph = h(2) * 6.28;
    if (aq === 'jelly') {
      const yT = A.top + 9, yB = A.bot - 14, yy = yT + (yB - yT) * (.5 + .45 * Math.sin(t * (.018 + .01 * h(3)) + ph)) - 1.4 * Math.max(0, Math.sin(t * (1.3 + .4 * h(4)) * 6.28 / 6.28 * 3.14));
      const th = h(5) * 6.28 + t * .05 * (h(6) - .5), rr = (A.r - 8) * (.2 + .6 * h(7));
      return { p: [A.cx + Math.cos(th) * rr, yy, A.cz + Math.sin(th) * rr], dir: 1 };
    }
    const span = A.a1 - A.a0, u = .5 + .42 * Math.sin(t * w + ph) + .06 * Math.sin(t * w * 2.7 + ph * 2), a = A.a0 + 1.2 + (span - 2.4) * u;
    const da = Math.cos(t * w + ph) + .16 * 2.7 * Math.cos(t * w * 2.7 + ph * 2), dir = da * A.sgn;
    if (aq === 'reef') {
      const low = kind === 'mandarin' ? .9 : kind === 'seahorse' ? .35 + .25 * Math.sin(t * .3 + ph) : .15 + .6 * h(8);
      const y = A.top + 6 + (A.bot - A.top - 10) * Math.max(0, Math.min(1, low + .12 * Math.sin(t * w * 1.7 + ph * 3))), d = 2 + (A.P - 4) * (.5 + .45 * Math.sin(t * w * .8 + ph * 5));
      return { p: arcPt(A, a, d, y), dir };
    }
    const bot = kind === 'axolotl' || kind === 'shrimp', rr = A.r - 3.2, psi = bot ? 1.25 + .15 * Math.sin(t * .4 + ph) : (h(9) - .5) * 2.2 + .5 * Math.sin(t * w * 1.3 + ph * 2), rho = bot ? rr * .92 : rr * (.25 + .55 * h(10));
    return { p: arcPt(A, a, A.ins + rho * Math.cos(psi) * .7, A.Yc + rho * Math.sin(psi)), dir };
  }
  /** Бульбашки: струмені від розпилювачів (світ). */
  const STREAMS = {
    reef: A => [[A.a0 + (A.a1 - A.a0) * .3, A.P * .4], [A.a0 + (A.a1 - A.a0) * .78, A.P * .6]].map(([a, d]) => ({ p: arcPt(A, a, d, A.bot - 2), h: A.bot - A.top - 6, n: 7 })),
    tube: A => [{ p: arcPt(A, A.a0 + (A.a1 - A.a0) * .45, A.ins, A.Yc + A.r * .55), h: A.r * 1.4, n: 4 }],
    jelly: A => [{ p: [A.cx + A.r * .5, A.bot - 2, A.cz - 2], h: A.bot - A.top - 8, n: 12 }],
  };

  // ---------- маски скла (з рушія) ----------
  const MK = {}; let lastL = null, lastR = null;
  function buildMasks() {
    const SD = NX.arc.scene && NX.arc.scene.SIDES; if (!SD) return false;
    const L = SD.left, R = SD.right; if (L === lastL && R === lastR) return true; lastL = L; lastR = R;
    const live = [...((L && L.live) || []), ...((R && R.live) || [])];
    for (const aq of Object.keys(AQ)) {
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
    const sh = at('dc_mzp1', .45); if (sh) GLOWS.push({ p: sh, s: glowSpr('#3be8ff', 8), a: t => .2 + .12 * (.5 + .5 * Math.sin(t * 1.3)) });
  })();

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
    // бульбашки
    for (const S of STREAMS[aq](A)) for (let k = 0; k < S.n; k++) { const f = (t * .09 + k / S.n + hash(k, aq.length) * .05) % 1, y = S.p[1] - f * S.h, x = S.p[0] + Math.sin(t * 2.2 + k * 1.9) * .7, q = X.proj([x, y, S.p[2]]), s = sOf(S.p[2]) * (.9 + .6 * hash(k, 9));
      fx.globalAlpha = .8 * (1 - f * .5); fx.drawImage(BUB.cv, q[0] - s, q[1] - s, s * 2, s * 2); }
    fx.globalAlpha = 1;
    // мешканці: дальші — раніше; дальші — трохи тьмяніші (товща води)
    const list = CREW[aq].map((m, k) => Object.assign(where(aq, A, m, k, t), { m, k })).sort((p, q) => q.p[2] - p.p[2]);
    for (const e of list) {
      const [kind, size, sp] = e.m, jel = aq === 'jelly', f = jel ? Math.floor((t * (.55 + .2 * hash(e.k, 4)) + hash(e.k, 6)) * 4) % 4 : Math.floor(t * (3 + 4 * sp) + e.k) % 2;
      const S = frame(kind, f), q = X.proj(e.p), k = sOf(e.p[2]), w = size * k, h = w * S.h / S.w;
      fx.globalAlpha = jel ? .92 : Math.max(.72, Math.min(1, 1.25 - (e.p[2] - 40) / 400));
      if (e.dir < 0 && !jel) { fx.save(); fx.translate(q[0], q[1]); fx.scale(-1, 1); fx.drawImage(S.cv, -w / 2, -h / 2, w, h); fx.restore(); }
      else { const y0 = q[1] - (jel ? h * .2 : h / 2); fx.drawImage(S.cv, q[0] - w / 2, y0, w, h);
        if (jel) { fx.globalCompositeOperation = 'lighter'; fx.globalAlpha = .38; fx.drawImage(S.cv, q[0] - w * .58, y0 - h * .04, w * 1.16, h * 1.08); fx.globalCompositeOperation = 'source-over'; } }   // медузи світяться
    }
    fx.globalAlpha = 1;
    // маска скла
    fx.setTransform(1, 0, 0, 1, 0, 0); fx.globalCompositeOperation = 'destination-in'; fx.drawImage(M.cv, 0, 0, W, H); fx.globalCompositeOperation = 'source-over';
    c.save(); c.imageSmoothingEnabled = true; c.drawImage(M.out, M.x, M.y, M.w, M.h); c.restore();
  }
  NX.addObject({
    id: 'decorLive',
    drawBack(c, t) {
      if (c.isRefl || !buildMasks()) return;
      const Rd = Math.min(4, Math.round(NX.cam.k * (NX.loop.dpr || 1) * 100) / 100), vx0 = NX.cam.x - 8, vx1 = NX.cam.x + NX.cam.viewW + 8;
      for (const aq of ['reef', 'jelly', 'tube']) drawAq(c, aq, t, Rd, vx0, vx1);
      if (!GLOWS.length) return;
      c.save(); c.globalCompositeOperation = 'lighter'; c.imageSmoothingEnabled = true;
      for (const g of GLOWS) { if (g.p[0] < vx0 || g.p[0] > vx1) continue; c.globalAlpha = Math.max(0, Math.min(1, g.a(t))); c.drawImage(g.s.cv, g.p[0] - g.s.r, g.p[1] - g.s.r, g.s.r * 2, g.s.r * 2); }
      c.restore();
    },
  });
})();
