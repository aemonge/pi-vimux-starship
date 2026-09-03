# Plan: Route Pi Vim Insert transitions through Neovim

- **Idea:** `share-pi-vimux-starship`
- **Method source:** predefined
- **Method name:** TDD
- **Method contract:** Characterize each Insert transition with a discriminating
  test-only RED failure, implement the minimum deferred handoff through the existing
  external-editor path, then refactor while keeping the focused suite GREEN.
- **Execution source:** direct
- **Execution name:** Centralized Insert-transition handoff
- **Execution reason:** `ModalEditor.setMode('insert')` is the central transition seam,
  but command-specific text and cursor mutations finish later in input dispatch; one
  sequential implementation best protects that ordering.
- **Execution outline:** Add RED contracts for Insert-producing commands, queue one
  transition request, flush it after dispatch through the existing external editor
  action, preserve direct Ctrl-E, then run Vim and bridge regression checks.
- **Estimate basis:** Existing external-editor and dispatch tests identify the seam, but
  no comparable Human-validated transition interception exists.
- **Estimated implementation:** 45–75 minutes; Human wait excluded.
- **Estimate confidence:** Low because Pi editor lifecycle timing and cancellation
  behavior require characterization in the consolidated package.
- **Human-wait estimate:** Separate and unbounded; Human validates finished behavior
  once after GREEN assurance.
- **Refinement trigger:** Stop and split or redesign if the feature cannot reuse the
  exact existing handoff, requires Pi core changes, or cannot defer launch until command
  dispatch finishes.
- **Implementation confirmed at:** Pending
- **Implementation started at:** Pending
- **Work completed at:** Pending
- **Assurance started at:** Pending
- **Assurance completed at:** Pending
- **Ready for validation at:** Pending
- **Human validation:** Pending

## Value

With an explicit opt-in setting, entering Insert mode from Pi Vim opens the current
prompt in the configured Neovim handoff, so normal Vim composition occurs in Neovim
while Ctrl-E remains the direct manual route.

## Acceptance criteria

- [ ] Only a real transition from a non-Insert mode to Insert requests automatic
      external editing.
- [ ] `i`, `a`, `A`, `I`, `o`, `O`, substitutions, change operators such as `cw`, and
      Visual changes launch only after their cursor/text mutation has completed.
- [ ] A dispatch produces at most one automatic launch and returning from Neovim does
      not recursively relaunch it.
- [ ] Automatic routing calls the same supported Pi external-editor action as Ctrl-E; it
      does not duplicate temporary-file, FIFO, terminal, or Neovim bridge logic.
- [ ] Ctrl-E remains available as the direct route regardless of the automatic setting.
- [ ] Disabled, unavailable, cancelled, empty, and failed handoffs preserve safe prompt
      and mode behavior with bounded feedback.
- [ ] Existing Vim editing, prompt rails, clipboard safety, and external-editor tests
      remain GREEN.
- [ ] Human validates the opt-in flow for representative Insert commands in the live
      TUI.

## Scope and boundaries

Implementation is confined to the consolidated package's Vim editor, settings,
external-editor adapter, and focused tests and documentation. The automatic behavior is
opt-in and trusted user-global configuration owns any execution-capable setting.

This Plan begins only after one-package load parity from
`consolidate-imported-pi-cockpit` is Human-validated. It excludes changes to
Starship/Zsh, tmux configuration, Neovim bridge internals, Pi keybindings, Ctrl-E
semantics, transcript navigation, clipboard policy, and Pi core. Protected Pi
configuration, external commands beyond the already configured handoff, and history
rewriting require separate authority.

Before implementation, inspect current consolidated source and tests, characterize
dispatch order, and present the exact implementation brief with
`Can I implement this exact brief?`.

## Method and execution

TDD requires each bounded test-only RED contract to fail for the expected missing
automatic-handoff behavior before production changes. Direct execution keeps the
RED/GREEN sequence and centralized ordering visible. A safe in-scope mismatch may return
to implementation; an unknown launch path, recursion risk, or material bridge change
stops for Human direction.

## Verification

Record deterministic RED evidence, then run the minimum GREEN focused tests for
transition detection, post-dispatch ordering, deduplication, recursion prevention,
cancellation, and direct Ctrl-E preservation. Run the complete Vim package suite,
TypeScript, formatting, lint, package composition checks, and the existing Neovim bridge
test without changing bridge files. Human manually tries `i`, `a`, `A`, `o`, `cw`,
Visual `c`, cancellation, and Ctrl-E.

**Final history target:** `feat(vim): route Insert transitions through Neovim`

**Checkpoint policy:** Each RED, GREEN, and refactor Step uses a scoped Git commit
containing only declared tests or implementation plus matching OpenSpec progress. Record
and independently verify hashes outside commits. The final conventional Task commit
waits for Human validation.
