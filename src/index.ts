import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';

import galacticaContextHeader from '../packages/galactica-context-header/index.js';
import galacticaStatus from '../packages/galactica-status/index.js';
import fancyFooter from '../packages/pi-fancy-footer-full-palette/src/index.js';
import piVim from '../packages/pi-vim-top-border/index.js';
import { createCockpitDeckSurface } from './deck-surface.js';
import { registerVimuxHealth } from './health.js';
import { registerPiStatus } from './pi-status.js';

export const COCKPIT_SURFACES = {
  footer: 'telemetry',
  contextHeader: 'editor-deck',
  vim: 'external-editor-only',
} as const;

export const COCKPIT_COMPOSITION = [
  `fancy-footer:${COCKPIT_SURFACES.footer}`,
  'galactica-status:provider',
  `galactica-context-header:${COCKPIT_SURFACES.contextHeader}`,
  `pi-vim:${COCKPIT_SURFACES.vim}`,
] as const;

export default function piVimuxStarship(pi: ExtensionAPI): void {
  const deckSurface = createCockpitDeckSurface();
  registerPiStatus(pi);
  fancyFooter(pi, { surface: COCKPIT_SURFACES.footer });
  galacticaStatus(pi);
  galacticaContextHeader(pi, {
    surface: COCKPIT_SURFACES.contextHeader,
    deckSurface,
  });
  piVim(pi, { surface: COCKPIT_SURFACES.vim, deckSurface });
  registerVimuxHealth(pi);
}
