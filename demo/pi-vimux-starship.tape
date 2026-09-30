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

# Simulate a fresh machine: everything installs into a fixed throwaway HOME
# under /tmp with a user-local npm prefix. The path is wiped at the start of
# every run, so failed renders never accumulate. The real npm download cache
# stays attached so the recording does not stall on a cold cache. Keep setup
# out of the recording.
Hide
Type "export DEMO_HOME=/tmp/pi-vimux-demo && rm -rf $DEMO_HOME && mkdir -p $DEMO_HOME && export NPM_CACHE_KEEP=$HOME/.npm && export HOME=$DEMO_HOME && export NPM_CONFIG_PREFIX=$HOME/.npm-global && export npm_config_cache=$NPM_CACHE_KEEP && export PATH=$NPM_CONFIG_PREFIX/bin:$PATH && clear"
Enter
Wait
Show

# Install the published CLI from the registry and print the board once.
# Long work sleeps hidden; the visible Wait commands then match instantly
# against output that is already on screen — nothing races the recording.
Type "npm install -g @aemonge-dev/pi-vimux-starship"
Enter
Hide
Sleep 75s
Show
Wait+Screen@30s /added \d+ packages/
Sleep 1s
Type "pi-agents --once"
Enter
Wait+Screen@30s /command center/
Sleep 3s

# Install the cockpit through Pi's package manager.
Type "pi install npm:@aemonge-dev/pi-vimux-starship"
Enter
Hide
Sleep 15s
Show
Wait+Screen@30s /Installed npm:@aemonge-dev\/pi-vimux-starship/
Sleep 1s

# Launch a clean cockpit session from the fresh install.
Type "clear && pi --offline --no-session --no-context-files --tui-mode regular"
Enter
Hide
Sleep 12s
Show
Wait+Screen@60s /waiting/
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
