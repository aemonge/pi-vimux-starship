import assert from "node:assert/strict";
import test from "node:test";
import { visibleWidth } from "@earendil-works/pi-tui";
import {
  formatCompactCost,
  providerQuotaBatteryGlyph,
  renderFooterLines,
} from "./render.ts";
import type { NormalizedFancyFooterDataWidget } from "./data-widgets.ts";
import { parseCodexRateLimitHeaders } from "./provider-status.ts";
import {
  DEFAULT_FOOTER_CONFIG,
  EMPTY_GIT_INFO,
  FOOTER_WIDGET_IDS,
  FOOTER_WIDGET_META,
  type FooterConfigSnapshot,
  type ProviderStatusSnapshot,
  type SessionUsageMetrics,
} from "./shared.ts";

const theme = {
  fg: (_color: string, text: string) => text,
  getColorMode: () => "truecolor" as const,
};

const usageMetrics: SessionUsageMetrics = {
  latest: undefined,
  totalCost: 0,
  totalCacheRead: 0,
  totalCacheWrite: 0,
};

const providerStatus: ProviderStatusSnapshot = {
  provider: "openai-codex",
  source: "headers",
  fetchedAt: "2026-05-06T10:00:00Z",
  state: "ok",
  primary: {
    label: "5h",
    leftPercent: 95,
    usedPercent: 5,
  },
};

const claudeProviderStatus: ProviderStatusSnapshot = {
  provider: "anthropic",
  source: "api",
  fetchedAt: "2026-06-16T10:00:00Z",
  state: "ok",
  primary: {
    label: "5h",
    leftPercent: 100,
    usedPercent: 0,
  },
  secondary: {
    label: "7d",
    leftPercent: 92,
    usedPercent: 8,
  },
};

const footerConfig: FooterConfigSnapshot = {
  ...DEFAULT_FOOTER_CONFIG,
  iconFamily: "ascii",
  providerStatus: {
    ...DEFAULT_FOOTER_CONFIG.providerStatus,
    display: "text",
  },
  widgets: {
    "context-bar": { enabled: false },
    "context-capacity": { enabled: false },
    location: { enabled: false },
  },
};

const agentWidgets: NormalizedFancyFooterDataWidget[] = [
  {
    id: "pi-agents.workflows",
    label: "Active workflows",
    description: "Shows active workflow executions.",
    content: {
      type: "text",
      text: "2",
      href: "https://example.com/workflows",
    },
    icon: { glyphs: "❖", color: "accent" },
    defaults: {
      enabled: false,
      row: 1,
      position: 9,
      align: "right",
      fill: "none",
    },
  },
  {
    id: "pi-agents.agents",
    label: "Agent progress",
    description: "Shows completed and total agents.",
    content: { type: "text", text: "1/3" },
    icon: { glyphs: "✦", color: "success" },
    defaults: {
      enabled: false,
      row: 1,
      position: 10,
      align: "right",
      fill: "none",
    },
  },
];

function contextWithModel(
  model: { id: string; name: string; provider?: string },
  usage: {
    contextWindow: number;
    tokens: number | null;
    percent: number | null;
  } = { contextWindow: 200_000, tokens: 0, percent: 0 },
) {
  return {
    cwd: "/repo",
    model,
    getContextUsage: () => usage,
    sessionManager: {
      getBranch: () => [],
    },
  };
}

test("renderFooterLines collapses to one row when every visible widget is on row zero", () => {
  const oneRowWidget: NormalizedFancyFooterDataWidget = {
    id: "galactica.location",
    label: "Location",
    description: "Location",
    content: { type: "text", text: "~/galactica" },
    icon: { glyphs: { ascii: "D" }, color: "accent" },
    defaults: { row: 0, position: 0, align: "left", fill: "none" },
  };
  const config: FooterConfigSnapshot = {
    ...footerConfig,
    widgets: Object.fromEntries(
      FOOTER_WIDGET_IDS.map((id) => [id, { enabled: false }]),
    ),
    extensionWidgets: { "galactica.location": { enabled: true } },
  };

  const lines = renderFooterLines(
    120,
    contextWithModel({ id: "gpt-5", name: "GPT-5" }) as never,
    EMPTY_GIT_INFO,
    "off",
    theme as never,
    usageMetrics,
    config,
    [oneRowWidget],
  );

  assert.deepEqual(lines, ["D ~/galactica"]);
});

test("renderFooterLines aligns wide right content before the Ramona avatar slot", () => {
  const widgets: NormalizedFancyFooterDataWidget[] = [
    {
      id: "galactica.location",
      label: "Location",
      description: "Location",
      content: { type: "text", text: "~/galactica" },
      icon: false,
      defaults: { row: 0, position: 0, align: "left", fill: "none" },
    },
    {
      id: "galactica.agent-environment",
      label: "Model",
      description: "Model",
      content: { type: "text", text: "󰚩 GPT-5.6 Sol › high ›  19%" },
      icon: false,
      defaults: { row: 0, position: 0, align: "right", fill: "none" },
    },
  ];
  const config: FooterConfigSnapshot = {
    ...footerConfig,
    widgets: Object.fromEntries(
      FOOTER_WIDGET_IDS.map((id) => [id, { enabled: false }]),
    ),
    extensionWidgets: {
      "galactica.location": { enabled: true },
      "galactica.agent-environment": { enabled: true },
    },
  };
  const colors: string[] = [];
  const avatarTheme = {
    fg: (color: string, text: string) => {
      colors.push(`${color}:${text}`);
      return text;
    },
    getColorMode: () => "truecolor" as const,
  };

  const [line = ""] = renderFooterLines(
    100,
    contextWithModel({ id: "gpt-5", name: "GPT-5" }) as never,
    EMPTY_GIT_INFO,
    "off",
    avatarTheme as never,
    usageMetrics,
    config,
    widgets,
  );

  assert.equal(visibleWidth(line), 100);
  assert.equal(line.indexOf("󰚩"), 68);
  assert.match(line, / 19% ⟨ 󰠭$/u);
  assert.equal(line.endsWith("󰠭"), true);
  assert.ok(colors.includes("thinkingHigh:⟨"));
  assert.ok(colors.includes("customMessageLabel:󰠭"));
});

test("renderFooterLines renders max thinking with the default text color", () => {
  const colors: string[] = [];
  const coloredTheme = {
    fg: (color: string, text: string) => {
      colors.push(`${color}:${text}`);
      return text;
    },
    getColorMode: () => "truecolor" as const,
  };

  const lines = renderFooterLines(
    120,
    contextWithModel({
      provider: "anthropic",
      id: "claude-sonnet-4",
      name: "Claude Sonnet 4",
    }) as never,
    EMPTY_GIT_INFO,
    "max",
    coloredTheme as never,
    usageMetrics,
    footerConfig,
  );

  assert.match(lines.join("\n"), /\? max/);
  assert.ok(colors.includes("dim:max"));
  assert.equal(colors.includes("thinkingMax:max"), false);
});

test("data widgets honor default visibility and user color overrides", () => {
  const colors: string[] = [];
  const coloredTheme = {
    fg: (color: string, text: string) => {
      colors.push(`${color}:${text}`);
      return text;
    },
    getColorMode: () => "truecolor" as const,
  };
  const disabledLines = renderFooterLines(
    160,
    contextWithModel({ id: "gpt-5", name: "GPT-5" }) as never,
    EMPTY_GIT_INFO,
    "off",
    coloredTheme as never,
    usageMetrics,
    footerConfig,
    agentWidgets,
  );
  assert.doesNotMatch(disabledLines.join("\n"), /❖ 2|✦ 1\/3/);

  colors.length = 0;
  const enabledConfig: FooterConfigSnapshot = {
    ...footerConfig,
    extensionWidgets: {
      "pi-agents.workflows": {
        enabled: true,
        iconColor: "success",
        textColor: "warning",
      },
      "pi-agents.agents": { enabled: true },
    },
  };
  const enabledLines = renderFooterLines(
    160,
    contextWithModel({ id: "gpt-5", name: "GPT-5" }) as never,
    EMPTY_GIT_INFO,
    "off",
    coloredTheme as never,
    usageMetrics,
    enabledConfig,
    agentWidgets,
  );
  assert.match(enabledLines.join("\n"), /❖ 2.*✦ 1\/3/);
  assert.match(
    enabledLines.join("\n"),
    /\u001b\]8;;https:\/\/example\.com\/workflows\u0007❖ 2\u001b\]8;;\u0007/,
  );
  assert.ok(colors.includes("success:❖"));
  assert.ok(colors.includes("warning:2"));
  assert.ok(colors.includes("success:✦"));
});

test("data widgets can render bold text through the protocol style", () => {
  const calls: string[] = [];
  const boldTheme = {
    fg: (color: string, text: string) => {
      calls.push(`fg:${color}:${text}`);
      return text;
    },
    bold: (text: string) => {
      calls.push(`bold:${text}`);
      return `<b>${text}</b>`;
    },
    getColorMode: () => "truecolor" as const,
  };
  const widget: NormalizedFancyFooterDataWidget = {
    id: "galactica.location",
    label: "Working directory",
    description: "Current working directory",
    content: { type: "text", text: "~/project" },
    preferredTextColor: "accent",
    bold: true,
    defaults: {
      row: 0,
      position: 0,
      align: "left",
      fill: "none",
    },
  };

  const lines = renderFooterLines(
    120,
    contextWithModel({ id: "gpt-5", name: "GPT-5" }) as never,
    EMPTY_GIT_INFO,
    "off",
    boldTheme as never,
    usageMetrics,
    footerConfig,
    [widget],
  );

  assert.match(lines.join("\n"), /<b>~\/project<\/b>/);
  assert.ok(calls.includes("bold:~/project"));
  assert.ok(calls.includes("fg:accent:<b>~/project</b>"));
});

test("left footer groups bold PWD, OpenSpec progress, and Git with exact separators", () => {
  const colors: string[] = [];
  const groupedTheme = {
    fg: (color: string, text: string) => {
      colors.push(`${color}:${text}`);
      return text;
    },
    bold: (text: string) => `<b>${text}</b>`,
    getColorMode: () => "truecolor" as const,
  };
  const widgets: NormalizedFancyFooterDataWidget[] = [
    {
      id: "galactica.location",
      label: "Working directory",
      description: "Current working directory",
      content: { type: "text", text: "~/usr" },
      icon: { glyphs: { nerd: "" }, color: "accent" },
      preferredTextColor: "accent",
      bold: true,
      defaults: { row: 0, position: 0, align: "left", fill: "none" },
    },
    {
      id: "galactica.openspec-scope-separator",
      label: "OpenSpec separator",
      description: "OpenSpec separator",
      content: { type: "text", text: "⟩" },
      preferredTextColor: "thinkingHigh",
      defaults: { row: 0, position: 7, align: "left", fill: "none" },
    },
    {
      id: "galactica.openspec-progress",
      label: "OpenSpec progress",
      description: "Plan and Task progress",
      content: { type: "text", text: "1/3 ›  2/5" },
      icon: { glyphs: { nerd: "" }, color: "accent" },
      defaults: { row: 0, position: 8, align: "left", fill: "none" },
    },
    {
      id: "galactica.git-scope-separator",
      label: "Git separator",
      description: "Git separator",
      content: { type: "text", text: "›" },
      preferredTextColor: "accent",
      defaults: { row: 0, position: 1, align: "left", fill: "none" },
    },
    {
      id: "galactica.git-branch",
      label: "Git branch",
      description: "Git branch",
      content: { type: "text", text: "main" },
      icon: { glyphs: { nerd: "" }, color: "success" },
      preferredTextColor: "success",
      defaults: { row: 0, position: 2, align: "left", fill: "none" },
    },
  ];
  const lines = renderFooterLines(
    160,
    contextWithModel({ id: "gpt-5", name: "GPT-5" }) as never,
    EMPTY_GIT_INFO,
    "off",
    groupedTheme as never,
    usageMetrics,
    {
      ...footerConfig,
      iconFamily: "nerd",
      extensionWidgets: Object.fromEntries(
        widgets.map((widget) => [widget.id, { enabled: true }]),
      ),
    },
    widgets,
  );

  assert.match(lines[0] ?? "", / <b>~\/usr<\/b> ›  main ⟩  1\/3 ›  2\/5/u);
  assert.equal(colors.filter((call) => call === "thinkingHigh:⟩").length, 1);
  assert.ok(colors.includes("accent:›"));
});

test("row one attaches responsive MCP availability after PWD and Git with OpenSpec right", () => {
  const widgets: NormalizedFancyFooterDataWidget[] = [
    {
      id: "galactica.location",
      label: "Working directory",
      description: "Current working directory",
      content: { type: "text", text: "~/galactica" },
      icon: { glyphs: { nerd: "" }, color: "accent" },
      defaults: { row: 0, position: 0, align: "left", fill: "grow", minWidth: 12 },
    },
    {
      id: "galactica.git-scope-separator",
      label: "Git separator",
      description: "Git separator",
      content: { type: "text", text: "" },
      defaults: { row: 0, position: 1, align: "left", fill: "none" },
    },
    {
      id: "galactica.git-branch",
      label: "Git branch",
      description: "Git branch",
      content: { type: "text", text: "(no Git)" },
      icon: { glyphs: { nerd: "› " }, color: "dim" },
      defaults: { row: 0, position: 2, align: "left", fill: "grow", minWidth: 0 },
    },
    {
      id: "galactica.project-capabilities",
      label: "MCP availability",
      description: "Available MCP servers",
      content: { type: "text", text: "1/1" },
      icon: { glyphs: { nerd: "" }, color: "accent" },
      defaults: { row: 0, position: 7, align: "left", fill: "grow", minWidth: 0 },
    },
    {
      id: "galactica.openspec-progress",
      label: "OpenSpec progress",
      description: "Plan and Task progress",
      content: { type: "text", text: "9/19 ›  48/64" },
      icon: { glyphs: { nerd: "" }, color: "accent" },
      defaults: { row: 0, position: 0, align: "right", fill: "none" },
    },
  ];
  const lines = renderFooterLines(
    140,
    contextWithModel({ id: "gpt-5", name: "GPT-5" }) as never,
    EMPTY_GIT_INFO,
    "off",
    theme as never,
    { ...usageMetrics, totalCost: 25.19 },
    {
      ...footerConfig,
      iconFamily: "nerd",
      widgets: {
        ...footerConfig.widgets,
        "total-cost": {
          enabled: true,
          row: 0,
          position: 1,
          align: "right",
          icon: "hide",
        },
      },
      extensionWidgets: Object.fromEntries(
        widgets.map((widget) => [widget.id, { enabled: true }]),
      ),
    },
    widgets,
  );

  assert.match(
    lines[0] ?? "",
    /^ ~\/galactica ›  \(no Git\)  1\/1\s{4,} 9\/19 ›  48\/64 ⟩ \$25\.19$/u,
  );
});

test("flexible left labels preserve the complete right group and a visible split", () => {
  const widgets: NormalizedFancyFooterDataWidget[] = [
    {
      id: "test.location",
      label: "Test location",
      description: "Fixed left project identity",
      content: { type: "text", text: "PROJECT" },
      icon: { glyphs: { ascii: "L" }, color: "accent" },
      defaults: { row: 0, position: 0, align: "left", fill: "none" },
    },
    {
      id: "test.branch",
      label: "Test branch",
      description: "Responsive left branch identity",
      content: { type: "text", text: "f/persist-versioned-prompts..." },
      icon: { glyphs: { ascii: "B" }, color: "success" },
      defaults: {
        row: 0,
        position: 1,
        align: "left",
        fill: "grow",
        minWidth: 12,
      },
    },
    {
      id: "test.telemetry",
      label: "Test telemetry",
      description: "Fixed right telemetry",
      content: { type: "text", text: "RIGHT-TELEMETRY" },
      defaults: { row: 0, position: 0, align: "right", fill: "none" },
    },
  ];
  const lines = renderFooterLines(
    45,
    contextWithModel({ id: "gpt-5", name: "GPT-5" }) as never,
    EMPTY_GIT_INFO,
    "off",
    theme as never,
    usageMetrics,
    {
      ...footerConfig,
      iconFamily: "ascii",
      widgets: Object.fromEntries(
        Object.keys(FOOTER_WIDGET_META).map((id) => [id, { enabled: false }]),
      ),
      extensionWidgets: Object.fromEntries(
        widgets.map((widget) => [widget.id, { enabled: true }]),
      ),
    },
    widgets,
  );

  const line = lines[0] ?? "";
  const plain = line.replace(/\u001b\[[0-?]*[ -/]*[@-~]/gu, "");
  assert.equal(visibleWidth(line), 45);
  assert.ok(plain.endsWith("RIGHT-TELEMETRY"));
  assert.match(plain, /B f\/persist-v\.\.\./u);
  const rightStart = plain.indexOf("RIGHT-TELEMETRY");
  assert.ok(rightStart > 0);
  assert.ok((plain.slice(0, rightStart).match(/ +$/u)?.[0].length ?? 0) >= 4);
});

test("second footer row scopes runtime, LLM, resources, and context", () => {
  const widgets: NormalizedFancyFooterDataWidget[] = [
    {
      id: "galactica.runtime-state",
      label: "Runtime",
      description: "Runtime activity age",
      content: { type: "text", text: "25ms" },
      defaults: {
        row: 1,
        position: 4,
        align: "left",
        fill: "none",
        minWidth: 6,
      },
    },
    {
      id: "galactica.runtime-scope-separator",
      label: "Runtime boundary",
      description: "Runtime boundary",
      content: { type: "text", text: "⟩" },
      defaults: { row: 1, position: 3, align: "left", fill: "none" },
    },
    {
      id: "galactica.agent-environment",
      label: "LLM",
      description: "Active LLM",
      content: { type: "text", text: "GPT-5.6 Sol" },
      icon: { glyphs: { nerd: "󰚩" }, color: "borderAccent" },
      defaults: { row: 1, position: 0, align: "left", fill: "none" },
    },
    {
      id: "galactica.reasoning-effort",
      label: "Variant",
      description: "Reasoning variant",
      content: { type: "text", text: "› high" },
      defaults: { row: 1, position: 1, align: "left", fill: "none" },
    },
    {
      id: "galactica.context-usage",
      label: "Context",
      description: "Context usage",
      content: { type: "text", text: "82.7%" },
      icon: { glyphs: { nerd: "󰾆" }, color: "accent" },
      defaults: { row: 1, position: 9, align: "right", fill: "none" },
    },
    {
      id: "galactica.compaction-count",
      label: "Summary",
      description: "Compaction count",
      content: { type: "text", text: "2" },
      icon: { glyphs: { nerd: "› 󰎞" }, color: "accent" },
      defaults: { row: 1, position: 10, align: "right", fill: "none" },
    },
    {
      id: "galactica.resource-separator",
      label: "Resource separator",
      description: "Resource separator",
      content: { type: "text", text: "⟩" },
      preferredTextColor: "thinkingHigh",
      defaults: { row: 1, position: 8, align: "right", fill: "none" },
    },
    {
      id: "galactica.session-memory",
      label: "RAM",
      description: "Session RAM",
      content: { type: "text", text: "336M" },
      icon: { glyphs: { nerd: "▤" }, color: "accent" },
      defaults: { row: 1, position: 6, align: "right", fill: "none" },
    },
    {
      id: "galactica.session-cpu",
      label: "CPU",
      description: "Session CPU",
      content: { type: "text", text: "3%" },
      icon: { glyphs: { nerd: "› " }, color: "accent" },
      defaults: { row: 1, position: 7, align: "right", fill: "none" },
    },
  ];
  const config: FooterConfigSnapshot = {
    ...footerConfig,
    iconFamily: "nerd",
    widgets: {
      ...footerConfig.widgets,
      model: { enabled: false },
      "total-cost": { enabled: false },
    },
    extensionWidgets: Object.fromEntries(
      widgets.map((widget) => [widget.id, { enabled: true }]),
    ),
  };
  const render = () =>
    renderFooterLines(
      180,
      contextWithModel({ id: "gpt-5", name: "GPT-5" }) as never,
      EMPTY_GIT_INFO,
      "off",
      theme as never,
      usageMetrics,
      config,
      widgets,
    );

  const lines = render();
  assert.equal(lines[0], "");
  assert.match(lines[1] ?? "", /^󰚩 GPT-5\.6 Sol › high ⟩ 25ms\s+/u);
  assert.match(lines[1] ?? "", /▤ 336M ›  3% ⟩ 󰾆 82\.7% › 󰎞 2$/u);
  widgets[0]!.content.text = "12m34s";
  assert.match(render()[1] ?? "", /^󰚩 GPT-5\.6 Sol › high ⟩ 12m34s\s+/u);
});

test("enabled opt-in data widgets remain hidden without text", () => {
  const enabledConfig: FooterConfigSnapshot = {
    ...footerConfig,
    extensionWidgets: {
      "pi-agents.workflows": { enabled: true },
      "pi-agents.agents": { enabled: true },
    },
  };
  const emptyWidgets = agentWidgets.map((widget) => ({
    ...widget,
    content: { type: "text" as const, text: "" },
  }));

  const lines = renderFooterLines(
    160,
    contextWithModel({ id: "gpt-5", name: "GPT-5" }) as never,
    EMPTY_GIT_INFO,
    "off",
    theme as never,
    usageMetrics,
    enabledConfig,
    emptyWidgets,
  );

  assert.doesNotMatch(lines.join("\n"), /❖|✦|·/);
});

test("default-enabled data widgets render icons without text", () => {
  const widget = {
    ...agentWidgets[0]!,
    id: "pi-prs.ci",
    content: { type: "text" as const, text: "" },
    defaults: { ...agentWidgets[0]!.defaults, enabled: undefined },
  };

  const lines = renderFooterLines(
    160,
    contextWithModel({ id: "gpt-5", name: "GPT-5" }) as never,
    EMPTY_GIT_INFO,
    "off",
    theme as never,
    usageMetrics,
    footerConfig,
    [widget],
  );

  assert.match(lines.join("\n"), /❖/);
});

test("enabled data widgets remain hidden without text or an icon", () => {
  const widget = {
    ...agentWidgets[0]!,
    content: { type: "text" as const, text: "" },
    icon: false as const,
  };
  const config: FooterConfigSnapshot = {
    ...footerConfig,
    extensionWidgets: { [widget.id]: { enabled: true } },
  };

  const lines = renderFooterLines(
    160,
    contextWithModel({ id: "gpt-5", name: "GPT-5" }) as never,
    EMPTY_GIT_INFO,
    "off",
    theme as never,
    usageMetrics,
    config,
    [widget],
  );

  assert.doesNotMatch(lines.join("\n"), /❖|·/);
});

test("renderFooterLines omits the provider widget by default", () => {
  const lines = renderFooterLines(
    120,
    contextWithModel({
      provider: "openai-codex",
      id: "gpt-5.6-sol",
      name: "GPT-5.6 Sol",
    }) as never,
    EMPTY_GIT_INFO,
    "off",
    theme as never,
    usageMetrics,
    footerConfig,
    [],
    [],
  );

  assert.match(lines.join("\n"), /GPT-5\.6 Sol/);
  assert.doesNotMatch(lines.join("\n"), /openai-codex/);
});

test("renderFooterLines shows the provider display name once enabled", () => {
  const lines = renderFooterLines(
    120,
    {
      ...contextWithModel({
        provider: "openai-codex",
        id: "gpt-5.6-sol",
        name: "GPT-5.6 Sol",
      }),
      modelRegistry: {
        getProviderDisplayName: (provider: string) =>
          provider === "openai-codex" ? "OpenAI Codex" : provider,
      },
    } as never,
    EMPTY_GIT_INFO,
    "off",
    theme as never,
    usageMetrics,
    {
      ...footerConfig,
      widgets: { ...footerConfig.widgets, provider: { enabled: true } },
    },
    [],
    [],
  );

  assert.match(lines.join("\n"), /OpenAI Codex.*GPT-5\.6 Sol/);
});

test("renderFooterLines falls back to the provider id without a display name", () => {
  const lines = renderFooterLines(
    120,
    contextWithModel({
      provider: "my-proxy",
      id: "gpt-5.6-sol",
      name: "GPT-5.6 Sol",
    }) as never,
    EMPTY_GIT_INFO,
    "off",
    theme as never,
    usageMetrics,
    {
      ...footerConfig,
      widgets: { ...footerConfig.widgets, provider: { enabled: true } },
    },
    [],
    [],
  );

  assert.match(lines.join("\n"), /my-proxy.*GPT-5\.6 Sol/);
});

test("renderFooterLines hides the provider widget without a model", () => {
  const context = contextWithModel({ id: "", name: "" });
  const lines = renderFooterLines(
    120,
    { ...context, model: undefined } as never,
    EMPTY_GIT_INFO,
    "off",
    theme as never,
    usageMetrics,
    {
      ...footerConfig,
      widgets: { ...footerConfig.widgets, provider: { enabled: true } },
    },
    [],
    [],
  );

  assert.doesNotMatch(lines.join("\n"), /openai-codex/);
});

test("renderFooterLines hides Codex provider status for non-OpenAI models", () => {
  const lines = renderFooterLines(
    120,
    contextWithModel({
      provider: "anthropic",
      id: "claude-sonnet-4",
      name: "Claude Sonnet 4",
    }) as never,
    EMPTY_GIT_INFO,
    "off",
    theme as never,
    usageMetrics,
    footerConfig,
    [],
    [providerStatus],
  );

  assert.doesNotMatch(lines.join("\n"), /5h:5%/);
});

test("renderFooterLines shows Codex provider status for OpenAI models", () => {
  const lines = renderFooterLines(
    120,
    contextWithModel({
      provider: "openai",
      id: "gpt-5-codex",
      name: "GPT-5 Codex",
    }) as never,
    EMPTY_GIT_INFO,
    "off",
    theme as never,
    usageMetrics,
    footerConfig,
    [],
    [providerStatus],
  );

  assert.match(lines.join("\n"), /qta 5h:5%/);
});

test("provider quota battery depletes through five bounded usage states", () => {
  assert.equal(providerQuotaBatteryGlyph(0), "");
  assert.equal(providerQuotaBatteryGlyph(20), "");
  assert.equal(providerQuotaBatteryGlyph(21), "");
  assert.equal(providerQuotaBatteryGlyph(40), "");
  assert.equal(providerQuotaBatteryGlyph(41), "");
  assert.equal(providerQuotaBatteryGlyph(60), "");
  assert.equal(providerQuotaBatteryGlyph(61), "");
  assert.equal(providerQuotaBatteryGlyph(80), "");
  assert.equal(providerQuotaBatteryGlyph(81), "");
  assert.equal(providerQuotaBatteryGlyph(100), "");
  assert.equal(providerQuotaBatteryGlyph(Number.NaN), "");
});

test("renderFooterLines renders a compact provider quota percentage", () => {
  const compactConfig: FooterConfigSnapshot = {
    ...footerConfig,
    iconFamily: "nerd",
    providerStatus: { ...footerConfig.providerStatus, display: "percent" },
    widgets: {
      ...footerConfig.widgets,
      "provider-status": { icon: "hide" },
    },
  };
  const lines = renderFooterLines(
    120,
    contextWithModel({
      provider: "openai-codex",
      id: "gpt-5-codex",
      name: "GPT-5 Codex",
    }) as never,
    EMPTY_GIT_INFO,
    "off",
    theme as never,
    usageMetrics,
    compactConfig,
    [],
    [providerStatus],
  );

  assert.match(lines.join("\n"), /›  5%/);
  assert.doesNotMatch(lines.join("\n"), /qta|5h:|5% ⟩/);
});

test("renderFooterLines renders a weekly-only Codex quota gauge", () => {
  const weeklyOnlyProviderStatus: ProviderStatusSnapshot = {
    provider: "openai-codex",
    source: "api",
    fetchedAt: "2026-07-15T20:34:35Z",
    state: "ok",
    primary: {
      label: "7d",
      leftPercent: 84,
      usedPercent: 16,
    },
  };
  const gaugeConfig: FooterConfigSnapshot = {
    ...footerConfig,
    gaugeStyle: "parallelograms",
    providerStatus: {
      ...footerConfig.providerStatus,
      display: "gauge",
    },
  };

  const lines = renderFooterLines(
    120,
    contextWithModel({
      provider: "openai",
      id: "gpt-5-codex",
      name: "GPT-5 Codex",
    }) as never,
    EMPTY_GIT_INFO,
    "off",
    theme as never,
    usageMetrics,
    gaugeConfig,
    [],
    [weeklyOnlyProviderStatus],
  );

  assert.match(lines.join("\n"), /% qta 7d ▰▱▱▱▱ 16%/);
  assert.doesNotMatch(lines.join("\n"), /5h/);
});

test("renderFooterLines places reset countdowns beside matching gauges", () => {
  const nowMs = Date.parse("2026-06-16T10:00:00Z");
  const resetStatus: ProviderStatusSnapshot = {
    ...claudeProviderStatus,
    primary: {
      ...claudeProviderStatus.primary!,
      resetAt: (nowMs + (4 * 60 + 32) * 60_000) / 1000,
    },
    secondary: {
      ...claudeProviderStatus.secondary!,
      resetAt: (nowMs + (24 + 7) * 60 * 60_000) / 1000,
    },
  };
  const gaugeConfig: FooterConfigSnapshot = {
    ...footerConfig,
    gaugeStyle: "parallelograms",
    providerStatus: {
      ...footerConfig.providerStatus,
      display: "gauge",
      resetMinUsedPercent: 0,
    },
  };
  const ctx = contextWithModel({
    provider: "anthropic",
    id: "claude-sonnet-4",
    name: "Claude Sonnet 4",
  }) as never;
  const render = (showReset?: "off" | "primary" | "all") =>
    renderFooterLines(
      160,
      ctx,
      EMPTY_GIT_INFO,
      "off",
      theme as never,
      usageMetrics,
      {
        ...gaugeConfig,
        providerStatus:
          showReset === undefined
            ? gaugeConfig.providerStatus
            : { ...gaugeConfig.providerStatus, showReset },
      },
      [],
      [resetStatus],
      nowMs,
    ).join("\n");

  assert.match(render("primary"), /5h ▱▱▱▱▱ 0% ~4h32m 7d ▰▱▱▱▱ 8%(?! ~1d7h)/);
  assert.match(render(), /5h ▱▱▱▱▱ 0% ~4h32m 7d ▰▱▱▱▱ 8% ~1d7h/);
  assert.doesNotMatch(render("off"), /~(?:4h32m|1d7h)/);
});

test("renderFooterLines gates gauge countdowns by displayed usage", () => {
  const nowMs = Date.parse("2026-06-16T10:00:00Z");
  const status: ProviderStatusSnapshot = {
    ...claudeProviderStatus,
    primary: {
      label: "5h",
      usedPercent: 74.94,
      leftPercent: 25.06,
      resetAt: (nowMs + 60 * 60_000) / 1000,
    },
    secondary: {
      label: "7d",
      usedPercent: 80,
      leftPercent: 20,
      resetAt: (nowMs + 2 * 60 * 60_000) / 1000,
    },
  };
  const lines = renderFooterLines(
    160,
    contextWithModel({
      provider: "anthropic",
      id: "claude-sonnet-4",
      name: "Claude Sonnet 4",
    }) as never,
    EMPTY_GIT_INFO,
    "off",
    theme as never,
    usageMetrics,
    {
      ...footerConfig,
      gaugeStyle: "parallelograms",
      providerStatus: { ...footerConfig.providerStatus, display: "gauge" },
    },
    [],
    [status],
    nowMs,
  ).join("\n");

  assert.doesNotMatch(lines, /74\.9% ~\S+/);
  assert.match(lines, /80% ~2h/);
});

test("renderFooterLines renders gauge countdowns with the healthy gauge color", () => {
  const nowMs = Date.parse("2026-06-16T10:00:00Z");
  const colors: string[] = [];
  const coloredTheme = {
    fg: (color: string, text: string) => {
      colors.push(`${color}:${text}`);
      return text;
    },
    getColorMode: () => "truecolor" as const,
  };
  const status: ProviderStatusSnapshot = {
    ...claudeProviderStatus,
    primary: {
      ...claudeProviderStatus.primary!,
      resetAt: (nowMs + 2 * 60 * 60_000) / 1000,
    },
  };
  renderFooterLines(
    120,
    contextWithModel({
      provider: "anthropic",
      id: "claude-sonnet-4",
      name: "Claude Sonnet 4",
    }) as never,
    EMPTY_GIT_INFO,
    "off",
    coloredTheme as never,
    usageMetrics,
    {
      ...footerConfig,
      providerStatus: {
        ...footerConfig.providerStatus,
        display: "gauge",
        resetMinUsedPercent: 0,
      },
    },
    [],
    [status],
    nowMs,
  );

  assert.ok(colors.includes("accent: ~2h"));
});

test("renderFooterLines respects reset mode for secondary-only gauges", () => {
  const nowMs = Date.parse("2026-06-16T10:00:00Z");
  const secondaryOnly: ProviderStatusSnapshot = {
    provider: "anthropic",
    source: "api",
    fetchedAt: new Date(nowMs).toISOString(),
    state: "ok",
    secondary: {
      ...claudeProviderStatus.secondary!,
      usedPercent: 90,
      leftPercent: 10,
      resetAt: (nowMs + 5 * 24 * 60 * 60_000) / 1000,
    },
  };
  const ctx = contextWithModel({
    provider: "anthropic",
    id: "claude-sonnet-4",
    name: "Claude Sonnet 4",
  }) as never;
  const render = (showReset: "primary" | "all") =>
    renderFooterLines(
      120,
      ctx,
      EMPTY_GIT_INFO,
      "off",
      theme as never,
      usageMetrics,
      {
        ...footerConfig,
        providerStatus: {
          ...footerConfig.providerStatus,
          display: "gauge",
          showReset,
          resetMinUsedPercent: 75,
        },
      },
      [],
      [secondaryOnly],
      nowMs,
    ).join("\n");

  assert.doesNotMatch(render("primary"), /90% ~\S+/);
  assert.match(render("all"), /7d .* 90% ~5d/);
});

test("renderFooterLines annotates a weekly-only Codex primary gauge", () => {
  const nowMs = Date.parse("2026-06-16T10:00:00Z");
  const weeklyOnly: ProviderStatusSnapshot = {
    provider: "openai-codex",
    source: "api",
    fetchedAt: new Date(nowMs).toISOString(),
    state: "ok",
    primary: {
      label: "7d",
      leftPercent: 16,
      usedPercent: 84,
      resetAt: (nowMs + (5 * 24 + 4) * 60 * 60_000) / 1000,
    },
  };
  const lines = renderFooterLines(
    120,
    contextWithModel({
      provider: "openai",
      id: "gpt-5-codex",
      name: "GPT-5 Codex",
    }) as never,
    EMPTY_GIT_INFO,
    "off",
    theme as never,
    usageMetrics,
    {
      ...footerConfig,
      providerStatus: { ...footerConfig.providerStatus, display: "gauge" },
    },
    [],
    [weeklyOnly],
    nowMs,
  );

  assert.match(lines.join("\n"), /7d .* 84% ~5d4h/);
  assert.doesNotMatch(lines.join("\n"), /5h/);
});

test("renderFooterLines matches header-derived countdowns to each window", () => {
  const nowMs = Date.parse("2026-06-16T10:00:00Z");
  const status = parseCodexRateLimitHeaders(
    {
      "x-codex-primary-used-percent": "20",
      "x-codex-primary-window-minutes": "300",
      "x-codex-primary-reset-at": String(nowMs / 1000 + 2 * 60 * 60),
      "x-codex-secondary-used-percent": "40",
      "x-codex-secondary-window-minutes": "10080",
      "x-codex-secondary-reset-at": String(nowMs / 1000 + (5 * 24 + 4) * 60 * 60),
    },
    new Date(nowMs),
  );
  assert.ok(status);

  const lines = renderFooterLines(
    160,
    contextWithModel({
      provider: "openai",
      id: "gpt-5-codex",
      name: "GPT-5 Codex",
    }) as never,
    EMPTY_GIT_INFO,
    "off",
    theme as never,
    usageMetrics,
    {
      ...footerConfig,
      gaugeStyle: "parallelograms",
      providerStatus: {
        ...footerConfig.providerStatus,
        display: "gauge",
        showReset: "all",
        resetMinUsedPercent: 0,
      },
    },
    [],
    [status],
    nowMs,
  );

  assert.match(lines.join("\n"), /5h ▰▱▱▱▱ 20% ~2h 7d ▰▰▱▱▱ 40% ~5d4h/);
});

test("renderFooterLines shows Anthropic provider status for Claude models", () => {
  const lines = renderFooterLines(
    120,
    contextWithModel({
      provider: "anthropic",
      id: "claude-sonnet-4",
      name: "Claude Sonnet 4",
    }) as never,
    EMPTY_GIT_INFO,
    "off",
    theme as never,
    usageMetrics,
    footerConfig,
    [],
    [claudeProviderStatus],
  );

  assert.match(lines.join("\n"), /5h:0% 7d:8%/);
});

test("renderFooterLines shows the model-scoped weekly window for the active model", () => {
  const nowMs = Date.parse("2026-06-16T10:00:00Z");
  const scopedProviderStatus: ProviderStatusSnapshot = {
    ...claudeProviderStatus,
    secondary: {
      ...claudeProviderStatus.secondary!,
      resetAt: (nowMs + 60 * 60_000) / 1000,
    },
    scoped: [
      {
        label: "7d",
        model: "Fable",
        leftPercent: 4,
        usedPercent: 96,
        resetAt: (nowMs + 2 * 60 * 60_000) / 1000,
      },
    ],
  };
  const render = (model: { id: string; name: string; provider?: string }) =>
    renderFooterLines(
      120,
      contextWithModel(model) as never,
      EMPTY_GIT_INFO,
      "off",
      theme as never,
      usageMetrics,
      footerConfig,
      [],
      [scopedProviderStatus],
      nowMs,
    ).join("\n");

  assert.match(
    render({
      provider: "anthropic",
      id: "claude-fable-5",
      name: "Claude Fable 5",
    }),
    /5h:0% 7d:96% ~2h/,
  );
  assert.match(
    render({
      provider: "anthropic",
      id: "claude-sonnet-4",
      name: "Claude Sonnet 4",
    }),
    /5h:0% 7d:8%(?! ~\S+)/,
  );
});

test("renderFooterLines hides Anthropic provider status for OpenAI models", () => {
  const lines = renderFooterLines(
    120,
    contextWithModel({
      provider: "openai",
      id: "gpt-5-codex",
      name: "GPT-5 Codex",
    }) as never,
    EMPTY_GIT_INFO,
    "off",
    theme as never,
    usageMetrics,
    footerConfig,
    [],
    [claudeProviderStatus],
  );

  assert.doesNotMatch(lines.join("\n"), /5h:0%/);
});

test("formatCompactCost strips visual noise while retaining small nonzero costs", () => {
  assert.equal(formatCompactCost(0), "$0");
  assert.equal(formatCompactCost(0.1), "$0.1");
  assert.equal(formatCompactCost(1), "$1");
  assert.equal(formatCompactCost(1.234), "$1.23");
  assert.equal(formatCompactCost(0.0012), "$0.0012");
  assert.equal(formatCompactCost(Number.NaN), "$0");
});

test("renderFooterLines renders compact cost after a major scope separator", () => {
  const config: FooterConfigSnapshot = {
    ...footerConfig,
    widgets: {
      ...footerConfig.widgets,
      "total-cost": { icon: "hide" },
    },
  };
  const lines = renderFooterLines(
    120,
    contextWithModel({
      provider: "anthropic",
      id: "claude-sonnet-4",
      name: "Claude Sonnet 4",
    }) as never,
    EMPTY_GIT_INFO,
    "off",
    theme as never,
    { ...usageMetrics, totalCost: 0.1 },
    config,
  );

  assert.match(lines.join("\n"), /⟩ \$0\.1/);
  assert.doesNotMatch(lines.join("\n"), /󰜦|\$0\.10/);
});

const cacheUsageMetrics: SessionUsageMetrics = {
  latest: { input: 1000, cacheRead: 8000, cacheWrite: 1000, cost: 0.1 },
  totalCost: 0.1,
  totalCacheRead: 20_000,
  totalCacheWrite: 3000,
};

test("renderFooterLines shows cache widgets when cache tokens accrued", () => {
  const lines = renderFooterLines(
    120,
    contextWithModel({
      provider: "anthropic",
      id: "claude-sonnet-4",
      name: "Claude Sonnet 4",
    }) as never,
    EMPTY_GIT_INFO,
    "off",
    theme as never,
    cacheUsageMetrics,
    footerConfig,
  );

  const out = lines.join("\n");
  assert.match(out, /R 20k/);
  assert.match(out, /W 3k/);
  assert.match(out, /H › 󰍛 80%/);
});

test("renderFooterLines keeps cache and cost independent from context pressure", () => {
  const colors: string[] = [];
  const coloredTheme = {
    fg: (color: string, text: string) => {
      colors.push(`${color}:${text}`);
      return text;
    },
    getColorMode: () => "truecolor" as const,
  };
  renderFooterLines(
    120,
    contextWithModel(
      { provider: "anthropic", id: "claude-sonnet-4", name: "Claude Sonnet 4" },
      { contextWindow: 100_000, tokens: 90_000, percent: 90 },
    ) as never,
    EMPTY_GIT_INFO,
    "off",
    coloredTheme as never,
    cacheUsageMetrics,
    footerConfig,
  );

  assert.ok(colors.includes("accent:› 󰍛 80%"));
  assert.ok(colors.includes("accent:⟩ $0.1"));
  assert.doesNotMatch(
    colors.join("\n"),
    /warning:(?:› 󰍛|⟩ \$)|󰜦|error|thinkingHigh|thinkingMax/,
  );
});

test("renderFooterLines hides cache widgets without cache activity", () => {
  const lines = renderFooterLines(
    120,
    contextWithModel({
      provider: "anthropic",
      id: "claude-sonnet-4",
      name: "Claude Sonnet 4",
    }) as never,
    EMPTY_GIT_INFO,
    "off",
    theme as never,
    usageMetrics,
    footerConfig,
  );

  const out = lines.join("\n");
  assert.doesNotMatch(out, /R \d/);
  assert.doesNotMatch(out, /W \d/);
  assert.doesNotMatch(out, /H \d/);
});

test("renderFooterLines hides the commit SHA unless enabled", () => {
  const ctx = contextWithModel({
    provider: "anthropic",
    id: "claude-sonnet-4",
    name: "Claude Sonnet 4",
  }) as never;
  const git = { ...EMPTY_GIT_INFO, commit: "abc1234" };

  const hidden = renderFooterLines(
    120,
    ctx,
    git,
    "off",
    theme as never,
    usageMetrics,
    footerConfig,
  );
  assert.doesNotMatch(hidden.join("\n"), /abc1234/);

  const enabledConfig: FooterConfigSnapshot = {
    ...footerConfig,
    widgets: { ...footerConfig.widgets, commit: { enabled: true } },
  };
  const shown = renderFooterLines(
    120,
    ctx,
    git,
    "off",
    theme as never,
    usageMetrics,
    enabledConfig,
  );
  assert.match(shown.join("\n"), /# abc1234/);
});

const contextBarUsage = { contextWindow: 200_000, tokens: 92_000, percent: 46 };

function contextBarFooterConfig(
  contextBarOverride: FooterConfigSnapshot["widgets"]["context-bar"],
): FooterConfigSnapshot {
  return {
    ...DEFAULT_FOOTER_CONFIG,
    iconFamily: "ascii",
    gaugeStyle: "bars",
    widgets: {
      ...(contextBarOverride ? { "context-bar": contextBarOverride } : {}),
      location: { enabled: false },
    },
  };
}

test("renderFooterLines keeps the compact context gauge by default", () => {
  const lines = renderFooterLines(
    120,
    contextWithModel(
      { provider: "anthropic", id: "claude-sonnet-4", name: "Claude Sonnet 4" },
      contextBarUsage,
    ) as never,
    EMPTY_GIT_INFO,
    "off",
    theme as never,
    usageMetrics,
    contextBarFooterConfig(undefined),
  );

  const row = lines[0] ?? "";
  assert.match(row, /█+░+ \d+%/);
  assert.equal((row.match(/[█░]/g) ?? []).length, DEFAULT_FOOTER_CONFIG.gaugeWidth);
});

test("renderFooterLines resets context usage while post-compaction usage is unknown", () => {
  const preCompactionUsage: SessionUsageMetrics = {
    latest: {
      input: 268_476,
      cacheRead: 0,
      cacheWrite: 0,
      cost: 0,
    },
    totalCost: 0,
    totalCacheRead: 0,
    totalCacheWrite: 0,
  };
  const lines = renderFooterLines(
    120,
    contextWithModel(
      { provider: "anthropic", id: "claude-sonnet-4", name: "Claude Sonnet 4" },
      { contextWindow: 400_000, tokens: null, percent: null },
    ) as never,
    EMPTY_GIT_INFO,
    "off",
    theme as never,
    preCompactionUsage,
    contextBarFooterConfig(undefined),
  );

  const row = lines[0] ?? "";
  assert.match(row, /░{5} 0%/);
  assert.doesNotMatch(row, /█/);
});

test("renderFooterLines grows the context bar across the row when configured", () => {
  const lines = renderFooterLines(
    120,
    contextWithModel(
      { provider: "anthropic", id: "claude-sonnet-4", name: "Claude Sonnet 4" },
      contextBarUsage,
    ) as never,
    EMPTY_GIT_INFO,
    "off",
    theme as never,
    usageMetrics,
    contextBarFooterConfig({ fill: "grow" }),
  );

  const row = lines[0] ?? "";
  assert.equal(visibleWidth(row), 120);
  assert.match(row, /92k █+░+/);
  assert.ok((row.match(/[█░]/g) ?? []).length > 60);
  assert.doesNotMatch(row, /%/);
});

test("renderFooterLines hides context capacity unless enabled", () => {
  const usage = { contextWindow: 1_000_000, tokens: 92_000, percent: 9 };
  const ctx = contextWithModel(
    { provider: "anthropic", id: "claude-sonnet-4", name: "Claude Sonnet 4" },
    usage,
  ) as never;

  const hidden = renderFooterLines(
    120,
    ctx,
    EMPTY_GIT_INFO,
    "off",
    theme as never,
    usageMetrics,
    contextBarFooterConfig(undefined),
  );
  assert.doesNotMatch(hidden.join("\n"), /1M/);

  const config = contextBarFooterConfig(undefined);
  config.widgets["context-capacity"] = { enabled: true };
  const shown = renderFooterLines(
    120,
    ctx,
    EMPTY_GIT_INFO,
    "off",
    theme as never,
    usageMetrics,
    config,
  );
  assert.match(shown.join("\n"), /\[\] 1M/);
});

test("renderFooterLines clamps a grown context bar at narrow widths", () => {
  const lines = renderFooterLines(
    38,
    contextWithModel(
      { provider: "anthropic", id: "claude-sonnet-4", name: "Claude Sonnet 4" },
      contextBarUsage,
    ) as never,
    EMPTY_GIT_INFO,
    "off",
    theme as never,
    usageMetrics,
    contextBarFooterConfig({ fill: "grow" }),
  );

  const row = lines[0] ?? "";
  assert.ok(visibleWidth(row) <= 38);
  assert.match(row, /[█░]/);
});

test("renderFooterLines truncates countdown gauges ANSI-safely", () => {
  const nowMs = Date.parse("2026-06-16T10:00:00Z");
  const ansiTheme = {
    fg: (_color: string, text: string) => `\x1b[2m${text}\x1b[0m`,
    getColorMode: () => "truecolor" as const,
  };
  const status: ProviderStatusSnapshot = {
    ...claudeProviderStatus,
    primary: {
      ...claudeProviderStatus.primary!,
      resetAt: (nowMs + (4 * 60 + 32) * 60_000) / 1000,
    },
    secondary: {
      ...claudeProviderStatus.secondary!,
      resetAt: (nowMs + (24 + 7) * 60 * 60_000) / 1000,
    },
  };
  const config: FooterConfigSnapshot = {
    ...footerConfig,
    gaugeStyle: "parallelograms",
    providerStatus: {
      ...footerConfig.providerStatus,
      display: "gauge",
      showReset: "all",
      resetMinUsedPercent: 0,
    },
    widgets: {
      ...footerConfig.widgets,
      "context-bar": { enabled: true },
    },
  };

  for (const width of [16, 24, 32, 40]) {
    const lines = renderFooterLines(
      width,
      contextWithModel({
        provider: "anthropic",
        id: "claude-sonnet-4",
        name: "Claude Sonnet 4",
      }) as never,
      EMPTY_GIT_INFO,
      "off",
      ansiTheme as never,
      usageMetrics,
      config,
      [],
      [status],
      nowMs,
    );
    for (const line of lines) {
      assert.ok(visibleWidth(line) <= width);
      assert.equal(line.replace(/\x1b\[[0-9;]*m/g, "").includes("\x1b"), false);
    }
  }
});
