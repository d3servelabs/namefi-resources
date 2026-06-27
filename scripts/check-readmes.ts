#!/usr/bin/env bun
// Validates that changed folders with more than five direct files have README coverage.
// The check follows touched files up to the repo root so documentation stays discoverable.
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const README_FILE = 'README.md';
const FILE_THRESHOLD = 5;
const CHANGED_FILE_FILTER = '--diff-filter=ACDMRTUXB';
const DELETED_FILE_FILTER = '--diff-filter=D';
const README_EXEMPT_DIRS = new Map([
  [
    '.rulesync/rules',
    'RuleSync treats every Markdown file in this folder as a rule; see .rulesync/README.md.',
  ],
]);

function git(args: string[]): string {
  return execFileSync('git', args, { encoding: 'utf8' }).trim();
}

const repoRoot = git(['rev-parse', '--show-toplevel']);
process.chdir(repoRoot);

function splitLines(output: string): string[] {
  return output.split('\n').filter(Boolean);
}

function tryGit(args: string[]): string {
  try {
    return git(args);
  } catch {
    return '';
  }
}

function normalizePath(filePath: string): string {
  return filePath.replaceAll('\\', '/').replace(/^\.\/+/, '');
}

function isIgnoredToolPath(filePath: string): boolean {
  const [topLevelDir] = normalizePath(filePath).split('/');
  return [
    '.agents',
    '.claude',
    '.cursor',
    '.git',
    '.opencode',
    'node_modules',
  ].includes(topLevelDir);
}

function dirname(filePath: string): string {
  const dir = path.posix.dirname(normalizePath(filePath));
  return dir === '' ? '.' : dir;
}

function readGitFiles(args: string[]): string[] {
  return splitLines(tryGit(args)).map(normalizePath);
}

function findComparisonBase(): string | undefined {
  const candidates = [
    process.env.GITHUB_BASE_REF ? `origin/${process.env.GITHUB_BASE_REF}` : '',
    'origin/main',
    '@{upstream}',
  ].filter(Boolean);
  const head = tryGit(['rev-parse', 'HEAD']);

  for (const candidate of candidates) {
    if (!tryGit(['rev-parse', '--verify', candidate])) {
      continue;
    }

    const mergeBase = tryGit(['merge-base', 'HEAD', candidate]);
    if (candidate === '@{upstream}' && mergeBase === head) {
      continue;
    }
    if (mergeBase) {
      return mergeBase;
    }
  }

  return undefined;
}

function collectChangedFiles(args: string[]): string[] {
  const cleanedArgs = args.filter((arg) => arg !== '--');
  if (cleanedArgs.includes('--all')) {
    return trackedFiles;
  }

  const explicitFiles = cleanedArgs.filter((arg) => !arg.startsWith('--'));
  if (explicitFiles.length > 0) {
    const files = new Set(explicitFiles.map(normalizePath));
    for (const file of stagedDeletedFileSet) {
      files.add(file);
    }
    return [...files];
  }

  const changed = new Set<string>();
  for (const file of readGitFiles([
    'diff',
    '--name-only',
    CHANGED_FILE_FILTER,
    '--cached',
  ])) {
    changed.add(file);
  }

  const base = findComparisonBase();
  if (base) {
    for (const file of readGitFiles([
      'diff',
      '--name-only',
      CHANGED_FILE_FILTER,
      `${base}...HEAD`,
    ])) {
      changed.add(file);
    }
  }

  return [...changed];
}

function ancestorDirs(filePath: string): string[] {
  const dirs: string[] = [];
  let current = dirname(filePath);

  while (true) {
    dirs.push(current);
    if (current === '.') {
      break;
    }
    current = path.posix.dirname(current);
    if (current === '') {
      current = '.';
    }
  }

  return dirs;
}

function readmePath(dir: string): string {
  return dir === '.' ? README_FILE : path.posix.join(dir, README_FILE);
}

function hasReadme(dir: string): boolean {
  const relativeReadme = readmePath(dir);
  if (stagedDeletedFileSet.has(relativeReadme)) {
    return false;
  }
  return (
    trackedFileSet.has(relativeReadme) || untrackedFileSet.has(relativeReadme)
  );
}

const trackedFiles = readGitFiles(['ls-files']).filter(
  (file) => !isIgnoredToolPath(file),
);
const trackedFileSet = new Set(trackedFiles);
const untrackedFileSet = new Set(
  readGitFiles(['ls-files', '--others', '--exclude-standard']).filter(
    (file) => !isIgnoredToolPath(file),
  ),
);
const stagedDeletedFileSet = new Set(
  readGitFiles(['diff', '--name-only', DELETED_FILE_FILTER, '--cached']).filter(
    (file) => !isIgnoredToolPath(file),
  ),
);
const changedFiles = collectChangedFiles(process.argv.slice(2)).filter(
  (file) => !isIgnoredToolPath(file),
);

const directFileCounts = new Map<string, number>();
const filesForCounts = new Set(trackedFiles);
for (const file of changedFiles) {
  if (untrackedFileSet.has(file)) {
    filesForCounts.add(file);
  }
}
for (const file of filesForCounts) {
  const dir = dirname(file);
  directFileCounts.set(dir, (directFileCounts.get(dir) ?? 0) + 1);
}

const dirsToCheck = new Set<string>();
for (const file of changedFiles) {
  for (const dir of ancestorDirs(file)) {
    dirsToCheck.add(dir);
  }
}

const missingReadmes = [...dirsToCheck]
  .map((dir) => ({ dir, fileCount: directFileCounts.get(dir) ?? 0 }))
  .filter(
    ({ dir, fileCount }) =>
      fileCount > FILE_THRESHOLD &&
      !hasReadme(dir) &&
      !README_EXEMPT_DIRS.has(dir),
  )
  .sort((a, b) => a.dir.localeCompare(b.dir));

if (missingReadmes.length === 0) {
  console.log(
    `README precheck passed for ${dirsToCheck.size} touched folder(s).`,
  );
  process.exit(0);
}

console.error('README precheck failed.');
console.error(
  `Folders with more than ${FILE_THRESHOLD} direct files need a ${README_FILE}.`,
);
console.error('');
for (const { dir, fileCount } of missingReadmes) {
  console.error(`- ${dir} (${fileCount} files)`);
}
console.error('');
console.error(
  'Add or update README.md with the folder purpose, file relationships, and a brief ASCII structure diagram where useful.',
);
process.exit(1);
