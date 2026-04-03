#!/bin/bash
set -eu

SCRIPT_DIR=$(cd "$(dirname "$0")"; pwd)
cd "$SCRIPT_DIR"

php -S localhost:8887 >/dev/null 2>&1 &
SERVER_PID=$!
trap 'kill "$SERVER_PID" 2>/dev/null || true; wait "$SERVER_PID" 2>/dev/null || true' EXIT

for _ in 1 2 3 4 5; do
  if curl -fsS http://localhost:8887 >/dev/null 2>&1; then
    break
  fi
  sleep 1
done
curl -fsS http://localhost:8887 >/dev/null

python3 "$SCRIPT_DIR/test_chrome.py" "$@"
