/* ============================================================================
 * objects/dc_paint.js — ДЕКОР СТІН: ФОРМИ Й МАЛЮНКИ ГРАНЕЙ (антресоль, полиці, вазони з рослинами, підвіси, гідропоніка,
 * фітолампи, ліхтар, артефакти ботаніка, плакат, неонова вивіска)
 * ----------------------------------------------------------------------------
 * Розкладка — tools/wingbox/decor.py (предмети шару 'up', id dc_*; рушій js/objects/arc_scene.js малює їх у шарі «біля
 * стіни» — нерухоме, у растрі крила: fps не страждає). Тут — як вони виглядають: форми NX.arc.shape['st:dc_*'] (набір G:
 * part / partF / tube / disc / face — точки світу), малюнки лиць NX.arc.paint[id] (плакат, неон), рослини — dc_plants.js.
 *   dc_mz      — сегмент АНТРЕСОЛІ (2° дуги): фасад з рожевим неоном угорі й блакитною LED-смугою внизу, спід з балками й
 *                теплими точковими світильниками, торці, поруччя (хромовані стійки й поручні), консолі під плитою
 *   dc_shelf   — полиця: дошка (ліворуч — тепле дерево, праворуч — сталь з неоновим кантом) і два кронштейни
 *   dc_pot     — вазон (3D-циліндр: теракота / navy з неоном / кераміка / темний / хром) і рослина-спрайт над ним (hl — звисає)
 *   dc_hang    — підвісний вазон на кронштейні (макраме) або ліана з краю антресолі
 *   dc_hydro   — гідропоніка: труба з рослинами в отворах; dc_grow0/1 — фітолампи (фіолетові світлодіоди знизу; стиль neon)
 *   dc_lantern — золотий ліхтар (світить на стіну: glow у розкладці)
 *   dc_art     — штучки ботаніка: книжки, кришталева куля, куля-тераріум зі світним мохом, мікроскоп, колба з паростком, лійка
 *   dc_poster0 / dc_neon — плакат (напис — NX.t, 4 мови) і неонова вивіска (Nexi з паростком, без слів; стиль neon — рожевий кант)
 * Усе кодом, у стилі кімнати: неон, глянець, 8-bit перелив з дизерингом, темний контур (його дає рушій).
 * ========================================================================== */
NX.arc = NX.arc || {};
(() => {
  const X = NX.px3d, A = NX.arc.kit, PL = A.PAL, PAINT = NX.arc.paint, hash = NX.art.hash;
  const { col, pal, ramp, mixc, dim, sub } = X;
  const SHP = NX.arc.shape = NX.arc.shape || {};
  const E = c => { X.SH.fl |= X.F_EMIT; return c; };
  const N = A.NEON, D2R = Math.PI / 180;
  const chromeT = (u, v, i, j) => ramp(PL.CHROME, .25 + (1 - Math.abs(u - .38) * 2.2) * .62, i, j);
  const steelT = (u, v, i, j) => ramp(PL.MET, .2 + (1 - Math.abs(u - .38) * 2.2) * .55, i, j);
  const brassT = (u, v, i, j) => ramp(PL.GOLD, .3 + (1 - Math.abs(u - .38) * 2.2) * .6, i, j);
  const lit = (n, p) => A.lit(n, p);

  // ---------- палітри декору ----------
  const POTS = {
    terra: { pal: PL.TERRA, band: null }, navy: { pal: PL.NAVY, band: 'pink' }, ceram: { pal: PL.CERAM, band: null }, dark: { pal: PL.DARK, band: 'cyan' },
    chrome: { pal: PL.CHROME, band: null }, gold: { pal: PL.GOLD, band: null },
  };
  const PVC = pal(['#141236', '#1e1a4c', '#2a2464', '#38307e', '#4a4098', '#6052b2', '#7c6cca', '#a092e2']);   // труба гідропоніки: світлий бузковий пластик
  const MOSS = pal(['#0a3a2a', '#0f5a3a', '#1a8a4a', '#2ac05a', '#5af08a', '#b0ffc8']);
  const BOOK = ['#c84a8a', '#4a8ad0', '#d8a030', '#6a4ac0', '#3aa858', '#d05a3a', '#2ab8b8'];

  // ---------- спрайт рослини -> пласка грань лицем до глядача (білборд) ----------
  /** Рослина kind (spec для NX.arc.dcPlant) у прямокутнику світу: середина x (cx), глибина cz, верх yt, низ yb, ширина w.
   *  Спрайт будується, коли грань малюється (команда шару — з паузою після неї: збірка шматками під заставкою). */
  function plantFace(G, spec, cx, cz, yt, yb, w, glow) {
    let S = null; const hw = w / 2, h = yb - yt;
    const poly = [[cx - hw, yt, cz], [cx + hw, yt, cz], [cx + hw, yb, cz], [cx - hw, yb, cz]];
    G.face(poly, poly[0], [w, 0, 0], [0, h, 0], (u, v) => {
      if (!S) S = NX.arc.dcPlant(Object.assign({ w: Math.round(w * 2) / 2, h: Math.round(h * 2) / 2 }, spec));
      const px = Math.min(S.sw - 1, (u * S.sw) | 0), py = Math.min(S.sh - 1, (v * S.sh) | 0), c = S.d[py * S.sw + px];
      if ((c >>> 24) < 110) return 0;
      const cc = (c | 0xff000000) >>> 0; if (glow && X.lum(cc) > .5) X.SH.fl |= X.F_EMIT; return cc;
    }, [0, 0, -1]);
  }
  /** Вазон-циліндр (звужується донизу) з обідком; середина — точка p (світ), низ — yb. */
  function pot(G, B, p, pw, ph, yb, kind) {
    const pt = POTS[kind] || POTS.terra, Pi = { x: p[0], z: p[2] - pw / 2, turn: 0, w: pw, dep: pw, yt: yb - ph, yb, cyl: 14, kb: .76, band: pt.band ? 1 : 0 };
    G.part(Pi, 'pot', { pal: pt.pal, q: .56, bandC: pt.band || 'cyan' });
    const rim = { x: p[0], z: p[2] - pw * .56, turn: 0, w: pw * 1.12, dep: pw * 1.12, yt: yb - ph - .2, yb: yb - ph + Math.min(1.2, ph * .2), cyl: 14 };   // обідок трохи ширший
    G.part(rim, 'pot', { pal: pt.pal, q: .7 });
  }

  // ---------- АНТРЕСОЛЬ (сегмент дуги) ----------
  SHP['st:dc_mz'] = (G, B) => {
    const M = B.dc, sg = M.sgn, C = M.C, R = M.R, rf = R - M.P, rw = R - .3, top = M.top, bot = M.bot, h = bot - top;
    const pt = (a, rad, y) => [C[0] + sg * rad * Math.sin(a * D2R), y, C[1] + rad * Math.cos(a * D2R)];
    const nIn = a => [-sg * Math.sin(a * D2R), 0, -Math.cos(a * D2R)], am = (M.sa + M.sb) / 2;
    const f0t = pt(M.sa, rf, top), f1t = pt(M.sb, rf, top), f1b = pt(M.sb, rf, bot), f0b = pt(M.sa, rf, bot), len = Math.hypot(f1t[0] - f0t[0], f1t[2] - f0t[2]);
    // фасад: рожевий неон угорі, панелі з заклепками, блакитна LED-смуга внизу (вогники — через один)
    const Lf = lit(nIn(am), f0t);
    G.face([f0t, f1t, f1b, f0b], f0t, sub(f1t, f0t), [0, h, 0], (u, v, i, j) => {
      const x = M.s0 + u * len, y = v * h;
      if (y < 1.1) return E(y < .45 ? N.pink[2] : N.pink[1]);
      if (y > h - 1.1) return E(((x * 1.4) | 0) % 3 ? N.cyan[1] : N.cyan[2]);
      const pc = ((x % 22) + 22) % 22; if (pc < .55) return ramp(PL.STEEL, .12, i, j);
      let q = .42 * Lf + (y < 2 ? .14 : 0) - (y > h - 2 ? .1 : 0);
      if ((Math.abs(pc - 2.2) < .45 || Math.abs(pc - 19.8) < .45) && Math.abs(y - h / 2) < .45) q += .32;   // болти
      if (pc > 6 && pc < 16 && Math.abs(y - h / 2) < 1.2) q -= .12;                                             // утоплена смуга
      return ramp(PL.MET, q, i, j);
    }, nIn(am));
    // спід: від краю до стіни (видно знизу) — балки, теплі точкові світильники біля краю
    const w0b = pt(M.sa, rw, bot), w1b = pt(M.sb, rw, bot), dep = M.P - .3;
    G.face([f0b, f1b, w1b, w0b], f0b, sub(f1b, f0b), sub(w0b, f0b), (u, v, i, j) => {
      const x = M.s0 + u * len, beam = ((x % 11) + 11) % 11 < 1.6, d = v * dep;
      if (!beam && Math.abs(d - 3.2) < .9 && (((x + 5.5) % 22) + 22) % 22 < 1.6) return E(col('#ffe2a0'));
      return ramp(PL.STEEL, .26 + (1 - v) * .16 + (beam ? .18 : 0), i, j);
    }, [0, 1, 0]);
    // торці (крайні сегменти)
    const cap = a => { const a0 = pt(a, rf, top), a1 = pt(a, rw, top), a2 = pt(a, rw, bot), a3 = pt(a, rf, bot), t = [sg * Math.cos(a * D2R), 0, -Math.sin(a * D2R)], n = a === M.sa ? [-t[0], 0, -t[2]] : t;
      G.face([a0, a1, a2, a3], a0, sub(a1, a0), [0, h, 0], (u, v, i, j) => v * h < 1.1 ? E(N.pink[1]) : ramp(PL.MET, .36 + (u < .1 ? .14 : 0), i, j), n); };
    if (M.i === 0) cap(M.sa); if (M.i === M.n - 1) cap(M.sb);
    // поруччя: стійки через сегмент (кожні 4°), поручень, середня й нижня рейки; бічне — до стіни, теж зі стійками
    const rr = rf + .7, top2 = top - M.rail, post = (a, rad = rr) => G.tube(pt(a, rad, top), pt(a, rad, top2 - .6), 1.15, chromeT);
    if (M.i % 2 === 0) post(M.sa); if (M.i === M.n - 1) post(M.sb);
    G.tube(pt(M.sa, rr, top2), pt(M.sb, rr, top2), 1.45, chromeT);
    G.tube(pt(M.sa, rr, top2 + M.rail * .45), pt(M.sb, rr, top2 + M.rail * .45), .7, chromeT);
    G.tube(pt(M.sa, rr, top - 1.6), pt(M.sb, rr, top - 1.6), .6, chromeT);
    const side = a => { for (const y of [top2, top2 + M.rail * .45, top - 1.6]) G.tube(pt(a, rr, y), pt(a, rw - .6, y), y === top2 ? 1.3 : .65, chromeT);
      for (const k of [.33, .66]) post(a, rr + (rw - .6 - rr) * k); post(a, rw - .6); };
    if (M.i === 0) side(M.sa); if (M.i === M.n - 1) side(M.sb);
    // консолі під плитою (біля стіни): косинка й планка на стіні
    if (M.i % 4 === 1) {
      const b0 = pt(am, rw - .2, bot + M.brk), b1 = pt(am, rw - M.P * .55, bot + .2);
      G.tube(b0, b1, 1.2, steelT); G.tube(pt(am, rw - .4, bot), pt(am, rw - .4, bot + M.brk + 1), 1.6, steelT);
    }
  };

  // ---------- ПОЛИЦЯ ----------
  SHP['st:dc_shelf'] = (G, B) => {
    const d = B.dc, top = B.yt + .2, th = d.th, wood = d.style !== 'metal';
    const board = G.sub(0, B.dep / 2, B.w, B.dep, top, top + th);
    G.part(board, 'shelf', wood ? { pal: PL.WOOD, q: .62, bev: .45 } : { pal: PL.MET, q: .58, neon: '#3be8ff', nIn: .5, nW: .5 });
    for (const sgu of [-1, 1]) {                                                      // кронштейни: планка на стіні й косинка
      const u = sgu * (B.w / 2 - Math.min(4, B.w * .16));
      G.part(G.sub(u, B.dep - .5, 1.2, 1, top + th, top + d.brk), 'shelf', { pal: wood ? PL.STEEL : PL.MET, q: .5, bev: .2 });
      G.tube(G.P(u, B.dep - .8, top + d.brk - .4), G.P(u, B.dep * .3, top + th + .1), .8, steelT);
    }
  };

  // ---------- ВАЗОН З РОСЛИНОЮ ----------
  SHP['st:dc_pot'] = (G, B) => {
    const d = B.dc, hl = d.hl || 0, base = B.yb - hl, pw = d.pw, ph = d.ph;
    const v = hl ? pw / 2 + .9 : B.dep / 2, p = G.P(0, v, base);
    pot(G, B, p, pw, ph, base, d.pot);
    const spec = { kind: d.kind, seed: d.seed, pal: d.pal };
    if (hl) {                                                                         // звисає з краю: крона над вазоном, пасма — перед дошкою
      const f = G.P(0, .25, base); plantFace(G, Object.assign(spec, { hang: 1 }), f[0], f[2], base - ph - 2.4, B.yb, B.w, d.glow);
    } else plantFace(G, spec, p[0], p[2] - pw * .12, B.yt, base - ph + 1.1, B.w, d.glow);
  };

  // ---------- ПІДВІСИ ----------
  SHP['st:dc_hang'] = (G, B) => {
    const d = B.dc, c = G.P(0, B.dep / 2, B.yt);
    if (d.frm === 'hook') {                                                           // кронштейн зі стіни, три шнурки макраме, вазон, ліана з нього
      const hook = G.P(0, B.dep / 2, B.yt + .6), wv = B.dep + (d.wb || 0) - .2, wallp = G.P(0, wv, B.yt + .6);               // wb — від спини коробки до стіни
      G.tube(wallp, hook, .9, brassT); G.disc(G.P(0, wv - .3, B.yt + .6), 1, (u, v, i, j) => ramp(PL.GOLD, .6 - v * .3, i, j));
      const pw = Math.min(7, B.w * .42), ph = 4.2, potY = B.yt + Math.min(14, (B.yb - B.yt) * .3), p = G.P(0, B.dep / 2, potY);
      for (const k of [-1, 0, 1]) G.tube(hook, [p[0] + k * pw * .5, potY - ph, p[2] - (k === 0 ? pw * .45 : 0)], .55, (u, v, i, j) => ramp(['#3a2a1a', '#7a5a3a', '#c8a070', '#f0d8a8'].map(col), .5 + (u - .5) * .6, i, j));
      pot(G, B, p, pw, ph, potY, d.pot === 'macrame' ? 'ceram' : d.pot);
      plantFace(G, { kind: d.kind === 'pothos' ? 'vine' : d.kind, seed: d.seed, hang: 1, pal: d.pal || 'light' }, p[0], p[2] + pw * .3, potY - ph - 1.5, B.yb, B.w, false);   // позаду вазона: вазон і шнурки видно, листя — з-за обідка й нижче
    } else plantFace(G, { kind: d.kind, seed: d.seed, hang: 1, pal: d.pal || (d.seed % 2 ? 'light' : 'sage') }, c[0], c[2], B.yt, B.yb, B.w, false);
  };

  // ---------- ГІДРОПОНІКА Й ФІТОЛАМПА ----------
  SHP['st:dc_hydro'] = (G, B) => {
    const d = B.dc, [t0, t1] = d.tube, h = t1 - t0, Pi = G.sub(0, B.dep / 2, B.w, B.dep - 1, t0, t1);
    G.partF(Pi, (Fc) => {
      const L = lit(Fc.n, A.centre(Fc));
      if (Fc.k === 'front') return (u, v, i, j) => { const y = v * h, x = u * Fc.fw;
        if (x < 1.2 || x > Fc.fw - 1.2) return ramp(PVC, .3, i, j);                    // торцеві заглушки
        if (Math.abs(y - h * .62) < .35) return E(N.cyan[1]);                          // блакитна смужка
        return ramp(PVC, (.75 - Math.abs(v - .32) * 1.1) * L, i, j); };
      return (u, v, i, j) => ramp(PVC, .3 * L, i, j);
    });
    for (const u of [-.32, .32]) G.part(G.sub(u * B.w, B.dep - .6, 1.4, 1.2, t0 - .4, t1 + .4), 'dark', {});   // хомути до стіни
    const n = d.n, kinds = d.kinds;
    for (let k = 0; k < n; k++) {
      const u = (k + .5) / n - .5, p = G.P(u * (B.w - 4), B.dep / 2, t0), kind = kinds[k % kinds.length], w = kind === 'lettuce' ? 10 : 9, hh = kind === 'straw' ? 11 : 13 - (k % 2) * 2;
      plantFace(G, { kind, seed: d.seed * 7 + k }, p[0], p[2] - 1.6, t0 - hh, t0 + .9, w, false);
    }
  };
  /** Фітолампа: стиль у розкладці — neon (рушій дає рожево-фіолетове світло на стіну), тож форма — за id предмета. */
  SHP.dc_grow0 = SHP.dc_grow1 = (G, B) => {
    const bar = G.sub(0, B.dep * .45, B.w, 3.2, B.yt, B.yb);
    G.partF(bar, (Fc) => {
      if (Fc.k === 'bottom') return (u, v, i, j) => { const x = u * Fc.fw; return x < 1 || x > Fc.fw - 1 || v < .2 || v > .8 ? ramp(PL.STEEL, .3, i, j) : E(((x * 1.2) | 0) % 2 ? col('#ff5ae8') : col('#b44aff')); };
      const L = lit(Fc.n, A.centre(Fc)); return (u, v, i, j) => ramp(PL.STEEL, .45 * L + (v < .25 ? .12 : 0), i, j);
    });
    for (const u of [-.42, .42]) G.tube(G.P(u * B.w, B.dep - .3, B.yt + 1), G.P(u * B.w, B.dep * .45, B.yt + 1), .8, steelT);   // тримачі зі стіни
  };

  // ---------- ЛІХТАР ----------
  SHP['st:dc_lantern'] = (G, B) => {
    const c = G.P(0, B.dep / 2, B.yb), w = B.w, H = B.yb - B.yt, at = (y0, y1, k, extra = {}) => Object.assign({ x: c[0], z: c[2] - w * k / 2, turn: 0, w: w * k, dep: w * k, yt: y0, yb: y1, cyl: 14 }, extra);
    G.part(at(B.yb - 2, B.yb, .9), 'gold', {});                                       // основа
    G.partF(at(B.yt + H * .32, B.yb - 2, .62), () => (u, v, i, j) => E(ramp(PL.LAMP, .95 - Math.abs(u - .45) * .8 - v * .25, i, j)));   // скло зі світлом
    for (let k = 0; k < 4; k++) { const a = (k + .5) / 4 * Math.PI * 2, r = w * .36; G.tube([c[0] + Math.cos(a) * r, B.yb - 2, c[2] + Math.sin(a) * r], [c[0] + Math.cos(a) * r, B.yt + H * .32, c[2] + Math.sin(a) * r], .55, brassT); }
    G.part(at(B.yt + H * .14, B.yt + H * .32, .95, { kt: .35 }), 'gold', {});        // дашок
    G.tube([c[0], B.yt + H * .14, c[2]], [c[0], B.yt + .6, c[2]], .5, brassT); G.disc([c[0], B.yt + 1, c[2] - .3], 1.1, (u, v, i, j) => ramp(PL.GOLD, .7 - v * .4, i, j));   // кільце
  };

  // ---------- ШТУЧКИ БОТАНІКА ----------
  SHP['st:dc_art'] = (G, B) => {
    const d = B.dc, k = d.kind, c = G.P(0, B.dep / 2, B.yb), w = B.w, H = B.yb - B.yt;
    const cylAt = (x, y0, y1, r, extra = {}) => Object.assign({ x, z: c[2] - r, turn: 0, w: r * 2, dep: r * 2, yt: y0, yb: y1, cyl: 14 }, extra);
    if (k === 'books') {                                                              // книжки стоять рядком, одна лежить
      let u = -w / 2 + .4, n = 0;
      while (u < w / 2 - 1.6 && n < 6) { const bw = 1.4 + hash(d.seed, n) * .9, bh = H * (.65 + .35 * hash(n, d.seed + 3)), cc = BOOK[(d.seed + n) % BOOK.length];
        const P_ = G.sub(u + bw / 2, B.dep / 2, bw, B.dep * .8, B.yb - bh, B.yb); G.partF(P_, Fc => { const L = lit(Fc.n, A.centre(Fc)); return (uu, vv, i, j) => { const base = col(cc), q = Fc.k === 'front' ? (Math.abs(vv - .2) < .05 || Math.abs(vv - .8) < .05 ? .25 : 0) : -.2; return q > 0 ? mixc(base, col('#ffe9b0'), .6) : dim(base, (.62 + q) * L); }; });
        u += bw + .15; n++; }
      return;
    }
    if (k === 'orb') {                                                                // кришталева куля на золотій підставці
      G.part(cylAt(c[0], B.yb - 1.6, B.yb, w * .38), 'gold', {});
      G.disc([c[0], B.yb - 1.6 - w * .4, c[2] - .2], w * .42, (u, v, i, j) => { const r = Math.hypot(u - .5, v - .5) * 2; return r < .35 ? E(ramp(pal(['#4a1a8a', '#8a3ad8', '#c88aff', '#f0d8ff']), 1 - r * 1.6, i, j)) : (u < .4 && v < .35 && r > .5 ? col('#eef2ff') : ramp(pal(['#100830', '#241460', '#3a2a90', '#5a4ac0']), .8 - r * .5, i, j)); });
      return;
    }
    if (k === 'terrarium') {                                                          // куля-тераріум: скло, світний мох і паросток усередині
      const r = Math.min(w, H) * .48, cy = B.yb - r;
      G.part(cylAt(c[0], B.yb - 1.2, B.yb, r * .62), 'dark', {});
      G.disc([c[0], cy, c[2] - .2], r, (u, v, i, j) => { const rr = Math.hypot(u - .5, v - .5) * 2;
        if (rr > .86) return ramp(PL.GLASS, .7, i, j); if (u < .38 && v < .32 && rr > .55) return col('#dff4ff');
        if (v > .62) return E(ramp(MOSS, .4 + hash(i >> 1, j >> 1) * .5 - (v - .62), i, j));
        if (Math.abs(u - .5) < .05 && v > .35) return col('#5af08a'); if (v > .3 && v < .45 && Math.abs(u - .5 + (v - .38) * 1.5) < .1) return col('#7cf0a0');
        return ramp(pal(['#06121e', '#0a1e2e', '#10283a']), .5, i, j); });
      return;
    }
    if (k === 'flask') {                                                              // колба Ерленмеєра: світна рідина, паросток з горлечка
      const r = w * .46, neck = r * .34, yN = B.yb - H * .55;
      G.partF(cylAt(c[0], yN, B.yb, r, { kt: .36 }), Fc => Fc.k === 'side' ? (u, v, i, j) => v > .45 ? E(ramp(MOSS, .55 + (v - .45) * .6 - Math.abs(u - .5) * .3, i, j)) : (Math.abs(u - .3) < .05 ? col('#e8f6ff') : ramp(PL.GLASS, .45, i, j)) : (u, v, i, j) => ramp(PL.GLASS, .4, i, j));
      G.part(cylAt(c[0], B.yt + H * .2, yN + .2, neck), 'glass', {});
      plantFace(G, { kind: 'basil', seed: 5 }, c[0], c[2] - neck - .6, B.yt, B.yt + H * .24, w * .8, false);
      return;
    }
    if (k === 'scope') {                                                              // мікроскоп: основа, штатив, тубус, окуляр, предметний столик
      G.part(G.sub(0, B.dep / 2, w * .9, B.dep * .8, B.yb - 1.4, B.yb), 'dark', {});
      const b = G.P(w * .25, B.dep * .6, B.yb - 1.4), t = G.P(w * .2, B.dep * .55, B.yt + H * .25);
      G.tube(b, t, 1.4, steelT); G.tube(G.P(-w * .05, B.dep * .5, B.yt + H * .55), G.P(-w * .25, B.dep * .4, B.yt + .6), 1.8, brassT);
      G.part(G.sub(-w * .08, B.dep * .45, w * .55, B.dep * .5, B.yb - H * .4, B.yb - H * .35), 'dark', {});
      G.disc(G.P(-w * .27, B.dep * .4, B.yt + .5), .9, (u, v, i, j) => ramp(PL.GOLD, .7 - v * .4, i, j));
      return;
    }
    if (k === 'can') {                                                                // лійка: бочок, носик, ручка
      G.part(cylAt(c[0], B.yt + H * .3, B.yb, w * .3, { kt: .9 }), 'pot', { pal: pal(['#0a2a3a', '#0f4a5a', '#16707a', '#249a9a', '#3cc0b0', '#7ae8d0']), q: .58 });
      G.tube(G.P(w * .12, B.dep * .5, B.yb - H * .3), G.P(w * .5, B.dep * .5, B.yt + H * .12), .9, chromeT);
      G.tube(G.P(-w * .3, B.dep * .5, B.yt + H * .32), G.P(-w * .1, B.dep * .5, B.yt + H * .08), .7, chromeT);
      return;
    }
  };

  // ---------- ПЛАКАТ І НЕОН (пласкі: грань-малюнок) ----------
  A.STY.dc_poster = { pal: PL.DARK, q: .4, bev: .3, ins: 0 };
  A.STY.dc_neon = { pal: PL.DARK, q: .3, bev: .3, ins: 0 };
  /** Плакат «Nexi — ботанік»: рамка, темно-синій папір, монстера кодом, напис і підпис зі словників (4 мови). */
  PAINT.dc_poster0 = (c, fw, fh) => {
    const T = A.txt;
    c.fillStyle = '#2a1830'; c.fillRect(0, 0, fw, fh); c.fillStyle = '#0c1a3a'; c.fillRect(1.2, 1.2, fw - 2.4, fh - 2.4);
    c.strokeStyle = '#d8a030'; c.lineWidth = .5; c.strokeRect(2.2, 2.2, fw - 4.4, fh - 4.4);
    const cx = fw / 2, cy = fh * .46, r = fw * .3;
    c.fillStyle = 'rgba(90,232,255,.12)'; c.beginPath(); c.arc(cx, cy, r * 1.25, 0, 7); c.fill();
    // листок монстери: серце з розрізами
    c.fillStyle = '#237e56'; c.beginPath(); c.moveTo(cx, cy + r); c.bezierCurveTo(cx - r * 1.4, cy + r * .2, cx - r * .9, cy - r * 1.1, cx, cy - r * .55); c.bezierCurveTo(cx + r * .9, cy - r * 1.1, cx + r * 1.4, cy + r * .2, cx, cy + r); c.fill();
    c.strokeStyle = '#0c1a3a'; c.lineWidth = r * .1; for (const sg of [-1, 1]) for (let k = 0; k < 3; k++) { const y = cy - r * .25 + k * r * .38; c.beginPath(); c.moveTo(cx + sg * r * .95, y - r * .1); c.lineTo(cx + sg * r * .45, y + r * .06); c.stroke(); }
    c.strokeStyle = '#7ae8a0'; c.lineWidth = r * .06; c.beginPath(); c.moveTo(cx, cy + r * 1.1); c.lineTo(cx, cy - r * .45); c.stroke();
    T(c, NX.t('decor.poster.title'), cx, fh * .11, fw - 5, fh * .07, '#ffd27a', { glow: '#ff9a3a' });
    T(c, NX.t('decor.poster.sub'), cx, fh * .86, fw - 6, fh * .045, '#9af6ff', { glow: '#3be8ff' });
  };
  /** Неонова вивіска: голова Nexi (блакитний неон), паросток з неї (зелений) і сердечко (рожеве) — без слів. */
  PAINT.dc_neon = (c, fw, fh) => {
    c.fillStyle = '#0a0618'; c.fillRect(0, 0, fw, fh); c.strokeStyle = '#2a1a5a'; c.lineWidth = .5; c.strokeRect(.6, .6, fw - 1.2, fh - 1.2);
    const s = Math.min(fw, fh) / 40, cx = fw * .46, cy = fh * .58, GRN = ['#0a5a3a', '#3bff8a', '#d0ffe4'];
    const nl = (x0, y0, x1, y1, hx, w = 1) => { if (hx !== 'green') return A.neon(c, x0, y0, x1, y1, hx, w * s);          // зелений неон — вручну (ореол, колір, серцевина)
      c.lineCap = 'round'; [[w * s * 2.2, GRN[0], .55], [w * s, GRN[1], 1], [w * s * .38, GRN[2], 1]].forEach(([lw, st, a]) => { c.globalAlpha = a; c.strokeStyle = st; c.lineWidth = lw; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); }); c.globalAlpha = 1; };
    const R = (x, y, w, h, hx) => { nl(x, y, x + w, y, hx); nl(x + w, y, x + w, y + h, hx); nl(x + w, y + h, x, y + h, hx); nl(x, y + h, x, y, hx); };
    R(cx - 11 * s, cy - 7 * s, 22 * s, 15 * s, '#3be8ff');                           // голова
    R(cx - 6.5 * s, cy - 2.5 * s, 4 * s, 4 * s, '#3be8ff'); R(cx + 2.5 * s, cy - 2.5 * s, 4 * s, 4 * s, '#3be8ff');   // очі
    nl(cx - 4 * s, cy + 4.5 * s, cx + 4 * s, cy + 4.5 * s, '#3be8ff');
    nl(cx, cy - 7 * s, cx, cy - 13 * s, 'green');                                     // паросток-«антена»
    const leafN = (sg) => { for (let k = 0; k < 6; k++) { const t0 = k / 6, t1 = (k + 1) / 6, f = t => [cx + sg * Math.sin(t * Math.PI) * 6 * s, cy - 13 * s - t * 5 * s]; const a = f(t0), b = f(t1); nl(a[0], a[1], b[0], b[1], 'green', .9); } };
    leafN(-1); leafN(1);
    const hx = fw * .82, hy = fh * .28, hs = 3.2 * s;                                 // сердечко
    nl(hx, hy + hs, hx - hs * 1.2, hy - hs * .1, '#ff4fd8'); nl(hx - hs * 1.2, hy - hs * .1, hx - hs * .6, hy - hs * .9, '#ff4fd8'); nl(hx - hs * .6, hy - hs * .9, hx, hy - hs * .3, '#ff4fd8');
    nl(hx, hy - hs * .3, hx + hs * .6, hy - hs * .9, '#ff4fd8'); nl(hx + hs * .6, hy - hs * .9, hx + hs * 1.2, hy - hs * .1, '#ff4fd8'); nl(hx + hs * 1.2, hy - hs * .1, hx, hy + hs, '#ff4fd8');
  };
})();
