/** biome-ignore-all lint/suspicious/noExplicitAny: for higher leve types */
/** biome-ignore-all lint/style/useNamingConvention: external constraints */
import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import {
  closeConnection,
  connectEpp,
  readFrame,
  sendFrame,
  type ConnectOptions,
  type EppConnection,
} from '../transport';
import type { EppCredentials, EppSessionConfig } from '../protocol/core/types';
import { err, ok, type Result } from './result';
import type { EppCommand } from './commands';
import {
  buildEppEnvelope,
  buildHelloEnvelope,
  buildLoginCommand,
  buildLogoutCommand,
  DOMAIN_NS,
  CONTACT_NS,
  HOST_NS,
} from './commands';

// XML parser/builder instances for encoding/decoding EPP messages
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  parseTagValue: false,
  parseAttributeValue: false,
  ignoreDeclaration: true,
  trimValues: true,
});

const builder = new XMLBuilder({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  suppressEmptyNode: true,
  format: false,
});

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
}

export interface EppClientRuntime {
  options: CreateEppClientOptions;
  conn?: EppConnection;
  lastGreeting?: Record<string, unknown>;
  loggedIn: boolean;
  closed: boolean;
}

export async function createEppClient(
  options: CreateEppClientOptions,
): Promise<EppClientRuntime> {
  const client: EppClientRuntime = {
    options,
    loggedIn: false,
    closed: false,
  };

  const refreshed = await refreshSession(client);
  if (!refreshed.ok) {
    // Do not throw; caller can inspect the error and retry.
    return client;
  }
  return client;
}

export async function refreshSession(
  client: EppClientRuntime,
): Promise<Result<void, string | undefined>> {
  if (client.closed) {
    return err({ reason: 'transport', message: 'Client is closed' });
  }

  if (client.conn) {
    closeConnection(client.conn);
    client.conn = undefined;
  }

  try {
    const conn = await connectEpp(client.options.connection);
    client.conn = conn;

    // Read initial greeting
    const greetingXml = await readFrame(conn, { timeoutMs: 10_000 });
    const parsed = parser.parse(greetingXml) as Record<string, unknown>;
    const eppNode = parsed.epp as Record<string, unknown> | undefined;

    if (!eppNode) {
      return err(
        {
          reason: 'protocol',
          message: 'Invalid EPP response: missing <epp> root',
        },
        greetingXml,
      );
    }

    // Extract greeting (handle both prefixed and non-prefixed)
    const greeting = eppNode['epp:greeting'] ?? eppNode.greeting;
    if (!greeting) {
      return err(
        { reason: 'protocol', message: 'Expected greeting on connect' },
        greetingXml,
      );
    }

    client.lastGreeting = greeting as Record<string, unknown>;
    client.loggedIn = false;

    // TODO LOGIN
    // // Auto-login if credentials + session config exist
    // if (client.options.credentials && client.options.session) {
    //   const loginCmd = buildLoginCommand({
    //     clID: client.options.credentials.clID,
    //     pw: client.options.credentials.pw,
    //     newPW: client.options.credentials.newPW,
    //     version: client.options.session.version ?? "1.0",
    //     lang: client.options.session.lang ?? "en",
    //     objURIs: client.options.session.services.objURIs,
    //     extURIs: client.options.session.services.extURIs,
    //   });
    //   const loginResult = await sendCommand(client, loginCmd);
    //   if (!loginResult.ok) {
    //     return err(loginResult.error, loginResult.raw);
    //   }
    //   client.loggedIn = true;
    // }

    return ok(undefined, greetingXml);
  } catch (cause) {
    log(client, 'error', 'EPP session refresh failed', { cause });
    return err({
      reason: 'transport',
      message: 'Failed to refresh session',
      cause,
    });
  }
}

/**
 * Gracefully close the client: sends logout if logged in, then closes the connection.
 * Always safe to call, even if already closed or not logged in.
 */
export async function closeClient(client: EppClientRuntime): Promise<void> {
  if (client.closed) return;

  // Send logout if we're logged in
  if (client.loggedIn && client.conn && !client.conn.socket.destroyed) {
    try {
      const logoutCmd = buildLogoutCommand({ clTRID: `logout-${Date.now()}` });
      await sendCommand(client, logoutCmd);
      log(client, 'info', 'EPP logout successful');
    } catch (cause) {
      // Best-effort logout - don't fail the close operation
      log(client, 'warn', 'EPP logout failed during close', { cause });
    }
    client.loggedIn = false;
  }

  client.closed = true;
  if (client.conn) {
    closeConnection(client.conn);
    client.conn = undefined;
  }
}

/**
 * Execute a callback with an EPP client, ensuring proper login and logout lifecycle.
 * The client is automatically logged in (if credentials provided) and logged out when done.
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

async function ensureConnected(
  client: EppClientRuntime,
): Promise<Result<void>> {
  if (client.conn && !client.conn.socket.destroyed) {
    return ok(undefined, undefined);
  }
  const refreshed = await refreshSession(client);
  if (!refreshed.ok) return refreshed as Result<void>;
  return ok(undefined, undefined);
}

function log(
  client: EppClientRuntime,
  level: keyof EppLogger,
  message: string,
  meta?: Record<string, unknown>,
): void {
  const logger =
    client.options.logger ??
    // If caller requested logging or the message is important, fallback to console.
    (client.options.logXml ||
    client.options.logParsed ||
    level === 'error' ||
    level === 'warn'
      ? consoleLogger
      : undefined);
  const fn = logger?.[level];
  if (typeof fn === 'function') {
    fn(message, meta);
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
 * This is the lowest-level send function.
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
): Promise<Result<SendResult, string | undefined>> {
  if (client.closed) {
    return err({ reason: 'transport', message: 'Client is closed' });
  }

  const ready = await ensureConnected(client);
  if (!ready.ok) return ready as Result<SendResult, undefined>;

  const timeoutMs = opts.timeoutMs ?? 15_000;

  try {
    if (client.options.logXml) log(client, 'debug', 'EPP send xml', { xml });

    if (!client.conn) {
      return err({ reason: 'transport', message: 'Client is closed' });
    }

    await sendFrame(client.conn, xml);
    const resXml = await readFrame(client.conn, { timeoutMs });

    if (client.options.logXml)
      log(client, 'debug', 'EPP recv xml', { xml: resXml });

    const parsed = parser.parse(resXml) as Record<string, unknown>;

    if (client.options.logParsed)
      log(client, 'debug', 'EPP recv parsed', { parsed });

    return ok({ response: parsed, xml: resXml }, resXml);
  } catch (cause) {
    log(client, 'error', 'EPP send failed', { cause });
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
  envelope: Record<string, unknown>,
  opts: { timeoutMs?: number } = {},
): Promise<Result<SendResult, string | undefined>> {
  const xml = builder.build(envelope);
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
  command: EppCommand,
  opts: { timeoutMs?: number } = {},
): Promise<Result<SendResult, string | undefined>> {
  const envelope = buildEppEnvelope(command);
  return send(client, envelope, opts);
}
