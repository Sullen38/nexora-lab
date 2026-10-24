/* ============================================================================
 * ui/zones.js — МЕНЮ РОБОЧИХ ЗОН І КАРТКИ РЕЗУЛЬТАТІВ
 * ----------------------------------------------------------------------------
 * Тап по робочій зоні (AI-центр, Аналітика, Маркетинг, Інструменти)
 * відкриває голо-меню з 3 конкретними задачами. Обрана задача:
 *   Nexi іде в зону -> працює -> показує КАРТКУ РЕЗУЛЬТАТУ з цифрами
 *   (поки демо-цифри; тут підключається справжній бекенд).
 * У вільний час Nexi теж сам виконує задачі — картка "Nexi зробив сам".
 * Тексти: js/i18n/*.js -> zones.<зона>.<задача>.t (назва) / .r (результат)
 * ========================================================================== */
NX.ui.zones = {
  TASKS: { ai: { reply: [5, 40], mail: [2, 5], summary: [2, 6] }, analytics: { sales: [8, 34], traffic: [3, 48], forecast: [5, 22] },
           marketing: { post: [800, 5200], ads: [40, 380], mailing: [24, 61] }, tools: { crm: [120, 900], calendar: [4, 15], auto: [2, 9] } },
  /** Меню не-робочих зон: просто список дій (активностей Nexi). */
  MENUS: {},   // (диван меню не має: Nexi сам вирішує, objects/sofa.js -> pick())
  $: id => document.getElementById(id),
  init() { this.$('zmenu').addEventListener('pointerdown', e => e.stopPropagation()); document.addEventListener('pointerdown', e => { if (!this.$('zmenu').contains(e.target)) this.hide(); }); },
  has(zone) { return !!this.TASKS[zone]; },
  hasMenu(zone) { return this.has(zone) || !!this.MENUS[zone]; },
  pick(zone) { const k = Object.keys(this.TASKS[zone]); return k[Math.random() * k.length | 0]; },
  /** Показати меню зони біля точки екрана (sx, sy). */
  open(zone, sx, sy) {
    const m = this.$('zmenu'); m.innerHTML = '';
    const h = document.createElement('b'); h.textContent = NX.t(this.MENUS[zone] ? 'obj.' + zone : 'nav.' + zone).toUpperCase(); m.appendChild(h);
    if (this.MENUS[zone]) { this.MENUS[zone].forEach(id => { const b = document.createElement('button'); b.textContent = NX.t('act.' + id + '.title'); b.onclick = () => { this.hide(); NX.nexi.do(id); }; m.appendChild(b); }); return this.place(m, sx, sy); }
    Object.keys(this.TASKS[zone]).forEach(task => { const b = document.createElement('button'); b.textContent = NX.t(`zones.${zone}.${task}.t`); b.onclick = () => { this.hide(); NX.nexi.do(zone, true, { task }); }; m.appendChild(b); });
    const g = document.createElement('button'); g.className = 'go'; g.textContent = NX.t('zones.go'); g.onclick = () => { this.hide(); NX.nexi.do(zone, true); }; m.appendChild(g);
    this.place(m, sx, sy);
  },
  place(m, sx, sy) {
    m.style.display = 'flex'; const w = m.offsetWidth, hh = m.offsetHeight;
    m.style.left = Math.max(8, Math.min(innerWidth - w - 8, sx - w / 2)) + 'px'; m.style.top = Math.max(64, Math.min(innerHeight - hh - 8, sy - hh - 10)) + 'px';
  },
  hide() { this.$('zmenu').style.display = 'none'; },
  /** Картка результату після виконаної задачі. */
  result(zone, task, auto) {
    const [a, b] = this.TASKS[zone][task], n = Math.round(a + Math.random() * (b - a)), r = this.$('result');
    r.querySelector('b').textContent = NX.t(auto ? 'ui.resultAuto' : 'ui.result') + ' · ' + NX.t('nav.' + zone);
    r.querySelector('span').textContent = NX.t(`zones.${zone}.${task}.r`, { n });
    r.style.borderColor = { ai: '#3be8ff', analytics: '#ffc94d', marketing: '#d94bff', tools: '#3bff8a' }[zone];
    r.classList.add('show'); clearTimeout(this._rt); this._rt = setTimeout(() => r.classList.remove('show'), 7000);
    NX.ui.chat.add('b', NX.t(`zones.${zone}.${task}.r`, { n }));
  },
};
