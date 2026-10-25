#!/usr/bin/env python3
"""
tools/image/07_desk_props.py — ДРІБНИЧКИ НА СТОЛІ AI-ЦЕНТРУ: ТОЧНІ КОПІЇ З КАРТИНКИ
--------------------------------------------------------------------------------
Стіл AI-центру тепер намальований кодом (objects/ai_center.js), і його стільниця
лягає поверх нижньої частини речей, що стоять на столі на картинці кімнати:
ноутбук із синім екраном, золота рамка, темна колонка, золота фігурка.
Щоб вони лишились такими, як були (власник: "полички, фішечки — зберегти"),
їхню нижню смугу (там, де їх перекриває стільниця) переносимо в спрайт:
  - ноутбук, рамка, колонка — за полігонами (вони суцільні)
  - фігурка — за кольором (тепле/світле) + контур на 1 піксель
Результат: assets/ai_desk_props.png; де він лежить — константа PROPS в ai_center.js.
Запуск: python3 tools/image/07_desk_props.py
"""
import pathlib, numpy as np, cv2
from PIL import Image
ROOT = pathlib.Path(__file__).resolve().parents[2]
ROOM = np.array(Image.open(ROOT / 'assets/room.webp').convert('RGB'))
RS = ROOM.shape[1] / 1536
BOX = (232, 286, 324, 297.6)                     # смуга в одиницях кімнати: x0, y0, x1, y1
SOLID = [                                        # суцільні речі (полігони в одиницях кімнати)
    [(237, 286), (284, 286), (290, 291), (291.5, 298), (233.5, 298), (236, 291)],   # ноутбук: низ екрана + клавіатура
    [(278.5, 286), (297.5, 286), (297.5, 297.6), (278.5, 297.6)],                   # золота рамка
    [(297, 286), (306, 286), (306, 298), (297, 298)],                               # темна колонка
]
FIGURE = [(305, 286), (322, 286), (322, 297.6), (305, 297.6)]                       # золота фігурка (за кольором)

def main():
    x0, y0, x1, y1 = BOX
    c = ROOM[int(round(y0 * RS)):int(round(y1 * RS)), int(round(x0 * RS)):int(round(x1 * RS))].astype(int)
    h, w = c.shape[:2]
    def poly(p):
        m = np.zeros((h, w), np.uint8)
        cv2.fillPoly(m, [np.array([[(x - x0) * RS, (y - y0) * RS] for x, y in p], np.int32)], 1); return m
    m = np.zeros((h, w), np.uint8)
    for p in SOLID: m |= poly(p)
    r, g, b = c[..., 0], c[..., 1], c[..., 2]
    warm = ((r > 110) & (r > b + 15)) | (np.maximum(np.maximum(r, g), b) > 150)
    fig = (poly(FIGURE) > 0) & warm
    fig = cv2.dilate(fig.astype(np.uint8), np.ones((3, 3), np.uint8)) & poly(FIGURE)
    m |= fig
    rgba = np.dstack([c.astype(np.uint8), (m * 255).astype(np.uint8)])
    Image.fromarray(rgba).save(ROOT / 'assets/ai_desk_props.png', optimize=True)
    print('ai_desk_props.png', rgba.shape, 'BOX', BOX)

if __name__ == '__main__':
    main()
