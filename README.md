# Pixel GrokBots

**The most playful way to watch your Grok Bots work.**

Pixel GrokBots is a tiny office that sits on top of Grok Bot teammates and Grok Build coding sessions. Every Bot becomes a pixel character. They walk the floor, sit at desks, type when they edit, read when they search, cluster around the shared cloud computer, and raise a flag when they need your approval.

This is not a marketplace of agents and it is not a fork of Pixel Agents. It is an original visual layer for xAI's agent stack, inspired by the idea that orchestrating many Bots should feel like walking the floor of a studio — not reading logs.

**Live office:** open `index.html` or the GitHub Pages site after Pages is enabled.

[Play the office](https://davidgon8.github.io/pixel-grokbots/) · [Grok Bot](https://x.ai/news/introducing-grok-bot) · [Grok Build](https://x.ai/cli)

---

## Why this exists

Grok Bots already work like colleagues. They have a computer. They stay signed in. They hand work to each other and only pull you in for judgment. Grok Build already runs coding sessions with hooks, subagents, and plan review.

What was missing is a room you can look at.

Pixel GrokBots turns that activity into a floor plan:

- One Bot, one character
- The shared cloud computer is the center of the room
- Approval gates become speech bubbles
- Subagents walk out of the server rack and take a hot desk
- Routines clock in on a schedule
- Grok Build hook events drive the motion

## Features (v0)

- **Playable pixel office** — six named Bots on a live canvas. Click a character to pin their job.
- **Live activity states** — idle, walk, sit, type, read, browse, wait for approval, handoff, routine tick.
- **Hook-shaped event stream** — the sidebar speaks SessionStart, PreToolUse, PermissionDenied, SubagentStart, Stop so the demo teaches the real Grok Build map.
- **Shared computer** — the glowing rack in the middle is the Bot VM. Work keeps going even when a character ghosts offline.
- **Grok Build hook stub** — drop `hooks/pixel-grokbots.json` into `~/.grok/hooks/` and relay events at a local office server.
- **Original sprites** — characters and furniture are drawn in canvas. No Metro City pack, no Pixel Agents assets.

## The floor

| Bot | Role | What you see |
| --- | --- | --- |
| Orbit | Chief of Staff | Hands work off, walks the aisle, pulls you in |
| Nova | Grok Build engineer | Types, runs commands, spawns subagents |
| Rex | Research | Reads, browses, stacks notes |
| Mira | Ops / Gmail / invoices | Reviews sheets, waits on receipts |
| Kai | Sales / CRM | Drafts outreach, flags copy for approval |
| Sol | Reviewer | Sits the approval desk, clears or blocks |

## Quick start

### Watch the demo

```bash
git clone https://github.com/Davidgon8/pixel-grokbots.git
cd pixel-grokbots
python3 -m http.server 4173
# open http://127.0.0.1:4173
```

Or just open `index.html` in a browser.

### Wire Grok Build (early)

Grok Build already understands Claude-shaped hooks. Pixel GrokBots ships a passive hook that POSTs session events to a local office:

```bash
mkdir -p ~/.grok/hooks
cp hooks/pixel-grokbots.json ~/.grok/hooks/
cp hooks/bin/relay.sh ~/.grok/hooks/bin/
chmod +x ~/.grok/hooks/bin/relay.sh
```

Then run any `grok` session in a project. Events the office understands:

| Event | Motion on the floor |
| --- | --- |
| `SessionStart` | Bot walks in and sits |
| `UserPromptSubmit` | Bot stands, reads the brief |
| `PreToolUse` / `PostToolUse` | Type, read, or run — by tool name |
| `PermissionDenied` | Red flag + speech bubble |
| `SubagentStart` / `SubagentStop` | Extra character leaves / returns to the rack |
| `Stop` / `SessionEnd` | Bot leans back or clocks out |
| `Notification` | Soft chime bubble |

HTTP hooks also work. Point `type: "http"` at `http://127.0.0.1:7420/hook` when the local relay is running.

## How it is put together

```
Grok Build / Grok Bot
        │  hooks or ACP events
        ▼
  AgentEvent (normalized)
        │
        ▼
  Office runtime  — seats, paths, jobs, approvals
        │
        ▼
  Canvas floor    — characters, bubbles, the cloud computer
```

v0 is the floor and the event language. The next slice is a real Grok Build provider that listens on `~/.grok/hooks` and on ACP, plus a VS Code webview so the office can sit next to the terminal the way Pixel Agents does for Claude Code.

## Requirements

- A browser for the demo
- Optional: [Grok Build](https://x.ai/cli) (`grok`) if you want live hook relay
- Optional: a Grok Bot seat on SuperGrok or Cursor if you want the office to represent persistent teammates rather than coding sessions

## Roadmap

1. **Live provider** — ingest real Grok Build hook + ACP events, not the simulated stream
2. **Persistent teammates** — named Grok Bots keep their desk across sessions
3. **Editor panel** — VS Code / Cursor webview next to the terminal
4. **Layout editor** — paint floors, map folders to rooms, export JSON
5. **Teams** — a chief Bot that forms crews and assigns jobs from the floor

## Inspired by

[Pixel Agents](https://github.com/pixel-agents-hq/pixel-agents) showed that a coding agent is more readable as a person at a desk. Pixel Agents is MIT-licensed. This repo does not copy its source, sprites, or Metro City character pack. It reuses the *idea* of a playful office and aims it at Grok Bot and Grok Build.

## License

MIT. See [LICENSE](LICENSE).
