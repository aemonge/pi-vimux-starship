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

It verifies current and imported integrity, formatting, Biome and ESLint, strict
TypeScript, repository tooling tests, every component suite, and schema-aware OpenSpec
planning state. Formatter writes are separate and explicit:

```bash
npm run format
npm run format:check
```

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

Use `npm pack --dry-run` before creating an artifact. Any actual tarball belongs under a
bounded temporary output path during checks. The private package is not authorized for
npm publication or remote Git push.

A distributable artifact must include runtime source, README, licenses, provenance and
required package metadata while excluding tests only when equivalent source checks have
already passed. Optional adapters must remain optional in clean-room fixtures.
