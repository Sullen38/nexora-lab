/* ============================================================================
 * objects/ai_desk.js — СТІЛ AI-ЦЕНТРУ: СТІЛЬНИЦЯ В ПЕРСПЕКТИВІ НА ПРОЗОРИХ СИСТЕМНИКАХ
 * ----------------------------------------------------------------------------
 * За зауваженнями власника:
 *   - стільниця в перспективі "до іншого стола": передній край іде від (34, 300)
 *     до стику зі столом аналітики (315, 283); задній край — під великим екраном
 *     (екран СТОЇТЬ на столі: низ екрана = задній край стільниці, між ними нічого)
 *   - замість ніжок — два ПРОЗОРІ СИСТЕМНИКИ, що працюють: скляний корпус,
 *     усередині плата, пам'ять, кільце кулера, що крутиться, LED-смужки, що біжать
 *   - Рудик зі своєю базою — окремо, НИЖЧЕ стола (objects/cat_corner.js)
 * Геометрія (одиниці кімнати):
 *   стільниця: 4 кути — лв (34, 300-5), пв (315, 283-4), пн (315, 283), лн (34, 300)
 *   передня плита: товщина 7 (рожевий неон), торець під кутом
 *   системники: лівий x 44..84, правий x 236..286; від низу плити до підлоги (клин 375→352)
 * Малюється NX.furn.Sheet (4 px/од.) один раз; живе — щокадру поверх.
 * API: NX.aiDesk.top(x) — висота заднього краю стільниці в x (туди стає Nexi).
 * ========================================================================== */
(() => {
  const P = NX.px, F = NX.furn, { NAVY, PINK, CHROME, CYAN } = F.PAL, ramp = F.ramp, hash = NX.art.hash;
  const rgba = (rgb, a) => `rgba(${rgb},${P.clamp(a, 0, 1)})`, lit = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
  const L = 34, R = 315, DEPTH = 6;                        // ширина стола, видима глибина стільниці
  const front = x => 300 - (x - L) * 17 / (R - L);         // передній край стільниці (300 -> 283)
  const back = x => front(x) - DEPTH + (x - L) * 1.5 / (R - L);   // задній край (трохи вужче вдалині)
  const slab = x => front(x) + 7;                          // низ плити
  const bot = x => 375 - (x - L) * 23 / (R - L);           // підлога під столом (клин)
  const PC = [{ x0: 44, x1: 86, hue: '59,232,255' }, { x0: 232, x1: 284, hue: '255,79,216' }];   // прозорі системники
  const SL = ['#3a0e5b', '#4d0d6e', '#5b0775', '#6d058a', '#850498', '#ac14b9', '#b317bd', '#cb53cb', '#e07ae0'];
  const SW = ['#5a1440', '#8e286a', '#a52174', '#c32988', '#d73f90', '#e45f8c', '#ee7aa4', '#f6a0c0', '#ffc8dc'];
  const GL = ['#0a1a3a', '#10264e', '#163466', '#1e4480', '#2a5a9c'];                               // скло корпусу
  const mix = (a, b, k) => { if (k <= 0) return a; if (k >= 1) return b; const A = [1, 3, 5].map(i => parseInt(a.slice(i, i + 2), 16)), B = [1, 3, 5].map(i => parseInt(b.slice(i, i + 2), 16)); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join(''); };

  function build() {
    const S = F.Sheet(L - 2, 270, R + 2, 382), o = '#060313';
    // --- системники: прозорий корпус з рамкою, усередині плата/пам'ять/кабелі (статична частина)
    PC.forEach(({ x0, x1 }) => {
      S.poly([[x0, slab(x0)], [x1, slab(x1)], [x1, bot(x1)], [x0, bot(x0)]], (u, v, i, j, X, Y) => {
        const yt = slab(X), yb = bot(X), d = (Y - yt) / (yb - yt), du = X - x0, dw = x1 - X;
        if (du < .6 || dw < .6 || d < .02 || d > .985) return o;
        if (du < 1.8 || dw < 1.8 || d < .06 || d > .95) return ramp(CHROME, .55 - v * .3, i, j);            // рамка
        if (Y > yb - 4) return Y > yb - 1.4 ? o : CHROME[2];                                                 // ніжки-планка
        // скло: напівтемне синє, усередині плата (темно-зелена з доріжками), слоти пам'яті, чіп
        let col = ramp(GL, .35 - d * .25 + (du < 6 ? .25 : 0), i, j, .12);
        const inner = du > 5 && dw > 5 && d > .12 && d < .9;
        if (inner) {
          const bx = du - 5, by = (Y - yt) - (yb - yt) * .12, bw = (x1 - x0) - 10;
          if (bx > bw - 7) col = ((by % 6) < 2.4) ? '#0c3a2a' : '#082a1e';                                       // вертикальна плата справа
          else if (by > 6 && by < 12 && bx > 3 && bx < bw - 10) col = ((bx % 4) < 2) ? '#1a7a5a' : '#0e4a36';   // планки пам'яті
          else if (by > 22 && by < 34 && bx > 6 && bx < 20) col = '#101624';                                     // чіп-процесор (під кулером)
          else if (((bx * 2.3 + by * .7) % 9) < .9) col = '#15563f';                                              // доріжки
          else col = ramp(['#06231a', '#0a3326', '#0e4030'], .4 + Math.sin(by * .4) * .1, i, j, .1);
          col = mix(col, GL[2], .25);                                                                             // крізь скло
        }
        if (Math.abs(du - 3.2) < .5 && d > .1 && d < .9) col = CHROME[4];                                        // блік скла
        return col;
      });
    });
    // --- низ стільниці між системниками: тінь
    S.poly([[L, slab(L)], [R, slab(R)], [R, slab(R) + 1.5], [L, slab(L) + 1.5]], o);
    // --- видимий верх стільниці (паралелограм у перспективі)
    S.poly([[L + 2, back(L + 2)], [R, back(R)], [R, front(R)], [L, front(L)]], (u, v, i, j, X, Y) => {
      const glow = Math.max(0, 1 - Math.abs(X - 150) / 95);
      if (Y < back(X) + .5) return o;
      if (glow > 0) return ramp(['#0a0a30', '#0e1450', '#122070', '#183090', '#2244b0', '#3060cc'], .15 + glow * .6 * (1 - v * .5) + v * .15, i, j, .12);
      return ramp(['#0b0730', '#120a36', '#1c0a3c', '#2b0c40', '#43123f', '#612758'], .1 + v * .75, i, j, .12);
    });
    // --- плита: світла кромка, рожевий перелив
    S.poly([[L, front(L)], [R, front(R)], [R, slab(R)], [L, slab(L)]], (u, v, i, j, X, Y) => {
      const k = P.clamp((X - 228) / 70, 0, 1), dy = Y - front(X);
      if (X < L + .6 || X > R - .6) return o;
      if (dy < 1.1) return k > .5 ? '#ffe2ee' : '#ffd4ff';
      if (dy < 1.8) return k > .5 ? SW[7] : SL[8];
      const q = 1 - (dy - 1.8) / 5.2, n = SL.length - 1, idx = P.clamp(Math.round(q * .95 * n + NX.art.BAYER[(j & 3) * 4 + (i & 3)] * .9), 0, n);
      return mix(SL[idx], SW[idx], k);
    });
    // --- правий торець плити (до стола аналітики — тонкий)
    S.poly([[R - .3, front(R)], [R + 2, front(R) - 1], [R + 2, slab(R) - 1], [R - .3, slab(R)]], (u, v) => v < .15 ? SW[7] : SW[2]);
    return S;
  }
  let SH = null;
  NX.aiDesk = NX.addObject({
    id: 'aiDesk', L, R, front, back, slab, bot,
    top(x) { return back(P.clamp(x, L, R)); },
    layers(t) { return [{ y: 281, draw: c => this.draw(c, t) }]; },
    draw(c, t) {
      if (!SH) { SH = build(); SH.cv = SH.canvas(); }
      const Rr = F.res(), act = NX.objects.aiPc && NX.objects.aiPc.active ? 1 : 0;
      c.save(); c.imageSmoothingEnabled = Rr < 3.8;
      c.drawImage(F.fit(SH.cv, SH.x1 - SH.x0, SH.y1 - SH.y0, Rr), SH.x0, SH.y0, SH.x1 - SH.x0, SH.y1 - SH.y0);
      c.globalCompositeOperation = 'lighter';
      // неон кромки + бігуча іскра
      c.strokeStyle = rgba('255,79,216', .28 + .16 * Math.sin(t * 2.2) + act * .18); c.lineWidth = 1.4; c.beginPath(); c.moveTo(L + 1, front(L) + .9); c.lineTo(R - 1, front(R) + .9); c.stroke();
      const sx = L + ((t * .22) % 1) * (R - L); c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 1; c.beginPath(); c.moveTo(sx - 7, front(sx - 7) + 1); c.lineTo(sx + 7, front(sx + 7) + 1); c.stroke();
      // системники працюють: кулер крутиться, LED-смужка біжить, підсвітка всередині дихає
      PC.forEach(({ x0, x1, hue }, n) => {
        const cx = x0 + 18, yt = slab(x0 + 18), yb = bot(x0 + 18), cy = yt + (yb - yt) * .44, rr = 6;
        c.fillStyle = rgba(hue, .07 + .05 * Math.sin(t * 1.5 + n)); c.fillRect(x0 + 2, yt + 2, x1 - x0 - 4, yb - yt - 6);          // свічення всередині
        c.strokeStyle = rgba(hue, .9); c.lineWidth = 1.2; c.beginPath(); c.arc(cx, cy, rr, 0, 7); c.stroke();                       // кільце кулера
        const fa = t * (5 + act * 10); for (let b = 0; b < 7; b++) { const a = fa + b * Math.PI * 2 / 7; c.strokeStyle = rgba(hue, .75); c.beginPath(); c.moveTo(cx + Math.cos(a) * 1.5, cy + Math.sin(a) * 1.5); c.lineTo(cx + Math.cos(a + .5) * (rr - .8), cy + Math.sin(a + .5) * (rr - .8)); c.stroke(); }
        lit(c, cx - .8, cy - .8, 1.6, 1.6, '#ffffff');
        for (let k = 0; k < 10; k++) { const y = yt + 4 + k * ((yb - yt - 10) / 10), on = Math.floor(t * (6 + act * 10) + k) % 10 < 3; lit(c, x1 - 4.2, y, 1.4, 1.6, on ? '#ffffff' : rgba(hue, .5)); }   // LED-стовпчик
        const q = (t * .6 + n * .5) % 1; lit(c, x0 + 2.2, yt + 3 + q * (yb - yt - 8), x1 - x0 - 4.4, 1, rgba(hue, .35));                                   // скан-смужка
        P.glow(c, cx, cy, 16, `rgba(${hue},.8)`, .18 + act * .2);
      });
      c.restore();
    },
  });
})();
