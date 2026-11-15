/* ============================================================================
 * objects/decor_guide.js — ДОВІДНИК БОТАНІКА (Декор стін · 18): картка врятованого виду
 * ----------------------------------------------------------------------------
 * Історія світу (docs/UNIVERSE.md): усі рослини й рибки в кімнаті — види, які Nexi урятував. Тап по рослині на стіні, по
 * лотку теплиці, по рибі чи медузі (і по нерухомих мешканцях рифу — мурена, вугри, анемона, краб…) показує КАРТКУ:
 * «ВРЯТОВАНИЙ ВИД · №NN», спрайт виду (той самий піксель-арт, що в кімнаті), назва мовою сайту, латина, де живе, стадія
 * росту (теплиця) і лічильник «Врятовано видів: N». Розмітка — index.html (#guide), стилі — css/hud.css (.guide),
 * тексти — i18n decor.guide.* (назви видів sp.<група>.<вид>, латина — лише в uk.js: одна на всі мови).
 * Як знаходимо вид: живі рослини — objects/decor_live.js (tap -> 'plant', спрайт LP); нерухомі (соти, витки, корч, стрілки
 * антресолі, орхідея в оранжереї, платицеріум) — коробки предметів розкладки з dc.kind / dc.plant (tapStatic); теплиця —
 * NX.decorFarm.nearTray; акваріуми — NX.decor.crewAt (риби й медузи) і NX.decorAqua.residents (нерухомі).
 * Реєстр видів — зі словника (порядок: стіни, ферма, риф, медузарій); номер виду — його місце в реєстрі.
 * (· 19) ІНВЕНТАРИЗАЦІЯ: Nexi (actors/nexi/activities.js census) на ранці підлітає до рослин і читає їх ручним сканером — зелений
 * промінь від сканера до рослини (scanFrom), кільце на ній, картка виду відкривається сама (як від тапу). Бирки з номерами біля
 * рослин були в · 19 і прибрані в · 21 (власник: «таблички з номерами прибираємо — просто коли на рослину жмемо, інформація»).
 * Камера на картку не реагує (тап по декору — не команда Nexi). Картка сама ховається за HIDE с; тап по ній — закрити.
 * (· 27) РЕЧІ NEXI: штучки в сотах-полицях (куля, книжки, тераріум, колба, мікроскоп, статуетка — dc_art, ART_KINDS) теж мають
 * картку: «РІЧ NEXI · №N», назва й підпис-історія (i18n decor.guide.art.items.<kind>.n / .d), малюнок — шматок зібраної сцени
 * (NX.arc.built[side].comp) навколо штучки. Тап по порожньому місцю соти відкриває картку її вмісту (рослини чи речі). Речі не
 * входять у реєстр урятованих видів (свій лічильник count).
 * ========================================================================== */
(() => {
  const X = NX.px3d, HIDE = 6.5, HIDE_ART = 12, GROUPS = ['wall', 'garden', 'floor', 'farm', 'reef', 'jelly', 'shroom'];   // (15.11) shroom — гриби грибниці (у кінці: номери решти видів не зсуваються)   // (· 43) garden — сад за диваном (жардиньєр + висячі)   // (· 31) floor — вазони перед вікном
  const $ = id => document.getElementById(id);
  let REG = null, cur = null, timer = 0, LAST = null;                                                            // LAST — остання показана картка (· 60: голо-монітор рифу показує скан виду)
  /** Реєстр видів зі словника: [{grp, kind, no}] і мапа kind -> запис. */
  function reg() {
    if (REG) return REG; const list = [], by = {};
    for (const grp of GROUPS) { const d = NX.t('decor.guide.sp.' + grp); if (!d || typeof d !== 'object') continue; for (const kind of Object.keys(d)) { const e = { grp, kind, no: list.length + 1 }; list.push(e); by[grp + '.' + kind] = e; } }
    return REG = { list, by, n: list.length };
  }
  const ART_KINDS = NX.decorArt ? NX.decorArt.KINDS : [];                                                          // (· 27, · 55) речі Nexi в сотах — 13 артефактів (objects/decor_art.js)
  const find = (grp, kind) => grp === 'art' ? (ART_KINDS.includes(kind) ? { grp, kind, no: ART_KINDS.indexOf(kind) + 1 } : null) : (reg().by[grp + '.' + kind] || null);
  const WALL_ALIAS = { fungi: 'shroom', green: 'orchid' };                                                   // тапи decor_live без спрайта рослини -> вид

  // ---------- нерухомі рослини: коробки на екрані з розкладки (один раз) ----------
  let STAT = null, HEXC = [];
  function statics() {
    if (STAT) return STAT; STAT = []; const DC = NX.decor; if (!DC || !NX.arc.kit) return STAT;
    const live = NX.arc.dcLive || {};
    const box = B => { const { P } = NX.arc.kit.basis(B); let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      for (const u of [-B.w / 2, B.w / 2]) for (const v of [0, B.dep]) for (const y of [B.yt, B.yb]) { const q = X.proj(P(u, v, y)); x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); }
      return { x0, x1, y0, y1, a: (x1 - x0) * (y1 - y0), z: P(0, B.dep / 2, B.yb)[2] }; };
    HEXC = [];
    for (const B of DC.items) { const d = B.dc; if (!d) continue;
      if (B.st === 'dc_hex') { HEXC.push(Object.assign({ id: B.id }, box(B))); continue; }                                   // (· 27) комірки сот — для тапу повз вміст
      const art = B.st === 'dc_art' && ART_KINDS.includes(d.kind), kind = d.plant || d.kind;
      if (!kind || (!art && !find('wall', kind)) || live[B.id] || B.st === 'dc_pylon') continue;
      STAT.push(Object.assign({ kind, grp: art ? 'art' : 'wall', on: B.on || null, neon: art && B.on && DC.byId[B.on] && DC.byId[B.on].dc ? DC.byId[B.on].dc.neon : null }, box(B))); }
    return STAT;
  }

  // ---------- (· 19, · 21) точки рослин для сканера Nexi ----------
  const SP = { list: [], n: -1 }; let SCAN = null;
  /** Усі рослини стін (живі LP + нерухомі): [{kind, no, cx, cy, z}] — cx, cy — точка на рослині (екран, нижня третина), z — глибина. */
  function spots() {
    const DL = NX.decorLive, LP = DL ? DL.LP : []; if (LP.length === SP.n) return SP.list; SP.n = LP.length; const out = [], seen = {};
    const put = (kind, x0, x1, y0, y1, z) => { const e = find('wall', kind); if (!e || seen[kind]) return; seen[kind] = 1; out.push({ kind, no: e.no, cx: (x0 + x1) / 2, cy: y0 + (y1 - y0) * .62, z }); };
    for (const L of LP) if (L.e && L.e.sp) put(L.e.sp.kind, L.x0, L.x1, L.y0, L.y1, L.e.P3 ? L.e.P3[2] : 100);
    for (const S of statics()) if (S.grp === 'wall') put(S.kind, S.x0, S.x1, S.y0, S.y1, S.z);
    return SP.list = out;
  }
  function drawScan(c, t) {
    if (!SCAN || t - SCAN.t0 >= SCAN.dur) return;                                                                 // промінь сканера: пунктир від руки до рослини, біжить до неї
    const k = Math.min(1, (t - SCAN.t0) / .35), dx = SCAN.x1 - SCAN.x0, dy = SCAN.y1 - SCAN.y0, L = Math.hypot(dx, dy); c.save(); c.globalCompositeOperation = 'lighter';
    for (let s = (t * 40) % 3; s < L * k; s += 3) { const u = s / L; c.globalAlpha = .95 - u * .3; c.fillStyle = '#8affc0'; c.fillRect(SCAN.x0 + dx * u - .7, SCAN.y0 + dy * u - .7, 1.4, 1.4); }
    c.globalAlpha = .4 + .25 * Math.sin(t * 30); c.strokeStyle = '#3bff8a'; c.lineWidth = 1.1; c.beginPath(); c.moveTo(SCAN.x0, SCAN.y0); c.lineTo(SCAN.x0 + dx * k, SCAN.y0 + dy * k); c.stroke();
    if (k >= 1) { const r = 4 + 2.5 * Math.sin(t * 9); c.globalAlpha = .6; c.beginPath(); c.arc(SCAN.x1, SCAN.y1, r, 0, 6.2832); c.stroke(); c.globalAlpha = .35; c.beginPath(); c.arc(SCAN.x1, SCAN.y1, r * 1.8, 0, 6.2832); c.stroke(); }
    c.restore();
  }

  // ---------- спрайт виду на полотно картки ----------
  /** (15.11) Вазон для картки — плаский піксельний малюнок за описом із розкладки (dc.pot: shape, mat, band, pw, ph), q пікселів на
   *  одиницю: профіль форми, циліндричне світло зліва, світлий обідок, неонова смуга, темний контур; кошик — плетіння, кокедама —
   *  мох у джуті, сітка — шахові вічка. Той самий вазон, що в кімнаті (там він об'ємний — objects/dc_paint.js potDraw). */
  const POT_COL = { terra: [184, 100, 42], navy: [22, 50, 142], ceram: [226, 228, 240], dark: [44, 44, 62], chrome: [176, 190, 212], gold: [232, 176, 64], pink: [255, 122, 192], stone: [118, 118, 138], jade: [48, 150, 106], copper: [216, 132, 62],
    concrete: [94, 94, 114], enamel: [46, 94, 204], wicker: [170, 122, 62], moss: [60, 150, 54], steel: [138, 148, 168] };
  const BAND_COL = { cyan: '#3be8ff', pink: '#ff6ad8', gold: '#ffd23a', orange: '#ff9a3a', lil: '#c77dff', green: '#3bff8a' };
  function potCard(Pd, q) {
    const w = Math.max(6, Math.round(Pd.pw * q)), h = Math.max(5, Math.round(Pd.ph * q)), cv = document.createElement('canvas'); cv.width = w + 2; cv.height = h + 2; const c = cv.getContext('2d'), im = c.createImageData(w + 2, h + 2), d = im.data;
    const base = POT_COL[Pd.mat] || POT_COL.ceram, shp = Pd.shape, hs = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
    const prof = v => shp === 'taper' ? 1 - .26 * v : shp === 'bowl' ? (v < .5 ? 1 : 1 - .9 * (v - .5) * (v - .5) * 4 * .5) : shp === 'tall' ? .9 : shp === 'cube' ? 1 : shp === 'basket' ? 1 - .3 * v : shp === 'net' ? 1 - .2 * v
      : Math.sqrt(Math.max(.05, 1 - Math.pow((v - .52) / .56, 2)));                                                              // orb, moss — коло
    const put = (x, y, r, g, b) => { const i = ((y + 1) * (w + 2) + x + 1) * 4; d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255; };
    for (let y = 0; y < h; y++) { const v = (y + .5) / h, hw = prof(v) * w / 2, x0 = Math.round(w / 2 - hw), x1 = Math.round(w / 2 + hw) - 1;
      for (let x = x0; x <= x1; x++) { const u = (x - x0 + .5) / (x1 - x0 + 1), edge = x === x0 || x === x1 || y === h - 1 || (y === 0 && shp !== 'orb' && shp !== 'moss');
        let L = .5 + .62 * Math.cos((u - .3) * Math.PI * .95) * .8 + (y < Math.max(1, q * .5) ? .28 : 0) - v * .12;                         // світло зліва, світлий обідок, темніший низ
        if (shp === 'basket') L *= ((Math.floor(x / Math.max(1, q * .5)) + Math.floor(y / Math.max(1, q * .4))) & 1) ? 1.12 : .78;
        if (shp === 'net' && ((Math.floor(x / Math.max(1, q * .3)) + Math.floor(y / Math.max(1, q * .3))) & 1) && y > q * .4) L *= .35;
        if (shp === 'moss') { L += (hs(x >> 1, y >> 1) - .5) * .5 + (hs(x, y) > .82 ? .2 : 0); const d1 = (u * 3 + v * 1.2) % 1, d2 = (u * 3 - v * 1.2 + 4) % 1; if (Math.abs(d1 - .5) < .07 || Math.abs(d2 - .5) < .07) { put(x, y, 200 * L + 30, 160 * L + 20, 100 * L + 10); continue; } }
        if (Pd.mat === 'stone' || Pd.mat === 'concrete') L += (hs(x >> 1, y >> 1) - .5) * .18;
        if (edge) L *= .32; L = Math.max(.12, Math.min(1.35, L)); put(x, y, Math.min(255, base[0] * L), Math.min(255, base[1] * L), Math.min(255, base[2] * L)); } }
    c.putImageData(im, 0, 0);
    if (Pd.band && BAND_COL[Pd.band] && shp !== 'moss') { const v = shp === 'orb' ? .4 : .34, hw = prof(v) * w / 2, bh = Math.max(1, Math.round(q * .45)); c.fillStyle = BAND_COL[Pd.band]; c.fillRect(Math.round(w / 2 - hw) + 2, 1 + Math.round(h * v), Math.round(hw * 2) - 2, bh); c.globalAlpha = .5; c.fillStyle = '#ffffff'; c.fillRect(Math.round(w / 2 - hw * .5), 1 + Math.round(h * v), Math.round(hw * .5), Math.max(1, bh >> 1)); c.globalAlpha = 1; }
    return cv;
  }
  function drawSprite(e, info) {
    const cv = $('guide').querySelector('canvas'); if (!cv) return; const n = CW, R = Math.min(3, Math.max(1, Math.round(devicePixelRatio || 1))); if (e.grp === 'art' || e.grp === 'bot') return; fitCanvas(cv, CW, CH, R);
    const c = cv.getContext('2d'); c.setTransform(R, 0, 0, R, 0, 0); c.clearRect(0, 0, CW, CH); stage(c, 1.2, '#3be8ff'); c.imageSmoothingEnabled = false;   // (· 63) та сама сцена, що в артефактів
    const fit = (src, pad = 6, whole = false) => {                                                            // whole — не різати на фрагмент (рослина з вазоном унизу)                                                                          // обрізати порожнє навколо спрайта й вписати в полотно
      const w = src.width, h = src.height; let x0 = w, y0 = h, x1 = -1, y1 = -1; try { const d = src.getContext('2d').getImageData(0, 0, w, h).data; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 40) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } } catch (err) { x0 = y0 = 0; x1 = w - 1; y1 = h - 1; }
      if (x1 < 0) { x0 = y0 = 0; x1 = w - 1; y1 = h - 1; }
      // (14.11, власник: «якщо це якась ліана — то тільки її шматок у картці») довга вузька рослина: беремо верхній фрагмент (висота = 1.5 ширини), низ тане
      let frag = false; if (!whole && (y1 - y0 + 1) > (x1 - x0 + 1) * 1.9) { y1 = y0 + Math.round((x1 - x0 + 1) * 1.5); frag = true; }
      const sw = x1 - x0 + 1, sh = y1 - y0 + 1, aw = CW - 16 - pad * 2, ah = PY - 8 - pad; let k = Math.min(aw / sw, ah / sh, 6); if (k > 1) k = Math.floor(k * R) / R;   /* цілі пікселі екрана — без каші */
      const dw = sw * k, dh = sh * k; c.globalAlpha = .28; c.fillStyle = '#05020f'; c.beginPath(); c.ellipse(CW / 2, PY, Math.min(34, dw * .4), 3, 0, 0, 6.2832); c.fill(); c.globalAlpha = 1;
      if (!frag) { c.drawImage(src, x0, y0, sw, sh, Math.round((CW - dw) / 2), Math.round(PY - 2 - dh - Math.max(0, (ah - dh) * .35)), dw, dh); return; }
      const o = document.createElement('canvas'); o.width = sw; o.height = sh; const oc = o.getContext('2d'); oc.drawImage(src, x0, y0, sw, sh, 0, 0, sw, sh);                     // фрагмент: нижня чверть плавно зникає
      const g = oc.createLinearGradient(0, sh * .72, 0, sh); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,1)'); oc.globalCompositeOperation = 'destination-out'; oc.fillStyle = g; oc.fillRect(0, sh * .72, sw, sh * .28 + 1);
      c.drawImage(o, Math.round((CW - dw) / 2), Math.round(PY - 6 - dh), dw, dh); };
    try {
      if (e.grp === 'art') return;                                                                             // (· 55) артефакт соти малює artCard (живий кадр)
      if (e.grp === 'shroom') { const k = NX.shroom ? NX.shroom.KINDS.indexOf(e.kind) : -1; if (k < 0) return; const m = NX.arc.mushCanvas(k, 96, 2), o = document.createElement('canvas'); o.width = 132; o.height = 122; const oc = o.getContext('2d');   // (15.11) гриб на своєму лотку з ґрунтом
        oc.imageSmoothingEnabled = false; oc.save(); oc.translate(66, 98); oc.scale(16, 16); const sh = NX.shroom.tray(oc, k, 1.2); oc.restore(); oc.drawImage(m, 18, 98 - sh * 16 - 94); fit(o, 2, true); return; }
      if (e.grp === 'floor' || e.grp === 'garden') { const p = NX.planters && NX.planters.PL.find(q => q.kind === e.kind); if (!p) return;
        if (NX.planters.sprite) { fit(NX.planters.sprite(p), 4); return; }                                               // (· 34) герой перед вікном — власний спрайт
        const r = NX.arc.dcPlant({ kind: p.kind, w: p.w, h: p.h, seed: p.seed, lit: 1, pad: 14 }); if (!r) return;
        const o = document.createElement('canvas'); o.width = r.sw; o.height = r.sh; const oc = o.getContext('2d'), im = oc.createImageData(r.sw, r.sh); new Uint32Array(im.data.buffer).set(r.d); oc.putImageData(im, 0, 0); fit(o, 4); return; }
      if (e.grp === 'wall' && NX.decorVines && NX.decorVines.has(e.kind)) { fit(NX.decorVines.sprite(e.kind), 3); return; }   // (· 57) ліана між сотами — власний спрайт
      if (e.grp === 'wall') { const sp0 = (NX.arc.dcSpec && NX.arc.dcSpec[e.kind]) || { kind: e.kind, w: 16, h: 14, seed: 8, lit: 1, pad: 8 };   // (14.11) виду нема серед предметів розкладки (гриби пілона) — спрайт за типовим розміром
        // (15.11, власник: «якщо рослина в горщечку прикольному — він теж має відображатися в карточці… передивися всі рослини під рендер»)
        // малюнок для картки — окремий: та сама рослина вдвічі щільнішим растром (u), разом зі своїм вазоном (potCard)
        const r = NX.arc.dcPlant(Object.assign({}, sp0, { u: .125 })); if (!r) return; const q = 1 / r.U;                             // q — пікселів на одиницю
        const B = (NX.decor.items || []).find(b => b.dc && b.dc.kind === e.kind && b.dc.pot && (b.st === 'dc_pot' || b.st === 'dc_hang')), Pd = B && B.dc.pot, frm = B ? (B.st === 'dc_pot' ? 'pot' : B.dc.frm) : null;
        const spr = document.createElement('canvas'); spr.width = r.sw; spr.height = r.sh; { const oc = spr.getContext('2d'), im = oc.createImageData(r.sw, r.sh); new Uint32Array(im.data.buffer).set(r.d); oc.putImageData(im, 0, 0); }
        if (!Pd || !Pd.pw) { fit(spr, 4); return; }
        const pot = potCard(Pd, q), stand = frm === 'pot' || frm === 'string', o = document.createElement('canvas'), oc = o.getContext('2d'); o.width = Math.max(r.sw, pot.width + 4);
        if (stand) { const ov = Math.round((frm === 'string' ? 1.6 : 1.2) * q); o.height = r.sh + pot.height - ov; oc.drawImage(pot, Math.round((o.width - pot.width) / 2), r.sh - ov); oc.drawImage(spr, Math.round((o.width - r.sw) / 2), 0); fit(o, 4, true); return; }   // вазон унизу, рослина з нього — цілою
        else { const top = Math.round(7 * q), py = top + Math.round((r.pad + 1.5) * q); o.height = r.sh + top; const cx = o.width / 2;                                                    // підвісний: шнури, вазон угорі, рослина звисає поверх
          oc.strokeStyle = '#c8a070'; oc.lineWidth = Math.max(1, q * .3); for (const k of [-1, 1]) { oc.beginPath(); oc.moveTo(cx, 1); oc.lineTo(cx + k * pot.width * .42, py + 2); oc.stroke(); }
          oc.fillStyle = '#e8b040'; oc.fillRect(cx - q * .5, 0, q, q); oc.drawImage(pot, Math.round(cx - pot.width / 2), py); oc.drawImage(spr, Math.round((o.width - r.sw) / 2), top); }
        fit(o, 4); return; }
      if (e.grp === 'farm') { const S = NX.decorFarm && NX.decorFarm.plantSpr(e.kind, info && info.s != null ? info.s : 1); if (S) fit(S.cv); return; }
      const S = NX.decor.frame && (NX.decor.SPR[e.kind] || (NX.decor.JELLY && NX.decor.JELLY[e.kind])) ? NX.decor.frame(e.kind, 0) : null;
      if (S) { fit(S.cv); return; }
      if (info && info.aq) {                                                                                  // нерухомі мешканці: шматок живого шару акваріума навколо точки
        const M = NX.decor.MK[info.aq]; if (!M || !M.out) return; const Rd = M.out.width / M.w, r = Math.max(6, info.r || 6), sx = (info.x - r - M.x) * Rd, sy = (info.y - r - M.y) * Rd;
        c.imageSmoothingEnabled = true; c.drawImage(M.out, sx, sy, 2 * r * Rd, 2 * r * Rd, 14, 14, CW - 28, CW - 28); }
    } catch (err) { /* спрайта нема — картка без малюнка */ }
  }

  // ---------- (· 55) картка артефакта: об'єкт цілий, збільшений і ЖИВИЙ ----------
  /** Полотно 96×96: ніша-сота кольору своєї комірки (контур шестикутника, сяйво, поличка), на ній артефакт ×3 — той самий
   *  спрайт, що стоїть у кімнаті (NX.decorArt.sprite), кадр за кадром, поки картка відкрита. */
  let raf = 0;
  /** Розмір полотна картки: w×h CSS-пікселів, ×R справжніх. Міряємо й ширину, і висоту: нове полотно браузера — 300×150, і на
   *  екранах із щільністю 3 (телефони) перевірка «ширина ≠ 100·3» не спрацьовувала — картка артефакта, відкрита першою, лишалась
   *  300×150 у рамці 64×64, і річ було видно шматком (13–14.11, власник: «артефакти виглядають не повністю»). */
  function fitCanvas(cv, w, h, R) { if (cv.width !== w * R || cv.height !== h * R) { cv.width = w * R; cv.height = h * R; } cv.style.width = w + 'px'; cv.style.height = h + 'px'; }
  /** (· 61, власник 14.11: «у картці його має бути видно повністю та красиво — повна модель артефакту») Картка артефакта: полотно
   *  116×132, річ ×4 (112×120) — уся в кадрі, з полем довкола; малюється у справжніх пікселях екрана (K = 4·R — на телефоні ×12:
   *  плавні краї й тонкі переходи світла), 10 кадрів/с — жива. За нею — велика неонова сота з вогником по кромці й сяйво кольору
   *  соти; під нею — круглий постамент із двома неоновими кільцями й відблиском; річ ледь «плаває»; довкола мерехтять іскри.
   *  Щойно картка відкрилась — артефакт грає свою реакцію на тап (u). */
  /** (· 63, власник 14.11: «треба, щоб розмірами співпадало все») УСІ картки довідника — одного розміру: полотно CW×CH (116×132) і та
   *  сама сцена — велика сота, сяйво, постамент із неоновими кільцями. Артефакт, рослина, риба, медуза й дрон стоять на ній однаково;
   *  відрізняється лише колір: у артефактів — свій (ART_COL), у врятованих видів і дрона — бірюза довідника. */
  const CW = 116, CH = 132, PY = 119;
  function stage(c, t, neon) { const w = CW, h = CH, m = w / 2;
    const bg = c.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#0c0a2e'); bg.addColorStop(1, '#070518'); c.fillStyle = bg; c.fillRect(0, 0, w, h);
    const cy = 60, P6 = (q, r) => [m + r * Math.cos(q * Math.PI / 3 + Math.PI / 6), cy + r * Math.sin(q * Math.PI / 3 + Math.PI / 6)], hexP = r => { c.beginPath(); for (let q = 0; q < 6; q++) { const p = P6(q, r); q ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); } c.closePath(); };
    const g = c.createRadialGradient(m, cy - 6, 4, m, cy, 62); g.addColorStop(0, neon + '70'); g.addColorStop(.55, neon + '22'); g.addColorStop(1, neon + '00'); hexP(57); c.fillStyle = '#14113e'; c.fill(); c.fillStyle = g; c.fill();
    c.save(); hexP(57); c.clip(); c.globalAlpha = .07; c.fillStyle = neon; for (let y = 4; y < h; y += 4) c.fillRect(0, y, w, 1); c.restore();                                  // тонкі рядки — «вітрина»
    c.globalAlpha = .6 + .25 * Math.sin(t * 2); c.strokeStyle = neon; c.lineWidth = 2; hexP(56); c.stroke(); c.globalAlpha = .22; c.lineWidth = 1; hexP(50); c.stroke(); c.globalAlpha = 1;
    { const u = (t * .5) % 6, i = Math.floor(u), f = u - i, A = P6(i, 56), B = P6((i + 1) % 6, 56); c.fillStyle = '#ffffff'; c.fillRect(A[0] + (B[0] - A[0]) * f - 1.5, A[1] + (B[1] - A[1]) * f - 1.5, 3, 3); }   // вогник по кромці — як у кімнаті
    // постамент: тінь, диск, два неонові кільця, відблиск
    const py = PY; c.fillStyle = '#05020f'; c.globalAlpha = .5; c.beginPath(); c.ellipse(m, py + 4, 44, 7, 0, 0, 6.2832); c.fill(); c.globalAlpha = 1;
    c.fillStyle = '#1c1a4a'; c.beginPath(); c.ellipse(m, py + 2.5, 40, 6.5, 0, 0, 6.2832); c.fill(); c.fillStyle = '#2c2a6a'; c.beginPath(); c.ellipse(m, py, 40, 6.5, 0, 0, 6.2832); c.fill();
    c.strokeStyle = neon; c.lineWidth = 1.5; c.globalAlpha = .9; c.beginPath(); c.ellipse(m, py, 40, 6.5, 0, 0, 6.2832); c.stroke(); c.lineWidth = 1; c.globalAlpha = .35 + .25 * Math.sin(t * 3); c.beginPath(); c.ellipse(m, py, 30, 4.6, 0, 0, 6.2832); c.stroke();
    { const a = t * 1.2; c.globalAlpha = .9; c.fillStyle = '#ffffff'; c.fillRect(m + Math.cos(a) * 40 - 1, py + Math.sin(a) * 6.5 - 1, 2, 2); } c.globalAlpha = 1;                 // вогник по кільцю
  }
  let artT0 = 0, artK = '';
  /** (· 62, власник 14.11: «зроби кожну карточку в кольорі якомусь унікальному, підходящому під артефакт») Свій колір картки в
   *  кожного з 13 артефактів — рамка, сяйво, заголовок, сота й постамент: золото статуетки, індиго кулі, червоний корінців книжок,
   *  листяний зелений тераріуму, м'ята сироватки, сталевий блакитний мікроскопа, бурштин кубка, малина лава-лампи, пісок годинника,
   *  бірюза глобуса, орхідея кристалів, лайм термінала; куб — переливається всіма своїми кольорами. */
  const ART_COL = { figure: '#ffc93a', orb: '#6a7dff', books: '#ff5a5a', terrarium: '#7ad84a', flask: '#2affb0', scope: '#9ab4ff', cup: '#ffa030', lamp: '#ff4f7a', hourglass: '#d9a860', globe: '#3be8ff', crystal: '#e59aff', console: '#b8ff3a' };
  const CUBE = ['#ff5a5a', '#ffa030', '#ffe14a', '#4ae06a', '#3be8ff', '#6a7dff'];
  function artCol(kind, t) { if (kind !== 'cube') return ART_COL[kind] || '#ffd27a'; const u = (t * .5) % CUBE.length, i = Math.floor(u), f = u - i, a = CUBE[i], b = CUBE[(i + 1) % CUBE.length], ch = (h, k) => parseInt(h.slice(1 + k * 2, 3 + k * 2), 16);
    return '#' + [0, 1, 2].map(k => Math.round(ch(a, k) + (ch(b, k) - ch(a, k)) * f).toString(16).padStart(2, '0')).join(''); }
  function tint(el, col) { el.style.borderColor = col; el.style.boxShadow = col ? `0 0 18px ${col}55, inset 0 0 22px ${col}1c` : ''; el.style.background = col ? `linear-gradient(120deg, ${col}26, #060a24f2 58%)` : ''; el.querySelector('b').style.color = col || ''; el.querySelector('.gw').style.color = col || ''; el.querySelector('canvas').style.borderColor = col ? col + '99' : ''; }
  function artCard() {
    cancelAnimationFrame(raf); if (!cur || cur.e.grp !== 'art' || !NX.decorArt) return; raf = requestAnimationFrame(artCard);
    const cv = $('guide').querySelector('canvas'), w = CW, h = CH, R = Math.min(3, Math.max(1, Math.round(devicePixelRatio || 1))), t = performance.now() / 1000, DA = NX.decorArt, kind = cur.e.kind, neon = artCol(kind, t);
    if (artK !== kind) { artK = kind; artT0 = t; } fitCanvas(cv, w, h, R); if (kind === 'cube') tint($('guide'), neon);
    const c = cv.getContext('2d'); c.setTransform(R, 0, 0, R, 0, 0); c.clearRect(0, 0, w, h); c.imageSmoothingEnabled = false;
    stage(c, t, neon); const m = CW / 2, py = PY;
    // сам артефакт — цілий, ×4, у справжніх пікселях; ледь плаває над постаментом
    const S = 4, sw = DA.W * S, sh = DA.H * S, bob = Math.round(Math.sin(t * 1.6) * 1.5 * R) / R, x = m - sw / 2, y = py - 1 - sh + bob, u = t - artT0;
    c.globalAlpha = .28; c.fillStyle = '#05020f'; c.beginPath(); c.ellipse(m, py, sw * .3 - bob * 2, 3, 0, 0, 6.2832); c.fill(); c.globalAlpha = 1;
    const gl = c.createRadialGradient(m, y + sh * .55, 2, m, y + sh * .55, sw * .62); gl.addColorStop(0, DA.glow(kind) + '40'); gl.addColorStop(1, DA.glow(kind) + '00'); c.fillStyle = gl; c.fillRect(0, 0, w, h);   // власне сяйво речі
    c.drawImage(DA.sprite(kind, t, S * R, u < 2.4 ? u : -1), x, y, sw, sh);
    // іскри довкола
    for (let q = 0; q < 7; q++) { const ph = q * 1.7, f = (t * .35 + q / 7) % 1, a = Math.sin(f * Math.PI), sx = m + Math.cos(ph) * (34 + 14 * ((q * 37) % 10) / 10), sy = 26 + ((q * 53) % 70) - f * 10;
      c.globalAlpha = a * .9; c.fillStyle = q % 2 ? neon : '#ffffff'; c.fillRect(Math.round(sx) - .5, Math.round(sy) - 2, 1, 4); c.fillRect(Math.round(sx) - 2, Math.round(sy) - .5, 4, 1); } c.globalAlpha = 1;
  }

  /** (· 59) Портрет дрона в картці: живий (гвинт крутиться, око блимає), поки картка відкрита. */
  function botCard() {
    cancelAnimationFrame(raf); if (!cur || cur.e.grp !== 'bot' || !NX.decorDrone) return; raf = requestAnimationFrame(botCard);
    const cv = $('guide').querySelector('canvas'), R = Math.min(3, Math.max(1, Math.round(devicePixelRatio || 1))), t = performance.now() / 1000, p = NX.decorDrone.portrait(t); fitCanvas(cv, CW, CH, R);
    const c = cv.getContext('2d'); c.setTransform(R, 0, 0, R, 0, 0); c.clearRect(0, 0, CW, CH); stage(c, t, '#3be8ff');                                                       // (· 63) та сама сцена й розмір, що в усіх
    c.imageSmoothingEnabled = R !== 1 && R !== 3; c.drawImage(p, Math.round(CW / 2 - p.width / 2), Math.round(PY - 14 - p.height + Math.sin(t * 1.6) * 2));
  }

  // ---------- картка ----------
  function render() {
    const el = $('guide'); if (!el || !cur) return; const { e, info } = cur, T = NX.t, R = reg(); el.style.boxShadow = el.style.background = ''; el.querySelector('b').style.color = el.querySelector('.gw').style.color = el.querySelector('canvas').style.borderColor = '';   // (· 62) колір картки артефакта не лишається на інших картках
    if (e.grp === 'bot') {                                                                                   // (· 59) картка дрона-куратора — така сама, як у всіх
      el.querySelector('b').textContent = T('decor.guide.bot.head'); el.querySelector('.gn').textContent = T('decor.guide.bot.n'); el.querySelector('small').textContent = T('decor.guide.bot.d');
      el.querySelector('.gw').textContent = T('decor.guide.bot.kind') + ' · ' + T('decor.guide.art.where'); el.querySelector('.gc').textContent = ''; el.style.borderColor = '#3be8ff'; botCard(); return; }
    if (e.grp === 'art') {                                                                                   // (· 27) картка речі Nexi: назва, підпис-історія, золота рамка
      el.querySelector('b').textContent = T('decor.guide.art.head') + ' · ' + T('decor.guide.no') + String(e.no).padStart(2, '0');
      el.querySelector('.gn').textContent = T(`decor.guide.art.items.${e.kind}.n`); el.querySelector('small').textContent = T(`decor.guide.art.items.${e.kind}.d`);
      el.querySelector('.gw').textContent = T('decor.guide.art.kind') + ' · ' + T('decor.guide.art.where'); el.querySelector('.gc').textContent = T('decor.guide.art.count', { n: ART_KINDS.length });
      tint(el, artCol(e.kind, performance.now() / 1000)); artCard(); return; }
    el.querySelector('b').textContent = T(e.grp === 'shroom' && NX.shroom && NX.shroom.KINDS.indexOf(e.kind) >= 8 ? 'decor.guide.bred' : 'decor.guide.head') + ' · ' + T('decor.guide.no') + String(e.no).padStart(3, '0');
    el.querySelector('.gn').textContent = T(`decor.guide.sp.${e.grp}.${e.kind}`);
    const lat = T('decor.guide.latin.' + e.kind), dsc = e.grp === 'shroom' ? T('decor.guide.shroomd.' + e.kind) : ''; el.querySelector('small').textContent = (lat.startsWith('decor.') ? '' : lat) + (dsc && !dsc.startsWith('decor.') ? ' — ' + dsc : '');   // (15.11) у грибів — ще й підпис-історія
    const kindT = e.grp === 'reef' ? 'fish' : e.grp === 'jelly' ? 'jel' : e.grp === 'shroom' ? 'shroom' : 'plant', gs = e.grp === 'wall' && NX.decorGrow ? NX.decorGrow.state(e.kind) : null;   // (· 22) росте / цвіте
    el.querySelector('.gw').textContent = T('decor.guide.kind.' + kindT) + ' · ' + T('decor.guide.where.' + e.grp) + (e.grp === 'farm' && info && info.s != null ? ' · ' + T('decor.guide.stage', { s: Math.min(6, Math.floor(info.s * 6) + 1) }) : '') + (gs ? ' · ' + T('decor.guide.grow.' + gs) : '');
    el.querySelector('.gc').textContent = T('decor.guide.count', { n: R.n });
    el.style.borderColor = { wall: '#3bff8a', garden: '#7aff9a', floor: '#9aff6a', farm: '#b8ff3a', reef: '#3be8ff', jelly: '#d94bff', shroom: '#c77dff' }[e.grp];
    drawSprite(e, info);
  }
  function show(e, info) {
    const el = $('guide'); if (!el || !e) return; cur = { e, info }; LAST = { e, t: NX.time }; render(); el.classList.add('show');
    clearTimeout(timer); timer = setTimeout(hide, (e.grp === 'art' || e.grp === 'shroom' ? HIDE_ART : HIDE) * 1000);                    // (· 55) артефакт — довше: є на що дивитись
  }
  function hide() { const el = $('guide'); if (el) el.classList.remove('show'); cur = null; }
  { const el = $('guide'); if (el) el.addEventListener('click', hide); }                                    // розмітка — вище скриптів (index.html)
  NX.i18n.onLang(() => { REG = null; if (cur) render(); });

  NX.decorGuide = {
    reg, statics, show, hide, spots, get last() { return LAST; },
    /** (· 59) Тап по дрону-куратору (objects/decor_drone.js). */
    showBot() { show({ grp: 'bot', kind: 'drone', no: 0 }); },
    /** (· 19) Промінь сканера на живий шар (objects/decor_live.js draw). */
    draw: drawScan,
    /** Куди летіти Nexi сканувати рослини на стіні side: [{kind, x, y, z}] (точка на рослині; z — глибина), 3 випадкові, зліва направо. */
    scanSpots(side, n = 3) { const all = spots().filter(g => side === 'left' ? g.cx < 774 : g.cx >= 774), pick = []; while (all.length && pick.length < n) pick.push(all.splice(Math.random() * all.length | 0, 1)[0]); return pick.sort((a, b) => a.cx - b.cx).map(g => ({ kind: g.kind, x: g.cx, y: g.cy, z: g.z })); },
    /** Nexi сканує: промінь від руки (hx, hy) до рослини виду kind, dur с; на половині — картка виду відкривається. */
    scanFrom(hx, hy, kind, t, dur = 1.6) { const g = spots().find(q => q.kind === kind); if (!g) return; SCAN = { x0: hx, y0: hy, x1: g.cx, y1: g.cy, t0: t, dur, kind }; },
    scanTick(hx, hy, t, k) { if (!SCAN) return; SCAN.x0 = hx; SCAN.y0 = hy; if (k > .45 && !SCAN.done) { SCAN.done = 1; if (SCAN.art) { const TP = NX.decorLive && NX.decorLive.TP; if (TP && SCAN.art.on) TP.hex[SCAN.art.on] = t; show(find('art', SCAN.art.kind), { neon: SCAN.art.neon }); } else show(find('wall', SCAN.kind)); } },
    /** (· 57) Nexi оглядає колекцію (activities.js curate): артефакти сот на стіні side -> [{kind, x, y, z, on, neon}], n випадкових зліва направо. */
    artSpots(side, n = 3) { const all = statics().filter(S => S.grp === 'art' && (side === 'left' ? S.x0 < 774 : S.x0 >= 774)), pick = []; while (all.length && pick.length < n) pick.push(all.splice(Math.random() * all.length | 0, 1)[0]); return pick.sort((a, b) => a.x0 - b.x0).map(S => ({ kind: S.kind, x: (S.x0 + S.x1) / 2, y: (S.y0 + S.y1) / 2, z: S.z, on: S.on, neon: S.neon })); },
    /** Промінь від руки Nexi до артефакта sp; на половині — артефакт «спрацьовує» (як від тапу) і відкривається його картка. */
    scanArt(hx, hy, sp, t, dur = 1.9) { SCAN = { x0: hx, y0: hy, x1: sp.x, y1: sp.y, t0: t, dur, art: sp }; },
    scanEnd() { SCAN = null; },
    /** Тап, який уже влучив у декор (objects/decor_live.js tap): hit — що саме, L — рослина LP (hit 'plant'). */
    tap(hit, x, y, t, L) {
      if (hit === 'plant' && L && L.e && L.e.sp) return show(find('wall', L.e.sp.kind));
      if (WALL_ALIAS[hit]) return show(find('wall', WALL_ALIAS[hit]));
      if (hit === 'shroom' && NX.shroom) { const TP = NX.decorLive && NX.decorLive.TP; return show(find('shroom', NX.shroom.KINDS[TP && TP.shroom ? TP.shroom.k : 0])); }   // (15.11) гриб грибниці
      if (hit === 'hex') return void this.tapStatic(x, y);
      if (hit === 'vine' && NX.decorVines) return show(find('wall', NX.decorVines.lastKind));                          // (· 57) ліана між сотами
      if (hit === 'vault' && NX.decorVault) return show(find('farm', NX.decorVault.lastKind));
      if (hit === 'planter' && NX.planters) return show(find('garden', NX.planters.lastKind) || find('floor', NX.planters.lastKind));                   // (· 31) вазон перед вікном                   // (· 20) капсула сховища насіння                                                   // рослина в соті (бонсай, ехеверія, кактус, сансев'єрія)
      if (hit === 'farm' && NX.decorFarm && NX.decorFarm.nearTray) { const tr = NX.decorFarm.nearTray(x, y, t); if (tr && tr.d < 30) return show(find('farm', tr.kind), tr); return; }
      if (hit === 'aq') { const TP = NX.decorLive && NX.decorLive.TP, aq = TP && TP.aq && TP.aq.aq; if (!aq) return;
        let best = null, bd = 1e9;
        for (const f of NX.decor.crewAt(aq, t)) { const d = Math.hypot(f.x - x, f.y - y) - Math.max(f.w, f.h) * .35; if (d < bd) { bd = d; best = { e: find(aq, f.kind), info: null }; } }
        if (NX.decorAqua && NX.decorAqua.residents) for (const r of NX.decorAqua.residents(aq, t)) { const d = Math.hypot(r.x - x, r.y - y) - r.r * .5; if (d < bd) { bd = d; best = { e: find(aq, r.kind), info: { aq, x: r.x, y: r.y, r: r.r } }; } }
        if (best && best.e && bd < 9) return show(best.e, best.info);
        // (14.11, власник: «не всі рослини тапаються») тап по склу акваріума, де немає мешканця поруч, а перед склом висить рослина
        // (дельфіни й монстера Адансона над рифом, дикий виноград між акваріумами): раніше — нічого; тепер — картка цієї рослини
        let L = null; for (const q of (NX.decorLive ? NX.decorLive.LP : [])) if (q.e && q.e.sp && x >= q.x0 + 2 && x <= q.x1 - 2 && y >= q.y0 - 1 && y <= q.y1 + 1 && (!L || (q.x1 - q.x0) * (q.y1 - q.y0) < (L.x1 - L.x0) * (L.y1 - L.y0))) L = q;
        if (L) { L.shake = t; return show(find('wall', L.e.sp.kind)); } this.tapStatic(x, y); }
    },
    /** Тап повз живе: чи влучив у нерухому рослину (соти, витки на цеглі, даваллія, платицеріум, монстера антресолі…). -> true */
    tapStatic(x, y) {
      let best = null; for (const S of statics()) if (x >= S.x0 - 1 && x <= S.x1 + 1 && y >= S.y0 - 1 && y <= S.y1 + 1 && (!best || S.a < best.a)) best = S;
      if (!best) { let hx = null; for (const H of HEXC) if (x >= H.x0 && x <= H.x1 && y >= H.y0 && y <= H.y1 && (!hx || H.a < hx.a)) hx = H;   // (· 27) тап по порожньому місцю соти — вміст соти
        if (hx) best = statics().find(S => S.on === hx.id) || null; }
      if (!best) return false; show(find(best.grp, best.kind), best.grp === 'art' ? { box: best, neon: best.neon } : null); return true;
    },
  };
})();
