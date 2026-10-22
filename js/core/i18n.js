/* ============================================================================
 * core/i18n.js — МОВИ (українська, English, Polski, Nederlands)
 * ----------------------------------------------------------------------------
 * Тексти лежать у js/i18n/<мова>.js (кожна мова — окремий файл-словник).
 *   NX.t('nav.ai')          -> рядок поточною мовою (або масив, якщо там масив)
 *   NX.t('a.{n}', {n: 5})   -> підставляє змінні у {фігурні дужки}
 *   NX.pick('act.ai.lines') -> випадковий рядок з масиву
 * Мова обирається: збережений вибір -> мова телефону/браузера -> English.
 * Перемикач мов — у верхньому меню (ui/hud.js).
 * ========================================================================== */
NX.i18n = {
  LANGS: ['uk', 'en', 'pl', 'nl'], LABEL: { uk: 'UA', en: 'EN', pl: 'PL', nl: 'NL' },
  lang: 'uk', dict: {},
  add(lang, obj) { this.dict[lang] = obj; },
  detect() {
    try { const s = localStorage.getItem('nexi-lang'); if (this.LANGS.includes(s)) return s; } catch (e) {}
    for (const l of (navigator.languages || [navigator.language || 'en'])) { const p = String(l).slice(0, 2).toLowerCase(); if (this.LANGS.includes(p)) return p; }
    return 'en';
  },
  set(l) { this.lang = l; document.documentElement.lang = l; try { localStorage.setItem('nexi-lang', l); } catch (e) {} NX.ui.hud && NX.ui.hud.applyLang && NX.ui.hud.applyLang(); },
  get(obj, key) { return key.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj); },
};
NX.t = (key, vars) => {
  const I = NX.i18n; let v = I.get(I.dict[I.lang], key); if (v === undefined) v = I.get(I.dict.uk, key); if (v === undefined) return key;
  if (vars && typeof v === 'string') v = v.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
  return v;
};
NX.pick = key => { const a = NX.t(key); return Array.isArray(a) ? a[Math.random() * a.length | 0] : a; };
