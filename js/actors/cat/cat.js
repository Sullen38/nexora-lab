/* ============================================================================
 * actors/cat/cat.js — РУДИЙ КІТ: ВЛАСНЕ ЖИТТЯ (поведінка)
 * ----------------------------------------------------------------------------
 * Кіт живе сам: спить (своя лежанка під столом AI-центру — крок 14; диван / бильце / біля доку), вмивається, ганяє м'ячик
 * (objects/ball.js), потягується,
 * нявкає, приходить посидіти біля Nexi. Голод росте з часом -> кіт нявкає, і Nexi сам приходить зі смаколиком
 * (activities.js → feedCat). Куточок кота (лежанка, дряпка, миски) прибрано — власник, 02.11: «поки що місце для
 * Рудика взагалі прибираємо» (узяти назад — коміт be2f780, objects/cat_corner.js).
 * Публічно: NX.cat.purr(сек) — коли Nexi гладить; NX.cat.hitTest(x,y); goTo / set — коли кличуть сценарії Nexi.
 * Ходить лише по підлозі (FLOOR); на диван — стрибає.
 * (Кіт на столі зони біля Nexi, фонтан, робопилосос — були до чистої основи 29.10; в історії git, коміт a941612.)
 * Крок 15 (власник: «щоб Рудик теж міг на стіл вилазити щось робити… вірус стрибнув на стіл AI, а Рудик його спопелив
 *   поглядом, як Супермен, — червоним лазером з очей; очі іноді підсвічуються, коли він трохи злий… без перебору»):
 *   СТІЛ AI-ЦЕНТРУ — два місця на стільниці (aiDeskL / aiDeskR, застрибує з підлоги перед столом): зрідка сам (дивиться на
 *     екран — AI «бачить» його на радарі; грається з голо-рибкою, яку вмикає AI — б'є лапкою; вмивається; дрімає на теплому
 *     столі) і часом складає компанію Nexi, коли той працює за столом (joinAI);
 *   ЗЛИЙ — grr(сек): очі червоні й світяться (рідко: голодний і чекає, розбудили гості, Чеширський кіт, Змій Горинич, вірус
 *     — і раз на 1.5–3 хв «просто так», буркотить на Nexi);
 *   ЛАЗЕР З ОЧЕЙ — лише на вірус (actors/virus/virus.js → hunt): біжить, застрибує на стіл, пригинається (очі
 *     розжарюються) — два промені з очей, вірус розлітається пікселями. Промені — окремий шар поверх усього (catFx).
 *   На висоті (стіл, лежанка, диван) — без віддзеркалення в підлозі; зістрибує туди, звідки застрибнув.
 * Крок 15.1 (власник: «коли з Рудиком якась подія — камера переходить на нього… на якийсь час у центрі уваги, потім
 *   повертається на Nexi»): look(сек) — фокус камери на Рудику (core/camera.js: focus; телефон — на комп'ютері видно всю
 *   кімнату). Події: вірус (від тривоги до «пуф» + гордий момент; коли вірус поруч — між котом і вірусом), злий (просто так,
 *   розбудили, голодний, Змій), погоня за Чеширським котом і Колобком, поклон Кота в чоботях, гра з голо-рибкою.
 * Декор стін · 9 (план «Рудик і декор»): сідає під найближчим акваріумом, задирає голову (поза gaze) і стежить за рибами, лапкою
 *   «ловить» — риби сахаються (objects/decor_live.js TP.aq, як від тапу); полює на метелика: підбігає, припадає (голова за ним),
 *   стрибає — метелик тікає (TP.fly).
 * ========================================================================== */
NX.cat = {
  FLOOR: 378,   // кіт ходить ТІЛЬКИ по підлозі (y >= FLOOR); на меблі — лише стрибком
  x: 600, y: 440, ground: 440, alt: 0, dir: -1, mode: 'act', pose: 'sleep', timer: 12, frame: 0, ft: 0,
  hunger: .2, target: null, then: null, jump: null, cv: document.createElement('canvas'), name: 'Рудик',
  angT: 0, angS: 0, nextGrr: 70 + Math.random() * 60, wokeT: 0, laser: null, hunting: null, at: null, down: null, eyes: null, eyeW: null, sc: 1.4,   // крок 15
  /** Місце на дивані (задане для старого місця дивану — переноситься разом з ним, core/config.js sofaPt) і точка підлоги перед ним. */
  sofaSpot(k, x, y) { const [sx, sy] = NX.cfg.sofaPt(x, y), [, fy] = NX.cfg.sofaPt(x, 384); return { [k]: { x: sx, y: sy, from: [sx, fy] } }; },
  spots() { return {
    ...this.sofaSpot('sofa', 830, 324), ...this.sofaSpot('sofaArm', 871, 301), ...this.bedSpot(), ...this.deskSpots(),
    rug: { x: NX.objects.rug.home[0] + 70, y: NX.objects.rug.home[1] + 4 },
    ...(NX.planters && NX.planters.catSpot ? { jar: NX.planters.catSpot() } : {}) }; },                                   // (декор стін · 38) кант жардиньєра за диваном
  /** Лежанка під столом AI-центру (крок 14): точка на подушці (якір aiBed розкладки) і точка підлоги перед столом, звідки
   *  кіт застрибує під стіл (як на диван: під стіл Nexi й кіт пішки не ходять — слід стола). */
  bedSpot() { const z = NX.arc.zone && NX.arc.zone('ai'); if (!z) return {}; const [x, y] = z.S(108, 336, 20), [fx, fy] = NX.room.clampWalk(...z.S(108, 352, -16), 'cat');
    return { aiBed: { x, y, from: [fx, fy] } }; },
  /** Стільниця AI-центру (крок 15): ліва й права частини (обабіч кола-майданчика Nexi, перед моніторами) і точки підлоги
   *  перед столом, звідки застрибує. */
  deskSpots() { const z = NX.arc.zone && NX.arc.zone('ai'); if (!z) return {}; const o = {};
    for (const [k, X] of [['aiDeskL', 34], ['aiDeskR', 200]]) { const [x, y] = z.S(X, 284, 4), [fx, fy] = NX.room.clampWalk(...z.S(X, 352, -16), 'cat'); o[k] = { x, y, from: [fx, fy] }; }
    return o; },
  /** Піти на місце k зі spots() (застрибнути) і там — done; уже там — одразу done. */
  toSpot(k, done, run) { const s = this.spots()[k]; if (!s) return done && done(); if (this.at === k && this.alt > 0) return done && done();
    this.goTo(s.x, s.y, () => { this.at = k; done && done(); }, s.from, run); },

  /** Наступна справа: вибір за потребами та випадком. */
  decide() {
    const r = Math.random();
    if (this.hunger > .7) { if (this.hunger > .9 && NX.time > (this.hungryT || 0)) { this.hungryT = NX.time + 45; this.grr(2.6); this.look(3.4, null, false, true); }   // довго чекає — сердито «шипить» (не частіше, ніж раз на 45 с)
      return this.set('meow', 2.5, () => { NX.fx.emit('note', this.x, this.y - 22); NX.nexi.catHungry = true; }); }   // голодний — кличе Nexi (смаколик)
    if (r < .07 && this.spots().jar) return this.toSpot('jar', () => this.jarLife());                                  // (· 38) на кант жардиньєра: нюхає квітку, чхає, дрімає
    if (r < .28) { const S = this.spots(), keys = ['aiBed', 'aiBed', 'aiBed', 'sofa', 'sofaArm', 'rug'].filter(k => S[k]), s = S[keys[Math.random() * keys.length | 0]];   // найчастіше — своя лежанка
      return this.goTo(s.x, s.y, () => this.set('sleep', 14 + Math.random() * 14, () => this.set('stretch', 1.4)), s.from); }
    if (r < .44) return this.set('groom', 4 + Math.random() * 3);
    if (r < .64) { const b = NX.objects.ball; return this.goTo(b.x - 12, b.y, () => { this.set('pounce', .5, () => { b.kick((Math.random() - .3) * 160, (Math.random() - .5) * 60); }); }, null, true); }
    if (r < .7 && this.aqSpot()) return this.watchFish();                                                                 // (декор · 9) стежить за рибами
    if (r < .76 && this.flyNear()) return this.huntFly();                                                                 // (декор · 9) полює на метелика
    if (r < .82) { const n = NX.nexi; return this.goTo(n.x + (Math.random() < .5 ? -28 : 28), Math.max(n.y, 362), () => this.set('sit', 6)); }
    if (r < .92 && this.spots().aiDeskL && !(NX.virus && NX.virus.busy())) { const k = Math.random() < .5 ? 'aiDeskL' : 'aiDeskR'; return this.toSpot(k, () => this.deskLife(k)); }   // на стіл AI-центру
    const [wx, wy] = NX.room.clampWalk(60 + Math.random() * 1400, 362 + Math.random() * NX.cam.front * .7);
    return this.goTo(wx, wy, () => this.set('sit', 3));
  },
  set(pose, dur, done) { this.mode = 'act'; this.pose = pose; this.timer = dur; this.then = done || null; },

  /* ---------------- (Декор стін · 9) РУДИК І ДЕКОР: риби за склом, метелики ---------------- */
  /** Найближчий акваріум (маски скла objects/decor.js): точка підлоги під ним, низ скла на екрані. */
  aqSpot() { const MK = NX.decor && NX.decor.MK; if (!MK) return null; let best = null;
    for (const aq of ['reef', 'jelly']) { const M = MK[aq]; if (!M) continue; const cx = M.x + M.w / 2, d = Math.abs(cx - this.x); if (!best || d < best.d) best = { aq, d, cx, y1: M.y + M.h, M }; }
    return best; },
  /** Сідає під акваріумом, задирає голову й стежить за рибами (камера — на нього); лапкою «ловить» рибу — риби сахаються, як від
   *  тапу (TP.aq), а він здивовано сідає знову. */
  watchFish() { const S = this.aqSpot(); if (!S) return this.decide(); const [x, y] = NX.room.clampWalk(S.cx + (Math.random() - .5) * 24, 388, 'cat');
    return this.goTo(x, y, () => { this.dir = S.cx >= this.x ? 1 : -1; this.look(5, null, false, true);
      const swat = n => this.set('paw', 1.1, () => { const T = NX.decorLive && NX.decorLive.TP, M = S.M; if (T) T.aq = { aq: S.aq, x: S.cx + (Math.random() - .5) * M.w * .5, y: S.y1 - 4, t0: NX.time };
        this.set('gaze', 2.4 + Math.random() * 2, () => n < 1 && Math.random() < .6 ? swat(n + 1) : this.set('sit', 1.5)); });
      this.set('gaze', 3.5 + Math.random() * 3, () => swat(0)); }); },
  /** Метелик (objects/decor_live.js) не далі ніж за 160 од. по x — його номер і де він. */
  flyNear() { const DL = NX.decorLive; if (!DL || !DL.butterflyAt) return null; let best = null;
    for (let v = 0; v < 2; v++) { const B = DL.butterflyAt(v, NX.time); if (!B) continue; const d = Math.abs(B.x - this.x); if (d < 160 && (!best || d < best.d)) best = { v, d, B }; }
    return best; },
  /** Полює: підбігає під метелика, припадає (приціл: голова за ним), стрибає вгору — метелик тікає; сідає, дивиться вслід. */
  huntFly() { const F = this.flyNear(); if (!F) return this.decide(); const [x, y] = NX.room.clampWalk(F.B.x, 386, 'cat');
    return this.goTo(x, y, () => { this.flyV = F.v; this.look(5, null, false, true);
      this.set('crouch', 1.8 + Math.random(), () => { const B = NX.decorLive.butterflyAt(F.v, NX.time) || F.B, dx = Math.max(-18, Math.min(18, B.x - this.x));
        this.startJump(this.x + dx, this.y, () => { this.flyV = null; const T = NX.decorLive.TP; if (T && T.fly[F.v]) T.fly[F.v].push(NX.time); NX.fx.emit('note', this.x, this.y - 24);
          this.set('gaze', 2.2, () => this.set('groom', 2.5)); }); this.jump.hi = 40; this.jump.dur = .62; }); }, null, true); },
  /** Іти до точки (якщо ціль на висоті — спершу до точки під нею, потім стрибок). */
  goTo(x, y, done, from, run) {
    if (this.alt > 0) { const d = this.down || [this.x + 8 * this.dir, this.ground]; this.alt = 0; this.at = null; this.down = null;   // спершу зістрибнути вниз — туди, звідки застрибнув
      return this.startJump(d[0], d[1], () => this.goTo(x, y, done, from, run)); }
    if (!from) y = Math.max(y, this.FLOOR);
    this.mode = 'walk'; this.run = !!run; this.then = done; this.at = null;
    if (from) { this.target = { x: from[0], y: from[1] }; this.afterWalk = () => { this.down = from; this.startJump(x, y, done, true); }; }
    else { [x, y] = NX.room.freeAt(x, y, 'cat'); this.target = { x, y }; this.afterWalk = null; }
    this.path = NX.room.route([this.x, this.y], [this.target.x, this.target.y], 'cat');                // в обхід дивану й крісла (world/room.js)
  },
  /** Стрибок у точку (висота дуги 26, тривалість .5 с). up — на меблі: там кіт «на висоті», навіть якщо точка на екрані
   *  нижче лінії підлоги (місце біля Nexi на дивані після того, як диван поставили ближче, — y 374 > FLOOR − 4; до 29.10
   *  кіт вважав його підлогою і йшов з дивану пішки крізь диван). */
  startJump(x, y, done, up) { const dh = Math.max(0, Math.abs(this.y - y) - 50);                                       // високо (стіл AI-центру) — вища дуга й довше
    this.onSofa = false; this.mode = 'jump'; this.jump = { x0: this.x, y0: this.y, x1: x, y1: y, t: 0, hi: 26 + dh * .35, dur: .5 + dh / 380, up: !!up }; this.then = done; },
  purr(d) { if (this.hunting) this.huntEnd(); this.set('happy', d, null); this.dir = NX.nexi.x > this.x ? 1 : -1; for (let i = 0; i < 4; i++) setTimeout(() => NX.fx.emit('heart', this.x, this.y - 24), i * 500); },   // гладять — забуває про вірус (крок 15)

  /* ---------------- КРОК 15: СТІЛ AI-ЦЕНТРУ, ХАРАКТЕР, ЛАЗЕР ---------------- */
  /** На стільниці: дивиться на екран (AI бачить його на радарі), грається з голо-рибкою AI, вмивається, дрімає на теплому столі. */
  deskLife(k) {
    const A = NX.objects.aicenter, r = Math.random(); this.dir = k === 'aiDeskL' ? 1 : -1;                              // лицем до середини стола
    if (r < .4 && A && A.fishGo && NX.nexi.loc !== 'aiDesk') return this.set('sit', 1.2 + Math.random(), () => { const F = A.fishGo(this); if (F) this.play(F); else this.set('sit', 3); });
    if (r < .72) return this.set('sit', 5 + Math.random() * 4, () => this.set('groom', 3, () => this.set('sit', 2)));
    return this.set('sit', 2, () => this.set('sleep', 10 + Math.random() * 10, () => this.set('stretch', 1.4)));
  },
  /** (Декор стін · 38) На канті жардиньєра між віолою й примулою: сідає, нюхає квітку (лапка до неї), чхає — пелюстки летять
   *  (planters.js shake), камера на нього; потім дрімає на теплому канті, потягується. */
  jarLife() { const S = this.spots().jar; this.dir = -1; this.look(5, null, false, true);
    this.set('sit', 1.4 + Math.random(), () => this.set('paw', .9, () => { NX.planters.shake(S.flower); NX.fx.emit('note', this.x, this.y - 22); this.look(2.5, null, true);
      this.set('meow', .7, () => this.set('groom', 2.2, () => this.set('sleep', 9 + Math.random() * 8, () => this.set('stretch', 1.4)))); })); },
  /** Гра з голо-рибкою (objects/aicenter.js): три удари лапкою — рибка відскакує, на третій — розсипається іскрами. */
  play(F) { let n = 0; const hit = () => { if (!F.alive()) return this.set('sit', 2); this.dir = Math.sign(F.x - this.x) || this.dir;
      this.set('paw', .75, () => { F.hit(); if (++n < 3) this.set('sit', .45 + Math.random() * .5, hit); else { this.look(2.2, null, true); this.set('happy', 1.6, () => this.set('sit', 3)); } }); };
    this.look(6); hit(); },
  /** Nexi працює за столом AI-центру (activities.js: ai) — Рудик часом застрибує поруч і дивиться, як той працює. */
  joinAI() {
    if (Math.random() > .45 || this.hunting || this.mode === 'jump' || this.hunger > .7 || !this.spots().aiDeskL) return;
    const k = Math.random() < .5 ? 'aiDeskL' : 'aiDeskR';
    this.toSpot(k, () => { this.dir = k === 'aiDeskL' ? 1 : -1; this.set('sit', 8 + Math.random() * 3, () => this.set('groom', 2.5, () => this.set('sit', 2))); });
  },
  /** Трохи злий: очі червоні й світяться d секунд. Спав / вмивався — сідає (прокинувся). */
  grr(d = 1.5) { if (!this.angry()) this.angS = NX.time; this.angT = Math.max(this.angT, NX.time + d);
    if (this.mode === 'act' && /sleep|groom|happy|stretch|eat/.test(this.pose)) this.pose = 'sit'; },
  calm() { this.angT = 0; },
  angry() { return NX.time < this.angT; },
  /** Чи вільний для чужих сценок (гості): не полює на вірус. */
  free() { return !this.hunting; },
  /** ПОДІЯ — камера на Рудика sec секунд (fn — інша точка центру), потім назад до Nexi. Щойно користувач командував Nexi
   *  (< 3 с) чи вибирає скін — не відволікаємо. force — замінити довший фокус (після «пуф» — короткий гордий момент); minor —
   *  дрібниця (злий «просто так», голодний, розбудили): не одразу після іншого фокуса (< 8 с) — камера не смикається туди-сюди. */
  look(sec, fn, force, minor) { if (NX.time - NX.nexi.lastCmd < 3 || NX.ui.skinlab.open) return; if (minor && (NX.cam.foc || NX.time - NX.cam.focEnd < 8)) return;
    NX.cam.focus(fn || (() => this.x), sec, force); },
  /** Яскравість світіння очей 0..1: лазер — повна; приціл — пульсує; просто злий — м'яко, з мерехтінням. */
  glowK() { const t = NX.time; if (this.laser) return 1; if (!this.angry()) return 0;
    if (this.hunting && this.pose === 'crouch') return .7 + .3 * Math.sin(t * 34);
    return Math.min(1, (t - this.angS) * 5, (this.angT - t) * 4) * (.55 + .2 * Math.sin(t * 7)) * (Math.random() < .05 ? .4 : 1); },
  /** Вірус на столі AI-центру (actors/virus/virus.js): очі червоніють, біжить і застрибує на стіл з того боку, звідки
   *  прийшов (вірус тікає на другий край), — приціл і лазер. Уже на столі — одразу цілиться. */
  hunt(V) {
    this.hunting = V; this.laser = null; this.waitN = 0; this.grr(40);
    this.huntCam = () => { const v = NX.virus.S.v; return v && v.ph !== 'screen' && Math.abs(this.x - v.x) < 280 ? (this.x + v.x) / 2 : this.x; };   // камера — на Рудика, біля стола — і на вірус
    this.look(45, this.huntCam, true);
    const k = this.at === 'aiDeskL' || this.at === 'aiDeskR' ? this.at : this.x > V.x() + 40 ? 'aiDeskR' : 'aiDeskL';
    V.flee(k === 'aiDeskR' ? -1 : 1);
    this.set('sit', this.at === k ? .3 : .55, () => this.toSpot(k, () => this.aim(V), true));
  },
  aim(V) {
    if (this.hunting !== V || !V.alive()) return this.huntEnd();
    if (!V.onDesk()) return this.set('crouch', .25, () => this.aim(V));                                               // ще в екрані — чекає, пригнувшись
    this.dir = Math.sign(V.x() - this.x) || this.dir; V.fear(); this.look(10, this.huntCam);                               // (якщо на старті камеру не дали — тепер)
    const n = NX.nexi, coming = n.task && n.task.id === 'virus' && !(n.cur && n.cur.work && n.cur.work.pose === 'look');   // Nexi біжить подивитись — чекає його (≤ 6 с)
    if (coming && (this.waitN = (this.waitN || 0) + 1) < 24) return this.set('crouch', .25, () => this.aim(V));
    this.waitN = 0;
    this.set('crouch', .8, () => {                                                                                    // приціл: очі розжарюються
      if (this.hunting !== V || !V.alive()) return this.huntEnd();
      this.laser = { t0: NX.time, dur: .9, V }; V.zap();
      this.set('crouch', .9, () => { this.laser = null; V.kill(); this.hunting = null; this.angT = NX.time + .5; this.look(2.8, null, true);   // «пуф» — гордий момент і назад до Nexi
        this.set('happy', 1.7, () => this.set('groom', 2.6, () => this.set('sit', 2.5)));                              // гордо: «чистота»
      });
    });
  },
  /** Полювання перервалось (вірус утік / сценка Nexi забрала кота). */
  huntEnd() { if (this.hunting) NX.cam.unfocus(); this.hunting = null; this.laser = null; this.calm(); if (this.mode === 'act' && this.pose === 'crouch') this.set('sit', 2); },
  /** Промені з очей — шар поверх усього (core/loop.js сортує за y): три смуги (червоне сяйво, червоний, біле ядро), тремтять;
   *  у точці влучання — спалах, іскри летять з update. */
  fxLayer() {
    const L = this.laser; if (!L || !this.eyeW) return null;
    return { y: 999, draw: c => {
      const E = this.eyeW, [tx, ty] = L.V.hit(), k = (NX.time - L.t0) / L.dur, s = this.sc, w = k < .1 ? Math.max(.15, k / .1) : k > .86 ? Math.max(0, (1 - k) / .14) : 1;
      c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
      for (const [ex, ey] of E) { const jx = tx + (Math.random() - .5) * 1.6, jy = ty + (Math.random() - .5) * 1.6;
        for (const [lw, col] of [[3.8, 'rgba(255,30,30,.26)'], [1.6, 'rgba(255,60,50,.85)'], [.6, 'rgba(255,245,235,.95)']]) { c.strokeStyle = col; c.lineWidth = lw * s * w; c.beginPath(); c.moveTo(ex, ey); c.lineTo(jx, jy); c.stroke(); }
        NX.px.glow(c, ex, ey, 5 * s, 'rgba(255,70,50,.95)', .9); }
      NX.px.glow(c, tx, ty, (8 + 3 * Math.sin(NX.time * 40)) * s, 'rgba(255,110,50,.95)', .95 * w);
      c.restore(); } };
  },
  hitTest(x, y) { const s = NX.room.scaleAt(Math.max(this.depthY(), 352)); return Math.abs(x - this.x) < 14 * s && y > this.y - 20 * s && y < this.y + 4; },
  /** Де кіт на підлозі (на висоті — точка, з якої стрибав). */
  floorPos() { return [this.x, this.ground]; },
  /** Глибина для масштабу: де стоїть на підлозі (на дивані — точка підлоги, з якої застрибнув). */
  depthY() { return this.ground; },

  update(dt, t) {
    this.hunger = Math.min(1, this.hunger + dt / 120);
    // крок 15: зрідка буркоче «просто так» (часом — на Nexi); гості розбудили — сердито сідає й засинає знову; лазер — іскри
    if (t > this.nextGrr && this.mode === 'act' && (this.pose === 'sit' || this.pose === 'groom') && !this.angry() && !this.hunting) {
      this.nextGrr = t + 100 + Math.random() * 90; if (Math.random() < .5) this.dir = NX.nexi.x > this.x ? 1 : -1; this.grr(1.2 + Math.random() * .6); this.look(3.4, null, false, true); }
    if (this.pose === 'sleep' && this.mode === 'act' && t > this.wokeT && NX.guests && !this.hunting) {
      const g = NX.guests.S.list.find(g => g.alpha > .8 && Math.abs(g.x - this.x) < 46 && Math.abs(g.y - this.ground) < 26);
      if (g) { this.wokeT = t + 80; this.dir = Math.sign(g.x - this.x) || this.dir; this.grr(1.8); this.look(3.6, null, false, true); this.set('sit', 1.9, () => this.set('sleep', 8 + Math.random() * 8, () => this.set('stretch', 1.4))); } }
    if (this.laser && Math.random() < .85) { const [tx, ty] = this.laser.V.hit(); NX.fx.emit('spark', tx + (Math.random() - .5) * 5, ty + (Math.random() - .5) * 4, { col: Math.random() < .55 ? '#ff5a3a' : '#ffd27a' }); }
    if (this.flyV != null && this.pose === 'crouch' && NX.decorLive) { const B = NX.decorLive.butterflyAt(this.flyV, t); if (B && Math.abs(B.x - this.x) > 3) this.dir = Math.sign(B.x - this.x); }   // (· 9) приціл: голова за метеликом
    this.ft += dt; const sp = this.mode === 'walk' ? (this.run ? 80 : 34) : 0;
    if (this.ft > (this.run ? .08 : .14)) { this.ft = 0; this.frame++; }
    if (this.mode === 'walk') {
      const w = this.path && this.path.length > 1 ? { x: this.path[0][0], y: this.path[0][1] } : this.target;   // спершу кути обходу
      const dx = w.x - this.x, dy = w.y - this.y, d = Math.hypot(dx, dy);
      this.pose = this.run ? 'run' : 'walk';
      if (w !== this.target && d < Math.max(2, sp * dt)) { this.x = w.x; this.y = w.y; this.ground = this.y; this.path.shift(); }
      else if (d < Math.max(2, sp * dt)) { this.x = this.target.x; this.y = this.target.y; this.ground = this.y; if (this.afterWalk) { const f = this.afterWalk; this.afterWalk = null; f(); } else { this.mode = 'act'; this.pose = 'sit'; this.timer = 0; } }
      else { this.x += dx / d * sp * dt; this.y += dy / d * sp * dt; this.ground = this.y; if (Math.abs(dx) > .5) this.dir = Math.sign(dx); }
    } else if (this.mode === 'jump') {
      const j = this.jump; j.t += dt / j.dur; const k = Math.min(1, j.t);
      this.x = NX.px.lerp(j.x0, j.x1, k); this.y = NX.px.lerp(j.y0, j.y1, k) - Math.sin(k * Math.PI) * j.hi; this.pose = 'pounce'; this.dir = Math.sign(j.x1 - j.x0) || this.dir;
      if (k >= 1) { this.y = j.y1; if (!j.up && j.y1 >= this.FLOOR - 4) { this.ground = j.y1; this.alt = 0; } else { this.ground = j.y0; this.alt = Math.max(1, j.y0 - j.y1); } this.mode = 'act'; this.pose = 'sit'; this.timer = 0; }
    } else {
      this.timer -= dt;
      if (this.pose === 'sleep' && Math.random() < dt * .4) NX.fx.emit('z', this.x + 6 * this.dir, this.y - 14);
      if (this.timer <= 0) { const f = this.then; this.then = null; if (f) f(); if (this.timer <= 0 && this.mode === 'act') this.decide(); }
    }
  },
  layer() {
    const onSofa = NX.objects.sofa && NX.objects.sofa.holds(this.x, this.y, this.ground);   // на дивані — поверх нього (диван може стояти ближче до глядача)
    const bs = NX.room.scaleAt(this.depthY()) * .82, bw = CAT_W * bs / 2 + 3;                // межі малюнка — для віддзеркалення (core/loop.js)
    return { y: onSofa ? NX.cfg.SOFA.y + 1 : this.y + (this.alt > 0 ? 6 : 0), refl: !onSofa && !(this.alt > 0), box: [this.x - bw, this.y - CAT_H * bs - 3, this.x + bw, this.y + 3], draw: c => {   // на висоті — без віддзеркалення
      const s = NX.room.scaleAt(this.depthY()) * .82, w = CAT_W * s, h = CAT_H * s;   // .82 — кіт у пропорції до Nexi
      if (this._rt !== NX.time) { this._rt = NX.time; const hot = !!this.laser || (!!this.hunting && this.pose === 'crouch');
        drawCat(this.pose, this.frame, NX.time, this.cv, null, { angry: this.angry() || hot, hot }); this.eyes = drawCat.eyes; }   // злий — червоні очі (cat_sprite.js)
      c.save(); c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(this.x, this.y + 1, 9 * s, 2 * s, 0, 0, Math.PI * 2); c.fill();
      c.imageSmoothingEnabled = false; c.translate(this.x, 0); c.scale(this.dir, 1); c.drawImage(this.cv, -w / 2, this.y - h + s, w, h); c.restore();
      this.sc = s; this.eyeW = this.eyes && this.eyes.map(([gx, gy]) => [this.x + this.dir * (gx - CAT_W / 2) * s, this.y - h + s + gy * s]);   // очі в кімнаті (світіння, лазер)
      const gk = this.glowK(); if (gk > 0 && this.eyeW) this.eyeW.forEach(([ex, ey]) => NX.px.glow(c, ex, ey, (2 + 2.6 * gk) * s, 'rgba(255,45,35,.95)', .35 + .55 * gk));
    } };
  },
};
NX.addObject({ id: 'catFx', layers() { const l = NX.cat.fxLayer(); return l ? [l] : []; } });   // лазер з очей — поверх усього (крок 15)
