# Local changes

This is a Galactica-managed local fork of `pi-fancy-footer` 3.0.1.

## Full Pi theme palette

The extension-widget and configuration color schema accepts Pi's complete foreground
theme-token palette instead of limiting footer widgets to seven generic colors. This
lets Galactica use the configured cyan, purple, orange, green, red, and teal palette
without embedding ANSI escapes or falling back to gray text.

## Extension-widget emphasis

Protocol-1 extension widgets accept `style.bold: true`. The renderer applies
theme-native bold after effective text-color resolution, allowing Galactica's PWD widget
to stand out without embedding unsafe ANSI escapes or bolding its icon.

## Compact metric presentation

The `percent` provider-status display mode joins the most constrained known quota to the
LLM group as `›  4%`, with no window analysis. Its five-state battery depletes from ``
through `` and changes semantic color as remaining quota falls. Cache accounting
remains available even when its persistent widget is disabled. Session cost uses a
leading major `⟩`, no treasure-chest glyph, and compact trailing-zero-free formatting of
Pi's native USD estimate (`$0`, `$0.1`, `$1`, or `$1.23`). Cache and cost remain neutral
local telemetry instead of inheriting unrelated context-pressure warnings; context, CPU,
and RAM own their warning colors independently. Galactica now keeps exactly one footer
row: project PWD and Git state on the left, with model, reasoning, and quota on the
right. On wide terminals, the footer ends with the four-cell tail `⟨ 󰠭` after model
quota: a purple left-pointing boundary and the static violet ladybug as Ramona's compact
avatar, with no trailing cell after her. The bounded tail keeps the avatar distinct
without producing a large empty region. Work progress, cost, MCP availability, runtime,
resources, and context are still published as bounded widget snapshots but are hidden
from the footer and consumed by the prompt rails. The renderer omits trailing rows that
contain no visible widgets, allowing the configured footer to occupy one terminal row
without changing the upstream two-row default. Non-growing widgets continue to honor
`minWidth` where configured.

The package is loaded from `./packages/pi-fancy-footer-full-palette` in `settings.json`.
Do not replace it with the npm package without first preserving the expanded
`FOOTER_WIDGET_COLORS` contract. Run the package tests and `/reload` after updates.
