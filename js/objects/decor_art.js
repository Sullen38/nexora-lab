/* ============================================================================
 * objects/decor_art.js — АРТЕФАКТИ СОТ: живий піксель-арт (Декор стін · 55)
 * ----------------------------------------------------------------------------
 * Власник (13.11): «кожна сота має мати свій особливий артефакт; тап по соті — картка з тим, що всередині; об'єкт має бути
 * видно повністю в картці + з анімацією — як із рослинами».
 * 13 артефактів, кожен — власний спрайт 28×30 пікселів, намальований кодом (нічого не вирізано з картинок) і ЖИВИЙ:
 * малюнок залежить від часу t (плазма в кулі, пісок сиплеться й годинник перевертається, краплі лави, глобус обертається,
 * термінал друкує, куб перекручує шар…). Один і той самий спрайт:
 *   • стоїть у своїй соті в кімнаті — objects/decor_live.js (drawArt) малює його у вікні комірки;
 *   • показується цілим і збільшеним у картці «РІЧ NEXI» — objects/decor_guide.js.
 * Який артефакт у якій соті — tools/wingbox/decor.py (ITEMS, dc.kind у dc_hxaN). Тексти карток — i18n decor.guide.art.items.
 * API: NX.decorArt = { KINDS, W, H, has(kind), sprite(kind, t, K = 2) -> canvas (W·K)×(H·K) (кадр кешується, FPS кадрів/с), glow(kind) }.
 * ========================================================================== */
(() => {
  const W = 28, H = 30, FPS = 10, TAU = Math.PI * 2;
  const CC = {}, u32 = h => CC[h] !== undefined ? CC[h] : (CC[h] = (() => { const n = parseInt(h.slice(1, 7), 16); return ((255 << 24) | ((n & 255) << 16) | (((n >> 8) & 255) << 8) | (n >> 16)) >>> 0; })());
  const U = c => typeof c === 'string' ? u32(c) : c;
  /** Змішати два кольори (k: 0 — a, 1 — b) -> uint. */
  const mix = (a, b, k) => { a = U(a); b = U(b); const f = s => Math.round(((a >> s) & 255) + (((b >> s) & 255) - ((a >> s) & 255)) * k); return ((255 << 24) | (f(16) << 16) | (f(8) << 8) | f(0)) >>> 0; };
  const tone = (P, k) => P[Math.max(0, Math.min(P.length - 1, Math.round(k * (P.length - 1))))];
  const hash = (a, b = 0) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
  const OUT = u32('#0b0620');

  /** Полотно-буфер артефакта: логічна сітка W×H, кожен логічний піксель — K×K справжніх. Фігури (rect / ell / poly / fill)
   *  рахуються в справжніх пікселях — що більший K, то плавніші краї й тонші переходи світла; set / line / star — блоками K×K. */
  function board(K) {
    const WK = W * K, HK = H * K, buf = new Uint32Array(WK * HK);
    const S = {
      sy: 1,                                                                                         // вертикальне «перекидання» (пісочний годинник)
      clear() { buf.fill(0); S.sy = 1; },
      px(X, Y, c) { if (c == null) return; if (S.sy !== 1) Y = Math.floor(15 * K + (Y + .5 - 15 * K) * S.sy); if (X < 0 || Y < 0 || X >= WK || Y >= HK) return; buf[Y * WK + X] = U(c); },
      set(x, y, c) { if (c == null) return; x = Math.floor(x) * K; y = Math.floor(y) * K; for (let j = 0; j < K; j++) for (let i = 0; i < K; i++) S.px(x + i, y + j, c); },
      /** Прямокутник логічних пікселів x0..x1 × y0..y1: f(fx, fy, x, y) — fx, fy — точні логічні координати центра справжнього пікселя. */
      fill(x0, y0, x1, y1, f) { for (let Y = y0 * K; Y < (y1 + 1) * K; Y++) for (let X = x0 * K; X < (x1 + 1) * K; X++) { const fx = (X + .5) / K, fy = (Y + .5) / K; S.px(X, Y, f(fx, fy, Math.floor(fx), Math.floor(fy))); } },
      rect(x, y, w, h, f) { if (typeof f !== 'function') { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) S.set(x + i, y + j, f); return; } S.fill(x, y, x + w - 1, y + h - 1, (fx, fy, xi, yi) => f(xi, yi, (fx - x) / w, (fy - y) / h)); },
      ell(cx, cy, rx, ry, f) { S.fill(Math.floor(cx - rx), Math.floor(cy - ry), Math.ceil(cx + rx), Math.ceil(cy + ry), (fx, fy, xi, yi) => { const u = (fx - cx) / rx, v = (fy - cy) / ry; return u * u + v * v <= 1 ? (typeof f === 'function' ? f(xi, yi, u, v) : f) : null; }); },
      poly(p, f) { let x0 = 99, y0 = 99, x1 = -99, y1 = -99; for (const q of p) { x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); }
        S.fill(Math.floor(x0), Math.floor(y0), Math.ceil(x1), Math.ceil(y1), (px, py, xi, yi) => { let ins = false;
          for (let i = 0, j = p.length - 1; i < p.length; j = i++) if ((p[i][1] > py) !== (p[j][1] > py) && px < (p[j][0] - p[i][0]) * (py - p[i][1]) / (p[j][1] - p[i][1]) + p[i][0]) ins = !ins;
          return ins ? (typeof f === 'function' ? f(xi, yi, (px - x0) / Math.max(1, x1 - x0), (py - y0) / Math.max(1, y1 - y0), px, py) : f) : null; }); },
      line(x0, y0, x1, y1, c) { const n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))) || 1; for (let k = 0; k <= n; k++) S.set(Math.round(x0 + (x1 - x0) * k / n), Math.round(y0 + (y1 - y0) * k / n), c); },
      /** Темний контур довкола намальованого (після тіла, перед іскрами). */
      out() { const g = (x, y) => x < 0 || y < 0 || x >= WK || y >= HK ? 0 : buf[y * WK + x];
        for (let n = K >= 3 ? 2 : 1; n--;) { const o = []; for (let y = 0; y < HK; y++) for (let x = 0; x < WK; x++) if (!buf[y * WK + x] && (g(x - 1, y) || g(x + 1, y) || g(x, y - 1) || g(x, y + 1))) o.push(y * WK + x); for (const q of o) buf[q] = OUT; } S.sy = 1; },
      /** Блиск-зірочка: ph 0..1 — фаза (спалахує й гасне). */
      star(x, y, ph, c = '#ffffff') { const k = Math.sin(Math.max(0, Math.min(1, ph)) * Math.PI); if (k < .25) return; S.set(x, y, c); if (k > .6) { S.set(x - 1, y, c); S.set(x + 1, y, c); S.set(x, y - 1, c); S.set(x, y + 1, c); } },
      /** Косий відблиск проїжджає по намальованому (золото, скло): s — фаза 0..1, лише рядки y0..y1. */
      shine(s, y0 = 0, y1 = H - 1, c = '#fffbe0') { const d = s * 80 - 16; for (let y = y0 * K; y < (y1 + 1) * K; y++) for (let x = 0; x < WK; x++) { const v = buf[y * WK + x]; if (v && v !== OUT && Math.abs((x + y) / K - d) < 1.6) buf[y * WK + x] = mix(v, c, .75); } },
      buf,
    };
    return S;
  }

  const GOLD = ['#4a2c06', '#8a5a10', '#c8901e', '#f4c842', '#fff0a0'], MARBLE = ['#5a5a80', '#8c8cb0', '#c4c4dc', '#eeeef8'];
  const CHROME = ['#2a2a48', '#5a5a86', '#9a9ac4', '#d4d4f0', '#ffffff'], DARK = ['#101024', '#20203e', '#363664', '#5c5c9a'];
  const gold = (x, y, u) => tone(GOLD, .9 - u * .62), chrome = (x, y, u) => tone(CHROME, .85 - Math.abs(u - .3) * 1.1);

  // ============================== 13 АРТЕФАКТІВ ==============================
  const ART = {
    /** Золота статуетка Nexi з паростком на мармуровому п'єдесталі: відблиск проїжджає золотом, очі блимають. */
    figure(S, t) {
      S.rect(8, 24, 12, 2, (x, y, u) => tone(MARBLE, .95 - u * .5)); S.rect(9, 26, 10, 3, (x, y, u) => tone(MARBLE, (x * 7 + y * 3) % 5 === 0 ? .2 : .75 - u * .5)); S.rect(8, 29, 12, 1, MARBLE[0]);
      S.rect(11, 22, 2, 2, GOLD[2]); S.rect(15, 22, 2, 2, GOLD[1]);                                    // ноги
      S.rect(10, 16, 8, 6, gold); S.rect(12, 18, 4, 2, GOLD[4]); S.set(13, 18, GOLD[2]); S.set(14, 19, GOLD[2]);   // тулуб з табличкою
      S.line(9, 17, 7, 13, GOLD[3]); S.line(8, 17, 6, 13, GOLD[2]); S.line(18, 17, 19, 21, GOLD[1]);   // рука вгору (тримає паросток) і рука вниз
      S.rect(8, 7, 12, 9, (x, y, u, v) => (x === 8 || x === 19) && (y === 7 || y === 15) ? null : tone(GOLD, .95 - u * .55 - v * .15));   // голова
      S.rect(10, 10, 8, 4, GOLD[0]); const bl = (t % 4.2) > 4.05;
      if (!bl) { S.rect(11, 11, 2, 2, GOLD[4]); S.rect(15, 11, 2, 2, GOLD[4]); } else { S.rect(11, 12, 2, 1, GOLD[3]); S.rect(15, 12, 2, 1, GOLD[3]); }
      S.rect(14, 4, 1, 3, GOLD[2]); S.rect(13, 2, 3, 2, GOLD[4]);                                     // антена
      S.line(6, 12, 6, 9, '#2ea04a'); S.rect(4, 8, 2, 2, '#4ae07a'); S.set(3, 7, '#8aff9a'); S.rect(7, 7, 2, 2, '#4ae07a'); S.set(9, 6, '#8aff9a');   // паросток у руці
      S.out(); S.shine((t * .3) % 1, 0, 23);
      S.star(21, 6, (t * .7) % 1.6); S.star(5, 19, (t * .7 + .8) % 1.6, '#fff0a0');
    },
    /** Кришталева куля на золотій підставці: усередині крутиться плазма, іскри кружляють. */
    orb(S, t) {
      S.poly([[8, 30], [20, 30], [18, 25], [10, 25]], gold); S.rect(10, 24, 8, 1, GOLD[4]);
      const P = ['#1a0a4a', '#3a1a8a', '#6a3ad8', '#a86aff', '#e0b8ff'];
      S.ell(14, 14, 10.5, 10.5, (x, y, u, v) => { const a = Math.atan2(v, u), r = Math.hypot(u, v), k = Math.sin(a * 2 + t * 1.4 + r * 5) * .5 + Math.sin(-a * 3 + t * .9 + r * 3) * .5;
        if (r > .9) return mix(P[3], '#e8f4ff', .35 + .3 * (-u - v)); if (r < .2 + .05 * Math.sin(t * 3)) return '#ffffff';
        if (k > .72) return '#7af0ff'; return tone(P, .42 + k * .36 - r * r * .2); });
      S.rect(8, 8, 3, 1, '#f4e8ff'); S.rect(7, 9, 2, 2, '#f4e8ff'); S.set(19, 20, '#c8a8ff');          // відблиск скла
      S.out();
      for (let q = 0; q < 3; q++) { const a = t * (1.1 + q * .3) + q * 2.1; if (Math.sin(a) > -.2) S.set(14 + Math.cos(a) * 12.5, 14 + Math.sin(a) * 3 - Math.cos(a) * 3, q === 1 ? '#7af0ff' : '#ffffff'); }
    },
    /** Книжки й кристал-підпірка: кристал пульсує, над ним злітають іскри. */
    books(S, t) {
      const B = [[2, 4, 21, ['#6a1020', '#b02038', '#e84a5a']], [6, 3, 17, ['#102a6a', '#2050b8', '#4a86f0']], [9, 4, 23, ['#0e4a2a', '#1e8a48', '#48c878']], [13, 3, 19, ['#6a4a08', '#c89018', '#f8d040']], [16, 4, 21, ['#3a1a6a', '#6a3ab8', '#a070f0']]];
      for (const [x, w, h, P] of B) { S.rect(x, 30 - h, w, h, (px, py, u) => u < .26 ? P[2] : u > .76 ? P[0] : P[1]); S.rect(x, 33 - h, w, 1, '#ffe9b0'); S.rect(x, 26, w, 1, '#ffe9b0'); S.set(x + 1, 36 - h, '#ffe9b0'); S.rect(x, 30 - h, w, 1, mix(P[2], '#ffffff', .4)); }
      const k = .5 + .5 * Math.sin(t * 2.2), C = ['#3a0a7a', '#7a2ad8', '#b46aff', '#ecd0ff'];
      S.poly([[21, 30], [20.5, 19], [23.5, 11], [26.5, 19], [26, 30]], (x, y, u, v, fx) => { const l = fx < 23 ? .72 : fx < 24 ? .98 : .36; return mix(tone(C, l), '#ffffff', k * (fx >= 23 && fx < 24 ? .6 : .18)); });
      S.out();
      for (let q = 0; q < 4; q++) { const f = (t * .35 + q / 4) % 1; S.star(22 + Math.round(Math.sin(q * 3 + t) * 2.4) + (q % 2), 10 - f * 9, 1 - f, q % 2 ? '#ecd0ff' : '#ffffff'); }
    },
    /** Куля-тераріум: мох, паросток гойдається, гриб світиться, світлячки. */
    terrarium(S, t) {
      S.rect(9, 27, 10, 3, (x, y, u) => tone(['#2a160a', '#4a2a12', '#6e421e', '#946030'], .9 - u * .7)); S.rect(12, 2, 4, 2, '#b88a4a'); S.rect(12, 2, 4, 1, '#e0b878');
      S.ell(14, 15, 11, 11, (x, y, u, v) => { const r = Math.hypot(u, v), top = 19 + Math.round(Math.sin(x * .9) * .8);
        if (r > .9) return mix('#6ac8e8', '#ffffff', .3 * Math.max(0, -u - v)); if (y >= top + 2) return (x * 5 + y * 3) % 7 === 0 ? '#7a5228' : (x + y) % 2 ? '#4a2e16' : '#3a2412';
        if (y >= top) return tone(['#0e4a1e', '#1e7a30', '#3aa848', '#7ad860'], hash(x, y) * .7 + (y === top ? .3 : 0)); return tone(['#081a2c', '#0e2a40', '#143a54'], .2 + (1 - r) * .8); });
      for (let y = 18; y >= 10; y--) { const sx = 14 + Math.round(Math.sin(t * 1.3) * (18 - y) / 8 * 1.6); S.set(sx, y, y < 12 ? '#8aff9a' : '#3ac85a');                                    // паросток
        if (y === 10) { S.rect(sx - 3, y - 1, 3, 2, '#4ae07a'); S.set(sx - 4, y - 2, '#8aff9a'); S.rect(sx + 1, y - 2, 3, 2, '#4ae07a'); S.set(sx + 4, y - 3, '#8aff9a'); }
        if (y === 14) { S.rect(sx + 1, y, 2, 1, '#4ae07a'); S.set(sx - 1, y + 1, '#4ae07a'); S.set(sx - 2, y, '#4ae07a'); } }
      S.line(8, 18, 8, 16, '#2a9a40'); S.set(7, 15, '#4ae07a'); S.set(9, 15, '#4ae07a'); S.set(7, 17, '#4ae07a');                                 // папороть
      const g = .5 + .5 * Math.sin(t * 1.7); S.rect(19, 17, 1, 2, '#d8f4ff'); S.rect(18, 15, 3, 2, mix('#1aa0c8', '#b0f8ff', g)); S.set(19, 14, mix('#3be8ff', '#ffffff', g));   // світний гриб
      S.rect(7, 8, 1, 3, '#d8f8ff'); S.rect(8, 7, 2, 1, '#d8f8ff');
      S.out();
      for (let q = 0; q < 3; q++) if (Math.sin(t * 2 + q * 2.1) > 0) S.set(14 + Math.sin(t * .7 + q * 2) * 6, 11 + Math.cos(t * .9 + q * 1.7) * 4, '#f4ff8a');
    },
    /** Колба з сироваткою: рідина хлюпає, бульбашки піднімаються, над горлечком пара. */
    flask(S, t) {
      const hw = y => y < 12 ? 2 : y > 25 ? 9.5 - (y - 25) * 1.2 : 2 + (y - 12) / 13 * 7.5, L = ['#0a5a2a', '#18a04a', '#4ae07a', '#a8ffc0'];
      S.fill(3, 4, 24, 27, (fx, fy) => { const dx = Math.abs(fx - 14), y = fy - .5, h = hw(y); if (dx > h) return null; const lv = 17 + Math.sin(fx * .8 + t * 2.6) * .9;
        if (dx > h - 1 || fy > 27) return fx < 14 ? '#d8f4ff' : '#8ac8e8'; if (y >= lv) return y < lv + 1 ? L[3] : tone(L, .75 - (fx - 5) / 26 - (y - lv) * .012); return '#12283c'; });
      S.rect(11, 3, 6, 1, '#e8f8ff'); S.rect(6, 20, 1, 4, '#d8fff0'); S.set(7, 19, '#d8fff0');
      S.out();
      for (let q = 0; q < 5; q++) { const f = (t * (.4 + .25 * hash(q, 2)) + hash(q, 4)) % 1, y = 26 - f * 9; S.set(14 + (hash(q, 6) - .5) * 12 * (1 - f * .5), y, f > .85 ? '#ffffff' : '#d8fff0'); }
      for (let q = 0; q < 2; q++) { const f = (t * .45 + q * .5) % 1; if (f < .8) S.set(13 + q + Math.round(Math.sin(t * 2 + q * 3) * 1.2), 2 - f * 3, f < .4 ? '#a8ffc0' : '#4ae07a'); }
    },
    /** Мікроскоп: лінза світить на скельце, гвинт фокуса крутиться, спори злітають. */
    scope(S, t) {
      S.rect(5, 27, 17, 3, (x, y, u, v) => tone(DARK, .8 - u * .5 - v * .3)); S.rect(18, 9, 3, 18, (x, y, u) => tone(DARK, 1 - u * .6)); S.rect(11, 8, 10, 3, (x, y, u, v) => tone(DARK, .9 - v * .5));
      S.poly([[8.5, 3], [13, 3], [14.5, 16], [10, 16]], chrome); S.rect(8, 1, 6, 2, DARK[1]); S.rect(9, 1, 4, 1, DARK[3]);
      S.rect(10, 16, 4, 2, gold); S.rect(11, 18, 2, 1, GOLD[1]);
      S.rect(5, 22, 14, 2, (x, y, u, v) => tone(CHROME, .7 - v * .4 - u * .2)); S.rect(8, 21, 8, 1, '#bfe8ff'); S.set(12, 21, '#3bff8a'); S.set(11, 21, '#1e8a48');
      S.rect(11, 25, 3, 2, mix('#c8901e', '#fff0a0', .5 + .5 * Math.sin(t * 2.4)));
      S.ell(22, 15, 2.2, 2.2, (x, y, u, v) => tone(GOLD, .7 - u * .4 - v * .3)); S.set(22 + Math.cos(t * 2.2) * 1.4, 15 + Math.sin(t * 2.2) * 1.4, '#fff0a0');
      S.out();
      const b = .5 + .5 * Math.sin(t * 3.1); S.set(12, 19, mix('#3be8ff', '#ffffff', b)); if (b > .4) S.set(12, 20, '#9af6ff');
      for (let q = 0; q < 3; q++) { const f = (t * .3 + q / 3) % 1; if (f < .85) S.set(15 + q + Math.round(Math.sin(t * 1.5 + q * 2) * 1.5), 20 - f * 11, f < .5 ? '#8aff9a' : '#3ac85a'); }
    },
    /** Золотий кубок із листком: відблиск і зірочки. */
    cup(S, t) {
      S.rect(8, 27, 12, 3, (x, y, u) => tone(['#2a160a', '#4a2a12', '#6e421e', '#946030'], .9 - u * .7)); S.rect(12, 28, 4, 1, GOLD[3]);
      S.rect(11, 26, 6, 1, gold); S.rect(13, 21, 2, 5, gold); S.rect(12, 23, 4, 1, GOLD[3]);
      S.fill(1, 6, 26, 18, (fx, fy) => { const sd = fx < 14 ? -1 : 1, r = Math.hypot((fx - (14 + sd * 7.6)) / 3.9, (fy - 12) / 5); return r > .68 && r < 1.02 && sd * (fx - 14) > 6.4 ? tone(GOLD, (sd < 0 ? .78 : .42) - (r - .68) * .9) : null; });   // ручки
      S.fill(5, 6, 22, 21, (fx, fy) => { const dx = fx - 14, h = fy < 9.5 ? 7.5 : 7.5 * Math.sqrt(Math.max(0, 1 - Math.pow((fy - 9.5) / 12.6, 2))); return Math.abs(dx) > h ? null : fy < 7 ? GOLD[4] : tone(GOLD, .62 - dx / Math.max(1, h) * .42 - (fy - 6) * .012); });
      S.ell(14, 13, 2.3, 3.4, (x, y, u, v) => u < 0 ? '#3ac85a' : '#1e8a48'); S.line(14, 10, 14, 16, '#a8ffc0');                                            // листок-емблема
      S.out(); S.shine((t * .33) % 1, 5, 26);
      S.star(4, 5, (t * .8) % 1.8); S.star(23, 8, (t * .8 + .6) % 1.8, '#fff0a0'); S.star(20, 3, (t * .8 + 1.2) % 1.8);
    },
    /** Лава-лампа: краплі повільно піднімаються, зливаються й падають. */
    lamp(S, t) {
      S.poly([[8, 30], [20, 30], [17.5, 22], [10.5, 22]], chrome); S.poly([[11.5, 1], [16.5, 1], [17.5, 5], [10.5, 5]], chrome);
      const BL = [0, 1, 2].map(q => [14 + Math.sin(t * .45 + q * 1.9) * 1.6, 13 + Math.sin(t * (.32 + .09 * q) + q * 2.1) * 6.6, 1.5 + .45 * hash(q, 3)]);
      S.fill(6, 5, 21, 21, (fx, fy) => { const h = 3.2 + (fy - 5.5) / 16 * 3.3, dx = fx - 14; if (Math.abs(dx) > h) return null;
        let f = fy > 20.5 ? 1.2 : fy > 19.5 ? .55 : fy < 6.5 ? 1.1 : 0; for (const [bx, by, br] of BL) f += br * br / (Math.pow(fx - bx, 2) + Math.pow((fy - by) * .85, 2) + .01);
        const edge = Math.abs(dx) > h - 1; return f > 2 ? '#ffd0f4' : f > 1 ? (edge ? '#e040b8' : '#ff5ad0') : edge ? (dx < 0 ? '#b890ff' : '#5a2aa8') : tone(['#2a0a4a', '#40128a', '#5a1eb0'], (fy - 5.5) / 16); });
      S.rect(9, 9, 1, 6, '#e8d8ff');
      S.out();
    },
    /** Пісочний годинник: пісок сиплеться; коли закінчується — годинник перевертається сам. */
    hourglass(S, t) {
      const T = 9, ph = (t % T) / T, p = Math.min(1, ph / .86), fl = ph > .86 ? (ph - .86) / .14 : 0, SAND = ['#c88a2a', '#f0b84a', '#ffe08a'];
      S.sy = fl ? Math.cos(fl * Math.PI) : 1; if (Math.abs(S.sy) < .12) S.sy = S.sy < 0 ? -.12 : .12;
      S.rect(6, 4, 1, 22, GOLD[1]); S.rect(21, 4, 1, 22, GOLD[0]);
      const hw = y => y < 15 ? .9 + 6.4 * Math.pow(Math.max(0, (14 - y) / 10), .75) : .9 + 6.4 * Math.pow(Math.max(0, (y - 15) / 10), .75);
      S.fill(6, 4, 21, 25, (fx, fy, x) => { const dx = Math.abs(fx - 14), y = fy - .5, h = hw(y); if (dx > h) return null;
        const top = y < 15, sand = top ? y >= 5 + p * 9.5 + dx * .35 : y >= 25.5 - p * 7.5 + dx * .75;
        return dx > h - 1 && !(y > 13 && y < 17) ? (fx < 14 ? '#d8f4ff' : '#8ac8e8') : sand ? tone(SAND, .9 - dx / 7 + ((x + Math.floor(fy)) % 3 === 0 ? -.3 : 0)) : '#14263c'; });
      if (p > 0 && p < 1) for (let y = 15; y < 25; y++) if ((y + Math.floor(t * 14)) % 3) S.set(14, y, SAND[2]);
      S.rect(5, 2, 18, 2, (x, y, u, v) => tone(GOLD, .95 - u * .6 - v * .2)); S.rect(5, 26, 18, 2, (x, y, u, v) => tone(GOLD, .9 - u * .6 - v * .2)); S.rect(6, 28, 3, 1, GOLD[0]); S.rect(19, 28, 3, 1, GOLD[0]);
      S.out();
      if (fl) { S.star(4, 6, fl); S.star(24, 22, fl, '#fff0a0'); }
    },
    /** Куб-головоломка: раз на півтори секунди перекручує один шар. */
    cube(S, t) {
      const COL = ['#ff3a5a', '#3be8ff', '#ffe04a', '#3bff8a', '#ff9a3a', '#f0f0ff'], n = Math.floor(t / 1.5), fr = t / 1.5 - n, L = n % 3, tw = fr < .22;
      S.rect(10, 28, 8, 2, (x, y, u) => tone(DARK, .8 - u * .6));
      S.fill(1, 2, 26, 28, (fx, fy) => { const dx = fx - 14, dy = fy - 15.5; let f = -1, a, b;
        a = (dx / 4 - dy / 2) / 2; b = (-dx / 4 - dy / 2) / 2; if (a >= 0 && a < 3 && b >= 0 && b < 3) f = 0;
        else if (dx >= 0) { a = dx / 4; b = (dy + 2 * a) / 4; if (a < 3 && b >= 0 && b < 3) f = 1; } else { a = -dx / 4; b = (dy + 2 * a) / 4; if (a < 3 && b >= 0 && b < 3) f = 2; }
        if (f < 0) return null; const i = Math.floor(a), j = Math.floor(b), fa = a - i, fb = b - j;
        if (fa < .13 || fb < .13 || fa > .93 || fb > .93) return '#0b0620';
        const mv = f ? j === L : i === L, id = (Math.floor(hash(f * 9 + i, j + 3) * 6) + (mv ? n : 0) + (f === 2 && mv ? 2 : 0)) % 6, gl = fa + fb < .62 ? .25 : 0;      // блік у кутку наліпки
        return mix(mix(mix(COL[id], '#0b0620', f === 0 ? 0 : f === 2 ? .2 : .44), '#ffffff', gl), '#ffffff', mv && tw ? .55 * (1 - fr / .22) : 0); });
      S.out(); S.star(14, 3, (t * .5) % 2.4);
    },
    /** Голо-глобус: планета з материками обертається над проєктором, супутник літає по орбіті. */
    globe(S, t) {
      S.poly([[8, 30], [20, 30], [18, 26], [10, 26]], (x, y, u) => tone(DARK, .85 - u * .6)); S.rect(11, 25, 6, 1, '#3be8ff');
      for (let y = 21; y <= 24; y++) for (let x = 14 - (26 - y); x < 14 + (26 - y); x++) if ((x + y + Math.floor(t * 6)) % 3 === 0) S.set(x, y, '#1a6a8a');   // промінь проєктора
      S.out();                                                                                         // голограма — без контуру: світиться
      const sc = Math.floor(t * 9) % 22;
      S.ell(14, 11.5, 9.5, 9.5, (x, y, u, v) => { const r2 = u * u + v * v, z = Math.sqrt(1 - r2), lon = Math.atan2(u, z) + t * .55, lat = Math.asin(Math.max(-1, Math.min(1, v)));
        const land = Math.sin(lon * 2 + 1) * Math.cos(lat * 3) + Math.sin(lon * 3.7 + 2) * .5 + Math.cos(lat * 5 + lon) * .3 > .34, gl = k => Math.abs((((k * 6 / Math.PI) % 1) + 1) % 1 - .5) > .4;
        let c = r2 > .8 ? '#9af6ff' : land ? (z > .6 ? '#8affc8' : '#3bd8a0') : gl(lon) || gl(lat) ? '#2a9ad8' : '#0c2c50';
        if (y === 2 + sc) c = mix(c, '#ffffff', .45); return c; });
      const a = t * 1.3, sx = 14 + Math.cos(a) * 12.5, sy2 = 11.5 + Math.sin(a) * 3.2 - Math.cos(a) * 2.2;
      if (Math.sin(a) > 0 || Math.abs(Math.cos(a)) > .8) { S.set(sx, sy2, '#ffffff'); S.set(sx - Math.sign(-Math.sin(a)) , sy2, '#3be8ff'); }
    },
    /** Кристали енергії: світло хвилею піднімається гранями, іскри злітають. */
    crystal(S, t) {
      S.poly([[3, 30], [25, 30], [22, 24], [6, 24]], (x, y, u, v) => (x * 3 + y * 5) % 7 === 0 ? '#5a4c98' : tone(['#1a1432', '#2c2452', '#42377a'], .9 - u * .7));
      const cr = (cx, hw, tip, sh, base, lean, P, off) => S.poly([[cx + lean, tip], [cx + hw + lean * .6, sh], [cx + hw, base], [cx - hw, base], [cx - hw + lean * .6, sh]], (x, y, u, v, fx, fy) => {
        const mid = cx + lean * Math.max(0, (base - fy) / (base - tip)), l = (fx < mid ? .7 : .34) + (fy < sh ? .2 : 0) + (Math.abs(fx - mid) < .5 ? .3 : 0), band = base - ((t * .5 + off) % 1) * (base - tip + 4);
        return mix(tone(P, l), '#ffffff', Math.abs(fy - band) < 1.3 ? .6 : 0); });
      cr(8, 2.6, 11, 15, 26, -2, ['#5a0a5a', '#a01aa0', '#ff4fd8', '#ffb0f0', '#ffffff'], .3);
      cr(20.5, 3, 7, 12, 26, 1.5, ['#2a0a6a', '#5a2ad8', '#9a6aff', '#d8c0ff', '#ffffff'], .65);
      cr(14, 4, 1, 8, 27, 0, ['#0a4a7a', '#1a8ac8', '#3be8ff', '#b0f8ff', '#ffffff'], 0);
      S.out();
      for (let q = 0; q < 5; q++) { const f = (t * .3 + hash(q, 1)) % 1; S.star(4 + hash(q, 7) * 20, 22 - f * 20, 1 - f, ['#b0f8ff', '#ffb0f0', '#ffffff'][q % 3]); }
    },
    /** Ретро-термінал: друкує зелені рядки, курсор блимає; час від часу на екрані виростає паросток. */
    console(S, t) {
      const BG = ['#4a463c', '#7c7664', '#aca48c', '#d8d0b8', '#f0ead8'];
      S.poly([[2, 30], [26, 30], [24, 25], [4, 25]], (x, y, u, v) => tone(BG, .85 - u * .4 - v * .2)); for (let y = 26; y <= 28; y++) for (let x = 5 + (y & 1); x <= 22; x += 2) S.set(x, y, (x + y) % 7 === 0 ? '#ff9a3a' : '#3a3830');
      S.rect(11, 23, 6, 2, BG[0]);
      S.rect(4, 4, 20, 19, (x, y, u, v) => (x === 4 || x === 23) && (y === 4 || y === 22) ? null : tone(BG, .95 - u * .45 - v * .25));
      S.rect(6, 6, 16, 13, '#24242c'); S.rect(7, 7, 14, 11, (x, y) => y === 7 + Math.floor(t * 9) % 11 ? '#0a3a1c' : '#04180c');
      const show = (t % 9) > 6.3;
      if (!show) { const sc = Math.floor(t * 1.6), fr = t * 1.6 - sc;
        for (let r = 0; r < 5; r++) { const li = r + sc, len = 3 + Math.floor(hash(li, 5) * 9), n = r === 4 ? Math.floor(len * fr) : len, y = 8 + r * 2;
          for (let k = 0; k < n; k++) if (hash(li, k) > .22) S.set(8 + k, y, li % 4 === 0 ? '#b8ff3a' : '#3bff8a'); if (r === 4 && (t * 3 % 1) < .6) S.set(8 + n, y, '#eaffea'); } }
      else { const g = Math.min(1, ((t % 9) - 6.3) / 1.2), h = Math.round(g * 6); for (let k = 0; k <= h; k++) S.set(14, 16 - k, '#3bff8a');                    // паросток росте на екрані
        if (h >= 3) { S.rect(11, 13, 3, 1, '#b8ff3a'); S.set(10, 12, '#b8ff3a'); } if (h >= 5) { S.rect(15, 11, 3, 1, '#b8ff3a'); S.set(18, 10, '#b8ff3a'); } if (h >= 6) S.set(14, 9, '#eaffea'); S.rect(10, 17, 9, 1, '#1e8a48'); }
      S.rect(6, 20, 8, 1, '#3a3830'); S.rect(6, 21, 6, 1, '#5a5648'); S.set(21, 20, (t % 1.2) < .6 ? '#3bff8a' : '#0e4a1e'); S.set(19, 20, '#ff3a5a');
      S.out();
    },
  };
  const KINDS = ['figure', 'orb', 'books', 'terrarium', 'flask', 'scope', 'cup', 'lamp', 'hourglass', 'cube', 'globe', 'crystal', 'console'];
  const GLOW = { figure: '#ffd27a', orb: '#c88aff', books: '#c88aff', terrarium: '#d8ff6a', flask: '#5af08a', scope: '#3be8ff', cup: '#ffd27a', lamp: '#ff4fd8', hourglass: '#ffd27a', cube: '#ffe04a', globe: '#3be8ff', crystal: '#3be8ff', console: '#3bff8a' };

  const CACHE = {};
  /** Кадр артефакта в час t: полотно (W·K)×(H·K). K — деталізація: 2 — у соті в кімнаті, 3 — у картці (той самий малюнок,
   *  дрібніше промальований). Кадр перемальовується FPS разів на секунду, між ними — той самий. */
  function sprite(kind, t, K = 2) {
    if (!ART[kind]) return null; const key = kind + K; let e = CACHE[key];
    if (!e) { const cv = document.createElement('canvas'); cv.width = W * K; cv.height = H * K; const c = cv.getContext('2d'); e = CACHE[key] = { cv, c, im: c.createImageData(W * K, H * K), S: board(K), fr: -1 }; }
    const fr = Math.floor(t * FPS); if (fr === e.fr) return e.cv; e.fr = fr;
    e.S.clear(); ART[kind](e.S, fr / FPS); new Uint32Array(e.im.data.buffer).set(e.S.buf); e.c.putImageData(e.im, 0, 0); return e.cv;
  }

  NX.decorArt = { KINDS, W, H, has: k => !!ART[k], sprite, glow: k => GLOW[k] || '#ffd27a' };
})();
