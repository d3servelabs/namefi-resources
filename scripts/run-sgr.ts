#!/usr/bin/env bun
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Define supported platform and architecture combinations
type SupportedPlatform = 'darwin' | 'linux' | 'win32';
type SupportedArch = 'arm64' | 'x64' | 'ia32';

// Determine platform and architecture
const platform = os.platform() as SupportedPlatform;
const arch = os.arch() as SupportedArch;

// Map to package name
let packageName: string;
if (platform === 'darwin' && arch === 'arm64') {
  packageName = '@ast-grep/cli-darwin-arm64';
} else if (platform === 'darwin' && arch === 'x64') {
  packageName = '@ast-grep/cli-darwin-x64';
} else if (platform === 'linux' && arch === 'x64') {
  packageName = '@ast-grep/cli-linux-x64-gnu';
} else if (platform === 'linux' && arch === 'arm64') {
  packageName = '@ast-grep/cli-linux-arm64-gnu';
} else if (platform === 'win32' && arch === 'x64') {
  packageName = '@ast-grep/cli-win32-x64-msvc';
} else if (platform === 'win32' && arch === 'ia32') {
  packageName = '@ast-grep/cli-win32-ia32-msvc';
} else if (platform === 'win32' && arch === 'arm64') {
  packageName = '@ast-grep/cli-win32-arm64-msvc';
} else {
  console.error(`Unsupported platform: ${platform} ${arch}`);
  process.exit(1);
}

// Path to the sg binary (resolve from project root, not scripts directory)
const projectRoot = path.resolve(__dirname, '..');
const sgPath: string = path.resolve(
  projectRoot,
  'node_modules',
  packageName,
  'sg',
);

// Run the command with all arguments from project root
const args: string[] = process.argv.slice(2);
const result = spawnSync(sgPath, args, {
  stdio: 'inherit',
  cwd: projectRoot,
});

// Exit with the same code
process.exit(result.status ?? 1);
