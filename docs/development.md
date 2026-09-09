# Development

## Standalone boundary

Work from the standalone repository and confirm its current integrity:

```bash
cd /home/aemonge/projects/pi-vimux-starship
pwd -P
git status --short
npm run check:baseline
```

The exact import is preserved at Git commit `9d7bb84` and in
`baseline/imported-source.sha256`. Current intentional package files are tracked by
`baseline/source.sha256`; update that manifest only inside a confirmed Task after focused
checks pass.

## Dependencies

The root package is the only dependency-install boundary. Pi provides the four runtime
peers used by the extensions:

- `@earendil-works/pi-ai`;
- `@earendil-works/pi-coding-agent`;
- `@earendil-works/pi-tui`;
- `typebox`.

Development uses one root `package-lock.json`; workspace-local lockfiles and
`node_modules` are not part of the project. After the cache has been populated, reproduce
the exact tree without network access:

```bash
npm ci --offline --ignore-scripts --no-audit --no-fund
```

Do not weaken peer contracts, copy Pi's installation tree, or commit generated
dependencies.

## Verification

Nearest focused commands remain available:

```bash
npm run test:status
npm run test:header
npm run test:footer
npm run test:vim
npm run test:components
```

The complete deterministic gate is:

```bash
npm run check
```

It verifies current and imported integrity, the packed-file allowlist, a real temporary
artifact extraction and credential-free offline Pi load, formatting, Biome and ESLint,
strict TypeScript, repository tooling tests, every component suite, and schema-aware
OpenSpec planning state. The package checks are also available independently:

````bash
npm run check:package
npm run check:package:load
``` Formatter writes are separate and explicit:

```bash
npm run format
npm run format:check
````

`npm run check:openspec` treats `skip_specs: true` only as a planning-schema contract for
completed `ramona-idea` and `ramona-plan` artifacts. Every other change is delegated to
upstream strict OpenSpec validation.

## Isolated Pi loading

The normal Pi settings may still load the original Galactica packages. Avoid duplicate
commands, event listeners and editor registration by disabling normal discovery during a
probe:

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

`npm run check:package` wraps `npm pack --dry-run --json --ignore-scripts` and rejects
planning records, tests, baselines, agent instructions, development configuration,
private settings, and credentials. `npm run check:package:load` creates the actual
artifact only in a temporary directory, extracts it, and invokes that package through Pi
with a fresh HOME, no session, no discovered extensions, no credential environment, and
o network.

The private package is not authorized for npm publication or remote Git push. Optional
capabilities remain fixture-covered without initializing an auxiliary Git or Rustory
repository.

## VHS demonstration

The demo source is `demo/pi-vimux-starship.tape`. VHS is intentionally not a project
runtime or development dependency. The public header-led recording hides routine
startup, runs Pi directly, and does not require the private Neovim bridge:

```bash
vhs demo/pi-vimux-starship.tape
```

The tape uses offline, sessionless Pi, applies an ephemeral public title, and dispatches
`:vimux-health` through Pi Vim's Normal-mode EX bridge rather than sending a provider
prompt. It pins VHS's Gruvbox Light terminal theme, uses compact header-led framing, and
waits for stable screen text instead of relying only on launch timing. Human must review
`docs/assets/pi-vimux-starship.gif` for private runtime content before its final
Task-boundary commit.
