export interface ActiveRuntimeRuns {
  children: number;
  subagents: number;
}

function record(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function activeSubagentCount(partialResult: unknown): number | undefined {
  const details = record(record(partialResult)?.details);
  if (details?.kind !== 'pi-subagent' || !Array.isArray(details.results)) {
    return undefined;
  }

  return details.results.reduce((count, rawResult) => {
    const result = record(rawResult);
    return result?.exitCode === -1 &&
      result.sawAgentStart === true &&
      result.sawAgentSettled !== true
      ? count + 1
      : count;
  }, 0);
}

export class RuntimeRunTracker {
  private readonly activeBash = new Set<string>();
  private readonly activeSubagents = new Map<string, number>();

  begin(toolCallId: string, toolName: string): boolean {
    if (toolName === 'bash') {
      const size = this.activeBash.size;
      this.activeBash.add(toolCallId);
      return this.activeBash.size !== size;
    }
    if (toolName !== 'subagent' || this.activeSubagents.has(toolCallId)) {
      return false;
    }
    this.activeSubagents.set(toolCallId, 0);
    return true;
  }

  update(toolCallId: string, partialResult: unknown): boolean {
    if (!this.activeSubagents.has(toolCallId)) return false;
    const active = activeSubagentCount(partialResult);
    if (active === undefined || this.activeSubagents.get(toolCallId) === active) {
      return false;
    }
    this.activeSubagents.set(toolCallId, active);
    return true;
  }

  finish(toolCallId: string): boolean {
    const removedBash = this.activeBash.delete(toolCallId);
    const removedSubagent = this.activeSubagents.delete(toolCallId);
    return removedBash || removedSubagent;
  }

  snapshot(): ActiveRuntimeRuns {
    const subagents = [...this.activeSubagents.values()].reduce(
      (sum, active) => sum + active,
      0,
    );
    return {
      children: this.activeBash.size + subagents,
      subagents,
    };
  }
}
