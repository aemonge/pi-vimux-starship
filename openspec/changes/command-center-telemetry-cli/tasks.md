# Tasks

Step states: `[ ]` Pending, `[-]` Running/interrupted/failed, `[x]` Complete.

## Task 1 — Cockpit telemetry sink entrypoint

- **Value:** Every live cockpit session mirrors its `HeaderStatusEvent` into
  one package-owned JSON snapshot, giving any external reader a truthful,
  fail-soft live feed of agent state.
- **Method source:** predefined
- **Method name:** TDD
- **Method contract:** Test-only RED contracts for payload projection,
  fail-soft, atomic write, and prune fail for their discriminating expected
  reasons before production exists; deterministic RED evidence is recorded,
  then minimum GREEN and refactor/still-GREEN stay within this Task's scope.
- **Execution source:** native-direct
- **Execution name:** Sequential sink-then-render slices
- **Estimate basis:** Channel and event shape known from inspection; new
  package with no render coupling; test-first overhead has no comparable
  accepted evidence.
- **Estimated implementation:** 75–150 minutes; Human wait excluded.
- **Estimate confidence:** Low — no comparable accepted Plan.
- **Human-wait estimate:** Separate and unbounded after deterministic checks.
- **Refinement trigger:** Split if the snapshot schema exceeds roughly twelve
  fields, entrypoint registration touches more than the root manifest and
  baseline refresh, or any `galactica-status:header` contract change becomes
  necessary.

- [ ] RED — test-only contracts in `packages/cockpit-telemetry/test/`, no
      production code yet: the snapshot payload holds exactly the
      `HeaderStatusEvent` facts plus `sessionId`, `pid`, `cwd`, `sessionStart`
      (captured at `session_start`), `updatedAt`, and nothing else; writes are
      atomic (tmp + rename, never a partial file); every failure path (missing
      directory, unwritable directory, malformed event) fails soft without
      disturbing the host; the session's own snapshot is pruned on
      `session_shutdown`. Each contract fails for its discriminating expected
      reason; record the deterministic RED evidence (command and failing
      assertions) in this Step's entry.
  - Subject: `step(telemetry-sink): red snapshot contracts`.
- [ ] GREEN — minimum sink in `packages/cockpit-telemetry`: extension factory
      subscribing to `GALACTICA_HEADER_CHANNEL` via `pi.events.on`, atomically
      writing `~/.local/state/pi-vimux-starship/agents/<sessionId>.json` on
      each event, capturing `sessionStart` at `session_start`, keeping `pid`
      for gone-detection, pruning on `session_shutdown`; the RED suite passes
      with no test modification.
  - Subject: `step(telemetry-sink): green minimum snapshot sink`.
- [ ] Refactor/still-GREEN and registration: refactor only within the confirmed
      scope if the minimum GREEN needs it; register the package as the fifth
      entrypoint in the root package composition (`src/index.ts`, startup order
      preserved) with manifest `files` coverage as needed, refresh the baseline
      manifest (`node scripts/check-baseline.mjs --write`), and run the focused
      gates: new package tests, `check:baseline`, `check:package:load`,
      `check:composition`, format, lint, typecheck.
  - Subject: `step(telemetry-sink): register fifth entrypoint and pass gates`.
- [ ] Human validation: isolated probe (`pi --offline --no-extensions -e
      "$(pwd -P)" --list-models` pattern) then a live session — confirm the
      snapshot appears, updates during activity, and disappears on shutdown.
      RED evidence is not a Human approval gate; validation happens once here.
  - Subject: `feat(telemetry-sink): live cockpit snapshot sink`.

## Task 2 — Command center live triage board

- **Value:** `node bin/cockpit-agents.mjs` (and `-w`) reports every live agent
  as the validated triage board from any shell, ending pane-hopping.
- **Method source:** predefined
- **Method name:** TDD
- **Method contract:** Test-only RED golden render and state-derivation
  contracts fail for their discriminating expected reasons before the reader
  exists; deterministic RED evidence is recorded, then minimum GREEN and
  refactor/still-GREEN stay within this Task's scope.
- **Execution source:** native-direct
- **Execution name:** Sequential sink-then-render slices
- **Estimate basis:** Frozen TUI contract validated and committed (`4aa1cfa`);
  render exists as the committed mock; reader and derivation are new and
  test-first against fixture snapshots.
- **Estimated implementation:** 90–180 minutes; Human wait excluded.
- **Estimate confidence:** Low — no comparable accepted Plan.
- **Human-wait estimate:** Separate and unbounded after deterministic checks.
- **Refinement trigger:** Split if state derivation exceeds roughly 150 lines
  or more than four states, or the narrow-width policy outgrows a simple
  truncation guard.

- [ ] RED — test-only contracts, reader does not exist yet: a golden render
      test over fixture snapshots reproduces the frozen TUI contract sample
      byte-identically, covering dynamic widths (including `COLUMNS`
      fallback), surrogate-safe title math, `NO_COLOR`, sublines, project
      column auto-sizing, and the narrow-width truncation guard; derivation
      tests pin the four states — attention (`requesting-validation`/
      `requesting-redirection`/`requesting-input`/`awaiting-resume` suggestion,
      `approvalRequired`, or `blocked`), working (active lifecycle or live run
      spans), parked (listening/waiting), gone (stale heartbeat or dead pid) —
      order attention → working → parked → gone, most recent first within a
      group, 3-char stable id from `sessionId`, time column `now -
      sessionStart`. Each contract fails for its discriminating expected
      reason; record the deterministic RED evidence in this Step's entry.
  - Subject: `step(command-center): red golden board contracts`.
- [ ] GREEN — minimum reader: replace mock fixtures in `bin/cockpit-agents.mjs`
      with the snapshot directory reader (parse
      `~/.local/state/pi-vimux-starship/agents/`, tolerate corrupt or missing
      files), state derivation per the RED contracts, `-w`/`--interval`
      (default 2s, clear + reprint), `--json` raw snapshot dump; empty
      directory renders the header plus a dim `no live agents` line; the RED
      suite passes with no test modification.
  - Subject: `step(command-center): green live reader watch and json`.
- [ ] Refactor/still-GREEN: refactor only within the confirmed scope if the
      minimum GREEN needs it; wire the suite into the repository test tooling
      and run the focused gates plus full check.
  - Subject: `step(command-center): still-green board suite and full gates`.
- [ ] Human validation: two concurrent live agents — one left awaiting
      validation (attention), one actively working — confirm states, order,
      right-flush alignment, `-w` refresh, and `NO_COLOR`; original response,
      canonical outcome, and UTC recorded here.
  - Subject: `feat(command-center): live agent triage board`.
