/**
 * Pixel GrokBots — Grok Build hook → AgentEvent v1
 * Shared by the local office server. Browser copy: js/events.js
 */

export const EVENT_KINDS = [
  "SessionStart",
  "SessionEnd",
  "UserPromptSubmit",
  "PreToolUse",
  "PostToolUse",
  "PostToolUseFailure",
  "PermissionDenied",
  "Notification",
  "SubagentStart",
  "SubagentStop",
  "Stop",
  "StopFailure",
  "StopCancelled",
];

const TOOL_FAMILY = {
  search_replace: "edit",
  write_file: "edit",
  edit: "edit",
  write: "edit",
  multiedit: "edit",
  strreplace: "edit",
  read_file: "read",
  read: "read",
  grep: "read",
  glob: "read",
  list_dir: "read",
  listdir: "read",
  web_search: "browse",
  websearch: "browse",
  web_fetch: "browse",
  browse: "browse",
  run_terminal_command: "bash",
  run_terminal_cmd: "bash",
  bash: "bash",
  spawn_subagent: "subagent",
  task: "subagent",
};

const CLAUDE_TO_GROK = {
  Bash: "run_terminal_command",
  Read: "read_file",
  Edit: "search_replace",
  Write: "search_replace",
  MultiEdit: "search_replace",
  Grep: "grep",
  Glob: "list_dir",
  ListDir: "list_dir",
  WebSearch: "web_search",
  Task: "spawn_subagent",
};

const KIND_ALIAS = {
  session_start: "SessionStart",
  session_end: "SessionEnd",
  user_prompt_submit: "UserPromptSubmit",
  pre_tool_use: "PreToolUse",
  post_tool_use: "PostToolUse",
  post_tool_use_failure: "PostToolUseFailure",
  permission_denied: "PermissionDenied",
  permission_request: "PermissionDenied",
  notification: "Notification",
  subagent_start: "SubagentStart",
  subagent_stop: "SubagentStop",
  stop: "Stop",
  stop_failure: "StopFailure",
  stop_cancelled: "StopCancelled",
};

export function canonicalToolName(name) {
  if (!name) return null;
  if (CLAUDE_TO_GROK[name]) return CLAUDE_TO_GROK[name];
  return String(name);
}

export function toolFamily(name) {
  const canonical = canonicalToolName(name);
  if (!canonical) return null;
  const key = canonical.toLowerCase().replace(/[^a-z0-9_]/g, "");
  return TOOL_FAMILY[canonical] || TOOL_FAMILY[key] || "other";
}

export function canonicalKind(raw) {
  if (!raw) return null;
  if (EVENT_KINDS.includes(raw)) return raw;
  const lower = String(raw).trim();
  if (KIND_ALIAS[lower]) return KIND_ALIAS[lower];
  const pascal = lower.replace(/(^|[_\s-])(\w)/g, (_, __, c) => c.toUpperCase());
  if (EVENT_KINDS.includes(pascal)) return pascal;
  return raw;
}

function pick(obj, ...keys) {
  for (const key of keys) {
    if (obj && obj[key] != null && obj[key] !== "") return obj[key];
  }
  return null;
}

/**
 * Normalize a Grok Build / Claude-shaped hook payload (plus HTTP headers).
 */
export function normalizeHook(raw = {}, headers = {}) {
  const body = typeof raw === "string" ? safeJson(raw) : raw || {};
  const kind = canonicalKind(
    pick(
      body,
      "hook_event_name",
      "hookEventName",
      "event",
      "kind"
    ) || headers["x-grok-hook-event"] || headers["x-pixel-event"]
  ) || "Notification";

  const toolName = canonicalToolName(
    pick(body, "toolName", "tool_name", "tool")
  );

  return {
    v: 1,
    kind,
    sessionId: String(
      pick(body, "sessionId", "session_id") ||
        headers["x-grok-session"] ||
        headers["x-grok-session-id"] ||
        ""
    ),
    cwd: pick(body, "cwd") || null,
    workspaceRoot: pick(body, "workspaceRoot", "workspace_root") || null,
    permissionMode: pick(body, "permissionMode", "permission_mode") || null,
    toolName,
    toolFamily: toolFamily(toolName),
    toolUseId: pick(body, "toolUseId", "tool_use_id") || null,
    toolInput: body.toolInput || body.tool_input || null,
    subagentType: pick(body, "subagentType", "subagent_type") || null,
    notificationType: pick(body, "notificationType", "notification_type") || null,
    reason: pick(body, "reason") || null,
    promptId: pick(body, "promptId", "prompt_id") || null,
    timestamp: pick(body, "timestamp") || new Date().toISOString(),
    motion: motionFor(kind, toolFamily(toolName), pick(body, "notificationType", "notification_type")),
    raw: body,
  };
}

export function motionFor(kind, family, notificationType) {
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

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return { text };
  }
}
