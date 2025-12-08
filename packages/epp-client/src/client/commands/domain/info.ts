/**
 * EPP Domain Info command builder.
 *
 * The domain info command is used to retrieve information
 * associated with a domain object.
 *
 * @see RFC 5731 Section 3.1.2
 */

import type { EppCommandTypeXml } from '../../../data/schemas/epp-core';
import { xmlTextNode, withNamespaces } from '../helpers/xml-utils';
import { withEppBaseFields, type CommandOptions } from '../helpers/base-fields';
import { DOMAIN_NS } from '../helpers/namespaces';
import type { DomainInfoOptions } from './types';

/**
 * Builds an EPP domain info command.
 *
 * @example
 * const infoCmd = buildDomainInfoCommand({ name: "example.com" });
 *
 * @example
 * // With auth info for non-sponsored domain
 * const infoCmd = buildDomainInfoCommand({
 *   name: "example.com",
 *   authInfo: "secret123",
 *   hosts: "all",
 * });
 *
 * @param info - Domain info options
 * @param opts - Optional command options (clTRID, extension)
 * @returns EPP command object ready for XML encoding
 */
export function buildDomainInfoCommand(
  info: DomainInfoOptions,
  opts?: CommandOptions,
): EppCommandTypeXml {
  return withEppBaseFields(
    {
      'epp:info': {
        'domain:info': withNamespaces(
          {
            'domain:name': {
              '@_hosts': info.hosts ?? 'all',
              '#text': info.name,
            },
            ...(info.authInfo
              ? {
                  'domain:authInfo': {
                    'domain:pw': xmlTextNode(info.authInfo),
                  },
                }
              : {}),
          },
          { domain: DOMAIN_NS },
        ),
      },
    },
    opts,
  ) as EppCommandTypeXml;
}
