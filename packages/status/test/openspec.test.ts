import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import {
  collectOpenSpec,
  collectOpenSpecOverview,
  parseOpenSpecList,
  parseTaskHierarchy,
  parseTaskMarkdown,
} from '../src/openspec.ts';
import type { CommandRunner } from '../src/types.ts';

test('extracts OpenSpec task counts and pending story titles', () => {
  const tasks = parseTaskMarkdown(`
# Tasks
- [x] 1.1 Discovery Spike. Acceptance: done
- [ ] 2.1 Build publisher Story. User need: compact status
- [ ] 2.2 Verify reload behavior
`);

  assert.equal(tasks.length, 3);
  assert.equal(tasks.filter((task) => task.done).length, 1);
  assert.deepEqual(tasks[1], {
    id: '2.1',
    title: 'Build publisher',
    kind: 'Story',
    done: false,
  });
});

test('extracts bounded Ramona Task and focused Step progress', () => {
  const hierarchy = parseTaskHierarchy(`
## Task 1 — First value
- [x] Step 1.1 Build it
- [-] Step 1.2 Check it
### Human validation
- [ ] Human validates first value

## Task 2 — Accepted value
- [x] Step 2.1 Build it
### Human validation
- [x] Human validates second value
`);

  assert.deepEqual(hierarchy, {
    tasks: { completed: 1, total: 2 },
    stepsByTask: {
      '1': { completed: 1, total: 2 },
      '2': { completed: 1, total: 1 },
    },
  });
});

test('preserves focus task IDs when headlines contain child Step labels', () => {
  const tasks = parseTaskMarkdown(`
- [ ] Step 1.1 Create root-level \`greeting.txt\` with exact contents
- [ ] Task 2.3 Verify the focused footer
`);

  assert.deepEqual(tasks, [
    {
      id: '1',
      title: 'Step 1.1 Create root-level `greeting.txt` with exact contents',
      done: false,
    },
    {
      id: '2',
      title: 'Task 2.3 Verify the focused footer',
      done: false,
    },
  ]);
});

test('malformed Markdown produces no tasks without throwing', () => {
  assert.deepEqual(parseTaskMarkdown('# Tasks\nnot a checklist\n- [maybe] nope'), []);
});

test('OpenSpec list rejects malformed structures', () => {
  assert.throws(() => parseOpenSpecList({ changes: 'nope' }), /changes array/);
});

test('OpenSpec overview aggregates Plans and Tasks while excluding Ramona Ideas', async () => {
  const root = await mkdtemp(join(tmpdir(), 'galactica-openspec-overview-'));
  await mkdir(join(root, 'openspec', 'changes', 'idea'), { recursive: true });
  await writeFile(
    join(root, 'openspec', 'changes', 'idea', '.openspec.yaml'),
    'schema: ramona-idea\n',
    'utf8',
  );
  const overview = async (changes: unknown[]) =>
    collectOpenSpecOverview({
      cwd: root,
      runner: async () => ({
        code: 0,
        stdout: JSON.stringify({ changes, root: { path: root } }),
        stderr: '',
      }),
    });

  try {
    assert.deepEqual(
      await overview([
        {
          name: 'active',
          completedTasks: 1,
          totalTasks: 2,
          lastModified: '',
          status: 'in-progress',
        },
        {
          name: 'idea',
          completedTasks: 0,
          totalTasks: 0,
          lastModified: '',
          status: 'no-tasks',
        },
      ]),
      {
        projectRoot: root,
        actionableChanges: 1,
        totalChanges: 2,
        completedPlans: 0,
        totalPlans: 1,
        completedTasks: 1,
        totalTasks: 2,
      },
    );
    assert.deepEqual(
      await overview([
        {
          name: 'complete',
          completedTasks: 2,
          totalTasks: 2,
          lastModified: '',
          status: 'complete',
        },
      ]),
      {
        projectRoot: root,
        actionableChanges: 0,
        totalChanges: 1,
        completedPlans: 1,
        totalPlans: 1,
        completedTasks: 2,
        totalTasks: 2,
      },
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('missing task file falls back to apply-instruction tasks', async () => {
  const root = await mkdtemp(join(tmpdir(), 'galactica-openspec-'));
  const missingTasks = join(root, 'openspec', 'changes', 'demo', 'tasks.md');
  const runner: CommandRunner = async (_command, args) => {
    const subcommand = args[0];
    if (subcommand === 'list') {
      return {
        code: 0,
        stdout: JSON.stringify({
          changes: [
            {
              name: 'demo',
              completedTasks: 1,
              totalTasks: 2,
              lastModified: '2026-01-01T00:00:00Z',
              status: 'in-progress',
            },
          ],
          root: { path: root },
        }),
        stderr: '',
      };
    }
    if (subcommand === 'show') {
      return {
        code: 0,
        stdout: JSON.stringify({ id: 'demo', title: 'Build a demo' }),
        stderr: '',
      };
    }
    return {
      code: 0,
      stdout: JSON.stringify({
        progress: { total: 2, complete: 1 },
        contextFiles: { tasks: [missingTasks] },
        tasks: [
          { id: '1', description: '1.1 Setup Story', done: true },
          { id: '2', description: '1.2 Publish status Story', done: false },
        ],
      }),
      stderr: '',
    };
  };

  try {
    const state = await collectOpenSpec({
      cwd: root,
      runner,
      now: 100,
      configuredChange: 'demo',
    });
    assert.equal(state?.completedTasks, 1);
    assert.equal(state?.totalTasks, 2);
    assert.equal(state?.pendingTasks[0]?.id, '1.2');
    assert.equal(state?.pendingTasks[0]?.title, 'Publish status');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('shows a newly created incomplete change before tasks exist', async () => {
  const root = await mkdtemp(join(tmpdir(), 'galactica-openspec-'));
  const runner: CommandRunner = async (_command, args) => {
    if (args[0] === 'list') {
      return {
        code: 0,
        stdout: JSON.stringify({
          changes: [
            {
              name: 'a',
              completedTasks: 0,
              totalTasks: 0,
              lastModified: '2026-01-01T00:00:00Z',
              status: 'no-tasks',
            },
          ],
          root: { path: root },
        }),
        stderr: '',
      };
    }
    if (args[0] === 'show') {
      return { code: 0, stdout: JSON.stringify({ title: 'a' }), stderr: '' };
    }
    return { code: 1, stdout: '', stderr: 'artifacts are not ready' };
  };

  try {
    const state = await collectOpenSpec({
      cwd: root,
      runner,
      configuredChange: 'a',
    });
    assert.equal(state?.changeId, 'a');
    assert.equal(state?.phase, 'no-tasks');
    assert.equal(state?.completedTasks, 0);
    assert.equal(state?.totalTasks, 0);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('malformed task file preserves the instruction fallback', async () => {
  const root = await mkdtemp(join(tmpdir(), 'galactica-openspec-'));
  const tasksPath = join(root, 'tasks.md');
  await writeFile(tasksPath, 'not a task list', 'utf8');
  const runner: CommandRunner = async (_command, args) => {
    if (args[0] === 'list') {
      return {
        code: 0,
        stdout: JSON.stringify({
          changes: [
            {
              name: 'demo',
              completedTasks: 0,
              totalTasks: 1,
              lastModified: '2026-01-01T00:00:00Z',
              status: 'in-progress',
            },
          ],
          root: { path: root },
        }),
        stderr: '',
      };
    }
    if (args[0] === 'show') {
      return { code: 0, stdout: JSON.stringify({ title: 'Demo' }), stderr: '' };
    }
    return {
      code: 0,
      stdout: JSON.stringify({
        contextFiles: { tasks: [tasksPath] },
        tasks: [{ id: '1', description: '1.1 Real task Story', done: false }],
      }),
      stderr: '',
    };
  };

  try {
    const state = await collectOpenSpec({
      cwd: root,
      runner,
      configuredChange: 'demo',
    });
    assert.equal(state?.pendingTasks[0]?.title, 'Real task');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
