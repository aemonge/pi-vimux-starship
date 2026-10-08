# Design: Eight-section deck on the title-state contract

## Context

The cockpit is pure chrome (v0.2.x): header/status/footer render, an
external engine owns the prompt. The deck's current title/status rows were
shaped by widget history rather than information architecture, and the
Human has validated a replacement layout on real session data (both idle
and mid-work mockups accepted verbatim).

## Goals and Non-Goals

Goals: one authoritative state object for the deck's upper half; the
accepted four-line layout; current-vs-global cost split; a single notice
slot; removal of redundant counter tiles.

Non-Goals: changing telemetry contents beyond placement, reworking goal
takeover or spans machinery, renaming the package, adding new extension
integrations.

## Decisions

### The contract is the schema

```jsonc
{
  "v": 1,
  "subject": "Rethinking titles", // authored once, plain label, or null
  "work": null, // derived: { change, task?, done, total }, or null
  "activity": {
    // observed: newest turn event, or null when idle
    "class": "editing", // editing | reading | grepping | bash | subagent
    "target": "schema.yaml", // short target label, <= 48 chars
    "span": "t42", // owning span id (turn, subagent, or bash)
    "parent": null, // parent span id when nested, else null
  },
  "waiver": null, // { id, notice } Human-dismissed notice, or null
}
```

Authorship levels never mix: `subject` authored, `work` derived from
OpenSpec, `activity` observed from tool executions. No rendering code may
write any slot. The publisher rides the existing
`galactica-status:header` channel with a `title` field; a per-turn
`{tokens, elapsedMs}` meter publishes beside it and resets at
`before_agent_start`.

### Activity feed

The status runtime already tracks spans for the workers' rows; the feed
classifies tool-execution starts/updates into `editing | reading |
grepping | bash | subagent` with a short target label, attributes
`span`/`parent` from the same span ids, and publishes the newest event.
Turn end resets activity to null.

### Rendering contract

Line 1: path/git left, companion chips right (always-visible and
on/warn/off colors unchanged). Line 2: clock + Subject left, Work
(`change · n/m`, dim `— no change owns the moment` when null) right; goal
progress rows conditional beneath. Line 3: Activity left (`awaiting Human`
idle), this-turn cost right; spans rows conditional beneath. Line 4:
engine, quota window, machine, global cost left; `⚠` notices right.

### Notices and waiver

One slot aggregates companion warning texts, the unfocused open-goal hint,
and diagnostics counts, ranked in that order and joined with ` · `. A set
waiver `{id, notice}` suppresses its exact matching text; removing the
waiver restores it. Semantics are suppression-only pending Human review.

## Risks and Trade-offs

- The activity feed is new plumbing in the status runtime; mitigated by
  publishing it (Task 1) before any rendering changes, with a
  `/galactica-status-debug` line as the checkpoint instrument.
- Removing counter tiles deletes asserted test expectations; lockstep is
  explicit in Task 2 with the accepted mockups as ground truth.
- The repo's planning-gate wrapper fails on non-spec-driven schemas under
  openspec 1.6.0; using the standard spec-driven format restores strict
  validation for this change.

## Migration Plan

Additive publishing first (deck unchanged, checkpoint), then the render
cutover (checkpoint), then notices, then the release. No intermediate
state renders a half-converted deck to the Human.
