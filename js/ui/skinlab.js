/* ============================================================================
 * ui/skinlab.js — ЛАБОРАТОРІЯ СКІНІВ (відкривається тапом по Nexi або в Майстерні)
 * ----------------------------------------------------------------------------
 * Категорії беруться з actors/nexi/skins.js. Зміни одразу видно на Nexi
 * в кімнаті та на голограмі в Майстерні. "Зберегти" пише вибір у localStorage
 * (лише в цьому браузері).
 * ========================================================================== */
NX.ui.skinlab = {
  open: false, cat: null,
  init() {
    const $ = id => document.getElementById(id);
    this.CATS = [{ k: 'face', items: FACES }, { k: 'ant', items: ANTS }, { k: 'body', items: BODIES }, { k: 'arms', items: ARMS }, { k: 'legs', items: LEGS },
      { k: 'acc', items: ACCS }, { k: 'theme', items: THEMES }];   // емоції, ефекти й дії — випадкові (nexi.js → moodLife), тут лише СТИЛЬ
    this.cat = this.CATS[0];
    this.CATS.forEach(c => { const b = document.createElement('button'); b.onclick = () => { this.cat = c; this.grid(); }; c.btn = b; $('cats').appendChild(b); });
    $('lx').onclick = () => this.hide(); addEventListener('keydown', e => { if (e.key === 'Escape') this.hide(); });
    $('pl').onclick = () => this.cycle(-1); $('pr').onclick = () => this.cycle(1);
    $('save').onclick = () => { try { localStorage.setItem('nexi-look', JSON.stringify(NX.nexi.look)); } catch (e) {} NX.ui.hud.toast(NX.t('ui.saved')); NX.nexi.emote('love'); };
    $('rst').onclick = () => { NX.nexi.look = { ...DEFAULT_LOOK }; this.grid(); };
    $('rnd').onclick = () => { const p = o => { const k = Object.keys(o); return k[Math.random() * k.length | 0]; }, r = Math.random;
      NX.nexi.look = { face: p(FACES), ant: p(ANTS), body: p(BODIES), arms: p(ARMS), legs: p(LEGS), theme: p(THEMES), back: r() < .4 ? ['backpack', 'cape', 'wings'][r() * 3 | 0] : null, head: r() < .3 ? ['hood', 'hat', 'goggles', 'phones'][r() * 4 | 0] : null, hand: r() < .3 ? ['shield', 'sword'][r() * 2 | 0] : null, fx: r() < .5 ? p(FX) : 'none' };
      this.grid(); NX.nexi.emote('surprise', 1.5); };
    this.relabel();
    this.pv = $('pv').getContext('2d'); this.pscr = document.createElement('canvas'); this.tcr = document.createElement('canvas');
    const loop = () => { if (this.open) { const t = NX.time; renderBot(NX.nexi.look, poseFor(['stand', 'wave', 'dance', 'stand'][Math.floor(t / 2.5) % 4], t, false), t, this.pscr); this.pv.clearRect(0, 0, SW, SH); this.pv.drawImage(this.pscr, 0, 0); } requestAnimationFrame(loop); }; loop();
  },
  /** Назви категорій і скінів поточною мовою. */
  relabel() { this.CATS.forEach(c => c.btn.textContent = NX.t('cats.' + c.k)); if (this.open) this.grid(); },
  name(c, id) { return NX.t('skin.' + c.k + '.' + id); },
  show(fromWorkshop) { this.open = true; document.getElementById('lab').classList.add('open'); this.grid(); if (!fromWorkshop) NX.nexi.say(NX.pick('act.skinLab.lines')); },
  hide() { this.open = false; document.getElementById('lab').classList.remove('open'); },
  isOn(c, id) { const L = NX.nexi.look; if (c.k === 'acc') return L[ACCS[id].slot] === id; if (c.k === 'act' || c.k === 'mood') return false; return L[c.k] === id; },
  apply(c, id) {
    const n = NX.nexi, L = n.look; n.lastCmd = NX.time;
    if (c.k === 'acc') { const s = ACCS[id].slot; L[s] = L[s] === id ? null : id; }
    else if (c.k === 'act') { n.temp = id; n.tempT = NX.time + 4; }
    else if (c.k === 'mood') n.emote(id, 3);
    else L[c.k] = id;
    if (c.k !== 'act' && c.k !== 'mood') this.installFx();
    this.grid();
  },
  /** Ефект встановлення скіна: іскри (маніпулятор майстерні — коли майстерня повернеться). */
  installFx() {
    const n = NX.nexi;
    for (let i = 0; i < 12; i++) NX.fx.emit('spark', n.x + (Math.random() - .5) * 30, n.y - Math.random() * 50); NX.nexiPhys.kick(2); n.emote('surprise', 1.2);
  },
  cycle(d) { const ks = Object.keys(this.cat.items), L = NX.nexi.look, cur = this.cat.k === 'acc' ? ks.findIndex(k => L[ACCS[k].slot] === k) : ks.indexOf(L[this.cat.k]); this.apply(this.cat, ks[(cur + d + ks.length) % ks.length]); },
  grid() {
    const g = document.getElementById('grid'), c = this.cat; this.CATS.forEach(x => x.btn.classList.toggle('on', x === c)); g.innerHTML = '';
    Object.keys(c.items).forEach(id => {
      const b = document.createElement('button'); b.className = 'tile' + (this.isOn(c, id) ? ' on' : ''); const cn = document.createElement('canvas'); cn.width = SW; cn.height = SH; b.append(cn, this.name(c, id));
      const l = { ...NX.nexi.look }; let po = poseFor('stand', 0, false);
      if (c.k === 'acc') l[ACCS[id].slot] = id; else if (c.k === 'act') po = poseFor(id, .3, false); else if (c.k === 'mood') po.face = { happy: 'happy', love: 'hearts', surprise: 'surprised', idea: 'think', sleepy: 'sleepy', sad: 'sad', angry: 'angry', cool: 'standard' }[id]; else l[c.k] = id;
      renderBot(l, po, .5, this.tcr); cn.getContext('2d').drawImage(this.tcr, 0, 0); b.onclick = () => this.apply(c, id); g.appendChild(b);
    });
  },
};
