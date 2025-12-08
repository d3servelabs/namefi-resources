/**
 * Static XmlMeta for RSAKeyValue
 * Generated from: http://www.w3.org/2000/09/xmldsig#
 *
 * @generated - Do not edit manually
 */

import type { XmlMeta } from './types';

export const DsigRSAKeyValueMeta: XmlMeta = {
  strategyId: 'fxp-v1',
  root: {
    qname: {
      namespace: 'http://www.w3.org/2000/09/xmldsig#',
      localName: 'RSAKeyValue',
    },
    fields: {
      'dsig:Modulus': {
        kind: 'element',
        xmlName: 'dsig:Modulus',
        namespace: 'http://www.w3.org/2000/09/xmldsig#',
        cardinality: 'one',
      },
      'dsig:Exponent': {
        kind: 'element',
        xmlName: 'dsig:Exponent',
        namespace: 'http://www.w3.org/2000/09/xmldsig#',
        cardinality: 'one',
      },
    },
  },
};
