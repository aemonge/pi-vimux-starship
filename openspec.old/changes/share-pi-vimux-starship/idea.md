# Idea: Make the Pi cockpit independently reusable

Pi Vim editing and the surrounding cockpit should live as one independently versioned
package rather than a Galactica-only assembly. A user should be able to install one
package and receive the Human-validated rich lifecycle and telemetry deck composed
directly above the modal editor, plus bounded optional integrations.

The package name is `pi-vimux-starship`: “vimux” joins the Vim interaction language with
tmux-inspired terminal navigation, while “starship” names the integrated command-deck
experience rather than a dependency on `starship.rs`.

The package must preserve the validated information architecture and privacy boundary.
Narrative work, selected progress, project state, model state, provider telemetry, and
bounded resources stay in the rich deck. In the consolidated cockpit, Neovim owns prompt
composition while the focused zero-row Pi Vim surface retains Normal/Visual commands and
places its live mode icon on the deck's bottom separator. Raw prompts, generated prose,
tool inputs, child output, credentials, clipboard content, hidden reasoning, and
unintended paths never enter status surfaces.

The reusable design remains modular. Core behavior must fail soft without Git, OpenSpec,
Taskflow, Devbox, Nerd Fonts, Neovim, or tmux. Pi core remains the API authority;
`pi-vim` and the local Fancy Footer fork retain their licenses and provenance. The
external-editor-only consolidated surface is one explicit value slice; transcript
navigation, package-wide public configuration, theming, broader platform support, and
publication require separate concrete Human-validatable value rather than hidden
additions to package extraction.
