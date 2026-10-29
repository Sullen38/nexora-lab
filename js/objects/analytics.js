/* ============================================================================
 * objects/analytics.js — АНАЛІТИКА («ОБСЕРВАТОРІЯ ДАНИХ»): ЖИВИЙ ОБ'ЄКТ
 * ----------------------------------------------------------------------------
 * Нерухома частина (скляний стіл із заокругленим кінцем, тумба, серверна стійка, «труба даних» у просторі для ніг, проєктор,
 * чашка; на стіні — КУПОЛ ОБСЕРВАТОРІЇ з вивіскою) — у 3D-розкладці (gen_room.py: analytics(); грані й форма купола —
 * objects/an_paint.js); крісло — objects/an_chair.js. Тут — те, що живе поверх.
 * Крок 11 (власник: «з екраном аналітики перебор — треба простіше; або хоч якийсь фон, бо дуже цегляну стіну видно; спробуй ще
 * щось; постав крісло; і роби взаємодію з Nexi»): три панелі-крила, гало-кільце, радар і світлові завіси (крок 10) прибрано —
 *   ГОЛО-ЕКРАН — ОДИН широкий плаский екран у куполі (NX.arc.holo.pane, crisp, щільна темна підкладка — цегли крізь нього не
 *     видно; вміст — NX.arc.anScreen); навколо — м'яке блакитне сяйво на склі купола; зрідка (раз на 22–40 с, коли Nexi не
 *     працює) коротко «лагає»;
 *   КОЛИ NEXI ПРАЦЮЄ (active / prog — nexi.js: work.obj = 'analytics'; задача — begin(task)): екран показує свою задачу
 *     (ПРОДАЖІ за тиждень — стовпчики по днях ростуть по черзі; ВІДВІДУВАЧІ — карта з пінгами; ПРОГНОЗ — пунктир у майбутнє),
 *     у шапці — смужка прогресу; проєктор на правому краї стола вмикається — над ним обертається 3D-ДІАГРАМА (стовпчики по
 *     колу; там її не закриває крісло зі спинкою), з екрана в лінзу «стікають» дані, спливають
 *     знахідки «▲ +N%»; по завершенні (finish) — на екрані печатка «ЗВІТ ГОТОВИЙ ✓», а з екрана вилітає голо-картка звіту (card);
 *   ПАРА над чашкою кави — завжди.
 * Координати — px картинки зони -> світ -> екран (NX.arc.zone, якорі розкладки).
 * ========================================================================== */
(() => {
  const P = NX.px, T = NX.arc.pt, proj = NX.px3d.proj, hash = NX.art.hash, D = NX.persp.D, sc = z => D / (D + z);
  let Z = null; const zone = () => Z || (Z = NX.arc.zone && NX.arc.zone('analytics'));
  // екран (px картинки зони): привид an_scr — вісь екрана (X 406, v 62), вирівняна по центру стола; екран паралельний куполу
  const SCR = { X: [322, 490], Y: [140, 240], Xc: 406 };
  const S = { view: 'overview', prog: 0, act: false, done: 0 };                                     // стан для вмісту екрана (an_paint.js)
  let pane = null;
  const mk = () => pane || (pane = NX.arc.holo.pane({ zone: 'analytics', item: 'an_scr', Xc: SCR.Xc, X: SCR.X, Y: SCR.Y, v: 0, rgb: '150,240,255', seed: 2, lagMin: 0, crisp: true, shade: .94,
    paint: (c, fw, fh, t) => NX.arc.anScreen(c, fw, fh, t, S) }));
  const FX = { pops: [], cards: [], nextLag: 18 + Math.random() * 12, nextPop: 2, ch: 0 };
  const val = (k, t) => .5 + .3 * Math.sin(t * 2.1 + k * 1.9) + .18 * Math.sin(t * .37 + k * .7);   // висота стовпчика діаграми 0..1

  /** М'яке сяйво екрана на склі купола (під екраном). */
  function glow(c, q, t, act) {
    const cx = (q[0][0] + q[1][0]) / 2, cy = (q[0][1] + q[3][1]) / 2, w = q[1][0] - q[0][0], a = .32 + .06 * Math.sin(t * 1.3) + (act ? .12 : 0);
    c.save(); c.globalCompositeOperation = 'lighter'; P.glow(c, cx, cy, w * .72, 'rgba(70,180,255,.55)', a); c.restore();
  }
  /** Еліпс-кільце в площині підлоги на висоті y навколо точки світу C (радіус r од. світу). */
  function ring(c, C, y, r, kz = .8, n = 28) { c.beginPath(); for (let i = 0; i <= n; i++) { const a = i / n * Math.PI * 2, p = proj([C[0] + Math.cos(a) * r, y, C[2] + Math.sin(a) * r * kz]); i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); } }
  /** 3D-ДІАГРАМА над проєктором (коли Nexi працює; al — проявлення): промінь з лінзи, кільця-основа, стовпчики по колу в
   *  перспективі (дальні — тьмяніші), найвищий — рожевий з підписом. Повертає лінзу й верх (для даних і знахідок). */
  function chart(c, z, t, al) {
    const L = z.anchor('anPuck'); if (!L) return null;
    const lens = proj(L), y0 = L[1] - 3, R = 12, n = 10, th = t * .8, k0 = sc(L[2]);
    c.save(); c.globalAlpha = al; c.globalCompositeOperation = 'lighter';
    const top = proj([L[0], y0 - 25, L[2]]), g = c.createLinearGradient(0, lens[1], 0, top[1]);
    g.addColorStop(0, 'rgba(120,240,255,.3)'); g.addColorStop(1, 'rgba(120,240,255,0)'); c.fillStyle = g;
    c.beginPath(); c.moveTo(lens[0] - 2.5 * k0, lens[1]); c.lineTo(lens[0] + 2.5 * k0, lens[1]); c.lineTo(lens[0] + R * 1.3 * k0, top[1]); c.lineTo(lens[0] - R * 1.3 * k0, top[1]); c.closePath(); c.fill();
    P.glow(c, lens[0], lens[1], 7 * k0, 'rgba(150,245,255,.9)', .8);
    ring(c, L, y0, R + 3); c.strokeStyle = 'rgba(120,235,255,.75)'; c.lineWidth = .6; c.stroke();
    ring(c, L, y0, R + 1.2); c.strokeStyle = 'rgba(120,235,255,.3)'; c.lineWidth = .4; c.stroke();
    const bars = []; let best = 0;
    for (let k = 0; k < n; k++) { const a = th + k / n * Math.PI * 2, v = val(k, t); bars.push({ k, x: L[0] + Math.cos(a) * R, zz: L[2] + Math.sin(a) * R * .8, h: 4 + 19 * v * al, v }); if (v > bars[best].v) best = k; }
    bars.slice().sort((a, b) => b.zz - a.zz).forEach(b => {
      const p0 = proj([b.x, y0, b.zz]), p1 = proj([b.x, y0 - b.h, b.zz]), w = 3 * sc(b.zz), fr = b.zz < L[2], col = b.k === best ? '255,110,225' : '80,225,255';
      const gg = c.createLinearGradient(0, p1[1], 0, p0[1]); gg.addColorStop(0, `rgba(${col},${fr ? .85 : .45})`); gg.addColorStop(1, `rgba(${col},${fr ? .2 : .08})`);
      c.fillStyle = gg; c.fillRect(p0[0] - w / 2, p1[1], w, p0[1] - p1[1]);
      c.fillStyle = `rgba(255,255,255,${fr ? .95 : .45})`; c.fillRect(p1[0] - w / 2, p1[1] - .35, w, .7);
    });
    c.restore();
    if (al > .6) { const b = bars[best], tp = proj([b.x, y0 - b.h - 3, b.zz]); c.save(); c.globalAlpha = (al - .6) / .4; c.font = '3.6px "Press Start 2P", monospace'; c.textAlign = 'center'; c.fillStyle = '#ffc4f0'; c.fillText(NX.num(b.v * 30, 1) + '%', tp[0], tp[1]); c.restore(); }
    return { lens, top: proj([L[0], y0 - 28, L[2]]) };
  }
  /** Дані «стікають» з низу екрана в лінзу проєктора: світлі точки по кривій. */
  function bits(c, q, lens, t) {
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 8; i++) { const ph = (t * .85 + i / 8) % 1, u = .15 + .7 * hash(i, Math.floor(t * .85 + i / 8)), x0 = q[3][0] + (q[2][0] - q[3][0]) * u, y0 = q[3][1] + (q[2][1] - q[3][1]) * u - 1;
      const x = x0 + (lens[0] - x0) * ph * ph, y = y0 + (lens[1] - y0) * ph, a = Math.sin(ph * Math.PI); c.fillStyle = `rgba(${i % 3 ? '170,250,255' : '255,210,120'},${a * .9})`; c.fillRect(x - .5, y - .5, 1, 1); }
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
  /** Знахідки «▲ +N%» у голо-бульбашці: підіймаються й тануть. */
  function pops(c) {
    FX.pops.forEach(o => { const k = o.a / o.ttl, al = k < .15 ? k / .15 : k > .7 ? (1 - k) / .3 : 1, y = o.y - o.a * 9, w = 22, h = 7;
      c.save(); c.globalAlpha = al * .95; c.fillStyle = 'rgba(10,40,110,.85)'; T.rr(c, o.x - w / 2, y - h / 2, w, h, 1.6); c.fill(); c.strokeStyle = '#7af4ff'; c.lineWidth = .4; T.rr(c, o.x - w / 2, y - h / 2, w, h, 1.6); c.stroke();
      c.fillStyle = '#3bff8a'; c.beginPath(); c.moveTo(o.x - w / 2 + 2, y + 1.4); c.lineTo(o.x - w / 2 + 3.6, y - 1.6); c.lineTo(o.x - w / 2 + 5.2, y + 1.4); c.fill();
      c.font = '3.2px "Press Start 2P", monospace'; c.textAlign = 'center'; c.fillStyle = '#e8feff'; c.fillText(o.s, o.x + 2.6, y + 1.5); c.restore(); });
  }
  /** Голо-картка звіту: вилітає з екрана, збільшується, підіймається над куполом і тане (золотий кант, стовпчики, ✓). */
  function reports(c) {
    FX.cards.forEach(o => {
      const k = o.a / o.ttl, s = Math.min(1, o.a / .35), w = 34 * (.5 + .5 * s), h = 24 * (.5 + .5 * s), x = o.x - w / 2, y = o.y - h / 2 - Math.max(0, o.a - .5) * 26, al = k < .75 ? 1 : (1 - k) / .25;
      c.save(); c.globalAlpha = al * .94; c.fillStyle = 'rgba(12,30,90,.9)'; T.rr(c, x, y, w, h, 2); c.fill(); c.strokeStyle = '#ffd27a'; c.lineWidth = .7; T.rr(c, x, y, w, h, 2); c.stroke();
      c.fillStyle = 'rgba(220,245,255,.9)'; c.fillRect(x + w * .1, y + h * .14, w * .46, .9); c.fillStyle = 'rgba(160,210,255,.7)'; c.fillRect(x + w * .1, y + h * .26, w * .3, .7);
      [.42, .62, .5, .8, .95].forEach((v, i) => { const bh = h * .46 * v, bx = x + w * (.1 + i * .1); c.fillStyle = i === 4 ? '#ff7ad0' : '#5ae8ff'; c.fillRect(bx, y + h * .88 - bh, w * .065, bh); });
      c.strokeStyle = '#3bff8a'; c.lineWidth = 1.1; c.lineCap = 'round'; c.beginPath(); c.moveTo(x + w * .68, y + h * .6); c.lineTo(x + w * .76, y + h * .72); c.lineTo(x + w * .9, y + h * .44); c.stroke();
      c.globalCompositeOperation = 'lighter'; P.glow(c, o.x, y + h / 2, w * .8, 'rgba(255,210,120,.45)', al * .5); c.restore();
    });
  }

  NX.addObject({
    id: 'analytics', name: 'obj.analytics', act: 'analytics', active: false, prog: 0, boost: 0, view: null, doneT: -99,
    get span() { const z = zone(); return z && z.box ? [z.box[0] - 30, z.box[1] + 30] : null; },          // box (розкладка) — [x0, x1, y0, y1] на екрані
    get hit() { const z = zone(); if (!z || !z.box) return null; const [x0, x1, y0, y1] = z.box; return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 - 10 }; },
    ready() { return !!zone(); },
    /** Nexi береться за задачу (activities.js): що показати на екрані — sales / traffic / forecast. */
    begin(task) { this.view = task || null; this.doneT = -99; },
    /** Задачу зроблено: печатка «ЗВІТ ГОТОВИЙ ✓» на екрані. */
    finish() { this.doneT = NX.time; },
    /** Голо-картка звіту вилітає з екрана. */
    card() { const q = pane && pane.quad(); if (!q) return; FX.cards.push({ x: q[0][0] + (q[1][0] - q[0][0]) * .78, y: q[0][1] + (q[3][1] - q[0][1]) * .3, a: 0, ttl: 2.8 }); },   // з правого верхнього кута екрана (печатка — посередині)
    /** Глюк екрана зараз (для перевірок). */
    glitch(i, dur = .5) { if (!NX.arc.holo || !zone()) return; mk().kick(NX.time, dur); },
    update(dt, t) {
      if (!zone() || !NX.arc.holo) return; mk();
      const act = !!this.active;
      if (act) this.boost += dt;
      const dn = t - this.doneT; S.act = act; S.prog = this.prog || 0; S.done = dn >= 0 && dn < 4.6 ? (dn < 3.6 ? 1 : (4.6 - dn) / 1) : 0;
      S.view = (act || S.done > 0) && this.view ? this.view : 'overview';
      if (t > FX.nextLag) { if (!act && !S.done) pane.kick(t, .3 + Math.random() * .3); FX.nextLag = t + 22 + Math.random() * 18; }   // зрідка й не під час роботи (і не на печатці «звіт готовий»)
      FX.ch += ((act ? 1 : 0) - FX.ch) * Math.min(1, dt * 2.5);
      if (act && t > FX.nextPop && this._top) { FX.pops.push({ x: this._top[0] + (Math.random() - .5) * 6, y: this._top[1], a: 0, ttl: 2.4, s: '+' + NX.num(4 + Math.random() * 16, 1) + '%' }); FX.nextPop = t + 2.4 + Math.random() * 2; }
      FX.pops = FX.pops.filter(o => (o.a += dt) < o.ttl); FX.cards = FX.cards.filter(o => (o.a += dt) < o.ttl);
    },
    drawBack(c, t) {
      const z = zone(); if (!z || !NX.arc.holo) return; mk();
      const act = !!this.active, q = pane.quad();
      if (q) glow(c, q, t, act);
      pane.draw(c, t);
      if (FX.ch > .02) { const ch = chart(c, z, t, FX.ch); if (ch) { this._top = ch.top; if (act && q) bits(c, q, ch.lens, t); } }
      steam(c, z, t); pops(c); reports(c);
    },
  });
})();
