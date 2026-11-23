/* ============================================================================
 * actors/nexi/relics.js — ЗДІБНОСТІ РЕЛІКВІЙ У РУКАХ NEXI (NX.objects.relics)
 * ----------------------------------------------------------------------------
 * Власник (06.11): «реліквії в руках — кожна зі своєю здібністю… до кожної реліквії — свій ефект, коли тапаєш на Nexi».
 * Власник (23.11): «пропрацювати краще реліквії та взаємодії з ними… додай ще катану… реалізовуй усе».
 * Коли показується (skins.js: ACCS slot 'hand', зараз у look.hand):
 *   ІНОДІ САМ (idle): Nexi вільний і стоїть на підлозі чи на доку — раз на 30–70 с (update);
 *   ПОДВІЙНИЙ ТАП ПО NEXI (nexi.js: hi -> tap(id, busy)): перший тап — привітання; другий поспіль — здібність реліквії,
 *     емоція й коротка фраза (act.relic.<id>, 4 мови). Nexi зайнятий (крісло, капсула, політ) — лише ефект, без пози;
 *   НА КАРТЦІ NFT (nft_card.js): cardFx — та сама здібність у піксель-арті картки раз за цикл 4 с, без випадковості.
 * ЩО ЗМІНИЛОСЯ 23.11:
 *   • у КОЖНОЇ реліквії своя постановка (poses.js: relicPose — ключові кадри руки, присіду й кута предмета за фазою k);
 *     раніше було 5 спільних поз на 12 реліквій, а «Меч» і «Лазерний меч» мали одну здібність;
 *   • поки триває здібність, предмет малює ЦЕЙ файл шаром поверх Nexi — цілим і з обертанням (у спрайті 48×56 піднятий
 *     молот чи меч обрізався краєм); кадр предмета — sprite.js renderItem, оновлюється 10 разів/с;
 *   • ефекти — піксельні блоки розміром у піксель спрайта (купол щита, стовп світла, блискавка, крига), без гладких ліній;
 *   • нова реліквія КАТАНА.
 *   • ПАРА «скін + реліквія» (skins.js: SKIN_SIG.pair — самурай + катана, король + Екскалібур, іній + посох…): здібність
 *     посилена (S.act.pow) — аура кольору скіна, енергія довкола; катана б'є навхрест, шипів посоха більше, стовп ширший;
 *   • ВЗАЄМОДІЇ: реліквія лишає свій слід під час швидкого руху Nexi й сплеск на фініші (trail); м'ячик відлітає від удару
 *     молота / меча / хвилі тризуба, котиться до магніту, примерзає від посоха (ballPush); Рудик тікає від грому й хвилі,
 *     б'є лапою кульку й пелюстки, мружиться від палички, гріється біля факела (actors/cat/cat.js: react);
 *     за роботою реліквія висить за спиною (sprite.js, блок 9);
 *     зоряна паличка шле зірку до найближчої рослини на стіні — та цвіте (NX.decorGrow.water); тризуб збурює риб і медуз
 *     (NX.decorAqua.stir); удар молота двічі освітлює всю кімнату спалахом;
 *   • УТРИМАННЯ ПАЛЬЦЯ на Nexi заряджає реліквію — відпустив після 0,55 с: посилена здібність (charge / release; ui/input.js).
 * Здібності (D — тривалість, с):
 *   hammer    ГРОМОВИЙ МОЛОТ — замах за плече й удар об підлогу: у місце удару б'є блискавка з неба, підлогою біжать світні тріщини
 *   blade     ЛАЗЕРНИЙ МЕЧ — два повні оберти леза: неонові відбитки леза й слід вістря по колу
 *   sword     МЕЧ — лицарський салют (зблиск на гарді), потім клинок у підлогу й на коліно: сталева хвиля в обидва боки
 *   katana    КАТАНА — іай: стійка з клинком біля стегна, зблиск, миттєвий розчерк — довга тонка лінія розрізу, з неї сиплються пелюстки сакури
 *   gauntlet  ЗОЛОТА РУКАВИЦЯ — кулак угору, сяйво росте, клацання — золоті іскри й біти
 *   excalibur ЕКСКАЛІБУР — двома руками над головою: з неба падає піксельний стовп світла, зорі
 *   staff     КРИШТАЛЕВИЙ ПОСОХ — удар п'ятою посоха об підлогу: довкола виростають крижані шипи, наприкінці розсипаються
 *   trident   МОРСЬКИЙ ТРИЗУБ — відвів назад і випад: підлогою вперед котяться три гребені хвилі, бульбашки
 *   wand      ЗОРЯНА ПАЛИЧКА — кінчик малює два кола: слід із зірочок, кільце зірок, сердечка
 *   balloon   КУЛЬКА — Nexi підстрибує тричі, кулька тягне вгору, пил
 *   torch     ФАКЕЛ — підняв і поводить з боку в бік: полум'я з чаші, тепле сяйво, жаринки
 *   magnet    МАГНІТ — полюсами вперед: біти злітаються до полюсів
 *   shield    ЩИТ NEXI — стає в захист: над ним піксельний купол із панелей, біти відскакують
 * Без текстів у сцені (усе — світло й частинки); фрази — лише словники.
 * ========================================================================== */
NX.objects.relics = (() => {
  const TAU = Math.PI * 2, r = Math.random;
  const POSE = { hammer: 'relic', blade: 'relic', gauntlet: 'raise', excalibur: 'relic', staff: 'relic', trident: 'relic', wand: 'relic', balloon: 'hop', torch: 'relic', magnet: 'relic', shield: 'relic', sword: 'relic', katana: 'relic' };
  const DUR = { hammer: 2.4, blade: 2, gauntlet: 2, excalibur: 2.6, staff: 2.6, trident: 1.9, wand: 2.2, balloon: 2.2, torch: 2.2, magnet: 2, shield: 2.4, sword: 2.4, katana: 2.6 };
  const MOOD = { hammer: 'cool', blade: 'cool', gauntlet: 'cool', excalibur: 'idea', staff: 'surprise', trident: 'happy', wand: 'love', balloon: 'happy', torch: 'happy', magnet: 'surprise', shield: 'cool', sword: 'cool', katana: 'cool' };
  const LEN = { hammer: 11, blade: 29, sword: 22, katana: 29, excalibur: 24, staff: 25, trident: 24, wand: 15, torch: 14, magnet: 12, shield: 0 };   // від кисті до «робочого» кінця, пікселів спрайта
  const IW = 44, IH = 60, PV = { r: [22, 47], l: [24, 43] };                           // полотно предмета й точка кисті на ньому (renderItem: права — W/2, H-13; щит — ліва)
  const S = { act: null, next: 0, flash: 0, bits: [], fxT: {} };
  const n = () => NX.nexi, Q = v => Math.round((v || 0) * 4 / 3);
  const hash = (a, b) => { let h = (a * 374761393 + b * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  let itemCv = null, itemKey = '';
  /** Кадр предмета (10 разів/с, один на всі шари). */
  function item(id, t) { const key = id + '|' + Math.floor(t * 10); if (!itemCv) itemCv = document.createElement('canvas'); if (key !== itemKey) { itemKey = key; renderItem(id, t, itemCv, IW, IH); } return itemCv; }

  /** Геометрія Nexi в кімнаті: центр X, підлога Y, масштаб s (1 піксель спрайта), верх, напрям. */
  function geo() {
    const N = n(), s = NX.room.scaleAt(Math.max(N.depthY(), 352)) * N.zoom * SPRITE_K, top = FOOT * s, d = N.dir < 0 ? -1 : 1;
    return { X: N.x, Y: N.y, s, top, d, up: [N.x + d * 6 * s, N.y - top - 4 * s], fwd: [N.x + d * 14 * s, N.y - top * .55], mid: [N.x, N.y - top * .5] };
  }
  /** Кисть із предметом у кімнаті за позою p (та сама арифметика, що в sprite.js: плечі 12 / 35, y 36) і кінець предмета на відстані len. */
  function hand(G, p) {
    const L = p.item && p.item.hand === 'l', a = L ? p.la : p.ra, ex = (L ? 12 : 35) + Q(a.x), ey = 36 + Q(p.bob) + Q(a.y), ph = NX.nexiPhys, sq = ph && isFinite(ph.sq) ? ph.sq : 1,   /* пружина зараз дає NaN (відоме питання до власника) — тоді без стискання, як і сам спрайт */ fx = 1 + (1 - sq) * .55;
    const x = G.X + G.d * (ex - 24) * G.s * fx, y = G.Y - (FOOT - ey) * G.s * sq, ang = p.item ? p.item.ang : 0;
    return { x, y, ang, fx, sq, L, tip: (len, side = 0) => [x + G.d * (Math.sin(ang) * len + Math.cos(ang) * side) * G.s, y - (Math.cos(ang) * len - Math.sin(ang) * side) * G.s] };
  }
  const free = () => { const N = n(); return !N.cur && !N.queue.length && !NX.ui.skinlab.open && (N.loc === 'floor' || N.loc === 'dock') && N.alpha > .9 && !N.rot; };
  /** Що зараз показує Nexi (для poses.js: поза 'relic'): { id, k } або null. */
  const cur = () => S.act && !S.act.light ? { id: S.act.id, k: Math.min(1, (NX.time - S.act.t0) / S.act.D) } : null;
  /** Поза реліквії за фазою (картка NFT, майстерня). */
  const pose = (id, k, t) => relicPose(id, k, t);

  /** Почати здібність реліквії id (why: 'tap' | 'idle'). Повертає false, якщо Nexi зайнятий або здібність уже триває. */
  function show(id, why, light, force) {
    if (S.act || !POSE[id]) return false; if (!light && !free()) return false;
    const N = n(), t = NX.time, D = DUR[id];
    S.seed = null; S.room = -9;
    S.act = { id, t0: t, D, why, done: {}, light: !!light, pow: !!force || skinPair(N.look, id) }; S.flash = 0; S.bits = []; S.fxT = {}; S.cut2 = null;
    if (S.act.pow) { const th = THEMES[N.look.theme] || THEMES.standard; S.act.col = th.acc; NX.fx.emit('ring', N.x, N.y, { col: th.acc, gr: 130, ttl: .6 }); NX.fx.emit('ring', N.x, N.y, { col: '#ffd45a', gr: 80, ttl: .5 }); }   // ПАРА «скін + реліквія»: посилена здібність
    N.lastCmd = t; N.emote(MOOD[id], D + .4);
    if (!light) { N.back = false; N.temp = POSE[id]; N.tempT = t + D; N.hiT = 0; }
    if (why === 'tap') N.say(NX.pick('act.relic.' + id));
    if (id === 'balloon') N.hops = 0;
    return true;
  }
  /** УТРИМАННЯ ПАЛЬЦЯ НА NEXI (ui/input.js): charge(true) — реліквія заряджається (енергія злітається до Nexi, сяйво росте; через
   *  0,55 с — готово: кільце й золотий блиск); charge(false) — скасовано. release(tap) — палець відпущено: заряд готовий ->
   *  посилена здібність (pow) і true; не встиг зарядитися -> false (тоді спрацює звичайний тап). */
  const CHG = .55;
  function charge(on) { S.chg = on && !S.act ? { t0: NX.time } : null; }
  function release(tap) { const C = S.chg; S.chg = null; if (!C || NX.time - C.t0 < CHG) return false; const N = n(), busy = !!(N.cur || N.queue.length); N.lastCmd = NX.time; return show(N.look.hand, 'tap', busy || !free(), true) || true; }
  /** Подвійний тап по Nexi з реліквією в руці (nexi.js: hi); busy — Nexi зайнятий: лише ефект, без пози. */
  const tap = (id, busy) => show(id, 'tap', busy);

  /** РЕЛІКВІЯ ЗМІНЮЄ РУХ (23.11): поки Nexi швидко переміщується з реліквією в руці, за ним лишається її слід (іскри молота,
   *  пелюстки катани, бульбашки тризуба, сніг посоха…), а на фініші — коротке кільце й сплеск того самого. */
  const TRAIL = { hammer: ['spark', ['#9af6ff', '#ffffff']], blade: ['line', ['#ff4fd8', '#3be8ff']], sword: ['line', ['#ffffff', '#c6d0ee']], katana: ['snow', ['#ffb6dc', '#ff8fc8']], gauntlet: ['bit', ['#ffd45a', '#fff6c0']],
    excalibur: ['spark', ['#ffe9a0', '#ffffff']], staff: ['snow', ['#ffffff', '#cfefff']], trident: ['bubble', ['#9ad8ff', '#4ac0ff']], wand: ['spark', ['#ffe27a', '#ff7af0']], balloon: ['heart', ['#ff5ae0', '#ff9af0']],
    torch: ['fire', ['#ffe27a', '#ff7a2a']], magnet: ['bit', ['#ff6a6a', '#6a8aff']], shield: ['bit', ['#3be8ff', '#7af4ff']] };
  function trail(dt, t) {
    const N = n(), hd = N.look.hand, T = TRAIL[hd], sp = Math.hypot(N.x - (S.px ?? N.x), N.y - (S.py ?? N.y)) / Math.max(dt, 1e-3); S.px = N.x; S.py = N.y;
    if (!T || S.act) { S.mv = 0; return; }
    const G = geo(), F = NX.fx, col = () => T[1][r() * 2 | 0], fast = sp > 150 && sp < 3000 && N.alpha > .5 && !!N.cur;
    if (fast) { S.mv = (S.mv || 0) + dt; S.mvT = t;
      if (r() < (hd === 'balloon' ? .12 : .55)) F.emit(T[0], G.X - G.d * (4 + r() * 10) * G.s, G.Y - (6 + r() * 30) * G.s, T[0] === 'line' ? { w: 9, col: col(), vx: -G.d * 30 } : T[0] === 'snow' ? { col: col(), vy: 10 + r() * 14, ttl: 1.1 } : { col: col(), ttl: .6 }); }
    else if (S.mv > .22 && t - S.mvT > .05 && sp < 40) { S.mv = 0;                                                                // фініш
      F.emit('ring', G.X, G.Y, { col: T[1][0], gr: 70, ttl: .45 }); for (let i = 0; i < 8; i++) F.emit(T[0] === 'line' ? 'spark' : T[0], G.X + (r() - .5) * 26 * G.s, G.Y - r() * 14 * G.s, T[0] === 'snow' ? { col: col(), vy: 8 + r() * 10, vx: (r() - .5) * 40, ttl: 1 } : { col: col() }); }
    else if (t - (S.mvT || 0) > .3) S.mv = 0;
  }
  /** М'ячик і Рудик відгукуються на здібність (objects/ball.js, actors/cat/cat.js: react). */
  const cat = kind => { const C = NX.cat; if (C && C.react) C.react(kind); };
  function ballPush(x, y, R, pw, dirX) { const b = NX.objects.ball; if (!b) return; const dx = b.x - x, dy = (b.y - y) * 2, d = Math.hypot(dx, dy) || 1; if (d > R) return; const k = pw * (1 - d / R * .6); b.kick(dirX != null ? dirX * k : dx / d * k, dirX != null ? 0 : dy / d * k * .4); }

  function update(dt, t) {
    const N = n(), hd = N.look.hand;
    trail(dt, t);
    if (S.chg) { const G = geo(), a = t - S.chg.t0, th = THEMES[N.look.theme] || THEMES.standard;                              // заряджання: енергія злітається до Nexi
      if (a > .15 && r() < .7) { const an = r() * TAU, R = (50 - Math.min(30, a * 40)) * G.s; NX.fx.emit('bit', G.X + Math.cos(an) * R, G.Y - G.top * .5 + Math.sin(an) * R * .7, { col: r() < .5 ? th.acc : '#ffd45a', vx: -Math.cos(an) * R * 2.2, vy: -Math.sin(an) * R * 1.5, ttl: .4 }); }
      if (a >= CHG && !S.chg.ready) { S.chg.ready = 1; NX.nexiPhys.kick(1.4); NX.fx.emit('ring', G.X, G.Y, { col: '#ffd45a', gr: 60, ttl: .4 }); N.emote('cool', 1.2); } }
    if (S.flash > 0) S.flash -= dt;
    // іноді сам — раз на 30–70 с, лише вільний на підлозі
    if (!S.act) { if (!S.next) S.next = t + 20 + r() * 30; if (hd && t > S.next && !N.talking && t - N.lastCmd > 6) { S.next = t + 30 + r() * 40; show(hd, 'idle'); } return; }
    const A = S.act, k = (t - A.t0) / A.D;
    if (k >= 1 || (N.cur && !A.light) || N.look.hand !== A.id) { S.act = null; S.bits = []; if (N.temp === POSE[A.id]) N.tempT = 0; S.next = t + 30 + r() * 40; return; }
    const G = geo(), F = NX.fx, P = relicPose(A.id, k, t), H = hand(G, A.light ? { ra: { x: 3, y: -8 }, la: { x: -3, y: 5 }, bob: 0, item: P.item } : P), tip = H.tip(LEN[A.id] || 0);
    if (A.pow && r() < .55) F.emit('energy', G.X + (r() - .5) * 40 * G.s, G.Y - r() * G.top * .5, { col: r() < .5 ? A.col : '#ffd45a' });   // пара: енергія здіймається довкола весь час здібності
    const once = (key, at, f) => { if (k >= at && !A.done[key]) { A.done[key] = 1; S.fxT[key] = t; f(); } }, kick = v => NX.nexiPhys.kick(v);
    switch (A.id) {
      case 'hammer': {                                                               // .54 — удар об підлогу: блискавка з неба в місце удару, тріщини, грім; .72 і .86 — відлуння
        once('hit', .54, () => { S.imp = [tip[0], G.Y]; S.flash = .35; S.room = t; kick(2.6); F.emit('ring', tip[0], G.Y, { col: '#9af6ff', gr: 150, ttl: .6 });
          S.cracks = [...Array(7)].map((_, i) => ({ a: -Math.PI * (i + .5) / 7 * 2 + r() * .3, L: 26 + r() * 30, sd: i * 11 + (r() * 90 | 0) }));
          ballPush(tip[0], G.Y, 240, 260); cat('boom');
          for (let i = 0; i < 18; i++) F.emit('spark', tip[0] + (r() - .5) * 12, G.Y - 2, { col: r() < .6 ? '#9af6ff' : '#ffffff', vx: (r() - .5) * 200, vy: -40 - r() * 130 }); for (let i = 0; i < 6; i++) F.emit('dust', tip[0] + (r() - .5) * 30, G.Y); });
        [.72, .86].forEach((at, i) => once('echo' + i, at, () => { kick(1); F.emit('ring', S.imp[0], G.Y, { col: '#9af6ff', gr: 70, ttl: .4 }); }));
        if (k < .5 && r() < .35) F.emit('spark', tip[0] + (r() - .5) * 8, tip[1], { col: '#9af6ff', vy: -30 - r() * 40, ttl: .35 });
        break; }
      case 'blade': {                                                                // оберти: неонові риски з вістря, наприкінці — кільце
        if (k > .14 && k < .82 && r() < .8) F.emit('line', tip[0], tip[1], { w: 6, col: r() < .5 ? '#ff4fd8' : '#3be8ff', vx: (r() - .5) * 30, vy: (r() - .5) * 30 });
        once('end', .82, () => { kick(1.2); F.emit('ring', G.X, G.Y, { col: '#ff4fd8', gr: 100, ttl: .5 }); F.emit('ring', G.X, G.Y, { col: '#3be8ff', gr: 60, ttl: .5 }); });
        break; }
      case 'sword': {                                                                // .52 — клинок у підлогу: сталева хвиля, іскри
        once('plant', .52, () => { S.imp = [tip[0], G.Y]; S.flash = .15; kick(2); ballPush(tip[0], G.Y, 180, 180); F.emit('ring', tip[0], G.Y, { col: '#dfe8ff', gr: 120, ttl: .6 });
          for (let i = 0; i < 14; i++) F.emit('spark', tip[0], G.Y - 2, { col: r() < .7 ? '#ffffff' : '#ffe27a', vx: (r() - .5) * 160, vy: -30 - r() * 90 }); for (let i = 0; i < 5; i++) F.emit('dust', tip[0] + (r() - .5) * 24, G.Y); });
        break; }
      case 'katana': {                                                               // .36 — зблиск на цубі; .46 — розчерк; далі з лінії розрізу сиплються пелюстки
        once('glint', .36, () => F.emit('spark', H.x, H.y, { col: '#ffffff', vx: 0, vy: 0, g: 0, ttl: .2 }));
        once('cut', .46, () => { S.flash = .12; kick(1.6); ballPush(G.X + G.d * 60, G.Y, 150, 200, G.d); setTimeout(() => cat('toy'), 500); S.cut = { x0: G.X + G.d * 22 * G.s, x1: G.X + G.d * 170 * G.s, y: G.Y - G.top * .56, d: G.d, s: G.s };
          for (let i = 0; i < 8; i++) F.emit('line', G.X + G.d * r() * 120 * G.s, S.cut.y + (r() - .5) * 6, { w: 14, col: '#ffffff', vx: G.d * 160 }); });
        const C = S.cut, age = t - (S.fxT.cut || t);
        if (C && age > .12 && age < 1.25 && r() < .75) { const q = r(), x = C.x0 + (C.x1 - C.x0) * q; F.emit('snow', x, C.y - q * 8 * C.s, { col: ['#ffb6dc', '#ff8fc8', '#ffe0f0'][r() * 3 | 0], vx: -C.d * (4 + r() * 14), vy: 12 + r() * 16, ttl: 1.3 + r() * .8, s: 1.6 }); }
        if (A.pow) once('cut2', .6, () => { S.flash = .1; kick(1.2); S.cut2 = { x0: C.x1, x1: C.x0 - C.d * 20 * C.s, y: C.y - 22 * C.s, d: -C.d, s: -C.s * 2.6 }; });   // пара із самураєм: другий розчерк навхрест
        once('split', .58, () => { const mx = (C.x0 + C.x1) / 2; for (let i = 0; i < 10; i++) F.emit('spark', mx + (r() - .5) * 60, C.y, { col: '#ffffff', vx: (r() - .5) * 60, vy: (r() < .5 ? -1 : 1) * (20 + r() * 50), g: 30, ttl: .45 }); });
        break; }
      case 'gauntlet': {                                                             // кулак угору, сяйво росте; .5 — клацання: золоті іскри й біти
        once('snap', .5, () => { S.flash = .25; kick(1.6); for (let i = 0; i < 18; i++) F.emit('spark', G.up[0], G.up[1], { col: r() < .6 ? '#ffd45a' : '#fff6c0', vx: (r() - .5) * 140, vy: -r() * 120 }); F.emit('ring', G.X, G.Y, { col: '#ffd45a', gr: 100 }); });
        if (k > .5 && r() < .4) F.emit('bit', G.X + (r() - .5) * 40 * G.s, G.Y - r() * G.top, { col: '#ffd45a', ttl: .6 });
        break; }
      case 'excalibur': {                                                            // .3 — стовп світла з неба; зорі падають уздовж нього
        once('beam', .3, () => { S.flash = .2; kick(1); F.emit('ring', G.X, G.Y, { col: '#fff6c0', gr: 90 }); });
        once('fade', .86, () => F.emit('ring', G.X, G.Y, { col: '#ffd45a', gr: 130, ttl: .6 }));
        if (k > .3 && k < .88 && r() < .5) F.emit('spark', G.X + (r() - .5) * 34 * G.s, G.Y - G.top - 10 - r() * 90, { col: r() < .7 ? '#ffffff' : '#ffe9a0', vx: 0, vy: 40 + r() * 50, g: 0, ttl: .9 });
        break; }
      case 'staff': {                                                                // .3 — удар посохом: крижане кільце й шипи; .86 — шипи розсипаються
        once('strike', .3, () => { kick(1.6); { const b = NX.objects.ball; if (b && Math.hypot(b.x - G.X, (b.y - G.Y) * 2) < 150) { b.vx = 0; b.vy = 0; } }   /* м'ячик поруч примерзає — зупиняється */ F.emit('ring', G.X, G.Y, { col: '#9af6ff', gr: 120, ttl: .7 });
          const nI = A.pow ? 13 : 8; S.ice = [...Array(nI)].map((_, i) => { const a = (i + .5) / nI * Math.PI + (r() - .5) * .2; return { a, R: A.pow && i % 2 ? 50 : 36, h: (9 + r() * 14) * (A.pow ? 1.25 : 1), w: 3 + (r() * 3 | 0), dl: r() * .12 }; }); });   // пара з «Інеєм»: шипів більше й вони вищі
        once('shatter', .86, () => { (S.ice || []).forEach(q => { const x = G.X + Math.cos(q.a) * q.R * G.s, y = G.Y + Math.sin(q.a) * q.R * .25 * G.s; for (let i = 0; i < 4; i++) F.emit('spark', x, y - r() * q.h * G.s, { col: r() < .5 ? '#cfefff' : '#ffffff', vx: (r() - .5) * 70, vy: -20 - r() * 50 }); }); });
        if (k > .25 && k < .86 && r() < .5) { const a = t * 6 + r() * .4, rr = 12 + k * 22; F.emit('snow', G.X + Math.cos(a) * rr * G.s, G.Y - G.top * (.2 + k * .9), { vy: -10, vx: 0, ttl: 1.2 }); }
        if (r() < .3) F.emit('spark', tip[0] + (r() - .5) * 8, tip[1] - 4, { col: '#cfefff', vy: -20 });
        break; }
      case 'trident': {                                                              // .42 — випад: хвиля вперед і бризки
        once('wave', .42, () => { kick(1.4); if (NX.decorAqua && NX.decorAqua.stir) NX.decorAqua.stir(t);   /* риби й медузи в акваріумах метушаться */ ballPush(G.X + G.d * 70, G.Y, 180, 280, G.d); cat('boom'); S.wave = { x: tip[0], y: G.Y, d: G.d, s: G.s }; F.emit('ring', G.X + G.d * 18, G.Y, { col: '#4ac0ff', gr: 120, ttl: .7 });
          for (let i = 0; i < 16; i++) F.emit('bubble', tip[0] + G.d * r() * 30, G.Y - r() * 20, { vx: G.d * (20 + r() * 70), vy: -10 - r() * 30 }); });
        if (k > .42 && r() < .5) F.emit('bubble', tip[0] + G.d * (10 + r() * 70), G.Y - r() * 12, { vx: G.d * 30, vy: -20 });
        break; }
      case 'wand': {                                                                 // зорі з кінчика, .5 — кільце зірок, наприкінці — сердечка
        if (k > .12 && k < .9 && r() < .8) F.emit('spark', tip[0] + (r() - .5) * 4, tip[1] + (r() - .5) * 4, { col: ['#ffe27a', '#ff7af0', '#ffffff'][r() * 3 | 0], vx: (r() - .5) * 16, vy: -6 - r() * 16, g: 14, ttl: .9 });
        once('plant', .3, () => { const DL = NX.decorLive, L = DL && DL.LP && DL.LP.filter(q => q.x0 != null).sort((p, q) => Math.abs((p.x0 + p.x1) / 2 - G.X) - Math.abs((q.x0 + q.x1) / 2 - G.X))[0];   // найближча жива рослина на стіні: до неї летить зірка — і вона цвіте
          if (L && Math.abs((L.x0 + L.x1) / 2 - G.X) < 520) S.seed = { L, x0: tip[0], y0: tip[1], x1: (L.x0 + L.x1) / 2, y1: (L.y0 + L.y1) / 2, t0: t }; });
        if (S.seed) { const q = (t - S.seed.t0) / .8, E = S.seed; if (q >= 1) { E.L.shake = t; if (NX.decorGrow) NX.decorGrow.water(E.L.key, t); for (let i = 0; i < 14; i++) F.emit('spark', E.x1 + (r() - .5) * 14, E.y1 + (r() - .5) * 10, { col: ['#ffe27a', '#ff7af0', '#b6ff8a'][i % 3], vx: (r() - .5) * 50, vy: -10 - r() * 40, g: 40, ttl: .9 }); S.seed = null; }
          else if (r() < .8) { const e = q * q * (3 - 2 * q); F.emit('spark', E.x0 + (E.x1 - E.x0) * e, E.y0 + (E.y1 - E.y0) * e - Math.sin(q * Math.PI) * 30, { col: r() < .5 ? '#ffe27a' : '#ffffff', vx: 0, vy: 6, g: 20, ttl: .5 }); } }
        once('ring', .5, () => { cat('love'); for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; F.emit('spark', G.X + Math.cos(a) * 26 * G.s, G.Y - G.top * .5 + Math.sin(a) * 18 * G.s, { col: '#ffe27a', vx: Math.cos(a) * 34, vy: Math.sin(a) * 34 - 10, g: 0, ttl: .8 }); } });
        if (k > .6 && r() < .25) F.emit('heart', G.X + (r() - .5) * 30 * G.s, G.Y - G.top);
        break; }
      case 'balloon': {                                                              // три підскоки — кулька тягне вгору
        once('cat', .05, () => cat('toy'));
        [.1, .45, .8].forEach((at, i) => once('h' + i, at, () => { kick(2.4); for (let q = 0; q < 5; q++) F.emit('dust', G.X + (r() - .5) * 20, G.Y); }));
        break; }
      case 'torch': {                                                                // полум'я з чаші, жаринки
        once('cat', .2, () => cat('warm'));
        if (r() < .9) F.emit('fire', tip[0] + (r() - .5) * 5 * G.s, tip[1] - 2 * G.s, { vy: -50 - r() * 50 });
        if (r() < .25) F.emit('spark', tip[0] + (r() - .5) * 10, tip[1] - 6, { col: '#ff9a3a', vy: -40 - r() * 60, g: 20, ttl: .9 });
        break; }
      case 'magnet': {                                                               // біти злітаються до полюсів
        if (r() < .7 && k > .15 && k < .8) { const a = r() * TAU, rr = 60 + r() * 40; S.bits.push({ x: tip[0] + Math.cos(a) * rr, y: tip[1] + Math.sin(a) * rr * .6, col: r() < .5 ? '#ff6a6a' : '#6a8aff', age: 0 }); }
        S.bits.forEach(b => { b.age += dt; const dx = tip[0] - b.x, dy = tip[1] - b.y, dd = Math.hypot(dx, dy) || 1, sp = (60 + b.age * 200) * dt; b.x += dx / dd * Math.min(sp, dd); b.y += dy / dd * Math.min(sp, dd); if (dd < 3) { b.dead = 1; F.emit('spark', b.x, b.y, { col: '#ffffff', vx: 0, vy: -10, ttl: .2 }); } });
        S.bits = S.bits.filter(b => !b.dead && b.age < 2);
        if (k > .15 && k < .85) { const b = NX.objects.ball; if (b) { const dx = tip[0] - b.x, dy = G.Y - b.y, d = Math.hypot(dx, dy * 2) || 1; if (d < 340 && d > 14) b.kick(dx / d * 520 * dt, dy / d * 200 * dt); if (d < 44) { b.vx *= .8; b.vy *= .8; } } }   // м'ячик котиться до магніту
        break; }
      case 'shield': {                                                               // купол, біти відскакують (місце удару по куполу спалахує — S.hits)
        once('dome', .15, () => { F.emit('ring', G.X, G.Y, { col: '#3be8ff', gr: 80 }); kick(1); S.hits = []; });
        if (k > .2 && k < .85 && r() < .25) { const a = -r() * Math.PI; S.hits.push({ a, t }); F.emit('bit', G.X + Math.cos(a) * 38 * G.s, G.Y - G.top * .45 + Math.sin(a) * 34 * G.s, { col: '#3be8ff', vx: Math.cos(a) * 70, vy: Math.sin(a) * 70, ttl: .5 }); }
        break; }
    }
  }

  /** Шар поверх Nexi: сам предмет (цілим, з обертанням) і піксельні ефекти здібності. */
  function layers(t) {
    const A = S.act; if (!A && S.flash <= 0 && !S.chg) return [];
    const N = n(), G = geo(), Pg = NX.px;
    return [{ y: N.depthY() + 1, draw: c => {
      const u = Math.max(.75, G.s), blk = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(Math.round(x / u) * u, Math.round(y / u) * u, w * u, h * u); };
      c.save(); c.imageSmoothingEnabled = false;
      if (S.flash > 0) { c.globalCompositeOperation = 'lighter'; Pg.glow(c, G.X, G.Y - G.top * .5, G.top * 1.4, 'rgba(255,255,255,.9)', Math.min(1, S.flash * 3)); c.globalCompositeOperation = 'source-over'; }
      if (S.chg && t - S.chg.t0 > .15) { const a = t - S.chg.t0, q = Math.min(1, a / CHG), R = (46 - 26 * q) * G.s, cy = G.Y - G.top * .5; c.globalCompositeOperation = 'lighter';              // заряджання: кільце з блоків стискається довкола Nexi, сяйво росте
        for (let i = 0; i < 20; i++) { const an = i / 20 * TAU + t * 3; blk(G.X + Math.cos(an) * R, cy + Math.sin(an) * R * .8, q >= 1 ? 2 : 1, q >= 1 ? 2 : 1, q >= 1 ? (i % 2 ? '#ffffff' : '#ffd45a') : `rgba(255,212,90,${.4 + .5 * q})`); }
        Pg.glow(c, G.X, cy, G.top * (.5 + .5 * q), 'rgba(255,212,90,.6)', .2 + .3 * q + (q >= 1 ? .15 * Math.sin(t * 14) : 0)); c.globalCompositeOperation = 'source-over'; }
      if (!A) { c.restore(); return; }
      if (t - S.room < .32) { const a = t - S.room, al = a < .08 ? .22 : a < .14 ? .04 : a < .2 ? .14 : .14 * (1 - (a - .2) / .12); c.fillStyle = `rgba(190,230,255,${al})`; c.fillRect(G.X - 3000, G.Y - 2000, 6000, 4000); }   // грім: кімнату двічі освітлює спалах
      const k = Math.min(1, (t - A.t0) / A.D), P = relicPose(A.id, k, t), H = hand(G, P), tip = H.tip(LEN[A.id] || 0), age = key => t - (S.fxT[key] ?? 1e9), fr = Math.floor(t * 20);
      const drawItem = (ang, alpha) => { const pv = PV[H.L ? 'l' : 'r']; c.save(); c.globalAlpha = alpha * N.alpha; c.translate(H.x, H.y); c.scale(G.d * H.fx, H.sq); c.rotate(ang); c.drawImage(item(A.id, t), -pv[0] * G.s, -pv[1] * G.s, IW * G.s, IH * G.s); c.restore(); };
      const star = (x, y, R, col) => { blk(x - R * u, y, 2 * R + 1, 1, col); blk(x, y - R * u, 1, 2 * R + 1, col); blk(x - u, y - u, 3, 3, col); };   // чотирипроменева піксельна зірка
      // ---- сам предмет (поки триває постановка; «легкий» показ — Nexi зайнятий, предмет лишається в його руці) ----
      if (!A.light && P.noItem && !N.cur && !N.queue.length) {                                    // лише коли спрайт справді в позі реліквії (nexi.js: layer) — інакше предмет уже є в руці спрайта
        if (A.id === 'blade' && k > .14 && k < .84) { c.globalCompositeOperation = 'lighter'; for (let g = 4; g >= 1; g--) drawItem(relicPose('blade', k - g * .014, t).item.ang, .3 - g * .055); c.globalCompositeOperation = 'source-over'; }
        if (A.id === 'katana' && age('cut') >= 0 && age('cut') < .12) { c.globalCompositeOperation = 'lighter'; for (let g = 1; g <= 4; g++) drawItem(H.ang - g * .42, .34 - g * .06); c.globalCompositeOperation = 'source-over'; }   // віяло розчерку
        drawItem(H.ang, 1);
      }
      c.globalCompositeOperation = 'lighter';
      if (A.pow) { const m = k < .15 ? k / .15 : k > .85 ? (1 - k) / .15 : 1, cc = hx(A.col); Pg.glow(c, G.X, G.Y - G.top * .5, G.top * 1.25, `rgba(${cc[0]},${cc[1]},${cc[2]},.55)`, m * (A.id === 'excalibur' ? .16 : .3 + .1 * Math.sin(t * 9))); }   // пара: аура кольору скіна
      switch (A.id) {
        case 'hammer': {
          Pg.glow(c, tip[0], tip[1], 14 * G.s, 'rgba(120,230,255,.8)', .3 + .3 * Math.sin(t * 20));
          const a = age('hit'), I = S.imp;
          if (I && a >= 0 && a < .45) {                                                 // блискавка з неба: ламана з блоків — блакитна оболонка й біле осердя, дві гілки
            const al = 1 - a / .45, f2 = Math.floor(t * 24), H0 = 250, nn = 16; let px = I[0], py = I[1];
            for (let q = 1; q <= nn; q++) { const y = I[1] - H0 * q / nn, x = I[0] + (hash(q * 7, f2) - .5) * 30 * (q < nn ? 1 : .3), st = Math.max(1, Math.round((py - y) / u));
              for (let j = 0; j <= st; j++) { const xx = px + (x - px) * j / st, yy = py + (y - py) * j / st; blk(xx - 2 * u, yy, 5, 1, `rgba(90,210,255,${al * .55})`); blk(xx - u, yy, 3, 1, `rgba(190,245,255,${al})`); blk(xx, yy, 1, 1, `rgba(255,255,255,${al})`); }
              if (q === 5 || q === 10) for (let j = 1; j < 9; j++) blk(x + (q === 5 ? 1 : -1) * j * 2 * u, y - j * u + (hash(j, f2) - .5) * 3 * u, 2, 1, `rgba(190,245,255,${al * (1 - j / 9)})`);
              px = x; py = y; }
            Pg.glow(c, I[0], I[1], 40 * G.s, 'rgba(180,240,255,.9)', al * .8);
          }
          if (I && a >= 0 && a < 1.3 && S.cracks) { const al = a < .9 ? 1 : (1.3 - a) / .4, gr = Math.min(1, a / .18);   // світні тріщини в підлозі розбігаються від удару
            S.cracks.forEach(q => { const st = Math.round(q.L * gr); for (let j = 2; j < st; j++) { const w = (hash(j >> 2, q.sd) - .5) * 5, x = I[0] + (Math.cos(q.a) * j + Math.sin(q.a) * w) * u, y = I[1] + (Math.sin(q.a) * j * .3) * u;
              blk(x, y, 1, 1, j > st - 3 ? `rgba(255,255,255,${al})` : `rgba(110,225,255,${al * (1 - j / q.L * .6)})`); } }); }
          break; }
        case 'blade': {                                                               // слід вістря по колу — неонові блоки, що гаснуть
          if (k > .14 && k < .86) for (let g = 0; g < 16; g++) { const kk = k - g * .009; if (kk < .14) break; const q = hand(G, relicPose('blade', kk, t)).tip(29); blk(q[0] - u, q[1] - u, g < 3 ? 3 : 2, g < 3 ? 3 : 2, g % 2 ? `rgba(255,79,216,${.9 - g * .05})` : `rgba(59,232,255,${.9 - g * .05})`); }
          Pg.glow(c, tip[0], tip[1], 10 * G.s, 'rgba(120,240,255,.8)', .5);
          break; }
        case 'sword': {
          if (k > .18 && k < .44) { const R = 2 + Math.round(Math.abs(Math.sin((k - .18) / .26 * Math.PI)) * 4); star(H.x, H.y - 2 * G.s, R, '#ffffff'); }   // зблиск на гарді під час салюту
          const a = age('plant'), I = S.imp;
          if (I && a >= 0 && a < .7) { const al = 1 - a / .7, ds = a * 130 * G.s;                                                   // сталева хвиля: шеврони розбігаються в обидва боки
            [-1, 1].forEach(sd => { for (let w = 0; w < 3; w++) { const x = I[0] + sd * (ds - w * 9 * u); if ((x - I[0]) * sd < 4) continue; for (let j = 0; j < 4; j++) blk(x - sd * j * u, I[1] - j * u, 2, 1, `rgba(${w ? '190,205,240' : '255,255,255'},${al * (1 - w * .3)})`); } });
            Pg.glow(c, I[0], I[1], 18 * G.s, 'rgba(230,240,255,.8)', al * .6); }
          break; }
        case 'katana': {
          const g = age('glint'); if (g >= 0 && g < .16) star(H.x, H.y, 2 + Math.round((1 - g / .16) * 4), '#ffffff');
          for (const [a, C] of [[age('cut'), S.cut], [age('cut2'), S.cut2]]) if (C && a >= 0 && a < .9) {                                                  // лінія розрізу: миттєво простягається, тримається, потім розсипається «шахівницею»
            const rev = Math.min(1, a / .07), nn = Math.round(Math.abs(C.x1 - C.x0) / u), fade = a < .4 ? 1 : 1 - (a - .4) / .5;
            for (let i = 0; i < nn * rev; i += 1) { const q = i / nn, x = C.x0 + (C.x1 - C.x0) * q, y = C.y - q * 8 * C.s, th = q < .08 || q > .92 ? 0 : 1;
              if (a > .4 && hash(i, 3) > fade) continue;
              blk(x, y, 1, 1, `rgba(255,255,255,${fade})`); if (th) { blk(x, y - u, 1, 1, `rgba(255,150,210,${fade * .7})`); blk(x, y + u, 1, 1, `rgba(255,150,210,${fade * .45})`); } }
            if (a < .12) Pg.glow(c, C.x0 + (C.x1 - C.x0) * rev, C.y - rev * 8 * C.s, 16 * G.s, 'rgba(255,220,240,.9)', .8);
          }
          break; }
        case 'gauntlet': Pg.glow(c, G.up[0], G.up[1], (10 + 10 * k) * G.s, 'rgba(255,212,90,.9)', .3 + .3 * Math.sin(t * 12)); break;
        case 'excalibur': if (k > .3) {                                                // стовп світла: суцільне осердя й «шахові» краї, що течуть униз
          const a = Math.min(1, (k - .3) * 5) * (k > .86 ? (1 - k) / .14 : 1), y0 = G.Y - G.top - 190, hh = G.Y - y0, rows = Math.round(hh / (2 * u));
          (A.pow ? [[-13, 26, .07], [-7, 14, .13], [-4, 8, .2], [-1, 3, .45]] : [[-7, 14, .16], [-4, 8, .22], [-1, 3, .5]]).forEach(([dx, w, al]) => blk(G.X + dx * u, y0, w, hh / u, `rgba(255,246,200,${al * a})`));
          for (let j = 0; j < rows; j++) { const y = y0 + j * 2 * u, ph2 = (j - fr) & 3; [-11, -9, 8, 10].forEach((dx, q) => { if (((q + ph2) & 3) < 2) blk(G.X + dx * u, y, 2, 2, `rgba(255,236,170,${a * (q === 0 || q === 3 ? .16 : .3) * Math.min(1, j / 8)})`); }); }
          Pg.glow(c, tip[0], tip[1], 16 * G.s, 'rgba(255,255,255,.9)', a * .6); Pg.glow(c, G.X, G.Y, 30 * G.s, 'rgba(255,240,180,.8)', a * .35);
        } break;
        case 'staff': {
          Pg.glow(c, tip[0], tip[1] - 2 * G.s, 14 * G.s, 'rgba(160,230,255,.9)', .3 + .3 * Math.sin(t * 8));
          if (S.ice && k < .86) { c.globalCompositeOperation = 'source-over';             // крижані шипи: ростуть по черзі, грань світла / темна, біла верхівка
            S.ice.forEach(q => { const gr = Math.max(0, Math.min(1, (k - .3 - q.dl) / .14)), hh = Math.round(q.h * gr), x = G.X + Math.cos(q.a) * q.R * G.s, y = G.Y + Math.sin(q.a) * q.R * .25 * G.s;
              for (let j = 0; j < hh; j++) { const w = Math.max(1, Math.round(q.w * (1 - j / q.h))), yy = y - (j + 1) * u; blk(x - w * u, yy, w, 1, j > hh - 3 ? '#ffffff' : '#cff4ff'); blk(x, yy, w, 1, j > hh - 3 ? '#e6fbff' : j % 5 === 4 ? '#8a7aef' : '#6ac4f0'); }
              if (hh > 2) { blk(x - (q.w + 1) * u, y - u, 1, 1, '#0a0f2e'); blk(x + q.w * u, y - u, 1, 1, '#0a0f2e'); } });
            c.globalCompositeOperation = 'lighter'; if (k > .3) Pg.glow(c, G.X, G.Y, 44 * G.s, 'rgba(150,225,255,.7)', .25); }
          break; }
        case 'trident': {
          const a = age('wave'), W = S.wave;
          if (W && a >= 0 && a < 1) for (let w = 0; w < 3; w++) { const q = (a - w * .12) / .75; if (q < 0 || q > 1) continue; const x = W.x + W.d * q * 120 * W.s, al = Math.min(1, (1 - q) * 1.6), hh = 5 + Math.round(8 * Math.sin(q * Math.PI));   // три гребені хвилі котяться вперед: тіло хвилі, біла піна на гребені й завиток
            for (let j = 0; j < hh; j++) { const w = 4 + (hh - j) * 2, x0 = x - W.d * j * u - (W.d < 0 ? 0 : w * u); blk(x0, W.y - (j + 1) * u, w, 1, j >= hh - 2 ? `rgba(255,255,255,${al})` : j % 3 === 2 ? `rgba(150,225,255,${al * .9})` : `rgba(60,160,255,${al * .75})`); }
            blk(x + W.d * 2 * u - (W.d < 0 ? 3 * u : 0), W.y - (hh + 1) * u, 3, 1, `rgba(255,255,255,${al})`); blk(x + W.d * 4 * u, W.y - hh * u, 2, 1, `rgba(255,255,255,${al})`); }
          Pg.glow(c, tip[0], tip[1], 9 * G.s, 'rgba(122,244,255,.8)', .4);
          break; }
        case 'wand': {                                                                // слід із зірочок за кінчиком
          if (k > .15 && k < .88) for (let g = 0; g < 6; g++) { const kk = k - g * .03; if (kk < .15) break; const q = hand(G, relicPose('wand', kk, t)).tip(15); star(q[0], q[1], g < 2 ? 2 : 1, ['#ffe27a', '#ff7af0', '#ffffff'][(g + fr) % 3]); }
          break; }
        case 'torch': Pg.glow(c, tip[0], tip[1] - 2 * G.s, 22 * G.s, 'rgba(255,170,70,.8)', .45 + .2 * Math.sin(t * 17) + .1 * Math.sin(t * 31)); break;
        case 'magnet': { S.bits.forEach(b => blk(b.x, b.y, 2, 2, b.col)); Pg.glow(c, tip[0], tip[1], 12 * G.s, 'rgba(255,120,120,.6)', .3);
          if (k > .15 && k < .85) for (let j = 0; j < 3; j++) { const q = ((t * 1.6 + j / 3) % 1), R = (6 + q * 16) * G.s; for (let i = -3; i <= 3; i++) blk(tip[0] + G.d * Math.cos(i * .3) * R, tip[1] + Math.sin(i * .3) * R, 1, 1, `rgba(154,246,255,${(1 - q) * .8})`); }   // хвилі поля від полюсів
          break; }
        case 'shield': if (k > .15) {                                                  // купол із панелей: обід, меридіани й паралелі з блоків, спалахи в місцях ударів
          const a = (k < .3 ? (k - .15) / .15 : k > .86 ? (1 - k) / .14 : 1), R = 38 * G.s, cy = G.Y - G.top * .45, pt = (ang, m) => [G.X + Math.cos(ang) * R * m, cy + Math.sin(ang) * R * .95];
          for (let i = 0; i <= 44; i++) { const an = Math.PI + i / 44 * Math.PI, q = pt(an, 1); blk(q[0] - u, q[1] - u, 2, 2, `rgba(59,232,255,${a * (i % 2 ? .9 : .55)})`); }
          [-.62, -.22, .22, .62].forEach(m => { for (let i = 1; i < 22; i++) { if ((i + fr) % 3 === 0) continue; const q = pt(Math.PI + i / 22 * Math.PI, 1); blk(G.X + (q[0] - G.X) * Math.abs(m) * (m < 0 ? -1 : 1) * (q[0] < G.X ? -1 : 1), q[1], 1, 1, `rgba(122,244,255,${a * .45})`); } });
          [.35, .7].forEach(lv => { const y = cy - R * .95 * lv, hw = R * Math.sqrt(1 - lv * lv); for (let x = -hw; x <= hw; x += 3 * u) blk(G.X + x, y, 2, 1, `rgba(122,244,255,${a * .4})`); });
          for (let x = -R; x <= R; x += 2 * u) blk(G.X + x, cy + Math.sin(x / R * 9 + t * 6) * u, 1, 1, `rgba(59,232,255,${a * .7})`);
          (S.hits || []).forEach(h => { const ag = t - h.t; if (ag > .35) return; const q = pt(h.a, 1), R2 = 1 + Math.round(ag / .35 * 4); star(q[0], q[1], R2, `rgba(255,255,255,${1 - ag / .35})`); });
          Pg.glow(c, G.X, cy, R, 'rgba(59,232,255,.5)', a * .35);
        } break;
      }
      c.restore();
    } }];
  }

  /** ЗДІБНІСТЬ НА КАРТЦІ NFT (nft_card.js): піксель-арт 96×128, Nexi стоїть у (24, HOR-51), ноги на HOR+1. k — фаза здібності 0..1
   *  (вікно всередині циклу картки), fr — номер кадру (для «тремтіння» без випадковості). Малює поверх Nexi: спершу сам предмет
   *  (постановка та сама, що в кімнаті), потім ефект. */
  const H = hash;
  let cardCv = null;
  function cardFx(x, id, k, fr, HOR) {
    const P = relicPose(id, k, fr / 12), px = (X, Y, c) => { x.fillStyle = c; x.fillRect(Math.round(X), Math.round(Y), 1, 1); }, ring = (cx, r2, c) => { for (let a = 0; a < 40; a++) px(cx + Math.cos(a / 40 * TAU) * r2, HOR + 1 + Math.sin(a / 40 * TAU) * r2 * .3, c); };
    let hx = 63, hy = HOR - 31, tx = hx, ty = HOR - 46;
    if (P.noItem && P.item) {                                                          // предмет у руці — цілим, з обертанням
      const L = P.item.hand === 'l', a = L ? P.la : P.ra, pv = PV[L ? 'l' : 'r']; hx = 24 + (L ? 12 : 35) + Q(a.x); hy = HOR + 1 - FOOT + 36 + Q(P.bob) + Q(a.y);
      const len = LEN[id] || 0; tx = hx + Math.sin(P.item.ang) * len; ty = hy - Math.cos(P.item.ang) * len;
      if (!cardCv) cardCv = document.createElement('canvas'); renderItem(id, fr / 12, cardCv, IW, IH);
      x.save(); x.imageSmoothingEnabled = false; x.translate(hx, hy); x.rotate(P.item.ang); x.drawImage(cardCv, -pv[0], -pv[1]); x.restore();
    }
    x.save(); x.globalCompositeOperation = 'lighter';
    switch (id) {
      case 'hammer': { if (k > .54 && k < .9) { const a = 1 - (k - .54) / .36, ix = Math.min(88, tx);
          for (let q = 0; q < 34; q++) { const y = HOR - q * (HOR - 8) / 34, xx = ix + (H(q >> 1, fr) - .5) * 9; px(xx, y, `rgba(255,255,255,${a})`); px(xx - 1, y, `rgba(120,230,255,${a * .7})`); px(xx + 1, y, `rgba(120,230,255,${a * .7})`); }
          if (k < .62) { x.fillStyle = `rgba(255,255,255,${(.62 - k) * 6})`; x.fillRect(3, 3, 90, 122); } ring(ix, 6 + (k - .54) * 70, `rgba(154,246,255,${a * .8})`);
          for (let q = 0; q < 5; q++) for (let j = 2; j < 12 * Math.min(1, (k - .54) * 8); j++) px(ix + Math.cos(q * 1.26 + .4) * j + (H(j >> 1, q) - .5) * 2, HOR + 1 + Math.sin(q * 1.26 + .4) * j * .3, `rgba(110,225,255,${a})`); }
        break; }
      case 'blade': { if (k > .14 && k < .86) for (let g = 0; g < 12; g++) { const kk = k - g * .012; if (kk < .14) break; const p2 = relicPose('blade', kk, 0), a2 = p2.item.ang; px(24 + 35 + Q(p2.ra.x) + Math.sin(a2) * 29, HOR + 1 - FOOT + 36 + Q(p2.bob) + Q(p2.ra.y) - Math.cos(a2) * 29, g % 2 ? '#ff4fd8' : '#3be8ff'); } break; }
      case 'sword': { if (k > .52 && k < .95) { const a = 1 - (k - .52) / .43; ring(tx, 4 + (k - .52) * 60, `rgba(223,232,255,${a})`); for (let q = 0; q < 6; q++) { const q0 = (k - .52) * 2.3; px(tx + (H(q, 2) - .5) * 40 * q0, HOR - q0 * 22 * H(q, 5) + q0 * q0 * 14, '#ffffff'); } }
        if (k > .18 && k < .44) { const R = 1 + Math.round(Math.abs(Math.sin((k - .18) / .26 * Math.PI)) * 3); for (let j = -R; j <= R; j++) { px(hx + j, hy - 2, '#ffffff'); px(hx, hy - 2 + j, '#ffffff'); } } break; }
      case 'katana': { if (k > .46) { const a = k < .7 ? 1 : Math.max(0, 1 - (k - .7) / .25), rev = Math.min(1, (k - .46) / .03);
          for (let i = 0; i < 82 * rev; i++) { if (k > .7 && H(i, 3) > a) continue; const xx = 8 + i, yy = HOR - 27 - i * .06; px(xx, yy, `rgba(255,255,255,${a})`); if (i > 6 && i < 76) px(xx, yy - 1, `rgba(255,150,210,${a * .7})`); }
          for (let q = 0; q < 9; q++) { const q0 = ((k - .5) * 1.6 + H(q, 7)) % 1; if (k > .5) px(12 + H(q, 1) * 72 - q0 * 6, HOR - 27 + q0 * 26, q & 1 ? '#ffb6dc' : '#ff8fc8'); } }
        break; }
      case 'gauntlet': { x.fillStyle = `rgba(255,212,90,${.25 + .2 * Math.sin(k * TAU * 3)})`; x.beginPath(); x.arc(63, HOR - 33, 5 + k * 4, 0, TAU); x.fill();
        if (k > .5) { const q0 = (k - .5) * 2; for (let q = 0; q < 10; q++) { const a = q / 10 * TAU, r2 = 3 + q0 * 14; px(63 + Math.cos(a) * r2, HOR - 33 + Math.sin(a) * r2 - q0 * 6, q & 1 ? '#ffd45a' : '#fff6c0'); } } break; }
      case 'excalibur': { if (k > .3) { const a = Math.min(1, (k - .3) * 5) * (k > .86 ? (1 - k) / .14 : 1); x.fillStyle = `rgba(255,246,200,${a * .22})`; x.fillRect(36, 10, 24, HOR - 9); x.fillStyle = `rgba(255,246,200,${a * .3})`; x.fillRect(42, 10, 12, HOR - 9); x.fillStyle = `rgba(255,255,255,${a * .45})`; x.fillRect(46, 10, 4, HOR - 9);
          for (let j = 10; j < HOR; j += 2) [33, 34, 61, 62].forEach((cx, q) => { if (((q + (j >> 1) - fr) & 3) < 2) px(cx, j, `rgba(255,236,170,${a * .5})`); });
          for (let q = 0; q < 5; q++) px(38 + H(q, 9) * 20, 14 + ((H(q, 11) + k * 2) % 1) * (HOR - 20), '#ffffff'); } break; }
      case 'staff': { for (let q = 0; q < 8; q++) { const a = k * TAU * 2 + q / 8 * TAU, r2 = 8 + k * 14; px(48 + Math.cos(a) * r2, HOR - 10 - k * 34 - q, q & 1 ? '#ffffff' : '#cfefff'); } if (k > .3) ring(48, 8 + k * 20, 'rgba(154,246,255,.5)');
        if (k > .3 && k < .86) { x.globalCompositeOperation = 'source-over'; for (let q = 0; q < 6; q++) { const sx = 22 + q * 10 + (q > 2 ? 2 : 0), hh = Math.round((6 + H(q, 4) * 10) * Math.min(1, (k - .3 - q * .015) / .14)); for (let j = 0; j < hh; j++) { const w = Math.max(1, Math.round(3 * (1 - j / 16))); x.fillStyle = j > hh - 3 ? '#ffffff' : '#cff4ff'; x.fillRect(sx - w, HOR + 2 - j, w, 1); x.fillStyle = j > hh - 3 ? '#e6fbff' : '#6ac4f0'; x.fillRect(sx, HOR + 2 - j, w, 1); } } x.globalCompositeOperation = 'lighter'; }
        break; }
      case 'trident': { if (k > .42) { ring(tx - 8, (k - .42) * 50, 'rgba(74,192,255,.8)'); for (let w = 0; w < 3; w++) { const q = (k - .42 - w * .07) / .45; if (q < 0 || q > 1) continue; const xx = Math.min(90, 60 + q * 30), hh = 2 + Math.round(3 * Math.sin(q * Math.PI)); for (let j = 0; j < hh; j++) for (let i = 0; i < 3 + hh - j; i++) px(xx - j + i, HOR - j, j === hh - 1 ? '#ffffff' : 'rgba(90,190,255,.8)'); } } break; }
      case 'wand': { for (let q = 0; q < 8; q++) { const a = q / 8 * TAU + k * 2, r2 = 6 + k * 16; px(tx + Math.cos(a) * r2 * .5, ty + Math.sin(a) * r2 * .4, ['#ffe27a', '#ff7af0', '#ffffff'][q % 3]); } if (k > .6 && (fr & 2)) { px(44, hy - 14 - (k - .6) * 20, '#ff5ae0'); px(45, hy - 14 - (k - .6) * 20, '#ff5ae0'); } break; }
      case 'torch': { for (let q = 0; q < 6; q++) { const q0 = (H(q, 2) + k * 3) % 1; px(tx - 2 + H(q + 7, fr >> 1) * 4, ty - 2 - q0 * 12, q0 < .5 ? '#ffe27a' : '#ff7a2a'); } x.fillStyle = 'rgba(255,170,70,.25)'; x.beginPath(); x.arc(tx, ty - 2, 7 + Math.sin(k * TAU * 4), 0, TAU); x.fill(); break; }
      case 'magnet': { for (let q = 0; q < 8; q++) { const a = H(q, 4) * TAU, r2 = 22 * (1 - ((k * 1.5 + H(q, 6)) % 1)); px(Math.min(92, tx) + Math.cos(a) * r2, ty + Math.sin(a) * r2 * .6, q & 1 ? '#ff6a6a' : '#6a8aff'); } break; }
      case 'shield': { const a = k < .2 ? k / .2 : k > .85 ? (1 - k) / .15 : 1; for (let i = 0; i <= 40; i++) { const an = Math.PI + i / 40 * Math.PI; px(48 + Math.cos(an) * 25, HOR - 22 + Math.sin(an) * 27, `rgba(59,232,255,${a * (i % 2 ? .9 : .5)})`); }
        [-.5, .5].forEach(m => { for (let i = 1; i < 20; i++) if ((i + fr) % 3) px(48 + Math.cos(Math.PI + i / 20 * Math.PI) * 25 * m, HOR - 22 + Math.sin(Math.PI + i / 20 * Math.PI) * 27, `rgba(122,244,255,${a * .45})`); });
        for (let q = 0; q < 4; q++) { const ang = Math.PI + (H(q, 5) + k) % 1 * Math.PI; px(48 + Math.cos(ang) * 27, HOR - 22 + Math.sin(ang) * 29, '#ffffff'); } break; }
      case 'balloon': { for (let q = 0; q < 4; q++) px(40 + H(q, 8) * 16, HOR + 1 - H(q, fr >> 2) * 3, 'rgba(200,180,255,.7)'); break; }
    }
    x.restore();
  }
  /** Вікно здібності в циклі картки (u 0..1): [.5, .92] -> k 0..1, інакше -1. Поза Nexi в цьому вікні — pose(id, k, t). */
  const cardK = u => u > .5 && u < .92 ? (u - .5) / .42 : -1;
  return { S, show, tap, charge, release, update, layers, POSE, DUR, busy: () => !!S.act, cur, pose, cardFx, cardK };
})();
