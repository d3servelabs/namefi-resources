/** biome-ignore-all lint/suspicious/noExplicitAny: pino types are not strictly typed */
import { AsyncLocalStorage } from 'node:async_hooks';
import pino from 'pino';
import pinoPretty from 'pino-pretty';

/**
 * Minimal, transport-free logger for the standalone DNS service. Unlike the
 * backend logger it drops the execution-context/OTEL/inspector wiring (which
 * is backend-specific) but keeps the same `.assign()` + `createLogger`
 * surface so moved DNS code works unchanged. Transport-free output (a single
 * stdout destination in production) keeps it safe under a read-only rootfs.
 */
const _extraBindingsStore = new AsyncLocalStorage<Record<string, any>>();

function _bindLogData(bindings: Record<string, any>) {
  const currentBindings = _extraBindingsStore.getStore();
  _extraBindingsStore.enterWith({
    ...(currentBindings ?? {}),
    ...bindings,
  });
}

type _Logger = pino.Logger & {
  assign: (bindings: Record<string, any>) => void;
};

export type Logger = Omit<_Logger, 'child'>;

const _logger = pino(
  {
    level: process.env.LOG_LEVEL || 'trace',
    mixin() {
      return { ...(_extraBindingsStore.getStore() ?? {}) };
    },
  },
  process.env.NODE_ENV === 'production'
    ? pino.destination()
    : pinoPretty({
        colorize: true,
        minimumLevel: 'trace',
        singleLine: true,
        colorizeObjects: true,
        ignore: 'pid,hostname,device',
      }),
) as _Logger;

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

export function getLogLevel(): LogLevel {
  return _logger.level as LogLevel;
}

export function setLogLevel(level: string): boolean {
  if (!LOG_LEVELS.includes(level as LogLevel)) {
    return false;
  }
  _logger.level = level;
  return true;
}

/**
 * !!IMPORTANT!! don't add async bindings to this function, use the `assign`
 * method instead because it could leak context if called outside of a request.
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
