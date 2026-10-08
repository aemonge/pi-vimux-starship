# Plan: Make Neovim the sole prompt composer

- **Idea:** `share-pi-vimux-starship`
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
- **Ready for revalidation at:** 2026-09-08T12:58:33Z
- **Human validation:** VALID at 2026-09-08T13:25:42Z after one CHANGE repair; original
  final response: `VALID`.
- **Repair boundary:** Show Insert while either Insert routing or Ctrl-E owns an active
  handoff; submit exactly once after an explicit temporary-file write and successful
  editor exit. An unwritten exit, failure, inactive controller, or duplicate request
  never submits. Outer-Neovim `startinsert` remains excluded.

## Value

The consolidated cockpit uses Neovim as its sole prompt composer in regular Pi mode.
The Header Deck remains visible, Pi's native prompt/editor rows disappear, and every
currently supported Vim command that would enter Insert instead opens the existing
external-editor workflow after its command mutation completes.

## Acceptance criteria

- [ ] The consolidated package selects an explicit external-editor-only surface that
      starts in Normal mode and renders no prompt text, frame, cursor, or autocomplete
      rows in regular Pi mode.
- [ ] `i`, `a`, `A`, `I`, `o`, `O`, `s`, `S`, `C`, supported `c` motions and text
      objects, and Visual change/substitute commands request external editing only after
      their cursor/text mutation completes.
- [ ] Redirected command state remains Normal, one dispatch requests at most one launch,
      and applying returned editor text does not recursively reopen Neovim.
- [ ] Insert is shown while either Insert routing or direct Ctrl-E owns an active
      handoff, then returns to Normal after exit or failure.
- [ ] A successful exit after an explicit write, including a same-content write,
      auto-submits the last saved bytes exactly once through Pi's ordinary Enter path;
      an unwritten exit, failure, inactive controller, or duplicate request never sends.
- [ ] Normal and Visual commands plus essential Pi application controls remain active
      against the hidden draft; previously unsupported Vim commands remain unsupported.
- [ ] The live, already-styled Insert/Normal/Visual/EX mode icon appears once at the left
      edge of the Header Deck bottom separator and no prompt rail remains.
- [ ] Empty, unchanged, unavailable, and failed handoffs preserve bounded behavior
      without changing Pi or Neovim configuration or the private bridge.
- [ ] Deterministic package checks pass and Human validates representative commands in
      the non-fullscreen `nvim +terminal` workflow.

## Scope and boundaries

Implementation is confined to the consolidated surface selection, Pi Vim editor and
external-editor adapter with focused tests, the internal deck-surface contract, Header
Deck rendering and tests, related documentation, OpenSpec artifacts, and the mutable
source-integrity manifest. It adds no dependency or configuration setting.

Regular non-fullscreen Pi can render the focused custom editor as zero rows. Pi's
fullscreen layout reserves a core three-row editor slot, so blank fullscreen space is an
explicit unsupported limitation rather than a reason to use private internals.

The Plan excludes new Vim commands, Starship/Zsh or tmux changes, outer-Neovim
`startinsert`, Neovim configuration or bridge changes, Pi keybindings or Pi core changes,
clipboard-policy changes, network activity, publication, protected Pi configuration,
external commands beyond the already configured handoff, and history rewriting.

## Method and execution

TDD records deterministic RED evidence before production behavior. Native direct
execution keeps the cross-package mode/deck contract and deferred input ordering under
one sequencer. The external-only surface queues a request at the centralized Insert
transition seam and flushes it once after the current input dispatch. While the returned
promise is active, the live rail resolves to Insert. The adapter distinguishes explicit
writes with a known temporary-file modification-time sentinel and returns a bounded
outcome; only `saved` reuses the editor's Enter path. The same editor retains focus and
hidden buffer state, while its render path returns only the Header Deck. A bounded,
diagnosed in-scope mismatch may return to implementation; a material architecture or
authority change stops for Human direction.

## Verification

Run focused RED/GREEN tests for zero-row rendering, initial Normal state, supported
Insert-producing commands, command-completion ordering, deduplication, recursion
prevention, Ctrl-E preservation, explicit-write outcomes, exactly-once auto-submission,
and ANSI-safe mode icon placement. Then run formatting, lint, TypeScript, all component
and tooling tests, source integrity, OpenSpec validation, and the offline package
composition probe. Human manually tries `i`, `a`, `A`, `o`, `cw`, Visual `c`, `:x`,
`:wq`, `:q!`, unchanged `:x`, and Ctrl-E in non-fullscreen Pi inside
`nvim +terminal`.

**Final history target:** `feat(vim): use Neovim as prompt composer`

**Checkpoint policy:** Each RED, GREEN, and documentation/assurance Step uses one scoped
Git commit containing only declared paths and matching OpenSpec progress. Record and
independently verify hashes outside commits. The final conventional Task commit waits
for Human validation.
