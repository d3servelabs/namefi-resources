import * as _inspector from 'node:inspector';
import pino, { type DestinationStream } from 'pino';
import pinoPretty from 'pino-pretty';
import { dropWhile, isNotNil, mergeDeepRight, pickBy } from 'ramda';
import superjson from 'superjson';

Error.stackTraceLimit = 100;

const inspector = _inspector;
if (process.env.INSPECTOR_PORT) {
  inspector.open(Number(process.env.INSPECTOR_PORT));
}

export const logger = pino(
  {
    level: process.env.LOG_LEVEL || 'trace',
    mixin(obj: any, level: number, logger: any) {
      const error = (obj.error as Error) ?? (obj.err as Error);
      const extras: Record<string, any> = { err: undefined };
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
      const mergeObject = superjson.serialize(_mergeObject ?? {})
        .json as object;
      const mixinObject = superjson.serialize(_mixinObject ?? {})
        .json as object;

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
  pino.multistream([
    ...(process.env.NODE_ENV === 'production'
      ? [{ level: 'trace', stream: pino.destination() }]
      : [
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
                      inspector.console.debug(obj);
                    } else if (obj.level >= 50) {
                      inspector.console.error(obj);
                    } else if (obj.level >= 40) {
                      inspector.console.warn(obj);
                    } else {
                      inspector.console.log(obj);
                    }
                  }
                } catch (error) {
                  console.error(error);
                }
              },
            } satisfies DestinationStream,
          },
        ]),
  ]),
);

export const createLogger = logger.child.bind(logger);
