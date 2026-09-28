# Plan: Command center telemetry CLI

- **Idea:** `share-pi-vimux-starship`
- **Method source:** predefined
- **Method name:** Happy-path
- **Method contract:** Deliver the smallest complete live pipeline — cockpit
  snapshot sink, snapshot reader, validated triage render — with the frozen TUI
  contract preserved verbatim and each Task independently Human-validatable.
- **Execution source:** native-direct
- **Execution name:** Sequential sink-then-render slices
- **Execution reason:** The reader cannot be validated without live snapshots,
  and both slices share the frozen TUI contract; sequential slices keep each
  boundary runnable and attributable.
- **Execution outline:** Task 1 adds a fifth extension entrypoint that mirrors
  `galactica-status:header` events into one JSON snapshot per live session,
  fail-soft, with session metadata and prune-on-shutdown. Task 2 replaces the
  committed mock's fixtures with the snapshot directory, derives the four
  attention states, and locks the validated look behind a golden render test,
  adding `-w` refresh and `--json`.
- **Estimate basis:** The TUI contract is already Human-validated and committed
  (`4aa1cfa`); the event shape (`HeaderStatusEvent`, protocol 1) and channel
  (`galactica-status:header`) are known from inspection; no comparable accepted
  Plan exists for this surface, so confidence is low and both Tasks carry split
  triggers.
- **Estimated implementation:** 2.5–4.5 hours across two Tasks excluding Human
  wait; per-Task ranges and triggers live in `tasks.md`.

## Acceptance

- `node bin/cockpit-agents.mjs` reports every live cockpit agent from any shell,
  ordered attention → working → parked → gone, with correct counts and states.
- The frozen TUI contract below renders byte-identically for its golden fixture,
  including dynamic width, surrogate-safe title math, and `NO_COLOR` fallback.
- Snapshots carry only `HeaderStatusEvent` facts plus session identity
  (sessionId, pid, cwd, sessionStart, updatedAt); no prompts, generated prose,
  tool arguments, child output, credentials, or hidden reasoning ever persist.
- Core behavior fails soft without the status package, the snapshot directory,
  or write access: the host session never breaks and the CLI degrades to an
  empty-but-honest board.
- `npm run check:baseline`, `check:package:load`, `check:composition`,
  formatting, lint, and typecheck stay green after every Task.

## Frozen TUI contract (stone)

Validated `VALID` 2026-09-28, committed as `4aa1cfa`; Task 2 preserves it
verbatim — changes require a new Human-validated round:

- Title: `󰆧 pi-vimux-starship command center` bold `#5c5ca8`; right-docked
  `N agents · M attention` in muted `#574d47` with the attention count in
  accent `#076678`; gap computed in code points (the icon is one cell).
- Row grammar `MARK ID  PROJECT  TASK  TIME`: marker + space, 3-char muted id,
  project cyan `#427b58` auto-sized to `max(20, longest + 2)`, task `#5c3a2e`
  (attention rows show the reason word, bold accent), time muted, right-flush.
- Markers: `!` accent, `●` green `#689d6a`, `◌` dim `#796d63`, `×` dim.
- Sublines (attention subject, idle/gone hints) indented to the task column,
  text color, only when they exist; blank line after a sublined row.
- Full dynamic width from `process.stdout.columns` (`COLUMNS` fallback, 80);
  no group headers, no separators, no footer, no emoji; `NO_COLOR` honored;
  truecolor from the `ramona-gruvbox-light-strong` palette.

```text
󰆧 pi-vimux-starship command center                        4 agents · 1 attention

! 003  pi-vimux-starship       validation                                3:02:11
                               Pi agent telemetry CLI for vimux-starship notifications

● 001  galactica               Consolidate imported Pi cockpit           0:12:34
● 002  pi-vimux-starship       Route Insert through Neovim               0:41:07
◌ 004  articles                QMD taxonomy cleanup                      1:40:00
× 005  dotfiles                Shell hygiene pass                        0:22:45
```

## Scope

- **In:** new `packages/cockpit-telemetry` entrypoint registered fifth in the
  root package manifest, snapshot read/write plumbing, `bin/cockpit-agents.mjs`
  live reader, state derivation, watch mode, `--json`, golden render tests,
  baseline manifest refresh.
- **Out:** filtering flags (agreed future work), runtime theme-file reading
  (palette stays hardcoded until asked), npm bin registration and aliases,
  tmux/starship integration, any Pi core change, and any change to the frozen
  TUI contract's look.

## Verification

Per-Task focused checks in `tasks.md`; nearest gates are the new package's
tests, `npm run check:package:load`, `check:composition`, `check:baseline`,
and a golden-output test for the render. Live validation runs isolated probes
per `AGENTS.md` and finishes with two concurrent live agents.

## Dependencies and authority

Fully local to this repository; no protected Pi configuration is touched —
snapshots live under `~/.local/state/pi-vimux-starship/agents/` (package-owned
XDG state), never in Pi settings. The repository OpenSpec gate currently fails
for every Ramona change (schemas lost from `~/.config/openspec/schemas/` and
Galactica's copy; `openspec` 1.6.0 only ships `spec-driven`); repairing that is
a separate Fix with its own brief.

## Risks

- Event contract drift: the sink subscribes only; if `HeaderStatusEvent`
  changes protocol, the sink must fail soft and the golden test must catch it.
- Ambiguous-width markers (`● ◌ ×`) may double-cell in exotic terminals; the
  Nerd Font target is accepted, narrow-width truncation stays a simple guard.
- Snapshot leftovers after crashes: gone-detection keys on heartbeat and pid
  liveness; leftovers never break the board.
- Low estimate confidence: ranges are planning aids, not promises.
