/* ============================================================================
 * objects/decor_reefx.js — РИФ · БІЛЬШИЙ І ЖИВІШИЙ: косяк на задньому плані, нічне світіння, голо-монітор (Декор стін · 60)
 * ----------------------------------------------------------------------------
 * Власник (13.11, скрін із зеленою лінією над табличкою «АНАЛІТИКА»): «акваріум зроби більше до зеленої лінії та запропонуй, як
 * його можна зробити ще краще; може, додати на нього міні-монітор голографічний» → з пропозицій: «реалізовуй все».
 * Сам розмір — tools/wingbox/decor.py (RF_DROP). Тут — живе, що з'явилось у вищому склі:
 *   • КОСЯК на задньому плані: 26 дрібних сріблястих рибок глибоко за скелями (back 9 од.) ходять «вісімкою» у верхній половині
 *     води, повертають разом, блищать боками; тап по рифу — розсипаються й збираються знову. Не вид із довідника — тло.
 *   • НІЧ (NX.daylight): вода темнішає, по гребенях живого каменю спалахують вогники біолюмінесценції (бірюза, рожевий,
 *     зелений — кожен у свій такт), у воді дрейфує світний планктон. Удень цього немає.
 *   • ГОЛО-МОНІТОР «ЖИТТЯ РИФУ» — напівпрозора панель перед правим нижнім кутом скла, лежить у площині скла (та сама
 *     перспектива). Три режими: спокій — температура, кисень, солоність (числа «дихають») і «ВРЯТОВАНО: N» (види рифу з довідника);
 *     СКАН — після тапу по мешканцю рифу (картка довідника): рамка-приціл, назва виду, номер; ГОДУВАННЯ — коли Nexi годує
 *     риб: смужка ситості. Тексти — словники (decor.reefmon.*), 4 мови.
 * Підключення: обгортає NX.decorAqua.back / front (objects/decor_aqua.js дає map і reef); монітор — свій об'єкт reefHolo
 * (drawBack після растру крил і живого декору). Перевірка декору вважає його декором (tools/wingbox/decor_check.js).
 * ========================================================================== */
(() => {
  const AQ = NX.decorAqua; if (!AQ || !AQ.map || !AQ.reef) return;
  const M = AQ.map, R = AQ.reef, T = M.T, fh = M.fh, TAU = Math.PI * 2;
  const hash = (a, b = 0) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
  const night = t => 1 - (NX.daylight ? NX.daylight.v(t) : 1);
  const tapAge = t => { const TP = NX.decorLive && NX.decorLive.TP, E = TP && TP.aq; return E && E.aq === 'reef' ? t - E.t0 : 99; };

  // ---------- косяк ----------
  const N = 26, FISH = Array.from({ length: N }, (_, k) => ({ ox: (hash(k, 1) - .5) * 15, oy: (hash(k, 2) - .5) * fh * .16, ph: hash(k, 3) * TAU, sp: .8 + .5 * hash(k, 4), sx: (hash(k, 5) - .5) * 2, sy: (hash(k, 6) - .5) * 2 }));
  const cen = t => [T * (.5 + .34 * Math.sin(t * .11)), fh * (.27 + .1 * Math.sin(t * .22 + 1))];
  function school(fx, t) {
    const [cx, cy] = cen(t), dir = Math.cos(t * .11) >= 0 ? 1 : -1, ta = tapAge(t), sc = ta >= 0 && ta < 2.4 ? Math.sin(Math.min(1, ta / .5) * Math.PI / 2) * (1 - ta / 2.4) : 0, nt = night(t);
    const a = M.S(cx, cy, 9), b = M.S(cx + 1, cy, 9), ux = b[0] - a[0], uy = b[1] - a[1], u = Math.hypot(ux, uy) || 1, sd = ux * dir >= 0 ? 1 : -1;   // куди на екрані «вперед»
    fx.save(); fx.globalCompositeOperation = 'source-over';
    for (const f of FISH) {
      const x = cx + f.ox + Math.sin(t * f.sp + f.ph) * 1.6 + f.sx * sc * 16, y = cy + f.oy + Math.sin(t * f.sp * 1.3 + f.ph * 2) * .8 + f.sy * sc * fh * .22;
      if (x < 1 || x > T - 1 || y < 2 || y > fh * .6) continue; const p = M.S(x, y, 9), L = 1.7 * u, H = .55 * u, fl = .5 + .5 * Math.sin(t * 2.3 + f.ph * 3);
      fx.globalAlpha = (.5 + .35 * fl) * (1 - .45 * nt); fx.fillStyle = fl > .8 ? '#eaf8ff' : '#a8d4f4';
      fx.fillRect(p[0] - L / 2, p[1] - H / 2, L, H); fx.fillRect(p[0] - sd * (L / 2 + H * .7), p[1] - H * .75, H * .7, H * 1.5);                                   // тільце й хвіст
    }
    fx.restore();
  }

  // ---------- ніч ----------
  const BIO = Array.from({ length: 46 }, (_, k) => ({ x: 2 + hash(k, 11) * (T - 4), dy: hash(k, 12) * 2.6, ph: hash(k, 13) * TAU, sp: .5 + hash(k, 14), col: ['#3be8ff', '#ff6ad8', '#7aff9a', '#9a8aff'][k % 4], r: .28 + .3 * hash(k, 15) }));
  const PLK = Array.from({ length: 18 }, (_, k) => ({ x: hash(k, 21) * T, y: hash(k, 22), sp: .2 + .3 * hash(k, 23), ph: hash(k, 24) * TAU }));
  function dim(fx, t) {                                                                 // темніша вода — до всього живого (риби й вогники лишаються яскравими)
    const nt = night(t); if (nt < .05) return; const P = [M.S(0, 0), M.S(T, 0), M.S(T, fh), M.S(0, fh)];
    fx.save(); fx.globalCompositeOperation = 'source-over'; fx.globalAlpha = .36 * nt; fx.fillStyle = '#040420'; fx.beginPath(); P.forEach((p, k) => k ? fx.lineTo(p[0], p[1]) : fx.moveTo(p[0], p[1])); fx.closePath(); fx.fill(); fx.restore();
  }
  function bio(fx, t) {
    const nt = night(t); if (nt < .05) return; fx.save(); fx.globalCompositeOperation = 'lighter';
    for (const b of BIO) { const y = Math.min(R.rk(b.x), R.sy(b.x)) - .3 - b.dy, p = M.S(b.x, y), a = nt * (.25 + .75 * Math.max(0, Math.sin(t * b.sp + b.ph)));
      fx.globalAlpha = a; fx.fillStyle = b.col; fx.fillRect(p[0] - b.r, p[1] - b.r, b.r * 2, b.r * 2); fx.globalAlpha = a * .28; fx.fillRect(p[0] - b.r * 2.4, p[1] - b.r * 2.4, b.r * 4.8, b.r * 4.8); }
    for (const q of PLK) { const x = (q.x + Math.sin(t * .3 + q.ph) * 3 + T) % T, y = fh * (.12 + .6 * ((q.y + t * q.sp * .02) % 1)), p = M.S(x, y, 3);
      fx.globalAlpha = nt * (.3 + .5 * Math.sin(t * 1.7 + q.ph) ** 2); fx.fillStyle = '#9af6ff'; fx.fillRect(p[0] - .22, p[1] - .22, .44, .44); }
    fx.restore();
  }
  const back0 = AQ.back, front0 = AQ.front;
  AQ.back = (fx, aq, A, t) => { if (aq === 'reef') { dim(fx, t); school(fx, t); } back0(fx, aq, A, t); };
  AQ.front = (fx, aq, A, t, list) => { front0(fx, aq, A, t, list); if (aq === 'reef') bio(fx, t); };

  // ---------- голо-монітор ----------
  const MW = 31, MH = 18.5, TXT = (k, v) => NX.t('decor.reefmon.' + k, v);
  let GEO = null;
  function geo() {                                                                      // панель у площині скла, на 2 од. перед ним: правий нижній кут (на екрані), трохи виступає за край скла
    if (GEO) return GEO; const right = M.S(T, fh * .5)[0] > M.S(0, fh * .5)[0], w = 36, h = w * MH / MW, out = 8;      // 36 од. уздовж скла, на 8 од. виступає за правий край
    const xa = right ? T + out - w : w - out, xb = right ? T + out : -out, y1 = fh - 2.5, y0 = y1 - h;
    const o = M.S(xa, y0, -2), ex = M.S(xb, y0, -2), ey = M.S(xa, y1, -2);
    return GEO = { o, ax: [(ex[0] - o[0]) / MW, (ex[1] - o[1]) / MW], ay: [(ey[0] - o[0]) / MH, (ey[1] - o[1]) / MH], x0: Math.min(o[0], ex[0], ey[0]) - 4, x1: Math.max(o[0], ex[0], ey[0]) + 4 };
  }
  const txt = (c, s, x, y, col, size, align) => NX.px.text(c, s, x, y, col, size, align);
  const fit = (c, s, x, y, col, size, align, maxW) => { c.font = size + 'px "Press Start 2P", monospace'; const w = c.measureText(s).width; txt(c, s, x, y, col, w > maxW ? size * maxW / w : size, align); };
  function bar(c, x, y, w, v, col) { c.fillStyle = 'rgba(60,232,255,.18)'; c.fillRect(x, y, w, 1.1); c.fillStyle = col; c.fillRect(x, y, w * Math.max(0, Math.min(1, v)), 1.1); }
  NX.addObject({
    id: 'reefHolo', span: [200, 400],
    drawBack(c, t) {
      const G = geo(); if (G.x1 < NX.cam.x - 10 || G.x0 > NX.cam.x + NX.cam.viewW + 10) return;
      const nt = night(t), fl = .88 + .08 * Math.sin(t * 9) + (hash(Math.floor(t * 6), 3) > .96 ? -.25 : 0), GD = NX.decorGuide, last = GD && GD.last, scan = last && last.e && last.e.grp === 'reef' && t - last.t < 6.5 ? last : null;
      const fa = AQ.feedAge ? AQ.feedAge('reef', t) : -1, feed = !scan && fa >= 0 && fa < 12;
      c.save(); c.transform(G.ax[0], G.ax[1], G.ay[0], G.ay[1], G.o[0], G.o[1]); c.globalAlpha = fl * (1 + .0 * nt);
      // тло й рамка
      c.fillStyle = 'rgba(6,22,64,.66)'; c.fillRect(0, 0, MW, MH); c.fillStyle = 'rgba(60,232,255,.1)'; for (let y = .6; y < MH; y += 1.2) c.fillRect(0, y, MW, .3);              // рядки розгортки
      const sw = (t * 5) % (MH + 6) - 3; c.fillStyle = 'rgba(160,250,255,.1)'; c.fillRect(0, sw, MW, 2.2);                                                                    // смуга оновлення
      c.fillStyle = '#3be8ff'; c.fillRect(0, 0, MW, .35); c.fillRect(0, MH - .35, MW, .35); c.fillRect(0, 0, .35, MH); c.fillRect(MW - .35, 0, .35, MH);
      c.fillStyle = '#eaffff'; for (const [x, y] of [[0, 0], [MW - 2.4, 0], [0, MH - .7], [MW - 2.4, MH - .7]]) c.fillRect(x, y, 2.4, .7);                                    // кутики
      c.fillStyle = scan ? '#ffd27a' : feed ? '#ffb24a' : '#3bff8a'; if (Math.floor(t * 2) % 2 || scan) c.fillRect(MW - 3, 1.6, 1.3, 1.3);                                     // вогник стану
      if (scan) {
        const e = scan.e, nm = String(NX.t('decor.guide.sp.reef.' + e.kind) || ''), u = (t - scan.t) / 6.5, words = nm.split(' '), cut = Math.ceil(words.length / 2), l1 = words.length > 2 ? words.slice(0, cut).join(' ') : nm, l2 = words.length > 2 ? words.slice(cut).join(' ') : '';
        txt(c, TXT('scan'), 1.6, 3.6, '#ffd27a', 2.3, 'left');
        const cx = 6.2, cy = 10.6, r = 3.4 + .3 * Math.sin(t * 6); c.strokeStyle = '#3be8ff'; c.lineWidth = .35; c.beginPath(); c.arc(cx, cy, r, 0, TAU); c.stroke();          // приціл
        c.fillStyle = '#3be8ff'; c.fillRect(cx - r - 1.2, cy - .17, 1.6, .35); c.fillRect(cx + r - .4, cy - .17, 1.6, .35); c.fillRect(cx - .17, cy - r - 1.2, .35, 1.6); c.fillRect(cx - .17, cy + r - .4, .35, 1.6);
        c.fillStyle = '#eaffff'; c.fillRect(cx - 1.8, cy - .7, 2.8, 1.4); c.fillRect(cx + 1, cy - 1.1, 1, 2.2); c.fillStyle = '#04122e'; c.fillRect(cx - 1.3, cy - .35, .5, .5);   // значок-рибка
        fit(c, l1, 11.4, l2 ? 9 : 10.6, '#eaffff', 2.1, 'left', MW - 12.6); if (l2) fit(c, l2, 11.4, 12, '#eaffff', 2.1, 'left', MW - 12.6);
        txt(c, '№ ' + e.no, 11.4, 15.6, '#9ad8ff', 1.9, 'left'); bar(c, 1.6, 16.4, 8.4, Math.min(1, u * 2.2), '#ffd27a');
      } else if (feed) {
        txt(c, TXT('feed'), MW / 2, 4.4, '#ffb24a', 2.4, 'center'); const v = Math.min(1, fa / 9);
        c.fillStyle = 'rgba(255,178,74,.18)'; c.fillRect(3, 7.2, MW - 6, 3.4); c.fillStyle = '#ffb24a'; c.fillRect(3, 7.2, (MW - 6) * v, 3.4); c.fillStyle = '#fff0c0'; c.fillRect(3, 7.2, (MW - 6) * v, .7);
        txt(c, Math.round(v * 100) + '%', MW / 2, 15, '#eaffff', 2.6, 'center');
      } else {
        txt(c, TXT('title'), 1.6, 3.6, '#7aff9a', 2.3, 'left');
        const rows = [[TXT('temp'), (25.4 + .2 * Math.sin(t * .31)).toFixed(1), .78 + .04 * Math.sin(t * .31), '#ffb24a'], ['O2', Math.round(97 + 1.4 * Math.sin(t * .23 + 1)) + '%', .95 + .03 * Math.sin(t * .23 + 1), '#3be8ff'], [TXT('salt'), (35 + .3 * Math.sin(t * .17 + 2)).toFixed(1), .7 + .03 * Math.sin(t * .17 + 2), '#ff6ad8']];
        rows.forEach(([k, v, f, col], q) => { const y = 6.9 + q * 2.9; txt(c, k, 1.6, y, '#9ad8ff', 1.9, 'left'); bar(c, 9.6, y - 1.4, 11, f, col); txt(c, v, MW - 1.6, y, '#eaffff', 1.9, 'right'); });
        const n = Object.keys(NX.t('decor.guide.sp.reef') || {}).length; fit(c, TXT('saved', { n }), MW / 2, 16.6, '#7aff9a', 2, 'center', MW - 3);
      }
      c.restore();
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = (.05 + .07 * nt) * fl; c.fillStyle = '#3be8ff';                                                         // сяйво панелі на скло
      const P = [[-1.5, -1.5], [MW + 1.5, -1.5], [MW + 1.5, MH + 1.5], [-1.5, MH + 1.5]].map(([x, y]) => [G.o[0] + G.ax[0] * x + G.ay[0] * y, G.o[1] + G.ax[1] * x + G.ay[1] * y]);
      c.beginPath(); P.forEach((p, k) => k ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); c.fill(); c.restore();
    },
  });
})();
