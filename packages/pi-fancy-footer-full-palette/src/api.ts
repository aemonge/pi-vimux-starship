import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import type {
  FooterIconFamily,
  FooterWidgetAlign,
  FooterWidgetColor,
  FooterWidgetFill,
} from "./shared.ts";

export const FANCY_FOOTER_PROTOCOL_VERSION = 1 as const;
export const FANCY_FOOTER_WIDGET_CHANNEL = "pi-fancy-footer:widget";
export const FANCY_FOOTER_READY_CHANNEL = "pi-fancy-footer:ready";
export const FANCY_FOOTER_TELEMETRY_CHANNEL = "pi-vimux-starship:footer-telemetry/v1";

export interface FancyFooterTextContent {
  type: "text";
  text: string;
  /** Optional HTTP(S) destination for the complete rendered widget. */
  href?: string;
}

export interface FancyFooterDataWidgetIcon {
  glyphs: string | Partial<Record<FooterIconFamily, string>>;
  color?: FooterWidgetColor;
}

export interface FancyFooterDataWidgetStyle {
  textColor?: FooterWidgetColor;
  bold?: boolean;
}

export interface FancyFooterDataWidgetLayout {
  /**
   * Whether the widget is enabled by default. Opt-in widgets hide when their
   * text is empty.
   */
  enabled?: boolean;
  row?: number;
  position?: number;
  align?: FooterWidgetAlign;
  fill?: FooterWidgetFill;
  minWidth?: number;
}

export interface FancyFooterDataWidget {
  /** Namespaced ID such as `acme.status`. */
  id: string;
  label?: string;
  description?: string;
  content: FancyFooterTextContent;
  icon?: FancyFooterDataWidgetIcon | false;
  style?: FancyFooterDataWidgetStyle;
  layout?: FancyFooterDataWidgetLayout;
}

export type FancyFooterWidgetMessage =
  | {
      protocol: typeof FANCY_FOOTER_PROTOCOL_VERSION;
      type: "upsert";
      widget: FancyFooterDataWidget;
    }
  | {
      protocol: typeof FANCY_FOOTER_PROTOCOL_VERSION;
      type: "remove";
      id: string;
    };

export interface FancyFooterReadyMessage {
  protocol: typeof FANCY_FOOTER_PROTOCOL_VERSION;
  version: string;
}

export interface FancyFooterTelemetryMessage {
  protocol: typeof FANCY_FOOTER_PROTOCOL_VERSION;
  type: "snapshot";
  totalCost: number;
  quotaPercent?: number;
}

export interface FancyFooterClient {
  upsert(widget: FancyFooterDataWidget): void;
  remove(id: string): void;
  onReady(handler: (message: FancyFooterReadyMessage) => void): () => void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseFancyFooterTelemetry(
  value: unknown,
): FancyFooterTelemetryMessage | null {
  if (!isRecord(value) || value.protocol !== FANCY_FOOTER_PROTOCOL_VERSION) {
    return null;
  }
  if (value.type !== "snapshot") return null;
  const totalCost = Number(value.totalCost);
  if (!Number.isFinite(totalCost) || totalCost < 0) return null;
  if (value.quotaPercent === undefined) {
    return { protocol: FANCY_FOOTER_PROTOCOL_VERSION, type: "snapshot", totalCost };
  }
  const quotaPercent = Number(value.quotaPercent);
  if (!Number.isFinite(quotaPercent) || quotaPercent < 0 || quotaPercent > 100) {
    return null;
  }
  return {
    protocol: FANCY_FOOTER_PROTOCOL_VERSION,
    type: "snapshot",
    totalCost,
    quotaPercent,
  };
}

/** Create a typed client over the same import-free event-bus protocol. */
export function createFancyFooterClient(pi: ExtensionAPI): FancyFooterClient {
  return {
    upsert: (widget) => {
      const message: FancyFooterWidgetMessage = {
        protocol: FANCY_FOOTER_PROTOCOL_VERSION,
        type: "upsert",
        widget,
      };
      pi.events.emit(FANCY_FOOTER_WIDGET_CHANNEL, message);
    },
    remove: (id) => {
      const message: FancyFooterWidgetMessage = {
        protocol: FANCY_FOOTER_PROTOCOL_VERSION,
        type: "remove",
        id,
      };
      pi.events.emit(FANCY_FOOTER_WIDGET_CHANNEL, message);
    },
    onReady: (handler) =>
      pi.events.on(FANCY_FOOTER_READY_CHANNEL, (raw) => {
        if (
          !isRecord(raw) ||
          raw.protocol !== FANCY_FOOTER_PROTOCOL_VERSION ||
          typeof raw.version !== "string"
        ) {
          return;
        }
        handler(raw as unknown as FancyFooterReadyMessage);
      }),
  };
}

export type {
  FooterIconFamily,
  FooterWidgetAlign,
  FooterWidgetColor,
  FooterWidgetFill,
} from "./shared.ts";
