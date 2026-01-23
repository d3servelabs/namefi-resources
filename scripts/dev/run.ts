#!/usr/bin/env bun
/**
 * Dev Runner Script
 *
 * Handles:
 * 1. Pre-flight validation (secrets check with Infisical suggestion)
 * 2. Dynamic port block allocation (3000-3050, 3100-3150, etc.)
 * 3. Spawning dev services with allocated ports
 */

import { spawn, spawnSync } from 'node:child_process';
import net from 'node:net';
import { fileURLToPath } from 'node:url';

// Port offsets within each block
const PORT_OFFSETS = {
  BACKEND_API: 0, // base + 0
  FRONTEND: 1, // base + 1
  EMAIL_PREVIEW: 2, // base + 2
  TEMPORAL_WORKER: 3, // base + 3
  TEMPORAL_SERVER: 4, // base + 4
  TEMPORAL_UI: 5, // base + 5
} as const;

// Port range bases to try
const PORT_RANGE_BASES = [3000, 3100, 3200, 3300, 3400];

// Parse command line arguments
const args = process.argv.slice(2);
const mode = args.includes('--base')
  ? 'base'
  : args.includes('--frontend-only')
    ? 'frontend-only'
    : args.includes('--backend-only')
      ? 'backend-only'
      : 'full';

/**
 * Check if a port is available
 */
async function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port, '127.0.0.1');
  });
}

/**
 * Find the first available port block where all required ports are free
 */
async function findAvailablePortBlock(): Promise<number | null> {
  const requiredOffsets = Object.values(PORT_OFFSETS);

  for (const base of PORT_RANGE_BASES) {
    const portsToCheck = requiredOffsets.map((offset) => base + offset);
    const results = await Promise.all(portsToCheck.map(isPortAvailable));

    if (results.every(Boolean)) {
      return base;
    }

    console.log(
      `Port range ${base}-${base + 50} has conflicts, trying next range...`,
    );
  }

  return null;
}

/**
 * Check for Infisical credentials
 */
function checkInfisicalCredentials(): boolean {
  const token =
    process.env.INFISICAL_SERVICE_TOKEN || process.env.INFISICAL_TOKEN;
  return !!token;
}

/**
 * Print missing credentials message and exit
 */
function printMissingCredentialsAndExit(originalCommand: string): never {
  console.error(`
\x1b[31m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m
\x1b[31m  Missing Infisical Credentials\x1b[0m
\x1b[31m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m

  Required: Set \x1b[33mINFISICAL_SERVICE_TOKEN\x1b[0m environment variable

  \x1b[36mOption 1 - Export the token:\x1b[0m
    export INFISICAL_SERVICE_TOKEN=<your-token>
    ${originalCommand}

  \x1b[36mOption 2 - Run with Infisical CLI:\x1b[0m
    infisical run --token=$INFISICAL_SERVICE_TOKEN -- ${originalCommand}

  \x1b[36mGet your token from:\x1b[0m https://app.infisical.com

\x1b[31m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m
`);
  process.exit(1);
}

/**
 * Run secrets validation for a package
 */
function runSecretsValidation(
  packageName: string,
  cwd: string,
): { success: boolean; error?: string } {
  const result = spawnSync('bun', ['run', 'validate:secrets'], {
    cwd,
    stdio: 'pipe',
    env: { ...process.env },
  });

  if (result.status !== 0) {
    const error =
      result.error?.message ||
      result.stderr?.toString() ||
      result.stdout?.toString() ||
      'Unknown error';
    return {
      success: false,
      error,
    };
  }

  return { success: true };
}

/**
 * Print port allocation info
 */
function printPortAllocation(basePort: number): void {
  console.log(`
\x1b[32m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m
\x1b[32m  Port Allocation (Block: ${basePort}-${basePort + 50})\x1b[0m
\x1b[32m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m

  Backend API:      http://localhost:${basePort + PORT_OFFSETS.BACKEND_API}
  Frontend:         http://localhost:${basePort + PORT_OFFSETS.FRONTEND}
  Email Preview:    http://localhost:${basePort + PORT_OFFSETS.EMAIL_PREVIEW}
  Temporal Worker:  http://localhost:${basePort + PORT_OFFSETS.TEMPORAL_WORKER}
  Temporal Server:  localhost:${basePort + PORT_OFFSETS.TEMPORAL_SERVER} (gRPC)
  Temporal UI:      http://localhost:${basePort + PORT_OFFSETS.TEMPORAL_UI}

\x1b[32m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m
`);
}

/**
 * Spawn a process with inherited stdio
 */
function spawnProcess(
  command: string,
  args: string[],
  env: NodeJS.ProcessEnv,
  name: string,
  cwd?: string,
): ReturnType<typeof spawn> {
  const proc = spawn(command, args, {
    env,
    stdio: 'inherit',
    shell: false,
    cwd: cwd || process.cwd(),
  });

  proc.on('error', (err) => {
    console.error(`[${name}] Failed to start: ${err.message}`);
  });

  return proc;
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  const originalCommand = `bun run ${process.argv[1]}${args.length > 0 ? ' ' + args.join(' ') : ''}`;

  console.log('\n\x1b[36mDev Runner - Pre-flight checks...\x1b[0m\n');

  // Step 1: Check Infisical credentials
  if (!checkInfisicalCredentials()) {
    printMissingCredentialsAndExit(originalCommand);
  }
  console.log('\x1b[32m✓\x1b[0m Infisical credentials found');

  // Step 2: Load environment from .env and Infisical
  // We need to load secrets here so we can pass them to child processes
  console.log('Loading environment...');

  const projectRootUrl = new URL('../../', import.meta.url);
  const projectRoot = fileURLToPath(projectRootUrl);

  // Load .env file from project root
  // biome-ignore lint/correctness/noUndeclaredDependencies: available in monorepo
  const dotenv = await import('dotenv');
  dotenv.config({ path: `${projectRoot}.env`, override: true });

  // Load Infisical secrets
  try {
    // biome-ignore lint/correctness/noUndeclaredDependencies: available in monorepo
    const { loadInfisicalSecretsIfConfigured } = await import(
      '@namefi-astra/env/infisical'
    );
    await loadInfisicalSecretsIfConfigured({ allowEnvPassthrough: true });
    console.log('\x1b[32m✓\x1b[0m Environment loaded from Infisical');
  } catch (error) {
    console.error('\x1b[31m✗\x1b[0m Failed to load Infisical secrets:', error);
    printMissingCredentialsAndExit(originalCommand);
  }

  // Step 3: Run secrets validation
  console.log('\nValidating secrets...');

  const backendValidation = runSecretsValidation(
    'backend',
    `${projectRoot}apps/backend`,
  );
  if (!backendValidation.success) {
    console.error('\x1b[31m✗\x1b[0m Backend secrets validation failed:');
    console.error(backendValidation.error);
    process.exit(1);
  }
  console.log('\x1b[32m✓\x1b[0m Backend secrets validated');

  const frontendValidation = runSecretsValidation(
    'frontend',
    `${projectRoot}apps/frontend`,
  );
  if (!frontendValidation.success) {
    console.error('\x1b[31m✗\x1b[0m Frontend secrets validation failed:');
    console.error(frontendValidation.error);
    process.exit(1);
  }
  console.log('\x1b[32m✓\x1b[0m Frontend secrets validated');

  // Step 4: Allocate port block
  console.log('\nAllocating port block...');
  const basePort = await findAvailablePortBlock();

  if (basePort === null) {
    console.error(
      '\x1b[31m✗\x1b[0m No available port block found. All ranges (3000-3400) are occupied.',
    );
    console.error(
      '  Try closing other dev instances or manually specifying ports.',
    );
    process.exit(1);
  }

  printPortAllocation(basePort);

  // Step 5: Build environment with allocated ports
  const devEnv: NodeJS.ProcessEnv = {
    ...process.env,
    PORT: String(basePort + PORT_OFFSETS.BACKEND_API),
    FRONTEND_PORT: String(basePort + PORT_OFFSETS.FRONTEND),
    TEMPORAL_WORKER_PORT: String(basePort + PORT_OFFSETS.TEMPORAL_WORKER),
    EMAIL_PREVIEW_PORT: String(basePort + PORT_OFFSETS.EMAIL_PREVIEW),
    TEMPORAL_SERVER_PORT: String(basePort + PORT_OFFSETS.TEMPORAL_SERVER),
    TEMPORAL_UI_PORT: String(basePort + PORT_OFFSETS.TEMPORAL_UI),
    // Update backend URL for frontend to use
    BACKEND_URL: `http://localhost:${basePort + PORT_OFFSETS.BACKEND_API}`,
    // Update temporal API URL for backend
    TEMPORAL_API_URL: `localhost:${basePort + PORT_OFFSETS.TEMPORAL_SERVER}`,
  };

  // Step 6: Spawn processes based on mode
  const processes: ReturnType<typeof spawn>[] = [];

  const colors = {
    backendApi: 'blue.bold',
    frontend: 'green.bold',
    email: 'yellow.bold',
    temporalServer: 'red.bold',
    temporalWorker: 'cyan.bold',
  };

  if (mode === 'full') {
    // Full mode: all services via concurrently
    const concurrentlyArgs = [
      '-n',
      'backend:api,frontend,backend:email,temporal:server,temporal:worker',
      '-c',
      `${colors.backendApi},${colors.frontend},${colors.email},${colors.temporalServer},${colors.temporalWorker}`,
      '--',
      'bun run dev:backend:api:internal',
      'bun run dev:frontend:internal',
      'bun run dev:backend:email:internal',
      'bun run dev:temporal-server:internal',
      'bun run dev:backend:temporal:internal',
    ];

    const proc = spawnProcess(
      'bunx',
      ['concurrently', ...concurrentlyArgs],
      devEnv,
      'concurrently',
      projectRoot,
    );
    processes.push(proc);
  } else if (mode === 'base') {
    // Base mode: just backend API + frontend
    const concurrentlyArgs = [
      '-n',
      'backend:api,frontend',
      '-c',
      `${colors.backendApi},${colors.frontend}`,
      '--',
      'bun run dev:backend:api:internal',
      'bun run dev:frontend:internal',
    ];

    const proc = spawnProcess(
      'bunx',
      ['concurrently', ...concurrentlyArgs],
      devEnv,
      'concurrently',
      projectRoot,
    );
    processes.push(proc);
  } else if (mode === 'frontend-only') {
    const proc = spawnProcess(
      'bun',
      ['run', 'dev:frontend:internal'],
      devEnv,
      'frontend',
      projectRoot,
    );
    processes.push(proc);
  } else if (mode === 'backend-only') {
    const proc = spawnProcess(
      'bun',
      ['run', 'dev:backend:api:internal'],
      devEnv,
      'backend',
      projectRoot,
    );
    processes.push(proc);
  }

  // Handle graceful shutdown
  const cleanup = () => {
    console.log('\n\x1b[33mShutting down dev services...\x1b[0m');
    for (const proc of processes) {
      proc.kill('SIGTERM');
    }
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  // Wait for all processes to exit (handle both 'exit' and 'error' events)
  await Promise.all(
    processes.map(
      (proc) =>
        new Promise<void>((resolve) => {
          proc.on('exit', () => resolve());
          proc.on('error', () => resolve()); // Prevent hang if spawn fails
        }),
    ),
  );
}

main().catch((error) => {
  console.error('Dev runner failed:', error);
  process.exit(1);
});
