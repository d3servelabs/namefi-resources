#!/usr/bin/env node
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const os = require('node:os');

// Determine platform and architecture
const platform = os.platform();
const arch = os.arch();

// Map to package name
let packageName;
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

// Path to the sg binary
const sgPath = path.resolve(__dirname, 'node_modules', packageName, 'sg');

// Run the command with all arguments
const args = process.argv.slice(2);
const result = spawnSync(sgPath, args, { stdio: 'inherit' });

// Exit with the same code
process.exit(result.status);
