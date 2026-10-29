/* ============================================================================
 * ui/splash.js — ВІТАЛЬНА ЗАСТАВКА: ЛОГІКА (NX.boot)
 * ----------------------------------------------------------------------------
 * Розмітка, стилі й найперший скрипт заставки — прямо в index.html (з'являються миттєво, ще до шрифтів і решти скриптів):
 * там лоад-бар, відсотки, піксель-арт (Nexi, логотип, значки), підрахунок скриптів і завантаження картинки кімнати з
 * прогресом (window.NX_SPLASH). Цей файл підключається одразу після словників мов і додає:
 *   • ПІДПИСИ — лише зі словників (splash.* у js/i18n/*.js, 4 мови), а малюються ПІКСЕЛЬНИМ ШРИФТОМ кодом (5×7, великі
 *     літери: латиниця з польськими, кирилиця, цифри, знаки; дані — FONT нижче, генерує tools/splash/gen_splash.js) у
 *     полотна .sp-tx — у тому ж масштабі пікселя, що й увесь піксель-арт заставки, і без очікування шрифтів Google;
 *     слова Nexi (say), назви етапів (st), кроки (step; зони 3D-крил — їхні назви з nav.*), «ОК» у журналі;
 *   • живого Nexi на заставці — той самий renderBot, що в кімнаті, з твоїм скіном (щойно завантажиться sprite.js);
 *   • NX.boot.run(gen, етап) — веде важку збірку (місто, 3D-крила, перший кадр) ДРІБНИМИ ШМАТКАМИ: генератор віддає
 *     частку 0..1, ми працюємо ~40 мс (на слабкому телефоні — довше) і віддаємо браузеру кадр — лоад-бар рухається, а не
 *     «замерзає»;
 *   • NX.boot.reveal() — плавний перехід: «Готово!», Nexi на ранці злітає точно на своє місце на доку в кімнаті (того ж
 *     розміру), заставка тане.
 * Етапи (ключі): js — скрипти · img — картинка кімнати · city — місто за вікном · wings — 3D-крила · ready — перший кадр.
 * Варіант оформлення (поки обираємо): адреса #splash-a / #splash-b / #splash-c. Заміри збірки: window.BOOT_LOG = 1.
 * ========================================================================== */
NX.boot = (() => {
  const S = window.NX_SPLASH || { set() {}, F: {}, room: Promise.resolve(null), el: null, stage: 'js', U: 3 }, el = S.el;
  const all = q => (el ? [...el.querySelectorAll(q)] : []);
  NX.i18n.lang = NX.i18n.detect();                                                   // мова — уже зараз (main.js визначить ту саму)
  const T = k => { const v = NX.t(k); return v === k ? '' : v; };                    // немає ключа — порожньо, а не сам ключ

  // ---------- ПІКСЕЛЬНИЙ ШРИФТ ----------
  // FONT: на кожен знак 14 символів — знак, ширина (1..5), 12 рядків клітинки (3 над літерою, 7 — літера, 2 під нею;
  // base32, біт c — стовпчик c зліва). Генерує tools/splash/gen_splash.js --write.
  /*font:begin*/const FONT = "05000ehpljhe0015000464444e0025000ehg842v0035000v848ghe00450008ca9v880055000v1fgghe0065000c21fhhe0075000vg842220085000ehhehhe0095000ehhug8600A5000ehhvhhh00B5000fhhfhhf00C5000eh111he00D5000fhhhhhf00E5000v11f11v00F5000v11f11100G5000eh1thhu00H5000hhhvhhh00I3000722222700J5000s88889600K5000h95359h00L5000111111v00M5000hrllhhh00N5000hjlphhh00O5000ehhhhhe00P5000fhhf11100Q5000ehhhl9m00R5000fhhf59h00S5000u11eggf00T5000v44444400U5000hhhhhhe00V5000hhhhha400W5000hhhllla00X5000hha4ahh00Y5000hha444400Z5000vg8421v00Ą5000ehhvhhh8oĘ5000v11f11v8oĆ5840eh111he00Ń5840hjlphhh00Ó5840ehhhhhe00Ś5840u11eggf00Ź5840vg8421v00Ż5040vg8421v00Ł5000115311v00Б5000v11fhhf00Г5000v11111100Ґ500gv11111100Д5000caaaaavh0Є5000eh1f1he00Ж5000lle4ell00З5000ehgcghe00И5000hhpljhh00Ї3050722222700Й5a40hhpljhh00Л5000siiiiih00П5000vhhhhhh00У5000hhhughe00Ф50004elle4400Ц5000999999vg0Ч5000hhhuggg00Ш5000llllllv00Щ5000llllllvg0Ь5000111fhhf00Ю50009llnll900Я5000uhhukih00 3000000000000.1000000000100,2000000002210!1000111110100?5000ehg840400:1000001001000-4000000f00000&50006952l9m00/5000g88422100%5000jj842pp00'1000110000000(3000421112400)3000124442100+5000044v44000·1000000100000\"3000550000000";/*font:end*/
  const GLY = new Map(), B32 = '0123456789abcdefghijklmnopqrstuv';
  for (let i = 0; i + 14 <= FONT.length; i += 14) GLY.set(FONT[i], { w: +FONT[i + 1], r: [...FONT.slice(i + 2, i + 14)].map(c => B32.indexOf(c)) });
  // кириличні літери, що виглядають як латинські, і типографські знаки -> один малюнок
  const ALIAS = { 'А': 'A', 'В': 'B', 'Е': 'E', 'К': 'K', 'М': 'M', 'Н': 'H', 'О': 'O', 'Р': 'P', 'С': 'C', 'Т': 'T', 'Х': 'X', 'І': 'I', '’': "'", 'ʼ': "'", '‘': "'", '–': '-', '—': '-', '«': '"', '»': '"', '•': '·' };
  const glyph = ch => GLY.get(ch) || GLY.get(ALIAS[ch]) || GLY.get(ch.normalize('NFD')[0]) || GLY.get('?');
  const width = s => { let w = -1; for (const ch of s) w += glyph(ch).w + 1; return Math.max(0, w); };
  /** Текст s у полотно cv (1 піксель полотна = 1 піксель шрифту): великими літерами мови, перенос по словах на maxW. */
  function txt(cv, s, col, maxW) {
    s = String(s).replace(/…/g, '...').toLocaleUpperCase(NX.i18n.lang);
    const lines = []; let cur = '';
    for (const wd of s.split(' ')) { const t = cur ? cur + ' ' + wd : wd; if (maxW && cur && width(t) > maxW) { lines.push(cur); cur = wd; } else cur = t; }
    lines.push(cur);
    cv.width = Math.max(1, ...lines.map(width)); cv.height = lines.length * 13 - 1;
    const x = cv.getContext('2d'); x.fillStyle = col;
    lines.forEach((ln, n) => { let cx = 0; for (const ch of ln) { const g = glyph(ch); g.r.forEach((v, r) => { for (let c = 0; c < g.w; c++) if (v >> c & 1) x.fillRect(cx + c, n * 13 + r, 1, 1); }); cx += g.w + 1; } });
  }
  /** Масштаб тексту: b — як піксель арту, m — 2/3, s — 1/2 (ціле число пікселів екрана — чітко). */
  const scale = sz => { const d = devicePixelRatio || 1; return Math.max(1, Math.round(Math.round((S.U || 3) * d) * ({ m: 2 / 3, s: .5 }[sz] || 1))) / d; };
  const STC = { n: { on: '#9af6ff', cur: '#ffffff', todo: '#4a5aa8' }, e: { on: '#3be8ff', cur: '#ff4fd8', todo: '#4a5aa8' } };   // кольори за станом етапу

  // ---------- підписи ----------
  /** Крок усередині етапу — другий рядок підпису: скрипти — «23/54», картинка — відсотки, місто — небо / планета / хмарочоси…,
   *  3D-крила — стіни й підлога / назва зони (nav.*) / світло…, готово — перший кадр. */
  function stepText(k) {
    if (k === 'js') return S.nj ? S.nj + '/' + S.NJ : '';
    if (k === 'img') return Math.min(100, Math.round((S.F.img || 0) / .9 * 100)) + '%';
    if (k === 'city') return NX.city && NX.city.step ? T('splash.step.' + NX.city.step) : '';
    if (k === 'wings') { const st = NX.arc && NX.arc.step; return !st ? '' : st.k === 'zone' ? T('nav.' + st.x) : T('splash.step.' + st.k); }
    return T('splash.step.warm');
  }
  const stateOf = k => ((S.F[k] || 0) >= 1 ? 'on' : k === S.stage ? 'cur' : 'todo');
  /** Що й яким кольором написати на полотні підпису. */
  function textOf(cv) {
    const d = cv.dataset, k = S.stage || 'js';
    let s = d.raw != null ? d.raw : d.spT ? T(d.spT) : d.spSt ? T('splash.st.' + d.spSt) : d.sp ? (d.sp === 'step' ? stepText(k) : T('splash.' + (d.sp === 'stage' ? 'st' : d.sp) + '.' + k)) : '';
    if (d.em) { const f = S.F[d.em] || 0; s = f >= 1 ? T('splash.ok') : d.em === k ? Math.floor(f * 100) + '%' : ''; }
    const own = d.spSt || d.em, col = d.cs && own ? STC[d.cs][stateOf(own)] : d.c || '#dbe7ff';
    return [s, col];
  }
  /** Усі підписи під поточний етап (кличе inline-скрипт при кожній зміні прогресу; force — після зміни масштабу). */
  function paint(force) {
    if (!el) return;
    all('canvas.sp-tx').forEach(cv => {
      const [s, col] = textOf(cv), k = scale(cv.dataset.tx), mw = cv.dataset.w === 'p' ? Math.floor((cv.parentNode.clientWidth - 2) / k) : +cv.dataset.w ? Math.floor(cv.dataset.w / k) : 0, key = s + '|' + col + '|' + k + '|' + mw;
      if (cv._k === key && !force) return; cv._k = key;
      if (!s) { cv.width = cv.height = 1; cv.style.width = cv.style.height = '0px'; return; }
      txt(cv, s, col, mw); cv.style.width = cv.width * k + 'px'; cv.style.height = cv.height * k + 'px';
    });
    el.setAttribute('aria-valuetext', T('splash.st.' + (S.stage || 'js')));
  }
  if (el) { el.setAttribute('aria-label', T('splash.aria')); const r = el.querySelector('.sp-retry'); if (r) r.setAttribute('aria-label', T('splash.retry')); }
  paint(); S.on = () => paint(); S.onUnit = () => paint(true);
  if (el && S.v === 'c') (function glitch() { setTimeout(() => { if (!el.isConnected || NX.boot.done) return; el.classList.add('glitch'); setTimeout(() => { el.classList.remove('glitch'); glitch(); }, 320); }, 4000 + Math.random() * 4000); })();

  // ---------- живий Nexi (той самий renderBot, що в кімнаті) ----------
  let living = false, flying = false;
  /** Оживити Nexi на заставці, щойно є sprite.js і poses.js: поза з data-pose (стоїть / летить на ранці / набирає), у кінці —
   *  радіє, у польоті в кімнату — ранець; варіант A — ще й віддзеркалення в підлозі. ~8 кадрів/с (як у 8-bit; браузер у цей
   *  час будує кімнату), у польоті — щокадру. */
  function live() {
    if (living || !el || typeof renderBot !== 'function' || typeof poseFor !== 'function') return;
    living = true;
    const cvs = all('canvas.sp-nexi:not(.sp-refl)'), refl = el.querySelector('canvas.sp-refl'), t0 = performance.now();
    let look; try { look = Object.assign({}, DEFAULT_LOOK, JSON.parse(localStorage.getItem('nexi-look') || '{}'), { face: 'standard' }); } catch (e) { look = Object.assign({}, DEFAULT_LOOK); }
    let last = -1;
    const frame = () => {
      if (NX.boot.done) return;
      const t = (performance.now() - t0) / 1000;
      if (t - last < .12 && !flying) { requestAnimationFrame(frame); return; }
      last = t;
      cvs.forEach(cv => {
        let pose = cv.getAttribute('data-pose') || 'stand';
        if (flying) pose = 'fly'; else if ((S.F.ready || 0) >= 1) pose = 'cheer';
        const p = poseFor(pose, t, false);
        if (!flying && S.stage === 'wings' && pose === 'stand' && (t % 7) > 5) p.face = 'think';   // будує 3D — замислився
        renderBot(look, p, t, cv);
      });
      if (refl && cvs[0]) { refl.width = cvs[0].width; refl.height = cvs[0].height; refl.getContext('2d').drawImage(cvs[0], 0, 0); }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }
  // sprite.js і poses.js приходять трохи пізніше — оживляємо, щойно завантажиться poses.js (у dist/ — з main.js)
  document.addEventListener('load', e => { const t = e.target; if (t && t.tagName === 'SCRIPT' && /nexi\/poses\.js/.test(t.src || '')) live(); }, true);

  // ---------- шматки з паузами ----------
  const mc = new MessageChannel(), q = []; mc.port1.onmessage = () => { const f = q.shift(); f && f(); };
  const macro = () => new Promise(r => { q.push(r); mc.port2.postMessage(0); });            // задача без затримки (setTimeout має ≥4 мс і гальмує в тлі)
  /** Віддати браузеру кадр: дочекатися малювання (rAF) і продовжити одразу після нього; у фоновій вкладці rAF спить — тоді просто задача. */
  const breathe = () => document.hidden ? macro() : new Promise(r => { let done = false; const go = () => { if (!done) { done = true; macro().then(r); } }; requestAnimationFrame(go); setTimeout(go, 60); });
  const PROF = {};                                                                   // заміри: робота / пауза по етапах (window.BOOT_LOG = 1 — у консоль)
  let waitAvg = 12;                                                                  // скільки в середньому коштує кадр заставки (мс)
  /** Прогнати генератор gen дрібними шматками (~budget мс; window.BOOT_BUDGET — інший), показуючи частку етапу stage на
   *  лоад-барі. Між шматками — кадр: лоад-бар і живий Nexi оновлюються, а безперервний рух (CSS: transform / opacity)
   *  відеокарта малює й під час шматка. */
  async function run(gen, stage, budget0 = window.BOOT_BUDGET || 40) {
    const pr = PROF[stage] = { work: 0, wait: 0, n: 0, max: 0 }, t0 = performance.now();
    if (gen) for (;;) {
      // шматок — щонайменше ~40 мс, а на слабкому телефоні (кадр заставки дорожчий) — довший, щоб на паузи йшло ≤ ~20 % часу
      const budget = Math.max(budget0, Math.min(160, waitAvg * 4)), a = performance.now(); let r, v = -1, c = a;
      do { r = gen.next(); if (!r.done && typeof r.value === 'number') v = r.value;
        const e = performance.now(); if (e - c > 40 && window.BOOT_LOG) (pr.slow || (pr.slow = [])).push([Math.round(e - c), stepText(stage)]); c = e;
      } while (!r.done && c - a < budget);
      if (v >= 0) S.set(stage, Math.min(.999, v));                                   // лоад-бар — раз за шматок
      paint();
      const d = performance.now() - a; pr.work += d; pr.n++; if (d > pr.max) pr.max = d;
      if (r.done) break;
      const b = performance.now(); await breathe(); const w = performance.now() - b; pr.wait += w; waitAvg += (w - waitAvg) * .2;
    }
    S.set(stage, 1); paint(); await breathe(); pr.wall = performance.now() - t0;
    if (window.BOOT_LOG) console.log('[boot] ' + stage + ': ' + JSON.stringify(pr, (k, v) => typeof v === 'number' ? Math.round(v) : v));
  }
  /** Картинка кімнати: вбудована (dist/ — один файл) або вже завантажена inline-скриптом (blob з прогресом), інакше — за адресою. */
  async function roomSrc() { if (window.NX_ROOM_SRC) return window.NX_ROOM_SRC; const u = await S.room; return u || 'assets/room.webp'; }
  /** Шрифт написів у 3D (вивіски зон малюються в canvas шрифтом Press Start 2P) з літерами поточної мови; не довше 3 с. */
  function fonts() {
    const tm = new Promise(r => setTimeout(r, 3000));
    if (!document.fonts || !document.fonts.load) return tm;
    const sample = ['nav.marketing', 'nav.workshop', 'nav.analytics', 'nav.tools', 'nav.ai', 'nav.portal', 'scene.ws.skins', 'scene.ws.acc'].map(T).join('');
    return Promise.race([tm, (window.NX_FONTS_CSS || Promise.resolve()).then(() => document.fonts.load('10px "Press Start 2P"', sample)).catch(() => {})]);
  }

  // ---------- перехід у кімнату ----------
  /** «Готово!» -> Nexi на ранці злітає ТОЧНО на своє місце в кімнаті (той самий розмір, що там; у кімнаті його поки не
   *  видно — alpha 0), заставка тане; на місці — передає естафету справжньому Nexi. Без руху (prefers-reduced-motion) — лише тане. */
  function reveal() {
    return new Promise(res => {
      const N = NX.nexi;
      const finish = fly => { if (fly) fly.remove(); if (el) el.remove(); N.alpha = 1; NX.boot.done = true; S.done = true; document.documentElement.classList.remove('booting'); res(); };
      if (!el) return finish();
      S.set('ready', 1); paint(); el.classList.add('done');
      if (document.hidden) return finish();                                          // вкладка у фоні — без анімації (rAF там спить)
      const bot = el.querySelector('canvas.sp-nexi:not(.sp-refl)'), still = matchMedia('(prefers-reduced-motion: reduce)').matches;
      setTimeout(() => {
        if (still || !bot || !living) { el.classList.add('out'); setTimeout(finish, 720); return; }
        // ціль — як Nexi малюється в кімнаті (actors/nexi/nexi.js layer): ноги в (x, y), масштаб за глибиною
        const s = NX.room.scaleAt(Math.max(N.depthY(), 352)) * N.zoom * SPRITE_K, k = NX.cam.k, [fx, fy] = NX.cam.toScreen(N.x, N.y);
        const w = SW * s * k, left = fx - w / 2, top = fy - FOOT * s * k, r0 = bot.getBoundingClientRect();
        const hold = bot.parentNode; hold.style.width = r0.width + 'px'; hold.style.height = r0.height + 'px';   // місце Nexi лишається — заставка не «стрибає»
        Object.assign(bot.style, { position: 'fixed', left: r0.left + 'px', top: r0.top + 'px', width: r0.width + 'px', height: r0.height + 'px', margin: '0', zIndex: 70, transformOrigin: '0 0', transition: 'transform .7s cubic-bezier(.45,-.25,.35,1)', imageRendering: 'pixelated' });
        document.body.appendChild(bot); flying = true; N.alpha = 0;
        requestAnimationFrame(() => requestAnimationFrame(() => { bot.style.transform = `translate(${left - r0.left}px,${top - r0.top}px) scale(${w / r0.width})`; el.classList.add('out'); }));
        setTimeout(() => { N.alpha = 1; bot.style.transition = 'opacity .2s'; bot.style.opacity = '0'; setTimeout(() => finish(bot), 220); }, 730);
      }, 320);
    });
  }
  return { run, roomSrc, fonts, reveal, live, txt, set: (k, f) => S.set(k, f), done: false, prof: PROF };
})();
