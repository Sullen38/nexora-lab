# brand/ — канонічні зображення бренду (для заявок на ТМ, промисловий зразок, авторське право)

Усі зображення відрендерені **з коду гри** (`actors/nexi/sprite.js renderBot`, `actors/cat/cat_sprite.js drawCat`) — це і є
канон; при зміні спрайтів перегенерувати (Playwright: `renderBot(skinLook('classic'), poseFor('stand', .5), .5, cv)` тощо,
масштаб ×8, фон прозорий; листи — на тлі `#0a0f2e`). Див. `docs/BRAND.md`.

| Файл | Що |
|---|---|
| `nexi_sheet.png` | контактний лист Nexi: спереду, ззаду, крок + 8 емоцій (happy, think, surprised, sad, angry, sleepy, hearts, serious) |
| `nexi_front.png`, `nexi_back.png`, `nexi_walk.png` | ракурси, скін «Стандарт» (класичний, №001 власника) |
| `nexi_face_*.png` | емоції окремо |
| `rudik_sheet.png`, `rudik_*.png` | Рудик: сидить, іде, радіє, нявкає (дивиться вправо; вліво — дзеркало) |

Канонічні кольори Nexi (скін «Стандарт», `skins.js THEMES.standard`): корпус `#e9eefc`, акцент `#3b8cff`, шарніри `#46508a`,
очі/візор `#3be8ff`, контур `#0a0f2e`. Кольори бренду (`css/hud.css :root`): фон `#050818`, cyan `#3be8ff`, pink `#d94bff`,
gold `#ffc94d`, текст `#dbe7ff`. Сітка спрайта Nexi — 48×56 px; Рудик — див. `cat_sprite.js`.

Для заявки на ТМ/дизайн: зображення на білому тлі, без тексту, у PNG/JPG ≥ 1000 px — беруться звідси (`nexi_front.png`,
прозоре тло → біле). Логотип «Nexora AI» (словесний) — поки що тільки шрифт HUD (`.logo`, Press Start-подібний піксельний),
окремого векторного логотипа ще немає — зробити перед подачею комбінованої марки.
