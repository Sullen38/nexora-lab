#!/usr/bin/env python3
"""
tools/build.py — ЗБІРКА В ОДИН ФАЙЛ
Збирає index.html + css + усі js + картинку кімнати (base64) в dist/nexora-lab.html,
який можна відкрити без сервера або викласти як одну сторінку.
Заодно підтримує в index.html лічильник скриптів для лоад-бару вітальної заставки (data-js="N" на #splash):
додали чи прибрали <script src="js/..."> — число оновиться саме.
Запуск:  python3 tools/build.py
"""
import re, base64, pathlib, json
root = pathlib.Path(__file__).resolve().parent.parent
src = (root / 'index.html').read_text(encoding='utf-8')

# --- лічильник скриптів для заставки (етап «скрипти» рахує події load кожного <script src>) ---
n_js = len(re.findall(r'<script src="js/[^"]+"></script>', src))
fixed = re.sub(r'(<div id="splash"[^>]*?data-js=")\d+(")', r'\g<1>' + str(n_js) + r'\2', src, count=1)
if fixed != src:
    (root / 'index.html').write_text(fixed, encoding='utf-8'); src = fixed
    print('index.html: data-js =', n_js)

html = src
css = (root / 'css/hud.css').read_text(encoding='utf-8')
# стилі інтерфейсу — прямо в сторінку (в index.html вони не блокують показ заставки: media="print" -> "all")
html = re.sub(r'<link rel="stylesheet" href="css/hud.css"[^>]*>', lambda m: '<style>\n' + css + '\n</style>', html, count=1)
# картинка кімнати вбудована (NX_ROOM_SRC) — заставці не треба вантажити її окремо
html = html.replace('data-room="assets/room.webp"', 'data-room=""')
img = base64.b64encode((root / 'assets/room.webp').read_bytes()).decode()
assets = {f.name: 'data:image/png;base64,' + base64.b64encode(f.read_bytes()).decode() for f in sorted((root / 'assets').glob('*.png'))}
def inline(m):
    src = m.group(1)
    return '<script>\n/* ---- ' + src + ' ---- */\n' + (root / src).read_text(encoding='utf-8') + '\n</script>'
html = html.replace('<script src="js/core/namespace.js"></script>', '<script>window.NX_ROOM_SRC="data:image/webp;base64,' + img + '";window.NX_ASSETS=' + json.dumps(assets) + ';</script>\n<script src="js/core/namespace.js"></script>')
html = re.sub(r'<script src="(js/[^"]+)"></script>', inline, html)
(root / 'dist').mkdir(exist_ok=True)
(root / 'dist/nexora-lab.html').write_text(html, encoding='utf-8')
print('built dist/nexora-lab.html', len(html) // 1024, 'KB')
