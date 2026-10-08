# Tasks

## 1. Title-state publisher

- [ ] 1.1 Add `packages/status/src/title-state.ts`: v1 types
      (`subject`, `work{change,task?,done,total}`, `activity{class,target,
      span,parent}`, `waiver{id,notice}`), defensive parser (unknown
      version → null; target ≤ 48 chars; totals ≤ 999), and a builder
      reading the subject entry and OpenSpec focus.
      - Expected: parser rejects malformed input with null, never throws;
        unit tests cover null/active/malformed shapes and bounds (~12
        cases).
- [ ] 1.2 Wire the activity feed in the status runtime: classify
      tool-execution starts/updates into
      `editing | reading | grepping | bash | subagent`, attribute
      `span`/`parent` from the runtime span ids, publish the newest event,
      reset to null at turn end.
      - Expected: an edit tool call publishes
        `{"class":"editing","target":"packages/header/src/deck.ts","span":"t87","parent":null}`;
        subagent events carry the parent span id; runtime tests add ~8
        cases (one per class, nesting, idle reset).
- [ ] 1.3 Add the per-turn cost meter beside the title state: provider
      usage delta + turn elapsed, reset at `before_agent_start`.
      - Expected: mid-turn `{tokens:4200,elapsedMs:38000}`, idle
        `{tokens:0,elapsedMs:0}`; meter tests cover zero/mid/settled.
- [ ] 1.4 Extend `/galactica-status-debug` with one line printing the live
      title-state JSON.
      - Expected: command output ends with `title-state: {"v":1,...}`.
- [ ] 1.5 Checkpoint: state publishes; the deck renders pixel-identical
      to v0.2.1 (Human confirms via debug line).

## 2. Four-line deck render

- [ ] 2.1 Parse the title state in `packages/header` and compose line 2:
      `󰠭 clock ⟩ Subject` left, `Work — change · n/m` or dim
      `— no change owns the moment` right; goal rows stay conditional
      beneath.
      - Expected idle: `󰠭 000:00'00 ⟩ <Subject>    — no change owns the moment`
      - Expected mid-work: `... ⟨ <Subject>    eight-section-deck · 1/4`
- [ ] 2.2 Compose line 3: Activity left (`editing <target>`,
      `awaiting Human` idle), this-turn cost right; remove the `task/stps`
      and `00 › 00` counter tiles; spans rows remain conditional below.
      - Expected idle: `awaiting Human` + `— · 0 tok`.
      - Expected mid-work: ` editing packages/header/src/deck.ts` +
        `this turn 4.2k · 0:38`.
      - Expected absence: no `task 00/00`, `stps 00/00`, or `00 › 00` in
        any state.
- [ ] 2.3 Relocate companion chips from the telemetry head to line 1
      right; move engine/quota/machine/global-cost to line 4 left.
      - Expected (100+ cols): `~/<path> ⟩ main › clean` left, bold
        `[↻ ▤] ⌬  ⛨` right; narrow frames keep chips, path yields first.
- [ ] 2.4 Lockstep deck tests for both accepted mockups; checkpoint:
      Human confirms live sessions match.

## 3. Notices and waiver

- [ ] 3.1 Aggregate notices into line 4 right: companion warning texts,
      open-goal hint, diagnostics counts — ranked, ` · `-joined, empty
      when clean.
      - Expected mixed: `⚠ 1 open goal · /goal-focus · appa unreachable · 2 diagnostics`
- [ ] 3.2 Honor `waiver` suppression of the exact matching notice text;
      absence restores it.
      - Expected: waiver on graphify-stale removes only that text.
- [ ] 3.3 Human validation: idle and mid-work sessions match the accepted
      layout; notices appear and clear with their sources.

## 4. Gate and release 0.3.0

- [ ] 4.1 Full gate green (tsc, component suites, format, lint,
      composition, package pack/load); refresh the current baseline
      manifest (`imported-source.sha256` untouched).
- [ ] 4.2 Hand the release to Human: `just publish 0.3.0`, push, swap the
      personal install with the explicit version pin; `pi list` confirms
      `npm:@aemonge-dev/pi-vimux-starship@0.3.0`.
