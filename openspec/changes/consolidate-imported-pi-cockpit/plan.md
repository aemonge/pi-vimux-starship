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
- **Execution outline:** Establish a reproducible baseline, compose the modules behind
  one package entrypoint, retire superseded expansion that adds no concrete value, then
  prove a minimal packed artifact and explain it through a user-facing README and
  reproducible VHS demonstration.
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
- **Task 3 finish confirmed at:** 2026-09-08T14:57:33Z
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

- [ ] One package source loads the Human-validated rich lifecycle and telemetry deck,
      borderless modal editor, and external-editor handoff in deterministic order.
- [ ] Pi's active theme remains authoritative; the package introduces neither a theme
      nor an unused package-wide configuration namespace.
- [ ] Git, OpenSpec, Taskflow, Devbox, provider quota, Nerd Font, Neovim, and tmux
      capabilities remain optional and fail soft when absent.
- [ ] Existing component configuration behavior remains intact until a concrete
      package-wide configuration use case is separately accepted.
- [ ] Upstream licenses and local-change provenance ship in the packed artifact.
- [ ] Formatting, lint, type checks, component tests, composition tests, responsive
      rendering, and package-load checks pass from one reproducible development
      environment.
- [ ] One credential-free extracted tarball loads offline while deterministic fixtures
      cover Git, OpenSpec, Devbox, quota-state, and missing-capability behavior without
      initializing auxiliary repositories.
- [ ] The root README leads with the recommended non-fullscreen `nvim +terminal` bridge
      workflow, installation/rollback, `/vimux-health`, limitations, and privacy.
- [ ] A deterministic VHS tape demonstrates `Normal → i → Neovim → :x → automatic
      submission` without provider traffic or private session content; Human runs and
      reviews the one sanctioned generated GIF before it enters final history.
- [ ] Human validates each Task in Pi and validates the complete package before the Plan
      closes.

## Scope and boundaries

Included paths are the standalone repository's root package metadata, `packages/`,
bounded composition code in `src/`, tests, user-facing and maintainer documentation,
licenses, one VHS tape, one Human-generated reviewed demo GIF, and this Plan's progress
records. The immutable imported-source manifest preserves the original comparison
boundary while the current-source manifest records intentional evolution.

Excluded are further Insert-to-Neovim changes, transcript-navigation features, npm
publication, broad platform guarantees, redesign of accepted presentation, shipping the
private Neovim bridge, mutation of Galactica source packages, and automatic changes to
protected Pi settings. The optional command-palette binding is documentation only unless
Human separately grants exact Pi-configuration authority. Network installation, external
publication, credentials, private runtime capture, and history rewriting remain outside
this Plan; the single sanitized VHS GIF is the explicit narrow screenshot exception.

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
tests, manifest/license and package-allowlist checks, packed-artifact inspection, one
credential-free offline load from an extracted tarball, deterministic capability
fixtures, and static VHS tape checks. Give Human concrete install/rollback, `/reload`,
wide/narrow terminal, capability-presence, generated-demo review, and fallback checks.

**Final history target:** `feat(pi-vimux-starship): consolidate the validated cockpit`

**Checkpoint policy:** In the standalone Git repository, each successful Step commits
only its declared source, test, and OpenSpec progress paths as
`step(pi-vimux-starship): concise value`. Record and independently verify the commit
hash outside the commit. The final conventional Task commit waits for Human validation.
