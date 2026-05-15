#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/med-eats-backend"
MOBILE_DIR="$ROOT_DIR/med-eats-mobile"
NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]")"

if [[ "$NODE_MAJOR" != "22" ]]; then
  echo "MedEats requiere Node 22.x. Ejecuta 'nvm use' en la raíz del repo antes de correr 'npm run dev'." >&2
  exit 1
fi

PYTHON_BIN="$ROOT_DIR/.venv/bin/python"
if [[ ! -x "$PYTHON_BIN" ]]; then
  if command -v python3 >/dev/null 2>&1; then
    PYTHON_BIN="$(command -v python3)"
  elif command -v python >/dev/null 2>&1; then
    PYTHON_BIN="$(command -v python)"
  else
    echo "No se encontró Python. Activa el entorno virtual o instala Python 3." >&2
    exit 1
  fi
fi

cleanup() {
  if [[ -n "${BACKEND_PID:-}" ]] && kill -0 "$BACKEND_PID" >/dev/null 2>&1; then
    kill "$BACKEND_PID" >/dev/null 2>&1 || true
  fi
}

trap cleanup EXIT INT TERM

echo "→ Backend: $BACKEND_DIR"
echo "→ Mobile:  $MOBILE_DIR"
echo "→ Node:    $(node -v)"
echo "→ Python:  $PYTHON_BIN"

(
  cd "$BACKEND_DIR"
  exec "$PYTHON_BIN" manage.py runserver 0.0.0.0:8000
) &
BACKEND_PID=$!

sleep 2
if ! kill -0 "$BACKEND_PID" >/dev/null 2>&1; then
  echo "El backend terminó antes de iniciar Expo. Revisa el error arriba." >&2
  exit 1
fi

cd "$MOBILE_DIR"
exec npm run start:clean
