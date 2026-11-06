/* ============================================================================
 * ui/skinlab.js — ЛАБОРАТОРІЯ СКІНІВ (відкривається лише в зоні СКІНИ — у коді workshop; тап по Nexi — привітання, nexi.hi)
 * ----------------------------------------------------------------------------
 * Категорії беруться з actors/nexi/skins.js: ГОТОВІ СКІНИ (з рідкістю — кольорова рамка), кольори, антени, тулуб, руки,
 * ноги, АКСЕСУАРИ (спина, голова) і РЕЛІКВІЇ (предмети в руці) — окремо (власник, 29.10); ВЛАСНИКИ — картки Nexi (02.11).
 * Обличчя тут немає: вирази Nexi обирає сам (емоції — nexi.js moodLife). Зміни одразу видно на Nexi в кімнаті.
 * ОБРАЗ — БУДЬ-ЯКИЙ, БЕЗКОШТОВНО Й ЗБЕРІГАЄТЬСЯ САМ (власник, 06.11: «образ — який людина захотіла, повністю, — вона з ним
 *   ходить, і він зберігається; коли закриваємо скіни — Nexi в тому, в що ми його зібрали; не треба кнопок „зберегти“ — само
 *   зберігає, на чому зупинилися, повністю, реліквія теж»): кожна зміна одразу пишеться в localStorage 'nexi-look' (persist),
 *   закриття нічого не знімає; готовий скін вдягається поверх реліквії (вона лишається). Кнопок «ЗБЕРЕГТИ» немає — лише
 *   «ВИПАДКОВО», «СКИНУТИ» і золота «КАРТКА #002 · 99,99 €». Поки акаунтів немає, «користувач» — його браузер (телефон чи
 *   комп'ютер); з акаунтами (docs/NFT.md, крок 2) образ зберігатиметься на сервері — однаковий на всіх пристроях.
 * КАРТКА NEXI (власник, 06.11: «купується картка з номером — 99,99 €, з будь-яким образом, навіть звичайним»; правила —
 *   actors/nexi/owners.js): рядок під прев'ю каже, що це за образ (стандарт · готовий скін · свій · уже на картці #00N —
 *   зміни хоч одну річ · на твоїй картці) і код; кнопка «КАРТКА #00N · 99,99 €» відкриває аркуш з картою NFT (ui/shop.js);
 *   якщо образ уже на чиїйсь картці — кнопка «ОБРАЗ УЖЕ НА КАРТЦІ #00N» (тап — підказка); своя — «ТВОЯ КАРТКА #001».
 * ========================================================================== */
NX.ui.skinlab = {
  open: false, cat: null,
  init() {
    const $ = id => document.getElementById(id);
    this.CATS = [{ k: 'skin', items: SKINS }, { k: 'theme', items: THEMES }, { k: 'ant', items: ANTS }, { k: 'body', items: BODIES }, { k: 'arms', items: ARMS },
      { k: 'legs', items: LEGS }, { k: 'acc', items: ACC_ITEMS }, { k: 'relic', items: RELICS }, { k: 'owners', items: null }];   // обличчя, емоції, ефекти й дії — сам Nexi (nexi.js), тут лише СТИЛЬ
    this.cat = this.CATS[0];
    this.CATS.forEach(c => { const b = document.createElement('button'); b.onclick = () => { this.cat = c; this.grid(); }; c.btn = b; $('cats').appendChild(b); });
    $('lx').onclick = () => this.hide(); addEventListener('keydown', e => { if (e.key !== 'Escape') return; if (NX.ui.shop.open) NX.ui.shop.hide(); else this.hide(); });
    $('pl').onclick = () => this.cycle(-1); $('pr').onclick = () => this.cycle(1);
    $('card').onclick = () => this.card();                                                   // картка з номером і цим образом (ui/shop.js)
    $('rst').onclick = () => { NX.nexi.look = { ...DEFAULT_LOOK }; this.persist(); this.grid(); };
    $('rnd').onclick = () => { const p = o => { const k = Object.keys(o); return k[Math.random() * k.length | 0]; }, r = Math.random;
      const backs = WEAR_ACCS.filter(k => ACCS[k].slot === 'back'), heads = WEAR_ACCS.filter(k => ACCS[k].slot === 'head');
      NX.nexi.look = r() < .5 ? skinLook(p(SKINS), { hand: r() < .45 ? HAND_ITEMS[r() * HAND_ITEMS.length | 0] : null, fx: 'none' })   // половина разів — готовий скін
        : { face: 'standard', ant: p(ANTS), body: p(BODIES), arms: p(ARMS), legs: p(LEGS), theme: p(THEMES), back: r() < .4 ? backs[r() * backs.length | 0] : null, head: r() < .35 ? heads[r() * heads.length | 0] : null, hand: r() < .45 ? HAND_ITEMS[r() * HAND_ITEMS.length | 0] : null, fx: 'none' };
      this.persist(); this.grid(); NX.nexi.emote('surprise', 1.5); };
    NX.ui.shop.init();
    this.relabel();
    this.pv = $('pv').getContext('2d'); this.pscr = document.createElement('canvas'); this.tcr = document.createElement('canvas');
    const loop = () => { if (this.open) { const t = NX.time, po = poseFor(['stand', 'wave', 'dance', 'stand'][Math.floor(t / 2.5) % 4], t, false), m = NX.nexi.mood && t < NX.nexi.moodT ? NX.nexi.mood : null;
      if (m) po.face = NX.nexi.faceOf(m);                                                     // у прев'ю — та сама емоція, що зараз у Nexi
      renderBot(NX.nexi.look, po, t, this.pscr); this.pv.clearRect(0, 0, SW, SH); this.pv.drawImage(this.pscr, 0, 0); } requestAnimationFrame(loop); }; loop();
  },
  /** Назви категорій і скінів поточною мовою. */
  relabel() { this.CATS.forEach(c => c.btn.textContent = NX.t('cats.' + c.k)); NX.ui.shop.relabel(); if (this.open) this.grid(); else this.state(); },
  name(c, id) { return NX.t('skin.' + (c.k === 'relic' ? 'acc' : c.k) + '.' + id); },
  show(fromWorkshop) { this.open = true; document.getElementById('lab').classList.add('open'); this.grid(); if (!fromWorkshop) NX.nexi.say(NX.pick('act.skinLab.lines')); },
  /** Закрити: Nexi лишається в тому, в що його зібрали (образ уже збережено при кожній зміні). */
  hide() { if (!this.open) return; this.open = false; NX.ui.shop.hide(); document.getElementById('lab').classList.remove('open'); this.persist(); },
  /** Золота кнопка внизу: картка з номером і цим образом (аркуш NFT) · образ уже на чиїйсь картці — підказка · своя — відкрити. */
  card() {
    const st = NX.owners.status(NX.nexi.look);
    if (st.kind === 'taken') return NX.ui.hud.toast(NX.t('own.takenToast'));
    NX.ui.shop.show(st.kind === 'mine' ? 'view' : 'buy', st.kind === 'mine' ? st.owner : null);
  },
  /** Запам'ятати образ на Nexi — будь-який, разом з реліквією (у цьому браузері — localStorage 'nexi-look'). */
  persist() { try { localStorage.setItem('nexi-look', JSON.stringify(NX.nexi.look)); } catch (e) {} return true; },
  /** Рядок під прев'ю (що це за образ, код) і золота кнопка картки. */
  state() {
    const O = NX.owners, L = NX.nexi.look, st = O.status(L), $ = id => document.getElementById(id), cb = $('card'), no = st.owner ? O.noText(st.owner) : O.noText({ no: O.nextNo() });
    $('own').className = 'own ' + st.kind;
    $('ownst').textContent = st.kind === 'std' ? NX.t('own.std') : st.kind === 'preset' ? NX.t('own.preset', { name: NX.t('skin.skin.' + st.preset) })
      : st.kind === 'avail' ? NX.t('own.avail')
      : st.kind === 'taken' ? NX.t('own.taken', { name: O.nameOf(st.owner), no: no })
      : NX.t('own.mine', { no: no });
    $('owncode').textContent = st.kind === 'std' ? '' : O.code(L);
    cb.className = 'card' + (st.kind === 'taken' ? ' busy' : st.kind === 'mine' ? ' mine' : '');
    cb.textContent = NX.t(st.kind === 'taken' ? 'own.cardTaken' : st.kind === 'mine' ? 'own.cardMine' : 'own.card', { no: no, price: O.priceText() });
  },
  isOn(c, id) { const L = NX.nexi.look; if (c.k === 'skin') return skinOf(L) === id; if (c.k === 'acc' || c.k === 'relic') return L[ACCS[id].slot] === id; if (c.k === 'act' || c.k === 'mood') return false; return (L[c.k] ?? DEFAULT_LOOK[c.k]) === id; },
  apply(c, id) {
    const n = NX.nexi, L = n.look; n.lastCmd = NX.time;
    if (c.k === 'skin') Object.assign(L, skinLook(id, L));                                  // готовий скін — увесь образ; реліквія в руці лишається (власник, 06.11)
    else if (c.k === 'acc' || c.k === 'relic') { const s = ACCS[id].slot; L[s] = L[s] === id ? null : id; }
    else if (c.k === 'act') { n.temp = id; n.tempT = NX.time + 4; }
    else if (c.k === 'mood') n.emote(id, 3);
    else L[c.k] = id;
    if (c.k !== 'act' && c.k !== 'mood') { this.installFx(); this.persist(); }                // кожна зміна — одразу збережено
    this.grid();
  },
  /** Ефект встановлення скіна: у капсулі майстерні — маніпулятор «зашиває» скін блискавкою (objects/workshop.js), інакше — іскри. */
  installFx() {
    const n = NX.nexi, W = NX.objects.workshop; if (W && W.install && n.loc === 'wsPad') { W.install(); return; }
    for (let i = 0; i < 12; i++) NX.fx.emit('spark', n.x + (Math.random() - .5) * 30, n.y - Math.random() * 50); NX.nexiPhys.kick(2); n.emote('surprise', 1.2);
  },
  cycle(d) { if (!this.cat.items) return; const ks = Object.keys(this.cat.items), cur = ks.findIndex(k => this.isOn(this.cat, k)); this.apply(this.cat, ks[(cur + d + ks.length) % ks.length]); },
  grid() {
    const g = document.getElementById('grid'), c = this.cat; this.CATS.forEach(x => x.btn.classList.toggle('on', x === c)); g.innerHTML = '';
    this.state();
    if (c.k === 'owners') return this.owners(g);
    Object.keys(c.items).forEach(id => {
      const b = document.createElement('button'), rar = c.k === 'skin' ? SKINS[id].rar : null, ow = rar && NX.owners.ownerOf(id);   // готовий скін уже на чиїйсь картці (носити можна)
      b.className = 'tile' + (this.isOn(c, id) ? ' on' : '') + (rar ? ' rar rar-' + rar : '') + (ow ? (ow.mine ? ' mine' : ' sold') : '');
      const cn = document.createElement('canvas'); cn.width = SW; cn.height = SH; b.append(cn, this.name(c, id));
      if (rar) { const sm = document.createElement('small'), O = NX.owners;                   // рідкість готового скіна; на картці — «#003» / «#001 · ТИ»
        sm.textContent = ow ? O.noText(ow) + (ow.mine ? ' · ' + NX.t('own.you') : '') : NX.t('skin.rar.' + rar); b.append(sm); }
      let l = { ...NX.nexi.look }, po = poseFor('stand', .5, false);                                   // t .5 — очі відкриті (у t 0 — кліп)
      if (c.k === 'skin') l = skinLook(id, l); else if (c.k === 'acc' || c.k === 'relic') l[ACCS[id].slot] = id; else if (c.k === 'act') po = poseFor(id, .3, false); else if (c.k === 'mood') po.face = NX.nexi.faceOf(id); else l[c.k] = id;
      renderBot(l, po, .5, this.tcr); cn.getContext('2d').drawImage(this.tcr, 0, 0); b.onclick = () => this.apply(c, id); g.appendChild(b);
    });
  },
  /** Вкладка ВЛАСНИКИ: усі картки за номером (ім'я, #001; своя — «ТИ»); тап — картка NFT (свою можна вдягнути). */
  owners(g) {
    const O = NX.owners;
    if (!O.list.length) { const p = document.createElement('p'); p.className = 'empty'; p.textContent = NX.t('own.none'); g.appendChild(p); return; }
    O.list.forEach(o => {
      const b = document.createElement('button'), cn = document.createElement('canvas'), sm = document.createElement('small'), on = O.key(NX.nexi.look) === o.key;
      b.className = 'tile own1' + (o.mine ? ' me' : '') + (on ? ' on' : ''); cn.width = SW; cn.height = SH;
      sm.textContent = O.noText(o) + (o.mine ? ' · ' + NX.t('own.you') : o.founder ? ' · ' + NX.t('own.founder') : '');
      b.append(cn, O.nameOf(o), sm);
      renderBot(O.lookOf(o.key), poseFor('stand', .5, false), .5, this.tcr); cn.getContext('2d').drawImage(this.tcr, 0, 0);
      b.onclick = () => NX.ui.shop.show('view', o); g.appendChild(b);
    });
  },
};
