import Axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosProxyConfig,
  type AxiosResponse,
} from 'axios';
import pino from 'pino';
import { assocPath, isNotNil, mergeDeepLeft, omit, take } from 'ramda';
import { signMessage } from '#lib/sign-message';
import type { DynadotCommandOutput, DynadotCommandsParams } from './commands';
import type { DynadotCommand, DynadotResponse } from './common-types';
import { DynadotBaseErrorMessage } from './common-types';
import Bottleneck from 'bottleneck';
import crypto from 'crypto';

function md5(str: string) {
  return crypto.createHash('md5').update(str).digest('hex');
}

const limiters: Record<string, Bottleneck> = {};

function setupLimiter({
  apiKey,
  requestsPerSecond = 100,
  maxRetries = 3,
  maxDelay = 500,
  retryDelay = 500,
  retryWhenBusy = true,
  connection,
}: {
  apiKey: string;
  requestsPerSecond?: number;
  maxRetries?: number;
  maxDelay?: number;
  retryDelay?: number;
  retryWhenBusy?: boolean;
  connection?: Bottleneck.IORedisConnection | Bottleneck.RedisConnection;
}) {
  const id = `dynadot-${md5(apiKey)}`;
  if (!limiters[id]) {
    console.log(
      `Setting up limiter for ${id} with ${requestsPerSecond} requests per second`,
    );

    const limiter = new Bottleneck({
      id,
      reservoir: requestsPerSecond, // initial available tokens
      reservoirRefreshAmount: requestsPerSecond, // refill 5 tokens...
      reservoirRefreshInterval: 1000, // ...every 1000 ms (1 second)
      connection,
    });

    limiter.on('failed', async (error, jobInfo) => {
      const id = jobInfo.options.id;
      console.warn(`Job ${id} failed: ${error}`);

      if (
        retryWhenBusy &&
        jobInfo.retryCount < maxRetries &&
        jobInfo.retryCount > 0 &&
        error instanceof Error &&
        error.message.includes('Threads Busy')
      ) {
        const delay = crypto.randomInt(retryDelay, retryDelay * 1.5);
        console.log(`Retrying job ${id} in ${delay}ms!`);
        return delay;
      }
    });

    limiters[id] = limiter;
  }
  return limiters[id];
}

export type RetryOptions = {
  maxRetries: number;
  retryWhenBusy: boolean;
  backoff: number;
};
export type LoggingOptions = {
  enabled: boolean;
  prefix: string;
  allowSystemBusyLog?: boolean;
  blackList?: (params: Record<string, any>) => boolean;
  customLogger?: pino.Logger;
};
export type ProxyOptions = {
  httpAgent?: any;
  httpsAgent?: any;
  proxy?: AxiosProxyConfig | undefined | false;
  namefiProxy?: {
    privateKey: string;
    accountId: string;
  };
};
export class Dynadot {
  private instance: AxiosInstance;
  private retryOptions: RetryOptions;
  private loggingOptions: LoggingOptions;
  private limiter: Bottleneck;

  constructor({
    apiKey,
    retryOptions,
    loggingOptions,
    proxyOptions,
    baseUrl: _baseUrl,
    accountType = 'regular',
    connection,
  }: {
    apiKey: string;
    retryOptions?: RetryOptions;
    loggingOptions?: LoggingOptions;
    proxyOptions?: ProxyOptions;
    baseUrl?: string;
    accountType?: 'super_bulk' | 'bulk' | 'regular';
    connection?: Bottleneck.IORedisConnection | Bottleneck.RedisConnection;
  }) {
    const namefiProxy = proxyOptions?.namefiProxy;
    const baseUrl = _baseUrl || 'https://api.dynadot.com/api3.json';
    this.instance = Axios.create({
      ...(isNotNil(namefiProxy)
        ? {
            headers: {
              'x-namefi-account-id': namefiProxy.accountId,
            },
          }
        : omit(['namefiProxy'], proxyOptions ?? {})),
      baseURL: baseUrl,
      params: {
        key: apiKey,
      },
    });
    this.retryOptions = mergeDeepLeft(retryOptions ?? ({} as RetryOptions), {
      maxRetries: 2,
      retryWhenBusy: true,
      backoff: 1000,
    });
    this.loggingOptions = mergeDeepLeft(
      loggingOptions ?? ({} as LoggingOptions),
      {
        enabled: false,
        prefix: 'Dynadot',
        allowSystemBusyLog: true,
      },
    );

    if (isNotNil(namefiProxy)) {
      this.instance.interceptors.request.use((config) => {
        const url = new URL((config.baseURL ?? '') + (config.url ?? ''));
        Object.entries(config.params ?? {}).forEach(
          ([key, value]: [string, any]) => url.searchParams.set(key, value),
        );
        (config as any).context = {
          ...((config as any).context ?? {}),
          params: config.params,
        }; //this is for logging
        config.params = undefined;
        config.url = url.toString(); // payload is sent as query params (so url-encoded params ), hence signing the url
        config.headers['x-namefi-signature'] = signMessage({
          privateKey: namefiProxy.privateKey,
          message: url.pathname + url.search,
          format: 'hex',
        });
        return config;
      });
    }
    setupLoggers(this.instance, this.loggingOptions);
    this.limiter = setupLimiter({
      apiKey,
      requestsPerSecond:
        accountType === 'super_bulk' ? 100 : accountType === 'bulk' ? 10 : 1,
      maxRetries: this.retryOptions.maxRetries,
      maxDelay: this.retryOptions.backoff,
      retryDelay: this.retryOptions.backoff,
      retryWhenBusy: this.retryOptions.retryWhenBusy,
      connection,
    });
  }

  async command<T extends DynadotCommand>(
    command: T,
    params: DynadotCommandsParams[T],
    retryOptions = this.retryOptions,
  ): Promise<DynadotCommandOutput[T]> {
    return await this.limiter.schedule(async () => {
      const res: AxiosResponse<DynadotCommandOutput[T]> =
        await this.instance.get('', {
          params: {
            command,
            ...params,
          },
        });

      if (retryOptions.retryWhenBusy && res?.data) {
        for (const response of Object.values(
          res.data as Record<string, DynadotResponse>,
        )) {
          const responseCode = Number.parseInt(response.ResponseCode);
          const responseStatus = response.Status;
          if (
            (responseCode === -1 &&
              response.Error ===
                DynadotBaseErrorMessage.PROCESSING_ANOTHER_REQUEST) ||
            (responseCode === 5 && responseStatus === 'system_busy')
          ) {
            throw new Error('Threads Busy');
          }
        }
      }
      if (res?.status !== 200 || !res?.data) {
        throw new Error(
          `Failed to get response from Dynadot: ${res?.statusText} ${res?.status}`,
        );
      }
      return res.data;
    });
  }
}

type RetryMetadata = {
  tries: number;
  errors: Error[];
};

class MaxTriesReachedError extends Error {
  public readonly $metadata: RetryMetadata;
  constructor(metadata: RetryMetadata) {
    super('MaxTriesReached');
    this.$metadata = metadata;
  }
}

function setupLoggers(instance: AxiosInstance, options: LoggingOptions) {
  const logger =
    options.customLogger ??
    pino({
      name: options.prefix ?? 'Dynadot',
    });

  if (options.enabled !== false) {
    const errorLogger = (error: AxiosError) => {
      try {
        let _error = assocPath(
          ['config', 'params', 'key'],
          '[REDACTED]',
          error,
        );
        _error = assocPath(
          ['config', 'context', 'params', 'key'],
          '[REDACTED]',
          _error,
        );
        // this should remove it from both request and response object as well since it's cyclic
        logger.error(
          {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
          },
          'Request Error',
        );
      } catch (e) {
        logger.error({ e }, 'Request Error Logger Error');
      }
      return error;
    };
    const requestLogger = (req: any) => {
      const params = req.params ?? {};
      const command = params.command;
      const domain =
        params.domain ??
        params.domainName ??
        params.domainNameLdh ??
        params.domain_name;
      logger.info(
        {
          command,
          domain,
          params: omit(['command'], params ?? {}),
        },
        `${domain ? `Domain(${domain}) ` : ''}Command(${command}) Request Sent`,
      );
    };
    const responseLogger = (res: AxiosResponse) => {
      const context = (res.config as any).context ?? {};
      const params = context.params ?? {};
      const command = params.command;
      const domain =
        params.domain ??
        params.domainName ??
        params.domainNameLdh ??
        params.domain_name;
      logger.info(
        {
          command,
          domain,
          params: omit(['command'], params ?? {}),
          data: res.data,
          status: res.status,
          statusText: res.statusText,
        },
        `${domain ? `Domain(${domain}) ` : ''}Command(${command}) Response Received`,
      );
    };

    instance.interceptors.request.use((req) => {
      try {
        if (options.blackList?.(req.params)) {
          return req;
        }
        requestLogger(assocPath(['params', 'key'], '[REDACTED]', req));
      } catch (e) {
        logger.error({ e }, 'Request Logger Error');
      }
      return req;
    }, errorLogger);

    instance.interceptors.response.use((res) => {
      try {
        if (options.blackList?.(res.config.params)) {
          return res;
        }
        for (const response of Object.values(
          res.data as Record<string, DynadotResponse>,
        )) {
          const responseCode = Number.parseInt(response.ResponseCode);
          const responseStatus = response.Status;
          if (
            (!options.allowSystemBusyLog &&
              responseCode === -1 &&
              response.Error ===
                DynadotBaseErrorMessage.PROCESSING_ANOTHER_REQUEST) ||
            (responseCode === 5 && responseStatus === 'system_busy')
          ) {
            return res;
          }
        }
        let _res = assocPath(['config', 'params', 'key'], '[REDACTED]', res);
        _res = assocPath(
          ['config', 'context', 'params', 'key'],
          '[REDACTED]',
          _res,
        );
        const dataText = JSON.stringify(_res.data);

        responseLogger({
          ..._res,
          data: dataText.length > 400 ? `${take(400, dataText)}...` : _res.data,
        });
        return _res;
      } catch (e) {
        logger.error({ e }, 'Response Logger Error');
      }
      return res;
    }, errorLogger);
  }
}

function sleep(ms: number) {
  return new Promise((res) => {
    setTimeout(() => res(true), ms);
  });
}
