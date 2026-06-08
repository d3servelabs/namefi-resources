// ANSI color codes and console utilities shared by the workflow-bundle scripts.
export const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  bright: '\x1b[1m',
} as const;

// Console escape sequences for TUI control (cursor + line clearing).
export const console_utils = {
  clearLine: '\x1b[2K',
  clearFromCursor: '\x1b[0K',
  cursorToStart: '\x1b[G',
  hideCursor: '\x1b[?25l',
  showCursor: '\x1b[?25h',
} as const;
