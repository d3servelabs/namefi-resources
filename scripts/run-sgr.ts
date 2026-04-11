#!/usr/bin/env bun
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Path to the sg binary (resolve from project root, not scripts directory)
const projectRoot = path.resolve(__dirname, '..');
const sgBinary = process.platform === 'win32' ? 'sg.cmd' : 'sg';
const sgPath = path.resolve(projectRoot, 'node_modules', '.bin', sgBinary);

if (!fs.existsSync(sgPath)) {
  console.error(`Could not find ast-grep binary at ${sgPath}`);
  process.exit(1);
}

// Run the command with all arguments from project root
const args: string[] = process.argv.slice(2);
const command = process.platform === 'win32' ? 'cmd.exe' : sgPath;
const commandArgs =
  process.platform === 'win32'
    ? [
        // Windows requires running .cmd via cmd.exe /c because spawnSync cannot execute .cmd files directly.
        '/c',
        sgPath,
        ...args,
      ]
    : args;
const result = spawnSync(command, commandArgs, {
  stdio: 'inherit',
  cwd: projectRoot,
});

if (result.error) {
  console.error(`Failed to launch ast-grep: ${result.error.message}`);
  process.exit(1);
}

// Exit with the same code
process.exit(result.status ?? 1);
