import * as _inspector from 'node:inspector';
import pino, { type DestinationStream } from 'pino';
import pinoPretty from 'pino-pretty';

const inspector = _inspector;
if (process.env.INSPECTOR_PORT) {
  inspector.open(Number(process.env.INSPECTOR_PORT));
}

export const logger = pino(
  {
    level: process.env.LOG_LEVEL || 'trace',
    formatters: {
      log(obj) {
        const level = obj.level as number;
        const error = (obj.error as Error) ?? (obj.err as Error) ?? {};
        const extras: Record<string, any> = {};
        if (error) {
          extras.error = {
            ...error,
            message: error.message,
            stack: error.stack,
          };
        } else if (level >= 50) {
          extras.error = new Error((obj.msg as string) ?? 'error');
        }

        // biome-ignore lint/performance/noDelete: assigning as undefined will result in logging undefined instead of removing the key
        delete obj.error;
        // biome-ignore lint/performance/noDelete: assigning as undefined will result in logging undefined instead of removing the key
        delete obj.err;
        return {
          ...obj,
          ...extras,
        };
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
