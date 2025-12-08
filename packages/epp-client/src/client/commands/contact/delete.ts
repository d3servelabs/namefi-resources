/**
 * EPP Contact Delete command builder.
 *
 * The contact delete command is used to remove a contact object from the registry.
 * A contact can only be deleted if it is not associated with any domain objects.
 *
 * @see RFC 5733 Section 3.2.2
 */

import type { EppCommandTypeXml } from '../../../data/schemas/epp-core';
import { withEppBaseFields, type CommandOptions } from '../helpers/base-fields';
import { CONTACT_NS } from '../helpers/namespaces';
import { withNamespaces, xmlTextNode } from '../helpers/xml-utils';

/**
 * Builds an EPP contact delete command.
 *
 * @example
 * const deleteCmd = buildContactDeleteCommand("contact123");
 *
 * @param id - Contact ID to delete
 * @param opts - Optional command options (clTRID, extension)
 * @returns EPP command object ready for XML encoding
 */
export function buildContactDeleteCommand(
  id: string,
  opts?: CommandOptions,
): EppCommandTypeXml {
  return withEppBaseFields(
    {
      'epp:delete': {
        'contact:delete': withNamespaces(
          {
            'contact:id': xmlTextNode(id),
          },
          { contact: CONTACT_NS },
        ),
      },
    },
    opts,
  ) as EppCommandTypeXml;
}
