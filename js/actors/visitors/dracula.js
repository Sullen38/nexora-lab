/* ============================================================================
 * actors/visitors/dracula.js — ДРАКУЛА (книжковий граф Брема Стокера, 1897)
 * ----------------------------------------------------------------------------
 * Виходить з порталу, підкрадається до Nexi, розкриває плащ "Бу!",
 * розуміє що помилився ("Упс, не той замок…"), загортається й іде назад.
 * ========================================================================== */
NX.visitors.def('dracula', {
  W: 28, H: 44, speed: 34, color: '#e83a4e', outline: [40, 8, 16],
  draw(P, pose, t, v) {
    const SK = '#e8e0f0', SKD = '#b8a8c8', HA = '#14101c', CL = '#18121e', CLL = '#34283e', RD = '#b8142a', RDL = '#e83a4e', GO = '#ffc94d';
    const wrap = pose === 'wrap', open = pose === 'boo', b = (pose === 'walk' && v.frame % 2) ? 1 : 0;
    if (!wrap) { P(2, 15, 24, 27, RD); P(3, 16, 22, 1, RDL); for (let i = 0; i < 5; i++) P(3 + i * 5, 40 + (i % 2), 3, 2, RD); }          // підкладка плаща
    NX.visitors.legs(P, v, pose, 10, 15, 36, 6, '#1a1420', '#0a080e');
    P(8, 17 - b, 12, 20, CL); P(8, 17 - b, 12, 1, CLL); P(12, 17 - b, 4, 10, '#f4f0f8'); P(13, 18 - b, 2, 2, RD); P(12, 24 - b, 4, 2, GO); P(13, 25 - b, 2, 1, '#fff6c0');
    if (wrap) { P(3, 14, 22, 29, CL); P(3, 14, 22, 1, CLL); P(13, 15, 1, 27, '#2a2034'); P(6, 21, 3, 1, CLL); P(18, 20, 4, 3, SK); }
    else { P(4, 16, 5, 26, CL); P(19, 16, 5, 26, CL); P(4, 16, 1, 26, CLL); }
    if (open) { P(0, 14, 5, 3, CL); P(23, 14, 5, 3, CL); P(0, 13, 2, 3, SK); P(26, 13, 2, 3, SK); }
    else if (!wrap) { const sw = pose === 'walk' ? (v.frame % 2 ? 1 : -1) : 0; P(6, 21 + sw, 3, 10, CL); P(19, 21 - sw, 3, 10, CL); P(6, 30 + sw, 3, 2, SK); P(19, 30 - sw, 3, 2, SK); }
    P(4, 8 - b, 4, 9, RD); P(20, 8 - b, 4, 9, RD); P(4, 8 - b, 4, 1, RDL); P(20, 8 - b, 4, 1, RDL); P(5, 9 - b, 2, 8, CL); P(21, 9 - b, 2, 8, CL);   // комір
    const hy = 3 - b; P(9, hy, 10, 12, SK); P(9, hy, 10, 1, '#ffffff'); P(8, hy + 3, 1, 4, SK); P(19, hy + 3, 1, 4, SK); P(7, hy + 3, 2, 2, SK); P(19, hy + 3, 2, 2, SK); P(7, hy + 2, 1, 1, SK); P(20, hy + 2, 1, 1, SK);
    P(9, hy - 2, 10, 3, HA); P(8, hy - 1, 1, 5, HA); P(19, hy - 1, 1, 5, HA); P(13, hy + 1, 2, 2, HA); P(10, hy - 2, 8, 1, '#2a2438');
    P(10, hy + 4, 3, 1, HA); P(15, hy + 4, 3, 1, HA);
    const lk = pose === 'look' ? (Math.floor(t * 3) % 2 ? 1 : -1) : 0;
    if (open) { P(10, hy + 5, 3, 2, '#ffffff'); P(15, hy + 5, 3, 2, '#ffffff'); P(11, hy + 5, 1, 1, RD); P(16, hy + 5, 1, 1, RD); P(12, hy + 9, 4, 2, '#3a0a14'); P(12, hy + 9, 1, 1, '#ffffff'); P(15, hy + 9, 1, 1, '#ffffff'); }
    else { P(10 + Math.max(0, lk), hy + 5, 2, 1, RD); P(15 + Math.max(0, lk), hy + 5, 2, 1, RD); P(12, hy + 9, 4, 1, SKD); P(12, hy + 10, 1, 1, '#ffffff'); P(15, hy + 10, 1, 1, '#ffffff'); }
    P(13, hy + 6, 2, 2, SKD);
  },
  script(v) {
    const n = NX.nexi, [x, y] = NX.room.clampWalk(n.x + 40, Math.max(n.y, 384));
    return [{ say: 'hi' }, { walk: [x, y] }, { face: -1 }, { wait: 1, pose: 'look' }, { say: 'boo', do: () => { NX.nexi.emote('surprise', 2.5); NX.cat.set('pounce', .6, () => NX.cat.set('meow', 1.5)); } },
      { wait: 1.6, pose: 'boo' }, { say: 'oops', dur: 2.6 }, { wait: 1.2, pose: 'look' }, { wait: .6, pose: 'wrap' }];
  },
  tap(v) { NX.visitors.say(v, 'boo'); v.pose = 'boo'; },
});
