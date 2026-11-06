/* ============================================================================
 * objects/aicenter.js — AI-ЦЕНТР («НЕЙРОЦЕНТР»): ЖИВИЙ ОБ'ЄКТ
 * ----------------------------------------------------------------------------
 * Нерухома частина (стіл на всю ширину зони на двох тумбах; монітори; висока рамка з вивіскою і пультом) — у
 * 3D-розкладці (gen_room.py: aicenter(); грані — objects/ai_paint.js). Тут — те, що живе поверх.
 * Крок 13 (перший крок зони — лише стіл і головний екран; власник: «далі, після мого "так", — Nexi в ній працює»):
 *   ГОЛО-ЕКРАН у рамці (NX.arc.holo.pane, crisp, непрозорий; вміст — NX.arc.aiScreen: мозок-нейромережа, показники, журнал,
 *     сканер «зір», карта, хвиля «думки»; перемальовується раз на 5 кадрів); довкола — м'яке сяйво на стіні; зрідка (раз на
 *     24–42 с) коротко «лагає»;
 *   ДИСКИ-ПРОЄКТОРИ на столі (fg у розкладці) рушій малює ще раз ПОВЕРХ екрана (NX.arc.fgDraw); над ними — ГОЛО-МОНІТОРИ (Правки
 *   зон · 5: панелі NX.arc.holo.pane з вмістом NX.arc.aiMon, промінь проєктора — beam).
 * Крок 14 (власник: «зроби взаємодію з Nexi»): Nexi злітає на стіл (коло-майданчик посередині стільниці), стає спиною до
 *   нас і працює: екран показує задачу (рожева смужка поступу в шапці, мозок і сигнали швидші), у кінці — «✓» на екрані й
 *   картка результату (ui/zones.js: «відповісти клієнту», «лист партнеру», «підсумок зустрічі» — раніше з дивану).
 *   front() — де стати перед столом, top() — куди злетіти, depth() — глибина для масштабу; begin(task) / finish().
 *   Під столом — лежанка Рудика (ai_bed у розкладці; кіт — actors/cat/cat.js).
 * Крок 15 (власник: «зроби взаємодію з AI-центром ще прикольніше, додай фішок»):
 *   ВІТАННЯ — Nexi приземлився: у шапці екрана «ПРИВІТ, NEXI!» (1.8 с), далі — його задача;
 *   НЕЙРО-ЛІНК — поки Nexi працює, від його голови до мозку на екрані тягнеться світний промінь, сигнали біжать в обидва боки;
 *   ГОЛО-ІКОНКИ — з мозку вилітають значки задачі (бульбашка чату / конверт / нотатка) і пірнають у монітори (ті спалахують);
 *   «ЕВРИКА» — на фініші мозок спалахує, кільця розходяться, з екрана сиплються біти (і «✓», як і раніше);
 *   РАДАР «ЗІР» бачить Рудика — на столі чи в лежанці (значок котячої голови й підпис scene.ai.cat; спить — «z»);
 *   ГОЛО-РИБКА — Рудик на столі: AI вмикає йому іграшку (промінь з пульта, рибка над столом), він б'є лапкою — рибка
 *     відскакує, на третій раз розсипається іскрами (fishGo(cat) — actors/cat/cat.js: play);
 *   ВІРУС — тривога на екрані й «дірка», звідки він вистрибнув; зелена печатка з лапкою після лазера Рудика
 *     (actors/virus/virus.js; стан — NX.virus.S). glitch(сек) — екран «лагає»; scrPt(u, v) — точка скла в кімнаті.
 * active / prog — Nexi працює (nexi.js: work.obj = 'aicenter').
 * ========================================================================== */
(() => {
  const P = NX.px;
  let Z = null; const zone = () => Z || (Z = NX.arc.zone && NX.arc.zone('ai'));
  // голо-екран (px картинки зони): привид ai_scr — вісь (X 118), вирівняна по центру стола; екран — у склі рамки (рамка — X −13..249,
  // Y 50..284 у gen_room.py aicenter(); частки скла — ai_paint.js FR)
  const SCR = { X: [-0.4, 236.4], Y: [99, 232], Xc: 118 };
  const S = { act: false, prog: 0, task: null, doneT: -99, hiT: -99, cat: null, alert: null, cleanT: -99, by: null, hole: null, vir: null };   // стан для вмісту екрана (ai_paint.js)
  const FX = { nextLag: 24 + Math.random() * 14, icons: [], nextIcon: 0, fish: null };
  let pane = null;
  // ГОЛО-МОНІТОРИ (Правки зон · 5, власник: «зроби їх голографічними»): дві напівпрозорі панелі над дисками-проєкторами на столі
  // (привиди ai_monL/R і диски ai_mon*b — gen_room.py aicenter(); вміст — NX.arc.aiMon у ai_paint.js). Малюються ПІСЛЯ fgDraw —
  // поверх великого екрана й дисків; від диска до панелі — конус світла проєктора, на диску — сяйво.
  const MON = [{ item: 'ai_monL', X: [4, 76], Y: [235, 278], rgb: '59,232,255', seed: 7, kind: 0 }, { item: 'ai_monR', X: [170, 232], Y: [243, 278], rgb: '59,255,138', seed: 11, kind: 1 }];
  const mons = () => { MON.forEach(m => m.p || (m.p = NX.arc.holo.pane({ zone: 'ai', item: m.item, Xc: (m.X[0] + m.X[1]) / 2, X: m.X, Y: m.Y, v: 0, rgb: m.rgb, seed: m.seed, shade: .42, every: 4, lagMin: 30, lagVar: 30,
    paint: (c, fw, fh, t) => NX.arc.aiMon(c, fw, fh, t, m.kind) }))); return MON; };
  /** Промінь проєктора: від диска (точка на його лиці — NX.arc.holo.at) до нижнього краю панелі, світлий конус; на диску — сяйво. */
  function beam(c, m, t) {
    const q = m.p.quad(); if (!q) return; const at = m.at || (m.at = NX.arc.holo.at('ai', m.item + 'b', (m.X[0] + m.X[1]) / 2, 0)); if (!at) return;
    const d = at((m.X[0] + m.X[1]) / 2, 283.2), bx = (q[3][0] + q[2][0]) / 2, by = (q[3][1] + q[2][1]) / 2, bw = (q[2][0] - q[3][0]) * .42, fl = .75 + .25 * Math.sin(t * 9 + m.seed);
    c.save(); c.globalCompositeOperation = 'lighter';
    const g = c.createLinearGradient(0, d[1], 0, by); g.addColorStop(0, `rgba(${m.rgb},${.8 * fl})`); g.addColorStop(1, `rgba(${m.rgb},.07)`);
    c.fillStyle = g; c.beginPath(); c.moveTo(d[0] - 1.2, d[1]); c.lineTo(d[0] + 1.2, d[1]); c.lineTo(bx + bw, by); c.lineTo(bx - bw, by); c.closePath(); c.fill();
    P.glow(c, d[0], d[1], 7, `rgba(${m.rgb},.6)`, .35 * fl); c.restore();
  }
  const mk = () => pane || (pane = NX.arc.holo.pane({ zone: 'ai', item: 'ai_scr', Xc: SCR.Xc, X: SCR.X, Y: SCR.Y, v: 0, rgb: '150,240,255', seed: 5, lagMin: 0, crisp: true, shade: 1, every: 5,
    paint: (c, fw, fh, t) => NX.arc.aiScreen(c, fw, fh, t, S) }));
  /** М'яке сяйво екрана на стіні довкола (під екраном): блакитне й трохи рожевого від рамки. Овали під форму екрана (крок 13.3:
   *  екран став широким — коло на всю його ширину заливало вдвічі більше пікселів, а видно сяйво лише довкола рамки). */
  function glow(c, q, t, act) {
    const cx = (q[0][0] + q[1][0]) / 2, cy = (q[0][1] + q[3][1]) / 2, w = q[1][0] - q[0][0], h = q[3][1] - q[0][1], a = .24 + .05 * Math.sin(t * 1.1) + (act ? .1 : 0);
    c.save(); c.translate(cx, cy); c.scale(1, Math.min(1, h / w * 1.2)); P.glow(c, 0, 0, w * .62, 'rgba(70,170,255,.5)', a); c.restore();
    c.save(); c.translate(cx, q[0][1]); c.scale(1, .45); P.glow(c, 0, 0, w * .45, 'rgba(255,80,210,.4)', a * .5); c.restore();
  }
  const proj = NX.px3d.proj;
  /** Точка скла голо-екрана в кімнаті: частки (u — зліва направо, v — згори вниз). */
  function scrPt(u, v) { const q = pane && pane.quad(); if (!q) return null; const L = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]; return L(L(q[0], q[1], u), L(q[3], q[2], u), v); }
  /** НЕЙРО-ЛІНК: від голови Nexi (він спиною до нас) угору до мозку на екрані — дві скручені нитки (рожева й блакитна) у м'якому
   *  стовпі світла, по них біжать сигнали; на початку роботи лінк «виростає» з антени. */
  function link(c, t) {
    const n = NX.nexi; if (n.loc !== 'aiDesk' || !S.act || n.alpha < .5) return; const b = scrPt(.5, .42); if (!b) return;
    const s = NX.room.scaleAt(Math.max(n.depthY(), 352)) * n.zoom * SPRITE_K, hx = n.x, hy = n.y - FOOT * s * .92, k = Math.min(1, S.prog * 10);
    const L = Math.hypot(b[0] - hx, b[1] - hy), nx = -(b[1] - hy) / L, ny = (b[0] - hx) / L, A = 4.2;            // нормаль до лінії голова → мозок
    const pt = (u, ph) => { const w = Math.sin(u * Math.PI) * A * Math.sin(u * 11 - t * 7 + ph); return [hx + (b[0] - hx) * u + nx * w, hy + (b[1] - hy) * u + ny * w]; };
    c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
    c.strokeStyle = 'rgba(120,200,255,.13)'; c.lineWidth = 7; c.beginPath(); c.moveTo(hx, hy); c.lineTo(hx + (b[0] - hx) * k, hy + (b[1] - hy) * k); c.stroke();   // стовп світла
    for (const [ph, col] of [[0, 'rgba(255,122,230,.85)'], [Math.PI, 'rgba(140,240,255,.9)']]) { c.strokeStyle = col; c.lineWidth = .9; c.beginPath();
      for (let i = 0; i <= 28; i++) { const [x, y] = pt(k * i / 28, ph); i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); }
    if (k >= 1) for (let i = 0; i < 6; i++) { const u = (t * .8 + i / 6) % 1, up = i % 2, [px, py] = pt(up ? 1 - u : u, up ? Math.PI : 0); c.fillStyle = up ? '#ffd0f6' : '#e0feff'; c.fillRect(px - 1, py - 1, 2, 2); }
    P.glow(c, hx, hy, 9, 'rgba(120,230,255,.8)', .45 + .2 * Math.sin(t * 6)); if (k >= 1) P.glow(c, b[0], b[1], 16, 'rgba(255,79,216,.6)', .45 + .15 * Math.sin(t * 4));
    c.restore();
  }
  /** Піксельний значок задачі (кв. сітка u): chat — бульбашка з крапками, mail — конверт, note — аркуш з рядками. */
  function glyph(c, kind, x, y, u, a) {
    const R = (gx, gy, w, h, col) => { c.fillStyle = col; c.fillRect(x + gx * u, y + gy * u, w * u, h * u); };
    c.save(); c.globalAlpha = a; P.glow(c, x + 3.5 * u, y + 2.5 * u, 6 * u, 'rgba(120,230,255,.7)', .55);
    if (kind === 'mail') { R(0, 0, 7, 5, '#eafcff'); R(0, 0, 7, 1, '#ff7ad8'); R(1, 1, 1, 1, '#ff7ad8'); R(5, 1, 1, 1, '#ff7ad8'); R(2, 2, 1, 1, '#ff7ad8'); R(4, 2, 1, 1, '#ff7ad8'); R(3, 3, 1, 1, '#ff7ad8'); }
    else if (kind === 'note') { R(1, -1, 5, 7, '#eafcff'); [0.5, 2, 3.5].forEach((yy, i) => R(2, yy, i === 2 ? 2 : 3, .8, '#3bc8ff')); R(5, -1, 1, 1, '#9adcff'); }
    else { R(0, 0, 7, 4, '#bff8ff'); R(1, 4, 2, 1, '#bff8ff'); R(1, 5, 1, 1, '#bff8ff'); [1.5, 3, 4.5].forEach(xx => R(xx, 1.5, 1, 1, '#ff4fd8')); }
    c.restore();
  }
  const ICON_OF = { reply: 'chat', mail: 'mail', summary: 'note' };
  /** Голо-іконки: з мозку — у монітори (дуга, ростуть і тануть); монітор, куди пірнула, спалахує. */
  function icons(c, t) {
    if (S.act && NX.nexi.loc === 'aiDesk' && S.prog > .08 && S.prog < .95 && t > FX.nextIcon) { FX.nextIcon = t + .8 + Math.random() * .5; FX.icons.push({ t0: t, side: Math.random() < .5 ? -1 : 1, kind: ICON_OF[S.task] || 'chat' }); }
    FX.icons = FX.icons.filter(o => t - o.t0 < 1.2); if (!FX.icons.length) return;
    const b = scrPt(.5, .42), z = zone(); if (!b || !z) return;
    const M = { '-1': z.S(39, 256, 10), '1': z.S(203, 260, 10) };
    FX.icons.forEach(o => { const k = (t - o.t0) / 1.2, to = M[o.side], e = k * k * (3 - 2 * k), x = b[0] + (to[0] - b[0]) * e, y = b[1] + (to[1] - b[1]) * e - Math.sin(k * Math.PI) * 26, u = 1.5 * (k < .15 ? .4 + 4 * k : k > .82 ? Math.max(.25, (1 - k) / .18) : 1);
      glyph(c, o.kind, x - 3.5 * u, y - 2.5 * u, u, k > .85 ? (1 - k) / .15 : 1);
      if (k > .78) P.glow(c, to[0], to[1], 20, 'rgba(120,230,255,.75)', (k - .78) / .22 * .55); });
  }
  /** ГОЛО-РИБКА для Рудика (крок 15): висить перед ним над столом, у промені з пульта; hit() — відскакує, третій — іскри. */
  function fishGo(cat) {
    if (FX.fish) return null;
    const F = { t0: NX.time, cat, hits: 0, dead: false, x: cat.x, y: cat.y, ox: 0, oy: 0, hitT: -9,
      alive: () => !F.dead && FX.fish === F,
      hit() { F.hits++; F.hitT = NX.time; F.ox = (Math.random() - .5) * 14; F.oy = -6 - Math.random() * 8;
        if (F.hits >= 3) { F.dead = true; F.deadT = NX.time; for (let i = 0; i < 16; i++) NX.fx.emit('spark', F.x + (Math.random() - .5) * 8, F.y + (Math.random() - .5) * 6, { col: Math.random() < .5 ? '#7af4ff' : '#ff9af0' }); } } };
    return FX.fish = F;
  }
  function fishUpdate(t) {
    const F = FX.fish; if (!F) return; const c = F.cat;
    if ((F.dead && t - F.deadT > .3) || !/aiDesk/.test(c.at || '') || t - F.t0 > 14) { FX.fish = null; return; }
    const s = c.sc || 1.4, k = Math.min(1, (t - F.hitT) / .6), back = 1 - k * k;                                   // після удару — відскок і назад
    F.x = c.x + c.dir * 15 * s + F.ox * back + Math.sin(t * 2.3) * 2; F.y = c.y - 20 * s + F.oy * back + Math.sin(t * 3.1) * 1.6;
  }
  function fishLayer() {
    const F = FX.fish; if (!F) return null; const t = NX.time, c = F.cat, s = c.sc || 1.4;
    return { y: c.y + 8, draw: g => {
      const b = scrPt(F.x < (scrPt(.5, 1) || [0])[0] ? .3 : .7, 1), al = Math.min(1, (t - F.t0) * 3) * (F.dead ? Math.max(0, 1 - (t - F.deadT) / .3) : 1) * (t - F.hitT < .25 ? (Math.floor(t * 30) % 2 ? .3 : 1) : 1);
      g.save(); g.globalCompositeOperation = 'lighter';
      if (b) { g.globalAlpha = .1 * al; g.fillStyle = '#7af4ff'; g.beginPath(); g.moveTo(b[0] - 3, b[1]); g.lineTo(b[0] + 3, b[1]); g.lineTo(F.x + 6 * s, F.y + 3 * s); g.lineTo(F.x - 6 * s, F.y + 3 * s); g.closePath(); g.fill(); }   // промінь проектора з пульта
      P.glow(g, F.x, F.y, 11 * s, 'rgba(255,190,90,.8)', .55 * al); g.globalCompositeOperation = 'source-over'; g.globalAlpha = .95 * al;
      const u = s * 1.35, d = F.cat.x > F.x ? 1 : -1, R = (gx, gy, w, h, col) => { g.fillStyle = col; g.fillRect(F.x + (d > 0 ? gx : -gx - w) * u, F.y + gy * u, w * u, h * u); };   // носом до кота
      const wig = Math.floor(t * 6) % 2;                                                                               // золота рибка-голограма
      R(-1, -2, 5, 4, '#ffb03a'); R(-2, -1, 7, 2, '#ffb03a'); R(0, -2, 3, 1, '#fff0b0'); R(-1, 1, 5, 1, '#e87a1a'); R(3, -1, 1, 1, '#2a0a10');   // тіло, блік, черевце, око
      R(-5, -2 + wig, 3, 1, '#ff6ad0'); R(-4, -1, 2, 2, '#ff6ad0'); R(-5, 1 - wig, 3, 1, '#ff6ad0'); R(0, -3, 2, 1, '#ff6ad0'); R(1, 2, 2, 1, '#ff6ad0');   // хвіст і плавці
      g.globalCompositeOperation = 'lighter'; g.globalAlpha = (.25 + .2 * Math.sin(t * 9)) * al; R(-5, -3, 10, 6, 'rgba(120,230,255,.5)');   // голо-відблиск
      if (Math.floor(t * 9) % 3 === 0) { g.globalAlpha = .5 * al; R(-5, -2 + (Math.floor(t * 20) % 5), 10, .5, '#ffffff'); }   // скан-лінія голограми
      g.restore(); } };
  }
  NX.addObject({
    id: 'aicenter', name: 'obj.aiPc', act: 'ai', active: false, prog: 0,
    get span() { const z = zone(); return z && z.box ? [z.box[0] - 30, z.box[1] + 30] : null; },
    get hit() { const z = zone(); if (!z || !z.box) return null; const [x0, x1, y0, y1] = z.box; return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 - 10 }; },
    ready() { return !!zone(); },
    /** Де стати перед столом (підлога перед ним, по центру) — і звідки злітати. */
    front() { const z = zone(), f = NX.objects.foot_ai && NX.objects.foot_ai.foot, x = proj(z.W(118, 352, -12))[0]; return NX.room.clampWalk(x, (f ? f[3] : 445) + 8); },
    /** Куди злетіти: коло-майданчик посередині стільниці (ноги Nexi — на ній). */
    top() { const p = proj(zone().W(118, 284, 20)); return [p[0], p[1] + 2]; },
    depth() { return this.front()[1] - 14; },
    begin(task) { S.task = task; S.doneT = -99; S.hiT = NX.time; },
    finish() { if (S.task) { const b = scrPt(.5, .42); if (b) for (let i = 0; i < 16; i++) { const a = Math.random() * 6.283, sp = 25 + Math.random() * 55;   // «еврика»: біти сиплються з мозку
        NX.fx.emit('bit', b[0], b[1], { vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * .6 - 20, g: 110, ttl: .8 + Math.random() * .5, col: ['#3be8ff', '#ff7af0', '#ffffff'][i % 3] }); } }
      S.doneT = NX.time; S.task = null; },
    scrPt, fishGo,
    /** Екран коротко «лагає» (вірус). */
    glitch(d = .5) { if (pane) pane.kick(NX.time, d, 0); },
    update(dt, t) {
      if (!zone() || !NX.arc.holo) return; mk();
      S.act = !!this.active; S.prog = this.prog || 0; S.t = t;
      const V = NX.virus && NX.virus.S; if (V) { S.alert = V.alert; S.cleanT = V.cleanT; S.by = V.by; S.hole = V.alert && V.hole; S.vir = V.v && V.v.ph === 'screen' ? V.v : null; }
      const cat = NX.cat, bed = cat.bedSpot().aiBed;                                                                     // радар бачить Рудика
      S.cat = /aiDesk/.test(cat.at || '') ? 'desk' : bed && cat.alt > 0 && Math.hypot(cat.x - bed.x, cat.y - bed.y) < 4 ? (cat.pose === 'sleep' ? 'bed' : 'desk') : null;
      fishUpdate(t);
      if (t > FX.nextLag) { if (!S.act && !S.alert) pane.kick(t, .3 + Math.random() * .3); FX.nextLag = t + 24 + Math.random() * 18; }   // зрідка й не під час роботи
    },
    drawBack(c, t) {
      if (!zone() || !NX.arc.holo) return; mk();
      const q = pane.quad(); if (q) glow(c, q, t, !!this.active);
      pane.draw(c, t);
      if (S.alert && q) { c.save(); c.globalCompositeOperation = 'lighter'; P.glow(c, (q[0][0] + q[1][0]) / 2, (q[0][1] + q[3][1]) / 2, (q[1][0] - q[0][0]) * .5, 'rgba(255,40,60,.6)', .22 + .14 * Math.sin(t * 10)); c.restore(); }   // тривога — червоне сяйво
      if (NX.arc.fgDraw) NX.arc.fgDraw(c, 'ai');                                               // диски-проєктори на столі — поверх екрана
      for (const m of mons()) { beam(c, m, t); m.p.draw(c, t); }                                   // голо-монітори над дисками
      link(c, t); icons(c, t);
    },
    layers() { const l = fishLayer(); return l ? [l] : []; },
  });
})();
