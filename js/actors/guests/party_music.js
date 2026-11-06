/* ============================================================================
 * actors/guests/party_music.js — 8-BIT МУЗИКА ВЕЧІРКИ (NX.partyMusic): синтез кодом через Web Audio, без файлів (06.11)
 * ----------------------------------------------------------------------------
 * Перший звук у проєкті — лише на вечірці, лише за тапом людини (кнопка «♪ ЗВУК» у шапці вечірки, party.js: HUD), за
 * замовчуванням вимкнено; вибір запам'ятовується (localStorage nx.party.sound). Браузери дозволяють звук лише після жесту — тому
 * AudioContext створюється на тапі. Темп 128 bpm — той самий, що й beat() вечірки (плитки, танець, динаміки в такт музиці).
 *   Голоси: бас (square, восьмі), лід (pulse 25 %, мелодія на 4 такти × 4 варіації), арпеджіо (triangle, шістнадцяті),
 *   ударні — бочка (синус із падінням висоти), снер і хет (шум через фільтр). Секвенсер планує ноти на 0.2 с наперед (lookahead),
 *   тож кадри не впливають на ритм. Гучність невелика (master .22), стоп — плавно за .3 с.
 *   on() / off() / toggle() / get enabled; sync(t0) — старт такту до beat() вечірки.
 * ========================================================================== */
NX.partyMusic = (() => {
  const BPM = 128, KEY = 'nx.party.sound';
  let ctx = null, master = null, noise = null, timer = 0, step = 0, nextT = 0, enabled = false;
  try { enabled = localStorage.getItem(KEY) === '1'; } catch (e) {}
  const STEP = 60 / BPM / 4;                                                                        // шістнадцята
  // ---------- ноти (MIDI -> Гц) ----------
  const hz = n => 440 * Math.pow(2, (n - 69) / 12);
  // прогресія: Am – F – C – G (по 1 такту), 4 такти × 4 проходи; бас — корінь акорду восьмими з октавним ходом
  const CH = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]];
  const LEAD = [                                                                                   // мелодія: 4 варіації по 16 кроків (0 — пауза), ноти MIDI
    [76, 0, 79, 0, 81, 0, 79, 76, 0, 72, 0, 76, 0, 74, 0, 0], [77, 0, 77, 79, 81, 0, 84, 0, 81, 0, 79, 0, 77, 0, 76, 0],
    [72, 0, 76, 0, 79, 0, 84, 0, 83, 0, 79, 0, 76, 0, 72, 0], [79, 0, 83, 0, 86, 0, 83, 79, 0, 81, 0, 79, 0, 76, 0, 74]];
  function ensure() {
    if (ctx) return true; const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    ctx = new AC(); master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
    const n = ctx.sampleRate * 2, buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; noise = buf;   // білий шум для ударних
    return true;
  }
  /** Голос: осцилятор типу type на частоті f з обвідною (атака 5 мс, спад dur) і гучністю g. */
  function tone(type, f, t, dur, g, o = {}) {
    const osc = ctx.createOscillator(), env = ctx.createGain(); osc.type = type; osc.frequency.setValueAtTime(f, t); if (o.slide) osc.frequency.exponentialRampToValueAtTime(o.slide, t + dur);
    env.gain.setValueAtTime(0, t); env.gain.linearRampToValueAtTime(g, t + .005); env.gain.exponentialRampToValueAtTime(.001, t + dur);
    osc.connect(env); env.connect(master); osc.start(t); osc.stop(t + dur + .02);
  }
  /** Шумовий удар (снер / хет): шум через фільтр, короткий спад. */
  function hit(t, dur, g, fq, type = 'highpass') {
    const src = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), env = ctx.createGain(); src.buffer = noise; fl.type = type; fl.frequency.value = fq;
    env.gain.setValueAtTime(g, t); env.gain.exponentialRampToValueAtTime(.001, t + dur); src.connect(fl); fl.connect(env); env.connect(master); src.start(t); src.stop(t + dur + .02);
  }
  function schedule() {
    while (nextT < ctx.currentTime + .2) {
      const s16 = step % 16, bar = Math.floor(step / 16) % 4, pass = Math.floor(step / 64) % 4, chord = CH[bar], t = nextT;
      if (s16 % 4 === 0) tone('sine', 150, t, .18, .5, { slide: 40 });                             // бочка на кожну чверть
      if (s16 % 8 === 4) hit(t, .12, .3, 1800);                                                     // снер на 2 і 4
      if (s16 % 2 === 1) hit(t, .04, .12, 7000);                                                    // хет на «і»
      if (s16 % 2 === 0) tone('square', hz(chord[0] - 12 + (s16 % 8 === 6 ? 12 : 0)), t, STEP * 1.6, .13);   // бас восьмими з октавою
      tone('triangle', hz(chord[(s16 + pass) % 3] + 12), t, STEP * .9, .06);                       // арпеджіо шістнадцятими
      const m = LEAD[(bar + pass) % 4][s16]; if (m) tone('square', hz(m), t, STEP * 1.8, .09);      // лід
      nextT += STEP; step++;
    }
  }
  function on(t0) {
    if (!ensure()) return false; if (ctx.state === 'suspended') ctx.resume();
    enabled = true; try { localStorage.setItem(KEY, '1'); } catch (e) {}
    if (!timer) { step = 0; nextT = ctx.currentTime + .05; master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setTargetAtTime(.22, ctx.currentTime, .1); timer = setInterval(schedule, 50); schedule(); }
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
