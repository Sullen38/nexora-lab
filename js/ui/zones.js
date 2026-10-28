/* ============================================================================
 * ui/zones.js — ЗАДАЧІ РОБОЧИХ ЗОН І КАРТКИ РЕЗУЛЬТАТІВ
 * ----------------------------------------------------------------------------
 * У кожної робочої зони (AI-центр, Аналітика, Маркетинг, Інструменти) — 3 конкретні задачі. Меню немає: Nexi САМ
 * бере задачі по черзі (pick) -> працює -> показує КАРТКУ РЕЗУЛЬТАТУ з цифрами (поки демо-цифри; тут підключається
 * справжній бекенд). Чиста основа (29.10): зон у кімнаті ще немає — задачі він робить з дивану (сценарій sofaWork);
 * коли зона повернеться, тап по ній запускає її задачу (ui/input.js). У вільний час — картка "Nexi зробив сам".
 * Тексти: js/i18n/*.js -> zones.<зона>.<задача>.t (назва) / .r (результат)
 * ========================================================================== */
NX.ui.zones = {
  TASKS: { ai: { reply: [5, 40], mail: [2, 5], summary: [2, 6] }, analytics: { sales: [8, 34], traffic: [3, 48], forecast: [5, 22] },
           marketing: { post: [800, 5200], ads: [40, 380], mailing: [24, 61] }, tools: { crm: [120, 900], calendar: [4, 15], auto: [2, 9] } },
  $: id => document.getElementById(id),
  has(zone) { return !!this.TASKS[zone]; },
  /** Яку задачу зони робити далі: ПО ЧЕРЗІ (не повторюючи ту саму підряд); пам'ять — у localStorage. */
  nextIdx: JSON.parse(localStorage.getItem('nx.zoneNext') || '{}'),
  pick(zone) {
    const k = Object.keys(this.TASKS[zone]), i = (this.nextIdx[zone] || 0) % k.length;
    this.nextIdx[zone] = (i + 1) % k.length; try { localStorage.setItem('nx.zoneNext', JSON.stringify(this.nextIdx)); } catch (e) {}
    return k[i];
  },
  /** Що вже зроблено в зоні (для екранів): останні записи з історії Nexi. */
  done: JSON.parse(localStorage.getItem('nx.zoneDone') || '{}'),
  log(zone, task, n) {
    const L = this.done[zone] = this.done[zone] || []; L.push({ task, n, at: Date.now() }); if (L.length > 6) L.shift();
    try { localStorage.setItem('nx.zoneDone', JSON.stringify(this.done)); } catch (e) {}
  },
  /** Картка результату після виконаної задачі. */
  result(zone, task, auto) {
    const [a, b] = this.TASKS[zone][task], n = Math.round(a + Math.random() * (b - a)), r = this.$('result'); this.log(zone, task, n);
    r.querySelector('b').textContent = NX.t(auto ? 'ui.resultAuto' : 'ui.result') + ' · ' + NX.t('nav.' + zone);
    r.querySelector('span').textContent = NX.t(`zones.${zone}.${task}.r`, { n });
    r.style.borderColor = { ai: '#3be8ff', analytics: '#ffc94d', marketing: '#d94bff', tools: '#3bff8a' }[zone];
    r.classList.add('show'); clearTimeout(this._rt); this._rt = setTimeout(() => r.classList.remove('show'), 7000);
    NX.ui.chat.add('b', NX.t(`zones.${zone}.${task}.r`, { n }));
  },
};
