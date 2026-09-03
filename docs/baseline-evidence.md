# Baseline evidence

Captured during the 2026-09-03 handoff from Galactica.

## Import integrity

- Source files before copy: 87.
- Imported lines reported by `wc -l`: 35,920.
- Source-before versus source-after SHA-256 manifest: PASS.
- Source-before versus destination SHA-256 manifest: PASS.
- Copied `node_modules`: 0.
- Copied `.git` or `.rustory` metadata: 0.

The committed `baseline/source.sha256` and `npm run check:baseline` provide a repeatable
check after the move.

## Passing focused checks

- `galactica-status`: 108 tests passed.
- `galactica-context-header`: formatting and TypeScript checks passed; 69 tests passed.
- Galactica Neovim external-editor stacking test: passed headlessly.
- Rustory integrity for the source repository: passed before import.
- OpenSpec schema-aware status reports the Idea and both Plans complete. OpenSpec
  1.6.0's generic strict validator still requests spec deltas for these planning-only
  changes despite `skip_specs: true`; no irrelevant deltas were manufactured to silence
  it.

## Existing developer-environment gaps

These are baseline environment findings, not diagnosed source regressions:

- `galactica-status` lacks package-local `prettier` and `tsc` executables, although its
  raw Node test suite passes.
- `pi-fancy-footer-full-palette` has no local dependency tree; 70 tests that do not need
  unresolved peers passed, while five test files failed to resolve Pi core or `typebox`.
- `pi-vim-top-border` lacks package-local tool executables and its existing esbuild
  binary was not executable in the source environment, so its four test files did not
  start.

The first consolidation Task establishes one root development environment, reruns every
suite, and separates tooling repair from production behavior changes.

## Not yet claimed

The handoff does not claim:

- clean-room package load success;
- consolidated configuration;
- packed-artifact completeness;
- live TUI parity from the umbrella package;
- automatic Insert-to-Neovim behavior;
- Human validation of the standalone package.
