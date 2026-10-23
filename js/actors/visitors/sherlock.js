/* ============================================================================
 * actors/visitors/sherlock.js — ШЕРЛОК ХОЛМС (за книгами А. Конан Дойла)
 * ----------------------------------------------------------------------------
 * Кашкет-мисливка в клітинку, плащ-накидка, люлька, лупа.
 * Розслідує кімнату: оглядає пилосос, фонтан, кота і Nexi крізь лупу.
 * ========================================================================== */
NX.visitors.def('sherlock', {
  W: 28, H: 44, speed: 32, color: '#ffc94d', outline: [30, 18, 10],
  draw(P, pose, t, v) {
    const SK = '#f2c8a0', SKD = '#c89870', CO = '#8a6a48', COL = '#b08a60', COD = '#5a4228', CH = '#a07850', CHD = '#6a4a2a', b = (pose === 'walk' && v.frame % 2) ? 1 : 0, ins = pose === 'inspect';
    NX.visitors.legs(P, v, pose, 10, 16, 36, 6, '#3a3028', '#1a1410');
    P(7, 16 - b, 14, 21, CO); P(7, 16 - b, 14, 1, COL); P(13, 17 - b, 1, 19, COD); P(7, 36, 14, 1, COD);       // пальто
    P(4, 15 - b, 20, 8, COL); P(4, 15 - b, 20, 1, '#d0aa80'); P(4, 22 - b, 20, 1, COD);                          // накидка
    P(11, 15 - b, 6, 3, '#f0ece4'); P(13, 16 - b, 2, 3, '#7a1a2a');                                              // комір, краватка
    if (ins) { P(19, 22, 6, 3, CO); P(23, 18, 3, 5, SK); P(22, 13, 6, 6, '#c3cbea'); P(23, 14, 4, 4, '#7af0ff'); P(23, 14, 1, 1, '#ffffff'); P(25, 19, 2, 4, '#6a4a2a'); }
    else { P(20, 22, 3, 9, CO); P(20, 31, 3, 2, SK); P(5, 22, 3, 9, CO); P(5, 31, 3, 2, SK); }
    const hy = (ins ? 4 : 3) - b, hx = ins ? 10 : 9;
    P(hx, hy + 2, 10, 11, SK); P(hx, hy + 2, 10, 1, '#ffe0c0'); P(hx + 6, hy + 6, 2, 1, '#2a1a10'); P(hx + 2, hy + 6, 2, 1, '#2a1a10'); P(hx + 7, hy + 8, 2, 2, SKD); P(hx + 3, hy + 11, 5, 1, SKD);
    P(hx + 6, hy + 11, 5, 1, '#3a2010'); P(hx + 10, hy + 9, 3, 3, '#5a3010'); P(hx + 10, hy + 9, 3, 1, '#ff9a3a');   // люлька
    P(hx - 1, hy - 1, 12, 4, CH); P(hx, hy - 2, 10, 1, CH); P(hx - 2, hy + 2, 3, 2, CH); P(hx + 9, hy + 2, 4, 2, CH);   // мисливка
    for (let i = 0; i < 5; i++) P(hx + i * 2, hy - 1 + (i % 2), 1, 1, CHD); P(hx + 4, hy - 3, 2, 1, CHD);
    if (Math.floor(t * 1.5) % 2) P(hx + 12, hy + 6 - (t * 6 % 4), 1, 1, '#c8c8d8');                              // дим
  },
  script(v) {
    const T = [() => [NX.objects.vacuum.x, NX.objects.vacuum.y], () => NX.objects.fountain.pos, () => [NX.cat.x, Math.max(NX.cat.ground, 380)], () => [NX.nexi.x, Math.max(NX.nexi.y, 380)]].sort(() => Math.random() - .5).slice(0, 3);
    const s = [{ say: 'hi' }];
    T.forEach((f, i) => { const [x, y] = f(); s.push({ walk: NX.room.clampWalk(x - 30, y + 6) }, { face: 1 }, { wait: 1.6, pose: 'inspect' }, { say: i < 2 ? 'hmm' : 'elementary', dur: 2 }); });
    return s;
  },
});
