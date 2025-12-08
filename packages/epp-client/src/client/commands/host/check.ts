/**
 * EPP Host Check command builder.
 *
 * The host check command is used to determine if a host object can be provisioned.
 *
 * @see RFC 5732 Section 3.1.1
 */

import type { EppCommandTypeXml } from '../../../data/schemas/epp-core';
import { withEppBaseFields, type CommandOptions } from '../helpers/base-fields';
import { HOST_NS } from '../helpers/namespaces';
import { withNamespaces, xmlTextNode } from '../helpers/xml-utils';

/**
 * Builds an EPP host check command.
 *
 * @example
 * const checkCmd = buildHostCheckCommand(["ns1.example.com", "ns2.example.com"]);
 *
 * @param names - Array of host names to check
 * @param opts - Optional command options (clTRID, extension)
 * @returns EPP command object ready for XML encoding
 */
export function buildHostCheckCommand(
  names: string[],
  opts?: CommandOptions,
): EppCommandTypeXml {
  return withEppBaseFields(
    {
      'epp:check': {
        'host:check': withNamespaces(
          {
            'host:name': xmlTextNode(names),
          },
          { host: HOST_NS },
        ),
      },
    },
    opts,
  ) as EppCommandTypeXml;
}
