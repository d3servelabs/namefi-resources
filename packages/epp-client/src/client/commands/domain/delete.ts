/**
 * EPP Domain Delete command builder.
 *
 * The domain delete command is used to remove a domain object.
 *
 * @see RFC 5731 Section 3.2.2
 */

import type { EppCommandTypeXml } from '../../../data/schemas/epp-core';
import { xmlTextNode, withNamespaces } from '../helpers/xml-utils';
import { withEppBaseFields, type CommandOptions } from '../helpers/base-fields';
import { DOMAIN_NS } from '../helpers/namespaces';

/**
 * Builds an EPP domain delete command.
 *
 * @example
 * const deleteCmd = buildDomainDeleteCommand("example.com");
 *
 * @param name - Domain name to delete
 * @param opts - Optional command options (clTRID, extension)
 * @returns EPP command object ready for XML encoding
 */
export function buildDomainDeleteCommand(
  name: string,
  opts?: CommandOptions,
): EppCommandTypeXml {
  return withEppBaseFields(
    {
      'epp:delete': {
        'domain:delete': withNamespaces(
          {
            'domain:name': xmlTextNode(name),
          },
          { domain: DOMAIN_NS },
        ),
      },
    },
    opts,
  ) as EppCommandTypeXml;
}
