#!/usr/bin/env tsx
/** biome-ignore-all lint/suspicious/noConsole: console app */
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
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
  buildDomainRenewCommand,
  buildDomainTransferCommand,
  buildPollReqCommand,
  buildPollAckCommand,
  type EppClientRuntime,
  type EppCredentials,
  type Result,
  type SendResult,
  buildEppEnvelopeFromCommand,
} from '..';
import type { ConnectOptions } from '../transport';
import xmlFormat from 'xml-formatter';
import {
  type CliState,
  type OutputFormat,
  type TraceLogLevel,
  type DomainCreatePayload,
  parseBoolean,
} from './commands';
import {
  findCommandByPrefix,
  getAllCompletions,
  getHelpLines,
  type ExecutionContext,
  type RuntimeCommand,
} from './command-registry';

const DOMAIN_NS = 'urn:ietf:params:xml:ns:domain-1.0';

function defaultSession(): NonNullable<CliState['session']> {
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

// =============================================================================
// Command Parsing & Execution (uses registry)
// =============================================================================

interface ParsedCommand {
  command: RuntimeCommand | undefined;
  payload: unknown;
  error?: string;
}

function parseCommand(input: string): ParsedCommand {
  if (!input.trim()) return { command: undefined, payload: undefined };

  const { tokens, missing } = expandEnv(tokenize(input.trim()));
  if (missing.length) {
    console.warn(
      `Missing env vars (${missing.join(', ')}); replaced with empty string.`,
    );
  }
  if (!tokens.length) return { command: undefined, payload: undefined };

  const { command, args } = findCommandByPrefix(tokens);
  if (!command) {
    return {
      command: undefined,
      payload: undefined,
      error: `Unknown command: ${tokens[0]}`,
    };
  }

  const parseResult = command.parseArgs(args);
  if (!parseResult.ok) {
    return { command: undefined, payload: undefined, error: parseResult.error };
  }

  return { command, payload: parseResult.payload };
}

// Create execution context with all utilities needed by commands
function createExecutionContext(): ExecutionContext {
  return {
    ensureClient,
    resetClient,
    runCommand,
    printResult,
    printHelloResult,
    printRawResult,
    defaultSession,
    getTraceLogLevel,
    send,
    sendCommand,
    sendRaw,
    buildHelloEnvelope,
    buildLoginCommand,
    buildLogoutCommand,
    buildDomainCheckCommand,
    buildDomainInfoCommand,
    buildDomainCreateCommand,
    buildDomainRenewCommand,
    buildDomainTransferCommand,
    buildPollReqCommand,
    buildPollAckCommand,
    buildEppEnvelope: buildEppEnvelopeFromCommand,
  };
}

async function executeCommand(
  state: CliState,
  input: string,
): Promise<boolean> {
  const parsed = parseCommand(input);

  // Empty input - continue REPL
  if (!parsed.command && !parsed.error) {
    return true;
  }

  // Parse error
  if (parsed.error) {
    console.error(parsed.error);
    return true;
  }

  // Special handling for help command
  if (parsed.command!.kind === 'help') {
    renderHelp(state);
    return true;
  }

  // Execute the command
  const ctx = createExecutionContext();
  return parsed.command!.execute(state, parsed.payload, ctx);
}

function renderHelp(state: CliState): void {
  const lines = getHelpLines(state, getTraceLogLevel);
  for (const line of lines) {
    console.log(line);
  }
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
  const completions = getAllCompletions();

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
      const keepGoing = await executeCommand(state, line);
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
      await executeCommand(state, `set trace_log ${level}`);
      continue;
    }

    if (choice === 'hello') {
      await executeCommand(state, 'hello');
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
      await executeCommand(state, `login "${user}" "${pw}"`);
      continue;
    }

    if (choice === 'logout') {
      await executeCommand(state, 'logout');
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
      const feeFlag = withFee ? ' --with-fee' : '';
      await executeCommand(state, `check ${names.join(' ')}${feeFlag}`);
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
      const authPart = authInfo ? ` "${authInfo}"` : '';
      await executeCommand(state, `info "${name}"${authPart}`);
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

      // Build command string
      const parts = [`create "${name}" "${authInfo}"`];
      if (periodStr) parts.push(periodStr);
      if (nsStr) parts.push(nsStr);
      if (registrant) parts.push(registrant);
      if (adminContact) parts.push(`admin:${adminContact}`);
      if (techContact) parts.push(`tech:${techContact}`);
      if (billingContact) parts.push(`billing:${billingContact}`);

      await executeCommand(state, parts.join(' '));
      continue;
    }

    if (choice === 'poll-req') {
      await executeCommand(state, 'poll req');
      continue;
    }

    if (choice === 'poll-ack') {
      const msgId = await input({ message: 'Message ID to ack' });
      if (!msgId) {
        console.error('Message ID is required for poll ack.');
        continue;
      }
      await executeCommand(state, `poll ack ${msgId}`);
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
        await executeCommand(state, `raw @${filePath}`);
      } else {
        const xml = await input({ message: 'XML (paste and press enter)' });
        if (!xml || !xml.includes('<')) {
          console.error('Invalid XML.');
          continue;
        }
        await executeCommand(state, `raw '${xml}'`);
      }
    }
  }
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
