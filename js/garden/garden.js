/* ============================================================================
 * garden/garden.js — БОТАНІЧНИЙ САД: СЦЕНА, ВХІД І ВИХІД, ДОТИКИ, ЖИТТЯ NEXI В САДУ (NX.garden)
 * ----------------------------------------------------------------------------
 * Власник (13.11): сакура-ліфт «переносить нас до ботанічного саду… ми переходимо на нову область». (14.11): «на задньому
 * фоні — великий парк з різних врятованих дерев… маємо реалістично зробити догляд за всіма рослинами, які ми їмо».
 * Сад — окрема сцена просто неба: позаду парк (garden/park.js: небо з добою, гори, ліс, озеро — паралакс), спереду на
 * галявині вздовж стежки стоять ДІЛЯНКИ — по одній технології на кожну (ділянка ≈ екран телефона, гортається вбік).
 * Одиниці й масштаб ті самі, що в кімнаті, тому Nexi тут справжній: та сама черга дій, ранець, бабли, частинки, камера.
 * Поки сад відкритий, кімната стоїть на паузі (її не видно й не рахуємо — швидкодія).
 *
 * ВХІД: сценарій `sakura` (garden/sakura_lift.js) опускає острівець у шахту й кличе NX.garden.enter(lift). Тут острівець
 * із сакурою й Nexi спускається з неба в промені на кам'яну плиту стежки, Nexi зістрибує (сальто — lift.jump) і береться
 * до роботи. ВИХІД: тап по острівцю (сценарій gUp) — Nexi застрибує (lift.plan), острівець іде вгору, далі lift.back().
 * Будь-яка кімнатна команда з діалогу (диван, зони…) — Nexi сам спершу піднімається ліфтом, а тоді виконує її.
 * ДІЛЯНКИ: кожна — окремий файл garden/sec_<id>.js, реєструється через addSector({ id, act, S, hit, buildG, update, draw,
 * tap, route }). Тап по ділянці: по рослині — картка культури; деінде — Nexi йде доглядати (route). Довго без команд —
 * береться сам (у саду він господар: «Nexi — ботанік», docs/UNIVERSE.md).
 * КАРТКА культури — та сама картка, що й у кімнаті (розмітка #guide, стилі .guide): номер у каталозі, назва мовою
 * сайту, латина, технологія ділянки й стадія, скільки зібрано і скільки культур у саду.
 * ДОБА: G.tod іде, поки сад відкритий (park.js: DAY с на круг); після сцени — відтінок доби множенням, світло — поверх.
 * УРОЖАЙ: G.harvest(id, n) — лічильник зібраного за культурами, пам'ятається в localStorage.
 *
 * МІСТОК ДО КІМНАТИ (bridge) — єдине місце, де сад торкається чужих модулів, і лише під час роботи сторінки (файли ядра
 * не змінено): поки сад відкритий, кадр малює сад (замість NX.loop.frame), тапи й наведення йдуть у сад (NX.input),
 * перешкоди для ходи — садові (NX.room.obstacles: лише острівець), а межі камери й ходи — межі саду (NX.cfg.ROOM_X0 /
 * ROOM_X1 на час саду; при зміні розміру екрана кімната перебудовується у своїх). Сад закрився — усе як було. Чистіше було б
 * мати для цього рядок у core/loop.js, як у вечірки (NX.party.on), — прохання до чату «Ядро» записане в docs/chats/garden.md.
 * ========================================================================== */
NX.garden = (() => {
  const P = NX.px, CAT = NX.gardenCat, PK = NX.gardenPark, KEY = 'nexora.garden.v1';
  const SEC = {}, ACTS = { gUp: 1 };
  const G = {
    on: false, fade: 0, beam: 0, first: true, idle: 0, after: null, hover: null,
    tod: .2,                                                         // час доби в саду 0..1 (garden/park.js): іде, лише поки сад відкритий
    addSector(s) { SEC[s.id] = s; ACTS[s.act] = 1; return s; },
    sector: id => SEC[id],
    /** Наскільки зараз ніч, 0..1 (джмелі сплять, фрамуги зачинені, горять ліхтарі). */
    night: () => PK.nightK(G.tod),
    /** Урожай: скільки зібрано кожної культури — пам'ятається між відвідинами (localStorage). */
    harvest(id, n) { got[id] = (got[id] || 0) + n; try { localStorage.setItem(KEY, JSON.stringify(got)); } catch (e) { /* приватний режим — рахуємо лише до перезавантаження */ } },
    got: id => got[id] || 0,
  };
  let got = {}; try { got = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { got = {}; }
  const lift = () => NX.objects.sakura;

  // ---------- прогрів: растри саду збираються шматками, поки людина ще в кімнаті ----------
  let warmG = null, warmed = false;
  function* warmAll() { yield* PK.buildG(); for (const s of Object.values(SEC)) if (s.buildG) yield* s.buildG(); }
  function warmStep(ms) { if (warmed) return; warmG = warmG || warmAll(); const t0 = performance.now(); while (performance.now() - t0 < ms) { if (warmG.next().done) { warmed = true; return; } } }
  NX.addObject({ id: 'gardenScene',                                                                             // у кімнаті сад — лише тихий прогрів і layout
    update() { if (!warmed && !G.on && NX.boot && NX.boot.done && NX.time > (G.t0 || (G.t0 = NX.time)) + 4 && !(NX.loop.frames % 4)) warmStep(1); },   // по шматочку раз на 4 кадри — кімната не смикається
    layout() { if (warmed) PK.layout(); },
  });

  // ---------- місток до кімнати ----------
  let bridged = false, camRoom = [0, 1, 0];
  const RB = [NX.cfg.ROOM_X0, NX.cfg.ROOM_X1];
  /** Межі для камери й ходи: галерея (сад ширший за кімнату) або знову кімната. */
  function bounds(garden) { NX.cfg.ROOM_X0 = garden ? CAT.X0 : RB[0]; NX.cfg.ROOM_X1 = garden ? CAT.X1 : RB[1]; }
  /** Вид саду: на комп'ютері камера наближається, щоб стіна із секторами займала більшу частину екрана, а внизу лишалися
   *  острівець і доріжка (у кімнаті комп'ютер бачить усю ширину — тут галерея довша й гортається за Nexi). Телефон — як є. */
  function view() {
    const cam = NX.cam, Lf = lift(), bottom = Lf.cy + Lf.RY + 58, vh0 = cam.vh / cam.k0, z = cam.mobile ? 1 : Math.max(1, Math.min(2.2, vh0 / (bottom + 44)));
    cam.setZoom(z, 0, 0, true); if (cam.z > 1) cam.top = Math.max(-(NX.cfg.ROOM_H + cam.front0 - cam.vh / cam.k), Math.min(cam.top0, cam.vh / cam.k - bottom));
    cam.free = false; cam.jump(NX.nexi.loc === 'lift' ? Lf.cx + 12 : NX.nexi.x);
  }
  function bridge() {
    if (bridged) return; bridged = true;
    const L0 = NX.loop, r0 = L0.resize; L0.resize = function () { if (!G.on) return r0.call(this); bounds(false); r0.call(this); bounds(true); view(); };   // кімната перебудовується у своїх межах
    const L = NX.loop, f0 = L.frame; L.frame = function () { return G.on ? frame(this) : f0.call(this); };
    const I = NX.input, t0 = I.onTap, h0 = I.onHover; I.onTap = function (x, y) { return G.on ? tap(x, y) : t0.call(this, x, y); }; I.onHover = function (x, y) { return G.on ? hover(x, y) : h0.call(this, x, y); };
    const R = NX.room, o0 = R.obstacles; R.obstacles = function (who) { if (!G.on) return o0.call(this, who); const f = lift().foot; return [[f[0] - 13, f[1] + 13, f[2] - 3, f[3] + 4]]; };
    NX.acts.gUp = { color: '#ff86c4', route: () => { const Lf = lift();                                         // на острівець — тим самим стрибком із сальто, що й у кімнаті (lift.plan)
      return [{ do: () => Lf.plan() }, { loc: 'lift' }, { face: 1 }, { say: NX.pick('act.gUp.lines') },
        { work: { pose: 'wave', dur: 2.4, tick: (d, q) => ride(q, -1) } }, { do: () => exit() }]; } };
    Object.values(SEC).forEach(s => { NX.acts[s.act] = { color: s.S.col, route: n => s.route(n) }; });
  }

  // ---------- ліфт у саду: острівець між люком у склепінні й плитою на підлозі ----------
  const rise = () => lift().cy + NX.cam.top0 + 40;                                                              // на скільки острівець піднімається (за верх екрана)
  function ride(q, dir) {                                                                                       // dir +1 — приїжджає вниз, −1 — їде вгору
    const e = q < .5 ? 2 * q * q : 1 - 2 * (1 - q) * (1 - q), up = dir > 0 ? 1 - e : e, Lf = lift(), n = NX.nexi;
    Lf.drop = -up * rise() / Lf.D; G.beam = up > 0 ? 1 : 0; n.y = n.gy = Lf.stand()[1] - up * rise();
  }
  function enter(Lf) {
    bridge(); while (!warmed) warmStep(50);
    const n = NX.nexi, st = Lf.stand(); camRoom = [NX.cam.x, NX.cam.z, NX.cam.top]; bounds(true); G.on = true; G.fade = 1; G.idle = 0; G.after = null; NX.input.hover = null; NX.loop.canvas.style.cursor = 'default';
    n.task = null; n.loc = 'lift'; Lf.aboard = true; Lf.bob = Lf.bobV = 0; n.x = st[0]; n.dy = st[1]; n.alpha = 1; n.zoom = 1; ride(0, 1); view();
    const first = G.first; G.first = false;
    n.queue = [{ work: { pose: 'wave', dur: 2.4, tick: (d, q) => ride(q, 1) } }, { do: () => { G.beam = 0; Lf.petals(16); Lf.bobV = 30 * Lf.k; } }, Lf.jump(() => Lf.exitPoint()), { loc: 'floor' }, { face: 1 },
      { do: () => n.emote('love', 2.6) }, { say: first ? NX.t('garden.hello.first') : NX.pick('garden.hello.lines') }, { wait: first ? 2.2 : 1.2 },
      { do: () => { if (first && SEC.drip) n.do('gDrip', false); } }];
  }
  function exit() {
    const n = NX.nexi, Lf = lift(), id = G.after; G.on = false; bounds(false); NX.cam.free = false; NX.cam.top = camRoom[2]; NX.cam.setZoom(camRoom[1], 0, 0, true); NX.cam.x = camRoom[0]; NX.cam.jump(Lf.cx); G.after = null; G.beam = 0; n.task = null; hideCard();
    Lf.back(); if (id) n.queue.push({ do: () => n.do(id) });                                                    // кімнатна команда, заради якої піднімались
  }

  // ---------- картка культури (та сама, що в кімнаті: #guide) ----------
  let cardT = 0;
  function hideCard() { const el = document.getElementById('guide'); if (el && G.cardOn) el.classList.remove('show'); G.cardOn = false; clearTimeout(cardT); }
  /** id — культура каталогу, st — 0 сіянець / 1 росте / 2 достигло, sprite — її растр (вписується в рамку картки). */
  function card(id, st, sprite) {
    const el = document.getElementById('guide'), crop = CAT.crop(id), T = NX.t; if (!el || !crop) return;
    if (NX.decorGuide) NX.decorGuide.hide();
    el.querySelector('b').textContent = T('garden.card.head') + ' · ' + T('decor.guide.no') + String(crop.no).padStart(2, '0');
    el.querySelector('.gn').textContent = T('garden.crop.' + id); el.querySelector('small').textContent = crop.latin;
    el.querySelector('.gw').textContent = String(T('garden.sec.' + crop.sec)).toUpperCase() + ' · ' + T('garden.card.stage')[st];
    el.querySelector('.gc').textContent = T('garden.card.count', { got: G.got(id), n: CAT.grown(), all: CAT.CROPS.length });
    el.style.borderColor = CAT.sector(crop.sec).col;
    const cv = el.querySelector('canvas'), c = cv.getContext('2d'); cv.width = cv.height = 128; cv.style.width = cv.style.height = '64px';
    c.fillStyle = '#0a0a26'; c.fillRect(0, 0, 128, 128); const g = c.createRadialGradient(64, 64, 6, 64, 64, 66); g.addColorStop(0, '#3bff8a44'); g.addColorStop(1, '#0a0a2600'); c.fillStyle = g; c.fillRect(0, 0, 128, 128);
    const z = sprite.width > 50 ? 1.5 : 2.5; c.imageSmoothingEnabled = false; c.drawImage(sprite, 64 - sprite.width * z / 2, 120 - sprite.height * z, sprite.width * z, sprite.height * z);
    el.classList.add('show'); G.cardOn = true; clearTimeout(cardT); cardT = setTimeout(hideCard, 6500);
  }

  // ---------- дотики й наведення ----------
  const inHit = (h, x, y) => h && x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h;
  const liftHit = (x, y) => { const Lf = lift(); return !Lf.drop && (inHit(Lf.hit, x, y) || (Math.abs(x - Lf.cx) < 37 * Lf.U && y < Lf.cy && y > Lf.cy - Lf.h - 64 * Lf.U)); };
  function tap(x, y) {
    const n = NX.nexi; NX.ui.hud.firstTouch();
    if (n.hitTest(x, y)) { NX.cam.toNexi(); n.hi(); return; }
    if (n.loc === 'lift') return;                                                                               // поки їде ліфтом — без команд
    if (liftHit(x, y)) { n.do('gUp'); return; }
    for (const s of Object.values(SEC)) if (inHit(s.hit, x, y)) { if (s.tap && s.tap(x, y)) return; n.do(s.act); return; }
    if (y > CAT.GY) { const to = NX.room.clampWalk(x, Math.max(y, CAT.GY + 12)); NX.input.ripples.push({ x: to[0], y: to[1], t: 0 }); NX.cam.toNexi(); n.walkTo(to[0], to[1]); }
  }
  function hover(x, y) {
    const n = NX.nexi; G.hover = n.hitTest(x, y) ? 'nexi' : liftHit(x, y) ? 'lift' : Object.values(SEC).find(s => inHit(s.hit, x, y)) || null;
    NX.loop.canvas.style.cursor = G.hover ? 'pointer' : 'default';
  }

  // ---------- кадр саду ----------
  function update(dt, t) {
    const n = NX.nexi, tk = n.task;
    if (tk && !ACTS[tk.id]) {                                                                                   // кімнатна команда в саду: спершу ліфтом нагору
      const id = tk.id; n.queue = []; n.cur = null; n.task = null; n.endTp();
      if (n.loc !== 'lift') { n.do('gUp'); G.after = id === 'sakura' ? null : id; }
    }
    n.lastCmd = Math.max(n.lastCmd, t - 5);                                                                     // кімнатне «вільне життя» (диван, зони) тут не вмикається
    if (n.cur || n.queue.length || n.talking) G.idle = 0; else G.idle += dt;
    n.nextDecor = Math.max(n.nextDecor || 0, t + 5);                                                            // і на кімнатний декор (рибки, м'ята) він тут не озирається
    if (G.idle > 10 && n.loc === 'floor') {                                                                     // сам: догляд за ділянкою або прогулянка стежкою
      G.idle = 0; const list = Object.values(SEC);
      if (list.length && Math.random() < .65) n.do(list[Math.random() * list.length | 0].act, false);
      else { const to = NX.room.clampWalk(P.clamp(n.x + (Math.random() - .5) * 700, CAT.X0 + 60, CAT.X1 - 60), CAT.GY + 14 + Math.random() * 50); n.queue = [{ walk: to }, { loc: 'floor' }, { face: 1 }]; n.cur = null; }
    }
    G.tod = (G.tod + dt / PK.DAY) % 1; Object.values(SEC).forEach(s => s.update && s.update(dt, t));
    if (G.fade > 0) G.fade = Math.max(0, G.fade - dt * 1.6);
  }
  function frame(L) {
    const now = performance.now() / 1000, dt = Math.min(.1, now - L.last); L.last = now; NX.time += dt; L.frames++;
    const t = NX.time, c = L.c, n = NX.nexi, Lf = lift(), C = NX.cfg;
    update(dt, t);
    n.update(dt, t); Lf.update(dt, t); NX.fx.update(dt); NX.ui.hud.update(dt, t);                                 // острівець живе й тут: пружинить, тримає Nexi на борту
    const at = n.task && Object.values(SEC).find(s => s.act === n.task.id && n.x > s.S.x0 && n.x < s.S.x1);     // камера: на ліфті — весь острівець, біля свого сектора — увесь сектор, інакше — Nexi
    NX.cam.follow(n.loc === 'lift' ? Lf.cx + 12 : at ? (at.S.x0 + at.S.x1) / 2 : n.x, dt);
    if (!G.on) { requestAnimationFrame(() => L.frame()); return; }                                              // вийшли з саду в цьому кадрі — наступний малює кімната
    const k = NX.cam.k * L.dpr, vx0 = NX.cam.x - 4, vx1 = NX.cam.x + NX.cam.viewW + 4;
    const W = L.canvas.width, Hh = L.canvas.height, world = () => { c.setTransform(k, 0, 0, k, -NX.cam.x * k, NX.cam.top * k); c.imageSmoothingEnabled = false; };
    c.setTransform(1, 0, 0, 1, 0, 0); PK.drawSky(c, t, G.tod, W, Hh, k);                                         // небо за часом доби — в координатах екрана
    world(); PK.drawBack(c, t, vx0, vx1);                                                                       // плани парку (паралакс), галявина, стежка
    for (const s of Object.values(SEC)) if (s.S.x1 > vx0 && s.S.x0 < vx1) s.draw(c, t);
    PK.drawLife(c, t, G.tod, vx0, vx1);
    if (G.beam) {                                                                                               // промінь, яким острівець спускається з неба
      const y0 = -NX.cam.top - 4; c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createLinearGradient(0, y0, 0, Lf.cy); g.addColorStop(0, 'rgba(255,150,210,.5)'); g.addColorStop(1, 'rgba(255,150,210,.08)');
      c.fillStyle = g; c.beginPath(); c.moveTo(Lf.cx - Lf.RX * .5, y0); c.lineTo(Lf.cx + Lf.RX * .5, y0); c.lineTo(Lf.cx + Lf.RX, Lf.cy); c.lineTo(Lf.cx - Lf.RX, Lf.cy); c.closePath(); c.fill(); c.restore();
    }
    Lf.drawBack(c, t);
    [{ y: Lf.cy, draw: () => Lf.drawTree(c, t) }, n.layer()].sort((a, b) => a.y - b.y).forEach(l => l.draw(c, t));
    NX.fx.draw(c);
    const tint = PK.sky(G.tod).tint; if (tint !== '#ffffff') { c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'multiply'; c.fillStyle = tint; c.fillRect(0, 0, W, Hh); c.globalCompositeOperation = 'source-over'; world(); }   // відтінок доби на всю сцену
    PK.drawLights(c, t, G.tod, vx0, vx1); NX.input.drawHover(c, t);                                             // світло й таблички — поверх відтінку
    const h = G.hover;                                                                                         // підпис під курсором: Nexi й ліфт (сектори підписані вивісками)
    if (h === 'nexi') NX.input.tag(c, NX.t('obj.nexiTag'), n.x, n.box ? n.box[1] - 6 : n.y - 70); else if (h === 'lift') NX.input.tag(c, String(NX.t('act.gUp.title')).toUpperCase(), Lf.cx, Lf.cy - Lf.h - 70 * Lf.U);
    if (G.fade > 0) { c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = `rgba(20,6,40,${G.fade})`; c.fillRect(0, 0, W, Hh); }
    requestAnimationFrame(() => L.frame());
  }

  Object.assign(G, { enter, exit, card, hideCard, warm: () => { while (!warmed) warmStep(50); } });
  return G;
})();
