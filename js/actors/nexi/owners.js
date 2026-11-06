/* ============================================================================
 * actors/nexi/owners.js — КАРТКИ NEXI: ПРАВИЛА УНІКАЛЬНОСТІ Й РЕЄСТР ВЛАСНИКІВ (NX.owners)
 * ----------------------------------------------------------------------------
 * Власник (06.11, «побажання до скінів»): «образ — який людина захотіла, повністю (готовий чи свій), — вона з ним ходить, і він
 * зберігається; купувати не обов'язково. Купується КАРТКА з номером — 99,99 €, з будь-яким образом, навіть звичайним».
 * Тож (крок С1): ОБРАЗ — БУДЬ-ЯКИЙ І БЕЗКОШТОВНО, він не продається й не «зайнятий»; ТОВАР — КАРТКА (NFT 1/1 на Base) з
 * номером і образом. Унікальність — на картках: другої картки з таким самим образом (8 частин) не буде — хто купив перший,
 * той «власник образу» на картці; решта може ходити в ньому, але картку мусить брати з іншим образом (хоч одна річ інакша).
 * До 06.11 (власник 02.11): персональний образ без покупки не зберігався, куплений готовий скін знімався з інших — скасовано.
 * Решта його рішень лишається: оплата карткою, гаманець за email; мережа Base; перепродаж з роялті; «одна картка на людину» —
 * правило в контракті; #001 — засновник, далі за чергою. План — docs/NFT.md.
 *
 *   ДНК образу — 8 частин (PARTS): колір, тулуб, руки, ноги, антена, голова, спина, реліквія (у руці). Обличчя — емоції Nexi,
 *     ефекти — його настрій (nexi.js), тож не рахуються. Дві картки мусять відрізнятися хоча б однією частиною.
 *   key(look)    — 'theme/body/arms/legs/ant/head/back/hand' ('-' — нічого): за ним унікальність карток, база даних, атрибути NFT
 *   lookOf(key)  — образ назад із ключа (так власник надсилає «свого» Nexi: код + ключ)
 *   code(look)   — коротке ім'я для людей: NX-XXXXXX (хеш ключа; лише для показу — унікальність за key)
 *   status(look) — { kind, key, preset, owner }: 'std' — стандартний, 'preset' — готовий скін, 'avail' — своє поєднання (усі
 *                  три — безкоштовні й картка з ними ще вільна), 'taken' — образ уже на чиїйсь картці (і готовий скін теж:
 *                  тоді preset — який), 'mine' — на моїй картці
 *   forSale(look) — чи можна купити картку з цим образом (образ ще не на картці); nextNo() — номер наступної картки
 *                  (#001 — засновник, FOUNDER; далі — за чергою)
 *   list         — власники карток [{ no, name, key, since, founder, mine }] за номером; me — мій запис (поки немає акаунтів —
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
  // ДЕМО (лише #owners-demo): п'ять прикладів, перший — «мій» (видно стан «твій Nexi» і правило «один на людину»); третій —
  // готовий «Лісовик» як є (видно, що куплений готовий скін — уже лише в покупця)
  const DEMO = [
    { theme: 'gold', body: 'royal', arms: 'gold', legs: 'gold', ant: 'crown', head: null, back: 'cape', hand: 'excalibur' },
    { theme: 'neon', body: 'energy', arms: 'neon', legs: 'neon', ant: 'halo', head: 'goggles', back: 'wings', hand: 'blade' },
    'forest',
    { theme: 'shadow', body: 'cyborg', arms: 'power', legs: 'jet', ant: 'horns', head: 'bandana', back: 'scarf', hand: 'gauntlet' },
    { theme: 'water', body: 'crystal', arms: 'holo', legs: 'magnet', ant: 'holo', head: 'helmet', back: null, hand: 'trident' }];

  const val = (L, k) => { const v = L[k] === undefined ? DEFAULT_LOOK[k] : L[k]; return v == null ? '-' : v; };
  const key = L => PARTS.map(k => val(L, k)).join('/');
  const lookOf = s => { const a = String(s).split('/'), L = Object.assign({}, DEFAULT_LOOK); PARTS.forEach((k, i) => { if (a[i] !== undefined) L[k] = a[i] === '-' ? null : a[i]; }); return L; };
  // код: FNV-1a (32 біти) від ключа -> 30 біт -> 6 знаків Crockford base32 (без I, L, O, U — не сплутати)
  const B32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  const code = L => { let h = 0x811c9dc5; const s = typeof L === 'string' ? L : key(L); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    let out = ''; for (let i = 0; i < 6; i++) { out = B32[h & 31] + out; h >>>= 5; } return 'NX-' + out; };
  // ГОТОВІ образи: стандартний («Класика», STD) і 16 готових скінів без реліквії — щоб у рядку стану назвати скін; усі образи
  // безкоштовні (крок С1), а картка з готовим скіном (як і з будь-яким образом) продається один раз.
  const STD = key(DEFAULT_LOOK), FREE = new Map([[STD, 'classic']]); Object.keys(SKINS).forEach(id => FREE.set(key(skinLook(id)), id));
  const FOUNDER = 1;                                                                    // Nexi #001 — засновник (власник проєкту), покупці — з #002

  const R = {
    PRICE, CUR, CHAIN, PARTS, NAME_MAX, FOUNDER, key, lookOf, code,
    demo: /owners-demo/.test(location.hash), api: null,                                     // api — бекенд (крок 2)
    list: [], me: null, byKey: new Map(),
    /** Список власників (зараз — OWNERS з репозиторію або демо); перебудувати індекси. */
    set(list) {
      this.list = list.slice().sort((a, b) => a.no - b.no); this.byKey = new Map(this.list.map(o => [o.key, o])); this.me = this.list.find(o => o.mine) || null;
    },
    status(L) {
      const k = key(L);
      if (k === STD) return { kind: 'std', key: k, preset: 'classic' };
      const o = this.byKey.get(k), p = FREE.get(k) || null; if (o) return { kind: o.mine ? 'mine' : 'taken', key: k, owner: o, preset: p };
      return p ? { kind: 'preset', key: k, preset: p } : { kind: 'avail', key: k };
    },
    /** Картку з цим образом ще можна купити (образ ще не на жодній картці)? */
    forSale(L) { const s = this.status(L).kind; return s === 'std' || s === 'preset' || s === 'avail'; },
    /** Готовий скін уже на чиїйсь картці? -> запис власника (для плиток лабораторії й голограми). */
    ownerOf(id) { return this.byKey.get(key(skinLook(id))) || null; },
    /** Номер наступного покупця: після засновника (#001) і всіх, хто вже купив (крок 2 — номер дає сервер під час оплати). */
    nextNo() { return Math.max(FOUNDER, ...this.list.map(o => o.no)) + 1; },
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
  R.set(R.demo ? DEMO.map((L, i) => ({ no: i + 1, demo: i + 1, key: key(typeof L === 'string' ? skinLook(L) : L), since: '2026-11-02', mine: i === 0 })) : OWNERS);
  return R;
})();
