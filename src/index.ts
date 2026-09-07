import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';

import galacticaContextHeader from '../packages/galactica-context-header/index.js';
import galacticaStatus from '../packages/galactica-status/index.js';
import fancyFooter from '../packages/pi-fancy-footer-full-palette/src/index.js';
import piVim from '../packages/pi-vim-top-border/index.js';

export const COCKPIT_SURFACES = {
  footer: 'telemetry',
  contextHeader: 'deck',
  vim: 'editor-only',
} as const;

export const COCKPIT_COMPOSITION = [
  `fancy-footer:${COCKPIT_SURFACES.footer}`,
  'galactica-status:provider',
  `galactica-context-header:${COCKPIT_SURFACES.contextHeader}`,
  `pi-vim:${COCKPIT_SURFACES.vim}`,
] as const;

export default function piVimuxStarship(pi: ExtensionAPI): void {
  fancyFooter(pi, { surface: COCKPIT_SURFACES.footer });
  galacticaStatus(pi);
  galacticaContextHeader(pi, { surface: COCKPIT_SURFACES.contextHeader });
  piVim(pi, { surface: COCKPIT_SURFACES.vim });
}
