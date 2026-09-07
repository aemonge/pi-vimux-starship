import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';

import galacticaContextHeader from '../packages/galactica-context-header/index.js';
import galacticaStatus from '../packages/galactica-status/index.js';
import fancyFooter from '../packages/pi-fancy-footer-full-palette/src/index.js';
import piVim from '../packages/pi-vim-top-border/index.js';

export const COCKPIT_COMPOSITION = [
  'fancy-footer:telemetry',
  'galactica-status:provider',
  'galactica-context-header:deck',
  'pi-vim:rails',
] as const;

export default function piVimuxStarship(pi: ExtensionAPI): void {
  fancyFooter(pi, { surface: 'telemetry' });
  galacticaStatus(pi);
  galacticaContextHeader(pi, { surface: 'deck' });
  piVim(pi);
}
