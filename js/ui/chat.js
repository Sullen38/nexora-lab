/* ============================================================================
 * ui/chat.js — ДІАЛОГ З NEXI
 * ----------------------------------------------------------------------------
 * Поки що без справжнього AI: ключові слова (усіма 4 мовами) запускають
 * потрібний сценарій. Тут же швидкі кнопки-команди.
 * Пізніше сюди підключається бекенд з мовною моделлю (метод reply()).
 * ========================================================================== */
NX.ui.chat = {
  QUICK: [['work', 'sofaWork'], ['city', 'window'], ['dance', 'dance'], ['cat', 'petCat'], ['skin', 'skin']],   // швидкі команди (лише наявні сценарії)
  /** Ключові слова всіх 4 мов разом (js/i18n/*.js -> kw), щоб розуміти будь-якою. */
  kw() { const out = {}; Object.values(NX.i18n.dict).forEach(d => Object.entries(d.kw || {}).forEach(([k, v]) => { out[k] = out[k] ? out[k] + '|' + v : v; })); return Object.entries(out).map(([k, v]) => [k, new RegExp(v, 'i')]); },
  init() {
    const $ = id => document.getElementById(id);
    $('tg').onclick = () => $('panel').classList.toggle('open');
    this.QUICK.forEach(([n, id]) => { const b = document.createElement('button'); b.dataset.k = n; b.onclick = () => { this.add('u', b.textContent); id === 'skin' ? NX.ui.skinlab.show() : NX.nexi.do(id); }; $('chips').appendChild(b); });
    this.relabel();
    $('ask').onsubmit = e => { e.preventDefault(); const v = $('q').value.trim(); if (!v) return; $('q').value = ''; this.add('u', v); this.reply(v); };
  },
  relabel() { document.querySelectorAll('#chips button').forEach(b => b.textContent = NX.t('chat.quick.' + b.dataset.k)); },
  reply(v) {
    const m = this.kw().find(k => (k[0] === 'skin' || NX.acts[k[0]]) && k[1].test(v)); if (m) return m[0] === 'skin' ? NX.ui.skinlab.show() : NX.nexi.do(m[0]);   // ключі зон, яких ще немає, — пропускаються
    NX.nexi.lastCmd = NX.time; NX.nexi.temp = 'think'; NX.nexi.tempT = NX.time + 3;
    NX.nexi.say(NX.t('chat.fallback'));
  },
  add(c, t) { const log = document.getElementById('log'), d = document.createElement('div'); d.className = c; d.textContent = t; log.appendChild(d); log.scrollTop = log.scrollHeight; while (log.children.length > 40) log.firstChild.remove(); },
};
