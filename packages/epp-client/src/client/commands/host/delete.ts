/**
 * EPP Host Delete command builder.
 *
 * The host delete command is used to remove a host object from the registry.
 * A host can only be deleted if it is not associated with any domain objects.
 *
 * @see RFC 5732 Section 3.2.2
 */

import type { EppCommandTypeXml } from '../../../data/schemas/epp-core';
import { withEppBaseFields, type CommandOptions } from '../helpers/base-fields';
import { HOST_NS } from '../helpers/namespaces';
import { withNamespaces, xmlTextNode } from '../helpers/xml-utils';

/**
 * Builds an EPP host delete command.
 *
 * @example
 * const deleteCmd = buildHostDeleteCommand("ns1.example.com");
 *
 * @param name - Host name to delete
 * @param opts - Optional command options (clTRID, extension)
 * @returns EPP command object ready for XML encoding
 */
export function buildHostDeleteCommand(
  name: string,
  opts?: CommandOptions,
): EppCommandTypeXml {
  return withEppBaseFields(
    {
      'epp:delete': {
        'host:delete': withNamespaces(
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
