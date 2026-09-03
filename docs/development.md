# Development

## Prerequisite boundary

Work only after this tree has moved outside Galactica and normal Git has been
initialized with the imported-baseline commit. Confirm:

```bash
pwd -P
git status --short
npm run check:baseline
```

Do not modify the Galactica source packages while developing this repository.

## Runtime package dependencies

Pi provides these core imports to extensions; the root manifest declares them as peer
dependencies:

- `@earendil-works/pi-ai`;
- `@earendil-works/pi-coding-agent`;
- `@earendil-works/pi-tui`;
- `typebox`.

The imported packages retain their existing development metadata. No dependency install
was run during handoff creation. Establishing one reproducible root development
environment is the first consolidation Task and may require explicit network/package
installation authority.

## Existing component commands

```bash
npm run test:status
npm run test:header
npm run test:footer
npm run test:vim
npm run test:components
```

Some commands will remain unavailable or fail module/tool resolution until the root
development environment is established; see `baseline-evidence.md`. Do not “fix” that by
committing `node_modules`, copying Pi's installation tree, weakening checks, or changing
production behavior.

## Isolated Pi loading

The current global Pi settings load the original four Galactica packages. Loading the
umbrella package at the same time would duplicate commands, event listeners, and editor
registration. For an isolated probe, explicit `-e` paths still load when normal
extension discovery is disabled:

```bash
pi --offline --no-extensions -e "$(pwd -P)" --list-models
```

Use a bounded interactive session only when its manual checks are declared. Do not make
provider requests merely to prove package loading.

After parity validation and exact `ALLOW PI CONFIG` authority, install the local package
with:

```bash
pi install "$(pwd -P)"
```

Then remove or disable the four legacy package entries as one reviewed migration. Do not
use `npm link`; Pi local paths are already linked without copying.

## Packaging

Use `npm pack --dry-run` before creating an artifact. Any actual tarball belongs under a
bounded temporary output path during checks. The private baseline is not authorized for
npm publication or remote Git push.

A distributable artifact must include runtime source, README, licenses, provenance, and
required package metadata while excluding tests only when equivalent source checks have
already passed. Optional adapters must remain optional in clean-room fixtures.
