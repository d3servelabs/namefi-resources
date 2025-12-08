/**
 * EPP Login command builder.
 *
 * The login command establishes a session with an EPP server.
 * It authenticates the client and specifies which object types
 * and extensions the client wants to use during the session.
 *
 * @see RFC 5730 Section 2.9.1.1
 */

import type { EppCommandTypeXml } from '../../../data/schemas/epp-core';
import { xmlTextNode } from '../helpers/xml-utils';
import { withEppBaseFields, type CommandOptions } from '../helpers/base-fields';

/**
 * Options for the EPP login command.
 */
export interface LoginOptions {
  /** Client identifier (username) */
  clID: string;

  /** Client password */
  pw: string;

  /** New password to set (optional, for password change) */
  newPW?: string;

  /** Protocol version (default: "1.0") */
  version?: string;

  /** Language for human-readable messages (default: "en") */
  lang?: string;

  /** Object namespace URIs the client wants to use */
  objURIs: string[];

  /** Extension namespace URIs the client wants to use */
  extURIs?: string[];
}

/**
 * Builds an EPP login command.
 *
 * @example
 * const loginCmd = buildLoginCommand({
 *   clID: "registrar123",
 *   pw: "secret",
 *   objURIs: [DOMAIN_NS, CONTACT_NS, HOST_NS],
 *   extURIs: [SECDNS_NS, FEE_NS],
 * });
 *
 * @param login - Login options
 * @param opts - Optional command options (clTRID, extension)
 * @returns EPP command object ready for XML encoding
 */
export function buildLoginCommand(
  login: LoginOptions,
  opts?: CommandOptions,
): EppCommandTypeXml {
  return withEppBaseFields(
    {
      'epp:login': {
        'epp:clID': xmlTextNode(login.clID),
        'epp:pw': xmlTextNode(login.pw),
        ...(login.newPW ? { 'epp:newPW': xmlTextNode(login.newPW) } : {}),
        'epp:options': {
          'epp:version': { '#text': (login.version ?? '1.0') as '1.0' },
          'epp:lang': xmlTextNode(login.lang ?? 'en'),
        },
        'epp:svcs': {
          'epp:objURI': xmlTextNode(login.objURIs),
          ...(login.extURIs?.length
            ? {
                'epp:svcExtension': {
                  'epp:extURI': xmlTextNode(login.extURIs),
                },
              }
            : {}),
        },
      },
    },
    opts,
  ) as EppCommandTypeXml;
}
