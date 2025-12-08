/**
 * Type-safe EPP command builders using Zod schemas.
 * These builders create the XML JSON structure expected by the codecs.
 */
import type { z } from 'zod';
import {
  type EppCommandTypeXml,
  type EppLoginTypeXml,
  type EppPollTypeXml,
  type DomainMNameTypeXml,
  type DomainInfoTypeXml,
  DomainCreateTypeXml,
  type DomainRenewTypeXml,
  DomainTransferTypeXml,
  type DomainUpdateTypeXml,
  type ContactCheckTypeXml,
  type ContactInfoXml,
  type ContactCreateTypeXml,
  type ContactUpdateTypeXml,
  type HostCheckTypeXml,
  type HostInfoXml,
  type HostCreateTypeXml,
  type HostUpdateTypeXml,
  EppCreateCommandTypeXml,
  EppTransferTypeXml,
} from '../data/schemas/epp-core';
// Import and re-export namespace constants for convenience
import {
  EPP_NS,
  DOMAIN_NS,
  CONTACT_NS,
  HOST_NS,
  FEE_NS,
  SECDNS_NS,
  RGP_NS,
  IDN_NS,
  LAUNCH_NS,
} from './codec';
export {
  EPP_NS,
  DOMAIN_NS,
  CONTACT_NS,
  HOST_NS,
  // extensions
  FEE_NS,
  SECDNS_NS,
  RGP_NS,
  IDN_NS,
  LAUNCH_NS,
};

// Type aliases for cleaner API
export type LoginPayload = z.infer<typeof EppLoginTypeXml>;
export type PollPayload = z.infer<typeof EppPollTypeXml>;
export type DomainCheckPayload = z.infer<typeof DomainMNameTypeXml>;
export type DomainInfoPayload = z.infer<typeof DomainInfoTypeXml>;
export type DomainCreatePayload = z.infer<typeof DomainCreateTypeXml>;
export type DomainRenewPayload = z.infer<typeof DomainRenewTypeXml>;
export type DomainTransferPayload = z.infer<typeof DomainTransferTypeXml>;
export type DomainUpdatePayload = z.infer<typeof DomainUpdateTypeXml>;
export type ContactCheckPayload = z.infer<typeof ContactCheckTypeXml>;
export type ContactInfoPayload = z.infer<typeof ContactInfoXml>;
export type ContactCreatePayload = z.infer<typeof ContactCreateTypeXml>;
export type ContactUpdatePayload = z.infer<typeof ContactUpdateTypeXml>;
export type HostCheckPayload = z.infer<typeof HostCheckTypeXml>;
export type HostInfoPayload = z.infer<typeof HostInfoXml>;
export type HostCreatePayload = z.infer<typeof HostCreateTypeXml>;
export type HostUpdatePayload = z.infer<typeof HostUpdateTypeXml>;

// Command type for the full envelope
export type EppCommand = z.infer<typeof EppCommandTypeXml>;

export interface CommandOptions {
  clTRID?: string;
  extension?: Record<string, unknown>;
}

// Helper to add base fields
function withBaseFields(
  command: Record<string, unknown>,
  opts?: CommandOptions,
): Record<string, unknown> {
  const result = { ...command };
  if (opts?.clTRID) {
    result['epp:clTRID'] = opts.clTRID;
  }
  if (opts?.extension) {
    result['epp:extension'] = opts.extension;
  }
  return result;
}

// ============ Login / Logout ============

export interface LoginOptions {
  clID: string;
  pw: string;
  newPW?: string;
  version?: string;
  lang?: string;
  objURIs: string[];
  extURIs?: string[];
}

export function buildLoginCommand(
  login: LoginOptions,
  opts?: CommandOptions,
): EppCommand {
  return withBaseFields(
    {
      'epp:login': {
        'epp:clID': login.clID,
        'epp:pw': login.pw,
        ...(login.newPW ? { 'epp:newPW': login.newPW } : {}),
        'epp:options': {
          'epp:version': login.version ?? '1.0',
          'epp:lang': login.lang ?? 'en',
        },
        'epp:svcs': {
          'epp:objURI': login.objURIs,
          ...(login.extURIs?.length
            ? { 'epp:svcExtension': { 'epp:extURI': login.extURIs } }
            : {}),
        },
      },
    },
    opts,
  ) as EppCommand;
}

export function buildLogoutCommand(opts?: CommandOptions): EppCommand {
  return withBaseFields(
    {
      'epp:logout': '',
    },
    opts,
  ) as EppCommand;
}

// ============ Poll ============

export function buildPollReqCommand(opts?: CommandOptions): EppCommand {
  return withBaseFields(
    {
      'epp:poll': { '@_op': 'req' },
    },
    opts,
  ) as EppCommand;
}

export function buildPollAckCommand(
  msgId: string,
  opts?: CommandOptions,
): EppCommand {
  return withBaseFields(
    {
      'epp:poll': { '@_op': 'ack', '@_msgID': msgId },
    },
    opts,
  ) as EppCommand;
}

// ============ Domain Commands ============

export function buildDomainCheckCommand(
  names: string[],
  opts?: CommandOptions,
): EppCommand {
  return withBaseFields(
    {
      'epp:check': {
        'domain:check': {
          '@_xmlns:domain': DOMAIN_NS,
          'domain:name': names,
        },
      },
    },
    opts,
  ) as EppCommand;
}

export interface DomainInfoOptions {
  name: string;
  hosts?: 'all' | 'del' | 'sub' | 'none';
  authInfo?: string;
}

export function buildDomainInfoCommand(
  info: DomainInfoOptions,
  opts?: CommandOptions,
): EppCommand {
  return withBaseFields(
    {
      'epp:info': {
        'domain:info': {
          '@_xmlns:domain': DOMAIN_NS,
          'domain:name': {
            '@_hosts': info.hosts ?? 'all',
            '#text': info.name,
          },
          ...(info.authInfo
            ? { 'domain:authInfo': { 'domain:pw': info.authInfo } }
            : {}),
        },
      },
    },
    opts,
  ) as EppCommand;
}

export interface DomainCreateOptions {
  name: string;
  period?: { value: number; unit: 'y' | 'm' };
  ns?: string[];
  registrant?: string;
  contacts?: Array<{ type: 'admin' | 'tech' | 'billing'; id: string }>;
  authInfo: string;
}

export function buildDomainCreateCommand(
  create: DomainCreateOptions,
  opts?: CommandOptions,
): EppCommand {
  const domainCreate: DomainCreateTypeXml & { '@_xmlns:domain': string } = {
    '@_xmlns:domain': DOMAIN_NS,
    'domain:name': create.name,
    'domain:authInfo': {
      'domain:pw': {
        '#text': create.authInfo,
      },
    },
  };

  if (create.period) {
    domainCreate['domain:period'] = {
      '@_unit': create.period.unit,
      '#text': create.period.value.toString(),
    };
  }

  if (create.ns?.length) {
    domainCreate['domain:ns'] = {
      'domain:hostObj': create.ns,
    };
  }

  if (create.registrant) {
    domainCreate['domain:registrant'] = create.registrant;
  }

  if (create.contacts?.length) {
    domainCreate['domain:contact'] = create.contacts.map((c) => ({
      '@_type': c.type,
      '#text': c.id,
    }));
  }

  return withBaseFields(
    {
      'epp:create': EppCreateCommandTypeXml.parse({
        'domain:create': DomainCreateTypeXml.parse(domainCreate),
      }),
    },
    opts,
  ) as EppCommand;
}

export function buildDomainDeleteCommand(
  name: string,
  opts?: CommandOptions,
): EppCommand {
  return withBaseFields(
    {
      'epp:delete': {
        'domain:delete': {
          '@_xmlns:domain': DOMAIN_NS,
          'domain:name': name,
        },
      },
    },
    opts,
  ) as EppCommand;
}

export interface DomainRenewOptions {
  name: string;
  curExpDate: string; // YYYY-MM-DD
  period?: { value: number; unit: 'y' | 'm' };
}

export function buildDomainRenewCommand(
  renew: DomainRenewOptions,
  opts?: CommandOptions,
): EppCommand {
  const domainRenew: Record<string, unknown> = {
    '@_xmlns:domain': DOMAIN_NS,
    'domain:name': renew.name,
    'domain:curExpDate': renew.curExpDate,
  };

  if (renew.period) {
    domainRenew['domain:period'] = {
      '@_unit': renew.period.unit,
      '#text': renew.period.value.toString(),
    };
  }

  return withBaseFields(
    {
      'epp:renew': { 'domain:renew': domainRenew },
    },
    opts,
  ) as EppCommand;
}

export type TransferOp = 'query' | 'request' | 'approve' | 'cancel' | 'reject';

export interface DomainTransferOptions {
  op: TransferOp;
  name: string;
  authInfo?: string;
  period?: { value: number; unit: 'y' | 'm' };
}

export function buildDomainTransferCommand(
  transfer: DomainTransferOptions,
  opts?: CommandOptions,
): EppCommand {
  const domainTransfer: DomainTransferTypeXml & { '@_xmlns:domain': string } = {
    '@_xmlns:domain': DOMAIN_NS,
    'domain:name': transfer.name,
  };

  if (transfer.period) {
    domainTransfer['domain:period'] = {
      '@_unit': transfer.period.unit,
      '#text': transfer.period.value?.toString(),
    };
  }

  if (transfer.authInfo) {
    domainTransfer['domain:authInfo'] = {
      'domain:pw': {
        '#text': transfer.authInfo,
      },
    };
  }

  const transferCommand = {
    'epp:transfer': EppTransferTypeXml.parse({
      '@_op': transfer.op,
      'domain:transfer': DomainTransferTypeXml.parse(domainTransfer),
    }),
  };

  return withBaseFields(transferCommand, opts) as EppCommand;
}

// ============ Contact Commands ============

export function buildContactCheckCommand(
  ids: string[],
  opts?: CommandOptions,
): EppCommand {
  return withBaseFields(
    {
      'epp:check': {
        'contact:check': {
          '@_xmlns:contact': CONTACT_NS,
          'contact:id': ids,
        },
      },
    },
    opts,
  ) as EppCommand;
}

export interface ContactInfoOptions {
  id: string;
  authInfo?: string;
}

export function buildContactInfoCommand(
  info: ContactInfoOptions,
  opts?: CommandOptions,
): EppCommand {
  return withBaseFields(
    {
      'epp:info': {
        'contact:info': {
          '@_xmlns:contact': CONTACT_NS,
          'contact:id': info.id,
          ...(info.authInfo
            ? { 'contact:authInfo': { 'contact:pw': info.authInfo } }
            : {}),
        },
      },
    },
    opts,
  ) as EppCommand;
}

// ============ Host Commands ============

export function buildHostCheckCommand(
  names: string[],
  opts?: CommandOptions,
): EppCommand {
  return withBaseFields(
    {
      'epp:check': {
        'host:check': {
          '@_xmlns:host': HOST_NS,
          'host:name': names,
        },
      },
    },
    opts,
  ) as EppCommand;
}

export function buildHostInfoCommand(
  name: string,
  opts?: CommandOptions,
): EppCommand {
  return withBaseFields(
    {
      'epp:info': {
        'host:info': {
          '@_xmlns:host': HOST_NS,
          'host:name': name,
        },
      },
    },
    opts,
  ) as EppCommand;
}

// ============ Full EPP Envelope Builder ============

/**
 * Wrap a command in a full EPP envelope with namespace declarations.
 * This creates the structure ready for XML encoding.
 */
export function buildEppEnvelope<E extends EppCommand>(command: E) {
  return {
    'epp:epp': {
      '@_xmlns': EPP_NS,
      '@_xmlns:epp': EPP_NS,
      '@_xmlns:domain': DOMAIN_NS,
      '@_xmlns:contact': CONTACT_NS,
      '@_xmlns:host': HOST_NS,

      '@_xmlns:secDNS': SECDNS_NS,
      '@_xmlns:fee': FEE_NS,
      '@_xmlns:rgp': RGP_NS,
      '@_xmlns:idn': IDN_NS,
      '@_xmlns:launch': LAUNCH_NS,

      'epp:command': command,
    },
  } as const;
}

/**
 * Build a complete hello envelope.
 */
export function buildHelloEnvelope(): Record<string, unknown> {
  return {
    'epp:epp': {
      '@_xmlns': EPP_NS,
      '@_xmlns:epp': EPP_NS,
      'epp:hello': '',
    },
  };
}
