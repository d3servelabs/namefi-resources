import { spawn, type ChildProcess } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { cpus } from 'node:os';
import { basename, join, relative } from 'node:path';
import { parseArgs } from 'node:util';
import pMap from 'p-map';
import { colors, console_utils } from './terminal-utils';
// Type-only import: must NOT pull the worker module in at runtime, otherwise its
// argv-based entrypoint would fire when this orchestrator is run with CLI flags.
import type { WorkflowResult } from './workflow-bundle-worker';

type WorkflowRun = WorkflowResult & { index: number };

const scriptDir = import.meta.dirname || __dirname;
const workerScript = join(scriptDir, 'workflow-bundle-worker.ts');
const workflowsDir = join(scriptDir, '../src/temporal/workflows');
const logsDir = join(scriptDir, '../workflow-bundle-logs');

// Track live subprocesses so SIGINT can tear them down instead of orphaning them.
const activeChildren = new Set<ChildProcess>();

interface CliOptions {
  filters: string[];
  concurrency: number;
  timeoutMs: number;
  json: boolean;
}

function printHelp(): void {
  const defaultConcurrency = Math.max(2, cpus().length - 1);
  console.log(`
Bundle each Temporal workflow individually to find which one breaks the worker bundle.

Usage:
  bun run test:workflows [options]

Options:
  --filter <substr>     Only bundle workflows whose filename includes <substr>.
                        Repeatable and comma-separated (e.g. --filter mint,charge).
  -c, --concurrency <n> Parallel bundles (default: CPU count - 1 = ${defaultConcurrency},
                        or $MAX_CONCURRENT_PROCESSES).
  --timeout <ms>        Per-workflow bundle timeout (default: 60000).
  --json                Emit a machine-readable JSON summary, suppress the TUI.
  -h, --help            Show this help.

Exit code is non-zero when any workflow fails to bundle (CI-friendly).
`);
}

function parseCliOptions(): CliOptions {
  // parseArgs throws on unknown flags / malformed values; surface a clean
  // one-line message + non-zero exit instead of an internal stack trace.
  const { values } = (() => {
    try {
      return parseArgs({
        options: {
          filter: { type: 'string', multiple: true },
          concurrency: { type: 'string', short: 'c' },
          timeout: { type: 'string' },
          json: { type: 'boolean', default: false },
          help: { type: 'boolean', short: 'h', default: false },
        },
        allowPositionals: false,
      });
    } catch (error) {
      process.stderr.write(
        `${error instanceof Error ? error.message : error}\n`,
      );
      process.exit(1);
    }
  })();

  if (values.help) {
    printHelp();
    process.exit(0);
  }

  const filters = (values.filter ?? [])
    .flatMap((value) => value.split(','))
    .map((value) => value.trim())
    .filter(Boolean);

  const defaultConcurrency = Math.max(2, cpus().length - 1);
  // Non-empty falsy guard (`||`) intentionally lets "0"/"-1" through to be
  // rejected, while empty string / undefined fall back to the default.
  const concurrencyRaw =
    values.concurrency || process.env.MAX_CONCURRENT_PROCESSES || '';
  const concurrency = concurrencyRaw
    ? parsePositiveInt(concurrencyRaw, '--concurrency')
    : defaultConcurrency;

  const timeoutMs = values.timeout
    ? parsePositiveInt(values.timeout, '--timeout')
    : 60000;

  return { filters, concurrency, timeoutMs, json: values.json ?? false };
}

// Parse a CLI/env numeric option, failing fast with a clear message rather than
// silently falling back (which would mask typos and allow invalid concurrency).
function parsePositiveInt(raw: string, label: string): number {
  const value = Number.parseInt(raw, 10);
  if (!Number.isInteger(value) || value < 1) {
    process.stderr.write(
      `${label} must be a positive integer (got "${raw}")\n`,
    );
    process.exit(1);
  }
  return value;
}

// Recursively collect every *.workflow.ts file under the workflows directory.
function findWorkflowFiles(dir: string): string[] {
  const workflowPaths: string[] = [];

  for (const item of readdirSync(dir)) {
    if (item === 'index.ts' || item.startsWith('.')) continue;

    const fullPath = join(dir, item);
    if (statSync(fullPath).isDirectory()) {
      workflowPaths.push(...findWorkflowFiles(fullPath));
    } else if (item.endsWith('.workflow.ts')) {
      workflowPaths.push(fullPath);
    }
  }

  return workflowPaths;
}

// Bundle a single workflow in an isolated `bun` subprocess. Isolation means a
// crash, OOM, or hang in one bundle cannot poison the others, and each is
// independently killable on timeout.
function runWorkflowInWorker(
  workflowPath: string,
  // Path relative to the workflows dir (e.g. `payments/mint.workflow.ts`) so two
  // workflows sharing a filename in different folders stay distinguishable.
  displayName: string,
  timeoutMs: number,
): Promise<WorkflowResult> {
  const startTime = Date.now();
  const workflow = displayName;

  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    let settled = false;

    const child = spawn('bun', [workerScript, workflowPath], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    activeChildren.add(child);

    const settle = (result: WorkflowResult): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      activeChildren.delete(child);
      resolve(result);
    };

    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      settle({
        workflow,
        success: false,
        error: `Timeout after ${timeoutMs}ms`,
        duration: Date.now() - startTime,
      });
    }, timeoutMs);

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });
    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      const duration = Date.now() - startTime;
      // The worker emits a single JSON line; take the last non-empty line in
      // case anything else slipped onto stdout.
      const jsonLine = stdout.trim().split('\n').filter(Boolean).pop();

      if (jsonLine) {
        try {
          const parsed = JSON.parse(jsonLine) as WorkflowResult;
          settle({
            ...parsed,
            workflow,
            duration: parsed.duration ?? duration,
          });
          return;
        } catch {
          // fall through to the error path below
        }
      }

      settle({
        workflow,
        success: false,
        error: stderr.trim() || `Process exited with code ${code}`,
        duration,
      });
    });

    child.on('error', (error) => {
      settle({
        workflow,
        success: false,
        error: `Process error: ${error.message}`,
        duration: Date.now() - startTime,
      });
    });
  });
}

const RESOLUTION_ERROR_RE =
  /module not found|can'?t resolve|cannot resolve|failed to resolve/i;

// Pull out the lines that actually point at the offending import — this is the
// whole reason the tool exists, so it leads the failure report.
function extractResolutionHints(logs: string[] | undefined): string[] {
  if (!logs?.length) return [];
  return logs.filter((line) => RESOLUTION_ERROR_RE.test(line));
}

function colorizeLogLevels(line: string): string {
  return line
    .replace(/\[ERROR\]/g, `${colors.red}[ERROR]${colors.reset}`)
    .replace(/\[WARN(ING)?\]/g, `${colors.yellow}[WARN$1]${colors.reset}`)
    .replace(/\[INFO\]/g, `${colors.cyan}[INFO]${colors.reset}`)
    .replace(/\[DEBUG\]/g, `${colors.gray}[DEBUG]${colors.reset}`);
}

function safeWorkflowName(workflow: string): string {
  return workflow.replace(/[^a-zA-Z0-9.-]/g, '_');
}

async function writeLogsToFiles(
  results: WorkflowRun[],
  quiet: boolean,
): Promise<void> {
  try {
    await mkdir(logsDir, { recursive: true });

    const now = new Date().toISOString();
    const day = now.replace(/[:.]/g, '-').split('T')[0];
    const stamp = now.replace(/[:.]/g, '-');

    const summaryLines = [
      `Workflow Bundle Test Report - ${now}`,
      '='.repeat(60),
      '',
      `Total workflows tested: ${results.length}`,
      `Successful: ${results.filter((r) => r.success).length}`,
      `Failed: ${results.filter((r) => !r.success).length}`,
      '',
      'Results:',
      ...results.map(
        (r) =>
          `${r.success ? '✅' : '❌'} ${r.workflow} (${r.duration}ms)${r.success ? '' : ` - ${r.error}`}`,
      ),
      '',
    ];
    await writeFile(
      join(logsDir, `summary-${day}.txt`),
      summaryLines.join('\n'),
    );

    for (const failure of results.filter((r) => !r.success)) {
      if (!failure.bundleLogs?.length) continue;
      const logContent = [
        `Workflow Bundle Failure: ${failure.workflow}`,
        `Timestamp: ${now}`,
        `Duration: ${failure.duration}ms`,
        `Error: ${failure.error}`,
        '='.repeat(60),
        '',
        ...failure.bundleLogs,
        '',
      ].join('\n');
      await writeFile(
        join(logsDir, `${safeWorkflowName(failure.workflow)}-${stamp}.log`),
        logContent,
      );
    }

    if (!quiet) console.log(`\n📁 Logs written to: ${logsDir}`);
  } catch (error) {
    if (!quiet) console.log(`⚠️  Failed to write logs to files: ${error}`);
  }
}

function reportFailures(failed: WorkflowRun[]): void {
  console.log('\n💥 Failed workflows:');
  for (const failure of failed) {
    console.log(
      `\n${colors.red}❌ ${failure.workflow}${colors.reset} ${colors.gray}(${failure.duration}ms)${colors.reset}`,
    );
    console.log(`   ${colors.bright}Error:${colors.reset} ${failure.error}`);

    const hints = extractResolutionHints(failure.bundleLogs);
    if (hints.length > 0) {
      console.log(
        `   ${colors.yellow}Likely cause (unresolved imports):${colors.reset}`,
      );
      for (const hint of hints.slice(0, 5)) {
        console.log(`     ${colorizeLogLevels(hint)}`);
      }
    } else if (failure.bundleLogs?.length) {
      console.log('   Bundle logs (first 5 lines):');
      for (const line of failure.bundleLogs.slice(0, 5)) {
        console.log(`     ${colorizeLogLevels(line)}`);
      }
    }
    console.log(
      `     ${colors.gray}↳ full log: workflow-bundle-logs/${safeWorkflowName(failure.workflow)}-*.log${colors.reset}`,
    );
  }

  console.log('\n💡 Common bundle failure causes:');
  console.log('   - Imports from Node.js built-in modules (fs, path, etc.)');
  console.log(
    '   - Imports from packages not compatible with webpack bundling',
  );
  console.log('   - Dynamic imports or require() calls');
  console.log('   - Circular dependencies between workflow files');
}

const SPINNER = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

function truncateError(error: string | undefined): string {
  if (!error) return '';
  const firstLine = error.split('\n')[0];
  return firstLine.length > 80 ? `${firstLine.slice(0, 79)}…` : firstLine;
}

// Compact progress renderer: completed workflows scroll past as normal log lines
// while a single, in-place status line tracks the live counts. Unlike a full
// task-list redraw, this never exceeds one row, so it cannot smear when there
// are more workflows than terminal rows. Falls back to plain prints when stdout
// is not a TTY (piped output / CI).
class ProgressReporter {
  private completed = 0;
  private succeeded = 0;
  private failed = 0;
  private running = 0;
  private frame = 0;
  private timer: ReturnType<typeof setInterval> | null = null;
  private readonly isTty = Boolean(process.stdout.isTTY);

  constructor(private readonly total: number) {}

  start(): void {
    if (!this.isTty) return;
    process.stdout.write(console_utils.hideCursor);
    this.timer = setInterval(() => {
      this.frame = (this.frame + 1) % SPINNER.length;
      this.renderLive();
    }, 100);
  }

  taskStarted(): void {
    this.running += 1;
    this.renderLive();
  }

  taskFinished(result: WorkflowResult): void {
    this.running = Math.max(0, this.running - 1);
    this.completed += 1;
    if (result.success) this.succeeded += 1;
    else this.failed += 1;

    const duration = `${colors.gray}(${result.duration}ms)${colors.reset}`;
    const line = result.success
      ? `${colors.green}✅${colors.reset} ${result.workflow} ${duration}`
      : `${colors.red}❌ ${result.workflow}${colors.reset} ${duration} ${colors.gray}— ${truncateError(result.error)}${colors.reset}`;

    if (this.isTty) process.stdout.write(`\r${console_utils.clearLine}`);
    process.stdout.write(`${line}\n`);
    this.renderLive();
  }

  private renderLive(): void {
    if (!this.isTty) return;
    const spinner = `${colors.cyan}${SPINNER[this.frame]}${colors.reset}`;
    const cols = process.stdout.columns ?? 80;
    let bar = '';
    if (cols >= 70) {
      const width = 16;
      const filled = this.total
        ? Math.round((this.completed / this.total) * width)
        : 0;
      bar = ` ${colors.gray}[${'█'.repeat(filled)}${'░'.repeat(width - filled)}]${colors.reset}`;
    }
    const status =
      `${spinner}${bar} ${colors.bright}${this.completed}/${this.total}${colors.reset} ` +
      `${colors.green}✅ ${this.succeeded}${colors.reset} ` +
      `${colors.red}❌ ${this.failed}${colors.reset} ` +
      `${colors.gray}⏳ ${this.running} running${colors.reset}`;
    process.stdout.write(`\r${console_utils.clearLine}${status}`);
  }

  finish(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    if (this.isTty) {
      process.stdout.write(
        `\r${console_utils.clearLine}${console_utils.showCursor}`,
      );
    }
  }
}

async function runWorkflows(
  workflowPaths: string[],
  options: CliOptions,
): Promise<WorkflowRun[]> {
  const reporter = options.json
    ? null
    : new ProgressReporter(workflowPaths.length);

  if (!options.json) {
    console.log(
      `🧪 Bundling ${colors.bright}${workflowPaths.length}${colors.reset} workflows individually ` +
        `${colors.gray}(concurrency ${options.concurrency}, timeout ${options.timeoutMs / 1000}s)${colors.reset}\n`,
    );
  }

  reporter?.start();
  try {
    return await pMap(
      workflowPaths,
      async (workflowPath, index) => {
        reporter?.taskStarted();
        const result = await runWorkflowInWorker(
          workflowPath,
          relative(workflowsDir, workflowPath),
          options.timeoutMs,
        );
        reporter?.taskFinished(result);
        return { ...result, index };
      },
      { concurrency: options.concurrency },
    );
  } finally {
    reporter?.finish();
  }
}

async function main(): Promise<void> {
  const options = parseCliOptions();

  let workflowPaths = findWorkflowFiles(workflowsDir);
  if (options.filters.length > 0) {
    workflowPaths = workflowPaths.filter((wf) =>
      options.filters.some((filter) => basename(wf).includes(filter)),
    );
  }

  if (workflowPaths.length === 0) {
    const message = options.filters.length
      ? `No workflows matched filter(s): ${options.filters.join(', ')}`
      : 'No *.workflow.ts files found.';
    if (options.json) {
      process.stdout.write(`${JSON.stringify({ total: 0, results: [] })}\n`);
    } else {
      console.log(message);
    }
    process.exit(options.filters.length ? 1 : 0);
  }

  const results = await runWorkflows(workflowPaths, options);

  results.sort((a, b) => a.index - b.index);
  const successful = results
    .filter((r) => r.success)
    .sort((a, b) => (b.duration ?? 0) - (a.duration ?? 0));
  const failed = results
    .filter((r) => !r.success)
    .sort((a, b) => (b.duration ?? 0) - (a.duration ?? 0));

  await writeLogsToFiles(results, options.json);

  if (options.json) {
    const summary = {
      total: results.length,
      successful: successful.length,
      failed: failed.length,
      concurrency: options.concurrency,
      timeoutMs: options.timeoutMs,
      results: results.map(({ workflow, success, duration, error }) => ({
        workflow,
        success,
        duration,
        error,
      })),
    };
    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
    process.exit(failed.length > 0 ? 1 : 0);
  }

  if (failed.length === 0) {
    console.log('\n🎉 All workflows bundle successfully!');
  } else {
    reportFailures(failed);
  }

  console.log('\n📊 Results:');
  console.log(
    `${colors.green}✅ Successful: ${successful.length}${colors.reset}`,
  );
  console.log(`${colors.red}❌ Failed: ${failed.length}${colors.reset}`);
  if (failed.length > 0) {
    console.log(
      `   ${colors.red}${failed.map((f) => f.workflow).join('\n   ')}${colors.reset}`,
    );
  }

  process.exit(failed.length > 0 ? 1 : 0);
}

process.on('SIGINT', () => {
  for (const child of activeChildren) child.kill('SIGKILL');
  process.stdout.write(
    `\r${console_utils.clearLine}${console_utils.showCursor}`,
  );
  process.stdout.write(`${colors.yellow}Aborted by user.${colors.reset}\n`);
  process.exit(130);
});

main().catch((error) => {
  process.stdout.write(console_utils.showCursor);
  process.stderr.write(`${error?.stack ?? error}\n`);
  process.exit(1);
});
