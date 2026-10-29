/* ============================================================================
 * objects/arc_live.js — ЖИВЕ НА КРИЛАХ «ПО ДУЗІ»: екрани, сканер, вихор (оживає, коли в розкладці є предмет з таким id)
 * ----------------------------------------------------------------------------
 * Нерухоме обох крил — одне полотно (objects/arc_scene.js). Поверх нього тут малюється те, що рухається:
 * вміст екранів (графіки, журнали, карта з пінгами, мозок із нейронами), скло сканера майстерні, вихор порталу.
 *   NX.arc.LIVE[id] = { draw(c, fw, fh, t, B), every } — малює ЛИШЕ ділянки, що змінюються (решта прозора — під нею
 *     нерухома грань), у координатах лицьової грані (як NX.arc.paint); every — раз на скільки кадрів оновлювати;
 *     draw повертає false — зараз нічого (відблиск вивіски між проходами): грань не перемальовується й не кладеться
 *   NX.arc.live(c, side, S, t) — щокадру: оновлює по черзі (вразбіг) і кладе кожен екран одним drawImage
 * Як вміст лягає в 3D: пласке полотно грані -> чотирикутник грані на екрані стовпчиками (NX.furn.warp, бо боки грані
 * вертикальні) -> МАСКА видимих пікселів цієї грані з z-буфера (те, що попереду — рослина, крісло, — лишається попереду).
 * Усе — функції часу; тексти — NX.t; журнали — кольорові рядки-мітки (на дрібному екрані літер однаково не видно).
 * ========================================================================== */
NX.arc = NX.arc || {};
(() => {
  const K = NX.kit, F = NX.furn, X = NX.px3d, hash = NX.art.hash, T = NX.arc.pt, LIVE = NX.arc.LIVE = {};
  const { glass, bars, lineChart, donut, icon } = T, Fd = T.F, Rr = T.R;
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], addv = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const PANEL = { r: 1, a: '#123a9a', b: '#0c2a7a', c: '#081e5e', lw: .5 };

  /** Журнал подій «рядками»: кольорова мітка рівня (OK / AI / NET / WARN / ERR) і сіра лінія-повідомлення; новий рядок
   *  в'їжджає знизу раз на ~0.8 с, курсор блимає (на дрібному екрані літери однаково не прочитати — як і на картинці). */
  const LVC = ['#3bff8a', '#3be8ff', '#9a8cff', '#ffe27a', '#ff6ec8'];
  function logLines(c, x, y, w, h, t, seed = 0) {
    const lh = Math.max(2, h / 6), p = t * 1.25 + seed * 3.1, n0 = Math.floor(p), f = p - n0, slide = (1 - Math.min(1, f * 5)) * lh;
    c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
    for (let r = 0; r < 8; r++) { const id = n0 - r, yy = y + h - lh * (r + 1) + slide + lh * .3; if (yy < y - lh) break; const lv = Math.floor(hash(id, 3 + seed) * 5), ll = .3 + .55 * hash(id, 9 + seed);
      c.fillStyle = LVC[lv]; c.fillRect(x + 1, yy, lh * 1.3, lh * .45); c.fillStyle = r === 0 ? 'rgba(232,253,255,.9)' : 'rgba(159,200,240,.7)'; c.fillRect(x + 2 + lh * 1.6, yy, (w - lh * 2.2) * ll, lh * .45);
      if (r === 0 && Math.sin(t * 8) > 0) { c.fillStyle = '#3be8ff'; c.fillRect(x + 2.6 + lh * 1.6 + (w - lh * 2.2) * ll, yy - lh * .1, lh * .4, lh * .6); } }
    c.fillStyle = 'rgba(59,232,255,.12)'; c.fillRect(x, y + h - lh + slide, w, lh); c.restore();
  }
  // ---------- AI-центр ----------
  LIVE.ai_screen = { every: 3, draw(c, fw, fh, t, B) {
    const [gx, gy, gw, gh] = Rr(Fd(B, 0), fw, fh) || [fw * .05, fh * .03, fw * .9, fh * .94], top = gy + gh * .2, colW = gw * .24;
    glass(c, gx + 4, top + 5.4, colW - 2, gh * .3 - 7.6, PANEL); bars(c, gx + 5, top + 6, colW - 4, gh * .3 - 9, 7, 1 + t * .35);          // графік ліворуч
    glass(c, gx + 4, top + gh * .33 + 5.4, colW - 2, gh * .3 - 7.6, PANEL); lineChart(c, gx + 5, top + gh * .33 + 6, colW - 4, gh * .3 - 9, 2 + t * .6);
    const bx = gx + colW + 6, bw = gw - colW * 2 + 2, cx = bx + bw / 2, cy = top + gh * .3, r = Math.min(bw * .36, gh * .24);
    c.save(); c.globalCompositeOperation = 'lighter';                                                                                   // нейрони спалахують по черзі
    for (let k = 0; k < 18; k++) { const ph = (t * .9 + hash(k, 7) * 9) % 1, a = hash(k, 3) * 6.28, d = .15 + hash(k, 5) * .7, x = cx + Math.cos(a) * r * d, y = cy - r * .1 + Math.sin(a) * r * .7 * d;
      if (ph < .35) { const q = 1 - ph / .35, s2 = 1.2 + q * 1.4; c.fillStyle = `rgba(${k % 4 ? '170,245,255' : '255,150,240'},${q})`; c.fillRect(x - s2 / 2, y - s2 / 2, s2, s2); } }
    const pr = (t * .45) % 1; c.strokeStyle = `rgba(120,230,255,${(1 - pr) * .5})`; c.lineWidth = .8; c.beginPath(); c.ellipse(cx, cy - r * .1, r * (1 + pr * .5), r * .8 * (1 + pr * .5), 0, 0, 7); c.stroke();
    c.restore();
    const ey = gy + gh - gh * .1, ew = gw - 8; glass(c, gx + 3, ey - 1, gw - 6, gh * .085, { r: .8, a: '#0f2f8e', b: '#0c2a7a', c: '#0a2266', lw: .4 });   // еквалайзер
    for (let i = 0; i < 40; i++) { const v = .18 + .82 * Math.abs(Math.sin(i * .7 + t * 3.1) * Math.cos(i * .23 - t * 1.7)); c.fillStyle = i % 5 ? '#3be8ff' : '#ff7af0'; c.fillRect(gx + 4 + i * ew / 40, ey + gh * .07 * (1 - v), ew / 40 * .6, gh * .07 * v); }
  } };
  LIVE.ai_mon = { every: 3, draw(c, fw, fh, t) { glass(c, fw * .1, fh * .27, fw * .8, fh * .53, PANEL); bars(c, fw * .12, fh * .3, fw * .42, fh * .46, 6, 3 + t * .4); lineChart(c, fw * .58, fh * .3, fw * .3, fh * .46, 4 + t * .7, '#7af4ff', 'rgba(90,220,255,.15)'); } };
  LIVE.ai_top1 = { every: 4, draw(c, fw, fh, t) { glass(c, fw * .1, fh * .36, fw * .8, fh * .48, PANEL); bars(c, fw * .12, fh * .38, fw * .76, fh * .42, 8, 5 + t * .5); } };
  LIVE.ai_top2 = { every: 4, draw(c, fw, fh, t) { glass(c, fw * .08, fh * .34, fw * .84, fh * .52, PANEL); logLines(c, fw * .1, fh * .36, fw * .8, fh * .48, t, 2); } };
  LIVE.ai_laptop = { every: 4, draw(c, fw, fh, t) { const n = Math.floor(t * 2) % 6; glass(c, fw * .1, fh * .1, fw * .8, fh * .8, { r: 1, a: '#1a5ad0', b: '#123a9a', c: '#0c2a7a' }); for (let k = 0; k < 5; k++) { const w = k < n ? fw * (.66 - (k % 3) * .14) : k === n ? fw * (.66 - (k % 3) * .14) * ((t * 2) % 1) : 0; c.fillStyle = k === 2 ? '#ff9af0' : 'rgba(200,240,255,.75)'; c.fillRect(fw * .16, fh * (.22 + k * .13), w, 1.1); } } };
  LIVE.sh_scr2 = { every: 4, draw(c, fw, fh, t) { glass(c, fw * .08, fh * .14, fw * .84, fh * .72, PANEL); K.scrMap(c, fw * .1, fh * .18, fw * .8, fh * .64, t); } };
  // ---------- аналітика й маркетинг ----------
  LIVE.an_booth = { every: 3, draw(c, fw, fh, t, B) {
    const L = Rr(Fd(B, 0), fw, fh), R2 = Rr(Fd(B, 2), fw, fh);
    if (L) { glass(c, L[0] + L[2] * .06, L[1] + L[3] * .2, L[2] * .88, L[3] * .62, PANEL); bars(c, L[0] + L[2] * .08, L[1] + L[3] * .22, L[2] * .84, L[3] * .58, 6, 2 + t * .25); }
    if (R2) { glass(c, R2[0] + R2[2] * .06, R2[1] + R2[3] * .18, R2[2] * .88, R2[3] * .36, PANEL); lineChart(c, R2[0] + R2[2] * .08, R2[1] + R2[3] * .2, R2[2] * .84, R2[3] * .32, 1.3 + t * .4);
      const a = t * .6; c.save(); c.translate(R2[0] + R2[2] * .3, R2[1] + R2[3] * .72); c.rotate(a); donut(c, 0, 0, R2[3] * .17, [[72, '#3be8ff'], [28, '#ff4fd8']]); c.restore(); }
  } };
  LIVE.mk_scr = { every: 4, draw(c, fw, fh, t) { glass(c, fw * .12, fh * .14, fw * .76, fh * .7, PANEL); const o = (t * .5) % 1;
    for (let k = 0; k < 4; k++) { const y = fh * (.2 + (k - o) * .2); if (y < fh * .14 || y > fh * .76) continue; c.fillStyle = ['#ff7ad0', '#ffd27a', '#7af4ff', '#9a8cff'][k]; c.fillRect(fw * .16, y, fh * .12, fh * .12); c.fillStyle = 'rgba(200,240,255,.75)'; c.fillRect(fw * .16 + fh * .18, y + fh * .03, fw * .4, .9); } } };
  LIVE.an_scr = { every: 4, draw(c, fw, fh, t) { glass(c, fw * .12, fh * .2, fw * .76, fh * .6, PANEL); bars(c, fw * .16, fh * .26, fw * .68, fh * .5, 5, 9 + t * .5); } };
  LIVE.an_scr2 = LIVE.an_scr; LIVE.mk_scr2 = LIVE.mk_scr;
  LIVE.mk_booth = { every: 3, draw(c, fw, fh, t, B) {
    const L = Rr(Fd(B, 1), fw, fh), R2 = Rr(Fd(B, 2), fw, fh);
    if (L) {                                                                                                                         // стрічка постів повзе вгору, сердечка спливають
      const y0 = L[1] + L[3] * .2, h0 = L[3] * .76; glass(c, L[0] + L[2] * .04, y0, L[2] * .92, h0, PANEL); c.save(); c.beginPath(); c.rect(L[0] + L[2] * .04, y0, L[2] * .92, h0); c.clip();
      const step = L[3] * .26, off = (t * 4) % step;
      for (let k = -1; k < 4; k++) { const y = y0 + k * step - off + 1, h = L[3] * .21, n = Math.floor(t * 4 / step) + k; c.fillStyle = 'rgba(30,70,170,.85)'; c.fillRect(L[0] + L[2] * .08, y, L[2] * .84, h);
        c.fillStyle = ['#ff7ad0', '#ffd27a', '#7af4ff'][((n % 3) + 3) % 3]; c.fillRect(L[0] + L[2] * .12, y + h * .18, h * .64, h * .64); c.fillStyle = 'rgba(200,240,255,.7)'; c.fillRect(L[0] + L[2] * .12 + h * .8, y + h * .25, L[2] * .4, .9); c.fillRect(L[0] + L[2] * .12 + h * .8, y + h * .55, L[2] * .28, .9);
        icon(c, 'heart', L[0] + L[2] * .8, y + h * .5, h * .44, '#ff4fd8'); }
      c.restore();
      for (let k = 0; k < 3; k++) { const ph = (t * .5 + k * .33) % 1, x = L[0] + L[2] * (.7 + .1 * Math.sin(k * 3 + t)), y = L[1] + L[3] * (.9 - ph * .7); c.globalAlpha = 1 - ph; icon(c, 'heart', x, y, 2.2, '#ff9af0'); c.globalAlpha = 1; }
    }
    if (R2) { const cx = R2[0] + R2[2] / 2, cy = R2[1] + R2[3] * .42, r = Math.min(R2[2], R2[3]) * .22, p = .5 + .5 * Math.sin(t * 2.4);
      glass(c, cx - r * 1.35, cy - r * 1.35, r * 2.7, r * 2.7, { r: r * 1.3, a: '#123a9a', b: '#0c2a7a', c: '#081e5e', lw: .01 });
      [[1, '#ff4fd8'], [.66, '#7af4ff'], [.33, '#ff4fd8']].forEach(([k, col]) => { c.strokeStyle = col; c.lineWidth = r * .14; c.beginPath(); c.arc(cx, cy, r * k * (.92 + .08 * p), 0, 7); c.stroke(); });
      c.strokeStyle = `rgba(255,150,240,${1 - (t * .8) % 1})`; c.lineWidth = .6; c.beginPath(); c.arc(cx, cy, r * (1 + (t * .8) % 1 * .3), 0, 7); c.stroke(); }
  } };
  // ---------- праве крило ----------
  LIVE.hub = { every: 3, draw(c, fw, fh, t) { glass(c, fw * .085, fh * .27, fw * .62, fh * .385, PANEL); K.scrMap(c, fw * .09, fh * .28, fw * .6, fh * .36, t, { hot: ['kyiv', 'warsaw', 'amsterdam'] });
    glass(c, fw * .065, fh * .775, fw * .87, fh * .15, { r: .6, a: '#0f2f8e', b: '#0c2a7a', c: '#0a2266', lw: .01 }); lineChart(c, fw * .07, fh * .78, fw * .86, fh * .14, 6 + t * .8, '#ff4fd8', 'rgba(255,80,220,.15)');
    c.fillStyle = Math.sin(t * 3) > 0 ? '#3bff8a' : '#1f6a45'; c.fillRect(fw * .08, fh * .72, 2, 2); } };
  LIVE.ws_back = { every: 3, draw(c, fw, fh, t, B) {
    const d = (B.deco || [])[0], [x, y, w, h] = d ? Rr(d.f, fw, fh) : [fw * .02, fh * .02, fw * .96, fh * .96], cx = x + w / 2, cy = y + h * .3, r = w * .16;
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 3; k++) { const a = t * (k % 2 ? -1.2 : .9) + k; c.strokeStyle = ['rgba(255,170,240,.8)', 'rgba(255,214,246,.7)', 'rgba(120,230,255,.6)'][k]; c.lineWidth = .9; c.setLineDash([3, 2.4]); c.beginPath(); c.arc(cx, cy, r * (1.35 + k * .22), a, a + 4.6); c.stroke(); }
    c.setLineDash([]); const sy = y + h * ((t * .35) % 1), g = c.createLinearGradient(0, sy - 6, 0, sy + 1); g.addColorStop(0, 'rgba(255,120,240,0)'); g.addColorStop(1, 'rgba(255,200,250,.7)'); c.fillStyle = g; c.fillRect(x + 1, sy - 6, w - 2, 7);
    for (let k = 0; k < 6; k++) { const ph = (t * .3 + k / 6) % 1; c.globalAlpha = Math.sin(ph * Math.PI); icon(c, ['ai', 'heart', 'bolt', 'gear', 'bot', 'chart'][k], x + w * (.15 + .7 * hash(k, 2)), y + h * (.95 - ph * .55), w * .07, '#ffd6f6'); }
    c.restore();
  } };
  [['ws_tabL', 0], ['ws_tabR', 3]].forEach(([id, sh]) => { LIVE[id] = { every: 4, draw(c, fw, fh, t) { const q = (Math.floor(t * 1.5) + sh) % 6, cx = fw * (.32 + (q % 2) * .36), cy = fh * (.3 + Math.floor(q / 2) * .24); c.strokeStyle = '#ffffff'; c.lineWidth = .7; c.strokeRect(cx - fw * .16, cy - fh * .11, fw * .32, fh * .22); c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(cx - fw * .15, cy - fh * .1, fw * .3, fh * .2); } }; });
  LIVE.ws_term = { every: 4, draw(c, fw, fh, t) { const y = fh * .42, h = fh * .24; glass(c, fw * .14, y, fw * .72, h, { r: 1 }); logLines(c, fw * .16, y + h * .08, fw * .68, h * .84, t, 5); } };
  LIVE.tl_tiles = { every: 3, draw(c, fw, fh, t) { const k = Math.floor(t * .8) % 3, f = (t * .8) % 1, x = fw * (.03 + k * .325); c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(120,240,255,${.28 * Math.sin(f * Math.PI)})`; c.fillRect(x, fh * .08, fw * .3, fh * .84);
    c.fillStyle = '#3bff8a'; c.fillRect(x + fw * .24, fh * .12, 2, 2); c.restore(); } };
  LIVE.tl_tileBR = { every: 3, draw(c, fw, fh, t) { const P = [[.2, .4], [.5, .3], [.8, .45], [.35, .75], [.68, .78]], E2 = [[0, 1], [1, 2], [0, 3], [1, 4], [3, 4], [2, 4]];
    E2.forEach(([a, b], k) => { const ph = (t * .7 + k * .23) % 1, x = (P[a][0] + (P[b][0] - P[a][0]) * ph) * fw, y = (P[a][1] + (P[b][1] - P[a][1]) * ph) * fh; c.fillStyle = k % 2 ? '#ff9af0' : '#e8feff'; c.fillRect(x - .9, y - .9, 1.8, 1.8); }); } };
  LIVE.pt_back = { every: 2, draw(c, fw, fh, t, B) {
    const d = (B.deco || [])[0], [x0, y0, w, h] = d ? Rr(d.f, fw, fh) : [0, 0, fw, fh], x1 = x0 + w, y1 = y0 + h, sp = (d ? d.spring : .3) * fh, cx = (x0 + x1) / 2, rx = w / 2;
    const arch = () => { c.beginPath(); c.moveTo(x0 + 1.4, y1); c.lineTo(x0 + 1.4, sp); c.ellipse(cx, sp, rx - 1.4, sp - y0 - 1.4, 0, Math.PI, 0); c.lineTo(x1 - 1.4, y1); c.closePath(); };
    c.save(); arch(); c.clip();
    const vx = d && d.vortex ? x0 + d.vortex[0] * w : cx, vy = d && d.vortex ? y0 + d.vortex[1] * h : y0 + h * .6, R0 = w * .55, pulse = .9 + .1 * Math.sin(t * 2.2);
    const g = c.createRadialGradient(vx, vy, 0, vx, vy, R0 * pulse); g.addColorStop(0, '#f4ecff'); g.addColorStop(.12, '#b49af8'); g.addColorStop(.35, '#6a3ad8'); g.addColorStop(.7, '#2a1890'); g.addColorStop(1, '#12063a'); c.fillStyle = g; c.fillRect(x0, y0, w, h);
    for (let arm = 0; arm < 4; arm++) { c.strokeStyle = arm % 2 ? 'rgba(255,120,240,.8)' : 'rgba(120,230,255,.8)'; c.lineWidth = 1.3; c.beginPath();
      for (let s = 0; s <= 60; s++) { const q = s / 60, a = arm * Math.PI / 2 + q * 5.2 - t * 1.1, r = R0 * (.08 + q * .85); const x = vx + Math.cos(a) * r, y = vy + Math.sin(a) * r * .9; s ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); }
    for (let k = 0; k < 70; k++) { const ph = (t * (.15 + hash(k, 4) * .2) + hash(k, 1)) % 1, a = hash(k, 2) * 6.28 - t * (.6 + hash(k, 3)), r = R0 * (.95 - ph * .85); c.fillStyle = k % 3 ? `rgba(232,216,255,${1 - ph * .6})` : `rgba(122,244,255,${1 - ph * .6})`; c.fillRect(vx + Math.cos(a) * r, vy + Math.sin(a) * r * .9, .9, .9); }
    c.restore();
  } };

  /** Відблиск, що раз на period с пробігає по грані навскіс (вивіски зон); off — зсув, щоб вивіски блищали не разом. */
  NX.arc.glint = (period, off = 0) => ({ every: 2, draw(c, fw, fh, t) {
    const k = ((t + off) % period) / 1.1; if (k >= 1) return false; const x = -fh * 1.2 + k * (fw + fh * 2.4), g = c.createLinearGradient(x - fh * .7, 0, x + fh * .7, 0);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.5, 'rgba(255,255,255,.32)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.beginPath(); c.moveTo(x - fh * .3, 0); c.lineTo(x + fh * .7, 0); c.lineTo(x + fh * .2, fh); c.lineTo(x - fh * .8, fh); c.closePath(); c.fill(); c.restore();
  } });

  // ---------- рушій живого шару ----------
  const proj = X.proj;
  /** Вміст грані -> полотно під маскою (у межах видимих пікселів грані, роздільність Rd). */
  function update(E, t, Rd) {
    const Fc = E.Fc, fw = Fc.fw, fh = Fc.fh, TS = E.TS, m = E.mask;
    if (!E.src) { E.src = document.createElement('canvas'); E.src.width = Math.max(1, Math.round(fw * TS)); E.src.height = Math.max(1, Math.round(fh * TS)); }
    const sc = E.src.getContext('2d'); sc.setTransform(1, 0, 0, 1, 0, 0); sc.clearRect(0, 0, E.src.width, E.src.height); sc.setTransform(TS, 0, 0, TS, 0, 0); sc.imageSmoothingEnabled = true;
    if (LIVE[E.id].draw(sc, fw, fh, t, E.B) === false) { E.empty = true; E.Rd = Rd; if (!E.out) E.out = document.createElement('canvas'); return; }   // нічого не намальовано — грань не кладемо
    E.empty = false;
    const w = Math.max(1, Math.ceil(m.w * Rd)), h = Math.max(1, Math.ceil(m.h * Rd));
    if (!E.out || E.out.width !== w || E.out.height !== h) { E.out = document.createElement('canvas'); E.out.width = w; E.out.height = h; }
    const oc = E.out.getContext('2d'); oc.setTransform(1, 0, 0, 1, 0, 0); oc.globalCompositeOperation = 'source-over'; oc.clearRect(0, 0, w, h);
    oc.setTransform(Rd, 0, 0, Rd, -m.x * Rd, -m.y * Rd); oc.imageSmoothingEnabled = true;
    const q = E.q;
    if (Math.abs(q[0][1] - q[1][1]) < .02 && Math.abs(q[3][1] - q[2][1]) < .02) oc.drawImage(E.src, q[0][0], q[0][1], q[1][0] - q[0][0], q[3][1] - q[0][1]);   // грань паралельна екрану
    else F.warp(oc, E.src, q, 1.5);
    oc.setTransform(1, 0, 0, 1, 0, 0); oc.globalCompositeOperation = 'destination-in'; oc.imageSmoothingEnabled = true; oc.drawImage(m.cv, 0, 0, w, h); oc.globalCompositeOperation = 'source-over';
    E.Rd = Rd;
  }
  const FR = {};                                                                     // лічильник кадрів — СВІЙ для кожного крила: спільний ріс би на 2 за кадр,
  /** Щокадру: оновити (вразбіг) і покласти живі грані крила side. */                 // і грані з парним every (2, 4) на непарних місцях не оновлювались би ніколи
  NX.arc.live = (c, side, S, t) => {
    if (!S.live) return; const fr = FR[side] = (FR[side] || 0) + 1;
    const Rd = Math.min(4, Math.round(NX.cam.k * (NX.loop.dpr || 1) * 100) / 100);
    S.live.forEach((E, n) => {
      if (!E.q) { const Fc = E.Fc; E.q = [proj(Fc.O), proj(addv(Fc.O, Fc.A)), proj(addv(addv(Fc.O, Fc.A), Fc.B)), proj(addv(Fc.O, Fc.B))]; E.TS = Math.min(4, Math.max(2, Rd * 1.2)); }
      if (!E.out || E.Rd !== Rd || (fr + n) % (LIVE[E.id].every || 3) === 0) update(E, t, Rd);
      if (!E.empty) c.drawImage(E.out, E.mask.x, E.mask.y, E.mask.w, E.mask.h);
    });
  };
})();
