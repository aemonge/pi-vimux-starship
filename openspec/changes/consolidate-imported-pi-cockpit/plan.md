# Plan: Consolidate the imported cockpit behind one package boundary

- **Idea:** `share-pi-vimux-starship`
- **Method source:** predefined
- **Method name:** Happy-path
- **Method contract:** Preserve the runnable imported baseline while delivering the
  smallest complete one-package cockpit before optional feature growth or publication
  hardening.
- **Execution source:** direct
- **Execution name:** Incremental in-repository consolidation
- **Execution reason:** The imported modules already communicate through bounded event
  protocols; direct, sequential consolidation keeps compatibility and presentation
  changes reviewable without parallel edits to tightly coupled startup order.
- **Execution outline:** Establish a reproducible baseline, compose and namespace the
  modules, consolidate configuration with compatibility fallbacks, then prove the packed
  artifact in clean capability states.
- **Estimate basis:** No comparable Human-validated package extraction exists; the
  imported baseline contains 35,920 authored lines and four existing test suites.
- **Estimated implementation:** 120–210 minutes across separately validated Tasks; Human
  wait excluded.
- **Estimate confidence:** Low; current runtime behavior is established, but two
  imported package development environments are incomplete and clean-room module
  resolution is unproven.
- **Human-wait estimate:** Separate and unbounded; each delivered Task waits for Human
  TUI validation.
- **Refinement trigger:** Split a Task further or reconsider execution if one Task
  exceeds 90 minutes, package loading requires redesign of event protocols, or
  dependency repair changes production behavior.
- **Implementation confirmed at:** 2026-09-03T13:16:34Z
- **Implementation started at:** 2026-09-03T13:17:16Z
- **Work completed at:** Pending
- **Assurance started at:** Pending
- **Assurance completed at:** Pending
- **Ready for validation at:** Pending
- **Human validation:** Pending

## Value

Human can develop, install, and validate the existing Pi cockpit from one independent
`pi-vimux-starship` repository without coordinating four Galactica package entries.

## Acceptance criteria

- [ ] One package source loads the lifecycle header, responsive footer, prompt rails,
      modal editor, and external-editor handoff in deterministic order.
- [ ] The Ramona Gruvbox preset reproduces the imported appearance while semantic
      defaults and Unicode fallbacks remain usable.
- [ ] Git, OpenSpec, Taskflow, Devbox, provider quota, Nerd Font, Neovim, and tmux
      capabilities remain optional and fail soft when absent.
- [ ] Legacy configuration inputs have documented compatibility behavior and one stable
      `pi-vimux-starship` namespace is available for new configuration.
- [ ] Upstream licenses and local-change provenance ship in the packed artifact.
- [ ] Formatting, lint, type checks, component tests, composition tests, responsive
      rendering, and package-load checks pass from one reproducible development
      environment.
- [ ] Clean-room demonstrations cover plain directory, Git, OpenSpec, Devbox,
      quota-state, and missing-capability cases.
- [ ] Human validates each Task in Pi and validates the complete package before the Plan
      closes.

## Scope and boundaries

Included paths are the standalone repository's root package metadata, `packages/`,
future consolidated `src/`, tests, documentation, licenses, and this Plan's progress
records. The imported files are the immutable comparison baseline until a Task
explicitly replaces their role.

Excluded are Insert-to-Neovim routing, transcript-navigation features, npm publication,
broad platform guarantees, redesign of accepted presentation, mutation of Galactica
source packages, and automatic changes to protected Pi settings. Pi configuration
changes require separate exact authority. Network installation, external publication,
credentials, and history rewriting remain outside this Plan.

Before implementation, inspect the moved repository, Git status, imported hashes,
package APIs, tests, and current Pi documentation. Present the exact Task brief and ask
`Can I implement this exact brief?` before mutation.

## Method and execution

Happy-path preserves the known baseline and advances through independently usable
slices. Direct execution is a bounded exception to Full Mode because module startup
order and shared event contracts make one sequential editor safer than delegated
concurrent mutation. Each Task uses focused checks and its own Git Step commits; a
material architecture or dependency change stops for renewed Human confirmation.

## Verification

Run exact-path formatting and lint, TypeScript checks, all imported and consolidated
tests, manifest and license checks, byte-level fixture comparisons where useful,
packed-artifact inspection, and offline package loading with extension discovery
disabled except for the package under test. Give Human concrete `/reload`, wide/narrow
terminal, capability-presence, and fallback checks for every delivered Task.

**Final history target:** `feat(pi-vimux-starship): consolidate the validated cockpit`

**Checkpoint policy:** In the standalone Git repository, each successful Step commits
only its declared source, test, and OpenSpec progress paths as
`step(pi-vimux-starship): concise value`. Record and independently verify the commit
hash outside the commit. The final conventional Task commit waits for Human validation.
