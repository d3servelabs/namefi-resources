/**
 * EPP Domain Transfer command builder.
 *
 * The domain transfer command is used to manage domain transfers
 * between registrars.
 *
 * @see RFC 5731 Section 3.2.4
 */

import type { z } from 'zod';
import type { EppCommandTypeXml } from '../../../data/schemas/epp-core';
import {
  DomainTransferTypeXml,
  EppTransferTypeXml,
} from '../../../data/schemas/epp-core';
import { withEppBaseFields, type CommandOptions } from '../helpers/base-fields';
import { DOMAIN_NS } from '../helpers/namespaces';
import type { DomainTransferOptions } from './types';

/**
 * Builds an EPP domain transfer command.
 *
 * @example
 * // Request a transfer
 * const transferCmd = buildDomainTransferCommand({
 *   op: "request",
 *   name: "example.com",
 *   authInfo: "secret123",
 *   period: { value: 1, unit: "y" },
 * });
 *
 * @example
 * // Query transfer status
 * const queryCmd = buildDomainTransferCommand({
 *   op: "query",
 *   name: "example.com",
 * });
 *
 * @param transfer - Domain transfer options
 * @param opts - Optional command options (clTRID, extension)
 * @returns EPP command object ready for XML encoding
 */
export function buildDomainTransferCommand(
  transfer: DomainTransferOptions,
  opts?: CommandOptions,
): EppCommandTypeXml {
  const domainTransfer: z.infer<typeof DomainTransferTypeXml> & {
    '@_xmlns:domain': string;
  } = {
    '@_xmlns:domain': DOMAIN_NS,
    'domain:name': {
      '#text': transfer.name,
    },
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

  return withEppBaseFields(transferCommand, opts) as EppCommandTypeXml;
}
