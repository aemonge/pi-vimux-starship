import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';

import galacticaContextHeader from '../packages/header/index.js';
import galacticaStatus from '../packages/status/index.js';
import cockpitTelemetry from '../packages/cockpit-telemetry/index.js';
import fancyFooter from '../packages/pi-fancy-footer-full-palette/src/index.js';
import { registerVimuxHealth } from './health.js';
import { registerPiStatus } from './pi-status.js';

export const COCKPIT_SURFACES = {
  footer: 'telemetry',
  contextHeader: 'deck',
} as const;

export const COCKPIT_COMPOSITION = [
  `fancy-footer:${COCKPIT_SURFACES.footer}`,
  'galactica-status:provider',
  `galactica-context-header:${COCKPIT_SURFACES.contextHeader}`,
  'cockpit-telemetry:sink',
] as const;

export default function piVimuxStarship(pi: ExtensionAPI): void {
  registerPiStatus(pi);
  fancyFooter(pi, { surface: COCKPIT_SURFACES.footer });
  galacticaStatus(pi);
  galacticaContextHeader(pi, {
    surface: COCKPIT_SURFACES.contextHeader,
  });
  cockpitTelemetry(pi);
  registerVimuxHealth(pi);
}
