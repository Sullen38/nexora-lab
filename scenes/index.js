'use strict';
/* ============================================================================
 * scenes/index.js — СЦЕНИ ДЛЯ ЗЙОМКИ: як дійти до потрібного моменту в грі (лише ззовні, через наявні функції NX.…)
 * ----------------------------------------------------------------------------
 * Кожна сцена — async (g, snap) => {...}: g — гра з rig/game.js (boot уже пройдено), snap(name) — зняти кадр зараз.
 * Команди — ті самі, що дає людина: NX.ui.chat.go(зона) = тап по зоні / слово в діалозі (зона бере наступну задачу по
 * черзі); гості — NX.guests.spawn(id); вірус — NX.virus.spawn(); камера на телефоні — NX.cam.x (як перетягування пальцем).
 * Моменти — за кадрами (1 кадр = 1/60 с часу кімнати) або за станом гри (g.until), тож дубль повторюється.
 * ========================================================================== */

/** Камера (телефон): тримати точку x кімнати в центрі, як після перетягування пальцем. fx — рядок JS, що дає x. */
const pin = (g, fx) => g.run(`(() => { const C = NX.cfg, vw = NX.cam.viewW, x = (${fx}); NX.cam.dragUntil = Infinity;
  NX.cam.x = Math.max(C.ROOM_X0, Math.min(Math.max(C.ROOM_X0, C.ROOM_X1 - vw), x - vw / 2)); })()`);
const unpin = g => g.run('NX.cam.dragUntil = 0');
/** Пройти n кадрів, тримаючи камеру на fx (оновлюється щокадру — точка може рухатись). */
async function follow(g, fx, n, snapEvery, snap, tag) {
  for (let i = 0; i < n; i++) { await pin(g, fx); await g.step(1); if (snapEvery && snap && i % snapEvery === 0) await snap(`${tag}_${String(i).padStart(4, '0')}`); }
}
/** Пройти n кадрів, знімаючи кожен every-й (для огляду). */
async function film(g, n, every, snap, tag) { for (let i = 0; i <= n; i += every) { await snap(`${tag}_${String(i).padStart(4, '0')}`); await g.step(every); } }

const SCENES = {
  /** Nexi на доку вітається (одразу після заставки). */
  async dock(g, snap, o = {}) { await film(g, o.n || 240, o.every || 30, snap, 'dock'); },
  /** Зона: Nexi йде, сідає / злітає й працює, картка результату. zone: ai | marketing | analytics | tools. */
  async zone(g, snap, o = {}) { await g.run(`NX.ui.chat.go(${JSON.stringify(o.zone || 'ai')})`); await film(g, o.n || 1500, o.every || 60, snap, o.zone || 'ai'); },
  /** Зона СКІНИ: капсула, сканер, лабораторія скінів. */
  async skins(g, snap, o = {}) { await g.run('NX.ui.chat.go("workshop")'); await film(g, o.n || 900, o.every || 60, snap, 'skins'); },
  /** Гість з порталу: з'являється й грає свою сценку; камера — за гостем. */
  async guest(g, snap, o = {}) {
    const id = o.id || 'kolobok';
    await g.run(`window.__g = NX.guests.spawn(${JSON.stringify(id)}), 1`);
    await follow(g, 'window.__g && NX.guests.S.list.includes(window.__g) ? window.__g.x : NX.nexi.x', o.n || 1500, o.every || 60, snap, 'guest_' + id);
  },
  /** Вірус в AI-центрі: тривога, Рудик біжить, лазер з очей (камера — як у грі: фокус на Рудику). */
  async virus(g, snap, o = {}) { await g.run('NX.virus.spawn()'); await film(g, o.n || 1500, o.every || 60, snap, 'virus'); },
};

module.exports = { SCENES, pin, unpin, follow, film };
