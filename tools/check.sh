#!/usr/bin/env bash
# ==============================================================================
# tools/check.sh — УСЯ ПЕРЕВІРКА ПЕРЕД КОМІТОМ ОДНІЄЮ КОМАНДОЮ (її ж запускає GitHub на кожен push)
# ------------------------------------------------------------------------------
#   tools/check.sh              повна: описи файлів, збірка, консоль (комп'ютер + телефон), тексти 4 мовами,
#                               декор поза зонами, бюджет швидкодії (ліміти з tools/budget.json)
#   tools/check.sh --fast       те саме без бюджету швидкодії (~1,5 хв замість ~4)
#   tools/check.sh --same       ще й «вигляд не змінився» піксель у піксель проти HEAD (для чистки й оптимізації)
#   tools/check.sh --ci <коміт> як на GitHub: швидкодія — не проти лімітів, а «до / після» проти того коміту на цій машині
# Іде до кінця, навіть якщо крок упав, і наприкінці друкує список: що гаразд, що ні. Код виходу 1 — хоч один крок упав.
# Знімок комп'ютера лишається в shot.png, телефона — у shot_phone.png (обидва не комітяться).
# ==============================================================================
cd "$(dirname "$0")/.." || exit 1
MODE=full; BASE=""; SAME=0
while [ $# -gt 0 ]; do case "$1" in
  --fast) MODE=fast ;; --same) SAME=1 ;; --ci) MODE=ci; BASE="$2"; shift ;;
  *) echo "невідомий ключ: $1"; exit 2 ;; esac; shift; done

# Playwright у контейнері чатів лежить окремо — підхопити самому
if ! node -e "require('playwright')" 2>/dev/null && [ -d /opt/npm-tools/node_modules/playwright ]; then export NODE_PATH=/opt/npm-tools/node_modules; fi
if [ -z "$CHROMIUM" ] && [ -z "$CI" ] && [ -x /usr/bin/google-chrome ]; then export CHROMIUM=/usr/bin/google-chrome; fi

OK=(); BAD=(); LOG=$(mktemp)
step() {   # step "назва" "що має бути у виводі (grep -E)" "чого не має бути" команда…
  local name="$1" must="$2" mustnot="$3"; shift 3
  echo; echo "── $name"
  "$@" 2>&1 | tee "$LOG"; local code=${PIPESTATUS[0]} why=""
  [ "$code" -ne 0 ] && why="код виходу $code"
  [ -n "$must" ] && ! grep -Eq "$must" "$LOG" && why="${why:+$why; }немає «$must»"
  [ -n "$mustnot" ] && grep -Eq "$mustnot" "$LOG" && why="${why:+$why; }є «$(grep -Eom1 "$mustnot" "$LOG")»"
  if [ -z "$why" ]; then OK+=("$name"); else BAD+=("$name — $why"); fi
}

heads() {   # кожен файл коду починається з коментаря-опису (на це спирається сканер портфоліо)
python3 - <<'PY'
import pathlib, sys
bad = []
files = [p for d, pats in (('js', ['*.js']), ('css', ['*.css']), ('tools', ['*.js', '*.py', '*.sh'])) for pat in pats for p in pathlib.Path(d).rglob(pat)]
for p in sorted(files):
    lines = [l.strip() for l in p.read_text(encoding='utf-8').splitlines() if l.strip()]
    if lines and lines[0].startswith('#!'): lines = lines[1:]
    first = lines[0] if lines else ''
    ok = first.startswith(('/*', '//')) if p.suffix in ('.js', '.css') else first.startswith(('#', '"""', "'''"))
    if not ok: bad.append(str(p))
print(f'файлів коду: {len(files)}; без опису на початку: {bad if bad else "немає"}')
sys.exit(1 if bad else 0)
PY
}
build() { python3 tools/build.py && { git diff --quiet -- index.html || { echo "index.html: лічильник скриптів (data-js) був застарілий — збірка його оновила, закоміть index.html"; [ -z "$CI" ]; }; }; }
phone() { node tools/shot.js - 2000 - 390 844 2 && mv -f shot.png shot_phone.png && echo "(знімок телефона — shot_phone.png)"; }
desk() { node tools/shot.js - 2500; }

step "описи файлів"            ""                              ""                         heads
step "збірка"                  "built dist/nexora-lab.html"    ""                         build
step "консоль · телефон"       "no errors"                     ""                         phone
step "консоль · комп'ютер"     "no errors"                     ""                         desk
step "тексти 4 мовами"         "nl [0-9]+ strings"             'suspicious: \[[^]]'       node tools/texts.js 1500
step "декор поза зонами"       "DECOR OVER ZONES[^:]*: none"   ""                         node tools/wingbox/decor_check.js "${TMPDIR:-/tmp}/c"
if [ "$MODE" = full ]; then step "бюджет швидкодії" "бюджет: у межах" "" node tools/budget.js --retry 1; fi
if [ "$MODE" = ci ]; then
  if [ -n "$BASE" ] && git cat-file -e "$BASE^{commit}" 2>/dev/null; then step "швидкодія «до / після» ($BASE)" "бюджет: у межах" "" node tools/budget.js --ref "$BASE" --retry 1
  else echo; echo "── швидкодія: немає коміту для порівняння ($BASE) — пропущено"; fi
fi
if [ "$SAME" = 1 ]; then step "вигляд не змінився (same.js)" "" "" node tools/same.js; fi

rm -f "$LOG"
echo; echo "════════ ПІДСУМОК ════════"
for s in "${OK[@]}"; do echo "  ✓ $s"; done
for s in "${BAD[@]}"; do echo "  ✗ $s"; done
if [ ${#BAD[@]} -eq 0 ]; then echo "усе гаразд — можна комітити"; else echo "Є ПРОБЛЕМИ: ${#BAD[@]} — не комітити, доки не виправлено"; exit 1; fi
