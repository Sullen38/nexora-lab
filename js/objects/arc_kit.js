/* ============================================================================
 * objects/arc_kit.js — МАТЕРІАЛИ Й ГРАНІ КРИЛ «ПО ДУЗІ» (NX.arc.kit)
 * ----------------------------------------------------------------------------
 * Спільний набір для піксельного 3D обох крил (рушій — core/px3d.js, розкладка — objects/arc_layout.js):
 *   PAL                 — палітри кімнати (темна фіолетова сталь, глянцеві столи, теплі дошки, теракота, золото...)
 *   faces(B)            — грані предмета розкладки: коробка (зі зрізаними верхніми кутами ch), циліндр (cyl);
 *                         у кожної грані: многокутник, параметризація (u, v), зовнішня нормаль, розмір fw × fh (од. світу)
 *   lit(n, P)           — освітленість грані: стеля над кімнатою, вікно в глибині, світло з центру кімнати
 *   shader(st, F, B, o) — матеріал за стилем (st): фаска (світлий верхній/лівий край, темний нижній), вставка-шов,
 *                         неоновий кант, болти, вертикальний перелив, дизеринг Байєра; зверху — текстура грані (o.tex)
 *   texture(B, F, TS, paint) — пласка текстура грані (полотно в одиницях грані, TS текселів на одиницю):
 *                         оздоби розкладки (deco: r / ch / c / l / bars / grid / txt / arch / p) у піксельному стилі
 *                         або власний малюнок (paint) — вивіски з NX.t, екрани, іконки
 *   neon(c, ...) / holo(c, ...) / signPlate(c, ...) — дрібниці для текстур (неонова трубка, голо-екран, вивіска)
 * Усе кодом, у стилі картинки кімнати: неон, глянець, 8-bit перелив, контур. Жодного розмиття.
 * ========================================================================== */
NX.arc = NX.arc || {};
NX.arc.kit = (() => {
  const X = NX.px3d, { col, pal, ramp, mixc, dim, add, rgb, sub, dot } = X, F_EMIT = X.F_EMIT, FL = 372, P = NX.px;
  // ---------- палітри (темне -> світле), упаковані ----------
  const PAL = {
    MET: pal(['#0a0820', '#120e30', '#1a1542', '#241c56', '#30266c', '#3e3284', '#50429e', '#6a5abc', '#8e80d8']),   // фіолетова сталь (рами будок)
    STEEL: pal(['#05041a', '#0a0826', '#100d34', '#171344', '#1f1a56', '#28226a', '#332c80', '#423a98']),             // темна сталь (основи, колони)
    PFR: pal(['#0c0428', '#140838', '#1e0c4c', '#2a1262', '#381a7a', '#482494', '#5c32ae', '#7848c8', '#9a6ae0']),    // портал: глибокий фіолет
    NAVY: pal(['#040818', '#070d24', '#0b1434', '#101c46', '#16265a', '#1d3170', '#263e88', '#314c9e', '#3f5eb4']),
    DESK: pal(['#06041a', '#0d0828', '#140c36', '#1c1146', '#251758', '#301e6c', '#3d2784', '#4d33a0', '#6044b8']),
    TOP: pal(['#060318', '#0b0730', '#120a36', '#1c0a3c', '#2b0c40', '#3e1048', '#541a56', '#6a2462', '#8a3478']),     // глянцевий верх стола (темне скло)
    LIL: pal(['#1a143e', '#241c54', '#30266c', '#3d3186', '#4c3ea0', '#5e4eb8', '#7462cc', '#8e7ede']),
    BOT: pal(['#1a0c38', '#2a1450', '#3a1a6a', '#4a2486', '#5e30a0', '#7a44c0', '#9a60da', '#c08af0', '#e0b8ff']),
    CHROME: pal(['#1a1c40', '#22264e', '#353b6a', '#555f8c', '#848db4', '#bcc5e6', '#eef2ff']),
    GOLD: pal(['#2a1604', '#4a2a08', '#6a420e', '#8e5c16', '#b47a20', '#d89a2e', '#f0bc4a', '#ffdc84', '#fff2c4']),
    WOOD: pal(['#140812', '#22101c', '#321826', '#442032', '#582a3e', '#6e364a', '#864458', '#a05668', '#bc6c7c']),    // теплі дошки лівого крила (слива)
    TERRA: pal(['#2a1208', '#4a2010', '#6e3418', '#8e4a22', '#b06430', '#d08a4a', '#eaa866']),
    CERAM: pal(['#2a2448', '#3e3664', '#564c84', '#7064a4', '#8e84c2', '#b0a8dc', '#d4ceee', '#f0ecff']),             // світла кераміка (вазони)
    PINKP: pal(['#3a0b38', '#58134f', '#7a1c6d', '#a0288d', '#c63aa8', '#e656c0', '#ff84d4', '#ffc2ec']),
    STONE: pal(['#14122a', '#1e1c3a', '#2a284e', '#383664', '#48467a', '#5a5890', '#706ea8']),
    GLASS: pal(['#0a1a4a', '#10246a', '#183488', '#2048a4', '#2e62c0', '#4682d8', '#6aa6ec', '#a0d0ff']),
    HOLO: pal(['#071a52', '#0b2276', '#0f2e92', '#153cae', '#1b4ccc', '#235fe2', '#3276f0', '#4a90fa', '#6eaeff']),
    DARK: pal(['#04030c', '#08061a', '#0c0a24', '#120e30', '#18143e', '#201a4e', '#2a2260']),
    LAMP: pal(['#7a3a0a', '#b0601a', '#e08a2a', '#ffb24a', '#ffd27a', '#ffeab0', '#fff8e0']),
    CYANL: pal(['#0a3a5a', '#0f5a80', '#1a8ab0', '#2ab8e0', '#3be8ff', '#9af6ff', '#ffffff']),
    MACH: pal(['#0c0820', '#141030', '#1e1842', '#2a2256', '#382e6c', '#4a3e86', '#5e52a0']),
  };
  const C = { out: col('#060313'), pink: col('#ff4fd8'), pinkL: col('#ff9af0'), pinkW: col('#ffd6f6'), cyan: col('#3be8ff'), cyanL: col('#9af6ff'), cyanW: col('#e4fdff'),
    lil: col('#c86aff'), lilL: col('#e2b4ff'), orange: col('#ff9a3a'), orangeL: col('#ffd27a'), gold: col('#ffd27a'), haze: col('#070516'), black: col('#000000') };
  /** Неоновий колір -> [темний ореол, колір, світла серцевина] для трубки. */
  const NEON = {
    pink: [col('#8a1a7a'), col('#ff4fd8'), col('#ffc4f2')], cyan: [col('#0f5a80'), col('#3be8ff'), col('#d8fcff')], lil: [col('#5a2a9a'), col('#c86aff'), col('#f0d8ff')],
    orange: [col('#8a3a0a'), col('#ff9a3a'), col('#ffe2b0')], gold: [col('#8a5a10'), col('#ffd27a'), col('#fff4d0')], green: [col('#0a5a3a'), col('#3bff8a'), col('#d0ffe4')],
  };
  const neonOf = h => !h ? null : /^#(ff4fd8|ff7ad0|ff7af0|ff9af0|ff4f)/i.test(h) ? NEON.pink : /^#(3be8ff|7af4ff|9af8ff|8af4ff|3b8aff)/i.test(h) ? NEON.cyan
    : /^#(d98aff|c86aff|c8a0ff|e0a0ff)/i.test(h) ? NEON.lil : /^#(ff9a3a|ffb24a)/i.test(h) ? NEON.orange : /^#(ffd27a)/i.test(h) ? NEON.gold : NEON.cyan;

  // ---------- геометрія предмета розкладки ----------
  /** Базис предмета: f — нормаль лиця в плані, r — праворуч; P(u, v, y) — точка: u від середини лиця, v — углиб. */
  function basis(B) {
    const a = (B.turn || 0) * Math.PI / 180, f = [-Math.sin(a), -Math.cos(a)], r = [-f[1], f[0]], c = [B.x - f[0] * (B.back || 0), B.z - f[1] * (B.back || 0)];
    return { a, f, r, c, P: (u, v, y) => [c[0] + r[0] * u - f[0] * v, y, c[1] + r[1] * u - f[1] * v] };
  }
  /** Грані коробки / циліндра. k: front, back, left, right, top, bottom, chL, chR, side (циліндр; u — по колу 0..1). */
  function faces(B) {
    const { f, r, P } = basis(B), w = B.w / 2, d = B.dep, yb = B.yb, yt = B.yt, H = yb - yt, out = [];
    if (B.cyl) {
      // циліндр або зрізаний конус (kt / kb — масштаб верхнього / нижнього кола: вазон ширший угорі, абажур — унизу)
      const n = Math.max(16, B.cyl), kt = B.kt || 1, kb = B.kb || 1, ang = i => (i + .5) / n * Math.PI * 2;
      const ring = (y, k) => Array.from({ length: n }, (_, i) => P(w * k * Math.cos(ang(i)), d / 2 + d / 2 * k * Math.sin(ang(i)), y));
      const rt = ring(yt, kt), rb = ring(yb, kb), arc = Math.PI * (w + d / 2) * Math.max(kt, kb) / n, ctr = P(0, d / 2, (yt + yb) / 2);
      for (let i = 0; i < n; i++) {
        const k = (i + 1) % n, tm = (i + 1) / n * Math.PI * 2, poly = [rt[i], rt[k], rb[k], rb[i]];
        let nn = X.newell(poly); const rad = sub(rt[i], ctr); if (nn[0] * rad[0] + nn[2] * rad[2] < 0) nn = [-nn[0], -nn[1], -nn[2]];
        out.push({ k: 'side', i, n: nn, poly, O: rt[i], A: sub(rt[k], rt[i]), B: sub(rb[i], rt[i]), fw: arc, fh: H, ui: i / n, un: 1 / n, ang: tm });
      }
      const O = P(-w * kt, d / 2 - d / 2 * kt, yt);
      out.push({ k: 'top', n: [0, -1, 0], poly: rt, O, A: sub(P(w * kt, d / 2 - d / 2 * kt, yt), O), B: sub(P(-w * kt, d / 2 + d / 2 * kt, yt), O), fw: B.w * kt, fh: d * kt });
      const Ob = P(-w * kb, d / 2 - d / 2 * kb, yb);
      out.push({ k: 'bottom', n: [0, 1, 0], poly: rb.slice().reverse(), O: Ob, A: sub(P(w * kb, d / 2 - d / 2 * kb, yb), Ob), B: sub(P(-w * kb, d / 2 + d / 2 * kb, yb), Ob), fw: B.w * kb, fh: d * kb });
      return out;
    }
    const [cl, cr] = B.ch || [0, 0];
    const fr = cl || cr ? [P(-w, 0, yb), P(w, 0, yb), P(w, 0, yt + cr), P(w - cr, 0, yt), P(-w + cl, 0, yt), P(-w, 0, yt + cl)] : [P(-w, 0, yb), P(w, 0, yb), P(w, 0, yt), P(-w, 0, yt)];
    out.push({ k: 'front', n: [f[0], 0, f[1]], poly: fr, O: P(-w, 0, yt), A: sub(P(w, 0, yt), P(-w, 0, yt)), B: [0, H, 0], fw: B.w, fh: H });
    const bk = cl || cr ? [P(w, d, yb), P(-w, d, yb), P(-w, d, yt + cl), P(-w + cl, d, yt), P(w - cr, d, yt), P(w, d, yt + cr)] : [P(w, d, yb), P(-w, d, yb), P(-w, d, yt), P(w, d, yt)];
    out.push({ k: 'back', n: [-f[0], 0, -f[1]], poly: bk, O: P(w, d, yt), A: sub(P(-w, d, yt), P(w, d, yt)), B: [0, H, 0], fw: B.w, fh: H });
    const Ol = P(-w, 0, yt + cl), Or = P(w, 0, yt + cr);
    out.push({ k: 'left', n: [-r[0], 0, -r[1]], poly: [P(-w, d, yb), P(-w, 0, yb), Ol, P(-w, d, yt + cl)], O: Ol, A: sub(P(-w, d, yt + cl), Ol), B: [0, H - cl, 0], fw: d, fh: H - cl });
    out.push({ k: 'right', n: [r[0], 0, r[1]], poly: [P(w, 0, yb), P(w, d, yb), P(w, d, yt + cr), Or], O: Or, A: sub(P(w, d, yt + cr), Or), B: [0, H - cr, 0], fw: d, fh: H - cr });
    const Ot = P(-w + cl, 0, yt);
    out.push({ k: 'top', n: [0, -1, 0], poly: [Ot, P(w - cr, 0, yt), P(w - cr, d, yt), P(-w + cl, d, yt)], O: Ot, A: sub(P(w - cr, 0, yt), Ot), B: sub(P(-w + cl, d, yt), Ot), fw: B.w - cl - cr, fh: d });
    const Ob = P(-w, 0, yb);
    out.push({ k: 'bottom', n: [0, 1, 0], poly: [Ob, P(w, 0, yb), P(w, d, yb), P(-w, d, yb)], O: Ob, A: sub(P(w, 0, yb), Ob), B: sub(P(-w, d, yb), Ob), fw: B.w, fh: d });
    if (cl) { const O = P(-w, 0, yt + cl); out.push({ k: 'chL', n: [-r[0], -1, -r[1]], poly: [O, P(-w + cl, 0, yt), P(-w + cl, d, yt), P(-w, d, yt + cl)], O, A: sub(P(-w + cl, 0, yt), O), B: sub(P(-w, d, yt + cl), O), fw: cl * 1.41, fh: d }); }
    if (cr) { const O = P(w - cr, 0, yt); out.push({ k: 'chR', n: [r[0], -1, r[1]], poly: [O, P(w, 0, yt + cr), P(w, d, yt + cr), P(w - cr, d, yt)], O, A: sub(P(w, 0, yt + cr), O), B: sub(P(w - cr, d, yt), O), fw: cr * 1.41, fh: d }); }
    return out;
  }
  /** Чи видно грань з ока (зовнішня нормаль до ока). */
  const visible = F => dot(F.n, sub([X.VX, X.VY, X.EZ], F.poly[0])) > 1e-6;
  /** Середина грані (світ) і глибина. */
  const centre = F => { const p = F.poly, m = [0, 0, 0]; p.forEach(q => { m[0] += q[0]; m[1] += q[1]; m[2] += q[2]; }); return m.map(v => v / p.length); };

  // ---------- світло ----------
  const nrm = v => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
  const L_TOP = nrm([0, -1, -.35]);                                                    // стеля над кімнатою (трохи з боку глядача)
  /** Освітленість грані (0.3..1.3): стеля + світло з центру кімнати (від вікна й дивана) + легке заповнення від глядача. */
  function lit(n, p) {
    const N = nrm(n), toC = nrm([774 - p[0], 120 - p[1], 90 - p[2]]), toE = nrm([774 - p[0], 220 - p[1], -520 - p[2]]);
    const k = .42 + .38 * Math.max(0, dot(N, L_TOP)) + .34 * Math.max(0, dot(N, toC)) + .16 * Math.max(0, dot(N, toE));
    return Math.max(.3, Math.min(1.3, k));
  }

  // ---------- матеріали ----------
  /** Стиль -> налаштування: pal — палітра, q — базовий тон, bev — фаска (од.), ins — вставка-шов (од. від краю),
   *  neon — кант (колір), nIn/nW — де й якої ширини, bolts — болти в кутах, emit — увесь світиться, gloss — верх-глянець. */
  const STY = {
    frame: { pal: PAL.MET, q: .58, bev: 1.4, ins: 4.2, neon: '#ff4fd8', nIn: 1.5, nW: 1.1, bolts: 1 },
    pframe: { pal: PAL.PFR, q: .52, bev: 1.6, ins: 5, neon: '#d98aff', nIn: 1.7, nW: 1.2, bolts: 1 },
    base: { pal: PAL.STEEL, q: .56, bev: 1.2, ins: 3 }, dais: { pal: PAL.PFR, q: .5, bev: 1.2, ins: 0 },
    dome: { pal: PAL.MET, q: .72, bev: .8, ins: 0, spec: 1 }, mach: { pal: PAL.MACH, q: .5, bev: 1, ins: 2.6, bolts: 1 },
    term: { pal: PAL.NAVY, q: .55, bev: 1, ins: 2.4 }, tablet: { pal: PAL.NAVY, q: .45, bev: .8, ins: 0 },
    board: { pal: PAL.NAVY, q: .5, bev: 1.4, ins: 4, neon: '#3be8ff', nIn: 1.4, nW: 1, bolts: 1 },
    bench: { pal: PAL.DESK, q: .5, bev: .8, ins: 0, gloss: 1 }, desk: { pal: PAL.DESK, q: .5, bev: 1, ins: 0, gloss: 1 },
    fig: { pal: PAL.MET, q: .55, bev: .6, ins: 0 }, bot: { pal: PAL.BOT, q: .56, bev: .6, ins: 0 },
    item: { pal: PAL.LIL, q: .5, bev: .5, ins: 0 }, stand: { pal: PAL.STEEL, q: .6, bev: .7, ins: 0 },
    gold: { pal: PAL.GOLD, q: .62, bev: .7, ins: 0, metal: 1 }, pot: { pal: PAL.TERRA, q: .55, bev: .4, ins: 0 },
    col: { pal: PAL.STEEL, q: .5, bev: 1.2, ins: 0 }, shelf: { pal: PAL.MET, q: .58, bev: .5, ins: 0 },
    lamp: { pal: PAL.LAMP, q: .62, bev: .4, ins: 0, emit: 1 }, clamp: { pal: PAL.CYANL, q: .58, bev: .4, ins: 0, emit: 1 },
    screen: { pal: PAL.NAVY, q: .38, bev: .8, ins: 0 }, dark: { pal: PAL.DARK, q: .5, bev: .6, ins: 0 },
    neon: { pal: PAL.PFR, q: .46, bev: 1, ins: 0 }, stone: { pal: PAL.STONE, q: .5, bev: 1.6, ins: 0, round: 1 },
    glass: { pal: PAL.GLASS, q: .5, bev: .6, ins: 0, glass: 1 }, chair: { pal: PAL.DESK, q: .5, bev: 1.2, ins: 0 },
  };
  const BAY = NX.art.BAYER, hsh = NX.art.hash;
  /** Матеріал грані: (u, v, i, j, t) -> колір. o: {tex — текстура грані {d, w, h}, pal/q/neon/... — заміна налаштувань стилю,
   *  side — бічна/верхня грань (без канта, тонша фаска), fog — серпанок за глибиною}. */
  function shader(st, F, B, o = {}) {
    const S = Object.assign({}, STY[st] || STY.frame, o), fw = Math.max(.01, F.fw), fh = Math.max(.01, F.fh), m = centre(F), L = lit(F.n, m) * (S.lit || 1);
    const kind = F.k, front = kind === 'front', top = kind === 'top', bottom = kind === 'bottom', side = !front && !top && !bottom, cylS = kind === 'side';
    const Pl = top && S.gloss ? (S.topPal || PAL.TOP) : top && S.topPal ? S.topPal : S.pal;
    const bev = S.bev * (side ? .8 : 1), ins = front ? S.ins : 0, nC = front && S.neon ? neonOf(S.neon) : null, nIn = S.nIn || 1.5, nW = S.nW || 1;
    const tex = o.tex, tw = tex ? tex.w : 0, th = tex ? tex.h : 0, td = tex ? tex.d : null;
    const floorAO = B && B.yb >= FL - 1 && !top, emitAll = !!S.emit, glossTop = top && S.gloss;
    const q0 = S.q * L, bolts = S.bolts && front && fw > 14 && fh > 14, fog = o.fog == null ? 1 : o.fog;
    // циліндр: тон за кутом грані (світліше з боку світла), смуга-обідок (band)
    const cylK = cylS ? (.78 + .3 * Math.max(-.6, Math.cos(F.ang - Math.PI * 1.5 - .5))) : 1;
    const spec = cylS && S.spec ? Math.pow(Math.max(0, Math.cos(F.ang - Math.PI * 1.5 + .55)), 10) * .5 : 0;   // глянцевий блік (купол): вузька світла смуга зліва-спереду
    return (u, v, i, j, t) => {
      const x = u * fw, y = v * fh;
      let q = q0 * cylK + spec + (.5 - v) * (top ? .06 : .14);
      if (glossTop) { X.SH.fl |= X.F_GLOSS; q = .3 + (1 - v) * .3 + (((i + j * 2) % 29) < 2 ? .2 : 0); }      // темне скло зверху: світліше до краю, глянець (віддзеркалення)
      if (!cylS) {
        const e = Math.min(x, fw - x, y, fh - y);
        if (e < bev) q += (y < bev && y <= x && y <= fw - x) || (x < bev && x < y && !front) ? .26 : (y > fh - bev) ? -.2 : (x < bev ? .14 : -.1);
        else if (ins && e > ins && e < ins + .55) q -= .32;                                                    // шов-вставка
        else if (ins && e >= ins + .55) q -= .06;
        if (nC && e >= nIn && e < nIn + nW) { X.SH.fl |= F_EMIT; const c2 = (e - nIn) / nW; return c2 > .3 && c2 < .7 ? nC[2] : nC[1]; }
        if (bolts) { const bx = Math.min(x, fw - x), by = Math.min(y, fh - y); if (Math.abs(bx - (ins ? ins / 2 + .4 : 2.6)) < .55 && Math.abs(by - (ins ? ins / 2 + .4 : 2.6)) < .55) q += .38; }
      } else if (B && B.band && y > fh * .06 && y < fh * .06 + 1.2) { X.SH.fl |= F_EMIT; return y - fh * .06 < .6 ? (NEON[S.bandC || 'cyan'] || NEON.cyan)[2] : (NEON[S.bandC || 'cyan'] || NEON.cyan)[1]; }
      if (floorAO && y > fh - 4) q -= (y - (fh - 4)) / 4 * .22;                                               // біля підлоги темніше
      if (S.glass) q += (u > .12 && u < .2) || (u > .3 && u < .34) ? .35 : 0;                                // скло: блік
      if (S.metal) q += Math.sin(u * 9 + v * 3) * .1;
      let c = ramp(Pl, q, i, j);
      if (emitAll) X.SH.fl |= F_EMIT;
      if (td) {
        const tx = Math.min(tw - 1, Math.max(0, (u * tw) | 0)), ty = Math.min(th - 1, Math.max(0, (v * th) | 0)), px = td[ty * tw + tx], a = px >>> 24;
        if (a) { const pc = (px | 0xff000000) >>> 0; c = a > 250 ? pc : mixc(c, pc, a / 255); if (X.lum(pc) > .5 && a > 140) X.SH.fl |= F_EMIT; }
      }
      if (fog) { const z = D_ * t - D_, hz = z > 40 ? Math.min(.22, (z - 40) / 700) * fog : 0; if (hz > .01 && !(X.SH.fl & F_EMIT)) c = mixc(c, C.haze, hz); }
      return c;
    };
  }
  const D_ = NX.persp.D;

  // ---------- текстури граней (пласке полотно в одиницях грані) ----------
  const cvs = (w, h) => { const cv = document.createElement('canvas'); cv.width = Math.max(1, Math.round(w)); cv.height = Math.max(1, Math.round(h)); const c = cv.getContext('2d', { willReadFrequently: true }); c.imageSmoothingEnabled = false; return [cv, c]; };
  /** Неонова трубка (лінія) в текстурі: ореол, колір, світла серцевина. */
  function neon(c, x0, y0, x1, y1, hex, w = 1) {
    const n = neonOf(hex) || NEON.pink, hx = v => '#' + [v & 255, (v >>> 8) & 255, (v >>> 16) & 255].map(q => q.toString(16).padStart(2, '0')).join('');
    c.lineCap = 'round'; [[w * 2.2, hx(n[0]), .55], [w, hx(n[1]), 1], [w * .38, hx(n[2]), 1]].forEach(([lw, s, a]) => { c.globalAlpha = a; c.strokeStyle = s; c.lineWidth = lw; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); });
    c.globalAlpha = 1;
  }
  /** Неоновий прямокутник (кант). */
  function neonRect(c, x, y, w, h, hex, lw = 1, r = 0) {
    const n = neonOf(hex) || NEON.pink, hx = v => '#' + [v & 255, (v >>> 8) & 255, (v >>> 16) & 255].map(q => q.toString(16).padStart(2, '0')).join('');
    [[lw * 2.2, hx(n[0]), .5], [lw, hx(n[1]), 1], [lw * .38, hx(n[2]), 1]].forEach(([w2, s, a]) => { c.globalAlpha = a; c.strokeStyle = s; c.lineWidth = w2; c.beginPath(); r && c.roundRect ? c.roundRect(x, y, w, h, r) : c.rect(x, y, w, h); c.stroke(); });
    c.globalAlpha = 1;
  }
  /** Голо-екран: темне синє скло з переливом, скан-лініями, світлою рамкою (вміст — окремо). */
  function holo(c, x, y, w, h, o = {}) {
    const g = c.createLinearGradient(x, y, x, y + h); g.addColorStop(0, o.top || '#1d58c8'); g.addColorStop(.55, o.mid || '#0f3496'); g.addColorStop(1, o.bot || '#0a2470');
    c.fillStyle = '#050a26'; c.fillRect(x - .6, y - .6, w + 1.2, h + 1.2); c.fillStyle = g; c.fillRect(x, y, w, h);
    c.fillStyle = 'rgba(150,220,255,.10)'; for (let yy = y + 1; yy < y + h; yy += 1.5) c.fillRect(x, yy, w, .5);
    c.fillStyle = 'rgba(255,255,255,.08)'; c.fillRect(x, y, w, Math.max(.8, h * .07));
    c.strokeStyle = o.line || '#7af4ff'; c.lineWidth = o.lw || .7; c.strokeRect(x + .35, y + .35, w - .7, h - .7);
  }
  /** Іконка 7×7 зі слів «X.» (як у вивісках кімнати). */
  function icon7(c, rows, cx, cy, s, colr) { const p = s / 7; c.fillStyle = colr; rows.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === 'X') c.fillRect(cx - s / 2 + i * p, cy - s / 2 + j * p, p + .03, p + .03); })); }
  /** Текст піксельним шрифтом, вміщений у ширину maxW (по центру cx, cy). */
  function txt(c, s, cx, cy, maxW, hgt, colr, o = {}) {
    let sz = hgt; c.font = `${sz}px "Press Start 2P", monospace`; const w = c.measureText(s).width; if (w > maxW) { sz = sz * maxW / w; c.font = `${sz}px "Press Start 2P", monospace`; }
    c.textAlign = o.align || 'center'; c.textBaseline = 'middle';
    if (o.glow) { c.globalAlpha = .35; c.fillStyle = o.glow; for (const [dx, dy] of [[-.35, 0], [.35, 0], [0, -.35], [0, .35]]) c.fillText(s, cx + dx, cy + dy); c.globalAlpha = 1; }
    c.fillStyle = colr; c.fillText(s, cx, cy + sz * .06); c.textAlign = 'left'; return sz;
  }
  /** Вивіска зони (як NX.kit.sign: темна пластина, неоновий кант кольору зони, кругла іконка, напис NX.t по центру, вогник). */
  function signPlate(c, x, y, w, h, o) {
    const acc = o.acc || '#3be8ff', r = h * .22;
    c.fillStyle = '#0a0620'; c.beginPath(); c.roundRect ? c.roundRect(x, y, w, h, r) : c.rect(x, y, w, h); c.fill();
    neonRect(c, x + h * .07, y + h * .07, w - h * .14, h - h * .14, acc, Math.max(.6, h * .065), r * .8);
    c.strokeStyle = o.inner || '#2a1a5a'; c.lineWidth = Math.max(.3, h * .03); c.beginPath(); c.roundRect ? c.roundRect(x + h * .2, y + h * .2, w - h * .4, h - h * .4, r * .5) : c.rect(x + h * .2, y + h * .2, w - h * .4, h - h * .4); c.stroke();
    let tx0 = x + h * .3;
    if (o.icon) {
      const ix = x + h * .62, iy = y + h / 2, ir = h * .28; c.strokeStyle = acc; c.lineWidth = Math.max(.4, h * .05); c.beginPath(); c.arc(ix, iy, ir, 0, 7); c.stroke();
      c.fillStyle = '#06102e'; c.beginPath(); c.arc(ix, iy, ir - h * .04, 0, 7); c.fill(); icon7(c, NX.kit.ICON[o.icon] || NX.kit.ICON.ai, ix, iy, ir * 1.25, acc); tx0 = x + h * 1.05;
    }
    const tw = x + w - h * .45 - tx0; txt(c, o.text != null ? o.text : NX.t(o.key), tx0 + tw / 2, y + h / 2, tw, h * .4, o.tcol || '#bff8ff', { glow: acc });
    c.fillStyle = '#3bff8a'; c.fillRect(x + w - h * .36, y + h / 2 - h * .07, h * .14, h * .14);
  }

  /** Оздоби розкладки (deco) у пласке полотно грані fw × fh (одиниці грані): r — прямокутник (синій — голо-екран),
   *  ch — зі зрізаними кутами, c — коло, l — лінія (неон, якщо колір неоновий), bars — стовпчики, grid — плитки з іконками,
   *  txt — напис (key -> NX.t), arch — арка (з вихором), p — многокутник. */
  const isScreen = h => /^#(0a1a5a|0c3a7a|0c2a5a|0a2a7a|0e2a6a|1a5ab0|1a6ab0|0c4a8a|14306a|0a1440|0c3a7a|071a5a)$/i.test(h || '');
  function decos(c, list, fw, fh, t = 0) {
    const asp = fw / Math.max(1, fh), X0 = u => u * fw, Y0 = v => v * fh;
    for (const d of list || []) {
      const f = d.f;
      switch (d.t) {
        case 'r': {
          const x = X0(f[0]), y = Y0(f[2]), w = X0(f[1]) - x, h = Y0(f[3]) - y;
          if (isScreen(d.fill)) holo(c, x, y, w, h, { line: d.line || '#7af4ff', lw: (d.lw || .7) * .8 });
          else { if (d.fill) { c.fillStyle = d.fill; c.fillRect(x, y, w, h); } if (d.line) { if (/ff4fd8|3be8ff|7af4ff|ff7af0|d98aff/i.test(d.line) && !d.fill) neonRect(c, x, y, w, h, d.line, (d.lw || .8) * .8); else { c.strokeStyle = d.line; c.lineWidth = (d.lw || .7) * .7; c.strokeRect(x + .2, y + .2, w - .4, h - .4); } } }
          break;
        }
        case 'ch': { const x = X0(f[0]), y = Y0(f[2]), w = X0(f[1]) - x, h = Y0(f[3]) - y, k = (d.k || .15) * w;
          c.beginPath(); c.moveTo(x, y + h); c.lineTo(x + w, y + h); c.lineTo(x + w, y + k); c.lineTo(x + w - k, y); c.lineTo(x + k, y); c.lineTo(x, y + k); c.closePath();
          if (d.fill) { const g = c.createLinearGradient(x, y, x, y + h); g.addColorStop(0, d.fill); g.addColorStop(1, '#3a0a4a'); c.fillStyle = g; c.fill(); }
          if (d.line) { c.strokeStyle = d.line; c.lineWidth = (d.lw || .8) * .8; c.stroke(); } break; }
        case 'c': { const cx = X0(f[0]), cy = Y0(f[1]), rr = f[2] * fw; c.beginPath(); c.ellipse(cx, cy, rr, rr * (d.ky || 1), 0, 0, 7);
          if (d.fill) { c.fillStyle = d.fill; c.fill(); } if (d.line) { c.strokeStyle = d.line; c.lineWidth = (d.lw || .7) * .75; c.stroke(); } break; }
        case 'l': { const x0 = X0(f[0]), y0 = Y0(f[1]), x1 = X0(f[2]), y1 = Y0(f[3]);
          if (/^#(ff4fd8|3be8ff|ff9af0|c86aff|d98aff|ff9a3a|7af4ff)$/i.test(d.col)) neon(c, x0, y0, x1, y1, d.col, (d.lw || 1) * .85);
          else { c.strokeStyle = d.col; c.lineWidth = (d.lw || .8) * .7; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); } break; }
        case 'p': { c.beginPath(); d.pts.forEach(([u, v], k) => k ? c.lineTo(X0(u), Y0(v)) : c.moveTo(X0(u), Y0(v))); c.closePath(); if (d.fill) { c.fillStyle = d.fill; c.fill(); } if (d.line) { c.strokeStyle = d.line; c.lineWidth = (d.lw || .7) * .7; c.stroke(); } break; }
        case 'bars': { const x0 = X0(f[0]), x1 = X0(f[1]), y0 = Y0(f[2]), y1 = Y0(f[3]), n = d.n || 6, cw = (x1 - x0) / n;
          for (let i = 0; i < n; i++) { const h = (.25 + .75 * Math.abs(Math.sin(i * 1.9 + 1.3))) * (y1 - y0), bx = x0 + i * cw + cw * .16, bw = cw * .68;
            const g = c.createLinearGradient(0, y1 - h, 0, y1); g.addColorStop(0, '#d8fcff'); g.addColorStop(.25, d.fill || '#7af4ff'); g.addColorStop(1, '#1a6ad0'); c.fillStyle = g; c.fillRect(bx, y1 - h, bw, h); }
          break; }
        case 'grid': { const x0 = X0(f[0]), x1 = X0(f[1]), y0 = Y0(f[2]), y1 = Y0(f[3]), nx = d.nx, ny = d.ny, g = d.gap || .04, cw = (x1 - x0) / nx, chh = (y1 - y0) / ny;
          for (let jy = 0; jy < ny; jy++) for (let ix = 0; ix < nx; ix++) {
            const x = x0 + ix * cw + g * cw, y = y0 + jy * chh + g * chh, w = cw * (1 - 2 * g), h = chh * (1 - 2 * g);
            if (isScreen(d.fill)) holo(c, x, y, w, h, { line: d.line || '#7af4ff', lw: .5 }); else { c.fillStyle = d.fill || '#0e2a6a'; c.fillRect(x, y, w, h); c.strokeStyle = d.line || '#7af4ff'; c.lineWidth = .5; c.strokeRect(x + .2, y + .2, w - .4, h - .4); }
            if (d.icon) { c.strokeStyle = d.icon; c.lineWidth = .6; c.beginPath(); c.arc(x + w / 2, y + h / 2, Math.min(w, h) * .26, 0, 7); c.stroke(); }
          }
          break; }
        case 'txt': { const x0 = X0(f[0]), x1 = X0(f[1]), y0 = Y0(f[2]), y1 = Y0(f[3]), s = d.key ? NX.t(d.key) : d.s; txt(c, s, (x0 + x1) / 2, (y0 + y1) / 2, x1 - x0, (y1 - y0) * .8, d.col || '#bff8ff', { glow: '#3be8ff' }); break; }
        case 'arch': { const x0 = X0(f[0]), x1 = X0(f[1]), y0 = Y0(f[2]), y1 = Y0(f[3]), sp = Y0(d.spring), cx = (x0 + x1) / 2, rx = (x1 - x0) / 2;
          c.beginPath(); c.moveTo(x0, y1); c.lineTo(x0, sp); c.ellipse(cx, sp, rx, sp - y0, 0, Math.PI, 0); c.lineTo(x1, y1); c.closePath(); c.fillStyle = d.fill || '#2a0f6a'; c.fill();
          if (d.line) neonRectPath(c, x0, y0, x1, y1, sp, d.line); break; }
      }
    }
  }
  function neonRectPath(c, x0, y0, x1, y1, sp, hex) {
    const n = neonOf(hex), hx = v => '#' + [v & 255, (v >>> 8) & 255, (v >>> 16) & 255].map(q => q.toString(16).padStart(2, '0')).join(''), cx = (x0 + x1) / 2, rx = (x1 - x0) / 2;
    [[2.2, hx(n[0]), .55], [1, hx(n[1]), 1], [.38, hx(n[2]), 1]].forEach(([lw, s, a]) => { c.globalAlpha = a; c.strokeStyle = s; c.lineWidth = lw; c.beginPath(); c.moveTo(x0, y1); c.lineTo(x0, sp); c.ellipse(cx, sp, rx, sp - y0, 0, Math.PI, 0); c.lineTo(x1, y1); c.stroke(); });
    c.globalAlpha = 1;
  }
  /** Текстура грані F предмета B: TS текселів на одиницю грані; paint(c, fw, fh, B, F) — власний малюнок (інакше — deco).
   *  Повертає {d, w, h} (Uint32, як ImageData) або null. */
  function texture(B, F, TS, paint) {
    const fw = F.fw, fh = F.fh; if (!paint && !(F.k === 'front' && B.deco && B.deco.length)) return null;
    const [cv, c] = cvs(fw * TS, fh * TS); c.scale(TS, TS); c.imageSmoothingEnabled = true;
    if (paint) paint(c, fw, fh, B, F); else decos(c, B.deco, fw, fh);
    const im = c.getImageData(0, 0, cv.width, cv.height); return { d: new Uint32Array(im.data.buffer), w: cv.width, h: cv.height, cv };
  }
  return { PAL, C, NEON, neonOf, basis, faces, visible, centre, lit, STY, shader, texture, decos, neon, neonRect, holo, icon7, txt, signPlate, cvs, isScreen };
})();
