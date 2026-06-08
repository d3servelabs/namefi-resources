import { basename } from 'node:path';
import { bundleWorkflowCode } from '@temporalio/worker';
import type { LogLevel, LogMetadata, Logger } from '@temporalio/worker';

export interface WorkflowResult {
  workflow: string;
  success: boolean;
  error?: string;
  duration?: number;
  /** Full captured webpack/bundler log lines (only populated on failure). */
  bundleLogs?: string[];
}

/**
 * Implements the `@temporalio/worker` `Logger` interface while capturing every
 * line so the parent process can surface module-resolution errors. Each level
 * is prefixed so the orchestrator can colorize/scan them.
 */
class MemoryLogger implements Logger {
  private logs: string[] = [];

  log(level: LogLevel, message: string, meta?: LogMetadata): void {
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    this.logs.push(`[${level}] ${message}${metaStr}`);
  }

  trace(message: string, meta?: LogMetadata): void {
    this.log('TRACE', message, meta);
  }
  debug(message: string, meta?: LogMetadata): void {
    this.log('DEBUG', message, meta);
  }
  info(message: string, meta?: LogMetadata): void {
    this.log('INFO', message, meta);
  }
  warn(message: string, meta?: LogMetadata): void {
    this.log('WARN', message, meta);
  }
  error(message: string, meta?: LogMetadata): void {
    this.log('ERROR', message, meta);
  }

  getLogs(): string[] {
    return [...this.logs];
  }
}

export async function testWorkflowBundle(
  workflowPath: string,
): Promise<WorkflowResult> {
  const startTime = Date.now();
  const logger = new MemoryLogger();
  const workflow = basename(workflowPath);

  try {
    await bundleWorkflowCode({
      workflowsPath: workflowPath,
      logger,
    });

    return { workflow, success: true, duration: Date.now() - startTime };
  } catch (error) {
    return {
      workflow,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown bundling error',
      duration: Date.now() - startTime,
      bundleLogs: logger.getLogs(),
    };
  }
}

// Worker entrypoint: bundle the single workflow passed as argv[2] and emit the
// result as a single JSON line on stdout. Exit code mirrors success/failure.
async function main(): Promise<void> {
  const workflowPath = process.argv[2];

  if (!workflowPath) {
    process.stderr.write('No workflow path provided\n');
    process.exit(1);
  }

  const startTime = Date.now();
  const result = await testWorkflowBundle(workflowPath).catch((error) => ({
    workflow: basename(workflowPath),
    success: false,
    error: error instanceof Error ? error.message : 'Unknown error',
    duration: Date.now() - startTime,
  }));

  // Flush the JSON line before exiting; an immediate process.exit() can truncate
  // a piped write. We still exit explicitly (rather than letting the event loop
  // drain) because the bundler may leave handles open that would hang the worker.
  process.stdout.write(`${JSON.stringify(result)}\n`, () => {
    process.exit(result.success ? 0 : 1);
  });
}

// Only run when executed as a worker subprocess (a workflow path was passed).
if (process.argv.length > 2) {
  main().catch((error) => {
    process.stderr.write(`Worker error: ${error?.message ?? error}\n`);
    process.exit(1);
  });
}
