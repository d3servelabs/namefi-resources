/**
 * EPP Host Info command builder.
 *
 * The host info command is used to retrieve information about a host object.
 *
 * @see RFC 5732 Section 3.1.2
 */

import type { EppCommandTypeXml } from '../../../data/schemas/epp-core';
import { withEppBaseFields, type CommandOptions } from '../helpers/base-fields';
import { HOST_NS } from '../helpers/namespaces';
import { withNamespaces, xmlTextNode } from '../helpers/xml-utils';

/**
 * Builds an EPP host info command.
 *
 * @example
 * const infoCmd = buildHostInfoCommand("ns1.example.com");
 *
 * @param name - Host name to query
 * @param opts - Optional command options (clTRID, extension)
 * @returns EPP command object ready for XML encoding
 */
export function buildHostInfoCommand(
  name: string,
  opts?: CommandOptions,
): EppCommandTypeXml {
  return withEppBaseFields(
    {
      'epp:info': {
        'host:info': withNamespaces(
          {
            'host:name': xmlTextNode(name),
          },
          { host: HOST_NS },
        ),
      },
    },
    opts,
  ) as EppCommandTypeXml;
}
