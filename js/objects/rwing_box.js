/* ============================================================================
 * objects/rwing_box.js — СІРИЙ МАКЕТ ОБОХ КРИЛ «ПО ДУЗІ» (лише для погодження; вмикається адресою #rw-box)
 * ----------------------------------------------------------------------------
 * Кімната зверху — пів кола: вікно в найдальшій точці, обабіч стіни загинаються дугами до глядача (ліва — дзеркало
 * правої відносно центру вікна). Зони стоять СПИНОЮ ДО ДУГИ й дивляться в її центр:
 *   праворуч: майстерня (біля вікна, прямо) -> інструменти (лицем до нас) -> портал (найближче, лицем до центру кімнати);
 *   ліворуч:  маркетинг (біля вікна, прямо) -> аналітика (лицем до нас) -> AI-центр (найближче, лицем до центру кімнати).
 * Розміри — крок 15%: найближча зона 100, середня 85, дальня 72. Кожна зона зібрана з частин картинки-концепту
 * (assets/room.webp) — коробки, циліндри, листя, оздоби на гранях, написи з NX.t. Диван, підлога, вікно й рами — без змін.
 * Розкладку генерує scratchpad gen_room.py (частини задані в пікселях картинки й переносяться в 3D кожної зони).
 * Геометрія — справжні об'єми в перспективі кімнати (NX.persp: VP 774/220, D 520; око — (774, 220, -520)):
 *   - об'єми не перетинаються (перевірка в генераторі);
 *   - хто кого закриває — за роздільною лінією в плані (з боку ока — ближче) + «стоїть на» (on): верх основи — під
 *     річчю, тіло основи — після неї; порядок рахується лише там, де обриси на екрані перекриваються;
 *   - антресоль, речі на ній, підвіси й колони біля стіни — позаду зон або вище за них: малюються перед зонами.
 * Світ: план (x, z) і висота y; z = 0 — площина картинки, підлога y = 372.
 * ========================================================================== */
(() => {
  if (!/rw-box/.test(location.hash)) return;
  const PZ = NX.persp, VP = PZ.VP, D = PZ.D, EYE = [VP[0], -D], FL = 372, CEIL = -240;
  const pr = q => PZ.p(q[0], q[1], q[2]);
  // ---- вимкнути поточні крила (лише в цьому режимі) ----
  const OFF = ['workshop', 'tools', 'portal', 'rwingBack', 'rwingMezz', 'rwingFloor', 'rwingPlants', 'rwingAir',
    'wingBack', 'wingReact', 'aiPc', 'analytics', 'marketing', 'wingPlantsWall', 'wingProps', 'wingFloor', 'wingGlow', 'wingAir', 'analyticsChair', 'marketingChair'];
  const off = () => Object.values(NX.objects).forEach(o => { if (OFF.includes(o.id) || /^(r[pg]|w[pg])_/.test(o.id)) { o.drawBack = null; o.layers = null; o.draw = () => {}; o.hit = null; } });
  off(); let offDone = false;                                                                            // крісла (office.js) реєструються пізніше — ще раз на першому кадрі

  const LAYOUT = {"right":{"wall":[[1039.7,185],[1200,185],[1239.1,181.6],[1277.0,171.4],[1312.5,154.9],[1344.6,132.4],[1372.4,104.6],[1394.9,72.5],[1411.4,37.0],[1421.6,-0.9],[1425.0,-40.0],[1421.6,-79.1],[1411.4,-117.0]],"items":[{"id":"ws_base","zone":"workshop","x":1056.97,"z":117.0,"turn":0,"w":225.24,"dep":47.3,"yb":372.0,"yt":333.71,"st":"base","deco":[{"t":"l","f":[0,0.04,1,0.04],"col":"#ff4fd8","lw":1.2},{"t":"r","f":[0.39,0.58,0.29,0.59],"fill":"#ff9a3a","line":"#ffd27a"},{"t":"l","f":[0.27,0.2,0.27,0.96],"col":"#0a0620"},{"t":"l","f":[0.73,0.2,0.73,0.96],"col":"#0a0620"},{"t":"c","f":[0.08,0.62,0.01],"fill":"#3be8ff"},{"t":"c","f":[0.16,0.62,0.01],"fill":"#3be8ff"},{"t":"c","f":[0.84,0.62,0.01],"fill":"#3be8ff"},{"t":"c","f":[0.92,0.62,0.01],"fill":"#3be8ff"}]},{"id":"ws_stepL","zone":"workshop","x":974.2,"z":119.25,"turn":0,"w":59.69,"dep":42.8,"yb":333.71,"yt":324.7,"st":"base","on":"ws_base","deco":[{"t":"l","f":[0,0.3,1,0.3],"col":"#3be8ff"}]},{"id":"ws_stepR","zone":"workshop","x":1139.75,"z":119.25,"turn":0,"w":59.69,"dep":42.8,"yb":333.71,"yt":324.7,"st":"base","on":"ws_base","deco":[{"t":"l","f":[0,0.3,1,0.3],"col":"#3be8ff"}]},{"id":"ws_back","zone":"workshop","x":1056.97,"z":150.79,"turn":0,"w":103.61,"dep":9.01,"yb":333.71,"yt":207.58,"st":"frame","on":"ws_base","deco":[{"t":"ch","f":[0.01,0.99,0.02,0.99],"k":0.1,"fill":"#a0208a","line":"#ff7af0","lw":1.1},{"t":"c","f":[0.5,0.25,0.13],"fill":"#ffd0f4","line":"#ffffff"},{"t":"c","f":[0.5,0.25,0.19],"line":"#ff9af0","lw":1},{"t":"l","f":[0.01,0.79,0.99,0.79],"col":"#ff9af0","lw":0.8}]},{"id":"ws_postL","zone":"workshop","x":989.4,"z":128.26,"turn":0,"w":29.28,"dep":31.53,"yb":324.7,"yt":207.58,"st":"frame","on":"ws_stepL","deco":[{"t":"l","f":[0.5,0.08,0.5,0.92],"col":"#3be8ff","lw":1.4},{"t":"r","f":[0.2,0.8,0.7,0.82],"fill":"#0a0620","line":"#ff4fd8"}]},{"id":"ws_postR","zone":"workshop","x":1124.55,"z":128.26,"turn":0,"w":29.28,"dep":31.53,"yb":324.7,"yt":207.58,"st":"frame","on":"ws_stepR","deco":[{"t":"l","f":[0.5,0.08,0.5,0.92],"col":"#3be8ff","lw":1.4},{"t":"r","f":[0.2,0.8,0.7,0.82],"fill":"#0a0620","line":"#ff4fd8"}]},{"id":"ws_beam","zone":"workshop","x":1056.97,"z":126.01,"turn":0,"w":182.44,"dep":33.79,"yb":207.58,"yt":171.54,"st":"frame","deco":[{"t":"l","f":[0.05,0.9,0.95,0.9],"col":"#ff4fd8","lw":1.2}],"ch":[13.51,13.51]},{"id":"ws_sign","zone":"workshop","x":1057.54,"z":119.25,"turn":0,"w":113.74,"dep":6.76,"yb":198.57,"yt":164.78,"st":"dark","deco":[{"t":"r","f":[0,1,0,1],"fill":"#0a0620","line":"#ff4fd8","lw":1.2},{"t":"c","f":[0.16,0.5,0.08],"line":"#7af4ff","lw":1.1},{"t":"txt","f":[0.31,0.97,0.16,0.86],"key":"nav.workshop","col":"#7af4ff"}]},{"id":"ws_dome","zone":"workshop","x":1056.97,"z":132.77,"turn":0,"w":67.57,"dep":24.78,"yb":171.54,"yt":149.02,"st":"dome","on":"ws_beam","cyl":12,"band":1},{"id":"ws_armMount","zone":"workshop","x":1056.97,"z":139.52,"turn":0,"w":20.27,"dep":11.26,"yb":149.02,"yt":137.75,"st":"dark","on":"ws_dome","cyl":10},{"id":"ws_wingL","zone":"workshop","x":957.31,"z":132.77,"turn":0,"w":25.9,"dep":29.28,"yb":324.7,"yt":218.84,"st":"frame","on":"ws_stepL","deco":[{"t":"l","f":[0.3,0.05,0.3,0.95],"col":"#ff4fd8","lw":1.4},{"t":"r","f":[0.55,0.85,0.1,0.3],"fill":"#0a0620","line":"#3be8ff"}]},{"id":"ws_wingR","zone":"workshop","x":1156.64,"z":132.77,"turn":0,"w":25.9,"dep":29.28,"yb":324.7,"yt":218.84,"st":"frame","on":"ws_stepR","deco":[{"t":"l","f":[0.3,0.05,0.3,0.95],"col":"#ff4fd8","lw":1.4},{"t":"r","f":[0.55,0.85,0.1,0.3],"fill":"#0a0620","line":"#3be8ff"}]},{"id":"ws_tabLs","zone":"workshop","x":977.58,"z":122.63,"turn":0,"w":11.26,"dep":3.38,"yb":324.7,"yt":313.44,"st":"dark","on":"ws_stepL"},{"id":"ws_tabL","zone":"workshop","x":977.58,"z":121.5,"turn":0,"w":39.42,"dep":4.5,"yb":313.44,"yt":248.12,"st":"tablet","on":"ws_tabLs","deco":[{"t":"r","f":[0.08,0.92,0.05,0.95],"fill":"#0c4a8a","line":"#7af4ff"},{"t":"grid","f":[0.16,0.84,0.12,0.88],"nx":2,"ny":3,"fill":"#1a6ab0","line":"#9af8ff"}]},{"id":"ws_tabRs","zone":"workshop","x":1136.37,"z":122.63,"turn":0,"w":11.26,"dep":3.38,"yb":324.7,"yt":313.44,"st":"dark","on":"ws_stepR"},{"id":"ws_tabR","zone":"workshop","x":1136.37,"z":121.5,"turn":0,"w":39.42,"dep":4.5,"yb":313.44,"yt":243.61,"st":"tablet","on":"ws_tabRs","deco":[{"t":"r","f":[0.08,0.92,0.05,0.95],"fill":"#0c4a8a","line":"#7af4ff"},{"t":"grid","f":[0.16,0.84,0.12,0.88],"nx":2,"ny":3,"fill":"#1a6ab0","line":"#9af8ff"}]},{"id":"ws_ped0","zone":"workshop","x":1036.7,"z":123.76,"turn":0,"w":15.77,"dep":13.51,"yb":333.71,"yt":320.2,"st":"fig","on":"ws_base","cyl":10,"band":1},{"id":"ws_fig0","zone":"workshop","x":1036.7,"z":126.01,"turn":0,"w":9.01,"dep":7.88,"yb":320.2,"yt":306.68,"st":"bot","on":"ws_ped0","deco":[{"t":"r","f":[0.2,0.8,0.3,0.5],"fill":"#c8f0ff"}]},{"id":"ws_head0","zone":"workshop","x":1036.7,"z":126.57,"turn":0,"w":6.76,"dep":6.76,"yb":306.68,"yt":297.67,"st":"bot","on":"ws_fig0","deco":[{"t":"c","f":[0.32,0.5,0.12],"fill":"#7af4ff"},{"t":"c","f":[0.68,0.5,0.12],"fill":"#7af4ff"}]},{"id":"ws_ped1","zone":"workshop","x":1056.97,"z":123.76,"turn":0,"w":15.77,"dep":13.51,"yb":333.71,"yt":320.2,"st":"fig","on":"ws_base","cyl":10,"band":1},{"id":"ws_fig1","zone":"workshop","x":1056.97,"z":126.01,"turn":0,"w":9.01,"dep":7.88,"yb":320.2,"yt":299.92,"st":"bot","on":"ws_ped1","deco":[{"t":"r","f":[0.2,0.8,0.3,0.5],"fill":"#c8f0ff"}]},{"id":"ws_head1","zone":"workshop","x":1056.97,"z":126.57,"turn":0,"w":6.76,"dep":6.76,"yb":299.92,"yt":290.91,"st":"bot","on":"ws_fig1","deco":[{"t":"c","f":[0.32,0.5,0.12],"fill":"#7af4ff"},{"t":"c","f":[0.68,0.5,0.12],"fill":"#7af4ff"}]},{"id":"ws_ped2","zone":"workshop","x":1078.37,"z":123.76,"turn":0,"w":15.77,"dep":13.51,"yb":333.71,"yt":320.2,"st":"fig","on":"ws_base","cyl":10,"band":1},{"id":"ws_fig2","zone":"workshop","x":1078.37,"z":126.01,"turn":0,"w":9.01,"dep":7.88,"yb":320.2,"yt":308.93,"st":"bot","on":"ws_ped2","deco":[{"t":"r","f":[0.2,0.8,0.3,0.5],"fill":"#c8f0ff"}]},{"id":"ws_head2","zone":"workshop","x":1078.37,"z":126.57,"turn":0,"w":6.76,"dep":6.76,"yb":308.93,"yt":299.92,"st":"bot","on":"ws_fig2","deco":[{"t":"c","f":[0.32,0.5,0.12],"fill":"#7af4ff"},{"t":"c","f":[0.68,0.5,0.12],"fill":"#7af4ff"}]},{"id":"ws_ped","zone":"workshop","x":1196.62,"z":126.01,"turn":0,"w":42.8,"dep":20.27,"yb":372.0,"yt":280.78,"st":"term","deco":[{"t":"r","f":[0.08,0.92,0.46,0.9],"fill":"#0c2a5a","line":"#3be8ff"},{"t":"c","f":[0.5,0.7,0.17],"line":"#7af4ff","lw":1}]},{"id":"ws_term","zone":"workshop","x":1196.62,"z":123.76,"turn":0,"w":51.8,"dep":22.52,"yb":280.78,"yt":192.94,"st":"term","on":"ws_ped","deco":[{"t":"r","f":[0.16,0.84,0.12,0.36],"fill":"#14306a","line":"#7af4ff"},{"t":"r","f":[0.16,0.84,0.42,0.66],"fill":"#14306a","line":"#7af4ff"},{"t":"r","f":[0.16,0.84,0.72,0.94],"fill":"#14306a","line":"#7af4ff"}],"ch":[6.76,6.76]},{"id":"ws_termTop","zone":"workshop","x":1196.62,"z":126.01,"turn":0,"w":42.8,"dep":15.77,"yb":192.94,"yt":186.18,"st":"clamp","on":"ws_term","glow":1,"gcol":"120,240,255","gr":20},{"id":"ws_col","zone":"workshop","x":931.41,"z":141.78,"turn":0,"w":23.65,"dep":22.52,"yb":372.0,"yt":194.06,"st":"mach","deco":[{"t":"l","f":[0.5,0.04,0.5,0.96],"col":"#ff9a3a","lw":2},{"t":"r","f":[0.15,0.85,0.3,0.42],"fill":"#2a1a10","line":"#ff9a3a"},{"t":"r","f":[0.15,0.85,0.6,0.7],"fill":"#2a1a10","line":"#ff9a3a"}]},{"id":"ws_colCap","zone":"workshop","x":931.41,"z":140.65,"turn":0,"w":30.41,"dep":24.78,"yb":194.06,"yt":187.31,"st":"mach","on":"ws_col"},{"id":"ws_colPlant","zone":"workshop","x":931.97,"z":144.03,"turn":0,"w":20.27,"dep":15.77,"yb":187.31,"yt":173.79,"st":"pot","on":"ws_colCap","plant":1,"cyl":10,"fw":54.06,"fh":40.54},{"id":"ws_potBL","zone":"workshop","x":929.72,"z":107.99,"turn":0,"w":27.03,"dep":22.52,"yb":372.0,"yt":340.47,"st":"pot","plant":1,"cyl":10,"fw":47.3,"fh":47.3},{"id":"tl_cabL","zone":"tools","x":1209.01,"z":40.14,"turn":36,"w":52.24,"dep":57.45,"yb":372.0,"yt":329.49,"st":"desk","deco":[{"t":"r","f":[0.06,0.94,0.08,0.94],"fill":"#140c30","line":"#6a4ab0"},{"t":"l","f":[0.06,0.5,0.94,0.5],"col":"#6a4ab0"},{"t":"r","f":[0.42,0.58,0.26,0.32],"fill":"#9a8ae0"},{"t":"r","f":[0.42,0.58,0.7,0.76],"fill":"#9a8ae0"}],"notop":1},{"id":"tl_cabR","zone":"tools","x":1268.88,"z":-3.36,"turn":36,"w":50.5,"dep":57.45,"yb":372.0,"yt":329.49,"st":"desk","deco":[{"t":"r","f":[0.06,0.94,0.08,0.94],"fill":"#140c30","line":"#6a4ab0"},{"t":"l","f":[0.06,0.5,0.94,0.5],"col":"#6a4ab0"},{"t":"r","f":[0.42,0.58,0.26,0.32],"fill":"#9a8ae0"},{"t":"r","f":[0.42,0.58,0.7,0.76],"fill":"#9a8ae0"}],"notop":1},{"id":"tl_top","zone":"tools","x":1231.84,"z":9.35,"turn":36,"w":139.31,"dep":71.23,"yb":329.49,"yt":320.3,"st":"bench","deco":[{"t":"r","f":[0,1,0,0.55],"fill":"#ff7ad0"}]},{"id":"tl_board","zone":"tools","x":1270.89,"z":51.99,"turn":36,"w":115.81,"dep":13.79,"yb":320.3,"yt":150.25,"st":"board","on":"tl_top","deco":[{"t":"r","f":[0.44,0.58,0.64,0.89],"fill":"#ff9a3a","line":"#ffd27a"},{"t":"l","f":[0.03,0.08,0.03,0.95],"col":"#3be8ff","lw":1.2},{"t":"l","f":[0.97,0.08,0.97,0.95],"col":"#3be8ff","lw":1.2}],"ch":[6.97,9.19]},{"id":"tl_sign","zone":"tools","x":1269.23,"z":48.22,"turn":36,"w":91.43,"dep":3.45,"yb":193.91,"yt":162.89,"st":"board","deco":[{"t":"r","f":[0,1,0,1],"fill":"#0a0620","line":"#3be8ff","lw":1.2},{"t":"c","f":[0.14,0.5,0.07],"line":"#7af4ff","lw":1.1},{"t":"txt","f":[0.27,0.97,0.16,0.86],"key":"nav.tools","col":"#7af4ff"}]},{"id":"tl_tiles","zone":"tools","x":1273.43,"z":46.6,"turn":36,"w":87.94,"dep":2.3,"yb":250.21,"yt":198.51,"st":"board","deco":[{"t":"r","f":[0,1,0,1],"fill":"#0a1440","line":"#3be8ff"},{"t":"grid","f":[0.02,0.98,0.05,0.95],"nx":3,"ny":1,"gap":0.05,"fill":"#0e2a6a","line":"#7af4ff","icon":"#7af4ff"}]},{"id":"tl_tileBL","zone":"tools","x":1250.18,"z":63.48,"turn":36,"w":30.48,"dep":2.3,"yb":308.81,"yt":267.45,"st":"board","deco":[{"t":"r","f":[0,1,0,1],"fill":"#0e2a6a","line":"#7af4ff"},{"t":"c","f":[0.5,0.5,0.22],"line":"#7af4ff","lw":1}]},{"id":"tl_tileBR","zone":"tools","x":1294.91,"z":30.99,"turn":36,"w":41.79,"dep":2.3,"yb":308.81,"yt":255.96,"st":"board","deco":[{"t":"r","f":[0,1,0,1],"fill":"#0e2a6a","line":"#7af4ff"},{"t":"c","f":[0.5,0.5,0.2],"line":"#7af4ff","lw":1}]},{"id":"tl_bot","zone":"tools","x":1294.43,"z":37.73,"turn":36,"w":22.64,"dep":9.19,"yb":150.25,"yt":131.87,"st":"bot","on":"tl_board"},{"id":"tl_botH","zone":"tools","x":1294.77,"z":38.19,"turn":36,"w":17.41,"dep":8.04,"yb":131.87,"yt":115.79,"st":"bot","on":"tl_bot","deco":[{"t":"c","f":[0.33,0.5,0.12],"fill":"#7af4ff"},{"t":"c","f":[0.67,0.5,0.12],"fill":"#7af4ff"}]},{"id":"tl_plantTop","zone":"tools","x":1238.08,"z":78.67,"turn":36,"w":15.67,"dep":9.19,"yb":150.25,"yt":138.77,"st":"pot","on":"tl_board","plant":1,"cyl":10,"fw":40.05,"fh":36.77},{"id":"tl_item1","zone":"tools","x":1229.32,"z":31.07,"turn":36,"w":15.67,"dep":11.49,"yb":320.3,"yt":306.51,"st":"item","on":"tl_top","deco":[{"t":"r","f":[0,1,0,0.3],"fill":"#ff9a3a"}]},{"id":"tl_item2","zone":"tools","x":1272.29,"z":-0.15,"turn":36,"w":20.9,"dep":11.49,"yb":320.3,"yt":308.81,"st":"item","on":"tl_top"},{"id":"tl_item3","zone":"tools","x":1251.04,"z":20.97,"turn":36,"w":10.45,"dep":6.89,"yb":320.3,"yt":304.21,"st":"screen","on":"tl_top","deco":[{"t":"r","f":[0.15,0.85,0.15,0.6],"fill":"#3be8ff"}]},{"id":"tl_lanL","zone":"tools","x":1221.11,"z":93.84,"turn":36,"w":8.71,"dep":6.89,"yb":262.85,"yt":228.38,"st":"lamp","glow":1},{"id":"tl_stand","zone":"tools","x":1174.55,"z":62.34,"turn":36,"w":15.67,"dep":16.09,"yb":372.0,"yt":320.3,"st":"stand"},{"id":"tl_standPlant","zone":"tools","x":1175.23,"z":63.27,"turn":36,"w":13.93,"dep":13.79,"yb":320.3,"yt":306.51,"st":"pot","on":"tl_stand","plant":1,"cyl":10,"leaf":["#8a4ac0","#6a2aa0","#b07ae0"],"fw":31.35,"fh":45.96},{"id":"tl_potR","zone":"tools","x":1308.92,"z":-26.77,"turn":36,"w":24.38,"dep":25.28,"yb":372.0,"yt":320.3,"st":"pot","plant":1,"cyl":10,"fw":50.5,"fh":75.83},{"id":"tl_lanF","zone":"tools","x":1268.17,"z":-36.93,"turn":36,"w":12.19,"dep":11.49,"yb":372.0,"yt":340.98,"st":"clamp","glow":1,"gcol":"120,240,255"},{"id":"pt_d1","zone":"portal","x":1345.72,"z":-23.63,"turn":86,"w":120.87,"dep":67.12,"yb":372.0,"yt":364.01,"st":"dais","deco":[{"t":"l","f":[0,0.2,1,0.2],"col":"#d98aff","lw":1.2}]},{"id":"pt_d2","zone":"portal","x":1355.29,"z":-22.96,"turn":86,"w":108.15,"dep":52.74,"yb":364.01,"yt":356.02,"st":"dais","on":"pt_d1","deco":[{"t":"l","f":[0,0.2,1,0.2],"col":"#3be8ff","lw":1.2}]},{"id":"pt_back","zone":"portal","x":1395.05,"z":-18.9,"turn":86,"w":73.79,"dep":6.39,"yb":356.02,"yt":204.2,"st":"pframe","on":"pt_d2","deco":[{"t":"arch","f":[0,1,0.02,1],"spring":0.3,"fill":"#2a0f6a","line":"#3be8ff","vortex":[0.66,0.62]}]},{"id":"pt_pillL","zone":"portal","x":1369.16,"z":30.62,"turn":86,"w":27.35,"dep":30.36,"yb":356.02,"yt":204.2,"st":"pframe","on":"pt_d2","deco":[{"t":"l","f":[0.2,0.04,0.2,0.96],"col":"#c86aff","lw":1.6},{"t":"l","f":[0.9,0.04,0.9,0.96],"col":"#ff4fd8","lw":1.2}]},{"id":"pt_pillR","zone":"portal","x":1376.13,"z":-69.01,"turn":86,"w":22.27,"dep":30.36,"yb":356.02,"yt":204.2,"st":"pframe","on":"pt_d2","deco":[{"t":"l","f":[0.5,0.04,0.5,0.96],"col":"#ff4fd8","lw":1.6}]},{"id":"pt_beam","zone":"portal","x":1370.96,"z":-18.04,"turn":86,"w":124.69,"dep":31.96,"yb":204.2,"yt":161.85,"st":"pframe","deco":[{"t":"l","f":[0.05,0.92,0.95,0.92],"col":"#ff4fd8","lw":1.2}],"ch":[16.54,12.78]},{"id":"pt_sign","zone":"portal","x":1367.96,"z":-27.81,"turn":86,"w":73.79,"dep":3.2,"yb":204.2,"yt":177.04,"st":"dark","deco":[{"t":"r","f":[0,1,0,1],"fill":"#0a0620","line":"#d98aff","lw":1.2},{"t":"c","f":[0.16,0.5,0.08],"line":"#7af4ff","lw":1.1},{"t":"txt","f":[0.31,0.97,0.16,0.86],"key":"nav.portal","col":"#7af4ff"}]},{"id":"pt_crys1","zone":"portal","x":1387.92,"z":-8.56,"turn":86,"w":12.72,"dep":6.39,"yb":356.02,"yt":320.86,"st":"glass","on":"pt_d2","ch":[6.36,7.99]},{"id":"pt_crys2","zone":"portal","x":1387.39,"z":-23.9,"turn":86,"w":12.72,"dep":6.39,"yb":356.02,"yt":333.65,"st":"glass","on":"pt_d2","ch":[5.73,7.19]},{"id":"pt_gold","zone":"portal","x":1359.68,"z":-62.83,"turn":86,"w":20.36,"dep":12.78,"yb":356.02,"yt":328.85,"st":"gold","on":"pt_d2","plant":1,"cyl":10,"fw":27.99,"fh":22.37},{"id":"pt_plantR","zone":"portal","x":1346.13,"z":-98.21,"turn":86,"w":15.27,"dep":17.58,"yb":372.0,"yt":333.65,"st":"stand","plant":1,"cyl":10,"fw":36.9,"fh":49.54},{"id":"mz_bot0","layer":"up","x":1262.0,"z":121.5,"turn":21,"w":10,"dep":8,"yb":40,"yt":30,"st":"bot"},{"id":"mz_botH0","layer":"up","on":"mz_bot0","x":1262.0,"z":121.5,"turn":21,"w":8,"dep":7,"yb":30,"yt":23,"st":"bot","deco":[{"t":"c","f":[0.33,0.5,0.14],"fill":"#7af4ff"},{"t":"c","f":[0.67,0.5,0.14],"fill":"#7af4ff"}]},{"id":"mz_bot1","layer":"up","x":1275.8,"z":115.5,"turn":26,"w":10,"dep":8,"yb":40,"yt":30,"st":"bot"},{"id":"mz_botH1","layer":"up","on":"mz_bot1","x":1275.8,"z":115.5,"turn":26,"w":8,"dep":7,"yb":30,"yt":23,"st":"bot","deco":[{"t":"c","f":[0.33,0.5,0.14],"fill":"#7af4ff"},{"t":"c","f":[0.67,0.5,0.14],"fill":"#7af4ff"}]},{"id":"mz_bot2","layer":"up","x":1289.1,"z":108.3,"turn":31,"w":10,"dep":8,"yb":40,"yt":30,"st":"bot"},{"id":"mz_botH2","layer":"up","on":"mz_bot2","x":1289.1,"z":108.3,"turn":31,"w":8,"dep":7,"yb":30,"yt":23,"st":"bot","deco":[{"t":"c","f":[0.33,0.5,0.14],"fill":"#7af4ff"},{"t":"c","f":[0.67,0.5,0.14],"fill":"#7af4ff"}]},{"id":"mz_cube","layer":"up","x":1305.3,"z":99.8,"turn":37,"w":12,"dep":12,"yb":40,"yt":28,"st":"item","deco":[{"t":"r","f":[0.2,0.8,0.2,0.8],"fill":"#6a3ad8","line":"#c8a0ff"}]},{"id":"mz_pot0","layer":"up","x":1252.3,"z":131.2,"turn":17,"w":14,"dep":12,"yb":40,"yt":30,"st":"pot","plant":1,"fw":34,"fh":26,"cyl":10},{"id":"mz_pot1","layer":"up","x":1324.3,"z":88.8,"turn":44,"w":14,"dep":12,"yb":40,"yt":30,"st":"pot","plant":1,"fw":34,"fh":26,"cyl":10},{"id":"mz_pot2","layer":"up","x":1346.6,"z":62.7,"turn":55,"w":14,"dep":12,"yb":40,"yt":30,"st":"pot","plant":1,"fw":34,"fh":26,"cyl":10},{"id":"mz_lantern","layer":"up","x":1362.7,"z":39.3,"turn":64,"w":12,"dep":12,"yb":40,"yt":12,"st":"gold","glow":1,"gr":46,"cyl":10},{"id":"mz_gold1","layer":"up","x":1369.0,"z":24.9,"turn":69,"w":16,"dep":12,"yb":40,"yt":28,"st":"gold"},{"id":"mz_gold2","layer":"up","x":1373.1,"z":12.9,"turn":73,"w":16,"dep":12,"yb":40,"yt":28,"st":"gold"},{"id":"mz_fern","layer":"up","x":1240.5,"z":150.7,"turn":10,"w":18,"dep":14,"yb":114,"yt":102,"st":"pot","plant":1,"fw":64,"fh":44,"cyl":10},{"id":"mz_lampL","layer":"up","x":1238.0,"z":155.3,"turn":10,"w":12,"dep":10,"yb":60,"yt":38,"st":"lamp","glow":1,"gr":30,"cyl":8}],"cols":[{"id":"col0","x":1234.9,"z":157.9,"turn":10,"w":24,"dep":20,"yb":372,"yt":-240,"st":"col","deco":[{"t":"l","f":[0.5,0.02,0.5,0.98],"col":"#3be8ff","lw":1.4},{"t":"r","f":[0.1,0.9,0.2,0.22],"fill":"#5a4ab0"},{"t":"r","f":[0.1,0.9,0.45,0.47],"fill":"#5a4ab0"},{"t":"r","f":[0.1,0.9,0.7,0.71],"fill":"#5a4ab0"}]},{"id":"col1","x":1370.5,"z":66.5,"turn":58,"w":24,"dep":20,"yb":372,"yt":64,"st":"col","deco":[{"t":"l","f":[0.5,0.02,0.5,0.98],"col":"#3be8ff","lw":1.4},{"t":"r","f":[0.1,0.9,0.2,0.22],"fill":"#5a4ab0"},{"t":"r","f":[0.1,0.9,0.45,0.47],"fill":"#5a4ab0"},{"t":"r","f":[0.1,0.9,0.7,0.71],"fill":"#5a4ab0"}]}],"armZone":"workshop","arm":[[1056.97,137.75,146.28],[1126.8,94.96,146.28],[1194.37,135.5,146.28],[1172.97,151.27,146.28]],"mezz":{"edge":[[1242.7,109.0],[1253.0,105.7],[1263.0,101.6],[1272.8,96.9],[1282.1,91.4],[1291.1,85.4],[1299.6,78.7],[1307.7,71.5],[1315.2,63.7],[1322.1,55.4],[1328.5,46.7],[1334.2,37.5],[1339.3,27.9],[1343.7,18.1],[1347.4,7.9],[1350.4,-2.5],[1352.6,-13.1],[1354.2,-23.8],[1354.9,-34.6],[1354.9,-45.4],[1354.2,-56.2],[1352.6,-66.9]],"yt":40,"yb":64},"hang":[{"x":1277.7,"z":134.5,"len":50,"kind":"vine","turn":24},{"x":1289.7,"z":128.6,"len":30,"kind":"lamp","turn":28},{"x":1304.0,"z":120.2,"len":44,"kind":"vine","turn":33},{"x":1320.2,"z":108.4,"len":26,"kind":"lamp","turn":39},{"x":1335.1,"z":95.1,"len":36,"kind":"vine","turn":45},{"x":1350.5,"z":77.6,"len":30,"kind":"vine","turn":52}],"hub":{"x0":1038.6,"x1":1189.8,"y0":-56.8,"y1":145.8,"z":182,"deco":[{"t":"txt","f":[0.13,0.71,0.12,0.26],"s":"NEXORA AI","col":"#7af4ff"},{"t":"r","f":[0.06,0.73,0.29,0.73],"fill":"#0a2a7a","line":"#3b8aff"},{"t":"c","f":[0.27,0.47,0.09],"fill":"#1a5ad0"},{"t":"c","f":[0.54,0.53,0.11],"fill":"#1a5ad0"},{"t":"c","f":[0.38,0.65,0.06],"fill":"#1a5ad0"},{"t":"grid","f":[0.76,0.98,0.18,0.73],"nx":1,"ny":4,"gap":0.08,"fill":"#0e2a6a","line":"#7af4ff","icon":"#7af4ff"},{"t":"l","f":[0.09,0.9,0.71,0.83],"col":"#ff4fd8","lw":1}],"strip":{"x0":1193.8,"x1":1227.6,"y0":-63.5,"y1":145.8,"deco":[{"t":"grid","f":[0.12,0.88,0.04,0.96],"nx":1,"ny":6,"gap":0.1,"fill":"#1a1450","line":"#ff4fd8"}]}}},"left":{"wall":[[448.6,185],[348,185],[308.9,181.6],[271.0,171.4],[235.5,154.9],[203.4,132.4],[175.6,104.6],[153.1,72.5],[136.6,37.0],[126.4,-0.9],[123.0,-40.0],[126.4,-79.1],[136.6,-117.0]],"items":[{"id":"mk_booth","zone":"marketing","x":524.02,"z":159.7,"turn":0,"w":161.16,"dep":13.77,"yb":372.0,"yt":146.09,"st":"frame","deco":[{"t":"r","f":[0.23,0.91,0.23,0.54],"fill":"#0c3a7a","line":"#3be8ff"},{"t":"r","f":[0.27,0.56,0.25,0.52],"fill":"#1a5ab0","line":"#7af4ff"},{"t":"r","f":[0.59,0.88,0.25,0.52],"fill":"#1a5ab0","line":"#7af4ff"},{"t":"bars","f":[0.29,0.53,0.35,0.51],"n":5,"fill":"#7af4ff"},{"t":"c","f":[0.73,0.38,0.08],"line":"#7af4ff","lw":1}],"ch":[8.26,8.26]},{"id":"mk_sign","zone":"marketing","x":528.15,"z":156.12,"turn":0,"w":133.61,"dep":3.44,"yb":186.04,"yt":152.98,"st":"dark","deco":[{"t":"r","f":[0,1,0,1],"fill":"#0a0620","line":"#ff4fd8","lw":1.2},{"t":"c","f":[0.14,0.5,0.06],"line":"#7af4ff","lw":1.1},{"t":"txt","f":[0.26,0.97,0.16,0.86],"key":"nav.marketing","col":"#7af4ff"}]},{"id":"mk_deskL","zone":"marketing","x":424.84,"z":117.0,"turn":0,"w":183.2,"dep":41.32,"yb":372.0,"yt":293.48,"st":"desk","deco":[{"t":"l","f":[0,0.04,1,0.04],"col":"#ff4fd8","lw":1.2},{"t":"r","f":[0.1,0.23,0.18,0.93],"fill":"#1a1238","line":"#6a4ab0"},{"t":"l","f":[0.1,0.42,0.23,0.42],"col":"#6a4ab0"},{"t":"l","f":[0.1,0.67,0.23,0.67],"col":"#6a4ab0"}]},{"id":"mk_deskR","zone":"marketing","x":622.51,"z":117.0,"turn":0,"w":63.36,"dep":41.32,"yb":372.0,"yt":293.48,"st":"desk","deco":[{"t":"l","f":[0,0.04,1,0.04],"col":"#ff4fd8","lw":1.2},{"t":"r","f":[0.28,0.72,0.18,0.93],"fill":"#1a1238","line":"#6a4ab0"},{"t":"l","f":[0.28,0.42,0.72,0.42],"col":"#6a4ab0"},{"t":"l","f":[0.28,0.67,0.72,0.67],"col":"#6a4ab0"}]},{"id":"mk_chairB","zone":"marketing","x":553.64,"z":134.22,"turn":0,"w":44.08,"dep":6.89,"yb":323.79,"yt":274.2,"st":"chair"},{"id":"mk_seat","zone":"marketing","x":553.64,"z":103.23,"turn":0,"w":55.1,"dep":30.3,"yb":333.43,"yt":321.03,"st":"chair"},{"id":"mk_chairBase","zone":"marketing","x":553.64,"z":111.49,"turn":0,"w":22.04,"dep":13.77,"yb":372.0,"yt":333.43,"st":"dark","cyl":8},{"id":"mk_post","zone":"marketing","x":426.22,"z":163.83,"turn":0,"w":9.64,"dep":6.89,"yb":372.0,"yt":141.96,"st":"dark"},{"id":"mk_bulb","zone":"marketing","x":426.91,"z":159.01,"turn":0,"w":41.32,"dep":16.53,"yb":141.96,"yt":95.13,"st":"lamp","on":"mk_post","glow":1,"cyl":10,"gr":44},{"id":"mk_plant1","zone":"marketing","x":378.01,"z":128.02,"turn":0,"w":34.44,"dep":19.28,"yb":293.48,"yt":268.69,"st":"pot","on":"mk_deskL","plant":1,"cyl":10,"fw":55.1,"fh":49.59},{"id":"mk_plant2","zone":"marketing","x":448.95,"z":125.26,"turn":0,"w":33.06,"dep":19.28,"yb":293.48,"yt":271.44,"st":"pot","on":"mk_deskL","plant":1,"cyl":10,"fw":49.59,"fh":41.32},{"id":"mk_lampR","zone":"marketing","x":626.64,"z":128.02,"turn":0,"w":30.3,"dep":16.53,"yb":293.48,"yt":243.9,"st":"lamp","on":"mk_deskR","glow":1,"gr":36},{"id":"mk_stand","zone":"marketing","x":378.7,"z":162.46,"turn":0,"w":30.3,"dep":13.77,"yb":372.0,"yt":224.61,"st":"stand"},{"id":"mk_standPot","zone":"marketing","x":378.7,"z":163.15,"turn":0,"w":41.32,"dep":12.4,"yb":224.61,"yt":194.31,"st":"pot","on":"mk_stand","plant":1,"cyl":10,"fw":74.38,"fh":63.36},{"id":"an_booth","zone":"analytics","x":362.26,"z":50.99,"turn":-36,"w":112.87,"dep":17.39,"yb":372.0,"yt":165.44,"st":"frame","deco":[{"t":"r","f":[0.1,0.45,0.25,0.51],"fill":"#0c3a7a","line":"#3be8ff"},{"t":"bars","f":[0.13,0.41,0.29,0.49],"n":6,"fill":"#7af4ff"},{"t":"r","f":[0.49,0.84,0.26,0.49],"fill":"#0c3a7a","line":"#3be8ff"},{"t":"c","f":[0.66,0.38,0.1],"fill":"#1a5ab0","line":"#7af4ff","lw":1}],"ch":[7.05,8.7]},{"id":"an_sign","zone":"analytics","x":363.78,"z":47.39,"turn":-36,"w":79.36,"dep":3.26,"yb":208.93,"yt":179.58,"st":"dark","deco":[{"t":"r","f":[0,1,0,1],"fill":"#0a0620","line":"#3be8ff","lw":1.2},{"t":"c","f":[0.17,0.5,0.08],"line":"#7af4ff","lw":1.1},{"t":"txt","f":[0.32,0.97,0.16,0.86],"key":"nav.analytics","col":"#7af4ff"}]},{"id":"an_plantTop","zone":"analytics","x":371.68,"z":60.52,"turn":-36,"w":38.8,"dep":13.05,"yb":165.44,"yt":154.57,"st":"pot","on":"an_booth","plant":1,"cyl":10,"fw":79.36,"fh":71.75},{"id":"an_desk","zone":"analytics","x":383.48,"z":18.03,"turn":-36,"w":147.26,"dep":36.96,"yb":372.0,"yt":306.77,"st":"desk","deco":[{"t":"l","f":[0,0.04,1,0.04],"col":"#ff4fd8","lw":1.2},{"t":"r","f":[0.87,0.99,0.17,0.93],"fill":"#1a1238","line":"#6a4ab0"},{"t":"r","f":[0.03,0.15,0.17,0.93],"fill":"#1a1238","line":"#6a4ab0"}]},{"id":"an_scr","zone":"analytics","x":420.96,"z":58.7,"turn":-36,"w":24.69,"dep":6.52,"yb":306.77,"yt":276.33,"st":"screen","on":"an_desk","deco":[{"t":"r","f":[0.1,0.9,0.1,0.8],"fill":"#3be8ff"}]},{"id":"an_mug","zone":"analytics","x":334.5,"z":-6.81,"turn":-36,"w":8.82,"dep":8.7,"yb":306.77,"yt":295.9,"st":"item","on":"an_desk","cyl":8},{"id":"an_chairB","zone":"analytics","x":421.97,"z":0.31,"turn":-36,"w":31.74,"dep":5.44,"yb":335.04,"yt":287.2,"st":"chair"},{"id":"an_seat","zone":"analytics","x":418.46,"z":5.15,"turn":-36,"w":38.8,"dep":23.92,"yb":339.39,"yt":328.51,"st":"chair"},{"id":"an_chairBase","zone":"analytics","x":414.3,"z":10.86,"turn":-36,"w":14.11,"dep":10.87,"yb":372.0,"yt":339.39,"st":"dark","cyl":8},{"id":"an_potL","zone":"analytics","x":325.85,"z":-53.4,"turn":-36,"w":24.69,"dep":23.92,"yb":372.0,"yt":332.86,"st":"pot","plant":1,"cyl":10,"fw":45.85,"fh":52.18},{"id":"an_poster","zone":"analytics","x":360.15,"z":62.9,"turn":-36,"w":38.8,"dep":3.26,"yb":135.01,"yt":102.39,"st":"neon","deco":[{"t":"c","f":[0.5,0.5,0.25],"line":"#ff4fd8","lw":1.4}]},{"id":"ai_top","zone":"ai","x":240.05,"z":-29.6,"turn":-86,"w":186.92,"dep":37.56,"yb":322.7,"yt":314.88,"st":"desk","deco":[{"t":"r","f":[0,1,0,0.6],"fill":"#ff7ad0"}]},{"id":"ai_drawers","zone":"ai","x":233.81,"z":-29.16,"turn":-86,"w":24.92,"dep":29.73,"yb":372.0,"yt":322.7,"st":"desk","deco":[{"t":"r","f":[0.1,0.9,0.06,0.32],"fill":"#140c30","line":"#6a4ab0"},{"t":"r","f":[0.1,0.9,0.38,0.64],"fill":"#140c30","line":"#6a4ab0"},{"t":"r","f":[0.1,0.9,0.7,0.96],"fill":"#140c30","line":"#6a4ab0"}],"notop":1},{"id":"ai_legL","zone":"ai","x":226.07,"z":-117.31,"turn":-86,"w":4.98,"dep":26.6,"yb":372.0,"yt":322.7,"st":"dark","notop":1},{"id":"ai_legR","zone":"ai","x":238.42,"z":59.21,"turn":-86,"w":4.98,"dep":26.6,"yb":372.0,"yt":322.7,"st":"dark","notop":1},{"id":"ai_screen","zone":"ai","x":204.73,"z":-41.18,"turn":-86,"w":100.32,"dep":6.26,"yb":314.88,"yt":124.73,"st":"neon","deco":[{"t":"r","f":[0.05,0.95,0.03,0.97],"fill":"#0a1a5a","line":"#3be8ff"},{"t":"bars","f":[0.1,0.33,0.26,0.46],"n":6,"fill":"#3be8ff"},{"t":"bars","f":[0.1,0.33,0.49,0.68],"n":6,"fill":"#3be8ff"},{"t":"c","f":[0.57,0.47,0.2],"line":"#7af4ff","lw":1.6},{"t":"c","f":[0.57,0.47,0.12],"line":"#7af4ff","lw":1},{"t":"grid","f":[0.78,0.95,0.3,0.91],"nx":1,"ny":5,"gap":0.08,"fill":"#0e2a6a","line":"#7af4ff","icon":"#7af4ff"}],"ch":[6.23,7.82]},{"id":"ai_sign","zone":"ai","x":206.72,"z":-40.7,"turn":-86,"w":89.1,"dep":1.56,"yb":166.2,"yt":137.25,"st":"dark","deco":[{"t":"r","f":[0,1,0,1],"fill":"#0a0620","line":"#3be8ff","lw":1.2},{"t":"c","f":[0.14,0.5,0.07],"line":"#7af4ff","lw":1.1},{"t":"txt","f":[0.27,0.97,0.16,0.86],"key":"nav.ai","col":"#7af4ff"}]},{"id":"ai_mon","zone":"ai","x":219.79,"z":-95.01,"turn":-86,"w":56.08,"dep":4.69,"yb":314.88,"yt":249.93,"st":"screen","on":"ai_top","deco":[{"t":"r","f":[0.06,0.94,0.07,0.86],"fill":"#0c3a7a","line":"#3be8ff"},{"t":"bars","f":[0.12,0.88,0.2,0.8],"n":7,"fill":"#7af4ff"}]},{"id":"ai_holoB","zone":"ai","x":225.48,"z":-36.07,"turn":-86,"w":22.43,"dep":12.52,"yb":314.88,"yt":308.62,"st":"dark","on":"ai_top","cyl":10,"band":1},{"id":"ai_holo","zone":"ai","x":219.23,"z":-35.64,"turn":-86,"w":32.4,"dep":1.56,"yb":308.62,"yt":255.41,"st":"glass","on":"ai_holoB","deco":[{"t":"c","f":[0.5,0.45,0.36],"line":"#7af4ff","lw":1.6},{"t":"c","f":[0.5,0.45,0.2],"line":"#9af8ff","lw":1}]},{"id":"ai_laptop","zone":"ai","x":232.71,"z":22.45,"turn":-86,"w":25.55,"dep":10.95,"yb":314.88,"yt":292.97,"st":"screen","on":"ai_top","deco":[{"t":"r","f":[0.1,0.9,0.1,0.9],"fill":"#1a5ab0","line":"#7af4ff"}]},{"id":"ai_mug","zone":"ai","x":237.07,"z":39.94,"turn":-86,"w":6.23,"dep":6.26,"yb":314.88,"yt":305.49,"st":"item","on":"ai_top","cyl":8},{"id":"ai_lampS","zone":"ai","x":217.54,"z":-59.88,"turn":-86,"w":9.97,"dep":7.82,"yb":314.88,"yt":286.71,"st":"lamp","on":"ai_top","glow":1,"cyl":8},{"id":"ai_shelfTop","zone":"ai","x":202.1,"z":-56.3,"turn":-86,"w":99.69,"dep":6.26,"yb":122.38,"yt":114.56,"st":"shelf"},{"id":"ai_top1","zone":"ai","x":199.32,"z":-84.84,"turn":-86,"w":38.63,"dep":2.35,"yb":114.56,"yt":89.52,"st":"screen","on":"ai_shelfTop","deco":[{"t":"r","f":[0.06,0.94,0.1,0.9],"fill":"#0c3a7a","line":"#3be8ff"},{"t":"bars","f":[0.12,0.88,0.25,0.85],"n":6,"fill":"#7af4ff"}]},{"id":"ai_top2","zone":"ai","x":202.45,"z":-40.08,"turn":-86,"w":38.63,"dep":2.35,"yb":114.56,"yt":89.52,"st":"screen","on":"ai_shelfTop","deco":[{"t":"r","f":[0.06,0.94,0.1,0.9],"fill":"#0c3a7a","line":"#3be8ff"}]},{"id":"ai_lampO","zone":"ai","x":203.97,"z":-12.71,"turn":-86,"w":8.72,"dep":3.13,"yb":114.56,"yt":97.34,"st":"lamp","on":"ai_shelfTop","glow":1,"gr":40},{"id":"ai_shelf","zone":"ai","x":208.71,"z":38.18,"turn":-86,"w":56.08,"dep":6.26,"yb":314.88,"yt":119.25,"st":"shelf","deco":[{"t":"l","f":[0,0.1,1,0.1],"col":"#c86aff","lw":1.6},{"t":"l","f":[0,0.34,1,0.34],"col":"#c86aff","lw":1.6},{"t":"l","f":[0,0.58,1,0.58],"col":"#c86aff","lw":1.6},{"t":"l","f":[0,0.8,1,0.8],"col":"#c86aff","lw":1.6},{"t":"r","f":[0.2,0.82,0.12,0.25],"fill":"#0c3a7a","line":"#3be8ff"},{"t":"r","f":[0.2,0.82,0.48,0.61],"fill":"#0c3a7a","line":"#3be8ff"},{"t":"c","f":[0.5,0.37,0.08],"fill":"#d8a030"},{"t":"c","f":[0.67,0.04,0.07],"fill":"#ff7af0"}]},{"id":"ai_ped","zone":"ai","x":194.29,"z":-100.72,"turn":-86,"w":21.18,"dep":7.82,"yb":372.0,"yt":274.19,"st":"stand"},{"id":"ai_fern","zone":"ai","x":193.9,"z":-100.7,"turn":-86,"w":23.68,"dep":7.04,"yb":274.19,"yt":260.1,"st":"pot","on":"ai_ped","plant":1,"cyl":10,"fw":49.85,"fh":54.77},{"id":"ai_potBL","zone":"ai","x":254.57,"z":-113.68,"turn":-86,"w":21.18,"dep":18.78,"yb":372.0,"yt":336.79,"st":"pot","plant":1,"cyl":10,"fw":27.42,"fh":32.86},{"id":"ai_potUnder","zone":"ai","x":232.6,"z":-1.59,"turn":-86,"w":17.45,"dep":14.08,"yb":372.0,"yt":354.0,"st":"pot","plant":1,"cyl":10,"fw":21.18,"fh":17.21},{"id":"ai_stone0","zone":"ai","x":259.25,"z":-91.53,"turn":-86,"w":16.2,"dep":10.95,"yb":372.0,"yt":361.83,"st":"stone","ch":[3.12,3.91]},{"id":"ai_stone1","zone":"ai","x":258.26,"z":-72.09,"turn":-86,"w":14.95,"dep":10.95,"yb":372.0,"yt":361.83,"st":"stone","ch":[3.12,3.91]},{"id":"ai_stone2","zone":"ai","x":257.22,"z":-53.28,"turn":-86,"w":14.95,"dep":10.95,"yb":372.0,"yt":361.83,"st":"stone","ch":[3.12,3.91]}],"cols":[{"id":"col0","x":313.1,"z":157.9,"turn":-10,"w":24,"dep":20,"yb":372,"yt":-240,"st":"col","deco":[{"t":"l","f":[0.5,0.02,0.5,0.98],"col":"#ff4fd8","lw":1.4},{"t":"r","f":[0.1,0.9,0.2,0.22],"fill":"#5a4ab0"},{"t":"r","f":[0.1,0.9,0.45,0.47],"fill":"#5a4ab0"},{"t":"r","f":[0.1,0.9,0.7,0.71],"fill":"#5a4ab0"}]},{"id":"col1","x":194.0,"z":89.2,"turn":-50,"w":24,"dep":20,"yb":372,"yt":-240,"st":"col","deco":[{"t":"l","f":[0.5,0.02,0.5,0.98],"col":"#ff4fd8","lw":1.4},{"t":"r","f":[0.1,0.9,0.2,0.22],"fill":"#5a4ab0"},{"t":"r","f":[0.1,0.9,0.45,0.47],"fill":"#5a4ab0"},{"t":"r","f":[0.1,0.9,0.7,0.71],"fill":"#5a4ab0"}]}],"armZone":"marketing","hang":[{"x":164.8,"z":26.7,"len":90,"kind":"vine","turn":-70,"from":-60},{"x":154.9,"z":8.1,"len":70,"kind":"vine","turn":-76,"from":-60},{"x":229.1,"z":101.7,"len":60,"kind":"vine","turn":-40,"from":-60},{"x":255.5,"z":120.2,"len":70,"kind":"red","turn":-30,"from":-40}]}};   // згенеровано scratchpad gen_room.py
  const ALL = window.RWBOX || LAYOUT || {};
  // палітри: front / side / top / acc (кант)
  const ST = {
    base: ['#1c1546', '#120e30', '#2a2058', '#ff4fd8'], frame: ['#2a1650', '#180c34', '#3a2068', '#ff4fd8'], dome: ['#2c2460', '#1a1640', '#3e347c', '#3be8ff'],
    tablet: ['#0c2a5a', '#081a3a', '#123468', '#3be8ff'], fig: ['#3a2a6a', '#24184a', '#4a3a80', '#c8a0ff'], term: ['#16204a', '#0c1430', '#20306a', '#3be8ff'],
    mach: ['#1a1440', '#100c2a', '#2a2058', '#ff9a3a'], bench: ['#1a1238', '#100a26', '#3a1c5a', '#ff7ad0'], board: ['#0e1a4a', '#081030', '#14245a', '#3be8ff'],
    bot: ['#5a2a8a', '#3a1a5a', '#7a3aaa', '#e0a0ff'], item: ['#2a2460', '#1a1640', '#3a3480', '#9a8ae0'], stand: ['#221a4e', '#140f32', '#30266a', '#8a7ad0'],
    dais: ['#241a58', '#160f3a', '#33247a', '#d98aff'], pframe: ['#2a1260', '#1a0a40', '#3a1c78', '#d98aff'], gold: ['#a8741c', '#6a4810', '#d8a030', '#ffd27a'],
    pot: ['#5a3a2a', '#3a2418', '#7a4a30', '#c08060'], col: ['#1e1850', '#120e34', '#2a2468', '#5a4ab0'], shelf: ['#2a2058', '#1a1440', '#3a2c78', '#8a7ad0'],
    lamp: ['#ffb24a', '#c0782a', '#ffd27a', '#ffd27a'], clamp: ['#3be8ff', '#1a8aa8', '#8af4ff', '#8af4ff'], screen: ['#0a2a6a', '#081a40', '#123470', '#3be8ff'],
    desk: ['#241a4a', '#160f30', '#3a2a68', '#ff7ad0'], dark: ['#120e2a', '#0a0818', '#1c1640', '#5a4ab0'], neon: ['#3a1a6a', '#22104a', '#4a2a80', '#ff4fd8'],
    stone: ['#3a3a6a', '#24244a', '#4a4a80', '#7a7ab0'], glass: ['#1a3a8a', '#10246a', '#2a4aa0', '#7af4ff'], chair: ['#1c1a3a', '#100e24', '#2a2650', '#6a5ab0'],
  };
  const sty = k => ST[k] || ST.base;

  // ---------- криві ----------
  function catmull(pts, n = 6) {
    if (!pts || pts.length < 2) return (pts || []).slice();
    const P = [pts[0], ...pts, pts[pts.length - 1]], out = [];
    for (let i = 1; i < P.length - 2; i++) {
      const [p0, p1, p2, p3] = [P[i - 1], P[i], P[i + 1], P[i + 2]];
      for (let k = 0; k < n; k++) { const t = k / n, t2 = t * t, t3 = t2 * t; out.push([0, 1].map(c => .5 * (2 * p1[c] + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3))); }
    }
    out.push(pts[pts.length - 1]); return out;
  }

  // ---------- об'єм: коробка або циліндр ----------
  /** (x, z) — середина передньої грані на підлозі; turn — поворот до центру (°); ch — [зріз лівого, правого верхнього кута]; cyl — к-сть граней циліндра. */
  function geo(B) {
    const a = (B.turn || 0) * Math.PI / 180, f = [-Math.sin(a), -Math.cos(a)], r = [-f[1], f[0]];
    const c = [B.x - f[0] * (B.back || 0), B.z - f[1] * (B.back || 0)];
    const P = (u, v, y) => [c[0] + r[0] * u - f[0] * v, y, c[1] + r[1] * u - f[1] * v];
    const w = B.w / 2, d = B.dep, yb = B.yb, yt = B.yt;
    const toEye = pts => { const m = [0, 2].map(i => pts.reduce((s, q) => s + q[i], 0) / pts.length); return [EYE[0] - m[0], EYE[1] - m[1]]; };
    const dot = (n, v) => n[0] * v[0] + n[1] * v[1];
    if (B.cyl) {
      const n = B.cyl, ring = y => Array.from({ length: n }, (_, i) => { const t = (i + .5) / n * Math.PI * 2; return P(w * Math.cos(t), d / 2 + d / 2 * Math.sin(t), y); });
      const rb = ring(yb), rt = ring(yt), sides = [];
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n, t = (i + 1) / n * Math.PI * 2, nn = [r[0] * Math.cos(t) - f[0] * Math.sin(t), r[1] * Math.cos(t) - f[1] * Math.sin(t)];
        const q = [rb[i], rb[j], rt[j], rt[i]]; sides.push({ q, vis: dot(nn, toEye(q)) > 0, k: .55 + .45 * Math.max(0, -nn[0] * .6 - nn[1] * .8) });
      }
      return { B, F: { sides, top: rt, front: rt }, P, fp: rb.map(p => [p[0], p[2]]), zc: c[1] + d / 2, cyl: true, vis: { top: yt > VP[1] } };
    }
    const [cl, crr] = B.ch || [0, 0];
    const front = cl || crr ? [P(-w, 0, yb), P(w, 0, yb), P(w, 0, yt + crr), P(w - crr, 0, yt), P(-w + cl, 0, yt), P(-w, 0, yt + cl)] : [P(-w, 0, yb), P(w, 0, yb), P(w, 0, yt), P(-w, 0, yt)];
    const F = { front, left: [P(-w, d, yb), P(-w, 0, yb), P(-w, 0, yt + cl), P(-w, d, yt + cl)], right: [P(w, 0, yb), P(w, d, yb), P(w, d, yt + crr), P(w, 0, yt + crr)],
      top: [P(-w + cl, d, yt), P(w - crr, d, yt), P(w - crr, 0, yt), P(-w + cl, 0, yt)] };
    const fp = [[P(-w, 0, 0)[0], P(-w, 0, 0)[2]], [P(w, 0, 0)[0], P(w, 0, 0)[2]], [P(w, d, 0)[0], P(w, d, 0)[2]], [P(-w, d, 0)[0], P(-w, d, 0)[2]]];
    return { B, F, P, fp, zc: c[1], vis: { front: dot(f, toEye(F.front)) > 0, left: dot([-r[0], -r[1]], toEye(F.left)) > 0, right: dot(r, toEye(F.right)) > 0, top: yt > VP[1] } };
  }
  const path = (c, pts) => { c.beginPath(); pts.forEach((q, i) => { const [x, y] = pr(q); i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.closePath(); };
  const face = (c, pts, fill, line, lw = .7) => { path(c, pts); if (fill) { c.fillStyle = fill; c.fill(); } if (line) { c.strokeStyle = line; c.lineWidth = lw; c.stroke(); } };
  const seg = (c, a, b, col, lw = .7) => { const [x0, y0] = pr(a), [x1, y1] = pr(b); c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); };
  const haze = (c, pts, z) => { const k = Math.max(0, Math.min(.38, z / 400)); if (k > .01) face(c, pts, `rgba(6,4,20,${k.toFixed(3)})`); };
  const mix = (hex, k) => { const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255; return `rgb(${Math.round(r * k)},${Math.round(g * k)},${Math.round(b * k)})`; };

  // ---------- оздоби на лицьовій грані (частки ширини fu й висоти fy) ----------
  const FPt = (q, fu, fy) => q.P(-q.B.w / 2 + fu * q.B.w, -.3, q.B.yt + fy * (q.B.yb - q.B.yt));
  function text(c, q, d) {
    const [u0, u1, v0, v1] = d.f, A = pr(FPt(q, u0, v0)), B = pr(FPt(q, u1, v0)), Cc = pr(FPt(q, u0, v1));
    const s = d.key ? NX.t(d.key) : d.s; c.save(); c.transform((B[0] - A[0]) / 100, (B[1] - A[1]) / 100, (Cc[0] - A[0]) / 20, (Cc[1] - A[1]) / 20, A[0], A[1]);
    c.font = '13px "Press Start 2P", monospace'; const w = c.measureText(s).width, k = Math.min(1, 92 / w); c.translate(50, 10); c.scale(k, 1);
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = d.col || '#7af4ff'; c.fillText(s, 0, 1); c.restore();
  }
  function deco(c, q, d, t) {
    const R = (u0, u1, v0, v1) => [FPt(q, u0, v1), FPt(q, u1, v1), FPt(q, u1, v0), FPt(q, u0, v0)];
    const asp = q.B.w / Math.max(1, q.B.yb - q.B.yt);
    switch (d.t) {
      case 'r': face(c, R(...d.f), d.fill, d.line, d.lw || .7); break;
      case 'ch': { const [u0, u1, v0, v1] = d.f, k = d.k || .15, kv = k * (u1 - u0) * asp; face(c, [FPt(q, u0, v1), FPt(q, u1, v1), FPt(q, u1, v0 + kv), FPt(q, u1 - k * (u1 - u0), v0), FPt(q, u0 + k * (u1 - u0), v0), FPt(q, u0, v0 + kv)], d.fill, d.line, d.lw || .8); break; }
      case 'c': { const [cu, cv, ru] = d.f; face(c, Array.from({ length: 20 }, (_, i) => { const a = i / 20 * Math.PI * 2; return FPt(q, cu + ru * Math.cos(a), cv + ru * asp * Math.sin(a) * (d.ky || 1)); }), d.fill, d.line, d.lw || .7); break; }
      case 'l': seg(c, FPt(q, d.f[0], d.f[1]), FPt(q, d.f[2], d.f[3]), d.col, d.lw || 1); break;
      case 'p': face(c, d.pts.map(([u, v]) => FPt(q, u, v)), d.fill, d.line, d.lw || .7); break;
      case 'bars': { const [u0, u1, v0, v1] = d.f, n = d.n || 6; for (let i = 0; i < n; i++) { const h = .25 + .75 * Math.abs(Math.sin(i * 1.9 + 1.3)), cw = (u1 - u0) / n; face(c, R(u0 + i * cw + cw * .15, u0 + (i + 1) * cw - cw * .15, v1 - (v1 - v0) * h, v1), d.fill, d.line, .5); } break; }
      case 'grid': { const [u0, u1, v0, v1] = d.f, nx = d.nx, ny = d.ny, g = d.gap || .04, cw = (u1 - u0) / nx, chh = (v1 - v0) / ny;
        for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { face(c, R(u0 + i * cw + g * cw, u0 + (i + 1) * cw - g * cw, v0 + j * chh + g * chh, v0 + (j + 1) * chh - g * chh), d.fill, d.line, .6); if (d.icon) deco(c, q, { t: 'c', f: [u0 + (i + .5) * cw, v0 + (j + .5) * chh, cw * .22], fill: null, line: d.icon, lw: 1 }); } break; }
      case 'txt': text(c, q, d); break;
      case 'arch': {
        const [u0, u1, v0, v1] = d.f, sp = d.spring, pts = [FPt(q, u0, v1)];
        for (let i = 0; i <= 24; i++) { const a = Math.PI * i / 24; pts.push(FPt(q, (u0 + u1) / 2 - (u1 - u0) / 2 * Math.cos(a), sp - (sp - v0) * Math.sin(a))); }
        pts.push(FPt(q, u1, v1)); face(c, pts, d.fill, d.line, d.lw || 1.2);
        if (d.vortex) { const [cu, cv] = d.vortex; [[.86, '#3a1890'], [.7, '#4a22a8'], [.54, '#6a3ad8'], [.38, '#8a5af0'], [.22, '#b49af8'], [.09, '#eae0ff']].forEach(([rr, col], k) => face(c, Array.from({ length: 30 }, (_, i) => { const a = Math.PI * 2 * i / 30 + t * (k % 2 ? .5 : -.5); return FPt(q, cu + rr * (u1 - u0) / 2 * Math.cos(a), cv + rr * (u1 - u0) / 2 * asp * Math.sin(a)); }), col)); }
        break;
      }
    }
  }
  // ---------- рослина: листя віялом над вазоном (hangs — звисає вниз) ----------
  function foliage(c, q, t) {
    const B = q.B, top = q.P(0, B.dep / 2, B.hangs ? B.yb : B.yt), [X, Y] = pr(top), k = PZ.s(top[2]), fw = (B.fw || B.w * 1.6) * k, fh = (B.fh || B.w * 1.4) * k, n = B.leaves || 9;
    const seed = Math.abs(Math.sin(B.x * 12.9898 + B.z * 78.233)), down = B.hangs ? 1 : 0;
    for (let i = 0; i < n; i++) {
      const a = (down ? Math.PI / 2 : -Math.PI / 2) + (i / (n - 1) - .5) * (down ? 1.4 : 2.4), sw = Math.sin(t * .8 + i + seed * 6) * .04, len = fh * (.62 + .38 * Math.abs(Math.cos(i * 1.7 + seed * 9)));
      c.save(); c.translate(X, Y); c.rotate(a + Math.PI / 2 + sw); c.fillStyle = B.leaf ? B.leaf[i % B.leaf.length] : i % 3 === 0 ? '#2e8a4a' : i % 3 === 1 ? '#3aa858' : '#24703c'; c.strokeStyle = '#0e3a1e'; c.lineWidth = .6;
      c.beginPath(); c.ellipse(0, -len / 2, Math.max(1.2, fw / n * 1.15), len / 2, 0, 0, Math.PI * 2); c.fill(); c.stroke(); c.restore();
    }
  }
  function glow(c, q) { const B = q.B, m = q.P(0, B.dep / 2, (B.yb + B.yt) / 2), [X, Y] = pr(m), r = (B.gr || 26) * PZ.s(m[2]), col = B.gcol || '255,190,110';
    c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(X, Y, 0, X, Y, r); g.addColorStop(0, `rgba(${col},.42)`); g.addColorStop(1, `rgba(${col},0)`); c.fillStyle = g; c.fillRect(X - r, Y - r, r * 2, r * 2); c.restore(); }

  function drawItem(c, it, t, mode) {                                                                   // mode: 'top' — лише верх, 'body' — без верху
    const q = it.q, B = q.B, [front, side, top, acc] = sty(B.st), F = q.F, vis = q.vis, zh = q.zc + B.dep / 2;
    if (q.cyl) {
      if (mode !== 'top') F.sides.forEach(s => { if (s.vis) face(c, s.q, mix(front, s.k), null); });
      if (mode !== 'body' && vis.top && !B.notop) face(c, F.top, top, acc + '99', .6);
      if (mode !== 'top') { F.sides.forEach(s => { if (s.vis) haze(c, s.q, zh); }); if (B.band) F.sides.forEach(s => { if (s.vis) seg(c, s.q[3], s.q[2], acc, 1.2); }); }
      if (mode !== 'top' && B.plant) foliage(c, q, t);
      if (mode !== 'top' && B.glow) glow(c, q);
      return;
    }
    if (mode !== 'body' && vis.top && B.yt > VP[1] && !B.notop) { face(c, F.top, top, acc + '88', .5); haze(c, F.top, zh); }
    if (mode === 'top') return;
    if (vis.left) { face(c, F.left, side, acc + '77', .5); haze(c, F.left, zh); }
    if (vis.right) { face(c, F.right, side, acc + '77', .5); haze(c, F.right, zh); }
    face(c, F.front, front, acc, .9);
    (B.deco || []).forEach(d => deco(c, q, d, t));
    haze(c, F.front, q.zc);
    if (B.plant) foliage(c, q, t);
    if (B.glow) glow(c, q);
  }

  // ---------- порядок: «стоїть на» + роздільна лінія в плані (лише де обриси на екрані перекриваються) ----------
  function hull(pts) {
    pts = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
    for (const p of pts) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
    for (const p of pts.slice().reverse()) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
    return lo.slice(0, -1).concat(up.slice(0, -1));
  }
  function nearer(A, B) {
    for (const [poly, other, sign] of [[A, B, 1], [B, A, -1]]) {
      const n = poly.length, cx = poly.reduce((s, p) => s + p[0], 0) / n, cz = poly.reduce((s, p) => s + p[1], 0) / n;
      for (let i = 0; i < n; i++) {
        const a = poly[i], b = poly[(i + 1) % n]; let nx = b[1] - a[1], nz = -(b[0] - a[0]);
        if (nx * (cx - a[0]) + nz * (cz - a[1]) > 0) { nx = -nx; nz = -nz; }
        if (other.every(q => nx * (q[0] - a[0]) + nz * (q[1] - a[1]) >= -.01)) return (nx * (EYE[0] - a[0]) + nz * (EYE[1] - a[1]) > 0) ? -sign : sign;
      }
    }
    return 0;
  }
  function overlap(A, B) {
    for (const poly of [A, B]) for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length], nx = b[1] - a[1], ny = -(b[0] - a[0]);
      const pa = A.map(p => nx * p[0] + ny * p[1]), pb = B.map(p => nx * p[0] + ny * p[1]);
      if (Math.max(...pa) <= Math.min(...pb) + .01 || Math.max(...pb) <= Math.min(...pa) + .01) return false;
    }
    return true;
  }
  function plan(list) {
    const byId = {}, out = [];
    list.forEach(B => { const q = geo(B); byId[B.id] = { B, q, kids: [] }; });
    list.forEach(B => { if (B.on && byId[B.on]) byId[B.on].kids.push(byId[B.id]); });
    const items = [];
    Object.values(byId).forEach(n => {
      if (n.kids.length) { n.top = { n, q: n.q, mode: 'top', after: [] }; n.body = { n, q: n.q, mode: 'body', after: [n.top] }; items.push(n.top, n.body); }
      else { n.all = { n, q: n.q, mode: 'all', after: [] }; items.push(n.all); }
    });
    const parts = n => n.kids.length ? [n.top, n.body] : [n.all];
    const under = n => { const s = []; let p = n.B.on && byId[n.B.on]; while (p) { s.push(p); p = p.B.on && byId[p.B.on]; } return s; };
    Object.values(byId).forEach(n => { if (n.B.on && byId[n.B.on]) { const p = byId[n.B.on]; parts(n).forEach(it => it.after.push(p.top)); p.body.after.push(...parts(n)); } });
    items.forEach(it => {
      const F = it.q.F; let pts;
      if (it.q.cyl) pts = [...F.top, ...F.sides.flatMap(s => s.q)]; else pts = it.mode === 'top' ? F.top : [...F.front, ...F.top, ...F.left, ...F.right];
      if (it.q.B.plant) { const B = it.q.B, top = it.q.P(0, B.dep / 2, B.hangs ? B.yb : B.yt), fw = (B.fw || B.w * 1.6) / 2, fh = (B.fh || B.w * 1.4) * (B.hangs ? -1 : 1); pts = pts.concat([[top[0] - fw, top[1] - fh, top[2]], [top[0] + fw, top[1] - fh, top[2]], [top[0] - fw, top[1], top[2]], [top[0] + fw, top[1], top[2]]]); }
      it.scr = hull(pts.map(pr));
    });
    const after = new Map(items.map(it => [it, new Set(it.after)]));
    for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
      const A = items[i], Bb = items[j]; if (A.n === Bb.n) continue;
      const ua = under(A.n), ub = under(Bb.n); if (ua.includes(Bb.n) || ub.includes(A.n)) continue;
      if (!overlap(A.scr, Bb.scr)) continue;
      const k = nearer(A.q.fp, Bb.q.fp); if (k > 0) after.get(A).add(Bb); else if (k < 0) after.get(Bb).add(A);
    }
    const seen = new Set(), visit = it => { if (seen.has(it)) return; seen.add(it); after.get(it).forEach(visit); out.push(it); };
    items.slice().sort((a, b) => Math.max(...b.q.fp.map(p => p[1])) - Math.max(...a.q.fp.map(p => p[1]))).forEach(visit);
    return out;
  }

  // ---------- одне крило: стіна, підлога, екран, антресоль, підвіси, колони, зони ----------
  function side(L, opt) {
    const WALL = catmull(L.wall, 4), EDGE = L.mezz ? L.mezz.edge : [];
    const ZONE = (L.items || []).filter(B => B.layer !== 'up'), UP = (L.items || []).filter(B => B.layer === 'up');
    const ORDER = plan(ZONE), ORDER_UP = plan(UP), COLS = plan(L.cols || []);
    function drawWall(c) {
      for (let i = 0; i + 1 < WALL.length; i++) {
        const [x0, z0] = WALL[i], [x1, z1] = WALL[i + 1], ang = Math.abs(Math.atan2(z0 - z1, Math.abs(x1 - x0))), k = Math.max(0, Math.min(1, 1 - ang / 1.4));
        const col = `rgb(${Math.round(18 + 16 * k)},${Math.round(14 + 12 * k)},${Math.round(42 + 28 * k)})`;
        face(c, [[x0, CEIL, z0], [x1, CEIL, z1], [x1, FL, z1], [x0, FL, z0]], col); face(c, [[x0, CEIL, z0], [x1, CEIL, z1], [x1, FL, z1], [x0, FL, z0]], null, col, .6);
        for (let y = CEIL + 20; y < FL - 10; y += 40) seg(c, [x0, y, z0], [x1, y, z1], '#0a0820', .9);
      }
      let acc = 0; for (let i = 0; i + 1 < WALL.length; i++) {
        const [x0, z0] = WALL[i], [x1, z1] = WALL[i + 1], L0 = Math.hypot(x1 - x0, z1 - z0);
        for (let s = (56 - acc % 56) % 56; s < L0; s += 56) { const u = s / L0, x = x0 + (x1 - x0) * u, z = z0 + (z1 - z0) * u, a = pr([x, CEIL, z]), b = pr([x, FL, z]); c.fillStyle = '#2e2570'; c.fillRect(a[0] - 1.5, a[1], 3, b[1] - a[1]); c.fillStyle = '#4a3ca8'; c.fillRect(a[0] - 1.5, a[1], .8, b[1] - a[1]); }
        acc += L0;
      }
      for (let i = 0; i + 1 < WALL.length; i++) {
        const [x0, z0] = WALL[i], [x1, z1] = WALL[i + 1];
        seg(c, [x0, 150, z0], [x1, 150, z1], '#4a5a8a', 3); seg(c, [x0, 150, z0], [x1, 150, z1], '#8a9ac8', 1);
        seg(c, [x0, FL - 7, z0], [x1, FL - 7, z1], '#ff4fd8', 1.4);
      }
    }
    function drawFloor(c) {
      const W = WALL.map(([x, z]) => pr([x, FL, z])), [a0, a1] = opt.floorX;
      c.fillStyle = '#0d0826'; c.beginPath(); c.moveTo(a0, 368); W.forEach(([x, y]) => c.lineTo(x, y)); c.lineTo(a1, W[W.length - 1][1]); c.lineTo(a1, 368); c.closePath(); c.fill();
      for (let i = -20; i < 20; i++) { const xw = 774 + i * 48; seg(c, [xw, FL, 220], [xw, FL, -60], '#1c1446', .8); }
      for (const z of [160, 120, 85, 55, 28, 5]) seg(c, [-200, FL, z], [1800, FL, z], '#1a1240', .8);
    }
    function drawHub(c) {
      const H = L.hub; if (!H) return;
      const q = geo({ x: (H.x0 + H.x1) / 2, z: H.z, turn: 0, w: H.x1 - H.x0, dep: 2, yb: H.y1, yt: H.y0, deco: H.deco || [] });
      face(c, q.F.front, '#071a5a', '#3be8ff', 1.1); (q.B.deco || []).forEach(d => deco(c, q, d, 0));
      if (H.strip) { const s = H.strip, g = geo({ x: (s.x0 + s.x1) / 2, z: H.z, turn: 0, w: s.x1 - s.x0, dep: 2, yb: s.y1, yt: s.y0, deco: s.deco || [] }); face(c, g.F.front, '#0c1238', '#5a6ad8', .9); g.B.deco.forEach(d => deco(c, g, d, 0)); }
    }
    function nearestWall(p) { let best = null, bd = 1e9; for (let i = 0; i + 1 < WALL.length; i++) { const a = WALL[i], b = WALL[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / (dx * dx + dz * dz))), q = [a[0] + dx * t, a[1] + dz * t], d = Math.hypot(q[0] - p[0], q[1] - p[1]); if (d < bd) { bd = d; best = q; } } return best; }
    function drawSoffit(c) {
      if (!EDGE.length) return;
      const { yb } = L.mezz, W = EDGE.map(nearestWall);
      face(c, [...EDGE.map(p => [p[0], yb, p[1]]), ...W.slice().reverse().map(p => [p[0], yb, p[1]])], '#0a0822');
      EDGE.forEach((p, i) => { if (i % 2) return; const w = W[i]; seg(c, [p[0], yb, p[1]], [w[0], yb, w[1]], '#1a1540', 1.5); });
      for (let i = 0; i + 1 < W.length; i++) seg(c, [W[i][0], yb, W[i][1]], [W[i + 1][0], yb, W[i + 1][1]], '#4a3c9a', 2.2);
    }
    function drawSlab(c) {
      if (!EDGE.length) return;
      const { yt, yb } = L.mezz;
      for (let i = 0; i + 1 < EDGE.length; i++) {
        const [x0, z0] = EDGE[i], [x1, z1] = EDGE[i + 1];
        face(c, [[x0, yt, z0], [x1, yt, z1], [x1, yb, z1], [x0, yb, z0]], '#2a2060');
        seg(c, [x0, yt, z0], [x1, yt, z1], '#ff4fd8', 1.1); seg(c, [x0, yb, z0], [x1, yb, z1], '#ff4fd8', .8);
        seg(c, [x0, (yt + yb) / 2, z0], [x1, (yt + yb) / 2, z1], '#c86aff', 2.2);
      }
      const e0 = EDGE[0], W0 = nearestWall(e0); face(c, [[e0[0], yt, e0[1]], [W0[0], yt, W0[1]], [W0[0], yb, W0[1]], [e0[0], yb, e0[1]]], '#1e1848', '#ff4fd866', .6);
    }
    function drawRail(c) {
      if (!EDGE.length) return;
      const { yt } = L.mezz;
      for (let i = 0; i + 1 < EDGE.length; i++) {
        const [x0, z0] = EDGE[i], [x1, z1] = EDGE[i + 1];
        seg(c, [x0, yt - 24, z0], [x1, yt - 24, z1], '#bcc5e6', 1.4); seg(c, [x0, yt - 12, z0], [x1, yt - 12, z1], '#6a7298', .8);
        seg(c, [x0, yt, z0], [x0, yt - 24, z0], '#848db4', .8);
      }
    }
    function drawHang(c, t) {
      (L.hang || []).forEach(h => {
        const y0 = h.from != null ? h.from : (L.mezz ? L.mezz.yb : 56), y1 = y0 + h.len;
        if (h.kind === 'vine') { const g = geo({ x: h.x, z: h.z, turn: h.turn || 0, w: h.w || 14, dep: 3, yb: y1, yt: y0 }); face(c, g.F.front, '#24703c', '#3aa858', .7); haze(c, g.F.front, h.z); return; }
        seg(c, [h.x, y0, h.z], [h.x, y1, h.z], '#0a0612', 1.1);
        const big = h.kind === 'gold' || h.kind === 'red', g = geo({ x: h.x, z: h.z - 4, turn: h.turn || 0, w: big ? 14 : 8, dep: big ? 14 : 8, yb: y1 + (big ? 22 : 12), yt: y1, st: h.kind === 'red' ? 'neon' : big ? 'gold' : 'lamp', glow: 1, gr: big ? 40 : 26, gcol: h.kind === 'red' ? '255,80,80' : undefined, cyl: big ? 10 : 0 });
        drawItem(c, { q: g }, t);
      });
    }
    function drawArm(c) {
      const A = L.arm; if (!A) return; const P2 = A.map(pr);
      [[6, '#2a2450'], [3.6, '#5a5490'], [1.2, '#9a94d0']].forEach(([lw, col]) => { c.strokeStyle = col; c.lineWidth = lw; c.lineCap = 'round'; c.beginPath(); P2.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke(); });
      P2.forEach(([x, y], i) => { const r = i === 0 || i === P2.length - 1 ? 3 : 5; c.fillStyle = '#3a3470'; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); c.strokeStyle = i === P2.length - 1 ? '#ffb24a' : '#9a94d0'; c.lineWidth = 1; c.stroke(); });
      const [hx, hy] = P2[P2.length - 1]; c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(hx, hy, 0, hx, hy, 14); g.addColorStop(0, 'rgba(255,170,80,.5)'); g.addColorStop(1, 'rgba(255,170,80,0)'); c.fillStyle = g; c.fillRect(hx - 14, hy - 14, 28, 28); c.restore();
    }
    return {
      order: ORDER.map(it => it.n.B.id + ':' + it.mode),
      draw(c, t) {
        c.save(); c.beginPath(); opt.wallClip.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.clip();
        c.fillStyle = '#0b0820'; c.fillRect(opt.fill[0], -2, opt.fill[1] - opt.fill[0], 370);
        drawFloor(c); drawWall(c); drawHub(c);
        c.restore();
        c.save(); c.beginPath(); c.rect(...opt.zoneClip); c.clip();
        COLS.forEach(it => drawItem(c, it, t, it.mode));
        drawSoffit(c); drawSlab(c);
        ORDER_UP.forEach(it => drawItem(c, it, t, it.mode));
        drawRail(c); drawHang(c, t);
        let armDone = false; const lastArm = ORDER.map(it => it.n.B.zone).lastIndexOf(L.armZone || 'workshop');
        ORDER.forEach((it, i) => { drawItem(c, it, t, it.mode); if (i === lastArm && !armDone) { drawArm(c); armDone = true; } });
        if (!armDone) drawArm(c);
        c.restore();
      },
    };
  }
  const Rs = ALL.right && side(ALL.right, { wallClip: [[970, -2], [1547, -2], [1547, 470], [887.5, 470], [887.5, 346], [970, 346]], fill: [887.5, 1547], floorX: [887.5, 1560], zoneClip: [860, -2, 690, 480] });
  const Ls = ALL.left && side(ALL.left, { wallClip: [[-12, -2], [534, -2], [534, 346], [664, 346], [664, 470], [-12, 470]], fill: [-12, 664], floorX: [664, -20], zoneClip: [-12, -2, 700, 480] });
  NX.rwingBox = { ALL, right: Rs && Rs.order, left: Ls && Ls.order };
  if (Ls) NX.addObject({ id: 'lwingBox', rw: true, span: [0, 700], drawBack(c, t) { if (!offDone) { off(); offDone = true; } Ls.draw(c, t); } });
  if (Rs) NX.addObject({ id: 'rwingBox', rw: true, span: [860, 1536], drawBack(c, t) { if (!offDone) { off(); offDone = true; } Rs.draw(c, t); } });
})();
