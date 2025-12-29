/**
 * EPP Domain Update command builder.
 *
 * The domain update command is used to modify attributes of
 * an existing domain object.
 *
 * @see RFC 5731 Section 3.2.5
 */

import type { z } from 'zod';
import type { EppCommandTypeXml } from '../../../data/schemas/epp-core';
import { DomainUpdateTypeXml } from '../../../data/schemas/epp-core';
import { EppUpdateCommandTypeXml } from '../../../data/schemas/epp-core/types/epp.updateCommandType.layer1';
import { withEppBaseFields, type CommandOptions } from '../helpers/base-fields';
import { DOMAIN_NS } from '../helpers/namespaces';
import type { DomainUpdateOptions } from './types';

/**
 * Builds an EPP domain update command.
 *
 * @example
 * // Add a nameserver
 * const updateCmd = buildDomainUpdateCommand({
 *   name: "example.com",
 *   add: { ns: ["ns3.example.com"] },
 * });
 *
 * @example
 * // Add transfer lock status
 * const lockCmd = buildDomainUpdateCommand({
 *   name: "example.com",
 *   add: {
 *     statuses: [{ status: "clientTransferProhibited" }],
 *   },
 * });
 *
 * @param update - Domain update options
 * @param opts - Optional command options (clTRID, extension)
 * @returns EPP command object ready for XML encoding
 */
export function buildDomainUpdateCommand(
  update: DomainUpdateOptions,
  opts?: CommandOptions,
): EppCommandTypeXml {
  const domainUpdate: z.infer<typeof DomainUpdateTypeXml> & {
    '@_xmlns:domain': string;
  } = {
    '@_xmlns:domain': DOMAIN_NS,
    'domain:name': {
      '#text': update.name,
    },
  };

  if (update.add) {
    domainUpdate['domain:add'] = {};
    if (update.add.ns?.length) {
      domainUpdate['domain:add']['domain:ns'] = {
        'domain:hostObj': update.add.ns.map((ns) => ({
          '#text': ns,
        })),
      };
    }
    if (update.add.contacts?.length) {
      domainUpdate['domain:add']['domain:contact'] = update.add.contacts.map(
        (c) => ({
          '@_type': c.type,
          '#text': c.id,
        }),
      );
    }
    if (update.add.statuses?.length) {
      domainUpdate['domain:add']['domain:status'] = update.add.statuses.map(
        (s) => ({
          '@_s': s.status,
          '@_lang': s.lang ?? 'en',
          '#text': s.text ?? '',
        }),
      );
    }
  }

  if (update.rem) {
    domainUpdate['domain:rem'] = {};
    if (update.rem.ns?.length) {
      domainUpdate['domain:rem']['domain:ns'] = {
        'domain:hostObj': update.rem.ns.map((ns) => ({
          '#text': ns,
        })),
      };
    }
    if (update.rem.contacts?.length) {
      domainUpdate['domain:rem']['domain:contact'] = update.rem.contacts.map(
        (c) => ({
          '@_type': c.type,
          '#text': c.id,
        }),
      );
    }
    if (update.rem.statuses?.length) {
      domainUpdate['domain:rem']['domain:status'] = update.rem.statuses.map(
        (s) => ({
          '@_s': s.status,
          '@_lang': s.lang ?? 'en',
          '#text': s.text ?? '',
        }),
      );
    }
  }

  if (update.chg) {
    domainUpdate['domain:chg'] = {};
    if (update.chg.registrant) {
      domainUpdate['domain:chg']['domain:registrant'] = {
        '#text': update.chg.registrant,
      };
    }
    if (update.chg.authInfo) {
      domainUpdate['domain:chg']['domain:authInfo'] = {
        'domain:pw': {
          '#text': update.chg.authInfo,
        },
      };
    }
  }

  return withEppBaseFields(
    {
      'epp:update': EppUpdateCommandTypeXml.parse({
        'domain:update': DomainUpdateTypeXml.parse(domainUpdate),
      }),
    },
    opts,
  ) as EppCommandTypeXml;
}

export function buildAddNsCommand(domainName: string, ns: string[]) {
  return buildDomainUpdateCommand({
    name: domainName,
    add: {
      ns: ns.map(cleanNameserver),
    },
  });
}
export function buildRemNsCommand(domainName: string, ns: string[]) {
  return buildDomainUpdateCommand({
    name: domainName,
    rem: {
      ns: ns.map(cleanNameserver),
    },
  });
}

function cleanNameserver(ns: string) {
  return ns.toLowerCase().trim().replace(/\.?$/g, '');
}
export function buildChangeNsCommand(
  domainName: string,
  _currentNs: string[],
  _ns: string[],
) {
  const currentNs = _currentNs.map(cleanNameserver);
  const ns = _ns.map(cleanNameserver);
  const nsAdd = ns.filter((n) => !currentNs.includes(n));
  const nsRem = currentNs.filter((n) => !ns.includes(n));
  return buildDomainUpdateCommand({
    name: domainName,
    rem: {
      ns: nsRem,
    },
    add: {
      ns: nsAdd,
    },
  });
}

export function buildToggleLockTransferCommand(
  domainName: string,
  state: 'lock' | 'unlock',
) {
  const statuses = [
    { status: 'clientTransferProhibited' as const },
    { status: 'clientDeleteProhibited' as const },
  ];
  return buildDomainUpdateCommand({
    name: domainName,
    // don't use string named properties for type safety
    add:
      state === 'lock'
        ? {
            statuses,
          }
        : undefined,
    rem:
      state === 'unlock'
        ? {
            statuses,
          }
        : undefined,
  });
}
