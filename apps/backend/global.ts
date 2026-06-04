import superjson from 'superjson';
import { logger as loggerInstance } from '#lib/logger';
Error.stackTraceLimit = 1000;

const tryOrNull = (fn: (...args: any[]) => any, ...args: any[]) => {
  try {
    const result = fn(...args);
    return result;
  } catch (e) {
    return null;
  }
};

// biome-ignore lint/suspicious/noExplicitAny: expect any
const consoleArgsToPinoArgs = (args: any[]): [any, ...any[]] => {
  if (args.length === 0) {
    return ['empty'];
  }

  if (args.length === 1) {
    return [args[0]];
  }

  return [
    { array: args },
    args
      .map((arg) => {
        if (typeof arg === 'string') {
          return arg;
        }
        try {
          const stringified =
            tryOrNull(JSON.stringify, arg) ??
            tryOrNull(String, arg) ??
            tryOrNull(superjson.stringify, arg);

          return stringified ?? 'unserializable';
        } catch (e: unknown) {
          return 'error: unserializable';
        }
      })
      .join(' '),
  ];
};

global.console = {
  ...global.console,
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  log: (...args: any[]) => loggerInstance.info(...consoleArgsToPinoArgs(args)),
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  error: (...args: any[]) =>
    loggerInstance.error(...consoleArgsToPinoArgs(args)),
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  warn: (...args: any[]) => loggerInstance.warn(...consoleArgsToPinoArgs(args)),
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  info: (...args: any[]) => loggerInstance.info(...consoleArgsToPinoArgs(args)),
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  debug: (...args: any[]) =>
    loggerInstance.debug(...consoleArgsToPinoArgs(args)),
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  trace: (...args: any[]) =>
    loggerInstance.trace(...consoleArgsToPinoArgs(args)),
} as unknown as Console;

// ! didn't work because of trpc types exports to frontend
// declare global {
//   var logger: typeof loggerInstance;
//   var createLogger: typeof createLoggerInstance;
// }

// global.logger = loggerInstance;
// global.createLogger = createLoggerInstance;
