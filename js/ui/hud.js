/* ============================================================================
 * ui/hud.js — ШАПКА, ЧИП ЗАДАЧІ, БАБЛ NEXI, ПІДКАЗКА, ТОСТ
 * ----------------------------------------------------------------------------
 * HTML-елементи поверх canvas (розмітка в index.html, стилі в css/hud.css).
 * Шапка — лише назва NEXORA AI (власник, 02.11: кнопки зон і «СКІНИ» прибрано). Зони — тапом по кімнаті (ui/input.js),
 * скіни — лише в зоні СКІНИ (тап по Nexi — привітання), повернення на док — тапом по килиму чи в діалозі з Nexi.
 * ========================================================================== */
NX.ui.hud = {
  $: id => document.getElementById(id), typed: null,
  init() { this.applyLang(); this.swipe(this.$('result')); this.swipe(this.$('guide')); },   // картка результату і картка виду / речі / культури саду (#guide: decor_guide.js, garden.js)
  /** СВАЙП ПО ПОВІДОМЛЕННЮ (власник, 14–15.11): картку результату й картку виду / речі / культури саду можна потягнути пальцем чи мишею в будь-який бік — вона
   *  їде за пальцем і блідне; відтягнув далі ніж на 48 пікс. (або швидко змахнув) — відлітає в той бік і зникає, менше —
   *  повертається на місце. Сама картка, її текст і 7 секунд показу — js/ui/zones.js (result), стилі — css/hud.css (.result). */
  swipe(el) {
    if (!el) return;
    let d = null;                                                    // поточний жест: старт, зсув, час
    let moved = false;                                               // палець справді тягнув — «клік» після такого жесту не рахуємо (картка #guide закривається тапом)
    el.addEventListener('click', e => { if (moved) { moved = false; e.stopImmediatePropagation(); e.preventDefault(); } }, true);
    const put = (x, y, o, tr) => { el.style.transition = tr; el.style.transform = `translate(${x}px,${y}px)`; el.style.opacity = o; };
    const clear = () => { el.style.transition = 'none'; el.style.transform = ''; el.style.opacity = ''; void el.offsetWidth; el.style.transition = ''; };   // назад до стилів із css/hud.css, без «перельоту»
    el.addEventListener('pointerdown', e => { if (!el.classList.contains('show')) return; moved = false; d = { id: e.pointerId, x: e.clientX, y: e.clientY, dx: 0, dy: 0, t: performance.now() }; try { el.setPointerCapture(e.pointerId); } catch (_) {} });
    el.addEventListener('pointermove', e => { if (!d || e.pointerId !== d.id) return; d.dx = e.clientX - d.x; d.dy = e.clientY - d.y; if (Math.hypot(d.dx, d.dy) < 6 && !moved) return; moved = true; put(d.dx, d.dy, Math.max(.5, 1 - Math.hypot(d.dx, d.dy) / 400), 'none'); });
    const end = e => {
      if (!d || e.pointerId !== d.id) return; const g = d, L = Math.hypot(g.dx, g.dy), fast = L > 14 && L / Math.max(1, performance.now() - g.t) > .5; d = null;
      if (!moved) return;                                                                 // просто тап — нічого не чіпаємо (його обробляє власник картки)
      setTimeout(() => { moved = false; }, 60);                                           // «клік» одразу після жесту вже погашено — прапорець знімаємо
      if (!el.classList.contains('show')) { clear(); return; }                              // картка вже сама сховалась (7 с)
      if (e.type === 'pointercancel' || !(L > 48 || fast)) { put(0, 0, 1, 'transform .2s,opacity .2s'); setTimeout(() => { if (!d) clear(); }, 220); return; }   // замало — назад на місце
      const k = Math.max(innerWidth, innerHeight) / L;                                      // відлітає за край у бік руху
      put(g.dx * k, g.dy * k, 0, 'transform .28s ease-in,opacity .22s'); el.style.pointerEvents = 'none';
      setTimeout(() => { el.style.pointerEvents = ''; moved = false; el.click(); el.classList.remove('show'); if (!d) clear(); }, 290);   // click — щоб власник картки закрив її по-своєму (як від тапу)
    };
    el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
  },
  /** Перекласти весь HTML-інтерфейс поточною мовою (викликається і при зміні мови). */
  applyLang() {
    const $ = this.$, T = NX.t;
    $('tagline').textContent = T('ui.tagline');
    $('copy').textContent = T('ui.brand');                                                     // © / ™ (docs/BRAND.md)
    $('hint').textContent = T('ui.hint'); $('tg').textContent = T('ui.dialog'); $('q').placeholder = T('ui.ask'); $('labtitle').textContent = T('ui.labTitle');
    $('rnd').textContent = T('ui.random'); $('rst').textContent = T('ui.reset'); $('lx').setAttribute('aria-label', T('ui.close'));
    // підказки для екранних читачів і title — теж мовою сайту
    [['world', 'ui.room'], ['lab', 'ui.lab'], ['pl', 'ui.prev'], ['pr', 'ui.next']].forEach(([id, k]) => { const el = $(id); if (el) el.setAttribute('aria-label', T(k)); });
    const sb = document.querySelector('#ask button'); if (sb) sb.setAttribute('aria-label', T('ui.send'));
    NX.ui.skinlab.CATS && NX.ui.skinlab.relabel(); NX.ui.chat.relabel && NX.ui.chat.relabel();
    if (NX.nexi.task) { const id = NX.nexi.task.id; NX.nexi.task.title = T('act.' + id + '.title'); NX.nexi.task.steps = T('act.' + id + '.steps'); }
  },
  firstTouch() { this.$('hint').style.display = 'none'; },
  toast(m) { const t = this.$('toast'); t.textContent = m; t.classList.add('show'); clearTimeout(this._tt); this._tt = setTimeout(() => t.classList.remove('show'), 1800); },
  /** Показати/сховати бабл над Nexi (текст друкується по літері). */
  bubble(text) { const b = this.$('bub'); if (!text) { b.style.display = 'none'; this.typed = null; return; } this.typed = { text, t: 0 }; b.style.display = 'block'; },
  update(dt, t) {
    // бабл
    const b = this.$('bub');
    if (this.typed) {
      this.typed.t += dt; b.lastElementChild.textContent = this.typed.text.slice(0, Math.floor(this.typed.t * 40));
      const [sx, sy] = NX.nexi.headScreen || [0, 0], bw = b.offsetWidth, bh = b.offsetHeight, lab = NX.ui.skinlab.open ? this.$('lab').offsetWidth : 0;
      const L = Math.max(8, Math.min(innerWidth - bw - 8 - lab, sx - 40)); b.style.left = L + 'px'; b.style.top = Math.max(64, sy - bh - 14) + 'px'; b.style.setProperty('--tail', Math.max(10, Math.min(bw - 24, sx - L - 6)) + 'px');
    }
    // чип поточної задачі
    const k = NX.nexi.task, el = this.$('task');
    if (k) { el.style.display = 'flex'; el.style.borderColor = k.color; this.$('tk-n').textContent = NX.t(k.auto ? 'ui.free' : 'ui.task'); const st = Array.isArray(k.steps) && k.steps.length ? k.steps[Math.min(k.steps.length - 1, Math.floor(k.prog * k.steps.length))] : ''; this.$('tk-t').textContent = k.title + (st ? ' · ' + st : ''); this.$('tk-p').style.setProperty('--p', (k.prog * 100 | 0) + '%'); }
    else el.style.display = 'none';
  },
};
