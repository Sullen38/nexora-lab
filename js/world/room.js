/* ============================================================================
 * world/room.js — КІМНАТА (робоча зона Nexi)
 * ----------------------------------------------------------------------------
 * Шари кімнати:
 *   1. assets/room.webp — головна картинка-кімната (1536×368). Це НЕ просто
 *      фон: на ній стоять точки взаємодії (core/config.js → POI), і Nexi
 *      ходить по її підлозі, сідає на її диван, злітає на її стіл.
 *   2. Стеля (y < 0) — добудовується кодом під висоту екрана.
 *   3. Передня підлога (y > 368) — продовження тієї ж глянцевої підлоги:
 *      нижні рядки картинки тягнуться вниз, тому шву між ними не видно.
 * Частини, що вже повністю намальовані кодом (панорамне вікно з містом), з картинки не малюються:
 * world/cityscape.js задає NX.room.pieces — прямокутники картинки, які ще потрібні.
 * Межі, де можна ходити, повертає walkBounds(); меблі на підлозі (obj.foot) Nexi й кіт обходять — route().
 * ========================================================================== */
NX.room = {
  img: new Image(), ceil: null, front: null,
  /** Скільки пікселів картинки на 1 одиницю кімнати (картинка 3072×736 -> RS = 2: удвічі чіткіше). */
  get RS() { return (this.img.naturalWidth || NX.cfg.ROOM_W) / NX.cfg.ROOM_W; },
  load(src) { return new Promise(r => { this.img.onload = r; this.img.src = src; }); },

  /** Перебудова добудованих шарів (на старті та при зміні розміру вікна). */
  build() {
    const { ROOM_W: W, ROOM_H: H } = NX.cfg, { top, front } = NX.cam, P = NX.px;
    // ---------- стеля ----------
    this.ceil = document.createElement('canvas'); this.ceil.width = W; this.ceil.height = top + 2;
    let c = this.ceil.getContext('2d');
    let g = c.createLinearGradient(0, 0, 0, top); g.addColorStop(0, '#02030c'); g.addColorStop(1, '#0c1236'); c.fillStyle = g; c.fillRect(0, 0, W, top + 2);
    P.rect(c, 0, top - 12, W, 6, '#141c52'); P.rect(c, 0, top - 12, W, 1, '#2a3a8a');                 // балка
    for (let x = 24; x < W; x += 128) {                                                               // неонові трубки
      const col = (x / 128 | 0) % 2 ? '#d94bff' : '#3be8ff';
      P.rect(c, x + 30, 0, 1, top - 26, '#1a2260'); P.rect(c, x + 92, 0, 1, top - 26, '#1a2260');
      P.rect(c, x + 26, top - 27, 70, 3, col); P.glow(c, x + 61, top - 26, 40, col === '#3be8ff' ? 'rgba(59,232,255,.35)' : 'rgba(217,75,255,.35)');
    }
    for (let x = 80; x < W; x += 260) {                                                               // кабелі, що провисають
      c.strokeStyle = '#0f1640'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, top - 6); c.quadraticCurveTo(x + 65, top + 4, x + 130, top - 6); c.stroke();
    }
    // ---------- передня підлога: ПРОДОВЖЕННЯ тієї ж підлоги з картинки ----------
    // 1) останні рядки картинки розтягуємо вниз — кольори й відблиски тягнуться без шву
    // 2) віддзеркалення кімнати в глянці, 3) темніє з глибиною, 4) плитка зі швами — її запікає сюди world/floor_tiles.js
    //    через NX.room.frontFx (щокадру нічого не коштує). Полотно — FR px на одиницю (1).
    this.front = document.createElement('canvas'); this.front.width = W * this.FR; this.front.height = (front + 2) * this.FR;
    this.frontFrom(this.img, 0, W);
    this.patches.forEach(p => this.frontFrom(p.src, p.x0, p.x1));                                    // перемальовані частини (крила в 3D, місто, рама — objects/arc_scene.js)
  },
  patches: [], FR: 1, frontFx: null, pieces: null,                                    // pieces — які частини картинки ще малювати (вікно вже кодом: world/cityscape.js)
                                                                  // FR 2 px/од. подвоював час кадру (велике полотно щокадру) — лишаємо 1
  /** Передня підлога для стовпчиків x0..x1 з джерела src (картинка кімнати або її перемальована копія того ж розміру). */
  frontFrom(src, x0, x1) {
    const { ROOM_W: W, ROOM_H: H } = NX.cfg, FR = this.FR, front = this.front.height / FR - 2, RS = this.RS, c = this.front.getContext('2d');
    c.setTransform(FR, 0, 0, FR, 0, 0);
    c.save(); c.beginPath(); c.rect(x0, 0, x1 - x0, front + 2); c.clip(); c.clearRect(x0, 0, x1 - x0, front + 2);
    c.drawImage(src, 0, (H - 4) * RS, W * RS, 4 * RS, 0, 0, W, front + 2);
    const ref = Math.min(front, 240);
    c.save(); c.globalAlpha = .26; c.scale(1, -1); c.drawImage(src, 0, (H - ref - 14) * RS, W * RS, ref * RS, 0, -ref, W, ref); c.restore();
    let g = c.createLinearGradient(0, 0, 0, front); g.addColorStop(0, 'rgba(10,6,34,0)'); g.addColorStop(.18, 'rgba(10,6,34,.35)'); g.addColorStop(.75, 'rgba(6,6,26,.9)'); g.addColorStop(1, 'rgba(4,5,20,1)');
    c.fillStyle = g; c.fillRect(0, 0, W, front + 2);
    if (this.frontFx) { c.save(); c.translate(0, -H); this.frontFx(c, x0, x1, front); c.restore(); }   // плитка (у координатах кімнати)
    c.restore(); c.setTransform(1, 0, 0, 1, 0, 0);
  },
  /** Об'єкт, що перемалював частину кімнати, віддає її копію: передня підлога (продовження й глянцеве
   *  віддзеркалення) для стовпчиків x0..x1 будується вже з неї — без "привидів" старої картинки. */
  patchFront(src, x0, x1) { this.patches = this.patches.filter(p => p.x0 !== x0); this.patches.push({ src, x0, x1 }); if (this.front) this.frontFrom(src, x0, x1); },

  draw(c, t) {
    const { ROOM_H: H } = NX.cfg, { top } = NX.cam;
    c.drawImage(this.ceil, 0, -top);
    if (this.pieces) { const RS = this.RS; this.pieces.forEach(([x0, y0, x1, y1]) => c.drawImage(this.img, x0 * RS, y0 * RS, (x1 - x0) * RS, (y1 - y0) * RS, x0, y0, x1 - x0, y1 - y0)); }
    else c.drawImage(this.img, 0, 0, NX.cfg.ROOM_W, NX.cfg.ROOM_H);
    const g = c.createLinearGradient(0, 0, 0, 22); g.addColorStop(0, 'rgba(12,18,54,.9)'); g.addColorStop(1, 'rgba(12,18,54,0)'); c.fillStyle = g; c.fillRect(0, 0, NX.cfg.ROOM_W, 22);
    c.drawImage(this.front, 0, H, NX.cfg.ROOM_W, this.front.height / this.FR);
  },

  /** Де можна ходити (прямокутник підлоги). */
  walkBounds() { return { minX: 26, maxX: NX.cfg.ROOM_W - 26, minY: NX.cfg.FLOOR_Y + 6, maxY: NX.cfg.ROOM_H + NX.cam.front - 24 }; },
  /** Точка підлоги, куди можна стати: у межах підлоги й не всередині меблів (obstacles). */
  clampWalk(x, y, who) {
    const b = this.walkBounds(); x = NX.px.clamp(x, b.minX, b.maxX); y = NX.px.clamp(y, b.minY, b.maxY);
    return this.freeAt(x, y, who);
  },

  /* ---------------- ПЕРЕШКОДИ Й ОБХІД (власник, 29.10: «Nexi не має ходити по верху об'єктів») ----------------
   * Кожен об'єкт може сказати, де він стоїть на підлозі: foot — прямокутник [x0, x1, y0, y1] (або масив таких) у
   * координатах кімнати, y — рівень ніг (більше — ближче до глядача). Диван, куточок кота, крісло маркетингу… Хода
   * (nexi.js, cat.js) іде не навпростець, а route(): найкоротшим шляхом через кути розширених слідів (граф видимості).
   * Запас — на півширини персонажа, щоб не «влізти» в бік меблів. Задні кути зазвичай за межами підлоги (меблі
   * стоять від стіни), тож обхід — спереду, як ходять люди. */
  obstacles(who) {
    const cat = who === 'cat', fr = NX.loop && NX.loop.frames, C = this._obs || (this._obs = {}), key = cat ? 'cat' : 'nexi';
    if (C[key] && C[key].fr === fr && fr !== undefined) return C[key].list;                 // за кадр рахуємо раз (м'ячик питає щокадру)
    const px = cat ? 6 : 13, out = []; C[key] = { fr, list: out };
    for (const id in NX.objects) {
      const o = NX.objects[id]; if (cat && o.catOk) continue;                          // свій куточок коту не заважає
      const f = o.foot; if (!f) continue;
      (Array.isArray(f[0]) ? f : [f]).forEach(r => out.push([r[0] - px, r[1] + px, r[2] - 3, r[3] + (cat ? 3 : 4)]));
    }
    return out;
  },
  /** Якщо точка всередині сліду — на найближчу його сторону (ліву, праву, передню; задню — якщо вона на підлозі). */
  freeAt(x, y, who) {
    const b = this.walkBounds(), R = this.obstacles(who), ok = (p, q) => p >= b.minX && p <= b.maxX && q >= b.minY && q <= b.maxY;
    for (let it = 0; it < 4; it++) {
      const r = R.find(r => x > r[0] && x < r[1] && y > r[2] && y < r[3]); if (!r) break;
      const c = [[r[0] - .5, y, x - r[0]], [r[1] + .5, y, r[1] - x], [x, r[3] + .5, (r[3] - y) * .8], [x, r[2] - .5, y - r[2]]].filter(p => ok(p[0], p[1])).sort((a, b2) => a[2] - b2[2])[0];
      if (!c) break; x = c[0]; y = c[1];
    }
    return [x, y];
  },
  /** Шлях від from до to в обхід перешкод: точки після старту (остання — ціль). Старт або ціль усередині сліду (щойно
   *  зістрибнув з дивану; точка «перед диваном», звідки милуються вікном) — спершу виходить на найближчий край сліду
   *  (freeAt), а до цілі заходить з її найближчого краю — тож крізь меблі не йде навіть тоді. Не знайшов — прямо. */
  route(from, to, who) {
    const R = this.obstacles(who), inS = p => R.some(r => p[0] > r[0] + .01 && p[0] < r[1] - .01 && p[1] > r[2] + .01 && p[1] < r[3] - .01), pre = [], post = [];
    if (inS(from)) { const e = this.freeAt(from[0], from[1], who); if (!inS(e)) { pre.push(e); from = e; } }
    if (inS(to)) { const e = this.freeAt(to[0], to[1], who); if (!inS(e)) { post.push(to); to = e; } }
    return [...pre, ...this.path(from, to, R), ...post];
  },
  /** Граф видимості: найкоротший шлях від from до to через кути прямокутників R (Дейкстра). */
  path(from, to, R) {
    const b = this.walkBounds();
    const inside = (p, r) => p[0] > r[0] + .01 && p[0] < r[1] - .01 && p[1] > r[2] + .01 && p[1] < r[3] - .01;
    // чи проходить відрізок p→q крізь середину прямокутника r (уздовж краю — можна); Лянґ–Барскі
    const cross = (p, q, r) => {
      const e = .05, dx = q[0] - p[0], dy = q[1] - p[1], P = [-dx, dx, -dy, dy], Q = [p[0] - r[0] - e, r[1] - e - p[0], p[1] - r[2] - e, r[3] - e - p[1]]; let t0 = 0, t1 = 1;
      for (let i = 0; i < 4; i++) { if (!P[i]) { if (Q[i] < 0) return false; continue; } const t = Q[i] / P[i]; if (P[i] < 0) { if (t > t1) return false; if (t > t0) t0 = t; } else { if (t < t0) return false; if (t < t1) t1 = t; } }
      return t1 - t0 > 1e-6;
    };
    const own = R.filter(r => inside(from, r)), goal = R.filter(r => inside(to, r));
    const blocked = (p, q, a, z) => R.some(r => !(a && own.includes(r)) && !(z && goal.includes(r)) && cross(p, q, r));
    if (!blocked(from, to, 1, 1)) return [to];
    const N = [from, to];
    R.forEach(r => [[r[0], r[2]], [r[1], r[2]], [r[0], r[3]], [r[1], r[3]]].forEach(p => { if (p[0] >= b.minX && p[0] <= b.maxX && p[1] >= b.minY && p[1] <= b.maxY && !R.some(o => inside(p, o))) N.push(p); }));
    const n = N.length, d = new Array(n).fill(Infinity), prev = new Array(n).fill(-1), done = new Array(n).fill(false); d[0] = 0;
    for (;;) {
      let u = -1; for (let i = 0; i < n; i++) if (!done[i] && d[i] < Infinity && (u < 0 || d[i] < d[u])) u = i;
      if (u < 0 || u === 1) break; done[u] = true;
      for (let v = 1; v < n; v++) if (!done[v] && !blocked(N[u], N[v], u === 0, v === 1)) { const w = d[u] + Math.hypot(N[v][0] - N[u][0], N[v][1] - N[u][1]); if (w < d[v]) { d[v] = w; prev[v] = u; } }
    }
    if (d[1] === Infinity) return [to];
    const path = []; for (let v = 1; v > 0; v = prev[v]) path.unshift(N[v]); return path;
  },
  /** Масштаб персонажа залежно від глибини (y): далі — менший. */
  scaleAt(y) { const C = NX.cfg, t = NX.px.clamp((y - C.FLOOR_Y) / 330, 0, 1); return NX.px.lerp(C.NEXI_SCALE_FAR, C.NEXI_SCALE_NEAR, t); },
};
