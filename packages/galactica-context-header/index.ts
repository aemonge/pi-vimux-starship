import type { ExtensionAPI, ExtensionContext } from '@earendil-works/pi-coding-agent';
import { truncateToWidth } from '@earendil-works/pi-tui';

import {
  buildAgentFooterWidgets,
  buildPromptStatusSnapshot,
  COMPACTION_WIDGET_ID,
  CONTEXT_WIDGET_ID,
  countCompactions,
  ENVIRONMENT_WIDGET_ID,
  FANCY_FOOTER_READY_CHANNEL,
  FOOTER_TELEMETRY_CHANNEL,
  FANCY_FOOTER_WIDGET_CHANNEL,
  formatFooterBranch,
  formatFooterPath,
  GALACTICA_HEADER_CHANNEL,
  GIT_BRANCH_WIDGET_ID,
  GIT_CONFLICT_WIDGET_ID,
  GIT_SCOPE_SEPARATOR_WIDGET_ID,
  GIT_MODIFIED_WIDGET_ID,
  GIT_STAGED_WIDGET_ID,
  GIT_UNTRACKED_WIDGET_ID,
  type FooterTelemetrySnapshot,
  type GitStatusSummary,
  type HeaderSnapshot,
  LEGACY_GIT_WIDGET_ID,
  LOCATION_WIDGET_ID,
  normalizeContextPercent,
  parseFooterTelemetry,
  parseGitBranch,
  parseGitStatus,
  parseHeaderSnapshot,
  PROMPT_STATUS_CHANNEL,
  REASONING_WIDGET_ID,
  SCOPE_SEPARATOR_WIDGET_ID,
  runtimeHeaderWork,
  parseVimMode,
  VIM_MODE_CHANNEL,
  type VimMode,
} from './src/gauge.ts';
import {
  buildRuntimeFooterWidgets,
  formatRailChronometer,
  RUNTIME_SCOPE_SEPARATOR_WIDGET_ID,
  RUNTIME_STATUS_WIDGET_ID,
} from './src/activity-age.ts';
import {
  buildCapabilityFooterWidget,
  CAPABILITY_WIDGET_ID,
  LSP_STATUS_EVENT,
  MCP_STATUS_EVENT,
  parseLspCapability,
  parseMcpCapability,
  type LspCapability,
  type McpCapability,
} from './src/capabilities.ts';
import { shouldRefreshGitAfterTool } from './src/git-refresh.ts';
import {
  buildResourceFooterWidgets,
  buildResourceTelemetry,
  calculateCpuPercent,
  CPU_WIDGET_ID,
  MEMORY_WIDGET_ID,
  RESOURCE_REFRESH_MS,
  sampleProcessTreeResources,
  updateCpuSmoothing,
  type CpuSmoothingState,
  type ProcessTreeSample,
  type ResourceTelemetry,
} from './src/process-resources.ts';
import { renderHeaderDeck } from './src/deck.ts';
import { layoutLifecycleTitle, renderLifecycleTitleSections } from './src/title.ts';

const WIDGET_KEY = 'galactica.work-identity';
const EMPTY_GIT: GitStatusSummary = {
  staged: 0,
  modified: 0,
  untracked: 0,
  conflicts: 0,
};

export interface ContextHeaderOptions {
  surface?: 'legacy' | 'deck';
}

export function installEmptyDeckFooter(ctx: ExtensionContext): () => void {
  ctx.ui.setFooter(() => ({
    render(): string[] {
      return [];
    },
    invalidate() {},
  }));
  return () => ctx.ui.setFooter(undefined);
}

export default function galacticaContextHeader(
  pi: ExtensionAPI,
  options: ContextHeaderOptions = {},
): void {
  const deckMode = options.surface === 'deck';
  let clearWidget: (() => void) | undefined;
  let clearFooter: (() => void) | undefined;
  let requestRender: (() => void) | undefined;
  let branch = '';
  let gitAvailable = false;
  let gitStatus: GitStatusSummary = { ...EMPTY_GIT };
  let header: HeaderSnapshot | null = null;
  let agentBusy = false;
  let lastObservedActivityAt: number | null = null;
  let lastActivityAgeSignature = '';
  let activityAgeTimer: ReturnType<typeof setInterval> | undefined;
  let sessionGeneration = 0;
  let activeCwd = '';
  let activeCtx: ExtensionContext | undefined;
  let gitRefreshInFlight = false;
  let gitRefreshQueued = false;
  let resourceTimer: ReturnType<typeof setInterval> | undefined;
  let resourceRefreshInFlight = false;
  let previousResourceSample: ProcessTreeSample | undefined;
  let cpuSmoothing: CpuSmoothingState | undefined;
  let latestResourceTelemetry: ResourceTelemetry | undefined;
  let lastResourceSignature = '';
  let lspCapability: LspCapability | null = null;
  let mcpCapability: McpCapability | null = null;
  let footerTelemetry: FooterTelemetrySnapshot | undefined;
  let vimMode: VimMode = 'insert';
  let lastCapabilitySignature = '';

  const currentHeader = () => header;

  const publishPromptStatus = () => {
    if (deckMode) return;
    pi.events.emit(
      PROMPT_STATUS_CHANNEL,
      buildPromptStatusSnapshot(currentHeader(), branch, gitStatus),
    );
  };

  const publishFooter = () => {
    if (deckMode) return;
    const ctx = activeCtx;
    if (!ctx) return;
    const usage = ctx.getContextUsage();
    const contextPercent = normalizeContextPercent(
      usage?.percent,
      usage?.tokens,
      usage?.contextWindow ?? ctx.model?.contextWindow,
    );
    const thinking = pi.getThinkingLevel();
    for (const message of buildAgentFooterWidgets({
      cwd: formatFooterPath(activeCwd || ctx.cwd, process.env.HOME),
      devbox: process.env.DEVBOX_PROJECT_ROOT !== undefined,
      branch: formatFooterBranch(branch),
      git: gitStatus,
      gitAvailable,
      model: ctx.model?.name || ctx.model?.id || 'no model',
      ...(thinking && thinking !== 'off' ? { thinking } : {}),
      contextPercent,
      compactionCount: countCompactions(ctx.sessionManager.getBranch()),
    })) {
      pi.events.emit(FANCY_FOOTER_WIDGET_CHANNEL, message);
    }
  };

  const publishLatestResourceFooter = () => {
    if (deckMode || !latestResourceTelemetry) return;
    for (const message of buildResourceFooterWidgets(latestResourceTelemetry)) {
      pi.events.emit(FANCY_FOOTER_WIDGET_CHANNEL, message);
    }
  };

  const publishCapabilityFooter = (force = false) => {
    if (deckMode) return;
    const signature = [mcpCapability?.healthy ?? '', mcpCapability?.total ?? ''].join(
      ':',
    );
    if (!force && signature === lastCapabilitySignature) return;
    lastCapabilitySignature = signature;
    pi.events.emit(
      FANCY_FOOTER_WIDGET_CHANNEL,
      buildCapabilityFooterWidget(mcpCapability),
    );
  };

  const refreshResources = async (): Promise<void> => {
    if (!activeCtx || resourceRefreshInFlight) return;
    resourceRefreshInFlight = true;
    const generation = sessionGeneration;
    try {
      const sample = await sampleProcessTreeResources();
      if (!activeCtx || generation !== sessionGeneration) return;
      const rawCpuPercent = calculateCpuPercent(previousResourceSample, sample);
      previousResourceSample = sample;
      cpuSmoothing = updateCpuSmoothing(cpuSmoothing, rawCpuPercent);
      const telemetry = buildResourceTelemetry(cpuSmoothing, sample.memoryBytes);
      const signature = [
        Math.round(telemetry.cpuPercent),
        telemetry.memoryBytes,
        telemetry.cpuWarning,
        telemetry.memoryWarning,
      ].join(':');
      latestResourceTelemetry = telemetry;
      if (signature === lastResourceSignature) return;
      lastResourceSignature = signature;
      publishLatestResourceFooter();
    } finally {
      resourceRefreshInFlight = false;
    }
  };

  const removeFooterWidgets = () => {
    for (const id of [
      LOCATION_WIDGET_ID,
      LEGACY_GIT_WIDGET_ID,
      GIT_BRANCH_WIDGET_ID,
      GIT_SCOPE_SEPARATOR_WIDGET_ID,
      GIT_STAGED_WIDGET_ID,
      GIT_MODIFIED_WIDGET_ID,
      GIT_UNTRACKED_WIDGET_ID,
      GIT_CONFLICT_WIDGET_ID,
      ENVIRONMENT_WIDGET_ID,
      REASONING_WIDGET_ID,
      CONTEXT_WIDGET_ID,
      COMPACTION_WIDGET_ID,
      CPU_WIDGET_ID,
      MEMORY_WIDGET_ID,
      RUNTIME_STATUS_WIDGET_ID,
      RUNTIME_SCOPE_SEPARATOR_WIDGET_ID,
      SCOPE_SEPARATOR_WIDGET_ID,
      CAPABILITY_WIDGET_ID,
    ]) {
      pi.events.emit(FANCY_FOOTER_WIDGET_CHANNEL, {
        protocol: 1,
        type: 'remove',
        id,
      });
    }
  };

  const currentActivityAge = (): number | null =>
    agentBusy && lastObservedActivityAt !== null
      ? Math.max(0, Date.now() - lastObservedActivityAt)
      : null;

  const publishRuntimeFooter = () => {
    if (deckMode) return;
    const activityAge = currentActivityAge();
    const status = formatRailChronometer(activityAge);
    const active = activityAge !== null;
    const signature = `${active ? 'active' : 'idle'}:${status}`;
    if (signature === lastActivityAgeSignature) return;
    lastActivityAgeSignature = signature;
    for (const message of buildRuntimeFooterWidgets(status, active)) {
      pi.events.emit(FANCY_FOOTER_WIDGET_CHANNEL, message);
    }
  };

  const stopReady = pi.events.on(FANCY_FOOTER_READY_CHANNEL, () => {
    publishFooter();
    publishLatestResourceFooter();
    publishRuntimeFooter();
    publishCapabilityFooter(true);
  });
  const stopLspStatus = pi.events.on(LSP_STATUS_EVENT, (raw) => {
    lspCapability = parseLspCapability(raw);
    requestRender?.();
  });
  const stopMcpStatus = pi.events.on(MCP_STATUS_EVENT, (raw) => {
    mcpCapability = parseMcpCapability(raw);
    requestRender?.();
    publishCapabilityFooter();
  });
  const stopFooterTelemetry = pi.events.on(FOOTER_TELEMETRY_CHANNEL, (raw) => {
    const next = parseFooterTelemetry(raw);
    if (!next) return;
    footerTelemetry = next;
    requestRender?.();
  });
  const stopVimMode = pi.events.on(VIM_MODE_CHANNEL, (raw) => {
    const next = parseVimMode(raw);
    if (!next) return;
    vimMode = next;
    requestRender?.();
  });
  const stopHeader = pi.events.on(GALACTICA_HEADER_CHANNEL, (raw) => {
    header = parseHeaderSnapshot(raw);
    requestRender?.();
    publishPromptStatus();
    publishRuntimeFooter();
  });

  const markObservedActivity = () => {
    lastObservedActivityAt = Date.now();
    lastActivityAgeSignature = '';
    requestRender?.();
    publishRuntimeFooter();
  };

  const clearObservedActivity = () => {
    lastObservedActivityAt = null;
    lastActivityAgeSignature = '';
  };

  const refreshActivityAge = () => {
    if (currentActivityAge() === null) return;
    if (deckMode) requestRender?.();
    else publishRuntimeFooter();
  };

  pi.on('before_agent_start', (_event, ctx) => {
    if (ctx.mode !== 'tui') return;
    agentBusy = true;
    markObservedActivity();
    publishPromptStatus();
  });

  pi.on('turn_start', markObservedActivity);
  pi.on('before_provider_request', markObservedActivity);
  pi.on('after_provider_response', markObservedActivity);

  pi.on('message_start', (event) => {
    if (event.message.role === 'assistant') markObservedActivity();
  });

  pi.on('message_update', (event) => {
    if (event.message.role === 'assistant') markObservedActivity();
  });

  pi.on('tool_execution_start', markObservedActivity);
  pi.on('tool_execution_update', markObservedActivity);

  const runGit = async (args: string[], cwd: string) => {
    try {
      return await pi.exec('git', args, { cwd, timeout: 2_000 });
    } catch {
      return undefined;
    }
  };

  const refreshGit = async (): Promise<void> => {
    if (!activeCwd) return;
    if (gitRefreshInFlight) {
      gitRefreshQueued = true;
      return;
    }

    gitRefreshInFlight = true;
    try {
      do {
        gitRefreshQueued = false;
        const generation = sessionGeneration;
        const cwd = activeCwd;
        const [branchResult, statusResult] = await Promise.all([
          runGit(['symbolic-ref', '--short', 'HEAD'], cwd),
          runGit(['status', '--porcelain=v1', '--untracked-files=all'], cwd),
        ]);
        if (generation !== sessionGeneration || cwd !== activeCwd) continue;

        gitAvailable = statusResult?.code === 0;
        branch =
          branchResult?.code === 0
            ? parseGitBranch(String(branchResult.stdout ?? ''))
            : '';
        gitStatus = gitAvailable
          ? parseGitStatus(String(statusResult?.stdout ?? ''))
          : { ...EMPTY_GIT };
        publishPromptStatus();
        publishFooter();
      } while (gitRefreshQueued && activeCwd);
    } finally {
      gitRefreshInFlight = false;
    }
  };

  pi.on('session_start', (_event, ctx) => {
    clearWidget?.();
    clearFooter?.();
    clearFooter = undefined;
    if (activityAgeTimer) clearInterval(activityAgeTimer);
    if (resourceTimer) clearInterval(resourceTimer);
    activityAgeTimer = undefined;
    resourceTimer = undefined;
    ++sessionGeneration;
    activeCtx = ctx;
    activeCwd = '';
    branch = '';
    gitAvailable = false;
    gitStatus = { ...EMPTY_GIT };
    header = null;
    agentBusy = false;
    lspCapability = null;
    mcpCapability = null;
    footerTelemetry = undefined;
    vimMode = 'insert';
    resourceRefreshInFlight = false;
    previousResourceSample = undefined;
    cpuSmoothing = undefined;
    latestResourceTelemetry = undefined;
    lastResourceSignature = '';
    lastCapabilitySignature = '';
    clearObservedActivity();
    publishFooter();
    publishPromptStatus();
    publishRuntimeFooter();
    publishCapabilityFooter();
    if (ctx.mode === 'tui') {
      ctx.ui.setWorkingVisible(false);
      activityAgeTimer = setInterval(refreshActivityAge, 50);
    }
    if (!ctx.hasUI) return;
    if (deckMode) clearFooter = installEmptyDeckFooter(ctx);
    void refreshResources();
    resourceTimer = setInterval(() => void refreshResources(), RESOURCE_REFRESH_MS);
    activeCwd = ctx.cwd;
    void refreshGit();

    ctx.ui.setWidget(
      WIDGET_KEY,
      (tui, theme) => {
        requestRender = () => tui.requestRender();
        return {
          render(width: number): string[] {
            if (width <= 0) return [];
            if (deckMode) {
              const usage = ctx.getContextUsage();
              return renderHeaderDeck(
                {
                  elapsedMs: currentActivityAge(),
                  header: currentHeader(),
                  cwd: formatFooterPath(activeCwd || ctx.cwd, process.env.HOME),
                  devbox: process.env.DEVBOX_PROJECT_ROOT !== undefined,
                  branch: formatFooterBranch(branch, 80),
                  gitAvailable,
                  git: gitStatus,
                  model: ctx.model?.name || ctx.model?.id || 'no model',
                  thinking: pi.getThinkingLevel(),
                  contextPercent: normalizeContextPercent(
                    usage?.percent,
                    usage?.tokens,
                    usage?.contextWindow ?? ctx.model?.contextWindow,
                  ),
                  compactionCount: countCompactions(ctx.sessionManager.getBranch()),
                  ...(latestResourceTelemetry
                    ? { resources: latestResourceTelemetry }
                    : {}),
                  ...(footerTelemetry ? { footerTelemetry } : {}),
                  lsp: lspCapability,
                  mcp: mcpCapability,
                  mode: vimMode,
                },
                width,
                theme,
              );
            }
            const { work, idle } = runtimeHeaderWork(currentHeader()?.work, agentBusy);
            const layout = layoutLifecycleTitle(work, width, agentBusy);
            const line = renderLifecycleTitleSections(
              layout,
              work.lifecycle,
              idle,
              theme,
            );
            return [truncateToWidth(line, width, '…')];
          },
          invalidate() {},
        };
      },
      { placement: 'aboveEditor' },
    );

    clearWidget = () => {
      requestRender = undefined;
      ctx.ui.setWidget(WIDGET_KEY, undefined);
    };
  });

  pi.on('model_select', () => {
    publishFooter();
    requestRender?.();
  });

  pi.on('thinking_level_select', publishFooter);
  pi.on('message_end', (event) => {
    if (event.message.role === 'assistant') markObservedActivity();
    publishFooter();
  });
  pi.on('session_compact', publishFooter);

  pi.on('tool_execution_end', (event) => {
    markObservedActivity();
    if (shouldRefreshGitAfterTool(event.toolName, event.isError)) {
      void refreshGit();
    }
  });

  pi.on('agent_settled', () => {
    agentBusy = false;
    clearObservedActivity();
    requestRender?.();
    publishPromptStatus();
    publishFooter();
    publishRuntimeFooter();
    void refreshGit();
  });

  pi.on('session_shutdown', () => {
    sessionGeneration += 1;
    activeCwd = '';
    activeCtx = undefined;
    gitAvailable = false;
    agentBusy = false;
    clearObservedActivity();
    if (activityAgeTimer) clearInterval(activityAgeTimer);
    if (resourceTimer) clearInterval(resourceTimer);
    activityAgeTimer = undefined;
    resourceTimer = undefined;
    resourceRefreshInFlight = false;
    previousResourceSample = undefined;
    cpuSmoothing = undefined;
    latestResourceTelemetry = undefined;
    lastResourceSignature = '';
    gitRefreshQueued = false;
    clearWidget?.();
    clearWidget = undefined;
    clearFooter?.();
    clearFooter = undefined;
    removeFooterWidgets();
    stopHeader();
    stopReady();
    stopLspStatus();
    stopMcpStatus();
    stopFooterTelemetry();
    stopVimMode();
  });
}
