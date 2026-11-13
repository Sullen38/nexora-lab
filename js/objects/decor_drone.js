/* ============================================================================
 * objects/decor_drone.js — ДРОН-КУРАТОР СОТ (Декор стін · 59)
 * ----------------------------------------------------------------------------
 * Власник (13.11): «дрона треба пропрацювати ще» → з пропозицій: свій характер, плавний політ, справжній догляд, док-станція,
 * тап; і від себе: «щоб ним можна було керувати — торкаємось і ведемо, він летить у тому напрямку, а коли відпускаємо —
 * летить по своїх справах».
 * ХТО ВІН: маленький робот-помічник у стилі Nexi — біла кругла голова, темний візор з бірюзовими очима-емоціями (звичайні,
 * радіє, дивується, мружиться в роботі, спить), гвинт-«шапочка» зверху (розмитий диск), дві ручки-маніпулятори, золота
 * лампа знизу. Піксель-арт кодом (спрайт 30×26 на кожну емоцію й кадр гвинта).
 * ЩО РОБИТЬ САМ (job): облітає соти у своєму порядку й біля кожної щось робить — сканує артефакт променем, протирає шибку
 * (їздить уздовж, блищики), здуває пил (порошинки летять), поправляє артефакт ручкою (той «спрацьовує», як від тапу);
 * раз на кілька сот поливає одну з ліан туманцем (objects/decor_vines.js: water — гойднеться й зацвіте); далі летить на
 * ДОК-СТАНЦІЮ (гніздо на цеглі у вільній комірці над сотою з колбою) заряджатися; уночі спить на доку.
 * ПОЛІТ: пружина до цілі з інерцією, нахил у бік руху, тінь на цеглі, бірюзовий шлейф на швидкості.
 * КЕРУВАННЯ: палець / миша на дроні й ведемо — летить за пальцем (камера при цьому не гортається); відпустили — повертається до
 * справ. Короткий тап — «бочка», радіє, картка (objects/decor_guide.js showBot). Слухачі — свої, на canvas у фазі capture:
 * core/camera.js не чіпаємо (дотик по дрону до камери не доходить).
 * Малює objects/decor_live.js (drawCurator) після скла й кромок сот — крок, док-станцію й тінь; сам дрон — верхнім шаром
 * (об'єкт decorDroneTop, layers з y 1e6): поверх зон, Nexi й усього в кімнаті (власник, 13.11: «має літати поверх всього»).
 * API: NX.decorDrone = { draw(c, t, nt, cells, vx0, vx1, glow), portrait(t) -> canvas (картка), at() -> {x, y} }.
 * ========================================================================== */
(() => {
  const TAU = Math.PI * 2, O = '#0b0620', W = 30, H = 26;
  const hash = (a, b = 0) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
  const ORDER = [3, 9, 0, 6, 11, 2, 7, 12, 4, 10, 1, 8, 5], JOBS = ['scan', 'wipe', 'fix', 'blow'];

  // ---------- спрайт ----------
  const SPR = {};
  function spr(emo, rf) {
    const key = emo + rf; if (SPR[key]) return SPR[key]; const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const q = cv.getContext('2d'), R = (x, y, w, h, col) => { q.fillStyle = col; q.fillRect(x, y, w, h); };
    // гвинт: розмитий диск, у кожному кадрі світла лопать в іншому місці
    q.globalAlpha = .34; R(3, 2, 24, 2, '#bfe8ff'); R(6, 1, 18, 1, '#bfe8ff'); R(6, 4, 18, 1, '#bfe8ff'); q.globalAlpha = .8; R([4, 11, 18][rf], 2, 8, 1, '#ffffff'); R([18, 4, 11][rf], 3, 8, 1, '#eaffff'); q.globalAlpha = 1;
    R(13, 1, 4, 6, O); R(14, 2, 2, 4, '#9a9ac4'); R(14, 2, 1, 1, '#ffffff');                                              // втулка й щогла
    // ручки-маніпулятори
    R(6, 19, 3, 5, O); R(7, 20, 1, 3, '#9a9ac4'); R(5, 23, 5, 2, O); R(6, 23, 1, 1, '#3be8ff'); R(8, 23, 1, 1, '#3be8ff');
    R(21, 19, 3, 5, O); R(22, 20, 1, 3, '#7a7aa8'); R(20, 23, 5, 2, O); R(21, 23, 1, 1, '#3be8ff'); R(23, 23, 1, 1, '#3be8ff');
    // голова: біла капсула, світло зліва згори
    R(6, 6, 18, 15, O); R(4, 8, 22, 11, O); R(5, 7, 20, 13, O);
    R(7, 7, 16, 13, '#eef0fa'); R(5, 9, 20, 9, '#eef0fa'); R(6, 8, 18, 11, '#eef0fa');
    R(8, 7, 12, 1, '#ffffff'); R(6, 9, 2, 3, '#ffffff'); R(22, 9, 2, 9, '#b8bcd8'); R(7, 18, 16, 2, '#9ca0c4'); R(6, 17, 18, 1, '#c4c8e0'); R(23, 10, 1, 7, '#9ca0c4');
    // бокові «вушка» з вогником
    R(2, 10, 3, 7, O); R(3, 11, 1, 5, '#9a9ac4'); R(3, 13, 1, 1, '#3be8ff'); R(25, 10, 3, 7, O); R(26, 11, 1, 5, '#7a7aa8'); R(26, 13, 1, 1, '#3be8ff');
    // візор
    R(8, 9, 14, 8, '#1a2c50'); R(9, 10, 12, 6, '#0c1830'); R(9, 10, 12, 1, '#081020'); R(19, 10, 2, 1, '#2a4a80');
    const C = '#3be8ff', Hh = '#eaffff', D = '#1a8ac8';
    for (const ex of [11, 17]) {
      if (emo === 'idle') { R(ex, 11, 3, 4, C); R(ex, 11, 1, 1, Hh); R(ex, 14, 3, 1, D); }
      else if (emo === 'happy') { R(ex, 12, 1, 2, C); R(ex + 1, 11, 1, 2, C); R(ex + 2, 12, 1, 2, C); R(ex + 1, 11, 1, 1, Hh); }
      else if (emo === 'wow') { R(ex - 1, 10, 5, 5, C); R(ex, 11, 3, 3, '#0c1830'); R(ex + 1, 12, 1, 1, Hh); }
      else if (emo === 'work') { R(ex, 12, 3, 2, C); R(ex, 12, 3, 1, Hh); }
      else if (emo === 'blink') R(ex, 13, 3, 1, C);
      else R(ex, 13, 3, 1, D);                                                                                              // sleep
    }
    R(7, 16, 1, 2, '#ff4fd8'); R(22, 16, 1, 2, '#ff4fd8');                                                                 // рожеві «щічки»-неон
    R(12, 20, 6, 4, O); R(13, 20, 4, 3, '#c8901e'); R(13, 20, 4, 1, '#f4c842'); R(14, 21, 2, 1, emo === 'sleep' ? '#8a5a10' : '#fff0a0');   // лампа знизу
    return SPR[key] = cv;
  }

  // ---------- стан ----------
  const S = { x: null, y: 0, vx: 0, vy: 0, mode: 'go', job: null, tgt: null, t0: 0, n: 0, tl: -1, trail: [], roll: -99, hp: -99, wow: -99, drag: null, fx: [], sc: 1, charge: .6, wake: -99, bound: false, cells: null };
  const st = () => S.sc;

  function cellPt(E) { const A = E.A, pw = A.pane[2] - A.pane[0], ph = A.pane[3] - A.pane[1]; return { x: A.fc[0] + pw * .08, y: A.pane[1] - ph * .36, E }; }
  let DSL = null, DDV = null;
  /** Нахил цегляних рядів біля точки x — із задньої стінки найближчої соти (як у objects/decor_tag.js). */
  function wallSlope(x) {
    const items = NX.decor && NX.decor.items, kit = NX.arc && NX.arc.kit, proj = NX.px3d && NX.px3d.proj; if (!items || !kit || !proj) return 0; let best = 0, bd = 1e9;
    for (const B of items) { if (B.st !== 'dc_hex') continue; const { P } = kit.basis(B), Yc = (B.yt + B.yb) / 2, a = proj(P(-B.w / 2, B.dep, Yc)), b = proj(P(B.w / 2, B.dep, Yc)), d = Math.abs((a[0] + b[0]) / 2 - x);
      if (d < bd) { bd = d; let an = Math.atan2(b[1] - a[1], b[0] - a[0]); if (an > Math.PI / 2) an -= Math.PI; if (an < -Math.PI / 2) an += Math.PI; best = an; } }
    return best;
  }
  /** Куди на екрані йде «вглиб до стіни» біля точки x: вектор на 1 од. глибини — з найближчої соти (перед d = 0, стіна d = dep). */
  function wallDepth(x) {
    const items = NX.decor && NX.decor.items, kit = NX.arc && NX.arc.kit, proj = NX.px3d && NX.px3d.proj; if (!items || !kit || !proj) return [-.6, .1]; let best = [-.6, .1], bd = 1e9;
    for (const B of items) { if (B.st !== 'dc_hex') continue; const { P } = kit.basis(B), Yc = (B.yt + B.yb) / 2, a = proj(P(0, 0, Yc)), b = proj(P(0, B.dep, Yc)), d = Math.abs(a[0] - x); if (d < bd) { bd = d; best = [(b[0] - a[0]) / B.dep, (b[1] - a[1]) / B.dep]; } }
    return best;
  }
  function dockPt() { const E = S.cells.find(q => q.kind === 'flask') || S.cells[0], A = E.A, ph = A.pane[3] - A.pane[1]; return { x: A.fc[0] - (A.pane[2] - A.pane[0]) * .3, y: A.pane[1] - ph * 1.38 }; }   // (13.11) вище й лівіше — на вільній цеглі над сотами
  /** Наступна справа: сота зі своєю дією; кожна 4-та — полив ліани; кожна 7-ма — на док заряджатися; уночі — спати на доку. */
  function next(t, nt) {
    const n = S.n++; if (nt > .78 && t - S.wake > 25) { const d = dockPt(); return { kind: 'sleep', x: d.x, y: d.y, dur: 1e9 }; }
    if (n % 7 === 6) { const d = dockPt(); return { kind: 'dock', x: d.x, y: d.y, dur: 7 }; }
    const VS = NX.decorVines && NX.decorVines.spots ? NX.decorVines.spots() : [];
    if (n % 4 === 3 && VS.length) { const k = (n >> 2) % VS.length, v = VS[k]; return { kind: 'water', x: v.x + 3 * st(), y: v.y - 5 * st(), dur: 3.4, vine: k, vx: v.x, vy: v.y }; }
    const E = S.cells[ORDER[n % ORDER.length] % S.cells.length], p = cellPt(E); return { kind: JOBS[Math.floor(hash(n, 7) * JOBS.length)], x: p.x, y: p.y, dur: 3.3, E };
  }

  // ---------- керування: палець / миша на дроні ----------
  function bind() {
    const cv = NX.loop && NX.loop.canvas; if (S.bound || !cv || !NX.cam) return; S.bound = true;
    const room = e => NX.cam.toRoom(e.clientX, e.clientY), near = (x, y) => S.x != null && Math.hypot(x - S.x, y - S.y) < Math.max(8 * st(), 24 / NX.cam.k);
    cv.addEventListener('pointerdown', e => { if (S.drag || (NX.cards && NX.cards.on)) return; const [x, y] = room(e); if (!near(x, y)) return;
      e.stopImmediatePropagation(); e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch (err) {}
      S.drag = { id: e.pointerId, x, y, sx: e.clientX, sy: e.clientY, moved: false, t0: NX.time }; S.wow = NX.time; S.wake = NX.time; }, true);
    cv.addEventListener('pointermove', e => { const d = S.drag; if (!d || e.pointerId !== d.id) return; e.stopImmediatePropagation();
      if (Math.hypot(e.clientX - d.sx, e.clientY - d.sy) > 7) d.moved = true; const [x, y] = room(e), C = NX.cfg; d.x = Math.max(C.ROOM_X0 + 6, Math.min(C.ROOM_X1 - 6, x)); d.y = Math.max(6, Math.min(C.FLOOR_Y - 10, y)); }, true);
    const up = e => { const d = S.drag; if (!d || e.pointerId !== d.id) return; e.stopImmediatePropagation(); S.drag = null;
      if (!d.moved && e.type === 'pointerup') { S.roll = NX.time; S.hp = NX.time; if (NX.decorGuide && NX.decorGuide.showBot) NX.decorGuide.showBot(); }   // короткий тап: «бочка», радіє, картка
      else S.hp = NX.time; S.job = null; S.mode = 'go'; };
    cv.addEventListener('pointerup', up, true); cv.addEventListener('pointercancel', up, true);
  }

  // ---------- крок ----------
  function step(t, nt) {
    const dt = Math.min(.05, Math.max(0, S.tl < 0 ? 0 : t - S.tl)); S.tl = t; if (!dt) return;
    let tx, ty, k = 13, dm = 6.2;
    if (S.drag) { tx = S.drag.x; ty = S.drag.y - 4 * st(); k = 34; dm = 9.5; }
    else { if (!S.job) { S.job = next(t, nt); S.mode = 'go'; }
      const J = S.job; tx = J.x; ty = J.y;
      if (S.mode === 'do') { const u = (t - S.t0) / J.dur;
        if (J.kind === 'wipe') tx = J.x + Math.sin(u * TAU * 2) * (J.E.A.pane[2] - J.E.A.pane[0]) * .3;
        if (J.kind === 'fix' && !J.hit && u > .5) { J.hit = 1; const TP = NX.decorLive && NX.decorLive.TP; if (TP) TP.hex[J.E.on] = t; S.hp = t; }
        if (J.kind === 'water' && !J.hit && u > .25) { J.hit = 1; if (NX.decorVines.water) NX.decorVines.water(J.vine, t); }
        if (J.kind === 'blow' && Math.random() < dt * 9) S.fx.push({ x: S.x + (Math.random() - .5) * 4, y: S.y + 5 * st(), vx: (Math.random() - .5) * 14, vy: 6 + Math.random() * 8, t0: t, life: .9, col: Math.random() < .5 ? '#ffffff' : '#d8c0ff' });
        if (J.kind === 'water' && u > .2 && u < .85 && Math.random() < dt * 22) S.fx.push({ x: S.x - 2 * st(), y: S.y + 4 * st(), vx: (J.vx - S.x) * 1.4 + (Math.random() - .5) * 6, vy: 8 + Math.random() * 8, t0: t, life: .8, col: Math.random() < .6 ? '#9af6ff' : '#eaffff' });
        if (J.kind === 'dock') S.charge = Math.min(1, S.charge + dt / 6);
        if (J.kind === 'sleep' && (nt < .7 || t - S.wake < 25)) u >= 0 && (S.job = null);
        else if (u >= 1) S.job = null;
      } else if (Math.hypot(tx - S.x, ty - S.y) < 1.4 * st() && Math.hypot(S.vx, S.vy) < 5) { S.mode = 'do'; S.t0 = t; }
      if (J.kind !== 'dock' && J.kind !== 'sleep') S.charge = Math.max(.12, S.charge - dt / 90);
    }
    const ax = (tx - S.x) * k - S.vx * dm, ay = (ty - S.y) * k - S.vy * dm; S.vx += ax * dt; S.vy += ay * dt;
    const sp = Math.hypot(S.vx, S.vy), mx = S.drag ? 260 : 70; if (sp > mx) { S.vx *= mx / sp; S.vy *= mx / sp; }
    S.x += S.vx * dt; S.y += S.vy * dt;
    if (sp > 22) S.trail.push({ x: S.x, y: S.y + 2 * st(), t0: t }); S.trail = S.trail.filter(p => t - p.t0 < .45); S.fx = S.fx.filter(p => t - p.t0 < p.life);
  }
  const emoOf = t => { if (t - S.wow < .35) return 'wow'; if (S.drag || t - S.hp < 1.3) return 'happy'; const J = S.job; if (J && S.mode === 'do') { if (J.kind === 'sleep') return 'sleep'; if (J.kind === 'dock') return (t % 2.2) < 1.1 ? 'blink' : 'idle'; return 'work'; } return (t % 3.9) < .13 ? 'blink' : 'idle'; };

  function draw(c, t, nt, cells, vx0, vx1, glow) {
    if (!cells || cells.length < 2) return; S.cells = cells; S.sc = cells[0].A.s; bind();
    if (S.x == null) { const d = dockPt(); S.x = d.x; S.y = d.y; }
    step(t, nt);
    const s = st(), w = 13 * s, h = w * H / W, g = glow('#3be8ff'), J = S.job, doing = !S.drag && J && S.mode === 'do', u = doing ? Math.min(1, (t - S.t0) / J.dur) : 0;
    c.save(); c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
    { // ДОК-СТАНЦІЯ (13.11, власник: «змісти трохи установку для дрона та зроби її краще, більш продвинутіше»): вище й лівіше — на вільній
      // цеглі над сотами, нічого не перекриває. Настінна плита з кронштейном-фермою, широкий майданчик зі скошеними краями й неоновою
      // кромкою, «біжучі» посадкові вогні (при заході дрона — збігаються до центру), шкала заряду з 6 поділок, бічний міні-екран із
      // відсотком заряду, щогла-антена з маячком, кабель у стіну з імпульсами; під час зарядки — кільця поля, що підіймаються, іскри
      // на контактах і зелене сяйво; коли дрон летить на док — посадковий промінь-конус.
      const d = dockPt(), px = d.x, py = d.y + h * .52, on = J && (J.kind === 'dock' || J.kind === 'sleep') && S.mode === 'do' && !S.drag, coming = J && (J.kind === 'dock' || J.kind === 'sleep') && S.mode !== 'do' && !S.drag;
      if (px > vx0 - 24 && px < vx1 + 24) { const R = (x, y, ww, hh, col) => { c.fillStyle = col; c.fillRect(px + x * s, py + y * s, ww * s, hh * s); }, CY = '#3be8ff', GR = '#3bff8a', seg = Math.round(S.charge * 6);
        const Q = (pts, col) => { c.fillStyle = col; c.beginPath(); pts.forEach(([x, y], k) => k ? c.lineTo(px + x * s, py + y * s) : c.moveTo(px + x * s, py + y * s)); c.closePath(); c.fill(); };
        // (13.11, власник: «трохи меншою та в перспективі, трохи як соти; ще трохи покращ графічно») уся станція — ×.8 і зі зсувом уздовж
        // цегляних рядів (нахил стіни біля неї — із задньої стінки найближчої соти, як у графіті-тегу); майданчик і екран — об'ємні
        // плити: видно спід і торець, що йдуть углиб до стіни (у бік точки сходу) — як коробки сот.
        if (DSL == null) { DSL = wallSlope(px); DDV = wallDepth(px); }
        // (13.11, власник: «неправильна перспектива, не в ту сторону») глибина — туди ж, куди в сот: стіна ЛІВОРУЧ від переду (вектор із
        // найближчої соти, 4.5 од. глибини), а не праворуч; DX, DY — зсув задньої грані в координатах станції (після нахилу й ×.8)
        // (13.11, власник: «ще трохи меншою та ще більш прикольною») масштаб .8 → .66 (K); прикольне — нижче: тарілка-радар, що крутиться,
        // гірлянда різнокольорових лампочок під плитою, голограма дрона над майданчиком, поки він у справах, і рука-щіточка, що
        // натирає його до блиску під час зарядки.
        const K = .66, DX = DDV[0] * 4.5 / K / s, DY = DDV[1] * 4.5 / K / s - Math.tan(DSL) * DX, away = !on && !coming;
        c.save(); c.translate(px, py); c.transform(K, K * Math.tan(DSL), 0, K, 0, 0); c.translate(-px, -py);
        c.globalCompositeOperation = 'source-over'; c.globalAlpha = .28; R(-8, 3.6, 17.5, 1.4, '#05020f'); c.globalAlpha = 1;                                      // тінь на цеглі
        c.save(); c.translate(DX * s, DY * s);                                                                                                      // плита з кабелем — на стіні (вглиб)
        // кабель у стіну з імпульсом
        R(-.45, 7.6, .9, 2, O); R(-.2, 7.6, .4, 1.8, '#2a2a48'); R(-1.1, 9.2, 2.2, 1.1, O); R(-.7, 9.4, 1.4, .6, '#5a5a86'); { const f = (t * .9) % 1; R(-.2, 7.6 + f * 1.4, .4, .5, on ? GR : CY); }
        // настінна плита й кронштейн-ферма
        R(-2.8, 2.6, 5.6, 5.4, O); R(-2.3, 3, 4.6, 4.6, '#34345c'); R(-2.3, 3, 4.6, .5, '#6a6aa8'); R(-1.7, 3.9, .6, .6, '#9a9ac4'); R(1.1, 3.9, .6, .6, '#9a9ac4'); R(-1.7, 6.4, .6, .6, '#9a9ac4'); R(1.1, 6.4, .6, .6, '#9a9ac4');
        R(-.6, 4.6, 1.2, 1.4, on ? GR : (t % 1.6) < .8 ? CY : '#1a6a8a');                                                                                               // вічко стану
        c.restore();
        c.lineCap = 'butt'; for (const sd of [-1, 1]) { c.strokeStyle = O; c.lineWidth = 1.5 * s; c.beginPath(); c.moveTo(px + sd * 7.4 * s, py + 2.2 * s); c.lineTo(px + (sd * 2.2 + DX) * s, py + (6.6 + DY) * s); c.stroke();
          c.strokeStyle = '#5a5a86'; c.lineWidth = .7 * s; c.beginPath(); c.moveTo(px + sd * 7.4 * s, py + 2.2 * s); c.lineTo(px + (sd * 2.2 + DX) * s, py + (6.6 + DY) * s); c.stroke(); }
        // майданчик: скошені краї, світла кромка, неон знизу
        Q([[-10.2, -.7], [10.2, -.7], [10.2, 3], [10.2 + DX, 3 + DY], [-10.2 + DX, 3 + DY], [-10.2 + DX, -.7 + DY]], O);                                            // контур плити з глибиною
        Q([[-9.4, 2.4], [9.4, 2.4], [9.4 + DX, 2.4 + DY], [-9.4 + DX, 2.4 + DY]], '#17172e'); Q([[-9.4, 0], [-9.4 + DX, DY], [-9.4 + DX, 2.4 + DY], [-9.4, 2.4]], '#3e3e6e');   // спід і торець
        for (let q = 0; q < 4; q++) Q([[-7 + q * 4.6, 2.4], [-5.6 + q * 4.6, 2.4], [-5.6 + q * 4.6 + DX, 2.4 + DY], [-7 + q * 4.6 + DX, 2.4 + DY]], '#24244a');            // ребра жорсткості на споді
        R(-9.4, 0, 18.8, 1, '#6a6a9c'); R(-9.4, 0, 18.8, .35, '#d4d4f4'); R(-9.4, .35, 18.8, .2, '#8a8abc'); R(-9.4, 1, 18.8, 1.4, '#26264a'); R(-9.4, 1, 18.8, .25, '#3a3a66');
        for (let q = 0; q < 3; q++) { R(-9.4 + q * .9, 1.25, .45, 1.15, '#ffd23a'); R(8.95 - q * .9, 1.25, .45, 1.15, '#ffd23a'); }                                        // жовті смуги безпеки на краях
        R(-6.1, 1.2, .3, .3, '#9a9ac4'); R(5.8, 1.2, .3, .3, '#9a9ac4');                                                                                                    // заклепки
        c.globalAlpha = .6 + .4 * Math.sin(t * 3); R(-8.6, 2.45, 17.2, .3, on ? GR : CY); c.globalAlpha = 1;
        // біжучі посадкові вогні (7): у спокої — хвиля, при заході — збігаються до центру, на зарядці — всі зелені
        for (let q = 0; q < 7; q++) { const dq = Math.abs(q - 3), lit = on ? 1 : coming ? (Math.floor(t * 7) % 4 === 3 - dq) : (Math.floor(t * 2.5) % 7 === q); R(-8.2 + q * 2.6, .1, .9, .5, lit ? (on ? GR : '#eaffff') : '#1a4a6a'); }
        // шкала заряду
        for (let q = 0; q < 6; q++) R(-5.3 + q * 1.8, 1.35, 1.4, .65, q < seg ? (on && q === seg - 1 && (t % .7) < .35 ? '#eaffea' : seg <= 1 ? '#ff6a5a' : GR) : '#14301e');
        // щогла-антена з маячком
        R(-9.9, -6.2, 1.1, 6, O); R(-9.6, -6, .5, 5.8, '#7a7aa8'); R(-10.6, -3.4, 2.5, .9, O); R(-10.3, -3.2, 1.9, .45, '#5a5a86'); R(-10.05, -7.3, 1.4, 1.4, O); R(-9.8, -7.05, .9, .9, (t % 1.4) < .18 ? '#ffffff' : (t % 1.4) < .7 ? '#ff4f6a' : '#6a1a2a');
        { const rw = 3 * Math.abs(Math.cos(t * 1.8)) + .5, lit = Math.cos(t * 1.8) > 0; R(-9.35 - rw / 2 - .25, -5.35, rw + .5, 1.5, O); R(-9.35 - rw / 2, -5.1, rw, 1, lit ? '#d4d4f4' : '#6a6a9c'); R(-9.6, -4.9, .5, .5, '#3be8ff'); }   // тарілка-радар крутиться
        for (let q = 0; q < 7; q++) { const f = (q + .5) / 7, gx = -8 + 16 * f + DX * .5, gy = 3.3 + DY * .5 + Math.sin(f * Math.PI) * 2.2 + Math.sin(t * 1.5 + q) * .12, col = ['#ff4f6a', '#ffd23a', '#3bff8a', '#3be8ff', '#c77dff'][q % 5], lit = (Math.floor(t * 2) + q) % 2 === 0;
          if (q < 6) { const f2 = (q + 1.5) / 7; c.strokeStyle = O; c.lineWidth = .3 * s; c.beginPath(); c.moveTo(px + gx * s, py + (gy - .2) * s); c.lineTo(px + (-8 + 16 * f2 + DX * .5) * s, py + (3.1 + DY * .5 + Math.sin(f2 * Math.PI) * 2.2) * s); c.stroke(); }
          R(gx - .55, gy - .15, 1.1, 1.3, O); R(gx - .35, gy + .05, .7, .9, lit ? col : '#3a3a5a'); if (lit) { c.globalAlpha = .35; R(gx - .9, gy - .4, 1.8, 1.8, col); c.globalAlpha = 1; } }   // гірлянда під плитою
        // бічний міні-екран із відсотком заряду
        R(10.2, .6, 1.6, .7, O); Q([[11.2, -4.4], [18.6, -4.4], [18.6, 1.2], [18.6 + DX * .5, 1.2 + DY * .5], [11.2 + DX * .5, 1.2 + DY * .5], [11.2 + DX * .5, -4.4 + DY * .5]], O);
        Q([[11.6, -4], [11.6 + DX * .5, -4 + DY * .5], [11.6 + DX * .5, .8 + DY * .5], [11.6, .8]], '#2a2a54'); Q([[11.6, .8], [18.2, .8], [18.2 + DX * .5, .8 + DY * .5], [11.6 + DX * .5, .8 + DY * .5]], '#141432'); R(11.6, -4, 6.6, 4.8, '#06163c'); R(11.6, -4, 6.6, .4, '#1a5a8a');
        c.globalAlpha = .12; for (let q = 0; q < 6; q++) R(11.6, -3.4 + q * .75, 6.6, .25, CY); c.globalAlpha = .9;                                                          // рядки розгортки
        for (let q = 0; q < 5; q++) { const v = .4 + 1 * (.5 + .5 * Math.sin(t * 2.2 + q * 1.3)); R(12.2 + q * 1.15, -2.2 - v + 1, .7, v, on ? GR : '#1a8ab4'); }          // міні-графік струму
        NX.px.text(c, Math.round(S.charge * 100) + '%', px + 14.9 * s, py - .1 * s, on ? GR : CY, 1.7 * s, 'center'); c.globalAlpha = 1; R(12.1, .2, 5.6 * S.charge, .35, on ? GR : CY);
        c.globalCompositeOperation = 'lighter';
        { const gc = glow(on ? '#3bff8a' : '#3be8ff').cv; c.globalAlpha = .16 + .06 * Math.sin(t * 3); c.drawImage(gc, px - 11 * s, py + .5 * s, 22 * s, 7 * s);         // світло неону на цеглу під плитою
          c.globalAlpha = .22; c.drawImage(gc, px + 10.5 * s, py - 5.5 * s, 9 * s, 8 * s); if ((t % 1.4) < .7) { c.globalAlpha = .5; c.drawImage(glow('#ff4f6a').cv, px - 12.3 * s, py - 9.4 * s, 6 * s, 6 * s); } }   // екран і маячок
        if (away) { const bob = Math.sin(t * 2) * .5, fl = (.32 + .12 * Math.sin(t * 11)) * (hash(Math.floor(t * 8), 9) > .93 ? .3 : 1), hy = -8.2 + bob;                    // голограма дрона: «я у справах»
          const g = c.createLinearGradient(0, py, 0, py - 9 * s); g.addColorStop(0, 'rgba(60,232,255,.22)'); g.addColorStop(1, 'rgba(60,232,255,0)'); c.fillStyle = g; c.globalAlpha = 1;
          c.beginPath(); c.moveTo(px - 1.2 * s, py); c.lineTo(px + 1.2 * s, py); c.lineTo(px + 4.6 * s, py - 9 * s); c.lineTo(px - 4.6 * s, py - 9 * s); c.closePath(); c.fill();
          c.globalAlpha = fl; R(-2.6, hy, 5.2, .35, CY); R(-2.6, hy + 3.6, 5.2, .35, CY); R(-2.6, hy, .35, 3.9, CY); R(2.25, hy, .35, 3.9, CY);                                  // корпус-контур
          R(-1.5, hy + 1.3, .9, .9, '#eaffff'); R(.6, hy + 1.3, .9, .9, '#eaffff'); R(-.2, hy - 1.2, .4, 1.2, CY); { const pw = 3.4 * Math.abs(Math.cos(t * 9)) + .6; R(-pw, hy - 1.5, pw * 2, .35, CY); }   // очі, щогла, гвинт
          R(-3.5, hy + 1.2, .9, 1.4, CY); R(2.6, hy + 1.2, .9, 1.4, CY); c.globalAlpha = fl * .5; for (let q = 0; q < 3; q++) R(-2.2, hy + .8 + q * 1.1 + ((t * 1.5) % 1.1) * 0, 4.4, .2, CY); }
        if (on) { const sw = Math.sin(t * 5), jx = 9.2, jy = -5.2 + .4 * Math.sin(t * 2.5), tx2 = 5.6 + sw * 1.1, ty2 = -7.4 + .5 * Math.cos(t * 5);                              // рука-щіточка натирає дрона
          c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.lineCap = 'round';
          for (const [lw, col] of [[1.3, O], [.6, '#9a9ac4']]) { c.strokeStyle = col; c.lineWidth = lw * s; c.beginPath(); c.moveTo(px + 8.6 * s, py - .2 * s); c.lineTo(px + jx * s, py + jy * s); c.lineTo(px + tx2 * s, py + ty2 * s); c.stroke(); }
          R(jx - .6, jy - .6, 1.2, 1.2, O); R(jx - .35, jy - .35, .7, .7, '#ffd23a'); R(tx2 - 1.3, ty2 - .9, 1.5, 1.8, O); R(tx2 - 1.1, ty2 - .7, 1.1, 1.4, '#ff8ad8');                 // суглоб і губка
          c.globalCompositeOperation = 'lighter'; for (let q = 0; q < 3; q++) { const f = (t * 1.4 + q / 3) % 1; c.globalAlpha = 1 - f; const sx2 = tx2 - 1.6 - f * 1.6 + hash(q, 3) * 1.2, sy2 = ty2 - 1.2 + (hash(q, 5) - .5) * 2.4; R(sx2 - .15, sy2 - .5, .3, 1, '#ffffff'); R(sx2 - .5, sy2 - .15, 1, .3, '#ffffff'); } }   // блискітки
        if (coming) { const g = c.createLinearGradient(0, py, 0, py - 22 * s); g.addColorStop(0, 'rgba(60,232,255,.28)'); g.addColorStop(1, 'rgba(60,232,255,0)'); c.fillStyle = g;        // посадковий промінь
          c.beginPath(); c.moveTo(px - 7 * s, py); c.lineTo(px + 7 * s, py); c.lineTo(px + 11 * s, py - 22 * s); c.lineTo(px - 11 * s, py - 22 * s); c.closePath(); c.fill(); }
        if (on) { c.globalAlpha = .3 + .12 * Math.sin(t * 4); c.drawImage(glow('#3bff8a').cv, px - 9 * s, py - 7 * s, 18 * s, 13 * s);
          c.strokeStyle = GR; c.lineWidth = .35 * s; for (let q = 0; q < 3; q++) { const f = (t * .55 + q / 3) % 1; c.globalAlpha = .7 * (1 - f); c.beginPath(); c.ellipse(px, py - .4 * s - f * 9 * s, (7.5 - f * 2.5) * s, (1.5 - f * .5) * s, 0, 0, TAU); c.stroke(); }   // кільця поля
          for (const sd of [-1, 1]) if (hash(Math.floor(t * 14), sd + 2) > .55) { c.globalAlpha = .9; c.fillStyle = '#eaffea'; c.fillRect(px + sd * (4 + 2 * hash(Math.floor(t * 14), 5)) * s, py - (.4 + 1.2 * hash(Math.floor(t * 14), 7)) * s, .5 * s, .5 * s); } }   // іскри на контактах
        c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.restore(); } }
    S.top = { t, vx0, vx1, glow };                                                                                    // сам дрон малюється у верхньому шарі (top) — поверх зон, Nexi й усього в кімнаті
    if (S.x > vx0 - 30 && S.x < vx1 + 30 && S.y < 150) {                                                                // тінь — лише коли він біля стіни
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = .22; c.fillStyle = '#05020f'; c.beginPath(); c.ellipse(S.x + 2.6 * s, S.y + 4.2 * s, w * .34, h * .16, 0, 0, TAU); c.fill();           // тінь на цеглі
    }
    c.restore();
  }
  // (13.11, власник: «дрон має літати поверх всього») ВЕРХНІЙ ШАР: шлейф, інструменти, порошинки, сяйво й сам дрон малюються після
  // всіх об'єктів і персонажів (шар з y 1e6 у core/loop.js) — зони, голо-панелі, маніпулятор і Nexi його більше не закривають.
  // Док-станція й тінь на цеглі лишаються на стіні (draw). Кадр без draw (ліве крило за екраном, перевірка декору) — нічого не малюємо.
  function top(c, t) {
    const P = S.top; if (!P || P.t !== t || S.x == null) return; const { vx0, vx1, glow } = P;
    const s = st(), w = 13 * s, h = w * H / W, g = glow('#3be8ff'), J = S.job, doing = !S.drag && J && S.mode === 'do', u = doing ? Math.min(1, (t - S.t0) / J.dur) : 0;
    c.save(); c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
    if (S.x > vx0 - 30 && S.x < vx1 + 30) {
      c.globalCompositeOperation = 'lighter'; for (const p of S.trail) { const f = (t - p.t0) / .45; c.globalAlpha = .5 * (1 - f); c.fillStyle = '#3be8ff'; c.fillRect(p.x - .5 * s, p.y - .5 * s, s, s); }   // шлейф
      c.globalCompositeOperation = 'source-over';
      if (doing && J.E) { const A = J.E.A, ax = A.fl[0], ay0 = A.fl[1] - A.h, ay1 = A.fl[1];
        if (J.kind === 'scan') { const yy = ay0 + (ay1 - ay0) * (.5 + .5 * Math.sin(u * TAU * 2 - Math.PI / 2)); c.globalCompositeOperation = 'lighter'; c.globalAlpha = .2; c.fillStyle = '#3be8ff'; c.beginPath(); c.moveTo(S.x - .5, S.y + h * .42); c.lineTo(S.x + .5, S.y + h * .42); c.lineTo(ax + A.w * .5, yy); c.lineTo(ax - A.w * .5, yy); c.closePath(); c.fill();
          c.globalAlpha = .9; c.fillStyle = '#9af6ff'; c.fillRect(ax - A.w * .5, yy - .25, A.w, .5); c.globalAlpha = .45; c.drawImage(g.cv, ax - A.w * .6, yy - A.w * .6, A.w * 1.2, A.w * 1.2); }
        if (J.kind === 'wipe') { const by = A.pane[1] + (A.pane[3] - A.pane[1]) * (.25 + .5 * u); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.strokeStyle = '#9a9ac4'; c.lineWidth = .7 * s; c.beginPath(); c.moveTo(S.x, S.y + h * .4); c.lineTo(S.x, by); c.stroke();   // ручка зі щіточкою
          c.fillStyle = '#ffd27a'; c.fillRect(S.x - 2.2 * s, by - .6 * s, 4.4 * s, 1.4 * s); c.fillStyle = '#fff0a0'; c.fillRect(S.x - 2.2 * s, by - .6 * s, 4.4 * s, .5 * s);
          c.globalCompositeOperation = 'lighter'; for (let q = 0; q < 4; q++) { const f = (t * 1.6 + q * .25) % 1; c.globalAlpha = 1 - f; c.fillStyle = '#ffffff'; c.fillRect(S.x + (hash(q, Math.floor(t * 1.6 + q * .25)) - .5) * 7 * s, by - (hash(q, 3) - .3) * 5 * s, .8 * s, .8 * s); } }
        if (J.kind === 'fix') { const e = Math.sin(Math.min(1, u * 2) * Math.PI / 2) * (u > .75 ? (1 - u) * 4 : 1), hy = S.y + h * .4 + (ay0 + A.h * .15 - S.y - h * .4) * e; c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.strokeStyle = '#9a9ac4'; c.lineWidth = .7 * s; c.beginPath(); c.moveTo(S.x - 1.5 * s, S.y + h * .4); c.lineTo(ax, hy); c.stroke();
          c.fillStyle = '#3be8ff'; c.fillRect(ax - 1.2 * s, hy - .5 * s, .9 * s, 1.6 * s); c.fillRect(ax + .3 * s, hy - .5 * s, .9 * s, 1.6 * s); } }
      c.globalCompositeOperation = 'lighter'; for (const p of S.fx) { const f = (t - p.t0) / p.life; c.globalAlpha = 1 - f; c.fillStyle = p.col; c.fillRect(p.x + p.vx * (t - p.t0) - .4 * s, p.y + p.vy * (t - p.t0) - .4 * s, .8 * s, .8 * s); }   // порошинки / туманець
      const asleep = doing && J.kind === 'sleep'; c.globalAlpha = (asleep ? .1 : .26) + .08 * Math.sin(t * 5); c.drawImage(g.cv, S.x - w * .6, S.y - w * .2, w * 1.2, w * 1.2);                       // сяйво лампи
      const rl = t - S.roll, roll = rl >= 0 && rl < .6 ? rl / .6 * TAU : 0, tilt = Math.max(-.38, Math.min(.38, S.vx * .011)) + roll + (doing && (J.kind === 'dock' || J.kind === 'sleep') ? (DSL || 0) * .7 : 0),   /* на доку стоїть уздовж нахиленого майданчика */ bob = (asleep ? .25 : .6) * s * Math.sin(t * (asleep ? 1.2 : 3.1));
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.translate(S.x, S.y + bob); c.rotate(tilt); c.drawImage(spr(emoOf(t), asleep ? 0 : Math.floor(t * 20) % 3), -w / 2, -h / 2, w, h); c.rotate(-tilt); c.translate(-S.x, -S.y - bob);
      if (asleep) { c.globalAlpha = .8; c.fillStyle = '#9af6ff'; for (let q = 0; q < 2; q++) { const f = (t * .5 + q * .5) % 1; c.globalAlpha = .8 * (1 - f); c.fillRect(S.x + (4 + f * 3) * s, S.y - (5 + f * 6) * s, (1 + q * .4) * s, .5 * s); } }   // «z-z»
    }
    c.restore();
  }

  NX.addObject({ id: 'decorDroneTop', layers(t) { return [{ y: 1e6, draw: c => top(c, t) }]; } });
  let PORT = null;
  NX.decorDrone = {
    draw, at: () => ({ x: S.x, y: S.y }), state: S,
    /** Портрет для картки: дрон ×3, гвинт крутиться, око блимає / радіє. */
    portrait(t) { if (!PORT) { PORT = document.createElement('canvas'); PORT.width = W * 3; PORT.height = H * 3; } const q = PORT.getContext('2d'); q.clearRect(0, 0, PORT.width, PORT.height); q.imageSmoothingEnabled = false;
      q.drawImage(spr((t % 5) < 1.4 ? 'happy' : (t % 3.9) < .13 ? 'blink' : 'idle', Math.floor(t * 20) % 3), 0, Math.round(Math.sin(t * 3) * 2), W * 3, H * 3); return PORT; },
  };
})();
