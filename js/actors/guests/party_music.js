/* ============================================================================
 * actors/guests/party_music.js — 8-BIT МУЗИКА ВЕЧІРКИ (NX.partyMusic): синтез кодом через Web Audio, без файлів (06.11)
 * ----------------------------------------------------------------------------
 * Перший звук у проєкті — лише на вечірці, лише за тапом людини (кнопка «♪ ЗВУК» у шапці вечірки, party.js: HUD), за
 * замовчуванням вимкнено; вибір запам'ятовується (localStorage nx.party.sound). Браузери дозволяють звук лише після жесту — тому
 * AudioContext створюється на тапі. Темп 128 bpm — той самий, що й beat() вечірки (плитки, танець, динаміки в такт музиці).
 *   КЛУБНИЙ ЗВУК (07.11, власник: «більш клубну, з басами»): глибока бочка (160 → 38 Гц, 0.32 с) + клік; САБ-БАС (синус на
 *   октаву нижче, «котиться» восьмими) і ацид-бас (пила через резонансний lowpass, зріз гойдається); сайдчейн — на кожну бочку
 *   шина решти голосів просідає до .3 і за .22 с повертається (качає); клап+снер на 2 і 4, закриті хети шістнадцятими,
 *   відкритий хет на «і»; пад — два розстроєні saw-акорди через lowpass, що відкривається за фразу; лід quieter з делеєм
 *   3/16. ФРАЗА 8 тактів у такт із дропом party_live.js (32 біти): такти 6–7 — розгін (райзер шуму, рол снера частішає,
 *   у 7-му бочка мовчить), такт 0 — дроп (бочка й саб на повну). Старт секвенсера вирівняно по beat() вечірки.
 *   Компресор на майстрі склеює; master .26, стоп — плавно.
 *   on() / off() / toggle() / get enabled; sync(t0) — старт такту до beat() вечірки.
 * ========================================================================== */
NX.partyMusic = (() => {
  const BPM = 128, KEY = 'nx.party.sound';
  let ctx = null, master = null, comp = null, duck = null, delay = null, noise = null, timer = 0, step = 0, nextT = 0, enabled = false;
  try { enabled = localStorage.getItem(KEY) === '1'; } catch (e) {}
  const STEP = 60 / BPM / 4;                                                                        // шістнадцята
  const hz = n => 440 * Math.pow(2, (n - 69) / 12);
  // прогресія: Am – F – C – G (по 1 такту); фраза 8 тактів = 2 проходи
  const CH = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]];
  const LEAD = [[76, 0, 79, 0, 81, 0, 79, 76, 0, 72, 0, 76, 0, 74, 0, 0], [77, 0, 77, 79, 81, 0, 84, 0, 81, 0, 79, 0, 77, 0, 76, 0],
    [72, 0, 76, 0, 79, 0, 84, 0, 83, 0, 79, 0, 76, 0, 72, 0], [79, 0, 83, 0, 86, 0, 83, 79, 0, 81, 0, 79, 0, 76, 0, 74]];
  const BASS = [1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1];                                     // «котиться»: синкопи восьмими/шістнадцятими
  function ensure() {
    if (ctx) return true; const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    ctx = new AC(); master = ctx.createGain(); master.gain.value = 0; comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 5; comp.attack.value = .004; comp.release.value = .12;
    comp.connect(master); master.connect(ctx.destination); duck = ctx.createGain(); duck.gain.value = 1; duck.connect(comp);                       // duck — сайдчейн-шина (усе, крім бочки)
    delay = ctx.createDelay(1); delay.delayTime.value = STEP * 3; const fb = ctx.createGain(); fb.gain.value = .32; const dl = ctx.createBiquadFilter(); dl.type = 'lowpass'; dl.frequency.value = 2600; delay.connect(dl); dl.connect(fb); fb.connect(delay); dl.connect(duck);   // делей для ліда
    const n = ctx.sampleRate * 2, buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; noise = buf;
    return true;
  }
  /** Голос: осцилятор type на f, обвідна (атака 5 мс, спад dur), гучність g; o.slide — ковзання частоти, o.lp/o.q — lowpass,
   *  o.lpTo — зріз їде до lpTo, o.det — розстроювання в центах, o.to — куди підключити (duck за замовчуванням), o.echo — у делей. */
  function tone(type, f, t, dur, g, o = {}) {
    const osc = ctx.createOscillator(), env = ctx.createGain(); osc.type = type; osc.frequency.setValueAtTime(f, t); if (o.slide) osc.frequency.exponentialRampToValueAtTime(o.slide, t + dur * .6); if (o.det) osc.detune.value = o.det;
    env.gain.setValueAtTime(0, t); env.gain.linearRampToValueAtTime(g, t + (o.att || .005)); env.gain.exponentialRampToValueAtTime(.001, t + dur);
    let last = osc; if (o.lp) { const fl = ctx.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.setValueAtTime(o.lp, t); if (o.lpTo) fl.frequency.exponentialRampToValueAtTime(o.lpTo, t + dur); fl.Q.value = o.q || 1; osc.connect(fl); last = fl; }
    last.connect(env); env.connect(o.to || duck); if (o.echo) env.connect(delay); osc.start(t); osc.stop(t + dur + .02);
  }
  /** Шумовий удар: шум через фільтр type на fq (Q — резонанс), спад dur. */
  function hit(t, dur, g, fq, type = 'highpass', q = 1, to) {
    const src = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), env = ctx.createGain(); src.buffer = noise; src.loop = true; fl.type = type; fl.frequency.value = fq; fl.Q.value = q;
    env.gain.setValueAtTime(g, t); env.gain.exponentialRampToValueAtTime(.001, t + dur); src.connect(fl); fl.connect(env); env.connect(to || duck); src.start(t); src.stop(t + dur + .02);
  }
  /** Бочка: синус 160 → 38 Гц з довгим спадом + клік; сайдчейн — шина duck просідає. */
  function kick(t, g = 1) {
    tone('sine', 160, t, .32, .95 * g, { slide: 38, to: comp }); hit(t, .02, .25 * g, 3000, 'bandpass', 2, comp);
    duck.gain.cancelScheduledValues(t); duck.gain.setValueAtTime(1, t); duck.gain.linearRampToValueAtTime(.3, t + .012); duck.gain.linearRampToValueAtTime(1, t + .24);
  }
  function schedule() {
    while (nextT < ctx.currentTime + .2) {
      const s16 = step % 16, bar = Math.floor(step / 16), chord = CH[bar % 4], ph = bar % 8, pass = Math.floor(bar / 4) % 4, t = nextT, build = ph >= 6, brk = ph === 7, k = build ? ((ph - 6) * 16 + s16) / 32 : 0;   // k — розгін 0..1
      if (s16 % 4 === 0 && !brk) kick(t);                                                           // бочка на кожну чверть (у 7-му такті мовчить — дроп б'є сильніше)
      if (s16 % 8 === 4) { hit(t, .14, .32, 1800); hit(t, .2, .28, 1100, 'bandpass', 1.4); }        // снер + клап на 2 і 4
      if (brk ? (s16 % (s16 < 8 ? 2 : 1) === 0) : build && s16 % 2 === 0) hit(t, .08, .18 + k * .2, 1600);   // рол снера: частішає під дроп
      if (s16 % 2 === 1) hit(t, .05, .09, 8000); else hit(t, .03, .05, 9000);                       // хети: відкритий на «і», закриті шістнадцяті
      if (s16 === 14 && ph % 2) hit(t, .3, .14, 6000);                                              // відкритий хет наприкінці такту
      if (build) hit(t, STEP * 1.1, .05 + k * .22, 400 + k * 6000, 'bandpass', 4);                  // райзер: шум зі зрізом угору
      const root = chord[0] - 24, sub = !brk || s16 < 8;
      if (BASS[s16] && sub) { tone('sine', hz(root), t, STEP * 1.9, .55, { att: .003 });            // САБ-БАС (синус на 2 октави нижче)
        tone('sawtooth', hz(root + 12), t, STEP * 1.5, .16, { lp: 220 + Math.abs(Math.sin(step / 32)) * 900 + (ph === 0 ? 400 : 0), lpTo: 160, q: 9 }); }   // ацид-бас: резонансний lowpass гойдається
      if (s16 === 0 && !brk) chord.forEach((n, i) => { tone('sawtooth', hz(n), t, STEP * 15, .035, { lp: 500 + (ph / 8) * 2200, det: -7 + i * 2, att: .08 }); tone('sawtooth', hz(n + 12), t, STEP * 15, .02, { lp: 500 + (ph / 8) * 2200, det: 8 - i * 3, att: .08 }); });   // пад: розстроєні saw, зріз відкривається за фразу
      if (!build) tone('triangle', hz(chord[(s16 + pass) % 3] + 24), t, STEP * .9, .035);           // арпеджіо
      const m = LEAD[(bar + pass) % 4][s16]; if (m && !brk) tone('square', hz(m), t, STEP * 1.6, .055, { lp: 3200, echo: 1 });   // лід з делеєм
      if (ph === 0 && s16 === 0) { hit(t, 1.2, .35, 200, 'highpass'); tone('sine', 60, t, .5, .5, { slide: 30, to: comp }); }   // дроп: вибух шуму + саб-удар
      nextT += STEP; step++;
    }
  }
  function on() {
    if (!ensure()) return false; if (ctx.state === 'suspended') ctx.resume();
    enabled = true; try { localStorage.setItem(KEY, '1'); } catch (e) {}
    if (!timer) { const b = NX.party && NX.party.S && NX.party.S.on ? (NX.time - NX.party.S.t0) * BPM / 60 : 0; step = Math.max(0, Math.floor(b * 4)) % 128;   // фраза в такт із дропом вечірки
      nextT = ctx.currentTime + .05; master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setTargetAtTime(.26, ctx.currentTime, .1); timer = setInterval(schedule, 50); schedule(); }
    return true;
  }
  function off(forget) {
    if (forget) { enabled = false; try { localStorage.setItem(KEY, '0'); } catch (e) {} }
    if (!ctx || !timer) return; master.gain.setTargetAtTime(0, ctx.currentTime, .1); clearInterval(timer); timer = 0;
  }
  const toggle = () => (timer ? (off(true), false) : on());
  /** Чи грає зараз. Вечірка кличе on() при відкритті, якщо enabled (жест уже був — тап по брамі), off() при закритті. */
  return { on, off, toggle, get enabled() { return enabled; }, get playing() { return !!timer; }, BPM };
})();
