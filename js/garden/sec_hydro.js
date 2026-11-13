/* ============================================================================
 * garden/sec_hydro.js — СЕКТОР «ГІДРОПОНІКА»: ЖОЛОБИ З ТОНКИМ ШАРОМ РОЗЧИНУ (салат, шпинат, базилік, кріп)
 * ----------------------------------------------------------------------------
 * Технологія — як у житті (NFT, «техніка поживної плівки»): рослини сидять у сітчастих горщиках в отворах жолобів, ґрунту
 * немає, по дну жолоба тече тонкий шар поживного розчину. Жолоби мають ухил, тож розчин сам стікає: насос подає його з
 * бака вгору до верхнього жолоба, далі він зигзагом переливається з ярусу на ярус і повертається в бак. Над кожним ярусом —
 * фітолампа. Дозатор підмішує добрива (дві пляшки) і стежить за розчином — три смужки на його екрані.
 *
 * Чотири яруси — чотири культури, у кожної 7 місць. Рослини ростуть самі (швидкість — від днів до врожаю з каталогу),
 * посіяні в різний час, тож на ярусі завжди є і сіянці, і достиглі. Достигле чекає: його збирає Nexi (сценарій gHydro —
 * сам у вільний час або на тап по сектору) — підлітає на ранці з кошиком, зрізає, і в горщику одразу новий сіянець.
 * Немає достиглого — оглядає ярус сканером. Тап по рослині — картка культури (та сама картка, що й у кімнаті).
 *
 * Малювання: стелаж, жолоби, труби, бак і дозатор — раз у растр (1 піксель = 0.5 од.); щокадру — рослини (готові растри
 * garden/plants.js за стадією), течія в жолобах і трубах, краплі, бульбашки в баку, світло фітоламп, смужки дозатора,
 * іскорка на достиглому.
 * ========================================================================== */
(() => {
  const P = NX.px, CAT = NX.gardenCat, PL = NX.gardenPlants, G = NX.garden, H = NX.gardenHall, S = CAT.sector('hydro');
  const OX = S.x0 + H.IN.x, OY = H.IN.y, BW = H.IN.w, BH = H.IN.h;   // внутрішність секції: кут (кімната) і розмір 268 × 346
  const TV = [80, 142, 204, 266], CROPS = ['lettuce', 'spinach', 'basil', 'dill'], NS = 7, CX0 = 22, SEG = 32;
  const slotX = i => CX0 + SEG / 2 + i * SEG, seg = x => Math.max(0, Math.min(NS - 1, Math.floor((x - CX0) / SEG)));
  const drop = (k, x) => (k % 2 ? NS - 1 - seg(x) : seg(x)) * .5, chY = (k, x) => TV[k] + drop(k, x);       // верх жолоба яруса k у точці x (локально)
  let RACK = null;

  function build() {
    const cv = document.createElement('canvas'); cv.width = BW * 2; cv.height = BH * 2; const c = cv.getContext('2d'); c.scale(2, 2);
    const R = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); }, B = NX.art.BAYER;
    // стійки й поперечки стелажа
    for (const x of [14, 250]) { R(x, 20, 4, 280, '#3a4070'); R(x, 20, 1, 280, '#9aa3c8'); R(x + 3, 20, 1, 280, '#141a44'); R(x - 2, 298, 8, 4, '#1c2250'); R(x - 2, 298, 8, 1, '#5a6590'); }
    R(14, 20, 240, 3, '#3a4070'); R(14, 20, 240, 1, '#9aa3c8');
    // труба подачі: від насоса вгору вздовж лівої стійки до високого кінця верхнього жолоба
    R(8, 74, 3, 250, '#145a70'); R(8, 74, 1, 250, '#3bc8e0'); R(8, 74, 18, 3, '#145a70'); R(8, 74, 18, 1, '#3bc8e0'); R(23, 77, 3, 4, '#145a70');
    TV.forEach((tv, k) => {
      // фітолампа яруса
      R(24, tv - 52, 220, 5, '#2a1846'); R(24, tv - 52, 220, 1, '#7a5ab0'); R(24, tv - 48, 220, 1, '#12082a');
      for (let x = 27; x < 242; x += 6) { R(x, tv - 50.5, 4.5, 2.5, ['#ff9ae8', '#b8a6ff', '#fff3c2'][(x / 6 | 0) % 3]); R(x, tv - 50.5, 4.5, .5, '#ffffff'); }
      R(18, tv - 51, 6, 2, '#3a4070'); R(244, tv - 51, 6, 2, '#3a4070');
      // жолоб: сім сходинок ухилу, світла кришка, отвори під горщики, заглушки
      for (let s = 0; s < NS; s++) { const x = CX0 + s * SEG, y = tv + (k % 2 ? NS - 1 - s : s) * .5;
        R(x, y, SEG, 9, '#aab4e0'); R(x, y, SEG, 1.5, '#eef2ff'); R(x, y + 1.5, SEG, 1, '#cfd6f4'); R(x, y + 6.5, SEG, 2.5, '#6a76b0'); R(x, y + 9, SEG, .5, '#12082a');
        R(x + SEG / 2 - 5, y, 10, 1.5, '#3a4070'); }
      R(CX0 - 2, tv + (k % 2 ? 3 : 0) - .5, 2.5, 10.5, '#7a84c0'); R(CX0 + NS * SEG - .5, tv + (k % 2 ? 0 : 3) - .5, 2.5, 10.5, '#7a84c0');
      R(14, tv + 12.5, 240, 2.5, '#2a3060'); R(14, tv + 12.5, 240, 1, '#5a6590');                              // полиця під жолобом
      // перелив на наступний ярус (або в бак): труба з низького кінця вниз
      const lowR = k % 2 === 0, px = lowR ? 247 : 18.5, y0 = tv + 7, y1 = k < 3 ? TV[k + 1] + 2 : 290;
      R(px, y0, 3, y1 - y0, '#8892c4'); R(px, y0, 1, y1 - y0, '#dfe5ff');
      if (k < 3) R(lowR ? 243 : 18.5, y1 - 1.5, 7, 3, '#8892c4'); else { R(18.5, 288, 34, 3, '#8892c4'); R(18.5, 288, 34, 1, '#dfe5ff'); R(50, 288, 3, 8, '#8892c4'); }
    });
    // бак із розчином: рама, прозорі стінки, рівень, шкала
    R(38, 292, 126, 50, '#1c2250'); R(41, 295, 120, 44, '#0d2c48'); R(41, 306, 120, 33, '#167a86'); R(41, 306, 120, 1.5, '#6af0e0'); R(41, 307.5, 120, 1.5, '#2ab8b0');
    for (let y = 309; y < 339; y++) for (let x = 41; x < 161; x++) if (B[(y & 3) * 4 + (x & 3)] > .25 - (y - 309) / 70) R(x, y, 1, 1, '#125e72');
    R(38, 292, 126, 1.5, '#6a78c4'); R(38, 340.5, 126, 1.5, '#0a0c2a'); R(44, 297, 1.5, 40, '#3a8aa0'); for (let y = 300; y < 336; y += 6) R(156, y, 4, 1, '#6af0e0');
    R(14, 318, 22, 22, '#2a3060'); R(14, 318, 22, 1.5, '#7a84c0'); R(19, 324, 10, 10, '#145a70'); R(21, 326, 6, 6, '#3be8ff'); R(8, 322, 8, 3, '#145a70'); R(34, 328, 6, 3, '#145a70');   // насос
    // дозатор: шафка, екран (смужки — щокадру), дві пляшки добрив
    R(176, 284, 70, 58, '#1c2250'); R(176, 284, 70, 1.5, '#6a78c4'); R(176, 340.5, 70, 1.5, '#0a0c2a'); R(181, 289, 60, 24, '#050818'); R(181, 289, 60, 1, '#2a3a8a'); R(181, 312, 60, 1, '#2a3a8a');
    R(184, 320, 18, 20, '#7a2a6a'); R(184, 327, 18, 13, '#ff7af0'); R(189, 316, 8, 4, '#dfe5ff'); R(186, 322, 2, 16, '#ffc4f6');
    R(214, 320, 18, 20, '#6a5a1a'); R(214, 330, 18, 10, '#ffe27a'); R(219, 316, 8, 4, '#dfe5ff'); R(216, 322, 2, 16, '#fff3c2');
    R(164, 326, 12, 3, '#8892c4'); R(164, 326, 12, 1, '#dfe5ff');
    for (let x = 8; x < 260; x += 2) R(x, 343, 2, 3, x % 4 ? '#04061a' : '#070a24');                              // тінь під стелажем
    return cv;
  }

  // ---------- рослини: стадія росту s (0..1; 1 — достигло), варіант v ----------
  const slots = TV.map((_, k) => Array.from({ length: NS }, (_, i) => ({ s: Math.min(1, P.hash(k * 17 + i * 5 + 1) * 1.2), v: (P.hash(k * 3 + i * 11) * 3) | 0, pop: 0 })));
  const rate = k => 1 / (CAT.crop(CROPS[k]).days * 2.2);                                                        // салат (45 днів) достигає за ~100 с
  const ripe = k => slots[k].filter(q => q.s >= 1).length;
  const stageOf = q => Math.min(PL.STAGES - 1, Math.floor(Math.min(1, q.s) * (PL.STAGES - 1) + .001));
  const roomPt = (k, i) => [OX + slotX(i), OY + chY(k, slotX(i))];

  const sec = G.addSector({
    id: 'hydro', act: 'gHydro', S, hit: { x: OX, y: OY, w: BW, h: BH },
    *buildG() { RACK = build(); yield; for (const id of CROPS) { PL.warm(id); yield; } },
    update(dt) { slots.forEach((row, k) => row.forEach(q => { if (q.s < 1) q.s = Math.min(1, q.s + dt * rate(k) * (.8 + q.v * .15)); if (q.pop > 0) q.pop = Math.max(0, q.pop - dt * 2.5); })); },
    draw(c, t) {
      if (!RACK) return; c.imageSmoothingEnabled = false; c.drawImage(RACK, OX, OY, BW, BH);
      TV.forEach((tv, k) => {
        P.glow(c, OX + BW / 2, OY + tv - 34, 120, 'rgba(255,110,220,.6)', .12 + .015 * Math.sin(t * 3 + k));       // світло фітолампи
        slots[k].forEach((q, i) => {                                                                              // рослини
          const [x, y] = roomPt(k, i), st = stageOf(q), sp = PL.sprite(CROPS[k], st, q.v);
          c.drawImage(sp, x - PL.BASE[0] / 2 + (st > 2 ? Math.round(Math.sin(t * 1.4 + i * 1.7 + k)) * .5 : 0), y - (PL.BASE[1] + 1) / 2 - q.pop * 3, PL.SW / 2, PL.SH / 2);
          if (q.s >= 1 && Math.sin(t * 3 + i * 2.1 + k * 1.3) > .8) { P.rect(c, x + 7, y - 22, 1, 3, '#ffffff'); P.rect(c, x + 6, y - 21, 3, 1, '#ffffff'); }   // достигло — іскорка
        });
        const dir = k % 2 ? -1 : 1;                                                                               // течія розчину по дну жолоба
        for (let j = 0; j < 9; j++) { const u = (t * 22 + j * 25) % (NS * SEG - 4), x = dir > 0 ? CX0 + u : CX0 + NS * SEG - 4 - u; P.rect(c, OX + x, OY + chY(k, x + 2) + 5, 4, 1, '#8af0ff'); }
        const px = (k % 2 === 0 ? 247 : 18.5) + 1, y0 = tv + 8, y1 = k < 3 ? TV[k + 1] : 287, d = (t * 46 + k * 9) % (y1 - y0);   // краплі в переливі
        P.rect(c, OX + px, OY + y0 + d, 1, 3, '#bff6ff');
      });
      for (let j = 0; j < 7; j++) { const d = (t * 50 + j * 36) % 250; P.rect(c, OX + 9, OY + 324 - d, 1, 4, '#8af0ff'); }   // розчин іде трубою вгору
      for (let j = 0; j < 9; j++) { const u = (t * (9 + j) + j * 4.1) % 30; P.rect(c, OX + 50 + j * 12 + Math.sin(t * 2 + j) * 1.5, OY + 337 - u, 1.5, 1.5, j % 2 ? '#bff6ff' : '#6af0e0'); }   // бульбашки в баку
      [['#ff7af0', 1.1], ['#3be8ff', 1.7], ['#3bff8a', .8], ['#ffe27a', 1.3]].forEach(([col, f], j) => { const h = 6 + Math.round((Math.sin(t * f + j * 2) * .5 + .5) * 12); P.rect(c, OX + 186 + j * 11, OY + 310 - h, 7, h, col); });   // смужки дозатора
      P.rect(c, OX + 233, OY + 292, 4, 4, Math.sin(t * 4) > 0 ? '#3bff8a' : '#17482e');
    },
    /** Тап по сектору: по рослині — її картка; деінде — нічого (далі garden.js пошле Nexi доглядати). */
    tap(x, y) {
      for (let k = 0; k < 4; k++) for (let i = 0; i < NS; i++) { const [px, py] = roomPt(k, i), q = slots[k][i], h = 10 + stageOf(q) * 7;
        if (Math.abs(x - px) < 15 && y < py + 8 && y > py - h - 4) { G.card(CROPS[k], q.s, PL.sprite(CROPS[k], stageOf(q), q.v)); return true; } }
      return false;
    },
    /** Сценарій Nexi (NX.acts.gHydro): підлітає до ярусів; є достигле — збирає з двох найповніших ярусів, немає — оглядає сканером. */
    route(n) {
      const f = [OX + BW / 2, CAT.GY + 16], L = [{ walk: f }, { face: 1 }, { say: NX.pick('act.gHydro.lines') }, { work: { pose: 'crouch', dur: .25 } }, { do: () => { n.wallFloor = f; } }, { loc: 'wallHover' }];
      const hov = (k, x) => [OX + x, OY + TV[k] + 28];
      const tiers = [0, 1, 2, 3].filter(k => ripe(k) > 0).sort((a, b) => ripe(b) - ripe(a)).slice(0, 2).sort((a, b) => a - b);
      let got = 0, crop = null, shown = false;
      if (tiers.length) {
        n.basket = 0;
        tiers.forEach(k => {
          const i0 = slots[k].findIndex(q => q.s >= 1), i1 = NS - 1 - [...slots[k]].reverse().findIndex(q => q.s >= 1), xa = slotX(i0) - 18, xb = slotX(i1) - 6;
          L.push({ fly: hov(k, xa), dy: f[1] }, { face: 1 }, { work: { pose: 'hoverBasket', dur: 1.4 + (i1 - i0) * .5, tick: (dt, q) => {
            n.x = OX + xa + q * (xb - xa);                                                                        // пливе вздовж яруса й зрізає достигле, щойно порівняється
            slots[k].forEach((sl, i) => { if (sl.s >= 1 && OX + slotX(i) < n.x + 16) { sl.s = 0; sl.v = (sl.v + 1) % 3; sl.pop = 1; got++; crop = CROPS[k]; n.basket = 1; const [px, py] = roomPt(k, i); for (let j = 0; j < 7; j++) NX.fx.emit('spark', px, py - 10, { col: j % 2 ? '#b4f48e' : '#ffffff', ttl: .55 }); } });
          } } });
        });
      } else {
        const k = Math.random() * 4 | 0; crop = CROPS[k];
        L.push({ fly: hov(k, 110), dy: f[1] }, { face: 1 }, { work: { pose: 'hoverScan', dur: 2.2, tick: (dt, q) => { if (q > .5 && !shown) { shown = true; const sl = slots[k][4]; G.card(crop, sl.s, PL.sprite(crop, stageOf(sl), sl.v)); } } } });
      }
      L.push({ work: { pose: 'hoverLook', dur: .8 } }, { fly: f }, { loc: 'floor' }, { face: 1 },
        { do: () => { n.emote(got ? 'love' : 'happy', 2.4); n.say(String(NX.pick(got ? 'act.gHydro.harvest' : 'act.gHydro.check')).replace('{crop}', NX.t('garden.crop.' + crop)).replace('{n}', got)); } },
        { work: { pose: 'cheer', dur: 1.2 } }, { do: () => { n.basket = 0; } });
      return L;
    },
  });
  S.ready = true;
})();
