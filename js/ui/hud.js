/* ============================================================================
 * ui/hud.js — МЕНЮ, ЧИП ЗАДАЧІ, БАБЛ NEXI, ПІДКАЗКА, ТОСТ
 * ----------------------------------------------------------------------------
 * HTML-елементи поверх canvas (розмітка в index.html, стилі в css/hud.css).
 * Меню: кожна кнопка запускає сценарій з actors/nexi/activities.js.
 * ========================================================================== */
NX.ui.hud = {
  NAV: [['home', 'ГОЛОВНА'], ['ai', 'AI-ЦЕНТР'], ['analytics', 'АНАЛІТИКА'], ['marketing', 'МАРКЕТИНГ'], ['workshop', 'МАЙСТЕРНЯ'], ['tools', 'ІНСТРУМЕНТИ'], ['portal', 'ПОРТАЛ']],
  $: id => document.getElementById(id), typed: null,
  init() {
    const nav = this.$('nav');
    this.NAV.forEach(([id, n]) => { const b = document.createElement('button'); b.textContent = n; b.dataset.id = id; b.onclick = () => { this.firstTouch(); NX.nexi.do(id); }; nav.appendChild(b); });
    this.$('skinbtn').onclick = () => NX.ui.skinlab.show();
  },
  setActive(id) { document.querySelectorAll('nav button').forEach(b => b.classList.toggle('on', b.dataset.id === id)); },
  firstTouch() { this.$('hint').style.display = 'none'; },
  toast(m) { const t = this.$('toast'); t.textContent = m; t.classList.add('show'); clearTimeout(this._tt); this._tt = setTimeout(() => t.classList.remove('show'), 1800); },
  /** Показати/сховати бабл над Nexi (текст друкується по літері). */
  bubble(text) { const b = this.$('bub'); if (!text) { b.style.display = 'none'; this.typed = null; return; } this.typed = { text, t: 0 }; b.style.display = 'block'; },
  update(dt, t) {
    // бабл
    const b = this.$('bub');
    if (this.typed) {
      this.typed.t += dt; b.lastElementChild.textContent = this.typed.text.slice(0, Math.floor(this.typed.t * 40));
      const [sx, sy] = NX.nexi.headScreen || [0, 0], bw = b.offsetWidth, bh = b.offsetHeight, lab = NX.ui.skinlab.open ? this.$('lab').offsetWidth : 0;
      const L = Math.max(8, Math.min(innerWidth - bw - 8 - lab, sx - 40)); b.style.left = L + 'px'; b.style.top = Math.max(64, sy - bh - 14) + 'px'; b.style.setProperty('--tail', Math.max(10, Math.min(bw - 24, sx - L - 6)) + 'px');
    }
    // чип поточної задачі
    const k = NX.nexi.task, el = this.$('task');
    if (k) { el.style.display = 'flex'; el.style.borderColor = k.color; this.$('tk-n').textContent = k.auto ? 'ВІЛЬНИЙ ЧАС' : 'ЗАДАЧА'; const st = k.steps.length ? k.steps[Math.min(k.steps.length - 1, Math.floor(k.prog * k.steps.length))] : ''; this.$('tk-t').textContent = k.title + (st ? ' · ' + st : ''); this.$('tk-p').style.setProperty('--p', (k.prog * 100 | 0) + '%'); }
    else el.style.display = 'none';
  },
};
