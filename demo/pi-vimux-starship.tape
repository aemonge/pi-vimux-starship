# Run from the pi-vimux-starship repository root.
# Requires Pi, npm, and VHS; the recording installs the published package
# into an isolated throwaway HOME, so it never touches real settings,
# sessions, providers, or the private editor bridge.

Output docs/assets/pi-vimux-starship.gif

Set Shell "bash"
Set Theme "Gruvbox Light"
Set Width 1400
Set Height 520
Set Padding 20
Set FontSize 24
Set TypingSpeed 35ms
Set Framerate 30
Set PlaybackSpeed 1

# Simulate a fresh machine: everything installs into a throwaway HOME with a
# user-local npm prefix. Keep the environment setup out of the recording.
Hide
Type "export DEMO_HOME=$(mktemp -d) && export HOME=$DEMO_HOME && export NPM_CONFIG_PREFIX=$HOME/.npm-global && export PATH=$NPM_CONFIG_PREFIX/bin:$PATH && clear"
Enter
Wait
Show

# Install the published CLI from the registry and flash the live board.
Type "npm install -g @aemonge-dev/pi-vimux-starship"
Enter
Hide
Wait+Screen /added \d+ packages/
Sleep 1s
Show
Type "pi-agents"
Enter
Wait+Screen /command center/
Sleep 3s
Ctrl+C
Sleep 1s

# Install the cockpit through Pi's package manager.
Type "pi install npm:@aemonge-dev/pi-vimux-starship"
Enter
Hide
Wait+Screen /Installed npm:@aemonge-dev\/pi-vimux-starship/
Sleep 1s
Show

# Launch a clean cockpit session from the fresh install.
Type "clear && pi --offline --no-session --no-context-files --tui-mode regular"
Enter
Hide
Wait+Screen /waiting/
Show
Sleep 4s

# Exercise a real ephemeral title change without creating a session.
Type ":name Public cockpit demo"
Enter
Wait+Screen /Public cockpit demo/
Sleep 3s

# Dispatch the credential-free health report through Pi Vim's Normal-mode EX bridge.
Type ":vimux-health"
Enter
Wait+Screen /pi-vimux-starship health/
Sleep 5s
