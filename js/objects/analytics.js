/* ============================================================================
 * objects/analytics.js — АНАЛІТИКА («ОБСЕРВАТОРІЯ ДАНИХ»): ЖИВИЙ ОБ'ЄКТ
 * ----------------------------------------------------------------------------
 * Нерухома частина (скляний стіл із заокругленим кінцем, тумба, серверна стійка, «труба даних» у просторі для ніг, рамка
 * зі «стіною даних») — у 3D-розкладці (gen_room.py: analytics(); грані й живі грані — objects/an_paint.js). Тут — те, що
 * живе поверх (крок 9, власник: «екрани — пласкі, зрідка глючать; більше графіки, фішок; вклади душу»):
 *   ГОЛО-ПАНЕЛІ ВІДВІДУВАЧІ й ВИРУЧКА — пласкі, без рамки, перед «стіною даних» (NX.arc.holo.pane; вміст — NX.arc.anPane);
 *     глючить ОДНА за раз і рідко (раз на 16–32 с);
 *   ГОЛО-ДІАГРАМА над проєктором на столі: стовпчики по колу повільно обертаються в справжній перспективі кімнати, кільце-
 *     основа, промінь з лінзи; з панелей у лінзу «стікають» дані; зрідка над діаграмою спливає знахідка «▲ +N%»;
 *   РАДАР-ТАРІЛКА на шапці: повертається туди-сюди, з антени розходяться хвилі;
 *   ПАРА над чашкою кави.
 * Стан для екранів і Nexi (наступний крок): active / prog (задача, nexi.js: work.obj = 'analytics') — коли Nexi працює,
 * усе біжить швидше. Координати — px картинки зони -> світ -> екран (NX.arc.zone, якорі розкладки).
 * ========================================================================== */
(() => {
  const P = NX.px, T = NX.arc.pt, proj = NX.px3d.proj, hash = NX.art.hash, D = NX.persp.D, sc = z => D / (D + z);
  let Z = null; const zone = () => Z || (Z = NX.arc.zone && NX.arc.zone('analytics'));
  const PANES = [{ kind: 'visitors', X: [312, 395], seed: 1 }, { kind: 'revenue', X: [403, 486], seed: 2 }];
  let panes = null;
  const mk = () => panes || (panes = PANES.map(p => NX.arc.holo.pane({ zone: 'analytics', item: 'an_back', Xc: 399, X: p.X, Y: [120, 252], dv: 7, rgb: '150,240,255', seed: p.seed, lagMin: 0,
    paint: (c, fw, fh, t) => NX.arc.anPane(p.kind, c, fw, fh, t) })));
  const FX = { pops: [], nextLag: 14 + Math.random() * 10, nextPop: 4 };
  const val = (k, t, act) => .5 + .3 * Math.sin(t * (act ? 2.1 : .8) + k * 1.9) + .18 * Math.sin(t * .37 + k * .7);   // висота стовпчика 0..1

  /** Еліпс-кільце в площині підлоги на висоті y навколо точки світу C (радіус r од. світу) — ламаною з n точок. */
  function ring(c, C, y, r, kz = .8, n = 28) { c.beginPath(); for (let i = 0; i <= n; i++) { const a = i / n * Math.PI * 2, p = proj([C[0] + Math.cos(a) * r, y, C[2] + Math.sin(a) * r * kz]); i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); } }
  /** ГОЛО-ДІАГРАМА над проєктором: промінь з лінзи, кільця-основа, стовпчики по колу (у справжній перспективі: дальні —
   *  тьмяніші й менші, ближчі — яскраві), найвищий — рожевий з підписом. */
  function chart(c, z, t, act) {
    const L = z.anchor('anPuck'); if (!L) return null;
    const lens = proj(L), y0 = L[1] - 3, R = 14, n = 10, th = t * (act ? .8 : .3), k0 = sc(L[2]);
    c.save(); c.globalCompositeOperation = 'lighter';
    const top = proj([L[0], y0 - 27, L[2]]), g = c.createLinearGradient(0, lens[1], 0, top[1]);
    g.addColorStop(0, 'rgba(120,240,255,.3)'); g.addColorStop(1, 'rgba(120,240,255,0)'); c.fillStyle = g;
    c.beginPath(); c.moveTo(lens[0] - 2.5 * k0, lens[1]); c.lineTo(lens[0] + 2.5 * k0, lens[1]); c.lineTo(lens[0] + R * 1.3 * k0, top[1]); c.lineTo(lens[0] - R * 1.3 * k0, top[1]); c.closePath(); c.fill();
    P.glow(c, lens[0], lens[1], 7 * k0, 'rgba(150,245,255,.9)', .8);
    ring(c, L, y0, R + 3); c.strokeStyle = 'rgba(120,235,255,.75)'; c.lineWidth = .6; c.stroke();
    ring(c, L, y0, R + 1.2); c.strokeStyle = 'rgba(120,235,255,.3)'; c.lineWidth = .4; c.stroke();
    const sweep = th * 2.3; for (let i = 0; i < 6; i++) { const a = sweep - i * .09, p = proj([L[0] + Math.cos(a) * (R + 3), y0, L[2] + Math.sin(a) * (R + 3) * .8]); c.fillStyle = `rgba(230,255,255,${.9 - i * .14})`; c.fillRect(p[0] - .5, p[1] - .5, 1, 1); }
    const bars = []; let best = 0;
    for (let k = 0; k < n; k++) { const a = th + k / n * Math.PI * 2, v = val(k, t, act); bars.push({ k, x: L[0] + Math.cos(a) * R, zz: L[2] + Math.sin(a) * R * .8, h: 5 + 21 * v, v }); if (v > bars[best].v) best = k; }
    bars.slice().sort((a, b) => b.zz - a.zz).forEach(b => {
      const p0 = proj([b.x, y0, b.zz]), p1 = proj([b.x, y0 - b.h, b.zz]), w = 3.1 * sc(b.zz), fr = b.zz < L[2], col = b.k === best ? '255,110,225' : '80,225,255';
      const gg = c.createLinearGradient(0, p1[1], 0, p0[1]); gg.addColorStop(0, `rgba(${col},${fr ? .85 : .45})`); gg.addColorStop(1, `rgba(${col},${fr ? .2 : .08})`);
      c.fillStyle = gg; c.fillRect(p0[0] - w / 2, p1[1], w, p0[1] - p1[1]);
      c.fillStyle = `rgba(255,255,255,${fr ? .95 : .45})`; c.fillRect(p1[0] - w / 2, p1[1] - .35, w, .7);
    });
    c.restore();
    const b = bars[best], tp = proj([b.x, y0 - b.h - 3, b.zz]);                                               // підпис найвищого
    c.save(); c.font = '3.6px "Press Start 2P", monospace'; c.textAlign = 'center'; c.fillStyle = '#ffc4f0'; c.fillText(NX.num(b.v * 30, 1) + '%', tp[0], tp[1]); c.restore();
    return { lens, top: proj([L[0], y0 - 30, L[2]]), k0 };
  }
  /** Дані «стікають» з панелей у лінзу проєктора: світлі точки по прямій від низу панелі до лінзи. */
  function bits(c, lens, t, act) {
    if (!panes) return; c.save(); c.globalCompositeOperation = 'lighter';
    panes.forEach((p, n) => { const q = p.quad(); if (!q) return; const n0 = act ? 7 : 3;
      for (let i = 0; i < n0; i++) { const ph = (t * (act ? .9 : .45) + i / n0 + n * .37) % 1, u = .15 + .7 * hash(i + n * 9, Math.floor(t * (act ? .9 : .45) + i / n0 + n * .37)), x0 = q[3][0] + (q[2][0] - q[3][0]) * u, y0 = q[3][1] + (q[2][1] - q[3][1]) * u - 2;
        const x = x0 + (lens[0] - x0) * ph * ph, y = y0 + (lens[1] - y0) * ph, a = Math.sin(ph * Math.PI); c.fillStyle = `rgba(${i % 3 ? '170,250,255' : '255,170,240'},${a * .9})`; c.fillRect(x - .5, y - .5, 1, 1); } });
    c.restore();
  }
  /** РАДАР-ТАРІЛКА на шапці: стійка, тарілка (повертається — еліпс звужується), опромінювач з вогником, хвилі в небо. */
  function dish(c, z, t, act) {
    const A0 = z.anchor('anDish'); if (!A0) return; const b = proj(A0), k = sc(A0[2]) * 1.45, a = Math.sin(t * (act ? .8 : .3)) * 1.15, ca = Math.cos(a), sa = Math.sin(a);
    c.fillStyle = '#05030f'; c.fillRect(b[0] - 1.6 * k, b[1] - 6 * k, 3.2 * k, 6 * k); c.fillStyle = '#5a5aa0'; c.fillRect(b[0] - 1.1 * k, b[1] - 6 * k, 2.2 * k, 6 * k); c.fillStyle = '#c8d0f0'; c.fillRect(b[0] - 1.1 * k, b[1] - 6 * k, .6 * k, 6 * k);
    c.fillStyle = '#1a1840'; rrect(c, b[0] - 3 * k, b[1] - 1.6 * k, 6 * k, 1.6 * k);                                // основа на шапці
    const cx = b[0] + sa * 1.2 * k, cy = b[1] - 10 * k, rx = Math.max(.9, 6.6 * Math.abs(ca)) * k, ry = 6.6 * k;
    c.fillStyle = '#0a0a24'; c.beginPath(); c.ellipse(cx, cy, rx + .7 * k, ry + .7 * k, 0, 0, 7); c.fill();
    const g = c.createLinearGradient(cx - rx, cy - ry, cx + rx, cy + ry); g.addColorStop(0, ca > 0 ? '#e8ecff' : '#4a4a86'); g.addColorStop(.6, '#8a8ec8'); g.addColorStop(1, '#2a2a5a');
    c.fillStyle = g; c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, 0, 7); c.fill();
    c.strokeStyle = 'rgba(59,232,255,.9)'; c.lineWidth = .5 * k; c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, 0, 7); c.stroke();
    if (ca > 0) { c.strokeStyle = 'rgba(40,40,90,.6)'; c.lineWidth = .3 * k; c.beginPath(); c.ellipse(cx, cy, rx * .6, ry * .6, 0, 0, 7); c.stroke(); }
    const fx = cx + sa * 7 * k, fy = cy - 1.2 * k; c.strokeStyle = '#c8d0f0'; c.lineWidth = .6 * k; c.beginPath(); c.moveTo(cx, cy); c.lineTo(fx, fy); c.stroke();   // опромінювач
    const on = Math.sin(t * 6) > 0; c.fillStyle = on ? '#ff4f6a' : '#7a1a2a'; c.beginPath(); c.arc(fx, fy, .9 * k, 0, 7); c.fill(); if (on) P.glow(c, fx, fy, 4 * k, 'rgba(255,80,110,.8)', .7);
    c.save(); c.globalCompositeOperation = 'lighter';                                                           // хвилі
    for (let i = 0; i < 3; i++) { const ph = (t * (act ? .9 : .45) + i / 3) % 1, r = (3 + ph * 16) * k; c.strokeStyle = `rgba(120,240,255,${(1 - ph) * .55})`; c.lineWidth = .5;
      c.beginPath(); c.arc(fx, fy, r, -Math.PI / 2 - .8 + sa * .6, -Math.PI / 2 + .8 + sa * .6); c.stroke(); }
    c.restore();
  }
  /** Пара над кавою: три тонкі звивисті струмені, що тануть угорі. */
  function steam(c, z, t) {
    const M = z.anchor('anMug'); if (!M) return; const b = proj(M), k = sc(M[2]);
    c.save(); c.lineCap = 'round';
    for (let i = 0; i < 3; i++) { const ph = (t * .32 + i / 3) % 1, x0 = b[0] + (i - 1) * 1.6 * k, hgt = 14 * k;
      c.strokeStyle = `rgba(230,236,255,${.32 * Math.sin(ph * Math.PI)})`; c.lineWidth = .7 * k; c.beginPath();
      for (let s = 0; s <= 10; s++) { const q = s / 10, y = b[1] - 1 - q * hgt * (.5 + ph * .6), x = x0 + Math.sin(q * 5 + t * 1.6 + i * 2) * 1.6 * k * q; s ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); }
    c.restore();
  }
  /** Стіна даних живе — дешево, поверх нерухомого злиття й ПІД панелями: рейка голо-проєкторів під ними «дихає», щілиною між
   *  панелями вгору біжать імпульси (раніше — велика жива грань за панелями: її однаково майже не видно, а кадрів коштувала). */
  let WALL = null;
  function wall(c, t, act) {
    const W = WALL || (WALL = NX.arc.holo.at('analytics', 'an_back', 399, .3)); if (!W) return;
    const a = W(310, 256), b = W(488, 256), p = .5 + .5 * Math.sin(t * 2.2);
    c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(120,240,255,${.18 + .28 * p})`; c.lineWidth = 1.4; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
    for (let q = 0; q < (act ? 4 : 2); q++) { const ph = (t * (act ? .7 : .35) + q / (act ? 4 : 2)) % 1, s = W(399, 252 - ph * 128), al = Math.sin(ph * Math.PI);
      c.fillStyle = `rgba(170,250,255,${al * .9})`; c.fillRect(s[0] - .5, s[1] - 3, 1, 6); c.fillStyle = `rgba(255,255,255,${al})`; c.fillRect(s[0] - .5, s[1] - 3, 1, 1.2); }
    c.restore();
  }
  function rrect(c, x, y, w, h) { c.beginPath(); c.rect(x, y, w, h); c.fill(); }
  /** Знахідка над діаграмою: «▲ +N%» у голо-бульбашці, підіймається й тане. */
  function pops(c) {
    FX.pops.forEach(o => { const k = o.a / o.ttl, al = k < .15 ? k / .15 : k > .7 ? (1 - k) / .3 : 1, y = o.y - o.a * 9, w = 22, h = 7;
      c.save(); c.globalAlpha = al * .95; c.fillStyle = 'rgba(10,40,110,.85)'; T.rr(c, o.x - w / 2, y - h / 2, w, h, 1.6); c.fill(); c.strokeStyle = '#7af4ff'; c.lineWidth = .4; T.rr(c, o.x - w / 2, y - h / 2, w, h, 1.6); c.stroke();
      c.fillStyle = '#3bff8a'; c.beginPath(); c.moveTo(o.x - w / 2 + 2, y + 1.4); c.lineTo(o.x - w / 2 + 3.6, y - 1.6); c.lineTo(o.x - w / 2 + 5.2, y + 1.4); c.fill();
      c.font = '3.2px "Press Start 2P", monospace'; c.textAlign = 'center'; c.fillStyle = '#e8feff'; c.fillText(o.s, o.x + 2.6, y + 1.5); c.restore(); });
  }

  NX.addObject({
    id: 'analytics', name: 'obj.analytics', active: false, prog: 0, boost: 0,
    get span() { const z = zone(); return z && z.box ? [z.box[0] - 30, z.box[1] + 30] : null; },          // box (розкладка) — [x0, x1, y0, y1] на екрані
    ready() { return !!zone(); },
    /** Глюк панелі зараз (i — номер, інакше випадкова): для Nexi й перевірок (наступний крок). */
    glitch(i, dur = .5) { if (!NX.arc.holo || !zone()) return; mk(); const L = panes; L[i != null ? i % L.length : Math.random() * L.length | 0].kick(NX.time, dur); },
    update(dt, t) {
      if (!zone() || !NX.arc.holo) return; mk();
      if (t > FX.nextLag) { panes[Math.random() * panes.length | 0].kick(t, .32 + Math.random() * .3); FX.nextLag = t + 16 + Math.random() * 16; }   // глючить одна панель і рідко
      if (this.active) this.boost += dt;
      if (t > FX.nextPop && this._top) { FX.pops.push({ x: this._top[0] + (Math.random() - .5) * 6, y: this._top[1], a: 0, ttl: 2.4, s: '+' + NX.num(4 + Math.random() * 16, 1) + '%' }); FX.nextPop = t + (this.active ? 2.5 + Math.random() * 2 : 7 + Math.random() * 6); }
      FX.pops = FX.pops.filter(o => (o.a += dt) < o.ttl);
    },
    drawBack(c, t) {
      const z = zone(); if (!z || !NX.arc.holo) return; mk();
      const act = !!this.active;
      wall(c, t, act); panes.forEach(p => p.draw(c, t));
      const ch = chart(c, z, t, act); if (ch) { this._top = ch.top; bits(c, ch.lens, t, act); }
      dish(c, z, t, act); steam(c, z, t); pops(c);
    },
  });
})();
