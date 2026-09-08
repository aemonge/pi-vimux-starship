# Architecture

## Current imported composition

The baseline is one Pi package identity with four existing extension factories:

```text
root package manifest
├── Fancy Footer telemetry provider
├── status and focus producer
├── Header Deck and telemetry producer
└── focused zero-row Vim command surface and external-editor consumer
```

The manifest lists exact entrypoints rather than flattening approximately 36,000 lines
into one file. Pi loads the package as one source; the modules continue to coordinate
through the event protocols that already isolate them.

Startup order is intentional:

1. Fancy Footer subscribes to widget snapshots.
2. Status registers focus tools and publishes lifecycle/work snapshots.
3. Context Header consumes status and supplies the Header Deck renderer.
4. Pi Vim installs the focused editor component, renders that deck with its live mode,
   and routes composition through the external-editor adapter.

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
├── deck-surface/         # Header Deck renderer and live mode context
├── status/               # normalized project/runtime state
├── adapters/             # optional OpenSpec, Taskflow, Devbox, MCP
├── config/               # namespace, presets, legacy compatibility
└── compatibility/        # feature-detected Pi API boundaries
```

This is a direction, not permission to move files. Each confirmed Task should preserve a
runnable boundary and keep the imported trees available for comparison until their role
is deliberately retired.

## External editor boundary

The consolidated package selects Pi Vim's explicit `external-editor-only` surface. The
focused `ModalEditor` remains the input and hidden-draft authority, but in regular Pi
mode its render path returns only the Header Deck: no prompt text, editor frame, cursor,
or autocomplete rows. Pi's fullscreen layout reserves a core three-row editor slot, so
fullscreen may retain blank space and is not the target workflow.

The existing `PromptExternalEditor` adapter remains the single handoff used by direct
Ctrl-E and automatic Insert-producing commands. It resolves the already configured
external editor and owns the private temporary prompt file; this package does not alter
Neovim configuration or duplicate the private Neovim bridge. A centralized
`setMode('insert')` interception keeps the external-only surface in Normal mode, queues
one request, and flushes it after the current command finishes mutating cursor and draft
text. Applying returned text cannot trigger another handoff.

Saving and exiting Neovim updates the hidden draft without submitting it. Enter remains
the explicit send boundary; Ctrl-E or another supported Insert-producing command reopens
the draft. Normal, Visual, and EX dispatch continue through the focused custom editor,
while previously unsupported Vim commands remain unsupported.
