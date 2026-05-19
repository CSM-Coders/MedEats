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

free_port_if_busy() {
  local port="$1"
  local pids

  # lsof devuelve una lista de PIDs que están escuchando ese puerto.
  pids="$(lsof -ti tcp:"$port" -sTCP:LISTEN 2>/dev/null || true)"

  if [[ -n "$pids" ]]; then
    echo "⚠ Puerto $port en uso. Liberándolo..."
    while IFS= read -r pid; do
      [[ -z "$pid" ]] && continue
      kill "$pid" >/dev/null 2>&1 || true
      sleep 0.2
      if kill -0 "$pid" >/dev/null 2>&1; then
        kill -9 "$pid" >/dev/null 2>&1 || true
      fi
    done <<< "$pids"
    echo "✓ Puerto $port liberado"
  fi
}

trap cleanup EXIT INT TERM

echo "→ Backend: $BACKEND_DIR"
echo "→ Mobile:  $MOBILE_DIR"
echo "→ Node:    $(node -v)"
echo "→ Python:  $PYTHON_BIN"

# Evita fallos comunes al reiniciar dev varias veces en el mismo día.
free_port_if_busy 8000
free_port_if_busy 8081

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
