#!/usr/bin/env bash
# Pixel GrokBots — Grok Build hook relay
# Reads hook JSON on stdin and POSTs it to the local office server.
# Fail-open: never block the agent if the office is not running.

set -u
ENDPOINT="${PIXEL_GROKBOTS_URL:-http://127.0.0.1:7420/hook}"
EVENT="${GROK_HOOK_EVENT:-${GROK_HOOK_NAME:-}}"
SESSION="${GROK_SESSION_ID:-}"

# Slurp stdin exactly once. Grok writes the event envelope here.
PAYLOAD=$(cat || true)
if [ -z "${PAYLOAD}" ]; then
  PAYLOAD="{}"
fi

post_with_curl() {
  printf '%s' "$PAYLOAD" | curl -sS -m 2 -X POST "$ENDPOINT" \
    -H "Content-Type: application/json" \
    -H "X-Grok-Hook-Event: ${EVENT}" \
    -H "X-Grok-Session: ${SESSION}" \
    --data-binary @- >/dev/null 2>&1
}

post_with_python() {
  PIXEL_GROKBOTS_URL="$ENDPOINT" \
  PIXEL_GROKBOTS_EVENT="$EVENT" \
  PIXEL_GROKBOTS_SESSION="$SESSION" \
  PIXEL_GROKBOTS_PAYLOAD="$PAYLOAD" \
  python3 - <<'PY'
import os, urllib.request
url = os.environ.get("PIXEL_GROKBOTS_URL", "http://127.0.0.1:7420/hook")
body = os.environ.get("PIXEL_GROKBOTS_PAYLOAD", "{}").encode()
req = urllib.request.Request(url, data=body, method="POST")
req.add_header("Content-Type", "application/json")
req.add_header("X-Grok-Hook-Event", os.environ.get("PIXEL_GROKBOTS_EVENT", ""))
req.add_header("X-Grok-Session", os.environ.get("PIXEL_GROKBOTS_SESSION", ""))
try:
    urllib.request.urlopen(req, timeout=2).read()
except Exception:
    pass
PY
}

if command -v curl >/dev/null 2>&1; then
  post_with_curl || true
elif command -v python3 >/dev/null 2>&1; then
  post_with_python || true
fi

exit 0
