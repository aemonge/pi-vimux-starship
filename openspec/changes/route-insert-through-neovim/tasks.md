# Tasks

Step states: `[ ]` Pending, `[-]` Running/interrupted/failed, `[x]` Complete.

## Task 1 — Open Neovim after every opted-in Insert transition

- **Value:** Pi Vim users can compose through Neovim whenever a command enters Insert
  while retaining Ctrl-E as the direct manual route.
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
- **Actual implementation:** Pending
- **Observed Human wait:** Pending
- **Estimate outcome:** Pending
- **Final history target:** `feat(vim): route Insert transitions through Neovim`
- **Current non-Git boundary:** Not applicable after Human moves the scaffold and
  initializes Git.
- **Human validation:** Pending

- [ ] Step 1.1 Add test-only RED contracts for transition detection, command-completion
      ordering, deduplication, recursion prevention, cancellation, and Ctrl-E
      preservation.
  - Estimate: 15–25 minutes; uncertainty is the smallest deterministic dispatch harness.
  - Timing: Pending
  - Check: Must fail for the expected absence of automatic external editing while
    existing Ctrl-E tests remain GREEN.
  - History: Pending
- [ ] Step 1.2 Add the minimum opt-in setting and deferred post-dispatch call to the
      existing external-editor action.
  - Estimate: 15–25 minutes; uncertainty is cancellation and mode state when the
    external editor returns.
  - Timing: Pending
  - Check: Focused RED contracts become GREEN without changing Neovim bridge files.
  - History: Pending
- [ ] Step 1.3 Refactor the transition queue and run complete package, Vim, and bridge
      regressions while preserving GREEN.
  - Estimate: 15–25 minutes; uncertainty is command coverage beyond the characterized
    Insert producers.
  - Timing: Pending
  - Check: Formatting, lint, TypeScript, complete relevant tests, and existing bridge
    checks pass.
  - History: Pending

### Human validation

- [ ] Human tries representative Insert-producing commands, cancellation, return, and
      direct Ctrl-E in Pi and reports a clear outcome; preserve the original response,
      canonical outcome, and UTC.
