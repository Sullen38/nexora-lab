/* ============================================================================
 * core/i18n.js — МОВИ (українська, English, Polski, Nederlands)
 * ----------------------------------------------------------------------------
 * Тексти лежать у js/i18n/<мова>.js (кожна мова — окремий файл-словник).
 *   NX.t('nav.ai')          -> рядок поточною мовою (або масив, якщо там масив)
 *   NX.t('a.{n}', {n: 5})   -> підставляє змінні у {фігурні дужки}
 *   NX.pick('act.ai.lines') -> випадковий рядок з масиву
 * Зараз мова за замовчуванням — українська (detect()). Для тесту інших мов
 * додай до адреси #lang-en, #lang-pl або #lang-nl.
 * ========================================================================== */
NX.i18n = {
  LANGS: ['uk', 'en', 'pl', 'nl'], LABEL: { uk: 'UA', en: 'EN', pl: 'PL', nl: 'NL' },
  lang: 'uk', dict: {},
  add(lang, obj) { this.dict[lang] = obj; },
  /** Поки що за замовчуванням УКРАЇНСЬКА. Інша мова — лише через адресу #lang-en / #lang-pl / #lang-nl.
   *  (Щоб знову брати мову телефону — розкоментуй рядок з navigator.languages.) */
  detect() {
    const h = (location.hash.match(/lang-(\w\w)/) || [])[1]; if (this.LANGS.includes(h)) return h;
    // for (const l of (navigator.languages || [])) { const p = String(l).slice(0, 2).toLowerCase(); if (this.LANGS.includes(p)) return p; }
    return 'uk';
  },
  /** Тексти, ЗАПЕЧЕНІ в растри й кеші (вивіски міста, постери, віддзеркалення в підлозі), підписуються на зміну мови й перебудовуються. */
  hooks: [],
  onLang(f) { this.hooks.push(f); },
  set(l) { this.lang = l; document.documentElement.lang = l; NX.ui.hud && NX.ui.hud.applyLang && NX.ui.hud.applyLang(); this.hooks.forEach(f => { try { f(l); } catch (e) { console.error(e); } }); },
  get(obj, key) { return key.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj); },
};
NX.t = (key, vars) => {
  const I = NX.i18n; let v = I.get(I.dict[I.lang], key); if (v === undefined) v = I.get(I.dict.uk, key); if (v === undefined) return key;
  if (vars && typeof v === 'string') v = v.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
  return v;
};
NX.pick = key => { const a = NX.t(key); return Array.isArray(a) ? a[Math.random() * a.length | 0] : a; };
/** Число з d знаками після коми — десятковим знаком мови (12,3 / 12.3). */
NX.num = (v, d = 1) => Number(v).toFixed(d).replace('.', NX.t('scene.dec') === 'scene.dec' ? '.' : NX.t('scene.dec'));
