# Grok Build hooks → office motion

Pixel GrokBots normalizes Grok Build hook envelopes into **AgentEvent v1** and moves a character.

## Install

Command relay (default):

```bash
mkdir -p ~/.grok/hooks/bin
cp hooks/pixel-grokbots.json ~/.grok/hooks/
cp hooks/bin/relay.sh ~/.grok/hooks/bin/
chmod +x ~/.grok/hooks/bin/relay.sh
```

HTTP relay (no shell script; Grok POSTs the envelope itself):

```bash
mkdir -p ~/.grok/hooks
cp hooks/pixel-grokbots.http.json ~/.grok/hooks/
```

Then start the office server so something is listening:

```bash
node server/listen.mjs
```

Hooks are fail-open. If the office is down, Grok Build keeps working.

## Envelope Grok actually sends

Every event is JSON on stdin (command) or a POST body (HTTP).

Common fields:

| Field | Notes |
| --- | --- |
| `hookEventName` | snake_case, e.g. `pre_tool_use` |
| `hook_event_name` | PascalCase, e.g. `PreToolUse` |
| `sessionId` | sticky id for a desk binding |
| `cwd` / `workspaceRoot` | used to name unnamed sessions |
| `permissionMode` | `default` / `dontAsk` / … |
| `timestamp` | ISO-8601 |

Event extras:

| Event | Extra fields | Motion |
| --- | --- | --- |
| `SessionStart` | | walk in, sit named or hot desk |
| `UserPromptSubmit` | `promptId` | stand and read the brief |
| `PreToolUse` | `toolName`, `toolInput`, `toolUseId` | type / read / browse / rack |
| `PostToolUse` | `toolResult` | keep the same pose |
| `PostToolUseFailure` | | red bubble |
| `PermissionDenied` | | freeze + `!` |
| `Notification` | `notificationType`: `permission_prompt` \| `idle_prompt` | approval flag or idle |
| `SubagentStart` | `subagentType` | extra character from the rack |
| `SubagentStop` | `subagentType` | release hot desk |
| `Stop` / `StopFailure` / `SessionEnd` | `reason` | lean back or clock out |

There is no `PermissionRequest` event. Approval gates arrive as `Notification` with `notificationType: "permission_prompt"`, or as `PermissionDenied` when the runtime already blocked the tool.

## Tool families

Claude names are accepted and rewritten to Grok names before grouping.

| Family | Grok tools | Claude aliases | Motion |
| --- | --- | --- | --- |
| `edit` | `search_replace`, `write_file` | Edit, Write, MultiEdit | type |
| `read` | `read_file`, `grep`, `list_dir` | Read, Grep, Glob | read |
| `browse` | `web_search`, `web_fetch` | WebSearch | browse |
| `bash` | `run_terminal_command` | Bash | walk to the rack |
| `subagent` | `spawn_subagent` | Task | spawn |

## AgentEvent v1

```json
{
  "v": 1,
  "kind": "PreToolUse",
  "sessionId": "abc-123",
  "cwd": "/Users/you/project",
  "workspaceRoot": "/Users/you/project",
  "toolName": "search_replace",
  "toolFamily": "edit",
  "motion": "type",
  "timestamp": "2026-04-14T12:00:00Z"
}
```

`core/events.mjs` (Node) and `js/events.js` (browser) implement the same mapping. The office listens for `pixel-grokbots:event`.
