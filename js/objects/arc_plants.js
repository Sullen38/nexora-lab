/* ============================================================================
 * objects/arc_plants.js — РОСЛИНИ Й КВІТИ КРИЛ «ПО ДУЗІ» (NX.arc.plant)
 * ----------------------------------------------------------------------------
 * Листя — кодом через NX.kit.plant (монстера, папороть, арека, сансев'єра, ліана, неонова, бонсай) — без горщика:
 * горщик кожної рослини — справжній 3D-циліндр (objects/arc_scene.js), а листя — плаский спрайт над ним, лицем до
 * глядача (рослини приблизно однакові з усіх боків). Квіти (bloom) — піксельні суцвіття на верхніх кінчиках листя:
 * п'ятипелюсткові з серединкою, кольори з розкладки. Фіолетове листя (leaf) — перефарбування зеленого.
 *   KIND                 — яка рослина в якому вазоні (за id предмета розкладки; інакше — за розміром)
 *   plant(B, R)          — спрайт {img: {d, w, h} для NX.px3d.sprite, hang, kind} (кеш за видом і розміром)
 *   POTS                 — вазони: палітра й обідок (теракота, кераміка, navy з неоном, хром, золото)
 * ========================================================================== */
NX.arc = NX.arc || {};
(() => {
  const K = NX.kit, X = NX.px3d, hash = NX.art.hash;
  // вид рослини й вазон для кожного предмета розкладки (ліве крило — домашнє: теракота, кераміка, квіти; праве — технологічне)
  const KIND = {
    mk_plant1: ['fern', 'terra'], mk_plant2: ['flower', 'ceramPink'], mk_standPot: ['monstera', 'ceram'],
    an_plantTop: ['palm', 'navy'], an_potL: ['monstera', 'terra'],
    sh_ivy: ['vine', 'ceram'], sh_flowers: ['flower', 'terra'], sh_succ: ['succ', 'ceramLil'], sh_flowers2: ['flower', 'ceramPink'],
    ai_potF: ['flower', 'terra'], ai_fern: ['fern', 'ceram'], ai_potBL: ['sansevieria', 'terra'], ai_potUnder: ['fern', 'ceramLil'],
    wsi0_0: ['vine', 'terra'], wsi0_2: ['flower', 'ceramPink'], wsi0_4: ['bonsai', 'ceram'], wsi0_5: ['vine', 'ceramLil'],
    wsi1_0: ['flower', 'terra'], wsi1_2: ['vine', 'ceram'], wsi1_3: ['fern', 'terra'],
    ws_colPlant: ['fern', 'navy'], ws_potBL: ['sansevieria', 'navy'], tl_plantTop: ['sansevieria', 'chrome'], tl_standPlant: ['succ', 'chrome'],
    tl_potR: ['palm', 'navy'], pt_gold: ['fern', 'gold'], pt_plantR: ['monstera', 'navy'],
    mz_pot0: ['fern', 'navy'], mz_pot1: ['monstera', 'chrome'], mz_pot2: ['palm', 'navy'], mz_fern: ['fern', 'navy'],
  };
  /** Вазони: палітра циліндра й обідок (неон / світла кромка). */
  const P = NX.arc.kit.PAL, pl = X.pal;
  const POTS = {
    terra: { pal: pl(['#1e0c12', '#2e141a', '#421c22', '#58262a', '#703232', '#8a4038', '#a45244', '#be6a52']), rim: '#d88a6a', soil: 1, band: '#ffb08a' }, ceram: { pal: pl(['#1e1a3a', '#2c2650', '#3e366a', '#544a88', '#6e62a6', '#8a80c2', '#aaa2da', '#cec8ee']), rim: '#e8e4ff', soil: 1, band: '#7af4ff' }, ceramPink: { pal: pl(['#2a0a2a', '#401040', '#5a1a58', '#782672', '#98348c', '#b848a6', '#d466c0', '#ec90d8']), rim: '#ffc2ec', soil: 1, band: '#ffe27a' },
    ceramLil: { pal: pl(['#1e1640', '#2e2260', '#40307e', '#56429c', '#7058b8', '#8e74d0', '#b098e6']), rim: '#d8c8ff', soil: 1, band: '#ff9af0' },
    navy: { pal: P.NAVY, rim: '#ff4fd8', neon: 1, soil: 1 }, chrome: { pal: P.CHROME, rim: '#eef2ff', soil: 1 }, gold: { pal: P.GOLD, rim: '#fff2c4', soil: 1 },
  };
  const CACHE = new Map();
  /** Піксельні квіти на верхніх кінчиках листя спрайта (полотно 4 px/од.). cols — кольори пелюсток. */
  function blooms(cv, cols, seed, n) {
    const c = cv.getContext('2d', { willReadFrequently: true }), w = cv.width, h = cv.height, d = new Uint32Array(c.getImageData(0, 0, w, h).data.buffer), top = [];
    for (let x = 2; x < w - 2; x++) for (let y = 0; y < h * .72; y++) if ((d[y * w + x] >>> 24) > 100) { top.push([x, y]); break; }
    if (!top.length) return;
    const k = Math.max(3, Math.round(w / 40)), picks = [];
    for (let q = 0; q < n * 4 && picks.length < n; q++) {
      const p = top[Math.floor(hash(seed, q) * top.length)]; if (picks.some(o => Math.hypot(o[0] - p[0], o[1] - p[1]) < k * 3.2)) continue; picks.push(p);
    }
    picks.forEach(([x, y], q) => {
      const colr = cols[q % cols.length], r = k * (.9 + .4 * hash(seed, q + 7)), cx = x, cy = y + r * .4;
      c.fillStyle = '#2a0a26'; for (let a = 0; a < 5; a++) { const an = a / 5 * Math.PI * 2 + q; c.beginPath(); c.arc(cx + Math.cos(an) * r * .78, cy + Math.sin(an) * r * .78, r * .62, 0, 7); c.fill(); }
      c.fillStyle = colr; for (let a = 0; a < 5; a++) { const an = a / 5 * Math.PI * 2 + q; c.beginPath(); c.arc(cx + Math.cos(an) * r * .7, cy + Math.sin(an) * r * .7, r * .5, 0, 7); c.fill(); }
      c.fillStyle = 'rgba(255,255,255,.55)'; for (let a = 0; a < 5; a++) { const an = a / 5 * Math.PI * 2 + q; c.fillRect(cx + Math.cos(an) * r * .82 - r * .14, cy + Math.sin(an) * r * .82 - r * .2, r * .26, r * .22); }
      c.fillStyle = '#ffe27a'; c.beginPath(); c.arc(cx, cy, r * .34, 0, 7); c.fill(); c.fillStyle = '#c87a1a'; c.fillRect(cx - r * .1, cy + r * .06, r * .22, r * .2);
    });
  }
  /** Перефарбувати зелене листя у фіолетове (сукулент, неонова рослина праворуч). */
  function tint(cv, ramp) {
    const c = cv.getContext('2d', { willReadFrequently: true }), im = c.getImageData(0, 0, cv.width, cv.height), d = im.data, R = ramp.map(h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)));
    for (let i = 0; i < d.length; i += 4) { if (!d[i + 3]) continue; const g = d[i + 1], l = (d[i] + g + d[i + 2]) / 3; if (g < d[i] + 6 || g < d[i + 2] - 30) continue; const k = Math.min(R.length - 1, Math.round(Math.min(1, g / 200) * (R.length - 1))); d[i] = R[k][0]; d[i + 1] = R[k][1]; d[i + 2] = R[k][2]; }
    c.putImageData(im, 0, 0);
  }
  /** Спрайт листя предмета B (fw × fh од. світу). */
  function plant(B) {
    const [kind0, pot] = KIND[B.id] || (B.hangs ? ['vine', 'terra'] : B.bloom ? ['flower', 'terra'] : B.fh > 40 ? ['monstera', 'terra'] : ['fern', 'terra']);
    let kind = B.hangs ? 'vine' : kind0;
    const w = Math.max(6, Math.round(B.fw)), h = Math.max(6, Math.round(B.fh)), seed = Math.round(Math.abs(B.x * 7.3 + B.z * 3.1)) % 97 + 1, key = [kind, w, h, seed, (B.bloom || []).join()].join('|');
    let sp = CACHE.get(key);
    if (!sp) {
      const base = kind === 'flower' ? 'sansevieria' : kind === 'succ' ? 'neon' : kind;
      const spec = { kind: base, w, h, pot: 'none', potH: 1, seed, hang: kind === 'vine', pal: kind === 'flower' ? 'light' : kind === 'succ' ? 'neon' : 'green',
        leaves: kind === 'flower' ? 9 : kind === 'vine' ? Math.max(3, Math.round(w / 6)) : kind === 'palm' ? 8 : kind === 'fern' ? 9 : kind === 'monstera' ? 7 : kind === 'succ' ? 8 : 6 };
      const s = K.plant(spec);
      if (kind === 'succ' || (B.leaf && B.leaf.length)) tint(s.cv, ['#1a0a30', '#2e1450', '#4a2478', '#6a3aa0', '#8a4ac0', '#b07ae0', '#d8b0ff']);
      if (kind === 'flower' || B.bloom) blooms(s.cv, B.bloom || ['#ff7ad0', '#ffd27a', '#ff9af0'], seed, Math.max(3, Math.round(w / 6)));
      sp = { img: X.imgData(s.cv), hang: !!s.hang, kind, potTop: s.potTop, w, h }; CACHE.set(key, sp);
    }
    return sp;
  }
  NX.arc.plant = plant; NX.arc.POTS = POTS; NX.arc.KIND = KIND;
  NX.arc.potOf = B => POTS[(KIND[B.id] || [])[1]] || (B.st === 'gold' ? POTS.gold : POTS.terra);
})();
