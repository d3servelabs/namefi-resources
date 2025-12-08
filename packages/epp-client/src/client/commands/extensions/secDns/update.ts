import type { EppExtCommandTypeXml } from '../../../../data/schemas/epp-core';
import { xmlTextNode } from '../../helpers/xml-utils';
import type { DnssecKey } from './types';

// ============ DNSSEC Extension Builders ============

/**
 * Build secDNS:update extension for adding DNSSEC DS data.
 */
export function buildSecDnsAddExtension(
  dsData: DnssecKey,
): EppExtCommandTypeXml {
  const { keyTag, algorithm, digestType, digest, keyData } = dsData;
  if (!keyTag || !algorithm || !digestType || !digest) {
    throw new Error('Invalid DNSSEC DS data');
  }
  const _keyData = keyData
    ? {
        'secDNS:flags': xmlTextNode(keyData.flags),
        'secDNS:protocol': xmlTextNode(keyData.protocol),
        'secDNS:alg': xmlTextNode(keyData.algorithm),
        'secDNS:pubKey': xmlTextNode(keyData.publicKey),
      }
    : undefined;

  return {
    'secDNS:update': {
      'secDNS:add': {
        'secDNS:dsData': [
          {
            'secDNS:keyTag': xmlTextNode(keyTag.toString()),
            'secDNS:alg': xmlTextNode(algorithm.toString()),
            'secDNS:digestType': xmlTextNode(digestType.toString()),
            'secDNS:digest': xmlTextNode(digest),
            'secDNS:keyData': _keyData,
          },
        ],
      },
    },
  };
}

/**
 * Build secDNS:update extension for removing DNSSEC DS data.
 */
export function buildSecDnsRemExtension(
  keyTag: number,
  algorithm: number,
  digestType: number,
  digest: string,
): EppExtCommandTypeXml {
  if (!keyTag || !algorithm || !digestType || !digest) {
    throw new Error('Invalid DNSSEC DS data');
  }
  return {
    'secDNS:update': {
      'secDNS:rem': {
        'secDNS:dsData': [
          {
            'secDNS:keyTag': xmlTextNode(keyTag),
            'secDNS:alg': xmlTextNode(algorithm),
            'secDNS:digestType': xmlTextNode(digestType),
            'secDNS:digest': xmlTextNode(digest),
          },
        ],
      },
    },
  };
}

/**
 * Build secDNS:update extension for clearing DNSSEC DS data.
 */
export function buildSecDnsClearExtension(): EppExtCommandTypeXml {
  return {
    'secDNS:update': {
      'secDNS:rem': {
        'secDNS:all': xmlTextNode(true),
      },
    },
  };
}
