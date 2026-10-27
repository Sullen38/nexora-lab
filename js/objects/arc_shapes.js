/* ============================================================================
 * objects/arc_shapes.js — ФОРМИ ДРІБНИХ РЕЧЕЙ КРИЛ «ПО ДУЗІ» (NX.arc.shape)
 * ----------------------------------------------------------------------------
 * Деякі предмети розкладки — не коробки: лампи, ліхтарі, крісла, чайник-лампа, кристали, боти. Тут вони
 * збираються з частин у 3D (циліндри, зрізані конуси, трубки, диски) у межах свого прямокутника з розкладки.
 *   NX.arc.shape[id | 'st:стиль'] = (G, B) => {...}
 *     G.part(P, st, o)        — частина-об'єм (коробка / циліндр / конус; kt, kb — масштаб верхнього / нижнього кола)
 *     G.partF(P, mk)          — частина з власним матеріалом: mk(F, P) -> shade(u, v, i, j, t)
 *     G.tube(a, b, w, shade) / G.disc(c, r, shade) — трубка / диск лицем до глядача (точки світу)
 *     G.sub(u, v, w, d, yt, yb, extra) — частина з центром у точці (u — від середини лиця, v — углиб) предмета B
 *     G.P(u, v, y)            — точка світу в координатах предмета B
 * Світло ламп і неон позначаються «світиться» (X.F_EMIT) — їх підхоплює сяйво (bloom) і віддзеркалення в підлозі.
 * ========================================================================== */
NX.arc = NX.arc || {};
(() => {
  const X = NX.px3d, A = NX.arc.kit, { col, pal, ramp, mixc } = X, PL = A.PAL, hash = NX.art.hash;
  const SH = NX.arc.shape = {};
  const E = c => { X.SH.fl |= X.F_EMIT; return c; };
  const WARM = pal(['#7a3a0a', '#c0601a', '#f0902a', '#ffb44a', '#ffd27a', '#ffeab0', '#fff8e8']);
  const RED = pal(['#3a0606', '#6a0a0a', '#9a1414', '#c82020', '#ee3a2a', '#ff6a4a', '#ffa080', '#ffd0b0']);
  const PINKG = pal(['#4a0a40', '#7a1468', '#b02896', '#e04ac0', '#ff7ad8', '#ffb0ea', '#ffe4f8']);
  const TEAL = pal(['#062a2e', '#0a3e44', '#10565c', '#18727a', '#24909a', '#38b0b8']);
  const CYG = pal(['#0a3a5a', '#0f5a80', '#1a8ab0', '#2ab8e0', '#3be8ff', '#9af6ff', '#eaffff']);
  /** Матеріал «скло, що світиться» (лампочка, абажур зсередини): тон за відстанню від центру + відблиск. */
  const glowGlass = (P2, core = .9) => (u, v, i, j) => { const d = Math.hypot(u - .5, v - .5) * 2; return E(ramp(P2, core - d * .55 + (u < .32 && v < .35 ? .2 : 0), i, j)); };
  const chromeTube = (u, v, i, j) => ramp(PL.CHROME, .25 + (1 - Math.abs(u - .38) * 2.2) * .65, i, j);
  const brassTube = (u, v, i, j) => ramp(PL.GOLD, .3 + (1 - Math.abs(u - .38) * 2.2) * .6, i, j);

  // ---------- ЛАМПИ ----------
  /** Настільна лампа: кругла основа, ніжка-трубка, абажур (зрізаний конус) і лампочка під ним. */
  function deskLamp(G, B, o = {}) {
    const w = B.w, d = B.dep, H = B.yb - B.yt, sh = Math.min(H * .42, w * 1.1), sx = (o.dx || .1) * w, shadeC = o.shade || TEAL;
    G.part(G.sub(0, d / 2, w * .62, d * .62, B.yb - Math.max(1.4, H * .06), B.yb, { cyl: 16, kt: .82 }), 'stand', { q: .55 });
    G.tube(G.P(0, d / 2, B.yb - 1.2), G.P(sx * .5, d / 2, B.yt + sh * .7), Math.max(.9, w * .07), chromeTube);
    G.tube(G.P(sx * .5, d / 2, B.yt + sh * .7), G.P(sx, d / 2, B.yt + sh), Math.max(.8, w * .06), chromeTube);
    const S = G.sub(sx, d / 2, w * .98, d * .98, B.yt, B.yt + sh, { cyl: 20, kt: .5, kb: 1 });
    G.partF(S, F => F.k === 'top' ? (u, v, i, j) => ramp(shadeC, .55, i, j) : F.k === 'bottom' ? glowGlass(WARM, 1) : (u, v, i, j) => { const yv = v; if (yv > .86) return E(ramp(WARM, .8, i, j)); return ramp(shadeC, .3 + (1 - yv) * .25 + .25 * Math.max(0, Math.cos(F.ang - 4.2)), i, j); });
    G.disc(G.P(sx, d / 2, B.yt + sh + Math.max(.6, w * .08)), Math.max(.9, w * .16), glowGlass(WARM, 1));
  }
  /** Лампа Едісона: латунний патрон і скляна колба з розжареною ниткою. */
  function edison(G, B, o = {}) {
    const w = B.w, d = B.dep, H = B.yb - B.yt, cap = Math.min(H * .26, w * .5), r = Math.min(w * .42, (H - cap) * .45);
    G.part(G.sub(0, d / 2, w * .34, Math.min(d, w * .34), B.yt, B.yt + cap, { cyl: 14 }), 'gold', { q: .52 });
    const c = G.P(0, d / 2, B.yt + cap + r * .95);
    G.disc(c, r, (u, v, i, j) => {
      const dx = u - .5, dy = v - .5, dd = Math.hypot(dx, dy) * 2, fil = Math.abs(dy + .05) < .16 && Math.abs(dx - Math.sin(dy * 40) * .06) < .045;
      if (fil) return E(col('#fff6d8'));
      if (dd > .86) return E(ramp(WARM, .55, i, j));
      return E(ramp(WARM, .92 - dd * .5 + (dx < -.2 && dy < -.15 ? .2 : 0), i, j));
    });
  }
  /** Настінний / підлоговий ліхтар: темна рама зі склом, що світиться, кришка й основа. */
  function lantern(G, B, o = {}) {
    const w = B.w, d = B.dep, H = B.yb - B.yt, P2 = o.glow || WARM, metal = o.metal || 'dark';
    G.part(G.sub(0, d / 2, w, d, B.yt, B.yt + H * .12, { cyl: o.cyl ? 14 : 0, kt: .6 }), metal, { q: .55 });
    G.part(G.sub(0, d / 2, w, d, B.yb - H * .1, B.yb, { cyl: o.cyl ? 14 : 0, kb: .8 }), metal, { q: .5 });
    const body = G.sub(0, d / 2, w * .86, d * .86, B.yt + H * .12, B.yb - H * .1, { cyl: o.cyl ? 14 : 0 });
    G.partF(body, F => (u, v, i, j) => {
      if (F.k === 'top' || F.k === 'bottom') return ramp(PL.STEEL, .4, i, j);
      const bar = o.cyl ? ((F.i || 0) % 3 === 0) : (u < .1 || u > .9);
      if (bar || v < .05 || v > .95) return ramp(o.metal === 'gold' ? PL.GOLD : PL.STEEL, .5 + (1 - v) * .2, i, j);
      return E(ramp(P2, .95 - Math.abs(u - .5) * .5 - Math.abs(v - .55) * .4, i, j));
    });
    if (o.ring) G.tube(G.P(0, d / 2, B.yt), G.P(0, d / 2, B.yt - 3), .8, brassTube);
  }
  /** Китайський ліхтар: червона «куля» з ребер, золоті кришки, китиця. */
  function chinese(G, B) {
    const w = B.w, d = B.dep, H = B.yb - B.yt, segs = [[0, .18, .62, .9], [.18, .5, .9, 1], [.5, .82, 1, .9], [.82, 1, .9, .62]];
    segs.forEach(([a, b, kt, kb]) => G.partF(G.sub(0, d / 2, w, d, B.yt + H * a, B.yt + H * b, { cyl: 18, kt, kb }), F => (u, v, i, j) => {
      if (F.k !== 'side') return E(ramp(RED, .6, i, j));
      const rib = (F.i % 3) === 0; return E(ramp(RED, (rib ? .35 : .7) + .25 * Math.max(0, Math.cos(F.ang - 4.4)) - Math.abs(v - .5) * .2, i, j));
    }));
    G.part(G.sub(0, d / 2, w * .5, d * .5, B.yt - 2.4, B.yt + .4, { cyl: 14 }), 'gold', { q: .6 });
    G.part(G.sub(0, d / 2, w * .5, d * .5, B.yb - .4, B.yb + 2.4, { cyl: 14 }), 'gold', { q: .6 });
    G.tube(G.P(0, d / 2, B.yb + 2.4), G.P(0, d / 2, B.yb + 11), 1.6, (u, v, i, j) => ramp(RED, .45 + (1 - Math.abs(u - .5) * 2) * .4 - v * .2, i, j));
  }
  /** Чайник-лампа (рожевий, світиться): тулуб, кришка з ґудзиком, носик і ручка. */
  function teapot(G, B) {
    const w = B.w, d = B.dep, H = B.yb - B.yt, bw = w * .6;
    G.partF(G.sub(0, d / 2, bw, d, B.yt + H * .3, B.yb, { cyl: 18, kt: .82, kb: .78 }), F => (u, v, i, j) => E(ramp(PINKG, .5 + .3 * Math.max(0, Math.cos((F.ang || 0) - 4.3)) - v * .15, i, j)));
    G.partF(G.sub(0, d / 2, bw * .62, d * .62, B.yt + H * .16, B.yt + H * .3, { cyl: 14, kt: .7 }), F => (u, v, i, j) => E(ramp(PINKG, .72, i, j)));
    G.disc(G.P(0, d / 2, B.yt + H * .1), Math.max(.8, w * .06), (u, v, i, j) => E(col('#ffe4f8')));
    G.tube(G.P(-bw * .45, d * .3, B.yt + H * .62), G.P(-w * .5, d * .3, B.yt + H * .34), Math.max(1, w * .09), (u, v, i, j) => E(ramp(PINKG, .6, i, j)));
    G.tube(G.P(bw * .45, d * .3, B.yt + H * .42), G.P(w * .5, d * .3, B.yt + H * .55), Math.max(.9, w * .07), (u, v, i, j) => E(ramp(PINKG, .45, i, j)));
    G.tube(G.P(w * .5, d * .3, B.yt + H * .55), G.P(bw * .45, d * .3, B.yt + H * .8), Math.max(.9, w * .07), (u, v, i, j) => E(ramp(PINKG, .45, i, j)));
  }
  SH.mk_bulb = edison; SH.mk_lampR = (G, B) => deskLamp(G, B, { shade: TEAL, dx: .14 });
  SH.ai_lampS = (G, B) => deskLamp(G, B, { shade: pal(['#2a0a2a', '#4a1448', '#6a1c66', '#8a2a86', '#aa3aa6']), dx: .1 });
  SH.ai_lampO = (G, B) => edison(G, B); SH.wsi1_1 = (G, B) => deskLamp(G, B, { shade: pal(['#3a2008', '#5a3010', '#7a4418', '#9a5a22', '#ba742e']) });
  SH.tl_lanL = (G, B) => lantern(G, B); SH.mz_lampL = (G, B) => lantern(G, B, { cyl: 1 });
  SH.mz_lantern = (G, B) => lantern(G, B, { cyl: 1, metal: 'gold', ring: 1 });
  SH.tl_lanF = (G, B) => lantern(G, B, { cyl: 1, glow: CYG });
  SH.sh_tea = teapot;
  SH['st:lamp'] = (G, B) => (B.yb - B.yt) > B.w * 1.6 ? deskLamp(G, B) : edison(G, B);
  SH.hangRed = chinese; SH.hangLamp = edison; SH.hangGold = (G, B) => lantern(G, B, { cyl: 1, metal: 'gold', ring: 1 });

  // ---------- КРІСЛА (геймерські) ----------
  /** Спинка: заокруглений верх, стьобка ромбами, бокові валики з LED, значок N, подушка-підголівник. */
  function chairBack(G, B) {
    const w = B.w, H = B.yb - B.yt, ch = w * .22;
    G.partF(Object.assign({}, B, { ch: [ch, ch] }), F => {
      if (F.k !== 'front' && F.k !== 'back') return (u, v, i, j) => ramp(PL.DESK, .42 + (F.k === 'top' || F.k.startsWith('ch') ? .12 : 0), i, j);
      return (u, v, i, j) => {
        const x = u * w, y = v * H, side = x < w * .16 || x > w * .84;
        if (Math.abs(x - w * .16) < .55 || Math.abs(x - w * .84) < .55) return E(A.NEON.pink[1]);                       // LED-смужки по валиках
        if (side) return ramp(PL.DESK, .5 + (x < w * .16 ? .1 : -.05) - v * .15, i, j);
        if (Math.abs(x - w / 2) < w * .1 && Math.abs(y - H * .3) < w * .1) return ((x - w / 2) ** 2 + (y - H * .3) ** 2 < (w * .07) ** 2) ? E(col('#3be8ff')) : ramp(PL.DESK, .7, i, j);   // значок
        if (y < H * .14) return ramp(PL.DESK, .62 - Math.abs(x - w / 2) / w * .3, i, j);                                  // подушка
        const sx = (x + y) % 7, sy = (x - y + 700) % 7; return ramp(PL.DESK, (sx < .6 || sy < .6) ? .28 : .48 - v * .12, i, j);   // стьобка
      };
    });
  }
  function chairSeat(G, B) {
    G.partF(B, F => (u, v, i, j) => {
      if (F.k === 'top') { const x = u * B.w, y = v * B.dep; return ramp(PL.DESK, ((x + y) % 7 < .6) ? .3 : .55 - v * .1, i, j); }
      if (F.k === 'front' && v > .7) return E(A.NEON.pink[1]);
      return ramp(PL.DESK, .4 + (F.k === 'front' ? .08 : 0), i, j);
    });
  }
  /** Основа: газліфт, хрестовина з п'яти променів, коліщатка. */
  function chairBase(G, B) {
    const c = G.P(0, B.dep / 2, B.yt), b = G.P(0, B.dep / 2, B.yb - 3);
    G.tube(c, b, Math.max(2, B.w * .35), chromeTube);
    for (let k = 0; k < 5; k++) {
      const a = k / 5 * Math.PI * 2 + .3, L = B.w * 1.6, e = G.P(Math.cos(a) * L, B.dep / 2 + Math.sin(a) * L * .6, B.yb - 1.5);
      G.tube(b, e, 1.6, (u, v, i, j) => ramp(PL.STEEL, .35 + (1 - Math.abs(u - .4) * 2) * .4, i, j));
      G.disc([e[0], e[1] + .6, e[2]], 1.5, (u, v, i, j) => ramp(PL.DARK, .5 + (v < .4 ? .3 : 0), i, j));
    }
  }
  SH.mk_chairB = chairBack; SH.an_chairB = chairBack; SH.mk_seat = chairSeat; SH.an_seat = chairSeat; SH.mk_chairBase = chairBase; SH.an_chairBase = chairBase;

  // ---------- КРИСТАЛИ, БОТИ ----------
  /** Кристали порталу: гранене скло, що світиться зсередини, з блискучими ребрами. */
  function crystal(G, B) {
    const VIO = pal(['#1a0a4a', '#2a1478', '#3a22a8', '#5a3ad8', '#8a6af0', '#b49af8', '#e0d4ff', '#ffffff']);
    G.partF(B, F => (u, v, i, j) => {
      const edge = u < .07 || u > .93 || v < .05; if (edge) return E(ramp(VIO, .95, i, j));
      const facet = Math.abs(u - .5 + (v - .5) * .3) < .04; return E(ramp(VIO, (facet ? .85 : .42 + (1 - v) * .3) + (F.k === 'front' ? .05 : -.1), i, j));
    });
  }
  SH.pt_crys1 = crystal; SH.pt_crys2 = crystal;
  /** Голови ботів: + антена з вогником. */
  const botHead = (G, B) => { G.part(B, 'bot', {}); const top = G.P(0, B.dep / 2, B.yt); G.tube(top, [top[0], top[1] - Math.max(3, (B.yb - B.yt) * .5), top[2]], .7, chromeTube); G.disc([top[0], top[1] - Math.max(3, (B.yb - B.yt) * .5) - .8, top[2]], 1.1, () => E(col('#ff4fd8'))); };
  ['ws_head0', 'ws_head1', 'ws_head2', 'tl_botH', 'mz_botH0', 'mz_botH1', 'mz_botH2'].forEach(id => { SH[id] = botHead; });
  /** Золотий кубок (антресоль): основа, ніжка, чаша з ручками. */
  function trophy(G, B) {
    const w = B.w, d = B.dep, H = B.yb - B.yt;
    G.part(G.sub(0, d / 2, w * .7, d * .7, B.yb - H * .16, B.yb, { cyl: 14, kt: .8 }), 'gold', { q: .5 });
    G.tube(G.P(0, d / 2, B.yb - H * .16), G.P(0, d / 2, B.yt + H * .55), Math.max(1.2, w * .12), brassTube);
    G.part(G.sub(0, d / 2, w * .9, d * .9, B.yt, B.yt + H * .55, { cyl: 18, kt: 1, kb: .45 }), 'gold', { q: .66 });
    G.tube(G.P(-w * .42, d / 2, B.yt + H * .12), G.P(-w * .55, d / 2, B.yt + H * .36), 1, brassTube); G.tube(G.P(w * .42, d / 2, B.yt + H * .12), G.P(w * .55, d / 2, B.yt + H * .36), 1, brassTube);
  }
  SH.mz_gold1 = trophy; SH.mz_gold2 = trophy;
})();
