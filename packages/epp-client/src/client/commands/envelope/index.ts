/**
 * EPP Envelope builders.
 *
 * These functions wrap EPP commands in the full EPP envelope structure
 * with all necessary namespace declarations.
 *
 * @see RFC 5730 Section 2.1 - EPP Protocol Layers
 */

import type { EppCommandTypeXml } from '../../../data/schemas/epp-core';
import type { EppEnvelopeXml } from '../../codec';
import {
  EPP_NS,
  DOMAIN_NS,
  CONTACT_NS,
  HOST_NS,
  FEE_NS,
  SECDNS_NS,
  RGP_NS,
  IDN_NS,
  LAUNCH_NS,
} from '../helpers/namespaces';

/**
 * Full EPP envelope type with all namespace declarations.
 */
export type FullEppEnvelope = EppEnvelopeXml & {
  'epp:epp': {
    '@_xmlns': string;
    '@_xmlns:epp': string;
    '@_xmlns:domain': string;
    '@_xmlns:contact': string;
    '@_xmlns:host': string;
    '@_xmlns:secDNS': string;
    '@_xmlns:fee': string;
    '@_xmlns:rgp': string;
    '@_xmlns:idn': string;
    '@_xmlns:launch': string;
  };
};

/**
 * Hello envelope type.
 */
export type HelloEnvelope = EppEnvelopeXml & {
  'epp:epp': {
    '@_xmlns': string;
    '@_xmlns:epp': string;
  };
};

/**
 * Wraps an EPP command in a full envelope with namespace declarations.
 *
 * This creates the complete XML structure ready for encoding, including
 * all standard EPP namespaces and common extensions.
 *
 * @example
 * const loginCmd = buildLoginCommand({ ... });
 * const envelope = buildEppEnvelopeFromCommand(loginCmd);
 * const xml = encode(envelope);
 *
 * @param command - EPP command object
 * @returns Full EPP envelope ready for XML encoding
 */
export function buildEppEnvelopeFromCommand<E extends EppCommandTypeXml>(
  command: E,
): FullEppEnvelope {
  return {
    'epp:epp': {
      '@_xmlns': EPP_NS,
      '@_xmlns:epp': EPP_NS,
      '@_xmlns:domain': DOMAIN_NS,
      '@_xmlns:contact': CONTACT_NS,
      '@_xmlns:host': HOST_NS,

      // Extension namespaces
      '@_xmlns:secDNS': SECDNS_NS,
      '@_xmlns:fee': FEE_NS,
      '@_xmlns:rgp': RGP_NS,
      '@_xmlns:idn': IDN_NS,
      '@_xmlns:launch': LAUNCH_NS,

      'epp:command': command,
    },
  } as FullEppEnvelope;
}

/**
 * Builds an EPP hello envelope.
 *
 * The hello command is used to request a greeting from the server,
 * typically to discover server capabilities.
 *
 * @example
 * const hello = buildHelloEnvelope();
 * const xml = encode(hello);
 *
 * @returns Hello envelope ready for XML encoding
 */
export function buildHelloEnvelope(): HelloEnvelope {
  return {
    'epp:epp': {
      '@_xmlns': EPP_NS,
      '@_xmlns:epp': EPP_NS,
      'epp:hello': {
        '#text': '',
      },
    },
  };
}
