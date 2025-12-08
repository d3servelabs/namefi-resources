/**
 * EPP Contact Update command builder.
 *
 * The contact update command is used to modify attributes of an existing contact object.
 * It supports adding/removing statuses and changing contact information.
 *
 * @see RFC 5733 Section 3.2.3
 */

import type { z } from 'zod';
import type { EppCommandTypeXml } from '../../../data/schemas/epp-core';
import {
  ContactUpdateTypeXml,
  EppUpdateCommandTypeXml,
} from '../../../data/schemas/epp-core';
import { withEppBaseFields, type CommandOptions } from '../helpers/base-fields';
import { CONTACT_NS } from '../helpers/namespaces';
import type { ContactUpdateOptions } from './types';

/**
 * Builds an EPP contact update command.
 *
 * @example
 * const updateCmd = buildContactUpdateCommand({
 *   id: "contact123",
 *   chg: {
 *     email: "newemail@example.com",
 *     voice: { number: "+1.5559876543" },
 *   },
 * });
 *
 * @example
 * // Add a status
 * const addStatusCmd = buildContactUpdateCommand({
 *   id: "contact123",
 *   add: {
 *     statuses: [{ status: "clientDeleteProhibited" }],
 *   },
 * });
 *
 * @param update - Contact update options
 * @param opts - Optional command options (clTRID, extension)
 * @returns EPP command object ready for XML encoding
 */
export function buildContactUpdateCommand(
  update: ContactUpdateOptions,
  opts?: CommandOptions,
): EppCommandTypeXml {
  const contactUpdate: z.infer<typeof ContactUpdateTypeXml> & {
    '@_xmlns:contact': string;
  } = {
    '@_xmlns:contact': CONTACT_NS,
    'contact:id': {
      '#text': update.id,
    },
  };

  if (update.add?.statuses?.length) {
    contactUpdate['contact:add'] = {
      'contact:status': update.add.statuses.map((s) => ({
        '@_s': s.status,
        '@_lang': s.lang ?? 'en',
        '#text': s.text ?? '',
      })),
    };
  }

  if (update.rem?.statuses?.length) {
    contactUpdate['contact:rem'] = {
      'contact:status': update.rem.statuses.map((s) => ({
        '@_s': s.status,
        '@_lang': s.lang ?? 'en',
        '#text': s.text ?? '',
      })),
    };
  }

  if (update.chg) {
    contactUpdate['contact:chg'] = {};

    if (update.chg.postalInfo?.length) {
      contactUpdate['contact:chg']['contact:postalInfo'] =
        update.chg.postalInfo.map((pi) => ({
          '@_type': pi.type,
          'contact:name': { '#text': pi.name },
          ...(pi.org ? { 'contact:org': { '#text': pi.org } } : {}),
          'contact:addr': {
            ...(pi.addr.street?.length
              ? {
                  'contact:street': pi.addr.street.map((s) => ({ '#text': s })),
                }
              : {}),
            'contact:city': { '#text': pi.addr.city },
            ...(pi.addr.sp ? { 'contact:sp': { '#text': pi.addr.sp } } : {}),
            ...(pi.addr.pc ? { 'contact:pc': { '#text': pi.addr.pc } } : {}),
            'contact:cc': { '#text': pi.addr.cc },
          },
        }));
    }

    if (update.chg.voice) {
      contactUpdate['contact:chg']['contact:voice'] = {
        '#text': update.chg.voice.number,
        ...(update.chg.voice.ext ? { '@_x': update.chg.voice.ext } : {}),
      };
    }

    if (update.chg.fax) {
      contactUpdate['contact:chg']['contact:fax'] = {
        '#text': update.chg.fax.number,
        ...(update.chg.fax.ext ? { '@_x': update.chg.fax.ext } : {}),
      };
    }

    if (update.chg.email) {
      contactUpdate['contact:chg']['contact:email'] = {
        '#text': update.chg.email,
      };
    }

    if (update.chg.authInfo) {
      contactUpdate['contact:chg']['contact:authInfo'] = {
        'contact:pw': {
          '#text': update.chg.authInfo,
        },
      };
    }
  }

  return withEppBaseFields(
    {
      'epp:update': EppUpdateCommandTypeXml.parse({
        'contact:update': ContactUpdateTypeXml.parse(contactUpdate),
      }),
    },
    opts,
  ) as EppCommandTypeXml;
}
