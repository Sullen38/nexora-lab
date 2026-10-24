/* ============================================================================
 * objects/ai_plants.js — ВАЗОНИ І ЛІАНИ ЗОНИ AI-ЦЕНТРУ (окремі об'єкти)
 * ----------------------------------------------------------------------------
 * Піксель-арт кодом, 1 піксель = 0.25 одиниці кімнати, у перспективі кімнати
 * (core/persp.js). Кожна рослина — окремий об'єкт:
 *   aiVines   — підвісне кашпо на стіні вгорі зліва, з нього звисають ліани
 *   aiPalm    — велика пальма у вазоні біля стіни (зліва від столу)
 *   aiPotA/B  — два вазони з широким листям перед столом AI-центру
 * Листя гойдається (растр ріжеться на горизонтальні смужки, верх хитається
 * більше за низ — пікселі лишаються чіткими). Неоновий контровий світ на
 * краях листя — як у самій кімнаті (рожевий і блакитний відсвіт).
 * Тап по рослині — листя шелестить, летять зелені іскри, Nexi радіє.
 * ========================================================================== */
(() => {
  const P = NX.px, { Raster, outline, hash, BAYER } = NX.art, V = NX.persp, U = .25;
  const LG = ['#08201a', '#0f3326', '#164a33', '#1f6640', '#2a854f', '#38a45f', '#52c477', '#8ce8a6'];   // зелень
  const POT = ['#120a2c', '#1a0f3e', '#231452', '#2d1a66', '#39217b', '#472a92', '#5a37ab', '#7350c8'];  // фіолетові вазони
  const K = ['#7a1c6d', '#c63aa8', '#ff84d4', '#ffc2ec'], RIMP = '#ff9ae6', RIMC = '#7af0ff', OUT = '#06140f';
  const ramp = (pal, q, i, j) => pal[P.clamp(Math.round(P.clamp(q, 0, 1) * (pal.length - 1) + BAYER[(j & 3) * 4 + (i & 3)] * .9), 0, pal.length - 1)];

  /** Листок: вигнута жилка, ширина за синусом, світліший до середини; rim — бік, що ловить неон. */
  function leaf(r, x, y, len, ang, wd, bend = 0, rim = 0) {
    let px = x, py = y, a = ang;
    for (let k = 0; k <= len; k++) {
      const q = k / len, half = wd * Math.sin(Math.PI * Math.min(1, q * 1.08)) ** .8, ca = Math.cos(a), sa = Math.sin(a);
      for (let m = -Math.ceil(half); m <= Math.ceil(half); m++) {
        if (Math.abs(m) > half) continue;
        const X = Math.round(px - sa * m), Y = Math.round(py + ca * m), side = m * rim;
        let col = Math.abs(m) < .7 ? LG[6] : Math.abs(m) > half - 1 ? (side > 0 && q > .2 ? (rim > 0 ? RIMP : RIMC) : LG[1]) : ramp(LG, .35 + (1 - Math.abs(m) / half) * .4 - q * .15 + (m < 0 ? .08 : -.06), X, Y);
        r.set(X, Y, col);
      }
      px += Math.cos(a); py += Math.sin(a); a += bend / len;
    }
  }
  /** Пальмова гілка: жилка + листочки з обох боків, що коротшають до кінчика. */
  function frond(r, x, y, len, ang, bend, lf) {
    let px = x, py = y, a = ang;
    for (let k = 0; k < len; k++) {
      const q = k / len, ca = Math.cos(a), sa = Math.sin(a);
      r.set(Math.round(px), Math.round(py), LG[2]); r.set(Math.round(px - sa), Math.round(py + ca), LG[1]);
      if (k > len * .12 && k % 3 === 0) for (const sd of [-1, 1]) {
        const L = lf * Math.sin(Math.PI * Math.min(1, (q - .1) * 1.1)) * (.75 + hash(k, sd) * .4), la = a + sd * 1.05 + .35;
        for (let m = 0; m < L; m++) { const mq = m / L, X = Math.round(px + Math.cos(la) * m), Y = Math.round(py + Math.sin(la) * m + mq * mq * 3);
          r.set(X, Y, mq > .85 ? LG[1] : ramp(LG, .7 - mq * .35 - q * .2, X, Y)); r.set(X, Y + 1, sd > 0 && mq > .55 && q > .35 && hash(k, m) < .35 ? RIMP : LG[1]); }
      }
      px += ca; py += sa; a += bend / len;
    }
  }
  /** Вазон-циліндр у перспективі: верхній еліпс видно (ми дивимось згори), неоновий обідок. */
  function pot(r, cx, top, w, h, ry) {
    for (let j = -ry; j < h + ry; j++) for (let i = -w / 2; i < w / 2; i++) {
      const u = (i + .5) / (w / 2), e = Math.sqrt(Math.max(0, 1 - u * u)) * ry, inTop = j < ry && Math.abs(j) <= e, body = j >= 0 && j <= h + e * .9;
      if (!body && !inTop) continue;
      const X = cx + i, Y = top + j; let col;
      if (j <= e && j >= -e) col = j > e - 2.2 ? (u > -.5 && u < .7 ? K[2] : K[1]) : Math.abs(j) > e - 1.2 ? K[1] : ramp(['#120804', '#20120a', '#2e1c10'], .5 - j / ry * .3, X, Y);   // обідок і земля
      else col = (j > h + e * .9 - 1.5) ? '#05020f' : ramp(POT, .55 + u * .3 - (j / h) * .25 - Math.abs(u) ** 6 * .4, X, Y);      // боки: світло справа (від екранів)
      if (Math.abs(j - h * .35) < 1 && j > e) col = '#3be8ff';                                                                       // неонова смужка на вазоні
      r.set(X, Y, col);
    }
  }

  // ---------- спільна логіка рослини: шари зі смужками-гойданням + тап ----------
  function plant({ id, build, x, y, floorY, amp = 1, hit, hang = false, back = false }) {
    const bands = 18;
    return NX.addObject({
      id, name: 'obj.plant', act: 'rustle', hit, shake: 0, b: null,
      onTap() { this.shake = 1; NX.nexi.emote('happy', 1.5); for (let i = 0; i < 8; i++) NX.fx.emit('spark', hit.x + Math.random() * hit.w, hit.y + Math.random() * hit.h * .6, { col: Math.random() < .6 ? '#7aff9a' : '#ff9ae6', vy: -20 - Math.random() * 20, g: 30, ttl: 1, s: 1.2 }); return true; },
      update(dt) { this.shake = Math.max(0, this.shake - dt * .9); },
      draw(c, t) {
        if (!this.b) this.b = build();
        const { cv, ox, oy } = this.b, H = cv.height, bh = H / bands, X = x + ox, Y = y + oy, Kk = NX.cam.k * (NX.loop.dpr || 1);
        c.save(); c.imageSmoothingEnabled = Kk * U < .95;
        for (let b = 0; b < bands; b++) {
          const v = hang ? (b + .5) / bands : 1 - (b + .5) / bands, sw = (Math.sin(t * 1.1 + x * .05) * .6 + Math.sin(t * 2.3 + b * .3) * .25) * v * v * amp + Math.sin(t * 18) * this.shake * v * 2.4;
          c.drawImage(cv, 0, b * bh, cv.width, bh + .5, X + sw, Y + b * bh * U, cv.width * U, (bh + .5) * U);
        }
        c.restore();
      },
      drawBack(c, t) { if (back) this.draw(c, t); },
      layers(t) { return back ? [] : [{ y: floorY, draw: c => this.draw(c, t) }]; },
    });
  }

  // ---------- велика пальма біля стіни ----------
  function buildPalm() {
    const ox = -16, oy = 128, r = Raster(130 / U, 236 / U), g = (x, y) => [(x - ox) / U, (y - oy) / U];
    const [px, ptop] = g(...V.p(18, 334, 14)), base = [px, ptop + 2];
    [[-2.3, 330, -1.1], [-2.0, 400, -.9], [-1.8, 470, -.5], [-1.62, 520, -.25], [-1.45, 480, .1], [-1.28, 380, .45], [-1.05, 280, .7], [-2.6, 250, -1.2], [-2.15, 300, -.3], [-1.7, 330, .2]]
      .forEach(([a, len, bend], k) => frond(r, base[0] + (k - 5) * 3, base[1] - 4, len * 1.1, a, bend, 46));
    pot(r, Math.round(px), Math.round(ptop), 104, 96, 12);
    outline(r, OUT);
    return { cv: r.canvas(), ox, oy };
  }
  // ---------- вазон з широким листям ----------
  function buildPot(seed) {
    const ox = -26, oy = -64, r = Raster(52 / U, 72 / U), cx = 26 / U, top = 46 / U;
    for (let k = 0; k < 15; k++) { const a = -Math.PI / 2 + (k - 7) * .2 + (hash(k, seed) - .5) * .2, len = 84 + hash(seed, k) * 50 - Math.abs(k - 7) * 5;
      leaf(r, cx + (k - 7) * 2, top + 2, len, a, 15 + hash(k, seed + 1) * 6, (k - 7) * .1, k > 7 ? 1 : -1); }
    pot(r, cx, top, 60, 70, 8);
    outline(r, OUT);
    return { cv: r.canvas(), ox, oy };
  }

  // ---------- підвісне кашпо з ліанами: густа завіса листя, низ гойдається ----------
  function buildVines() {
    const ox = 0, oy = -4, r = Raster(64 / U, 176 / U), B = (b, F) => V.box(r, ox, oy, U, b, F), g = (x, y) => [(x - ox) / U, (y - oy) / U];
    // ліани: стебло + листочки-серця по черзі, на кінчиках дрібніші
    for (let k = 0; k < 15; k++) {
      const z = 5 + k * 2.9 + hash(k, 1) * 2, len = (40 + hash(k, 2) * 110) / U, [x0, y0] = g(...V.p(9, 14, z)), s0 = V.s(z), ph = hash(k, 3) * 6;
      for (let q = 0; q < len; q++) {
        const X = x0 + Math.sin(q * .035 + ph) * 3 * s0, Y = y0 + q * s0; r.set(X, Y, '#123a2a'); r.set(X + 1, Y, '#0b261c');
        if (q % 9 === 0) { const sd = (q / 9) % 2 ? 1 : -1, sz = (1 - q / len * .5);
          leaf(r, X, Y, (13 + hash(k, q) * 7) * sz, Math.PI / 2 + sd * (1 + hash(q, k) * .5), 4.2 * sz, -sd * .8, sd); }
      }
    }
    B({ x0: 0, x1: 9, y0: 4, y1: 15, z0: 4, z1: 48 }, {
      right: (u, v, i, j) => v < .12 ? K[2] : v < .2 ? K[0] : (Math.abs(v - .6) < .05 ? '#3be8ff' : ramp(POT, .62 - v * .4 - u * .2, i, j)),
      front: (u, v, i, j) => ramp(POT, .7 - v * .3, i, j),
      bottom: (u, v, i, j) => ramp(POT, .22 - v * .1, i, j),
    });
    for (let k = 0; k < 30; k++) { const z = 6 + hash(k, 4) * 40, [x, y] = g(...V.p(9, 4, z)); leaf(r, x, y, 20 + hash(k, 5) * 18, -Math.PI / 2 + (hash(k, 6) - .5) * 2.6, 5, (hash(k, 7) - .5) * 2, k % 2 ? 1 : -1); }   // кущик зверху
    outline(r, OUT);
    return { cv: r.canvas(), ox, oy };
  }
  const fy = V.p(0, 362, -5)[1];
  plant({ id: 'aiVines', build: buildVines, x: 0, y: 0, floorY: 0, amp: 1.6, hang: true, back: true, hit: { x: 0, y: 0, w: 58, h: 150 } });
  plant({ id: 'aiPalm', build: buildPalm, x: 0, y: 0, floorY: 358, amp: 1.4, hit: { x: 0, y: 150, w: 70, h: 212 } });
  plant({ id: 'aiPotA', build: () => buildPot(3), x: 222, y: fy, floorY: fy, amp: .8, hit: { x: 210, y: fy - 62, w: 26, h: 62 } });
  plant({ id: 'aiPotB', build: () => buildPot(8), x: 318, y: fy, floorY: fy, amp: .8, hit: { x: 306, y: fy - 62, w: 26, h: 62 } });
})();
