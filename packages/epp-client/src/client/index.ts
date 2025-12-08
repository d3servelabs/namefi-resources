/** biome-ignore-all lint/suspicious/noExplicitAny: for higher leve types */
/** biome-ignore-all lint/style/useNamingConvention: external constraints */
import { sendFrame, readFrame, type ConnectOptions } from '../transport';
import type { EppCredentials, EppSessionConfig } from '../protocol/core/types';
import { err, ok, type Result } from './result';
import type { EppCommandTypeXml } from './commands/index';
import {
  buildEppEnvelopeFromCommand,
  buildLoginCommand,
  buildLogoutCommand,
} from './commands/index';
import {
  createEppConnectionPool,
  type EppConnectionPool,
  type EppPoolOptions,
  type PooledConnection,
} from '../pool';
import {
  EppEnvelopeCodec,
  EppLoginCodec,
  parser,
  type EppEnvelopeXml,
  type EppResponseType,
} from './codec';
import z from 'zod';

export interface EppLogger {
  debug?(message: string, meta?: Record<string, unknown>): void;
  info?(message: string, meta?: Record<string, unknown>): void;
  warn?(message: string, meta?: Record<string, unknown>): void;
  error?(message: string, meta?: Record<string, unknown>): void;
}

export interface CreateEppClientOptions {
  connection: ConnectOptions;
  credentials?: EppCredentials;
  session?: EppSessionConfig;
  logger?: EppLogger;
  /**
   * Log raw XML frames (request/response).
   */
  logXml?: boolean;
  /**
   * Log parsed command/response payloads.
   */
  logParsed?: boolean;
  /**
   * Automatically login after connecting (requires credentials and session).
   * Default: true (when credentials and session are provided)
   */
  autoLogin?: boolean;
  /**
   * Automatically logout when closing connections.
   * Default: true when autoLogin is true
   */
  autoLogout?: boolean;
  /**
   * Connection pool configuration.
   * Default: { min: 0, max: 1 } (single connection, created on demand)
   */
  pool?: EppPoolOptions;
}

export interface EppClientRuntime {
  options: CreateEppClientOptions;
  pool: EppConnectionPool;
  closed: boolean;
}

/**
 * Create an EPP client with connection pooling.
 *
 * The client internally manages a connection pool. By default, a single
 * connection is used (min: 0, max: 1). Configure `pool` options for
 * multiple concurrent connections.
 *
 * @example
 * ```ts
 * const client = await createEppClient({
 *   connection: { host: 'epp.example.com', port: 700, tls: true },
 *   credentials: { clID: 'user', pw: 'pass' },
 *   session: { services: { objURIs: [DOMAIN_NS] } },
 *   autoLogin: true,
 *   pool: { min: 2, max: 10 }, // optional: configure pool size
 * });
 *
 * // Send commands - pool handles connection management
 * const result = await sendCommand(client, buildDomainCheckCommand(['example.com']));
 *
 * // Close when done
 * await closeClient(client);
 * ```
 */
export async function createEppClient(
  options: CreateEppClientOptions,
): Promise<EppClientRuntime> {
  // Determine if we should auto-login
  const shouldAutoLogin =
    options.autoLogin ?? !!(options.credentials && options.session);

  const pool = createEppConnectionPool({
    connection: options.connection,
    pool: options.pool,

    // Login handler - called after each connection is established
    onLogin: shouldAutoLogin
      ? async (conn) => {
          try {
            if (!options.credentials || !options.session) {
              throw new Error(
                'autoLogin requires credentials and session config',
              );
            }

            const loginCmd = buildLoginCommand({
              clID: options.credentials.clID,
              pw: options.credentials.pw,
              newPW: options.credentials.newPW,
              version: options.session.version ?? '1.0',
              lang: options.session.lang ?? 'en',
              objURIs: options.session.services.objURIs,
              extURIs: options.session.services.extURIs,
            });

            const envelope = buildEppEnvelopeFromCommand(loginCmd as any);
            const xml = EppEnvelopeCodec.encode(envelope);

            await sendFrame(conn, xml);
            const resXml = await readFrame(conn, { timeoutMs: 15_000 });

            // Parse and validate login response
            const parsed = EppEnvelopeCodec.decode(resXml);
            const eppNode = parsed['epp:epp'];

            const response =
              'epp:response' in eppNode ? eppNode['epp:response'] : undefined;
            const result =
              !!response && 'epp:result' in response
                ? response['epp:result'][0]
                : undefined;
            const code =
              !!result && '@_code' in result ? result['@_code'] : undefined;

            if (!code || !String(code).startsWith('1')) {
              throw new Error(`Login failed with code ${code}`);
            }

            logMessage(options, 'info', 'EPP auto-login successful');
            return resXml;
          } catch (error) {
            logMessage(options, 'error', `EPP auto-login failed: ${error}`);
            throw error;
          }
        }
      : undefined,

    // Logout handler - called before each connection is destroyed
    onLogout:
      (options.autoLogout ?? shouldAutoLogin)
        ? async (conn) => {
            try {
              logMessage(options, 'info', 'EPP logging out...');
              const logoutCmd = buildLogoutCommand({
                clTRID: `logout-${Date.now()}`,
              });
              const envelope = buildEppEnvelopeFromCommand(logoutCmd);
              const xml = EppEnvelopeCodec.encode(envelope);

              await sendFrame(conn, xml);
              await readFrame(conn, { timeoutMs: 5_000 });
              logMessage(options, 'info', 'EPP logout successful');
            } catch {
              logMessage(options, 'warn', 'EPP logout failed during close');
            }
          }
        : undefined,

    // Validate handler - check if connection is still alive
    onValidate: async (conn) => {
      // Simple socket check - connection is valid if socket is not destroyed
      return !conn.socket.destroyed;
    },
  });

  return {
    options,
    pool,
    closed: false,
  };
}

/**
 * Gracefully close the client: drains the pool and closes all connections.
 * Always safe to call, even if already closed.
 */
export async function closeClient(client: EppClientRuntime): Promise<void> {
  if (client.closed) return;

  client.closed = true;
  await client.pool.drain();
  await client.pool.clear();
}

/**
 * Execute a callback with an EPP client, ensuring proper lifecycle.
 * The client pool is automatically drained when done.
 *
 * @example
 * ```ts
 * const result = await withEppClient(options, async (client) => {
 *   const checkResult = await sendCommand(client, checkCommand(...));
 *   return checkResult;
 * });
 * ```
 */
export async function withEppClient<T>(
  options: CreateEppClientOptions,
  callback: (client: EppClientRuntime) => Promise<T>,
): Promise<T> {
  const client = await createEppClient(options);
  try {
    return await callback(client);
  } finally {
    await closeClient(client);
  }
}

// ---------- Internal helpers ----------

function logMessage(
  options: CreateEppClientOptions,
  level: keyof EppLogger,
  message: string,
  meta?: Record<string, unknown>,
): void {
  try {
    const logger =
      options.logger ??
      (options.logXml ||
      options.logParsed ||
      level === 'error' ||
      level === 'warn'
        ? consoleLogger
        : undefined);
    const fn = logger?.[level];
    if (typeof fn === 'function') {
      fn(message, meta);
    }
  } catch (error) {
    process.stdout.write(
      '\n' +
        JSON.stringify(
          {
            message,
            error,
            meta,
          },
          null,
          2,
        ) +
        '\n',
    );
  }
}

const consoleLogger: EppLogger = {
  // biome-ignore lint/suspicious/noConsole: it's a logger
  debug: (msg, meta) => console.debug(msg, meta ?? ''),
  // biome-ignore lint/suspicious/noConsole: it's a logger
  info: (msg, meta) => console.info(msg, meta ?? ''),
  // biome-ignore lint/suspicious/noConsole: it's a logger
  warn: (msg, meta) => console.warn(msg, meta ?? ''),
  // biome-ignore lint/suspicious/noConsole: it's a logger
  error: (msg, meta) => console.error(msg, meta ?? ''),
};

// ---------- Send API ----------

export interface SendResult<T = unknown> {
  response: T;
  xml: string;
}

/**
 * Send raw XML string and receive the parsed response.
 * Automatically acquires a connection from the pool and releases it after.
 *
 * @example
 * ```ts
 * const result = await sendRaw(client, '<epp xmlns="urn:ietf:params:xml:ns:epp-1.0"><hello/></epp>');
 * if (result.ok) {
 *   console.log('Response:', result.data.response);
 * }
 * ```
 */
export async function sendRaw(
  client: EppClientRuntime,
  xml: string,
  opts: { timeoutMs?: number } = {},
): Promise<Result<SendResult<EppEnvelopeXml>, string | undefined>> {
  if (client.closed) {
    return err({ reason: 'transport', message: 'Client is closed' });
  }

  const timeoutMs = opts.timeoutMs ?? 15_000;

  try {
    // Use pool.use() to automatically acquire and release connection
    const result = await client.pool.use(async (pooled: PooledConnection) => {
      const { conn } = pooled;

      if (client.options.logXml) {
        logMessage(client.options, 'debug', 'EPP send xml', { xml });
      }

      await sendFrame(conn, xml);
      const resXml = await readFrame(conn, { timeoutMs });

      if (client.options.logXml) {
        logMessage(client.options, 'debug', 'EPP recv xml', { xml: resXml });
      }

      //use decode
      const parsed = parser.parse(resXml) as EppEnvelopeXml;

      if (client.options.logParsed) {
        logMessage(client.options, 'debug', 'EPP recv parsed', { parsed });
      }

      return { response: parsed, xml: resXml };
    });

    return ok(result, result.xml);
  } catch (cause) {
    logMessage(client.options, 'error', 'EPP send failed', { cause });
    return err({
      reason: 'transport',
      message: 'EPP send/receive failed',
      cause,
    });
  }
}

/**
 * Send an EPP envelope object and receive the parsed response.
 * Encodes the envelope to XML using the builder, then sends via sendRaw.
 *
 * @example
 * ```ts
 * // Send hello
 * const result = await send(client, buildHelloEnvelope());
 *
 * // Send custom envelope
 * const result = await send(client, {
 *   epp: {
 *     '@_xmlns': 'urn:ietf:params:xml:ns:epp-1.0',
 *     'epp:hello': ''
 *   }
 * });
 * ```
 */
export async function send(
  client: EppClientRuntime,
  envelope: EppEnvelopeXml,
  opts: { timeoutMs?: number } = {},
) {
  const xml = EppEnvelopeCodec.encode(envelope as any);
  return sendRaw(client, xml, opts);
}

/**
 * Send an EPP command and receive the parsed response.
 * Wraps the command in a full EPP envelope, then sends via send.
 *
 * @example
 * ```ts
 * import { buildDomainCheckCommand } from './commands';
 *
 * const command = buildDomainCheckCommand(['example.com', 'test.net']);
 * const result = await sendCommand(client, command);
 * if (result.ok) {
 *   console.log('Response:', result.data.response);
 * }
 * ```
 */
export async function sendCommand(
  client: EppClientRuntime,
  command: EppCommandTypeXml,
  opts: { timeoutMs?: number } = {},
): Promise<Result<SendResult<EppEnvelopeXml>, string | undefined>> {
  const envelope = buildEppEnvelopeFromCommand(command);
  return send(client, envelope, opts);
}

function isEppResult(node: unknown): node is EppResponseType {
  return typeof node === 'object' && node !== null && 'epp:result' in node;
}
