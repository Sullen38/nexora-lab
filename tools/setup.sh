#!/usr/bin/env bash
# tools/setup.sh — підготувати все для зйомки в .cache/ (у git не йде):
#   .cache/nexora-lab — клон гри Sullen38/nexora-lab (гілка main), ЛИШЕ ЧИТАЄМО: оновлюємо до origin/main, нічого не пушимо;
#   .cache/fonts      — шрифти гри з github.com/google/fonts (sparse-checkout: ofl/pressstart2p, ofl/rubik, ofl/jetbrainsmono).
# Запуск: bash tools/setup.sh [коміт гри]   (без коміту — останній main; з комітом — знімаємо саме ту версію кімнати)
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p .cache
GAME=.cache/nexora-lab
if [ -d "$GAME/.git" ]; then
  git -C "$GAME" fetch --depth 50 origin main -q
  git -C "$GAME" checkout -q --detach "${1:-origin/main}"
else
  GIT_LFS_SKIP_SMUDGE=1 git clone -q --depth 50 https://github.com/Sullen38/nexora-lab "$GAME"
  [ -n "${1:-}" ] && git -C "$GAME" checkout -q --detach "$1"
fi
git -C "$GAME" remote set-url --push origin no-push   # клон лише для читання: push нікуди не піде
echo "гра: $(git -C "$GAME" log -1 --format='%h %cs %s')"
FONTS=.cache/fonts
if [ ! -f "$FONTS/ofl/pressstart2p/PressStart2P-Regular.ttf" ]; then
  rm -rf "$FONTS"
  git clone -q --depth 1 --filter=blob:none --sparse https://github.com/google/fonts.git "$FONTS"
  git -C "$FONTS" sparse-checkout set ofl/pressstart2p ofl/rubik ofl/jetbrainsmono
fi
echo "шрифти: $(ls "$FONTS"/ofl/*/*.ttf | xargs -n1 basename | tr '\n' ' ')"
