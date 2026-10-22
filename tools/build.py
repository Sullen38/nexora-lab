#!/usr/bin/env python3
"""
tools/build.py — ЗБІРКА В ОДИН ФАЙЛ
Збирає index.html + css + усі js + картинку кімнати (base64) в dist/nexora-lab.html,
який можна відкрити без сервера або викласти як одну сторінку.
Запуск:  python3 tools/build.py
"""
import re, base64, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
html = (root / 'index.html').read_text(encoding='utf-8')
css = (root / 'css/hud.css').read_text(encoding='utf-8')
html = html.replace('<link rel="stylesheet" href="css/hud.css">', '<style>\n' + css + '\n</style>')
img = base64.b64encode((root / 'assets/room.webp').read_bytes()).decode()
def inline(m):
    src = m.group(1)
    return '<script>\n/* ---- ' + src + ' ---- */\n' + (root / src).read_text(encoding='utf-8') + '\n</script>'
html = html.replace('<script src="js/core/namespace.js"></script>', '<script>window.NX_ROOM_SRC="data:image/webp;base64,' + img + '";</script>\n<script src="js/core/namespace.js"></script>')
html = re.sub(r'<script src="(js/[^"]+)"></script>', inline, html)
(root / 'dist').mkdir(exist_ok=True)
(root / 'dist/nexora-lab.html').write_text(html, encoding='utf-8')
print('built dist/nexora-lab.html', len(html) // 1024, 'KB')
