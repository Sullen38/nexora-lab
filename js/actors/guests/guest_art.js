/* ============================================================================
 * actors/guests/guest_art.js — ГОСТІ З ПОРТАЛУ: ПІКСЕЛЬНІ СПРАЙТИ (крок 14)
 * ----------------------------------------------------------------------------
 * Власник: «з портала з'являються рандомні відомі персонажі — піксельні, такі, щоб усі знали». Двадцять героїв казок,
 * легенд і старих книжок (суспільне надбання), намальованих кодом по-своєму — за самими казками, а не за мультфільмами
 * студій (Білосніжка без діснеївського вбрання, Чеширський кіт — сірий, Кіт у чоботях — не рудий тощо).
 * NX.guestArt.draw(id, pose, fr, t, cv, g) — малює героя в полотно cv (W×H, ноги — на нижньому рядку, лицем праворуч;
 * ліворуч — дзеркалить guests.js) і обводить темним контуром, як Рудика. g — стан гостя (напр. g.nose — довжина носа).
 * Пози: stand / walk / run, далі — свої (sweep, search, cheer, give, watch, roll, lie, bow, charge, fall, inspect, aim,
 * ride, fly, cast, float, rust, dig, sneeze, twirl). Розмір і де ноги — size(id): [W, H, масштаб].
 * Поруч — дрібні речі на підлозі (prop): скриня, подарунок, черевичок, перо, лампа (drawProp).
 * ========================================================================== */
NX.guestArt = (() => {
  let x = null;
  const P = (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(Math.round(a), Math.round(b), Math.round(w), Math.round(h)); };
  /** Товста лінія з квадратиків (руки, держаки). */
  const L = (x0, y0, x1, y1, col, w = 2) => { const n = Math.max(1, Math.round(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)))); for (let i = 0; i <= n; i++) P(x0 + (x1 - x0) * i / n - w / 2 + .5, y0 + (y1 - y0) * i / n - w / 2 + .5, w, w, col); };
  const eye = (ex, ey, col = '#1a1030') => { P(ex, ey, 2, 2, col); P(ex + 1, ey, 1, 1, '#ffffff'); };
  const SK = '#f6d2b8', SKD = '#d9a88a';
  /** Голова 12×11 (лівий верх — hx, hy): кругла, очі праворуч (дивиться вперед-праворуч), щічки; mouth: 0 / 'smile' / 'o'. */
  function head(hx, hy, s = SK, sd = SKD, o = {}) {
    P(hx + 2, hy, 8, 11, s); P(hx + 1, hy + 1, 10, 9, s); P(hx, hy + 2, 12, 7, s); P(hx + 2, hy + 10, 8, 1, sd); P(hx + 1, hy + 9, 1, 1, sd);
    if (!o.noEyes) { if (o.shut) { P(hx + 4, hy + 6, 2, 1, '#1a1030'); P(hx + 8, hy + 6, 2, 1, '#1a1030'); } else { eye(hx + 4, hy + 5, o.eye); eye(hx + 8, hy + 5, o.eye); } }
    if (!o.noCheek) { P(hx + 2, hy + 7, 2, 1, '#ff9fb2'); P(hx + 10, hy + 7, 1, 1, '#ff9fb2'); }
    if (o.mouth === 'o') P(hx + 7, hy + 8, 2, 2, '#7a1a2a'); else if (o.mouth !== 0) { P(hx + 6, hy + 8, 3, 1, o.lip || '#a8505a'); }
  }
  /** Ноги й черевики: walk / run — крок (fr), peg — дерев'яна нога (передня). */
  function legs(pose, fr, col, shoe, o = {}) {
    const w = pose === 'walk' || pose === 'run', f = w ? fr % 4 : -1, dl = f === 0 ? -1 : f === 2 ? 1 : 0, ul = f === 1 ? 1 : 0, ur = f === 3 ? 1 : 0, top = o.top || 32;
    P(15 + dl, top, 2, 10 - ul, col); P(15 + dl, 42 - ul, 3, 2, shoe);
    if (o.peg) { P(20 - dl, top, 2, 4, col); P(20.5 - dl, top + 4, 1, 8 - ur, '#9a6a34'); } else { P(19 - dl, top, 2, 10 - ur, col); P(19 - dl, 42 - ur, 3, 2, shoe); }
  }
  /** Тулуб (куртка / туніка): y 22..33. */
  function torso(c, c2, o = {}) { P(13, 22, 10, 12, c); P(13, 32, 10, 2, c2); if (o.belt) P(13, 29, 10, 1, o.belt); if (o.buttons) for (let y = 24; y < 30; y += 2) P(18, y, 1, 1, o.buttons); }
  /** Сукня (розширюється донизу): y 22..36. */
  function dress(c, c2, o = {}) { for (let y = 22; y < 37; y++) { const k = Math.max(0, y - 27) * (o.wide || .5); P(13 - k, y, 10 + 2 * k, 1, y > 34 ? c2 : c); } if (o.apron) for (let y = 27; y < 35; y++) P(15 - (y - 27) * .2, y, 6 + (y - 27) * .4, 1, o.apron); }
  /** Рука від плеча (sx, sy) до кисті (ex, ey); кисть — шкіра. */
  const arm = (sx, sy, ex, ey, col, skin = SK) => { L(sx, sy, ex, ey, col); P(ex - 1, ey - 1, 2, 2, skin); };
  const BACK = [14, 23], FRONT = [22, 23];                                                         // плечі: заднє / переднє
  /** Типові руки за позою: [задня кисть, передня кисть]. */
  function hands(pose, fr, t) {
    const sw = pose === 'walk' || pose === 'run' ? (fr % 4 < 2 ? 1 : -1) * (pose === 'run' ? 3 : 2) : 0, b = Math.round(Math.sin(t * 2));
    switch (pose) {
      case 'cheer': return [[11, 16 + b], [25, 15 - b]];
      case 'give': return [[12, 30], [28, 26]];
      case 'search': return [[12, 30], [24, 15]];
      case 'bow': return [[12, 31], [27, 31]];
      default: return [[13 - sw, 31], [23 + sw, 31]];
    }
  }
  const hat = {
    /** гострий ковпак (гном, Мерлін, Піноккіо): від маківки вгору, кінчик загнутий */
    cone(cx, top, h, w, c, c2, bend = 2) { for (let i = 0; i < h; i++) { const k = (i / h); P(cx - w / 2 * (1 - k) + bend * k * k, top + h - i, w * (1 - k) + 1, 1, i % 4 === 0 ? c2 : c); } },
  };

  // =============================== ГЕРОЇ ===============================
  const D = {};
  /** 1. БАБА ЯГА — згорблена, хустка в горошок, гачкуватий ніс, латана сукня, мітла (метé — sweep, летить — ride). */
  D.babaYaga = (pose, fr, t) => {
    const ride = pose === 'ride', sweep = pose === 'sweep', sw = sweep ? Math.sin(t * 9) : 0;
    if (!ride) { L(24, 26, 30 + sw * 3, 43, '#8a5a2a'); P(27 + sw * 3, 40, 7, 4, '#c8a050'); P(28 + sw * 3, 43, 5, 1, '#8a6a2a'); }   // мітла
    else { L(4, 38, 34, 34, '#8a5a2a'); P(0, 36, 7, 5, '#c8a050'); }
    if (ride) { P(15, 33, 8, 3, '#3a2a2a'); P(22, 34, 3, 2, '#2a1a1a'); } else legs(pose, fr, '#3a2a2a', '#1a1010');
    dress('#5a3a2a', '#3a2418', { apron: '#8a8a7a' }); P(14, 30, 3, 3, '#7a5a3a'); P(19, 25, 2, 2, '#6a4a4a');   // латки
    const hy = 11; head(13, hy, '#e2bf98', '#c09a74', { mouth: 'smile', lip: '#7a3a2a' }); P(25, hy + 5, 2, 2, '#d0a880'); P(26, hy + 7, 1, 1, '#d0a880');   // гачкуватий ніс
    P(13, hy - 1, 12, 4, '#8a1a2a'); P(12, hy + 2, 2, 7, '#8a1a2a'); P(23, hy + 2, 2, 3, '#8a1a2a'); [[15, hy], [19, hy + 1], [22, hy], [13, hy + 4]].forEach(([a, b]) => P(a, b, 1, 1, '#ffd0d8'));   // хустка в горошок
    P(14, hy + 2, 2, 5, '#c8c8c8'); P(11, hy + 6, 2, 3, '#8a1a2a');                                     // сиве пасмо, вузол хустки
    if (ride) arm(...FRONT, 27, 34, '#5a3a2a', '#e2bf98'); else arm(...FRONT, 24, 27, '#5a3a2a', '#e2bf98');
  };
  /** 2. БІЛОСНІЖКА — довге чорне волосся з золотим обручем, червона сукня з білим фартухом і комірцем, яблуко. */
  D.snowWhite = (pose, fr, t) => {
    const [bh, fh] = hands(pose, fr, t);
    P(12, 12, 13, 15, '#141018');                                                                        // волосся позаду
    arm(...BACK, ...bh, '#b0202e', '#fdeee6'); legs(pose, fr, '#fdeee6', '#7a1a2a');
    dress('#b0202e', '#801622', { apron: '#fff4f0' }); P(15, 22, 6, 2, '#ffffff');
    head(12, 10, '#fdeee6', '#e8c8bc', { mouth: 'smile', lip: '#e0203a' }); P(12, 9, 13, 4, '#141018'); P(12, 12, 2, 6, '#141018'); P(14, 9, 9, 1, '#e8c060');   // чубчик, обруч
    arm(...FRONT, ...fh, '#b0202e', '#fdeee6'); if (pose !== 'search' && pose !== 'cheer') { P(fh[0] - 1, fh[1], 4, 4, '#e0202e'); P(fh[0] + 1, fh[1] - 1, 1, 1, '#4a8a2a'); }   // яблуко
  };
  /** Гном Білосніжки — малий: велика біла борода, червоний ковпак, кирка. */
  D.dwarf = (pose, fr, t) => {
    const [bh, fh] = hands(pose, fr, t);
    arm(...BACK, ...bh, '#6a4a2a'); legs(pose, fr, '#4a3a2a', '#2a1a10', { top: 34 }); torso('#6a4a2a', '#4a3018', { belt: '#2a1a10' }); P(16, 29, 3, 2, '#e8c060');
    head(12, 12, SK, SKD, { mouth: 0 }); P(13, 19, 10, 8, '#f4f0e8'); P(15, 27, 6, 3, '#f4f0e8'); P(16, 17, 3, 1, '#c87070');   // борода, ніс
    hat.cone(18, 1, 12, 13, '#c8202e', '#a01624', 4);
    arm(...FRONT, ...fh, '#6a4a2a'); L(fh[0], fh[1], fh[0] + 1, fh[1] - 9, '#8a6a3a'); P(fh[0] - 2, fh[1] - 10, 6, 2, '#9aa0b0');   // кирка
  };
  /** 4. ЧЕРВОНА ШАПОЧКА — червона накидка з каптуром, біла сукня, кошик з пиріжками. */
  D.redHood = (pose, fr, t) => {
    const [bh, fh] = hands(pose, fr, t);
    legs(pose, fr, '#fdeee6', '#5a2a1a'); dress('#f4f0f8', '#c8c0d8', {}); P(12, 22, 12, 10, '#d0202e'); P(13, 31, 10, 2, '#a01624');   // сукня й накидка
    head(12, 10, SK, SKD, { mouth: 'smile' }); P(13, 9, 10, 3, '#7a4a2a'); P(11, 8, 14, 3, '#d0202e'); P(10, 10, 3, 12, '#d0202e'); P(23, 10, 2, 5, '#d0202e');   // каптур
    arm(...FRONT, ...fh, '#d0202e');
    const [kx, ky] = pose === 'give' ? fh : [fh[0] + 1, fh[1] - 1]; P(kx - 3, ky, 7, 5, '#a8743a'); P(kx - 3, ky, 7, 1, '#e8e0f0'); P(kx - 2, ky - 3, 1, 3, '#a8743a'); P(kx + 2, ky - 3, 1, 3, '#a8743a'); P(kx - 2, ky - 3, 5, 1, '#a8743a');   // кошик
    P(kx - 2, ky - 1, 2, 2, '#e8a050'); P(kx + 1, ky - 1, 2, 2, '#e8a050');                             // пиріжки
  };
  /** 5. БІЛИЙ КРОЛИК — довгі вуха, жилет із золотими ґудзиками, кишеньковий годинник. */
  D.whiteRabbit = (pose, fr, t) => {
    const W_ = '#f8f6fb', WD = '#d8d4e4', run = pose === 'run', [bh, fh] = pose === 'watch' ? [[13, 30], [22, 19]] : hands(pose, fr, t);
    arm(...BACK, ...bh, W_, W_); legs(pose, fr, W_, '#e8e4f0'); torso('#7a3aa0', '#5a2a80', { buttons: '#ffd27a' }); P(13, 22, 3, 12, '#c84a4a');   // жилет, сорочка
    head(12, 10, W_, WD, { eye: '#c8203a', mouth: 0, noCheek: 1 }); P(21, 17, 2, 1, '#ff9fb2');            // носик
    const e = run ? 2 : 0; P(14 - e, 0, 3, 11, W_); P(15 - e, 2, 1, 8, '#ffb4c8'); P(19 - e, 1, 3, 10, W_); P(20 - e, 3, 1, 7, '#ffb4c8');   // вуха
    arm(...FRONT, ...fh, W_, W_); P(fh[0] - 1, fh[1] - 3, 4, 4, '#ffd27a'); P(fh[0], fh[1] - 2, 2, 2, '#fff8e0'); L(fh[0] - 2, fh[1] - 2, 18, 27, '#ffd27a', 1);   // годинник на ланцюжку
  };
  /** 7. ПІНОККІО — дерев'яний хлопчик: гострий паперовий ковпак, зелена курточка, ніс росте (g.nose). */
  D.pinocchio = (pose, fr, t, g) => {
    const WD = '#e2ae6a', WDD = '#b8844a', [bh, fh] = hands(pose, fr, t), n = Math.round(3 + (g && g.nose || 0));
    arm(...BACK, ...bh, '#3a8a3a', WD); legs(pose, fr, '#8a5a2a', '#c8202e'); torso('#3a8a3a', '#2a6a2a', { buttons: '#ffd27a' }); P(15, 22, 6, 2, '#ffffff');
    head(12, 10, WD, WDD, { mouth: 'smile', noCheek: 1 }); P(14, 13, 1, 1, '#c87a3a'); P(17, 19, 1, 1, '#c87a3a');   // волокна дерева
    P(24, 15, n, 2, WD); P(24, 16, n, 1, WDD);                                                           // ніс
    hat.cone(17, 0, 11, 12, '#d02a3a', '#a01a2a', 2); arm(...FRONT, ...fh, '#3a8a3a', WD);
  };
  /** 8. КІТ У ЧОБОТЯХ — сірий кіт: капелюх із пером, синій плащ, великі чоботи, шпажка. */
  D.pussBoots = (pose, fr, t) => {
    const F = '#9a9aac', FD = '#6a6a80', bow = pose === 'bow', [bh, fh] = hands(pose, fr, t);
    arm(...BACK, ...bh, '#2a4a9a', F); P(9, 25, 4, 12, '#2a3a7a');                                      // плащ позаду
    legs(pose, fr, F, '#5a3a1a'); P(14, 37, 5, 5, '#6a4a2a'); P(18, 37, 5, 5, '#6a4a2a');                 // чоботи
    torso('#2a4a9a', '#1a3070', { belt: '#5a3a1a' }); L(11, 31, 6, 37, '#d8dce8', 1);                    // шпажка
    const hy = bow ? 13 : 10; head(12, hy, F, FD, { eye: '#3aa860', mouth: 0, noCheek: 1 }); P(17, hy + 7, 2, 1, '#ff9fb2'); P(16, hy + 9, 4, 1, '#f4f0f8');
    P(12, hy - 2, 3, 3, F); P(21, hy - 2, 3, 3, F); P(13, hy - 1, 1, 1, '#ffb4c8'); P(22, hy - 1, 1, 1, '#ffb4c8');   // вушка
    L(23, hy + 7, 27, hy + 6, '#ffffff', 1); L(23, hy + 8, 27, hy + 9, '#ffffff', 1);                     // вуса
    if (bow) { arm(...FRONT, 27, 31, '#2a4a9a', F); P(24, 29, 9, 3, '#6a1a4a'); P(26, 27, 5, 2, '#6a1a4a'); L(28, 27, 34, 22, '#ffffff', 1); }   // капелюх у руці
    else { P(10, hy - 1, 16, 2, '#6a1a4a'); P(13, hy - 4, 10, 3, '#6a1a4a'); L(14, hy - 4, 6, hy - 10, '#ffffff', 2); arm(...FRONT, ...fh, '#2a4a9a', F); }
  };
  /** 9. ДОН КІХОТ — худий лицар: тазик-шолом, панцир, сива борідка, спис (charge — навперейми, fall — лежить). */
  D.quixote = (pose, fr, t) => {
    if (pose === 'fall') { P(4, 38, 26, 5, '#9aa0b8'); P(26, 36, 7, 7, '#e8c8a8'); P(28, 34, 6, 3, '#e8c060'); L(2, 33, 30, 41, '#8a5a2a'); return; }
    const ch = pose === 'charge', [bh, fh] = ch ? [[13, 29], [27, 28]] : hands(pose, fr, t);
    arm(...BACK, ...bh, '#b8bccc', '#e8c8a8'); legs(pose, fr, '#6a4a2a', '#3a2a1a'); torso('#b8bccc', '#8a8ea4', { belt: '#7a2a2a' }); P(14, 23, 3, 6, '#dce0ee');   // панцир
    P(11, 23, 3, 13, '#9a2a3a');                                                                          // плащ
    head(12, 9, '#ecc8a8', '#c8a084', { mouth: 0 }); P(19, 18, 4, 4, '#d8d8d8'); P(20, 15, 4, 1, '#c8c8c8'); P(11, 6, 14, 3, '#e8c060'); P(14, 4, 8, 2, '#f4d070');   // борідка, вуса, тазик
    arm(...FRONT, ...fh, '#b8bccc', '#e8c8a8');
    if (ch) L(10, 30, 36, 25, '#8a5a2a'); else L(fh[0], fh[1] + 6, fh[0] + 2, 0, '#8a5a2a');              // спис
  };
  /** 10. ШЕРЛОК ХОЛМС — кепі мисливця з навушниками, картатий плащ, люлька, лупа (inspect — схилився). */
  D.sherlock = (pose, fr, t) => {
    const ins = pose === 'inspect', [bh, fh] = ins ? [[14, 30], [27, 33]] : hands(pose, fr, t), hy = ins ? 12 : 10;
    arm(...BACK, ...bh, '#7a6a52', SK); legs(pose, fr, '#3a3a44', '#1a1a20'); torso('#8a7a5e', '#6a5a44'); P(11, 22, 14, 6, '#9a8a6a');   // накидка
    for (let y = 23; y < 34; y += 3) P(13, y, 10, 1, '#6a5a44');                                           // клітинка
    head(12, hy, SK, SKD, { mouth: 0 }); P(23, hy + 8, 3, 1, '#5a3a1a'); P(25, hy + 8, 2, 3, '#5a3a1a');   // люлька
    P(11, hy - 1, 14, 4, '#8a7a5e'); P(9, hy + 1, 4, 2, '#8a7a5e'); P(23, hy + 1, 4, 2, '#8a7a5e'); P(12, hy + 3, 2, 3, '#8a7a5e'); P(15, hy - 2, 6, 1, '#6a5a44');   // кепі
    arm(...FRONT, ...fh, '#7a6a52'); L(fh[0], fh[1], fh[0] + 2, fh[1] + 3, '#5a3a1a', 1); P(fh[0] + 1, fh[1] + 3, 5, 5, '#c8d8e8'); P(fh[0] + 2, fh[1] + 4, 3, 3, '#e8f4ff');   // лупа
  };
  /** 11. РОБІН ГУД — зелений каптур-капелюх з червоним пером, туніка, сагайдак, лук (aim — натягує). */
  D.robinHood = (pose, fr, t) => {
    const aim = pose === 'aim', [bh, fh] = aim ? [[23, 25], [29, 24]] : hands(pose, fr, t);
    L(12, 22, 9, 31, '#7a4a2a', 3); P(8, 20, 1, 3, '#e8e0d0'); P(10, 20, 1, 3, '#e8e0d0');               // сагайдак зі стрілами
    arm(...BACK, ...bh, '#2a7a3a'); legs(pose, fr, '#5a4a2a', '#3a2a1a'); torso('#2a8a3a', '#1a6a2a', { belt: '#5a3a1a' });
    head(12, 10, SK, SKD, { mouth: 'smile' }); P(13, 9, 10, 2, '#7a4a2a');
    P(11, 7, 14, 4, '#2a7a3a'); P(14, 4, 9, 3, '#2a7a3a'); P(22, 2, 6, 2, '#2a7a3a'); L(14, 6, 9, 1, '#d02a2a', 2);   // капелюх і перо
    arm(...FRONT, ...fh, '#2a8a3a');
    const bx = aim ? 30 : fh[0] + 1; L(bx, (aim ? 24 : fh[1]) - 8, bx + 2, aim ? 24 : fh[1], '#8a5a2a', 1); L(bx + 2, aim ? 24 : fh[1], bx, (aim ? 24 : fh[1]) + 8, '#8a5a2a', 1);   // лук
    if (aim) { L(bx, 16, 24, 24, '#e8e0d0', 1); L(bx, 32, 24, 24, '#e8e0d0', 1); L(24, 24, 35, 24, '#c8a070', 1); }
  };
  /** 12. БАРОН МЮНХГАУЗЕН — трикутний капелюх, перука з буклями, закручені вуса, червоний камзол; верхи на ядрі (ride). */
  D.munchausen = (pose, fr, t) => {
    const ride = pose === 'ride', [bh, fh] = ride ? [[13, 29], [24, 13]] : hands(pose, fr, t);
    if (ride) { P(10, 32, 16, 12, '#2a2a34'); P(11, 31, 14, 1, '#2a2a34'); P(13, 33, 4, 3, '#5a5a6a'); P(15, 30, 4, 4, '#3a3a4a'); }   // ядро
    arm(...BACK, ...bh, '#c8202e'); if (ride) { P(13, 30, 4, 7, '#f0ece0'); P(21, 30, 4, 7, '#f0ece0'); P(12, 36, 5, 3, '#1a1a20'); P(21, 36, 5, 3, '#1a1a20'); } else legs(pose, fr, '#f0ece0', '#1a1a20');
    torso('#c8202e', '#901620', { buttons: '#ffd27a' }); P(15, 22, 6, 3, '#ffffff');
    head(12, 10, SK, SKD, { mouth: 0 }); P(10, 12, 3, 8, '#f4f4f4'); P(23, 12, 2, 5, '#f4f4f4'); P(11, 9, 14, 3, '#f4f4f4');   // перука
    L(17, 18, 13, 16, '#5a2a10', 2); L(19, 18, 24, 16, '#5a2a10', 2); P(12, 15, 1, 1, '#5a2a10'); P(24, 15, 1, 1, '#5a2a10');   // пишні закручені вуса
    const hx = ride ? 3 : 0; P(10 + hx, 5, 16, 3, '#1a2a5a'); P(13 + hx, 3, 10, 2, '#1a2a5a'); P(10 + hx, 7, 16, 1, '#e8c060');   // капелюх (у руці, коли махає)
    arm(...FRONT, ...fh, '#c8202e');
  };
  /** 14. СВЯТИЙ МИКОЛАЙ — біла митра із золотим хрестом, довга біла борода, червоні ризи, жезл, мішок за плечима. */
  D.stNicholas = (pose, fr, t) => {
    const [bh, fh] = hands(pose, fr, t);
    P(6, 21, 9, 12, '#8a5a3a'); P(7, 20, 7, 2, '#a8744a');                                                // мішок
    arm(...BACK, ...bh, '#c8202e'); legs(pose, fr, '#c8202e', '#3a1a1a'); dress('#c8202e', '#901620', { wide: .3 }); P(17, 22, 2, 14, '#ffd27a');   // ризи, золота смуга
    head(12, 11, SK, SKD, { mouth: 0 }); P(12, 18, 12, 9, '#f8f8f8'); P(14, 27, 8, 3, '#f8f8f8'); P(17, 18, 2, 1, '#e88a8a');   // борода
    P(13, 3, 10, 9, '#f8f4ec'); P(14, 1, 8, 2, '#f8f4ec'); P(16, 0, 4, 1, '#f8f4ec'); P(17, 3, 2, 8, '#ffd27a'); P(14, 6, 8, 2, '#ffd27a');   // митра з хрестом
    arm(...FRONT, ...fh, '#c8202e'); L(fh[0] + 1, fh[1] + 10, fh[0] + 1, 3, '#ffd27a'); P(fh[0] + 1, 1, 4, 2, '#ffd27a'); P(fh[0] + 4, 2, 2, 3, '#ffd27a');   // жезл із завитком
  };
  /** 15. ПОПЕЛЮШКА — золоте волосся в зачісці з діадемою, рожево-срібна бальна сукня, кришталеві черевички (twirl — кружляє). */
  D.cinderella = (pose, fr, t, g) => {
    const tw = pose === 'twirl', [bh, fh] = tw ? [[11, 16], [25, 16]] : hands(pose, fr, t), sw = tw ? Math.round(Math.sin(t * 8)) : 0;
    arm(...BACK, ...bh, '#f0b0d0'); legs(pose, fr, '#fdeee6', '#cfeaff', {}); if (g && g.lostShoe) P(19, 42, 3, 2, '#fdeee6');
    for (let y = 22; y < 39; y++) { const k = Math.max(0, y - 26) * .7; P(13 - k + sw, y, 10 + 2 * k, 1, y > 36 ? '#d890b8' : y % 4 === 0 ? '#ffe4f2' : '#f4b8d8'); }   // пишна сукня
    [[12, 33], [20, 30], [16, 36], [23, 35]].forEach(([a, b], i) => (Math.floor(t * 4) + i) % 3 === 0 && P(a + sw, b, 1, 1, '#ffffff'));   // блискітки
    head(12, 10, SK, SKD, { mouth: 'smile', lip: '#e05070' }); P(12, 9, 13, 4, '#f0c850'); P(12, 12, 2, 5, '#f0c850'); P(15, 5, 7, 5, '#f0c850'); P(15, 8, 7, 1, '#cfeaff'); P(18, 7, 1, 1, '#ffffff');   // зачіска й діадема
    arm(...FRONT, ...fh, '#f0b0d0');
  };
  /** 16. МЕРЛІН — довга біла борода, високий сірий капелюх, смарагдова мантія, посох із кристалом (cast — чаклує). */
  D.merlin = (pose, fr, t) => {
    const cast = pose === 'cast', [bh, fh] = cast ? [[12, 29], [25, 14]] : hands(pose, fr, t);
    arm(...BACK, ...bh, '#1a7a5a'); legs(pose, fr, '#1a5a44', '#2a1a10'); dress('#1a7a5a', '#0e5a40', { wide: .25 }); P(13, 22, 1, 15, '#e8c060'); P(22, 22, 1, 15, '#e8c060');
    head(12, 11, SK, SKD, { mouth: 0 }); P(12, 18, 12, 11, '#f4f4f8'); P(14, 29, 8, 4, '#f4f4f8'); P(16, 17, 3, 1, '#f4f4f8');   // борода
    hat.cone(18, 0, 12, 16, '#7a7a90', '#5a5a70', 5); P(10, 11, 16, 1, '#7a7a90');
    arm(...FRONT, ...fh, '#1a7a5a'); L(fh[0], fh[1] + (cast ? 18 : 12), fh[0], fh[1] - 8, '#8a5a2a'); P(fh[0] - 1, fh[1] - 11, 3, 3, cast ? '#e8fcff' : '#7ae0ff');   // посох
  };
  /** 17. ДЖИН — золотаво-бурштинова шкіра, червоний тюрбан із самоцвітом, борідка, замість ніг — димовий хвіст (float). */
  D.genie = (pose, fr, t) => {
    const cast = pose === 'cast', b = Math.round(Math.sin(t * 3)), S = '#e8a84a', SD = '#c0843a';
    for (let y = 30; y < 44; y++) { const k = (y - 30) / 14, w = 10 * (1 - k) + 2, xo = Math.sin(t * 4 + y * .5) * 2 * k; P(18 - w / 2 + xo, y, w, 1, y % 3 ? '#b88aff' : '#d6b8ff'); }   // димовий хвіст
    arm(...BACK, 11, cast ? 14 : 27 + b, '#a01a3a', S);
    P(13, 21 + b, 10, 10, S); P(14, 24 + b, 8, 1, SD); P(13, 28 + b, 10, 3, '#5a2a8a');                  // торс, пояс
    head(12, 9 + b, S, SD, { mouth: 'smile', lip: '#7a2a1a' }); P(16, 18 + b, 4, 3, '#2a1a10');            // борідка
    P(11, 5 + b, 14, 6, '#c8202e'); P(13, 3 + b, 10, 2, '#c8202e'); P(17, 6 + b, 2, 2, '#3ae0ff');        // тюрбан із самоцвітом
    arm(...FRONT, cast ? 26 : 24, cast ? 12 : 27 + b, '#a01a3a', S); P(12, 21 + b, 12, 2, '#a01a3a');
  };
  /** 18. ЗАЛІЗНИЙ ДРОВОРУБ — увесь із бляхи: лійка на голові, заклепки, червоне сердечко, сокира (rust — заіржавів). */
  D.tinMan = (pose, fr, t) => {
    const M = '#b8c0d0', MD = '#7a8296', rust = pose === 'rust', [bh, fh] = rust ? [[12, 18], [26, 13]] : hands(pose, fr, rust ? 0 : t);
    arm(...BACK, ...bh, M, M); legs(rust ? 'stand' : pose, fr, M, MD); P(13, 21, 10, 13, M); P(13, 21, 2, 13, '#dce2ee'); P(21, 21, 2, 13, MD);   // бляшаний тулуб
    [[14, 23], [21, 23], [14, 31], [21, 31]].forEach(([a, b]) => P(a, b, 1, 1, MD)); P(17, 24, 3, 3, '#e0203a'); P(18, 27, 1, 1, '#e0203a');   // заклепки, сердечко
    head(12, 10, M, MD, { mouth: 'smile', lip: MD, noCheek: 1 }); P(23, 15, 2, 2, MD);                     // ніс-гвинт
    P(13, 7, 10, 3, M); P(15, 4, 6, 3, M); P(17, 0, 2, 4, M);                                             // лійка
    arm(...FRONT, ...fh, M, M); L(fh[0], fh[1] + 4, fh[0], fh[1] - 8, '#8a5a2a'); P(fh[0], fh[1] - 10, 5, 4, '#dce2ee'); P(fh[0] + 4, fh[1] - 11, 1, 6, '#dce2ee');   // сокира
    if (rust) [[16, 30], [20, 18], [14, 12], [22, 36]].forEach(([a, b]) => P(a, b, 2, 1, '#b8642a'));      // іржа
  };
  /** 19. ДЖОН СІЛЬВЕР — пірат: трикутка, чорна борода, синій каптан, дерев'яна нога, милиця, папуга на плечі; копає скарб (dig). */
  D.silver = (pose, fr, t) => {
    const dig = pose === 'dig', up = dig && Math.sin(t * 6) > 0, [bh, fh] = dig ? [[up ? 18 : 20, up ? 22 : 30], [up ? 24 : 26, up ? 22 : 32]] : hands(pose, fr, t);
    if (!dig) L(11, 24, 9, 43, '#8a5a2a');                                                                 // милиця
    arm(...BACK, ...bh, '#1a3a8a'); legs(pose, fr, '#3a3a44', '#1a1a20', { peg: 1 }); torso('#1a3a8a', '#102a6a', { belt: '#5a3a1a', buttons: '#ffd27a' }); P(16, 22, 4, 4, '#f4f0e8');
    head(12, 10, '#e8c0a0', '#c89a7a', { mouth: 0 }); P(12, 17, 12, 5, '#1a1a1a'); P(16, 17, 4, 1, '#c87070');   // борода
    P(9, 6, 18, 4, '#1a1a24'); P(12, 4, 12, 2, '#1a1a24'); P(17, 6, 2, 2, '#f4f4f4');                     // трикутка з черепом
    P(21, 17, 5, 5, '#2aa83a'); P(24, 15, 3, 3, '#2aa83a'); P(26, 16, 2, 1, '#ffd27a'); P(21, 21, 2, 3, '#e0203a'); P(25, 15, 1, 1, '#1a1a1a');   // папуга
    arm(...FRONT, ...fh, '#1a3a8a', '#e8c0a0');
    if (dig) { L(fh[0] - 2, fh[1] - 6, fh[0] + 3, fh[1] + 8, '#8a5a2a'); P(fh[0] + 2, fh[1] + 8, 5, 4, '#9aa0b0'); }   // лопата
  };
  /** 3. ЧЕШИРСЬКИЙ КІТ — сірувато-бузковий смугастий кіт із широченною усмішкою (кіт-спрайт Рудика іншими фарбами). */
  const CHESH = { O: '#9a8cc4', L: '#c4b8e8', D: '#6a5a9a', S: '#4a3a74', W: '#f2eefc', N: '#ff9fc6', B: '#d8a6d0', E: '#1a2a10', OUT: [24, 16, 40] };
  D.cheshire = (pose, fr, t, g, cv) => {
    const cp = pose === 'run' ? 'run' : pose === 'sit' ? 'sit' : 'walk'; drawCat(cp, fr, t, cv, CHESH); x = cv.getContext('2d');
    const bb = cp === 'sit' ? 0 : (fr % 4) % 2, [hx, hy] = cp === 'sit' ? [10, 1] : [18, 4 + bb];
    P(hx + 2, hy + 7, 10, 3, '#ffffff'); P(hx + 2, hy + 7, 10, 1, '#2a1a3a'); for (let i = 0; i < 5; i++) P(hx + 3 + i * 2, hy + 8, 1, 2, '#c8c0d8');   // широченна усмішка
    P(hx + 2, hy + 3, 3, 3, '#c8e84a'); P(hx + 8, hy + 3, 3, 3, '#c8e84a'); P(hx + 3, hy + 3, 1, 3, '#1a2a10'); P(hx + 9, hy + 3, 1, 3, '#1a2a10');   // жовто-зелені очі зі щілинками
  };
  /** 6. КОЛОБОК — рум'яний круглий хлібчик з обличчям; котиться (roll — обличчя «обертається»). */
  D.kolobok = (pose, fr, t) => {
    const roll = pose === 'roll' || pose === 'walk' || pose === 'run', b = roll ? Math.abs(Math.sin(t * 9)) * 3 : 0, cy = 34 - b, r = 8;
    for (let y = -r; y <= r; y++) { const w = Math.round(Math.sqrt(r * r - y * y)) * 2; P(18 - w / 2, cy + y, w, 1, y < -4 ? '#ffd88a' : y > 4 ? '#c8842a' : '#f0b04a'); }
    [[13, cy - 2], [22, cy + 3], [16, cy + 5]].forEach(([a, b2]) => P(a, b2, 2, 1, '#c8842a'));
    const fx = roll ? Math.round(Math.sin(t * 6) * 3) : 2; eye(15 + fx, cy - 3); eye(19 + fx, cy - 3); P(16 + fx, cy + 1, 4, 1, '#7a2a1a'); P(14 + fx, cy, 1, 1, '#ff8a7a'); P(22 + fx, cy, 1, 1, '#ff8a7a');
  };
  /** 13. ЖАР-ПТИЦЯ — золото-вогняний птах із чубчиком і довгим полум'яним хвостом; летить (махає крилами). */
  D.firebird = (pose, fr, t) => {
    const up = Math.sin(t * 10) > 0;
    for (let i = 0; i < 4; i++) { const yy = 22 + i * 3 + Math.round(Math.sin(t * 6 + i) * 1.5); L(14, 22, 1 + i * 2, yy + 6, ['#ff3a2a', '#ff8a2a', '#ffd04a', '#ff5ae0'][i], 2); P(i * 2, yy + 5, 3, 3, '#fff0a0'); }   // хвіст
    P(14, 18, 12, 7, '#ffb02a'); P(15, 17, 10, 2, '#ffd86a'); P(16, 24, 9, 2, '#e8702a');                 // тіло
    P(24, 13, 7, 6, '#ffc83a'); eye(27, 14, '#1a1010'); P(31, 16, 3, 2, '#ff7a2a'); [[25, 9], [27, 8], [29, 9]].forEach(([a, b]) => P(a, b, 1, 4, '#ff5ae0'));   // голова, дзьоб, чубчик
    if (up) { P(15, 8, 9, 10, '#ff8a2a'); P(17, 6, 6, 3, '#ffd04a'); } else { P(15, 23, 9, 9, '#ff8a2a'); P(17, 30, 6, 3, '#ffd04a'); }   // крило
  };
  /** 20. ЗМІЙ ГОРИНИЧ — маленький зелений дракончик з трьома головами; чхає вогнем (sneeze). */
  D.gorynych = (pose, fr, t) => {
    const G_ = '#3aa84a', GD = '#24783a', GL = '#7ade6a', f = pose === 'walk' || pose === 'run' ? fr % 4 : 0, sn = pose === 'sneeze';
    L(10, 34, 1, 30, G_, 3); P(0, 28, 3, 3, GD);                                                           // хвіст
    P(8, 26, 17, 12, G_); P(9, 25, 15, 2, GL); P(10, 35, 13, 2, '#e8d070');                               // тіло й черевце
    P(10, 18, 7, 8, GD); P(11, 17, 5, 2, '#2a6a3a');                                                       // крило
    [11, 15, 20].forEach((lx, i) => P(lx + (f % 2 && i % 2 ? 1 : 0), 37, 3, 7 - ((f + i) % 2), GD));       // лапи
    [[18, 14, 26, 6], [21, 18, 31, 12], [16, 16, 18, 4]].forEach(([nx, ny, hx, hy], i) => { const b = Math.round(Math.sin(t * 3 + i * 2)); L(nx, ny + 10, hx, hy + 3 + b, G_, 3);
      P(hx - 1, hy + b, 7, 6, G_); P(hx, hy - 1 + b, 3, 2, GL); eye(hx + 2, hy + 1 + b); P(hx + 5, hy + 3 + b, 2, 1, '#7a1a1a');   // голови
      if (sn && i === 1) { const k = (Math.sin(t * 12) + 1) / 2; P(hx + 5, hy + 2 + b, 3 + k * 2, 3, '#ffb02a'); P(hx + 4, hy + 3 + b, 1, 1, '#fff0a0'); } });
  };

  // ======================= розміри: [W, H, масштаб] =======================
  const SIZE = { kolobok: [36, 44, .8], cheshire: [32, 24, .82], pussBoots: [36, 44, .82], dwarf: [36, 44, .74], firebird: [36, 44, .9], gorynych: [36, 44, 1.05], genie: [36, 44, 1.05] };
  const size = id => SIZE[id] || [36, 44, 1];
  /** Обвідка — темний контур довкола силуету (як у Рудика). */
  function outline(cv, rgb = [20, 10, 40]) {
    const W = cv.width, H = cv.height, c = cv.getContext('2d', { willReadFrequently: true }), id = c.getImageData(0, 0, W, H), d = id.data, op = new Uint8Array(W * H);
    for (let i = 0; i < op.length; i++) op[i] = d[i * 4 + 3] > 40 ? 1 : 0;
    for (let yy = 0; yy < H; yy++) for (let xx = 0; xx < W; xx++) { const i = yy * W + xx; if (op[i]) continue;
      if ((xx > 0 && op[i - 1]) || (xx < W - 1 && op[i + 1]) || (yy > 0 && op[i - W]) || (yy < H - 1 && op[i + W])) { d[i * 4] = rgb[0]; d[i * 4 + 1] = rgb[1]; d[i * 4 + 2] = rgb[2]; d[i * 4 + 3] = 255; } }
    c.putImageData(id, 0, 0);
  }
  function draw(id, pose, fr, t, cv, g) {
    const [W, H] = size(id); if (id === 'cheshire') { D.cheshire(pose, fr, t, g, cv); return cv; }   // свій контур — у drawCat
    cv.width = W; cv.height = H; x = cv.getContext('2d', { willReadFrequently: true }); x.clearRect(0, 0, W, H);
    (D[id] || D.dwarf)(pose, fr, t, g); outline(cv); return cv;
  }
  // ======================= речі на підлозі (prop) =======================
  /** Малюнок речі в полотно 16×12 (ноги — нижній рядок). */
  function drawProp(type, t, cv) {
    cv.width = 16; cv.height = 12; x = cv.getContext('2d', { willReadFrequently: true }); x.clearRect(0, 0, 16, 12); const gl = (Math.sin(t * 4) + 1) / 2;
    if (type === 'chest') { P(2, 4, 12, 8, '#8a4a1a'); P(2, 3, 12, 2, '#a8602a'); P(2, 7, 12, 1, '#ffd27a'); P(7, 6, 2, 3, '#ffd27a'); P(4, 1, 8, 2, gl > .5 ? '#fff0a0' : '#ffd27a'); }
    else if (type === 'gift') { P(3, 4, 10, 8, '#d0202e'); P(7, 4, 2, 8, '#ffd27a'); P(3, 7, 10, 1, '#ffd27a'); P(5, 2, 3, 2, '#ffd27a'); P(8, 2, 3, 2, '#ffd27a'); }
    else if (type === 'shoe') { P(4, 8, 8, 3, '#cfeaff'); P(9, 5, 3, 4, '#cfeaff'); P(4, 11, 3, 1, '#9ad8ff'); P(10, 6, 1, 1, '#ffffff'); if (gl > .6) P(6, 7, 1, 1, '#ffffff'); }
    else if (type === 'feather') { P(3, 9, 10, 2, '#ff8a2a'); P(5, 8, 7, 1, '#ffd04a'); P(12, 9, 2, 1, '#ff3a2a'); if (gl > .5) P(8, 7, 1, 1, '#fff8c0'); }
    else if (type === 'lamp') { P(4, 7, 8, 4, '#e8b030'); P(11, 6, 4, 2, '#e8b030'); P(2, 7, 2, 3, '#c89020'); P(6, 5, 4, 2, '#ffd86a'); P(4, 11, 8, 1, '#a87010'); }
    outline(cv); return cv;
  }
  return { draw, size, drawProp };
})();
