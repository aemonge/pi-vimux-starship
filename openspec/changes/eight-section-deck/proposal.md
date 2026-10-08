# Proposal: Eight-section deck on the title-state contract

## Why

The deck's upper half grew by accretion: the title mixes authored subject
text with OpenSpec suffixes, turn state renders as state labels instead of
events, cost exists only as a lifetime total, and warnings scatter across
three surfaces. The Human-validated eight-section layout fixes the
information architecture — four lines, two sections each, every section one
question — and this change implements it on a single versioned state
contract so rendering code never owns data again.

## What Changes

- `packages/status` publishes one `title` state object on the existing
  header channel: `{v, subject, work, activity, waiver}` plus a per-turn
  cost meter. Activity is observed from tool-execution events with
  `span`/`parent` attribution; work is derived from OpenSpec focus;
  subject stays authored.
- `packages/header` renders the four-line layout: path/git with companion
  chips right; clock + Subject with Work right; Activity with this-turn
  cost; engine/quota/machine/global-cost with a unified `⚠` notice slot.
- Counter tiles (`task 00/00`, `stps 00/00`, `00 › 00`) are removed —
  Work, Activity, and the existing spans rows answer their questions.
- Goal progress rows and spans rows keep their conditional placement,
  unchanged.
- Released as `0.3.0`.

## Impact

- Affected specs: `deck-title-state` (new capability)
- Affected code: `packages/status/src/title-state.ts` (new),
  `packages/status/index.ts`, `packages/header/src/gauge.ts`,
  `packages/header/src/deck.ts`, component tests, baseline manifest.
- Out of scope: goal takeover logic, spans machinery, telemetry contents
  beyond placement, the package rename, the upstream goal-x widget ask.
