/* ============================================================================
 * objects/arcade.js — 8-BIT ІГРОВИЙ АВТОМАТ (передня частина кімнати)
 * ----------------------------------------------------------------------------
 * У вільний час Nexi грає (сценарій 'arcade' в activities.js).
 * На екрані крутиться маленька гра: кораблик стріляє в "загарбників".
 * Позиція залежить від висоти добудованої підлоги (layout()).
 * ========================================================================== */
NX.addObject({
  id: 'arcade', name: 'Ігровий автомат', act: 'arcade', active: false, prog: 0, pos: [1120, 450],
  get hit() { const [x, y] = this.pos, k = NX.px.depthK(y); return { x: x - 26 * k, y: y - 100 * k, w: 60 * k, h: 102 * k }; },
  layout() { const F = NX.cam.front; this.pos = [1120, Math.round(368 + Math.max(58, F * .42))]; },
  layers(t) {
    const [x, y] = this.pos, P = NX.px, on = this.active;
    return [{ y, draw: c => P.depth(c, x, y, () => {
      P.cube(c, x - 22, y, 44, 92, 10, '#2a1458', '#4a2a8a', '#1a0c3a');
      c.save(); c.strokeStyle = Math.sin(t * 3) > 0 ? '#ff4fd8' : '#3be8ff'; c.lineWidth = 1.5; c.shadowColor = c.strokeStyle; c.shadowBlur = 6; c.strokeRect(x - 22, y - 92, 44, 92); c.restore();   // неоновий кант
      P.rect(c, x - 20, y - 90, 40, 13, Math.sin(t * 4) > 0 ? '#d94bff' : '#b02ad8'); P.text(c, 'NEXI', x, y - 80, '#fff', 6, 'center');
      P.rect(c, x - 18, y - 74, 36, 30, '#05051a'); P.rect(c, x - 16, y - 72, 32, 26, on ? '#0c0c38' : '#08082a');
      for (let r = 0; r < 3; r++) for (let i = 0; i < 6; i++) if ((i + r + Math.floor(t * 2)) % 7) P.rect(c, x - 14 + i * 5 + Math.sin(t * 1.5) * 2, y - 70 + r * 4, 3, 2, ['#ff4fd8', '#3bff8a', '#ffe27a'][r]);
      const sx = x - 2 + Math.sin(t * (on ? 3 : 1.2)) * 10; P.rect(c, sx, y - 51, 6, 2, '#3be8ff'); P.rect(c, sx + 2, y - 53, 2, 2, '#3be8ff');
      if (on) { P.rect(c, sx + 2, y - 58 - ((t * 40) % 8), 1, 3, '#ffe27a'); }
      P.text(c, String(Math.floor((on ? this.prog : .3) * 9000)).padStart(4, '0'), x + 14, y - 66, '#ffe27a', 3, 'right');
      P.cube(c, x - 24, y - 36, 48, 7, 7, '#3a1a6a', '#5a3a9a', '#24104a');                                  // пульт
      P.rect(c, x - 12, y - 48, 2, 8, '#c3cbea'); P.rect(c, x - 14, y - 51, 6, 4, '#ff3b6a');                // джойстик
      [0, 1, 2].forEach(i => P.rect(c, x + 2 + i * 6, y - 44, 4, 4, on && Math.floor(t * 8) % 3 === i ? '#fff' : ['#ffe27a', '#3be8ff', '#3bff8a'][i]));
      P.rect(c, x - 4, y - 20, 8, 3, '#ffc94d'); P.rect(c, x - 14, y - 12, 28, 2, '#ff4fd8');                // монетник, підсвітка
      P.glow(c, x, y - 58, 40, on ? 'rgba(217,75,255,.6)' : 'rgba(217,75,255,.35)', .6);
    }) }];
  },
});
