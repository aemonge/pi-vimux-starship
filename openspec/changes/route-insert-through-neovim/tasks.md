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
- **Implementation started at:** 2026-09-08T11:47:40Z
- **Work completed at:** Pending
- **Assurance started at:** Pending
- **Assurance completed at:** Pending
- **Ready for validation at:** Pending
- **Actual implementation:** Pending
- **Observed Human wait:** Pending
- **Estimate outcome:** Pending
- **Final history target:** `feat(vim): use Neovim as prompt composer`
- **Current non-Git boundary:** Not applicable; the standalone project uses existing Git.
- **Human validation:** Pending

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
  - History: Expected `step(vim): specify external-only prompt handoff`; external receipt
    pending independent verification.
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
  - History: Expected `step(vim): replace Insert with Neovim handoff`; external receipt
    pending independent verification.
- [ ] Step 1.3 Document the external-only workflow and run complete offline package
      assurance while preserving GREEN.
  - Estimate: 15–25 minutes; uncertainty is aligning the large standalone Vim reference
    without misdescribing its unchanged default surface.
  - Timing: Pending
  - Check: Formatter, format check, lint, TypeScript, all tests, integrity, composition,
    and OpenSpec checks pass.
  - Paths: Root/package documentation, architecture, matching ledger, any formatter-only
    changes within declared Task paths, and `baseline/source.sha256`.
  - History: Pending; expected `step(cockpit): document external-only prompt surface`.

### Human validation

- [ ] Human tries representative Insert-producing commands, unchanged/cancel return,
      direct Ctrl-E, hidden-draft reopening, and Enter submission in non-fullscreen Pi
      inside `nvim +terminal`, then reports a clear outcome; preserve the original
      response, canonical outcome, and UTC.
