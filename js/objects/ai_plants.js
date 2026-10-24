/* ============================================================================
 * objects/ai_plants.js — ЗЕЛЕНЬ ЗОНИ AI-ЦЕНТРУ (кожна рослина — окремий об'єкт)
 * ----------------------------------------------------------------------------
 * Стиль — як у самій кімнаті: сині звужені донизу вазони з рожевим контровим
 * світлом, соковите широке листя з жовтуватими кінчиками.
 * Піксель-арт кодом, 1 піксель = 0.25 од. кімнати, розмір і місце — за
 * перспективою кімнати (core/persp.js): що глибше, то менше.
 *   aiPalm           — велика пальма в кутку біля стіни
 *   aiPotA/B/C       — вазони на підлозі вздовж столу
 *   aiDeskPot1..3    — маленькі вазони на столі й на надставці
 *   aiHang1          — підвісне кашпо зі стелі
 *   aiVines/2/3      — кашпо на стіні з ліанами (вгорі зліва, над екраном, на колоні)
 * Листя гойдається (растр ріжеться на смужки — пікселі лишаються чіткими).
 * Тап по рослині — листя шелестить, летять зелені іскри, Nexi радіє.
 * ========================================================================== */
(() => {
  const P = NX.px, { Raster, outline, hash, BAYER } = NX.art, V = NX.persp, U = .25;
  const LG = ['#08200f', '#0e3418', '#154a22', '#1d622e', '#277c3a', '#339848', '#4cb456', '#7ccc60', '#b4de6a', '#dcea80'];   // листя (до жовтого)
  const PB = ['#0b1438', '#101c4c', '#162862', '#1d3478', '#25428e', '#2f52a6', '#3c66bc', '#5280d0'];                          // сині вазони
  const RIM = '#ff7ad8', OUT = '#06120c', SOIL = ['#140a06', '#22140a', '#33200f'];
  const ramp = (pal, q, i, j) => pal[P.clamp(Math.round(P.clamp(q, 0, 1) * (pal.length - 1) + BAYER[(j & 3) * 4 + (i & 3)] * .9), 0, pal.length - 1)];

  /** Широкий листок, що вигинається; верхній край світліший, кінчик жовтуватий. */
  function leaf(r, x, y, len, ang, wd, bend = 0, dark = 0) {
    let px = x, py = y, a = ang;
    for (let k = 0; k <= len; k++) {
      const q = k / len, half = wd * Math.sin(Math.PI * Math.min(1, .12 + q * .95)) ** .7, ca = Math.cos(a), sa = Math.sin(a);
      for (let m = -Math.ceil(half); m <= Math.ceil(half); m++) {
        if (Math.abs(m) > half) continue;
        const X = Math.round(px - sa * m), Y = Math.round(py + ca * m), up = (-ca * m) < 0 ? 1 : 0;   // чи цей бік дивиться вгору
        let col;
        if (Math.abs(m) > half - 1) col = up && q > .15 ? LG[7] : LG[1];
        else if (Math.abs(m) < .6) col = q > .8 ? LG[9] : LG[6];
        else col = ramp(LG, .42 + up * .14 - Math.abs(m) / half * .14 + (q > .78 ? .3 : 0) - dark, X, Y);
        r.set(X, Y, col);
      }
      px += Math.cos(a); py += Math.sin(a); a += bend / len;
    }
  }
  /** Кущ: листя віялом з однієї точки, задні — темніші. */
  function bush(r, cx, cy, n, len, wd, spread, seed, sc = 1) {
    const L = [];
    for (let k = 0; k < n; k++) { const t = n > 1 ? k / (n - 1) : .5, a = -Math.PI / 2 + (t - .5) * 2 * spread + (hash(k, seed) - .5) * .25; L.push([a, (len * (.7 + hash(seed, k) * .45)) * (1 - Math.abs(t - .5) * .4), hash(k, seed + 3)]); }
    L.sort((p, q) => p[2] - q[2]).forEach(([a, l, d], k) => leaf(r, cx + Math.cos(a) * 3 * sc, cy, l * sc, a, wd * sc * (.85 + d * .3), Math.cos(a) * 1.1, k < n / 3 ? .12 : 0));
  }
  /** Пальмова гілка з широкими листочками (як у кімнаті). */
  function frond(r, x, y, len, ang, bend, lf, sc) {
    let px = x, py = y, a = ang;
    const pts = []; for (let k = 0; k < len; k++) { pts.push([px, py, a, k / len]); px += Math.cos(a); py += Math.sin(a); a += bend / len; }
    pts.forEach(([X, Y, A, q], k) => { if (k > len * .1 && k % Math.round(7 * sc) === 0) for (const sd of [-1, 1]) leaf(r, X, Y, lf * sc * (1 - q * .5) * (.8 + hash(k, sd) * .4), A + sd * .95 + .25, 4.5 * sc, -sd * .5 + .4, sd < 0 ? .1 : 0); });
    pts.forEach(([X, Y]) => { r.set(Math.round(X), Math.round(Y), LG[2]); r.set(Math.round(X), Math.round(Y) + 1, LG[1]); });
  }
  /** Вазон, звужений донизу: обідок, земля, синій перелив, рожеве контрове світло справа. */
  function pot(r, cx, top, wt, wb, h, ry) {
    for (let j = -ry; j < h + 2; j++) {
      const hw = (wt + (wb - wt) * P.clamp(j / h, 0, 1)) / 2;
      for (let i = Math.floor(-hw); i < hw; i++) {
        const u = (i + .5) / hw, X = Math.round(cx + i), Y = top + j, e = Math.sqrt(Math.max(0, 1 - u * u)) * ry;
        if (j < 0 && -j > e) continue; if (j > h) continue;
        let col;
        if (j <= e && j >= -e) col = Math.abs(j) > e - 1.5 ? (u > .3 ? PB[7] : PB[5]) : ramp(SOIL, .6 - j / ry * .3, X, Y);                 // обідок і земля
        else if (j < e + ry * .9) col = ramp(PB, .75 - (u + 1) * .22, X, Y);                                                                    // світлий пояс під обідком
        else if (j > h - 1.5) col = '#050a1c';
        else col = ramp(PB, .55 - (u + 1) * .24 - j / h * .15, X, Y);
        if (u > .86 && j > e) col = j % 3 ? RIM : '#c24ab0';                                                                                    // рожеве контрове світло
        if (u < -.9 && j > e) col = PB[1];
        r.set(X, Y, col);
      }
    }
  }

  // ---------- спільне для всіх рослин: гойдання смужками, тап, шари ----------
  function plant({ id, build, floorY, amp = 1, hang = false, back = false, hit }) {
    const bands = 18;
    return NX.addObject({
      id, name: 'obj.plant', act: 'rustle', hit, shake: 0, b: null,
      onTap() { this.shake = 1; NX.nexi.emote('happy', 1.5); for (let i = 0; i < 8; i++) NX.fx.emit('spark', hit.x + Math.random() * hit.w, hit.y + Math.random() * hit.h * .6, { col: Math.random() < .6 ? '#9aff7a' : '#ffe27a', vy: -20 - Math.random() * 20, g: 30, ttl: 1, s: 1.1 }); return true; },
      update(dt) { this.shake = Math.max(0, this.shake - dt * .9); },
      draw(c, t) {
        if (!this.b) this.b = build();
        const { ox, oy } = this.b, Kk = NX.cam.k * (NX.loop.dpr || 1), R = Math.min(1 / U, Math.ceil(Kk * 2) / 2);
        // растр під роздільність екрана (зменшується один раз, а не щокадру)
        if (this.R !== R) { this.R = R; const src = this.b.cv; if (R * U < .95) { const o = document.createElement('canvas'); o.width = Math.max(1, Math.round(src.width * U * R)); o.height = Math.max(1, Math.round(src.height * U * R)); const x = o.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(src, 0, 0, o.width, o.height); this.cv = o; } else this.cv = src; }
        const cv = this.cv, W = this.b.cv.width * U, Hr = this.b.cv.height * U, bands = Hr > 40 ? 12 : Hr > 15 ? 5 : 2, bh = cv.height / bands;
        c.save(); c.imageSmoothingEnabled = false;
        for (let b = 0; b < bands; b++) {
          const v = hang ? (b + .5) / bands : 1 - (b + .5) / bands, sw = (Math.sin(t * 1.1 + ox * .05) * .6 + Math.sin(t * 2.3 + b * .3) * .25) * v * v * amp + Math.sin(t * 18) * this.shake * v * 2.4;
          c.drawImage(cv, 0, b * bh, cv.width, bh, ox + sw, oy + b * Hr / bands, W, Hr / bands + .05);
        }
        c.restore();
      },
      drawBack(c, t) { if (back) this.draw(c, t); },
      layers(t) { return back ? [] : [{ y: floorY, draw: c => this.draw(c, t) }]; },
    });
  }
  /** Растр рослини навколо точки (x, y) кімнати: w × h одиниць, точка опори — (ax, ay) частки ширини/висоти. */
  const area = (x, y, w, h, ax = .5, ay = 1) => { const ox = x - w * ax, oy = y - h * ay; return { r: Raster(Math.round(w / U), Math.round(h / U)), ox, oy, g: (X, Y) => [(X - ox) / U, (Y - oy) / U] }; };

  // ---------- вазон на підлозі / на столі (кущ) ----------
  function potPlant(wx, wy, wz, size, seed, kind = 'bush') {
    const k = V.s(wz), [X, Y] = V.p(wx, wy, wz), sz = size * k, A = area(X, Y, sz * (kind === 'palm' ? 4.6 : 3.4), sz * (kind === 'palm' ? 5.6 : 4.2), .5, .97), [cx, by] = A.g(X, Y);
    const s4 = sz / U, potH = s4 * .95, top = by - potH;
    if (kind === 'palm') { bush(A.r, cx, top + 2, 24, s4 * 3.2, s4 * .085, 1.3, seed, 1); bush(A.r, cx, top + 2, 10, s4 * 4.6, s4 * .08, .4, seed + 9, 1); bush(A.r, cx, top + 2, 9, s4 * 1.6, s4 * .09, .9, seed + 4, 1); }
    else bush(A.r, cx, top + 2, 13, s4 * 1.25, s4 * .13, 1.15, seed, 1);
    pot(A.r, cx, Math.round(top), s4 * 1.05, s4 * .72, Math.round(potH), Math.round(s4 * .12));
    outline(A.r, OUT);
    return { cv: A.r.canvas(), ox: A.ox, oy: A.oy, hit: { x: A.ox + sz * .6, y: A.oy + sz * .4, w: sz * 2.2, h: sz * 3.8 } };
  }
  function floorPlant(id, wx, wz, size, seed, kind, amp) {
    const b0 = potPlant(wx, 362, wz, size, seed, kind);   // лише щоб знати тап-зону; растр збудуємо ліниво
    plant({ id, build: () => b0, floorY: V.p(wx, 362, wz)[1], amp, hit: b0.hit });
  }
  function deskPlant(id, wx, wy, wz, size, seed) {
    const b0 = potPlant(wx, wy, wz, size, seed);
    plant({ id, build: () => b0, floorY: V.p(wx, wy, wz)[1], amp: .6, hit: b0.hit });
  }

  // ---------- кашпо на стіні з ліанами ----------
  function vines(z0, z1, y0, n, maxLen, seed) {
    const A = area(0, -4, 270, 200, 0, 0), B = (b, F) => V.box(A.r, A.ox, A.oy, U, b, F);
    for (let k = 0; k < n; k++) {
      const z = z0 + 2 + (k + hash(k, seed)) * (z1 - z0 - 4) / n, len = (maxLen * (.35 + hash(k, seed + 2) * .65)) / U, [x0, yy] = A.g(...V.p(9, y0 + 11, z)), s0 = V.s(z), ph = hash(k, 3) * 6;
      for (let q = 0; q < len; q++) {
        const X = x0 + Math.sin(q * .035 + ph) * 3 * s0, Y = yy + q * s0; A.r.set(X, Y, LG[1]); A.r.set(X + 1, Y, LG[0]);
        if (q % 9 === 0) { const sd = (q / 9) % 2 ? 1 : -1, sz = (1 - q / len * .5); leaf(A.r, X, Y, (13 + hash(k, q) * 8) * sz * s0, Math.PI / 2 + sd * (1 + hash(q, k) * .5), 4.6 * sz * s0, -sd * .8); }
      }
    }
    B({ x0: 0, x1: 9, y0, y1: y0 + 11, z0, z1 }, {
      right: (u, v, i, j) => v < .12 ? PB[7] : v < .2 ? PB[2] : (v > .9 ? '#050a1c' : u > .97 ? RIM : ramp(PB, .62 - v * .4 - u * .2, i, j)),
      front: (u, v, i, j) => ramp(PB, .7 - v * .3, i, j), bottom: (u, v, i, j) => ramp(PB, .2 - v * .1, i, j),
    });
    for (let k = 0; k < n * 3; k++) { const z = z0 + 2 + hash(k, seed + 4) * (z1 - z0 - 4), [x, y] = A.g(...V.p(9, y0, z)), s0 = V.s(z); leaf(A.r, x, y, (22 + hash(k, 5) * 20) * s0, -Math.PI / 2 + (hash(k, 6) - .5) * 2.8, 5.5 * s0, (hash(k, 7) - .5) * 2, k % 3 ? 0 : .12); }
    outline(A.r, OUT);
    return { cv: A.r.canvas(), ox: A.ox, oy: A.oy };
  }

  // ---------- підвісне кашпо зі стелі ----------
  function hanging(wx, wy, wz, seed) {
    const k = V.s(wz) * 1.6, [X, Y] = V.p(wx, wy, wz), A = area(X, Y, 60 * k, 130 * k, .5, .3), [cx, cy] = A.g(X, Y), s4 = k / U;
    for (const dx of [-7, 0, 7]) A.r.line(cx + dx * s4, cy - 6 * s4, cx, A.g(X, A.oy)[1], '#8a7a6a');                                        // мотузки
    bush(A.r, cx, cy - 5 * s4, 9, 15 * s4, 2.6 * s4, 1.35, seed, 1);
    for (let v = 0; v < 7; v++) { const x0 = cx + (v - 3) * 2.2 * s4, len = (14 + hash(v, seed) * 26) * s4;
      for (let q = 0; q < len; q++) { const xx = x0 + Math.sin(q * .05 + v) * 2 * s4, yy = cy + q; A.r.set(xx, yy, LG[1]); if (q % Math.round(7 * k) === 0) leaf(A.r, xx, yy, 12 * k, Math.PI / 2 + ((q / 7 | 0) % 2 ? 1 : -1) * 1.1, 4 * k, 0); } }
    for (let j = -6 * s4; j < 4 * s4; j++) { const hw = Math.sqrt(Math.max(0, 1 - ((j + 1 * s4) / (5 * s4)) ** 2)) * 8 * s4; for (let i = -hw; i < hw; i++) A.r.set(cx + i, cy + j, j < -5 * s4 ? PB[7] : i > hw - 1.5 ? RIM : ramp(PB, .65 - (i / hw + 1) * .25, Math.round(cx + i), Math.round(cy + j))); }
    outline(A.r, OUT);
    return { cv: A.r.canvas(), ox: A.ox, oy: A.oy, hit: { x: A.ox, y: A.oy, w: 60 * k, h: 130 * k } };
  }

  // ============ розстановка (координати світу: x — від стіни, y — висота, z — глибина) ============
  plant({ id: 'aiVines', build: () => vines(4, 50, 4, 16, 150, 1), floorY: 0, amp: 1.6, hang: true, back: true, hit: { x: 0, y: 0, w: 58, h: 150 } });
  plant({ id: 'aiVines2', build: () => vines(152, 226, 15, 12, 40, 7), floorY: 0, amp: 1.2, hang: true, back: true, hit: { x: 190, y: 50, w: 50, h: 40 } });
  plant({ id: 'aiVines3', build: () => vines(232, 246, -8, 5, 170, 9), floorY: 0, amp: 1.4, hang: true, back: true, hit: { x: 236, y: 0, w: 14, h: 150 } });
  floorPlant('aiPalm', 20, 6, 36, 1, 'palm', 1.4);
  floorPlant('aiPotA', 78, 64, 24, 3, 'bush', .8);
  floorPlant('aiPotB', 78, 180, 24, 8, 'bush', .8);
  floorPlant('aiPotC', 76, 292, 22, 5, 'bush', .8);
  deskPlant('aiDeskPot1', 48, 299, 84, 12, 11);
  deskPlant('aiDeskPot2', 22, 252, 228, 14, 12);
  deskPlant('aiDeskPot3', 24, 252, 290, 15, 13);
  for (const [id, x, y, z, sd] of [['aiHang1', 70, 2, 28, 21]]) { const b0 = hanging(x, y, z, sd); plant({ id, build: () => b0, floorY: 0, amp: 1.2, back: true, hit: b0.hit }); }
})();
