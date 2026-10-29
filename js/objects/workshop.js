/* ============================================================================
 * objects/workshop.js — МАЙСТЕРНЯ (СКІНИ): ЖИВИЙ ОБ'ЄКТ
 * ----------------------------------------------------------------------------
 * Нерухома частина майстерні (платформа, капсула, балка, купол, планшети) — у 3D-розкладці (gen_room.py: workshop(),
 * малюнки граней — objects/ws_paint.js). Тут — те, що живе поверх неї (власник, 29.10: «голограма Nexi з різними скінами;
 * ефекти, фішечки; щоб Nexi міг туди ставати»):
 *   ГОЛОГРАМА NEXI на паді капсули: стоїть у конусі світла, показує скіни по черзі (повний оберт — на ребрі змінює скін,
 *     нові пікселі «збираються» скан-лінією), мерехтить, глітчить, назва скіна на голо-табличці, точки-каруселька;
 *   МАНІПУЛЯТОР на куполі: дихає в спокої, час від часу сканує голограму променем, а коли Nexi в капсулі міняє скін —
 *     нахиляється й «встановлює» його блискавкою (іскри, спалах);
 *   СКАНУВАННЯ: коли Nexi в капсулі — голограма гасне, кільця сканера бігають по ньому, пад горить яскравіше;
 *   світло: сяйво пада, рожеве світло на підлогу перед платформою, частинки в конусі.
 * Nexi: activities.js -> workshop (злітає на пад: pad(), depth(); enter() / leave(); install() — з ui/skinlab.js).
 * Координати — px картинки зони -> світ -> екран (NX.arc.zone, як у генераторі). Усе кодом, без картинок.
 * ========================================================================== */
(() => {
  const P = NX.px;
  let Z = null; const zone = () => Z || (Z = NX.arc.zone && NX.arc.zone('workshop'));
  // скіни голограми (власник: «голограма Nexi з різними скінами»): тема + 1–2 деталі, що добре видно здалеку
  const LOOKS = [{ theme: 'neon', ant: 'neon', face: 'happy' }, { theme: 'gold', ant: 'crown', body: 'premium', legs: 'gold' }, { theme: 'space', body: 'cosmos', back: 'wings' },
    { theme: 'fire', ant: 'horns', arms: 'power' }, { theme: 'winter', head: 'hat', legs: 'boots' }, { theme: 'techno', body: 'techno', ant: 'techno', head: 'goggles' },
    { theme: 'rainbow', back: 'cape' }, { theme: 'gamer', head: 'phones', legs: 'sneakers', ant: 'gamer' }, { theme: 'forest', back: 'backpack' }, { theme: 'water', body: 'holo', arms: 'holo' }];
  const PERIOD = 3.6, SPIN = .9;                                                           // показ скіна, з них оберт (с)
  // маніпулятор (px картинки зони і відступ углиб v): спокій / «сканую голограму» / «встановлюю скін»
  const ARM = { rest: [[1005, 128, 36.5], [1062, 96, 36.5], [1128, 134, 36.5], [1114, 158, 36.5]],
    look: [[1005, 128, 36.5], [1056, 90, 33], [1120, 120, 27], [1100, 142, 22]],
    zap: [[1005, 128, 36.5], [1064, 94, 30], [1104, 152, 14], [1082, 176, 2]] };
  const S = { idx: 0, shown: 0, mat: 1, occ: false, holoA: 1, scan: 0, zap: 0, look: 0, lookT: 6, fast: 0, motes: [], bolts: [], last: -1 };
  const botCv = document.createElement('canvas'), holoCv = document.createElement('canvas'); holoCv.width = SW; holoCv.height = SH;
  const hx = holoCv.getContext('2d', { willReadFrequently: true });
  const look = i => Object.assign({}, DEFAULT_LOOK, LOOKS[((i % LOOKS.length) + LOOKS.length) % LOOKS.length]);
  const ease = k => k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;

  /** Кадр голограми (48×56): Nexi в скіні -> голографічний відтінок, скан-лінії, «збирання» знизу вгору, глітч. */
  function holoFrame(t, back, pose) {
    const L = look(S.shown), p = poseFor(pose, t, false); if (back) p.back = 1;
    renderBot(L, p, t, botCv);
    hx.globalCompositeOperation = 'source-over'; hx.clearRect(0, 0, SW, SH); hx.drawImage(botCv, 0, 0);
    hx.globalCompositeOperation = 'source-atop'; const g = hx.createLinearGradient(0, 0, 0, SH); g.addColorStop(0, 'rgba(140,240,255,.3)'); g.addColorStop(.6, 'rgba(120,190,255,.18)'); g.addColorStop(1, 'rgba(255,120,240,.28)'); hx.fillStyle = g; hx.fillRect(0, 0, SW, SH);
    hx.globalCompositeOperation = 'destination-out'; hx.fillStyle = 'rgba(0,0,0,.34)'; for (let y = (Math.floor(t * 30) & 1); y < SH; y += 2) hx.fillRect(0, y, SW, 1);
    if (S.mat < 1) { const cut = SH * (1 - ease(S.mat)); hx.fillStyle = '#000'; hx.fillRect(0, 0, SW, Math.floor(cut)); }
    hx.globalCompositeOperation = 'source-over';
    if (Math.sin(t * 1.7) > .97) { const y = (t * 97 % SH) | 0, h = 3 + (t * 13 % 4 | 0), dx = Math.sin(t * 50) > 0 ? 2 : -2; hx.drawImage(holoCv, 0, y, SW, h, dx, y, SW, h); }   // глітч-зсув
    return holoCv;
  }

  /** Маніпулятор 2D-ланками в площині лиця (фронтальний вигляд): тіні-контур, об'ємна ланка (світлий верх), неонова
   *  пунктирна смуга, хомути, суглоби з блакитним обідком і «оком», захват з помаранчевим вогником; кабель уздовж плеча. */
  function drawArm(c, t, Pts, k) {
    const sc = p => p[2] || 1, W = [14, 11.5, 8];
    const link = (a, b, w, n) => {
      const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1; let nx = -dy / L, ny = dx / L; if (ny > 0) { nx = -nx; ny = -ny; }   // n — догори
      c.lineCap = 'round'; c.strokeStyle = '#060313'; c.lineWidth = w + 2; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
      const g = c.createLinearGradient(a[0] + nx * w / 2, a[1] + ny * w / 2, a[0] - nx * w / 2, a[1] - ny * w / 2);
      g.addColorStop(0, '#9a8ae8'); g.addColorStop(.18, '#6a5abc'); g.addColorStop(.5, '#3e3284'); g.addColorStop(.85, '#241c56'); g.addColorStop(1, '#120e30');
      c.strokeStyle = g; c.lineWidth = w; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
      c.strokeStyle = 'rgba(220,210,255,.55)'; c.lineWidth = Math.max(.6, w * .09); c.beginPath(); c.moveTo(a[0] + nx * w * .3, a[1] + ny * w * .3); c.lineTo(b[0] + nx * w * .3, b[1] + ny * w * .3); c.stroke();   // блік
      c.setLineDash([2.4, 1.8]); c.lineDashOffset = -t * (n % 2 ? 5 : -5); c.strokeStyle = '#3be8ff'; c.lineWidth = Math.max(.7, w * .13);
      c.beginPath(); c.moveTo(a[0] - nx * w * .22, a[1] - ny * w * .22); c.lineTo(b[0] - nx * w * .22, b[1] - ny * w * .22); c.stroke(); c.setLineDash([]);
      [[a, .16], [b, .84]].forEach(([, f]) => { const x = a[0] + dx * f, y = a[1] + dy * f; c.strokeStyle = '#bcc5e6'; c.lineWidth = w * .2; c.lineCap = 'butt'; c.beginPath(); c.moveTo(x + nx * w * .52, y + ny * w * .52); c.lineTo(x - nx * w * .52, y - ny * w * .52); c.stroke(); });   // хомути
    };
    const joint = (p, r, eye) => {
      c.fillStyle = '#060313'; c.beginPath(); c.arc(p[0], p[1], r + 1, 0, 7); c.fill();
      const g = c.createRadialGradient(p[0] - r * .35, p[1] - r * .35, r * .1, p[0], p[1], r); g.addColorStop(0, '#e8e4ff'); g.addColorStop(.35, '#8e80d8'); g.addColorStop(.8, '#3e3284'); g.addColorStop(1, '#1a1542');
      c.fillStyle = g; c.beginPath(); c.arc(p[0], p[1], r, 0, 7); c.fill();
      c.strokeStyle = '#3be8ff'; c.lineWidth = Math.max(.8, r * .16); c.beginPath(); c.arc(p[0], p[1], r * .82, 0, 7); c.stroke();
      if (eye) { c.fillStyle = '#0a0620'; c.beginPath(); c.arc(p[0], p[1], r * .34, 0, 7); c.fill(); c.fillStyle = '#9af6ff'; c.beginPath(); c.arc(p[0], p[1], r * .16, 0, 7); c.fill(); }
    };
    const [b0, e1, w2, g3] = Pts;
    // кабель: від бази до ліктя, провисає
    c.strokeStyle = '#0a0820'; c.lineWidth = 1.6 * k; c.beginPath(); c.moveTo(b0[0] + 3 * k, b0[1] + 2 * k); c.quadraticCurveTo((b0[0] + e1[0]) / 2 + 2, (b0[1] + e1[1]) / 2 + 9 * k, e1[0] - 2 * k, e1[1] + 4 * k); c.stroke();
    c.strokeStyle = 'rgba(255,79,216,.55)'; c.lineWidth = .5; c.stroke();
    link(b0, e1, W[0] * k * sc(b0), 0); link(e1, w2, W[1] * k * sc(e1), 1); link(w2, g3, W[2] * k * sc(w2), 2);
    joint(b0, 10 * k * sc(b0), true); joint(e1, 9.5 * k * sc(e1), true); joint(w2, 7 * k * sc(w2), true);
    // захват: два пальці під кутом до останньої ланки, помаранчевий вогник між ними
    const dx = g3[0] - w2[0], dy = g3[1] - w2[1], L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, fl = 7 * k * sc(w2);
    [-.45, .45].forEach(a => { const ca = Math.cos(a), sa = Math.sin(a), vx = ux * ca - uy * sa, vy = ux * sa + uy * ca;
      c.lineCap = 'round'; c.strokeStyle = '#060313'; c.lineWidth = 3.6 * k; c.beginPath(); c.moveTo(g3[0], g3[1]); c.lineTo(g3[0] + vx * fl, g3[1] + vy * fl); c.stroke();
      c.strokeStyle = '#bcc5e6'; c.lineWidth = 2 * k; c.stroke(); });
    joint(g3, 4.6 * k * sc(w2), false);
    const tip = [g3[0] + ux * fl * .75, g3[1] + uy * fl * .75], on = .6 + .4 * Math.sin(t * 5);
    P.glow(c, tip[0], tip[1], 9 * k, 'rgba(255,170,70,.9)', on); c.fillStyle = '#fff2c8'; c.beginPath(); c.arc(tip[0], tip[1], 1.3 * k, 0, 7); c.fill();
    return tip;
  }
  /** Точки маніпулятора на екрані: суміш поз (спокій / скан / встановлення) + легке «дихання». */
  function armPts(t) {
    const z = zone(), wl = S.look, zk = Math.min(1, S.zap), wz = S.zap > 0 ? (zk < .22 ? ease(zk / .22) : zk > .8 ? ease((1 - zk) / .2) : 1) : 0;   // нахил — тримає — назад
    return ARM.rest.map((r, n) => {
      const l = ARM.look[n], q = ARM.zap[n], sw = n ? [0, 2.2, 3, 2.4][n] : 0;
      let X = r[0] + (l[0] - r[0]) * wl, Y = r[1] + (l[1] - r[1]) * wl, v = r[2] + (l[2] - r[2]) * wl;
      X += (q[0] - X) * wz; Y += (q[1] - Y) * wz; v += (q[2] - v) * wz;
      X += Math.sin(t * .7 + n) * sw; Y += Math.sin(t * .9 + n * 1.7) * sw * .8;
      const w = z.W(X, Y, v), s = NX.persp.D / (NX.persp.D + w[2]), p = NX.px3d.proj(w); return [p[0], p[1], s / .77];
    });
  }

  const W = NX.addObject({
    id: 'workshop', name: 'obj.workshop', act: 'workshop',
    get span() { const z = zone(); return z && z.box ? [z.box[0] - 30, z.box[1] + 40] : null; },              // box (розкладка) — [x0, x1, y0, y1] на екрані
    get hit() { const z = zone(); if (!z || !z.box) return null; const [x0, x1, y0, y1] = z.box; return { x: x0, y: y0 + 30, w: x1 - x0, h: y1 - y0 - 30 }; },
    ready() { return !!zone(); },
    get state() { return S; },                                                              // для перевірок (tools/*)
    /** Пад капсули (куди злітає Nexi) і точка на підлозі перед платформою; глибина Nexi в капсулі (масштаб і порядок). */
    pad() { return zone().S(1005, 316, 28); },
    front() { return [this.pad()[0], 362]; },
    depth() { return 357; },
    enter() { S.occ = true; S.scan = 0; },
    leave() { S.occ = false; S.scan = 0; },
    /** Встановлення скіна (ui/skinlab.js -> installFx, коли Nexi в капсулі): маніпулятор нахиляється й «зашиває» скін. */
    install() { S.zap = .001; NX.nexiPhys.kick(2); NX.nexi.emote('surprise', 1.2); },
    /** Вільний час: Nexi милується голограмою — вона швидко прокручує кілька скінів і сипле іскрами. */
    show() { S.fast = 3.4; },
    update(dt, t) {
      if (!zone()) return;
      S.holoA += ((S.occ ? 0 : 1) - S.holoA) * Math.min(1, dt * 5);
      if (S.occ) S.scan += dt;
      if (S.zap > 0) { const was = S.zap; S.zap += dt / 1.7; if (was < .4 && S.zap >= .4) this.burst(); if (S.zap >= 1) S.zap = 0; }   // 1.7 с: нахил, блискавка, повернення
      if (S.fast > 0) S.fast -= dt;
      // скан голограми маніпулятором — час від часу
      S.lookT -= dt; if (S.lookT < 0 && !S.occ) { S.lookT = 9 + Math.random() * 6; S.lookOn = 2.4; }
      if (S.lookOn > 0) S.lookOn -= dt; S.look += (((S.lookOn > 0) ? 1 : 0) - S.look) * Math.min(1, dt * 2.2);
      // зміна скіна голограми: на ребрі оберту (невидимо) — наступний, і пікселі «збираються» знову
      const per = S.fast > 0 ? 1.1 : PERIOD, ph = (t % per) / per, spin = SPIN / per;
      if (ph > 1 - spin * .75 && S.last !== Math.floor(t / per)) { S.last = Math.floor(t / per); S.shown++; S.mat = 0; }
      if (S.mat < 1) S.mat = Math.min(1, S.mat + dt / .55);
      // частинки в конусі
      if (S.holoA > .2 && Math.random() < .5) { const [px, py] = this.pad(); S.motes.push({ x: px + (Math.random() - .5) * 34, y: py - 2, vy: -14 - Math.random() * 18, a: 0, ttl: 1.6 + Math.random(), c: Math.random() < .5 ? '154,246,255' : '255,154,240' }); }
      S.motes = S.motes.filter(m => (m.a += dt) < m.ttl); S.motes.forEach(m => { m.y += m.vy * dt; m.x += Math.sin(m.a * 4 + m.y) * dt * 6; });
      S.bolts = S.bolts.filter(b => (b.a += dt) < b.ttl);
    },
    /** Іскри й спалах на Nexi в момент «встановлення» скіна. */
    burst() { const n = NX.nexi; for (let i = 0; i < 18; i++) NX.fx.emit('spark', n.x + (Math.random() - .5) * 34, n.y - Math.random() * 54, { col: Math.random() < .5 ? '#ffd27a' : '#ffffff' }); S.flash = .35; },
    drawBack(c, t) {
      const z = zone(); if (!z) return;
      const [px, py] = this.pad(), hs = NX.room.scaleAt(357) * SPRITE_K * 1.16, fy = 359;
      c.save();
      // рожеве світло на підлогу перед платформою й сяйво пада
      const fl = c.createRadialGradient(px, fy + 3, 4, px, fy + 3, 120); fl.addColorStop(0, 'rgba(255,90,220,.22)'); fl.addColorStop(1, 'rgba(255,90,220,0)');
      c.globalCompositeOperation = 'lighter'; c.fillStyle = fl; c.save(); c.translate(px, fy + 3); c.scale(1, .16); c.translate(-px, -(fy + 3)); c.fillRect(px - 120, fy - 117, 240, 240); c.restore();
      P.glow(c, px, py - 2, 34 + (S.occ ? 10 : 0), S.occ ? 'rgba(255,140,240,.8)' : 'rgba(255,110,230,.65)', .4 + .15 * Math.sin(t * 3));
      // конус світла з пада (голограма) або колона сканера (Nexi в капсулі)
      const H = 78, a = S.occ ? .5 : .32 * S.holoA + .08;
      const g = c.createLinearGradient(0, py, 0, py - H); g.addColorStop(0, `rgba(170,240,255,${a})`); g.addColorStop(.5, `rgba(255,140,240,${a * .45})`); g.addColorStop(1, 'rgba(255,140,240,0)');
      c.fillStyle = g; c.beginPath(); c.moveTo(px - 20, py); c.lineTo(px + 20, py); c.lineTo(px + 31, py - H); c.lineTo(px - 31, py - H); c.closePath(); c.fill();
      for (let k = 0; k < 5; k++) { const ph = (t * .6 + k * .2) % 1, xx = px - 18 + 36 * ((k * .37 + t * .05) % 1); c.fillStyle = `rgba(200,250,255,${.25 * Math.sin(ph * Math.PI)})`; c.fillRect(xx, py - H * ph - 8, .6, 8); }
      S.motes.forEach(m => { c.fillStyle = `rgba(${m.c},${Math.sin(m.a / m.ttl * Math.PI) * .9})`; c.fillRect(m.x, m.y, 1, 1); });
      c.restore();
      // ГОЛОГРАМА
      if (S.holoA > .02) {
        const per = S.fast > 0 ? 1.1 : PERIOD, ph = (t % per) / per, spin = SPIN / per;
        let th = 0; if (ph > 1 - spin) th = ease((ph - (1 - spin)) / spin) * Math.PI * 2;
        const cs = Math.cos(th), back = cs < 0, pose = S.mat < 1 ? 'cheer' : (Math.floor(t / per) % 3 === 1 ? 'wave' : 'stand');
        if (!S.hc || (NX.loop.frames & 1) === 0) S.hc = holoFrame(t, back, pose);                   // кадр голограми — раз на 2 кадри
        const cv = S.hc, hover = 5 + Math.sin(t * 2) * 1.5, w = SW * hs, h = SH * hs, top = FOOT * hs, fl2 = (.86 + .14 * Math.sin(t * 23) * Math.sin(t * 7)) * S.holoA;
        c.save(); c.imageSmoothingEnabled = false; c.translate(px, py - hover); c.scale(Math.max(.06, Math.abs(cs)), 1);
        c.globalAlpha = .84 * fl2; c.drawImage(cv, -w / 2, -top, w, h);
        c.globalCompositeOperation = 'lighter'; c.globalAlpha = .28 * fl2; c.drawImage(cv, -w / 2 + .8, -top, w, h); c.drawImage(cv, -w / 2 - .8, -top - .6, w, h);
        c.restore();
        if (S.mat < 1) { const yy = py - hover - top + h * .93 * (1 - ease(S.mat)); c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(220,255,255,.9)'; c.fillRect(px - w * .32, yy, w * .64, .9); P.glow(c, px, yy, 16, 'rgba(160,240,255,.7)', .5); c.restore(); }
        // голо-табличка з назвою скіна + каруселька
        const name = NX.t('skin.theme.' + look(S.shown).theme).toUpperCase(), ty = py - hover - top - 9;
        c.save(); c.globalAlpha = S.holoA; c.font = '4px "Press Start 2P", monospace'; const tw = Math.min(64, c.measureText(name).width + 8);
        c.fillStyle = 'rgba(6,18,60,.72)'; c.fillRect(px - tw / 2, ty - 5, tw, 8); c.strokeStyle = '#7af4ff'; c.lineWidth = .5; c.strokeRect(px - tw / 2 + .25, ty - 4.75, tw - .5, 7.5);
        c.fillStyle = '#e8feff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(name, px, ty - .7, tw - 4); c.textAlign = 'left'; c.textBaseline = 'alphabetic';
        for (let k = 0; k < LOOKS.length; k++) { const on = k === ((S.shown % LOOKS.length) + LOOKS.length) % LOOKS.length; c.fillStyle = on ? '#ff9af0' : 'rgba(150,230,255,.45)'; c.fillRect(px - LOOKS.length * 1.6 + k * 3.2, ty + 4.5, on ? 2 : 1.4, on ? 2 : 1.4); }
        c.restore();
      }
      // СКАНУВАННЯ Nexi в капсулі: кільця бігають по ньому, з боків — світлові колони
      if (S.occ) {
        const n = NX.nexi, Hn = 56, k0 = Math.min(1, S.scan / .4);
        c.save(); c.globalCompositeOperation = 'lighter';
        for (let k = 0; k < 3; k++) { const ph = (S.scan * .7 + k / 3) % 1, yy = n.y - Hn * (1 - ph), al = Math.sin(ph * Math.PI) * .85 * k0;
          c.strokeStyle = k % 2 ? `rgba(120,240,255,${al})` : `rgba(255,150,240,${al})`; c.lineWidth = 1.1; c.beginPath(); c.ellipse(n.x, yy, 22, 4.2, 0, 0, 7); c.stroke(); }
        [-1, 1].forEach(sd => { const g2 = c.createLinearGradient(0, n.y, 0, n.y - 70); g2.addColorStop(0, `rgba(255,150,240,${.35 * k0})`); g2.addColorStop(1, 'rgba(255,150,240,0)'); c.fillStyle = g2; c.fillRect(n.x + sd * 30 - 1.5, n.y - 70, 3, 70); });
        c.restore();
      }
      // МАНІПУЛЯТОР (+ промінь скану голограми / блискавка встановлення)
      const pts = armPts(t), tip = drawArm(c, t, pts, (NX.arcLayout && NX.arcLayout.right && NX.arcLayout.right.armRig || {}).k || 1.2);
      if (S.look > .6 && S.holoA > .3) { c.save(); c.globalCompositeOperation = 'lighter'; const hy = py - 40; const g3 = c.createLinearGradient(tip[0], tip[1], px, hy); g3.addColorStop(0, 'rgba(150,240,255,.75)'); g3.addColorStop(1, 'rgba(150,240,255,0)');
        c.strokeStyle = g3; c.lineWidth = 1.2; c.beginPath(); c.moveTo(tip[0], tip[1]); c.lineTo(px + Math.sin(t * 3) * 14, hy + Math.cos(t * 2.3) * 16); c.stroke(); c.restore(); }
      if (S.zap > .24 && S.zap < .8) { const n = NX.nexi, hx2 = n.x, hy2 = n.y - 40; c.save(); c.globalCompositeOperation = 'lighter';
        for (let pass = 0; pass < 2; pass++) { c.strokeStyle = pass ? '#ffffff' : 'rgba(255,170,90,.8)'; c.lineWidth = pass ? .7 : 2.2; c.beginPath(); c.moveTo(tip[0], tip[1]);
          for (let q = 1; q <= 7; q++) { const f = q / 7, j = q < 7 ? (Math.random() - .5) * 7 : 0; c.lineTo(tip[0] + (hx2 - tip[0]) * f + j, tip[1] + (hy2 - tip[1]) * f + j * .5); } c.stroke(); }
        P.glow(c, hx2, hy2, 26, 'rgba(255,220,150,.9)', .7); c.restore(); }
      if (S.flash > 0) { S.flash -= 1 / 60; const n = NX.nexi; P.glow(c, n.x, n.y - 28, 46, 'rgba(255,255,255,.9)', S.flash * 2); }
    },
  });
})();
