/**
 * EPP Contact Info command builder.
 *
 * The contact info command is used to retrieve information
 * associated with a contact object.
 *
 * @see RFC 5733 Section 3.1.2
 */

import type { EppCommandTypeXml } from '../../../data/schemas/epp-core';
import { xmlTextNode, withNamespaces } from '../helpers/xml-utils';
import { withEppBaseFields, type CommandOptions } from '../helpers/base-fields';
import { CONTACT_NS } from '../helpers/namespaces';
import type { ContactInfoOptions } from './types';

/**
 * Builds an EPP contact info command.
 *
 * @example
 * const infoCmd = buildContactInfoCommand({ id: "contact123" });
 *
 * @param info - Contact info options
 * @param opts - Optional command options (clTRID, extension)
 * @returns EPP command object ready for XML encoding
 */
export function buildContactInfoCommand(
  info: ContactInfoOptions,
  opts?: CommandOptions,
): EppCommandTypeXml {
  return withEppBaseFields(
    {
      'epp:info': {
        'contact:info': withNamespaces(
          {
            'contact:id': xmlTextNode(info.id),
            ...(info.authInfo
              ? {
                  'contact:authInfo': {
                    'contact:pw': xmlTextNode(info.authInfo),
                  },
                }
              : {}),
          },
          { contact: CONTACT_NS },
        ),
      },
    },
    opts,
  ) as EppCommandTypeXml;
}
