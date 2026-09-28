# Tasks

Step states: `[ ]` Pending, `[-]` Running/interrupted/failed, `[x]` Complete.

## Task 1 — Cockpit telemetry sink entrypoint

- **Value:** Every live cockpit session mirrors its `HeaderStatusEvent` into
  one package-owned JSON snapshot, giving any external reader a truthful,
  fail-soft live feed of agent state.
- **Method source:** predefined
- **Method name:** Happy-path
- **Method contract:** Smallest complete sink — subscribe, snapshot, prune —
  with no reader and no rendering changes.
- **Execution source:** native-direct
- **Execution name:** Sequential sink-then-render slices
- **Estimate basis:** Channel and event shape known from inspection; new
  package with no render coupling.
- **Estimated implementation:** 60–120 minutes; Human wait excluded.
- **Estimate confidence:** Low — no comparable accepted Plan.
- **Human-wait estimate:** Separate and unbounded after deterministic checks.
- **Refinement trigger:** Split if the snapshot schema exceeds roughly twelve
  fields, entrypoint registration touches more than the root manifest and
  baseline refresh, or any `galactica-status:header` contract change becomes
  necessary.

- [ ] Create `packages/cockpit-telemetry`: extension factory subscribing to
      `GALACTICA_HEADER_CHANNEL` via `pi.events.on`, writing
      `~/.local/state/pi-vimux-starship/agents/<sessionId>.json` atomically on
      each event — payload limited to the event plus `sessionId`, `pid`, `cwd`,
      `sessionStart` (captured at `session_start`), `updatedAt`; every failure
      path fails soft and never disturbs the host session.
  - Subject: `step(telemetry-sink): mirror header channel into live snapshots`.
- [ ] Prune and liveness: delete the session's own snapshot on
      `session_shutdown`; keep `pid` in the payload so crashed sessions are
      detectable as gone by heartbeat age or pid liveness.
  - Subject: `step(telemetry-sink): prune snapshots and record liveness`.
- [ ] Register the package as the fifth entrypoint in the root package
      manifest after the four existing ones (startup order preserved), refresh
      the baseline manifest (`node scripts/check-baseline.mjs --write`), and
      run the focused gates: new package tests, `check:baseline`,
      `check:package:load`, `check:composition`, format, lint, typecheck.
  - Subject: `step(telemetry-sink): register fifth entrypoint and pass gates`.
- [ ] Human validation: isolated probe (`pi --offline --no-extensions -e
      "$(pwd -P)" --list-models` pattern) then a live session — confirm the
      snapshot appears, updates during activity, and disappears on shutdown.
  - Subject: `feat(telemetry-sink): live cockpit snapshot sink`.

## Task 2 — Command center live triage board

- **Value:** `node bin/cockpit-agents.mjs` (and `-w`) reports every live agent
  as the validated triage board from any shell, ending pane-hopping.
- **Method source:** predefined
- **Method name:** Happy-path
- **Method contract:** Smallest complete live board — reader, state derivation,
  frozen render — with watch mode and `--json`, no new surface areas.
- **Execution source:** native-direct
- **Execution name:** Sequential sink-then-render slices
- **Estimate basis:** Frozen TUI contract validated and committed (`4aa1cfa`);
  render exists as the committed mock; reader and derivation are new.
- **Estimated implementation:** 75–150 minutes; Human wait excluded.
- **Estimate confidence:** Low — no comparable accepted Plan.
- **Human-wait estimate:** Separate and unbounded after deterministic checks.
- **Refinement trigger:** Split if state derivation exceeds roughly 150 lines
  or more than four states, or the narrow-width policy outgrows a simple
  truncation guard.

- [ ] Replace mock fixtures in `bin/cockpit-agents.mjs` with the snapshot
      directory reader: parse `~/.local/state/pi-vimux-starship/agents/`,
      tolerate corrupt or missing files, derive states — attention
      (`requesting-validation`/`requesting-redirection`/`requesting-input`/
      `awaiting-resume` suggestion, `approvalRequired`, or `blocked`),
      working (active lifecycle or live run spans), parked (listening/waiting),
      gone (stale heartbeat or dead pid) — order attention → working → parked
      → gone, most recent first within a group; 3-char stable id from
      `sessionId`; time column is `now - sessionStart`.
  - Subject: `step(command-center): derive live triage state from snapshots`.
- [ ] Watch and machine modes: `-w`/`--interval` (default 2s, clear +
      reprint), `--json` raw snapshot dump; empty directory renders the header
      plus a dim `no live agents` line.
  - Subject: `step(command-center): add watch mode and json output`.
- [ ] Golden render test: fixture snapshots reproduce the frozen TUI contract
      sample byte-identically, covering dynamic widths (including `COLUMNS`
      fallback), surrogate-safe title math, `NO_COLOR`, sublines, project
      column auto-sizing, and the narrow-width truncation guard; wire into the
      repository test tooling and run the focused gates plus full check.
  - Subject: `step(command-center): lock the frozen board with golden tests`.
- [ ] Human validation: two concurrent live agents — one left awaiting
      validation (attention), one actively working — confirm states, order,
      right-flush alignment, `-w` refresh, and `NO_COLOR`; original response,
      canonical outcome, and UTC recorded here.
  - Subject: `feat(command-center): live agent triage board`.
