import type { StageValue } from './types.ts';
import { classifyHeaderActivity, headerLifecycleForActivity } from './publisher.ts';

/**
 * Runtime span store (frozen contract, `runs` fact).
 *
 * Replaces count-only tracking: every live participant is a span with identity,
 * parent, stage, and age. Subagent partial results map to per-agent child spans;
 * bash children are leaf spans. The derived `snapshot()` keeps count parity with
 * the retired `RuntimeRunTracker` while adding the span views renderers need.
 */

export interface ActiveRunSpanView {
  id: string;
  kind: 'agent' | 'subagent' | 'bash';
  parent: string | null;
  agent?: string;
  label?: string;
  stage: StageValue;
  elapsedMs: number;
}

export interface ActiveRuntimeRuns {
  children: number;
  subagents: number;
  spans?: ActiveRunSpanView[];
}

interface TrackedSpan {
  id: string;
  kind: 'agent' | 'subagent' | 'bash';
  parent: string | null;
  agent?: string;
  label?: string;
  stage: StageValue;
  stageDeclared: boolean;
  since: number;
  endedAt?: number;
}

function record(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

interface PartialAgentResult {
  agent?: string;
  active: boolean;
}

function partialAgentResults(partialResult: unknown): PartialAgentResult[] | undefined {
  const details = record(record(partialResult)?.details);
  if (details?.kind !== 'pi-subagent' || !Array.isArray(details.results)) {
    return undefined;
  }
  return details.results.map((rawResult) => {
    const result = record(rawResult);
    return {
      agent: typeof result?.agent === 'string' ? result.agent : undefined,
      active:
        result?.exitCode === -1 &&
        result.sawAgentStart === true &&
        result.sawAgentSettled !== true,
    };
  });
}

function inferredStage(agent: string | undefined): StageValue {
  const activity = classifyHeaderActivity(agent ?? '');
  return headerLifecycleForActivity(activity) ?? 'working';
}

export interface SpanStoreChange {
  started: ActiveRunSpanView[];
  ended: string[];
}

export class RuntimeSpanStore {
  private readonly spans = new Map<string, TrackedSpan>();
  private changeQueue: SpanStoreChange = { started: [], ended: [] };

  beginRoot(turnId: string, stage: StageValue, now = Date.now()): boolean {
    return this.beginSpan({
      id: turnId,
      kind: 'agent',
      parent: null,
      stage,
      stageDeclared: false,
      since: now,
    });
  }

  endRoot(turnId: string, now = Date.now()): boolean {
    return this.finishSpan(turnId, now);
  }

  begin(
    toolCallId: string,
    kind: 'bash' | 'subagent',
    parent: string | null,
    now = Date.now(),
  ): boolean {
    if (this.spans.has(toolCallId)) return false;
    return this.beginSpan({
      id: toolCallId,
      kind,
      parent,
      stage: 'working',
      stageDeclared: false,
      since: now,
    });
  }

  finish(toolCallId: string, now = Date.now()): boolean {
    return this.finishSpan(toolCallId, now);
  }

  /**
   * Map subagent partial results to per-agent child spans. Returns true when any
   * span started or ended; queued changes are drained by `drainChanges()`.
   */
  update(toolCallId: string, partialResult: unknown, now = Date.now()): boolean {
    const parent = this.spans.get(toolCallId);
    if (!parent || parent.kind !== 'subagent') return false;
    const results = partialAgentResults(partialResult);
    if (!results) return false;

    let changed = false;
    const expected = new Set<string>();
    results.forEach((result, index) => {
      const agent = result.agent?.trim() || undefined;
      if (!result.active) return;
      const childId = `${toolCallId}:${agent ?? index}`;
      expected.add(childId);
      const existing = this.spans.get(childId);
      if (existing && existing.endedAt === undefined) {
        if (agent && existing.agent !== agent) {
          existing.agent = agent;
          existing.stage = inferredStage(agent);
          changed = true;
        }
        return;
      }
      changed =
        this.beginSpan({
          id: childId,
          kind: 'subagent',
          parent: toolCallId,
          agent,
          stage: inferredStage(agent),
          stageDeclared: false,
          since: now,
        }) || changed;
    });

    for (const span of this.spans.values()) {
      if (span.parent === toolCallId && span.endedAt === undefined) {
        if (!expected.has(span.id)) {
          changed = this.finishSpan(span.id, now) || changed;
        }
      }
    }
    return changed;
  }

  setStage(id: string, stage: StageValue, declared: boolean): boolean {
    const span = this.spans.get(id);
    if (!span || span.endedAt !== undefined) return false;
    // Declaration beats inference: an inferred stage never overrides a declared one.
    if (!declared && span.stageDeclared) return false;
    if (span.stage === stage && span.stageDeclared === declared) return false;
    span.stage = stage;
    span.stageDeclared = declared;
    return true;
  }

  drainChanges(): SpanStoreChange {
    const drained = this.changeQueue;
    this.changeQueue = { started: [], ended: [] };
    return drained;
  }

  snapshot(now = Date.now()): ActiveRuntimeRuns {
    const views: ActiveRunSpanView[] = [];
    let children = 0;
    let subagents = 0;
    for (const span of this.spans.values()) {
      if (span.endedAt !== undefined) continue;
      const parent = span.parent ? this.spans.get(span.parent) : undefined;
      const isAgentChild = span.kind === 'subagent' && parent?.kind === 'subagent';
      views.push({
        id: span.id,
        kind: span.kind,
        parent: span.parent,
        ...(span.agent ? { agent: span.agent } : {}),
        ...(span.label ? { label: span.label } : {}),
        stage: span.stage,
        elapsedMs: Math.max(0, now - span.since),
      });
      if (span.kind === 'bash') children += 1;
      if (isAgentChild) {
        children += 1;
        subagents += 1;
      }
    }
    return { children, subagents, spans: views };
  }

  private beginSpan(span: TrackedSpan): boolean {
    if (this.spans.has(span.id)) return false;
    this.spans.set(span.id, span);
    this.changeQueue.started.push({
      id: span.id,
      kind: span.kind,
      parent: span.parent,
      ...(span.agent ? { agent: span.agent } : {}),
      ...(span.label ? { label: span.label } : {}),
      stage: span.stage,
      elapsedMs: 0,
    });
    return true;
  }

  private finishSpan(id: string, now: number): boolean {
    const span = this.spans.get(id);
    if (!span || span.endedAt !== undefined) return false;
    span.endedAt = now;
    this.changeQueue.ended.push(id);
    // Ending a container takes its per-agent children with it.
    for (const child of this.spans.values()) {
      if (child.parent === id && child.endedAt === undefined) {
        child.endedAt = now;
        this.changeQueue.ended.push(child.id);
      }
    }
    return true;
  }
}
