/* ============================================================================
 * core/camera.js — КАМЕРА, МАСШТАБ, ДОТИКИ
 * ----------------------------------------------------------------------------
 * Десктоп: кімната вміщується по ширині екрана (видно всю квартиру), а зайва
 * висота екрана стає добудованою стелею (зверху) і підлогою (знизу).
 * Телефон: кімната масштабується по висоті, а ширину гортаємо пальцем.
 * Ширина кімнати — від NX.cfg.ROOM_X0 до ROOM_X1 (ширша за картинку: крайні зони, core/config.js).
 * Тап (дотик без перетягування) передається в NX.input.onTap(x,y) у
 * координатах кімнати.
 * ФОКУС УВАГИ (власник, 02.11: «коли з Рудиком якась подія — камера переходить на нього, він якийсь час у центрі уваги,
 * потім камера повертається на Nexi»): focus(x, сек) — замість Nexi камера тримає в центрі точку x() (кіт; вірус — між котом
 * і вірусом), поки не мине час; команда людини Nexi — toNexi() (скасовує й фокус). На комп'ютері видно всю кімнату —
 * нічого не змінюється. Хто кличе — actors/cat/cat.js: look().
 * ОГЛЯД КІМНАТИ (власник, 03.11: «коли вивчаємо кімнату, задовбує, що камера постійно повертається до Nexi — хай
 * повертається, коли натискаємо на область взаємодії або на підлогу»): погортав кімнату — камера стоїть, де її лишили (free),
 * і сама нікуди не йде — ні за Nexi, ні на фокус уваги (події Рудика), — доки людина не дасть Nexi команду: тап по Nexi, коту,
 * зоні, предмету чи підлозі, команда в діалозі (actors/nexi/nexi.js: do від людини; ui/input.js: Nexi й підлога) — toNexi().
 * Тапи по гостях і декору — не команда: камера стоїть. До 03.11 камера поверталась сама через 4 с після гортання.
 * iPhone / iPad: свайп від лівого чи правого краю екрана — жест браузера «назад» / «вперед»; хто гортав кімнату від краю,
 * випадав зі сторінки (власник, 02.11). Дотик біля краю канвас «забирає собі» (touchstart з preventDefault) — тоді Safari
 * (iOS 13.4+) цей жест не починає, а кімната гортається як звичайно (тапи й перетягування — pointer-події, їм це не заважає).
 * Вбудовані браузери (Telegram, Instagram…) мають свій жест — його сайт не вимкне, але часто це «назад» в історії (а коли
 * назад нікуди — закрити). Тому ЗАПАСНИЙ КРОК: після дотику до кімнати в історії стає ще один крок на цю саму сторінку —
 * випадковий «назад» лишає в кімнаті (без перезавантаження), а крок ставиться знову при наступному дотику. Вийти —
 * «назад» двічі поспіль.
 * ЗУМ (власник, 06.11: «щоб пальцями трохи можна було приближати»): щипок двома пальцями — масштаб 1..3 навколо точки між
 * пальцями; колесо миші / трекпад — те саме на комп'ютері; при зумі кімнату можна гортати і вгору-вниз. Усе, що читає cam.k /
 * cam.top / cam.x / cam.viewW (растри з Rd, бабли, loop), працює як є — зум лише міняє ці числа. Щипок до < 1.05 — повертає 1.
 * ========================================================================== */
NX.cam = {
  k: 1,          // скільки CSS-пікселів в 1 одиниці кімнати
  x: -64,        // лівий край видимої області (одиниці кімнати; від NX.cfg.ROOM_X0)
  top: 60,       // висота добудованої стелі
  front: 200,    // висота добудованої підлоги
  viewW: 1664,   // ширина видимої області (одиниці кімнати)
  mobile: false,
  free: false,   // людина гортала кімнату: камера стоїть, де її лишили, доки людина не дасть Nexi команду (toNexi)
  dragUntil: 0,  // для інструментів знімків (tools/same.js, bench.js, wingbox/shot.js): тримати камеру до цього performance.now()
  foc: null,     // фокус уваги: { x() — центр, until — до якого часу NX.time } (подія з Рудиком)
  focEnd: -99,   // коли фокус скінчився (дрібна подія одразу після — камера не смикається туди-сюди)
  z: 1,          // зум (щипок / колесо): 1 — як після layout; k = k0 · z
  k0: 1, top0: 60, front0: 200, vw: 0, vh: 0,

  /** Перерахунок під розмір вікна. Викликається на старті і при resize. */
  layout(vw, vh) {
    const C = NX.cfg;
    this.mobile = vw < 820 || vh > vw;
    if (!this.mobile) {
      this.k = vw / (C.ROOM_X1 - C.ROOM_X0);                    // вся кімната по ширині
      if (vh / this.k - C.ROOM_H < C.FRONT_MIN + C.TOP_MIN)     // дуже широкий екран
        this.k = vh / (C.ROOM_H + C.FRONT_MIN + C.TOP_MIN);
    } else {
      this.k = vh / (C.ROOM_H + 60 + 190);                      // телефон: по висоті
    }
    this.vw = vw; this.vh = vh; this.k0 = this.k;
    const extra = vh / this.k - C.ROOM_H;                       // скільки треба добудувати
    this.top0 = Math.round(Math.max(C.TOP_MIN, Math.min(110, extra * .2)));
    this.front0 = Math.round(extra - this.top0); this.front = this.front0;   // front — геометрія світу (підлога, пояс ходьби), зум її не чіпає
    this.setZoom(this.z, 0, 0, true);
  },
  /** Зум z (1..3) навколо екранної точки (sx, sy): точка кімнати під нею лишається на місці. keep — лише перерахунок після layout. */
  setZoom(z, sx, sy, keep) {
    const C = NX.cfg; z = Math.max(1, Math.min(3, z)); if (z < 1.05) z = 1;
    const [rx, ry] = keep ? [0, 0] : this.toRoom(sx, sy); this.z = z; this.k = this.k0 * z; this.viewW = this.vw / this.k;
    const vh = this.vh / this.k, yMin = -this.top0, yMax = C.ROOM_H + this.front0 - vh;   // верхній край: від стелі до низу добудованої підлоги
    let yv = keep ? -this.top : ry - sy / this.k, x = keep ? this.x : rx - sx / this.k;
    if (z === 1) yv = yMin;
    this.top = -NX.px.clamp(yv, yMin, Math.max(yMin, yMax));
    this.x = NX.px.clamp(x, C.ROOM_X0, Math.max(C.ROOM_X0, C.ROOM_X1 - this.viewW));
  },
  /** Фокус уваги на x() на sec секунд. Довший фокус, що вже йде, коротший не перебиває (force — замінити). */
  focus(x, sec, force) { const until = NX.time + sec; if (!force && this.foc && this.foc.until > until) return; this.foc = { x, until }; },
  unfocus() { if (this.foc) this.focEnd = NX.time; this.foc = null; },
  /** Команда людини Nexi (див. шапку, «ОГЛЯД КІМНАТИ») — камера знову за Nexi: і після гортання, і замість фокуса уваги. */
  toNexi() { this.free = false; this.unfocus(); },
  /** Камера м'яко тримає Nexi в центрі (якщо кімната ширша за екран) — або точку фокуса уваги, поки він триває; людина
   *  гортала (free) — стоїть, де її лишили (фокус уваги минає за часом, як і раніше). */
  follow(tx, dt) {
    const F = this.foc; if (F) { if (NX.time > F.until) this.unfocus(); else { const fx = F.x(); if (Number.isFinite(fx)) tx = fx; } }
    if (this.free || performance.now() < this.dragUntil) { this.gl = null; return; }
    const G = this.gl; if (G) { const q = Math.min(1, (NX.time - G.t0) / G.dur), e = q < .5 ? 2 * q * q : 1 - 2 * (1 - q) * (1 - q); this.x = G.x0 + (G.x1 - G.x0) * e; if (q >= 1) this.gl = null; return; }
    const C = NX.cfg, max = Math.max(C.ROOM_X0, C.ROOM_X1 - this.viewW);
    const want = NX.px.clamp(tx - this.viewW / 2, C.ROOM_X0, max);
    this.x += (want - this.x) * Math.min(1, dt * 3);
  },
  /** Телепорт Nexi (actors/nexi/nexi.js: tp, 06.11): камера одразу там, куди дивилася б follow, — щоб на телефоні було видно,
   *  як він з'являється (плавно доїхала б, коли все вже скінчилось). Людина гортала (free) чи триває фокус уваги — не чіпає. */
  jump(tx) { if (this.free || this.foc || performance.now() < this.dragUntil) return; const C = NX.cfg, max = Math.max(C.ROOM_X0, C.ROOM_X1 - this.viewW); this.x = NX.px.clamp(tx - this.viewW / 2, C.ROOM_X0, max); },
  /** Телепорт плавно (власник, 06.11: «екран має більш плавно переміщатися, бо зараз смикається»): камера за dur с м'яко
   *  (ease in-out) переїжджає туди, куди дивилася б follow у точці появи, — рушає, щойно Nexi починає танути, і приїздить,
   *  коли він з'являється. Людина гортала (free) чи триває фокус уваги — не чіпає. Поки їде, follow не втручається. */
  glide(tx, dur) { if (this.free || this.foc || performance.now() < this.dragUntil) return; const C = NX.cfg, max = Math.max(C.ROOM_X0, C.ROOM_X1 - this.viewW);
    const x1 = NX.px.clamp(tx - this.viewW / 2, C.ROOM_X0, max); if (Math.abs(x1 - this.x) < 1) return; this.gl = { x0: this.x, x1, t0: NX.time, dur }; },
  /** Екранні CSS-пікселі -> координати кімнати. */
  toRoom(sx, sy) { return [sx / this.k + this.x, sy / this.k - this.top]; },
  /** Координати кімнати -> екранні CSS-пікселі (для DOM-баблів). */
  toScreen(x, y) { return [(x - this.x) * this.k, (y + this.top) * this.k]; },

  /** Підключення перетягування (миша/палець) і тапів до canvas. */
  bindInput(canvas) {
    let down = null;
    // дотик за EDGE px від лівого / правого краю — не жест «назад» / «вперед» браузера, а гортання кімнати (див. шапку)
    const EDGE = 28;
    canvas.addEventListener('touchstart', e => { for (const t of e.changedTouches) if (t.clientX < EDGE || t.clientX > innerWidth - EDGE) { e.preventDefault(); break; } }, { passive: false });
    // запасний крок в історії (див. шапку): ставиться лише після дотику (браузери пропускають кроки, додані без дій людини)
    let armed = !!(history.state && history.state.nx);
    const arm = () => { if (armed || !history.pushState) return; armed = true; try { history.pushState({ nx: 1 }, ''); } catch (e) {} };
    addEventListener('popstate', () => { armed = !!(history.state && history.state.nx); });
    canvas.addEventListener('touchend', arm);
    const pts = new Map(); let pinch = null;   // активні пальці; щипок: { d0, z0 }
    const mid = () => { const a = [...pts.values()]; return [(a[0].x + a[1].x) / 2, (a[0].y + a[1].y) / 2, Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y)]; };
    canvas.addEventListener('pointerdown', e => { pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); canvas.setPointerCapture(e.pointerId);
      if (pts.size === 2) { const [, , d] = mid(); pinch = { d0: d, z0: this.z }; down = null; } else if (pts.size === 1) down = { x: e.clientX, y: e.clientY, cx: this.x, cy: -this.top, moved: false }; });
    canvas.addEventListener('pointermove', e => {
      if (pts.has(e.pointerId)) pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pinch && pts.size >= 2) { const [mx, my, d] = mid(); this.setZoom(pinch.z0 * d / Math.max(1, pinch.d0), mx, my); this.free = true; return; }
      if (down) {
        const dx = e.clientX - down.x, dy = e.clientY - down.y;
        if (Math.abs(dx) > 6 || (this.z > 1 && Math.abs(dy) > 6)) down.moved = true;
        if (down.moved) { const C = NX.cfg, max = Math.max(C.ROOM_X0, C.ROOM_X1 - this.viewW); this.x = NX.px.clamp(down.cx - dx / this.k, C.ROOM_X0, max); this.free = true;
          if (this.z > 1) { const vh = this.vh / this.k, yMin = -this.top0, yMax = C.ROOM_H + this.front0 - vh; this.top = -NX.px.clamp(down.cy - dy / this.k, yMin, Math.max(yMin, yMax)); } }
      } else NX.input && NX.input.onHover(...this.toRoom(e.clientX, e.clientY));
    });
    const up = e => { pts.delete(e.pointerId); if (pts.size < 2) pinch = null; if (down && !down.moved && e.type === 'pointerup') { if (NX.cards && NX.cards.on) NX.cards.tap(e.clientX, e.clientY); else NX.input.onTap(...this.toRoom(e.clientX, e.clientY)); } down = null; arm(); };
    canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('wheel', e => { e.preventDefault(); this.setZoom(this.z * Math.exp(-e.deltaY * (e.ctrlKey ? .01 : .0025)), e.clientX, e.clientY); if (this.z > 1) this.free = true; }, { passive: false });
  },
};
