import { truncateToWidth, visibleWidth } from '@earendil-works/pi-tui';
import { getLineGraphemes } from './motions.js';

export const MODE_ICONS = {
  insert: '󰏫',
  normal: '󰆾',
  visual: '󰒅',
  ex: '󰆍',
} as const;

export function formatModeLabel(icon: string, pending = ''): string {
  return pending ? ` ${icon} ${pending}_ ` : ` ${icon} `;
}

// Mode-label fitting for the editor border. Pure, grapheme-aware string
// functions shrink icon and pending-command labels to a target width without
// splitting a grapheme. The `render()` path composes the raw label from editor
// state and then fits it here.

// Take as many trailing graphemes of `rawLabel` as fit within `width`,
// measuring by visible width so wide/combining graphemes are never split.
export function takeModeLabelSuffix(rawLabel: string, width: number): string {
  if (width <= 0) return '';

  const graphemes = getLineGraphemes(rawLabel);
  const suffix: string[] = [];
  let usedWidth = 0;

  for (let i = graphemes.length - 1; i >= 0; i--) {
    const grapheme = graphemes[i];
    if (!grapheme) continue;

    const segment = rawLabel.slice(grapheme.start, grapheme.end);
    const segmentWidth = visibleWidth(segment);
    if (usedWidth + segmentWidth > width) break;
    suffix.push(segment);
    usedWidth += segmentWidth;
  }

  return suffix.reverse().join('');
}

// Fit `rawLabel` into `width`. When it overflows, keep the leading mode
// keyword (` INSERT `/` NORMAL `/` EX `) plus an ellipsis and as much of the
// pending-command tail as fits; fall back to a plain right-truncation when
// there is no recognizable keyword or no room for the keyword itself.
export function fitModeLabel(rawLabel: string, width: number): string {
  if (visibleWidth(rawLabel) <= width) return rawLabel;

  const prefix =
    Object.values(MODE_ICONS)
      .map((icon) => formatModeLabel(icon))
      .find((candidate) => rawLabel.startsWith(candidate)) ?? '';

  if (!prefix || visibleWidth(prefix) >= width) {
    return truncateToWidth(rawLabel, width, '');
  }

  const suffixWidth = width - visibleWidth(prefix) - 1;
  if (suffixWidth <= 0) return `${prefix}…`;
  return `${prefix}…${takeModeLabelSuffix(rawLabel, suffixWidth)}`;
}
