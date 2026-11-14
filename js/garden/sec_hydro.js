/* ============================================================================
 * garden/sec_hydro.js — ДІЛЯНКА «ГІДРОПОНІКА»: ЖОЛОБИ З ТОНКИМ ШАРОМ РОЗЧИНУ (салат, шпинат, базилік, кріп)
 * ----------------------------------------------------------------------------
 * Технологія — як у житті (NFT, «техніка поживної плівки»): рослини сидять у сітчастих горщиках в отворах жолобів, ґрунту
 * немає, по дну жолоба тече тонкий шар поживного розчину. Жолоби мають ухил, тож розчин сам стікає: насос подає його з
 * бака вгору до верхнього жолоба, далі він зигзагом переливається з ярусу на ярус і повертається в бак. Дозатор над баком
 * підмішує добрива (дві пляшки) і стежить за розчином — смужки на його екрані.
 *
 * Стелаж стоїть просто неба (14.11: сад — під відкритим небом на тлі парку): чотири яруси — чотири культури, у кожної 5
 * місць. Рослини ростуть самі (швидкість — від днів до врожаю з каталогу), посіяні в різний час, тож на ярусі завжди є і
 * сіянці, і достиглі. Достигле чекає: його збирає Nexi (сценарій gHydro — сам у вільний час або на тап по ділянці) —
 * підлітає на ранці з кошиком, зрізає, і в горщику одразу новий сіянець. Немає достиглого — оглядає ярус сканером.
 * Тап по рослині — картка культури (та сама картка, що й у кімнаті).
 *
 * Малювання: стелаж, жолоби, труби, бак і дозатор — раз у растр (1 піксель = 0.5 од.); щокадру — рослини (готові растри
 * garden/plants.js за стадією), течія в жолобах і трубах, краплі, бульбашки в баку, смужки дозатора, іскорка на достиглому.
 * ========================================================================== */
(() => {
  const P = NX.px, CAT = NX.gardenCat, PL = NX.gardenPlants, G = NX.garden, S = CAT.sector('hydro');
  const BW = 268, BH = 232, OX = S.x0 + 6, OY = CAT.GY - BH;         // місце ділянки: кут (кімната) і розмір
  const TV = [42, 92, 142, 192], CROPS = ['lettuce', 'spinach', 'basil', 'dill'], NS = 5, CX0 = 20, SEG = 32, CX1 = CX0 + NS * SEG;
  const slotX = i => CX0 + SEG / 2 + i * SEG, seg = x => Math.max(0, Math.min(NS - 1, Math.floor((x - CX0) / SEG)));
  const drop = (k, x) => (k % 2 ? seg(x) : NS - 1 - seg(x)) * .5, chY = (k, x) => TV[k] + drop(k, x);       // верх жолоба яруса k у точці x: парні яруси течуть ліворуч, непарні — праворуч (до бака)
  let RACK = null;
  CROPS.forEach(id => { CAT.crop(id).on = true; });

  function build() {
    const cv = document.createElement('canvas'); cv.width = BW * 2; cv.height = BH * 2; const c = cv.getContext('2d'); c.scale(2, 2);
    const R = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); }, B = NX.art.BAYER;
    for (const x of [11, 181]) { R(x, 6, 4, 220, '#4a5080'); R(x, 6, 1, 220, '#c8d0ec'); R(x + 3, 6, 1, 220, '#1c2250'); R(x - 2, 224, 8, 5, '#2a3060'); R(x - 2, 224, 8, 1, '#8a94c8'); }   // стійки
    R(11, 6, 174, 3, '#4a5080'); R(11, 6, 174, 1, '#c8d0ec');
    // труба подачі: від бака вгору вздовж правої стійки до високого кінця верхнього жолоба
    R(188, 36, 3, 118, '#1a7a90'); R(188, 36, 1, 118, '#6ae0f0'); R(178, 36, 13, 3, '#1a7a90'); R(178, 36, 13, 1, '#6ae0f0'); R(178, 39, 3, 3, '#1a7a90');
    TV.forEach((tv, k) => {
      for (let s = 0; s < NS; s++) { const x = CX0 + s * SEG, y = tv + (k % 2 ? s : NS - 1 - s) * .5;                // жолоб: сходинки ухилу, світла кришка, отвори під горщики
        R(x, y, SEG, 9, '#c4cdf0'); R(x, y, SEG, 1.5, '#ffffff'); R(x, y + 1.5, SEG, 1, '#e2e8fb'); R(x, y + 6.5, SEG, 2.5, '#7a86c0'); R(x, y + 9, SEG, .5, '#12082a');
        R(x + SEG / 2 - 5, y, 10, 1.5, '#3a4070'); }
      R(CX0 - 2, tv + (k % 2 ? 0 : 2) - .5, 2.5, 10.5, '#8a94c8'); R(CX1 - .5, tv + (k % 2 ? 2 : 0) - .5, 2.5, 10.5, '#8a94c8');
      R(11, tv + 12.5, 174, 2.5, '#3a4070'); R(11, tv + 12.5, 174, 1, '#8a94c8');                                 // полиця під жолобом
      const lowR = k % 2 === 1, px = lowR ? 183.5 : 15.5, y0 = tv + 7, y1 = k < 3 ? TV[k + 1] + 2 : 214;           // перелив униз
      R(px, y0, 3, y1 - y0, '#9aa4d4'); R(px, y0, 1, y1 - y0, '#f0f3ff');
      if (k < 3) R(lowR ? 180 : 15.5, y1 - 1.5, 7, 3, '#9aa4d4'); else { R(183.5, 212, 16, 3, '#9aa4d4'); R(183.5, 212, 16, 1, '#f0f3ff'); }
    });
    // бак із розчином: рама, прозорі стінки, рівень, шкала
    R(196, 150, 68, 80, '#2a3060'); R(199, 153, 62, 74, '#12406a'); R(199, 170, 62, 57, '#1c93a0'); R(199, 170, 62, 1.5, '#8afff0'); R(199, 171.5, 62, 1.5, '#3ad0c6');
    for (let y = 173; y < 227; y++) for (let x = 199; x < 261; x++) if (B[(y & 3) * 4 + (x & 3)] > .3 - (y - 173) / 110) R(x, y, 1, 1, '#177688');
    R(196, 150, 68, 1.5, '#8a94c8'); R(196, 228.5, 68, 1.5, '#12082a'); R(202, 155, 1.5, 70, '#4ab0c8'); for (let y = 160; y < 224; y += 8) R(255, y, 5, 1, '#8afff0');
    // дозатор над баком: екран (смужки — щокадру), дві пляшки добрив, трубки вниз
    R(200, 92, 60, 52, '#2a3060'); R(200, 92, 60, 1.5, '#8a94c8'); R(200, 142.5, 60, 1.5, '#12082a'); R(204, 96, 52, 20, '#050818'); R(204, 96, 52, 1, '#3a4aa0');
    R(207, 124, 14, 18, '#8a3078'); R(207, 131, 14, 11, '#ff7af0'); R(211, 120, 6, 4, '#f0f3ff'); R(209, 126, 2, 14, '#ffc4f6');
    R(238, 124, 14, 18, '#7a6a1a'); R(238, 133, 14, 9, '#ffe27a'); R(242, 120, 6, 4, '#f0f3ff'); R(240, 126, 2, 14, '#fff3c2');
    R(213, 144, 1.5, 7, '#ff7af0'); R(244, 144, 1.5, 7, '#ffe27a'); R(228, 144, 4, 6, '#4a5080');
    return cv;
  }

  // ---------- рослини: стадія росту s (0..1; 1 — достигло), варіант v ----------
  const slots = TV.map((_, k) => Array.from({ length: NS }, (_, i) => ({ s: Math.min(1, P.hash(k * 17 + i * 5 + 1) * 1.2), v: (P.hash(k * 3 + i * 11) * 3) | 0, pop: 0 })));
  const rate = k => 1 / (CAT.crop(CROPS[k]).days * 2.2);                                                        // салат (45 днів) достигає за ~100 с
  const ripe = k => slots[k].filter(q => q.s >= 1).length;
  const stageOf = q => Math.min(PL.STAGES - 1, Math.floor(Math.min(1, q.s) * (PL.STAGES - 1) + .001));
  const roomPt = (k, i) => [OX + slotX(i), OY + chY(k, slotX(i))];

  G.addSector({
    id: 'hydro', act: 'gHydro', S, hit: { x: OX, y: OY, w: BW, h: BH },
    *buildG() { RACK = build(); yield; for (const id of CROPS) { PL.warm(id); yield; } },
    update(dt) { slots.forEach((row, k) => row.forEach(q => { if (q.s < 1) q.s = Math.min(1, q.s + dt * rate(k) * (.8 + q.v * .15)); if (q.pop > 0) q.pop = Math.max(0, q.pop - dt * 2.5); })); },
    draw(c, t) {
      if (!RACK) return; c.imageSmoothingEnabled = false; c.drawImage(RACK, OX, OY, BW, BH);
      TV.forEach((tv, k) => {
        slots[k].forEach((q, i) => {                                                                              // рослини
          const [x, y] = roomPt(k, i), st = stageOf(q), sp = PL.sprite(CROPS[k], st, q.v);
          c.drawImage(sp, x - PL.BASE[0] / 2 + (st > 2 ? Math.round(Math.sin(t * 1.4 + i * 1.7 + k)) * .5 : 0), y - (PL.BASE[1] + 1) / 2 - q.pop * 3, PL.SW / 2, PL.SH / 2);
          if (q.s >= 1 && Math.sin(t * 3 + i * 2.1 + k * 1.3) > .8) { P.rect(c, x + 7, y - 22, 1, 3, '#ffffff'); P.rect(c, x + 6, y - 21, 3, 1, '#ffffff'); }   // достигло — іскорка
        });
        const dir = k % 2 ? 1 : -1;                                                                               // течія розчину по дну жолоба
        for (let j = 0; j < 7; j++) { const u = (t * 22 + j * 23) % (NS * SEG - 4), x = dir > 0 ? CX0 + u : CX1 - 4 - u; P.rect(c, OX + x, OY + chY(k, x + 2) + 5, 4, 1, '#bffbff'); }
        const px = (k % 2 ? 183.5 : 15.5) + 1, y0 = tv + 8, y1 = k < 3 ? TV[k + 1] : 212, d = (t * 46 + k * 9) % (y1 - y0);   // краплі в переливі
        P.rect(c, OX + px, OY + y0 + d, 1, 3, '#e6fdff');
      });
      for (let j = 0; j < 4; j++) { const d = (t * 50 + j * 30) % 116; P.rect(c, OX + 189, OY + 152 - d, 1, 4, '#bffbff'); }   // розчин іде трубою вгору
      for (let j = 0; j < 7; j++) { const u = (t * (9 + j) + j * 4.1) % 50; P.rect(c, OX + 204 + j * 8 + Math.sin(t * 2 + j) * 1.5, OY + 225 - u, 1.5, 1.5, j % 2 ? '#e6fdff' : '#8afff0'); }   // бульбашки в баку
      [['#ff7af0', 1.1], ['#3be8ff', 1.7], ['#3bff8a', .8], ['#ffe27a', 1.3]].forEach(([col, f], j) => { const h = 4 + Math.round((Math.sin(t * f + j * 2) * .5 + .5) * 11); P.rect(c, OX + 208 + j * 10, OY + 114 - h, 6, h, col); });   // смужки дозатора
      P.rect(c, OX + 250, OY + 98, 4, 4, Math.sin(t * 4) > 0 ? '#3bff8a' : '#17482e');
    },
    /** Тап по ділянці: по рослині — її картка; деінде — нічого (далі garden.js пошле Nexi доглядати). */
    tap(x, y) {
      for (let k = 0; k < 4; k++) for (let i = 0; i < NS; i++) { const [px, py] = roomPt(k, i), q = slots[k][i], h = 10 + stageOf(q) * 7;
        if (Math.abs(x - px) < 15 && y < py + 8 && y > py - h - 4) { G.card(CROPS[k], q.s >= 1 ? 2 : q.s < .2 ? 0 : 1, PL.sprite(CROPS[k], stageOf(q), q.v)); return true; } }
      return false;
    },
    /** Сценарій Nexi (NX.acts.gHydro): підлітає до ярусів; є достигле — збирає з двох найповніших ярусів, немає — оглядає сканером. */
    route(n) {
      const f = [OX + 100, CAT.GY + 18], L = [{ walk: f }, { face: 1 }, { say: NX.pick('act.gHydro.lines') }, { work: { pose: 'crouch', dur: .25 } }, { do: () => { n.wallFloor = f; } }, { loc: 'wallHover' }];
      const hov = (k, x) => [OX + x, OY + TV[k] + 28];
      const tiers = [0, 1, 2, 3].filter(k => ripe(k) > 0).sort((a, b) => ripe(b) - ripe(a)).slice(0, 2).sort((a, b) => a - b);
      let got = 0, crop = null, shown = false;
      if (tiers.length) {
        n.basket = 0;
        tiers.forEach(k => {
          const i0 = slots[k].findIndex(q => q.s >= 1), i1 = NS - 1 - [...slots[k]].reverse().findIndex(q => q.s >= 1), xa = slotX(i0) - 18, xb = slotX(i1) - 6;
          L.push({ fly: hov(k, xa), dy: f[1] }, { face: 1 }, { work: { pose: 'hoverBasket', dur: 1.4 + (i1 - i0) * .5, tick: (dt, q) => {
            n.x = OX + xa + q * (xb - xa);                                                                        // пливе вздовж яруса й зрізає достигле, щойно порівняється
            slots[k].forEach((sl, i) => { if (sl.s >= 1 && OX + slotX(i) < n.x + 16) { sl.s = 0; sl.v = (sl.v + 1) % 3; sl.pop = 1; got++; crop = CROPS[k]; n.basket = 1; G.harvest(CROPS[k], 1); const [px, py] = roomPt(k, i); for (let j = 0; j < 7; j++) NX.fx.emit('spark', px, py - 10, { col: j % 2 ? '#b4f48e' : '#ffffff', ttl: .55 }); } });
          } } });
        });
      } else {
        const k = Math.random() * 4 | 0; crop = CROPS[k];
        L.push({ fly: hov(k, 84), dy: f[1] }, { face: 1 }, { work: { pose: 'hoverScan', dur: 2.2, tick: (dt, q) => { if (q > .5 && !shown) { shown = true; const sl = slots[k][2]; G.card(crop, sl.s >= 1 ? 2 : sl.s < .2 ? 0 : 1, PL.sprite(crop, stageOf(sl), sl.v)); } } } });
      }
      L.push({ work: { pose: 'hoverLook', dur: .8 } }, { fly: f }, { loc: 'floor' }, { face: 1 },
        { do: () => { n.emote(got ? 'love' : 'happy', 2.4); n.say(String(NX.pick(got ? 'act.gHydro.harvest' : 'act.gHydro.check')).replace('{crop}', NX.t('garden.crop.' + crop)).replace('{n}', got)); } },
        { work: { pose: 'cheer', dur: 1.2 } }, { do: () => { n.basket = 0; } });
      return L;
    },
  });
  S.ready = true;
})();
