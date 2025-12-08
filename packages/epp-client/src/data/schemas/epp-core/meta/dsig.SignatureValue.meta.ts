/**
 * Static XmlMeta for SignatureValue
 * Generated from: http://www.w3.org/2000/09/xmldsig#
 *
 * @generated - Do not edit manually
 */

import type { XmlMeta } from './types';

export const DsigSignatureValueMeta: XmlMeta = {
  strategyId: 'fxp-v1',
  root: {
    qname: {
      namespace: 'http://www.w3.org/2000/09/xmldsig#',
      localName: 'SignatureValue',
    },
    fields: {
      Id: {
        kind: 'attribute',
        xmlName: 'Id',
        cardinality: 'one',
      },
    },
  },
};
