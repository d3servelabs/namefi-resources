import {
  type CliState,
  type CommandDefinition,
  type CheckPayload,
  type ClearDsPayload,
  type DomainCreatePayload,
  type DomainNamesPayload,
  type DomainNsPayload,
  type DomainRenewPayload,
  type DomainTransferPayload,
  type EmptyPayload,
  type InfoPayload,
  type LoginPayload,
  type OutputFormat,
  type ParseOutcome,
  type PollPayload,
  type SendRawPayload,
  type SetBooleanPayload,
  type SetEndpointPayload,
  type SetFormatPayload,
  type SetTraceLogPayload,
  type TraceLogLevel,
  type TransferOp,
  type UpdateDsPayload,
  err,
  ok,
  parseBoolean,
  parseCreatePayload,
  readXmlFile,
} from './commands';
import type { EppClientRuntime, Result, SendResult } from '..';

// =============================================================================
// Execution Context - utilities passed to command executors
// =============================================================================

export interface ExecutionContext {
  ensureClient: (state: CliState) => Promise<EppClientRuntime | undefined>;
  resetClient: (state: CliState) => void;
  runCommand: (
    state: CliState,
    label: string,
    fn: (
      client: EppClientRuntime,
    ) => Promise<Result<SendResult, string | undefined>>,
  ) => Promise<void>;
  printResult: (
    label: string,
    result: Result<SendResult, string | undefined>,
    state: CliState,
  ) => void;
  printHelloResult: (
    result: Result<SendResult, string | undefined>,
    state: CliState,
  ) => void;
  printRawResult: (
    result: Result<SendResult, string | undefined>,
    source: 'inline' | 'file',
    state: CliState,
  ) => void;
  defaultSession: () => NonNullable<CliState['session']>;
  getTraceLogLevel: (state: CliState) => TraceLogLevel;
  // EPP command builders and senders
  send: typeof import('..').send;
  sendCommand: typeof import('..').sendCommand;
  sendRaw: typeof import('..').sendRaw;
  buildHelloEnvelope: typeof import('..').buildHelloEnvelope;
  buildLoginCommand: typeof import('..').buildLoginCommand;
  buildLogoutCommand: typeof import('..').buildLogoutCommand;
  buildDomainCheckCommand: typeof import('..').buildDomainCheckCommand;
  buildDomainInfoCommand: typeof import('..').buildDomainInfoCommand;
  buildDomainCreateCommand: typeof import('..').buildDomainCreateCommand;
  buildDomainRenewCommand: typeof import('..').buildDomainRenewCommand;
  buildDomainTransferCommand: typeof import('..').buildDomainTransferCommand;
  buildPollReqCommand: typeof import('..').buildPollReqCommand;
  buildPollAckCommand: typeof import('..').buildPollAckCommand;
  buildEppEnvelope: typeof import('..').buildEppEnvelope;
}

// =============================================================================
// Command Definitions
// =============================================================================

const DOMAIN_NS = 'urn:ietf:params:xml:ns:domain-1.0';
const FEE_NS = 'urn:ietf:params:xml:ns:epp:fee-1.0';

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

type CommandExecutor<P = unknown> = (
  state: CliState,
  payload: P,
  ctx: ExecutionContext,
) => Promise<boolean>;

interface FullCommandDefinition<K extends string = string, P = unknown>
  extends Omit<CommandDefinition<K, P>, 'execute'> {
  execute: CommandExecutor<P>;
}

// Runtime type for the array (erases payload type for storage)
interface RuntimeCommand {
  kind: string;
  name: string;
  aliases?: string[];
  help: string;
  completions: string[];
  parseArgs: (
    args: string[],
  ) => { ok: true; payload: unknown } | { ok: false; error: string };
  execute: (
    state: CliState,
    payload: unknown,
    ctx: ExecutionContext,
  ) => Promise<boolean>;
}

// -----------------------------------------------------------------------------
// Help Command
// -----------------------------------------------------------------------------

const helpCommand: FullCommandDefinition<'help', EmptyPayload> = {
  kind: 'help',
  name: 'help',
  aliases: ['?'],
  help: 'Show this help',
  completions: ['help'],
  parseArgs: () => ok({}),
  execute: async () => true, // Help rendering handled separately
};

// -----------------------------------------------------------------------------
// Quit Command
// -----------------------------------------------------------------------------

const quitCommand: FullCommandDefinition<'quit', EmptyPayload> = {
  kind: 'quit',
  name: 'quit',
  aliases: ['exit'],
  help: 'Exit the shell',
  completions: ['quit', 'exit'],
  parseArgs: () => ok({}),
  execute: async (state, _, ctx) => {
    ctx.resetClient(state);
    return false;
  },
};

// -----------------------------------------------------------------------------
// Hello Command
// -----------------------------------------------------------------------------

const helloCommand: FullCommandDefinition<'hello', EmptyPayload> = {
  kind: 'hello',
  name: 'hello',
  help: 'Send <hello>',
  completions: ['hello'],
  parseArgs: () => ok({}),
  execute: async (state, _, ctx) => {
    const client = await ctx.ensureClient(state);
    if (!client) return true;
    const result = await ctx.send(client, ctx.buildHelloEnvelope());
    ctx.printHelloResult(result, state);
    return true;
  },
};

// -----------------------------------------------------------------------------
// Login Command
// -----------------------------------------------------------------------------

const loginCommand: FullCommandDefinition<'login', LoginPayload> = {
  kind: 'login',
  name: 'login',
  help: 'Send <login> (env $EPP_USER/$EPP_PASS supported)',
  completions: ['login'],
  parseArgs: (args) => ok({ user: args[0], pw: args[1] }),
  execute: async (state, payload, ctx) => {
    const user =
      payload.user ?? state.credentials?.clID ?? process.env.EPP_USER;
    const pw = payload.pw ?? state.credentials?.pw ?? process.env.EPP_PASS;
    if (!user || !pw) {
      console.error(
        'login requires <user> <password> or EPP_USER/EPP_PASS env vars.',
      );
      return true;
    }
    state.credentials = { clID: user, pw };
    state.session ??= ctx.defaultSession();
    await ctx.runCommand(state, 'login', (client) =>
      ctx.sendCommand(
        client,
        ctx.buildLoginCommand({
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
  },
};

// -----------------------------------------------------------------------------
// Logout Command
// -----------------------------------------------------------------------------

const logoutCommand: FullCommandDefinition<'logout', EmptyPayload> = {
  kind: 'logout',
  name: 'logout',
  help: 'Send <logout>',
  completions: ['logout'],
  parseArgs: () => ok({}),
  execute: async (state, _, ctx) => {
    await ctx.runCommand(state, 'logout', (client) =>
      ctx.sendCommand(client, ctx.buildLogoutCommand()),
    );
    return true;
  },
};

// -----------------------------------------------------------------------------
// Check Command
// -----------------------------------------------------------------------------

const checkCommand: FullCommandDefinition<'check', CheckPayload> = {
  kind: 'check',
  name: 'check',
  help: 'Send <domain:check> for one or more domains\n                           --with-fee: include fee extension for pricing',
  completions: ['check', 'check --with-fee'],
  parseArgs: (args): ParseOutcome<CheckPayload> => {
    const withFee = args.some((arg) => arg === '--with-fee');
    const names = args.filter((arg) => arg !== '--with-fee');
    if (!names.length) {
      return err('Usage: check <domain1> [domain2 ...] [--with-fee]');
    }
    return ok({ names, withFee });
  },
  execute: async (state, payload, ctx) => {
    const checkOpts = payload.withFee
      ? { extension: buildFeeCheckExtension() }
      : undefined;
    await ctx.runCommand(state, 'check', (client) =>
      ctx.sendCommand(
        client,
        ctx.buildDomainCheckCommand(payload.names, checkOpts),
      ),
    );
    return true;
  },
};

// -----------------------------------------------------------------------------
// Info Command
// -----------------------------------------------------------------------------

const infoCommand: FullCommandDefinition<'info', InfoPayload> = {
  kind: 'info',
  name: 'info',
  help: 'Send <domain:info> for a domain',
  completions: ['info'],
  parseArgs: (args): ParseOutcome<InfoPayload> => {
    if (!args.length) {
      return err('Usage: info <domain> [authInfo]');
    }
    return ok({ name: args[0], authInfo: args[1] });
  },
  execute: async (state, payload, ctx) => {
    await ctx.runCommand(state, 'info', (client) =>
      ctx.sendCommand(
        client,
        ctx.buildDomainInfoCommand({
          name: payload.name,
          authInfo: payload.authInfo,
        }),
      ),
    );
    return true;
  },
};

// -----------------------------------------------------------------------------
// Create Command
// -----------------------------------------------------------------------------

const createCommand: FullCommandDefinition<'create', DomainCreatePayload> = {
  kind: 'create',
  name: 'create',
  help: 'Send <domain:create> to register a domain',
  completions: ['create'],
  parseArgs: (args): ParseOutcome<DomainCreatePayload> => {
    if (args.length < 2) {
      return err(
        'Usage: create <domain> <authInfo> [period] [ns1,ns2,...] [registrant] [admin:id] [tech:id] [billing:id]',
      );
    }
    const payload = parseCreatePayload(args);
    if (!payload) {
      return err(
        'Usage: create <domain> <authInfo> [period] [ns1,ns2,...] [registrant] [admin:id] [tech:id] [billing:id]',
      );
    }
    return ok(payload);
  },
  execute: async (state, payload, ctx) => {
    await ctx.runCommand(state, 'create', (client) =>
      ctx.sendCommand(client, ctx.buildDomainCreateCommand(payload)),
    );
    return true;
  },
};

// -----------------------------------------------------------------------------
// Renew Command
// -----------------------------------------------------------------------------

const renewCommand: FullCommandDefinition<'renew', DomainRenewPayload> = {
  kind: 'renew',
  name: 'renew',
  help: 'Send <domain:renew> to renew a domain',
  completions: ['renew'],
  parseArgs: (args): ParseOutcome<DomainRenewPayload> => {
    if (args.length < 3) {
      return err('Usage: renew <domain> <period> <curExpDate>');
    }
    return ok({ name: args[0], period: args[1], curExpDate: args[2] });
  },
  execute: async (state, payload, ctx) => {
    await ctx.runCommand(state, 'renew', (client) =>
      ctx.sendCommand(
        client,
        ctx.buildDomainRenewCommand({
          name: payload.name,
          period: {
            unit: 'y',
            value: Number.parseInt(payload.period),
          },
          curExpDate: payload.curExpDate,
        }),
      ),
    );
    return true;
  },
};

// -----------------------------------------------------------------------------
// Transfer Commands (query, request, approve, cancel, reject)
// -----------------------------------------------------------------------------

function parseTransferPayload(
  args: string[],
): ParseOutcome<DomainTransferPayload> {
  if (!args.length) {
    return err('Usage: transfer-<op> <domain> [authInfo] [period]');
  }
  const payload: DomainTransferPayload = { name: args[0] };

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    // Check if it's a period (e.g., 1y, 2y)
    if (/^\d+y$/i.test(arg)) {
      payload.period = arg;
    } else if (!payload.authInfo) {
      payload.authInfo = arg;
    }
  }

  return ok(payload);
}

function buildTransferExecutor(op: TransferOp) {
  return async (
    state: CliState,
    payload: DomainTransferPayload,
    ctx: ExecutionContext,
  ): Promise<boolean> => {
    const period = payload.period
      ? { value: Number.parseInt(payload.period), unit: 'y' as const }
      : undefined;

    await ctx.runCommand(state, `transfer-${op}`, (client) =>
      ctx.sendCommand(
        client,
        ctx.buildDomainTransferCommand({
          op,
          name: payload.name,
          authInfo: payload.authInfo,
          period,
        }),
      ),
    );
    return true;
  };
}

const transferQueryCommand: FullCommandDefinition<
  'transfer-query',
  DomainTransferPayload
> = {
  kind: 'transfer-query',
  name: 'transfer-query',
  aliases: ['transfer query'],
  help: 'Query domain transfer status',
  completions: ['transfer-query'],
  parseArgs: parseTransferPayload,
  execute: buildTransferExecutor('query'),
};

const transferRequestCommand: FullCommandDefinition<
  'transfer-request',
  DomainTransferPayload
> = {
  kind: 'transfer-request',
  name: 'transfer-request',
  aliases: ['transfer request'],
  help: 'Request domain transfer (requires authInfo)',
  completions: ['transfer-request'],
  parseArgs: (args): ParseOutcome<DomainTransferPayload> => {
    if (args.length < 2) {
      return err('Usage: transfer-request <domain> <authInfo> [period]');
    }
    return parseTransferPayload(args);
  },
  execute: buildTransferExecutor('request'),
};

const transferApproveCommand: FullCommandDefinition<
  'transfer-approve',
  DomainTransferPayload
> = {
  kind: 'transfer-approve',
  name: 'transfer-approve',
  aliases: ['transfer approve'],
  help: 'Approve pending domain transfer',
  completions: ['transfer-approve'],
  parseArgs: parseTransferPayload,
  execute: buildTransferExecutor('approve'),
};

const transferCancelCommand: FullCommandDefinition<
  'transfer-cancel',
  DomainTransferPayload
> = {
  kind: 'transfer-cancel',
  name: 'transfer-cancel',
  aliases: ['transfer cancel'],
  help: 'Cancel pending domain transfer',
  completions: ['transfer-cancel'],
  parseArgs: parseTransferPayload,
  execute: buildTransferExecutor('cancel'),
};

const transferRejectCommand: FullCommandDefinition<
  'transfer-reject',
  DomainTransferPayload
> = {
  kind: 'transfer-reject',
  name: 'transfer-reject',
  aliases: ['transfer reject'],
  help: 'Reject pending domain transfer',
  completions: ['transfer-reject'],
  parseArgs: parseTransferPayload,
  execute: buildTransferExecutor('reject'),
};

// -----------------------------------------------------------------------------
// Poll Command
// -----------------------------------------------------------------------------

const pollCommand: FullCommandDefinition<'poll', PollPayload> = {
  kind: 'poll',
  name: 'poll',
  help: 'Send <poll op="req"> or poll ack <msgID>',
  completions: ['poll', 'poll ack'],
  parseArgs: (args): ParseOutcome<PollPayload> => {
    if (!args.length) return ok({ op: 'req' });
    const op = args[0].toLowerCase();
    if (op === 'ack') {
      return ok({ op: 'ack', msgID: args[1] });
    }
    if (op === 'req') return ok({ op: 'req' });
    return ok({ op: 'req' });
  },
  execute: async (state, payload, ctx) => {
    if (payload.op === 'ack' && !payload.msgID) {
      console.error('poll ack requires a message ID: poll ack <msgID>');
      return true;
    }
    await ctx.runCommand(state, 'poll', (client) =>
      ctx.sendCommand(
        client,
        payload.op === 'req'
          ? ctx.buildPollReqCommand()
          : ctx.buildPollAckCommand(payload.msgID!),
      ),
    );
    return true;
  },
};

// -----------------------------------------------------------------------------
// Raw Command
// -----------------------------------------------------------------------------

const rawCommand: FullCommandDefinition<'raw', SendRawPayload> = {
  kind: 'raw',
  name: 'raw',
  help: "Send raw XML from file (@/path) or inline ('<epp>...</epp>')",
  completions: ['raw', 'raw @'],
  parseArgs: (args): ParseOutcome<SendRawPayload> => {
    if (!args.length) {
      return err("Usage: raw @/path/to/file.xml  OR  raw '<epp>...</epp>'");
    }
    const arg = args[0];
    if (arg.startsWith('@')) {
      const filePath = arg.slice(1);
      if (!filePath) {
        return err('File path required after @');
      }
      const fileResult = readXmlFile(filePath);
      if (!fileResult.ok) return fileResult;
      return ok({ xml: fileResult.payload, source: 'file' as const });
    }
    const xml = args.join(' ');
    if (!xml.includes('<')) {
      return err(
        "Invalid XML. Usage: raw @/path/to/file.xml  OR  raw '<epp>...</epp>'",
      );
    }
    return ok({ xml, source: 'inline' as const });
  },
  execute: async (state, payload, ctx) => {
    const client = await ctx.ensureClient(state);
    if (!client) return true;
    const result = await ctx.sendRaw(client, payload.xml);
    ctx.printRawResult(result, payload.source, state);
    return true;
  },
};

// -----------------------------------------------------------------------------
// Lock Command
// -----------------------------------------------------------------------------

const lockCommand: FullCommandDefinition<'lock', DomainNamesPayload> = {
  kind: 'lock',
  name: 'lock',
  help: 'Add clientTransferProhibited status to domain',
  completions: ['lock'],
  parseArgs: (args): ParseOutcome<DomainNamesPayload> => {
    if (!args.length) return err('Usage: lock <domain>');
    return ok({ names: args });
  },
  execute: async (state, payload, ctx) => {
    const client = await ctx.ensureClient(state);
    if (!client) return true;
    const result = await ctx.send(
      client,
      ctx.buildEppEnvelope({
        'epp:update': {
          'domain:update': {
            'domain:name': payload.names[0],
            'domain:add': {
              'domain:status': [
                { '@_s': 'clientTransferProhibited', '#text': '' },
              ],
            },
          },
        },
      } as const),
    );
    ctx.printResult('lock', result, state);
    return true;
  },
};

// -----------------------------------------------------------------------------
// Unlock Command
// -----------------------------------------------------------------------------

const unlockCommand: FullCommandDefinition<'unlock', DomainNamesPayload> = {
  kind: 'unlock',
  name: 'unlock',
  help: 'Remove clientTransferProhibited status from domain',
  completions: ['unlock'],
  parseArgs: (args): ParseOutcome<DomainNamesPayload> => {
    if (!args.length) return err('Usage: unlock <domain>');
    return ok({ names: args });
  },
  execute: async (state, payload, ctx) => {
    const client = await ctx.ensureClient(state);
    if (!client) return true;
    const result = await ctx.send(
      client,
      ctx.buildEppEnvelope({
        'epp:update': {
          'domain:update': {
            'domain:name': payload.names[0],
            'domain:rem': {
              'domain:status': [
                { '@_s': 'clientTransferProhibited', '#text': '' },
              ],
            },
          },
        },
      } as const),
    );
    ctx.printResult('unlock', result, state);
    return true;
  },
};

// -----------------------------------------------------------------------------
// Add-NS Command
// -----------------------------------------------------------------------------

const addNsCommand: FullCommandDefinition<'add-ns', DomainNsPayload> = {
  kind: 'add-ns',
  name: 'add-ns',
  help: 'Add nameservers to a domain',
  completions: ['add-ns'],
  parseArgs: (args): ParseOutcome<DomainNsPayload> => {
    if (args.length < 2) return err('Usage: add-ns <domain> <ns1> [ns2 ...]');
    return ok({ name: args[0], ns: args.slice(1) });
  },
  execute: async (state, payload, ctx) => {
    const client = await ctx.ensureClient(state);
    if (!client) return true;
    const result = await ctx.send(
      client,
      ctx.buildEppEnvelope({
        'epp:update': {
          'domain:update': {
            'domain:name': payload.name,
            'domain:add': {
              'domain:ns': { 'domain:hostObj': payload.ns },
            },
          },
        },
      } as const),
    );
    ctx.printResult('add-ns', result, state);
    return true;
  },
};

// -----------------------------------------------------------------------------
// Remove-NS Command
// -----------------------------------------------------------------------------

const removeNsCommand: FullCommandDefinition<'remove-ns', DomainNsPayload> = {
  kind: 'remove-ns',
  name: 'remove-ns',
  help: 'Remove nameservers from a domain',
  completions: ['remove-ns'],
  parseArgs: (args): ParseOutcome<DomainNsPayload> => {
    if (args.length < 2)
      return err('Usage: remove-ns <domain> <ns1> [ns2 ...]');
    return ok({ name: args[0], ns: args.slice(1) });
  },
  execute: async (state, payload, ctx) => {
    const client = await ctx.ensureClient(state);
    if (!client) return true;
    const result = await ctx.send(
      client,
      ctx.buildEppEnvelope({
        'epp:update': {
          'domain:update': {
            'domain:name': payload.name,
            'domain:rem': {
              'domain:ns': { 'domain:hostObj': payload.ns },
            },
          },
        },
      } as const),
    );
    ctx.printResult('remove-ns', result, state);
    return true;
  },
};

// -----------------------------------------------------------------------------
// Update-DS Command
// -----------------------------------------------------------------------------

const updateDsCommand: FullCommandDefinition<'update-ds', UpdateDsPayload> = {
  kind: 'update-ds',
  name: 'update-ds',
  help: 'Add DNSSEC DS record to a domain',
  completions: ['update-ds'],
  parseArgs: (args): ParseOutcome<UpdateDsPayload> => {
    if (args.length < 5) {
      return err(
        'Usage: update-ds <domain> <keyTag> <alg> <digestType> <digest>',
      );
    }
    return ok({
      name: args[0],
      keyTag: args[1],
      alg: args[2],
      digestType: args[3],
      digest: args[4],
    });
  },
  execute: async (state, payload, ctx) => {
    const client = await ctx.ensureClient(state);
    if (!client) return true;
    const result = await ctx.send(
      client,
      ctx.buildEppEnvelope({
        'epp:update': {
          'domain:update': { 'domain:name': payload.name },
        },
        'epp:extension': {
          'secDNS:update': {
            'secDNS:add': {
              'secDNS:dsData': [
                {
                  'secDNS:keyTag': payload.keyTag,
                  'secDNS:alg': payload.alg,
                  'secDNS:digestType': payload.digestType,
                  'secDNS:digest': payload.digest,
                },
              ],
            },
          },
        },
      } as const),
    );
    ctx.printResult('update-ds', result, state);
    return true;
  },
};

// -----------------------------------------------------------------------------
// Clear-DS Command
// -----------------------------------------------------------------------------

const clearDsCommand: FullCommandDefinition<'clear-ds', ClearDsPayload> = {
  kind: 'clear-ds',
  name: 'clear-ds',
  help: 'Remove all DNSSEC DS records from a domain',
  completions: ['clear-ds'],
  parseArgs: (args): ParseOutcome<ClearDsPayload> => {
    if (!args.length) return err('Usage: clear-ds <domain>');
    return ok({ name: args[0] });
  },
  execute: async (state, payload, ctx) => {
    const client = await ctx.ensureClient(state);
    if (!client) return true;
    const result = await ctx.send(
      client,
      ctx.buildEppEnvelope({
        'epp:update': {
          'domain:update': { 'domain:name': payload.name },
        },
        'epp:extension': {
          'secDNS:update': {
            'secDNS:rem': { 'secDNS:all': 'true' },
          },
        },
      } as const),
    );
    ctx.printResult('clear-ds', result, state);
    return true;
  },
};

// -----------------------------------------------------------------------------
// Set Format Command
// -----------------------------------------------------------------------------

const setFormatCommand: FullCommandDefinition<'set-format', SetFormatPayload> =
  {
    kind: 'set-format',
    name: 'set format',
    help: 'Change response output format',
    completions: ['SET FORMAT JSON', 'SET FORMAT XML', 'SET FORMAT YAML'],
    parseArgs: (args): ParseOutcome<SetFormatPayload> => {
      if (!args.length) return err('Supported formats: JSON | XML | YAML');
      const fmt = args[0].toLowerCase() as OutputFormat;
      if (fmt !== 'json' && fmt !== 'xml' && fmt !== 'yaml') {
        return err('Supported formats: JSON | XML | YAML');
      }
      return ok({ format: fmt });
    },
    execute: async (state, payload) => {
      state.format = payload.format;
      console.log(`Format set to ${payload.format.toUpperCase()}`);
      return true;
    },
  };

// -----------------------------------------------------------------------------
// Set Pretty Command
// -----------------------------------------------------------------------------

const setPrettyCommand: FullCommandDefinition<'set-pretty', SetBooleanPayload> =
  {
    kind: 'set-pretty',
    name: 'set pretty',
    help: 'Pretty-print output',
    completions: ['SET PRETTY 1', 'SET PRETTY 0'],
    parseArgs: (args): ParseOutcome<SetBooleanPayload> => {
      return ok({ value: parseBoolean(args[0], true) });
    },
    execute: async (state, payload) => {
      state.pretty = payload.value;
      console.log(`Pretty output ${state.pretty ? 'enabled' : 'disabled'}`);
      return true;
    },
  };

// -----------------------------------------------------------------------------
// Set Color Command
// -----------------------------------------------------------------------------

const setColorCommand: FullCommandDefinition<'set-color', SetBooleanPayload> = {
  kind: 'set-color',
  name: 'set color',
  help: 'Colorize headers',
  completions: ['SET COLOR 1', 'SET COLOR 0'],
  parseArgs: (args): ParseOutcome<SetBooleanPayload> => {
    return ok({ value: parseBoolean(args[0], true) });
  },
  execute: async (state, payload) => {
    state.color = payload.value;
    console.log(`Color ${state.color ? 'enabled' : 'disabled'}`);
    return true;
  },
};

// -----------------------------------------------------------------------------
// Set Trace Log Command
// -----------------------------------------------------------------------------

const setTraceLogCommand: FullCommandDefinition<
  'set-trace-log',
  SetTraceLogPayload
> = {
  kind: 'set-trace-log',
  name: 'set trace_log',
  aliases: ['set tracelog'],
  help: 'Trace logging level',
  completions: [
    'SET TRACE_LOG NONE',
    'SET TRACE_LOG XML',
    'SET TRACE_LOG PARSED',
    'SET TRACE_LOG BOTH',
  ],
  parseArgs: (args): ParseOutcome<SetTraceLogPayload> => {
    if (!args.length)
      return err('Supported trace log levels: NONE | XML | PARSED | BOTH');
    const level = args[0].toLowerCase() as TraceLogLevel;
    if (
      level !== 'none' &&
      level !== 'xml' &&
      level !== 'parsed' &&
      level !== 'both'
    ) {
      return err('Supported trace log levels: NONE | XML | PARSED | BOTH');
    }
    return ok({ level });
  },
  execute: async (state, payload) => {
    state.logXml = payload.level === 'xml' || payload.level === 'both';
    state.logParsed = payload.level === 'parsed' || payload.level === 'both';
    if (state.client) {
      state.client.options.logXml = state.logXml;
      state.client.options.logParsed = state.logParsed;
    }
    console.log(
      `Trace log set to ${payload.level.toUpperCase()} (xml=${state.logXml ? 'on' : 'off'}, parsed=${state.logParsed ? 'on' : 'off'})`,
    );
    return true;
  },
};

// -----------------------------------------------------------------------------
// Set Endpoint Command
// -----------------------------------------------------------------------------

const setEndpointCommand: FullCommandDefinition<
  'set-endpoint',
  SetEndpointPayload
> = {
  kind: 'set-endpoint',
  name: 'set endpoint',
  help: 'Set EPP server endpoint',
  completions: ['SET ENDPOINT'],
  parseArgs: (args): ParseOutcome<SetEndpointPayload> => {
    if (!args.length) return err('Usage: SET ENDPOINT <host> [port] [tls]');
    return ok({
      host: args[0],
      port: args[1] ? Number(args[1]) : undefined,
      tls: args[2] ? parseBoolean(args[2]) : undefined,
    });
  },
  execute: async (state, payload, ctx) => {
    const port = payload.port ?? state.connection?.port ?? 700;
    const tls = payload.tls ?? state.connection?.tls ?? true;
    state.connection = { host: payload.host, port, tls };
    ctx.resetClient(state);
    console.log(
      `Endpoint set to ${payload.host}:${port} (tls=${tls ? 'on' : 'off'}). Connection reset.`,
    );
    return true;
  },
};

// =============================================================================
// Command Registry
// =============================================================================

// All commands in the order they should appear in help
// Cast to RuntimeCommand[] to erase the specific payload types
export const COMMANDS: RuntimeCommand[] = [
  helpCommand,
  helloCommand,
  loginCommand,
  logoutCommand,
  checkCommand,
  infoCommand,
  createCommand,
  renewCommand,
  transferQueryCommand,
  transferRequestCommand,
  transferApproveCommand,
  transferCancelCommand,
  transferRejectCommand,
  pollCommand,
  rawCommand,
  lockCommand,
  unlockCommand,
  addNsCommand,
  removeNsCommand,
  updateDsCommand,
  clearDsCommand,
  setFormatCommand,
  setPrettyCommand,
  setColorCommand,
  setTraceLogCommand,
  setEndpointCommand,
  quitCommand,
] as RuntimeCommand[];

// Build lookup maps for efficient parsing
const commandByName = new Map<string, RuntimeCommand>();
for (const cmd of COMMANDS) {
  commandByName.set(cmd.name.toLowerCase(), cmd);
  if (cmd.aliases) {
    for (const alias of cmd.aliases) {
      commandByName.set(alias.toLowerCase(), cmd);
    }
  }
}

// =============================================================================
// Registry API
// =============================================================================

export function findCommand(input: string): RuntimeCommand | undefined {
  const normalized = input.toLowerCase();
  return commandByName.get(normalized);
}

export function findCommandByPrefix(tokens: string[]): {
  command: RuntimeCommand | undefined;
  args: string[];
} {
  if (!tokens.length) return { command: undefined, args: [] };

  // Try progressively longer prefixes (for "set format", "set endpoint", etc.)
  for (let len = Math.min(tokens.length, 3); len >= 1; len--) {
    const prefix = tokens.slice(0, len).join(' ').toLowerCase();
    const cmd = commandByName.get(prefix);
    if (cmd) {
      return { command: cmd, args: tokens.slice(len) };
    }
  }

  return { command: undefined, args: tokens };
}

export function getAllCompletions(): string[] {
  const completions: string[] = [];
  for (const cmd of COMMANDS) {
    completions.push(...cmd.completions);
  }
  return completions;
}

export function getHelpLines(
  state: CliState,
  getTraceLogLevel: (s: CliState) => TraceLogLevel,
): string[] {
  const lines: string[] = ['Commands:'];

  // Group commands by type for better organization
  const eppCommands = [
    'hello',
    'login',
    'logout',
    'check',
    'info',
    'create',
    'renew',
    'poll',
    'raw',
  ];
  const domainCommands = [
    'lock',
    'unlock',
    'add-ns',
    'remove-ns',
    'update-ds',
    'clear-ds',
    'transfer-query',
    'transfer-request',
    'transfer-approve',
    'transfer-cancel',
    'transfer-reject',
  ];
  const settingsCommands = [
    'set-format',
    'set-pretty',
    'set-color',
    'set-trace-log',
    'set-endpoint',
  ];
  const utilCommands = ['help', 'quit'];

  const formatLine = (cmd: RuntimeCommand) => {
    let cmdName = cmd.name;
    // Add argument hints based on command
    if (cmd.kind === 'login') cmdName = 'login [user] [pass]';
    else if (cmd.kind === 'check') cmdName = 'check <d1> [d2 ...] [--with-fee]';
    else if (cmd.kind === 'info') cmdName = 'info <domain> [authInfo]';
    else if (cmd.kind === 'create')
      cmdName =
        'create <domain> <authInfo> [period] [ns1,ns2] [registrant] [admin:id] [tech:id] [billing:id]';
    else if (cmd.kind === 'renew')
      cmdName = 'renew <domain> <period> <curExpDate>';
    else if (cmd.kind === 'poll') cmdName = 'poll [ack <msgID>]';
    else if (cmd.kind === 'raw') cmdName = "raw @/path OR '<xml>'";
    else if (cmd.kind === 'set-format')
      cmdName = `SET FORMAT JSON|XML|YAML (current ${state.format.toUpperCase()})`;
    else if (cmd.kind === 'set-pretty')
      cmdName = `SET PRETTY 1|0 (current ${state.pretty ? '1' : '0'})`;
    else if (cmd.kind === 'set-color')
      cmdName = `SET COLOR 1|0 (current ${state.color ? '1' : '0'})`;
    else if (cmd.kind === 'set-trace-log')
      cmdName = `SET TRACE_LOG NONE|XML|PARSED|BOTH (current ${getTraceLogLevel(state).toUpperCase()})`;
    else if (cmd.kind === 'set-endpoint')
      cmdName = 'SET ENDPOINT host [port] [tls]';
    else if (cmd.kind === 'quit') cmdName = 'quit | exit';

    const padding = 27 - cmdName.length;
    return `- ${cmdName}${' '.repeat(Math.max(1, padding))}${cmd.help.split('\n')[0]}`;
  };

  for (const cmd of COMMANDS) {
    if (
      eppCommands.includes(cmd.kind) ||
      domainCommands.includes(cmd.kind) ||
      settingsCommands.includes(cmd.kind) ||
      utilCommands.includes(cmd.kind)
    ) {
      lines.push(formatLine(cmd));
    }
  }

  return lines;
}

export type { FullCommandDefinition, RuntimeCommand };
