/* ============================================================================
 * ui/chat.js — ДІАЛОГ З NEXI
 * ----------------------------------------------------------------------------
 * Поки що без справжнього AI: ключові слова в повідомленні запускають
 * потрібний сценарій. Тут же швидкі кнопки-команди.
 * Пізніше сюди підключається бекенд з мовною моделлю (метод reply()).
 * ========================================================================== */
NX.ui.chat = {
  KW: [['ai', /ai|штучн|чат|лист|текст|відпов|клієнт/i], ['analytics', /аналіт|звіт|продаж|метрик|дані|цифр/i], ['marketing', /маркет|реклам|пост|кампан|розсил/i],
    ['tools', /інструмент|інтеграц|crm|календар|пошт/i], ['portal', /портал|проєкт|команд/i], ['coffee', /кав/i], ['petCat', /кіт|кота|рудик|погладь/i],
    ['feedCat', /нагодуй|корм/i], ['sofa', /диван|відпоч|читай/i], ['sleep', /спати|сон|спи/i], ['dance', /танц/i], ['home', /додому|док|головн/i]],
  QUICK: [['Звіт', 'analytics'], ['Пост', 'marketing'], ['Інтеграції', 'tools'], ['Кава', 'coffee'], ['Кіт', 'petCat'], ['Скін', 'skin']],
  init() {
    const $ = id => document.getElementById(id);
    $('tg').onclick = () => $('panel').classList.toggle('open');
    this.QUICK.forEach(([n, id]) => { const b = document.createElement('button'); b.textContent = n; b.onclick = () => { this.add('u', n); id === 'skin' ? NX.ui.skinlab.show() : NX.nexi.do(id); }; $('chips').appendChild(b); });
    $('ask').onsubmit = e => { e.preventDefault(); const v = $('q').value.trim(); if (!v) return; $('q').value = ''; this.add('u', v); this.reply(v); };
  },
  reply(v) {
    if (/скін|вигляд|колір|костюм/i.test(v)) return NX.ui.skinlab.show();
    const m = this.KW.find(k => k[1].test(v)); if (m) return NX.nexi.do(m[0]);
    NX.nexi.lastCmd = NX.time; NX.nexi.temp = 'think'; NX.nexi.tempT = NX.time + 3;
    NX.nexi.say('Поки я вмію: AI-центр, аналітика, маркетинг, майстерня, інструменти, портал. А ще кава й Рудик. Що робимо?');
  },
  add(c, t) { const log = document.getElementById('log'), d = document.createElement('div'); d.className = c; d.textContent = t; log.appendChild(d); log.scrollTop = log.scrollHeight; while (log.children.length > 40) log.firstChild.remove(); },
};
