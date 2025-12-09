// @ts-nocheck
import fs from 'node:fs';
import type { EppClientRuntime, EppCredentials, EppSessionConfig } from '..';
import type { ConnectOptions } from '../transport';

// =============================================================================
// Types
// =============================================================================

export type OutputFormat = 'json' | 'xml' | 'yaml';
export type TraceLogLevel = 'none' | 'xml' | 'parsed' | 'both';

export interface CliState {
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

export interface ParseResult<T> {
  ok: true;
  payload: T;
}

export interface ParseError {
  ok: false;
  error: string;
}

export type ParseOutcome<T> = ParseResult<T> | ParseError;

// =============================================================================
// Command Definition
// =============================================================================

export interface CommandDefinition<K extends string = string, P = unknown> {
  /** Unique command identifier */
  kind: K;
  /** Primary command name (what user types) */
  name: string;
  /** Alternative names/aliases */
  aliases?: string[];
  /** Help text description */
  help: string;
  /** Tab completion suggestions */
  completions: string[];
  /** Parse arguments into payload, return error string if invalid */
  parseArgs: (args: string[]) => ParseOutcome<P>;
  /** Execute the command, return false to quit REPL */
  execute: (state: CliState, payload: P) => Promise<boolean>;
}

// =============================================================================
// Payload Types
// =============================================================================

// biome-ignore lint/suspicious/noEmptyInterface: nvm
export interface EmptyPayload {}

export interface LoginPayload {
  user?: string;
  pw?: string;
}

export interface CheckPayload {
  names: string[];
  withFee: boolean;
}

export interface InfoPayload {
  name: string;
  authInfo?: string;
}

export interface DomainCreatePayload {
  name: string;
  period?: { value: number; unit: 'y' | 'm' };
  ns?: string[];
  registrant: string;
  contacts?: { type: 'admin' | 'tech' | 'billing'; id: string }[];
  authInfo: string;
}

export interface DomainRenewPayload {
  name: string;
  period: string;
  curExpDate: string;
}

export interface PollPayload {
  op: 'req' | 'ack';
  msgID?: string;
}

export interface SendRawPayload {
  xml: string;
  source: 'inline' | 'file';
}

export interface SetFormatPayload {
  format: OutputFormat;
}

export interface SetBooleanPayload {
  value: boolean;
}

export interface SetTraceLogPayload {
  level: TraceLogLevel;
}

export interface SetEndpointPayload {
  host: string;
  port?: number;
  tls?: boolean;
}

export interface DomainNamesPayload {
  names: string[];
}

export interface DomainNsPayload {
  name: string;
  ns: string[];
}

export interface UpdateDsPayload {
  name: string;
  keyTag: string;
  alg: string;
  digest: string;
  digestType: string;
}

export interface ClearDsPayload {
  name: string;
}

export type TransferOp = 'query' | 'request' | 'approve' | 'cancel' | 'reject';

export interface DomainTransferPayload {
  name: string;
  authInfo?: string;
  period?: string; // e.g., "1y", "2y"
}

// =============================================================================
// Helpers
// =============================================================================

export function parseBoolean(
  value: string | undefined,
  fallback = false,
): boolean {
  if (value === undefined) return fallback;
  const normalized = value.toLowerCase();
  return !['false', '0', 'no', 'off'].includes(normalized);
}

export function ok<T>(payload: T): ParseResult<T> {
  return { ok: true, payload };
}

export function err(error: string): ParseError {
  return { ok: false, error };
}

/**
 * Parse create command arguments:
 * create <domain> <authInfo> [period] [ns1,ns2,...] [registrant] [admin:id] [tech:id] [billing:id]
 */
export function parseCreatePayload(args: string[]): DomainCreatePayload | null {
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
    // TODO this is not a valid check
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

/**
 * Read XML from file path
 */
export function readXmlFile(filePath: string): ParseOutcome<string> {
  try {
    const xml = fs.readFileSync(filePath, 'utf-8');
    return ok(xml);
  } catch (error) {
    return err(
      `Failed to read file: ${filePath} - ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
