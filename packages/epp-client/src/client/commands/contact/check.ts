/**
 * EPP Contact Check command builder.
 *
 * The contact check command is used to determine if a contact ID
 * can be provisioned within a repository.
 *
 * @see RFC 5733 Section 3.1.1
 */

import type { EppCommandTypeXml } from '../../../data/schemas/epp-core';
import { xmlTextNode, withNamespaces } from '../helpers/xml-utils';
import { withEppBaseFields, type CommandOptions } from '../helpers/base-fields';
import { CONTACT_NS } from '../helpers/namespaces';

/**
 * Builds an EPP contact check command.
 *
 * @example
 * const checkCmd = buildContactCheckCommand(["contact1", "contact2"]);
 *
 * @param ids - Array of contact IDs to check
 * @param opts - Optional command options (clTRID, extension)
 * @returns EPP command object ready for XML encoding
 */
export function buildContactCheckCommand(
  ids: string[],
  opts?: CommandOptions,
): EppCommandTypeXml {
  return withEppBaseFields(
    {
      'epp:check': {
        'contact:check': withNamespaces(
          {
            'contact:id': xmlTextNode(ids),
          },
          { contact: CONTACT_NS },
        ),
      },
    },
    opts,
  ) as EppCommandTypeXml;
}
