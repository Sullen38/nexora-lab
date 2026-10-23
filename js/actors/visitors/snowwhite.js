/* ============================================================================
 * actors/visitors/snowwhite.js — БІЛОСНІЖКА (казка братів Грімм, 1812)
 * ----------------------------------------------------------------------------
 * Грімм: "біла, як сніг, рум'яна, як кров, з волоссям, чорним, як ебеновe
 * дерево". Тут — довга чорна коса, червона сукня з білим фартухом, червоне
 * яблуко, довкола пурхають дві пташки. Пропонує Nexi яблуко — він куштує
 * і ненадовго засинає просто на підлозі (nexi.js -> appleNap()).
 * ========================================================================== */
NX.visitors.def('snowwhite', {
  W: 26, H: 44, speed: 32, color: '#ff6a8a', outline: [40, 10, 20],
  draw(P, pose, t, v) {
    const SK = '#fbeef0', HA = '#141020', HAL = '#2e2840', RD = '#c8202e', RDL = '#f04a58', RDD = '#8a1420', WH = '#ffffff', b = (pose === 'walk' && v.frame % 2) ? 1 : 0, offer = pose === 'offer';
    P(8, 40, 4, 3, '#5a2a1a'); P(14, 40, 4, 3, '#5a2a1a');
    P(6, 26, 14, 14, RD); P(5, 32, 16, 8, RD); P(6, 26, 14, 1, RDL); P(5, 39, 16, 1, RDD); P(9, 27, 8, 12, WH); P(9, 27, 8, 1, '#f0e8f0'); for (let i = 0; i < 3; i++) P(10 + i * 3, 37, 1, 1, RDL);   // сукня, фартух
    P(8, 16 - b, 10, 11, RD); P(8, 16 - b, 10, 1, RDL); P(11, 16 - b, 4, 3, WH); P(12, 20 - b, 2, 1, '#ffd02a');                     // корсаж, комір
    if (offer) { P(18, 18, 6, 3, RD); P(22, 15, 3, 3, SK); P(22, 11, 4, 4, '#e8202a'); P(23, 11, 1, 1, '#ffffff'); P(24, 10, 1, 2, '#3a7a2a'); }
    else { const sw = pose === 'walk' ? (v.frame % 2 ? 1 : -1) : 0; P(18, 18 + sw, 3, 8, RD); P(18, 26 + sw, 3, 2, SK); P(17, 25 + sw, 4, 4, '#e8202a'); }
    P(5, 18, 3, 8, RD); P(5, 26, 3, 2, SK);
    const hy = 3 - b; P(8, hy, 11, 13, SK); P(8, hy, 11, 1, WH);
    P(7, hy - 2, 13, 4, HA); P(7, hy - 2, 13, 1, HAL); P(6, hy, 2, 12, HA); P(19, hy, 2, 7, HA); P(19, hy + 7, 3, 12, HA); P(20, hy + 19, 2, 4, HA); P(19, hy + 15, 3, 1, RD);   // волосся і довга коса
    P(10, hy + 6, 2, 2, '#1a1a3a'); P(15, hy + 6, 2, 2, '#1a1a3a'); P(10, hy + 6, 1, 1, WH); P(15, hy + 6, 1, 1, WH); P(9, hy + 9, 2, 1, '#ff9fb5'); P(16, hy + 9, 2, 1, '#ff9fb5'); P(12, hy + 10, 3, 1, '#d01a30');
  },
  script(v) {
    const n = NX.nexi, [x, y] = NX.room.clampWalk(n.x + 34, Math.max(n.y, 384));
    return [{ say: 'hi' }, { walk: NX.visitors.spot() }, { wait: 1 }, { walk: [x, y] }, { face: -1 }, { say: 'apple', dur: 2.6 }, { wait: 1.8, pose: 'offer' },
      { do: () => NX.nexi.appleNap() }, { wait: 2.5 }, { say: 'bye' }];
  },
});
// пташки, що пурхають навколо Білосніжки
(() => { const L = NX.visitors.layers.bind(NX.visitors); NX.visitors.layers = function () { const out = L(); this.list.filter(v => v.def.id === 'snowwhite' && v.k > .5).forEach(v => out.push({ y: v.y + .3, draw: c => { const s = this.scale(v); for (let i = 0; i < 2; i++) { const a = NX.time * 2.2 + i * Math.PI, bx = v.x + Math.cos(a) * 14 * s, by = v.y - 44 * s - 6 + Math.sin(a * 1.7) * 6, f = Math.floor(NX.time * 10 + i) % 2; NX.px.rect(c, bx - 2, by, 4, 2, '#7ad0ff'); NX.px.rect(c, bx - (f ? 4 : 3), by - (f ? 2 : 0), 2, 1, '#bff0ff'); NX.px.rect(c, bx + (f ? 2 : 1), by - (f ? 2 : 0), 2, 1, '#bff0ff'); NX.px.rect(c, bx + 2, by, 1, 1, '#ffc94d'); } } })); return out; }; })();
