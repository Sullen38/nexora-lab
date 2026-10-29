/* ============================================================================
 * ui/skinlab.js — ЛАБОРАТОРІЯ СКІНІВ (відкривається тапом по Nexi або в Майстерні)
 * ----------------------------------------------------------------------------
 * Категорії беруться з actors/nexi/skins.js: ГОТОВІ СКІНИ (з рідкістю — кольорова рамка), кольори, антени, тулуб, руки,
 * ноги, АКСЕСУАРИ (спина, голова) і РЕЛІКВІЇ (предмети в руці) — окремо (власник, 29.10). Обличчя тут немає: вирази Nexi
 * обирає сам (емоції — nexi.js moodLife). Зміни одразу видно на Nexi в кімнаті. "Зберегти" пише вибір у localStorage
 * (лише в цьому браузері).
 * ========================================================================== */
NX.ui.skinlab = {
  open: false, cat: null,
  init() {
    const $ = id => document.getElementById(id);
    this.CATS = [{ k: 'skin', items: SKINS }, { k: 'theme', items: THEMES }, { k: 'ant', items: ANTS }, { k: 'body', items: BODIES }, { k: 'arms', items: ARMS },
      { k: 'legs', items: LEGS }, { k: 'acc', items: ACC_ITEMS }, { k: 'relic', items: RELICS }];   // обличчя, емоції, ефекти й дії — сам Nexi (nexi.js), тут лише СТИЛЬ
    this.cat = this.CATS[0];
    this.CATS.forEach(c => { const b = document.createElement('button'); b.onclick = () => { this.cat = c; this.grid(); }; c.btn = b; $('cats').appendChild(b); });
    $('lx').onclick = () => this.hide(); addEventListener('keydown', e => { if (e.key === 'Escape') this.hide(); });
    $('pl').onclick = () => this.cycle(-1); $('pr').onclick = () => this.cycle(1);
    $('save').onclick = () => { try { localStorage.setItem('nexi-look', JSON.stringify(NX.nexi.look)); } catch (e) {} NX.ui.hud.toast(NX.t('ui.saved')); NX.nexi.emote('love'); };
    $('rst').onclick = () => { NX.nexi.look = { ...DEFAULT_LOOK }; this.grid(); };
    $('rnd').onclick = () => { const p = o => { const k = Object.keys(o); return k[Math.random() * k.length | 0]; }, r = Math.random;
      const backs = WEAR_ACCS.filter(k => ACCS[k].slot === 'back'), heads = WEAR_ACCS.filter(k => ACCS[k].slot === 'head');
      NX.nexi.look = r() < .5 ? skinLook(p(SKINS), { hand: r() < .45 ? HAND_ITEMS[r() * HAND_ITEMS.length | 0] : null, fx: 'none' })   // половина разів — готовий скін
        : { face: 'standard', ant: p(ANTS), body: p(BODIES), arms: p(ARMS), legs: p(LEGS), theme: p(THEMES), back: r() < .4 ? backs[r() * backs.length | 0] : null, head: r() < .35 ? heads[r() * heads.length | 0] : null, hand: r() < .45 ? HAND_ITEMS[r() * HAND_ITEMS.length | 0] : null, fx: r() < .5 ? p(FX) : 'none' };
      this.grid(); NX.nexi.emote('surprise', 1.5); };
    this.relabel();
    this.pv = $('pv').getContext('2d'); this.pscr = document.createElement('canvas'); this.tcr = document.createElement('canvas');
    const loop = () => { if (this.open) { const t = NX.time, po = poseFor(['stand', 'wave', 'dance', 'stand'][Math.floor(t / 2.5) % 4], t, false), m = NX.nexi.mood && t < NX.nexi.moodT ? NX.nexi.mood : null;
      if (m) po.face = NX.nexi.faceOf(m);                                                     // у прев'ю — та сама емоція, що зараз у Nexi
      renderBot(NX.nexi.look, po, t, this.pscr); this.pv.clearRect(0, 0, SW, SH); this.pv.drawImage(this.pscr, 0, 0); } requestAnimationFrame(loop); }; loop();
  },
  /** Назви категорій і скінів поточною мовою. */
  relabel() { this.CATS.forEach(c => c.btn.textContent = NX.t('cats.' + c.k)); if (this.open) this.grid(); },
  name(c, id) { return NX.t('skin.' + (c.k === 'relic' ? 'acc' : c.k) + '.' + id); },
  show(fromWorkshop) { this.open = true; document.getElementById('lab').classList.add('open'); this.grid(); if (!fromWorkshop) NX.nexi.say(NX.pick('act.skinLab.lines')); },
  hide() { this.open = false; document.getElementById('lab').classList.remove('open'); },
  isOn(c, id) { const L = NX.nexi.look; if (c.k === 'skin') return skinOf(L) === id; if (c.k === 'acc' || c.k === 'relic') return L[ACCS[id].slot] === id; if (c.k === 'act' || c.k === 'mood') return false; return (L[c.k] ?? DEFAULT_LOOK[c.k]) === id; },
  apply(c, id) {
    const n = NX.nexi, L = n.look; n.lastCmd = NX.time;
    if (c.k === 'skin') Object.assign(L, skinLook(id, L));                                     // готовий скін: увесь образ, реліквія й ефект лишаються
    else if (c.k === 'acc' || c.k === 'relic') { const s = ACCS[id].slot; L[s] = L[s] === id ? null : id; }
    else if (c.k === 'act') { n.temp = id; n.tempT = NX.time + 4; }
    else if (c.k === 'mood') n.emote(id, 3);
    else L[c.k] = id;
    if (c.k !== 'act' && c.k !== 'mood') this.installFx();
    this.grid();
  },
  /** Ефект встановлення скіна: у капсулі майстерні — маніпулятор «зашиває» скін блискавкою (objects/workshop.js), інакше — іскри. */
  installFx() {
    const n = NX.nexi, W = NX.objects.workshop; if (W && W.install && n.loc === 'wsPad') { W.install(); return; }
    for (let i = 0; i < 12; i++) NX.fx.emit('spark', n.x + (Math.random() - .5) * 30, n.y - Math.random() * 50); NX.nexiPhys.kick(2); n.emote('surprise', 1.2);
  },
  cycle(d) { const ks = Object.keys(this.cat.items), cur = ks.findIndex(k => this.isOn(this.cat, k)); this.apply(this.cat, ks[(cur + d + ks.length) % ks.length]); },
  grid() {
    const g = document.getElementById('grid'), c = this.cat; this.CATS.forEach(x => x.btn.classList.toggle('on', x === c)); g.innerHTML = '';
    Object.keys(c.items).forEach(id => {
      const b = document.createElement('button'), rar = c.k === 'skin' ? SKINS[id].rar : null; b.className = 'tile' + (this.isOn(c, id) ? ' on' : '') + (rar ? ' rar rar-' + rar : '');
      const cn = document.createElement('canvas'); cn.width = SW; cn.height = SH; b.append(cn, this.name(c, id));
      if (rar) { const sm = document.createElement('small'); sm.textContent = NX.t('skin.rar.' + rar); b.append(sm); }   // рідкість готового скіна
      let l = { ...NX.nexi.look }, po = poseFor('stand', .5, false);                                   // t .5 — очі відкриті (у t 0 — кліп)
      if (c.k === 'skin') l = skinLook(id, l); else if (c.k === 'acc' || c.k === 'relic') l[ACCS[id].slot] = id; else if (c.k === 'act') po = poseFor(id, .3, false); else if (c.k === 'mood') po.face = NX.nexi.faceOf(id); else l[c.k] = id;
      renderBot(l, po, .5, this.tcr); cn.getContext('2d').drawImage(this.tcr, 0, 0); b.onclick = () => this.apply(c, id); g.appendChild(b);
    });
  },
};
