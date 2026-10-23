/* ============================================================================
 * actors/visitors/vovkulaka.js — ВОВКУЛАКА (вовкулак з українського фольклору)
 * ----------------------------------------------------------------------------
 * Вовча голова, сіра шерсть, порвана вишиванка, шаровари. Іде до вікна,
 * виє на місяць "Ау-у-у!", Рудик тікає ховатися на лежанку.
 * ========================================================================== */
NX.visitors.def('vovkulaka', {
  W: 30, H: 44, speed: 38, color: '#9ab0d0', outline: [20, 20, 32],
  draw(P, pose, t, v) {
    const F = '#7a8498', FL = '#a8b2c4', FD = '#4e566a', SH = '#f2ece0', SHD = '#c8c0b0', RD = '#c8282e', BK = '#1a1c28', b = (pose === 'walk' && v.frame % 2) ? 1 : 0, howl = pose === 'howl';
    // шаровари, лапи з кігтями
    P(9, 30, 12, 7, '#2a3a6a'); P(9, 30, 12, 1, '#3a4e8a');
    NX.visitors.legs(P, v, pose, 10, 17, 36, 6, F, FD); P(9, 43, 1, 1, '#ffffff'); P(20, 43, 1, 1, '#ffffff');
    // вишиванка (порвана знизу), червоний орнамент
    P(8, 16 - b, 14, 15, SH); P(8, 16 - b, 14, 1, '#ffffff'); P(8, 30, 2, 2, SH); P(13, 30, 3, 1, SH); P(19, 30, 3, 2, SH);
    for (let i = 0; i < 3; i++) { P(14, 18 + i * 3 - b, 2, 1, RD); P(13, 19 + i * 3 - b, 1, 1, RD); P(16, 19 + i * 3 - b, 1, 1, RD); }
    P(8, 25 - b, 14, 1, RD); P(9, 26 - b, 1, 1, RD); P(12, 26 - b, 1, 1, RD); P(17, 26 - b, 1, 1, RD); P(20, 26 - b, 1, 1, RD); P(9, 22 - b, 1, 5, SHD);
    // руки-лапи
    const sw = pose === 'walk' ? (v.frame % 2 ? 1 : -1) : 0;
    if (howl) { P(4, 12, 4, 6, SH); P(22, 12, 4, 6, SH); P(3, 9, 4, 4, F); P(23, 9, 4, 4, F); }
    else { P(4, 17 + sw, 4, 9, SH); P(22, 17 - sw, 4, 9, SH); P(4, 25 + sw, 4, 3, F); P(22, 25 - sw, 4, 3, F); P(4, 28 + sw, 1, 1, '#ffffff'); P(25, 28 - sw, 1, 1, '#ffffff'); }
    // вовча голова (у виття — морда вгору)
    const hx = 8, hy = (howl ? 1 : 3) - b;
    P(hx, hy + 2, 13, 11, F); P(hx, hy + 2, 13, 1, FL); P(hx + 1, hy, 3, 3, F); P(hx + 9, hy, 3, 3, F); P(hx + 2, hy + 1, 1, 1, '#d88a9a'); P(hx + 10, hy + 1, 1, 1, '#d88a9a');   // вуха
    if (howl) { P(hx + 9, hy - 3, 6, 6, FL); P(hx + 13, hy - 4, 2, 2, BK); P(hx + 10, hy + 2, 4, 2, '#3a1010'); }
    else { P(hx + 9, hy + 6, 8, 5, FL); P(hx + 15, hy + 6, 2, 2, BK); P(hx + 10, hy + 10, 6, 1, FD); P(hx + 11, hy + 11, 1, 1, '#ffffff'); P(hx + 14, hy + 11, 1, 1, '#ffffff'); }
    P(hx + 5, hy + 5, 2, 2, '#ffd02a'); P(hx + 6, hy + 5, 1, 1, BK); P(hx + 2, hy + 9, 4, 3, FL); P(hx - 1, hy + 6, 2, 5, F);   // око, щока, шерсть
  },
  script(v) {
    return [{ say: 'hi' }, { walk: [720, 382] }, { face: -1 }, { wait: .6 },
      { say: 'howl', dur: 3, do: () => { NX.city.fireworks && 0; NX.cat.goTo(96, 380, () => NX.cat.startJump(80, 349, () => NX.cat.set('sleep', 8)), null, true); NX.nexi.emote('surprise', 2); } },
      { wait: 3, pose: 'howl', tick: (vv, dt) => Math.random() < dt * 3 && NX.fx.emit('note', vv.x, vv.y - 50, { col: '#cfe6ff' }) },
      { walk: NX.visitors.spot() }, { say: 'bye' }, { wait: 1 }];
  },
  tap(v) { NX.visitors.say(v, 'howl'); v.cur = { wait: 1.5, pose: 'howl', _t: 0 }; },
});
