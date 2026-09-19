#!/usr/bin/env bash
# Pixel GrokBots — Grok Build hook relay
# Reads hook JSON on stdin and POSTs it to a local office server.
# Fail-open: never block the agent if the office is not running.

set -u
ENDPOINT="${PIXEL_GROKBOTS_URL:-http://127.0.0.1:7420/hook}"
PAYLOAD="$(cat)"

if command -v curl >/dev/null 2>&1; then
  curl -sS -m 2 -X POST "$ENDPOINT" \
    -H "Content-Type: application/json" \
    -H "X-Grok-Hook-Event: ${GROK_HOOK_EVENT:-}" \
    -H "X-Grok-Session: ${GROK_SESSION_ID:-}" \
    --data "$PAYLOAD" >/dev/null 2>&1 || true
elif command -v python3 >/dev/null 2>&1; then
  python3 - "$ENDPOINT" <<'PY' || true
import json, sys, urllib.request
url = sys.argv[1]
body = sys.stdin.buffer.read()
req = urllib.request.Request(url, data=body, method="POST")
req.add_header("Content-Type", "application/json")
try:
    urllib.request.urlopen(req, timeout=2).read()
except Exception:
    pass
PY
fi

exit 0
