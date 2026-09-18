# Source inventory

## Imported baseline

The baseline was copied from the discovered Galactica root on 2026-09-03. Every authored
file was copied byte-for-byte; dependency trees and generated state were excluded.

| Imported directory                      | Responsibility                                          | Upstream relationship                 |
| --------------------------------------- | ------------------------------------------------------- | ------------------------------------- |
| `packages/status`                       | Focus, lifecycle, OpenSpec, Goal, Taskflow, diagnostics | Galactica-authored                    |
| `packages/galactica-context-header`     | Header, Git, MCP, process resources, prompt telemetry   | Galactica-authored                    |
| `packages/pi-fancy-footer-full-palette` | Footer, layout, quota, cost, widget protocol            | Local fork of `pi-fancy-footer` 3.0.1 |
| `packages/pi-vim-top-border`            | Vim editor, rails, clipboard, external-editor action    | Local descendant of `pi-vim` 0.14.1   |

Totals at import:

- 87 authored files;
- 35,920 lines reported by `wc -l`;
- zero copied `node_modules` directories;
- zero copied `.git` or `.rustory` metadata paths.

`baseline/source.sha256` records every imported file relative to this repository root.
`scripts/check-baseline.mjs` verifies both the exact file set and each digest.

## External Galactica references

The imported package intentionally does not copy machine integration outside the four
source trees. Relevant read-only references in Galactica include:

- `.pi/agent/settings.json` — current four-package load order and `piVim` settings;
- `.pi/agent/fancy-footer.json` — accepted footer layout;
- `.pi/agent/galactica-status.json` — current status-adapter configuration;
- `.pi/agent/keybindings.json` — direct `app.editor.external` Ctrl-E binding;
- `.config/nvim/scripts/pi-editor` — configured external editor executable;
- `.config/nvim/lua/runtime/pi-editor.lua` — private Neovim handoff runtime;
- `.config/nvim/tests/pi-editor-stacking_spec.lua` — bridge behavior check.

Discover Galactica's actual root rather than assuming it is always `~/galactica`. These
external files are references, not mutation targets of package consolidation. Never copy
credentials, sessions, runtime FIFOs, temporary prompts, or unrelated private state.

## Provenance

The two fork licenses are copied to the repository-level `licenses/` directory and also
remain beside their imported sources. Local modifications are described by each fork's
`LOCAL-CHANGES.md`. Keep both forms in distributable artifacts until provenance is
replaced by a clearer equivalent.
