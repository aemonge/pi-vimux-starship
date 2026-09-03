# Architecture

## Current imported composition

The baseline is one Pi package identity with four existing extension factories:

```text
root package manifest
├── Fancy Footer renderer
├── status and focus producer
├── lifecycle header and telemetry producer
└── Vim prompt editor and prompt-rail consumer
```

The manifest lists exact entrypoints rather than flattening approximately 36,000 lines
into one file. Pi loads the package as one source; the modules continue to coordinate
through the event protocols that already isolate them.

Startup order is intentional:

1. Fancy Footer subscribes to widget snapshots.
2. Status registers focus tools and publishes lifecycle/work snapshots.
3. Context Header consumes status and publishes prompt/footer telemetry.
4. Pi Vim installs the modal editor and consumes prompt-rail snapshots.

Taskflow remains a separate optional Pi package. Its bounded runtime events are consumed
when present; it is not a dependency of this package.

## Stable protocol seams

The imported modules currently coordinate through:

- `pi-fancy-footer:widget` — complete protocol-1 widget snapshots;
- `pi-fancy-footer:ready` — consumer readiness and producer republish;
- `galactica-status:header` — bounded lifecycle/focus snapshots;
- `galactica-status:prompt-row` — prompt-rail telemetry;
- `pi-vim:mode-change` — bounded editor mode events;
- `pi-mcp-adapter/status/v1` — optional MCP availability.

These channels are compatibility boundaries. Consolidation may centralize their types
but must not silently change semantics or permit sensitive payloads.

## Target module shape

The consolidation Plan should evolve toward bounded ownership such as:

```text
src/
├── index.ts              # composition root only
├── editor/               # modes, motions, operators, clipboard
├── external-editor/      # Pi action adapter, not private bridge logic
├── header/               # lifecycle and focus rendering
├── footer/               # responsive renderer and provider state
├── prompt-rails/         # mode and bounded telemetry
├── status/               # normalized project/runtime state
├── adapters/             # optional OpenSpec, Taskflow, Devbox, MCP
├── config/               # namespace, presets, legacy compatibility
└── compatibility/        # feature-detected Pi API boundaries
```

This is a direction, not permission to move files. Each confirmed Task should preserve a
runnable boundary and keep the imported trees available for comparison until their role
is deliberately retired.

## External editor boundary

Pi Vim already calls Pi's supported external-editor action. In Galactica that action is
configured to a private Neovim bridge, but the package does not own or duplicate the
bridge implementation. Ctrl-E remains the direct action.

The deferred automatic-Insert Plan may request this same action when a real mode
transition enters Insert. The request belongs at the centralized mode seam; invocation
must be deferred until the current Vim command finishes mutating cursor and prompt text.
