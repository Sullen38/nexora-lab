/* ============================================================================
 * actors/nexi/owners.js — ПЕРСОНАЛЬНІ NEXI: ПРАВИЛА УНІКАЛЬНОСТІ Й РЕЄСТР ВЛАСНИКІВ (NX.owners)
 * ----------------------------------------------------------------------------
 * Власник (02.11): «у кожного користувача може бути персональний скін — повторювати скіни не можна; досить, щоб хоч одна
 * річ відрізнялась; кожен такий скін — 99,99 € і автоматично NFT, один екземпляр; у майстерні видно всіх власників з їхніми
 * Nexi; мати можна лише один». Його рішення: оплата карткою, гаманець створюється за email; мережа Base; NFT можна
 * перепродати (роялті — Nexora; «один Nexi на гаманець» — правило в самому контракті); безкоштовно — стандартний Nexi й 17
 * готових скінів, у лабораторії приміряти можна будь-що, а ЗАЛИШИТИ власне поєднання — лише купивши. План — docs/NFT.md.
 *
 *   ДНК образу — 8 частин (PARTS): колір, тулуб, руки, ноги, антена, голова, спина, реліквія (у руці). Обличчя — емоції Nexi,
 *     ефекти — його настрій (nexi.js), тож не рахуються. Два персональні Nexi мусять відрізнятися хоча б однією частиною.
 *   key(look)    — 'theme/body/arms/legs/ant/head/back/hand' ('-' — нічого): за ним унікальність, база даних, атрибути NFT
 *   lookOf(key)  — образ назад із ключа (так власник надсилає «свого» Nexi: код + ключ)
 *   code(look)   — коротке ім'я для людей: NX-XXXXXX (хеш ключа; лише для показу — унікальність за key)
 *   status(look) — { kind, key, preset, owner }: 'preset' — стандарт або готовий скін (безкоштовно, спільний для всіх),
 *                  'avail' — вільний персональний (можна купити), 'taken' — уже має власник, 'mine' — мій персональний
 *   keepable(look) / sanitize(look) — чи можна залишити собі (зберегти) / що з образу можна залишити (інакше — стандарт)
 *   list         — власники [{ no, name, key, since, founder, mine }] за номером; me — мій запис (поки немає акаунтів —
 *                  лише в демо); nameOf(o), noText(o), dateText(o) — для показу; priceText() — 99,99 € мовою сайту
 * КРОК 1 (02.11): справжньої оплати, акаунтів і NFT ще НЕМАЄ — кнопка купівлі показує «продаж скоро» (ui/shop.js); список
 * власників — з цього файлу (OWNERS, зараз порожній: продажів ще не було). Крок 2 — бекенд: api (GET список, свій запис).
 * Демо-власники для знімків і перевірки — ЛИШЕ з адресою #owners-demo (на сайті за замовчуванням — тільки справжні).
 * ========================================================================== */
NX.owners = (() => {
  const PRICE = 99.99, CUR = 'EUR', CHAIN = 'base', NAME_MAX = 18;
  const PARTS = ['theme', 'body', 'arms', 'legs', 'ant', 'head', 'back', 'hand'];
  // СПРАВЖНІ власники — до бекенду записуються сюди: { no, name, key, since: 'РРРР-ММ-ДД', founder }. Поки продажів немає — порожньо.
  const OWNERS = [];
  // ДЕМО (лише #owners-demo): п'ять прикладів, перший — «мій» (видно стан «твій Nexi» і правило «один на людину»)
  const DEMO = [
    { theme: 'gold', body: 'royal', arms: 'gold', legs: 'gold', ant: 'crown', head: null, back: 'cape', hand: 'excalibur' },
    { theme: 'neon', body: 'energy', arms: 'neon', legs: 'neon', ant: 'halo', head: 'goggles', back: 'wings', hand: 'blade' },
    { theme: 'forest', body: 'camo', arms: 'gloves', legs: 'boots', ant: 'stem', head: 'flowers', back: 'backpack', hand: 'staff' },
    { theme: 'shadow', body: 'cyborg', arms: 'power', legs: 'jet', ant: 'horns', head: 'bandana', back: 'scarf', hand: 'gauntlet' },
    { theme: 'water', body: 'crystal', arms: 'holo', legs: 'magnet', ant: 'holo', head: 'helmet', back: null, hand: 'trident' }];

  const val = (L, k) => { const v = L[k] === undefined ? DEFAULT_LOOK[k] : L[k]; return v == null ? '-' : v; };
  const key = L => PARTS.map(k => val(L, k)).join('/');
  const lookOf = s => { const a = String(s).split('/'), L = Object.assign({}, DEFAULT_LOOK); PARTS.forEach((k, i) => { if (a[i] !== undefined) L[k] = a[i] === '-' ? null : a[i]; }); return L; };
  // код: FNV-1a (32 біти) від ключа -> 30 біт -> 6 знаків Crockford base32 (без I, L, O, U — не сплутати)
  const B32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  const code = L => { let h = 0x811c9dc5; const s = typeof L === 'string' ? L : key(L); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    let out = ''; for (let i = 0; i < 6; i++) { out = B32[h & 31] + out; h >>>= 5; } return 'NX-' + out; };
  // БЕЗКОШТОВНІ образи: стандартний («Класика») і 17 готових скінів — без реліквії в руці (реліквія вже робить образ персональним)
  const FREE = new Map([[key(DEFAULT_LOOK), 'classic']]); Object.keys(SKINS).forEach(id => FREE.set(key(skinLook(id)), id));

  const R = {
    PRICE, CUR, CHAIN, PARTS, NAME_MAX, key, lookOf, code,
    demo: /owners-demo/.test(location.hash), api: null,                                     // api — бекенд (крок 2)
    list: [], me: null, byKey: new Map(),
    /** Список власників (зараз — OWNERS з репозиторію або демо); перебудувати індекси. */
    set(list) {
      this.list = list.slice().sort((a, b) => a.no - b.no); this.byKey = new Map(this.list.map(o => [o.key, o])); this.me = this.list.find(o => o.mine) || null;
    },
    status(L) {
      const k = key(L);
      if (FREE.has(k)) return { kind: 'preset', key: k, preset: FREE.get(k) };
      const o = this.byKey.get(k); if (o) return { kind: o.mine ? 'mine' : 'taken', key: k, owner: o };
      return { kind: 'avail', key: k };
    },
    keepable(L) { const s = this.status(L).kind; return s === 'preset' || s === 'mine'; },
    /** Що з образу можна залишити: він сам; або без реліквії (готовий скін + реліквія -> готовий скін); або стандартний. */
    sanitize(L) {
      if (this.keepable(L)) return L;
      const bare = Object.assign({}, L, { hand: null }); if (this.keepable(bare)) return bare;
      return Object.assign({}, DEFAULT_LOOK);
    },
    nameOf(o) { return o.demo ? NX.t('own.demoName', { n: o.demo }) : String(o.name || '').slice(0, NAME_MAX); },
    noText(o) { return '#' + String(o.no).padStart(3, '0'); },
    dateText(o) { if (!o.since) return ''; const d = new Date(o.since + 'T12:00:00'), loc = { uk: 'uk-UA', en: 'en-GB', pl: 'pl-PL', nl: 'nl-NL' }[NX.i18n.lang] || 'uk-UA';
      return isNaN(d) ? o.since : d.toLocaleDateString(loc, { day: '2-digit', month: '2-digit', year: 'numeric' }); },
    priceText() { return NX.t('own.price', { v: NX.num(PRICE, 2) }); },
    /** Крок 2: власники з бекенду (api) — поки api немає, лишається список з репозиторію. */
    async load() {
      if (!this.api) return;
      try { const r = await fetch(this.api + '/owners'); if (r.ok) this.set((await r.json()).owners || []); } catch (e) { console.warn('[owners]', e); }
    },
  };
  R.set(R.demo ? DEMO.map((L, i) => ({ no: i + 1, demo: i + 1, key: key(L), since: '2026-11-02', mine: i === 0 })) : OWNERS);
  return R;
})();
