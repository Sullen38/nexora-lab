/* ============================================================================
 * objects/decor_light.js — ДЕНЬ / НІЧ: годинник доби й світло декору (Декор стін · 23)
 * ----------------------------------------------------------------------------
 * NX.daylight — спільний годинник доби для всієї кімнати (щоб вікно, місто й основа кімнати — чат дизайну — жили за тим самим часом):
 *   NX.daylight.v()  -> 0..1: 1 — день (9:00–18:00 за годинником пристрою), 0 — ніч (21:00–6:00), між ними — світанок / сутінки плавно;
 *   NX.daylight.set(v | null) — підмінити (перевірки); адреса #day / #night / #dusk — підміна з адреси, #cycle — повний цикл за 4 хв
 *   (для знімків і показу). NX.daylight.name() -> 'day' | 'dusk' | 'night' | 'dawn'.
 * Світло декору (тут; малює objects/decor_live.js draw наприкінці, 'lighter'): що темніше, то більше світять джерела на стінах —
 * світло з-під кришки рифу лягає на цеглу, колона медузарію сяє ореолом, фітолампи теплиці заливають стіну рожево-фіолетовим,
 * неонова вивіска й неони сот дають ореоли, сховище насіння — холодний іній; ліхтар, гриб і конуси світильників (decor.js GLOWS,
 * decor_live.js CONES / MOTES) яскравішають через NX.decorLight.k(). Удень — усе як було (базовий рівень), ореолів майже нема.
 * Зони не чіпаємо: ореоли — світло поверх (як конуси · 5 і сяйво маячка), decor_check їх не рахує.
 * ========================================================================== */
(() => {
  const hash = NX.art.hash;
  let OVR = null; const H = location.hash || '';
  if (/#day\b/.test(H)) OVR = 1; else if (/#night\b/.test(H)) OVR = 0; else if (/#dusk\b/.test(H)) OVR = .45;
  const CYCLE = /#cycle\b/.test(H);
  const clock = () => { const d = new Date(), h = d.getHours() + d.getMinutes() / 60; if (h >= 9 && h <= 18) return 1; if (h >= 21 || h <= 6) return 0; return h < 9 ? (h - 6) / 3 : 1 - (h - 18) / 3; };
  NX.daylight = {
    v(t = NX.time) { if (OVR != null) return OVR; if (CYCLE) return .5 + .5 * Math.cos(t / 240 * Math.PI * 2); return clock(); },
    set(v) { OVR = v == null ? null : Math.max(0, Math.min(1, v)); },
    name(t) { const v = this.v(t); if (v >= .85) return 'day'; if (v <= .15) return 'night'; const h = new Date().getHours(); return OVR != null || CYCLE ? 'dusk' : h < 12 ? 'dawn' : 'dusk'; },
  };
  const DC = NX.decor, X = NX.px3d; if (!DC) return;
  const GL = {}; const glow = (hex, n = 48) => { if (GL[hex]) return GL[hex]; const cv = document.createElement('canvas'); cv.width = cv.height = n; const c = cv.getContext('2d'), g = c.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2);
    g.addColorStop(0, hex + 'e0'); g.addColorStop(.4, hex + '60'); g.addColorStop(1, hex + '00'); c.fillStyle = g; c.fillRect(0, 0, n, n); return GL[hex] = cv; };
  let SRC = null;
  /** Джерела світла на стінах (екран): [{x, y, rx, ry, col, a — сила вночі, ph}] — з масок акваріумів і коробок предметів. */
  function sources() {
    if (SRC) return SRC; SRC = []; const MK = DC.MK;
    const box = id => { const B = DC.byId[id]; if (!B) return null; const { P } = NX.arc.kit.basis(B); let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      for (const u of [-B.w / 2, B.w / 2]) for (const v of [0, B.dep]) for (const y of [B.yt, B.yb]) { const q = X.proj(P(u, v, y)); x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); } return [x0, y0, x1, y1]; };
    if (MK.reef) { const M = MK.reef; SRC.push({ x: M.x + M.w / 2, y: M.y + M.h * .9, rx: M.w * .62, ry: M.h * .45, col: '#3be8ff', a: .26, ph: 0 }, { x: M.x + M.w / 2, y: M.y + M.h * .15, rx: M.w * .5, ry: M.h * .3, col: '#9af6ff', a: .18, ph: 1 }); }
    if (MK.jelly) { const M = MK.jelly; SRC.push({ x: M.x + M.w / 2, y: M.y + M.h / 2, rx: M.w * 1.6, ry: M.h * .62, col: '#d94bff', a: .3, ph: 2, hue: 1 }); }
    if (MK.farm) { const M = MK.farm; SRC.push({ x: M.x + M.w / 2, y: M.y + M.h * .95, rx: M.w * .55, ry: M.h * .42, col: '#ff4fd8', a: .24, ph: 3 }, { x: M.x + M.w * .5, y: M.y + M.h * .35, rx: M.w * .45, ry: M.h * .35, col: '#c86aff', a: .14, ph: 4 }); }
    const nb = box('dc_neon'); if (nb) SRC.push({ x: (nb[0] + nb[2]) / 2, y: (nb[1] + nb[3]) / 2, rx: (nb[2] - nb[0]) * .9, ry: (nb[3] - nb[1]) * .9, col: '#ff4fd8', a: .26, ph: 5 });
    const vb = box('dc_vault'); if (vb) SRC.push({ x: (vb[0] + vb[2]) / 2, y: (vb[1] + vb[3]) / 2, rx: (vb[2] - vb[0]) * .7, ry: (vb[3] - vb[1]) * .9, col: '#9af6ff', a: .16, ph: 6 });
    for (let q = 0; q < 10; q++) { const B = DC.byId['dc_hx' + q]; if (!B || !B.dc || !B.dc.neon) continue; const { P } = NX.arc.kit.basis(B), p = X.proj(P(0, B.dep * .2, (B.yt + B.yb) / 2)); SRC.push({ x: p[0], y: p[1], rx: B.w * .9, ry: B.w * .8, col: B.dc.neon, a: .14, ph: 7 + q }); }
    const pb = box('dc_poster1'); if (pb) SRC.push({ x: (pb[0] + pb[2]) / 2, y: (pb[1] + pb[3]) / 2, rx: (pb[2] - pb[0]) * .75, ry: (pb[3] - pb[1]) * .75, col: '#ff9a3a', a: .14, ph: 20 });
    return SRC;
  }
  const JEL = [[255, 90, 220], [160, 90, 255], [70, 200, 255], [255, 90, 220]];
  NX.decorLight = {
    /** Множник яскравості джерел декору (ліхтар, гриб, конуси, світлячки): 1 удень … 1.7 уночі. */
    k(t) { return 1 + .7 * (1 - NX.daylight.v(t)); },
    /** Ореоли джерел на стінах — лише коли темніє. */
    draw(c, t, vx0, vx1) {
      const n = 1 - NX.daylight.v(t); if (n < .02 || !DC.MK.reef && !DC.MK.farm) return;
      c.save(); c.globalCompositeOperation = 'lighter'; c.imageSmoothingEnabled = true;
      for (const s of sources()) { if (s.x + s.rx < vx0 || s.x - s.rx > vx1) continue;
        let col = s.col; if (s.hue) { const hue = (t / 22) % 1, i = Math.floor(hue * 3), f = hue * 3 - i, C = JEL[i].map((v, k) => Math.round(v + (JEL[i + 1][k] - v) * f)); col = '#' + C.map(v => v.toString(16).padStart(2, '0')).join(''); }   // як світлове шоу медузарію
        const br = .88 + .12 * Math.sin(t * (.7 + .1 * (s.ph % 3)) + s.ph); c.globalAlpha = s.a * n * n * br;
        c.drawImage(glow(col), s.x - s.rx, s.y - s.ry, s.rx * 2, s.ry * 2); }
      c.restore();
    },
    sources,
  };
})();
