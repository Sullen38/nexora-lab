/* ============================================================================
 * objects/rwing_box.js — СІРИЙ МАКЕТ ПРАВОГО КРИЛА «ПО ДУЗІ» (лише для погодження; вмикається адресою #rw-box)
 * ----------------------------------------------------------------------------
 * Кімната зверху — пів кола: вікно в найдальшій точці, праворуч стіна загинається дугою до глядача. Зони стоять
 * СПИНОЮ ДО ДУГИ й дивляться в її центр: майстерня біля вікна — прямо, інструменти посередині — лицем до нас,
 * портал наприкінці дуги — лицем до центру кімнати (до нас дивиться його ПРАВА сторона, брама з вихором — під кутом).
 * Розміри зон — крок 15% (власник): портал 100, інструменти 85, майстерня 72.
 * Кожна зона зібрана з тих самих частин, що на картинці-концепті (assets/room.webp): у майстерні — корпус з вивіскою
 * й куполом, рожевий екран-сканер, два планшети, фігурки на підставках, довга платформа з помаранчевим вогнем, термінал
 * з трьома екранами на тумбі, колона з вогнями й рослинами біля вікна, маніпулятор; в інструментах — дошка з вивіскою,
 * 3 + 2 плитки й теплою нішею, робот зверху, верстат з шухлядами й дрібницями, ліхтарі, рослини; у порталу — рамка
 * зі зрізаними кутами, вивіска, арка з вихором і кристалами, дві сходинки, золотий вазон, велика рослина; над ними —
 * антресоль дугою з поруччям, фігурками, вазонами, золотим ліхтарем і полицями, під нею — ліани й лампи, колони.
 * Усе — прості фігури (коробки, кола, листя-еліпси), без деталей: макет для погодження розташування й розмірів.
 * Розкладку генерує scratchpad gen_full.py (частини задані в пікселях картинки й переносяться в 3D кожної зони).
 * Геометрія — справжні коробки в перспективі кімнати (NX.persp: VP 774/220, D 520; око — (774, 220, -520)):
 *   - коробки різних зон не перетинаються (перевірка в генераторі);
 *   - хто кого закриває — за роздільною лінією в плані (з боку ока — ближче) + «стоїть на» (on): верх основи — під річчю,
 *     тіло основи — після неї;
 *   - антресоль, спід, речі на ній, підвіси й колони під нею вищі за зони або позаду них — малюються перед зонами.
 * Світ: план (x, z) і висота y; z = 0 — площина картинки, підлога y = 372.
 * ========================================================================== */
(() => {
  if (!/rw-box/.test(location.hash)) return;
  const PZ = NX.persp, VP = PZ.VP, D = PZ.D, EYE = [VP[0], -D], FL = 372, CEIL = -240;
  const pr = q => PZ.p(q[0], q[1], q[2]);
  // ---- вимкнути поточне праве крило (лише в цьому режимі) ----
  const OFF = ['workshop', 'tools', 'portal', 'rwingBack', 'rwingMezz', 'rwingFloor', 'rwingPlants', 'rwingAir'];
  Object.values(NX.objects).forEach(o => { if (OFF.includes(o.id) || /^r[pg]_/.test(o.id)) { o.drawBack = null; o.layers = null; o.draw = () => {}; } });

  const LAYOUT = {"wall":[[1039.7,185],[1200,185],[1239.1,181.6],[1277.0,171.4],[1312.5,154.9],[1344.6,132.4],[1372.4,104.6],[1394.9,72.5],[1411.4,37.0],[1421.6,-0.9],[1425.0,-40.0],[1421.6,-79.1],[1411.4,-117.0]],"mezz":{"edge":[[1242.7,109.0],[1253.0,105.7],[1263.0,101.6],[1272.8,96.9],[1282.1,91.4],[1291.1,85.4],[1299.6,78.7],[1307.7,71.5],[1315.2,63.7],[1322.1,55.4],[1328.5,46.7],[1334.2,37.5],[1339.3,27.9],[1343.7,18.1],[1347.4,7.9],[1350.4,-2.5],[1352.6,-13.1],[1354.2,-23.8],[1354.9,-34.6],[1354.9,-45.4],[1354.2,-56.2],[1352.6,-66.9],[1350.4,-77.5],[1347.4,-87.9],[1343.7,-98.1],[1339.3,-107.9],[1334.2,-117.5]],"yt":30,"yb":56},"hub":{"x0":1038.6,"x1":1189.8,"y0":-56.8,"y1":145.8,"z":182,"deco":[{"t":"txt","f":[0.13,0.71,0.12,0.26],"s":"NEXORA AI","col":"#7af4ff"},{"t":"r","f":[0.06,0.73,0.29,0.73],"fill":"#0a2a7a","line":"#3b8aff"},{"t":"c","f":[0.27,0.47,0.09],"fill":"#1a5ad0"},{"t":"c","f":[0.54,0.53,0.11],"fill":"#1a5ad0"},{"t":"c","f":[0.38,0.65,0.06],"fill":"#1a5ad0"},{"t":"grid","f":[0.76,0.98,0.18,0.73],"nx":1,"ny":4,"gap":0.08,"fill":"#0e2a6a","line":"#7af4ff","icon":"#7af4ff"},{"t":"l","f":[0.09,0.9,0.71,0.83],"col":"#ff4fd8","lw":1}],"strip":{"x0":1193.8,"x1":1227.6,"y0":-63.5,"y1":145.8,"deco":[{"t":"grid","f":[0.12,0.88,0.04,0.96],"nx":1,"ny":6,"gap":0.1,"fill":"#1a1450","line":"#ff4fd8"}]}},"items":[{"id":"ws_plat","zone":"workshop","x":1056.97,"z":117.0,"turn":0,"w":223.45,"dep":44.69,"yb":372.0,"yt":329.54,"st":"base","deco":[{"t":"l","f":[0,0.06,1,0.06],"col":"#ff4fd8","lw":1.2},{"t":"r","f":[0.39,0.58,0.42,0.63],"fill":"#ff9a3a","line":"#ffd27a"},{"t":"l","f":[0.23,0.2,0.23,0.95],"col":"#0a0620"},{"t":"l","f":[0.77,0.2,0.77,0.95],"col":"#0a0620"}]},{"id":"ws_wingL","zone":"workshop","x":957.54,"z":132.64,"turn":0,"w":24.58,"dep":24.58,"yb":330.66,"yt":220.05,"st":"frame","on":"ws_plat"},{"id":"ws_wingR","zone":"workshop","x":1156.41,"z":132.64,"turn":0,"w":24.58,"dep":24.58,"yb":330.66,"yt":220.05,"st":"frame","on":"ws_plat"},{"id":"ws_house","zone":"workshop","x":1056.97,"z":130.41,"turn":0,"w":172.06,"dep":26.81,"yb":330.66,"yt":175.36,"st":"frame","on":"ws_plat","deco":[{"t":"ch","f":[0.18,0.82,0.21,0.99],"k":0.12,"fill":"#a0208a","line":"#ff7af0","lw":1.1},{"t":"c","f":[0.5,0.39,0.08],"fill":"#ffd0f4","line":"#ffffff"},{"t":"r","f":[0.18,0.83,-0.04,0.17],"fill":"#0a0620","line":"#ff4fd8","lw":1.1},{"t":"txt","f":[0.2,0.8,-0.03,0.15],"key":"nav.workshop","col":"#7af4ff"}],"ch":[11.17,11.17]},{"id":"ws_dome","zone":"workshop","x":1056.97,"z":137.11,"turn":0,"w":73.74,"dep":15.64,"yb":175.36,"yt":148.55,"st":"dome","on":"ws_house","deco":[{"t":"l","f":[0.15,0.62,0.85,0.62],"col":"#3be8ff","lw":1.2}],"ch":[13.41,13.41]},{"id":"ws_tabL","zone":"workshop","x":980.44,"z":120.35,"turn":0,"w":39.1,"dep":4.47,"yb":329.54,"yt":252.45,"st":"tablet","on":"ws_plat","deco":[{"t":"r","f":[0.08,0.92,0.04,0.88],"fill":"#0c4a8a","line":"#7af4ff"},{"t":"grid","f":[0.16,0.84,0.1,0.82],"nx":2,"ny":3,"fill":"#1a6ab0","line":"#9af8ff"},{"t":"r","f":[0.4,0.6,0.88,1],"fill":"#1a1440","line":"#3be8ff"}]},{"id":"ws_tabR","zone":"workshop","x":1137.98,"z":120.35,"turn":0,"w":39.1,"dep":4.47,"yb":329.54,"yt":245.75,"st":"tablet","on":"ws_plat","deco":[{"t":"r","f":[0.08,0.92,0.04,0.88],"fill":"#0c4a8a","line":"#7af4ff"},{"t":"grid","f":[0.16,0.84,0.1,0.82],"nx":2,"ny":3,"fill":"#1a6ab0","line":"#9af8ff"},{"t":"r","f":[0.4,0.6,0.88,1],"fill":"#1a1440","line":"#3be8ff"}]},{"id":"ws_fig0","zone":"workshop","x":1040.22,"z":122.59,"turn":0,"w":13.41,"dep":7.82,"yb":329.54,"yt":291.56,"st":"fig","on":"ws_plat","deco":[{"t":"c","f":[0.5,0.22,0.3],"fill":"#c8f0ff","line":"#7af4ff"},{"t":"r","f":[0.1,0.9,0.68,1],"fill":"#2a1a50","line":"#c8a0ff"}]},{"id":"ws_fig1","zone":"workshop","x":1058.09,"z":122.59,"turn":0,"w":13.41,"dep":7.82,"yb":329.54,"yt":282.62,"st":"fig","on":"ws_plat","deco":[{"t":"c","f":[0.5,0.22,0.3],"fill":"#c8f0ff","line":"#7af4ff"},{"t":"r","f":[0.1,0.9,0.68,1],"fill":"#2a1a50","line":"#c8a0ff"}]},{"id":"ws_fig2","zone":"workshop","x":1084.91,"z":122.59,"turn":0,"w":13.41,"dep":7.82,"yb":329.54,"yt":293.79,"st":"fig","on":"ws_plat","deco":[{"t":"c","f":[0.5,0.22,0.3],"fill":"#c8f0ff","line":"#7af4ff"},{"t":"r","f":[0.1,0.9,0.68,1],"fill":"#2a1a50","line":"#c8a0ff"}]},{"id":"ws_ped","zone":"workshop","x":1195.52,"z":125.94,"turn":0,"w":42.46,"dep":20.11,"yb":372.0,"yt":281.5,"st":"term","deco":[{"t":"r","f":[-0.03,0.76,0.49,0.9],"fill":"#0c2a5a","line":"#3be8ff"},{"t":"c","f":[0.5,0.7,0.17],"line":"#7af4ff","lw":1}]},{"id":"ws_term","zone":"workshop","x":1195.52,"z":123.7,"turn":0,"w":51.39,"dep":22.35,"yb":281.5,"yt":192.12,"st":"term","on":"ws_ped","deco":[{"t":"r","f":[0.1,0.9,0.05,0.12],"fill":"#3be8ff"},{"t":"r","f":[0.18,0.84,0.2,0.42],"fill":"#14306a","line":"#7af4ff"},{"t":"r","f":[0.18,0.84,0.47,0.69],"fill":"#14306a","line":"#7af4ff"},{"t":"r","f":[0.18,0.84,0.74,0.94],"fill":"#14306a","line":"#7af4ff"}],"ch":[6.7,6.7]},{"id":"ws_col","zone":"workshop","x":932.4,"z":141.58,"turn":0,"w":23.46,"dep":22.35,"yb":372.0,"yt":217.82,"st":"mach","deco":[{"t":"l","f":[0.5,0.04,0.5,0.96],"col":"#ff9a3a","lw":2},{"t":"r","f":[0.15,0.85,0.3,0.42],"fill":"#2a1a10","line":"#ff9a3a"}]},{"id":"ws_colPlant","zone":"workshop","x":932.96,"z":143.81,"turn":0,"w":17.88,"dep":15.64,"yb":217.82,"yt":204.41,"st":"pot","on":"ws_col","plant":1,"fw":49.16,"fh":33.52},{"id":"ws_potBL","zone":"workshop","x":930.72,"z":110.3,"turn":0,"w":26.81,"dep":22.35,"yb":372.0,"yt":340.72,"st":"pot","plant":1,"fw":46.93,"fh":44.69},{"id":"tl_bench","zone":"tools","x":1236.18,"z":11.88,"turn":36,"w":119.92,"dep":38.19,"yb":372.0,"yt":324.27,"st":"bench","deco":[{"t":"r","f":[0,1,0,0.1],"fill":"#ff7ad0"},{"t":"r","f":[0.05,0.43,0.26,0.92],"fill":"#140c30","line":"#6a4ab0"},{"t":"r","f":[0.63,0.97,0.26,0.92],"fill":"#140c30","line":"#6a4ab0"},{"t":"l","f":[0.05,0.59,0.43,0.59],"col":"#6a4ab0"},{"t":"l","f":[0.63,0.59,0.97,0.59],"col":"#6a4ab0"}]},{"id":"tl_board","zone":"tools","x":1254.15,"z":25.05,"turn":36,"w":106.32,"dep":12.73,"yb":324.27,"yt":167.28,"st":"board","on":"tl_bench","deco":[{"t":"r","f":[0.11,0.9,0.07,0.26],"fill":"#0a0620","line":"#3be8ff","lw":1.1},{"t":"c","f":[0.2,0.17,0.05],"line":"#7af4ff","lw":1.2},{"t":"txt","f":[0.27,0.89,0.09,0.24],"key":"nav.tools","col":"#7af4ff"},{"t":"r","f":[0.17,0.92,0.28,0.59],"fill":"#0a1440","line":"#3be8ff"},{"t":"grid","f":[0.18,0.91,0.3,0.57],"nx":3,"ny":1,"gap":0.05,"fill":"#0e2a6a","line":"#7af4ff","icon":"#7af4ff"},{"t":"r","f":[0.17,0.43,0.69,0.93],"fill":"#0e2a6a","line":"#7af4ff"},{"t":"c","f":[0.3,0.81,0.06],"line":"#7af4ff","lw":1},{"t":"r","f":[0.59,0.95,0.62,0.93],"fill":"#0e2a6a","line":"#7af4ff"},{"t":"c","f":[0.77,0.78,0.07],"line":"#7af4ff","lw":1},{"t":"r","f":[0.44,0.58,0.64,0.89],"fill":"#ff9a3a","line":"#ffd27a"}],"ch":[8.49,8.49]},{"id":"tl_bot","zone":"tools","x":1276.39,"z":12.82,"turn":36,"w":23.98,"dep":8.49,"yb":167.28,"yt":141.83,"st":"bot","on":"tl_board","deco":[{"t":"c","f":[0.5,0.38,0.3],"fill":"#8a4ac0","line":"#e0a0ff"},{"t":"c","f":[0.4,0.38,0.07],"fill":"#7af4ff"},{"t":"c","f":[0.6,0.38,0.07],"fill":"#7af4ff"}]},{"id":"tl_plantTop","zone":"tools","x":1224.65,"z":50.41,"turn":36,"w":14.39,"dep":8.49,"yb":167.28,"yt":156.68,"st":"pot","on":"tl_board","plant":1,"fw":46.67,"fh":31.82},{"id":"tl_item1","zone":"tools","x":1230.82,"z":26.26,"turn":36,"w":14.39,"dep":8.49,"yb":324.27,"yt":313.66,"st":"item","on":"tl_bench"},{"id":"tl_item2","zone":"tools","x":1269.63,"z":-1.93,"turn":36,"w":17.59,"dep":8.49,"yb":324.27,"yt":311.54,"st":"item","on":"tl_bench","deco":[{"t":"r","f":[0,1,0,0.3],"fill":"#ff9a3a"}]},{"id":"tl_lanL","zone":"tools","x":1212.2,"z":68.64,"turn":36,"w":7.99,"dep":6.36,"yb":271.23,"yt":239.41,"st":"lamp","glow":1},{"id":"tl_stand","zone":"tools","x":1181.76,"z":56.66,"turn":36,"w":14.39,"dep":14.85,"yb":372.0,"yt":324.27,"st":"stand","plant":1,"fw":36.06,"fh":42.43},{"id":"tl_potR","zone":"tools","x":1298.78,"z":-25.73,"turn":36,"w":22.38,"dep":23.34,"yb":372.0,"yt":324.27,"st":"pot","plant":1,"fw":59.4,"fh":67.88},{"id":"tl_lanF","zone":"tools","x":1270.76,"z":-30.29,"turn":36,"w":11.19,"dep":10.61,"yb":372.0,"yt":343.36,"st":"clamp","glow":1,"gcol":"120,240,255"},{"id":"pt_d1","zone":"portal","x":1345.72,"z":-23.63,"turn":86,"w":120.87,"dep":67.12,"yb":372.0,"yt":364.01,"st":"dais","deco":[{"t":"l","f":[0,0.2,1,0.2],"col":"#d98aff","lw":1.2}]},{"id":"pt_d2","zone":"portal","x":1355.29,"z":-22.96,"turn":86,"w":108.15,"dep":52.74,"yb":364.01,"yt":356.02,"st":"dais","on":"pt_d1","deco":[{"t":"l","f":[0,0.2,1,0.2],"col":"#3be8ff","lw":1.2}]},{"id":"pt_frame","zone":"portal","x":1370.96,"z":-18.04,"turn":86,"w":124.69,"dep":33.56,"yb":356.02,"yt":161.85,"st":"pframe","on":"pt_d2","deco":[{"t":"l","f":[0.03,0.14,0.03,0.98],"col":"#c86aff","lw":1.6},{"t":"ch","f":[0.18,0.92,0.08,1.0],"k":0.1,"fill":"#1a0c40","line":"#ff7af0","lw":1.1},{"t":"r","f":[0.28,0.87,0.12,0.26],"fill":"#0a0620","line":"#d98aff","lw":1.1},{"t":"txt","f":[0.3,0.85,0.13,0.25],"key":"nav.portal","col":"#7af4ff"},{"t":"arch","f":[0.31,0.91,0.27,1.0],"spring":0.51,"fill":"#2a0f6a","line":"#3be8ff","vortex":[0.65,0.68]},{"t":"p","pts":[[0.37,1.0],[0.41,0.84],[0.47,0.8],[0.53,1.0]],"fill":"#c86aff","line":"#ffd0ff"},{"t":"p","pts":[[0.51,1.0],[0.56,0.88],[0.62,0.92],[0.63,1.0]],"fill":"#9a5af0","line":"#ffd0ff"},{"t":"l","f":[0.95,0.26,0.95,0.98],"col":"#ff4fd8","lw":1.6}],"ch":[20.77,12.78]},{"id":"pt_gold","zone":"portal","x":1359.68,"z":-62.83,"turn":86,"w":20.36,"dep":12.78,"yb":356.02,"yt":328.85,"st":"gold","on":"pt_d2","plant":1,"fw":35.16,"fh":20.77},{"id":"pt_plantR","zone":"portal","x":1346.13,"z":-98.21,"turn":86,"w":15.27,"dep":17.58,"yb":372.0,"yt":333.65,"st":"stand","plant":1,"fw":46.34,"fh":47.94},{"id":"mz_bot0","layer":"up","x":1262.0,"z":121.5,"turn":21,"w":10,"dep":8,"yb":30,"yt":15,"st":"bot","deco":[{"t":"c","f":[0.5,0.3,0.32],"fill":"#8a4ac0","line":"#e0a0ff"}]},{"id":"mz_bot1","layer":"up","x":1275.8,"z":115.5,"turn":26,"w":10,"dep":8,"yb":30,"yt":15,"st":"bot","deco":[{"t":"c","f":[0.5,0.3,0.32],"fill":"#8a4ac0","line":"#e0a0ff"}]},{"id":"mz_bot2","layer":"up","x":1289.1,"z":108.3,"turn":31,"w":10,"dep":8,"yb":30,"yt":15,"st":"bot","deco":[{"t":"c","f":[0.5,0.3,0.32],"fill":"#8a4ac0","line":"#e0a0ff"}]},{"id":"mz_cube","layer":"up","x":1305.3,"z":99.8,"turn":37,"w":12,"dep":12,"yb":30,"yt":18,"st":"item","deco":[{"t":"r","f":[0.2,0.8,0.2,0.8],"fill":"#6a3ad8","line":"#c8a0ff"}]},{"id":"mz_pot0","layer":"up","x":1251.7,"z":129.3,"turn":17,"w":14,"dep":12,"yb":30,"yt":20,"st":"pot","plant":1,"fw":34,"fh":26},{"id":"mz_pot1","layer":"up","x":1323.0,"z":87.3,"turn":44,"w":14,"dep":12,"yb":30,"yt":20,"st":"pot","plant":1,"fw":34,"fh":26},{"id":"mz_pot2","layer":"up","x":1345.0,"z":61.5,"turn":55,"w":14,"dep":12,"yb":30,"yt":20,"st":"pot","plant":1,"fw":34,"fh":26},{"id":"mz_lantern","layer":"up","x":1363.5,"z":32.8,"turn":66,"w":12,"dep":12,"yb":30,"yt":0,"st":"gold","glow":1,"gr":46,"deco":[{"t":"r","f":[0.2,0.8,0.15,0.85],"fill":"#ffe6a0","line":"#fff4c8"}]},{"id":"mz_gold1","layer":"up","x":1369.2,"z":18.3,"turn":71,"w":18,"dep":12,"yb":30,"yt":16,"st":"gold"},{"id":"mz_gold2","layer":"up","x":1373.7,"z":3.3,"turn":76,"w":14,"dep":12,"yb":30,"yt":20,"st":"gold"},{"id":"mz_shelf","layer":"up","x":1380.6,"z":-27.4,"turn":86,"w":30,"dep":14,"yb":30,"yt":-20,"st":"shelf","deco":[{"t":"l","f":[0,0.25,1,0.25],"col":"#8a7ad0"},{"t":"l","f":[0,0.5,1,0.5],"col":"#8a7ad0"},{"t":"l","f":[0,0.75,1,0.75],"col":"#8a7ad0"}]},{"id":"mz_potR","layer":"up","x":1378.6,"z":-52.5,"turn":94,"w":18,"dep":14,"yb":30,"yt":16,"st":"pot","plant":1,"fw":50,"fh":40},{"id":"mz_fern","layer":"up","x":1240.5,"z":150.7,"turn":10,"w":18,"dep":14,"yb":108,"yt":96,"st":"pot","plant":1,"fw":64,"fh":44},{"id":"mz_lampL","layer":"up","x":1238.0,"z":155.3,"turn":10,"w":12,"dep":10,"yb":52,"yt":30,"st":"lamp","glow":1,"gr":30}],"cols":[{"id":"col_far","x":1235.3,"z":159.9,"turn":10,"w":22,"dep":18,"yb":372,"yt":-240,"st":"col"},{"id":"col_pt","x":1372.2,"z":67.6,"turn":58,"w":22,"dep":18,"yb":372,"yt":56,"st":"col"}],"hang":[{"x":1277.7,"z":134.5,"len":50,"kind":"vine","turn":24},{"x":1289.7,"z":128.6,"len":30,"kind":"lamp","turn":28},{"x":1304.0,"z":120.2,"len":44,"kind":"vine","turn":33},{"x":1320.2,"z":108.4,"len":26,"kind":"lamp","turn":39},{"x":1335.1,"z":95.1,"len":36,"kind":"vine","turn":45},{"x":1350.5,"z":77.6,"len":30,"kind":"vine","turn":52}],"arm":[[1056.97,150.78,146.05],[1126.25,103.85,146.05],[1193.28,139.61,146.05],[1172.05,155.25,146.05]]};   // згенеровано scratchpad gen_full.py (lay/f3.json)
  const L = window.RWBOX || LAYOUT || { wall: [[1039.7, 185], [1536, 185]], items: [] };
  // палітри: front / side / top / acc (кант)
  const ST = {
    base: ['#1c1546', '#120e30', '#2a2058', '#ff4fd8'], frame: ['#2a1650', '#180c34', '#3a2068', '#ff4fd8'], dome: ['#2c2460', '#1a1640', '#3e347c', '#3be8ff'],
    tablet: ['#0c2a5a', '#081a3a', '#123468', '#3be8ff'], fig: ['#3a2a6a', '#24184a', '#4a3a80', '#c8a0ff'], term: ['#16204a', '#0c1430', '#20306a', '#3be8ff'],
    mach: ['#1a1440', '#100c2a', '#2a2058', '#ff9a3a'], bench: ['#1a1238', '#100a26', '#3a1c5a', '#ff7ad0'], board: ['#0e1a4a', '#081030', '#14245a', '#3be8ff'],
    bot: ['#5a2a8a', '#3a1a5a', '#7a3aaa', '#e0a0ff'], item: ['#2a2460', '#1a1640', '#3a3480', '#9a8ae0'], stand: ['#221a4e', '#140f32', '#30266a', '#8a7ad0'],
    dais: ['#241a58', '#160f3a', '#33247a', '#d98aff'], pframe: ['#2a1260', '#1a0a40', '#3a1c78', '#d98aff'], gold: ['#a8741c', '#6a4810', '#d8a030', '#ffd27a'],
    pot: ['#5a3a2a', '#3a2418', '#7a4a30', '#c08060'], col: ['#1e1850', '#120e34', '#2a2468', '#5a4ab0'], shelf: ['#2a2058', '#1a1440', '#3a2c78', '#8a7ad0'],
    lamp: ['#ffb24a', '#c0782a', '#ffd27a', '#ffd27a'], clamp: ['#3be8ff', '#1a8aa8', '#8af4ff', '#8af4ff'],
  };
  const sty = k => ST[k] || ST.base;

  // ---------- криві ----------
  function catmull(pts, n = 6) {
    if (pts.length < 2) return pts.slice();
    const P = [pts[0], ...pts, pts[pts.length - 1]], out = [];
    for (let i = 1; i < P.length - 2; i++) {
      const [p0, p1, p2, p3] = [P[i - 1], P[i], P[i + 1], P[i + 2]];
      for (let k = 0; k < n; k++) { const t = k / n, t2 = t * t, t3 = t2 * t; out.push([0, 1].map(c => .5 * (2 * p1[c] + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3))); }
    }
    out.push(pts[pts.length - 1]); return out;
  }
  const WALL = catmull(L.wall, 4);
  const EDGE = L.mezz ? L.mezz.edge : [];

  // ---------- коробка ----------
  /** (x, z) — середина передньої грані на підлозі; turn — поворот до центру (°); ch — [зріз лівого, правого верхнього кута]. */
  function geo(B) {
    const a = (B.turn || 0) * Math.PI / 180, f = [-Math.sin(a), -Math.cos(a)], r = [-f[1], f[0]];
    const c = [B.x - f[0] * (B.back || 0), B.z - f[1] * (B.back || 0)];
    const P = (u, v, y) => [c[0] + r[0] * u - f[0] * v, y, c[1] + r[1] * u - f[1] * v];
    const w = B.w / 2, d = B.dep, [cl, crr] = B.ch || [0, 0], yb = B.yb, yt = B.yt;
    const front = cl || crr ? [P(-w, 0, yb), P(w, 0, yb), P(w, 0, yt + crr), P(w - crr, 0, yt), P(-w + cl, 0, yt), P(-w, 0, yt + cl)] : [P(-w, 0, yb), P(w, 0, yb), P(w, 0, yt), P(-w, 0, yt)];
    const F = { front, left: [P(-w, d, yb), P(-w, 0, yb), P(-w, 0, yt + cl), P(-w, d, yt + cl)], right: [P(w, 0, yb), P(w, d, yb), P(w, d, yt + crr), P(w, 0, yt + crr)],
      top: [P(-w + cl, d, yt), P(w - crr, d, yt), P(w - crr, 0, yt), P(-w + cl, 0, yt)] };
    const toEye = pts => { const m = [0, 2].map(i => pts.reduce((s, q) => s + q[i], 0) / pts.length); return [EYE[0] - m[0], EYE[1] - m[1]]; };
    const dot = (n, v) => n[0] * v[0] + n[1] * v[1];
    const fp = [[P(-w, 0, 0)[0], P(-w, 0, 0)[2]], [P(w, 0, 0)[0], P(w, 0, 0)[2]], [P(w, d, 0)[0], P(w, d, 0)[2]], [P(-w, d, 0)[0], P(-w, d, 0)[2]]];
    return { B, F, P, fp, zc: c[1], vis: { front: dot(f, toEye(F.front)) > 0, left: dot([-r[0], -r[1]], toEye(F.left)) > 0, right: dot(r, toEye(F.right)) > 0, top: yt > VP[1] } };
  }
  const path = (c, pts) => { c.beginPath(); pts.forEach((q, i) => { const [x, y] = pr(q); i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.closePath(); };
  const face = (c, pts, fill, line, lw = .7) => { path(c, pts); if (fill) { c.fillStyle = fill; c.fill(); } if (line) { c.strokeStyle = line; c.lineWidth = lw; c.stroke(); } };
  const seg = (c, a, b, col, lw = .7) => { const [x0, y0] = pr(a), [x1, y1] = pr(b); c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); };
  const haze = (c, pts, z) => { const k = Math.max(0, Math.min(.38, z / 400)); if (k > .01) face(c, pts, `rgba(6,4,20,${k.toFixed(3)})`); };

  // ---------- оздоби на лицьовій грані (частки ширини fu й висоти fy) ----------
  const FPt = (q, fu, fy) => q.P(-q.B.w / 2 + fu * q.B.w, -.3, q.B.yt + fy * (q.B.yb - q.B.yt));
  function text(c, q, d) {                                                                               // напис, «покладений» на грань (афінно)
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
      case 'c': { const [cu, cv, ru] = d.f; face(c, Array.from({ length: 20 }, (_, i) => { const a = i / 20 * Math.PI * 2; return FPt(q, cu + ru * Math.cos(a), cv + ru * asp * Math.sin(a)); }), d.fill, d.line, d.lw || .7); break; }
      case 'l': seg(c, FPt(q, d.f[0], d.f[1]), FPt(q, d.f[2], d.f[3]), d.col, d.lw || 1); break;
      case 'p': face(c, d.pts.map(([u, v]) => FPt(q, u, v)), d.fill, d.line, d.lw || .7); break;
      case 'grid': { const [u0, u1, v0, v1] = d.f, nx = d.nx, ny = d.ny, g = d.gap || .04, cw = (u1 - u0) / nx, chh = (v1 - v0) / ny;
        for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { face(c, R(u0 + i * cw + g * cw, u0 + (i + 1) * cw - g * cw, v0 + j * chh + g * chh, v0 + (j + 1) * chh - g * chh), d.fill, d.line, .6); if (d.icon) deco(c, q, { t: 'c', f: [u0 + (i + .5) * cw, v0 + (j + .5) * chh, cw * .22], fill: null, line: d.icon, lw: 1 }); } break; }
      case 'txt': text(c, q, d); break;
      case 'arch': {                                                                                       // проріз з півколом угорі; вихор — кільцями
        const [u0, u1, v0, v1] = d.f, sp = d.spring, pts = [FPt(q, u0, v1)];
        for (let i = 0; i <= 24; i++) { const a = Math.PI * i / 24; pts.push(FPt(q, (u0 + u1) / 2 - (u1 - u0) / 2 * Math.cos(a), sp - (sp - v0) * Math.sin(a))); }
        pts.push(FPt(q, u1, v1)); face(c, pts, d.fill, d.line, 1.2);
        if (d.vortex) { const [cu, cv] = d.vortex; [[.86, '#3a1890'], [.7, '#4a22a8'], [.54, '#6a3ad8'], [.38, '#8a5af0'], [.22, '#b49af8'], [.09, '#eae0ff']].forEach(([rr, col], k) => face(c, Array.from({ length: 30 }, (_, i) => { const a = Math.PI * 2 * i / 30 + t * (k % 2 ? .5 : -.5); return FPt(q, cu + rr * (u1 - u0) / 2 * Math.cos(a), cv + rr * (u1 - u0) / 2 * asp * Math.sin(a)); }), col)); }
        break;
      }
    }
  }
  // ---------- рослина: вазон (коробка) + листя (еліпси віялом) ----------
  function foliage(c, q, t) {
    const B = q.B, top = q.P(0, B.dep / 2, B.yt), [X, Y] = pr(top), k = PZ.s(top[2]), fw = (B.fw || B.w * 1.6) * k, fh = (B.fh || B.w * 1.4) * k, n = B.leaves || 9;
    const seed = (B.x * 13 + B.z * 7) % 1;
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (i / (n - 1) - .5) * 2.4, sw = Math.sin(t * .8 + i + seed * 6) * .04, len = fh * (.62 + .38 * Math.abs(Math.cos(i * 1.7 + seed * 9)));
      c.save(); c.translate(X, Y); c.rotate(a + Math.PI / 2 + sw); c.fillStyle = i % 3 === 0 ? '#2e8a4a' : i % 3 === 1 ? '#3aa858' : '#24703c'; c.strokeStyle = '#0e3a1e'; c.lineWidth = .6;
      c.beginPath(); c.ellipse(0, -len / 2, Math.max(1.2, fw / n * 1.15), len / 2, 0, 0, Math.PI * 2); c.fill(); c.stroke(); c.restore();
    }
  }
  function glow(c, q) { const B = q.B, m = q.P(0, B.dep / 2, (B.yb + B.yt) / 2), [X, Y] = pr(m), r = (B.gr || 26) * PZ.s(m[2]), col = B.gcol || '255,190,110';
    c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(X, Y, 0, X, Y, r); g.addColorStop(0, `rgba(${col},.42)`); g.addColorStop(1, `rgba(${col},0)`); c.fillStyle = g; c.fillRect(X - r, Y - r, r * 2, r * 2); c.restore(); }

  function drawItem(c, it, t, mode) {                                                                   // mode: 'top' — лише верх, 'body' — без верху
    const q = it.q, B = q.B, [front, side, top, acc] = sty(B.st), F = q.F, vis = q.vis, zh = q.zc + B.dep / 2;
    if (mode !== 'body' && vis.top && B.yt > VP[1]) { face(c, F.top, top, acc + '88', .5); haze(c, F.top, zh); }
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
    items.forEach(it => { const F = it.q.F, pts = it.mode === 'top' ? F.top : [...F.front, ...F.top, ...F.left, ...F.right]; it.scr = hull(pts.map(pr)); });
    const after = new Map(items.map(it => [it, new Set(it.after)]));
    for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
      const A = items[i], Bb = items[j]; if (A.n === Bb.n) continue;
      const ua = under(A.n), ub = under(Bb.n); if (ua.includes(Bb.n) || ub.includes(A.n)) continue;   // стос — уже впорядкований
      if (!overlap(A.scr, Bb.scr)) continue;
      const k = nearer(A.q.fp, Bb.q.fp); if (k > 0) after.get(A).add(Bb); else if (k < 0) after.get(Bb).add(A);
    }
    const seen = new Set(), visit = it => { if (seen.has(it)) return; seen.add(it); after.get(it).forEach(visit); out.push(it); };
    items.slice().sort((a, b) => Math.max(...b.q.fp.map(p => p[1])) - Math.max(...a.q.fp.map(p => p[1]))).forEach(visit);
    return out;
  }
  const ZONE = (L.items || []).filter(B => B.layer !== 'up'), UP = (L.items || []).filter(B => B.layer === 'up');
  const ORDER = plan(ZONE), ORDER_UP = plan(UP);

  // ---------- стіна по дузі ----------
  function drawWall(c) {
    for (let i = 0; i + 1 < WALL.length; i++) {
      const [x0, z0] = WALL[i], [x1, z1] = WALL[i + 1], ang = Math.atan2(z0 - z1, x1 - x0), k = Math.max(0, Math.min(1, 1 - ang / 1.4));
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
      seg(c, [x0, 150, z0], [x1, 150, z1], '#4a5a8a', 3); seg(c, [x0, 150, z0], [x1, 150, z1], '#8a9ac8', 1);         // труба вздовж стіни
      seg(c, [x0, FL - 7, z0], [x1, FL - 7, z1], '#ff4fd8', 1.4);                                                     // неоновий плінтус
    }
  }
  // ---------- екран NEXORA AI (на прямій стіні) ----------
  function drawHub(c) {
    const H = L.hub; if (!H) return;
    const q = geo({ x: (H.x0 + H.x1) / 2, z: H.z, turn: 0, w: H.x1 - H.x0, dep: 2, yb: H.y1, yt: H.y0, deco: H.deco || [] });
    face(c, q.F.front, '#071a5a', '#3be8ff', 1.1); (q.B.deco || []).forEach(d => deco(c, q, d, 0));
    if (H.strip) { const s = H.strip, g = geo({ x: (s.x0 + s.x1) / 2, z: H.z, turn: 0, w: s.x1 - s.x0, dep: 2, yb: s.y1, yt: s.y0, deco: s.deco || [] }); face(c, g.F.front, '#0c1238', '#5a6ad8', .9); g.B.deco.forEach(d => deco(c, g, d, 0)); }
  }
  // ---------- антресоль: спід, лицьова грань, поруччя (речі на ній — ORDER_UP) ----------
  function nearestWall(p) { let best = null, bd = 1e9; for (let i = 0; i + 1 < WALL.length; i++) { const a = WALL[i], b = WALL[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / (dx * dx + dz * dz))), q = [a[0] + dx * t, a[1] + dz * t], d = Math.hypot(q[0] - p[0], q[1] - p[1]); if (d < bd) { bd = d; best = q; } } return best; }
  function drawSoffit(c) {
    if (!EDGE.length) return;
    const { yb } = L.mezz, W0 = nearestWall(EDGE[0]), Wn = nearestWall(EDGE[EDGE.length - 1]);
    const back = [W0, ...WALL.filter(p => p[0] > W0[0] + 1 && (p[1] > Wn[1] - 1)), Wn];
    face(c, [...EDGE.map(p => [p[0], yb, p[1]]), ...back.reverse().map(p => [p[0], yb, p[1]])], '#0a0822');
    EDGE.forEach((p, i) => { if (i % 2) return; const w = nearestWall(p); seg(c, [p[0], yb, p[1]], [w[0], yb, w[1]], '#1a1540', 1.5); });
    for (let i = 0; i + 1 < WALL.length; i++) if (WALL[i][0] >= W0[0] - 1) seg(c, [WALL[i][0], yb, WALL[i][1]], [WALL[i + 1][0], yb, WALL[i + 1][1]], '#4a3c9a', 2.2);
  }
  function drawSlab(c) {
    if (!EDGE.length) return;
    const { yt, yb } = L.mezz;
    for (let i = 0; i + 1 < EDGE.length; i++) {
      const [x0, z0] = EDGE[i], [x1, z1] = EDGE[i + 1];
      face(c, [[x0, yt, z0], [x1, yt, z1], [x1, yb, z1], [x0, yb, z0]], '#2a2060');
      seg(c, [x0, yt, z0], [x1, yt, z1], '#ff4fd8', 1.1); seg(c, [x0, yb, z0], [x1, yb, z1], '#ff4fd8', .8);
      seg(c, [x0, (yt + yb) / 2, z0], [x1, (yt + yb) / 2, z1], '#c86aff', 2.2);                                   // світна трубка на лицьовій грані
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
  // ---------- підвіси (ліани, лампи, ліхтар) ----------
  function drawHang(c, t) {
    const y0 = L.mezz ? L.mezz.yb : 56;
    (L.hang || []).forEach(h => {
      const y1 = y0 + h.len;
      if (h.kind === 'vine') { const g = geo({ x: h.x, z: h.z, turn: h.turn || 0, w: h.w || 14, dep: 3, yb: y1, yt: y0, st: 'base' }); face(c, g.F.front, '#24703c', '#3aa858', .7); haze(c, g.F.front, h.z); return; }
      seg(c, [h.x, y0, h.z], [h.x, y1, h.z], '#0a0612', 1.1);
      const big = h.kind === 'gold', g = geo({ x: h.x, z: h.z - 4, turn: 0, w: big ? 14 : 8, dep: big ? 14 : 8, yb: y1 + (big ? 26 : 12), yt: y1, st: big ? 'gold' : 'lamp', glow: 1, gr: big ? 44 : 26 });
      drawItem(c, { q: g }, t);
    });
  }
  function drawArm(c) {
    const A = L.arm; if (!A) return; const P2 = A.map(pr);
    [[6, '#2a2450'], [3.6, '#5a5490'], [1.2, '#9a94d0']].forEach(([lw, col]) => { c.strokeStyle = col; c.lineWidth = lw; c.lineCap = 'round'; c.beginPath(); P2.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke(); });
    P2.forEach(([x, y], i) => { const r = i === 0 || i === P2.length - 1 ? 3 : 5; c.fillStyle = '#3a3470'; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); c.strokeStyle = i === P2.length - 1 ? '#ffb24a' : '#9a94d0'; c.lineWidth = 1; c.stroke(); });
    const [hx, hy] = P2[P2.length - 1]; c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(hx, hy, 0, hx, hy, 14); g.addColorStop(0, 'rgba(255,170,80,.5)'); g.addColorStop(1, 'rgba(255,170,80,0)'); c.fillStyle = g; c.fillRect(hx - 14, hy - 14, 28, 28); c.restore();
  }
  // ---------- підлога під крилом ----------
  function drawFloor(c) {
    c.fillStyle = '#0d0826'; c.beginPath(); const W = WALL.map(([x, z]) => pr([x, FL, z])); c.moveTo(887.5, 368); c.lineTo(887.5, W[0][1]); W.forEach(([x, y]) => c.lineTo(x, y)); c.lineTo(1560, W[W.length - 1][1]); c.lineTo(1560, 368); c.closePath(); c.fill();
    for (let i = -6; i < 30; i++) { const xw = 774 + i * 48; seg(c, [xw, FL, 220], [xw, FL, -60], '#1c1446', .8); }
    for (const z of [160, 120, 85, 55, 28, 5]) seg(c, [880, FL, z], [1800, FL, z], '#1a1240', .8);
  }
  NX.rwingBox = { L, order: ORDER.map(it => it.n.B.id + ':' + it.mode) };
  NX.addObject({
    id: 'rwingBox', rw: true, span: [884, 1536],
    drawBack(c, t) {
      // вікно, місто й правий відкіс (window_frame.js, до x 970) не чіпаємо: стіна й підлога крила — лише поза ними
      c.save(); c.beginPath(); c.moveTo(970, -2); c.lineTo(1547, -2); c.lineTo(1547, 470); c.lineTo(887.5, 470); c.lineTo(887.5, 346); c.lineTo(970, 346); c.closePath(); c.clip();
      c.fillStyle = '#0b0820'; c.fillRect(887.5, -2, 660, 370);
      drawFloor(c); drawWall(c); drawHub(c);
      c.restore();
      c.save(); c.beginPath(); c.rect(860, -2, 690, 480); c.clip();
      (L.cols || []).forEach(B => drawItem(c, { q: geo(B) }, t));                                         // колони під антресоллю (біля стіни)
      drawSoffit(c); drawSlab(c);
      ORDER_UP.forEach(it => drawItem(c, it, t, it.mode));                                              // речі на антресолі
      drawRail(c); drawHang(c, t);
      let armDone = false; const lastWs = ORDER.map(it => it.n.B.zone).lastIndexOf('workshop');
      ORDER.forEach((it, i) => { drawItem(c, it, t, it.mode); if (i === lastWs && !armDone) { drawArm(c); armDone = true; } });
      if (!armDone) drawArm(c);
      c.restore();
    },
  });
})();
