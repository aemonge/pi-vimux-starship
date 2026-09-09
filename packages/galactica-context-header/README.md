# galactica-context-header

A dependency-free Pi extension that coordinates the prompt information architecture
through Pi's supported widget and event APIs.

```text
─ 󰠭 › ─────────────────────────────────────────────────────────────────────
( 3 ›  2 · 00:05'12) working › checking 󰁕 validate result ⟩  task 1/2 ›  stps 3/5
󰓾 Stabilize runtime and focus in the cockpit
┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
[󰆧]  ~/projects/example                                     main ⟩  clean
┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
󰚩 Opus › high ⟩ 󰾆 42% › 󰎞 2         10% › 󰜦 $0.10 ⟩  12% ›  375M ›  3/3
─ 󰏫 ─────────────────────────────────────────────────────────────── ‹ 󰠭 ─
```

The preferred editor-deck surface keeps two stable semantic rows. The first is a
left-packed operational strip: runtime capsule, lifecycle, activity, controlled next
action, and Task/Step progress. The second is a full-width explicit selection canvas
that wraps to at most two lines. Every slot remains present; zero, idle, unavailable,
and unselected states are dim instead of appearing or disappearing. Long content may
wrap responsively, but runtime state never changes the deck topology. Decorative rails
remain slim and contain no telemetry.

The legacy above-editor widget owns only current work identity and preserves the
` ready ⟩ no focused task` idle row when no work is selected. The leading icon is
runtime-authoritative: `` while Pi is busy in an active lifecycle and `` while
settled, waiting, blocked, listening, or aborted. Internal lifecycle states render as
short readable verbs. The Ramona loop remains exact: `understand`, `work`, `assure`,
`learn`, and `answer`. Runtime boundaries are `wait`, `blocked`, `ready`, or `stopped`.
The title has four styled groups: lifecycle, a structured active ancestry, focus, and
optional focus detail. Each activity-path segment receives the blue minor `›`; the
violet-pink major `⟩` divides runtime ancestry from the green narrative focus. Human
prompt text is never converted into focus automatically. OpenSpec may add its exact Task
after another green `›`. Focus selection prefers an exact OpenSpec Task, then Goal, then
Session Work. Active turns without a selection use the explicit `OpenSpec › no focus`,
`no OpenSpec`, or `no focus` state supplied by the status producer; `Direct response` is
never presented as a focus. Empty states are dim while real focus remains bold semantic
green.

Wide rows render lifecycle → active ancestry → optional focus → optional focus detail,
for example `assure › checking quality › assuring tests ⟩ Implement global flow`. The
renderer generates every separator. Empty or rejected paths leave no separator or
placeholder whitespace. As width falls it tries full labels, compact labels, a collapsed
`… › deepest` ancestry, and finally compact lifecycle plus the deepest active segment.
Narrative focus disappears before meaningful active ancestry. Terminal display-cell
measurement and final truncation remain Unicode- and Nerd-Font-aware.

Runtime anchor and lifecycle are bold blue `#076678`; activity ancestry and its minor
`›` are regular blue; the major `⟩` is purple; focus is bold semantic success green; and
optional focus hierarchy is regular success green. Dim is reserved for the two empty
focus fallbacks; muted, text, cyan, yellow, and gray are never used in the title.

The extension hides Pi's separate built-in `Working...` loader row with
`ctx.ui.setWorkingVisible(false)`, including its vertical space. The header therefore
uses its complete width for lifecycle, bounded activity, and focus. Runtime age is
published for the bottom prompt rail as an eight-cell chronometer measuring time since
the most recent observed foreground provider, assistant, or tool event. It stays
fixed-width as it advances: `00:00'00`, `00:00'45`, `00:12'30`, or `12:34'56`; hour/day
fallbacks also remain eight cells. Active timing uses the high-contrast deep-cyan
`accent` color; settled states display dim `00:00'00` rather than repeating the header's
`wait`, `ready`, or other lifecycle word. A session-scoped ticker publishes only when
the formatted chronometer changes and is cleared on shutdown. No message content,
thinking, reasoning, prompts, tool arguments, or child-agent output enters the widget.

The additive header protocol projects selection independently from live work:

```ts
selection: {
  source: 'openspec' | 'goal' | 'session-work';
  titles: string[]; // one or two bounded, normalized titles
  color: HeaderColor;
} | null;
suggestion: HeaderSuggestion | null; // controlled enum, never generated prose
```

Selection priority remains exact OpenSpec Task, Goal, then Session Work. Older
protocol-1 events may use sanitized non-placeholder work titles as a legacy selection;
explicit malformed selection is rejected rather than borrowing a fallback. The
suggestion vocabulary is producer-owned and bounded to lifecycle actions such as
`complete scope`, `validate result`, `Human validation`, and `resolve blocker`.

The preferred activity contract is a structured path that never stores separators:

```ts
work.activityPath?: Array<{
  id: string;       // lowercase letters, digits, and hyphens; at most 48 code points
  label: string;    // one line; normalized to at most 48 code points
  compact?: string; // normalized to at most 24 code points
  current?: number;
  total?: number;
}>; // at most six unique segments; lifecycle is not duplicated here
```

An explicit valid array, including `[]`, takes precedence. A malformed array is rejected
as a whole and falls back to the legacy allowlisted `work.activity` field. Legacy
activity is normalized to one internal segment, preserving existing producers until they
migrate. Progress is bounded to `0..9,999` and appended as `current/total` only when
both values are valid.

The consumer removes ANSI escapes and control characters, normalizes whitespace, rejects
empty labels and malformed or duplicate IDs, and fails soft. Semantic safety remains a
producer obligation: labels must be bounded display vocabulary, never prompts, commands,
paths, secrets, generated paragraphs, or tool output. The consumer cannot infer those
semantics from arbitrary text. The future global-flow producer selects one primary
active path; completed, skipped, sibling, and parallel aggregation remain out of scope.

The legacy `work.activity` enum remains temporarily supported. Its renderer-owned labels
convert operation starts such as `inspection` and `mutation` into
`inspecting project context` and `updating selected files`. Their bounded completion
transitions render as `finalizing current request`, `reviewing applied changes`, or
`reviewing check results`; unknown kinds and raw activity text remain omitted.

The extension refreshes bounded local Git branch and status data at session start, after
successful mutating tools, and when the agent settles. Footer row one keeps project
identity on the left and work scope on the right. The bold PWD is shown in full relative
to home (`/home/aemonge/projects/example` → `~/projects/example`) and yields ANSI-safely
only when the terminal cannot preserve both aligned groups. Git branch and state follow
a blue minor `›`. Outside a repository, one dim responsive `›  (no Git)` state fills
the otherwise missing project slot and yields before core project/work information on
narrow terminals. Slash-prefixed Git branches collapse the prefix to its initial and cap
display at 30 cells with `...` (`feat/persist-versioned-prompts-in-duckdb` →
`f/persist-versioned-prompts...`). The right side shows compact OpenSpec Plan/Task
progress, or the simple Goal, Focus, or `no OpenSpec` fallback when no OpenSpec
portfolio is available. The footer reserves a four-cell visual split between alignment
groups. OpenSpec uses icons instead of repeated labels: task-list `` for Plans and
notebook `` for Tasks, with minor `›` between them. Their Nerd Font glyphs exactly
match Starship: ``, ``, ``, ``, and ``. When `DEVBOX_PROJECT_ROOT` is present, the
PWD begins `[󰆧]  ~/project`; the boxed Devbox marker precedes the folder icon without
exposing the variable's value. The top prompt rail may prepend MCP availability to work
progress as ` healthy/total ⟩  Plans ›  Tasks`. MCP status comes only from the live
`pi-mcp-adapter/status/v1` feed; lazy cached or not-yet-connected servers remain
available, while failed or authentication-blocked servers reduce the numerator. This is
availability telemetry, not a tool-call counter. Before the first valid snapshot, or
when status is empty or malformed, the segment remains visible as dim ` 0/0`. The
entire segment yields before right-aligned work progress is truncated. Neovim LSP
inventory is intentionally neither collected nor shown because it does not establish an
agent-usable LSP capability. Plugin and extension inventory is not shown without a
trustworthy runtime health source. Adjacent left and right segments use the same Gruvbox
colors as the configured Starship prompts: blue `#076678`, green `#79740e`, bright green
`#689d6a`, aqua `#427b58`, yellow `#b57614`, orange `#af3a03`, major-separator Gruvbox
purple `#b16286`, blue-violet `#5c5ca8`, and red `#9d0006`. Project, Git, work-scope,
model, quota, and local telemetry avoid generic gray; only missing Git and the runtime
chronometer are deliberately dim. PWD and model identity share the same blue anchor
color; reasoning retains its own level color. The single footer row keeps PWD and Git on
the left and model, reasoning, and quota on the right. Other bounded widget snapshots
feed the prompt rails: mode alone on the left and optional MCP availability plus work
progress on the right of the top rail; chronometer left and context, compactions,
memory, CPU, and cost right on the bottom rail. A major separator distinguishes model
context from process resources. On wide terminals the footer ends with the dedicated
five-cell avatar tail `⟨ 󰠭`: a purple left-pointing boundary, violet ladybug, and one
blank cell to her right. Each rail aligns its own groups independently, so the header is
never padded for cross-row alignment. CPU is normalized against Pi's available logical
CPU capacity and capped at 100%, so the number reads as whole-machine share rather than
one-core units. CPU and RAM are blue normally and independently turn yellow only for
sustained CPU pressure above 80% or unusually high session memory; one resource warning
does not recolor its neighbors. Pink and red are never used in these three telemetry
groups. In the title, lifecycle and bounded activity are blue; the major boundary is
purple; real focus and optional Task hierarchy are green; empty focus fallbacks and the
footer runtime age/state are dim. Persistent cache-hit presentation is disabled, while
Fancy Footer retains its internal cache accounting. Compaction count is hidden at zero.
The first deck row always begins with the compact runtime capsule
`( children ›  subagents · 00:00'00)`. Each zero count and the settled timer remain
dim in place; a live count or timer changes color without moving neighboring content.
The active-run aggregate no longer appears in the lower resource row. Final
narrow-width fitting remains ANSI-aware and removes exposed trailing separators. The
renderer never shows the main Pi process, historical worker totals, completed-file
progress, queued subagent placeholders, or runtime identity and output fields.
Quota is reduced to the most constrained provider-reported percentage with no weekly
analysis. Cost is Pi's native estimated session cost in USD, rendered without trailing
fractional zeros; its preceding `⟩` retains the shared purple major-boundary color while
the value remains blue. No local daily aggregation or currency conversion is performed.
No center group or gauges are used. The local Fancy Footer fork expands its widget
protocol to accept these native theme tokens. The narrative lifecycle header begins with
its active/passive terminal icon; the prompt border keeps only its right-aligned vi-mode
glyph. Concurrent Git refreshes coalesce without polling.

Agent-environment, context, CPU, RAM, and compaction widgets use the same Fancy Footer
protocol, including producer-requested bold text for the PWD. Every three seconds on
Linux, the extension discovers only Pi descendants through bounded
`/proc/<pid>/task/<pid>/children` reads, then reads their `stat` and `status` records
without shelling out or retaining process names, arguments, or paths. Memory sums
private anonymous resident pages (`RssAnon`) instead of counting shared file-backed
pages once per process. Individual status-read failures fall back to that process's RSS;
unavailable `/proc` falls back honestly to current-process CPU and RSS. Sampling,
smoothing, publication, timers, and resource widgets are session-scoped and cleaned up
on shutdown. The local Fancy Footer fork owns cache, quota, and session-cost collection.
Unavailable temperature and unsupported environment claims are hidden; environment
classification defaults honestly to `host` unless an explicit supported marker exists.

## Test

```sh
npm install
npm run check
```

## Remove

Delete `./packages/galactica-context-header` from `.pi/agent/settings.json`, remove this
directory, and run `/reload`.
