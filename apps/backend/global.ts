import {
  createLogger as createLoggerInstance,
  logger as loggerInstance,
} from '#lib/logger';

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
const consoleArgsToPinoArgs = (args: any[]): [any, ...any[]] => {
  if (args.length <= 1) {
    return [args[0]];
  }
  return [
    args
      .map((arg) => {
        if (typeof arg === 'string') {
          return arg;
        }
        return JSON.stringify(arg);
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

declare global {
  var logger: typeof loggerInstance;
  var createLogger: typeof createLoggerInstance;
}

global.logger = loggerInstance;
global.createLogger = createLoggerInstance;
