/* ============================================================================
 * actors/nexi/nexi.js — NEXI: СТАН, ЧЕРГА ДІЙ, МАЛЮВАННЯ В КІМНАТІ
 * ----------------------------------------------------------------------------
 * Nexi виконує ЧЕРГУ ДІЙ (queue). Кожна дія — простий об'єкт:
 *   {walk:[x,y]}  іти по підлозі (шляхом в обхід меблів — NX.room.route)   {fly:[x,y]}  летіти на ранці
 *   {hop:[x,y]}   застрибнути/зістрибнути {face:±1}    повернутись
 *   {loc:'..'}    де він зараз (для виходу) {do:fn}    виконати функцію
 *   {say:'..'}    сказати фразу           {wait:сек}   почекати
 *   {work:{pose,dur,obj,start,end}}       працювати в позі з прогресом
 *   {fade:{alpha,zoom,y,dur}}             зменшитись/зникнути (портал — коли повернеться)
 *   {tp:[x,y], kind}                       телепорт: тане зі спіном — з'являється в точці (переміщення до зон, 06.11 — TRAVEL)
 *   {walk, dash}  ривок (спринт зі слідом)  {fly, jet}  підліт на ранці дугою — теж TRAVEL
 *   {rot:градуси}                          лягти (поворот спрайта)
 * Сценарії (з якої дії складається "сісти на диван" тощо) — в activities.js.
 * Тут же автономне життя: якщо довго немає команд, Nexi сам щось робить.
 * ========================================================================== */
NX.nexi = {
  x: 768, y: 440, gy: 440, dir: 1, look: { ...DEFAULT_LOOK }, loc: 'dock',
  queue: [], cur: null, task: null, history: [], speak: null, talking: false,
  alpha: 1, zoom: 1, rot: 0, back: false, lastCmd: 0, mood: null, moodT: 0, temp: null, tempT: 0,
  catHungry: false, box: null, scr: document.createElement('canvas'),

  /* ---------------- КОМАНДИ ---------------- */
  /** Виконати сценарій з activities.js. byUser=false — це "вільний час". */
  do(id, byUser = true, opt = {}) {
    const A = NX.acts[id]; if (!A) return;
    this.taskOpt = opt.task || null;   // конкретна задача зони (ui/zones.js)
    if (byUser) { this.lastCmd = NX.time; NX.cam.toNexi(); }                        // команда користувача — камера знову на Nexi (і після гортання)
    this.finishTask(false);
    this.autoRun = !byUser;                                                           // сценарій знає, чи це вільний час (майстерня: без лабораторії скінів)
    this.endTp();
    this.queue = [...this.exitRoute(), ...this.travel(id, A.route(this))]; this.cur = null;
    this.task = { id, title: this.taskOpt ? NX.t(`zones.${id}.${this.taskOpt}.t`) : NX.t('act.' + id + '.title'), color: A.color || '#3be8ff', steps: NX.t('act.' + id + '.steps') || [], prog: 0, auto: !byUser };
  },
  /** Просто піти в точку підлоги (тап по підлозі). */
  /** Тап по підлозі. Кілька тапів поспіль (власник, 06.11: «просто нажав — іде, як завжди; декілька раз підряд — прискорюється до
   *  місця»): другий тап за 1.6 с — бігом, третій і далі — ривок зі слідом (hurry: 1 — хода / біг за довжиною, 2 — біг, 3+ — ривок). */
  walkTo(x, y) {
    const t = NX.time; this.lastCmd = t; this.hurry = t - (this.floorT || -9) < 1.6 ? (this.hurry || 1) + 1 : 1; this.floorT = t;
    NX.cam.unfocus(); this.finishTask(false); this.endTp(); const [cx, cy] = NX.room.clampWalk(x, y);
    this.queue = [...this.exitRoute(), { walk: [cx, cy], far: 'floor', hurry: this.hurry }, { loc: 'floor' }]; this.cur = null;
  },
  /* ---------------- ПЕРЕМІЩЕННЯ ДО ЗОН (06.11) ----------------
   * Власник: «зроби, щоб Nexi трохи швидше переміщався… спосіб переміщення швидшим до нової точки; до кожної зони — окремий
   * ефект переміщення, достатньо швидкий: десь пробіг, десь підлетів, десь телепортація». Перший крок сценарію зони ({walk})
   * стає способом цієї зони, якщо до неї далі за TRAVEL_MIN (зовсім поруч — просто підходить):
   *   dash — ривок (DASH_SPEED) з пилом: маркетинг — неонові швидкісні риски (гоночне крісло), інструменти — іскри з-під ніг;
   *   jet  — підліт на ранці дугою, удвічі з гаком швидше за звичайний політ: аналітика — жовтий слід, як лінія графіка;
   *   tp   — телепорт за 0,56 с (тане зі спіном — з'являється на місці): СКІНИ — рожеві промені сканера (лабораторія скінів
   *          відкривається швидше), AI-центр — розсипається на біти й збирається, портал (вечірка) — вихор.
   * Решта (диван, вікно, декор, вільний час) — звичайна хода, лише швидша (core/config.js); далекий тап по підлозі — ривок. */
  TRAVEL: { marketing: 'dash', tools: 'dash', analytics: 'jet', workshop: 'tp', ai: 'tp', party: 'tp' },
  TRAVEL_MIN: 90,
  travel(id, R) {
    const st = this.TRAVEL[id], i = st ? R.findIndex(s => s.walk) : -1; if (i < 0) return R;
    const to = R[i].walk; if (Math.hypot(to[0] - this.x, to[1] - this.y) < this.TRAVEL_MIN) return R;
    R[i] = st === 'tp' ? { tp: to, kind: id } : st === 'jet' ? { fly: to, jet: id } : { walk: to, dash: id };
    return R;
  },
  /** Нова команда посеред телепорту — Nexi одразу видно (інакше лишився б напівпрозорим). */
  endTp() { if (this.cur && this.cur.tp) { this.alpha = 1; this.zoom = 1; } },
  /** Частинки переміщень: телепорт (burst — сплеск на початку й у точці появи). */
  tpFx(a, x, y, burst) {
    const r = Math.random, F = NX.fx, s = NX.room.scaleAt(Math.max(y, 352)) / 1.45, H = 40 * s, k = a.kind;
    for (let i = 0, n = burst ? 16 : 2; i < n; i++) {
      if (k === 'ai') F.emit('bit', x + (r() - .5) * 24 * s, y - r() * H, { vx: (r() - .5) * 46, vy: -24 - r() * 56, col: r() < .6 ? '#3be8ff' : '#3bff8a', s: r() < .3 ? 2.5 : 1.5 });
      else if (k === 'party') F.list.push({ type: 'portal', x, y: y - H / 2, orbit: (12 + r() * 16) * s, cx: x, cy: y - H / 2, a0: r() * 6.3, age: 0, ttl: .7, s: 1.5, col: r() < .5 ? '#d94bff' : '#3be8ff', vx: 0, vy: 0 });
      else F.emit('energy', x + (r() - .5) * 26 * s, y - r() * H * .9, { vy: -60 - r() * 70, col: r() < .6 ? '#ff7af0' : '#ffffff', h: 4 + (r() * 5 | 0) });
    }
    if (burst) F.emit('ring', x, y, { col: { ai: '#3be8ff', party: '#d94bff' }[k] || '#ff7af0', r0: 4 * s, gr: 64 * s });
  },
  /** Слід ривка й підльоту: пил і риски (маркетинг), іскри (інструменти), жовтий слід (аналітика). */
  trailFx(kind) {
    const r = Math.random, F = NX.fx, s = NX.room.scaleAt(Math.max(this.depthY(), 352)) / 1.45, d = this.dir, bx = this.x - d * 8 * s;
    if (kind === 'analytics') { if (r() < .8) F.emit('trail', bx - d * r() * 6 * s, this.y - (6 + r() * 22) * s, { s: 2, ttl: .45, col: r() < .65 ? '#ffc94d' : '#fff3c2' }); return; }
    if (r() < .5) F.emit('dust', bx, this.y - 1, { vx: -d * (10 + r() * 24) });
    if (kind === 'tools') { if (r() < .6) F.emit('spark', this.x - d * 4 * s, this.y - 1, { vx: -d * (30 + r() * 70), vy: -20 - r() * 45 }); }
    else if (r() < (kind === 'floor' ? .35 : .75)) F.emit('line', bx - d * r() * 10 * s, this.y - (5 + r() * 24) * s, { w: Math.max(4, (6 + r() * 10) * s | 0), vx: -d * 30, col: kind === 'floor' ? 'rgba(255,255,255,.7)' : r() < .5 ? '#ff4fd8' : '#3be8ff' });
  },
  /** Як "вийти" з поточного місця (злізти з дивану, злетіти зі столу...). */
  exitRoute() {
    const P = NX.cfg.POI, up = { do: () => { this.rot = 0; this.back = false; } };
    const ch = NX.objects.mkChair, ws = NX.objects.workshop, ac = NX.objects.anChair, tl = NX.objects.tools, ai = NX.objects.aicenter;
    return ({                                                                         // місця зон: крісла маркетингу й аналітики, капсула майстерні, верстак інструментів
      sofaSit: [up, { hop: P.sofa.floor }], sofaStand: [{ hop: P.sofa.floor }], sofaLie: [up, { hop: P.sofa.floor }],
      mkChair: ch ? [{ do: () => ch.standUp() }, up, { hop: ch.side() }] : [],
      anChair: ac ? [{ do: () => ac.standUp() }, up, { hop: ac.side() }] : [],
      wsPad: ws ? [up, { do: () => ws.leave() }, { fly: ws.front() }] : [],
      tlHover: tl ? [up, { fly: tl.stand() }] : [],
      aiDesk: ai ? [up, { do: () => ai.finish() }, { fly: ai.front() }] : [],
      wallHover: [up, { fly: this.wallFloor || NX.room.clampWalk(this.x, 440, 'nexi') }],                    // (· 6) біля стіни на ранці — спершу вниз
      portalPad: [up, { do: () => { this.alpha = 1; this.zoom = 1; if (NX.party) NX.party.close(); if (NX.objects.portal) NX.objects.portal.active = false; } },   // (вечірка) з майданчика брами — вниз
        { hop: NX.room.clampWalk(...((NX.arc && NX.arc.zone && NX.arc.zone('portal')) ? NX.arc.zone('portal').S(100, 352, -30) : [this.x, 400]), 'nexi') }],
    }[this.loc] || []).concat([{ loc: 'floor' }, up]);
  },
  finishTask(done) {
    if (done && this.task && this.taskOpt && NX.ui.zones.has(this.task.id)) { NX.ui.zones.result(this.task.id, this.taskOpt, this.task.auto); this.taskOpt = null; } if (this.task && done) this.history.push({ title: this.task.title, color: this.task.color }); if (this.history.length > 8) this.history.shift(); if (done || !this.queue.length) this.task = null; NX.objects && Object.values(NX.objects).forEach(o => { if ('active' in o && !done) o.active = false; }); },
  say(text) { this.speak = { text, t: 0 }; NX.ui.hud.bubble(text); NX.ui.chat && NX.ui.chat.add('b', text); },
  emote(m, d = 2.5) { this.mood = m; this.moodT = NX.time + d; },
  /** ТАП ПО NEXI (ui/input.js). Власник, 02.11: «коли нажимаєш на Nexi, не має відкриватися панель зі скінами — це лише в
   *  майстерні» (зона тепер зветься СКІНИ). Тож Nexi обертається до тебе, махає, показує емоцію й каже коротку фразу (act.tap.*).
   *  Задачу не перериває: під час неї теж махає (поверх пози — layer), але каже, що доробляє; у кріслі маркетингу чи аналітики
   *  крісло на мить крутиться лицем до нас (mk_chair.js: peek). Кожне друге-третє привітання — підказка, що вигляд змінюють
   *  у зоні СКІНИ; у самій зоні — питає, як тобі вигляд; три тапи поспіль — «лоскотно!».
   *  Поки махає, нові тапи лише подовжують помах і підкидають його — без нових фраз (щоб не засипати чат). */
  hiT: 0, hiN: 0,
  hi() {
    const t = NX.time, busy = !!(this.cur || this.queue.length), ws = this.loc === 'wsPad' || NX.ui.skinlab.open, waving = t < this.hiT;
    this.lastCmd = t; this.taps = t - (this.tapT || -9) < 2.5 ? (this.taps || 0) + 1 : 1; this.tapT = t; this.hiT = t + 2.4;
    NX.nexiPhys.kick(this.taps === 3 ? 2.6 : 1.4);
    if (!busy) { this.back = false; this.temp = 'wave'; this.tempT = this.hiT; }              // вільний — повертається до нас насовсім
    const ch = { mkChair: NX.objects.mkChair, anChair: NX.objects.anChair }[this.loc]; if (ch && ch.peek) ch.peek(2.2);
    if (this.taps === 2 && this.look.hand && NX.objects.relics && NX.objects.relics.tap(this.look.hand, busy)) return;   // подвійний тап: здібність реліквії в руці (relics.js; зайнятий — лише ефект)
    if (this.taps === 3) { this.emote('happy', 2.4); this.say(NX.pick('act.tap.tickle')); return; }
    if (waving) return;
    const k = ws ? 'ws' : busy ? 'busy' : ++this.hiN % 3 === 2 ? 'skins' : 'hi';
    this.emote({ ws: 'love', busy: 'happy', skins: 'idea' }[k] || ['happy', 'love', 'cool', 'surprise'][Math.random() * 4 | 0], 2.4);
    this.say(NX.pick('act.tap.' + k));
  },
  /** Глибина для масштабу й порядку малювання: на дивані — dy (диван може стояти ближче до глядача, core/config.js SOFA),
   *  інакше — де стоїть. dy задають стрибки на диван ({hop, dy}); будь-яка хода чи зникнення його скидає. */
  dy: null,
  depthY() { return this.dy != null ? this.dy : this.y; },
  hitTest(x, y) { const b = this.box; return b && this.alpha > .3 && x > b[0] && x < b[0] + b[2] && y > b[1] && y < b[1] + b[3]; },

  /* ---------------- ВИКОНАННЯ ЧЕРГИ ---------------- */
  update(dt, t) {
    // Наступний крок черги починається в тому ж кадрі, де скінчився попередній, а миттєві ({face}, {loc}, {do}, {say}) ідуть
    // ланцюжком (С4, 06.11: на повільному телефоні кожна зміна кроку коштувала кадр ~0.2 с, а до лабораторії скінів їх вісім)
    for (let n = 0; n < 8; n++) {
      if (!this.cur && this.queue.length) { this.cur = this.queue.shift(); this.cur._t = 0; this.begin(this.cur); }
      if (!this.cur) break;
      const a = this.cur;
      a._t += n ? 0 : dt; if (this.step(a, n ? 0 : dt)) { this.end(a); this.cur = null; }
      if (this.cur) break;                                                   // крок скінчився — наступний починається в цьому ж кадрі
    }
    if (!this.cur && !this.queue.length && this.task) { this.finishTask(true); }
    if (this.speak) { this.speak.t += dt; this.talking = this.speak.t < this.speak.text.length / 40; if (this.speak.t > this.speak.text.length / 40 + 3.2) { this.speak = null; this.talking = false; NX.ui.hud.bubble(null); } }
    this.autolife(t);
    this.moodLife(t); this.decorLife(t);                                                 // (Декор стін · 25) зиркає на рибок, нюхає м'яту, здригається від мухоловки
    NX.nexiPhys.update(this, dt);
    if (!this.cur && !this.queue.length && !this.talking && t > (this.nextIdle || 0) && this.loc !== 'sofaLie' && !(NX.objects.relics && NX.objects.relics.busy())) {   /* поки показує реліквію — без «роззирається» */ this.nextIdle = t + 5 + Math.random() * 5; const a = ['look', 'stretch', 'stand', 'look'][Math.random() * 4 | 0]; if (a !== 'stand') { this.temp = a; this.tempT = t + 2.6; } }
    if (this.cur && (this.cur.fly || this.pose === 'fly' || (this.cur.work && /hover/.test(this.cur.work.pose))) && Math.random() < .7) NX.fx.emit('flame', this.x + (Math.random() < .5 ? -9 : 9) * NX.room.scaleAt(this.depthY()) / 1.45 * (this.dir), this.y + 2);
    if (this.fxNow && this.fxNow !== 'none' && this.alpha > .5) NX.fx.skin(this.fxNow, this.x, this.y, NX.room.scaleAt(Math.max(this.depthY(), 352)), !!(this.cur && this.cur.walk), this.dir);
  },
  begin(a) {
    if (a.walk) {                                                                     // шлях в обхід меблів (world/room.js: route)
      a.from = [this.x, this.y]; a.path = NX.room.route(a.from, a.walk); a.pi = 0;
      let L = 0, p = a.from; a.path.forEach(q => { L += Math.hypot(q[0] - p[0], q[1] - p[1]); p = q; }); a.run = L > NX.cfg.RUN_FROM;
      if (a.far && L > 650) a.dash = a.far;                                              // далекий тап по підлозі — ривок
      if (a.hurry >= 2) a.run = true; if (a.hurry >= 3 && L > 40) a.dash = a.far;         // тапи поспіль по підлозі — біг, далі ривок
    }
    if (a.tp) { a.from = [this.x, this.y]; this.dy = null; this.tpFx(a, this.x, this.y, true); }
    if (a.fly || a.hop) { a.from = [this.x, this.y]; const to = a.fly || a.hop, L = Math.hypot(to[0] - this.x, to[1] - this.y);
      a.dur = a.quick || (a.hop ? .45 : a.jet ? Math.max(.45, L / (NX.cfg.FLY_SPEED * 2.4)) : Math.max(.5, L / NX.cfg.FLY_SPEED));   // quick — задана тривалість (С4: зліт у капсулу) if (a.jet) a.arc = Math.min(70, 18 + L * .12);
      if (a.fly) for (let i = 0; i < 6; i++) NX.fx.emit('dust', this.x, this.y);
      if (a.dy !== undefined || this.dy != null) a.dz = [this.depthY(), a.dy !== undefined ? a.dy : to[1]]; }   // глибина на дивані: плавно (dy)
    if (a.face) this.dir = a.face;
    if (a.loc) this.loc = a.loc;
    if (a.do) a.do();
    if (a.say) this.say(a.say);
    if (a.rot !== undefined) this.rot = a.rot;
    if (a.fade) a.from = { alpha: this.alpha, zoom: this.zoom, y: this.y };
    if (a.work) { const w = a.work; if (w.back) this.back = true; if (w.obj) { NX.objects[w.obj].active = true; NX.objects[w.obj].prog = 0; } w.start && w.start(); }
  },
  step(a, dt) {
    if (a.walk) {
      this.dy = null;
      const [tx, ty] = a.path ? a.path[a.pi] : a.walk, dx = tx - this.x, dy = ty - this.y, d = Math.hypot(dx, dy), sp = (a.dash ? NX.cfg.DASH_SPEED : a.run ? NX.cfg.RUN_SPEED : NX.cfg.WALK_SPEED) * dt;
      this.pose = a.run || a.dash ? 'run' : 'walk'; if (Math.abs(dx) > 1) this.dir = Math.sign(dx);
      if (a.dash) this.trailFx(a.dash);
      if (d <= sp) { this.x = tx; this.y = ty; this.gy = ty; if (a.path && a.pi < a.path.length - 1) { a.pi++; return false; } return true; }   // кут обходу — далі до наступної точки
      this.x += dx / d * sp; this.y += dy / d * sp; this.gy = this.y; return false;
    }
    if (a.spin) { this.dir = Math.floor(a._t * 12) % 2 ? 1 : -1; this.pose = 'spin'; if (a._t >= a.spin) { this.dir = 1; return true; } return false; }
    if (a.tp) {                                                                         // телепорт: 0,28 с тане зі спіном — 0,28 с з'являється
      const T = .28, k = a._t; this.dy = null; this.pose = 'spin'; this.dir = Math.floor(k * 16) % 2 ? 1 : -1;
      if (k < T) { const q = k / T; this.alpha = 1 - q; this.zoom = 1 - .3 * q; this.tpFx(a, this.x, this.y, false); return false; }
      if (!a.moved) { a.moved = true; this.x = a.tp[0]; this.y = this.gy = a.tp[1]; const P = NX.nexiPhys; P.px = null; P.vx = P.vy = 0; this.tpFx(a, this.x, this.y, true); NX.cam.jump(this.x); }
      const q = Math.min(1, (k - T) / T); this.alpha = q; this.zoom = .7 + .3 * q;
      if (q < 1) { this.tpFx(a, this.x, this.y, false); return false; }
      this.alpha = 1; this.zoom = 1; this.dir = a.tp[0] >= a.from[0] ? 1 : -1; NX.nexiPhys.land(2.4); return true;
    }
    if (a.hop && a._t < .12) { this.pose = 'crouch'; return false; }                   // присід перед стрибком
    if (a.hop && !a.kicked) { a.kicked = true; NX.nexiPhys.kick(2.6); }
    if (a.fly || a.hop) {
      const to = a.fly || a.hop, k = Math.min(1, (a._t - (a.hop ? .12 : 0)) / a.dur);
      const e = a.hop ? k : (k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);   // плавний розгін/гальмування ранця
      this.x = NX.px.lerp(a.from[0], to[0], e); this.y = NX.px.lerp(a.from[1], to[1], e) - (a.hop ? Math.sin(k * Math.PI) * (a.hi || 14) : a.arc ? Math.sin(e * Math.PI) * a.arc : 0);
      if (a.arc) { this.gy = NX.px.lerp(a.from[1], to[1], e); this.trailFx(a.jet); }        // підліт дугою: тінь — по підлозі під ним
      if (a.dz) this.dy = k >= 1 ? (a.dy !== undefined ? a.dy : null) : NX.px.lerp(a.dz[0], a.dz[1], e);
      this.pose = a.hop ? 'hop' : 'fly'; if (Math.abs(to[0] - a.from[0]) > 2) this.dir = Math.sign(to[0] - a.from[0]);
      if (k >= 1) NX.nexiPhys.land(a.hop ? 3.2 : 2.2);
      return k >= 1;
    }
    if (a.wait) { this.pose = 'stand'; return a._t >= a.wait; }
    if (a.fade) { this.dy = null; const f = a.fade, k = Math.min(1, a._t / f.dur); if (f.spin) this.dir = Math.floor(a._t * 14) % 2 ? 1 : -1; this.alpha = NX.px.lerp(a.from.alpha, f.alpha, k); this.zoom = NX.px.lerp(a.from.zoom, f.zoom, k); if (f.y !== undefined) this.y = NX.px.lerp(a.from.y, f.y, k); this.pose = 'walk'; if (Math.random() < .6) NX.fx.list.push({ type: 'portal', x: this.x, y: this.y - 20, orbit: 26, cx: this.x, cy: this.y - 20, a0: Math.random() * 6.3, age: 0, ttl: .8, s: 1.5, col: Math.random() < .5 ? '#d94bff' : '#3be8ff', vx: 0, vy: 0 }); return k >= 1; }
    if (a.work) {
      const w = a.work; this.pose = w.pose; if (w.face) this.dir = w.face;
      const k = Math.min(1, a._t / w.dur); if (this.task) this.task.prog = k; if (w.obj) NX.objects[w.obj].prog = k;
      w.tick && w.tick(dt, k);
      return a._t >= w.dur;
    }
    return true;
  },
  end(a) { if (a.work) { const w = a.work; if (w.obj) { NX.objects[w.obj].active = false; NX.objects[w.obj].done = true; } w.end && w.end(); } },

  /* ---------------- ЕМОЦІЇ (ВИРАЗ ОБЛИЧЧЯ) ТА "ПОГОДА" ----------------
   * Обличчя Nexi обирає сам — у лабораторії скінів його немає (власник, 29.10: «він сам має показувати емоції, як забажає»):
   *  - кожні 4–10 с — нова емоція на 2–4 с, за настроєм хвилини: працює — зосереджений (serious), ідея, радість; іде —
   *    радість, «круто»; відпочиває — усе підряд (частіше радість), поруч кіт — любов; між емоціями — звичайний вираз;
   *  - події додають свої (emote: здивування в капсулі, любов з котом, радість після задачі…);
   *  - кожні 22–40 с над ним "трапляється погода" на 6–9 с: хмаринка з дощем (він сумує), сніг (радіє), іскри, аура…
   */
  FACE: { happy: 'happy', love: 'hearts', surprise: 'surprised', idea: 'think', sleepy: 'sleepy', sad: 'sad', angry: 'angry', cool: 'standard', focus: 'serious' },
  faceOf(m) { return this.FACE[m] || 'standard'; },
  fxNow: 'none', fxUntil: 0, nextFx: 14, nextMood: 3,
  moodLife(t) {
    if (this.mood && t >= this.moodT) this.mood = null;                                  // емоція минула (раніше не скидалась — і сама більше не з'являлась)
    if (t > this.nextMood && !this.mood && this.loc !== 'sofaLie') {
      const st = this.task ? 'work' : (this.cur && this.cur.walk) ? 'walk' : 'idle', catNear = Math.abs(NX.cat.x - this.x) < 70 && Math.abs(NX.cat.y - this.y) < 40;
      const W = { work: [['focus', 4], ['idea', 3], ['happy', 2], ['cool', 1.2], ['surprise', .6]], walk: [['happy', 4], ['cool', 2.5], ['idea', 1], ['love', 1], ['surprise', .6]],
        idle: [['happy', 3], ['cool', 2], ['idea', 2], ['love', 1.4], ['surprise', 1], ['sleepy', 1], ['sad', .5], ['angry', .3]] }[st].concat(catNear ? [['love', 4]] : []);
      let r = Math.random() * W.reduce((a, w) => a + w[1], 0), m = W[0][0]; for (const [k, w] of W) { if ((r -= w) <= 0) { m = k; break; } }
      this.emote(m, 2 + Math.random() * 2); this.nextMood = t + 4 + Math.random() * 6;
    }
    if (this.fxNow !== 'none' && t > this.fxUntil) this.fxNow = 'none';
    if (t > this.nextFx && this.fxNow === 'none') {
      this.nextFx = t + 22 + Math.random() * 18; const fx = ['rain', 'snow', 'sparks', 'aura', 'fire', 'water', 'neon', 'energy', 'trail', 'rain'][Math.random() * 10 | 0];
      this.fxNow = fx; this.fxUntil = t + 6 + Math.random() * 3;
      const react = { rain: 'sad', snow: 'happy', fire: 'surprise', sparks: 'love', aura: 'cool', water: 'happy', neon: 'cool', energy: 'idea' }[fx]; if (react) setTimeout(() => this.emote(react, 2.5), 400);
    }
  },
  /* ---------------- (Декор стін · 25) РЕАКЦІЇ НА ДЕКОР ----------------
   * Проходячи чи стоячи без діла біля декору стін, Nexi реагує сам: риф і медузарій — обертається до стіни (back) і милується, під
   * теплицею — нюхає м'яту, мухоловка клацнула поруч — здригається, біля сховища насіння — задоволений. Репліки — act.decorReact.*
   * (4 мови), не частіше ніж раз на 20 с, одна й та сама річ — раз на 90 с. Під час задач, вечірки й на дивані — ні. */
  decorLife(t) {
    if (this.backUntil && t > this.backUntil) { this.back = false; this.backUntil = 0; }
    const DC = NX.decor; if (!DC || !DC.MK || this.loc === 'sofaLie' || this.talking || (NX.party && NX.party.on) || t < (this.nextDecor || 0)) return;
    const walking = !!(this.cur && this.cur.walk), idle = !this.cur && !this.queue.length; if ((!walking && !idle) || this.y > 480 || this.dy != null) return;                 // лише ближче до стіни (y ≤ 480)
    const seen = this.decorSeen || (this.decorSeen = {}), MK = DC.MK, nearX = (x0, x1, pad = 24) => this.x > x0 - pad && this.x < x1 + pad;
    const fire = (id, mood, back) => { seen[id] = t; this.nextDecor = t + 20 + Math.random() * 10; this.emote(mood, 2.6); this.say(NX.pick('act.decorReact.' + id)); if (back && idle) { this.back = true; this.backUntil = t + 1.8; } };
    const ok = id => !(seen[id] > t - 90);
    const trap = NX.decorLive && NX.decorLive.LP.find(L => L.e && L.e.sp && L.e.sp.kind === 'flytrap');
    if (trap && ok('trap') && nearX(trap.x0, trap.x1, 60)) { const st = NX.decorLive.trapAt(trap, t); if (st.snap >= 0 && st.snap < .6) return fire('trap', 'surprise'); }
    if (MK.reef && ok('fish') && nearX(MK.reef.x, MK.reef.x + MK.reef.w)) return fire('fish', Math.random() < .6 ? 'love' : 'happy', true);
    if (MK.jelly && ok('jelly') && nearX(MK.jelly.x, MK.jelly.x + MK.jelly.w, 30)) return fire('jelly', 'cool', true);
    const V = DC.byId.dc_vault; if (V && ok('vault') && NX.decorVault && NX.decorVault.caps().length && Math.random() < .5) { const C = NX.decorVault.caps(); if (nearX(C[0].x, C[C.length - 1].x + C[C.length - 1].w, 20)) return fire('vault', 'idea'); }
    if (MK.farm && ok('mint') && nearX(MK.farm.x, MK.farm.x + MK.farm.w, 10)) return fire('mint', 'happy');
  },
  /* ---------------- ВІЛЬНИЙ ЧАС ---------------- */
  autolife(t) {
    if (this.cur || this.queue.length || NX.ui.skinlab.open) return;
    const idle = t - this.lastCmd;
    if (idle > NX.cfg.IDLE_BEFORE_SLEEP && this.loc !== 'sofaLie') { this.do('sleep', false); return; }
    if (idle > NX.cfg.IDLE_BEFORE_AUTOLIFE && t > (this.nextLife || 0) && this.loc !== 'sofaLie') {
      this.nextLife = t + 10 + Math.random() * 8;
      if (this.catHungry) { this.catHungry = false; this.do('feedCat', false); return; }                       // Рудик нявкає — смаколик
      const r = Math.random(), ok = (id, o) => NX.acts[id] && NX.objects[o] && NX.objects[o].ready();   // сам працює: маркетинг, аналітика, інструменти, AI-центр — на своїх місцях
      if (r < .13 && ok('marketing', 'mkChair')) { this.do('marketing', false, { task: NX.ui.zones.pick('marketing') }); return; }
      if (r >= .13 && r < .25 && ok('analytics', 'anChair')) { this.do('analytics', false, { task: NX.ui.zones.pick('analytics') }); return; }
      if (r >= .25 && r < .36 && ok('tools', 'tools')) { this.do('tools', false, { task: NX.ui.zones.pick('tools') }); return; }
      if (r >= .36 && r < .47 && ok('ai', 'aicenter') && !(NX.virus && NX.virus.busy())) { this.do('ai', false, { task: NX.ui.zones.pick('ai') }); return; }   // вірус на столі — не зараз (крок 15)
      if (r < .5) { this.do('sofaWork', false); return; }
      if (r < .62) { const q = Math.random(); this.do(q < .3 ? 'garden' : q < .52 ? 'feedFish' : q < .68 ? 'upstairs' : q < .84 ? 'census' : 'harvest', false); return; }   // (· 30) збір врожаю   // (· 19) інвентаризація — сканує рослини   // (· 6) доглядає стіни: полив і годування риб; (· 7) другий поверх — заправити дрона
      const pool = [NX.objects.sofa.pick(), 'petCat', 'dance', 'home', 'wander', 'window', 'kickBall', 'selfie', 'workshop'];
      this.do(pool[Math.random() * pool.length | 0], false);
    }
  },

  /* ---------------- МАЛЮВАННЯ ---------------- */
  layer() {
    const s0 = NX.room.scaleAt(Math.max(this.depthY(), 352)) * this.zoom * SPRITE_K, hw = SW * s0 / 2 + 24, tp = FOOT * s0;   // межі малюнка (кімната) — для віддзеркалення (core/loop.js)
    return { y: this.depthY(), refl: this.dy == null, box: [this.x - hw, this.y - tp - 36, this.x + hw, this.y + SH * s0 - tp + 4], draw: (c, t) => {                // на дивані — без віддзеркалення (як і раніше)
      let pname = this.pose || 'stand';
      if (!this.cur && !this.queue.length) pname = this.talking ? 'talk' : (this.temp && t < this.tempT ? this.temp : (this.loc === 'sofaLie' ? 'sleep' : 'stand'));
      const p = poseFor(pname, t, !!(this.cur && this.cur.walk));
      if (this.back) p.back = 1;
      if (t < this.hiT && !this.rot) { if (p.back) { p.back = 0; p.la = { x: -3, y: p.sit ? 4 : 6 }; } p.ra = { x: 4, y: -4 + Math.round(Math.sin(t * 9.42478) * 2) }; }   // тап (hi): обличчям до нас і махає — поверх будь-якої пози
      if (this.talking && !p.back && !p.talk) p.talk = 1;
      if (this.mood && t < this.moodT) p.face = this.faceOf(this.mood);
      const ph = NX.nexiPhys; p.antX = ph.ax; p.antY = ph.ay; p.vel = NX.px.clamp(ph.vx / NX.cfg.RUN_SPEED, -1, 1); p.thrust = Math.min(1, Math.abs(ph.vy) / 80);
      if (this._rt !== t) { this._rt = t; renderBot(this.look, p, t, this.scr); }   // раз за кадр (віддзеркалення бере готовий)
      const K = NX.cam.k * NX.loop.dpr, s = NX.room.scaleAt(Math.max(this.depthY(), 352)) * this.zoom * SPRITE_K, w = SW * s, h = SH * s, top = FOOT * s;
      const X = Math.round(this.x * K) / K, Y = Math.round(this.y * K) / K;
      const shY = p.jet ? this.gy : Y, sr = s / SPRITE_K / 1.45;
      c.save(); c.globalAlpha = .45 * this.alpha * (p.jet ? .6 : 1); c.fillStyle = '#000'; c.beginPath(); c.ellipse(X, shY + 1, 11 * sr * (2 - ph.sq), 2.5 * sr, 0, 0, 7); c.fill(); c.restore();
      if (this.fxNow === 'aura') NX.px.glow(c, X, Y - top / 2, top * .8, 'rgba(140,100,255,.6)', this.alpha);
      c.save(); c.globalAlpha = this.alpha; c.imageSmoothingEnabled = false;
      c.translate(X, Y); c.rotate(((this.rot || 0) + (this.rot ? 0 : ph.lean)) * Math.PI / 180);
      c.scale((this.dir < 0 ? -1 : 1) * (1 + (1 - ph.sq) * .55), ph.sq);                 // стискання/розтяг
      c.drawImage(this.scr, -w / 2, -top, w, h); c.restore();
      if ((this.fxNow === 'rain' || this.fxNow === 'snow') && this.alpha > .5) {   // піксельна хмаринка над головою
        const cy = Y - top - 22 + Math.sin(t * 2) * 1.5, cx = X; c.save(); c.globalAlpha = .92;
        [[-11, 2, 22, 5], [-14, 4, 28, 4], [-7, -1, 10, 4], [0, -2, 8, 5]].forEach(([dx, dy, w2, h2]) => NX.px.rect(c, cx + dx, cy + dy, w2, h2, this.fxNow === 'rain' ? '#5a6590' : '#c3cbea'));
        NX.px.rect(c, cx - 12, cy + 8, 24, 1, this.fxNow === 'rain' ? '#3a4070' : '#8a93b8'); NX.px.rect(c, cx - 6, cy, 6, 1, '#ffffff'); c.restore();
        if (Math.random() < .5) NX.fx.emit(this.fxNow === 'rain' ? 'rain' : 'snow', cx + (Math.random() - .5) * 22, cy + 9, this.fxNow === 'rain' ? { vy: 120, ttl: (Y - cy - 10) / 120 } : { vy: 16, ttl: (Y - cy - 10) / 16 });
      }
      if (this.fxNow === 'neon') { c.save(); c.globalAlpha = this.alpha; c.strokeStyle = Math.floor(t * 3) % 2 ? '#ff4fd8' : '#3be8ff'; c.lineWidth = 1.2; c.shadowColor = c.strokeStyle; c.shadowBlur = 8; c.strokeRect(X - w * .42, Y - top - 3, w * .84, top + 5); c.restore(); }
      const gl = this.mood && t < this.moodT && { happy: '♪', love: '♥', surprise: '!', idea: '!?', sleepy: 'z', sad: '...', angry: '#!', cool: '*' }[this.mood]; if (gl) NX.px.text(c, gl, X + w * .3, Y - top - 4, '#ffe27a', 6);
      this.box = this.rot ? [X - top * .6, Y - w * .5, top * 1.2, w * .6] : [X - w * .4, Y - top, w * .8, top];
      this.headScreen = NX.cam.toScreen(X, Y - (this.rot ? w * .4 : top));
    } };
  },
};
