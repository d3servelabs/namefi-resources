/**
 * EPP Domain Create command builder.
 *
 * The domain create command is used to create a new domain object.
 *
 * @see RFC 5731 Section 3.2.1
 */

import type { z } from 'zod';
import type { EppCommandTypeXml } from '../../../data/schemas/epp-core';
import {
  DomainCreateTypeXml,
  EppCreateCommandTypeXml,
} from '../../../data/schemas/epp-core';
import { withEppBaseFields, type CommandOptions } from '../helpers/base-fields';
import { DOMAIN_NS } from '../helpers/namespaces';
import type { DomainCreateOptions } from './types';

/**
 * Builds an EPP domain create command.
 *
 * @example
 * const createCmd = buildDomainCreateCommand({
 *   name: "example.com",
 *   period: { value: 2, unit: "y" },
 *   ns: ["ns1.example.com", "ns2.example.com"],
 *   registrant: "contact123",
 *   contacts: [
 *     { type: "admin", id: "admin123" },
 *     { type: "tech", id: "tech123" },
 *   ],
 *   authInfo: "secret123",
 * });
 *
 * @param create - Domain create options
 * @param opts - Optional command options (clTRID, extension)
 * @returns EPP command object ready for XML encoding
 */
export function buildDomainCreateCommand(
  create: DomainCreateOptions,
  opts?: CommandOptions,
): EppCommandTypeXml {
  const domainCreate: z.infer<typeof DomainCreateTypeXml> & {
    '@_xmlns:domain': string;
  } = {
    '@_xmlns:domain': DOMAIN_NS,
    'domain:name': {
      '#text': create.name,
    },
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
      'domain:hostObj': create.ns.map((ns) => ({
        '#text': ns,
      })),
    };
  }

  if (create.registrant) {
    domainCreate['domain:registrant'] = {
      '#text': create.registrant,
    };
  }

  if (create.contacts?.length) {
    domainCreate['domain:contact'] = create.contacts.map((c) => ({
      '@_type': c.type,
      '#text': c.id,
    }));
  }

  return withEppBaseFields(
    {
      'epp:create': EppCreateCommandTypeXml.parse({
        'domain:create': DomainCreateTypeXml.parse(domainCreate),
      }),
    },
    opts,
  ) as EppCommandTypeXml;
}
