#!/usr/bin/env bash
# Captura headless da documentação (macOS/Linux).
#   ./shots.sh /caminho/do/documentos
# Depois ABRA as imagens. Passar no check.js não substitui olhar.
set -euo pipefail

DOCS="${1:-$PWD}"
OUT="${2:-${TMPDIR:-/tmp}/arch-docs-shots}"

CHROME=""
for c in \
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  "$(command -v google-chrome || true)" \
  "$(command -v chromium || true)" \
  "$(command -v chromium-browser || true)"; do
  [ -n "$c" ] && [ -x "$c" ] && CHROME="$c" && break
done
[ -n "$CHROME" ] || { echo "Chrome/Chromium não encontrado"; exit 1; }

mkdir -p "$OUT"
INDEX="file://$DOCS/index.html"

shot() { # $1=arquivo $2=tamanho $3=url
  "$CHROME" --headless=new --disable-gpu --no-sandbox --hide-scrollbars \
    --force-prefers-reduced-motion --virtual-time-budget=10000 \
    --window-size="$2" --user-data-dir="$OUT/profile" \
    --screenshot="$OUT/$1" "$3" >/dev/null 2>&1
  echo "  $1"
}

# 1366x768 é o teste que importa: se não couber aqui, está ruim
grep -o 'data-subtab="sub-[^"]*"' "$DOCS/index.html" \
  | sed 's/data-subtab="//; s/"//' | sort -u | while read -r s; do
  shot "laptop-$s.png" "1366,768" "$INDEX#$s"
done

shot "wide.png" "1920,1080" "$INDEX"

# OBS: o Chrome headless não encolhe abaixo de ~800px sem emulação de
# dispositivo. Um "corte" na captura de 430px costuma ser artefato, não bug.
shot "narrow.png" "800,1200" "$INDEX"

echo
echo "Imagens em: $OUT"
echo "Agora ABRA cada uma. Procure: painel fantasma, card cortado,"
echo "rótulo atrás de card, linha empilhada, desenho fora da primeira tela."
