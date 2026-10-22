/* ============================================================================
 * ui/skinlab.js — ЛАБОРАТОРІЯ СКІНІВ (відкривається тапом по Nexi або в Майстерні)
 * ----------------------------------------------------------------------------
 * Категорії беруться з actors/nexi/skins.js. Зміни одразу видно на Nexi
 * в кімнаті та на голограмі в Майстерні. "Зберегти" пише вибір у localStorage
 * (лише в цьому браузері).
 * ========================================================================== */
NX.ui.skinlab = {
  open: false, cat: null,
  nm: o => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, typeof v === 'string' ? v : v.n])),
  init() {
    const $ = id => document.getElementById(id);
    this.CATS = [{ k: 'face', t: 'Обличчя', items: FACES }, { k: 'ant', t: 'Антени', items: ANTS }, { k: 'body', t: 'Тулуб', items: this.nm(BODIES) }, { k: 'arms', t: 'Руки', items: this.nm(ARMS) },
      { k: 'legs', t: 'Ноги', items: this.nm(LEGS) }, { k: 'acc', t: 'Аксесуари', items: this.nm(ACCS) }, { k: 'theme', t: 'Кольори', items: this.nm(THEMES) }, { k: 'fx', t: 'Ефекти', items: FX }, { k: 'act', t: 'Дії', items: ACTIONS }, { k: 'mood', t: 'Емоції', items: MOODS }];
    this.cat = this.CATS[0];
    this.CATS.forEach(c => { const b = document.createElement('button'); b.textContent = c.t; b.onclick = () => { this.cat = c; this.grid(); }; c.btn = b; $('cats').appendChild(b); });
    $('lx').onclick = () => this.hide(); addEventListener('keydown', e => { if (e.key === 'Escape') this.hide(); });
    $('pl').onclick = () => this.cycle(-1); $('pr').onclick = () => this.cycle(1);
    $('save').onclick = () => { try { localStorage.setItem('nexi-look', JSON.stringify(NX.nexi.look)); } catch (e) {} NX.ui.hud.toast('NEXI ЗБЕРЕЖЕНО'); NX.nexi.emote('love'); };
    $('rst').onclick = () => { NX.nexi.look = { ...DEFAULT_LOOK }; this.grid(); };
    $('rnd').onclick = () => { const p = o => { const k = Object.keys(o); return k[Math.random() * k.length | 0]; }, r = Math.random;
      NX.nexi.look = { face: p(FACES), ant: p(ANTS), body: p(BODIES), arms: p(ARMS), legs: p(LEGS), theme: p(THEMES), back: r() < .4 ? ['backpack', 'cape', 'wings'][r() * 3 | 0] : null, head: r() < .3 ? ['hood', 'hat', 'goggles', 'phones'][r() * 4 | 0] : null, hand: r() < .3 ? ['shield', 'sword'][r() * 2 | 0] : null, fx: r() < .5 ? p(FX) : 'none' };
      this.grid(); NX.nexi.emote('surprise', 1.5); };
    this.pv = $('pv').getContext('2d'); this.pscr = document.createElement('canvas'); this.tcr = document.createElement('canvas');
    const loop = () => { if (this.open) { const t = NX.time; renderBot(NX.nexi.look, poseFor(['stand', 'wave', 'dance', 'stand'][Math.floor(t / 2.5) % 4], t, false), t, this.pscr); this.pv.clearRect(0, 0, 36, 40); this.pv.drawImage(this.pscr, 0, 0); } requestAnimationFrame(loop); }; loop();
  },
  show() { this.open = true; document.getElementById('lab').classList.add('open'); this.grid(); NX.nexi.say('Давай змінимо мій вигляд! Обирай скіни праворуч.'); },
  hide() { this.open = false; document.getElementById('lab').classList.remove('open'); },
  isOn(c, id) { const L = NX.nexi.look; if (c.k === 'acc') return L[ACCS[id].slot] === id; if (c.k === 'act' || c.k === 'mood') return false; return L[c.k] === id; },
  apply(c, id) {
    const n = NX.nexi, L = n.look; n.lastCmd = NX.time;
    if (c.k === 'acc') { const s = ACCS[id].slot; L[s] = L[s] === id ? null : id; }
    else if (c.k === 'act') { n.temp = id; n.tempT = NX.time + 4; }
    else if (c.k === 'mood') n.emote(id, 3);
    else L[c.k] = id;
    this.grid();
  },
  cycle(d) { const ks = Object.keys(this.cat.items), L = NX.nexi.look, cur = this.cat.k === 'acc' ? ks.findIndex(k => L[ACCS[k].slot] === k) : ks.indexOf(L[this.cat.k]); this.apply(this.cat, ks[(cur + d + ks.length) % ks.length]); },
  grid() {
    const g = document.getElementById('grid'), c = this.cat; this.CATS.forEach(x => x.btn.classList.toggle('on', x === c)); g.innerHTML = '';
    Object.entries(c.items).forEach(([id, name]) => {
      const b = document.createElement('button'); b.className = 'tile' + (this.isOn(c, id) ? ' on' : ''); const cn = document.createElement('canvas'); cn.width = 36; cn.height = 40; b.append(cn, name);
      const l = { ...NX.nexi.look }; let po = poseFor('stand', 0, false);
      if (c.k === 'acc') l[ACCS[id].slot] = id; else if (c.k === 'act') po = poseFor(id, .3, false); else if (c.k === 'mood') po.face = { happy: 'happy', love: 'hearts', surprise: 'surprised', idea: 'think', sleepy: 'sleepy', sad: 'sad', angry: 'angry', cool: 'standard' }[id]; else l[c.k] = id;
      renderBot(l, po, .5, this.tcr); cn.getContext('2d').drawImage(this.tcr, 0, 0); b.onclick = () => this.apply(c, id); g.appendChild(b);
    });
  },
};
