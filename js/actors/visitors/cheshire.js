/* ============================================================================
 * actors/visitors/cheshire.js — ЧЕШИРСЬКИЙ КІТ (за ілюстраціями Дж. Тенніела, 1865)
 * ----------------------------------------------------------------------------
 * Смугастий кіт з широченною усмішкою. Сідає, поступово зникає —
 * у повітрі лишається тільки усмішка. Рудик здивовано на неї дивиться.
 * ========================================================================== */
NX.visitors.def('cheshire', {
  W: 30, H: 24, speed: 36, pxs: .8, color: '#ff7af0', outline: [40, 10, 50],
  draw(P, pose, t, v, x) {
    const fade = v.mem.fade || 0, A = '#c86ad8', AL = '#e89af0', S = '#7a2a9a', grin = () => { P(17, 9, 10, 3, '#ffffff'); P(16, 8, 1, 2, '#ffffff'); P(27, 8, 1, 2, '#ffffff'); for (let i = 0; i < 5; i++) P(17 + i * 2, 10, 1, 1, '#c8c8d8'); P(16, 7, 1, 1, '#1a0a20'); P(27, 7, 1, 1, '#1a0a20'); };
    if (fade < .9) { x.globalAlpha = 1 - fade;
      const sit = pose === 'sit' || pose === 'stand', f = v.frame % 4;
      if (sit) { P(6, 10, 12, 13, A); P(6, 10, 12, 1, AL); for (let i = 0; i < 4; i++) P(6, 12 + i * 3, 12, 1, S); P(2, 19, 6, 3, A); P(1, 15, 3, 5, A); P(1, 15, 3, 1, S); P(8, 21, 3, 2, AL); P(13, 21, 3, 2, AL); }
      else { P(4, 11, 16, 7, A); P(4, 11, 16, 1, AL); for (let i = 0; i < 4; i++) P(6 + i * 4, 11, 1, 7, S); [5, 8, 15, 18].forEach((lx, i) => P(lx + ((f % 2) && i % 2 ? 1 : 0), 18, 2, 5, A)); P(1, 8, 3, 5, A); P(1, 8, 3, 1, S); }
      P(14, 2, 14, 11, A); P(14, 2, 14, 1, AL); P(14, 0, 3, 3, A); P(25, 0, 3, 3, A); P(15, 1, 1, 1, '#ff9fd8'); P(26, 1, 1, 1, '#ff9fd8');
      P(16, 4, 3, 3, '#7aff6a'); P(23, 4, 3, 3, '#7aff6a'); P(17, 4, 1, 3, '#1a0a20'); P(24, 4, 1, 3, '#1a0a20'); P(20, 7, 2, 1, '#ff6ab0');
      for (let i = 0; i < 3; i++) P(15 + i * 4, 2, 2, 1, S);
    }
    x.globalAlpha = 1; grin();
  },
  script(v) {
    const [x, y] = NX.visitors.spot();
    return [{ say: 'hi' }, { walk: [x, y] }, { wait: 1, pose: 'sit' },
      { say: 'mur', dur: 3, do: () => NX.cat.goTo(x - 34, y, () => NX.cat.set('sit', 5)) },
      { wait: 3.5, pose: 'sit', tick: (vv, dt) => { vv.mem.fade = Math.min(1, (vv.mem.fade || 0) + dt / 2.2); } },
      { wait: 1.5, pose: 'sit' }, { wait: 1.2, pose: 'sit', tick: (vv, dt) => { vv.mem.fade = Math.max(0, vv.mem.fade - dt); } }, { say: 'bye' }];
  },
});
