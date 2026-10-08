# Requirements

## ADDED Requirements

### Requirement: Versioned title-state publication

The status package SHALL publish exactly one `title` state object on the
`galactica-status:header` channel, versioned `v: 1`, containing `subject`,
`work`, `activity`, and `waiver` slots and nothing else.

#### Scenario: idle session

- **WHEN** no turn is running and no OpenSpec task owns focus
- **THEN** the published state is
  `{"v":1,"subject":"<authored label>","work":null,"activity":null,"waiver":null}`

#### Scenario: mid-work session

- **WHEN** a turn is editing a file under an active OpenSpec change
- **THEN** `work` is `{ "change": "<id>", "done": <n>, "total": <m> }` and
  `activity` is `{ "class": "editing", "target": "<path>", "span": "<id>",
  "parent": null }`

#### Scenario: malformed state is never published

- **WHEN** any slot fails its bounds (target > 48 chars, totals > 999,
  unknown class)
- **THEN** the publisher drops or clamps the slot and the parser rejects
  unknown versions rather than rendering them

### Requirement: Authorship levels never mix

The `subject` slot SHALL be authored once by the session subject entry,
`work` SHALL be derived from OpenSpec focus state, and `activity` SHALL be
observed from tool-execution events. Rendering code SHALL NOT write any
slot.

#### Scenario: renderer is read-only

- **WHEN** the header renders the title state
- **THEN** no code path in `packages/header` mutates `subject`, `work`,
  `activity`, or `waiver`

### Requirement: Per-turn cost meter

The publisher SHALL emit a per-turn cost `{tokens, elapsedMs}` beside the
title state, reset at `before_agent_start`, zeroed when idle.

#### Scenario: mid-turn meter

- **WHEN** a turn has consumed 4,200 tokens over 38 seconds
- **THEN** the meter publishes `{ "tokens": 4200, "elapsedMs": 38000 }`

#### Scenario: idle meter

- **WHEN** no turn is running
- **THEN** the meter publishes `{ "tokens": 0, "elapsedMs": 0 }`

### Requirement: Four-line deck layout

The header SHALL render the eight sections as four lines, two per line:
(1) path/git left with companion chips right; (2) clock and Subject left
with Work right; (3) Activity left with this-turn cost right; (4) engine,
quota window, machine, and global cost left with notices right.

#### Scenario: idle rendering at 100+ columns

- **WHEN** the session is idle with no work focus and no notices
- **THEN** lines 2–3 render as
  `󰠭 000:00'00 ⟩ <Subject>` with dim `— no change owns the moment`
  right, and `awaiting Human` with `— · 0 tok` right, and nothing renders
  in the notice slot

#### Scenario: mid-work rendering at 100+ columns

- **WHEN** a turn edits `packages/header/src/deck.ts` under change
  `eight-section-deck` task 1 of 4, consuming 4.2k tokens over 0:38
- **THEN** line 2 right renders `eight-section-deck · 1/4` and line 3
  renders ` editing packages/header/src/deck.ts` left with
  `this turn 4.2k · 0:38` right

#### Scenario: narrow frames keep companions

- **WHEN** the terminal is narrower than the path's yield threshold
- **THEN** companion chips persist right-aligned and the path yields
  first, preserving the always-visible contract

### Requirement: Counter tiles are removed

The deck SHALL NOT render `task`, `stps`, or run-counter tiles in any
state; Work, Activity, and the spans rows are their replacements.

#### Scenario: counters absent

- **WHEN** the deck renders in any state
- **THEN** the strings `task 00/00`, `stps 00/00`, and `00 › 00` appear
  in no rendered line

### Requirement: Conditional blocks keep their homes

Goal progress rows SHALL render beneath line 2 only while a goal is
focused, and spans rows SHALL render beneath line 3 only while agents or
bashes are live.

#### Scenario: focused goal

- **WHEN** a goal is focused and mid-work
- **THEN** the goal's tasks and usage rows render beneath the Subject/Work
  line and the headline never becomes the goal

### Requirement: Unified notice slot

Line 4 right SHALL aggregate companion warning texts, the unfocused
open-goal hint, and diagnostics counts into one `⚠` slot, ranked in that
order and joined with ` · `, rendering nothing when clean.

#### Scenario: clean session

- **WHEN** no warnings exist
- **THEN** the notice slot renders nothing

#### Scenario: mixed warnings

- **WHEN** one goal is open unfocused, appa is unreachable, and two
  diagnostics exist
- **THEN** the slot renders
  `⚠ 1 open goal · /goal-focus · appa unreachable · 2 diagnostics`

### Requirement: Waiver suppresses its notice

A set `waiver` SHALL suppress exactly its matching notice text from the
notice slot; the waiver's absence SHALL restore the notice.

#### Scenario: waiver set

- **WHEN** the waiver is
  `{"id":"graphify-stale","notice":"graphify · update recommended"}` and
  graphify reports that text
- **THEN** the notice slot renders without that text

#### Scenario: waiver cleared

- **WHEN** the waiver is removed and graphify still reports
- **THEN** `⚠ graphify · update recommended` renders again

### Requirement: Release as 0.3.0

The change SHALL ship as `@aemonge-dev/pi-vimux-starship@0.3.0` from a
clean tree with the full gate green and the current baseline manifest
refreshed.

#### Scenario: release verification

- **WHEN** the release completes
- **THEN** `pi list` shows `npm:@aemonge-dev/pi-vimux-starship@0.3.0` and
  a fresh session renders the eight-section deck
