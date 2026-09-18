# status

A small local [Pi](https://pi.dev) extension that gathers project status and publishes
structured widgets to `pi-fancy-footer`. It never renders a footer, status block, or
editor widget itself.

## Architecture

```text
Pi tool lifecycle + session/Goal metadata + OpenSpec CLI + aggregate JSON state
                                  │
                                  ▼
                        normalized immutable state
                                  │
                                  ▼
             bounded header events + pi-fancy-footer snapshots
```

The five stable widget IDs are:

- `galactica.work`
- `galactica.openspec-progress`
- `galactica.openspec`
- `galactica.diagnostics`
- `galactica.orchestration`

`pi-fancy-footer` remains the only visible footer renderer and supplies native model,
thinking, context, quota, location, Git, pull-request, and diff information.

## Installation

This repository loads the package from Pi settings:

```json
{
    "packages": ["npm:pi-fancy-footer", "./packages/status"]
}
```

The relative package path is resolved from `~/.pi/agent/settings.json`, so the managed
source lives at `.pi/agent/packages/status` in Galactica.

## OpenSpec detection

The provider uses the installed OpenSpec CLI and reads only each listed change's bounded
`.openspec.yaml` schema marker to distinguish Ramona Ideas from Plans:

1. `openspec list --json` finds changes, aggregate progress, state, and the OpenSpec
   root. The always-visible footer totals completed/total Plans and Tasks. Changes
   marked `schema: ramona-idea` are excluded from Plan and Task totals; generic OpenSpec
   changes count as Plans.
2. An explicitly selected change is matched by exact ID. With no explicit selection,
   focused collection stops; repository recency never chooses a change.
3. `openspec show <change> --json` supplies the concise title.
4. `openspec instructions apply --change <change> --json` supplies task state and the
   schema-resolved task artifact path.
5. The task artifact is read once per refresh to recover labels such as `3.8` and kinds
   such as Story, Spike, Lab, or Hack.

The session focus takes precedence over configured `openspec.change`, which takes
precedence over `PI_OPENSPEC_CHANGE`. Configuration and environment values can select a
change for collection/debugging, but they do not create session task focus or expose an
active OpenSpec footer by themselves.

## Session focus and terminal title

A Pi session has zero or one explicit OpenSpec task focus, optional read-only Pi Goal
state, and an independent ephemeral Session Work state. Display priority is OpenSpec
Task → Goal → Session Work → safe direct fallback. OpenSpec focus clears active Session
Work when acquired, preventing hidden or stale work from resurfacing later.

Session Work is stored only as versioned custom entries on the active Pi session branch;
it never creates a repository status file. It supports this lifecycle:

```text
/work
/work set Implement session metadata
/work validate
/work clear
```

When no OpenSpec portfolio is available, the matching row-one footer fallback is the
compact `▶ Focus` or `◇ Validate`; an active Goal uses `󰊕 Goal`, and an entirely empty
project uses ` no OpenSpec`. The detailed Session Work intent remains in the header
instead of being duplicated in the footer. Active and validation states also replace the
fallback terminal title. Reload, resume, and tree navigation restore the newest valid
branch entry. The agent-callable `work_focus` tool exposes the same `status`, `set`,
`validate`, and `clear` actions. The agent-callable `openspec_focus` tool likewise
shares the command's `status`, safeguarded `set`, deliberate `replace`, and persistent
`clear` transitions.

Global routing belongs to native Ramona policy rather than this status package. This
package does not inject parent routing prompts, block parent tools, create Session Work
for a global route, or promote a raw request into OpenSpec focus. It continues to own
branch-local OpenSpec and Session Work state, commands, restoration, titles, and footer
publication.

The header projection uses the rich lifecycle `understanding`, `working`, `waiting`,
`assuring`, `learning`, `answering`, `blocked`, `listening`, or `aborted`. It separately
publishes one explicit selection with OpenSpec Task → Goal → Session Work precedence,
or `null` when no work is selected. A controlled suggestion enum communicates only
Human-facing reporting cues such as `requesting-validation`,
`awaiting-continuation`, or `requesting-redirection`; it never carries generated
prose. Direct tool
categories, read-only Pi Goal state, and known Taskflow phases move the lifecycle
without exposing arguments or raw node prose. Goal state is restored from Pi's canonical
`goal-state` session entries without enabling Goal RPC. An active Goal renders bounded
automatic-turn progress from `pi-goal.json`; paused, blocked, limited, external-wait,
and complete states render controlled labels. Complete projects as
`awaiting Human validation` rather than Human acceptance. Raw Goal objectives, wait
reasons, completion summaries, paths, and Goal IDs never enter the visible header. While
a Goal exists, a session-scoped 500 ms in-memory branch monitor catches idle
`/goal pause`, clear, and menu transitions; it performs no filesystem, process,
provider, or network work and stops when Goal state is cleared. A stopped Goal remains
visible while Pi is idle so its terminal reason is honest, but the next ordinary
non-Goal turn automatically returns the title to current Ramona, OpenSpec, Session Work,
or direct activity. This display transition never mutates Goal or focus state; a later
Goal resume automatically reclaims the title. During a Taskflow tool run, structured
streaming state temporarily replaces the normal focus with the running top-level phase
ID, such as `working ⟩ work-fragment`; promoted child IDs and generated output remain
hidden. Visible assistant text moves it to `answering`; settling with selected work
moves it to `waiting`; no selected work returns to `listening`. Direct tool starts
describe the bounded operation, while tool completion immediately moves to a bounded
transition: read-only inspection → `finalizing current request`, mutation →
`reviewing applied changes`, and verification → `reviewing check results`. Parallel
tools keep the newest remaining operation visible until all complete; any failed
operation transitions to bounded recovery. This prevents a completed command from
looking permanently active while Pi prepares its next action. A Ctrl-C assistant stop
reason moves it to `aborted` and remains visible until the next turn resets it to
`understanding`. Legacy work titles still preserve the existing explicit fallback states for compatible
consumers. The additive selection field contains only an exact OpenSpec Task, Goal, or
Session Work; otherwise it is `null`, so the deck renders a stable dim `󰓾 —`. `Direct
response` is never presented as selection and Human prompt text is never copied into it.

The header protocol also carries a bounded `activeRuns` aggregate. Bash is active from
Pi's `tool_execution_start` through `tool_execution_end` and contributes only one child
run. Subagent progress is read structurally from `pi-subagent` result details: a call is
active only after `sawAgentStart`, before `sawAgentSettled`, and while its `exitCode`
remains `-1`. Placeholder headline totals are never used because they include queued
calls. The aggregate contains only child-run and subagent integers; prompts, agent names,
PIDs, arguments, and child output are discarded. The main Pi process is intentionally
absent. The deck always renders both counts in its first-row runtime capsule and changes
zero/live color instead of publishing state-dependent display visibility.

The generic outer request has no `change` or `task` arguments and therefore creates no
durable focus side effect here. Existing specialized Taskflow calls may still acquire
exact OpenSpec focus from non-placeholder `change` and `task` arguments. Legacy `none`
placeholders are ignored. Human slash commands remain Human-owned manual controls; the
agent tool may act only on explicit Human direction or an exact declared Task handoff,
never inferred material Plan selection or Human validation.

A Pi session acquires OpenSpec focus before an OpenSpec-aware Taskflow tool run executes
when its input contains string `change` and `task` arguments:

```json
{
    "action": "run",
    "args": {
        "change": "show-active-openspec-in-pi-title",
        "task": "1.1"
    }
}
```

Taskflow slash-command invocations do not pass through Pi's `tool_call` hook. Set focus
manually before those runs:

```text
/openspec-focus
/openspec-focus show-active-openspec-in-pi-title 1.1
/openspec-focus replace another-change 2.1
/openspec-focus clear
```

Aggregate portfolio progress is independent of focus and remains visible as:

```text
 7/15 ›  36/45
```

It occupies the right side of footer row one, opposite the full PWD and Git state. It
updates from `openspec list --json`; task-list `` replaces `Plans` and notebook ``
replaces `Tasks`. If no OpenSpec portfolio exists, the slot prefers compact active scope
(`󰊕 Goal`, then `▶ Focus` or `◇ Validate`) before falling back to dim ` no OpenSpec`.
Focused-change metadata remains separate and does not replace these totals. The
no-argument form reports the current focus without changing it. The matching tool calls
are:

```json
{"action":"status"}
{"action":"set","change":"show-active-openspec-in-pi-title","task":"1.1"}
{"action":"replace","change":"another-change","task":"2.1"}
{"action":"clear"}
```

`set` acquires empty focus but refuses a different active Task. `replace` makes that
switch deliberate. Both acquisition paths clear conflicting Session Work before the
OpenSpec branch entry is appended. Missing or empty identifiers fail without writing an
entry, while `clear` appends the branch-local no-focus state.

A conflicting Taskflow tool run is blocked until focus is cleared or deliberately
replaced. Focus is stored as a versioned custom entry on the active Pi session branch,
so reload/resume restores the newest valid task or clear entry. Unrelated turns and
Taskflow success, failure, blocking, pause, or approval states do not clear focus or
modify OpenSpec task checkboxes.

The extension emits a fallback title immediately at session start, then updates it after
asynchronous OpenSpec metadata resolves:

- focused metadata: `π  {change} › {task-id} {short task}`
- focused IDs only: `π  {change} › {task-id}`
- Session Work validation: `π  Validate › {intent}`
- active Session Work: `π  {intent}`
- no focus: `π  {session name || repository basename || cwd basename}`

Control characters and repeated whitespace are removed, titles are bounded, and an
unchanged refresh does not emit a duplicate title update. Without explicit focus, the
aggregate footer still reports Plan and Task totals without selecting a change. The
legacy focused-status producer also gives quiet state feedback:

- actionable task work exists: dim `○ OpenSpec · no focus`
- no actionable task work exists: dim `○ OpenSpec · clear`
- no `openspec/` project exists: row one shows Goal or Focus when active, otherwise dim
  ` no OpenSpec`
- OpenSpec status cannot be read: the last aggregate remains while focused status
  reports unavailable

While focused, it prioritizes the active action over duplicated metadata:

```text
[-] 1/2 ▶ 1.1 Create root-level `greeting.txt` with exact contents
```

The ratio replaces a redundant percentage, the focused task replaces the change title,
and regular output is published without a producer-side character cap. Fancy Footer
therefore truncates only when the allocated terminal width is genuinely exhausted.

## Diagnostics sources

The first existing aggregate JSON file is used:

- `.pi/status/diagnostics.json`
- `.pi/diagnostics.json`
- `.galactica/diagnostics.json`
- `.taskflow/diagnostics.json`
- `status/diagnostics.json`

A configured `sourceFile` takes precedence. Accepted aggregate fields include `errors`,
`blockers`, `warnings`, `diagnostics`/`findings`, `tests`, `typecheck`, and `updatedAt`;
nested `summary` and `checks` objects are also accepted. Filenames and word counts are
never displayed.

An optional diagnostics command must be expressed without a shell:

```json
{
    "diagnostics": {
        "command": ["my-status-command", "--json"],
        "runAutomatically": false
    }
}
```

The equivalent `{ "executable": "...", "args": ["..."] }` form is accepted. It runs only
on `/galactica-status-refresh`, or at the conservative configured interval when
`runAutomatically` is true. Pi's argument-array process API enforces the timeout and
terminates timed-out children.

## Orchestration sources

The first existing JSON state file is used:

- `.pi/status/orchestration.json`
- `.pi/orchestration.json`
- `.taskflow/state.json`
- `.taskflow/run-state.json`
- `.galactica/orchestration.json`

A configured `orchestration.stateFile` takes precedence. Useful fields include `phase`,
`state`/`status`, `activeWorkers`, `workers`/`agents`, `currentTask`, `openspecTaskId`,
`startedAt`, `elapsedMs`, and `updatedAt`. While orchestration is running, known phase
or node vocabulary is classified into an allowlisted title activity—understanding,
inspection, synthesis, planning, skill proposal, mutation, implementation, change
review, regression, verification, result review, recovery, waiting reason, or abort—and
attached to the current OpenSpec, Goal, Session Work, or explicit empty focus. Task
text, paths, generated prose, and promoted child IDs never enter the lifecycle title;
unknown vocabulary produces no activity. The bounded top-level phase ID is the only
exact Taskflow identifier shown. Named Taskflow runs invoked by the assistant through
Pi's tool API publish controlled activity immediately, then consume structured
`tool_execution_update` state for the live phase and restore normal focus when tool
execution ends, so validation is driven by ordinary conversation rather than Human slash
commands. The legacy `openspecTaskId` field is parsed for compatibility but never
establishes active task focus. No arbitrary process inspection occurs.

## Configuration

The optional configuration file is `~/.pi/agent/galactica-status.json` (the actual Pi
configuration directory in this installation). This repository keeps the source at
`.pi/agent/galactica-status.json` and links the runtime path to it; the same applies to
`.pi/agent/fancy-footer.json`. Defaults work without the status-provider file.

```json
{
    "version": 1,
    "enabled": true,
    "openspec": {
        "enabled": true,
        "change": null
    },
    "diagnostics": {
        "enabled": true,
        "sourceFile": null,
        "command": null,
        "intervalSeconds": 300,
        "runAutomatically": false,
        "timeoutSeconds": 15
    },
    "orchestration": {
        "enabled": true,
        "stateFile": null
    }
}
```

Unknown or invalid fields are ignored and reported by the debug command; they do not
prevent Pi from starting. `openspec.change` is an explicit collection target, not a
session-scoped task focus.

## Commands

- `/work` — show Session Work; use `set <intent>`, `validate`, or `clear` to transition
  explicit ephemeral focus metadata.
- `/openspec-focus` — show the current focus; pass `<change> <task>` or
  `set <change> <task>` to focus, `replace <change> <task>` to deliberately replace, or
  `clear` to persist no focus.
- `/galactica-status` — concise integration and normalized-state summary.
- `/galactica-status-refresh` — reload configuration and refresh all enabled sources;
  this is the only default trigger for an optional command.
- `/galactica-status-debug` — project root, detected paths, source metadata, refresh
  timestamps, bounded errors, and currently published snapshots. Raw source files and
  command output are not dumped.

## Refresh and failure behavior

Initialization is fire-and-forget, so prompt rendering never waits for filesystem or
subprocess work. The fallback title is emitted synchronously before initialization.
Results are cached. Only small, directly relevant directories are watched
non-recursively; events are debounced. Footer snapshots and terminal titles are emitted
only when changed. Watchers and timers are closed on shutdown/reload.

Missing optional state hides its widget. Malformed or transiently unreadable state
preserves the last good value and marks it stale. Errors remain bounded and visible only
through debug output. Expensive test suites are never started unless explicitly
configured.

## Widget protocol

This package implements the import-free `pi-fancy-footer` **protocol 1** shipped by
`pi-fancy-footer` **3.0.1**:

- channel `pi-fancy-footer:widget`: complete `upsert` and `remove` messages;
- channel `pi-fancy-footer:ready`: republish current snapshots after footer startup;
- supported content is sanitized plain text with icon/color, optional theme-native bold,
  and row/position/alignment/fill/minimum-width defaults.

Protocol 1 does not expose semantic-status, priority, tooltip, or width-callback fields.
The producer therefore orders text by semantic priority and publishes complete regular
content; Fancy Footer owns final width allocation and truncation.

Pi 0.84.2 and `pi-fancy-footer` 3.0.1 run on the pnpm-managed Node 24.19.0 runtime,
satisfying both packages' declared engine requirements.

## Adding another provider

1. Add a module that returns a normalized domain value without rendering UI.
2. Add the value to `StatusSnapshot` and the atomic refresh batch.
3. Convert it to one stable namespaced widget in `publisher.ts`.
4. Add only direct candidate paths to the non-recursive watcher set.
5. Test malformed input, stale preservation, unchanged suppression, and removal.

## Uninstall

From the Galactica repository:

```sh
# Remove the two package entries from .pi/agent/settings.json.
rm -f ~/.pi/agent/galactica-status.json ~/.pi/agent/fancy-footer.json
rm -rf .pi/agent/packages/status
rm -f .pi/agent/galactica-status.json .pi/agent/fancy-footer.json
mv .pi/agent/extensions/openspec-footer.ts.disabled \
  .pi/agent/extensions/openspec-footer.ts
mv .pi/agent/extensions/pi-footer.json.disabled \
  .pi/agent/extensions/pi-footer.json
npm --prefix ~/.pi/agent/npm uninstall pi-fancy-footer
npm --prefix ~/.pi/agent/npm install pi-footer
```

Then restore `npm:pi-footer` in settings and run `/reload` or restart Pi.
