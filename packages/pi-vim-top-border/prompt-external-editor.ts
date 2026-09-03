import { spawn, type ChildProcess } from 'node:child_process';
import { chmod, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export type PromptEditorSurface = {
  getExpandedText(): string;
  setText(text: string): void;
  setBorderOverride(colorizer: ((text: string) => string) | null): void;
};

type PromptExternalEditorOptions = {
  agentDir: string;
  cwd: string;
  editor: PromptEditorSurface;
  mutedBorder: (text: string) => string;
  notifyError: (message: string) => void;
};

export class PromptExternalEditor {
  private opening = false;
  private active = true;
  private child: ChildProcess | null = null;

  constructor(private readonly options: PromptExternalEditorOptions) {}

  open(): Promise<void> {
    if (this.opening || !this.active) return Promise.resolve();
    this.opening = true;
    return this.openPrompt();
  }

  dispose(): void {
    this.active = false;
    this.child?.kill();
    this.child = null;
    this.options.editor.setBorderOverride(null);
  }

  private async openPrompt(): Promise<void> {
    let directory: string | undefined;
    this.options.editor.setBorderOverride(this.options.mutedBorder);

    try {
      // Let Pi paint the muted ownership state before Neovim takes focus.
      await new Promise<void>((resolve) => setImmediate(resolve));

      const command = await resolveExternalEditor(
        this.options.agentDir,
        this.options.cwd,
      );
      directory = await mkdtemp(join(tmpdir(), 'pi-nvim-prompt-'));
      await chmod(directory, 0o700);
      const promptFile = join(directory, 'prompt.md');
      await writeFile(promptFile, this.options.editor.getExpandedText(), {
        encoding: 'utf8',
        mode: 0o600,
      });

      await this.runEditor(command, promptFile);
      const edited = (await readFile(promptFile, 'utf8')).replace(/\n$/, '');
      if (this.active) this.options.editor.setText(edited);
    } catch (error) {
      if (this.active) {
        this.options.notifyError(`Neovim prompt editor: ${formatError(error)}`);
      }
    } finally {
      this.child = null;
      this.opening = false;
      this.options.editor.setBorderOverride(null);
      if (directory) {
        await rm(directory, { recursive: true, force: true }).catch(() => undefined);
      }
    }
  }

  private runEditor(command: string, promptFile: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, [promptFile], {
        env: process.env,
        stdio: 'ignore',
      });
      this.child = child;
      let settled = false;

      child.once('error', (error) => {
        if (settled) return;
        settled = true;
        reject(error);
      });
      child.once('close', (code, signal) => {
        if (settled) return;
        settled = true;
        if (code === 0) {
          resolve();
          return;
        }
        const detail = signal ? `signal ${signal}` : `exit ${code ?? 'unknown'}`;
        reject(new Error(`editor closed with ${detail}`));
      });
    });
  }
}

async function resolveExternalEditor(agentDir: string, cwd: string): Promise<string> {
  const globalEditor = await readExternalEditor(join(agentDir, 'settings.json'));
  const projectEditor = await readExternalEditor(join(cwd, '.pi', 'settings.json'));
  const command = projectEditor ?? globalEditor;
  if (!command) throw new Error('externalEditor is not configured');
  return command;
}

async function readExternalEditor(path: string): Promise<string | undefined> {
  try {
    const parsed = JSON.parse(await readFile(path, 'utf8')) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return;
    const value = (parsed as { externalEditor?: unknown }).externalEditor;
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  } catch {
    return undefined;
  }
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
