/* Pixel GrokBots — live hook ingest over EventSource / WebSocket */
(function (root) {
  const DEFAULTS = {
    eventsUrl: "http://127.0.0.1:7420/events",
    wsUrl: "ws://127.0.0.1:7420/ws",
    healthUrl: "http://127.0.0.1:7420/health",
  };

  function normalize(raw) {
    const lib = root.PixelGrokBotsEvents;
    if (lib && typeof lib.normalizeHook === "function") return lib.normalizeHook(raw);
    return raw;
  }

  function emit(event) {
    const detail = normalize(event);
    root.dispatchEvent(new CustomEvent("pixel-grokbots:event", { detail }));
    if (typeof root.onPixelGrokEvent === "function") root.onPixelGrokEvent(detail);
    return detail;
  }

  function connect(opts) {
    const cfg = Object.assign({}, DEFAULTS, opts || {});
    const state = { mode: "offline", source: null, ws: null, stop: function () {} };

    function goLive(mode) {
      if (state.mode !== "live") {
        state.mode = "live";
        root.dispatchEvent(new CustomEvent("pixel-grokbots:connection", { detail: { mode: "live", transport: mode } }));
      }
    }
    function goOffline(reason) {
      if (state.mode !== "offline") {
        state.mode = "offline";
        root.dispatchEvent(new CustomEvent("pixel-grokbots:connection", { detail: { mode: "offline", reason } }));
      }
    }

    function openSse() {
      if (typeof EventSource === "undefined") return false;
      try {
        const src = new EventSource(cfg.eventsUrl);
        state.source = src;
        src.addEventListener("hook", function (ev) {
          try { emit(JSON.parse(ev.data)); goLive("sse"); } catch (_) {}
        });
        src.onmessage = function (ev) {
          try { emit(JSON.parse(ev.data)); goLive("sse"); } catch (_) {}
        };
        src.onerror = function () { goOffline("sse-error"); };
        src.onopen = function () { goLive("sse"); };
        return true;
      } catch (_) {
        return false;
      }
    }

    function openWs() {
      if (typeof WebSocket === "undefined") return false;
      try {
        const ws = new WebSocket(cfg.wsUrl);
        state.ws = ws;
        ws.onmessage = function (ev) {
          try { emit(JSON.parse(ev.data)); goLive("ws"); } catch (_) {}
        };
        ws.onopen = function () { goLive("ws"); };
        ws.onclose = function () { goOffline("ws-close"); };
        ws.onerror = function () { goOffline("ws-error"); };
        return true;
      } catch (_) {
        return false;
      }
    }

    fetch(cfg.healthUrl, { mode: "cors" }).then(function (res) {
      if (!res.ok) throw new Error("unhealthy");
      if (!openSse()) openWs();
    }).catch(function () {
      goOffline("no-server");
    });

    state.stop = function () {
      if (state.source) state.source.close();
      if (state.ws) try { state.ws.close(); } catch (_) {}
    };
    return state;
  }

  root.PixelGrokBotsIngest = { connect, emit, normalize };
})(typeof window !== "undefined" ? window : globalThis);
