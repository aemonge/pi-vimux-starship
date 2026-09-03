# Idea: Make the Pi cockpit independently reusable

Pi Vim editing and the surrounding cockpit should live as one independently versioned
package rather than a Galactica-only assembly. A user should be able to install one
package and receive the coherent lifecycle header, prompt rails, responsive footer,
modal editor, and bounded optional integrations that have already been shaped together.

The package name is `pi-vimux-starship`: “vimux” joins the Vim interaction language with
tmux-inspired terminal navigation, while “starship” names the integrated command-deck
experience rather than a dependency on `starship.rs`.

The package must preserve the validated information architecture and privacy boundary.
Narrative work stays in the header; immediate controls and bounded telemetry stay on the
prompt rails; compact project, model, provider, and resource state stays in the footer.
Raw prompts, generated prose, tool inputs, child output, credentials, clipboard content,
hidden reasoning, and unintended paths never enter status surfaces.

The reusable design remains modular. Core behavior must fail soft without Git, OpenSpec,
Taskflow, Devbox, Nerd Fonts, Neovim, or tmux. Pi core remains the API authority;
`pi-vim` and the local Fancy Footer fork retain their licenses and provenance. External
Insert routing, transcript navigation, public configuration, broader platform support,
and publication are separate Human-validatable Plans rather than hidden additions to
package extraction.
