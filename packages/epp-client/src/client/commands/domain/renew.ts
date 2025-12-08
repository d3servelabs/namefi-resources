/**
 * EPP Domain Renew command builder.
 *
 * The domain renew command is used to extend the validity period
 * of an existing domain object.
 *
 * @see RFC 5731 Section 3.2.3
 */

import type { z } from 'zod';
import type { EppCommandTypeXml } from '../../../data/schemas/epp-core';
import { DomainRenewTypeXml } from '../../../data/schemas/epp-core';
import { EppRenewCommandTypeXml } from '../../../data/schemas/epp-core/types/epp.renewCommandType.layer1';
import { withEppBaseFields, type CommandOptions } from '../helpers/base-fields';
import { DOMAIN_NS } from '../helpers/namespaces';
import type { DomainRenewOptions } from './types';

/**
 * Builds an EPP domain renew command.
 *
 * @example
 * const renewCmd = buildDomainRenewCommand({
 *   name: "example.com",
 *   curExpDate: "2024-12-31",
 *   period: { value: 1, unit: "y" },
 * });
 *
 * @param renew - Domain renew options
 * @param opts - Optional command options (clTRID, extension)
 * @returns EPP command object ready for XML encoding
 */
export function buildDomainRenewCommand(
  renew: DomainRenewOptions,
  opts?: CommandOptions,
): EppCommandTypeXml {
  const domainRenew: z.infer<typeof DomainRenewTypeXml> & {
    '@_xmlns:domain': string;
  } = {
    '@_xmlns:domain': DOMAIN_NS,
    'domain:name': {
      '#text': renew.name,
    },
    'domain:curExpDate': {
      '#text': renew.curExpDate,
    },
  };

  if (renew.period) {
    domainRenew['domain:period'] = {
      '@_unit': renew.period.unit,
      '#text': renew.period.value.toString(),
    };
  }

  return withEppBaseFields(
    {
      'epp:renew': EppRenewCommandTypeXml.parse({
        'domain:renew': DomainRenewTypeXml.parse(domainRenew),
      }),
    },
    opts,
  ) as EppCommandTypeXml;
}
