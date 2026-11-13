/* ============================================================================
 * objects/decor_vines.js — ЛІАНИ МІЖ СОТАМИ (Декор стін · 57)
 * ----------------------------------------------------------------------------
 * Власник (13.11): «нових сот не треба — у порожніх місцях (де був платицеріум і де діра в кластері) краще ліани, різних
 * видів; щоб гарно росли між сотами й не закривали їх; ростуть зі СТІНИ в тих місцях, а не з сот».
 * Чотири врятовані види, по два в кожному місці: іпомея + дисхідія (під сотою з кулею), нефритова ліана + тунбергія (під
 * сотою з годинником). Кожна росте з тріщини в цеглі (мох довкола) у вільній комірці решітки, звисає вниз по стіні й
 * закінчується над зоною (межа — dc.shy соти над нею). Піксель-арт кодом: малюємо фігурами на полотні 3 px/од., далі
 * «пікселізація» (поріг альфи, темний контур). Гойдаються від кореня (низ ходить), тап — гойднеться й картка виду
 * (objects/decor_guide.js, група wall); квіти розкриваються циклами (у кожної свій зсув).
 * Малює objects/decor_live.js (drawArt) ПЕРЕД артефактами — кромки сот лягають поверх ліан, соти вони не закривають.
 * API: NX.decorVines = { KINDS, has, draw(c, t, vx0, vx1), tap(x, y, t) -> bool, lastKind, sprite(kind) -> canvas (картка), extentTo(c) }.
 * ========================================================================== */
(() => {
  const R = 3, TAU = Math.PI * 2, OUT = [8, 22, 14];
  const hash = (a, b = 0) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
  const SPEC = [
    // du — зсув уздовж стіни від осі вільної комірки (· 58, власник: «рости по центру й просвічувати крізь соти, що стоять попереду, а не
    // заходити під них» — ліани на стіні посеред комірки, їх видно крізь скло передніх сот); ext — на скільки од. нижче тіні соти (до зони — запас)
    { kind: 'ipomoea', under: 'orb', du: -3.2, len: 1, w: 8, seed: 3, ext: 1.5, off: 0 },
    { kind: 'dischidia', under: 'orb', du: 1.6, len: .72, w: 5.5, seed: 5, ext: 1.5, off: .3 },
    { kind: 'jadevine', under: 'hourglass', du: -3.4, len: 1, w: 9, seed: 7, ext: 3.5, off: .12 },
    { kind: 'thunbergia', under: 'hourglass', du: 1.8, len: .7, w: 7.5, seed: 9, ext: 3.5, off: .42 },
  ];

  // ---------- малювання виду на полотно (одиниці кімнати; (0, 0) — корінь зверху посередині) ----------
  const ell = (c, x, y, rx, ry, a, col) => { c.fillStyle = col; c.beginPath(); c.ellipse(x, y, rx, ry, a, 0, TAU); c.fill(); };
  const leaf = (c, x, y, a, l, w, c0, c1) => { c.save(); c.translate(x, y); c.rotate(a); c.fillStyle = c0; c.beginPath(); c.ellipse(l / 2, 0, l / 2, w / 2, 0, 0, TAU); c.fill();
    c.fillStyle = c1; c.beginPath(); c.ellipse(l / 2, w * .18, l / 2 * .9, w / 2 * .55, 0, 0, Math.PI); c.fill(); c.restore(); };
  const stem = (c, sx, L, col, lw) => { c.strokeStyle = col; c.lineWidth = lw; c.lineCap = 'round'; c.beginPath(); for (let y = 0; y <= L; y += .5) y ? c.lineTo(sx(y), y) : c.moveTo(sx(0), 0); c.stroke(); };
  const root = c => { c.fillStyle = '#12061e'; c.beginPath(); c.moveTo(-1.6, -.9); c.lineTo(.2, -.5); c.lineTo(1.8, -1); c.lineTo(.9, .5); c.lineTo(-.7, .6); c.closePath(); c.fill();     // тріщина в цеглі, мох
    for (let k = 0; k < 7; k++) ell(c, (hash(k, 3) - .5) * 4.2, -.4 + (hash(k, 5) - .5) * 1.6, .55, .45, 0, k % 2 ? '#3aa848' : '#1e7a30'); };
  const DRAW = {
    /** Іпомея: трилопатеве листя, фіолетові квітки-лійки з білою зіркою. */
    ipomoea(c, L, sd, fl) {
      const sx = y => Math.sin(y * .34 + sd) * 1.5 * Math.min(1, y / 3);
      if (!fl) { stem(c, sx, L, '#2e8a3e', .55);
        for (let y = 2.2, k = 0; y < L - 1; y += 3.3, k++) { const s = k % 2 ? 1 : -1, x = sx(y), a = s > 0 ? .25 : Math.PI - .25;
          for (const da of [-.75, 0, .75]) leaf(c, x, y, a + da * s, da ? 2.3 : 3, 1.05, '#44c05a', '#2a8a3c');
}
        ell(c, sx(L), L, .5, .7, 0, '#8ae07a'); return; }
      for (let y = 5, k = 0; y < L - 2; y += 7.5, k++) { const s = k % 2 ? -1 : 1, x = sx(y) + s * 2.2;
        ell(c, x, y, 1.75, 1.6, 0, '#6a2ac8'); ell(c, x, y, 1.45, 1.3, 0, '#a05af0'); for (let q = 0; q < 5; q++) { const a = q / 5 * TAU - .3; ell(c, x + Math.cos(a) * .7, y + Math.sin(a) * .65, .75, .2, a, '#f0e0ff'); } ell(c, x, y, .36, .36, 0, '#ffe04a'); }
    },
    /** Дисхідія: тонке стебло, пари круглих листочків-монеток, дрібні білі квіточки. */
    dischidia(c, L, sd, fl) {
      const sx = y => Math.sin(y * .5 + sd) * .9 * Math.min(1, y / 2);
      if (!fl) { stem(c, sx, L, '#4a8a6a', .45);
        for (let y = 1.4, k = 0; y < L; y += 1.75, k++) { const x = sx(y), r = .98 - .25 * (y / L); for (const s of [-1, 1]) { const lx = x + s * (r + .25), ly = y + s * .25; ell(c, lx, ly, r, r * .92, 0, '#3a8a68'); ell(c, lx - .1, ly - .1, r * .78, r * .72, 0, k % 3 ? '#7ac8a0' : '#96dcb8'); ell(c, lx - .3, ly - .3, .22, .22, 0, '#d0f8e4'); } }
        return; }
      for (let y = 4, k = 0; y < L - 1; y += 5.2, k++) { const x = sx(y) + (k % 2 ? 1.9 : -1.9); ell(c, x, y, .5, .5, 0, '#ffffff'); ell(c, x, y, .2, .2, 0, '#ffd27a'); }
    },
    /** Нефритова ліана: трійчасте темне листя вгорі, довгі китиці бірюзових квіток-кігтиків. */
    jadevine(c, L, sd, fl) {
      const sx = y => Math.sin(y * .22 + sd) * 1.3 * Math.min(1, y / 3), RAC = [[2.5, -2.6, .62], [5.5, 2.4, .5], [9, -1.2, .42]];
      if (!fl) { stem(c, sx, L * .62, '#3a6a3a', .6);
        for (let y = 1.6, k = 0; y < L * .6; y += 3.4, k++) { const s = k % 2 ? 1 : -1, x = sx(y), a = s > 0 ? .5 : Math.PI - .5; for (const da of [-.6, 0, .6]) leaf(c, x, y, a + da, da ? 2.6 : 3.3, 1.3, '#2a9a58', '#176a3c'); }
        for (const [y0, dx, f] of RAC) { c.strokeStyle = '#5a8a6a'; c.lineWidth = .42; c.beginPath(); c.moveTo(sx(y0), y0); c.quadraticCurveTo(sx(y0) + dx, y0 + 1, sx(y0) + dx, y0 + 2.5); c.lineTo(sx(y0) + dx, Math.min(L - 1, y0 + L * f)); c.stroke();
          for (let y = y0 + 3, k = 0; y < Math.min(L - .5, y0 + L * f); y += 2.3, k++) ell(c, sx(y0) + dx + (k % 2 ? .5 : -.5), y, .34, .5, 0, '#2ab8a0'); }                                  // бутони
        return; }
      for (const [y0, dx, f] of RAC) for (let y = y0 + 2.6, k = 0; y < Math.min(L - .8, y0 + L * f); y += 1.15, k++) { const s = k % 2 ? 1 : -1, x = sx(y0) + dx, t = (y - y0) / (L * f), l = 1.9 - t * .8;
        c.save(); c.translate(x, y); c.rotate(s > 0 ? .9 : Math.PI - .9); c.fillStyle = '#18b8a8'; c.beginPath(); c.ellipse(l / 2, 0, l / 2, .5, 0, 0, TAU); c.fill(); c.fillStyle = '#3be8d8'; c.beginPath(); c.ellipse(l / 2, -.12, l / 2 * .85, .3, 0, 0, TAU); c.fill(); c.fillStyle = '#c8fff4'; c.beginPath(); c.ellipse(l * .9, -.1, .3, .22, 0, 0, TAU); c.fill(); c.restore(); }
    },
    /** Тунбергія: витке стебло, серцеподібне листя, помаранчеві квітки з темним вічком. */
    thunbergia(c, L, sd, fl) {
      const sx = y => Math.sin(y * .62 + sd) * 1.7 * Math.min(1, y / 2.5);
      if (!fl) { stem(c, sx, L, '#4a9a2a', .45);
        for (let y = 1.8, k = 0; y < L - .8; y += 2.9, k++) { const s = k % 2 ? 1 : -1, x = sx(y) + s * .4, a = s > 0 ? .55 : Math.PI - .55;
          c.save(); c.translate(x, y); c.rotate(a); for (const sg of [-1, 1]) { c.fillStyle = sg < 0 ? '#74d040' : '#4a9a2a'; c.beginPath(); c.ellipse(1, sg * .5, 1.05, .72, sg * .35, 0, TAU); c.fill(); } c.fillStyle = '#74d040'; c.beginPath(); c.moveTo(.9, -.9); c.lineTo(3, 0); c.lineTo(.9, .9); c.closePath(); c.fill(); c.restore(); }
        return; }
      for (let y = 3.4, k = 0; y < L - 1.5; y += 5.8, k++) { const x = sx(y) + (k % 2 ? -2 : 2); for (let q = 0; q < 5; q++) { const a = q / 5 * TAU + .3; ell(c, x + Math.cos(a) * .85, y + Math.sin(a) * .85, .72, .6, a, q % 2 ? '#ff9a3a' : '#ffb85a'); } ell(c, x, y, .45, .45, 0, '#3a1408'); }
    },
  };
  const KINDS = Object.keys(DRAW);

  /** Спрайт виду: w × L од. (R px/од.), fl — шар квітів. Пікселізація: поріг альфи, темний контур. */
  function gen(kind, w, L, seed, fl, withRoot) {
    const W = Math.ceil(w * R), H = Math.ceil((L + 2.5) * R), cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d');
    c.setTransform(R, 0, 0, R, W / 2, 1.5 * R); if (withRoot && !fl) root(c); DRAW[kind](c, L, seed, fl);
    const im = c.getImageData(0, 0, W, H), d = im.data, on = new Uint8Array(W * H);
    for (let q = 0; q < W * H; q++) { if (d[q * 4 + 3] >= 105) { d[q * 4 + 3] = 255; on[q] = 1; } else d[q * 4 + 3] = 0; }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const q = y * W + x; if (on[q]) continue; if ((x > 0 && on[q - 1]) || (x < W - 1 && on[q + 1]) || (y > 0 && on[q - W]) || (y < H - 1 && on[q + W])) { d[q * 4] = OUT[0]; d[q * 4 + 1] = OUT[1]; d[q * 4 + 2] = OUT[2]; d[q * 4 + 3] = 255; } }
    c.setTransform(1, 0, 0, 1, 0, 0); c.putImageData(im, 0, 0); return cv;
  }

  // ---------- де ростуть: вільна комірка решітки під сотою з артефактом `under` ----------
  let V = null;
  function build() {
    if (V) return V; V = []; const DC = NX.decor, A = NX.arc && NX.arc.kit; if (!DC || !A || !DC.items) return V;
    for (const sp of SPEC) { const art = DC.items.find(B => B.st === 'dc_art' && B.id.startsWith('dc_hxa') && B.dc.kind === sp.under), HX = art && DC.byId[art.on]; if (!HX) continue;
      const { P } = A.basis(HX), Ro = HX.w / 2, Yc = (HX.yt + HX.yb) / 2, Y0 = Yc + Ro * .866 + 2.2, Y1 = (HX.dc.shy || Y0 + 26) - 1.2 + (sp.ext || 0), Lw = Math.max(6, (Y1 - Y0) * sp.len);
      const top = NX.px3d.proj(P(sp.du, HX.dep - .3, Y0)), bot = NX.px3d.proj(P(sp.du, HX.dep - .3, Y0 + Lw)), s = (bot[1] - top[1]) / Lw;
      const base = gen(sp.kind, sp.w, Lw, sp.seed, false, true), all = gen(sp.kind, sp.w, Lw, sp.seed, false, true); all.getContext('2d').drawImage(gen(sp.kind, sp.w, Lw, sp.seed, true), 0, 0);   // base — без квітів, all — у цвіту
      V.push({ kind: sp.kind, x: top[0], y: top[1], s, L: Lw, w: sp.w, ph: sp.seed * 1.3, base, all, shake: -99, off: sp.off }); }
    return V;
  }
  const amp = (v, i, n, t) => { const dt = t - v.shake, sh = dt >= 0 && dt < 2.5 ? 2.2 * Math.exp(-dt / .8) * Math.cos(dt * 7) : 0; return (Math.sin(t * 1.05 + v.ph + i * .33) * .85 + sh) * v.s * Math.pow(i / n, 1.4); };
  /** Чи цвіте зараз (цикл 150 с, у кожної свій зсув; цвіте ~70 % часу). */
  const blooming = (v, t) => ((t / 150 + v.off) % 1) < .7;

  NX.decorVines = {
    KINDS, has: k => !!DRAW[k], lastKind: null,
    draw(c, t, vx0, vx1) {
      c.save(); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
      for (const v of build()) { const w = v.w * v.s; if (v.x + w < vx0 - 10 || v.x - w > vx1 + 10) continue;
        const hb = 3, n = Math.ceil((v.L + 2.5) / hb), src = blooming(v, t) ? v.all : v.base;
        for (let i = 0; i < n; i++) { const dx = amp(v, i, n, t), sy = i * hb * R, sh = Math.min(hb * R, v.base.height - sy); if (sh <= 0) break;
          const dy = v.y + (i * hb - 1.5) * v.s, dh = sh / R * v.s + .03; c.drawImage(src, 0, sy, src.width, sh, v.x - w / 2 + dx, dy, w, dh); } }
      c.restore();
    },
    tap(x, y, t) { for (const v of build()) { const w = v.w * v.s; if (x > v.x - w / 2 - 1 && x < v.x + w / 2 + 1 && y > v.y - 2 && y < v.y + v.L * v.s + 1) { v.shake = t; this.lastKind = v.kind; return true; } } return false; },
    /** Портрет виду для картки довідника: верхівка ліани з квітами. */
    sprite(kind) { const sp = SPEC.find(q => q.kind === kind); if (!sp) return null; const L = 15, w = sp.w + 1, a = gen(kind, w, L, sp.seed, false, true), b = gen(kind, w, L, sp.seed, true); a.getContext('2d').drawImage(b, 0, 0); return a; },
    /** Для tools/wingbox/decor_check.js: ліани в крайніх положеннях. */
    extentTo(c) { for (const v of build()) { const w = v.w * v.s + 3.4 * v.s; c.fillRect(v.x - w / 2, v.y - 1.5 * v.s, w, (v.L + 1.6) * v.s); } },
  };
})();
