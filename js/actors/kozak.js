/* ============================================================================
 * actors/kozak.js — КОЗАК-МАНДРІВНИК, ЩО ВИПАДКОВО ВИСКАКУЄ З ПОРТАЛУ
 * ----------------------------------------------------------------------------
 * Власний персонаж Nexora (8-bit, сітка 28×40): голений чуб з оселедцем,
 * довгі вуса, голий торс, жовто-блакитні шаровари з поясом, червоні чоботи.
 * NX.kozak.pop() — вилітає з вихору порталу, озирається, каже "Упс!"
 * (переклад у i18n: kozak.oops), махає і пірнає назад. Nexi дивується.
 * ========================================================================== */
NX.kozak = {
  on: false, t: 0, cv: document.createElement('canvas'), DUR: 3.4, PX: 1432, PY: 340,
  pop() { if (this.on) return false; this.on = true; this.t = 0; NX.objects.portal.flash = .8; return true; },
  sprite(pose, t) {
    const W = 28, H = 40, cv = this.cv; cv.width = W; cv.height = H; const x = cv.getContext('2d', { willReadFrequently: true }); x.clearRect(0, 0, W, H);
    const P = (a, b, w, h, c) => { x.fillStyle = c; x.fillRect(a, b, w, h); };
    const SK = '#f2b98a', SKL = '#ffd3ad', SKD = '#c98a5e', BL = '#2a6aff', BLD = '#1a46b8', YE = '#ffd02a', YED = '#d99a10', RD = '#c8282e';
    // чоботи
    P(7, 36, 6, 4, RD); P(15, 36, 6, 4, RD); P(6, 39, 7, 1, '#7a1418'); P(15, 39, 7, 1, '#7a1418'); P(7, 36, 6, 1, '#ff5a5e'); P(15, 36, 6, 1, '#ff5a5e');
    // шаровари: широкі, ліва холоша блакитна, права жовта (прапор)
    P(5, 24, 9, 12, BL); P(14, 24, 9, 12, YE); P(5, 24, 1, 12, '#5a92ff'); P(22, 24, 1, 12, YED); P(9, 26, 1, 9, BLD); P(18, 26, 1, 9, YED); P(13, 24, 2, 11, '#1a2a5a');
    // пояс (червоний кушак)
    P(6, 22, 16, 3, RD); P(6, 22, 16, 1, '#ff5a5e'); P(19, 24, 2, 5, RD);
    // голий торс
    P(7, 13, 14, 9, SK); P(7, 13, 14, 1, SKL); P(8, 16, 5, 1, SKD); P(15, 16, 5, 1, SKD); P(13, 18, 2, 4, SKD); P(10, 19, 1, 2, SKD); P(17, 19, 1, 2, SKD);
    // руки
    const wave = pose === 'wave' ? (Math.floor(t * 8) % 2) : 0, look = pose === 'look';
    if (pose === 'wave') { P(21, 6 - wave, 3, 9, SK); P(21, 4 - wave, 4, 3, SK); } else if (look) { P(21, 9, 3, 6, SK); P(19, 7, 4, 3, SK); } else { P(21, 13, 3, 9, SK); P(21, 21, 3, 2, SKD); }
    P(4, 13, 3, 9, SK); P(4, 21, 3, 2, SKD); P(4, 13, 1, 9, SKL);
    // голова: голена, оселедець, вуса
    P(8, 3, 12, 10, SK); P(8, 3, 12, 1, SKL); P(7, 6, 1, 4, SK); P(20, 6, 1, 4, SK);
    P(12, 0, 4, 3, '#2a1a10'); P(15, 1, 3, 2, '#2a1a10'); P(17, 2, 2, 6, '#2a1a10'); P(18, 7, 1, 3, '#2a1a10');   // оселедець за вухом
    const eo = pose === 'oops';
    if (eo) { P(10, 6, 2, 2, '#ffffff'); P(16, 6, 2, 2, '#ffffff'); P(10, 6, 1, 1, '#1a1a1a'); P(16, 6, 1, 1, '#1a1a1a'); P(13, 10, 2, 2, '#7a1a1a'); }
    else { P(10, 6, 2, 1, '#1a1a1a'); P(16, 6, 2, 1, '#1a1a1a'); }
    P(9, 5, 3, 1, '#5a3a20'); P(16, 5, 3, 1, '#5a3a20');                                                   // брови
    P(13, 7, 2, 2, SKD);                                                                                       // ніс
    P(9, 9, 4, 1, '#3a2414'); P(15, 9, 4, 1, '#3a2414'); P(8, 10, 2, 2, '#3a2414'); P(18, 10, 2, 2, '#3a2414'); // вуса
    // контур
    const id = x.getImageData(0, 0, W, H), d = id.data, op = new Uint8Array(W * H);
    for (let i = 0; i < op.length; i++) op[i] = d[i * 4 + 3] > 40 ? 1 : 0;
    for (let yy = 0; yy < H; yy++) for (let xx = 0; xx < W; xx++) { const i = yy * W + xx; if (op[i]) continue; if ((xx > 0 && op[i - 1]) || (xx < W - 1 && op[i + 1]) || (yy > 0 && op[i - W]) || (yy < H - 1 && op[i + W])) { d[i * 4] = 20; d[i * 4 + 1] = 10; d[i * 4 + 2] = 30; d[i * 4 + 3] = 255; } }
    x.putImageData(id, 0, 0); return cv;
  },
  update(dt) {
    if (!this.on) return; this.t += dt;
    if (this.t > .5 && !this.said) { this.said = true; NX.nexi.emote('surprise', 2.5); }
    if (Math.random() < .5) NX.fx.list.push({ type: 'portal', x: 0, y: 0, cx: this.PX, cy: 290, orbit: 30, a0: Math.random() * 6.3, age: 0, ttl: .6, s: 1.5, col: Math.random() < .5 ? '#ffd02a' : '#2a6aff', vx: 0, vy: 0 });
    if (this.t > this.DUR) { this.on = false; this.said = false; NX.objects.portal.flash = .6; }
  },
  layer() {
    if (!this.on) return null;
    const t = this.t, D = this.DUR;
    // фази: 0-.5 вилітає, .5-1.2 озирається, 1.2-2.2 "Упс!", 2.2-2.8 махає, 2.8-D затягує назад
    const pose = t < .5 ? 'stand' : t < 1.2 ? 'look' : t < 2.2 ? 'oops' : t < 2.8 ? 'wave' : 'stand';
    const k = t < .5 ? t / .5 : t > 2.8 ? 1 - (t - 2.8) / (D - 2.8) : 1;
    return { y: this.PY + .3, draw: c => {
      this.sprite(pose, t); const s = 1.55 * (.3 + .7 * k), w = 28 * s, h = 40 * s, x = this.PX + (t < .5 ? (1 - k) * 0 : 0) + (pose === 'look' ? Math.round(Math.sin(t * 8)) : 0), y = this.PY - (1 - k) * 40 - (t < .5 ? Math.sin(k * Math.PI) * 10 : 0);
      c.save(); c.globalAlpha = Math.min(1, k * 1.5); c.imageSmoothingEnabled = false; const flip = pose === 'look' && Math.floor(t * 3) % 2; c.translate(x, 0); if (flip) c.scale(-1, 1);
      c.rotate(t > 2.8 ? (t - 2.8) * 6 : 0); c.drawImage(this.cv, -w / 2, y - h, w, h); c.restore();
      if (pose === 'oops') { const msg = NX.t('kozak.oops'); c.font = '6px "Press Start 2P", monospace'; const bw = c.measureText(msg).width + 10, bx = x - bw - 6, by = y - h - 4;
        NX.px.rect(c, bx, by - 12, bw, 15, '#fff6d0'); c.strokeStyle = '#2a1a10'; c.lineWidth = 1; c.strokeRect(bx + .5, by - 11.5, bw - 1, 14); NX.px.rect(c, bx + bw - 4, by + 3, 4, 3, '#fff6d0'); NX.px.text(c, msg, bx + 5, by - 2, '#2a1a10', 6); }
    } };
  },
};
