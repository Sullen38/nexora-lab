/* ============================================================================
 * actors/dracula.js — ДРАКУЛА, ЩО ВИПАДКОВО ПОТРАПЛЯЄ В ПОРТАЛ
 * ----------------------------------------------------------------------------
 * Класичний книжковий граф (Брем Стокер, 1897 — суспільне надбання), 8-bit
 * сітка 28×42: бліде обличчя, зачесане назад волосся з "мисом", гострі вуха,
 * чорний плащ з високим коміром і червоною підкладкою, медальйон.
 * NX.kozak.pop() (назва лишилась для сумісності): вихор спалахує, граф
 * проявляється з глибини порталу, озирається, каже "Упс!" (i18n kozak.oops),
 * загортається в плащ і ЗНИКАЄ НАЗАД У ПОРТАЛІ (зменшується в центр вихору).
 * ========================================================================== */
NX.kozak = {
  on: false, t: 0, cv: document.createElement('canvas'), DUR: 3.8, PX: 1430, PY: 338,
  pop() { if (this.on) return false; this.on = true; this.t = 0; NX.objects.portal.flash = .9; return true; },
  sprite(pose, t) {
    const W = 28, H = 42, cv = this.cv; cv.width = W; cv.height = H; const x = cv.getContext('2d', { willReadFrequently: true }); x.clearRect(0, 0, W, H);
    const P = (a, b, w, h, c) => { x.fillStyle = c; x.fillRect(a, b, w, h); };
    const SK = '#e8e0f0', SKD = '#b8a8c8', HA = '#14101c', CL = '#18121e', CLL = '#2e2438', RD = '#b8142a', RDL = '#e83a4e', GO = '#ffc94d';
    const wrap = pose === 'wrap', open = pose === 'oops';
    // плащ ззаду (червона підкладка видно, коли розкритий)
    if (!wrap) { P(2, 14, 24, 26, RD); P(3, 15, 22, 1, RDL); P(2, 38, 3, 3, RD); P(23, 38, 3, 3, RD); P(12, 39, 4, 2, RD); }
    // ноги, взуття
    P(10, 35, 3, 5, '#1a1420'); P(15, 35, 3, 5, '#1a1420'); P(9, 40, 5, 2, '#0a080e'); P(14, 40, 5, 2, '#0a080e');
    // тулуб: фрак, жилет, біла сорочка, медальйон
    P(8, 16, 12, 20, CL); P(8, 16, 12, 1, CLL); P(12, 16, 4, 10, '#f4f0f8'); P(13, 17, 2, 2, RD); P(13, 22, 2, 2, GO); P(13, 23, 2, 1, '#fff6c0');
    // плащ спереду
    if (wrap) { P(3, 13, 22, 28, CL); P(3, 13, 22, 1, CLL); P(13, 14, 1, 26, '#2a2034'); P(6, 20, 3, 1, CLL); }
    else { P(4, 15, 5, 25, CL); P(19, 15, 5, 25, CL); P(4, 15, 1, 25, CLL); }
    // руки
    if (open) { P(1, 16, 4, 3, CL); P(23, 16, 4, 3, CL); P(0, 18, 2, 3, SK); P(26, 18, 2, 3, SK); }
    else if (!wrap) { P(6, 20, 3, 10, CL); P(19, 20, 3, 10, CL); P(6, 29, 3, 2, SK); P(19, 29, 3, 2, SK); }
    else { P(19, 20, 4, 3, SK); }
    // високий комір
    P(4, 8, 4, 8, RD); P(20, 8, 4, 8, RD); P(4, 8, 4, 1, RDL); P(20, 8, 4, 1, RDL); P(5, 9, 2, 7, CL); P(21, 9, 2, 7, CL);
    // голова
    P(9, 3, 10, 12, SK); P(9, 3, 10, 1, '#ffffff'); P(8, 6, 1, 4, SK); P(19, 6, 1, 4, SK); P(7, 6, 2, 2, SK); P(19, 6, 2, 2, SK); P(7, 5, 1, 1, SK); P(20, 5, 1, 1, SK); // гострі вуха
    P(9, 1, 10, 3, HA); P(8, 2, 1, 5, HA); P(19, 2, 1, 5, HA); P(13, 4, 2, 2, HA); P(10, 1, 8, 1, '#2a2438');                        // волосся з "мисом"
    P(10, 7, 3, 1, HA); P(15, 7, 3, 1, HA);                                                                                          // брови
    const look = pose === 'look' ? (Math.floor(t * 3) % 2 ? 1 : -1) : 0;
    if (open) { P(10, 8, 3, 2, '#ffffff'); P(15, 8, 3, 2, '#ffffff'); P(11, 8, 1, 1, RD); P(16, 8, 1, 1, RD); P(12, 12, 4, 2, '#3a0a14'); P(12, 12, 1, 1, '#ffffff'); P(15, 12, 1, 1, '#ffffff'); }
    else { P(10 + Math.max(0, look), 8, 2, 1, RD); P(15 + Math.max(0, look), 8, 2, 1, RD); P(12, 12, 4, 1, SKD); P(12, 13, 1, 1, '#ffffff'); P(15, 13, 1, 1, '#ffffff'); }
    P(13, 9, 2, 2, SKD);                                                                                                             // ніс
    // контур
    const id = x.getImageData(0, 0, W, H), d = id.data, op = new Uint8Array(W * H);
    for (let i = 0; i < op.length; i++) op[i] = d[i * 4 + 3] > 40 ? 1 : 0;
    for (let yy = 0; yy < H; yy++) for (let xx = 0; xx < W; xx++) { const i = yy * W + xx; if (op[i]) continue; if ((xx > 0 && op[i - 1]) || (xx < W - 1 && op[i + 1]) || (yy > 0 && op[i - W]) || (yy < H - 1 && op[i + W])) { d[i * 4] = 60; d[i * 4 + 1] = 10; d[i * 4 + 2] = 40; d[i * 4 + 3] = 255; } }
    x.putImageData(id, 0, 0); return cv;
  },
  update(dt) {
    if (!this.on) return; this.t += dt;
    if (this.t > .7 && !this.said) { this.said = true; NX.nexi.emote('surprise', 2.5); }
    if (Math.random() < .5) NX.fx.list.push({ type: 'portal', x: 0, y: 0, cx: this.PX, cy: 290, orbit: 34, a0: Math.random() * 6.3, age: 0, ttl: .6, s: 1.5, col: Math.random() < .5 ? '#b8142a' : '#d94bff', vx: 0, vy: 0 });
    if (this.t > this.DUR) { this.on = false; this.said = false; NX.objects.portal.flash = .7; }
  },
  layer() {
    if (!this.on) return null;
    const t = this.t, D = this.DUR;
    // 0–.8 проявляється з глибини вихору; .8–1.5 озирається; 1.5–2.6 "Упс!"; 2.6–3.0 загортається в плащ; 3.0–D затягує назад у центр порталу
    const pose = t < .8 ? 'stand' : t < 1.5 ? 'look' : t < 2.6 ? 'oops' : 'wrap';
    const k = t < .8 ? t / .8 : t > 3 ? Math.max(0, 1 - (t - 3) / (D - 3)) : 1;
    return { y: this.PY + .3, draw: c => {
      this.sprite(pose, t);
      const s = 1.55 * (.15 + .85 * k), w = 28 * s, h = 42 * s, cy = 292, x = this.PX, footY = NX.px.lerp(cy + 20, this.PY, k);   // з центру вихору до сходинки і назад
      c.save(); c.globalAlpha = Math.min(1, k * 1.4); c.imageSmoothingEnabled = false; c.translate(x, footY); if (t > 3) c.rotate((t - 3) * 5);
      c.drawImage(this.cv, -w / 2, -h, w, h); c.restore();
      if (pose === 'oops') { const msg = NX.t('kozak.oops'); c.font = '6px "Press Start 2P", monospace'; const bw = c.measureText(msg).width + 10, bx = x - bw - 10, by = footY - h + 4;
        NX.px.rect(c, bx, by - 12, bw, 15, '#f4f0f8'); c.strokeStyle = '#3a0a14'; c.lineWidth = 1; c.strokeRect(bx + .5, by - 11.5, bw - 1, 14); NX.px.rect(c, bx + bw - 4, by + 3, 4, 3, '#f4f0f8'); NX.px.text(c, msg, bx + 5, by - 2, '#3a0a14', 6); }
    } };
  },
};
