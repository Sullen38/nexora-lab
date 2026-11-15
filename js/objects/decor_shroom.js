/* ============================================================================
 * objects/decor_shroom.js — ГРИБНИЦЯ: види, їхні ґрунти й спільний RGB-контур (чат «Кімната — правки», 15.11)
 * ----------------------------------------------------------------------------
 * Власник (15.11): «гриби всі в однотипних ґрунтах переміщаються; у них ще немає своїх карточок; калапуця з контурами —
 * зробити суцільний RGB-контур, який буде переливатися». Тут — спільне для вежі й коридору (малює objects/decor_live.js):
 *   • KINDS — 18 видів у порядку NX.arc.mushCanvas (8 природних + 10 виведених Nexi); ключі словника decor.guide.sp.shroom.*
 *     (картка довідника — objects/decor_guide.js, група shroom).
 *   • SUB / tray(c, k, t) — у кожного виду СВІЙ лоток і ґрунт: лісова підстилка, трухлява колода, хвоя, сині камінці, бамбукова
 *     мульча, пісок із мушлями, блок тирси, березове поліно; для нових видів — зоряний пісок, крига, плата, гель, бурштинові
 *     соти, мокра галька, місячний пил, лава, світний мох, білий пісок із золотом. Малюється в координатах лотка (x — уздовж,
 *     0 — верх лотка, одиниці кімнати). -> висота ґрунту (де стоїть гриб).
 *   • isle(k) — кольори острівця вежі під вид (верх, кромка, цятки).
 *   • rgb(c, t, x0, x1) — один на кадр лінійний градієнт-веселка вздовж модуля (тече до вежі); усі неонові лінії модуля
 *     (кромки фасаду, ребра вежі, нитка поруччя, цоколь) беруть його — виходить ОДИН суцільний контур, що переливається.
 * ========================================================================== */
(() => {
  const TAU = Math.PI * 2, hash = NX.art.hash;
  const KINDS = ['amanita', 'mycena', 'chanterelle', 'entoloma', 'veil', 'ramaria', 'oyster', 'hericium',
    'stardome', 'crystalcap', 'pixelcap', 'jellybell', 'lanterncap', 'spiralstem', 'moonparasol', 'firemane', 'sporeorbs', 'starbranch'];
  // sh — форма ґрунту, c — [темний, основний, світлий], sp — цятки, h — висота, g — світіння (нові види), led — вогник лотка
  const SUB = [
    { sh: 'mound', c: ['#2a1c0e', '#5a3e1c', '#3f9a3a'], sp: '#e08a2a', h: .7, led: '#ff5a4a' },      // мухомор — лісова підстилка з мохом і листям
    { sh: 'log', c: ['#24160c', '#5a3a1e', '#8a6238'], sp: '#5ad86a', h: 1.05, led: '#5ad8ff' },      // міцени — трухлява колода
    { sh: 'mound', c: ['#1c3010', '#3a6a22', '#6aa83a'], sp: '#f0a428', h: .65, led: '#ffb020' },     // лисичка — мох і хвоя
    { sh: 'rocks', c: ['#10163a', '#2a3470', '#5a6ab8'], sp: '#8ab4ff', h: .8, led: '#4470f0' },      // ентолома — сині камінці
    { sh: 'block', c: ['#5a4a22', '#a89048', '#d8c478'], sp: '#f0e8b0', h: .95, led: '#eee8d8' },     // вуаль — бамбукова мульча
    { sh: 'sand', c: ['#8a5a4a', '#d89a80', '#ffd0b8'], sp: '#ffffff', h: .6, led: '#ff7a98' },       // рамарія — рожевий пісок із мушлями
    { sh: 'block', c: ['#6a5a42', '#b8a888', '#e4d8bc'], sp: '#ff9ac0', h: 1.1, led: '#ffa0c4' },     // гливи — блок тирси
    { sh: 'log', c: ['#7a7a84', '#d8d8e0', '#ffffff'], sp: '#1a1a22', h: 1.05, led: '#f6eeda' },      // їжовик — березове поліно
    { sh: 'sand', c: ['#1c0c4a', '#4a22a8', '#7a4af0'], sp: '#eaffff', h: .6, g: '#b08aff', led: '#b08aff' },    // зоряний купол — зоряний пісок
    { sh: 'ice', c: ['#0a3a5a', '#5ad8ff', '#d8faff'], sp: '#ffffff', h: .9, g: '#5ad8ff', led: '#5ad8ff' },     // кришталик — крига
    { sh: 'plate', c: ['#06281c', '#0e6a3a', '#28b060'], sp: '#80f0a0', h: .5, g: '#38e070', led: '#38e070' },   // піксельник — плата
    { sh: 'gel', c: ['#4a0638', '#f040b0', '#ff9ae0'], sp: '#ffe0f6', h: .8, g: '#ff6ad8', led: '#ff6ad8' },     // медузник — рожевий гель
    { sh: 'block', c: ['#5a2a04', '#c06a0a', '#ffb020'], sp: '#ffe890', h: .9, g: '#ffb020', led: '#ffb020', comb: 1 },   // ліхтарник — бурштинові соти
    { sh: 'rocks', c: ['#1a2a4a', '#5a7aa8', '#c0e0f0'], sp: '#ff8ae0', h: .75, g: '#7af0ff', led: '#7af0ff' },  // спіральник — мокра галька
    { sh: 'sand', c: ['#2a3a6a', '#6a8ad0', '#b8d0ff'], sp: '#2a3a6a', h: .6, g: '#b8d0ff', led: '#b8d0ff' },    // місячна парасолька — місячний пил із кратерами
    { sh: 'rocks', c: ['#120606', '#3a1410', '#5a2018'], sp: '#ff7a3a', h: .85, g: '#ff7a3a', led: '#ff7a3a', lava: 1 },  // вогнегрив — лава
    { sh: 'mound', c: ['#04222a', '#0a5a52', '#12907c'], sp: '#b0ffe8', h: .7, g: '#3be8c8', led: '#3be8c8' },   // спорові кулі — світний мох
    { sh: 'sand', c: ['#8a8a9a', '#d8d8e8', '#ffffff'], sp: '#ffd23a', h: .6, g: '#ffe890', led: '#ffe890' },    // зоряна гілка — білий пісок із золотом
  ];
  const R = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
  /** Лоток виду k із його ґрунтом. Координати: x −2.9…2.9, y 0 — верх лотка, 1.45 — низ; ґрунт росте вгору (y < 0). */
  function tray(c, k, t) {
    const S = SUB[((k % 18) + 18) % 18], [d, m, l] = S.c, h = S.h, W = 2.6;
    R(c, -2.9, 0, 5.8, 1.45, '#0a0a18'); R(c, -2.7, .2, 5.4, .95, '#2a2a4c'); R(c, -2.7, .2, 5.4, .2, '#8a8abc'); R(c, -2.7, .95, 5.4, .2, '#16162c');   // корпус лотка: кромка, тінь
    R(c, -2.3, .52, 1.1, .3, '#06060e'); R(c, -2.2, .58, .9, .18, S.led); R(c, 1.5, .55, .28, .24, (Math.floor(t * 1.5 + k) % 4) ? '#7aff9a' : '#16162c'); R(c, 1.95, .55, .28, .24, '#3be8ff');   // табличка виду й діоди
    const sp = (n, y0, y1, w = .28, hh = .2) => { c.fillStyle = S.sp; for (let q = 0; q < n; q++) c.fillRect(-W + .25 + hash(k * 9 + q, 3) * (W * 2 - .7), y0 + hash(q, k + 5) * (y1 - y0), w, hh); };
    switch (S.sh) {
      case 'mound': c.fillStyle = d; c.beginPath(); c.moveTo(-W, .05); c.quadraticCurveTo(-W, -h * .8, -W * .4, -h * .9); c.quadraticCurveTo(0, -h * 1.12, W * .5, -h * .85); c.quadraticCurveTo(W, -h * .7, W, .05); c.closePath(); c.fill();
        c.fillStyle = m; c.beginPath(); c.moveTo(-W, -h * .25); c.quadraticCurveTo(-W, -h * .8, -W * .4, -h * .9); c.quadraticCurveTo(0, -h * 1.12, W * .5, -h * .85); c.quadraticCurveTo(W, -h * .7, W, -h * .2); c.quadraticCurveTo(0, -h * .5, -W, -h * .25); c.fill();
        c.fillStyle = l; for (let q = 0; q < 6; q++) { const x = -W + .4 + q * (W * 2 - .8) / 5; c.beginPath(); c.ellipse(x, -h * (.78 + .14 * hash(q, k)), .42, .2, 0, 0, TAU); c.fill(); } sp(5, -h * .8, -h * .3); break;
      case 'log': R(c, -W - .1, -h, W * 2 + .2, h + .05, d); R(c, -W - .1, -h + .15, W * 2 + .2, h * .5, m); R(c, -W - .1, -h + .15, W * 2 + .2, .18, l);
        c.fillStyle = d; for (let q = 0; q < 5; q++) c.fillRect(-W + .3 + q * 1.05 + hash(q, k) * .3, -h + .4, .14, h * .5);                                                   // тріщини кори
        c.fillStyle = l; c.beginPath(); c.ellipse(-W - .1, -h * .48, .34, h * .5, 0, 0, TAU); c.fill(); c.fillStyle = m; c.beginPath(); c.ellipse(-W - .1, -h * .48, .2, h * .32, 0, 0, TAU); c.fill();   // торець із кільцями
        c.fillStyle = S.sp; for (let q = 0; q < 4; q++) c.fillRect(-W + .5 + hash(q, k + 2) * (W * 2 - 1.2), k === 7 ? -h + .3 + hash(q, 9) * h * .5 : -h - .08, k === 7 ? .5 : .7, k === 7 ? .16 : .22); break;
      case 'block': R(c, -2.25, -h, 4.5, h + .05, d); R(c, -2.15, -h + .1, 4.3, h - .15, m); R(c, -2.15, -h + .1, 4.3, .2, l);
        if (S.comb) { c.fillStyle = d; for (let q = 0; q < 9; q++) c.fillRect(-2 + q * .48, -h + .42 + (q % 2) * .22, .3, .22); c.fillStyle = S.sp; for (let q = 0; q < 9; q += 2) c.fillRect(-1.93 + q * .48, -h + .46, .16, .12); }
        else { c.fillStyle = d; for (let q = 0; q < 3; q++) c.fillRect(-2.15, -h + .42 + q * .24, 4.3, .07); sp(5, -h + .3, -.25, .22, .14); } break;
      case 'rocks': R(c, -W, -.2, W * 2, .25, d); for (let q = 0; q < 5; q++) { const x = -2.1 + q * 1.05, r = .5 + hash(q, k + 3) * .22, hh = h * (.62 + .38 * hash(q, k + 7)); c.fillStyle = q % 2 ? d : m; c.beginPath(); c.moveTo(x - r, .05); c.lineTo(x - r * .7, -hh * .7); c.lineTo(x - r * .1, -hh); c.lineTo(x + r * .6, -hh * .8); c.lineTo(x + r, .05); c.closePath(); c.fill();
          c.fillStyle = l; c.beginPath(); c.moveTo(x - r * .7, -hh * .7); c.lineTo(x - r * .1, -hh); c.lineTo(x - r * .05, -hh * .55); c.closePath(); c.fill();
          if (S.lava) { c.fillStyle = S.sp; c.globalAlpha *= .6 + .4 * Math.sin(t * 2.2 + q * 1.7); c.fillRect(x - r * .1, -hh * .6, .14, hh * .55); c.fillRect(x - r * .5, -hh * .25, r * .8, .12); c.globalAlpha /= .6 + .4 * Math.sin(t * 2.2 + q * 1.7); } }
        if (!S.lava) sp(4, -h * .5, -.1, .2, .2); break;
      case 'sand': c.fillStyle = d; c.beginPath(); c.moveTo(-W, .05); c.quadraticCurveTo(-W * .6, -h * 1.05, 0, -h); c.quadraticCurveTo(W * .7, -h * .95, W, .05); c.closePath(); c.fill();
        c.fillStyle = m; c.beginPath(); c.moveTo(-W * .92, -h * .2); c.quadraticCurveTo(-W * .6, -h * 1.05, 0, -h); c.quadraticCurveTo(W * .7, -h * .95, W * .94, -h * .25); c.quadraticCurveTo(0, -h * .62, -W * .92, -h * .2); c.fill();
        c.fillStyle = l; c.beginPath(); c.ellipse(-.5, -h * .86, 1.1, .12, 0, 0, TAU); c.fill(); sp(6, -h * .8, -h * .2, .2, .16); break;
      case 'ice': c.fillStyle = d; c.beginPath(); c.moveTo(-2.3, .05); c.lineTo(-2, -h * .7); c.lineTo(-.9, -h); c.lineTo(.6, -h * .85); c.lineTo(1.9, -h); c.lineTo(2.3, .05); c.closePath(); c.fill();
        c.fillStyle = m; c.globalAlpha *= .8; c.beginPath(); c.moveTo(-2, -h * .7); c.lineTo(-.9, -h); c.lineTo(-.2, -.05); c.lineTo(-1.9, -.05); c.closePath(); c.fill(); c.beginPath(); c.moveTo(.6, -h * .85); c.lineTo(1.9, -h); c.lineTo(2.1, -.1); c.lineTo(.9, -.05); c.closePath(); c.fill(); c.globalAlpha /= .8;
        c.fillStyle = l; c.beginPath(); c.moveTo(-.9, -h); c.lineTo(.6, -h * .85); c.lineTo(.2, -h * .4); c.closePath(); c.fill(); R(c, -1.7, -h * .55, .14, h * .4, '#ffffff'); break;
      case 'plate': R(c, -2.5, -h, 5, h + .05, d); R(c, -2.4, -h + .08, 4.8, .16, l); c.fillStyle = m; for (let q = 0; q < 4; q++) { c.fillRect(-2.1 + q * 1.2, -h + .3, .9, .08); c.fillRect(-2.1 + q * 1.2 + .82, -h + .3, .08, .16); }
        c.fillStyle = S.sp; for (let q = 0; q < 5; q++) if ((Math.floor(t * 2) + q) % 5) c.fillRect(-2 + q * .98, -h * .28, .22, .16); break;
      case 'gel': c.globalAlpha *= .85; c.fillStyle = d; c.beginPath(); c.moveTo(-W, .05); c.quadraticCurveTo(-W, -h * 1.1, 0, -h); c.quadraticCurveTo(W, -h * 1.1, W, .05); c.closePath(); c.fill();
        c.fillStyle = m; c.beginPath(); c.moveTo(-W * .9, -.05); c.quadraticCurveTo(-W * .9, -h * .95, 0, -h * .88); c.quadraticCurveTo(W * .9, -h * .95, W * .9, -.05); c.closePath(); c.fill(); c.globalAlpha /= .85;
        c.fillStyle = l; c.beginPath(); c.ellipse(-.9, -h * .66, .9, .12, 0, 0, TAU); c.fill(); c.fillStyle = S.sp; for (let q = 0; q < 4; q++) { const u = (t * .25 + q * .27) % 1; c.fillRect(-1.8 + q * 1.15, -h * (.15 + .6 * u), .2, .2); } break;
    }
    if (S.g) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha *= .22 + .1 * Math.sin(t * 1.4 + k); c.fillStyle = S.g; c.beginPath(); c.ellipse(0, -h * .5, W * 1.05, h * .95, 0, 0, TAU); c.fill(); c.restore(); }   // нові види: ґрунт ледь світиться
    return h;
  }
  /** Кольори острівця вежі під вид k (8…17): [моховий диск темний, світлий, цятки, скеля темна, скеля світла]. */
  const isle = k => { const S = SUB[k]; return [S.c[0], S.c[1], S.sp, S.lava ? '#1a0808' : '#1c1838', S.lava ? '#5a2018' : S.c[0] === '#8a8a9a' ? '#5a5a7a' : '#3a3068']; };
  let G = null, GT = -1, GC = null;
  /** Градієнт-веселка вздовж модуля (x0…x1 — екран, од. кімнати): два оберти кольору, тече ліворуч до вежі. Один на кадр. */
  function rgb(c, t, x0, x1) {
    if (G && GT === t && GC === c) return G; G = c.createLinearGradient(x0, 0, x1, 0); GT = t; GC = c;
    for (let k = 0; k <= 14; k++) G.addColorStop(k / 14, `hsl(${(((k / 14 * 720 + t * 42) % 360) + 360) % 360},100%,${k % 2 ? 60 : 64}%)`);
    return G;
  }
  NX.shroom = { KINDS, SUB, tray, isle, rgb };
})();
