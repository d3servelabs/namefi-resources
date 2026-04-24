/** biome-ignore-all lint/suspicious/noExplicitAny: pino types are not strictly typed */
import { AsyncLocalStorage } from 'node:async_hooks';
import * as _inspector from 'node:inspector';
import pino, { type DestinationStream } from 'pino';
import pinoPretty from 'pino-pretty';
import { dropWhile, isNotNil, mergeDeepRight, pickBy } from 'ramda';
import superjson from 'superjson';

const inspector = _inspector as typeof _inspector & {
  console?: typeof console;
};

const _extraBindingsStore = new AsyncLocalStorage<Record<string, any>>();

// Import execution context from the dedicated module
import { getExecutionContext } from './execution-context/context';

/**
 * Binds the log data to the logger.
 * @param bindings - The bindings to bind to the logger.
 */
function _bindLogData(bindings: Record<string, any>) {
  const currentBindings = _extraBindingsStore.getStore();
  _extraBindingsStore.enterWith({
    ...(currentBindings ?? {}),
    ...bindings,
  });
}

Error.stackTraceLimit = 100;

if (process.env.INSPECTOR_PORT) {
  inspector.open(Number(process.env.INSPECTOR_PORT));
}

type _Logger = pino.Logger & {
  assign: (bindings: Record<string, any>) => void;
};

export type Logger = Omit<_Logger, 'child'>;

const _logger = pino(
  {
    level: process.env.LOG_LEVEL || 'trace',
    mixin(obj: any, level: number, logger: any) {
      const bindings = _extraBindingsStore.getStore() ?? {};
      const executionContext = getExecutionContext();
      const error = (obj.error as Error) ?? (obj.err as Error);
      const extras: Record<string, any> = { err: undefined, ...bindings };

      // Add execution context to logs
      if (executionContext) {
        extras.executionContext = removeNestedKeys(
          '$metadata',
          executionContext,
        );
      }

      if (error) {
        extras.error = {
          ...error,
          message: error.message,
          stack: error.stack,
        };
      } else if (level >= 50) {
        extras.error = new Error((obj.msg as string) ?? 'error');
      }

      return extras;
    },
    mixinMergeStrategy(_mergeObject, _mixinObject: any) {
      const mergeObject = superjson.serialize(_mergeObject ?? {}).json as any;
      const mixinObject = superjson.serialize(_mixinObject ?? {}).json as any;

      if (mergeObject.audit_record) {
        return {
          ...mergeObject,
          metadata: {
            ...(mergeObject.metadata ?? {}),
            ...mixinObject,
          },
        };
      }
      let merged: any;
      try {
        merged = mergeDeepRight(mergeObject, mixinObject);
      } catch {
        process.stderr.write('Error merging objects in logger');
        merged = { ...(mergeObject ?? {}), ...(mixinObject ?? {}) };
      }
      return pickBy((value) => isNotNil(value), merged);
    },
    hooks: {
      logMethod(args, method, level) {
        const _args: [any, ...any[]] = [...args];
        if (method.name === 'error' || method.name === 'fatal' || level >= 50) {
          if (_args.length === 1) {
            if (typeof _args[0] === 'string') {
              const newError = new Error(_args[0] as string);
              const stack = newError.stack?.split('\n') ?? [];
              // remove the lines related to this function, and start the stack with the caller of this function
              newError.stack = [
                stack[0],
                ...dropWhile(
                  (line) => /^\s*at\s*Pino./.test(line),
                  stack.slice(1),
                ),
              ].join('\n');
              _args[0] = newError;
            }
          }
        }
        method.apply(this, _args);
      },
    },
  },
  pino.multistream(getStreams()),
) as _Logger;

type StreamsArray = Parameters<typeof pino.multistream>[0];
function getStreams(): StreamsArray {
  const streams: StreamsArray = [];
  if (process.env.NODE_ENV === 'production') {
    streams.push({ level: 'trace', stream: pino.destination() });
  } else {
    streams.push(
      {
        level: 'trace',
        stream: pinoPretty({
          colorize: true,
          minimumLevel: 'trace',
          singleLine: true,
          colorizeObjects: true,
          ignore: 'pid,hostname,device',
        }),
      },
      {
        level: 'trace',
        stream: {
          write(msg) {
            try {
              const obj = JSON.parse(msg);
              if (inspector.url()) {
                if (obj.level < 30) {
                  inspector.console?.debug(obj);
                } else if (obj.level >= 50) {
                  inspector.console?.error(obj);
                } else if (obj.level >= 40) {
                  inspector.console?.warn(obj);
                } else {
                  inspector.console?.log(obj);
                }
              }
            } catch (error) {
              console.error(error);
            }
          },
        } satisfies DestinationStream,
      },
    );
  }
  if (process.env.OTEL_EXPORTER_OTLP_LOGS_ENDPOINT) {
    const otlpTransport = pino.transport({
      target: 'pino-opentelemetry-transport',
    });
    streams.push({
      level: 'trace',
      stream: otlpTransport,
    });
    otlpTransport.on('ready', () => {
      console.log('OTLP transport ready');
    });
  }
  return streams;
}

_logger.assign = _bindLogData;

/**
 * Valid log levels for pino logger
 */
export const LOG_LEVELS = [
  'fatal',
  'error',
  'warn',
  'info',
  'debug',
  'trace',
  'silent',
] as const;

export type LogLevel = (typeof LOG_LEVELS)[number];

/**
 * Gets the current log level
 * @returns The current log level
 */
export function getLogLevel(): LogLevel {
  return _logger.level as LogLevel;
}

/**
 * Sets the log level dynamically
 * @param level - The new log level to set
 * @returns true if the level was set successfully, false if invalid level
 */
export function setLogLevel(level: string): boolean {
  if (!LOG_LEVELS.includes(level as LogLevel)) {
    return false;
  }
  _logger.level = level;
  return true;
}

/**
 * !!IMPORTANT!! don't add async bindings to this function, use the `assign` method instead
 * because it could leek context if it's called outside of a request;
 * Creates a new logger with the given bindings.
 * @param localBindings - The bindings to bind to the logger.
 * @returns The new logger.
 */
export const createLogger = (localBindings: Record<string, any> = {}) => {
  const child = _logger.child({
    ...localBindings,
  }) as unknown as Logger;

  child.assign = _bindLogData.bind(child);
  return child;
};

export const logger = _logger as Logger;

function removeNestedKeys(_key: string, obj: object): object {
  if (Array.isArray(obj)) {
    return obj.map((item) => removeNestedKeys(_key, item));
  }

  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  const entries = Object.entries(obj);
  return Object.fromEntries(
    entries.map(([key, value]) => {
      if (key === _key) {
        return [key, undefined];
      }
      if (Array.isArray(value)) {
        return [key, value.map((item) => removeNestedKeys(_key, item))];
      }
      if (typeof value === 'object' && value !== null) {
        return [key, removeNestedKeys(_key, value)];
      }
      return [key, value];
    }),
  );
}
