/**
 * EPP Contact Create command builder.
 *
 * The contact create command is used to create a new contact object.
 *
 * @see RFC 5733 Section 3.2.1
 */

import type { z } from 'zod';
import type { EppCommandTypeXml } from '../../../data/schemas/epp-core';
import {
  ContactCreateTypeXml,
  EppCreateCommandTypeXml,
} from '../../../data/schemas/epp-core';
import { withEppBaseFields, type CommandOptions } from '../helpers/base-fields';
import { CONTACT_NS } from '../helpers/namespaces';
import type { ContactCreateOptions } from './types';

/**
 * Builds an EPP contact create command.
 *
 * @example
 * const createCmd = buildContactCreateCommand({
 *   id: "contact123",
 *   postalInfo: [{
 *     type: "int",
 *     name: "John Doe",
 *     org: "Example Inc.",
 *     addr: {
 *       street: ["123 Main St"],
 *       city: "Anytown",
 *       sp: "CA",
 *       pc: "12345",
 *       cc: "US",
 *     },
 *   }],
 *   voice: { number: "+1.5551234567" },
 *   email: "john@example.com",
 *   authInfo: "secret123",
 * });
 *
 * @param create - Contact create options
 * @param opts - Optional command options (clTRID, extension)
 * @returns EPP command object ready for XML encoding
 */
export function buildContactCreateCommand(
  create: ContactCreateOptions,
  opts?: CommandOptions,
): EppCommandTypeXml {
  const contactCreate: z.infer<typeof ContactCreateTypeXml> & {
    '@_xmlns:contact': string;
  } = {
    '@_xmlns:contact': CONTACT_NS,
    'contact:id': {
      '#text': create.id,
    },
    'contact:postalInfo': create.postalInfo.map((pi) => ({
      '@_type': pi.type,
      'contact:name': {
        '#text': pi.name,
      },
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
    })),
    'contact:email': {
      '#text': create.email,
    },
    'contact:authInfo': {
      'contact:pw': {
        '#text': create.authInfo,
      },
    },
  };

  if (create.voice) {
    contactCreate['contact:voice'] = {
      '#text': create.voice.number,
      ...(create.voice.ext ? { '@_x': create.voice.ext } : {}),
    };
  }

  if (create.fax) {
    contactCreate['contact:fax'] = {
      '#text': create.fax.number,
      ...(create.fax.ext ? { '@_x': create.fax.ext } : {}),
    };
  }

  return withEppBaseFields(
    {
      'epp:create': EppCreateCommandTypeXml.parse({
        'contact:create': ContactCreateTypeXml.parse(contactCreate),
      }),
    },
    opts,
  ) as EppCommandTypeXml;
}
