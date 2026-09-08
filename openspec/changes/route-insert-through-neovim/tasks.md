# Tasks

Step states: `[ ]` Pending, `[-]` Running/interrupted/failed, `[x]` Complete.

## Task 1 — Use Neovim as the sole prompt composer

- **Value:** The consolidated cockpit keeps its Header Deck and Vim command language
  while removing Pi's visible/native prompt editor and routing composition through the
  existing Neovim handoff.
- **Method source:** predefined
- **Method name:** TDD
- **Method contract:** Characterize the external-editor-only surface and each supported
  Insert-producing transition with discriminating test-only RED failures, implement the
  minimum centralized deferred handoff and zero-row render, then refactor while keeping
  the focused and package suites GREEN.
- **Execution source:** native-direct
- **Execution name:** External-editor-only cockpit surface
- **Execution reason:** `ModalEditor.setMode('insert')` is the central transition seam,
  but command-specific text and cursor mutations finish later in input dispatch; direct
  sequential execution best protects that ordering and the shared deck render contract.
- **Execution outline:** Add RED contracts for the hidden prompt surface, deferred
  Insert-command routing, and separator mode icon; implement one explicit consolidated
  surface using the existing Ctrl-E adapter; then document and assure the complete slice.
- **Estimate basis:** Current custom-editor rendering, external-editor, deck-surface, and
  mode-dispatch tests establish the seams, but no comparable Human-validated zero-row
  prompt implementation exists.
- **Estimated implementation:** 55–90 minutes; Human wait excluded.
- **Estimate confidence:** Low because hidden-buffer change, repeat, and undo invariants
  require characterization when Insert mode is suppressed.
- **Human-wait estimate:** Separate and unbounded; Human validates finished behavior once
  after GREEN assurance.
- **Refinement trigger:** Stop and revise if regular-mode zero-row rendering requires Pi
  private internals, the existing handoff cannot be reused, or suppressing Insert breaks
  Normal/Visual command behavior.
- **Implementation confirmed at:** 2026-09-08T11:47:03Z
- **Repair confirmed at:** 2026-09-08T12:45:15Z
- **Implementation started at:** 2026-09-08T11:47:40Z
- **Repair started at:** 2026-09-08T12:45:15Z
- **Work completed at:** 2026-09-08T12:16:33Z
- **Repair work completed at:** 2026-09-08T12:53:47Z
- **Assurance started at:** 2026-09-08T12:16:56Z
- **Assurance completed at:** 2026-09-08T12:18:11Z
- **Repair assurance started at:** 2026-09-08T12:55:17Z
- **Repair assurance completed at:** 2026-09-08T12:56:22Z
- **Ready for revalidation at:** Pending Step 1.4 history verification
- **Actual implementation:** 13m10s recorded Step implementation plus 1m38s final
  deterministic assurance; Human wait excluded.
- **Observed Human wait:** 13m41s between Step 1.1 completion and approved
  Devbox-allowlisted receipt verification; excluded from implementation.
- **Estimate outcome:** Below the 55–90 minute range because the confirmed public render,
  centralized mode, and shared deck seams required no repair; retain low confidence until
  Human validates live TUI behavior.
- **Final history target:** `feat(vim): use Neovim as prompt composer`
- **Current non-Git boundary:** Not applicable; the standalone project uses existing Git.
- **Human validation:** CHANGE at 2026-09-08T12:30:59Z — hidden surface accepted;
  active Neovim icon and automatic submission require refinement.

- [x] Step 1.1 Specify the external-only surface, deferred Insert-command routing, and
      Header Deck mode-icon placement with test-only RED contracts.
  - Estimate: 15–25 minutes; uncertainty was a compact harness that discriminates
    post-command launch ordering without invoking Neovim.
  - Started: 2026-09-08T11:47:40Z
  - Completed: 2026-09-08T11:53:54Z
  - Timing: 6m14s implementation/check time; below estimate because existing editor
    fixtures covered the required dispatch seams.
  - Check: RED as required — 8 focused failures each discriminated missing behavior:
    zero-row/Normal surface, deferred command launches, non-recursive Ctrl-E return,
    mode-icon fallback/live styling, deck mode context, and consolidated selection;
    20 neighboring focused contracts remained GREEN. Source integrity PASS (92 current,
    87 imported files).
  - Paths: `openspec/changes/share-pi-vimux-starship/idea.md`, this Plan/ledger,
    `packages/pi-vim-top-border/test/{editor-only-surface,external-editor-intercept}.test.ts`,
    `packages/galactica-context-header/test/deck.test.ts`,
    `test/{deck-surface,local-load-probe}.test.ts`, and `baseline/source.sha256`.
  - History: `step(vim): specify external-only prompt handoff`; independently verified
    through its owner-only external receipt.
- [x] Step 1.2 Implement the explicit consolidated surface, centralized deferred handoff,
      zero-row prompt render, and live styled separator mode icon.
  - Estimate: 25–40 minutes; uncertainty was preserving hidden-buffer change, repeat,
    and undo behavior after command pre-mutations.
  - Started: 2026-09-08T12:07:51Z
  - Completed: 2026-09-08T12:13:13Z
  - Timing: 5m22s implementation/check time; below estimate because centralized
    transition and render seams accepted the bounded change without repair.
  - Check: GREEN — Vim 21/21, Header 87/87, tooling 10/10, TypeScript and lint PASS;
    source integrity PASS (92 current, 87 imported files). The adapter and Neovim bridge
    remain unchanged.
  - Paths: `packages/pi-vim-top-border/index.ts`,
    `packages/pi-vim-top-border/test/external-editor-intercept.test.ts`,
    `packages/galactica-context-header/{index.ts,src/deck.ts}`, `src/{deck-surface,index}.ts`,
    this ledger, and `baseline/source.sha256`.
  - History: `step(vim): replace Insert with Neovim handoff`; independently verified
    through its owner-only external receipt.
- [x] Step 1.3 Document the external-only workflow and run complete offline package
      assurance while preserving GREEN.
  - Estimate: 15–25 minutes; uncertainty was aligning the large standalone Vim reference
    without misdescribing its unchanged default surface.
  - Started: 2026-09-08T12:14:59Z
  - Completed: 2026-09-08T12:18:11Z
  - Timing: 3m12s implementation/check time; below estimate because the standalone and
    consolidated surfaces could be documented independently without restructuring the
    reference.
  - Check: Full `npm run check` PASS — format, lint, TypeScript, 386 tests, integrity,
    composition, and OpenSpec; credential-free offline Pi load PASS with 211 model rows.
  - Paths: `README.md`, `docs/architecture.md`,
    `packages/pi-vim-top-border/README.md`, this Plan/ledger, and
    `baseline/source.sha256`.
  - History: `step(cockpit): document external-only prompt surface`; independently
    verified through its owner-only external receipt.
- [x] Step 1.4 Align active-handoff mode feedback and post-Neovim submission with Human
      validation using the clarified explicit-write boundary.
  - Estimate: 20–35 minutes; uncertainty was distinguishing intentional same-content
    writes from unwritten exits without changing established adapter safety behavior.
  - Started: 2026-09-08T12:45:15Z
  - Completed: 2026-09-08T12:56:22Z
  - Timing: 8m32s implementation plus 1m05s deterministic assurance; below estimate
    because a fixed modification-time sentinel made the write boundary discriminating.
  - Check: RED — 6 focused failures for absent outcomes, active Insert feedback,
    exactly-once submission, and deduplication. GREEN — full format, lint, TypeScript,
    integrity, composition, OpenSpec, and 391 tests PASS; credential-free offline Pi
    load PASS with 213 model rows.
  - Paths: `packages/pi-vim-top-border/{index.ts,prompt-external-editor.ts}`, focused
    external-editor tests, `README.md`, `docs/architecture.md`, package README, this
    Plan/ledger, and `baseline/source.sha256`.
  - History: Expected `step(vim): align handoff state and submission`; external receipt
    pending independent verification.

### Human validation

- [ ] Human tries representative Insert-producing commands, unchanged/cancel return,
      direct Ctrl-E, hidden-draft reopening, and submission in non-fullscreen Pi inside
      `nvim +terminal`, then reports a clear outcome; preserve the original response,
      canonical outcome, and UTC.
  - Evidence 2026-09-08T12:30:59Z — original response: “The icon don't change upon
    launching the insert mode. The hidden thing is AWESOME !!! <3 We should submit
    automatically, specially now that when nvim `:x` saves and exit, we don't see the
    text. Rest is ok :)”
  - Canonical outcome: CHANGE.
  - Accepted: zero-row hidden prompt surface and remaining tested behavior.
  - Requested: active Neovim/Insert icon feedback and automatic submission after the
    intended save-and-exit flow.
