/**
 * EPP Logout command builder.
 *
 * The logout command ends an EPP session.
 *
 * @see RFC 5730 Section 2.9.1.2
 */

import type { EppCommandTypeXml } from '../../../data/schemas/epp-core';
import { xmlTextNode } from '../helpers/xml-utils';
import { withEppBaseFields, type CommandOptions } from '../helpers/base-fields';

/**
 * Builds an EPP logout command.
 *
 * @example
 * const logoutCmd = buildLogoutCommand();
 *
 * @param opts - Optional command options (clTRID, extension)
 * @returns EPP command object ready for XML encoding
 */
export function buildLogoutCommand(opts?: CommandOptions): EppCommandTypeXml {
  return withEppBaseFields(
    {
      'epp:logout': xmlTextNode(''),
    },
    opts,
  ) as EppCommandTypeXml;
}
