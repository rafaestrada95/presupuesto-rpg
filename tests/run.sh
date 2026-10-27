#!/usr/bin/env bash
# Corre todas las pruebas: tests/run.sh   (o una: tests/run.sh cards)
cd "$(dirname "$0")" && ./setup.sh
export NODE_PATH=${NODE_PATH:-$(npm root -g)}
status=0
if [ -n "$1" ]; then files="t-$1.js"; else files=$(ls t-*.js); fi
for f in $files; do
  out=$(timeout 300 node "$f" 2>&1); code=$?
  if [ $code -ne 0 ]; then status=1; echo "✗ $f"; echo "$out" | grep -E '^FAIL' | sed 's/^/    /'; else echo "✓ $f ($(echo "$out" | grep -c '^OK') verificaciones)"; fi
done
exit $status
