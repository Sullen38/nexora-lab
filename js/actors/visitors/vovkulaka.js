/* ============================================================================
 * actors/visitors/vovkulaka.js — ВОВКУЛАКА (вовкулак з українського фольклору)
 * ----------------------------------------------------------------------------
 * Вовк-перевертень без одягу: густа сіра шерсть, світле черево, хвіст. Іде до вікна,
 * виє на місяць "Ау-у-у!", Рудик тікає ховатися на лежанку.
 * ========================================================================== */
NX.visitors.def('vovkulaka', {
  W: 30, H: 44, speed: 38, color: '#9ab0d0', outline: [20, 20, 32],
  draw(P, pose, t, v) {
    const F = '#7a8498', FL = '#a8b2c4', FD = '#4e566a', BL = '#c8ced8', BK = '#1a1c28', b = (pose === 'walk' && v.frame % 2) ? 1 : 0, howl = pose === 'howl';
    const wag = Math.round(Math.sin(t * 6) * 1.5);
    P(2, 26 + wag, 6, 3, F); P(0, 23 + wag, 4, 4, F); P(0, 23 + wag, 3, 1, FL); P(1, 25 + wag, 2, 1, BL);                         // хвіст
    NX.visitors.legs(P, v, pose, 10, 17, 33, 9, F, FD); P(9, 43, 1, 1, '#ffffff'); P(20, 43, 1, 1, '#ffffff');             // лапи з кігтями
    P(9, 30, 12, 5, F); P(9, 30, 12, 1, FD);                                                                                  // стегна
    P(7, 15 - b, 16, 16, F); P(7, 15 - b, 16, 1, FL); P(11, 18 - b, 8, 12, BL); P(11, 18 - b, 8, 1, '#e4e8ee');           // торс у шерсті, світле черево
    for (let i = 0; i < 4; i++) { P(8, 17 + i * 3 - b, 1, 2, FD); P(21, 18 + i * 3 - b, 1, 2, FD); P(12 + i * 2, 29 - b, 1, 2, F); }   // пасма шерсті
    const sw = pose === 'walk' ? (v.frame % 2 ? 1 : -1) : 0;
    if (howl) { P(4, 11, 4, 7, F); P(22, 11, 4, 7, F); P(3, 8, 4, 4, FL); P(23, 8, 4, 4, FL); }
    else { P(4, 16 + sw, 4, 10, F); P(22, 16 - sw, 4, 10, F); P(4, 25 + sw, 4, 3, FL); P(22, 25 - sw, 4, 3, FL); P(4, 28 + sw, 1, 1, '#ffffff'); P(25, 28 - sw, 1, 1, '#ffffff'); }
    const hx = 8, hy = (howl ? 1 : 3) - b;
    P(hx, hy + 2, 13, 11, F); P(hx, hy + 2, 13, 1, FL); P(hx + 1, hy, 3, 3, F); P(hx + 9, hy, 3, 3, F); P(hx + 2, hy + 1, 1, 1, '#d88a9a'); P(hx + 10, hy + 1, 1, 1, '#d88a9a');
    P(hx - 1, hy + 9, 3, 6, F); P(hx + 11, hy + 10, 3, 5, F);                                                                 // кудлата грива
    if (howl) { P(hx + 9, hy - 3, 6, 6, FL); P(hx + 13, hy - 4, 2, 2, BK); P(hx + 10, hy + 2, 4, 2, '#3a1010'); }
    else { P(hx + 9, hy + 6, 8, 5, FL); P(hx + 15, hy + 6, 2, 2, BK); P(hx + 10, hy + 10, 6, 1, FD); P(hx + 11, hy + 11, 1, 1, '#ffffff'); P(hx + 14, hy + 11, 1, 1, '#ffffff'); }
    P(hx + 5, hy + 5, 2, 2, '#ffd02a'); P(hx + 6, hy + 5, 1, 1, BK); P(hx + 2, hy + 9, 4, 3, FL);
  },
  script(v) {
    return [{ say: 'hi' }, { walk: [720, 382] }, { face: -1 }, { wait: .6 },
      { say: 'howl', dur: 3, do: () => { NX.city.fireworks && 0; NX.cat.goTo(96, 380, () => NX.cat.startJump(80, 349, () => NX.cat.set('sleep', 8)), null, true); NX.nexi.emote('surprise', 2); } },
      { wait: 3, pose: 'howl', tick: (vv, dt) => Math.random() < dt * 3 && NX.fx.emit('note', vv.x, vv.y - 50, { col: '#cfe6ff' }) },
      { walk: NX.visitors.spot() }, { say: 'bye' }, { wait: 1 }];
  },
  tap(v) { NX.visitors.say(v, 'howl'); v.cur = { wait: 1.5, pose: 'howl', _t: 0 }; },
});
