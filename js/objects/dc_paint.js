/* ============================================================================
 * objects/dc_paint.js — ДЕКОР СТІН: ФОРМИ Й МАЛЮНКИ ГРАНЕЙ (Декор стін · 2)
 * ----------------------------------------------------------------------------
 * Розкладка — tools/wingbox/decor.py (предмети шару 'up', id dc_*; рушій js/objects/arc_scene.js малює їх у шарі «біля
 * стіни» — нерухоме, у растрі крила: fps не страждає). Тут — як вони виглядають: форми NX.arc.shape['st:dc_*'] (набір G:
 * part / partF / tube / disc / face — точки світу) і малюнки лиць NX.arc.paint[id]; рослини — dc_plants.js; живе (риби,
 * медузи, бульбашки, світіння) — objects/decor.js.
 * Власник (02.11): «щоб нічого не повторювалось — усе унікальне; три великі акваріуми з рибами; другий поверх масивніший,
 * більший і пропрацьований; полички й акваріуми — круто, кіберпанк-піксель; нічого нічому не заважає».
 *   dc_mz      — АНТРЕСОЛЬ (сегмент дуги 2°): товста плита — фасад шарами (хромова кромка, рожевий неон, панелі з ґратками,
 *                вогниками, перфорацією й заклепками, неонова емблема-паросток посередині, блакитна LED-смуга, ламелі,
 *                помаранчеве підсвічування), спід з балками, кабель-каналом, мідною трубою й точковими світильниками,
 *                скляне поруччя (відблиски, фрит-смуга) з хромованими стійками й неоновими ковпачками, ферми-консолі
 *   dc_pot     — вазон за дизайном (форма × матеріал × неоновий обідок: taper / bowl / tall / cube / orb / net — кожен один
 *                раз) і рослина-спрайт над ним; dc_hang — макраме на кронштейні або ліана з краю антресолі
 *   dc_hex     — СОТИ-ПОЛИЦІ: шестигранні комірки, у кожної свій неон по кромці й свій візерунок задньої стінки
 *   dc_reef    — РИФ (акваріум №1): кришка з «місячною» LED-лінійкою, тумба з дверцятами й неоном, хромові стійки; скло —
 *                вікна dc_rfg* (панорама рифу — малюнок; риби — живі)
 *   dc_column  — МЕДУЗАРІЙ (№2): цоколь і корона з неоновими кільцями, хромові стійки й обручі, труба в стелю; скло — dc_jellyg
 *   dc_shark   — АКВАРІУМ ХИЖАКІВ (№3, · 10): «контейнер утримання» на всю стіну за маніпулятором — модулі з темно-хромовою
 *                рамою, аварійні смуги, червоні неонові кромки, прожектори на кришці, табло «НЕБЕЗПЕЧНО» (NX.t); скло — dc_shg*
 *   dc_lantern — золотий ліхтар; dc_art — штучки ботаніка (книжки, кришталева
 *                куля, тераріум, колба з паростком, мікроскоп, міні-оранжерея з орхідеєю, золота статуетка Nexi)
 *   dc_poster0 / dc_neon — плакат (напис — NX.t, 4 мови) і неонова вивіска (без слів)
 *   (Декор стін · 4) dc_pylon — ПІЛОН другого поверху (торцева стіна від стелі: рама дверей з неоном і табличкою, рама колби,
 *                вентиляційна ґратка, кодовий замок, «обережно»; вікна dc_door / dc_pyg); dc_poster1 — синтвейв-плакат Рудика
 *                (Рудик, віруси й лазер — живі, objects/decor_live.js); кріплення висячих — скляна куля, мідний конус, керамічна
 *                півкуля, неонове кільце; живі частини рослин (dc.sway) у растр не йдуть — NX.arc.dcLive (plantFace, lv)
 * Скло — «дірки» (піксель не пишеться: видно те, що за ним) з відблисками й рамками; неон — світиться (сяйво злиття).
 * ========================================================================== */
NX.arc = NX.arc || {};
(() => {
  const X = NX.px3d, A = NX.arc.kit, PL = A.PAL, PAINT = NX.arc.paint, hash = NX.art.hash, PZ = NX.persp;
  const { col, pal, ramp, mixc, dim, sub, rgb } = X;
  const SHP = NX.arc.shape = NX.arc.shape || {};
  const E = c => { X.SH.fl |= X.F_EMIT; return c; };
  const N = A.NEON, D2R = Math.PI / 180;
  const lit = (n, p) => A.lit(n, p);
  const tubeT = (P, q0 = .25, k = .62) => (u, v, i, j) => ramp(P, q0 + (1 - Math.abs(u - .38) * 2.2) * k, i, j);
  const chromeT = tubeT(PL.CHROME), steelT = tubeT(PL.MET, .2, .55), brassT = tubeT(PL.GOLD, .3, .6), darkT = tubeT(PL.STEEL, .22, .5);
  const add3 = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
  const Ywz = (y, z) => PZ.VP[1] + (y - PZ.VP[1]) * (PZ.D + z) / PZ.D;                 // висота світу, що на екрані в рядку y (глибина z)
  /** Грань-чотирикутник p0..p3 (паралелограм): параметризація від p0; n — зовнішня нормаль. */
  const quad = (G, p, sh, n) => G.face(p, p[0], sub(p[1], p[0]), sub(p[3], p[0]), sh, n);
  const BAY = NX.art.BAYER, SHADOW = col('#030109');
  /** ТІНЬ дизерингом (у стилі кімнати): грань p0-p1 / p0-p3 (паралелограм), dens(u, v) 0..1 — густота; піксель тіні темний і
   *  без контуру (F_NOOUT), між ними — дірки (видно стіну). Лягає на стіну (за речами). */
  const ditherFace = (G, p0, p1, p3, n, dens) => G.face([p0, p1, add3(p1, sub(p3, p0)), p3], p0, sub(p1, p0), sub(p3, p0), (u, v, i, j) => {
    const a = dens(u, v); if (a <= BAY[(j & 3) * 4 + (i & 3)] + .5) return 0; X.SH.fl |= X.F_NOOUT; return SHADOW; }, n);
  /** Ширина «лицем до глядача» (рослина-спрайт), що на екрані дорівнює ширині предмета B на глибині v (коси стіни — вужча). */
  const bbW = (G, B, v) => { const y = (B.yt + B.yb) / 2, a = X.proj(G.P(-B.w / 2, v, y)), b = X.proj(G.P(B.w / 2, v, y)), z = G.P(0, v, y)[2]; return Math.abs(b[0] - a[0]) * (PZ.D + z) / PZ.D; };
  /** Неон довільного кольору -> [ореол, колір, серцевина]. */
  const NXC = {};
  const neonX = h => NXC[h] || (NXC[h] = (() => { const n = parseInt(h.slice(1, 7), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    return [rgb(r * .36, g * .36, b * .36), col(h), rgb(r + (255 - r) * .72, g + (255 - g) * .72, b + (255 - b) * .72)]; })());

  // ---------- МАТЕРІАЛИ ВАЗОНІВ (кожен дизайн — один раз: decor.py POTS) ----------
  const MAT = {
    terra: PL.TERRA, navy: PL.NAVY, ceram: PL.CERAM, dark: PL.DARK, chrome: PL.CHROME, gold: PL.GOLD, pink: PL.PINKP, stone: PL.STONE,
    jade: pal(['#04201a', '#083226', '#0e4834', '#166044', '#207a56', '#30966a', '#4cb484', '#7ad4a6', '#b4f0d0']),
    copper: pal(['#2a1006', '#48200c', '#6c3414', '#924a1e', '#b8642a', '#d8843e', '#f0a862', '#ffd09a']),
    concrete: pal(['#16161e', '#20202c', '#2c2c3a', '#3a3a4a', '#4a4a5c', '#5e5e72', '#76768a', '#9494a8']),
    enamel: pal(['#040c30', '#08164e', '#0e226e', '#16328e', '#2046ae', '#2e5ecc', '#4a80e6', '#86b0fa']),
    wicker: pal(['#2a1a0a', '#4a2e12', '#6a4420', '#8a5e2e', '#aa7a3e', '#c89852', '#e4b86e', '#f4d494']),
    moss: pal(['#082008', '#0e3210', '#164a18', '#206222', '#2c7c2c', '#3c9636', '#56b048', '#7ccc62']),
    steel: PL.MET,
  };
  const STRING = { pink: col('#ff6ab8'), gold: col('#e8b040'), cyan: col('#40c8e8') };
  const PATINA = col('#3ac8a0');
  /** Поверхня матеріалу поверх матеріалу рушія: цятки каменю, патина міді, жилки нефриту, опалубка бетону, глянець емалі. */
  function surf(mat, sh, Fc) {
    const gl = Fc.k === 'side' ? Math.pow(Math.max(0, Math.cos(Fc.ang - Math.PI * 1.5 + .6)), 12) : 0, glossy = mat === 'enamel' || mat === 'pink' || mat === 'ceram' || mat === 'jade' || mat === 'chrome';
    return (u, v, i, j, t) => {
      let c = sh(u, v, i, j, t); if (X.SH.fl & X.F_EMIT) return c;
      if (mat === 'stone') { const h = hash(i >> 1, j >> 1); if (h > .9) c = dim(c, 1.4); else if (h < .08) c = dim(c, .7); }
      else if (mat === 'copper') { if (hash(i >> 1, (j >> 1) + 7) > .83 && v > .25) c = mixc(c, PATINA, .7); }
      else if (mat === 'jade') { if (Math.abs(Math.sin(u * 7 + v * 9 + Math.sin(v * 13 + i * .05) * 2)) < .14) c = dim(c, 1.28); }
      else if (mat === 'concrete') { if (hash(i, j) > .92) c = dim(c, .74); if ((v * 6) % 1 < .07) c = dim(c, .84); }
      if (glossy && gl > .55) c = mixc(c, col('#ffffff'), .35);
      return c;
    };
  }
  /** ВАЗОН за дизайном Pd (shape, mat, band, pw, ph): середина дна — точка (0, v, yb) у рамці предмета B. */
  function potDraw(G, B, v, Pd, yb) {
    const pw = Pd.pw || 6, ph = Pd.ph || 4, mat = Pd.mat || 'terra', Pm = MAT[mat] || PL.TERRA, band = Pd.band, shp = Pd.shape || 'taper', p = G.P(0, v, yb);
    const nb = band ? (N[band] || neonX(band)) : null;
    const cyl = (w, y0, y1, o = {}) => Object.assign({ x: p[0], z: p[2] - w / 2, turn: 0, w, dep: w, yt: y0, yb: y1, cyl: 16 }, o);
    const draw = (Pi, q = .56, o = {}) => G.partF(Pi, Fc => {
      if ((o.noTop && Fc.k === 'top') || (o.noBot && Fc.k === 'bottom')) return null;
      const f = surf(mat, A.shader('pot', Fc, Pi, { pal: Pm, q, bandC: band || 'cyan' }), Fc);
      if (o.neonAll) return () => E(nb ? nb[1] : N.cyan[1]);
      if (o.boxBand && nb && Fc.k !== 'top' && Fc.k !== 'bottom') return (u, vv, i, j, t) => { const y = vv * Fc.fh; return y > .7 && y < 1.5 ? E(y > .95 && y < 1.25 ? nb[2] : nb[1]) : f(u, vv, i, j, t); };
      if (o.net) return (u, vv, i, j, t) => { const x = (Fc.ui + u * Fc.un) * Math.PI * pw, y = vv * Fc.fh; return (((x / .62) | 0) + ((y / .62) | 0)) % 2 && y > .4 ? 0 : f(u, vv, i, j, t); };
      return f;
    });
    const bnd = band ? 1 : 0;
    if (shp === 'taper') { draw(cyl(pw, yb - ph + .9, yb, { kb: .74, band: bnd })); draw(cyl(pw * 1.1, yb - ph, yb - ph + 1), .7); }
    else if (shp === 'bowl') { const m = yb - ph * .45; draw(cyl(pw, yb - ph + .7, m, { kb: .86, band: bnd }), .58, { noBot: 1 }); draw(cyl(pw * .86, m, yb, { kb: .55 }), .5, { noTop: 1 }); draw(cyl(pw * 1.06, yb - ph, yb - ph + .8), .72); }
    else if (shp === 'tall') { draw(cyl(pw * .9, yb - ph + .8, yb - .8, { band: bnd })); draw(cyl(pw * .98, yb - ph, yb - ph + .9), .74); draw(cyl(pw * .96, yb - .9, yb), .32); }
    else if (shp === 'cube') { draw(G.sub(0, v, pw, pw, yb - ph + .7, yb), .52, { boxBand: 1 }); draw(G.sub(0, v, pw + .5, pw + .5, yb - ph, yb - ph + .8), .7); }
    else if (shp === 'orb') {                                                          // куля: чотири пояси (профіль кола)
      const y0 = yb - ph, k = [[.62, .97], [.97, 1], [1, .86], [.86, .45]];
      k.forEach(([kt, kb], n) => draw(cyl(pw, y0 + ph * n / 4, y0 + ph * (n + 1) / 4, { kt, kb, band: n === 1 ? bnd : 0 }), .58, { noTop: n > 0, noBot: n < 3 }));
    } else if (shp === 'net') { draw(cyl(pw, yb - ph + .5, yb, { kb: .8 }), .5, { net: 1 }); draw(cyl(pw * 1.14, yb - ph, yb - ph + .55), .6, { neonAll: 1 }); }
    else if (shp === 'basket') {                                                        // ПЛЕТЕНИЙ КОШИК: лоза «через одну», товстий обідок, кокосова підкладка
      const body = cyl(pw, yb - ph + .9, yb, { kb: .7 });
      G.partF(body, Fc => { if (Fc.k === 'top') return null; const L = lit(Fc.n, A.centre(Fc)), cylK = Fc.k === 'side' ? .78 + .3 * Math.max(-.6, Math.cos(Fc.ang - Math.PI * 1.5 - .5)) : .7;
        return (u, v, i, j) => { const x = (Fc.k === 'side' ? Fc.ui + u * Fc.un : u) * Math.PI * pw, y = v * Fc.fh, row = Math.floor(y / .8), over = ((Math.floor(x / 1.05) + row) & 1), gap = (y % .8) < .14;
          return ramp(Pm, (gap ? .1 : over ? .62 : .4) * cylK * L + (over ? (1 - Math.abs(((x / 1.05) % 1) - .5) * 2) * .1 : 0), i, j); }; });
      draw(cyl(pw * 1.1, yb - ph, yb - ph + 1.1), .48);
      G.partF(cyl(pw * 1.02, yb - ph - .6, yb - ph + .1, { kt: .9 }), Fc => Fc.k === 'side' ? (u, v, i, j) => hash(i, j) > .45 ? ramp(pal(['#1a0e06', '#3a220e', '#5a3a1a']), .5 + hash(j, i) * .4, i, j) : 0 : null);   // кокосові волокна над обідком
    } else if (shp === 'moss') {                                                        // КОКЕДАМА: мохова куля, обв'язана кольоровим шнуром
      const y0 = yb - ph, k = [[.62, .97], [.97, 1], [1, .86], [.86, .45]], sc = STRING[band] || STRING.pink;
      k.forEach(([kt, kb], n) => G.partF(cyl(pw, y0 + ph * n / 4, y0 + ph * (n + 1) / 4, { kt, kb }), Fc => {
        if ((n > 0 && Fc.k === 'top') || (n < 3 && Fc.k === 'bottom')) return null; const L = lit(Fc.n, A.centre(Fc)), cylK = Fc.k === 'side' ? .78 + .3 * Math.max(-.6, Math.cos(Fc.ang - Math.PI * 1.5 - .5)) : .7;
        return (u, v, i, j) => { const y = (n + v) / 4, x = Fc.k === 'side' ? Fc.ui + u * Fc.un : u;
          if (Math.abs(y - .4) < .03 || Math.abs(y - .64) < .03 || (Math.abs(x - .5) < .018 && y > .3)) return sc;
          return ramp(Pm, (.42 + (hash(i >> 1, j >> 1) - .5) * .4) * cylK * L + (1 - y) * .1, i, j); }; }));
    }
  }
  /** Спрайт (рослина / статуетка) -> пласка грань лицем до глядача у прямокутнику світу (cx, cz, yt..yb, ширина w);
   *  getS — побудувати спрайт (лише коли грань малюється: збірка шматками під заставкою). Прозоре — дірка. skip(v) — рядки,
   *  яких у растрі немає (живі: objects/decor.js малює їх щокадру). */
  function spriteFace(G, getS, cx, cz, yt, yb, w, glow, skip) {
    let S = null; const hw = w / 2, h = yb - yt, poly = [[cx - hw, yt, cz], [cx + hw, yt, cz], [cx + hw, yb, cz], [cx - hw, yb, cz]];
    G.face(poly, poly[0], [w, 0, 0], [0, h, 0], (u, v) => {
      if (skip && skip(v)) return 0;
      if (!S) S = getS(); if (!S) return 0;
      const px = Math.min(S.sw - 1, (u * S.sw) | 0), py = Math.min(S.sh - 1, (v * S.sh) | 0), c = S.d[py * S.sw + px];
      if ((c >>> 24) < 110) return 0;
      const cc = (c | 0xff000000) >>> 0; if (glow && X.lum(cc) > .5) X.SH.fl |= X.F_EMIT; return cc;
    }, [0, 0, -1]);
  }
  /** (Декор стін · 4) ЖИВІ РОСЛИНИ (власник: «рослини — пишніші й живіші»): частина рослини, що гойдається, у растр не йде —
   *  її щокадру малює objects/decor.js (той самий спрайт, зсуви рядків — вітерець). lv: {key, dir: 'down' — живе під межею
   *  cut (висить: від кріплення), 'up' — над нею (росте: над поруччям), cut — висота світу межі, amp — розмах (од.), per — період (с)}.
   *  Реєстр NX.arc.dcLive[key]: спрайт і три кути грані у світі (P0 — верх-ліво, P1 — верх-право, P3 — низ-ліво). */
  const LIVEP = NX.arc.dcLive = NX.arc.dcLive || {};
  function liveReg(lv, sp, P0, P1, P3, yt, yb, glow) {
    const dir = lv.dir || 'down', cut = Math.max(0, Math.min(1, lv.cut != null ? (lv.cut - yt) / (yb - yt) : (dir === 'up' ? 1 : 0)));
    LIVEP[lv.key] = { sp, P0, P1, P3, cut, dir, amp: lv.amp || 1.2, per: lv.per || 4.2, seed: sp.seed || 1, glow: !!glow };
    return dir === 'up' ? v => v < cut : v => v > cut;
  }
  const plantFace = (G, spec, cx, cz, yt, yb, w, glow, lv) => {
    const sp = Object.assign({ w: Math.round(w * 2) / 2, h: Math.round((yb - yt) * 2) / 2 }, spec);
    const skip = lv ? liveReg(lv, sp, [cx - w / 2, yt, cz], [cx + w / 2, yt, cz], [cx - w / 2, yb, cz], yt, yb, glow) : null;
    spriteFace(G, () => NX.arc.dcPlant(sp), cx, cz, yt, yb, w, glow, skip);
  };
  /** Чи гойдається рослина предмета B (decor.py: dc.sway) -> параметри для plantFace або null. */
  const swayOf = (B, extra) => B.dc && B.dc.sway ? Object.assign({ key: B.id }, B.dc.sway, extra) : null;

  // ================= АНТРЕСОЛЬ (сегмент дуги) =================
  const PANW = 15.5;
  /** Фасад плити (x — довжина вздовж дуги від початку, y — від верху, h — товщина, mid — де емблема). */
  function fascia(x, y, h, mid, i, j, L) {
    if (y < 1) return ramp(PL.CHROME, .9 - y * .35, i, j);                                   // хромова кромка
    if (y < 1.35) return ramp(PL.STEEL, .1, i, j);
    if (y < 2.65) { const k = Math.abs(y - 2) / .65; return E(k < .3 ? N.pink[2] : k < .75 ? N.pink[1] : N.pink[0]); }   // рожевий неон
    if (y < 3.2) return ramp(PL.STEEL, .12, i, j);
    if (y < 15) {                                                                              // смуга панелей
      const pi = Math.floor(x / PANW), pc = x - pi * PANW, ty = y - 3.2, hp = 11.8;
      if (pc < .5) return ramp(PL.STEEL, .08, i, j);
      const ex = x - mid, ey = y - 9.1, er = Math.hypot(ex * .92, ey);
      if (er < 6.5) {                                                                          // ЕМБЛЕМА: неонове коло з паростком
        if (Math.abs(er - 5.7) < .48) return E(Math.abs(er - 5.7) < .18 ? N.green[2] : N.green[1]);
        if (Math.abs(ex) < .3 && ey > -1.2 && ey < 3.8) return E(N.green[1]);                   // стебло
        for (const [bx, by, tx, ty] of [[0, -.9, -3.5, -3.1], [0, -1.9, 3.1, -4.6]]) {         // два листки-краплі: контур — неон, усередині — темна зелень
          const dx = tx - bx, dy = ty - by, L2 = Math.hypot(dx, dy), al = ((ex - bx) * dx + (ey - by) * dy) / L2, pp = Math.abs((ex - bx) * dy - (ey - by) * dx) / L2;
          if (al < 0 || al > L2) continue; const hw = 1.25 * Math.sin(Math.PI * Math.pow(al / L2, .8));
          if (Math.abs(pp - hw) < .3) return E(N.green[1]); if (pp < hw) return pp < .16 ? E(N.green[0]) : ramp(MAT.jade, .3, i, j);
        }
        return ramp(PL.DARK, .32 + (er > 5.2 ? .12 : 0), i, j);
      }
      let q = .44 * L + (ty < 1 ? .14 : 0) - (ty > hp - 1 ? .12 : 0);
      if ((Math.abs(pc - 1.6) < .42 || Math.abs(pc - (PANW - 1.1)) < .42) && (Math.abs(ty - 1.6) < .42 || Math.abs(ty - (hp - 1.6)) < .42)) return ramp(PL.CHROME, .72, i, j);   // заклепки
      const kd = Math.floor(hash(pi * 7 + 3, 11) * 4), cx = pc - PANW / 2, cy = ty - hp / 2;
      if (kd === 0 && Math.abs(cx) < 4.6 && Math.abs(cy) < 3.4) q -= (ty % 1.15) < .5 ? .22 : 0;                       // ґратка-ламелі
      else if (kd === 1 && Math.abs(cy) < .55) { for (let k = -1; k <= 1; k++) if (Math.abs(cx - k * 1.9) < .5) return E(k < 0 ? col('#3bff8a') : k ? col('#3be8ff') : col('#ffb24a')); }   // вогники стану
      else if (kd === 2 && Math.abs(cx) < 4 && Math.abs(cy) < 3.6) { if (Math.abs((cy + Math.abs(cx) * .75) % 2.4) < .45) q += .16; }   // шеврони
      else if (kd === 3 && Math.abs(cx) < 4.4 && Math.abs(cy) < 3.2 && (((pc * 1.8) | 0) % 2 === 0) && (((ty * 1.8) | 0) % 2 === 0)) q -= .18;   // перфорація
      return ramp(PL.MET, q, i, j);
    }
    if (y < 15.6) return ramp(PL.STEEL, .1, i, j);
    if (y < 16.8) return E(((x * 1.4) | 0) % 3 ? N.cyan[1] : N.cyan[2]);                        // блакитна LED-смуга
    if (y < 17.3) return ramp(PL.STEEL, .1, i, j);
    if (y > h - .75) return E(y > h - .38 ? N.orange[1] : N.orange[0]);                          // помаранчеве підсвічування знизу
    return ramp(PL.STEEL, (((x * 1.3) | 0) % 2 ? .34 : .22) * L + .1, i, j);                    // ламелі спідниці
  }
  SHP['st:dc_mz'] = (G, B) => {
    const M = B.dc, sg = M.sgn, C = M.C, R = M.R, rf = R - M.P, rw = R - .3, top = M.top, bot = M.bot, h = bot - top, mid = M.mid != null ? M.mid : (M.tot || 93) / 2;
    const pt = (a, rad, y) => [C[0] + sg * rad * Math.sin(a * D2R), y, C[1] + rad * Math.cos(a * D2R)];
    const nIn = a => [-sg * Math.sin(a * D2R), 0, -Math.cos(a * D2R)], tg = a => [sg * Math.cos(a * D2R), 0, -Math.sin(a * D2R)], am = (M.sa + M.sb) / 2;
    const f0t = pt(M.sa, rf, top), f1t = pt(M.sb, rf, top), f1b = pt(M.sb, rf, bot), f0b = pt(M.sa, rf, bot), len = Math.hypot(f1t[0] - f0t[0], f1t[2] - f0t[2]);
    // фасад
    const Lf = lit(nIn(am), f0t);
    G.face([f0t, f1t, f1b, f0b], f0t, sub(f1t, f0t), [0, h, 0], (u, v, i, j) => fascia(M.s0 + u * len, v * h, h, mid, i, j, Lf), nIn(am));
    // спід (його добре видно знизу): кромка, блакитна стрічка, балки, кабель-канал, точкові світильники, рифлені плити
    const w0b = pt(M.sa, rw, bot), w1b = pt(M.sb, rw, bot), dep = M.P - .3, ctr = dep * .58;
    G.face([f0b, f1b, w1b, w0b], f0b, sub(f1b, f0b), sub(w0b, f0b), (u, v, i, j) => {
      const x = M.s0 + u * len, d = v * dep;
      if (d < 1) return ramp(PL.CHROME, .55 - d * .2, i, j);
      if (d < 1.7) return E(N.cyan[(i + j) % 5 ? 1 : 2]);
      const bm = ((x % 11.5) + 11.5) % 11.5; if (bm < 1.4) return ramp(PL.MET, .5 + (bm < .5 ? .16 : 0), i, j);
      const sx = (((x + 5.75) % 23) + 23) % 23 - 11.5, sr = Math.hypot(sx, (d - 4.6) * 1.2);
      if (sr < 1.05) return E(sr < .55 ? col('#fff4d8') : col('#ffd27a')); if (sr < 1.5) return ramp(PL.CHROME, .5, i, j);
      if (Math.abs(d - ctr) < 1.3) return ramp(PL.STEEL, Math.abs(d - ctr) < .3 ? .34 : .14, i, j);
      let q = .24 + (1 - v) * .14 + ((((x * 1.6) | 0) + ((d * 1.6) | 0)) % 2) * .05; if (d > dep - 1.4) q -= .1;
      return ramp(PL.STEEL, q, i, j);
    }, [0, 1, 0]);
    // ТІНЬ ПІД ПЛИТОЮ на стіні (дизеринг: густа під самою плитою, вниз розсіюється)
    const shB = Math.min(bot + 17, M.shy || bot + 17); if (shB > bot) ditherFace(G, pt(M.sa, R - .35, bot - 1), pt(M.sb, R - .35, bot - 1), pt(M.sa, R - .35, shB), nIn(am), (u, v) => .44 * Math.pow(1 - v, 1.7));
    // мідна труба вздовж споду з підвісами
    const rp = rf + M.P * .38, copT = tubeT(MAT.copper, .2, .66);
    G.tube(pt(M.sa, rp, bot + 1.2), pt(M.sb, rp, bot + 1.2), 1.7, copT);
    if (M.i % 3 === 1) G.tube(pt(am, rp, bot), pt(am, rp, bot + 1.2), .5, steelT);
    // торці
    const cap = (a, s) => { const a0 = pt(a, rf, top), a1 = pt(a, rw, top), a2 = pt(a, rw, bot), a3 = pt(a, rf, bot), n = s < 0 ? tg(a).map(q => -q) : tg(a), L = lit(n, a0);
      G.face([a0, a1, a2, a3], a0, sub(a1, a0), [0, h, 0], (u, v, i, j) => fascia(500 + u * (rw - rf), v * h, h, -99, i, j, L), n); };
    if (!M.pier) { if (M.i === 0) cap(M.sa, -1); if (M.i === M.n - 1) cap(M.sb, 1); }                // (· 4) з пілона й за кадр — торців не видно
    // ПОРУЧЧЯ: скло (дірки з відблисками й фрит-смугою), хромовані стійки з неоновими ковпачками, товстий поручень
    const rr = rf + .9, t2 = top - M.rail, gh = M.rail - 1.4;
    const glass = (x0, lenG) => (u, v, i, j) => {
      const x = x0 + u * lenG, y = v * gh;
      if (y > gh - 1.6) return ((i >> 1) + (j >> 1)) % 2 ? 0 : ramp(PL.CYANL, .3, i, j);      // фрит-смуга (крапки)
      const dg = ((x - y * .7) % 13 + 13) % 13; if (dg < .4 || (dg > 1.05 && dg < 1.3)) return col('#bfe9ff');
      return 0;
    };
    const g0 = pt(M.sa, rr + .25, t2 + .8), g1 = pt(M.sb, rr + .25, t2 + .8);
    quad(G, [g0, g1, add3(g1, [0, gh, 0]), add3(g0, [0, gh, 0])], glass(M.s0, len), nIn(am));
    const post = (a, rad, k) => { G.tube(pt(a, rad, top), pt(a, rad, t2 - .3), 1.25, chromeT); const nc = k % 2 ? N.cyan : N.pink; G.disc(add3(pt(a, rad, t2 - 1.1), nIn(a), .5), .62, (u, v) => E(Math.hypot(u - .45, v - .45) < .22 ? nc[2] : nc[1])); };
    const pk = Math.round((M.sa - M.a0) / 2);
    if (M.i % 2 === 0) post(M.sa, rr, pk); if (M.i === M.n - 1) post(M.sb, rr, pk + 1);
    G.tube(pt(M.sa, rr, t2), pt(M.sb, rr, t2), 1.6, chromeT);
    const side = (a, s) => {                                                                     // бічне поруччя (до стіни)
      const p0 = pt(a, rr, t2), p1 = pt(a, rw - .6, t2), n = s < 0 ? tg(a).map(q => -q) : tg(a);
      G.tube(p0, p1, 1.5, chromeT); [.34, .67, 1].forEach((k, q) => post(a, rr + (rw - .6 - rr) * k, q));
      const q0 = pt(a, rr, t2 + .8), q1 = pt(a, rw - .6, t2 + .8); quad(G, [q0, q1, add3(q1, [0, gh, 0]), add3(q0, [0, gh, 0])], glass(300, rw - .6 - rr), n);
    };
    if (!M.pier) { if (M.i === 0) side(M.sa, -1); if (M.i === M.n - 1) side(M.sb, 1); }
    // ФЕРМА-КОНСОЛЬ: плита на стіні, діагональ, стяжка, стійка, болти
    if (M.truss) {
      const yb2 = bot + M.brk, D = B.dep;
      G.part(G.sub(0, D - .55, 2.8, 1, bot - .4, yb2 + .6), 'stand', { pal: PL.MET, q: .5 });
      G.tube(G.P(0, D - 1, yb2 - .4), G.P(0, D * .3, bot + .4), 1.6, steelT);
      G.tube(G.P(0, D - 1, bot + 1.1), G.P(0, D * .3, bot + 1.1), 1, steelT);
      G.tube(G.P(0, D * .62, bot + 1.1), G.P(0, D * .62, bot + (yb2 - bot) * .52), .8, steelT);
      for (const y of [bot + 2, yb2 - 1.2]) G.disc(G.P(0, D - 1.1, y), .45, (u, v, i, j) => ramp(PL.CHROME, .8 - v * .5, i, j));
      G.disc(G.P(0, D * .3, bot + .5), .5, () => E(N.pink[1]));                                 // вогник на кінці ферми
    }
  };

  // ================= ВАЗОН З РОСЛИНОЮ =================
  SHP['st:dc_pot'] = (G, B) => {
    const d = B.dc, Pd = d.pot || { shape: 'taper', mat: 'terra', pw: d.pw || 6, ph: d.ph || 4 }, pw = Pd.pw, ph = Pd.ph, base = B.yb - (d.hl || 0), v = B.dep / 2;
    potDraw(G, B, v, Pd, base);
    const p = G.P(0, v, base);
    plantFace(G, { kind: d.kind, seed: d.seed, pal: d.pal }, p[0], p[2] - pw * .12, B.yt, base - ph + 1.1, B.w, d.glow, swayOf(B, { dir: 'up' }));
  };

  // ================= ПІДВІСИ =================
  const cordT = (u, v, i, j) => ramp(pal(['#3a2a1a', '#7a5a3a', '#c8a070', '#f0d8a8']), .5 + (u - .5) * .6, i, j);
  const wireT = (u, v, i, j) => ramp(PL.CHROME, .75 - Math.abs(u - .4), i, j);
  /** Скляна куля-кашпо (Декор стін · 4): прозора (дірки) з неоновим обідком отвору, відблисками, мохом і ґрунтом знизу. */
  const GTINT = pal(['#10304a', '#1a4a66', '#2a6a88', '#4a90b0']);
  const glassOrb = nb => (u, v, i, j) => {
    const x = u - .5, y = v - .5, q = Math.hypot(x, y) * 2;
    if (q > 1) return 0; if (q > .88) return E(q > .94 ? nb[1] : nb[2]);                                       // світний скляний обідок
    if (y < -.1 && y > -.26 && Math.abs(x) < .36) return E(Math.abs(y + .18) < .035 ? nb[2] : nb[1]);       // неоновий обідок отвору
    if (x < -.1 && y < -.14 && q > .5 && q < .76) return col('#f4fbff');                                     // відблиск
    if (x > .2 && y > .05 && q > .62 && q < .8) return col('#bfe9ff');
    if (y > .2) return ramp(MAT.moss, .4 + hash(i >> 1, j >> 1) * .3 - (y - .2), i, j);                      // мох і ґрунт
    if (y > .12) return ramp(pal(['#1a0e06', '#3a220e', '#5a3a1a']), .4 + hash(j, i) * .4, i, j);
    return ((i + j) & 1) ? ramp(GTINT, .3 + (1 - q) * .5, i, j) : 0;                                          // тоноване скло (дизеринг)
  };
  SHP['st:dc_hang'] = (G, B) => {
    const d = B.dc, lv = swayOf(B), anch = d.anch;                                     // anch — висота світу кріплення під спідом антресолі (· 4)
    if (d.frm === 'hook') {                                                           // макраме: з кронштейна на стіні або (· 4) з гака під антресоллю
      const hy = B.yt + .6, hook = G.P(0, B.dep / 2, hy), wv = B.dep + (d.wb || 0) - .2;
      if (anch != null) { G.tube([hook[0], anch, hook[2]], hook, .55, brassT); G.disc([hook[0], hy + .2, hook[2] - .2], .75, (u, v, i, j) => Math.hypot(u - .5, v - .5) < .25 ? 0 : ramp(PL.GOLD, .7 - v * .3, i, j)); }
      else {
        G.tube(G.P(0, wv, hy), hook, 1, brassT); G.disc(G.P(0, wv - .3, hy), 1.3, (u, v, i, j) => ramp(PL.GOLD, .75 - v * .4, i, j));
        G.disc(G.P(0, B.dep / 2 + .6, hy - .9), .8, (u, v, i, j) => Math.hypot(u - .5, v - .5) < .25 ? 0 : ramp(PL.GOLD, .7 - v * .3, i, j));   // завиток
      }
      const Pd = d.pot || { shape: 'orb', mat: 'ceram', pw: 7, ph: 7 }, pw = Pd.pw, ph = Pd.ph, potY = B.yt + Math.min(16, (B.yb - B.yt) * .3), v = B.dep / 2, p = G.P(0, v, potY);
      for (const k of [-1, -.36, .36, 1]) { const e = [p[0] + k * pw * .5, potY - ph * .6, p[2] - (Math.abs(k) < .5 ? pw * .44 : 0)], m = add3(hook, sub(e, hook), .55);
        G.tube(hook, e, .5, cordT); G.disc(m, .42, (u, v, i, j) => ramp(pal(['#7a5a3a', '#c8a070', '#f0d8a8']), .8 - v * .5, i, j)); }
      G.tube(G.P(0, v, potY - ph - .2), G.P(0, v, potY + 2.6), .5, cordT);                    // кисть знизу
      potDraw(G, B, v, Pd, potY);
      plantFace(G, { kind: d.kind, seed: d.seed, hang: 1, pal: d.pal || 'light' }, p[0], p[2] + pw * .3, potY - ph - 1.5, B.yb, B.w, false, lv && Object.assign(lv, { cut: potY - ph * .55 }));
    } else if (d.frm === 'chain') {                                                   // ВИСЯЧИЙ КОШИК: три ланцюжки зі стелі, кошик, папороть каскадом
      const Pd = d.pot || { shape: 'basket', mat: 'wicker', pw: 9.5, ph: 6 }, pw = Pd.pw, ph = Pd.ph, T = B.yb - B.yt, yr = B.yt + T * .28, v = B.dep / 2, c = G.P(0, v, yr);
      const top = [c[0], Ywz(-4, c[2]), c[2]], linkT = (u, vv, i, j) => ramp(PL.GOLD, ((vv * 60) | 0) % 2 ? .75 - Math.abs(u - .4) : .35, i, j);
      for (let q = 0; q < 3; q++) { const a = q / 3 * Math.PI * 2 + .5; G.tube(top, [c[0] + Math.cos(a) * pw * .53, yr + .2, c[2] + Math.sin(a) * pw * .53], .45, linkT); }
      G.disc([c[0], yr - T * .2, c[2] - .3], .7, (u, vv, i, j) => ramp(PL.GOLD, .8 - vv * .4, i, j));   // кільце, де ланцюжки сходяться
      potDraw(G, B, v, Pd, yr + ph);
      const Hs = (B.yb - yr) / .83; plantFace(G, { kind: d.kind, seed: d.seed }, c[0], c[2] + .5, yr - .17 * Hs, B.yb, B.w, false, lv && Object.assign(lv, { cut: yr + ph * .7 }));
    } else if (d.frm === 'string') {                                                  // КОКЕДАМА: шнур зі стелі (· 4 — з-під антресолі), мохова куля, рослина над нею
      const Pd = d.pot || { shape: 'moss', mat: 'moss', pw: 6, ph: 6 }, pw = Pd.pw, ph = Pd.ph, v = B.dep / 2, yb = B.yb, c = G.P(0, v, yb - ph);
      G.tube([c[0], anch != null ? anch : Ywz(-4, c[2]), c[2]], [c[0], yb - ph - 2, c[2]], .3, (u, vv, i, j) => ramp(pal(['#3a2a1a', '#7a5a3a', '#c8a070']), .7 - Math.abs(u - .4), i, j));
      potDraw(G, B, v, Pd, yb);
      plantFace(G, { kind: d.kind, seed: d.seed }, c[0], c[2] - .2, yb - ph - 10.5, yb - ph + 1.6, B.w, false, lv && Object.assign(lv, { dir: 'up', cut: yb - ph + 1.6, amp: (lv.amp || 1) * .7 }));
    } else if (d.frm === 'wire') {                                                    // ТІЛАНДСІЇ в дротяному кільці на дроті з кронштейна
      const c = G.P(0, B.dep / 2, (B.yt + B.yb) / 2 + 1.5), R = Math.min(B.w, B.yb - B.yt) * .42;
      G.tube(G.P(0, B.dep / 2, B.yt), [c[0], c[1] - R, c[2]], .3, wireT);
      let p0 = null; for (let q = 0; q <= 18; q++) { const a = q / 18 * Math.PI * 2, p = [c[0] + Math.cos(a) * R, c[1] + Math.sin(a) * R, c[2]]; if (p0) G.tube(p0, p, .32, wireT); p0 = p; }
      plantFace(G, { kind: d.kind, seed: d.seed }, c[0], c[2] + .3, c[1] - R * .95, c[1] + R * .95, R * 1.9, false);
    } else if (d.frm === 'orb') {                                                     // (· 4) СКЛЯНА КУЛЯ на дроті зі стелі: неоновий обідок, мох; рослина звисає з отвору
      const Pd = d.pot || { pw: 7 }, Rb = Pd.pw / 2, nb = N[Pd.band] || N.cyan, v = B.dep / 2, cy = B.yt + Math.min(12, (B.yb - B.yt) * .2) + Rb, c = G.P(0, v, cy);
      G.tube([c[0], Ywz(-4, c[2]), c[2]], [c[0], cy - Rb + .3, c[2]], .28, wireT);
      G.disc([c[0], cy - Rb + .2, c[2] - .1], .7, (u, vv, i, j) => ramp(PL.CHROME, .85 - vv * .5, i, j));
      G.disc([c[0], cy, c[2] - .2], Rb, glassOrb(nb));
      plantFace(G, { kind: d.kind, seed: d.seed, hang: 1 }, c[0], c[2] - .9, cy - Rb * .3, B.yb, B.w, false, lv && Object.assign(lv, { cut: cy + Rb * .15 }));
    } else if (d.frm === 'cone') {                                                    // (· 4) МІДНИЙ КОНУС-КИШЕНЯ на цеглі: кільце-тримач, латунний обідок; рослина каскадом
      const Pd = d.pot || { pw: 7, ph: 8 }, pw = Pd.pw, ph = Pd.ph, v = B.dep / 2, y0 = B.yt + 1.2, c = G.P(0, v, y0), wv = B.dep + (d.wb || 0) - .2;
      G.partF({ x: c[0], z: c[2] - pw / 2, turn: 0, w: pw, dep: pw, yt: y0, yb: y0 + ph, cyl: 16, kb: .08 }, Fc => {
        if (Fc.k === 'top') return null; const sh = surf('copper', A.shader('pot', Fc, { w: pw, dep: pw }, { pal: MAT.copper, q: .58 }), Fc);
        return (u, vv, i, j, t) => { const y = vv * Fc.fh; return y < .8 ? ramp(PL.GOLD, .8 - y * .3, i, j) : Math.abs(y - ph * .42) < .22 ? ramp(PL.GOLD, .7, i, j) : sh(u, vv, i, j, t); }; });
      G.tube(G.P(0, wv, y0 + ph * .3), G.P(0, v + pw * .3, y0 + ph * .3), .7, brassT); G.disc(G.P(0, wv - .3, y0 + ph * .3), 1.1, (u, vv, i, j) => ramp(PL.GOLD, .75 - vv * .4, i, j));
      plantFace(G, { kind: d.kind, seed: d.seed, hang: 1 }, c[0], c[2] - pw * .2, y0 - 1.4, B.yb, B.w, false, lv && Object.assign(lv, { cut: y0 + 1.2 }));
    } else if (d.frm === 'moon') {                                                    // (· 4) КЕРАМІЧНА ПІВКУЛЯ на стіні: широкий обідок з рожевим неоном, латунний кронштейн
      const Pd = d.pot || { pw: 9, ph: 4.5 }, pw = Pd.pw, ph = Pd.ph, v = B.dep / 2, y0 = B.yt + 1, c = G.P(0, v, y0), nb = N[Pd.band] || N.pink, wv = B.dep + (d.wb || 0) - .2;
      [[1, .8], [.8, .42]].forEach(([kt, kb], n) => G.partF({ x: c[0], z: c[2] - pw / 2, turn: 0, w: pw, dep: pw, yt: y0 + ph * n / 2, yb: y0 + ph * (n + 1) / 2, cyl: 16, kt, kb }, Fc => {
        if (Fc.k === 'top' || (n === 0 && Fc.k === 'bottom')) return null; return surf('ceram', A.shader('pot', Fc, { w: pw, dep: pw }, { pal: PL.CERAM, q: .62 }), Fc); }));
      G.partF({ x: c[0], z: c[2] - pw * .54, turn: 0, w: pw * 1.08, dep: pw * 1.08, yt: y0 - .5, yb: y0 + .4, cyl: 16 }, Fc => Fc.k === 'side' ? () => E(nb[1]) : (u, vv, i, j) => ramp(PL.CERAM, .8, i, j));
      G.tube(G.P(0, wv, y0 + ph * .5), G.P(0, v, y0 + ph * .5), .7, brassT);
      plantFace(G, { kind: d.kind, seed: d.seed, hang: 1 }, c[0], c[2] - pw * .3, y0 - 1.2, B.yb, B.w, false, lv && Object.assign(lv, { cut: y0 + .8 }));
    } else if (d.frm === 'ring') {                                                    // (· 4) НЕОНОВЕ КІЛЬЦЕ на трьох дротах з-під антресолі; у кільці — хромована чашка
      const Pd = d.pot || { pw: 5.5, ph: 4 }, nb = N[Pd.band] || N.pink, v = B.dep / 2, Rr = Math.min(B.w * .48, 6.5), cy = B.yt + 3 + Rr, c = G.P(0, v, cy), top = anch != null ? anch : Ywz(-4, c[2]);
      for (const k of [-1, 0, 1]) G.tube([c[0] + k * Rr * .2, top, c[2] + (k ? 0 : .4)], [c[0] + k * Rr * .72, cy - Rr * .7, c[2]], .22, wireT);
      let p0 = null; for (let q = 0; q <= 24; q++) { const a = q / 24 * Math.PI * 2, p = [c[0] + Math.cos(a) * Rr, cy + Math.sin(a) * Rr, c[2]]; if (p0) G.tube(p0, p, .75, (u) => E(u > .3 && u < .7 ? nb[2] : nb[1])); p0 = p; }
      const pY = cy + Rr * .55; G.partF({ x: c[0], z: c[2] - Pd.pw / 2, turn: 0, w: Pd.pw, dep: Pd.pw, yt: pY - Pd.ph, yb: pY, cyl: 14, kb: .7 }, Fc => Fc.k === 'top' ? null : surf('chrome', A.shader('pot', Fc, { w: Pd.pw, dep: Pd.pw }, { pal: PL.CHROME, q: .6 }), Fc));
      plantFace(G, { kind: d.kind, seed: d.seed, hang: 1 }, c[0], c[2] - Pd.pw * .6, pY - Pd.ph - 1, B.yb, B.w, false, lv && Object.assign(lv, { cut: pY - Pd.ph * .3 }));
    } else { const c = G.P(0, B.dep / 2, B.yt); plantFace(G, { kind: d.kind, seed: d.seed, hang: 1, pal: d.pal || 'light' }, c[0], c[2], B.yt, B.yb, B.w, false, lv); }
  };

  // ================= ЗЕЛЕНЬ НА СТІНІ Й НА ФАСАДІ (Декор стін · 3) =================
  /** Пласка рослина у площині предмета (виткá на цеглі, звиси з антресолі на фасаді): спрайт на передній грані, прозоре — дірка. */
  SHP['st:dc_climb'] = SHP['st:dc_spill'] = (G, B) => {
    const d = B.dc, hw = B.w / 2, nF = sub(G.P(0, 0, 0), G.P(0, 1, 0)); let S = null;
    const sp = { kind: d.kind, seed: d.seed, w: Math.round(B.w * 2) / 2, h: Math.round((B.yb - B.yt) * 2) / 2 }, lv = swayOf(B);
    const skip = lv ? liveReg(Object.assign(lv, { cut: B.yt + 1.2 }), sp, G.P(-hw, 0, B.yt), G.P(hw, 0, B.yt), G.P(-hw, 0, B.yb), B.yt, B.yb, false) : null;   // (· 4) звиси гойдаються
    quad(G, [G.P(-hw, 0, B.yt), G.P(hw, 0, B.yt), G.P(hw, 0, B.yb), G.P(-hw, 0, B.yb)], (u, v) => {
      if (skip && skip(v)) return 0;
      if (!S) S = NX.arc.dcPlant(sp);
      const c = S.d[Math.min(S.sh - 1, (v * S.sh) | 0) * S.sw + Math.min(S.sw - 1, (u * S.sw) | 0)]; return (c >>> 24) < 110 ? 0 : (c | 0xff000000) >>> 0;
    }, nF);
  };
  /** КОРИТО на стіні: металевий ящик з неоновою смужкою на двох кронштейнах; з нього звисає рослина (спрайт лицем до глядача). */
  SHP['st:dc_trough'] = (G, B) => {
    const d = B.dc, th = d.th || 3.2, nb = N[(d.pot && d.pot.band) || 'lil'] || N.lil, box = G.sub(0, B.dep / 2, B.w, B.dep, B.yt, B.yt + th);
    G.partF(box, Fc => { const L = lit(Fc.n, A.centre(Fc));
      if (Fc.k === 'front') return (u, v, i, j) => { const y = v * th, x = u * Fc.fw; if (y < .45) return ramp(PL.CHROME, .8, i, j); if (Math.abs(y - th * .62) < .26) return E(Math.abs(y - th * .62) < .1 ? nb[2] : nb[1]);
        if ((x < 1.2 || x > Fc.fw - 1.2) && Math.abs(y - th * .3) < .3) return ramp(PL.CHROME, .7, i, j); return ramp(PL.MET, .42 * L + (y > th - .5 ? -.1 : 0), i, j); };
      if (Fc.k === 'bottom') return (u, v, i, j) => ramp(PL.STEEL, .22 + (1 - v) * .1, i, j);
      return (u, v, i, j) => ramp(PL.MET, .36 * L, i, j); });
    for (const s of [-1, 1]) { const u = s * (B.w / 2 - 3); G.tube(G.P(u, B.dep - .3, B.yt + th + 3.2), G.P(u, B.dep * .25, B.yt + th + .1), .8, steelT); G.tube(G.P(u, B.dep - .3, B.yt + th + .2), G.P(u, B.dep - .3, B.yt + th + 3.4), .9, steelT); }
    const v = B.dep * .45, c = G.P(0, v, B.yt); plantFace(G, { kind: d.kind, seed: d.seed }, c[0], c[2], B.yt + .4, B.yb, bbW(G, B, v) * .97, false, swayOf(B, { dir: 'down', cut: B.yt + th + .4 }));
  };
  /** ТІНЬ окремої речі на стіні (decor.py: wshadow) — прямокутник з м'якими краями або овал (rnd). */
  SHP['st:dc_shadow'] = (G, B) => {
    const d = B.dc || {}, hw = B.w / 2, H = B.yb - B.yt, k = d.k || .5, soft = d.soft || 2.5, nF = sub(G.P(0, 0, 0), G.P(0, 1, 0));
    ditherFace(G, G.P(-hw, 0, B.yt), G.P(hw, 0, B.yt), G.P(-hw, 0, B.yb), nF, (u, v) => {
      if (d.rnd) { const r = Math.hypot((u - .5) * 2, (v - .5) * 2); return k * Math.max(0, Math.min(1, (1 - r) * Math.min(B.w, H) / (2 * soft))); }
      return k * Math.min(1, Math.min(u * B.w, (1 - u) * B.w, v * H, (1 - v) * H) / soft) * (1 - v * .3);
    });
  };
  // невидимі джерела світла на стіну (decor.py: light) — рушій бере з них колір і силу (lightsOf), малювати нічого
  SHP.dc_lt_reef = SHP.dc_lt_tube = SHP.dc_lt_jelly = SHP.dc_lt_hex = SHP.dc_lt_pylon = SHP.dc_lt_mz = () => {};

  // ================= ЛІХТАР =================
  SHP['st:dc_lantern'] = (G, B) => {
    const c = G.P(0, B.dep / 2, B.yb), w = B.w, H = B.yb - B.yt, at = (y0, y1, k, extra = {}) => Object.assign({ x: c[0], z: c[2] - w * k / 2, turn: 0, w: w * k, dep: w * k, yt: y0, yb: y1, cyl: 14 }, extra);
    G.part(at(B.yb - 2, B.yb, .9), 'gold', {});
    G.partF(at(B.yt + H * .32, B.yb - 2, .62), () => (u, v, i, j) => E(ramp(PL.LAMP, .95 - Math.abs(u - .45) * .8 - v * .25, i, j)));
    for (let k = 0; k < 4; k++) { const a = (k + .5) / 4 * Math.PI * 2, r = w * .36; G.tube([c[0] + Math.cos(a) * r, B.yb - 2, c[2] + Math.sin(a) * r], [c[0] + Math.cos(a) * r, B.yt + H * .32, c[2] + Math.sin(a) * r], .55, brassT); }
    G.part(at(B.yt + H * .14, B.yt + H * .32, .95, { kt: .35 }), 'gold', {});
    G.tube([c[0], B.yt + H * .14, c[2]], [c[0], B.yt + .6, c[2]], .5, brassT); G.disc([c[0], B.yt + 1, c[2] - .3], 1.1, (u, v, i, j) => ramp(PL.GOLD, .7 - v * .4, i, j));
  };

  // ================= ПІЛОН ДРУГОГО ПОВЕРХУ (Декор стін · 4) =================
  /** Масивна торцева стіна від стелі: антресоль виходить з неї (decor.py: П0). Бокова грань (лицем уздовж антресолі — до
   *  глядача): рама розсувних дверей з неоном і табличкою-іконкою, рама скляної колби, кругла вентиляційна ґратка, кодовий
   *  замок, неонова смуга біля краю, панелі з заклепками, смуга «обережно» внизу; лицьова — хромові кромки, блакитний неон,
   *  дисплей і вогники; спід — тепла лампа. Вікна (двері, колба) — окремі предмети dc_door / dc_pyg (живе — objects/decor.js). */
  const HAZ = (x, y, i, j) => ((((x + y) * .8) % 2) + 2) % 2 < 1 ? ramp(pal(['#4a3a00', '#c89a10', '#ffd23a']), .72, i, j) : ramp(PL.DARK, .18, i, j);
  const PNL = pal(['#06051a', '#0b0926', '#110e34', '#181444', '#211b56', '#2b246a', '#373080', '#463e98']);
  function pylonSide(M, ins, Y, i, j, L) {
    const D = M.D, Yb = M.Yb, deck = M.deck, [d0, d1, dy0, dy1] = M.door, [g0, g1, , gy1] = M.glass, [vu, vy, vr] = M.vent, [k0, k1, ky0, ky1] = M.keys;
    if (ins > D - .8) return ramp(PL.CHROME, .86 - (D - ins) * .4, i, j);                                  // хромова кромка
    if (ins < .6) return ramp(PL.STEEL, .1, i, j);
    if (Y > Yb - .9) return ramp(PL.CHROME, .66 - (Y - Yb + .9) * .3, i, j);
    if (ins > D - 2.5 && ins < D - 1.5) return E(Math.abs(ins - (D - 2)) < .17 ? N.pink[2] : N.pink[1]);    // рожева неонова смуга
    if (Y > Yb - 5.5 && Y < Yb - 1.6) return HAZ(ins, Y, i, j);                                             // «обережно»
    // рама колби: хром, болти; знизу — латунний цоколь з червоним вентилем
    if (ins > g0 - .9 && ins < g1 + .9 && Y < gy1 + 4.2) {
      if (Y > gy1) { if (Y > gy1 + 1.2 && Y < gy1 + 2.8 && Math.abs(ins - (g0 + g1) / 2) < 1.1) return ramp(pal(['#4a0a0a', '#9a1a1a', '#e83a2a', '#ff8a6a']), .9 - (Y - gy1 - 1.2) * .3, i, j);
        return ramp(PL.GOLD, .7 - (Y - gy1) * .08 + (Math.abs(ins - (g0 + g1) / 2) < .4 ? .15 : 0), i, j); }
      if (Math.abs(((Y + 40) % 9) - 4.5) < .45 && (ins < g0 - .3 || ins > g1 + .3)) return ramp(PL.CHROME, .9, i, j);
      return ramp(PL.CHROME, .58 + (ins < g0 ? .1 : -.06), i, j);
    }
    // рама дверей: хром — блакитний неон — темна ніша; поріг
    if (ins > d0 - 1.6 && ins < d1 + 1.6 && Y > dy0 - 1.8 && Y < deck) {
      const e = Math.min(ins - (d0 - 1.6), d1 + 1.6 - ins, Y - (dy0 - 1.8));
      if (e < .55) return ramp(PL.CHROME, .82 - e * .4, i, j); if (e < .95) return E(e > .66 && e < .84 ? N.cyan[2] : N.cyan[1]);
      return ramp(PL.DARK, .14, i, j);
    }
    // табличка над дверима: сходинки й листочок (без слів)
    if (ins > d0 + .8 && ins < d1 - .8 && Y > dy0 - 7.6 && Y < dy0 - 2.6) {
      const x = ins - d0 - .8, y = Y - (dy0 - 7.6), w = d1 - d0 - 1.6, e = Math.min(x, w - x, y, 5 - y);
      if (e < .35) return ramp(PL.CHROME, .7, i, j);
      const sx = x - w * .28, sy = y - 2.5;                                                                     // сходинки вгору
      for (let q = 0; q < 3; q++) if (Math.abs(sy - (1.2 - q * .9)) < .16 && sx > q * 1.1 - 1.6 && sx < q * 1.1 - .4) return E(N.green[1]);
      for (let q = 0; q < 3; q++) if (Math.abs(sx - (q * 1.1 - .4)) < .14 && sy < 1.2 - q * .9 && sy > .3 - q * .9) return E(N.green[1]);
      const lx = x - w * .72, ly = y - 2.5, ll = Math.hypot(lx * 1.3, ly + .2);                                // листочок
      if (Math.abs(ll - 1.3) < .2 || (Math.abs(lx + ly * .5) < .12 && ll < 1.3)) return E(N.green[1]); if (ll < 1.3) return ramp(MAT.jade, .32, i, j);
      return ramp(PL.DARK, .22, i, j);
    }
    // кругла вентиляційна ґратка (вентилятор — живий)
    const vd = Math.hypot(ins - vu, Y - vy);
    if (vd < vr) { if (vd > vr - .7) return ramp(PL.CHROME, .8 - (Y - vy) / vr * .25, i, j); if (vd > vr - 1.2) return ramp(PL.STEEL, .08, i, j);
      if (vd < 1) return ramp(PL.MET, .6 - (Y - vy) * .2, i, j); return ((Y * 2.2 | 0) % 2) ? ramp(PL.DARK, .1, i, j) : ramp(PL.STEEL, .2, i, j); }
    // кодовий замок: темна панель, кнопки 3×3, вогник (живий)
    if (ins > k0 && ins < k1 && Y > ky0 && Y < ky1) {
      const x = ins - k0, y = Y - ky0, e = Math.min(x, k1 - k0 - x, y, ky1 - ky0 - y); if (e < .3) return ramp(PL.CHROME, .7, i, j);
      if (y > 2 && ((x - .5) % .75) < .45 && ((y - 2) % 1.4) < .8) return ramp(PL.MET, .62, i, j);
      if (y < 1.6 && Math.abs(x - (k1 - k0) / 2) < .5) return E(col('#3bff8a'));
      return ramp(PL.DARK, .2, i, j);
    }
    // панелі з заклепками й легким відсвітом неону
    const pw = 9, ph = 13, cx = Math.floor(ins / pw), cy = Math.floor((Y + 60) / ph), lx = ins - cx * pw, ly = (Y + 60) - cy * ph, hb = hash(cx * 3 + 5, cy * 7 + 1);
    if (lx < .35 || ly < .35) return ramp(PNL, .06, i, j);
    if ((lx < 1.2 || lx > pw - 1.2) && (ly < 1.2 || ly > ph - 1.2)) return ramp(PL.CHROME, .66, i, j);
    let q = (.34 + hb * .12) * L + (ly < 1 ? .1 : 0) - (ly > ph - 1 ? .08 : 0) + Math.max(0, ins - (D - 9)) * .012;
    if (hb > .7 && lx > 2 && lx < pw - 2 && ly > 3 && ly < ph - 3 && ((ly * 1.6) | 0) % 2) q -= .14;            // ґратки
    return ramp(PNL, q, i, j);
  }
  SHP['st:dc_pylon'] = (G, B) => {
    const M = B.dc, { f, r, c } = A.basis(B), sR = M.sR || 1, rs = [r[0] * sR, 0, r[1] * sR];
    const insOf = (p, d) => M.fin + (p[0] - (d ? 0 : c[0])) * f[0] + (p[2] - (d ? 0 : c[1])) * f[1];   // глибина від стіни (decor.py: fin − v)
    G.partF(G.sub(0, B.dep / 2, B.w, B.dep, B.yt, B.yb), Fc => {
      const L = lit(Fc.n, A.centre(Fc)), O = Fc.O, Au = Fc.A, Bv = Fc.B;
      if (Fc.n[0] * rs[0] + Fc.n[2] * rs[2] > .7) {                                     // бокова грань (лицем уздовж антресолі, до глядача)
        const i0 = insOf(O), iu = insOf(Au, 1) - M.fin, iv = insOf(Bv, 1) - M.fin;
        return (u, v, i, j) => pylonSide(M, i0 + iu * u + iv * v, O[1] + Au[1] * u + Bv[1] * v, i, j, L);
      }
      if (Fc.k === 'front') return (u, v, i, j) => {                                    // лицьова: хромові кромки, неон, дисплей, вогники, «обережно»
        const x = u * Fc.fw, Y = O[1] + Bv[1] * v, w = Fc.fw;
        if (x < .7 || x > w - .7) return ramp(PL.CHROME, .82 - Math.min(x, w - x) * .3, i, j);
        if (Y > M.Yb - .9) return ramp(PL.CHROME, .66, i, j); if (Y > M.Yb - 5.5 && Y < M.Yb - 1.6) return HAZ(x, Y, i, j);
        if (Math.abs(x - w / 2) < .45 && Y < M.deck - 8) return E(Math.abs(x - w / 2) < .16 ? N.cyan[2] : N.cyan[1]);
        if (Y > M.deck - 6 && Y < M.deck + 3 && x > 1.4 && x < w - 1.4) {                // дисплей: зелені смужки рівня
          const yy = Y - (M.deck - 6), e = Math.min(x - 1.4, w - 1.4 - x, yy, 9 - yy); if (e < .3) return ramp(PL.CHROME, .7, i, j);
          const bar = Math.floor((x - 1.7) / 1.1), hgt = 2 + 5 * hash(bar, 5); return ((x - 1.7) % 1.1) < .75 && 9 - yy < hgt ? E(hgt > 5.5 ? col('#ffd23a') : col('#3bff8a')) : ramp(pal(['#020a06', '#04140c']), .5, i, j);
        }
        if (Y > M.deck + 5 && Y < M.deck + 15 && Math.abs(x - w / 2) < .7 && ((Y - M.deck - 5) % 2) < 1.1) return ramp(PL.DARK, .1, i, j);   // гнізда вогників (живі)
        for (const [fu, fY, fr] of M.fungi || []) {                                       // (· 5) СВІТНІ ТРУТОВИКИ: півкола-поличками, кільця росту, пластинки знизу світяться
          const dx = (x - w / 2 - fu) / fr, dy = (Y - fY) / (fr * .58); if (dy > .5 || dx * dx + dy * dy > 1) continue;
          if (dy > .22) return E(((x * 3.2) | 0) % 2 ? N.cyan[2] : N.cyan[1]);                                                     // пластинки (світяться)
          const rr = Math.hypot(dx, dy); if (rr > .84) return E(N.cyan[2]);                                                         // світний край
          return ramp(pal(['#06202a', '#0a3440', '#0e4c58', '#167078', '#20969a']), .9 - rr * .6 + (Math.abs(((rr * 4.2) % 1) - .5) < .12 ? -.25 : 0) + (hash(i >> 1, j >> 1) - .5) * .12, i, j);
        }
        const pw = 13, py = Math.floor((Y + 60) / pw), ly = (Y + 60) - py * pw; if (ly < .35) return ramp(PNL, .06, i, j);
        return ramp(PNL, (.4 + hash(py, 3) * .1) * L + (ly < 1 ? .1 : 0), i, j);
      };
      if (Fc.k === 'bottom') return (u, v, i, j) => { const x = u - .5, y = v - .5; if (Math.abs(x) < .3 && Math.abs(y) < .22) return E(Math.abs(x) < .24 && Math.abs(y) < .16 ? col('#fff0c8') : col('#ffb24a'));
        return ((i + j) % 3) ? ramp(PL.STEEL, .2, i, j) : ramp(PL.DARK, .1, i, j); };
      return (u, v, i, j) => ramp(PNL, .3 * L, i, j);
    });
  };
  /** Двері (вікно на пілоні; живе — відчиняються): дві стулки, шви, віконця з теплим світлом, смуга «обережно», вогник. */
  PAINT.dc_door = (c, fw, fh) => {
    const g = c.createLinearGradient(0, 0, fw, 0); g.addColorStop(0, '#1a1840'); g.addColorStop(.5, '#2a2660'); g.addColorStop(1, '#141234'); c.fillStyle = g; c.fillRect(0, 0, fw, fh);
    c.fillStyle = 'rgba(255,255,255,.06)'; for (let y = 3; y < fh - 2; y += 2.2) c.fillRect(.6, y, fw - 1.2, .25);
    c.fillStyle = '#05040f'; c.fillRect(fw / 2 - .25, 0, .5, fh); c.fillStyle = 'rgba(59,232,255,.8)'; c.fillRect(fw / 2 - .08, 1, .16, fh - 2);
    for (const x of [fw * .25, fw * .75]) { c.fillStyle = '#0a0818'; c.beginPath(); c.arc(x, fh * .3, 1.7, 0, 7); c.fill(); const r = c.createRadialGradient(x, fh * .3, 0, x, fh * .3, 1.3); r.addColorStop(0, '#fff0c8'); r.addColorStop(1, '#ff9a3a'); c.fillStyle = r; c.beginPath(); c.arc(x, fh * .3, 1.25, 0, 7); c.fill(); c.fillStyle = '#c8ccdd'; c.fillRect(x - .9, fh * .55, 1.8, .5); }
    for (let x = 0; x < fw; x += 1.6) { c.fillStyle = ((x / 1.6) | 0) % 2 ? '#ffd23a' : '#1a1206'; c.beginPath(); c.moveTo(x, fh * .8); c.lineTo(x + .8, fh * .8); c.lineTo(x + .1, fh * .86); c.lineTo(x - .7, fh * .86); c.closePath(); c.fill(); }
    c.fillStyle = '#3bff8a'; c.fillRect(fw / 2 - .6, .5, 1.2, .5);
  };
  /** Скляна колба з поживним розчином (вікно на пілоні; живе — бульбашки, світло вгору). */
  PAINT.dc_pyg = (c, fw, fh) => {
    const g = c.createLinearGradient(0, 0, 0, fh); g.addColorStop(0, '#05303a'); g.addColorStop(.4, '#0a6a6a'); g.addColorStop(.85, '#18b090'); g.addColorStop(1, '#5af0c0'); c.fillStyle = g; c.fillRect(0, 0, fw, fh);
    const h = c.createLinearGradient(0, 0, fw, 0); h.addColorStop(0, 'rgba(0,10,20,.5)'); h.addColorStop(.35, 'rgba(120,255,220,.18)'); h.addColorStop(.5, 'rgba(200,255,240,.32)'); h.addColorStop(.65, 'rgba(120,255,220,.18)'); h.addColorStop(1, 'rgba(0,10,20,.55)'); c.fillStyle = h; c.fillRect(0, 0, fw, fh);
    for (let k = 0; k < 90; k++) { c.fillStyle = k % 3 ? 'rgba(180,255,230,.7)' : 'rgba(255,255,255,.85)'; c.fillRect(hash(k, 61) * fw, hash(k, 67) * fh, .3, .3); }
    c.fillStyle = 'rgba(230,255,250,.55)'; c.fillRect(fw * .22, 0, .4, fh); c.fillStyle = 'rgba(0,0,0,.25)'; for (let y = fh - 9; y > 0; y -= 9) c.fillRect(0, y, fw, .35);
  };
  // ================= ПЛАКАТ РУДИКА (Декор стін · 4; власник: «плакат Рудика — прикольний, піксельний») =================
  /** Синтвейв-плакат: темна рама з хромом і помаранчевим неоном, захід сонця смугами, сітка-підлога, зорі; напис і підпис —
   *  зі словників (4 мови); сам Рудик (і віруси, яких він «знешкоджує» лазерними очима) — живі, objects/decor.js. */
  PAINT.dc_poster1 = (c, fw, fh) => {
    const T = A.txt, cx = fw / 2, S = Math.min(fw, fh), hz = fh * .64, gb = fh * .845;                  // hz — горизонт, gb — низ сітки
    c.fillStyle = '#1a0c24'; c.fillRect(0, 0, fw, fh);
    const g = c.createLinearGradient(0, 0, 0, hz); g.addColorStop(0, '#0c0624'); g.addColorStop(.45, '#2a0e4a'); g.addColorStop(.8, '#7a1a6a'); g.addColorStop(1, '#d84a5a');
    c.fillStyle = g; c.fillRect(1.3, 1.3, fw - 2.6, hz - 1.3);
    for (let k = 0; k < 70; k++) { const x = 2 + hash(k, 71) * (fw - 4), y = 2 + hash(k, 73) * hz * .55; c.fillStyle = k % 5 ? 'rgba(255,240,255,.75)' : '#ffd27a'; c.fillRect(x, y, k % 7 ? .3 : .55, k % 7 ? .3 : .55); }
    const sy = hz - S * .05, sr = S * .27, sg = c.createLinearGradient(0, sy - sr, 0, sy + sr * .2); sg.addColorStop(0, '#ffe27a'); sg.addColorStop(.5, '#ff8a3a'); sg.addColorStop(1, '#ff3a8a');
    c.save(); c.beginPath(); c.rect(1.3, 1.3, fw - 2.6, hz - 1.3); c.clip();
    c.fillStyle = 'rgba(255,120,200,.16)'; c.beginPath(); c.arc(cx, sy, sr * 1.4, 0, 7); c.fill();
    c.fillStyle = sg; c.beginPath(); c.arc(cx, sy, sr, 0, 7); c.fill();
    c.fillStyle = '#4a1258'; for (let k = 0; k < 6; k++) { const y = sy - sr * .12 + k * sr * .19, hh = .3 + k * .26; c.fillRect(cx - sr, y, sr * 2, hh); }       // смуги сонця
    c.fillStyle = 'rgba(10,4,30,.85)'; for (let k = 0; k < 9; k++) { const x = 1.3 + k * (fw - 2.6) / 8 + (hash(k, 3) - .5) * 2, h = S * (.06 + .12 * hash(k, 5)), w = S * (.05 + .05 * hash(k, 7)); c.fillRect(x - w / 2, hz - h, w, h); }   // силуети міста на горизонті
    c.restore();
    c.fillStyle = '#12052a'; c.fillRect(1.3, hz, fw - 2.6, gb - hz);                                     // сітка-підлога
    c.strokeStyle = 'rgba(255,79,216,.85)'; c.lineWidth = .3;
    for (let k = 0; k < 7; k++) { const t = (k + 1) / 7, y = hz + (gb - hz) * t * t; c.beginPath(); c.moveTo(1.3, y); c.lineTo(fw - 1.3, y); c.stroke(); }
    c.save(); c.beginPath(); c.rect(1.3, hz, fw - 2.6, gb - hz); c.clip();
    for (let k = -8; k <= 8; k++) { c.beginPath(); c.moveTo(cx + k * S * .05, hz); c.lineTo(cx + k * S * .24, gb); c.stroke(); }
    c.restore();
    c.fillStyle = 'rgba(59,232,255,.9)'; c.fillRect(1.3, hz - .2, fw - 2.6, .35);
    c.fillStyle = 'rgba(0,0,0,.45)'; c.beginPath(); c.ellipse(fw * .48, hz + S * .03, S * .25, S * .025, 0, 0, 7); c.fill();       // тінь під котом
    c.fillStyle = '#0a0418'; c.fillRect(1.3, gb, fw - 2.6, fh - 1.3 - gb);                                 // смуга підпису
    T(c, NX.t('decor.rudik.title'), cx, fh * .105, fw - 6, S * .13, '#ffd27a', { glow: '#ff6a2a' });
    c.fillStyle = '#ff9a3a'; for (let k = -2; k <= 2; k++) { const x = cx + k * S * .075, y = fh * .208, r = S * .013; c.beginPath(); c.arc(x, y, r * 1.6, 0, 7); c.fill(); for (const [dx, dy] of [[-1.3, -1.4], [0, -1.9], [1.3, -1.4]]) { c.beginPath(); c.arc(x + dx * r * 1.4, y + dy * r * 1.4, r * .8, 0, 7); c.fill(); } }   // лапки
    T(c, NX.t('decor.rudik.sub'), cx, (gb + fh - 1.3) / 2, fw - 7, (fh - 1.3 - gb) * .55, '#9af6ff', { glow: '#3be8ff' });
    for (const sx of [3.6, fw - 3.6]) { const y = (gb + fh - 1.3) / 2; c.fillStyle = '#ffd27a'; c.beginPath(); for (let q = 0; q < 10; q++) { const a = q / 10 * Math.PI * 2 - Math.PI / 2, rr = q % 2 ? .4 : .95; c.lineTo(sx + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.closePath(); c.fill(); }   // зірочки
    c.strokeStyle = '#c8c8e0'; c.lineWidth = .45; c.strokeRect(1.5, 1.5, fw - 3, fh - 3);
    c.strokeStyle = '#ff8a3a'; c.lineWidth = .3; c.strokeRect(2.3, 2.3, fw - 4.6, fh - 4.6);
    for (const [x, y] of [[2.6, 2.6], [fw - 2.6, 2.6], [2.6, fh - 2.6], [fw - 2.6, fh - 2.6]]) { c.fillStyle = '#e8e8f8'; c.beginPath(); c.arc(x, y, .5, 0, 7); c.fill(); }
  };

  // ================= ШТУЧКИ БОТАНІКА =================
  const BOOK = ['#c84a8a', '#4a8ad0', '#d8a030', '#6a4ac0', '#3aa858', '#d05a3a'];
  const MOSS = pal(['#0a3a2a', '#0f5a3a', '#1a8a4a', '#2ac05a', '#5af08a', '#b0ffc8']);
  /** Золота статуетка Nexi: спрайт персонажа (js/actors/nexi/sprite.js), перефарбований у золото за яскравістю. */
  let GOLDBOT;
  function goldBot() {
    if (GOLDBOT !== undefined) return GOLDBOT;
    GOLDBOT = null;
    try {
      if (typeof renderBot !== 'function') return null;
      const cv = document.createElement('canvas'); renderBot(Object.assign({}, DEFAULT_LOOK), poseFor('spin', 0, false), 0, cv);
      const W = cv.width, H = cv.height, d = new Uint32Array(cv.getContext('2d').getImageData(0, 0, W, H).data.buffer);
      let x0 = W, x1 = -1, y0 = H, y1 = -1; for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) if ((d[j * W + i] >>> 24) > 100) { x0 = Math.min(x0, i); x1 = Math.max(x1, i); y0 = Math.min(y0, j); y1 = Math.max(y1, j); }
      if (x1 < 0) return null;
      const sw = x1 - x0 + 1, sh = y1 - y0 + 1, out = new Uint32Array(sw * sh), GP = PL.GOLD;
      for (let j = 0; j < sh; j++) for (let i = 0; i < sw; i++) { const c = d[(j + y0) * W + i + x0]; if ((c >>> 24) < 100) continue; const l = X.lum(c);
        out[j * sw + i] = l < .1 ? col('#2a1604') : ramp(GP, Math.min(1, .12 + l * 1.15 + (i < sw * .45 ? .06 : 0)), i, j); }
      GOLDBOT = { d: out, sw, sh };
    } catch (e) { GOLDBOT = null; }
    return GOLDBOT;
  }
  /** Скляна грань: дірки, крім рамок (mull), відблисків і крапель конденсату. */
  const glassSh = (fw, fh, mull = 1) => (u, v, i, j) => {
    const x = u * fw, y = v * fh;
    if (x < .35 || x > fw - .35 || y < .35 || y > fh - .35) return ramp(PL.CHROME, .7, i, j);
    if (mull && (Math.abs(x - fw / 2) < .25 || Math.abs(y - fh * .5) < .22)) return ramp(PL.CHROME, .55, i, j);
    const dg = ((x - y * .65) % 7 + 7) % 7; if (dg < .32) return col('#d8f4ff');
    if (hash(i, j) > .984) return col('#e8fbff');                                                 // конденсат
    return (i + 2 * j) % 5 === 0 ? col('#9ad8f0') : 0;                                            // ледь тоноване скло (рідкий дизеринг)
  };
  SHP['st:dc_art'] = (G, B) => {
    const d = B.dc, k = d.kind, c = G.P(0, B.dep / 2, B.yb), w = B.w, H = B.yb - B.yt;
    const cylAt = (x, y0, y1, r, extra = {}) => Object.assign({ x, z: c[2] - r, turn: 0, w: r * 2, dep: r * 2, yt: y0, yb: y1, cyl: 14 }, extra);
    if (k === 'books') {                                                              // книжки рядком (кожна свого кольору) і підпірка-кристал
      let u = -w / 2 + .5, n = 0;
      while (u < w / 2 - 2.6 && n < 6) { const bw = 1.4 + hash(d.seed, n) * .9, bh = H * (.62 + .36 * hash(n, d.seed + 3)), cc = BOOK[n % BOOK.length];
        G.partF(G.sub(u + bw / 2, B.dep / 2, bw, B.dep * .8, B.yb - bh, B.yb), Fc => { const L = lit(Fc.n, A.centre(Fc)); return (uu, vv) => { const base = col(cc), q = Fc.k === 'front' ? (Math.abs(vv - .2) < .05 || Math.abs(vv - .8) < .05 ? .25 : 0) : -.2; return q > 0 ? mixc(base, col('#ffe9b0'), .6) : dim(base, (.62 + q) * L); }; });
        u += bw + .15; n++; }
      G.partF(G.sub(w / 2 - 1.3, B.dep / 2, 1.8, 1.8, B.yb - H * .45, B.yb), () => (uu, vv, i, j) => E(ramp(pal(['#4a1a8a', '#8a3ad8', '#c88aff', '#f0d8ff']), .9 - vv * .5 - Math.abs(uu - .4), i, j)));
      return;
    }
    if (k === 'orb') {                                                                // кришталева куля на золотій підставці
      G.part(cylAt(c[0], B.yb - 1.6, B.yb, w * .3), 'gold', {});
      G.disc([c[0], B.yb - 1.6 - w * .36, c[2] - .2], w * .38, (u, v, i, j) => { const r = Math.hypot(u - .5, v - .5) * 2; return r < .35 ? E(ramp(pal(['#4a1a8a', '#8a3ad8', '#c88aff', '#f0d8ff']), 1 - r * 1.6, i, j)) : (u < .4 && v < .35 && r > .5 ? col('#eef2ff') : ramp(pal(['#100830', '#241460', '#3a2a90', '#5a4ac0']), .8 - r * .5, i, j)); });
      return;
    }
    if (k === 'terrarium') {                                                          // куля-тераріум: світний мох і паросток
      const r = Math.min(w, H) * .46, cy = B.yb - r;
      G.part(cylAt(c[0], B.yb - 1.2, B.yb, r * .62), 'dark', {});
      G.disc([c[0], cy, c[2] - .2], r, (u, v, i, j) => { const rr = Math.hypot(u - .5, v - .5) * 2;
        if (rr > .86) return ramp(PL.GLASS, .7, i, j); if (u < .38 && v < .32 && rr > .55) return col('#dff4ff');
        if (v > .62) return E(ramp(MOSS, .4 + hash(i >> 1, j >> 1) * .5 - (v - .62), i, j));
        if (Math.abs(u - .5) < .05 && v > .35) return col('#5af08a'); if (v > .3 && v < .45 && Math.abs(u - .5 + (v - .38) * 1.5) < .1) return col('#7cf0a0');
        return ramp(pal(['#06121e', '#0a1e2e', '#10283a']), .5, i, j); });
      return;
    }
    if (k === 'flask') {                                                              // колба: світна рідина, з горлечка — паросток (два листочки)
      const r = w * .42, neck = r * .34, yN = B.yb - H * .55;
      G.partF(cylAt(c[0], yN, B.yb, r, { kt: .36 }), Fc => Fc.k === 'side' ? (u, v, i, j) => v > .45 ? E(ramp(MOSS, .55 + (v - .45) * .6 - Math.abs(u - .5) * .3, i, j)) : (Math.abs(u - .3) < .05 ? col('#e8f6ff') : ramp(PL.GLASS, .45, i, j)) : (u, v, i, j) => ramp(PL.GLASS, .4, i, j));
      G.part(cylAt(c[0], B.yt + H * .2, yN + .2, neck), 'glass', {});
      const s0 = [c[0], B.yt + H * .22, c[2] - neck - .3], s1 = [c[0] + .4, B.yt + .9, c[2] - neck - .3];
      G.tube(s0, s1, .45, (u, v, i, j) => ramp(pal(['#1a5a2a', '#3a9a4a', '#7ad87a']), .7 - Math.abs(u - .4), i, j));
      for (const s of [-1, 1]) G.disc([s1[0] + s * 1.1, s1[1] + .3, s1[2] - .1], .9, (u, v, i, j) => ramp(pal(['#1a6a2a', '#3aa84a', '#7ae87a', '#c8ffb0']), .85 - Math.hypot(u - .4, v - .4), i, j));
      return;
    }
    if (k === 'scope') {                                                              // мікроскоп
      G.part(G.sub(0, B.dep / 2, w * .9, B.dep * .8, B.yb - 1.4, B.yb), 'dark', {});
      const b = G.P(w * .25, B.dep * .6, B.yb - 1.4), t = G.P(w * .2, B.dep * .55, B.yt + H * .25);
      G.tube(b, t, 1.4, steelT); G.tube(G.P(-w * .05, B.dep * .5, B.yt + H * .55), G.P(-w * .25, B.dep * .4, B.yt + .6), 1.8, brassT);
      G.part(G.sub(-w * .08, B.dep * .45, w * .55, B.dep * .5, B.yb - H * .4, B.yb - H * .35), 'dark', {});
      G.disc(G.P(-w * .27, B.dep * .4, B.yt + .5), .9, (u, v, i, j) => ramp(PL.GOLD, .7 - v * .4, i, j));
      G.disc(G.P(-w * .05, B.dep * .3, B.yb - H * .38), .6, () => E(N.cyan[2]));                // підсвітка предметного столика
      return;
    }
    if (k === 'figure') {                                                             // ЗОЛОТА СТАТУЕТКА NEXI на мармуровому п'єдесталі
      const pr = w * .3, pb = 2.6;
      G.part(cylAt(c[0], B.yb - pb, B.yb, pr, { kb: 1.1 }), 'stone', { pal: PL.STONE, q: .55 });
      G.partF(cylAt(c[0], B.yb - pb - .5, B.yb - pb + .1, pr * 1.08), () => (u, v, i, j) => E(ramp(PL.GOLD, .8 - v * .3, i, j)));
      const S = goldBot(), fh = H - pb - .6, fw = S ? Math.min(w * .9, fh * S.sw / S.sh) : w * .6;
      spriteFace(G, goldBot, c[0], c[2] - .3, B.yb - pb - .5 - fh, B.yb - pb - .5, fw, false);
      return;
    }
    if (k === 'staghorn') {                                                           // ПЛАТИЦЕРІУМ на дубовій дошці: фаска, волокна, латунні гвинти, моховий пад
      const D = B.dep, pl = G.sub(0, D - .8, w * .66, 1.3, B.yt + H * .12, B.yb - H * .06);                       // (· 5) дошка менша — рослина ширша за неї
      G.partF(pl, Fc => { const L = lit(Fc.n, A.centre(Fc)), WP = pal(['#1a0c06', '#2e180c', '#442612', '#5c361a', '#764824', '#905c30', '#aa723e']);
        return (u, v, i, j) => { const x = u * Fc.fw, y = v * Fc.fh, e = Math.min(x, Fc.fw - x, y, Fc.fh - y); if (Fc.k === 'front' && e < .7) return ramp(WP, .75 * L - (e < .3 ? .2 : 0), i, j);
          if (Fc.k === 'front' && (Math.abs(x - 1.4) < .35 || Math.abs(x - Fc.fw + 1.4) < .35) && (Math.abs(y - 1.4) < .35 || Math.abs(y - Fc.fh + 1.4) < .35)) return ramp(PL.GOLD, .8, i, j);
          return ramp(WP, (.42 + Math.sin(y * 2.2 + Math.sin(x * .4) * 1.5) * .08) * L, i, j); }; });
      const v = D - 1.7, cc = G.P(0, v, (B.yt + B.yb) / 2), bw = bbW(G, B, v);
      G.disc([cc[0], cc[1] + H * .1, cc[2] + .2], Math.min(bw, H) * .2, (u, vv, i, j) => ramp(MAT.moss, .4 + (hash(i >> 1, j >> 1) - .5) * .4, i, j));
      plantFace(G, { kind: d.plant || 'staghorn', seed: d.seed || 141 }, cc[0], cc[2], B.yt + .3, B.yb - .3, bw * .96, false);
      return;
    }
    if (k === 'greenhouse') {                                                         // МІНІ-ОРАНЖЕРЕЯ: цоколь, скло з рамами й конденсатом, двосхилий дах, орхідея, фітолампа
      const pl = 3.2, yP = B.yb - pl, eave = B.yt + H * .3, ridge = B.yt + .4, dd = B.dep, P = (u, v, y) => G.P(u, v, y), hw = w / 2;
      const rU = sub(G.P(1, 0, 0), G.P(0, 0, 0)), nF = sub(G.P(0, 0, 0), G.P(0, 1, 0)), neg = v => v.map(q => -q);
      G.partF(G.sub(0, dd / 2, w + .4, dd + .4, yP, B.yb), Fc => { const L = lit(Fc.n, A.centre(Fc)); return (u, v, i, j) => (Fc.k !== 'top' && Fc.k !== 'bottom' && Math.abs(v * Fc.fh - 1.3) < .32) ? E(N.cyan[1]) : ramp(PL.STEEL, .36 * L + (v < .2 ? .14 : 0), i, j); });
      const pc = G.P(0, dd / 2, yP);
      plantFace(G, { kind: d.plant || 'orchid', seed: d.seed || 27 }, pc[0], pc[2], ridge + 2.6, yP + .2, w * .92, false);
      quad(G, [P(-hw, dd - .15, eave), P(hw, dd - .15, eave), P(hw, dd - .15, yP), P(-hw, dd - .15, yP)], (u, v, i, j) => ((i + j) & 1) ? 0 : E(X.mixc(col('#3a1050'), col('#ff6ae0'), .25 + .35 * (1 - v))), nF);   // задня стінка: рожеве світло фітолампи
      G.tube(P(-hw * .7, dd / 2, ridge + 2.1), P(hw * .7, dd / 2, ridge + 2.1), .8, (u) => E(col(u > .3 && u < .7 ? '#ffc4f2' : '#ff4fd8')));
      for (const [uu, vv] of [[-hw, 0], [hw, 0], [-hw, dd], [hw, dd]]) G.tube(P(uu, vv, yP), P(uu, vv, eave), .7, chromeT);
      for (const vv of [0, dd]) G.tube(P(-hw, vv, eave), P(hw, vv, eave), .7, chromeT);
      G.tube(P(-hw, dd / 2, ridge), P(hw, dd / 2, ridge), .8, chromeT);
      for (const uu of [-hw, hw]) for (const vv of [0, dd]) G.tube(P(uu, vv, eave), P(uu, dd / 2, ridge), .6, chromeT);
      const gH = yP - eave;
      quad(G, [P(-hw, 0, eave), P(hw, 0, eave), P(hw, 0, yP), P(-hw, 0, yP)], glassSh(w, gH), nF);
      quad(G, [P(-hw, dd, eave), P(-hw, 0, eave), P(-hw, 0, yP), P(-hw, dd, yP)], glassSh(dd, gH), neg(rU));
      quad(G, [P(hw, 0, eave), P(hw, dd, eave), P(hw, dd, yP), P(hw, 0, yP)], glassSh(dd, gH), rU);
      const rs = Math.hypot(dd / 2, eave - ridge), nRoof = X.newell([P(-hw, 0, eave), P(hw, 0, eave), P(hw, dd / 2, ridge)]);
      const nR = (() => { const l = Math.hypot(...nRoof) || 1, n = nRoof.map(q => q / l); return n[1] > 0 ? neg(n) : n; })();
      quad(G, [P(-hw, dd / 2, ridge), P(hw, dd / 2, ridge), P(hw, 0, eave), P(-hw, 0, eave)], glassSh(w, rs, 0), nR);
      for (const [uu, nn] of [[-hw, neg(rU)], [hw, rU]]) G.face([P(uu, 0, eave), P(uu, dd, eave), P(uu, dd / 2, ridge)], P(uu, 0, eave), sub(P(uu, dd, eave), P(uu, 0, eave)), [0, ridge - eave, 0], glassSh(dd, eave - ridge, 0), nn);
      return;
    }
  };

  // ================= (· 5) МОХОВИЙ КОРЧ-ПОЛИЦЯ (сегмент дуги) =================
  const DRIFT = pal(['#16120e', '#2a241e', '#3e372e', '#565046', '#6e685c', '#888274', '#a49e8e', '#c4beae']);   // вибілений сріблясто-сірий корч
  const FUR = pal(['#2a1406', '#46240c', '#683814', '#8a4e20', '#ac6a32', '#c88a4e', '#deac78', '#f0d4a8']);    // кореневища-«лапки» даваллії
  const LICH = pal(['#2e3e38', '#4a5e56', '#6a8478', '#90aa9c', '#bcd2c6']);
  const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  /** Точка корча: сегмент M (decor.py: sa, sb, s0 — довжина від початку, DI — вісь від стіни), s — довжина від початку
   *  всього корча, ins — на скільки од. від осі в кімнату, dy — униз. -> {c, r, a}. Та сама в objects/decor_live.js (равлик). */
  function driftAt(M, s, ins = 0, dy = 0) {
    const sg = M.sgn, C = M.C, ra = M.R - M.DI, len = M.len || (M.len = 2 * ra * Math.sin(Math.abs(M.sb - M.sa) * D2R / 2));   // хорда сегмента (як у decor.py)
    const f = Math.max(0, Math.min(1, (s - M.s0) / len)), a = M.sa + (M.sb - M.sa) * f, rr = M.R - M.DI - ins, tp = Math.min(1, s / 2.2, (M.tot - s) / 2.2);
    const r = M.dr * (1 - .16 * Math.sin(s * .41 + .7) ** 2) * (.55 + .45 * Math.max(0, tp));
    return { c: [C[0] + sg * rr * Math.sin(a * D2R), M.Yc + .35 * Math.sin(s * .29 + 1.3) + .18 * Math.sin(s * .83 + .4) + dy, C[1] + rr * Math.cos(a * D2R)], r, a };
  }
  NX.arc.driftAt = driftAt;
  SHP['st:dc_drift'] = (G, B) => {
    const M = B.dc, N = 5, sd = M.seed || 77, P = []; driftAt(M, M.s0); const len = M.len;
    for (let k = 0; k <= N; k++) { const s = M.s0 + len * k / N; P.push(Object.assign(driftAt(M, s), { s })); }
    const E3 = [PZ.VP[0], PZ.VP[1], -PZ.D];
    for (let k = 1; k <= N; k++) {                                                    // стовбур: стрічки до ока, верх — мох, тріщини вздовж
      const a = P[k - 1], b = P[k], m = a.c.map((q, n) => (q + b.c[n]) / 2), pp = cross3(sub(b.c, a.c), sub(E3, m)), top0 = pp[1] < 0;
      G.tube(a.c, b.c, a.r + b.r, (u, v, i, j) => {
        const up = top0 ? u : 1 - u, s = a.s + (b.s - a.s) * v;
        if (up < .24 && hash((s * 2.2) | 0, 7) > .3) return ramp(MAT.moss, .62 + hash(i >> 1, j >> 1) * .3 - up * 1.2, i, j);   // мох на верху
        if (up < .34 && hash(i >> 1, (j >> 1) + 3) > .8) return ramp(LICH, .6, i, j);                                          // лишайник
        const cr = Math.abs(Math.sin(up * 8.5 + Math.sin(s * .6 + sd) * 1.5)) < .13 && hash((s * 1.6) | 0, (up * 5) | 0) > .25;   // тріщини
        const kn = Math.hypot(((s + sd) % 7.3) - 3.6, (up - .55) * 5) < .5;                                                    // сучок
        return ramp(DRIFT, .22 + (1 - Math.abs(up - .32) * 1.7) * .55 - (cr ? .3 : 0) - (kn ? .22 : 0) + (hash(i >> 1, j) - .5) * .06, i, j);
      });
      if (k < N || M.i === M.n - 1) G.disc(b.c, b.r * .98, (u, v, i, j) => ramp(DRIFT, .62 - v * .45 - Math.hypot(u - .45, v - .4) * .3, i, j));   // стики (без щілин на дузі)
    }
    if (M.i === 0) G.disc(P[0].c, P[0].r * .98, (u, v, i, j) => { const rr = Math.hypot(u - .5, v - .5) * 2; return ramp(DRIFT, .7 - rr * .3 - (Math.abs(rr - .5) < .08 ? .2 : 0), i, j); });   // зріз-торець: кільця
    for (let q = 0; q < 7; q++) {                                                     // мохові подушки над стовбуром (горбки силуету) і лишайник знизу
      const s = M.s0 + len * (q + .5) / 7, h = hash(sd + M.i * 7, q);
      if (h > .35) { const p = driftAt(M, s, .3, 0); G.disc([p.c[0], p.c[1] - p.r * .78, p.c[2]], .42 + .34 * hash(q, sd), (u, v, i, j) => ramp(MAT.moss, .75 - v * .5 + hash(i >> 1, j >> 1) * .2, i, j)); }
      if (h < .3) { const p = driftAt(M, s, .2, 0), y0 = p.c[1] + p.r * .8, l = .4 + .35 * hash(q + 3, sd);                // бородатий лишайник: тонкий, блідий
        G.tube([p.c[0], y0, p.c[2]], [p.c[0] + .15, y0 + l, p.c[2]], .14, (u, v, i, j) => (i + j) & 1 ? ramp(LICH, .85 - v * .3, i, j) : 0); }
    }
    if (M.i === 1 || M.i === M.n - 2) {                                               // латунний кронштейн: пластина на стіні, полиця під корчем, підкіс
      const s = M.s0 + len * .5, p = driftAt(M, s), w0 = driftAt(M, s, -M.DI + .06, .2).c, w1 = driftAt(M, s, -M.DI + .06, 2.3).c;
      G.tube(w0, [p.c[0], p.c[1] + p.r * .7, p.c[2]], .5, brassT); G.tube(w1, driftAt(M, s, .2, p.r * .75).c, .42, brassT);
      G.disc(w0, .62, (u, v, i, j) => Math.hypot(u - .5, v - .5) < .16 ? ramp(PL.DARK, .3, i, j) : ramp(PL.GOLD, .75 - v * .4, i, j));
    }
    if (M.plant || M.fr > 0 || M.i < 3) {                                              // ДАВАЛЛІЯ «заяча лапка»: пухнасті кореневища по корчу й дрібні мереживні вайї
      for (let q = 0; q < 3; q++) { if (hash(sd + M.i, q + 11) < .3) continue;
        const s0 = M.s0 + len * (.15 + .3 * q), s1 = s0 + 1.6 + hash(q, M.i) * 1.2, a = driftAt(M, s0, .55, -.15), b = driftAt(M, s1, .9, a.r * .55);
        const top = [a.c[0], a.c[1] - a.r * .72, a.c[2]], end = [b.c[0], b.c[1] - b.r * .1, b.c[2]];
        G.tube(top, end, .78, (u, v, i, j) => { const tip = hash(i, j) > .72; return tip ? ramp(FUR, .85, i, j) : ramp(FUR, .3 + (1 - Math.abs(u - .4) * 2) * .45 + (hash(i >> 1, j) - .5) * .2, i, j); });
        G.disc(end, .42, (u, v, i, j) => ramp(FUR, .7 - v * .4 + (hash(i, j) - .5) * .25, i, j));
        const f = driftAt(M, s0 + .4, .35, 0), fh = .9 + Math.max(0, M.fr || 0) * .8;     // вайя над «лапкою»: стрижень і мереживні частки
        const f0 = [f.c[0], f.c[1] - f.r * .8, f.c[2]], f1 = [f0[0], f0[1] - fh, f0[2] + (q - 1) * .3];
        G.tube(f0, f1, .16, (u, v, i, j) => ramp(pal(['#1a3a14', '#2e5a22', '#4a7a32']), .6, i, j));
        G.disc([f1[0], f1[1] + fh * .35, f1[2]], fh * .42, (u, v, i, j) => { const x = (u - .5) * 6, y = v * 5; if (Math.abs(x) > 2.6 * (1 - v * .6) + .3) return 0;
          return hash((x * 2) | 0, (y * 2) | 0) > .42 ? ramp(pal(['#0c3216', '#165024', '#227036', '#38924a', '#5cb46a']), .45 + (1 - v) * .4, i, j) : 0; });
      }
    }
  };

  // ================= СОТИ-ПОЛИЦІ (шестигранні комірки) =================
  /** Візерунок задньої стінки соти pat (0..9 — кожна сота свій): 0 — нічого, 1 — лінія, 2 — вогник. x, y — од. від середини. */
  const PATF = [
    (x, y) => { const g = 2.3, cx = Math.round(x / g), cy = Math.round(y / g), dx = x - cx * g, dy = y - cy * g;              // друкована плата
      if (Math.hypot(dx, dy) < .5 && hash(cx, cy + 3) > .62) return 2; if (Math.abs(dy) < .2 && hash(cx, cy) > .42) return 1; if (Math.abs(dx) < .2 && hash(cx + 9, cy) > .56) return 1; return 0; },
    (x, y) => { const g = 1.7, dx = ((x % g) + g) % g - g / 2, dy = ((y % g) + g) % g - g / 2; return dx * dx + dy * dy < .17 ? (hash(Math.round(x / g), Math.round(y / g)) > .86 ? 2 : 1) : 0; },   // точкова матриця
    (x, y) => ((((x + y) % 2.4) + 2.4) % 2.4) < .7 ? 1 : 0,                                                               // діагональні смуги
    (x, y) => { const sy = 2.4 * .866, r = Math.round(y / sy), off = (r & 1) * 1.2, c = Math.round((x - off) / 2.4), d = Math.hypot(x - off - c * 2.4, y - r * sy); return Math.abs(d - .95) < .2 ? 1 : 0; },   // дрібні соти
    (x, y) => { const r = Math.hypot(x, y); return r < .7 ? 2 : (r % 2) < .38 ? 1 : 0; },                                     // кола
    (x, y) => { const r = Math.hypot(x, y), a = Math.atan2(y, x); return r > 1.6 && ((a / (Math.PI * 2) * 16 % 1) + 1) % 1 < .24 ? 1 : r < 1 ? 2 : 0; },   // промені
    (x, y) => ((((y + Math.sin(x * 1.2) * .8) % 2.2) + 2.2) % 2.2) < .45 ? 1 : 0,                                           // хвилі
    (x, y) => ((((y + Math.abs(x) * .8) % 2.6) + 2.6) % 2.6) < .6 ? 1 : 0,                                                 // шеврони
    (x, y) => { const cx = Math.floor(x / .95), cy = Math.floor(y / .95), h = hash(cx + 40, cy); return h > .82 ? 2 : h > .5 && ((x / .95) % 1 + 1) % 1 > .15 && ((y / .95) % 1 + 1) % 1 > .15 ? 1 : 0; },   // двійковий код
    (x, y) => { const r = Math.hypot(x, y), a = Math.atan2(y, x); if (hash(Math.round(x), Math.round(y) + 7) > .97 && r < 6) return 2; return (r % 2.2) < .26 || (a > .2 && a < .9 && r < 7) ? 1 : 0; },   // радар
  ];
  SHP['st:dc_hex'] = (G, B) => {
    const d = B.dc, nc = neonX(d.neon || '#3be8ff'), Ro = B.w / 2, Ri = Ro - 1.6 / .866, dep = B.dep, Yc = (B.yt + B.yb) / 2, pf = PATF[(d.pat || 0) % PATF.length];
    const V = (R, k, v) => { const th = k * Math.PI / 3; return G.P(R * Math.cos(th), v, Yc + R * Math.sin(th)); };
    const rU = sub(G.P(1, 0, 0), G.P(0, 0, 0)), nF = sub(G.P(0, 0, 0), G.P(0, 1, 0));
    const dirN = k => { const ph = (k + .5) * Math.PI / 3, cs = Math.cos(ph), sn = Math.sin(ph); return [rU[0] * cs, sn, rU[2] * cs]; };
    const BASE = pal(['#0a0820', '#120e30', '#1a1542', '#241c56', '#30266c', '#3e3284', '#50429e']), tint = mixc(BASE[3], nc[0], .6), line = mixc(BASE[5], nc[1], .55);
    // задня стінка з візерунком (тьмяно підсвічена неоном комірки)
    const bp = [0, 1, 2, 3, 4, 5].map(k => V(Ri + .05, k, dep - .3)), O = G.P(-Ri, dep - .3, Yc - Ri * .866);
    G.face(bp, O, sub(G.P(Ri, dep - .3, Yc - Ri * .866), O), [0, 2 * Ri * .866, 0], (u, v, i, j) => {
      const x = (u - .5) * 2 * Ri, y = (v - .5) * 2 * Ri * .866, p = pf(x, y), vg = .38 + (1 - v) * .22;
      if (p === 2) return E(nc[(i + j) % 3 ? 1 : 2]); if (p === 1) return mixc(ramp(BASE, vg + .15, i, j), line, .7);
      return mixc(ramp(BASE, vg, i, j), tint, .3);
    }, nF);
    const shH = Math.min(Yc + Ro * .866 + 6, d.shy || 1e9); if (shH > Yc + Ro * .7) ditherFace(G, G.P(-Ro * .75, dep + .4, Yc + Ro * .7), G.P(Ro * .75, dep + .4, Yc + Ro * .7), G.P(-Ro * .75, dep + .4, shH), nF, (u, v) => .4 * Math.pow(1 - v, 1.4) * Math.min(1, Math.min(u, 1 - u) * 5));   // тінь соти на стіні (не на зони)
    for (let k = 0; k < 6; k++) {
      const k1 = (k + 1) % 6, n = dirN(k), ni = n.map(q => -q), Lo = lit(n, V(Ro, k, 0)), Li = lit(ni, V(Ri, k, 0));
      const i0 = V(Ri, k, 0), i1 = V(Ri, k1, 0), i3 = V(Ri, k, dep - .3);                    // внутрішня стінка: тьмяна сталь, відсвіт неону біля краю, LED-смужка під «стелею»
      G.face([i0, i1, V(Ri, k1, dep - .3), i3], i0, sub(i1, i0), sub(i3, i0), (u, v, i, j) => {
        if (k === 4 && v > .06 && v < .15 && u > .12 && u < .88) return E(nc[2]);
        return mixc(ramp(PL.MET, .26 * Li + (1 - v) * .12, i, j), nc[1], .16 * (1 - v));
      }, ni);
      const o0 = V(Ro, k, 0), o1 = V(Ro, k1, 0), o3 = V(Ro, k, dep);                          // зовнішня стінка: темна сталь із заклепками
      G.face([o0, o1, V(Ro, k1, dep), o3], o0, sub(o1, o0), sub(o3, o0), (u, v, i, j) => {
        const x = u * Ro, dd = v * dep; if ((Math.abs(x - 1.3) < .35 || Math.abs(x - Ro + 1.3) < .35) && Math.abs(dd - 1.4) < .35) return ramp(PL.CHROME, .7, i, j);
        return ramp(PL.STEEL, .3 * Lo + (v < .1 ? .14 : 0), i, j);
      }, n);
      G.face([o0, o1, i1, i0], o0, sub(o1, o0), sub(i0, o0), (u, v, i, j) => {               // кромка: хром — НЕОН — хром
        if (v < .2) return ramp(PL.CHROME, .78 - v, i, j); if (v > .8) return ramp(PL.CHROME, .5, i, j);
        if (v > .38 && v < .62) return E(v > .45 && v < .55 ? nc[2] : nc[1]);
        return ramp(PL.DARK, .25, i, j);
      }, nF);
    }
  };

  // ================= АКВАРІУМ №1: РИФ (секція дуги) =================
  SHP['st:dc_reef'] = (G, B) => {
    const d = B.dc, w = B.w, dep = B.dep, top = d.top, bot = d.bot, lid = d.lid, base = d.base, sg = d.sgn;
    G.partF(G.sub(0, dep / 2, w + .02, dep, top - lid, top), Fc => {                        // кришка: хром, рожевий неон, «місячна» LED-лінійка над склом
      if (Fc.k === 'bottom' || Fc.k === 'top') return null; const L = lit(Fc.n, A.centre(Fc));
      if (Fc.k === 'front') return (u, v, i, j) => { const y = v * lid, x = d.s0 + u * Fc.fw;
        if (y < .7) return ramp(PL.CHROME, .85 - y * .4, i, j); if (y > lid - .9) return E(((x * 1.3) | 0) % 4 ? col('#bfe8ff') : col('#ffffff'));
        if (Math.abs(y - 2.2) < .3) return E(N.pink[1]); return ramp(PL.MET, .4 * L + (y < 1.4 ? .1 : 0), i, j); };
      return (u, v, i, j) => ramp(PL.MET, .38 * L, i, j);
    });
    G.partF(G.sub(0, dep / 2, w + .02, dep, bot, bot + base), Fc => {                       // тумба: рама скла, бузковий неон, дверцята з ручками й ґратками
      if (Fc.k === 'top') return null; const L = lit(Fc.n, A.centre(Fc));
      if (Fc.k === 'front') return (u, v, i, j) => { const y = v * base, x = d.s0 + u * Fc.fw, pc = ((x % 13) + 13) % 13;
        if (y < .6) return ramp(PL.CHROME, .72, i, j); if (y < 1.3) return ramp(PL.DARK, .2, i, j);
        if (Math.abs(y - 2) < .3) return E(N.lil[1]);
        if (pc < .4) return ramp(PL.STEEL, .08, i, j);
        if (y > 3 && y < base - .9 && Math.abs(pc - 11.6) < .3) return ramp(PL.CHROME, .8, i, j);
        if (y > 3.2 && y < base - 1.2 && pc > 2 && pc < 9 && (y * 1.6) % 1 < .45) return ramp(PL.STEEL, .12, i, j);
        return ramp(PL.NAVY, .45 * L + (y < 2.5 ? .08 : 0), i, j); };
      if (Fc.k === 'bottom') return (u, v, i, j) => v < .14 ? E(N.cyan[(i + j) % 4 ? 1 : 2]) : ramp(PL.STEEL, .22 + (1 - v) * .1, i, j);
      return (u, v, i, j) => ramp(PL.NAVY, .36 * L, i, j);
    });
    const nW = sub(G.P(0, 0, 0), G.P(0, 1, 0));                                                // тінь під тумбою на стіні
    const shR = Math.min(bot + base + 9, d.shy || bot + base + 9); if (shR > bot + base) ditherFace(G, G.P(-w / 2 - .1, dep + .15, bot + base - 1), G.P(w / 2 + .1, dep + .15, bot + base - 1), G.P(-w / 2 - .1, dep + .15, shR), nW, (u, v) => .4 * Math.pow(1 - v, 1.6));
    const endWall = u => G.partF(G.sub(u, dep / 2, 1.2, dep, top - lid, bot + base), Fc => { const L = lit(Fc.n, A.centre(Fc));   // торцева стінка: рама з неоном
      return (uu, v, i, j) => { const y = v * Fc.fh; return Fc.k !== 'top' && Fc.k !== 'bottom' && Math.abs(uu * Fc.fw - Fc.fw * .5) < .3 && y > lid && y < Fc.fh - base ? E(N.pink[1]) : ramp(PL.MET, .38 * L + .06, i, j); }; });
    if (d.i === 0) endWall(-sg * (w / 2 - .6)); if (d.i === d.n - 1) endWall(sg * (w / 2 - .6));
  };

  // ================= АКВАРІУМ №2: МЕДУЗАРІЙ (колона) =================
  SHP['st:dc_column'] = (G, B) => {
    const d = B.dc, r = d.r, c = G.P(0, B.dep / 2, 0), cx = c[0], cz = c[2], yt = B.yt, yb = B.yb, cap = d.cap, base = d.base;
    const cylP = (rad, y0, y1, o = {}) => Object.assign({ x: cx, z: cz - rad, turn: 0, w: rad * 2, dep: rad * 2, yt: y0, yb: y1, cyl: 28 }, o);
    G.partF(cylP(r + 2.2, yb - base, yb - 2), Fc => {                                        // цоколь: рожевий неон, ґратки, блакитна смуга
      if (Fc.k === 'top') return null; if (Fc.k === 'bottom') return (u, v, i, j) => ramp(PL.STEEL, .2, i, j);
      const sh = A.shader('base', Fc, cylP(r + 2.2, yb - base, yb - 2), {}), vent = Fc.i % 4 === 1;
      return (u, v, i, j, t) => { const y = v * Fc.fh; if (y < .7) return ramp(PL.CHROME, .82, i, j); if (Math.abs(y - 1.7) < .36) return E(N.pink[1]);
        if (Math.abs(y - Fc.fh + 1.3) < .3) return E(N.cyan[1]); if (vent && y > 3 && y < Fc.fh - 2.4 && (y * 1.5) % 1 < .45) return ramp(PL.STEEL, .1, i, j); return sh(u, v, i, j, t); };
    });
    G.part(cylP(r + 3, yb - 2, yb, { kb: 1.05 }), 'base', { q: .5 });                        // нижня сходинка
    G.partF(cylP(r + 1.7, yt, yt + cap), Fc => {                                              // корона: хром, блакитне кільце знизу
      if (Fc.k === 'top' || Fc.k === 'bottom') return null; const sh = A.shader('base', Fc, cylP(r + 1.7, yt, yt + cap), { pal: PL.MET });
      return (u, v, i, j, t) => { const y = v * Fc.fh; if (y > Fc.fh - .9) return E(y > Fc.fh - .45 ? N.cyan[2] : N.cyan[1]); if (y < .6) return ramp(PL.CHROME, .8, i, j); return sh(u, v, i, j, t); };
    });
    G.partF(cylP(r * .55, yt - 2.6, yt), Fc => Fc.k === 'bottom' ? null : (u, v, i, j) => { const y = v * Fc.fh; return Fc.k === 'side' && Math.abs(y - 1.3) < .3 ? E(N.lil[1]) : ramp(PL.MET, .4, i, j); });
    G.tube([cx, yt - 2.4, cz], [cx, Ywz(-4, cz), cz], 4.4, steelT);                           // труба подачі в стелю
    G.tube([cx + 3.4, yt - 2, cz - 1], [cx + 3.4, Ywz(-4, cz - 1), cz - 1], 1, darkT);       // кабель
    for (const [y, nn] of [[yt + cap + (yb - base - yt - cap) * .34, N.cyan], [yt + cap + (yb - base - yt - cap) * .67, N.pink]])   // обручі: хром і неонова смужка
      G.partF(cylP(r + .55, y, y + 1.6), Fc => Fc.k === 'side' ? (u, v, i, j) => v > .38 && v < .66 ? E(v > .46 && v < .58 ? nn[2] : nn[1]) : ramp(PL.CHROME, .35 + (.78 + .3 * Math.cos(Fc.ang - Math.PI * 1.5 - .5)) * .45 - (v > .66 ? .15 : 0), i, j) : null);
    const dx = 774 - cx, dz = -520 - cz, l = Math.hypot(dx, dz), ex = dx / l, ez = dz / l;    // стійки: спереду під ±62° і з боків (силует)
    for (const ph of [-62, 62, -104, 104]) { const a = ph * D2R, px = cx + (r + .35) * (Math.cos(a) * ex - Math.sin(a) * ez), pz = cz + (r + .35) * (Math.cos(a) * ez + Math.sin(a) * ex);
      G.tube([px, yt + cap - .2, pz], [px, yb - base + .2, pz], 1.1, chromeT); }
  };

  // ================= АКВАРІУМ №3: АКВАТРУБА (секція) =================
  // ================= АКВАРІУМ №3: КОНТЕЙНЕР ХИЖАКІВ (Декор стін · 10; власник: «супер-акваріум з небезпечними рибами,
  //                   футуристичний, зовсім інший дизайн, на всю площину; маніпулятор — попереду») =================
  /** Модуль контейнера: кришка (темний хром, червона неонова кромка, аварійні смуги, прожектор-плашка з LED), тумба (панелі з
   *  вентиляцією, червоні вогники-індикатори, жовто-чорна смуга), стійка між модулями, торцеві стінки з неоном на кінцях;
   *  на полиці (мілка частина) — сходинка рами. Табло «НЕБЕЗПЕЧНО» — на кришці середнього модуля (NX.t('decor.danger')). */
  SHP['st:dc_shark'] = (G, B) => {
    const d = B.dc, w = B.w, dep = B.dep, lid = d.lid, base = d.base, sg = d.sgn, yt = B.yt, yb = B.yb, RED = neonX('#ff3a3a');
    G.partF(G.sub(0, dep / 2, w + .02, dep, yt, yt + lid), Fc => {                               // кришка
      if (Fc.k === 'bottom') return null; const L = lit(Fc.n, A.centre(Fc));
      if (Fc.k === 'front') return (u, v, i, j) => { const y = v * lid, x = d.s0 + u * Fc.fw;
        if (y < .6) return ramp(PL.CHROME, .5 - y * .2, i, j); if (y > lid - .7) return E(RED[(i + j) % 5 ? 1 : 2]);          // червона неонова кромка над склом
        if (y > 1.1 && y < 2.3) return (((x + y) / 1.6) | 0) % 2 ? E(col('#ffcc1a')) : ramp(PL.DARK, .06, i, j);                 // аварійна смуга
        if (y > 2.9 && y < lid - 1.1 && ((x % 9) + 9) % 9 < 1.1) return E(((x / 9) | 0) % 2 ? col('#9af6ff') : col('#ffffff'));   // LED прожектора
        return ramp(PL.STEEL, .3 * L + (y < 1 ? .1 : 0), i, j); };
      if (Fc.k === 'top') return (u, v, i, j) => { const x = d.s0 + u * Fc.fw; return v > .3 && v < .7 && ((x % 9) + 9) % 9 < 2 ? ramp(PL.CHROME, .7, i, j) : ramp(PL.STEEL, .26 + v * .08, i, j); };
      return (u, v, i, j) => ramp(PL.STEEL, .28 * L, i, j);
    });
    G.partF(G.sub(0, dep / 2, w + .02, dep, yb - base, yb), Fc => {                               // тумба
      if (Fc.k === 'top') return null; const L = lit(Fc.n, A.centre(Fc));
      if (Fc.k === 'front') return (u, v, i, j) => { const y = v * base, x = d.s0 + u * Fc.fw, pc = ((x % 11) + 11) % 11;
        if (y < .5) return E(RED[1]); if (y < 1.1) return ramp(PL.CHROME, .55, i, j);                                              // червона кромка під склом
        if (y > base - .9) return (((x) / 1.6) | 0) % 2 ? E(col('#ffcc1a')) : ramp(PL.DARK, .06, i, j);                            // аварійна смуга знизу
        if (pc < .5) return ramp(PL.STEEL, .06, i, j);
        if (Math.abs(pc - 2.2) < .45 && y > 2 && y < 3) return E((((x / 11) | 0) + (j >> 1)) % 3 ? col('#ff3a3a') : col('#3bff8a'));   // індикатори
        if (pc > 4 && pc < 9.5 && y > 1.9 && y < base - 1.3 && (y * 2.2) % 1 < .4) return ramp(PL.DARK, .1, i, j);                  // вентиляція
        return ramp(PL.STEEL, .3 * L + (y < 2 ? .06 : 0), i, j); };
      if (Fc.k === 'bottom') return (u, v, i, j) => v < .16 ? E(RED[(i + j) % 4 ? 1 : 2]) : ramp(PL.STEEL, .2 + (1 - v) * .08, i, j);
      return (u, v, i, j) => ramp(PL.STEEL, .26 * L, i, j);
    });
    const nW = sub(G.P(0, 0, 0), G.P(0, 1, 0));                                                     // тінь під тумбою на стіні
    const shR = Math.min(yb + 8, d.shy || yb + 8); if (shR > yb) ditherFace(G, G.P(-w / 2 - .1, dep + .15, yb - 1), G.P(w / 2 + .1, dep + .15, yb - 1), G.P(-w / 2 - .1, dep + .15, shR), nW, (u, v) => .4 * Math.pow(1 - v, 1.6));
    const post = u => G.partF(G.sub(u, dep / 2, 1.3, dep + .3, yt + lid - .2, yb - base + .2), Fc => { const L = lit(Fc.n, A.centre(Fc));   // стійка між модулями / торець
      return (uu, v, i, j) => { const y = v * Fc.fh; return Fc.k === 'front' && Math.abs(uu - .5) < .16 ? E(RED[((j * 3) | 0) % 7 ? 1 : 2]) : Fc.k === 'front' ? ramp(PL.CHROME, (y % 6) < .6 ? .9 : .55 - Math.abs(uu - .5) * .4, i, j) : ramp(PL.STEEL, .3 * L + .04, i, j); }; });
    post(-sg * (w / 2 - .6)); if (d.i === d.n - 1) post(sg * (w / 2 - .6));
    if (d.i === 7) {                                                                                 // сходинка рами на межі глибокої частини й полиці: тумба полиці спирається на вертикальну панель
      const pr = B.yb - d.base; G.partF(G.sub(-sg * (w / 2 - 1.2), dep / 2, 2.4, dep, yb, yb + 1.2), Fc => (u, v, i, j) => ramp(PL.STEEL, .22, i, j)); void pr;
    }
    if (d.i === 3) {                                                                                 // табло «НЕБЕЗПЕЧНО» на кришці: панель лицем до глядача (NX.t, 4 мови)
      const sign = (c, fw, fh) => { c.fillStyle = '#1a0608'; c.fillRect(0, 0, fw, fh); c.strokeStyle = '#ff3a3a'; c.lineWidth = .35; c.strokeRect(.4, .4, fw - .8, fh - .8);
        for (let k = 0; k < 3; k++) { c.fillStyle = k % 2 ? '#ffcc1a' : '#3a1010'; c.fillRect(1 + k * .7, 1, .5, fh - 2); c.fillRect(fw - 1.5 - k * .7, 1, .5, fh - 2); }
        A.txt(c, NX.t('decor.danger'), fw / 2, fh / 2, fw - 7, fh * .5, '#ff5a4a', { glow: '#ff2a1a' }); };
      G.partF(G.sub(0, dep + .05, w * .9, .4, yt + lid * .1, yt + lid * .9), Fc => Fc.k === 'front' ? A.shader('frame', Fc, B, { tex: A.texture(B, Fc, 6, sign), pal: PL.DARK, q: .1, bev: 0, ins: 0 }) : (u, v, i, j) => ramp(PL.DARK, .1, i, j));
    }
  };
  // ================= СКЛО АКВАРІУМІВ: вікна (рушій дає маску видимих пікселів — риби живуть за склом: objects/decor.js) =================
  A.STY.dc_win = { pal: pal(['#040a2a', '#081440', '#0c1e58', '#122a70', '#1a3a8a']), q: .45, bev: 0, ins: 0 };
  const BLOB = (c, x, y, rx, ry, fill) => { c.fillStyle = fill; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 7); c.fill(); };
  const LN = (c, pts, w, st) => { c.strokeStyle = st; c.lineWidth = w; c.lineCap = 'round'; c.beginPath(); pts.forEach(([x, y], k) => k ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke(); };
  /** Скляний відблиск і рамка по краю (спільне для вікон). */
  function glassFX(c, fw, fh, x0, o = {}) {
    c.fillStyle = 'rgba(255,255,255,.07)'; for (let k = 0; k < 3; k++) { const x = ((37 * k + 11 - x0) % 41 + 41) % 41 - 8; c.beginPath(); c.moveTo(x, 0); c.lineTo(x + 3, 0); c.lineTo(x + 3 - fh * .35, fh); c.lineTo(x - fh * .35, fh); c.closePath(); c.fill(); }
    if (o.top) { c.fillStyle = 'rgba(200,240,255,.55)'; c.fillRect(0, o.top, fw, .45); }
  }
  // ---- РИФ: панорама (кожен корал — свого виду, один раз). (Декор стін · 5, власник: «акваріуми — у два рази краще»): глибина
  //      шарами (далекий риф у синяві, живий камінь з печерою мурени, коралові водорості), удвічі більше коралів; ламінарія,
  //      щупальця анемони, промені, каустика, сад вугрів, мурена, краб, зграйка хроміс — живі (objects/decor_aqua.js)
  /** Профіль рифу (спільний з objects/decor_aqua.js): верх каменю в точці x (од. від лівого краю скла), висота скла fh. */
  const REEF = {
    sand: fh => fh - 3.2,
    sy: (x, fh) => fh - 3.2 - .7 * Math.sin(x * .27) - .4 * Math.sin(x * .73 + 1),
    rock: (x, fh) => { const h = x < 50 ? 1 - Math.pow(Math.abs(x - 22) / 30, 2.2) : x < 97 ? .62 * (1 - Math.pow(Math.abs(x - 74) / 25, 2)) : .32 * (1 - Math.pow(Math.abs(x - 112) / 16, 2));
      return Math.max(0, h) > 0 ? fh - 3.2 - Math.max(0, h) * fh * .5 - .9 * Math.sin(x * .9) - .5 * Math.sin(x * 2.3 + 1) : 1e9; },
    cave: [40.5, .73, 4, 3],                                                                         // печера мурени: x, висота (частка fh), півосі
    anem: 49.5, eels: [99, 101.6, 104.2],
  };
  NX.arc.REEF = REEF;
  function reefPaint(c, fw, fh, B) {
    const d = B.dc, s0 = d.s0, T = d.tot || 120, g = c.createLinearGradient(0, 0, 0, fh);
    g.addColorStop(0, '#4cc4f6'); g.addColorStop(.1, '#2a8ada'); g.addColorStop(.38, '#1656b4'); g.addColorStop(.7, '#0e3088'); g.addColorStop(1, '#0a1a5c'); c.fillStyle = g; c.fillRect(0, 0, fw, fh);
    c.save(); c.translate(-s0, 0);
    const sand = REEF.sand(fh), sy = x => REEF.sy(x, fh), rk = x => REEF.rock(x, fh);
    // далекий риф у синяві: куполи й гілки, що тануть у глибині
    for (let k = 0; k < 18; k++) { const x = hash(k, 61) * T, w = 3 + 5 * hash(k, 62), h = 5 + 9 * hash(k, 63), y = fh * .62;
      c.fillStyle = `rgba(${60 + 30 * hash(k, 64) | 0},${80 + 40 * hash(k, 65) | 0},200,.22)`; if (k % 3) BLOB(c, x, y, w, h * .5, c.fillStyle);
      else { for (let q = 0; q < 5; q++) LN(c, [[x, y + 3], [x + (q - 2) * 1.6, y - h * (.5 + .1 * q)]], .9, c.fillStyle); } }
    // живий камінь: темний з підсвіченим верхом, ямки, рожеві коралові водорості
    c.fillStyle = '#24186a'; c.beginPath(); c.moveTo(-5, fh); for (let x = -5; x <= T + 5; x += .8) c.lineTo(x, Math.min(sand + 1, rk(x))); c.lineTo(T + 5, fh); c.closePath(); c.fill();
    for (let x = -4; x <= T + 4; x += .45) { const y = rk(x); if (y > sand) continue; c.fillStyle = hash((x * 3) | 0, 3) > .5 ? '#5a40b4' : '#4a32a0'; c.fillRect(x, y, .5, .7); if (hash((x * 2) | 0, 9) > .82) { c.fillStyle = '#c05ac8'; c.fillRect(x, y + .2, .55, .45); } }
    for (let k = 0; k < 120; k++) { const x = hash(k, 71) * T, y0 = rk(x); if (y0 > sand) continue; const y = y0 + 1.2 + hash(k, 72) * (sand - y0 - 1); c.fillStyle = k % 5 ? 'rgba(14,8,48,.75)' : 'rgba(200,90,200,.6)'; BLOB(c, x, y, .35 + .3 * hash(k, 73), .25 + .2 * hash(k, 74), c.fillStyle); }
    { const [cx, cyk, rx, ry] = REEF.cave, cy = fh * cyk, gg = c.createRadialGradient(cx, cy, 0, cx, cy, rx); gg.addColorStop(0, '#020108'); gg.addColorStop(.7, '#08041c'); gg.addColorStop(1, '#1a1050');   // печера мурени
      c.fillStyle = gg; c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); c.fill();
      for (let k = 0; k < 7; k++) { const a = Math.PI * (1.05 + .9 * k / 6), x = cx + Math.cos(a) * (rx + .9), y = cy + Math.sin(a) * (ry + .8), cc = ['#ff4a3a', '#3be8ff', '#ffd23a', '#ff6ae0', '#7aff7a', '#ffffff', '#b46aff'][k];   // «ялинки» — черви на камені біля входу
        for (let q = 0; q < 3; q++) LN(c, [[x - .55 + q * .05, y - q * .45], [x + .55 - q * .05, y - q * .45 - .15]], .22, cc); } }
    // 1 горгонарія (віяло) на лівому камені
    { const x = 6, y = rk(6) + .4; for (let k = 0; k < 11; k++) { const a = -1.3 + k * .26; LN(c, [[x, y], [x + Math.sin(a) * 8, y - Math.cos(a) * 12]], .42, '#b04ad8'); LN(c, [[x + Math.sin(a) * 4.5, y - Math.cos(a) * 6.5], [x + Math.sin(a + .22) * 7, y - Math.cos(a + .22) * 11]], .3, '#e09aff'); }
      for (let k = 0; k < 40; k++) { const a = -1.3 + hash(k, 5) * 2.6, r = 3 + hash(k, 6) * 8; c.fillStyle = '#f0c8ff'; c.fillRect(x + Math.sin(a) * r * .7, y - Math.cos(a) * r, .25, .25); } }
    // 2 зоантуси: килимок поліпів (зелені й помаранчеві «квіточки»)
    { for (let k = 0; k < 22; k++) { const x = 11.5 + (k % 8) * .9 + (hash(k, 2) - .5) * .4, y = rk(x) + .3 + Math.floor(k / 8) * .8; BLOB(c, x, y, .45, .35, k % 3 ? '#3aff9a' : '#ff9a2a'); BLOB(c, x, y, .18, .14, k % 3 ? '#0a5a3a' : '#7a2a0a'); } }
    // 3 мозковий корал
    { const x = 20, y = rk(20) + .6; BLOB(c, x, y - 2, 4.4, 3, '#d8762a'); c.strokeStyle = '#8a3a10'; c.lineWidth = .32; for (let k = 0; k < 5; k++) { c.beginPath(); for (let t = 0; t <= 1; t += .08) c.lineTo(x - 3.7 + t * 7.4, y - 3.9 + k * .95 + Math.sin(t * 13 + k) * .32); c.stroke(); } BLOB(c, x - 1.6, y - 3.6, 1.4, .5, 'rgba(255,220,160,.5)'); }
    // 4 червоні морські батоги (тонкі прути)
    { for (let k = 0; k < 6; k++) { const x = 25.5 + k * .8, y = rk(x) + .5, h = 7 + 6 * hash(k, 31); LN(c, [[x, y], [x + Math.sin(k) * .9, y - h * .5], [x + Math.sin(k) * 1.6, y - h]], .38, k % 2 ? '#e8283a' : '#ff5a4a'); } }
    // 5 оленячий ріг (рожевий, гіллястий)
    { const br = (x, y, a, l, n) => { const e = [x + Math.sin(a) * l, y - Math.cos(a) * l]; LN(c, [[x, y], e], Math.max(.35, n * .3), n > 1 ? '#e8508a' : '#ffb0d0'); if (n > 0) { br(e[0], e[1], a - .45, l * .72, n - 1); br(e[0], e[1], a + .42, l * .7, n - 1); } }; br(32.5, rk(32.5) + .5, -.1, 4.8, 3); }
    // 6 анемона: ніжка (щупальця — живі), рибка-клоун живе в ній
    { const x = REEF.anem, y = rk(x) + .4; BLOB(c, x, y - 1.2, 2.8, 1.8, '#a01a62'); BLOB(c, x, y - 2.2, 2.4, .8, '#d8408a'); }
    // 7 трубчастий корал (блакитні трубки)
    { for (let k = 0; k < 8; k++) { const x = 55 + k * 1.2, h = 3 + 4.5 * hash(k, 21), y = rk(x) + .5; c.fillStyle = '#1a7a9a'; c.fillRect(x - .5, y - h, 1, h); BLOB(c, x, y - h, .62, .32, '#6af8ff'); BLOB(c, x, y - h, .3, .15, '#0a3a4a'); } }
    // 8 грибні корали: диски на камені (сині й червоні)
    { for (let k = 0; k < 7; k++) { const x = 62.5 + (k % 4) * 1.9 + (k > 3 ? .9 : 0), y = rk(x) + 1.6 + (k > 3 ? 2 : 0), r = .9 + .3 * hash(k, 3), cc = k % 2 ? ['#2a4aff', '#7a9aff'] : ['#d02a4a', '#ff8a9a'];
      BLOB(c, x, y, r, r * .55, cc[0]); BLOB(c, x, y - r * .1, r * .3, r * .18, cc[1]); for (let q = 0; q < 5; q++) c.fillRect(x + Math.cos(q * 1.3) * r * .6, y + Math.sin(q * 1.3) * r * .3, .2, .2); } }
    // 9 столовий корал
    { const x = 71, y = rk(71) + .4; c.fillStyle = '#1a6a6a'; c.fillRect(x - .6, y - 5, 1.2, 5); BLOB(c, x, y - 5.3, 6.4, 1.2, '#2ab8a0'); BLOB(c, x, y - 5.7, 5.6, .6, '#7ae8d0'); for (let k = 0; k < 9; k++) c.fillRect(x - 5.5 + k * 1.3, y - 4.4, .3, .4); }
    // 10 молотковий корал: зелені гілки з «молоточками»
    { for (let k = 0; k < 6; k++) { const x = 77 + k * 1.05, y = rk(x) + .5, h = 3 + 2.4 * hash(k, 41), tx = x + (k - 2.5) * .5; LN(c, [[x, y], [tx, y - h]], .4, '#2a7a3a'); c.save(); c.translate(tx, y - h); c.rotate((k - 2.5) * .15); BLOB(c, 0, 0, 1.1, .5, '#5aff8a'); BLOB(c, 0, -.15, .6, .22, '#c8ffd8'); c.restore(); } }
    // 11 м'який корал (жовто-лаймовий «гриб» з ворсом)
    { const x = 85, y = rk(85) + .5; c.fillStyle = '#a0a020'; c.fillRect(x - .8, y - 3.4, 1.6, 3.4); BLOB(c, x, y - 4.2, 3.6, 1.8, '#d8e040'); for (let k = 0; k < 14; k++) c.fillRect(x - 3.2 + k * .48, y - 5.8 + hash(k, 2) * .6, .22, .7); }
    // 12 тридакна (на піску)
    { const x = 92, y = sy(92); c.fillStyle = '#c8c0b8'; c.beginPath(); for (let t = 0; t <= 1.001; t += .1) c.lineTo(x - 4 + t * 8, y - 1.5 - Math.abs(Math.sin(t * 15)) * .8); c.lineTo(x + 4, y); c.lineTo(x - 4, y); c.closePath(); c.fill(); BLOB(c, x, y - 2.3, 3.4, .9, '#4a3aff'); BLOB(c, x, y - 2.4, 2.4, .45, '#5af8ff'); }
    // 13 пухирчастий корал (перлові кульки)
    { for (let k = 0; k < 13; k++) { const x = 107 + (k % 4) * 1.4 + hash(k, 8) * .6, y = rk(108) - .2 - Math.floor(k / 4) * 1.3; BLOB(c, x, y, .8, .8, '#e8e4f8'); BLOB(c, x - .25, y - .25, .3, .3, '#ffffff'); } }
    // 14 бочкова губка (помаранчево-червоний келих)
    { const x = 114.5, y = rk(114.5) + .5; c.fillStyle = '#c8461a'; c.beginPath(); c.moveTo(x - 1.6, y); c.lineTo(x - 2.4, y - 6); c.lineTo(x + 2.4, y - 6); c.lineTo(x + 1.6, y); c.closePath(); c.fill(); BLOB(c, x, y - 6, 2.4, .7, '#5a1a0a'); for (let q = 0; q < 4; q++) LN(c, [[x - 2 + q * 1.3, y - .3], [x - 2.2 + q * 1.45, y - 5.6]], .2, '#ff7a3a'); }
    // ламінарія — коріння (стрічки живі)
    { for (let k = 0; k < 4; k++) BLOB(c, 2.5 + k * 1.4, sy(2.5 + k * 1.4) - .2, .6, .35, '#1a5a2a'); }
    // пісок: брижі, мушлі, морська зірка, їжак; сад вугрів — нірки
    c.fillStyle = '#b8a4cc'; c.beginPath(); c.moveTo(-5, fh); for (let x = -5; x <= T + 5; x += 1) c.lineTo(x, sy(x)); c.lineTo(T + 5, fh); c.closePath(); c.fill();
    for (let k = 0; k < 120; k++) { c.fillStyle = k % 2 ? '#8a72a8' : '#e0d4ec'; const x = hash(k, 11) * T; c.fillRect(x, sy(x) + .4 + hash(k, 13) * (fh - sy(x) - .5), .35, .35); }
    for (let k = 0; k < 14; k++) { const x = k * 8.7 + 2, y = sy(x) + 1.1; LN(c, [[x - 1.6, y], [x, y - .25], [x + 1.6, y]], .2, 'rgba(120,96,150,.8)'); }
    for (const [x, cc] of [[24, '#f0c8e0'], [61, '#ffe0a0'], [96.5, '#c8e8ff']]) BLOB(c, x, sy(x) + .9, .7, .45, cc);
    { const x = 52, y = sy(52) + .6; c.fillStyle = '#ff7a3a'; c.beginPath(); for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2 - Math.PI / 2, rr = k % 2 ? .6 : 1.6; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr * .6); } c.closePath(); c.fill(); }
    { const x = 88, y = sy(88); for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI; LN(c, [[x, y], [x - Math.cos(a) * 1.9, y - Math.sin(a) * 1.9]], .22, '#3a1a5a'); } BLOB(c, x, y, .9, .7, '#2a0a3a'); }
    for (const x of REEF.eels) BLOB(c, x, sy(x) + .15, .55, .22, '#4a3a5a');
    c.restore();
    glassFX(c, fw, fh, s0, { top: .5 });
  }
  // ---- МЕДУЗАРІЙ: глибока синява, знизу — фіолетове світло цоколя, морські пера на дні ----
  PAINT.dc_jellyg = (c, fw, fh) => {
    const g = c.createLinearGradient(0, 0, 0, fh); g.addColorStop(0, '#0a1a5a'); g.addColorStop(.35, '#13247a'); g.addColorStop(.7, '#2a1c90'); g.addColorStop(.92, '#6a2ab4'); g.addColorStop(1, '#b44ad8'); c.fillStyle = g; c.fillRect(0, 0, fw, fh);
    const sh = c.createLinearGradient(0, 0, fw, 0); sh.addColorStop(0, 'rgba(150,200,255,0)'); sh.addColorStop(.5, 'rgba(150,200,255,.16)'); sh.addColorStop(1, 'rgba(150,200,255,0)'); c.fillStyle = sh; c.fillRect(0, 0, fw, fh);   // світловий стовп
    const rg = c.createRadialGradient(fw / 2, fh, 0, fw / 2, fh, fh * .32); rg.addColorStop(0, 'rgba(255,110,230,.55)'); rg.addColorStop(1, 'rgba(255,110,230,0)'); c.fillStyle = rg; c.fillRect(0, fh * .55, fw, fh * .45);
    c.strokeStyle = 'rgba(140,240,255,.1)'; c.lineWidth = .5; for (let k = 0; k < 7; k++) { c.beginPath(); for (let y = 0; y <= fh; y += 3) c.lineTo(fw * (.1 + .13 * k) + Math.sin(y * .08 + k * 1.7) * 1.4, y); c.stroke(); }   // каустика
    for (let k = 0; k < 220; k++) { c.fillStyle = k % 4 ? 'rgba(200,230,255,.8)' : 'rgba(255,170,240,.9)'; c.fillRect(hash(k, 31) * fw, hash(k, 37) * fh * .95, .4, .4); }   // планктон
    for (let k = 0; k < 6; k++) { const x = fw * (.12 + .15 * k), h = 5 + 4 * hash(k, 5), cc = ['#ff9a3a', '#c86aff', '#ff4fd8', '#3bff8a', '#ffd27a', '#3be8ff'][k];   // морські пера (кожне свого кольору)
      LN(c, [[x, fh], [x + .3, fh - h]], .4, '#e8e0ff'); for (let q = 0; q < 7; q++) { const y = fh - h * (.35 + q * .09); LN(c, [[x - 1.3 * (1 - q / 9), y + .5], [x + .2, y], [x + 1.3 * (1 - q / 9), y + .5]], .3, cc); } }
    const v = c.createLinearGradient(0, 0, fw, 0); v.addColorStop(0, 'rgba(0,0,30,.42)'); v.addColorStop(.13, 'rgba(0,0,30,0)'); v.addColorStop(.87, 'rgba(0,0,30,0)'); v.addColorStop(1, 'rgba(0,0,30,.48)'); c.fillStyle = v; c.fillRect(0, 0, fw, fh);
    c.fillStyle = 'rgba(230,248,255,.7)'; c.fillRect(fw * .18, 0, .6, fh); c.fillStyle = 'rgba(230,248,255,.22)'; c.fillRect(fw * .23, 0, 1.6, fh); c.fillStyle = 'rgba(230,248,255,.3)'; c.fillRect(fw * .8, 0, .45, fh);   // відблиски циліндра
  };
  // ---- АКВАТРУБА: прісна вода, акваскейп (кожна рослина й прикраса — одна). (· 5) усе вміщено в довжину труби (раніше
  //      частина була за її кінцем), глибина шарами (далекі стебла в бірюзовій імлі), світло згори; валіснерія, коріння
  //      аквапоніки, каустика, коридораси, анциструс і равлик на склі — живі (objects/decor_aqua.js)
  // ---- (· 10) КОНТЕЙНЕР ХИЖАКІВ: малюнок скла — одна панорама вздовж усіх модулів (x — від лівого краю, T ≈ 270); глибока
  //      частина (x < xS, вікна deep) — вулканічне дно з лавою в тріщинах, затонулий бойовий мех (ребра, шолом з червоним оком),
  //      ланцюги, клітка для корму; полиця (x ≥ xS) — мілке дно з «кістками» робота; усе в темно-синій товщі з променями
  //      прожекторів; попередження на склі. Профіль дна — SHARK.fl (спільний з живим: objects/decor_aqua.js).
  const SHARK = { fl: (x, fh, fhS, xS) => 4 + 1.3 * Math.sin(x * .21) + .6 * Math.sin(x * .77 + 2) };
  NX.arc.SHARK = SHARK;
  function sharkPaint(c, fw, fh, B) {
    const d = B.dc, s0 = d.s0, T = d.tot || 270, deep = d.deep, g = c.createLinearGradient(0, 0, 0, fh);
    g.addColorStop(0, '#0e3458'); g.addColorStop(.12, '#12507e'); g.addColorStop(.5, '#0a2e58'); g.addColorStop(1, '#061430'); c.fillStyle = g; c.fillRect(0, 0, fw, fh);
    c.save(); c.translate(-s0, 0);
    const fl = x => fh - SHARK.fl(x, fh, fh, 0);
    c.fillStyle = 'rgba(150,220,255,.07)'; for (let k = 0; k < 9; k++) { const x = 14 + k * 30; c.beginPath(); c.moveTo(x - 1.5, 0); c.lineTo(x + 1.5, 0); c.lineTo(x + 6, fh * .85); c.lineTo(x - 2, fh * .85); c.closePath(); c.fill(); }   // промені прожекторів
    for (let k = 0; k < 30; k++) { const x = hash(k, 81) * T, y = fh * (.25 + .5 * hash(k, 82)); c.fillStyle = 'rgba(80,140,200,.12)'; BLOB(c, x, y, 6 + 8 * hash(k, 83), 2 + 2 * hash(k, 84), 'rgba(60,110,170,.1)'); }   // далекі скелі в імлі
    // вулканічне дно: чорний камінь, лава в тріщинах, жовто-сірий попіл
    c.fillStyle = '#0e0c14'; c.beginPath(); c.moveTo(-5, fh + 2); for (let x = -5; x <= T + 5; x += 1.5) c.lineTo(x, fl(x)); c.lineTo(T + 5, fh + 2); c.closePath(); c.fill();
    for (let k = 0; k < 160; k++) { const x = hash(k, 41) * T, y = fl(x) + .3 + hash(k, 43) * (fh - fl(x) - .4); c.fillStyle = ['#2a2630', '#3a3440', '#1a1822', '#4a4450'][k % 4]; c.fillRect(x, y, .5, .4); }
    for (const [lx, w] of [[22, 9], [58, 7], [96, 12], [140, 8], [172, 10]]) { for (let q = 0; q < 5; q++) { const x = lx + (hash(q, lx) - .5) * w * 1.6, y = fl(x) + .8 + hash(q, lx + 1) * 1.6; LN(c, [[x - 1.2, y], [x + .4, y - .5], [x + 1.4, y + .3]], .35, q % 2 ? '#ff7a2a' : '#ffb04a'); } }   // лавові тріщини
    for (const [rx, rw, rh] of [[10, 7, 5], [48, 9, 7], [84, 6, 4], [122, 11, 8], [160, 8, 6], [200, 9, 5], [245, 7, 4]]) { const y = fl(rx); BLOB(c, rx, y - rh * .35, rw, rh, '#17141f'); BLOB(c, rx - rw * .3, y - rh * .8, rw * .5, rh * .45, '#2a2634'); for (let q = 0; q < 6; q++) c.fillRect(rx - rw * .8 + hash(q, rx) * rw * 1.6, y - rh * .6 + hash(q, rx + 3) * rh * .5, .5, .4), c.fillStyle = '#3a3444'; }   // вулканічні брили
    // затонулий бойовий мех (x 100..135): ребра корпусу, шолом з червоним оком, рука з клешнею, кабелі; обросло коралами-ялинками
    { const x = 108, y = fl(108) - 1; c.save(); c.translate(x, y); c.rotate(-.18);
      c.fillStyle = '#2e3440'; for (let k = 0; k < 6; k++) { c.beginPath(); c.ellipse(k * 3.2, -5, 1.1, 5 - k * .4, 0, 0, Math.PI * 2); c.fill(); }                   // ребра
      c.fillStyle = '#3a4252'; c.fillRect(-2, -9.5, 20, 1.4); c.fillRect(-2, -1.6, 20, 1.2);                                                                       // хребет
      c.fillStyle = '#4a5466'; c.fillRect(-9, -11, 8.5, 7); c.fillStyle = '#1a1e28'; c.fillRect(-8, -9, 6.5, 2.4); c.fillStyle = '#ff2a2a'; c.fillRect(-6.5, -8.6, 1.6, 1.6); c.fillStyle = '#ffd0d0'; c.fillRect(-6.2, -8.3, .5, .5);   // шолом, візор, око
      c.strokeStyle = '#3a4252'; c.lineWidth = 1.2; c.lineCap = 'round'; c.beginPath(); c.moveTo(18, -8); c.lineTo(24, -13); c.lineTo(27, -9); c.stroke(); c.fillStyle = '#4a5466'; c.fillRect(26, -11, 3.5, 2); c.fillRect(28, -9.5, 1.5, 3);   // рука з клешнею
      LN(c, [[2, -2], [5, 2], [9, 1]], .35, '#a0a8b8'); LN(c, [[12, -10], [11, -14], [14, -17]], .3, '#6a7488');                                                      // кабелі
      for (const [bx, by] of [[1, -10.5], [7, -11], [15, -10.5], [-8, -12]]) for (let q = 0; q < 5; q++) BLOB(c, bx + (hash(q, bx) - .5) * 2, by - q * .9, .7, .5, q % 2 ? '#c84a7a' : '#ff6aa0');   // корали-ялинки обросли
      c.restore(); }
    // клітка для корму (над полицею, x 232..246): дротяний куб на ланцюгу з кришки; ланцюги по стінці
    { const x = 238, y0 = 1, y1 = fh * .28; LN(c, [[x, y0], [x, y1]], .5, '#7a8498'); for (let q = 0; q < 8; q++) c.fillRect(x - .7 + (q % 2) * .6, y0 + q * (y1 - y0) / 8, .6, .9), c.fillStyle = '#b0b8c8';
      c.strokeStyle = '#8a94a8'; c.lineWidth = .4; c.strokeRect(x - 5, y1, 10, 8); for (let q = 1; q < 4; q++) { c.beginPath(); c.moveTo(x - 5 + q * 2.5, y1); c.lineTo(x - 5 + q * 2.5, y1 + 8); c.moveTo(x - 5, y1 + q * 2); c.lineTo(x + 5, y1 + q * 2); c.stroke(); }
      c.fillStyle = '#b01a1a'; c.fillRect(x - 2, y1 + 3, 3.5, 2.6); c.fillStyle = '#ff6a5a'; c.fillRect(x - 1.5, y1 + 3.5, 1.2, .8); }
    for (const cx of [40, 150, 205]) { for (let q = 0; q < 14; q++) { c.fillStyle = q % 2 ? '#5a6478' : '#3a4254'; c.fillRect(cx - .6 + Math.sin(q) * .4, q * 1.6, 1.2, 1.1); } }   // ланцюги зі стелі
    // «кістки» робота на полиці (x 252..266): череп з двома очницями, ребра
    { const x = 258, y = fl(258) - .6; BLOB(c, x, y - 2.4, 3.2, 2.6, '#9aa0b0'); c.fillStyle = '#1a1a24'; c.fillRect(x - 2, y - 3, 1.3, 1.2); c.fillRect(x + .6, y - 3, 1.3, 1.2); c.fillStyle = '#9aa0b0'; c.fillRect(x - 2.4, y - .6, 5, .8); for (let q = 0; q < 4; q++) c.fillRect(x + 4 + q * 1.4, y - 2.2 + (q % 2) * .5, .6, 2.6); }
    // напис-попередження на склі глибокої частини (голо-трафарет, NX.t — 4 мови) і сітка контейнера на дальній стінці
    c.globalAlpha = .55; A.txt(c, NX.t('decor.danger'), 118, fh * .2, 70, fh * .09, '#ff4a3a', { glow: '#ff2a1a' }); c.globalAlpha = 1;
    c.strokeStyle = 'rgba(60,200,255,.08)'; c.lineWidth = .3; for (let x = 0; x <= T; x += 12) { c.beginPath(); c.moveTo(x, fh * .1); c.lineTo(x, fh * .9); c.stroke(); } for (let y = fh * .1; y < fh * .9; y += 9) { c.beginPath(); c.moveTo(0, y); c.lineTo(T, y); c.stroke(); }
    c.restore();
    // попередження на склі (смужка знизу) і відблиски
    c.fillStyle = 'rgba(255,60,40,.12)'; c.fillRect(0, fh - 1.4, fw, .5);
    c.fillStyle = 'rgba(230,255,255,.5)'; c.fillRect(0, fh * .04, fw, .4); c.fillStyle = 'rgba(230,255,255,.1)'; c.fillRect(0, fh * .05, fw, fh * .06);
    glassFX(c, fw, fh, s0);
    void deep;
  }
  for (let k = 0; k < 10; k++) PAINT['dc_shg' + k] = sharkPaint;

  // ================= ПЛАКАТ І НЕОН (пласкі: грань-малюнок) =================
  A.STY.dc_poster = { pal: PL.DARK, q: .4, bev: .3, ins: 0 };
  /** Плакат «Nexi — ботанік»: рамка, темно-синій папір, монстера кодом, напис і підпис зі словників (4 мови). */
  PAINT.dc_poster0 = (c, fw, fh) => {
    const T = A.txt;
    c.fillStyle = '#2a1830'; c.fillRect(0, 0, fw, fh); c.fillStyle = '#0c1a3a'; c.fillRect(1.2, 1.2, fw - 2.4, fh - 2.4);
    c.strokeStyle = '#d8a030'; c.lineWidth = .5; c.strokeRect(2.2, 2.2, fw - 4.4, fh - 4.4);
    const cx = fw / 2, cy = fh * .46, r = fw * .3;
    c.fillStyle = 'rgba(90,232,255,.12)'; c.beginPath(); c.arc(cx, cy, r * 1.25, 0, 7); c.fill();
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
    const nl = (x0, y0, x1, y1, hx, w = 1) => { if (hx !== 'green') return A.neon(c, x0, y0, x1, y1, hx, w * s);
      c.lineCap = 'round'; [[w * s * 2.2, GRN[0], .55], [w * s, GRN[1], 1], [w * s * .38, GRN[2], 1]].forEach(([lw, st, a]) => { c.globalAlpha = a; c.strokeStyle = st; c.lineWidth = lw; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); }); c.globalAlpha = 1; };
    const R = (x, y, w, h, hx) => { nl(x, y, x + w, y, hx); nl(x + w, y, x + w, y + h, hx); nl(x + w, y + h, x, y + h, hx); nl(x, y + h, x, y, hx); };
    R(cx - 11 * s, cy - 7 * s, 22 * s, 15 * s, '#3be8ff');
    R(cx - 6.5 * s, cy - 2.5 * s, 4 * s, 4 * s, '#3be8ff'); R(cx + 2.5 * s, cy - 2.5 * s, 4 * s, 4 * s, '#3be8ff');
    nl(cx - 4 * s, cy + 4.5 * s, cx + 4 * s, cy + 4.5 * s, '#3be8ff');
    nl(cx, cy - 7 * s, cx, cy - 13 * s, 'green');
    const leafN = sg => { for (let k = 0; k < 6; k++) { const f = t => [cx + sg * Math.sin(t * Math.PI) * 6 * s, cy - 13 * s - t * 5 * s], a = f(k / 6), b = f((k + 1) / 6); nl(a[0], a[1], b[0], b[1], 'green', .9); } };
    leafN(-1); leafN(1);
    const hx = fw * .82, hy = fh * .28, hs = 3.2 * s;
    nl(hx, hy + hs, hx - hs * 1.2, hy - hs * .1, '#ff4fd8'); nl(hx - hs * 1.2, hy - hs * .1, hx - hs * .6, hy - hs * .9, '#ff4fd8'); nl(hx - hs * .6, hy - hs * .9, hx, hy - hs * .3, '#ff4fd8');
    nl(hx, hy - hs * .3, hx + hs * .6, hy - hs * .9, '#ff4fd8'); nl(hx + hs * .6, hy - hs * .9, hx + hs * 1.2, hy - hs * .1, '#ff4fd8'); nl(hx + hs * 1.2, hy - hs * .1, hx, hy + hs, '#ff4fd8');
  };
})();
