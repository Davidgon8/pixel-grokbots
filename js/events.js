/* Pixel GrokBots — browser AgentEvent v1 normalizer (mirrors core/events.mjs) */
(function (root) {
  const EVENT_KINDS = [
    "SessionStart", "SessionEnd", "UserPromptSubmit", "PreToolUse", "PostToolUse",
    "PostToolUseFailure", "PermissionDenied", "Notification", "SubagentStart",
    "SubagentStop", "Stop", "StopFailure", "StopCancelled",
  ];
  const TOOL_FAMILY = {
    search_replace: "edit", write_file: "edit", edit: "edit", write: "edit",
    multiedit: "edit", read_file: "read", read: "read", grep: "read", glob: "read",
    list_dir: "read", listdir: "read", web_search: "browse", websearch: "browse",
    web_fetch: "browse", browse: "browse", run_terminal_command: "bash",
    run_terminal_cmd: "bash", bash: "bash", spawn_subagent: "subagent", task: "subagent",
  };
  const CLAUDE_TO_GROK = {
    Bash: "run_terminal_command", Read: "read_file", Edit: "search_replace",
    Write: "search_replace", MultiEdit: "search_replace", Grep: "grep",
    Glob: "list_dir", ListDir: "list_dir", WebSearch: "web_search", Task: "spawn_subagent",
  };
  const KIND_ALIAS = {
    session_start: "SessionStart", session_end: "SessionEnd",
    user_prompt_submit: "UserPromptSubmit", pre_tool_use: "PreToolUse",
    post_tool_use: "PostToolUse", post_tool_use_failure: "PostToolUseFailure",
    permission_denied: "PermissionDenied", permission_request: "PermissionDenied",
    notification: "Notification", subagent_start: "SubagentStart",
    subagent_stop: "SubagentStop", stop: "Stop", stop_failure: "StopFailure",
    stop_cancelled: "StopCancelled",
  };

  function canonicalToolName(name) {
    if (!name) return null;
    return CLAUDE_TO_GROK[name] || String(name);
  }
  function toolFamily(name) {
    const canonical = canonicalToolName(name);
    if (!canonical) return null;
    return TOOL_FAMILY[canonical] || TOOL_FAMILY[canonical.toLowerCase()] || "other";
  }
  function canonicalKind(raw) {
    if (!raw) return null;
    if (EVENT_KINDS.includes(raw)) return raw;
    if (KIND_ALIAS[raw]) return KIND_ALIAS[raw];
    return raw;
  }
  function pick(obj, keys) {
    for (const key of keys) if (obj && obj[key] != null && obj[key] !== "") return obj[key];
    return null;
  }
  function motionFor(kind, family, notificationType) {
    if (kind === "SessionStart") return "enter";
    if (kind === "SessionEnd") return "leave";
    if (kind === "UserPromptSubmit") return "read";
    if (kind === "PermissionDenied") return "wait";
    if (kind === "Notification" && notificationType === "permission_prompt") return "wait";
    if (kind === "SubagentStart") return "spawn";
    if (kind === "SubagentStop") return "despawn";
    if (kind === "Stop" || kind === "StopCancelled") return "idle";
    if (kind === "StopFailure" || kind === "PostToolUseFailure") return "wait";
    if (kind === "PreToolUse" || kind === "PostToolUse") {
      if (family === "edit") return "type";
      if (family === "read") return "read";
      if (family === "browse") return "browse";
      if (family === "bash") return "rack";
      if (family === "subagent") return "spawn";
      return "type";
    }
    return "idle";
  }

  function normalizeHook(raw) {
    const body = raw || {};
    const kind = canonicalKind(pick(body, ["hook_event_name", "hookEventName", "event", "kind"])) || "Notification";
    const toolName = canonicalToolName(pick(body, ["toolName", "tool_name", "tool"]));
    const notificationType = pick(body, ["notificationType", "notification_type"]);
    const family = toolFamily(toolName);
    return {
      v: 1,
      kind,
      sessionId: String(pick(body, ["sessionId", "session_id"]) || ""),
      cwd: pick(body, ["cwd"]) || null,
      workspaceRoot: pick(body, ["workspaceRoot", "workspace_root"]) || null,
      permissionMode: pick(body, ["permissionMode", "permission_mode"]) || null,
      toolName,
      toolFamily: family,
      toolUseId: pick(body, ["toolUseId", "tool_use_id"]) || null,
      toolInput: body.toolInput || body.tool_input || null,
      subagentType: pick(body, ["subagentType", "subagent_type"]) || null,
      notificationType,
      reason: pick(body, ["reason"]) || null,
      timestamp: pick(body, ["timestamp"]) || new Date().toISOString(),
      motion: motionFor(kind, family, notificationType),
      raw: body,
    };
  }

  root.PixelGrokBotsEvents = { normalizeHook, canonicalKind, toolFamily, motionFor, EVENT_KINDS };
})(typeof window !== "undefined" ? window : globalThis);
