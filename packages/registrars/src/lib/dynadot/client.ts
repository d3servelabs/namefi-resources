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

  constructor({
    apiKey,
    retryOptions,
    loggingOptions,
    proxyOptions,
    baseUrl: _baseUrl,
  }: {
    apiKey: string;
    retryOptions?: RetryOptions;
    loggingOptions?: LoggingOptions;
    proxyOptions?: ProxyOptions;
    baseUrl?: string;
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
  }

  async command<T extends DynadotCommand>(
    command: T,
    params: DynadotCommandsParams[T],
    retryOptions = this.retryOptions,
  ): Promise<DynadotCommandOutput[T]> {
    return retry(async () => {
      const res: AxiosResponse<DynadotCommandOutput[T]> =
        await this.instance.get('', {
          params: {
            command,
            ...params,
          },
        });
      if (retryOptions.retryWhenBusy && res.data) {
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
      return res.data;
    }, retryOptions).then((d) => d.response);
  }
}

type RetryMetadata = {
  tries: number;
  errors: Error[];
};

async function retry<T>(
  call: () => Promise<T>,
  retryOptions: RetryOptions,
): Promise<{ $metadata: RetryMetadata; response: T }> {
  const $metadata: RetryMetadata = {
    tries: 0,
    errors: [],
  };
  do {
    try {
      const response = await call();
      return { $metadata, response };
    } catch (e: any) {
      $metadata.errors.push(e);
    }
    $metadata.tries++;
    if (retryOptions.backoff) {
      await sleep(retryOptions.backoff);
    }
  } while ($metadata.tries <= retryOptions.maxRetries);
  throw new MaxTriesReachedError($metadata);
}

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
      let _error = assocPath(['config', 'params', 'key'], '[REDACTED]', error);
      _error = assocPath(
        ['config', 'context', 'params', 'key'],
        '[REDACTED]',
        _error,
      );
      // this should remove it from both request and response object as well since it's cyclic
      logger.error(_error, 'Request Error');
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
      if (options.blackList?.(req.params)) {
        return req;
      }
      requestLogger(assocPath(['params', 'key'], '[REDACTED]', req));
      return req;
    }, errorLogger);

    instance.interceptors.response.use((res) => {
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
    }, errorLogger);
  }
}

function sleep(ms: number) {
  return new Promise((res) => {
    setTimeout(() => res(true), ms);
  });
}
