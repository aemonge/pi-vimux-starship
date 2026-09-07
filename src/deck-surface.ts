import type { Theme } from '@earendil-works/pi-coding-agent';

export type DeckRenderer = (width: number, theme: Theme) => string[];

export interface CockpitDeckSurface {
  setRenderer(renderer: DeckRenderer | null): void;
  setRequestRender(requestRender: (() => void) | null): void;
  requestRender(): void;
  render(width: number, theme: Theme): string[];
}

export function createCockpitDeckSurface(): CockpitDeckSurface {
  let renderer: DeckRenderer | null = null;
  let requestRender: (() => void) | null = null;

  return {
    setRenderer(next) {
      renderer = next;
      requestRender?.();
    },
    setRequestRender(next) {
      requestRender = next;
      if (renderer && requestRender) requestRender();
    },
    requestRender() {
      requestRender?.();
    },
    render(width, theme) {
      if (!renderer || width <= 0) return [];
      try {
        return renderer(width, theme);
      } catch {
        return [];
      }
    },
  };
}
