# Хто за що відповідає — карта файлів (з 13.11)

| Чат | Файл чату | Його файли |
|---|---|---|
| Архітектор | `docs/chats/architect.md` | `CLAUDE.md`, `.gitattributes`, `docs/*` (RULES, OWNERS, ROADMAP, chats/, покажчик HISTORY), код не пише |
| Ядро й оптимізація | `docs/chats/core.md` | `js/core/*`, `js/main.js`, `js/fx/*`, `js/ui/input.js`, `hud.js`, `chat.js`, `splash.js`, `js/world/*` (кімната, підлога, місто за вікном), `js/objects/window_frame.js`, `css/*`, `index.html`, `tools/build.py`, `bench.js`, `first.js`, `same.js`, `roam.js`, `texts.js`, `shot.js`, `tools/splash`, `tools/image`, `tools/check.sh`, `tools/budget.js`, `tools/budget.json`, `.github/workflows/check.yml`, `.gitignore` |
| Кімната — правки (з 15.11) | `docs/chats/room.md` | уся основна кімната візуально: усе з рядків «Декор стін і диван» і «Робочі зони» (слово власника 15.11, 21:50: «усе, що в ній є візуально, підпадає під цей чат; робочі зони теж») |
| ~~Декор стін і диван~~ (закрито 15.11, передано в «Кімната — правки») | `docs/chats/decor.md` | `js/objects/decor*.js`, `dc_paint.js`, `dc_plants.js`, `planters.js`, `sofa.js`, `tools/wingbox/decor.py`, `decor_check.js`; дії догляду в `activities.js` |
| ~~Робочі зони~~ (передано в «Кімната — правки» 15.11) | `docs/chats/zones.md` | `js/objects/aicenter.js`, `ai_paint.js`, `analytics.js`, `an_*.js`, `marketing.js`, `mk_*.js`, `tools.js`, `tl_paint.js`, `portal.js`, `pt_paint.js`, `screens.js`, `holo_panes.js`, `kit.js`, `arc_*.js`, `js/ui/zones.js`, `js/actors/virus/*`, `tools/wingbox/gen_room.py`, `plan.py`, `shot.js` |
| Nexi | `docs/chats/nexi.md` | `js/actors/nexi/*`, `js/actors/cat/*` (Рудик), `js/ui/skinlab.js`, `shop.js`, `js/objects/workshop.js`, `ws_paint.js`, `rug_dock.js`, `ball.js`, `docs/NFT.md` |
| Гості й вечірка | `docs/chats/guests.md` | `js/actors/guests/*`, `tools/guests` |
| Ботанічний сад | `docs/chats/garden.md` | `js/garden/*` |
| Навчання й портфоліо (з 15.11) | `docs/chats/learn.md` | лише свій файл чату; код гри не змінює, репо читає як навчальний матеріал; портфоліо — окремий репозиторій |

Спільні: `js/i18n/*.js` — кожен править лише свої гілки ключів; `index.html` — лише свій рядок скрипта; `docs/history/РРРР-ММ.md` (історія, файл поточного місяця) — кожен дописує свій блок у кінець; `docs/HISTORY.md` — покажчик, не дописувати.
Сумнів, чий файл, — питати Архітектора (або власника).
