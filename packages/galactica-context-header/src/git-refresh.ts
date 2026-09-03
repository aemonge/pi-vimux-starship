const GIT_AFFECTING_TOOLS = new Set(['bash', 'edit', 'write']);

export function shouldRefreshGitAfterTool(toolName: string, isError: boolean): boolean {
  return !isError && GIT_AFFECTING_TOOLS.has(toolName);
}
