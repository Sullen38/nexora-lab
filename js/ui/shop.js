/* ============================================================================
 * ui/shop.js — ПЕРСОНАЛЬНИЙ NEXI: КАРТКА NFT, ЩО ДАЄ ПОКУПКА, ЦІНА (аркуш поверх лабораторії скінів)
 * ----------------------------------------------------------------------------
 * Відкривається з лабораторії (ui/skinlab.js):
 *   show('buy')         — образ вільний (своє поєднання або готовий скін, ще не куплений): картка NFT зі скіном і НОМЕРОМ, який
 *                         отримає покупець (наступний за чергою: #001 — засновник, далі #002…; власник, 02.11), 8 частин-атрибутів,
 *                         що дає покупка, ціна, кнопка;
 *   show('view', owner) — Nexi власника з вкладки «Власники»: картка з номером, власник і з якого часу; свого — «Вдягнути».
 * Правила й список власників — actors/nexi/owners.js, картка — actors/nexi/nft_card.js, план NFT — docs/NFT.md.
 * КРОК 1 (02.11): справжньої оплати немає — кнопка «ПРОДАЖ СКОРО» неактивна, нічого не списується й не резервується.
 * «Скопіювати код» — код і ключ образу (так власник проєкту надсилає свого Nexi: запишемо його #001 «Засновник»).
 * Крок 3 — тут з'явиться оплата: email (він же гаманець) -> checkout -> NFT. Усі тексти — словники (own.*), 4 мови.
 * ========================================================================== */
NX.ui.shop = {
  open: false, mode: null, look: null, owner: null,
  $: id => document.getElementById(id),
  // з якої категорії словника брати назву частини (голова, спина й реліквія — це аксесуари skin.acc)
  CAT: { theme: 'theme', body: 'body', arms: 'arms', legs: 'legs', ant: 'ant', head: 'acc', back: 'acc', hand: 'acc' },
  init() {
    this.$('shx').onclick = () => this.hide();
    this.$('shcopy').onclick = () => this.copy();
    this.$('shbuy').onclick = () => this.act();
    this.relabel();
  },
  relabel() { this.$('shx').setAttribute('aria-label', NX.t('ui.close')); this.$('shcopy').textContent = NX.t('own.copy'); if (this.open) this.render(); },
  show(mode, owner) {
    this.mode = mode; this.owner = owner || null; this.look = owner ? NX.owners.lookOf(owner.key) : Object.assign({}, NX.nexi.look);
    this.open = true; const s = this.$('sheet'); s.classList.add('open'); s.scrollTop = 0; this.render();
  },
  hide() { if (!this.open) return; this.open = false; this.$('sheet').classList.remove('open'); },
  render() {
    const O = NX.owners, L = this.look, o = this.owner, $ = this.$, buy = this.mode === 'buy', st = O.status(L), next = { no: O.nextNo() };
    $('shtitle').textContent = o ? (o.mine ? NX.t('own.yours') + ' ' : '') + 'NEXI ' + O.noText(o) : NX.t('own.title') + ' ' + O.noText(next);
    NX.nftCard(L, { no: o ? o.no : next.no }, $('nftcv'));                                // картка: скін + номер (покупка — наступний за чергою)
    $('shstat').textContent = o ? [NX.t('own.owner', { name: O.nameOf(o) + (o.founder ? ' · ' + NX.t('own.founder') : '') }), o.since ? NX.t('own.since', { date: O.dateText(o) }) : '', 'NFT 1/1 · Base'].filter(Boolean).join(' · ')
      : st.preset ? NX.t('own.presetBuy', { name: NX.t('skin.skin.' + st.preset) }) : NX.t('own.avail');
    const dl = $('shattr'); dl.innerHTML = '';                                          // атрибути — 8 частин образу (вони ж атрибути NFT)
    O.PARTS.forEach(k => { const dt = document.createElement('dt'), dd = document.createElement('dd'), v = L[k];
      dt.textContent = NX.t('own.attr.' + k); dd.textContent = v == null ? NX.t('own.nothing') : NX.t('skin.' + this.CAT[k] + '.' + v); dl.append(dt, dd); });
    const ul = $('shperks'); ul.innerHTML = ''; ul.hidden = !buy;
    if (buy) [].concat(NX.t('own.perks'), NX.t('own.perkNo', { no: O.noText(next) })).forEach(p => { const li = document.createElement('li'); li.textContent = p; ul.appendChild(li); });
    // ціна й кнопка: купівля — поки «продаж скоро» (неактивна); «один Nexi на людину» — якщо свій уже є; свій — «вдягнути»
    const b = $('shbuy'), pr = $('shprice'), note = $('shnote'), mine = o && o.mine;
    pr.textContent = buy ? O.priceText() : ''; pr.hidden = !buy;
    b.hidden = !(buy || mine); b.disabled = buy; b.className = 'buy' + (mine ? ' wear' : '');
    b.textContent = mine ? NX.t('own.wear') : O.me ? NX.t('own.haveOne', { no: O.noText(O.me) }) : NX.t('own.soon');
    note.textContent = buy && !O.me ? NX.t('own.soonNote') : ''; note.hidden = !note.textContent;
    $('shcode').textContent = O.code(L) + ' · ' + O.key(L);
  },
  /** Кнопка аркуша: свій Nexi — вдягнути й зберегти (купівлі в кроці 1 немає — кнопка неактивна). */
  act() {
    if (!(this.owner && this.owner.mine)) return;
    NX.nexi.look = NX.owners.lookOf(this.owner.key); NX.ui.skinlab.keep(); NX.ui.skinlab.installFx(); this.hide(); NX.ui.skinlab.grid();
  },
  /** Скопіювати код і ключ образу (буфер обміну; якщо браузер не дав — виділити текст, щоб скопіювати вручну). */
  copy() {
    const el = this.$('shcode'), txt = el.textContent, ok = () => NX.ui.hud.toast(NX.t('own.copied')), sel = () => { const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(ok, sel); else { sel(); try { if (document.execCommand('copy')) ok(); } catch (e) {} }
  },
};
