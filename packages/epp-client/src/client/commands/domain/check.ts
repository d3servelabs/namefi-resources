/**
 * EPP Domain Check command builder.
 *
 * The domain check command is used to determine if a domain name
 * can be provisioned within a repository.
 *
 * @see RFC 5731 Section 3.1.1
 */

import type { z } from 'zod';
import type { EppCommandTypeXml } from '../../../data/schemas/epp-core';
import {
  DomainCheckXml,
  EppCheckCommandTypeXml,
} from '../../../data/schemas/epp-core';
import { withEppBaseFields, type CommandOptions } from '../helpers/base-fields';
import { DOMAIN_NS } from '../helpers/namespaces';

/**
 * Builds an EPP domain check command.
 *
 * @example
 * const checkCmd = buildDomainCheckCommand(["example.com", "example.net"]);
 *
 * @param names - Array of domain names to check
 * @param opts - Optional command options (clTRID, extension)
 * @returns EPP command object ready for XML encoding
 */
export function buildDomainCheckCommand(
  names: string[],
  opts?: CommandOptions,
): EppCommandTypeXml {
  const domainCheck: z.infer<typeof DomainCheckXml> & {
    '@_xmlns:domain': string;
  } = {
    '@_xmlns:domain': DOMAIN_NS,
    'domain:name': names.map((name) => ({ '#text': name })),
  };
  return withEppBaseFields(
    {
      'epp:check': EppCheckCommandTypeXml.parse({
        'domain:check': DomainCheckXml.parse(domainCheck),
      }),
    },
    opts,
  );
}
