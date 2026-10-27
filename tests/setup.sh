#!/usr/bin/env bash
# Prepara React sin internet para las pruebas (una vez por máquina)
set -e
cd "$(dirname "$0")"
mkdir -p vend out
[ -f vend/react-dom.production.min.js ] && exit 0
tmp=$(mktemp -d); (cd "$tmp" && npm pack react@18.2.0 react-dom@18.2.0 --silent >/dev/null && tar xzf react-18.2.0.tgz && cp package/umd/react.production.min.js "$OLDPWD/vend/" && rm -rf package && tar xzf react-dom-18.2.0.tgz && cp package/umd/react-dom.production.min.js "$OLDPWD/vend/"); rm -rf "$tmp"
