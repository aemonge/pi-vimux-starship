# Status Architecture

> **Frozen contract.** This document records the agreed status architecture for the
> pi-vimux-starship cockpit. Development proceeds against this contract; changing it
> requires explicit Human direction. Element relocation and layout redesign are
> explicitly deferred and remain outside this contract.

## Motivation

The imported cockpit derives its title, status, focus, and task/step telemetry through
several independent projection chains. Each chain re-resolves selection priority,
guesses lifecycle stage from tool names, and refreshes a subset of surfaces on its own
timing. Surfaces therefore drift: the title, header, and footer disagree about intent,
stage, and progress.

The frozen architecture replaces those chains with three mutable facts, one reducer,
and derived-only surfaces.

## The snapshot

All cockpit state folds into one versioned snapshot:

```text
CockpitSnapshot
├── selection   ← THE focus slot; one discriminated union, one resolver
├── runs        ← span tree of the direct agent, subagents, and child processes
└── progress    ← OpenSpec-derived task/step counts with freshness metadata
```

Diagnostics and orchestration remain bounded collector domains feeding the same event
path; they are never selection authorities.

## selection

Selection is the single answer to "what is this session about". It is one slot:

```text
selection =
  | { kind: 'openspec-task', change, task }   ← openspec_focus tool
  | { kind: 'goal', ... }                     ← goal events
  | { kind: 'session-work', intent, phase }   ← work_focus tool
  | { kind: 'subject', title }                ← passive fallback, never overrides
  | { kind: 'none' }
```

Rules:

- Priority is resolved by exactly one resolver, in the order listed above.
- `subject` never displaces an active selection; it fills the slot only when nothing
  else holds it.
- The existing tools keep their external behavior and persisted session-entry formats.
- Goal and session-work are selection kinds, not parallel slots competing for focus.

## runs

Runs are a span tree describing who is doing what right now:

```text
{ id, kind: 'agent' | 'subagent' | 'bash', parent, label?, agent?, stage, since,
  endedAt? }
```

- The direct agent is the root span of the current turn.
- Subagents and bash children are child spans with parent ids.
- Subagent identity (agent name) and per-span stage are required; counts alone are
  insufficient.
- Runs are ephemeral; they describe the live turn and do not persist.

## Stage vocabulary

Stages come from the Ramona loop and its runtime states:

```text
understanding | working | assuring | learning | answering
waiting | blocked | listening | aborted
```

- Declared stages are truth. The model announces stage transitions through a Ramona
  `AGENTS.md` emission duty, recorded here as a future dependency of full fidelity.
- Name-based inference (`classifyHeaderActivity`) is demoted to a fallback for runs
  and turns without declarations; it must never override a declaration.
- Child runs without declarations use the fallback until subagent partial results
  carry a bounded stage hint (optional future enrichment).

## progress

- OpenSpec `tasks.md` is the ledger of tasks and steps; the cockpit never owns or
  mutates them.
- Progress arrives as `{ tasks: done/total, steps: done/total, freshAt }` and displays
  its staleness honestly.
- A missing or stale collector never freezes silently, and absent focus removes the
  progress slot entirely. Placeholder dashes are forbidden.

## Derived-only rule

Title, status, and every rendered surface are pure projections of the snapshot:

- No renderer owns a fact, resolves priority, or decides refresh timing.
- `title = f(selection, stage, progress)`; it is never stored or updated
  independently.
- Each fact has exactly one home per surface; a fact appears at most once per surface.
- Silence when there is nothing to say: absent facts remove their slots.
- Gray-out amendment (Human-directed, 2026-09-18): the idle runtime capsule
  (with a live idle timer), the Git slot, and capability counts render dim
  markers instead of hiding; aggregate OpenSpec numbers never render without a
  focused task.
- A detail that only restates observability — "doing stuff" by another name — is a
  placeholder; rendered details must name their subject (agent, task, step, or
  command) or the slot collapses.

## Update flow

```text
any change ─▶ append event ─▶ reducer ─▶ snapshot v++ ─▶ renderers
```

Every producer — tools, Pi lifecycle events, goal sync, collectors, taskflow — appends
bounded events. The reducer is the only writer of snapshot state. Renderers are dumb,
stateless consumers.

## Persistence

- `selection` persists in versioned session entries and restores on restart.
- `runs` are ephemeral.
- `progress` is always re-derived from disk truth.

## Compatibility boundaries

During migration the existing channels remain the seams consumers attach to:

- `pi-fancy-footer:widget` and `pi-fancy-footer:ready`
- `galactica-status:header` and `galactica-status:prompt-row`

They are fed from the snapshot and retired only when every consumer renders from it.

## Deferred

The following are out of scope until this contract is developed and Human-accepted:

- TUI element relocation, band restructuring, and layout redesign.
- Terminal-title content beyond the derived function.
- External surfaces such as tmux or starship reading a flushed snapshot file.

## Privacy

The package privacy boundary applies unchanged: bounded state, counts, and
deliberately selected identifiers only; never prompts, generated prose, tool
arguments, child output, credentials, authentication material, or hidden reasoning.
