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
 * і вірусом), поки не мине час; команда користувача Nexi (nexi.js: do / walkTo) — unfocus(). На комп'ютері видно всю кімнату —
 * нічого не змінюється. Хто кличе — actors/cat/cat.js: look().
 * iPhone / iPad: свайп від лівого чи правого краю екрана — жест браузера «назад» / «вперед»; хто гортав кімнату від краю,
 * випадав зі сторінки (власник, 02.11). Дотик біля краю канвас «забирає собі» (touchstart з preventDefault) — тоді Safari
 * (iOS 13.4+) цей жест не починає, а кімната гортається як звичайно (тапи й перетягування — pointer-події, їм це не заважає).
 * Вбудовані браузери (Telegram, Instagram…) мають свій жест — його сайт не вимкне, але часто це «назад» в історії (а коли
 * назад нікуди — закрити). Тому ЗАПАСНИЙ КРОК: після дотику до кімнати в історії стає ще один крок на цю саму сторінку —
 * випадковий «назад» лишає в кімнаті (без перезавантаження), а крок ставиться знову при наступному дотику. Вийти —
 * «назад» двічі поспіль.
 * ========================================================================== */
NX.cam = {
  k: 1,          // скільки CSS-пікселів в 1 одиниці кімнати
  x: -64,        // лівий край видимої області (одиниці кімнати; від NX.cfg.ROOM_X0)
  top: 60,       // висота добудованої стелі
  front: 200,    // висота добудованої підлоги
  viewW: 1664,   // ширина видимої області (одиниці кімнати)
  mobile: false,
  dragUntil: 0,  // до якого часу камера не слідкує за Nexi (користувач гортав)
  foc: null,     // фокус уваги: { x() — центр, until — до якого часу NX.time } (подія з Рудиком)
  focEnd: -99,   // коли фокус скінчився (дрібна подія одразу після — камера не смикається туди-сюди)

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
    this.viewW = vw / this.k;
    const extra = vh / this.k - C.ROOM_H;                       // скільки треба добудувати
    this.top = Math.round(Math.max(C.TOP_MIN, Math.min(110, extra * .2)));
    this.front = Math.round(extra - this.top);
    this.x = NX.px.clamp(this.x, C.ROOM_X0, Math.max(C.ROOM_X0, C.ROOM_X1 - this.viewW));
  },
  /** Фокус уваги на x() на sec секунд. Довший фокус, що вже йде, коротший не перебиває (force — замінити). */
  focus(x, sec, force) { const until = NX.time + sec; if (!force && this.foc && this.foc.until > until) return; this.foc = { x, until }; },
  unfocus() { if (this.foc) this.focEnd = NX.time; this.foc = null; },
  /** Камера м'яко тримає Nexi в центрі (якщо кімната ширша за екран) — або точку фокуса уваги, поки він триває. */
  follow(tx, dt) {
    const F = this.foc; if (F) { if (NX.time > F.until) this.unfocus(); else { const fx = F.x(); if (Number.isFinite(fx)) tx = fx; } }
    if (performance.now() < this.dragUntil) return;
    const C = NX.cfg, max = Math.max(C.ROOM_X0, C.ROOM_X1 - this.viewW);
    const want = NX.px.clamp(tx - this.viewW / 2, C.ROOM_X0, max);
    this.x += (want - this.x) * Math.min(1, dt * 3);
  },
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
    canvas.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY, cx: this.x, moved: false }; canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener('pointermove', e => {
      if (down) {
        const dx = e.clientX - down.x;
        if (Math.abs(dx) > 6) down.moved = true;
        if (down.moved) { const C = NX.cfg, max = Math.max(C.ROOM_X0, C.ROOM_X1 - this.viewW); this.x = NX.px.clamp(down.cx - dx / this.k, C.ROOM_X0, max); this.dragUntil = performance.now() + 4000; }
      } else NX.input && NX.input.onHover(...this.toRoom(e.clientX, e.clientY));
    });
    canvas.addEventListener('pointerup', e => { if (down && !down.moved) NX.input.onTap(...this.toRoom(e.clientX, e.clientY)); down = null; arm(); });
    canvas.addEventListener('pointercancel', () => down = null);
  },
};
