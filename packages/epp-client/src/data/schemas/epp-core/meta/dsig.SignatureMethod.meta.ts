/**
 * Static XmlMeta for SignatureMethod
 * Generated from: http://www.w3.org/2000/09/xmldsig#
 *
 * @generated - Do not edit manually
 */

import type { XmlMeta } from './types';

export const DsigSignatureMethodMeta: XmlMeta = {
  strategyId: 'fxp-v1',
  root: {
    qname: {
      namespace: 'http://www.w3.org/2000/09/xmldsig#',
      localName: 'SignatureMethod',
    },
    fields: {
      Algorithm: {
        kind: 'attribute',
        xmlName: 'Algorithm',
        cardinality: 'one',
      },
      'dsig:HMACOutputLength': {
        kind: 'element',
        xmlName: 'dsig:HMACOutputLength',
        namespace: 'http://www.w3.org/2000/09/xmldsig#',
        cardinality: 'one',
      },
    },
  },
};
