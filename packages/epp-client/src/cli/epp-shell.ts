#!/usr/bin/env tsx
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline';
import process from 'node:process';
import { input, select, confirm } from '@inquirer/prompts';
import { stringify as yamlStringify } from 'yaml';
import {
  closeClient,
  createEppClient,
  send,
  sendRaw,
  sendCommand,
  buildHelloEnvelope,
  buildLoginCommand,
  buildLogoutCommand,
  buildDomainCheckCommand,
  buildDomainInfoCommand,
  buildDomainCreateCommand,
  buildPollReqCommand,
  buildPollAckCommand,
  type EppClientRuntime,
  type EppCredentials,
  type EppSessionConfig,
  type Result,
  type SendResult,
  buildEppEnvelope,
  buildDomainRenewCommand,
} from '..';
import type { ConnectOptions } from '../transport';
import xmlFormat from 'xml-formatter';

type OutputFormat = 'json' | 'xml' | 'yaml';

type TraceLogLevel = 'none' | 'xml' | 'parsed' | 'both';

type DomainCheckPayload = { names: string[] };
type DomainLockPayload = { names: string[] };
type DomainUnlockPayload = { names: string[] };
type DomainAddNsPayload = { name: string; ns: string[] };
type DomainRemoveNsPayload = { name: string; ns: string[] };
type DomainUpdateDsPayload = {
  name: string;
  keyTag: string;
  alg: string;
  digest: string;
  digestType: string;
};
type DomainClearDsPayload = { name: string };

type DomainInfoPayload = {
  name: string;
  authInfo?: string;
};

type DomainRenewPayload = {
  name: string;
  period: string;
  curExpDate: string;
};

type DomainCreatePayload = {
  name: string;
  period?: { value: number; unit: 'y' | 'm' };
  ns?: string[];
  registrant?: string;
  contacts?: { type: 'admin' | 'tech' | 'billing'; id: string }[];
  authInfo: string;
};

type CliAction =
  | { kind: 'empty' }
  | { kind: 'help' }
  | { kind: 'quit' }
  | { kind: 'hello' }
  | { kind: 'login'; user?: string; pw?: string }
  | { kind: 'logout' }
  | { kind: 'check'; names: string[]; withFee?: boolean }
  | { kind: 'info'; name: string; authInfo?: string }
  | { kind: 'create'; payload: DomainCreatePayload }
  | { kind: 'renew'; payload: DomainRenewPayload }
  | { kind: 'poll'; op: 'req' | 'ack'; msgID?: string }
  | { kind: 'send-raw'; xml: string; source: 'inline' | 'file' }
  | { kind: 'set-format'; format: OutputFormat }
  | { kind: 'set-pretty'; value: boolean }
  | { kind: 'set-color'; value: boolean }
  | { kind: 'set-trace-log'; level: TraceLogLevel }
  | { kind: 'set-endpoint'; host: string; port?: number; tls?: boolean }
  | { kind: 'add-ns'; name: string; ns: string[] }
  | {
      kind: 'update-ds';
      payload: DomainUpdateDsPayload;
    }
  | { kind: 'clear-ds'; name: string }
  | { kind: 'remove-ns'; name: string; ns: string[] }
  | { kind: 'lock'; names: string[] }
  | { kind: 'unlock'; names: string[] }
  | { kind: 'unknown'; message: string };

const DOMAIN_NS = 'urn:ietf:params:xml:ns:domain-1.0';
const FEE_NS = 'urn:ietf:params:xml:ns:epp:fee-1.0';

/**
 * Build fee:check extension for domain check command.
 * Queries pricing for create, transfer, and renew operations.
 */
function buildFeeCheckExtension(): Record<string, unknown> {
  return {
    'fee:check': {
      '@_xmlns:fee': FEE_NS,
      'fee:currency': 'USD',
      'fee:command': [
        { '@_name': 'create' },
        { '@_name': 'transfer' },
        { '@_name': 'renew' },
      ],
    },
  };
}

interface CliState {
  format: OutputFormat;
  connection?: ConnectOptions;
  credentials?: EppCredentials;
  session?: EppSessionConfig;
  client?: EppClientRuntime;
  logXml: boolean;
  logParsed: boolean;
  pretty: boolean;
  color: boolean;
}

function defaultSession(): EppSessionConfig {
  const objUrIs = process.env.EPP_OBJ_URIS?.split(',')
    .map((v) => v.trim().replaceAll('"', ''))
    .filter(Boolean) ?? [DOMAIN_NS];
  const extUrIs = process.env.EPP_EXT_URIS?.split(',')
    .map((v) => v.trim().replaceAll('"', ''))
    .filter(Boolean);

  return {
    version: process.env.EPP_VERSION ?? '1.0',
    lang: process.env.EPP_LANG ?? 'en',
    services: { objURIs: objUrIs, extURIs: extUrIs },
  };
}

function defaultConnection(): ConnectOptions | undefined {
  const host = process.env.EPP_HOST;
  if (!host) return undefined;
  const port = Number(process.env.EPP_PORT ?? '700');
  const tls = parseBoolean(process.env.EPP_TLS, true);
  return { host, port, tls };
}

function defaultCredentials(): EppCredentials | undefined {
  const clId = process.env.EPP_USER;
  const pw = process.env.EPP_PASS;
  if (!clId || !pw) return undefined;
  return { clID: clId, pw };
}

function defaultFormat(): OutputFormat {
  const raw = (process.env.EPP_FORMAT ?? 'json').toLowerCase();
  if (raw === 'xml' || raw === 'yaml') return raw;
  return 'json';
}

function createState(): CliState {
  return {
    format: defaultFormat(),
    connection: defaultConnection(),
    credentials: defaultCredentials(),
    session: defaultSession(),
    logXml: parseBoolean(process.env.EPP_LOG_XML, false),
    logParsed: parseBoolean(process.env.EPP_LOG_PARSED, false),
    pretty: parseBoolean(process.env.EPP_PRETTY, true),
    color: parseBoolean(process.env.EPP_COLOR, true),
  };
}

async function ensureClient(
  state: CliState,
): Promise<EppClientRuntime | undefined> {
  if (!state.connection) {
    console.error(
      'No endpoint set. Provide EPP_HOST or run "SET ENDPOINT <host> [port] [tls]".',
    );
    return undefined;
  }

  if (state.client) {
    return state.client;
  }

  try {
    state.client = await createEppClient({
      connection: state.connection,
      credentials: state.credentials,
      session: state.session,
      logXml: state.logXml,
      logParsed: state.logParsed,
      autoLogin: true,
      autoLogout: true,
      pool: {
        min: 1,
        max: 2,
      },
    });
    return state.client;
  } catch (err) {
    console.error('Failed to create EPP client', err);
    state.client = undefined;
    return undefined;
  }
}

function resetClient(state: CliState): void {
  if (state.client) {
    closeClient(state.client);
    state.client = undefined;
  }
}

async function runCommand(
  state: CliState,
  label: string,
  fn: (
    client: EppClientRuntime,
  ) => Promise<Result<SendResult, string | undefined>>,
): Promise<void> {
  const client = await ensureClient(state);
  if (!client) return;
  const result = await fn(client);
  if (label === 'check' && result.ok) {
    renderDomainAvailability(result.data, state);
  }
  printResult(label, result, state);
}

function renderDomainAvailability(data: SendResult, state: CliState): void {
  const useColor = shouldUseColor(state);
  // Navigate to the check data in the response
  const response = data.response as Record<string, unknown>;
  const resData = (response['epp:resData'] ?? response.resData) as
    | Record<string, unknown>
    | undefined;
  const chkData = resData?.['domain:chkData'] as
    | Record<string, unknown>
    | undefined;
  if (!chkData) return;
  const cd = toArray(chkData['domain:cd']);
  if (!cd.length) return;
  console.log('Availability:');
  for (const item of cd) {
    const nameNode = (item as Record<string, unknown>)['domain:name'] as
      | string
      | Record<string, unknown>
      | undefined;
    const reasonNode = (item as Record<string, unknown>)['domain:reason'] as
      | string
      | Record<string, unknown>
      | undefined;
    const name =
      typeof nameNode === 'string'
        ? nameNode
        : typeof nameNode === 'object'
          ? String(nameNode['#text'] ?? '')
          : '';
    const availAttr =
      typeof nameNode === 'object'
        ? String(nameNode['@_avail'] ?? '')
        : undefined;
    const available = availAttr === '1' || availAttr === 'true';
    const reason =
      typeof reasonNode === 'string'
        ? reasonNode
        : typeof reasonNode === 'object'
          ? String(reasonNode['#text'] ?? '')
          : undefined;
    const baseLine = `- ${name || '<unknown>'}: ${
      available ? 'available' : 'unavailable'
    }`;
    const line = useColor
      ? colorize(baseLine, available ? 'green' : 'red')
      : baseLine;
    console.log(line);
    if (reason) {
      const reasonLine = `  reason: ${reason}`;
      console.log(useColor ? colorize(reasonLine, 'yellow') : reasonLine);
    }
  }
}

function printResult(
  label: string,
  result: Result<SendResult, string | undefined>,
  state: CliState,
): void {
  const payload = result.ok
    ? { response: result.data.response }
    : { error: result.error, raw: result.raw };

  const headerBase = `[${label}] ${result.ok ? 'ok' : 'error'}`;
  const useColor = shouldUseColor(state);
  const header = useColor
    ? colorize(headerBase, result.ok ? 'green' : 'red')
    : headerBase;

  switch (state.format) {
    case 'json': {
      const space = state.pretty ? 2 : 0;
      console.log(header);
      console.log(JSON.stringify(payload, null, space));
      break;
    }
    case 'yaml': {
      console.log(header);
      const yaml = yamlStringify(payload);
      console.log(state.pretty ? yaml : flattenWhitespace(yaml));
      break;
    }
    case 'xml': {
      if (result.ok && result.data.xml) {
        console.log(header);
        console.log(
          state.pretty ? formatXml(result.data.xml) : result.data.xml,
        );
      } else {
        console.log(`${header} (no raw XML available)`);
        const space = state.pretty ? 2 : 0;
        console.log(JSON.stringify(payload, null, space));
      }
      break;
    }
  }
}

function printHelloResult(
  result: Result<SendResult, string | undefined>,
  state: CliState,
): void {
  const payload = result.ok
    ? { greeting: result.data.response }
    : { error: result.error, raw: result.raw };

  const headerBase = `[hello] ${result.ok ? 'ok' : 'error'}`;
  const useColor = shouldUseColor(state);
  const header = useColor
    ? colorize(headerBase, result.ok ? 'green' : 'red')
    : headerBase;

  switch (state.format) {
    case 'json': {
      const space = state.pretty ? 2 : 0;
      console.log(header);
      console.log(JSON.stringify(payload, null, space));
      break;
    }
    case 'yaml': {
      console.log(header);
      const yaml = yamlStringify(payload);
      console.log(state.pretty ? yaml : flattenWhitespace(yaml));
      break;
    }
    case 'xml': {
      if (result.ok && result.data.xml) {
        console.log(header);
        console.log(
          state.pretty ? formatXml(result.data.xml) : result.data.xml,
        );
      } else {
        console.log(`${header} (no raw XML available)`);
        const space = state.pretty ? 2 : 0;
        console.log(JSON.stringify(payload, null, space));
      }
      break;
    }
  }
}

function printRawResult(
  result: Result<SendResult, string | undefined>,
  source: 'inline' | 'file',
  state: CliState,
): void {
  const label = `raw (${source})`;
  const payload = result.ok
    ? { response: result.data.response, xml: result.data.xml }
    : { error: result.error, raw: result.raw };

  const headerBase = `[${label}] ${result.ok ? 'ok' : 'error'}`;
  const useColor = shouldUseColor(state);
  const header = useColor
    ? colorize(headerBase, result.ok ? 'green' : 'red')
    : headerBase;

  switch (state.format) {
    case 'json': {
      const space = state.pretty ? 2 : 0;
      console.log(header);
      console.log(JSON.stringify(payload, null, space));
      break;
    }
    case 'yaml': {
      console.log(header);
      const yaml = yamlStringify(payload);
      console.log(state.pretty ? yaml : flattenWhitespace(yaml));
      break;
    }
    case 'xml': {
      console.log(header);
      if (result.ok) {
        console.log(
          state.pretty ? formatXml(result.data.xml) : result.data.xml,
        );
      } else {
        const space = state.pretty ? 2 : 0;
        console.log(JSON.stringify(payload, null, space));
      }
      break;
    }
  }
}

function tokenize(input: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let quote: '"' | "'" | null = null;
  let _escape = false;

  for (const ch of input) {
    if (_escape) {
      current += ch;
      _escape = false;
      continue;
    }

    if (ch === '\\') {
      _escape = true;
      continue;
    }

    if (quote) {
      if (ch === quote) {
        quote = null;
      } else {
        current += ch;
      }
      continue;
    }

    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }

    if (/\s/.test(ch)) {
      if (current.length) {
        tokens.push(current);
        current = '';
      }
      continue;
    }

    current += ch;
  }

  if (current.length) tokens.push(current);
  return tokens;
}

function expandEnv(tokens: string[]): { tokens: string[]; missing: string[] } {
  const missing = new Set<string>();
  const expanded = tokens
    .map((token) =>
      token.replace(
        /\$(\w+)|\$\{([^}]+)\}/g,
        (_, var1: string, var2: string) => {
          const key = var1 || var2;
          const value = process.env[key];
          if (value === undefined) {
            missing.add(key);
            return '';
          }
          return value;
        },
      ),
    )
    .filter((t) => t.length);

  return { tokens: expanded, missing: Array.from(missing) };
}

/**
 * Parse create command arguments:
 * create <domain> <authInfo> [period] [ns1,ns2,...] [registrant] [admin:id] [tech:id] [billing:id]
 *
 * Period format: 1y, 2y, 12m, etc.
 * Nameservers: comma-separated list
 * Contacts: type:id format (e.g., admin:sh8013, tech:sh8013)
 */
function parseCreatePayload(args: string[]): DomainCreatePayload | null {
  if (args.length < 2) return null;

  const [name, authInfo, ...rest] = args;
  const payload: DomainCreatePayload = { name, authInfo };

  for (const arg of rest) {
    // Check if it's a period (e.g., 1y, 2y, 12m)
    const periodMatch = arg.match(/^(\d+)(y|m)$/i);
    if (periodMatch) {
      payload.period = {
        value: Number.parseInt(periodMatch[1], 10),
        unit: periodMatch[2].toLowerCase() as 'y' | 'm',
      };
      continue;
    }

    // Check if it's a contact (type:id format)
    const contactMatch = arg.match(/^(admin|tech|billing):(.+)$/i);
    if (contactMatch) {
      payload.contacts ??= [];
      payload.contacts.push({
        type: contactMatch[1].toLowerCase() as 'admin' | 'tech' | 'billing',
        id: contactMatch[2],
      });
      continue;
    }

    // Check if it looks like nameservers (contains comma or looks like a hostname)
    if (arg.includes(',') || arg.match(/^ns\d*\./i)) {
      payload.ns = arg
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      continue;
    }

    // Otherwise, treat as registrant if not set
    if (!payload.registrant) {
      payload.registrant = arg;
    }
  }

  return payload;
}

function parseAction(input: string): CliAction {
  if (!input.trim()) return { kind: 'empty' };
  const { tokens, missing } = expandEnv(tokenize(input.trim()));
  if (missing.length) {
    console.warn(
      `Missing env vars (${missing.join(', ')}); replaced with empty string.`,
    );
  }
  if (!tokens.length) return { kind: 'empty' };

  const [command, ...rest] = tokens;
  const cmd = command.toLowerCase();

  if (cmd === 'help' || cmd === '?') return { kind: 'help' };
  if (cmd === 'exit' || cmd === 'quit') return { kind: 'quit' };

  if (cmd === 'set' && rest.length) {
    const target = rest[0].toLowerCase();
    if (target === 'format' && rest[1]) {
      const fmt = rest[1].toLowerCase();
      if (fmt === 'json' || fmt === 'xml' || fmt === 'yaml') {
        return { kind: 'set-format', format: fmt };
      }
      return {
        kind: 'unknown',
        message: 'Supported formats: JSON | XML | YAML',
      };
    }
    if (target === 'pretty' && rest[1]) {
      return { kind: 'set-pretty', value: parseBoolean(rest[1], true) };
    }
    if (target === 'color' && rest[1]) {
      return { kind: 'set-color', value: parseBoolean(rest[1], true) };
    }
    if ((target === 'trace_log' || target === 'tracelog') && rest[1]) {
      const level = rest[1].toLowerCase();
      if (
        level === 'none' ||
        level === 'xml' ||
        level === 'parsed' ||
        level === 'both'
      ) {
        return { kind: 'set-trace-log', level };
      }
      return {
        kind: 'unknown',
        message: 'Supported trace log levels: NONE | XML | PARSED | BOTH',
      };
    }
    if (target === 'endpoint' && rest[1]) {
      const host = rest[1];
      const port = rest[2] ? Number(rest[2]) : undefined;
      const tls = rest[3] ? parseBoolean(rest[3]) : undefined;
      return { kind: 'set-endpoint', host, port, tls };
    }
  }

  if (cmd === 'hello') return { kind: 'hello' };
  if (cmd === 'login') {
    return { kind: 'login', user: rest[0], pw: rest[1] };
  }
  if (cmd === 'logout') return { kind: 'logout' };
  if (cmd === 'unlock') {
    return { kind: 'unlock', names: rest };
  }
  if (cmd === 'lock') {
    return { kind: 'lock', names: rest };
  }
  if (cmd === 'add-ns') {
    return { kind: 'add-ns', name: rest[0], ns: rest.slice(1) };
  }
  if (cmd === 'remove-ns') {
    return { kind: 'remove-ns', name: rest[0], ns: rest.slice(1) };
  }
  if (cmd === 'check') {
    // Parse --with-fee flag
    const withFee = rest.some((arg) => arg === '--with-fee');
    const names = rest.filter((arg) => arg !== '--with-fee');
    if (!names.length)
      return {
        kind: 'unknown',
        message: 'Usage: check <domain1> [domain2 ...] [--with-fee]',
      };
    return { kind: 'check', names, withFee };
  }
  if (cmd === 'info') {
    if (!rest.length)
      return {
        kind: 'unknown',
        message: 'Usage: info <domain> [authInfo]',
      };
    return { kind: 'info', name: rest[0], authInfo: rest[1] };
  }
  if (cmd === 'create') {
    // create <domain> <authInfo> [period] [ns1,ns2,...] [registrant] [admin:id] [tech:id] [billing:id]
    if (rest.length < 2)
      return {
        kind: 'unknown',
        message:
          'Usage: create <domain> <authInfo> [period] [ns1,ns2,...] [registrant] [contacts...]',
      };
    const payload = parseCreatePayload(rest);
    if (!payload)
      return {
        kind: 'unknown',
        message:
          'Usage: create <domain> <authInfo> [period] [ns1,ns2,...] [registrant] [admin:id] [tech:id] [billing:id]',
      };
    return { kind: 'create', payload };
  }
  if (cmd === 'renew') {
    return {
      kind: 'renew',
      payload: {
        name: rest[0],
        period: rest[1],
        curExpDate: rest[2],
      },
    };
  }
  if (cmd === 'update-ds') {
    if (rest.length < 5)
      return {
        kind: 'unknown',
        message:
          'Usage: update-ds <domain> <keyTag> <alg> <digestType> <digest>',
      };

    return {
      kind: 'update-ds',
      payload: {
        name: rest[0],
        keyTag: rest[1],
        alg: rest[2],
        digestType: rest[3],
        digest: rest[4],
      },
    };
  }

  if (cmd === 'clear-ds') {
    return {
      kind: 'clear-ds',
      name: rest[0],
    };
  }

  if (cmd === 'poll') {
    if (!rest.length) return { kind: 'poll', op: 'req' };
    const op = rest[0].toLowerCase();
    if (op === 'ack') {
      return { kind: 'poll', op: 'ack', msgID: rest[1] };
    }
    if (op === 'req') return { kind: 'poll', op: 'req' };
  }

  if (cmd === 'raw') {
    if (!rest.length) {
      return {
        kind: 'unknown',
        message: "Usage: raw @/path/to/file.xml  OR  raw '<epp>...</epp>'",
      };
    }
    const arg = rest[0];
    // File input: raw @/path/to/file.xml
    if (arg.startsWith('@')) {
      const filePath = arg.slice(1);
      if (!filePath) {
        return { kind: 'unknown', message: 'File path required after @' };
      }
      try {
        const xml = fs.readFileSync(filePath, 'utf-8');
        return { kind: 'send-raw', xml, source: 'file' };
      } catch (err) {
        return {
          kind: 'unknown',
          message: `Failed to read file: ${filePath} - ${err instanceof Error ? err.message : String(err)}`,
        };
      }
    }
    // Inline XML: raw '<epp>...</epp>' (quotes handled by tokenizer)
    // Join all remaining tokens in case XML was split
    const xml = rest.join(' ');
    if (!xml.includes('<')) {
      return {
        kind: 'unknown',
        message:
          "Invalid XML. Usage: raw @/path/to/file.xml  OR  raw '<epp>...</epp>'",
      };
    }
    return { kind: 'send-raw', xml, source: 'inline' };
  }

  return { kind: 'unknown', message: `Unknown command: ${command}` };
}

async function executeAction(
  state: CliState,
  action: CliAction,
): Promise<boolean> {
  switch (action.kind) {
    case 'empty':
      return true;
    case 'help':
      renderHelp(state);
      return true;
    case 'quit':
      resetClient(state);
      return false;
    case 'set-format':
      state.format = action.format;
      console.log(`Format set to ${action.format.toUpperCase()}`);
      return true;
    case 'set-pretty':
      state.pretty = action.value;
      console.log(`Pretty output ${state.pretty ? 'enabled' : 'disabled'}`);
      return true;
    case 'set-color':
      state.color = action.value;
      console.log(`Color ${state.color ? 'enabled' : 'disabled'}`);
      return true;
    case 'set-trace-log': {
      state.logXml = action.level === 'xml' || action.level === 'both';
      state.logParsed = action.level === 'parsed' || action.level === 'both';
      // Update existing client options if client is connected
      if (state.client) {
        state.client.options.logXml = state.logXml;
        state.client.options.logParsed = state.logParsed;
      }
      console.log(
        `Trace log set to ${action.level.toUpperCase()} (xml=${state.logXml ? 'on' : 'off'}, parsed=${state.logParsed ? 'on' : 'off'})`,
      );
      return true;
    }
    case 'set-endpoint': {
      const port = action.port ?? state.connection?.port ?? 700;
      const tls = action.tls ?? state.connection?.tls ?? true;
      state.connection = { host: action.host, port, tls };
      resetClient(state);
      console.log(
        `Endpoint set to ${action.host}:${port} (tls=${tls ? 'on' : 'off'}). Connection reset.`,
      );
      return true;
    }
    case 'hello': {
      const client = await ensureClient(state);
      if (!client) return true;
      const result = await send(client, buildHelloEnvelope());
      printHelloResult(result, state);
      return true;
    }
    case 'login': {
      const user =
        action.user ?? state.credentials?.clID ?? process.env.EPP_USER;
      const pw = action.pw ?? state.credentials?.pw ?? process.env.EPP_PASS;
      if (!user || !pw) {
        console.error(
          'login requires <user> <password> or EPP_USER/EPP_PASS env vars.',
        );
        return true;
      }
      state.credentials = { clID: user, pw };
      state.session ??= defaultSession();
      await runCommand(state, 'login', (client) =>
        sendCommand(
          client,
          buildLoginCommand({
            clID: user,
            pw,
            version: state.session?.version ?? '1.0',
            lang: state.session?.lang ?? 'en',
            objURIs: state.session?.services?.objURIs ?? [DOMAIN_NS],
            extURIs: state.session?.services?.extURIs,
          }),
        ),
      );
      return true;
    }
    case 'renew': {
      await runCommand(state, 'create', (client) =>
        sendCommand(
          client,
          buildDomainRenewCommand({
            name: action.payload.name,
            period: {
              unit: 'y',
              value: Number.parseInt(action.payload.period),
            },
            curExpDate: action.payload.curExpDate,
          }),
        ),
      );
      return true;
    }
    case 'logout':
      await runCommand(state, 'logout', (client) =>
        sendCommand(client, buildLogoutCommand()),
      );
      return true;
    case 'check': {
      const checkOpts = action.withFee
        ? { extension: buildFeeCheckExtension() }
        : undefined;
      await runCommand(state, 'check', (client) =>
        sendCommand(client, buildDomainCheckCommand(action.names, checkOpts)),
      );
      return true;
    }
    case 'info':
      await runCommand(state, 'info', (client) =>
        sendCommand(
          client,
          buildDomainInfoCommand({
            name: action.name,
            authInfo: action.authInfo,
          }),
        ),
      );
      return true;
    case 'create':
      await runCommand(state, 'create', (client) =>
        sendCommand(client, buildDomainCreateCommand(action.payload)),
      );
      return true;
    case 'poll': {
      const msgId = action.op === 'ack' ? action.msgID : undefined;
      if (action.op === 'ack' && !msgId) {
        console.error('poll ack requires a message ID: poll ack <msgID>');
        return true;
      }
      await runCommand(state, 'poll', (client) =>
        sendCommand(
          client,
          action.op === 'req'
            ? buildPollReqCommand()
            : buildPollAckCommand(msgId!),
        ),
      );
      return true;
    }
    case 'send-raw': {
      const client = await ensureClient(state);
      if (!client) return true;
      const result = await sendRaw(client, action.xml);
      printRawResult(result, action.source, state);
      return true;
    }
    case 'unlock':
    case 'lock': {
      const client = await ensureClient(state);
      if (!client) return true;
      const result = await send(
        client,
        buildEppEnvelope({
          'epp:update': {
            'domain:update': {
              'domain:name': action.names[0],
              [action.kind === 'lock' ? 'domain:add' : 'domain:rem']: {
                'domain:status': [
                  {
                    '@_s': 'clientTransferProhibited',
                    '#text': '',
                  },
                ],
              },
            },
          },
        } as const),
      );
      printResult(action.kind, result, state);
      return true;
    }
    case 'add-ns': {
      const client = await ensureClient(state);
      if (!client) return true;
      const result = await send(
        client,
        buildEppEnvelope({
          'epp:update': {
            'domain:update': {
              'domain:name': action.name,
              ['domain:add']: {
                'domain:ns': {
                  'domain:hostObj': action.ns,
                },
              },
            },
          },
        } as const),
      );
      printResult(action.kind, result, state);
      return true;
    }
    case 'remove-ns': {
      const client = await ensureClient(state);
      if (!client) return true;
      const result = await send(
        client,
        buildEppEnvelope({
          'epp:update': {
            'domain:update': {
              'domain:name': action.name,
              ['domain:rem']: {
                'domain:ns': {
                  'domain:hostObj': action.ns,
                },
              },
            },
          },
        } as const),
      );
      printResult(action.kind, result, state);
      return true;
    }
    case 'update-ds': {
      const client = await ensureClient(state);
      if (!client) return true;
      const result = await send(
        client,
        buildEppEnvelope({
          'epp:update': {
            'domain:update': {
              'domain:name': action.payload.name,
            },
          },
          'epp:extension': {
            'secDNS:update': {
              'secDNS:add': {
                'secDNS:dsData': [
                  {
                    'secDNS:keyTag': action.payload.keyTag,
                    'secDNS:alg': action.payload.alg,
                    'secDNS:digestType': action.payload.digestType,
                    'secDNS:digest': action.payload.digest,
                  },
                ],
              },
            },
          },
        } as const),
      );
      printResult(action.kind, result, state);
      return true;
    }
    case 'clear-ds': {
      const client = await ensureClient(state);
      if (!client) return true;
      const result = await send(
        client,
        buildEppEnvelope({
          'epp:update': {
            'domain:update': {
              'domain:name': action.name,
            },
          },
          'epp:extension': {
            'secDNS:update': {
              'secDNS:rem': {
                'secDNS:all': 'true',
              },
            },
          },
        } as const),
      );
      printResult(action.kind, result, state);
      return true;
    }
    case 'unknown':
      console.error(action.message);
      return true;
  }
}

function renderHelp(state: CliState): void {
  console.log('Commands:');
  console.log('- help                     Show this help');
  console.log('- hello                    Send <hello>');
  console.log(
    '- login [user] [pass]      Send <login> (env $EPP_USER/$EPP_PASS supported)',
  );
  console.log('- logout                   Send <logout>');
  console.log('- check <d1> [d2 ...] [--with-fee]');
  console.log(
    '                           Send <domain:check> for one or more domains',
  );
  console.log(
    '                           --with-fee: include fee extension for pricing',
  );
  console.log('- info <domain> [authInfo] Send <domain:info> for a domain');
  console.log(
    '- create <domain> <authInfo> [period] [ns1,ns2] [registrant] [admin:id] [tech:id] [billing:id]',
  );
  console.log(
    '                           Send <domain:create> to register a domain',
  );
  console.log('- poll                     Send <poll op="req">');
  console.log('- poll ack <msgID>         Acknowledge a poll message');
  console.log('- raw @/path/to/file.xml   Send raw XML from file');
  console.log("- raw '<epp>...</epp>'     Send raw inline XML");
  console.log(
    '- SET FORMAT JSON|XML|YAML Change response output format (current ' +
      state.format.toUpperCase() +
      ')',
  );
  console.log(
    `- SET PRETTY 1|0           Pretty-print output (current ${state.pretty ? '1' : '0'})`,
  );
  console.log(
    `- SET COLOR 1|0            Colorize headers (current ${state.color ? '1' : '0'})`,
  );
  console.log(
    `- SET TRACE_LOG NONE|XML|PARSED|BOTH  Trace logging (current ${getTraceLogLevel(state).toUpperCase()})`,
  );
  console.log('- SET ENDPOINT host [port] [tls]');
  console.log('- quit | exit              Exit the shell');
}

function getTraceLogLevel(state: CliState): TraceLogLevel {
  if (state.logXml && state.logParsed) return 'both';
  if (state.logXml) return 'xml';
  if (state.logParsed) return 'parsed';
  return 'none';
}

const HISTORY_FILE = path.join(os.homedir(), '.epp_history');
const MAX_HISTORY_SIZE = 1000;

function loadHistory(): string[] {
  try {
    if (!fs.existsSync(HISTORY_FILE)) return [];
    const content = fs.readFileSync(HISTORY_FILE, 'utf-8');
    return content
      .split('\n')
      .filter((line) => line.trim())
      .slice(-MAX_HISTORY_SIZE);
  } catch {
    return [];
  }
}

function saveHistory(history: string[]): void {
  try {
    const trimmed = history.slice(-MAX_HISTORY_SIZE);
    fs.writeFileSync(HISTORY_FILE, trimmed.join('\n') + '\n', 'utf-8');
  } catch (err) {
    // Silently fail - history is not critical
  }
}

async function startRepl(): Promise<void> {
  const state = createState();
  const completions = [
    'help',
    'hello',
    'login',
    'logout',
    'check',
    'lock',
    'unlock',
    'add-ns',
    'update-ds',
    'clear-ds',
    'remove-ns',
    'check --with-fee',
    'renew',
    'info',
    'create',
    'poll',
    'poll ack',
    'raw',
    'raw @',
    'SET FORMAT JSON',
    'SET FORMAT XML',
    'SET FORMAT YAML',
    'SET PRETTY 1',
    'SET PRETTY 0',
    'SET COLOR 1',
    'SET COLOR 0',
    'SET TRACE_LOG NONE',
    'SET TRACE_LOG XML',
    'SET TRACE_LOG PARSED',
    'SET TRACE_LOG BOTH',
    'SET ENDPOINT',
    'quit',
    'exit',
  ];

  const history = loadHistory();
  ensureClient(state);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'epp> ',
    history,
    historySize: MAX_HISTORY_SIZE,
    completer: (line: string) => {
      const hits = completions.filter((c) =>
        c.toLowerCase().startsWith(line.toLowerCase()),
      );
      return [hits.length ? hits : completions, line];
    },
  });

  const cleanup = () => {
    // Access internal history array from readline
    const rlHistory = (rl as unknown as { history: string[] }).history ?? [];
    saveHistory(rlHistory);
    resetClient(state);
  };

  console.log(
    'EPP REPL ready. Type "help" for commands. Format:',
    state.format.toUpperCase(),
  );
  rl.prompt();

  rl.on('line', (line) => {
    void (async () => {
      const action = parseAction(line);
      const keepGoing = await executeAction(state, action);
      if (!keepGoing) {
        cleanup();
        rl.close();
        return;
      }
      rl.prompt();
    })();
  });

  rl.on('SIGINT', () => {
    cleanup();
    rl.close();
  });

  rl.on('close', () => {
    cleanup();
  });
}

async function startInteractive(): Promise<void> {
  const state = createState();
  console.log('Interactive EPP CLI (inquirer). Use ctrl+c to exit.');
  let running = true;

  while (running) {
    const choice = await select({
      message: 'Choose an action',
      choices: [
        { name: 'Hello', value: 'hello' },
        { name: 'Login', value: 'login' },
        { name: 'Logout', value: 'logout' },
        { name: 'Check domains', value: 'check' },
        { name: 'Info domain', value: 'info' },
        { name: 'Create domain', value: 'create' },
        { name: 'Poll (req)', value: 'poll-req' },
        { name: 'Poll ack', value: 'poll-ack' },
        { name: 'Send raw XML', value: 'raw' },
        {
          name: `Set format (current ${state.format.toUpperCase()})`,
          value: 'format',
        },
        {
          name: `Toggle pretty output (current ${state.pretty ? 'ON' : 'OFF'})`,
          value: 'pretty',
        },
        {
          name: `Toggle color (current ${state.color ? 'ON' : 'OFF'})`,
          value: 'color',
        },
        {
          name: `Set trace log (current ${getTraceLogLevel(state).toUpperCase()})`,
          value: 'trace-log',
        },
        { name: 'Set endpoint', value: 'endpoint' },
        { name: 'Quit', value: 'quit' },
      ],
    });

    if (choice === 'quit') {
      resetClient(state);
      running = false;
      continue;
    }

    if (choice === 'format') {
      const fmt = await select<OutputFormat>({
        message: 'Select response format',
        choices: [
          { name: 'JSON', value: 'json' },
          { name: 'XML', value: 'xml' },
          { name: 'YAML', value: 'yaml' },
        ],
        default: state.format,
      });
      state.format = fmt;
      continue;
    }

    if (choice === 'endpoint') {
      const host = await input({
        message: 'EPP host',
        default: state.connection?.host ?? process.env.EPP_HOST ?? '',
      });
      const port = Number(
        await input({
          message: 'EPP port',
          default: String(
            state.connection?.port ?? process.env.EPP_PORT ?? '700',
          ),
        }),
      );
      const tls = await confirm({
        message: 'Use TLS?',
        default:
          state.connection?.tls ?? parseBoolean(process.env.EPP_TLS, true),
      });
      state.connection = { host, port, tls };
      resetClient(state);
      console.log(
        `Endpoint set to ${host}:${port} (tls=${tls ? 'on' : 'off'}).`,
      );
      continue;
    }

    if (choice === 'pretty') {
      state.pretty = !state.pretty;
      console.log(`Pretty output ${state.pretty ? 'enabled' : 'disabled'}.`);
      continue;
    }

    if (choice === 'color') {
      state.color = !state.color;
      console.log(`Color ${state.color ? 'enabled' : 'disabled'}.`);
      continue;
    }

    if (choice === 'trace-log') {
      const level = await select<TraceLogLevel>({
        message: 'Select trace log level',
        choices: [
          { name: 'NONE - No trace logging', value: 'none' },
          { name: 'XML - Log raw XML frames', value: 'xml' },
          { name: 'PARSED - Log parsed messages', value: 'parsed' },
          { name: 'BOTH - Log XML and parsed', value: 'both' },
        ],
        default: getTraceLogLevel(state),
      });
      await executeAction(state, { kind: 'set-trace-log', level });
      continue;
    }

    if (choice === 'hello') {
      await executeAction(state, { kind: 'hello' });
      continue;
    }

    if (choice === 'login') {
      const user = await input({
        message: 'Username (clID)',
        default: state.credentials?.clID ?? process.env.EPP_USER ?? '',
      });
      const pw = await input({
        message: 'Password',
        default: state.credentials?.pw ?? process.env.EPP_PASS ?? '',
      });
      await executeAction(state, { kind: 'login', user, pw });
      continue;
    }

    if (choice === 'logout') {
      await executeAction(state, { kind: 'logout' });
      continue;
    }

    if (choice === 'check') {
      const rawNames = await input({
        message: 'Domains (space or comma separated)',
        default: '',
      });
      const names = rawNames
        .split(/[\s,]+/)
        .map((v) => v.trim())
        .filter(Boolean);
      if (!names.length) {
        console.error('Provide at least one domain.');
        continue;
      }
      const withFee = await confirm({
        message: 'Include fee extension (pricing info)?',
        default: false,
      });
      await executeAction(state, { kind: 'check', names, withFee });
      continue;
    }

    if (choice === 'info') {
      const name = await input({
        message: 'Domain name',
        default: '',
      });
      if (!name) {
        console.error('Domain name is required.');
        continue;
      }
      const authInfo = await input({
        message: 'Auth info (optional, press enter to skip)',
        default: '',
      });
      await executeAction(state, {
        kind: 'info',
        name,
        authInfo: authInfo || undefined,
      });
      continue;
    }

    if (choice === 'create') {
      const name = await input({
        message: 'Domain name',
        default: '',
      });
      if (!name) {
        console.error('Domain name is required.');
        continue;
      }
      const authInfo = await input({
        message: 'Auth info (password for domain)',
        default: '',
      });
      if (!authInfo) {
        console.error('Auth info is required.');
        continue;
      }
      const periodStr = await input({
        message: 'Period (e.g., 1y, 2y, 12m - optional)',
        default: '',
      });
      const nsStr = await input({
        message:
          'Nameservers (comma-separated, e.g., ns1.example.com,ns2.example.com - optional)',
        default: '',
      });
      const registrant = await input({
        message: 'Registrant contact ID (optional)',
        default: '',
      });
      const adminContact = await input({
        message: 'Admin contact ID (optional)',
        default: '',
      });
      const techContact = await input({
        message: 'Tech contact ID (optional)',
        default: '',
      });
      const billingContact = await input({
        message: 'Billing contact ID (optional)',
        default: '',
      });

      const payload: DomainCreatePayload = { name, authInfo };

      if (periodStr) {
        const periodMatch = periodStr.match(/^(\d+)(y|m)$/i);
        if (periodMatch) {
          payload.period = {
            value: Number.parseInt(periodMatch[1], 10),
            unit: periodMatch[2].toLowerCase() as 'y' | 'm',
          };
        }
      }

      if (nsStr) {
        payload.ns = nsStr
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      }

      if (registrant) {
        payload.registrant = registrant;
      }

      const contacts: DomainCreatePayload['contacts'] = [];
      if (adminContact) contacts.push({ type: 'admin', id: adminContact });
      if (techContact) contacts.push({ type: 'tech', id: techContact });
      if (billingContact)
        contacts.push({ type: 'billing', id: billingContact });
      if (contacts.length) payload.contacts = contacts;

      await executeAction(state, { kind: 'create', payload });
      continue;
    }

    if (choice === 'poll-req') {
      await executeAction(state, { kind: 'poll', op: 'req' });
      continue;
    }

    if (choice === 'poll-ack') {
      const msgId = await input({ message: 'Message ID to ack' });
      if (!msgId) {
        console.error('Message ID is required for poll ack.');
        continue;
      }
      await executeAction(state, { kind: 'poll', op: 'ack', msgID: msgId });
      continue;
    }

    if (choice === 'raw') {
      const source = await select<'inline' | 'file'>({
        message: 'XML source',
        choices: [
          { name: 'File (@/path/to/file.xml)', value: 'file' },
          { name: 'Inline (paste XML)', value: 'inline' },
        ],
      });
      if (source === 'file') {
        const filePath = await input({ message: 'File path' });
        if (!filePath) {
          console.error('File path is required.');
          continue;
        }
        try {
          const xml = fs.readFileSync(filePath, 'utf-8');
          await executeAction(state, { kind: 'send-raw', xml, source: 'file' });
        } catch (err) {
          console.error(
            `Failed to read file: ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      } else {
        const xml = await input({ message: 'XML (paste and press enter)' });
        if (!xml || !xml.includes('<')) {
          console.error('Invalid XML.');
          continue;
        }
        await executeAction(state, { kind: 'send-raw', xml, source: 'inline' });
      }
    }
  }
}

function parseBoolean(value: string | undefined, fallback = false): boolean {
  if (value === undefined) return fallback;
  const normalized = value.toLowerCase();
  return !['false', '0', 'no', 'off'].includes(normalized);
}

function shouldUseColor(state: CliState): boolean {
  if (!state.color) return false;
  if (process.env.NO_COLOR !== undefined) return false;
  if (!process.stdout.isTTY) return false;
  return true;
}

type Color = 'green' | 'red' | 'cyan' | 'yellow';

function colorize(text: string, color: Color): string {
  const codes: Record<Color, string> = {
    green: '\u001B[32m',
    red: '\u001B[31m',
    cyan: '\u001B[36m',
    yellow: '\u001B[33m',
  };
  return `${codes[color]}${text}\u001B[0m`;
}

function flattenWhitespace(input: string): string {
  return input.replace(/\s+/g, ' ').trim();
}

function formatXml(xml: string): string {
  return xmlFormat(xml);
}

function toArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

async function main() {
  const mode = (process.argv[2] ?? 'repl').toLowerCase();
  if (mode === 'interactive' || mode === 'inquirer') {
    await startInteractive();
  } else {
    await startRepl();
  }
}

void main();
