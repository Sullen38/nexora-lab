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
  /** Тап по підлозі — швидке переміщення, ЩОРАЗУ ІНШИМ СПОСОБОМ (власник, 13.11: «різноманіття його переміщення: коли тапаємо
   *  на області, по яких він ходить, щоб він міг швидко переміщатися; кожен тап він по-іншому переміщається, десь телепортиться
   *  теж»). Зовсім поруч (< MOVE_MIN) — просто підходить. Далі — спосіб із «мішка» MOVES: усі шість по колу у випадковому
   *  порядку, двічі поспіль той самий не трапляється:
   *    dash  — ривок зі світними рисками й пилом (в обхід меблів);
   *    slide — ковзає на неоновій дошці, з-під неї іскри й блакитна смуга (в обхід меблів);
   *    roll  — котиться колесом, пил з-під нього (в обхід меблів);
   *    leap  — 1–4 високі стрибки дугою, на кожному приземленні сплющується й піднімає кільце пилу (меблі на шляху — один
   *            високий стрибок через них);
   *    jet   — підліт на ранці дугою з бірюзовим слідом;
   *    tp    — телепорт: тане зі спіном, зелена комета летить до місця, з'являється там;
   *    flash — (власник, 13.11: «щоб він ще іноді як флеш міг рухатися і блискавку після себе лишати») надшвидкий біг: за ним
   *            лишається ламана жовто-біла блискавка з відгалуженнями (мерехтить і гасне за 0,7 с) і напівпрозорі «відбитки»
   *            самого Nexi; на фініші — спалах іскор (в обхід меблів);
   *    blink — мерехтіння: черга миттєвих коротких стрибків зигзагом (крок ≈ 64 од.), на кожному місці лишається фіолетовий
   *            відбиток;
   *    twist — вихор: мчить, крутячись дзиґою, довкола кружляють частинки (в обхід меблів).
   *  ЧІТКІСТЬ (власник, 13.11: «покращи ще його рухи, щоб усе було чітко»):
   *   - кожен спосіб має ЧАС у дорозі, а не швидкість: MOVE_V — середня швидкість, MOVE_T — межі часу; будь-яка відстань —
   *     не довше ≈ 1,2 с (раніше через усю кімнату — до 3 с, на ранці — 3,5 с);
   *   - рух ПЛАВНИЙ: розгін на початку й гальмування в кінці (EZ — та сама крива, що в камери), по шляху в обхід меблів — за
   *     пройденою довжиною; на старті — пружний поштовх, на фініші — сплющення й пил;
   *   - КАМЕРА телефона їде разом із ним (cam.glide на той самий час і тією ж кривою) — Nexi не вилітає за край екрана
   *     (раніше флеш, ранець і мерехтіння випереджали камеру);
   *   - колесо обертається за пройденим шляхом — ціле число обертів, на фініші стоїть рівно; на ранці й у стрибках розмір і
   *     глибина — за точкою підлоги під ним (не «меншає» вгорі дуги й не ховається за меблі).
   *  NX.nexi.forceMove = 'roll' — завжди цей спосіб (для перевірки). */
  MOVE_V: { dash: 430, slide: 470, roll: 400, twist: 430, flash: 950, leap: 400, jet: 430 }, MOVE_T: { flash: [.28, .7], def: [.35, 1.2] },
  moveTime(st, L) { const [a, b] = this.MOVE_T[st] || this.MOVE_T.def; return Math.max(a, Math.min(b, L / this.MOVE_V[st])); },
  EZ(q) { return q < .5 ? 2 * q * q : 1 - 2 * (1 - q) * (1 - q); },
  MOVES: ['dash', 'slide', 'roll', 'leap', 'jet', 'tp', 'flash', 'blink', 'twist'], bolt: [], ghosts: [], MOVE_MIN: 70, moveBag: [], moveLast: null,
  nextMove() {
    if (this.forceMove) return this.forceMove;
    if (!this.moveBag.length) { const b = [...this.MOVES]; for (let i = b.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [b[i], b[j]] = [b[j], b[i]]; }
      if (b[b.length - 1] === this.moveLast) b.unshift(b.pop()); this.moveBag = b; }                                      // новий мішок не починається з того, чим скінчився старий
    return this.moveLast = this.moveBag.pop();
  },
  walkTo(x, y) {
    this.lastCmd = NX.time; NX.cam.unfocus(); this.finishTask(false); this.endTp(); const to = NX.room.clampWalk(x, y), L = Math.hypot(to[0] - this.x, to[1] - this.y);
    const st = L < this.MOVE_MIN ? null : this.nextMove();
    const mv = !st ? { walk: to } : st === 'tp' ? { tp: to, kind: 'floor' } : st === 'blink' ? { blink: to } : st === 'jet' ? { fly: to, jet: 'floor' } : st === 'leap' ? { fly: to, leap: 1, over: NX.room.route([this.x, this.y], to).length > 1 } : { walk: to, dash: 'floor', style: st };
    this.queue = [...this.exitRoute(), mv, { loc: 'floor' }]; this.cur = null;
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
  endTp() { const a = this.cur; if (a && (a.tp || a.blink)) { this.alpha = 1; this.zoom = 1; } if (a && (a.leap || a.arc)) { this.y = this.gy; if (a.leap || a.jet === 'floor') this.dy = null; }   // перервали в повітрі — на підлогу
    this.comet = null; this.roll = 0; this.board = false; this.air = false; },
  /** Частинки переміщень: телепорт (burst — сплеск на початку й у точці появи). */
  tpFx(a, x, y, burst) {
    const r = Math.random, F = NX.fx, s = NX.room.scaleAt(Math.max(y, 352)) / 1.45, H = 40 * s, k = a.kind;
    for (let i = 0, n = burst ? 16 : 2; i < n; i++) {
      if (k === 'ai') F.emit('bit', x + (r() - .5) * 24 * s, y - r() * H, { vx: (r() - .5) * 46, vy: -24 - r() * 56, col: r() < .6 ? '#3be8ff' : '#3bff8a', s: r() < .3 ? 2.5 : 1.5 });
      else if (k === 'party') F.list.push({ type: 'portal', x, y: y - H / 2, orbit: (12 + r() * 16) * s, cx: x, cy: y - H / 2, a0: r() * 6.3, age: 0, ttl: .7, s: 1.5, col: r() < .5 ? '#d94bff' : '#3be8ff', vx: 0, vy: 0 });
      else F.emit('energy', x + (r() - .5) * 26 * s, y - r() * H * .9, { vy: -60 - r() * 70, col: r() < .6 ? (k === 'floor' ? '#3bff8a' : '#ff7af0') : '#ffffff', h: 4 + (r() * 5 | 0) });
    }
    if (burst) F.emit('ring', x, y, { col: { ai: '#3be8ff', party: '#d94bff', floor: '#3bff8a' }[k] || '#ff7af0', r0: 4 * s, gr: 64 * s });
  },
  /** Комета телепорту: світне ядро зі шлейфом рисок та іскор кольору зони летить дугою від старого місця до нового (q 0..1). */
  cometFx(a, x, y, q) {
    const r = Math.random, F = NX.fx, col = { ai: '#3be8ff', party: '#d94bff', floor: '#3bff8a' }[a.kind] || '#ff7af0', d = Math.sign(a.tp[0] - a.from[0]) || 1;
    for (let i = 0; i < 5; i++) F.emit('line', x - d * r() * 26, y + (r() - .5) * 10, { w: 12 + r() * 18, col: r() < .5 ? col : '#ffffff', vx: -d * 60, ttl: .3 });
    F.emit('energy', x, y + 4, { vy: -30, col, ttl: .3, h: 8 }); if (r() < .6) F.emit('spark', x, y, { col, vx: -d * (30 + r() * 60), vy: (r() - .5) * 60, g: 40, ttl: .45 });
    if (q > .7) F.emit('energy', a.tp[0] + (r() - .5) * 20, a.tp[1] - r() * 30, { vy: -40, col, ttl: .35 });                  // місце появи вже світиться
  },
  /** Частинки «флеша» й вихору (d — напрям руху). Сама блискавка й відбитки — у layer() (bolt, ghosts). */
  styleFx(a, sty, d) {
    const r = Math.random, F = NX.fx, s = NX.room.scaleAt(Math.max(this.y, 352)) / 1.45, T = NX.time;
    if (sty === 'flash') {
      const B = this.bolt, L = B[B.length - 1];
      if (!L || L.a !== a) B.push({ x: a.from[0], y: a.from[1] - 18 * s, t: T, a });                                              // початок блискавки — де стояв
      else if (Math.abs(this.x - L.x) + Math.abs(this.y - (L.gy || L.y)) > 16 * s) B.push({ x: this.x + (r() - .5) * 6, y: this.y - (5 + r() * 30) * s, gy: this.y, t: T, a, br: r() < .35 ? [(r() - .5) * 26 * s, (r() < .5 ? -1 : 1) * (8 + r() * 14) * s] : null });   // злам; іноді — відгалуження
      if (T - (this.ghT || 0) > .035) { this.ghT = T; this.ghosts.push({ x: this.x, y: this.y, d: this.dir, t: T, ttl: .28 }); }
      if (r() < .6) F.emit('spark', this.x - d * 6 * s, this.y - r() * 30 * s, { vx: -d * (40 + r() * 90), vy: (r() - .5) * 70, g: 30, ttl: .3, col: r() < .6 ? '#ffe27a' : '#ffffff' });
      F.emit('line', this.x - d * (8 + r() * 14) * s, this.y - (4 + r() * 30) * s, { w: Math.max(6, (14 + r() * 16) * s | 0), vx: -d * 40, col: r() < .5 ? '#ffe27a' : '#fff6c9' });
    } else if (sty === 'twist') {
      if (r() < .8) F.list.push({ type: 'portal', x: this.x, y: this.y - 18 * s, orbit: (10 + r() * 14) * s, cx: this.x, cy: this.y - (4 + r() * 34) * s, a0: r() * 6.3, age: 0, ttl: .45, s: 1.5, col: r() < .5 ? '#3be8ff' : '#ffffff', vx: 0, vy: 0 });
      if (r() < .6) F.emit('dust', this.x - d * 6 * s, this.y - 1, { vx: -d * (10 + r() * 30), vy: -8 - r() * 16 });
    }
  },
  /** Слід ривка й підльоту: пил і риски (маркетинг), іскри (інструменти), жовтий слід (аналітика). */
  trailFx(kind) {
    const r = Math.random, F = NX.fx, s = NX.room.scaleAt(Math.max(this.depthY(), 352)) / 1.45, d = this.dir, bx = this.x - d * 8 * s;
    if (kind === 'jetFloor') { if (r() < .8) F.emit('trail', bx - d * r() * 6 * s, this.y - (6 + r() * 22) * s, { s: 2, ttl: .45, col: r() < .65 ? '#3be8ff' : '#d8fbff' }); return; }
    if (kind === 'slide') { F.emit('line', bx - d * r() * 8 * s, this.y - 1, { w: Math.max(6, (14 + r() * 14) * s | 0), vx: -d * 20, ttl: .3, col: r() < .6 ? '#3be8ff' : '#ff4fd8' }); if (r() < .5) F.emit('spark', bx, this.y - 1, { vx: -d * (40 + r() * 70), vy: -10 - r() * 30, col: r() < .5 ? '#3be8ff' : '#ffffff', ttl: .35 }); return; }
    if (kind === 'roll') { if (r() < .7) F.emit('dust', bx, this.y - 1, { vx: -d * (14 + r() * 30), vy: -6 - r() * 14 }); if (r() < .3) F.emit('line', this.x - d * (10 + r() * 8) * s, this.y - (4 + r() * 26) * s, { w: Math.max(4, 8 * s | 0), vx: -d * 30, col: 'rgba(255,226,122,.8)' }); return; }
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
      if (a.style) { a.L = L; a.T = this.moveTime(a.style, L); a.cum = []; let c = 0, o = a.from; a.path.forEach(q => { c += Math.hypot(q[0] - o[0], q[1] - o[1]); a.cum.push(c); o = q; });   // спосіб тапу: час у дорозі й довжини відрізків шляху
        a.turns = Math.max(1, Math.round(L / 115)); NX.cam.glide(a.walk[0], a.T); NX.nexiPhys.kick(2.2); for (let i = 0; i < 4; i++) NX.fx.emit('dust', this.x, this.y); }
    }
    if (a.tp) { a.from = [this.x, this.y]; this.dy = null; this.tpFx(a, this.x, this.y, true); a.near = Math.hypot(a.tp[0] - this.x, a.tp[1] - this.y) < 160; NX.cam.hold(.25); }   // поки тане — камера стоїть (далі glide з кометою або jump)
    if (a.blink) {                                                                    // (13.11) мерехтіння: короткі миттєві стрибки зигзагом (крок BLINK_STEP) уздовж плавного ходу — камера телефона встигає
      const to = a.blink; a.from = [this.x, this.y]; a.L = Math.hypot(to[0] - this.x, to[1] - this.y); a.dur = Math.max(.4, Math.min(.75, a.L / 900)); a.i = 0; this.dy = null; NX.cam.glide(to[0], a.dur);
    }
    if (a.fly || a.hop) { a.from = [this.x, this.y]; const to = a.fly || a.hop, L = Math.hypot(to[0] - this.x, to[1] - this.y);
      a.dur = a.quick || (a.hop ? .45 : a.leap ? this.moveTime('leap', L) : a.jet === 'floor' ? this.moveTime('jet', L) : a.jet ? Math.max(.45, L / (NX.cfg.FLY_SPEED * 2.4)) : Math.max(.5, L / NX.cfg.FLY_SPEED));   // quick — задана тривалість (С4: зліт у капсулу)
      if (a.jet) a.arc = Math.min(70, 18 + L * .12);                                       // підліт дугою (рядок був випадково в коментарі — дуги не було)
      if (a.leap) { a.leap = a.over ? 1 : Math.max(1, Math.min(4, Math.round(L / 150))); a.lh = a.over ? Math.min(84, 40 + L * .08) : Math.min(46, 22 + L / a.leap * .12);   // на шляху меблі — один високий стрибок через них
        a.b = 0; NX.nexiPhys.kick(2.8); }
      if (a.leap || a.jet === 'floor') NX.cam.glide(to[0], a.dur);                         // камера — разом із ним   // стрибки: кількість і висота — за довжиною
      if (a.fly) for (let i = 0; i < 6; i++) NX.fx.emit('dust', this.x, this.y);
      if (a.leap) this.dy = this.y;
      if (!a.leap && (a.dy !== undefined || this.dy != null)) a.dz = [this.depthY(), a.dy !== undefined ? a.dy : to[1]]; }   // глибина на дивані: плавно (dy)
    if (a.face) this.dir = a.face;
    if (a.loc) this.loc = a.loc;
    if (a.do) a.do();
    if (a.say) this.say(a.say);
    if (a.rot !== undefined) this.rot = a.rot;
    if (a.fade) a.from = { alpha: this.alpha, zoom: this.zoom, y: this.y };
    if (a.work) { const w = a.work; if (w.back) this.back = true; if (w.obj) { NX.objects[w.obj].active = true; NX.objects[w.obj].prog = 0; } w.start && w.start(); }
  },
  step(a, dt) {
    if (a.walk && a.T) {                                                              // СПОСІБ ТАПУ: плавно (розгін — гальмування) за пройденою довжиною шляху
      this.dy = null; const sty = a.style, q = Math.min(1, a._t / a.T), e = this.EZ(q), sl = e * a.L; let i = 0; while (i < a.cum.length - 1 && a.cum[i] < sl) i++;
      const A = i ? a.path[i - 1] : a.from, B = a.path[i], l0 = i ? a.cum[i - 1] : 0, sg = (a.cum[i] - l0) || 1, f = Math.min(1, (sl - l0) / sg);
      this.x = A[0] + (B[0] - A[0]) * f; this.y = this.gy = A[1] + (B[1] - A[1]) * f; if (Math.abs(B[0] - A[0]) > 1) this.dir = a.d = Math.sign(B[0] - A[0]);
      this.pose = { dash: 'run', flash: 'run', twist: 'spin' }[sty] || sty; this.board = sty === 'slide'; if (sty === 'roll') this.roll = (a.d || this.dir) * e * a.turns * 6.28319;   // колесо: оберти — за шляхом
      if (q > .04 && q < .97) { if (sty === 'flash' || sty === 'twist') this.styleFx(a, sty, a.d || this.dir); else this.trailFx(sty === 'dash' ? a.dash : sty); }
      if (sty === 'twist') this.dir = Math.floor(a._t * 16) % 2 ? 1 : -1;
      if (q < 1) return false;
      const [tx, ty] = a.walk; this.x = tx; this.y = this.gy = ty; this.roll = 0; this.board = false; if (a.d) this.dir = a.d; NX.nexiPhys.land(sty === 'flash' ? 3.2 : 2.4); for (let j = 0; j < 6; j++) NX.fx.emit('dust', tx, ty);
      if (sty === 'flash') { this.bolt.push({ x: tx, y: ty - 18 * NX.room.scaleAt(ty) / 1.45, t: NX.time, a }); NX.fx.emit('ring', tx, ty, { col: '#ffe27a', r0: 4, gr: 56 }); for (let j = 0; j < 12; j++) NX.fx.emit('spark', tx, ty - Math.random() * 30, { vx: (Math.random() - .5) * 160, vy: -20 - Math.random() * 90, col: Math.random() < .6 ? '#ffe27a' : '#ffffff', ttl: .45 }); this.emote('cool', 1.6); }
      return true;
    }
    if (a.walk) {
      this.dy = null;
      const [tx, ty] = a.path ? a.path[a.pi] : a.walk, dx = tx - this.x, dy = ty - this.y, d = Math.hypot(dx, dy), sp = (a.dash ? NX.cfg.DASH_SPEED : a.run ? NX.cfg.RUN_SPEED : NX.cfg.WALK_SPEED) * dt;
      this.pose = a.run || a.dash ? 'run' : 'walk'; if (Math.abs(dx) > 1) this.dir = Math.sign(dx);
      if (a.dash) this.trailFx(a.dash);
      if (d <= sp) { this.x = tx; this.y = ty; this.gy = ty; if (a.path && a.pi < a.path.length - 1) { a.pi++; return false; } return true; }   // кут обходу — далі до наступної точки
      this.x += dx / d * sp; this.y += dy / d * sp; this.gy = this.y; return false;
    }
    if (a.spin) { this.dir = Math.floor(a._t * 12) % 2 ? 1 : -1; this.pose = 'spin'; if (a._t >= a.spin) { this.dir = 1; return true; } return false; }
    if (a.tp) {                                                                         // телепорт (06.11, власник: «екран має плавно переміщатися»):
      // 0,25 с тане зі спіном -> 0,3 с світна комета летить до місця (камера на телефоні їде за нею — core/camera.js glide) ->
      // 0,25 с з'являється; близько (< 160 од.) — без комети, як було
      const T1 = .25, T2 = a.near ? 0 : .3, T3 = .25, k = a._t; this.dy = null; this.pose = 'spin'; this.dir = Math.floor(k * 16) % 2 ? 1 : -1;
      if (k < T1) { const q = k / T1; this.alpha = 1 - q; this.zoom = 1 - .3 * q; this.tpFx(a, this.x, this.y, false); return false; }
      if (k < T1 + T2) { const q = (k - T1) / T2, e = q < .5 ? 2 * q * q : 1 - 2 * (1 - q) * (1 - q);               // комета: Nexi невидимий летить дугою
        if (!a.gl) { a.gl = 1; NX.cam.glide(a.tp[0], T2); }                                                       // камера летить разом з кометою (та сама плавність)
        this.alpha = 0; this.x = a.from[0] + (a.tp[0] - a.from[0]) * e; this.y = this.gy = a.from[1] + (a.tp[1] - a.from[1]) * e; this.comet = [this.x, this.y - Math.sin(q * Math.PI) * 60, a.kind]; this.cometFx(a, this.comet[0], this.comet[1], q); return false; }
      this.comet = null;
      if (!a.moved) { a.moved = true; this.x = a.tp[0]; this.y = this.gy = a.tp[1]; const P = NX.nexiPhys; P.px = null; P.vx = P.vy = 0; this.tpFx(a, this.x, this.y, true); if (a.near) NX.cam.jump(this.x); }
      const q = Math.min(1, (k - T1 - T2) / T3); this.alpha = q; this.zoom = .7 + .3 * q;
      if (q < 1) { this.tpFx(a, this.x, this.y, false); return false; }
      this.alpha = 1; this.zoom = 1; this.dir = a.tp[0] >= a.from[0] ? 1 : -1; NX.nexiPhys.land(2.4); return true;
    }
    if (a.blink) {
      const q = Math.min(1, a._t / a.dur), ST = 64, n = Math.max(1, Math.round(a.L / ST)), i = q >= 1 ? n : Math.round(this.EZ(q) * n), F = NX.fx, to = a.blink;
      if (i !== a.i) { const ox = this.x, oy = this.y, k = i / n, zz = i < n ? (i % 2 ? -9 : 9) : 0; a.i = i;                                  // стрибок: відбиток і кільце на старому місці
        this.ghosts.push({ x: ox, y: oy, d: this.dir, t: NX.time, ttl: .4, col: 1 }); if (i % 2 || i === n) F.emit('ring', ox, oy, { col: '#b06bff', r0: 3, gr: 26, ttl: .28 });
        const P = i < n ? NX.room.clampWalk(a.from[0] + (to[0] - a.from[0]) * k, a.from[1] + (to[1] - a.from[1]) * k + zz, 'nexi') : to; if (Math.abs(to[0] - a.from[0]) > 2) this.dir = Math.sign(to[0] - a.from[0]);
        this.x = P[0]; this.y = this.gy = P[1]; const ph = NX.nexiPhys; ph.px = null; ph.vx = ph.vy = 0; a.jt = a._t;
        for (let j = 0; j < 3; j++) F.emit('bit', this.x + (Math.random() - .5) * 20, this.y - Math.random() * 34, { vx: (Math.random() - .5) * 60, vy: -20 - Math.random() * 40, col: Math.random() < .6 ? '#b06bff' : '#ffffff', ttl: .3 }); }
      this.pose = 'jump'; this.zoom = 1; this.alpha = q >= 1 ? 1 : .45 + .55 * Math.min(1, (a._t - (a.jt || 0)) / .05);
      if (q >= 1) { this.alpha = 1; NX.nexiPhys.land(2.6); F.emit('ring', this.x, this.y, { col: '#b06bff', r0: 4, gr: 50 }); return true; }
      return false;
    }
    if (a.hop && a._t < .12) { this.pose = 'crouch'; return false; }                   // присід перед стрибком
    if (a.hop && !a.kicked) { a.kicked = true; NX.nexiPhys.kick(2.6); }
    if (a.fly || a.hop) {
      const to = a.fly || a.hop, k = Math.min(1, (a._t - (a.hop ? .12 : 0)) / a.dur);
      if (a.leap) {                                                                    // (13.11) високі стрибки: рівний хід уперед, дуга на кожен стрибок, тінь і глибина — по підлозі
        const n = a.leap, ek = this.EZ(k), b = Math.min(n, Math.floor(k * n)), gx = NX.px.lerp(a.from[0], to[0], ek), g = NX.px.lerp(a.from[1], to[1], ek), up = Math.sin((k * n - Math.min(b, n - 1)) * Math.PI);
        this.x = gx; this.gy = this.dy = g; this.y = g - Math.max(0, up) * a.lh * NX.room.scaleAt(g) / 1.45; this.air = true; this.pose = up > .25 ? 'jump' : 'crouch';
        if (Math.abs(to[0] - a.from[0]) > 2) this.dir = Math.sign(to[0] - a.from[0]);
        if (b !== a.b) { a.b = b; NX.nexiPhys.land(3); NX.fx.emit('ring', gx, g, { col: '#ffe27a', r0: 3, gr: 34, ttl: .35 }); for (let i = 0; i < 5; i++) NX.fx.emit('dust', gx, g); if (b < n) NX.nexiPhys.kick(2.4); }
        if (k >= 1) { this.y = g; this.dy = null; this.air = false; }
        return k >= 1;
      }
      const e = a.hop ? k : (k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);   // плавний розгін/гальмування ранця
      this.x = NX.px.lerp(a.from[0], to[0], e); this.y = NX.px.lerp(a.from[1], to[1], e) - (a.hop ? Math.sin(k * Math.PI) * (a.hi || 14) : a.arc ? Math.sin(e * Math.PI) * a.arc : 0);
      if (a.arc) { this.gy = NX.px.lerp(a.from[1], to[1], e); if (a.jet === 'floor') this.dy = k >= 1 ? null : this.gy; this.trailFx(a.jet === 'floor' ? 'jetFloor' : a.jet); }        // підліт дугою: тінь — по підлозі під ним
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
      this.nextFx = t + 22 + Math.random() * 18; const fx = ['rain', 'snow', 'sparks', 'aura', 'fire', 'water', 'aura', 'energy', 'trail', 'rain'][Math.random() * 10 | 0];
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
      if (r < .62) { const q = Math.random(), thirsty = NX.planters && NX.planters.needsWater && NX.planters.needsWater() && NX.acts.jardin, leafy = NX.planters && NX.planters.needsPrune && NX.planters.needsPrune() && NX.acts.prune && q < .5; this.do(thirsty ? 'jardin' : leafy ? 'prune' : q < .2 ? 'garden' : q < .26 ? 'jardin' : q < .3 ? 'repot' : q < .52 ? 'feedFish' : q < .68 ? 'upstairs' : q < .78 ? 'census' : q < .87 && NX.acts.curate ? 'curate' : 'harvest', false); return; }   // (· 57) оглядає колекцію в сотах   // (· 38) жардиньєр пересох — Nexi помічає й іде поливати   // (· 30) збір врожаю   // (· 19) інвентаризація — сканує рослини   // (· 6) доглядає стіни: полив і годування риб; (· 7) другий поверх — заправити дрона
      const pool = [NX.objects.sofa.pick(), 'petCat', 'dance', 'home', 'wander', 'window', 'kickBall', 'selfie', 'workshop', 'jarSit'];   // (декор стін · 42) посидіти в саду за диваном
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
      const sr0 = s / SPRITE_K / 1.45;
      if (this.comet) { const [cx, cy, kd] = this.comet, sr = sr0, col = { ai: 'rgba(59,232,255,.9)', party: 'rgba(217,75,255,.9)', floor: 'rgba(59,255,138,.9)' }[kd] || 'rgba(255,122,240,.9)';   // комета телепорту: світне ядро
        NX.px.glow(c, cx, cy, 44 * sr, col, .9); NX.px.glow(c, cx, cy, 16 * sr, 'rgba(255,255,255,.9)', .9); c.save(); c.fillStyle = '#ffffff'; c.beginPath(); c.ellipse(cx, cy, 8 * sr, 4 * sr, 0, 0, 7); c.fill(); c.restore(); }
      const NT = NX.time;
      if (this.bolt.length) { this.bolt = this.bolt.filter(b => NT - b.t < .7);                                                  // БЛИСКАВКА «флеша»: ламана з відгалуженнями, мерехтить і гасне
        const B = this.bolt; c.save(); c.lineJoin = 'miter'; c.lineCap = 'butt';
        for (const [lw, col, al] of [[9 * sr0, '#ffb52e', .3], [4 * sr0, '#ffe27a', .85], [1.6 * sr0, '#ffffff', 1]]) { c.lineWidth = Math.max(.6, lw); c.strokeStyle = col;
          for (let i = 1; i < B.length; i++) { const q = B[i], o = B[i - 1]; if (q.a !== o.a) continue; const k = 1 - (NT - q.t) / .7, fl = Math.sin(NT * 70 + i * 2.3) > -.5 ? 1 : .35; c.globalAlpha = al * k * fl;
            c.beginPath(); c.moveTo(o.x, o.y); c.lineTo(q.x, q.y); if (q.br) { c.moveTo(q.x, q.y); c.lineTo(q.x + q.br[0] * .5, q.y + q.br[1] * .6); c.lineTo(q.x + q.br[0], q.y + q.br[1]); } c.stroke(); } }
        c.restore(); }
      if (this.ghosts.length) { this.ghosts = this.ghosts.filter(g => NT - g.t < g.ttl); c.save(); c.imageSmoothingEnabled = false;   // відбитки Nexi (флеш, мерехтіння)
        for (const g of this.ghosts) { const gs = NX.room.scaleAt(Math.max(g.y, 352)) * SPRITE_K, gw = SW * gs, gh = SH * gs, k = 1 - (NT - g.t) / g.ttl; c.globalAlpha = (g.col ? .55 : .38) * k;
          if (g.col) NX.px.glow(c, g.x, g.y - FOOT * gs * .5, 20 * gs / SPRITE_K / 1.45, 'rgba(176,107,255,.7)', k * .8);
          c.save(); c.translate(g.x, g.y); c.scale(g.d < 0 ? -1 : 1, 1); c.drawImage(this.scr, -gw / 2, -FOOT * gs, gw, gh); c.restore(); }
        c.restore(); }
      const shY = p.jet || this.air ? this.gy : Y, sr = s / SPRITE_K / 1.45;
      c.save(); c.globalAlpha = .45 * this.alpha * (p.jet ? .6 : 1); c.fillStyle = '#000'; c.beginPath(); c.ellipse(X, shY + 1, 11 * sr * (2 - ph.sq), 2.5 * sr, 0, 0, 7); c.fill(); c.restore();
      if (this.fxNow === 'aura') NX.px.glow(c, X, Y - top / 2, top * .8, 'rgba(140,100,255,.6)', this.alpha);
      c.save(); c.globalAlpha = this.alpha; c.imageSmoothingEnabled = false;
      if (this.board && this.cur) { const bw = 15 * sr, by = Y + 1.5 * sr; NX.px.glow(c, X, by, 22 * sr, 'rgba(59,232,255,.55)', this.alpha); c.save(); c.globalAlpha = this.alpha;   // неонова дошка під ногами (slide)
        c.fillStyle = '#0a1030'; c.fillRect(X - bw - 1, by - 1.5 * sr, bw * 2 + 2, 3 * sr); c.fillStyle = '#3be8ff'; c.fillRect(X - bw, by - sr, bw * 2, 1.2 * sr); c.fillStyle = '#ff4fd8'; c.fillRect(X - bw, by + .4 * sr, bw * 2, .8 * sr); c.restore(); }
      if (this.roll && this.cur) { c.translate(X, Y - top * .5); c.rotate(this.roll); c.translate(0, top * .5); }                              // колесо: обертається довкола середини тіла
      else { c.translate(X, Y); c.rotate(((this.rot || 0) + (this.rot ? 0 : ph.lean)) * Math.PI / 180); }
      c.scale((this.dir < 0 ? -1 : 1) * (1 + (1 - ph.sq) * .55), ph.sq);                 // стискання/розтяг
      c.drawImage(this.scr, -w / 2, -top, w, h); c.restore();
      if ((this.fxNow === 'rain' || this.fxNow === 'snow') && this.alpha > .5) {   // піксельна хмаринка над головою
        const cy = Y - top - 22 + Math.sin(t * 2) * 1.5, cx = X; c.save(); c.globalAlpha = .92;
        [[-11, 2, 22, 5], [-14, 4, 28, 4], [-7, -1, 10, 4], [0, -2, 8, 5]].forEach(([dx, dy, w2, h2]) => NX.px.rect(c, cx + dx, cy + dy, w2, h2, this.fxNow === 'rain' ? '#5a6590' : '#c3cbea'));
        NX.px.rect(c, cx - 12, cy + 8, 24, 1, this.fxNow === 'rain' ? '#3a4070' : '#8a93b8'); NX.px.rect(c, cx - 6, cy, 6, 1, '#ffffff'); c.restore();
        if (Math.random() < .5) NX.fx.emit(this.fxNow === 'rain' ? 'rain' : 'snow', cx + (Math.random() - .5) * 22, cy + 9, this.fxNow === 'rain' ? { vy: 120, ttl: (Y - cy - 10) / 120 } : { vy: 16, ttl: (Y - cy - 10) / 16 });
      }
      // (13.11, власник: «можна без цих обводок, рамок — не хочу цього») рамку ефекту neon довкола Nexi прибрано; сам ефект — частинки NX.fx.skin
      const gl = this.mood && t < this.moodT && { happy: '♪', love: '♥', surprise: '!', idea: '!?', sleepy: 'z', sad: '...', angry: '#!', cool: '*' }[this.mood]; if (gl) NX.px.text(c, gl, X + w * .3, Y - top - 4, '#ffe27a', 6);
      this.box = this.rot ? [X - top * .6, Y - w * .5, top * 1.2, w * .6] : [X - w * .4, Y - top, w * .8, top];
      this.headScreen = NX.cam.toScreen(X, Y - (this.rot ? w * .4 : top));
    } };
  },
};
